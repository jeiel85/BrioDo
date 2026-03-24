const PRIORITY_LABELS = {
  ko: { low: '낮음', medium: '보통', high: '높음', urgent: '긴급' },
  ja: { low: '低', medium: '中', high: '高', urgent: '緊急' },
  zh: { low: '低', medium: '中', high: '高', urgent: '紧急' },
  en: { low: 'Low', medium: 'Med', high: 'High', urgent: 'Urgent' },
}

export function InputModal({ t, lang, newTodo, setNewTodo, showDescInput, setShowDescInput, isAiAnalyzing, editingTodoId, resetForm, handleSaveTodo }) {
  const pLabels = PRIORITY_LABELS[lang] || PRIORITY_LABELS.en
  const priority = newTodo.priority ?? 'medium'

  return (
    <div className="input-overlay" onClick={resetForm}>
      <div className="input-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />

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
            placeholder={lang === 'ko' ? '일정의 상세 내용이나 메모를 적어보세요' : 'Add details or notes...'}
            value={newTodo.description}
            onChange={e => setNewTodo({ ...newTodo, description: e.target.value })}
          />
        )}

        {isAiAnalyzing && (
          <div style={{ fontSize: '11px', color: 'var(--color-primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span className="pulse-dot"></span> {t.aiThinking}
          </div>
        )}

        <div className="priority-picker">
          {['low', 'medium', 'high', 'urgent'].map(level => (
            <button
              key={level}
              className={`priority-picker-btn ${priority === level ? `active-${level}` : ''}`}
              onClick={() => setNewTodo({ ...newTodo, priority: level })}
            >
              {pLabels[level]}
            </button>
          ))}
        </div>

        <div className="input-options">
          <div className="input-option-item">
            <span>📅</span>
            <input type="date" value={newTodo.date} onChange={e => setNewTodo({ ...newTodo, date: e.target.value })} />
          </div>
          <div className="input-option-item">
            <span>⏰</span>
            <input type="time" value={newTodo.time} onChange={e => setNewTodo({ ...newTodo, time: e.target.value })} />
          </div>
          <div className="input-option-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '6px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--color-on-surface-variant)' }}>
              🔔 {lang === 'ko' ? '알림' : 'Reminder'}
            </span>
            <div className="reminder-offset-btns">
              {[
                { val: null, label: lang === 'ko' ? '없음' : 'Off' },
                { val: 0,  label: lang === 'ko' ? '정각' : 'On time' },
                { val: 10, label: lang === 'ko' ? '10분 전' : '-10m' },
                { val: 30, label: lang === 'ko' ? '30분 전' : '-30m' },
                { val: 60, label: lang === 'ko' ? '1시간 전' : '-1h' },
              ].map(({ val, label }) => (
                <button
                  key={String(val)}
                  className={`reminder-offset-btn${(newTodo.reminderOffset ?? null) === val ? ' active' : ''}`}
                  onClick={() => setNewTodo({ ...newTodo, reminderOffset: val })}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="input-option-item" style={{ flex: 1 }}>
            <span>🏷️</span>
            <input type="text" placeholder={t.tags} value={newTodo.tagInput} onChange={e => setNewTodo({ ...newTodo, tagInput: e.target.value })} />
          </div>
          <div className="input-option-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '6px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--color-on-surface-variant)' }}>
              🔁 {t.repeat}
            </span>
            <div className="recurrence-btns">
              {[
                { val: 'none',    label: t.repeatNone },
                { val: 'daily',   label: t.repeatDaily },
                { val: 'weekly',  label: t.repeatWeekly },
                { val: 'monthly', label: t.repeatMonthly },
              ].map(({ val, label }) => (
                <button
                  key={val}
                  className={`recurrence-btn${(newTodo.recurrence?.type ?? 'none') === val ? ' active' : ''}`}
                  onClick={() => setNewTodo(prev => ({ ...prev, recurrence: { ...(prev.recurrence || {}), type: val } }))}
                >
                  {label}
                </button>
              ))}
            </div>
            {newTodo.recurrence?.type && newTodo.recurrence.type !== 'none' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)' }}>{t.repeatEndDate}</span>
                <input
                  type="date"
                  value={newTodo.recurrence.endDate || ''}
                  onChange={e => setNewTodo(prev => ({ ...prev, recurrence: { ...prev.recurrence, endDate: e.target.value || null } }))}
                />
              </div>
            )}
          </div>
        </div>

        <div className="subtasks-section">
          <div className="subtasks-section-header">
            <span className="subtasks-label">{t.checklist}</span>
            <button
              className="subtask-add-btn"
              onClick={() => {
                const newSt = { id: `st_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, text: '', completed: false }
                setNewTodo(prev => ({ ...prev, subtasks: [...(prev.subtasks || []), newSt] }))
              }}
            >+</button>
          </div>
          {(newTodo.subtasks || []).map((st, idx) => (
            <div key={st.id} className="subtask-input-row">
              <span className="subtask-bullet">○</span>
              <input
                className="subtask-text-input"
                placeholder={t.checklistPlaceholder}
                value={st.text}
                autoFocus={idx === (newTodo.subtasks || []).length - 1 && st.text === ''}
                onChange={e => setNewTodo(prev => ({
                  ...prev,
                  subtasks: prev.subtasks.map(s => s.id === st.id ? { ...s, text: e.target.value } : s)
                }))}
              />
              <button
                className="subtask-remove-btn"
                onClick={() => setNewTodo(prev => ({ ...prev, subtasks: prev.subtasks.filter(s => s.id !== st.id) }))}
              >✕</button>
            </div>
          ))}
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
