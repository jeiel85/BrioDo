import { useSwipeToDismiss } from '../hooks/useSwipeToDismiss'
import { trackEngagement } from '../hooks/useAchievements'
import { useRef, useState } from 'react'
import { showRewardedAd } from '../hooks/useAdMob'

/**
 * 브리오 충전 모달
 * - 광고 시청 → +5 브리오 (AdMob 보상형 광고 연동)
 * - 자동 충전까지 남은 시간 안내 (2시간마다 1개)
 */

function formatNextCharge(ms, lang) {
  if (!ms || ms <= 0) return null
  const totalMin = Math.ceil(ms / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (lang === 'ko') return h > 0 ? `${h}시간 ${m > 0 ? `${m}분` : ''}후 자동 충전` : `${m}분 후 자동 충전`
  if (lang === 'ja') return h > 0 ? `${h}時間${m > 0 ? `${m}分` : ''}後に自動充電` : `${m}分後に自動充電`
  if (lang === 'zh') return h > 0 ? `${h}小时${m > 0 ? `${m}分钟` : ''}后自动充值` : `${m}分钟后自动充值`
  return h > 0 ? `Auto-recharges in ${h}h${m > 0 ? ` ${m}m` : ''}` : `Auto-recharges in ${m}m`
}

export function BrioChargeModal({ onClose, onCharge, balance, nextChargeMs, lang }) {
  const handleRef = useRef(null)
  const { overlayRef, modalRef, swipeHandlers } = useSwipeToDismiss(onClose, { handleRef })
  const [adLoading, setAdLoading] = useState(false)
  const [adError, setAdError] = useState(false)

  const handleWatchAd = async () => {
    setAdLoading(true)
    setAdError(false)
    const success = await showRewardedAd((amount) => {
      trackEngagement('adsWatched', true)
      onCharge(amount || 5)
      onClose()
    })
    if (!success) {
      setAdError(true)
    }
    setAdLoading(false)
  }

  const nextChargeLabel = formatNextCharge(nextChargeMs, lang)

  const t = {
    title:   lang === 'ko' ? '⚡ 브리오가 부족해요' : lang === 'ja' ? '⚡ ブリオが足りません' : lang === 'zh' ? '⚡ 能量不足' : '⚡ Out of Brio',
    body:    lang === 'ko' ? '브리오는 AI·음성·캘린더 등 고급 기능을 사용할 때 소모되며, 2시간마다 1개씩 자동으로 채워집니다.'
           : lang === 'ja' ? 'ブリオはAI・音声・カレンダーなどの高度な機能を使うときに消費され、2時間ごとに1つ自動補充されます。'
           : lang === 'zh' ? 'Brio在使用AI、语音、日历等高级功能时消耗，每2小时自动补充1个。'
           : 'Brio is used for AI, voice, and calendar features. It auto-recharges 1 per 2 hours.',
    ad:      lang === 'ko' ? '광고 보고 ⚡5 즉시 충전' : lang === 'ja' ? '広告を見て ⚡5 即時チャージ' : lang === 'zh' ? '看广告立即充值 ⚡5' : 'Watch Ad — get ⚡5 now',
    close:   lang === 'ko' ? '나중에' : lang === 'ja' ? 'あとで' : lang === 'zh' ? '稍后' : 'Later',
    balance: lang === 'ko' ? `현재 잔량: ⚡${balance}` : lang === 'ja' ? `現在残量: ⚡${balance}` : lang === 'zh' ? `当前余量: ⚡${balance}` : `Current balance: ⚡${balance}`,
  }

  return (
    <div className="modal-overlay" ref={overlayRef} onClick={onClose}>
      <div className="brio-charge-modal" ref={modalRef} onClick={e => e.stopPropagation()} {...swipeHandlers}>
        <div ref={handleRef}>
          <div className="modal-drag-handle-zone"><div className="modal-drag-handle" /></div>
        </div>

        <div className="brio-charge-content">
          <div className="brio-charge-icon">⚡</div>
          <h3 className="brio-charge-title">{t.title}</h3>
          <p className="brio-charge-body">{t.body}</p>
          <p className="brio-charge-balance">{t.balance}</p>

          <button className="brio-charge-ad-btn" onClick={handleWatchAd} disabled={adLoading}>
            {adLoading
              ? (lang === 'ko' ? '광고 준비 중...' : lang === 'ja' ? '広告準備中...' : lang === 'zh' ? '广告加载中...' : 'Loading ad...')
              : t.ad}
          </button>

          {adError && (
            <p style={{ fontSize: '12px', color: 'var(--color-error)', margin: '8px 0 0', textAlign: 'center' }}>
              {lang === 'ko' ? '광고를 불러오지 못했어요. 잠시 후 다시 시도해주세요.' : lang === 'ja' ? '広告を読み込めませんでした。後でもう一度試してください。' : lang === 'zh' ? '无法加载广告，请稍后重试。' : 'Ad failed to load. Please try again later.'}
            </p>
          )}

          <button className="brio-charge-manual-btn" onClick={onClose}>
            {nextChargeLabel ? `${t.close} · ${nextChargeLabel}` : t.close}
          </button>
        </div>
      </div>
    </div>
  )
}
