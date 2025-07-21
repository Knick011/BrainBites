// src/services/EnhancedTimerService.ts
import { NativeModules, DeviceEventEmitter, Platform, AppState, AppStateStatus, EmitterSubscription } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Native module interface
interface BrainBitesTimerNative {
  startListening(): void;
  stopListening(): void;
  startTracking(): Promise<boolean>;
  stopTracking(): Promise<boolean>;
  addTimeCredits(seconds: number): Promise<number>;
  getRemainingTime(): Promise<number>;
  getTimerStatus(): Promise<TimerStatus>;
  notifyAppState(state: string): void;
  resetTimer(): Promise<boolean>;
  
  // Constants
  EVENT_TIMER_UPDATE: string;
  EVENT_SCREEN_STATE_CHANGED: string;
  EVENT_APP_STATE_CHANGED: string;
}

// Type definitions
export interface TimerStatus {
  remainingTime: number;
  isTracking: boolean;
  debtTime: number;
  isScreenOn: boolean;
  isAppForeground: boolean;
  lastUpdate: number;
}

export interface TimerUpdateData {
  remainingTime: number;
  isTracking: boolean;
  debtTime: number;
  isScreenOn: boolean;
  isAppForeground: boolean;
  timestamp: number;
}

export interface ScreenStateData {
  isScreenOn: boolean;
  timestamp: number;
}

export interface AppStateData {
  state: string;
  isForeground: boolean;
  timestamp: number;
}

export interface TimeRewardConfig {
  easy: number;    // 60 seconds
  medium: number;  // 90 seconds
  hard: number;    // 120 seconds
  dailyTask: number; // 3600 seconds (1 hour)
  streakBonus: number; // 30 seconds per 5-question milestone
}

type TimerListener = (data: TimerUpdateData) => void;
type ScreenStateListener = (data: ScreenStateData) => void;
type AppStateChangeListener = (data: AppStateData) => void;

class EnhancedTimerService {
  private nativeModule: BrainBitesTimerNative;
  private isInitialized: boolean = false;
  private listeners: TimerListener[] = [];
  private screenStateListeners: ScreenStateListener[] = [];
  private appStateListeners: AppStateChangeListener[] = [];
  
  // Event subscriptions
  private timerUpdateSubscription: EmitterSubscription | null = null;
  private screenStateSubscription: EmitterSubscription | null = null;
  private appStateSubscription: EmitterSubscription | null = null;
  private reactNativeAppStateSubscription: EmitterSubscription | null = null;
  
  // Current state cache
  private currentStatus: TimerStatus | null = null;
  
  // Storage keys
  private readonly STORAGE_KEYS = {
    TIMER_PREFERENCES: '@BrainBites:timerPreferences',
    DAILY_REWARDS: '@BrainBites:dailyRewards',
    USAGE_STATS: '@BrainBites:usageStats'
  };
  
  // Time reward configuration
  private readonly TIME_REWARDS: TimeRewardConfig = {
    easy: 60,      // 1 minute
    medium: 90,    // 1.5 minutes
    hard: 120,     // 2 minutes
    dailyTask: 3600, // 1 hour
    streakBonus: 30  // 30 seconds per milestone
  };

