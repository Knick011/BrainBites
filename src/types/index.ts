// src/types/index.ts - Complete TypeScript Types for BrainBites

// Navigation Types
export type RootStackParamList = {
  Welcome: undefined;
  Home: undefined;
  Quiz: { category?: string; difficulty?: 'easy' | 'medium' | 'hard' };
  Categories: undefined;
  DailyGoals: undefined;
  Leaderboard: undefined;
  Settings: undefined;
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
  type: 'questions' | 'streak' | 'accuracy' | 'time' | 'difficulty' | 'category' | 'perfect';
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
  | 'depressed'
  | 'below';

// Leaderboard Types
export interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  questionsPerDay: number;
  streak: number;
  avatar: string;
  isPlayer?: boolean;
  displayName?: string;
  highestStreak?: number;
  lastActive?: string;
  isCurrentUser?: boolean;
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

// Score Types
export interface ScoreInfo {
  dailyScore: number;
  currentStreak: number;
  highestStreak: number;
  streakLevel: number;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  questionsToday: number;
}

export interface ScoreResult {
  pointsEarned: number;
  newScore: number;
  newStreak: number;
  streakLevel: number;
  isMilestone: boolean;
}

// Timer Update Types
export interface TimerUpdateData {
  remainingTime: number;
  isTracking: boolean;
  debtTime: number;
  isAppForeground: boolean;
}

// Goal Types
export interface GoalTemplate {
  id: string;
  type: 'questions' | 'streak' | 'accuracy' | 'difficulty' | 'category' | 'perfect';
  target: number | string;
  minQuestions?: number;
  reward: number;
  title: string;
  description: string;
  icon: string;
  color: string;
}

export interface GoalProgress {
  current: number;
  target?: number;
  questionsAnswered?: number;
  completed: boolean;
  claimed: boolean;
}

// Quiz Stats Types
export interface TodayStats {
  totalQuestions: number;
  correctAnswers: number;
  categoryCounts: Record<string, number>;
  difficultyCounts: Record<string, number>;
  date: string;
  accuracy: number;
}

// Question Service Types
export interface AnsweredQuestion {
  correct: boolean;
  timestamp: string;
}

export interface QuestionStats {
  total: number;
  answered: number;
  correct: number;
  incorrect: number;
  remaining: number;
}

// Settings Types
export interface UserSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  notificationsEnabled: boolean;
  darkMode: boolean;
  username: string;
}

// Achievement Types
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  progress: number;
  target: number;
  completed: boolean;
  unlockedAt?: string;
  reward?: number;
}