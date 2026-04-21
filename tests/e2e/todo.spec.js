import { test, expect } from '@playwright/test'

// 앱 로드 후 로딩 스피너가 사라질 때까지 대기
async function waitForAppReady(page) {
  await page.waitForFunction(
    () => !document.querySelector('body')?.innerText.includes('연결 중...'),
    { timeout: 10000 }
  )
  // 잠금화면 뷰가 아닌 메인 앱이 보일 때까지 대기
  await page.waitForSelector('.bottom-nav', { timeout: 10000 })
}

// 수동 입력 모달 열기 (inputMode 무관하게 강제로 manual 모드)
async function openManualModal(page) {
  // localStorage에서 inputMode를 manual로 설정
  await page.evaluate(() => localStorage.setItem('inputMode', 'manual'))
  await page.reload()
  await waitForAppReady(page)
  await page.locator('.fab').click()
  await page.waitForSelector('.input-modal', { timeout: 5000 })
}

test.describe('앱 기본 동작', () => {
  test('앱이 정상적으로 로드된다', async ({ page }) => {
    await page.goto('/')
    await waitForAppReady(page)

    // 하단 네비게이션이 보여야 함
    await expect(page.locator('.bottom-nav')).toBeVisible()
    // FAB 버튼이 보여야 함
    await expect(page.locator('.fab')).toBeVisible()
    // 앱 이름이 보여야 함
    await expect(page.locator('.curator-app-name')).toContainText('BrioDo')
  })

  test('날짜 헤더가 표시된다', async ({ page }) => {
    await page.goto('/')
    await waitForAppReady(page)

    // 현재 날짜가 헤더에 표시되어야 함
    await expect(page.locator('.greeting-date')).toBeVisible()
  })
})

test.describe('할 일 추가', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForAppReady(page)
    // IndexedDB 초기화 (테스트 격리)
    await page.evaluate(() => {
      return indexedDB.deleteDatabase('tododb')
    })
    await page.reload()
    await waitForAppReady(page)
  })

  test('수동으로 할 일을 추가할 수 있다', async ({ page }) => {
    await openManualModal(page)

    // 제목 입력
    await page.locator('.main-input').fill('플레이라이트 테스트 할 일')
    // 저장
    await page.getByRole('button', { name: '저장' }).click()

    // 할 일이 목록에 표시되어야 함
    await expect(page.locator('.todo-text').filter({ hasText: '플레이라이트 테스트 할 일' })).toBeVisible()
  })

  test('날짜와 시간을 지정해서 추가할 수 있다', async ({ page }) => {
    await openManualModal(page)

    await page.locator('.main-input').fill('시간 지정 테스트')
    // 날짜 설정 (오늘)
    const today = new Date().toISOString().split('T')[0]
    await page.locator('input[type="date"]').fill(today)
    // 시간 설정
    await page.locator('input[type="time"]').fill('14:30')
    await page.getByRole('button', { name: '저장' }).click()

    await expect(page.locator('.todo-text').filter({ hasText: '시간 지정 테스트' })).toBeVisible()
    await expect(page.locator('.todo-time').filter({ hasText: '14:30' })).toBeVisible()
  })

  test('우선순위를 설정해서 추가할 수 있다', async ({ page }) => {
    await openManualModal(page)

    await page.locator('.main-input').fill('높은 우선순위 할 일')
    // '높음' 우선순위 선택
    await page.locator('.priority-picker-btn').filter({ hasText: '높음' }).click()
    await page.getByRole('button', { name: '저장' }).click()

    await expect(page.locator('.priority-pill-high')).toBeVisible()
  })

  test('빈 제목으로는 저장되지 않는다', async ({ page }) => {
    await openManualModal(page)

    // 제목 비운 채로 저장 시도
    await page.locator('.main-input').fill('')
    await page.getByRole('button', { name: '저장' }).click()

    // 모달이 닫히지 않아야 함
    await expect(page.locator('.input-modal')).toBeVisible()
  })
})

