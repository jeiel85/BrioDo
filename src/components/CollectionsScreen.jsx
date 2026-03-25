import { useState, useMemo } from 'react'
import { calcStreak } from '../utils/helpers'

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

export function CollectionsScreen({ todos, t, lang, openEditModal, toggleComplete, todayStr, weeklyPulse, unlockedIds, onShowAllAchievements }) {
  const [expandedTag, setExpandedTag] = useState(null)
  const [incompleteExpanded, setIncompleteExpanded] = useState(false)

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

  const allRate = allTotal > 0 ? allDone / allTotal : 0
  const circum = 2 * Math.PI * 28
  const dashOffset = circum * (1 - allRate)

  const tags = Object.keys(byTag).sort()

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

  const renderCollectionCard = (tag, taskList, accent) => {
    const done = taskList.filter(t => t.completed).length
    const total = taskList.length
    const rate = total > 0 ? done / total : 0
    const isExpanded = expandedTag === tag

    return (
      <div key={tag} className={`collection-card ${accent.cls}`}>
        <div className="collection-card-header" onClick={() => setExpandedTag(isExpanded ? null : tag)}>
          <div className="collection-card-title-row">
            <span className="collection-card-emoji">{accent.emoji}</span>
            <span className="collection-card-name">#{tag}</span>
            <span className="collection-expand-icon">{isExpanded ? '▼' : '▶'}</span>
          </div>
          <div className="collection-card-stats">
            <span className="collection-card-count">
              {done}/{total}
            </span>
          </div>
          <div className="collection-progress-bar">
            <div className="collection-progress-fill" style={{ width: `${rate * 100}%` }} />
          </div>
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
  const incompleteTitle = lang === 'ko' ? '미완료 할일' : lang === 'ja' ? '未完了タスク' : lang === 'zh' ? '未完成任务' : 'Incomplete Tasks'
  const allDoneLabel = lang === 'ko' ? '완료' : lang === 'ja' ? '完了' : lang === 'zh' ? '完成' : 'done'

  return (
    <div className="collections-screen insight-screen">
      {/* ── Stats 요약 섹션 ── */}
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

        {/* 업적 보기 버튼 */}
        {onShowAllAchievements && (
          <button className="achievements-more-btn" style={{ marginBottom: '4px' }} onClick={onShowAllAchievements}>
            {lang === 'ko' ? '🏆 모든 업적 보기' : lang === 'ja' ? '🏆 全実績を見る' : lang === 'zh' ? '🏆 查看所有成就' : '🏆 View All Achievements'}
          </button>
        )}
      </div>

      <div className="insight-divider" />

      {/* Hero Card: 전체 완료율 */}
      <div className="hero-collection-card" style={{ margin: '16px 16px 0' }}>
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

      {/* Tag Collections */}
      {tags.length > 0 && (
        <div className="collections-grid">
          {tags.map(tag => renderCollectionCard(tag, byTag[tag], getAccent(tag)))}
        </div>
      )}

      {/* Uncategorized */}
      {uncategorized.length > 0 && renderCollectionCard(
        t.uncategorized,
        uncategorized,
        { cls: 'coll-gray', emoji: '📋' }
      )}

      {/* ── 미완료 할일 섹션 ── */}
      {incompleteTodos.length > 0 && (
        <div className="incomplete-todos-section">
          <div className="incomplete-todos-header">{incompleteTitle}</div>
          <div className="incomplete-todos-card">
            <div className="incomplete-todos-summary" onClick={() => setIncompleteExpanded(v => !v)}>
              <div className="incomplete-todos-summary-left">
                <span className="incomplete-todos-emoji">⏳</span>
                <div>
                  <div className="incomplete-todos-title">{incompleteTitle}</div>
                  <div className="incomplete-todos-count">
                    {incompleteTodos.length}{lang === 'ko' ? '개' : lang === 'ja' ? '件' : lang === 'zh' ? '项' : ' tasks'}
                  </div>
                </div>
              </div>
              <span className="incomplete-todos-expand">{incompleteExpanded ? '▼' : '▶'}</span>
            </div>
            {incompleteExpanded && (
              <div className="incomplete-todos-list">
                {incompleteTodos.map(todo => (
                  <div key={todo.id} className="incomplete-todo-item" onClick={() => openEditModal(todo)}>
                    <div className="incomplete-todo-dot" />
                    <span className="incomplete-todo-text">{todo.text}</span>
                    {todo.date && <span className="incomplete-todo-date">{todo.date.slice(5)}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {todos.length === 0 && (
        <div className="coll-empty">
          <div className="coll-empty-icon">📭</div>
          <p>{t.doneAll}</p>
        </div>
      )}
    </div>
  )
}
