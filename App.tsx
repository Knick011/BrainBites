// App.tsx - Main navigation setup with TypeScript
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'react-native';
import { initializeFirebase } from './src/config/Firebase';
import SoundService from './src/services/SoundService';
import { RootStackParamList } from './src/types';

// Import screens
import WelcomeScreen from './src/screens/WelcomeScreen';
import HomeScreen from './src/screens/HomeScreen';
import CategoriesScreen from './src/screens/CategoriesScreen';
import QuizScreen from './src/screens/QuizScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import DailyGoalsScreen from './src/screens/DailyGoalsScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Stack = createStackNavigator<RootStackParamList>();

const App: React.FC = () => {
  useEffect(() => {
    // Initialize app services
    const initializeApp = async () => {
      try {
        // Initialize Firebase
        await initializeFirebase();
        
        // Initialize sounds
        await SoundService.initialize();
        
        console.log('App initialized successfully');
      } catch (error) {
        console.error('App initialization error:', error);
      }
    };
    
    initializeApp();
    
    return () => {
      // Cleanup
      SoundService.release();
    };
  }, []);
  
  return (
    <>
      <StatusBar backgroundColor="#FFF8E7" barStyle="dark-content" />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Welcome"
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: '#FFF8E7' },
            cardStyleInterpolator: ({ current: { progress } }) => ({
              cardStyle: {
                opacity: progress,
              },
            }),
          }}
        >
          <Stack.Screen 
            name="Welcome" 
            component={WelcomeScreen}
            options={{
              animationEnabled: true,
              animationTypeForReplace: 'push',
            }}
          />
          <Stack.Screen 
            name="Home" 
            component={HomeScreen}
            options={{
              animationEnabled: true,
            }}
          />
          <Stack.Screen 
            name="Categories" 
            component={CategoriesScreen}
            options={{
              animationEnabled: true,
            }}
          />
          <Stack.Screen 
            name="Quiz" 
            component={QuizScreen}
            options={{
              animationEnabled: true,
              gestureEnabled: false, // Prevent swipe back during quiz
            }}
          />
          <Stack.Screen 
            name="Leaderboard" 
            component={LeaderboardScreen}
            options={{
              animationEnabled: true,
            }}
          />
          <Stack.Screen 
            name="DailyGoals" 
            component={DailyGoalsScreen}
            options={{
              animationEnabled: true,
            }}
          />
          <Stack.Screen 
            name="Settings" 
            component={SettingsScreen}
            options={{
              animationEnabled: true,
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
};

export default App;