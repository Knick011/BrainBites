// src/screens/QuizScreen.tsx - Complete production-ready implementation with fixed timer
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  StatusBar,
  Platform,
  BackHandler,
  Alert,
  Animated,
  Easing,
  ActivityIndicator,
  ScrollView,
  Dimensions
} from 'react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, Question, ScoreResult } from '../types';
import QuestionService from '../services/QuestionService';
import EnhancedTimerService from '../services/EnhancedTimerService';
import EnhancedScoreService from '../services/EnhancedScoreService';
import SoundService from '../services/SoundService';
import { logEvent } from '../config/Firebase';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import BannerAdComponent from '../components/BannerAdComponent';
import EnhancedMascotDisplay from '../components/Mascot/EnhancedMascotDisplay';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type QuizScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Quiz'>;
type QuizScreenRouteProp = RouteProp<RootStackParamList, 'Quiz'>;
type MascotType = 'happy' | 'sad' | 'excited' | 'depressed' | 'gamemode' | 'below';

interface QuizScreenState {
  currentQuestion: Question | null;
  selectedAnswer: string | null;
  showResult: boolean;
  isCorrect: boolean;
  streak: number;
  showStreakAnimation: boolean;
  showMascot: boolean;
  mascotMessage: string;
  isLoading: boolean;
  questionsAnswered: number;
  correctAnswers: number;
  showExplanation: boolean;
  score: number;
  isStreakMilestone: boolean;
  showPointsAnimation: boolean;
  pointsEarned: number;
  timeRemaining: number;
  isTimerActive: boolean;
  hasTimedOut: boolean;
}

const QUESTION_TIME_LIMIT = 20; // 20 seconds per question
const RESULT_DISPLAY_TIME = 3000; // 3 seconds to show result
const NEXT_QUESTION_DELAY = 500; // Small delay before next question

