// android/app/src/main/java/com/brainbites/timer/TimerStorage.kt
package com.brainbites.timer

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import org.json.JSONObject

class TimerStorage(private val context: Context) {
    
    companion object {
        private const val TAG = "TimerStorage"
        private const val PREFS_NAME = "BrainBitesTimerStorage"
        
        // Timer state keys
        private const val KEY_REMAINING_TIME = "remaining_time"
        private const val KEY_DEBT_TIME = "debt_time"
        private const val KEY_IS_TRACKING = "is_tracking"
        private const val KEY_LAST_UPDATE = "last_update"
        
        // Statistics keys
        private const val KEY_TOTAL_TIME_EARNED = "total_time_earned"
        private const val KEY_TOTAL_TIME_SPENT = "total_time_spent"
        private const val KEY_QUESTIONS_ANSWERED = "questions_answered"
        private const val KEY_CORRECT_ANSWERS = "correct_answers"
        private const val KEY_DAILY_STREAK = "daily_streak"
        private const val KEY_LAST_ACTIVITY_DATE = "last_activity_date"
        
        // Preferences keys
        private const val KEY_TIMER_PREFERENCES = "timer_preferences"
    }
    
    private val sharedPrefs: SharedPreferences by lazy {
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }
    
    // Timer State Management
    data class TimerState(
        val remainingTimeSeconds: Int = 0,
        val debtTimeSeconds: Int = 0,
        val isTracking: Boolean = false,
        val lastUpdateTime: Long = System.currentTimeMillis()
    )
    
    fun saveTimerState(state: TimerState) {
        try {
            sharedPrefs.edit()
                .putInt(KEY_REMAINING_TIME, state.remainingTimeSeconds)
                .putInt(KEY_DEBT_TIME, state.debtTimeSeconds)
                .putBoolean(KEY_IS_TRACKING, state.isTracking)
                .putLong(KEY_LAST_UPDATE, state.lastUpdateTime)
                .apply()
            
            Log.d(TAG, "Timer state saved: $state")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to save timer state", e)
        }
    }
    
