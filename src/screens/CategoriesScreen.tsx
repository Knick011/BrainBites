// src/screens/CategoriesScreen.tsx
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Animated,
  Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, Category } from '../types';
import theme from '../styles/theme';
import SoundService from '../services/SoundService';

type NavigationProp = StackNavigationProp<RootStackParamList, 'Categories'>;

const CATEGORIES: Category[] = [
  {
    id: 'science',
    name: 'Science',
    icon: 'flask-outline',
    color: '#4CAF50',
    description: 'Physics, Chemistry, Biology',
    questionCount: 0
  },
  {
    id: 'history',
    name: 'History', 
    icon: 'book-clock-outline',
    color: '#2196F3',
    description: 'World events & civilizations',
    questionCount: 0
  },
  {
    id: 'math',
    name: 'Math',
    icon: 'calculator-variant-outline',
    color: '#FF9800',
    description: 'Numbers & calculations',
    questionCount: 0
  },
  {
    id: 'geography',
    name: 'Geography',
    icon: 'earth',
    color: '#9C27B0',
    description: 'Countries & capitals',
    questionCount: 0
  },
  {
    id: 'technology',
    name: 'Technology',
    icon: 'laptop',
    color: '#00BCD4',
    description: 'Computers & innovation',
    questionCount: 0
  },
  {
    id: 'funfacts',
    name: 'Fun Facts',
    icon: 'lightbulb-outline',
    color: '#E91E63',
    description: 'Interesting trivia',
    questionCount: 0
  }
];

const CategoriesScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const cardAnims = useRef(CATEGORIES.map(() => new Animated.Value(0))).current;
  
  useEffect(() => {
    // Animate entrance
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    
    // Stagger card animations
    const animations = cardAnims.map((anim, index) => 
      Animated.timing(anim, {
        toValue: 1,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
      })
    );
    
    Animated.stagger(100, animations).start();
  }, []);
  
  const handleCategorySelect = (category: Category) => {
    SoundService.playButtonPress();
    navigation.navigate('Quiz', { category: category.id });
  };
  
  const handleBack = () => {
    SoundService.playButtonPress();
    navigation.goBack();
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <Animated.View 
        style={[
          styles.header,
          { opacity: fadeAnim }
        ]}
      >
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose a Category</Text>
        <View style={{ width: 40 }} />
      </Animated.View>
      
      <ScrollView 
        contentContainerStyle={styles.gridContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {CATEGORIES.map((category, index) => (
            <Animated.View
              key={category.id}
              style={[
                styles.categoryCardContainer,
                {
                  opacity: cardAnims[index],
                  transform: [
                    {
                      translateY: cardAnims[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [30, 0],
                      }),
                    },
                    {
                      scale: cardAnims[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <TouchableOpacity
                style={styles.categoryCard}
                onPress={() => handleCategorySelect(category)}
                activeOpacity={0.8}
              >
                <View 
                  style={[
                    styles.iconContainer,
                    { backgroundColor: category.color + '20' }
                  ]}
                >
                  <Icon 
                    name={category.icon} 
                    size={32} 
                    color={category.color} 
                  />
                </View>
                <Text style={styles.categoryName}>{category.name}</Text>
                <Text style={styles.categoryDescription}>{category.description}</Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif-medium',
  },
  gridContainer: {
    padding: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCardContainer: {
    width: '48%',
    marginBottom: 16,
  },
  categoryCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    ...theme.shadows.md,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif-medium',
  },
  categoryDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
  },
});

export default CategoriesScreen;