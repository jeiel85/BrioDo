package app.briodo;

import android.app.KeyguardManager;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.hardware.camera2.CameraAccessException;
import android.hardware.camera2.CameraManager;
import android.media.AudioManager;
import android.net.Uri;
import android.os.Build;
import android.provider.AlarmClock;
import android.provider.MediaStore;
import android.provider.Settings;
import android.view.KeyEvent;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "LockScreen")
public class LockScreenPlugin extends Plugin {

    /** 서비스에서 Capacitor 이벤트를 발사하기 위한 정적 참조 */
    static LockScreenPlugin instance;

    /**
     * fresh start(앱 최초 실행) 시 wasLaunchedForLockScreen()을 위한 1회성 플래그.
     * onResume()에서 notifyListeners()가 실패할 수 있으므로(WebView 미준비) 별도 보존.
     */
    private static volatile boolean pendingShow = false;

    private boolean torchOn = false;

    @Override
    public void load() {
        instance = this;
        // fresh start: onCreate 시점에 인텐트 extra 확인 (onResume 전이므로 extra 아직 존재)
        android.content.Intent intent = getActivity().getIntent();
        if (intent != null && intent.getBooleanExtra("briodo_lock_screen", false)) {
            pendingShow = true;
            android.util.Log.d("BrioDo.LockScreen", "load: pendingShow=true (fresh start)");
        }
    }

    // ── 잠금화면 서비스 제어 ─────────────────────────────────────

    /** 잠금화면 포어그라운드 서비스 시작 — 설정 활성화 시 JS에서 호출 */
    @PluginMethod
    public void startLockScreenService(PluginCall call) {
        Intent intent = new Intent(getContext(), LockScreenService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            getContext().startForegroundService(intent);
        } else {
            getContext().startService(intent);
        }
        call.resolve();
    }

