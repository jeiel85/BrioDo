import { useState, useMemo } from 'react'

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

export function CollectionsScreen({ todos, t, lang, openEditModal, toggleComplete }) {
  const [expandedTag, setExpandedTag] = useState(null)

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

  return (
    <div className="collections-screen">
      {/* Hero Card */}
      <div className="hero-collection-card">
        <div className="hero-coll-text">
          <div className="hero-coll-title">{t.allTasks}</div>
          <div className="hero-coll-sub">
            {allDone}/{allTotal} {lang === 'ko' ? '완료' : lang === 'ja' ? '完了' : lang === 'zh' ? '完成' : 'done'}
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
