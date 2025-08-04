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
import RainbowBadge from "./components/RainbowBadge";
import { loadCoins } from "./lib/coins";
import { getKittyRarity } from "./lib/kitty-system";

export default function KittyGalleryPage() {
  const router = useRouter();
  const [equippedKitty, setEquippedKitty] = useState("basic");
  const [unlockedKitties, setUnlockedKitties] = useState(new Set(["basic"]));
  const [coins, setCoins] = useState(5);
  const [username, setUsername] = useState("");
  const [kittyLevels, setKittyLevels] = useState<Record<string, number>>({ basic: 1 });
  const [kittyStatBonuses, setKittyStatBonuses] = useState<Record<string, any>>({});
  const [isSebastian, setIsSebastian] = useState(false);
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [selectedKitty, setSelectedKitty] = useState<any>(null);
  const [showKittyProfile, setShowKittyProfile] = useState(false);

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
      await loadSoundSettings();
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
        // Load levels directly from AsyncStorage using username-specific key
        const levelKey = `kittyLevels_${name}`;
        const levelData = await AsyncStorage.getItem(levelKey);
        if (levelData) {
          const levels = JSON.parse(levelData);
          setKittyLevels(levels);
        } else {
          // Initialize with basic kitty at level 1 if no data exists
          setKittyLevels({ basic: 1 });
        }
        
        // Load stat bonuses
        const bonusKey = `kittyStatBonuses_${name}`;
        const bonusData = await AsyncStorage.getItem(bonusKey);
        if (bonusData) {
          setKittyStatBonuses(JSON.parse(bonusData));
        }
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

  const loadSoundSettings = async () => {
    try {
      const soundMuted = await AsyncStorage.getItem("soundMuted");
      setIsSoundMuted(soundMuted === "true");
    } catch (error) {
      console.log("Error loading sound settings:", error);
    }
  };

  const toggleSound = async () => {
    const newMutedState = !isSoundMuted;
    setIsSoundMuted(newMutedState);
    
    // Save to AsyncStorage
    try {
      await AsyncStorage.setItem("soundMuted", newMutedState.toString());
    } catch (error) {
      console.log("Error saving sound settings:", error);
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

  const handleKittyPress = (kitty: any) => {
    setSelectedKitty(kitty);
    setShowKittyProfile(true);
  };

  const handleEquipKitty = async (kittyId: string) => {
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
        
        // Close the profile modal
        setShowKittyProfile(false);
        setSelectedKitty(null);
        
        // Verify it was saved
        const saved = await AsyncStorage.getItem(key);
        console.log(`Verified saved equipped kitty: ${saved}`);
        
        // Keep the local state as is - don't reload
      } catch (error) {
        console.log(`Error equipping kitty: ${error}`);
      }
    }
  };

  const closeKittyProfile = () => {
    setShowKittyProfile(false);
    setSelectedKitty(null);
  };

  const getKittyStats = (kittyId: string) => {
    const rarity = getKittyRarity(kittyId);
    
    const rarityBaseStats = {
      Basic: 10,
      Rare: 20,
      Epic: 35,
      Legendary: 60,
      Mythical: 85,
    };

    const baseValue = rarityBaseStats[rarity] || 10;
    const bonuses = kittyStatBonuses[kittyId] || {
      Speed: 0, Stealth: 0, Intelligence: 0, Luck: 0, Strength: 0
    };
    
    return {
      Speed: baseValue + bonuses.Speed,
      Stealth: baseValue + bonuses.Stealth,
      Intelligence: baseValue + bonuses.Intelligence,
      Luck: baseValue + bonuses.Luck,
      Strength: baseValue + bonuses.Strength,
    };
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
                  onPress={() => handleKittyPress(kitty)}
                >
                  <Image
                    source={kitty.image}
                    style={styles.kittyImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.kittyName}>{kitty.name}</Text>
                  
                  {/* Rarity Badge */}
                  {getKittyRarity(kitty.id) === 'Mythical' ? (
                    <RainbowBadge 
                      text={getKittyRarity(kitty.id)} 
                      style={styles.rarityBadge}
                      textStyle={styles.rarityText}
                    />
                  ) : (
                    <View style={[styles.rarityBadge, { backgroundColor: getKittyRarityColor(kitty.id) }]}>
                      <Text style={styles.rarityText}>{getKittyRarity(kitty.id)}</Text>
                    </View>
                  )}
                  
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
      
      {/* Settings Button */}
      <Pressable style={styles.settingsButton} onPress={toggleSound}>
        <Text style={styles.settingsButtonText}>
          {isSoundMuted ? '🔇' : '🔊'}
        </Text>
      </Pressable>
      
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

      {/* Kitty Profile Modal */}
      {showKittyProfile && selectedKitty && (
        <View style={styles.modalOverlay}>
          <View style={styles.profileModal}>
            <View style={styles.profileHeader}>
              <Image
                source={selectedKitty.image}
                style={styles.profileKittyImage}
                resizeMode="contain"
              />
              <Text style={styles.profileKittyName}>{selectedKitty.name}</Text>
              
              {/* Rarity Badge */}
              {getKittyRarity(selectedKitty.id) === 'Mythical' ? (
                <RainbowBadge 
                  text={getKittyRarity(selectedKitty.id)} 
                  style={styles.profileRarityBadge}
                  textStyle={styles.profileRarityText}
                />
              ) : (
                <View style={[styles.profileRarityBadge, { backgroundColor: getKittyRarityColor(selectedKitty.id) }]}>
                  <Text style={styles.profileRarityText}>{getKittyRarity(selectedKitty.id)}</Text>
                </View>
              )}
            </View>

            {/* Stats Section */}
            <View style={styles.statsSection}>
              <Text style={styles.statsTitle}>📊 Stats</Text>
              {Object.entries(getKittyStats(selectedKitty.id)).map(([stat, value]) => (
                <View key={stat} style={styles.statRow}>
                  <Text style={styles.statName}>{stat}</Text>
                  <View style={styles.statBarContainer}>
                    <View style={[styles.statBar, { width: `${value}%` }]} />
                  </View>
                  <Text style={styles.statValue}>{value}</Text>
                </View>
              ))}
            </View>

            {/* Level */}
            <Text style={styles.profileLevelText}>Level {kittyLevels[selectedKitty.id] || 1}</Text>

            {/* Equip Button */}
            {unlockedKitties.has(selectedKitty.id) ? (
              <Pressable 
                style={[
                  styles.equipButton,
                  equippedKitty === selectedKitty.id && styles.equippedButton
                ]} 
                onPress={() => handleEquipKitty(selectedKitty.id)}
              >
                <Text style={styles.equipButtonText}>
                  {equippedKitty === selectedKitty.id ? '✓ Equipped' : 'Equip Kitty'}
                </Text>
              </Pressable>
            ) : (
              <Text style={styles.profileLockedText}>🔒 Locked - Roll to unlock!</Text>
            )}

            {/* Close Button */}
            <Pressable style={styles.closeButton} onPress={closeKittyProfile}>
              <Text style={styles.closeButtonText}>✕ Close</Text>
            </Pressable>
          </View>
        </View>
      )}
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
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  profileModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    margin: 20,
    maxWidth: 350,
    width: '90%',
    maxHeight: '80%',
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileKittyImage: {
    width: 120,
    height: 120,
    marginBottom: 10,
  },
  profileKittyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  profileRarityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  profileRarityText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  statsSection: {
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    width: 80,
  },
  statBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  statBar: {
    height: '100%',
    backgroundColor: '#007aff',
    borderRadius: 4,
  },
  statValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    width: 30,
    textAlign: 'right',
  },
  profileLevelText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  equipButton: {
    backgroundColor: '#007aff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  equippedButton: {
    backgroundColor: '#28a745',
  },
  equipButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileLockedText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  closeButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  settingsButton: {
    position: "absolute",
    top: 5,
    right: 15,
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  settingsButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
}); 