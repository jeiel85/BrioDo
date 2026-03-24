import { useMemo, useState, useEffect, useRef } from 'react'
import { calcStreak } from '../utils/helpers'

const n = (ko, en, ja, zh) => ({ ko, en, ja, zh })

export const ACHIEVEMENT_DEFS = [
  // Streak
  { id: 'S1', icon: '🔥', difficulty: 3, category: 'streak', name: n('불꽃 시작','Hot Start','炎の始まり','燃烧开始'), desc: n('3일 연속 최소 1개 완료','3-day streak','3日連続1タスク完了','连续3天完成1件'), check: s => s.streak >= 3 },
  { id: 'S2', icon: '🔥🔥', difficulty: 5, category: 'streak', name: n('일주일 챔피언','Week Champion','一週間チャンプ','周冠军'), desc: n('7일 연속 최소 1개 완료','7-day streak','7日連続完了','连续7天完成'), check: s => s.streak >= 7 },
  { id: 'S3', icon: '💪', difficulty: 6, category: 'streak', name: n('2주 돌파','2-Week Run','2週間突破','两周突破'), desc: n('14일 연속 최소 1개 완료','14-day streak','14日連続完了','连续14天完成'), check: s => s.streak >= 14 },
  { id: 'S4', icon: '🏆', difficulty: 8, category: 'streak', name: n('한달 챔피언','Month Champion','月間チャンプ','月冠军'), desc: n('30일 연속 최소 1개 완료','30-day streak','30日連続完了','连续30天完成'), check: s => s.streak >= 30 },
  { id: 'S5', icon: '👑', difficulty: 10, category: 'streak', name: n('100일의 기적','100-Day Miracle','100日の奇跡','百日奇迹'), desc: n('100일 연속 최소 1개 완료','100-day streak','100日連続完了','连续100天完成'), check: s => s.streak >= 100 },
  // Completion count
  { id: 'C1', icon: '🎉', difficulty: 1, category: 'completion', name: n('첫 발걸음','First Step','第一歩','第一步'), desc: n('첫 번째 할 일 완료','Complete your first task','初めてタスクを完了','完成第一件任务'), check: s => s.totalCompleted >= 1 },
  { id: 'C2', icon: '⚡', difficulty: 3, category: 'completion', name: n('가속 중','Speeding Up','加速中','加速中'), desc: n('누적 10개 완료','10 total completions','累計10件完了','累计完成10件'), check: s => s.totalCompleted >= 10 },
  { id: 'C3', icon: '🎯', difficulty: 5, category: 'completion', name: n('집중 모드','Focus Mode','集中モード','专注模式'), desc: n('누적 50개 완료','50 total completions','累計50件完了','累计完成50件'), check: s => s.totalCompleted >= 50 },
  { id: 'C4', icon: '💯', difficulty: 7, category: 'completion', name: n('백 개 돌파','Century','百個突破','百件突破'), desc: n('누적 100개 완료','100 total completions','累計100件完了','累计完成100件'), check: s => s.totalCompleted >= 100 },
  { id: 'C5', icon: '🚀', difficulty: 9, category: 'completion', name: n('로켓 생산성','Rocket Productivity','ロケット生産性','火箭生产力'), desc: n('누적 500개 완료','500 total completions','累計500件完了','累计完成500件'), check: s => s.totalCompleted >= 500 },
  { id: 'C6', icon: '🌟', difficulty: 10, category: 'completion', name: n('전설의 완료자','Legendary Achiever','伝説の達成者','传奇完成者'), desc: n('누적 1000개 완료','1000 total completions','累計1000件完了','累计完成1000件'), check: s => s.totalCompleted >= 1000 },
  // Daily
  { id: 'D1', icon: '📥', difficulty: 2, category: 'daily', name: n('인박스 제로','Inbox Zero','インボックスゼロ','收件箱清零'), desc: n('오늘 할 일 전부 완료','Complete all tasks for today','今日のタスクを全完了','完成今天所有任务'), check: s => s.todayActive === 0 && s.todayTotal > 0 },
  { id: 'D2', icon: '☀️', difficulty: 5, category: 'daily', name: n('얼리버드','Early Bird','アーリーバード','早鸟'), desc: n('오전 9시 전에 3개 완료','Complete 3 tasks before 9am','午前9時前に3件完了','上午9点前完成3件'), check: s => s.earlyBird >= 3 },
  { id: 'D3', icon: '🌙', difficulty: 5, category: 'daily', name: n('야행성','Night Owl','夜型','夜猫子'), desc: n('오후 11시 이후에 할 일 완료','Complete a task after 11pm','午後11時以降にタスク完了','晚上11点后完成任务'), check: s => s.nightOwl >= 1 },
  { id: 'D4', icon: '⚡', difficulty: 4, category: 'daily', name: n('스피드런','Speed Run','スピードラン','速通'), desc: n('당일 등록한 할 일을 1시간 내 완료','Complete a task within 1 hour of adding','追加後1時間以内に完了','添加后1小时内完成'), check: s => s.speedRun >= 1 },
  { id: 'D5', icon: '🎯', difficulty: 4, category: 'daily', name: n('하루 5개','High Five Day','1日5件','一天5件'), desc: n('하루에 5개 이상 완료','Complete 5+ tasks in one day','1日に5件以上完了','一天完成5件以上'), check: s => s.todayCompleted >= 5 },
  { id: 'D6', icon: '🔟', difficulty: 6, category: 'daily', name: n('풀가동','Full Power','フル稼働','全力运转'), desc: n('하루에 10개 이상 완료','Complete 10+ tasks in one day','1日に10件以上完了','一天完成10件以上'), check: s => s.todayCompleted >= 10 },
  // Weekly
  { id: 'W1', icon: '📊', difficulty: 6, category: 'weekly', name: n('주간 달성자','Weekly Achiever','週間達成者','周成就者'), desc: n('한 주에 20개 이상 완료','20+ completions in a week','1週間に20件以上完了','一周内完成20件以上'), check: s => s.weekCompleted >= 20 },
  { id: 'W2', icon: '💼', difficulty: 5, category: 'weekly', name: n('평일 전사','Weekday Warrior','平日ウォリアー','工作日战士'), desc: n('월~금 5일 연속 최소 1개 완료','Complete tasks Mon–Fri 5 days in a row','月〜金5日連続1件完了','周一至周五连续5天完成'), check: s => s.weekdayWarrior },
  { id: 'W3', icon: '🗓️', difficulty: 6, category: 'weekly', name: n('주말 집중','Weekend Warrior','週末集中','周末集中'), desc: n('토·일 각각 3개 이상 완료','Complete 3+ tasks each weekend day','土日それぞれ3件以上完了','周六周日各完成3件以上'), check: s => s.weekendFocus },
  { id: 'W4', icon: '🌸', difficulty: 3, category: 'weekly', name: n('월요일 리셋','Monday Reset','月曜リセット','周一重启'), desc: n('월요일에 5개 이상 완료','Complete 5+ tasks on a Monday','月曜日に5件以上完了','周一完成5件以上'), check: s => s.mondayCompletions >= 5 },
  { id: 'W5', icon: '📅', difficulty: 8, category: 'weekly', name: n('한달 꽉 채우기','Month Full','月間フル','月度满载'), desc: n('한 달에 100개 이상 완료','100+ completions in a month','1ヶ月に100件以上完了','一个月内完成100件以上'), check: s => s.monthCompleted >= 100 },
  // Recurrence
  { id: 'R1', icon: '🔄', difficulty: 2, category: 'recurrence', name: n('루틴 시작','Routine Start','ルーティン開始','开始例行任务'), desc: n('첫 반복 일정 생성','Create your first recurring task','初めての繰り返しタスク作成','创建第一个重复任务'), check: s => s.hasRecurrence },
  { id: 'R2', icon: '📆', difficulty: 5, category: 'recurrence', name: n('습관의 씨앗','Habit Seed','習慣の種','习惯种子'), desc: n('반복 일정을 7회 연속 완료','Complete a recurring task 7 times','繰り返しタスクを7回連続完了','连续7次完成重复任务'), check: s => s.recurringStreak >= 7 },
  { id: 'R3', icon: '🎭', difficulty: 7, category: 'recurrence', name: n('루틴 마스터','Routine Master','ルーティンマスター','例行任务大师'), desc: n('서로 다른 반복 일정 3개 동시 활성화','3 different recurring tasks active','3つの繰り返しタスクを同時に','同时激活3个不同的重复任务'), check: s => s.activeRecurrences >= 3 },
  { id: 'R4', icon: '💎', difficulty: 9, category: 'recurrence', name: n('100번 반복','100 Reps','100回繰り返し','100次重复'), desc: n('반복 일정 누적 100회 완료','100 total recurring completions','繰り返しタスク累計100回完了','累计完成100次重复任务'), check: s => s.completedRecurringCount >= 100 },
  // Tags
  { id: 'T1', icon: '🏷️', difficulty: 1, category: 'tag', name: n('태그 입문','Tag Explorer','タグ入門','标签入门'), desc: n('첫 태그 사용','Use your first tag','初めてタグを使用','使用第一个标签'), check: s => s.uniqueTagCount >= 1 },
  { id: 'T2', icon: '🗂️', difficulty: 4, category: 'tag', name: n('분류 전문가','Category Pro','分類のプロ','分类专家'), desc: n('서로 다른 태그 5가지 사용','Use 5 different tags','5種類のタグを使用','使用5种不同标签'), check: s => s.uniqueTagCount >= 5 },
  { id: 'T3', icon: '🌈', difficulty: 6, category: 'tag', name: n('카테고리 컬렉터','Category Collector','カテゴリコレクター','分类收藏家'), desc: n('서로 다른 태그 10가지 사용','Use 10 different tags','10種類のタグを使用','使用10种不同标签'), check: s => s.uniqueTagCount >= 10 },
  { id: 'T4', icon: '🎨', difficulty: 5, category: 'tag', name: n('다재다능','Multitasker','多才多芸','多才多艺'), desc: n('같은 날 3가지 이상 다른 태그 완료','Complete tasks with 3+ tags in one day','同日に3種類以上の異なるタグ完了','同一天完成3种以上不同标签任务'), check: s => s.todayTagVariety >= 3 },
  // Subtasks
  { id: 'ST1', icon: '✅', difficulty: 2, category: 'subtask', name: n('체크리스트 시작','Checklist Start','チェックリスト開始','清单开始'), desc: n('첫 하위 태스크 완료','Complete your first subtask','初めてサブタスクを完了','完成第一个子任务'), check: s => s.totalSubtasksCompleted >= 1 },
  { id: 'ST2', icon: '📝', difficulty: 5, category: 'subtask', name: n('꼼꼼한 계획자','Detail Planner','綿密な計画者','细心计划者'), desc: n('하위 태스크 5개 이상인 할 일 완료','Complete a task with 5+ subtasks','5件以上のサブタスクを持つタスクを完了','完成含5个以上子任务的任务'), check: s => s.completedBigSubtaskTodo },
  { id: 'ST3', icon: '🔍', difficulty: 7, category: 'subtask', name: n('세부사항 전문가','Detail Expert','細部のプロ','细节专家'), desc: n('하위 태스크 누적 50개 완료','50 total subtask completions','サブタスク累計50件完了','累计完成50个子任务'), check: s => s.totalSubtasksCompleted >= 50 },
  { id: 'ST4', icon: '🧩', difficulty: 8, category: 'subtask', name: n('완벽 분해','Perfect Breakdown','完全分解','完美分解'), desc: n('하위 태스크 10개짜리 할 일 전부 완료','Complete a task with all 10 subtasks done','10件のサブタスクを全完了','完成含10个子任务的全部任务'), check: s => s.completedPerfectSubtaskTodo },
  // Priority
  { id: 'P1', icon: '🚨', difficulty: 5, category: 'priority', name: n('긴급 처리반','Urgent Response','緊急処理班','紧急处理'), desc: n('긴급 우선순위 5개 완료','Complete 5 urgent tasks','緊急優先度タスクを5件完了','完成5件紧急优先任务'), check: s => s.completedByPriority.urgent >= 5 },
  { id: 'P2', icon: '🎯', difficulty: 6, category: 'priority', name: n('집중 집중','High Focus','高集中','高度专注'), desc: n('높음 우선순위 10개 완료','Complete 10 high-priority tasks','高優先度タスクを10件完了','完成10件高优先级任务'), check: s => s.completedByPriority.high >= 10 },
  { id: 'P3', icon: '⚖️', difficulty: 3, category: 'priority', name: n('균형 잡기','Balanced','バランスを保つ','保持平衡'), desc: n('4가지 우선순위 각 1개씩 완료','Complete 1 task at each priority level','4種類の優先度を各1件完了','完成每种优先级各1件'), check: s => s.completedByPriority.low >= 1 && s.completedByPriority.medium >= 1 && s.completedByPriority.high >= 1 && s.completedByPriority.urgent >= 1 },
  { id: 'P4', icon: '🧘', difficulty: 7, category: 'priority', name: n('느긋한 완료','Laid Back','のんびり完了','悠闲完成'), desc: n('낮음 우선순위 20개 완료','Complete 20 low-priority tasks','低優先度タスクを20件完了','完成20件低优先级任务'), check: s => s.completedByPriority.low >= 20 },
  // AI
  { id: 'AI1', icon: '🤖', difficulty: 2, category: 'ai', name: n('AI 친구','AI Buddy','AIフレンド','AI朋友'), desc: n('AI 자연어 입력 첫 사용','Use AI input for the first time','AI入力を初めて使用','首次使用AI输入'), check: s => s.flags?.aiUsed },
  { id: 'AI2', icon: '🎙️', difficulty: 3, category: 'ai', name: n('말하는 생산성','Voice Power','話す生産性','说话的生产力'), desc: n('음성 입력 첫 사용','Use voice input for the first time','音声入力を初めて使用','首次使用语音输入'), check: s => s.flags?.voiceUsed },
  { id: 'AI3', icon: '🧠', difficulty: 5, category: 'ai', name: n('AI 파트너','AI Partner','AIパートナー','AI伙伴'), desc: n('AI 입력으로 10개 할 일 생성','Create 10 tasks using AI','AI入力で10件タスク作成','用AI输入创建10件任务'), check: s => (s.flags?.aiTasks || 0) >= 10 },
  { id: 'AI4', icon: '🗣️', difficulty: 7, category: 'ai', name: n('음성 마스터','Voice Master','音声マスター','语音大师'), desc: n('음성 입력으로 20개 할 일 생성','Create 20 tasks using voice','音声入力で20件タスク作成','用语音输入创建20件任务'), check: s => (s.flags?.voiceTasks || 0) >= 20 },
  // Calendar
  { id: 'CAL1', icon: '📆', difficulty: 2, category: 'calendar', name: n('캘린더 연동','Calendar Sync','カレンダー連携','日历同步'), desc: n('Google Calendar 첫 연동','Sync with Google Calendar','Googleカレンダーと初めて連携','首次与Google日历同步'), check: s => s.calendarUsed },
  { id: 'CAL2', icon: '🔗', difficulty: 6, category: 'calendar', name: n('동기화 유지','Sync Maintained','同期維持','保持同步'), desc: n('캘린더 연동으로 7일 이상 사용','Use with calendar sync for 7+ days','カレンダー連携で7日以上使用','保持日历同步使用7天以上'), check: s => s.calendarMaintained },
  // Notes
  { id: 'N1', icon: '📖', difficulty: 4, category: 'notes', name: n('스토리텔러','Storyteller','ストーリーテラー','故事讲述者'), desc: n('설명이 있는 할 일 10개 완료','Complete 10 tasks with descriptions','説明付きタスクを10件完了','完成10件带描述的任务'), check: s => s.completedWithDescription >= 10 },
  { id: 'N2', icon: '🖊️', difficulty: 7, category: 'notes', name: n('기록의 달인','Note Master','記録の達人','记录达人'), desc: n('설명 포함 할 일 50개 완료','Complete 50 tasks with descriptions','説明付きタスクを50件完了','完成50件带描述的任务'), check: s => s.completedWithDescription >= 50 },
  // Special
  { id: 'SP1', icon: '🎆', difficulty: 4, category: 'special', name: n('새해 결심','New Year Resolution','新年の決意','新年决心'), desc: n('1월 1일에 할 일 완료','Complete a task on January 1st','1月1日にタスクを完了','在1月1日完成任务'), check: s => s.special?.newYear },
  { id: 'SP2', icon: '🎄', difficulty: 4, category: 'special', name: n('크리스마스 달성','Christmas Done','クリスマス達成','圣诞节完成'), desc: n('12월 25일에 할 일 완료','Complete a task on December 25th','12月25日にタスクを完了','在12月25日完成任务'), check: s => s.special?.christmas },
  { id: 'SP3', icon: '🌸', difficulty: 4, category: 'special', name: n('봄의 시작','Spring Start','春の始まり','春天开始'), desc: n('3월 1일에 할 일 완료','Complete a task on March 1st','3月1日にタスクを完了','在3月1日完成任务'), check: s => s.special?.spring },
  // Engagement
  { id: 'E1', icon: '🎖️', difficulty: 1, category: 'engagement', name: n('첫 업적','First Badge','最初の実績','第一个成就'), desc: n('첫 번째 업적 달성','Unlock your first achievement','初めての実績解除','解锁第一个成就'), check: s => s.unlockedCount >= 1 },
  { id: 'E2', icon: '🔎', difficulty: 2, category: 'engagement', name: n('탐색자','Explorer','探検者','探索者'), desc: n('검색 기능 첫 사용','Use the search feature first time','検索機能を初めて使用','首次使用搜索功能'), check: s => s.flags?.searchUsed },
  { id: 'E3', icon: '📱', difficulty: 4, category: 'engagement', name: n('주간 유저','Weekly User','ウィークリーユーザー','周常用户'), desc: n('7일 연속 앱 실행','Open the app for 7 days in a row','アプリを7日連続起動','连续7天打开应用'), check: s => (s.flags?.appStreak || 0) >= 7 },
  { id: 'E4', icon: '🌍', difficulty: 9, category: 'engagement', name: n('한 해의 동반자','Year-Long Partner','1年間のパートナー','全年伙伴'), desc: n('365일 앱 사용','Use the app for 365 days total','アプリを365日使用','累计使用应用365天'), check: s => (s.flags?.totalOpens || 0) >= 365 },
  { id: 'E5', icon: '⭐', difficulty: 3, category: 'engagement', name: n('컬렉션 탐험가','Collection Explorer','コレクション探検家','收藏探险家'), desc: n('컬렉션 뷰 처음 방문','Visit the collections view','コレクションビューを初めて訪問','首次访问收藏视图'), check: s => s.flags?.collectionVisited },
  { id: 'E6', icon: '🏅', difficulty: 7, category: 'engagement', name: n('업적 수집가','Achievement Collector','実績コレクター','成就收集家'), desc: n('10개 이상 업적 달성','Unlock 10 or more achievements','10個以上の実績を解除','解锁10个以上成就'), check: s => s.unlockedCount >= 10 },
  { id: 'E7', icon: '🌟', difficulty: 9, category: 'engagement', name: n('업적 마스터','Achievement Master','実績マスター','成就大师'), desc: n('30개 이상 업적 달성','Unlock 30 or more achievements','30個以上の実績を解除','解锁30个以上成就'), check: s => s.unlockedCount >= 30 },
]

