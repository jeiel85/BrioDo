import { useState } from 'react'
import { formatTime } from '../utils/helpers'

export function TodoList({ user, t, lang, activeTodos, completedTodos, viewMode, openEditModal, toggleComplete, deleteTodo }) {
  const [showCompleted, setShowCompleted] = useState(false)

  return (
    <>

      <div className="active-list">
        {activeTodos.map(todo => (
          <div key={todo.id} className="todo-item" onClick={() => openEditModal(todo)}>
            <div className={`priority-indicator ${todo.priority ?? 'medium'}`} />
            <div className="checkbox" onClick={(e) => toggleComplete(e, todo.id, todo.completed)}></div>
            <div className="todo-body">
              <div className="todo-main-row">
                <span className="todo-text">{todo.text}</span>
                <div className="right-group">
                  {viewMode === 'all' && <span className="todo-date-badge">{todo.date.slice(5)}</span>}
                  {formatTime(todo.time, t.noTime) && (
                    <span className="todo-time">{formatTime(todo.time, t.noTime)}</span>
                  )}
                </div>
              </div>
              {todo.description && <div className="todo-desc">{todo.description}</div>}
              {todo.tags?.length > 0 && (
                <div className="tags-row">
                  {todo.tags.map(tag => <span key={tag} className="tag-pill">#{tag}</span>)}
                </div>
              )}
            </div>
          </div>
        ))}
        {activeTodos.length === 0 && (
          <p style={{ textAlign: 'center', padding: '40px', color: 'var(--color-on-surface-variant)' }}>{t.doneAll}</p>
        )}
      </div>

      {completedTodos.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <div
            onClick={() => setShowCompleted(!showCompleted)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--color-on-surface-variant)', fontSize: '14px', fontWeight: '600', padding: '10px 0' }}
          >
            <span style={{ fontSize: '10px', transition: 'transform 0.2s', transform: showCompleted ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
            <span>{t.completed} {completedTodos.length}</span>
          </div>
          {showCompleted && (
            <div>
              {completedTodos.map(todo => (
                <div key={todo.id} className="todo-item" onClick={() => openEditModal(todo)} style={{ opacity: 0.6 }}>
                  <div className={`priority-indicator ${todo.priority ?? 'medium'}`} />
                  <div className="checkbox checked" onClick={(e) => toggleComplete(e, todo.id, todo.completed)}></div>
                  <div className="todo-body">
                    <div className="todo-main-row">
                      <span className="todo-text completed">{todo.text}</span>
                      <div className="right-group">
                        {formatTime(todo.time, t.noTime) && (
                          <span className="todo-time">{formatTime(todo.time, t.noTime)}</span>
                        )}
                      </div>
                    </div>
                    {todo.description && <div className="todo-desc">{todo.description}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}
