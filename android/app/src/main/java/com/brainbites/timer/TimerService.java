// android/app/src/main/java/com/brainbites/timer/TimerService.java
package com.brainbites.timer;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.util.Log;

import androidx.core.app.NotificationCompat;
import androidx.annotation.Nullable;

import com.brainbites.MainActivity;
import com.brainbites.R;

public class TimerService extends Service {
    
    private static final String TAG = "TimerService";
    private static final String CHANNEL_ID = "BrainBitesTimerChannel";
    private static final int NOTIFICATION_ID = 1001;
    
    // Actions
    public static final String ACTION_START_TIMER = "START_TIMER";
    public static final String ACTION_STOP_TIMER = "STOP_TIMER";
    public static final String ACTION_UPDATE_TIMER = "UPDATE_TIMER";
    public static final String ACTION_STATE_CHANGED = "STATE_CHANGED";
    
    // Preferences
    private static final String PREFS_NAME = "BrainBitesTimerPrefs";
    private static final String KEY_REMAINING_TIME = "remainingTime";
    private static final String KEY_DEBT_TIME = "debtTime";
    private static final String KEY_LAST_UPDATE = "lastUpdate";
    private static final String KEY_SCREEN_STATE = "screenState";
    private static final String KEY_APP_STATE = "appState";
    private static final String KEY_IS_TRACKING = "isTracking";
    
