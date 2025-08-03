import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActionSheetIOS,
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
  CONTACT_CATEGORIES,
  getAgeDisplay,
  getSebastianBirthdays,
  getUserBirthdays,
  saveBirthday,
  saveSebastianBirthday,
  birthdays as sebastianBirthdays,
} from "./lib/birthdays";

type Birthday = { name: string; date: string };
type GroupedBirthdays = { [letter: string]: Birthday[] };
type BirthdayWithNotes = Birthday & { notes?: string };

export default function AllBirthdays() {
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [isSebastian, setIsSebastian] = useState(false);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [editingBirthday, setEditingBirthday] = useState<Birthday | null>(null);
  const [editName, setEditName] = useState("");
  const [editDate, setEditDate] = useState("");
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);
  const [editSelectedDate, setEditSelectedDate] = useState(new Date());
  const [expandedContact, setExpandedContact] = useState<Birthday | null>(null);
  const [contactNotes, setContactNotes] = useState<Record<string, string>>({});
  const [editingNotes, setEditingNotes] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [contactCategories, setContactCategories] = useState<Record<string, string>>({});
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

  // Load contact notes and categories when birthdays change
  useEffect(() => {
    if (birthdays.length > 0) {
      loadContactNotes();
      loadContactCategories();
    }
  }, [birthdays]);

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

  const handleLongPress = (birthday: Birthday) => {
    // Check if this birthday is from the read-only list (Sebastian's birthdays)
    const isReadOnlyBirthday = sebastianBirthdays.some(
      (b) => b.name === birthday.name && b.date === birthday.date
    );
    
    if (isSebastian && isReadOnlyBirthday) {
      Alert.alert("Not allowed", "You can't modify birthdays from the read-only list.");
      return;
    }

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Edit', 'Delete'],
          destructiveButtonIndex: 2,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            // Edit
            setEditingBirthday(birthday);
            setEditName(birthday.name);
            setEditDate(birthday.date);
            setEditSelectedDate(new Date(birthday.date));
          } else if (buttonIndex === 2) {
            // Delete
            confirmDelete(birthday);
          }
        }
      );
    } else {
      // For Android, use Alert with options
      Alert.alert(
        "Contact Options",
        `What would you like to do with ${birthday.name}?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Edit", onPress: () => {
            setEditingBirthday(birthday);
            setEditName(birthday.name);
            setEditDate(birthday.date);
            setEditSelectedDate(new Date(birthday.date));
          }},
          { text: "Delete", style: "destructive", onPress: () => confirmDelete(birthday) },
        ],
        { cancelable: true }
      );
    }
  };

  const handleEdit = async () => {
    if (!editName || !editDate) {
      Alert.alert("Error", "Please enter a name and select a date.");
      return;
    }

    if (/\d/.test(editName)) {
      Alert.alert("Invalid Name", "Names cannot contain numbers.");
      return;
    }

    if (!editingBirthday) return;

    try {
      if (isSebastian) {
        // For Sebastian, update in personal list
        const sebastianPersonalBdays = await getSebastianBirthdays();
        const updated = sebastianPersonalBdays.map(b => 
          b.name === editingBirthday.name && b.date === editingBirthday.date
            ? { name: editName, date: editDate }
            : b
        );
        
        await AsyncStorage.setItem("sebastianBirthdays", JSON.stringify(updated));
        
        // Update the display with Sebastian's personal birthdays + read-only list
        const uniqueSebastianBdays = updated.filter(userBday => 
          !sebastianBirthdays.some(readOnlyBday => 
            readOnlyBday.name === userBday.name && readOnlyBday.date === userBday.date
          )
        );
        
        const combined = [...uniqueSebastianBdays, ...sebastianBirthdays];
        setBirthdays(combined);
      } else {
        // For other users, update in shared list
        const userBdays = await getUserBirthdays();
        const updated = userBdays.map(b => 
          b.name === editingBirthday.name && b.date === editingBirthday.date
            ? { name: editName, date: editDate }
            : b
        );
        
        await AsyncStorage.setItem("userBirthdays", JSON.stringify(updated));
        setBirthdays(updated);
      }
      
      // Reset edit state
      setEditingBirthday(null);
      setEditName("");
      setEditDate("");
    } catch (e: any) {
      Alert.alert("Error", e.message || "Something went wrong.");
    }
  };

  const cancelEdit = () => {
    setEditingBirthday(null);
    setEditName("");
    setEditDate("");
  };

  const onEditDateChange = (event: any, selectedDate?: Date) => {
    setShowEditDatePicker(false);
    if (selectedDate) {
      setEditSelectedDate(selectedDate);
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      setEditDate(`${year}-${month}-${day}`);
    }
  };

  const showEditDatePickerModal = () => {
    setShowEditDatePicker(true);
  };

  const handleContactPress = (contact: Birthday) => {
    if (expandedContact && expandedContact.name === contact.name && expandedContact.date === contact.date) {
      // If clicking the same contact, collapse it
      setExpandedContact(null);
      setEditingNotes("");
    } else {
      // Expand the clicked contact and collapse any other
      setExpandedContact(contact);
      setEditingNotes(contactNotes[`${contact.name}_${contact.date}`] || "");
    }
  };

  const saveContactNotes = async (contact: Birthday) => {
    try {
      const key = `contactNotes_${contact.name}_${contact.date}`;
      const updatedNotes = { ...contactNotes };
      updatedNotes[`${contact.name}_${contact.date}`] = editingNotes;
      setContactNotes(updatedNotes);
      
      await AsyncStorage.setItem(key, editingNotes);
      console.log(`Notes saved for ${contact.name}`);
    } catch (error) {
      console.log("Error saving contact notes:", error);
    }
  };

  const loadContactNotes = async () => {
    try {
      const notes: Record<string, string> = {};
      for (const contact of birthdays) {
        const key = `contactNotes_${contact.name}_${contact.date}`;
        const savedNotes = await AsyncStorage.getItem(key);
        if (savedNotes) {
          notes[`${contact.name}_${contact.date}`] = savedNotes;
        }
      }
      setContactNotes(notes);
    } catch (error) {
      console.log("Error loading contact notes:", error);
    }
  };

  const loadContactCategories = async () => {
    try {
      const categories: Record<string, string> = {};
      for (const contact of birthdays) {
        const key = `contactCategory_${contact.name}_${contact.date}`;
        const savedCategory = await AsyncStorage.getItem(key);
        if (savedCategory) {
          categories[`${contact.name}_${contact.date}`] = savedCategory;
        }
      }
      setContactCategories(categories);
    } catch (error) {
      console.log("Error loading contact categories:", error);
    }
  };

  const saveContactCategory = async (contact: Birthday, category: string) => {
    try {
      const key = `contactCategory_${contact.name}_${contact.date}`;
      const updatedCategories = { ...contactCategories };
      updatedCategories[`${contact.name}_${contact.date}`] = category;
      setContactCategories(updatedCategories);
      
      await AsyncStorage.setItem(key, category);
      console.log(`Category saved for ${contact.name}: ${category}`);
    } catch (error) {
      console.log("Error saving contact category:", error);
    }
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

  // Filter birthdays based on search query and category
  const filteredBirthdays = birthdays.filter(birthday => {
    const matchesSearch = birthday.name.toLowerCase().includes(searchQuery.toLowerCase());
    const category = contactCategories[`${birthday.name}_${birthday.date}`] || "Other";
    const matchesCategory = selectedCategory === "All" || category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const groupedBirthdays = groupByLetter(filteredBirthdays);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={80}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>🎂 All Birthdays</Text>
        
        <Text style={styles.hintText}>💡 Tap to expand contacts and add notes/categories • Long press to edit or delete</Text>

        {/* Search Bar */}
        <TextInput
          placeholder="Search birthdays..."
          placeholderTextColor="#666"
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {/* Category Filter */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoryContainer}
        >
          {["All", ...CONTACT_CATEGORIES].map((category) => (
            <Pressable
              key={category}
              style={[
                styles.categoryButton,
                selectedCategory === category && styles.selectedCategoryButton
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[
                styles.categoryButtonText,
                selectedCategory === category && styles.selectedCategoryButtonText
              ]}>
                {category}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {Object.keys(groupedBirthdays).length === 0 ? (
          <Text style={{ marginBottom: 20, textAlign: 'center', color: '#666' }}>
            {searchQuery ? 'No birthdays found matching your search.' : 'No birthdays yet.'}
          </Text>
        ) : (
          Object.keys(groupedBirthdays).map((letter) => (
            <View key={letter}>
              <Text style={styles.letter}>{letter} –</Text>
              {groupedBirthdays[letter].map((b, i) => (
                <View key={i} style={styles.contactContainer}>
                  <Pressable
                    onLongPress={() => handleLongPress(b)}
                    onPress={() => handleContactPress(b)}
                    delayLongPress={400}
                    style={({ pressed }) => [
                      styles.cardContainer,
                      pressed && styles.cardPressed
                    ]}
                  >
                    <View style={[
                      styles.card,
                      expandedContact && expandedContact.name === b.name && expandedContact.date === b.date && styles.expandedCard
                    ]}>
                      <View style={styles.contactHeader}>
                        <Text style={styles.name}>{b.name}</Text>
                        <Text style={styles.ageText}>{getAgeDisplay(b.date)}</Text>
                      </View>
                      <Text style={styles.dateText}>{b.date}</Text>
                      
                      {/* Category Display */}
                      <View style={styles.categoryDisplay}>
                        <Text style={styles.categoryLabel}>
                          {contactCategories[`${b.name}_${b.date}`] || "Other"}
                        </Text>
                      </View>
                      
                      {expandedContact && expandedContact.name === b.name && expandedContact.date === b.date && (
                        <Text style={styles.expandIndicator}>▼</Text>
                      )}
                    </View>
                  </Pressable>
                  
                  {/* Expanded Notes Section */}
                  {expandedContact && expandedContact.name === b.name && expandedContact.date === b.date && (
                    <View style={styles.notesContainer}>
                      {/* Category Selection */}
                      <Text style={styles.notesLabel}>🏷️ Category:</Text>
                      <View style={styles.categorySelection}>
                        {CONTACT_CATEGORIES.map((category) => (
                          <Pressable
                            key={category}
                            style={[
                              styles.categoryOption,
                              contactCategories[`${b.name}_${b.date}`] === category && styles.selectedCategoryOption
                            ]}
                            onPress={() => saveContactCategory(b, category)}
                          >
                            <Text style={[
                              styles.categoryOptionText,
                              contactCategories[`${b.name}_${b.date}`] === category && styles.selectedCategoryOptionText
                            ]}>
                              {category}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                      
                      <Text style={styles.notesLabel}>📝 Notes:</Text>
                      <TextInput
                        placeholder="Add notes about this person..."
                        placeholderTextColor="#666"
                        style={styles.notesInput}
                        value={editingNotes}
                        onChangeText={setEditingNotes}
                        multiline
                        numberOfLines={4}
                      />
                      <View style={styles.notesButtons}>
                        <Pressable 
                          style={[styles.notesButton, styles.saveNotesButton]} 
                          onPress={() => saveContactNotes(b)}
                        >
                          <Text style={styles.saveNotesButtonText}>Save Notes</Text>
                        </Pressable>
                        <Pressable 
                          style={[styles.notesButton, styles.cancelNotesButton]} 
                          onPress={() => setEditingNotes(contactNotes[`${b.name}_${b.date}`] || "")}
                        >
                          <Text style={styles.cancelNotesButtonText}>Reset</Text>
                        </Pressable>
                      </View>
                    </View>
                  )}
                </View>
              ))}
            </View>
          ))
        )}

        {/* Edit Modal */}
        {editingBirthday && (
          <View style={styles.editModal}>
            <Text style={styles.editTitle}>Edit Contact</Text>
            
            <TextInput
              placeholder="Name"
              placeholderTextColor="#222"
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
            />
            
            <Pressable style={styles.dateButton} onPress={showEditDatePickerModal}>
              <Text style={styles.dateButtonText}>
                {editDate ? `Selected: ${editDate}` : "Select Birthday Date"}
              </Text>
            </Pressable>

            {showEditDatePicker && (
              <DateTimePicker
                value={editSelectedDate}
                mode="date"
                display="default"
                onChange={onEditDateChange}
                maximumDate={new Date()}
              />
            )}

            <View style={styles.editButtons}>
              <Pressable style={[styles.editButton, styles.cancelButton]} onPress={cancelEdit}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.editButton, styles.saveButton]} onPress={handleEdit}>
                <Text style={styles.saveButtonText}>Save</Text>
              </Pressable>
            </View>
          </View>
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
  hintText: {
    fontSize: 14,
    textAlign: "center",
    color: "#666",
    marginBottom: 15,
    fontStyle: "italic",
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
  cardContainer: {
    marginBottom: 10,
  },
  card: {
    backgroundColor: "#f5f5f5",
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#007aff",
  },
  cardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
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
  editModal: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    marginTop: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  editTitle: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
  },
  editButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
  },
  editButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 100,
    alignItems: "center",
  },
  saveButton: {
    backgroundColor: "#007aff",
    borderWidth: 1,
    borderColor: "#007aff",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  cancelButton: {
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  cancelButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "500",
  },
  contactContainer: {
    marginBottom: 10,
  },
  expandedCard: {
    borderColor: "#007aff",
    backgroundColor: "#f0f8ff",
  },
  expandIndicator: {
    fontSize: 12,
    color: "#007aff",
    textAlign: "center",
    marginTop: 5,
  },
  notesContainer: {
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 8,
    marginTop: 5,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    borderRadius: 6,
    fontSize: 14,
    backgroundColor: "#fff",
    minHeight: 80,
    textAlignVertical: "top",
  },
  notesButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  notesButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    minWidth: 80,
    alignItems: "center",
  },
  saveNotesButton: {
    backgroundColor: "#28a745",
    borderWidth: 1,
    borderColor: "#28a745",
  },
  saveNotesButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  cancelNotesButton: {
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  cancelNotesButtonText: {
    color: "#333",
    fontSize: 14,
    fontWeight: "500",
  },
  categoryContainer: {
    marginBottom: 15,
  },
  categoryButton: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  selectedCategoryButton: {
    backgroundColor: "#007aff",
    borderColor: "#007aff",
  },
  categoryButtonText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  selectedCategoryButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  contactHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  ageText: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
  },
  categoryDisplay: {
    marginTop: 5,
  },
  categoryLabel: {
    fontSize: 11,
    color: "#007aff",
    backgroundColor: "#f0f8ff",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: "flex-start",
    fontWeight: "500",
  },
  categorySelection: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 15,
  },
  categoryOption: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  selectedCategoryOption: {
    backgroundColor: "#007aff",
    borderColor: "#007aff",
  },
  categoryOptionText: {
    fontSize: 12,
    color: "#333",
    fontWeight: "500",
  },
  selectedCategoryOptionText: {
    color: "#fff",
    fontWeight: "600",
  },
});
