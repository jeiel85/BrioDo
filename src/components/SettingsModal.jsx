import { getLocalDateString } from '../utils/helpers'

export function SettingsModal({
  lang, t,
  fontScale, setFontScale,
  theme, setTheme, generateRandomTheme,
  viewMode, setViewMode, setSelectedDate, setBaseDate,
  user, handleLogin, handleLogout,
  setShowSettings
}) {
  return (
    <div className="input-overlay" onClick={() => setShowSettings(false)}>
      <div className="settings-modal" onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <h2>{lang === 'ko' ? '설정' : 'Settings'}</h2>
          <button className="settings-close" onClick={() => setShowSettings(false)}>✕</button>
        </div>

        <div className="settings-section">
          <h3>{lang === 'ko' ? '글자 크기' : 'Font Size'}</h3>
          <div className="font-size-selector">
            <button className={fontScale === 'small' ? 'active' : ''} onClick={() => setFontScale('small')}>
              <span style={{ fontSize: '13px' }}>A</span>
              <span>{lang === 'ko' ? '작게' : 'Small'}</span>
            </button>
            <button className={fontScale === 'medium' ? 'active' : ''} onClick={() => setFontScale('medium')}>
              <span style={{ fontSize: '16px' }}>A</span>
              <span>{lang === 'ko' ? '중간' : 'Medium'}</span>
            </button>
            <button className={fontScale === 'large' ? 'active' : ''} onClick={() => setFontScale('large')}>
              <span style={{ fontSize: '20px' }}>A</span>
              <span>{lang === 'ko' ? '크게' : 'Large'}</span>
            </button>
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
          <h3>{lang === 'ko' ? '기본 보기' : 'Default View'}</h3>
          <div className="font-size-selector">
            <button
              className={viewMode === 'date' ? 'active' : ''}
              onClick={() => { setViewMode('date'); setSelectedDate(getLocalDateString(new Date())); setBaseDate(new Date()) }}
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
            <p style={{ fontSize: '12px', color: 'var(--text-time)', marginBottom: '10px', lineHeight: '1.4' }}>
              {lang === 'ko'
                ? '일정을 구글 캘린더와 양방향 동기화하려면 추가 권한 승인이 필요합니다. 기존 계정 그대로 버튼을 누르시면 됩니다.'
                : 'Required to sync events bidirectionally with Google Calendar.'}
            </p>
            <button
              className="login-btn"
              style={{ width: '100%', textAlign: 'center', background: 'transparent', border: '2px solid var(--primary)', color: 'var(--primary)', fontWeight: 'bold' }}
              onClick={() => { setShowSettings(false); handleLogin() }}
            >
              {lang === 'ko' ? '캘린더 권한 업데이트 🔄' : 'Grant Calendar Permissions 🔄'}
            </button>
          </div>
        )}

        <div className="settings-section" style={{ borderBottom: 'none' }}>
          {user ? (
            <button
              className="logout-footer-btn"
              style={{ width: '100%', textAlign: 'center', marginTop: '10px' }}
              onClick={() => { setShowSettings(false); handleLogout() }}
            >
              {lang === 'ko' ? '로그아웃 / 계정 전환' : 'Logout / Change Account'}
            </button>
          ) : (
            <button
              className="login-btn"
              style={{ width: '100%', textAlign: 'center', marginTop: '10px' }}
              onClick={() => { setShowSettings(false); handleLogin() }}
            >
              {lang === 'ko' ? 'Google 계정으로 로그인' : 'Login with Google'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
