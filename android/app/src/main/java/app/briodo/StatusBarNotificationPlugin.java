package app.briodo;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;

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

    /** MainActivity에서 호출 — JS로 openSmartInput 이벤트 발사 */
    public void notifyOpenSmartInput() {
        notifyListeners("openSmartInput", new JSObject());
    }

    private StatusBarNotificationService getRunningService() {
        return StatusBarNotificationService.instance;
    }
}
