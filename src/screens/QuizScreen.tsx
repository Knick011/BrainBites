// src/screens/QuizScreen.tsx - Updated with AdMob and question tracking
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ActivityIndicator,
  Animated,
  Easing,
  ScrollView,
  StatusBar,
  Platform,
  BackHandler
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, Question } from '../types';
import QuestionService from '../services/QuestionService';
import EnhancedTimerService from '../services/EnhancedTimerService';
import SoundService from '../services/SoundService';
import EnhancedScoreService from '../services/EnhancedScoreService';
import EnhancedMascotDisplay from '../components/Mascot/EnhancedMascotDisplay';
import AdMobService from '../services/AdMobService';
import BannerAdComponent from '../components/BannerAdComponent';
import theme from '../styles/theme';

type QuizScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Quiz'>;
type QuizScreenRouteProp = RouteProp<RootStackParamList, 'Quiz'>;
type MascotType = 'happy' | 'sad' | 'excited' | 'depressed' | 'gamemode' | 'below';

interface QuizScreenState {
  currentQuestion: Question | null;
  selectedAnswer: string | null;
  isCorrect: boolean | null;
  isLoading: boolean;
  showExplanation: boolean;
  streak: number;
  questionsAnswered: number;
  correctAnswers: number;
  showPointsAnimation: boolean;
  pointsEarned: number;
  score: number;
  streakLevel: number;
  isStreakMilestone: boolean;
}

