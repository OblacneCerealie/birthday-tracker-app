import { Tabs } from "expo-router";
import React from "react";
import { Text } from "react-native";

export default function RootLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#007aff",
        tabBarInactiveTintColor: "#8e8e93",
        tabBarStyle: {
          backgroundColor: "#f8f9fa",
          borderTopWidth: 1,
          borderTopColor: "#e1e1e1",
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
        name="components/RainbowBadge"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
