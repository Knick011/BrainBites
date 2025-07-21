// src/screens/LeaderboardScreen.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  RefreshControl,
  Animated,
  Platform,
  StatusBar,
  Dimensions,
  Easing,
  LayoutAnimation,
  HapticFeedback,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import theme from '../styles/theme';
import SoundService from '../services/SoundService';
import EnhancedScoreService from '../services/EnhancedScoreService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type LeaderboardNavigationProp = StackNavigationProp<RootStackParamList>;

// Enhanced interfaces
interface LeaderboardPlayer {
  id: string;
  rank: number;
  displayName: string;
  score: number;
  highestStreak: number;
  isCurrentUser: boolean;
  lastActive: string;
  avatar?: string;
  badge?: 'crown' | 'fire' | 'star' | 'diamond';
  percentile?: number;
  isSeparator?: boolean;
  isRising?: boolean;
  rankChange?: number; // +5, -3, etc.
}

interface UserStats {
  rank: number;
  score: number;
  percentile: number;
  totalPlayers: number;
  rankChange: number;
  achievements: string[];
}

// Enhanced capybara names with personality
const CAPYBARA_NAMES = [
  'CapyBOSSa Nova', 'QuantumCapy', 'NeuroCapybara', 'AlphaBaraMax', 'CapyGenius PhD',
  'BaraKingpin', 'EliteCapyForce', 'MegaBaraBrain', 'CapyLegendary', 'UltraBaraBot',
  'CapyChampion X', 'BaraSupreme', 'GigaCapyIQ', 'TeraBaraMind', 'CapyWarlord',
  'ChillCapyZen', 'NightOwlBara', 'StudyBaraPro', 'CoffeeCapyAddict', 'BookwormBara',
  'SwiftCapyNinja', 'LightningBara', 'TurboCapyRush', 'SpeedyBaraFlash', 'RocketCapy',
  'WiseBara Sage', 'CapyOracle', 'MysticBaraMage', 'CapyProphet', 'EnlightenedBara',
  'CapyWarrior', 'BattleBaraX', 'FierceCapyStorm', 'BaraConqueror', 'CapyDestroyer',
  'PeacefulBara', 'ZenCapyMaster', 'CalmBaraWaves', 'SereneCapy', 'TranquilBara',
  'CapyScholar', 'ProfessorBara', 'AcademicCapy', 'ResearchBara', 'ThinkTankCapy',
  'CreativeCapy', 'ArtisticBara', 'PoetCapyVerse', 'MusicalBara', 'CapyComposer'
];

const TOP_PLAYER_SCORE = 250000; // Enhanced top score

