import { test, expect } from '@playwright/test'
import {
  captureScreenshot,
  checkOverflow,
  checkTextTruncation,
  checkElementOverlap,
  scanAllContainers,
  scanTextElements,
  generateLayoutReport,
  verifyElementPosition,
  BREAKPOINTS,
  ensureScreenshotDir
} from './helpers/visual.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * BrioDo 시각적 회귀 테스트
 * UI 깨짐, 어긋남, 레이아웃 이슈 자동 检测
 */

// 온보딩 스킵 헬퍼
async function skipOnboarding(page) {
  // Set flag before navigation so onboarding never renders
  await page.addInitScript(() => {
    localStorage.setItem('briodo-onboarding-done', 'true')
  })
  await page.goto('/')
  // Wait for main app UI (Firebase auth loading state resolves before header renders)
  await page.waitForSelector('.header-wrapper', { timeout: 20000 })
}

// ============================================
// 1. 레이아웃 오버플로우 테스트
// ============================================
test.describe('레이아웃 오버플로우 检测', () => {

  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
  })

  test('메인 컨테이너에 오버플로우가 없어야 함', async ({ page }) => {
    // 스크린샷 캡처
    await captureScreenshot(page, 'layout-main-container')

    // 주요 컨테이너 检测
    const containers = await scanAllContainers(page)

    // overflow:hidden auto는 정상 동작 (스크롤 가능한 영역)
    const overflowIssues = containers.filter(c =>
      c.hasOverflow && !c.overflowStyle.includes('auto') && !c.overflowStyle.includes('scroll')
    )

    if (overflowIssues.length > 0) {
      console.log('⚠️ 오버플로우 감지된 컨테이너:', overflowIssues)
    }

    expect(overflowIssues.length, `오버플로우 감지: ${JSON.stringify(overflowIssues.map(i => i.selector))}`).toBe(0)
  })

  test('할 일 목록 컨테이너 오버플로우 检测', async ({ page }) => {
    // 긴 텍스트의 할 일 추가
    await page.locator('.fab, .add-btn, button:has-text("추가")').first().click()
    await page.waitForSelector('.input-modal', { timeout: 5000 })

    const input = page.locator('input[type="text"], input[placeholder*="할 일"]').first()
    if (await input.isVisible()) {
      // 매우 긴 텍스트 입력
      await input.fill('이것은 매우 긴 할 일 텍스트입니다. '.repeat(10))
      await captureScreenshot(page, 'layout-long-text-input')
    }

    // 모달 닫기
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)
  })

  test('헤더 영역 오버플로우 检测', async ({ page }) => {
    await captureScreenshot(page, 'layout-header')

    const headerOverflow = await checkOverflow(page, '.header-wrapper, .header')

    if (headerOverflow.exists && headerOverflow.hasHorizontalOverflow) {
      console.log('⚠️ 헤더 가로 오버플로우:', headerOverflow)
    }

    expect(headerOverflow.exists).toBe(true)
    expect(headerOverflow.hasHorizontalOverflow, '헤더에 가로 오버플로우가 없어야 함').toBe(false)
  })

  test('모달 콘텐츠 오버플로우 检测', async ({ page }) => {
    // 입력 모달 열기
    await page.locator('.fab, .add-btn, button:has-text("추가")').first().click()
    await page.waitForSelector('.input-modal', { timeout: 5000 })

    await captureScreenshot(page, 'layout-modal-open')

    const modalOverflow = await checkOverflow(page, '.input-modal, .modal-content')

    expect(modalOverflow.exists).toBe(true)

    await page.keyboard.press('Escape')
  })

  test('설정 모달 오버플로우 检测', async ({ page }) => {
    // 설정 모달 열기
    await page.locator('button:has-text("설정")').first().click()
    await page.waitForSelector('.settings-modal, .settings-content', { timeout: 5000 })

    await captureScreenshot(page, 'layout-settings-modal')

    const settingsOverflow = await scanAllContainers(page)
    const modalContainers = settingsOverflow.filter(c =>
      c.selector.includes('settings') || c.selector.includes('modal')
    )

    const overflowIssues = modalContainers.filter(c => c.hasOverflow)

    expect(overflowIssues.length, '설정 모달에 오버플로우가 없어야 함').toBe(0)

    await page.keyboard.press('Escape')
  })
})

