// src/services/QuestionService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Question {
  id: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  options: string[];
  correct: number;
  explanation?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  questionCount: number;
}

// Sample questions - In production, these would come from an API or database
const sampleQuestions: Question[] = [
  // Science - Easy
  {
    id: 'sci_easy_1',
    category: 'Science',
    difficulty: 'easy',
    question: 'What planet is known as the Red Planet?',
    options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
    correct: 1,
    explanation: 'Mars is called the Red Planet due to iron oxide on its surface.',
  },
  {
    id: 'sci_easy_2',
    category: 'Science',
    difficulty: 'easy',
    question: 'How many legs does a spider have?',
    options: ['6', '8', '10', '12'],
    correct: 1,
    explanation: 'All spiders have 8 legs, which distinguishes them from insects.',
  },
  
  // Science - Medium
  {
    id: 'sci_med_1',
    category: 'Science',
    difficulty: 'medium',
    question: 'What is the chemical symbol for gold?',
    options: ['Go', 'Gd', 'Au', 'Ag'],
    correct: 2,
    explanation: 'Au comes from the Latin word "aurum" meaning gold.',
  },
  {
    id: 'sci_med_2',
    category: 'Science',
    difficulty: 'medium',
    question: 'What is the largest organ in the human body?',
    options: ['Heart', 'Brain', 'Liver', 'Skin'],
    correct: 3,
    explanation: 'The skin is the largest organ, covering about 20 square feet in adults.',
  },
  
  // Science - Hard
  {
    id: 'sci_hard_1',
    category: 'Science',
    difficulty: 'hard',
    question: 'What is the speed of light in a vacuum?',
    options: ['299,792,458 m/s', '300,000,000 m/s', '299,792,000 m/s', '298,792,458 m/s'],
    correct: 0,
    explanation: 'The speed of light in vacuum is exactly 299,792,458 meters per second.',
  },
  
  // History - Easy
  {
    id: 'hist_easy_1',
    category: 'History',
    difficulty: 'easy',
    question: 'Who was the first President of the United States?',
    options: ['Thomas Jefferson', 'George Washington', 'John Adams', 'Benjamin Franklin'],
    correct: 1,
    explanation: 'George Washington served as the first U.S. President from 1789 to 1797.',
  },
  {
    id: 'hist_easy_2',
    category: 'History',
    difficulty: 'easy',
    question: 'In which year did World War II end?',
    options: ['1943', '1944', '1945', '1946'],
    correct: 2,
    explanation: 'World War II ended in 1945 with the surrender of Japan.',
  },
  
  // History - Medium
  {
    id: 'hist_med_1',
    category: 'History',
    difficulty: 'medium',
    question: 'Which ancient wonder of the world still stands today?',
    options: ['Colossus of Rhodes', 'Great Pyramid of Giza', 'Hanging Gardens', 'Lighthouse of Alexandria'],
    correct: 1,
    explanation: 'The Great Pyramid of Giza is the only ancient wonder still standing.',
  },
  
  // Geography - Easy
  {
    id: 'geo_easy_1',
    category: 'Geography',
    difficulty: 'easy',
    question: 'What is the capital of France?',
    options: ['London', 'Berlin', 'Paris', 'Madrid'],
    correct: 2,
    explanation: 'Paris has been the capital of France for over 1,000 years.',
  },
  {
    id: 'geo_easy_2',
    category: 'Geography',
    difficulty: 'easy',
    question: 'Which ocean is the largest?',
    options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'],
    correct: 3,
    explanation: 'The Pacific Ocean covers about 63 million square miles.',
  },
  
  // Math - Easy
  {
    id: 'math_easy_1',
    category: 'Math',
    difficulty: 'easy',
    question: 'What is 15 × 4?',
    options: ['45', '50', '60', '65'],
    correct: 2,
    explanation: '15 × 4 = 60',
  },
  {
    id: 'math_easy_2',
    category: 'Math',
    difficulty: 'easy',
    question: 'What is the value of π (pi) to two decimal places?',
    options: ['3.12', '3.14', '3.16', '3.18'],
    correct: 1,
    explanation: 'Pi (π) is approximately 3.14159..., or 3.14 to two decimal places.',
  },
  
  // Literature - Easy
  {
    id: 'lit_easy_1',
    category: 'Literature',
    difficulty: 'easy',
    question: 'Who wrote "Romeo and Juliet"?',
    options: ['Charles Dickens', 'William Shakespeare', 'Mark Twain', 'Jane Austen'],
    correct: 1,
    explanation: 'William Shakespeare wrote Romeo and Juliet around 1595.',
  },
  
  // Technology - Easy
  {
    id: 'tech_easy_1',
    category: 'Technology',
    difficulty: 'easy',
    question: 'What does "WWW" stand for?',
    options: ['World Wide Web', 'World Wide Network', 'Web Wide World', 'Wide World Web'],
    correct: 0,
    explanation: 'WWW stands for World Wide Web, invented by Tim Berners-Lee.',
  },
];

