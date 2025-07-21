import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';

import theme from '../styles/theme';
import { useUserStore } from '../store/useUserStore';
import { logEvent } from '../config/Firebase';
import SoundService from '../services/SoundService';
import EnhancedScoreService from '../services/EnhancedScoreService';

interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  streak: number;
  avatar: string;
  isCurrentUser?: boolean;
}

const MOCK_LEADERBOARD_DATA: LeaderboardEntry[] = [
  { rank: 1, username: 'QuizMaster99', score: 8750, streak: 42, avatar: '🦊' },
  { rank: 2, username: 'BrainiacPro', score: 8420, streak: 38, avatar: '🦅' },
  { rank: 3, username: 'SmartCookie', score: 7990, streak: 35, avatar: '🐯' },
  { rank: 4, username: 'KnowledgeNinja', score: 7650, streak: 31, avatar: '🦈' },
  { rank: 5, username: 'TriviaTitan', score: 7200, streak: 28, avatar: '🦁' },
  { rank: 6, username: 'WisdomWarrior', score: 6850, streak: 25, avatar: '🐺' },
  { rank: 7, username: 'QuizWhiz', score: 6500, streak: 22, avatar: '🦝' },
  { rank: 8, username: 'BrainStorm', score: 6200, streak: 20, avatar: '🦜' },
  { rank: 9, username: 'MindMaster', score: 5900, streak: 18, avatar: '🦚' },
  { rank: 10, username: 'ThinkTank', score: 5600, streak: 16, avatar: '🦢' },
  { rank: 11, username: 'IQChampion', score: 5300, streak: 15, avatar: '🐨' },
  { rank: 12, username: 'CleverClogs', score: 5000, streak: 14, avatar: '🦒' },
  { rank: 13, username: 'SmartPants', score: 4800, streak: 13, avatar: '🦘' },
  { rank: 14, username: 'BrightSpark', score: 4600, streak: 12, avatar: '🦌' },
  { rank: 15, username: 'QuickThinker', score: 4400, streak: 11, avatar: '🦫' },
  { rank: 16, username: 'SharpMind', score: 4200, streak: 10, avatar: '🦦' },
  { rank: 17, username: 'StudyStar', score: 4000, streak: 9, avatar: '🦭' },
  { rank: 18, username: 'FactFinder', score: 3800, streak: 8, avatar: '🐿️' },
  { rank: 19, username: 'LogicLord', score: 3600, streak: 7, avatar: '🦔' },
  { rank: 20, username: 'PuzzlePro', score: 3400, streak: 6, avatar: '🦥' },
];

const LeaderboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const { username, score, maxStreak } = useUserStore();
  
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeFilter, setTimeFilter] = useState<'daily' | 'weekly' | 'allTime'>('allTime');

  useEffect(() => {
    loadLeaderboard();
    logEvent('leaderboard_viewed');
  }, [timeFilter]);

  const loadLeaderboard = async () => {
    setIsLoading(true);
    
    setTimeout(() => {
      const userScore = EnhancedScoreService.getScoreInfo().dailyScore;
      const userEntry: LeaderboardEntry = {
        rank: 0,
        username: 'CaBBy', // Default username
        score: userScore,
        streak: EnhancedScoreService.getScoreInfo().currentStreak,
        avatar: '🦫',
        isCurrentUser: true,
      };
      
      // Combine and sort
      const allEntries = [...MOCK_LEADERBOARD_DATA, userEntry]
        .sort((a, b) => b.score - a.score)
        .map((entry, index) => ({
          ...entry,
          rank: index + 1,
          isCurrentUser: entry.username === 'CaBBy'
        }));
      
      const userIndex = allEntries.findIndex(entry => entry.isCurrentUser);
      if (userIndex !== -1) {
        setUserRank(userIndex + 1);
      }
      
      setLeaderboard(allEntries);
      setIsLoading(false);
      setIsRefreshing(false);
    }, 800);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadLeaderboard();
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return null;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return '#FFD700';
      case 2:
        return '#C0C0C0';
      case 3:
        return '#CD7F32';
      default:
        return theme.colors.textSecondary;
    }
  };

  const renderHeader = () => (
    <LinearGradient
      colors={theme.colors.gradientPrimary}
      style={styles.header}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
        activeOpacity={0.7}
      >
        <Icon name="arrow-back" size={24} color={theme.colors.textPrimary} />
      </TouchableOpacity>
      
      <Text style={styles.headerTitle}>Leaderboard</Text>
      <View style={styles.placeholder} />
    </LinearGradient>
  );

  const renderTimeFilter = () => (
    <View style={styles.filterContainer}>
      {(['daily', 'weekly', 'allTime'] as const).map((filter) => (
        <TouchableOpacity
          key={filter}
          style={[
            styles.filterButton,
            timeFilter === filter && styles.filterButtonActive,
          ]}
          onPress={() => {
            setTimeFilter(filter);
            SoundService.playButtonPress();
          }}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.filterButtonText,
              timeFilter === filter && styles.filterButtonTextActive,
            ]}
          >
            {filter === 'allTime' ? 'All Time' : filter.charAt(0).toUpperCase() + filter.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderUserCard = () => {
    if (!userRank) return null;
    
    const userEntry = leaderboard.find(entry => entry.isCurrentUser);
    if (!userEntry) return null;
    
    return (
      <View style={styles.userCard}>
        <View style={styles.userCardLeft}>
          <Text style={styles.userAvatar}>{userEntry.avatar}</Text>
          <View>
            <Text style={styles.userCardName}>Your Ranking</Text>
            <Text style={styles.userCardScore}>{userEntry.score} points</Text>
          </View>
        </View>
        <View style={styles.userCardRight}>
          <Text style={[styles.userCardRank, { color: getRankColor(userEntry.rank) }]}>
            #{userEntry.rank}
          </Text>
        </View>
      </View>
    );
  };

  const renderLeaderboardItem = (entry: LeaderboardEntry, index: number) => {
    const isTopThree = entry.rank <= 3;
    const rankIcon = getRankIcon(entry.rank);
    
    return (
      <View
        key={`${entry.username}-${index}`}
        style={[
          styles.leaderboardItem,
          entry.isCurrentUser && styles.currentUserItem,
          isTopThree && styles.topThreeItem,
        ]}
      >
        <View style={styles.rankContainer}>
          {rankIcon ? (
            <Text style={styles.rankIcon}>{rankIcon}</Text>
          ) : (
            <Text style={[styles.rankText, { color: getRankColor(entry.rank) }]}>
              {entry.rank}
            </Text>
          )}
        </View>
        
        <Text style={styles.avatar}>{entry.avatar}</Text>
        
        <View style={styles.userInfo}>
          <Text style={styles.username}>{entry.username}</Text>
          <View style={styles.statsRow}>
            <Icon name="star" size={12} color={theme.colors.warning} />
            <Text style={styles.scoreText}>{entry.score}</Text>
            <Icon name="flame" size={12} color={theme.colors.error} style={{ marginLeft: 10 }} />
            <Text style={styles.streakText}>{entry.streak}</Text>
          </View>
        </View>
        
        {entry.isCurrentUser && (
          <View style={styles.youBadge}>
            <Text style={styles.youBadgeText}>YOU</Text>
          </View>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading rankings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      {renderTimeFilter()}
      {renderUserCard()}
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
          />
        }
      >
        <View style={styles.leaderboardContainer}>
          {leaderboard.map((entry, index) => renderLeaderboardItem(entry, index))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  backButton: {
    padding: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.xxl,
    fontFamily: theme.typography.fontFamily.quicksandBold,
    color: theme.colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  filterButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.backgroundLight,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  filterButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.textSecondary,
  },
  filterButtonTextActive: {
    color: theme.colors.textWhite,
  },
  userCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.base,
    borderRadius: theme.borderRadius.base,
  },
  userCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  userAvatar: {
    fontSize: 32,
  },
  userCardName: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textWhite,
    opacity: 0.9,
  },
  userCardScore: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.textWhite,
  },
  userCardRight: {
    alignItems: 'center',
  },
  userCardRank: {
    fontSize: theme.typography.fontSize.xxl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.textWhite,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
  leaderboardContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundLight,
    padding: theme.spacing.base,
    borderRadius: theme.borderRadius.base,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.small,
  },
  currentUserItem: {
    backgroundColor: theme.colors.primary + '10',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  topThreeItem: {
    ...theme.shadows.medium,
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
  },
  rankIcon: {
    fontSize: 24,
  },
  rankText: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.bold,
  },
  avatar: {
    fontSize: 28,
    marginHorizontal: theme.spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scoreText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
  streakText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
  youBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  youBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.textWhite,
  },
});

export default LeaderboardScreen;