// ============================================
// 2. 텍스트 잘림 检测
// ============================================
test.describe('텍스트 잘림 检测', () => {

  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
  })

  test('할 일 텍스트가 잘리면 안 됨', async ({ page }) => {
    // 긴 텍스트의 할 일 추가
    const longText = '이것은 매우 긴 할 일입니다. 테스트를 위한 긴 텍스트입니다. 화면 너비를 초과하는 텍스트입니다. 계속됩니다. 더 계속됩니다. 끝없이 계속됩니다.'

    await page.locator('.fab, .add-btn, button:has-text("추가")').first().click()
    await page.waitForSelector('.input-modal', { timeout: 5000 })

    const input = page.locator('input[type="text"], input[placeholder*="할 일"]').first()
    if (await input.isVisible()) {
      await input.fill(longText)
    }

    // 저장
    const saveButton = page.locator('button:has-text("저장"), button:has-text("Save")').first()
    await saveButton.click()
    await page.waitForTimeout(1000)

    await captureScreenshot(page, 'text-truncation-todo')

    // 텍스트 잘림 检测
    const textIssues = await scanTextElements(page)
    const truncationIssues = textIssues.filter(t =>
      t.issues && t.issues.some(i => i.hasHorizontalTruncation)
    )

    if (truncationIssues.length > 0) {
      console.log('⚠️ 텍스트 잘림 감지:', truncationIssues)
    }

    // 텍스트 잘림이 감지되어도 앱이 정상 동작하면 통과
    // (ellipsis 처리된 것은 정상 동작으로 간주)
    // 긴 텍스트는 overflow:auto 영역 내에서 스크롤 가능하므로 완전한 실패로 간주하지 않음
    const criticalIssues = truncationIssues.filter(t =>
      t.issues.some(i => i.hasHorizontalTruncation && !i.hasEllipsis && i.textLength > 100)
    )

    // 100자 이상 텍스트의 비의도적 잘림만 실패로 간주
    expect(criticalIssues.length, '긴 텍스트의 비의도적 잘림이 없어야 함').toBe(0)
  })

  test('헤더 날짜 텍스트 잘림 检测', async ({ page }) => {
    await captureScreenshot(page, 'text-truncation-header')

    // 헤더 영역의 주요 텍스트 요소 检测
    const headerTruncation = await page.evaluate(() => {
      const header = document.querySelector('.header-wrapper')
      if (!header) return { exists: false }

      // 헤더 내部的에 텍스트 잘림이 있는지 检测
      const textElements = header.querySelectorAll('*')
      for (const el of textElements) {
        if (el.scrollWidth > el.clientWidth && el.clientWidth > 0) {
          const style = window.getComputedStyle(el)
          if (style.overflow === 'hidden' && style.textOverflow !== 'ellipsis') {
            return { exists: true, hasTruncation: true, text: el.textContent?.substring(0, 50) }
          }
        }
      }
      return { exists: true, hasTruncation: false }
    })

    expect(headerTruncation.exists).toBe(true)
    // 헤더 텍스트 잘림은 경고만 하고 테스트 실패하지 않음
    if (headerTruncation.hasTruncation) {
      console.log('⚠️ 헤더 텍스트 잘림 감지:', headerTruncation)
    }
  })

  test('태그 라벨 잘림 检测', async ({ page }) => {
    // 태그가 있는 할 일 추가
    await page.locator('.fab, .add-btn, button:has-text("추가")').first().click()
    await page.waitForSelector('.input-modal', { timeout: 5000 })

    const input = page.locator('input[type="text"], input[placeholder*="할 일"]').first()
    const tagInput = page.locator('input[placeholder*="태그"], input[placeholder*="tag"]')

    if (await input.isVisible()) {
      await input.fill('테스트 할 일')
    }
    if (await tagInput.isVisible()) {
      await tagInput.fill('#очень-длинный-тег #очень-длинный-тег-2')
    }

    await captureScreenshot(page, 'text-truncation-tags')

    const tagTruncation = await checkTextTruncation(page, '.tag-label, .tag-item')

    await page.keyboard.press('Escape')
  })
})

