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
  Dimensions,
  Easing,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import theme from '../styles/theme';
import SoundService from '../services/SoundService';
import EnhancedTimerService from '../services/EnhancedTimerService';
import EnhancedScoreService from '../services/EnhancedScoreService';
import EnhancedMascotDisplay from '../components/Mascot/EnhancedMascotDisplay';
import ScoreDisplay from '../components/common/ScoreDisplay';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

type NavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;
type MascotType = 'happy' | 'sad' | 'excited' | 'depressed' | 'gamemode' | 'below';

interface DifficultyButton {
  level: 'easy' | 'medium' | 'hard';
  title: string;
  color: string[];
  icon: string;
  points: number;
  time: number;
}

const DIFFICULTY_BUTTONS: DifficultyButton[] = [
  {
    level: 'easy',
    title: 'Easy',
    color: ['#81C784', '#66BB6A', '#4CAF50'],
    icon: 'emoticon-happy-outline',
    points: 10,
    time: 1
  },
  {
    level: 'medium',
    title: 'Medium',
    color: ['#64B5F6', '#42A5F5', '#2196F3'],
    icon: 'emoticon-neutral-outline',
    points: 20,
    time: 2
  },
  {
    level: 'hard',
    title: 'Hard',
    color: ['#E57373', '#EF5350', '#F44336'],
    icon: 'emoticon-sad-outline',
    points: 30,
    time: 3
  }
];

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  
  const [state, setState] = useState({
    remainingTime: 0,
    isTimerRunning: false,
    debtTime: 0,
    scoreInfo: {
      dailyScore: 0,
      currentStreak: 0,
      highestStreak: 0,
      questionsToday: 0,
      accuracy: 0,
    },
    isLoading: true,
    dailyStreak: 0,
    lastPlayedDate: null as string | null,
  });
  
  const [mascotType, setMascotType] = useState<MascotType>('happy');
  const [mascotMessage, setMascotMessage] = useState('');
  const [showMascot, setShowMascot] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const buttonAnims = useRef(DIFFICULTY_BUTTONS.map(() => new Animated.Value(0))).current;
  
  const timerUnsubscribe = useRef<(() => void) | null>(null);
  
  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      refreshData();
    }, [])
  );
  
  useEffect(() => {
    initializeHome();
    
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
    
    // Animate difficulty buttons
    buttonAnims.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 600,
        delay: 100 + index * 100,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.2)),
      }).start();
    });
    
    return () => {
      if (timerUnsubscribe.current) {
        timerUnsubscribe.current();
      }
    };
  }, []);
  
  const initializeHome = async () => {
    try {
      await EnhancedTimerService.initialize();
      await EnhancedScoreService.loadSavedData();
      
      const info = EnhancedScoreService.getScoreInfo();
      const streak = await loadDailyStreak();
      
      setState(prev => ({ 
        ...prev, 
        scoreInfo: info,
        dailyStreak: streak.streak,
        lastPlayedDate: streak.lastDate
      }));
      
      timerUnsubscribe.current = EnhancedTimerService.subscribe((data) => {
        setState(prev => ({
          ...prev,
          remainingTime: data.remainingTime,
          isTimerRunning: data.isTracking,
          debtTime: data.debtTime,
        }));
      });
      
      SoundService.startMenuMusic();
      
      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      console.error('Failed to initialize home:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };
  
  const refreshData = async () => {
    const info = EnhancedScoreService.getScoreInfo();
    const streak = await loadDailyStreak();
    
    setState(prev => ({ 
      ...prev, 
      scoreInfo: info,
      dailyStreak: streak.streak,
      lastPlayedDate: streak.lastDate
    }));
  };
  
  const loadDailyStreak = async () => {
    try {
      const lastDate = await AsyncStorage.getItem('@BrainBites:lastPlayedDate');
      const streak = await AsyncStorage.getItem('@BrainBites:dailyStreak');
      
      const today = new Date().toDateString();
      const currentStreak = parseInt(streak || '0', 10);
      
      if (lastDate === today) {
        return { streak: currentStreak, lastDate };
      } else if (lastDate) {
        const last = new Date(lastDate);
        const diff = Math.floor((new Date().getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diff === 1) {
          // Consecutive day
          return { streak: currentStreak, lastDate };
        } else {
          // Streak broken
          return { streak: 0, lastDate: null };
        }
      }
      
      return { streak: 0, lastDate: null };
    } catch (error) {
      console.error('Error loading daily streak:', error);
      return { streak: 0, lastDate: null };
    }
  };
  
  const handleDifficultyPress = (difficulty: 'easy' | 'medium' | 'hard') => {
    SoundService.playButtonPress();
    navigation.navigate('Quiz', { difficulty });
  };
  
  const handleCategoriesPress = () => {
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
    const formattedTime = EnhancedTimerService.formatTime(state.remainingTime);
    let message = '';
    
    if (state.debtTime > 0) {
      const penalty = EnhancedTimerService.getDebtPenalty();
      message = `⏰ Timer Status\n\nTime Debt: -${EnhancedTimerService.formatTime(-state.debtTime)}\nPoint Penalty: -${penalty} points\n\nComplete quizzes to earn time!`;
      setMascotType('sad');
    } else if (state.remainingTime > 0) {
      message = `⏰ Timer Status\n\nRemaining Time: ${formattedTime}\nTimer: ${state.isTimerRunning ? 'Running' : 'Paused'}\n\nKeep going, you're doing great!`;
      setMascotType('happy');
    } else {
      message = `⏰ Timer Status\n\nNo time remaining!\n\nComplete quizzes to earn more time!`;
      setMascotType('sad');
    }
    
    setMascotMessage(message);
    setShowMascot(true);
  };
  
  const renderStreakFlow = () => {
    const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const today = new Date().getDay();
    const mondayFirst = [(today + 6) % 7]; // Convert to Monday-first
    
    return (
      <View style={styles.streakContainer}>
        <View style={styles.streakHeader}>
          <Icon name="fire" size={24} color="#FF9F1C" />
          <Text style={styles.streakTitle}>Daily Streak</Text>
          <Text style={styles.streakCount}>{state.dailyStreak} days</Text>
        </View>
        <View style={styles.streakDays}>
          {days.map((day, index) => {
            const isToday = index === mondayFirst[0];
            const isCompleted = state.lastPlayedDate === new Date().toDateString() && isToday;
            const isPast = index < mondayFirst[0];
            
            return (
              <View key={index} style={styles.streakDayContainer}>
                <Text style={styles.streakDayLabel}>{day}</Text>
                <View style={[
                  styles.streakDay,
                  isCompleted && styles.streakDayCompleted,
                  isToday && styles.streakDayToday,
                  isPast && state.dailyStreak > 0 && styles.streakDayPast
                ]}>
                  {isCompleted && <Icon name="check" size={16} color="white" />}
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  };
  
  if (state.isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#FFF8E7" barStyle="dark-content" />
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <Text style={styles.headerTitle}>Brain Bites</Text>
          <ScoreDisplay score={state.scoreInfo.dailyScore} />
        </Animated.View>
        
        {/* Streak Flow */}
        <Animated.View style={[{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          {renderStreakFlow()}
        </Animated.View>
        
        {/* Difficulty Buttons */}
        <View style={styles.difficultySection}>
          <Text style={styles.sectionTitle}>Choose Difficulty</Text>
          <View style={styles.difficultyButtons}>
            {DIFFICULTY_BUTTONS.map((difficulty, index) => (
              <Animated.View
                key={difficulty.level}
                style={{
                  transform: [
                    {
                      translateY: buttonAnims[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [50, 0]
                      })
                    },
                    {
                      scale: buttonAnims[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1]
                      })
                    }
                  ],
                  opacity: buttonAnims[index]
                }}
              >
                <TouchableOpacity
                  onPress={() => handleDifficultyPress(difficulty.level)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={difficulty.color}
                    style={styles.difficultyButton}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Icon name={difficulty.icon} size={40} color="white" />
                    <Text style={styles.difficultyTitle}>{difficulty.title}</Text>
                    <View style={styles.difficultyInfo}>
                      <View style={styles.infoItem}>
                        <Icon name="star" size={14} color="white" />
                        <Text style={styles.infoText}>+{difficulty.points}</Text>
                      </View>
                      <View style={styles.infoItem}>
                        <Icon name="clock-outline" size={14} color="white" />
                        <Text style={styles.infoText}>+{difficulty.time}m</Text>
                      </View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </View>
        
        {/* Categories Button */}
        <TouchableOpacity 
          style={styles.categoriesButton}
          onPress={handleCategoriesPress}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#FFD54F', '#FFB300', '#FF6F00']}
            style={styles.categoriesGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Icon name="folder-multiple-outline" size={24} color="white" />
            <Text style={styles.categoriesText}>Browse Categories</Text>
            <Icon name="chevron-right" size={24} color="white" />
          </LinearGradient>
        </TouchableOpacity>
        
        {/* Quick Actions */}
        <View style={styles.quickActions}>
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
        </View>
        
        {/* Today's Stats */}
        <Animated.View style={[styles.statsCard, { opacity: fadeAnim }]}>
          <Text style={styles.statsTitle}>Today's Progress</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Icon name="help-circle-outline" size={24} color="#4CAF50" />
              <Text style={styles.statValue}>{state.scoreInfo.questionsToday || 0}</Text>
              <Text style={styles.statLabel}>Questions</Text>
            </View>
            <View style={styles.statItem}>
              <Icon name="percent" size={24} color="#2196F3" />
              <Text style={styles.statValue}>{Math.round(state.scoreInfo.accuracy || 0)}%</Text>
              <Text style={styles.statLabel}>Accuracy</Text>
            </View>
            <View style={styles.statItem}>
              <Icon name="star" size={24} color="#FF9F1C" />
              <Text style={styles.statValue}>{state.scoreInfo.dailyScore || 0}</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
      
      <EnhancedMascotDisplay
        type={mascotType}
        position="left"
        showMascot={showMascot}
        message={mascotMessage}
        onDismiss={() => setShowMascot(false)}
        autoHide={true}
        fullScreen={true}
        onPeekingPress={handlePeekingMascotPress}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF8E7',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif-medium',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Black' : 'sans-serif-black',
  },
  streakContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    ...theme.shadows.medium,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  streakTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif-medium',
  },
  streakCount: {
    fontSize: 16,
    color: '#FF9F1C',
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif-medium',
  },
  streakDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  streakDayContainer: {
    alignItems: 'center',
  },
  streakDayLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
  },
  streakDay: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  streakDayCompleted: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  streakDayToday: {
    borderColor: '#FF9F1C',
    borderWidth: 2,
  },
  streakDayPast: {
    backgroundColor: '#81C784',
    borderColor: '#81C784',
  },
  difficultySection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif-medium',
  },
  difficultyButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  difficultyButton: {
    width: (width - 48) / 3,
    height: 140,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.medium,
  },
  difficultyTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif-medium',
  },
  difficultyInfo: {
    marginTop: 8,
    flexDirection: 'row',
    gap: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  infoText: {
    color: 'white',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
  },
  categoriesButton: {
    marginBottom: 24,
  },
  categoriesGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 16,
    ...theme.shadows.medium,
  },
  categoriesText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginLeft: 12,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif-medium',
  },
  quickActions: {
    marginBottom: 24,
  },
  actionButton: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    ...theme.shadows.small,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif-medium',
  },
  statsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    ...theme.shadows.medium,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif-medium',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Black' : 'sans-serif-black',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
  },
});

export default HomeScreen;