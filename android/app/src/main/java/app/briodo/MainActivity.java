package app.briodo;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    /**
     * onResume에서 잠금화면 이벤트를 한 번만 발사하기 위한 플래그.
     * onNewIntent()로 새 인텐트가 오면 false로 초기화 → 다음 onResume에서 재발사.
     */
    private boolean lockScreenEventFired = false;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(LockScreenPlugin.class);
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
     * 앱이 이미 실행 중일 때 서비스가 startActivity()로 호출하면 onNewIntent → onResume 순서로 실행됨.
     * onNewIntent에서 플래그를 초기화해 onResume에서 이벤트를 발사하도록 준비한다.
     */
    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        boolean forLockScreen = intent != null && intent.getBooleanExtra("briodo_lock_screen", false);
        android.util.Log.d("BrioDo.LockScreen", "onNewIntent: briodo_lock_screen=" + forLockScreen);
        if (forLockScreen) {
            lockScreenEventFired = false; // 다음 onResume에서 발사하도록 초기화
        }
    }

    @Override
    public void onPause() {
        super.onPause();
        // 화면이 꺼지거나 다른 앱으로 전환될 때 플래그 초기화
        // → 다음 화면 켜짐(onResume) 시 서비스 인텐트가 있으면 재발사 가능
        lockScreenEventFired = false;
    }

    /**
     * onResume은 PAUSED→RESUMED 시 항상 호출됨.
     * Capacitor의 appStateChange(STOPPED→STARTED 기반)와 달리 화면 켜짐 시에도 확실히 호출됨.
     * super.onResume()이 WebView를 재개한 뒤에 notifyListeners를 호출해야 이벤트가 전달됨.
     */
    @Override
    public void onResume() {
        super.onResume(); // BridgeActivity.onResume() → WebView 재개됨
        if (!lockScreenEventFired) {
            Intent intent = getIntent();
            if (intent != null && intent.getBooleanExtra("briodo_lock_screen", false)) {
                lockScreenEventFired = true;
                android.util.Log.d("BrioDo.LockScreen", "onResume: firing lockScreenShow");
                try {
                    LockScreenPlugin plugin = (LockScreenPlugin) getBridge().getPlugin("LockScreen").getInstance();
                    android.util.Log.d("BrioDo.LockScreen", "plugin=" + (plugin != null ? "ok" : "null"));
                    if (plugin != null) plugin.notifyLockScreenShow();
                } catch (Exception e) {
                    android.util.Log.w("BrioDo.LockScreen", "onResume plugin error: " + e.getMessage());
                }
            }
        }
    }
}
