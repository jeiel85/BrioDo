package app.briodo;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;

/**
 * 기기 재시작 후 상태바 알림 서비스 자동 복원.
 *
 * RECEIVE_BOOT_COMPLETED 권한은 AndroidManifest에 이미 선언되어 있음.
 * enabled=true 로 저장된 경우에만 서비스를 재시작한다 (사용자가 명시적으로
 * 비활성화한 경우에는 부팅 후 자동 시작하지 않음).
 */
public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        // 일반 부팅 + 빠른 부팅(일부 제조사) 모두 처리
        if (!Intent.ACTION_BOOT_COMPLETED.equals(action) &&
            !"android.intent.action.QUICKBOOT_POWERON".equals(action)) {
            return;
        }

        SharedPreferences prefs = context.getSharedPreferences(
            StatusBarNotificationService.PREFS_NAME, Context.MODE_PRIVATE);
        boolean enabled = prefs.getBoolean(StatusBarNotificationService.PREF_ENABLED, false);

        if (!enabled) return;

        Intent svc = new Intent(context, StatusBarNotificationService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(svc);
        } else {
            context.startService(svc);
        }
    }
}
