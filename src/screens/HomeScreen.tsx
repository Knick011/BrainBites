import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useTimerStore } from '../store/useTimerStore';
import { useUserStore } from '../store/useUserStore';
import { SoundService } from '../services/SoundService';
import DailyFlowCard from '../components/DailyFlowCard';
import CategoryCard from '../components/CategoryCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CATEGORIES = [
  { id: 'Science', name: 'Science', icon: 'flask', color: '#4ECDC4', description: 'Unlock mysteries' },
  { id: 'History', name: 'History', icon: 'time', color: '#9B59B6', description: 'Journey through time' },
  { id: 'Math', name: 'Math', icon: 'calculator', color: '#4CAF50', description: 'Master numbers' },
  { id: 'Geography', name: 'Geography', icon: 'earth', color: '#FF6B6B', description: 'Explore the world' },
  { id: 'Literature', name: 'Literature', icon: 'book', color: '#845EC2', description: 'Words & stories' },
  { id: 'Sports', name: 'Sports', icon: 'football', color: '#FF9F1C', description: 'Athletic knowledge' },
  { id: 'Art', name: 'Art', icon: 'color-palette', color: '#FF6F91', description: 'Creative expression' },
  { id: 'Music', name: 'Music', icon: 'musical-notes', color: '#F9A826', description: 'Sounds & rhythms' },
  { id: 'Technology', name: 'Technology', icon: 'laptop', color: '#2196F3', description: 'Digital world' },
  { id: 'Food', name: 'Food', icon: 'restaurant', color: '#FF5722', description: 'Culinary delights' },
  { id: 'Animals', name: 'Animals', icon: 'paw', color: '#8BC34A', description: 'Wildlife facts' },
  { id: 'Language', name: 'Language', icon: 'language', color: '#00BCD4', description: 'Words & meanings' },
];

const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { timeRemaining, isNegative } = useTimerStore();
  const { flowStreak, username, dailyGoals } = useUserStore();
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  const formatTime = (milliseconds: number): string => {
    const totalMinutes = Math.floor(Math.abs(milliseconds) / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handleCategoryPress = (category: typeof CATEGORIES[0]) => {
    SoundService.playButtonClick();
    navigation.navigate('Quiz', { category: category.id });
  };

  const handleSettingsPress = () => {
    SoundService.playButtonClick();
    navigation.navigate('Settings');
  };

  const handleLeaderboardPress = () => {
    SoundService.playButtonClick();
    navigation.navigate('Leaderboard');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#FFF8E7" barStyle="dark-content" />
      
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting},</Text>
            <Text style={styles.username}>{username || 'CaBBy'} 👋</Text>
          </View>
          
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={handleLeaderboardPress} style={styles.iconButton}>
              <Icon name="trophy" size={24} color="#FFB347" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSettingsPress} style={styles.iconButton}>
              <Icon name="settings" size={24} color="#777" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Timer Display */}
        <View style={[styles.timerCard, isNegative && styles.timerCardNegative]}>
          <Icon 
            name={isNegative ? "warning" : "time"} 
            size={24} 
            color={isNegative ? "#FF6B6B" : "#4CAF50"} 
          />
          <View style={styles.timerTextContainer}>
            <Text style={styles.timerLabel}>
              {isNegative ? "Screen Time Debt" : "Time Earned"}
            </Text>
            <Text style={[styles.timerValue, isNegative && styles.timerValueNegative]}>
              {isNegative && "-"}{formatTime(timeRemaining)}
            </Text>
          </View>
        </View>

        {/* Daily Flow Card */}
        <DailyFlowCard 
          flowStreak={flowStreak} 
          onPress={() => navigation.navigate('DailyGoals')}
        />

        {/* Categories Section */}
        <Text style={styles.sectionTitle}>Quiz Categories</Text>
        <Text style={styles.sectionSubtitle}>Choose a topic to start learning</Text>

        <View style={styles.categoriesGrid}>
          {CATEGORIES.map((category, index) => (
            <CategoryCard
              key={category.id}
              category={category}
              onPress={() => handleCategoryPress(category)}
              index={index}
            />
          ))}
        </View>

        {/* Daily Goals Progress */}
        <TouchableOpacity 
          style={styles.dailyGoalsCard}
          onPress={() => navigation.navigate('DailyGoals')}
        >
          <View style={styles.dailyGoalsHeader}>
            <Icon name="checkmark-circle" size={24} color="#4CAF50" />
            <Text style={styles.dailyGoalsTitle}>Daily Goals</Text>
            <Icon name="chevron-forward" size={20} color="#999" />
          </View>
          <View style={styles.dailyGoalsProgress}>
            {dailyGoals.slice(0, 3).map((goal, index) => (
              <View key={index} style={styles.goalItem}>
                <View style={[styles.goalDot, goal.completed && styles.goalDotCompleted]} />
                <Text style={styles.goalText} numberOfLines={1}>{goal.title}</Text>
              </View>
            ))}
          </View>
        </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  greeting: {
    fontSize: 16,
    color: '#777',
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'Roboto',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'Roboto-Bold',
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
  timerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginVertical: 15,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  timerCardNegative: {
    backgroundColor: '#FFE5E5',
  },
  timerTextContainer: {
    marginLeft: 12,
  },
  timerLabel: {
    fontSize: 14,
    color: '#777',
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'Roboto',
  },
  timerValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'Roboto-Bold',
  },
  timerValueNegative: {
    color: '#FF6B6B',
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
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  dailyGoalsCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 30,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dailyGoalsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dailyGoalsTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'Roboto-Bold',
  },
  dailyGoalsProgress: {
    gap: 8,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
    marginRight: 8,
  },
  goalDotCompleted: {
    backgroundColor: '#4CAF50',
  },
  goalText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'Roboto',
  },
});

export default HomeScreen;