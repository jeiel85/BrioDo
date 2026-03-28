/**
 * useWeather — wttr.in 기반 날씨 훅
 * API 키 불필요. 30분 캐시.
 *
 * weatherLocation: '' = IP 기반 자동 위치, 'Seoul' 등 도시명 직접 지정
 */

const CACHE_KEY = 'briodo-weather-cache'
const CACHE_TTL = 30 * 60 * 1000 // 30분

// wttr.in 날씨 코드 → 이모지 매핑
const WMO_ICONS = {
  113: '☀️',  // 맑음
  116: '⛅',  // 구름 조금
  119: '☁️',  // 흐림
  122: '☁️',  // 완전 흐림
  143: '🌫️',  // 안개
  176: '🌦️',  // 소나기
  179: '🌨️',  // 진눈깨비
  182: '🌧️',  // 이슬비
  185: '🌧️',
  200: '⛈️',  // 천둥
  227: '🌨️',  // 눈
  230: '❄️',  // 폭설
  248: '🌫️',  // 안개
  260: '🌫️',
  263: '🌦️',
  266: '🌧️',
  281: '🌨️',
  284: '🌨️',
  293: '🌦️',
  296: '🌧️',
  299: '🌧️',
  302: '🌧️',
  305: '🌧️',
  308: '🌧️',
  311: '🌨️',
  314: '🌨️',
  317: '🌨️',
  320: '🌨️',
  323: '❄️',
  326: '❄️',
  329: '❄️',
  332: '❄️',
  335: '❄️',
  338: '❄️',
  350: '🌨️',
  353: '🌦️',
  356: '🌧️',
  359: '🌧️',
  362: '🌨️',
  365: '🌨️',
  368: '❄️',
  371: '❄️',
  374: '🌨️',
  377: '🌨️',
  386: '⛈️',
  389: '⛈️',
  392: '⛈️',
  395: '❄️',
}

function getWeatherIcon(code) {
  return WMO_ICONS[code] || '🌡️'
}

function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { ts, data, location } = JSON.parse(raw)
    if (Date.now() - ts > CACHE_TTL) return null
    return { data, location }
  } catch { return null }
}

function saveCache(data, location) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data, location }))
  } catch {}
}

export async function fetchWeather(locationKey = '', lang = 'en') {
  const cacheId = `${locationKey}|${lang}`
  // 캐시 확인
  const cached = loadCache()
  if (cached && cached.location === cacheId) return cached.data

  const loc = locationKey.trim() || ''
  const wttrLang = lang === 'zh' ? 'zh-tw' : lang
  const url = `https://wttr.in/${encodeURIComponent(loc)}?format=j1&lang=${wttrLang}`

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json()

    const cur = json.current_condition?.[0]
    const today = json.weather?.[0]
    if (!cur || !today) throw new Error('Invalid response')

    const data = {
      icon: getWeatherIcon(Number(cur.weatherCode)),
      tempC: Math.round(Number(cur.temp_C)),
      highC: Math.round(Number(today.maxtempC)),
      lowC: Math.round(Number(today.mintempC)),
      desc: cur.weatherDesc?.[0]?.value || '',
      // 사용자가 직접 입력한 위치명은 그대로 표시 (언어 유지)
      // IP 자동 감지(빈 문자열)일 때만 wttr.in 반환값 사용
      area: locationKey.trim() || json.nearest_area?.[0]?.areaName?.[0]?.value || '',
      region: json.nearest_area?.[0]?.region?.[0]?.value || '',
      country: json.nearest_area?.[0]?.country?.[0]?.value || '',
    }
    saveCache(data, cacheId)
    return data
  } catch (e) {
    // 네트워크 오류 시 캐시 (만료된 것도) 재사용
    try {
      const raw = localStorage.getItem(CACHE_KEY)
      if (raw) {
        const { data } = JSON.parse(raw)
        return data
      }
    } catch {}
    return null
  }
}
