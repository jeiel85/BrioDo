import { useState, useEffect } from 'react'

function pad(n) { return String(n).padStart(2, '0') }

export function LockScreenView({ todos, lang, onOpen, todayStr, isPreview }) {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const topTodos = todos
    .filter(t => !t.completed && t.date === todayStr)
    .slice(0, 5)

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
  const todayLabel = lang === 'ko' ? '오늘 할 일' : lang === 'ja' ? '今日のタスク' : lang === 'zh' ? '今日任务' : 'Today\'s Tasks'
  const doneAllLabel = lang === 'ko' ? '오늘 할 일을 모두 완료했어요! 🎉' : lang === 'ja' ? '今日のタスクはすべて完了！🎉' : lang === 'zh' ? '今天的任务全部完成！🎉' : 'All done for today! 🎉'

  return (
    <div className="lock-screen-overlay">
      {/* 애니메이션 배경 블롭 (배경화면 블러 느낌) */}
      <div className="lock-bg-blob blob-1" />
      <div className="lock-bg-blob blob-2" />
      <div className="lock-bg-blob blob-3" />

      <div className="lock-screen-content">
        {/* 시계 */}
        <div className="lock-clock-panel">
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
        </div>

        {/* 열기 버튼 */}
        <button className="lock-open-btn" onClick={onOpen}>
          {openLabel}
        </button>
      </div>
    </div>
  )
}
