export function BottomNav({ viewMode, setViewMode, todayStr, setSelectedDate, lang, t }) {
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

      {/* All Pending */}
      <button
        className={`bottom-nav-item ${viewMode === 'all' ? 'active' : ''}`}
        onClick={() => setViewMode('all')}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
        <span>{t.pending}</span>
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
    </nav>
  )
}
