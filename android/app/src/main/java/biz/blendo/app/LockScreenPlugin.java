package biz.blendo.app;

import android.app.KeyguardManager;
import android.content.Context;
import android.content.Intent;
import android.hardware.camera2.CameraAccessException;
import android.hardware.camera2.CameraManager;
import android.media.AudioManager;
import android.os.Build;
import android.provider.AlarmClock;
import android.provider.MediaStore;
import android.view.KeyEvent;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "LockScreen")
public class LockScreenPlugin extends Plugin {

    private boolean torchOn = false;

    @PluginMethod
    public void isLocked(PluginCall call) {
        KeyguardManager km = (KeyguardManager) getContext().getSystemService(Context.KEYGUARD_SERVICE);
        boolean locked = km != null && km.isKeyguardLocked();
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
}