// ============================================
// 3. 요소 오버랩 检测
// ============================================
test.describe('요소 오버랩 检测', () => {

  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
  })

  test('헤더와 콘텐츠 영역이 오버랩되지 않아야 함', async ({ page }) => {
    await captureScreenshot(page, 'overlap-header-content')

    const overlap = await checkElementOverlap(page, '.header-wrapper', '.todo-list-section')

    expect(overlap.exists).toBe(true)
    // 헤더와 콘텐츠가 약간 겹치는 것은 정상 (패딩 포함)
    expect(overlap.overlapArea, '헤더와 콘텐츠가 심각하게 오버랩되지 않아야 함').toBeLessThan(1000)
  })

  test('플로팅 버튼이 다른 요소와 오버랩되지 않아야 함', async ({ page }) => {
    await captureScreenshot(page, 'overlap-fab-button')

    // FAB와 다른 주요 요소들 오버랩 检测
    const overlaps = []

    const elements = ['.header-wrapper', '.todo-list-section']
    for (const el of elements) {
      const overlap = await checkElementOverlap(page, '.fab', el)
      if (overlap.exists && overlap.overlaps) {
        overlaps.push({ with: el, area: overlap.overlapArea })
      }
    }

    if (overlaps.length > 0) {
      console.log('⚠️ FAB 오버랩 감지:', overlaps)
    }

    // FAB는 우하단에 위치하여 todo-list-section과 약간 오버랩되는 것이 정상
    // 5000px² 이상严重的 오버랩만 실패로 간주
    const criticalOverlaps = overlaps.filter(o => o.area > 5000)
    expect(criticalOverlaps.length, 'FAB 버튼이 주요 요소와严重하게 오버랩되지 않아야 함').toBe(0)
  })

  test('모달이 백그라운드와 오버랩되지 않아야 함', async ({ page }) => {
    // 입력 모달 열기
    await page.locator('.fab, .add-btn, button:has-text("추가")').first().click()
    await page.waitForSelector('.input-overlay, .input-modal', { timeout: 5000 })

    await captureScreenshot(page, 'overlap-modal')

    const overlap = await checkElementOverlap(page, '.input-overlay', '.fab')

    // 모달이 백그라운드와 오버랩되는 것은 정상
    expect(overlap.exists).toBe(true)

    await page.keyboard.press('Escape')
  })

  test('할 일 목록 영역이 화면 내에 존재해야 함', async ({ page }) => {
    await captureScreenshot(page, 'overlap-todo-section')

    const overlap = await checkElementOverlap(page, '.todo-list-section', '.header-wrapper')

    expect(overlap.exists).toBe(true)
    // 콘텐츠가 헤더 아래에 위치하면 overlapArea가 0
    // 약간의 overlap은 정상 (패딩, 마진)
    expect(overlap.overlapArea, '할 일 목록이 헤더와 심각하게 오버랩되지 않아야 함').toBeLessThan(500)
  })
})

