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

interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  streak: number;
  avatar: string;
  isCurrentUser?: boolean;
}

// Mock data - In production, this would come from a backend
const mockLeaderboard: LeaderboardEntry[] = [
  { rank: 1, username: 'QuizMaster', score: 2450, streak: 25, avatar: '🦁' },
  { rank: 2, username: 'Brainiac', score: 2320, streak: 18, avatar: '🧠' },
  { rank: 3, username: 'SmartCookie', score: 2180, streak: 22, avatar: '🍪' },
  { rank: 4, username: 'Einstein Jr', score: 1950, streak: 15, avatar: '👨‍🔬' },
  { rank: 5, username: 'QuizWhiz', score: 1820, streak: 12, avatar: '⚡' },
  { rank: 6, username: 'Genius', score: 1650, streak: 10, avatar: '💡' },
  { rank: 7, username: 'Scholar', score: 1500, streak: 8, avatar: '📚' },
  { rank: 8, username: 'Thinker', score: 1350, streak: 7, avatar: '🤔' },
  { rank: 9, username: 'Learner', score: 1200, streak: 5, avatar: '🎓' },
  { rank: 10, username: 'Student', score: 1050, streak: 3, avatar: '✏️' },
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
    
    // Simulate API call
    setTimeout(() => {
      // Insert current user into leaderboard
      const userEntry: LeaderboardEntry = {
        rank: 0,
        username: username,
        score: score,
        streak: maxStreak,
        avatar: '🦫',
        isCurrentUser: true,
      };
      
      // Find user's rank
      const allEntries = [...mockLeaderboard, userEntry].sort((a, b) => b.score - a.score);
      const userIndex = allEntries.findIndex(entry => entry.isCurrentUser);
      
      if (userIndex !== -1) {
        allEntries[userIndex].rank = userIndex + 1;
        setUserRank(userIndex + 1);
      }
      
      // Update ranks
      const rankedEntries = allEntries.map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));
      
      setLeaderboard(rankedEntries.slice(0, 100)); // Top 100
      setIsLoading(false);
      setIsRefreshing(false);
    }, 1000);
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