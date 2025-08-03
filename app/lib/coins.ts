import AsyncStorage from "@react-native-async-storage/async-storage";

export const COIN_STORAGE_KEY = "kittyCoins";
export const MANAGER_ACCOUNT = "sebastian";

export const getInitialCoins = (username: string): number => {
  // Sebastian gets 10,000 coins as manager account
  if (username.toLowerCase() === MANAGER_ACCOUNT) {
    return 10000;
  }
  // Other users start with 5 coins
  return 5;
};

export const loadCoins = async (username: string): Promise<number> => {
  try {
    const key = `${COIN_STORAGE_KEY}_${username}`;
    const savedCoins = await AsyncStorage.getItem(key);
    if (savedCoins !== null) {
      return parseInt(savedCoins);
    } else {
      // Set initial coins for new users
      const initialCoins = getInitialCoins(username);
      await saveCoins(username, initialCoins);
      return initialCoins;
    }
  } catch (error) {
    console.log("Error loading coins:", error);
    return getInitialCoins(username);
  }
};

export const saveCoins = async (username: string, coins: number): Promise<void> => {
  try {
    const key = `${COIN_STORAGE_KEY}_${username}`;
    await AsyncStorage.setItem(key, coins.toString());
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