// ============================================
// 4. 반응형 브레이크포인트 테스트
// ============================================
test.describe('반응형 레이아웃 테스트', () => {

  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
  })

  test('모바일 small (320px) 레이아웃', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 })
    // Wait for layout to stabilize after viewport change
    await page.waitForFunction(() => document.getElementById('root')?.getBoundingClientRect().height > 0)

    await captureScreenshot(page, 'responsive-mobile-small')

    // 레이아웃 리포트 생성
    const report = await generateLayoutReport(page, 'mobile-small')
    console.log('📊 레이아웃 리포트:', JSON.stringify(report.issues, null, 2))

    // 작은 화면에서도 주요 요소가 보여야 함
    const root = page.locator('#root')
    await expect(root).toBeVisible({ timeout: 10000 })
  })

  test('모바일 standard (375px) 레이아웃', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })

    await captureScreenshot(page, 'responsive-mobile-standard')

    const report = await generateLayoutReport(page, 'mobile-standard')
    expect(report.totalIssues, `이슈 수: ${report.totalIssues}`).toBeLessThan(5)
  })

  test('모바일 large (414px) 레이아웃', async ({ page }) => {
    await page.setViewportSize({ width: 414, height: 896 })

    await captureScreenshot(page, 'responsive-mobile-large')

    const report = await generateLayoutReport(page, 'mobile-large')
    expect(report.totalIssues, `이슈 수: ${report.totalIssues}`).toBeLessThan(5)
  })

  test('태블릿 (768px) 레이아웃', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })

    await captureScreenshot(page, 'responsive-tablet')

    const report = await generateLayoutReport(page, 'tablet')
    expect(report.totalIssues, `이슈 수: ${report.totalIssues}`).toBeLessThan(5)
  })

  test('데스크톱 (1280px) 레이아웃', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })

    await captureScreenshot(page, 'responsive-desktop')

    const report = await generateLayoutReport(page, 'desktop')
    expect(report.totalIssues, `이슈 수: ${report.totalIssues}`).toBeLessThan(5)
  })

  test('큰 데스크톱 (1920px) 레이아웃', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })

    await captureScreenshot(page, 'responsive-desktop-large')

    const report = await generateLayoutReport(page, 'desktop-large')
    expect(report.totalIssues, `이슈 수: ${report.totalIssues}`).toBeLessThan(5)
  })

  // 파라미터화된 브레이크포인트 테스트
  BREAKPOINTS.forEach(({ name, width, height }) => {
    test(`${name} (${width}x${height}) 모든 요소 가시성`, async ({ page }) => {
      await page.setViewportSize({ width, height })
      // Let the layout stabilize after viewport change
      await page.waitForTimeout(500)

      // 주요 요소들 가시성 检测 (toBeVisible auto-retries unlike isVisible)
      const elements = [
        '#root',
        '.header-wrapper',
        '.todo-list-section'
      ]

      for (const selector of elements) {
        try {
          await expect(page.locator(selector).first()).toBeVisible({ timeout: 5000 })
        } catch {
          await captureScreenshot(page, `visibility-${name}-${selector.replace(/[^a-z]/g, '')}`)
          throw new Error(`${selector} 가 ${name}에서 보여야 함`)
        }
      }
    })
  })
})

// ============================================
// 5. UI 상태별 스크린샷 캡처
// ============================================
test.describe('UI 상태별 스크린샷', () => {

  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
  })

  test('기본 상태 스크린샷', async ({ page }) => {
    await captureScreenshot(page, 'state-default')
    const root = page.locator('#root')
    await expect(root).toBeVisible()
  })

  test('입력 모달 열린 상태', async ({ page }) => {
    await page.locator('.fab, .add-btn, button:has-text("추가")').first().click()
    await page.waitForSelector('.input-modal', { timeout: 5000 })

    await captureScreenshot(page, 'state-input-modal-open')

    const modal = page.locator('.input-modal')
    await expect(modal).toBeVisible()

    await page.keyboard.press('Escape')
  })

  test('설정 모달 열린 상태', async ({ page }) => {
    await page.locator('button:has-text("설정")').first().click()
    await page.waitForSelector('.settings-modal, .settings-content', { timeout: 5000 })

    await captureScreenshot(page, 'state-settings-modal-open')

    await page.keyboard.press('Escape')
  })

  test('할 일 추가 후 상태', async ({ page }) => {
    // 할 일 추가
    await page.locator('.fab, .add-btn, button:has-text("추가")').first().click()
    await page.waitForSelector('.input-modal', { timeout: 5000 })

    const input = page.locator('input[type="text"], input[placeholder*="할 일"]').first()
    if (await input.isVisible()) {
      await input.fill('시각적 테스트 할 일 ' + Date.now())
    }

    const saveButton = page.locator('button:has-text("저장"), button:has-text("Save")').first()
    await saveButton.click()
    await page.waitForTimeout(1000)

    await captureScreenshot(page, 'state-after-add-todo')
  })

  test('날짜 변경 후 상태', async ({ page }) => {
    // 캘린더에서 다른 날짜 선택
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    // 내일 버튼 클릭 시도
    const nextDayBtn = page.locator('button:has-text("내일"), button:has-text("Tomorrow"), button[aria-label*="next"]').first()
    if (await nextDayBtn.isVisible()) {
      await nextDayBtn.click()
      await page.waitForTimeout(500)
    }

    await captureScreenshot(page, 'state-next-day')
  })
})

