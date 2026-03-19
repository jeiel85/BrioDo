export const getLocalDateString = (d) => {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0]
}

export const formatTime = (timeStr, noTimeLabel) => {
  if (!timeStr || timeStr === noTimeLabel) return ''
  if (/^\d{2}:\d{2}$/.test(timeStr)) return timeStr
  if (/^\d{2}:\d{2}/.test(timeStr)) return timeStr.slice(0, 5)
  return timeStr
}
