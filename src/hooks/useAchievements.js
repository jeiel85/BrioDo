import { useMemo, useState, useEffect, useRef } from 'react'
import { calcStreak } from '../utils/helpers'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'

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
  // ── 추가 업적 50개 ──
  // Streak+
  { id: 'S6', icon: '⚡', difficulty: 7, category: 'streak', name: n('3주 돌파','3-Week Run','3週間突破','三周突破'), desc: n('21일 연속 최소 1개 완료','21-day streak','21日連続完了','连续21天完成'), check: s => s.streak >= 21 },
  { id: 'S7', icon: '🌠', difficulty: 9, category: 'streak', name: n('50일의 여정','50-Day Journey','50日の旅','五十日旅程'), desc: n('50일 연속 최소 1개 완료','50-day streak','50日連続完了','连续50天完成'), check: s => s.streak >= 50 },
  { id: 'S8', icon: '🏔️', difficulty: 10, category: 'streak', name: n('200일 전설','200-Day Legend','200日の伝説','200日传奇'), desc: n('200일 연속 최소 1개 완료','200-day streak','200日連続完了','连续200天完成'), check: s => s.streak >= 200 },
  { id: 'S9', icon: '🌏', difficulty: 10, category: 'streak', name: n('1년의 기록','365-Day Record','365日の記録','全年记录'), desc: n('365일 연속 최소 1개 완료','365-day streak','365日連続完了','连续365天完成'), check: s => s.streak >= 365 },
  // Completion+
  { id: 'C7', icon: '🎗️', difficulty: 8, category: 'completion', name: n('200개 달성','200 Club','200達成','200件成就'), desc: n('누적 200개 완료','200 total completions','累計200件完了','累计完成200件'), check: s => s.totalCompleted >= 200 },
  { id: 'C8', icon: '🌅', difficulty: 7, category: 'completion', name: n('새벽의 챔피언','Dawn Champion','夜明けのチャンプ','黎明冠军'), desc: n('새벽에 20번 이상 완료','Complete 20+ tasks in early morning','早朝に20回以上完了','在清晨完成20次以上'), check: s => s.earlyBird >= 20 },
  { id: 'C9', icon: '🌙', difficulty: 7, category: 'completion', name: n('야행성 달인','Night Master','夜型達人','夜行达人'), desc: n('밤 11시 이후 10번 이상 완료','Complete 10+ tasks after 11pm','夜11時以降10回以上完了','晚上11点后完成10次以上'), check: s => s.nightOwl >= 10 },
  { id: 'C10', icon: '🎖️', difficulty: 8, category: 'completion', name: n('오늘의 영웅','Daily Hero','今日の英雄','今日英雄'), desc: n('하루에 15개 이상 완료','Complete 15+ tasks in one day','1日に15件以上完了','一天完成15件以上'), check: s => s.todayCompleted >= 15 },
  { id: 'C11', icon: '🦁', difficulty: 9, category: 'completion', name: n('하루의 왕','Day King','その日の王','当日之王'), desc: n('하루에 20개 이상 완료','Complete 20+ tasks in one day','1日に20件以上完了','一天完成20件以上'), check: s => s.todayCompleted >= 20 },
  // Daily+
  { id: 'D7', icon: '🌈', difficulty: 7, category: 'daily', name: n('다양성의 달인','Variety Master','多様性の達人','多样性大师'), desc: n('하루에 5가지 이상 다른 태그 완료','Complete tasks with 5+ different tags in a day','1日に5種類以上タグ完了','一天完成5种以上不同标签'), check: s => s.todayTagVariety >= 5 },
  { id: 'D8', icon: '⚡', difficulty: 6, category: 'daily', name: n('스피드런 전문가','Speed Runner','スピードランの達人','速通专家'), desc: n('당일 등록 후 1시간 내 완료 5회','5 tasks completed within 1 hour of adding','追加後1時間以内を5回達成','添加后1小时内完成5次'), check: s => s.speedRun >= 5 },
  { id: 'D9', icon: '🌃', difficulty: 6, category: 'daily', name: n('심야 전사','Late Night Warrior','深夜ウォリアー','深夜战士'), desc: n('밤 11시 이후 5번 완료','Complete 5 tasks after 11pm','夜11時以降5回完了','晚上11点后完成5次'), check: s => s.nightOwl >= 5 },
  { id: 'D10', icon: '📅', difficulty: 7, category: 'daily', name: n('월요일 열정가','Monday Enthusiast','月曜日の情熱家','周一热情者'), desc: n('월요일에 누적 20개 완료','Complete 20 tasks total on Mondays','月曜日に累計20件完了','周一累计完成20件'), check: s => s.mondayCompletions >= 20 },
  // Weekly+
  { id: 'W6', icon: '🔥', difficulty: 8, category: 'weekly', name: n('주간 50개','Weekly 50','週間50件','周50件'), desc: n('한 주에 50개 이상 완료','50+ completions in a week','1週間に50件以上完了','一周内完成50件以上'), check: s => s.weekCompleted >= 50 },
  { id: 'W7', icon: '✨', difficulty: 9, category: 'weekly', name: n('완벽한 일주일','Perfect Week','完璧な一週間','完美一周'), desc: n('7일 모두 최소 1개 이상 완료','Complete at least 1 task every day for a week','7日全て1件以上完了','一周7天每天至少完成1件'), check: s => s.perfectWeek },
  { id: 'W8', icon: '🏆', difficulty: 9, category: 'weekly', name: n('이번 달 200개','Month 200','今月200件','本月200件'), desc: n('이번 달 200개 이상 완료','200+ completions this month','今月200件以上完了','本月完成200件以上'), check: s => s.monthCompleted >= 200 },
  // Recurrence+
  { id: 'R5', icon: '🔄', difficulty: 7, category: 'recurrence', name: n('반복 50회','50 Reps','50回繰り返し','50次重复'), desc: n('반복 일정 누적 50회 완료','50 total recurring completions','繰り返し累計50回完了','累计完成50次重复任务'), check: s => s.completedRecurringCount >= 50 },
  { id: 'R6', icon: '💫', difficulty: 9, category: 'recurrence', name: n('반복 200회','200 Reps','200回繰り返し','200次重复'), desc: n('반복 일정 누적 200회 완료','200 total recurring completions','繰り返し累計200回完了','累计完成200次重复任务'), check: s => s.completedRecurringCount >= 200 },
  { id: 'R7', icon: '🧲', difficulty: 8, category: 'recurrence', name: n('30연속 반복','30-Streak Routine','30連続ルーティン','连续30次例行'), desc: n('반복 일정을 30회 연속 완료','Complete a recurring task 30 times in a row','繰り返しタスクを30回連続完了','连续30次完成重复任务'), check: s => s.recurringStreak >= 30 },
  { id: 'R8', icon: '🎡', difficulty: 8, category: 'recurrence', name: n('5종 반복 유지','5-Type Routine','5種ルーティン維持','维持5种例行任务'), desc: n('서로 다른 반복 일정 5개 동시 활성화','5 different recurring tasks active at once','5つの繰り返しタスクを同時に','同时激活5种不同的重复任务'), check: s => s.activeRecurrences >= 5 },
  // Tags+
  { id: 'T5', icon: '🗂️', difficulty: 7, category: 'tag', name: n('태그 달인','Tag Expert','タグの達人','标签专家'), desc: n('서로 다른 태그 15가지 사용','Use 15 different tags','15種類のタグを使用','使用15种不同标签'), check: s => s.uniqueTagCount >= 15 },
  { id: 'T6', icon: '🎨', difficulty: 8, category: 'tag', name: n('태그 마스터','Tag Master','タグマスター','标签大师'), desc: n('서로 다른 태그 20가지 사용','Use 20 different tags','20種類のタグを使用','使用20种不同标签'), check: s => s.uniqueTagCount >= 20 },
  { id: 'T7', icon: '🌐', difficulty: 9, category: 'tag', name: n('30 태그 컬렉터','Tag Collector 30','30タグコレクター','30标签收藏家'), desc: n('서로 다른 태그 30가지 사용','Use 30 different tags','30種類のタグを使用','使用30种不同标签'), check: s => s.uniqueTagCount >= 30 },
  { id: 'T8', icon: '🔮', difficulty: 10, category: 'tag', name: n('태그 그랜드마스터','Tag Grandmaster','タググランドマスター','标签特级大师'), desc: n('서로 다른 태그 50가지 사용','Use 50 different tags','50種類のタグを使用','使用50种不同标签'), check: s => s.uniqueTagCount >= 50 },
  // Subtasks+
  { id: 'ST5', icon: '🔬', difficulty: 8, category: 'subtask', name: n('하위 100개','100 Subtasks','サブタスク100件','100个子任务'), desc: n('하위 태스크 누적 100개 완료','100 total subtask completions','サブタスク累計100件完了','累计完成100个子任务'), check: s => s.totalSubtasksCompleted >= 100 },
  { id: 'ST6', icon: '🧬', difficulty: 9, category: 'subtask', name: n('하위 200개','200 Subtasks','サブタスク200件','200个子任务'), desc: n('하위 태스크 누적 200개 완료','200 total subtask completions','サブタスク累計200件完了','累计完成200个子任务'), check: s => s.totalSubtasksCompleted >= 200 },
  { id: 'ST7', icon: '🏗️', difficulty: 8, category: 'subtask', name: n('하위 150개','150 Subtasks','サブタスク150件','150个子任务'), desc: n('하위 태스크 누적 150개 완료','150 total subtask completions','サブタスク累計150件完了','累计完成150个子任务'), check: s => s.totalSubtasksCompleted >= 150 },
  // Priority+
  { id: 'P5', icon: '🚒', difficulty: 7, category: 'priority', name: n('긴급 달인','Urgent Expert','緊急の達人','紧急达人'), desc: n('긴급 우선순위 20개 완료','Complete 20 urgent tasks','緊急優先度タスクを20件完了','完成20件紧急任务'), check: s => s.completedByPriority.urgent >= 20 },
  { id: 'P6', icon: '🎯', difficulty: 7, category: 'priority', name: n('높음 50개','High 50','高優先度50件','高优先50件'), desc: n('높음 우선순위 50개 완료','Complete 50 high-priority tasks','高優先度タスクを50件完了','完成50件高优先级任务'), check: s => s.completedByPriority.high >= 50 },
  { id: 'P7', icon: '⚖️', difficulty: 8, category: 'priority', name: n('완벽한 균형','Perfect Balance','完璧なバランス','完美平衡'), desc: n('각 우선순위 10개씩 완료','Complete 10 tasks at each priority level','各優先度10件完了','每种优先级完成10件'), check: s => s.completedByPriority.low >= 10 && s.completedByPriority.medium >= 10 && s.completedByPriority.high >= 10 && s.completedByPriority.urgent >= 10 },
  { id: 'P8', icon: '🧘', difficulty: 8, category: 'priority', name: n('여유의 고수','Low-Key Master','のんびりの高手','悠然高手'), desc: n('낮음 우선순위 50개 완료','Complete 50 low-priority tasks','低優先度タスクを50件完了','完成50件低优先级任务'), check: s => s.completedByPriority.low >= 50 },
  // AI+
  { id: 'AI5', icon: '🤖', difficulty: 8, category: 'ai', name: n('AI 파워유저','AI Power User','AIパワーユーザー','AI超级用户'), desc: n('AI 입력으로 50개 할 일 생성','Create 50 tasks using AI input','AI入力で50件タスク作成','用AI输入创建50件任务'), check: s => (s.flags?.aiTasks || 0) >= 50 },
  { id: 'AI6', icon: '🧠', difficulty: 9, category: 'ai', name: n('AI 의존자','AI Devotee','AI依存者','AI信徒'), desc: n('AI 입력으로 100개 할 일 생성','Create 100 tasks using AI input','AI入力で100件タスク作成','用AI输入创建100件任务'), check: s => (s.flags?.aiTasks || 0) >= 100 },
  { id: 'AI7', icon: '🎤', difficulty: 8, category: 'ai', name: n('음성 파워유저','Voice Power User','音声パワーユーザー','语音超级用户'), desc: n('음성 입력으로 50개 할 일 생성','Create 50 tasks using voice','音声入力で50件タスク作成','用语音输入创建50件任务'), check: s => (s.flags?.voiceTasks || 0) >= 50 },
  { id: 'AI8', icon: '🗣️', difficulty: 9, category: 'ai', name: n('음성의 달인','Voice Devotee','音声の達人','语音达人'), desc: n('음성 입력으로 100개 할 일 생성','Create 100 tasks using voice','音声入力で100件タスク作成','用语音输入创建100件任务'), check: s => (s.flags?.voiceTasks || 0) >= 100 },
  // Calendar+
  { id: 'CAL3', icon: '📅', difficulty: 8, category: 'calendar', name: n('캘린더 파워유저','Calendar Power User','カレンダーパワーユーザー','日历超级用户'), desc: n('캘린더 연동 할 일 50개 이상','50+ tasks synced with calendar','カレンダー連携50件以上','日历同步50件以上'), check: s => s.calSyncCount >= 50 },
  { id: 'CAL4', icon: '🗓️', difficulty: 9, category: 'calendar', name: n('캘린더 마스터','Calendar Master','カレンダーマスター','日历大师'), desc: n('캘린더 연동 할 일 100개 이상','100+ tasks synced with calendar','カレンダー連携100件以上','日历同步100件以上'), check: s => s.calSyncCount >= 100 },
  // Notes+
  { id: 'N3', icon: '📓', difficulty: 6, category: 'notes', name: n('상세 기록자','Detail Recorder','詳細記録者','详细记录者'), desc: n('설명이 있는 할 일 25개 완료','Complete 25 tasks with descriptions','説明付きタスクを25件完了','完成25件带描述的任务'), check: s => s.completedWithDescription >= 25 },
  { id: 'N4', icon: '📜', difficulty: 8, category: 'notes', name: n('노트 전문가','Note Expert','ノートの専門家','笔记专家'), desc: n('설명이 있는 할 일 75개 완료','Complete 75 tasks with descriptions','説明付きタスクを75件完了','完成75件带描述的任务'), check: s => s.completedWithDescription >= 75 },
  { id: 'N5', icon: '📚', difficulty: 9, category: 'notes', name: n('노트 마스터','Note Master','ノートマスター','笔记大师'), desc: n('설명이 있는 할 일 100개 완료','Complete 100 tasks with descriptions','説明付きタスクを100件完了','完成100件带描述的任务'), check: s => s.completedWithDescription >= 100 },
  // Special+
  { id: 'SP4', icon: '🃏', difficulty: 4, category: 'special', name: n('만우절의 농담','April Fools','エイプリルフール','愚人节'), desc: n('4월 1일에 할 일 완료','Complete a task on April 1st','4月1日にタスクを完了','在4月1日完成任务'), check: s => s.special?.aprilFools },
  { id: 'SP5', icon: '🌸', difficulty: 4, category: 'special', name: n('광복절','Liberation Day','光復節','光复节'), desc: n('8월 15일에 할 일 완료','Complete a task on August 15th','8月15日にタスクを完了','在8月15日完成任务'), check: s => s.special?.liberationDay },
  { id: 'SP6', icon: '📖', difficulty: 4, category: 'special', name: n('한글날','Hangeul Day','ハングルの日','韩文日'), desc: n('10월 9일에 할 일 완료','Complete a task on October 9th','10月9日にタスクを完了','在10月9日完成任务'), check: s => s.special?.hangeulDay },
  { id: 'SP7', icon: '💝', difficulty: 4, category: 'special', name: n('발렌타인','Valentine','バレンタイン','情人节'), desc: n('2월 14일에 할 일 완료','Complete a task on February 14th','2月14日にタスクを完了','在2月14日完成任务'), check: s => s.special?.valentine },
  { id: 'SP8', icon: '🎠', difficulty: 4, category: 'special', name: n('어린이날','Children\'s Day','こどもの日','儿童节'), desc: n('5월 5일에 할 일 완료','Complete a task on May 5th','5月5日にタスクを完了','在5月5日完成任务'), check: s => s.special?.childrensDay },
  // Engagement+
  { id: 'E8', icon: '🥈', difficulty: 8, category: 'engagement', name: n('업적 수집 전문가','Achievement Expert','実績収集の専門家','成就收集专家'), desc: n('20개 이상 업적 달성','Unlock 20 or more achievements','20個以上の実績を解除','解锁20个以上成就'), check: s => s.unlockedCount >= 20 },
  { id: 'E9', icon: '🥇', difficulty: 9, category: 'engagement', name: n('업적 그랜드마스터','Achievement Grandmaster','実績グランドマスター','成就特级大师'), desc: n('40개 이상 업적 달성','Unlock 40 or more achievements','40個以上の実績を解除','解锁40个以上成就'), check: s => s.unlockedCount >= 40 },
  { id: 'E10', icon: '📅', difficulty: 8, category: 'engagement', name: n('한달 개근','Month Perfect','月皆勤','月度全勤'), desc: n('30일 연속 앱 실행','Open the app for 30 days in a row','アプリを30日連続起動','连续30天打开应用'), check: s => (s.flags?.appStreak || 0) >= 30 },
  { id: 'E11', icon: '💎', difficulty: 9, category: 'engagement', name: n('앱 100일','100 Days','アプリ100日','应用100天'), desc: n('앱을 100일 이상 사용','Use the app for 100+ days total','アプリを100日以上使用','累计使用应用100天'), check: s => (s.flags?.totalOpens || 0) >= 100 },
  { id: 'E12', icon: '👑', difficulty: 10, category: 'engagement', name: n('앱 200일','200 Days','アプリ200日','应用200天'), desc: n('앱을 200일 이상 사용','Use the app for 200+ days total','アプリを200日以上使用','累计使用应用200天'), check: s => (s.flags?.totalOpens || 0) >= 200 },
  // ── 추가 공개 업적 44개 (총 150개) ──
  // Streak +++
  { id: 'S10', icon: '💫', difficulty: 10, category: 'streak', name: n('60일의 여정','60-Day Journey','60日の旅','60日旅程'), desc: n('60일 연속 최소 1개 완료','60-day streak','60日連続完了','连续60天完成'), check: s => s.streak >= 60 },
  { id: 'S11', icon: '🌟', difficulty: 10, category: 'streak', name: n('90일의 의지','90-Day Will','90日の意志','90日意志力'), desc: n('90일 연속 최소 1개 완료','90-day streak','90日連続完了','连续90天完成'), check: s => s.streak >= 90 },
  // Completion +++
  { id: 'C12', icon: '🎗️', difficulty: 9, category: 'completion', name: n('300개 클럽','300 Club','300達成','300件成就'), desc: n('누적 300개 완료','300 total completions','累計300件完了','累计完成300件'), check: s => s.totalCompleted >= 300 },
  { id: 'C13', icon: '🌄', difficulty: 9, category: 'completion', name: n('새벽 50번','50 Dawns','夜明け50回','黎明50次'), desc: n('오전 9시 전 완료 50번 누적','50 completions before 9am','午前9時前50回完了','上午9点前累计完成50次'), check: s => s.earlyBird >= 50 },
  { id: 'C14', icon: '🌪️', difficulty: 10, category: 'completion', name: n('하루 25개','Daily 25','1日25件','每日25件'), desc: n('하루에 25개 이상 완료','Complete 25+ tasks in one day','1日に25件以上完了','一天完成25件以上'), check: s => s.todayCompleted >= 25 },
  { id: 'C15', icon: '🌙', difficulty: 7, category: 'completion', name: n('밤 30번','30 Nights','夜30回','夜晚30次'), desc: n('밤 11시 이후 30번 이상 완료','Complete 30+ tasks after 11pm','夜11時以降30回以上完了','晚上11点后完成30次以上'), check: s => s.nightOwl >= 30 },
  // Daily +++
  { id: 'D11', icon: '🌅', difficulty: 8, category: 'daily', name: n('새벽 30번','30 Dawns','夜明け30回','黎明30次'), desc: n('오전 9시 전 완료 30번 누적','30 completions before 9am','午前9時前30回完了','上午9点前累计完成30次'), check: s => s.earlyBird >= 30 },
  { id: 'D12', icon: '⚡', difficulty: 9, category: 'daily', name: n('스피드런 마스터','Speed Run Master','スピードランマスター','速通大师'), desc: n('당일 등록 후 1시간 내 완료 15회','15 tasks completed within 1 hour of adding','追加後1時間以内を15回達成','添加后1小时内完成15次'), check: s => s.speedRun >= 15 },
  { id: 'D13', icon: '🏅', difficulty: 9, category: 'daily', name: n('월요일 50개','Monday 50','月曜日50件','周一50件'), desc: n('월요일에 누적 50개 완료','Complete 50 tasks total on Mondays','月曜日に累計50件完了','周一累计完成50件'), check: s => s.mondayCompletions >= 50 },
  { id: 'D14', icon: '🎭', difficulty: 9, category: 'daily', name: n('태그 7종 하루','7-Tag Day','7タグ1日','一天7种标签'), desc: n('하루에 7가지 이상 다른 태그 완료','Complete tasks with 7+ different tags in a day','1日に7種類以上のタグ完了','一天完成7种以上不同标签'), check: s => s.todayTagVariety >= 7 },
  // Weekly +++
  { id: 'W9', icon: '🔥', difficulty: 10, category: 'weekly', name: n('이번 달 300개','Month 300','今月300件','本月300件'), desc: n('이번 달 300개 이상 완료','300+ completions this month','今月300件以上完了','本月完成300件以上'), check: s => s.monthCompleted >= 300 },
  { id: 'W10', icon: '💥', difficulty: 10, category: 'weekly', name: n('주간 100개','Weekly 100','週間100件','周100件'), desc: n('한 주에 100개 이상 완료','100+ completions in a week','1週間に100件以上完了','一周内完成100件以上'), check: s => s.weekCompleted >= 100 },
  { id: 'W11', icon: '🌸', difficulty: 9, category: 'weekly', name: n('평일 누적 100개','Weekday 100','平日累計100件','工作日累计100件'), desc: n('월~목 완료 합산 100개 이상','100+ completions on weekdays total','平日累計100件完了','工作日累计完成100件'), check: s => s.weekdayTotal >= 100 },
  // Recurrence +++
  { id: 'R9', icon: '🎡', difficulty: 10, category: 'recurrence', name: n('반복 500회','500 Reps','500回繰り返し','500次重复'), desc: n('반복 일정 누적 500회 완료','500 total recurring completions','繰り返し累計500回完了','累计完成500次重复任务'), check: s => s.completedRecurringCount >= 500 },
  { id: 'R10', icon: '🌀', difficulty: 10, category: 'recurrence', name: n('반복 10종','10-Type Routine','10種ルーティン','10种例行任务'), desc: n('서로 다른 반복 일정 10개 동시 활성화','10 different recurring tasks active','10種の繰り返しタスクを同時に','同时激活10种不同的重复任务'), check: s => s.activeRecurrences >= 10 },
  // Tags +++
  { id: 'T9', icon: '🗃️', difficulty: 8, category: 'tag', name: n('태그 25가지','Tag 25','タグ25種','25种标签'), desc: n('서로 다른 태그 25가지 사용','Use 25 different tags','25種類のタグを使用','使用25种不同标签'), check: s => s.uniqueTagCount >= 25 },
  { id: 'T10', icon: '🌐', difficulty: 9, category: 'tag', name: n('태그 40가지','Tag 40','タグ40種','40种标签'), desc: n('서로 다른 태그 40가지 사용','Use 40 different tags','40種類のタグを使用','使用40种不同标签'), check: s => s.uniqueTagCount >= 40 },
  { id: 'T11', icon: '🔮', difficulty: 10, category: 'tag', name: n('하루 10태그','10-Tag Day','10タグ1日','一天10种标签'), desc: n('하루에 10가지 이상 다른 태그 완료','Complete tasks with 10+ different tags in a day','1日に10種類以上タグ完了','一天完成10种以上不同标签'), check: s => s.todayTagVariety >= 10 },
  // Subtasks +++
  { id: 'ST8', icon: '🏗️', difficulty: 9, category: 'subtask', name: n('하위 300개','300 Subtasks','サブタスク300件','300个子任务'), desc: n('하위 태스크 누적 300개 완료','300 total subtask completions','サブタスク累計300件完了','累计完成300个子任务'), check: s => s.totalSubtasksCompleted >= 300 },
  { id: 'ST9', icon: '🧬', difficulty: 10, category: 'subtask', name: n('하위 400개','400 Subtasks','サブタスク400件','400个子任务'), desc: n('하위 태스크 누적 400개 완료','400 total subtask completions','サブタスク累計400件完了','累计完成400个子任务'), check: s => s.totalSubtasksCompleted >= 400 },
  { id: 'ST10', icon: '🔬', difficulty: 8, category: 'subtask', name: n('대형 계획 달성','Big Plan Done','大型計画達成','完成大型计划'), desc: n('하위 태스크 8개 이상인 할 일 완료','Complete a task with 8+ subtasks','8件以上サブタスクのタスクを完了','完成含8个以上子任务的任务'), check: s => s.completedBigPlan8 },
  // Priority +++
  { id: 'P9', icon: '🚒', difficulty: 9, category: 'priority', name: n('긴급 50개','Urgent 50','緊急50件','紧急50件'), desc: n('긴급 우선순위 50개 완료','Complete 50 urgent tasks','緊急優先度タスクを50件完了','完成50件紧急任务'), check: s => s.completedByPriority.urgent >= 50 },
  { id: 'P10', icon: '🎯', difficulty: 9, category: 'priority', name: n('높음 100개','High 100','高優先度100件','高优先100件'), desc: n('높음 우선순위 100개 완료','Complete 100 high-priority tasks','高優先度100件完了','完成100件高优先级任务'), check: s => s.completedByPriority.high >= 100 },
  { id: 'P11', icon: '⚖️', difficulty: 9, category: 'priority', name: n('균형의 달인','Balance Master','バランスの達人','平衡大师'), desc: n('각 우선순위 30개씩 완료','Complete 30 tasks at each priority level','各優先度30件完了','每种优先级完成30件'), check: s => s.completedByPriority.low >= 30 && s.completedByPriority.medium >= 30 && s.completedByPriority.high >= 30 && s.completedByPriority.urgent >= 30 },
  { id: 'P12', icon: '🧘', difficulty: 9, category: 'priority', name: n('낮음 100개','Low 100','低優先度100件','低优先100件'), desc: n('낮음 우선순위 100개 완료','Complete 100 low-priority tasks','低優先度100件完了','完成100件低优先级任务'), check: s => s.completedByPriority.low >= 100 },
  // AI +++
  { id: 'AI9', icon: '🤖', difficulty: 10, category: 'ai', name: n('AI 200개','AI 200','AI200件','AI200件'), desc: n('AI 입력으로 200개 할 일 생성','Create 200 tasks using AI input','AI入力で200件タスク作成','用AI输入创建200件任务'), check: s => (s.flags?.aiTasks || 0) >= 200 },
  { id: 'AI10', icon: '🎤', difficulty: 10, category: 'ai', name: n('음성 200개','Voice 200','音声200件','语音200件'), desc: n('음성 입력으로 200개 할 일 생성','Create 200 tasks using voice input','音声入力で200件タスク作成','用语音输入创建200件任务'), check: s => (s.flags?.voiceTasks || 0) >= 200 },
  { id: 'AI11', icon: '🧠', difficulty: 9, category: 'ai', name: n('AI 150개','AI 150','AI150件','AI150件'), desc: n('AI 입력으로 150개 할 일 생성','Create 150 tasks using AI input','AI入力で150件タスク作成','用AI输入创建150件任务'), check: s => (s.flags?.aiTasks || 0) >= 150 },
  // Calendar +++
  { id: 'CAL5', icon: '🗓️', difficulty: 7, category: 'calendar', name: n('캘린더 75개','Calendar 75','カレンダー75件','日历75件'), desc: n('캘린더 연동 할 일 75개 이상','75+ tasks synced with calendar','カレンダー連携75件以上','日历同步75件以上'), check: s => s.calSyncCount >= 75 },
  { id: 'CAL6', icon: '📅', difficulty: 9, category: 'calendar', name: n('캘린더 150개','Calendar 150','カレンダー150件','日历150件'), desc: n('캘린더 연동 할 일 150개 이상','150+ tasks synced with calendar','カレンダー連携150件以上','日历同步150件以上'), check: s => s.calSyncCount >= 150 },
  { id: 'CAL7', icon: '🔗', difficulty: 10, category: 'calendar', name: n('캘린더 200개','Calendar 200','カレンダー200件','日历200件'), desc: n('캘린더 연동 할 일 200개 이상','200+ tasks synced with calendar','カレンダー連携200件以上','日历同步200件以上'), check: s => s.calSyncCount >= 200 },
  // Notes +++
  { id: 'N6', icon: '📓', difficulty: 8, category: 'notes', name: n('노트 125개','Note 125','ノート125件','笔记125件'), desc: n('설명이 있는 할 일 125개 완료','Complete 125 tasks with descriptions','説明付きタスクを125件完了','完成125件带描述的任务'), check: s => s.completedWithDescription >= 125 },
  { id: 'N7', icon: '📜', difficulty: 9, category: 'notes', name: n('노트 150개','Note 150','ノート150件','笔记150件'), desc: n('설명이 있는 할 일 150개 완료','Complete 150 tasks with descriptions','説明付きタスクを150件完了','完成150件带描述的任务'), check: s => s.completedWithDescription >= 150 },
  { id: 'N8', icon: '📚', difficulty: 10, category: 'notes', name: n('노트 200개','Note 200','ノート200件','笔记200件'), desc: n('설명이 있는 할 일 200개 완료','Complete 200 tasks with descriptions','説明付きタスクを200件完了','完成200件带描述的任务'), check: s => s.completedWithDescription >= 200 },
  // Special +++
  { id: 'SP9', icon: '🎃', difficulty: 4, category: 'special', name: n('할로윈','Halloween','ハロウィン','万圣节'), desc: n('10월 31일에 할 일 완료','Complete a task on October 31st','10月31日にタスクを完了','在10月31日完成任务'), check: s => s.special?.halloween },
  { id: 'SP10', icon: '🌷', difficulty: 3, category: 'special', name: n('근로자의 날','Labor Day','労働者の日','劳动节'), desc: n('5월 1일에 할 일 완료','Complete a task on May 1st','5月1日にタスクを完了','在5月1日完成任务'), check: s => s.special?.laborDay },
  { id: 'SP11', icon: '🏛️', difficulty: 3, category: 'special', name: n('제헌절','Constitution Day','制憲節','制宪节'), desc: n('7월 17일에 할 일 완료','Complete a task on July 17th','7月17日にタスクを完了','在7月17日完成任务'), check: s => s.special?.constitutionDay },
  { id: 'SP12', icon: '🎊', difficulty: 4, category: 'special', name: n('한해의 마지막','Year\'s End','大晦日','年末'), desc: n('12월 31일에 할 일 완료','Complete a task on December 31st','12月31日にタスクを完了','在12月31日完成任务'), check: s => s.special?.dec31 },
  // Engagement +++
  { id: 'E13', icon: '💠', difficulty: 10, category: 'engagement', name: n('업적 50개','50 Achievements','実績50個','50个成就'), desc: n('50개 이상 업적 달성','Unlock 50 or more achievements','50個以上の実績を解除','解锁50个以上成就'), check: s => s.unlockedCount >= 50 },
  { id: 'E14', icon: '🔱', difficulty: 10, category: 'engagement', name: n('업적 75개','75 Achievements','実績75個','75个成就'), desc: n('75개 이상 업적 달성','Unlock 75 or more achievements','75個以上の実績を解除','解锁75个以上成就'), check: s => s.unlockedCount >= 75 },
  { id: 'E15', icon: '📱', difficulty: 9, category: 'engagement', name: n('앱 150일','150 Days','アプリ150日','应用150天'), desc: n('앱을 150일 이상 사용','Use the app for 150+ days total','アプリを150日以上使用','累计使用应用150天'), check: s => (s.flags?.totalOpens || 0) >= 150 },
  { id: 'E16', icon: '🌍', difficulty: 10, category: 'engagement', name: n('앱 300일','300 Days','アプリ300日','应用300天'), desc: n('앱을 300일 이상 사용','Use the app for 300+ days total','アプリを300日以上使用','累计使用应用300天'), check: s => (s.flags?.totalOpens || 0) >= 300 },
  { id: 'E17', icon: '🎨', difficulty: 2, category: 'engagement', name: n('테마 변경','Theme Changed','テーマ変更','更改主题'), desc: n('앱 테마를 처음 변경','Change the app theme for the first time','アプリのテーマを初めて変更','首次更改应用主题'), check: s => s.flags?.themeChanged },
  { id: 'E18', icon: '🌐', difficulty: 2, category: 'engagement', name: n('언어 변경','Language Changed','言語変更','更改语言'), desc: n('앱 언어를 처음 변경','Change the app language for the first time','アプリの言語を初めて変更','首次更改应用语言'), check: s => s.flags?.languageChanged },
  // ── 비공개 업적 50개 (hidden: true) ──
  { id: 'X1', icon: '🌋', hidden: true, brioReward: 40, difficulty: 10, category: 'streak', name: n('200일의 용암','Lava Streak','200日の溶岩','200日熔岩'), desc: n('200일 연속 최소 1개 완료','200-day streak','200日連続完了','连续200天完成'), check: s => s.streak >= 200 },
  { id: 'X2', icon: '🌞', hidden: true, brioReward: 50, difficulty: 10, category: 'streak', name: n('1년의 기적','Year Miracle','1年の奇跡','一年奇迹'), desc: n('365일 연속 최소 1개 완료','365-day streak','365日連続完了','连续365天完成'), check: s => s.streak >= 365 },
  { id: 'X3', icon: '🌅', hidden: true, brioReward: 30, difficulty: 9, category: 'daily', name: n('새벽의 전사','Dawn Warrior','夜明けの戦士','黎明战士'), desc: n('새벽 5시 전 완료 30번 누적','30 completions before 5am','午前5時前に30回完了','凌晨5点前累计完成30次'), check: s => (s.flags?.dawn5am || 0) >= 30 },
  { id: 'X4', icon: '🏔️', hidden: true, brioReward: 40, difficulty: 10, category: 'completion', name: n('5000의 산','5000 Peak','5000の山','5000之山'), desc: n('누적 5000개 완료','5000 total completions','累計5000件完了','累计完成5000件'), check: s => s.totalCompleted >= 5000 },
  { id: 'X5', icon: '🌌', hidden: true, brioReward: 50, difficulty: 10, category: 'completion', name: n('만 개의 별','10K Stars','1万の星','万颗星'), desc: n('누적 10000개 완료','10000 total completions','累計10000件完了','累计完成10000件'), check: s => s.totalCompleted >= 10000 },
  { id: 'X6', icon: '🌪️', hidden: true, brioReward: 35, difficulty: 10, category: 'daily', name: n('하루 50개','Daily 50','1日50件','每日50件'), desc: n('하루에 50개 이상 완료','Complete 50+ tasks in one day','1日に50件以上完了','一天完成50件以上'), check: s => s.todayCompleted >= 50 },
  { id: 'X7', icon: '🎄', hidden: true, brioReward: 30, difficulty: 5, category: 'special', name: n('크리스마스의 기적','Christmas Miracle','クリスマスの奇跡','圣诞奇迹'), desc: n('12월 25일에 할 일 완료 (비밀 보상)','Complete a task on December 25th','12月25日にタスクを完了','在12月25日完成任务'), check: s => s.special?.christmas },
  { id: 'X8', icon: '🎆', hidden: true, brioReward: 30, difficulty: 5, category: 'special', name: n('새해 첫 할 일','New Year First','新年初タスク','新年第一件'), desc: n('1월 1일에 할 일 완료 (비밀 보상)','Complete a task on January 1st','1月1日にタスクを完了','在1月1日完成任务'), check: s => s.special?.newYear },
  { id: 'X9', icon: '💘', hidden: true, brioReward: 30, difficulty: 5, category: 'special', name: n('발렌타인 계획자','Valentine Planner','バレンタイン計画者','情人节规划者'), desc: n('2월 14일에 할 일 완료 (비밀 보상)','Complete a task on February 14th','2月14日にタスクを完了','在2月14日完成任务'), check: s => s.special?.valentine },
  { id: 'X10', icon: '🎃', hidden: true, brioReward: 30, difficulty: 5, category: 'special', name: n('할로윈 완료','Halloween Done','ハロウィン完了','万圣节完成'), desc: n('10월 31일에 할 일 완료 (비밀 보상)','Complete a task on October 31st','10月31日にタスクを完了','在10月31日完成任务'), check: s => s.special?.halloween },
  { id: 'X11', icon: '⚡', hidden: true, brioReward: 30, difficulty: 9, category: 'daily', name: n('번개 완료','Lightning Done','雷の完了','闪电完成'), desc: n('등록 후 5분 내 완료 10회','10 tasks completed within 5 minutes of adding','追加後5分以内に10回完了','添加后5分钟内完成10次'), check: s => (s.flags?.lightning5m || 0) >= 10 },
  { id: 'X12', icon: '🎯', hidden: true, brioReward: 35, difficulty: 10, category: 'daily', name: n('저격수','Sniper','狙撃手','狙击手'), desc: n('등록 후 1분 내 완료 5회','5 tasks completed within 1 minute of adding','追加後1分以内に5回完了','添加后1分钟内完成5次'), check: s => (s.flags?.sniper1m || 0) >= 5 },
  { id: 'X13', icon: '🌙', hidden: true, brioReward: 30, difficulty: 8, category: 'special', name: n('자정의 전사','Midnight Warrior','深夜の戦士','午夜战士'), desc: n('00:00~00:05 사이에 할 일 완료 5회','5 tasks completed between 00:00-00:05','00:00〜00:05の間に5回完了','在00:00-00:05之间完成5次'), check: s => (s.flags?.midnight5min || 0) >= 5 },
  { id: 'X14', icon: '🎨', hidden: true, brioReward: 35, difficulty: 8, category: 'tag', name: n('태그 마스터 X','Tag Master X','タグマスターX','标签大师X'), desc: n('서로 다른 태그 20가지 사용 (비밀 보상)','Use 20 different tags (secret bonus)','20種類のタグを使用','使用20种不同标签'), check: s => s.uniqueTagCount >= 20 },
  { id: 'X15', icon: '👑', hidden: true, brioReward: 40, difficulty: 10, category: 'priority', name: n('우선순위 황제','Priority Emperor','優先度皇帝','优先级皇帝'), desc: n('4가지 우선순위 각 50개씩 완료','Complete 50 tasks at each priority level','各優先度50件完了','每种优先级完成50件'), check: s => s.completedByPriority.low >= 50 && s.completedByPriority.medium >= 50 && s.completedByPriority.high >= 50 && s.completedByPriority.urgent >= 50 },
  { id: 'X16', icon: '📅', hidden: true, brioReward: 30, difficulty: 7, category: 'weekly', name: n('모든 요일 정복','All Weekdays','全曜日征服','征服所有工作日'), desc: n('월~일 모든 요일에 최소 1개씩 완료','Complete at least 1 task on every day of the week','月〜日全曜日に1件以上完了','一周每天都完成至少1件'), check: s => (s.flags?.allWeekdays || 0) >= 7 },
  { id: 'X17', icon: '🕐', hidden: true, brioReward: 45, difficulty: 10, category: 'daily', name: n('24시간 전사','24-Hour Warrior','24時間戦士','24小时战士'), desc: n('하루 0~23시 모든 시간대에 완료 기록','Complete tasks in all 24 hours of the day','0〜23時の全時間帯に完了記録','在一天的所有24个小时都完成任务'), check: s => (s.flags?.allHours || 0) >= 24 },
  { id: 'X18', icon: '🔔', hidden: true, brioReward: 30, difficulty: 7, category: 'special', name: n('정각 챌린저','On-The-Hour','正刻チャレンジャー','整点挑战者'), desc: n('정각(분=0)에 할 일 완료 7회','Complete 7 tasks exactly on the hour','正時(分=0)に7回完了','在整点完成7次任务'), check: s => (s.flags?.onTheHour || 0) >= 7 },
  { id: 'X19', icon: '🤖', hidden: true, brioReward: 35, difficulty: 9, category: 'ai', name: n('AI 백 개 X','AI 100 X','AI百件X','AI100件X'), desc: n('AI 입력으로 100개 할 일 생성 (비밀 보상)','Create 100 tasks using AI (secret bonus)','AI入力で100件タスク作成','用AI输入创建100件任务'), check: s => (s.flags?.aiTasks || 0) >= 100 },
  { id: 'X20', icon: '🎙️', hidden: true, brioReward: 35, difficulty: 8, category: 'ai', name: n('음성 오십 X','Voice 50 X','音声50件X','语音50件X'), desc: n('음성 입력으로 50개 할 일 생성 (비밀 보상)','Create 50 tasks using voice (secret bonus)','音声入力で50件タスク作成','用语音输入创建50件任务'), check: s => (s.flags?.voiceTasks || 0) >= 50 },
  { id: 'X21', icon: '🧬', hidden: true, brioReward: 30, difficulty: 8, category: 'ai', name: n('AI+음성 콤보','AI+Voice Combo','AI+音声コンボ','AI+语音组合'), desc: n('하루에 AI와 음성 각각 5회 이상 사용','Use both AI and voice 5+ times each in one day','1日にAIと音声それぞれ5回以上使用','一天内AI和语音各使用5次以上'), check: s => s.flags?.aiAndVoiceDay },
  { id: 'X22', icon: '📅', hidden: true, brioReward: 35, difficulty: 9, category: 'calendar', name: n('캘린더 백 개 X','Calendar 100 X','カレンダー100件X','日历100件X'), desc: n('Google 캘린더 이벤트 100개 동기화 (비밀 보상)','100 tasks synced with calendar (secret bonus)','カレンダー連携100件','日历同步100件'), check: s => s.calSyncCount >= 100 },
  { id: 'X23', icon: '🔗', hidden: true, brioReward: 30, difficulty: 8, category: 'calendar', name: n('캘린더 한 달','Calendar Month','カレンダー1ヶ月','日历一个月'), desc: n('30일 동안 캘린더 동기화 상태 유지','Keep calendar sync active for 30 days','30日間カレンダー連携を維持','保持日历同步30天'), check: s => s.flags?.calendarMonth30 },
  { id: 'X24', icon: '📝', hidden: true, brioReward: 40, difficulty: 10, category: 'subtask', name: n('하위 태스크 500','500 Subtasks','サブタスク500件','500个子任务'), desc: n('하위 태스크 누적 500개 완료','500 total subtask completions','サブタスク累計500件完了','累计完成500个子任务'), check: s => s.totalSubtasksCompleted >= 500 },
  { id: 'X25', icon: '🧩', hidden: true, brioReward: 35, difficulty: 10, category: 'subtask', name: n('초대형 계획','Mega Plan','超大型計画','超大型计划'), desc: n('하위 태스크 20개 이상인 할 일 완료','Complete a task with 20+ subtasks','サブタスク20件以上のタスクを完了','完成含20个以上子任务的任务'), check: s => s.flags?.bigPlan20 },
  { id: 'X26', icon: '📦', hidden: true, brioReward: 35, difficulty: 9, category: 'completion', name: n('할 일 천 개 등록','1000 Registered','タスク千件登録','登记1000件'), desc: n('총 등록 할 일 수 1000개 달성','Register 1000 total tasks (completed or not)','合計1000件タスクを登録','累计登记1000件任务'), check: s => s.totalRegistered >= 1000 },
  { id: 'X27', icon: '🔥', hidden: true, brioReward: 45, difficulty: 10, category: 'weekly', name: n('월간 500','Month 500','月間500件','月度500件'), desc: n('한 달에 500개 이상 완료','500+ completions in a month','1ヶ月に500件以上完了','一个月内完成500件以上'), check: s => s.monthCompleted >= 500 },
  { id: 'X28', icon: '💥', hidden: true, brioReward: 35, difficulty: 9, category: 'daily', name: n('24시간 20개','24h Burst','24時間20件','24小时20件'), desc: n('24시간 안에 20개 완료','Complete 20 tasks within 24 hours','24時間以内に20件完了','24小时内完成20件'), check: s => s.flags?.burst24h20 },
  { id: 'X29', icon: '🌟', hidden: true, brioReward: 50, difficulty: 10, category: 'streak', name: n('100일 × 평균 5개','100 Days × 5 Avg','100日×5件平均','100天×平均5件'), desc: n('100일 연속 + 하루 평균 5개 이상','100-day streak AND 5+ tasks/day average','100日連続＋1日平均5件以上','连续100天且每天平均5件以上'), check: s => s.streak >= 100 && s.flags?.avg5perDay100 },
  { id: 'X30', icon: '☀️', hidden: true, brioReward: 40, difficulty: 10, category: 'daily', name: n('50일 얼리버드','50-Day Early Bird','50日アーリーバード','50天早起鸟'), desc: n('50일 연속 오전 9시 전 완료','50 days in a row completing tasks before 9am','50日連続午前9時前完了','连续50天在上午9点前完成任务'), check: s => s.flags?.earlyBirdStreak50 },
  { id: 'X31', icon: '💯', hidden: true, brioReward: 45, difficulty: 10, category: 'weekly', name: n('완벽한 한 달','Perfect Month','完璧な1ヶ月','完美一个月'), desc: n('한 달 동안 등록한 모든 할 일 완료','Complete every task registered in a month','1ヶ月間の全タスクを完了','完成一个月内登记的所有任务'), check: s => s.flags?.perfectMonth },
  { id: 'X32', icon: '🏆', hidden: true, brioReward: 40, difficulty: 10, category: 'weekly', name: n('3달 연속 100+','3 Months 100+','3ヶ月連続100+','连续3月100+'), desc: n('3개월 연속 월별 100개 이상 완료','100+ completions for 3 consecutive months','3ヶ月連続で月100件以上完了','连续3个月每月完成100件以上'), check: s => s.flags?.month100x3 },
  { id: 'X33', icon: '🦉', hidden: true, brioReward: 30, difficulty: 8, category: 'daily', name: n('올빼미 100','Night Owl 100','夜型100','夜猫子100'), desc: n('밤 11시 이후 할 일 100개 완료','Complete 100+ tasks after 11pm','夜11時以降100件完了','晚上11点后完成100件'), check: s => s.nightOwl >= 100 },
  { id: 'X34', icon: '🌃', hidden: true, brioReward: 35, difficulty: 9, category: 'daily', name: n('30일 밤샘','30 Night Streak','30日夜更かし','30天夜间连续'), desc: n('30일 연속 밤 11시 이후 완료','Complete tasks after 11pm for 30 days in a row','30日連続夜11時以降完了','连续30天在晚上11点后完成任务'), check: s => s.flags?.nightStreak30 },
  { id: 'X35', icon: '🎖️', hidden: true, brioReward: 50, difficulty: 10, category: 'priority', name: n('우선순위 전설','Priority Legend','優先度の伝説','优先级传奇'), desc: n('모든 우선순위 각 100개씩 완료','Complete 100 tasks at each priority level','各優先度100件完了','每种优先级完成100件'), check: s => s.completedByPriority.low >= 100 && s.completedByPriority.medium >= 100 && s.completedByPriority.high >= 100 && s.completedByPriority.urgent >= 100 },
  { id: 'X36', icon: '🚨', hidden: true, brioReward: 35, difficulty: 9, category: 'priority', name: n('긴급 하루 10','Urgent Day 10','緊急1日10件','紧急一天10件'), desc: n('하루에 긴급 할 일 10개 완료','Complete 10 urgent tasks in one day','1日に緊急タスク10件完了','一天完成10件紧急任务'), check: s => s.flags?.urgentDay10 },
  { id: 'X37', icon: '🔄', hidden: true, brioReward: 40, difficulty: 10, category: 'recurrence', name: n('반복 100회','100 Reps X','繰り返し100回X','100次重复X'), desc: n('같은 반복 일정 100회 완료','Complete the same recurring task 100 times','同じ繰り返しタスクを100回完了','同一重复任务完成100次'), check: s => s.flags?.sameRecurring100 },
  { id: 'X38', icon: '🌀', hidden: true, brioReward: 45, difficulty: 10, category: 'recurrence', name: n('반복 오중주','Recurring Quintet','繰り返し五重奏','重复五重奏'), desc: n('5가지 다른 반복 일정 각 30회씩 완료','Complete 5 different recurring tasks 30 times each','5種の繰り返しタスクをそれぞれ30回完了','5种不同重复任务各完成30次'), check: s => s.flags?.multiRecurring5x30 },
  { id: 'X39', icon: '📆', hidden: true, brioReward: 40, difficulty: 10, category: 'engagement', name: n('365일 사용','365 Days Used','365日使用','使用365天'), desc: n('앱 사용 총 365일 (비연속 허용)','Use the app for 365 total days','アプリを累計365日使用','累计使用应用365天'), check: s => (s.flags?.totalOpens || 0) >= 365 },
  { id: 'X40', icon: '📱', hidden: true, brioReward: 30, difficulty: 9, category: 'engagement', name: n('천 번 실행','1000 Launches','千回起動','1000次启动'), desc: n('앱 실행 1000회','Launch the app 1000 times','アプリを1000回起動','应用启动1000次'), check: s => (s.flags?.totalOpens || 0) >= 1000 },
  { id: 'X41', icon: '⏰', hidden: true, brioReward: 30, difficulty: 8, category: 'special', name: n('자정 완료','Exact Midnight','深夜0時完了','午夜整点完成'), desc: n('정확히 00:00에 할 일 완료','Complete a task exactly at midnight (00:00)','正確に00:00にタスクを完了','在00:00整点完成任务'), check: s => s.flags?.exactMidnight },
  { id: 'X42', icon: '🎊', hidden: true, brioReward: 30, difficulty: 5, category: 'special', name: n('한해의 마지막 X','Year\'s End X','大晦日X','年末X'), desc: n('12월 31일에 할 일 완료 (비밀 보상)','Complete a task on December 31st (secret bonus)','12月31日にタスクを完了','在12月31日完成任务'), check: s => s.special?.dec31 },
  { id: 'X43', icon: '🌸', hidden: true, brioReward: 40, difficulty: 10, category: 'special', name: n('사계절 전사','Four Seasons','四季の戦士','四季战士'), desc: n('봄/여름/가을/겨울 각각 50개 완료','Complete 50 tasks in each of the 4 seasons','春夏秋冬それぞれ50件完了','在四个季节各完成50件'), check: s => s.flags?.allSeasons50 },
  { id: 'X44', icon: '📺', hidden: true, brioReward: 30, difficulty: 7, category: 'engagement', name: n('광고 애청자','Ad Watcher','広告愛好者','广告爱好者'), desc: n('광고 시청으로 브리오 20회 충전','Recharge brio by watching 20 ads','広告視聴でブリオ20回チャージ','通过看广告充值20次'), check: s => (s.flags?.adsWatched || 0) >= 20 },
  { id: 'X45', icon: '🏅', hidden: true, brioReward: 30, difficulty: 8, category: 'engagement', name: n('업적 부자','Brio Rich','実績持ち','成就富翁'), desc: n('업적으로 브리오 200개 획득','Earn 200 brio from achievements','実績からブリオを200個獲得','通过成就获得200个能量'), check: s => (s.flags?.brioFromAchievements || 0) >= 200 },
  { id: 'X46', icon: '♻️', hidden: true, brioReward: 35, difficulty: 7, category: 'engagement', name: n('재충전 달인','Recharge Master','再充電の達人','再充值达人'), desc: n('브리오를 0으로 소진 후 충전 10회','Recharge from zero brio 10 times','ブリオを0にした後10回チャージ','将能量耗尽后充值10次'), check: s => (s.flags?.brioEmptied || 0) >= 10 },
  { id: 'X47', icon: '🌈', hidden: true, brioReward: 40, difficulty: 10, category: 'engagement', name: n('업적 컬렉터 120','Achievement Collector 120','実績コレクター120','成就收集者120'), desc: n('공개 업적 120개 달성','Unlock 120 public achievements','公開実績120個を解除','解锁120个公开成就'), check: s => s.unlockedPublicCount >= 120 },
  { id: 'X48', icon: '👑', hidden: true, brioReward: 50, difficulty: 10, category: 'engagement', name: n('업적 완파','Achievement Legend','実績完全制覇','成就传说'), desc: n('공개 업적 150개 전부 달성','Unlock all 150 public achievements','公開実績150個を全解除','解锁所有150个公开成就'), check: s => s.unlockedPublicCount >= 150 },
  { id: 'X49', icon: '🔮', hidden: true, brioReward: 30, difficulty: 5, category: 'engagement', name: n('비밀의 시작','Secret Start','秘密の始まり','秘密的开始'), desc: n('첫 비밀 업적 달성','Unlock your first secret achievement','初めての秘密実績を解除','解锁第一个秘密成就'), check: s => (s.unlockedSecretCount || 0) >= 1 },
  { id: 'X50', icon: '💎', hidden: true, brioReward: 50, difficulty: 10, category: 'engagement', name: n('비밀 전도사','Secret Evangelist','秘密の伝道師','秘密传道士'), desc: n('비밀 업적 10개 달성','Unlock 10 secret achievements','秘密実績を10個解除','解锁10个秘密成就'), check: s => (s.unlockedSecretCount || 0) >= 10 },
]

