import { describe, it, expect } from 'vitest'
import {
  matchesRecurrence,
  getNextOccurrence,
  getLangLocale,
  formatTime,
  calcStreak,
  findStaleTodos,
  buildNudgePrompt,
} from './helpers.js'

// ============================================================
// matchesRecurrence
// ============================================================
describe('matchesRecurrence', () => {
  it('recurrence 없으면 날짜가 같을 때만 true', () => {
    const todo = { date: '2025-01-06', recurrence: null }
    expect(matchesRecurrence(todo, '2025-01-06')).toBe(true)
    expect(matchesRecurrence(todo, '2025-01-07')).toBe(false)
  })

  it('type=none 이면 정확한 날짜만 매칭', () => {
    const todo = { date: '2025-01-06', recurrence: { type: 'none' } }
    expect(matchesRecurrence(todo, '2025-01-06')).toBe(true)
    expect(matchesRecurrence(todo, '2025-01-07')).toBe(false)
  })

  it('시작일 이전이면 항상 false', () => {
    const todo = { date: '2025-01-06', recurrence: { type: 'daily' } }
    expect(matchesRecurrence(todo, '2025-01-05')).toBe(false)
  })

  describe('daily', () => {
    const todo = { date: '2025-01-06', recurrence: { type: 'daily' } }

    it('시작일 포함 이후 날짜에 모두 true', () => {
      expect(matchesRecurrence(todo, '2025-01-06')).toBe(true)
      expect(matchesRecurrence(todo, '2025-01-07')).toBe(true)
      expect(matchesRecurrence(todo, '2025-03-01')).toBe(true)
    })

    it('endDate 이후는 false', () => {
      const t = { ...todo, recurrence: { type: 'daily', endDate: '2025-01-08' } }
      expect(matchesRecurrence(t, '2025-01-08')).toBe(true)
      expect(matchesRecurrence(t, '2025-01-09')).toBe(false)
    })
  })

  describe('weekly', () => {
    const todo = { date: '2025-01-06', recurrence: { type: 'weekly' } }

    it('7일 간격마다 true', () => {
      expect(matchesRecurrence(todo, '2025-01-06')).toBe(true)
      expect(matchesRecurrence(todo, '2025-01-13')).toBe(true)
      expect(matchesRecurrence(todo, '2025-01-20')).toBe(true)
    })

    it('7일 간격이 아니면 false', () => {
      expect(matchesRecurrence(todo, '2025-01-07')).toBe(false)
      expect(matchesRecurrence(todo, '2025-01-12')).toBe(false)
    })
  })

  describe('monthly', () => {
    const todo = { date: '2025-01-15', recurrence: { type: 'monthly' } }

    it('매월 같은 일자에 true', () => {
      expect(matchesRecurrence(todo, '2025-01-15')).toBe(true)
      expect(matchesRecurrence(todo, '2025-02-15')).toBe(true)
      expect(matchesRecurrence(todo, '2025-12-15')).toBe(true)
    })

    it('다른 일자에 false', () => {
      expect(matchesRecurrence(todo, '2025-02-14')).toBe(false)
      expect(matchesRecurrence(todo, '2025-02-16')).toBe(false)
    })
  })
})

// ============================================================
// getNextOccurrence
// ============================================================
describe('getNextOccurrence', () => {
  it('recurrence 없으면 todo.date 반환', () => {
    const todo = { date: '2025-03-01', recurrence: null }
    expect(getNextOccurrence(todo, '2025-03-05')).toBe('2025-03-01')
  })

  it('daily: today 이후 가장 가까운 날짜 반환', () => {
    const todo = { date: '2025-01-01', recurrence: { type: 'daily' } }
    expect(getNextOccurrence(todo, '2025-06-01')).toBe('2025-06-01')
  })

  it('시작일이 today 이후면 시작일 반환', () => {
    const todo = { date: '2025-06-09', recurrence: { type: 'weekly' } }
    expect(getNextOccurrence(todo, '2025-06-01')).toBe('2025-06-09')
  })

  it('endDate 지났으면 null 반환', () => {
    const todo = { date: '2025-01-01', recurrence: { type: 'daily', endDate: '2025-01-05' } }
    expect(getNextOccurrence(todo, '2025-01-10')).toBeNull()
  })
})

// ============================================================
// getLangLocale
// ============================================================
describe('getLangLocale', () => {
  it('ko → ko-KR', () => expect(getLangLocale('ko')).toBe('ko-KR'))
  it('ja → ja-JP', () => expect(getLangLocale('ja')).toBe('ja-JP'))
  it('zh → zh-CN', () => expect(getLangLocale('zh')).toBe('zh-CN'))
  it('en → en-US', () => expect(getLangLocale('en')).toBe('en-US'))
  it('알 수 없는 언어 → en-US', () => expect(getLangLocale('fr')).toBe('en-US'))
})

