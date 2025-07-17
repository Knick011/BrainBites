import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';

import { RootStackParamList } from '../../App';
import QuizComponent from '../components/Quiz/QuizComponent';
import { QuestionService } from '../services/QuestionService';
import { AdMobService } from '../services/AdMobService';
import { logEvent } from '../config/Firebase';
import SoundService from '../services/SoundService';

type QuizScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Quiz'>;
type QuizScreenRouteProp = RouteProp<RootStackParamList, 'Quiz'>;

const QuizScreen: React.FC = () => {
  const navigation = useNavigation<QuizScreenNavigationProp>();
  const route = useRoute<QuizScreenRouteProp>();
  
  const [questions, setQuestions] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [showExitModal, setShowExitModal] = useState(false);
  
  const scaleAnim = new Animated.Value(0);

  const { category, difficulty = 'medium' } = route.params || {};

  useEffect(() => {
    loadQuestions();
    logEvent('quiz_started', { category, difficulty });
  }, []);

  const loadQuestions = () => {
    const quizQuestions = QuestionService.getQuestions(category, difficulty, 10);
    setQuestions(quizQuestions);
  };

  const handleQuizComplete = async (score: number, correct: number) => {
    setQuizScore(score);
    setCorrectAnswers(correct);
    setShowResults(true);

    // Log analytics
    logEvent('quiz_completed', {
      category,
      difficulty,
      score,
      correct_answers: correct,
      total_questions: questions.length,
      accuracy: Math.round((correct / questions.length) * 100),
    });

    // Animate results
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();

    // Show ad after quiz (50% chance)
    if (Math.random() < 0.5) {
      setTimeout(async () => {
        await AdMobService.showInterstitialAd();
      }, 2000);
    }
  };

  const handleBackPress = () => {
    if (showResults) {
      navigation.goBack();
    } else {
      setShowExitModal(true);
    }
  };

  const handleExitConfirm = () => {
    logEvent('quiz_abandoned', { category, difficulty });
    navigation.goBack();
  };

  const handleWatchAd = async () => {
    const result = await AdMobService.showRewardedAd();
    if (result.earned) {
      // Double the score as reward
      setQuizScore(quizScore * 2);
      SoundService.playStreak();
      logEvent('rewarded_ad_watched', { reward_type: 'double_score' });
    }
  };

  if (showResults) {
    const accuracy = Math.round((correctAnswers / questions.length) * 100);
    const getMessage = () => {
      if (accuracy === 100) return "Perfect! You're a genius! 🌟";
      if (accuracy >= 80) return "Excellent work! Keep it up! 🎉";
      if (accuracy >= 60) return "Good job! You're learning! 👍";
      if (accuracy >= 40) return "Nice try! Keep practicing! 💪";
      return "Don't give up! Every mistake is a lesson! 🌈";
    };

    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#E8F4FF', '#D4E9FF', '#C0DFFF']}
          style={styles.resultsGradient}
        >
          <Animated.View
            style={[
              styles.resultsCard,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <Icon
              name={accuracy >= 60 ? 'trophy' : 'ribbon'}
              size={80}
              color={accuracy >= 60 ? '#FFB800' : '#FF6B6B'}
            />
            
            <Text style={styles.resultsTitle}>Quiz Complete!</Text>
            <Text style={styles.resultsMessage}>{getMessage()}</Text>
            
            <View style={styles.statsContainer}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{quizScore}</Text>
                <Text style={styles.statLabel}>Points Earned</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{accuracy}%</Text>
                <Text style={styles.statLabel}>Accuracy</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{correctAnswers}/{questions.length}</Text>
                <Text style={styles.statLabel}>Correct</Text>
              </View>
            </View>

            {/* Watch Ad Button */}
            <TouchableOpacity
              style={styles.adButton}
              onPress={handleWatchAd}
              activeOpacity={0.8}
            >
              <Icon name="play-circle" size={24} color="#4CAF50" />
              <Text style={styles.adButtonText}>Watch Ad to Double Score</Text>
            </TouchableOpacity>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => navigation.goBack()}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryButtonText}>Home</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => {
                  setShowResults(false);
                  setQuizScore(0);
                  setCorrectAnswers(0);
                  scaleAnim.setValue(0);
                  loadQuestions();
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>Play Again</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBackPress}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Icon name="arrow-back" size={24} color="#4A4A4A" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>
          {category || 'Mixed'} - {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
        </Text>
        
        <View style={styles.placeholder} />
      </View>

      {/* Quiz Component */}
      {questions.length > 0 && (
        <QuizComponent
          questions={questions}
          category={category || 'Mixed'}
          difficulty={difficulty}
          onComplete={handleQuizComplete}
        />
      )}

      {/* Exit Confirmation Modal */}
      <Modal
        visible={showExitModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowExitModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Icon name="warning" size={48} color="#FF9F1C" />
            <Text style={styles.modalTitle}>Exit Quiz?</Text>
            <Text style={styles.modalText}>
              Your progress will be lost if you exit now.
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowExitModal(false)}
              >
                <Text style={styles.modalCancelText}>Continue Quiz</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleExitConfirm}
              >
                <Text style={styles.modalConfirmText}>Exit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Quicksand-Bold',
    color: '#4A4A4A',
  },
  placeholder: {
    width: 40,
  },
  resultsGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  resultsTitle: {
    fontSize: 28,
    fontFamily: 'Quicksand-Bold',
    color: '#4A4A4A',
    marginTop: 20,
    marginBottom: 10,
  },
  resultsMessage: {
    fontSize: 18,
    fontFamily: 'Nunito-Regular',
    color: '#6A6A6A',
    textAlign: 'center',
    marginBottom: 30,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 30,
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontFamily: 'Nunito-Bold',
    color: '#4A4A4A',
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#6A6A6A',
    marginTop: 5,
  },
  adButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 20,
  },
  adButtonText: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: '#4CAF50',
    marginLeft: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  primaryButton: {
    backgroundColor: '#FF9F1C',
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 25,
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: 'white',
  },
  secondaryButton: {
    backgroundColor: '#E0E0E0',
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 25,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: '#4A4A4A',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: '85%',
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: 'Quicksand-Bold',
    color: '#4A4A4A',
    marginTop: 15,
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: '#6A6A6A',
    textAlign: 'center',
    marginBottom: 25,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  modalCancelButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 20,
  },
  modalCancelText: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: 'white',
  },
  modalConfirmButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 20,
  },
  modalConfirmText: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: 'white',
  },
});

export default QuizScreen;