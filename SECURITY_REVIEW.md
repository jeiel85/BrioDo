## 개요

Play Store 배포 전 전체 보안 상태를 검토한 결과입니다. 발견된 취약점들을 우선순위별로 정리했습니다.

---

## 🔴 High Priority (즉시 조치 필요)

### 1. Firebase App Check 비활성화
**위험도:** High | **파일:** `src/firebase.js`

**현재 상태:**
- `VITE_APP_CHECK_ENABLED`가 `false`로 설정되어 Firebase App Check 비활성화
- Firestore 및 Cloud Functions이 보호되지 않아 bots/automated abuse에 노출

**권장 조치:**
```env
# .env.production에 추가
VITE_APP_CHECK_ENABLED=true
```

Firestore 보안 규칙을 App Check 요구로 강화:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.app != null;
    }
  }
}
```

---

### 2. BootReceiver 및 위젯 exported=true
**위험도:** Medium | **파일:** `android/app/src/main/AndroidManifest.xml`

**현재 상태:**
```xml
<receiver android:name=".BootReceiver" android:exported="true">
<receiver android:name=".BrioDoWidgetProvider" android:exported="true">
```

**권장 조치:**
```xml
<!-- exported="false"로 변경 -->
<receiver android:name=".BootReceiver" android:exported="false">
<!-- 위젯은 PWA 필수이므로 exported=true 유지, 대신 permission 검증 추가 -->
```

---

## 🟡 Medium Priority (릴리즈 전 권장)

### 3. OAuth 토큰 Base64 인코딩만 사용
**위험도:** Medium | **파일:** `src/utils/storage.js`

**현재 상태:**
```javascript
const encode = (val) => btoa(val);  // 단순 인코딩, 암호화 아님
```

**문제:** XSS 성공 시 토큰 복호화 가능 (atob()로 역산)

**권장 조치:**
- Capacitor Secure Storage로 마이그레이션 (`@capacitor-community/secure-storage`)
- 또는 crypto API를利用한 AES-256-GCM 암호화 구현

---

### 4. CSP 'unsafe-inline' 사용
**위험도:** Medium | **파일:** `index.html`

**현재 상태:**
```html
<script-src 'self' 'unsafe-inline' ...>
```

**권장 조치:**
```html
<script-src 'self' 'nonce-{random}'>
```
Vite의 `:global`Chunk에 nonce 적용 필요

---

### 5. ProGuard 규칙 미흡
**위험도:** Low | **파일:** `android/app/proguard-rules.pro`

**현재 상태:** 기본 규칙만 존재, Firebase SDK 민감 클래스 보호不足

**권장 조치:**
```proguard
# Firebase Auth
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**

# Google API Client
-keep class com.google.api.** { *; }
-dontwarn com.google.api.**

# Keep Gson serialized classes
-keepattributes Signature
-keepattributes *Annotation*
-keep class com.briodo.** { *; }
```

---

### 6. cleartext traffic 설정 없음
**위험도:** Low | **파일:** `AndroidManifest.xml`

**현재 상태:** `android:usesCleartextTraffic` 기본값 (true)

**권장 조치:**
```xml
<application android:usesCleartextTraffic="false">
```
단, Google OAuth 리다이렉트 등 예외 도메인 필요시:
```xml
<application android:usesCleartextTraffic="false">
  <domain-config cleartextPermitted="false">
    <domain includeSubdomains="true">google.com</domain>
    <domain includeSubdomains="true">firebase.googleapis.com</domain>
  </domain-config>
</application>
```

---

## 🟢 Low Priority (향후 개선)

### 7. Debug 빌드 변형 분석
**위험도:** Info | **파일:** `android/app/build.gradle`

**현재 상태:**
- Debug 변형이 `signingConfigs.debug` (공유 debug.keystore) 사용
- Release 변형은 `minifyEnabled=true`, `shrinkResources=true` 적용됨

**평가:** ✅ 적절히 설정됨 (릴리즈 APK에만 signingConfig.release 적용)

---

### 8. .gitignore 보안 설정 검증
**위험도:** Info | **파일:** `.gitignore`

**현재 상태:**
- ✅ `.env` 제외
- ✅ `google-services.json` 제외  
- ✅ `*.jks`, `*.keystore`, `keystore.properties` 제외

**평가:** ✅ 적절히 설정됨

---

## 📋 현재 보안 설정 요약

| 항목 | 상태 | 비고 |
|------|------|------|
| allowBackup | ❌ `false` | 데이터 백업 불가능 (마이그레이션 이슈) |
| minifyEnabled (release) | ✅ `true` | R8 코드 축소 활성화 |
| shrinkResources | ✅ `true` | 리소스 축소 활성화 |
| CSP | ⚠️ 부분적 | unsafe-inline 존재 |
| App Check | ❌ 비활성화 | 즉각 활성화 권장 |
| 토큰 저장 | ⚠️ Base64 | Secure Storage 권장 |
| cleartextTraffic | ✅ true | false 권장 |

---

## 🎯 권장 우선순위

1. **즉시:** Firebase App Check 활성화 (High)
2. **릴리즈 전:** BootReceiver exported 변경, ProGuard 강화
3. **향후:** Secure Storage로 마이그레이션, CSP nonce 적용
4. **검토 필요:** `allowBackup="false"`가 사용자 데이터 마이그레이션에 영향을 주는지 확인

---

*Issue created for Play Store deployment security review*