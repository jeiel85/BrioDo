export function InputModal({ t, lang, newTodo, setNewTodo, showDescInput, setShowDescInput, isAiAnalyzing, editingTodoId, resetForm, handleSaveTodo }) {
  return (
    <div className="input-overlay" onClick={resetForm}>
      <div className="input-modal" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
          <input
            className="main-input"
            style={{ flex: 1, marginBottom: 0 }}
            type="text"
            placeholder={t.placeholder}
            autoFocus
            value={newTodo.text}
            onChange={e => setNewTodo({ ...newTodo, text: e.target.value })}
          />
          <button
            className={`desc-toggle-btn ${showDescInput ? 'active' : ''}`}
            onClick={() => setShowDescInput(!showDescInput)}
            title={lang === 'ko' ? '상세 내용 입력' : 'Add Details'}
          >
            {showDescInput ? '➖' : '➕'}
          </button>
        </div>

        {showDescInput && (
          <textarea
            className="desc-input"
            style={{
              width: '100%', minHeight: '80px', borderRadius: '12px', padding: '12px',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'white', fontSize: '14px', marginBottom: '10px', outline: 'none'
            }}
            placeholder={lang === 'ko' ? '일정의 상세 내용이나 메모를 적어보세요' : 'Add details or notes...'}
            value={newTodo.description}
            onChange={e => setNewTodo({ ...newTodo, description: e.target.value })}
          />
        )}

        {isAiAnalyzing && (
          <div style={{ fontSize: '11px', color: 'var(--primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span className="pulse-dot"></span> {t.aiThinking}
          </div>
        )}

        <div className="input-options">
          <div className="input-option-item">
            <span>📅</span>
            <input type="date" value={newTodo.date} onChange={e => setNewTodo({ ...newTodo, date: e.target.value })} />
          </div>
          <div className="input-option-item">
            <span>⏰</span>
            <input type="time" value={newTodo.time} onChange={e => setNewTodo({ ...newTodo, time: e.target.value })} />
          </div>
          <div className="input-option-item" style={{ flex: 1 }}>
            <span>🏷️</span>
            <input type="text" placeholder={t.tags} value={newTodo.tagInput} onChange={e => setNewTodo({ ...newTodo, tagInput: e.target.value })} />
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-cancel" onClick={resetForm}>{t.cancel}</button>
          <button className="btn-save" onClick={handleSaveTodo}>
            {editingTodoId ? (lang === 'ko' ? '수정' : 'Update') : t.save}
          </button>
        </div>
      </div>
    </div>
  )
}
