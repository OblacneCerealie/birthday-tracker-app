import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Button, StyleSheet, Text, TextInput, View } from "react-native";
import { clearCoinCache } from "./lib/coins";

export default function WelcomeScreen() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPasswordField, setShowPasswordField] = useState(false);
  const router = useRouter();

  const PASSWORD = "Sebko321"; // ✅ Change this to your real password

  const handleContinue = async () => {
    const trimmed = name.trim();

    if (!trimmed) {
      Alert.alert("Please enter a name");
      return;
    }

    const isSebastian = trimmed.toLowerCase() === "sebastian";

    if (isSebastian && !showPasswordField) {
      // Show password field if name is Sebastian
      setShowPasswordField(true);
      return;
    }

    if (isSebastian && password !== PASSWORD) {
      Alert.alert("Incorrect Password", "Access denied.");
      return;
    }

    await AsyncStorage.setItem("userName", trimmed);
    
    // Mark that Sebastian account has been accessed on this device
    if (isSebastian) {
      await AsyncStorage.setItem("hasAccessedSebastianAccount", "true");
    }
    
    // Clear coin cache when switching users to prevent showing wrong coin amounts
    clearCoinCache();
    
    router.replace("/");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome</Text>
      <Text>Enter your name to continue:</Text>

      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Your name"
        autoCapitalize="words"
      />

      {showPasswordField && (
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Enter Password"
          secureTextEntry
        />
      )}

      <Button title="Continue" onPress={handleContinue} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 26, textAlign: "center", fontWeight: "bold", marginBottom: 30 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    fontSize: 16,
  },
});
