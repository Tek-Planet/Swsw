
import React from 'react';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import {Ionicons } from '@react-native-vector-icons/ionicons';
import BudsHomePage from '../screens/BudsHomePage';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EventsScreen from '../screens/EventsScreen';
import { RootStackParamList } from '../types';

const Tab = createBottomTabNavigator<RootStackParamList>();

const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
    const iconMap: { [key: string]: [string, string] } = {
      Home: ['home', 'home-outline'],
      Buds: ['people', 'people-outline'],
      Events: ['calendar', 'calendar-outline'],
      Profile: ['person', 'person-outline'],
    };
  
    return (
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;
  
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
                {label as string}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

const BottomTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator tabBar={(props) => <CustomTabBar {...props} />}>
        <Tab.Screen name="Home" component={HomeScreen} options={{ headerShown: false }}/>
        <Tab.Screen name="Buds" component={BudsHomePage} options={{ headerShown: false }}/>
        <Tab.Screen name="Events" component={EventsScreen} options={{ headerShown: false }}/>
        <Tab.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }}/>
    </Tab.Navigator>
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

export default BottomTabNavigator;