    private Handler handler;
    private Runnable timerRunnable;
    private SharedPreferences prefs;
    private NotificationManager notificationManager;
    private TimerServiceCallback callback;
    private boolean shouldRun = false;
    
    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "Timer service created");
        
        prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        handler = new Handler(Looper.getMainLooper());
        
        createNotificationChannel();
        initializeTimerRunnable();
    }
    
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            String action = intent.getAction();
            Log.d(TAG, "Service started with action: " + action);
            
            switch (action != null ? action : "") {
                case ACTION_START_TIMER:
                    startTimerTracking();
                    break;
                case ACTION_STOP_TIMER:
                    stopTimerTracking();
                    break;
                case ACTION_UPDATE_TIMER:
                    updateNotification();
                    break;
                case ACTION_STATE_CHANGED:
                    boolean newShouldRun = intent.getBooleanExtra("shouldRun", false);
                    handleStateChange(newShouldRun);
                    break;
            }
        }
        
        return START_STICKY; // Restart service if killed
    }
    
    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null; // This is a started service, not bound
    }
    
    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "Timer service destroyed");
        
        if (handler != null && timerRunnable != null) {
            handler.removeCallbacks(timerRunnable);
        }
    }
    
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "BrainBites Timer",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Shows your earned time balance");
            channel.setShowBadge(false);
            channel.setSound(null, null);
            notificationManager.createNotificationChannel(channel);
        }
    }
    
    private void initializeTimerRunnable() {
        timerRunnable = new Runnable() {
            @Override
            public void run() {
                if (shouldRun && prefs.getBoolean(KEY_IS_TRACKING, false)) {
                    updateTimer();
                }
                
                // Schedule next update
                handler.postDelayed(this, 1000); // Update every second
            }
        };
    }
    
    private void startTimerTracking() {
        Log.d(TAG, "Starting timer tracking");
        
        // Determine if timer should run based on current state
        shouldRun = shouldTimerRun();
        
        // Start foreground service with notification
        startForeground(NOTIFICATION_ID, createNotification());
        
        // Start timer updates
        handler.post(timerRunnable);
    }
    
    private void stopTimerTracking() {
        Log.d(TAG, "Stopping timer tracking");
        
        shouldRun = false;
        
        // Remove timer updates
        if (handler != null && timerRunnable != null) {
            handler.removeCallbacks(timerRunnable);
        }
        
        // Stop foreground service
        stopForeground(true);
        stopSelf();
    }
    
    private void handleStateChange(boolean newShouldRun) {
        Log.d(TAG, "Timer state changed: shouldRun = " + newShouldRun);
        
        boolean wasRunning = shouldRun;
        shouldRun = newShouldRun;
        
        // Update last update time when state changes
        prefs.edit().putLong(KEY_LAST_UPDATE, System.currentTimeMillis()).apply();
        
        // Update notification to reflect new state
        updateNotification();
        
        // Log state change for debugging
        if (wasRunning != shouldRun) {
            Log.d(TAG, "Timer " + (shouldRun ? "started" : "paused") + " due to state change");
        }
    }
    
    private boolean shouldTimerRun() {
        boolean isScreenOn = prefs.getBoolean(KEY_SCREEN_STATE, true);
        boolean isAppForeground = prefs.getBoolean(KEY_APP_STATE, true);
        
        // Timer runs when app is in background AND screen is on
        return !isAppForeground && isScreenOn;
    }
    
    private void updateTimer() {
        long currentTime = System.currentTimeMillis();
        long lastUpdate = prefs.getLong(KEY_LAST_UPDATE, currentTime);
        long remainingTime = prefs.getLong(KEY_REMAINING_TIME, 0);
        long debtTime = prefs.getLong(KEY_DEBT_TIME, 0);
        
        // Calculate elapsed time
        long elapsedSeconds = (currentTime - lastUpdate) / 1000;
        
        if (elapsedSeconds > 0) {
            // Subtract elapsed time from remaining time
            remainingTime -= elapsedSeconds;
            
            // If time goes negative, add to debt
            if (remainingTime < 0) {
                debtTime += Math.abs(remainingTime);
                remainingTime = 0;
            }
            
            // Save updated values
            prefs.edit()
                .putLong(KEY_REMAINING_TIME, remainingTime)
                .putLong(KEY_DEBT_TIME, debtTime)
                .putLong(KEY_LAST_UPDATE, currentTime)
                .apply();
            
            // Update notification
            updateNotification();
            
            // Notify callback if available
            if (callback != null) {
                callback.onTimerUpdate(remainingTime, debtTime);
            }
        }
    }
    
    private void updateNotification() {
        Notification notification = createNotification();
        notificationManager.notify(NOTIFICATION_ID, notification);
    }
    
    private Notification createNotification() {
        long remainingTime = prefs.getLong(KEY_REMAINING_TIME, 0);
        long debtTime = prefs.getLong(KEY_DEBT_TIME, 0);
        boolean isTracking = prefs.getBoolean(KEY_IS_TRACKING, false);
        
        // Create notification content
        String title = "BrainBites Timer";
        String content;
        int iconRes;
        
        if (debtTime > 0) {
            content = "Debt: " + formatTime(debtTime) + " ⚠️";
            iconRes = android.R.drawable.stat_notify_error;
        } else if (remainingTime > 0) {
            content = "Earned: " + formatTime(remainingTime) + " ✨";
            iconRes = android.R.drawable.stat_notify_sync;
        } else {
            content = "No time earned yet";
            iconRes = android.R.drawable.stat_notify_more;
        }
        
        // Add status indicator
        if (!isTracking) {
            content += " (Paused)";
        } else if (!shouldRun) {
            content += " (Not counting)";
        }
        
        // Create intent to open app
        Intent intent = new Intent(this, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this, 
            0, 
            intent, 
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? 
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE :
                PendingIntent.FLAG_UPDATE_CURRENT
        );
        
        // Build notification
        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(content)
            .setSmallIcon(iconRes)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setAutoCancel(false)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_SERVICE);
        
        // Add action buttons
        if (isTracking) {
            // Add pause action
            Intent pauseIntent = new Intent(this, TimerService.class);
            pauseIntent.setAction(ACTION_STOP_TIMER);
            PendingIntent pausePendingIntent = PendingIntent.getService(
                this, 
                1, 
                pauseIntent, 
                Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? 
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE :
                    PendingIntent.FLAG_UPDATE_CURRENT
            );
            builder.addAction(android.R.drawable.ic_media_pause, "Pause", pausePendingIntent);
        }
        
        return builder.build();
    }
    
    private String formatTime(long seconds) {
        if (seconds < 0) seconds = 0;
        
        long hours = seconds / 3600;
        long minutes = (seconds % 3600) / 60;
        long secs = seconds % 60;
        
        if (hours > 0) {
            return String.format("%dh %dm", hours, minutes);
        } else if (minutes > 0) {
            return String.format("%dm %ds", minutes, secs);
        } else {
            return String.format("%ds", secs);
        }
    }
    
    public void setCallback(TimerServiceCallback callback) {
        this.callback = callback;
    }
}

