import { Platform, PermissionsAndroid, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// For React Native, we'll use a simple notification interface
// In a real app, you'd use @react-native-async-storage/async-storage
// and react-native-push-notification or @react-native-firebase/messaging

interface NotificationData {
  id: string;
  title: string;
  body: string;
  data?: any;
  scheduledTime?: Date;
}

interface NotificationSettings {
  enabled: boolean;
  dailyReminder: boolean;
  reminderTime: string; // HH:MM format
  streakReminder: boolean;
  achievementNotifications: boolean;
}

class NotificationServiceClass {
  private isInitialized = false;
  private settings: NotificationSettings = {
    enabled: true,
    dailyReminder: true,
    reminderTime: '19:00', // 7 PM
    streakReminder: true,
    achievementNotifications: true,
  };
  private SETTINGS_KEY = '@BrainBites:notificationSettings';

  async initialize(): Promise<boolean> {
    try {
      console.log('Initializing NotificationService...');
      
      // Load saved settings
      await this.loadSettings();
      
      // Request permissions
      const hasPermission = await this.requestPermissions();
      
      if (hasPermission && this.settings.enabled) {
        await this.scheduleDefaultNotifications();
      }
      
      this.isInitialized = true;
      console.log('NotificationService initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
      return false;
    }
  }

  private async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        if (Platform.Version >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
            {
              title: 'Notification Permission',
              message: 'BrainBites would like to send you notifications to help you stay on track with your learning goals.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
        return true;
      }
      
      // For iOS, permissions are handled differently
      // In a real app, you'd use @react-native-community/push-notification-ios
      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  private async loadSettings() {
    try {
      const savedSettings = await AsyncStorage.getItem(this.SETTINGS_KEY);
      if (savedSettings) {
        this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
  }

  private async saveSettings() {
    try {
      await AsyncStorage.setItem(this.SETTINGS_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error('Failed to save notification settings:', error);
    }
  }

  async updateSettings(newSettings: Partial<NotificationSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    await this.saveSettings();
    
    if (this.settings.enabled) {
      await this.scheduleDefaultNotifications();
    } else {
      await this.cancelAllNotifications();
    }
  }

  private async scheduleDefaultNotifications() {
    if (!this.settings.enabled) return;

    // Schedule daily reminder
    if (this.settings.dailyReminder) {
      await this.scheduleDailyReminder();
    }

    // Schedule weekly streak reminder
    if (this.settings.streakReminder) {
      await this.scheduleStreakReminder();
    }
  }

  private async scheduleDailyReminder() {
    const notification: NotificationData = {
      id: 'daily_reminder',
      title: '🧠 Time for Brain Bites!',
      body: 'Ready to boost your brainpower? Answer a few questions to earn more app time!',
      data: { type: 'daily_reminder' }
    };

    // In a real app, you'd schedule this with react-native-push-notification
    console.log('Daily reminder scheduled:', notification);
  }

  private async scheduleStreakReminder() {
    const notification: NotificationData = {
      id: 'streak_reminder',
      title: '🔥 Don\'t break your streak!',
      body: 'You\'re doing great! Keep your learning streak alive with a quick quiz.',
      data: { type: 'streak_reminder' }
    };

    console.log('Streak reminder scheduled:', notification);
  }

  async sendImmediateNotification(title: string, body: string, data?: any) {
    if (!this.settings.enabled) return;

    const notification: NotificationData = {
      id: `immediate_${Date.now()}`,
      title,
      body,
      data
    };

    // In a real app, you'd show this immediately
    console.log('Immediate notification:', notification);
    
    // For now, we'll show an alert as a fallback
    if (__DEV__) {
      Alert.alert(title, body);
    }
  }

  // Achievement notifications
  async notifyAchievement(achievementTitle: string, description: string) {
    if (!this.settings.achievementNotifications) return;

    await this.sendImmediateNotification(
      `🎉 Achievement Unlocked!`,
      `${achievementTitle}: ${description}`,
      { type: 'achievement', title: achievementTitle }
    );
  }

  // Streak notifications
  async notifyStreakMilestone(streakCount: number) {
    if (!this.settings.streakReminder) return;

    let title = '🔥 Streak Master!';
    let body = `Amazing! You've answered ${streakCount} questions in a row!`;

    if (streakCount >= 50) {
      title = '🏆 Legendary Streak!';
      body = `Incredible! ${streakCount} questions streak! You're a true Brain Bites champion!`;
    } else if (streakCount >= 25) {
      title = '⭐ Super Streak!';
      body = `Wow! ${streakCount} questions in a row! You're on fire!`;
    } else if (streakCount >= 10) {
      title = '🔥 Hot Streak!';
      body = `Great job! ${streakCount} correct answers in a row!`;
    }

    await this.sendImmediateNotification(title, body, { type: 'streak', count: streakCount });
  }

  // Daily goal notifications
  async notifyDailyGoalComplete(goalTitle: string, reward: number) {
    if (!this.settings.achievementNotifications) return;

    await this.sendImmediateNotification(
      '✅ Daily Goal Complete!',
      `${goalTitle} completed! You earned ${reward} minutes of app time!`,
      { type: 'daily_goal', reward }
    );
  }

  // Timer notifications
  async notifyLowTime(remainingMinutes: number) {
    if (remainingMinutes <= 0) return;

    await this.sendImmediateNotification(
      '⏰ Time Running Low',
      `Only ${remainingMinutes} minutes left! Answer some questions to earn more time.`,
      { type: 'low_time', minutes: remainingMinutes }
    );
  }

  async notifyTimeExpired() {
    await this.sendImmediateNotification(
      '⌛ Time\'s Up!',
      'Your earned time has expired. Answer questions to get back in the green!',
      { type: 'time_expired' }
    );
  }

  // Flow streak notifications
  async notifyFlowStreak(days: number) {
    if (!this.settings.streakReminder) return;

    let title = '📚 Learning Flow!';
    let body = `You've been learning for ${days} days straight! Keep it up!`;

    if (days >= 30) {
      title = '🏆 Master Learner!';
      body = `${days} days of continuous learning! You're building amazing habits!`;
    } else if (days >= 7) {
      title = '⭐ Week Warrior!';
      body = `${days} days in a row! You're forming a great learning habit!`;
    }

    await this.sendImmediateNotification(title, body, { type: 'flow_streak', days });
  }

  async cancelAllNotifications() {
    // In a real app, you'd cancel all scheduled notifications
    console.log('All notifications cancelled');
  }

  async cancelNotification(id: string) {
    // In a real app, you'd cancel the specific notification
    console.log('Notification cancelled:', id);
  }

  // Settings getters
  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  isEnabled(): boolean {
    return this.settings.enabled;
  }

  // Handle notification interactions
  async handleNotificationPress(data: any) {
    console.log('Notification pressed:', data);
    
    // In a real app, you'd navigate to appropriate screens based on notification type
    switch (data?.type) {
      case 'daily_reminder':
      case 'streak_reminder':
        // Navigate to quiz screen
        break;
      case 'achievement':
        // Navigate to achievements screen
        break;
      case 'daily_goal':
        // Navigate to daily goals screen
        break;
      case 'low_time':
      case 'time_expired':
        // Navigate to home screen
        break;
    }
  }

  // Background notification scheduling (for when app is closed)
  async scheduleBackgroundNotifications() {
    // Schedule notifications for the next 7 days
    for (let i = 1; i <= 7; i++) {
      const scheduledTime = new Date();
      scheduledTime.setDate(scheduledTime.getDate() + i);
      scheduledTime.setHours(19, 0, 0, 0); // 7 PM

      const notification: NotificationData = {
        id: `background_${i}`,
        title: '🧠 Daily Brain Boost',
        body: 'Time to exercise your mind! Complete today\'s challenges.',
        scheduledTime,
        data: { type: 'daily_reminder', day: i }
      };

      console.log('Background notification scheduled:', notification);
    }
  }

  cleanup() {
    this.cancelAllNotifications();
    console.log('NotificationService cleaned up');
  }
}

export const NotificationService = new NotificationServiceClass();