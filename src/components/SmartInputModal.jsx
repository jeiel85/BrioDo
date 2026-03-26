import { useRef, useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { SpeechRecognition } from '@capacitor-community/speech-recognition'
import { trackEngagement } from '../hooks/useAchievements'
import { getLangLocale } from '../utils/helpers'
import { useSwipeToDismiss } from '../hooks/useSwipeToDismiss'

export function SmartInputModal({ lang, smartText, setSmartText, isAiAnalyzing, onClose, onSave, autoStartVoice }) {
  const textareaRef = useRef(null)
  const webRecognitionRef = useRef(null)
  const retryingRef = useRef(false)
  const { overlayRef, modalRef, swipeHandlers } = useSwipeToDismiss(onClose)
  const [isListening, setIsListening] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)
  const [micError, setMicError] = useState('')
  const [partialText, setPartialText] = useState('')

  const isNative = Capacitor.isNativePlatform()
  const langCode = getLangLocale(lang)

  const canRecord = isNative || !!(window.SpeechRecognition || window.webkitSpeechRecognition)

  const stopMic = async () => {
    if (isNative) {
      await SpeechRecognition.stop().catch(() => {})
    } else {
      webRecognitionRef.current?.stop()
    }
    setIsListening(false)
    setPartialText('')
  }

  const startMic = async (retryCount = 0) => {
    setMicError('')
    setPartialText('')
    retryingRef.current = false

    if (isNative) {
      try {
        if (retryCount === 0) {
          trackEngagement('voiceUsed')
          trackEngagement('voiceTasks', true)
          await SpeechRecognition.requestPermissions().catch(() => {})
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
        const rawMsg = String(e?.message || e || 'unknown')
        console.warn('[SpeechRecognition]', rawMsg)
        const msg = rawMsg.toLowerCase()
        const isNoMatch = msg.includes('no match') || msg.includes('didn\'t understand') || msg.includes('no speech')
        if (isNoMatch && retryCount < 1) {
          // 1회 자동 재시도 (Samsung SpeechRecognizer 간헐적 실패 대응)
          retryingRef.current = true
          setIsRetrying(true)
        } else if (msg.includes('permission') || msg.includes('denied')) {
          setMicError(lang === 'ko' ? '마이크 권한이 필요해요. 설정에서 허용해 주세요.' : 'Microphone permission required. Please allow in settings.')
        } else if (isNoMatch) {
          setMicError(lang === 'ko' ? '잘 못 들었어요. 다시 한번 말씀해 주세요 🎤' : 'Didn\'t catch that. Please try again 🎤')
        } else {
          setMicError(lang === 'ko' ? '음성 인식을 다시 시도해 주세요 🎤' : 'Please try speaking again 🎤')
        }
      } finally {
        if (!retryingRef.current) {
          setIsListening(false)
          setIsRetrying(false)
          setPartialText('')
        }
      }
      if (retryingRef.current) return startMic(retryCount + 1)
    } else {
      const WebSpeech = window.SpeechRecognition || window.webkitSpeechRecognition
      if (!WebSpeech) return
      const recognition = new WebSpeech()
      recognition.lang = langCode
      recognition.continuous = false
      recognition.interimResults = true
      recognition.onresult = (e) => {
        const interim = Array.from(e.results).map(r => r[0].transcript).join('')
        if (e.results[e.results.length - 1].isFinal) {
          setSmartText(prev => prev ? prev + ' ' + interim : interim)
          setPartialText('')
        } else {
          setPartialText(interim)
        }
      }
      recognition.onend = () => { setIsListening(false); setPartialText('') }
      recognition.onerror = (e) => { console.warn('[SpeechRecognition web]', e.error); setIsListening(false) }
      webRecognitionRef.current = recognition
      recognition.start()
      setIsListening(true)
    }
  }

  const toggleMic = async () => {
    if (isListening) await stopMic()
    else await startMic()
  }

  // FAB에서 열릴 때 자동 음성 시작 (600ms: Samsung One UI modal 전환 대기)
  useEffect(() => {
    if (autoStartVoice && canRecord) {
      const t = setTimeout(startMic, 600)
      return () => clearTimeout(t)
    } else {
      textareaRef.current?.focus()
    }
  }, [])

  useEffect(() => {
    return () => {
      if (isNative) {
        SpeechRecognition.stop().catch(() => {})
      } else {
        webRecognitionRef.current?.abort()
      }
    }
  }, [])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      onSave(smartText)
    }
    if (e.key === 'Escape') onClose()
  }

  return (
    <div className="input-overlay" ref={overlayRef} onClick={onClose}>
      <div className="smart-input-modal" ref={modalRef} onClick={e => e.stopPropagation()} {...swipeHandlers}>
        <div className="modal-header">
          <span className="smart-input-badge">✨ {lang === 'ko' ? '스마트 입력' : 'Smart Input'}</span>
          <button className="smart-input-close" onClick={onClose}>✕</button>
        </div>

        <div className="smart-input-body">
        {isListening ? (
          <div className="voice-listening-area">
            {isRetrying ? (
              <div className="voice-preparing-label">
                {lang === 'ko' ? '🎤 마이크를 준비 중이에요...' : lang === 'ja' ? '🎤 マイクを準備中です...' : lang === 'zh' ? '🎤 正在准备麦克风...' : '🎤 Preparing microphone...'}
              </div>
            ) : (
              <>
                <div className="voice-waveform">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="voice-wave-bar" style={{ animationDelay: `${i * 0.1}s` }} />
                  ))}
                </div>
                <div className="voice-listening-label">
                  {lang === 'ko' ? '듣는 중...' : lang === 'ja' ? '聞いています...' : lang === 'zh' ? '正在听...' : 'Listening...'}
                </div>
              </>
            )}
            {partialText && (
              <div className="voice-partial-text">{partialText}</div>
            )}
            <button className="voice-stop-btn" onClick={e => { e.stopPropagation(); toggleMic() }}>
              {lang === 'ko' ? '완료' : lang === 'ja' ? '完了' : lang === 'zh' ? '完成' : 'Done'}
            </button>
          </div>
        ) : (
          <>
            <div className="smart-input-hint">
              {lang === 'ko'
                ? '자유롭게 입력하면 날짜·태그를 자동으로 분석해요'
                : 'Type naturally — date & tags will be detected automatically'}
            </div>

            <textarea
              ref={textareaRef}
              className="smart-textarea"
              placeholder={lang === 'ko'
                ? '예) 내일 오후 3시 팀 미팅\n    이번 주 금요일까지 보고서 제출\n    오늘 저녁 운동하기'
                : 'e.g. Team meeting tomorrow at 3pm\n     Submit report by this Friday'}
              value={smartText}
              onChange={e => setSmartText(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={4}
            />

            {canRecord && (
              <button className="mic-large-btn" onClick={e => { e.stopPropagation(); toggleMic() }}>
                <span className="mic-large-icon">🎤</span>
                <span className="mic-large-label">
                  {lang === 'ko' ? '탭하여 말하기' : lang === 'ja' ? 'タップして話す' : lang === 'zh' ? '点击说话' : 'Tap to speak'}
                </span>
              </button>
            )}

            {micError && (
              <div className="smart-mic-error">{micError}</div>
            )}
          </>
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
          disabled={!smartText.trim() || isAiAnalyzing || isListening}
        >
          {lang === 'ko' ? '저장' : 'Save'}
        </button>
        </div>{/* /smart-input-body */}
      </div>
    </div>
  )
}
