// src/services/EnhancedScoreService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

// Scoring constants
const SCORE_BASE = 100;                  // Base score for a correct answer
const STREAK_MULTIPLIER = 0.5;           // +50% per streak level
const TIME_MULTIPLIER = 1.5;             // Maximum +50% for fast answers
const STREAK_MILESTONE = 5;              // Streak milestone
const MILESTONE_BONUS = 500;             // Bonus for streak milestone

// Time management constants
const OVERTIME_PENALTY_PER_MINUTE = 50;  // Lose 50 points per minute over limit
const ROLLOVER_BONUS_PER_MINUTE = 10;    // Gain 10 points per unused minute
const MAX_ROLLOVER_MINUTES = 120;        // Cap rollover at 2 hours
const PENALTY_TICK_INTERVAL = 10000;     // Check every 10 seconds

interface ScoreEventData {
  event: string;
  [key: string]: any;
}

interface ScoreListener {
  (data: ScoreEventData): void;
}

interface ScoreInfo {
  currentStreak: number;
  highestStreak: number;
  sessionScore: number;
  dailyScore: number;
  yesterdayScore: number;
  dailyRolloverBonus: number;
  overtimePenalty: number;
  allTimeHighScore: number;
  totalDaysPlayed: number;
  weeklyScores: Array<{date: string; score: number; streak: number}>;
  weeklyTotal: number;
  weeklyAverage: number;
  monthlyTotal: number;
  totalScore: number;
  streakLevel: number;
  nextMilestone: number;
  progress: number;
  hoursOvertime: number;
  minutesOvertime: number;
}

interface DetailedScoreInfo extends ScoreInfo {
  // Add any additional properties for detailed view
}

interface AnswerContext {
  startTime: number;
  category: string;
}

interface AnswerResult {
  pointsEarned: number;
  newStreak: number;
  newScore: number;
  isMilestone: boolean;
  streakLevel?: number;
}

class EnhancedScoreService {
  // Score properties - these reset daily
  private currentStreak: number = 0;
  private highestStreak: number = 0;
  private dailyScore: number = 0;              // Today's score (resets at midnight)
  private yesterdayScore: number = 0;          // Yesterday's final score
  private allTimeHighScore: number = 0;        // Best daily score ever
  private totalDaysPlayed: number = 0;         // Total days with activity
  
  // Session tracking
  private sessionScore: number = 0;
  private streakMilestones: number[] = [];
  private questionStartTime: number = 0;
  
  // Time management
  private overtimePenalty: number = 0;
  private dailyRolloverBonus: number = 0;
  private lastPenaltyCheck: number = Date.now();
  private penaltyCheckInterval: NodeJS.Timeout | null = null;
  private currentDate: string = new Date().toDateString();
  
  // Weekly tracking
  private weeklyScores: Array<{date: string; score: number; streak: number}> = [];
  private monthlyTotal: number = 0;
  
  // Persistence
  private isLoaded: boolean = false;
  private dailyResetCheckInterval: NodeJS.Timeout | null = null;
  
  // Storage keys
  private readonly STORAGE_KEYS = {
    DAILY_SCORE: 'brainbites_daily_score',
    SCORE_HISTORY: 'brainbites_score_history',
    TIME_MANAGEMENT: 'brainbites_time_management'
  };
  
  // Event listeners
  private listeners: ScoreListener[] = [];
  
  constructor() {
    // Start monitoring
    this.startOvertimeMonitoring();
    this.startDailyResetMonitoring();
  }
  
