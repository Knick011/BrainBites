import AsyncStorage from '@react-native-async-storage/async-storage';
import { questionsCSV } from '../assets/data/questionsData';

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
  private isLoaded = false;

  async loadQuestions() {
    try {
      console.log('Loading questions...');
      
      // Load questions from the embedded CSV data
      this.parseCSVString(questionsCSV);
      console.log(`Loaded ${this.questions.length} questions from embedded data`);
      
      this.isLoaded = true;
      
      // Load used questions from storage
      await this.loadUsedQuestions();

      console.log(`Total questions available: ${this.questions.length}`);
      return true;
    } catch (error) {
      console.error('Failed to load questions:', error);
      // Fallback to sample questions if anything fails
      this.loadSampleQuestions();
      this.isLoaded = true;
      return false;
    }
  }

  private parseCSVString(csvContent: string) {
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/['"]/g, ''));
    
    console.log('CSV headers:', headers);
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = this.parseCSVLine(line);
      if (values.length < headers.length) continue;
      
      const question: Question = {
        id: values[0] || `q_${i}`,
        category: values[1] || 'General',
        question: values[2] || '',
        optionA: values[3] || '',
        optionB: values[4] || '',
        optionC: values[5] || '',
        optionD: values[6] || '',
        correctAnswer: values[7] || values[3],
        explanation: values[8] || 'No explanation provided.',
        level: (values[9]?.toLowerCase() as 'easy' | 'medium' | 'hard') || 'medium',
      };
      
      if (question.question) {
        this.questions.push(question);
      }
    }
    
    this.organizeQuestions();
  }

  private parseCSVLine(line: string): string[] {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result.map(item => item.replace(/^"|"$/g, ''));
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
    // Ensure questions are loaded
    if (!this.isLoaded) {
      await this.loadQuestions();
    }

    let availableQuestions = [...this.questions];

    // Filter by category if specified
    if (category && category !== 'general') {
      availableQuestions = availableQuestions.filter(
        (q) => q.category.toLowerCase() === category.toLowerCase()
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
      console.log('All questions used, resetting...');
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

    console.log(`Selected question: ${question.question}`);
    return question;
  }

  getCategories(): string[] {
    if (!this.isLoaded) {
      return ['Science', 'Mathematics', 'History', 'Geography', 'Literature', 'General'];
    }
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
      {
        id: '4',
        category: 'Science',
        question: 'What is the speed of light in vacuum?',
        optionA: '299,792,458 m/s',
        optionB: '300,000,000 m/s',
        optionC: '150,000,000 m/s',
        optionD: '500,000,000 m/s',
        correctAnswer: '299,792,458 m/s',
        explanation: 'The speed of light in vacuum is exactly 299,792,458 meters per second.',
        level: 'hard',
      },
      
      // Mathematics Questions
      {
        id: '5',
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
        id: '6',
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
        id: '7',
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
      {
        id: '8',
        category: 'Mathematics',
        question: 'What is the derivative of x²?',
        optionA: 'x',
        optionB: '2x',
        optionC: 'x²/2',
        optionD: '2x²',
        correctAnswer: '2x',
        explanation: 'Using the power rule: d/dx(x²) = 2x¹ = 2x',
        level: 'hard',
      },
      
      // History Questions
      {
        id: '9',
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
        id: '10',
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
      {
        id: '11',
        category: 'History',
        question: 'The Battle of Hastings took place in which year?',
        optionA: '1066',
        optionB: '1067',
        optionC: '1065',
        optionD: '1068',
        correctAnswer: '1066',
        explanation: 'The Battle of Hastings was fought on 14 October 1066.',
        level: 'hard',
      },
      
      // Geography Questions
      {
        id: '12',
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
        id: '13',
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
      {
        id: '14',
        category: 'Geography',
        question: 'What is the smallest country in the world?',
        optionA: 'Monaco',
        optionB: 'Vatican City',
        optionC: 'San Marino',
        optionD: 'Liechtenstein',
        correctAnswer: 'Vatican City',
        explanation: 'Vatican City is the smallest sovereign nation with an area of 0.17 square miles.',
        level: 'easy',
      },
      
      // Literature Questions
      {
        id: '15',
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
        id: '16',
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
      {
        id: '17',
        category: 'Literature',
        question: 'Who wrote "Pride and Prejudice"?',
        optionA: 'Charlotte Brontë',
        optionB: 'Emily Brontë',
        optionC: 'Jane Austen',
        optionD: 'George Eliot',
        correctAnswer: 'Jane Austen',
        explanation: 'Jane Austen published "Pride and Prejudice" in 1813.',
        level: 'medium',
      },
      
      // General Knowledge
      {
        id: '18',
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
        id: '19',
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
        id: '20',
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
      {
        id: '21',
        category: 'General',
        question: 'What is the currency of Japan?',
        optionA: 'Yuan',
        optionB: 'Won',
        optionC: 'Yen',
        optionD: 'Ringgit',
        correctAnswer: 'Yen',
        explanation: 'The Japanese yen is the official currency of Japan.',
        level: 'medium',
      },
      {
        id: '22',
        category: 'General',
        question: 'Which element has the chemical symbol "Au"?',
        optionA: 'Silver',
        optionB: 'Gold',
        optionC: 'Aluminum',
        optionD: 'Argon',
        correctAnswer: 'Gold',
        explanation: 'Au comes from the Latin word "aurum" meaning gold.',
        level: 'hard',
      },
    ];
    
    console.log('Sample questions loaded:', this.questions.length);
    this.organizeQuestions();
  }

  // Reset all used questions
  async resetUsedQuestions() {
    this.usedQuestionIds.clear();
    await this.saveUsedQuestions();
  }

  // Check if service is ready
  isReady(): boolean {
    return this.isLoaded && this.questions.length > 0;
  }
}

export const QuestionService = new QuestionServiceClass();