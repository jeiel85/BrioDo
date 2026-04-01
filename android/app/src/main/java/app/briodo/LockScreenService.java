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
 * 잠금화면 활성화 시 포어그라운드 서비스로 동작.
 * ACTION_SCREEN_ON 브로드캐스트를 수신해 잠금 상태이면
 * 높은 우선순위 알림을 발행 → 사용자 탭 시 BrioDo가 잠금화면 위에 표시됨.
 *
 * showWhenLocked=true (MainActivity) 덕분에 잠금 상태에서 앱을 열면
 * 시스템 잠금화면 위에 BrioDo 잠금화면 뷰가 렌더됨.
 */
public class LockScreenService extends Service {

    static final String CHANNEL_ID   = "briodo_lockscreen_ch";
    static final String CHANNEL_NAME = "BrioDo 잠금화면";
    static final int    NOTIF_ID     = 9001;

    private BroadcastReceiver screenReceiver;

    // ── 라이프사이클 ──────────────────────────────────────────────

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();

        screenReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context ctx, Intent intent) {
                String action = intent.getAction();
                if (Intent.ACTION_SCREEN_ON.equals(action)) {
                    // 화면 켜짐 → 알림 갱신 (heads-up 또는 full-screen intent 발동)
                    postNotification(true);
                } else if (Intent.ACTION_USER_PRESENT.equals(action)) {
                    // 키가드 해제됨(잠금 해제) → 상태 알림으로 전환
                    postNotification(false);
                }
            }
        };

        IntentFilter filter = new IntentFilter();
        filter.addAction(Intent.ACTION_SCREEN_ON);
        filter.addAction(Intent.ACTION_USER_PRESENT);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(screenReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            registerReceiver(screenReceiver, filter);
        }

        // 서비스 시작 즉시 포어그라운드로 승격 (ANR 방지)
        postNotification(false);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        // 시스템에 의해 강제 종료된 경우 자동 재시작
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

    // ── 알림 ────────────────────────────────────────────────────

    /**
     * @param isScreenOn true: 화면 켜짐(heads-up/full-screen), false: 일반 상태 알림
     */
    private void postNotification(boolean isScreenOn) {
        // BrioDo 앱 열기 인텐트 (잠금화면 모드 플래그 포함)
        Intent openIntent = new Intent(this, MainActivity.class);
        openIntent.putExtra("briodo_lock_screen", true);
        openIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);

        PendingIntent pendingOpen = PendingIntent.getActivity(
            this, 0, openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_launcher_foreground)
            .setContentTitle("BrioDo")
            .setContentText(isScreenOn
                ? "탭하여 할 일 확인하기"
                : "잠금화면 활성화됨")
            .setOngoing(true)
            .setPriority(isScreenOn
                ? NotificationCompat.PRIORITY_MAX
                : NotificationCompat.PRIORITY_LOW)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setContentIntent(pendingOpen)
            .setAutoCancel(false);

        // Android 10+(Q) 이상: 화면 켜짐 시 full-screen intent 시도
        // USE_FULL_SCREEN_INTENT 권한 없으면 일반 heads-up으로 폴백됨
        if (isScreenOn && Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            builder.setFullScreenIntent(pendingOpen, true);
            builder.setCategory(NotificationCompat.CATEGORY_ALARM);
        }

        Notification notification = builder.build();
        startForeground(NOTIF_ID, notification);

        // 채널에도 직접 업데이트 (heads-up 재트리거)
        if (isScreenOn) {
            NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
            if (nm != null) nm.notify(NOTIF_ID, notification);
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID, CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("BrioDo 잠금화면 오버레이");
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            channel.enableVibration(false);
            channel.setSound(null, null);

            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null) nm.createNotificationChannel(channel);
        }
    }
}
