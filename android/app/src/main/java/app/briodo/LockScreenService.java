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
 * - 알림: 상시 무음 알림 (IMPORTANCE_MIN) — 서비스 생존용, 방해 없음
 * - ACTION_SCREEN_ON 수신 시 MainActivity를 직접 실행
 *   → showWhenLocked=true + turnScreenOn=true 덕분에
 *     시스템 잠금화면 위에 BrioDo 잠금화면 뷰가 즉시 렌더됨
 * - ACTION_SCREEN_OFF 수신 시 별도 처리 없음 (앱은 백그라운드로)
 */
public class LockScreenService extends Service {

    static final String CHANNEL_ID_SILENT = "briodo_lockscreen_silent";
    static final String CHANNEL_NAME      = "BrioDo 잠금화면";
    static final int    NOTIF_ID          = 9001;

    private BroadcastReceiver screenReceiver;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();

        // 상시 무음 알림으로 포어그라운드 서비스 유지
        startForeground(NOTIF_ID, buildSilentNotification());

        screenReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context ctx, Intent intent) {
                if (Intent.ACTION_SCREEN_ON.equals(intent.getAction())) {
                    launchLockScreen(ctx);
                }
            }
        };

        IntentFilter filter = new IntentFilter(Intent.ACTION_SCREEN_ON);
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
     * 화면 켜짐 → MainActivity 직접 실행
     * showWhenLocked=true + turnScreenOn=true (AndroidManifest/MainActivity)로
     * 시스템 잠금화면 위에 BrioDo가 즉시 표시됨.
     * JS appStateChange → checkLockScreen() → setIsLockScreen(true) → 잠금화면 뷰 렌더.
     */
    private void launchLockScreen(Context ctx) {
        Intent intent = new Intent(ctx, MainActivity.class);
        intent.putExtra("briodo_lock_screen", true);
        intent.setFlags(
            Intent.FLAG_ACTIVITY_NEW_TASK |
            Intent.FLAG_ACTIVITY_SINGLE_TOP |
            Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
        );
        ctx.startActivity(intent);
    }

    /** 상시 무음 알림 — 서비스 생존용, 사용자에게 방해 없음 */
    private Notification buildSilentNotification() {
        // 앱 열기 인텐트 (알림 탭 시)
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
            .setPriority(NotificationCompat.PRIORITY_MIN)   // 최저 우선순위 — 상태바 아이콘도 숨김
            .setVisibility(NotificationCompat.VISIBILITY_SECRET) // 잠금화면에서 내용 숨김
            .setContentIntent(pendingOpen)
            .setAutoCancel(false)
            .setSilent(true)
            .build();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID_SILENT,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_MIN  // 소리·진동·상태바 아이콘 없음
            );
            channel.setDescription("BrioDo 잠금화면 서비스 (백그라운드 유지용)");
            channel.setShowBadge(false);
            channel.enableVibration(false);
            channel.setSound(null, null);

            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null) nm.createNotificationChannel(channel);
        }
    }
}
