import { useState } from 'react'
import { getLocalDateString } from '../utils/helpers'

const LOCK_BUTTON_DEFS = [
  { id: 'torch',      emoji: '🔦', label_ko: '손전등',     label_en: 'Flashlight' },
  { id: 'camera',     emoji: '📷', label_ko: '카메라',     label_en: 'Camera' },
  { id: 'qr',         emoji: '⬛', label_ko: 'QR 스캐너',  label_en: 'QR Scan' },
  { id: 'timer',      emoji: '⏱',  label_ko: '타이머',     label_en: 'Timer' },
  { id: 'calculator', emoji: '🧮', label_ko: '계산기',     label_en: 'Calculator' },
  { id: 'playPause',  emoji: '▶',  label_ko: '재생',       label_en: 'Play/Pause' },
  { id: 'alarm',      emoji: '⏰', label_ko: '알람',       label_en: 'Alarm' },
  { id: 'stopwatch',  emoji: '⏲',  label_ko: '스톱워치',   label_en: 'Stopwatch' },
]

const OPEN_SOURCE_LICENSES = [
  { name: 'React', version: '19', license: 'MIT', author: 'Meta Platforms, Inc.' },
  { name: 'Vite', version: '8', license: 'MIT', author: 'Evan You & Vite contributors' },
  { name: 'Capacitor', version: '8', license: 'MIT', author: 'Ionic, Inc.' },
  { name: 'Firebase JS SDK', version: '12', license: 'Apache 2.0', author: 'Google LLC' },
  { name: '@google/genai', version: '1', license: 'Apache 2.0', author: 'Google LLC' },
  { name: 'idb', version: '8', license: 'ISC', author: 'Jake Archibald' },
  { name: 'canvas-confetti', version: '1', license: 'ISC', author: 'Kiril Vatev' },
  { name: 'patch-package', version: '8', license: 'MIT', author: 'David Sheldrick' },
  { name: '@capacitor-community/speech-recognition', version: '7', license: 'MIT', author: 'Capacitor Community' },
  { name: '@codetrix-studio/capacitor-google-auth', version: '3', license: 'MIT', author: 'CodetrixStudio' },
]

