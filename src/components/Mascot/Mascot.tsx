import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
  Dimensions,
  Text,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SoundService from '../../services/SoundService';
import { useQuizStore } from '../../store/useQuizStore';
import { useUserStore } from '../../store/useUserStore';
import { useTimerStore } from '../../store/useTimerStore';
import theme from '../../styles/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface MascotProps {
  forceShow?: boolean;
  type?: 'happy' | 'sad' | 'excited' | 'gamemode' | 'depressed' | 'peeking';
  position?: 'left' | 'right';
  showMascot?: boolean;
  message?: string | null;
  autoHide?: boolean;
  autoHideDuration?: number;
  onDismiss?: () => void;
  onMessageComplete?: () => void;
  fullScreen?: boolean;
  mascotEnabled?: boolean;
  onPeekingPress?: () => void;
  showExplanation?: boolean;
  isCorrect?: boolean | null;
  isQuizScreen?: boolean;
  currentQuestion?: any;
  selectedAnswer?: string | null;
}

type MascotMood = 'peeking' | 'happy' | 'sad' | 'excited' | 'gamemode' | 'depressed';

const MASCOT_MESSAGES = {
  greeting: [
    "Hi! I'm CaBBY! Ready to exercise that brain?",
    "CaBBY here! Let's make learning fun!",
    "Hello friend! Time for some BrainBites!",
  ],
  encouragement: [
    "You're doing great! Keep it up!",
    "Wow! Your brain is on fire today!",
    "Amazing work! I'm so proud of you!",
  ],
  correct: [
    "Fantastic! You nailed it!",
    "Brilliant! That's the right answer!",
    "You're a genius! Well done!",
  ],
  incorrect: [
    "Don't worry! Mistakes help us learn!",
    "Almost there! Let's try another one!",
    "Keep trying! You'll get the next one!",
  ],
  streak: [
    "Incredible streak! You're unstoppable!",
    "On fire! Keep that streak going!",
    "Streak master! You're amazing!",
  ],
  timerWarning: [
    "Hurry! Time's running low!",
    "Quick! The timer's almost up!",
    "Focus! You can do this!",
  ],
  stats: (stats: any) => [
    `You've answered ${stats.totalQuestions} questions! ${stats.accuracy}% accuracy!`,
    `Current streak: ${stats.currentStreak}! Best: ${stats.bestStreak}!`,
    `You're ranked #${stats.rank} on the leaderboard!`,
  ],
};

// Map mascot types to image paths
const MASCOT_IMAGES = {
  happy: require('../../assets/mascot/happy.png'),
  sad: require('../../assets/mascot/sad.png'),
  excited: require('../../assets/mascot/excited.png'),
  depressed: require('../../assets/mascot/depressed.png'),
  gamemode: require('../../assets/mascot/gamemode.png'),
  below: require('../../assets/mascot/below.png'),
  peeking: require('../../assets/mascot/below.png'),
};

