
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';

import HomeScreen from './screens/HomeScreen';
import EventsScreen from './screens/EventsScreen';
import ProfileScreen from './screens/ProfileScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import EventDetailScreen from './screens/EventDetailScreen';
import { RootStackParamList } from './types';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator<RootStackParamList>();

const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const iconMap: { [key: string]: [string, string] } = {
    Home: ['home', 'home-outline'],
    Events: ['calendar', 'calendar-outline'],
    Profile: ['person', 'person-outline'],
    Notifications: ['notifications', 'notifications-outline'],
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
            <Icon name={iconName} size={25} color={isFocused ? '#6c63ff' : '#fff'} />
            <Text style={{ color: isFocused ? '#6c63ff' : '#fff', fontSize: 12 }}>
              {label as string}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const HomeTabs: React.FC = () => {
    return (
        <Tab.Navigator tabBar={(props) => <CustomTabBar {...props} />}>
            <Tab.Screen name="Home" component={HomeScreen} options={{ headerShown: false }}/>
            <Tab.Screen name="Events" component={EventsScreen} options={{ headerShown: false }}/>
            <Tab.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }}/>
            <Tab.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: false }}/>
        </Tab.Navigator>
    );
}


const App: React.FC = () => {
  return (
    <NavigationContainer>
        <Stack.Navigator>
            <Stack.Screen name="Home" component={HomeTabs} options={{ headerShown: false }}/>
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
