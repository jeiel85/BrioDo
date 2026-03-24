import { useState } from 'react'
import { formatTime } from '../utils/helpers'

const PRIORITY_LABELS = {
  ko: { low: '낮음', medium: '보통', high: '높음', urgent: '긴급' },
  ja: { low: '低', medium: '中', high: '高', urgent: '緊急' },
  zh: { low: '低', medium: '中', high: '高', urgent: '紧急' },
  en: { low: 'Low', medium: 'Med', high: 'High', urgent: 'Urgent' },
}

export function TodoList({ user, t, lang, activeTodos, completedTodos, viewMode, showAllIncomplete, todayStr, openEditModal, toggleComplete, toggleSubtaskComplete, deleteTodo }) {
  const [showCompleted, setShowCompleted] = useState(false)
  const [expandedSubtasks, setExpandedSubtasks] = useState(new Set())

  const pLabels = PRIORITY_LABELS[lang] || PRIORITY_LABELS.en

  const toggleSubtaskExpand = (e, todoId) => {
    e.stopPropagation()
    setExpandedSubtasks(prev => {
      const next = new Set(prev)
      next.has(todoId) ? next.delete(todoId) : next.add(todoId)
      return next
    })
  }

  const renderTodoCard = (todo, isCompleted = false) => (
    <div
      key={todo.id}
      className={`todo-card ${isCompleted ? 'todo-card-completed' : ''}`}
      onClick={() => openEditModal(todo)}
      style={isCompleted ? { opacity: 0.6 } : undefined}
    >
      {/* Checkbox */}
      <div
        className={`checkbox ${isCompleted ? 'checked' : ''}`}
        onClick={(e) => toggleComplete(e, todo.id, todo.completed, todo._instanceDate || null)}
      />

      {/* Body */}
      <div className="todo-body">
        {/* Title row */}
        <div className="todo-main-row">
          <span className={`todo-text ${isCompleted ? 'completed' : ''}`}>{todo.text}</span>
          <div className="right-group">
            {viewMode === 'all' && <span className="todo-date-badge">{todo.date.slice(5)}</span>}
            {formatTime(todo.time, t.noTime) && (
              <span className="todo-time">{formatTime(todo.time, t.noTime)}</span>
            )}
          </div>
        </div>

        {/* Meta row: priority pill + tags */}
        {!isCompleted && (
          <div className="todo-meta-row">
            <span className={`priority-pill priority-pill-${todo.priority ?? 'medium'}`}>
              {pLabels[todo.priority ?? 'medium']}
            </span>
            {todo.tags?.map(tag => <span key={tag} className="tag-pill">#{tag}</span>)}
          </div>
        )}

        {/* Description */}
        {todo.description && <div className="todo-desc">{todo.description}</div>}

        {/* Subtask summary */}
        {todo.subtasks?.length > 0 && (
          <div className="subtask-summary" onClick={e => toggleSubtaskExpand(e, todo.id)}>
            <span className="subtask-toggle-icon">{expandedSubtasks.has(todo.id) ? '▼' : '▶'}</span>
            <span className="subtask-count">{todo.subtasks.filter(s => s.completed).length}/{todo.subtasks.length}</span>
            <div className="subtask-progress-bar">
              <div
                className="subtask-progress-fill"
                style={{ width: `${(todo.subtasks.filter(s => s.completed).length / todo.subtasks.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Expanded subtask list */}
        {todo.subtasks?.length > 0 && expandedSubtasks.has(todo.id) && (
          <div className="subtask-list">
            {todo.subtasks.map(st => (
              <div
                key={st.id}
                className="subtask-item"
                onClick={e => { e.stopPropagation(); toggleSubtaskComplete(todo.id, st.id) }}
              >
                <span className={`subtask-checkbox ${st.completed ? 'checked' : ''}`} />
                <span className={`subtask-item-text ${st.completed ? 'completed' : ''}`}>{st.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  // 전체 미완료 뷰: 날짜 그룹 렌더링
  if (showAllIncomplete) {
    const groups = {}
    for (const todo of activeTodos) {
      if (!groups[todo.date]) groups[todo.date] = []
      groups[todo.date].push(todo)
    }
    const sortedDates = Object.keys(groups).sort()
    const locale = lang === 'ko' ? 'ko-KR' : lang === 'ja' ? 'ja-JP' : lang === 'zh' ? 'zh-CN' : 'en-US'

    const getDateLabel = (dateStr) => {
      const diff = Math.round((new Date(dateStr + 'T00:00:00') - new Date(todayStr + 'T00:00:00')) / 86400000)
      const formatted = new Date(dateStr + 'T00:00:00').toLocaleDateString(locale, { month: 'numeric', day: 'numeric' })
      if (diff < -1) return { label: lang === 'ko' ? `${formatted} · ${Math.abs(diff)}일 초과` : lang === 'ja' ? `${formatted} · ${Math.abs(diff)}日超過` : `${formatted} · ${Math.abs(diff)}d overdue`, overdue: true }
      if (diff === -1) return { label: lang === 'ko' ? `어제 · 기한 초과` : lang === 'ja' ? '昨日・期限超過' : 'Yesterday · Overdue', overdue: true }
      if (diff === 0) return { label: lang === 'ko' ? '오늘' : lang === 'ja' ? '今日' : lang === 'zh' ? '今天' : 'Today', overdue: false }
      if (diff === 1) return { label: lang === 'ko' ? '내일' : lang === 'ja' ? '明日' : lang === 'zh' ? '明天' : 'Tomorrow', overdue: false }
      return { label: formatted, overdue: false }
    }

    return (
      <div className="active-list">
        {sortedDates.length === 0 ? (
          <p className="empty-message">{t.doneAll}</p>
        ) : (
          sortedDates.map(date => {
            const { label, overdue } = getDateLabel(date)
            return (
              <div key={date} className="date-group">
                <div className={`date-group-header ${overdue ? 'overdue' : ''}`}>
                  <span className="date-group-label">{label}</span>
                  <span className="date-group-count">{groups[date].length}</span>
                </div>
                {groups[date].map(todo => renderTodoCard(todo, false))}
              </div>
            )
          })
        )}
      </div>
    )
  }

  return (
    <>
      {/* Active todos */}
      <div className="active-list">
        {activeTodos.map(todo => renderTodoCard(todo, false))}
        {activeTodos.length === 0 && (
          <p className="empty-message">{t.doneAll}</p>
        )}
      </div>

      {/* Completed todos */}
      {completedTodos.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <div
            className="completed-section-header"
            onClick={() => setShowCompleted(!showCompleted)}
          >
            <span style={{ fontSize: '10px', transition: 'transform 0.2s', transform: showCompleted ? 'rotate(90deg)' : 'rotate(0deg)', display: 'inline-block' }}>▶</span>
            <span>{t.completed} {completedTodos.length}</span>
          </div>
          {showCompleted && (
            <div>
              {completedTodos.map(todo => renderTodoCard(todo, true))}
            </div>
          )}
        </div>
      )}
    </>
  )
}
