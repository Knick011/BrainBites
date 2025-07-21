// src/services/QuestionService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Question, Category } from '../types';
import { questionsCSV } from '../assets/data/questionsData';

interface AnsweredQuestion {
  correct: boolean;
  timestamp: string;
}

interface QuestionStats {
  total: number;
  answered: number;
  correct: number;
  incorrect: number;
  remaining: number;
}

// Fallback questions if CSV loading fails
const FALLBACK_QUESTIONS: Question[] = [
  {
    id: 'q1',
    category: 'science',
    level: 'easy',
    question: 'What is the largest planet in our solar system?',
    optionA: 'Earth',
    optionB: 'Mars',
    optionC: 'Jupiter',
    optionD: 'Saturn',
    correctAnswer: 'C',
    explanation: 'Jupiter is the largest planet in our solar system, with a diameter about 11 times that of Earth.'
  },
  {
    id: 'q2',
    category: 'history',
    level: 'medium',
    question: 'In which year did World War II end?',
    optionA: '1943',
    optionB: '1944',
    optionC: '1945',
    optionD: '1946',
    correctAnswer: 'C',
    explanation: 'World War II ended in 1945 with the surrender of Japan on September 2, 1945.'
  }
];

class QuestionService {
  private questions: Question[] = [];
  private answeredQuestions: Map<string, AnsweredQuestion> = new Map();
  private isInitialized: boolean = false;
  private readonly STORAGE_KEY = '@BrainBites:answeredQuestions';

  constructor() {
    // Initialize questions immediately in constructor
    this.loadQuestionsFromCSV();
    this.isInitialized = true;
    console.log(`QuestionService constructed with ${this.questions.length} questions`);
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('QuestionService already initialized');
      return;
    }
    
    console.log('Initializing QuestionService...');
    
    // Load answered questions history
    await this.loadAnsweredQuestions();
    
