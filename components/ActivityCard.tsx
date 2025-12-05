
import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

interface ActivityCardProps {
  activity: {
    user: string;
    avatar: string;
    action: string;
    timestamp: string;
  };
}

const ActivityCard: React.FC<ActivityCardProps> = ({ activity }) => {
  return (
    <View style={styles.card}>
      <Image source={{ uri: activity.avatar }} style={styles.avatar} />
      <View style={styles.content}>
        <Text style={styles.text}>
          <Text style={styles.user}>{activity.user}</Text> {activity.action}
        </Text>
        <Text style={styles.timestamp}>{activity.timestamp}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 15,
  },
  content: {
    flex: 1,
  },
  text: {
    color: '#eee',
    fontSize: 14,
  },
  user: {
    fontWeight: 'bold',
  },
  timestamp: {
    color: '#999',
    fontSize: 12,
    marginTop: 4,
  },
});

export default ActivityCard;
