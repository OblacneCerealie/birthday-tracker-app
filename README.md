# 🎂 Birthday Tracker App

A React Native mobile app for tracking and managing birthdays with a beautiful, intuitive interface.

## ✨ Features

### 🔐 User Authentication
- Simple name-based login system
- Special access for "Sebastian" with password protection
- Secure user session management

### 📅 Birthday Management
- **Date Picker**: Easy date selection with native date picker component
- **Search Functionality**: Real-time search through birthday list
- **Add/Delete**: Add new birthdays and delete existing ones (for non-Sebastian users)
- **Alphabetical Organization**: Birthdays grouped by first letter for easy navigation

### 🎉 Smart Notifications
- Automatic birthday alerts for today's birthdays
- Push notifications with birthday reminders
- Permission-based notification system

### 📱 User Experience
- **Upcoming Birthdays**: Shows next 3 upcoming birthdays on home screen
- **Real-time Updates**: Newly added birthdays appear immediately without app restart
- **Responsive Design**: Works seamlessly on both iOS and Android
- **Modern UI**: Clean, intuitive interface with smooth animations

### 👥 Dual User System
- **Sebastian**: Read-only access to a curated list of 50+ birthdays
- **Other Users**: Full CRUD functionality for personal birthday lists

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- Expo CLI
- iOS Simulator or Android Emulator

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd SebkovTest
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Run on your preferred platform**
   ```bash
   # For iOS
   npm run ios
   
   # For Android
   npm run android
   
   # For web
   npm run web
   ```

## 📱 How to Use

### First Time Setup
1. Enter your name in the welcome screen
2. If your name is "Sebastian", you'll need to enter the password
3. For other users, you can start adding birthdays immediately

### Adding Birthdays
1. Navigate to "View All Birthdays / Add New"
2. Enter the person's name (no numbers allowed)
3. Tap "Select Birthday Date" to choose a date
4. Tap "Add Birthday" to save

### Searching Birthdays
1. Go to the "All Birthdays" page
2. Use the search bar at the top
3. Type any part of a name to filter results

### Managing Birthdays
- **View**: All birthdays are displayed alphabetically
- **Delete**: Long press on any birthday card to delete (non-Sebastian users only)
- **Navigate**: Use the home screen to see upcoming birthdays

## 🛠️ Technical Stack

- **Framework**: React Native with Expo
- **Navigation**: Expo Router
- **Storage**: AsyncStorage for local data persistence
- **Notifications**: Expo Notifications
- **Date Picker**: @react-native-community/datetimepicker
- **Language**: TypeScript

## 📁 Project Structure

```
SebkovTest/
├── app/
│   ├── _layout.tsx          # Root layout configuration
│   ├── index.tsx            # Home screen with upcoming birthdays
│   ├── all.tsx              # All birthdays view with search and add
│   ├── welcome.js           # Login screen
│   └── lib/
│       └── birthdays.ts     # Birthday data and utility functions
├── assets/                  # Images, fonts, and static assets
├── package.json             # Dependencies and scripts
└── README.md               # This file
```

## 🔧 Key Features Implementation

### Date Picker Integration
- Native date picker component for better UX
- Automatic date formatting (YYYY-MM-DD)
- Maximum date restriction to prevent future dates

### Search Functionality
- Real-time filtering as you type
- Case-insensitive search
- Instant results with smooth UI updates

### Navigation Fix
- `useFocusEffect` hook ensures data stays in sync
- Automatic refresh when navigating between screens
- No need to restart app after adding birthdays

## 🎨 UI/UX Improvements

- **Modern Card Design**: Birthday cards with accent borders
- **Consistent Styling**: Unified color scheme and typography
- **Responsive Layout**: Adapts to different screen sizes
- **Intuitive Navigation**: Clear visual hierarchy and user flow

## 🔒 Security Features

- Password protection for Sebastian's access
- Input validation (no numbers in names)
- Secure data storage with AsyncStorage
- Permission-based notification system

## 📊 Data Management

- **Sebastian's Data**: Hardcoded read-only birthday list
- **User Data**: Local storage with AsyncStorage
- **Automatic Sorting**: Birthdays sorted alphabetically
- **Data Persistence**: Survives app restarts

## 🚀 Future Enhancements

Potential features for future versions:
- Cloud backup and sync
- Birthday reminders with custom timing
- Age calculation and statistics
- Birthday sharing and social features
- Dark mode support
- Multiple user profiles
- Import/export functionality

## 🤝 Contributing

This is a personal project, but suggestions and improvements are welcome!

## 📄 License

This project is for personal use and educational purposes.

---

**Built with ❤️ using React Native and Expo**
