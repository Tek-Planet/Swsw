
import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

interface ActivityCardProps {
  activity: {
    id: string;
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
      <View style={styles.activityInfo}>
        <Text style={styles.activityText}>
          <Text style={styles.user}>{activity.user}</Text>
          {` ${activity.action}`}
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
    backgroundColor: '#3a3a3a',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 15,
  },
  activityInfo: {
    flex: 1,
  },
  activityText: {
    color: 'white',
    fontSize: 16,
  },
  user: {
    fontWeight: 'bold',
  },
  timestamp: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 5,
  },
});

export default ActivityCard;
