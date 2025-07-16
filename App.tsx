import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar, LogBox, View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { enableScreens } from 'react-native-screens';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Styles
import theme from './src/styles/theme';

// Screens
import WelcomeScreen from './src/screens/WelcomeScreen';
import HomeScreen from './src/screens/HomeScreen';
import QuizScreen from './src/screens/QuizScreen';
import CategoriesScreen from './src/screens/CategoriesScreen';
import DailyGoalsScreen from './src/screens/DailyGoalsScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import SettingsScreen from './src/screens/SettingsScreen';

// Services
import { TimerService } from './src/services/TimerService';
import SoundService from './src/services/SoundService';
import { AnalyticsService } from './src/services/AnalyticsService';
import { QuestionService } from './src/services/QuestionService';
import { NotificationService } from './src/services/NotificationService';
import { initializeFirebase } from './src/config/Firebase';

// Components
// import Mascot from './src/components/Mascot/Mascot';
// import PersistentTimer from './src/components/Timer/PersistentTimer';

// Stores
import { useUserStore } from './src/store/useUserStore';

// Types
export type RootStackParamList = {
  Welcome: undefined;
  Home: undefined;
  Quiz: { category?: string; difficulty?: 'easy' | 'medium' | 'hard' };
  Categories: { difficulty?: 'easy' | 'medium' | 'hard' };
  DailyGoals: undefined;
  Leaderboard: undefined;
  Settings: undefined;
};

enableScreens();
const Stack = createStackNavigator<RootStackParamList>();

LogBox.ignoreLogs([
  'new NativeEventEmitter() was called with a non-null argument without the required `addListener` method.',
  'new NativeEventEmitter() was called with a non-null argument without the required `removeListeners` method.',
  'Non-serializable values were found in the navigation state',
  'Remote debugger is in a background tab',
  'This method is deprecated',
  'Firebase initialization error',
]);

const LoadingScreen: React.FC = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={theme.colors.primary} />
    <Text style={styles.loadingText}>Loading BrainBites...</Text>
    <Text style={styles.loadingSubtext}>Setting up your learning experience</Text>
  </View>
);

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList>('Welcome');
  const [initError, setInitError] = useState<string | null>(null);
  const initializeApp = useUserStore((state) => state.initializeApp);

  useEffect(() => {
    const init = async () => {
      try {
        console.log('🚀 Starting BrainBites initialization...');
        
        // Check if onboarding is complete
        const onboardingComplete = await AsyncStorage.getItem('brainbites_onboarding_complete');
        
        console.log('📚 Loading questions...');
        const questionsLoaded = await QuestionService.loadQuestions();
        if (!questionsLoaded) {
          console.warn('⚠️ Questions loading had issues, but continuing with fallback');
        }
        
        console.log('🔧 Initializing TimerService...');
        await TimerService.initialize();
        
        console.log('🔊 Initializing SoundService...');
        try {
          // SoundService is auto-initialized in constructor
          console.log('✓ SoundService initialized');
        } catch (error) {
          console.warn('⚠️ SoundService initialization failed, continuing without sound:', error);
          // Don't let sound errors crash the app
        }
        
        console.log('🔥 Initializing Firebase...');
        try {
          const firebaseInitialized = await initializeFirebase();
          if (!firebaseInitialized) {
            console.warn('⚠️ Firebase initialization failed, continuing without Firebase');
          }
        } catch (error) {
          console.warn('⚠️ Firebase initialization failed, continuing without Firebase:', error);
        }
        
        console.log('📊 Initializing AnalyticsService...');
        try {
          await AnalyticsService.initialize();
        } catch (error) {
          console.warn('⚠️ AnalyticsService initialization failed, continuing without analytics:', error);
          // Don't let analytics errors crash the app
        }
        
        console.log('🔔 Initializing NotificationService...');
        await NotificationService.initialize();
        
        console.log('👤 Loading user data...');
        await initializeApp();
        
        // Determine initial route
        if (onboardingComplete === 'true') {
          setInitialRoute('Home');
          console.log('🎵 Starting menu music...');
          try {
            SoundService.startMenuMusic();
          } catch (error) {
            console.warn('⚠️ Failed to play menu music:', error);
          }
        } else {
          setInitialRoute('Welcome');
        }
        
        console.log('✅ BrainBites initialized successfully!');
        console.log('📦 Services status:');
        console.log('  - Questions:', QuestionService.isReady() ? 'Ready' : 'Limited');
        console.log('  - Sound:', SoundService.getSoundSettings().soundsEnabled ? 'Enabled' : 'Disabled');
        console.log('  - Notifications:', NotificationService.isEnabled() ? 'Enabled' : 'Disabled');
        
        // Small delay to show loading screen
        setTimeout(() => {
          setIsLoading(false);
        }, 1000);
        
      } catch (error) {
        console.error('❌ App initialization failed:', error);
        setInitError(error instanceof Error ? error.message : 'Unknown error');
        
        // Still try to start the app with limited functionality
        setInitialRoute('Home');
        setIsLoading(false);
      }
    };

    init();

    return () => {
      console.log('🧹 Cleaning up app...');
      try {
        TimerService.cleanup();
        SoundService.stopMusic();
        NotificationService.cleanup();
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    };
  }, [initializeApp]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (initError) {
    console.warn('App started with initialization error:', initError);
  }

  return (
    <SafeAreaProvider>
      <StatusBar 
        backgroundColor="transparent" 
        barStyle="light-content" 
        animated={true}
        translucent={true}
        hidden={false}
      />
      <NavigationContainer
        theme={{
          colors: {
            primary: theme.colors.primary,
            background: theme.colors.background,
            card: theme.colors.cardBackground,
            text: theme.colors.textDark,
            border: theme.colors.textMuted,
            notification: theme.colors.error,
          },
          dark: false,
          fonts: {
            regular: {
              fontFamily: theme.fonts.primary,
              fontWeight: 'normal',
            },
            medium: {
              fontFamily: theme.fonts.primary,
              fontWeight: 'normal',
            },
            bold: {
              fontFamily: theme.fonts.bold,
              fontWeight: 'normal',
            },
            heavy: {
              fontFamily: theme.fonts.bold,
              fontWeight: 'normal',
            },
          },
        }}
        onReady={() => {
          console.log('🧭 Navigation ready');
        }}
      >
        <Stack.Navigator 
          initialRouteName={initialRoute}
          screenOptions={{
            headerShown: false,
            gestureEnabled: true,
            gestureDirection: 'horizontal',
            cardStyleInterpolator: ({ current, layouts }) => {
              return {
                cardStyle: {
                  transform: [
                    {
                      translateX: current.progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [layouts.screen.width, 0],
                      }),
                    },
                  ],
                },
              };
            },
          }}
        >
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Quiz" component={QuizScreen} />
          <Stack.Screen name="Categories" component={CategoriesScreen} />
          <Stack.Screen name="DailyGoals" component={DailyGoalsScreen} />
          <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 20,
    fontFamily: theme.fonts.bold,
    color: theme.colors.primary,
    marginTop: 20,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 16,
    fontFamily: theme.fonts.primary,
    color: theme.colors.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default App;