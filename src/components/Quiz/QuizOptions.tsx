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
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  optionButton: {
    width: '48%',
    marginVertical: 8,
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
  option: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  selectedOption: {
    backgroundColor: '#FF9F1C',
  },
  correctOption: {
    backgroundColor: '#4CAF50',
  },
  incorrectOption: {
    backgroundColor: '#F44336',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    fontFamily: 'Nunito-Bold',
    lineHeight: 20,
  },
});

export default QuizOptions; 