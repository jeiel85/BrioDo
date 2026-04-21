import { useState, useCallback } from 'react'
import { functions } from '../firebase'
import { httpsCallable } from 'firebase/functions'
import { buildNudgePrompt } from '../utils/helpers'
import { maskPII } from '../utils/piiMask'

const AI_MODELS = [
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash-8b',
  'gemini-1.5-flash',
]

const generateWithFallback = async (prompt) => {
  const generateGeminiContent = httpsCallable(functions, 'generateGeminiContent')
  for (const model of AI_MODELS) {
    try {
      const response = await generateGeminiContent({ model, prompt })
      if (response?.data?.text) return response.data.text
    } catch (e) {
      console.warn(`[Briefing AI] ${model} failed:`, e?.message || String(e))
    }
  }
  return null
}

function buildMorningPrompt(todos, lang) {
  const taskList = todos.map(t => {
    let line = `- ${maskPII(t.text)}`
    if (t.time) line += ` (${t.time})`
    if (t.priority === 'high' || t.priority === 'urgent') line += ' [!]'
    if (t.tags?.length) line += ` #${t.tags.join(' #')}`
    return line
  }).join('\n')

  const count = todos.length

  if (lang === 'ko') {
    return `당신은 할 일 관리 앱의 AI 비서입니다. 사용자의 오늘 일정을 보고 아침 브리핑을 작성하세요.

오늘 일정 (${count}건):
${taskList || '(없음)'}

다음 형식으로 간결하게 작성하세요 (마크다운 금지, 순수 텍스트만):
1. 인사 (한 줄)
2. 오늘 일정 요약 (핵심만 2-3줄)
3. 우선순위 높은 항목이 있으면 강조
4. 응원 메시지 (한 줄)

전체 5-8줄 이내로 작성.`
  }
  if (lang === 'ja') {
    return `あなはタスク管理アプリのAIアシスタントです。今日の予定を見て朝のブリーフィングを作成してください。

今日の予定 (${count}件):
${taskList || '(なし)'}

以下の形式で簡潔に作成（マークダウン禁止、テキストのみ）:
1. 挨拶（一行）
2. 今日の予定要約（2-3行）
3. 優先度の高い項目があれば強調
4. 応援メッセージ（一行）

全体5-8行以内。`
  }
  if (lang === 'zh') {
    return `你是任务管理应用的AI助手。请查看今天的日程并编写早间简报。

今日日程 (${count}项):
${taskList || '(无)'}

请简洁地按以下格式编写（禁用markdown，纯文本）:
1. 问候（一行）
2. 今日日程摘要（2-3行）
3. 如有高优先级项目请强调
4. 鼓励语（一行）

总共5-8行以内。`
  }
  // English default
  return `You are an AI assistant for a task management app. Review today's schedule and write a morning briefing.

Today's tasks (${count}):
${taskList || '(none)'}

Write concisely in this format (no markdown, plain text only):
1. Greeting (one line)
2. Today's schedule summary (2-3 lines)
3. Highlight high-priority items if any
4. Motivational message (one line)

Keep it within 5-8 lines total.`
}

