# BrioDo — Claude 개발 가이드

## 프로젝트 개요

**BrioDo (브리오두)** — "Do it with brio."
활기차게, 해내다. — AI와 함께하는 스마트 할 일 관리 앱.

- **패키지 ID:** `app.briodo`
- **플랫폼:** Android (Capacitor 8 + React 19 + Vite 8)
- **현재 단계:** Play Store 출시 준비 중 (v1.0.0)

---

## ⚡ Claude 개발 워크플로우 규칙 (매 세션 유지)

> **이 규칙들은 사용자가 매번 요청하지 않아도 자동으로 적용한다.**

1. **빌드 = 전체 파이프라인**: 소스 변경 후 빌드 시 → `build → cap sync → gradlew → adb install → adb start` 전체 자동 실행. Galaxy S24(`R3CWC0KB53Z`)에 설치까지 완료해야 빌드 작업이 끝난 것.
2. **커밋 + 푸시 자동 세트**: 소스코드 변경 → 즉시 `git commit` + `git push` 함께 처리.
3. **버전 이력 유지**: 기능 추가/버그 수정 시 `PROJECT_HISTORY.md`에 날짜·세션·내용 기록 후 커밋.
4. **localStorage 키 네임스페이스**: 모든 키는 `briodo-*` 또는 `briodo_*` 접두사 사용.

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프론트엔드 | React 19 + Vite 8 |
| 모바일 래핑 | Capacitor 8 (Android) |
| 인증 | Firebase Auth + `@codetrix-studio/capacitor-google-auth` |
| 클라우드 DB | Firebase Firestore |
| 로컬 DB | IndexedDB (idb) — **오프라인 우선** |
| AI | Google Gemini (`gemini-2.5-flash-lite`, 멀티 모델 폴백) |
| 음성 | `@capacitor-community/speech-recognition` (Android 네이티브) |
| 캘린더 | Google Calendar API v3 |
| CSS | 커스텀 CSS + Material Design 3 토큰 (Manrope + Inter 폰트) |

---

## 아키텍처 핵심 원칙

### 1. 오프라인 우선
- **항상 IndexedDB에 먼저 저장** → Firestore는 비동기 동기화
- 오프라인 시 sync queue에 쌓아두고 온라인 복귀 시 일괄 처리
- 새 기능 추가 시 오프라인 시나리오 반드시 고려

### 2. 데이터 무손실 원칙
- 게스트 모드 → 로그인 시 로컬 데이터 자동 마이그레이션
- 캘린더 동기화 시 타임스탬프 기반 충돌 해결 (60초 grace period)
- 어떤 상황에서도 사용자 데이터 손실 없어야 함

### 3. AI는 저장 이후
- AI 분석은 저장 완료 후 비동기 처리 (300ms delay)
- 단일 sync 호출로 중복 이벤트 방지
- AI 실패 시 수동 데이터 그대로 유지 (폴백 모델 시도)

### 4. 캘린더 싱글톤 패턴
- `ensureBrioDoCalendar()` — Promise 싱글톤으로 레이스 컨디션 방지
- 캘린더 ID: localStorage 캐시 + Firestore `userSettings/{userId}` 이중 저장
- 404 발생 시 캐시 클리어 → 자동 재생성

---

## 프로젝트 구조

```
src/
├── App.jsx                    # 루트 컴포넌트, 상태 오케스트레이션
├── firebase.js                # Firebase + Gemini 초기화
├── calendar.js                # Google Calendar API (싱글톤, 페이지네이션)
├── db.js                      # IndexedDB CRUD
├── hooks/
│   ├── useAuth.js             # 로그인/로그아웃, OAuth 토큰 관리
│   ├── useTodosData.js        # 할 일 CRUD, Firestore 구독, 게스트 마이그레이션
│   ├── useCalendarNav.js      # 캘린더 뷰 네비게이션
│   ├── useTheme.js            # 테마/폰트/상태바 관리
│   └── useLanguage.js         # i18n (ko/en/ja/zh)
├── components/
│   ├── Header.jsx             # 날짜, 태그 필터, 캘린더 뷰 토글
│   ├── TodoList.jsx           # 할 일 목록 + 게스트 배너
│   ├── InputModal.jsx         # 수동 입력 폼
│   ├── SmartInputModal.jsx    # AI 자연어 + 음성 입력
│   ├── SettingsModal.jsx      # 테마/폰트/입력 모드/로그인 설정
│   └── CalendarConflictModal.jsx  # 레거시 (제거 후보)
├── constants/
│   └── translations.js        # 다국어 문자열 (ko/en/ja/zh)
└── utils/
    └── helpers.js             # formatTime 등 유틸리티
```

