import { useRef, useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { SpeechRecognition } from '@capacitor-community/speech-recognition'

export function SmartInputModal({ lang, smartText, setSmartText, isAiAnalyzing, onClose, onSave }) {
  const textareaRef = useRef(null)
  const webRecognitionRef = useRef(null)
  const [isListening, setIsListening] = useState(false)
  const [micError, setMicError] = useState('')

  const isNative = Capacitor.isNativePlatform()
  const langCode = lang === 'ko' ? 'ko-KR' : lang === 'ja' ? 'ja-JP' : lang === 'zh' ? 'zh-CN' : 'en-US'

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  useEffect(() => {
    return () => {
      if (isNative) SpeechRecognition.stop().catch(() => {})
      else webRecognitionRef.current?.abort()
    }
  }, [])

  const canRecord = isNative || !!(window.SpeechRecognition || window.webkitSpeechRecognition)

  const toggleMic = async () => {
    if (isListening) {
      if (isNative) await SpeechRecognition.stop().catch(() => {})
      else webRecognitionRef.current?.stop()
      setIsListening(false)
      return
    }

    setMicError('')

    if (isNative) {
      // 네이티브 Android 음성 인식
      try {
        const { speechRecognition } = await SpeechRecognition.requestPermissions()
        if (speechRecognition !== 'granted') {
          setMicError(lang === 'ko' ? '마이크 권한을 허용해주세요' : 'Microphone permission required')
          return
        }
        setIsListening(true)
        const result = await SpeechRecognition.start({
          language: langCode,
          maxResults: 1,
          partialResults: false,
          popup: false,
        })
        if (result?.matches?.[0]) {
          const transcript = result.matches[0]
          setSmartText(prev => prev ? prev + ' ' + transcript : transcript)
        }
      } catch (e) {
        console.warn('[SpeechRecognition]', e)
        setMicError(lang === 'ko' ? '음성 인식에 실패했습니다' : 'Speech recognition failed')
      } finally {
        setIsListening(false)
      }
    } else {
      // 웹 브라우저 (개발 환경) fallback
      const WebSpeech = window.SpeechRecognition || window.webkitSpeechRecognition
      if (!WebSpeech) return
      const recognition = new WebSpeech()
      recognition.lang = langCode
      recognition.continuous = false
      recognition.interimResults = false
      recognition.onresult = (e) => {
        const transcript = e.results[0][0].transcript
        setSmartText(prev => prev ? prev + ' ' + transcript : transcript)
      }
      recognition.onend = () => setIsListening(false)
      recognition.onerror = (e) => {
        console.warn('[SpeechRecognition web]', e.error)
        setIsListening(false)
      }
      webRecognitionRef.current = recognition
      recognition.start()
      setIsListening(true)
    }
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

        {micError && (
          <div style={{ fontSize: '13px', color: 'var(--color-error, #d32f2f)', padding: '4px 2px' }}>
            {micError}
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
