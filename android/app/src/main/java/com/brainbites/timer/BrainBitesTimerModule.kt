// android/app/src/main/java/com/brainbites/timer/BrainBitesTimerModule.kt
package com.brainbites.timer

import android.app.KeyguardManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.SharedPreferences
import android.os.PowerManager
import android.util.Log
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class BrainBitesTimerModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val TAG = "BrainBitesTimerModule"
        private const val MODULE_NAME = "BrainBitesTimer"
        
        // Event names
        const val EVENT_TIMER_UPDATE = "BrainBitesTimerUpdate"
        const val EVENT_SCREEN_STATE_CHANGED = "BrainBitesScreenStateChanged"
        const val EVENT_APP_STATE_CHANGED = "BrainBitesAppStateChanged"
        
        // SharedPreferences keys
        private const val PREFS_NAME = "BrainBitesTimerPrefs"
        private const val KEY_REMAINING_TIME = "remaining_time"
        private const val KEY_DEBT_TIME = "debt_time"
        private const val KEY_LAST_UPDATE = "last_update"
        private const val KEY_IS_TRACKING = "is_tracking"
    }

    private var timerStorage: TimerStorage? = null
    private var notificationManager: TimerNotificationManager? = null
    private var powerManager: PowerManager? = null
    private var keyguardManager: KeyguardManager? = null
    private var sharedPrefs: SharedPreferences? = null
    
    // Current timer state
    private var remainingTimeSeconds = 0
    private var debtTimeSeconds = 0
    private var isTracking = false
    private var isAppForeground = true
    private var isScreenOn = true
    private var lastUpdateTime = System.currentTimeMillis()
    
    // Screen state receiver
    private var screenStateReceiver: ScreenStateReceiver? = null
    private var isListening = false

    override fun getName(): String = MODULE_NAME

    override fun initialize() {
        super.initialize()
        try {
            Log.d(TAG, "Initializing BrainBitesTimerModule")
            
            // Initialize system services
            powerManager = reactContext.getSystemService(Context.POWER_SERVICE) as PowerManager
            keyguardManager = reactContext.getSystemService(Context.KEYGUARD_SERVICE) as KeyguardManager
            sharedPrefs = reactContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            
            // Initialize our custom classes
            timerStorage = TimerStorage(reactContext)
            notificationManager = TimerNotificationManager(reactContext)
            
            // Load saved state
            loadTimerState()
            
            Log.d(TAG, "BrainBitesTimerModule initialized successfully")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to initialize BrainBitesTimerModule", e)
        }
    }

    override fun onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy()
        stopListening()
    }

    override fun getConstants(): MutableMap<String, Any> {
        return hashMapOf(
            "EVENT_TIMER_UPDATE" to EVENT_TIMER_UPDATE,
            "EVENT_SCREEN_STATE_CHANGED" to EVENT_SCREEN_STATE_CHANGED,
            "EVENT_APP_STATE_CHANGED" to EVENT_APP_STATE_CHANGED
        )
    }

    @ReactMethod
    fun startListening() {
        if (isListening) return
        
        try {
            Log.d(TAG, "Starting to listen for screen state changes")
            
            screenStateReceiver = ScreenStateReceiver { isScreenOn ->
                this.isScreenOn = isScreenOn
                updateTimerState()
                sendScreenStateEvent(isScreenOn)
            }
            
            val filter = IntentFilter().apply {
                addAction(Intent.ACTION_SCREEN_ON)
                addAction(Intent.ACTION_SCREEN_OFF)
                addAction(Intent.ACTION_USER_PRESENT)
            }
            
            reactContext.registerReceiver(screenStateReceiver, filter)
            isListening = true
            
            // Get initial screen state
            isScreenOn = powerManager?.isInteractive ?: true
            
            Log.d(TAG, "Started listening, initial screen state: $isScreenOn")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start listening", e)
        }
    }

    @ReactMethod
    fun stopListening() {
        if (!isListening) return
        
        try {
            Log.d(TAG, "Stopping screen state listener")
            screenStateReceiver?.let { receiver ->
                reactContext.unregisterReceiver(receiver)
            }
            screenStateReceiver = null
            isListening = false
        } catch (e: Exception) {
            Log.e(TAG, "Failed to stop listening", e)
        }
    }

    @ReactMethod
    fun startTracking(promise: Promise) {
        try {
            Log.d(TAG, "Starting timer tracking")
            isTracking = true
            lastUpdateTime = System.currentTimeMillis()
            saveTimerState()
            
            // Start the timer service
            val serviceIntent = Intent(reactContext, TimerService::class.java).apply {
                action = TimerService.ACTION_START_TIMER
            }
            reactContext.startForegroundService(serviceIntent)
            
            updateTimerState()
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start tracking", e)
            promise.reject("START_TRACKING_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun stopTracking(promise: Promise) {
        try {
            Log.d(TAG, "Stopping timer tracking")
            isTracking = false
            saveTimerState()
            
            // Stop the timer service
            val serviceIntent = Intent(reactContext, TimerService::class.java).apply {
                action = TimerService.ACTION_STOP_TIMER
            }
            reactContext.startService(serviceIntent)
            
            updateTimerState()
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to stop tracking", e)
            promise.reject("STOP_TRACKING_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun addTimeCredits(seconds: Int, promise: Promise) {
        try {
            Log.d(TAG, "Adding $seconds seconds to timer")
            
            if (debtTimeSeconds > 0) {
                // First pay off debt
                val debtPayment = minOf(seconds, debtTimeSeconds)
                debtTimeSeconds -= debtPayment
                val remainingCredits = seconds - debtPayment
                
                if (remainingCredits > 0) {
                    remainingTimeSeconds += remainingCredits
                }
                
                Log.d(TAG, "Paid off $debtPayment debt, added $remainingCredits to remaining time")
            } else {
                // Add directly to remaining time
                remainingTimeSeconds += seconds
            }
            
            saveTimerState()
            updateTimerState()
            
            promise.resolve(remainingTimeSeconds)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to add time credits", e)
            promise.reject("ADD_TIME_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun getRemainingTime(promise: Promise) {
        try {
            promise.resolve(remainingTimeSeconds)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to get remaining time", e)
            promise.reject("GET_TIME_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun getTimerStatus(promise: Promise) {
        try {
            val statusMap = WritableNativeMap().apply {
                putInt("remainingTime", remainingTimeSeconds)
                putBoolean("isTracking", isTracking)
                putInt("debtTime", debtTimeSeconds)
                putBoolean("isScreenOn", isScreenOn)
                putBoolean("isAppForeground", isAppForeground)
                putDouble("lastUpdate", lastUpdateTime.toDouble())
            }
            promise.resolve(statusMap)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to get timer status", e)
            promise.reject("GET_STATUS_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun notifyAppState(state: String) {
        try {
            Log.d(TAG, "App state changed to: $state")
            isAppForeground = when (state.lowercase()) {
                "foreground", "active" -> true
                "background", "inactive" -> false
                else -> isAppForeground
            }
            
            updateTimerState()
            sendAppStateEvent(state, isAppForeground)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to handle app state change", e)
        }
    }

    @ReactMethod
    fun resetTimer(promise: Promise) {
        try {
            Log.d(TAG, "Resetting timer")
            remainingTimeSeconds = 0
            debtTimeSeconds = 0
            isTracking = false
            lastUpdateTime = System.currentTimeMillis()
            
            saveTimerState()
            
            // Stop timer service
            val serviceIntent = Intent(reactContext, TimerService::class.java).apply {
                action = TimerService.ACTION_STOP_TIMER
            }
            reactContext.startService(serviceIntent)
            
            updateTimerState()
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to reset timer", e)
            promise.reject("RESET_ERROR", e.message, e)
        }
    }

    // Internal methods
    private fun loadTimerState() {
        try {
            sharedPrefs?.let { prefs ->
                remainingTimeSeconds = prefs.getInt(KEY_REMAINING_TIME, 0)
                debtTimeSeconds = prefs.getInt(KEY_DEBT_TIME, 0)
                isTracking = prefs.getBoolean(KEY_IS_TRACKING, false)
                lastUpdateTime = prefs.getLong(KEY_LAST_UPDATE, System.currentTimeMillis())
                
                Log.d(TAG, "Loaded timer state: remaining=$remainingTimeSeconds, debt=$debtTimeSeconds, tracking=$isTracking")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to load timer state", e)
        }
    }

    private fun saveTimerState() {
        try {
            sharedPrefs?.edit()?.apply {
                putInt(KEY_REMAINING_TIME, remainingTimeSeconds)
                putInt(KEY_DEBT_TIME, debtTimeSeconds)
                putBoolean(KEY_IS_TRACKING, isTracking)
                putLong(KEY_LAST_UPDATE, System.currentTimeMillis())
                apply()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to save timer state", e)
        }
    }

    private fun updateTimerState() {
        try {
            // Update notification
            notificationManager?.updateNotification(
                remainingTimeSeconds = remainingTimeSeconds,
                debtTimeSeconds = debtTimeSeconds,
                isTracking = shouldTrackTime()
            )
            
            // Send event to React Native
            sendTimerUpdateEvent()
            
        } catch (e: Exception) {
            Log.e(TAG, "Failed to update timer state", e)
        }
    }

    private fun shouldTrackTime(): Boolean {
        return isTracking && !isAppForeground && isScreenOn && !(keyguardManager?.isKeyguardLocked ?: false)
    }

    private fun sendTimerUpdateEvent() {
        try {
            val eventData = WritableNativeMap().apply {
                putInt("remainingTime", remainingTimeSeconds)
                putBoolean("isTracking", shouldTrackTime())
                putInt("debtTime", debtTimeSeconds)
                putBoolean("isScreenOn", isScreenOn)
                putBoolean("isAppForeground", isAppForeground)
                putDouble("timestamp", System.currentTimeMillis().toDouble())
            }
            
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(EVENT_TIMER_UPDATE, eventData)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to send timer update event", e)
        }
    }

    private fun sendScreenStateEvent(isScreenOn: Boolean) {
        try {
            val eventData = WritableNativeMap().apply {
                putBoolean("isScreenOn", isScreenOn)
                putDouble("timestamp", System.currentTimeMillis().toDouble())
            }
            
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(EVENT_SCREEN_STATE_CHANGED, eventData)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to send screen state event", e)
        }
    }

    private fun sendAppStateEvent(state: String, isForeground: Boolean) {
        try {
            val eventData = WritableNativeMap().apply {
                putString("state", state)
                putBoolean("isForeground", isForeground)
                putDouble("timestamp", System.currentTimeMillis().toDouble())
            }
            
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(EVENT_APP_STATE_CHANGED, eventData)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to send app state event", e)
        }
    }
}