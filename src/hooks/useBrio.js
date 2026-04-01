import { useState, useCallback, useEffect, useRef } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'

const BRIO_KEY = 'briodo-brio'
export const MAX_BRIO = 10
export const MAX_BRIO_OVERFLOW = 50 // 업적·광고로 최대 보유 가능 (자동 충전은 MAX_BRIO까지)
export const DAILY_BRIO = MAX_BRIO // backward compat
export const CHARGE_INTERVAL_MS = 2 * 60 * 60 * 1000 // 2시간마다 1개 자동 충전

// 난이도 → 브리오 보상 (재조정 — 수익 균형화)
export const BRIO_REWARD_BY_DIFFICULTY = {
  1: 1, 2: 1, 3: 2, 4: 2, 5: 3,
  6: 4, 7: 5, 8: 7, 9: 10, 10: 15,
}
export const BRIO_REWARD_SECRET = 10 // 비밀 업적 기본 보상

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
    // 기존 날짜 기반 데이터 마이그레이션
    if (saved.date && !saved.lastChargeAt) {
      return {
        balance: Math.min(typeof saved.balance === 'number' ? saved.balance : MAX_BRIO, MAX_BRIO_OVERFLOW),
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
      balance: Math.min(typeof saved.balance === 'number' ? saved.balance : MAX_BRIO, MAX_BRIO_OVERFLOW),
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

// Firestore userSettings/{uid}.brio 에 비동기 저장 (실패 무시)
async function writeToFirestore(uid, data) {
  try {
    await setDoc(
      doc(db, 'userSettings', uid),
      { brio: { balance: data.balance, lastChargeAt: data.lastChargeAt, totalEarned: data.totalEarned || 0, totalSpent: data.totalSpent || 0 } },
      { merge: true }
    )
  } catch (e) {
    console.warn('[useBrio] Firestore sync failed', e)
  }
}

export function useBrio(user) {
  const [brioData, setBrioData] = useState(() => {
    const data = getBrioData()
    saveBrioData(data)
    return data
  })

  const syncTimerRef = useRef(null)
  const uid = user?.uid || null

  // Firestore debounce 쓰기 (2초) — 너무 잦은 쓰기 방지
  const debouncedSync = useCallback((data) => {
    if (!uid) return
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current)
    syncTimerRef.current = setTimeout(() => writeToFirestore(uid, data), 2000)
  }, [uid])

  // 로그인 시 Firestore에서 불러와 로컬과 병합 (더 높은 잔량 사용)
  useEffect(() => {
    if (!uid) return
    ;(async () => {
      try {
        const snap = await getDoc(doc(db, 'userSettings', uid))
        if (snap.exists() && snap.data()?.brio) {
          const remote = snap.data().brio
          const remoteCharged = applyTimeCharge({ ...remote })
          setBrioData(prev => {
            const local = getBrioData()
            // 더 높은 잔량 채택 — 사용자 데이터 유실 방지
            const merged = remoteCharged.balance >= local.balance
              ? { ...remoteCharged }
              : { ...local, totalEarned: Math.max(local.totalEarned || 0, remoteCharged.totalEarned || 0), totalSpent: Math.max(local.totalSpent || 0, remoteCharged.totalSpent || 0) }
            saveBrioData(merged)
            return merged
          })
        }
      } catch (e) {
        console.warn('[useBrio] Firestore load failed', e)
      }
    })()
  }, [uid])

  // 1분마다 시간 충전 체크 (앱 활성 상태에서 실시간 반영)
  useEffect(() => {
    const timer = setInterval(() => {
      const charged = getBrioData()
      setBrioData(prev => {
        if (charged.balance !== prev.balance) {
          saveBrioData(charged)
          if (uid) debouncedSync(charged)
          return charged
        }
        return prev
      })
    }, 60 * 1000)
    return () => clearInterval(timer)
  }, [uid, debouncedSync])

  const balance = brioData.balance

  // 다음 충전까지 남은 시간 (ms) — 가득 찼으면 null
  const nextChargeMs = balance >= MAX_BRIO
    ? null
    : Math.max(0, (brioData.lastChargeAt || 0) + CHARGE_INTERVAL_MS - Date.now())

  // 충전 진행률 (0~1) — 다음 자동 충전까지의 경과 비율
  const chargeProgress = balance >= MAX_BRIO
    ? 1
    : nextChargeMs != null
      ? 1 - nextChargeMs / CHARGE_INTERVAL_MS
      : 0

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
    debouncedSync(updated)
    return true
  }, [debouncedSync])

  // 브리오 충전 (업적 보상·광고 등 — MAX_BRIO_OVERFLOW 상한)
  const charge = useCallback((amount) => {
    const current = getBrioData()
    const newBalance = Math.min(current.balance + amount, MAX_BRIO_OVERFLOW)
    const updated = {
      ...current,
      balance: newBalance,
      totalEarned: (current.totalEarned || 0) + amount,
    }
    saveBrioData(updated)
    setBrioData(updated)
    debouncedSync(updated)
  }, [debouncedSync])

  const hasBrio = useCallback((amount = 1) => balance >= amount, [balance])

  return { balance, consume, charge, hasBrio, maxBrio: MAX_BRIO, dailyLimit: MAX_BRIO, nextChargeMs, chargeProgress }
}
