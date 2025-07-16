import { Platform } from 'react-native';

// Import Firebase Analytics with error handling
let analytics: any = null;
let firebaseApp: any = null;

// Try to get Firebase instances from the centralized Firebase config
try {
  const { firebaseApp: centralFirebaseApp, analytics: centralAnalytics } = require('../config/Firebase');
  firebaseApp = centralFirebaseApp;
  analytics = centralAnalytics;
} catch (error) {
  console.log('Centralized Firebase not available, trying direct import:', error);
  try {
    analytics = require('@react-native-firebase/analytics').default;
    firebaseApp = require('@react-native-firebase/app').default;
  } catch (directError) {
    console.log('Firebase modules not available:', directError);
  }
}

interface UserProperties {
  username?: string;
  totalScore?: number;
  flowStreak?: number;
  questionsAnswered?: number;
  platform?: string;
  app_version?: string;
}

interface EventParams {
  [key: string]: any;
}

class AnalyticsServiceClass {
  private isInitialized = false;
  private firebaseAvailable = false;

  async initialize() {
    try {
      console.log('📊 Initializing AnalyticsService...');
      
      // Check if Firebase modules are available
      if (!analytics || !firebaseApp) {
        console.log('⚠️ Firebase Analytics not available - modules not found');
        this.firebaseAvailable = false;
        this.isInitialized = true;
        console.log('✅ AnalyticsService initialized successfully (without Firebase)');
        return;
      }

      // Test Firebase Analytics
      try {
        await analytics().setAnalyticsCollectionEnabled(true);
        this.firebaseAvailable = true;
        console.log('✅ Firebase Analytics is available');
        
        // Set default user properties
        await this.setUserProperties({
          platform: Platform.OS,
          app_version: '1.0.0',
        });
      } catch (firebaseError) {
        console.log('⚠️ Firebase Analytics not available:', firebaseError);
        this.firebaseAvailable = false;
      }

      this.isInitialized = true;
      console.log('✅ AnalyticsService initialized successfully');
    } catch (error) {
      console.log('❌ AnalyticsService initialization failed, continuing without analytics:', error);
      // Don't throw error, just continue without analytics
      this.isInitialized = true; // Mark as initialized so app doesn't crash
      this.firebaseAvailable = false;
    }
  }

  isEnabled(): boolean {
    return this.isInitialized && this.firebaseAvailable;
  }

  isFirebaseAvailable(): boolean {
    return this.firebaseAvailable;
  }

  // User Events
  async logLogin(method: string) {
    if (!this.firebaseAvailable || !analytics) return;
    try {
      await analytics().logLogin({ method });
    } catch (error) {
      console.error('Failed to log login:', error);
    }
  }

  async logSignUp(method: string) {
    if (!this.firebaseAvailable || !analytics) return;
    try {
      await analytics().logSignUp({ method });
    } catch (error) {
      console.error('Failed to log sign up:', error);
    }
  }

