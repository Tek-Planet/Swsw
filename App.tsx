
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Ionicons as Icon } from "@react-native-vector-icons/ionicons";

import HomeScreen from './screens/HomeScreen';
import EventsScreen from './screens/EventsScreen';
import ProfileScreen from './screens/ProfileScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import EventDetailScreen from './screens/EventDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const CustomTabBar = ({ state, descriptors, navigation }) => {
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
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        let iconName;
        if (route.name === 'Home') {
          iconName = isFocused ? 'home' : 'home-outline';
        } else if (route.name === 'Events') {
          iconName = isFocused ? 'calendar' : 'calendar-outline';
        } else if (route.name === 'Profile') {
          iconName = isFocused ? 'person' : 'person-outline';
        } else if (route.name === 'Notifications') {
          iconName = isFocused ? 'notifications' : 'notifications-outline';
        }

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={styles.tabItem}
          >
            <Icon name={iconName} size={25} color={isFocused ? '#6c63ff' : '#fff'} />
            <Text style={{ color: isFocused ? '#6c63ff' : '#fff', fontSize: 12 }}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const HomeTabs = () => {
    return (
        <Tab.Navigator tabBar={(props) => <CustomTabBar {...props} />}>
            <Tab.Screen name="Home" component={HomeScreen} options={{ headerShown: false }}/>
            <Tab.Screen name="Events" component={EventsScreen} options={{ headerShown: false }}/>
            <Tab.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }}/>
            <Tab.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: false }}/>
        </Tab.Navigator>
    );
}


const App = () => {
  return (
    <NavigationContainer>
        <Stack.Navigator>
            <Stack.Screen name="HomeTabs" component={HomeTabs} options={{ headerShown: false }}/>
            <Stack.Screen name="EventDetail" component={EventDetailScreen} options={{ headerShown: false }}/>
        </Stack.Navigator>
    </NavigationContainer>
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

export default App;
