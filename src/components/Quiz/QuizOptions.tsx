import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface QuizOptionsProps {
  options: string[];
  selectedAnswer: string | null;
  correctAnswer: string;
  showResult: boolean;
  onSelectAnswer: (answer: string) => void;
}

const QuizOptions: React.FC<QuizOptionsProps> = ({
  options,
  selectedAnswer,
  correctAnswer,
  showResult,
  onSelectAnswer,
}) => {
  const getOptionStyle = (option: string) => {
    if (!showResult) {
      return selectedAnswer === option ? styles.selectedOption : styles.option;
    }

    if (option === correctAnswer) {
      return styles.correctOption;
    }

    if (selectedAnswer === option && option !== correctAnswer) {
      return styles.incorrectOption;
    }

    return styles.option;
  };

  return (
    <View style={styles.container}>
      {options.map((option, index) => (
        <TouchableOpacity
          key={index}
          style={[styles.optionButton, getOptionStyle(option)]}
          onPress={() => onSelectAnswer(option)}
          disabled={showResult}
        >
          <Text style={styles.optionText}>{option}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  optionButton: {
    marginVertical: 8,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  option: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  selectedOption: {
    backgroundColor: '#C8B3FF',
  },
  correctOption: {
    backgroundColor: '#98E4A6',
  },
  incorrectOption: {
    backgroundColor: '#FFB3B3',
  },
  optionText: {
    fontSize: 16,
    color: '#4A4A4A',
    textAlign: 'center',
    fontFamily: 'Nunito-Regular',
  },
});

export default QuizOptions; 