package com.brainbites;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import androidx.core.app.NotificationCompat;
import android.util.Log;

public class TimerService extends Service {
    private static final String TAG = "TimerService";
    private static final String CHANNEL_ID = "BrainBites_Timer";
    private static final int NOTIFICATION_ID = 1001;
    
    private Handler handler;
    private Runnable timerRunnable;
    private boolean isRunning = false;
    private long startTime = 0;
    private long pausedTime = 0;
    private boolean isPaused = false;
    
    @Override
    public void onCreate() {
        super.onCreate();
        handler = new Handler(Looper.getMainLooper());
        createNotificationChannel();
    }
    
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "TimerService started");
        
        if (intent != null) {
            String action = intent.getAction();
            if (action != null) {
                switch (action) {
                    case "START":
                        startTimer();
                        break;
                    case "PAUSE":
                        pauseTimer();
                        break;
                    case "RESUME":
                        resumeTimer();
                        break;
                    case "STOP":
                        stopTimer();
                        break;
                    case "ADD_TIME":
                        long minutes = intent.getLongExtra("minutes", 0);
                        addTime(minutes);
                        break;
                }
            }
        }
        
        startForeground(NOTIFICATION_ID, createNotification());
        return START_STICKY;
    }
    
    private void startTimer() {
        if (!isRunning) {
            isRunning = true;
            startTime = System.currentTimeMillis();
            isPaused = false;
            pausedTime = 0;
            
            timerRunnable = new Runnable() {
                @Override
                public void run() {
                    if (isRunning && !isPaused) {
                        updateNotification();
                        handler.postDelayed(this, 1000); // Update every second
                    }
                }
            };
            
            handler.post(timerRunnable);
            Log.d(TAG, "Timer started");
        }
    }
    
    private void pauseTimer() {
        if (isRunning && !isPaused) {
            isPaused = true;
            pausedTime = System.currentTimeMillis();
            Log.d(TAG, "Timer paused");
        }
    }
    
    private void resumeTimer() {
        if (isRunning && isPaused) {
            isPaused = false;
            long pauseDuration = System.currentTimeMillis() - pausedTime;
            startTime += pauseDuration;
            Log.d(TAG, "Timer resumed");
        }
    }
    
    private void stopTimer() {
        isRunning = false;
        isPaused = false;
        startTime = 0;
        pausedTime = 0;
        
        if (timerRunnable != null) {
            handler.removeCallbacks(timerRunnable);
        }
        
        Log.d(TAG, "Timer stopped");
        stopForeground(true);
        stopSelf();
    }
    
    private void addTime(long minutes) {
        if (isRunning) {
            startTime -= minutes * 60 * 1000; // Subtract minutes (convert to milliseconds)
            Log.d(TAG, "Added " + minutes + " minutes to timer");
        }
    }
    
    private long getElapsedTime() {
        if (!isRunning) return 0;
        
        if (isPaused) {
            return pausedTime - startTime;
        } else {
            return System.currentTimeMillis() - startTime;
        }
    }
    
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "BrainBites Timer",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Shows timer progress");
            
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }
    
    private Notification createNotification() {
        Intent notificationIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this, 0, notificationIntent, 
            PendingIntent.FLAG_IMMUTABLE
        );
        
        long elapsedTime = getElapsedTime();
        String timeText = formatTime(elapsedTime);
        
        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("BrainBites Timer")
            .setContentText("Time earned: " + timeText)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setSilent(true)
            .build();
    }
    
    private void updateNotification() {
        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) {
            manager.notify(NOTIFICATION_ID, createNotification());
        }
    }
    
    private String formatTime(long milliseconds) {
        long seconds = milliseconds / 1000;
        long minutes = seconds / 60;
        long hours = minutes / 60;
        
        if (hours > 0) {
            return String.format("%dh %dm", hours, minutes % 60);
        } else {
            return String.format("%dm", minutes);
        }
    }
    
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
    
    @Override
    public void onDestroy() {
        super.onDestroy();
        if (timerRunnable != null) {
            handler.removeCallbacks(timerRunnable);
        }
        Log.d(TAG, "TimerService destroyed");
    }
} 