---

## 데이터 구조

### Todo 객체
```javascript
{
  id: string,                          // Firestore ID 또는 "guest_timestamp"
  uid: string,                         // Firebase 유저 ID (게스트는 없음)
  text: string,                        // 할 일 내용
  description: string,                 // 상세 설명 (선택)
  date: "YYYY-MM-DD",
  time: "HH:MM",                       // 24시간 형식
  tags: string[],                      // AI 자동 추출 태그
  priority: "low|medium|high|urgent",
  completed: boolean,
  googleEventId: string,               // Google Calendar 이벤트 ID (선택)
  createdAt: timestamp,
  updatedAt: timestamp,
}
```

---

## 코딩 컨벤션

- **TypeScript 없음** — 순수 JavaScript
- **테스트 없음** — 현재 테스트 프레임워크 미설정
- **클래스 컴포넌트 없음** — 모든 것은 함수형 + 훅
- **CSS 변수:** `--color-primary`, `--color-surface*` (Material Design 3 토큰)
- **파일명:** 컴포넌트 PascalCase, 훅 camelCase + use 접두사
- **비동기:** async/await + try-catch 필수 (Firebase/API 호출 시)
- **디바운스:** AI 태그 추출 1200ms, ref로 타이머 관리

---

## 빌드 & 배포

### 환경 파일 (gitignore — 각 PC에서 직접 생성)
```
.env                        # VITE_GEMINI_API_KEY, VITE_FIREBASE_*
android/app/google-services.json
android/local.properties    # sdk.dir=C\:\\Users\\<username>\\AppData\\Local\\Android\\Sdk
keystore.properties         # 릴리즈 서명 자격증명 (아래 내용으로 생성)
```

### keystore.properties 생성 (릴리즈 빌드 필수)
루트에 `keystore.properties` 파일을 생성 (절대 git 커밋 금지):
```properties
storeFile=blenddo-release.jks
storePassword=blenddo2024
keyAlias=blenddo
keyPassword=blenddo2024
```
> 키스토어 파일: `android/app/blenddo-release.jks` (git 제외, 별도 백업 필수)

### 빌드 순서 — 디버그 APK + Galaxy S24 자동 설치 (개발용 표준 파이프라인)

> **규칙**: `npx cap sync android`까지 완료하면 반드시 ADB 설치 + 앱 실행까지 자동 진행한다.
> 사용자가 별도 요청 없이도 이 파이프라인 전체를 실행하는 것이 기본 동작.

```bash
# 1. 웹 에셋 빌드
npm run build

# 2. Android 동기화
npx cap sync android

# 3. APK 빌드
cd android && ./gradlew assembleDebug

# 4. Galaxy S24 설치 (ADB 경로: D:\Android\Sdk, 한글 경로 인코딩 문제로 이 경로 사용)
/d/Android/Sdk/platform-tools/adb.exe -s R3CWC0KB53Z install -r "D:/Project/BlendDo/android/app/build/outputs/apk/debug/app-debug.apk"

# 5. 앱 실행
/d/Android/Sdk/platform-tools/adb.exe -s R3CWC0KB53Z shell am start -n app.briodo/.MainActivity
```

> ADB 경로 주의: `C:/Users/용은/...` 경로는 bash에서 한글 인코딩 오류 → `/d/Android/Sdk/...` 사용
> 디바이스 ID: Galaxy S24 = `R3CWC0KB53Z` (USB/무선 연결 시 동일)

### 빌드 순서 — 릴리즈 AAB (Play Store용)
```bash
npm run build
npx cap sync android
cd android && ./gradlew bundleRelease
# 출력: android/app/build/outputs/bundle/release/app-release.aab
```

### node_modules 패치 필요 (npm install 후 매번)
`@capacitor-community/speech-recognition` 및 `@codetrix-studio/capacitor-google-auth`의 `android/build.gradle`:
- `jcenter()` → `mavenCentral()`
- `proguard-android.txt` → `proguard-android-optimize.txt`

```bash
# 패치 명령 (npm install 후 실행)
sed -i "s/getDefaultProguardFile('proguard-android.txt')/getDefaultProguardFile('proguard-android-optimize.txt')/g" \
  node_modules/@capacitor-community/speech-recognition/android/build.gradle \
  node_modules/@codetrix-studio/capacitor-google-auth/android/build.gradle

sed -i "s/jcenter()/mavenCentral()/g" \
  node_modules/@codetrix-studio/capacitor-google-auth/android/build.gradle
```

