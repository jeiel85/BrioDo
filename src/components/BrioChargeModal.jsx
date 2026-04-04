import { useSwipeToDismiss } from '../hooks/useSwipeToDismiss'
import { trackEngagement } from '../hooks/useAchievements'
import { useRef, useState } from 'react'
import { showRewardedAd } from '../hooks/useAdMob'
import { MAX_BRIO } from '../hooks/useBrio'

/**
 * 브리오 충전 모달
 * - 광고 시청 → +5 브리오 (AdMob 보상형 광고 연동)
 * - 자동 충전까지 남은 시간 안내 (2시간마다 1개)
 * - 잔량 게이지 + 충전 타이머 진행률 표시
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

export function BrioChargeModal({ onClose, onCharge, balance, maxBrio = 10, nextChargeMs, chargeProgress = 0, lang }) {
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

  // 잔량 게이지 색상 — 부족하면 빨강, 충분하면 주황, 가득 차면 초록
  // 게이지는 자동 충전 상한(MAX_BRIO=10) 기준 — 수동 충전으로 초과 보유 시 100% 표시
  const balancePct = Math.min(balance / MAX_BRIO * 100, 100)
  const balanceColor = balance <= 2 ? 'var(--color-error)' : balance < maxBrio ? 'var(--color-primary)' : '#4caf50'

  // 다음 자동 충전 진행률 (0~1) → 가득 찼으면 표시 안 함
  const timerPct = Math.min(chargeProgress * 100, 100)

  const t = {
    title:      balance <= 0
      ? (lang === 'ko' ? '⚡ 브리오가 부족해요' : lang === 'ja' ? '⚡ ブリオが足りません' : lang === 'zh' ? '⚡ 能量不足' : '⚡ Out of Brio')
      : (lang === 'ko' ? '⚡ 브리오' : lang === 'ja' ? '⚡ ブリオ' : lang === 'zh' ? '⚡ Brio能量' : '⚡ Brio'),
    what:       lang === 'ko' ? '브리오(Brio)란?'
              : lang === 'ja' ? 'ブリオとは？'
              : lang === 'zh' ? '什么是Brio？'
              : 'What is Brio?',
    whatDesc:   lang === 'ko' ? 'BrioDo의 활력 에너지예요. AI 스마트 입력(⚡2), 음성 인식, 캘린더 동기화 등 고급 기능을 쓸 때 소모돼요.'
              : lang === 'ja' ? 'BrioDo の活力エネルギーです。AIスマート入力(⚡2)・音声認識・カレンダー同期などの高度な機能を使うときに消費されます。'
              : lang === 'zh' ? 'BrioDo的活力能量。使用AI智能输入(⚡2)、语音识别、日历同步等高级功能时消耗。'
              : 'The energy powering BrioDo\'s smart features. Used when you use AI smart input (⚡2), voice input, or calendar sync.',
    body:       lang === 'ko' ? '2시간마다 1개씩 자동으로 충전되고, 광고를 보면 즉시 5개를 충전할 수 있어요.'
              : lang === 'ja' ? '2時間ごとに1つ自動補充され、広告を見れば即座に5つチャージできます。'
              : lang === 'zh' ? '每2小时自动补充1个，看广告可立即充值5个。'
              : 'Auto-recharges 1 every 2 hours. Watch an ad to instantly get 5 more.',
    ad:         lang === 'ko' ? '광고 보고 ⚡5 즉시 충전' : lang === 'ja' ? '広告を見て ⚡5 即時チャージ' : lang === 'zh' ? '看广告立即充值 ⚡5' : 'Watch Ad — get ⚡5 now',
    close:      lang === 'ko' ? '나중에' : lang === 'ja' ? 'あとで' : lang === 'zh' ? '稍后' : 'Later',
    balanceLabel: lang === 'ko' ? '현재 잔량' : lang === 'ja' ? '現在残量' : lang === 'zh' ? '当前余量' : 'Balance',
    nextCharge: lang === 'ko' ? '다음 자동 충전' : lang === 'ja' ? '次の自動充電' : lang === 'zh' ? '下次自动充值' : 'Next auto-charge',
    full:       lang === 'ko' ? '가득 참' : lang === 'ja' ? '満タン' : lang === 'zh' ? '已满' : 'Full',
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
          <div className="brio-what-section">
            <p className="brio-what-label">{t.what}</p>
            <p className="brio-charge-body">{t.whatDesc}</p>
          </div>
          <p className="brio-charge-body" style={{ marginTop: '8px' }}>{t.body}</p>

          {/* 잔량 게이지 */}
          <div className="brio-gauge-section">
            <div className="brio-gauge-label">
              <span>{t.balanceLabel}</span>
              <span style={{ fontWeight: 700, color: balanceColor }}>⚡{balance}</span>
            </div>
            <div className="brio-gauge-bar-bg">
              <div
                className="brio-gauge-bar-fill"
                style={{ width: `${balancePct}%`, background: balanceColor, transition: 'width 0.4s ease' }}
              />
            </div>
          </div>

          {/* 다음 자동 충전 타이머 진행률 — 가득 찼으면 숨김 */}
          {balance < maxBrio && (
            <div className="brio-gauge-section" style={{ marginTop: '10px' }}>
              <div className="brio-gauge-label">
                <span>{t.nextCharge}</span>
                <span style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)' }}>
                  {nextChargeLabel || t.full}
                </span>
              </div>
              <div className="brio-gauge-bar-bg">
                <div
                  className="brio-gauge-bar-fill brio-timer-bar"
                  style={{ width: `${timerPct}%`, transition: 'width 0.4s ease' }}
                />
              </div>
            </div>
          )}

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
