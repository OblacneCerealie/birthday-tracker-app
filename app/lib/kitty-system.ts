import AsyncStorage from "@react-native-async-storage/async-storage";

export interface KittyData {
  id: string;
  name: string;
  rarity: 'Basic' | 'Rare' | 'Epic' | 'Legendary';
  level: number;
}

export const KITTY_RARITIES: Record<string, { kitties: string[]; probability: number; color: string }> = {
  Basic: {
    kitties: ['basic', 'street'],
    probability: 50,
    color: '#8B8B8B'
  },
  Rare: {
    kitties: ['tuxedo', 'ginger', 'bgs', 'sphynx'],
    probability: 35,
    color: '#4CAF50'
  },
  Epic: {
    kitties: ['water', 'king'],
    probability: 10,
    color: '#9C27B0'
  },
  Legendary: {
    kitties: ['galactic'], // Galactic Kitty is the legendary kitty
    probability: 5,
    color: '#FFD700'
  }
};

export const getKittyRarity = (kittyId: string): 'Basic' | 'Rare' | 'Epic' | 'Legendary' => {
  for (const [rarity, data] of Object.entries(KITTY_RARITIES)) {
    if (data.kitties.includes(kittyId)) {
      return rarity as 'Basic' | 'Rare' | 'Epic' | 'Legendary';
    }
  }
  return 'Basic'; // Default fallback
};

export const getRandomKitty = (): string => {
  const random = Math.random() * 100;
  let cumulativeProbability = 0;

  for (const [rarity, data] of Object.entries(KITTY_RARITIES)) {
    cumulativeProbability += data.probability;
    if (random <= cumulativeProbability) {
      // Return a random kitty from this rarity tier
      const kitties = data.kitties;
      if (kitties.length > 0) {
        return kitties[Math.floor(Math.random() * kitties.length)];
      }
    }
  }

  // Fallback to basic if no kitties in selected rarity
  return 'basic';
};

export const loadKittyLevels = async (username: string): Promise<Record<string, number>> => {
  try {
    const key = `kittyLevels_${username}`;
    const saved = await AsyncStorage.getItem(key);
    if (saved) {
      return JSON.parse(saved);
    } else {
      // Initialize with basic kitty at level 1
      const initialLevels = { basic: 1 };
      await saveKittyLevels(username, initialLevels);
      return initialLevels;
    }
  } catch (error) {
    console.log("Error loading kitty levels:", error);
    return { basic: 1 };
  }
};

export const saveKittyLevels = async (username: string, levels: Record<string, number>): Promise<void> => {
  try {
    const key = `kittyLevels_${username}`;
    await AsyncStorage.setItem(key, JSON.stringify(levels));
  } catch (error) {
    console.log("Error saving kitty levels:", error);
  }
};

export const addKittyLevel = async (username: string, kittyId: string): Promise<number> => {
  try {
    const levels = await loadKittyLevels(username);
    const currentLevel = levels[kittyId] || 0;
    const newLevel = currentLevel + 1;
    levels[kittyId] = newLevel;
    await saveKittyLevels(username, levels);
    return newLevel;
  } catch (error) {
    console.log("Error adding kitty level:", error);
    return 1;
  }
};

export const getKittyLevel = async (username: string, kittyId: string): Promise<number> => {
  try {
    const levels = await loadKittyLevels(username);
    return levels[kittyId] || 0;
  } catch (error) {
    console.log("Error getting kitty level:", error);
    return 0;
  }
};

export const getEquippedKitty = async (username: string): Promise<string> => {
  try {
    const key = `equippedKitty_${username}`;
    console.log(`Getting equipped kitty for user: ${username} with key: ${key}`);
    const equipped = await AsyncStorage.getItem(key);
    console.log(`Retrieved equipped kitty: ${equipped} (defaulting to basic if null)`);
    return equipped || "basic"; // Default to basic kitty
  } catch (error) {
    console.log("Error getting equipped kitty:", error);
    return "basic";
  }
};

 