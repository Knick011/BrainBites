// android/app/src/main/java/com/brainbites/timer/TimerNotificationManager.kt
package com.brainbites.timer

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.os.Build
import androidx.core.app.NotificationCompat
import com.brainbites.MainActivity
import com.brainbites.R

class TimerNotificationManager(private val context: Context) {
    
    companion object {
        private const val CHANNEL_ID = "brainbites_timer_channel"
        private const val CHANNEL_NAME = "BrainBites Timer"
        private const val NOTIFICATION_ID = 1001
    }
    
    private val notificationManager: NotificationManager by lazy {
        context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    }
    
    init {
        createNotificationChannel()
    }
    
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Shows your remaining screen time and earned credits"
                setShowBadge(false)
                enableVibration(false)
                setSound(null, null)
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            }
            notificationManager.createNotificationChannel(channel)
        }
    }
    
    fun createNotification(
        remainingTimeSeconds: Int,
        debtTimeSeconds: Int,
        isTracking: Boolean
    ): Notification {
        
        val (title, text, icon) = getNotificationContent(remainingTimeSeconds, debtTimeSeconds, isTracking)
        
        // Create intent to open the app
        val openAppIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        
        val pendingIntent = PendingIntent.getActivity(
            context,
            0,
            openAppIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        return NotificationCompat.Builder(context, CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(text)
            .setSmallIcon(icon)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setAutoCancel(false)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_STATUS)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setColor(getNotificationColor(remainingTimeSeconds, debtTimeSeconds))
            .build()
    }
    
    fun updateNotification(
        remainingTimeSeconds: Int,
        debtTimeSeconds: Int,
        isTracking: Boolean
    ) {
        val notification = createNotification(remainingTimeSeconds, debtTimeSeconds, isTracking)
        notificationManager.notify(NOTIFICATION_ID, notification)
    }
    
    fun hideNotification() {
        notificationManager.cancel(NOTIFICATION_ID)
    }
    
    private fun getNotificationContent(
        remainingTimeSeconds: Int,
        debtTimeSeconds: Int,
        isTracking: Boolean
    ): Triple<String, String, Int> {
        
        return when {
            debtTimeSeconds > 0 -> {
                val debtTime = formatTime(debtTimeSeconds)
                Triple(
                    "Time Debt: $debtTime",
                    if (isTracking) "Debt increasing..." else "Paused - Answer questions to reduce debt",
                    android.R.drawable.ic_dialog_alert
                )
            }
            remainingTimeSeconds > 0 -> {
                val remainingTime = formatTime(remainingTimeSeconds)
                Triple(
                    "Screen Time: $remainingTime",
                    if (isTracking) "Time counting down..." else "Paused - Complete tasks to earn more time",
                    android.R.drawable.ic_dialog_info
                )
            }
            else -> {
                Triple(
                    "No Screen Time",
                    "Answer questions to earn time!",
                    android.R.drawable.ic_dialog_alert
                )
            }
        }
    }
    
    private fun getNotificationColor(remainingTimeSeconds: Int, debtTimeSeconds: Int): Int {
        return when {
            debtTimeSeconds > 0 -> Color.RED
            remainingTimeSeconds > 3600 -> Color.GREEN // More than 1 hour
            remainingTimeSeconds > 1800 -> Color.YELLOW // More than 30 minutes
            remainingTimeSeconds > 0 -> Color.rgb(255, 165, 0) // Orange for low time
            else -> Color.RED
        }
    }
    
    private fun formatTime(seconds: Int): String {
        val hours = seconds / 3600
        val minutes = (seconds % 3600) / 60
        val secs = seconds % 60
        
        return when {
            hours > 0 -> String.format("%d:%02d:%02d", hours, minutes, secs)
            else -> String.format("%d:%02d", minutes, secs)
        }
    }
}