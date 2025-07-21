// src/types/leaderboard.ts
export interface LeaderboardPlayer {
    id: string;
    rank: number;
    displayName: string;
    score: number;
    highestStreak: number;
    isCurrentUser: boolean;
    lastActive: string;
    avatar?: string;
    badge?: BadgeType;
    percentile?: number;
    isSeparator?: boolean;
    isRising?: boolean;
    rankChange?: number;
    achievements?: Achievement[];
    level?: number;
    totalQuestions?: number;
    accuracy?: number;
  }
  
  export interface UserStats {
    rank: number;
    score: number;
    percentile: number;
    totalPlayers: number;
    rankChange: number;
    achievements: string[];
    weeklyRank?: number;
    monthlyRank?: number;
    tier?: UserTier;
  }
  
  export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    unlockedAt?: Date;
    progress?: number;
    maxProgress?: number;
  }
  
  export type BadgeType = 'crown' | 'fire' | 'star' | 'diamond' | 'lightning' | 'brain' | 'rocket';
  
  export type UserTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'legendary';
  
  export interface RankingPeriod {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    isActive: boolean;
  }
  
  // src/components/Leaderboard/AchievementBadge.tsx
  import React from 'react';
  import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
  import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
  import { Achievement } from '../../types/leaderboard';
  import theme from '../../styles/theme';
  
  interface AchievementBadgeProps {
    achievement: Achievement;
    size?: 'small' | 'medium' | 'large';
    onPress?: () => void;
  }
  
  export const AchievementBadge: React.FC<AchievementBadgeProps> = ({
    achievement,
    size = 'medium',
    onPress,
  }) => {
    const getSizeStyles = () => {
      switch (size) {
        case 'small':
          return { width: 32, height: 32, iconSize: 16, fontSize: 10 };
        case 'large':
          return { width: 60, height: 60, iconSize: 30, fontSize: 14 };
        default:
          return { width: 44, height: 44, iconSize: 22, fontSize: 12 };
      }
    };
  
    const sizeStyles = getSizeStyles();
  
    return (
      <TouchableOpacity
        style={[
          styles.container,
          {
            width: sizeStyles.width,
            height: sizeStyles.height,
            backgroundColor: achievement.color,
          },
        ]}
        onPress={onPress}
        disabled={!onPress}
      >
        <Icon
          name={achievement.icon}
          size={sizeStyles.iconSize}
          color="white"
        />
        {achievement.progress !== undefined && (
          <View style={styles.progressContainer}>
            <Text style={[styles.progressText, { fontSize: sizeStyles.fontSize }]}>
              {achievement.progress}/{achievement.maxProgress}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };
  
  const styles = StyleSheet.create({
    container: {
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 4,
    },
    progressContainer: {
      position: 'absolute',
      bottom: -8,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      borderRadius: 8,
      paddingHorizontal: 4,
      paddingVertical: 1,
    },
    progressText: {
      color: 'white',
      fontFamily: 'Nunito-Bold',
    },
  });
  
  // src/components/Leaderboard/UserTierBadge.tsx
  import React from 'react';
  import { View, Text, StyleSheet } from 'react-native';
  import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
  import LinearGradient from 'react-native-linear-gradient';
  import { UserTier } from '../../types/leaderboard';
  
  interface UserTierBadgeProps {
    tier: UserTier;
    size?: 'small' | 'medium' | 'large';
  }
  
  export const UserTierBadge: React.FC<UserTierBadgeProps> = ({
    tier,
    size = 'medium',
  }) => {
    const getTierConfig = (tier: UserTier) => {
      const configs = {
        bronze: {
          colors: ['#CD7F32', '#A0522D'],
          icon: 'medal',
          name: 'Bronze',
        },
        silver: {
          colors: ['#C0C0C0', '#A8A8A8'],
          icon: 'medal',
          name: 'Silver',
        },
        gold: {
          colors: ['#FFD700', '#DAA520'],
          icon: 'crown',
          name: 'Gold',
        },
        platinum: {
          colors: ['#E5E4E2', '#C0C0C0'],
          icon: 'diamond',
          name: 'Platinum',
        },
        diamond: {
          colors: ['#B9F2FF', '#4FC3F7'],
          icon: 'diamond',
          name: 'Diamond',
        },
        legendary: {
          colors: ['#FF6B35', '#FF9F1C'],
          icon: 'crown',
          name: 'Legendary',
        },
      };
      return configs[tier];
    };
  
    const getSizeStyles = () => {
      switch (size) {
        case 'small':
          return { 
            containerPadding: 6, 
            iconSize: 12, 
            fontSize: 8,
            borderRadius: 8,
          };
        case 'large':
          return { 
            containerPadding: 12, 
            iconSize: 20, 
            fontSize: 12,
            borderRadius: 16,
          };
        default:
          return { 
            containerPadding: 8, 
            iconSize: 16, 
            fontSize: 10,
            borderRadius: 12,
          };
      }
    };
  
    const tierConfig = getTierConfig(tier);
    const sizeStyles = getSizeStyles();
  
    return (
      <LinearGradient
        colors={tierConfig.colors}
        style={[
          styles.container,
          {
            padding: sizeStyles.containerPadding,
            borderRadius: sizeStyles.borderRadius,
          },
        ]}
      >
        <Icon
          name={tierConfig.icon}
          size={sizeStyles.iconSize}
          color="white"
        />
        <Text style={[styles.tierText, { fontSize: sizeStyles.fontSize }]}>
          {tierConfig.name}
        </Text>
      </LinearGradient>
    );
  };
  
  const tierStyles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 4,
    },
    tierText: {
      color: 'white',
      fontFamily: 'Nunito-Bold',
      marginLeft: 4,
    },
  });
  
  // src/components/Leaderboard/RankingAnimation.tsx
  import React, { useEffect, useRef } from 'react';
  import { Animated, Easing, ViewStyle } from 'react-native';
  
  interface RankingAnimationProps {
    children: React.ReactNode;
    delay?: number;
    style?: ViewStyle;
    animationType?: 'slideUp' | 'slideIn' | 'fadeIn' | 'scale';
  }
  
  export const RankingAnimation: React.FC<RankingAnimationProps> = ({
    children,
    delay = 0,
    style,
    animationType = 'slideIn',
  }) => {
    const animValue = useRef(new Animated.Value(0)).current;
    const scaleValue = useRef(new Animated.Value(0.8)).current;
  
    useEffect(() => {
      const animations = [];
  
      if (animationType === 'slideUp' || animationType === 'slideIn') {
        animations.push(
          Animated.timing(animValue, {
            toValue: 1,
            duration: 600,
            delay,
            easing: Easing.out(Easing.back(1.2)),
            useNativeDriver: true,
          })
        );
      }
  
      if (animationType === 'fadeIn') {
        animations.push(
          Animated.timing(animValue, {
            toValue: 1,
            duration: 400,
            delay,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          })
        );
      }
  
      if (animationType === 'scale') {
        animations.push(
          Animated.spring(scaleValue, {
            toValue: 1,
            tension: 100,
            friction: 8,
            delay,
            useNativeDriver: true,
          })
        );
      }
  
      Animated.parallel(animations).start();
    }, [delay, animationType]);
  
    const getTransform = () => {
      switch (animationType) {
        case 'slideUp':
          return [
            {
              translateY: animValue.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              }),
            },
          ];
        case 'slideIn':
          return [
            {
              translateX: animValue.interpolate({
                inputRange: [0, 1],
                outputRange: [100, 0],
              }),
            },
          ];
        case 'scale':
          return [{ scale: scaleValue }];
        default:
          return [];
      }
    };
  
    return (
      <Animated.View
        style={[
          style,
          {
            opacity: animValue,
            transform: getTransform(),
          },
        ]}
      >
        {children}
      </Animated.View>
    );
  };
  
  // src/utils/leaderboardUtils.ts
  import { LeaderboardPlayer, UserTier } from '../types/leaderboard';
  
  export const generateCapybaraName = (): string => {
    const prefixes = [
      'Capy', 'Bara', 'Hydro', 'Aqua', 'Zen', 'Chill', 'Swift', 'Mega', 
      'Ultra', 'Quantum', 'Neo', 'Alpha', 'Beta', 'Gamma', 'Delta', 'Omega'
    ];
    
    const suffixes = [
      'Genius', 'Master', 'Lord', 'King', 'Queen', 'Champion', 'Legend', 
      'Pro', 'Elite', 'Supreme', 'Ultimate', 'Prime', 'Max', 'X', 'Z'
    ];
    
    const middles = [
      'Brain', 'Quiz', 'Smart', 'Wise', 'Swift', 'Flash', 'Bolt', 'Storm',
      'Fire', 'Ice', 'Thunder', 'Lightning', 'Cosmic', 'Stellar', 'Nova'
    ];
  
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const middle = middles[Math.floor(Math.random() * middles.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  
    // Sometimes skip middle word
    if (Math.random() > 0.6) {
      return `${prefix}${suffix}`;
    }
    
    return `${prefix}${middle}${suffix}`;
  };
  
  export const calculateUserTier = (rank: number, totalPlayers: number): UserTier => {
    const percentile = ((totalPlayers - rank) / totalPlayers) * 100;
    
    if (percentile >= 99) return 'legendary';
    if (percentile >= 90) return 'diamond';
    if (percentile >= 75) return 'platinum';
    if (percentile >= 50) return 'gold';
    if (percentile >= 25) return 'silver';
    return 'bronze';
  };
  
  export const formatRankChange = (change: number): string => {
    if (change === 0) return '';
    if (change > 0) return `+${change}`;
    return `${change}`;
  };
  
  export const getLastActiveColor = (lastActive: string): string => {
    if (lastActive.includes('Online now')) return '#4CAF50';
    if (lastActive.includes('m')) return '#FF9800';
    if (lastActive.includes('h')) return '#FF5722';
    return '#999';
  };
  
  export const generateAchievements = (player: LeaderboardPlayer) => {
    const achievements = [];
    
    if (player.highestStreak >= 20) {
      achievements.push({
        id: 'streak_master',
        name: 'Streak Master',
        description: '20+ question streak',
        icon: 'fire',
        color: '#FF6B35',
      });
    }
    
    if (player.rank <= 10) {
      achievements.push({
        id: 'top_performer',
        name: 'Top Performer',
        description: 'Top 10 global rank',
        icon: 'crown',
        color: '#FFD700',
      });
    }
    
    if (player.score >= 100000) {
      achievements.push({
        id: 'score_legend',
        name: 'Score Legend',
        description: '100K+ points',
        icon: 'star',
        color: '#2196F3',
      });
    }
    
    return achievements;
  };
  
  // src/hooks/useLeaderboardAnimations.ts
  import { useRef, useCallback } from 'react';
  import { Animated, Easing } from 'react-native';
  
  export const useLeaderboardAnimations = () => {
    const rankChangeAnim = useRef(new Animated.Value(0)).current;
    const scoreUpdateAnim = useRef(new Animated.Value(1)).current;
    const newEntryAnim = useRef(new Animated.Value(0)).current;
  
    const animateRankChange = useCallback((direction: 'up' | 'down') => {
      rankChangeAnim.setValue(0);
      
      Animated.sequence([
        Animated.timing(rankChangeAnim, {
          toValue: direction === 'up' ? -20 : 20,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(rankChangeAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }, [rankChangeAnim]);
  
    const animateScoreUpdate = useCallback(() => {
      scoreUpdateAnim.setValue(1);
      
      Animated.sequence([
        Animated.timing(scoreUpdateAnim, {
          toValue: 1.1,
          duration: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(scoreUpdateAnim, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }, [scoreUpdateAnim]);
  
    const animateNewEntry = useCallback(() => {
      newEntryAnim.setValue(0);
      
      Animated.timing(newEntryAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }).start();
    }, [newEntryAnim]);
  
    return {
      rankChangeAnim,
      scoreUpdateAnim,
      newEntryAnim,
      animateRankChange,
      animateScoreUpdate,
      animateNewEntry,
    };
  };
  
  export default {
    AchievementBadge,
    UserTierBadge,
    RankingAnimation,
    generateCapybaraName,
    calculateUserTier,
    formatRankChange,
    getLastActiveColor,
    generateAchievements,
    useLeaderboardAnimations,
  };