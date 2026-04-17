import { useState, useRef } from 'react'

export function Header({
  lang, t,
  formattedHeaderDate, handleGoToToday,
  user,
  viewMode, todayStr, setSelectedDate,
  allUsedTags, selectedTag, setSelectedTag, tagExpanded, setTagExpanded,
  selectedDate,
  calendarExpanded, setCalendarExpanded,
  prevWeek, nextWeek,
  viewMonth, viewMonthLabel,
  currentWeekDates,
  monthGridDates,
  weekdayNames,
  prevMonth, nextMonth, goToMonth,
  searchQuery, setSearchQuery, isSearchOpen, setIsSearchOpen,
  activeTodosCount,
  completedTodosCount,
  weeklyPulse,
  allIncompleteTodosCount,
  notificationCount,
  onNotificationTap,
  weatherData,
  isCollapsed,
  allViewPeriod,
  setAllViewPeriodPersisted,
  allTodosTotal,
  allTodosCompleted,
}) {
  const [showMonthPicker, setShowMonthPicker] = useState(false)
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear())

  const locale = lang === 'ko' ? 'ko-KR' : lang === 'ja' ? 'ja-JP' : lang === 'zh' ? 'zh-CN' : 'en-US'

  const getDayClass = (dayOfWeek) => {
    if (dayOfWeek === 0) return 'day-sunday'
    if (dayOfWeek === 6) return 'day-saturday'
    return ''
  }

  // 주간보기 슬라이드 애니메이션
  const [slideDir, setSlideDir] = useState(null)
  const handlePrevWeek = () => { setSlideDir('prev'); prevWeek?.() }
  const handleNextWeek = () => { setSlideDir('next'); nextWeek?.() }

  // 주간보기 스와이프 처리
  const weekSwipeStartX = useRef(null)
  const weekSwipeHandlers = {
    onTouchStart: (e) => { weekSwipeStartX.current = e.touches[0].clientX },
    onTouchEnd: (e) => {
      if (weekSwipeStartX.current === null) return
      const dx = e.changedTouches[0].clientX - weekSwipeStartX.current
      weekSwipeStartX.current = null
      if (Math.abs(dx) < 40) return
      if (dx < 0) handleNextWeek()
      else handlePrevWeek()
    }
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
  const circum = 2 * Math.PI * 32
  const dashOffset = circum * (1 - rate)
  const pct = Math.round(rate * 100)

  // 전체 완료율 (컬렉션/통계 탭 인디케이터용)
  const globalPct = allTodosTotal > 0 ? Math.round(allTodosCompleted / allTodosTotal * 100) : 0

  // 인삿말 & 서브타이틀 (viewMode별 분기)
  const firstName = user?.displayName?.split(' ')[0] || ''
  const greeting = viewMode === 'lists'
    ? (lang === 'ko' ? '컬렉션' : lang === 'ja' ? 'コレクション' : lang === 'zh' ? '收藏' : 'Collections')
    : viewMode === 'progress'
      ? (lang === 'ko' ? '나의 통계' : lang === 'ja' ? '私の統計' : lang === 'zh' ? '我的统计' : 'My Stats')
      : viewMode === 'all'
        ? (lang === 'ko' ? '인박스' : lang === 'ja' ? 'インボックス' : lang === 'zh' ? '收件箱' : 'Inbox')
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
      : viewMode === 'all'
        ? (lang === 'ko' ? `${allIncompleteTodosCount}개 남은 할 일` : lang === 'ja' ? `残り ${allIncompleteTodosCount} 件` : lang === 'zh' ? `还有 ${allIncompleteTodosCount} 件任务` : `${allIncompleteTodosCount} task${allIncompleteTodosCount !== 1 ? 's' : ''} remaining`)
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

  // compact bar 제목 (탭별)
  const compactTitle = viewMode === 'date'
    ? formattedHeaderDate
    : viewMode === 'all'
      ? (lang === 'ko' ? '인박스' : lang === 'ja' ? 'インボックス' : lang === 'zh' ? '收件箱' : 'Inbox')
      : viewMode === 'lists'
        ? (lang === 'ko' ? '컬렉션' : lang === 'ja' ? 'コレクション' : lang === 'zh' ? '收藏' : 'Collections')
        : (lang === 'ko' ? '통계' : lang === 'ja' ? '統計' : lang === 'zh' ? '统计' : 'Stats')

  return (
    <div className={`header-wrapper${isCollapsed ? ' header-collapsed' : ''}`}>
      <header className="header">

        {/* ─── Compact Bar: 스크롤 시 나타나는 슬림 바 ─── */}
        <div className="header-compact-bar">
          <div className="header-compact-top-row">
            <div className="header-compact-left">
              <span
                className={viewMode === 'date' ? 'header-compact-date' : 'header-compact-title'}
                onClick={viewMode === 'date' ? handleGoToToday : undefined}
              >{compactTitle}</span>
            </div>
            {/* 탭별 정체성 인디케이터 */}
            <div className="compact-tab-indicator">
              {viewMode === 'date' && (
                <span className="compact-indicator-pct">{pct}%</span>
              )}
              {viewMode === 'all' && allIncompleteTodosCount > 0 && (
                <span className="compact-indicator-badge">{allIncompleteTodosCount}</span>
              )}
              {viewMode === 'lists' && allTodosTotal > 0 && (
                <div className="compact-indicator-bar-wrap" title={`${globalPct}%`}>
                  <div className="compact-indicator-bar-fill" style={{ width: `${globalPct}%` }} />
                </div>
              )}
              {viewMode === 'progress' && allTodosTotal > 0 && (
                <span className="compact-indicator-pct">{globalPct}%</span>
              )}
            </div>
          </div>

          {/* 인박스: 기간 필터 */}
          {viewMode === 'all' && allViewPeriod != null && (
            <div className="compact-period-filter">
              {(['all', 'week', 'month', 'quarter', 'half', 'year']).map(p => (
                <button
                  key={p}
                  className={`period-filter-btn${allViewPeriod === p ? ' active' : ''}`}
                  onClick={() => setAllViewPeriodPersisted(p)}
                >
                  {p === 'all' ? (lang === 'ko' ? '전체' : lang === 'ja' ? 'すべて' : lang === 'zh' ? '全部' : 'All')
                  : p === 'week' ? (lang === 'ko' ? '1주' : lang === 'ja' ? '1週' : lang === 'zh' ? '1周' : '1W')
                  : p === 'month' ? (lang === 'ko' ? '1달' : lang === 'ja' ? '1ヶ月' : lang === 'zh' ? '1月' : '1M')
                  : p === 'quarter' ? (lang === 'ko' ? '분기' : lang === 'ja' ? '四半期' : lang === 'zh' ? '季度' : '3M')
                  : p === 'half' ? (lang === 'ko' ? '반기' : lang === 'ja' ? '半年' : lang === 'zh' ? '半年' : '6M')
                  : (lang === 'ko' ? '1년' : lang === 'ja' ? '1年' : lang === 'zh' ? '1年' : '1Y')}
                </button>
              ))}
            </div>
          )}

          {/* 오늘/인박스 탭: 태그 필터 (compact 전용) */}
          {(viewMode === 'all' || viewMode === 'date') && allUsedTags.length > 0 && (
            <div className="tag-filter-bar compact-tag-filter">
              <button className={!selectedTag ? 'active' : ''} onClick={() => setSelectedTag(null)}>
                {t.allTags}
              </button>
              {allUsedTags.map(tag => (
                <button
                  key={tag}
                  className={selectedTag === tag ? 'active' : ''}
                  onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                >#{tag}</button>
              ))}
            </div>
          )}
        </div>

        {/* ─── Collapsible: 브랜드 바 + 인사말/오브 (스크롤 시 접힘) ─── */}
        <div className="header-collapsible">
          {/* 상단 바: 아바타 + 앱이름 (좌) | 검색 + 알림 (우) */}
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
              <span className="curator-app-name">BrioDo</span>
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
              <div className="notification-btn-wrap">
                <button
                  className={`curator-icon-btn ${notificationCount > 0 ? 'has-notification' : ''}`}
                  onClick={onNotificationTap}
                  aria-label={lang === 'ko' ? '알림' : 'Notifications'}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                    <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z"/>
                  </svg>
                </button>
                {notificationCount > 0 && <span className="notification-badge">{notificationCount}</span>}
              </div>
            </div>
          </div>

          {/* 인사말 + 오브 */}
          <div className="curator-greeting">
            <div className="greeting-text">
              {/* 날짜 */}
              <div className="greeting-date-row">
                <span className="greeting-date" onClick={handleGoToToday}>{formattedHeaderDate}</span>
              </div>
              <h1 className="greeting-title">{greeting}</h1>
              <p className="greeting-subtitle">{taskSubtitle}</p>
              {weatherData && (
                <div className="greeting-weather-row">
                  <span className="greeting-weather-icon">{weatherData.icon}</span>
                  <span className="greeting-weather-temp">{weatherData.tempC}°</span>
                  <span className="greeting-weather-range">{weatherData.lowC}° / {weatherData.highC}°</span>
                </div>
              )}
            </div>
            <div className="momentum-orb" title={`${pct}% ${lang === 'ko' ? '완료' : 'complete'}`}>
              <svg width="80" height="80" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="32" fill="none" stroke="var(--color-surface-container-high)" strokeWidth="5" />
                <circle
                  cx="40" cy="40" r="32"
                  fill="none"
                  stroke="var(--color-primary)"
                  strokeWidth="5"
                  strokeDasharray={circum}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                  style={{ transform: 'rotate(-90deg)', transformOrigin: '40px 40px', transition: 'stroke-dashoffset 0.6s ease' }}
                />
              </svg>
              <div className="momentum-text">
                <div className="momentum-pct">{pct}%</div>
                <div className="momentum-label">{lang === 'ko' ? '완료' : lang === 'ja' ? '完了' : lang === 'zh' ? '完成' : 'Done'}</div>
              </div>
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
              <div className="week-strip" {...weekSwipeHandlers}>
                <div
                  className={`week-strip-dates${slideDir === 'prev' ? ' slide-from-left' : slideDir === 'next' ? ' slide-from-right' : ''}`}
                  onAnimationEnd={() => setSlideDir(null)}
                >
                  {currentWeekDates.map((date) => {
                    const act = pulseByDate[date.full] || { total: 0, completed: 0 }
                    const barH = act.total > 0 ? Math.max(3, Math.round((act.total / pulseMax) * 14)) : 2
                    const doneRatio = act.total > 0 ? Math.round((act.completed / act.total) * 100) : 0
                    return (
                      <div
                        key={date.full}
                        className={`date-item ${selectedDate === date.full ? 'active' : ''} ${getDayClass(date.dayOfWeek)}`}
                        onClick={() => { setSelectedDate(date.full) }}
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

        {/* ─── Tag Filter (date/all 뷰, 확장 상태) — 접힌 상태에서는 CSS로 숨김 ─── */}
        {(viewMode === 'date' || viewMode === 'all') && <div className="tag-filter-wrapper">
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
