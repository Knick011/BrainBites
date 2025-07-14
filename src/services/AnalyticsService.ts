import analytics from '@react-native-firebase/analytics';
import { Platform } from 'react-native';

interface UserProperties {
  username?: string;
  totalScore?: number;
  flowStreak?: number;
  questionsAnswered?: number;
}

interface EventParams {
  [key: string]: any;
}

class AnalyticsServiceClass {
  private isInitialized = false;

  async initialize() {
    try {
      // Enable analytics collection
      await analytics().setAnalyticsCollectionEnabled(true);
      
      // Set default user properties
      await this.setUserProperties({
        platform: Platform.OS,
        app_version: '1.0.0',
      });

      this.isInitialized = true;
      console.log('Analytics initialized successfully');
    } catch (error) {
      console.error('Failed to initialize analytics:', error);
    }
  }

  // User Events
  async logLogin(method: string) {
    try {
      await analytics().logLogin({ method });
    } catch (error) {
      console.error('Failed to log login:', error);
    }
  }

  async logSignUp(method: string) {
    try {
      await analytics().logSignUp({ method });
    } catch (error) {
      console.error('Failed to log sign up:', error);
    }
  }

  // Quiz Events
  async logQuizStart(category: string, difficulty: string) {
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
    try {
      await analytics().logEvent('quiz_complete', params);
    } catch (error) {
      console.error('Failed to log quiz complete:', error);
    }
  }

  async logQuestionAnswered(correct: boolean, category: string, difficulty: string, responseTime: number) {
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
    try {
      await this.setUserProperties({
        total_score: stats.totalScore,
        questions_answered: stats.questionsAnswered,
        accuracy_percentage: Math.round(stats.accuracy),
        flow_streak: stats.flowStreak,
        best_streak: stats.bestStreak,
      });
    } catch (error) {
      console.error('Failed to update user stats:', error);
    }
  }

  // Screen Tracking
  async logScreenView(screenName: string, screenClass?: string) {
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
    try {
      await analytics().logAppOpen();
    } catch (error) {
      console.error('Failed to log app open:', error);
    }
  }

  async logSessionDuration(duration: number) {
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
    try {
      await analytics().logEvent(eventName, params);
    } catch (error) {
      console.error(`Failed to log custom event ${eventName}:`, error);
    }
  }

  // Error Tracking
  async logError(error: string, fatal: boolean = false) {
    try {
      await analytics().logEvent('app_error', {
        error_message: error,
        fatal,
        timestamp: Date.now(),
      });
    } catch (err) {
      console.error('Failed to log error:', err);
    }
  }
}

export const AnalyticsService = new AnalyticsServiceClass();