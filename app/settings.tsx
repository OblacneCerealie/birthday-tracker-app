import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    View,
} from "react-native";
import { scheduleAllBirthdayNotifications } from "../lib/birthdays";
import { useTheme } from "../lib/theme";

export default function SettingsScreen() {
  const [notificationTime, setNotificationTime] = useState("07:00");
  const [pendingNotificationTime, setPendingNotificationTime] = useState("07:00");
  const { isDark, colors, setTheme } = useTheme();
  const router = useRouter();

  // Generate hours for picker (0-23)
  const generateHours = () => {
    return Array.from({ length: 24 }, (_, i) => {
      const hour = i.toString().padStart(2, "0");
      return { value: `${hour}:00`, label: `${hour}:00` };
    });
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedTime = await AsyncStorage.getItem("notificationTime");

      if (savedTime) {
        setNotificationTime(savedTime);
        setPendingNotificationTime(savedTime);
      }
    } catch (error) {
      console.log("Error loading settings:", error);
    }
  };

  const handleApplyNotificationTime = async () => {
    try {
      setNotificationTime(pendingNotificationTime);
      await AsyncStorage.setItem("notificationTime", pendingNotificationTime);
      
      // Reschedule all notifications with new time
      await scheduleAllBirthdayNotifications();
      
      Alert.alert(
        "Success",
        "Notification time updated! All birthday notifications have been rescheduled."
      );
    } catch (error) {
      console.log("Error saving notification time:", error);
      Alert.alert("Error", "Failed to update notification time");
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.removeItem("userName");
            router.replace("/welcome");
          },
        },
      ]
    );
  };

  const handleThemeToggle = async (value: boolean) => {
    try {
      setTheme(value ? "dark" : "light");
      Alert.alert(
        "Theme Updated",
        "Theme has been changed!"
      );
    } catch (error) {
      console.log("Error saving theme:", error);
      Alert.alert("Error", "Failed to update theme");
    }
  };

  const styles = createStyles(colors);

  return (
    <ScrollView style={[styles.container]} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title}>⚙️ Settings</Text>

      {/* Notification Time Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔔 Notification Time</Text>
        <Text style={styles.description}>
          Choose what time you want to receive birthday notifications
        </Text>

        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={pendingNotificationTime}
            onValueChange={setPendingNotificationTime}
            style={[styles.picker, { color: colors.text }]}
          >
            {generateHours().map((hour) => (
              <Picker.Item
                key={hour.value}
                label={hour.label}
                value={hour.value}
                color={colors.text}
              />
            ))}
          </Picker>
        </View>

        <Text style={styles.currentSetting}>
          Current notification time: <Text style={styles.highlight}>{notificationTime}</Text>
        </Text>

        {/* Apply Button */}
        {pendingNotificationTime !== notificationTime && (
          <Pressable style={styles.applyButton} onPress={handleApplyNotificationTime}>
            <Text style={styles.applyButtonText}>✓ Apply Changes</Text>
          </Pressable>
        )}
      </View>

      {/* Theme Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎨 Theme</Text>
        <Text style={styles.description}>
          Choose between light and dark mode
        </Text>

        <View style={styles.themeToggle}>
          <Text style={styles.themeLabel}>
            {isDark ? "🌙 Dark Mode" : "☀️ Light Mode"}
          </Text>
          <Switch
            value={isDark}
            onValueChange={handleThemeToggle}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={isDark ? "#007aff" : "#f4f3f4"}
          />
        </View>
      </View>

      {/* Info Section */}
      <View style={styles.section}>
        <Text style={styles.infoTitle}>ℹ️ About Notifications</Text>
        <Text style={styles.infoText}>
          • Notifications are sent on the birthday date at your chosen time
        </Text>
        <Text style={styles.infoText}>
          • Make sure notifications are enabled in your device settings
        </Text>
        <Text style={styles.infoText}>
          • Changes take effect after pressing Apply
        </Text>
      </View>

      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>← Back</Text>
      </Pressable>

      {/* Logout Button at Bottom */}
      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>🔓 Logout</Text>
      </Pressable>
    </ScrollView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 70,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
    color: colors.text,
  },
  section: {
    marginBottom: 30,
    padding: 20,
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    color: colors.text,
  },
  description: {
    fontSize: 14,
    color: colors.secondaryText,
    marginBottom: 15,
    lineHeight: 20,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.background,
    overflow: "hidden",
    marginBottom: 15,
  },
  picker: {
    height: 150,
  },
  currentSetting: {
    fontSize: 14,
    color: colors.secondaryText,
    textAlign: "center",
  },
  highlight: {
    color: colors.primary,
    fontWeight: "bold",
  },
  themeToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  themeLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.text,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: colors.text,
  },
  infoText: {
    fontSize: 14,
    color: colors.secondaryText,
    marginBottom: 8,
    lineHeight: 20,
  },
  backButton: {
    backgroundColor: colors.cardBackground,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: "500",
  },
  applyButton: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 15,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  applyButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  logoutButton: {
    backgroundColor: colors.danger,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  logoutButtonText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
  },
});

