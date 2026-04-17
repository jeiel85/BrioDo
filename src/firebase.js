import { initializeApp } from "firebase/app"
import { getAuth, GoogleAuthProvider } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getFunctions } from "firebase/functions"
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check"

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

// Firebase App Check - Play Integrity API for Android
// Initialize after Firebase app, before using Functions
let appCheckInitialized = false

export const initAppCheck = () => {
  if (appCheckInitialized) return

  try {
    // reCAPTCHA Enterprise provider for Android
    const reCaptchaEnterpriseProvider = new ReCaptchaEnterpriseProvider()

    initializeAppCheck(fbApp, {
      provider: reCaptchaEnterpriseProvider,
      isTokenAutoRefreshEnabled: true
    })

    appCheckInitialized = true
    console.log('[AppCheck] Initialized with Play Integrity')
  } catch (error) {
    console.error('[AppCheck] Initialization failed:', error)
    // App Check 실패 시에도 앱은 계속 작동 (Graceful degradation)
  }
}

// Lazy initialization on first Functions call
export const getAppCheck = () => {
  if (!appCheckInitialized) {
    initAppCheck()
  }
  return appCheckInitialized
}
