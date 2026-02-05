
import { sendPasswordReset } from "@/lib/firebase/authService";
import { Ionicons } from "@expo/vector-icons";
import React, { useState, useEffect } from "react";
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface PasswordResetModalProps {
  visible: boolean;
  onClose: () => void;
  email: string;
}

const PasswordResetModal: React.FC<PasswordResetModalProps> = ({ visible, onClose, email: initialEmail }) => {
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState("");

  useEffect(() => {
    if (visible) {
      setEmail(initialEmail);
      setResetMessage("");
    }
  }, [visible, initialEmail]);

  const handlePasswordReset = async () => {
    if (email.trim() === "") {
      Alert.alert("Validation", "Please enter an email address.");
      return;
    }

    setLoading(true);
    try {
      await sendPasswordReset(email);
      setResetMessage("A password reset link has been sent to your email address.");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
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

          <Text style={styles.title}>Reset Password</Text>

          {resetMessage ? (
            <Text style={styles.successMessage}>{resetMessage}</Text>
          ) : (
            <>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handlePasswordReset}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? "Sending..." : "Send Reset Email"}
                </Text>
              </TouchableOpacity>
            </>
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
  actionButton: {
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
  successMessage: {
    fontSize: 18,
    color: "#4CAF50",
    textAlign: "center",
    marginVertical: 20,
  },
});

export default PasswordResetModal;