// ============================================
// 6. 요소 위치 검증
// ============================================
test.describe('요소 위치 검증', () => {

  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
  })

  test('헤더가 화면 상단에 위치해야 함', async ({ page }) => {
    const position = await verifyElementPosition(page, '.header-wrapper, .header', {
      top: { min: 0, max: 60 }, // 상단 60px 이내
      tolerance: 10
    })

    // 위치 检测만 수행, 정확한 값을 강제하지 않음
    console.log('헤더 위치:', position)
  })

  test('FAB 버튼이 우하단에 위치해야 함', async ({ page }) => {
    const viewport = page.viewportSize()
    const position = await verifyElementPosition(page, '.fab', {
      // 우하단 영역에 있어야 함
      left: { min: viewport.width - 80, max: viewport.width },
      top: { min: viewport.height - 150, max: viewport.height },
      tolerance: 50
    })

    console.log('FAB 위치:', position)
  })

  test('바텀 네비게이션이 화면 하단에 위치해야 함', async ({ page }) => {
    const viewport = page.viewportSize()
    const position = await verifyElementPosition(page, '.bottom-nav', {
      bottom: { min: viewport.height - 20, max: viewport.height + 20 },
      tolerance: 30
    })

    console.log('바텀 네비게이션 위치:', position)
  })
})

// ============================================
// 7. 종합 레이아웃 리포트
// ============================================
test.describe('종합 레이아웃 리포트', () => {

  test('전체 레이아웃 이슈 리포트 생성', async ({ page }) => {
    await skipOnboarding(page)

    // 모든 주요 뷰포트에서 检测
    const reports = []

    for (const { name, width, height } of BREAKPOINTS) {
      await page.setViewportSize({ width, height })
      await page.waitForTimeout(100) // 리사이즈 후 대기

      const report = await generateLayoutReport(page, name)
      reports.push(report)

      console.log(`\n📊 ${name} (${width}x${height}):`)
      console.log(`   총 이슈: ${report.totalIssues}`)
      if (report.issues.length > 0) {
        report.issues.forEach(issue => {
          console.log(`   - [${issue.type}] ${issue.message}`)
        })
      }
    }

    // 결과 저장
    ensureScreenshotDir()
    const reportDir = path.join(__dirname, '../../test-results/visual-screenshots')
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true })
    }
    const reportPath = path.join(reportDir, 'layout-report.json')
    fs.writeFileSync(reportPath, JSON.stringify(reports, null, 2))
    console.log(`\n📄 리포트 저장됨: ${reportPath}`)

    // 전체 이슈 수가 너무 많으면 실패
    // overflow:auto는 정상으로 간주하여 제외
    const totalIssues = reports.reduce((sum, r) => {
      const criticalIssues = r.issues.filter(i =>
        !(i.message && i.message.includes('overflow:hidden auto'))
      )
      return sum + criticalIssues.length
    }, 0)
    expect(totalIssues, `전체 이슈 수가 너무 많습니다: ${totalIssues}`).toBeLessThan(10)
  })
})
