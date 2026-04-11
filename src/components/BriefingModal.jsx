import { useEffect } from 'react'

export function BriefingModal({ type, briefingText, briefingLoading, onClose, onGenerate, lang }) {
  useEffect(() => {
    onGenerate()
  }, [])

  const title = type === 'morning'
    ? (lang === 'ko' ? '☀️ 아침 브리핑' : lang === 'ja' ? '☀️ 朝のブリーフィング' : lang === 'zh' ? '☀️ 早间简报' : '☀️ Morning Briefing')
    : (lang === 'ko' ? '🌙 저녁 브리핑' : lang === 'ja' ? '🌙 夜のブリーフィング' : lang === 'zh' ? '🌙 晚间简报' : '🌙 Evening Briefing')

  return (
    <div className="input-overlay" onClick={onClose}>
      <div className="smart-input-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px', padding: '28px 24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px', textAlign: 'center' }}>{title}</h2>

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

        <button
          onClick={onClose}
          style={{
            width: '100%',
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
