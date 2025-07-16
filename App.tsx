import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar, LogBox, View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { enableScreens } from 'react-native-screens';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import firebase from '@react-native-firebase/app';

// Initialize Firebase if not already initialized
if (!firebase.apps.length) {
  try {
    // Firebase will auto-initialize with google-services.json
    firebase.app();
  } catch (error) {
    console.log('Firebase initialization error:', error);
  }
}

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
import { SoundService } from './src/services/SoundService';
import { AnalyticsService } from './src/services/AnalyticsService';
import { QuestionService } from './src/services/QuestionService';
import { NotificationService } from './src/services/NotificationService';

// Components
import Mascot from './src/components/Mascot/Mascot';
import PersistentTimer from './src/components/Timer/PersistentTimer';

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
          await SoundService.initialize();
        } catch (error) {
          console.warn('⚠️ SoundService initialization failed, continuing without sound:', error);
          // Don't let sound errors crash the app
        }
        
        console.log('📊 Initializing AnalyticsService...');
        await AnalyticsService.initialize();
        
        console.log('🔔 Initializing NotificationService...');
        await NotificationService.initialize();
        
        console.log('👤 Loading user data...');
        await initializeApp();
        
        // Determine initial route
        if (onboardingComplete === 'true') {
          setInitialRoute('Home');
          console.log('🎵 Starting menu music...');
          try {
            SoundService.playMenuMusic();
          } catch (error) {
            console.warn('⚠️ Failed to play menu music:', error);
          }
        } else {
          setInitialRoute('Welcome');
        }
        
        console.log('✅ BrainBites initialized successfully!');
        console.log('📦 Services status:');
        console.log('  - Questions:', QuestionService.isReady() ? 'Ready' : 'Limited');
        console.log('  - Sound:', SoundService.isSoundEnabled() ? 'Enabled' : 'Disabled');
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
        SoundService.stopAll();
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
            card: theme.colors.card,
            text: theme.colors.textDark,
            border: theme.colors.gray[200],
            notification: theme.colors.error,
          },
          dark: false,
          fonts: {
            regular: {
              fontFamily: theme.typography.fontFamily.regular,
              fontWeight: 'normal',
            },
            medium: {
              fontFamily: theme.typography.fontFamily.medium,
              fontWeight: '500',
            },
            bold: {
              fontFamily: theme.typography.fontFamily.bold,
              fontWeight: 'bold',
            },
            heavy: {
              fontFamily: theme.typography.fontFamily.black,
              fontWeight: '900',
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
            cardStyleInterpolator: ({ current: { progress } }) => ({
              cardStyle: {
                opacity: progress,
              },
            }),
            cardStyle: {
              backgroundColor: theme.colors.background,
            },
            gestureEnabled: true,
          }}
        >
          <Stack.Screen 
            name="Welcome" 
            component={WelcomeScreen}
            options={{
              animationTypeForReplace: 'push',
            }}
          />
          <Stack.Screen 
            name="Home" 
            component={HomeScreen}
            options={{
              gestureEnabled: false, // Prevent swipe back to Welcome
            }}
          />
          <Stack.Screen 
            name="Quiz" 
            component={QuizScreen}
            options={{
              cardStyleInterpolator: ({ current: { progress } }) => ({
                cardStyle: {
                  transform: [
                    {
                      translateX: progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [300, 0],
                      }),
                    },
                  ],
                },
              }),
            }}
          />
          <Stack.Screen name="Categories" component={CategoriesScreen} />
          <Stack.Screen name="DailyGoals" component={DailyGoalsScreen} />
          <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </Stack.Navigator>
        
        {/* Global Components */}
        <Mascot />
        <PersistentTimer />
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
    fontWeight: 'bold',
    color: theme.colors.textDark,
    marginTop: 20,
    textAlign: 'center',
    fontFamily: theme.typography.fontFamily.bold,
  },
  loadingSubtext: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginTop: 8,
    textAlign: 'center',
    fontFamily: theme.typography.fontFamily.regular,
  },
});

export default App;