// QuizQuestion.tsx
import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Question } from '../../services/QuestionService';

interface QuizQuestionProps {
  question: Question;
  questionNumber: number;
}

export const QuizQuestion: React.FC<QuizQuestionProps> = ({ question, questionNumber }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.questionNumber}>Question {questionNumber}</Text>
        <View style={[styles.difficultyBadge, styles[`${question.level}Badge`]]}>
          <Text style={styles.difficultyText}>{question.level.toUpperCase()}</Text>
        </View>
      </View>
      <View style={styles.questionCard}>
        <Text style={styles.questionText}>{question.question}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  questionNumber: {
    fontSize: 16,
    color: '#FFF',
    fontFamily: 'Nunito-Bold',
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  easyBadge: {
    backgroundColor: '#4CAF50',
  },
  mediumBadge: {
    backgroundColor: '#FFA500',
  },
  hardBadge: {
    backgroundColor: '#F44336',
  },
  difficultyText: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: 'bold',
    fontFamily: 'Nunito-Bold',
  },
  questionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  questionText: {
    fontSize: 18,
    color: '#333',
    lineHeight: 26,
    fontFamily: 'Nunito-Regular',
  },
});

// QuizOptions.tsx


interface QuizOptionsProps {
  options: string[];
  selectedAnswer: string | null;
  correctAnswer: string;
  showResult: boolean;
  onSelectAnswer: (answer: string) => void;
}

export const QuizOptions: React.FC<QuizOptionsProps> = ({
  options,
  selectedAnswer,
  correctAnswer,
  showResult,
  onSelectAnswer,
}) => {
  const animatedValues = useRef(options.map(() => new Animated.Value(0))).current;

  const animateOption = (index: number) => {
    Animated.sequence([
      Animated.timing(animatedValues[index], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValues[index], {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSelectOption = (option: string, index: number) => {
    if (!showResult) {
      animateOption(index);
      onSelectAnswer(option);
    }
  };

  const getOptionStyle = (option: string) => {
    if (!showResult) {
      return selectedAnswer === option ? styles.selectedOption : {};
    }

    if (option === correctAnswer) {
      return styles.correctOption;
    }
    if (option === selectedAnswer && option !== correctAnswer) {
      return styles.incorrectOption;
    }
    return styles.disabledOption;
  };

  const getOptionIcon = (option: string) => {
    if (!showResult) return null;

    if (option === correctAnswer) {
      return <Icon name="checkmark-circle" size={24} color="#4CAF50" />;
    }
    if (option === selectedAnswer && option !== correctAnswer) {
      return <Icon name="close-circle" size={24} color="#F44336" />;
    }
    return null;
  };

  return (
    <View style={styles.container}>
      {options.map((option, index) => (
        <Animated.View
          key={index}
          style={{
            transform: [
              {
                scale: animatedValues[index].interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0.95],
                }),
              },
            ],
          }}
        >
          <TouchableOpacity
            style={[styles.optionButton, getOptionStyle(option)]}
            onPress={() => handleSelectOption(option, index)}
            disabled={showResult}
          >
            <Text style={[styles.optionText, showResult && styles.resultText]}>
              {String.fromCharCode(65 + index)}. {option}
            </Text>
            {getOptionIcon(option)}
          </TouchableOpacity>
        </Animated.View>
      ))}
    </View>
  );
};

const optionStyles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  optionButton: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 18,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  selectedOption: {
    borderColor: '#FFA500',
    backgroundColor: '#FFF5E6',
  },
  correctOption: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  incorrectOption: {
    borderColor: '#F44336',
    backgroundColor: '#FFEBEE',
  },
  disabledOption: {
    opacity: 0.6,
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    fontFamily: 'Nunito-Regular',
  },
  resultText: {
    fontWeight: 'bold',
  },
});

// StreakIndicator.tsx

interface StreakIndicatorProps {
  streak: number;
}

export const StreakIndicator: React.FC<StreakIndicatorProps> = ({ streak }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (streak > 0) {
      // Animate when streak increases
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.3,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 3,
            tension: 40,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        rotateAnim.setValue(0);
      });
    }
  }, [streak]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (streak === 0) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { scale: scaleAnim },
            { rotate: spin },
          ],
        },
      ]}
    >
      <Icon name="flame" size={24} color="#FFF" />
      <Text style={styles.streakText}>{streak}</Text>
    </Animated.View>
  );
};

const streakStyles = StyleSheet.create({
  container: {
    backgroundColor: '#FF6347',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  streakText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    fontFamily: 'Nunito-Bold',
  },
});

export default QuizQuestion;