export function useAchievements({ todos, todayStr, weeklyPulse }) {
  const [notifications, setNotifications] = useState([])
  const [unlockQueue, setUnlockQueue] = useState([])
  const [currentUnlock, setCurrentUnlock] = useState(null)
  const isFirstMount = useRef(true)

  const stats = useMemo(() => {
    const streak = calcStreak(todos, todayStr)
    const totalCompleted = todos.filter(t => t.completed).length
    const todayCompleted = todos.filter(t => t.completed && t.date === todayStr).length
    const todayActive = todos.filter(t => !t.completed && t.date === todayStr).length
    const todayTotal = todos.filter(t => t.date === todayStr).length
    const uniqueTagCount = new Set(todos.flatMap(t => t.tags || [])).size
    const completedByPriority = { low: 0, medium: 0, high: 0, urgent: 0 }
    todos.forEach(t => { if (t.completed && t.priority) completedByPriority[t.priority] = (completedByPriority[t.priority] || 0) + 1 })
    const completedWithDescription = todos.filter(t => t.completed && t.description?.trim()).length
    const totalSubtasksCompleted = todos.reduce((sum, t) => sum + (t.subtasks?.filter(s => s.completed).length || 0), 0)
    const completedBigSubtaskTodo = todos.some(t => t.completed && (t.subtasks?.filter(s => s.completed).length || 0) >= 5)
    const completedPerfectSubtaskTodo = todos.some(t => t.completed && t.subtasks?.length >= 10 && t.subtasks.every(s => s.completed))
    const hasRecurrence = todos.some(t => t.recurrence?.type && t.recurrence.type !== 'none')
    const activeRecurrences = todos.filter(t => t.recurrence?.type && t.recurrence.type !== 'none' && !t.completed).length
    const todayTagVariety = new Set(todos.filter(t => t.completed && t.date === todayStr).flatMap(t => t.tags || [])).size
    const weekCompleted = (weeklyPulse || []).reduce((sum, d) => sum + d.completed, 0)
    
    let earlyBird = 0, nightOwl = 0, speedRun = 0, mondayCompletions = 0, monthCompleted = 0
    let satComplete = 0, sunComplete = 0, calSyncCount = 0
    let special = { newYear: false, christmas: false, spring: false }
    let completedRecurringCount = 0, recurringStreak = 0
    const nowMonth = new Date().getMonth()
    
    todos.forEach(t => {
      if (t.googleEventId) calSyncCount++
      if (t.completed) {
        if (t.date.endsWith('-01-01')) special.newYear = true
        if (t.date.endsWith('-12-25')) special.christmas = true
        if (t.date.endsWith('-03-01')) special.spring = true
        if (t.completedAt) {
          const d = new Date(t.completedAt)
          const hr = d.getHours()
          if (hr < 9) earlyBird++
          if (hr >= 23 || hr < 4) nightOwl++
          if (t.createdAt && (t.completedAt - t.createdAt <= 3600000)) speedRun++
          if (d.getDay() === 1) mondayCompletions++
          if (d.getMonth() === nowMonth) monthCompleted++
          if (d.getDay() === 6) satComplete++
          if (d.getDay() === 0) sunComplete++
        }
      }
      if (t.recurrence?.type && t.recurrence.type !== 'none' && t.completions) {
        const comps = Object.values(t.completions).filter(Boolean)
        completedRecurringCount += comps.length
        let currStrk = 0
        Object.keys(t.completions).sort().forEach(cd => {
          if (t.completions[cd]) { currStrk++; if (currStrk > recurringStreak) recurringStreak = currStrk }
          else currStrk = 0
        })
      }
    })
    
    const weekendFocus = satComplete >= 3 && sunComplete >= 3
    const calendarUsed = calSyncCount > 0
    const calendarMaintained = calSyncCount >= 10
    
    let weekdayWarrior = false
    if (weeklyPulse && weeklyPulse.length >= 7) {
      weekdayWarrior = true
      for (let i=0; i<7; i++) {
        const day = new Date(weeklyPulse[i].date).getDay()
        if (day > 0 && day < 6 && weeklyPulse[i].completed === 0) weekdayWarrior = false
      }
    }

    let flags = {}
    try { flags = JSON.parse(localStorage.getItem('blenddo_engagement_flags') || '{}') } catch(e){}

    return {
      streak, totalCompleted, todayCompleted, todayActive, todayTotal,
      uniqueTagCount, completedByPriority, completedWithDescription,
      totalSubtasksCompleted, completedBigSubtaskTodo, completedPerfectSubtaskTodo,
      hasRecurrence, activeRecurrences, todayTagVariety, weekCompleted,
      earlyBird, nightOwl, speedRun, mondayCompletions, monthCompleted,
      weekendFocus, weekdayWarrior, calendarUsed, calendarMaintained,
      special, completedRecurringCount, recurringStreak, flags,
      unlockedCount: 0,
    }
  }, [todos, todayStr, weeklyPulse])

  const unlockedIds = useMemo(() => {
    const firstPass = ACHIEVEMENT_DEFS.filter(a => {
      if (a.id === 'E1' || a.id === 'E6' || a.id === 'E7') return false
      try { return a.check(stats) } catch { return false }
    })
    const count = firstPass.length
    const statsWithCount = { ...stats, unlockedCount: count }
    return new Set(
      ACHIEVEMENT_DEFS.filter(a => { try { return a.check(statsWithCount) } catch { return false } }).map(a => a.id)
    )
  }, [stats])

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false
      localStorage.setItem('blenddo_unlocked_ids', JSON.stringify([...unlockedIds]))
      return
    }
    const stored = new Set(JSON.parse(localStorage.getItem('blenddo_unlocked_ids') || '[]'))
    const newOnes = [...unlockedIds].filter(id => !stored.has(id))
    if (newOnes.length > 0) {
      const newAchs = newOnes.map(id => ACHIEVEMENT_DEFS.find(a => a.id === id)).filter(Boolean)
      setNotifications(prev => [...prev, ...newAchs])
      setUnlockQueue(prev => [...prev, ...newAchs])
      localStorage.setItem('blenddo_unlocked_ids', JSON.stringify([...unlockedIds]))
    }
  }, [unlockedIds])

  useEffect(() => {
    if (!currentUnlock && unlockQueue.length > 0) {
      setCurrentUnlock(unlockQueue[0])
      setUnlockQueue(prev => prev.slice(1))
    }
  }, [unlockQueue, currentUnlock])

  const unlockedSortedByDifficulty = useMemo(() =>
    ACHIEVEMENT_DEFS.filter(a => unlockedIds.has(a.id)).sort((a, b) => b.difficulty - a.difficulty),
    [unlockedIds]
  )

  return {
    unlockedIds,
    unlockedSortedByDifficulty,
    notifications,
    clearNotifications: () => setNotifications([]),
    currentUnlock,
    dismissUnlock: () => setCurrentUnlock(null),
  }
}

export function trackEngagement(flagName, increment = false) {
  try {
    const flags = JSON.parse(localStorage.getItem('blenddo_engagement_flags') || '{}')
    if (increment) {
      flags[flagName] = (flags[flagName] || 0) + 1
    } else {
      flags[flagName] = true
    }
    localStorage.setItem('blenddo_engagement_flags', JSON.stringify(flags))
  } catch (e) {
    console.error('Failed to track engagement:', e)
  }
}
