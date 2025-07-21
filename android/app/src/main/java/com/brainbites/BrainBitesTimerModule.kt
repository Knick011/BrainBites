package com.brainbites

import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import android.os.Handler
import android.os.Looper
import java.util.Timer
import java.util.TimerTask

class BrainBitesTimerModule(reactContext: ReactApplicationContext) : 
    ReactContextBaseJavaModule(reactContext) {
    
    private var timer: Timer? = null
    private var remainingTime: Int = 0
    private var isTracking = false
    private var debtTime: Int = 0
    
    override fun getName(): String {
        return "BrainBitesTimer"
    }
    
    @ReactMethod
    fun startListening() {
        // Start timer updates
        startTimer()
    }
    
    @ReactMethod
    fun startTracking() {
        isTracking = true
        startTimer()
    }
    
    @ReactMethod
    fun stopTracking() {
        isTracking = false
        timer?.cancel()
        timer = null
    }
    
    @ReactMethod
    fun getRemainingTime(promise: Promise) {
        val map = Arguments.createMap()
        map.putInt("remainingTime", remainingTime)
        map.putInt("debtTime", debtTime)
        promise.resolve(map)
    }
    
    @ReactMethod
    fun addTime(seconds: Int) {
        remainingTime += seconds
        if (remainingTime > 0 && debtTime > 0) {
            val payoff = minOf(remainingTime, debtTime)
            debtTime -= payoff
            remainingTime -= payoff
        }
        sendUpdate()
    }
    
    @ReactMethod
    fun notifyAppState(state: String) {
        // Handle app state changes
    }
    
    private fun startTimer() {
        timer?.cancel()
        timer = Timer()
        timer?.scheduleAtFixedRate(object : TimerTask() {
            override fun run() {
                if (isTracking && remainingTime > 0) {
                    remainingTime--
                } else if (isTracking && remainingTime <= 0) {
                    debtTime++
                }
                sendUpdate()
            }
        }, 0, 1000)
    }
    
    private fun sendUpdate() {
        val params = Arguments.createMap()
        params.putInt("remainingTime", remainingTime)
        params.putBoolean("isTracking", isTracking)
        params.putInt("debtTime", debtTime)
        params.putBoolean("isAppForeground", true)
        
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("timerUpdate", params)
    }
}