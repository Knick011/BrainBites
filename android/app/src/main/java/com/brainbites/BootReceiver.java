package com.brainbites;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

public class BootReceiver extends BroadcastReceiver {
    private static final String TAG = "BrainBitesBootReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction()) ||
            "android.intent.action.QUICKBOOT_POWERON".equals(intent.getAction())) {
            
            Log.d(TAG, "Boot completed - BrainBites timer service will resume");
            
            // The timer service will be handled by React Native's background timer
            // This receiver ensures the app can restart timer tracking after device reboot
        }
    }
}