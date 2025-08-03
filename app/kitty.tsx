import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from 'expo-av';
import { useFocusEffect, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Image,
    Pressable,
    Share,
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
  const [isSleeping, setIsSleeping] = useState(false);
  const [isEating, setIsEating] = useState(false);
  const [sleepingSound, setSleepingSound] = useState<any>(null);
  const [shouldBeSleeping, setShouldBeSleeping] = useState(false);
  const [meowSound, setMeowSound] = useState<any>(null);

  useEffect(() => {
    loadKittyName();
    loadFeedingData();
  }, []);

  // Handle page focus/blur for audio
  useFocusEffect(
    React.useCallback(() => {
      // Page is focused - resume purring if kitty should be sleeping
      if (shouldBeSleeping && !sleepingSound) {
        setIsSleeping(true);
        playSleepingSound();
      }
      
      return () => {
        // Page is blurred - stop all sounds
        if (sleepingSound) {
          stopSleepingSound();
        }
        if (meowSound) {
          meowSound.stopAsync().then(() => meowSound.unloadAsync());
          setMeowSound(null);
        }
      };
    }, [shouldBeSleeping, sleepingSound, meowSound])
  );

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
      const savedShouldBeSleeping = await AsyncStorage.getItem("shouldBeSleeping");
      const today = new Date().toDateString();
      
      if (savedStreak) {
        setFeedingStreak(parseInt(savedStreak));
      }
      
      if (savedLastFed) {
        setLastFedDate(savedLastFed);
        
        // Check if last fed was today (calendar day, not 24h)
        if (savedLastFed === today) {
          setCanFeed(false);
          
          // Check if kitty should still be sleeping
          if (savedShouldBeSleeping === 'true') {
            setShouldBeSleeping(true);
            setIsSleeping(true);
          }
        } else {
          // If it's a new day, reset the feeding ability
          setCanFeed(true);
          setShouldBeSleeping(false);
          setIsSleeping(false);
        }
      } else {
        // If no last fed date, allow feeding
        setCanFeed(true);
        setShouldBeSleeping(false);
        setIsSleeping(false);
      }
    } catch (error) {
      console.log("Error loading feeding data:", error);
    }
  };

  const playSleepingSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../Sounds/cat_purr-65388.mp3'),
        { shouldPlay: true, isLooping: true }
      );
      setSleepingSound(sound);
    } catch (error) {
      console.log('Error playing sleeping sound:', error);
    }
  };

  const stopSleepingSound = async () => {
    if (sleepingSound) {
      try {
        await sleepingSound.stopAsync();
        await sleepingSound.unloadAsync();
        setSleepingSound(null);
      } catch (error) {
        console.log('Error stopping sleeping sound:', error);
      }
    }
  };

  const handleKittyClick = async () => {
    // Only meow if kitty is awake (not eating or sleeping)
    if (!isEating && !isSleeping) {
      try {
        const { sound } = await Audio.Sound.createAsync(require('../Sounds/cat-98721.mp3'));
        setMeowSound(sound);
        await sound.playAsync();
        
        // Stop meow sound after 1 second
        setTimeout(async () => {
          if (sound) {
            try {
              await sound.stopAsync();
              await sound.unloadAsync();
              setMeowSound(null);
            } catch (error) {
              console.log('Error stopping meow sound:', error);
            }
          }
        }, 1000);
      } catch (error) {
        console.log('Error playing meow sound:', error);
      }
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
    setIsEating(true);
    setIsSleeping(false);
    
    // Play eating sound (wiwiwi) - will be stopped after 6 seconds
    let eatingSound: any = null;
    try {
      const { sound } = await Audio.Sound.createAsync(require('../Sounds/wiwiwi-original.mp3'));
      eatingSound = sound;
      await sound.playAsync();
    } catch (error) {
      console.log('Error playing eating sound:', error);
    }
    
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
    
    // Show eating animation for 6 seconds, then switch to sleeping
    setTimeout(async () => {
      // Stop eating sound after 6 seconds
      if (eatingSound) {
        try {
          await eatingSound.stopAsync();
          await eatingSound.unloadAsync();
        } catch (error) {
          console.log('Error stopping eating sound:', error);
        }
      }
      
      setIsEating(false);
      setIsSleeping(true);
      setShouldBeSleeping(true);
      
      // Save sleeping state
      await AsyncStorage.setItem("shouldBeSleeping", "true");
      
      // Play sleeping sound (cat purr) on loop
      await playSleepingSound();
    }, 6000);
  };

  const handleDebugFeed = async () => {
    // Debug function to feed kitty again immediately
    setCanFeed(true);
    setIsEating(false);
    setIsSleeping(false);
    setShouldBeSleeping(false);
    
    // Stop sleeping sound if it's playing
    await stopSleepingSound();
    
    // Reset the last fed date to allow feeding
    await AsyncStorage.removeItem("lastFedDate");
    await AsyncStorage.removeItem("shouldBeSleeping");
    setLastFedDate("");
  };

  const handleShareKitty = async () => {
    try {
      await Share.share({
        message: `look at mine kitten - ${kittyName} has a ${feedingStreak} day feeding streak! 🐱`,
        title: `My Kitty ${kittyName}`,
      });
    } catch (error) {
      console.log("Error sharing kitty:", error);
    }
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
        <Pressable onPress={handleKittyClick} disabled={isEating || isSleeping}>
          <Image
            source={
              isEating 
                ? require("../Images/image (2).png") 
                : isSleeping 
                  ? require("../Images/image (1).png") 
                  : require("../Images/45941046766.png")
            }
            style={styles.kittyImage}
            resizeMode="contain"
            onError={(error) => {
              console.log('Image loading error:', error);
            }}
            onLoad={() => console.log('Image loaded successfully')}
          />
        </Pressable>
        

        
        {isEating && <Text style={styles.eatingText}>😋 Nom nom nom...</Text>}
        {isSleeping && <Text style={styles.sleepingText}>😴 Zzz...</Text>}
        
        {/* Debug info */}
        <Text style={styles.debugText}>
          State: {isEating ? 'Eating' : isSleeping ? 'Sleeping' : 'Awake'}
        </Text>
      </View>

      {/* Tuna Icon above Back Button */}
      <Pressable 
        style={[
          styles.tunaContainer,
          (!canFeed || isSleeping || isEating) && styles.disabledTuna
        ]} 
        onPress={handleFeedKitty}
        disabled={!canFeed || isSleeping || isEating}
      >
        <Image
          source={require("../Images/image.png")}
          style={styles.tunaIcon}
          resizeMode="contain"
        />
        {!canFeed && <Text style={styles.cooldownText}>⏰ Fed today!</Text>}
        {isEating && <Text style={styles.cooldownText}>😋 Eating...</Text>}
        {isSleeping && <Text style={styles.cooldownText}>😴 Sleeping...</Text>}
      </Pressable>

      <View style={styles.buttonContainer}>
        <Pressable style={styles.shareButton} onPress={handleShareKitty}>
          <Text style={styles.shareButtonText}>📤 Share Kitty</Text>
        </Pressable>
        
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Back to Birthdays</Text>
        </Pressable>
      </View>

      {/* Debug Button */}
      <Pressable style={styles.debugButton} onPress={handleDebugFeed}>
        <Text style={styles.debugButtonText}>🐛 Debug: Reset Feeding</Text>
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
    width: 250,
    height: 250,
    borderRadius: 15,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
    marginTop: 20,
  },
  shareButton: {
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    flex: 1,
  },
  shareButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "500",
  },
  backButton: {
    backgroundColor: "#f0f0f0",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    flex: 1,
  },
  backButtonText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  debugButton: {
    backgroundColor: "#ff6b6b",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
    width: "100%",
  },
  debugButtonText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "bold",
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
  eatingText: {
    position: "absolute",
    top: 20,
    fontSize: 18,
    fontWeight: "bold",
    color: "#ff69b4",
    textAlign: "center",
  },
  sleepingText: {
    position: "absolute",
    top: 20,
    fontSize: 18,
    fontWeight: "bold",
    color: "#4a90e2",
    textAlign: "center",
  },
  debugText: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    marginTop: 10,
  },
  fallbackText: {
    fontSize: 24,
    color: "#666",
    textAlign: "center",
    marginTop: 20,
  },

}); 