// ============================================================
// formatTime
// ============================================================
describe('formatTime', () => {
  it('빈 값 → 빈 문자열', () => {
    expect(formatTime('', '시간 없음')).toBe('')
    expect(formatTime(null, '시간 없음')).toBe('')
  })

  it('noTimeLabel과 같으면 빈 문자열', () => {
    expect(formatTime('시간 없음', '시간 없음')).toBe('')
  })

  it('HH:MM 형식이면 그대로 반환', () => {
    expect(formatTime('14:30', '')).toBe('14:30')
    expect(formatTime('09:05', '')).toBe('09:05')
  })

  it('HH:MM:SS 형식이면 앞 5자리만 반환', () => {
    expect(formatTime('14:30:00', '')).toBe('14:30')
  })
})

// ============================================================
// calcStreak
// ============================================================
describe('calcStreak', () => {
  it('완료된 할 일이 없으면 0', () => {
    expect(calcStreak([{ completed: false, date: '2025-01-01' }], '2025-01-01')).toBe(0)
  })

  it('오늘만 완료되면 streak 1', () => {
    expect(calcStreak([{ completed: true, date: '2025-06-01' }], '2025-06-01')).toBe(1)
  })

  it('연속 3일 완료 → streak 3', () => {
    const todos = [
      { completed: true, date: '2025-06-01' },
      { completed: true, date: '2025-05-31' },
      { completed: true, date: '2025-05-30' },
    ]
    expect(calcStreak(todos, '2025-06-01')).toBe(3)
  })

  it('오늘 완료 없어도 어제가 있으면 streak 1 (오늘은 아직 진행 중으로 간주)', () => {
    expect(calcStreak([{ completed: true, date: '2025-05-31' }], '2025-06-01')).toBe(1)
  })

  it('중간에 빠진 날이 있으면 연속 끊김', () => {
    const todos = [
      { completed: true, date: '2025-06-01' },
      { completed: true, date: '2025-05-30' }, // 2025-05-31 없음
    ]
    expect(calcStreak(todos, '2025-06-01')).toBe(1)
  })
})

// ============================================================
// findStaleTodos
// ============================================================
describe('findStaleTodos', () => {
  const old = Date.now() - 20 * 24 * 60 * 60 * 1000
  const recent = Date.now() - 5 * 24 * 60 * 60 * 1000

  it('완료된 항목은 제외', () => {
    expect(findStaleTodos([{ completed: true, text: 'done', createdAt: old }])).toHaveLength(0)
  })

  it('최근 생성된 항목은 제외', () => {
    expect(findStaleTodos([{ completed: false, text: 'new', createdAt: recent }])).toHaveLength(0)
  })

  it('오래된 미완료 항목 반환', () => {
    const result = findStaleTodos([{ completed: false, text: 'stale', createdAt: old }])
    expect(result).toHaveLength(1)
    expect(result[0].text).toBe('stale')
  })

  it('최대 5개까지만 반환', () => {
    const todos = Array.from({ length: 10 }, (_, i) => ({
      completed: false, text: `stale-${i}`, createdAt: old,
    }))
    expect(findStaleTodos(todos)).toHaveLength(5)
  })

  it('createdAt 없으면 제외', () => {
    expect(findStaleTodos([{ completed: false, text: 'no-date' }])).toHaveLength(0)
  })
})

// ============================================================
// buildNudgePrompt
// ============================================================
describe('buildNudgePrompt', () => {
  const staleTodos = [{ text: '청소하기' }, { text: '책 읽기' }]

  it('한국어 프롬프트에 할 일 텍스트 포함', () => {
    const prompt = buildNudgePrompt(staleTodos, 'ko')
    expect(prompt).toContain('청소하기')
    expect(prompt).toContain('책 읽기')
    expect(prompt).toContain('2주')
  })

  it('영어 프롬프트에 할 일 텍스트 포함', () => {
    const prompt = buildNudgePrompt(staleTodos, 'en')
    expect(prompt).toContain('청소하기')
    expect(prompt).toContain('neglected')
  })

  it('일본어/중국어도 텍스트 포함', () => {
    expect(buildNudgePrompt(staleTodos, 'ja')).toContain('청소하기')
    expect(buildNudgePrompt(staleTodos, 'zh')).toContain('청소하기')
  })
})
