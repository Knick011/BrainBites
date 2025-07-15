import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  TouchableOpacity,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useUserStore } from '../store/useUserStore';
import { SoundService } from '../services/SoundService';

interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  questionsPerDay: number;
  streak: number;
  avatar: string;
  isPlayer?: boolean;
}

const FAKE_NAMES = [
  'BrainMaster2024', 'QuizWhiz', 'NeuronNinja', 'SynapseKing', 'CortexChamp',
  'BrainMaster2024', 'QuizWhiz', 'NeuronNinja', 'SynapseKing', 'CortexChamp',
  'MemoryMaestro', 'ThinkTank', 'IQInfinity', 'LogicLord', 'PuzzlePro',
  'SmartCookie', 'BrainiacBob', 'CleverCathy', 'WisdomWarrior', 'KnowledgeKnight',
  'StudySamurai', 'FactFinder', 'TriviaTitan', 'MindMage', 'ThoughtThief',
  'QuestionQueen', 'AnswerAce', 'BrilliantBrain', 'GeniusGuru', 'ScholarSage',
];

const AVATARS = ['🧠', '🎓', '📚', '💡', '🏆', '⭐', '🌟', '✨', '🎯', '🚀'];

const generateFakeLeaderboard = (playerData: any): LeaderboardEntry[] => {
  const entries: LeaderboardEntry[] = [];
  const playerRank = playerData.leaderboardRank;
  
  // Generate top players (3-4 hours/day usage)
  for (let i = 1; i <= 10; i++) {
    if (i === playerRank) continue;
    
    const baseScore = 50000 - (i * 2000) + Math.floor(Math.random() * 1000);
    const questionsPerDay = 150 + Math.floor(Math.random() * 50);
    const streak = 30 + Math.floor(Math.random() * 20);
    
    entries.push({
      rank: i,
      name: FAKE_NAMES[i - 1],
      score: baseScore,
      questionsPerDay,
      streak,
      avatar: AVATARS[i % AVATARS.length],
    });
  }
  
  // Generate players around the user's rank
  const surroundingRanks = [];
  for (let i = -5; i <= 5; i++) {
    const rank = playerRank + i;
    if (rank > 0 && rank !== playerRank && rank > 10) {
      surroundingRanks.push(rank);
    }
  }
  
  surroundingRanks.forEach((rank) => {
    const scoreVariance = (rank - 10) * 100;
    const baseScore = 40000 - scoreVariance + Math.floor(Math.random() * 500);
    const questionsPerDay = 80 + Math.floor(Math.random() * 40);
    const streak = 5 + Math.floor(Math.random() * 15);
    
    entries.push({
      rank,
      name: FAKE_NAMES[rank % FAKE_NAMES.length],
      score: Math.max(100, baseScore),
      questionsPerDay,
      streak,
      avatar: AVATARS[rank % AVATARS.length],
    });
  });
  
  // Add the player
  entries.push({
    rank: playerRank,
    name: playerData.username,
    score: playerData.totalScore,
    questionsPerDay: Math.floor(playerData.totalQuestionsAnswered / Math.max(1, playerData.flowStreak)),
    streak: playerData.flowStreak,
    avatar: '🦫', // CaBBY
    isPlayer: true,
  });
  
  // Sort by rank
  return entries.sort((a, b) => a.rank - b.rank);
};

const LeaderboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const userStore = useUserStore();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [selectedTab, setSelectedTab] = useState<'global' | 'weekly' | 'daily'>('global');
  
  const scrollRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const playerHighlightAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Update leaderboard rank based on activity
    userStore.updateLeaderboardRank();
    
    // Generate fake leaderboard
    const playerData = {
      username: userStore.username,
      totalScore: userStore.stats.totalScore,
      totalQuestionsAnswered: userStore.stats.totalQuestionsAnswered,
      flowStreak: userStore.flowStreak,
      leaderboardRank: userStore.stats.leaderboardRank,
    };
    
    setLeaderboard(generateFakeLeaderboard(playerData));
    
    // Animate in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    
    // Highlight player entry
    Animated.loop(
      Animated.sequence([
        Animated.timing(playerHighlightAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(playerHighlightAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);
  
  const renderLeaderboardEntry = (entry: LeaderboardEntry, index: number) => {
    const isTop3 = entry.rank <= 3;
    const glowOpacity = entry.isPlayer ? playerHighlightAnim : new Animated.Value(0);
    
    return (
      <Animated.View
        key={`${entry.rank}-${entry.name}`}
        style={[
          styles.entryContainer,
          entry.isPlayer && styles.playerEntry,
          isTop3 && styles.topEntry,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateX: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
            ],
          },
        ]}
      >
        {entry.isPlayer && (
          <Animated.View
            style={[
              styles.playerGlow,
              {
                opacity: glowOpacity,
              },
            ]}
          />
        )}
        
        <View style={styles.rankContainer}>
          {isTop3 ? (
            <View style={[styles.medal, styles[`medal${entry.rank}`]]}>
              <Text style={styles.medalText}>{entry.rank}</Text>
            </View>
          ) : (
            <Text style={styles.rankText}>#{entry.rank}</Text>
          )}
        </View>
        
        <View style={styles.avatarContainer}>
          <Text style={styles.avatar}>{entry.avatar}</Text>
        </View>
        
        <View style={styles.playerInfo}>
          <Text style={[styles.playerName, entry.isPlayer && styles.playerNameHighlight]}>
            {entry.name} {entry.isPlayer && '(You)'}
          </Text>
          <View style={styles.statsRow}>
            <Text style={styles.statText}>
                              <Icon name="flash-outline" size={12} color="#FFA500" /> {entry.streak} day streak
            </Text>
            <Text style={styles.statText}>
                              <Icon name="help-circle-outline" size={12} color="#FFA500" /> {entry.questionsPerDay} Q/day
            </Text>
          </View>
        </View>
        
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>{entry.score.toLocaleString()}</Text>
          <Text style={styles.scoreLabel}>points</Text>
        </View>
      </Animated.View>
    );
  };
  
  const handleTabChange = (tab: 'global' | 'weekly' | 'daily') => {
    setSelectedTab(tab);
    SoundService.playButtonClick();
    
    // Regenerate leaderboard with different scores for different periods
    const multiplier = tab === 'daily' ? 0.1 : tab === 'weekly' ? 0.3 : 1;
    const modifiedLeaderboard = leaderboard.map(entry => ({
      ...entry,
      score: Math.floor(entry.score * multiplier),
      questionsPerDay: tab === 'daily' 
        ? Math.floor(entry.questionsPerDay / 7)
        : entry.questionsPerDay,
    }));
    
    setLeaderboard(modifiedLeaderboard);
  };
  
  return (
    <LinearGradient
      colors={['#FFD700', '#FFA500', '#FF8C00']}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Icon name="arrow-back-circle" size={30} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Leaderboard</Text>
        <View style={styles.placeholder} />
      </View>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'global' && styles.activeTab]}
          onPress={() => handleTabChange('global')}
        >
          <Text style={[styles.tabText, selectedTab === 'global' && styles.activeTabText]}>
            Global
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'weekly' && styles.activeTab]}
          onPress={() => handleTabChange('weekly')}
        >
          <Text style={[styles.tabText, selectedTab === 'weekly' && styles.activeTabText]}>
            Weekly
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'daily' && styles.activeTab]}
          onPress={() => handleTabChange('daily')}
        >
          <Text style={[styles.tabText, selectedTab === 'daily' && styles.activeTabText]}>
            Daily
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {leaderboard.map((entry, index) => renderLeaderboardEntry(entry, index))}
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
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    padding: 5,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: '#FFF',
  },
  tabText: {
    fontSize: 16,
    color: '#FFF',
    fontFamily: 'Nunito-Regular',
  },
  activeTabText: {
    color: '#FFA500',
    fontFamily: 'Nunito-Bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  entryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  playerEntry: {
    borderWidth: 2,
    borderColor: '#FFA500',
  },
  topEntry: {
    backgroundColor: '#FFF9E6',
  },
  playerGlow: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    backgroundColor: '#FFA500',
    borderRadius: 17,
    opacity: 0.3,
  },
  rankContainer: {
    width: 50,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Nunito-Bold',
  },
  medal: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  medal1: {
    backgroundColor: '#FFD700',
  },
  medal2: {
    backgroundColor: '#C0C0C0',
  },
  medal3: {
    backgroundColor: '#CD7F32',
  },
  medalText: {
    fontSize: 18,
    color: '#FFF',
    fontFamily: 'Nunito-Bold',
  },
  avatarContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatar: {
    fontSize: 30,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'Nunito-Bold',
  },
  playerNameHighlight: {
    color: '#FFA500',
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 2,
  },
  statText: {
    fontSize: 12,
    color: '#666',
    marginRight: 15,
    fontFamily: 'Nunito-Regular',
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  scoreText: {
    fontSize: 20,
    color: '#333',
    fontFamily: 'Nunito-Bold',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Nunito-Regular',
  },
});

export default LeaderboardScreen;