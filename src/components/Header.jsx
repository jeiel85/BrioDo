import { useState } from 'react'

export function Header({
  lang, t,
  formattedHeaderDate, handleGoToToday,
  user,
  viewMode, setViewMode, todayStr, setSelectedDate,
  allUsedTags, selectedTag, setSelectedTag, tagExpanded, setTagExpanded,
  selectedDate,
  calendarExpanded, setCalendarExpanded,
  viewMonth, viewMonthLabel,
  currentWeekDates,
  monthGridDates,
  weekdayNames,
  prevMonth, nextMonth, goToMonth,
  setShowSettings,
  searchQuery, setSearchQuery, isSearchOpen, setIsSearchOpen,
  activeTodosCount,
  completedTodosCount,
  weeklyPulse,
  showAllIncomplete, setShowAllIncomplete, allIncompleteTodosCount,
}) {
  const [showMonthPicker, setShowMonthPicker] = useState(false)
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear())

  const locale = lang === 'ko' ? 'ko-KR' : lang === 'ja' ? 'ja-JP' : lang === 'zh' ? 'zh-CN' : 'en-US'

  const getDayClass = (dayOfWeek) => {
    if (dayOfWeek === 0) return 'day-sunday'
    if (dayOfWeek === 6) return 'day-saturday'
    return ''
  }

  const openMonthPicker = () => {
    setPickerYear(viewMonth.getFullYear())
    setShowMonthPicker(true)
  }

  const handlePickerSelect = (year, month) => {
    goToMonth(year, month)
    setShowMonthPicker(false)
  }

  // Momentum orb 계산
  const total = activeTodosCount + completedTodosCount
  const rate = total > 0 ? completedTodosCount / total : 0
  const circum = 2 * Math.PI * 24
  const dashOffset = circum * (1 - rate)
  const pct = Math.round(rate * 100)

  // 인삿말 & 서브타이틀 (viewMode별 분기)
  const firstName = user?.displayName?.split(' ')[0] || ''
  const greeting = viewMode === 'lists'
    ? (lang === 'ko' ? '컬렉션' : lang === 'ja' ? 'コレクション' : lang === 'zh' ? '收藏' : 'Collections')
    : viewMode === 'progress'
      ? (lang === 'ko' ? '나의 통계' : lang === 'ja' ? '私の統計' : lang === 'zh' ? '我的统计' : 'My Stats')
      : (lang === 'ko'
          ? (firstName ? `안녕하세요, ${firstName}님!` : '안녕하세요!')
          : lang === 'ja'
            ? (firstName ? `こんにちは、${firstName}さん！` : 'こんにちは！')
            : lang === 'zh'
              ? (firstName ? `你好，${firstName}！` : '你好！')
              : (firstName ? `Hello, ${firstName}!` : 'Hello!'))

  const taskSubtitle = viewMode === 'lists'
    ? (lang === 'ko' ? `${allUsedTags.length}개 카테고리` : lang === 'ja' ? `${allUsedTags.length}カテゴリ` : lang === 'zh' ? `${allUsedTags.length}个分类` : `${allUsedTags.length} categories`)
    : viewMode === 'progress'
      ? (lang === 'ko' ? `${completedTodosCount + activeTodosCount}개 할 일 추적 중` : lang === 'ja' ? `${completedTodosCount + activeTodosCount}件を追跡中` : lang === 'zh' ? `追踪${completedTodosCount + activeTodosCount}件任务` : `Tracking ${completedTodosCount + activeTodosCount} tasks`)
      : activeTodosCount === 0 && completedTodosCount === 0
        ? (lang === 'ko' ? '할 일이 없어요 🎉' : lang === 'ja' ? 'タスクがありません 🎉' : lang === 'zh' ? '没有任务 🎉' : 'Nothing to do 🎉')
        : lang === 'ko'
          ? `${activeTodosCount}개 남은 할 일`
          : lang === 'ja'
            ? `残り ${activeTodosCount} 件`
            : lang === 'zh'
              ? `还有 ${activeTodosCount} 件任务`
              : `${activeTodosCount} task${activeTodosCount !== 1 ? 's' : ''} remaining`

  // week strip 활동량 조회용 맵 (O(1) 접근)
  const pulseByDate = weeklyPulse
    ? Object.fromEntries(weeklyPulse.map(d => [d.date, d]))
    : {}
  const pulseMax = currentWeekDates
    ? Math.max(...currentWeekDates.map(d => pulseByDate[d.full]?.total || 0), 1)
    : 1

  return (
    <div className="header-wrapper">
      <header className="header">

        {/* ─── Top Bar: 앱 브랜드 + 액션 버튼 ─── */}
        <div className="curator-top-bar">
          <div className="curator-brand">
            {user?.photoURL ? (
              <img className="curator-avatar" src={user.photoURL} alt="" referrerPolicy="no-referrer" />
            ) : (
              <div className="curator-avatar curator-avatar-default">
                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                </svg>
              </div>
            )}
            <span className="curator-app-name">BlendDo</span>
          </div>
          <div className="curator-top-actions">
            <button
              className={`curator-icon-btn ${isSearchOpen ? 'active' : ''}`}
              onClick={() => { const next = !isSearchOpen; setIsSearchOpen(next); if (!next) setSearchQuery('') }}
              aria-label={t.search}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* ─── Greeting + Momentum Orb ─── */}
        <div className="curator-greeting">
          <div className="greeting-text">
            <div className="greeting-date" onClick={handleGoToToday}>{formattedHeaderDate}</div>
            <h1 className="greeting-title">{greeting}</h1>
            <p className="greeting-subtitle">{taskSubtitle}</p>
          </div>
          <div className="momentum-orb" title={`${pct}% ${lang === 'ko' ? '완료' : 'complete'}`}>
            <svg width="64" height="64" viewBox="0 0 64 64">
              <circle
                cx="32" cy="32" r="24"
                fill="none"
                stroke="var(--color-surface-container-high)"
                strokeWidth="5"
              />
              <circle
                cx="32" cy="32" r="24"
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="5"
                strokeDasharray={circum}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                style={{
                  transform: 'rotate(-90deg)',
                  transformOrigin: '32px 32px',
                  transition: 'stroke-dashoffset 0.6s ease'
                }}
              />
            </svg>
            <div className="momentum-text">
              <div className="momentum-pct">{pct}%</div>
              <div className="momentum-label">{lang === 'ko' ? '완료' : lang === 'ja' ? '完了' : lang === 'zh' ? '完成' : 'Done'}</div>
            </div>
          </div>
        </div>

        {/* ─── Search Bar ─── */}
        {isSearchOpen && (
          <div className="search-bar-row">
            <input
              className="search-input"
              autoFocus
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="search-clear-btn" onClick={() => setSearchQuery('')}>✕</button>
            )}
          </div>
        )}

        {/* ─── Date Navigation ─── */}
        {viewMode === 'date' && (
          <div className="date-nav-container">
            {!calendarExpanded ? (
              <div className="week-strip">
                <div className="week-strip-dates">
                  {currentWeekDates.map((date) => {
                    const act = pulseByDate[date.full] || { total: 0, completed: 0 }
                    const barH = act.total > 0 ? Math.max(3, Math.round((act.total / pulseMax) * 14)) : 2
                    const doneRatio = act.total > 0 ? Math.round((act.completed / act.total) * 100) : 0
                    return (
                      <div
                        key={date.full}
                        className={`date-item ${selectedDate === date.full ? 'active' : ''} ${getDayClass(date.dayOfWeek)}`}
                        onClick={() => { setSelectedDate(date.full); setShowAllIncomplete(false) }}
                      >
                        <div className="date-activity-bar">
                          <div
                            className="date-activity-fill"
                            style={{ height: barH, background: act.total > 0
                              ? `linear-gradient(to top, var(--color-primary) ${doneRatio}%, var(--color-surface-container-high) ${doneRatio}%)`
                              : 'var(--color-surface-container-high)'
                            }}
                          />
                        </div>
                        <span className="day-name">{date.dayName}</span>
                        <span className="day-number">{date.dayNumber}</span>
                      </div>
                    )
                  })}
                </div>
                <button className="calendar-expand-btn" onClick={() => setCalendarExpanded(true)} aria-label="월간 달력 펼치기">▼</button>
              </div>
            ) : (
              <div className="month-calendar">
                <div className="month-nav-header">
                  <div className="month-nav-inner">
                    <button className="month-nav-btn" onClick={prevMonth}>‹</button>
                    <span className="month-nav-label" onClick={openMonthPicker}>{viewMonthLabel}</span>
                    <button className="month-nav-btn" onClick={nextMonth}>›</button>
                  </div>
                  <button className="calendar-expand-btn" onClick={() => setCalendarExpanded(false)} aria-label="달력 접기">▲</button>
                </div>

                <div className="month-weekday-header">
                  {weekdayNames.map((name, i) => (
                    <span key={i} className={`month-weekday-name ${i === 0 ? 'day-sunday' : i === 6 ? 'day-saturday' : ''}`}>{name}</span>
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

                {showMonthPicker && (
                  <div className="month-picker-overlay" onClick={() => setShowMonthPicker(false)}>
                    <div className="month-picker" onClick={e => e.stopPropagation()}>
                      <div className="month-picker-year-nav">
                        <button onClick={() => setPickerYear(y => y - 1)}>‹</button>
                        <span>{pickerYear}</span>
                        <button onClick={() => setPickerYear(y => y + 1)}>›</button>
                      </div>
                      <div className="month-picker-grid">
                        {Array.from({ length: 12 }, (_, i) => (
                          <button
                            key={i}
                            className={viewMonth.getFullYear() === pickerYear && viewMonth.getMonth() === i ? 'active' : ''}
                            onClick={() => handlePickerSelect(pickerYear, i)}
                          >
                            {new Date(pickerYear, i, 1).toLocaleDateString(locale, { month: 'short' })}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ─── 오늘 / 전체 미완료 토글 (date 뷰 전용) ─── */}
        {viewMode === 'date' && (
          <div className="incomplete-toggle">
            <button
              className={!showAllIncomplete ? 'active' : ''}
              onClick={() => setShowAllIncomplete(false)}
            >
              {lang === 'ko' ? '오늘' : lang === 'ja' ? '今日' : lang === 'zh' ? '今天' : 'Today'}
            </button>
            <button
              className={showAllIncomplete ? 'active' : ''}
              onClick={() => setShowAllIncomplete(true)}
            >
              {lang === 'ko' ? '전체 미완료' : lang === 'ja' ? '未完了' : lang === 'zh' ? '未完成' : 'All Pending'}
              {allIncompleteTodosCount > 0 && (
                <span className="incomplete-badge">{allIncompleteTodosCount}</span>
              )}
            </button>
          </div>
        )}

        {/* ─── Tag Filter (date 뷰 전용) ─── */}
        {viewMode === 'date' && <div className="tag-filter-wrapper">
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
        </div>}

      </header>
    </div>
  )
}
