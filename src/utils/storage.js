/**
 * BrioDo Storage Utility
 * 
 * 보안 및 향후 확장을 위해 localStorage 직접 접근을 캡슐화합니다.
 * 향후 Capacitor Secure Storage 등으로 플러그인을 교체하기 용이하도록 설계되었습니다.
 */

const STORAGE_KEYS = {
  GOOGLE_ACCESS_TOKEN: 'googleAccessToken',
  GOOGLE_TOKEN_SAVED_AT: 'googleAccessTokenSavedAt',
  THEME_MODE: 'themeMode',
  LANGUAGE: 'language',
  ONBOARDING_COMPLETED: 'onboardingCompleted'
};

// 민감 정보 키 목록 (인코딩 대상)
const SENSITIVE_KEYS = [STORAGE_KEYS.GOOGLE_ACCESS_TOKEN];

/**
 * 보안 강화를 위해 간단한 Base64 인코딩을 적용합니다. 
 * (XSS 시 토큰을 바로 읽지 못하게 하는 1차 방어선 - 암호화는 아니나 가시성을 차단)
 */
const encode = (val) => btoa(val);
const decode = (val) => atob(val);

export const storage = {
  get: (key) => {
    const val = localStorage.getItem(key);
    if (!val) return null;
    return SENSITIVE_KEYS.includes(key) ? decode(val) : val;
  },

  set: (key, val) => {
    if (val === null || val === undefined) {
      localStorage.removeItem(key);
      return;
    }
    const finalVal = SENSITIVE_KEYS.includes(key) ? encode(val) : val;
    localStorage.setItem(key, finalVal);
  },

  remove: (key) => {
    localStorage.removeItem(key);
  },

  clearAll: () => {
    localStorage.clear();
  },

  keys: STORAGE_KEYS
};
