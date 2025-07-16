import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Dimensions,
  Platform,
  Animated,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { QuestionService } from '../services/QuestionService';
import { SoundService } from '../services/SoundService';
import AnimatedBackground from '../components/common/AnimatedBackground';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type NavigationProp = StackNavigationProp<RootStackParamList, 'Categories'>;
type CategoriesRouteProp = RouteProp<RootStackParamList, 'Categories'>;

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  questionCount: number;
  gradient: string[];
}

const CategoriesScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<CategoriesRouteProp>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const scaleAnims = useRef<{ [key: number]: Animated.Value }>({});

  const difficulty = route.params?.difficulty || 'medium';

  useEffect(() => {
    loadCategories();
    
    // Animate entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      
      // Ensure QuestionService is ready
      if (!QuestionService.isReady()) {
        console.log('📚 QuestionService not ready, loading...');
        await QuestionService.loadQuestions();
      }
      
      // Get categories from QuestionService
      const availableCategories = QuestionService.getCategories();
      console.log('📋 Available categories:', availableCategories);
      
      // Map to category objects with icons and colors
      const categoryMap: { [key: string]: { icon: string; color: string; description: string; gradient: string[] } } = {
        'Science': { 
          icon: 'flask-outline', 
          color: '#4ECDC4', 
          description: 'Physics, Chemistry, Biology',
          gradient: ['#4ECDC4', '#44A08D']
        },
        'Mathematics': { 
          icon: 'calculator-outline', 
          color: '#2196F3', 
          description: 'Algebra, Geometry, Statistics',
          gradient: ['#2196F3', '#1976D2']
        },
        'History': { 
          icon: 'time-outline', 
          color: '#FF9800', 
          description: 'World History, Ancient Times',
          gradient: ['#FF9800', '#F57C00']
        },
        'Geography': { 
          icon: 'earth-outline', 
          color: '#795548', 
          description: 'Countries, Capitals, Landmarks',
          gradient: ['#795548', '#5D4037']
        },
        'Literature': { 
          icon: 'book-outline', 
          color: '#9C27B0', 
          description: 'Books, Authors, Poetry',
          gradient: ['#9C27B0', '#7B1FA2']
        },
        'Technology': { 
          icon: 'laptop-outline', 
          color: '#00BCD4', 
          description: 'Computers, Internet, Innovation',
          gradient: ['#00BCD4', '#0097A7']
        },
        'Sports': { 
          icon: 'football-outline', 
          color: '#F44336', 
          description: 'Teams, Players, Records',
          gradient: ['#F44336', '#D32F2F']
        },
        'Music': { 
          icon: 'musical-notes-outline', 
          color: '#E91E63', 
          description: 'Artists, Songs, Instruments',
          gradient: ['#E91E63', '#C2185B']
        },
        'Movies': { 
          icon: 'film-outline', 
          color: '#FF5722', 
          description: 'Films, Actors, Directors',
          gradient: ['#FF5722', '#D84315']
        },
        'General': { 
          icon: 'bulb-outline', 
          color: '#FFC107', 
          description: 'Mixed Topics & Trivia',
          gradient: ['#FFC107', '#FFA000']
        },
      };

      const mappedCategories: Category[] = availableCategories.map((catName, index) => {
        const catInfo = categoryMap[catName] || { 
          icon: 'help-circle-outline', 
          color: '#9E9E9E', 
          description: 'Various topics',
          gradient: ['#9E9E9E', '#757575']
        };
        
        // Create animation values for each category
        if (!scaleAnims.current[index]) {
          scaleAnims.current[index] = new Animated.Value(0);
        }
        
        return {
          id: catName.toLowerCase().replace(/\s+/g, '_'),
          name: catName,
          icon: catInfo.icon,
          color: catInfo.color,
          description: catInfo.description,
          questionCount: QuestionService.getCategoryQuestionCount(catName),
          gradient: catInfo.gradient,
        };
      });

      // Add a fallback General category if none exist
      if (mappedCategories.length === 0) {
        mappedCategories.push({
          id: 'general',
          name: 'General',
          icon: 'bulb-outline',
          color: '#FFC107',
          description: 'Mixed Topics & Trivia',
          questionCount: QuestionService.getTotalQuestionCount(),
          gradient: ['#FFC107', '#FFA000'],
        });
      }

      setCategories(mappedCategories);
      
      // Animate categories in with stagger effect
      const staggerTime = 100;
      mappedCategories.forEach((_, index) => {
        Animated.spring(scaleAnims.current[index], {
          toValue: 1,
          delay: index * staggerTime,
          tension: 10,
          friction: 7,
          useNativeDriver: true,
        }).start();
      });
      
      console.log('✅ Categories loaded:', mappedCategories.length);
      
    } catch (error) {
      console.error('❌ Error loading categories:', error);
      
      // Fallback categories
      const fallbackCategories: Category[] = [
        {
          id: 'general',
          name: 'General',
          icon: 'bulb-outline',
          color: '#FFC107',
          description: 'Mixed Topics & Trivia',
          questionCount: 20,
          gradient: ['#FFC107', '#FFA000'],
        },
        {
          id: 'science',
          name: 'Science',
          icon: 'flask-outline',
          color: '#4ECDC4',
          description: 'Physics, Chemistry, Biology',
          questionCount: 15,
          gradient: ['#4ECDC4', '#44A08D'],
        },
        {
          id: 'mathematics',
          name: 'Mathematics',
          icon: 'calculator-outline',
          color: '#2196F3',
          description: 'Algebra, Geometry, Statistics',
          questionCount: 12,
          gradient: ['#2196F3', '#1976D2'],
        },
      ];
      
      setCategories(fallbackCategories);
      
      // Animate fallback categories
      fallbackCategories.forEach((_, index) => {
        if (!scaleAnims.current[index]) {
          scaleAnims.current[index] = new Animated.Value(0);
        }
        Animated.spring(scaleAnims.current[index], {
          toValue: 1,
          delay: index * 100,
          tension: 10,
          friction: 7,
          useNativeDriver: true,
        }).start();
      });
      
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryPress = (category: Category) => {
    SoundService.playButtonClick();
    setSelectedCategory(category.id);
    
    // Animate the selected category
    const index = categories.findIndex(c => c.id === category.id);
    if (scaleAnims.current[index]) {
      Animated.sequence([
        Animated.timing(scaleAnims.current[index], {
          toValue: 0.9,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnims.current[index], {
          toValue: 1.1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnims.current[index], {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Navigate to Quiz with only the category filter (no difficulty filter)
        // This will show questions from this category with varying difficulties
        navigation.navigate('Quiz', { 
          category: category.name, 
          difficulty: undefined // No difficulty filter, show varying difficulties
        });
      });
    }
  };

  const handleBackPress = () => {
    SoundService.playButtonClick();
    navigation.goBack();
  };

  const renderCategory = (category: Category, index: number) => {
    const isSelected = selectedCategory === category.id;
    const animValue = scaleAnims.current[index] || new Animated.Value(1);
    
    return (
      <Animated.View
        key={category.id}
        style={[
          styles.categoryCard,
          {
            transform: [{ scale: animValue }],
            opacity: fadeAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.categoryButton,
            { backgroundColor: category.color },
            isSelected && styles.selectedCategory,
          ]}
          onPress={() => handleCategoryPress(category)}
          activeOpacity={0.8}
          disabled={isLoading}
        >
          <View style={styles.categoryIconContainer}>
            <Icon name={category.icon} size={36} color="#FFF" />
          </View>
          <Text style={styles.categoryName}>{category.name}</Text>
          <Text style={styles.categoryDescription}>{category.description}</Text>
          <View style={styles.questionCountBadge}>
            <Text style={styles.questionCountText}>
              {category.questionCount} Question{category.questionCount !== 1 ? 's' : ''}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#FF9F1C" />
      <Text style={styles.loadingText}>Loading categories...</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <AnimatedBackground />
      
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={handleBackPress} 
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.title}>Choose a Category</Text>
          <Text style={styles.subtitle}>
            Questions with varying difficulties
          </Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      {/* Filler Space */}
      <View style={styles.fillerSpace} />

      {isLoading ? (
        renderLoadingState()
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.categoriesGrid, { opacity: fadeAnim }]}>
            {categories.map((category, index) => renderCategory(category, index))}
          </Animated.View>

          <Animated.View style={[styles.infoSection, { opacity: fadeAnim }]}>
            <View style={styles.infoCard}>
              <Icon name="information-circle-outline" size={24} color="#FF9F1C" />
              <Text style={styles.infoText}>
                Each category contains questions of varying difficulty levels. 
                Answer correctly to earn points and time rewards!
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8E7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitleContainer: {
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'Roboto-Bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'Roboto',
  },
  placeholder: {
    width: 44,
  },
  fillerSpace: {
    height: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'Roboto',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  categoryCard: {
    width: (SCREEN_WIDTH - 60) / 2,
    marginBottom: 16,
  },
  categoryButton: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    minHeight: 160,
  },
  selectedCategory: {
    transform: [{ scale: 1.05 }],
    elevation: 5,
  },
  categoryIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'Roboto-Bold',
  },
  categoryDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'Roboto',
  },
  questionCountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  questionCountText: {
    fontSize: 10,
    color: '#FFF',
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'Roboto',
  },
  difficultyBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 8,
    color: '#FFF',
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'Roboto',
  },
  infoSection: {
    marginTop: 10,
  },
  infoCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'Roboto',
  },
});

export default CategoriesScreen;