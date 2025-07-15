# BrainBites - Feed Your Mind, One Bite at a Time!

A beautiful, educational quiz app with a pastel theme and engaging mascot companion.

## ✨ Features

- **Beautiful Pastel UI** - Soft, modern design with excellent user experience
- **Smart Quiz System** - Multiple difficulty levels with adaptive scoring
- **Mascot Companion** - CaBBY the beaver guides you through your learning journey
- **Sound Integration** - Immersive audio feedback and background music
- **Timer System** - Persistent timer with rewards for correct answers
- **Daily Goals** - Track your progress and maintain streaks
- **Leaderboard** - Compete with other learners worldwide

## 🎨 Design

- **Pastel Color Palette**: Soft, eye-friendly colors throughout
- **Full Screen Experience**: Transparent status bar for immersive UI
- **Smooth Animations**: Engaging transitions and micro-interactions
- **Responsive Layout**: Works perfectly on all device sizes

## 🎵 Audio

- **6 Sound Files**: All properly integrated and optimized
  - `buttonpress.mp3` - Button click feedback
  - `correct.mp3` - Correct answer celebration
  - `incorrect.mp3` - Wrong answer feedback
  - `streak.mp3` - Streak achievement sound
  - `gamemusic.mp3` - Background music during quiz
  - `menumusic.mp3` - Background music in menus

## 🦫 Mascot System

- **6 Mascot States**: All properly integrated
  - `below.png` - Peeking state (default)
  - `happy.png` - Happy state
  - `sad.png` - Sad state
  - `excited.png` - Excited state
  - `gamemode.png` - Game mode state
  - `depressed.png` - Depressed state

## 🚀 Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run on Android**
   ```bash
   npx react-native run-android
   ```

3. **Run on iOS**
   ```bash
   npx react-native run-ios
   ```

## 📱 User Experience

- **Simplified Onboarding**: No name input required, defaults to "CaBBy"
- **Auto-Navigation**: Welcome screen automatically proceeds to home after 3 seconds
- **Seamless Music**: Automatically switches between menu and game music
- **Smart Notifications**: Mascot provides contextual feedback and encouragement

## 🎯 Quiz Features

- **Three Difficulty Levels**:
  - Easy (10 points, 1 min reward)
  - Medium (20 points, 2 min reward)
  - Hard (30 points, 3 min reward)

- **Streak System**: Build streaks for bonus points
- **Time Rewards**: Earn time for correct answers
- **Category Selection**: Choose from various topics
- **Daily Goals**: Complete daily challenges

## 🛠 Technical Stack

- **React Native** - Cross-platform mobile development
- **TypeScript** - Type-safe development
- **Zustand** - State management
- **React Navigation** - Screen navigation
- **React Native Sound** - Audio playback
- **React Native Linear Gradient** - Beautiful gradients
- **React Native Vector Icons** - Icon system

## 📁 Project Structure

```
src/
├── assets/
│   ├── sounds/          # All 6 sound files
│   ├── mascot/          # All 6 mascot images
│   └── data/            # Question data
├── components/
│   ├── common/          # Reusable components
│   ├── Quiz/            # Quiz-specific components
│   ├── Mascot/          # Mascot system
│   └── Timer/           # Timer components
├── screens/             # App screens
├── services/            # Business logic
├── store/               # State management
├── styles/              # Theme and styles
└── types/               # TypeScript definitions
```

## 🎨 Theme Colors

- **Primary Gradient**: `['#FFE5D9', '#FFD7C9', '#FFC9B9']`
- **Quiz Gradient**: `['#E8F4FF', '#D4E9FF', '#C0DFFF']`
- **Text Colors**: `#4A4A4A` (dark), `#6A6A6A` (medium)
- **Accent Colors**: Various pastel shades for buttons and highlights

## 🔧 Configuration

### Metro Config
Updated to handle all asset types including MP3 files and images.

### Sound Service
Properly configured to load sounds from the assets folder with fallback handling.

### Status Bar
Transparent status bar with dark content for full-screen experience.

## 📊 Performance

- **Optimized Assets**: All images and sounds are properly sized and compressed
- **Lazy Loading**: Components load on demand
- **Memory Management**: Proper cleanup of audio resources
- **Smooth Animations**: 60fps animations with native driver

## 🎯 Future Enhancements

See `IMPROVEMENTS.md` for a comprehensive list of planned features including:
- Achievement system
- Settings screen
- Statistics dashboard
- Offline mode
- Social features
- Customization options

## 📝 Asset Setup

All required assets are already included in the `src/assets/` folder:
- ✅ 6 sound files (MP3 format)
- ✅ 6 mascot images (PNG format)
- ✅ Proper file naming and organization

## 🔧 Icon Configuration

The app uses **Ionicons** from `react-native-vector-icons`. All icons have been updated to use valid Ionicons names:

### Fixed Icon Names
- `trophy` → `trophy-outline`
- `grid` → `grid-outline`
- `checkmark-circle` → `checkmark-circle-outline`
- `podium` → `trophy-outline`
- `close` → `close-circle`
- `arrow-forward` → `arrow-forward-circle`
- `arrow-back` → `arrow-back-circle`
- `flash` → `flash-outline`
- `help-circle` → `help-circle-outline`
- `gift` → `gift-outline`
- `information-circle` → `information-circle-outline`
- `star` → `star-outline`
- `chevron-forward` → `chevron-forward-circle`
- `close-circle` → `close-circle-outline`

### Setup Completed
- ✅ Android fonts copied to `android/app/src/main/assets/fonts/`
- ✅ iOS fonts copied to `ios/BrainBites/`
- ✅ Android build.gradle updated with sourceSets
- ✅ iOS Info.plist updated with UIAppFonts
- ✅ iOS Podfile updated with RNVectorIcons pod

## 🚀 Ready to Use

The app is fully functional with all assets properly integrated. Simply run the development server and enjoy the beautiful BrainBites experience!

---

**Made with ❤️ for learning and fun!**
