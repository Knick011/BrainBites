import AsyncStorage from '@react-native-async-storage/async-storage';
import BackgroundTimer from 'react-native-background-timer';
import DeviceInfo from 'react-native-device-info';
import { AppState, AppStateStatus, NativeModules, Platform } from 'react-native';
import { useTimerStore } from '../store/useTimerStore';

interface TimerData {
  startTime: number;
  duration: number;
  pausedDuration: number;
  lastPauseTime: number | null;
  isNegative: boolean;
  negativeStartTime: number | null;
  totalScreenOnTime: number;
  lastScreenCheckTime: number;
}

class TimerServiceClass {
  private timerData: TimerData;
  private backgroundTimer: number | null = null;
  private appState: AppStateStatus = 'active';
  private screenListenerInterval: number | null = null;
  private TIMER_KEY = '@BrainBites:timer';
  private isInitialized = false;
  private appStateSubscription: any = null;

  constructor() {
    this.timerData = {
      startTime: Date.now(),
      duration: 0,
      pausedDuration: 0,
      lastPauseTime: null,
      isNegative: false,
      negativeStartTime: null,
      totalScreenOnTime: 0,
      lastScreenCheckTime: Date.now(),
    };
  }

  async initialize() {
    if (this.isInitialized) return;
    
    // Load saved timer data
    await this.loadTimerData();
    
    // Setup app state listener
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);
    
    // Start background timer
    this.startBackgroundTimer();
    
    // Monitor screen state
    this.startScreenMonitoring();
    
    this.isInitialized = true;
  }

  private handleAppStateChange = async (nextAppState: AppStateStatus) => {
    const previousState = this.appState;
    this.appState = nextAppState;

    if (nextAppState === 'active') {
      // App came to foreground - pause timer
      await this.pauseTimer();
    } else if (previousState === 'active') {
      // App went to background - start timer if screen is on
      const isScreenOn = await this.isScreenOn();
      if (isScreenOn) {
        await this.resumeTimer();
      }
    }
  };

  private async isScreenOn(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        const PowerManager = NativeModules.PowerManager;
        if (PowerManager && PowerManager.isScreenOn) {
          return await PowerManager.isScreenOn();
        }
      }
      // Fallback: assume screen is on
      return true;
    } catch {
      return true;
    }
  }

  private startScreenMonitoring() {
    // Check screen state every 5 seconds
    this.screenListenerInterval = BackgroundTimer.setInterval(async () => {
      const isScreenOn = await this.isScreenOn();
      const now = Date.now();
      
      if (isScreenOn && this.appState !== 'active') {
        // Screen is on and app is not active - count this time
        this.timerData.totalScreenOnTime += now - this.timerData.lastScreenCheckTime;
      }
      
      this.timerData.lastScreenCheckTime = now;
      await this.saveTimerData();
    }, 5000);
  }

  private startBackgroundTimer() {
    // Update timer every second
    this.backgroundTimer = BackgroundTimer.setInterval(async () => {
      await this.updateTimer();
    }, 1000);
  }

  async updateTimer() {
    const store = useTimerStore.getState();
    const remaining = await this.calculateRemainingTime();
    
    store.setRemainingTime(remaining);
    
    if (remaining < 0 && !this.timerData.isNegative) {
      this.timerData.isNegative = true;
      this.timerData.negativeStartTime = Date.now();
      await this.saveTimerData();
    }
    
    if (this.timerData.isNegative) {
      const negativeTime = Date.now() - this.timerData.negativeStartTime!;
      const negativeScore = Math.floor(negativeTime / 60000); // 1 point per minute
      store.setNegativeScore(negativeScore);
    }
  }

  async calculateRemainingTime(): Promise<number> {
    const now = Date.now();
    const elapsed = this.timerData.totalScreenOnTime;
    const remaining = this.timerData.duration - elapsed;
    return remaining;
  }

  async addTime(minutes: number) {
    const milliseconds = minutes * 60 * 1000;
    this.timerData.duration += milliseconds;
    
    // If timer was negative, check if we're back to positive
    if (this.timerData.isNegative && this.timerData.duration > this.timerData.totalScreenOnTime) {
      this.timerData.isNegative = false;
      this.timerData.negativeStartTime = null;
      useTimerStore.getState().setNegativeScore(0);
    }
    
    await this.saveTimerData();
    await this.updateTimer();
  }

  async pauseTimer() {
    if (!this.timerData.lastPauseTime) {
      this.timerData.lastPauseTime = Date.now();
      await this.saveTimerData();
    }
  }

  async resumeTimer() {
    if (this.timerData.lastPauseTime) {
      const pauseDuration = Date.now() - this.timerData.lastPauseTime;
      this.timerData.pausedDuration += pauseDuration;
      this.timerData.lastPauseTime = null;
      await this.saveTimerData();
    }
  }

  private async saveTimerData() {
    try {
      await AsyncStorage.setItem(this.TIMER_KEY, JSON.stringify(this.timerData));
    } catch (error) {
      console.error('Failed to save timer data:', error);
    }
  }

  private async loadTimerData() {
    try {
      const data = await AsyncStorage.getItem(this.TIMER_KEY);
      if (data) {
        this.timerData = JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load timer data:', error);
    }
  }

  cleanup() {
    if (this.backgroundTimer) {
      BackgroundTimer.clearInterval(this.backgroundTimer);
    }
    if (this.screenListenerInterval) {
      BackgroundTimer.clearInterval(this.screenListenerInterval);
    }
    if (this.appStateSubscription && typeof this.appStateSubscription.remove === 'function') {
      this.appStateSubscription.remove();
    }
  }

  // Get formatted time string
  getFormattedTime(milliseconds: number): string {
    const isNegative = milliseconds < 0;
    const absTime = Math.abs(milliseconds);
    
    const hours = Math.floor(absTime / 3600000);
    const minutes = Math.floor((absTime % 3600000) / 60000);
    const seconds = Math.floor((absTime % 60000) / 1000);
    
    const formatted = `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    return isNegative ? `-${formatted}` : formatted;
  }
}

export const TimerService = new TimerServiceClass();