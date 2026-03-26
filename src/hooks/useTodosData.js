import { useState, useEffect } from 'react'
import { Network } from '@capacitor/network'
import {
  collection, onSnapshot, query, where,
  doc, updateDoc, serverTimestamp, setDoc, deleteDoc
} from "firebase/firestore"
import { db, genAI } from '../firebase'
import { getLocalTodos, saveLocalTodosBatch, saveLocalTodo, deleteLocalTodo, addSyncQueue, getSyncQueue, clearSyncQueue } from '../db'
import { syncEventToGoogle, deleteEventFromGoogle, fetchEventsFromGoogle } from '../calendar'
import { cancelNotification, scheduleNotification } from './useNotifications'

const sortTodos = (list) => list.sort((a, b) => {
  const dtA = new Date(`${a.date} ${a.time && a.time.includes(':') ? a.time : '00:00'}`)
  const dtB = new Date(`${b.date} ${b.time && b.time.includes(':') ? b.time : '00:00'}`)
  return dtA - dtB
})

export function useTodosData(user, { completionCalendarMode = 'status', lang = 'ko' } = {}) {
  const [todos, setTodos] = useState([])
  const [isOnline, setIsOnline] = useState(true)
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false)

  const processSyncQueue = async () => {
    if (!user) return
    try {
      const queue = await getSyncQueue()
      for (const item of queue) {
        if (item.action === 'set') {
          const finalPayload = { ...item.payload }
          if (!finalPayload.createdAt || typeof finalPayload.createdAt === 'number') {
            finalPayload.createdAt = serverTimestamp()
          }
          await setDoc(doc(db, "todos", item.todoId), finalPayload, { merge: true })
        } else if (item.action === 'delete') {
          await deleteDoc(doc(db, "todos", item.todoId))
        }
        await clearSyncQueue(item.id)
      }
    } catch (e) { console.error('Sync process error:', e) }
  }

  // 네트워크 상태 감지 및 오프라인 큐 처리
  useEffect(() => {
    Network.getStatus().then(status => {
      setIsOnline(status.connected)
      if (status.connected && user) processSyncQueue()
    })
    const handleNetworkChange = async (status) => {
      setIsOnline(status.connected)
      if (status.connected && user) await processSyncQueue()
    }
    const listener = Network.addListener('networkStatusChange', handleNetworkChange)
    return () => { listener.then(l => l.remove()) }
  }, [user])

  // 로그인 시 게스트 todos를 Firestore로 마이그레이션 (미완료 항목만)
  useEffect(() => {
    if (!user) return
    const migrateGuestTodos = async () => {
      try {
        const all = await getLocalTodos()
        const guests = all.filter(t => !t.uid && !t.completed)
        if (guests.length === 0) return
        console.log(`Migrating ${guests.length} guest todo(s) to Firestore...`)
        for (const todo of guests) {
          const newDocRef = doc(collection(db, 'todos'))
          const { id: oldId, createdAt: _, ...rest } = todo
          const payload = { ...rest, uid: user.uid }
          await setDoc(newDocRef, { ...payload, createdAt: serverTimestamp() })
          await deleteLocalTodo(oldId)
          await saveLocalTodo({ ...payload, id: newDocRef.id })
        }
        console.log('Guest todos migrated ✓')
      } catch (e) { console.error('Guest migration error:', e) }
    }
    migrateGuestTodos()
  }, [user?.uid])

  // Firestore 실시간 동기화 + 로컬 DB / 게스트 모드 로컬 전용
  useEffect(() => {
    let unsubscribe = null

    const loadLocalAndSync = async () => {
      if (user) {
        // 로컬 DB 우선 즉시 렌더링
        const localData = await getLocalTodos()
        if (localData && localData.length > 0) {
          setTodos(sortTodos(localData))
        }

        // 로그인 시 1회만 Google Calendar 역동기화 (onSnapshot 밖으로 분리)
        const syncCalendarOnce = async (firestoreList) => {
          try {
            const events = await fetchEventsFromGoogle()
            if (!events || events.length === 0) return firestoreList
            let updated = false
            const list = [...firestoreList]
            for (const ev of events) {
              const matchIndex = list.findIndex(t => t.googleEventId === ev.id)
              if (matchIndex >= 0) {
                const match = list[matchIndex]
                const evUpdated = new Date(ev.updated).getTime()
                const localUpdated = match.updatedAt?.toMillis ? match.updatedAt.toMillis() : (match.createdAt?.toMillis ? match.createdAt.toMillis() : 0)
                if (evUpdated > localUpdated + 60000) {
                  const dt = ev.start?.date || ev.start?.dateTime?.split('T')[0]
                  const time = ev.start?.dateTime ? ev.start.dateTime.substring(11, 16) : ''
                  const updatedTodo = {
                    text: (ev.summary || '').replace(/^(✅\s+)?(🔵|🟡|🔴|🚨)\s+B\]\s*/u, '').replace(/^B\]\s*/, '') || '제목 없음',
                    description: ev.description || '',
                    date: dt || match.date,
                    time,
                    updatedAt: serverTimestamp()
                  }
                  await updateDoc(doc(db, "todos", match.id), updatedTodo)
                  list[matchIndex] = { ...match, ...updatedTodo }
                  updated = true
                }
              }
            }
            return updated ? list : firestoreList
          } catch (calErr) {
            console.error('Calendar sync error:', calErr)
            return firestoreList
          }
        }

        // Firestore 실시간 구독
        let calendarSyncDone = false
        const q = query(collection(db, "todos"), where("uid", "==", user.uid))
        unsubscribe = onSnapshot(q, async (snapshot) => {
          let list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))

          // 최초 1회만 Google Calendar 역동기화
          if (!calendarSyncDone) {
            calendarSyncDone = true
            list = await syncCalendarOnce(list)
          }

          setTodos(sortTodos(list))
          try { await saveLocalTodosBatch(list) } catch (e) { console.error("Local DB Sync error:", e) }
        }, (error) => {
          console.error("Firestore sync error:", error)
        })
      } else {
        // 게스트 모드: uid 없는 로컬 todos만 표시
        const localData = await getLocalTodos()
        const guestTodos = localData.filter(t => !t.uid)
        setTodos(sortTodos(guestTodos))
      }
    }

    loadLocalAndSync()
    return () => { if (unsubscribe) unsubscribe() }
  }, [user])

  // 쿼터 소진 시 다음 모델로 순차 시도
  const AI_MODELS = [
    'gemini-2.5-flash-lite',
    'gemini-2.0-flash-lite',
    'gemini-1.5-flash-8b',
    'gemini-1.5-flash',
  ]

  const generateWithFallback = async (prompt) => {
    for (const model of AI_MODELS) {
      try {
        const response = await genAI.models.generateContent({ model, contents: prompt })
        if (response?.text) return response.text
      } catch (e) {
        console.warn(`[AI] ${model} failed:`, e?.message || String(e))
      }
    }
    console.error('[AI] All models failed')
    return null
  }

  const getAiTagsOnly = async (text) => {
    if (!genAI) return null
    try {
      setIsAiAnalyzing(true)
      const tagExamples = lang === 'ja' ? '仕事, 個人, 健康, 学習' : lang === 'zh' ? '工作, 个人, 健康, 学习' : lang === 'en' ? 'work, personal, health, study' : '업무, 개인, 건강, 학습'
      const langInstruction = lang === 'ja' ? `日本語で1~2個のカテゴリタグのみ抽出 (例: ${tagExamples})`
        : lang === 'zh' ? `仅提取1-2个中文分类标签 (例如: ${tagExamples})`
        : lang === 'en' ? `Extract ONLY 1-2 category tags in English (e.g., ${tagExamples})`
        : `한국어 태그 1~2개만 추출 (예: ${tagExamples})`
      const prompt = `Analyze: "${text}". ${langInstruction}. Return ONLY JSON: {"categories": ["tag1", "tag2"]}`
      const rawText = await generateWithFallback(prompt)
      if (!rawText) return null
      return JSON.parse(rawText.replace(/```json|```/g, '').trim().match(/\{.*\}/s)?.[0] || rawText.trim())
    } catch (error) {
      console.error('AI Tags Error:', error)
      return null
    } finally {
      setIsAiAnalyzing(false)
    }
  }

  const getAiFullAnalysis = async (text) => {
    if (!genAI) return null
    try {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const dayNames = lang === 'ja'
        ? ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日']
        : lang === 'zh'
        ? ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
        : lang === 'en'
        ? ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        : ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
      const todayInfo = `${year}-${month}-${day} (${dayNames[now.getDay()]})`

      const prompt = lang === 'ja'
        ? `今日: ${todayInfo}\n入力: "${text}"\n\n以下のJSONのみで回答:\n{"categories":["タグ1"],"date":"YYYY-MM-DD","time":"HH:MM またはnull","refinedText":"要点"}\n\nルール:\n- categories: タスクのカテゴリタグ1~2個 (仕事,個人,健康,学習 など)\n- date: 日付(YYYY-MM-DD)。相対表現は今日を基準に計算\n- time: 時間があればHH:MM、なければnull\n- refinedText: 日付/時間を除いた要点`
        : lang === 'zh'
        ? `今天: ${todayInfo}\n输入: "${text}"\n\n只用以下JSON回复:\n{"categories":["标签1"],"date":"YYYY-MM-DD","time":"HH:MM 或 null","refinedText":"核心内容"}\n\n规则:\n- categories: 1-2个任务分类标签 (工作,个人,健康,学习 等)\n- date: 日期(YYYY-MM-DD)。相对表达从今天计算\n- time: 有时间则HH:MM，没有则null\n- refinedText: 去除日期/时间后的核心内容`
        : lang === 'en'
        ? `Today: ${todayInfo}\nInput: "${text}"\n\nRespond with ONLY this JSON:\n{"categories":["tag1"],"date":"YYYY-MM-DD","time":"HH:MM or null","refinedText":"core content"}\n\nRules:\n- categories: 1-2 task category tags (work, personal, health, study, etc.)\n- date: date (YYYY-MM-DD). Relative expressions calculated from today\n- time: HH:MM if specified, null if not\n- refinedText: core content without date/time`
        : `오늘: ${todayInfo}\n입력: "${text}"\n\n반드시 아래 JSON만 응답하세요:\n{"categories":["태그1"],"date":"YYYY-MM-DD","time":"HH:MM 또는 null","refinedText":"핵심 내용"}\n\n규칙:\n- categories: 할일 성격 태그 1~2개 (업무,개인,건강,학습 등)\n- date: 날짜(YYYY-MM-DD). 상대적 표현은 오늘 기준 계산\n- time: 시간 있으면 HH:MM, 없으면 null\n- refinedText: 날짜/시간 제외한 핵심 내용`

      const rawText = await generateWithFallback(prompt)
      if (!rawText) return null
      const cleaned = rawText.replace(/```json|```/g, '').trim()
      const analysis = JSON.parse(cleaned.match(/\{.*\}/s)?.[0] || cleaned)

      if (analysis && (!analysis.date || !/^\d{4}-\d{2}-\d{2}$/.test(analysis.date))) {
        analysis.date = null
      }
      return analysis
    } catch (error) {
      console.error("AI Analysis Error:", error)
      return null
    }
  }

  const toggleComplete = async (e, id, completed, instanceDate = null) => {
    e.stopPropagation()
    const nowCompleting = !completed
    try {
      const target = todos.find(t => t.id === id)

      // 반복 일정 인스턴스: completions 맵에 날짜별 완료 상태 저장
      if (target?.recurrence?.type && target.recurrence.type !== 'none' && instanceDate) {
        const updatedCompletions = { ...(target.completions || {}), [instanceDate]: nowCompleting }
        const updatedTodo = { ...target, completions: updatedCompletions }
        setTodos(prev => prev.map(t => t.id === id ? updatedTodo : t))
        await saveLocalTodo(updatedTodo)
        if (user) {
          if (isOnline) {
            await setDoc(doc(db, "todos", id), { completions: updatedCompletions }, { merge: true })
          } else {
            await addSyncQueue('set', id, { completions: updatedCompletions })
          }
        }
        return
      }
      const updatePayload = { completed: nowCompleting }
      if (nowCompleting) {
        updatePayload.completedAt = Date.now()
      } else {
        updatePayload.completedAt = null
      }

      setTodos(prev => prev.map(t => t.id === id ? { ...t, ...updatePayload } : t))
      if (target) await saveLocalTodo({ ...target, ...updatePayload })
      if (target) {
        if (nowCompleting) {
          // 완료 시 알림 취소
          cancelNotification(id)
        } else if (target.reminderOffset !== null && target.reminderOffset !== undefined) {
          // 완료 취소 시 알림 재스케줄
          scheduleNotification({ ...target, completed: false })
        }
      }

      if (user) {
        if (isOnline) {
          await setDoc(doc(db, "todos", id), updatePayload, { merge: true })

          if (completionCalendarMode === 'delete') {
            if (nowCompleting) {
              // 완료 → 캘린더에서 삭제 후 googleEventId 초기화
              if (target?.googleEventId) {
                setTimeout(async () => {
                  await deleteEventFromGoogle(target.googleEventId)
                  await setDoc(doc(db, "todos", id), { googleEventId: null }, { merge: true })
                  await saveLocalTodo({ ...target, completed: true, googleEventId: null })
                  setTodos(prev => prev.map(t => t.id === id ? { ...t, googleEventId: null } : t))
                }, 100)
              }
            } else {
              // 완료 취소 → 신규 이벤트 생성 (googleEventId 없으므로 POST)
              setTimeout(async () => {
                const newEventId = await syncEventToGoogle({ ...target, completed: false, googleEventId: null })
                if (newEventId) {
                  await setDoc(doc(db, "todos", id), { googleEventId: newEventId }, { merge: true })
                  await saveLocalTodo({ ...target, completed: false, googleEventId: newEventId })
                  setTodos(prev => prev.map(t => t.id === id ? { ...t, googleEventId: newEventId } : t))
                }
              }, 100)
            }
          } else {
            // 상태 변경 모드 (기본): 캘린더 이벤트 완료 상태 갱신
            if (target?.googleEventId) {
              setTimeout(() => syncEventToGoogle({ ...target, completed: nowCompleting }), 100)
            }
          }
        } else {
          await addSyncQueue('set', id, updatePayload)
        }
      }
    } catch (e) { console.error(e) }
  }

  const toggleSubtaskComplete = async (todoId, subtaskId) => {
    try {
      const target = todos.find(t => t.id === todoId)
      if (!target) return
      const updatedSubtasks = (target.subtasks || []).map(st =>
        st.id === subtaskId ? { ...st, completed: !st.completed } : st
      )
      const updatedTodo = { ...target, subtasks: updatedSubtasks }
      setTodos(prev => prev.map(t => t.id === todoId ? updatedTodo : t))
      await saveLocalTodo(updatedTodo)
      if (user) {
        if (isOnline) {
          await setDoc(doc(db, "todos", todoId), { subtasks: updatedSubtasks }, { merge: true })
        } else {
          await addSyncQueue('set', todoId, { subtasks: updatedSubtasks })
        }
      }
    } catch (e) { console.error('toggleSubtaskComplete error:', e) }
  }

  const deleteTodo = async (e, id) => {
    e.stopPropagation()
    try {
      const target = todos.find(t => t.id === id)
      setTodos(prev => prev.filter(t => t.id !== id))
      await deleteLocalTodo(id)
      cancelNotification(id)
      if (user) {
        if (isOnline) {
          await deleteDoc(doc(db, "todos", id))
          if (target?.googleEventId) {
            setTimeout(() => deleteEventFromGoogle(target.googleEventId), 100)
          }
        } else {
          await addSyncQueue('delete', id)
        }
      }
    } catch (e) { console.error(e) }
  }

  return {
    todos,
    setTodos,
    isOnline,
    isAiAnalyzing,
    toggleComplete,
    toggleSubtaskComplete,
    deleteTodo,
    getAiTagsOnly,
    getAiFullAnalysis
  }
}
