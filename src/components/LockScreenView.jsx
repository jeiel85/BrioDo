import { useState, useEffect, useRef } from 'react'

function pad(n) { return String(n).padStart(2, '0') }

const lockFontScaleMap = { 1: 0.70, 2: 0.82, 3: 0.91, 4: 1.00, 5: 1.10, 6: 1.20, 7: 1.35 }

// ─── SVG 아이콘 ───────────────────────────────────────────────
const IconFlash = ({ on }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
    <path d={on
      ? "M7 2v11h3v9l7-12h-4l4-8z"
      : "M7 2v11h3v9l7-12h-4l4-8z M3.27 1L2 2.27l5.73 5.73H7v11h3v9l7-12h-4l2.45-4.45L19.73 23 21 21.73 3.27 1z"}
    />
  </svg>
)

const IconCamera = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
    <path d="M12 15.2A3.2 3.2 0 0 1 8.8 12 3.2 3.2 0 0 1 12 8.8 3.2 3.2 0 0 1 15.2 12 3.2 3.2 0 0 1 12 15.2M9 3L7.17 5H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3.17L15 3H9m3 15a6 6 0 0 1-6-6 6 6 0 0 1 6-6 6 6 0 0 1 6 6 6 6 0 0 1-6 6z"/>
  </svg>
)

const IconQR = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
    <path d="M3 11h2v2H3v-2m8-6h2v4h-2V5m-2 6h4v4h-2v-2H9v-2m6 0h2v2h2v-2h2v2h-2v2h2v4h-2v2h-2v-2h-4v2h-2v-4h4v-2h2v-2h-2v-2m4 8v-4h-2v4h2M15 3h6v6h-6V3m2 2v2h2V5h-2M3 3h6v6H3V3m2 2v2h2V5H5m-2 8h6v6H3v-6m2 2v2h2v-2H5z"/>
  </svg>
)

const IconTimer = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
    <path d="M10 2h4v2h-4V2m4.84 11.41L13 11.67V8h-2v4.5l2.27 2.27 1.57-1.36M12 4a9 9 0 0 1 9 9 9 9 0 0 1-9 9 9 9 0 0 1-9-9 9 9 0 0 1 9-9m0 2a7 7 0 0 0-7 7 7 7 0 0 0 7 7 7 7 0 0 0 7-7 7 7 0 0 0-7-7z"/>
  </svg>
)

const IconCalculator = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3h2v2h-2V6zm-4 0h2v2H8V6zm0 4h2v2H8v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2zm-8 4h2v6H8v-6zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2zm-4 4h2v2h-2v-2zm4 0h2v2h-2v-2z"/>
  </svg>
)

const IconPlayPause = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
    <path d="M8 5v14l11-7L8 5z"/>
  </svg>
)

const IconAlarm = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
    <path d="M22 5.72l-4.6-3.86-1.29 1.53 4.6 3.86L22 5.72zM7.88 3.39L6.6 1.86 2 5.71l1.29 1.53 4.59-3.85zM12 4c-4.97 0-9 4.03-9 9s4.02 9 9 9a9 9 0 0 0 0-18zm0 16c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7zm.5-13H11v6l4.75 2.85.75-1.23-4-2.37V7z"/>
  </svg>
)

const IconStopwatch = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
    <path d="M15.07 1.01h-6v2h6v-2zm-4 13h2V8h-2v6zm8.03-6.61l1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42C17.07 4.74 15.61 4 14 4c-3.87 0-7 3.13-7 7s3.12 7 7 7 7-3.13 7-7c0-1.61-.74-3.07-1.9-4.6zM14 16c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
  </svg>
)

const IconPlus = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
  </svg>
)

// ─── 버튼 정의 (id → 아이콘 컴포넌트) ─────────────────────────
// 각 컴포넌트는 on prop을 받지만 대부분 무시 (torch만 사용)
const BUTTON_ICONS = {
  torch:     ({ on }) => <IconFlash on={on} />,
  camera:    () => <IconCamera />,
  qr:        () => <IconQR />,
  timer:     () => <IconTimer />,
  calculator:() => <IconCalculator />,
  playPause: () => <IconPlayPause />,
  alarm:     () => <IconAlarm />,
  stopwatch: () => <IconStopwatch />,
}

