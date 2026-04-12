package app.briodo;

import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Capacitor 플러그인 — 상태바 상주 알림 서비스 제어.
 *
 * JS에서 사용:
 *   import { Plugins } from '@capacitor/core';
 *   const { StatusBarNotification } = Plugins;
 *
 *   StatusBarNotification.start({ tapAction: 'app' | 'input' })
 *   StatusBarNotification.stop()
 *   StatusBarNotification.setTapAction({ tapAction: 'app' | 'input' })
 */
@CapacitorPlugin(name = "StatusBarNotification")
public class StatusBarNotificationPlugin extends Plugin {

    static StatusBarNotificationPlugin instance;

    @Override
    public void load() {
        instance = this;
    }

    // ── 서비스 시작 ───────────────────────────────────────────────────────────
    @PluginMethod
    public void start(PluginCall call) {
        String tapAction = call.getString("tapAction", StatusBarNotificationService.TAP_ACTION_APP);
        saveTapAction(tapAction);
        // BootReceiver가 재시작 여부를 판단할 수 있도록 enabled 상태를 저장
        getContext().getSharedPreferences(
            StatusBarNotificationService.PREFS_NAME, android.content.Context.MODE_PRIVATE
        ).edit().putBoolean(StatusBarNotificationService.PREF_ENABLED, true).apply();

        Intent svc = new Intent(getContext(), StatusBarNotificationService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            getContext().startForegroundService(svc);
        } else {
            getContext().startService(svc);
        }
        call.resolve();
    }

    // ── 서비스 중지 ───────────────────────────────────────────────────────────
    @PluginMethod
    public void stop(PluginCall call) {
        // 사용자가 명시적으로 비활성화 → 부팅 후 자동 시작 안 함
        getContext().getSharedPreferences(
            StatusBarNotificationService.PREFS_NAME, android.content.Context.MODE_PRIVATE
        ).edit().putBoolean(StatusBarNotificationService.PREF_ENABLED, false).apply();
        getContext().stopService(new Intent(getContext(), StatusBarNotificationService.class));
        call.resolve();
    }

    // ── 탭 동작 변경 (서비스 실행 중에도 즉시 적용) ───────────────────────────
    @PluginMethod
    public void setTapAction(PluginCall call) {
        String tapAction = call.getString("tapAction", StatusBarNotificationService.TAP_ACTION_APP);
        saveTapAction(tapAction);

        // 실행 중인 서비스에 즉시 반영
        StatusBarNotificationService svc = getRunningService();
        if (svc != null) svc.refresh();

        call.resolve();
    }

    // ── 현재 설정 읽기 ────────────────────────────────────────────────────────
    @PluginMethod
    public void getSettings(PluginCall call) {
        SharedPreferences prefs = getContext().getSharedPreferences(
            StatusBarNotificationService.PREFS_NAME, android.content.Context.MODE_PRIVATE
        );
        JSObject ret = new JSObject();
        ret.put("tapAction", prefs.getString(
            StatusBarNotificationService.PREF_TAP_ACTION,
            StatusBarNotificationService.TAP_ACTION_APP
        ));
        call.resolve(ret);
    }

    // ── 헬퍼 ─────────────────────────────────────────────────────────────────
    private void saveTapAction(String tapAction) {
        getContext().getSharedPreferences(
            StatusBarNotificationService.PREFS_NAME, android.content.Context.MODE_PRIVATE
        ).edit()
         .putString(StatusBarNotificationService.PREF_TAP_ACTION, tapAction)
         .apply();
    }

    // ── 알림 본문 텍스트 갱신 (JS → 서비스) ──────────────────────────────────
    @PluginMethod
    public void updateContent(PluginCall call) {
        String text = call.getString("text", null);
        StatusBarNotificationService.notifContentText = text;
        // SharedPreferences에도 저장 → 프로세스 재시작(배터리 최적화 종료 후 START_STICKY 복원,
        // BootReceiver 기동) 시 마지막 텍스트를 복원할 수 있도록
        if (text != null) {
            getContext().getSharedPreferences(
                StatusBarNotificationService.PREFS_NAME, android.content.Context.MODE_PRIVATE
            ).edit().putString(StatusBarNotificationService.PREF_CONTENT_TEXT, text).apply();
        }
        StatusBarNotificationService svc = getRunningService();
        if (svc != null) svc.refresh();
        call.resolve();
    }

    // ── 배터리 최적화 예외 요청 ────────────────────────────────────────────────
    /** 현재 이미 예외 처리된 경우 다이얼로그를 띄우지 않음 */
    @PluginMethod
    public void requestIgnoreBatteryOptimizations(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
            call.resolve(); // Android 6 미만은 불필요
            return;
        }
        PowerManager pm = (PowerManager) getContext().getSystemService(android.content.Context.POWER_SERVICE);
        if (pm != null && !pm.isIgnoringBatteryOptimizations(getContext().getPackageName())) {
            try {
                Intent intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                intent.setData(Uri.parse("package:" + getContext().getPackageName()));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(intent);
            } catch (Exception e) {
                // 일부 기기에서 인텐트 미지원 시 무시
            }
        }
        call.resolve();
    }

    /** 현재 배터리 최적화 예외 여부 반환 */
    @PluginMethod
    public void isIgnoringBatteryOptimizations(PluginCall call) {
        boolean ignoring = false;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PowerManager pm = (PowerManager) getContext().getSystemService(android.content.Context.POWER_SERVICE);
            if (pm != null) ignoring = pm.isIgnoringBatteryOptimizations(getContext().getPackageName());
        } else {
            ignoring = true; // Android 6 미만은 최적화 개념 없음 → 항상 true
        }
        JSObject ret = new JSObject();
        ret.put("value", ignoring);
        call.resolve(ret);
    }

    /** MainActivity에서 호출 — JS로 openSmartInput 이벤트 발사 */
    public void notifyOpenSmartInput() {
        notifyListeners("openSmartInput", new JSObject());
    }

    private StatusBarNotificationService getRunningService() {
        return StatusBarNotificationService.instance;
    }
}