test.describe('할 일 완료 처리', () => {
  test('체크박스 클릭으로 완료 처리된다', async ({ page }) => {
    await page.goto('/')
    await waitForAppReady(page)

    // 할 일 먼저 추가
    await openManualModal(page)
    await page.locator('.main-input').fill('완료 테스트 할 일')
    await page.getByRole('button', { name: '저장' }).click()
    await page.waitForSelector('.todo-card')

    // 체크박스 클릭
    await page.locator('.todo-card').first().locator('.checkbox').click()

    // 완료됨 섹션에 나타나야 함
    await expect(page.locator('.completed-section-header')).toBeVisible()
  })
})

test.describe('할 일 수정 및 삭제', () => {
  test('할 일을 수정할 수 있다', async ({ page }) => {
    await page.goto('/')
    await waitForAppReady(page)

    await openManualModal(page)
    await page.locator('.main-input').fill('수정 전 텍스트')
    await page.getByRole('button', { name: '저장' }).click()
    await page.waitForSelector('.todo-card')

    // 카드 클릭으로 편집 모달 열기
    await page.locator('.todo-text').filter({ hasText: '수정 전 텍스트' }).click()
    await page.waitForSelector('.input-modal')

    // 텍스트 수정
    await page.locator('.main-input').fill('수정 후 텍스트')
    await page.getByRole('button', { name: '수정' }).click()

    await expect(page.locator('.todo-text').filter({ hasText: '수정 후 텍스트' })).toBeVisible()
  })
})

test.describe('검색', () => {
  test('검색으로 할 일을 필터링할 수 있다', async ({ page }) => {
    await page.goto('/')
    await waitForAppReady(page)

    // 두 개의 할 일 추가
    await openManualModal(page)
    await page.locator('.main-input').fill('사과 사기')
    await page.getByRole('button', { name: '저장' }).click()

    await page.locator('.fab').click()
    await page.waitForSelector('.input-modal')
    await page.locator('.main-input').fill('배 사기')
    await page.getByRole('button', { name: '저장' }).click()

    // 검색 열기
    await page.locator('.curator-icon-btn').first().click()
    await page.waitForSelector('.search-input')
    await page.locator('.search-input').fill('사과')

    // 사과만 보여야 함
    await expect(page.locator('.todo-text').filter({ hasText: '사과 사기' })).toBeVisible()
    await expect(page.locator('.todo-text').filter({ hasText: '배 사기' })).not.toBeVisible()
  })
})

test.describe('뷰 전환', () => {
  test('하단 탭으로 뷰를 전환할 수 있다', async ({ page }) => {
    await page.goto('/')
    await waitForAppReady(page)

    // "할 일" 탭 클릭
    await page.locator('.bottom-nav-item').nth(1).click()
    await expect(page.locator('.bottom-nav-item').nth(1)).toHaveClass(/active/)

    // "컬렉션" 탭 클릭
    await page.locator('.bottom-nav-item').nth(2).click()
    await expect(page.locator('.bottom-nav-item').nth(2)).toHaveClass(/active/)

    // "오늘" 탭으로 돌아가기
    await page.locator('.bottom-nav-item').nth(0).click()
    await expect(page.locator('.bottom-nav-item').nth(0)).toHaveClass(/active/)
  })
})

test.describe('모달 닫기', () => {
  test('취소 버튼으로 모달을 닫을 수 있다', async ({ page }) => {
    await page.goto('/')
    await waitForAppReady(page)

    await openManualModal(page)
    await page.getByRole('button', { name: '취소' }).click()

    await expect(page.locator('.input-modal')).not.toBeVisible()
  })

  test('오버레이 클릭으로 모달을 닫을 수 있다', async ({ page }) => {
    await page.goto('/')
    await waitForAppReady(page)

    await openManualModal(page)
    // 오버레이(모달 외부) 클릭
    await page.locator('.input-overlay').click({ position: { x: 10, y: 10 } })

    await expect(page.locator('.input-modal')).not.toBeVisible()
  })
})
