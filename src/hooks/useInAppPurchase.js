import { useState, useCallback, useEffect } from 'react'

// In-app Purchase Product IDs
export const PRODUCTS = {
  // Subscription: BrioDo Pro
  PRO_MONTHLY: 'briodo_pro_monthly',
  PRO_YEARLY: 'briodo_pro_yearly',
  // One-time: Coffee
  COFFEE: 'briodo_coffee',
  COFFEE_PREMIUM: 'briodo_coffee_premium'
}

// Subscription Benefits
export const PRO_BENEFITS = {
  monthly: [
    'AI 사용 제한 해제 (무제한)',
    '프리미엄 테마解锁',
    '모든 광고 제거',
    '다기기 실시간 동기화'
  ],
  yearly: [
    '월간 요금 대비 50% 할인',
    'AI 사용 제한 해제 (무제한)',
    '프리미엄 테마解锁',
    '모든 광고 제거',
    '다기기 실시간 동기화',
    '우선 지원 지원'
  ]
}

// Coffee Benefits
export const COFFEE_BENEFITS = [
  '개발자에게 커피 한 잔 사주기',
  '심사위원 ❤️을 전합니다',
  'BrioDo 광고 없이 계속 사용할 수 있어요'
]

/**
 * In-app Purchase Hook
 * Note: Requires @capacitor-community/in-app-purchases plugin
 * This is a placeholder implementation for future integration
 */
export function useInAppPurchase() {
  const [isPro, setIsPro] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Load subscription status on mount
  useEffect(() => {
    loadSubscriptionStatus()
  }, [])

  const loadSubscriptionStatus = useCallback(async () => {
    try {
      // Check localStorage for cached subscription status
      const cached = localStorage.getItem('briodo-pro-status')
      if (cached) {
        const status = JSON.parse(cached)
        setIsPro(status.isActive)
      }

      // TODO: Implement actual subscription check via backend
      // This would typically call your backend API which verifies
      // the purchase with Google Play

    } catch (e) {
      console.error('Failed to load subscription status:', e)
    }
  }, [])

  const purchaseProMonthly = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // TODO: Implement actual purchase flow
      // const result = await InAppPurchase.purchase({ id: PRODUCTS.PRO_MONTHLY })

      // Placeholder: Simulate successful purchase
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Save status
      const status = {
        isActive: true,
        productId: PRODUCTS.PRO_MONTHLY,
        purchaseDate: new Date().toISOString(),
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }
      localStorage.setItem('briodo-pro-status', JSON.stringify(status))
      setIsPro(true)

      return true
    } catch (e) {
      console.error('Purchase failed:', e)
      setError(e.message || 'Purchase failed')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  const purchaseProYearly = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // TODO: Implement actual purchase flow
      await new Promise(resolve => setTimeout(resolve, 1000))

      const status = {
        isActive: true,
        productId: PRODUCTS.PRO_YEARLY,
        purchaseDate: new Date().toISOString(),
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      }
      localStorage.setItem('briodo-pro-status', JSON.stringify(status))
      setIsPro(true)

      return true
    } catch (e) {
      console.error('Purchase failed:', e)
      setError(e.message || 'Purchase failed')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  const purchaseCoffee = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // TODO: Implement actual purchase flow
      await new Promise(resolve => setTimeout(resolve, 1000))

      // One-time purchase - just record it
      const purchases = JSON.parse(localStorage.getItem('briodo-coffee-purchases') || '[]')
      purchases.push({
        productId: PRODUCTS.COFFEE,
        purchaseDate: new Date().toISOString()
      })
      localStorage.setItem('briodo-coffee-purchases', JSON.stringify(purchases))

      return true
    } catch (e) {
      console.error('Purchase failed:', e)
      setError(e.message || 'Purchase failed')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  const restorePurchases = useCallback(async () => {
    setIsLoading(true)
    try {
      // TODO: Implement actual restore flow
      // This would typically call InAppPurchase.restorePurchases()

      await loadSubscriptionStatus()
      return true
    } catch (e) {
      console.error('Restore failed:', e)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [loadSubscriptionStatus])

  return {
    isPro,
    isLoading,
    error,
    purchaseProMonthly,
    purchaseProYearly,
    purchaseCoffee,
    restorePurchases
  }
}

/**
 * Check if user has Pro features unlocked
 */
export function checkIsPro() {
  try {
    const cached = localStorage.getItem('briodo-pro-status')
    if (!cached) return false

    const status = JSON.parse(cached)
    if (!status.isActive) return false

    // Check expiry for subscriptions
    if (status.expiryDate) {
      const expiry = new Date(status.expiryDate)
      if (expiry < new Date()) {
        // Subscription expired
        localStorage.removeItem('briodo-pro-status')
        return false
      }
    }

    return true
  } catch {
    return false
  }
}
