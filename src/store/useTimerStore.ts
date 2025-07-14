import { create } from 'zustand';
import { TimerService } from '../services/TimerService';

interface TimerState {
  remainingTime: number;
  isRunning: boolean;
  negativeScore: number;
  isPaused: boolean;
  
  // Actions
  setRemainingTime: (time: number) => void;
  setIsRunning: (running: boolean) => void;
  setNegativeScore: (score: number) => void;
  setPaused: (paused: boolean) => void;
  addTime: (minutes: number) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
}

export const useTimerStore = create<TimerState>((set, get) => ({
  remainingTime: 0,
  isRunning: false,
  negativeScore: 0,
  isPaused: false,

  setRemainingTime: (time) => set({ remainingTime: time }),
  setIsRunning: (running) => set({ isRunning: running }),
  setNegativeScore: (score) => set({ negativeScore: score }),
  setPaused: (paused) => set({ isPaused: paused }),

  addTime: async (minutes) => {
    await TimerService.addTime(minutes);
    // Timer service will update the store via updateTimer
  },

  pauseTimer: async () => {
    await TimerService.pauseTimer();
    set({ isPaused: true });
  },

  resumeTimer: async () => {
    await TimerService.resumeTimer();
    set({ isPaused: false });
  },
}));