export function LockScreenView({
  todos, lang, onOpen, todayStr, isPreview,
  onAddTodo,
  buttons = ['torch', 'camera', 'qr', 'timer'],
  todoMode = 'today', showCompleted = false,
  lockFontScale = 4,
  onToggleTorch, onOpenCamera, onOpenQrScanner, onOpenTimer,
  onOpenCalculator, onToggleMediaPlayPause, onOpenAlarm, onOpenStopwatch,
}) {
  const [now, setNow] = useState(new Date())
  const [torchOn, setTorchOn] = useState(false)
  const [todoInput, setTodoInput] = useState('')
  const [showInput, setShowInput] = useState(false)
  const [addedAnim, setAddedAnim] = useState(false)
  const [completedExpanded, setCompletedExpanded] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (showInput) inputRef.current?.focus()
  }, [showInput])

  // 할일 필터링
  let filteredTodos = todos
  if (todoMode === 'today') {
    filteredTodos = filteredTodos.filter(t => t.date === todayStr)
  }
  const sortFn = (a, b) => {
    const da = `${a.date} ${a.time || '00:00'}`
    const db = `${b.date} ${b.time || '00:00'}`
    return da < db ? -1 : da > db ? 1 : 0
  }
  const incompleteTodos = [...filteredTodos.filter(t => !t.completed)].sort(sortFn)
  const completedTodos = showCompleted ? [...filteredTodos.filter(t => t.completed)].sort(sortFn) : []

  const hours = pad(now.getHours())
  const minutes = pad(now.getMinutes())
  const weekdays = {
    ko: ['일', '월', '화', '수', '목', '금', '토'],
    en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    ja: ['日', '月', '火', '水', '木', '金', '土'],
    zh: ['日', '一', '二', '三', '四', '五', '六'],
  }
  const months = {
    ko: `${now.getMonth() + 1}월 ${now.getDate()}일`,
    en: now.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
    ja: `${now.getMonth() + 1}月${now.getDate()}日`,
    zh: `${now.getMonth() + 1}月${now.getDate()}日`,
  }
  const wday = (weekdays[lang] || weekdays.en)[now.getDay()]
  const dateStr = months[lang] || months.en

  const openLabel = isPreview
    ? (lang === 'ko' ? '닫기' : lang === 'ja' ? '閉じる' : lang === 'zh' ? '关闭' : 'Close Preview')
    : (lang === 'ko' ? '앱 열기' : lang === 'ja' ? 'アプリを開く' : lang === 'zh' ? '打开应用' : 'Open App')

  const todayLabel = todoMode === 'all'
    ? (lang === 'ko' ? '전체 할 일' : lang === 'ja' ? '全タスク' : lang === 'zh' ? '所有任务' : 'All Tasks')
    : (lang === 'ko' ? '오늘 할 일' : lang === 'ja' ? '今日のタスク' : lang === 'zh' ? '今日任务' : "Today's Tasks")

  const doneAllLabel = lang === 'ko' ? '할 일이 없어요 🎉' : lang === 'ja' ? 'タスクはありません🎉' : lang === 'zh' ? '没有任务🎉' : 'Nothing here! 🎉'
  const completedLabel = lang === 'ko' ? '완료된 할 일' : lang === 'ja' ? '完了したタスク' : lang === 'zh' ? '已完成任务' : 'Completed'
  const addPlaceholder = lang === 'ko' ? '할 일 빠르게 추가...' : lang === 'ja' ? 'タスクを素早く追加...' : lang === 'zh' ? '快速添加任务...' : 'Quick add task...'

  // ─── 버튼 핸들러 맵 ─────────────────────────────────────────
  const buttonHandlers = {
    torch: async () => {
      const next = !torchOn
      setTorchOn(next)
      await onToggleTorch?.(next)
    },
    camera:     () => onOpenCamera?.(),
    qr:         () => onOpenQrScanner?.(),
    timer:      () => onOpenTimer?.(),
    calculator: () => onOpenCalculator?.(),
    playPause:  () => onToggleMediaPlayPause?.(),
    alarm:      () => onOpenAlarm?.(),
    stopwatch:  () => onOpenStopwatch?.(),
  }

  const handleAddTodo = async () => {
    const text = todoInput.trim()
    if (!text) return
    setTodoInput('')
    setShowInput(false)
    await onAddTodo?.(text)
    setAddedAnim(true)
    setTimeout(() => setAddedAnim(false), 1500)
  }

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') handleAddTodo()
    if (e.key === 'Escape') { setShowInput(false); setTodoInput('') }
  }

  const scale = lockFontScaleMap[lockFontScale] ?? 1

  const renderButtons = (ids) => ids.map(id => {
    const BtnIcon = BUTTON_ICONS[id]
    if (!BtnIcon) return null
    const isActive = id === 'torch' && torchOn
    return (
      <button
        key={id}
        className={`lock-quick-btn${isActive ? ' active' : ''}`}
        onClick={buttonHandlers[id]}
        aria-label={id}
      >
        <BtnIcon on={torchOn} />
      </button>
    )
  })

  return (
    <div className="lock-screen-overlay">
      <div className="lock-bg-blob blob-1" />
      <div className="lock-bg-blob blob-2" />
      <div className="lock-bg-blob blob-3" />

      <div className="lock-screen-content" style={{ '--lock-font-scale': scale }}>
        {/* 시계 패널 */}
        <div className="lock-clock-panel">
          <div className="lock-time">{hours}<span className="lock-colon">:</span>{minutes}</div>
          <div className="lock-date">{dateStr} {wday}</div>
        </div>

        {/* 버튼 패널 (시계 하단) */}
        <div className="lock-quick-btns-side">
          {renderButtons(buttons)}
        </div>

        {/* 할일 패널 */}
        <div className="lock-tasks-panel">
          <div className="lock-tasks-title">{todayLabel}</div>

          {/* 빠른 할일 추가 — 리스트 상단 고정 */}
          {showInput ? (
            <div className="lock-add-row">
              <input
                ref={inputRef}
                className="lock-add-input"
                value={todoInput}
                onChange={e => setTodoInput(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder={addPlaceholder}
                maxLength={100}
              />
              <button className="lock-add-submit" onClick={handleAddTodo}>
                <IconPlus />
              </button>
            </div>
          ) : (
            <button
              className={`lock-add-trigger${addedAnim ? ' added' : ''}`}
              onClick={() => setShowInput(true)}
            >
              {addedAnim
                ? (lang === 'ko' ? '추가됐어요 ✓' : 'Added ✓')
                : (
                  <>
                    <IconPlus />
                    <span>{lang === 'ko' ? '할 일 추가' : lang === 'ja' ? 'タスク追加' : lang === 'zh' ? '添加任务' : 'Add Task'}</span>
                  </>
                )}
            </button>
          )}

          {/* 스크롤 가능한 할일 목록 */}
          <div className="lock-tasks-scroll">
            {incompleteTodos.length === 0 && completedTodos.length === 0 ? (
              <div className="lock-tasks-empty">{doneAllLabel}</div>
            ) : (
              <>
                {incompleteTodos.length === 0 && completedTodos.length > 0 ? (
                  <div className="lock-tasks-empty">{doneAllLabel}</div>
                ) : (
                  <ul className="lock-tasks-list">
                    {incompleteTodos.map(todo => (
                      <li key={todo.id} className="lock-task-item">
                        <span className="lock-task-dot" />
                        <span className="lock-task-text">{todo.text}</span>
                        {todo.time && <span className="lock-task-time">{todo.time}</span>}
                        {todoMode === 'all' && <span className="lock-task-date">{todo.date}</span>}
                      </li>
                    ))}
                  </ul>
                )}
                {showCompleted && completedTodos.length > 0 && (
                  <>
                    <button
                      className="lock-completed-toggle"
                      onClick={() => setCompletedExpanded(v => !v)}
                    >
                      <span>{completedLabel} ({completedTodos.length})</span>
                      <span className={`lock-completed-arrow${completedExpanded ? ' expanded' : ''}`}>›</span>
                    </button>
                    {completedExpanded && (
                      <ul className="lock-tasks-list">
                        {completedTodos.map(todo => (
                          <li key={todo.id} className="lock-task-item lock-task-done">
                            <span className="lock-task-dot done" />
                            <span className="lock-task-text">{todo.text}</span>
                            {todo.time && <span className="lock-task-time">{todo.time}</span>}
                            {todoMode === 'all' && <span className="lock-task-date">{todo.date}</span>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* 열기 버튼 */}
        <button className="lock-open-btn" onClick={onOpen}>
          {openLabel}
        </button>
      </div>

    </div>
  )
}
