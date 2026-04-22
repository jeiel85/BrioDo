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
import { LocalNotifications } from '@capacitor/local-notifications'
import { scheduleNotification, cancelNotification, initNotificationChannels, scheduleBriefingNotifications } from './hooks/useNotifications'
import { initAdMob } from './hooks/useAdMob'
import { fetchWeather } from './hooks/useWeather'
import { useBriefing } from './hooks/useBriefing'
import { BriefingModal } from './components/BriefingModal'

import { useLanguage } from './hooks/useLanguage'
import { useAuth } from './hooks/useAuth'
import { useTheme } from './hooks/useTheme'
import { useTodosData } from './hooks/useTodosData'
import { useCalendarNav } from './hooks/useCalendarNav'
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
import './index.css'

const LockScreenNative = Capacitor.isNativePlatform() ? registerPlugin('LockScreen') : null
const StatusBarNotifNative = Capacitor.isNativePlatform() ? registerPlugin('StatusBarNotification') : null

const APP_VERSION = '1.1.3'

function App() {
  const { lang, langPref, setLangPref, t } = useLanguage()
  const { user, loading, handleLogin, handleLogout, tokenExpired, setTokenExpired } = useAuth()
  const [showOnboarding, setShowOnboarding] = useState(() => shouldShowOnboarding())
  const { theme, setTheme, fontScale, setFontScale, generateRandomTheme, syncStatusBar } = useTheme()

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
  const [briefingEnabled, setBriefingEnabled] = useState(
    () => localStorage.getItem('briodo-briefingEnabled') === 'true'
  )
  const setBriefingEnabledPersisted = (val) => {
    setBriefingEnabled(val)
    localStorage.setItem('briodo-briefingEnabled', String(val))
  }
  const [morningBriefingTime, setMorningBriefingTime] = useState(
    () => localStorage.getItem('briodo-morningBriefingTime') || '08:00'
  )
  const setMorningBriefingTimePersisted = (val) => {
    setMorningBriefingTime(val)
    localStorage.setItem('briodo-morningBriefingTime', val)
  }
  const [eveningBriefingTime, setEveningBriefingTime] = useState(
    () => localStorage.getItem('briodo-eveningBriefingTime') || '21:00'
  )
  const setEveningBriefingTimePersisted = (val) => {
    setEveningBriefingTime(val)
    localStorage.setItem('briodo-eveningBriefingTime', val)
  }
  const [showBriefingModal, setShowBriefingModal] = useState(false)
  const [briefingType, setBriefingType] = useState('morning')
  const setCompletionCalendarModePersisted = (mode) => {
    setCompletionCalendarMode(mode)
    localStorage.setItem('completionCalendarMode', mode)
  }

  const { todos, setTodos, isOnline, isAiAnalyzing, toggleComplete, toggleSubtaskComplete, deleteTodo, getAiFullAnalysis } = useTodosData(user, { completionCalendarMode, lang })
  const { briefingText, briefingLoading, generateBriefing } = useBriefing()
  const { todayStr, selectedDate, setSelectedDate, calendarExpanded, setCalendarExpanded, viewMonth, viewMonthLabel, currentWeekDates, monthGridDates, weekdayNames, prevWeek, nextWeek, prevMonth, nextMonth, goToMonth, handleGoToToday } = useCalendarNav(lang)

  const [defaultView, setDefaultViewState] = useState(() => localStorage.getItem('briodo-defaultView') || localStorage.getItem('briodo-viewMode') || 'date')
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('briodo-defaultView') || localStorage.getItem('briodo-viewMode') || 'date')
  const [allViewPeriod, setAllViewPeriod] = useState(() => localStorage.getItem('briodo-allViewPeriod') || 'all')
  const [settingsScreen, setSettingsScreen] = useState('main')
  const [headerCollapsed, setHeaderCollapsed] = useState(false)
  const todoListRef = useRef(null)   // 스크롤 가능한 content div (scrollTop 리셋용)
  const currentPanelRef = useRef(null) // 헤더+콘텐츠 전체 슬라이딩 패널
  const swipeTouchRef = useRef(null) // 스와이프 시작 좌표
  const swipeEnterDirRef = useRef(null) // 탭 전환 시 새 콘텐츠 진입 방향 ('left'|'right')
  const adjacentPanelRef = useRef(null) // 스와이프 중 옆에 붙어오는 인접 탭 패널 (헤더 포함 풀스크린)
  const swipeAdjacentBaseRef = useRef(0) // 인접 패널 시작 오프셋 (+/- window.innerWidth)
  const [swipingToTab, setSwipingToTab] = useState(null) // 스와이프 중 보여줄 인접 탭
  const setAllViewPeriodPersisted = (v) => { setAllViewPeriod(v); localStorage.setItem('briodo-allViewPeriod', v) }
  const setDefaultViewPersisted = (v) => { setDefaultViewState(v); localStorage.setItem('briodo-defaultView', v) }
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
    // 탭 전환 시 헤더 펼치기 + 스크롤 초기화
    setHeaderCollapsed(false)
    if (todoListRef.current) todoListRef.current.scrollTop = 0

    // 탭 버튼 클릭 전환 시: 슬라이드인 애니메이션 (스와이프는 인접 패널이 처리)
    if (swipeEnterDirRef.current) {
      const fromX = swipeEnterDirRef.current === 'right' ? '100%' : '-100%'
      swipeEnterDirRef.current = null
      const transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      if (currentPanelRef.current) {
        currentPanelRef.current.style.transition = 'none'
        currentPanelRef.current.style.transform = `translateX(${fromX})`
        currentPanelRef.current.getBoundingClientRect()
        currentPanelRef.current.style.transition = transition
        currentPanelRef.current.style.transform = 'translateX(0)'
      }
    }
  }, [viewMode])

  const switchTab = (mode) => {
    setViewMode(mode)
    setIsSearchOpen(false)
    setSearchQuery('')
  }

  const TAB_ORDER = ['date', 'all', 'lists']
  const handleSwipeStart = (e) => {
    // 할일 카드 위에서 시작된 터치는 탭 스와이프 무시 (#125)
    if (e.target.closest('.todo-card')) return
    const t = e.touches[0]
    swipeTouchRef.current = { x: t.clientX, y: t.clientY, locked: null }
    if (currentPanelRef.current) currentPanelRef.current.style.transition = 'none'
  }
  const handleSwipeMove = (e) => {
    const ref = swipeTouchRef.current
    if (!ref) return
    const dx = e.touches[0].clientX - ref.x
    const dy = e.touches[0].clientY - ref.y
    // 방향 미결정 상태에서 수직이 우세하면 스와이프 취소
    if (ref.locked === null) {
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) { swipeTouchRef.current = null; return }
      if (Math.abs(dx) > 8) {
        ref.locked = 'h'
        // 인접 탭 결정 후 옆 패널 렌더링 시작
        const idx = TAB_ORDER.indexOf(viewMode)
        const adjacentIdx = dx < 0 ? idx + 1 : idx - 1
        if (adjacentIdx >= 0 && adjacentIdx < TAB_ORDER.length) {
          swipeAdjacentBaseRef.current = dx < 0 ? window.innerWidth : -window.innerWidth
          setSwipingToTab(TAB_ORDER[adjacentIdx])
        }
      } else return
    }
    // 첫/마지막 탭 끝에서 저항감 (rubber band)
    const idx = TAB_ORDER.indexOf(viewMode)
    const atEdge = (idx === 0 && dx > 0) || (idx === TAB_ORDER.length - 1 && dx < 0)
    const offset = atEdge ? dx * 0.25 : dx
    // 헤더+콘텐츠 전체 패널을 같이 이동
    if (currentPanelRef.current) currentPanelRef.current.style.transform = `translateX(${offset}px)`
    // 인접 탭 패널(헤더 포함)을 현재 패널 옆에 붙여서 같이 이동
    if (adjacentPanelRef.current) {
      adjacentPanelRef.current.style.transform = `translateX(${swipeAdjacentBaseRef.current + offset}px)`
    }
  }
  const handleSwipeEnd = (e) => {
    if (!swipeTouchRef.current) return
    const dx = e.changedTouches[0].clientX - swipeTouchRef.current.x
    const dy = e.changedTouches[0].clientY - swipeTouchRef.current.y
    swipeTouchRef.current = null
    const transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    const idx = TAB_ORDER.indexOf(viewMode)
    const canGoLeft = dx < 0 && idx < TAB_ORDER.length - 1
    const canGoRight = dx > 0 && idx > 0
    const shouldSwitch = Math.abs(dx) >= 50 && Math.abs(dx) >= Math.abs(dy)

    if (shouldSwitch && (canGoLeft || canGoRight)) {
      // 현재 패널(헤더+콘텐츠): 스와이프 방향으로 완전히 밀어냄
      const outX = dx < 0 ? -window.innerWidth : window.innerWidth
      if (currentPanelRef.current) {
        currentPanelRef.current.style.transition = transition
        currentPanelRef.current.style.transform = `translateX(${outX}px)`
      }
      // 인접 패널: 중앙(0)으로 슬라이드인
      if (adjacentPanelRef.current) {
        adjacentPanelRef.current.style.transition = transition
        adjacentPanelRef.current.style.transform = 'translateX(0)'
      }
      // 애니메이션 완료 후 실제 탭 전환 + 정리
      swipeEnterDirRef.current = null // useEffect의 별도 slide-in 방지
      setTimeout(() => {
        if (canGoLeft) switchTab(TAB_ORDER[idx + 1])
        else switchTab(TAB_ORDER[idx - 1])
        if (currentPanelRef.current) {
          currentPanelRef.current.style.transition = 'none'
          currentPanelRef.current.style.transform = 'translateX(0)'
        }
        setSwipingToTab(null)
      }, 300)
    } else {
      // 임계값 미달 — 현재 패널 원위치, 인접 패널 밀어냄
      if (currentPanelRef.current) {
        currentPanelRef.current.style.transition = transition
        currentPanelRef.current.style.transform = 'translateX(0)'
      }
      if (adjacentPanelRef.current) {
        adjacentPanelRef.current.style.transition = transition
        adjacentPanelRef.current.style.transform = `translateX(${swipeAdjacentBaseRef.current}px)`
      }
      setTimeout(() => setSwipingToTab(null), 300)
    }
  }

  // 입력 모드: 'smart' | 'manual' (기본값: manual — 로그인 전에는 항상 manual)
  const [inputMode, setInputMode] = useState(() => localStorage.getItem('inputMode') || 'manual')
  const setInputModePersisted = (mode) => { setInputMode(mode); localStorage.setItem('inputMode', mode) }

  const toastTimerRef = useRef(null)
  const smartSaveCancelRef = useRef(null)
  const [toastMsg, setToastMsg] = useState('')

  const showToastMsg = (msg, duration = 3000) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToastMsg(msg)
    toastTimerRef.current = setTimeout(() => setToastMsg(''), duration)
  }

  const handleLoginWithFeedback = () => {
    handleLogin((e) => {
      // 사용자가 직접 취소한 경우는 toast 표시 안 함
      const code = e?.code || ''
      if (code === '12501' || code === 'auth/popup-closed-by-user') return
      const msg = lang === 'ko'
        ? `로그인 실패: ${e?.message || '알 수 없는 오류'}`
        : lang === 'ja' ? `ログイン失敗: ${e?.message || '不明なエラー'}`
        : lang === 'zh' ? `登录失败: ${e?.message || '未知错误'}`
        : `Login failed: ${e?.message || 'Unknown error'}`
      showToastMsg(msg, 5000)
    })
  }

  // 스마트 입력 모달 상태
  const [showSmartModal, setShowSmartModal] = useState(false)
  const [smartText, setSmartText] = useState('')
  const [smartReminderOffset, setSmartReminderOffset] = useState(null)

  // 알림 채널 초기화 및 앱 사용 빈도 트래킹 (앱 시작 시 1회)
  useEffect(() => {
    initNotificationChannels()
    initAdMob()
    // App Check - 현재 비활성화 (릴리즈 시 활성화 예정)
    // initAppCheck()

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
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      scheduleBriefingNotifications(morningBriefingTime, eveningBriefingTime, briefingEnabled)
    }
  }, [briefingEnabled, morningBriefingTime, eveningBriefingTime])

  useEffect(() => {
    const listener = LocalNotifications.addListener('localNotificationActionPerformed', (event) => {
      if (event.notification?.extra?.action === 'briefing') {
        setBriefingType(event.notification.extra.type || 'morning')
        setShowBriefingModal(true)
      }
    })
    return () => { listener.then(l => l.remove()).catch(() => {}) }
  }, [])

  // 할 일 입력 모달 상태
  const [showInputModal, setShowInputModal] = useState(false)
  const [editingTodoId, setEditingTodoId] = useState(null)
  const [newTodo, setNewTodo] = useState({ text: '', description: '', date: todayStr, time: '', tagInput: '', priority: 'medium', reminderOffset: 0, subtasks: [], recurrence: { type: 'none', endDate: null } })
  const [showDescInput, setShowDescInput] = useState(false)


  const [showExitToast, setShowExitToast] = useState(false)
  const lastBackPressRef = useRef(0)

  // 잠금화면 모드
  const [isLockScreen, setIsLockScreen] = useState(false)
  const [showLockPreview, setShowLockPreview] = useState(false)
  const [lockScreenEnabled, setLockScreenEnabled] = useState(
    () => localStorage.getItem('lockScreenEnabled') === 'true'
  )
  const [overlayPermGranted, setOverlayPermGranted] = useState(true) // 낙관적 기본값
  const setLockScreenEnabledPersisted = async (val) => {
    setLockScreenEnabled(val)
    localStorage.setItem('lockScreenEnabled', String(val))
    if (val) {
      // ── Step 1: POST_NOTIFICATIONS 권한 확인/요청 (Android 13+) ──
      // 이 권한이 없으면 startForeground 알림이 차단돼 서비스가 정상 동작 불가
      if (Capacitor.isNativePlatform()) {
        try {
          const { display } = await LocalNotifications.requestPermissions()
          if (display !== 'granted') {
            // 권한 거부 → 토글 원래대로 되돌리고 종료
            setLockScreenEnabled(false)
            localStorage.setItem('lockScreenEnabled', 'false')
            return
          }
        } catch { /* ignore */ }
      }

      // ── Step 2: 포어그라운드 서비스 시작 ──
      LockScreenNative?.startLockScreenService().catch(() => {})

      // ── Step 3: USE_FULL_SCREEN_INTENT 권한 확인 (Android 14+) ──
      // 없으면 설정 화면으로 안내 (화면 켜짐 시 자동 실행에 필요)
      try {
        const res = await LockScreenNative?.canUseFullScreenIntent()
        if (res && res.value === false) {
          setTimeout(() => {
            LockScreenNative?.openFullScreenIntentSettings().catch(() => {})
          }, 500)
        }
      } catch { /* ignore */ }

      // ── Step 4: SYSTEM_ALERT_WINDOW 권한 확인 ──
      // 신뢰할 수 있는 장소 등 잠금 해제 상태에서도 잠금화면 위젯 표시에 필요
      // ("다른 앱 위에 표시" 권한)
      try {
        const overlayRes = await LockScreenNative?.canDrawOverlays()
        if (overlayRes && overlayRes.value === false) {
          setTimeout(() => {
            LockScreenNative?.openDrawOverlaysSettings().catch(() => {})
          }, 1500)
        }
      } catch { /* ignore */ }
    } else {
      // 잠금화면 비활성화: 서비스 종료 + 알림 제거
      LockScreenNative?.stopLockScreenService().catch(() => {})
      setIsLockScreen(false)
    }
  }

  // 캘린더 동기화 ON/OFF
  const [calendarSyncEnabled, setCalendarSyncEnabled] = useState(
    () => localStorage.getItem('calendarSyncEnabled') !== 'false'
  )
  const setCalendarSyncEnabledPersisted = (val) => {
    setCalendarSyncEnabled(val)
    localStorage.setItem('calendarSyncEnabled', String(val))
  }
  // 시간 없는 일정 캘린더 동기화: 'allday' | 'skip'
  const [calendarSyncNoTime, setCalendarSyncNoTime] = useState(
    () => localStorage.getItem('briodo-calendarSyncNoTime') || 'allday'
  )
  const setCalendarSyncNoTimePersisted = (val) => {
    setCalendarSyncNoTime(val)
    localStorage.setItem('briodo-calendarSyncNoTime', val)
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

  // ── 상태바 상주 알림 설정 ─────────────────────────────────────────────────
  const [statusBarNotifEnabled, setStatusBarNotifEnabled] = useState(
    () => localStorage.getItem('briodo-statusBarNotifEnabled') !== 'false'
  )
  // 알림 내용 표시 방식: 'fixed' | 'tasks' | 'weather'
  const [statusBarContentStyle, setStatusBarContentStyle] = useState(
    () => localStorage.getItem('briodo-statusBarContentStyle') || 'fixed'
  )

  const setStatusBarNotifEnabledPersisted = (val) => {
    setStatusBarNotifEnabled(val)
    localStorage.setItem('briodo-statusBarNotifEnabled', String(val))
    if (val) {
      StatusBarNotifNative?.start({}).catch(() => {})
      // 상태바 알림 서비스가 배터리 최적화로 종료되지 않도록 예외 등록 요청
      // 이미 등록된 경우 다이얼로그 없이 즉시 반환됨
      if (Capacitor.isNativePlatform()) {
        StatusBarNotifNative?.requestIgnoreBatteryOptimizations?.().catch(() => {})
      }
    } else {
      StatusBarNotifNative?.stop().catch(() => {})
    }
  }

  const setStatusBarContentStylePersisted = (val) => {
    setStatusBarContentStyle(val)
    localStorage.setItem('briodo-statusBarContentStyle', val)
  }

  // 앱 시작 시 알림 서비스 시작 + 배터리 최적화 예외 1회 요청
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    if (localStorage.getItem('briodo-statusBarNotifEnabled') === 'false') return
    StatusBarNotifNative?.start({}).catch(() => {})
    // 기기 제조사 배터리 최적화가 서비스를 종료하는 것을 방지.
    // 이미 예외 처리된 경우 다이얼로그 없이 즉시 반환. 앱 설치 후 최초 1회만 표시.
    if (!localStorage.getItem('briodo-batteryOptAsked')) {
      StatusBarNotifNative?.requestIgnoreBatteryOptimizations?.()
        .then(() => localStorage.setItem('briodo-batteryOptAsked', '1'))
        .catch(() => {})
    }
  }, [])

  // 상태바 알림 ➕ 버튼 → SmartInputModal 열기
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    const handler = StatusBarNotifNative?.addListener?.('openSmartInput', () => {
      setShowSmartModal(true)
    })
    return () => { handler?.remove?.() }
  }, [])

  // 상태바 텍스트 — todos 배열 전체 대신 필요한 값만 계산
  const statusBarText = useMemo(() => {
    if (statusBarContentStyle === 'tasks') {
      const today = new Date().toISOString().slice(0, 10)
      const remaining = todos.filter(t => t.date === today && !t.completed).length
      return lang === 'ko' ? `오늘 남은 할일 ${remaining}개` : `${remaining} tasks left today`
    }
    if (statusBarContentStyle === 'weather' && weatherData) {
      const area = weatherData.area ? ` · ${weatherData.area}` : ''
      return `${weatherData.icon} ${weatherData.tempC}° (${weatherData.lowC}°/${weatherData.highC}°)${area}`
    }
    return null
  }, [statusBarContentStyle, todos, weatherData, lang])

  // 알림 내용 표시 방식에 따라 본문 텍스트 갱신
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !statusBarNotifEnabled) return
    StatusBarNotifNative?.updateContent({ text: statusBarText ?? '' }).catch(() => {})
  }, [statusBarNotifEnabled, statusBarText])

  const checkLockScreen = async () => {
    if (!LockScreenNative || localStorage.getItem('lockScreenEnabled') === 'false') return
    try {
      const { locked } = await LockScreenNative.isLocked()
      // isKeyguardLocked()=false는 Samsung One UI에서 즉시 반환되어 신뢰할 수 없음.
      // 잠금화면 닫기는 사용자 액션(onOpen) 또는 keyguardDismissed 이벤트로만 처리.
      if (locked) setIsLockScreen(true)
    } catch { /* ignore */ }
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

  // 앱 포그라운드 복귀 시 상태바 재동기화는 아래 [] useEffect의 appStateChange 핸들러에서 통합 처리
  const syncStatusBarRef = useRef(syncStatusBar)
  useEffect(() => { syncStatusBarRef.current = syncStatusBar }, [syncStatusBar])

  const handleLockToggleTorch = async (on) => {
    try { await LockScreenNative?.toggleTorch({ on }) } catch { /* ignore */ }
  }

  const handleLockOpenCamera = async () => {
    try { await LockScreenNative?.openCamera() } catch { /* ignore */ }
  }

  const handleLockOpenQrScanner = async () => {
    try { await LockScreenNative?.openQrScanner() } catch { /* ignore */ }
  }

  const handleLockOpenTimer = async () => {
    try { await LockScreenNative?.openTimer() } catch { /* ignore */ }
  }

  const handleLockOpenCalculator = async () => {
    try { await LockScreenNative?.openCalculator() } catch { /* ignore */ }
  }

  const handleLockToggleMediaPlayPause = async () => {
    try { await LockScreenNative?.toggleMediaPlayPause() } catch { /* ignore */ }
  }

  const handleLockOpenAlarm = async () => {
    try { await LockScreenNative?.openAlarm() } catch { /* ignore */ }
  }

  const handleLockOpenStopwatch = async () => {
    try { await LockScreenNative?.openStopwatch() } catch { /* ignore */ }
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
  // 렌더 중 직접 동기 업데이트 — useEffect로 하면 렌더~효과 실행 사이에 백버튼이 눌릴 경우 stale 값 읽힘
  const modalStateRef = useRef({})
  // eslint-disable-next-line react-hooks/refs
  modalStateRef.current = { showInputModal, showSmartModal, showSettings, showAchievementsModal, showNotificationsModal, settingsScreen }

  const resetForm = () => {
    setNewTodo({ text: '', description: '', date: todayStr, time: '', tagInput: '', priority: 'medium', reminderOffset: defaultReminderOffset, subtasks: [], recurrence: { type: 'none', endDate: null } })
    setShowDescInput(false)
    setEditingTodoId(null)
    setShowInputModal(false)
    document.body.classList.remove('modal-open')
  }

  // 설정 모달 닫힐 때 서브화면 리셋
  useEffect(() => {
    if (!showSettings) setSettingsScreen('main')
  }, [showSettings])

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const backListener = CapApp.addListener('backButton', () => {
        const { showInputModal, showSmartModal, showSettings, showAchievementsModal, showNotificationsModal, settingsScreen } = modalStateRef.current
        if (showInputModal) {
          resetForm()
        } else if (showSmartModal) {
          setShowSmartModal(false)
          setSmartText('')
          setSmartReminderOffset(null)
        } else if (showSettings) {
          if (settingsScreen !== 'main') {
            setSettingsScreen('main')
          } else {
            setShowSettings(false)
          }
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
      // + SYSTEM_ALERT_WINDOW 권한 재확인 (사용자가 설정 화면에서 허용/거부 후 돌아왔을 때)
      const resumeListener = CapApp.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          checkLockScreen()
          setViewMode('date')
          const today = new Date().toISOString().slice(0, 10)
          setSelectedDate(today)
          // 상태바 재동기화 (중복 리스너 방지를 위해 여기서 통합 처리)
          setTimeout(() => syncStatusBarRef.current?.(), 300)
          // 잠금화면 활성화 상태면 overlay 권한 재확인
          if (LockScreenNative && localStorage.getItem('lockScreenEnabled') === 'true') {
            LockScreenNative.canDrawOverlays().then(({ value }) => {
              setOverlayPermGranted(value)
            }).catch(() => {})
          }
        }
      })
      // 앱 최초 실행 시 잠금화면 체크 (isKeyguardLocked 기반)
      checkLockScreen()
      // onCreate 경로: 서비스가 startActivity()로 앱을 열었을 때 인텐트 extra 직접 확인
      // isKeyguardLocked() 타이밍과 무관하게 잠금화면 뷰를 보장
      LockScreenNative?.wasLaunchedForLockScreen()
        .then(({ value }) => { if (value) setIsLockScreen(true) })
        .catch(() => {})
      // onNewIntent 경로: 앱 실행 중 서비스가 다시 startActivity()했을 때 이벤트 수신
      const lockScreenSub = LockScreenNative?.addListener('lockScreenShow', () => {
        setIsLockScreen(true)
      })
      // 사용자가 키가드 해제(PIN/생체인증) 시 잠금화면 뷰 닫기
      // checkLockScreen()의 isKeyguardLocked()는 Samsung에서 신뢰할 수 없으므로 이 이벤트로 처리
      const keyguardSub = LockScreenNative?.addListener('keyguardDismissed', () => {
        setIsLockScreen(false)
      })
      // lockScreenEnabled가 true이면 서비스가 실행 중인지 보장
      // + SYSTEM_ALERT_WINDOW 권한 미부여 시 설정 화면 자동 안내
      if (localStorage.getItem('lockScreenEnabled') === 'true') {
        LocalNotifications.checkPermissions().then(({ display }) => {
          if (display === 'granted') {
            LockScreenNative?.startLockScreenService().catch(() => {})
          }
        }).catch(() => {
          LockScreenNative?.startLockScreenService().catch(() => {})
        })
        // 앱 시작 시마다 SYSTEM_ALERT_WINDOW 권한 확인
        // (이전에 권한 없이 활성화된 사용자도 자동 안내)
        if (LockScreenNative) {
          LockScreenNative.canDrawOverlays().then(({ value }) => {
            setOverlayPermGranted(value)
            if (!value) {
              // 약간 지연 후 설정 화면으로 안내 (앱 초기 로드 완료 후)
              setTimeout(() => {
                LockScreenNative.openDrawOverlaysSettings().catch(() => {})
              }, 2000)
            }
          }).catch(() => {})
        }
      }
      return () => {
        backListener.then(l => l.remove())
        resumeListener.then(l => l.remove())
        lockScreenSub?.then(l => l.remove())
        keyguardSub?.then(l => l.remove())
      }
    }
  }, [])

  // 로딩 완료 시 오늘 날짜로 이동
  useEffect(() => {
    if (!loading) handleGoToToday()
  }, [loading])

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
      let cancelled = false
      const cancelRef = { cancel: () => { cancelled = true } }
      smartSaveCancelRef.current = cancelRef
      setTimeout(async () => {
        try {
          let finalData = { text: savedText, date: today, time: '', tags: [], reminderOffset: savedReminderOffset }
          const ai = await getAiFullAnalysis(savedText)
          if (cancelled) return
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
          }
          if (cancelled) return
          // AI 분석 완료 후 알림 스케줄 (날짜가 확정된 시점)
          scheduleNotification({ ...localPayload, ...finalData, id: newId })
          const gId = await syncEventToGoogle({ ...localPayload, ...finalData })
          if (gId) {
            await setDoc(newDocRef, { googleEventId: gId, updatedAt: serverTimestamp() }, { merge: true })
            if (!cancelled) {
              setTodos(prev => prev.map(t => t.id === newId ? { ...t, googleEventId: gId } : t))
              await saveLocalTodo({ ...localPayload, ...finalData, googleEventId: gId })
            }
          }
        } catch (e) { console.error("Smart Save Error:", e) }
      }, 300)
    } else {
      await addSyncQueue('set', newId, initialData)
      if (savedReminderOffset !== null) scheduleNotification({ ...localPayload })
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
    const today = new Date(todayStr + 'T23:59:59')
    const periodStart = (() => {
      if (allViewPeriod === 'all') return null
      const d = new Date(todayStr + 'T00:00:00')
      if (allViewPeriod === 'week') d.setDate(d.getDate() - 6)
      else if (allViewPeriod === 'month') d.setMonth(d.getMonth() - 1)
      else if (allViewPeriod === 'quarter') d.setMonth(d.getMonth() - 3)
      else if (allViewPeriod === 'half') d.setMonth(d.getMonth() - 6)
      else if (allViewPeriod === 'year') d.setFullYear(d.getFullYear() - 1)
      return d
    })()
    const base = todos
      .filter(t => !t.recurrence?.type || t.recurrence.type === 'none')
      .filter(t => !selectedTag || t.tags?.includes(selectedTag))
      .filter(t => {
        if (!periodStart) return true
        if (!t.date) return true
        const d = new Date(t.date + 'T00:00:00')
        if (isNaN(d.getTime())) return true
        return d >= periodStart && d <= today
      })
      .sort(sortByDate)
    return { incomplete: base.filter(t => !t.completed), completed: base.filter(t => t.completed) }
  }, [todos, selectedTag, allViewPeriod, todayStr])
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

  const { unlockedIds, unlockedSortedByDifficulty, notifications, clearNotifications, currentUnlock, dismissUnlock } = useAchievements({ todos, todayStr, weeklyPulse, user })

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

  const renderTabContent = (mode) => (
    <>
      {mode === 'date' && (
        <TodoList
          user={user} t={t} lang={lang}
          activeTodos={activeTodos}
          completedTodos={completedTodos}
          viewMode={mode}
          showAllIncomplete={false}
          todayStr={todayStr}
          openEditModal={openEditModal}
          toggleComplete={toggleComplete}
          toggleSubtaskComplete={toggleSubtaskComplete}
          deleteTodo={deleteTodo}
        />
      )}
      {mode === 'all' && (
        <>
          {!headerCollapsed && <div className="all-period-filter">
            {(['all', 'week', 'month', 'quarter', 'half', 'year']).map(p => (
              <button
                key={p}
                className={`period-filter-btn${allViewPeriod === p ? ' active' : ''}`}
                onClick={() => setAllViewPeriodPersisted(p)}
              >
                {p === 'all' ? (lang === 'ko' ? '전체' : lang === 'ja' ? 'すべて' : lang === 'zh' ? '全部' : 'All')
                : p === 'week' ? (lang === 'ko' ? '1주' : lang === 'ja' ? '1週' : lang === 'zh' ? '1周' : '1W')
                : p === 'month' ? (lang === 'ko' ? '1달' : lang === 'ja' ? '1ヶ月' : lang === 'zh' ? '1月' : '1M')
                : p === 'quarter' ? (lang === 'ko' ? '분기' : lang === 'ja' ? '四半期' : lang === 'zh' ? '季度' : '3M')
                : p === 'half' ? (lang === 'ko' ? '반기' : lang === 'ja' ? '半年' : lang === 'zh' ? '半年' : '6M')
                : (lang === 'ko' ? '1년' : lang === 'ja' ? '1年' : lang === 'zh' ? '1年' : '1Y')}
              </button>
            ))}
          </div>}
          <TodoList
            user={user} t={t} lang={lang}
            activeTodos={allIncompleteTodos}
            completedTodos={allCompletedTodos}
            viewMode={mode}
            showAllIncomplete={true}
            todayStr={todayStr}
            openEditModal={openEditModal}
            toggleComplete={toggleComplete}
            toggleSubtaskComplete={toggleSubtaskComplete}
            deleteTodo={deleteTodo}
          />
        </>
      )}
      {mode === 'lists' && (
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
    </>
  )

  // 헤더 공통 props (현재/인접 패널 둘 다 사용)
  const headerProps = {
    lang, t,
    formattedHeaderDate, handleGoToToday,
    user,
    setViewMode,
    todayStr, setSelectedDate,
    allUsedTags, selectedTag, setSelectedTag,
    tagExpanded, setTagExpanded,
    selectedDate,
    calendarExpanded, setCalendarExpanded,
    prevWeek, nextWeek,
    viewMonth, viewMonthLabel,
    currentWeekDates, monthGridDates, weekdayNames,
    prevMonth, nextMonth, goToMonth,
    setShowSettings,
    searchQuery,
    setSearchQuery: (q) => { setSearchQuery(q); if (q.trim()) trackEngagement('searchUsed') },
    isSearchOpen,
    setIsSearchOpen: (open) => {
      setIsSearchOpen(open)
      if (open) setViewMode('date')
      else setSearchQuery('')
    },
    activeTodosCount: headerActiveTodosCount,
    completedTodosCount: headerCompletedTodosCount,
    weeklyPulse,
    allIncompleteTodosCount: allIncompleteTodos.length,
    notificationCount: notifications.length,
    onNotificationTap: () => setShowNotificationsModal(true),
    weatherData: weatherEnabled ? weatherData : null,
    weatherLoading,
    isCollapsed: headerCollapsed,
    allViewPeriod,
    setAllViewPeriodPersisted,
    allTodosTotal: todos.length,
    allTodosCompleted: todos.filter(t => t.completed).length,
  }

  return (
    <div className="card">
      {showNotificationsModal && (
        <NotificationsModal
          onClose={() => { setShowNotificationsModal(false); clearNotifications() }}
          notifications={notifications}
          onShowAllAchievements={() => { setShowNotificationsModal(false); clearNotifications(); setShowAchievementsModal(true) }}
          lang={lang}
        />
      )}

      {tokenExpired && (
        <div className="token-expired-banner" onClick={() => { setTokenExpired(false); handleLoginWithFeedback() }}>
          {t.calendarExpired}
        </div>
      )}

      {/* 스와이프 클리핑 wrapper: card padding-top 이후 영역에서 overflow hidden 적용 */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {/* 현재 탭 전체 패널 (헤더 + 콘텐츠): 스와이프 시 통째로 이동 */}
        <div
          ref={currentPanelRef}
          style={{ display: 'flex', flexDirection: 'column', height: '100%', willChange: 'transform' }}
          onTouchStart={handleSwipeStart}
          onTouchMove={handleSwipeMove}
          onTouchEnd={handleSwipeEnd}
        >
          <Header {...headerProps} viewMode={viewMode} />
          <div
            className="todo-list-section"
            ref={todoListRef}
            onScroll={(e) => setHeaderCollapsed(e.currentTarget.scrollTop > 44)}
          >
            {searchQuery.trim() && viewMode === 'lists'
              ? (
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
              )
              : renderTabContent(viewMode)
            }
          </div>
        </div>

        {/* 스와이프 중 옆에 붙어오는 인접 탭 패널 (헤더 포함 풀스크린) */}
        {/* inset: 0 은 이 wrapper 기준 — card padding-top 이후 동일 영역 */}
        {swipingToTab && (
          <div
            ref={adjacentPanelRef}
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none', willChange: 'transform',
                     display: 'flex', flexDirection: 'column' }}
          >
            <Header {...headerProps} viewMode={swipingToTab} />
            <div className="todo-list-section">
              {renderTabContent(swipingToTab)}
            </div>
          </div>
        )}

      </div>


      {/* FAB: date/all/lists 뷰에서만 표시 */}
      {(viewMode === 'date' || viewMode === 'all' || viewMode === 'lists') && (
        <button
          className="fab"
          onClick={() => {
            const mode = user ? inputMode : 'manual'
            if (mode === 'smart') {
              setShowSmartModal(true)
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
        viewMode={viewMode} setViewMode={switchTab}
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
        />
      )}

      {showInputModal && (
        <InputModal
          t={t} lang={lang}
          newTodo={newTodo} setNewTodo={setNewTodo}
          showDescInput={showDescInput} setShowDescInput={setShowDescInput}
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
          defaultView={defaultView} setDefaultView={setDefaultViewPersisted}
          setSelectedDate={setSelectedDate}
          inputMode={inputMode} setInputMode={setInputModePersisted}
          onAiLimitToast={(msg) => showToastMsg(msg)}
          completionCalendarMode={completionCalendarMode} setCompletionCalendarMode={setCompletionCalendarModePersisted}
          defaultReminderOffset={defaultReminderOffset} setDefaultReminderOffset={setDefaultReminderOffsetPersisted}
          allDayReminderTime={allDayReminderTime} setAllDayReminderTime={setAllDayReminderTimePersisted}
          user={user} handleLogin={handleLoginWithFeedback} handleLogout={handleLogout}
          lockScreenEnabled={lockScreenEnabled} setLockScreenEnabled={setLockScreenEnabledPersisted}
          lockScreenTodoMode={lockScreenTodoMode} setLockScreenTodoMode={setLockScreenTodoModePersisted}
          lockScreenShowCompleted={lockScreenShowCompleted} setLockScreenShowCompleted={setLockScreenShowCompletedPersisted}
          lockScreenFontScale={lockScreenFontScale} setLockScreenFontScale={setLockScreenFontScalePersisted}
          lockScreenButtons={lockScreenButtons} setLockScreenButtons={setLockScreenButtonsPersisted}
          overlayPermGranted={overlayPermGranted}
          onGrantOverlayPerm={() => LockScreenNative?.openDrawOverlaysSettings().catch(() => {})}
          calendarSyncEnabled={calendarSyncEnabled} setCalendarSyncEnabled={setCalendarSyncEnabledPersisted}
          calendarSyncNoTime={calendarSyncNoTime} setCalendarSyncNoTime={setCalendarSyncNoTimePersisted}
          weatherEnabled={weatherEnabled} setWeatherEnabled={setWeatherEnabledPersisted}
          weatherLocation={weatherLocation} setWeatherLocation={setWeatherLocationPersisted}
          briefingEnabled={briefingEnabled} setBriefingEnabled={setBriefingEnabledPersisted}
          morningBriefingTime={morningBriefingTime} setMorningBriefingTime={setMorningBriefingTimePersisted}
          eveningBriefingTime={eveningBriefingTime} setEveningBriefingTime={setEveningBriefingTimePersisted}
          onPreviewLockScreen={() => { setShowSettings(false); setShowLockPreview(true) }}
          statusBarNotifEnabled={statusBarNotifEnabled} setStatusBarNotifEnabled={setStatusBarNotifEnabledPersisted}
          statusBarContentStyle={statusBarContentStyle} setStatusBarContentStyle={setStatusBarContentStylePersisted}
          setShowSettings={setShowSettings}
          appVersion={APP_VERSION}
          screen={settingsScreen} setScreen={setSettingsScreen}
        />
      )}

      {showBriefingModal && (
        <BriefingModal
          type={briefingType}
          briefingText={briefingText}
          briefingLoading={briefingLoading}
          onClose={() => setShowBriefingModal(false)}
          onGenerate={() => generateBriefing(todos, briefingType, lang)}
          lang={lang}
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
          handleLogin={handleLoginWithFeedback}
          onDone={() => setShowOnboarding(false)}
        />
      )}


    </div>
  )
}

export default App
