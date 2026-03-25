// 반복 일정: 특정 날짜에 발생하는지 여부 확인
export const matchesRecurrence = (todo, dateStr) => {
  const { recurrence, date: startDate } = todo
  if (!recurrence || recurrence.type === 'none') return todo.date === dateStr
  if (dateStr < startDate) return false
  if (recurrence.endDate && dateStr > recurrence.endDate) return false

  const [sy, sm, sd] = startDate.split('-').map(Number)
  const [ty, tm, td] = dateStr.split('-').map(Number)
  const start = new Date(sy, sm - 1, sd)
  const target = new Date(ty, tm - 1, td)
  const diffMs = target - start
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  switch (recurrence.type) {
    case 'daily': return diffDays >= 0
    case 'weekly': return diffDays >= 0 && diffDays % 7 === 0
    case 'monthly': return sd === td && (ty > sy || (ty === sy && tm > sm) || dateStr === startDate)
    default: return false
  }
}

// 반복 일정의 다음 발생일 계산 (오늘 이후)
export const getNextOccurrence = (todo, todayStr) => {
  const { recurrence, date: startDate } = todo
  if (!recurrence || recurrence.type === 'none') return todo.date
  const checkFrom = startDate > todayStr ? startDate : todayStr
  // 최대 366일 탐색
  for (let i = 0; i <= 366; i++) {
    const d = new Date(checkFrom)
    d.setDate(d.getDate() + i)
    const dateStr = d.toISOString().split('T')[0]
    if (recurrence.endDate && dateStr > recurrence.endDate) return null
    if (matchesRecurrence(todo, dateStr)) return dateStr
  }
  return null
}

export const getLocalDateString = (d) => {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0]
}

export const getLangLocale = (lang) =>
  lang === 'ko' ? 'ko-KR' : lang === 'ja' ? 'ja-JP' : lang === 'zh' ? 'zh-CN' : 'en-US'

export const formatTime = (timeStr, noTimeLabel) => {
  if (!timeStr || timeStr === noTimeLabel) return ''
  if (/^\d{2}:\d{2}$/.test(timeStr)) return timeStr
  if (/^\d{2}:\d{2}/.test(timeStr)) return timeStr.slice(0, 5)
  return timeStr
}

export function calcStreak(todos, todayStr) {
  let streak = 0
  const d = new Date(todayStr)
  for (let i = 0; i < 365; i++) {
    const dateStr = d.toISOString().slice(0, 10)
    const hasDone = todos.some(t => t.completed && t.date === dateStr)
    if (!hasDone && i > 0) break
    if (hasDone) streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}
