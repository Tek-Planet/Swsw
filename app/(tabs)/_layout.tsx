
import React from 'react';
import { Tabs } from 'expo-router';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CustomTabBar = ({ state, descriptors, navigation }: any) => {
  const iconMap: { [key: string]: [string, string] } = {
    index: ['home', 'home-outline'],
    buds: ['people', 'people-outline'],
    events: ['calendar', 'calendar-outline'],
    profile: ['person', 'person-outline'],
  };

  return (
    <View style={styles.tabBar}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label = options.title || route.name;
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const [focusedIcon, unfocusedIcon] = iconMap[route.name] || ['help-circle', 'help-circle-outline'];
        const iconName = isFocused ? focusedIcon : unfocusedIcon;

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={styles.tabItem}
          >
            <Ionicons name={iconName as any} size={25} color={isFocused ? '#6c63ff' : '#fff'} />
            <Text style={{ color: isFocused ? '#6c63ff' : '#fff', fontSize: 12 }}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const TabLayout = () => {
  return (
    <Tabs tabBar={(props) => <CustomTabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: 'Home', headerShown: false }} />
      <Tabs.Screen name="buds" options={{ title: 'Buds', headerShown: false }} />
      <Tabs.Screen name="events" options={{ title: 'Events', headerShown: false }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', headerShown: false }} />
    </Tabs>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    height: 80,
    backgroundColor: '#1a1a1a',
    borderTopColor: '#333',
    borderTopWidth: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItem: {
    alignItems: 'center',
  },
});

export default TabLayout;
