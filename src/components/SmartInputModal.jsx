import { useRef, useEffect, useState } from 'react'

export function SmartInputModal({ lang, smartText, setSmartText, isAiAnalyzing, onClose, onSave }) {
  const textareaRef = useRef(null)
  const recognitionRef = useRef(null)
  const [isListening, setIsListening] = useState(false)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  // 컴포넌트 언마운트 시 인식 중지
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort()
    }
  }, [])

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  const canRecord = !!SpeechRecognition

  const toggleMic = () => {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = lang === 'ko' ? 'ko-KR' : lang === 'ja' ? 'ja-JP' : lang === 'zh' ? 'zh-CN' : 'en-US'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript
      setSmartText(prev => prev ? prev + ' ' + transcript : transcript)
    }
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      onSave(smartText)
    }
    if (e.key === 'Escape') onClose()
  }

  return (
    <div className="input-overlay" onClick={onClose}>
      <div className="smart-input-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />

        <div className="smart-input-header">
          <span className="smart-input-badge">✨ {lang === 'ko' ? '스마트 입력' : 'Smart Input'}</span>
          <button className="smart-input-close" onClick={onClose}>✕</button>
        </div>

        <div className="smart-input-hint">
          {lang === 'ko'
            ? '자유롭게 입력하면 날짜·태그를 자동으로 분석해요'
            : 'Type naturally — date & tags will be detected automatically'}
        </div>

        <div style={{ position: 'relative' }}>
          <textarea
            ref={textareaRef}
            className="smart-textarea"
            style={{ paddingRight: canRecord ? '52px' : '16px' }}
            placeholder={lang === 'ko'
              ? '예) 내일 오후 3시 팀 미팅\n    이번 주 금요일까지 보고서 제출\n    오늘 저녁 운동하기'
              : 'e.g. Team meeting tomorrow at 3pm\n     Submit report by this Friday'}
            value={smartText}
            onChange={e => setSmartText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={5}
          />
          {canRecord && (
            <button
              className={`mic-btn${isListening ? ' listening' : ''}`}
              onClick={toggleMic}
              title={lang === 'ko' ? '음성 입력' : 'Voice input'}
            >
              {isListening ? '⏹' : '🎤'}
            </button>
          )}
        </div>

        {isListening && (
          <div className="smart-analyzing">
            <span className="pulse-dot" />
            {lang === 'ko' ? '듣는 중...' : 'Listening...'}
          </div>
        )}

        {isAiAnalyzing && !isListening && (
          <div className="smart-analyzing">
            <span className="pulse-dot" />
            {lang === 'ko' ? 'AI가 분석 중...' : 'Analyzing...'}
          </div>
        )}

        <button
          className="smart-save-btn"
          onClick={() => onSave(smartText)}
          disabled={!smartText.trim() || isAiAnalyzing}
        >
          {lang === 'ko' ? '저장' : 'Save'}
        </button>
      </div>
    </div>
  )
}
