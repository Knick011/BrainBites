import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Question } from '../../services/QuestionService';
import theme from '../../styles/theme';

interface QuizQuestionProps {
  question: Question | null;
  questionNumber: number;
}

export const QuizQuestion: React.FC<QuizQuestionProps> = ({ question, questionNumber }) => {
  if (!question) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.questionNumber}>Question {questionNumber}</Text>
      <Text style={styles.questionText}>{question.question}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.md,
  },
  questionNumber: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.fonts.primary,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  questionText: {
    fontSize: theme.typography.fontSize['2xl'],
    fontFamily: theme.fonts.primaryBold,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    lineHeight: theme.typography.fontSize['2xl'] * 1.3,
  },
});