
import React from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import BottomTabNavigator from './navigation/BottomTabNavigator';
import GroupDetailScreen from './screens/GroupDetailScreen';
import EventDetailScreen from './screens/EventDetailScreen';
import CreateEvent from './screens/CreateEvent';
import { RootStackParamList } from './types';

const Stack = createStackNavigator<RootStackParamList>();

const App: React.FC = () => {
  return (
    <NavigationContainer theme={DarkTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={BottomTabNavigator} />
        <Stack.Screen name="GroupDetail" component={GroupDetailScreen} />
        <Stack.Screen name="EventDetail" component={EventDetailScreen} />
        <Stack.Screen name="CreateEvent" component={CreateEvent} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
