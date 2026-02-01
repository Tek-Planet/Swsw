import { ThemedText } from "@/components/themed-text";
import { useAuth } from "@/lib/context/AuthContext";
import { sendPasswordReset } from "@/lib/firebase/authService";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import AuthButton from "./components/AuthButton";
import AuthScreenContainer from "./components/AuthScreenContainer";
import AuthTextInput from "./components/AuthTextInput";
import SecondaryTextButton from "./components/SecondaryTextButton";

const SignInScreen = () => {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetMessage, setResetMessage] = useState("");

  const handleSignIn = async () => {
    setLoading(true);
    setError("");
    setResetMessage("");
    try {
      await signIn(email, password);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setError("Please enter your email address to reset your password.");
      return;
    }
    setLoading(true);
    setError("");
    setResetMessage("");
    try {
      await sendPasswordReset(email);
      setResetMessage("Password reset email sent! Check your inbox.");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreenContainer>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          It's time to dance.
        </ThemedText>
      </View>

      <View style={styles.formContainer}>
        <AuthTextInput
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoComplete="email"
          autoCapitalize="none"
          error={error}
        />
        <AuthTextInput
          label="Password"
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          error={error}
        />
        <View style={{ alignItems: "flex-end" }}>
          <SecondaryTextButton
            text="Forgot password?"
            onPress={handlePasswordReset}
          />
        </View>

        {resetMessage ? (
          <ThemedText style={styles.resetMessage}>{resetMessage}</ThemedText>
        ) : null}

        <AuthButton
          title="Sign In"
          onPress={handleSignIn}
          disabled={!email || !password}
          loading={loading}
        />
      </View>

      <SecondaryTextButton
        text="New here?"
        highlight="Create an account"
        onPress={() => router.push("/(auth)/signUp")}
      />
    </AuthScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    marginBottom: 40,
    marginTop: 10,
  },
  title: {
    color: "#fff",
    textAlign: "center",
  },
  formContainer: {
    marginBottom: 40,
  },
  resetMessage: {
    color: "#4CAF50",
    textAlign: "center",
    marginVertical: 10,
  },
  socialLoginContainer: {
    marginBottom: 20,
  },
  socialLoginText: {
    textAlign: "center",
    color: "#888",
    marginBottom: 20,
  },
});

export default SignInScreen;
