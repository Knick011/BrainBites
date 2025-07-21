// android/app/src/main/java/com/brainbites/timer/TimerService.kt
package com.brainbites.timer

import android.app.*
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.PowerManager
import android.util.Log
import androidx.core.app.NotificationCompat
import com.brainbites.R

class TimerService : Service() {
    
    companion object {
        private const val TAG = "TimerService"
        private const val NOTIFICATION_ID = 1001
        private const val CHANNEL_ID = "brainbites_timer_channel"
        private const val PREFS_NAME = "BrainBitesTimerPrefs"
        
        // Timer update interval (1 second)
        private const val TIMER_INTERVAL = 1000L
        
        // Actions
        const val ACTION_START_TIMER = "start_timer"
        const val ACTION_STOP_TIMER = "stop_timer"
        const val ACTION_UPDATE_TIME = "update_time"
        const val ACTION_ADD_TIME = "add_time"
        const val EXTRA_TIME_SECONDS = "time_seconds"
        
        // SharedPreferences keys
        private const val KEY_REMAINING_TIME = "remaining_time"
        private const val KEY_DEBT_TIME = "debt_time"
        private const val KEY_IS_TRACKING = "is_tracking"
        private const val KEY_LAST_UPDATE = "last_update"
    }
    
    private lateinit var powerManager: PowerManager
    private lateinit var keyguardManager: KeyguardManager
    private lateinit var sharedPrefs: SharedPreferences
    private lateinit var notificationManager: NotificationManager
    private lateinit var timerNotificationManager: TimerNotificationManager
    
    private val handler = Handler(Looper.getMainLooper())
    private var timerRunnable: Runnable? = null
    private var wakeLock: PowerManager.WakeLock? = null
    
