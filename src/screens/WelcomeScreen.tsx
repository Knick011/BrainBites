import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useUserStore } from '../store/useUserStore';
import { SoundService } from '../services/SoundService';
import AnimatedBackground from '../components/common/AnimatedBackground';
import BubbleButton from '../components/common/BubbleButton';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type NavigationProp = StackNavigationProp<RootStackParamList, 'Welcome'>;

const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { username, setUsername, isFirstTime, setFirstTime } = useUserStore();
  const [inputName, setInputName] = useState(username);
  const [showNameInput, setShowNameInput] = useState(isFirstTime);

  // Animations
  const logoScale = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const cabbyScale = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(0)).current;
  const cabbyBounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animations
    Animated.sequence([
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 10,
        friction: 2,
        useNativeDriver: true,
      }),
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(cabbyScale, {
        toValue: 1,
        tension: 10,
        friction: 2,
        useNativeDriver: true,
      }),
      Animated.spring(buttonScale, {
        toValue: 1,
        tension: 10,
        friction: 2,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous CaBBY bounce
    Animated.loop(
      Animated.sequence([
        Animated.timing(cabbyBounce, {
          toValue: -20,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(cabbyBounce, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleStart = () => {
    if (showNameInput && inputName.trim()) {
      setUsername(inputName.trim());
      setFirstTime(false);
    }
    SoundService.playButtonClick();
    navigation.navigate('Home');
  };

  return (
    <LinearGradient
      colors={['#FFD700', '#FFA500', '#FF8C00']}
      style={styles.container}
    >
      <AnimatedBackground />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <View style={styles.brainIcon}>
            <Text style={styles.brainEmoji}>🧠</Text>
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.titleContainer,
            { opacity: titleOpacity },
          ]}
        >
          <Text style={styles.title}>BrainBites</Text>
          <Text style={styles.subtitle}>Feed Your Mind, One Bite at a Time!</Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.mascotContainer,
            {
              transform: [
                { scale: cabbyScale },
                { translateY: cabbyBounce },
              ],
            },
          ]}
        >
          <View style={styles.speechBubble}>
            <Text style={styles.speechText}>
              {showNameInput ? "What's your name?" : `Welcome back, ${username}!`}
            </Text>
            <View style={styles.speechTriangle} />
          </View>
        </Animated.View>

        {showNameInput && (
          <Animated.View style={[styles.inputContainer, { opacity: titleOpacity }]}>
            <TextInput
              style={styles.nameInput}
              placeholder="Enter your name"
              placeholderTextColor="#FFA500"
              value={inputName}
              onChangeText={setInputName}
              maxLength={20}
            />
          </Animated.View>
        )}

        <Animated.View
          style={[
            styles.buttonContainer,
            {
              transform: [{ scale: buttonScale }],
            },
          ]}
        >
          <BubbleButton
            title={showNameInput ? "Let's Start!" : "Continue Learning!"}
            onPress={handleStart}
            disabled={showNameInput && !inputName.trim()}
            style={styles.startButton}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.footer,
            { opacity: titleOpacity },
          ]}
        >
          <Text style={styles.footerText}>
            Meet CaBBY - Your Learning Companion! 🦫
          </Text>
        </Animated.View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    marginBottom: 20,
  },
  brainIcon: {
    width: 120,
    height: 120,
    backgroundColor: '#FFF',
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  brainEmoji: {
    fontSize: 60,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
    fontFamily: 'Quicksand-Bold',
  },
  subtitle: {
    fontSize: 18,
    color: '#FFF',
    marginTop: 10,
    textAlign: 'center',
    fontFamily: 'Nunito-Regular',
  },
  mascotContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  speechBubble: {
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 20,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  speechText: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'Nunito-Bold',
  },
  speechTriangle: {
    position: 'absolute',
    bottom: -10,
    left: '50%',
    marginLeft: -10,
    width: 0,
    height: 0,
    borderTopWidth: 10,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 0,
    borderTopColor: '#FFF',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 30,
  },
  nameInput: {
    backgroundColor: '#FFF',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 15,
    fontSize: 16,
    color: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    fontFamily: 'Nunito-Regular',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  startButton: {
    paddingHorizontal: 50,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
  },
  footerText: {
    color: '#FFF',
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
  },
});

export default WelcomeScreen;