// src/components/mascot/EnhancedMascotDisplay.tsx - TypeScript version with original quiz functionality
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  Easing,
  Image,
  Dimensions,
  TouchableWithoutFeedback,
  Platform,
  TouchableOpacity
} from 'react-native';

// Add mascot messages
export const MASCOT_MESSAGES = {
  welcome: "Hey there, quiz champion! 🎉 Ready to exercise those brain muscles?",
  correct: [
    "Boom! You nailed it! 🎯",
    "Wow, you're on fire! 🔥",
    "Genius alert! 🧠✨",
    "That's what I'm talking about! 🙌",
  ],
  incorrect: [
    "Oops! Nice try though! 💪",
    "Don't worry, you'll get the next one! 🌟",
    "Learning moment! Let's see why... 🤔",
  ],
  streak: [
    "STREAK MASTER! Keep it going! 🔥🔥🔥",
    "Unstoppable! You're crushing it! 💥",
    "Look at you go! Streak champion! 🏆",
  ],
  timeDebt: "Uh oh! Time's ticking backwards! Complete quizzes to catch up! ⏰💨",
  dailyGoal: "Woohoo! Goal crushed! You're amazing! 🎊",
};

// Get screen dimensions for positioning
const { width, height } = Dimensions.get('window');

// Map mascot types to image paths
const MASCOT_IMAGES = {
  happy: require('../../assets/mascot/happy.png'),
  sad: require('../../assets/mascot/sad.png'),
  excited: require('../../assets/mascot/excited.png'),
  depressed: require('../../assets/mascot/depressed.png'),
  gamemode: require('../../assets/mascot/gamemode.png'),
  below: require('../../assets/mascot/below.png'),
} as const;

type MascotType = keyof typeof MASCOT_IMAGES;

interface Question {
  question: string;
  options: Record<string, string>;
  correctAnswer: string;
  explanation: string;
}

interface EnhancedMascotDisplayProps {
  type?: MascotType;
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
  // Quiz-specific props
  isQuizScreen?: boolean;
  currentQuestion?: Question | null;
  selectedAnswer?: string | null;
}

const EnhancedMascotDisplay: React.FC<EnhancedMascotDisplayProps> = ({ 
  type = 'happy', 
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
  // Quiz-specific props
  isQuizScreen = false,
  currentQuestion = null,
  selectedAnswer = null
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [displayedMessage, setDisplayedMessage] = useState(message);
  const [showOverlay, setShowOverlay] = useState(false);
  
  // Animation values - more refined for smoother animations
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const mascotAnim = useRef(new Animated.Value(0)).current;
  const bubbleAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  
  // Timing controls
  const hideTimer = useRef<NodeJS.Timeout | null>(null);
  const bounceTimer = useRef<Animated.CompositeAnimation | null>(null);
  
  // Handle message changes with smooth transitions
  useEffect(() => {
    handleNewMessage(message);
  }, [message]);
  
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
    }
  };
  
  // Handle sad mascot press in quiz - show explanation
  const handleSadMascotPress = () => {
    if (isQuizScreen && type === 'sad' && selectedAnswer && !isCorrect && onPeekingPress) {
      // Show detailed explanation for wrong answer
      onPeekingPress();
    }
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
  fullScreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  mascotContainer: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 297,
    overflow: 'hidden',
  },
  mascotWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    height: 540,
    marginTop: 0,
  },
  mascotLeft: {
    marginLeft: -50,
  },
  mascotRight: {
    marginRight: -50,
  },
  mascotImageContainer: {
    width: 450,
    height: 540,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mascotImage: {
    width: '100%',
    height: '100%',
  },
  speechBubble: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    minWidth: 280,
    maxWidth: 340,
    borderWidth: 2,
    borderColor: '#E8F4FF',
    bottom: '25%',
    zIndex: 1002,
    // Professional gradient border effect
    ...Platform.select({
      ios: {
        shadowColor: '#2196F3',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
    // Add subtle gradient overlay
    overflow: 'hidden',
  },
  speechText: {
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Roboto',
    color: '#2C3E50',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  tapIndicator: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#E8F4FF',
    borderRadius: 16,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#90CAF9',
  },
  tapText: {
    fontSize: 13,
    color: '#1976D2',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Roboto',
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  
  // Add speech bubble tail
  speechBubbleTail: {
    position: 'absolute',
    bottom: -10,
    left: '50%',
    marginLeft: -15,
    width: 0,
    height: 0,
    borderLeftWidth: 15,
    borderRightWidth: 15,
    borderTopWidth: 10,
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FFFFFF',
  },
  peekingContainer: {
    position: 'absolute',
    bottom: -58,
    left: -58,
    zIndex: 50,
  },
  peekingMascot: {
    width: 180,
    height: 180,
    overflow: 'hidden',
    transform: [{ rotate: '45deg' }],
  },
  peekingImage: {
    width: 180,
    height: 180,
    marginTop: 0,
  },
});

export default EnhancedMascotDisplay;