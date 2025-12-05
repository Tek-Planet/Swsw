
import React from 'react';
import { View, Text, StyleSheet, Image, FlatList } from 'react-native';

interface Person {
  id: string;
  avatar: string;
}

interface PeopleRowProps {
  people: Person[];
}

const PeopleRow: React.FC<PeopleRowProps> = ({ people }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Who's Going</Text>
      <FlatList
        data={people}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
        )}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  title: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
});

export default PeopleRow;