    /** 잠금화면 서비스 중지 — 설정 비활성화 시 JS에서 호출 */
    @PluginMethod
    public void stopLockScreenService(PluginCall call) {
        Intent intent = new Intent(getContext(), LockScreenService.class);
        getContext().stopService(intent);
        // 남아있는 알림도 제거
        NotificationManager nm = (NotificationManager) getContext().getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null) nm.cancel(LockScreenService.NOTIF_ID);
        call.resolve();
    }

    // ── 잠금 상태 확인 ───────────────────────────────────────────

    @PluginMethod
    public void isLocked(PluginCall call) {
        KeyguardManager km = (KeyguardManager) getContext().getSystemService(Context.KEYGUARD_SERVICE);
        boolean locked = km != null && km.isKeyguardLocked();
        android.util.Log.d("BrioDo.LockScreen", "isKeyguardLocked=" + locked);
        JSObject ret = new JSObject();
        ret.put("locked", locked);
        call.resolve(ret);
    }

    @PluginMethod
    public void toggleTorch(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
            call.reject("Torch not supported below Android 6.0");
            return;
        }
        CameraManager cm = (CameraManager) getContext().getSystemService(Context.CAMERA_SERVICE);
        try {
            String cameraId = cm.getCameraIdList()[0];
            torchOn = !torchOn;
            cm.setTorchMode(cameraId, torchOn);
            JSObject ret = new JSObject();
            ret.put("on", torchOn);
            call.resolve(ret);
        } catch (CameraAccessException e) {
            call.reject("Torch error: " + e.getMessage());
        }
    }

    @PluginMethod
    public void openCamera(PluginCall call) {
        Intent intent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);
        call.resolve();
    }

    @PluginMethod
    public void openQrScanner(PluginCall call) {
        // 삼성 QR 스캐너 시도 → 없으면 카메라로 대체
        Intent intent = new Intent("android.intent.action.QR_CODE_SCANNER");
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        if (intent.resolveActivity(getContext().getPackageManager()) != null) {
            getContext().startActivity(intent);
        } else {
            Intent camIntent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
            camIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(camIntent);
        }
        call.resolve();
    }

    @PluginMethod
    public void openTimer(PluginCall call) {
        Intent intent = new Intent(AlarmClock.ACTION_SET_TIMER);
        intent.putExtra(AlarmClock.EXTRA_SKIP_UI, false);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            getContext().startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Timer not available: " + e.getMessage());
        }
    }

    @PluginMethod
    public void openCalculator(PluginCall call) {
        Intent intent = new Intent();
        intent.setAction(Intent.ACTION_MAIN);
        intent.addCategory(Intent.CATEGORY_APP_CALCULATOR);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            getContext().startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Calculator not available: " + e.getMessage());
        }
    }

    @PluginMethod
    public void toggleMediaPlayPause(PluginCall call) {
        AudioManager am = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
        KeyEvent down = new KeyEvent(KeyEvent.ACTION_DOWN, KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE);
        KeyEvent up = new KeyEvent(KeyEvent.ACTION_UP, KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE);
        am.dispatchMediaKeyEvent(down);
        am.dispatchMediaKeyEvent(up);
        call.resolve();
    }

    @PluginMethod
    public void openAlarm(PluginCall call) {
        Intent intent = new Intent(AlarmClock.ACTION_SHOW_ALARMS);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            getContext().startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Alarm app not available: " + e.getMessage());
        }
    }

    @PluginMethod
    public void openStopwatch(PluginCall call) {
        Intent intent = new Intent("android.intent.action.SET_STOPWATCH");
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            getContext().startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Stopwatch not available: " + e.getMessage());
        }
    }

    // ── React 잠금화면 뷰 트리거 ───────────────────────────────────

    /**
     * onResume()에서 briodo_lock_screen=true 인텐트 수신 시 호출.
     * pendingShow 플래그도 함께 세팅해 wasLaunchedForLockScreen() 폴백을 보장한다.
     */
    public void notifyLockScreenShow() {
        pendingShow = true;
        notifyListeners("lockScreenShow", new JSObject());
    }

    /**
     * 사용자가 키가드를 해제(PIN/생체인증 등)했을 때 서비스에서 호출.
     * React가 잠금화면 뷰를 닫도록 지시한다.
     */
    public void notifyKeyguardDismissed() {
        notifyListeners("keyguardDismissed", new JSObject());
    }

    /**
     * 앱 최초 실행(fresh start) 시 JS에서 호출 — 1회 소비 후 false 반환.
     * onResume()의 notifyListeners()가 WebView 미준비로 실패했을 경우의 폴백.
     * pendingShow는 load() 또는 notifyLockScreenShow()에서 세팅됨.
     */
    @PluginMethod
    public void wasLaunchedForLockScreen(PluginCall call) {
        boolean value = pendingShow;
        pendingShow = false; // 1회 소비
        android.util.Log.d("BrioDo.LockScreen", "wasLaunchedForLockScreen: " + value);
        JSObject ret = new JSObject();
        ret.put("value", value);
        call.resolve(ret);
    }

    // ── 잠금화면 자동 실행 권한 (Android 14+) ──────────────────────

    /**
     * USE_FULL_SCREEN_INTENT 권한 보유 여부 확인
     * Android 14 미만은 항상 true (별도 권한 불필요)
     */
    @PluginMethod
    public void canUseFullScreenIntent(PluginCall call) {
        JSObject ret = new JSObject();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            NotificationManager nm = (NotificationManager)
                getContext().getSystemService(Context.NOTIFICATION_SERVICE);
            ret.put("value", nm != null && nm.canUseFullScreenIntent());
        } else {
            ret.put("value", true);
        }
        call.resolve(ret);
    }

    /**
     * USE_FULL_SCREEN_INTENT 권한 설정 화면으로 이동
     * Android 14+에서 사용자가 권한을 허용할 수 있도록 안내
     */
    @PluginMethod
    public void openFullScreenIntentSettings(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            Intent intent = new Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT);
            intent.setData(Uri.parse("package:" + getContext().getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            try {
                getContext().startActivity(intent);
                call.resolve();
            } catch (Exception e) {
                call.reject("Cannot open settings: " + e.getMessage());
            }
        } else {
            call.resolve(); // Android 14 미만은 권한 불필요
        }
    }

    // ── SYSTEM_ALERT_WINDOW (다른 앱 위에 표시) 권한 ─────────────────

    /**
     * SYSTEM_ALERT_WINDOW 권한 보유 여부 확인
     * Android 6 미만은 항상 true
     */
    @PluginMethod
    public void canDrawOverlays(PluginCall call) {
        JSObject ret = new JSObject();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            ret.put("value", Settings.canDrawOverlays(getContext()));
        } else {
            ret.put("value", true);
        }
        call.resolve(ret);
    }

    /**
     * SYSTEM_ALERT_WINDOW 권한 설정 화면으로 이동
     * 신뢰할 수 있는 장소 등 잠금 해제 상태에서도 잠금화면 위젯 표시에 필요
     */
    @PluginMethod
    public void openDrawOverlaysSettings(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION);
            intent.setData(Uri.parse("package:" + getContext().getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            try {
                getContext().startActivity(intent);
                call.resolve();
            } catch (Exception e) {
                call.reject("Cannot open settings: " + e.getMessage());
            }
        } else {
            call.resolve();
        }
    }
}
