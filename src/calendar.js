// src/calendar.js
import { Capacitor } from '@capacitor/core'

export const getCalendarAccessToken = () => {
  return localStorage.getItem('googleAccessToken')
}

// 토큰 자동 갱신 (50분 경과 시 GoogleAuth.refresh() 호출)
export const refreshAccessTokenIfNeeded = async () => {
  if (!Capacitor.isNativePlatform()) return
  const savedAt = parseInt(localStorage.getItem('googleAccessTokenSavedAt') || '0')
  if (!savedAt) return
  const age = Date.now() - savedAt
  if (age < 50 * 60 * 1000) return  // 50분 미만이면 skip

  try {
    const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth')
    const refreshed = await GoogleAuth.refresh()
    if (refreshed?.accessToken) {
      localStorage.setItem('googleAccessToken', refreshed.accessToken)
      localStorage.setItem('googleAccessTokenSavedAt', Date.now().toString())
      console.log('Calendar token refreshed ✓')
    }
  } catch (e) {
    console.warn('Token refresh failed:', e)
  }
}

export const fetchCalendars = async (token) => {
  const res = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) {
    const body = await res.text()
    console.error(`fetchCalendars failed: HTTP ${res.status}`, body)
    throw new Error(`Failed to fetch calendars (${res.status})`)
  }
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

// 세션 내 캐시 (메모리): 재로그인 시 초기화 필요
let _sessionCalendarId = null

// 세션 캐시 초기화 (로그아웃 시 calendar.js 외부에서 호출)
export const resetCalendarSession = () => {
  _sessionCalendarId = null
  _ensureCalendarPromise = null
}

// 동시 다발 호출 시 하나의 요청만 실행되도록 싱글톤 프로미스
let _ensureCalendarPromise = null

export const ensureBlendDoCalendar = async () => {
  const token = getCalendarAccessToken()
  if (!token) return null

  // 세션 내 이미 검증된 ID가 있으면 즉시 반환
  if (_sessionCalendarId) return _sessionCalendarId

  // 이미 진행 중인 요청이 있으면 그 결과를 공유
  if (_ensureCalendarPromise) return _ensureCalendarPromise

  _ensureCalendarPromise = (async () => {
    try {
      // 항상 목록을 조회하여 캐시 유효성 검증 (증식 방지)
      const savedId = localStorage.getItem('blenddo-calendar-id')
      const data = await fetchCalendars(token)
      const matchingCals = data.items?.filter(cal => cal.summary === 'BlendDo') || []

      // 저장된 ID가 현재 목록에 있으면 재사용
      if (savedId && matchingCals.some(cal => cal.id === savedId)) {
        _sessionCalendarId = savedId
        return savedId
      }

      // 기존 BlendDo 캘린더 중 첫 번째 선택
      if (matchingCals.length >= 1) {
        localStorage.setItem('blenddo-calendar-id', matchingCals[0].id)
        _sessionCalendarId = matchingCals[0].id
        return matchingCals[0].id
      }

      // 없으면 새로 생성
      const newCal = await createBlendDoCalendar(token)
      localStorage.setItem('blenddo-calendar-id', newCal.id)
      _sessionCalendarId = newCal.id
      return newCal.id
    } catch (error) {
      console.error('ensureBlendDoCalendar error:', error)
      if (error.message.includes('401')) {
        localStorage.removeItem('googleAccessToken')
        _sessionCalendarId = null
      }
      return null
    } finally {
      _ensureCalendarPromise = null
    }
  })()

  return _ensureCalendarPromise
}

const PRIORITY_EMOJI = {
  low: '🔵',
  medium: '🟡',
  high: '🔴',
  urgent: '🚨'
}

const buildEventPayload = (todo) => {
  const priorityEmoji = PRIORITY_EMOJI[todo.priority] || '🟡'
  const completedPrefix = todo.completed ? '✅ ' : ''

  // 기존 B] 접두사가 있을 경우 제거 후 재포맷
  const cleanText = (todo.text || '할 일')
    .replace(/^(✅\s+)?(🔵|🟡|🔴|🚨)\s+B\]\s*/u, '')
    .replace(/^B\]\s*/, '')

  const payload = {
    summary: `${completedPrefix}${priorityEmoji} B] ${cleanText}`,
    description: todo.description || '',
  }

  if (todo.completed) {
    payload.colorId = '8'  // Google Calendar Graphite (회색)
  }

  if (todo.time) {
    const startStr = `${todo.date}T${todo.time}:00`
    const startDt = new Date(startStr)
    const endDt = new Date(startDt.getTime() + 60 * 60 * 1000)

    const parseTz = (dt) => {
      const p = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString()
      return p.substring(0, 19) + (dt.getTimezoneOffset() <= 0 ? '+' : '-') +
             String(Math.abs(dt.getTimezoneOffset() / 60)).padStart(2, '0') + ':00'
    }

    payload.start = { dateTime: parseTz(startDt), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }
    payload.end = { dateTime: parseTz(endDt), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }
  } else {
    payload.start = { date: todo.date }
    const nextDay = new Date(todo.date)
    nextDay.setDate(nextDay.getDate() + 1)
    const endStr = new Date(nextDay.getTime() - nextDay.getTimezoneOffset() * 60000).toISOString().split('T')[0]
    payload.end = { date: endStr }
  }

  return payload
}

export const syncEventToGoogle = async (todo) => {
  const token = getCalendarAccessToken()
  if (!token) {
    console.warn('syncEventToGoogle: no access token — calendar sync skipped')
    return null
  }

  await refreshAccessTokenIfNeeded()
  const freshToken = getCalendarAccessToken()
  if (!freshToken) return null

  const calendarId = await ensureBlendDoCalendar()
  if (!calendarId || typeof calendarId === 'object') return null

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
        Authorization: `Bearer ${freshToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!res.ok) {
      if (res.status === 401) localStorage.removeItem('googleAccessToken')
      if (res.status === 404 && method === 'POST') {
        console.warn('syncEventToGoogle: calendar not found, resetting cache and retrying...')
        localStorage.removeItem('blenddo-calendar-id')
        _sessionCalendarId = null
        const newCalendarId = await ensureBlendDoCalendar()
        if (newCalendarId) {
          const retryRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(newCalendarId)}/events`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${freshToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })
          if (retryRes.ok) {
            const data = await retryRes.json()
            return data.id
          }
        }
      }
      if (res.status === 404 && method === 'PUT') {
        const createRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${freshToken}`, 'Content-Type': 'application/json' },
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

  await refreshAccessTokenIfNeeded()
  const freshToken = getCalendarAccessToken()
  if (!freshToken) return

  const calendarId = await ensureBlendDoCalendar()
  if (!calendarId || typeof calendarId === 'object') return

  try {
    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${googleEventId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${freshToken}` }
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

  await refreshAccessTokenIfNeeded()
  const freshToken = getCalendarAccessToken()
  if (!freshToken) return []

  const calendarId = await ensureBlendDoCalendar()
  if (!calendarId || typeof calendarId === 'object') return []

  try {
    const timeMin = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${timeMin}&singleEvents=true`, {
      headers: { Authorization: `Bearer ${freshToken}` }
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
