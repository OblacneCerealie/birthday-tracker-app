import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function GamesScreen() {
  const [username, setUsername] = useState("");
  const router = useRouter();

  const loadUserData = useCallback(async () => {
    try {
      const name = await AsyncStorage.getItem("userName");
      if (!name) {
        router.replace("/welcome");
        return;
      }
      setUsername(name);
    } catch (error) {
      console.log("Error loading user data:", error);
    }
  }, [router]);

  // Load data on initial mount
  React.useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [loadUserData])
  );

  const handleLogout = async () => {
    await AsyncStorage.removeItem("userName");
    router.replace("/welcome");
  };

  const handleSeeYourKitty = () => {
    router.push("/kitty");
  };

  const handlePlayNHIE = () => {
    router.push("/nhie");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Hi, {username}!</Text>
      <Text style={styles.title}>🎮 Games</Text>

      <View style={styles.gamesContainer}>
        {/* See Your Kitty Game */}
        <Pressable 
          style={styles.gameButton} 
          onPress={handleSeeYourKitty}
        >
          <Text style={styles.gameButtonEmoji}>🐱</Text>
          <Text style={styles.gameButtonTitle}>See Your Kitty</Text>
          <Text style={styles.gameButtonDescription}>
            Feed your kitty, play games, and collect coins!
          </Text>
        </Pressable>

        {/* NHIE Game - Now available for everyone */}
        <Pressable 
          style={styles.gameButton} 
          onPress={handlePlayNHIE}
        >
          <Text style={styles.gameButtonEmoji}>🎭</Text>
          <Text style={styles.gameButtonTitle}>Never Have I Ever</Text>
          <Text style={styles.gameButtonDescription}>
            Answer fun questions and see how adventurous you are!
          </Text>
        </Pressable>

        {/* Placeholder for future games */}
        <View style={styles.comingSoonContainer}>
          <Text style={styles.comingSoonEmoji}>🚧</Text>
          <Text style={styles.comingSoonTitle}>More Games Coming Soon!</Text>
          <Text style={styles.comingSoonDescription}>
            We're working on adding more fun games for you to enjoy.
          </Text>
        </View>
      </View>

      {/* Logout Button */}
      <Pressable onPress={handleLogout} style={styles.logoutContainer}>
        <Text style={styles.logout}>🔓 Logout</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: "#fff",
    flex: 1,
  },
  greeting: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
  },
  gamesContainer: {
    flex: 1,
    gap: 20,
  },
  gameButton: {
    backgroundColor: "#f8f9fa",
    padding: 20,
    borderRadius: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: "#007aff",
  },
  gameButtonEmoji: {
    fontSize: 48,
    marginBottom: 10,
  },
  gameButtonTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  gameButtonDescription: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  comingSoonContainer: {
    backgroundColor: "#f0f0f0",
    padding: 20,
    borderRadius: 15,
    alignItems: "center",
    opacity: 0.7,
    borderLeftWidth: 4,
    borderLeftColor: "#ccc",
  },
  comingSoonEmoji: {
    fontSize: 48,
    marginBottom: 10,
  },
  comingSoonTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#666",
    marginBottom: 8,
  },
  comingSoonDescription: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    lineHeight: 20,
    fontStyle: "italic",
  },
  logoutContainer: {
    marginTop: 20,
    padding: 10,
    alignItems: "center",
  },
  logout: {
    fontSize: 18,
    textAlign: "center",
    color: "red",
    fontWeight: "bold",
  },
});
