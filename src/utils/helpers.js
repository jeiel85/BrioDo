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

/**
 * Calculate contribution graph data (GitHub-style grass)
 * @param {Array} todos - All todos
 * @param {number} weeks - Number of weeks to display (default 52 = 1 year)
 * @returns {Object} - { grid: 2D array of { date, count, level }, stats }
 */
export function calcContributionGraph(todos, weeks = 52) {
  const grid = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Calculate start date (beginning of week, weeks ago)
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - (weeks * 7) - startDate.getDay())

  // Build date -> completed count map
  const dateCountMap = {}
  todos.forEach(todo => {
    if (todo.completed && todo.date) {
      dateCountMap[todo.date] = (dateCountMap[todo.date] || 0) + 1
    }
  })

  // Find max count for level calculation
  const counts = Object.values(dateCountMap)
  const maxCount = Math.max(...counts, 1)

  // Generate grid (weeks x 7 days)
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  let currentDate = new Date(startDate)

  for (let w = 0; w < weeks; w++) {
    const week = []
    for (let d = 0; d < 7; d++) {
      const dateStr = currentDate.toISOString().slice(0, 10)
      const count = dateCountMap[dateStr] || 0
      const isFuture = currentDate > today
      const isToday = dateStr === today.toISOString().slice(0, 10)

      // Level 0-4 based on activity intensity
      let level = 0
      if (!isFuture && count > 0) {
        const ratio = count / maxCount
        if (ratio >= 0.75) level = 4
        else if (ratio >= 0.5) level = 3
        else if (ratio >= 0.25) level = 2
        else level = 1
      }

      week.push({ date: dateStr, count, level, isFuture, isToday })
      currentDate.setDate(currentDate.getDate() + 1)
    }
    grid.push({ week, dayNames })
  }

  // Calculate stats
  const totalDays = weeks * 7
  const activeDays = counts.length
  const totalCompleted = counts.reduce((a, b) => a + b, 0)
  const avgPerActiveDay = activeDays > 0 ? (totalCompleted / activeDays).toFixed(1) : 0

  return {
    grid,
    stats: {
      totalDays,
      activeDays,
      totalCompleted,
      avgPerActiveDay,
      maxCount
    }
  }
}

/**
 * Calculate monthly breakdown for contribution graph
 */
export function getContributionMonths(weeks, todayStr) {
  const months = []
  const today = new Date(todayStr)
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - (weeks * 7))

  let currentMonth = -1
  let weekIndex = 0

  while (weekIndex < weeks) {
    const weekDate = new Date(startDate)
    weekDate.setDate(weekDate.getDate() + (weekIndex * 7))
    const month = weekDate.getMonth()

    if (month !== currentMonth) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      months.push({ month: monthNames[month], weekIndex })
      currentMonth = month
    }
    weekIndex++
  }

  return months
}

/**
 * Find stale (old) uncompleted todos for Nudge feature
 * Returns todos that are:
 * - Not completed
 * - Created more than specified days ago
 *
 * @param {Array} todos - All todos
 * @param {number} daysThreshold - Days threshold (default 14 = 2 weeks)
 * @returns {Array} - Stale todos
 */
export function findStaleTodos(todos, daysThreshold = 14) {
  const now = new Date()
  const thresholdDate = new Date(now)
  thresholdDate.setDate(thresholdDate.getDate() - daysThreshold)
  const thresholdStr = thresholdDate.toISOString().slice(0, 10)

  return todos.filter(todo => {
    if (todo.completed) return false

    const createdDate = todo.createdAt
    if (!createdDate) return false

    // Handle timestamp (number) or date string
    let createdDateStr
    if (typeof createdDate === 'number') {
      createdDateStr = new Date(createdDate).toISOString().slice(0, 10)
    } else if (typeof createdDate === 'string') {
      createdDateStr = createdDate.slice(0, 10)
    } else if (createdDate?.toDate) {
      // Firebase Timestamp
      createdDateStr = createdDate.toDate().toISOString().slice(0, 10)
    } else {
      return false
    }

    return createdDateStr < thresholdStr
  }).slice(0, 5) // Limit to 5 items
}

/**
 * Build Nudge prompt for stale todos
 */
export function buildNudgePrompt(staleTodos, lang) {
  const taskList = staleTodos.map(t => `- "${t.text}"`).join('\n')
  const count = staleTodos.length

  if (lang === 'ko') {
    return `다음 할 일들이 2주 이상 방치되어 있습니다. 사용자에게 정리 제안을 해주세요.

방치된 할 일 (${count}개):
${taskList}

해당 할 일들을 오늘로 미루거나 삭제할 것을 부드럽게 권유해주세요.
"이 일정을 오늘로 미룰까요, 아니면 과감히 삭제할까요?" 같은 형식으로 응답해주세요.
마크다운 금지, 순수 텍스트만, 3-5줄 이내.`
  }
  if (lang === 'ja') {
    return `以下のタスクが2週間以上放置されています。整理を提案してください。

放置されたタスク (${count}個):
${taskList}

これらのタスクを今日の予定に延期するか、削除することを優しく勧めてください。
「このタスクを今日に延期しますか？それとも思い切って削除しますか？」のような形式で応答してください。
マークダウン禁止、テキストのみ、3-5行以内。`
  }
  if (lang === 'zh') {
    return `以下任务已闲置2周以上。请建议整理。

闲置任务 (${count}个):
${taskList}

请温和地建议将任务延期到今天或删除。
以"将这些任务延期到今天，还是果断删除？"的格式回复。
禁用markdown，纯文本，3-5行以内。`
  }
  return `These tasks have been neglected for 2+ weeks. Please suggest cleanup.

Neglected tasks (${count}):
${taskList}

Gently suggest rescheduling to today or deleting.
Respond in format like "Would you like to reschedule these tasks to today, or boldly delete them?"
No markdown, plain text only, 3-5 lines.`
}
