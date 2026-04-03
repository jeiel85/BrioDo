package app.briodo;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.hardware.camera2.CameraAccessException;
import android.hardware.camera2.CameraManager;
import android.os.Build;

/**
 * 상태바 상주 알림의 액션 버튼 처리.
 * - 🔦 손전등: 토글
 * - ➕ 일정 추가: 설정에 따라 앱 실행 (메인 or SmartInputModal)
 */
public class NotificationActionReceiver extends BroadcastReceiver {

    private static boolean torchOn = false;

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        if (action == null) return;

        switch (action) {
            case StatusBarNotificationService.ACTION_TOGGLE_FLASHLIGHT:
                toggleFlashlight(context);
                break;

            case StatusBarNotificationService.ACTION_ADD_SCHEDULE:
                openForAddSchedule(context);
                break;
        }
    }

    // ── 손전등 토글 ──────────────────────────────────────────────────────────
    private void toggleFlashlight(Context ctx) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return;
        CameraManager cm = (CameraManager) ctx.getSystemService(Context.CAMERA_SERVICE);
        if (cm == null) return;
        try {
            String camId = cm.getCameraIdList()[0];
            torchOn = !torchOn;
            cm.setTorchMode(camId, torchOn);
        } catch (CameraAccessException e) {
            torchOn = false;
        }
    }

    // ── 일정 추가 ────────────────────────────────────────────────────────────
    private void openForAddSchedule(Context ctx) {
        Intent launch = new Intent(ctx, MainActivity.class);
        launch.setFlags(
            Intent.FLAG_ACTIVITY_SINGLE_TOP |
            Intent.FLAG_ACTIVITY_CLEAR_TOP  |
            Intent.FLAG_ACTIVITY_NEW_TASK
        );
        // SmartInputModal 열기 여부 → MainActivity → WebView JS 이벤트로 전달
        launch.putExtra(StatusBarNotificationService.EXTRA_OPEN_INPUT, true);
        ctx.startActivity(launch);
    }
}
