import { useState, useCallback } from 'react'

const BRIO_KEY = 'briodo-brio'
export const DAILY_BRIO = 10

// 난이도 → 브리오 보상 테이블
export const BRIO_REWARD_BY_DIFFICULTY = {
  1: 1, 2: 2, 3: 3, 4: 4, 5: 5,
  6: 7, 7: 10, 8: 15, 9: 20, 10: 30,
}
export const BRIO_REWARD_SECRET = 30 // 비밀 업적 기본 보상 (hidden achievement에서 개별 지정)

function getBrioData() {
  const today = new Date().toISOString().slice(0, 10)
  try {
    const saved = JSON.parse(localStorage.getItem(BRIO_KEY) || '{}')
    if (saved.date !== today) {
      // 자정 리셋: 잔량 유지하지 않고 DAILY_BRIO로 초기화
      return { date: today, balance: DAILY_BRIO, totalEarned: saved.totalEarned || 0, totalSpent: saved.totalSpent || 0 }
    }
    return { date: today, balance: DAILY_BRIO, totalEarned: 0, totalSpent: 0, ...saved }
  } catch {
    return { date: today, balance: DAILY_BRIO, totalEarned: 0, totalSpent: 0 }
  }
}

function saveBrioData(data) {
  localStorage.setItem(BRIO_KEY, JSON.stringify(data))
}

export function useBrio() {
  const [brioData, setBrioData] = useState(() => getBrioData())

  const balance = brioData.balance

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

  // 브리오 충전
  const charge = useCallback((amount) => {
    const current = getBrioData()
    const updated = {
      ...current,
      balance: current.balance + amount,
      totalEarned: (current.totalEarned || 0) + amount,
    }
    saveBrioData(updated)
    setBrioData(updated)
  }, [])

  const hasBrio = (amount = 1) => balance >= amount

  return { balance, consume, charge, hasBrio, dailyLimit: DAILY_BRIO }
}
