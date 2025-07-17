import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { TimerService, TimerState } from '../../services/TimerService';
import theme from '../../styles/theme';

interface PersistentTimerProps {
  onPress?: () => void;
  position?: 'top' | 'bottom';
  showAlways?: boolean;
}

const PersistentTimer: React.FC<PersistentTimerProps> = ({
  onPress,
  position = 'bottom',
  showAlways = true,
}) => {
  const [timerState, setTimerState] = useState<TimerState>({
    remainingTime: 0,
    negativeTime: 0,
    isTracking: false,
    isAppForeground: true,
  });
  const [isExpanded, setIsExpanded] = useState(false);
  
  const slideAnim = new Animated.Value(0);
  const pulseAnim = new Animated.Value(1);

  useEffect(() => {
    // Listen to timer updates
    const unsubscribe = TimerService.addListener((state) => {
      setTimerState(state);
      
      // Pulse animation when timer is low
      if (state.remainingTime > 0 && state.remainingTime <= 60) {
        startPulseAnimation();
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const toggleExpanded = () => {
    const toValue = isExpanded ? 0 : 1;
    setIsExpanded(!isExpanded);
    
    Animated.spring(slideAnim, {
      toValue,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const getTimerDisplay = () => {
    if (timerState.negativeTime > 0) {
      return {
        time: `-${TimerService.formatTime(timerState.negativeTime)}`,
        color: theme.colors.error,
        icon: 'alert-circle',
        message: 'Earning negative points!',
        status: 'negative',
      };
    } else if (timerState.remainingTime > 0) {
      const color = timerState.remainingTime <= 300 
        ? theme.colors.warning 
        : theme.colors.success;
      
      return {
        time: TimerService.formatTime(timerState.remainingTime),
        color,
        icon: timerState.isTracking ? 'play-circle' : 'pause-circle',
        message: timerState.isTracking ? 'Timer running' : 'Timer paused',
        status: 'active',
      };
    } else {
      return {
        time: '0:00',
        color: theme.colors.textSecondary,
        icon: 'time-outline',
        message: 'No time left',
        status: 'empty',
      };
    }
  };

  const display = getTimerDisplay();
  const shouldShow = showAlways || timerState.remainingTime > 0 || timerState.negativeTime > 0;

  if (!shouldShow) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        position === 'top' ? styles.positionTop : styles.positionBottom,
        display.status === 'negative' && styles.negativeContainer,
        {
          transform: [
            { scale: display.status === 'negative' ? pulseAnim : 1 },
          ],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.mainBar}
        onPress={onPress || toggleExpanded}
        activeOpacity={0.8}
      >
        <View style={styles.leftContent}>
          <Icon name={display.icon} size={24} color={display.color} />
          <Text style={[styles.timeText, { color: display.color }]}>
            {display.time}
          </Text>
        </View>
        
        <View style={styles.rightContent}>
          <Text style={styles.messageText}>{display.message}</Text>
          <Icon 
            name={isExpanded ? 'chevron-up' : 'chevron-down'} 
            size={20} 
            color={theme.colors.textSecondary} 
          />
        </View>
      </TouchableOpacity>
      
      {/* Expanded Details */}
      <Animated.View
        style={[
          styles.expandedContent,
          {
            opacity: slideAnim,
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                }),
              },
            ],
          },
        ]}
      >
        {isExpanded && (
          <>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status:</Text>
              <Text style={styles.detailValue}>
                {timerState.isAppForeground ? 'App in foreground (paused)' : 'App in background'}
              </Text>
            </View>
            
            {timerState.negativeTime > 0 && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Penalty:</Text>
                <Text style={[styles.detailValue, { color: theme.colors.error }]}>
                  -{Math.floor(timerState.negativeTime / 60) * 10} points
                </Text>
              </View>
            )}
            
            <View style={styles.tipContainer}>
              <Icon name="bulb-outline" size={16} color={theme.colors.warning} />
              <Text style={styles.tipText}>
                {timerState.remainingTime > 0
                  ? 'Leave the app to start the timer!'
                  : 'Play quizzes to earn more time!'}
              </Text>
            </View>
          </>
        )}
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.base,
    marginHorizontal: theme.spacing.base,
    ...theme.shadows.medium,
  },
  positionTop: {
    top: 100,
  },
  positionBottom: {
    bottom: 100,
  },
  negativeContainer: {
    backgroundColor: '#FFEBEE',
  },
  mainBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.md,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  timeText: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: theme.typography.fontFamily.bold,
  },
  messageText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
  expandedContent: {
    paddingHorizontal: theme.spacing.base,
    paddingBottom: theme.spacing.base,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  detailLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
  detailValue: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.textPrimary,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.backgroundDark,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    marginTop: theme.spacing.sm,
  },
  tipText: {
    flex: 1,
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
});

export default PersistentTimer;