    this.isInitialized = true;
    console.log(`QuestionService initialized with ${this.questions.length} questions`);
  }

  private loadQuestionsFromCSV(): void {
    try {
      console.log('Loading questions from CSV data...');
      
      // Parse CSV
      const lines = questionsCSV.split('\n').filter(line => line.trim() !== '');
      console.log(`Found ${lines.length} lines in CSV`);
      
      if (lines.length < 2) {
        console.error('CSV data is empty or invalid, using fallback questions');
        this.questions = FALLBACK_QUESTIONS;
        return;
      }
      
      const headers = lines[0].split(',').map((h: string) => h.trim());
      console.log('CSV headers:', headers);
      
      this.questions = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Simple CSV parsing (handles basic cases)
        const values = line.split(',').map((v: string) => v.trim().replace(/^"|"$/g, ''));
        
        if (values.length >= 10) {
          const question: Question = {
            id: `q${i}`,
            category: values[1].toLowerCase(), // category is at index 1
            level: values[9].toLowerCase() as 'easy' | 'medium' | 'hard', // level is at index 9
            question: values[2], // question is at index 2
            optionA: values[3], // optionA is at index 3
            optionB: values[4], // optionB is at index 4
            optionC: values[5], // optionC is at index 5
            optionD: values[6], // optionD is at index 6
            correctAnswer: values[7].toUpperCase(), // correctAnswer is at index 7
            explanation: values[8] || 'No explanation provided.' // explanation is at index 8
          };
          
          this.questions.push(question);
        } else {
          console.warn(`Skipping line ${i + 1}: insufficient columns (${values.length})`);
        }
      }
      
      console.log(`Successfully loaded ${this.questions.length} questions from questionsData.ts`);
    } catch (error) {
      console.error('Failed to load questions from questionsData.ts, using fallback questions:', error);
      this.questions = FALLBACK_QUESTIONS;
    }
  }

  private async loadAnsweredQuestions(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.answeredQuestions = new Map(data);
      }
    } catch (error) {
      console.error('Error loading answered questions:', error);
    }
  }

  private async saveAnsweredQuestions(): Promise<void> {
    try {
      const data = Array.from(this.answeredQuestions.entries());
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving answered questions:', error);
    }
  }

  async recordAnswer(questionId: string, isCorrect: boolean): Promise<void> {
    this.answeredQuestions.set(questionId, {
      correct: isCorrect,
      timestamp: new Date().toISOString()
    });
    await this.saveAnsweredQuestions();
  }

  getRandomQuestion(category?: string, difficulty?: 'easy' | 'medium' | 'hard'): Question {
    if (!this.isInitialized) {
      throw new Error('QuestionService not initialized');
    }

    // Filter questions based on criteria
    let availableQuestions = this.questions.filter(q => {
      // Filter by category if specified
      if (category && q.category !== category.toLowerCase()) {
        return false;
      }
      
      // Filter by difficulty if specified
      if (difficulty && q.level !== difficulty) {
        return false;
      }
      
      // Check if already answered correctly
      const answered = this.answeredQuestions.get(q.id);
      if (answered && answered.correct) {
        return false; // Skip correctly answered questions
      }
      
      return true;
    });

    // If no questions available, include previously correct ones
    if (availableQuestions.length === 0) {
      availableQuestions = this.questions.filter(q => {
        if (category && q.category !== category.toLowerCase()) {
          return false;
        }
        if (difficulty && q.level !== difficulty) {
          return false;
        }
        return true;
      });
    }

    if (availableQuestions.length === 0) {
      throw new Error('No questions available');
    }

    // Return random question
    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    return availableQuestions[randomIndex];
  }

  getQuestionStats(): QuestionStats {
    const total = this.questions.length;
    const answered = this.answeredQuestions.size;
    const correct = Array.from(this.answeredQuestions.values())
      .filter(a => a.correct).length;
    
    return {
      total,
      answered,
      correct,
      incorrect: answered - correct,
      remaining: total - correct
    };
  }

  getCategories(): Category[] {
    if (!this.isInitialized) {
      console.log('QuestionService not initialized, returning default categories');
      // Return default categories if not initialized
      return [
        {
          id: 'science',
          name: 'Science',
          icon: '🔬',
          color: '#4CAF50',
          description: 'Explore the wonders of science and discovery',
          questionCount: 0
        },
        {
          id: 'history',
          name: 'History',
          icon: '📚',
          color: '#FF9800',
          description: 'Journey through time and historical events',
          questionCount: 0
        },
        {
          id: 'math',
          name: 'Mathematics',
          icon: '📐',
          color: '#2196F3',
          description: 'Master numbers, equations, and logic',
          questionCount: 0
        },
        {
          id: 'geography',
          name: 'Geography',
          icon: '🌍',
          color: '#9C27B0',
          description: 'Discover the world and its places',
          questionCount: 0
        },
        {
          id: 'literature',
          name: 'Literature',
          icon: '📖',
          color: '#E91E63',
          description: 'Explore classic and modern literature',
          questionCount: 0
        },
        {
          id: 'sports',
          name: 'Sports',
          icon: '⚽',
          color: '#FF5722',
          description: 'Test your knowledge of sports and games',
          questionCount: 0
        }
      ];
    }

    console.log(`Generating categories from ${this.questions.length} questions`);
    
    // Count questions per category
    const categoryCounts = new Map<string, number>();
    this.questions.forEach(question => {
      const count = categoryCounts.get(question.category) || 0;
      categoryCounts.set(question.category, count + 1);
    });

    console.log('Category counts:', Array.from(categoryCounts.entries()));

    // Define category metadata
    const categoryMetadata: { [key: string]: Omit<Category, 'id' | 'questionCount'> } = {
      'science': {
        name: 'Science',
        icon: '🔬',
        color: '#4CAF50',
        description: 'Explore the wonders of science and discovery'
      },
      'history': {
        name: 'History',
        icon: '📚',
        color: '#FF9800',
        description: 'Journey through time and historical events'
      },
      'math': {
        name: 'Mathematics',
        icon: '📐',
        color: '#2196F3',
        description: 'Master numbers, equations, and logic'
      },
      'geography': {
        name: 'Geography',
        icon: '🌍',
        color: '#9C27B0',
        description: 'Discover the world and its places'
      },
      'literature': {
        name: 'Literature',
        icon: '📖',
        color: '#E91E63',
        description: 'Explore classic and modern literature'
      },
      'sports': {
        name: 'Sports',
        icon: '⚽',
        color: '#FF5722',
        description: 'Test your knowledge of sports and games'
      },
      'art': {
        name: 'Art',
        icon: '🎨',
        color: '#FFC107',
        description: 'Discover famous artists and masterpieces'
      },
      'music': {
        name: 'Music',
        icon: '🎵',
        color: '#00BCD4',
        description: 'Learn about music theory and musicians'
      },
      'technology': {
        name: 'Technology',
        icon: '💻',
        color: '#607D8B',
        description: 'Explore the world of technology and innovation'
      },
      'food': {
        name: 'Food & Cooking',
        icon: '🍳',
        color: '#795548',
        description: 'Discover culinary knowledge and food facts'
      },
      'animals': {
        name: 'Animals',
        icon: '🐾',
        color: '#8BC34A',
        description: 'Learn about wildlife and animal kingdom'
      },
      'language': {
        name: 'Language',
        icon: '🗣️',
        color: '#FF5722',
        description: 'Explore languages and linguistics'
      }
    };

    // Build categories array
    const categories: Category[] = [];
    categoryCounts.forEach((count, categoryId) => {
      const metadata = categoryMetadata[categoryId.toLowerCase()];
      if (metadata) {
        categories.push({
          id: categoryId.toLowerCase(),
          name: metadata.name,
          icon: metadata.icon,
          color: metadata.color,
          description: metadata.description,
          questionCount: count
        });
      } else {
        console.warn(`No metadata found for category: ${categoryId}`);
      }
    });

    console.log(`Generated ${categories.length} categories`);
    
    // Sort by question count (descending)
    return categories.sort((a, b) => b.questionCount - a.questionCount);
  }

  async resetProgress(): Promise<void> {
    this.answeredQuestions.clear();
    await AsyncStorage.removeItem(this.STORAGE_KEY);
  }

  // Add getNextQuestion method
  getNextQuestion(difficulty: 'easy' | 'medium' | 'hard'): Question | null {
    // Get questions for the specified difficulty
    const questions = this.questions.filter(q => q.level === difficulty);
    
    // Get a random question
    if (questions.length > 0) {
      const randomIndex = Math.floor(Math.random() * questions.length);
      return questions[randomIndex];
    }
    
    return null;
  }
}

export default new QuestionService();