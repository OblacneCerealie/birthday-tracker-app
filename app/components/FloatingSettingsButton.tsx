import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";

export default function FloatingSettingsButton() {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push("/settings")}
      style={styles.floatingButton}
    >
      <Text style={styles.settingsIcon}>⚙️</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: "absolute",
    top: 50,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(0, 122, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  settingsIcon: {
    fontSize: 24,
  },
});

