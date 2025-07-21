// android/app/src/main/java/com/brainbites/timer/ScreenStateReceiver.kt
package com.brainbites.timer

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

class ScreenStateReceiver(private val onScreenStateChanged: (Boolean) -> Unit) : BroadcastReceiver() {
    
    companion object {
        private const val TAG = "ScreenStateReceiver"
    }
    
    override fun onReceive(context: Context?, intent: Intent?) {
        when (intent?.action) {
            Intent.ACTION_SCREEN_ON -> {
                Log.d(TAG, "Screen turned ON")
                onScreenStateChanged(true)
            }
            Intent.ACTION_SCREEN_OFF -> {
                Log.d(TAG, "Screen turned OFF")
                onScreenStateChanged(false)
            }
            Intent.ACTION_USER_PRESENT -> {
                Log.d(TAG, "User present (unlocked)")
                onScreenStateChanged(true)
            }
        }
    }
}