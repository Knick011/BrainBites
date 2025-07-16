import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { RootStackParamList } from '../../App';
import { QuestionService, Question } from '../services/QuestionService';
import { SoundService } from '../services/SoundService';
import { NotificationService } from '../services/NotificationService';
import { useQuizStore } from '../store/useQuizStore';
import { useUserStore } from '../store/useUserStore';
import { useTimerStore } from '../store/useTimerStore';
import { QuizQuestion } from '../components/Quiz/QuizQuestion';
import QuizOptions from '../components/Quiz/QuizOptions';
import StreakIndicator from '../components/Quiz/StreakIndicator';
import AnimatedBackground from '../components/common/AnimatedBackground';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type NavigationProp = StackNavigationProp<RootStackParamList, 'Quiz'>;
type QuizRouteProp = RouteProp<RootStackParamList, 'Quiz'>;

const QuizScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<QuizRouteProp>();
  const { category, difficulty } = route.params || {};

  const quizStore = useQuizStore();
  const userStore = useUserStore();
  const timerStore = useTimerStore();

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const streakScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    initializeQuiz();
    
    // Switch to game music when entering quiz
    SoundService.stopMenuMusic();
    SoundService.playGameMusic();
    
    return () => {
      // Switch back to menu music when leaving quiz
      SoundService.stopGameMusic();
      SoundService.playMenuMusic();
    };
  }, []);

  useEffect(() => {
    // Animate streak indicator when streak changes
    if (quizStore.currentStreak > 0) {
      Animated.sequence([
        Animated.spring(streakScale, {
          toValue: 1.2,
          useNativeDriver: true,
        }),
        Animated.spring(streakScale, {
          toValue: 1,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [quizStore.currentStreak]);

  const initializeQuiz = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      
      console.log('🎮 Initializing quiz with params:', { category, difficulty });
      
      // Ensure QuestionService is ready
      if (!QuestionService.isReady()) {
        console.log('📚 QuestionService not ready, loading...');
        await QuestionService.loadQuestions();
      }
      
      // Load first question
      await loadQuestion();
      
    } catch (error) {
      console.error('❌ Failed to initialize quiz:', error);
      setLoadError('Failed to load quiz. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadQuestion = async () => {
    try {
      console.log('🔄 Loading question for category:', category, 'difficulty:', difficulty);
      
      const question = await QuestionService.getRandomQuestion(category, difficulty);
      
      if (question) {
        console.log('✅ Question loaded:', question.question);
        setCurrentQuestion(question);
        quizStore.setCurrentQuestion(question);
        animateQuestionIn();
        setQuestionStartTime(Date.now());
        startQuestionTimer();
      } else {
        console.error('❌ No question received from service');
        setLoadError('No questions available for this category and difficulty.');
      }
    } catch (error) {
      console.error('❌ Error loading question:', error);
      setLoadError('Failed to load question. Please try again.');
    }
  };

  const startQuestionTimer = () => {
    const interval = setInterval(() => {
      setTimeSpent(Date.now() - questionStartTime);
    }, 100);
    
    // Clean up interval after 30 seconds max
    setTimeout(() => {
      clearInterval(interval);
    }, 30000);
    
    return () => clearInterval(interval);
  };

  const animateQuestionIn = () => {
    fadeAnim.setValue(0);
    slideAnim.setValue(SCREEN_WIDTH);
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 10,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateQuestionOut = (callback: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -SCREEN_WIDTH,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(callback);
  };

  const handleAnswerSelect = (answer: string) => {
    if (showResult) return;

    setSelectedAnswer(answer);
    
    // Get the correct answer value from the current question
    const correctAnswerValue = currentQuestion?.correctAnswer;
    const correct = answer === correctAnswerValue;
    
    console.log('Answer check:', {
      selected: answer,
      correct: correctAnswerValue,
      isCorrect: correct
    });
    
    setIsCorrect(correct);
    setShowResult(true);

    // Update stores
    quizStore.setLastAnswerCorrect(correct);
    quizStore.incrementQuestionsAnswered();
    
    if (correct) {
      handleCorrectAnswer();
    } else {
      handleIncorrectAnswer();
    }
  };

  const handleCorrectAnswer = () => {
    SoundService.playCorrect();
    
    // Calculate points based on difficulty and time
    const basePoints = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 20 : 30;
    const timeBonus = Math.max(0, 10 - Math.floor(timeSpent / 1000));
    const streakBonus = quizStore.currentStreak * 2;
    const totalPoints = basePoints + timeBonus + streakBonus;

    // Update streak
    const newStreak = quizStore.currentStreak + 1;
    quizStore.incrementStreak();
    
    // Play streak sound for milestones
    if (newStreak === 3 || newStreak % 5 === 0) {
      SoundService.playStreak();
      
      // Notify about streak milestone
      if (newStreak >= 10) {
        NotificationService.notifyStreakMilestone(newStreak);
      }
    }

    // Update user stats
    userStore.incrementScore(totalPoints);
    userStore.recordAnswer(true, category || 'general', difficulty || 'medium');
    userStore.updateStreak(newStreak);
    
    // Add time reward for correct answer
    const timeReward = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3;
    timerStore.addTime(timeReward);

    // Animate success
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1.1,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleIncorrectAnswer = () => {
    SoundService.playIncorrect();
    
    const previousStreak = quizStore.currentStreak;
    if (previousStreak > 0) {
      SoundService.playStreak(); // Different sound for broken streak
    }
    
    quizStore.resetStreak();
    userStore.recordAnswer(false, category || 'general', difficulty || 'medium');

    // Shake animation for wrong answer
    Animated.sequence([
      Animated.timing(slideAnim, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleNextQuestion = () => {
    animateQuestionOut(() => {
      setSelectedAnswer(null);
      setShowResult(false);
      setTimeSpent(0);
      setCurrentQuestion(null);
      loadQuestion();
    });
  };

  const handleExit = () => {
    SoundService.playButtonClick();
    
    Alert.alert(
      'Exit Quiz',
      'Are you sure you want to exit the quiz?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Exit', 
          style: 'destructive',
          onPress: () => navigation.goBack()
        }
      ]
    );
  };

  const handleRetry = () => {
    setLoadError(null);
    initializeQuiz();
  };

  // Loading state
  if (isLoading) {
    return (
      <LinearGradient
        colors={['#E8F4FF', '#D4E9FF', '#C0DFFF']}
        style={styles.container}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFF" />
          <Text style={styles.loadingText}>Loading questions...</Text>
          <Text style={styles.loadingSubtext}>
            {category ? `${category} - ${difficulty}` : 'Getting ready...'}
          </Text>
        </View>
      </LinearGradient>
    );
  }

  // Error state
  if (loadError) {
    return (
      <LinearGradient
        colors={['#E8F4FF', '#D4E9FF', '#C0DFFF']}
        style={styles.container}
      >
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={60} color="#FF6B6B" />
          <Text style={styles.errorTitle}>Oops!</Text>
          <Text style={styles.errorText}>{loadError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.exitButton} onPress={() => navigation.goBack()}>
            <Text style={styles.exitButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  // No question loaded
  if (!currentQuestion) {
    return (
      <LinearGradient
        colors={['#E8F4FF', '#D4E9FF', '#C0DFFF']}
        style={styles.container}
      >
        <View style={styles.errorContainer}>
          <Icon name="help-circle" size={60} color="#FFA500" />
          <Text style={styles.errorTitle}>No Questions Available</Text>
          <Text style={styles.errorText}>
            No questions found for {category} at {difficulty} difficulty.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.exitButton} onPress={() => navigation.goBack()}>
            <Text style={styles.exitButtonText}>Choose Different Category</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#E8F4FF', '#D4E9FF', '#C0DFFF']}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleExit} style={styles.headerExitButton}>
          <Icon name="close-circle" size={30} color="#FFF" />
        </TouchableOpacity>
        
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>Score</Text>
          <Text style={styles.scoreValue}>{userStore.stats.totalScore}</Text>
        </View>
        
        <View style={styles.streakContainer}>
          <StreakIndicator streak={quizStore.currentStreak} />
        </View>
      </View>

      {/* Filler Space */}
      <View style={styles.fillerSpace} />

      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.content}>
        <Animated.View 
          style={[
            styles.questionContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          {/* Question */}
          <QuizQuestion 
            question={currentQuestion} 
            questionNumber={quizStore.questionsAnswered + 1} 
          />
          
          {/* Options */}
          <QuizOptions
            options={[
              currentQuestion.optionA,
              currentQuestion.optionB,
              currentQuestion.optionC,
              currentQuestion.optionD,
            ]}
            selectedAnswer={selectedAnswer}
            correctAnswer={currentQuestion.correctAnswer}
            showResult={showResult}
            onSelectAnswer={handleAnswerSelect}
          />
          
          {/* Result Display */}
          {showResult && (
            <View style={styles.resultContainer}>
              <Text style={[styles.resultText, isCorrect ? styles.correctText : styles.incorrectText]}>
                {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
              </Text>
              
              {!isCorrect && (
                <>
                  <Text style={styles.correctAnswerText}>
                    Correct answer: {currentQuestion.correctAnswer}
                  </Text>
                  {currentQuestion.explanation && (
                    <Text style={styles.explanationText}>
                      {currentQuestion.explanation}
                    </Text>
                  )}
                </>
              )}
              
              <TouchableOpacity
                style={styles.nextButton}
                onPress={handleNextQuestion}
              >
                <Text style={styles.nextButtonText}>Next Question</Text>
                <Icon name="arrow-forward-circle" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fillerSpace: {
    height: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 18,
    color: '#FFF',
    fontFamily: 'Nunito-Bold',
    marginTop: 20,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Nunito-Regular',
    marginTop: 8,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorTitle: {
    fontSize: 24,
    color: '#FFF',
    fontFamily: 'Nunito-Bold',
    marginTop: 20,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: 'Nunito-Regular',
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
  },
  exitButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 10,
  },
  exitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerExitButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  scoreLabel: {
    fontSize: 14,
    color: '#FFF',
    fontFamily: 'Nunito-Regular',
    marginRight: 5,
  },
  scoreValue: {
    fontSize: 18,
    color: '#FFF',
    fontFamily: 'Nunito-Bold',
  },
  streakContainer: {
    width: 60,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  questionContainer: {
    flex: 1,
  },
  resultContainer: {
    marginTop: 30,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 10,
  },
  resultText: {
    fontSize: 28,
    fontFamily: 'Nunito-Bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  correctText: {
    color: '#4CAF50',
  },
  incorrectText: {
    color: '#F44336',
  },
  correctAnswerText: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'Nunito-Bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  explanationText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Nunito-Regular',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  nextButton: {
    backgroundColor: '#FF9F1C',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 10,
  },
  nextButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    marginRight: 10,
  },
});

export default QuizScreen;