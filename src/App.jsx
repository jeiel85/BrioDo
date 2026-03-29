import { useState, useEffect, useMemo, useRef } from 'react'
import { Capacitor, registerPlugin } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import { App as CapApp } from '@capacitor/app'
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore"
import { db } from './firebase'
import { addSyncQueue, saveLocalTodo } from './db'
import { syncEventToGoogle } from './calendar'
import { formatTime, matchesRecurrence } from './utils/helpers'
import { useAchievements, trackEngagement } from './hooks/useAchievements'
import { scheduleNotification, cancelNotification, initNotificationChannels } from './hooks/useNotifications'
import { initAdMob } from './hooks/useAdMob'
import { fetchWeather } from './hooks/useWeather'

import { useLanguage } from './hooks/useLanguage'
import { useAuth } from './hooks/useAuth'
import { useTheme } from './hooks/useTheme'
import { useTodosData } from './hooks/useTodosData'
import { useCalendarNav } from './hooks/useCalendarNav'
import { useBrio, DAILY_BRIO } from './hooks/useBrio'

import { Header } from './components/Header'
import { TodoList } from './components/TodoList'
import { BottomNav } from './components/BottomNav'
import { CollectionsScreen } from './components/CollectionsScreen'
import { InputModal } from './components/InputModal'
import { SmartInputModal } from './components/SmartInputModal'
import { SettingsModal } from './components/SettingsModal'
import { NotificationsModal } from './components/NotificationsModal'
import { AchievementUnlockModal } from './components/AchievementUnlockModal'
import { AchievementsModal } from './components/AchievementsModal'
import { LockScreenView } from './components/LockScreenView'
import { OnboardingModal, shouldShowOnboarding } from './components/OnboardingModal'
import { BrioChargeModal } from './components/BrioChargeModal'

import './index.css'

const LockScreenNative = Capacitor.isNativePlatform() ? registerPlugin('LockScreen') : null

const APP_VERSION = '1.0.0'

