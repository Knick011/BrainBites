import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
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
    color: '#4CAF50',
    icon: 'leaf',
    points: '10 pts',
    timeReward: 1,
  },
  {
    level: 'medium',
    title: 'Medium',
    subtitle: 'Challenge your brain!',
    color: '#FFA500',
    icon: 'flame',
    points: '20 pts',
    timeReward: 2,
  },
  {
    level: 'hard',
    title: 'Hard',
    subtitle: 'Are you a genius?',
    color: '#F44336',
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

  useEffect(() => {
    // Check daily goals
    userStore.checkDailyGoals();
    
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

  const formatTime = (milliseconds: number): string => {
    const isNegative = milliseconds < 0;
    const absTime = Math.abs(milliseconds);
    const minutes = Math.floor(absTime / 60000);
    const seconds = Math.floor((absTime % 60000) / 1000);
    
    const formatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    return isNegative ? `-${formatted}` : formatted;
  };

  return (
    <LinearGradient
      colors={['#FFE4B5', '#FFD700', '#FFA500']}
      style={styles.container}
    >
      <AnimatedBackground />
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <View style={styles.userInfo}>
            <Text style={styles.greeting}>Hello, {userStore.username}! 👋</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Icon name="trophy" size={16} color="#FFA500" />
                <Text style={styles.statText}>{userStore.stats.totalScore} pts</Text>
              </View>
              <View style={styles.statItem}>
                <Icon name="flame" size={16} color="#FF6347" />
                <Text style={styles.statText}>{userStore.flowStreak} days</Text>
              </View>
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.timerButton}
            onPress={() => {}}
          >
            <Icon name="time" size={20} color={timerStore.remainingTime < 0 ? '#F44336' : '#4CAF50'} />
            <Text style={[
              styles.timerText,
              timerStore.remainingTime < 0 && styles.timerNegative
            ]}>
              {formatTime(timerStore.remainingTime)}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[styles.mainContent, { opacity: fadeAnim }]}>
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
                <Icon name="grid" size={24} color="#FFF" />
              </Animated.View>
              <Text style={styles.actionButtonText}>Categories</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.goalsButton]}
              onPress={handleDailyGoalsPress}
            >
              <Icon name="checkmark-circle" size={24} color="#FFF" />
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
              <Icon name="podium" size={24} color="#FFF" />
              <Text style={styles.actionButtonText}>Leaderboard</Text>
              <Text style={styles.rankText}>#{userStore.stats.leaderboardRank}</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        <Animated.View 
          style={[
            styles.motivationalSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: floatAnim }],
            },
          ]}
        >
          <View style={styles.motivationalCard}>
            <Text style={styles.motivationalTitle}>Today's Tip 💡</Text>
            <Text style={styles.motivationalText}>
              "The more you learn, the more places you'll go!" - Dr. Seuss
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  userInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 5,
    fontFamily: 'Quicksand-Bold',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 15,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statText: {
    fontSize: 14,
    color: '#FFF',
    fontFamily: 'Nunito-Regular',
  },
  timerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  timerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Nunito-Bold',
  },
  timerNegative: {
    color: '#F44336',
  },
  mainContent: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
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
    backgroundColor: '#9C27B0',
  },
  goalsButton: {
    backgroundColor: '#2196F3',
  },
  leaderboardButton: {
    backgroundColor: '#FF9800',
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
    backgroundColor: '#F44336',
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
  motivationalSection: {
    paddingHorizontal: 20,
  },
  motivationalCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  motivationalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
    fontFamily: 'Quicksand-Bold',
  },
  motivationalText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    fontFamily: 'Nunito-Regular',
  },
});

export default HomeScreen;