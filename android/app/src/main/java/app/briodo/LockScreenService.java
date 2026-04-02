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
import android.util.Log;

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

    private static final String TAG = "BrioDo.LockScreen";

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
                } else if (Intent.ACTION_USER_PRESENT.equals(action)) {
                    // 완전 잠금해제 시 폴백 알림 정리
                    NotificationManager nm = (NotificationManager)
                        ctx.getSystemService(Context.NOTIFICATION_SERVICE);
                    if (nm != null) nm.cancel(NOTIF_ID_LAUNCH);
                }
            }
        };

        IntentFilter filter = new IntentFilter();
        filter.addAction(Intent.ACTION_SCREEN_ON);
        filter.addAction(Intent.ACTION_SCREEN_OFF);
        filter.addAction(Intent.ACTION_USER_PRESENT);

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
     * 화면 켜짐 → 잠금화면 Activity 실행
     *
     * Android 14+ (API 34+):
     *   USE_FULL_SCREEN_INTENT 권한이 있으면 Foreground Service에서 startActivity() 직접 호출 가능.
     *   (백그라운드 Activity 시작 제한 면제 조건 — Android 공식 문서)
     *   → 권한 있을 때: startActivity() 직접 호출 (알림 불필요, 즉시 실행)
     *   → 권한 없을 때: 탭 가능한 폴백 알림 post
     *
     * Android 13 이하:
     *   Foreground Service에서 startActivity() 직접 호출 가능.
     */
    private void launchLockScreen(Context ctx) {
        Intent activityIntent = new Intent(ctx, MainActivity.class);
        activityIntent.putExtra("briodo_lock_screen", true);
        activityIntent.setFlags(
            Intent.FLAG_ACTIVITY_NEW_TASK |
            Intent.FLAG_ACTIVITY_SINGLE_TOP |
            Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
        );

        NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);

        // Android 14+: USE_FULL_SCREEN_INTENT 권한 있으면 startActivity() 직접 호출
        // 권한 없으면 → 폴백 알림
        boolean canStartDirect;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            boolean hasPermission = nm != null && nm.canUseFullScreenIntent();
            Log.d(TAG, "canUseFullScreenIntent=" + hasPermission);
            canStartDirect = hasPermission;
        } else {
            Log.d(TAG, "Android < 14: startActivity direct");
            canStartDirect = true;
        }

        if (canStartDirect) {
            try {
                ctx.startActivity(activityIntent);
                Log.d(TAG, "startActivity succeeded");
                return; // 성공 → 알림 불필요
            } catch (Exception e) {
                Log.w(TAG, "startActivity failed: " + e.getMessage());
            }
        }

        // 폴백: 권한 없을 때 탭 가능한 알림 (무음)
        if (nm == null) return;
        PendingIntent tapPI = PendingIntent.getActivity(
            ctx, 1, activityIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        nm.notify(NOTIF_ID_LAUNCH, new NotificationCompat.Builder(ctx, CHANNEL_ID_LAUNCH)
            .setSmallIcon(R.drawable.ic_launcher_foreground)
            .setContentTitle("BrioDo")
            .setContentText("탭하여 잠금화면 열기")
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setContentIntent(tapPI)
            .setAutoCancel(true)
            .setSilent(true)
            .build());
    }

    /** 상주 알림 (IMPORTANCE_LOW) — 무음, 잠금화면에서도 보임, 탭 시 잠금화면 진입 */
    private Notification buildPersistentNotification() {
        Intent openIntent = new Intent(this, MainActivity.class);
        openIntent.putExtra("briodo_lock_screen", true);
        openIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pendingOpen = PendingIntent.getActivity(
            this, 0, openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        return new NotificationCompat.Builder(this, CHANNEL_ID_SILENT)
            .setSmallIcon(R.drawable.ic_launcher_foreground)
            .setContentTitle("BrioDo 잠금화면")
            .setContentText("화면 켜짐 시 자동 실행됩니다")
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)  // 잠금화면에서 보임
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
