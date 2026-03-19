import { useState } from 'react'
import { formatTime } from '../utils/helpers'

export function TodoList({ user, t, lang, activeTodos, completedTodos, viewMode, openEditModal, toggleComplete, deleteTodo, handleLogin }) {
  const [showCompleted, setShowCompleted] = useState(false)

  return (
    <>
      {!user && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 16px', margin: '0 0 12px',
          background: 'var(--bg-secondary, rgba(108,99,255,0.08))',
          borderRadius: '12px', gap: '12px'
        }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary, #aaa)' }}>
            {t?.guestModeBanner || '로그인하면 클라우드 백업 및 캘린더 연동이 활성화됩니다.'}
          </span>
          <button
            onClick={handleLogin}
            style={{
              flexShrink: 0, background: 'var(--primary)', color: 'white',
              padding: '6px 14px', border: 'none', borderRadius: '8px',
              cursor: 'pointer', fontWeight: 600, fontSize: '12px', whiteSpace: 'nowrap'
            }}
          >
            {t?.loginBtn || '로그인'}
          </button>
        </div>
      )}

      <div className="active-list">
        {activeTodos.map(todo => (
          <div key={todo.id} className="todo-item" onClick={() => openEditModal(todo)}>
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
          <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-time)' }}>{t.doneAll}</p>
        )}
      </div>

      {completedTodos.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <div
            onClick={() => setShowCompleted(!showCompleted)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-time)', fontSize: '14px', fontWeight: '600', padding: '10px 0' }}
          >
            <span style={{ fontSize: '10px', transition: 'transform 0.2s', transform: showCompleted ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
            <span>{t.completed} {completedTodos.length}</span>
          </div>
          {showCompleted && (
            <div>
              {completedTodos.map(todo => (
                <div key={todo.id} className="todo-item" onClick={() => openEditModal(todo)} style={{ opacity: 0.6 }}>
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
