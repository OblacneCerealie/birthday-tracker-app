import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

type ThemeColors = {
  background: string;
  text: string;
  secondaryText: string;
  cardBackground: string;
  border: string;
  primary: string;
  danger: string;
  success: string;
  warning: string;
  tabBarBackground: string;
  headerBackground: string;
};

const lightColors: ThemeColors = {
  background: "#fff",
  text: "#333",
  secondaryText: "#666",
  cardBackground: "#f5f5f5",
  border: "#ddd",
  primary: "#007aff",
  danger: "#ff3b30",
  success: "#34c759",
  warning: "#ff9500",
  tabBarBackground: "#f8f9fa",
  headerBackground: "#f8f9fa",
};

const darkColors: ThemeColors = {
  background: "#1a1a1a",
  text: "#f5f5f5",
  secondaryText: "#aaa",
  cardBackground: "#2a2a2a",
  border: "#444",
  primary: "#0a84ff",
  danger: "#ff453a",
  success: "#32d74b",
  warning: "#ff9f0a",
  tabBarBackground: "#1c1c1e",
  headerBackground: "#1c1c1e",
};

type ThemeContextType = {
  theme: Theme;
  colors: ThemeColors;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem("isDarkMode");
      if (savedTheme) {
        setThemeState(savedTheme === "true" ? "dark" : "light");
      }
    } catch (error) {
      console.log("Error loading theme:", error);
    }
  };

  const setTheme = async (newTheme: Theme) => {
    try {
      setThemeState(newTheme);
      await AsyncStorage.setItem("isDarkMode", (newTheme === "dark").toString());
    } catch (error) {
      console.log("Error saving theme:", error);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const colors = theme === "light" ? lightColors : darkColors;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        colors,
        isDark: theme === "dark",
        toggleTheme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

