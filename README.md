# BlendDo (블렌두)

> **Blend your life, Do it smoothly.**
> 일상과 AI를 자연스럽게 섞어주는 스마트 할 일 관리 앱

<br>

## 소개

BlendDo는 AI 자연어 처리, Google 캘린더 양방향 동기화, 잠금화면 위젯을 결합한 Android 할 일 관리 앱입니다.
음성으로 말하거나 자연어로 입력하면 AI가 날짜·시간·태그를 자동으로 추출해 등록하고,
Google 캘린더와 실시간으로 동기화하며, 심지어 잠금화면에서도 할 일을 확인하고 편집할 수 있습니다.

<br>

## 주요 기능

### AI 스마트 입력
| 기능 | 설명 |
|------|------|
| **자연어 처리** | "내일 오후 3시 팀 회의" → 날짜·시간·태그 자동 추출 (Gemini 2.5 Flash) |
| **음성 인식** | 네이티브 Android 음성 인식, Samsung Galaxy S24 최적화 |
| **멀티 모델 폴백** | 기본 모델 실패 시 자동 대체 모델 시도 |
| **AI 일일 제한** | 기기당 10회/일, 자정 초기화, 사용량 실시간 표시 |

### 할 일 관리
| 기능 | 설명 |
|------|------|
| **오프라인 우선** | IndexedDB 로컬 저장 → 온라인 복귀 시 Firestore 자동 동기화 |
| **게스트 모드** | 로그인 없이 사용, 로그인 시 미완료 항목 자동 클라우드 업로드 |
| **태그 자동 추출** | AI가 콘텐츠 분석 후 태그 자동 생성 |
| **우선순위** | low / medium / high / urgent 4단계 |
| **태그 필터링** | AI 태그 기반 다중 필터 |

### Google 캘린더 연동
| 기능 | 설명 |
|------|------|
| **전용 캘린더 자동 생성** | "BlendDo" 캘린더 자동 생성, 삭제 시 자동 복구 |
| **양방향 동기화** | 할 일 추가/수정/삭제 → Calendar 이벤트 실시간 반영 |
| **다기기 공유** | Google 계정 기반 멀티 기기 동기화 |
| **연동 상태 표시** | 설정에서 동기화 중인 캘린더 이름 직접 확인 |

### 잠금화면 위젯
| 기능 | 설명 |
|------|------|
| **할 일 표시** | 오늘 / 전체 선택, 완료 포함 여부 설정 |
| **완료 접기/펼치기** | 미완료 우선 표시 → 완료 항목은 화살표 버튼으로 접기/펼치기 |
| **인라인 편집** | 점(•) 탭 = 완료 토글, 텍스트 탭 = 잠금화면에서 직접 수정 |
| **빠른 추가** | 잠금화면에서 바로 할 일 추가 |
| **8종 퀵 버튼** | 플래시, 카메라, 계산기, 음악 재생, 알람, 스톱워치, 할 일 추가, QR 중 최대 6개 선택 |
| **글자 크기** | 소 / 중 / 대 3단계 슬라이더 |
| **미리보기** | 설정 화면에서 실시간 미리보기 |

### 테마 & 개인화
| 테마 | 설명 |
|------|------|
| **라이트** | 고대비 밝은 테마 |
| **다크** | 고대비 어두운 테마 |
| **시스템** | Android 시스템 다크 모드 자동 연동 |
| **랜덤** | 실행마다 새로운 HSL 색상 조합 자동 생성 |
| **Material You** | Google Material Design 3 Baseline Purple 팔레트 |

- 안드로이드 상태바 색상 자동 동기화
- 폰트 크기 7단계 세밀 조정
- 4개 언어 지원: 한국어 / English / 日本語 / 中文

### 업적 시스템
- 총 106개 업적 (사용 패턴 기반 자동 달성)
- confetti 애니메이션이 있는 업적 달성 모달
- Firestore 기반 다기기 동기화

<br>

## 기술 스택

| 영역 | 기술 |
|------|------|
| **프론트엔드** | React 19 + Vite 8 |
| **모바일 래핑** | Capacitor 8 (Android) |
| **인증** | Firebase Authentication + `@codetrix-studio/capacitor-google-auth` |
| **클라우드 DB** | Firebase Firestore |
| **로컬 DB** | IndexedDB (`idb`) — 오프라인 우선 |
| **AI** | Google Gemini (`gemini-2.5-flash-lite`, 멀티 모델 폴백) |
| **음성** | `@capacitor-community/speech-recognition` |
| **캘린더** | Google Calendar API v3 |
| **CSS** | 커스텀 CSS + Material Design 3 토큰 |
| **폰트** | Manrope + Inter |