    private var remainingTimeSeconds = 0
    private var debtTimeSeconds = 0
    private var isTracking = false
    private var lastUpdateTime = 0L
    
    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "TimerService created")
        
        // Initialize system services
        powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
        keyguardManager = getSystemService(Context.KEYGUARD_SERVICE) as KeyguardManager
        sharedPrefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        timerNotificationManager = TimerNotificationManager(this)
        
        // Create notification channel
        createNotificationChannel()
        
        // Load saved timer state
        loadTimerState()
        
        // Acquire wake lock
        wakeLock = powerManager.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK,
            "BrainBites::TimerService"
        ).apply {
            acquire(10*60*1000L /*10 minutes*/)
        }
    }
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d(TAG, "TimerService started with action: ${intent?.action}")
        
        when (intent?.action) {
            ACTION_START_TIMER -> {
                startTimer()
            }
            ACTION_STOP_TIMER -> {
                stopTimer()
            }
            ACTION_ADD_TIME -> {
                val seconds = intent.getIntExtra(EXTRA_TIME_SECONDS, 0)
                addTimeCredits(seconds)
            }
        }
        
        return START_STICKY
    }
    
    override fun onBind(intent: Intent?): IBinder? = null
    
    override fun onDestroy() {
        super.onDestroy()
        Log.d(TAG, "TimerService destroyed")
        
        stopTimer()
        wakeLock?.let { 
            if (it.isHeld) {
                it.release()
            }
        }
    }
    
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "BrainBites Timer",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Shows your remaining screen time"
                setShowBadge(false)
                enableVibration(false)
                setSound(null, null)
            }
            notificationManager.createNotificationChannel(channel)
        }
    }
    
    private fun startTimer() {
        Log.d(TAG, "Starting timer")
        isTracking = true
        lastUpdateTime = System.currentTimeMillis()
        saveTimerState()
        
        // Start foreground service
        startForeground(NOTIFICATION_ID, createNotification())
        
        // Start timer loop
        startTimerLoop()
    }
    
    private fun stopTimer() {
        Log.d(TAG, "Stopping timer")
        isTracking = false
        saveTimerState()
        
        // Stop timer loop
        timerRunnable?.let { handler.removeCallbacks(it) }
        timerRunnable = null
        
        // Stop foreground service
        stopForeground(NOTIFICATION_ID)
        stopSelf()
    }
    
    private fun startTimerLoop() {
        timerRunnable = object : Runnable {
            override fun run() {
                updateTimer()
                handler.postDelayed(this, TIMER_INTERVAL)
            }
        }
        handler.post(timerRunnable!!)
    }
    
    private fun updateTimer() {
        if (!isTracking) return
        
        val currentTime = System.currentTimeMillis()
        val elapsedSeconds = ((currentTime - lastUpdateTime) / 1000).toInt()
        
        if (elapsedSeconds >= 1) {
            // Only count down if conditions are met
            if (shouldCountDown()) {
                if (remainingTimeSeconds > 0) {
                    remainingTimeSeconds -= elapsedSeconds
                    if (remainingTimeSeconds < 0) {
                        debtTimeSeconds += -remainingTimeSeconds
                        remainingTimeSeconds = 0
                    }
                } else {
                    debtTimeSeconds += elapsedSeconds
                }
                
                saveTimerState()
                updateNotification()
                broadcastUpdate()
            }
            
            lastUpdateTime = currentTime
        }
    }
    
    private fun shouldCountDown(): Boolean {
        // Only count down when:
        // 1. Screen is on
        // 2. Device is not locked
        // 3. App is not in foreground (this is handled by the native module)
        return powerManager.isInteractive && !keyguardManager.isKeyguardLocked
    }
    
    private fun addTimeCredits(seconds: Int) {
        Log.d(TAG, "Adding $seconds seconds to timer")
        
        if (debtTimeSeconds > 0) {
            // First pay off debt
            val debtPayment = minOf(seconds, debtTimeSeconds)
            debtTimeSeconds -= debtPayment
            val remainingCredits = seconds - debtPayment
            
            if (remainingCredits > 0) {
                remainingTimeSeconds += remainingCredits
            }
        } else {
            // Add directly to remaining time
            remainingTimeSeconds += seconds
        }
        
        saveTimerState()
        updateNotification()
        broadcastUpdate()
    }
    
    private fun loadTimerState() {
        remainingTimeSeconds = sharedPrefs.getInt(KEY_REMAINING_TIME, 0)
        debtTimeSeconds = sharedPrefs.getInt(KEY_DEBT_TIME, 0)
        isTracking = sharedPrefs.getBoolean(KEY_IS_TRACKING, false)
        lastUpdateTime = sharedPrefs.getLong(KEY_LAST_UPDATE, System.currentTimeMillis())
        
        Log.d(TAG, "Loaded timer state: remaining=$remainingTimeSeconds, debt=$debtTimeSeconds")
    }
    
    private fun saveTimerState() {
        sharedPrefs.edit()
            .putInt(KEY_REMAINING_TIME, remainingTimeSeconds)
            .putInt(KEY_DEBT_TIME, debtTimeSeconds)
            .putBoolean(KEY_IS_TRACKING, isTracking)
            .putLong(KEY_LAST_UPDATE, System.currentTimeMillis())
            .apply()
    }
    
    private fun createNotification(): Notification {
        return timerNotificationManager.createNotification(
            remainingTimeSeconds = remainingTimeSeconds,
            debtTimeSeconds = debtTimeSeconds,
            isTracking = isTracking
        )
    }
    
    private fun updateNotification() {
        val notification = createNotification()
        notificationManager.notify(NOTIFICATION_ID, notification)
    }
    
    private fun broadcastUpdate() {
        val intent = Intent("brainbites_timer_update").apply {
            putExtra("remaining_time", remainingTimeSeconds)
            putExtra("debt_time", debtTimeSeconds)
            putExtra("is_tracking", isTracking)
            putExtra("timestamp", System.currentTimeMillis())
        }
        sendBroadcast(intent)
    }
}