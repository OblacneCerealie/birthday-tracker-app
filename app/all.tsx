import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
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
  getUserBirthdays,
  saveBirthday,
  birthdays as sebastianBirthdays,
} from "./lib/birthdays";

type Birthday = { name: string; date: string };
type GroupedBirthdays = { [letter: string]: Birthday[] };

const STORAGE_KEY = "userBirthdays";

export default function AllBirthdays() {
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [isSebastian, setIsSebastian] = useState(false);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    const load = async () => {
      const userName = await AsyncStorage.getItem("userName");

      if (userName?.toLowerCase() === "sebastian") {
        setIsSebastian(true);
        setBirthdays([...sebastianBirthdays]);
      } else {
        setIsSebastian(false);
        const userBdays = await getUserBirthdays();
        setBirthdays(userBdays);
      }
    };

    load();
  }, []);

  const handleAdd = async () => {
    if (isSebastian) {
      Alert.alert("Not allowed", "You can't modify Sebastian's birthday list.");
      return;
    }

    if (!name || !date) {
      Alert.alert("Error", "Please enter a name and select a date.");
      return;
    }

    if (/\d/.test(name)) {
      Alert.alert("Invalid Name", "Names cannot contain numbers.");
      return;
    }

    try {
      await saveBirthday({ name, date });
      const updated = await getUserBirthdays();
      setBirthdays(updated);
      setName("");
      setDate("");
    } catch (e: any) {
      Alert.alert("Error", e.message || "Something went wrong.");
    }
  };

  const deleteBirthday = async (toDelete: Birthday) => {
    if (isSebastian) return;

    const filtered = birthdays.filter(
      (b) => b.name !== toDelete.name || b.date !== toDelete.date
    );
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    setBirthdays(filtered);
  };

  const confirmDelete = (b: Birthday) => {
    if (isSebastian) return;

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

        <Button
          title={isSebastian ? "Disabled for Sebastian" : "Add Birthday"}
          onPress={handleAdd}
          disabled={isSebastian}
        />
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
});
