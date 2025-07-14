import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { SoundService } from '../services/SoundService';
import { QuestionService } from '../services/QuestionService';
import AnimatedBackground from '../components/common/AnimatedBackground';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type NavigationProp = StackNavigationProp<RootStackParamList, 'Categories'>;

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  questionCount: number;
}

const CategoriesScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnims = useRef<Animated.Value[]>([]).current;

  useEffect(() => {
    loadCategories();
    
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadCategories = async () => {
    // Get categories from QuestionService
    const availableCategories = await QuestionService.getCategories();
    
    // Map to category objects with icons and colors
    const categoryMap: { [key: string]: { icon: string; color: string; description: string } } = {
      'Science': { icon: 'flask', color: '#4CAF50', description: 'Physics, Chemistry, Biology' },
      'Mathematics': { icon: 'calculator', color: '#2196F3', description: 'Algebra, Geometry, Statistics' },
      'History': { icon: 'time', color: '#FF9800', description: 'World History, Ancient Civilizations' },
      'Geography': { icon: 'earth', color: '#795548', description: 'Countries, Capitals, Landmarks' },
      'Literature': { icon: 'book', color: '#9C27B0', description: 'Books, Authors, Poetry' },
      'Technology': { icon: 'laptop', color: '#00BCD4', description: 'Computers, Internet, Innovation' },
      'Sports': { icon: 'football', color: '#F44336', description: 'Teams, Players, Records' },
      'Music': { icon: 'musical-notes', color: '#E91E63', description: 'Artists, Songs, Instruments' },
      'Movies': { icon: 'film', color: '#FF5722', description: 'Films, Actors, Directors' },
      'General': { icon: 'bulb', color: '#FFC107', description: 'Mixed Topics & Trivia' },
    };

    const mappedCategories: Category[] = availableCategories.map((catName, index) => {
      const catInfo = categoryMap[catName] || { 
        icon: 'help-circle', 
        color: '#9E9E9E', 
        description: 'Various topics' 
      };
      
      // Create animation values for each category
      if (!scaleAnims[index]) {
        scaleAnims[index] = new Animated.Value(0);
      }
      
      return {
        id: catName.toLowerCase(),
        name: catName,
        icon: catInfo.icon,
        color: catInfo.color,
        description: catInfo.description,
        questionCount: QuestionService.getCategoryQuestionCount(catName),
      };
    });

    setCategories(mappedCategories);
    
    // Animate categories in with stagger effect
    const staggerTime = 100;
    mappedCategories.forEach((_, index) => {
      Animated.spring(scaleAnims[index], {
        toValue: 1,
        delay: index * staggerTime,
        tension: 10,
        friction: 7,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleCategoryPress = (category: Category) => {
    SoundService.playButtonClick();
    setSelectedCategory(category.id);
    
    // Animate the selected category
    const index = categories.findIndex(c => c.id === category.id);
    Animated.sequence([
      Animated.timing(scaleAnims[index], {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnims[index], {
        toValue: 1.1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnims[index], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      navigation.navigate('Quiz', { category: category.name });
    });
  };

  const renderCategory = (category: Category, index: number) => {
    const isSelected = selectedCategory === category.id;
    
    return (
      <Animated.View
        key={category.id}
        style={[
          styles.categoryCard,
          {
            transform: [{ scale: scaleAnims[index] || 1 }],
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
        >
          <View style={styles.categoryIconContainer}>
            <Icon name={category.icon} size={40} color="#FFF" />
          </View>
          <Text style={styles.categoryName}>{category.name}</Text>
          <Text style={styles.categoryDescription}>{category.description}</Text>
          <View style={styles.questionCountBadge}>
            <Text style={styles.questionCountText}>{category.questionCount} Questions</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <LinearGradient
      colors={['#FFE4B5', '#FFD700', '#FFA500']}
      style={styles.container}
    >
      <AnimatedBackground />
      
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={30} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Choose a Category</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.categoriesGrid, { opacity: fadeAnim }]}>
          {categories.map((category, index) => renderCategory(category, index))}
        </Animated.View>

        <Animated.View style={[styles.infoSection, { opacity: fadeAnim }]}>
          <View style={styles.infoCard}>
            <Icon name="information-circle" size={24} color="#FFA500" />
            <Text style={styles.infoText}>
              Each category contains questions of varying difficulty. 
              Answer correctly to earn points and time rewards!
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    fontFamily: 'Quicksand-Bold',
  },
  placeholder: {
    width: 40,
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
  },
  categoryCard: {
    width: (SCREEN_WIDTH - 50) / 2,
    marginBottom: 15,
  },
  categoryButton: {
    height: 180,
    borderRadius: 20,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  selectedCategory: {
    borderWidth: 3,
    borderColor: '#FFF',
  },
  categoryIconContainer: {
    width: 60,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 5,
    fontFamily: 'Quicksand-Bold',
  },
  categoryDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: 'Nunito-Regular',
  },
  questionCountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  questionCountText: {
    fontSize: 11,
    color: '#FFF',
    fontWeight: 'bold',
    fontFamily: 'Nunito-Bold',
  },
  infoSection: {
    marginTop: 20,
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 15,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  infoText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#333',
    fontFamily: 'Nunito-Regular',
  },
});

export default CategoriesScreen;