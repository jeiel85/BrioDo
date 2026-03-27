import { useSwipeToDismiss } from '../hooks/useSwipeToDismiss'
import { useRef } from 'react'

/**
 * 브리오 충전 모달
 * - 광고 시청 → +5 브리오 (Phase 1: 즉시 지급, Phase 2: AdMob 연동)
 */
export function BrioChargeModal({ onClose, onCharge, balance, lang }) {
  const handleRef = useRef(null)
  const { overlayRef, modalRef, swipeHandlers } = useSwipeToDismiss(onClose, { handleRef })

  const handleWatchAd = () => {
    // TODO: Phase 2에서 AdMob 보상형 광고로 교체
    // import { showRewardedAd } from '../hooks/useAdMob'
    // showRewardedAd((amount) => { onCharge(amount); onClose() })
    onCharge(5)
    onClose()
  }

  const t = {
    title:   lang === 'ko' ? '⚡ 브리오가 부족해요' : lang === 'ja' ? '⚡ ブリオが足りません' : lang === 'zh' ? '⚡ 能量不足' : '⚡ Out of Brio',
    body:    lang === 'ko' ? '짧은 광고를 보고 브리오를 충전하세요.' : lang === 'ja' ? '短い広告を見てブリオを充電しましょう。' : lang === 'zh' ? '观看短视频广告来补充能量。' : 'Watch a short ad to recharge your Brio.',
    ad:      lang === 'ko' ? '광고 보고 ⚡5 충전' : lang === 'ja' ? '広告を見て ⚡5 チャージ' : lang === 'zh' ? '看广告充值 ⚡5' : 'Watch Ad for ⚡5',
    manual:  lang === 'ko' ? '수동 입력으로 계속하기' : lang === 'ja' ? '手動入力で続ける' : lang === 'zh' ? '使用手动输入继续' : 'Continue with manual input',
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

          <button className="brio-charge-ad-btn" onClick={handleWatchAd}>
            {t.ad}
          </button>
          <button className="brio-charge-manual-btn" onClick={onClose}>
            {t.manual}
          </button>
        </div>
      </div>
    </div>
  )
}