  async loadSavedData() {
    if (this.isLoaded) return;
    
    try {
      // Check for daily reset first
      await this.checkDailyReset();
      
      // Load daily score data
      const dailyData = await AsyncStorage.getItem(this.STORAGE_KEYS.DAILY_SCORE);
      if (dailyData) {
        const parsed = JSON.parse(dailyData);
        
        // Only load if it's still the same day
        if (parsed.date === this.currentDate) {
          this.dailyScore = parsed.dailyScore || 0;
          this.currentStreak = parsed.currentStreak || 0;
          this.highestStreak = parsed.highestStreak || 0;
          this.overtimePenalty = parsed.overtimePenalty || 0;
        }
      }
      
      // Load score history
      const historyData = await AsyncStorage.getItem(this.STORAGE_KEYS.SCORE_HISTORY);
      if (historyData) {
        const history = JSON.parse(historyData);
        this.allTimeHighScore = history.allTimeHighScore || 0;
        this.totalDaysPlayed = history.totalDaysPlayed || 0;
        this.weeklyScores = history.weeklyScores || [];
        this.monthlyTotal = history.monthlyTotal || 0;
        this.yesterdayScore = history.yesterdayScore || 0;
      }
      
      this.resetSession();
      this.isLoaded = true;
      
      return {
        dailyScore: this.dailyScore,
        highestStreak: this.highestStreak,
        allTimeHighScore: this.allTimeHighScore
      };
    } catch (error) {
      console.error('Error loading score data:', error);
      return null;
    }
  }
  
  private startDailyResetMonitoring() {
    // Check every minute for midnight
    if (this.dailyResetCheckInterval) {
      clearInterval(this.dailyResetCheckInterval);
    }
    
    this.dailyResetCheckInterval = setInterval(() => {
      this.checkDailyReset();
    }, 60000); // Every minute
  }
  
  private async checkDailyReset() {
    const now = new Date();
    const todayString = now.toDateString();
    
    if (this.currentDate !== todayString) {
      console.log('🌅 New day detected! Performing daily reset...');
      
      // It's a new day! Perform daily reset
      await this.performDailyReset();
      
      this.currentDate = todayString;
    }
  }
  
  private async performDailyReset() {
    // Save yesterday's score
    this.yesterdayScore = this.dailyScore;
    
    // Update history before reset
    await this.updateScoreHistory();
    
    // Calculate rollover bonus from remaining time
    // NOTE: This would need to be integrated with TimerService
    let rolloverBonus = 0;
    
    // Check if beat personal best
    const wasNewRecord = this.dailyScore > this.allTimeHighScore;
    if (wasNewRecord) {
      this.allTimeHighScore = this.dailyScore;
    }
    
    // Reset daily values
    this.dailyScore = rolloverBonus; // Start new day with rollover bonus
    this.dailyRolloverBonus = rolloverBonus;
    this.currentStreak = 0;
    this.sessionScore = 0;
    this.overtimePenalty = 0;
    
    // Increment days played if yesterday had activity
    if (this.yesterdayScore > 0) {
      this.totalDaysPlayed++;
    }
    
    // Save the reset state
    await this.saveData();
    
    // Notify listeners about the reset
    this._notifyListeners('dailyReset', {
      yesterdayScore: this.yesterdayScore,
      rolloverBonus: rolloverBonus,
      rolloverMinutes: 0, // Would be calculated from timer service
      wasNewRecord: wasNewRecord,
      newDayScore: this.dailyScore,
      totalDaysPlayed: this.totalDaysPlayed
    });
  }
  
  private async updateScoreHistory() {
    // Add yesterday's score to weekly history
    this.weeklyScores.push({
      date: this.currentDate,
      score: this.dailyScore,
      streak: this.highestStreak
    });
    
    // Keep only last 7 days
    if (this.weeklyScores.length > 7) {
      this.weeklyScores.shift();
    }
    
    // Update monthly total
    const currentMonth = new Date().getMonth();
    const historyMonth = this.weeklyScores[0]?.date ? new Date(this.weeklyScores[0].date).getMonth() : currentMonth;
    
    if (currentMonth !== historyMonth) {
      // New month, reset monthly total
      this.monthlyTotal = this.dailyScore;
    } else {
      // Same month, add to total
      this.monthlyTotal = this.weeklyScores.reduce((sum, day) => sum + day.score, 0);
    }
  }
  
