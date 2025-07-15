import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useUserStore } from '../store/useUserStore';
import { useTimerStore } from '../store/useTimerStore';
import { SoundService } from '../services/SoundService';
import AnimatedBackground from '../components/common/AnimatedBackground';
import DifficultyCard from '../components/common/DifficultyCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type NavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface DifficultyOption {
  level: 'easy' | 'medium' | 'hard';
  title: string;
  subtitle: string;
  color: string;
  icon: string;
  points: string;
  timeReward: number;
}

const difficulties: DifficultyOption[] = [
  {
    level: 'easy',
    title: 'Easy',
    subtitle: 'Perfect for warming up!',
    color: '#98E4A6',
    icon: 'leaf-outline',
    points: '10 pts',
    timeReward: 1,
  },
  {
    level: 'medium',
    title: 'Medium',
    subtitle: 'Challenge your brain!',
    color: '#FFCAA0',
    icon: 'flame',
    points: '20 pts',
    timeReward: 2,
  },
  {
    level: 'hard',
    title: 'Hard',
    subtitle: 'Are you a genius?',
    color: '#FFB3B3',
    icon: 'flash',
    points: '30 pts',
    timeReward: 3,
  },
];

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const userStore = useUserStore();
  const timerStore = useTimerStore();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnims = useRef(
    difficulties.map(() => new Animated.Value(SCREEN_WIDTH))
  ).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const streakScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Check daily goals
    userStore.checkDailyGoals();
    
    // Ensure menu music is playing
    SoundService.playMenuMusic();
    
    // Entrance animations
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Stagger difficulty cards animation
    const staggerTime = 150;
    slideAnims.forEach((anim, index) => {
      Animated.spring(anim, {
        toValue: 0,
        delay: index * staggerTime,
        tension: 10,
        friction: 7,
        useNativeDriver: true,
      }).start();
    });

    // Continuous pulse animation for categories button
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Float animation for decorative elements
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
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

    // Streak animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(streakScale, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(streakScale, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleDifficultyPress = (difficulty: 'easy' | 'medium' | 'hard') => {
    SoundService.playButtonClick();
    navigation.navigate('Quiz', { difficulty });
  };

  const handleCategoriesPress = () => {
    SoundService.playButtonClick();
    navigation.navigate('Categories');
  };

  const handleDailyGoalsPress = () => {
    SoundService.playButtonClick();
    navigation.navigate('DailyGoals');
  };

  const handleLeaderboardPress = () => {
    SoundService.playButtonClick();
    navigation.navigate('Leaderboard');
  };

  const getDayOfWeek = (index: number): string => {
    const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    return days[index];
  };

  const getCurrentDayIndex = (): number => {
    const today = new Date().getDay();
    return today === 0 ? 6 : today - 1; // Convert Sunday=0 to Sunday=6
  };

  return (
    <LinearGradient
      colors={['#FFF8E1', '#FFF3E0', '#FFECB3']}
      style={styles.container}
    >
      <AnimatedBackground />
      
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Daily Streak Section */}
          <Animated.View 
            style={[
              styles.streakSection,
              { 
                opacity: fadeAnim,
                transform: [{ scale: streakScale }]
              }
            ]}
          >
            <View style={styles.streakCard}>
              <View style={styles.streakHeader}>
                <Icon name="flame-outline" size={24} color="#9E9E9E" />
                <Text style={styles.streakTitle}>Daily Streak</Text>
              </View>
              
              <View style={styles.streakStats}>
                <Text style={styles.streakCount}>{userStore.flowStreak} days</Text>
                <View style={styles.streakIcons}>
                  <View style={styles.streakIcon}>
                    <Icon name="star-outline" size={20} color="#FFD700" />
                    <Text style={styles.streakIconText}>0</Text>
                  </View>
                  <View style={styles.streakIcon}>
                    <Icon name="time-outline" size={20} color="#4CAF50" />
                    <Text style={styles.streakIconText}>0:00</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.weekProgress}>
                {Array.from({ length: 7 }, (_, index) => (
                  <View 
                    key={index} 
                    style={[
                      styles.dayCircle,
                      index === getCurrentDayIndex() && styles.currentDay
                    ]}
                  >
                    <Text style={[
                      styles.dayText,
                      index === getCurrentDayIndex() && styles.currentDayText
                    ]}>
                      {getDayOfWeek(index)}
                    </Text>
                  </View>
                ))}
              </View>
              
              <Text style={styles.streakMotivation}>
                Play today to continue your streak!
              </Text>
            </View>
          </Animated.View>

          {/* Choose Your Challenge Section */}
          <Animated.View style={[styles.challengeSection, { opacity: fadeAnim }]}>
            <Text style={styles.sectionTitle}>Choose Your Challenge</Text>
            
            <View style={styles.difficultyContainer}>
              {difficulties.map((difficulty, index) => (
                <Animated.View
                  key={difficulty.level}
                  style={{
                    transform: [{ translateX: slideAnims[index] }],
                  }}
                >
                  <DifficultyCard
                    difficulty={difficulty}
                    onPress={() => handleDifficultyPress(difficulty.level)}
                    style={{ marginBottom: 15 }}
                  />
                </Animated.View>
              ))}
            </View>

            <Animated.View 
              style={[
                styles.quickActions,
                {
                  transform: [
                    { translateY: floatAnim },
                  ],
                },
              ]}
            >
              <TouchableOpacity
                style={[styles.actionButton, styles.categoriesButton]}
                onPress={handleCategoriesPress}
              >
                <Animated.View
                  style={{
                    transform: [{ scale: pulseAnim }],
                  }}
                >
                  <Icon name="grid-outline" size={24} color="#FFF" />
                </Animated.View>
                <Text style={styles.actionButtonText}>Categories</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.goalsButton]}
                onPress={handleDailyGoalsPress}
              >
                <Icon name="checkmark-circle-outline" size={24} color="#FFF" />
                <Text style={styles.actionButtonText}>Daily Goals</Text>
                {userStore.dailyGoals.filter(g => !g.completed).length > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {userStore.dailyGoals.filter(g => !g.completed).length}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.leaderboardButton]}
                onPress={handleLeaderboardPress}
              >
                <Icon name="trophy-outline" size={24} color="#FFF" />
                <Text style={styles.actionButtonText}>Leaderboard</Text>
                <Text style={styles.rankText}>#{userStore.stats.leaderboardRank}</Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
    paddingTop: 0,
  },
  streakSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  streakCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  streakTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
    fontFamily: 'Quicksand-Bold',
  },
  streakStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  streakCount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Quicksand-Bold',
  },
  streakIcons: {
    flexDirection: 'row',
    gap: 15,
  },
  streakIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  streakIconText: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Nunito-Regular',
  },
  weekProgress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  dayCircle: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  currentDay: {
    borderColor: '#FF9800',
    backgroundColor: '#FFF3E0',
  },
  dayText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#999',
    fontFamily: 'Nunito-Bold',
  },
  currentDayText: {
    color: '#FF9800',
  },
  streakMotivation: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'Nunito-Regular',
  },
  challengeSection: {
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'Quicksand-Bold',
  },
  difficultyContainer: {
    marginBottom: 30,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  actionButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 15,
    alignItems: 'center',
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    position: 'relative',
  },
  categoriesButton: {
    backgroundColor: '#C8B3FF',
  },
  goalsButton: {
    backgroundColor: '#94C7FF',
  },
  leaderboardButton: {
    backgroundColor: '#FFCAA0',
  },
  actionButtonText: {
    fontSize: 12,
    color: '#FFF',
    marginTop: 5,
    fontFamily: 'Nunito-Bold',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: 'bold',
  },
  rankText: {
    fontSize: 10,
    color: '#FFF',
    marginTop: 2,
    fontFamily: 'Nunito-Regular',
  },
});

export default HomeScreen;