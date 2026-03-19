import { useState, useEffect, useMemo, useRef } from 'react'
import { Capacitor } from '@capacitor/core'
import { App as CapApp } from '@capacitor/app'
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore"
import { db } from './firebase'
import { addSyncQueue, saveLocalTodo } from './db'
import { syncEventToGoogle, ensureBlendDoCalendar, resolveCalendarConflict, CALENDAR_CONFLICT } from './calendar'
import { formatTime } from './utils/helpers'

import { useLanguage } from './hooks/useLanguage'
import { useAuth } from './hooks/useAuth'
import { useTheme } from './hooks/useTheme'
import { useTodosData } from './hooks/useTodosData'
import { useCalendarNav } from './hooks/useCalendarNav'

import { Header } from './components/Header'
import { TodoList } from './components/TodoList'
import { InputModal } from './components/InputModal'
import { SettingsModal } from './components/SettingsModal'
import { CalendarConflictModal } from './components/CalendarConflictModal'

import './index.css'

function App() {
  const { lang, setLang, t } = useLanguage()
  const { user, loading, handleLogin, handleLogout } = useAuth()
  const { theme, setTheme, fontScale, setFontScale, randomColors, generateRandomTheme } = useTheme()
  const { todos, setTodos, isOnline, isAiAnalyzing, toggleComplete, deleteTodo, getAiTagsOnly, getAiFullAnalysis } = useTodosData(user)
  const { todayStr, selectedDate, setSelectedDate, baseDate, setBaseDate, dateRange, weekScrollRef, handleGoToToday, handleWeekScroll } = useCalendarNav(lang)

  const [viewMode, setViewMode] = useState('date')
  const [selectedTag, setSelectedTag] = useState(null)
  const [tagExpanded, setTagExpanded] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  // 중복 캘린더 conflict 상태
  const [calendarConflict, setCalendarConflict] = useState(null) // { calendars: [...] }

  // 로그인 후 중복 캘린더 자동 감지
  useEffect(() => {
    if (!user) return
    const checkConflict = async () => {
      const result = await ensureBlendDoCalendar()
      if (result && typeof result === 'object' && result.type === CALENDAR_CONFLICT) {
        setCalendarConflict(result)
      }
    }
    checkConflict()
  }, [user])

  // 할 일 입력 모달 상태
  const [showInputModal, setShowInputModal] = useState(false)
  const [editingTodoId, setEditingTodoId] = useState(null)
  const [newTodo, setNewTodo] = useState({ text: '', description: '', date: todayStr, time: '', tagInput: '' })
  const [showDescInput, setShowDescInput] = useState(false)

  // AI 태그 자동 제안 (디바운스)
  const debounceTimer = useRef(null)
  useEffect(() => {
    if (showInputModal && newTodo.text.length > 3) {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
      debounceTimer.current = setTimeout(async () => {
        const analysis = await getAiTagsOnly(newTodo.text)
        if (analysis?.categories) {
          const existingTags = newTodo.tagInput.split(/[,#\s]+/).map(tg => tg.trim().replace('#', '')).filter(Boolean)
          const newUniqueTags = analysis.categories.filter(tag => !existingTags.includes(tag))
          if (newUniqueTags.length > 0) {
            setNewTodo(prev => ({
              ...prev,
              tagInput: [...new Set([...existingTags, ...newUniqueTags])].map(tg => '#' + tg).join(' ')
            }))
          }
        }
      }, 1200)
    }
    return () => clearTimeout(debounceTimer.current)
  }, [newTodo.text, showInputModal])

  // 뒤로가기 처리 (Android)
  const modalStateRef = useRef({ showInputModal, showSettings })
  useEffect(() => {
    modalStateRef.current = { showInputModal, showSettings }
  }, [showInputModal, showSettings])

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const backListener = CapApp.addListener('backButton', () => {
        const { showInputModal, showSettings } = modalStateRef.current
        if (showInputModal) {
          resetForm()
        } else if (showSettings) {
          setShowSettings(false)
        } else {
          CapApp.exitApp()
        }
      })
      return () => { backListener.then(l => l.remove()) }
    }
  }, [])

  // 로딩 완료 시 오늘 날짜로 이동
  useEffect(() => {
    if (!loading) handleGoToToday()
  }, [loading])

  const resetForm = () => {
    setNewTodo({ text: '', description: '', date: todayStr, time: '', tagInput: '' })
    setShowDescInput(false)
    setEditingTodoId(null)
    setShowInputModal(false)
    document.body.classList.remove('modal-open')
  }

  const openEditModal = (todo) => {
    setEditingTodoId(todo.id)
    setNewTodo({
      text: todo.text,
      description: todo.description || '',
      date: todo.date,
      time: formatTime(todo.time, t.noTime),
      tagInput: (todo.tags || []).map(tg => '#' + tg).join(' ')
    })
    setShowDescInput(!!todo.description)
    setShowInputModal(true)
    document.body.classList.add('modal-open')
  }

  const handleOpenAddModal = () => {
    let defaultDate = ''
    let defaultTime = ''
    if (viewMode === 'date') {
      defaultDate = selectedDate
      const now = new Date()
      now.setMinutes(Math.round(now.getMinutes() / 10) * 10)
      const hh = String(now.getHours()).padStart(2, '0')
      const mm = String(now.getMinutes()).padStart(2, '0')
      defaultTime = `${hh}:${mm}`
    }
    setEditingTodoId(null)
    setNewTodo({ text: '', description: '', date: defaultDate, time: defaultTime, tagInput: '' })
    setShowDescInput(false)
    setShowInputModal(true)
    document.body.classList.add('modal-open')
  }

  const handleSaveTodo = async () => {
    if (newTodo.text.trim() === '') return

    const inputTags = newTodo.tagInput.split(/[,#\s]+/).map(tag => tag.trim().replace('#', '')).filter(Boolean)
    const savedText = newTodo.text
    const savedDesc = newTodo.description
    const savedDate = newTodo.date
    const savedTime = newTodo.time || ''
    const isEdit = !!editingTodoId
    const editId = editingTodoId

    resetForm()

    try {
      if (!isEdit) {
        // 게스트 모드: 로컬에만 저장
        if (!user) {
          const localId = `guest_${Date.now()}`
          const localPayload = { id: localId, text: savedText, description: savedDesc, date: savedDate, time: savedTime, tags: inputTags, completed: false, createdAt: Date.now() }
          setTodos(prev => [...prev, localPayload])
          await saveLocalTodo(localPayload)
          return
        }

        // 신규 생성
        const newDocRef = doc(collection(db, "todos"))
        const newId = newDocRef.id
        const initialData = { uid: user.uid, text: savedText, description: savedDesc, date: savedDate, time: savedTime, tags: inputTags, completed: false }
        const localPayload = { ...initialData, id: newId, createdAt: Date.now() }

        setTodos(prev => [...prev, localPayload])
        await saveLocalTodo(localPayload)

        if (isOnline) {
          await setDoc(newDocRef, { ...initialData, createdAt: serverTimestamp() })
          setTimeout(async () => {
            try {
              const gId = await syncEventToGoogle({ ...localPayload })
              if (gId) {
                await setDoc(newDocRef, { googleEventId: gId, updatedAt: serverTimestamp() }, { merge: true })
                setTodos(prev => prev.map(t => t.id === newId ? { ...t, googleEventId: gId } : t))
              }
            } catch (e) { console.error("Google Sync Error:", e) }
          }, 300)
        } else {
          await addSyncQueue('set', newId, initialData)
        }

        // AI 비동기 개선
        try {
          const ai = await getAiFullAnalysis(savedText)
          if (ai) {
            const merged = {
              text: ai.refinedText || savedText,
              date: ai.date || savedDate,
              time: ai.time || savedTime,
              tags: [...new Set([...inputTags, ...(ai.categories || [])])]
            }
            setTodos(prev => prev.map(t => t.id === newId ? { ...t, ...merged } : t))
            await saveLocalTodo({ ...localPayload, ...merged })
            if (isOnline) {
              await setDoc(newDocRef, merged, { merge: true })
              setTimeout(async () => {
                const gId = await syncEventToGoogle({ ...localPayload, ...merged })
                if (gId) await setDoc(newDocRef, { googleEventId: gId, updatedAt: serverTimestamp() }, { merge: true })
              }, 100)
            } else {
              await addSyncQueue('set', newId, merged)
            }
          }
        } catch (aiErr) { console.error("AI refinement failed:", aiErr) }
      } else {
        // 수정
        const updateData = { text: savedText, description: savedDesc, date: savedDate, time: savedTime, tags: inputTags }
        const oldTodo = todos.find(t => t.id === editId) || {}

        setTodos(prev => prev.map(t => t.id === editId ? { ...t, ...updateData } : t))
        await saveLocalTodo({ ...oldTodo, ...updateData })

        if (isOnline) {
          await setDoc(doc(db, "todos", editId), { ...updateData, updatedAt: serverTimestamp() }, { merge: true })
          setTimeout(async () => {
            try {
              const targetToSync = { ...oldTodo, ...updateData }
              const gId = await syncEventToGoogle(targetToSync)
              if (gId && !targetToSync.googleEventId) {
                await setDoc(doc(db, "todos", editId), { googleEventId: gId }, { merge: true })
                setTodos(prev => prev.map(t => t.id === editId ? { ...t, googleEventId: gId } : t))
              }
            } catch (e) { console.error("Google Sync Update Error:", e) }
          }, 300)
        } else {
          await addSyncQueue('set', editId, updateData)
        }

        try {
          const ai = await getAiFullAnalysis(savedText)
          if (ai) {
            const merged = {
              text: ai.refinedText || savedText,
              date: ai.date || savedDate,
              time: ai.time || savedTime,
              tags: [...new Set([...inputTags, ...(ai.categories || [])])]
            }
            setTodos(prev => prev.map(t => t.id === editId ? { ...t, ...merged } : t))
            await saveLocalTodo({ ...oldTodo, ...updateData, ...merged })
            if (isOnline) {
              await setDoc(doc(db, "todos", editId), { ...merged, updatedAt: serverTimestamp() }, { merge: true })
              setTimeout(async () => {
                const gId = await syncEventToGoogle({ ...oldTodo, ...updateData, ...merged })
                if (gId && !oldTodo.googleEventId) {
                  await setDoc(doc(db, "todos", editId), { googleEventId: gId }, { merge: true })
                }
              }, 100)
            } else {
              await addSyncQueue('set', editId, merged)
            }
          }
        } catch (aiErr) { console.error("AI refinement failed:", aiErr) }
      }
    } catch (e) { console.error("Save Todo Error:", e) }
  }

  // 필터링
  const allUsedTags = useMemo(() => {
    const tags = new Set()
    todos.forEach(todo => todo.tags?.forEach(tag => tags.add(tag)))
    return Array.from(tags)
  }, [todos])

  const filteredTodos = useMemo(() => {
    let list = [...todos]
    if (viewMode === 'date') list = list.filter(todo => todo.date === selectedDate)
    if (selectedTag) list = list.filter(todo => todo.tags?.includes(selectedTag))
    return list.sort((a, b) => {
      const dtA = new Date(`${a.date} ${a.time && a.time.includes(':') ? a.time : '00:00'}`)
      const dtB = new Date(`${b.date} ${b.time && b.time.includes(':') ? b.time : '00:00'}`)
      return dtA - dtB
    })
  }, [todos, viewMode, selectedDate, selectedTag])

  const activeTodos = useMemo(() => filteredTodos.filter(todo => !todo.completed), [filteredTodos])
  const completedTodos = filteredTodos.filter(todo => todo.completed)

  const formattedHeaderDate = useMemo(() => {
    const d = new Date(selectedDate)
    const locale = lang === 'ko' ? 'ko-KR' : lang === 'ja' ? 'ja-JP' : lang === 'zh' ? 'zh-CN' : 'en-US'
    return d.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
  }, [selectedDate, lang])

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 600 }}>
        {t.loading}
      </div>
    )
  }

  return (
    <div className="card">
      <Header
        lang={lang} t={t}
        formattedHeaderDate={formattedHeaderDate} handleGoToToday={handleGoToToday}
        user={user} handleLogin={handleLogin}
        viewMode={viewMode} setViewMode={setViewMode}
        todayStr={todayStr} setSelectedDate={setSelectedDate} setBaseDate={setBaseDate}
        allUsedTags={allUsedTags} selectedTag={selectedTag} setSelectedTag={setSelectedTag}
        tagExpanded={tagExpanded} setTagExpanded={setTagExpanded}
        weekScrollRef={weekScrollRef} handleWeekScroll={handleWeekScroll}
        dateRange={dateRange} selectedDate={selectedDate}
        setShowSettings={setShowSettings}
      />

      <div className="todo-list-section">
        <TodoList
          user={user} t={t} lang={lang}
          activeTodos={activeTodos} completedTodos={completedTodos}
          viewMode={viewMode}
          openEditModal={openEditModal}
          toggleComplete={toggleComplete}
          deleteTodo={deleteTodo}
          handleLogin={handleLogin}
        />
      </div>

      <button className="add-fab" onClick={handleOpenAddModal}>
        <svg viewBox="0 0 24 24"><path d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2z" /></svg>
      </button>

      {showInputModal && (
        <InputModal
          t={t} lang={lang}
          newTodo={newTodo} setNewTodo={setNewTodo}
          showDescInput={showDescInput} setShowDescInput={setShowDescInput}
          isAiAnalyzing={isAiAnalyzing}
          editingTodoId={editingTodoId}
          resetForm={resetForm}
          handleSaveTodo={handleSaveTodo}
        />
      )}

      {showSettings && (
        <SettingsModal
          lang={lang} t={t}
          fontScale={fontScale} setFontScale={setFontScale}
          theme={theme} setTheme={setTheme} generateRandomTheme={generateRandomTheme}
          viewMode={viewMode} setViewMode={setViewMode}
          setSelectedDate={setSelectedDate} setBaseDate={setBaseDate}
          user={user} handleLogin={handleLogin} handleLogout={handleLogout}
          setShowSettings={setShowSettings}
        />
      )}

      {calendarConflict && (
        <CalendarConflictModal
          calendars={calendarConflict.calendars}
          t={t}
          onResolve={async ({ calendarId, newName }) => {
            await resolveCalendarConflict(calendarId, newName)
            setCalendarConflict(null)
          }}
        />
      )}
    </div>
  )
}

export default App
