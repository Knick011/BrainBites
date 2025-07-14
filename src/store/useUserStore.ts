import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { startOfDay, differenceInDays } from 'date-fns';

interface DailyGoal {
  id: string;
  description: string;
  target: number;
  current: number;
  reward: number; // minutes
  completed: boolean;
  type: 'questions' | 'streak' | 'accuracy' | 'time';
}

interface UserStats {
  totalScore: number;
  totalQuestionsAnswered: number;
  correctAnswers: number;
  bestStreak: number;
  dailyStreak: number;
  lastPlayedDate: string;
  totalPlayTime: number; // minutes
  categoriesPlayed: { [key: string]: number };
  difficultyStats: {
    easy: { correct: number; total: number };
    medium: { correct: number; total: number };
    hard: { correct: number; total: number };
  };
  leaderboardRank: number;
}

interface UserState {
  username: string;
  isFirstTime: boolean;
  stats: UserStats;
  dailyGoals: DailyGoal[];
  flowStreak: number;
  lastFlowDate: string;
  
  // Actions
  setUsername: (name: string) => void;
  setFirstTime: (isFirst: boolean) => void;
  updateStats: (updates: Partial<UserStats>) => void;
  incrementScore: (points: number) => void;
  recordAnswer: (correct: boolean, category: string, difficulty: string) => void;
  updateStreak: (newStreak: number) => void;
  checkDailyGoals: () => void;
  completeGoal: (goalId: string) => void;
  updateFlow: () => void;
  generateDailyGoals: () => void;
  saveData: () => Promise<void>;
  loadData: () => Promise<void>;
  initializeApp: () => Promise<void>;
  updateLeaderboardRank: () => void;
}

const STORAGE_KEY = '@BrainBites:userData';

// Generate fake leaderboard data
const generateLeaderboardPosition = (score: number, questionsPerDay: number): number => {
  // Simulate ranking based on score and activity
  const baseRank = 10000 - Math.floor(score / 100);
  const activityBonus = Math.floor(questionsPerDay * 50);
  const randomVariance = Math.floor(Math.random() * 500) - 250;
  
  return Math.max(1, baseRank - activityBonus + randomVariance);
};