    fun loadTimerState(): TimerState {
        return try {
            TimerState(
                remainingTimeSeconds = sharedPrefs.getInt(KEY_REMAINING_TIME, 0),
                debtTimeSeconds = sharedPrefs.getInt(KEY_DEBT_TIME, 0),
                isTracking = sharedPrefs.getBoolean(KEY_IS_TRACKING, false),
                lastUpdateTime = sharedPrefs.getLong(KEY_LAST_UPDATE, System.currentTimeMillis())
            ).also {
                Log.d(TAG, "Timer state loaded: $it")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to load timer state", e)
            TimerState()
        }
    }
    
    // Statistics Management
    data class TimerStatistics(
        val totalTimeEarned: Long = 0,
        val totalTimeSpent: Long = 0,
        val questionsAnswered: Int = 0,
        val correctAnswers: Int = 0,
        val dailyStreak: Int = 0,
        val lastActivityDate: String = ""
    )
    
    fun saveStatistics(stats: TimerStatistics) {
        try {
            sharedPrefs.edit()
                .putLong(KEY_TOTAL_TIME_EARNED, stats.totalTimeEarned)
                .putLong(KEY_TOTAL_TIME_SPENT, stats.totalTimeSpent)
                .putInt(KEY_QUESTIONS_ANSWERED, stats.questionsAnswered)
                .putInt(KEY_CORRECT_ANSWERS, stats.correctAnswers)
                .putInt(KEY_DAILY_STREAK, stats.dailyStreak)
                .putString(KEY_LAST_ACTIVITY_DATE, stats.lastActivityDate)
                .apply()
            
            Log.d(TAG, "Statistics saved: $stats")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to save statistics", e)
        }
    }
    
    fun loadStatistics(): TimerStatistics {
        return try {
            TimerStatistics(
                totalTimeEarned = sharedPrefs.getLong(KEY_TOTAL_TIME_EARNED, 0),
                totalTimeSpent = sharedPrefs.getLong(KEY_TOTAL_TIME_SPENT, 0),
                questionsAnswered = sharedPrefs.getInt(KEY_QUESTIONS_ANSWERED, 0),
                correctAnswers = sharedPrefs.getInt(KEY_CORRECT_ANSWERS, 0),
                dailyStreak = sharedPrefs.getInt(KEY_DAILY_STREAK, 0),
                lastActivityDate = sharedPrefs.getString(KEY_LAST_ACTIVITY_DATE, "") ?: ""
            ).also {
                Log.d(TAG, "Statistics loaded: $it")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to load statistics", e)
            TimerStatistics()
        }
    }
    
    // Preferences Management
    data class TimerPreferences(
        val enableNotifications: Boolean = true,
        val enableSounds: Boolean = true,
        val autoStartTracking: Boolean = true,
        val showTimeInStatusBar: Boolean = true,
        val pauseOnLowBattery: Boolean = false,
        val maxDailyScreenTime: Int = 7200, // 2 hours in seconds
        val timeRewards: Map<String, Int> = mapOf(
            "easy" to 60,
            "medium" to 90,
            "hard" to 120,
            "dailyTask" to 3600,
            "streakBonus" to 30
        )
    )
    
    fun savePreferences(preferences: TimerPreferences) {
        try {
            val json = JSONObject().apply {
                put("enableNotifications", preferences.enableNotifications)
                put("enableSounds", preferences.enableSounds)
                put("autoStartTracking", preferences.autoStartTracking)
                put("showTimeInStatusBar", preferences.showTimeInStatusBar)
                put("pauseOnLowBattery", preferences.pauseOnLowBattery)
                put("maxDailyScreenTime", preferences.maxDailyScreenTime)
                
                val rewardsJson = JSONObject()
                preferences.timeRewards.forEach { (key, value) ->
                    rewardsJson.put(key, value)
                }
                put("timeRewards", rewardsJson)
            }
            
            sharedPrefs.edit()
                .putString(KEY_TIMER_PREFERENCES, json.toString())
                .apply()
            
            Log.d(TAG, "Preferences saved: $preferences")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to save preferences", e)
        }
    }
    
    fun loadPreferences(): TimerPreferences {
        return try {
            val jsonString = sharedPrefs.getString(KEY_TIMER_PREFERENCES, null)
            if (jsonString != null) {
                val json = JSONObject(jsonString)
                
                val rewardsJson = json.optJSONObject("timeRewards")
                val timeRewards = mutableMapOf<String, Int>()
                rewardsJson?.let { rewards ->
                    rewards.keys().forEach { key ->
                        timeRewards[key] = rewards.getInt(key)
                    }
                }
                
                TimerPreferences(
                    enableNotifications = json.optBoolean("enableNotifications", true),
                    enableSounds = json.optBoolean("enableSounds", true),
                    autoStartTracking = json.optBoolean("autoStartTracking", true),
                    showTimeInStatusBar = json.optBoolean("showTimeInStatusBar", true),
                    pauseOnLowBattery = json.optBoolean("pauseOnLowBattery", false),
                    maxDailyScreenTime = json.optInt("maxDailyScreenTime", 7200),
                    timeRewards = timeRewards.ifEmpty {
                        mapOf(
                            "easy" to 60,
                            "medium" to 90,
                            "hard" to 120,
                            "dailyTask" to 3600,
                            "streakBonus" to 30
                        )
                    }
                )
            } else {
                TimerPreferences()
            }.also {
                Log.d(TAG, "Preferences loaded: $it")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to load preferences", e)
            TimerPreferences()
        }
    }
    
    // Utility methods
    fun incrementTimeEarned(seconds: Int) {
        val stats = loadStatistics()
        saveStatistics(stats.copy(totalTimeEarned = stats.totalTimeEarned + seconds))
    }
    
    fun incrementTimeSpent(seconds: Int) {
        val stats = loadStatistics()
        saveStatistics(stats.copy(totalTimeSpent = stats.totalTimeSpent + seconds))
    }
    
    fun incrementQuestionStats(correct: Boolean) {
        val stats = loadStatistics()
        saveStatistics(
            stats.copy(
                questionsAnswered = stats.questionsAnswered + 1,
                correctAnswers = if (correct) stats.correctAnswers + 1 else stats.correctAnswers
            )
        )
    }
    
    fun resetAllData() {
        try {
            sharedPrefs.edit().clear().apply()
            Log.d(TAG, "All timer data reset")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to reset timer data", e)
        }
    }
    
    fun exportData(): String {
        return try {
            val timerState = loadTimerState()
            val statistics = loadStatistics()
            val preferences = loadPreferences()
            
            JSONObject().apply {
                put("timerState", JSONObject().apply {
                    put("remainingTimeSeconds", timerState.remainingTimeSeconds)
                    put("debtTimeSeconds", timerState.debtTimeSeconds)
                    put("isTracking", timerState.isTracking)
                    put("lastUpdateTime", timerState.lastUpdateTime)
                })
                
                put("statistics", JSONObject().apply {
                    put("totalTimeEarned", statistics.totalTimeEarned)
                    put("totalTimeSpent", statistics.totalTimeSpent)
                    put("questionsAnswered", statistics.questionsAnswered)
                    put("correctAnswers", statistics.correctAnswers)
                    put("dailyStreak", statistics.dailyStreak)
                    put("lastActivityDate", statistics.lastActivityDate)
                })
                
                put("exportDate", System.currentTimeMillis())
            }.toString(2)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to export data", e)
            "{\"error\": \"Failed to export data\"}"
        }
    }
}