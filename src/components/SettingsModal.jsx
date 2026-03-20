import { getLocalDateString } from '../utils/helpers'

export function SettingsModal({
  lang,
  fontScale, setFontScale,
  theme, setTheme, generateRandomTheme,
  viewMode, setViewMode, setSelectedDate,
  inputMode, setInputMode,
  completionCalendarMode, setCompletionCalendarMode,
  defaultReminderOffset, setDefaultReminderOffset,
  allDayReminderTime, setAllDayReminderTime,
  user, handleLogin, handleLogout,
  setShowSettings
}) {
  return (
    <div className="input-overlay" onClick={() => setShowSettings(false)}>
      <div className="settings-modal" onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <h2 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800 }}>{lang === 'ko' ? '설정' : 'Settings'}</h2>
          <button className="settings-close" onClick={() => setShowSettings(false)}>✕</button>
        </div>

        <div className="settings-section">
          <h3>{lang === 'ko' ? '글자 크기' : 'Font Size'}</h3>
          <div className="font-size-selector" style={{ marginBottom: '14px' }}>
            {[{ val: 2, label: lang === 'ko' ? '작게' : 'Small', size: '13px' },
              { val: 4, label: lang === 'ko' ? '중간' : 'Medium', size: '16px' },
              { val: 6, label: lang === 'ko' ? '크게' : 'Large', size: '20px' }
            ].map(({ val, label, size }) => (
              <button key={val} className={fontScale === val ? 'active' : ''} onClick={() => setFontScale(val)}>
                <span style={{ fontSize: size }}>A</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-on-surface-variant)', minWidth: '8px' }}>1</span>
            <input
              type="range" min="1" max="7" step="1"
              value={fontScale}
              onChange={e => setFontScale(Number(e.target.value))}
              style={{ flex: 1, accentColor: 'var(--color-primary)', height: '4px', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '11px', color: 'var(--color-on-surface-variant)', minWidth: '8px' }}>7</span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)', minWidth: '16px', textAlign: 'right' }}>{fontScale}</span>
          </div>
        </div>

        <div className="settings-section">
          <h3>{lang === 'ko' ? '테마' : 'Theme'}</h3>
          <div className="font-size-selector" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button className={theme === 'light' ? 'active' : ''} onClick={() => setTheme('light')}>
              <span style={{ fontSize: '18px' }}>☀️</span>
              <span>{lang === 'ko' ? '기본 (라이트)' : 'Light'}</span>
            </button>
            <button className={theme === 'dark' ? 'active' : ''} onClick={() => setTheme('dark')}>
              <span style={{ fontSize: '18px' }}>🌙</span>
              <span>{lang === 'ko' ? '다크 모드' : 'Dark'}</span>
            </button>
            <button className={theme === 'system' ? 'active' : ''} onClick={() => setTheme('system')}>
              <span style={{ fontSize: '18px' }}>📱</span>
              <span>{lang === 'ko' ? '시스템' : 'System'}</span>
            </button>
            <button className={theme === 'random' ? 'active' : ''} onClick={generateRandomTheme}>
              <span style={{ fontSize: '18px' }}>🎲</span>
              <span>{lang === 'ko' ? '랜덤' : 'Random'}</span>
            </button>
          </div>
        </div>

        <div className="settings-section">
          <h3>{lang === 'ko' ? '할 일 입력 방식' : 'Input Mode'}</h3>
          <div className="font-size-selector">
            <button className={inputMode === 'smart' ? 'active' : ''} onClick={() => setInputMode('smart')}>
              <span>✨</span>
              <span>{lang === 'ko' ? '스마트 입력' : 'Smart'}</span>
            </button>
            <button className={inputMode === 'manual' ? 'active' : ''} onClick={() => setInputMode('manual')}>
              <span>✏️</span>
              <span>{lang === 'ko' ? '수동 입력' : 'Manual'}</span>
            </button>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--color-on-surface-variant)', marginTop: '8px', lineHeight: '1.4' }}>
            {inputMode === 'smart'
              ? (lang === 'ko' ? '자유롭게 입력하면 날짜·태그를 AI가 자동 분석합니다' : 'AI detects date & tags from natural text')
              : (lang === 'ko' ? '날짜·태그를 직접 지정해 저장합니다' : 'Manually set date, tags and priority')}
          </p>
        </div>

        <div className="settings-section">
          <h3>{lang === 'ko' ? '알림 기본값' : 'Default Reminder'}</h3>
          <p style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)', marginBottom: '10px', lineHeight: '1.4' }}>
            {lang === 'ko' ? '새 일정 추가 시 기본으로 적용할 알림 시점' : 'Default reminder timing for new tasks'}
          </p>
          <div className="reminder-offset-btns" style={{ marginBottom: '16px' }}>
            {[
              { val: null, label: lang === 'ko' ? '없음' : 'Off' },
              { val: 0,  label: lang === 'ko' ? '정각' : 'On time' },
              { val: 10, label: lang === 'ko' ? '10분 전' : '-10m' },
              { val: 30, label: lang === 'ko' ? '30분 전' : '-30m' },
              { val: 60, label: lang === 'ko' ? '1시간 전' : '-1h' },
            ].map(({ val, label }) => (
              <button
                key={String(val)}
                className={`reminder-offset-btn${defaultReminderOffset === val ? ' active' : ''}`}
                onClick={() => setDefaultReminderOffset(val)}
              >
                {label}
              </button>
            ))}
          </div>

          <h3>{lang === 'ko' ? '종일 일정 알림 시간' : 'All-day Reminder Time'}</h3>
          <p style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)', marginBottom: '10px', lineHeight: '1.4' }}>
            {lang === 'ko' ? '시간 없는 종일 일정의 기본 알림 시간 (기본: 오전 9시)' : 'Notification time for all-day tasks (default: 9:00 AM)'}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="time"
              value={allDayReminderTime}
              onChange={e => setAllDayReminderTime(e.target.value)}
              style={{ flex: 1, padding: '8px 10px', borderRadius: '10px', border: '1px solid var(--color-outline)', background: 'var(--color-surface-variant)', color: 'var(--color-on-surface)', fontSize: '14px' }}
            />
            <button
              onClick={() => setAllDayReminderTime('09:00')}
              style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}
            >
              {lang === 'ko' ? '기본값' : 'Reset'}
            </button>
          </div>
        </div>

        <div className="settings-section">
          <h3>{lang === 'ko' ? '기본 보기' : 'Default View'}</h3>
          <div className="font-size-selector">
            <button
              className={viewMode === 'date' ? 'active' : ''}
              onClick={() => { setViewMode('date'); setSelectedDate(getLocalDateString(new Date())) }}
            >
              <span>📅</span>
              <span>{lang === 'ko' ? '날짜별' : 'By Date'}</span>
            </button>
            <button className={viewMode === 'all' ? 'active' : ''} onClick={() => setViewMode('all')}>
              <span>📋</span>
              <span>{lang === 'ko' ? '전체' : 'All'}</span>
            </button>
          </div>
        </div>

        {user && (
          <div className="settings-section">
            <h3>{lang === 'ko' ? '구글 캘린더 동기화' : 'Google Calendar Sync'}</h3>
            <p style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)', marginBottom: '10px', lineHeight: '1.4' }}>
              {lang === 'ko'
                ? '일정을 구글 캘린더와 양방향 동기화하려면 추가 권한 승인이 필요합니다. 기존 계정 그대로 버튼을 누르시면 됩니다.'
                : 'Required to sync events bidirectionally with Google Calendar.'}
            </p>
            <button
              className="login-btn"
              style={{ width: '100%', textAlign: 'center', background: 'transparent', border: '2px solid var(--color-primary)', color: 'var(--color-primary)', fontWeight: 'bold' }}
              onClick={() => { setShowSettings(false); handleLogin() }}
            >
              {lang === 'ko' ? '캘린더 권한 업데이트 🔄' : 'Grant Calendar Permissions 🔄'}
            </button>

            <h3 style={{ marginTop: '18px' }}>{lang === 'ko' ? '완료 시 캘린더 처리' : 'On Completion'}</h3>
            <div className="font-size-selector">
              <button
                className={completionCalendarMode === 'status' ? 'active' : ''}
                onClick={() => setCompletionCalendarMode('status')}
              >
                <span>✅</span>
                <span>{lang === 'ko' ? '상태 변경' : 'Keep & Mark'}</span>
              </button>
              <button
                className={completionCalendarMode === 'delete' ? 'active' : ''}
                onClick={() => setCompletionCalendarMode('delete')}
              >
                <span>🗑️</span>
                <span>{lang === 'ko' ? '캘린더 삭제' : 'Remove'}</span>
              </button>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--color-on-surface-variant)', marginTop: '8px', lineHeight: '1.4' }}>
              {completionCalendarMode === 'delete'
                ? (lang === 'ko' ? '완료 시 구글 캘린더에서 삭제합니다. 완료 취소 시 자동으로 다시 추가됩니다.' : 'Removes from Google Calendar on completion. Restored on undo.')
                : (lang === 'ko' ? '완료 시 구글 캘린더에 완료 표시로 남깁니다.' : 'Keeps the event in Google Calendar with a completed mark.')}
            </p>
          </div>
        )}

        <div className="settings-section">
          {user ? (
            <button
              className="logout-footer-btn"
              style={{ width: '100%', textAlign: 'center', marginTop: '10px' }}
              onClick={() => { setShowSettings(false); handleLogout() }}
            >
              {lang === 'ko' ? '로그아웃 / 계정 전환' : 'Logout / Change Account'}
            </button>
          ) : (
            <div className="login-card">
              <div style={{ fontSize: '32px' }}>☁️</div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-on-surface)', marginBottom: '6px' }}>
                  {lang === 'ko' ? '클라우드 기능 활성화' : 'Enable Cloud Features'}
                </p>
                <p style={{ fontSize: '13px', color: 'var(--color-on-surface-variant)', lineHeight: '1.5' }}>
                  {lang === 'ko'
                    ? '로그인하면 클라우드 백업 및\n구글 캘린더 연동이 활성화됩니다.'
                    : 'Login to enable cloud backup\nand Google Calendar sync.'}
                </p>
              </div>
              <button
                className="login-btn"
                style={{
                  width: '100%', textAlign: 'center',
                  padding: '14px',
                  fontSize: '15px',
                  fontWeight: 700,
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
                onClick={() => { setShowSettings(false); handleLogin() }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="currentColor"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="currentColor"/>
                  <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="currentColor"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="currentColor"/>
                </svg>
                {lang === 'ko' ? 'Google 계정으로 로그인' : 'Sign in with Google'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
