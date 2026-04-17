import { useState, useMemo, useRef } from 'react'
import { calcStreak } from '../utils/helpers'

// ─── GrassGrid 컴포넌트 ───
function GrassGrid({ grassData, todayStr, streak, lang }) {
  const tooltipRef = useRef(null)
  const [tooltip, setTooltip] = useState(null) // { date, completed, x, y }

  // grassData를 주 단위로 묶기
  // 오늘이 속한 주의 마지막 날까지 포함되도록 패딩
  const weeks = useMemo(() => {
    if (!grassData || grassData.length === 0) return []
    // 첫 날의 요일(0=일, 1=월, ...) 기준으로 앞에 빈 셀 패딩
    const firstDate = new Date(grassData[0].date + 'T00:00:00')
    // 월요일 기준(0=월, 6=일)
    const firstDow = (firstDate.getDay() + 6) % 7 // Mon=0, Sun=6
    const padded = []
    for (let i = 0; i < firstDow; i++) padded.push(null)
    padded.push(...grassData)
    // 뒤에도 일요일까지 채우기
    while (padded.length % 7 !== 0) padded.push(null)
    const result = []
    for (let w = 0; w < padded.length / 7; w++) {
      result.push(padded.slice(w * 7, w * 7 + 7))
    }
    return result
  }, [grassData])

  // 각 주 첫 날 기준 월 레이블
  const monthLabels = useMemo(() => {
    return weeks.map(week => {
      const firstDay = week.find(d => d !== null)
      if (!firstDay) return ''
      const d = new Date(firstDay.date + 'T00:00:00')
      if (d.getDate() <= 7) {
        return (d.getMonth() + 1) + (lang === 'ko' ? '월' : lang === 'ja' ? '月' : lang === 'zh' ? '月' : '')
      }
      return ''
    })
  }, [weeks, lang])

  const dayLabels = lang === 'ko' ? ['월', '', '수', '', '금', '', '일']
    : lang === 'ja' ? ['月', '', '水', '', '金', '', '日']
    : lang === 'zh' ? ['一', '', '三', '', '五', '', '日']
    : ['M', '', 'W', '', 'F', '', 'S']

  const getCellLevel = (completed) => {
    if (!completed || completed === 0) return 0
    if (completed <= 2) return 1
    if (completed <= 4) return 2
    return 3
  }

  const handleCellTap = (day, e) => {
    if (!day) return
    const rect = e.currentTarget.getBoundingClientRect()
    setTooltip(prev =>
      prev?.date === day.date ? null : { date: day.date, completed: day.completed, x: rect.left, y: rect.top }
    )
  }

  const streakText = streak > 0
    ? (lang === 'ko' ? `🔥 ${streak}일 연속 달성 중`
      : lang === 'ja' ? `🔥 ${streak}日連続達成中`
      : lang === 'zh' ? `🔥 连续${streak}天达成`
      : `🔥 ${streak}-day streak`)
    : (lang === 'ko' ? '오늘부터 연속 달성을 시작해보세요!'
      : lang === 'ja' ? '今日から連続達成を始めましょう！'
      : lang === 'zh' ? '从今天开始连续达成！'
      : 'Start your streak today!')

  return (
    <div className="grass-section" onClick={() => setTooltip(null)}>
      <div className="grass-section-header">
        <span className="grass-streak-badge">{streakText}</span>
      </div>
      <div className="grass-scroll-wrap">
        <div className="grass-grid-container">
          {/* 월 레이블 행 */}
          <div className="grass-month-row">
            {weeks.map((_, wi) => (
              <div key={wi} className="grass-month-label">{monthLabels[wi]}</div>
            ))}
          </div>
          {/* 요일 레이블 + 잔디 셀 */}
          <div className="grass-body">
            <div className="grass-day-labels">
              {dayLabels.map((d, i) => (
                <div key={i} className="grass-day-label">{d}</div>
              ))}
            </div>
            <div className="grass-columns">
              {weeks.map((week, wi) => (
                <div key={wi} className="grass-col">
                  {week.map((day, di) => {
                    if (!day) return <div key={di} className="grass-cell" style={{ opacity: 0 }} />
                    const level = getCellLevel(day.completed)
                    const isToday = day.date === todayStr
                    return (
                      <div
                        key={di}
                        className={`grass-cell level-${level}${isToday ? ' is-today' : ''}`}
                        onClick={e => { e.stopPropagation(); handleCellTap(day, e) }}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* 툴팁 */}
      {tooltip && (
        <div
          ref={tooltipRef}
          style={{
            position: 'fixed',
            top: Math.max(8, tooltip.y - 44),
            left: Math.min(tooltip.x - 20, window.innerWidth - 160),
            background: 'var(--color-surface-container-highest)',
            color: 'var(--color-on-surface)',
            borderRadius: 8,
            padding: '5px 10px',
            fontSize: 12,
            fontWeight: 600,
            zIndex: 9999,
            boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
            pointerEvents: 'none',
          }}
        >
          {tooltip.date} · {tooltip.completed > 0
            ? (lang === 'ko' ? `${tooltip.completed}개 완료` : lang === 'ja' ? `${tooltip.completed}件完了` : lang === 'zh' ? `完成${tooltip.completed}项` : `${tooltip.completed} done`)
            : (lang === 'ko' ? '완료 없음' : lang === 'ja' ? '完了なし' : lang === 'zh' ? '无完成' : 'None')}
        </div>
      )}
      {/* 범례 */}
      <div className="grass-legend">
        <span className="grass-legend-label">{lang === 'ko' ? '적음' : lang === 'ja' ? '少' : lang === 'zh' ? '少' : 'Less'}</span>
        <div className="grass-legend-cells">
          {[0,1,2,3].map(lv => (
            <div key={lv} className={`grass-legend-cell grass-cell level-${lv}`} />
          ))}
        </div>
        <span className="grass-legend-label">{lang === 'ko' ? '많음' : lang === 'ja' ? '多' : lang === 'zh' ? '多' : 'More'}</span>
      </div>
    </div>
  )
}

const ACCENT_COLORS = [
  { cls: 'coll-indigo',  emoji: '💼' },
  { cls: 'coll-emerald', emoji: '🌿' },
  { cls: 'coll-orange',  emoji: '🔥' },
  { cls: 'coll-rose',    emoji: '💡' },
  { cls: 'coll-amber',   emoji: '⭐' },
  { cls: 'coll-cyan',    emoji: '🌊' },
  { cls: 'coll-purple',  emoji: '✨' },
]

function getAccent(tag) {
  let hash = 0
  for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash)
  return ACCENT_COLORS[Math.abs(hash) % ACCENT_COLORS.length]
}

const INCOMPLETE_KEY = '__incomplete__'

export function CollectionsScreen({ todos, t, lang, openEditModal, toggleComplete, todayStr, weeklyPulse, unlockedSortedByDifficulty, onShowAllAchievements }) {
  const [expandedTag, setExpandedTag] = useState(null)
  const [showAllTagsModal, setShowAllTagsModal] = useState(false)
  const [modalExpandedTag, setModalExpandedTag] = useState(null)

  const { allTotal, allDone, byTag, uncategorized } = useMemo(() => {
    const tagMap = {}
    const uncat = []
    todos.forEach(todo => {
      if (!todo.tags || todo.tags.length === 0) {
        uncat.push(todo)
      } else {
        todo.tags.forEach(tag => {
          if (!tagMap[tag]) tagMap[tag] = []
          tagMap[tag].push(todo)
        })
      }
    })
    return {
      allTotal: todos.length,
      allDone: todos.filter(t => t.completed).length,
      byTag: tagMap,
      uncategorized: uncat,
    }
  }, [todos])

  // 미완료 할일 (반복 일정 제외)
  const incompleteTodos = useMemo(() =>
    todos
      .filter(t => !t.completed && (!t.recurrence?.type || t.recurrence.type === 'none'))
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
  , [todos])

  // Stats 요약 계산
  const stats = useMemo(() => {
    const todayDone = todos.filter(t => t.completed && t.date === todayStr).length
    const weekDone = (weeklyPulse || []).reduce((sum, d) => sum + d.completed, 0)
    const streak = calcStreak(todos, todayStr)
    return { todayDone, weekDone, streak }
  }, [todos, todayStr, weeklyPulse])

  // 잔디 데이터: 최근 16주(112일)
  const grassData = useMemo(() => {
    const days = []
    for (let i = 111; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().slice(0, 10)
      const completed = todos.filter(t => t.completed && t.date === dateStr).length
      days.push({ date: dateStr, completed })
    }
    return days
  }, [todos])

  const allRate = allTotal > 0 ? allDone / allTotal : 0
  const circum = 2 * Math.PI * 28
  const dashOffset = circum * (1 - allRate)

  // 태그를 태스크 수 내림차순 정렬
  const tags = Object.keys(byTag).sort((a, b) => byTag[b].length - byTag[a].length)
  const visibleTags = tags.slice(0, 3)
  const hasMoreTags = tags.length > 3

  const renderTodoItem = (todo) => (
    <div key={todo.id} className="coll-task-item" onClick={() => openEditModal(todo)}>
      <div
        className={`coll-task-checkbox ${todo.completed ? 'checked' : ''}`}
        onClick={e => { e.stopPropagation(); toggleComplete(e, todo.id, todo.completed, null) }}
      />
      <div className="coll-task-body">
        <span className={`coll-task-text ${todo.completed ? 'done' : ''}`}>{todo.text}</span>
        {todo.date && <span className="coll-task-date">{todo.date.slice(5)}</span>}
      </div>
    </div>
  )

  // expTagOverride / setExpTagOverride: 모달 내부 별도 expand 상태 지원
  const renderCollectionCard = (tag, taskList, accent, isIncomplete = false, fullWidth = false, expTagOverride, setExpTagOverride) => {
    const done = taskList.filter(t => t.completed).length
    const total = taskList.length
    const rate = total > 0 ? done / total : 0
    const cardKey = isIncomplete ? INCOMPLETE_KEY : tag
    const activeExpTag = expTagOverride !== undefined ? expTagOverride : expandedTag
    const activeSetExpTag = setExpTagOverride || setExpandedTag
    const isExpanded = activeExpTag === cardKey
    const isAlwaysFull = isIncomplete || fullWidth

    return (
      <div key={cardKey} className={`collection-card ${accent.cls}${isExpanded ? ' expanded' : ''}${isAlwaysFull ? ' coll-full' : ''}`}>
        <div className="collection-card-header" onClick={() => activeSetExpTag(isExpanded ? null : cardKey)}>
          <div className="collection-card-title-row">
            <span className="collection-card-emoji">{accent.emoji}</span>
            <span className="collection-card-name">{isIncomplete ? tag : `#${tag}`}</span>
            <span className="collection-expand-icon">{isExpanded ? '▼' : '▶'}</span>
          </div>
          <div className="collection-card-stats" style={isIncomplete ? { marginBottom: 0 } : undefined}>
            <span className="collection-card-count">
              {isIncomplete
                ? `${total}${lang === 'ko' ? '개' : lang === 'ja' ? '件' : lang === 'zh' ? '项' : ' tasks'}`
                : `${done}/${total}`
              }
            </span>
          </div>
          {!isIncomplete && (
            <div className="collection-progress-bar">
              <div className="collection-progress-fill" style={{ width: `${rate * 100}%` }} />
            </div>
          )}
        </div>
        {isExpanded && (
          <div className="coll-task-list">
            {taskList.map(renderTodoItem)}
          </div>
        )}
      </div>
    )
  }

  const todayLabel = lang === 'ko' ? '오늘 완료' : lang === 'ja' ? '今日完了' : lang === 'zh' ? '今日完成' : 'Today Done'
  const weekLabel = lang === 'ko' ? '주간 완료' : lang === 'ja' ? '週間完了' : lang === 'zh' ? '本周完成' : 'This Week'
  const streakLabel = lang === 'ko' ? '연속 달성' : lang === 'ja' ? '連続達成' : lang === 'zh' ? '连续完成' : 'Streak'
  const dayLabel = lang === 'ko' ? '일' : lang === 'ja' ? '日' : lang === 'zh' ? '天' : 'd'
  const incompleteTitle = lang === 'ko' ? '미완료 할일' : lang === 'ja' ? '未完了タスク' : lang === 'zh' ? '未完成任务' : 'Incomplete'
  const allDoneLabel = lang === 'ko' ? '완료' : lang === 'ja' ? '完了' : lang === 'zh' ? '完成' : 'done'
  const allTagsLabel = lang === 'ko' ? '모든 태그 보기' : lang === 'ja' ? 'すべてのタグ' : lang === 'zh' ? '查看全部标签' : 'All Tags'

  const top3Achievements = unlockedSortedByDifficulty?.slice(0, 3) || []

  return (
    <div className="collections-screen insight-screen">

      {/* ── Hero Card: 전체 완료율 (맨 위) ── */}
      <div className="hero-collection-card">
        <div className="hero-coll-text">
          <div className="hero-coll-title">{t.allTasks}</div>
          <div className="hero-coll-sub">
            {allDone}/{allTotal} {allDoneLabel}
          </div>
        </div>
        <div className="hero-coll-ring">
          <svg width="72" height="72" viewBox="0 0 72 72">
            <circle cx="36" cy="36" r="28" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="6"/>
            <circle
              cx="36" cy="36" r="28"
              fill="none"
              stroke="white"
              strokeWidth="6"
              strokeDasharray={circum}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              style={{ transform: 'rotate(-90deg)', transformOrigin: '36px 36px', transition: 'stroke-dashoffset 0.6s ease' }}
            />
          </svg>
          <div className="hero-coll-pct">{Math.round(allRate * 100)}%</div>
        </div>
      </div>

      {/* ── Stats 요약 섹션 ── */}
      <p className="coll-section-label">📊 {t.progress}</p>
      <div className="insight-stats-section">
        <div className="insight-stats-numbers">
          <div className="insight-stat-card">
            <div className="insight-stat-number">{stats.todayDone}</div>
            <div className="insight-stat-label">{todayLabel}</div>
          </div>
          <div className="insight-stat-card">
            <div className="insight-stat-number">{stats.weekDone}</div>
            <div className="insight-stat-label">{weekLabel}</div>
          </div>
          <div className="insight-stat-card">
            <div className="insight-stat-number">{stats.streak}<span style={{ fontSize: '0.55em', fontWeight: 600 }}>{dayLabel}</span></div>
            <div className="insight-stat-label">{streakLabel}</div>
          </div>
        </div>

        {/* 주간 pulse */}
        {weeklyPulse && (
          <div className="stats-pulse-section" style={{ marginBottom: '14px' }}>
            <div className="stats-pulse-bars">
              {weeklyPulse.map((day, i) => {
                const maxVal = Math.max(...weeklyPulse.map(d => d.total), 1)
                const h = Math.max(4, (day.total / maxVal) * 40)
                const isToday = day.date === todayStr
                return (
                  <div key={i} className="stats-pulse-col">
                    <div className="stats-pulse-bar-wrap" style={{ height: 40 }}>
                      <div
                        className={`stats-pulse-bar ${isToday ? 'today' : ''}`}
                        style={{ height: h }}
                      />
                      {day.completed > 0 && day.total > 0 && (
                        <div
                          className="stats-pulse-bar-done"
                          style={{ height: Math.max(2, (day.completed / maxVal) * 40) }}
                        />
                      )}
                    </div>
                    <div className={`stats-pulse-day ${isToday ? 'today' : ''}`}>
                      {new Date(day.date).toLocaleDateString(
                        lang === 'ko' ? 'ko-KR' : lang === 'ja' ? 'ja-JP' : lang === 'zh' ? 'zh-CN' : 'en-US',
                        { weekday: 'narrow' }
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 잔디 심기 */}
        <GrassGrid
          grassData={grassData}
          todayStr={todayStr}
          streak={stats.streak}
          lang={lang}
        />

      </div>

      {/* TOP3 업적 */}
      {top3Achievements.length > 0 && (
        <p className="coll-section-label">🏆 {t.achievements}</p>
      )}
      {top3Achievements.length > 0 && (
        <div className="top-achievements-row">
          {top3Achievements.map((ach, idx) => (
            <div key={ach.id} className={`top-ach-badge rank-${idx + 1}`}>
              <span className="top-ach-icon">{ach.icon}</span>
              <span className="top-ach-name">{ach.name[lang] || ach.name.ko}</span>
            </div>
          ))}
        </div>
      )}

      {/* 업적 보기 버튼 */}
      {onShowAllAchievements && (
        <button className="achievements-more-btn" style={{ marginBottom: '4px' }} onClick={onShowAllAchievements}>
          {lang === 'ko' ? '🏆 모든 업적 보기' : lang === 'ja' ? '🏆 全実績を見る' : lang === 'zh' ? '🏆 查看所有成就' : '🏆 View All Achievements'}
        </button>
      )}

      {/* ── 미완료 할일 ── */}
      {incompleteTodos.length > 0 && (
        <>
          <p className="coll-section-label">⏳ {incompleteTitle}</p>
          <div className="collections-grid">
            {renderCollectionCard(incompleteTitle, incompleteTodos, { cls: 'coll-gray', emoji: '⏳' }, true)}
          </div>
        </>
      )}

      {/* Tag Collections (상위 3개) */}
      {tags.length > 0 && (
        <>
          <p className="coll-section-label">🏷️ {t.lists}</p>
          <div className="collections-grid">
          {visibleTags.map(tag => renderCollectionCard(tag, byTag[tag], getAccent(tag)))}
          {hasMoreTags && (
            <div className="collection-card coll-more" onClick={() => setShowAllTagsModal(true)}>
              <div className="collection-card-header">
                <div className="collection-card-title-row">
                  <span className="collection-card-emoji">🗂️</span>
                  <span className="collection-card-name">{allTagsLabel}</span>
                  <span className="collection-expand-icon">▶</span>
                </div>
                <div className="collection-card-stats">
                  <span className="collection-card-count">+{tags.length - 3}</span>
                </div>
              </div>
            </div>
          )}
          {uncategorized.length > 0 && (
            renderCollectionCard(t.uncategorized, uncategorized, { cls: 'coll-gray', emoji: '📋' }, false, true)
          )}
        </div>
        </>
      )}

      {/* 태그 없을 때 미분류만 있는 경우 */}
      {tags.length === 0 && uncategorized.length > 0 && (
        <>
          <p className="coll-section-label">🏷️ {t.lists}</p>
          <div className="collections-grid">
            {renderCollectionCard(t.uncategorized, uncategorized, { cls: 'coll-gray', emoji: '📋' }, false, true)}
          </div>
        </>
      )}

      {/* Empty state */}
      {todos.length === 0 && (
        <div className="coll-empty">
          <div className="coll-empty-icon">📭</div>
          <p>{t.doneAll}</p>
        </div>
      )}

      {/* ── 모든 태그 보기 모달 (그리드 + 펼치기 UX) ── */}
      {showAllTagsModal && (
        <div className="input-overlay" onClick={() => { setShowAllTagsModal(false); setModalExpandedTag(null) }}>
          <div className="all-tags-modal" onClick={e => e.stopPropagation()}>
            <div className="notif-drag-handle" />
            <div className="settings-header">
              <h2 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800 }}>🗂️ {allTagsLabel}</h2>
              <button className="settings-close" onClick={() => { setShowAllTagsModal(false); setModalExpandedTag(null) }}>✕</button>
            </div>
            <div className="all-tags-list">
              {tags.map(tag => renderCollectionCard(tag, byTag[tag], getAccent(tag), false, false, modalExpandedTag, setModalExpandedTag))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
