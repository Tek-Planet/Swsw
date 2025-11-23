
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import BottomTabNavigator from './navigation/BottomTabNavigator';
import GroupDetailScreen from './screens/GroupDetailScreen';
import EventDetailScreen from './screens/EventDetailScreen';
import { RootStackParamList } from './types';

const Stack = createStackNavigator<RootStackParamList>();

const App: React.FC = () => {
  return (
    <NavigationContainer>
        <Stack.Navigator>
            <Stack.Screen name="Home" component={BottomTabNavigator} options={{ headerShown: false }}/>
            <Stack.Screen name="GroupDetail" component={GroupDetailScreen} options={{ headerShown: false }}/>
            <Stack.Screen name="EventDetail" component={EventDetailScreen} options={{ headerShown: false }}/>
        </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
