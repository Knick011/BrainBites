import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface QuizOptionsProps {
  selectedDifficulty?: 'easy' | 'medium' | 'hard';
  selectedCategory?: string;
  onDifficultyChange?: (difficulty: 'easy' | 'medium' | 'hard') => void;
  onCategoryChange?: (category: string) => void;
}

const QuizOptions: React.FC<QuizOptionsProps> = ({
  selectedDifficulty = 'medium',
  selectedCategory,
  onDifficultyChange,
  onCategoryChange,
}) => {
  const difficulties = [
    { key: 'easy', label: 'Easy', icon: 'leaf' },
    { key: 'medium', label: 'Medium', icon: 'fitness' },
    { key: 'hard', label: 'Hard', icon: 'flame' },
  ];

  const categories = [
    'General Knowledge',
    'Science',
    'History',
    'Geography',
    'Literature',
    'Sports',
    'Entertainment',
  ];

  return (
    <View style={styles.container}>
      {/* Difficulty Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Difficulty</Text>
        <View style={styles.optionsContainer}>
          {difficulties.map((difficulty) => (
            <TouchableOpacity
              key={difficulty.key}
              style={[
                styles.optionButton,
                selectedDifficulty === difficulty.key && styles.selectedOption,
              ]}
              onPress={() => onDifficultyChange?.(difficulty.key as 'easy' | 'medium' | 'hard')}
            >
              <Icon 
                name={difficulty.icon} 
                size={20} 
                color={selectedDifficulty === difficulty.key ? '#FFF' : '#666'} 
              />
              <Text style={[
                styles.optionText,
                selectedDifficulty === difficulty.key && styles.selectedOptionText,
              ]}>
                {difficulty.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Category Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Category</Text>
        <View style={styles.optionsContainer}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.optionButton,
                selectedCategory === category && styles.selectedOption,
              ]}
              onPress={() => onCategoryChange?.(category)}
            >
              <Text style={[
                styles.optionText,
                selectedCategory === category && styles.selectedOptionText,
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 6,
  },
  selectedOption: {
    backgroundColor: '#FF9F1C',
    borderColor: '#FF9F1C',
  },
  optionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  selectedOptionText: {
    color: '#FFF',
  },
});

export default QuizOptions; 