// android/app/src/main/java/com/brainbites/timer/TimerServiceCallback.java
package com.brainbites.timer;

public interface TimerServiceCallback {
    void onTimerUpdate(long remainingTime, long debtTime);
}

// android/app/src/main/java/com/brainbites/timer/ScreenStateReceiver.java
package com.brainbites.timer;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

public class ScreenStateReceiver extends BroadcastReceiver {
    
    private static final String TAG = "ScreenStateReceiver";
    
    public interface ScreenStateListener {
        void onScreenStateChanged(boolean isScreenOn);
    }
    
    private ScreenStateListener listener;
    
    public ScreenStateReceiver(ScreenStateListener listener) {
        this.listener = listener;
    }
    
    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || intent.getAction() == null) {
            return;
        }
        
        String action = intent.getAction();
        Log.d(TAG, "Received broadcast: " + action);
        
        boolean isScreenOn = false;
        
        switch (action) {
            case Intent.ACTION_SCREEN_ON:
                isScreenOn = true;
                Log.d(TAG, "Screen turned ON");
                break;
            case Intent.ACTION_SCREEN_OFF:
                isScreenOn = false;
                Log.d(TAG, "Screen turned OFF");
                break;
            default:
                Log.d(TAG, "Unknown action: " + action);
                return;
        }
        
        if (listener != null) {
            listener.onScreenStateChanged(isScreenOn);
        }
    }
}

// android/app/src/main/java/com/brainbites/timer/TimerUtils.java
package com.brainbites.timer;

import android.content.Context;
import android.content.SharedPreferences;

public class TimerUtils {
    
    private static final String PREFS_NAME = "BrainBitesTimerPrefs";
    
    // Time rewards in seconds
    public static final int REWARD_CORRECT_EASY = 60;      // 1 minute
    public static final int REWARD_CORRECT_MEDIUM = 90;    // 1.5 minutes
    public static final int REWARD_CORRECT_HARD = 120;     // 2 minutes
    public static final int REWARD_DAILY_TASK = 3600;      // 1 hour
    public static final int REWARD_STREAK_BONUS = 30;      // 30 seconds per streak milestone
    
    // Debt calculation
    public static final int DEBT_PENALTY_PER_MINUTE = 10;  // 10 points lost per minute of debt
    
    public static int calculateTimeReward(String difficulty, int responseTimeMs, int streakCount) {
        int baseReward;
        
        switch (difficulty.toLowerCase()) {
            case "easy":
                baseReward = REWARD_CORRECT_EASY;
                break;
            case "medium":
                baseReward = REWARD_CORRECT_MEDIUM;
                break;
            case "hard":
                baseReward = REWARD_CORRECT_HARD;
                break;
            default:
                baseReward = REWARD_CORRECT_EASY;
        }
        
        // Speed bonus: up to 30 seconds for answers under 5 seconds
        int speedBonus = 0;
        if (responseTimeMs < 5000) {
            speedBonus = 30 - (responseTimeMs / 1000) * 6; // 6 seconds reduction per second
            speedBonus = Math.max(0, speedBonus);
        }
        
        // Streak bonus: 30 seconds for every 5-question milestone
        int streakBonus = (streakCount / 5) * REWARD_STREAK_BONUS;
        
        return baseReward + speedBonus + streakBonus;
    }
    
    public static int calculateDebtPenalty(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        long debtTime = prefs.getLong("debtTime", 0);
        return (int) (debtTime / 60) * DEBT_PENALTY_PER_MINUTE;
    }
    
    public static String formatDuration(long seconds) {
        if (seconds < 0) return "0s";
        
        long hours = seconds / 3600;
        long minutes = (seconds % 3600) / 60;
        long secs = seconds % 60;
        
        if (hours > 0) {
            return String.format("%dh %dm %ds", hours, minutes, secs);
        } else if (minutes > 0) {
            return String.format("%dm %ds", minutes, secs);
        } else {
            return String.format("%ds", secs);
        }
    }
    
    public static boolean isTimerInDebt(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        return prefs.getLong("debtTime", 0) > 0;
    }
}