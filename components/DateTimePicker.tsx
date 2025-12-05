
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import type { DateTimePickerEvent } from '@react-native-community/datetimepicker';

interface DateTimePickerProps {
  label: string;
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({ label }) => {
  const [date, setDate] = useState(new Date());
  const [show, setShow] = useState(false);

  const onChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShow(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity onPress={() => setShow(true)} style={styles.input}>
        <Text style={styles.dateText}>{date.toLocaleString()}</Text>
      </TouchableOpacity>
      {show && (
        <RNDateTimePicker
          value={date}
          mode="datetime"
          display="default"
          onChange={onChange}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    color: '#ccc',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 10,
  },
  dateText: {
    color: '#fff',
  },
});

export default DateTimePicker;
