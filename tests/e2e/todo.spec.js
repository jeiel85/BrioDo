import { test, expect } from '@playwright/test'

// CI 환경에서 온보딩/연결 대기 없이 앱을 바로 로드
async function gotoApp(page) {
  await page.addInitScript(() => {
    localStorage.setItem('briodo-onboarding-done', 'true')
    localStorage.setItem('inputMode', 'manual')
  })
  await page.goto('/')
  await page.waitForSelector('.header-wrapper', { timeout: 20000 })
}

// 수동 입력 모달 열기
async function openManualModal(page) {
  await page.locator('.fab').click()
  await page.waitForSelector('.input-modal', { timeout: 10000 })
}

test.describe('앱 기본 동작', () => {
  test('앱이 정상적으로 로드된다', async ({ page }) => {
    await gotoApp(page)

    await expect(page.locator('.fab')).toBeVisible()
    await expect(page.locator('.curator-app-name')).toContainText('BrioDo')
  })

  test('날짜 헤더가 표시된다', async ({ page }) => {
    await gotoApp(page)

    await expect(page.locator('.greeting-date')).toBeVisible()
  })
})

test.describe('할 일 추가', () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page)
    await page.evaluate(() => indexedDB.deleteDatabase('tododb'))
    await page.reload()
    await page.waitForSelector('.header-wrapper', { timeout: 20000 })
  })

  test('수동으로 할 일을 추가할 수 있다', async ({ page }) => {
    await openManualModal(page)

    await page.locator('.main-input').fill('플레이라이트 테스트 할 일')
    await page.getByRole('button', { name: '저장' }).click()

    await expect(page.locator('.todo-text').filter({ hasText: '플레이라이트 테스트 할 일' })).toBeVisible()
  })

  test('날짜와 시간을 지정해서 추가할 수 있다', async ({ page }) => {
    await openManualModal(page)

    await page.locator('.main-input').fill('시간 지정 테스트')
    const today = new Date().toISOString().split('T')[0]
    await page.locator('input[type="date"]').fill(today)
    await page.locator('input[type="time"]').fill('14:30')
    await page.getByRole('button', { name: '저장' }).click()

    await expect(page.locator('.todo-text').filter({ hasText: '시간 지정 테스트' })).toBeVisible()
    await expect(page.locator('.todo-time').filter({ hasText: '14:30' })).toBeVisible()
  })

  test('우선순위를 설정해서 추가할 수 있다', async ({ page }) => {
    await openManualModal(page)

    await page.locator('.main-input').fill('높은 우선순위 할 일')
    await page.locator('.priority-picker-btn').filter({ hasText: '높음' }).click()
    await page.getByRole('button', { name: '저장' }).click()

    await expect(page.locator('.priority-pill-high')).toBeVisible()
  })

  test('빈 제목으로는 저장되지 않는다', async ({ page }) => {
    await openManualModal(page)

    await page.locator('.main-input').fill('')
    await page.getByRole('button', { name: '저장' }).click()

    await expect(page.locator('.input-modal')).toBeVisible()
  })
})

test.describe('할 일 완료 처리', () => {
  test('체크박스 클릭으로 완료 처리된다', async ({ page }) => {
    await gotoApp(page)

    await openManualModal(page)
    await page.locator('.main-input').fill('완료 테스트 할 일')
    await page.getByRole('button', { name: '저장' }).click()
    await page.waitForSelector('.todo-card')

    await page.locator('.todo-card').first().locator('.checkbox').click()

    await expect(page.locator('.completed-section-header')).toBeVisible()
  })
})

test.describe('할 일 수정 및 삭제', () => {
  test('할 일을 수정할 수 있다', async ({ page }) => {
    await gotoApp(page)

    await openManualModal(page)
    await page.locator('.main-input').fill('수정 전 텍스트')
    await page.getByRole('button', { name: '저장' }).click()
    await page.waitForSelector('.todo-card')

    await page.locator('.todo-text').filter({ hasText: '수정 전 텍스트' }).click()
    await page.waitForSelector('.input-modal')

    await page.locator('.main-input').fill('수정 후 텍스트')
    await page.getByRole('button', { name: '수정' }).click()

    await expect(page.locator('.todo-text').filter({ hasText: '수정 후 텍스트' })).toBeVisible()
  })
})

test.describe('검색', () => {
  test('검색으로 할 일을 필터링할 수 있다', async ({ page }) => {
    await gotoApp(page)

    await openManualModal(page)
    await page.locator('.main-input').fill('사과 사기')
    await page.getByRole('button', { name: '저장' }).click()

    await page.locator('.fab').click()
    await page.waitForSelector('.input-modal')
    await page.locator('.main-input').fill('배 사기')
    await page.getByRole('button', { name: '저장' }).click()

    await page.locator('.curator-icon-btn').first().click()
    await page.waitForSelector('.search-input')
    await page.locator('.search-input').fill('사과')

    await expect(page.locator('.todo-text').filter({ hasText: '사과 사기' })).toBeVisible()
    await expect(page.locator('.todo-text').filter({ hasText: '배 사기' })).not.toBeVisible()
  })
})

test.describe('뷰 전환', () => {
  test('하단 탭으로 뷰를 전환할 수 있다', async ({ page }) => {
    await gotoApp(page)

    await page.locator('.bottom-nav-item').nth(1).click()
    await expect(page.locator('.bottom-nav-item').nth(1)).toHaveClass(/active/)

    await page.locator('.bottom-nav-item').nth(2).click()
    await expect(page.locator('.bottom-nav-item').nth(2)).toHaveClass(/active/)

    await page.locator('.bottom-nav-item').nth(0).click()
    await expect(page.locator('.bottom-nav-item').nth(0)).toHaveClass(/active/)
  })
})

test.describe('모달 닫기', () => {
  test('취소 버튼으로 모달을 닫을 수 있다', async ({ page }) => {
    await gotoApp(page)

    await openManualModal(page)
    await page.getByRole('button', { name: '취소' }).click()

    await expect(page.locator('.input-modal')).not.toBeVisible()
  })

  test('오버레이 클릭으로 모달을 닫을 수 있다', async ({ page }) => {
    await gotoApp(page)

    await openManualModal(page)
    await page.locator('.input-overlay').click({ position: { x: 10, y: 10 } })

    await expect(page.locator('.input-modal')).not.toBeVisible()
  })
})
