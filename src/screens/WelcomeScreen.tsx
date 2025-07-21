// src/screens/WelcomeScreen.tsx - Enhanced onboarding experience
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  Animated,
  Easing,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import SoundService from '../services/SoundService';
import EnhancedMascotDisplay from '../components/Mascot/EnhancedMascotDisplay';
import theme from '../styles/theme';

type MascotType = 'happy' | 'sad' | 'excited' | 'depressed' | 'gamemode' | 'below';
const { width, height } = Dimensions.get('window');

type NavigationProp = StackNavigationProp<RootStackParamList, 'Welcome'>;

const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [hasSeenWelcome, setHasSeenWelcome] = useState<boolean | null>(null);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(width)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  
  useEffect(() => {
    checkFirstTime();
  }, []);
  
  const checkFirstTime = async () => {
    try {
      const seen = await AsyncStorage.getItem('@BrainBites:hasSeenWelcome');
      if (seen === 'true') {
        // Not first time, go directly to home
        navigation.replace('Home');
      } else {
        // First time, show welcome and save flag
        setHasSeenWelcome(false);
        await AsyncStorage.setItem('@BrainBites:hasSeenWelcome', 'true');
        startAnimations();
      }
    } catch (error) {
      console.error('Error checking first time:', error);
      startAnimations();
    }
  };
  
  const startAnimations = () => {
    SoundService.startMenuMusic();
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Auto-navigate after 3 seconds
    setTimeout(() => {
      navigation.replace('Home');
    }, 3000);
  };
  
  const handleGetStarted = () => {
    SoundService.playButtonPress();
    navigation.replace('Home');
  };
  
  if (hasSeenWelcome === null) {
    return <View style={styles.container} />;
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#FFF8E7" barStyle="dark-content" />
      
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Animated.View 
          style={[
            styles.mascotContainer,
            {
              transform: [
                { translateX: slideAnim },
                { scale: scaleAnim }
              ]
            }
          ]}
        >
          <EnhancedMascotDisplay
            type="excited"
            position="right"
            showMascot={true}
            message="Welcome to Brain Bites! 🎉\n\nI'm CaBBy, your quiz companion! Let's have fun learning together!"
            autoHide={false}
            fullScreen={false}
          />
        </Animated.View>
        
        <Animated.View 
          style={[
            styles.bottomContent,
            {
              opacity: fadeAnim,
              transform: [{ translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0]
              })}]
            }
          ]}
        >
          <TouchableOpacity
            style={styles.getStartedButton}
            onPress={handleGetStarted}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Get Started</Text>
            <Icon name="arrow-right" size={24} color="white" />
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8E7',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  mascotContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomContent: {
    paddingBottom: 40,
    width: '100%',
  },
  getStartedButton: {
    backgroundColor: '#FF9F1C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    ...theme.shadows.medium,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif-medium',
  },
});

export default WelcomeScreen;