
import React from 'react';
import { Switch, StyleSheet } from 'react-native';

interface ToggleSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ value, onValueChange }) => {
  return (
    <Switch
      trackColor={{ false: '#767577', true: '#81b0ff' }}
      thumbColor={value ? '#f5dd4b' : '#f4f3f4'}
      ios_backgroundColor="#3e3e3e"
      onValueChange={onValueChange}
      value={value}
    />
  );
};

export default ToggleSwitch;
