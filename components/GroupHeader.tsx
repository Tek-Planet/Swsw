import { getGroupById } from "@/lib/services/groupService";
import { listenToUserProfiles } from "@/lib/services/userProfileService";
import { Group } from "@/types/group";
import { UserProfile } from "@/types/user";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AvatarRow from "./AvatarRow";
import AddBudModal from "./AddBudModal"; // Import the modal

interface GroupHeaderProps {
  groupId: string;
}

const GroupHeader: React.FC<GroupHeaderProps> = ({ groupId }) => {
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false); // State for modal visibility

  useEffect(() => {
    const fetchGroup = async () => {
      const groupData = await getGroupById(groupId);
      setGroup(groupData);
      setLoading(false);
    };

    fetchGroup();
  }, [groupId]);

  useEffect(() => {
    if (group) {
      const unsubscribeProfiles = listenToUserProfiles(
        group.members,
        (profiles) => {
          setMembers(profiles);
        }
      );

      return () => unsubscribeProfiles();
    }
  }, [group]);

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
        <Text style={styles.groupName}>{group.name}</Text>
      </ImageBackground>
      <View style={styles.row}>
        <AvatarRow
          members={members
            .filter((m) => m.photoURL)
            .map((m) => ({ id: m.id, photoURL: m.photoURL! }))}
        />
        <TouchableOpacity
          style={styles.addBudButton}
          onPress={() => setIsModalVisible(true)}
        >
          <Text style={styles.addBudText}>+ Add Bud</Text>
        </TouchableOpacity>
      </View>

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
  groupName: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
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
});

export default GroupHeader;