  private async saveData() {
    try {
      // Save daily data
      const dailyData = {
        date: this.currentDate,
        dailyScore: this.dailyScore,
        currentStreak: this.currentStreak,
        highestStreak: this.highestStreak,
        overtimePenalty: this.overtimePenalty,
        lastUpdated: new Date().toISOString()
      };
      
      await AsyncStorage.setItem(this.STORAGE_KEYS.DAILY_SCORE, JSON.stringify(dailyData));
      
      // Save history
      const historyData = {
        allTimeHighScore: this.allTimeHighScore,
        totalDaysPlayed: this.totalDaysPlayed,
        weeklyScores: this.weeklyScores,
        monthlyTotal: this.monthlyTotal,
        yesterdayScore: this.yesterdayScore,
        lastUpdated: new Date().toISOString()
      };
      
      await AsyncStorage.setItem(this.STORAGE_KEYS.SCORE_HISTORY, JSON.stringify(historyData));
      
    } catch (error) {
      console.error('Error saving score data:', error);
    }
  }
  
  // Overtime monitoring methods
  private startOvertimeMonitoring() {
    if (this.penaltyCheckInterval) {
      clearInterval(this.penaltyCheckInterval);
    }
    
    this.penaltyCheckInterval = setInterval(() => {
      this.checkAndApplyPenalties();
    }, PENALTY_TICK_INTERVAL);
  }
  
  private async checkAndApplyPenalties() {
    // This would need to be integrated with TimerService
    // For now, this is a placeholder structure
    const availableTime = 0; // Would get from TimerService
    const isBrainBitesActive = true; // Would get from TimerService
    
    // Only apply penalties when time is expired AND user is actively using other apps
    if (availableTime <= 0 && !isBrainBitesActive) {
      
      // Show warning if this is the first time going into overtime
      if (!this.lastPenaltyCheck) {
        this.showTimeExpiredWarning();
        this.lastPenaltyCheck = Date.now();
        return; // Give 30-second grace period
      }
      
      const now = Date.now();
      const overtimeSeconds = Math.floor((now - this.lastPenaltyCheck) / 1000);
      
      // Apply penalty after 30-second grace period
      if (overtimeSeconds >= 30) {
        const overtimeMinutes = overtimeSeconds / 60;
        const penalty = Math.floor(overtimeMinutes * OVERTIME_PENALTY_PER_MINUTE);
        
        if (penalty > 0) {
          const oldPenaltyTotal = this.overtimePenalty;
          
          // THIS IS THE ONLY PLACE SCORES CAN GO NEGATIVE
          this.dailyScore = Math.max(-9999, this.dailyScore - penalty);
          this.overtimePenalty += penalty;
          
          console.log(`Applied overtime penalty: -${penalty} points (${overtimeMinutes.toFixed(1)} minutes overtime). Total penalty: ${this.overtimePenalty}`);
          
          this.lastPenaltyCheck = now;
          await this.saveData();
          
          this._notifyListeners('penaltyApplied', {
            penalty,
            overtimeMinutes: Math.floor(overtimeMinutes),
            dailyScore: this.dailyScore,
            totalPenalty: this.overtimePenalty
          });
        }
      }
    } else if (availableTime > 0) {
      // Reset penalty tracking when user has time again
      this.lastPenaltyCheck = 0;
    }
  }
  
  private showTimeExpiredWarning() {
    this._notifyListeners('showMessage', {
      type: 'timeExpiredWarning',
      message: `⏰ Time's Up!\n\nYour earned screen time has run out. You'll now start losing points for continued app usage.\n\n💡 Quick solution: Answer a few quiz questions to earn more time and stop the penalty!\n\nCurrent score: ${this.dailyScore}`,
      priority: 'high',
      duration: 8000
    });
  }
  
  // Question answering methods
  startQuestionTimer() {
    this.questionStartTime = Date.now();
  }
  
