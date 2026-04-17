import { useMemo } from 'react'
import { calcStreak, calcContributionGraph, getContributionMonths } from '../utils/helpers'
import { ACHIEVEMENT_DEFS } from '../hooks/useAchievements'

// Contribution Graph Level colors (GitHub-style)
const LEVEL_COLORS = {
  0: 'var(--color-surface-container-high)',
  1: '#9be9a8',
  2: '#40c463',
  3: '#30a14e',
  4: '#216e39'
}

function ContributionGraph({ todos, todayStr, lang }) {
  const { grid, stats } = useMemo(() =>
    calcContributionGraph(todos, 20), // Show 20 weeks
  [todos])

  const months = useMemo(() => getContributionMonths(20, todayStr), [todayStr])

  const streak = useMemo(() => calcStreak(todos, todayStr), [todos, todayStr])

  const levelLabels = lang === 'ko' ? ['없음', '낮음', '보통', '높음', '최고'] :
    lang === 'ja' ? ['なし', '低', '中', '高', '最高'] :
    lang === 'zh' ? ['无', '低', '中', '高', '最高'] :
    ['None', 'Low', 'Medium', 'High', 'Max']

  return (
    <div className="contribution-graph-section">
      <div className="stats-section-header">
        <div className="stats-section-title">{lang === 'ko' ? '잔디 심기' : lang === 'ja' ? '芝生グラフ' : lang === 'zh' ? '种草日历' : 'Contribution Graph'}</div>
        <div className="streak-badge">
          🔥 {streak > 0 ? `${streak}${lang === 'ko' ? '일 연속' : lang === 'ja' ? '日連続' : lang === 'zh' ? '天连续' : ' day streak'}` : '-'}
        </div>
      </div>

      {/* Contribution stats summary */}
      <div className="contribution-stats">
        <span>{stats.totalCompleted} {lang === 'ko' ? '완료' : lang === 'ja' ? '完了' : lang === 'zh' ? '完成' : 'completed'}</span>
        <span>·</span>
        <span>{stats.activeDays} {lang === 'ko' ? '활동일' : lang === 'ja' ? '活動日' : lang === 'zh' ? '活动日' : 'active days'}</span>
        <span>·</span>
        <span>Ø {stats.avgPerActiveDay}/{lang === 'ko' ? '일' : lang === 'ja' ? '日' : lang === 'zh' ? '天' : 'day'}</span>
      </div>

      {/* Graph */}
      <div className="contribution-graph-wrapper">
        {/* Month labels */}
        <div className="contribution-months">
          {months.map((m, i) => (
            <div key={i} className="contribution-month-label" style={{ left: `${m.weekIndex * 14}px` }}>
              {m.month}
            </div>
          ))}
        </div>

        <div className="contribution-graph-content">
          {/* Day labels */}
          <div className="contribution-days">
            <span></span>
            <span>Mon</span>
            <span></span>
            <span>Wed</span>
            <span></span>
            <span>Fri</span>
            <span></span>
          </div>

          {/* Grid */}
          <div className="contribution-grid">
            {grid.map((weekData, weekIndex) => (
              <div key={weekIndex} className="contribution-week">
                {weekData.week.map((day, dayIndex) => (
                  <div
                    key={dayIndex}
                    className={`contribution-cell ${day.isFuture ? 'future' : ''} ${day.isToday ? 'today' : ''}`}
                    style={{ backgroundColor: LEVEL_COLORS[day.level] }}
                    title={`${day.date}: ${day.count} ${lang === 'ko' ? '완료' : lang === 'ja' ? '完了' : lang === 'zh' ? '完成' : 'completed'}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="contribution-legend">
        <span>{lang === 'ko' ? '적음' : lang === 'ja' ? '少ない' : lang === 'zh' ? '少' : 'Less'}</span>
        {[0, 1, 2, 3, 4].map(level => (
          <div
            key={level}
            className="contribution-legend-cell"
            style={{ backgroundColor: LEVEL_COLORS[level] }}
          />
        ))}
        <span>{lang === 'ko' ? '많음' : lang === 'ja' ? '多い' : lang === 'zh' ? '多' : 'More'}</span>
      </div>
    </div>
  )
}

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

      {/* Contribution Graph (GitHub-style) */}
      <ContributionGraph todos={todos} todayStr={todayStr} lang={lang} />

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
