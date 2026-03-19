import { useState, useEffect, useMemo } from 'react'
import { translations } from '../constants/translations'

export function useLanguage() {
  const [lang, setLang] = useState('ko')
  const t = useMemo(() => translations[lang] || translations.ko, [lang])

  useEffect(() => {
    const sysLang = navigator.language.split('-')[0]
    if (['en', 'ja', 'zh'].includes(sysLang)) setLang(sysLang)
    else setLang('ko')
  }, [])

  return { lang, setLang, t }
}