  constructor() {
    if (Platform.OS === 'android') {
      this.nativeModule = NativeModules.BrainBitesTimer;
      if (!this.nativeModule) {
        console.error('BrainBitesTimer native module not found');
        throw new Error('BrainBitesTimer native module not available');
      }
    } else {
      // iOS fallback - implement basic timer logic
      console.warn('Enhanced timer service only available on Android');
      this.nativeModule = this.createFallbackModule();
    }
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      console.log('Initializing Enhanced Timer Service...');
      
      // Start listening for screen state changes
      this.nativeModule.startListening();
      
      // Subscribe to native events
      this.setupEventListeners();
      
      // Subscribe to React Native app state changes
      this.setupAppStateListener();
      
      // Get initial timer status
      await this.refreshStatus();
      
      this.isInitialized = true;
      console.log('Enhanced Timer Service initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize Enhanced Timer Service:', error);
      throw error;
    }
  }

  private setupEventListeners(): void {
    // Timer update events
    this.timerUpdateSubscription = DeviceEventEmitter.addListener(
      this.nativeModule.EVENT_TIMER_UPDATE,
      (data: TimerUpdateData) => {
        console.log('Timer update received:', data);
        this.currentStatus = {
          remainingTime: data.remainingTime,
          isTracking: data.isTracking,
          debtTime: data.debtTime,
          isScreenOn: data.isScreenOn,
          isAppForeground: data.isAppForeground,
          lastUpdate: data.timestamp
        };
        this.notifyTimerListeners(data);
      }
    );

    // Screen state change events
    this.screenStateSubscription = DeviceEventEmitter.addListener(
      this.nativeModule.EVENT_SCREEN_STATE_CHANGED,
      (data: ScreenStateData) => {
        console.log('Screen state changed:', data);
        this.notifyScreenStateListeners(data);
      }
    );

    // App state change events (from native)
    this.appStateSubscription = DeviceEventEmitter.addListener(
      this.nativeModule.EVENT_APP_STATE_CHANGED,
      (data: AppStateData) => {
        console.log('App state changed (native):', data);
        this.notifyAppStateListeners(data);
      }
    );
  }

  private setupAppStateListener(): void {
    // React Native app state listener
    this.reactNativeAppStateSubscription = AppState.addEventListener(
      'change',
      (nextAppState: AppStateStatus) => {
        console.log('App state changed (RN):', nextAppState);
        
        // Notify native module
        const stateString = nextAppState === 'active' ? 'app_foreground' : 'app_background';
        this.nativeModule.notifyAppState(stateString);
      }
    );
  }

  async startTracking(): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    try {
      const result = await this.nativeModule.startTracking();
      await this.refreshStatus();
      console.log('Timer tracking started');
      return result;
    } catch (error) {
      console.error('Failed to start timer tracking:', error);
      throw error;
    }
  }

  async stopTracking(): Promise<boolean> {
    try {
      const result = await this.nativeModule.stopTracking();
      await this.refreshStatus();
      console.log('Timer tracking stopped');
      return result;
    } catch (error) {
      console.error('Failed to stop timer tracking:', error);
      throw error;
    }
  }

  async addTimeCredits(seconds: number): Promise<number> {
    try {
      console.log(`Adding ${seconds} seconds of time credits`);
      const newTotal = await this.nativeModule.addTimeCredits(seconds);
      await this.refreshStatus();
      
      // Log the reward for analytics
      await this.logTimeReward(seconds);
      
      return newTotal;
    } catch (error) {
      console.error('Failed to add time credits:', error);
      throw error;
    }
  }

  async addQuizReward(
    difficulty: 'easy' | 'medium' | 'hard',
    isCorrect: boolean,
    responseTimeMs: number,
    streakCount: number = 0
  ): Promise<number> {
    if (!isCorrect) {
      console.log('No time reward for incorrect answer');
      return 0;
    }

    const reward = this.calculateQuizReward(difficulty, responseTimeMs, streakCount);
    
    if (reward > 0) {
      console.log(`Quiz reward: ${reward}s for ${difficulty} question (${responseTimeMs}ms, streak: ${streakCount})`);
      return await this.addTimeCredits(reward);
    }
    
    return 0;
  }

  async addDailyTaskReward(): Promise<number> {
    const reward = this.TIME_REWARDS.dailyTask;
    console.log(`Daily task reward: ${reward}s`);
    return await this.addTimeCredits(reward);
  }

  private calculateQuizReward(
    difficulty: 'easy' | 'medium' | 'hard',
    responseTimeMs: number,
    streakCount: number
  ): number {
    // Base reward by difficulty
    let baseReward = this.TIME_REWARDS[difficulty];

    // Speed bonus: up to 30 seconds for answers under 5 seconds
    let speedBonus = 0;
    if (responseTimeMs < 5000) {
      speedBonus = 30 - Math.floor(responseTimeMs / 1000) * 6;
      speedBonus = Math.max(0, speedBonus);
    }

    // Streak bonus: 30 seconds for every 5-question milestone
    const streakBonus = Math.floor(streakCount / 5) * this.TIME_REWARDS.streakBonus;

    const totalReward = baseReward + speedBonus + streakBonus;
    
    console.log(`Reward calculation: base(${baseReward}) + speed(${speedBonus}) + streak(${streakBonus}) = ${totalReward}`);
    
    return totalReward;
  }

  async getRemainingTime(): Promise<number> {
    try {
      return await this.nativeModule.getRemainingTime();
    } catch (error) {
      console.error('Failed to get remaining time:', error);
      return 0;
    }
  }

  async getTimerStatus(): Promise<TimerStatus> {
    try {
      const status = await this.nativeModule.getTimerStatus();
      this.currentStatus = status;
      return status;
    } catch (error) {
      console.error('Failed to get timer status:', error);
      return this.currentStatus || {
        remainingTime: 0,
        isTracking: false,
        debtTime: 0,
        isScreenOn: true,
        isAppForeground: true,
        lastUpdate: Date.now()
      };
    }
  }

  async refreshStatus(): Promise<void> {
    await this.getTimerStatus();
  }

  async resetTimer(): Promise<boolean> {
    try {
      const result = await this.nativeModule.resetTimer();
      await this.refreshStatus();
      console.log('Timer reset');
      return result;
    } catch (error) {
      console.error('Failed to reset timer:', error);
      throw error;
    }
  }

  // Listener management
  subscribeToTimerUpdates(listener: TimerListener): () => void {
    this.listeners.push(listener);
    
    // Send current status immediately if available
    if (this.currentStatus) {
      listener({
        ...this.currentStatus,
        timestamp: Date.now()
      });
    }
    
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  subscribeToScreenState(listener: ScreenStateListener): () => void {
    this.screenStateListeners.push(listener);
    return () => {
      this.screenStateListeners = this.screenStateListeners.filter(l => l !== listener);
    };
  }

  subscribeToAppState(listener: AppStateChangeListener): () => void {
    this.appStateListeners.push(listener);
    return () => {
      this.appStateListeners = this.appStateListeners.filter(l => l !== listener);
    };
  }

  private notifyTimerListeners(data: TimerUpdateData): void {
    this.listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error('Timer listener error:', error);
      }
    });
  }

  private notifyScreenStateListeners(data: ScreenStateData): void {
    this.screenStateListeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error('Screen state listener error:', error);
      }
    });
  }

  private notifyAppStateListeners(data: AppStateData): void {
    this.appStateListeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error('App state listener error:', error);
      }
    });
  }

  // Utility methods
  formatTime(seconds: number): string {
    const isNegative = seconds < 0;
    const absSeconds = Math.abs(seconds);
    
    const hours = Math.floor(absSeconds / 3600);
    const minutes = Math.floor((absSeconds % 3600) / 60);
    const secs = Math.floor(absSeconds % 60);
    
    let formatted = '';
    if (hours > 0) {
      formatted = `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      formatted = `${minutes}m ${secs}s`;
    } else {
      formatted = `${secs}s`;
    }
    
    return isNegative ? `-${formatted}` : formatted;
  }

  calculateDebtPenalty(): number {
    if (!this.currentStatus) return 0;
    
    // 10 points penalty per minute of debt
    const debtMinutes = Math.floor(this.currentStatus.debtTime / 60);
    return debtMinutes * 10;
  }

  isInDebt(): boolean {
    return this.currentStatus ? this.currentStatus.debtTime > 0 : false;
  }

  // Analytics and logging
  private async logTimeReward(seconds: number): Promise<void> {
    try {
      const today = new Date().toDateString();
      const rewards = await AsyncStorage.getItem(this.STORAGE_KEYS.DAILY_REWARDS);
      const dailyRewards = rewards ? JSON.parse(rewards) : {};
      
      if (!dailyRewards[today]) {
        dailyRewards[today] = { total: 0, count: 0 };
      }
      
      dailyRewards[today].total += seconds;
      dailyRewards[today].count += 1;
      
      await AsyncStorage.setItem(this.STORAGE_KEYS.DAILY_REWARDS, JSON.stringify(dailyRewards));
    } catch (error) {
      console.error('Failed to log time reward:', error);
    }
  }

  async getDailyRewardStats(): Promise<{ total: number; count: number }> {
    try {
      const today = new Date().toDateString();
      const rewards = await AsyncStorage.getItem(this.STORAGE_KEYS.DAILY_REWARDS);
      const dailyRewards = rewards ? JSON.parse(rewards) : {};
      
      return dailyRewards[today] || { total: 0, count: 0 };
    } catch (error) {
      console.error('Failed to get daily reward stats:', error);
      return { total: 0, count: 0 };
    }
  }

  // Fallback module for iOS
  private createFallbackModule(): BrainBitesTimerNative {
    return {
      startListening: () => console.log('Timer listening (fallback)'),
      stopListening: () => console.log('Timer stopped listening (fallback)'),
      startTracking: () => Promise.resolve(true),
      stopTracking: () => Promise.resolve(true),
      addTimeCredits: (seconds: number) => Promise.resolve(seconds),
      getRemainingTime: () => Promise.resolve(0),
      getTimerStatus: () => Promise.resolve({
        remainingTime: 0,
        isTracking: false,
        debtTime: 0,
        isScreenOn: true,
        isAppForeground: true,
        lastUpdate: Date.now()
      }),
      notifyAppState: (state: string) => console.log('App state:', state),
      resetTimer: () => Promise.resolve(true),
      EVENT_TIMER_UPDATE: 'timerUpdate',
      EVENT_SCREEN_STATE_CHANGED: 'screenStateChanged',
      EVENT_APP_STATE_CHANGED: 'appStateChanged'
    };
  }

  // Cleanup
  destroy(): void {
    console.log('Destroying Enhanced Timer Service');
    
    if (this.timerUpdateSubscription) {
      this.timerUpdateSubscription.remove();
    }
    
    if (this.screenStateSubscription) {
      this.screenStateSubscription.remove();
    }
    
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }
    
    if (this.reactNativeAppStateSubscription) {
      this.reactNativeAppStateSubscription.remove();
    }
    
    if (Platform.OS === 'android' && this.nativeModule) {
      this.nativeModule.stopListening();
    }
    
    this.listeners = [];
    this.screenStateListeners = [];
    this.appStateListeners = [];
    this.isInitialized = false;
  }
}

// Export singleton instance
export default new EnhancedTimerService();

// Export types for use in other files
export type {
  TimerStatus,
  TimerUpdateData,
  ScreenStateData,
  AppStateData,
  TimeRewardConfig,
  TimerListener,
  ScreenStateListener,
  AppStateChangeListener
};