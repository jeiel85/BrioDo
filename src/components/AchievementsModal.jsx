import { useState } from 'react'
import { ACHIEVEMENT_DEFS } from '../hooks/useAchievements'

const CATEGORY_LABELS = {
  streak: { ko: '연속 달성', en: 'Streak', ja: '連続達成', zh: '连续达成' },
  completion: { ko: '완료 횟수', en: 'Completions', ja: '完了数', zh: '完成数' },
  daily: { ko: '일일 목표', en: 'Daily Goals', ja: '日次目標', zh: '每日目标' },
  weekly: { ko: '주간 리듬', en: 'Weekly', ja: '週次', zh: '每周' },
  recurrence: { ko: '반복 일정', en: 'Recurrence', ja: '繰り返し', zh: '重复任务' },
  tag: { ko: '태그', en: 'Tags', ja: 'タグ', zh: '标签' },
  subtask: { ko: '하위 태스크', en: 'Subtasks', ja: 'サブタスク', zh: '子任务' },
  priority: { ko: '우선순위', en: 'Priority', ja: '優先度', zh: '优先级' },
  ai: { ko: 'AI & 음성', en: 'AI & Voice', ja: 'AI & 音声', zh: 'AI & 语音' },
  calendar: { ko: '캘린더', en: 'Calendar', ja: 'カレンダー', zh: '日历' },
  notes: { ko: '상세 기록', en: 'Notes', ja: 'メモ', zh: '记录' },
  special: { ko: '특별 날짜', en: 'Special Days', ja: '特別な日', zh: '特殊日期' },
  engagement: { ko: '앱 참여', en: 'Engagement', ja: '参加', zh: '参与' },
}

export function AchievementsModal({ onClose, unlockedIds, lang }) {
  const [expandedId, setExpandedId] = useState(null)
  const [filter, setFilter] = useState('all') // 'all' | 'unlocked' | 'locked'

  const categories = [...new Set(ACHIEVEMENT_DEFS.map(a => a.category))]
  const unlockedCount = unlockedIds.size

  const filtered = ACHIEVEMENT_DEFS.filter(a => {
    if (filter === 'unlocked') return unlockedIds.has(a.id)
    if (filter === 'locked') return !unlockedIds.has(a.id)
    return true
  })

  const groupedByCategory = categories.map(cat => ({
    cat,
    items: filtered.filter(a => a.category === cat),
  })).filter(g => g.items.length > 0)

  const toggle = (id) => setExpandedId(prev => prev === id ? null : id)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="achievements-modal" onClick={e => e.stopPropagation()}>
        <div className="achievements-modal-header">
          <div className="achievements-modal-title">
            <span>{lang === 'ko' ? '모든 업적' : lang === 'ja' ? '全実績' : lang === 'zh' ? '全部成就' : 'All Achievements'}</span>
            <span className="achievements-count-badge">{unlockedCount} / {ACHIEVEMENT_DEFS.length}</span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="achievements-filter-tabs">
          {['all', 'unlocked', 'locked'].map(f => (
            <button
              key={f}
              className={`ach-filter-tab ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all'
                ? (lang === 'ko' ? '전체' : lang === 'ja' ? '全て' : lang === 'zh' ? '全部' : 'All')
                : f === 'unlocked'
                ? (lang === 'ko' ? '달성' : lang === 'ja' ? '解除済' : lang === 'zh' ? '已解锁' : 'Unlocked')
                : (lang === 'ko' ? '미달성' : lang === 'ja' ? '未解除' : lang === 'zh' ? '未解锁' : 'Locked')
              }
            </button>
          ))}
        </div>

        <div className="achievements-modal-body">
          {groupedByCategory.map(({ cat, items }) => (
            <div key={cat} className="ach-category-section">
              <div className="ach-category-label">
                {CATEGORY_LABELS[cat]?.[lang] || CATEGORY_LABELS[cat]?.en || cat}
              </div>
              {items.map(ach => {
                const unlocked = unlockedIds.has(ach.id)
                const expanded = expandedId === ach.id
                const name = ach.name?.[lang] || ach.name?.ko
                const desc = ach.desc?.[lang] || ach.desc?.ko
                const stars = Math.ceil(ach.difficulty / 2)
                return (
                  <div
                    key={ach.id}
                    className={`ach-list-item ${unlocked ? 'unlocked' : 'locked'} ${expanded ? 'expanded' : ''}`}
                    onClick={() => toggle(ach.id)}
                  >
                    <div className="ach-list-row">
                      <div className={`ach-list-icon ${unlocked ? '' : 'locked-icon'}`}>
                        {unlocked ? ach.icon : '🔒'}
                      </div>
                      <div className="ach-list-info">
                        <div className="ach-list-name">
                          {name} {!unlocked && <span className="locked-badge">🔒</span>}
                        </div>
                        <div className="ach-list-stars">
                          {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
                        </div>
                      </div>
                      <div className={`ach-list-chevron ${expanded ? 'up' : ''}`}>›</div>
                    </div>
                    {expanded && (
                      <div className="ach-list-detail">
                        <div className="ach-list-real-name">{name}</div>
                        <div className="ach-list-desc">{desc}</div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