  // Quiz Events
  async logQuizStart(category: string, difficulty: string) {
    if (!this.firebaseAvailable || !analytics) return;
    try {
      await analytics().logEvent('quiz_start', {
        category,
        difficulty,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Failed to log quiz start:', error);
    }
  }

  async logQuizComplete(params: {
    category: string;
    difficulty: string;
    score: number;
    questionsAnswered: number;
    correctAnswers: number;
    duration: number;
    streak: number;
  }) {
    if (!this.firebaseAvailable || !analytics) return;
    try {
      await analytics().logEvent('quiz_complete', params);
    } catch (error) {
      console.error('Failed to log quiz complete:', error);
    }
  }

  async logQuestionAnswered(correct: boolean, category: string, difficulty: string, responseTime: number) {
    if (!this.firebaseAvailable || !analytics) return;
    try {
      await analytics().logEvent('question_answered', {
        correct,
        category,
        difficulty,
        response_time_ms: responseTime,
      });
    } catch (error) {
      console.error('Failed to log question answered:', error);
    }
  }

  // Streak Events
  async logStreakAchieved(streakLength: number) {
    if (!this.firebaseAvailable || !analytics) return;
    try {
      await analytics().logEvent('streak_achieved', {
        streak_length: streakLength,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Failed to log streak achieved:', error);
    }
  }

  async logStreakBroken(streakLength: number) {
    if (!this.firebaseAvailable || !analytics) return;
    try {
      await analytics().logEvent('streak_broken', {
        streak_length: streakLength,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Failed to log streak broken:', error);
    }
  }

  // Timer Events
  async logTimerExpired(negativeTime: number) {
    if (!this.firebaseAvailable || !analytics) return;
    try {
      await analytics().logEvent('timer_expired', {
        negative_time_minutes: Math.floor(negativeTime / 60000),
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Failed to log timer expired:', error);
    }
  }

  async logTimeRewardEarned(minutes: number, source: string) {
    if (!this.firebaseAvailable || !analytics) return;
    try {
      await analytics().logEvent('time_reward_earned', {
        minutes,
        source, // 'correct_answer', 'daily_goal', etc.
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Failed to log time reward:', error);
    }
  }

  // Daily Goals Events
  async logDailyGoalCompleted(goalType: string, reward: number) {
    if (!this.firebaseAvailable || !analytics) return;
    try {
      await analytics().logEvent('daily_goal_completed', {
        goal_type: goalType,
        reward_minutes: reward,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Failed to log daily goal completed:', error);
    }
  }

  async logAllDailyGoalsCompleted() {
    if (!this.firebaseAvailable || !analytics) return;
    try {
      await analytics().logEvent('all_daily_goals_completed', {
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Failed to log all daily goals completed:', error);
    }
  }

  // Flow Events
  async logDailyFlowMaintained(flowStreak: number) {
    if (!this.firebaseAvailable || !analytics) return;
    try {
      await analytics().logEvent('daily_flow_maintained', {
        flow_streak: flowStreak,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Failed to log daily flow:', error);
    }
  }

  async logFlowBroken(previousStreak: number) {
    if (!this.firebaseAvailable || !analytics) return;
    try {
      await analytics().logEvent('flow_broken', {
        previous_streak: previousStreak,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Failed to log flow broken:', error);
    }
  }

  // Leaderboard Events
  async logLeaderboardViewed(rank: number) {
    if (!this.firebaseAvailable || !analytics) return;
    try {
      await analytics().logEvent('leaderboard_viewed', {
        user_rank: rank,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Failed to log leaderboard viewed:', error);
    }
  }

  // Mascot Interaction Events
  async logMascotInteraction(interaction: string, context: string) {
    if (!this.firebaseAvailable || !analytics) return;
    try {
      await analytics().logEvent('mascot_interaction', {
        interaction_type: interaction,
        context,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Failed to log mascot interaction:', error);
    }
  }

  // User Properties
  async setUserProperties(properties: UserProperties) {
    if (!this.firebaseAvailable || !analytics) return;
    try {
      for (const [key, value] of Object.entries(properties)) {
        if (value !== undefined) {
          await analytics().setUserProperty(key, String(value));
        }
      }
    } catch (error) {
      console.error('Failed to set user properties:', error);
    }
  }

  async updateUserStats(stats: {
    totalScore: number;
    questionsAnswered: number;
    accuracy: number;
    flowStreak: number;
    bestStreak: number;
  }) {
    if (!this.firebaseAvailable || !analytics) return;
    try {
      await this.setUserProperties({
        totalScore: stats.totalScore,
        questionsAnswered: stats.questionsAnswered,
        flowStreak: stats.flowStreak,
      });
    } catch (error) {
      console.error('Failed to update user stats:', error);
    }
  }

  // Screen Tracking
  async logScreenView(screenName: string, screenClass?: string) {
    if (!this.firebaseAvailable || !analytics) return;
    try {
      await analytics().logScreenView({
        screen_name: screenName,
        screen_class: screenClass || screenName,
      });
    } catch (error) {
      console.error('Failed to log screen view:', error);
    }
  }

  // Revenue Events (for AdMob)
  async logAdImpression(adType: string, adUnit: string) {
    if (!this.firebaseAvailable || !analytics) return;
    try {
      await analytics().logEvent('ad_impression', {
        ad_type: adType,
        ad_unit: adUnit,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Failed to log ad impression:', error);
    }
  }

  async logAdClick(adType: string, adUnit: string) {
    if (!this.firebaseAvailable || !analytics) return;
    try {
      await analytics().logEvent('ad_click', {
        ad_type: adType,
        ad_unit: adUnit,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Failed to log ad click:', error);
    }
  }

  // App Lifecycle Events
  async logAppOpen() {
    if (!this.firebaseAvailable || !analytics) return;
    try {
      await analytics().logAppOpen();
    } catch (error) {
      console.error('Failed to log app open:', error);
    }
  }

  async logSessionDuration(duration: number) {
    if (!this.firebaseAvailable || !analytics) return;
    try {
      await analytics().logEvent('session_duration', {
        duration_minutes: Math.floor(duration / 60000),
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Failed to log session duration:', error);
    }
  }

  // Custom Events
  async logCustomEvent(eventName: string, params?: EventParams) {
    if (!this.firebaseAvailable || !analytics) return;
    try {
      await analytics().logEvent(eventName, params);
    } catch (error) {
      console.error(`Failed to log custom event ${eventName}:`, error);
    }
  }

  // Error Tracking
  async logError(error: string, fatal: boolean = false) {
    if (!this.firebaseAvailable || !analytics) return;
    try {
      await analytics().logEvent('app_error', {
        error_message: error,
        fatal,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Failed to log error:', error);
    }
  }
}

export const AnalyticsService = new AnalyticsServiceClass();