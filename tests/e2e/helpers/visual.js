/**
 * BrioDo Visual Testing Helpers
 * 레이아웃 분석 및 스크린샷 비교 유틸리티
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * 스크린샷 저장 디렉토리
 */
const SCREENSHOT_DIR = path.join(__dirname, '../../test-results/visual-screenshots')

/**
 * 스크린샷 저장 디렉토리 초기화
 */
function ensureScreenshotDir() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
  }
}

/**
 * 스크린샷 캡처 및 저장
 * @param {Page} page - Playwright page
 * @param {string} name - 스크린샷 이름
 * @param {object} options - 추가 옵션
 */
async function captureScreenshot(page, name, options = {}) {
  ensureScreenshotDir()
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = `${name}-${timestamp}.png`
  const filepath = path.join(SCREENSHOT_DIR, filename)

  await page.screenshot({
    path: filepath,
    fullPage: options.fullPage || false,
  })

  console.log(`📸 Screenshot saved: ${filename}`)
  return filepath
}

/**
 * 요소의 오버플로우 상태 检测
 * @param {Page} page - Playwright page
 * @param {string} selector - 요소 선택자
 */
async function checkOverflow(page, selector) {
  const result = await page.evaluate((sel) => {
    const el = document.querySelector(sel)
    if (!el) return { exists: false }

    const rect = el.getBoundingClientRect()
    const scrollWidth = el.scrollWidth
    const scrollHeight = el.scrollHeight
    const clientWidth = el.clientWidth
    const clientHeight = el.clientHeight

    return {
      exists: true,
      hasHorizontalOverflow: scrollWidth > clientWidth,
      hasVerticalOverflow: scrollHeight > clientHeight,
      scrollWidth,
      scrollHeight,
      clientWidth,
      clientHeight,
      rect: { width: rect.width, height: rect.height }
    }
  }, selector)

  return result
}

/**
 * 텍스트 잘림 检测
 * @param {Page} page - Playwright page
 * @param {string} selector - 요소 선택자
 */
async function checkTextTruncation(page, selector) {
  const result = await page.evaluate((sel) => {
    const el = document.querySelector(sel)
    if (!el) return { exists: false }

    // scrollWidth vs clientWidth 비교
    const hasHorizontalTruncation = el.scrollWidth > el.clientWidth
    const hasVerticalTruncation = el.scrollHeight > el.clientHeight

    // overflow:hidden 상태에서 텍스트가 잘리는지 检测
    const style = window.getComputedStyle(el)
    const isOverflowHidden = style.overflow === 'hidden' || style.overflowX === 'hidden' || style.overflowY === 'hidden'

    // 텍스트가 실제로 잘렸는지 확인 (ellipsis)
    const text = el.textContent || ''
    const hasEllipsis = style.textOverflow === 'ellipsis'

    return {
      exists: true,
      hasHorizontalTruncation,
      hasVerticalTruncation,
      isOverflowHidden,
      hasEllipsis,
      textLength: text.length,
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth
    }
  }, selector)

  return result
}

/**
 * 요소 간 오버랩 检测
 * @param {Page} page - Playwright page
 * @param {string} selector1 - 첫 번째 요소 선택자
 * @param {string} selector2 - 두 번째 요소 선택자
 */
async function checkElementOverlap(page, selector1, selector2) {
  const result = await page.evaluate((selectors) => {
    const el1 = document.querySelector(selectors.sel1)
    const el2 = document.querySelector(selectors.sel2)

    if (!el1 || !el2) return { exists: false, reason: !el1 ? 'el1 not found' : 'el2 not found' }

    const rect1 = el1.getBoundingClientRect()
    const rect2 = el2.getBoundingClientRect()

    // 직사각형 충돌 检测
    const overlaps = !(rect1.right < rect2.left ||
      rect1.left > rect2.right ||
      rect1.bottom < rect2.top ||
      rect1.top > rect2.bottom)

    // 오버랩 영역 계산 (브라우저 내에서 직접 계산)
    let overlapArea = 0
    if (overlaps) {
      const xOverlap = Math.max(0, Math.min(rect1.right, rect2.right) - Math.max(rect1.left, rect2.left))
      const yOverlap = Math.max(0, Math.min(rect1.bottom, rect2.bottom) - Math.max(rect1.top, rect2.top))
      overlapArea = xOverlap * yOverlap
    }

    return {
      exists: true,
      overlaps,
      overlapArea,
      rect1: { top: rect1.top, right: rect1.right, bottom: rect1.bottom, left: rect1.left },
      rect2: { top: rect2.top, right: rect2.right, bottom: rect2.bottom, left: rect2.left }
    }
  }, { sel1: selector1, sel2: selector2 })

  return result
}

/**
 * 레이아웃 이슈 보고서 생성
 * @param {Page} page - Playwright page
 * @param {string} viewportName - 뷰포트 이름
 */
async function generateLayoutReport(page, viewportName) {
  const containers = await scanAllContainers(page)
  const textElements = await scanTextElements(page)

  const issues = []

  // 컨테이너 오버플로우 이슈
  for (const container of containers) {
    if (container.hasOverflow) {
      issues.push({
        type: 'overflow',
        selector: container.selector,
        message: `${container.selector}: 오버플로우 감지 (scroll: ${container.scrollWidth}x${container.scrollHeight}, client: ${container.rect.width}x${container.rect.height})`
      })
    }
  }

  // 텍스트 잘림 이슈
  for (const el of textElements) {
    if (el.issues && el.issues.length > 0) {
      el.issues.forEach(issue => {
        issues.push({
          type: 'text-truncation',
          selector: `${el.selector}[${issue.index}]`,
          message: `${el.selector}: 텍스트 잘림 감지 - "${issue.text}"`
        })
      })
    }
  }

  return {
    viewport: viewportName,
    timestamp: new Date().toISOString(),
    containerCount: containers.length,
    textElementCount: textElements.length,
    totalIssues: issues.length,
    issues,
    containers,
    textElements
  }
}

