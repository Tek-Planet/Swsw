
import { listenToGroup, getProfilesForUserIds } from "@/lib/services/groupService";
import { Group } from "@/types/group";
import { UserProfile } from "@/types/user";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AddBudModal from "./AddBudModal";

interface GroupHeaderProps {
  groupId: string;
}

const GroupHeader: React.FC<GroupHeaderProps> = ({ groupId }) => {
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    if (!groupId) return;

    const unsubscribe = listenToGroup(groupId, async (groupData) => {
      setGroup(groupData);
      if (groupData && groupData.members) {
        const profilesMap = await getProfilesForUserIds(groupData.members);
        const profiles = Array.from(profilesMap.values());
        setMembers(profiles);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [groupId]);

  if (loading) {
    return <ActivityIndicator />;
  }

  if (!group) {
    return <Text style={styles.errorText}>Group not found.</Text>;
  }

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: "https://placekitten.com/400/200" }} // Replace with actual banner
        style={styles.banner}
      >
        <View style={styles.bannerContent}>
          <Text style={styles.groupName}>{group.name}</Text>
          <TouchableOpacity
            style={styles.addBudButton}
            onPress={() => setIsModalVisible(true)}
          >
            <Text style={styles.addBudText}>+ Add Bud</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.membersContainer}>
          {members.map((member) => (
            <View key={member.uid} style={styles.memberItem}>
              <Image
                source={{
                  uri: member.photoUrl || `https://i.pravatar.cc/150?u=${member.uid}`,
                }}
                style={styles.memberAvatar}
              />
              <Text style={styles.memberName} numberOfLines={1}>
                {member.displayName || member.username}
              </Text>
            </View>
          ))}
        </View>
      </ImageBackground>

      <AddBudModal
        group={group}
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 20,
  },
  banner: {
    justifyContent: "flex-end",
    padding: 20,
  },
  bannerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 10,
  },
  groupName: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  addBudButton: {
    backgroundColor: "#6c63ff",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  addBudText: {
    color: "white",
    fontWeight: "bold",
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginTop: 20,
  },
  membersContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingTop: 10,
  },
  memberItem: {
    alignItems: "center",
    marginRight: 15,
    marginBottom: 10,
    width: 60,
  },
  memberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#333", // Fallback background
  },
  memberName: {
    color: "white",
    marginTop: 5,
    fontSize: 12,
    textAlign: "center",
  },
});

export default GroupHeader;