const QuizScreen: React.FC = () => {
  const navigation = useNavigation<QuizScreenNavigationProp>();
  const route = useRoute<QuizScreenRouteProp>();
  
  const [state, setState] = useState<QuizScreenState>({
    currentQuestion: null,
    selectedAnswer: null,
    isCorrect: null,
    isLoading: true,
    showExplanation: false,
    streak: 0,
    questionsAnswered: 0,
    correctAnswers: 0,
    showPointsAnimation: false,
    pointsEarned: 0,
    score: 0,
    streakLevel: 0,
    isStreakMilestone: false,
  });
  
  const { category, difficulty } = route.params || {};
  const [autoAdvanceTimer, setAutoAdvanceTimer] = useState<NodeJS.Timeout | null>(null);
  
  // Mascot state
  const [mascotType, setMascotType] = useState<MascotType>('happy');
  const [mascotMessage, setMascotMessage] = useState('');
  const [showMascot, setShowMascot] = useState(false);
  
  // Animation values
  const cardAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const optionsAnim = useRef<Animated.Value[]>([]).current;
  const explanationAnim = useRef(new Animated.Value(0)).current;
  const streakAnim = useRef(new Animated.Value(1)).current;
  const pointsAnim = useRef(new Animated.Value(0)).current;
  const timerAnim = useRef(new Animated.Value(1)).current;
  
  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const timerAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const questionStartTime = useRef<number>(0);
  
  useEffect(() => {
    // Initialize services
    const initializeQuiz = async () => {
      // Questions are now loaded synchronously in constructor, so we can load a question immediately
      loadQuestion();
      
      // Initialize for answered questions history and other services
      await QuestionService.initialize();
      SoundService.startGameMusic();
      
      await EnhancedScoreService.loadSavedData();
      const scoreInfo = EnhancedScoreService.getScoreInfo();
      setState(prev => ({
        ...prev,
        streak: scoreInfo.currentStreak,
        score: scoreInfo.dailyScore ?? 0,
        streakLevel: scoreInfo.streakLevel,
      }));
    };
    
    initializeQuiz();
    
    // Handle back button press
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    
    return () => {
      backHandler.remove();
      SoundService.stopMusic();
      
      if (timerRef.current) clearTimeout(timerRef.current);
      if (timerAnimation.current) timerAnimation.current.stop();
      if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer);
    };
  }, []);

  const handleBackPress = (): boolean => {
    EnhancedScoreService.endQuizSession();
    
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Home');
    }
    return true;
  };

  const loadQuestion = async () => {
    setState(prev => ({ ...prev, isLoading: true, selectedAnswer: null, isCorrect: null, 
      showExplanation: false, showPointsAnimation: false, isStreakMilestone: false }));
    setShowMascot(false);
    
    if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer);
    
    // Reset animations
    cardAnim.setValue(0);
    fadeAnim.setValue(0);
    explanationAnim.setValue(0);
    timerAnim.setValue(1);
    
    try {
      const question = QuestionService.getRandomQuestion(category, difficulty);
      setState(prev => ({
        ...prev,
        currentQuestion: question,
        questionsAnswered: prev.questionsAnswered + 1,
        isLoading: false,
      }));
      
      SoundService.playButtonPress();
      
      // Create animation values for options
      const numOptions = 4; // A, B, C, D
      for (let i = 0; i < numOptions; i++) {
        if (!optionsAnim[i]) {
          optionsAnim[i] = new Animated.Value(0);
        }
      }
      
      // Start animations
      animateQuestionEntrance();
      startTimerAnimation();
      
      questionStartTime.current = Date.now();
      EnhancedScoreService.startQuestionTimer();
      
    } catch (error) {
      console.error('Error loading question:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      setMascotType('sad');
      setMascotMessage('No more questions available! Great job completing all questions!');
      setShowMascot(true);
    }
  };

  const animateQuestionEntrance = () => {
    Animated.parallel([
      Animated.timing(cardAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.5)),
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      ...optionsAnim.map((anim, index) => 
        Animated.sequence([
          Animated.delay(400 + (index * 100)),
          Animated.spring(anim, {
            toValue: 1,
            friction: 7,
            tension: 40,
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();
  };

  const startTimerAnimation = () => {
    timerAnimation.current = Animated.timing(timerAnim, {
      toValue: 0,
      duration: 20000,
      useNativeDriver: false,
      easing: Easing.linear,
    });
    
    timerAnimation.current.start();
    
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (state.selectedAnswer === null) handleTimeUp();
    }, 20000);
  };
  
  const handleTimeUp = () => {
    if (state.selectedAnswer !== null) return;
    
    setState(prev => ({ ...prev, selectedAnswer: 'TIMEOUT', isCorrect: false }));
    
    setTimeout(() => {
      setState(prev => ({ ...prev, showExplanation: true }));
      showExplanationWithAnimation();
    }, 500);
    
    if (state.currentQuestion) {
      EnhancedScoreService.recordAnswer(false, { 
        startTime: questionStartTime.current, 
        category 
      });
      QuestionService.recordAnswer(state.currentQuestion.id, false);
    }
    
    setState(prev => ({ ...prev, streak: 0 }));
    SoundService.playIncorrect();
    
    setMascotType('sad');
    setMascotMessage("Time's up! ⏰\nDon't worry, you'll get the next one!");
    setShowMascot(true);
    
    setAutoAdvanceTimer(setTimeout(() => {
      handleContinue();
    }, 2000));
  };

  const handleAnswerSelect = async (option: string) => {
    if (state.selectedAnswer !== null || !state.currentQuestion) return;
    
    if (timerAnimation.current) timerAnimation.current.stop();
    if (timerRef.current) clearTimeout(timerRef.current);
    
    const correct = option === state.currentQuestion.correctAnswer;
    setState(prev => ({ ...prev, selectedAnswer: option, isCorrect: correct }));
    
    await QuestionService.recordAnswer(state.currentQuestion.id, correct);
    
    // Calculate time reward
    let timeReward = 60; // 1 minute default
    if (state.currentQuestion.level === 'medium') timeReward = 120; // 2 minutes
    if (state.currentQuestion.level === 'hard') timeReward = 180; // 3 minutes
    
    const scoreResult = EnhancedScoreService.recordAnswer(correct, { 
      startTime: questionStartTime.current,
      category: category,
    });
    
    if (correct) {
      EnhancedTimerService.addTimeCredits(timeReward);
      
      setState(prev => ({
        ...prev,
        pointsEarned: scoreResult.pointsEarned,
        showPointsAnimation: true,
        streak: scoreResult.newStreak,
        score: scoreResult.newScore,
        streakLevel: scoreResult.streakLevel,
        correctAnswers: prev.correctAnswers + 1,
        isStreakMilestone: scoreResult.isMilestone,
      }));
      
      animatePoints();

      if (scoreResult.isMilestone) {
        setMascotType('gamemode');
        setMascotMessage(`🔥 ${scoreResult.newStreak} question streak! 🔥\n+120 seconds bonus!`);
        setShowMascot(true);
        SoundService.playStreak();
        EnhancedTimerService.addTimeCredits(120);
      } else {
        SoundService.playCorrect();
      }
      
      setTimeout(() => {
        setState(prev => ({ ...prev, showExplanation: true }));
        showExplanationWithAnimation();
      }, 800);
      
      setAutoAdvanceTimer(setTimeout(() => {
        handleContinue();
      }, 2000));
    } else {
      setState(prev => ({ ...prev, streak: 0 }));
      SoundService.playIncorrect();
      
      setTimeout(() => {
        showMascotForWrongAnswer();
      }, 500);
      
      setTimeout(() => {
        setState(prev => ({ ...prev, showExplanation: true }));
        showExplanationWithAnimation();
      }, 1500);
      
      setAutoAdvanceTimer(setTimeout(() => {
        handleContinue();
      }, 2000));
    }
    
    const updatedScoreInfo = EnhancedScoreService.getScoreInfo();
    setState(prev => ({
      ...prev,
      score: updatedScoreInfo.dailyScore ?? 0,
      streak: updatedScoreInfo.currentStreak,
      streakLevel: updatedScoreInfo.streakLevel,
    }));
  };

  const animatePoints = () => {
    pointsAnim.setValue(0);
    Animated.spring(pointsAnim, {
      toValue: 1,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };
  
  const showExplanationWithAnimation = () => {
    Animated.timing(explanationAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start();
  };
  
  const showMascotForWrongAnswer = () => {
    if (!state.currentQuestion) return;
    setMascotType('sad');
    setMascotMessage(`Not quite right. The answer was ${state.currentQuestion.correctAnswer}.`);
    setShowMascot(true);
  };
  
  const handlePeekingMascotPress = () => {
    if (!state.currentQuestion) return;
    
    if (state.selectedAnswer && state.showExplanation) {
      if (state.isCorrect) {
        setMascotType('happy');
        setMascotMessage(`Great job! Here's why this is correct:\n\n${state.currentQuestion.explanation}\n\nKeep up the excellent work! 🌟`);
      } else {
        setMascotType('happy');
        setMascotMessage(`Let me explain why the answer was ${state.currentQuestion.correctAnswer}:\n\n${state.currentQuestion.explanation}\n\nDon't worry, you'll get the next one! 💪`);
      }
      setShowMascot(true);
    } else if (!state.selectedAnswer) {
      setMascotType('happy');
      setMascotMessage('Take your time and think carefully! 🤔\n\nYou\'ve got this! 💪');
      setShowMascot(true);
    }
  };
  
  const handleMascotDismiss = () => {
    setShowMascot(false);
  };
  
  const handleContinue = () => {
    if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer);
    SoundService.playButtonPress();
    setShowMascot(false);
    setTimeout(() => loadQuestion(), 100);
  };
  
  const handleGoBack = () => {
    handleBackPress();
  };
  
  const getAccuracy = () => {
    if (state.questionsAnswered === 0) return 0;
    return Math.round((state.correctAnswers / state.questionsAnswered) * 100);
  };
  
  const getStreakProgress = () => {
    if (state.streak === 0) return 0;
    return (state.streak % 5) / 5;
  };

  const getOptions = () => {
    if (!state.currentQuestion) return [];
    return [
      { key: 'A', value: state.currentQuestion.optionA },
      { key: 'B', value: state.currentQuestion.optionB },
      { key: 'C', value: state.currentQuestion.optionC },
      { key: 'D', value: state.currentQuestion.optionD },
    ];
  };

  if (state.isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor="#FFF8E7" barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF9F1C" />
          <Text style={styles.loadingText}>Loading question...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#FFF8E7" barStyle="dark-content" />
      <ScrollView 
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with stats */}
        <Animated.View 
          style={[
            styles.header,
            { opacity: fadeAnim }
          ]}
        >
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          
          <View style={styles.statsContainer}>
            <Icon name="check-circle-outline" size={18} color="#4CAF50" />
            <Text style={styles.statsText}>{state.correctAnswers}/{state.questionsAnswered}</Text>
            <Text style={styles.accuracyText}>({getAccuracy()}%)</Text>
          </View>
          
          <View style={styles.scoreContainer}>
            <Icon name="star" size={18} color="#FF9F1C" />
            <Text style={styles.scoreText}>{state.score}</Text>
          </View>
          
          <Animated.View 
            style={[
              styles.streakContainer,
              {
                transform: [{ scale: streakAnim }],
                backgroundColor: state.isStreakMilestone ? '#FF9F1C' : 'white',
              }
            ]}
          >
            <Icon 
              name="fire" 
              size={16} 
              color={state.isStreakMilestone ? 'white' : (state.streak > 0 ? '#FF9F1C' : '#ccc')} 
            />
            <Text 
              style={[
                styles.streakText,
                state.isStreakMilestone && { color: 'white' }
              ]}
            >
              {state.streak}
            </Text>
          </Animated.View>
        </Animated.View>
        
        {/* Category and difficulty indicator */}
        <Animated.View 
          style={[
            styles.categoryContainer,
            { opacity: fadeAnim }
          ]}
        >
          <Text style={styles.categoryText}>
            {category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Mixed'}
            {state.currentQuestion?.level && ` • ${state.currentQuestion.level.charAt(0).toUpperCase() + state.currentQuestion.level.slice(1)}`}
          </Text>
        </Animated.View>
        
        {/* Streak progress bar */}
        {state.streak > 0 && (
          <Animated.View 
            style={[
              styles.streakProgressContainer,
              { opacity: fadeAnim }
            ]}
          >
            <View style={styles.streakProgressBar}>
              <Animated.View 
                style={[
                  styles.streakProgressFill,
                  {
                    width: `${getStreakProgress() * 100}%`,
                    backgroundColor: state.isStreakMilestone ? '#FF9F1C' : '#FF9F1C'
                  }
                ]}
              />
            </View>
            <Text style={styles.streakProgressText}>
              {state.isStreakMilestone ? 'Streak Milestone!' : `Next milestone: ${Math.ceil(state.streak/5)*5}`}
            </Text>
          </Animated.View>
        )}
        
        {/* Timer bar */}
        <Animated.View 
          style={[
            styles.timerContainer,
            { opacity: fadeAnim }
          ]}
        >
          <View style={styles.timerBar}>
            <Animated.View 
              style={[
                styles.timerFill,
                {
                  width: timerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%']
                  }),
                  backgroundColor: timerAnim.interpolate({
                    inputRange: [0, 0.3, 0.7, 1],
                    outputRange: ['#ef4444', '#facc15', '#22c55e', '#22c55e']
                  })
                }
              ]}
            />
          </View>
          <View style={styles.timerIconContainer}>
            <Icon name="timer-outline" size={18} color="#777" />
          </View>
        </Animated.View>
        
        {/* Question card */}
        <Animated.View 
          style={[
            styles.questionSection,
            {
              opacity: cardAnim,
              transform: [
                { 
                  translateY: cardAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0]
                  })
                },
                { 
                  scale: cardAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.95, 1]
                  })
                }
              ]
            }
          ]}
        >
          {/* Question text with floating design */}
          <View style={styles.questionTextContainer}>
            <Text style={styles.questionText}>{state.currentQuestion?.question}</Text>
          </View>
          
          <View style={styles.optionsContainer}>
            {getOptions().map((option, index) => (
              <Animated.View
                key={option.key}
                style={{
                  opacity: optionsAnim[index] || fadeAnim,
                  transform: [
                    { 
                      translateY: (optionsAnim[index] || fadeAnim).interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0]
                      })
                    }
                  ]
                }}
              >
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    state.selectedAnswer === option.key && (
                      option.key === state.currentQuestion?.correctAnswer ? styles.correctOption : styles.incorrectOption
                    ),
                    state.selectedAnswer === null && styles.hoverableOption
                  ]}
                  onPress={() => handleAnswerSelect(option.key)}
                  disabled={state.selectedAnswer !== null}
                  activeOpacity={0.8}
                >
                  <View style={[
                    styles.optionKeyContainer,
                    state.selectedAnswer === option.key && option.key === state.currentQuestion?.correctAnswer && styles.correctKeyContainer,
                    state.selectedAnswer === option.key && option.key !== state.currentQuestion?.correctAnswer && styles.incorrectKeyContainer
                  ]}>
                    <Text style={[
                      styles.optionKey,
                      state.selectedAnswer === option.key && styles.selectedOptionKeyText
                    ]}>{option.key}</Text>
                  </View>
                  
                  <Text style={styles.optionText}>{option.value}</Text>
                  
                  {/* Result icons */}
                  {state.selectedAnswer === option.key && option.key === state.currentQuestion?.correctAnswer && (
                    <View style={styles.resultIconContainer}>
                      <Icon name="check-circle" size={24} color="#4CAF50" style={styles.resultIcon} />
                    </View>
                  )}
                  
                  {state.selectedAnswer === option.key && option.key !== state.currentQuestion?.correctAnswer && (
                    <View style={styles.resultIconContainer}>
                      <Icon name="close-circle" size={24} color="#F44336" style={styles.resultIcon} />
                    </View>
                  )}
                  
                  {state.selectedAnswer !== option.key && state.selectedAnswer !== null && option.key === state.currentQuestion?.correctAnswer && (
                    <View style={styles.resultIconContainer}>
                      <Icon name="check-circle-outline" size={24} color="#4CAF50" style={styles.resultIcon} />
                    </View>
                  )}
                  
                  {state.selectedAnswer === null && (
                    <Icon name="chevron-right" size={20} color="#ccc" style={styles.optionArrow} />
                  )}
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </Animated.View>
        
        {/* Points animation popup */}
        {state.showPointsAnimation && (
          <Animated.View 
            style={[
              styles.pointsAnimationContainer,
              {
                opacity: pointsAnim,
                transform: [
                  { 
                    translateY: pointsAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -30]
                    })
                  },
                  { 
                    scale: pointsAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0.8, 1.2, 1]
                    })
                  }
                ]
              }
            ]}
          >
            <Icon name="star" size={20} color="#FFD700" style={styles.pointsIcon} />
            <Text style={styles.pointsText}>+{state.pointsEarned}</Text>
          </Animated.View>
        )}
        
        {/* AdMob Banner Ad */}
        <View style={styles.adContainer}>
          <BannerAdComponent />
        </View>
      </ScrollView>
      
      {/* Enhanced Mascot */}
      <EnhancedMascotDisplay
        type={mascotType}
        position="left"
        showMascot={showMascot}
        message={mascotMessage}
        onDismiss={handleMascotDismiss}
        onMessageComplete={handleMascotDismiss}
        autoHide={false}
        fullScreen={true}
        onPeekingPress={handlePeekingMascotPress}
        isQuizScreen={true}
        currentQuestion={state.currentQuestion}
        selectedAnswer={state.selectedAnswer}
        showExplanation={state.showExplanation}
        isCorrect={state.isCorrect}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF8E7',
  },
  container: {
    padding: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    color: '#777',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif-medium',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statsText: {
    marginLeft: 6,
    fontWeight: '600',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif-medium',
    color: '#333',
  },
  accuracyText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#666',
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  scoreText: {
    marginLeft: 6,
    fontWeight: '600',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif-medium',
    color: '#333',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  streakText: {
    marginLeft: 6,
    fontWeight: '600',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif-medium',
    color: '#333',
  },
  categoryContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#FF9F1C',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif-medium',
  },
  streakProgressContainer: {
    marginBottom: 16,
  },
  streakProgressBar: {
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  streakProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  streakProgressText: {
    marginTop: 4,
    fontSize: 12,
    color: '#777',
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
    textAlign: 'right',
  },
  questionSection: {
    marginBottom: 24,
  },
  questionTextContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  questionText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    lineHeight: 28,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif-medium',
  },
  optionsContainer: {
    marginTop: 8,
  },
  optionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 18,
    borderRadius: 18,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  optionKeyContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionKey: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif-medium',
  },
  optionText: {
    fontSize: 16,
    flex: 1,
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif',
  },
  resultIcon: {
    marginLeft: 12,
  },
  correctOption: {
    backgroundColor: 'rgba(76, 175, 80, 0.12)',
    borderColor: '#4CAF50',
    borderWidth: 2,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
    transform: [{ scale: 1.02 }],
  },
  incorrectOption: {
    backgroundColor: 'rgba(244, 67, 54, 0.12)',
    borderColor: '#F44336',
    borderWidth: 2,
    shadowColor: '#F44336',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
    transform: [{ scale: 1.02 }],
  },
  pointsAnimationContainer: {
    position: 'absolute',
    top: '30%', 
    right: '15%',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  pointsIcon: {
    marginRight: 6,
  },
  pointsText: {
    color: '#FF9F1C',
    fontWeight: 'bold',
    fontSize: 20,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Black' : 'sans-serif-black',
  },
  hoverableOption: {
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  correctKeyContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  incorrectKeyContainer: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
  },
  selectedOptionKeyText: {
    color: 'white',
  },
  resultIconContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 2,
  },
  optionArrow: {
    position: 'absolute',
    right: 16,
  },
  timerContainer: {
    marginBottom: 20,
    position: 'relative',
  },
  timerBar: {
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  timerFill: {
    height: '100%',
    borderRadius: 4,
  },
  timerIconContainer: {
    position: 'absolute',
    right: -8,
    top: -8,
    backgroundColor: 'white',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  adContainer: {
    marginTop: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
});

export default QuizScreen;