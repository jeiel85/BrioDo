import { useState, useRef } from 'react'
import { ACHIEVEMENT_DEFS } from '../hooks/useAchievements'
import { useSwipeToDismiss } from '../hooks/useSwipeToDismiss'

const CATEGORY_LABELS = {
  streak:     { icon: '🔥', ko: '연속 달성', en: 'Streak', ja: '連続達成', zh: '连续达成' },
  completion: { icon: '✅', ko: '완료 횟수', en: 'Completions', ja: '完了数', zh: '完成数' },
  daily:      { icon: '☀️', ko: '일일 목표', en: 'Daily Goals', ja: '日次目標', zh: '每日目标' },
  weekly:     { icon: '📅', ko: '주간 리듬', en: 'Weekly', ja: '週次', zh: '每周' },
  recurrence: { icon: '🔄', ko: '반복 일정', en: 'Recurrence', ja: '繰り返し', zh: '重复任务' },
  tag:        { icon: '🏷️', ko: '태그', en: 'Tags', ja: 'タグ', zh: '标签' },
  subtask:    { icon: '📋', ko: '하위 태스크', en: 'Subtasks', ja: 'サブタスク', zh: '子任务' },
  priority:   { icon: '🎯', ko: '우선순위', en: 'Priority', ja: '優先度', zh: '优先级' },
  ai:         { icon: '🤖', ko: 'AI & 음성', en: 'AI & Voice', ja: 'AI & 音声', zh: 'AI & 语音' },
  calendar:   { icon: '📆', ko: '캘린더', en: 'Calendar', ja: 'カレンダー', zh: '日历' },
  notes:      { icon: '📝', ko: '상세 기록', en: 'Notes', ja: 'メモ', zh: '记录' },
  special:    { icon: '🎉', ko: '특별 날짜', en: 'Special Days', ja: '特別な日', zh: '特殊日期' },
  engagement: { icon: '💫', ko: '앱 참여', en: 'Engagement', ja: '参加', zh: '参与' },
}

export function AchievementsModal({ onClose, unlockedIds, lang }) {
  const [expandedId, setExpandedId] = useState(null)
  const [filter, setFilter] = useState('all') // 'all' | 'unlocked' | 'locked'
  const headerRef = useRef(null)
  const { overlayRef, modalRef, swipeHandlers } = useSwipeToDismiss(onClose, { handleRef: headerRef })

  // 잠긴 비밀업적은 숨기되, 달성한 비밀업적은 목록에 포함
  const visibleDefs = ACHIEVEMENT_DEFS.filter(a => !a.hidden || unlockedIds.has(a.id))
  const categories = [...new Set(visibleDefs.map(a => a.category))]
  // 전체 카운트: 비밀업적 포함 전체 달성 수 / 전체 업적 수
  const unlockedCount = ACHIEVEMENT_DEFS.filter(a => unlockedIds.has(a.id)).length
  const totalCount = ACHIEVEMENT_DEFS.length

  const filtered = visibleDefs.filter(a => {
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
    <div className="modal-overlay" ref={overlayRef} onClick={onClose}>
      <div className="achievements-modal" ref={modalRef} onClick={e => e.stopPropagation()} {...swipeHandlers}>
        <div ref={headerRef}>
          <div className="modal-drag-handle-zone"><div className="modal-drag-handle" /></div>
          <div className="achievements-modal-header">
            <div className="achievements-modal-title">
              <span>{lang === 'ko' ? '모든 업적' : lang === 'ja' ? '全実績' : lang === 'zh' ? '全部成就' : 'All Achievements'}</span>
              <span className="achievements-count-badge">{unlockedCount} / {totalCount}</span>
            </div>
            <button className="modal-close-btn" onClick={onClose}>✕</button>
          </div>
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
                {CATEGORY_LABELS[cat]?.icon} {CATEGORY_LABELS[cat]?.[lang] || CATEGORY_LABELS[cat]?.en || cat}
              </div>
              {items.map(ach => {
                const unlocked = unlockedIds.has(ach.id)
                const isSecret = !!ach.hidden
                const isSecretLocked = isSecret && !unlocked
                const isSecretUnlocked = isSecret && unlocked
                const expanded = expandedId === ach.id
                const name = ach.name?.[lang] || ach.name?.ko
                const desc = ach.desc?.[lang] || ach.desc?.ko
                const stars = Math.ceil(ach.difficulty / 2)
                const secretLabel = lang === 'ko' ? '비밀 업적' : lang === 'ja' ? '秘密実績' : lang === 'zh' ? '秘密成就' : 'Secret Achievement'
                const secretHint = lang === 'ko' ? '잠금 해제 후 공개됩니다' : lang === 'ja' ? '解除後に公開されます' : lang === 'zh' ? '解锁后公开' : 'Revealed after unlocking'
                return (
                  <div
                    key={ach.id}
                    className={`ach-list-item ${unlocked ? 'unlocked' : 'locked'} ${isSecretUnlocked ? 'secret-unlocked' : ''} ${expanded ? 'expanded' : ''}`}
                    onClick={() => toggle(ach.id)}
                  >
                    <div className="ach-list-row">
                      <div className={`ach-list-icon ${unlocked ? '' : 'locked-icon'}`}>
                        {isSecretLocked ? '🔒' : unlocked ? ach.icon : '🔒'}
                      </div>
                      <div className="ach-list-info">
                        <div className="ach-list-name">
                          {isSecretLocked
                            ? <span className="ach-secret-label">{secretLabel}</span>
                            : <>{name} {isSecretUnlocked && <span className="ach-secret-badge">✨</span>}</>
                          }
                          {!unlocked && !isSecretLocked && <span className="locked-badge">🔒</span>}
                        </div>
                        <div className="ach-list-stars">
                          {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
                        </div>
                      </div>
                      <div className={`ach-list-chevron ${expanded ? 'up' : ''}`}>›</div>
                    </div>
                    {expanded && (
                      <div className="ach-list-detail">
                        {isSecretLocked ? (
                          <div className="ach-list-desc ach-secret-hint">{secretHint}</div>
                        ) : (
                          <>
                            <div className="ach-list-real-name">{name}</div>
                            <div className="ach-list-desc">{desc}</div>
                          </>
                        )}
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