// 업적 보상 재조정 — 광고 수익 균형화 (구: 1→1,2→2,...,10→30)
const ACHIEVEMENT_BRIO_REWARD = { 1: 1, 2: 1, 3: 2, 4: 2, 5: 3, 6: 4, 7: 5, 8: 7, 9: 10, 10: 15 }
const ACHIEVEMENT_REWARD_CAP = 15 // 숨겨진 업적 포함 단일 보상 상한

export function useAchievements({ todos, todayStr, weeklyPulse, user, chargeBrio }) {
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
    let special = { newYear: false, christmas: false, spring: false, aprilFools: false, liberationDay: false, hangeulDay: false, valentine: false, childrensDay: false, halloween: false, laborDay: false, constitutionDay: false, dec31: false }
    let completedRecurringCount = 0, recurringStreak = 0
    const nowMonth = new Date().getMonth()
    
    todos.forEach(t => {
      if (t.googleEventId) calSyncCount++
      if (t.completed) {
        if (t.date.endsWith('-01-01')) special.newYear = true
        if (t.date.endsWith('-12-25')) special.christmas = true
        if (t.date.endsWith('-03-01')) special.spring = true
        if (t.date.endsWith('-04-01')) special.aprilFools = true
        if (t.date.endsWith('-08-15')) special.liberationDay = true
        if (t.date.endsWith('-10-09')) special.hangeulDay = true
        if (t.date.endsWith('-02-14')) special.valentine = true
        if (t.date.endsWith('-05-05')) special.childrensDay = true
        if (t.date.endsWith('-10-31')) special.halloween = true
        if (t.date.endsWith('-05-01')) special.laborDay = true
        if (t.date.endsWith('-07-17')) special.constitutionDay = true
        if (t.date.endsWith('-12-31')) special.dec31 = true
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
    const completedBigPlan8 = todos.some(t => t.completed && (t.subtasks?.filter(s => s.completed).length || 0) >= 8)
    const totalRegistered = todos.length
    const weekdayTotal = todos.filter(t => t.completed && t.completedAt && (() => { const d = new Date(t.completedAt); return d.getDay() > 0 && d.getDay() < 6 })()).length
    const perfectWeek = weeklyPulse?.length >= 7 && weeklyPulse.every(d => d.completed > 0)
    
    let weekdayWarrior = false
    if (weeklyPulse && weeklyPulse.length >= 7) {
      weekdayWarrior = true
      for (let i=0; i<7; i++) {
        const day = new Date(weeklyPulse[i].date).getDay()
        if (day > 0 && day < 6 && weeklyPulse[i].completed === 0) weekdayWarrior = false
      }
    }

    let flags = {}
    try { flags = JSON.parse(localStorage.getItem('briodo_engagement_flags') || '{}') } catch(e){}

    return {
      streak, totalCompleted, todayCompleted, todayActive, todayTotal,
      uniqueTagCount, completedByPriority, completedWithDescription,
      totalSubtasksCompleted, completedBigSubtaskTodo, completedPerfectSubtaskTodo,
      hasRecurrence, activeRecurrences, todayTagVariety, weekCompleted,
      earlyBird, nightOwl, speedRun, mondayCompletions, monthCompleted,
      weekendFocus, weekdayWarrior, calendarUsed, calendarMaintained,
      perfectWeek, calSyncCount,
      special, completedRecurringCount, recurringStreak, flags,
      completedBigPlan8, totalRegistered, weekdayTotal,
      unlockedCount: 0, unlockedPublicCount: 0, unlockedSecretCount: 0,
    }
  }, [todos, todayStr, weeklyPulse])

  const [persistedUnlocked, setPersistedUnlocked] = useState(() => {
    return new Set(JSON.parse(localStorage.getItem('briodo_unlocked_ids') || '[]'))
  })

  // Load from Firestore on login
  useEffect(() => {
    if (!user?.uid) return
    const syncFirestore = async () => {
      try {
        const docRef = doc(db, 'userSettings', user.uid)
        const snap = await getDoc(docRef)
        if (snap.exists()) {
          const data = snap.data()
          const remoteUnlocks = data.unlockedIds || []
          const remoteFlags = data.engagementFlags || {}
          
          const localFlags = JSON.parse(localStorage.getItem('briodo_engagement_flags') || '{}')
          const mergedFlags = { ...remoteFlags, ...localFlags }
          for (const k in remoteFlags) {
            if (typeof remoteFlags[k] === 'number') {
              mergedFlags[k] = Math.max(remoteFlags[k], localFlags[k] || 0)
            }
          }
          localStorage.setItem('briodo_engagement_flags', JSON.stringify(mergedFlags))
          
          setPersistedUnlocked(prev => {
            const next = new Set(prev)
            remoteUnlocks.forEach(id => next.add(id))
            localStorage.setItem('briodo_unlocked_ids', JSON.stringify([...next]))
            return next
          })
        }
      } catch (e) { console.error('Achievement sync error:', e) }
    }
    syncFirestore()
  }, [user?.uid])

  const computedUnlocked = useMemo(() => {
    const metaIds = ['E1','E6','E7','E8','E9','E13','E14','X47','X48','X49','X50']
    const firstPass = ACHIEVEMENT_DEFS.filter(a => {
      if (metaIds.includes(a.id)) return false
      try { return a.check(stats) } catch { return false }
    })
    const unlockedPublicCount = firstPass.filter(a => !a.hidden).length
    const unlockedSecretCount = firstPass.filter(a => a.hidden).length
    const statsWithCount = { ...stats, unlockedCount: unlockedPublicCount, unlockedPublicCount, unlockedSecretCount }
    return new Set(
      ACHIEVEMENT_DEFS.filter(a => { try { return a.check(statsWithCount) } catch { return false } }).map(a => a.id)
    )
  }, [stats])

  const unlockedIds = useMemo(() => {
    return new Set([...persistedUnlocked, ...computedUnlocked])
  }, [persistedUnlocked, computedUnlocked])

  // Detect newly unlocked via computed stats
  useEffect(() => {
    const newOnes = [...computedUnlocked].filter(id => !persistedUnlocked.has(id))
    if (newOnes.length > 0) {
      const nextPersisted = new Set([...persistedUnlocked, ...newOnes])
      setPersistedUnlocked(nextPersisted)
      localStorage.setItem('briodo_unlocked_ids', JSON.stringify([...nextPersisted]))
      
      const newAchs = newOnes.map(id => ACHIEVEMENT_DEFS.find(a => a.id === id)).filter(Boolean)
      setNotifications(prev => [...prev, ...newAchs])
      setUnlockQueue(prev => [...prev, ...newAchs])

      // 브리오 보상 지급
      const totalReward = newAchs.reduce((sum, a) => {
        const base = a.brioReward ?? ACHIEVEMENT_BRIO_REWARD[a.difficulty] ?? 0
        return sum + Math.min(base, ACHIEVEMENT_REWARD_CAP)
      }, 0)
      if (totalReward > 0) {
        if (chargeBrio) chargeBrio(totalReward)
        try {
          const flags = JSON.parse(localStorage.getItem('briodo_engagement_flags') || '{}')
          flags.brioFromAchievements = (flags.brioFromAchievements || 0) + totalReward
          localStorage.setItem('briodo_engagement_flags', JSON.stringify(flags))
        } catch (e) {}
      }

      if (user?.uid) {
        setDoc(doc(db, 'userSettings', user.uid), {
          unlockedIds: [...nextPersisted],
          engagementFlags: JSON.parse(localStorage.getItem('briodo_engagement_flags') || '{}')
        }, { merge: true }).catch(console.error)
      }
    }
  }, [computedUnlocked, persistedUnlocked, user?.uid])

  useEffect(() => {
    if (!currentUnlock && unlockQueue.length > 0) {
      setCurrentUnlock(unlockQueue[0])
      setUnlockQueue(prev => prev.slice(1))
    }
  }, [unlockQueue, currentUnlock])

  const unlockedSortedByDifficulty = useMemo(() =>
    ACHIEVEMENT_DEFS.filter(a => !a.hidden && unlockedIds.has(a.id)).sort((a, b) => b.difficulty - a.difficulty),
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
    const flags = JSON.parse(localStorage.getItem('briodo_engagement_flags') || '{}')
    if (increment) {
      flags[flagName] = (flags[flagName] || 0) + 1
    } else {
      flags[flagName] = true
    }
    localStorage.setItem('briodo_engagement_flags', JSON.stringify(flags))
  } catch (e) {
    console.error('Failed to track engagement:', e)
  }
}
