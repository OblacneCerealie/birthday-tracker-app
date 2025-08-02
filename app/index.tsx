import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  getUpcomingBirthdays,
  getUpcomingUserBirthdays,
  getUserBirthdays,
} from "./lib/birthdays";

export default function HomeScreen() {
  const [authorized, setAuthorized] = useState(false);
  const [birthdays, setBirthdays] = useState<any[]>([]);
  const [username, setUsername] = useState("");
  const router = useRouter();

  const loadData = useCallback(async () => {
    const name = await AsyncStorage.getItem("userName");
    if (!name) {
      router.replace("/welcome");
      return;
    }

    setUsername(name);
    const isSebastian = name.trim().toLowerCase() === "sebastian";
    setAuthorized(isSebastian);

    let todayBirthdays = [];

    if (isSebastian) {
      const upcoming = getUpcomingBirthdays();
      setBirthdays(upcoming);
      todayBirthdays = upcoming.filter((b) => b.daysAway === 0);
    } else {
      const userBdays = await getUserBirthdays();
      const upcoming = getUpcomingUserBirthdays(userBdays);
      setBirthdays(upcoming);
      todayBirthdays = upcoming.filter((b) => b.daysAway === 0);
    }

    await requestNotificationPermission();
    todayBirthdays.forEach((b) => {
      sendBirthdayNotification(b.name);
    });
  }, [router]);

  // Load data on initial mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refresh data when screen comes into focus (e.g., when navigating back)
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const sendBirthdayNotification = async (name: string) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🎂 Birthday Alert!",
        body: `${name} has a birthday today!`,
      },
      trigger: null,
    });
  };

  const requestNotificationPermission = async () => {
    const settings = await Notifications.getPermissionsAsync();
    if (!settings.granted) {
      await Notifications.requestPermissionsAsync();
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem("userName");
    router.replace("/welcome");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Hi, {username}!</Text>
      <Text style={styles.title}>🎉 Upcoming Birthdays</Text>

      {birthdays.length > 0 ? (
        birthdays.slice(0, 3).map((b, i) => (
          <View key={i} style={styles.card}>
            <Text style={styles.name}>{b.name}</Text>
            <Text>{b.date}</Text>
            <Text style={styles.days}>{b.daysAway} day(s) left</Text>
          </View>
        ))
      ) : (
        <Text style={{ textAlign: "center", marginTop: 20 }}>
          No birthdays to show yet.
        </Text>
      )}

      <Pressable style={styles.linkContainer} onPress={() => router.push('/all')}>
        <Text style={styles.link}>📅 View All Birthdays / Add New</Text>
      </Pressable>

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
    marginBottom: 20,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#f5f5f5",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#007aff",
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  days: {
    marginTop: 4,
    fontStyle: "italic",
    color: "#666",
  },
  link: {
    marginTop: 30,
    fontSize: 18,
    textAlign: "center",
    color: "#007aff",
  },
  logout: {
    marginTop: 20,
    fontSize: 18,
    textAlign: "center",
    color: "red",
    fontWeight: "bold",
  },
  linkContainer: {
    marginTop: 30,
    padding: 10,
  },
  logoutContainer: {
    marginTop: 20,
    padding: 10,
  },
});


//  eas update --branch main --message "Describe your update here"