export const useUserStore = create<UserState>((set, get) => ({
  username: 'Player',
  isFirstTime: true,
  stats: {
    totalScore: 0,
    totalQuestionsAnswered: 0,
    correctAnswers: 0,
    bestStreak: 0,
    dailyStreak: 0,
    lastPlayedDate: new Date().toISOString(),
    totalPlayTime: 0,
    categoriesPlayed: {},
    difficultyStats: {
      easy: { correct: 0, total: 0 },
      medium: { correct: 0, total: 0 },
      hard: { correct: 0, total: 0 },
    },
    leaderboardRank: 9999,
  },
  dailyGoals: [],
  flowStreak: 0,
  lastFlowDate: '',

  setUsername: (name) => set({ username: name }),
  setFirstTime: (isFirst) => set({ isFirstTime: isFirst }),

  updateStats: (updates) =>
    set((state) => ({
      stats: { ...state.stats, ...updates },
    })),

  incrementScore: (points) =>
    set((state) => {
      const newState = {
        stats: {
          ...state.stats,
          totalScore: state.stats.totalScore + points,
        },
      };
      
      // Auto-save after score changes
      setTimeout(() => {
        get().saveData();
      }, 1000);
      
      return newState;
    }),

  recordAnswer: (correct, category, difficulty) =>
    set((state) => {
      const newStats = { ...state.stats };
      newStats.totalQuestionsAnswered++;
      
      if (correct) {
        newStats.correctAnswers++;
      }
      
      // Update category stats
      if (!newStats.categoriesPlayed[category]) {
        newStats.categoriesPlayed[category] = 0;
      }
      newStats.categoriesPlayed[category]++;
      
      // Update difficulty stats
      const diffKey = difficulty.toLowerCase() as 'easy' | 'medium' | 'hard';
      newStats.difficultyStats[diffKey].total++;
      if (correct) {
        newStats.difficultyStats[diffKey].correct++;
      }
      
      // Auto-save after answer recording
      setTimeout(() => {
        get().saveData();
      }, 1000);
      
      return { stats: newStats };
    }),

  updateStreak: (newStreak) =>
    set((state) => ({
      stats: {
        ...state.stats,
        bestStreak: Math.max(state.stats.bestStreak, newStreak),
      },
    })),

  checkDailyGoals: () => {
    const state = get();
    const updatedGoals = state.dailyGoals.map((goal) => {
      if (goal.completed) return goal;
      
      let current = 0;
      switch (goal.type) {
        case 'questions':
          current = state.stats.totalQuestionsAnswered;
          break;
        case 'streak':
          current = state.stats.bestStreak;
          break;
        case 'accuracy':
          current = state.stats.correctAnswers > 0
            ? Math.round((state.stats.correctAnswers / state.stats.totalQuestionsAnswered) * 100)
            : 0;
          break;
        case 'time':
          current = state.stats.totalPlayTime;
          break;
      }
      
      const completed = current >= goal.target;
      return { ...goal, current, completed };
    });
    
    set({ dailyGoals: updatedGoals });
  },

  completeGoal: (goalId) =>
    set((state) => ({
      dailyGoals: state.dailyGoals.map((goal) =>
        goal.id === goalId ? { ...goal, completed: true } : goal
      ),
    })),

  updateFlow: () => {
    const today = startOfDay(new Date()).toISOString();
    const state = get();
    
    if (state.lastFlowDate === today) {
      // Already updated today
      return;
    }
    
    const lastFlow = state.lastFlowDate ? new Date(state.lastFlowDate) : null;
    const daysSinceLastFlow = lastFlow ? differenceInDays(new Date(), lastFlow) : 0;
    
    if (daysSinceLastFlow === 1) {
      // Consecutive day
      set({ flowStreak: state.flowStreak + 1, lastFlowDate: today });
    } else if (daysSinceLastFlow > 1) {
      // Streak broken
      set({ flowStreak: 1, lastFlowDate: today });
    } else {
      // First time or same day
      set({ flowStreak: state.flowStreak || 1, lastFlowDate: today });
    }
  },

  updateLeaderboardRank: () => {
    const state = get();
    const questionsPerDay = state.stats.totalQuestionsAnswered / Math.max(1, state.flowStreak);
    const newRank = generateLeaderboardPosition(state.stats.totalScore, questionsPerDay);
    
    set((state) => ({
      stats: { ...state.stats, leaderboardRank: newRank },
    }));
  },

  generateDailyGoals: () => {
    const goals: DailyGoal[] = [
      {
        id: '1',
        description: 'Answer 15 questions correctly',
        target: 15,
        current: 0,
        reward: 60,
        completed: false,
        type: 'questions',
      },
      {
        id: '2',
        description: 'Achieve a 10 question streak',
        target: 10,
        current: 0,
        reward: 45,
        completed: false,
        type: 'streak',
      },
      {
        id: '3',
        description: 'Maintain 80% accuracy',
        target: 80,
        current: 0,
        reward: 30,
        completed: false,
        type: 'accuracy',
      },
      {
        id: '4',
        description: 'Study for 30 minutes',
        target: 30,
        current: 0,
        reward: 90,
        completed: false,
        type: 'time',
      },
    ];
    
    set({ dailyGoals: goals });
  },

  saveData: async () => {
    try {
      const state = get();
      const dataToSave = {
        username: state.username,
        isFirstTime: state.isFirstTime,
        stats: state.stats,
        dailyGoals: state.dailyGoals,
        flowStreak: state.flowStreak,
        lastFlowDate: state.lastFlowDate,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      console.log('User data saved successfully');
    } catch (error) {
      console.error('Failed to save user data:', error);
      // Try to save critical data even if full save fails
      try {
        const criticalData = {
          username: get().username,
          stats: get().stats,
        };
        await AsyncStorage.setItem(`${STORAGE_KEY}_backup`, JSON.stringify(criticalData));
      } catch (backupError) {
        console.error('Failed to save backup data:', backupError);
      }
    }
  },

  loadData: async () => {
    try {
      const savedData = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        set(parsed);
        console.log('User data loaded successfully');
      } else {
        // Try to load from backup
        const backupData = await AsyncStorage.getItem(`${STORAGE_KEY}_backup`);
        if (backupData) {
          const parsed = JSON.parse(backupData);
          set(parsed);
          console.log('User data loaded from backup');
        }
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
      // Reset to default state if loading fails
      set({
        username: 'Player',
        isFirstTime: true,
        stats: {
          totalScore: 0,
          totalQuestionsAnswered: 0,
          correctAnswers: 0,
          bestStreak: 0,
          dailyStreak: 0,
          lastPlayedDate: new Date().toISOString(),
          totalPlayTime: 0,
          categoriesPlayed: {},
          difficultyStats: {
            easy: { correct: 0, total: 0 },
            medium: { correct: 0, total: 0 },
            hard: { correct: 0, total: 0 },
          },
          leaderboardRank: 9999,
        },
        dailyGoals: [],
        flowStreak: 0,
        lastFlowDate: '',
      });
    }
  },

  initializeApp: async () => {
    await get().loadData();
    get().updateFlow();
    
    // Generate daily goals if it's a new day
    const today = startOfDay(new Date()).toISOString();
    const lastGoalDate = await AsyncStorage.getItem('@BrainBites:lastGoalDate');
    
    if (lastGoalDate !== today) {
      get().generateDailyGoals();
      await AsyncStorage.setItem('@BrainBites:lastGoalDate', today);
    }
    
    get().updateLeaderboardRank();
  },
}));