import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { RootStackParamList } from '../../App';
import { QuestionService, Question } from '../services/QuestionService';
import { SoundService } from '../services/SoundService';
import { AnalyticsService } from '../services/AnalyticsService';
import { useQuizStore } from '../store/useQuizStore';
import { useUserStore } from '../store/useUserStore';
import { useTimerStore } from '../store/useTimerStore';
import Mascot from '../components/Mascot/Mascot';
import { QuizQuestion, QuizOptions, StreakIndicator } from '../components/Quiz';
import theme from '../styles/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type NavigationProp = StackNavigationProp<RootStackParamList, 'Quiz'>;
type QuizRouteProp = RouteProp<RootStackParamList, 'Quiz'>;

interface TimerDisplayProps {
  timeRemaining: number;
}

const TimerDisplay: React.FC<TimerDisplayProps> = ({ timeRemaining }) => {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(Math.abs(seconds) / 60);
    const remainingSeconds = Math.abs(seconds) % 60;
    const sign = seconds < 0 ? '-' : '';
    return `${sign}${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.timerContainer}>
      <Icon name="time-outline" size={20} color="#FFF" />
      <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
    </View>
  );
};

const QuizScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<QuizRouteProp>();
  const { category, difficulty = 'easy' } = route.params || {};

  const quizStore = useQuizStore();
  const userStore = useUserStore();
  const timerStore = useTimerStore();

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [isLoading, setIsLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [mascotMessage, setMascotMessage] = useState<string | null>(null);
  const [mascotType, setMascotType] = useState<'happy' | 'sad' | 'excited' | 'depressed' | 'gamemode' | 'peeking'>('gamemode');

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;

  useEffect(() => {
    initializeQuiz();
    
    // Switch to game music when entering quiz
    SoundService.playGameMusic();
    
    // Log quiz start
    AnalyticsService.logQuizStart(category || 'mixed', difficulty);
    
    return () => {
      // Switch back to menu music when leaving quiz
      SoundService.playMenuMusic();
    };
  }, [category, difficulty]);

  const initializeQuiz = async () => {
    try {
      console.log('🎮 Initializing quiz with params:', { category, difficulty });
      
      // Reset quiz state
      quizStore.resetQuiz();
      
      // Load first question
      await loadNextQuestion();
      
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
      
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to initialize quiz:', error);
      setIsLoading(false);
      Alert.alert('Error', 'Failed to load quiz. Please try again.');
    }
  };

  const loadNextQuestion = async () => {
    try {
      console.log('🔄 Loading question for category:', category, 'difficulty:', difficulty);
      
      const question = await QuestionService.getRandomQuestion(category, difficulty);
      
      if (!question) {
        throw new Error('No questions available');
      }
      
      setCurrentQuestion(question);
      setSelectedAnswer(null);
      setShowResult(false);
      setQuestionStartTime(Date.now());
      
      console.log('Selected question:', question.question);
      console.log('✅ Question loaded:', question.question);
      
      // Show mascot message for new question
      setMascotMessage("Let's see how you do with this one!");
      setMascotType('gamemode');
      
      // Hide mascot message after 3 seconds
      setTimeout(() => {
        setMascotMessage(null);
      }, 3000);
      
    } catch (error) {
      console.error('Failed to load question:', error);
      throw error;
    }
  };

  const handleAnswerSelect = (answer: string) => {
    if (selectedAnswer || showResult) return;

    SoundService.playButtonClick();
    setSelectedAnswer(answer);
    
    // Check if answer is correct
    const correct = answer === currentQuestion?.correctAnswer;
    setIsCorrect(correct);
    
    const responseTime = Date.now() - questionStartTime;
    
    console.log('Answer check:', {
      selected: answer,
      correct: currentQuestion?.correctAnswer,
      isCorrect: correct
    });
    
    // Log the answer
    AnalyticsService.logQuestionAnswered(
      correct, 
      category || 'mixed', 
      difficulty, 
      responseTime
    );
    
    // Update quiz state
    quizStore.setLastAnswerCorrect(correct);
    quizStore.incrementQuestionsAnswered();
    
    if (correct) {
      // Play success sound
      SoundService.playCorrect();
      
      // Update user stats
      userStore.incrementScore(10);
      
      // Add time reward (30 seconds for correct answer)
      timerStore.addTime(30);
      
      // Show success mascot
      setMascotType('happy');
      setMascotMessage('Great job! You got it right! 🎉');
      
      // Track time reward
      AnalyticsService.logTimeRewardEarned(0.5, 'correct_answer');
      
    } else {
      // Play failure sound
      SoundService.playIncorrect();
      
      // Show sad mascot
      setMascotType('sad');
      setMascotMessage('Oops! That\'s not quite right. Tap me to learn more!');
    }
    
    // Show result
    setShowResult(true);
    
    // Auto-advance to next question after 3 seconds
    setTimeout(() => {
      handleNextQuestion();
    }, 3000);
  };

  const handleNextQuestion = async () => {
    setMascotMessage(null);
    
    // Animate out current question
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
    ]).start(async () => {
      try {
        await loadNextQuestion();
        
        // Reset slide animation
        slideAnim.setValue(SCREEN_WIDTH);
        
        // Animate in new question
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      } catch (error) {
        console.error('Failed to load next question:', error);
        handleQuizEnd();
      }
    });
  };

  const handleQuizEnd = () => {
    // Log quiz completion
    AnalyticsService.logQuizComplete({
      category: category || 'mixed',
      difficulty,
      score: userStore.stats.totalScore,
      questionsAnswered: quizStore.questionsAnswered,
      correctAnswers: quizStore.currentStreak, // Use streak as correct answers for now
      duration: Date.now() - questionStartTime,
      streak: quizStore.currentStreak,
    });
    
    // Navigate back to home
    navigation.navigate('Home');
  };

  const handleExit = () => {
    Alert.alert(
      'Exit Quiz',
      'Are you sure you want to exit? Your progress will be saved.',
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

  const handleMascotPress = () => {
    if (mascotType === 'sad' && selectedAnswer && !isCorrect && currentQuestion) {
      // Show detailed explanation
      setMascotMessage(
        currentQuestion.explanation || 
        `The correct answer was ${currentQuestion.correctAnswer}. Keep learning!`
      );
      AnalyticsService.logMascotInteraction('explanation_request', 'quiz_wrong_answer');
    } else if (!selectedAnswer && currentQuestion) {
      // Show hint
      setMascotMessage("Take your time and think carefully about each option!");
      AnalyticsService.logMascotInteraction('hint_request', 'quiz_no_answer');
    }
  };

  if (isLoading) {
    return (
      <LinearGradient
        colors={['#FF9F1C', '#FFB84D', '#FFD07B']}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFF" />
            <Text style={styles.loadingText}>Loading Question...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#FF9F1C', '#FFB84D', '#FFD07B']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleExit} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>
                {category || 'Funfacts'}
              </Text>
            </View>
            
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '70%' }]} />
              </View>
              <TimerDisplay timeRemaining={timerStore.timeRemaining} />
            </View>
          </View>
          
          <View style={styles.scoreContainer}>
            <Icon name="star" size={20} color="#FFD700" />
            <Text style={styles.scoreText}>0</Text>
          </View>
        </View>

        {/* Question Container */}
        <Animated.View 
          style={[
            styles.questionContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          <QuizQuestion 
            question={currentQuestion} 
            questionNumber={quizStore.questionsAnswered + 1} 
          />
          
          <QuizOptions
            options={[
              currentQuestion?.optionA || '',
              currentQuestion?.optionB || '',
              currentQuestion?.optionC || '',
              currentQuestion?.optionD || '',
            ]}
            selectedAnswer={selectedAnswer}
            correctAnswer={currentQuestion?.correctAnswer || ''}
            showResult={showResult}
            onSelectAnswer={handleAnswerSelect}
          />
        </Animated.View>
        
        {/* Mascot */}
        <Mascot
          type={mascotType}
          position="left"
          showMascot={!!mascotMessage}
          message={mascotMessage}
          autoHide={true}
          autoHideDuration={5000}
          onDismiss={() => setMascotMessage(null)}
          fullScreen={true}
          isQuizScreen={true}
          currentQuestion={currentQuestion}
          selectedAnswer={selectedAnswer}
          isCorrect={isCorrect}
          onPeekingPress={handleMascotPress}
        />
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#FFF',
    fontFamily: 'Nunito-Bold',
    marginTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    height: 80,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  categoryBadge: {
    backgroundColor: '#FF9F1C',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 10,
  },
  categoryText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerText: {
    color: '#FFF',
    fontSize: 14,
    fontFamily: 'Nunito-Bold',
    marginLeft: 5,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  scoreText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    marginLeft: 5,
  },
  questionContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  questionCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 30,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  questionText: {
    fontSize: 24,
    fontFamily: 'Nunito-Bold',
    color: '#333',
    textAlign: 'center',
    lineHeight: 32,
  },
  optionsContainer: {
    flex: 1,
  },
  optionButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 15,
    marginBottom: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedOption: {
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  correctOption: {
    backgroundColor: '#E8F5E8',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  incorrectOption: {
    backgroundColor: '#FFEBEE',
    borderWidth: 2,
    borderColor: '#F44336',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionLabel: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DDD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  optionLabelText: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: '#666',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: '#333',
    marginRight: 10,
  },
});

export default QuizScreen;