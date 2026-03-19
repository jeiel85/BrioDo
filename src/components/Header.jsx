export function Header({
  lang, t,
  formattedHeaderDate, handleGoToToday,
  user, handleLogin,
  viewMode, setViewMode, todayStr, setSelectedDate, setBaseDate,
  allUsedTags, selectedTag, setSelectedTag, tagExpanded, setTagExpanded,
  weekScrollRef, handleWeekScroll, dateRange, selectedDate,
  setShowSettings
}) {
  return (
    <div className="header-wrapper">
      <header className="header">
        <div className="header-top">
          <div className="month-year-header clickable" onClick={handleGoToToday}>
            {formattedHeaderDate}
          </div>
          <div className="auth-group">
            {!user && (
              <button className="login-btn" onClick={handleLogin}>
                {lang === 'ko' ? '로그인' : 'Login'}
              </button>
            )}
          </div>
        </div>

        <div className="title-row">
          <h1>BlendDo</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="view-selector">
              <button
                className={viewMode === 'date' ? 'active' : ''}
                onClick={() => { setViewMode('date'); setSelectedDate(todayStr); setBaseDate(new Date()) }}
              >
                {lang === 'ko' ? '날짜별' : 'By Date'}
              </button>
              <button
                className={viewMode === 'all' ? 'active' : ''}
                onClick={() => setViewMode('all')}
              >
                {lang === 'ko' ? '전체' : 'All'}
              </button>
            </div>
            <button className="settings-btn" onClick={() => setShowSettings(true)}>⚙️</button>
          </div>
        </div>

        {viewMode === 'date' && (
          <div className="date-nav-container">
            <div className="date-scroll-wrapper" ref={weekScrollRef} onScroll={handleWeekScroll}>
              {[0, 1, 2, 3, 4].map(weekIdx => (
                <div key={weekIdx} className="date-week-page" id={weekIdx === 2 ? 'current-week-page' : ''}>
                  {dateRange.filter(d => d.weekIndex === weekIdx).map((date) => (
                    <div
                      key={date.full}
                      className={`date-item ${selectedDate === date.full ? 'active' : ''}`}
                      onClick={() => setSelectedDate(date.full)}
                    >
                      <span className="day-name">{date.dayName}</span>
                      <span className="day-number">{date.dayNumber}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="tag-filter-wrapper">
          <div className={`tag-filter-bar ${tagExpanded ? 'expanded' : ''}`}>
            <button className={!selectedTag ? 'active' : ''} onClick={() => setSelectedTag(null)}>
              {t.allTags}
            </button>
            {allUsedTags.map(tag => (
              <button
                key={tag}
                className={selectedTag === tag ? 'active' : ''}
                onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
              >
                #{tag}
              </button>
            ))}
          </div>
          {allUsedTags.length > 3 && (
            <button className="tag-toggle-btn" onClick={() => setTagExpanded(!tagExpanded)}>
              {tagExpanded ? '▲' : '▼'}
            </button>
          )}
        </div>
      </header>
    </div>
  )
}