> **TODO:** `patch-package`로 자동화 예정

### 새 PC 초기 설정 체크리스트
1. `git clone` 또는 `git pull`
2. `npm install --legacy-peer-deps`
3. 위 node_modules 패치 적용
4. `.env` 생성 (Firebase + Gemini 키)
5. `android/app/google-services.json` 복사
6. `android/local.properties` 생성 (Android SDK 경로)
7. `keystore.properties` 생성 (위 내용 참조) + `android/app/blenddo-release.jks` 복사
8. Claude Code 자동 승인 권한 설정 — `~/.claude/settings.json`을 아래 내용으로 생성:
   (`<username>`은 각 PC의 Windows 사용자명으로 교체)

```json
{
  "permissions": {
    "allow": [
      "Bash(npm run:*)",
      "Bash(npm install:*)",
      "Bash(npx cap:*)",
      "Bash(./gradlew:*)",
      "Bash(cd \"d:/Project/BrioDo/android\" && ./gradlew:*)",
      "Bash(git:*)",
      "Bash(\"C:/Users/<username>/AppData/Local/Android/Sdk/platform-tools/adb.exe\":*)",
      "Bash(sed -i:*)",
      "Bash(cp:*)",
      "Bash(mkdir:*)",
      "Bash(tail:*)",
      "Bash(keytool:*)",
      "Read(//c/Users/<username>/AppData/Local/Android/Sdk/**)",
      "Read(//c/Users/<username>/.claude/**)",
      "Read(//d/다운로드_Downloads/**)",
      "Skill(update-config)",
      "Skill(update-config:*)"
    ],
    "additionalDirectories": [
      "C:\\Users\\<username>\\.android",
      "C:\\Users\\<username>\\.claude",
      "d:\\다운로드_Downloads"
    ]
  }
}
```

### APK 서명
- `android/keystore/debug.keystore` — git에 포함된 공용 debug keystore
- 모든 PC에서 동일 서명 → 재설치 없이 업데이트 설치 가능

### Google 로그인 — SHA-1 핑거프린트 관리
Google 로그인은 앱 서명 SHA-1이 Firebase Console에 등록된 값과 일치해야 동작한다.
**증상:** 계정 선택 후 자동으로 닫히고 로그인이 완료되지 않음.

현재 등록된 SHA-1 (두 PC):
```
1D:09:7C:59:11:25:22:D5:C4:46:49:4E:5B:F9:73:40:CE:57:F4:7A  ← 이 PC keystore
C4:CF:5D:3D:01:DE:71:6A:63:DA:73:C5:36:34:C2:CD:9E:39:33:AE  ← 다른 PC keystore
```

**새 PC 추가 시 절차:**
1. 현재 keystore SHA-1 확인:
   ```bash
   keytool -list -v -keystore android/keystore/debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```
2. Firebase Console → 프로젝트 설정 → Android 앱 → 디지털 지문 추가
3. 새 `google-services.json` 다운로드 → `android/app/google-services.json` 교체
4. 빌드 후 재설치

---

## 중요 주의사항

1. **Calendar API 스코프 유지 필수** — 인증 변경 시 `https://www.googleapis.com/auth/calendar` 스코프 반드시 보존
2. **캘린더 ID는 이중 저장** — localStorage + Firestore 둘 다 업데이트
3. **OAuth 토큰 만료** — accessToken 1시간 만료, 401 처리 로직 주의
4. **랜덤 테마 대비 로직** — HSL 생성 시 접근성 대비율 보장 코드 수정 주의
5. **Google Cloud Console** — Calendar API는 기본 비활성화, 수동 활성화 필요
6. **SHA-1 불일치 → 로그인 무증상 실패** — 계정 선택 후 닫히면 SHA-1 미등록 의심. `google-services.json`에 해당 PC의 SHA-1이 있는지 확인

---

## 알려진 문제 / 한계

- node_modules 패치 수동 적용 필요 (patch-package 설정됨, npm install 후 자동 실행)
- 오프라인 큐 — 앱 강제 종료 시 미처리 항목 손실 가능성

---

## 다음 작업 후보

- [ ] Android 홈 화면 위젯
- [ ] iOS 지원
- [ ] F-Droid 배포

---

## 개발 히스토리

상세 세션별 개발 기록은 [PROJECT_HISTORY.md](PROJECT_HISTORY.md) 참조.
