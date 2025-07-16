import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { TimerModule } = NativeModules;

class TimerServiceClass {
  private eventEmitter: NativeEventEmitter | null = null;

  constructor() {
    if (Platform.OS === 'android' && TimerModule) {
      this.eventEmitter = new NativeEventEmitter(TimerModule);
    }
  }

  async initialize(): Promise<boolean> {
    try {
      // Initialize the timer service
      console.log('TimerService initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize timer service:', error);
      return false;
    }
  }

  cleanup(): void {
    try {
      // Cleanup any resources
      console.log('TimerService cleanup completed');
    } catch (error) {
      console.error('Failed to cleanup timer service:', error);
    }
  }

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

  async startTimer(): Promise<boolean> {
    try {
      if (Platform.OS === 'android' && TimerModule) {
        return await TimerModule.startTimer();
      }
      return false;
    } catch (error) {
      console.error('Failed to start timer:', error);
      return false;
    }
  }

  async pauseTimer(): Promise<boolean> {
    try {
      if (Platform.OS === 'android' && TimerModule) {
        return await TimerModule.pauseTimer();
      }
      return false;
    } catch (error) {
      console.error('Failed to pause timer:', error);
      return false;
    }
  }

  async resumeTimer(): Promise<boolean> {
    try {
      if (Platform.OS === 'android' && TimerModule) {
        return await TimerModule.resumeTimer();
      }
      return false;
    } catch (error) {
      console.error('Failed to resume timer:', error);
      return false;
    }
  }

  async stopTimer(): Promise<boolean> {
    try {
      if (Platform.OS === 'android' && TimerModule) {
        return await TimerModule.stopTimer();
      }
      return false;
    } catch (error) {
      console.error('Failed to stop timer:', error);
      return false;
    }
  }

  async addTime(minutes: number): Promise<boolean> {
    try {
      if (Platform.OS === 'android' && TimerModule) {
        return await TimerModule.addTime(minutes);
      }
      return false;
    } catch (error) {
      console.error('Failed to add time:', error);
      return false;
    }
  }

  addListener(eventName: string, callback: (data: any) => void) {
    if (this.eventEmitter) {
      return this.eventEmitter.addListener(eventName, callback);
    }
    return null;
  }

  removeListener(eventName: string, callback: (data: any) => void) {
    if (this.eventEmitter) {
      this.eventEmitter.removeAllListeners(eventName);
    }
  }
}

export const TimerService = new TimerServiceClass();