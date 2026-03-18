import { useState, useEffect, useMemo, useRef } from 'react'
import { getLocalTodos, saveLocalTodosBatch, saveLocalTodo, deleteLocalTodo, addSyncQueue, getSyncQueue, clearSyncQueue } from './db'
import { GoogleGenAI } from '@google/genai'
import { initializeApp } from "firebase/app"
import { Capacitor } from '@capacitor/core'
import { App as CapApp } from '@capacitor/app'
import { StatusBar, Style } from '@capacitor/status-bar'
import { FirebaseAuthentication } from '@capacitor-firebase/authentication'
import { Network } from '@capacitor/network'
import { 
  getAuth, 
  signInWithPopup, 
  signInWithCredential,
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut 
} from "firebase/auth"
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  doc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  setDoc
} from "firebase/firestore"
import { syncEventToGoogle, deleteEventFromGoogle, fetchEventsFromGoogle } from './calendar'
import './index.css'

// --- Translation Data ---
const translations = {
  ko: {
    reminders: 'BlendDo',
    incomplete: '개의 미완료 항목',
    doneAll: '일정을 모두 마쳤습니다!',
    completed: '완료됨',
    noTime: '시간 지정 없음',
    placeholder: '무엇을 도와드릴까요?',
    date: '날짜',
    time: '시간',
    tags: '태그 (#으로 여러 개 입력)',
    cancel: '취소',
    save: '저장',
    delete: '삭제',
    aiThinking: 'AI가 분석 중...',
    viewDaily: '날짜별',
    viewAll: '전체',
    allTags: '모든 태그',
    today: '오늘',
    langName: '한국어',
    login: '로그인',
    logout: '로그아웃',
    loading: '연결 중...'
  },
  en: {
    reminders: 'BlendDo',
    incomplete: ' incomplete',
    doneAll: 'Everything done!',
    completed: 'Completed',
    noTime: 'No time',
    placeholder: 'What do you want to remind?',
    date: 'Date',
    time: 'Time',
    tags: 'Tags (use # for multiple)',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    aiThinking: 'AI refining...',
    viewDaily: 'Daily',
    viewAll: 'All',
    allTags: 'All Tags',
    today: 'Today',
    langName: 'English',
    login: 'Login',
    logout: 'Logout',
    loading: 'Connecting...'
  },
  ja: {
    reminders: 'BlendDo',
    incomplete: ' 개의 미완료',
    doneAll: '予定はすべて完了しました!',
    completed: '完了済み',
    noTime: '時間指定なし',
    placeholder: '何を思い出させますか？',
    date: '日付',
    time: '時間',
    tags: 'タグ（#を使用して複数）',
    cancel: 'キャンセル',
    save: '保存',
    delete: '削除',
    aiThinking: 'AIが整理しています...',
    viewDaily: '日別',
    viewAll: 'すべて',
    allTags: 'すべてのタグ',
    today: '今日',
    langName: '日本語',
    login: 'ログイン',
    logout: 'ログアウト',
    loading: '接続中...'
  },
  zh: {
    reminders: 'BlendDo',
    incomplete: ' 个待办事项',
    doneAll: '完成！',
    completed: '已完成',
    noTime: '未设置时间',
    placeholder: '您想提醒什么？',
    date: '日期',
    time: '时间',
    tags: '标签（使用 #）',
    cancel: '取消',
    save: '保存',
    delete: '删除',
    aiThinking: 'AI正在整理...',
    viewDaily: '按日',
    viewAll: '全部',
    allTags: '所有标签',
    today: '今天',
    langName: '中文',
    login: '登录',
    logout: '登出',
    loading: '同步中...'
  }
}

// --- Firebase Setup ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

const fbApp = initializeApp(firebaseConfig)
const auth = getAuth(fbApp)
const db = getFirestore(fbApp)
const googleProvider = new GoogleAuthProvider()
googleProvider.addScope('https://www.googleapis.com/auth/calendar.events')
googleProvider.addScope('https://www.googleapis.com/auth/calendar')

// --- Gemini AI Setup ---
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const genAI = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null

// 시간 표시 포맷: HH:MM 만 보여주기
const formatTime = (timeStr, noTimeLabel) => {
  if (!timeStr || timeStr === noTimeLabel) return ''
  // 이미 HH:MM 형식이면 그대로 반환
  if (/^\d{2}:\d{2}$/.test(timeStr)) return timeStr
  // HH:MM:SS 등이면 앞 5글자만
  if (/^\d{2}:\d{2}/.test(timeStr)) return timeStr.slice(0, 5)
  return timeStr
}

