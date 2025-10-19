import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
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
} from "../lib/birthdays";
import { useTheme } from "../lib/theme";
import FloatingSettingsButton from "./components/FloatingSettingsButton";

type Birthday = { name: string; date: string };
type GroupedBirthdays = { [letter: string]: Birthday[] };
type BirthdayWithNotes = Birthday & { notes?: string };

export default function AllBirthdays() {
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [isSebastian, setIsSebastian] = useState(false);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // New date picker states - separate day, month, year
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  
  const [editingBirthday, setEditingBirthday] = useState<Birthday | null>(null);
  const [editName, setEditName] = useState("");
  const [editDate, setEditDate] = useState("");
  
  // Edit date picker states
  const [editSelectedDay, setEditSelectedDay] = useState<string>("");
  const [editSelectedMonth, setEditSelectedMonth] = useState<string>("");
  const [editSelectedYear, setEditSelectedYear] = useState<string>("");
  
  const [expandedContact, setExpandedContact] = useState<Birthday | null>(null);
  const [contactNotes, setContactNotes] = useState<Record<string, string>>({});
  const [editingNotes, setEditingNotes] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [contactCategories, setContactCategories] = useState<Record<string, string>>({});
  const [sortMode, setSortMode] = useState<"alphabetical" | "upcoming">("alphabetical");

  const router = useRouter();
  const { colors } = useTheme();

  // Helper to generate years (from 1900 to current year)
  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear; year >= 1900; year--) {
      years.push(year.toString());
    }
    return years;
  };

  // Helper to generate days based on selected month and year
  const generateDays = (month: string, year: string) => {
    if (!month || !year) return Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));
    
    const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString().padStart(2, '0'));
  };

  // Month names for display
  const months = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  // Update date string when day/month/year changes
  useEffect(() => {
    if (selectedDay && selectedMonth && selectedYear) {
      setDate(`${selectedYear}-${selectedMonth}-${selectedDay}`);
    } else {
      setDate("");
    }
  }, [selectedDay, selectedMonth, selectedYear]);

  // Update edit date string when edit day/month/year changes
  useEffect(() => {
    if (editSelectedDay && editSelectedMonth && editSelectedYear) {
      setEditDate(`${editSelectedYear}-${editSelectedMonth}-${editSelectedDay}`);
    }
  }, [editSelectedDay, editSelectedMonth, editSelectedYear]);

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
      setSelectedDay("");
      setSelectedMonth("");
      setSelectedYear("");
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


  const handleLongPress = (birthday: Birthday) => {
    // Check if this birthday is from the read-only list (Sebastian's birthdays)
    const isReadOnlyBirthday = sebastianBirthdays.some(
      (b) => b.name === birthday.name && b.date === birthday.date
    );
    
    if (isSebastian && isReadOnlyBirthday) {
      Alert.alert("Not allowed", "You can't modify birthdays from the read-only list.");
      return;
    }

    const startEdit = () => {
      setEditingBirthday(birthday);
      setEditName(birthday.name);
      setEditDate(birthday.date);
      
      // Split the date into parts for the pickers
      const [year, month, day] = birthday.date.split("-");
      setEditSelectedDay(day);
      setEditSelectedMonth(month);
      setEditSelectedYear(year);
    };

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Edit', 'Delete'],
          destructiveButtonIndex: 2,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            startEdit();
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
          { text: "Edit", onPress: startEdit },
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
    setEditSelectedDay("");
    setEditSelectedMonth("");
    setEditSelectedYear("");
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



  // Helper function to calculate days until next birthday
  const getDaysUntilBirthday = (dateStr: string): number => {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const [year, month, day] = dateStr.split("-").map(Number);
    const thisYear = new Date(today.getFullYear(), month - 1, day);
    const thisYearStart = new Date(thisYear.getFullYear(), thisYear.getMonth(), thisYear.getDate());
    
    // If birthday is today or in the future this year, return days until this year's birthday
    if (thisYearStart >= todayStart) {
      return Math.round((+thisYearStart - +todayStart) / (1000 * 60 * 60 * 24));
    }
    
    // Otherwise, return days until next year's birthday
    const nextYear = new Date(today.getFullYear() + 1, month - 1, day);
    const nextYearStart = new Date(nextYear.getFullYear(), nextYear.getMonth(), nextYear.getDate());
    return Math.round((+nextYearStart - +todayStart) / (1000 * 60 * 60 * 24));
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

  const sortByUpcoming = (list: Birthday[]): Birthday[] => {
    return [...list].sort((a, b) => {
      const daysA = getDaysUntilBirthday(a.date);
      const daysB = getDaysUntilBirthday(b.date);
      return daysA - daysB;
    });
  };

  const groupByUpcomingMonth = (list: Birthday[]) => {
    const sorted = sortByUpcoming(list);
    const grouped: { [monthYear: string]: Birthday[] } = {};
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    for (const b of sorted) {
      const [year, month, day] = b.date.split("-").map(Number);
      const today = new Date();
      const thisYear = new Date(today.getFullYear(), month - 1, day);
      
      // Determine if this birthday is this year or next year
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const thisYearStart = new Date(thisYear.getFullYear(), thisYear.getMonth(), thisYear.getDate());
      
      let targetYear = today.getFullYear();
      if (thisYearStart < todayStart) {
        targetYear = today.getFullYear() + 1;
      }
      
      const monthYearKey = `${monthNames[month - 1]} ${targetYear}`;
      
      if (!grouped[monthYearKey]) {
        grouped[monthYearKey] = [];
      }
      grouped[monthYearKey].push(b);
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

  // Apply sorting based on selected mode
  const groupedBirthdays = sortMode === "alphabetical" ? groupByLetter(filteredBirthdays) : {};
  const upcomingGroupedBirthdays = sortMode === "upcoming" ? groupByUpcomingMonth(filteredBirthdays) : {};

  const styles = createStyles(colors);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={80}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <FloatingSettingsButton />
        
        <Text style={styles.title}>🎂 All Birthdays</Text>
        
        <Text style={styles.hintText}>💡 Tap to expand contacts and add notes/categories • Long press to edit or delete</Text>

        {/* Search Bar */}
        <TextInput
          placeholder="Search birthdays..."
          placeholderTextColor={colors.secondaryText}
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

        {/* Sort Mode Toggle */}
        <View style={styles.sortContainer}>
          <Text style={styles.sortLabel}>Sort by:</Text>
          <View style={styles.sortButtons}>
            <Pressable
              style={[
                styles.sortButton,
                sortMode === "alphabetical" && styles.selectedSortButton
              ]}
              onPress={() => setSortMode("alphabetical")}
            >
              <Text style={[
                styles.sortButtonText,
                sortMode === "alphabetical" && styles.selectedSortButtonText
              ]}>
                🔤 A-Z
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.sortButton,
                sortMode === "upcoming" && styles.selectedSortButton
              ]}
              onPress={() => setSortMode("upcoming")}
            >
              <Text style={[
                styles.sortButtonText,
                sortMode === "upcoming" && styles.selectedSortButtonText
              ]}>
                📅 Upcoming
              </Text>
            </Pressable>
          </View>
        </View>

        {(sortMode === "alphabetical" && Object.keys(groupedBirthdays).length === 0) || 
         (sortMode === "upcoming" && Object.keys(upcomingGroupedBirthdays).length === 0) ? (
          <Text style={{ marginBottom: 20, textAlign: 'center', color: '#666' }}>
            {searchQuery ? 'No birthdays found matching your search.' : 'No birthdays yet.'}
          </Text>
        ) : sortMode === "alphabetical" ? (
          // Alphabetical view (grouped by letter)
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
                        placeholderTextColor={colors.secondaryText}
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
        ) : (
          // Upcoming view (grouped by month)
          Object.keys(upcomingGroupedBirthdays).map((monthYear) => (
            <View key={monthYear}>
              <Text style={styles.letter}>{monthYear} –</Text>
              {upcomingGroupedBirthdays[monthYear].map((b, i) => {
                const daysUntil = getDaysUntilBirthday(b.date);
                const isToday = daysUntil === 0;
                return (
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
                        isToday && styles.todayCard,
                        expandedContact && expandedContact.name === b.name && expandedContact.date === b.date && styles.expandedCard
                      ]}>
                        <View style={styles.contactHeader}>
                          <Text style={styles.name}>
                            {isToday ? '🎂 ' : ''}{b.name}{isToday ? ' 🎂' : ''}
                          </Text>
                          <Text style={styles.ageText}>{getAgeDisplay(b.date)}</Text>
                        </View>
                        <Text style={styles.dateText}>{b.date}</Text>
                        
                        {/* Days until birthday */}
                        <Text style={[styles.daysUntilText, isToday && styles.todayText]}>
                          {isToday ? "🎉 Today! 🎉" : `${daysUntil} day${daysUntil === 1 ? '' : 's'} left`}
                        </Text>
                        
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
                          placeholderTextColor={colors.secondaryText}
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
                );
              })}
            </View>
          ))
        )}

        {/* Edit Modal */}
        {editingBirthday && (
          <View style={styles.editModal}>
            <Text style={styles.editTitle}>Edit Contact</Text>
            
            <TextInput
              placeholder="Name"
              placeholderTextColor={colors.secondaryText}
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
            />
            
            {/* Date Picker - Separate Day, Month, Year */}
            <Text style={styles.dateLabel}>Birthday Date:</Text>
            <View style={styles.datePickerContainer}>
              {/* Month Picker */}
              <View style={styles.pickerWrapper}>
                <Text style={styles.pickerLabel}>Month</Text>
                <Picker
                  selectedValue={editSelectedMonth}
                  onValueChange={setEditSelectedMonth}
                  style={styles.picker}
                >
                  <Picker.Item label="Select" value="" color={colors.text} />
                  {months.map((month) => (
                    <Picker.Item key={month.value} label={month.label} value={month.value} color={colors.text} />
                  ))}
                </Picker>
              </View>

              {/* Day Picker */}
              <View style={styles.pickerWrapper}>
                <Text style={styles.pickerLabel}>Day</Text>
                <Picker
                  selectedValue={editSelectedDay}
                  onValueChange={setEditSelectedDay}
                  style={styles.picker}
                >
                  <Picker.Item label="Select" value="" color={colors.text} />
                  {generateDays(editSelectedMonth, editSelectedYear).map((day) => (
                    <Picker.Item key={day} label={day} value={day} color={colors.text} />
                  ))}
                </Picker>
              </View>

              {/* Year Picker */}
              <View style={styles.pickerWrapper}>
                <Text style={styles.pickerLabel}>Year</Text>
                <Picker
                  selectedValue={editSelectedYear}
                  onValueChange={setEditSelectedYear}
                  style={styles.picker}
                >
                  <Picker.Item label="Select" value="" color={colors.text} />
                  {generateYears().map((year) => (
                    <Picker.Item key={year} label={year} value={year} color={colors.text} />
                  ))}
                </Picker>
              </View>
            </View>
            
            {editDate && (
              <Text style={styles.selectedDateText}>Selected: {editDate}</Text>
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
          placeholderTextColor={colors.secondaryText}
          style={styles.input}
          value={name}
          onChangeText={setName}
        />
        
        {/* Date Picker - Separate Day, Month, Year */}
        <Text style={styles.dateLabel}>Birthday Date:</Text>
        <View style={styles.datePickerContainer}>
          {/* Month Picker */}
          <View style={styles.pickerWrapper}>
            <Text style={styles.pickerLabel}>Month</Text>
            <Picker
              selectedValue={selectedMonth}
              onValueChange={setSelectedMonth}
              style={styles.picker}
            >
              <Picker.Item label="Select" value="" color={colors.text} />
              {months.map((month) => (
                <Picker.Item key={month.value} label={month.label} value={month.value} color={colors.text} />
              ))}
            </Picker>
          </View>

          {/* Day Picker */}
          <View style={styles.pickerWrapper}>
            <Text style={styles.pickerLabel}>Day</Text>
            <Picker
              selectedValue={selectedDay}
              onValueChange={setSelectedDay}
              style={styles.picker}
            >
              <Picker.Item label="Select" value="" color={colors.text} />
              {generateDays(selectedMonth, selectedYear).map((day) => (
                <Picker.Item key={day} label={day} value={day} color={colors.text} />
              ))}
            </Picker>
          </View>

          {/* Year Picker */}
          <View style={styles.pickerWrapper}>
            <Text style={styles.pickerLabel}>Year</Text>
            <Picker
              selectedValue={selectedYear}
              onValueChange={setSelectedYear}
              style={styles.picker}
            >
              <Picker.Item label="Select" value="" color={colors.text} />
              {generateYears().map((year) => (
                <Picker.Item key={year} label={year} value={year} color={colors.text} />
              ))}
            </Picker>
          </View>
        </View>
        
        {date && (
          <Text style={styles.selectedDateText}>Selected: {date}</Text>
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

const createStyles = (colors: any) => StyleSheet.create({
  container: { padding: 20, backgroundColor: colors.background, flexGrow: 1, paddingTop: 70 },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: colors.text,
  },
  hintText: {
    fontSize: 14,
    textAlign: "center",
    color: colors.secondaryText,
    marginBottom: 15,
    fontStyle: "italic",
  },
  subtitle: { fontSize: 20, marginTop: 30, marginBottom: 10, color: colors.text },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: colors.cardBackground,
    color: colors.text,
  },
  cardContainer: {
    marginBottom: 10,
  },
  card: {
    backgroundColor: colors.cardBackground,
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  name: { fontSize: 18, fontWeight: "bold", color: colors.text },
  dateText: { fontSize: 14, color: colors.secondaryText, marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    fontSize: 16,
    backgroundColor: colors.background,
    color: colors.text,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: colors.cardBackground,
  },
  dateButtonText: {
    fontSize: 16,
    textAlign: "center",
    color: colors.primary,
    fontWeight: "500",
  },
  letter: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 8,
    color: colors.text,
  },
  backButton: {
    backgroundColor: colors.cardBackground,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: "500",
  },
  editModal: {
    backgroundColor: colors.background,
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
    borderColor: colors.border,
  },
  editTitle: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
    color: colors.text,
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
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  cancelButton: {
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "500",
  },
  contactContainer: {
    marginBottom: 10,
  },
  expandedCard: {
    borderColor: colors.primary,
    backgroundColor: colors.cardBackground,
  },
  expandIndicator: {
    fontSize: 12,
    color: colors.primary,
    textAlign: "center",
    marginTop: 5,
  },
  notesContainer: {
    backgroundColor: colors.cardBackground,
    padding: 15,
    borderRadius: 8,
    marginTop: 5,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    borderRadius: 6,
    fontSize: 14,
    backgroundColor: colors.background,
    color: colors.text,
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
    backgroundColor: colors.success,
    borderWidth: 1,
    borderColor: colors.success,
  },
  saveNotesButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  cancelNotesButton: {
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelNotesButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "500",
  },
  categoryContainer: {
    marginBottom: 15,
  },
  categoryButton: {
    backgroundColor: colors.cardBackground,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedCategoryButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryButtonText: {
    fontSize: 14,
    color: colors.text,
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
    color: colors.secondaryText,
    fontStyle: "italic",
  },
  categoryDisplay: {
    marginTop: 5,
  },
  categoryLabel: {
    fontSize: 11,
    color: colors.primary,
    backgroundColor: colors.cardBackground,
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
    backgroundColor: colors.cardBackground,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedCategoryOption: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryOptionText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: "500",
  },
  selectedCategoryOptionText: {
    color: "#fff",
    fontWeight: "600",
  },
  sortContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginRight: 10,
  },
  sortButtons: {
    flexDirection: "row",
    gap: 10,
  },
  sortButton: {
    backgroundColor: colors.cardBackground,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedSortButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sortButtonText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: "500",
  },
  selectedSortButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  todayCard: {
    backgroundColor: colors.warning + '20',
    borderLeftColor: colors.warning,
    borderLeftWidth: 6,
  },
  daysUntilText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "600",
    marginTop: 4,
  },
  todayText: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: "700",
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 10,
  },
  datePickerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 15,
  },
  pickerWrapper: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.background,
    overflow: "hidden",
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.secondaryText,
    textAlign: "center",
    paddingTop: 5,
    paddingBottom: 2,
    backgroundColor: colors.cardBackground,
  },
  picker: {
    height: 150,
    color: colors.text,
  },
  selectedDateText: {
    fontSize: 14,
    color: colors.primary,
    textAlign: "center",
    marginBottom: 10,
    fontWeight: "500",
  },

});
