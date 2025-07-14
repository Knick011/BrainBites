import RNFS from 'react-native-fs';
import Papa from 'papaparse';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Question {
  id: string;
  category: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  explanation: string;
  level: 'easy' | 'medium' | 'hard';
}

class QuestionServiceClass {
  private questions: Question[] = [];
  private questionsByCategory: Map<string, Question[]> = new Map();
  private questionsByDifficulty: Map<string, Question[]> = new Map();
  private usedQuestionIds: Set<string> = new Set();
  private STORAGE_KEY = '@BrainBites:usedQuestions';

  async loadQuestions() {
    try {
      // For React Native, we need to import the CSV file differently
      // Since we can't use RNFS.MainBundlePath, we'll use the sample questions
      // In a real app, you would fetch this from an API or bundle it differently
      
      console.log('Loading questions...');
      
      // For now, use the sample questions
      this.loadSampleQuestions();
      
      // In production, you would do something like:
      // const response = await fetch('your-api-endpoint/questions.csv');
      // const csvText = await response.text();
      // Then parse the CSV text
      
      // Load used questions from storage
      await this.loadUsedQuestions();

      console.log(`Loaded ${this.questions.length} questions`);
    } catch (error) {
      console.error('Failed to load questions:', error);
      // Fallback to sample questions if CSV fails
      this.loadSampleQuestions();
      
      // Ensure we have at least some questions
      if (this.questions.length === 0) {
        console.warn('No questions loaded, using emergency fallback');
        this.loadEmergencyQuestions();
      }
    }
  }

  private organizeQuestions() {
    this.questionsByCategory.clear();
    this.questionsByDifficulty.clear();

    this.questions.forEach((question) => {
      // By category
      if (!this.questionsByCategory.has(question.category)) {
        this.questionsByCategory.set(question.category, []);
      }
      this.questionsByCategory.get(question.category)!.push(question);

      // By difficulty
      if (!this.questionsByDifficulty.has(question.level)) {
        this.questionsByDifficulty.set(question.level, []);
      }
      this.questionsByDifficulty.get(question.level)!.push(question);
    });
  }

  private async loadUsedQuestions() {
    try {
      const used = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (used) {
        this.usedQuestionIds = new Set(JSON.parse(used));
      }
    } catch (error) {
      console.error('Failed to load used questions:', error);
    }
  }

