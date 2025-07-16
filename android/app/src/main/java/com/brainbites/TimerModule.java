package com.brainbites;

import android.content.Intent;
import android.util.Log;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class TimerModule extends ReactContextBaseJavaModule {
    private static final String TAG = "TimerModule";
    private ReactApplicationContext reactContext;

    public TimerModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "TimerModule";
    }

    @ReactMethod
    public void startTimer(Promise promise) {
        try {
            Intent intent = new Intent(reactContext, TimerService.class);
            intent.setAction("START");
            reactContext.startService(intent);
            Log.d(TAG, "Timer started");
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "Error starting timer", e);
            promise.reject("TIMER_ERROR", "Failed to start timer", e);
        }
    }

    @ReactMethod
    public void pauseTimer(Promise promise) {
        try {
            Intent intent = new Intent(reactContext, TimerService.class);
            intent.setAction("PAUSE");
            reactContext.startService(intent);
            Log.d(TAG, "Timer paused");
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "Error pausing timer", e);
            promise.reject("TIMER_ERROR", "Failed to pause timer", e);
        }
    }

    @ReactMethod
    public void resumeTimer(Promise promise) {
        try {
            Intent intent = new Intent(reactContext, TimerService.class);
            intent.setAction("RESUME");
            reactContext.startService(intent);
            Log.d(TAG, "Timer resumed");
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "Error resuming timer", e);
            promise.reject("TIMER_ERROR", "Failed to resume timer", e);
        }
    }

    @ReactMethod
    public void stopTimer(Promise promise) {
        try {
            Intent intent = new Intent(reactContext, TimerService.class);
            intent.setAction("STOP");
            reactContext.startService(intent);
            Log.d(TAG, "Timer stopped");
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "Error stopping timer", e);
            promise.reject("TIMER_ERROR", "Failed to stop timer", e);
        }
    }

    @ReactMethod
    public void addTime(double minutes, Promise promise) {
        try {
            Intent intent = new Intent(reactContext, TimerService.class);
            intent.setAction("ADD_TIME");
            intent.putExtra("minutes", (long) minutes);
            reactContext.startService(intent);
            Log.d(TAG, "Added " + minutes + " minutes to timer");
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "Error adding time", e);
            promise.reject("TIMER_ERROR", "Failed to add time", e);
        }
    }

    @ReactMethod
    public void addListener(String eventName) {
        // Required for RN built in Event Emitter
    }

    @ReactMethod
    public void removeListeners(Integer count) {
        // Required for RN built in Event Emitter
    }

    private void sendEvent(String eventName, Object params) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit(eventName, params);
    }
} 