import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { Animated, StyleSheet, useWindowDimensions } from 'react-native';

interface AnimatedSlideContainerRef {
  slideIn: () => void;
  slideOut: () => void;
}

const AnimatedSlideContainer = forwardRef<AnimatedSlideContainerRef, { children: React.ReactNode }>(({ children }, ref) => {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const { width } = useWindowDimensions();

  const slideIn = () => {
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const slideOut = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  useImperativeHandle(ref, () => ({
    slideIn,
    slideOut,
  }));

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            {
              translateX: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [width, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
});

export default AnimatedSlideContainer;
