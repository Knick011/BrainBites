import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useUserStore } from '../store/useUserStore';
import { useTimerStore } from '../store/useTimerStore';
import { SoundService } from '../services/SoundService';
import AnimatedBackground from '../components/common/AnimatedBackground';
import * as Progress from 'react-native-progress';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DailyGoalsScreen: React.FC = () => {
  const navigation = useNavigation();
  const userStore = useUserStore();
  const timerStore = useTimerStore();
  const dailyGoals = userStore.dailyGoals;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnims = useRef(
    dailyGoals.map(() => new Animated.Value(SCREEN_WIDTH))
  ).current;
  const celebrateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Update goals progress
    userStore.checkDailyGoals();

    // Entrance animations
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Stagger goal cards animation
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
  }, []);

  const handleClaimReward = (goalId: string, reward: number) => {
    SoundService.playGoalComplete();
    
    // Mark goal as completed
    userStore.completeGoal(goalId);
    
    // Add time reward
    timerStore.addTime(reward);
    
    // Celebration animation
    Animated.sequence([
      Animated.timing(celebrateAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(celebrateAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const getGoalColor = (type: string) => {
    switch (type) {
      case 'questions':
        return '#2196F3'; // blue
      case 'streak':
        return '#FF9800'; // orange
      case 'accuracy':
        return '#4CAF50'; // green
      case 'time':
        return '#9C27B0'; // purple
      default:
        return '#FFA500'; // fallback orange
    }
  };

  const renderGoal = (goal: any, index: number) => {
    const progress = Math.min(1, goal.current / goal.target);
    const isCompleted = goal.completed;
    const canClaim = progress >= 1 && !isCompleted;

    return (
      <Animated.View
        key={goal.id}
        style={[
          styles.goalCard,
          {
            transform: [{ translateX: slideAnims[index] }],
            opacity: fadeAnim,
          },
        ]}
      >
        <View style={[styles.goalHeader, { backgroundColor: getGoalColor(goal.type) }]}>
          <Icon name={getGoalIcon(goal.type)} size={30} color="#FFF" />
          <View style={styles.rewardBadge}>
            <Icon name="time" size={16} color="#FFF" />
            <Text style={styles.rewardText}>+{goal.reward}min</Text>
          </View>
        </View>

        <View style={styles.goalContent}>
          <Text style={styles.goalDescription}>{goal.description}</Text>
          
          <View style={styles.progressContainer}>
            <Progress.Bar
              progress={progress}
              width={SCREEN_WIDTH - 100}
              height={8}
              color={getGoalColor(goal.type)}
              unfilledColor="#E0E0E0"
              borderWidth={0}
              borderRadius={4}
            />
            <Text style={styles.progressText}>
              {goal.current}/{goal.target} {goal.type === 'accuracy' ? '%' : ''}
            </Text>
          </View>

          {canClaim && (
            <TouchableOpacity
              style={[styles.claimButton, { backgroundColor: getGoalColor(goal.type) }]}
              onPress={() => handleClaimReward(goal.id, goal.reward)}
            >
              <Text style={styles.claimButtonText}>Claim Reward!</Text>
                              <Icon name="gift-outline" size={20} color="#FFF" />
            </TouchableOpacity>
          )}

          {isCompleted && (
            <View style={styles.completedBadge}>
                              <Icon name="checkmark-circle-outline" size={24} color="#4CAF50" />
              <Text style={styles.completedText}>Completed!</Text>
            </View>
          )}
        </View>
      </Animated.View>
    );
  };

  const getGoalIcon = (type: string) => {
    switch (type) {
      case 'questions':
        return 'help-circle';
      case 'streak':
        return 'flame';
      case 'accuracy':
        return '#4CAF50';
      case 'time':
        return '#9C27B0';
      default:
        return '#FFA500';
    }
  };

  const completedCount = dailyGoals.filter(g => g.completed).length;
  const totalRewards = dailyGoals.reduce((sum, g) => sum + (g.completed ? g.reward : 0), 0);

  return (
    <LinearGradient
      colors={['#FFE4B5', '#FFD700', '#FFA500']}
      style={styles.container}
    >
      <AnimatedBackground />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Icon name="arrow-back-circle" size={30} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Daily Goals</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.statsCard, { opacity: fadeAnim }]}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{completedCount}/{dailyGoals.length}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalRewards} min</Text>
            <Text style={styles.statLabel}>Earned Today</Text>
          </View>
        </Animated.View>

        <View style={styles.goalsContainer}>
          {dailyGoals.map((goal, index) => renderGoal(goal, index))}
        </View>

        <Animated.View 
          style={[
            styles.motivationCard,
            {
              opacity: fadeAnim,
              transform: [
                {
                  scale: celebrateAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.05],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.motivationTitle}>
            {completedCount === dailyGoals.length ? '🎉 All Goals Complete!' : '💪 Keep Going!'}
          </Text>
          <Text style={styles.motivationText}>
            {completedCount === dailyGoals.length
              ? "Amazing work! You've conquered all today's challenges!"
              : `Complete ${dailyGoals.length - completedCount} more goal${
                  dailyGoals.length - completedCount > 1 ? 's' : ''
                } to maximize your rewards!`}
          </Text>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    fontFamily: 'Quicksand-Bold',
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  statsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Quicksand-Bold',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    fontFamily: 'Nunito-Regular',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E0E0E0',
  },
  goalsContainer: {
    marginBottom: 20,
  },
  goalCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    marginBottom: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  rewardText: {
    color: '#FFF',
    fontWeight: 'bold',
    marginLeft: 5,
    fontSize: 14,
    fontFamily: 'Nunito-Bold',
  },
  goalContent: {
    padding: 20,
  },
  goalDescription: {
    fontSize: 16,
    color: '#333',
    marginBottom: 15,
    fontFamily: 'Nunito-Bold',
  },
  progressContainer: {
    marginBottom: 15,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    textAlign: 'right',
    fontFamily: 'Nunito-Regular',
  },
  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  claimButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Nunito-Bold',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  completedText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
    fontFamily: 'Nunito-Bold',
  },
  motivationCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  motivationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    fontFamily: 'Quicksand-Bold',
  },
  motivationText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'Nunito-Regular',
  },
});

export default DailyGoalsScreen;