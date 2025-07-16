import React, { useState, useEffect } from 'react';
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

const CAPYBARA_NAMES = [
  'CapyBOSS', 'ChillBara', 'SwimKing', 'WaterPig', 'MudMaster',
  'GrassEater', 'RiverRider', 'SunBather', 'NapMaster', 'CapyChamp',
  'BaraBoss', 'WetNose', 'FurrySwimmer', 'LazyBara', 'SmartyCappy',
  'QuizBara', 'BrainyCappy', 'StudyBara', 'NerdyCappy', 'CoolBara',
  'ZenMaster', 'ChonkyBoy', 'SplashKing', 'MudBuddy', 'GreenMuncher',
  'RiverQueen', 'CapyGenius', 'BaraScholar', 'WiseCappy', 'FlowMaster'
];

interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  flow: number;
  avatar: string;
}

const LeaderboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const { username, stats, flowStreak } = useUserStore();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState(0);

  useEffect(() => {
    generateLeaderboard();
  }, [stats.totalScore]);

  const generateLeaderboard = () => {
    const entries: LeaderboardEntry[] = [];
    
    // Generate fake scores for other players
    for (let i = 0; i < 30; i++) {
      entries.push({
        rank: 0,
        name: CAPYBARA_NAMES[i % CAPYBARA_NAMES.length] + (Math.floor(i / CAPYBARA_NAMES.length) || ''),
        score: Math.floor(Math.random() * 5000) + 1000,
        flow: Math.floor(Math.random() * 30) + 1,
        avatar: ['🦫', '🌊', '🌿', '☀️', '🏊'][Math.floor(Math.random() * 5)]
      });
    }

    // Add current user
    entries.push({
      rank: 0,
      name: username || 'CaBBy',
      score: stats.totalScore,
      flow: flowStreak,
      avatar: '⭐'
    });

    // Sort by score
    entries.sort((a, b) => b.score - a.score);

    // Assign ranks
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    setLeaderboard(entries);
    const userIndex = entries.findIndex(e => e.name === (username || 'CaBBy'));
    setUserRank(userIndex + 1);
  };

  const renderLeaderboardItem = (item: LeaderboardEntry, index: number) => {
    const isCurrentUser = item.name === (username || 'CaBBy');
    const isTop3 = item.rank <= 3;

    return (
      <View 
        key={index} 
        style={[
          styles.leaderboardItem,
          isCurrentUser && styles.currentUserItem,
          isTop3 && styles.topItem
        ]}
      >
        <View style={styles.rankContainer}>
          {isTop3 ? (
            <View style={[styles.medal, item.rank === 1 ? styles.medal1 : item.rank === 2 ? styles.medal2 : styles.medal3]}>
              <Text style={styles.medalText}>{item.rank}</Text>
            </View>
          ) : (
            <Text style={styles.rankText}>#{item.rank}</Text>
          )}
        </View>

        <Text style={styles.avatar}>{item.avatar}</Text>

        <View style={styles.playerInfo}>
          <Text style={[styles.playerName, isCurrentUser && styles.currentUserName]}>
            {item.name} {isCurrentUser && '(You)'}
          </Text>
          <View style={styles.statsRow}>
            <Icon name="flame" size={14} color="#FF9F1C" />
            <Text style={styles.flowText}>{item.flow} day flow</Text>
          </View>
        </View>

        <Text style={[styles.score, isCurrentUser && styles.currentUserScore]}>
          {item.score.toLocaleString()}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Capybara Leaderboard</Text>
        <View style={{ width: 44 }} />
      </View>

      {userRank > 0 && (
        <View style={styles.userRankCard}>
          <Text style={styles.userRankLabel}>Your Rank</Text>
          <Text style={styles.userRankValue}>#{userRank}</Text>
          <Text style={styles.userRankSubtext}>Keep swimming! 🦫</Text>
        </View>
      )}

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {leaderboard.map((item, index) => renderLeaderboardItem(item, index))}
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
  userRankCard: {
    backgroundColor: '#FFB347',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  userRankLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  userRankValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginVertical: 4,
  },
  userRankSubtext: {
    fontSize: 16,
    color: 'white',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  currentUserItem: {
    backgroundColor: '#FFE5CC',
    borderWidth: 2,
    borderColor: '#FFB347',
  },
  topItem: {
    backgroundColor: '#FFF5E5',
  },
  rankContainer: {
    width: 50,
    alignItems: 'center',
  },
  medal: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    backgroundColor: '#CD853F',
  },
  medalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  rankText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  avatar: {
    fontSize: 24,
    marginHorizontal: 12,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  currentUserName: {
    color: '#FF6B6B',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flowText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  score: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  currentUserScore: {
    color: '#FF6B6B',
  },
});

export default LeaderboardScreen;