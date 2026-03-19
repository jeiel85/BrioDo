import { useState, useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'

const fontScaleMap = { 1: 0.70, 2: 0.82, 3: 0.91, 4: 1.00, 5: 1.10, 6: 1.20, 7: 1.35 }

export function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem('blenddo-theme') || 'dark')
  const [fontScale, setFontScale] = useState(() => {
    const saved = localStorage.getItem('blenddo-font-scale')
    if (saved === 'small') return 2
    if (saved === 'large') return 6
    const num = parseInt(saved)
    return (num >= 1 && num <= 7) ? num : 4
  })
  const [randomColors, setRandomColors] = useState(() => {
    const saved = localStorage.getItem('blenddo-random-colors')
    return saved ? JSON.parse(saved) : null
  })

  const generateRandomTheme = () => {
    const hue = Math.floor(Math.random() * 360)
    const isDark = Math.random() > 0.5
    const colors = isDark ? {
      primary: `hsl(${hue}, 70%, 65%)`,
      bgColor: `hsl(${hue}, 15%, 10%)`,
      cardBg: `hsl(${hue}, 15%, 14%)`,
      textMain: `hsl(${hue}, 10%, 90%)`,
      textTime: `hsl(${hue}, 10%, 60%)`,
      borderColor: `hsl(${hue}, 15%, 22%)`,
      checkboxBorder: `hsl(${hue}, 10%, 40%)`,
      tagBg: `hsl(${hue}, 15%, 18%)`,
      modalBg: `hsl(${hue}, 15%, 14%)`,
    } : {
      primary: `hsl(${hue}, 70%, 50%)`,
      bgColor: `hsl(${hue}, 30%, 97%)`,
      cardBg: `hsl(${hue}, 30%, 97%)`,
      textMain: `hsl(${hue}, 20%, 15%)`,
      textTime: `hsl(${hue}, 10%, 45%)`,
      borderColor: `hsl(${hue}, 20%, 90%)`,
      checkboxBorder: `hsl(${hue}, 10%, 70%)`,
      tagBg: `hsl(${hue}, 25%, 93%)`,
      modalBg: `hsl(${hue}, 30%, 97%)`,
    }
    setRandomColors(colors)
    localStorage.setItem('blenddo-random-colors', JSON.stringify(colors))
    setTheme('random')
  }

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('theme-light', 'theme-dark', 'theme-system')
    const props = ['--primary', '--bg-color', '--card-bg', '--text-main', '--text-time', '--border-color', '--checkbox-border', '--tag-bg', '--modal-bg']
    props.forEach(p => root.style.removeProperty(p))

    if (theme === 'random' && randomColors) {
      root.style.setProperty('--primary', randomColors.primary)
      root.style.setProperty('--bg-color', randomColors.bgColor)
      root.style.setProperty('--card-bg', randomColors.cardBg)
      root.style.setProperty('--text-main', randomColors.textMain)
      root.style.setProperty('--text-time', randomColors.textTime)
      root.style.setProperty('--border-color', randomColors.borderColor)
      root.style.setProperty('--checkbox-border', randomColors.checkboxBorder)
      root.style.setProperty('--tag-bg', randomColors.tagBg)
      root.style.setProperty('--modal-bg', randomColors.modalBg)
    } else {
      root.classList.add(`theme-${theme}`)
    }
    localStorage.setItem('blenddo-theme', theme)

    if (Capacitor.isNativePlatform()) {
      setTimeout(async () => {
        try {
          const bodyBg = getComputedStyle(document.body).backgroundColor
          const hexMatch = bodyBg.match(/\d+/g)
          let hexColor = '#FFFFFF'
          if (hexMatch && hexMatch.length >= 3) {
            hexColor = '#' + hexMatch.slice(0, 3).map(x => parseInt(x).toString(16).padStart(2, '0')).join('').toUpperCase()
          }
          await StatusBar.setBackgroundColor({ color: hexColor })
          const [r, g, b] = hexMatch ? hexMatch.slice(0, 3).map(Number) : [255, 255, 255]
          const brightness = (r * 299 + g * 587 + b * 114) / 1000
          await StatusBar.setStyle({ style: brightness > 128 ? Style.Light : Style.Dark })
        } catch (e) {
          console.error("StatusBar error:", e)
        }
      }, 50)
    }
  }, [theme, randomColors])

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('font-small', 'font-medium', 'font-large')
    root.style.setProperty('--font-scale', fontScaleMap[fontScale] ?? 1)
    localStorage.setItem('blenddo-font-scale', fontScale)
  }, [fontScale])

  return { theme, setTheme, fontScale, setFontScale, randomColors, generateRandomTheme }
}
