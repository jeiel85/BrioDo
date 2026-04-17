import { useEffect, useState, useMemo } from 'react'
import { findStaleTodos, buildNudgePrompt } from '../utils/helpers'

export function BriefingModal({
  type,
  briefingText,
  briefingLoading,
  onClose,
  onGenerate,
  onNudgeAction,
  lang,
  todos,
  nudgeText,
  nudgeLoading,
  onGenerateNudge
}) {
  const [showNudge, setShowNudge] = useState(false)

  // Check for stale todos on mount (morning briefing only)
  const staleTodos = useMemo(() => {
    if (type !== 'morning' || !todos) return []
    return findStaleTodos(todos, 14)
  }, [type, todos])

  useEffect(() => {
    onGenerate()
    if (staleTodos.length > 0) {
      setShowNudge(true)
      onGenerateNudge(staleTodos)
    }
  }, [])

  const title = type === 'morning'
    ? (lang === 'ko' ? '☀️ 아침 브리핑' : lang === 'ja' ? '☀️ 朝のブリーフィング' : lang === 'zh' ? '☀️ 早间简报' : '☀️ Morning Briefing')
    : (lang === 'ko' ? '🌙 저녁 브리핑' : lang === 'ja' ? '🌙 夜のブリーフィング' : lang === 'zh' ? '🌙 晚间简报' : '🌙 Evening Briefing')

  const handleNudgeAction = (action, todoId) => {
    if (onNudgeAction) {
      onNudgeAction(action, todoId)
    }
  }

  return (
    <div className="input-overlay" onClick={onClose}>
      <div className="smart-input-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px', padding: '28px 24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px', textAlign: 'center' }}>{title}</h2>

        {/* Main Briefing Content */}
        {briefingLoading ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div className="ai-thinking-animation" style={{ marginBottom: '12px' }}>
              <span className="dot" /><span className="dot" /><span className="dot" />
            </div>
            <p style={{ color: 'var(--color-on-surface-variant)', fontSize: '14px' }}>
              {lang === 'ko' ? '브리핑 생성 중...' : lang === 'ja' ? 'ブリーフィング生成中...' : lang === 'zh' ? '正在生成简报...' : 'Generating briefing...'}
            </p>
          </div>
        ) : (
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.7', fontSize: '14.5px', color: 'var(--color-on-surface)', padding: '8px 0 16px' }}>
            {briefingText}
          </div>
        )}

        {/* Nudge Section - Stale Todo Suggestions */}
        {showNudge && (
          <div className="nudge-section" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--color-outline-variant)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{ fontSize: '18px' }}>💭</span>
              <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-primary)' }}>
                {lang === 'ko' ? '묵은 할 일 정리 제안' : lang === 'ja' ? '放置タスクの整理提案' : lang === 'zh' ? '闲置任务整理建议' : 'Stale Task Cleanup'}
              </span>
            </div>

            {nudgeLoading ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div className="ai-thinking-animation">
                  <span className="dot" /><span className="dot" /><span className="dot" />
                </div>
              </div>
            ) : nudgeText ? (
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '14px', color: 'var(--color-on-surface)', marginBottom: '16px' }}>
                {nudgeText}
              </div>
            ) : null}

            {/* Stale Todo List with Actions */}
            {staleTodos.length > 0 && (
              <div className="stale-todo-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {staleTodos.map(todo => (
                  <div key={todo.id} className="stale-todo-item" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 12px',
                    background: 'var(--color-surface-container-low)',
                    borderRadius: '10px',
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: 500,
                        color: 'var(--color-on-surface)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {todo.text}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-on-surface-variant)', marginTop: '2px' }}>
                        {lang === 'ko' ? '생성일:' : lang === 'ja' ? '作成日:' : lang === 'zh' ? '创建日期:' : 'Created:'} {todo.date}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => handleNudgeAction('reschedule', todo.id)}
                        style={{
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: 600,
                          border: 'none',
                          borderRadius: '8px',
                          background: 'var(--color-primary-container)',
                          color: 'var(--color-on-primary)',
                          cursor: 'pointer',
                        }}
                      >
                        {lang === 'ko' ? '오늘로' : lang === 'ja' ? '今日に' : lang === 'zh' ? '改今天' : 'Today'}
                      </button>
                      <button
                        onClick={() => handleNudgeAction('delete', todo.id)}
                        style={{
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: 600,
                          border: 'none',
                          borderRadius: '8px',
                          background: 'var(--color-error)',
                          color: 'white',
                          cursor: 'pointer',
                        }}
                      >
                        {lang === 'ko' ? '삭제' : lang === 'ja' ? '削除' : lang === 'zh' ? '删除' : 'Delete'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <button
          onClick={onClose}
          style={{
            width: '100%',
            marginTop: '16px',
            padding: '12px',
            borderRadius: '12px',
            background: 'var(--color-primary)',
            color: 'var(--color-on-primary)',
            border: 'none',
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {lang === 'ko' ? '닫기' : lang === 'ja' ? '閉じる' : lang === 'zh' ? '关闭' : 'Close'}
        </button>
      </div>
    </div>
  )
}
