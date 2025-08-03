import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Image,
    Pressable,
    StyleSheet,
    Text,
    View
} from "react-native";
import { loadCoins, spendCoins } from "./lib/coins";
import { addKittyLevel, getKittyLevel, getKittyRarity, getRandomKitty } from "./lib/kitty-system";


export default function GetNewKittyPage() {
  const router = useRouter();
  const [isRolling, setIsRolling] = useState(false);
  const [currentCoins, setCurrentCoins] = useState(5);
  const [showContent, setShowContent] = useState(true);
  const [currentKittyIndex, setCurrentKittyIndex] = useState(0);
  const [rollSpeed, setRollSpeed] = useState(100);
  const [finalKitty, setFinalKitty] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [resultKitty, setResultKitty] = useState(null);
  const [unlockedKitties, setUnlockedKitties] = useState(new Set(["basic"]));
  const [username, setUsername] = useState("");
  const [kittyLevels, setKittyLevels] = useState<Record<string, number>>({ basic: 1 });

  // Load unlocked kitties and user data on component mount
  useEffect(() => {
    loadUnlockedKitties();
    loadUserData();
    loadKittyLevels();
  }, []);

  const loadUserData = async () => {
    try {
      const name = await AsyncStorage.getItem("userName");
      if (name) {
        setUsername(name);
        const userCoins = await loadCoins(name);
        setCurrentCoins(userCoins);
      }
    } catch (error) {
      console.log("Error loading user data:", error);
    }
  };

  const loadKittyLevels = async () => {
    try {
      const name = await AsyncStorage.getItem("userName");
      if (name) {
        const levels = await getKittyLevel(name, "basic"); // Load all levels
        // For now, just load basic level, we'll expand this later
        setKittyLevels({ basic: levels });
      }
    } catch (error) {
      console.log("Error loading kitty levels:", error);
    }
  };

  const loadUnlockedKitties = async () => {
    try {
      const saved = await AsyncStorage.getItem("unlockedKitties");
      if (saved) {
        const unlocked = JSON.parse(saved);
        setUnlockedKitties(new Set(unlocked));
      }
    } catch (error) {
      console.log("Error loading unlocked kitties:", error);
    }
  };

  const saveUnlockedKitties = async (kittyId) => {
    try {
      const newUnlocked = new Set([...unlockedKitties, kittyId]);
      setUnlockedKitties(newUnlocked);
      await AsyncStorage.setItem("unlockedKitties", JSON.stringify([...newUnlocked]));
    } catch (error) {
      console.log("Error saving unlocked kitty:", error);
    }
  };

  // All available kitties (awake states only)
  const allKitties = [
    {
      id: "basic",
      name: "Basic Kitty",
      image: require("../Images_types_of_cats/Basic/45941046766.png"),
      unlocked: true,
    },
    {
      id: "water",
      name: "Water Kitty", 
      image: require("../Images_types_of_cats/Water_Kitty/waterkitty_awake.png"),
      unlocked: false,
    },
    {
      id: "bgs",
      name: "BGS Kitty",
      image: require("../Images_types_of_cats/BGSkitty/BGSkitty_awake.png"),
      unlocked: false,
    },
    {
      id: "ginger",
      name: "Ginger Kitty",
      image: require("../Images_types_of_cats/GingerKitty/gingerkitty_awake.png"),
      unlocked: false,
    },
    {
      id: "king",
      name: "King Kitty",
      image: require("../Images_types_of_cats/KingKitty/kingkitty_awake.png"),
      unlocked: false,
    },
    {
      id: "street",
      name: "Street Kitty",
      image: require("../Images_types_of_cats/StreetKitty/streetcat_awake.png"),
      unlocked: false,
    },
    {
      id: "sphynx",
      name: "Sphynx Kitty",
      image: require("../Images_types_of_cats/SphynxKitty/sphynxkitty_awake.png"),
      unlocked: false,
    },
    {
      id: "tuxedo",
      name: "Tuxedo Kitty",
      image: require("../Images_types_of_cats/TuxedoKitty/tuxedokitty_awake.png"),
      unlocked: false,
    },
    {
      id: "galactic",
      name: "Galactic Kitty",
      image: require("../Images_types_of_cats/GalacticKitty/GalacticKitty_awake (4).png"),
      unlocked: false,
    },
    {
      id: "mfdoom",
      name: "MFDOOM Kitty",
      image: require("../Images_types_of_cats/MFDOOMKITTY/HelmetKitty_awake.png"),
      unlocked: false,
    },
  ];

  const handleRollForKitty = async () => {
    if (currentCoins < 5) {
      Alert.alert("Not enough coins!", "You need 5 coins to roll for a new kitty.");
      return;
    }

    // Spend coins using global system
    const success = await spendCoins(username, 5);
    if (!success) {
      Alert.alert("Not enough coins!", "You need 5 coins to roll for a new kitty.");
      return;
    }

    // Update local state
    setCurrentCoins(currentCoins - 5);
    
    // Hide content and start rolling
    setShowContent(false);
    setIsRolling(true);
    
    // Determine final kitty using rarity system
    const wonKittyId = getRandomKitty();
    const wonKittyIndex = allKitties.findIndex(kitty => kitty.id === wonKittyId);
    setFinalKitty(wonKittyIndex >= 0 ? wonKittyIndex : 0);
    
    // Start very fast rolling animation
    setRollSpeed(50);
    
    // Gradually slow down the rolling
    const slowDownInterval = setInterval(() => {
      setRollSpeed(prev => {
        if (prev > 800) {
          clearInterval(slowDownInterval);
          // Stop at final kitty
          setTimeout(() => {
            setIsRolling(false);
            setShowContent(true);
            
            // Show confetti
            setShowConfetti(true);
            // Create confetti pieces
            const pieces = [];
            for (let i = 0; i < 50; i++) {
              pieces.push({
                id: i,
                x: Math.random() * 400,
                y: -50,
                color: ['#ff69b4', '#ffd700', '#4CAF50', '#2196F3', '#9c27b0', '#ff9800'][Math.floor(Math.random() * 6)],
                rotation: Math.random() * 360,
                speed: 2 + Math.random() * 3,
              });
            }
            setConfettiPieces(pieces);
            
            // Show the result kitty
            setResultKitty(allKitties[wonKittyIndex]);
            setShowResult(true);
            
                                // Check if new kitty was unlocked or level up existing
                    const wonKitty = allKitties[wonKittyIndex];
                    if (!unlockedKitties.has(wonKitty.id)) {
                      // Save the newly unlocked kitty
                      saveUnlockedKitties(wonKitty.id);
                      console.log(`New kitty unlocked: ${wonKitty.name}`);
                    } else {
                      // Level up existing kitty
                      addKittyLevel(username, wonKitty.id).then(newLevel => {
                        console.log(`${wonKitty.name} leveled up to level ${newLevel}!`);
                      });
                    }
            
            // Animate confetti falling
            const confettiInterval = setInterval(() => {
              setConfettiPieces(prev => {
                const updated = prev.map(piece => ({
                  ...piece,
                  y: piece.y + piece.speed,
                  rotation: piece.rotation + 5,
                }));
                
                // Remove pieces that have fallen off screen
                const filtered = updated.filter(piece => piece.y < 800);
                
                if (filtered.length === 0) {
                  clearInterval(confettiInterval);
                  setShowConfetti(false);
                }
                
                return filtered;
              });
            }, 50);
          }, 1000);
          return 800;
        }
        return prev + 30;
      });
    }, 100);
    
    // Continue rolling animation with dynamic speed
    const rollInterval = setInterval(() => {
      setCurrentKittyIndex(prev => {
        const next = (prev + 1) % allKitties.length;
        return next;
      });
    }, rollSpeed);
    
    // Clean up intervals
    setTimeout(() => {
      clearInterval(rollInterval);
    }, 4000);
  };

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

  return (
    <View style={styles.container}>
      {/* Currency Display */}
      <View style={styles.currencyContainer}>
        <Text style={styles.currencyText}>🪙 {currentCoins}</Text>
      </View>
      
      {showContent ? (
        showResult ? (
          /* Result Screen */
                            <View style={styles.resultContainer}>
                    <Text style={styles.resultTitle}>
                      {resultKitty && !unlockedKitties.has(resultKitty.id) ? "🎉 New Kitty Unlocked!" : "🎊 You Got a Kitty!"}
                    </Text>
                    
                    <View style={styles.resultKittyContainer}>
                      <Image
                        source={resultKitty?.image}
                        style={styles.resultKittyImage}
                        resizeMode="contain"
                      />
                      <Text style={styles.resultKittyName}>{resultKitty?.name}</Text>
                      
                      {/* Rarity Badge */}
                      {resultKitty && (
                        <View style={[styles.rarityBadge, { backgroundColor: getKittyRarityColor(resultKitty.id) }]}>
                          <Text style={styles.rarityText}>{getKittyRarity(resultKitty.id)}</Text>
                        </View>
                      )}
                      
                      {/* Level or New Badge */}
                      {resultKitty && !unlockedKitties.has(resultKitty.id) ? (
                        <Text style={styles.newKittyText}>✨ NEW! ✨</Text>
                      ) : (
                        <Text style={styles.levelText}>Level {kittyLevels[resultKitty?.id] || 1}</Text>
                      )}
                    </View>
            
            <Pressable 
              style={styles.continueButton} 
              onPress={() => {
                setShowResult(false);
                setResultKitty(null);
              }}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Text style={styles.title}>🎁 Get New Kitty!</Text>
            
            <View style={styles.contentContainer}>
              <Text style={styles.description}>
                Unlock new kitty types! (Cost: 5 coins)
              </Text>
              
              <View style={styles.rollContainer}>
                <Pressable 
                  style={[
                    styles.rollButton,
                    isRolling && styles.rollingButton
                  ]} 
                  onPress={handleRollForKitty}
                  disabled={isRolling}
                >
                  <Text style={styles.rollButtonText}>
                    {isRolling ? "Rolling..." : "Roll for a Kitty"}
                  </Text>
                </Pressable>
                
                {isRolling && (
                  <Text style={styles.rollingText}>
                    Rolling...
                  </Text>
                )}
              </View>
              
              <View style={styles.infoContainer}>
                <Text style={styles.infoTitle}>How it works:</Text>
                <Text style={styles.infoText}>
                  • Each roll costs 5 coins{'\n'}
                  • Tap "Roll for a Kitty" to try your luck{'\n'}
                  • Each roll has a chance to unlock new kitties{'\n'}
                  • Unlocked kitties appear in your gallery{'\n'}
                  • You can equip any unlocked kitty
                </Text>
              </View>
            </View>
          </>
        )
      ) : (
        /* Rolling Animation */
        <View style={styles.rollingAnimationContainer}>
          <View style={styles.slotMachine}>
            {/* Left Kitty (smaller) */}
            <View style={styles.sideKitty}>
              <Image
                source={allKitties[(currentKittyIndex - 1 + allKitties.length) % allKitties.length].image}
                style={styles.sideKittyImage}
                resizeMode="contain"
              />
            </View>
            
            {/* Center Kitty (bigger) */}
            <View style={styles.centerKitty}>
              <Image
                source={allKitties[currentKittyIndex].image}
                style={styles.centerKittyImage}
                resizeMode="contain"
              />
              <Text style={styles.centerKittyName}>
                {allKitties[currentKittyIndex].name}
              </Text>
            </View>
            
            {/* Right Kitty (smaller) */}
            <View style={styles.sideKitty}>
              <Image
                source={allKitties[(currentKittyIndex + 1) % allKitties.length].image}
                style={styles.sideKittyImage}
                resizeMode="contain"
              />
            </View>
          </View>
          
          <Text style={styles.rollingText}>Rolling for your new kitty...</Text>
        </View>
      )}
      
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>← Back to Gallery</Text>
      </Pressable>
      
      {/* Custom Confetti Animation */}
      {showConfetti && confettiPieces.map(piece => (
        <View
          key={piece.id}
          style={[
            styles.confettiPiece,
            {
              left: piece.x,
              top: piece.y,
              backgroundColor: piece.color,
              transform: [{ rotate: `${piece.rotation}deg` }],
            },
          ]}
        />
      ))}
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
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  description: {
    fontSize: 18,
    textAlign: "center",
    color: "#666",
    marginBottom: 40,
    lineHeight: 24,
  },
  rollContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  rollButton: {
    backgroundColor: "#ff69b4",
    paddingHorizontal: 30,
    paddingVertical: 20,
    borderRadius: 25,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  rollingButton: {
    backgroundColor: "#ff8fab",
    transform: [{ scale: 0.95 }],
  },
  rollButtonText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  rollingText: {
    fontSize: 16,
    color: "#ff69b4",
    marginTop: 15,
    fontWeight: "600",
  },
  infoContainer: {
    backgroundColor: "#f8f9fa",
    padding: 20,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#e9ecef",
    marginTop: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  backButton: {
    backgroundColor: "#f0f0f0",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  rollingAnimationContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  slotMachine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
  },
  sideKitty: {
    alignItems: "center",
    marginHorizontal: 10,
  },
  sideKittyImage: {
    width: 80,
    height: 80,
    opacity: 0.6,
  },
  centerKitty: {
    alignItems: "center",
    marginHorizontal: 20,
  },
  centerKittyImage: {
    width: 120,
    height: 120,
  },
  centerKittyName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginTop: 10,
    textAlign: "center",
  },
  confettiPiece: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    zIndex: 1000,
  },
  resultContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 40,
    color: "#333",
  },
  resultKittyContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  resultKittyImage: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  resultKittyName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 10,
  },
  newKittyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ff69b4",
    textAlign: "center",
  },
  rarityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  rarityText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
  levelText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginTop: 8,
  },
  continueButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: "center",
  },
  continueButtonText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
  },
}); 