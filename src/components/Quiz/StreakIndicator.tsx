import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface StreakIndicatorProps {
  streak: number;
  isVisible?: boolean;
}

const StreakIndicator: React.FC<StreakIndicatorProps> = ({ 
  streak, 
  isVisible = true 
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (streak > 0 && isVisible) {
      // Pulse animation for active streak
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Glow animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: false,
          }),
        ])
      ).start();
    }
  }, [streak, isVisible]);

  if (!isVisible || streak === 0) {
    return null;
  }

  const getStreakColor = () => {
    if (streak >= 10) return '#FF6B6B'; // Red for high streaks
    if (streak >= 5) return '#FF9F1C'; // Orange for medium streaks
    return '#4ECDC4'; // Teal for low streaks
  };

  const getStreakIcon = () => {
    if (streak >= 10) return 'flame';
    if (streak >= 5) return 'flash';
    return 'trending-up';
  };

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          transform: [{ scale: scaleAnim }],
          shadowOpacity: glowAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.3, 0.6],
          }),
        },
      ]}
    >
      <View style={[styles.streakBadge, { backgroundColor: getStreakColor() }]}>
        <Icon name={getStreakIcon()} size={16} color="#FFF" />
        <Text style={styles.streakText}>{streak}</Text>
      </View>
      <Text style={styles.streakLabel}>
        {streak === 1 ? 'Streak!' : `${streak} Streak!`}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    gap: 4,
  },
  streakText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  streakLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontWeight: '500',
  },
});

export default StreakIndicator; 