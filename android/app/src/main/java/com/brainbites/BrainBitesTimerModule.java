// android/app/src/main/java/com/brainbites/timer/BrainBitesTimerModule.java
package com.brainbites.timer;

import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.os.Build;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.util.HashMap;
import java.util.Map;

public class BrainBitesTimerModule extends ReactContextBaseJavaModule implements TimerServiceCallback {
    
    private static final String MODULE_NAME = "BrainBitesTimer";
    private static final String TAG = "BrainBitesTimer";
    private static final String PREFS_NAME = "BrainBitesTimerPrefs";
    
    // Constants for events
    private static final String EVENT_TIMER_UPDATE = "timerUpdate";
    private static final String EVENT_SCREEN_STATE_CHANGED = "screenStateChanged";
    private static final String EVENT_APP_STATE_CHANGED = "appStateChanged";
    
    // Timer state constants
    private static final String KEY_REMAINING_TIME = "remainingTime";
    private static final String KEY_IS_TRACKING = "isTracking";
    private static final String KEY_DEBT_TIME = "debtTime";
    private static final String KEY_LAST_UPDATE = "lastUpdate";
    private static final String KEY_SCREEN_STATE = "screenState";
    private static final String KEY_APP_STATE = "appState";
    
    private final ReactApplicationContext reactContext;
    private ScreenStateReceiver screenStateReceiver;
    private SharedPreferences prefs;
    private boolean isServiceRunning = false;
    private boolean isListening = false;
    
