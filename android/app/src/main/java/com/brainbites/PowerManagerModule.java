package com.brainbites;

import android.content.Context;
import android.os.PowerManager;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class PowerManagerModule extends ReactContextBaseJavaModule {
    private static final String MODULE_NAME = "PowerManager";
    private PowerManager powerManager;

    public PowerManagerModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.powerManager = (PowerManager) reactContext.getSystemService(Context.POWER_SERVICE);
    }

    @Override
    public String getName() {
        return MODULE_NAME;
    }

    @ReactMethod
    public void isScreenOn(Promise promise) {
        try {
            if (powerManager != null) {
                boolean screenOn = powerManager.isInteractive();
                promise.resolve(screenOn);
            } else {
                promise.reject("PowerManager", "PowerManager not available");
            }
        } catch (Exception e) {
            promise.reject("PowerManager", e.getMessage());
        }
    }
}