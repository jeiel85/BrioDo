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

  const dismiss = (ach) => {
    confetti.reset()
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
      // Android WebView는 single rAF만으로는 초기 paint 보장 불충분
      // confetti를 setVisible과 동일 프레임에 실행 — overlay GPU 레이어 확립 이후에 confetti canvas 생성
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = requestAnimationFrame(() => {
          setVisible(true)
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#FFD700', '#FF6B6B', '#4FC3F7', '#81C784', '#CE93D8']
          })
          confettiTimerRef.current = setTimeout(() => {
            confetti({
              particleCount: 80,
              angle: 60,
              spread: 55,
              origin: { x: 0 },
              colors: ['#FFD700', '#FF6B6B', '#4FC3F7']
            })
            confetti({
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
        confetti.reset()
      }
    }
  }, [achievement, onDismiss])

  // return null 제거 — overlay div를 항상 DOM에 유지
  // 이유: return null 시 DOM에서 overlay가 제거되었다가 업적 발생 시 재추가됨.
  // Android WebView는 position:fixed + will-change 요소의 GPU 레이어를 생성할 때 화면 전체를
  // 재합성하며, 이 순간 흰 플래시(깜빡임)가 발생함.
  // 항상 overlay div를 DOM에 유지하면 GPU 레이어가 최초 마운트 시 한 번만 생성되어 이후 깜빡임 없음.
  if (!localAchievement) return <div className="ach-unlock-overlay" aria-hidden="true" />

  const BRIO_BY_DIFF = { 1: 1, 2: 1, 3: 2, 4: 2, 5: 3, 6: 4, 7: 5, 8: 7, 9: 10, 10: 15 }
  const REWARD_CAP = 15
  const brioReward = Math.min(localAchievement.brioReward ?? BRIO_BY_DIFF[localAchievement.difficulty] ?? 0, REWARD_CAP)
  const isSecret = localAchievement.hidden === true
  const name = localAchievement.name?.[lang] || localAchievement.name?.ko || ''
  const desc = localAchievement.desc?.[lang] || localAchievement.desc?.ko || ''

  return (
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
          {isSecret
            ? (lang === 'ko' ? '🔮 비밀 업적 해제!' : lang === 'ja' ? '🔮 秘密実績解除！' : lang === 'zh' ? '🔮 秘密成就解锁！' : '🔮 Secret Achievement!')
            : (lang === 'ko' ? '업적 달성!' : lang === 'ja' ? '実績解除！' : lang === 'zh' ? '成就解锁！' : 'Achievement Unlocked!')}
        </div>
        <div className="ach-unlock-name">{name}</div>
        <div className="ach-unlock-desc">{desc}</div>
        <div className="ach-unlock-difficulty">
          {'★'.repeat(Math.ceil(localAchievement.difficulty / 2))}{'☆'.repeat(5 - Math.ceil(localAchievement.difficulty / 2))}
        </div>
        {brioReward > 0 && (
          <div className="ach-unlock-brio">⚡+{brioReward}</div>
        )}
        <div className="ach-unlock-tap">
          {lang === 'ko' ? '탭하여 닫기' : lang === 'ja' ? 'タップして閉じる' : lang === 'zh' ? '点击关闭' : 'Tap to close'}
        </div>
      </div>
    </div>
  )
}
