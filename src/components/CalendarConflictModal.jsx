import { useState } from 'react'

// 중복 BlendDo 캘린더 감지 시 사용자 선택 모달
export function CalendarConflictModal({ calendars, onResolve, t }) {
  const [mode, setMode] = useState('choose') // 'choose' | 'rename'
  const [newName, setNewName] = useState('BlendDo 2')

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '24px'
    }}>
      <div style={{
        background: 'var(--card-bg, #1e1e2e)', borderRadius: '16px',
        padding: '24px', width: '100%', maxWidth: '400px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
      }}>
        <div style={{ fontSize: '20px', marginBottom: '4px' }}>⚠️</div>
        <h3 style={{ margin: '0 0 8px', fontSize: '16px', color: 'var(--text-primary, #fff)' }}>
          {t?.calendarConflictTitle || '중복 캘린더 감지'}
        </h3>
        <p style={{ margin: '0 0 20px', fontSize: '13px', color: 'var(--text-secondary, #aaa)', lineHeight: 1.5 }}>
          {t?.calendarConflictDesc || `Google 캘린더에 "BlendDo" 이름의 캘린더가 ${calendars.length}개 존재합니다. 어떻게 처리할까요?`}
        </p>

        {mode === 'choose' ? (
          <>
            <p style={{ margin: '0 0 10px', fontSize: '12px', color: 'var(--text-secondary, #aaa)' }}>
              {t?.calendarConflictSelectExisting || '기존 캘린더 중 하나를 선택하세요:'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {calendars.map((cal, i) => (
                <button
                  key={cal.id}
                  onClick={() => onResolve({ calendarId: cal.id })}
                  style={{
                    background: 'var(--bg-secondary, #2a2a3e)', border: '1px solid var(--border, #444)',
                    borderRadius: '10px', padding: '12px 16px', color: 'var(--text-primary, #fff)',
                    fontSize: '13px', textAlign: 'left', cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}
                >
                  <span>📅 BlendDo {i > 0 ? `(${i + 1})` : ''}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary, #aaa)' }}>연결하기</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setMode('rename')}
              style={{
                width: '100%', background: 'transparent', border: '1px dashed var(--border, #555)',
                borderRadius: '10px', padding: '10px', color: 'var(--text-secondary, #aaa)',
                fontSize: '13px', cursor: 'pointer'
              }}
            >
              {t?.calendarConflictNewName || '+ 새 이름으로 캘린더 만들기'}
            </button>
          </>
        ) : (
          <>
            <p style={{ margin: '0 0 10px', fontSize: '12px', color: 'var(--text-secondary, #aaa)' }}>
              {t?.calendarConflictEnterName || '새 캘린더 이름:'}
            </p>
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'var(--bg-secondary, #2a2a3e)', border: '1px solid var(--border, #444)',
                borderRadius: '10px', padding: '10px 14px', color: 'var(--text-primary, #fff)',
                fontSize: '14px', marginBottom: '16px', outline: 'none'
              }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setMode('choose')}
                style={{
                  flex: 1, background: 'transparent', border: '1px solid var(--border, #444)',
                  borderRadius: '10px', padding: '10px', color: 'var(--text-secondary, #aaa)',
                  fontSize: '13px', cursor: 'pointer'
                }}
              >
                ← 뒤로
              </button>
              <button
                onClick={() => newName.trim() && onResolve({ newName: newName.trim() })}
                disabled={!newName.trim()}
                style={{
                  flex: 2, background: 'var(--accent, #6c63ff)', border: 'none',
                  borderRadius: '10px', padding: '10px', color: '#fff',
                  fontSize: '13px', cursor: newName.trim() ? 'pointer' : 'not-allowed',
                  opacity: newName.trim() ? 1 : 0.5
                }}
              >
                {t?.calendarConflictCreate || '이 이름으로 생성'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
