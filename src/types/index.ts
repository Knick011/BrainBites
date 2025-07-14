// Navigation Types
export type RootStackParamList = {
    Welcome: undefined;
    Home: undefined;
    Quiz: { category?: string; difficulty?: 'easy' | 'medium' | 'hard' };
    Categories: undefined;
    DailyGoals: undefined;
    Leaderboard: undefined;
  };
  
  // Question Types
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
  
  // User Types
  export interface UserStats {
    totalScore: number;
    totalQuestionsAnswered: number;
    correctAnswers: number;
    bestStreak: number;
    dailyStreak: number;
    lastPlayedDate: string;
    totalPlayTime: number;
    categoriesPlayed: { [key: string]: number };
    difficultyStats: {
      easy: { correct: number; total: number };
      medium: { correct: number; total: number };
      hard: { correct: number; total: number };
    };
    leaderboardRank: number;
  }
  
  export interface DailyGoal {
    id: string;
    description: string;
    target: number;
    current: number;
    reward: number;
    completed: boolean;
    type: 'questions' | 'streak' | 'accuracy' | 'time';
  }
  
  // Timer Types
  export interface TimerState {
    remainingTime: number;
    isRunning: boolean;
    negativeScore: number;
    isPaused: boolean;
  }
  
  // Sound Types
  export type SoundEffect = 
    | 'correct'
    | 'incorrect'
    | 'levelUp'
    | 'timerWarning'
    | 'buttonClick'
    | 'mascotPeek'
    | 'mascotHappy'
    | 'mascotSad'
    | 'streakStart'
    | 'streakContinue'
    | 'streakBreak'
    | 'goalComplete'
    | 'backgroundMusic';
  
  // Mascot Types
  export type MascotMood = 
    | 'peeking'
    | 'happy'
    | 'sad'
    | 'excited'
    | 'gamemode'
    | 'depressed';
  
  // Leaderboard Types
  export interface LeaderboardEntry {
    rank: number;
    name: string;
    score: number;
    questionsPerDay: number;
    streak: number;
    avatar: string;
    isPlayer?: boolean;
  }
  
  // Category Types
  export interface Category {
    id: string;
    name: string;
    icon: string;
    color: string;
    description: string;
    questionCount: number;
  }
  
  // Difficulty Types
  export interface DifficultyOption {
    level: 'easy' | 'medium' | 'hard';
    title: string;
    subtitle: string;
    color: string;
    icon: string;
    points: string;
    timeReward: number;
  }
  
  // Analytics Event Types
  export interface AnalyticsEvent {
    name: string;
    params?: { [key: string]: any };
    timestamp: number;
  }
  
  // AdMob Types
  export interface AdConfig {
    bannerId: string;
    interstitialId: string;
    rewardedId: string;
    testMode: boolean;
  }