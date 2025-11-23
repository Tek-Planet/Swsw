
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {Ionicons as Icon} from '@react-native-vector-icons/ionicons';

import BudsHomePage from '../screens/BudsHomePage';
import EventDetailScreen from '../screens/EventDetailScreen';
import { RootStackParamList } from '../types';

const Tab = createBottomTabNavigator<RootStackParamList>();

const BottomTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
        screenOptions={{
            tabBarStyle:{
                backgroundColor: '#1a1a1a',
                borderTopColor: '#1a1a1a',
            },
            tabBarActiveTintColor: '#6c63ff',
            tabBarInactiveTintColor: 'gray',
            headerShown:false
        }}
    >
      <Tab.Screen
        name="Home"
        component={EventDetailScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Buds"
        component={BudsHomePage}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="people" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;
