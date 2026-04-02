package app.briodo;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Build;
import android.os.IBinder;

import androidx.core.app.NotificationCompat;

/**
 * LockScreenService
 *
 * 잠금화면 기능 활성화 시 상시 실행되는 Foreground Service.
 *
 * 알림 구조:
 *  - CHANNEL_ID_SILENT (IMPORTANCE_LOW):  상주 알림 — 서비스 유지 확인용, 무음
 *  - CHANNEL_ID_LAUNCH (IMPORTANCE_HIGH): 화면 켜짐 시 setFullScreenIntent 발송
 *    → Android가 자동으로 Activity를 실행 (알람 앱 방식)
 *    → showWhenLocked + turnScreenOn 덕분에 시스템 잠금화면 위에 BrioDo 즉시 렌더
 */
public class LockScreenService extends Service {

    static final String CHANNEL_ID_SILENT = "briodo_lockscreen_silent";
    static final String CHANNEL_ID_LAUNCH  = "briodo_lockscreen_launch";
    static final int    NOTIF_ID           = 9001;   // 상주 알림
    static final int    NOTIF_ID_LAUNCH    = 9002;   // 화면 켜짐 시 발송 후 자동소멸

    private BroadcastReceiver screenReceiver;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannels();

        // 상주 알림 (IMPORTANCE_LOW) — 사용자가 서비스 동작 확인 가능, 무음
        startForeground(NOTIF_ID, buildPersistentNotification());

        screenReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context ctx, Intent intent) {
                String action = intent.getAction();
                if (Intent.ACTION_SCREEN_ON.equals(action)) {
                    launchLockScreen(ctx);
                } else if (Intent.ACTION_SCREEN_OFF.equals(action)) {
                    // 화면 꺼짐 시 실행 알림 취소 (중복 방지)
                    NotificationManager nm = (NotificationManager)
                        ctx.getSystemService(Context.NOTIFICATION_SERVICE);
                    if (nm != null) nm.cancel(NOTIF_ID_LAUNCH);
                }
            }
        };

        IntentFilter filter = new IntentFilter();
        filter.addAction(Intent.ACTION_SCREEN_ON);
        filter.addAction(Intent.ACTION_SCREEN_OFF);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(screenReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            registerReceiver(screenReceiver, filter);
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        // 시스템에 의해 강제 종료 시 자동 재시작
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (screenReceiver != null) {
            try { unregisterReceiver(screenReceiver); } catch (Exception ignored) {}
        }
    }

    @Override
    public IBinder onBind(Intent intent) { return null; }

    /**
     * 화면 켜짐 → setFullScreenIntent 알림 발송
     *
     * IMPORTANCE_HIGH + setFullScreenIntent(true) 조합:
     *   Android 시스템이 PendingIntent를 자동 실행 (사용자 탭 불필요)
     *   → MainActivity의 showWhenLocked=true + turnScreenOn=true 가 시스템 잠금화면 위에 그림
     *
     * Android 14+: USE_FULL_SCREEN_INTENT 권한이 없으면 직접 startActivity 시도 (폴백)
     */
    private void launchLockScreen(Context ctx) {
        Intent activityIntent = new Intent(ctx, MainActivity.class);
        activityIntent.putExtra("briodo_lock_screen", true);
        activityIntent.setFlags(
            Intent.FLAG_ACTIVITY_NEW_TASK |
            Intent.FLAG_ACTIVITY_SINGLE_TOP |
            Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
        );

        PendingIntent fullScreenPI = PendingIntent.getActivity(
            ctx, 1, activityIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;

        // Android 14+: 권한 없으면 직접 startActivity 폴백
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            if (!nm.canUseFullScreenIntent()) {
                try { ctx.startActivity(activityIntent); } catch (Exception ignored) {}
                return;
            }
        }

        Notification notification = new NotificationCompat.Builder(ctx, CHANNEL_ID_LAUNCH)
            .setSmallIcon(R.drawable.ic_launcher_foreground)
            .setContentTitle("BrioDo")
            .setContentText("잠금화면 열기")
            .setFullScreenIntent(fullScreenPI, true)   // true = 즉시 실행 (heads-up 없이)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setContentIntent(fullScreenPI)
            .setAutoCancel(true)
            .setSilent(true)
            .build();

        nm.notify(NOTIF_ID_LAUNCH, notification);
    }

    /** 상주 알림 (IMPORTANCE_LOW) — 무음, 쉐이드에서 확인 가능 */
    private Notification buildPersistentNotification() {
        Intent openIntent = new Intent(this, MainActivity.class);
        openIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pendingOpen = PendingIntent.getActivity(
            this, 0, openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        return new NotificationCompat.Builder(this, CHANNEL_ID_SILENT)
            .setSmallIcon(R.drawable.ic_launcher_foreground)
            .setContentTitle("BrioDo")
            .setContentText("잠금화면 활성화됨")
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setVisibility(NotificationCompat.VISIBILITY_SECRET)  // 잠금화면에서 내용 숨김
            .setContentIntent(pendingOpen)
            .setAutoCancel(false)
            .setSilent(true)
            .build();
    }

    private void createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm == null) return;

            // 상주 채널: IMPORTANCE_LOW (소리·진동 없음, 쉐이드에 표시)
            NotificationChannel silentChannel = new NotificationChannel(
                CHANNEL_ID_SILENT,
                "BrioDo 잠금화면 (상주)",
                NotificationManager.IMPORTANCE_LOW
            );
            silentChannel.setDescription("BrioDo 잠금화면 서비스 (백그라운드 유지용)");
            silentChannel.setShowBadge(false);
            silentChannel.enableVibration(false);
            silentChannel.setSound(null, null);
            nm.createNotificationChannel(silentChannel);

            // 실행 채널: IMPORTANCE_HIGH (setFullScreenIntent 동작에 필수)
            NotificationChannel launchChannel = new NotificationChannel(
                CHANNEL_ID_LAUNCH,
                "BrioDo 잠금화면 (실행)",
                NotificationManager.IMPORTANCE_HIGH
            );
            launchChannel.setDescription("BrioDo 잠금화면 자동 실행용");
            launchChannel.setShowBadge(false);
            launchChannel.enableVibration(false);
            launchChannel.setSound(null, null);
            nm.createNotificationChannel(launchChannel);
        }
    }
}
