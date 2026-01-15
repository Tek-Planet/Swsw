
import { db as firestore } from "@/lib/firebase/firebaseConfig";
import { Group } from "@/types/group";
import { UserProfile } from "@/types/user";
import { Ionicons } from "@expo/vector-icons";
import {
  arrayUnion,
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface AddBudModalProps {
  group: Group;
  visible: boolean;
  onClose: () => void;
}

const AddBudModal: React.FC<AddBudModalProps> = ({ group, visible, onClose }) => {
  const [email, setEmail] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (email.trim() === "") {
      Alert.alert("Validation", "Please enter an email to search.");
      return;
    }

    setLoading(true);
    try {
      const usersRef = collection(firestore, "users");
      const q = query(usersRef, where("email", "==", email.trim().toLowerCase()));
      const querySnapshot = await getDocs(q);

      const results: UserProfile[] = [];
      querySnapshot.forEach((doc) => {
        const userProfile = { uid: doc.id, ...doc.data() } as UserProfile;
        if (!group.members.includes(userProfile.uid)) {
          results.push(userProfile);
        }
      });

      setSearchResults(results);
      if (results.length === 0) {
        Alert.alert(
          "No Results",
          "No user found with that email, or the user is already a member."
        );
      }
    } catch (error) {
      console.error("Error searching for user:", error);
      Alert.alert(
        "Error",
        "Something went wrong while searching for the user."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddBud = async (user: UserProfile) => {
    try {
      const groupRef = doc(firestore, "groups", group.id);
      await updateDoc(groupRef, {
        members: arrayUnion(user.uid),
      });

      Alert.alert(
        "Success",
        `${user.displayName || user.username} has been added to the group.`
      );
      handleClose(); // Close and reset state
    } catch (error) {
      console.error("Error adding user to group:", error);
      Alert.alert("Error", "Could not add user to the group.");
    }
  };

  const handleClose = () => {
    setEmail("");
    setSearchResults([]);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeIcon} onPress={handleClose}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.title}>Add a Bud</Text>

          <TextInput
            style={styles.input}
            placeholder="Search by email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TouchableOpacity
            style={styles.searchButton}
            onPress={handleSearch}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Searching..." : "Search"}
            </Text>
          </TouchableOpacity>

          {searchResults.length > 0 && (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.uid}
              renderItem={({ item }) => (
                <View style={styles.resultItem}>
                  <Text style={styles.resultName}>
                    {item.displayName || item.username || "N/A"}
                  </Text>
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => handleAddBud(item)}
                  >
                    <Text style={styles.buttonText}>Add</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "#2a2a2a",
    borderRadius: 20,
    padding: 25,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    position: "relative",
  },
  closeIcon: {
    position: "absolute",
    top: 15,
    right: 15,
    zIndex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    width: "100%",
    backgroundColor: "#3a3a3a",
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: "#fff",
    marginBottom: 20,
  },
  searchButton: {
    width: "100%",
    backgroundColor: "#6c63ff",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  resultItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#444",
  },
  resultName: {
    fontSize: 18,
    color: "#fff",
  },
  addButton: {
    backgroundColor: "#5cb85c",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
});

export default AddBudModal;
