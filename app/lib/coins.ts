import AsyncStorage from "@react-native-async-storage/async-storage";

export const COIN_STORAGE_KEY = "kittyCoins";
export const MANAGER_ACCOUNT = "sebastian";

// In-memory cache to prevent race conditions and improve performance
let coinCache: { [username: string]: number } = {};
let cacheTimestamp: { [username: string]: number } = {};
const CACHE_DURATION = 5000; // 5 seconds cache

export const getInitialCoins = (username: string): number => {
  // Sebastian gets 10,000 coins as manager account
  if (username.toLowerCase() === MANAGER_ACCOUNT) {
    return 10000;
  }
  // Other users start with 5 coins
  return 5;
};

export const loadCoins = async (username: string, forceRefresh: boolean = false): Promise<number> => {
  try {
    const now = Date.now();
    
    // Check if we have fresh cached data (unless force refresh is requested)
    if (!forceRefresh && 
        coinCache[username] !== undefined && 
        cacheTimestamp[username] && 
        (now - cacheTimestamp[username]) < CACHE_DURATION) {
      return coinCache[username];
    }
    
    const key = `${COIN_STORAGE_KEY}_${username}`;
    const savedCoins = await AsyncStorage.getItem(key);
    let coins: number;
    
    if (savedCoins !== null) {
      coins = parseInt(savedCoins);
    } else {
      // Set initial coins for new users
      coins = getInitialCoins(username);
      await AsyncStorage.setItem(key, coins.toString());
    }
    
    // Update cache
    coinCache[username] = coins;
    cacheTimestamp[username] = now;
    
    return coins;
  } catch (error) {
    console.log("Error loading coins:", error);
    const fallbackCoins = getInitialCoins(username);
    
    // Cache the fallback too
    coinCache[username] = fallbackCoins;
    cacheTimestamp[username] = Date.now();
    
    return fallbackCoins;
  }
};

export const saveCoins = async (username: string, coins: number): Promise<void> => {
  try {
    const key = `${COIN_STORAGE_KEY}_${username}`;
    await AsyncStorage.setItem(key, coins.toString());
    
    // Update cache immediately to prevent inconsistencies
    coinCache[username] = coins;
    cacheTimestamp[username] = Date.now();
  } catch (error) {
    console.log("Error saving coins:", error);
  }
};

export const spendCoins = async (username: string, amount: number): Promise<boolean> => {
  try {
    const currentCoins = await loadCoins(username);
    if (currentCoins >= amount) {
      const newCoins = currentCoins - amount;
      await saveCoins(username, newCoins);
      return true;
    }
    return false;
  } catch (error) {
    console.log("Error spending coins:", error);
    return false;
  }
};

export const addCoins = async (username: string, amount: number): Promise<void> => {
  try {
    const currentCoins = await loadCoins(username);
    const newCoins = currentCoins + amount;
    await saveCoins(username, newCoins);
  } catch (error) {
    console.log("Error adding coins:", error);
  }
};

// Helper function to clear cache (useful for testing or when switching users)
export const clearCoinCache = (username?: string): void => {
  if (username) {
    delete coinCache[username];
    delete cacheTimestamp[username];
  } else {
    coinCache = {};
    cacheTimestamp = {};
  }
};

// Helper function to get current cached coins without async call (useful for UI updates)
export const getCachedCoins = (username: string): number | null => {
  const now = Date.now();
  if (coinCache[username] !== undefined && 
      cacheTimestamp[username] && 
      (now - cacheTimestamp[username]) < CACHE_DURATION) {
    return coinCache[username];
  }
  return null;
}; 