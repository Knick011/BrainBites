import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useUserStore } from '../store/useUserStore';
import { SoundService } from '../services/SoundService';
import AnimatedBackground from '../components/common/AnimatedBackground';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type NavigationProp = StackNavigationProp<RootStackParamList, 'Welcome'>;

const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { username } = useUserStore();

  // Animations
  const logoScale = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const cabbyScale = useRef(new Animated.Value(0)).current;
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

    // Auto-navigate to home after 3 seconds
    const timer = setTimeout(() => {
      SoundService.playButtonClick();
      navigation.navigate('Home');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <LinearGradient
      colors={['#FFE5D9', '#FFD7C9', '#FFC9B9']}
      style={styles.container}
    >
      <AnimatedBackground />
      
      <View style={styles.content}>
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
              Welcome back, {username}!
            </Text>
            <View style={styles.speechTriangle} />
          </View>
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
      </View>
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
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
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
    color: '#4A4A4A',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    fontFamily: 'Quicksand-Bold',
  },
  subtitle: {
    fontSize: 18,
    color: '#6A6A6A',
    marginTop: 10,
    textAlign: 'center',
    fontFamily: 'Nunito-Regular',
  },
  mascotContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  speechBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 20,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  speechText: {
    fontSize: 16,
    color: '#4A4A4A',
    textAlign: 'center',
    fontFamily: 'Nunito-Regular',
  },
  speechTriangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 15,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'rgba(255, 255, 255, 0.9)',
    alignSelf: 'center',
    marginTop: -1,
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#6A6A6A',
    textAlign: 'center',
    fontFamily: 'Nunito-Regular',
  },
});

export default WelcomeScreen;