function App() {
  const { lang, langPref, setLangPref, t } = useLanguage()
  const { user, loading, handleLogin, handleLogout, tokenExpired, setTokenExpired } = useAuth()
  const [showOnboarding, setShowOnboarding] = useState(() => shouldShowOnboarding())
  const { theme, setTheme, fontScale, setFontScale, randomColors, generateRandomTheme, syncStatusBar } = useTheme()

  // 완료 시 캘린더 처리 방식: 'status' | 'delete' (기본값: status)
  const [completionCalendarMode, setCompletionCalendarMode] = useState(
    () => localStorage.getItem('completionCalendarMode') || 'status'
  )

  // 알림 설정: 기본 오프셋(분), 종일 일정 알림 시간
  const [defaultReminderOffset, setDefaultReminderOffset] = useState(
    () => { const v = localStorage.getItem('defaultReminderOffset'); return v !== null ? Number(v) : 0 }
  )
  const setDefaultReminderOffsetPersisted = (val) => {
    setDefaultReminderOffset(val)
    if (val === null) localStorage.removeItem('defaultReminderOffset')
    else localStorage.setItem('defaultReminderOffset', String(val))
  }
  const [allDayReminderTime, setAllDayReminderTime] = useState(
    () => localStorage.getItem('allDayReminderTime') || '09:00'
  )
  const setAllDayReminderTimePersisted = (val) => {
    setAllDayReminderTime(val)
    localStorage.setItem('allDayReminderTime', val)
  }
  const setCompletionCalendarModePersisted = (mode) => {
    setCompletionCalendarMode(mode)
    localStorage.setItem('completionCalendarMode', mode)
  }

  const { todos, setTodos, isOnline, isAiAnalyzing, toggleComplete, toggleSubtaskComplete, deleteTodo, getAiTagsOnly, getAiFullAnalysis } = useTodosData(user, { completionCalendarMode, lang })
  const { todayStr, selectedDate, setSelectedDate, calendarExpanded, setCalendarExpanded, viewMonth, viewMonthLabel, currentWeekDates, monthGridDates, weekdayNames, prevMonth, nextMonth, goToMonth, handleGoToToday } = useCalendarNav(lang)

  const [viewMode, setViewMode] = useState(() => localStorage.getItem('briodo-viewMode') || 'date')
  const [selectedTag, setSelectedTag] = useState(null)
  const [tagExpanded, setTagExpanded] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [showAchievementsModal, setShowAchievementsModal] = useState(false)
  const [showNotificationsModal, setShowNotificationsModal] = useState(false)

  useEffect(() => {
    localStorage.setItem('briodo-viewMode', viewMode)
    if (viewMode === 'lists') trackEngagement('collectionVisited')
  }, [viewMode])

  // 입력 모드: 'smart' | 'manual' (기본값: manual — 로그인 전에는 항상 manual)
  const [inputMode, setInputMode] = useState(() => localStorage.getItem('inputMode') || 'manual')
  const setInputModePersisted = (mode) => { setInputMode(mode); localStorage.setItem('inputMode', mode) }

  // 브리오 에너지 시스템
  const { balance: brioBalance, consume: consumeBrio, charge: chargeBrio, hasBrio, maxBrio, nextChargeMs } = useBrio()
  const [showBrioChargeModal, setShowBrioChargeModal] = useState(false)
  const toastTimerRef = useRef(null)
  const [toastMsg, setToastMsg] = useState('')

  const showToastMsg = (msg, duration = 3000) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToastMsg(msg)
    toastTimerRef.current = setTimeout(() => setToastMsg(''), duration)
  }

  // 스마트 입력 모달 상태
  const [showSmartModal, setShowSmartModal] = useState(false)
  const [smartText, setSmartText] = useState('')
  const [smartReminderOffset, setSmartReminderOffset] = useState(null)

  // 앱 시작 시 브리오 0 → 자동 수동 전환
  useEffect(() => {
    if (!hasBrio() && (localStorage.getItem('inputMode') || 'smart') === 'smart') {
      setInputModePersisted('manual')
    }
  }, [])

  // 알림 채널 초기화 및 앱 사용 빈도 트래킹 (앱 시작 시 1회)
  useEffect(() => {
    initNotificationChannels()
    initAdMob()
    
    // 일일 접속 및 연속 접속 트래킹
    trackEngagement('totalOpens', true)
    try {
      const today = new Date().toISOString().slice(0, 10)
      const flags = JSON.parse(localStorage.getItem('briodo_engagement_flags') || '{}')
      if (flags.lastOpenDate !== today) {
        if (flags.lastOpenDate) {
          const lastDate = new Date(flags.lastOpenDate)
          const now = new Date(today)
          const diffDays = (now - lastDate) / (1000 * 60 * 60 * 24)
          if (diffDays === 1) {
            trackEngagement('appStreak', true)
          } else if (diffDays > 1) {
            flags.appStreak = 1
            localStorage.setItem('briodo_engagement_flags', JSON.stringify(flags))
          }
        } else {
          flags.appStreak = 1
          localStorage.setItem('briodo_engagement_flags', JSON.stringify(flags))
        }
        flags.lastOpenDate = today
        localStorage.setItem('briodo_engagement_flags', JSON.stringify(flags))
      }
    } catch(e) {}
  }, [])

  // 할 일 입력 모달 상태
  const [showInputModal, setShowInputModal] = useState(false)
  const [editingTodoId, setEditingTodoId] = useState(null)
  const [newTodo, setNewTodo] = useState({ text: '', description: '', date: todayStr, time: '', tagInput: '', priority: 'medium', reminderOffset: 0, subtasks: [], recurrence: { type: 'none', endDate: null } })
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

  const [showExitToast, setShowExitToast] = useState(false)
  const lastBackPressRef = useRef(0)

  // 잠금화면 모드
  const [isLockScreen, setIsLockScreen] = useState(false)
  const [showLockPreview, setShowLockPreview] = useState(false)
  const [lockScreenEnabled, setLockScreenEnabled] = useState(
    () => localStorage.getItem('lockScreenEnabled') !== 'false'
  )
  const setLockScreenEnabledPersisted = (val) => {
    setLockScreenEnabled(val)
    localStorage.setItem('lockScreenEnabled', String(val))
    if (!val) setIsLockScreen(false)
  }

  // 캘린더 동기화 ON/OFF
  const [calendarSyncEnabled, setCalendarSyncEnabled] = useState(
    () => localStorage.getItem('calendarSyncEnabled') !== 'false'
  )
  const setCalendarSyncEnabledPersisted = (val) => {
    setCalendarSyncEnabled(val)
    localStorage.setItem('calendarSyncEnabled', String(val))
  }

  // 잠금화면 할일 표시 모드: 'today' | 'all'
  const [lockScreenTodoMode, setLockScreenTodoMode] = useState(
    () => localStorage.getItem('lockScreenTodoMode') || 'today'
  )
  const setLockScreenTodoModePersisted = (val) => {
    setLockScreenTodoMode(val)
    localStorage.setItem('lockScreenTodoMode', val)
  }

  // 잠금화면 완료된 할일 표시 여부
  const [lockScreenShowCompleted, setLockScreenShowCompleted] = useState(
    () => localStorage.getItem('lockScreenShowCompleted') === 'true'
  )
  const setLockScreenShowCompletedPersisted = (val) => {
    setLockScreenShowCompleted(val)
    localStorage.setItem('lockScreenShowCompleted', String(val))
  }

  // 잠금화면 글자 크기 (1~7, 기본 4)
  const [lockScreenFontScale, setLockScreenFontScale] = useState(() => {
    const v = parseInt(localStorage.getItem('lockScreenFontScale'))
    return (v >= 1 && v <= 7) ? v : 4
  })
  const setLockScreenFontScalePersisted = (val) => {
    setLockScreenFontScale(val)
    localStorage.setItem('lockScreenFontScale', String(val))
  }

  // 잠금화면 선택 버튼 목록 (최대 6개)
  const [lockScreenButtons, setLockScreenButtons] = useState(() => {
    const saved = localStorage.getItem('lockScreenButtons')
    return saved ? JSON.parse(saved) : ['torch', 'camera', 'qr', 'timer']
  })
  const setLockScreenButtonsPersisted = (val) => {
    setLockScreenButtons(val)
    localStorage.setItem('lockScreenButtons', JSON.stringify(val))
  }

  // 날씨 설정 및 데이터
  const [weatherEnabled, setWeatherEnabled] = useState(
    () => localStorage.getItem('briodo-weatherEnabled') !== 'false'
  )
  const setWeatherEnabledPersisted = (val) => {
    setWeatherEnabled(val)
    localStorage.setItem('briodo-weatherEnabled', String(val))
  }
  // 위치: '' = IP 자동감지, 도시명 직접 지정 가능
  const [weatherLocation, setWeatherLocation] = useState(
    () => localStorage.getItem('briodo-weatherLocation') || ''
  )
  const setWeatherLocationPersisted = (val) => {
    setWeatherLocation(val)
    localStorage.setItem('briodo-weatherLocation', val)
    setWeatherData(null) // 위치 변경 시 캐시 무효화
  }
  const [weatherData, setWeatherData] = useState(null)
  const [weatherLoading, setWeatherLoading] = useState(false)

  useEffect(() => {
    if (!weatherEnabled) return
    let cancelled = false
    setWeatherLoading(true)
    fetchWeather(weatherLocation, lang).then(data => {
      if (!cancelled) { setWeatherData(data); setWeatherLoading(false) }
    })
    return () => { cancelled = true }
  }, [weatherEnabled, weatherLocation, lang])

  const checkLockScreen = async () => {
    if (!LockScreenNative || localStorage.getItem('lockScreenEnabled') === 'false') return
    try {
      const { locked } = await LockScreenNative.isLocked()
      setIsLockScreen(locked)
    } catch(e) {}
  }

  // 잠금화면 표시 시 상태바 아이콘을 흰색으로, 닫을 때 테마 복원
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    if (isLockScreen || showLockPreview) {
      StatusBar.setBackgroundColor({ color: '#0a0a1a' }).catch(() => {})
      StatusBar.setStyle({ style: Style.Dark }).catch(() => {})
    } else {
      syncStatusBar()
    }
  }, [isLockScreen, showLockPreview])

  // 앱 포그라운드 복귀 시 상태바 재동기화 (#51 #48)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    let listener
    CapApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive) setTimeout(() => syncStatusBar(), 300)
    }).then(l => { listener = l })
    return () => listener?.remove()
  }, [syncStatusBar])

  const handleLockToggleTorch = async (on) => {
    try { await LockScreenNative?.toggleTorch({ on }) } catch(e) {}
  }

  const handleLockOpenCamera = async () => {
    try { await LockScreenNative?.openCamera() } catch(e) {}
  }

  const handleLockOpenQrScanner = async () => {
    try { await LockScreenNative?.openQrScanner() } catch(e) {}
  }

  const handleLockOpenTimer = async () => {
    try { await LockScreenNative?.openTimer() } catch(e) {}
  }

  const handleLockOpenCalculator = async () => {
    try { await LockScreenNative?.openCalculator() } catch(e) {}
  }

  const handleLockToggleMediaPlayPause = async () => {
    try { await LockScreenNative?.toggleMediaPlayPause() } catch(e) {}
  }

  const handleLockOpenAlarm = async () => {
    try { await LockScreenNative?.openAlarm() } catch(e) {}
  }

  const handleLockOpenStopwatch = async () => {
    try { await LockScreenNative?.openStopwatch() } catch(e) {}
  }

  const handleLockToggleTodo = (id) => {
    const target = todos.find(t => t.id === id)
    if (!target) return
    toggleComplete({ stopPropagation: () => {} }, id, target.completed)
  }

  const handleLockUpdateTodo = async (id, newText) => {
    if (!newText.trim()) return
    const target = todos.find(t => t.id === id)
    if (!target) return
    const updated = { ...target, text: newText.trim(), updatedAt: Date.now() }
    setTodos(prev => prev.map(t => t.id === id ? updated : t))
    await saveLocalTodo(updated)
    if (user && isOnline) {
      try { await setDoc(doc(db, "todos", id), { text: newText.trim(), updatedAt: serverTimestamp() }, { merge: true }) }
      catch(e) { console.error('Lock update todo error:', e) }
    } else if (user) {
      await addSyncQueue('set', id, { text: newText.trim() })
    }
  }

  const handleLockAddTodo = async (text) => {
    if (!text.trim()) return
    if (!user) {
      const localId = `guest_${Date.now()}`
      const payload = { id: localId, text: text.trim(), description: '', date: todayStr, time: '', tags: [], priority: 'medium', reminderOffset: null, subtasks: [], recurrence: { type: 'none', endDate: null }, completions: {}, completed: false, createdAt: Date.now() }
      setTodos(prev => [...prev, payload])
      await saveLocalTodo(payload)
      return
    }
    try {
      const newDocRef = doc(collection(db, "todos"))
      const initialData = { uid: user.uid, text: text.trim(), description: '', date: todayStr, time: '', tags: [], priority: 'medium', reminderOffset: null, subtasks: [], recurrence: { type: 'none', endDate: null }, completions: {}, completed: false }
      const localPayload = { ...initialData, id: newDocRef.id, createdAt: Date.now() }
      setTodos(prev => [...prev, localPayload])
      await saveLocalTodo(localPayload)
      if (isOnline) await setDoc(newDocRef, { ...initialData, createdAt: serverTimestamp() })
    } catch(e) { console.error('Lock add todo error:', e) }
  }

  // 뒤로가기 처리 (Android)
  const modalStateRef = useRef({ showInputModal, showSmartModal, showSettings, showAchievementsModal, showNotificationsModal })
  useEffect(() => {
    modalStateRef.current = { showInputModal, showSmartModal, showSettings, showAchievementsModal, showNotificationsModal }
  }, [showInputModal, showSmartModal, showSettings, showAchievementsModal, showNotificationsModal])

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const backListener = CapApp.addListener('backButton', () => {
        const { showInputModal, showSmartModal, showSettings, showAchievementsModal, showNotificationsModal } = modalStateRef.current
        if (showInputModal) {
          resetForm()
        } else if (showSmartModal) {
          setShowSmartModal(false)
          setSmartText('')
          setSmartReminderOffset(null)
        } else if (showSettings) {
          setShowSettings(false)
        } else if (showAchievementsModal) {
          setShowAchievementsModal(false)
        } else if (showNotificationsModal) {
          setShowNotificationsModal(false)
        } else {
          const now = Date.now()
          if (now - lastBackPressRef.current < 2000) {
            CapApp.exitApp()
          } else {
            lastBackPressRef.current = now
            setShowExitToast(true)
            setTimeout(() => setShowExitToast(false), 2000)
          }
        }
      })
      // 앱 포그라운드 복귀 시 잠금화면 감지 + 오늘 탭으로 리셋
      const resumeListener = CapApp.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          checkLockScreen()
          setViewMode('date')
          const today = new Date().toISOString().slice(0, 10)
          setSelectedDate(today)
        }
      })
      // 앱 최초 실행 시 잠금화면 체크
      checkLockScreen()
      return () => {
        backListener.then(l => l.remove())
        resumeListener.then(l => l.remove())
      }
    }
  }, [])

  // 로딩 완료 시 오늘 날짜로 이동
  useEffect(() => {
    if (!loading) handleGoToToday()
  }, [loading])

  const resetForm = () => {
    setNewTodo({ text: '', description: '', date: todayStr, time: '', tagInput: '', priority: 'medium', reminderOffset: defaultReminderOffset, subtasks: [], recurrence: { type: 'none', endDate: null } })
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
      priority: todo.priority ?? 'medium',
      reminderOffset: todo.reminderOffset ?? null,
      subtasks: todo.subtasks || [],
      recurrence: todo.recurrence || { type: 'none', endDate: null },
      completed: todo.completed ?? false
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
    setNewTodo({ text: '', description: '', date: defaultDate, time: defaultTime, tagInput: '', priority: 'medium', reminderOffset: defaultReminderOffset })
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
    const savedReminderOffset = newTodo.reminderOffset ?? null
    const savedSubtasks = (newTodo.subtasks || []).filter(st => st.text.trim())
    const savedRecurrence = newTodo.recurrence || { type: 'none', endDate: null }
    const savedCompleted = newTodo.completed ?? false
    const isEdit = !!editingTodoId
    const editId = editingTodoId

    resetForm()

    try {
      if (!isEdit) {
        // 게스트 모드: 로컬에만 저장
        if (!user) {
          const localId = `guest_${Date.now()}`
          const localPayload = { id: localId, text: savedText, description: savedDesc, date: savedDate, time: savedTime, tags: inputTags, priority: savedPriority, reminderOffset: savedReminderOffset, subtasks: savedSubtasks, recurrence: savedRecurrence, completions: {}, completed: false, createdAt: Date.now() }
          setTodos(prev => [...prev, localPayload])
          await saveLocalTodo(localPayload)
          scheduleNotification(localPayload)
          return
        }

        // 신규 생성
        const newDocRef = doc(collection(db, "todos"))
        const newId = newDocRef.id
        const initialData = { uid: user.uid, text: savedText, description: savedDesc, date: savedDate, time: savedTime, tags: inputTags, priority: savedPriority, reminderOffset: savedReminderOffset, subtasks: savedSubtasks, recurrence: savedRecurrence, completions: {}, completed: false }
        const localPayload = { ...initialData, id: newId, createdAt: Date.now() }

        setTodos(prev => [...prev, localPayload])
        await saveLocalTodo(localPayload)
        scheduleNotification(localPayload)

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
        const updateData = { text: savedText, description: savedDesc, date: savedDate, time: savedTime, tags: inputTags, priority: savedPriority, reminderOffset: savedReminderOffset, subtasks: savedSubtasks, recurrence: savedRecurrence, completed: savedCompleted }
        const oldTodo = todos.find(t => t.id === editId) || {}
        const updatedTodo = { ...oldTodo, ...updateData }

        setTodos(prev => prev.map(t => t.id === editId ? { ...t, ...updateData } : t))
        await saveLocalTodo(updatedTodo)

        // 알림 재스케줄 (시간/날짜 변경 반영)
        if (savedReminderOffset !== null) scheduleNotification({ ...updatedTodo, id: editId })
        else cancelNotification(editId)

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
    
    // AI 사용 플래그
    trackEngagement('aiUsed')
    trackEngagement('aiTasks', true)
    const savedReminderOffset = smartReminderOffset
    const today = todayStr
    setShowSmartModal(false)
    setSmartText('')
    setSmartReminderOffset(null)

    if (!user) {
      const localId = `guest_${Date.now()}`
      const localPayload = { id: localId, text: savedText, description: '', date: today, time: '', tags: [], priority: 'medium', reminderOffset: savedReminderOffset, completed: false, createdAt: Date.now() }
      setTodos(prev => [...prev, localPayload])
      await saveLocalTodo(localPayload)
      scheduleNotification(localPayload)
      return
    }

    const newDocRef = doc(collection(db, "todos"))
    const newId = newDocRef.id
    const initialData = { uid: user.uid, text: savedText, description: '', date: today, time: '', tags: [], priority: 'medium', reminderOffset: savedReminderOffset, completed: false }
    const localPayload = { ...initialData, id: newId, createdAt: Date.now() }

    setTodos(prev => [...prev, localPayload])
    await saveLocalTodo(localPayload)

    if (isOnline) {
      await setDoc(newDocRef, { ...initialData, createdAt: serverTimestamp() })
      setTimeout(async () => {
        try {
          let finalData = { text: savedText, date: today, time: '', tags: [], reminderOffset: savedReminderOffset }
          if (hasBrio(2)) {
            const ai = await getAiFullAnalysis(savedText)
            if (ai) {
              finalData = {
                text: ai.refinedText || savedText,
                date: ai.date || today,
                time: ai.time || '',
                tags: ai.categories || [],
                reminderOffset: savedReminderOffset
              }
              setTodos(prev => prev.map(t => t.id === newId ? { ...t, ...finalData } : t))
              await saveLocalTodo({ ...localPayload, ...finalData })
              await setDoc(newDocRef, { ...finalData, updatedAt: serverTimestamp() }, { merge: true })
              consumeBrio(2) // AI 전체 분석(태그+일정+우선순위) = 2 브리오
            }
          }
          // AI 분석 완료 후 알림 스케줄 (날짜가 확정된 시점)
          scheduleNotification({ ...localPayload, ...finalData, id: newId })
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
      if (savedReminderTime) scheduleNotification({ ...localPayload })
    }
  }

  // 필터링
  const allUsedTags = useMemo(() => {
    const tags = new Set()
    // date 뷰: 선택한 날짜의 할일 태그만, 그 외: 전체
    const source = viewMode === 'date'
      ? todos.filter(t => t.date === selectedDate)
      : todos
    source.forEach(todo => todo.tags?.forEach(tag => tags.add(tag)))
    return Array.from(tags)
  }, [todos, viewMode, selectedDate])

  const filteredTodos = useMemo(() => {
    const sortByDate = (a, b) => {
      const dtA = new Date(`${a.date} ${a.time && a.time.includes(':') ? a.time : '00:00'}`)
      const dtB = new Date(`${b.date} ${b.time && b.time.includes(':') ? b.time : '00:00'}`)
      return dtA - dtB
    }
    // 검색 모드: 날짜 필터 무시, 전체에서 텍스트/태그/설명 검색
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      return [...todos].filter(todo =>
        todo.text?.toLowerCase().includes(q) ||
        todo.description?.toLowerCase().includes(q) ||
        todo.tags?.some(tag => tag.toLowerCase().includes(q))
      ).sort(sortByDate)
    }
    let list = []
    if (viewMode === 'date') {
      // 날짜별 뷰: 반복 일정 인스턴스 생성
      for (const todo of todos) {
        const isRecurring = todo.recurrence?.type && todo.recurrence.type !== 'none'
        if (isRecurring) {
          if (matchesRecurrence(todo, selectedDate)) {
            const isCompleted = todo.completions?.[selectedDate] ?? false
            list.push({ ...todo, _instanceDate: selectedDate, completed: isCompleted })
          }
        } else if (todo.date === selectedDate) {
          list.push(todo)
        }
      }
    } else {
      list = [...todos]
    }
    if (selectedTag) list = list.filter(todo => todo.tags?.includes(selectedTag))
    return list.sort(sortByDate)
  }, [todos, viewMode, selectedDate, selectedTag, searchQuery])

  const activeTodos = useMemo(() => filteredTodos.filter(todo => !todo.completed), [filteredTodos])
  const completedTodos = filteredTodos.filter(todo => todo.completed)

  // 검색 중에도 헤더 완료율은 전체 기준 유지
  const headerActiveTodosCount = useMemo(
    () => searchQuery.trim() ? todos.filter(t => !t.completed).length : activeTodos.length,
    [searchQuery, todos, activeTodos]
  )
  const headerCompletedTodosCount = useMemo(
    () => searchQuery.trim() ? todos.filter(t => t.completed).length : completedTodos.length,
    [searchQuery, todos, completedTodos]
  )

  // 전체 할일 뷰: 반복 일정 제외, 날짜순 정렬
  const allTodosSorted = useMemo(() => {
    const sortByDate = (a, b) => {
      const dtA = new Date(`${a.date} ${a.time?.includes(':') ? a.time : '00:00'}`)
      const dtB = new Date(`${b.date} ${b.time?.includes(':') ? b.time : '00:00'}`)
      return dtA - dtB
    }
    const base = todos
      .filter(t => !t.recurrence?.type || t.recurrence.type === 'none')
      .filter(t => !selectedTag || t.tags?.includes(selectedTag))
      .sort(sortByDate)
    return { incomplete: base.filter(t => !t.completed), completed: base.filter(t => t.completed) }
  }, [todos, selectedTag])
  const allIncompleteTodos = allTodosSorted.incomplete
  const allCompletedTodos = allTodosSorted.completed

  // Deep Work Pulse: 최근 7일 일별 활동량
  const weeklyPulse = useMemo(() => {
    const result = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().slice(0, 10)
      const dayTodos = todos.filter(t => t.date === dateStr)
      result.push({ date: dateStr, total: dayTodos.length, completed: dayTodos.filter(t => t.completed).length })
    }
    return result
  }, [todos])

  const { unlockedIds, unlockedSortedByDifficulty, notifications, clearNotifications, currentUnlock, dismissUnlock } = useAchievements({ todos, todayStr, weeklyPulse, user, chargeBrio })

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

  if (isLockScreen || showLockPreview) {
    return (
      <LockScreenView
        todos={todos}
        lang={lang}
        todayStr={todayStr}
        onOpen={() => { if (showLockPreview) { setShowLockPreview(false); setShowSettings(true) } else { setIsLockScreen(false) } }}
        isPreview={showLockPreview}
        onAddTodo={handleLockAddTodo}
        onToggleTodo={handleLockToggleTodo}
        onUpdateTodo={handleLockUpdateTodo}
        buttons={lockScreenButtons}
        todoMode={lockScreenTodoMode}
        showCompleted={lockScreenShowCompleted}
        lockFontScale={lockScreenFontScale}
        onToggleTorch={handleLockToggleTorch}
        onOpenCamera={handleLockOpenCamera}
        onOpenQrScanner={handleLockOpenQrScanner}
        onOpenTimer={handleLockOpenTimer}
        onOpenCalculator={handleLockOpenCalculator}
        onToggleMediaPlayPause={handleLockToggleMediaPlayPause}
        onOpenAlarm={handleLockOpenAlarm}
        onOpenStopwatch={handleLockOpenStopwatch}
        weatherData={weatherEnabled ? weatherData : null}
      />
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
        searchQuery={searchQuery} setSearchQuery={(q) => { setSearchQuery(q); if (q.trim()) trackEngagement('searchUsed'); }}
        isSearchOpen={isSearchOpen} setIsSearchOpen={setIsSearchOpen}
        activeTodosCount={headerActiveTodosCount}
        completedTodosCount={headerCompletedTodosCount}
        weeklyPulse={weeklyPulse}
        allIncompleteTodosCount={allIncompleteTodos.length}
        notificationCount={notifications.length}
        onNotificationTap={() => setShowNotificationsModal(true)}
        weatherData={weatherEnabled ? weatherData : null}
        weatherLoading={weatherLoading}
        brioBalance={brioBalance}
        maxBrio={maxBrio}
        nextChargeMs={nextChargeMs}
        onBrioClick={() => setShowBrioChargeModal(true)}
      />

      {showNotificationsModal && (
        <NotificationsModal
          onClose={() => { setShowNotificationsModal(false); clearNotifications() }}
          notifications={notifications}
          onShowAllAchievements={() => { setShowNotificationsModal(false); clearNotifications(); setShowAchievementsModal(true) }}
          lang={lang}
        />
      )}

      {tokenExpired && (
        <div className="token-expired-banner" onClick={() => { setTokenExpired(false); handleLogin() }}>
          {t.calendarExpired}
        </div>
      )}

      <div className="todo-list-section">
        {viewMode === 'date' && (
          <TodoList
            user={user} t={t} lang={lang}
            activeTodos={activeTodos}
            completedTodos={completedTodos}
            viewMode={viewMode}
            showAllIncomplete={false}
            todayStr={todayStr}
            openEditModal={openEditModal}
            toggleComplete={toggleComplete}
            toggleSubtaskComplete={toggleSubtaskComplete}
            deleteTodo={deleteTodo}
          />
        )}
        {viewMode === 'all' && (
          <TodoList
            user={user} t={t} lang={lang}
            activeTodos={allIncompleteTodos}
            completedTodos={allCompletedTodos}
            viewMode={viewMode}
            showAllIncomplete={true}
            todayStr={todayStr}
            openEditModal={openEditModal}
            toggleComplete={toggleComplete}
            toggleSubtaskComplete={toggleSubtaskComplete}
            deleteTodo={deleteTodo}
          />
        )}
        {viewMode === 'lists' && !searchQuery.trim() && (
          <CollectionsScreen
            todos={todos}
            t={t} lang={lang}
            openEditModal={openEditModal}
            toggleComplete={toggleComplete}
            todayStr={todayStr}
            weeklyPulse={weeklyPulse}
            unlockedIds={unlockedIds}
            unlockedSortedByDifficulty={unlockedSortedByDifficulty}
            onShowAllAchievements={() => setShowAchievementsModal(true)}
          />
        )}
        {/* 검색 활성화 시: viewMode 무관하게 검색 결과 표시 */}
        {searchQuery.trim() && viewMode === 'lists' && (
          <TodoList
            user={user} t={t} lang={lang}
            activeTodos={activeTodos}
            completedTodos={completedTodos}
            viewMode='all'
            showAllIncomplete={true}
            todayStr={todayStr}
            openEditModal={openEditModal}
            toggleComplete={toggleComplete}
            toggleSubtaskComplete={toggleSubtaskComplete}
            deleteTodo={deleteTodo}
          />
        )}
      </div>

      {/* FAB: date/all/lists 뷰에서만 표시 */}
      {(viewMode === 'date' || viewMode === 'all' || viewMode === 'lists') && (
        <button
          className="fab"
          onClick={() => {
            const mode = user ? inputMode : 'manual'
            if (mode === 'smart') {
              if (!hasBrio(2)) {
                setShowBrioChargeModal(true)
              } else {
                setShowSmartModal(true)
              }
            } else {
              handleOpenAddModal()
            }
          }}
        >
          {(user ? inputMode : 'manual') === 'smart'
            ? <span style={{ fontSize: '22px', lineHeight: 1 }}>✨</span>
            : <svg viewBox="0 0 24 24" fill="white" width="26" height="26"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
          }
        </button>
      )}

      <BottomNav
        lang={lang} t={t}
        viewMode={viewMode} setViewMode={setViewMode}
        todayStr={todayStr} setSelectedDate={setSelectedDate}
        showSettings={showSettings} setShowSettings={setShowSettings}
      />

      {showSmartModal && (
        <SmartInputModal
          lang={lang}
          smartText={smartText} setSmartText={setSmartText}
          isAiAnalyzing={isAiAnalyzing}
          onClose={() => { setShowSmartModal(false); setSmartText(''); setSmartReminderOffset(null) }}
          onSave={handleSmartSave}
          reminderOffset={smartReminderOffset} setReminderOffset={setSmartReminderOffset}
          defaultReminderOffset={defaultReminderOffset}
          autoStartVoice={!smartText}
          brioBalance={brioBalance}
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
          lang={lang} langPref={langPref} setLangPref={setLangPref} t={t}
          fontScale={fontScale} setFontScale={setFontScale}
          theme={theme} setTheme={setTheme} generateRandomTheme={generateRandomTheme}
          viewMode={viewMode} setViewMode={setViewMode}
          setSelectedDate={setSelectedDate}
          inputMode={inputMode} setInputMode={setInputModePersisted}
          brioBalance={brioBalance}
          onAiLimitToast={(msg) => showToastMsg(msg)}
          completionCalendarMode={completionCalendarMode} setCompletionCalendarMode={setCompletionCalendarModePersisted}
          defaultReminderOffset={defaultReminderOffset} setDefaultReminderOffset={setDefaultReminderOffsetPersisted}
          allDayReminderTime={allDayReminderTime} setAllDayReminderTime={setAllDayReminderTimePersisted}
          user={user} handleLogin={handleLogin} handleLogout={handleLogout}
          lockScreenEnabled={lockScreenEnabled} setLockScreenEnabled={setLockScreenEnabledPersisted}
          lockScreenTodoMode={lockScreenTodoMode} setLockScreenTodoMode={setLockScreenTodoModePersisted}
          lockScreenShowCompleted={lockScreenShowCompleted} setLockScreenShowCompleted={setLockScreenShowCompletedPersisted}
          lockScreenFontScale={lockScreenFontScale} setLockScreenFontScale={setLockScreenFontScalePersisted}
          lockScreenButtons={lockScreenButtons} setLockScreenButtons={setLockScreenButtonsPersisted}
          calendarSyncEnabled={calendarSyncEnabled} setCalendarSyncEnabled={setCalendarSyncEnabledPersisted}
          weatherEnabled={weatherEnabled} setWeatherEnabled={setWeatherEnabledPersisted}
          weatherLocation={weatherLocation} setWeatherLocation={setWeatherLocationPersisted}
          onPreviewLockScreen={() => { setShowSettings(false); setShowLockPreview(true) }}
          setShowSettings={setShowSettings}
          appVersion={APP_VERSION}
        />
      )}

      {showAchievementsModal && (
        <AchievementsModal
          onClose={() => setShowAchievementsModal(false)}
          unlockedIds={unlockedIds}
          lang={lang}
        />
      )}

      {showExitToast && (
        <div className="exit-toast">
          {lang === 'ko' ? '한 번 더 누르면 종료됩니다' : lang === 'ja' ? 'もう一度押すと終了します' : lang === 'zh' ? '再按一次退出' : 'Press again to exit'}
        </div>
      )}
      {toastMsg && (
        <div className="exit-toast" style={{ bottom: '90px', maxWidth: '300px', textAlign: 'center', whiteSpace: 'normal', lineHeight: '1.5' }}>
          {toastMsg}
        </div>
      )}
      <AchievementUnlockModal
        achievement={currentUnlock}
        onDismiss={dismissUnlock}
        lang={lang}
      />

      {showOnboarding && (
        <OnboardingModal
          lang={lang}
          setLangPref={setLangPref}
          handleLogin={handleLogin}
          onDone={() => setShowOnboarding(false)}
        />
      )}

      {showBrioChargeModal && (
        <BrioChargeModal
          lang={lang}
          balance={brioBalance}
          onCharge={chargeBrio}
          onClose={() => setShowBrioChargeModal(false)}
        />
      )}

    </div>
  )
}

export default App
