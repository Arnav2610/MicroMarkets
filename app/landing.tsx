import { useAuth } from "@/context/AuthContext";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

export default function LandingScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [name, setName] = useState("");

  const handleContinue = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    signIn(trimmed);
    router.replace("/(tabs)" as any);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.content}>
        <Text style={styles.title}>MicroMarkets</Text>
        <Text style={styles.subtitle}>Private predictions markets.</Text>

        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Enter your name"
          placeholderTextColor="#6b7280"
          style={styles.input}
          autoCapitalize="words"
          autoCorrect={false}
        />

        <Pressable
          onPress={handleContinue}
          style={({ pressed }) => [styles.buttonWrap, pressed && styles.buttonPressed]}
        >
          <LinearGradient
            colors={["#9945FF", "#14F195"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    gap: 24,
  },
  title: {
    fontSize: 32,
    color: "#fff",
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 18,
    color: "#9ca3af",
    marginBottom: 24,
  },
  input: {
    width: "80%",
    maxWidth: 320,
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#2A2A2A",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#fff",
    marginBottom: 24,
  },
  buttonWrap: {
    borderRadius: 12,
    overflow: "hidden",
  },
  buttonPressed: { opacity: 0.98 },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  buttonText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 18,
  },
});