const LeaderboardScreen: React.FC = () => {
  const navigation = useNavigation<LeaderboardNavigationProp>();
  
  // State management
  const [activeTab, setActiveTab] = useState<'global' | 'friends'>('global');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardPlayer[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserScore, setCurrentUserScore] = useState(0);
  const [showAchievements, setShowAchievements] = useState(false);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const podiumAnim = useRef(new Animated.Value(0)).current;
  const achievementAnim = useRef(new Animated.Value(0)).current;
  const tabIndicatorAnim = useRef(new Animated.Value(0)).current;

  // Initialize component
  useEffect(() => {
    initializeLeaderboard();
    startAnimations();
  }, []);

  // Update when tab changes
  useEffect(() => {
    if (!isLoading) {
      animateTabChange();
      loadLeaderboardData();
    }
  }, [activeTab, currentUserScore]);

  const initializeLeaderboard = async () => {
    await loadUserScore();
    await loadLeaderboardData();
    setIsLoading(false);
  };

  const loadUserScore = async () => {
    try {
      await EnhancedScoreService.loadSavedData();
      const scoreInfo = EnhancedScoreService.getScoreInfo();
      setCurrentUserScore(scoreInfo.dailyScore);
    } catch (error) {
      console.error('Failed to load user score:', error);
      setCurrentUserScore(1250); // Fallback score
    }
  };

  const generateTopPlayers = (): LeaderboardPlayer[] => {
    const players: LeaderboardPlayer[] = [];
    let currentScore = TOP_PLAYER_SCORE;
    
    for (let i = 0; i < 10; i++) {
      const dropFactor = 0.88 + (Math.random() * 0.08); // More dramatic score differences
      currentScore = Math.floor(currentScore * dropFactor);
      
      // Special badges for top performers
      let badge: LeaderboardPlayer['badge'] = undefined;
      if (i === 0) badge = 'crown';
      else if (i < 3) badge = 'star';
      else if (i < 5) badge = 'fire';
      
      players.push({
        id: `top_${i}`,
        rank: i + 1,
        displayName: CAPYBARA_NAMES[i],
        score: currentScore,
        highestStreak: Math.floor(Math.random() * 25) + 15,
        isCurrentUser: false,
        lastActive: i < 2 ? 'Online now' : i < 5 ? `${Math.floor(Math.random() * 30) + 1}m` : `${Math.floor(Math.random() * 12) + 1}h`,
        badge,
        isRising: Math.random() > 0.7,
        rankChange: Math.floor(Math.random() * 10) - 5,
        percentile: Math.round(((10 - i) / 10) * 100),
      });
    }
    
    return players;
  };

  const calculateUserRank = (score: number): number => {
    const scoreDiff = TOP_PLAYER_SCORE - score;
    const baseRank = Math.floor(scoreDiff / 150) + 11;
    const variance = Math.floor(Math.random() * 50) - 25;
    return Math.max(11, baseRank + variance);
  };

  const generateAroundUserPlayers = (userScore: number, userRank: number): LeaderboardPlayer[] => {
    const players: LeaderboardPlayer[] = [];
    
    for (let i = -3; i <= 3; i++) {
      if (i === 0) continue;
      
      const rank = userRank + i;
      const scoreDiff = i * (80 + Math.random() * 40);
      const score = Math.max(100, Math.floor(userScore - scoreDiff));
      
      players.push({
        id: `around_${rank}_${i}`,
        rank,
        displayName: CAPYBARA_NAMES[(rank + 20) % CAPYBARA_NAMES.length],
        score,
        highestStreak: Math.floor(Math.random() * 30) + 5,
        isCurrentUser: false,
        lastActive: `${Math.floor(Math.random() * 24) + 1}h`,
        isRising: Math.random() > 0.6,
        rankChange: Math.floor(Math.random() * 6) - 3,
      });
    }
    
    return players.sort((a, b) => a.rank - b.rank);
  };

  const generateFriendsData = (): LeaderboardPlayer[] => {
    const friendNames = [
      'StudyBuddyBara', 'CoffeeCapyPal', 'WorkoutBara', 'MovieNightCapy', 'GameNightBara',
      'AdventureBara', 'ChillCapyFriend', 'PartyBaraBest', 'TravelCapyMate', 'BookClubBara'
    ];
    
    const friends = friendNames.map((name, i) => {
      const variance = (Math.random() - 0.5) * currentUserScore * 0.6;
      return {
        id: `friend_${i}`,
        rank: 0,
        displayName: name,
        score: Math.max(100, Math.floor(currentUserScore + variance)),
        highestStreak: Math.floor(Math.random() * 25) + 5,
        isCurrentUser: false,
        lastActive: i < 3 ? 'Online now' : `${Math.floor(Math.random() * 48) + 1}h`,
        isRising: Math.random() > 0.5,
        rankChange: Math.floor(Math.random() * 8) - 4,
      };
    });

    // Add current user
    friends.push({
      id: 'current_user',
      rank: 0,
      displayName: 'CaBBybara',
      score: currentUserScore,
      highestStreak: EnhancedScoreService.getScoreInfo().highestStreak,
      isCurrentUser: true,
      lastActive: 'Online now',
      badge: 'diamond',
      rankChange: Math.floor(Math.random() * 5) + 1,
    });

    // Sort by score and assign ranks
    friends.sort((a, b) => b.score - a.score);
    friends.forEach((friend, index) => {
      friend.rank = index + 1;
    });

    return friends;
  };

  const loadLeaderboardData = () => {
    let data: LeaderboardPlayer[] = [];
    
    if (activeTab === 'global') {
      const topPlayers = generateTopPlayers();
      const userRank = calculateUserRank(currentUserScore);
      
      // Check if user is in top 10
      const userInTop10 = currentUserScore > topPlayers[9].score;
      
      if (userInTop10) {
        const insertIndex = topPlayers.findIndex(p => p.score < currentUserScore);
        const userData: LeaderboardPlayer = {
          id: 'current_user',
          rank: insertIndex + 1,
          displayName: 'CaBBybara',
          score: currentUserScore,
          highestStreak: EnhancedScoreService.getScoreInfo().highestStreak,
          isCurrentUser: true,
          lastActive: 'Online now',
          badge: 'diamond',
          rankChange: Math.floor(Math.random() * 3) + 1,
        };
        
        topPlayers.splice(insertIndex, 0, userData);
        topPlayers.pop();
        
        // Reassign ranks
        topPlayers.forEach((player, index) => {
          player.rank = index + 1;
        });
        
        data = topPlayers;
      } else {
        data = [...topPlayers];
        
        // Add separator
        data.push({
          id: 'separator',
          rank: 0,
          displayName: '',
          score: 0,
          highestStreak: 0,
          isCurrentUser: false,
          lastActive: '',
          isSeparator: true,
        });
        
        // Add players around user
        const aroundUser = generateAroundUserPlayers(currentUserScore, userRank);
        data = data.concat(aroundUser);
        
        // Add current user
        const userData: LeaderboardPlayer = {
          id: 'current_user',
          rank: userRank,
          displayName: 'CaBBybara',
          score: currentUserScore,
          highestStreak: EnhancedScoreService.getScoreInfo().highestStreak,
          isCurrentUser: true,
          lastActive: 'Online now',
          badge: 'diamond',
          rankChange: Math.floor(Math.random() * 3) + 1,
        };
        
        const insertIndex = data.findIndex(p => !p.isSeparator && p.rank > userRank);
        if (insertIndex !== -1) {
          data.splice(insertIndex, 0, userData);
        } else {
          data.push(userData);
        }
      }
      
      // Update user stats
      setUserStats({
        rank: userInTop10 ? data.find(p => p.isCurrentUser)?.rank || 1 : userRank,
        score: currentUserScore,
        percentile: Math.round(((50000 - userRank) / 50000) * 100),
        totalPlayers: 50000,
        rankChange: Math.floor(Math.random() * 5) + 1,
        achievements: ['streak_master', 'quiz_veteran', 'daily_player'],
      });
      
    } else {
      data = generateFriendsData();
      const userRank = data.find(p => p.isCurrentUser)?.rank || 1;
      
      setUserStats({
        rank: userRank,
        score: currentUserScore,
        percentile: Math.round(((11 - userRank) / 10) * 100),
        totalPlayers: 11,
        rankChange: Math.floor(Math.random() * 3) + 1,
        achievements: ['friend_champion', 'social_butterfly'],
      });
    }
    
    setLeaderboardData(data);
  };

  const startAnimations = () => {
    Animated.stagger(100, [
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      Animated.timing(podiumAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for user entry
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const animateTabChange = () => {
    const toValue = activeTab === 'global' ? 0 : 1;
    
    Animated.spring(tabIndicatorAnim, {
      toValue,
      tension: 120,
      friction: 8,
      useNativeDriver: true,
    }).start();

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    SoundService.playButtonClick();
    
    if (Platform.OS === 'android') {
      HapticFeedback.trigger('impactLight');
    }

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    await loadUserScore();
    loadLeaderboardData();
    setIsRefreshing(false);
  };

  const handleTabChange = (tab: 'global' | 'friends') => {
    if (tab === activeTab) return;
    
    SoundService.playButtonClick();
    setActiveTab(tab);
  };

  const handleAchievementPress = () => {
    setShowAchievements(!showAchievements);
    
    Animated.spring(achievementAnim, {
      toValue: showAchievements ? 0 : 1,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const renderPodium = () => {
    const topThree = leaderboardData.slice(0, 3).filter(p => !p.isSeparator);
    if (topThree.length < 3) return null;

    return (
      <Animated.View 
        style={[
          styles.podiumContainer,
          {
            opacity: podiumAnim,
            transform: [
              {
                translateY: podiumAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(255, 159, 28, 0.1)', 'rgba(255, 159, 28, 0.05)']}
          style={styles.podiumGradient}
        >
          {/* 2nd Place */}
          <View style={[styles.podiumPlace, styles.secondPlace]}>
            <View style={styles.podiumIcon}>
              <Icon name="medal" size={20} color="#C0C0C0" />
            </View>
            <Text style={styles.podiumName} numberOfLines={1}>
              {topThree[1].displayName}
            </Text>
            <Text style={styles.podiumScore}>
              {topThree[1].score.toLocaleString()}
            </Text>
          </View>

          {/* 1st Place */}
          <View style={[styles.podiumPlace, styles.firstPlace]}>
            <View style={styles.podiumIcon}>
              <Icon name="crown" size={24} color="#FFD700" />
            </View>
            <Text style={styles.podiumName} numberOfLines={1}>
              {topThree[0].displayName}
            </Text>
            <Text style={styles.podiumScore}>
              {topThree[0].score.toLocaleString()}
            </Text>
            <View style={styles.crownGlow} />
          </View>

          {/* 3rd Place */}
          <View style={[styles.podiumPlace, styles.thirdPlace]}>
            <View style={styles.podiumIcon}>
              <Icon name="medal" size={18} color="#CD7F32" />
            </View>
            <Text style={styles.podiumName} numberOfLines={1}>
              {topThree[2].displayName}
            </Text>
            <Text style={styles.podiumScore}>
              {topThree[2].score.toLocaleString()}
            </Text>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  const renderUserStatsCard = () => {
    if (!userStats) return null;

    return (
      <Animated.View 
        style={[
          styles.userStatsCard,
          {
            opacity: fadeAnim,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={['#FF9F1C', '#FFB84D', '#FFC970']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.userStatsGradient}
        >
          <View style={styles.userStatsContent}>
            <View style={styles.userStatsLeft}>
              <Text style={styles.userStatsLabel}>Your Rank</Text>
              <View style={styles.userRankContainer}>
                <Text style={styles.userRank}>#{userStats.rank}</Text>
                {userStats.rankChange > 0 && (
                  <View style={styles.rankChangeUp}>
                    <Icon name="trending-up" size={14} color="#4CAF50" />
                    <Text style={styles.rankChangeText}>+{userStats.rankChange}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.userStatsSubtext}>
                of {userStats.totalPlayers.toLocaleString()} capybaras
              </Text>
            </View>

            <View style={styles.userStatsRight}>
              <Text style={styles.userStatsLabel}>Top {userStats.percentile}%</Text>
              <Text style={styles.userScore}>
                {userStats.score.toLocaleString()}
              </Text>
              <Text style={styles.userStatsSubtext}>points today</Text>
            </View>

            <TouchableOpacity 
              style={styles.achievementButton}
              onPress={handleAchievementPress}
            >
              <Icon name="trophy" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  const renderLeaderboardItem = ({ item, index }: { item: LeaderboardPlayer; index: number }) => {
    if (item.isSeparator) {
      return (
        <View style={styles.separator}>
          <View style={styles.separatorLine} />
          <View style={styles.separatorContainer}>
            <Icon name="dots-horizontal" size={20} color="#999" />
            <Text style={styles.separatorText}>Many talented capybaras...</Text>
            <Icon name="dots-horizontal" size={20} color="#999" />
          </View>
          <View style={styles.separatorLine} />
        </View>
      );
    }

    const isTopThree = item.rank <= 3;
    const itemAnim = useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
      Animated.timing(itemAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 50,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }, []);

    return (
      <Animated.View
        style={[
          styles.leaderboardItem,
          item.isCurrentUser && styles.currentUserItem,
          {
            opacity: itemAnim,
            transform: [
              {
                translateX: itemAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
            ],
          },
        ]}
      >
        {/* Glow effect for current user */}
        {item.isCurrentUser && <View style={styles.currentUserGlow} />}

        <View style={styles.rankSection}>
          {isTopThree ? (
            <View style={[styles.medalContainer, getMedalStyle(item.rank)]}>
              <Icon name="crown" size={16} color="white" />
              <Text style={styles.medalText}>{item.rank}</Text>
            </View>
          ) : (
            <View style={styles.rankContainer}>
              <Text style={[styles.rankText, item.isCurrentUser && styles.currentUserRank]}>
                #{item.rank}
              </Text>
              {item.rankChange !== undefined && item.rankChange !== 0 && (
                <View style={[styles.rankChange, item.rankChange > 0 ? styles.rankUp : styles.rankDown]}>
                  <Icon 
                    name={item.rankChange > 0 ? "trending-up" : "trending-down"} 
                    size={10} 
                    color={item.rankChange > 0 ? "#4CAF50" : "#F44336"} 
                  />
                </View>
              )}
            </View>
          )}
        </View>

        <View style={styles.playerSection}>
          <View style={styles.playerHeader}>
            <Text style={[styles.playerName, item.isCurrentUser && styles.currentUserName]}>
              {item.displayName}
              {item.isCurrentUser && <Text style={styles.youLabel}> (You)</Text>}
            </Text>
            {item.badge && (
              <View style={styles.badgeContainer}>
                <Icon name={getBadgeIcon(item.badge)} size={14} color={getBadgeColor(item.badge)} />
              </View>
            )}
          </View>

          <View style={styles.playerStats}>
            <View style={styles.statItem}>
              <Icon name="star" size={12} color="#FFD700" />
              <Text style={styles.statText}>{item.score.toLocaleString()}</Text>
            </View>
            
            {item.highestStreak > 0 && (
              <View style={styles.statItem}>
                <Icon name="fire" size={12} color="#FF6B35" />
                <Text style={styles.statText}>{item.highestStreak}</Text>
              </View>
            )}
            
            <Text style={styles.lastActive}>{item.lastActive}</Text>
          </View>
        </View>

        {item.isCurrentUser && (
          <Icon name="chevron-right" size={20} color={theme.colors.primary} />
        )}
      </Animated.View>
    );
  };

  const getMedalStyle = (rank: number) => {
    const colors = {
      1: { backgroundColor: '#FFD700' },
      2: { backgroundColor: '#C0C0C0' },
      3: { backgroundColor: '#CD7F32' },
    };
    return colors[rank as keyof typeof colors];
  };

  const getBadgeIcon = (badge: string) => {
    const icons = {
      crown: 'crown',
      fire: 'fire',
      star: 'star',
      diamond: 'diamond',
    };
    return icons[badge as keyof typeof icons] || 'star';
  };

  const getBadgeColor = (badge: string) => {
    const colors = {
      crown: '#FFD700',
      fire: '#FF6B35',
      star: '#2196F3',
      diamond: '#9C27B0',
    };
    return colors[badge as keyof typeof colors] || '#2196F3';
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#FFF8E7" barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ scale: pulseAnim }],
            }}
          >
            <Icon name="trophy" size={60} color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading Rankings...</Text>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#FFF8E7" barStyle="dark-content" />
      
      {/* Enhanced Header */}
      <Animated.View 
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Capybara Rankings</Text>
          <Text style={styles.headerSubtitle}>Daily Leaderboard</Text>
        </View>
        
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Icon name="refresh" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
      </Animated.View>

      {/* Enhanced Tab Bar */}
      <Animated.View 
        style={[
          styles.tabBar,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'global' && styles.activeTab]}
            onPress={() => handleTabChange('global')}
          >
            <Icon name="earth" size={18} color={activeTab === 'global' ? 'white' : '#777'} />
            <Text style={[styles.tabText, activeTab === 'global' && styles.activeTabText]}>
              Global
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
            onPress={() => handleTabChange('friends')}
          >
            <Icon name="account-group" size={18} color={activeTab === 'friends' ? 'white' : '#777'} />
            <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
              Friends
            </Text>
          </TouchableOpacity>

          {/* Animated tab indicator */}
          <Animated.View
            style={[
              styles.tabIndicator,
              {
                transform: [
                  {
                    translateX: tabIndicatorAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, SCREEN_WIDTH / 2],
                    }),
                  },
                ],
              },
            ]}
          />
        </View>
      </Animated.View>

      {/* Podium for top 3 */}
      {activeTab === 'global' && renderPodium()}

      {/* User Stats Card */}
      {renderUserStatsCard()}

      {/* Leaderboard List */}
      <FlatList
        data={leaderboardData}
        renderItem={renderLeaderboardItem}
        keyExtractor={(item) => item.id}
        style={styles.flatList}
        contentContainerStyle={styles.flatListContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
            title="Updating rankings..."
            titleColor={theme.colors.primary}
          />
        }
        getItemLayout={(data, index) => ({
          length: 80,
          offset: 80 * index,
          index,
        })}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
      />

      {/* Footer */}
      <View style={styles.footer}>
        <Icon name="rodent" size={16} color="#999" />
        <Text style={styles.footerText}>
          Rankings update every hour • Scores reset daily
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8E7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: theme.colors.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Nunito-Bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    color: '#666',
    marginTop: 2,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 159, 28, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBar: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  tabContainer: {
    flexDirection: 'row',
    position: 'relative',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  activeTab: {
    backgroundColor: theme.colors.primary,
    borderRadius: 25,
    marginHorizontal: 8,
    marginVertical: 8,
  },
  tabText: {
    marginLeft: 6,
    fontSize: 14,
    fontFamily: 'Nunito-Medium',
    color: '#777',
  },
  activeTabText: {
    color: 'white',
    fontFamily: 'Nunito-Bold',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    width: SCREEN_WIDTH / 2,
    backgroundColor: theme.colors.primary,
  },
  podiumContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  podiumGradient: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  podiumPlace: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 12,
    minWidth: 90,
  },
  firstPlace: {
    marginBottom: 0,
    transform: [{ scale: 1.1 }],
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  secondPlace: {
    marginBottom: 10,
  },
  thirdPlace: {
    marginBottom: 20,
  },
  podiumIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  podiumName: {
    fontSize: 12,
    fontFamily: 'Nunito-Bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  podiumScore: {
    fontSize: 14,
    fontFamily: 'Nunito-Bold',
    color: theme.colors.primary,
  },
  crownGlow: {
    position: 'absolute',
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 17,
    zIndex: -1,
  },
  userStatsCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  userStatsGradient: {
    padding: 20,
  },
  userStatsContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userStatsLeft: {
    flex: 1,
  },
  userStatsRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  userStatsLabel: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  userRankContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userRank: {
    fontSize: 28,
    fontFamily: 'Nunito-Bold',
    color: 'white',
  },
  userScore: {
    fontSize: 24,
    fontFamily: 'Nunito-Bold',
    color: 'white',
  },
  userStatsSubtext: {
    fontSize: 11,
    fontFamily: 'Nunito-Regular',
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  rankChangeUp: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  rankChangeText: {
    fontSize: 10,
    fontFamily: 'Nunito-Bold',
    color: '#4CAF50',
    marginLeft: 2,
  },
  achievementButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  flatList: {
    flex: 1,
  },
  flatListContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 100,
  },
  leaderboardItem: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  currentUserItem: {
    backgroundColor: '#FFF5E6',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  currentUserGlow: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    backgroundColor: 'rgba(255, 159, 28, 0.1)',
    borderRadius: 18,
    zIndex: -1,
  },
  rankSection: {
    width: 50,
    alignItems: 'center',
  },
  medalContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  medalText: {
    fontSize: 10,
    fontFamily: 'Nunito-Bold',
    color: 'white',
    marginTop: -2,
  },
  rankContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  rankText: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: '#666',
  },
  currentUserRank: {
    color: theme.colors.primary,
  },
  rankChange: {
    position: 'absolute',
    top: -5,
    right: -8,
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankUp: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  rankDown: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
  },
  playerSection: {
    flex: 1,
    marginLeft: 12,
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  playerName: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: '#333',
    flex: 1,
  },
  currentUserName: {
    color: theme.colors.primary,
  },
  youLabel: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    color: theme.colors.primary,
    opacity: 0.8,
  },
  badgeContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 159, 28, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  playerStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  statText: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    color: '#666',
    marginLeft: 4,
  },
  lastActive: {
    fontSize: 11,
    fontFamily: 'Nunito-Regular',
    color: '#999',
    marginLeft: 'auto',
    fontStyle: 'italic',
  },
  separator: {
    marginVertical: 16,
    alignItems: 'center',
  },
  separatorLine: {
    height: 1,
    backgroundColor: '#e0e0e0',
    width: '100%',
  },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    position: 'absolute',
  },
  separatorText: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    color: '#999',
    marginHorizontal: 8,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  footerText: {
    fontSize: 11,
    fontFamily: 'Nunito-Regular',
    color: '#999',
    marginLeft: 6,
    fontStyle: 'italic',
  },
});

export default LeaderboardScreen;