const categories: Category[] = [
  {
    id: 'science',
    name: 'Science',
    icon: '🔬',
    color: '#4CAF50',
    description: 'Explore the wonders of the natural world',
    questionCount: 50,
  },
  {
    id: 'history',
    name: 'History',
    icon: '📚',
    color: '#FF9800',
    description: 'Journey through time and historical events',
    questionCount: 45,
  },
  {
    id: 'geography',
    name: 'Geography',
    icon: '🌍',
    color: '#2196F3',
    description: 'Discover places and cultures around the world',
    questionCount: 40,
  },
  {
    id: 'math',
    name: 'Math',
    icon: '🔢',
    color: '#9C27B0',
    description: 'Challenge your numerical and logical skills',
    questionCount: 35,
  },
  {
    id: 'literature',
    name: 'Literature',
    icon: '📖',
    color: '#E91E63',
    description: 'Dive into the world of books and authors',
    questionCount: 30,
  },
  {
    id: 'technology',
    name: 'Technology',
    icon: '💻',
    color: '#00BCD4',
    description: 'Test your knowledge of modern tech',
    questionCount: 40,
  },
];

class QuestionServiceClass {
  private questions: Question[] = sampleQuestions;
  private answeredQuestions: Set<string> = new Set();

  async init() {
    // Load answered questions from storage
    try {
      const answered = await AsyncStorage.getItem('answered_questions');
      if (answered) {
        this.answeredQuestions = new Set(JSON.parse(answered));
      }
    } catch (error) {
      console.error('Error loading answered questions:', error);
    }
  }

  getCategories(): Category[] {
    return categories;
  }

  getQuestions(
    category?: string,
    difficulty?: 'easy' | 'medium' | 'hard',
    count: number = 10
  ): Question[] {
    let filtered = this.questions;

    if (category) {
      filtered = filtered.filter(q => q.category === category);
    }

    if (difficulty) {
      filtered = filtered.filter(q => q.difficulty === difficulty);
    }

    // Prioritize unanswered questions
    const unanswered = filtered.filter(q => !this.answeredQuestions.has(q.id));
    const answered = filtered.filter(q => this.answeredQuestions.has(q.id));

    // Combine unanswered first, then answered
    const combined = [...unanswered, ...answered];

    // Shuffle and return requested count
    return this.shuffle(combined).slice(0, count);
  }

  markQuestionAnswered(questionId: string) {
    this.answeredQuestions.add(questionId);
    this.saveAnsweredQuestions();
  }

  getQuestionStats() {
    const total = this.questions.length;
    const answered = this.answeredQuestions.size;
    const remaining = total - answered;
    const percentComplete = Math.round((answered / total) * 100);

    return {
      total,
      answered,
      remaining,
      percentComplete,
    };
  }

  async resetProgress() {
    this.answeredQuestions.clear();
    await AsyncStorage.removeItem('answered_questions');
  }

  private shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private async saveAnsweredQuestions() {
    try {
      await AsyncStorage.setItem(
        'answered_questions',
        JSON.stringify(Array.from(this.answeredQuestions))
      );
    } catch (error) {
      console.error('Error saving answered questions:', error);
    }
  }

  // Method to add custom questions (for future expansion)
  async addCustomQuestions(newQuestions: Question[]) {
    this.questions = [...this.questions, ...newQuestions];
    // In a real app, this would save to a database
  }

  // Method to fetch questions from API (for future expansion)
  async fetchQuestionsFromAPI(endpoint: string): Promise<Question[]> {
    try {
      const response = await fetch(endpoint);
      const data = await response.json();
      return data.questions;
    } catch (error) {
      console.error('Error fetching questions:', error);
      return [];
    }
  }
}

export const QuestionService = new QuestionServiceClass();