  private async saveUsedQuestions() {
    try {
      await AsyncStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify(Array.from(this.usedQuestionIds))
      );
    } catch (error) {
      console.error('Failed to save used questions:', error);
    }
  }

  async getRandomQuestion(
    category?: string,
    difficulty?: 'easy' | 'medium' | 'hard'
  ): Promise<Question | null> {
    let availableQuestions = [...this.questions];

    // Filter by category if specified
    if (category) {
      availableQuestions = availableQuestions.filter(
        (q) => q.category === category
      );
    }

    // Filter by difficulty if specified
    if (difficulty) {
      availableQuestions = availableQuestions.filter(
        (q) => q.level === difficulty
      );
    }

    // Filter out used questions
    availableQuestions = availableQuestions.filter(
      (q) => !this.usedQuestionIds.has(q.id)
    );

    // If all questions have been used, reset
    if (availableQuestions.length === 0) {
      this.usedQuestionIds.clear();
      await this.saveUsedQuestions();
      return this.getRandomQuestion(category, difficulty);
    }

    // Select random question
    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    const question = availableQuestions[randomIndex];

    // Mark as used
    this.usedQuestionIds.add(question.id);
    await this.saveUsedQuestions();

    return question;
  }

  getCategories(): string[] {
    return Array.from(this.questionsByCategory.keys()).sort();
  }

  getCategoryQuestionCount(category: string): number {
    return this.questionsByCategory.get(category)?.length || 0;
  }

  getDifficultyQuestionCount(difficulty: string): number {
    return this.questionsByDifficulty.get(difficulty)?.length || 0;
  }

  getTotalQuestionCount(): number {
    return this.questions.length;
  }

  // Expanded sample questions for better gameplay
  private loadSampleQuestions() {
    this.questions = [
      // Science Questions
      {
        id: '1',
        category: 'Science',
        question: 'What is the chemical symbol for water?',
        optionA: 'H2O',
        optionB: 'CO2',
        optionC: 'O2',
        optionD: 'N2',
        correctAnswer: 'H2O',
        explanation: 'Water is composed of two hydrogen atoms and one oxygen atom, hence H2O.',
        level: 'easy',
      },
      {
        id: '2',
        category: 'Science',
        question: 'What planet is known as the Red Planet?',
        optionA: 'Venus',
        optionB: 'Mars',
        optionC: 'Jupiter',
        optionD: 'Saturn',
        correctAnswer: 'Mars',
        explanation: 'Mars appears red due to iron oxide (rust) on its surface.',
        level: 'easy',
      },
      {
        id: '3',
        category: 'Science',
        question: 'What is the largest organ in the human body?',
        optionA: 'Heart',
        optionB: 'Brain',
        optionC: 'Liver',
        optionD: 'Skin',
        correctAnswer: 'Skin',
        explanation: 'The skin is the largest organ, covering about 20 square feet in adults.',
        level: 'medium',
      },
      
      // Mathematics Questions
      {
        id: '4',
        category: 'Mathematics',
        question: 'What is the value of π (pi) to two decimal places?',
        optionA: '3.12',
        optionB: '3.14',
        optionC: '3.16',
        optionD: '3.18',
        correctAnswer: '3.14',
        explanation: 'Pi is approximately 3.14159..., rounded to 3.14.',
        level: 'easy',
      },
      {
        id: '5',
        category: 'Mathematics',
        question: 'What is 15% of 200?',
        optionA: '20',
        optionB: '25',
        optionC: '30',
        optionD: '35',
        correctAnswer: '30',
        explanation: '15% of 200 = 0.15 × 200 = 30',
        level: 'easy',
      },
      {
        id: '6',
        category: 'Mathematics',
        question: 'What is the square root of 144?',
        optionA: '10',
        optionB: '11',
        optionC: '12',
        optionD: '13',
        correctAnswer: '12',
        explanation: '12 × 12 = 144, so √144 = 12',
        level: 'medium',
      },
      
      // History Questions
      {
        id: '7',
        category: 'History',
        question: 'In which year did World War II end?',
        optionA: '1943',
        optionB: '1944',
        optionC: '1945',
        optionD: '1946',
        correctAnswer: '1945',
        explanation: 'World War II ended in 1945 with the surrender of Japan.',
        level: 'medium',
      },
      {
        id: '8',
        category: 'History',
        question: 'Who was the first President of the United States?',
        optionA: 'Thomas Jefferson',
        optionB: 'John Adams',
        optionC: 'George Washington',
        optionD: 'Benjamin Franklin',
        correctAnswer: 'George Washington',
        explanation: 'George Washington served as the first U.S. President from 1789 to 1797.',
        level: 'easy',
      },
      
      // Geography Questions
      {
        id: '9',
        category: 'Geography',
        question: 'What is the capital of Australia?',
        optionA: 'Sydney',
        optionB: 'Melbourne',
        optionC: 'Canberra',
        optionD: 'Perth',
        correctAnswer: 'Canberra',
        explanation: 'Canberra is the purpose-built capital city of Australia.',
        level: 'medium',
      },
      {
        id: '10',
        category: 'Geography',
        question: 'Which is the longest river in the world?',
        optionA: 'Amazon',
        optionB: 'Nile',
        optionC: 'Mississippi',
        optionD: 'Yangtze',
        correctAnswer: 'Nile',
        explanation: 'The Nile River in Africa is approximately 6,650 kilometers long.',
        level: 'medium',
      },
      
      // Literature Questions
      {
        id: '11',
        category: 'Literature',
        question: 'Who wrote "Romeo and Juliet"?',
        optionA: 'Charles Dickens',
        optionB: 'William Shakespeare',
        optionC: 'Jane Austen',
        optionD: 'Mark Twain',
        correctAnswer: 'William Shakespeare',
        explanation: 'Shakespeare wrote this famous tragedy in the early 1590s.',
        level: 'easy',
      },
      {
        id: '12',
        category: 'Literature',
        question: 'Which novel begins with "Call me Ishmael"?',
        optionA: 'The Great Gatsby',
        optionB: 'Moby Dick',
        optionC: '1984',
        optionD: 'To Kill a Mockingbird',
        correctAnswer: 'Moby Dick',
        explanation: 'This famous opening line is from Herman Melville\'s "Moby Dick".',
        level: 'hard',
      },
      
      // General Knowledge
      {
        id: '13',
        category: 'General',
        question: 'How many days are there in a leap year?',
        optionA: '364',
        optionB: '365',
        optionC: '366',
        optionD: '367',
        correctAnswer: '366',
        explanation: 'A leap year has 366 days, with February having 29 days instead of 28.',
        level: 'easy',
      },
      {
        id: '14',
        category: 'General',
        question: 'What is the smallest prime number?',
        optionA: '0',
        optionB: '1',
        optionC: '2',
        optionD: '3',
        correctAnswer: '2',
        explanation: '2 is the smallest prime number and the only even prime number.',
        level: 'medium',
      },
      {
        id: '15',
        category: 'General',
        question: 'How many continents are there?',
        optionA: '5',
        optionB: '6',
        optionC: '7',
        optionD: '8',
        correctAnswer: '7',
        explanation: 'The seven continents are: Africa, Antarctica, Asia, Australia, Europe, North America, and South America.',
        level: 'easy',
      },
    ];
    this.organizeQuestions();
  }

  private loadEmergencyQuestions() {
    // Emergency fallback questions if everything else fails
    const emergencyQuestions: Question[] = [
      {
        id: 'emergency-1',
        category: 'General Knowledge',
        question: 'What is the capital of France?',
        optionA: 'London',
        optionB: 'Paris',
        optionC: 'Berlin',
        optionD: 'Madrid',
        correctAnswer: 'B',
        explanation: 'Paris is the capital and largest city of France.',
        level: 'easy',
      },
      {
        id: 'emergency-2',
        category: 'Science',
        question: 'What is the chemical symbol for gold?',
        optionA: 'Ag',
        optionB: 'Au',
        optionC: 'Fe',
        optionD: 'Cu',
        correctAnswer: 'B',
        explanation: 'Au comes from the Latin word for gold, "aurum".',
        level: 'medium',
      },
      {
        id: 'emergency-3',
        category: 'History',
        question: 'In which year did World War II end?',
        optionA: '1943',
        optionB: '1944',
        optionC: '1945',
        optionD: '1946',
        correctAnswer: 'C',
        explanation: 'World War II ended in 1945 with the surrender of Germany and Japan.',
        level: 'medium',
      },
    ];
    
    this.questions = emergencyQuestions;
    this.organizeQuestions(); // Ensure categorization is applied to emergency questions
  }

  // Reset all used questions
  async resetUsedQuestions() {
    this.usedQuestionIds.clear();
    await this.saveUsedQuestions();
  }
}

export const QuestionService = new QuestionServiceClass();