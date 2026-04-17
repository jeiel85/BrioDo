import { useState, useMemo } from 'react'
import { translations } from '../constants/translations'

const PREF_KEY = 'briodo-lang-pref'

function getSystemLang() {
  const sysLang = navigator.language.split('-')[0]
  return ['en', 'ja', 'zh'].includes(sysLang) ? sysLang : 'ko'
}

export function useLanguage() {
  const [langPref, setLangPref] = useState(() => {
    return localStorage.getItem(PREF_KEY) || 'auto'
  })

  const lang = langPref === 'auto' ? getSystemLang() : langPref

  const t = useMemo(() => translations[lang] || translations.ko, [lang])

  const setLangPrefAndSave = (pref) => {
    setLangPref(pref)
    localStorage.setItem(PREF_KEY, pref)
  }

  return { lang, langPref, setLangPref: setLangPrefAndSave, t }
}
