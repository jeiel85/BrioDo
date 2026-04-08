import { useEffect, useRef, useState } from 'react'
import confetti from 'canvas-confetti'

const PARTICLES = [
  { tx: -70, ty: -100, color: '#FFD700', delay: 0 },
  { tx: 0, ty: -120, color: '#FF6B6B', delay: 0.05 },
  { tx: 70, ty: -100, color: '#4FC3F7', delay: 0.1 },
  { tx: 110, ty: -30, color: '#81C784', delay: 0.05 },
  { tx: 100, ty: 50, color: '#FFD700', delay: 0 },
  { tx: 50, ty: 110, color: '#CE93D8', delay: 0.1 },
  { tx: -50, ty: 110, color: '#FF6B6B', delay: 0.05 },
  { tx: -100, ty: 50, color: '#4FC3F7', delay: 0 },
  { tx: -110, ty: -30, color: '#81C784', delay: 0.1 },
  { tx: -80, ty: 80, color: '#FFD700', delay: 0.05 },
  { tx: 80, ty: 80, color: '#FF6B6B', delay: 0 },
  { tx: 30, ty: -90, color: '#CE93D8', delay: 0.1 },
]

export function AchievementUnlockModal({ achievement, onDismiss, lang }) {
  const [visible, setVisible] = useState(false)
  // localAchievement: achievement prop이 null이 돼도 exit 애니메이션 동안 렌더링 유지
  const [localAchievement, setLocalAchievement] = useState(null)
  const rafRef = useRef(null)
  const confettiTimerRef = useRef(null)
  // 고정 캔버스 ref — 마운트 시 1회만 생성, 업적마다 재생성 없음
  const canvasRef = useRef(null)
  const confettiRef = useRef(null)

  // 마운트 시 confetti 인스턴스를 고정 캔버스에 바인딩 (이후 캔버스 재생성 없음)
  // 캔버스를 항상 DOM에 유지하면 Android WebView의 GPU 레이어 재생성 → 흰 플래시 없음
  useEffect(() => {
    if (canvasRef.current) {
      confettiRef.current = confetti.create(canvasRef.current, { resize: true })
    }
    return () => {
      confettiRef.current?.reset()
    }
  }, [])

  const dismiss = (ach) => {
    // confetti.reset() 제거 — 캔버스 유지, 파티클은 자연 소멸 (~2s)
    // reset() 호출 시 캔버스가 DOM에서 제거 → 다음 업적 시 재생성 → 흰 플래시 원인
    setVisible(false)
    setTimeout(() => {
      setLocalAchievement(null)
      onDismiss()
    }, 350)
  }

  useEffect(() => {
    if (achievement) {
      setLocalAchievement(achievement)

      // double-rAF: 첫 rAF는 레이아웃 계산 프레임, 두 번째 rAF에서 paint 완료 후 transition 시작
      // confetti를 setVisible과 동일 프레임에 실행 — overlay/캔버스 GPU 레이어 확립 이후
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = requestAnimationFrame(() => {
          setVisible(true)
          const fire = confettiRef.current || confetti
          fire({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#FFD700', '#FF6B6B', '#4FC3F7', '#81C784', '#CE93D8']
          })
          confettiTimerRef.current = setTimeout(() => {
            fire({
              particleCount: 80,
              angle: 60,
              spread: 55,
              origin: { x: 0 },
              colors: ['#FFD700', '#FF6B6B', '#4FC3F7']
            })
            fire({
              particleCount: 80,
              angle: 120,
              spread: 55,
              origin: { x: 1 },
              colors: ['#81C784', '#CE93D8', '#FFD700']
            })
          }, 250)
        })
      })

      const timer = setTimeout(() => dismiss(achievement), 5000)

      return () => {
        cancelAnimationFrame(rafRef.current)
        clearTimeout(timer)
        clearTimeout(confettiTimerRef.current)
      }
    }
  }, [achievement, onDismiss])

  return (
    <>
      {/* confetti 전용 캔버스 — 항상 DOM에 유지, 업적마다 재생성 없음
          transparent이므로 보이지 않으며, GPU 레이어 1회만 생성 */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0, left: 0,
          width: '100%', height: '100%',
          pointerEvents: 'none',
          zIndex: 10000,
        }}
      />
      {/* overlay도 항상 DOM에 유지 — GPU 레이어 상시 존재 */}
      {!localAchievement ? (
        <div className="ach-unlock-overlay" aria-hidden="true" />
      ) : (
        <div
          className={`ach-unlock-overlay ${visible ? 'visible' : ''}`}
          onClick={() => dismiss(localAchievement)}
        >
          <div className={`ach-unlock-card ${visible ? 'visible' : ''}`} onClick={e => e.stopPropagation()}>
            <div className="ach-particles">
              {PARTICLES.map((p, i) => (
                <div
                  key={i}
                  className="ach-particle"
                  style={{
                    '--tx': `${p.tx}px`,
                    '--ty': `${p.ty}px`,
                    background: p.color,
                    animationDelay: `${p.delay}s`,
                  }}
                />
              ))}
            </div>
            <div className="ach-unlock-icon">{localAchievement.icon}</div>
            <div className="ach-unlock-title">
              {localAchievement.hidden === true
                ? (lang === 'ko' ? '🔮 비밀 업적 해제!' : lang === 'ja' ? '🔮 秘密実績解除！' : lang === 'zh' ? '🔮 秘密成就解锁！' : '🔮 Secret Achievement!')
                : (lang === 'ko' ? '업적 달성!' : lang === 'ja' ? '実績解除！' : lang === 'zh' ? '成就解锁！' : 'Achievement Unlocked!')}
            </div>
            <div className="ach-unlock-name">{localAchievement.name?.[lang] || localAchievement.name?.ko || ''}</div>
            <div className="ach-unlock-desc">{localAchievement.desc?.[lang] || localAchievement.desc?.ko || ''}</div>
            <div className="ach-unlock-difficulty">
              {'★'.repeat(Math.ceil(localAchievement.difficulty / 2))}{'☆'.repeat(5 - Math.ceil(localAchievement.difficulty / 2))}
            </div>
            <div className="ach-unlock-tap" onClick={() => dismiss(localAchievement)}>
              {lang === 'ko' ? '탭하여 닫기' : lang === 'ja' ? 'タップして閉じる' : lang === 'zh' ? '点击关闭' : 'Tap to close'}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
