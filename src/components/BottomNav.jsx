export function BottomNav({ viewMode, setViewMode, todayStr, setSelectedDate, setShowSettings, lang, t }) {
  return (
    <nav className="bottom-nav">
      {/* Today */}
      <button
        className={`bottom-nav-item ${viewMode === 'date' ? 'active' : ''}`}
        onClick={() => { setViewMode('date'); setSelectedDate(todayStr) }}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
          <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
        </svg>
        <span>{t.today}</span>
      </button>

      {/* Lists / Collections */}
      <button
        className={`bottom-nav-item ${viewMode === 'lists' ? 'active' : ''}`}
        onClick={() => setViewMode('lists')}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
          <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/>
        </svg>
        <span>{t.lists}</span>
      </button>

      {/* Progress / Stats */}
      <button
        className={`bottom-nav-item ${viewMode === 'progress' ? 'active' : ''}`}
        onClick={() => setViewMode('progress')}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H7v-2h5v2zm5-4H7v-2h10v2zm0-4H7V7h10v2z"/>
        </svg>
        <span>{t.progress}</span>
      </button>

      {/* Settings */}
      <button className="bottom-nav-item" onClick={() => setShowSettings(true)}>
        <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
          <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
        </svg>
        <span>{lang === 'ko' ? '설정' : lang === 'ja' ? '設定' : lang === 'zh' ? '设置' : 'Settings'}</span>
      </button>
    </nav>
  )
}
