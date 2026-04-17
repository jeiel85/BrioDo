import { useEffect, useRef } from 'react'
import { checkIsPro } from '../hooks/useInAppPurchase'

/**
 * Native Ad Component for TodoList
 * Displays AdMob Native Ads between todo items
 */
export function NativeAdCard({ position }) {
  const containerRef = useRef(null)

  useEffect(() => {
    // Don't show ads for Pro users
    if (checkIsPro()) return

    // TODO: Implement actual AdMob native ad loading
    // For now, show placeholder ad
    loadNativeAd()
  }, [])

  const loadNativeAd = async () => {
    // Placeholder: In production, load actual native ad
    // using @capacitor-community/admob's NativeAd plugin
  }

  return (
    <div
      ref={containerRef}
      className="native-ad-card"
      data-ad-position={position}
    >
      <div className="native-ad-label">Sponsored</div>
      <div className="native-ad-content">
        <div className="native-ad-icon">
          <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
        <div className="native-ad-text">
          <div className="native-ad-title">BrioDo Pro</div>
          <div className="native-ad-description">
            광고 없이 무제한 AI 사용. 프리미엄 테마解锁.
          </div>
        </div>
      </div>
      <button className="native-ad-cta">
        자세히 보기
      </button>
    </div>
  )
}

/**
 * Insert native ads into todo list
 * @param {Array} items - Original items (todos)
 * @param {number} adInterval - Insert ad every N items (default 5)
 * @returns {Array} - Items with ads interspersed
 */
export function intersperseAds(items, adInterval = 5) {
  // Don't show ads for Pro users
  if (checkIsPro()) return items

  const result = []
  let adCount = 0

  items.forEach((item, index) => {
    result.push(item)

    // Insert ad after every N items
    if ((index + 1) % adInterval === 0 && index < items.length - 1) {
      adCount++
      result.push({
        id: `__ad_${adCount}__`,
        isAd: true,
        position: index + 1
      })
    }
  })

  return result
}
