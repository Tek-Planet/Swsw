
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
} from 'react-native';
import AvatarRow from './AvatarRow';

interface GroupHeaderProps {
  groupId: string;
}

const GroupHeader: React.FC<GroupHeaderProps> = ({ groupId }) => {
  // Fetch group data based on groupId
  const group = { // Replace with actual data fetching
    name: 'YOLO crew',
    banner: 'https://placekitten.com/400/200',
    members: [
      { id: '1', avatar: 'https://i.pravatar.cc/150?img=1' },
      { id: '2', avatar: 'https://i.pravatar.cc/150?img=2' },
      { id: '3', avatar: 'https://i.pravatar.cc/150?img=3' },
    ],
  };

  return (
    <View style={styles.container}>
        <ImageBackground source={{ uri: group.banner }} style={styles.banner}>
            <Text style={styles.groupName}>{group.name}</Text>
        </ImageBackground>
        <View style={styles.row}>
            <AvatarRow members={group.members} />
            <TouchableOpacity style={styles.addBudButton}>
                <Text style={styles.addBudText}>+ Add Bud</Text>
            </TouchableOpacity>
        </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  banner: {
    height: 150,
    justifyContent: 'flex-end',
    padding: 20,
  },
  groupName: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  row:{
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
  },
  addBudButton: {
    backgroundColor: '#6c63ff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  addBudText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default GroupHeader;
