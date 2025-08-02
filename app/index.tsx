import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import ConfettiCannon from "react-native-confetti-cannon";
import {
  getUpcomingBirthdays,
  getUpcomingUserBirthdays,
  getUserBirthdays,
  scheduleAllBirthdayNotifications,
} from "./lib/birthdays";

export default function HomeScreen() {
  const [authorized, setAuthorized] = useState(false);
  const [birthdays, setBirthdays] = useState<any[]>([]);
  const [username, setUsername] = useState("");
  const [todayBirthdays, setTodayBirthdays] = useState<string[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const router = useRouter();
  const confettiRef = useRef<ConfettiCannon>(null);
  const bannerAnimation = useRef(new Animated.Value(0)).current;

  const loadData = useCallback(async () => {
    const name = await AsyncStorage.getItem("userName");
    if (!name) {
      router.replace("/welcome");
      return;
    }

    setUsername(name);
    const isSebastian = name.trim().toLowerCase() === "sebastian";
    setAuthorized(isSebastian);

    let todayBdays = [];

    if (isSebastian) {
      const upcoming = getUpcomingBirthdays();
      setBirthdays(upcoming);
      todayBdays = upcoming.filter((b) => b.daysAway === 0);
    } else {
      const userBdays = await getUserBirthdays();
      const upcoming = getUpcomingUserBirthdays(userBdays);
      setBirthdays(upcoming);
      todayBdays = upcoming.filter((b) => b.daysAway === 0);
    }

    // Set today's birthdays for celebration
    const todayNames = todayBdays.map(b => b.name);
    setTodayBirthdays(todayNames);
    
    // Show celebration if there are birthdays today
    if (todayNames.length > 0) {
      setShowCelebration(true);
      // Trigger confetti after a short delay
      setTimeout(() => {
        confettiRef.current?.start();
      }, 500);
      
      // Animate the banner
      Animated.sequence([
        Animated.timing(bannerAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(bannerAnimation, {
          toValue: 0.8,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      setShowCelebration(false);
    }

    await requestNotificationPermission();
    
    // Check if we've already sent notifications today
    const today = new Date().toDateString();
    const lastNotificationDate = await AsyncStorage.getItem('lastNotificationDate');
    
    // Only send notifications if we haven't sent them today
    if (lastNotificationDate !== today) {
      todayBdays.forEach((b) => {
        sendBirthdayNotification(b.name);
      });
      // Mark that we've sent notifications today
      await AsyncStorage.setItem('lastNotificationDate', today);
    }
  }, [router, bannerAnimation]);

  // Load data on initial mount
  useEffect(() => {
    loadData();
    // Schedule all birthday notifications
    scheduleAllBirthdayNotifications();
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

  const getBirthdayMessage = () => {
    if (todayBirthdays.length === 1) {
      return `🎉 It's ${todayBirthdays[0]}'s birthday today! 🎉`;
    } else if (todayBirthdays.length > 1) {
      const names = todayBirthdays.join(', ');
      return `🎉 It's ${names}'s birthday today! 🎉`;
    }
    return '';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Hi, {username}!</Text>
      <Text style={styles.title}>🎉 Upcoming Birthdays</Text>

      {birthdays.length > 0 ? (
        birthdays.slice(0, 3).map((b, i) => {
          const isToday = b.daysAway === 0;
          return (
            <View 
              key={i} 
              style={[
                styles.card,
                isToday && styles.todayCard
              ]}
            >
              <Text style={styles.name}>
                {isToday ? '🎂 ' : ''}{b.name}{isToday ? ' 🎂' : ''}
              </Text>
              <Text>{b.date}</Text>
              <Text style={[styles.days, isToday && styles.todayText]}>
                {isToday ? "🎉 It's their birthday today! 🎉" : `${b.daysAway} day(s) left`}
              </Text>
            </View>
          );
        })
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

      {/* Birthday Celebration Banner */}
      {showCelebration && (
        <Animated.View 
          style={[
            styles.celebrationBanner,
            {
              transform: [
                {
                  scale: bannerAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                },
              ],
              opacity: bannerAnimation,
            },
          ]}
        >
          <Text style={styles.celebrationText}>{getBirthdayMessage()}</Text>
          <Text style={styles.celebrationSubtext}>🎂 Happy Birthday! 🎂</Text>
        </Animated.View>
      )}

      {/* Confetti Effect */}
      <ConfettiCannon
        ref={confettiRef}
        count={200}
        origin={{ x: -10, y: 0 }}
        autoStart={false}
        colors={['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8']}
        fadeOut={true}
        fallSpeed={3000}
      />
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
  celebrationBanner: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#E3F2FD', // Soft light blue background
    padding: 15,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  celebrationText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976D2', // Dark blue text for good contrast on light blue
    textAlign: 'center',
    marginBottom: 5,
  },
  celebrationSubtext: {
    fontSize: 14,
    color: '#1976D2', // Dark blue text for good contrast on light blue
    textAlign: 'center',
    opacity: 0.9,
  },
  todayCard: {
    borderLeftColor: '#FFD700', // Golden border for today's birthdays
    borderLeftWidth: 6,
    backgroundColor: '#FFF8DC', // Light golden background
  },
  todayText: {
    fontWeight: 'bold',
    color: '#FFD700', // Golden color for today's text
  },
});


//  eas update --branch main --message "Describe your update here"