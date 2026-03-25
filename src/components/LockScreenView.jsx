import { useState, useEffect, useRef } from 'react'

function pad(n) { return String(n).padStart(2, '0') }

const IconFlash = ({ on }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="26" height="26">
    <path d={on
      ? "M7 2v11h3v9l7-12h-4l4-8z"
      : "M7 2v11h3v9l7-12h-4l4-8z M3.27 1L2 2.27l5.73 5.73H7v11h3v9l7-12h-4l2.45-4.45L19.73 23 21 21.73 3.27 1z"}
    />
  </svg>
)

const IconCamera = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="26" height="26">
    <path d="M12 15.2A3.2 3.2 0 0 1 8.8 12 3.2 3.2 0 0 1 12 8.8 3.2 3.2 0 0 1 15.2 12 3.2 3.2 0 0 1 12 15.2M9 3L7.17 5H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3.17L15 3H9m3 15a6 6 0 0 1-6-6 6 6 0 0 1 6-6 6 6 0 0 1 6 6 6 6 0 0 1-6 6z"/>
  </svg>
)

const IconPlus = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
  </svg>
)

export function LockScreenView({
  todos, lang, onOpen, todayStr, isPreview,
  onAddTodo, onToggleTorch, onOpenCamera,
  buttonLayout = 'corners'  // 'corners' | 'clock'
}) {
  const [now, setNow] = useState(new Date())
  const [torchOn, setTorchOn] = useState(false)
  const [todoInput, setTodoInput] = useState('')
  const [showInput, setShowInput] = useState(false)
  const [addedAnim, setAddedAnim] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (showInput) inputRef.current?.focus()
  }, [showInput])

  const topTodos = todos
    .filter(t => !t.completed && t.date === todayStr)
    .slice(0, 4)

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
  const todayLabel = lang === 'ko' ? '오늘 할 일' : lang === 'ja' ? '今日のタスク' : lang === 'zh' ? '今日任务' : "Today's Tasks"
  const doneAllLabel = lang === 'ko' ? '오늘 할 일을 모두 완료했어요! 🎉' : lang === 'ja' ? '今日のタスクはすべて完了！🎉' : lang === 'zh' ? '今天的任务全部完成！🎉' : 'All done for today! 🎉'
  const addPlaceholder = lang === 'ko' ? '할 일 빠르게 추가...' : lang === 'ja' ? 'タスクを素早く追加...' : lang === 'zh' ? '快速添加任务...' : 'Quick add task...'

  const handleTorch = async () => {
    const next = !torchOn
    setTorchOn(next)
    await onToggleTorch?.(next)
  }

  const handleCamera = async () => {
    await onOpenCamera?.()
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

  const QuickBtns = () => (
    <>
      <button
        className={`lock-quick-btn${torchOn ? ' active' : ''}`}
        onClick={handleTorch}
        aria-label="flashlight"
      >
        <IconFlash on={torchOn} />
      </button>
      <button
        className="lock-quick-btn"
        onClick={handleCamera}
        aria-label="camera"
      >
        <IconCamera />
      </button>
    </>
  )

  return (
    <div className="lock-screen-overlay">
      <div className="lock-bg-blob blob-1" />
      <div className="lock-bg-blob blob-2" />
      <div className="lock-bg-blob blob-3" />

      <div className="lock-screen-content">
        {/* 시계 */}
        <div className="lock-clock-panel">
          {buttonLayout === 'clock' && (
            <div className="lock-quick-btns-clock">
              <QuickBtns />
            </div>
          )}
          <div className="lock-time">{hours}<span className="lock-colon">:</span>{minutes}</div>
          <div className="lock-date">{dateStr} {wday}</div>
        </div>

        {/* 오늘 할 일 */}
        <div className="lock-tasks-panel">
          <div className="lock-tasks-title">{todayLabel}</div>
          {topTodos.length === 0 ? (
            <div className="lock-tasks-empty">{doneAllLabel}</div>
          ) : (
            <ul className="lock-tasks-list">
              {topTodos.map(todo => (
                <li key={todo.id} className="lock-task-item">
                  <span className="lock-task-dot" />
                  <span className="lock-task-text">{todo.text}</span>
                  {todo.time && <span className="lock-task-time">{todo.time}</span>}
                </li>
              ))}
            </ul>
          )}

          {/* 빠른 할 일 추가 */}
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
        </div>

        {/* 열기 버튼 */}
        <button className="lock-open-btn" onClick={onOpen}>
          {openLabel}
        </button>
      </div>

      {/* 1안: 모서리 버튼 */}
      {buttonLayout === 'corners' && (
        <div className="lock-quick-btns-corners">
          <QuickBtns />
        </div>
      )}
    </div>
  )
}