/**
 * 요소 위치 검증
 * @param {Page} page - Playwright page
 * @param {string} selector - 요소 선택자
 * @param {object} expected - 기대 위치 { top, left, width, height, tolerance }
 */
async function verifyElementPosition(page, selector, expected) {
  const result = await page.evaluate((sel) => {
    const el = document.querySelector(sel)
    if (!el) return { exists: false }

    const rect = el.getBoundingClientRect()
    const style = window.getComputedStyle(el)

    return {
      exists: true,
      visible: el.offsetParent !== null && rect.width > 0 && rect.height > 0,
      rect: {
        top: Math.round(rect.top),
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        bottom: Math.round(rect.bottom),
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      },
      display: style.display,
      visibility: style.visibility,
      opacity: style.opacity
    }
  }, selector)

  if (!result.exists) {
    return { passed: false, reason: 'Element not found' }
  }

  if (!result.visible) {
    return { passed: false, reason: 'Element is not visible', details: result }
  }

  const tolerance = expected.tolerance || 5

  const checks = []

  if (expected.top !== undefined) {
    const passed = Math.abs(result.rect.top - expected.top) <= tolerance
    checks.push({ property: 'top', expected: expected.top, actual: result.rect.top, passed })
  }

  if (expected.left !== undefined) {
    const passed = Math.abs(result.rect.left - expected.left) <= tolerance
    checks.push({ property: 'left', expected: expected.left, actual: result.rect.left, passed })
  }

  if (expected.width !== undefined) {
    const passed = Math.abs(result.rect.width - expected.width) <= tolerance
    checks.push({ property: 'width', expected: expected.width, actual: result.rect.width, passed })
  }

  if (expected.height !== undefined) {
    const passed = Math.abs(result.rect.height - expected.height) <= tolerance
    checks.push({ property: 'height', expected: expected.height, actual: result.rect.height, passed })
  }

  const allPassed = checks.every(c => c.passed)

  return { passed: allPassed, checks, details: result }
}

/**
 * 반응형 브레이크포인트 테스트
 */
const BREAKPOINTS = [
  { name: 'mobile-small', width: 320, height: 568 },
  { name: 'mobile-standard', width: 375, height: 667 },
  { name: 'mobile-large', width: 414, height: 896 },
  { name: 'tablet-small', width: 768, height: 1024 },
  { name: 'tablet-large', width: 1024, height: 1366 },
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'desktop-large', width: 1920, height: 1080 }
]

/**
 * 모든 주요 컨테이너의 오버플로우 检测
 * @param {Page} page - Playwright page
 */
async function scanAllContainers(page) {
  const containers = [
    '.todo-list-section',
    '#root',
    '.header-wrapper',
    '.modal-overlay',
    '.settings-modal'
  ]

  const results = []

  for (const container of containers) {
    const info = await page.evaluate((sel) => {
      const el = document.querySelector(sel)
      if (!el) return null

      const rect = el.getBoundingClientRect()
      const style = window.getComputedStyle(el)

      return {
        selector: sel,
        visible: el.offsetParent !== null,
        rect: { width: Math.round(rect.width), height: Math.round(rect.height) },
        scrollWidth: el.scrollWidth,
        scrollHeight: el.scrollHeight,
        hasOverflow: el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight,
        overflowStyle: style.overflow,
        overflowX: style.overflowX,
        overflowY: style.overflowY
      }
    }, container)

    if (info) results.push(info)
  }

  return results
}

/**
 * 주요 텍스트 요소의 잘림 检测
 * @param {Page} page - Playwright page
 */
async function scanTextElements(page) {
  const selectors = [
    '.todo-text',
    '.todo-description',
    '.header-date',
    '.header-title',
    '.tag-label',
    '.priority-label',
    '.modal-title'
  ]

  const results = []

  for (const selector of selectors) {
    const info = await page.evaluate((sel) => {
      const elements = document.querySelectorAll(sel)
      if (elements.length === 0) return null

      const issues = []
      elements.forEach((el, index) => {
        const rect = el.getBoundingClientRect()
        const style = window.getComputedStyle(el)

        if (el.scrollWidth > el.clientWidth && (style.overflow === 'hidden' || style.overflowX === 'hidden')) {
          issues.push({
            index,
            hasHorizontalTruncation: true,
            text: el.textContent.substring(0, 50) + (el.textContent.length > 50 ? '...' : ''),
            scrollWidth: el.scrollWidth,
            clientWidth: el.clientWidth
          })
        }
      })

      return {
        selector: sel,
        count: elements.length,
        issues
      }
    }, selector)

    if (info && info.count > 0) results.push(info)
  }

  return results
}

export {
  captureScreenshot,
  checkOverflow,
  checkTextTruncation,
  checkElementOverlap,
  scanAllContainers,
  scanTextElements,
  generateLayoutReport,
  verifyElementPosition,
  BREAKPOINTS,
  ensureScreenshotDir,
  SCREENSHOT_DIR
}

export default {
  captureScreenshot,
  checkOverflow,
  checkTextTruncation,
  checkElementOverlap,
  scanAllContainers,
  scanTextElements,
  generateLayoutReport,
  verifyElementPosition,
  BREAKPOINTS,
  ensureScreenshotDir,
  SCREENSHOT_DIR
}
