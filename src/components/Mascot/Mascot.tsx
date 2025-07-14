import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
  Dimensions,
  Text,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SoundService } from '../../services/SoundService';
import { useQuizStore } from '../../store/useQuizStore';
import { useUserStore } from '../../store/useUserStore';
import { useTimerStore } from '../../store/useTimerStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface MascotProps {
  forceShow?: boolean;
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

const Mascot: React.FC<MascotProps> = ({ forceShow = false }) => {
  const [mood, setMood] = useState<MascotMood>('peeking');
  const [showDialogue, setShowDialogue] = useState(false);
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typedMessage, setTypedMessage] = useState('');

  const quizState = useQuizStore();
  const userStats = useUserStore((state) => state.stats);
  const timerState = useTimerStore();
  const insets = useSafeAreaInsets();

  const peekAnimation = useRef(new Animated.Value(0)).current;
  const bounceAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Initial peek animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(peekAnimation, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(peekAnimation, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

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

  const handleCorrectAnswer = () => {
    setMood('happy');
    SoundService.playMascotHappy();
    animateMascot();
    
    if (showDialogue) {
      const messages = MASCOT_MESSAGES.correct;
      showMessage(messages[Math.floor(Math.random() * messages.length)]);
    }
  };

  const handleIncorrectAnswer = () => {
    setMood('sad');
    SoundService.playMascotSad();
    animateMascot();
    showMessage(MASCOT_MESSAGES.incorrect[Math.floor(Math.random() * MASCOT_MESSAGES.incorrect.length)]);
  };

  const showTimerWarning = () => {
    setMood('gamemode');
    const messages = MASCOT_MESSAGES.timerWarning;
    showMessage(messages[Math.floor(Math.random() * messages.length)]);
  };

  const animateMascot = () => {
    Animated.sequence([
      Animated.spring(scaleAnimation, {
        toValue: 1.2,
        useNativeDriver: true,
      }),
      Animated.spring(bounceAnimation, {
        toValue: -20,
        useNativeDriver: true,
      }),
      Animated.spring(bounceAnimation, {
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnimation, {
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const showMessage = (msg: string) => {
    setMessage(msg);
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

  const handleMascotPress = () => {
    SoundService.playMascotPeek();
    
    if (!showDialogue) {
      // Show stats or greeting
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
      animateMascot();
    } else {
      setShowDialogue(false);
      setMood('peeking');
    }
  };

  const getMascotImage = () => {
    switch (mood) {
      case 'happy':
        return require('../../assets/mascot/happy.png');
      case 'sad':
        return require('../../assets/mascot/sad.png');
      case 'excited':
        return require('../../assets/mascot/excited.png');
      case 'gamemode':
        return require('../../assets/mascot/gamemode.png');
      case 'depressed':
        return require('../../assets/mascot/depressed.png');
      case 'peeking':
      default:
        return require('../../assets/mascot/below.png'); // Use below.png for peeking state
    }
  };

  const peekTranslateX = peekAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-10, 10],
  });

  return (
    <>
      {/* Peeking Mascot - Always visible in bottom-left */}
      <TouchableOpacity
        style={[
          styles.peekingContainer,
          forceShow && styles.forceShow,
        ]}
        onPress={handleMascotPress}
        activeOpacity={0.9}
      >
        <Animated.View
          style={[
            styles.peekingMascot,
            {
              transform: [
                { rotate: '45deg' },
                { translateX: peekTranslateX },
                { scale: scaleAnimation },
              ],
            },
          ]}
        >
          <Image 
            source={require('../../assets/mascot/below.png')} 
            style={styles.peekingMascotImage} 
          />
        </Animated.View>
      </TouchableOpacity>

      <Modal
        visible={showDialogue}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDialogue(false)}
      >
        <TouchableOpacity
          style={styles.dialogueOverlay}
          activeOpacity={1}
          onPress={() => setShowDialogue(false)}
        >
          <View style={styles.dialogueBubble}>
            <View style={styles.dialogueTriangle} />
            <Text style={styles.dialogueText}>
              {typedMessage}
              {isTyping && <Text style={styles.cursor}>|</Text>}
            </Text>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
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
  peekingMascotImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
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
  mascotImageContainer: {
    width: 450,
    height: 540,
    position: 'absolute',
    bottom: 0,
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