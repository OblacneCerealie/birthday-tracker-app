import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  getSebastianBirthdays,
  getUserBirthdays,
  saveBirthday,
  saveSebastianBirthday,
  birthdays as sebastianBirthdays,
} from "./lib/birthdays";

type Birthday = { name: string; date: string };
type GroupedBirthdays = { [letter: string]: Birthday[] };

export default function AllBirthdays() {
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [isSebastian, setIsSebastian] = useState(false);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const userName = await AsyncStorage.getItem("userName");

      if (userName?.toLowerCase() === "sebastian") {
        setIsSebastian(true);
        // Sebastian gets both their personal birthdays and the read-only list
        const sebastianPersonalBdays = await getSebastianBirthdays();
        
        // Remove duplicates by checking if a birthday already exists in the read-only list
        const uniqueSebastianBdays = sebastianPersonalBdays.filter(userBday => 
          !sebastianBirthdays.some(readOnlyBday => 
            readOnlyBday.name === userBday.name && readOnlyBday.date === userBday.date
          )
        );
        
        const combined = [...uniqueSebastianBdays, ...sebastianBirthdays];
        setBirthdays(combined);
      } else {
        setIsSebastian(false);
        // Other users only get their personal birthdays
        const userBdays = await getUserBirthdays();
        
        // Filter out any read-only birthdays that might have been accidentally added
        const filteredUserBdays = userBdays.filter(userBday => 
          !sebastianBirthdays.some(readOnlyBday => 
            readOnlyBday.name === userBday.name && readOnlyBday.date === userBday.date
          )
        );
        
        setBirthdays(filteredUserBdays);
      }
    };

    load();
  }, []);

  const handleAdd = async () => {
    if (!name || !date) {
      Alert.alert("Error", "Please enter a name and select a date.");
      return;
    }

    if (/\d/.test(name)) {
      Alert.alert("Invalid Name", "Names cannot contain numbers.");
      return;
    }

    try {
      if (isSebastian) {
        // For Sebastian, save to personal list
        await saveSebastianBirthday({ name, date });
        
        // Update the display with Sebastian's personal birthdays + read-only list
        const sebastianPersonalBdays = await getSebastianBirthdays();
        
        // Remove duplicates by checking if a birthday already exists in the read-only list
        const uniqueSebastianBdays = sebastianPersonalBdays.filter(userBday => 
          !sebastianBirthdays.some(readOnlyBday => 
            readOnlyBday.name === userBday.name && readOnlyBday.date === userBday.date
          )
        );
        
        const combined = [...uniqueSebastianBdays, ...sebastianBirthdays];
        setBirthdays(combined);
      } else {
        // For other users, save to shared list
        await saveBirthday({ name, date });
        
        // Update the display with their personal birthdays
        const updated = await getUserBirthdays();
        setBirthdays(updated);
      }
      
      setName("");
      setDate("");
    } catch (e: any) {
      Alert.alert("Error", e.message || "Something went wrong.");
    }
  };

  const deleteBirthday = async (toDelete: Birthday) => {
    // Check if this birthday is from the read-only list (Sebastian's birthdays)
    const isReadOnlyBirthday = sebastianBirthdays.some(
      (b) => b.name === toDelete.name && b.date === toDelete.date
    );
    
    if (isSebastian && isReadOnlyBirthday) {
      Alert.alert("Not allowed", "You can't delete birthdays from the read-only list.");
      return;
    }

    if (isSebastian) {
      // For Sebastian, delete from personal list
      const sebastianPersonalBdays = await getSebastianBirthdays();
      const filtered = sebastianPersonalBdays.filter(
        (b) => b.name !== toDelete.name || b.date !== toDelete.date
      );
      
      await AsyncStorage.setItem("sebastianBirthdays", JSON.stringify(filtered));
      
      // Update display with remaining personal birthdays + read-only list
      const uniqueSebastianBdays = filtered.filter(userBday => 
        !sebastianBirthdays.some(readOnlyBday => 
          readOnlyBday.name === userBday.name && readOnlyBday.date === userBday.date
        )
      );
      
      const combined = [...uniqueSebastianBdays, ...sebastianBirthdays];
      setBirthdays(combined);
    } else {
      // For other users, delete from shared list
      const userBdays = await getUserBirthdays();
      const filtered = userBdays.filter(
        (b) => b.name !== toDelete.name || b.date !== toDelete.date
      );
      
      await AsyncStorage.setItem("userBirthdays", JSON.stringify(filtered));
      setBirthdays(filtered);
    }
  };

  const confirmDelete = (b: Birthday) => {
    // Check if this birthday is from the read-only list (Sebastian's birthdays)
    const isReadOnlyBirthday = sebastianBirthdays.some(
      (bday) => bday.name === b.name && bday.date === b.date
    );
    
    if (isSebastian && isReadOnlyBirthday) {
      Alert.alert("Not allowed", "You can't delete birthdays from the read-only list.");
      return;
    }

    Alert.alert(
      "Delete Contact",
      `Do you want to delete ${b.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteBirthday(b),
        },
      ],
      { cancelable: true }
    );
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setSelectedDate(selectedDate);
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      setDate(`${year}-${month}-${day}`);
    }
  };

  const showDatePickerModal = () => {
    setShowDatePicker(true);
  };

  const groupByLetter = (list: Birthday[]) => {
    const sorted = [...list].sort((a, b) => a.name.localeCompare(b.name));
    const grouped: GroupedBirthdays = {};

    for (const b of sorted) {
      const firstLetter = b.name[0].toUpperCase();
      if (!grouped[firstLetter]) {
        grouped[firstLetter] = [];
      }
      grouped[firstLetter].push(b);
    }

    return grouped;
  };

  // Filter birthdays based on search query
  const filteredBirthdays = birthdays.filter(birthday =>
    birthday.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedBirthdays = groupByLetter(filteredBirthdays);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={80}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>🎂 All Birthdays</Text>

        {/* Search Bar */}
        <TextInput
          placeholder="Search birthdays..."
          placeholderTextColor="#666"
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {Object.keys(groupedBirthdays).length === 0 ? (
          <Text style={{ marginBottom: 20, textAlign: 'center', color: '#666' }}>
            {searchQuery ? 'No birthdays found matching your search.' : 'No birthdays yet.'}
          </Text>
        ) : (
          Object.keys(groupedBirthdays).map((letter) => (
            <View key={letter}>
              <Text style={styles.letter}>{letter} –</Text>
              {groupedBirthdays[letter].map((b, i) => (
                <Pressable
                  key={i}
                  onLongPress={() => confirmDelete(b)}
                  delayLongPress={400}
                >
                  <View style={styles.card}>
                    <Text style={styles.name}>{b.name}</Text>
                    <Text style={styles.dateText}>{b.date}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          ))
        )}

        <Text style={styles.subtitle}>➕ Add New Birthday</Text>
        <TextInput
          placeholder="Name"
          placeholderTextColor="#222"
          style={styles.input}
          value={name}
          onChangeText={setName}
        />
        
        {/* Date Picker Button */}
        <Pressable style={styles.dateButton} onPress={showDatePickerModal}>
          <Text style={styles.dateButtonText}>
            {date ? `Selected: ${date}` : "Select Birthday Date"}
          </Text>
        </Pressable>

        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={onDateChange}
            maximumDate={new Date()}
          />
        )}

        {isSebastian ? (
          <View style={{ gap: 10 }}>
            <Button
              title="➕ Add to Sebastian's Personal List"
              onPress={handleAdd}
            />
            <Text style={{ textAlign: 'center', color: '#666', fontSize: 12 }}>
              This birthday will only appear for Sebastian
            </Text>
          </View>
        ) : (
          <Button
            title="Add Birthday"
            onPress={handleAdd}
          />
        )}

        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Back to Home</Text>
        </Pressable>

        {/* See Your Kitty Button */}
        <Pressable 
          style={[styles.backButton, { backgroundColor: '#ff69b4', marginTop: 15 }]} 
          onPress={() => router.push("/kitty")}
        >
          <Text style={[styles.backButtonText, { color: '#fff' }]}>🐱 See Your Kitty</Text>
        </Pressable>

        {/* Temporary button to clear corrupted data */}
        {!isSebastian && (
          <Pressable 
            style={[styles.backButton, { backgroundColor: '#ff6b6b', marginTop: 10 }]} 
            onPress={async () => {
              await AsyncStorage.removeItem("userBirthdays");
              const userBdays = await getUserBirthdays();
              setBirthdays(userBdays);
              Alert.alert("Data Cleared", "All birthdays have been cleared. You can now add your own birthdays.");
            }}
          >
            <Text style={[styles.backButtonText, { color: '#fff' }]}>🗑️ Clear All Data (Debug)</Text>
          </Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#fff", flexGrow: 1 },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  subtitle: { fontSize: 20, marginTop: 30, marginBottom: 10 },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: "#f8f8f8",
  },
  card: {
    backgroundColor: "#f5f5f5",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#007aff",
  },
  name: { fontSize: 18, fontWeight: "bold", color: "#333" },
  dateText: { fontSize: 14, color: "#666", marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  dateButton: {
    borderWidth: 1,
    borderColor: "#007aff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: "#f0f8ff",
  },
  dateButtonText: {
    fontSize: 16,
    textAlign: "center",
    color: "#007aff",
    fontWeight: "500",
  },
  letter: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 8,
    color: "#444",
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
});
