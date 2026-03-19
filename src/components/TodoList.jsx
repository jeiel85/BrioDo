import { useState } from 'react'
import { formatTime } from '../utils/helpers'

export function TodoList({ user, t, lang, activeTodos, completedTodos, viewMode, openEditModal, toggleComplete, deleteTodo, handleLogin }) {
  const [showCompleted, setShowCompleted] = useState(false)

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-time)' }}>
        <p style={{ marginBottom: '20px' }}>로그인하여 대기중인 일정을 클라우드에 백업하세요.</p>
        <button
          style={{ background: 'var(--primary)', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 600 }}
          onClick={handleLogin}
        >
          Google 계정으로 시작하기
        </button>
      </div>
    )
  }

  return (
    <>
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
