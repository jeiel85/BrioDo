package app.briodo

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * Receives widget action broadcasts and processes pending task toggles
 */
class WidgetActionReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        when (intent.action) {
            BrioDoWidgetProvider.ACTION_TASK_TOGGLED -> {
                // Process pending task toggles from widget
                // This will be handled by MainActivity or a Foreground Service
                val prefs = context.getSharedPreferences(BrioDoWidgetProvider.PREFS_NAME, Context.MODE_PRIVATE)
                val pendingToggles = prefs.getStringSet(BrioDoWidgetProvider.PENDING_TOGGLES, null)

                if (!pendingToggles.isNullOrEmpty()) {
                    // Send pending toggles to main app for processing
                    pendingToggles.forEach { taskId ->
                        // TODO: Implement task toggle processing
                        // This could be done via:
                        // 1. SharedPreferences read by main app
                        // 2. ContentProvider
                        // 3. Bound service communication
                        android.util.Log.d("BrioDoWidget", "Pending toggle for task: $taskId")
                    }

                    // Clear processed toggles
                    prefs.edit()
                        .remove(BrioDoWidgetProvider.PENDING_TOGGLES)
                        .apply()

                    // Update widgets
                    updateWidgets(context)
                }
            }
        }
    }

    private fun updateWidgets(context: Context) {
        val intent = Intent(context, BrioDoWidgetProvider::class.java).apply {
            action = BrioDoWidgetProvider.ACTION_REFRESH
        }
        context.sendBroadcast(intent)
    }
}
