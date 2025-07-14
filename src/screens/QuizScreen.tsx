import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { RootStackParamList } from '../../App';
import { QuestionService } from '../services/QuestionService';
import { SoundService } from '../services/SoundService';
import { useQuizStore } from '../store/useQuizStore';
import { useUserStore } from '../store/useUserStore';
import { useTimerStore } from '../store/useTimerStore';
import QuizQuestion from '../components/Quiz/QuizQuestion';
import QuizOptions from '../components/Quiz/QuizOptions';
import StreakIndicator from '../components/Quiz/StreakIndicator';
import AnimatedBackground from '../components/common/AnimatedBackground';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type NavigationProp = StackNavigationProp<RootStackParamList, 'Quiz'>;
type QuizRouteProp = RouteProp<RootStackParamList, 'Quiz'>;

const QuizScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<QuizRouteProp>();
  const { category, difficulty } = route.params;

  const quizStore = useQuizStore();
  const userStore = useUserStore();
  const timerStore = useTimerStore();

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const streakScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadQuestion();
    startQuestionTimer();
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

  const loadQuestion = async () => {
    const question = await QuestionService.getRandomQuestion(category, difficulty);
    if (question) {
      quizStore.setCurrentQuestion(question);
      animateQuestionIn();
      setQuestionStartTime(Date.now());
    }
  };

  const startQuestionTimer = () => {
    const interval = setInterval(() => {
      setTimeSpent(Date.now() - questionStartTime);
    }, 100);
    return () => clearInterval(interval);
  };

  const animateQuestionIn = () => {
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
    const correct = answer === quizStore.currentQuestion?.correctAnswer;
    setIsCorrect(correct);
    setShowResult(true);

    // Update stores
    quizStore.setLastAnswerCorrect(correct);
    
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
    
    if (newStreak === 3) {
      SoundService.playStreakSound(newStreak);
    } else if (newStreak % 5 === 0) {
      SoundService.playLevelUp();
    }

    // Update user stats
    userStore.incrementScore(totalPoints);
    userStore.recordAnswer(true, category || 'general', difficulty || 'medium');
    
    // Add time reward for correct answer
    if (difficulty === 'easy') {
      timerStore.addTime(1);
    } else if (difficulty === 'medium') {
      timerStore.addTime(2);
    } else {
      timerStore.addTime(3);
    }

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
    
    if (quizStore.currentStreak > 0) {
      SoundService.playStreakBreak();
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
      loadQuestion();
    });
  };

  const handleExit = () => {
    SoundService.playButtonClick();
    navigation.goBack();
  };

  if (!quizStore.currentQuestion) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading question...</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#FFE4B5', '#FFD700', '#FFA500']}
      style={styles.container}
    >
      <AnimatedBackground />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={handleExit} style={styles.exitButton}>
          <Icon name="close" size={30} color="#FFF" />
        </TouchableOpacity>
        
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>Score</Text>
          <Text style={styles.scoreValue}>{userStore.stats.totalScore}</Text>
        </View>
        
        <Animated.View
          style={[
            styles.streakContainer,
            {
              transform: [{ scale: streakScale }],
            },
          ]}
        >
          <StreakIndicator streak={quizStore.currentStreak} />
        </Animated.View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Animated.View
          style={[
            styles.questionContainer,
            {
              opacity: fadeAnim,
              transform: [
                { translateX: slideAnim },
                { scale: scaleAnim },
              ],
            },
          ]}
        >
          <QuizQuestion
            question={quizStore.currentQuestion}
            questionNumber={quizStore.questionsAnswered + 1}
          />
          
          <QuizOptions
            options={[
              quizStore.currentQuestion.optionA,
              quizStore.currentQuestion.optionB,
              quizStore.currentQuestion.optionC,
              quizStore.currentQuestion.optionD,
            ]}
            selectedAnswer={selectedAnswer}
            correctAnswer={quizStore.currentQuestion.correctAnswer}
            showResult={showResult}
            onSelectAnswer={handleAnswerSelect}
          />
          
          {showResult && (
            <View style={styles.resultContainer}>
              <Text style={[styles.resultText, isCorrect ? styles.correctText : styles.incorrectText]}>
                {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
              </Text>
              
              {!isCorrect && (
                <Text style={styles.correctAnswerText}>
                  Correct answer: {quizStore.currentQuestion.correctAnswer}
                </Text>
              )}
              
              <TouchableOpacity
                style={styles.nextButton}
                onPress={handleNextQuestion}
              >
                <Text style={styles.nextButtonText}>Next Question</Text>
                <Icon name="arrow-forward" size={20} color="#FFF" />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFA500',
  },
  loadingText: {
    fontSize: 18,
    color: '#FFF',
    fontFamily: 'Nunito-Bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  exitButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#FFF',
    fontFamily: 'Nunito-Regular',
  },
  scoreValue: {
    fontSize: 24,
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
  },
  resultText: {
    fontSize: 28,
    fontFamily: 'Nunito-Bold',
    marginBottom: 10,
  },
  correctText: {
    color: '#4CAF50',
  },
  incorrectText: {
    color: '#F44336',
  },
  correctAnswerText: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Nunito-Regular',
    marginBottom: 20,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFA500',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  nextButtonText: {
    fontSize: 18,
    color: '#FFF',
    fontFamily: 'Nunito-Bold',
    marginRight: 10,
  },
});

export default QuizScreen;