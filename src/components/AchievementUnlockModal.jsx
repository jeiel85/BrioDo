import { useEffect, useState } from 'react'
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

  useEffect(() => {
    if (achievement) {
      setVisible(true)
      
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#FF6B6B', '#4FC3F7', '#81C784', '#CE93D8']
      })
      setTimeout(() => {
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

      const timer = setTimeout(() => { setVisible(false); setTimeout(onDismiss, 300) }, 5000)
      return () => clearTimeout(timer)
    }
  }, [achievement, onDismiss])

  if (!achievement) return null

  const name = achievement.name?.[lang] || achievement.name?.ko || ''
  const desc = achievement.desc?.[lang] || achievement.desc?.ko || ''

  const handleClick = () => { setVisible(false); setTimeout(onDismiss, 300) }

  return (
    <div
      className={`ach-unlock-overlay ${visible ? 'visible' : ''}`}
      onClick={handleClick}
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
        <div className="ach-unlock-icon">{achievement.icon}</div>
        <div className="ach-unlock-title">
          {lang === 'ko' ? '업적 달성!' : lang === 'ja' ? '実績解除！' : lang === 'zh' ? '成就解锁！' : 'Achievement Unlocked!'}
        </div>
        <div className="ach-unlock-name">{name}</div>
        <div className="ach-unlock-desc">{desc}</div>
        <div className="ach-unlock-difficulty">
          {'★'.repeat(Math.ceil(achievement.difficulty / 2))}{'☆'.repeat(5 - Math.ceil(achievement.difficulty / 2))}
        </div>
        <div className="ach-unlock-tap">
          {lang === 'ko' ? '탭하여 닫기' : lang === 'ja' ? 'タップして閉じる' : lang === 'zh' ? '点击关闭' : 'Tap to close'}
        </div>
      </div>
    </div>
  )
}
