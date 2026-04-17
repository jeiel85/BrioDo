import { initializeApp } from "firebase/app"
import { getAuth, GoogleAuthProvider } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getFunctions } from "firebase/functions"

// Firebase App Check - 하드코딩으로 비활성화 (릴리즈 시 필요시 활성화)
// @capacitor-community/in-app-purchases와 함께 런칭 시 사용 예정
const APP_CHECK_ENABLED = false // TODO: 환경 변수로 전환 예정

if (APP_CHECK_ENABLED) {
  import('firebase/app-check').then(({ initializeAppCheck, ReCaptchaEnterpriseProvider }) => {
    console.log('[AppCheck] App Check is disabled for now')
  }).catch(() => {})
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

export const fbApp = initializeApp(firebaseConfig)
export const auth = getAuth(fbApp)
export const db = getFirestore(fbApp)
export const functions = getFunctions(fbApp, "asia-northeast3")

export const googleProvider = new GoogleAuthProvider()
googleProvider.addScope('https://www.googleapis.com/auth/calendar.app.created')

// Firebase App Check 초기화 - 현재 비활성화 (릴리즈 시 활성화)
// eslint-disable-next-line no-unused-vars
export const initAppCheck = () => {
  if (!APP_CHECK_ENABLED) {
    console.log('[AppCheck] Disabled - set APP_CHECK_ENABLED = true to enable')
    return
  }

  try {
    // Dynamic import to avoid loading when disabled
    import('firebase/app-check').then(({ initializeAppCheck, ReCaptchaEnterpriseProvider }) => {
      const reCaptchaEnterpriseProvider = new ReCaptchaEnterpriseProvider()
      initializeAppCheck(fbApp, {
        provider: reCaptchaEnterpriseProvider,
        isTokenAutoRefreshEnabled: true
      })
      console.log('[AppCheck] Initialized with Play Integrity')
    }).catch(err => {
      console.error('[AppCheck] Failed to load:', err)
    })
  } catch (error) {
    console.error('[AppCheck] Initialization failed:', error)
  }
}

// Pro Features - 하드코딩으로 비활성화 (릴리즈 시 필요시 활성화)
export const PRO_ENABLED = false // TODO: 환경 변수로 전환 예정
