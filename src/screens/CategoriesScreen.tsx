import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';

import { RootStackParamList } from '../../App';
import { QuestionService, Category } from '../services/QuestionService';
import SoundService from '../services/SoundService';
import { logEvent } from '../config/Firebase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 50) / 2;

type CategoriesScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Categories'>;
type CategoriesScreenRouteProp = RouteProp<RootStackParamList, 'Categories'>;

const CategoriesScreen: React.FC = () => {
  const navigation = useNavigation<CategoriesScreenNavigationProp>();
  const route = useRoute<CategoriesScreenRouteProp>();
  
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>(
    route.params?.difficulty || 'medium'
  );
  
  const categories = QuestionService.getCategories();

  const handleCategoryPress = (category: Category) => {
    SoundService.playButtonPress();
    logEvent('category_selected', { 
      category: category.name, 
      difficulty: selectedDifficulty 
    });
    
    navigation.navigate('Quiz', {
      category: category.name,
      difficulty: selectedDifficulty,
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return '#4CAF50';
      case 'medium':
        return '#FF9800';
      case 'hard':
        return '#F44336';
      default:
        return '#FF9800';
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'flash-outline';
      case 'medium':
        return 'flash';
      case 'hard':
        return 'flash-sharp';
      default:
        return 'flash';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#FFE5D9', '#FFD7C9', '#FFC9B9']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Icon name="arrow-back" size={24} color="#4A4A4A" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Choose a Category</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      {/* Difficulty Selector */}
      <View style={styles.difficultyContainer}>
        <Text style={styles.difficultyTitle}>Select Difficulty:</Text>
        <View style={styles.difficultyButtons}>
          {(['easy', 'medium', 'hard'] as const).map((difficulty) => (
            <TouchableOpacity
              key={difficulty}
              style={[
                styles.difficultyButton,
                selectedDifficulty === difficulty && {
                  backgroundColor: getDifficultyColor(difficulty),
                },
              ]}
              onPress={() => {
                setSelectedDifficulty(difficulty);
                SoundService.playButtonPress();
              }}
              activeOpacity={0.8}
            >
              <Icon
                name={getDifficultyIcon(difficulty)}
                size={20}
                color={selectedDifficulty === difficulty ? 'white' : getDifficultyColor(difficulty)}
              />
              <Text
                style={[
                  styles.difficultyButtonText,
                  selectedDifficulty === difficulty && styles.difficultyButtonTextActive,
                ]}
              >
                {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Mixed Category Card */}
      <TouchableOpacity
        style={styles.mixedCard}
        onPress={() => {
          SoundService.playButtonPress();
          navigation.navigate('Quiz', { difficulty: selectedDifficulty });
        }}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#A8E6CF', '#7FCDCD']}
          style={styles.mixedGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.mixedIcon}>🎲</Text>
          <Text style={styles.mixedTitle}>Mixed Questions</Text>
          <Text style={styles.mixedDescription}>
            Challenge yourself with questions from all categories!
          </Text>
          <View style={styles.mixedBadge}>
            <Text style={styles.mixedBadgeText}>RECOMMENDED</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Category Grid */}
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.categoriesGrid}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={styles.categoryCard}
              onPress={() => handleCategoryPress(category)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.categoryIconContainer,
                  { backgroundColor: category.color + '20' },
                ]}
              >
                <Text style={styles.categoryIcon}>{category.icon}</Text>
              </View>
              <Text style={styles.categoryName}>{category.name}</Text>
              <Text style={styles.categoryDescription} numberOfLines={2}>
                {category.description}
              </Text>
              <View style={styles.categoryFooter}>
                <Icon name="help-circle-outline" size={16} color="#6A6A6A" />
                <Text style={styles.questionCount}>{category.questionCount} questions</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
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
    paddingVertical: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Quicksand-Bold',
    color: '#4A4A4A',
  },
  placeholder: {
    width: 40,
  },
  difficultyContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  difficultyTitle: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: '#4A4A4A',
    marginBottom: 12,
  },
  difficultyButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  difficultyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    gap: 6,
  },
  difficultyButtonText: {
    fontSize: 14,
    fontFamily: 'Nunito-Bold',
    color: '#6A6A6A',
  },
  difficultyButtonTextActive: {
    color: 'white',
  },
  mixedCard: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  mixedGradient: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  mixedIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  mixedTitle: {
    fontSize: 20,
    fontFamily: 'Quicksand-Bold',
    color: 'white',
    marginBottom: 8,
  },
  mixedDescription: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: 'white',
    textAlign: 'center',
    opacity: 0.9,
  },
  mixedBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 10,
  },
  mixedBadgeText: {
    fontSize: 11,
    fontFamily: 'Nunito-Bold',
    color: 'white',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  categoryCard: {
    width: CARD_WIDTH,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    margin: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryIcon: {
    fontSize: 30,
  },
  categoryName: {
    fontSize: 16,
    fontFamily: 'Quicksand-Bold',
    color: '#4A4A4A',
    marginBottom: 6,
  },
  categoryDescription: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    color: '#6A6A6A',
    lineHeight: 18,
    flex: 1,
  },
  categoryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 4,
  },
  questionCount: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    color: '#6A6A6A',
  },
});

export default CategoriesScreen;