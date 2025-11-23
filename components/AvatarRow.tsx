
import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

interface AvatarRowProps {
  members: { id: string; avatar: string }[];
}

const AvatarRow: React.FC<AvatarRowProps> = ({ members }) => {
  return (
    <View style={styles.avatarRow}>
      {members.map((member, index) => (
        <Image
          key={member.id}
          source={{ uri: member.avatar }}
          style={[styles.avatar, { zIndex: members.length - index }]}        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft:10
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#1a1a1a',
    marginLeft: -15, // Overlap avatars
  },
});

export default AvatarRow;
