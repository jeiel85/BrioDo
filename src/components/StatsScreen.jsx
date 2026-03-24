import { useMemo } from 'react'

function calcStreak(todos, todayStr) {
  let streak = 0
  const d = new Date(todayStr)
  for (let i = 0; i < 365; i++) {
    const dateStr = d.toISOString().slice(0, 10)
    const hasDone = todos.some(t => t.completed && t.date === dateStr)
    if (!hasDone && i > 0) break
    if (hasDone) streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}

export function StatsScreen({ todos, todayStr, t, lang, weeklyPulse }) {
  const stats = useMemo(() => {
    const todayDone = todos.filter(t => t.completed && t.date === todayStr).length
    const weekDone = (weeklyPulse || []).reduce((sum, d) => sum + d.completed, 0)
    const allDone = todos.filter(t => t.completed).length
    const allTotal = todos.length
    const streak = calcStreak(todos, todayStr)
    const todayActive = todos.filter(t => !t.completed && t.date === todayStr).length
    const recentDone = [...todos]
      .filter(t => t.completed)
      .sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0))
      .slice(0, 8)
    return { todayDone, weekDone, allDone, allTotal, streak, todayActive, recentDone }
  }, [todos, todayStr, weeklyPulse])

  const rate = stats.allTotal > 0 ? stats.allDone / stats.allTotal : 0
  const circum = 2 * Math.PI * 48
  const dashOffset = circum * (1 - rate)

  const badges = [
    stats.streak >= 3 && {
      icon: '🔥',
      label: `${stats.streak}${t.streakLabel}`,
      sub: lang === 'ko' ? '연속 달성!' : lang === 'ja' ? '連続達成！' : lang === 'zh' ? '连续完成！' : 'On a roll!',
      cls: 'badge-fire'
    },
    stats.todayActive === 0 && stats.allTotal > 0 && {
      icon: '📥',
      label: t.inboxZero,
      sub: lang === 'ko' ? '오늘 할 일 모두 완료!' : lang === 'ja' ? '今日のタスク完了！' : lang === 'zh' ? '今日任务全完成！' : 'All clear today!',
      cls: 'badge-inbox'
    },
    stats.allDone >= 10 && {
      icon: '⚡',
      label: t.focusBadge,
      sub: lang === 'ko' ? `${stats.allDone}개 달성` : lang === 'ja' ? `${stats.allDone}件達成` : lang === 'zh' ? `已完成${stats.allDone}件` : `${stats.allDone} done`,
      cls: 'badge-focus'
    },
  ].filter(Boolean)

  return (
    <div className="stats-screen">
      {/* Top stats row */}
      <div className="stats-numbers-row">
        <div className="stat-number-card">
          <div className="stat-number">{stats.todayDone}</div>
          <div className="stat-label">{t.todayDone}</div>
        </div>
        <div className="stat-number-card">
          <div className="stat-number">{stats.weekDone}</div>
          <div className="stat-label">{t.weekDone}</div>
        </div>
        <div className="stat-number-card">
          <div className="stat-number">{stats.allDone}</div>
          <div className="stat-label">{t.allDone}</div>
        </div>
      </div>

      {/* Completion Ring */}
      <div className="stats-ring-section">
        <div className="stats-ring-wrapper">
          <svg width="130" height="130" viewBox="0 0 130 130">
            <circle cx="65" cy="65" r="48" fill="none" stroke="var(--color-surface-container-high)" strokeWidth="8"/>
            <circle
              cx="65" cy="65" r="48"
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth="8"
              strokeDasharray={circum}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              style={{ transform: 'rotate(-90deg)', transformOrigin: '65px 65px', transition: 'stroke-dashoffset 0.8s ease' }}
            />
          </svg>
          <div className="stats-ring-inner">
            <div className="stats-ring-pct">{Math.round(rate * 100)}%</div>
            <div className="stats-ring-label">{t.completionRate}</div>
          </div>
        </div>
        <div className="stats-ring-caption">
          {stats.allDone}/{stats.allTotal} {lang === 'ko' ? '전체 완료' : lang === 'ja' ? '全タスク完了' : lang === 'zh' ? '全部完成' : 'total done'}
        </div>
      </div>

      {/* Weekly Pulse mini */}
      {weeklyPulse && (
        <div className="stats-pulse-section">
          <div className="stats-section-title">{t.weeklyActivity}</div>
          <div className="stats-pulse-bars">
            {weeklyPulse.map((day, i) => {
              const maxVal = Math.max(...weeklyPulse.map(d => d.total), 1)
              const h = Math.max(4, (day.total / maxVal) * 48)
              const isToday = day.date === todayStr
              return (
                <div key={i} className="stats-pulse-col">
                  <div className="stats-pulse-bar-wrap" style={{ height: 48 }}>
                    <div
                      className={`stats-pulse-bar ${isToday ? 'today' : ''}`}
                      style={{ height: h }}
                    />
                    {day.completed > 0 && day.total > 0 && (
                      <div
                        className="stats-pulse-bar-done"
                        style={{ height: Math.max(2, (day.completed / maxVal) * 48) }}
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

      {/* Achievements */}
      {badges.length > 0 && (
        <div className="achievements-section">
          <div className="stats-section-title">{t.achievements}</div>
          <div className="achievements-grid">
            {badges.map((badge, i) => (
              <div key={i} className={`achievement-badge ${badge.cls}`}>
                <div className="badge-icon">{badge.icon}</div>
                <div className="badge-label">{badge.label}</div>
                <div className="badge-sub">{badge.sub}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent completions */}
      <div className="recent-done-section">
        <div className="stats-section-title">{t.recentDone}</div>
        {stats.recentDone.length === 0 ? (
          <p className="stats-empty-msg">{t.noRecentDone}</p>
        ) : (
          <div className="recent-done-list">
            {stats.recentDone.map(todo => (
              <div key={todo.id} className="recent-done-item">
                <span className="recent-done-check">✓</span>
                <div className="recent-done-body">
                  <span className="recent-done-text">{todo.text}</span>
                  {todo.date && <span className="recent-done-date">{todo.date.slice(5)}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
