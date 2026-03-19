import { useState, useEffect, useRef, useMemo } from 'react'
import { getLocalDateString } from '../utils/helpers'

export function useCalendarNav(lang) {
  const todayStr = getLocalDateString(new Date())
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [baseDate, setBaseDate] = useState(new Date())

  const weekScrollRef = useRef(null)
  const hasScrolledInit = useRef(false)

  const handleGoToToday = () => {
    const today = new Date()
    setSelectedDate(getLocalDateString(today))
    setBaseDate(today)
  }

  const dateRange = useMemo(() => {
    if (!baseDate) return []
    const dates = []
    const locale = lang === 'ko' ? 'ko-KR' : lang === 'ja' ? 'ja-JP' : lang === 'zh' ? 'zh-CN' : 'en-US'

    const startOfWeek = new Date(baseDate)
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())

    const rangeStart = new Date(startOfWeek)
    rangeStart.setDate(rangeStart.getDate() - 14)

    for (let i = 0; i < 35; i++) {
      const d = new Date(rangeStart); d.setDate(rangeStart.getDate() + i)
      dates.push({
        full: getLocalDateString(d),
        dayName: d.toLocaleDateString(locale, { weekday: 'short' }),
        dayNumber: d.getDate(),
        weekIndex: Math.floor(i / 7)
      })
    }
    return dates
  }, [baseDate, lang])

  // 주간 스크롤 초기화 (현재 주 중앙 정렬)
  useEffect(() => {
    if (weekScrollRef.current && baseDate) {
      const container = weekScrollRef.current
      let retryTimer
      let forceTimer
      const startTime = Date.now()

      const align = () => {
        if (!container) return
        const cw = container.clientWidth
        const sw = container.scrollWidth

        if (cw < 50 || sw < cw * 4) {
          if (Date.now() - startTime < 3000) retryTimer = setTimeout(align, 50)
          return
        }

        hasScrolledInit.current = false
        container.style.scrollSnapType = 'none'

        forceTimer = setInterval(() => {
          if (weekScrollRef.current) {
            weekScrollRef.current.scrollLeft = weekScrollRef.current.clientWidth * 2
          }
          if (Date.now() - startTime > 1000) {
            clearInterval(forceTimer)
            if (weekScrollRef.current) {
              weekScrollRef.current.style.scrollSnapType = 'x mandatory'
            }
            hasScrolledInit.current = true
          }
        }, 30)
      }
      align()
      return () => {
        clearTimeout(retryTimer)
        if (forceTimer) clearInterval(forceTimer)
      }
    }
  }, [baseDate])

  const handleWeekScroll = () => {
    const container = weekScrollRef.current
    if (!container || !hasScrolledInit.current) return
    const weekWidth = container.clientWidth

    if (container.scrollLeft < weekWidth * 0.3) {
      hasScrolledInit.current = false
      const d = new Date(baseDate)
      d.setDate(d.getDate() - 7)
      setBaseDate(d)
    }
    if (container.scrollLeft > weekWidth * 3.7) {
      hasScrolledInit.current = false
      const d = new Date(baseDate)
      d.setDate(d.getDate() + 7)
      setBaseDate(d)
    }
  }

  return {
    todayStr,
    selectedDate,
    setSelectedDate,
    baseDate,
    setBaseDate,
    dateRange,
    weekScrollRef,
    handleGoToToday,
    handleWeekScroll
  }
}
