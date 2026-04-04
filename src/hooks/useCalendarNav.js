import { useState, useMemo } from 'react'
import { getLocalDateString } from '../utils/helpers'

export function useCalendarNav(lang) {
  const todayStr = getLocalDateString(new Date())
  const [selectedDate, setSelectedDateState] = useState(todayStr)
  const [calendarExpanded, setCalendarExpanded] = useState(false)
  const [viewMonth, setViewMonth] = useState(new Date())

  const locale = lang === 'ko' ? 'ko-KR' : lang === 'ja' ? 'ja-JP' : lang === 'zh' ? 'zh-CN' : 'en-US'

  const handleGoToToday = () => {
    const today = new Date()
    setSelectedDateState(getLocalDateString(today))
    setViewMonth(today)
    setCalendarExpanded(false)
  }

  // 날짜 선택 시 월간 달력 자동 축소
  const setSelectedDate = (dateStr) => {
    setSelectedDateState(dateStr)
    // viewMonth를 선택한 날짜의 달로 업데이트
    const d = new Date(dateStr + 'T00:00:00')
    setViewMonth(d)
    setCalendarExpanded(false)
  }

  // 현재 주 7개 날짜 (선택된 날짜 기준 일요일~토요일)
  const currentWeekDates = useMemo(() => {
    const base = new Date(selectedDate + 'T00:00:00')
    const sunday = new Date(base)
    sunday.setDate(base.getDate() - base.getDay())

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sunday)
      d.setDate(sunday.getDate() + i)
      return {
        full: getLocalDateString(d),
        dayName: d.toLocaleDateString(locale, { weekday: 'short' }),
        dayNumber: d.getDate(),
        dayOfWeek: d.getDay()
      }
    })
  }, [selectedDate, locale])

  // 월간 달력 그리드 (42칸 = 6주, null은 빈 칸)
  const monthGridDates = useMemo(() => {
    const year = viewMonth.getFullYear()
    const month = viewMonth.getMonth()

    const firstDay = new Date(year, month, 1)
    const startPadding = firstDay.getDay()

    const cells = Array(startPadding).fill(null)

    const daysInMonth = new Date(year, month + 1, 0).getDate()
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d)
      cells.push({
        full: getLocalDateString(date),
        dayNumber: d,
        dayOfWeek: date.getDay()
      })
    }

    while (cells.length % 7 !== 0) cells.push(null)

    return cells
  }, [viewMonth])

  // 요일 헤더 (일~토)
  const weekdayNames = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(2024, 0, 7 + i) // 2024-01-07 = 일요일
      return d.toLocaleDateString(locale, { weekday: 'narrow' })
    })
  }, [locale])

  // 월간 뷰 표시용 헤더 (예: "2026년 3월" / "March 2026")
  const viewMonthLabel = useMemo(() => {
    return viewMonth.toLocaleDateString(locale, { year: 'numeric', month: 'long' })
  }, [viewMonth, locale])

  const prevWeek = () => {
    const base = new Date(selectedDate + 'T00:00:00')
    base.setDate(base.getDate() - 7)
    setSelectedDateState(getLocalDateString(base))
    setViewMonth(base)
  }

  const nextWeek = () => {
    const base = new Date(selectedDate + 'T00:00:00')
    base.setDate(base.getDate() + 7)
    setSelectedDateState(getLocalDateString(base))
    setViewMonth(base)
  }

  const prevMonth = () => {
    setViewMonth(prev => {
      const d = new Date(prev)
      d.setMonth(d.getMonth() - 1)
      return d
    })
  }

  const nextMonth = () => {
    setViewMonth(prev => {
      const d = new Date(prev)
      d.setMonth(d.getMonth() + 1)
      return d
    })
  }

  const goToMonth = (year, month) => {
    setViewMonth(new Date(year, month, 1))
  }

  return {
    todayStr,
    selectedDate,
    setSelectedDate,
    calendarExpanded,
    setCalendarExpanded,
    viewMonth,
    viewMonthLabel,
    currentWeekDates,
    monthGridDates,
    weekdayNames,
    prevWeek,
    nextWeek,
    prevMonth,
    nextMonth,
    goToMonth,
    handleGoToToday
  }
}
