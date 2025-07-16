import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  AppState,
  AppStateStatus,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTimerStore } from '../../store/useTimerStore';
import { TimerService } from '../../services/TimerService';
import { SoundService } from '../../services/SoundService';
import { NotificationService } from '../../services/NotificationService';

interface TimerState {
  remainingTime: number;
  isRunning: boolean;
  negativeScore: number;
  isPaused: boolean;
}

const PersistentTimer: React.FC = () => {
  const [timerState, setTimerState] = useState<TimerState>({
    remainingTime: 1800000, // 30 minutes in milliseconds
    isRunning: true,
    negativeScore: 0,
    isPaused: false,
  });

  const [lastWarningTime, setLastWarningTime] = useState<number>(0);
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const warningShown = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const backgroundTimeRef = useRef<number>(0);

  useEffect(() => {
    startTimer();
    
    // Listen for app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const { remainingTime, negativeScore } = timerState;
    
    // Handle warnings and notifications
    if (remainingTime > 0 && remainingTime < 300000 && !warningShown.current) { // 5 minutes
      warningShown.current = true;
      handleLowTimeWarning();
    } else if (remainingTime >= 300000) {
      warningShown.current = false;
    }

    // Handle negative time
    if (remainingTime <= 0 && !timerState.isPaused) {
      handleTimeExpired();
    }

    // Animate based on timer state
    if (remainingTime < 60000 && remainingTime > 0) { // Last minute
      startPulseAnimation();
    } else {
      stopPulseAnimation();
    }
  }, [timerState.remainingTime]);

  const startTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      setTimerState(prev => {
        if (prev.isPaused) return prev;
        
        const newTime = prev.remainingTime - 1000;
        let newNegativeScore = prev.negativeScore;
        
        // Calculate negative score if time is expired
        if (newTime <= 0) {
          newNegativeScore = Math.abs(newTime) / 60000 * 10; // 10 points per minute
        }
        
        return {
          ...prev,
          remainingTime: newTime,
          negativeScore: newNegativeScore,
        };
      });
    }, 1000);
  };

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (appState.match(/inactive|background/) && nextAppState === 'active') {
      // App has come to foreground
      handleAppReturn();
    } else if (appState === 'active' && nextAppState.match(/inactive|background/)) {
      // App is going to background
      handleAppBackground();
    }
    
    setAppState(nextAppState);
  };

  const handleAppBackground = () => {
    backgroundTimeRef.current = Date.now();
    
    // Schedule background notifications
    NotificationService.scheduleBackgroundNotifications();
    
    // Pause timer if needed
    if (timerState.remainingTime > 0) {
      TimerService.pauseTimer();
    }
  };

  const handleAppReturn = () => {
    const backgroundDuration = Date.now() - backgroundTimeRef.current;
    
    // Update timer based on background time
    if (backgroundDuration > 0 && timerState.isRunning && !timerState.isPaused) {
      setTimerState(prev => ({
        ...prev,
        remainingTime: prev.remainingTime - backgroundDuration,
      }));
    }
    
    // Resume timer
    if (timerState.remainingTime > 0) {
      TimerService.resumeTimer();
    }
  };

  const handleLowTimeWarning = () => {
    const now = Date.now();
    
    // Prevent spam warnings (only show once per 5 minutes)
    if (now - lastWarningTime < 300000) return;
    
    setLastWarningTime(now);
    
    // Play warning sound
    SoundService.playTimerWarning();
    
    // Show notification
    const remainingMinutes = Math.ceil(timerState.remainingTime / 60000);
    NotificationService.notifyLowTime(remainingMinutes);
    
    // Animate the timer
    Animated.sequence([
      Animated.timing(slideAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleTimeExpired = () => {
    // Only notify once when time first expires
    if (timerState.remainingTime > -1000) {
      NotificationService.notifyTimeExpired();
    }
  };

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

  const stopPulseAnimation = () => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  };

  const formatTime = (milliseconds: number): string => {
    const isNegative = milliseconds < 0;
    const absTime = Math.abs(milliseconds);
    
    const hours = Math.floor(absTime / 3600000);
    const minutes = Math.floor((absTime % 3600000) / 60000);
    const seconds = Math.floor((absTime % 60000) / 1000);
    
    const timeString = hours > 0 
      ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      : `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    return isNegative ? `-${timeString}` : timeString;
  };

  const addTime = (minutes: number) => {
    const timeToAdd = minutes * 60000;
    setTimerState(prev => ({
      ...prev,
      remainingTime: prev.remainingTime + timeToAdd,
      negativeScore: prev.remainingTime + timeToAdd <= 0 ? prev.negativeScore : 0,
    }));
    
    // Update timer service
    TimerService.addTime(minutes);
  };

  const togglePause = () => {
    setTimerState(prev => ({ ...prev, isPaused: !prev.isPaused }));
    
    if (timerState.isPaused) {
      TimerService.resumeTimer();
    } else {
      TimerService.pauseTimer();
    }
  };

  const handleTimerPress = () => {
    // You can add functionality here, like showing a detailed timer view
    console.log('Timer pressed');
  };

  const { remainingTime, negativeScore, isPaused } = timerState;
  const isNegative = remainingTime < 0;
  const isWarning = remainingTime > 0 && remainingTime < 300000; // 5 minutes warning
  const isCritical = remainingTime > 0 && remainingTime < 60000; // 1 minute critical

  const getTimerColor = () => {
    if (isNegative) return '#F44336';
    if (isCritical) return '#FF9800';
    if (isWarning) return '#FFC107';
    return '#4CAF50';
  };

  const getBackgroundColor = () => {
    if (isNegative) return '#F44336';
    if (isCritical) return '#FF9800';
    if (isWarning) return '#FFF3E0';
    return 'rgba(255, 255, 255, 0.95)';
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: getBackgroundColor(),
          transform: [
            { scale: isCritical ? pulseAnim : 1 },
            { translateX: slideAnim },
          ],
        },
      ]}
    >
      <TouchableOpacity 
        style={styles.timerButton} 
        onPress={handleTimerPress}
        activeOpacity={0.8}
      >
        <View style={styles.iconContainer}>
          <Icon
            name={isPaused ? 'pause' : 'time'}
            size={20}
            color={getTimerColor()}
          />
        </View>
        
        <View style={styles.timeContainer}>
          <Text
            style={[
              styles.timerText,
              {
                color: isNegative ? '#FFF' : getTimerColor(),
              },
            ]}
          >
            {formatTime(remainingTime)}
          </Text>
          
          {isNegative && negativeScore > 0 && (
            <Text style={styles.penaltyText}>
              -{Math.floor(negativeScore)} pts
            </Text>
          )}
        </View>
        
        {isPaused && (
          <View style={styles.pausedIndicator}>
            <Text style={styles.pausedText}>PAUSED</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    right: 20,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 999,
    minWidth: 120,
  },
  timerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  iconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeContainer: {
    flex: 1,
    alignItems: 'center',
  },
  timerText: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Nunito-Bold',
  },
  penaltyText: {
    fontSize: 12,
    color: '#FFCDD2',
    fontFamily: 'Nunito-Regular',
    marginTop: 2,
  },
  pausedIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF9800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  pausedText: {
    fontSize: 10,
    color: '#FFF',
    fontWeight: 'bold',
    fontFamily: 'Nunito-Bold',
  },
});

export default PersistentTimer;