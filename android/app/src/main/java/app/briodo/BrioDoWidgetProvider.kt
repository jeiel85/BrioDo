package app.briodo

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews

/**
 * BrioDo Home Screen Widget Provider
 * Displays today's tasks on the Android home screen
 */
class BrioDoWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        // Update each widget instance
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onEnabled(context: Context) {
        // Called when the first widget is placed
    }

    override fun onDisabled(context: Context) {
        // Called when the last widget is removed
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)

        when (intent.action) {
            ACTION_REFRESH -> {
                // Refresh widget data
                val appWidgetManager = AppWidgetManager.getInstance(context)
                val appWidgetIds = intent.getIntArrayExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS)
                appWidgetIds?.forEach { appWidgetId ->
                    updateAppWidget(context, appWidgetManager, appWidgetId)
                }
            }
            ACTION_TOGGLE_TASK -> {
                // Toggle task completion from widget
                val taskId = intent.getStringExtra(EXTRA_TASK_ID)
                taskId?.let {
                    // Toggle via SharedPreferences or direct database access
                    toggleTaskCompletion(context, it)
                }
            }
        }
    }

    private fun toggleTaskCompletion(context: Context, taskId: String) {
        // Use SharedPreferences or ContentProvider to communicate with main app
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val editor = prefs.edit()
        val pendingToggles = prefs.getStringSet(PENDING_TOGGLES, mutableSetOf()) ?: mutableSetOf()
        pendingToggles.add(taskId)
        editor.putStringSet(PENDING_TOGGLES, pendingToggles)
        editor.apply()

        // Notify main app to process pending toggles
        val broadcastIntent = Intent(ACTION_TASK_TOGGLED)
        broadcastIntent.setPackage(context.packageName)
        context.sendBroadcast(broadcastIntent)
    }

    companion object {
        const val ACTION_REFRESH = "app.briodo.widget.ACTION_REFRESH"
        const val ACTION_TOGGLE_TASK = "app.briodo.widget.ACTION_TOGGLE_TASK"
        const val ACTION_TASK_TOGGLED = "app.briodo.ACTION_TASK_TOGGLED"
        const val EXTRA_TASK_ID = "task_id"
        const val PREFS_NAME = "briodo_widget_prefs"
        const val PENDING_TOGGLES = "pending_toggles"

        fun updateAppWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            // Load widget configuration
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val widgetTitle = prefs.getString("widget_title_$appWidgetId", "BrioDo")
            val showCompleted = prefs.getBoolean("show_completed_$appWidgetId", false)

            // Create RemoteViews for the widget
            val views = RemoteViews(context.packageName, R.layout.widget_briodo)

            // Set widget title
            views.setTextViewText(R.id.widget_title, widgetTitle)

            // Set up click listeners
            views.setOnClickPendingIntent(
                R.id.widget_refresh,
                createRefreshPendingIntent(context, appWidgetId)
            )
            views.setOnClickPendingIntent(
                R.id.widget_add,
                createAddTaskPendingIntent(context)
            )

            // Set up task list (RemoteViews doesn't support ListView directly,
            // so we use a simple text view or Intent for widget configuration)
            val taskText = loadTasksFromSharedPreferences(context, showCompleted)
            views.setTextViewText(R.id.widget_task_list, taskText)

            // Instruct the widget manager to update the widget
            appWidgetManager.updateAppWidget(appWidgetId, views)
        }

        private fun loadTasksFromSharedPreferences(context: Context, showCompleted: Boolean): String {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val tasksJson = prefs.getString(KEY_TASKS_DATA, "[]") ?: "[]"

            // Parse JSON and format for display
            // In production, use a proper JSON parser
            return try {
                parseTasksJson(tasksJson, showCompleted)
            } catch (e: Exception) {
                context.getString(R.string.widget_no_tasks)
            }
        }

        private fun parseTasksJson(json: String, showCompleted: Boolean): String {
            // Simple parsing - in production use Gson or Kotlinx Serialization
            // Return formatted task list
            return json
        }

        private fun createRefreshPendingIntent(context: Context, appWidgetId: Int): android.app.PendingIntent {
            val intent = Intent(context, BrioDoWidgetProvider::class.java).apply {
                action = ACTION_REFRESH
            }
            return android.app.PendingIntent.getBroadcast(
                context,
                appWidgetId,
                intent,
                android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE
            )
        }

        private fun createAddTaskPendingIntent(context: Context): android.app.PendingIntent {
            val intent = Intent(context, MainActivity::class.java).apply {
                action = "app.briodo.OPEN_SMART_INPUT"
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            return android.app.PendingIntent.getActivity(
                context,
                0,
                intent,
                android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE
            )
        }
    }
}
