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

      // rAF: 초기 visible=false 상태가 브라우저에 한 프레임 페인트된 후 transition 시작
      // → 마운트 직후 setVisible(true) 동기 호출 시 transition이 생략되는 문제 방지
      rafRef.current = requestAnimationFrame(() => {
        setVisible(true)
      })

      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#FF6B6B', '#4FC3F7', '#81C784', '#CE93D8']
      })
      const confettiTimer = setTimeout(() => {
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

      const timer = setTimeout(() => dismiss(achievement), 5000)

      return () => {
        cancelAnimationFrame(rafRef.current)
        clearTimeout(timer)
        clearTimeout(confettiTimer)
        confetti.reset()
      }
    }
  }, [achievement, onDismiss])

  if (!localAchievement) return null

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
