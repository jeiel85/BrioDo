import { useState, useCallback, useEffect } from 'react'

const BRIO_KEY = 'briodo-brio'
export const MAX_BRIO = 10
export const DAILY_BRIO = MAX_BRIO // backward compat
export const CHARGE_INTERVAL_MS = 2 * 60 * 60 * 1000 // 2시간마다 1개 자동 충전

// 난이도 → 브리오 보상 (재조정 — 수익 균형화)
// 구 버전: 1→1, 2→2, 3→3, 4→4, 5→5, 6→7, 7→10, 8→15, 9→20, 10→30
export const BRIO_REWARD_BY_DIFFICULTY = {
  1: 1, 2: 1, 3: 2, 4: 2, 5: 3,
  6: 4, 7: 5, 8: 7, 9: 10, 10: 15,
}
export const BRIO_REWARD_SECRET = 10 // 비밀 업적 기본 보상 (구: 30)

// 경과 시간 기반 자동 충전 계산
function applyTimeCharge(data) {
  if (data.balance >= MAX_BRIO) return data
  const now = Date.now()
  const lastCharge = data.lastChargeAt || now
  const elapsed = now - lastCharge
  const chargesEarned = Math.floor(elapsed / CHARGE_INTERVAL_MS)
  if (chargesEarned <= 0) return data
  const added = Math.min(chargesEarned, MAX_BRIO - data.balance)
  return {
    ...data,
    balance: data.balance + added,
    lastChargeAt: lastCharge + chargesEarned * CHARGE_INTERVAL_MS,
    totalEarned: (data.totalEarned || 0) + added,
  }
}

function getBrioData() {
  try {
    const saved = JSON.parse(localStorage.getItem(BRIO_KEY) || '{}')
    // 기존 날짜 기반 데이터 마이그레이션 (date 필드 있으면 시간 충전으로 전환)
    if (saved.date && !saved.lastChargeAt) {
      return {
        balance: typeof saved.balance === 'number' ? saved.balance : MAX_BRIO,
        lastChargeAt: Date.now(),
        totalEarned: saved.totalEarned || 0,
        totalSpent: saved.totalSpent || 0,
      }
    }
    const data = {
      balance: MAX_BRIO,
      lastChargeAt: Date.now(),
      totalEarned: 0,
      totalSpent: 0,
      ...saved,
    }
    return applyTimeCharge(data)
  } catch {
    return { balance: MAX_BRIO, lastChargeAt: Date.now(), totalEarned: 0, totalSpent: 0 }
  }
}

function saveBrioData(data) {
  try {
    localStorage.setItem(BRIO_KEY, JSON.stringify(data))
  } catch {}
}

export function useBrio() {
  const [brioData, setBrioData] = useState(() => {
    const data = getBrioData()
    saveBrioData(data)
    return data
  })

  // 1분마다 시간 충전 체크 (앱 활성 상태에서 실시간 반영)
  useEffect(() => {
    const timer = setInterval(() => {
      const charged = getBrioData()
      setBrioData(prev => {
        if (charged.balance !== prev.balance) {
          saveBrioData(charged)
          return charged
        }
        return prev
      })
    }, 60 * 1000)
    return () => clearInterval(timer)
  }, [])

  const balance = brioData.balance

  // 다음 충전까지 남은 시간 (ms) — 가득 찼으면 null
  const nextChargeMs = balance >= MAX_BRIO
    ? null
    : Math.max(0, (brioData.lastChargeAt || 0) + CHARGE_INTERVAL_MS - Date.now())

  // 브리오 소모 — 성공 시 true, 잔량 부족 시 false
  const consume = useCallback((amount = 1) => {
    const current = getBrioData()
    if (current.balance < amount) return false
    const updated = {
      ...current,
      balance: current.balance - amount,
      totalSpent: (current.totalSpent || 0) + amount,
    }
    saveBrioData(updated)
    setBrioData(updated)
    return true
  }, [])

  // 브리오 충전 (업적 보상·광고 등 — MAX_BRIO 상한 적용)
  const charge = useCallback((amount) => {
    const current = getBrioData()
    const updated = {
      ...current,
      balance: Math.min(current.balance + amount, MAX_BRIO),
      totalEarned: (current.totalEarned || 0) + amount,
    }
    saveBrioData(updated)
    setBrioData(updated)
  }, [])

  const hasBrio = useCallback((amount = 1) => balance >= amount, [balance])

  return { balance, consume, charge, hasBrio, maxBrio: MAX_BRIO, dailyLimit: MAX_BRIO, nextChargeMs }
}
