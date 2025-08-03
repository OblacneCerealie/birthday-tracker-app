import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Image,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

export default function KittyPage() {
  const router = useRouter();
  const [kittyName, setKittyName] = useState("Your Kitty");
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState("");
  const [feedingStreak, setFeedingStreak] = useState(0);
  const [lastFedDate, setLastFedDate] = useState("");
  const [canFeed, setCanFeed] = useState(true);

  useEffect(() => {
    loadKittyName();
    loadFeedingData();
  }, []);

  const loadKittyName = async () => {
    try {
      const savedName = await AsyncStorage.getItem("kittyName");
      if (savedName) {
        setKittyName(savedName);
      }
    } catch (error) {
      console.log("Error loading kitty name:", error);
    }
  };

  const loadFeedingData = async () => {
    try {
      const savedStreak = await AsyncStorage.getItem("feedingStreak");
      const savedLastFed = await AsyncStorage.getItem("lastFedDate");
      const today = new Date().toDateString();
      
      if (savedStreak) {
        setFeedingStreak(parseInt(savedStreak));
      }
      
      if (savedLastFed) {
        setLastFedDate(savedLastFed);
        
        // Check if last fed was today (calendar day, not 24h)
        if (savedLastFed === today) {
          setCanFeed(false);
        } else {
          // If it's a new day, reset the feeding ability
          setCanFeed(true);
        }
      } else {
        // If no last fed date, allow feeding
        setCanFeed(true);
      }
    } catch (error) {
      console.log("Error loading feeding data:", error);
    }
  };

  const saveKittyName = async (name: string) => {
    try {
      await AsyncStorage.setItem("kittyName", name);
      setKittyName(name);
      setIsEditing(false);
    } catch (error) {
      console.log("Error saving kitty name:", error);
    }
  };

  const handleNamePress = () => {
    setTempName(kittyName);
    setIsEditing(true);
  };

  const handleSaveName = () => {
    if (tempName.trim()) {
      saveKittyName(tempName.trim());
    } else {
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setTempName("");
  };

  const handleFeedKitty = async () => {
    if (!canFeed) return;
    
    setCanFeed(false);
    
    // Update feeding streak based on calendar days
    const today = new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toDateString();
    
    let newStreak = 1;
    if (lastFedDate === yesterdayString) {
      newStreak = feedingStreak + 1;
    } else if (lastFedDate !== today) {
      newStreak = 1; // Reset streak if missed a day
    }
    
    setFeedingStreak(newStreak);
    setLastFedDate(today);
    
    // Save to storage
    AsyncStorage.setItem("feedingStreak", newStreak.toString());
    AsyncStorage.setItem("lastFedDate", today);
  };

  return (
    <View style={styles.container}>
      {isEditing ? (
        <View style={styles.editContainer}>
          <TextInput
            style={styles.nameInput}
            value={tempName}
            onChangeText={setTempName}
            placeholder="Enter kitty name..."
            placeholderTextColor="#666"
            autoFocus={true}
            onSubmitEditing={handleSaveName}
          />
          <View style={styles.editButtons}>
            <Pressable style={styles.saveButton} onPress={handleSaveName}>
              <Text style={styles.saveButtonText}>Save</Text>
            </Pressable>
            <Pressable style={styles.cancelButton} onPress={handleCancelEdit}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View>
          <Pressable onPress={handleNamePress}>
            <Text style={styles.title}>🐱 {kittyName}</Text>
          </Pressable>
          
          {/* Feeding Streak Tracker */}
          <Text style={styles.streakText}>
            🍽️ Feeding Streak: {feedingStreak} day{feedingStreak !== 1 ? 's' : ''}
          </Text>
        </View>
      )}
      
      <View style={styles.imageContainer}>
        <Image
          source={require("../Images/45941046766.png")}
          style={styles.kittyImage}
          resizeMode="contain"
        />
      </View>

      {/* Tuna Icon above Back Button */}
      <Pressable 
        style={[
          styles.tunaContainer,
          !canFeed && styles.disabledTuna
        ]} 
        onPress={handleFeedKitty}
        disabled={!canFeed}
      >
        <Image
          source={require("../Images/image.png")}
          style={styles.tunaIcon}
          resizeMode="contain"
        />
        {!canFeed && <Text style={styles.cooldownText}>⏰ Fed today!</Text>}
      </Pressable>

      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>← Back to Birthdays</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
  },
  imageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  kittyImage: {
    width: "80%",
    height: "60%",
    borderRadius: 15,
  },
  backButton: {
    backgroundColor: "#f0f0f0",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
    width: "100%",
  },
  backButtonText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  editContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  nameInput: {
    borderWidth: 2,
    borderColor: "#ff69b4",
    padding: 12,
    borderRadius: 8,
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    backgroundColor: "#fff",
    minWidth: 200,
    marginBottom: 10,
  },
  editButtons: {
    flexDirection: "row",
    gap: 10,
  },
  saveButton: {
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: "#f44336",
    padding: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  tunaContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  tunaIcon: {
    width: 80,
    height: 80,
    opacity: 0.9,
  },
  disabledTuna: {
    opacity: 0.5,
  },
  cooldownText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginTop: 5,
  },
  streakText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 20,
  },

}); 