const Mascot: React.FC<MascotProps> = ({ 
  forceShow = false,
  type = 'peeking',
  position = 'left',
  showMascot = true,
  message = null,
  autoHide = false,
  autoHideDuration = 5000,
  onDismiss = null,
  onMessageComplete = null,
  fullScreen = true,
  mascotEnabled = true,
  onPeekingPress = null,
  showExplanation = false,
  isCorrect = null,
  isQuizScreen = false,
  currentQuestion = null,
  selectedAnswer = null
}) => {
  const [mood, setMood] = useState<MascotMood>('peeking');
  const [showDialogue, setShowDialogue] = useState(false);
  const [displayedMessage, setDisplayedMessage] = useState(message);
  const [showOverlay, setShowOverlay] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typedMessage, setTypedMessage] = useState('');

  const quizState = useQuizStore();
  const userStats = useUserStore((state) => state.stats);
  const timerState = useTimerStore();
  const insets = useSafeAreaInsets();

  // Animation values - more refined for smoother animations
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const mascotAnim = useRef(new Animated.Value(0)).current;
  const bubbleAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  
  // Timing controls
  const hideTimer = useRef<NodeJS.Timeout | null>(null);
  const bounceTimer = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    // Handle message changes with smooth transitions
    handleNewMessage(message);
  }, [message]);

  useEffect(() => {
    // React to quiz events
    if (quizState.lastAnswerCorrect !== null) {
      if (quizState.lastAnswerCorrect) {
        handleCorrectAnswer();
      } else {
        handleIncorrectAnswer();
      }
    }
  }, [quizState.lastAnswerCorrect]);

  useEffect(() => {
    // Timer warnings
    if (timerState.remainingTime < 60000 && timerState.remainingTime > 0) {
      showTimerWarning();
    }
  }, [timerState.remainingTime]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
      }
      if (bounceTimer.current) {
        bounceTimer.current.stop();
      }
    };
  }, []);

  const handleNewMessage = (newMessage: string | null) => {
    // Clear existing timers
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
    }
    
    if (newMessage && newMessage !== displayedMessage) {
      setDisplayedMessage(newMessage);
      showMascotWithMessage();
      
      // Auto hide after duration if enabled
      if (autoHide) {
        hideTimer.current = setTimeout(() => {
          hideMascot();
        }, autoHideDuration);
      }
    } else if (!newMessage) {
      hideMascot();
    }
  };

  const showMascotWithMessage = () => {
    if (fullScreen) {
      setShowOverlay(true);
    }
    setIsVisible(true);
    
    // Smooth entrance animation sequence
    Animated.parallel([
      // Overlay fade in
      Animated.timing(overlayAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      
      // Mascot slide up with bounce
      Animated.timing(mascotAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.2)), // Gentler bounce
      }),
      
      // Scale animation for entrance
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.1)),
      }),
    ]).start(() => {
      // After entrance, show speech bubble
      showSpeechBubble();
      // Start gentle breathing animation
      startBreathingAnimation();
    });
  };

  const showSpeechBubble = () => {
    Animated.spring(bubbleAnim, {
      toValue: 1,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const startBreathingAnimation = () => {
    // Very subtle breathing animation
    const breathingSequence = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
      ])
    );
    
    breathingSequence.start();
    bounceTimer.current = breathingSequence;
  };

  const hideMascot = () => {
    // Stop breathing animation
    if (bounceTimer.current) {
      bounceTimer.current.stop();
    }
    
    // Smooth exit animation
    Animated.parallel([
      // Speech bubble disappears first
      Animated.timing(bubbleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
        easing: Easing.in(Easing.cubic),
      }),
      
      // Mascot slides down
      Animated.timing(mascotAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
        easing: Easing.in(Easing.back(1.2)),
      }),
      
      // Scale down
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 500,
        useNativeDriver: true,
        easing: Easing.in(Easing.cubic),
      }),
      
      // Overlay fades out
      Animated.timing(overlayAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.in(Easing.cubic),
      }),
    ]).start(() => {
      setTimeout(() => {
        setIsVisible(false);
        setShowOverlay(false);
        setDisplayedMessage(null);
        // Notify completion
        if (onMessageComplete) {
          onMessageComplete();
        }
        if (onDismiss) {
          onDismiss();
        }
      }, 0);
    });
  };

  const handleScreenTap = () => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
    }
    hideMascot();
  };

  // Handle peeking mascot press - QUIZ SPECIFIC FUNCTIONALITY
  const handlePeekingMascotPress = () => {
    if (isQuizScreen && currentQuestion) {
      // Quiz screen functionality - show explanation
      if (selectedAnswer && onPeekingPress) {
        // Call the quiz screen's explanation handler
        onPeekingPress();
      } else if (onPeekingPress) {
        // No answer selected yet - show hint
        onPeekingPress();
      }
    } else if (onPeekingPress) {
      // Non-quiz screen functionality (like home screen time display)
      onPeekingPress();
    } else {
      // Default behavior - show stats or greeting
      SoundService.playButtonPress();
      
      if (!showDialogue) {
        const stats = {
          totalQuestions: userStats.totalQuestionsAnswered,
          accuracy: Math.round((userStats.correctAnswers / Math.max(1, userStats.totalQuestionsAnswered)) * 100),
          currentStreak: quizState.currentStreak,
          bestStreak: userStats.bestStreak,
          rank: userStats.leaderboardRank,
        };
        
        const messages = Math.random() > 0.5 
          ? MASCOT_MESSAGES.greeting 
          : MASCOT_MESSAGES.stats(stats);
        
        showMessage(messages[Math.floor(Math.random() * messages.length)]);
        setMood('excited');
      } else {
        setShowDialogue(false);
        setMood('peeking');
      }
    }
  };

  // Handle sad mascot press in quiz - show explanation
  const handleSadMascotPress = () => {
    if (isQuizScreen && type === 'sad' && selectedAnswer && !isCorrect && onPeekingPress) {
      // Show detailed explanation for wrong answer
      onPeekingPress();
    }
  };

  const handleCorrectAnswer = () => {
    setMood('happy');
    const messages = MASCOT_MESSAGES.correct;
    showMessage(messages[Math.floor(Math.random() * messages.length)]);
  };

  const handleIncorrectAnswer = () => {
    setMood('sad');
    showMessage(MASCOT_MESSAGES.incorrect[Math.floor(Math.random() * MASCOT_MESSAGES.incorrect.length)]);
  };

  const showTimerWarning = () => {
    setMood('gamemode');
    const messages = MASCOT_MESSAGES.timerWarning;
    showMessage(messages[Math.floor(Math.random() * messages.length)]);
  };

  const showMessage = (msg: string) => {
    setDisplayedMessage(msg);
    setShowDialogue(true);
    setIsTyping(true);
    setTypedMessage('');

    // Typewriter effect
    let index = 0;
    const typewriterInterval = setInterval(() => {
      if (index < msg.length) {
        setTypedMessage((prev) => prev + msg[index]);
        index++;
      } else {
        clearInterval(typewriterInterval);
        setIsTyping(false);
      }
    }, 30);
  };

  // Get mascot transform with smooth animations
  const getMascotTransform = () => {
    return [
      {
        translateY: mascotAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [200, 0], // Slide up from bottom
        })
      },
      {
        scale: scaleAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.8, 1],
        })
      },
      {
        translateY: bounceAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -8], // Subtle breathing movement
        })
      },
      // Gentle rotation based on position
      {
        rotate: position === 'left' ? '3deg' : '-3deg'
      }
    ];
  };

  // Get speech bubble transform
  const getBubbleTransform = () => {
    return [
      {
        scale: bubbleAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.3, 1],
        })
      },
      {
        translateY: bubbleAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [20, 0],
        })
      }
    ];
  };

  // Get appropriate mascot image
  const getMascotImage = () => {
    return MASCOT_IMAGES[type] || MASCOT_IMAGES.happy;
  };

  // Don't render if not visible
  if (!isVisible && !showOverlay) {
    // Always show peeking mascot when main mascot is not visible
    return (
      <View style={styles.peekingContainer}>
        <TouchableOpacity 
          style={styles.peekingMascot}
          onPress={handlePeekingMascotPress}
          activeOpacity={0.8}
        >
          <Image 
            source={MASCOT_IMAGES.below || MASCOT_IMAGES.happy} 
            style={styles.peekingImage} 
            resizeMode="contain" 
          />
        </TouchableOpacity>
      </View>
    );
  }

  if (!isVisible) return null;
  
  return (
    <TouchableWithoutFeedback onPress={handleScreenTap}>
      <Animated.View 
        style={[
          styles.fullScreenContainer,
          {
            opacity: overlayAnim,
            backgroundColor: showOverlay ? 'rgba(0, 0, 0, 0.4)' : 'transparent'
          }
        ]}
      >
        {/* Speech bubble - centered above mascot */}
        {displayedMessage && (
          <Animated.View 
            style={[
              styles.speechBubble,
              {
                opacity: bubbleAnim,
                transform: getBubbleTransform(),
                position: 'absolute',
                left: '50%',
                bottom: 230,
                marginLeft: -160, // Center the bubble
                zIndex: 1002,
              }
            ]}
          >
            <Text style={styles.speechText}>{displayedMessage}</Text>
            {/* Subtle pulsing indicator */}
            <Animated.View 
              style={[
                styles.tapIndicator,
                {
                  opacity: bubbleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 0.6],
                  })
                }
              ]}
            >
              <Text style={styles.tapText}>
                {isQuizScreen && type === 'sad' ? 'Tap me for explanation' : 'Tap anywhere to continue'}
              </Text>
            </Animated.View>
          </Animated.View>
        )}
        <View style={styles.mascotContainer}>
          {/* Mascot */}
          <Animated.View 
            style={[
              styles.mascotWrapper,
              position === 'left' ? styles.mascotLeft : styles.mascotRight,
              {
                transform: getMascotTransform()
              }
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleSadMascotPress}
              style={styles.mascotImageContainer}
              disabled={!(isQuizScreen && type === 'sad' && selectedAnswer && !isCorrect)}
            >
              <Image 
                source={getMascotImage()} 
                style={styles.mascotImage} 
                resizeMode="contain" 
              />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  peekingContainer: {
    position: 'absolute',
    bottom: -58,
    left: -58,
    zIndex: 50,
  },
  forceShow: {
    zIndex: 2000,
  },
  peekingMascot: {
    width: 180,
    height: 180,
    overflow: 'hidden',
  },
  peekingImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  fullScreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  mascotContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 0,
  },
  mascotWrapper: {
    width: 200,
    height: 200,
    position: 'relative',
  },
  mascotLeft: {
    left: 0,
  },
  mascotRight: {
    right: 0,
  },
  mascotImageContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mascotImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  speechBubble: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    width: 320,
    alignItems: 'center',
  },
  speechText: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'Nunito-Regular',
    lineHeight: 24,
    textAlign: 'center',
  },
  tapIndicator: {
    marginTop: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: '#FF9F1C',
    borderRadius: 15,
  },
  tapText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  dialogueOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  mainMascotContainer: {
    height: 297,
    bottom: 0,
    alignItems: 'center',
  },
  mainMascotImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  dialogueBubble: {
    marginHorizontal: 20,
    marginBottom: 350,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  dialogueTriangle: {
    position: 'absolute',
    bottom: -10,
    left: '50%',
    marginLeft: -10,
    width: 0,
    height: 0,
    borderTopWidth: 10,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 0,
    borderTopColor: '#FFF',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  dialogueText: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'Nunito-Regular',
    lineHeight: 24,
  },
  cursor: {
    color: '#FF9F1C',
    fontWeight: 'bold',
  },
});

export default Mascot;