// src/calendar.js
export const getCalendarAccessToken = () => {
  return localStorage.getItem('googleAccessToken')
}

export const fetchCalendars = async (token) => {
  const res = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('Failed to fetch calendars')
  return res.json()
}

export const createBlendDoCalendar = async (token) => {
  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars', {
    method: 'POST',
    headers: { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ summary: 'BlendDo', timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone })
  })
  if (!res.ok) throw new Error('Failed to create calendar')
  return res.json()
}

export const ensureBlendDoCalendar = async () => {
  const token = getCalendarAccessToken()
  if (!token) return null // No token, cannot sync

  // Local 저장 확인
  const savedId = localStorage.getItem('blenddo-calendar-id')
  if (savedId) return savedId

  try {
    const data = await fetchCalendars(token)
    const blenddoCal = data.items?.find(cal => cal.summary === 'BlendDo')
    if (blenddoCal) {
      localStorage.setItem('blenddo-calendar-id', blenddoCal.id)
      return blenddoCal.id
    }

    const newCal = await createBlendDoCalendar(token)
    localStorage.setItem('blenddo-calendar-id', newCal.id)
    return newCal.id
  } catch (error) {
    console.error('ensureBlendDoCalendar error:', error)
    if (error.message.includes('401')) {
      // Token expired or invalid
      localStorage.removeItem('googleAccessToken')
    }
    return null
  }
}

const buildEventPayload = (todo) => {
  // 제목에 B] 접두사 추가 (이미 있으면 중복 추가 방지)
  const titleWithPrefix = todo.text?.startsWith('B]') ? todo.text : `B] ${todo.text || '할 일'}`
  
  const payload = {
    summary: titleWithPrefix,
    description: todo.description || '',
  }

  if (todo.time) {
    // 특정 시간이 있는 경우
    // date: "YYYY-MM-DD", time: "HH:MM"
    const startStr = `${todo.date}T${todo.time}:00`
    
    const startDt = new Date(startStr)
    // End time을 1시간 뒤로 설정 (기본값)
    const endDt = new Date(startDt.getTime() + 60 * 60 * 1000)

    const parseTz = (dt) => {
      const p = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString()
      return p.substring(0, 19) + (dt.getTimezoneOffset() <= 0 ? '+' : '-') + 
             String(Math.abs(dt.getTimezoneOffset() / 60)).padStart(2, '0') + ':00'
    }

    payload.start = { dateTime: parseTz(startDt), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }
    payload.end = { dateTime: parseTz(endDt), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }
  } else {
    // 종일 일정
    payload.start = { date: todo.date }
    // Google Calendar 종일 일정의 종료일은 다음 날이어야 함
    const nextDay = new Date(todo.date)
    nextDay.setDate(nextDay.getDate() + 1)
    const endStr = new Date(nextDay.getTime() - nextDay.getTimezoneOffset() * 60000).toISOString().split('T')[0]
    payload.end = { date: endStr }
  }

  return payload
}

export const syncEventToGoogle = async (todo) => {
  const token = getCalendarAccessToken()
  if (!token) return null
  
  const calendarId = await ensureBlendDoCalendar()
  if (!calendarId) return null

  const payload = buildEventPayload(todo)

  try {
    let method = 'POST'
    let url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`
    
    if (todo.googleEventId) {
      method = 'PUT'
      url += `/${todo.googleEventId}`
    }

    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!res.ok) {
      if (res.status === 401) localStorage.removeItem('googleAccessToken')
      // If it's a 404 on PUT, the event was deleted from Google Calendar. We might need to recreate it.
      if (res.status === 404 && method === 'PUT') {
        const createRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        })
        if (createRes.ok) {
          const data = await createRes.json()
          return data.id
        }
      }
      throw new Error(`Google Calendar API Error: ${res.status}`)
    }

    const data = await res.json()
    return data.id
  } catch (error) {
    console.error('syncEventToGoogle error:', error)
    return null
  }
}

export const deleteEventFromGoogle = async (googleEventId) => {
  const token = getCalendarAccessToken()
  if (!token || !googleEventId) return
  
  const calendarId = await ensureBlendDoCalendar()
  if (!calendarId) return

  try {
    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${googleEventId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    
    if (res.status === 401) localStorage.removeItem('googleAccessToken')
  } catch (error) {
    console.error('deleteEventFromGoogle error:', error)
  }
}

// 캘린더에서 역으로 불러오는 로직 (양방향용)
export const fetchEventsFromGoogle = async () => {
  const token = getCalendarAccessToken()
  if (!token) return []
  
  const calendarId = await ensureBlendDoCalendar()
  if (!calendarId) return []

  try {
    // From 30 days ago to future
    const timeMin = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${timeMin}&singleEvents=true`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!res.ok) {
      if (res.status === 401) localStorage.removeItem('googleAccessToken')
      throw new Error('Failed to fetch events')
    }
    const data = await res.json()
    return data.items || []
  } catch (error) {
    console.error('fetchEventsFromGoogle error:', error)
    return []
  }
}
