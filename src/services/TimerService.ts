import { NativeModules, NativeEventEmitter, AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { BrainBitesTimer } = NativeModules;
const timerEmitter = new NativeEventEmitter(BrainBitesTimer);

export interface TimerState {
  remainingTime: number;
  negativeTime: number;
  isTracking: boolean;
  isAppForeground: boolean;
}

class TimerServiceClass {
  private listeners: Array<(state: TimerState) => void> = [];
  private currentState: TimerState = {
    remainingTime: 0,
    negativeTime: 0,
    isTracking: false,
    isAppForeground: true,
  };
  private appStateSubscription: any;
  private timerUpdateSubscription: any;

  async init() {
    console.log('Initializing TimerService');
    
    // Start listening to timer updates
    this.startListening();
    
    // Get initial timer state
    const timeData = await BrainBitesTimer.getRemainingTime();
    this.currentState.remainingTime = timeData.remainingTime || 0;
    this.currentState.negativeTime = timeData.negativeTime || 0;
    
    // Listen to app state changes
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);
    
    // Notify the native module of initial app state
    BrainBitesTimer.notifyAppState('foreground');
    
    // Start timer service
    BrainBitesTimer.startTracking();
  }

  private handleAppStateChange = (nextAppState: AppStateStatus) => {
    console.log('App state changed to:', nextAppState);
    
    if (nextAppState === 'active') {
      BrainBitesTimer.notifyAppState('foreground');
    } else if (nextAppState === 'background') {
      BrainBitesTimer.notifyAppState('background');
    }
  };

  private startListening() {
    BrainBitesTimer.startListening();
    
    this.timerUpdateSubscription = timerEmitter.addListener('timerUpdate', (data: TimerState) => {
      this.currentState = data;
      this.notifyListeners();
    });
  }

  addListener(callback: (state: TimerState) => void) {
    this.listeners.push(callback);
    // Immediately call with current state
    callback(this.currentState);
    
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentState));
  }

  async addTime(seconds: number) {
    console.log(`Adding ${seconds} seconds to timer`);
    await BrainBitesTimer.addTime(seconds);
  }

  async setTime(seconds: number) {
    console.log(`Setting timer to ${seconds} seconds`);
    await BrainBitesTimer.setScreenTime(seconds);
  }

  getState(): TimerState {
    return this.currentState;
  }

  getTotalScore(): number {
    // Calculate total score considering negative time
    // Each minute of negative time reduces score
    const negativeScoreReduction = Math.floor(this.currentState.negativeTime / 60) * 10;
    return Math.max(0, negativeScoreReduction);
  }

  formatTime(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  cleanup() {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }
    if (this.timerUpdateSubscription) {
      this.timerUpdateSubscription.remove();
    }
    BrainBitesTimer.stopListening();
  }
}

export const TimerService = new TimerServiceClass();