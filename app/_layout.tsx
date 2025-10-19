import { Tabs, useRouter } from "expo-router";
import React from "react";
import { Text } from "react-native";
import { ThemeProvider, useTheme } from "../lib/theme";

function TabsLayout() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.secondaryText,
        tabBarStyle: {
          backgroundColor: colors.tabBarBackground,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 80,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 14,
          fontWeight: "600",
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Birthdays",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 28, color }}>🎂</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="games"
        options={{
          title: "Games",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 28, color }}>🎮</Text>
          ),
        }}
      />
      {/* Hide these screens from tabs */}
      <Tabs.Screen
        name="welcome"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="all"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="kitty"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="nhie"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="kitty-gallery"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="get-new-kitty"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="components/RainbowBadge"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="components/FloatingSettingsButton"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <TabsLayout />
    </ThemeProvider>
  );
}
