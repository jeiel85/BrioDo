import { useState, useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { App as CapApp } from '@capacitor/app'
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth'
import {
  signInWithPopup,
  getRedirectResult,
  signInWithCredential,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut
} from "firebase/auth"
import { auth, googleProvider } from '../firebase'
import { resetCalendarSession, refreshAccessTokenIfNeeded } from '../calendar'

// Android/iOS: @codetrix-studio/capacitor-google-auth 플러그인으로 OAuth2 accessToken 획득
// Web: signInWithPopup 사용

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tokenExpired, setTokenExpired] = useState(false)

  // 로딩이 5초 이상 지속되면 강제 해제
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        console.warn("Loading timeout - forcing loading to false")
        setLoading(false)
      }
    }, 5000)
    return () => clearTimeout(timer)
  }, [loading])

  useEffect(() => {
    console.log("Setting up Auth listener...")

    // 네이티브 환경에서 GoogleAuth 초기화
    if (Capacitor.isNativePlatform()) {
      GoogleAuth.initialize({
        clientId: '758825654936-hbi2uo4u34gqn8okvnnaqlm1ic43hfbc.apps.googleusercontent.com',
        scopes: [
          'profile',
          'email',
          'https://www.googleapis.com/auth/calendar.events',
          'https://www.googleapis.com/auth/calendar'
        ],
        grantOfflineAccess: true,
      })
    }

    const checkTimer = setTimeout(() => {
      if (loading && !user) {
        console.log("Auth Timeout - checking currentUser manually")
        if (auth.currentUser) {
          setUser(auth.currentUser)
          setLoading(false)
        }
      }
    }, 3000)

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      console.log("Auth state changed:", u ? u.email : "No User")
      clearTimeout(checkTimer)
      setUser(u)
      setLoading(false)
    })

    // 웹 환경에서만 리다이렉트 결과 확인
    if (!Capacitor.isNativePlatform()) {
      const checkRedirect = async () => {
        try {
          const result = await getRedirectResult(auth)
          if (result) {
            const oauthCredential = GoogleAuthProvider.credentialFromResult(result)
            if (oauthCredential?.accessToken) {
              localStorage.setItem('googleAccessToken', oauthCredential.accessToken)
              console.log("Access Token saved from Web Redirect")
            }
          }
        } catch (e) {
          console.error("Redirect result error:", e)
        }
      }
      checkRedirect()
    }

    if (Capacitor.isNativePlatform()) {
      const handleDeepLink = CapApp.addListener('appUrlOpen', (data) => {
        console.log('App opened with URL:', data.url)
      })
      return () => {
        unsubscribe()
        handleDeepLink.remove()
      }
    }

    return () => unsubscribe()
  }, [])

  // 로그인 상태 + 네이티브 환경에서 5분마다 토큰 갱신 체크
  useEffect(() => {
    if (!user || !Capacitor.isNativePlatform()) return
    const interval = setInterval(async () => {
      const result = await refreshAccessTokenIfNeeded()
      if (!result.success && result.expired) setTokenExpired(true)
    }, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [user])

  const handleLogin = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        // 네이티브: GoogleAuth 플러그인으로 OAuth2 accessToken 포함 로그인
        console.log("Native login: GoogleAuth.signIn()")
        const googleUser = await GoogleAuth.signIn()
        console.log("GoogleAuth result:", JSON.stringify({
          email: googleUser?.email,
          hasIdToken: !!googleUser?.authentication?.idToken,
          hasAccessToken: !!googleUser?.authentication?.accessToken,
        }))

        const { idToken, accessToken } = googleUser.authentication
        const credential = GoogleAuthProvider.credential(idToken, accessToken)
        await signInWithCredential(auth, credential)

        if (accessToken) {
          localStorage.setItem('googleAccessToken', accessToken)
          localStorage.setItem('googleAccessTokenSavedAt', Date.now().toString())
          setTokenExpired(false)
          console.log("Native: Calendar accessToken saved ✓")
        } else {
          console.warn("Native: accessToken not returned")
        }
      } else {
        // 웹: 팝업 방식
        console.log("Web login: signInWithPopup()")
        const result = await signInWithPopup(auth, googleProvider)
        const oauthCredential = GoogleAuthProvider.credentialFromResult(result)
        if (oauthCredential?.accessToken) {
          localStorage.setItem('googleAccessToken', oauthCredential.accessToken)
          localStorage.setItem('googleAccessTokenSavedAt', Date.now().toString())
          console.log("Web: accessToken saved ✓")
        }
      }
    } catch (e) {
      console.error("Login Error:", e.code, e.message)
    }
  }

  const handleLogout = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        await GoogleAuth.signOut()
      }
      await signOut(auth)
      localStorage.removeItem('googleAccessToken')
      localStorage.removeItem('googleAccessTokenSavedAt')
      localStorage.removeItem('blenddo-calendar-id')
      resetCalendarSession()
    } catch (e) {
      console.error("Logout error:", e)
    }
  }

  return { user, loading, handleLogin, handleLogout, tokenExpired, setTokenExpired }
}
