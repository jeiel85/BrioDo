import { useState, useRef } from 'react'
import { getLocalDateString } from '../utils/helpers'
import { useSwipeToDismiss } from '../hooks/useSwipeToDismiss'

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
  lang, langPref, setLangPref,
  // L(ko, en, ja, zh) — falls back to en for ja/zh if not provided
  fontScale, setFontScale,
  theme, setTheme, generateRandomTheme,
  viewMode, setViewMode, setSelectedDate,
  inputMode, setInputMode,
  brioBalance, brioDailyLimit, onAiLimitToast,
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
  weatherEnabled, setWeatherEnabled,
  weatherLocation, setWeatherLocation,
  onPreviewLockScreen,
  setShowSettings,
  appVersion,
}) {
  const L = (ko, en, ja, zh) => lang === 'ko' ? ko : lang === 'ja' ? (ja ?? en) : lang === 'zh' ? (zh ?? en) : en
  const [licensesExpanded, setLicensesExpanded] = useState(false)
  const hasCalendarToken = !!localStorage.getItem('googleAccessToken')
  const close = () => setShowSettings(false)
  const headerRef = useRef(null)
  const { overlayRef, modalRef, swipeHandlers } = useSwipeToDismiss(close, { handleRef: headerRef })
  return (
    <div className="input-overlay" ref={overlayRef} onClick={close}>
      <div className="settings-modal" ref={modalRef} onClick={e => e.stopPropagation()} {...swipeHandlers}>
        <div ref={headerRef}>
        <div className="modal-drag-handle-zone">
          <div className="modal-drag-handle" />
        </div>
        <div className="settings-header">
          <h2 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800 }}>
            <span style={{ marginRight: '8px' }}>⚙️</span>{lang === 'ko' ? '설정' : lang === 'ja' ? '設定' : lang === 'zh' ? '设置' : 'Settings'}
          </h2>
          <button className="settings-close" onClick={close}>✕</button>
        </div>
        </div>

        <div className="settings-scroll-body">

        {/* ─── 언어 설정 ─── */}
        <div className="settings-section">
          <h3>{lang === 'ko' ? '언어' : lang === 'ja' ? '言語' : lang === 'zh' ? '语言' : 'Language'}</h3>
          <div className="lang-selector">
            {[
              { val: 'auto', label: lang === 'ko' ? '시스템 따름' : lang === 'ja' ? 'システムに従う' : lang === 'zh' ? '跟随系统' : 'Follow System' },
              { val: 'ko', label: '한국어' },
              { val: 'en', label: 'English' },
              { val: 'ja', label: '日本語' },
              { val: 'zh', label: '中文' },
            ].map(({ val, label }) => (
              <button
                key={val}
                className={`lang-btn ${langPref === val ? 'active' : ''}`}
                onClick={() => setLangPref(val)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="settings-section">
          <h3>{L('글자 크기', 'Font Size', 'フォントサイズ', '字体大小')}</h3>
          <div className="font-size-selector" style={{ marginBottom: '14px' }}>
            {[{ val: 2, label: L('작게', 'Small', '小', '小'), size: '13px' },
              { val: 4, label: L('중간', 'Medium', '中', '中'), size: '16px' },
              { val: 6, label: L('크게', 'Large', '大', '大'), size: '20px' }
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
          <h3>{L('테마', 'Theme', 'テーマ', '主题')}</h3>
          <div className="font-size-selector" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button className={theme === 'light' ? 'active' : ''} onClick={() => setTheme('light')}>
              <span style={{ fontSize: '18px' }}>☀️</span>
              <span>{L('기본 (라이트)', 'Light', 'ライト', '浅色')}</span>
            </button>
            <button className={theme === 'dark' ? 'active' : ''} onClick={() => setTheme('dark')}>
              <span style={{ fontSize: '18px' }}>🌙</span>
              <span>{L('다크 모드', 'Dark', 'ダーク', '深色')}</span>
            </button>
            <button className={theme === 'system' ? 'active' : ''} onClick={() => setTheme('system')}>
              <span style={{ fontSize: '18px' }}>📱</span>
              <span>{L('시스템', 'System', 'システム', '跟随系统')}</span>
            </button>
            <button className={theme === 'random' ? 'active' : ''} onClick={generateRandomTheme}>
              <span style={{ fontSize: '18px' }}>🎲</span>
              <span>{L('랜덤', 'Random', 'ランダム', '随机')}</span>
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
          <h3>{L('할 일 입력 방식', 'Input Mode', '入力方法', '输入方式')}</h3>
          <div className="font-size-selector">
            <button
              className={inputMode === 'smart' ? 'active' : ''}
              onClick={() => {
                if (!user) {
                  onAiLimitToast?.(L('스마트 입력은 로그인 후 이용할 수 있어요', 'Sign in to use Smart Input', 'スマート入力はログイン後にご利用いただけます', '智能输入需要登录后才能使用'))
                } else if (brioBalance <= 0) {
                  onAiLimitToast?.(lang === 'ko'
                    ? `브리오가 부족합니다 (잔량: ⚡${brioBalance}, 자정에 초기화)`
                    : lang === 'ja' ? `Brioが不足しています (残量: ⚡${brioBalance}, 深夜リセット)`
                    : lang === 'zh' ? `Brio不足 (余量: ⚡${brioBalance}, 午夜重置)`
                    : `Not enough Brio (balance: ⚡${brioBalance}, resets at midnight)`)
                } else {
                  setInputMode('smart')
                }
              }}
            >
              <span>✨</span>
              <span>{L('스마트 입력', 'Smart', 'スマート入力', '智能输入')}</span>
            </button>
            <button className={inputMode === 'manual' ? 'active' : ''} onClick={() => setInputMode('manual')}>
              <span>✏️</span>
              <span>{L('수동 입력', 'Manual', '手動入力', '手动输入')}</span>
            </button>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--color-on-surface-variant)', marginTop: '8px', lineHeight: '1.4' }}>
            {inputMode === 'smart'
              ? L('자유롭게 입력하면 날짜·태그를 AI가 자동 분석합니다', 'AI detects date & tags from natural text', '自由入力でAIが日付・タグを自動分析します', '自由输入，AI自动分析日期和标签')
              : L('날짜·태그를 직접 지정해 저장합니다', 'Manually set date, tags and priority', '日付・タグを直接指定して保存します', '手动指定日期、标签并保存')}
          </p>
          {/* AI 사용량 progress bar */}
          {user && (() => {
            const count = brioBalance ?? 0
            const limit = brioDailyLimit ?? 10
            const pct = Math.min((count / limit) * 100, 100)
            const barColor = pct <= 50 ? 'var(--color-primary)'
              : pct <= 80 ? '#f59e0b'
              : 'var(--color-error)'
            return (
              <div style={{ marginTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-on-surface-variant)' }}>
                    {L('⚡ 브리오 (자정 초기화)', '⚡ Brio (resets midnight)', '⚡ Brio (深夜リセット)', '⚡ Brio (午夜重置)')}
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: barColor }}>
                    {count}/{limit}
                  </span>
                </div>
                <div style={{ height: '6px', borderRadius: '9999px', background: 'var(--color-surface-container)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${pct}%`,
                    borderRadius: '9999px',
                    background: barColor,
                    transition: 'width 0.4s ease, background 0.4s ease',
                  }} />
                </div>
              </div>
            )
          })()}
        </div>

        <div className="settings-section">
          <h3>{L('알림 기본값', 'Default Reminder', '通知デフォルト', '默认提醒')}</h3>
          <p style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)', marginBottom: '10px', lineHeight: '1.4' }}>
            {L('새 일정 추가 시 기본으로 적용할 알림 시점', 'Default reminder timing for new tasks', '新しいタスク追加時のデフォルト通知タイミング', '新增任务时默认提醒时间')}
          </p>
          <div className="reminder-offset-btns" style={{ marginBottom: '16px' }}>
            {[
              { val: null, label: L('없음', 'Off', 'なし', '关闭') },
              { val: 0,  label: L('정각', 'On time', '定刻', '准时') },
              { val: 10, label: L('10분 전', '-10m', '10分前', '-10分') },
              { val: 30, label: L('30분 전', '-30m', '30分前', '-30分') },
              { val: 60, label: L('1시간 전', '-1h', '1時間前', '-1小时') },
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

          <h3>{L('종일 일정 알림 시간', 'All-day Reminder Time', '終日タスク通知時間', '全天任务提醒时间')}</h3>
          <p style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)', marginBottom: '10px', lineHeight: '1.4' }}>
            {L('시간 없는 종일 일정의 기본 알림 시간 (기본: 오전 9시)', 'Notification time for all-day tasks (default: 9:00 AM)', '時間未設定の終日タスクのデフォルト通知時間（デフォルト: 午前9時）', '全天任务默认提醒时间（默认: 上午9点）')}
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
              {L('기본값', 'Reset', 'リセット', '重置')}
            </button>
          </div>
        </div>

        <div className="settings-section">
          <h3>{L('기본 보기', 'Default View', 'デフォルト表示', '默认视图')}</h3>
          <div className="font-size-selector">
            <button
              className={viewMode === 'date' ? 'active' : ''}
              onClick={() => { setViewMode('date'); setSelectedDate(getLocalDateString(new Date())) }}
            >
              <span>📅</span>
              <span>{L('날짜별', 'By Date', '日付別', '按日期')}</span>
            </button>
            <button className={viewMode === 'all' ? 'active' : ''} onClick={() => setViewMode('all')}>
              <span>📋</span>
              <span>{L('전체', 'All', 'すべて', '全部')}</span>
            </button>
          </div>
        </div>

        {/* ─── 날씨 설정 ─── */}
        <div className="settings-section">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <h3 style={{ margin: 0 }}>{lang === 'ko' ? '🌤 날씨 표시' : lang === 'ja' ? '🌤 天気表示' : lang === 'zh' ? '🌤 天气显示' : '🌤 Weather'}</h3>
            <label className="settings-toggle">
              <input type="checkbox" checked={weatherEnabled} onChange={e => setWeatherEnabled(e.target.checked)} />
              <span className="settings-toggle-track" />
            </label>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)', marginBottom: weatherEnabled ? '12px' : 0, lineHeight: '1.4' }}>
            {L('헤더와 잠금화면에 현재 날씨를 표시합니다.', 'Shows current weather in header and lock screen.', 'ヘッダーとロック画面に天気を表示します。', '在标题和锁屏上显示当前天气。')}
          </p>
          {weatherEnabled && (
            <div>
              <h3 style={{ marginBottom: '8px' }}>
                {L('위치 설정', 'Location', '場所設定', '位置设置')}
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)', marginBottom: '8px', lineHeight: '1.4' }}>
                {L('비워두면 IP 기반으로 자동 감지합니다. 도시명 입력 시 해당 지역 날씨 표시 (예: Seoul, Tokyo).', 'Leave blank for automatic IP-based location. Enter a city name for a specific location (e.g., Seoul, Tokyo).', '空欄にするとIPで自動検出します。都市名を入力すると該当地域の天気を表示 (例: Seoul, Tokyo).', '留空则自动基于IP检测。输入城市名显示该地区天气 (例: Seoul, Tokyo).')}
              </p>
              <input
                type="text"
                className="settings-text-input"
                value={weatherLocation}
                onChange={e => setWeatherLocation(e.target.value)}
                placeholder={lang === 'ko' ? '도시명 (비우면 자동 감지)' : lang === 'ja' ? '都市名（空欄で自動）' : lang === 'zh' ? '城市名（留空自动）' : 'City name (blank = auto)'}
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>
          )}
        </div>

        <div className="settings-section">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <h3 style={{ margin: 0 }}>{L('잠금화면 위젯', 'Lock Screen Widget', 'ロック画面ウィジェット', '锁屏小部件')}</h3>
            <label className="settings-toggle">
              <input type="checkbox" checked={lockScreenEnabled} onChange={e => setLockScreenEnabled(e.target.checked)} />
              <span className="settings-toggle-track" />
            </label>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)', marginBottom: lockScreenEnabled ? '10px' : 0, lineHeight: '1.4' }}>
            {L('잠금화면에서 오늘 할 일 목록을 표시합니다.', "Shows today's tasks on the lock screen.", 'ロック画面に本日のタスクを表示します。', '在锁屏上显示今日任务。')}
          </p>
          {lockScreenEnabled && (
            <>
              {/* 퀵버튼 선택 (최대 6개) */}
              <h3 style={{ marginBottom: '4px' }}>
                {L('빠른 버튼 선택', 'Quick Buttons', 'クイックボタン', '快捷按钮')}
                <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--color-on-surface-variant)', marginLeft: '6px' }}>
                  {lockScreenButtons.length}/6
                </span>
              </h3>
              <p style={{ fontSize: '11px', color: 'var(--color-on-surface-variant)', marginBottom: '10px', lineHeight: '1.4' }}>
                {L('잠금화면에 표시할 버튼을 선택하세요 (최대 6개). 순서는 탭 순서대로.', 'Select up to 6 buttons for the lock screen.', 'ロック画面に表示するボタンを選択（最大6個）。', '选择最多6个按钮显示在锁屏上。')}
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
              <h3 style={{ marginTop: '18px', marginBottom: '8px' }}>{L('할 일 표시 범위', 'Todo Display', 'タスク表示範囲', '任务显示范围')}</h3>
              <div className="font-size-selector" style={{ marginBottom: '10px' }}>
                <button
                  className={lockScreenTodoMode === 'today' ? 'active' : ''}
                  onClick={() => setLockScreenTodoMode('today')}
                >
                  <span>📅</span>
                  <span style={{ fontSize: '11px' }}>{L('오늘만', 'Today', '今日のみ', '仅今天')}</span>
                </button>
                <button
                  className={lockScreenTodoMode === 'all' ? 'active' : ''}
                  onClick={() => setLockScreenTodoMode('all')}
                >
                  <span>📋</span>
                  <span style={{ fontSize: '11px' }}>{L('전체', 'All', 'すべて', '全部')}</span>
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ fontSize: '13px', color: 'var(--color-on-surface-variant)' }}>
                  {L('완료된 할 일도 표시', 'Show completed tasks', '完了済みタスクも表示', '也显示已完成任务')}
                </span>
                <label className="settings-toggle">
                  <input type="checkbox" checked={lockScreenShowCompleted} onChange={e => setLockScreenShowCompleted(e.target.checked)} />
                  <span className="settings-toggle-track" />
                </label>
              </div>

              {/* 잠금화면 글자 크기 */}
              <h3 style={{ marginBottom: '10px' }}>{L('잠금화면 글자 크기', 'Lock Screen Font Size', 'ロック画面フォントサイズ', '锁屏字体大小')}</h3>
              <div className="font-size-selector" style={{ marginBottom: '10px' }}>
                {[{ val: 2, label: L('작게', 'S', '小', '小'), size: '13px' },
                  { val: 4, label: L('중간', 'M', '中', '中'), size: '16px' },
                  { val: 6, label: L('크게', 'L', '大', '大'), size: '20px' }
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
                {L('미리보기', 'Preview', 'プレビュー', '预览')}
              </button>
            </>
          )}
        </div>

        {user && (
          <div className="settings-section">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <h3 style={{ margin: 0 }}>{L('Google 캘린더 동기화', 'Google Calendar Sync', 'Googleカレンダー同期', 'Google日历同步')}</h3>
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
                      : L('연결 안 됨 — 아래 버튼으로 연결하세요', 'Not connected — tap below to connect', '未接続 — 下のボタンで接続してください', '未连接 — 点击下方按钮连接')}
                  </span>
                </div>
                {hasCalendarToken && (
                  <div style={{ fontSize: '11px', color: 'var(--color-on-surface-variant)', marginBottom: '10px', paddingLeft: '14px' }}>
                    {L('📅 BrioDo 캘린더에 동기화됩니다', '📅 Syncing to BrioDo calendar', '📅 BrioDo カレンダーに同期します', '📅 同步至 BrioDo 日历')}
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
                    ? L('권한 갱신', 'Refresh Auth', '権限を更新', '刷新授权')
                    : L('Google Calendar 연결', 'Connect Google Calendar', 'Googleカレンダーを接続', '连接Google日历')}
                </button>

                <h3 style={{ marginTop: '18px' }}>{L('완료 시 캘린더 처리', 'On Completion', '完了時のカレンダー処理', '完成时日历处理')}</h3>
                <div className="font-size-selector">
                  <button
                    className={completionCalendarMode === 'status' ? 'active' : ''}
                    onClick={() => setCompletionCalendarMode('status')}
                  >
                    <span>✅</span>
                    <span>{L('상태 변경', 'Keep & Mark', '状態変更', '标记完成')}</span>
                  </button>
                  <button
                    className={completionCalendarMode === 'delete' ? 'active' : ''}
                    onClick={() => setCompletionCalendarMode('delete')}
                  >
                    <span>🗑️</span>
                    <span>{L('캘린더 삭제', 'Remove', 'カレンダーから削除', '从日历删除')}</span>
                  </button>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--color-on-surface-variant)', marginTop: '8px', lineHeight: '1.4' }}>
                  {completionCalendarMode === 'delete'
                    ? L('완료 시 구글 캘린더에서 삭제합니다. 완료 취소 시 자동으로 다시 추가됩니다.', 'Removes from Google Calendar on completion. Restored on undo.', '完了時にGoogleカレンダーから削除します。完了取消し時に自動で再追加されます。', '完成时从Google日历删除。取消完成时自动重新添加。')
                    : L('완료 시 구글 캘린더에 완료 표시로 남깁니다.', 'Keeps the event in Google Calendar with a completed mark.', '完了時にGoogleカレンダーに完了済みとして残します。', '完成时在Google日历中标记为已完成。')}
                </p>
              </>
            ) : (
              <p style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)', lineHeight: '1.4' }}>
                {L('동기화가 꺼져 있습니다. 켜면 할 일이 Google 캘린더에 자동으로 반영됩니다.', 'Sync is off. Enable to automatically reflect tasks in Google Calendar.', '同期がオフです。オンにするとタスクがGoogleカレンダーに自動反映されます。', '同步已关闭。开启后任务将自动同步到Google日历。')}
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
              {L('로그아웃 / 계정 전환', 'Logout / Change Account', 'ログアウト / アカウント切替', '退出登录 / 切换账号')}
            </button>
          ) : (
            <div className="login-card">
              <div style={{ fontSize: '32px' }}>☁️</div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-on-surface)', marginBottom: '6px' }}>
                  {L('클라우드 기능 활성화', 'Enable Cloud Features', 'クラウド機能を有効化', '启用云端功能')}
                </p>
                <p style={{ fontSize: '13px', color: 'var(--color-on-surface-variant)', lineHeight: '1.5' }}>
                  {L('로그인하면 클라우드 백업 및\n구글 캘린더 연동이 활성화됩니다.', 'Login to enable cloud backup\nand Google Calendar sync.', 'ログインするとクラウドバックアップと\nGoogleカレンダー連携が有効になります。', '登录后即可启用云端备份\n和Google日历同步。')}
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
                {L('Google 계정으로 로그인', 'Sign in with Google', 'Googleアカウントでサインイン', '使用Google账号登录')}
              </button>
            </div>
          )}
        </div>
        {/* 앱 정보 섹션 */}
        <div className="settings-section" style={{ paddingBottom: '8px' }}>
          <h3>{L('앱 정보', 'About', 'アプリ情報', '应用信息')}</h3>

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
            <span>📄 {L('오픈소스 라이센스', 'Open Source Licenses', 'オープンソースライセンス', '开源许可证')}</span>
            <span style={{ fontSize: '11px', color: 'var(--color-on-surface-variant)', transform: licensesExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
          </button>
          {licensesExpanded && (
            <div style={{
              background: 'var(--color-surface-container-low)', border: '1px solid var(--color-outline-variant)',
              borderTop: 'none', borderRadius: '0 0 10px 10px', marginBottom: '12px', overflow: 'hidden',
            }}>
              <p style={{ fontSize: '11px', color: 'var(--color-on-surface-variant)', padding: '10px 14px 6px', lineHeight: '1.5' }}>
                {L('BrioDo는 아래 오픈소스 라이브러리를 사용합니다. 모든 라이센스를 준수합니다.', 'BrioDo uses the following open source libraries, in compliance with their licenses.', 'BrioDo は以下のオープンソースライブラリを使用しています。すべてのライセンスを遵守しています。', 'BrioDo 使用以下开源库，并遵守所有许可证。')}
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
            <div style={{ fontSize: '10px', marginTop: '3px', opacity: 0.6 }}>Do it with brio.</div>
          </div>
        </div>

        </div>
      </div>
    </div>
  )
}