const QuizScreen: React.FC = () => {
  const navigation = useNavigation<QuizScreenNavigationProp>();
  const route = useRoute<QuizScreenRouteProp>();
  const { difficulty, category } = route.params;

  // Timer refs
  const questionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const resultTimerRef = useRef<NodeJS.Timeout | null>(null);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const questionStartTime = useRef<number>(0);

  // Animation values
  const timerAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;
  const streakAnim = useRef(new Animated.Value(0)).current;
  const pointsAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Create option animations
  const optionsAnim = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0)
  ]).current;

  // State initialization
  const [state, setState] = useState<QuizScreenState>({
    currentQuestion: null,
    selectedAnswer: null,
    showResult: false,
    isCorrect: false,
    streak: 0,
    showStreakAnimation: false,
    showMascot: false,
    mascotMessage: '',
    isLoading: true,
    questionsAnswered: 0,
    correctAnswers: 0,
    showExplanation: false,
    score: 0,
    isStreakMilestone: false,
    showPointsAnimation: false,
    pointsEarned: 0,
    timeRemaining: QUESTION_TIME_LIMIT,
    isTimerActive: false,
    hasTimedOut: false
  });

  // Cleanup function
  const cleanup = useCallback(() => {
    if (questionTimerRef.current) {
      clearInterval(questionTimerRef.current);
      questionTimerRef.current = null;
    }
    if (resultTimerRef.current) {
      clearTimeout(resultTimerRef.current);
      resultTimerRef.current = null;
    }
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }
  }, []);

  // Initialize quiz
  useEffect(() => {
    initializeQuiz();
    return cleanup;
  }, [cleanup]);

  // Handle back button
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        handleQuitQuiz();
        return true;
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [])
  );

  const initializeQuiz = async () => {
    try {
      // Initialize services
      await QuestionService.initialize();
      await EnhancedTimerService.initialize();
      
      // Play game start sound
      SoundService.playButtonClick();
      
      // Load first question
      await loadNextQuestion();
      
      // Log quiz start
      logEvent('quiz_started', {
        difficulty,
        category: category || 'random'
      });
      
    } catch (error) {
      console.error('Failed to initialize quiz:', error);
      Alert.alert('Error', 'Failed to load quiz. Please try again.');
      navigation.goBack();
    }
  };

  const loadNextQuestion = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const question = QuestionService.getRandomQuestion(category, difficulty);
      
      if (!question) {
        // No more questions available
        endQuiz();
        return;
      }

      // Reset animations
      timerAnim.setValue(1);
      fadeAnim.setValue(0);
      cardAnim.setValue(0);
      optionsAnim.forEach(anim => anim.setValue(0));

      setState(prev => ({
        ...prev,
        currentQuestion: question,
        selectedAnswer: null,
        showResult: false,
        isCorrect: false,
        showExplanation: false,
        showMascot: false,
        isLoading: false,
        timeRemaining: QUESTION_TIME_LIMIT,
        isTimerActive: true,
        hasTimedOut: false
      }));

      // Start animations
      startEntranceAnimations();
      
      // Start timer
      startQuestionTimer();
      
      // Record question start time
      questionStartTime.current = Date.now();
      
    } catch (error) {
      console.error('Failed to load question:', error);
      endQuiz();
    }
  };

  const startEntranceAnimations = () => {
    // Fade in screen
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Card entrance
    Animated.spring(cardAnim, {
      toValue: 1,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();

    // Staggered option animations
    optionsAnim.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 300,
        delay: index * 100,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
  };

  const startQuestionTimer = () => {
    // Clear any existing timer
    if (questionTimerRef.current) {
      clearInterval(questionTimerRef.current);
    }

    // Start timer animation
    Animated.timing(timerAnim, {
      toValue: 0,
      duration: QUESTION_TIME_LIMIT * 1000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    // Start countdown timer
    questionTimerRef.current = setInterval(() => {
      setState(prev => {
        const newTime = prev.timeRemaining - 1;
        
        if (newTime <= 0) {
          // Time's up!
          handleTimeout();
          return { ...prev, timeRemaining: 0, isTimerActive: false };
        }
        
        return { ...prev, timeRemaining: newTime };
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (questionTimerRef.current) {
      clearInterval(questionTimerRef.current);
      questionTimerRef.current = null;
    }
    
    // Stop timer animation
    timerAnim.stopAnimation();
    
    setState(prev => ({ ...prev, isTimerActive: false }));
  };

  const handleTimeout = () => {
    stopTimer();
    
    setState(prev => ({ ...prev, hasTimedOut: true }));
    
    // Play timeout sound
    SoundService.playIncorrect();
    
    // Show timeout result
    processAnswer(null, true);
  };

  const handleAnswerSelection = (selectedKey: string) => {
    // Prevent multiple selections
    if (state.selectedAnswer || state.showResult || !state.isTimerActive) {
      return;
    }

    // Stop timer immediately
    stopTimer();
    
    // Process the answer
    processAnswer(selectedKey, false);
  };

  const processAnswer = async (selectedKey: string | null, isTimeout: boolean) => {
    if (!state.currentQuestion) return;

    const isCorrect = selectedKey === state.currentQuestion.correctAnswer && !isTimeout;
    const responseTime = questionStartTime.current ? Date.now() - questionStartTime.current : QUESTION_TIME_LIMIT * 1000;

    // Update state with selection
    setState(prev => ({
      ...prev,
      selectedAnswer: selectedKey,
      showResult: true,
      isCorrect,
      questionsAnswered: prev.questionsAnswered + 1,
      correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0)
    }));

    // Play sound
    if (isCorrect) {
      SoundService.playCorrect();
    } else {
      SoundService.playIncorrect();
      // Shake animation for wrong answer
      startShakeAnimation();
    }

    try {
      // Update score through EnhancedScoreService
      const result = await EnhancedScoreService.processAnswer(
        isCorrect,
        difficulty,
        {
          startTime: questionStartTime.current,
          category: category || state.currentQuestion.category,
          responseTime,
          isTimeout
        }
      );

      // Update streak
      const newStreak = isCorrect ? result.currentStreak : 0;
      const isStreakMilestone = result.isMilestone;

      setState(prev => ({
        ...prev,
        streak: newStreak,
        score: result.newScore,
        pointsEarned: result.pointsEarned,
        isStreakMilestone,
        showPointsAnimation: result.pointsEarned > 0,
        showStreakAnimation: isStreakMilestone
      }));

      // Add time credits for correct answers
      if (isCorrect) {
        const timeCredits = getTimeCredits(difficulty, responseTime);
        if (timeCredits > 0) {
          await EnhancedTimerService.addTimeCredits(timeCredits);
        }
      }

      // Show mascot
      showMascotFeedback(isCorrect, isStreakMilestone);

      // Animate points
      if (result.pointsEarned > 0) {
        animatePoints();
      }

      // Animate streak if milestone
      if (isStreakMilestone) {
        animateStreak();
      }

      // Log answer
      logEvent('question_answered', {
        correct: isCorrect,
        difficulty,
        category: category || state.currentQuestion.category,
        responseTime,
        isTimeout,
        streak: newStreak
      });

    } catch (error) {
      console.error('Failed to process answer:', error);
    }

    // Show result for a few seconds, then continue
    resultTimerRef.current = setTimeout(() => {
      setState(prev => ({ ...prev, showExplanation: true }));
      
      animationTimeoutRef.current = setTimeout(() => {
        loadNextQuestion();
      }, NEXT_QUESTION_DELAY);
    }, RESULT_DISPLAY_TIME);
  };

  const getTimeCredits = (difficulty: string, responseTime: number): number => {
    const baseCredits = {
      easy: 60,    // 1 minute
      medium: 120, // 2 minutes  
      hard: 180    // 3 minutes
    };

    const base = baseCredits[difficulty as keyof typeof baseCredits] || 60;
    
    // Bonus for fast responses (under 10 seconds)
    if (responseTime < 10000) {
      return base + 30; // 30 second bonus
    }
    
    return base;
  };

  const showMascotFeedback = (isCorrect: boolean, isStreakMilestone: boolean) => {
    let mascotType: MascotType;
    let message: string;

    if (isStreakMilestone) {
      mascotType = 'excited';
      message = `Amazing! ${state.streak} in a row! 🔥`;
    } else if (isCorrect) {
      mascotType = 'happy';
      message = 'Correct! Well done! 🎉';
    } else {
      mascotType = 'sad';
      message = 'Not quite right. Keep trying! 💪';
    }

    setState(prev => ({
      ...prev,
      showMascot: true,
      mascotMessage: message
    }));

    // Hide mascot after animation
    setTimeout(() => {
      setState(prev => ({ ...prev, showMascot: false }));
    }, 2000);
  };

  const startShakeAnimation = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const animatePoints = () => {
    pointsAnim.setValue(0);
    Animated.spring(pointsAnim, {
      toValue: 1,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const animateStreak = () => {
    streakAnim.setValue(0);
    Animated.sequence([
      Animated.spring(streakAnim, {
        toValue: 1.2,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(streakAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleQuitQuiz = () => {
    Alert.alert(
      'Quit Quiz',
      'Are you sure you want to quit? Your progress will be lost.',
      [
        { text: 'Continue', style: 'cancel' },
        { 
          text: 'Quit', 
          style: 'destructive',
          onPress: () => {
            cleanup();
            SoundService.stopMusic();
            navigation.goBack();
          }
        }
      ]
    );
  };

  const endQuiz = () => {
    cleanup();
    
    logEvent('quiz_completed', {
      questionsAnswered: state.questionsAnswered,
      correctAnswers: state.correctAnswers,
      finalScore: state.score,
      difficulty,
      category: category || 'random'
    });

    SoundService.stopMusic();
    navigation.navigate('Home');
  };

  const getOptions = () => {
    if (!state.currentQuestion) return [];
    
    return [
      { key: 'A', text: state.currentQuestion.optionA || state.currentQuestion.options?.A || '' },
      { key: 'B', text: state.currentQuestion.optionB || state.currentQuestion.options?.B || '' },
      { key: 'C', text: state.currentQuestion.optionC || state.currentQuestion.options?.C || '' },
      { key: 'D', text: state.currentQuestion.optionD || state.currentQuestion.options?.D || '' },
    ].filter(option => option.text);
  };

  const getOptionStyle = (optionKey: string) => {
    if (!state.showResult) return styles.optionButton;
    
    const isSelected = state.selectedAnswer === optionKey;
    const isCorrect = optionKey === state.currentQuestion?.correctAnswer;
    
    if (isCorrect) {
      return [styles.optionButton, styles.correctOption];
    } else if (isSelected && !isCorrect) {
      return [styles.optionButton, styles.incorrectOption];
    }
    
    return [styles.optionButton, styles.disabledOption];
  };

  const getTimerColor = () => {
    if (state.timeRemaining > 10) return '#22c55e';
    if (state.timeRemaining > 5) return '#facc15';
    return '#ef4444';
  };

  if (state.isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#FFF8E7" barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF9F1C" />
          <Text style={styles.loadingText}>Loading Quiz...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#FFF8E7" barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleQuitQuiz} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {state.questionsAnswered + 1} • Score: {state.score}
          </Text>
          <Text style={styles.streakText}>
            Streak: {state.streak} 🔥
          </Text>
        </View>
        
        <View style={styles.timerDisplay}>
          <Icon name="timer" size={20} color={getTimerColor()} />
          <Text style={[styles.timerText, { color: getTimerColor() }]}>
            {state.timeRemaining}s
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Timer Bar */}
        <Animated.View style={[styles.timerContainer, { opacity: fadeAnim }]}>
          <View style={styles.timerBar}>
            <Animated.View 
              style={[
                styles.timerFill,
                {
                  width: timerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%']
                  }),
                  backgroundColor: getTimerColor()
                }
              ]}
            />
          </View>
        </Animated.View>

        {/* Question Card */}
        <Animated.View 
          style={[
            styles.questionCard,
            {
              opacity: cardAnim,
              transform: [
                { 
                  translateY: cardAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0]
                  })
                },
                {
                  translateX: shakeAnim
                }
              ]
            }
          ]}
        >
          <Text style={styles.questionText}>
            {state.currentQuestion?.question}
          </Text>
        </Animated.View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {getOptions().map((option, index) => (
            <Animated.View
              key={option.key}
              style={{
                opacity: optionsAnim[index],
                transform: [
                  { 
                    translateY: optionsAnim[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0]
                    })
                  }
                ]
              }}
            >
              <TouchableOpacity
                style={getOptionStyle(option.key)}
                onPress={() => handleAnswerSelection(option.key)}
                disabled={state.showResult || !state.isTimerActive}
                activeOpacity={0.8}
              >
                <View style={styles.optionContent}>
                  <View style={[
                    styles.optionKey,
                    state.selectedAnswer === option.key && styles.selectedOptionKey
                  ]}>
                    <Text style={[
                      styles.optionKeyText,
                      state.selectedAnswer === option.key && styles.selectedOptionKeyText
                    ]}>
                      {option.key}
                    </Text>
                  </View>
                  <Text style={styles.optionText}>{option.text}</Text>
                  
                  {state.showResult && option.key === state.currentQuestion?.correctAnswer && (
                    <Icon name="check-circle" size={24} color="#22c55e" />
                  )}
                  {state.showResult && state.selectedAnswer === option.key && 
                   option.key !== state.currentQuestion?.correctAnswer && (
                    <Icon name="close-circle" size={24} color="#ef4444" />
                  )}
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        {/* Explanation */}
        {state.showExplanation && state.currentQuestion?.explanation && (
          <Animated.View style={[styles.explanationCard, { opacity: fadeAnim }]}>
            <Icon name="information" size={20} color="#2196F3" />
            <Text style={styles.explanationText}>
              {state.currentQuestion.explanation}
            </Text>
          </Animated.View>
        )}

        {/* Points Animation */}
        {state.showPointsAnimation && (
          <Animated.View 
            style={[
              styles.pointsAnimation,
              {
                opacity: pointsAnim,
                transform: [
                  {
                    scale: pointsAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1]
                    })
                  },
                  {
                    translateY: pointsAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0]
                    })
                  }
                ]
              }
            ]}
          >
            <Text style={styles.pointsText}>+{state.pointsEarned}</Text>
          </Animated.View>
        )}

        {/* Streak Animation */}
        {state.showStreakAnimation && (
          <Animated.View 
            style={[
              styles.streakAnimation,
              {
                opacity: streakAnim,
                transform: [{ scale: streakAnim }]
              }
            ]}
          >
            <Text style={styles.streakAnimationText}>
              🔥 STREAK MILESTONE! 🔥
            </Text>
            <Text style={styles.streakCountText}>{state.streak} in a row!</Text>
          </Animated.View>
        )}

        <BannerAdComponent />
      </ScrollView>

      {/* Mascot Display */}
      {state.showMascot && (
        <EnhancedMascotDisplay
          mood={state.isCorrect ? (state.isStreakMilestone ? 'excited' : 'happy') : 'sad'}
          message={state.mascotMessage}
          visible={state.showMascot}
        />
      )}
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
    color: '#333',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressText: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: '#333',
  },
  streakText: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#FF6B35',
    marginTop: 2,
  },
  timerDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    marginLeft: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  timerContainer: {
    marginTop: 20,
    marginBottom: 24,
  },
  timerBar: {
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  timerFill: {
    height: '100%',
    borderRadius: 4,
  },
  questionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  questionText: {
    fontSize: 20,
    fontFamily: 'Nunito-Bold',
    color: '#333',
    textAlign: 'center',
    lineHeight: 28,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  correctOption: {
    borderColor: '#22c55e',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  incorrectOption: {
    borderColor: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  disabledOption: {
    opacity: 0.6,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionKey: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectedOptionKey: {
    backgroundColor: '#FF6B35',
  },
  optionKeyText: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: '#333',
  },
  selectedOptionKeyText: {
    color: 'white',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: '#333',
    lineHeight: 22,
  },
  explanationCard: {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  explanationText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#333',
    marginLeft: 8,
    lineHeight: 20,
  },
  pointsAnimation: {
    position: 'absolute',
    top: 100,
    right: 20,
    backgroundColor: '#22c55e',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  pointsText: {
    fontSize: 18,
    fontFamily: 'Nunito-Bold',
    color: 'white',
  },
  streakAnimation: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: '#FF6B35',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  streakAnimationText: {
    fontSize: 18,
    fontFamily: 'Nunito-Bold',
    color: 'white',
    textAlign: 'center',
  },
  streakCountText: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: 'white',
    marginTop: 4,
  },
});

export default QuizScreen;