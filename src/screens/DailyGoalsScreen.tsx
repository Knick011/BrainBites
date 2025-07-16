import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useUserStore } from '../store/useUserStore';
import { SoundService } from '../services/SoundService';
import ProgressBar from '../components/ProgressBar';

const DailyGoalsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { dailyGoals, completeGoal } = useUserStore();

  const getGoalIcon = (type: string) => {
    switch (type) {
      case 'questions': return 'help-circle';
      case 'streak': return 'flame';
      case 'accuracy': return 'checkmark-circle';
      default: return 'star';
    }
  };

  const getGoalColor = (type: string) => {
    switch (type) {
      case 'questions': return '#4ECDC4';
      case 'streak': return '#FF9F1C';
      case 'accuracy': return '#4CAF50';
      default: return '#FFB347';
    }
  };

  const handleClaimReward = (goalId: string) => {
    SoundService.playCorrect();
    completeGoal(goalId);
    // Add time reward logic here
  };

  const renderGoal = (goal: any) => {
    const progress = goal.current / goal.target;
    const isComplete = progress >= 1;
    const color = getGoalColor(goal.type);

    return (
      <View key={goal.id} style={styles.goalCard}>
        <View style={[styles.goalIcon, { backgroundColor: color + '20' }]}>
          <Icon name={getGoalIcon(goal.type)} size={24} color={color} />
        </View>
        
        <View style={styles.goalContent}>
          <Text style={styles.goalTitle}>{goal.title}</Text>
          <Text style={styles.goalDescription}>{goal.description}</Text>
          
          <View style={styles.progressContainer}>
            <ProgressBar progress={progress} color={color} />
            <Text style={styles.progressText}>
              {goal.current}/{goal.target} {goal.unit}
            </Text>
          </View>
          
          {isComplete && !goal.completed && (
            <TouchableOpacity
              style={[styles.claimButton, { backgroundColor: color }]}
              onPress={() => handleClaimReward(goal.id)}
            >
              <Text style={styles.claimButtonText}>Claim {goal.reward}</Text>
              <Icon name="time" size={16} color="white" />
            </TouchableOpacity>
          )}
          
          {goal.completed && (
            <View style={styles.completedBadge}>
              <Icon name="checkmark-circle" size={20} color={color} />
              <Text style={[styles.completedText, { color }]}>Completed!</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Daily Goals</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Today's Progress</Text>
          <Text style={styles.summarySubtitle}>
            {dailyGoals.filter(g => g.completed).length} of {dailyGoals.length} goals completed
          </Text>
          <View style={styles.summaryProgress}>
            {dailyGoals.map((goal, index) => (
              <View
                key={index}
                style={[
                  styles.summaryDot,
                  goal.completed && styles.summaryDotCompleted
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.goalsContainer}>
          {dailyGoals.map(renderGoal)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8E7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF8E7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'Roboto-Bold',
  },
  scrollView: {
    flex: 1,
  },
  summaryCard: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  summarySubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  summaryProgress: {
    flexDirection: 'row',
    gap: 8,
  },
  summaryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E0E0E0',
  },
  summaryDotCompleted: {
    backgroundColor: '#4CAF50',
  },
  goalsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  goalCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  goalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  goalContent: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  goalDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    textAlign: 'right',
  },
  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
  },
  claimButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  completedText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default DailyGoalsScreen;