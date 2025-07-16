import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useUserStore } from '../store/useUserStore';
import { SoundService } from '../services/SoundService';
import DailyFlowCard from '../components/DailyFlowCard';

type NavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

const DIFFICULTY_LEVELS = [
  {
    id: 'easy',
    title: 'Easy',
    subtitle: 'Perfect for beginners',
    icon: 'leaf',
    color: '#4CAF50',
    gradient: ['#4CAF50', '#66BB6A'],
    questions: '5-10 questions',
  },
  {
    id: 'medium',
    title: 'Medium',
    subtitle: 'Challenge yourself',
    icon: 'flame',
    color: '#FF9800',
    gradient: ['#FF9800', '#FFB74D'],
    questions: '10-15 questions',
  },
  {
    id: 'hard',
    title: 'Hard',
    subtitle: 'Expert level',
    icon: 'diamond',
    color: '#9C27B0',
    gradient: ['#9C27B0', '#BA68C8'],
    questions: '15-20 questions',
  },
];

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { flowStreak, username, dailyGoals } = useUserStore();
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  const handleDifficultyPress = (difficulty: typeof DIFFICULTY_LEVELS[0]) => {
    SoundService.playButtonClick();
    navigation.navigate('Quiz', { 
      difficulty: difficulty.id as 'easy' | 'medium' | 'hard',
      category: undefined // No category filter, only difficulty
    });
  };

  const handleSettingsPress = () => {
    SoundService.playButtonClick();
    navigation.navigate('Settings');
  };

  const handleLeaderboardPress = () => {
    SoundService.playButtonClick();
    navigation.navigate('Leaderboard');
  };

  const handleCategoriesPress = () => {
    SoundService.playButtonClick();
    navigation.navigate('Categories', { difficulty: 'medium' });
  };

  const handleDailyTasksPress = () => {
    SoundService.playButtonClick();
    navigation.navigate('DailyGoals');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#FFF8E7" barStyle="dark-content" />
      
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* Filler Space */}
        <View style={styles.fillerSpace} />
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft} />
          
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={handleLeaderboardPress} style={styles.iconButton}>
              <Icon name="trophy" size={24} color="#FFB347" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSettingsPress} style={styles.iconButton}>
              <Icon name="settings" size={24} color="#777" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Daily Flow Card */}
        <DailyFlowCard 
          flowStreak={flowStreak} 
          onPress={() => navigation.navigate('DailyGoals')}
        />

        {/* Difficulty Levels Section */}
        <Text style={styles.sectionTitle}>Choose Your Challenge</Text>
        <Text style={styles.sectionSubtitle}>Select a difficulty level to start learning</Text>

        <View style={styles.difficultyContainer}>
          {DIFFICULTY_LEVELS.map((level, index) => (
            <TouchableOpacity
              key={level.id}
              style={[styles.difficultyCard, { backgroundColor: level.color }]}
              onPress={() => handleDifficultyPress(level)}
              activeOpacity={0.8}
            >
              <View style={styles.difficultyIconContainer}>
                <Icon name={level.icon} size={32} color="white" />
              </View>
              <Text style={styles.difficultyTitle}>{level.title}</Text>
              <Text style={styles.difficultySubtitle}>{level.subtitle}</Text>
              <Text style={styles.difficultyQuestions}>{level.questions}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bottom Action Buttons */}
        <View style={styles.bottomActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleCategoriesPress}
            activeOpacity={0.8}
          >
            <View style={styles.actionIconContainer}>
              <Icon name="grid" size={28} color="#FFF" />
            </View>
            <Text style={styles.actionTitle}>Categories</Text>
            <Text style={styles.actionSubtitle}>Browse topics</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleDailyTasksPress}
            activeOpacity={0.8}
          >
            <View style={styles.actionIconContainer}>
              <Icon name="checkmark-circle" size={28} color="#FFF" />
            </View>
            <Text style={styles.actionTitle}>Daily Tasks</Text>
            <Text style={styles.actionSubtitle}>Complete goals</Text>
          </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  fillerSpace: {
    height: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 20,
    marginTop: 20,
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'Roboto-Bold',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#777',
    marginLeft: 20,
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'Roboto',
  },
  difficultyContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  difficultyCard: {
    padding: 20,
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  difficultyIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  difficultyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'Roboto-Bold',
  },
  difficultySubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'Roboto',
  },
  difficultyQuestions: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'Roboto',
  },
  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF9F1C',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'Roboto-Bold',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#666',
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'Roboto',
  },
});

export default HomeScreen;