    public BrainBitesTimerModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        this.prefs = reactContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        initializeScreenStateReceiver();
    }
    
    @NonNull
    @Override
    public String getName() {
        return MODULE_NAME;
    }
    
    @Override
    public Map<String, Object> getConstants() {
        final Map<String, Object> constants = new HashMap<>();
        constants.put("EVENT_TIMER_UPDATE", EVENT_TIMER_UPDATE);
        constants.put("EVENT_SCREEN_STATE_CHANGED", EVENT_SCREEN_STATE_CHANGED);
        constants.put("EVENT_APP_STATE_CHANGED", EVENT_APP_STATE_CHANGED);
        return constants;
    }
    
    private void initializeScreenStateReceiver() {
        screenStateReceiver = new ScreenStateReceiver(new ScreenStateReceiver.ScreenStateListener() {
            @Override
            public void onScreenStateChanged(boolean isScreenOn) {
                Log.d(TAG, "Screen state changed: " + (isScreenOn ? "ON" : "OFF"));
                
                // Save screen state
                prefs.edit().putBoolean(KEY_SCREEN_STATE, isScreenOn).apply();
                
                // Update timer service
                updateTimerServiceState();
                
                // Emit event to React Native
                WritableMap params = Arguments.createMap();
                params.putBoolean("isScreenOn", isScreenOn);
                params.putLong("timestamp", System.currentTimeMillis());
                sendEvent(EVENT_SCREEN_STATE_CHANGED, params);
            }
        });
    }
    
    @ReactMethod
    public void startListening() {
        if (!isListening) {
            Log.d(TAG, "Starting to listen for screen state changes");
            
            IntentFilter filter = new IntentFilter();
            filter.addAction(Intent.ACTION_SCREEN_ON);
            filter.addAction(Intent.ACTION_SCREEN_OFF);
            
            try {
                reactContext.registerReceiver(screenStateReceiver, filter);
                isListening = true;
                Log.d(TAG, "Screen state receiver registered successfully");
            } catch (Exception e) {
                Log.e(TAG, "Failed to register screen state receiver", e);
            }
        }
    }
    
    @ReactMethod
    public void stopListening() {
        if (isListening) {
            try {
                reactContext.unregisterReceiver(screenStateReceiver);
                isListening = false;
                Log.d(TAG, "Screen state receiver unregistered");
            } catch (Exception e) {
                Log.e(TAG, "Failed to unregister screen state receiver", e);
            }
        }
    }
    
    @ReactMethod
    public void startTracking(Promise promise) {
        try {
            Log.d(TAG, "Starting timer tracking");
            
            // Save tracking state
            prefs.edit()
                .putBoolean(KEY_IS_TRACKING, true)
                .putLong(KEY_LAST_UPDATE, System.currentTimeMillis())
                .apply();
            
            // Start foreground service
            startTimerService();
            
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "Failed to start tracking", e);
            promise.reject("START_TRACKING_ERROR", e.getMessage());
        }
    }
    
    @ReactMethod
    public void stopTracking(Promise promise) {
        try {
            Log.d(TAG, "Stopping timer tracking");
            
            // Save tracking state
            prefs.edit().putBoolean(KEY_IS_TRACKING, false).apply();
            
            // Stop foreground service
            stopTimerService();
            
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "Failed to stop tracking", e);
            promise.reject("STOP_TRACKING_ERROR", e.getMessage());
        }
    }
    
    @ReactMethod
    public void addTimeCredits(int seconds, Promise promise) {
        try {
            Log.d(TAG, "Adding time credits: " + seconds + " seconds");
            
            long currentTime = getRemainingTimeInternal();
            long newTime = Math.max(0, currentTime + seconds);
            
            // Save new time
            prefs.edit()
                .putLong(KEY_REMAINING_TIME, newTime)
                .putLong(KEY_LAST_UPDATE, System.currentTimeMillis())
                .apply();
            
            // Update service if running
            if (isServiceRunning) {
                updateTimerService();
            }
            
            // Send update event
            sendTimerUpdateEvent();
            
            promise.resolve(newTime);
        } catch (Exception e) {
            Log.e(TAG, "Failed to add time credits", e);
            promise.reject("ADD_TIME_ERROR", e.getMessage());
        }
    }
    
    @ReactMethod
    public void getRemainingTime(Promise promise) {
        try {
            long remainingTime = getRemainingTimeInternal();
            promise.resolve((double) remainingTime);
        } catch (Exception e) {
            Log.e(TAG, "Failed to get remaining time", e);
            promise.reject("GET_TIME_ERROR", e.getMessage());
        }
    }
    
    @ReactMethod
    public void getTimerStatus(Promise promise) {
        try {
            WritableMap status = Arguments.createMap();
            status.putDouble("remainingTime", getRemainingTimeInternal());
            status.putBoolean("isTracking", prefs.getBoolean(KEY_IS_TRACKING, false));
            status.putDouble("debtTime", prefs.getLong(KEY_DEBT_TIME, 0));
            status.putBoolean("isScreenOn", prefs.getBoolean(KEY_SCREEN_STATE, true));
            status.putBoolean("isAppForeground", isAppInForeground());
            status.putLong("lastUpdate", prefs.getLong(KEY_LAST_UPDATE, 0));
            
            promise.resolve(status);
        } catch (Exception e) {
            Log.e(TAG, "Failed to get timer status", e);
            promise.reject("GET_STATUS_ERROR", e.getMessage());
        }
    }
    
    @ReactMethod
    public void notifyAppState(String state) {
        Log.d(TAG, "App state changed to: " + state);
        
        boolean isForeground = "app_foreground".equals(state);
        prefs.edit().putBoolean(KEY_APP_STATE, isForeground).apply();
        
        // Update timer service state
        updateTimerServiceState();
        
        // Emit event to React Native
        WritableMap params = Arguments.createMap();
        params.putString("state", state);
        params.putBoolean("isForeground", isForeground);
        params.putLong("timestamp", System.currentTimeMillis());
        sendEvent(EVENT_APP_STATE_CHANGED, params);
    }
    
    @ReactMethod
    public void resetTimer(Promise promise) {
        try {
            Log.d(TAG, "Resetting timer");
            
            prefs.edit()
                .putLong(KEY_REMAINING_TIME, 0)
                .putLong(KEY_DEBT_TIME, 0)
                .putBoolean(KEY_IS_TRACKING, false)
                .putLong(KEY_LAST_UPDATE, System.currentTimeMillis())
                .apply();
            
            stopTimerService();
            sendTimerUpdateEvent();
            
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "Failed to reset timer", e);
            promise.reject("RESET_TIMER_ERROR", e.getMessage());
        }
    }
    
    private long getRemainingTimeInternal() {
        long savedTime = prefs.getLong(KEY_REMAINING_TIME, 0);
        long lastUpdate = prefs.getLong(KEY_LAST_UPDATE, System.currentTimeMillis());
        boolean isTracking = prefs.getBoolean(KEY_IS_TRACKING, false);
        
        if (!isTracking) {
            return savedTime;
        }
        
        // Calculate elapsed time since last update
        long currentTime = System.currentTimeMillis();
        long elapsedSeconds = (currentTime - lastUpdate) / 1000;
        
        // Only subtract time if conditions are met (background + screen on)
        if (shouldTimerRun()) {
            return Math.max(savedTime - elapsedSeconds, Long.MIN_VALUE / 2); // Allow negative time
        }
        
        return savedTime;
    }
    
    private boolean shouldTimerRun() {
        boolean isScreenOn = prefs.getBoolean(KEY_SCREEN_STATE, true);
        boolean isAppForeground = isAppInForeground();
        
        // Timer runs when app is in background AND screen is on
        return !isAppForeground && isScreenOn;
    }
    
    private boolean isAppInForeground() {
        // Check if app is in foreground using stored state
        return prefs.getBoolean(KEY_APP_STATE, true);
    }
    
    private void startTimerService() {
        if (!isServiceRunning) {
            Intent serviceIntent = new Intent(reactContext, TimerService.class);
            serviceIntent.setAction(TimerService.ACTION_START_TIMER);
            
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    reactContext.startForegroundService(serviceIntent);
                } else {
                    reactContext.startService(serviceIntent);
                }
                isServiceRunning = true;
                Log.d(TAG, "Timer service started");
            } catch (Exception e) {
                Log.e(TAG, "Failed to start timer service", e);
            }
        }
    }
    
    private void stopTimerService() {
        if (isServiceRunning) {
            Intent serviceIntent = new Intent(reactContext, TimerService.class);
            reactContext.stopService(serviceIntent);
            isServiceRunning = false;
            Log.d(TAG, "Timer service stopped");
        }
    }
    
    private void updateTimerService() {
        if (isServiceRunning) {
            Intent serviceIntent = new Intent(reactContext, TimerService.class);
            serviceIntent.setAction(TimerService.ACTION_UPDATE_TIMER);
            
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    reactContext.startForegroundService(serviceIntent);
                } else {
                    reactContext.startService(serviceIntent);
                }
            } catch (Exception e) {
                Log.e(TAG, "Failed to update timer service", e);
            }
        }
    }
    
    private void updateTimerServiceState() {
        if (isServiceRunning) {
            Intent serviceIntent = new Intent(reactContext, TimerService.class);
            serviceIntent.setAction(TimerService.ACTION_STATE_CHANGED);
            serviceIntent.putExtra("shouldRun", shouldTimerRun());
            
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    reactContext.startForegroundService(serviceIntent);
                } else {
                    reactContext.startService(serviceIntent);
                }
            } catch (Exception e) {
                Log.e(TAG, "Failed to update timer service state", e);
            }
        }
    }
    
    private void sendTimerUpdateEvent() {
        WritableMap params = Arguments.createMap();
        params.putDouble("remainingTime", getRemainingTimeInternal());
        params.putBoolean("isTracking", prefs.getBoolean(KEY_IS_TRACKING, false));
        params.putDouble("debtTime", prefs.getLong(KEY_DEBT_TIME, 0));
        params.putBoolean("isScreenOn", prefs.getBoolean(KEY_SCREEN_STATE, true));
        params.putBoolean("isAppForeground", isAppInForeground());
        params.putLong("timestamp", System.currentTimeMillis());
        
        sendEvent(EVENT_TIMER_UPDATE, params);
    }
    
    private void sendEvent(String eventName, @Nullable WritableMap params) {
        if (reactContext.hasActiveCatalystInstance()) {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, params);
        }
    }
    
    // TimerServiceCallback implementation
    @Override
    public void onTimerUpdate(long remainingTime, long debtTime) {
        // Update stored values
        prefs.edit()
            .putLong(KEY_REMAINING_TIME, remainingTime)
            .putLong(KEY_DEBT_TIME, debtTime)
            .putLong(KEY_LAST_UPDATE, System.currentTimeMillis())
            .apply();
        
        // Send update to React Native
        sendTimerUpdateEvent();
    }
    
    @Override
    public void onInvalidate() {
        super.onInvalidate();
        stopListening();
        stopTimerService();
    }
}