function buildEveningPrompt(todos, lang) {
  const completed = todos.filter(t => t.completed)
  const remaining = todos.filter(t => !t.completed)
  const completedList = completed.map(t => `- ${maskPII(t.text)}`).join('\n')
  const remainingList = remaining.map(t => `- ${maskPII(t.text)}`).join('\n')
  const rate = todos.length > 0 ? Math.round((completed.length / todos.length) * 100) : 0

  if (lang === 'ko') {
    return `당신은 할 일 관리 앱의 AI 비서입니다. 사용자의 오늘 하루를 돌아보는 저녁 브리핑을 작성하세요.

완료한 일 (${completed.length}건):
${completedList || '(없음)'}

미완료 (${remaining.length}건):
${remainingList || '(없음)'}

완료율: ${rate}%

다음 형식으로 간결하게 작성하세요 (마크다운 금지, 순수 텍스트만):
1. 하루 마무리 인사 (한 줄)
2. 완료 현황 요약 (2-3줄)
3. 미완료 항목이 있으면 내일로 미루기 제안
4. 격려/칭찬 메시지 (한 줄)

전체 5-8줄 이내로 작성.`
  }
  if (lang === 'ja') {
    return `あなたはタスク管理アプリのAIアシスタントです。今日一日を振り返る夜のブリーフィングを作成してください。

完了したタスク (${completed.length}件):
${completedList || '(なし)'}

未完了 (${remaining.length}件):
${remainingList || '(なし)'}

完了率: ${rate}%

以下の形式で簡潔に作成（マークダウン禁止、テキストのみ）:
1. 一日の終わりの挨拶（一行）
2. 完了状況の要約（2-3行）
3. 未完了項目があれば明日への提案
4. 励ましのメッセージ（一行）

全体5-8行以内。`
  }
  if (lang === 'zh') {
    return `你是任务管理应用的AI助手。请回顾今天并编写晚间简报。

已完成 (${completed.length}项):
${completedList || '(无)'}

未完成 (${remaining.length}项):
${remainingList || '(无)'}

完成率: ${rate}%

请简洁地按以下格式编写（禁用markdown，纯文本）:
1. 晚间问候（一行）
2. 完成情况摘要（2-3行）
3. 如有未完成项目建议推迟到明天
4. 鼓励语（一行）

总共5-8行以内。`
  }
  return `You are an AI assistant for a task management app. Review today and write an evening briefing.

Completed (${completed.length}):
${completedList || '(none)'}

Remaining (${remaining.length}):
${remainingList || '(none)'}

Completion rate: ${rate}%

Write concisely in this format (no markdown, plain text only):
1. Evening greeting (one line)
2. Completion summary (2-3 lines)
3. Suggest postponing remaining items if any
4. Encouraging message (one line)

Keep it within 5-8 lines total.`
}

export function useBriefing() {
  const [briefingText, setBriefingText] = useState('')
  const [briefingLoading, setBriefingLoading] = useState(false)
  const [nudgeText, setNudgeText] = useState('')
  const [nudgeLoading, setNudgeLoading] = useState(false)

  const generateBriefing = useCallback(async (todos, type, lang) => {
    setBriefingLoading(true)
    setBriefingText('')
    try {
      const todayStr = new Date().toISOString().slice(0, 10)
      const todayTodos = todos.filter(t => t.date === todayStr)

      const prompt = type === 'morning'
        ? buildMorningPrompt(todayTodos, lang)
        : buildEveningPrompt(todayTodos, lang)

      const result = await generateWithFallback(prompt)
      const text = result || (lang === 'ko' ? '브리핑을 생성할 수 없습니다.' : lang === 'ja' ? '브리핑을 생성할 수 없습니다。' : lang === 'zh' ? '无法生成简报。' : 'Could not generate briefing.')
      setBriefingText(text)
      return text
    } catch (e) {
      console.error('[Briefing] generation error:', e)
      setBriefingText(lang === 'ko' ? '브리핑 생성 중 오류가 발생했습니다.' : 'Briefing generation failed.')
      return null
    } finally {
      setBriefingLoading(false)
    }
  }, [])

  const generateNudge = useCallback(async (staleTodos, lang) => {
    if (!staleTodos || staleTodos.length === 0) return null

    setNudgeLoading(true)
    setNudgeText('')
    try {
      const prompt = buildNudgePrompt(staleTodos, lang)
      const result = await generateWithFallback(prompt)
      const text = result || (lang === 'ko' ? '정리 제안 생성 실패' : lang === 'ja' ? '整理提案の生成に失敗' : lang === 'zh' ? '整理建议生成失败' : 'Failed to generate cleanup suggestion')
      setNudgeText(text)
      return text
    } catch (e) {
      console.error('[Nudge] generation error:', e)
      setNudgeText('')
      return null
    } finally {
      setNudgeLoading(false)
    }
  }, [])

  return {
    briefingText,
    briefingLoading,
    generateBriefing,
    nudgeText,
    nudgeLoading,
    generateNudge
  }
}
