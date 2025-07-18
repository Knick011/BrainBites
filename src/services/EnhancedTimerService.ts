// src/services/EnhancedTimerService.ts - TypeScript version with native integration
import { NativeModules, DeviceEventEmitter, Platform, AppState, AppStateStatus, EmitterSubscription } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TimerState } from '../types';

const { BrainBitesTimer } = NativeModules;

interface TimerUpdateData {
  remainingTime: number;
  isTracking: boolean;
  debtTime: number;
  isAppForeground: boolean;
}

type TimerListener = (data: TimerUpdateData) => void;

class EnhancedTimerService {
  private isInitialized: boolean = false;
  private listeners: TimerListener[] = [];
  private timerUpdateSubscription: EmitterSubscription | null = null;
  private appStateSubscription: EmitterSubscription | null = null;
  private currentTime: number = 0;
  private isTracking: boolean = false;
  private debtTime: number = 0;
  
  // Storage keys
  private readonly STORAGE_KEYS = {
    DEBT_TIME: '@BrainBites:debtTime',
    LAST_UPDATE: '@BrainBites:lastTimerUpdate'
  };

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Check if native module is available
      if (!BrainBitesTimer) {
        console.error('BrainBitesTimer native module not found');
        return;
      }
      
      // Start listening for timer updates
      BrainBitesTimer.startListening();
      
      // Subscribe to timer updates from native module
      this.timerUpdateSubscription = DeviceEventEmitter.addListener(
        'timerUpdate',
        this.handleTimerUpdate.bind(this)
      );
      
      // Handle app state changes
      this.appStateSubscription = AppState.addEventListener(
        'change',
        this.handleAppStateChange.bind(this)
      );
      
      // Load debt time
      await this.loadDebtTime();
      
      // Get current remaining time
      const remainingTime = await BrainBitesTimer.getRemainingTime();
      this.currentTime = remainingTime;
      
      // Start tracking
      await BrainBitesTimer.startTracking();
      
      this.isInitialized = true;
      console.log('EnhancedTimerService initialized');
    } catch (error) {
      console.error('Failed to initialize timer service:', error);
    }
  }

  private handleTimerUpdate(data: any): void {
    // Update from native module
    this.currentTime = data.remainingTime || 0;
    this.isTracking = data.isTracking || false;
    
    // Track debt time (negative time)
    if (this.currentTime < 0) {
      this.debtTime = Math.abs(this.currentTime);
      this.saveDebtTime();
    } else {
      this.debtTime = 0;
    }
    
    // Notify all listeners
    this.notifyListeners({
      remainingTime: this.currentTime,
      isTracking: this.isTracking,
      debtTime: this.debtTime,
      isAppForeground: data.isAppForeground || false
    });
  }

  private handleAppStateChange(nextAppState: AppStateStatus): void {
    // Notify native module of app state
    if (nextAppState === 'active') {
      BrainBitesTimer.notifyAppState('app_foreground');
    } else if (nextAppState === 'background') {
      BrainBitesTimer.notifyAppState('app_background');
    }
  }

  async addTimeCredits(seconds: number): Promise<void> {
    try {
      if (!BrainBitesTimer) {
        console.error('Timer module not available');
        return;
      }
      
      // If we have debt time, reduce it first
      if (this.debtTime > 0) {
        const remainingCredits = seconds - this.debtTime;
        if (remainingCredits > 0) {
          // Paid off debt, add remaining time
          this.debtTime = 0;
          await BrainBitesTimer.addTime(remainingCredits);
        } else {
          // Reduced debt
          this.debtTime -= seconds;
        }
        await this.saveDebtTime();
      } else {
        // No debt, add time directly
        await BrainBitesTimer.addTime(seconds);
      }
      
      console.log(`Added ${seconds} seconds of time credit`);
    } catch (error) {
      console.error('Failed to add time credits:', error);
    }
  }

  async setTime(seconds: number): Promise<void> {
    try {
      if (!BrainBitesTimer) {
        console.error('Timer module not available');
        return;
      }
      
      await BrainBitesTimer.setScreenTime(seconds);
      this.currentTime = seconds;
      
      // Clear debt if setting positive time
      if (seconds > 0) {
        this.debtTime = 0;
        await this.saveDebtTime();
      }
      
      console.log(`Set timer to ${seconds} seconds`);
    } catch (error) {
      console.error('Failed to set time:', error);
    }
  }

  async startTracking(): Promise<void> {
    try {
      if (!BrainBitesTimer) return;
      await BrainBitesTimer.startTracking();
      this.isTracking = true;
    } catch (error) {
      console.error('Failed to start tracking:', error);
    }
  }

  async stopTracking(): Promise<void> {
    try {
      if (!BrainBitesTimer) return;
      await BrainBitesTimer.stopTracking();
      this.isTracking = false;
    } catch (error) {
      console.error('Failed to stop tracking:', error);
    }
  }

  async getRemainingTime(): Promise<number> {
    try {
      if (!BrainBitesTimer) return 0;
      const time = await BrainBitesTimer.getRemainingTime();
      return time;
    } catch (error) {
      console.error('Failed to get remaining time:', error);
      return 0;
    }
  }

  private async loadDebtTime(): Promise<void> {
    try {
      const saved = await AsyncStorage.getItem(this.STORAGE_KEYS.DEBT_TIME);
      if (saved) {
        this.debtTime = parseInt(saved, 10) || 0;
      }
    } catch (error) {
      console.error('Failed to load debt time:', error);
    }
  }

  private async saveDebtTime(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.DEBT_TIME, 
        this.debtTime.toString()
      );
    } catch (error) {
      console.error('Failed to save debt time:', error);
    }
  }

  // Format time for display (handles negative time)
  formatTime(seconds: number): string {
    const isNegative = seconds < 0;
    const absSeconds = Math.abs(seconds);
    
    const hours = Math.floor(absSeconds / 3600);
    const minutes = Math.floor((absSeconds % 3600) / 60);
    const secs = absSeconds % 60;
    
    let formatted = '';
    if (hours > 0) {
      formatted = `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      formatted = `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
    
    return isNegative ? `-${formatted}` : formatted;
  }

  // Subscribe to timer updates
  subscribe(listener: TimerListener): () => void {
    this.listeners.push(listener);
    
    // Send current state immediately
    listener({
      remainingTime: this.currentTime,
      isTracking: this.isTracking,
      debtTime: this.debtTime,
      isAppForeground: false
    });
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(data: TimerUpdateData): void {
    this.listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error('Timer listener error:', error);
      }
    });
  }

  // Calculate point deduction for debt time
  getDebtPenalty(): number {
    // -10 points per minute of debt
    return Math.floor(this.debtTime / 60) * 10;
  }

  cleanup(): void {
    if (this.timerUpdateSubscription) {
      this.timerUpdateSubscription.remove();
    }
    
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }
    
    if (BrainBitesTimer && BrainBitesTimer.stopListening) {
      BrainBitesTimer.stopListening();
    }
    
    this.listeners = [];
    this.isInitialized = false;
  }
}

export default new EnhancedTimerService();