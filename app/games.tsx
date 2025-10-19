import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../lib/theme";

export default function GamesScreen() {
  const [username, setUsername] = useState("");
  const router = useRouter();
  const { colors } = useTheme();

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

  const handleSeeYourKitty = () => {
    router.push("/kitty");
  };

  const handlePlayNHIE = () => {
    router.push("/nhie");
  };

  const styles = createStyles(colors);

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

    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 20,
    backgroundColor: colors.background,
    flex: 1,
  },
  greeting: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    color: colors.text,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
    color: colors.text,
  },
  gamesContainer: {
    flex: 1,
    gap: 20,
  },
  gameButton: {
    backgroundColor: colors.cardBackground,
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
    borderLeftColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gameButtonEmoji: {
    fontSize: 48,
    marginBottom: 10,
  },
  gameButtonTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 8,
  },
  gameButtonDescription: {
    fontSize: 14,
    color: colors.secondaryText,
    textAlign: "center",
    lineHeight: 20,
  },
  comingSoonContainer: {
    backgroundColor: colors.cardBackground,
    padding: 20,
    borderRadius: 15,
    alignItems: "center",
    opacity: 0.7,
    borderLeftWidth: 4,
    borderLeftColor: colors.border,
    borderWidth: 1,
    borderColor: colors.border,
  },
  comingSoonEmoji: {
    fontSize: 48,
    marginBottom: 10,
  },
  comingSoonTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.secondaryText,
    marginBottom: 8,
  },
  comingSoonDescription: {
    fontSize: 14,
    color: colors.secondaryText,
    textAlign: "center",
    lineHeight: 20,
    fontStyle: "italic",
  },
});
