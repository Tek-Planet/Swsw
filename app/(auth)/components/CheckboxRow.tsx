
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CheckboxRowProps {
  value: boolean;
  onValueChange: (newValue: boolean) => void;
  text: string;
  links?: { [key: string]: () => void };
}

const CheckboxRow: React.FC<CheckboxRowProps> = ({ value, onValueChange, text, links }) => {
  const textParts = text.split(/(\[.*?\]\(.*?\))/g).filter(part => part.length > 0);

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => onValueChange(!value)} style={styles.checkboxContainer}>
        <Ionicons name={value ? 'checkbox' : 'square-outline'} size={24} color={value ? '#FF00A8' : '#888'} />
      </TouchableOpacity>
      <Text style={styles.text}>
        {textParts.map((part, index) => {
          const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
          if (linkMatch) {
            const linkText = linkMatch[1];
            const linkUrl = linkMatch[2];
            const linkAction = links && links[linkText];
            return (
              <Text key={index} style={styles.link} onPress={linkAction}>
                {linkText}
              </Text>
            );
          }
          return part;
        })}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkboxContainer: {
    marginRight: 12,
  },
  text: {
    color: '#fff',
    fontSize: 14,
    flexShrink: 1, 
  },
  link: {
    color: '#FF00A8',
    textDecorationLine: 'underline',
  },
});

export default CheckboxRow;
