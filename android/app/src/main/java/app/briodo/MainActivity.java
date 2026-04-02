package app.briodo;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
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
        // Capacitor 6의 BridgeWebChromeClient가 onPermissionRequest를 이미 처리함
        // (request.grant(request.getResources())) — 별도 override 불필요
    }

    /**
     * 앱이 이미 실행 중일 때 서비스가 startActivity()로 이 Activity를 다시 열 경우 호출됨.
     * briodo_lock_screen=true 인텐트를 감지해 React에 잠금화면 표시를 지시한다.
     */
    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent); // getIntent()가 최신 인텐트를 반환하도록 갱신
        boolean forLockScreen = intent != null && intent.getBooleanExtra("briodo_lock_screen", false);
        android.util.Log.d("BrioDo.LockScreen", "onNewIntent: briodo_lock_screen=" + forLockScreen);
        if (forLockScreen) {
            try {
                LockScreenPlugin plugin = (LockScreenPlugin) getBridge().getPlugin("LockScreen").getInstance();
                android.util.Log.d("BrioDo.LockScreen", "plugin=" + (plugin != null ? "ok" : "null"));
                if (plugin != null) plugin.notifyLockScreenShow();
            } catch (Exception e) {
                android.util.Log.w("BrioDo.LockScreen", "onNewIntent plugin error: " + e.getMessage());
            }
        }
    }
}
