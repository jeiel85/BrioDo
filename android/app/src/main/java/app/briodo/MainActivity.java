package app.briodo;

import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(LockScreenPlugin.class);
        registerPlugin(StatusBarNotificationPlugin.class);
        super.onCreate(savedInstanceState);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        } else {
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED
                    | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
                    | WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
                    | WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD);
        }
    }

    /**
     * 앱 실행 중 서비스가 startActivity()를 호출하면 실행됨.
     * setIntent()로 최신 인텐트를 저장하면 onResume()에서 읽을 수 있다.
     */
    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        android.util.Log.d("BrioDo.LockScreen", "onNewIntent: briodo_lock_screen="
            + (intent != null && intent.getBooleanExtra("briodo_lock_screen", false)));
    }

    /**
     * PAUSED→RESUMED 시 항상 호출 — Capacitor appStateChange보다 신뢰성 높음.
     * super.onResume()이 WebView를 재개한 뒤 이벤트를 발사해야 전달됨.
     * intent extra를 처리 즉시 삭제해 다음 resume에서 재발사되지 않도록 한다 (1회성).
     */
    @Override
    public void onResume() {
        super.onResume(); // BridgeActivity가 WebView를 재개함
        Intent intent = getIntent();
        if (intent != null && intent.getBooleanExtra("briodo_lock_screen", false)) {
            intent.removeExtra("briodo_lock_screen"); // 1회성: 다음 resume 재발사 방지
            android.util.Log.d("BrioDo.LockScreen", "onResume: firing lockScreenShow");
            try {
                LockScreenPlugin plugin = (LockScreenPlugin)
                    getBridge().getPlugin("LockScreen").getInstance();
                android.util.Log.d("BrioDo.LockScreen",
                    "plugin=" + (plugin != null ? "ok" : "null"));
                if (plugin != null) plugin.notifyLockScreenShow();
            } catch (Exception e) {
                android.util.Log.w("BrioDo.LockScreen", "onResume error: " + e.getMessage());
            }
            // setFullScreenIntent 알림 취소 (Activity가 이미 표시됐으므로 알림 불필요)
            try {
                NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
                if (nm != null) nm.cancel(LockScreenService.NOTIF_ID_LAUNCH);
            } catch (Exception ignored) {}
        }

        // 상태바 알림 ➕ 버튼 → SmartInputModal 열기 이벤트
        if (intent != null && intent.getBooleanExtra(StatusBarNotificationService.EXTRA_OPEN_INPUT, false)) {
            intent.removeExtra(StatusBarNotificationService.EXTRA_OPEN_INPUT);
            android.util.Log.d("BrioDo.StatusBar", "onResume: firing openSmartInput");
            try {
                StatusBarNotificationPlugin plugin = (StatusBarNotificationPlugin)
                    getBridge().getPlugin("StatusBarNotification").getInstance();
                if (plugin != null) {
                    plugin.notifyListeners("openSmartInput", new com.getcapacitor.JSObject());
                }
            } catch (Exception e) {
                android.util.Log.w("BrioDo.StatusBar", "onResume error: " + e.getMessage());
            }
        }
    }
}
