import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTimerStore } from '../../store/useTimerStore';
import { TimerService } from '../../services/TimerService';
import { SoundService } from '../../services/SoundService';

const PersistentTimer: React.FC = () => {
  const { remainingTime, negativeScore } = useTimerStore();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const warningShown = useRef(false);

  useEffect(() => {
    // Warning when time is low
    if (remainingTime > 0 && remainingTime < 60000 && !warningShown.current) {
      warningShown.current = true;
      SoundService.playTimerWarning();
      
      // Pulse animation for warning
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
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
    } else if (remainingTime >= 60000) {
      warningShown.current = false;
      pulseAnim.stopAnimation();
    }
  }, [remainingTime]);

  const formatTime = (milliseconds: number): string => {
    return TimerService.getFormattedTime(milliseconds);
  };

  const isNegative = remainingTime < 0;
  const isWarning = remainingTime > 0 && remainingTime < 60000;

  return (
    <Animated.View
      style={[
        styles.container,
        isNegative && styles.negativeContainer,
        isWarning && styles.warningContainer,
        {
          transform: [{ scale: isWarning ? pulseAnim : 1 }],
        },
      ]}
    >
      <TouchableOpacity style={styles.timerButton} activeOpacity={0.8}>
        <Icon
          name="time"
          size={20}
          color={isNegative ? '#FFF' : isWarning ? '#FF9800' : '#4CAF50'}
        />
        <Text
          style={[
            styles.timerText,
            isNegative && styles.negativeText,
            isWarning && styles.warningText,
          ]}
        >
          {formatTime(remainingTime)}
        </Text>
        {isNegative && (
          <View style={styles.penaltyBadge}>
            <Text style={styles.penaltyText}>-{negativeScore}</Text>
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
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 999,
  },
  negativeContainer: {
    backgroundColor: '#F44336',
  },
  warningContainer: {
    backgroundColor: '#FFF3E0',
  },
  timerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    gap: 8,
  },
  timerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Nunito-Bold',
  },
  negativeText: {
    color: '#FFF',
  },
  warningText: {
    color: '#FF9800',
  },
  penaltyBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 5,
  },
  penaltyText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default PersistentTimer;