<br>

## 프로젝트 구조

```
src/
├── App.jsx                    # 루트 컴포넌트, 상태 오케스트레이션
├── firebase.js                # Firebase + Gemini 초기화
├── calendar.js                # Google Calendar API (싱글톤, 페이지네이션)
├── db.js                      # IndexedDB CRUD
│
├── hooks/
│   ├── useAuth.js             # 로그인/로그아웃, OAuth 토큰 관리
│   ├── useTodosData.js        # 할 일 CRUD, Firestore 구독, 게스트 마이그레이션
│   ├── useAchievements.js     # 업적 시스템 (106개, Firestore 동기화)
│   ├── useCalendarNav.js      # 캘린더 뷰 네비게이션
│   ├── useTheme.js            # 테마/폰트/상태바 관리
│   └── useLanguage.js         # i18n (ko/en/ja/zh)
│
├── components/
│   ├── Header.jsx             # 날짜, 태그 필터, 캘린더 뷰 토글
│   ├── TodoList.jsx           # 할 일 목록 + 게스트 배너
│   ├── InputModal.jsx         # 수동 입력 폼
│   ├── SmartInputModal.jsx    # AI 자연어 + 음성 입력
│   ├── LockScreenView.jsx     # 잠금화면 위젯 UI
│   └── SettingsModal.jsx      # 테마/폰트/입력 모드/로그인 설정
│
├── constants/
│   └── translations.js        # 다국어 문자열 (ko/en/ja/zh)
│
└── utils/
    └── helpers.js             # formatTime 등 유틸리티
```

<br>

## 아키텍처 핵심 원칙

### 오프라인 우선
```
사용자 입력
  → 즉시 IndexedDB 저장 (UI 즉시 반영)
  → 온라인이면 → Firestore 저장 + Google Calendar 동기화
  → 오프라인이면 → SyncQueue 대기 → 온라인 복귀 시 자동 처리
```

### 인증 흐름
```
Android: @codetrix-studio/capacitor-google-auth
  → GoogleAuth.signIn() → { idToken, accessToken }
  → Firebase signInWithCredential()
  → accessToken을 localStorage에 저장 (Calendar API용)
```

### 게스트 → 로그인 마이그레이션
```
비로그인 → 할 일 추가 → IndexedDB에 uid 없이 저장 (id: "guest_타임스탬프")
  → 로그인 이벤트 감지 → 미완료 게스트 todos 자동 감지
  → Firestore에 uid 연결하여 업로드 → 로컬 항목 교체
```

<br>

## 설치 및 실행

### 1. 환경 변수 설정

루트에 `.env` 파일 생성:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 2. 의존성 설치

```bash
npm install --legacy-peer-deps
```

> `patch-package`가 `postinstall` 훅으로 자동 실행되어 node_modules 패치 적용

### 3. 웹 개발 서버

```bash
npm run dev
```

### 4. Android APK 빌드 및 설치

```bash
# 웹 에셋 빌드 → Android 동기화 → APK 빌드
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug

# ADB로 설치 및 실행
adb install -r app/build/outputs/apk/debug/app-debug.apk
adb shell am start -n biz.todoest.app/.MainActivity
```

<br>

## Google Cloud Console 설정

1. **OAuth 2.0 클라이언트 ID** (Android 앱 타입): SHA-1 인증서 지문 등록
2. **Google Calendar API** 명시적 활성화 필요 (기본 비활성화 상태)
3. 새 PC 추가 시 SHA-1 확인 후 Firebase Console에 디지털 지문 추가 → `google-services.json` 재다운로드

<br>

## 향후 개발 예정

- [ ] 로컬 푸시 알림 (Capacitor LocalNotifications)
- [ ] 반복 할일 (매일/매주/매월)
- [ ] Google OAuth accessToken 자동 갱신
- [ ] 검색 기능 (제목/태그/날짜 범위)
- [ ] Android 홈 화면 위젯
- [ ] iOS 지원

자세한 개발 이력 및 트러블슈팅 기록은 [PROJECT_HISTORY.md](PROJECT_HISTORY.md)를 참고하세요.

---

*BlendDo — Blend your life, Do it smoothly.*
