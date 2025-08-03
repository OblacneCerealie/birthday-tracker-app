import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View
} from "react-native";
import { loadCoins } from "./lib/coins";
import { getKittyLevel, getKittyRarity } from "./lib/kitty-system";

export default function KittyGalleryPage() {
  const router = useRouter();
  const [equippedKitty, setEquippedKitty] = useState("basic");
  const [unlockedKitties, setUnlockedKitties] = useState(new Set(["basic"]));
  const [coins, setCoins] = useState(5);
  const [username, setUsername] = useState("");
  const [kittyLevels, setKittyLevels] = useState<Record<string, number>>({ basic: 1 });
  const [isSebastian, setIsSebastian] = useState(false);

  // All available kitties data
  const allKitties = [
    {
      id: "basic",
      name: "Basic Kitty",
      image: require("../Images_types_of_cats/Basic/45941046766.png"),
    },
    {
      id: "water",
      name: "Water Kitty", 
      image: require("../Images_types_of_cats/Water_Kitty/waterkitty_awake.png"),
    },
    {
      id: "bgs",
      name: "BGS Kitty",
      image: require("../Images_types_of_cats/BGSkitty/BGSkitty_awake.png"),
    },
    {
      id: "ginger",
      name: "Ginger Kitty",
      image: require("../Images_types_of_cats/GingerKitty/gingerkitty_awake.png"),
    },
    {
      id: "king",
      name: "King Kitty",
      image: require("../Images_types_of_cats/KingKitty/kingkitty_awake.png"),
    },
    {
      id: "street",
      name: "Street Kitty",
      image: require("../Images_types_of_cats/StreetKitty/streetcat_awake.png"),
    },
    {
      id: "sphynx",
      name: "Sphynx Kitty",
      image: require("../Images_types_of_cats/SphynxKitty/sphynxkitty_awake.png"),
    },
    {
      id: "tuxedo",
      name: "Tuxedo Kitty",
      image: require("../Images_types_of_cats/TuxedoKitty/tuxedokitty_awake.png"),
    },
    {
      id: "galactic",
      name: "Galactic Kitty",
      image: require("../Images_types_of_cats/GalacticKitty/GalacticKitty_awake (4).png"),
    },
    {
      id: "mfdoom",
      name: "MFDOOM Kitty",
      image: require("../Images_types_of_cats/MFDOOMKITTY/HelmetKitty_awake.png"),
    },
  ];

  // Load unlocked kitties and user data on component mount and when page is focused
  useEffect(() => {
    const loadAllData = async () => {
      await loadUserData(); // Load username first
      await loadUnlockedKitties();
      await loadKittyLevels();
      await loadEquippedKitty(); // Load equipped kitty after username is set
    };
    loadAllData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const loadAllData = async () => {
        await loadUserData(); // Load username first
        await loadUnlockedKitties();
        await loadKittyLevels();
        await loadEquippedKitty(); // Load equipped kitty after username is set
      };
      loadAllData();
    }, [])
  );

  const loadUserData = async () => {
    try {
      const name = await AsyncStorage.getItem("userName");
      if (name) {
        setUsername(name);
        const userCoins = await loadCoins(name);
        setCoins(userCoins);
        
        // Check if user is Sebastian
        setIsSebastian(name.toLowerCase() === "sebastian");
      }
    } catch (error) {
      console.log("Error loading user data:", error);
    }
  };

  const loadKittyLevels = async () => {
    try {
      const name = await AsyncStorage.getItem("userName");
      if (name) {
        // Load levels for all unlocked kitties
        const levels: Record<string, number> = {};
        for (const kittyId of unlockedKitties) {
          levels[kittyId] = await getKittyLevel(name, kittyId);
        }
        setKittyLevels(levels);
      }
    } catch (error) {
      console.log("Error loading kitty levels:", error);
    }
  };

  const loadEquippedKitty = async () => {
    try {
      const name = await AsyncStorage.getItem("userName");
      console.log("Gallery - Loading equipped kitty for user:", name);
      if (name) {
        const key = `equippedKitty_${name}`;
        const equipped = await AsyncStorage.getItem(key);
        const equippedKitty = equipped || "basic";
        setEquippedKitty(equippedKitty);
        console.log("Gallery - Loaded equipped kitty:", equippedKitty);
      }
    } catch (error) {
      console.log("Error loading equipped kitty:", error);
    }
  };

  const loadUnlockedKitties = async () => {
    try {
      const saved = await AsyncStorage.getItem("unlockedKitties");
      if (saved) {
        const unlocked = JSON.parse(saved);
        setUnlockedKitties(new Set(unlocked));
        console.log("Loaded unlocked kitties:", unlocked);
      } else {
        console.log("No saved unlocked kitties found");
      }
    } catch (error) {
      console.log("Error loading unlocked kitties:", error);
    }
  };

  // Filter kitties to show only unlocked ones
  const kitties = allKitties
    .filter(kitty => unlockedKitties.has(kitty.id))
    .sort((a, b) => {
      // Define rarity order (highest to lowest)
      const rarityOrder = ['Mythical', 'Legendary', 'Epic', 'Rare', 'Basic'];
      const rarityA = getKittyRarity(a.id);
      const rarityB = getKittyRarity(b.id);
      
      const indexA = rarityOrder.indexOf(rarityA);
      const indexB = rarityOrder.indexOf(rarityB);
      
      // Sort by rarity first (Mythical first, then Legendary, etc.)
      if (indexA !== indexB) {
        return indexA - indexB;
      }
      
      // If same rarity, sort alphabetically by name
      return a.name.localeCompare(b.name);
    });
  console.log("Showing kitties in gallery:", kitties.map(k => k.name));

  const getKittyRarityColor = (kittyId: string): string => {
    const rarity = getKittyRarity(kittyId);
    switch (rarity) {
      case 'Basic': return '#8B8B8B';
      case 'Rare': return '#4CAF50';
      case 'Epic': return '#9C27B0';
      case 'Legendary': return '#FFD700';
      case 'Mythical': return '#FF6B35';
      default: return '#8B8B8B';
    }
  };

  const handleKittyPress = async (kittyId: string) => {
    if (unlockedKitties.has(kittyId)) {
      console.log(`Attempting to equip ${kittyId} kitty for user ${username}`);
      
      // Update local state immediately
      setEquippedKitty(kittyId);
      console.log(`Local state updated to: ${kittyId}`);
      
      // Save directly to AsyncStorage with a simple key
      const key = `equippedKitty_${username}`;
      console.log(`Saving equipped kitty: ${kittyId} with key: ${key}`);
      
      try {
        await AsyncStorage.setItem(key, kittyId);
        console.log(`Successfully saved equipped kitty: ${kittyId}`);
        
        // Verify it was saved
        const saved = await AsyncStorage.getItem(key);
        console.log(`Verified saved equipped kitty: ${saved}`);
        
        // Keep the local state as is - don't reload
      } catch (error) {
        console.log(`Error equipping kitty: ${error}`);
      }
    }
  };

  const unlockAllKitties = async () => {
    Alert.alert(
      "Unlock All Kitties",
      "Are you sure you want to unlock all kitties? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unlock All",
          style: "destructive",
          onPress: async () => {
            try {
              // Get all kitty IDs
              const allKittyIds = allKitties.map(kitty => kitty.id);
              
              // Update local state
              setUnlockedKitties(new Set(allKittyIds));
              
              // Save to AsyncStorage
              await AsyncStorage.setItem("unlockedKitties", JSON.stringify(allKittyIds));
              
              console.log("All kitties unlocked for Sebastian!");
              Alert.alert("Success", "All kitties have been unlocked! 🎉");
            } catch (error) {
              console.log("Error unlocking all kitties:", error);
              Alert.alert("Error", "Failed to unlock all kitties. Please try again.");
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const renderKittyGrid = () => {
    const rows = [];
    const itemsPerRow = 3;
    
    for (let i = 0; i < kitties.length; i += itemsPerRow) {
      const row = kitties.slice(i, i + itemsPerRow);
      const rowItems = row.map((kitty) => (
                        <Pressable
                  key={kitty.id}
                  style={[
                    styles.kittyItem,
                    equippedKitty === kitty.id && styles.equippedKitty,
                  ]}
                  onPress={() => handleKittyPress(kitty.id)}
                >
                  <Image
                    source={kitty.image}
                    style={styles.kittyImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.kittyName}>{kitty.name}</Text>
                  
                  {/* Rarity Badge */}
                  <View style={[styles.rarityBadge, { backgroundColor: getKittyRarityColor(kitty.id) }]}>
                    <Text style={styles.rarityText}>{getKittyRarity(kitty.id)}</Text>
                  </View>
                  
                  {/* Level */}
                  <Text style={styles.levelText}>Level {kittyLevels[kitty.id] || 1}</Text>
                  
                  {equippedKitty === kitty.id && (
                    <Text style={styles.equippedText}>EQUIPPED</Text>
                  )}
                </Pressable>
      ));
      
      // Fill empty slots with placeholder items (only if we have fewer than 3 items total)
      if (kitties.length < 3) {
        while (rowItems.length < itemsPerRow) {
          rowItems.push(
            <View key={`empty-${i + rowItems.length}`} style={styles.emptySlot}>
              <Text style={styles.emptyText}>Coming Soon!</Text>
            </View>
          );
        }
      }
      
      rows.push(
        <View key={`row-${i}`} style={styles.row}>
          {rowItems}
        </View>
      );
    }
    
    return rows;
  };

  return (
    <View style={styles.container}>
      {/* Currency Display */}
      <View style={styles.currencyContainer}>
        <Text style={styles.currencyText}>🪙 {coins}</Text>
      </View>
      
      <Text style={styles.title}>🐱 Kitty Gallery</Text>
      
      {/* Sebastian's Unlock All Button */}
      {isSebastian && (
        <Pressable style={styles.unlockAllButton} onPress={unlockAllKitties}>
          <Text style={styles.unlockAllButtonText}>🔓 Unlock All Kitties</Text>
        </Pressable>
      )}
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.gridContainer}>
          {renderKittyGrid()}
        </View>
      </ScrollView>
      
      <Pressable style={styles.getNewKittyButton} onPress={() => {
        router.push("/get-new-kitty");
      }}>
        <Text style={styles.getNewKittyButtonText}>🎁 Get New Kitty!</Text>
      </Pressable>
      
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>← Back to Kitty</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  currencyContainer: {
    position: "absolute",
    top: 50,
    right: 20,
  },
  currencyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 50,
    marginBottom: 30,
    color: "#333",
  },
  scrollView: {
    flex: 1,
  },
  gridContainer: {
    paddingBottom: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  kittyItem: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 15,
    padding: 15,
    marginHorizontal: 5,
    borderWidth: 2,
    borderColor: "#e9ecef",
  },
  equippedKitty: {
    borderColor: "#28a745",
    backgroundColor: "#d4edda",
  },
  lockedKitty: {
    backgroundColor: "#f8f9fa",
    opacity: 0.6,
  },
  kittyImage: {
    width: 80,
    height: 80,
    marginBottom: 10,
  },
  lockedImage: {
    opacity: 0.3,
  },
  kittyName: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    color: "#333",
    marginBottom: 5,
  },
  equippedText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#28a745",
    textAlign: "center",
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
  levelText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginTop: 2,
  },
  lockedText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#6c757d",
    textAlign: "center",
  },
  emptySlot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 15,
    padding: 15,
    marginHorizontal: 5,
    borderWidth: 2,
    borderColor: "#e9ecef",
    borderStyle: "dashed",
  },
  emptyText: {
    fontSize: 12,
    color: "#6c757d",
    textAlign: "center",
    fontStyle: "italic",
  },
  getNewKittyButton: {
    backgroundColor: "#ff69b4",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  getNewKittyButtonText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
  },
  backButton: {
    backgroundColor: "#f0f0f0",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  unlockAllButton: {
    backgroundColor: "#FF6B35",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
    alignSelf: "center",
  },
  unlockAllButtonText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "bold",
  },
}); 