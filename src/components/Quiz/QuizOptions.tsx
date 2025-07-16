import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import theme from '../../styles/theme';

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
  const getOptionLabel = (index: number): string => {
    return ['A', 'B', 'C', 'D'][index];
  };

  const getOptionStyle = (option: string, index: number) => {
    const baseStyle = [styles.optionButton];
    
    if (selectedAnswer === option) {
      if (showResult) {
        if (option === correctAnswer) {
          baseStyle.push(styles.correctOption);
        } else {
          baseStyle.push(styles.incorrectOption);
        }
      } else {
        baseStyle.push(styles.selectedOption);
      }
    } else if (showResult && option === correctAnswer) {
      baseStyle.push(styles.correctOption);
    }
    
    return baseStyle;
  };

  return (
    <View style={styles.container}>
      {options.map((option, index) => (
        <TouchableOpacity
          key={index}
          style={getOptionStyle(option, index)}
          onPress={() => onSelectAnswer(option)}
          disabled={showResult}
          activeOpacity={0.7}
        >
          <View style={styles.optionContent}>
            <View style={styles.optionLabel}>
              <Text style={styles.optionLabelText}>{getOptionLabel(index)}</Text>
            </View>
            <Text style={styles.optionText}>{option}</Text>
            <Icon name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  optionButton: {
    backgroundColor: theme.colors.optionDefault,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  selectedOption: {
    backgroundColor: theme.colors.optionSelected,
    borderWidth: 2,
    borderColor: theme.colors.info,
  },
  correctOption: {
    backgroundColor: theme.colors.optionCorrect,
    borderWidth: 2,
    borderColor: theme.colors.success,
  },
  incorrectOption: {
    backgroundColor: theme.colors.optionIncorrect,
    borderWidth: 2,
    borderColor: theme.colors.error,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionLabel: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.gray[300],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  optionLabelText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.fonts.primaryBold,
    color: theme.colors.textSecondary,
  },
  optionText: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.fonts.primary,
    color: theme.colors.textPrimary,
    marginRight: theme.spacing.sm,
  },
});

export default QuizOptions; 