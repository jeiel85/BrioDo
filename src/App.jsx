import { useState, useEffect, useMemo, useRef } from 'react'
import { Capacitor } from '@capacitor/core'
import { App as CapApp } from '@capacitor/app'
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore"
import { db } from './firebase'
import { addSyncQueue, saveLocalTodo } from './db'
import { syncEventToGoogle } from './calendar'
import { formatTime } from './utils/helpers'

import { useLanguage } from './hooks/useLanguage'
import { useAuth } from './hooks/useAuth'
import { useTheme } from './hooks/useTheme'
import { useTodosData } from './hooks/useTodosData'
import { useCalendarNav } from './hooks/useCalendarNav'

import { Header } from './components/Header'
import { TodoList } from './components/TodoList'
import { InputModal } from './components/InputModal'
import { SmartInputModal } from './components/SmartInputModal'
import { SettingsModal } from './components/SettingsModal'

import './index.css'

function App() {
  const { lang, setLang, t } = useLanguage()
  const { user, loading, handleLogin, handleLogout } = useAuth()
  const { theme, setTheme, fontScale, setFontScale, randomColors, generateRandomTheme } = useTheme()

  // 완료 시 캘린더 처리 방식: 'status' | 'delete' (기본값: status)
  const [completionCalendarMode, setCompletionCalendarMode] = useState(
    () => localStorage.getItem('completionCalendarMode') || 'status'
  )
  const setCompletionCalendarModePersisted = (mode) => {
    setCompletionCalendarMode(mode)
    localStorage.setItem('completionCalendarMode', mode)
  }

  const { todos, setTodos, isOnline, isAiAnalyzing, toggleComplete, deleteTodo, getAiTagsOnly, getAiFullAnalysis } = useTodosData(user, { completionCalendarMode })
  const { todayStr, selectedDate, setSelectedDate, calendarExpanded, setCalendarExpanded, viewMonth, viewMonthLabel, currentWeekDates, monthGridDates, weekdayNames, prevMonth, nextMonth, goToMonth, handleGoToToday } = useCalendarNav(lang)

  const [viewMode, setViewMode] = useState('date')
  const [selectedTag, setSelectedTag] = useState(null)
  const [tagExpanded, setTagExpanded] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  // 입력 모드: 'smart' | 'manual' (기본값: smart)
  const [inputMode, setInputMode] = useState(() => localStorage.getItem('inputMode') || 'smart')
  const setInputModePersisted = (mode) => { setInputMode(mode); localStorage.setItem('inputMode', mode) }

  // 스마트 입력 모달 상태
  const [showSmartModal, setShowSmartModal] = useState(false)
  const [smartText, setSmartText] = useState('')

  // 할 일 입력 모달 상태
  const [showInputModal, setShowInputModal] = useState(false)
  const [editingTodoId, setEditingTodoId] = useState(null)
  const [newTodo, setNewTodo] = useState({ text: '', description: '', date: todayStr, time: '', tagInput: '', priority: 'medium' })
  const [showDescInput, setShowDescInput] = useState(false)

  // AI 태그 자동 제안 (디바운스)
  const debounceTimer = useRef(null)
  useEffect(() => {
    if (showInputModal && !editingTodoId && newTodo.text.length > 3) {
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
    setNewTodo({ text: '', description: '', date: todayStr, time: '', tagInput: '', priority: 'medium' })
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
      tagInput: (todo.tags || []).map(tg => '#' + tg).join(' '),
      priority: todo.priority ?? 'medium'
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
    setNewTodo({ text: '', description: '', date: defaultDate, time: defaultTime, tagInput: '', priority: 'medium' })
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
    const savedPriority = newTodo.priority ?? 'medium'
    const isEdit = !!editingTodoId
    const editId = editingTodoId

    resetForm()

    try {
      if (!isEdit) {
        // 게스트 모드: 로컬에만 저장
        if (!user) {
          const localId = `guest_${Date.now()}`
          const localPayload = { id: localId, text: savedText, description: savedDesc, date: savedDate, time: savedTime, tags: inputTags, priority: savedPriority, completed: false, createdAt: Date.now() }
          setTodos(prev => [...prev, localPayload])
          await saveLocalTodo(localPayload)
          return
        }

        // 신규 생성
        const newDocRef = doc(collection(db, "todos"))
        const newId = newDocRef.id
        const initialData = { uid: user.uid, text: savedText, description: savedDesc, date: savedDate, time: savedTime, tags: inputTags, priority: savedPriority, completed: false }
        const localPayload = { ...initialData, id: newId, createdAt: Date.now() }

        setTodos(prev => [...prev, localPayload])
        await saveLocalTodo(localPayload)

        if (isOnline) {
          await setDoc(newDocRef, { ...initialData, createdAt: serverTimestamp() })
          // 수동 저장: AI 없이 바로 캘린더 sync
          setTimeout(async () => {
            try {
              const gId = await syncEventToGoogle(localPayload)
              if (gId) {
                await setDoc(newDocRef, { googleEventId: gId, updatedAt: serverTimestamp() }, { merge: true })
                setTodos(prev => prev.map(t => t.id === newId ? { ...t, googleEventId: gId } : t))
                await saveLocalTodo({ ...localPayload, googleEventId: gId })
              }
            } catch (e) { console.error("Sync Error:", e) }
          }, 300)
        } else {
          await addSyncQueue('set', newId, initialData)
        }
      } else {
        // 수정
        const updateData = { text: savedText, description: savedDesc, date: savedDate, time: savedTime, tags: inputTags, priority: savedPriority }
        const oldTodo = todos.find(t => t.id === editId) || {}

        setTodos(prev => prev.map(t => t.id === editId ? { ...t, ...updateData } : t))
        await saveLocalTodo({ ...oldTodo, ...updateData })

        if (isOnline) {
          await setDoc(doc(db, "todos", editId), { ...updateData, updatedAt: serverTimestamp() }, { merge: true })
          // 편집 시 AI 분석 없이 사용자 입력 그대로 캘린더 동기화
          setTimeout(async () => {
            try {
              const base = { ...oldTodo, ...updateData }
              const gId = await syncEventToGoogle(base)
              if (gId && !base.googleEventId) {
                await setDoc(doc(db, "todos", editId), { googleEventId: gId }, { merge: true })
                setTodos(prev => prev.map(t => t.id === editId ? { ...t, googleEventId: gId } : t))
              }
            } catch (e) { console.error("Sync Update Error:", e) }
          }, 300)
        } else {
          await addSyncQueue('set', editId, updateData)
        }
      }
    } catch (e) { console.error("Save Todo Error:", e) }
  }

  // 스마트 입력 저장 (AI 자연어 처리)
  const handleSmartSave = async (text) => {
    if (!text.trim()) return
    const savedText = text.trim()
    const today = todayStr
    setShowSmartModal(false)
    setSmartText('')

    if (!user) {
      const localId = `guest_${Date.now()}`
      const localPayload = { id: localId, text: savedText, description: '', date: today, time: '', tags: [], priority: 'medium', completed: false, createdAt: Date.now() }
      setTodos(prev => [...prev, localPayload])
      await saveLocalTodo(localPayload)
      return
    }

    const newDocRef = doc(collection(db, "todos"))
    const newId = newDocRef.id
    const initialData = { uid: user.uid, text: savedText, description: '', date: today, time: '', tags: [], priority: 'medium', completed: false }
    const localPayload = { ...initialData, id: newId, createdAt: Date.now() }

    setTodos(prev => [...prev, localPayload])
    await saveLocalTodo(localPayload)

    if (isOnline) {
      await setDoc(newDocRef, { ...initialData, createdAt: serverTimestamp() })
      setTimeout(async () => {
        try {
          let finalData = { text: savedText, date: today, time: '', tags: [] }
          const ai = await getAiFullAnalysis(savedText)
          if (ai) {
            finalData = {
              text: ai.refinedText || savedText,
              date: ai.date || today,
              time: ai.time || '',
              tags: ai.categories || []
            }
            setTodos(prev => prev.map(t => t.id === newId ? { ...t, ...finalData } : t))
            await saveLocalTodo({ ...localPayload, ...finalData })
            await setDoc(newDocRef, { ...finalData, updatedAt: serverTimestamp() }, { merge: true })
          }
          const gId = await syncEventToGoogle({ ...localPayload, ...finalData })
          if (gId) {
            await setDoc(newDocRef, { googleEventId: gId, updatedAt: serverTimestamp() }, { merge: true })
            setTodos(prev => prev.map(t => t.id === newId ? { ...t, googleEventId: gId } : t))
            await saveLocalTodo({ ...localPayload, ...finalData, googleEventId: gId })
          }
        } catch (e) { console.error("Smart Save Error:", e) }
      }, 300)
    } else {
      await addSyncQueue('set', newId, initialData)
    }
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
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', fontWeight: 600 }}>
        {t.loading}
      </div>
    )
  }

  return (
    <div className="card">
      <Header
        lang={lang} t={t}
        formattedHeaderDate={formattedHeaderDate} handleGoToToday={handleGoToToday}
        user={user}
        viewMode={viewMode} setViewMode={setViewMode}
        todayStr={todayStr} setSelectedDate={setSelectedDate}
        allUsedTags={allUsedTags} selectedTag={selectedTag} setSelectedTag={setSelectedTag}
        tagExpanded={tagExpanded} setTagExpanded={setTagExpanded}
        selectedDate={selectedDate}
        calendarExpanded={calendarExpanded} setCalendarExpanded={setCalendarExpanded}
        viewMonth={viewMonth}
        viewMonthLabel={viewMonthLabel}
        currentWeekDates={currentWeekDates}
        monthGridDates={monthGridDates}
        weekdayNames={weekdayNames}
        prevMonth={prevMonth} nextMonth={nextMonth} goToMonth={goToMonth}
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
        />
      </div>

      {inputMode === 'smart' ? (
        <button className="add-fab smart-fab" onClick={() => setShowSmartModal(true)}>
          <span className="smart-fab-icon">✨</span>
          <span className="smart-fab-text">{lang === 'ko' ? 'AI 입력' : 'AI'}</span>
        </button>
      ) : (
        <button className="add-fab" onClick={handleOpenAddModal}>
          <svg viewBox="0 0 24 24"><path d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2z" /></svg>
        </button>
      )}

      {showSmartModal && (
        <SmartInputModal
          lang={lang}
          smartText={smartText} setSmartText={setSmartText}
          isAiAnalyzing={isAiAnalyzing}
          onClose={() => { setShowSmartModal(false); setSmartText('') }}
          onSave={handleSmartSave}
        />
      )}

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
          setSelectedDate={setSelectedDate}
          inputMode={inputMode} setInputMode={setInputModePersisted}
          completionCalendarMode={completionCalendarMode} setCompletionCalendarMode={setCompletionCalendarModePersisted}
          user={user} handleLogin={handleLogin} handleLogout={handleLogout}
          setShowSettings={setShowSettings}
        />
      )}

    </div>
  )
}

export default App
