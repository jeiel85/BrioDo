import { useEffect, useRef, useState, useCallback } from 'react'
import confetti from 'canvas-confetti'

async function shareAchievementCard(achievement, lang) {
  const W = 800, H = 480
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  // 현재 테마 색상 읽기
  const style = getComputedStyle(document.documentElement)
  const primary = style.getPropertyValue('--color-primary').trim() || '#6750A4'
  const surface = style.getPropertyValue('--color-surface').trim() || '#1C1B1F'

  // 배경 그라디언트
  const grad = ctx.createLinearGradient(0, 0, W, H)
  grad.addColorStop(0, surface)
  grad.addColorStop(1, primary + '55')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)

  // 둥근 테두리 효과
  ctx.strokeStyle = primary + '88'
  ctx.lineWidth = 3
  const r = 24
  ctx.beginPath()
  ctx.moveTo(r, 0)
  ctx.lineTo(W - r, 0)
  ctx.quadraticCurveTo(W, 0, W, r)
  ctx.lineTo(W, H - r)
  ctx.quadraticCurveTo(W, H, W - r, H)
  ctx.lineTo(r, H)
  ctx.quadraticCurveTo(0, H, 0, H - r)
  ctx.lineTo(0, r)
  ctx.quadraticCurveTo(0, 0, r, 0)
  ctx.closePath()
  ctx.stroke()

  // 이모지 (대형)
  ctx.font = '96px serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(achievement.icon || '🏆', W / 2, 130)

  // 업적 달성 레이블
  const titleText = achievement.hidden
    ? (lang === 'ko' ? '🔮 비밀 업적 해제!' : lang === 'ja' ? '🔮 秘密実績解除！' : lang === 'zh' ? '🔮 秘密成就解锁！' : '🔮 Secret Achievement!')
    : (lang === 'ko' ? '업적 달성!' : lang === 'ja' ? '実績解除！' : lang === 'zh' ? '成就解锁！' : 'Achievement Unlocked!')
  ctx.font = 'bold 28px sans-serif'
  ctx.fillStyle = primary
  ctx.fillText(titleText, W / 2, 230)

  // 업적 이름
  const name = achievement.name?.[lang] || achievement.name?.ko || ''
  ctx.font = 'bold 38px sans-serif'
  ctx.fillStyle = '#ffffff'
  ctx.fillText(name, W / 2, 285)

  // 설명 (긴 경우 줄바꿈)
  const desc = achievement.desc?.[lang] || achievement.desc?.ko || ''
  ctx.font = '20px sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.72)'
  const maxWidth = W - 80
  const words = desc.split(' ')
  let line = ''
  let lineY = 335
  for (const word of words) {
    const testLine = line + (line ? ' ' : '') + word
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, W / 2, lineY)
      line = word
      lineY += 28
      if (lineY > 390) break
    } else {
      line = testLine
    }
  }
  if (line) ctx.fillText(line, W / 2, lineY)

  // 별점
  const stars = Math.ceil((achievement.difficulty || 1) / 2)
  ctx.font = '22px serif'
  ctx.fillStyle = '#FFD700'
  const starStr = '★'.repeat(stars) + '☆'.repeat(5 - stars)
  ctx.fillText(starStr, W / 2, Math.min(lineY + 36, 420))

  // 하단 브랜딩
  ctx.font = 'bold 16px sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.45)'
  ctx.fillText('BrioDo · Do it with brio.', W / 2, H - 24)

  return new Promise((resolve) => {
    canvas.toBlob(async (blob) => {
      if (!blob) { resolve(false); return }
      const name2 = achievement.name?.[lang] || achievement.name?.ko || 'achievement'
      const shareText = lang === 'ko'
        ? `BrioDo에서 "${name2}" 업적을 달성했어요! 🎉`
        : lang === 'ja' ? `BrioDo で「${name2}」実績を解除しました！ 🎉`
        : lang === 'zh' ? `在 BrioDo 中解锁了「${name2}」成就！ 🎉`
        : `I just unlocked "${name2}" on BrioDo! 🎉`
      const file = new File([blob], 'briodo-achievement.png', { type: 'image/png' })
      try {
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: 'BrioDo', text: shareText })
        } else if (navigator.share) {
          await navigator.share({ title: 'BrioDo', text: shareText })
        } else {
          // 폴백: 이미지 다운로드
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = 'briodo-achievement.png'
          a.click()
          URL.revokeObjectURL(url)
        }
        resolve(true)
      } catch {
        resolve(false)
      }
    }, 'image/png')
  })
}

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
  const [isSharing, setIsSharing] = useState(false)
  const rafRef = useRef(null)
  const confettiTimerRef = useRef(null)
  // 고정 캔버스 ref — 마운트 시 1회만 생성, 업적마다 재생성 없음
  const canvasRef = useRef(null)
  const confettiRef = useRef(null)

  const handleShare = useCallback(async (e) => {
    e.stopPropagation()
    if (!localAchievement || isSharing) return
    setIsSharing(true)
    await shareAchievementCard(localAchievement, lang)
    setIsSharing(false)
  }, [localAchievement, lang, isSharing])

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

  const dismiss = (_ach) => {
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
            <button className="ach-share-btn" onClick={handleShare} disabled={isSharing}>
              {isSharing
                ? (lang === 'ko' ? '공유 중...' : lang === 'ja' ? '共有中...' : lang === 'zh' ? '分享中...' : 'Sharing...')
                : (lang === 'ko' ? '공유하기 ↗' : lang === 'ja' ? 'シェアする ↗' : lang === 'zh' ? '分享 ↗' : 'Share ↗')}
            </button>
            <div className="ach-unlock-tap" onClick={() => dismiss(localAchievement)}>
              {lang === 'ko' ? '탭하여 닫기' : lang === 'ja' ? 'タップして閉じる' : lang === 'zh' ? '点击关闭' : 'Tap to close'}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