function App() {
  const [lang, setLang] = useState('ko')
  const t = useMemo(() => translations[lang] || translations.ko, [lang])

  useEffect(() => {
    const sysLang = navigator.language.split('-')[0]
    if (['en', 'ja', 'zh'].includes(sysLang)) setLang(sysLang)
    else setLang('ko')
  }, [])



  // --- Auth & Data States ---
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [todos, setTodos] = useState([])
  const [viewMode, setViewMode] = useState('date') // 다시 date로 기본값 설정
  const [selectedTag, setSelectedTag] = useState(null)
  
  // Local Timezone 기준 YYYY-MM-DD 구하기
  const getLocalDateString = (d) => {
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0]
  }
  const todayStr = getLocalDateString(new Date())
  
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [baseDate, setBaseDate] = useState(new Date()) 
  
  const weekScrollRef = useRef(null)
  const hasScrolledInit = useRef(false)
  const [showInputModal, setShowInputModal] = useState(false)
  const [showCompleted, setShowCompleted] = useState(false)
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false)
  const [newTodo, setNewTodo] = useState({ text: '', description: '', date: todayStr, time: '', tagInput: '' })
  const [showDescInput, setShowDescInput] = useState(false)
  const [editingTodoId, setEditingTodoId] = useState(null)
  const [tagExpanded, setTagExpanded] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [fontScale, setFontScale] = useState(() => {
    return localStorage.getItem('blenddo-font-scale') || 'medium'
  })
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('blenddo-theme') || 'dark'
  })
  const [randomColors, setRandomColors] = useState(() => {
    const saved = localStorage.getItem('blenddo-random-colors')
    return saved ? JSON.parse(saved) : null
  })

  // --- Network & Offline Sync State ---
  const [isOnline, setIsOnline] = useState(true)

  // 뒤로가기 처리를 위한 Ref
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
          // 모달이 없으면 앱 종료 (기본 동작)
          CapApp.exitApp()
        }
      })
      return () => { backListener.then(l => l.remove()) }
    }
  }, [])

  const processSyncQueue = async () => {
    if (!user) return
    try {
      const queue = await getSyncQueue()
      for (const item of queue) {
        if (item.action === 'set') {
          const finalPayload = { ...item.payload }
          // Firestore timestamp 복구
          if (!finalPayload.createdAt || typeof finalPayload.createdAt === 'number') {
            finalPayload.createdAt = serverTimestamp()
          }
          await setDoc(doc(db, "todos", item.todoId), finalPayload, { merge: true })
        } else if (item.action === 'delete') {
          await deleteDoc(doc(db, "todos", item.todoId))
        }
        await clearSyncQueue(item.id)
      }
    } catch(e) { console.error('Sync process error:', e) }
  }

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

  // 랜덤 테마 생성
  const generateRandomTheme = () => {
    const hue = Math.floor(Math.random() * 360)
    const isDark = Math.random() > 0.5
    const colors = isDark ? {
      primary: `hsl(${hue}, 70%, 65%)`,
      bgColor: `hsl(${hue}, 15%, 10%)`,
      cardBg: `hsl(${hue}, 15%, 14%)`,
      textMain: `hsl(${hue}, 10%, 90%)`,
      textTime: `hsl(${hue}, 10%, 60%)`,
      borderColor: `hsl(${hue}, 15%, 22%)`,
      checkboxBorder: `hsl(${hue}, 10%, 40%)`,
      tagBg: `hsl(${hue}, 15%, 18%)`,
      modalBg: `hsl(${hue}, 15%, 14%)`,
    } : {
      primary: `hsl(${hue}, 70%, 50%)`,
      bgColor: `hsl(${hue}, 30%, 97%)`,
      cardBg: `hsl(${hue}, 30%, 97%)`,
      textMain: `hsl(${hue}, 20%, 15%)`,
      textTime: `hsl(${hue}, 10%, 45%)`,
      borderColor: `hsl(${hue}, 20%, 90%)`,
      checkboxBorder: `hsl(${hue}, 10%, 70%)`,
      tagBg: `hsl(${hue}, 25%, 93%)`,
      modalBg: `hsl(${hue}, 30%, 97%)`,
    }
    setRandomColors(colors)
    localStorage.setItem('blenddo-random-colors', JSON.stringify(colors))
    setTheme('random')
  }

  // 테마 적용
  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('theme-light', 'theme-dark', 'theme-system')
    // 랜덤 CSS 변수 제거
    const props = ['--primary', '--bg-color', '--card-bg', '--text-main', '--text-time', '--border-color', '--checkbox-border', '--tag-bg', '--modal-bg']
    props.forEach(p => root.style.removeProperty(p))

    if (theme === 'random' && randomColors) {
      root.style.setProperty('--primary', randomColors.primary)
      root.style.setProperty('--bg-color', randomColors.bgColor)
      root.style.setProperty('--card-bg', randomColors.cardBg)
      root.style.setProperty('--text-main', randomColors.textMain)
      root.style.setProperty('--text-time', randomColors.textTime)
      root.style.setProperty('--border-color', randomColors.borderColor)
      root.style.setProperty('--checkbox-border', randomColors.checkboxBorder)
      root.style.setProperty('--tag-bg', randomColors.tagBg)
      root.style.setProperty('--modal-bg', randomColors.modalBg)
    } else {
      root.classList.add(`theme-${theme}`)
    }
    localStorage.setItem('blenddo-theme', theme)

    // 상태 표시줄(Status Bar) 동기화 (색상 및 스타일)
    if (Capacitor.isNativePlatform()) {
      setTimeout(async () => {
        try {
          const bodyBg = getComputedStyle(document.body).backgroundColor
          const hexMatch = bodyBg.match(/\d+/g)
          let hexColor = '#FFFFFF'
          if (hexMatch && hexMatch.length >= 3) {
            hexColor = '#' + hexMatch.slice(0, 3).map(x => parseInt(x).toString(16).padStart(2, '0')).join('').toUpperCase()
          }
          await StatusBar.setBackgroundColor({ color: hexColor })
          
          // 밝기 계산 (YIQ 수식)
          const [r, g, b] = hexMatch ? hexMatch.slice(0,3).map(Number) : [255, 255, 255]
          const brightness = (r * 299 + g * 587 + b * 114) / 1000
          
          // 밝으면 어두운 아이콘(Light 모드용), 어두우면 밝은 아이콘(Dark 모드용) 적용
          await StatusBar.setStyle({ style: brightness > 128 ? Style.Light : Style.Dark })
        } catch (e) {
          console.error("StatusBar error:", e)
        }
      }, 50)
    }
  }, [theme, randomColors])

  // 글자 크기 CSS 변수 적용
  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('font-small', 'font-medium', 'font-large')
    root.classList.add(`font-${fontScale}`)
    localStorage.setItem('blenddo-font-scale', fontScale)
  }, [fontScale])

  // 스와이프 네비게이션 ref
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  // IndexedDB (Offline First) & Firestore Sync
  useEffect(() => {
    let unsubscribe = null

    const loadLocalAndSync = async () => {
      // 1. 인터넷 확인 전, 무조건 로컬 DB에 있는 데이터를 우선 즉시 그려줌 (초고속 화면 표시)
      if (user) {
        const localData = await getLocalTodos()
        if (localData && localData.length > 0) {
          const sortedList = localData.sort((a, b) => {
            const dtA = new Date(`${a.date} ${a.time && a.time.includes(':') ? a.time : '00:00'}`)
            const dtB = new Date(`${b.date} ${b.time && b.time.includes(':') ? b.time : '00:00'}`)
            return dtA - dtB
          })
          setTodos(sortedList)
          setLoading(false)
        }
        
        // 2. 백그라운드에서 Firestore와 실시간 연동 시작
        const q = query(collection(db, "todos"), where("uid", "==", user.uid))
        unsubscribe = onSnapshot(q, async (snapshot) => {
          let list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
          
          // Google Calendar에서 역동기화 적용 (선택사항 등급)
          try {
            const events = await fetchEventsFromGoogle()
            if (events && events.length > 0) {
              for (const ev of events) {
                const matchIndex = list.findIndex(t => t.googleEventId === ev.id)
                if (matchIndex >= 0) {
                  const match = list[matchIndex]
                  const evUpdated = new Date(ev.updated).getTime()
                  const localUpdated = match.updatedAt?.toMillis ? match.updatedAt.toMillis() : (match.createdAt?.toMillis ? match.createdAt.toMillis() : 0)
                  
                  // Google 캘린더 수정본이 훨씬 최신이면(1분 이상 차이) 업데이트 반영
                  if (evUpdated > localUpdated + 60000) {
                    const dt = ev.start?.date || ev.start?.dateTime?.split('T')[0]
                    const time = ev.start?.dateTime ? ev.start.dateTime.substring(11, 16) : ''
                    const updatedTodo = {
                      text: (ev.summary || '').replace(/^B\]\s*/, '') || '제목 없음',
                      description: ev.description || '',
                      date: dt || match.date,
                      time: time,
                      updatedAt: serverTimestamp()
                    }
                    await updateDoc(doc(db, "todos", match.id), updatedTodo)
                    list[matchIndex] = { ...match, ...updatedTodo }
                  }
                }
              }
            }
          } catch (calErr) { console.error('Calendar sync error during load:', calErr) }

          const sortedList = list.sort((a, b) => {
            const dtA = new Date(`${a.date} ${a.time && a.time.includes(':') ? a.time : '00:00'}`)
            const dtB = new Date(`${b.date} ${b.time && b.time.includes(':') ? b.time : '00:00'}`)
            return dtA - dtB
          })
          
          // 새로 받은 데이터로 UI 렌더링 + 로컬 DB도 최신화 동기화
          setTodos(sortedList)
          setLoading(false)
          
          try {
            await saveLocalTodosBatch(list)
          } catch (e) { console.error("Local DB Sync error:", e) }
        }, (error) => {
          console.error("Firestore sync error:", error)
          setLoading(false) // 오프라인이어도 무한 로딩 풀림
        })
      } else {
        setTodos([])
      }
    }
    
    loadLocalAndSync()
    return () => { if (unsubscribe) unsubscribe() }
  }, [user])

  // --- AI Logic ---
  const getAiTagsOnly = async (text) => {
    if (!genAI) return null
    try {
      setIsAiAnalyzing(true)
      const prompt = `Analyze: "${text}". Extract ONLY 1-2 category tags in ${t.langName} (e.g., 업무, 개인, 건강, 학습). Return ONLY JSON: {"categories": ["tag1", "tag2"]}`
      const response = await genAI.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt })
      const rawText = response.text.replace(/```json|```/g, '').trim()
      return JSON.parse(rawText.match(/\{.*\}/s)?.[0] || rawText)
    } catch (error) { console.error('AI Tags Error:', error); return null } finally { setIsAiAnalyzing(false) }
  }

  const getAiFullAnalysis = async (text) => {
    if (!genAI) {
      return null
    }
    try {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
      const todayInfo = `${year}-${month}-${day} (${dayNames[now.getDay()]})`
      
      const prompt = `오늘: ${todayInfo}\n입력: "${text}"\n\n반드시 아래 JSON만 응답하세요:\n{"categories":["태그1"],"date":"YYYY-MM-DD","time":"HH:MM 또는 null","refinedText":"핵심 내용"}\n\n규칙:\n- categories: 할일 성격 태그 1~2개 (업무,개인,건강,학습 등)\n- date: 날짜(YYYY-MM-DD). 상대적 표현은 오늘 기준 계산\n- time: 시간 있으면 HH:MM, 없으면 null\n- refinedText: 날짜/시간 제외한 핵심 내용`
      
      const response = await genAI.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt })
      const rawText = response.text.replace(/```json|```/g, '').trim()
      const analysis = JSON.parse(rawText.match(/\{.*\}/s)?.[0] || rawText)
      
      if (analysis) {
        if (!analysis.date || !/^\d{4}-\d{2}-\d{2}$/.test(analysis.date)) {
          analysis.date = null
        }
      }
      return analysis
    } catch (error) { 
      console.error("AI Analysis Error:", error)
      return null 
    }
  }

  // Hybrid AI tag suggestion (debounced)
  const debounceTimer = useRef(null)
  useEffect(() => {
    if (showInputModal && newTodo.text.length > 3) {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
      debounceTimer.current = setTimeout(async () => {
        const analysis = await getAiTagsOnly(newTodo.text)
        if (analysis && analysis.categories) {
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

  // --- Handlers ---
  const handleLogin = async () => {
    console.log("Login button clicked, native:", Capacitor.isNativePlatform())
    try {
      const result = await FirebaseAuthentication.signInWithGoogle({
        scopes: ['https://www.googleapis.com/auth/calendar.events', 'https://www.googleapis.com/auth/calendar'],
        skipNativeAuth: true
      })
      
      if (result.credential) {
        // Access Token 저장
        if (result.credential.accessToken) {
          localStorage.setItem('googleAccessToken', result.credential.accessToken)
          console.log("Google Access Token saved successfully")
        }
        
        // Firebase Auth 인증 완료
        const credential = GoogleAuthProvider.credential(result.credential.idToken)
        await signInWithCredential(auth, credential)
      }
    } catch (e) {
      console.error("Login Error:", e)
      alert("Login failed: " + (e.message || JSON.stringify(e)))
    }
  }

  const handleLogout = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        await FirebaseAuthentication.signOut()
      }
      await signOut(auth)
    } catch (e) {
      console.error("Logout error:", e)
    }
  }

  const handleSaveTodo = async () => {
    if (!user || newTodo.text.trim() === '') return
    
    const inputTags = newTodo.tagInput.split(/[,#\s]+/).map(tag => tag.trim().replace('#', '')).filter(Boolean)
    const savedText = newTodo.text
    const savedDesc = newTodo.description
    const savedDate = newTodo.date
    const savedTime = newTodo.time || ''
    const isEdit = !!editingTodoId
    const editId = editingTodoId

    // Close modal immediately (optimistic UI)
    resetForm()

    try {
      if (!isEdit) {
        // ===== 신규 생성 =====
        const newDocRef = doc(collection(db, "todos"))
        const newId = newDocRef.id
        
        const initialData = {
          uid: user.uid,
          text: savedText,
          description: savedDesc,
          date: savedDate,
          time: savedTime,
          tags: inputTags,
          completed: false,
        }
        
        // Optimistic UI (오프라인 화면 즉시 반영 및 로컬 저장)
        const localPayload = { ...initialData, id: newId, createdAt: Date.now() }
        setTodos(prev => [...prev, localPayload])
        await saveLocalTodo(localPayload)

        if (isOnline) {
          await setDoc(newDocRef, { ...initialData, createdAt: serverTimestamp() })
          
          // 동기화 요청 (오차 방지를 위해 약간의 지연 후 실행하되 확실히 실행)
          setTimeout(async () => {
             try {
               const gId = await syncEventToGoogle({ ...localPayload })
               console.log("Sync Result (New):", gId)
               if (gId) {
                 await setDoc(newDocRef, { googleEventId: gId, updatedAt: serverTimestamp() }, { merge: true })
                 // 로컬 상태에도 gId 반영 (추후 수정 시 필요)
                 setTodos(prev => prev.map(t => t.id === newId ? { ...t, googleEventId: gId } : t))
               }
             } catch (syncErr) {
               console.error("Google Sync Logic Error:", syncErr)
             }
          }, 300)
        } else {
          await addSyncQueue('set', newId, initialData)
        }
        console.log("Todo created:", newId)

        // AI 비동기 개선 (온라인/오프라인 처리)
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
        } catch (aiErr) {
          console.error("AI refinement failed:", aiErr)
        }
      } else {
        // ===== 수정 =====
        const updateData = {
          text: savedText,
          description: savedDesc,
          date: savedDate,
          time: savedTime,
          tags: inputTags
        }
        
        // 로컬 업데이트
        const oldTodo = todos.find(t => t.id === editId) || {}
        setTodos(prev => prev.map(t => t.id === editId ? { ...t, ...updateData } : t))
        await saveLocalTodo({ ...oldTodo, ...updateData })

        if (isOnline) {
          await setDoc(doc(db, "todos", editId), { ...updateData, updatedAt: serverTimestamp() }, { merge: true })
          
          setTimeout(async () => {
             try {
               const targetToSync = { ...oldTodo, ...updateData }
               const gId = await syncEventToGoogle(targetToSync)
               console.log("Sync Result (Update):", gId)
               if (gId && !targetToSync.googleEventId) {
                 await setDoc(doc(db, "todos", editId), { googleEventId: gId }, { merge: true })
                 setTodos(prev => prev.map(t => t.id === editId ? { ...t, googleEventId: gId } : t))
               }
             } catch (syncErr) {
               console.error("Google Sync Update Error:", syncErr)
             }
          }, 300)
        } else {
          await addSyncQueue('set', editId, updateData)
        }
        console.log("Todo updated:", editId)

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
            setTodos(prev => prev.map(t => t.id === editId ? { ...t, ...merged } : t))
            await saveLocalTodo({ ...oldTodo, ...updateData, ...merged })

            if (isOnline) {
              await setDoc(doc(db, "todos", editId), { ...merged, updatedAt: serverTimestamp() }, { merge: true })
              setTimeout(async () => {
                const targetToSync = { ...oldTodo, ...updateData, ...merged }
                const gId = await syncEventToGoogle(targetToSync)
                if (gId && !targetToSync.googleEventId) {
                  await setDoc(doc(db, "todos", editId), { googleEventId: gId }, { merge: true })
                }
             }, 100)
            } else {
              await addSyncQueue('set', editId, merged)
            }
            console.log("AI refinement applied (edit):", merged)
          }
        } catch (aiErr) {
          console.error("AI refinement failed:", aiErr)
        }
      }
    } catch (e) { 
      console.error("Save Todo Error:", e) 
    }
  }

  const toggleComplete = async (e, id, completed) => {
    e.stopPropagation()
    try {
      setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: !completed } : t))
      const target = todos.find(t => t.id === id)
      if (target) await saveLocalTodo({ ...target, completed: !completed })

      if (isOnline) await setDoc(doc(db, "todos", id), { completed: !completed }, { merge: true })
      else await addSyncQueue('set', id, { completed: !completed })
    } catch (e) { console.error(e) }
  }

  const deleteTodo = async (e, id) => {
    e.stopPropagation()
    try {
      const target = todos.find(t => t.id === id)
      setTodos(prev => prev.filter(t => t.id !== id))
      await deleteLocalTodo(id)

      if (isOnline) {
        await deleteDoc(doc(db, "todos", id))
        if (target && target.googleEventId) {
          setTimeout(() => deleteEventFromGoogle(target.googleEventId), 100)
        }
      } else {
        await addSyncQueue('delete', id)
      }
    } catch (e) { console.error(e) }
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

  const resetForm = () => {
    setNewTodo({ text: '', description: '', date: todayStr, time: '', tagInput: '' })
    setShowDescInput(false)
    setEditingTodoId(null)
    setShowInputModal(false)
    document.body.classList.remove('modal-open')
  }

  const handleGoToToday = () => {
    const today = new Date()
    setSelectedDate(getLocalDateString(today))
    setBaseDate(today)
    setViewMode('date')
    setSelectedTag(null)
  }

  // 초기 로딩 완료 시점에 오늘로 오게 함 (이미 초기값이 오늘이지만, 데이터 정렬을 위해 한 번 더 호출)
  useEffect(() => {
    if (!loading) {
      handleGoToToday()
    }
  }, [loading])

  // --- Filtering & Formatting ---
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

  const dateRange = useMemo(() => {
    if (!baseDate) return []
    const dates = []
    const locale = lang === 'ko' ? 'ko-KR' : lang === 'ja' ? 'ja-JP' : lang === 'zh' ? 'zh-CN' : 'en-US'
    
    // 현재 baseDate가 속한 주의 일요일 구하기
    const startOfWeek = new Date(baseDate)
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
    
    // 5주 렌더 (이전2주 + 현재 + 다음2주)
    const rangeStart = new Date(startOfWeek)
    rangeStart.setDate(rangeStart.getDate() - 14)

    for (let i = 0; i < 35; i++) {
      const d = new Date(rangeStart); d.setDate(rangeStart.getDate() + i)
      dates.push({
        full: getLocalDateString(d),
        dayName: d.toLocaleDateString(locale, { weekday: 'short' }),
        dayNumber: d.getDate(),
        weekIndex: Math.floor(i / 7) // 0~4
      })
    }
    return dates
  }, [baseDate, lang])

  // 주간 스크롤 관리 (다시 중앙 cw * 2 지점으로 정렬)
  useEffect(() => {
    if (weekScrollRef.current && viewMode === 'date' && baseDate) {
      const container = weekScrollRef.current
      let retryTimer;
      let forceTimer;
      let startTime = Date.now();

      const align = () => {
        if (!container) return
        const cw = container.clientWidth
        const sw = container.scrollWidth
        
        // 레이아웃 대기
        if (cw < 50 || sw < cw * 4) {
          if (Date.now() - startTime < 3000) retryTimer = setTimeout(align, 50)
          return
        }

        hasScrolledInit.current = false
        // 이동 중에는 자석 효과 잠시 끄기
        container.style.scrollSnapType = 'none'

        // 1초간 중앙 좌표 주입
        forceTimer = setInterval(() => {
          if (weekScrollRef.current) {
            weekScrollRef.current.scrollLeft = weekScrollRef.current.clientWidth * 2
          }
          if (Date.now() - startTime > 1000) {
            clearInterval(forceTimer)
            if (weekScrollRef.current) {
              weekScrollRef.current.style.scrollSnapType = 'x mandatory'
            }
            hasScrolledInit.current = true
          }
        }, 30)
      }
      align()
      return () => {
        clearTimeout(retryTimer)
        if (forceTimer) clearInterval(forceTimer)
      }
    }
  }, [baseDate, viewMode])

  const handleWeekScroll = () => {
    const container = weekScrollRef.current
    if (!container || !hasScrolledInit.current) return
    const weekWidth = container.clientWidth
    const sw = container.scrollWidth
    
    // 왼쪽 끝 근처 (0.3주분) → 이전 주로 이동
    if (container.scrollLeft < weekWidth * 0.3) {
      hasScrolledInit.current = false
      const d = new Date(baseDate)
      d.setDate(d.getDate() - 7)
      setBaseDate(d)
    }
    // 오른쪽 끝 근처 (3.7주분) → 다음 주로 이동
    if (container.scrollLeft > weekWidth * 3.7) {
      hasScrolledInit.current = false
      const d = new Date(baseDate)
      d.setDate(d.getDate() + 7)
      setBaseDate(d)
    }
  }
  const handleOpenAddModal = () => {
    let defaultDate = ''
    let defaultTime = ''

    if (viewMode === 'date') {
      defaultDate = selectedDate
      // 현재 시간을 최근접한 10분 단위로 설정
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

  if (loading) return <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--primary)', fontWeight:600}}>{t.loading}</div>

  return (
    <div className="card">
      {/* ===== 고정 헤더 영역 ===== */}
      <div className="header-wrapper">
        <header className="header">
          <div className="header-top">
            <div className="month-year-header clickable" onClick={handleGoToToday}>
              {formattedHeaderDate}
            </div>
            <div className="auth-group">
              {!user && (
                <button className="login-btn" onClick={handleLogin}>
                  {lang === 'ko' ? '로그인' : 'Login'}
                </button>
              )}
            </div>
          </div>
          <div className="title-row">
            <h1>BlendDo</h1>
            <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
              <div className="view-selector">
                <button className={viewMode === 'date' ? 'active' : ''} onClick={() => { setViewMode('date'); setSelectedDate(todayStr); setBaseDate(new Date()) }}>
                  {lang === 'ko' ? '날짜별' : 'By Date'}
                </button>
                <button className={viewMode === 'all' ? 'active' : ''} onClick={() => setViewMode('all')}>
                  {lang === 'ko' ? '전체' : 'All'}
                </button>
              </div>
              <button className="settings-btn" onClick={() => setShowSettings(true)}>⚙️</button>
            </div>
          </div>
          
          {viewMode === 'date' && (
            <div className="date-nav-container">
              <div className="date-scroll-wrapper" ref={weekScrollRef} onScroll={handleWeekScroll}>
                {[0, 1, 2, 3, 4].map(weekIdx => (
                  <div key={weekIdx} className="date-week-page" id={weekIdx === 2 ? 'current-week-page' : ''}>
                    {dateRange.filter(d => d.weekIndex === weekIdx).map((date) => (
                      <div key={date.full} className={`date-item ${selectedDate === date.full ? 'active' : ''}`} onClick={() => setSelectedDate(date.full)}>
                        <span className="day-name">{date.dayName}</span>
                        <span className="day-number">{date.dayNumber}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="tag-filter-wrapper">
            <div className={`tag-filter-bar ${tagExpanded ? 'expanded' : ''}`}>
              <button className={!selectedTag ? 'active' : ''} onClick={() => setSelectedTag(null)}>{t.allTags}</button>
              {allUsedTags.map(tag => (
                <button key={tag} className={selectedTag === tag ? 'active' : ''} onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}>#{tag}</button>
              ))}
            </div>
            {allUsedTags.length > 3 && (
              <button className="tag-toggle-btn" onClick={() => setTagExpanded(!tagExpanded)}>
                {tagExpanded ? '▲' : '▼'}
              </button>
            )}
          </div>
        </header>
      </div>

      {/* ===== 스크롤 가능한 할 일 목록 영역 ===== */}
      <div className="todo-list-section">
        {!user ? (
          <div style={{textAlign:'center', padding:'60px 20px', color:'var(--text-time)'}}>
            <p style={{marginBottom:'20px'}}>로그인하여 대기중인 일정을 클라우드에 백업하세요.</p>
            <button style={{background:'var(--primary)', color:'white', padding:'10px 20px', border:'none', borderRadius:'12px', cursor:'pointer', fontWeight:600}} onClick={handleLogin}>Google 계정으로 시작하기</button>
          </div>
        ) : (
          <div className="active-list">
            {activeTodos.map(todo => (
              <div key={todo.id} className="todo-item" onClick={() => openEditModal(todo)}>
                <div className="checkbox" onClick={(e) => toggleComplete(e, todo.id, todo.completed)}></div>
                <div className="todo-body">
                  <div className="todo-main-row">
                    <span className="todo-text">{todo.text}</span>
                    <div className="right-group">
                      {viewMode === 'all' && <span className="todo-date-badge">{todo.date.slice(5)}</span>}
                      {formatTime(todo.time, t.noTime) && (
                        <span className="todo-time">{formatTime(todo.time, t.noTime)}</span>
                      )}
                    </div>
                  </div>
                  {todo.description && (
                    <div className="todo-desc">{todo.description}</div>
                  )}
                  {todo.tags?.length > 0 && (
                    <div className="tags-row">
                      {todo.tags.map(tag => <span key={tag} className="tag-pill">#{tag}</span>)}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {activeTodos.length === 0 && <p style={{textAlign:'center', padding:'40px', color:'var(--text-time)'}}>{t.doneAll}</p>}
          </div>
        )}

        {user && completedTodos.length > 0 && (
          <div style={{marginTop:'20px'}}>
            <div onClick={() => setShowCompleted(!showCompleted)} style={{display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', color: 'var(--text-time)', fontSize:'14px', fontWeight:'600', padding:'10px 0'}}>
              <span style={{fontSize:'10px', transition:'transform 0.2s', transform: showCompleted ? 'rotate(90deg)' : 'rotate(0deg)'}}>▶</span>
              <span>{t.completed} {completedTodos.length}</span>
            </div>
            {showCompleted && (
              <div>
                {completedTodos.map(todo => (
                  <div key={todo.id} className="todo-item" onClick={() => openEditModal(todo)} style={{opacity: 0.6}}>
                    <div className="checkbox checked" onClick={(e) => toggleComplete(e, todo.id, todo.completed)}></div>
                    <div className="todo-body">
                      <div className="todo-main-row">
                        <span className="todo-text completed">{todo.text}</span>
                        <div className="right-group">
                          {formatTime(todo.time, t.noTime) && (
                            <span className="todo-time">{formatTime(todo.time, t.noTime)}</span>
                          )}
                        </div>
                      </div>
                      {todo.description && (
                        <div className="todo-desc">{todo.description}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ===== FAB 추가 버튼 (항상 우하단 고정) ===== */}
      {user && <button className="add-fab" onClick={handleOpenAddModal}>
        <svg viewBox="0 0 24 24"><path d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2z" /></svg>
      </button>}

      {/* ===== 입력/편집 모달 ===== */}
      {showInputModal && (
        <div className="input-overlay" onClick={resetForm}>
          <div className="input-modal" onClick={e => e.stopPropagation()}>
            <div style={{display:'flex', gap:'8px', alignItems: 'center', marginBottom: '8px'}}>
              <input className="main-input" style={{flex:1, marginBottom: 0}} type="text" placeholder={t.placeholder} autoFocus value={newTodo.text} onChange={e => setNewTodo({...newTodo, text: e.target.value})} />
              <button 
                className={`desc-toggle-btn ${showDescInput ? 'active' : ''}`} 
                onClick={() => setShowDescInput(!showDescInput)}
                title={lang === 'ko' ? '상세 내용 입력' : 'Add Details'}
              >
                {showDescInput ? '➖' : '➕'}
              </button>
            </div>
            {showDescInput && (
              <textarea 
                className="desc-input"
                style={{
                  width: '100%', 
                  minHeight: '80px', 
                  borderRadius: '12px', 
                  padding: '12px', 
                  background: 'rgba(255,255,255,0.05)', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'white',
                  fontSize: '14px',
                  marginBottom: '10px',
                  outline: 'none'
                }}
                placeholder={lang === 'ko' ? '일정의 상세 내용이나 메모를 적어보세요' : 'Add details or notes...'}
                value={newTodo.description}
                onChange={e => setNewTodo({...newTodo, description: e.target.value})}
              />
            )}
            {isAiAnalyzing && <div style={{fontSize: '11px', color: 'var(--primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px'}}>
              <span className="pulse-dot"></span> {t.aiThinking}
            </div>}
            <div className="input-options">
              <div className="input-option-item"><span>📅</span><input type="date" value={newTodo.date} onChange={e => setNewTodo({...newTodo, date: e.target.value})} /></div>
              <div className="input-option-item"><span>⏰</span><input type="time" value={newTodo.time} onChange={e => setNewTodo({...newTodo, time: e.target.value})} /></div>
              <div className="input-option-item" style={{flex: 1}}><span>🏷️</span><input type="text" placeholder={t.tags} value={newTodo.tagInput} onChange={e => setNewTodo({...newTodo, tagInput: e.target.value})} /></div>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={resetForm}>{t.cancel}</button>
              <button className="btn-save" onClick={handleSaveTodo}>{editingTodoId ? (lang === 'ko' ? '수정' : 'Update') : t.save}</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== 설정 모달 ===== */}
      {showSettings && (
        <div className="input-overlay" onClick={() => setShowSettings(false)}>
          <div className="settings-modal" onClick={e => e.stopPropagation()}>
            <div className="settings-header">
              <h2>{lang === 'ko' ? '설정' : 'Settings'}</h2>
              <button className="settings-close" onClick={() => setShowSettings(false)}>✕</button>
            </div>

            <div className="settings-section">
              <h3>{lang === 'ko' ? '글자 크기' : 'Font Size'}</h3>
              <div className="font-size-selector">
                <button className={fontScale === 'small' ? 'active' : ''} onClick={() => setFontScale('small')}>
                  <span style={{fontSize:'13px'}}>A</span>
                  <span>{lang === 'ko' ? '작게' : 'Small'}</span>
                </button>
                <button className={fontScale === 'medium' ? 'active' : ''} onClick={() => setFontScale('medium')}>
                  <span style={{fontSize:'16px'}}>A</span>
                  <span>{lang === 'ko' ? '중간' : 'Medium'}</span>
                </button>
                <button className={fontScale === 'large' ? 'active' : ''} onClick={() => setFontScale('large')}>
                  <span style={{fontSize:'20px'}}>A</span>
                  <span>{lang === 'ko' ? '크게' : 'Large'}</span>
                </button>
              </div>
            </div>

            <div className="settings-section">
              <h3>{lang === 'ko' ? '테마' : 'Theme'}</h3>
              <div className="font-size-selector" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
                <button className={theme === 'light' ? 'active' : ''} onClick={() => setTheme('light')}>
                  <span style={{fontSize:'18px'}}>☀️</span>
                  <span>{lang === 'ko' ? '기본 (라이트)' : 'Light'}</span>
                </button>
                <button className={theme === 'dark' ? 'active' : ''} onClick={() => setTheme('dark')}>
                  <span style={{fontSize:'18px'}}>🌙</span>
                  <span>{lang === 'ko' ? '다크 모드' : 'Dark'}</span>
                </button>
                <button className={theme === 'system' ? 'active' : ''} onClick={() => setTheme('system')}>
                  <span style={{fontSize:'18px'}}>📱</span>
                  <span>{lang === 'ko' ? '시스템' : 'System'}</span>
                </button>
                <button className={theme === 'random' ? 'active' : ''} onClick={generateRandomTheme}>
                  <span style={{fontSize:'18px'}}>🎲</span>
                  <span>{lang === 'ko' ? '랜덤' : 'Random'}</span>
                </button>
              </div>
            </div>

            <div className="settings-section">
              <h3>{lang === 'ko' ? '기본 보기' : 'Default View'}</h3>
              <div className="font-size-selector">
                <button className={viewMode === 'date' ? 'active' : ''} onClick={() => { setViewMode('date'); setSelectedDate(getLocalDateString(new Date())); setBaseDate(new Date()) }}>
                  <span>📅</span>
                  <span>{lang === 'ko' ? '날짜별' : 'By Date'}</span>
                </button>
                <button className={viewMode === 'all' ? 'active' : ''} onClick={() => setViewMode('all')}>
                  <span>📋</span>
                  <span>{lang === 'ko' ? '전체' : 'All'}</span>
                </button>
              </div>
            </div>

            {user && (
              <div className="settings-section">
                <h3>{lang === 'ko' ? '구글 캘린더 동기화' : 'Google Calendar Sync'}</h3>
                <p style={{fontSize: '12px', color: 'var(--text-time)', marginBottom: '10px', lineHeight: '1.4'}}>
                  {lang === 'ko' 
                    ? '일정을 구글 캘린더와 양방향 동기화하려면 추가 권한 승인이 필요합니다. 기존 계정 그대로 버튼을 누르시면 됩니다.' 
                    : 'Required to sync events bidirectionally with Google Calendar.'}
                </p>
                <button className="login-btn" style={{width:'100%', textAlign:'center', background: 'transparent', border: '2px solid var(--primary)', color: 'var(--primary)', fontWeight: 'bold'}} onClick={() => { setShowSettings(false); handleLogin(); }}>
                  {lang === 'ko' ? '캘린더 권한 업데이트 🔄' : 'Grant Calendar Permissions 🔄'}
                </button>
              </div>
            )}

            <div className="settings-section" style={{borderBottom:'none'}}>
              {user ? (
                <button className="logout-footer-btn" style={{width:'100%', textAlign:'center', marginTop:'10px'}} onClick={() => { setShowSettings(false); handleLogout() }}>
                  {lang === 'ko' ? '로그아웃 / 계정 전환' : 'Logout / Change Account'}
                </button>
              ) : (
                <button className="login-btn" style={{width:'100%', textAlign:'center', marginTop:'10px'}} onClick={() => { setShowSettings(false); handleLogin() }}>
                  {lang === 'ko' ? 'Google 계정으로 로그인' : 'Login with Google'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
