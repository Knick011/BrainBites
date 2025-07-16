// src/services/EnhancedTimerService.ts
import { AppState, Platform, NativeModules, DeviceEventEmitter, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Type for native module (will be undefined if not available)
const { BrainBitesTimer } = NativeModules as { BrainBitesTimer?: any };

interface TimerEventData {
  event: string;
  [key: string]: any;
}

interface TimerListener {
  (data: TimerEventData): void;
}

interface TrackingStatus {
  isTracking: boolean;
  isBrainBitesActive: boolean;
  appState: AppStateStatus;
  availableTime: number;
}

interface DebugInfo {
  availableTime: number;
  formattedTime: string;
  isRunning: boolean;
  isBrainBitesActive: boolean;
  appState: AppStateStatus;
  useNativeTimer: boolean;
  hasTimer?: boolean;
}

class EnhancedTimerService {
  private availableTime: number = 0;
  private listeners: TimerListener[] = [];
  private readonly STORAGE_KEY = 'brainbites_timer_data';
  private appState: AppStateStatus = AppState.currentState;
  private isBrainBitesActive: boolean = true;
  private isInitialized: boolean = false;
  
  // Use native timer on Android
  private useNativeTimer: boolean = Platform.OS === 'android' && !!BrainBitesTimer;
  
  private appStateSubscription: any;
  private subscription: any;
  
  private sessionStartTime: number = Date.now();
  private lastActiveTime: number = Date.now();
  private totalSessionTime: number = 0;
  private isTrackingSession: boolean = false;
  
  constructor() {
    if (this.useNativeTimer) {
      console.log('Using native Android timer service');
      this.setupNativeTimer();
    } else {
      console.log('Using JavaScript timer fallback');
    }
    
    // Listen to app state changes
    this.appStateSubscription = AppState.addEventListener('change', this._handleAppStateChange);
    
    this.sessionStartTime = Date.now();
    this.lastActiveTime = Date.now();
    this.totalSessionTime = 0;
    this.isTrackingSession = false;
  }
  
  private setupNativeTimer() {
    if (!BrainBitesTimer) return;
    
    // Start listening to native timer
    BrainBitesTimer.startListening();
    
    // Subscribe to timer updates using DeviceEventEmitter for better compatibility
    this.subscription = DeviceEventEmitter.addListener('timerUpdate', (data: any) => {
      this.availableTime = data.remainingTime || 0;
      const isTracking = data.isTracking || false;
      const isAppForeground = data.isAppForeground || false;
      
      // Track session time when app is active
      if (isAppForeground) {
        const currentTime = Date.now();
        const timeDiff = currentTime - this.lastActiveTime;
        this.totalSessionTime += timeDiff;
        this.lastActiveTime = currentTime;
      }
      
      // Only log every 10 seconds to reduce spam
      if (this.availableTime % 10 === 0) {
        console.log(`Timer update: ${this.availableTime}s, tracking: ${isTracking}`);
      }
      
      this._notifyListeners('timeUpdate', {
        remaining: this.availableTime,
        isTracking,
        isAppForeground
      });
      
      if (this.availableTime <= 0 && isTracking) {
        this._notifyListeners('timeExpired', {});
      }
    });
  }
  
  private _handleAppStateChange = (nextAppState: AppStateStatus) => {
    const previousState = this.appState;
    this.appState = nextAppState;
    
    console.log(`App state changed: ${previousState} -> ${nextAppState}`);
    
    // Update native service about app state
    if (this.useNativeTimer && BrainBitesTimer) {
      if (nextAppState === 'active') {
        this.isBrainBitesActive = true;
        BrainBitesTimer.notifyAppState('app_foreground');
      } else {
        this.isBrainBitesActive = false;
        BrainBitesTimer.notifyAppState('app_background');
        
        // Force start timer when going to background if we have time
        if (this.availableTime > 0) {
          console.log('Starting timer as app goes to background');
          BrainBitesTimer.startTracking();
        }
      }
    }
  }
  
  async loadSavedTime(): Promise<number> {
    try {
      if (this.useNativeTimer && BrainBitesTimer) {
        // Get time from native service
        const time = await BrainBitesTimer.getRemainingTime();
        this.availableTime = time;
        console.log('Loaded time from native:', time);
        
        // Start timer if we have time
        if (time > 0) {
          BrainBitesTimer.startTracking();
        }
      } else {
        // Fallback to AsyncStorage
        const data = await AsyncStorage.getItem(this.STORAGE_KEY);
        if (data) {
          const parsedData = JSON.parse(data);
          this.availableTime = parsedData.availableTime || 0;
        }
      }
      
      console.log('Loaded available time:', this.availableTime);
      this._notifyListeners('timeLoaded', { availableTime: this.availableTime });
      this.isInitialized = true;
      return this.availableTime;
    } catch (error) {
      console.error('Error loading saved time:', error);
      return 0;
    }
  }
  
  private async saveTimeData() {
    try {
      if (!this.useNativeTimer) {
        // Only save to AsyncStorage if not using native timer
        const data = {
          availableTime: this.availableTime,
          lastUpdated: new Date().toISOString()
        };
        await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      }
      // Native timer saves automatically
    } catch (error) {
      console.error('Error saving time data:', error);
    }
  }
  
  async startTracking() {
    if (this.isBrainBitesActive) return;
    
    if (this.useNativeTimer && BrainBitesTimer) {
      BrainBitesTimer.startTracking();
    } else {
      // JavaScript fallback implementation would go here
    }
    
    // Start session tracking
    this.sessionStartTime = Date.now();
    this.lastActiveTime = Date.now();
    this.isTrackingSession = true;
  }

  async stopTracking() {
    if (this.useNativeTimer && BrainBitesTimer) {
      BrainBitesTimer.stopTracking();
    } else {
      // JavaScript fallback implementation would go here
    }
    
    // Calculate final session time
    const sessionDuration = (Date.now() - this.sessionStartTime) / 1000;
    this.totalSessionTime += sessionDuration;
    this.isTrackingSession = false;
  }

  async addTimeCredits(seconds: number) {
    if (this.useNativeTimer && BrainBitesTimer) {
      await BrainBitesTimer.addTime(seconds);
      // Get updated time from native service
      this.availableTime = await BrainBitesTimer.getRemainingTime();
    } else {
      this.availableTime += seconds;
      await this.saveTimeData();
    }

    console.log(`Added ${seconds}s. New available time: ${this.availableTime}`);
    this._notifyListeners('creditsAdded', { seconds, newTotal: this.availableTime });
  }

  async addTime(seconds: number) {
    const previousTime = this.availableTime;
    this.availableTime += seconds;
    
    if (this.useNativeTimer && BrainBitesTimer) {
      BrainBitesTimer.updateTime(this.availableTime);
    } else {
      await this.saveTimeData();
    }
    
    this._notifyListeners('timeUpdate', {
      remaining: this.availableTime,
      isTracking: !this.isBrainBitesActive && this.availableTime > 0
    });
  }

  async deductTime(seconds: number) {
    const previousTime = this.availableTime;
    this.availableTime = Math.max(0, this.availableTime - seconds);
    
    if (this.useNativeTimer && BrainBitesTimer) {
      BrainBitesTimer.updateTime(this.availableTime);
    } else {
      await this.saveTimeData();
    }
    
    this._notifyListeners('timeUpdate', {
      remaining: this.availableTime,
      isTracking: !this.isBrainBitesActive && this.availableTime > 0
    });
  }
  
  getAvailableTime(): number {
    return this.availableTime;
  }
  
  static formatTime(seconds: number): string {
    if (seconds < 0) seconds = 0;
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes < 10 ? '0' : ''}${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    } else {
      return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    }
  }
  
  formatTime(seconds: number): string {
    return EnhancedTimerService.formatTime(seconds);
  }
  
  addEventListener(callback: TimerListener): () => void {
    this.listeners.push(callback);
    
    // Immediately send current state
    callback({
      event: 'timeUpdate',
      remaining: this.availableTime,
      isTracking: !this.isBrainBitesActive && this.availableTime > 0
    });
    
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }
  
  private _notifyListeners(event: string, data: any = {}) {
    this.listeners.forEach(listener => {
      listener({ event, ...data });
    });
  }
  
  getTrackingStatus(): TrackingStatus {
    return {
      isTracking: !this.isBrainBitesActive && this.availableTime > 0,
      isBrainBitesActive: this.isBrainBitesActive,
      appState: this.appState,
      availableTime: this.availableTime
    };
  }
  
  getDebugInfo(): DebugInfo {
    return {
      availableTime: this.availableTime,
      formattedTime: this.formatTime(this.availableTime),
      isRunning: !this.isBrainBitesActive,
      isBrainBitesActive: this.isBrainBitesActive,
      appState: this.appState,
      useNativeTimer: this.useNativeTimer,
      hasTimer: !!BrainBitesTimer
    };
  }
  
  // For testing
  forceStartTracking() {
    if (this.useNativeTimer && BrainBitesTimer) {
      BrainBitesTimer.startTracking();
    }
  }
  
  forceStopTracking() {
    if (this.useNativeTimer && BrainBitesTimer) {
      BrainBitesTimer.stopTracking();
    }
  }
  
  cleanup() {
    this.appStateSubscription?.remove();
    this.subscription?.remove(); // For DeviceEventEmitter
    if (this.useNativeTimer && BrainBitesTimer) {
      BrainBitesTimer.stopListening();
    }
  }
}

const enhancedTimerService = new EnhancedTimerService();
export default enhancedTimerService;