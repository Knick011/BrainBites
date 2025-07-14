import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar, LogBox } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { enableScreens } from 'react-native-screens';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Styles
import theme from './src/styles/theme';
import commonStyles from './src/styles/commonStyles';

// Screens
import WelcomeScreen from './src/screens/WelcomeScreen';
import HomeScreen from './src/screens/HomeScreen';
import QuizScreen from './src/screens/QuizScreen';
import CategoriesScreen from './src/screens/CategoriesScreen';
import DailyGoalsScreen from './src/screens/DailyGoalsScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';

// Services
import { TimerService } from './src/services/TimerService';
import { SoundService } from './src/services/SoundService';
import { AnalyticsService } from './src/services/AnalyticsService';
import { QuestionService } from './src/services/QuestionService';
import AdMobService from './src/services/AdMobService';
import { NetworkService } from './src/services/NetworkService';
import { PerformanceService } from './src/services/PerformanceService';

// Components
import PersistentTimer from './src/components/Timer/PersistentTimer';
import Mascot from './src/components/Mascot/Mascot';

// Stores
import { useTimerStore } from './src/store/useTimerStore';
import { useUserStore } from './src/store/useUserStore';

// Types
export type RootStackParamList = {
  Welcome: undefined;
  Home: undefined;
  Quiz: { category?: string; difficulty?: 'easy' | 'medium' | 'hard' };
  Categories: undefined;
  DailyGoals: undefined;
  Leaderboard: undefined;
};

enableScreens();
const Stack = createStackNavigator<RootStackParamList>();

LogBox.ignoreLogs([
  'new NativeEventEmitter() was called with a non-null argument without the required `addListener` method.',
  'new NativeEventEmitter() was called with a non-null argument without the required `removeListeners` method.',
]);

const App = () => {
  const initializeApp = useUserStore((state) => state.initializeApp);

  useEffect(() => {
    const init = async () => {
      // Initialize services
      await TimerService.initialize();
      await SoundService.initialize();
      await AnalyticsService.initialize();
      await QuestionService.loadQuestions();
      await AdMobService.initialize();
      await NetworkService.initialize();
      await PerformanceService.initialize();
      
      // Load user data
      await initializeApp();
      
      // Play background music
      SoundService.playBackgroundMusic();
    };

    init();

    return () => {
      TimerService.cleanup();
      SoundService.stopAll();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar 
        backgroundColor={theme.colors.primary} 
        barStyle="light-content" 
        animated={true}
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
      >
        <Stack.Navigator
          initialRouteName="Welcome"
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
          }}
        >
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Quiz" component={QuizScreen} />
          <Stack.Screen name="Categories" component={CategoriesScreen} />
          <Stack.Screen name="DailyGoals" component={DailyGoalsScreen} />
          <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
        </Stack.Navigator>
        <PersistentTimer />
        <Mascot />
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;