export function SettingsModal({
  lang,
  fontScale, setFontScale,
  theme, setTheme, generateRandomTheme,
  viewMode, setViewMode, setSelectedDate,
  inputMode, setInputMode,
  aiUsageCount, aiDailyLimit, onAiLimitToast,
  completionCalendarMode, setCompletionCalendarMode,
  defaultReminderOffset, setDefaultReminderOffset,
  allDayReminderTime, setAllDayReminderTime,
  user, handleLogin, handleLogout,
  lockScreenEnabled, setLockScreenEnabled,
  lockScreenTodoMode, setLockScreenTodoMode,
  lockScreenShowCompleted, setLockScreenShowCompleted,
  lockScreenFontScale, setLockScreenFontScale,
  lockScreenButtons, setLockScreenButtons,
  calendarSyncEnabled, setCalendarSyncEnabled,
  onPreviewLockScreen,
  setShowSettings,
  appVersion,
}) {
  const [licensesExpanded, setLicensesExpanded] = useState(false)
  const hasCalendarToken = !!localStorage.getItem('googleAccessToken')
  return (
    <div className="input-overlay" onClick={() => setShowSettings(false)}>
      <div className="settings-modal" onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <h2 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800 }}>{lang === 'ko' ? '설정' : 'Settings'}</h2>
          <button className="settings-close" onClick={() => setShowSettings(false)}>✕</button>
        </div>

        <div className="settings-scroll-body">
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
            <button
              className={theme === 'materialyou' ? 'active' : ''}
              onClick={() => setTheme('materialyou')}
              style={{ gridColumn: '1 / -1' }}
            >
              <span style={{ fontSize: '18px' }}>💜</span>
              <span>Material You</span>
            </button>
          </div>
        </div>

        <div className="settings-section">
          <h3>{lang === 'ko' ? '할 일 입력 방식' : 'Input Mode'}</h3>
          <div className="font-size-selector">
            <button
              className={inputMode === 'smart' ? 'active' : ''}
              onClick={() => {
                if (aiUsageCount >= aiDailyLimit) {
                  onAiLimitToast?.(lang === 'ko'
                    ? `오늘 AI 사용량을 모두 소진했습니다 (${aiUsageCount}/${aiDailyLimit}, 자정에 초기화)`
                    : `Daily AI limit reached (${aiUsageCount}/${aiDailyLimit}, resets at midnight)`)
                } else {
                  setInputMode('smart')
                }
              }}
            >
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
          <div style={{ fontSize: '11px', marginTop: '6px', color: (aiUsageCount ?? 0) >= (aiDailyLimit ?? 10) ? 'var(--color-error)' : 'var(--color-on-surface-variant)' }}>
            {lang === 'ko'
              ? `AI 사용량: ${aiUsageCount ?? 0}/${aiDailyLimit ?? 10}회 (자정 초기화)`
              : `AI usage: ${aiUsageCount ?? 0}/${aiDailyLimit ?? 10} (resets at midnight)`}
          </div>
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

        <div className="settings-section">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <h3 style={{ margin: 0 }}>{lang === 'ko' ? '잠금화면 위젯' : 'Lock Screen Widget'}</h3>
            <label className="settings-toggle">
              <input type="checkbox" checked={lockScreenEnabled} onChange={e => setLockScreenEnabled(e.target.checked)} />
              <span className="settings-toggle-track" />
            </label>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)', marginBottom: lockScreenEnabled ? '10px' : 0, lineHeight: '1.4' }}>
            {lang === 'ko'
              ? '잠금화면에서 오늘 할 일 목록을 표시합니다.'
              : 'Shows today\'s tasks on the lock screen.'}
          </p>
          {lockScreenEnabled && (
            <>
              {/* 퀵버튼 선택 (최대 6개) */}
              <h3 style={{ marginBottom: '4px' }}>
                {lang === 'ko' ? '빠른 버튼 선택' : 'Quick Buttons'}
                <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--color-on-surface-variant)', marginLeft: '6px' }}>
                  {lockScreenButtons.length}/6
                </span>
              </h3>
              <p style={{ fontSize: '11px', color: 'var(--color-on-surface-variant)', marginBottom: '10px', lineHeight: '1.4' }}>
                {lang === 'ko'
                  ? '잠금화면에 표시할 버튼을 선택하세요 (최대 6개). 순서는 탭 순서대로.'
                  : 'Select up to 6 buttons for the lock screen.'}
              </p>
              <div className="lock-btn-picker">
                {LOCK_BUTTON_DEFS.map(({ id, emoji, label_ko, label_en }) => {
                  const selected = lockScreenButtons.includes(id)
                  const atMax = lockScreenButtons.length >= 6
                  return (
                    <button
                      key={id}
                      className={`lock-btn-pick-item${selected ? ' selected' : ''}${!selected && atMax ? ' disabled' : ''}`}
                      onClick={() => {
                        if (selected) {
                          setLockScreenButtons(lockScreenButtons.filter(b => b !== id))
                        } else if (!atMax) {
                          setLockScreenButtons([...lockScreenButtons, id])
                        }
                      }}
                    >
                      <span style={{ fontSize: '20px' }}>{emoji}</span>
                      <span style={{ fontSize: '10px', marginTop: '2px' }}>{lang === 'ko' ? label_ko : label_en}</span>
                      {selected && <span className="lock-btn-pick-check">✓</span>}
                    </button>
                  )
                })}
              </div>

              {/* 할일 표시 설정 */}
              <h3 style={{ marginTop: '18px', marginBottom: '8px' }}>{lang === 'ko' ? '할 일 표시 범위' : 'Todo Display'}</h3>
              <div className="font-size-selector" style={{ marginBottom: '10px' }}>
                <button
                  className={lockScreenTodoMode === 'today' ? 'active' : ''}
                  onClick={() => setLockScreenTodoMode('today')}
                >
                  <span>📅</span>
                  <span style={{ fontSize: '11px' }}>{lang === 'ko' ? '오늘만' : 'Today'}</span>
                </button>
                <button
                  className={lockScreenTodoMode === 'all' ? 'active' : ''}
                  onClick={() => setLockScreenTodoMode('all')}
                >
                  <span>📋</span>
                  <span style={{ fontSize: '11px' }}>{lang === 'ko' ? '전체' : 'All'}</span>
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ fontSize: '13px', color: 'var(--color-on-surface-variant)' }}>
                  {lang === 'ko' ? '완료된 할 일도 표시' : 'Show completed tasks'}
                </span>
                <label className="settings-toggle">
                  <input type="checkbox" checked={lockScreenShowCompleted} onChange={e => setLockScreenShowCompleted(e.target.checked)} />
                  <span className="settings-toggle-track" />
                </label>
              </div>

              {/* 잠금화면 글자 크기 */}
              <h3 style={{ marginBottom: '10px' }}>{lang === 'ko' ? '잠금화면 글자 크기' : 'Lock Screen Font Size'}</h3>
              <div className="font-size-selector" style={{ marginBottom: '10px' }}>
                {[{ val: 2, label: lang === 'ko' ? '작게' : 'S', size: '13px' },
                  { val: 4, label: lang === 'ko' ? '중간' : 'M', size: '16px' },
                  { val: 6, label: lang === 'ko' ? '크게' : 'L', size: '20px' }
                ].map(({ val, label, size }) => (
                  <button key={val} className={lockScreenFontScale === val ? 'active' : ''} onClick={() => setLockScreenFontScale(val)}>
                    <span style={{ fontSize: size }}>A</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-on-surface-variant)', minWidth: '8px' }}>1</span>
                <input
                  type="range" min="1" max="7" step="1"
                  value={lockScreenFontScale}
                  onChange={e => setLockScreenFontScale(Number(e.target.value))}
                  style={{ flex: 1, accentColor: 'var(--color-primary)', height: '4px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '11px', color: 'var(--color-on-surface-variant)', minWidth: '8px' }}>7</span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)', minWidth: '16px', textAlign: 'right' }}>{lockScreenFontScale}</span>
              </div>

              <button
                className="calendar-permission-btn"
                onClick={onPreviewLockScreen}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                  <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                </svg>
                {lang === 'ko' ? '미리보기' : 'Preview'}
              </button>
            </>
          )}
        </div>

        {user && (
          <div className="settings-section">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <h3 style={{ margin: 0 }}>{lang === 'ko' ? 'Google 캘린더 동기화' : 'Google Calendar Sync'}</h3>
              <label className="settings-toggle">
                <input type="checkbox" checked={calendarSyncEnabled} onChange={e => setCalendarSyncEnabled(e.target.checked)} />
                <span className="settings-toggle-track" />
              </label>
            </div>

            {calendarSyncEnabled ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: hasCalendarToken ? '4px' : '10px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: hasCalendarToken ? '#34c759' : '#ff9500', flexShrink: 0 }} />
                  <span style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)' }}>
                    {hasCalendarToken
                      ? (lang === 'ko' ? '연결됨' : lang === 'ja' ? '接続済み' : lang === 'zh' ? '已连接' : 'Connected')
                      : (lang === 'ko' ? '연결 안 됨 — 아래 버튼으로 연결하세요' : 'Not connected — tap below to connect')}
                  </span>
                </div>
                {hasCalendarToken && (
                  <div style={{ fontSize: '11px', color: 'var(--color-on-surface-variant)', marginBottom: '10px', paddingLeft: '14px' }}>
                    {lang === 'ko' ? '📅 BrioDo 캘린더에 동기화됩니다' : '📅 Syncing to BrioDo calendar'}
                  </div>
                )}
                <button
                  className="calendar-permission-btn"
                  onClick={() => { setShowSettings(false); handleLogin() }}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                    <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
                  </svg>
                  {hasCalendarToken
                    ? (lang === 'ko' ? '권한 갱신' : 'Refresh Auth')
                    : (lang === 'ko' ? 'Google Calendar 연결' : 'Connect Google Calendar')}
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
              </>
            ) : (
              <p style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)', lineHeight: '1.4' }}>
                {lang === 'ko'
                  ? '동기화가 꺼져 있습니다. 켜면 할 일이 Google 캘린더에 자동으로 반영됩니다.'
                  : 'Sync is off. Enable to automatically reflect tasks in Google Calendar.'}
              </p>
            )}
          </div>
        )}

        <div className="settings-section">
          {user ? (
            <button
              className="logout-footer-btn"
              onClick={() => { setShowSettings(false); handleLogout() }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
              </svg>
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
        {/* 앱 정보 섹션 */}
        <div className="settings-section" style={{ paddingBottom: '8px' }}>
          <h3>{lang === 'ko' ? '앱 정보' : 'About'}</h3>

          {/* 오픈소스 라이센스 */}
          <button
            onClick={() => setLicensesExpanded(v => !v)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'var(--color-surface-container-low)', border: '1px solid var(--color-outline-variant)',
              borderRadius: '10px', padding: '10px 14px', cursor: 'pointer', marginBottom: licensesExpanded ? '0' : '12px',
              color: 'var(--color-on-surface)', fontSize: '13px',
              borderBottomLeftRadius: licensesExpanded ? '0' : '10px',
              borderBottomRightRadius: licensesExpanded ? '0' : '10px',
            }}
          >
            <span>📄 {lang === 'ko' ? '오픈소스 라이센스' : 'Open Source Licenses'}</span>
            <span style={{ fontSize: '11px', color: 'var(--color-on-surface-variant)', transform: licensesExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
          </button>
          {licensesExpanded && (
            <div style={{
              background: 'var(--color-surface-container-low)', border: '1px solid var(--color-outline-variant)',
              borderTop: 'none', borderRadius: '0 0 10px 10px', marginBottom: '12px', overflow: 'hidden',
            }}>
              <p style={{ fontSize: '11px', color: 'var(--color-on-surface-variant)', padding: '10px 14px 6px', lineHeight: '1.5' }}>
                {lang === 'ko'
                  ? 'BrioDo는 아래 오픈소스 라이브러리를 사용합니다. 모든 라이센스를 준수합니다.'
                  : 'BrioDo uses the following open source libraries, in compliance with their licenses.'}
              </p>
              {OPEN_SOURCE_LICENSES.map(({ name, version, license, author }) => (
                <div key={name} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '6px 14px', borderTop: '1px solid var(--color-outline-variant)',
                }}>
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-on-surface)' }}>{name}</span>
                    <span style={{ fontSize: '11px', color: 'var(--color-on-surface-variant)', marginLeft: '4px' }}>v{version}</span>
                    <div style={{ fontSize: '10px', color: 'var(--color-on-surface-variant)', marginTop: '1px' }}>{author}</div>
                  </div>
                  <span style={{
                    fontSize: '10px', fontWeight: 600, padding: '2px 7px', borderRadius: '6px',
                    background: 'var(--color-secondary-container)', color: 'var(--color-secondary)',
                  }}>{license}</span>
                </div>
              ))}
            </div>
          )}

          {/* 앱 버전 */}
          <div style={{ textAlign: 'center', padding: '8px 0 4px', color: 'var(--color-on-surface-variant)', fontSize: '12px' }}>
            <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-on-surface)', marginBottom: '3px' }}>BrioDo</div>
            <div>v{appVersion ?? '1.0.0'}</div>
            <div style={{ fontSize: '10px', marginTop: '3px', opacity: 0.6 }}>Blend your life, Do it smoothly.</div>
          </div>
        </div>

        </div>
      </div>
    </div>
  )
}
