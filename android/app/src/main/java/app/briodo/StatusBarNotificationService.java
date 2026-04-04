package app.briodo;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationCompat.BigTextStyle;

/**
 * 상태바 상주 알림 포어그라운드 서비스.
 * - 손전등 토글 버튼
 * - 일정 추가 버튼 (설정에 따라 메인 화면 or SmartInputModal)
 */
public class StatusBarNotificationService extends Service {

    static final int NOTIF_ID = 2001;
    static final String CHANNEL_ID = "briodo_status_bar";

    // BroadcastReceiver 액션
    static final String ACTION_TOGGLE_FLASHLIGHT = "app.briodo.ACTION_TOGGLE_FLASHLIGHT";
    static final String ACTION_ADD_SCHEDULE      = "app.briodo.ACTION_ADD_SCHEDULE";
    // Android 14+: setOngoing(true)도 스와이프 제거 가능 → 제거 감지 후 즉시 복원
    static final String ACTION_NOTIF_DISMISSED   = "app.briodo.ACTION_NOTIF_DISMISSED";

    // 일정 추가 탭 동작 — MainActivity로 전달하는 extra
    static final String EXTRA_OPEN_INPUT = "briodo_open_input";

    // SharedPreferences 키 (StatusBarNotificationPlugin과 공유)
    static final String PREFS_NAME        = "briodo_statusbar_notif";
    static final String PREF_ENABLED      = "enabled";
    static final String PREF_TAP_ACTION   = "tap_action";
    static final String TAP_ACTION_INPUT  = "input";   // SmartInputModal 열기
    static final String TAP_ACTION_APP    = "app";     // 메인 화면 열기 (기본)

    /** 손전등 현재 상태 (NotificationActionReceiver와 공유) */
    static boolean torchOn = false;

    /** 알림 본문 텍스트 — JS updateContent() 로 갱신, null 이면 기본값 사용 */
    static String notifContentText = null;

    /** Plugin에서 서비스 인스턴스를 참조하기 위한 정적 필드 */
    static StatusBarNotificationService instance;

    @Override
    public void onCreate() {
        super.onCreate();
        instance = this;
        createChannel();
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        instance = null;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        startForeground(NOTIF_ID, buildNotification());
        return START_STICKY;
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    // ── 알림 채널 생성 ────────────────────────────────────────────────────────
    private void createChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel ch = new NotificationChannel(
                CHANNEL_ID,
                "BrioDo 상태바",
                NotificationManager.IMPORTANCE_LOW   // 소리·진동 없이 조용하게
            );
            ch.setDescription("BrioDo 상주 알림 — 손전등 및 일정 추가");
            ch.setShowBadge(false);
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null) nm.createNotificationChannel(ch);
        }
    }

    // ── 알림 빌드 ─────────────────────────────────────────────────────────────
    Notification buildNotification() {
        // 알림 탭 → 설정에 따라 메인 화면 or SmartInputModal
        boolean openInput = isInputMode();
        Intent tapIntent = new Intent(this, MainActivity.class);
        tapIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        if (openInput) tapIntent.putExtra(EXTRA_OPEN_INPUT, true);

        PendingIntent tapPi = PendingIntent.getActivity(
            this, 0, tapIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        // 🔦 손전등 버튼
        Intent torchIntent = new Intent(this, NotificationActionReceiver.class);
        torchIntent.setAction(ACTION_TOGGLE_FLASHLIGHT);
        PendingIntent torchPi = PendingIntent.getBroadcast(
            this, 1, torchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        // ➕ 일정 추가 버튼
        Intent addIntent = new Intent(this, NotificationActionReceiver.class);
        addIntent.setAction(ACTION_ADD_SCHEDULE);
        PendingIntent addPi = PendingIntent.getBroadcast(
            this, 2, addIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        // Android 14+: 사용자가 알림을 스와이프로 제거할 경우 즉시 서비스 재시작 → 알림 복원
        Intent dismissIntent = new Intent(this, NotificationActionReceiver.class);
        dismissIntent.setAction(ACTION_NOTIF_DISMISSED);
        PendingIntent dismissPi = PendingIntent.getBroadcast(
            this, 3, dismissIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        String content = (notifContentText != null && !notifContentText.isEmpty())
            ? notifContentText : "오늘도 활기차게, 해내세요! ✨";

        String torchLabel = torchOn ? "🔦 끄기" : "🔦 켜기";

        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle("BrioDo")
            .setContentText(content)
            // BigTextStyle → 알림이 기본 확장 상태로 표시되어 액션 버튼이 바로 노출됨
            .setStyle(new BigTextStyle().bigText(content))
            .setContentIntent(tapPi)
            .setDeleteIntent(dismissPi) // 스와이프 제거 시 복원 트리거
            .setOngoing(true)           // Android 13 이하: 스와이프 제거 불가
            .setSilent(true)            // 소리·진동 없음
            .setShowWhen(false)         // 시간 숨김
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .addAction(0, torchLabel, torchPi)
            .addAction(0, "➕ 일정 추가", addPi)
            .build();
    }

    /** 설정에서 일정 추가 탭 동작이 "input"인지 확인 */
    private boolean isInputMode() {
        return TAP_ACTION_INPUT.equals(
            getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
                .getString(PREF_TAP_ACTION, TAP_ACTION_APP)
        );
    }

    /** 알림 갱신 (탭 동작 변경 시 호출) */
    void refresh() {
        NotificationManager nm = getSystemService(NotificationManager.class);
        if (nm != null) nm.notify(NOTIF_ID, buildNotification());
    }
}
