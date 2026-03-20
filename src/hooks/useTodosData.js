import { useState, useEffect } from 'react'
import { Network } from '@capacitor/network'
import {
  collection, onSnapshot, query, where,
  doc, updateDoc, serverTimestamp, setDoc, deleteDoc
} from "firebase/firestore"
import { db, genAI } from '../firebase'
import { getLocalTodos, saveLocalTodosBatch, saveLocalTodo, deleteLocalTodo, addSyncQueue, getSyncQueue, clearSyncQueue } from '../db'
import { syncEventToGoogle, deleteEventFromGoogle, fetchEventsFromGoogle } from '../calendar'

const sortTodos = (list) => list.sort((a, b) => {
  const dtA = new Date(`${a.date} ${a.time && a.time.includes(':') ? a.time : '00:00'}`)
  const dtB = new Date(`${b.date} ${b.time && b.time.includes(':') ? b.time : '00:00'}`)
  return dtA - dtB
})

export function useTodosData(user) {
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
      const prompt = `Analyze: "${text}". Extract ONLY 1-2 category tags in Korean (e.g., 업무, 개인, 건강, 학습). Return ONLY JSON: {"categories": ["tag1", "tag2"]}`
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
      const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
      const todayInfo = `${year}-${month}-${day} (${dayNames[now.getDay()]})`

      const prompt = `오늘: ${todayInfo}\n입력: "${text}"\n\n반드시 아래 JSON만 응답하세요:\n{"categories":["태그1"],"date":"YYYY-MM-DD","time":"HH:MM 또는 null","refinedText":"핵심 내용"}\n\n규칙:\n- categories: 할일 성격 태그 1~2개 (업무,개인,건강,학습 등)\n- date: 날짜(YYYY-MM-DD). 상대적 표현은 오늘 기준 계산\n- time: 시간 있으면 HH:MM, 없으면 null\n- refinedText: 날짜/시간 제외한 핵심 내용`

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

  const toggleComplete = async (e, id, completed) => {
    e.stopPropagation()
    try {
      setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: !completed } : t))
      const target = todos.find(t => t.id === id)
      if (target) await saveLocalTodo({ ...target, completed: !completed })
      if (user) {
        if (isOnline) {
          await setDoc(doc(db, "todos", id), { completed: !completed }, { merge: true })
          // Google 캘린더 이벤트 완료 상태 갱신
          if (target?.googleEventId) {
            setTimeout(() => syncEventToGoogle({ ...target, completed: !completed }), 100)
          }
        } else {
          await addSyncQueue('set', id, { completed: !completed })
        }
      }
    } catch (e) { console.error(e) }
  }

  const deleteTodo = async (e, id) => {
    e.stopPropagation()
    try {
      const target = todos.find(t => t.id === id)
      setTodos(prev => prev.filter(t => t.id !== id))
      await deleteLocalTodo(id)
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
    deleteTodo,
    getAiTagsOnly,
    getAiFullAnalysis
  }
}