  recordAnswer(isCorrect: boolean, context: AnswerContext): AnswerResult {
    if (isCorrect) {
      // Calculate time bonus
      const timeTaken = (Date.now() - context.startTime) / 1000; // in seconds
      const timeBonus = Math.max(0, (20 - timeTaken) / 20) * (SCORE_BASE * (TIME_MULTIPLIER - 1));
      
      // Calculate streak bonus
      const streakBonus = this.currentStreak * (SCORE_BASE * STREAK_MULTIPLIER);
      
      // Total points for this answer
      const points = Math.round(SCORE_BASE + timeBonus + streakBonus);
      
      this.updateScore(points, true, context.category);
      
      return {
        pointsEarned: points,
        newStreak: this.currentStreak,
        newScore: this.dailyScore,
        isMilestone: this.currentStreak > 0 && this.currentStreak % STREAK_MILESTONE === 0,
        streakLevel: Math.floor(this.currentStreak / STREAK_MILESTONE)
      };
    } else {
      // Incorrect answer - NO POINTS DEDUCTED, just reset streak
      this.updateScore(0, false, context.category);
      return {
        pointsEarned: 0,
        newStreak: this.currentStreak,
        newScore: this.dailyScore,
        isMilestone: false,
      };
    }
  }
  
  private async updateScore(points: number, isCorrect: boolean, category: string) {
    const previousScore = this.dailyScore;
    
    // Only add points for correct answers, never subtract for wrong answers
    if (points > 0) {
      this.dailyScore += points;
      this.sessionScore += points;
    }
    
    // Handle streaks - only negative scores from OVERTIME should reset streaks
    if (isCorrect) {
      this.currentStreak++;
      if (this.currentStreak > this.highestStreak) {
        this.highestStreak = this.currentStreak;
      }
    } else {
      // Wrong answer resets streak but doesn't affect score
      this.currentStreak = 0;
    }
    
    await this.saveData();
    this._notifyListeners('scoreUpdated', {
      dailyScore: this.dailyScore,
      sessionScore: this.sessionScore,
      currentStreak: this.currentStreak,
      highestStreak: this.highestStreak
    });
  }
  
  // Get score information
  getScoreInfo(): ScoreInfo {
    const weeklyTotal = this.weeklyScores.reduce((sum, day) => sum + day.score, 0);
    const weeklyAverage = this.weeklyScores.length > 0 
      ? Math.round(weeklyTotal / this.weeklyScores.length) 
      : 0;
    
    return {
      // Current values
      currentStreak: this.currentStreak,
      highestStreak: this.highestStreak,
      sessionScore: this.sessionScore,
      
      // Daily values
      dailyScore: this.dailyScore,
      yesterdayScore: this.yesterdayScore,
      dailyRolloverBonus: this.dailyRolloverBonus,
      overtimePenalty: this.overtimePenalty,
      
      // Historical values
      allTimeHighScore: this.allTimeHighScore,
      totalDaysPlayed: this.totalDaysPlayed,
      weeklyScores: this.weeklyScores,
      weeklyTotal: weeklyTotal,
      weeklyAverage: weeklyAverage,
      monthlyTotal: this.monthlyTotal,
      
      // For leaderboard - use daily score
      totalScore: this.dailyScore,
      
      // Progress
      streakLevel: Math.floor(this.currentStreak / STREAK_MILESTONE),
      nextMilestone: (Math.floor(this.currentStreak / STREAK_MILESTONE) + 1) * STREAK_MILESTONE,
      progress: this.currentStreak % STREAK_MILESTONE / STREAK_MILESTONE,
      
      // Time info
      hoursOvertime: Math.floor(this.overtimePenalty / OVERTIME_PENALTY_PER_MINUTE / 60),
      minutesOvertime: Math.floor(this.overtimePenalty / OVERTIME_PENALTY_PER_MINUTE) % 60
    };
  }
  
  getDetailedScoreInfo(): DetailedScoreInfo {
    return this.getScoreInfo(); // For now, same as regular score info
  }
  
  resetSession() {
    this.currentStreak = 0;
    this.sessionScore = 0;
    this.streakMilestones = [];
    this.questionStartTime = 0;
  }
  
  addEventListener(callback: ScoreListener) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }
  
  private _notifyListeners(event: string, data: any = {}) {
    this.listeners.forEach(listener => {
      listener({ event, ...data });
    });
  }
  
  cleanup() {
    if (this.penaltyCheckInterval) {
      clearInterval(this.penaltyCheckInterval);
    }
    if (this.dailyResetCheckInterval) {
      clearInterval(this.dailyResetCheckInterval);
    }
  }
}

export default new EnhancedScoreService();