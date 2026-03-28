import { useState, useEffect, useCallback } from 'react'
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'

const fontScaleMap = { 1: 0.70, 2: 0.82, 3: 0.91, 4: 1.00, 5: 1.10, 6: 1.20, 7: 1.35 }

// All CSS custom properties managed by random theme — must match index.css token names
const RANDOM_THEME_PROPS = [
  '--color-surface',
  '--color-surface-container-low',
  '--color-surface-container-lowest',
  '--color-surface-container-high',
  '--color-primary',
  '--color-on-surface',
  '--color-on-surface-variant',
  '--color-outline-variant',
  '--color-secondary',
  '--color-secondary-container',
  '--color-tertiary',
  '--color-error',
  '--priority-low',
  '--priority-medium',
  '--priority-high',
  '--priority-urgent',
  '--checkbox-border',
  '--header-glass-bg',
]

export function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem('briodo-theme') || 'dark')
  const [fontScale, setFontScale] = useState(() => {
    const saved = localStorage.getItem('briodo-font-scale')
    if (saved === 'small') return 2
    if (saved === 'large') return 6
    const num = parseInt(saved)
    return (num >= 1 && num <= 7) ? num : 4
  })
  const [randomColors, setRandomColors] = useState(() => {
    const saved = localStorage.getItem('briodo-random-colors')
    return saved ? JSON.parse(saved) : null
  })

  const generateRandomTheme = () => {
    const hue = Math.floor(Math.random() * 360)
    const sec = (hue + 150) % 360
    const ter = (hue + 60) % 360
    const isDark = Math.random() > 0.5

    const colors = isDark ? {
      '--color-surface':                  `hsl(${hue}, 15%, 8%)`,
      '--color-surface-container-low':    `hsl(${hue}, 15%, 12%)`,
      '--color-surface-container-lowest': `hsl(${hue}, 15%, 6%)`,
      '--color-surface-container-high':   `hsl(${hue}, 15%, 22%)`,
      '--color-primary':                  `hsl(${hue}, 70%, 75%)`,
      '--color-on-surface':               `hsl(${hue}, 10%, 88%)`,
      '--color-on-surface-variant':       `hsl(${hue}, 10%, 68%)`,
      '--color-outline-variant':          `hsla(${hue}, 15%, 55%, 0.15)`,
      '--color-secondary':                `hsl(${sec}, 55%, 65%)`,
      '--color-secondary-container':      `hsl(${sec}, 40%, 22%)`,
      '--color-tertiary':                 `hsl(${ter}, 65%, 75%)`,
      '--color-error':                    `hsl(0, 70%, 72%)`,
      '--priority-low':                   `hsl(${hue}, 10%, 60%)`,
      '--priority-medium':                `hsl(${hue}, 70%, 75%)`,
      '--priority-high':                  `hsl(${ter}, 65%, 75%)`,
      '--priority-urgent':                `hsl(0, 70%, 72%)`,
      '--checkbox-border':                `hsla(${hue}, 10%, 80%, 0.25)`,
      '--header-glass-bg':                `hsla(${hue}, 15%, 8%, 0.85)`,
    } : {
      '--color-surface':                  `hsl(${hue}, 30%, 98%)`,
      '--color-surface-container-low':    `hsl(${hue}, 25%, 94%)`,
      '--color-surface-container-lowest': `hsl(${hue}, 30%, 100%)`,
      '--color-surface-container-high':   `hsl(${hue}, 20%, 88%)`,
      '--color-primary':                  `hsl(${hue}, 85%, 35%)`,
      '--color-on-surface':               `hsl(${hue}, 15%, 18%)`,
      '--color-on-surface-variant':       `hsl(${hue}, 10%, 42%)`,
      '--color-outline-variant':          `hsla(${hue}, 15%, 45%, 0.15)`,
      '--color-secondary':                `hsl(${sec}, 60%, 28%)`,
      '--color-secondary-container':      `hsl(${sec}, 55%, 85%)`,
      '--color-tertiary':                 `hsl(${ter}, 65%, 38%)`,
      '--color-error':                    `hsl(0, 75%, 38%)`,
      '--priority-low':                   `hsl(${hue}, 10%, 42%)`,
      '--priority-medium':                `hsl(${hue}, 85%, 35%)`,
      '--priority-high':                  `hsl(${ter}, 65%, 38%)`,
      '--priority-urgent':                `hsl(0, 75%, 38%)`,
      '--checkbox-border':                `hsla(${hue}, 10%, 20%, 0.2)`,
      '--header-glass-bg':                `hsla(${hue}, 30%, 98%, 0.85)`,
    }
    setRandomColors(colors)
    localStorage.setItem('briodo-random-colors', JSON.stringify(colors))
    setTheme('random')
  }

  // getComputedStyle은 Android WebView에서 CSS 변수를 못 읽음 → 테마 state 직접 사용
  const getStatusBarColors = useCallback((t, rc) => {
    let isDark
    if (t === 'dark') {
      isDark = true
    } else if (t === 'light' || t === 'materialyou') {
      isDark = false
    } else if (t === 'system') {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    } else if (t === 'random' && rc) {
      // hsl(X, 15%, 8%) → 어두운 / hsl(X, 30%, 98%) → 밝은: lightness < 50 이면 dark
      const m = (rc['--color-surface'] || '').match(/(\d+)%\s*\)/)
      isDark = m ? parseInt(m[1]) < 50 : false
    } else {
      isDark = false
    }
    return {
      bg: isDark ? '#10151f' : '#f4f3fa',
      style: isDark ? Style.Dark : Style.Light,
    }
  }, [])

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('theme-light', 'theme-dark', 'theme-system', 'theme-materialyou')
    RANDOM_THEME_PROPS.forEach(p => root.style.removeProperty(p))

    if (theme === 'random' && randomColors) {
      Object.entries(randomColors).forEach(([prop, value]) => {
        root.style.setProperty(prop, value)
      })
    } else {
      root.classList.add(`theme-${theme}`)
    }
    localStorage.setItem('briodo-theme', theme)

    if (Capacitor.isNativePlatform()) {
      setTimeout(async () => {
        try {
          const { bg, style } = getStatusBarColors(theme, randomColors)
          await StatusBar.setBackgroundColor({ color: bg })
          await StatusBar.setStyle({ style })
        } catch (e) {}
      }, 100)
    }
  }, [theme, randomColors, getStatusBarColors])

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('font-small', 'font-medium', 'font-large')
    root.style.setProperty('--font-scale', fontScaleMap[fontScale] ?? 1)
    localStorage.setItem('briodo-font-scale', fontScale)
  }, [fontScale])

  const syncStatusBar = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return
    try {
      const t = localStorage.getItem('briodo-theme') || 'dark'
      const rc = (() => { try { return JSON.parse(localStorage.getItem('briodo-random-colors')) } catch { return null } })()
      const { bg, style } = getStatusBarColors(t, rc)
      await StatusBar.setBackgroundColor({ color: bg })
      await StatusBar.setStyle({ style })
    } catch (e) {}
  }, [getStatusBarColors])

  return { theme, setTheme, fontScale, setFontScale, randomColors, generateRandomTheme, syncStatusBar }
}
