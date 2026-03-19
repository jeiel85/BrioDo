# BlendDo (블렌두)

> 일상과 기술을 부드럽게 섞어주는(Blend) 스마트 할 일 관리 앱

AI 자연어 처리, Google 캘린더 양방향 동기화, 오프라인 우선 설계를 결합한 React + Capacitor 기반의 Android 앱입니다.

---

## 주요 기능

| 기능 | 설명 |
|------|------|
| **AI 자연어 입력** | "내일 오후 3시 팀 회의" → 날짜/시간 자동 추출, 태그 자동 추천 (Gemini 2.5 Flash) |
| **Google 캘린더 연동** | BlendDo 전용 캘린더 생성 및 양방향 동기화 |
| **오프라인 우선** | IndexedDB 로컬 저장 → 온라인 복구 시 Firestore 자동 동기화 |
| **게스트 모드** | 로그인 없이 앱 사용, 로그인 시 미완료 항목 자동 클라우드 업로드 |
| **다국어 지원** | 한국어 / 영어 / 일본어 / 중국어 (시스템 언어 자동 감지) |
| **동적 테마** | 라이트 / 다크 / 랜덤 HSL 테마, 안드로이드 상태바 자동 동기화 |
| **주간 캘린더 뷰** | 날짜 단위 / 전체 보기 전환, 무한 스와이프 스크롤 |
| **태그 필터링** | AI 자동 생성 태그 기반 필터 인터페이스 |

---

## 기술 스택

- **Frontend**: React 19 + Vite 8
- **Mobile**: Capacitor 8 (Android)
- **Auth**: Firebase Authentication + `@codetrix-studio/capacitor-google-auth`
- **Database**: Firebase Firestore + IndexedDB (`idb`)
- **AI**: Google Gemini AI (`@google/genai`, gemini-2.5-flash)
- **Calendar**: Google Calendar API v3
- **Sync**: 오프라인 작업 큐 (IndexedDB 기반 SyncQueue)

---

## 프로젝트 구조

```
src/
├── App.jsx                        # 루트 컴포넌트, 상태 관리 및 저장 로직
├── firebase.js                    # Firebase / Gemini AI 초기화
├── calendar.js                    # Google Calendar API 연동
├── db.js                          # IndexedDB CRUD (idb 라이브러리)
│
├── hooks/
│   ├── useAuth.js                 # Google 로그인/로그아웃, Firebase Auth 상태
│   ├── useTodosData.js            # Todos CRUD, Firestore 구독, 게스트 모드
│   ├── useCalendarNav.js          # 주간 달력 네비게이션 상태
│   ├── useTheme.js                # 테마/폰트 설정, 상태바 동기화
│   └── useLanguage.js             # 다국어 처리
│
├── components/
│   ├── Header.jsx                 # 헤더, 날짜 표시, 태그 필터, 뷰 전환
│   ├── TodoList.jsx               # 할 일 목록 (게스트 배너 포함)
│   ├── InputModal.jsx             # 할 일 추가/수정 모달
│   ├── SettingsModal.jsx          # 설정 모달
│   └── CalendarConflictModal.jsx  # 중복 캘린더 감지 시 해결 UI
│
├── constants/
│   └── translations.js            # ko / en / ja / zh 번역 문자열
│
└── utils/
    └── helpers.js                 # 공통 유틸 (formatTime 등)
```

---

## 설치 및 실행

### 1. 환경 변수 설정

루트에 `.env` 파일 생성 (`.gitignore`에 포함되어 있으므로 직접 작성 필요):

```env
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 2. 웹 개발 서버

```bash
npm install
npm run dev
```

### 3. Android 실기기 테스트 (ADB)

```bash
# 웹 에셋 빌드 → Android 동기화 → APK 빌드
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug

# ADB로 설치 및 실행
adb install -r app/build/outputs/apk/debug/app-debug.apk
adb shell am start -n io.blenddo.app/.MainActivity
```

> **주의**: `@codetrix-studio/capacitor-google-auth`는 Capacitor 6 peer dep 선언으로 인해 `--legacy-peer-deps`로 설치됨. `npm install` 후 Android `build.gradle`에서 `jcenter()` → `mavenCentral()` 수동 패치 필요.

---

## 핵심 아키텍처

### 인증 흐름

```
Android: @codetrix-studio/capacitor-google-auth
  → GoogleAuth.signIn() → { idToken, accessToken }
  → Firebase signInWithCredential()
  → accessToken을 localStorage에 저장 (Calendar API용)

Web: Firebase signInWithPopup()
  → oauthCredential.accessToken 저장
```

### 오프라인 동기화 흐름

```
사용자 입력
  → 즉시 IndexedDB 저장 (UI 즉시 반영)
  → 온라인이면 → Firestore 저장 + Google Calendar 동기화
  → 오프라인이면 → SyncQueue 대기 → 온라인 복구 시 자동 처리
```

### 게스트 → 로그인 마이그레이션

```
비로그인 → 할 일 추가 → IndexedDB에 uid 없이 저장 (id: "guest_타임스탬프")
  → 로그인 이벤트 감지 → 미완료 게스트 todos 자동 감지
  → Firestore에 uid 연결하여 업로드 → 로컬 항목 교체
```

---

## Google Cloud Console 설정

1. **OAuth 2.0 클라이언트 ID** (Android 앱 타입): SHA-1 인증서 지문 등록
2. **Google Calendar API** 명시적 활성화 필요 (기본 비활성화 상태)
3. **Authorized redirect URIs**: 웹 클라이언트 ID에 앱 스킴 등록

---

## 향후 개발 예정

- [ ] 알림/리마인더 (Capacitor LocalNotifications)
- [ ] 반복 일정 (매일/매주/매월)
- [ ] Google OAuth accessToken 자동 갱신 (현재 1시간 만료)
- [ ] 우선순위 레벨 / 하위 태스크(체크리스트)
- [ ] 검색 기능
- [ ] 안드로이드 홈 화면 위젯
- [ ] iOS 지원

자세한 개발 이력 및 트러블슈팅 기록은 [PROJECT_HISTORY.md](PROJECT_HISTORY.md)를 참고하세요.

---

*BlendDo — Blend your life, Do it smoothly.*
