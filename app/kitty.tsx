import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from 'expo-av';
import { useFocusEffect, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Image,
    Pressable,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TextInput,
    View
} from "react-native";
import { loadCoins, saveCoins } from "../lib/coins";
import { getEquippedKitty, getKittyRarity } from "../lib/kitty-system";

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
  const [coins, setCoins] = useState(5);
  const [equippedKitty, setEquippedKitty] = useState("basic");
  const [username, setUsername] = useState("");
  const [currentKittyImages, setCurrentKittyImages] = useState({
    awake: require("../Images_types_of_cats/Basic/45941046766.png"),
    eating: require("../Images_types_of_cats/Basic/image (2).png"),
    sleeping: require("../Images_types_of_cats/Basic/image (1).png"),
  });
  
  // Game selection states
  const [showGameSelector, setShowGameSelector] = useState(false);
  const [showBankSelector, setShowBankSelector] = useState(false);
  const [showHeistSetup, setShowHeistSetup] = useState(false);
  const [showKickGame, setShowKickGame] = useState(false);
  const [selectedBank, setSelectedBank] = useState("Local Bank");
  const [selectedKickKitty, setSelectedKickKitty] = useState("");
  const [heistTeam, setHeistTeam] = useState({
    brain: "",
    stealer: "",
    tank: "",
    luckyCharm: "",
  });
  const [heistInvestment, setHeistInvestment] = useState(10);
  const [unlockedKitties, setUnlockedKitties] = useState<Set<string>>(new Set());
  const [showKittyDropdown, setShowKittyDropdown] = useState<string | null>(null);
  const [showHeistGame, setShowHeistGame] = useState(false);
  const [heistLogs, setHeistLogs] = useState<string[]>([]);
  const [heistResult, setHeistResult] = useState<string>("");
  const [isHeistComplete, setIsHeistComplete] = useState(false);
  const [kickResult, setKickResult] = useState("");
  const [isKickComplete, setIsKickComplete] = useState(false);
  const [hasProcessedHeistResult, setHasProcessedHeistResult] = useState(false);
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [kittyLevels, setKittyLevels] = useState<Record<string, number>>({});
  const [kittyXP, setKittyXP] = useState<Record<string, number>>({});
  const [kittyStatBonuses, setKittyStatBonuses] = useState<Record<string, { Speed: number, Stealth: number, Intelligence: number, Luck: number, Strength: number }>>({});
  const [levelUpKitties, setLevelUpKitties] = useState<string[]>([]);

  useEffect(() => {
    loadKittyName();
    loadFeedingData();
    loadUserData();
    loadEquippedKitty();
    loadUnlockedKitties();
    loadKittyData();
    loadSoundSettings();
  }, []);

  // Handle page focus/blur for audio
  useFocusEffect(
    React.useCallback(() => {
      // Page is focused - refresh user data including coins
      loadUserData(true); // Force refresh coins when page comes into focus
      loadEquippedKitty();
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

  const loadUserData = async (forceRefresh: boolean = false) => {
    try {
      // Load username
      const name = await AsyncStorage.getItem("userName");
      if (name) {
        setUsername(name);
        // Load coins for this user with optional force refresh
        const userCoins = await loadCoins(name, forceRefresh);
        setCoins(userCoins);
      }
    } catch (error) {
      console.log("Error loading user data:", error);
    }
  };

  const loadEquippedKitty = async () => {
    try {
      const name = await AsyncStorage.getItem("userName");
      if (name) {
        const equipped = await getEquippedKitty(name);
        console.log("Main page - Loaded equipped kitty:", equipped);
        setEquippedKitty(equipped);
        updateKittyImages(equipped);
      }
    } catch (error) {
      console.log("Error loading equipped kitty:", error);
    }
  };

  const loadUnlockedKitties = async () => {
    try {
      const unlockedData = await AsyncStorage.getItem("unlockedKitties");
      if (unlockedData) {
        const kittyIds = JSON.parse(unlockedData);
        setUnlockedKitties(new Set(kittyIds));
      }
    } catch (error) {
      console.log("Error loading unlocked kitties:", error);
    }
  };

  const updateKittyImages = (kittyId: string) => {
    const kittyImages: Record<string, { awake: any; eating: any; sleeping: any }> = {
      basic: {
        awake: require("../Images_types_of_cats/Basic/45941046766.png"),
        eating: require("../Images_types_of_cats/Basic/image (2).png"),
        sleeping: require("../Images_types_of_cats/Basic/image (1).png"),
      },
      water: {
        awake: require("../Images_types_of_cats/Water_Kitty/waterkitty_awake.png"),
        eating: require("../Images_types_of_cats/Water_Kitty/waterkitty_eating.png"),
        sleeping: require("../Images_types_of_cats/Water_Kitty/waterkitty_sleeping.png"),
      },
      bgs: {
        awake: require("../Images_types_of_cats/BGSkitty/BGSkitty_awake.png"),
        eating: require("../Images_types_of_cats/BGSkitty/BGSkitty_eating.png"),
        sleeping: require("../Images_types_of_cats/BGSkitty/BGSkitty_sleeping.png"),
      },
      ginger: {
        awake: require("../Images_types_of_cats/GingerKitty/gingerkitty_awake.png"),
        eating: require("../Images_types_of_cats/GingerKitty/gingerkitty_eating.png"),
        sleeping: require("../Images_types_of_cats/GingerKitty/gingerkitty_sleeping.png"),
      },
      king: {
        awake: require("../Images_types_of_cats/KingKitty/kingkitty_awake.png"),
        eating: require("../Images_types_of_cats/KingKitty/kingkitty_eating.png"),
        sleeping: require("../Images_types_of_cats/KingKitty/kingkitty_sleeping.png"),
      },
      street: {
        awake: require("../Images_types_of_cats/StreetKitty/streetcat_awake.png"),
        eating: require("../Images_types_of_cats/StreetKitty/streetcat_eating.png"),
        sleeping: require("../Images_types_of_cats/StreetKitty/streetcat_sleeping (2).png"),
      },
      sphynx: {
        awake: require("../Images_types_of_cats/SphynxKitty/sphynxkitty_awake.png"),
        eating: require("../Images_types_of_cats/SphynxKitty/sphynxkitty_eating.png"),
        sleeping: require("../Images_types_of_cats/SphynxKitty/sphynxkitty_sleeping.png"),
      },
      tuxedo: {
        awake: require("../Images_types_of_cats/TuxedoKitty/tuxedokitty_awake.png"),
        eating: require("../Images_types_of_cats/TuxedoKitty/tuxedokitty_eating.png"),
        sleeping: require("../Images_types_of_cats/TuxedoKitty/tuxedokitty_sleeping.png"),
      },
      galactic: {
        awake: require("../Images_types_of_cats/GalacticKitty/GalacticKitty_awake (4).png"),
        eating: require("../Images_types_of_cats/GalacticKitty/GalacticKitty_eating (2).png"),
        sleeping: require("../Images_types_of_cats/GalacticKitty/GalacticKitty_sleeping (1).png"),
      },
      mfdoom: {
        awake: require("../Images_types_of_cats/MFDOOMKITTY/HelmetKitty_awake.png"),
        eating: require("../Images_types_of_cats/MFDOOMKITTY/HelmetKitty_eating.png"),
        sleeping: require("../Images_types_of_cats/MFDOOMKITTY/HelmetKitty_sleeping.png"),
      },
    };

    const images = kittyImages[kittyId] || kittyImages.basic;
    setCurrentKittyImages(images);
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
    if (isSoundMuted) return;
    
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
    // Only meow if kitty is awake (not eating or sleeping) and sound is not muted
    if (!isEating && !isSleeping && !isSoundMuted) {
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
    if (!isSoundMuted) {
      try {
        const { sound } = await Audio.Sound.createAsync(require('../Sounds/wiwiwi-original.mp3'));
        eatingSound = sound;
        await sound.playAsync();
      } catch (error) {
        console.log('Error playing eating sound:', error);
      }
    }
    
    // Give coins for feeding (5 coins)
    if (username) {
      const newCoins = coins + 5;
      setCoins(newCoins);
      await saveCoins(username, newCoins);
      console.log(`Earned 5 coins for feeding! Total: ${newCoins}`);
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

  const handleKittyGallery = () => {
    router.push("/kitty-gallery");
  };

  const handleGameSelector = () => {
    setShowGameSelector(true);
  };

  const handleKickHooman = () => {
    setShowGameSelector(false);
    setShowKickGame(true);
    // Auto-select the best kitty
    const sortedKitties = getSortedKitties();
    if (sortedKitties.length > 0) {
      setSelectedKickKitty(sortedKitties[0]);
    }
  };

  const handleBankHeist = () => {
    setShowGameSelector(false);
    setShowBankSelector(true);
  };

  const handleSelectBank = (bank: string) => {
    setSelectedBank(bank);
    setShowBankSelector(false);
    setShowHeistSetup(true);
  };

  const handleSelectHeistRole = (role: string, kittyId: string) => {
    setHeistTeam(prev => ({
      ...prev,
      [role]: kittyId
    }));
  };

  const handleStartHeist = () => {
    console.log("Starting heist with investment:", heistInvestment);
    console.log("Current coins before deduction:", coins);
    
    if (coins < heistInvestment) {
      Alert.alert("Insufficient Coins", "You don't have enough coins for this investment!");
      return;
    }
    
    // Don't deduct investment yet - we'll handle it in the result
    
    // Start heist game
    setShowHeistSetup(false);
    setShowHeistGame(true);
    setHeistLogs([]);
    setHeistResult("");
    setIsHeistComplete(false);
    
    // Start heist sequence
    startHeistSequence();
  };

  const startHeistSequence = () => {
    const logs = generateHeistLogs();
    let logIndex = 0;
    
    const logInterval = setInterval(() => {
      if (logIndex < logs.length) {
        setHeistLogs(prev => [...prev, logs[logIndex]]);
        logIndex++;
      } else {
        clearInterval(logInterval);
        // Calculate result after all logs
        setTimeout(() => {
          calculateHeistResult();
        }, 2000);
      }
    }, 2000);
  };

  const generateHeistLogs = () => {
    const logs = [];
    
    // Brain logs
    if (heistTeam.brain) {
      const brainLogs = [
        `${heistTeam.brain} is analyzing security systems...`,
        `${heistTeam.brain} is hacking into the mainframe...`,
        `${heistTeam.brain} is disabling alarm systems...`,
        `${heistTeam.brain} is creating a diversion...`,
        `${heistTeam.brain} is coordinating the team...`,
      ];
      logs.push(brainLogs[Math.floor(Math.random() * brainLogs.length)]);
    }
    
    // Stealer logs
    if (heistTeam.stealer) {
      const stealerLogs = [
        `${heistTeam.stealer} is sneaking past guards...`,
        `${heistTeam.stealer} is picking the vault lock...`,
        `${heistTeam.stealer} is disabling cameras...`,
        `${heistTeam.stealer} is stealing the loot...`,
        `${heistTeam.stealer} is making a silent escape...`,
      ];
      logs.push(stealerLogs[Math.floor(Math.random() * stealerLogs.length)]);
    }
    
    // Tank logs
    if (heistTeam.tank) {
      const tankLogs = [
        `${heistTeam.tank} is providing cover fire...`,
        `${heistTeam.tank} is breaking down doors...`,
        `${heistTeam.tank} is intimidating guards...`,
        `${heistTeam.tank} is carrying heavy equipment...`,
        `${heistTeam.tank} is protecting the team...`,
      ];
      logs.push(tankLogs[Math.floor(Math.random() * tankLogs.length)]);
    }
    
    // Lucky Charm logs
    if (heistTeam.luckyCharm) {
      const luckyLogs = [
        `${heistTeam.luckyCharm} found a secret passage...`,
        `${heistTeam.luckyCharm} discovered extra loot...`,
        `${heistTeam.luckyCharm} avoided detection...`,
        `${heistTeam.luckyCharm} found the perfect timing...`,
        `${heistTeam.luckyCharm} got lucky with security...`,
      ];
      logs.push(luckyLogs[Math.floor(Math.random() * luckyLogs.length)]);
    }
    
    return logs;
  };

  const calculateHeistResult = async () => {
    // Prevent double processing
    if (hasProcessedHeistResult) {
      console.log("Heist result already processed, skipping...");
      return;
    }
    
    setHasProcessedHeistResult(true);
    
    // Calculate total skill points
    let totalSkill = 0;
    
    if (heistTeam.brain) {
      const brainStats = getKittyStats(heistTeam.brain);
      totalSkill += brainStats.Intelligence;
    }
    
    if (heistTeam.stealer) {
      const stealerStats = getKittyStats(heistTeam.stealer);
      totalSkill += stealerStats.Stealth + stealerStats.Speed;
    }
    
    if (heistTeam.tank) {
      const tankStats = getKittyStats(heistTeam.tank);
      totalSkill += tankStats.Strength;
    }
    
    if (heistTeam.luckyCharm) {
      const luckyStats = getKittyStats(heistTeam.luckyCharm);
      totalSkill += luckyStats.Luck;
    }
    
    // Generate random number (0-500)
    const randomNumber = Math.floor(Math.random() * 501);
    
    // Determine success
    const isSuccess = randomNumber <= totalSkill;
    
    // Generate result logs
    const resultLogs = generateResultLogs(isSuccess, totalSkill, randomNumber);
    setHeistLogs(prev => [...prev, ...resultLogs]);
    
    // Set final result based on bank type
    if (isSuccess) {
      let reward;
      let xpAmount;
      console.log("Heist investment amount:", heistInvestment);
      if (selectedBank === "Local Bank") {
        reward = Math.floor(heistInvestment * 1.5); // 1.5x total reward for Local Bank
        xpAmount = 100; // 100 XP for Local Bank
        console.log("Local Bank calculation:", heistInvestment, "* 1.5 =", reward, "(total reward)");
      } else if (selectedBank === "City Bank") {
        reward = Math.floor(heistInvestment * 3); // 3x total reward for City Bank
        xpAmount = 300; // 300 XP for City Bank
        console.log("City Bank calculation:", heistInvestment, "* 3 =", reward, "(total reward)");
      } else {
        reward = heistInvestment * 2; // 2x total reward (default)
        xpAmount = 200; // Default 200 XP
        console.log("Default calculation:", heistInvestment, "* 2 =", reward, "(total reward)");
      }
      // Calculate reward based on current state
      try {
        const name = await AsyncStorage.getItem("userName");
        if (name) {
          console.log("Current coins before reward:", coins);
          console.log("Reward amount:", reward, "Investment:", heistInvestment, "Bank:", selectedBank);
          // Add total reward and deduct investment
          const newCoins = coins + reward - heistInvestment;
          console.log("Coins after reward:", newCoins);
          setCoins(newCoins);
          await saveCoins(name, newCoins);
        }
      } catch (error) {
        console.log("Error saving coins:", error);
      }
      
      setHeistResult(`🎉 SUCCESS! You stole ${reward} coins!`);
      
      // Award XP to all participating kitties
      const xpPromises = [];
      if (heistTeam.brain) xpPromises.push(addXPToKitty(heistTeam.brain, xpAmount));
      if (heistTeam.stealer) xpPromises.push(addXPToKitty(heistTeam.stealer, xpAmount));
      if (heistTeam.tank) xpPromises.push(addXPToKitty(heistTeam.tank, xpAmount));
      if (heistTeam.luckyCharm) xpPromises.push(addXPToKitty(heistTeam.luckyCharm, xpAmount));
      
      // Wait for all XP to be processed
      await Promise.all(xpPromises);
    } else {
      let penalty;
      if (selectedBank === "Local Bank") {
        penalty = Math.floor(heistInvestment * 0.5); // 0.5x loss for Local Bank
      } else if (selectedBank === "City Bank") {
        penalty = Math.floor(heistInvestment * 0.25); // 0.25x loss for City Bank
      } else {
        penalty = heistInvestment; // Default full loss
      }
      
      // Calculate penalty based on current state
      try {
        const name = await AsyncStorage.getItem("userName");
        if (name) {
          console.log("Current coins before penalty:", coins);
          // Apply penalty to current state (investment already deducted)
          const newCoins = Math.max(5, coins - penalty); // Ensure minimum 5 coins
          console.log("Coins after penalty:", newCoins, "Penalty:", penalty);
          setCoins(newCoins);
          await saveCoins(name, newCoins);
        }
      } catch (error) {
        console.log("Error saving coins:", error);
      }
      
      setHeistResult(`💥 FAILED! You lost ${penalty} coins!`);
    }
    
    setIsHeistComplete(true);
  };

  const generateResultLogs = (isSuccess: boolean, totalSkill: number, randomNumber: number) => {
    if (isSuccess) {
      const successLogs = [
        "The team successfully escaped with the loot!",
        "Security never saw them coming!",
        "Perfect execution, mission accomplished!",
        "The vault was no match for this team!",
        "Clean getaway, no witnesses!",
      ];
      return [successLogs[Math.floor(Math.random() * successLogs.length)]];
    } else {
      const failLogs = [
        "The alarm went off! Security is responding!",
        "A guard spotted the team!",
        "The vault was too secure for this attempt!",
        "The team was caught on camera!",
        "Security systems were too advanced!",
      ];
      return [failLogs[Math.floor(Math.random() * failLogs.length)]];
    }
  };

  const resetHeist = () => {
    setShowHeistGame(false);
    setHeistTeam({
      brain: "",
      stealer: "",
      tank: "",
      luckyCharm: "",
    });
    setHeistInvestment(10);
    setHeistLogs([]);
    setHeistResult("");
    setIsHeistComplete(false);
    setLevelUpKitties([]);
    setHasProcessedHeistResult(false);
    
    // Reload kitty data to ensure gallery shows updated levels
    loadKittyData();
  };

  const getXPForLevel = (level: number) => {
    // Level 1 to 2: 10 XP, Level 2 to 3: 30 XP, Level 3 to 4: 50 XP, etc.
    return level * 10 + (level - 1) * 10;
  };

  const getLevelFromXP = (xp: number) => {
    let level = 1;
    let requiredXP = 0;
    
    while (requiredXP <= xp) {
      requiredXP += getXPForLevel(level);
      if (requiredXP <= xp) {
        level++;
      }
    }
    
    return level;
  };

  const addXPToKitty = async (kittyId: string, xpAmount: number) => {
    const currentXP = kittyXP[kittyId] || 0;
    const oldLevel = getLevelFromXP(currentXP);
    const newXP = currentXP + xpAmount;
    const newLevel = getLevelFromXP(newXP);
    
    // Update XP
    setKittyXP(prev => ({
      ...prev,
      [kittyId]: newXP
    }));
    
    // Save XP to AsyncStorage
    try {
      const xpData = await AsyncStorage.getItem("kittyXP");
      const allXP = xpData ? JSON.parse(xpData) : {};
      allXP[kittyId] = newXP;
      await AsyncStorage.setItem("kittyXP", JSON.stringify(allXP));
    } catch (error) {
      console.log("Error saving kitty XP:", error);
    }
    
    // Check if kitty leveled up
    if (newLevel > oldLevel) {
      setLevelUpKitties(prev => [...prev, kittyId]);
      
      // Add random stat point
      const stats = ['Speed', 'Stealth', 'Intelligence', 'Luck', 'Strength'];
      const randomStat = stats[Math.floor(Math.random() * stats.length)];
      
      // Update stat bonuses
      const currentBonuses = kittyStatBonuses[kittyId] || {
        Speed: 0,
        Stealth: 0,
        Intelligence: 0,
        Luck: 0,
        Strength: 0,
      };
      
      const newBonuses = {
        ...currentBonuses,
        [randomStat]: currentBonuses[randomStat as keyof typeof currentBonuses] + 1,
      };
      
      setKittyStatBonuses(prev => ({
        ...prev,
        [kittyId]: newBonuses,
      }));
      
      // Save stat bonuses to AsyncStorage
      try {
        const bonusData = await AsyncStorage.getItem("kittyStatBonuses");
        const allBonuses = bonusData ? JSON.parse(bonusData) : {};
        allBonuses[kittyId] = newBonuses;
        await AsyncStorage.setItem("kittyStatBonuses", JSON.stringify(allBonuses));
      } catch (error) {
        console.log("Error saving kitty stat bonuses:", error);
      }
      
      // Save level to AsyncStorage using username-specific key
      try {
        const name = await AsyncStorage.getItem("userName");
        if (name) {
          const key = `kittyLevels_${name}`;
          const levelData = await AsyncStorage.getItem(key);
          const allLevels = levelData ? JSON.parse(levelData) : {};
          allLevels[kittyId] = newLevel;
          await AsyncStorage.setItem(key, JSON.stringify(allLevels));
        }
      } catch (error) {
        console.log("Error saving kitty level:", error);
      }
    }
    
    return { oldLevel, newLevel, leveledUp: newLevel > oldLevel };
  };

  const loadKittyData = async () => {
    try {
      const name = await AsyncStorage.getItem("userName");
      if (!name) return;
      
      // Load XP
      const xpData = await AsyncStorage.getItem("kittyXP");
      if (xpData) {
        setKittyXP(JSON.parse(xpData));
      }
      
      // Load levels using username-specific key
      const levelKey = `kittyLevels_${name}`;
      const levelData = await AsyncStorage.getItem(levelKey);
      if (levelData) {
        setKittyLevels(JSON.parse(levelData));
      }
      
      // Load stat bonuses using username-specific key
      const bonusKey = `kittyStatBonuses_${name}`;
      const bonusData = await AsyncStorage.getItem(bonusKey);
      if (bonusData) {
        setKittyStatBonuses(JSON.parse(bonusData));
      }
    } catch (error) {
      console.log("Error loading kitty data:", error);
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
    
    // Stop sounds if muting
    if (newMutedState) {
      if (sleepingSound) {
        stopSleepingSound();
      }
      if (meowSound) {
        meowSound.stopAsync().then(() => meowSound.unloadAsync());
        setMeowSound(null);
      }
    }
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
    const level = kittyLevels[kittyId] || 1;
    
    // Get the random stat bonuses for this kitty
    const statBonuses = kittyStatBonuses[kittyId] || {
      Speed: 0,
      Stealth: 0,
      Intelligence: 0,
      Luck: 0,
      Strength: 0,
    };
    
    return {
      Speed: baseValue + statBonuses.Speed,
      Stealth: baseValue + statBonuses.Stealth,
      Intelligence: baseValue + statBonuses.Intelligence,
      Luck: baseValue + statBonuses.Luck,
      Strength: baseValue + statBonuses.Strength,
    };
  };

  const closeGameModals = () => {
    setShowGameSelector(false);
    setShowBankSelector(false);
    setShowHeistSetup(false);
    setShowKickGame(false);
    setSelectedBank("");
    setHeistTeam({
      brain: "",
      stealer: "",
      tank: "",
      luckyCharm: "",
    });
    setShowKittyDropdown(null);
  };

  const getAvailableKitties = () => {
    const usedKitties = new Set(Object.values(heistTeam).filter(kitty => kitty !== ""));
    return Array.from(unlockedKitties).filter(kitty => !usedKitties.has(kitty));
  };

  const getSortedKitties = () => {
    const availableKitties = getAvailableKitties();
    const rarityOrder = ['Mythical', 'Legendary', 'Epic', 'Rare', 'Basic'];
    
    return availableKitties.sort((a, b) => {
      const rarityA = getKittyRarity(a);
      const rarityB = getKittyRarity(b);
      return rarityOrder.indexOf(rarityA) - rarityOrder.indexOf(rarityB);
    });
  };

  const getKittyDisplayName = (kittyId: string) => {
    const rarity = getKittyRarity(kittyId);
    const rarityColors = {
      'Mythical': '#FF6B35',
      'Legendary': '#FFD700',
      'Epic': '#9C27B0',
      'Rare': '#4CAF50',
      'Basic': '#8B8B8B'
    };
    return `${kittyId} (${rarity})`;
  };

  const handleRolePress = (role: string) => {
    if (heistTeam[role as keyof typeof heistTeam]) {
      // If role is already filled, clear it
      setHeistTeam(prev => ({
        ...prev,
        [role]: ""
      }));
    } else {
      // Show dropdown for this role
      setShowKittyDropdown(role);
    }
  };

  const handleKittySelect = (role: string, kittyId: string) => {
    setHeistTeam(prev => ({
      ...prev,
      [role]: kittyId
    }));
    setShowKittyDropdown(null);
  };

  const autoFillRoles = () => {
    const availableKitties = getSortedKitties();
    const usedKitties = new Set(Object.values(heistTeam).filter(kitty => kitty !== ""));
    const unusedKitties = availableKitties.filter(kitty => !usedKitties.has(kitty));
    
    if (unusedKitties.length === 0) return;
    
    const newTeam = { ...heistTeam };
    let kittyIndex = 0;
    
    // Priority order: Stealer (best kitty), then Brain, Tank, Lucky Charm
    const rolePriority = ['stealer', 'brain', 'tank', 'luckyCharm'];
    
    for (const role of rolePriority) {
      if (!newTeam[role as keyof typeof newTeam] && kittyIndex < unusedKitties.length) {
        newTeam[role as keyof typeof newTeam] = unusedKitties[kittyIndex];
        kittyIndex++;
      }
    }
    
    setHeistTeam(newTeam);
  };

  const handleKickKittySelect = (kittyId: string) => {
    setSelectedKickKitty(kittyId);
    setShowKittyDropdown(null);
  };

  const handleStartKick = async () => {
    if (!selectedKickKitty) return;
    
    // 50/50 chance
    const isSuccess = Math.random() < 0.5;
    
    if (isSuccess) {
      // Success: 5 coins + 10 XP
      const newCoins = coins + 5;
      setCoins(newCoins);
      
      // Save coins using global system
      try {
        const name = await AsyncStorage.getItem("userName");
        if (name) {
          await saveCoins(name, newCoins);
        }
      } catch (error) {
        console.log("Error saving coins:", error);
      }
      
      // Award XP
      addXPToKitty(selectedKickKitty, 10);
      
      setKickResult("🎉 SUCCESS! You kicked the hooman and got 5 coins + 10 XP!");
    } else {
      // Failure: nothing
      setKickResult("💥 FAILED! The hooman dodged your kick!");
    }
    
    setIsKickComplete(true);
  };

  const resetKick = () => {
    setShowKickGame(false);
    setSelectedKickKitty("");
    setKickResult("");
    setIsKickComplete(false);
    loadKittyData(); // Reload to show updated levels
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
      
      {/* Game Selector Button */}
      <Pressable style={styles.gameSelectorButton} onPress={handleGameSelector}>
        <Text style={styles.gameSelectorButtonText}>🎮 Games</Text>
      </Pressable>
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
                ? currentKittyImages.eating
                : isSleeping 
                  ? currentKittyImages.sleeping
                  : currentKittyImages.awake
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
          source={require("../Images_types_of_cats/image.png")}
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

      {/* Debug Button - Sebastian Only */}
      {username?.toLowerCase() === "sebastian" && (
        <Pressable style={styles.debugButton} onPress={handleDebugFeed}>
          <Text style={styles.debugButtonText}>🐛 Debug: Reset Feeding</Text>
        </Pressable>
      )}

      {/* Kitty Gallery Button */}
      <Pressable style={styles.galleryButton} onPress={handleKittyGallery}>
        <Text style={styles.galleryButtonText}>🐱 Kitty Gallery</Text>
      </Pressable>

      {/* Game Selection Modals */}
      {showGameSelector && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>🎮 Select Game</Text>
            <Pressable style={styles.gameOption} onPress={handleKickHooman}>
              <Text style={styles.gameOptionText}>😠 Kick a Hooman in the Butt</Text>
            </Pressable>
            <Pressable style={styles.gameOption} onPress={handleBankHeist}>
              <Text style={styles.gameOptionText}>🦹‍♂️ Bank Heist</Text>
            </Pressable>
            <Pressable style={styles.closeButton} onPress={closeGameModals}>
              <Text style={styles.closeButtonText}>✕ Close</Text>
            </Pressable>
          </View>
        </View>
      )}

      {showBankSelector && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>🏦 Select Bank</Text>
            <Pressable style={styles.bankOption} onPress={() => handleSelectBank("Local Bank")}>
              <Text style={styles.bankOptionText}>🏛️ Local Bank</Text>
              <Text style={styles.bankRiskText}>Low Risk: 1.5x Win / 0.5x Loss</Text>
            </Pressable>
            <Pressable style={styles.cityBankOption} onPress={() => handleSelectBank("City Bank")}>
              <Text style={styles.cityBankOptionText}>🏢 City Bank</Text>
              <Text style={styles.bankRiskText}>High Risk: 3x Win / 0.25x Loss</Text>
            </Pressable>
            <Pressable style={styles.closeButton} onPress={closeGameModals}>
              <Text style={styles.closeButtonText}>✕ Close</Text>
            </Pressable>
          </View>
        </View>
      )}

      {showHeistSetup && (
        <View style={styles.modalOverlay}>
          <View style={styles.heistModal}>
            <Text style={styles.modalTitle}>🦹‍♂️ {selectedBank} Heist Setup</Text>
            
            {/* Brain of Operation */}
            <View style={styles.roleSection}>
              <Text style={styles.roleTitle}>🧠 Brain of Operation:</Text>
              <Pressable 
                style={[styles.roleButton, heistTeam.brain && styles.selectedRole]} 
                onPress={() => handleRolePress('brain')}
              >
                <Text style={styles.roleButtonText}>
                  {heistTeam.brain ? `✓ ${getKittyDisplayName(heistTeam.brain)}` : 'Select Kitty'}
                </Text>
              </Pressable>
              {showKittyDropdown === 'brain' && (
                <View style={styles.dropdownContainer}>
                  <ScrollView style={styles.dropdownScroll}>
                    {getSortedKitties().map((kittyId) => (
                      <Pressable
                        key={`brain-${kittyId}`}
                        style={styles.dropdownOption}
                        onPress={() => handleKittySelect('brain', kittyId)}
                      >
                        <Text style={styles.dropdownOptionText}>{getKittyDisplayName(kittyId)}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Stealer */}
            <View style={styles.roleSection}>
              <Text style={styles.roleTitle}>🦹‍♂️ Stealer:</Text>
              <Pressable 
                style={[styles.roleButton, heistTeam.stealer && styles.selectedRole]} 
                onPress={() => handleRolePress('stealer')}
              >
                <Text style={styles.roleButtonText}>
                  {heistTeam.stealer ? `✓ ${getKittyDisplayName(heistTeam.stealer)}` : 'Select Kitty'}
                </Text>
              </Pressable>
              {showKittyDropdown === 'stealer' && (
                <View style={styles.dropdownContainer}>
                  <ScrollView style={styles.dropdownScroll}>
                    {getSortedKitties().map((kittyId) => (
                      <Pressable
                        key={`stealer-${kittyId}`}
                        style={styles.dropdownOption}
                        onPress={() => handleKittySelect('stealer', kittyId)}
                      >
                        <Text style={styles.dropdownOptionText}>{getKittyDisplayName(kittyId)}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Tank */}
            <View style={styles.roleSection}>
              <Text style={styles.roleTitle}>🛡️ Tank:</Text>
              <Pressable 
                style={[styles.roleButton, heistTeam.tank && styles.selectedRole]} 
                onPress={() => handleRolePress('tank')}
              >
                <Text style={styles.roleButtonText}>
                  {heistTeam.tank ? `✓ ${getKittyDisplayName(heistTeam.tank)}` : 'Select Kitty'}
                </Text>
              </Pressable>
              {showKittyDropdown === 'tank' && (
                <View style={styles.dropdownContainer}>
                  <ScrollView style={styles.dropdownScroll}>
                    {getSortedKitties().map((kittyId) => (
                      <Pressable
                        key={`tank-${kittyId}`}
                        style={styles.dropdownOption}
                        onPress={() => handleKittySelect('tank', kittyId)}
                      >
                        <Text style={styles.dropdownOptionText}>{getKittyDisplayName(kittyId)}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Lucky Charm */}
            <View style={styles.roleSection}>
              <Text style={styles.roleTitle}>🍀 Lucky Charm:</Text>
              <Pressable 
                style={[styles.roleButton, heistTeam.luckyCharm && styles.selectedRole]} 
                onPress={() => handleRolePress('luckyCharm')}
              >
                <Text style={styles.roleButtonText}>
                  {heistTeam.luckyCharm ? `✓ ${getKittyDisplayName(heistTeam.luckyCharm)}` : 'Select Kitty'}
                </Text>
              </Pressable>
              {showKittyDropdown === 'luckyCharm' && (
                <View style={styles.dropdownContainer}>
                  <ScrollView style={styles.dropdownScroll}>
                    {getSortedKitties().map((kittyId) => (
                      <Pressable
                        key={`luckyCharm-${kittyId}`}
                        style={styles.dropdownOption}
                        onPress={() => handleKittySelect('luckyCharm', kittyId)}
                      >
                        <Text style={styles.dropdownOptionText}>{getKittyDisplayName(kittyId)}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Investment Section */}
            <View style={styles.investmentSection}>
              <Text style={styles.investmentTitle}>💰 Investment Amount:</Text>
              <View style={styles.investmentControls}>
                <Pressable 
                  style={styles.investmentButton} 
                  onPress={() => setHeistInvestment(Math.max(5, heistInvestment - 5))}
                >
                  <Text style={styles.investmentButtonText}>-5</Text>
                </Pressable>
                <Text style={styles.investmentAmount}>{heistInvestment} coins</Text>
                <Pressable 
                  style={styles.investmentButton} 
                  onPress={() => setHeistInvestment(Math.min(coins, heistInvestment + 5))}
                >
                  <Text style={styles.investmentButtonText}>+5</Text>
                </Pressable>
              </View>
              <Text style={styles.investmentInfo}>
                Potential reward: {selectedBank === "Local Bank" ? Math.floor(heistInvestment * 1.5) : selectedBank === "City Bank" ? Math.floor(heistInvestment * 3) : heistInvestment * 2} coins
              </Text>
            </View>

            <View style={styles.heistButtons}>
              <Pressable 
                style={[
                  (!heistTeam.brain || !heistTeam.stealer || !heistTeam.tank || !heistTeam.luckyCharm) ? styles.fillRolesButton : styles.startHeistButton
                ]} 
                onPress={(!heistTeam.brain || !heistTeam.stealer || !heistTeam.tank || !heistTeam.luckyCharm) ? autoFillRoles : handleStartHeist}
                disabled={false}
              >
                <Text style={styles.startHeistButtonText}>
                  {(!heistTeam.brain || !heistTeam.stealer || !heistTeam.tank || !heistTeam.luckyCharm) 
                    ? 'Fill All Roles' 
                    : '🚀 Start Heist!'}
                </Text>
              </Pressable>
              <Pressable style={styles.closeButton} onPress={closeGameModals}>
                <Text style={styles.closeButtonText}>✕ Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* Heist Game Modal */}
      {showHeistGame && (
        <View style={styles.modalOverlay}>
          <View style={styles.heistGameModal}>
            <Text style={styles.heistGameTitle}>🦹‍♂️ {selectedBank} Heist in Progress...</Text>
            
            {/* Bank Image Placeholder */}
            <View style={styles.bankImagePlaceholder}>
              <Text style={styles.bankImageText}>🏦 Bank Image Coming Soon</Text>
            </View>
            
            {/* Heist Logs or Level Up Display */}
            {heistResult && heistResult.includes('SUCCESS') && levelUpKitties.length > 0 ? (
              /* Level Up Showcase */
              <View style={styles.levelUpShowcase}>
                <Text style={styles.levelUpShowcaseTitle}>🎉 Mission Success!</Text>
                <Text style={styles.levelUpShowcaseSubtitle}>Your kitties gained experience!</Text>
                
                <ScrollView style={styles.levelUpShowcaseScroll}>
                  {levelUpKitties.map((kittyId) => {
                    const oldLevel = getLevelFromXP((kittyXP[kittyId] || 0) - (selectedBank === "Local Bank" ? 100 : 300));
                    const newLevel = getLevelFromXP(kittyXP[kittyId] || 0);
                    const currentBonuses = kittyStatBonuses[kittyId] || { Speed: 0, Stealth: 0, Intelligence: 0, Luck: 0, Strength: 0 };
                    const totalBonus = currentBonuses.Speed + currentBonuses.Stealth + currentBonuses.Intelligence + currentBonuses.Luck + currentBonuses.Strength;
                    return (
                      <View key={kittyId} style={styles.levelUpShowcaseEntry}>
                        <Text style={styles.levelUpShowcaseKittyName}>{kittyId}</Text>
                        <Text style={styles.levelUpShowcaseLevel}>
                          Level {oldLevel} → Level {newLevel}
                        </Text>
                        <Text style={styles.levelUpShowcaseStats}>
                          +{totalBonus} total stat points
                        </Text>
                        <View style={styles.statBreakdown}>
                          <Text style={styles.statBreakdownText}>
                            Speed: +{currentBonuses.Speed} | Stealth: +{currentBonuses.Stealth} | Intelligence: +{currentBonuses.Intelligence}
                          </Text>
                          <Text style={styles.statBreakdownText}>
                            Luck: +{currentBonuses.Luck} | Strength: +{currentBonuses.Strength}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            ) : (
              /* Heist Logs for failures or during heist */
              <View style={styles.heistLogsContainer}>
                <Text style={styles.heistLogsTitle}>📋 Mission Logs:</Text>
                <ScrollView style={styles.heistLogsScroll}>
                  {heistLogs.map((log, index) => (
                    <View key={index} style={styles.heistLogEntry}>
                      <Text style={styles.heistLogText}>{log}</Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
            
            {/* Action Buttons - Moved up for better visibility */}
            {isHeistComplete && (
              <View style={styles.actionButtonsContainer}>
                {heistResult.includes('SUCCESS') ? (
                  <Pressable style={styles.okButton} onPress={resetHeist}>
                    <Text style={styles.okButtonText}>OK</Text>
                  </Pressable>
                ) : (
                  <Pressable style={styles.resetHeistButton} onPress={resetHeist}>
                    <Text style={styles.resetHeistButtonText}>🔄 Try Another Heist</Text>
                  </Pressable>
                )}
              </View>
            )}
            
            {/* Result */}
            {heistResult && (
              <View style={styles.heistResultContainer}>
                <Text style={[
                  styles.heistResultText,
                  heistResult.includes('SUCCESS') ? styles.successText : styles.failText
                ]}>
                  {heistResult}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Kick Game Modal */}
      {showKickGame && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>😠 Kick a Hooman in the Butt</Text>
            
            {/* Kitty Selection */}
            <View style={styles.roleSection}>
              <Text style={styles.roleTitle}>Select your best kitty:</Text>
              <Pressable 
                style={[styles.roleButton, selectedKickKitty && styles.selectedRole]} 
                onPress={() => setShowKittyDropdown('kick')}
              >
                <Text style={styles.roleButtonText}>
                  {selectedKickKitty ? `✓ ${getKittyDisplayName(selectedKickKitty)}` : 'Select Kitty'}
                </Text>
              </Pressable>
              {showKittyDropdown === 'kick' && (
                <View style={styles.dropdownContainer}>
                  <ScrollView style={styles.dropdownScroll}>
                    {getSortedKitties().map((kittyId) => (
                      <Pressable
                        key={kittyId}
                        style={styles.dropdownOption}
                        onPress={() => handleKickKittySelect(kittyId)}
                      >
                        <Text style={styles.dropdownOptionText}>{getKittyDisplayName(kittyId)}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Game Info */}
            <View style={styles.roleSection}>
              <Text style={styles.roleTitle}>Game Rules:</Text>
              <Text style={styles.gameInfoText}>• 50/50 chance of success</Text>
              <Text style={styles.gameInfoText}>• Success: +5 coins + 10 XP</Text>
              <Text style={styles.gameInfoText}>• Failure: Nothing happens</Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.heistButtons}>
              {!isKickComplete ? (
                <Pressable 
                  style={[styles.startHeistButton, !selectedKickKitty && styles.disabledButton]} 
                  onPress={handleStartKick}
                  disabled={!selectedKickKitty}
                >
                  <Text style={styles.startHeistButtonText}>😠 Kick the Hooman!</Text>
                </Pressable>
              ) : (
                <View style={styles.actionButtonsContainer}>
                  <Pressable style={styles.okButton} onPress={resetKick}>
                    <Text style={styles.okButtonText}>OK</Text>
                  </Pressable>
                </View>
              )}
            </View>

            {/* Result */}
            {kickResult && (
              <View style={styles.heistResultContainer}>
                <Text style={[
                  styles.heistResultText,
                  kickResult.includes('SUCCESS') ? styles.successText : styles.failText
                ]}>
                  {kickResult}
                </Text>
              </View>
            )}

            <Pressable style={styles.closeButton} onPress={closeGameModals}>
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
    justifyContent: "center",
    alignItems: "center",
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
  galleryButton: {
    backgroundColor: "#9c27b0",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
    width: "100%",
  },
  galleryButtonText: {
    fontSize: 16,
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
  gameSelectorButton: {
    position: "absolute",
    top: 50,
    left: 20,
    backgroundColor: "#007aff",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  gameSelectorButtonText: {
    fontSize: 16,
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
  modal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    margin: 20,
    minWidth: 280,
    alignItems: 'center',
  },
  heistModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    margin: 20,
    minWidth: 320,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  gameOption: {
    backgroundColor: '#007aff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 15,
    width: '100%',
    alignItems: 'center',
  },
  gameOptionText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  bankOption: {
    backgroundColor: '#28a745',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 15,
    width: '100%',
    alignItems: 'center',
  },
  bankOptionText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  cityBankOption: {
    backgroundColor: '#dc3545',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 15,
    width: '100%',
    alignItems: 'center',
  },
  cityBankOptionText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  bankRiskText: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
    marginTop: 5,
  },
  roleSection: {
    marginBottom: 15,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  roleButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  selectedRole: {
    backgroundColor: '#d4edda',
    borderColor: '#28a745',
  },
  roleButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  heistButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  startHeistButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    flex: 1,
    alignItems: 'center',
  },
  startHeistButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#ccc',
    opacity: 0.6,
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
  dropdownContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginTop: 5,
    maxHeight: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownScroll: {
    maxHeight: 150,
  },
  dropdownOption: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownOptionText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  investmentSection: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
  },
  investmentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  investmentControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  investmentButton: {
    backgroundColor: '#007aff',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  investmentButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  investmentAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  investmentInfo: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  heistGameModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    margin: 20,
    minWidth: 350,
    maxHeight: '90%',
  },
  heistGameTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  bankImagePlaceholder: {
    height: 150,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  bankImageText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  heistLogsContainer: {
    marginBottom: 20,
  },
  heistLogsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  heistLogsScroll: {
    maxHeight: 200,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 10,
  },
  heistLogEntry: {
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  heistLogText: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'monospace',
  },
  heistResultContainer: {
    marginBottom: 20,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  heistResultText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  successText: {
    color: '#28a745',
  },
  failText: {
    color: '#dc3545',
  },
  resetHeistButton: {
    backgroundColor: '#007aff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  resetHeistButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  levelUpContainer: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#d4edda',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#28a745',
  },
  levelUpTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28a745',
    textAlign: 'center',
    marginBottom: 8,
  },
  levelUpEntry: {
    paddingVertical: 3,
  },
  levelUpText: {
    fontSize: 14,
    color: '#155724',
    textAlign: 'center',
    fontWeight: '500',
  },
  statBonusText: {
    fontSize: 12,
    color: '#28a745',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 2,
  },
  levelUpShowcase: {
    marginBottom: 20,
  },
  levelUpShowcaseTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#28a745',
    textAlign: 'center',
    marginBottom: 5,
  },
  levelUpShowcaseSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
  },
  levelUpShowcaseScroll: {
    maxHeight: 300,
  },
  levelUpShowcaseEntry: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  levelUpShowcaseKittyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 5,
  },
  levelUpShowcaseLevel: {
    fontSize: 14,
    color: '#28a745',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 5,
  },
  levelUpShowcaseStats: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  statBreakdown: {
    backgroundColor: '#fff',
    borderRadius: 5,
    padding: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  statBreakdownText: {
    fontSize: 10,
    color: '#495057',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  actionButtonsContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  okButton: {
    backgroundColor: '#28a745',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  okButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  fillRolesButton: {
    backgroundColor: '#ffc107',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    flex: 1,
    alignItems: 'center',
  },
  gameInfoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
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