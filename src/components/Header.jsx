export function Header({
  lang, t,
  formattedHeaderDate, handleGoToToday,
  user,
  viewMode, setViewMode, todayStr, setSelectedDate,
  allUsedTags, selectedTag, setSelectedTag, tagExpanded, setTagExpanded,
  selectedDate,
  calendarExpanded, setCalendarExpanded,
  viewMonthLabel,
  currentWeekDates,
  monthGridDates,
  weekdayNames,
  prevMonth, nextMonth,
  setShowSettings
}) {
  const getDayClass = (dayOfWeek) => {
    if (dayOfWeek === 0) return 'day-sunday'
    if (dayOfWeek === 6) return 'day-saturday'
    return ''
  }

  return (
    <div className="header-wrapper">
      <header className="header">
        <div className="header-top">
          <div className="month-year-header clickable" onClick={handleGoToToday}>
            {formattedHeaderDate}
          </div>
          <div className="auth-group"></div>
        </div>

        <div className="title-row">
          <h1 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800 }}>BlendDo</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="view-selector">
              <button
                className={viewMode === 'date' ? 'active' : ''}
                onClick={() => { setViewMode('date'); setSelectedDate(todayStr) }}
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
            {!calendarExpanded ? (
              /* 주간 뷰: 현재 주 7일 */
              <div className="week-strip">
                <div className="week-strip-dates">
                  {currentWeekDates.map((date) => (
                    <div
                      key={date.full}
                      className={`date-item ${selectedDate === date.full ? 'active' : ''} ${getDayClass(date.dayOfWeek)}`}
                      onClick={() => setSelectedDate(date.full)}
                    >
                      <span className="day-name">{date.dayName}</span>
                      <span className="day-number">{date.dayNumber}</span>
                    </div>
                  ))}
                </div>
                <button
                  className="calendar-expand-btn"
                  onClick={() => setCalendarExpanded(true)}
                  aria-label="월간 달력 펼치기"
                >▼</button>
              </div>
            ) : (
              /* 월간 뷰 */
              <div className="month-calendar">
                <div className="month-nav-header">
                  <button className="month-nav-btn" onClick={prevMonth}>‹</button>
                  <span className="month-nav-label">{viewMonthLabel}</span>
                  <button className="month-nav-btn" onClick={nextMonth}>›</button>
                  <button
                    className="calendar-expand-btn"
                    onClick={() => setCalendarExpanded(false)}
                    aria-label="달력 접기"
                  >▲</button>
                </div>

                <div className="month-weekday-header">
                  {weekdayNames.map((name, i) => (
                    <span
                      key={i}
                      className={`month-weekday-name ${i === 0 ? 'day-sunday' : i === 6 ? 'day-saturday' : ''}`}
                    >{name}</span>
                  ))}
                </div>

                <div className="month-grid">
                  {monthGridDates.map((date, idx) => (
                    date ? (
                      <div
                        key={date.full}
                        className={`month-grid-cell ${selectedDate === date.full ? 'active' : ''} ${date.full === todayStr ? 'today' : ''} ${getDayClass(date.dayOfWeek)}`}
                        onClick={() => setSelectedDate(date.full)}
                      >
                        <span className="month-day-number">{date.dayNumber}</span>
                      </div>
                    ) : (
                      <div key={`empty-${idx}`} className="month-grid-cell empty" />
                    )
                  ))}
                </div>
              </div>
            )}
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
