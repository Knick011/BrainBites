// src/screens/HomeScreen.tsx - Updated with timer integration and daily goals
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Animated,
  Platform,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import theme from '../styles/theme';
import SoundService from '../services/SoundService';
import EnhancedTimerService from '../services/EnhancedTimerService';
import EnhancedScoreService from '../services/EnhancedScoreService';
import EnhancedMascotDisplay from '../components/Mascot/EnhancedMascotDisplay';
import ScoreDisplay from '../components/common/ScoreDisplay';

type NavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;
type MascotType = 'happy' | 'sad' | 'excited' | 'depressed' | 'gamemode' | 'below';

interface HomeScreenState {
  remainingTime: number;
  isTimerRunning: boolean;
  debtTime: number;
  scoreInfo: {
    dailyScore?: number;
    currentStreak?: number;
    highestStreak?: number;
    questionsToday?: number;
    accuracy?: number;
  };
  isLoading: boolean;
}

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  
  const [state, setState] = useState<HomeScreenState>({
    remainingTime: 0,
    isTimerRunning: false,
    debtTime: 0,
    scoreInfo: {},
    isLoading: true,
  });
  
  // Mascot state
  const [mascotType, setMascotType] = useState<MascotType>('happy');
  const [mascotMessage, setMascotMessage] = useState('');
  const [showMascot, setShowMascot] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Timer subscription
  const timerUnsubscribe = useRef<(() => void) | null>(null);
  
  useEffect(() => {
    initializeHome();
    
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Start floating animation
    startFloatingAnimation();
    
    // Start pulse animation
    startPulseAnimation();
    
    return () => {
      // Cleanup
      if (timerUnsubscribe.current) {
        timerUnsubscribe.current();
      }
    };
  }, []);
  
  const initializeHome = async () => {
    try {
      // Initialize services
      await EnhancedTimerService.initialize();
      await EnhancedScoreService.loadSavedData();
      
      // Load score info
      const info = EnhancedScoreService.getScoreInfo();
      setState(prev => ({ ...prev, scoreInfo: info }));
      
      // Subscribe to timer updates
      timerUnsubscribe.current = EnhancedTimerService.subscribe((data) => {
        setState(prev => ({
          ...prev,
          remainingTime: data.remainingTime,
          isTimerRunning: data.isTracking,
          debtTime: data.debtTime,
        }));
      });
      
      // Start menu music
      SoundService.startMenuMusic();
      
      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      console.error('Failed to initialize home:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };
  
  const startFloatingAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -15,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };
  
  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };
  
  const handlePlayPress = () => {
    SoundService.playButtonPress();
    navigation.navigate('Categories');
  };
  
  const handleLeaderboardPress = () => {
    SoundService.playButtonPress();
    navigation.navigate('Leaderboard');
  };
  
  const handleDailyGoalsPress = () => {
    SoundService.playButtonPress();
    navigation.navigate('DailyGoals');
  };
  
  const handlePeekingMascotPress = () => {
    // Show timer details when mascot is pressed
    const formattedTime = EnhancedTimerService.formatTime(state.remainingTime);
    let message = '';
    
    if (state.debtTime > 0) {
      const penalty = EnhancedTimerService.getDebtPenalty();
      message = `⏰ Timer Status\n\nTime Debt: -${EnhancedTimerService.formatTime(-state.debtTime)}\nPoint Penalty: -${penalty} points\n\nComplete quizzes to earn time and pay off your debt!`;
      setMascotType('sad');
    } else if (state.remainingTime > 0) {
      message = `⏰ Timer Status\n\nRemaining Time: ${formattedTime}\nTimer: ${state.isTimerRunning ? 'Running' : 'Paused'}\n\nThe timer runs when you leave the app!`;
      setMascotType('happy');
    } else {
      message = `⏰ No time remaining!\n\nComplete quizzes to earn more screen time:\n• Easy: +1 minute\n• Medium: +2 minutes\n• Hard: +3 minutes`;
      setMascotType('excited');
    }
    
    setMascotMessage(message);
    setShowMascot(true);
  };
  
  const getTimerColor = () => {
    if (state.debtTime > 0) return '#F44336'; // Red for debt
    if (state.remainingTime <= 300) return '#FF9F1C'; // Orange for low time
    return '#4CAF50'; // Green for good time
  };
  
  const getTimerText = () => {
    if (state.debtTime > 0) {
      return `-${EnhancedTimerService.formatTime(-state.debtTime)}`;
    }
    return EnhancedTimerService.formatTime(state.remainingTime);
  };
  
  if (state.isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#FFF8E7" barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF9F1C" />
          <Text style={styles.loadingText}>Loading BrainBites...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#FFF8E7" barStyle="dark-content" />
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Timer Display */}
        <Animated.View 
          style={[
            styles.timerCard,
            {
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
                { translateY: floatAnim }
              ]
            }
          ]}
        >
          <LinearGradient
            colors={['#FFFFFF', '#FFF8E7']}
            style={styles.timerGradient}
          >
            <Text style={styles.timerLabel}>
              {state.debtTime > 0 ? 'Time Debt' : 'Screen Time Remaining'}
            </Text>
            <Text style={[styles.timerText, { color: getTimerColor() }]}>
              {getTimerText()}
            </Text>
            <View style={styles.timerStatus}>
              <View style={[styles.statusDot, { backgroundColor: state.isTimerRunning ? '#4CAF50' : '#FF9F1C' }]} />
              <Text style={styles.statusText}>
                {state.isTimerRunning ? 'Timer Running' : 'Timer Paused'}
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>
        
        {/* Score Display */}
        <Animated.View 
          style={[
            styles.scoreContainer,
            { opacity: fadeAnim }
          ]}
        >
          <ScoreDisplay
            score={state.scoreInfo.dailyScore || 0}
            streak={state.scoreInfo.currentStreak || 0}
            showMilestoneProgress={true}
            animate={true}
            variant="horizontal"
          />
        </Animated.View>
        
        {/* Main Play Button */}
        <Animated.View 
          style={{
            transform: [{ scale: pulseAnim }],
            opacity: fadeAnim
          }}
        >
          <TouchableOpacity
            style={styles.playButton}
            onPress={handlePlayPress}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#FFB347', '#FF9F1C']}
              style={styles.playButtonGradient}
            >
              <Icon name="play-circle-outline" size={48} color="white" />
              <Text style={styles.playButtonText}>PLAY QUIZ</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
        
        {/* Quick Actions */}
        <Animated.View 
          style={[
            styles.quickActions,
            {
              opacity: fadeAnim,
              transform: [{ translateY: scaleAnim.interpolate({
                inputRange: [0.8, 1],
                outputRange: [20, 0]
              })}]
            }
          ]}
        >
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleDailyGoalsPress}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: '#4CAF50' }]}>
              <Icon name="target" size={24} color="white" />
            </View>
            <Text style={styles.actionButtonText}>Daily Goals</Text>
            <Icon name="chevron-right" size={20} color="#999" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleLeaderboardPress}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: '#FF9F1C' }]}>
              <Icon name="trophy-outline" size={24} color="white" />
            </View>
            <Text style={styles.actionButtonText}>Leaderboard</Text>
            <Icon name="chevron-right" size={20} color="#999" />
          </TouchableOpacity>
        </Animated.View>
        
        {/* Stats Summary */}
        <Animated.View 
          style={[
            styles.statsCard,
            { opacity: fadeAnim }
          ]}
        >
          <Text style={styles.statsTitle}>Today's Progress</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Icon name="help-circle-outline" size={24} color="#4CAF50" />
              <Text style={styles.statValue}>{state.scoreInfo.questionsToday || 0}</Text>
              <Text style={styles.statLabel}>Questions</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Icon name="check-circle-outline" size={24} color="#2196F3" />
              <Text style={styles.statValue}>{state.scoreInfo.accuracy || 0}%</Text>
              <Text style={styles.statLabel}>Accuracy</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Icon name="fire" size={24} color="#FF9F1C" />
              <Text style={styles.statValue}>{state.scoreInfo.highestStreak || 0}</Text>
              <Text style={styles.statLabel}>Best Streak</Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
      
      {/* Enhanced Mascot */}
      <EnhancedMascotDisplay
        type={mascotType}
        position="left"
        showMascot={showMascot}
        message={mascotMessage}
        onDismiss={() => setShowMascot(false)}
        autoHide={true}
        autoHideDuration={5000}
        fullScreen={true}
        onPeekingPress={handlePeekingMascotPress}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    color: '#777',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif-medium',
  },
  timerCard: {
    marginBottom: 24,
    borderRadius: 24,
    overflow: 'hidden',
    ...theme.shadows.lg,
  },
  timerGradient: {
    padding: 24,
    alignItems: 'center',
  },
  timerLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif-medium',
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Black' : 'sans-serif-black',
    marginBottom: 12,
  },
  timerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
  },
  scoreContainer: {
    marginBottom: 24,
  },
  playButton: {
    marginBottom: 24,
    borderRadius: 32,
    overflow: 'hidden',
    ...theme.shadows.lg,
  },
  playButtonGradient: {
    paddingVertical: 24,
    paddingHorizontal: 48,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  playButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 12,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Black' : 'sans-serif-black',
  },
  quickActions: {
    marginBottom: 24,
  },
  actionButton: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    ...theme.shadows.sm,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif-medium',
  },
  statsCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 20,
    ...theme.shadows.md,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif-medium',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginVertical: 4,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Black' : 'sans-serif-black',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#eee',
    marginHorizontal: 16,
  },
});

export default HomeScreen;