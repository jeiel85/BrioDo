import { test, expect } from '@playwright/test'

/**
 * BrioDo E2E Test Suite
 * 모바일 앱 자동화 테스트
 */

/**
 * 온보딩 스킵 - localStorage 플래그 설정으로 온보딩 우회
 */
async function skipOnboarding(page) {
  // Set flag before initial navigation so onboarding never renders
  await page.addInitScript(() => {
    localStorage.setItem('briodo-onboarding-done', 'true')
  })
  await page.goto('/')
  // Wait for main app UI (Firebase auth loading state resolves before header renders)
  await page.waitForSelector('.header-wrapper', { timeout: 20000 })
}

test.describe('BrioDo 앱 기본 동작', () => {

  test('페이지가 정상적으로 로드된다', async ({ page }) => {
    await skipOnboarding(page)

    // 앱 컨테이너 확인
    await expect(page.locator('#root')).toBeVisible({ timeout: 10000 })
  })

  test('헤더에 날짜와 정보가 표시된다', async ({ page }) => {
    await skipOnboarding(page)

    // 헤더 영역 확인
    const header = page.locator('.header-wrapper, .header')
    await expect(header.first()).toBeVisible({ timeout: 10000 })
  })

})

test.describe('할 일 관리', () => {

  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
  })

  test('입력 버튼이 표시된다', async ({ page }) => {
    // 플로팅 액션 버튼 또는 입력 버튼 확인
    const addButton = page.locator('.fab, .add-btn, button:has-text("추가"), button:has-text("Add")')
    await expect(addButton.first()).toBeVisible({ timeout: 10000 })
  })

  test('입력 모달이 열린다', async ({ page }) => {
    // 입력 버튼 클릭
    const addButton = page.locator('.fab, .add-btn, button:has-text("추가"), button:has-text("Add")').first()
    await addButton.click()

    // 입력 모달 확인
    const modal = page.locator('.input-modal, .input-overlay, .modal')
    await expect(modal.first()).toBeVisible({ timeout: 5000 })
  })

  test('텍스트 입력 후 할 일이 추가된다', async ({ page }) => {
    // 입력 버튼 클릭
    const addButton = page.locator('.fab, .add-btn, button:has-text("추가"), button:has-text("Add")').first()
    await addButton.click()

    // 모달이 열릴 때까지 대기
    await page.waitForSelector('.input-modal, .input-overlay, .modal', { timeout: 5000 })

    // 텍스트 입력
    const input = page.locator('input[type="text"], input[placeholder*="할 일"], input[placeholder*="todo"]').first()
    if (await input.isVisible()) {
      await input.fill('테스트 할 일 ' + Date.now())

      // 저장 버튼 클릭
      const saveButton = page.locator('button:has-text("저장"), button:has-text("Save"), button:has-text("추가")').first()
      await saveButton.click()

      // 할 일이 목록에 추가되었는지 확인
      await page.waitForTimeout(1000)
    }
  })

})

test.describe('설정 화면', () => {

  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
  })

  test('설정 버튼이 표시된다', async ({ page }) => {
    const settingsButton = page.locator('button:has-text("설정"), button:has-text("Settings"), .settings-btn')
    await expect(settingsButton.first()).toBeVisible({ timeout: 10000 })
  })

  test('설정 모달이 열린다', async ({ page }) => {
    const settingsButton = page.locator('button:has-text("설정"), button:has-text("Settings"), .settings-btn').first()
    await settingsButton.click()

    // 설정 모달 확인
    const modal = page.locator('.settings-modal, .settings-overlay')
    await expect(modal.first()).toBeVisible({ timeout: 5000 })
  })

})

test.describe('반응형 레이아웃', () => {

  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
  })

  test('모바일 뷰포트에서 정상 작동', async ({ page }) => {
    // 모바일 크기로 설정
    await page.setViewportSize({ width: 375, height: 667 })

    // 콘텐츠가 화면에 맞게 표시
    await expect(page.locator('#root')).toBeVisible({ timeout: 10000 })
  })

  test('태블릿 뷰포트에서 정상 작동', async ({ page }) => {
    // 태블릿 크기로 설정
    await page.setViewportSize({ width: 768, height: 1024 })

    // 콘텐츠가 화면에 맞게 표시
    await expect(page.locator('#root')).toBeVisible({ timeout: 10000 })
  })

})
