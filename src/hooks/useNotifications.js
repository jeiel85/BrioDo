import { LocalNotifications } from '@capacitor/local-notifications'

let permissionGranted = false

async function ensurePermission() {
  if (permissionGranted) return true
  const { display } = await LocalNotifications.checkPermissions()
  if (display === 'granted') { permissionGranted = true; return true }
  const result = await LocalNotifications.requestPermissions()
  permissionGranted = result.display === 'granted'
  return permissionGranted
}

// todo id(string) → 알림 id(number) 변환 (32bit 양수 범위 내)
function toNotifId(todoId) {
  let hash = 0
  for (let i = 0; i < todoId.length; i++) {
    hash = (Math.imul(31, hash) + todoId.charCodeAt(i)) | 0
  }
  return Math.abs(hash) || 1
}

function getChannelIdByPriority(priority) {
  if (priority === 'urgent') return 'briodo_urgent'
  if (priority === 'high') return 'briodo_high'
  if (priority === 'low') return 'briodo_low'
  return 'briodo_medium'
}

/**
 * reminderOffset: 몇 분 전 알림 (0=정각, 10=10분전, 30=30분전, 60=1시간전, null=알림없음)
 * 시간(time) 없는 종일 일정: localStorage의 allDayReminderTime('HH:MM') 사용
 */
export async function scheduleNotification(todo) {
  try {
    const { id, text, date, time, description, priority, reminderOffset } = todo
    if (!date) return
    if (reminderOffset === null || reminderOffset === undefined) return

    const ok = await ensurePermission()
    if (!ok) { console.warn('[Notif] 권한 없음'); return }

    let at
    if (time && time.includes(':')) {
      // 시간 있는 일정: time - reminderOffset 분
      const [h, m] = time.split(':').map(Number)
      at = new Date(`${date}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`)
      at.setMinutes(at.getMinutes() - (reminderOffset || 0))
    } else {
      // 종일 일정: 설정에 저장된 allDayReminderTime 사용
      const allDayTime = localStorage.getItem('allDayReminderTime') || '09:00'
      const [h, m] = allDayTime.split(':').map(Number)
      at = new Date(`${date}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`)
    }

    if (at <= new Date()) return // 과거 시간은 스케줄 안 함

    // 알림 body: 시간 + 상세내용
    let body = text
    if (time && time.includes(':')) body += `\n⏰ ${time}`
    if (description) body += `\n${description}`

    const channelId = getChannelIdByPriority(priority)
    const notifId = toNotifId(id)
    await LocalNotifications.cancel({ notifications: [{ id: notifId }] })
    await LocalNotifications.schedule({
      notifications: [{
        id: notifId,
        title: 'BrioDo 리마인더',
        body,
        schedule: { at, allowWhileIdle: true },
        sound: 'default',
        smallIcon: 'ic_launcher',
        channelId,
      }]
    })
    console.log(`[Notif] scheduled: ${text} at ${at.toISOString()} (ch: ${channelId})`)
  } catch (e) {
    console.error('[Notif] schedule error:', e)
  }
}

export async function cancelNotification(todoId) {
  try {
    const notifId = toNotifId(todoId)
    await LocalNotifications.cancel({ notifications: [{ id: notifId }] })
    console.log(`[Notif] cancelled: ${todoId}`)
  } catch (e) {
    console.error('[Notif] cancel error:', e)
  }
}

// 우선순위별 채널 4개 생성
const CHANNELS = [
  { id: 'briodo_low',    name: 'BrioDo 알림 (낮음)',  importance: 2, vibration: false, lights: false },
  { id: 'briodo_medium', name: 'BrioDo 알림',          importance: 3, vibration: true,  lights: false },
  { id: 'briodo_high',   name: 'BrioDo 알림 (중요)',   importance: 4, vibration: true,  lights: true  },
  { id: 'briodo_urgent', name: 'BrioDo 긴급 알림',     importance: 5, vibration: true,  lights: true  },
]

export async function initNotificationChannels() {
  try {
    for (const ch of CHANNELS) {
      await LocalNotifications.createChannel({
        id: ch.id,
        name: ch.name,
        description: 'BrioDo 할 일 리마인더',
        importance: ch.importance,
        visibility: 1,
        sound: 'default',
        vibration: ch.vibration,
        lights: ch.lights,
        lightColor: ch.lights ? '#FF6B6B' : undefined,
      })
    }
  } catch (e) {
    console.error('[Notif] channel init error:', e)
  }
}
