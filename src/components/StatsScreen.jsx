import { useMemo } from 'react'
import { calcStreak } from '../utils/helpers'
import { ACHIEVEMENT_DEFS } from '../hooks/useAchievements'

export function StatsScreen({ todos, todayStr, t, lang, weeklyPulse, unlockedIds, onShowAllAchievements }) {
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

  const badges = [...ACHIEVEMENT_DEFS]
    .sort((a, b) => b.difficulty - a.difficulty)
    .slice(0, 3)
    .map(ach => ({
      ...ach,
      isUnlocked: unlockedIds?.has(ach.id) || false,
      label: ach.name?.[lang] || ach.name?.ko || '',
      sub: ach.desc?.[lang] || ach.desc?.ko || '',
    }))

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
      <div className="achievements-section">
        <div className="stats-section-title">{t.achievements}</div>
        {badges.length > 0 && (
          <div className="achievements-grid">
            {badges.map((badge, i) => (
              <div key={i} className={`achievement-badge badge-custom ${!badge.isUnlocked ? 'locked' : ''}`}>
                <div className={`badge-icon ${!badge.isUnlocked ? 'locked-icon' : ''}`}>
                  {badge.isUnlocked ? badge.icon : '🔒'}
                </div>
                <div className="badge-label">{badge.label}</div>
                {badge.isUnlocked && <div className="badge-sub">{badge.sub}</div>}
              </div>
            ))}
          </div>
        )}
        <button className="achievements-more-btn" onClick={onShowAllAchievements}>
          {lang === 'ko' ? '모든 업적 보기' : lang === 'ja' ? '全実績を見る' : lang === 'zh' ? '查看所有成就' : 'View All Achievements'}
        </button>
      </div>

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
