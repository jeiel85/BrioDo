# BlendDo 프로젝트 이력 관리 (Project History)

본 문서는 BlendDo 프로젝트의 개발 과정, 주요 결정 사항, 실패 및 개선 사례를 기록하여 프로젝트의 방향성을 유지하기 위해 작성되었습니다.

## 📌 프로젝트 개요
- **이름**: BlendDo (블렌두) - *이전 명칭: Todoest*
- **목표**: 일상과 기술을 부드럽게 섞어주는 스마트 할 일 관리 앱
- **주요 기술 스택**:
  - **Frontend**: React (Vite)
  - **Backend/DB**: Firebase (Authentication, Firestore)
  - **Mobile**: Capacitor (Android)
  - **AI**: Google Gemini AI (2.5 Flash)
  - **Integration**: Google Calendar API
  - **Storage**: IndexedDB (Offline-first approach)

---

## ✅ 현재 구현 결과 (Implementation Results)

### 1. UI/UX 및 디자인 시스템
- **동적 테마 시스템**: 라이트, 다크, 시스템 기본 외에 **랜덤 HSL 테마** 지원. 배경색에 맞춰 안드로이드 상태 표시줄(Status Bar) 자동 동기화.
- **가변 폰트 크기**: 3단계 프리셋 버튼(작게/중간/크게) + 슬라이더(1~7단계) 조합. CSS `--font-scale` 변수로 앱 전체 텍스트에 일관 적용.
- **로그인 버튼 단일화**: Header/TodoList의 로그인 버튼 제거, 설정 화면에서만 노출 (클라우드 기능 설명 카드 + Google 로그인 버튼).
- **캘린더 뷰**: 주간 단위 스와이프 및 무한 스크롤 기능.
- **다국어 지원**: 한국어, 영어, 일본어, 중국어 지원 및 시스템 언어 자동 감지.

### 2. 스마트 기능 (AI)
- **Gemini AI 연동**: 자연어 입력을 분석하여 제목 정제, 날짜/시간 추출, 태그 자동 추천 기능 구현.
- **태그 필터링**: 사용 중인 태그를 자동으로 추출하여 필터링 인터페이스 제공.

### 3. 데이터 및 동기화
- **Offline-First**: IndexedDB를 활용하여 네트워크 연결 없이 즉시 데이터 읽기/쓰기 가능. 네트워크 복구 시 Firestore와 자동 동기화.
- **구글 캘린더 연동**: 'BlendDo' 전용 캘린더 생성 및 일정 양방향 동기화 (앱 일정 → 구글 캘린더 / 구글 캘린더 수정 사항 → 앱 반영).
- **중복 캘린더 자동 처리**: 동일 이름 캘린더 감지 시 첫 번째 캘린더를 자동 선택 (모달 없이 처리). 삭제된 캘린더 ID 캐시 감지 시 자동 초기화 후 재생성.
- **AI 우선 동기화**: 할 일 저장 시 Gemini AI 분석 완료 후 최종 데이터로 캘린더에 단 1회 동기화.

### 4. 인증 및 게스트 모드
- **네이티브 Google 로그인**: `@codetrix-studio/capacitor-google-auth` 플러그인으로 Calendar 스코프 포함 OAuth2 accessToken 획득.
- **게스트 모드**: 로그인 없이도 할 일 추가/관리 가능 (IndexedDB 로컬 저장). 로그인 전환 시 미완료 항목 자동 Firestore 마이그레이션.

---

## ❌ 실패 및 도전 과제 (Failures & Challenges)

### 1. 안드로이드 네이티브 인증 이슈
- **문제**: `@capacitor-firebase/authentication` 플러그인 사용 시 구글 캘린더 API 접근을 위한 `accessToken`과 `scope`를 안정적으로 가져오는 데 어려움이 있었음.
- **해결**: `@codetrix-studio/capacitor-google-auth`로 교체 (Capacitor 6 peer dep → `--legacy-peer-deps`로 설치, Android build.gradle 수동 패치 필요).

### 2. Firestore 초기 로딩 지연
- **문제**: 앱 실행 시 Firestore로부터 데이터를 가져올 때까지 빈 화면이 노출되는 문제.
- **해결**: IndexedDB를 도입하여 로컬 데이터를 즉시 노출하고 백그라운드에서 동기화하는 방식으로 개선.

### 3. 구글 캘린더 양방향 동기화 충돌
- **문제**: 앱과 캘린더에서 동시에 수정할 경우 데이터 충돌 위험 및 무한 루프 발생 가능성.
- **해결**: `updatedAt` 타임스탬프 비교 로직과 `B]` 접두사를 활용한 식별 절차 도입.

### 4. 캘린더 동기화 재로그인 후 중단 버그 (2026-03-19 수정)
- **문제**: 로그아웃 후 재로그인해도 Google Calendar 동기화가 작동하지 않는 현상.
- **원인**: `handleLogout`에서 `blenddo-calendar-id`(캘린더 ID 캐시)를 localStorage에서 삭제하지 않아, 재로그인 시 만료되거나 삭제된 캘린더 ID가 계속 사용됨.
- **해결**: 로그아웃 시 `googleAccessToken`과 함께 `blenddo-calendar-id`도 함께 삭제.

### 5. 다중 BlendDo 캘린더 생성 버그 (2026-03-19 수정)
- **문제**: 할 일 저장 시 Google Calendar에 BlendDo 캘린더가 최대 6개까지 중복 생성되는 현상.
- **원인 1**: `ensureBlendDoCalendar()`가 `checkConflict`, `fetchEventsFromGoogle`, `syncEventToGoogle` 등 여러 곳에서 동시에 호출되어 레이스 컨디션 발생.
- **원인 2**: 기존 `CALENDAR_CONFLICT` 분기가 `blenddo-calendar-id`를 localStorage에 저장하지 않아 싱글톤 프로미스 종료 후 재호출 시 또 다시 캘린더 목록 API를 요청함.
- **해결**: 싱글톤 프로미스 패턴 도입 + CALENDAR_CONFLICT 분기 제거 → 기존 BlendDo 캘린더 발견 시 첫 번째 것을 자동 선택 후 캐시.

### 6. 캘린더 일정 2개 중복 생성 버그 (2026-03-19 수정)
- **문제**: 할 일 저장 시 Google Calendar에 원본 텍스트 일정, AI 가공 텍스트 일정 총 2개가 생성되는 현상.
- **원인**: `syncEventToGoogle`이 저장 직후(원본 텍스트, POST)와 AI 분석 후(가공 텍스트, 이미 POST라 googleEventId 없어 또 POST)로 2회 호출됨.
- **해결**: AI 분석을 먼저 실행한 뒤 최종 데이터로 `syncEventToGoogle`을 단 1회만 호출.

### 7. 캘린더 캐시 무효화 미처리 (2026-03-19 수정)
- **문제**: Google에서 BlendDo 캘린더를 직접 삭제해도 앱에서 캘린더가 재생성되지 않는 현상.
- **원인**: `blenddo-calendar-id` 캐시를 사용하다가 POST 요청 시 404가 반환되어도 캐시를 초기화하지 않아 계속 실패.
- **해결**: `syncEventToGoogle`에서 POST 404 수신 시 `blenddo-calendar-id` 캐시 삭제 → `ensureBlendDoCalendar` 재호출 → 새 캘린더 생성 후 이벤트 재시도.

---

## 🔄 선회 기록 (Pivots & Direction Changes)

### 1. 프로젝트 리브랜딩 (Todoest → BlendDo)
- 단순 할 일 목록 앱에서 '일상의 조화'를 강조하는 브랜드 가치를 반영하여 명칭 변경.

### 2. 인증 전략 전환 (Pure Native → Hybrid → Native with Calendar Scope)
- 초기 Web Redirect 방식 시도 → Android WebView 미동작으로 실패.
- 최종: `@codetrix-studio/capacitor-google-auth`로 네이티브 로그인 + Calendar 스코프 획득.

### 3. AI 모델 최적화
- 복합적인 분석을 위해 `gemini-2.5-flash` 모델을 사용하여 속도와 분석 정확도의 균형을 맞춤.

### 4. 게스트 모드 도입 (2026-03-19)
- 초기 설계는 로그인 필수였으나, UX 개선을 위해 비로그인 사용자도 로컬에서 앱 사용 가능하도록 변경.
- 로그인 시 미완료 게스트 todos 자동 업로드로 데이터 연속성 확보.

---

## 🚀 향후 방향성 및 주의 사항
- **방향성 고수**: "오프라인 우선"과 "AI 자연어 처리"가 이 앱의 핵심 가치임.
- **인증 유지**: 인증 방식 변경 시 구글 캘린더 권한(`https://www.googleapis.com/auth/calendar`)이 유지되는지 반드시 확인해야 함.
- **UI 일관성**: 랜덤 테마 생성 시 가독성(대비율)을 유지하도록 계산 로직이 설계되어 있으므로 이를 훼손하지 말 것.
- **node_modules 패치 주의**: `@codetrix-studio/capacitor-google-auth/android/build.gradle`의 jcenter→mavenCentral, proguard 파일명 패치는 `npm install` 시 초기화됨. `patch-package` 도입 고려 필요.

---

## 🗂️ 미구현 / 향후 개발 요건

### 높은 우선순위
- [ ] **알림/리마인더**: 일정 시간에 푸시 알림 발송 (Capacitor LocalNotifications 활용)
- [ ] **반복 일정**: 매일/매주/매월 반복 옵션
- [ ] **Google OAuth 토큰 자동 갱신**: accessToken 만료(1시간) 시 재로그인 없이 자동 갱신

### 중간 우선순위
- [ ] **하위 태스크(체크리스트)**: 큰 할 일 하위 항목 분해
- [ ] **검색 기능**: 제목/태그/날짜 범위 검색
- [ ] **위젯**: 안드로이드 홈 화면 위젯
- [ ] **바텀 내비게이션**: Today / Lists / Progress / Settings 탭 구조 (Aeon Focus 디자인 참고)
- [ ] **Daily Momentum 게이지**: 오늘 완료율 원형 진행률 표시 (홈 상단)
- [ ] **통계 화면**: 주간 완료 수, Deep Work 세션, 성취 배지

### 낮은 우선순위
- [ ] **카테고리 관리 화면**: Collection Cards (Work/Personal/Shopping + 이미지 Hero)
- [ ] **Focus "Orb"**: tertiary-container 색상의 플로팅 집중 지표 위젯
- [ ] **헤더 고도화**: 사용자 아바타 + 검색 아이콘 (TopAppBar)
- [ ] **iOS 지원**: Capacitor iOS 빌드 및 Apple 로그인 연동
- [ ] **공유 기능**: 특정 할 일을 다른 사람과 공유
- [ ] **patch-package 도입**: node_modules 패치 영구 적용

---

## 📝 최근 활동 로그 (Recent Activity)

- **2026-03-20** (세션 5):
  - **스마트 입력 모드 도입**: 단일 textarea → 저장 후 Gemini AI 비동기 분석. FAB에서 스마트/수동 모드 전환. 설정에서 모드 토글(기본: 스마트).
  - **수동 입력 AI 제거**: 기존 + 버튼 흐름에서 AI 분석 완전 분리. 편집 시 AI 호출도 제거 (날짜 덮어쓰기 버그 수정).
  - **캘린더 다중기기 공유**: `blenddo-calendar-id`를 Firestore `userSettings/{userId}`에 저장하여 디바이스 간 공유. localStorage는 캐시 역할만.
  - **캘린더 API 페이지네이션**: `calendarList` 250개 한계 극복 — `nextPageToken` 기반 `fetchAllCalendars` 함수 추가.
  - **마이크(Web Speech API) 지원**: AndroidManifest에 `RECORD_AUDIO` 권한 추가 + MainActivity `WebChromeClient.onPermissionRequest` 오버라이드로 WebView 마이크 자동 승인.
  - **AI fallback 강화**: `generateWithFallback`에서 에러 종류(quota/모델명 오류/네트워크 등) 무관하게 항상 다음 모델로 시도하도록 단순화.
  - **디자인 가이드 추가**: `assets/design/stitch_add_edit_task.zip` — 할 일 추가/편집 화면 UI 가이드 (Stitch by Google 기반).

- **2026-03-20** (세션 4):
  - **UI/UX 전면 리뉴얼 — "The Mindful Curator"** (Aeon Focus + DESIGN.md 기반):
    - `index.css` 전면 교체: Manrope + Inter 듀얼 폰트, Material Design 기반 tonal surface 계층 (`--color-surface`, `--color-surface-container-*`), 구 토큰(`--primary`, `--bg-color` 등) 완전 제거.
    - 글래스모피즘 헤더 (`backdrop-filter: blur(12px)`, `@supports` 조건부, `--header-glass-bg` 변수).
    - 1px 구분선 전면 제거 → tonal 카드 방식 (`border-radius: 1rem`, tonal background).
    - Gradient FAB + 저장 버튼 + 날짜 active 항목 (`linear-gradient(135deg, --color-primary, --color-primary-end)`).
    - 체크박스 완료 색상 → `--color-secondary` (녹색 계열).
    - **Priority 필드 신규 추가**: `low / medium / high / urgent` 4단계. 투두 왼쪽 3px 컬러 바(priority indicator)로 시각화.
    - `InputModal.jsx`: drag handle pill + priority segmented picker (4버튼) 추가, 인라인 하드코딩 스타일 CSS 변수로 전환.
    - `TodoList.jsx`: priority indicator 렌더링 추가 (`[컬러바] [체크박스] [내용]` flex row).
    - `Header.jsx`: BlendDo 타이틀 Manrope 800 적용.
    - `SettingsModal.jsx`: 설정 타이틀 Manrope 800, 구 토큰명 전면 교체, 깨진 테스트 버튼 코드 제거, 로그인 카드 `.login-card` CSS 클래스로 전환.
    - `useTheme.js`: `props` 배열 신규 토큰명으로 교체, `generateRandomTheme` HSL 기반 신규 토큰 구조로 재작성 (`--header-glass-bg` 포함).
    - `App.jsx`: priority 필드 `newTodo` 초기값/수정/저장/리셋에 추가, 로딩 스피너 토큰 교체.

- **2026-03-19** (세션 3):
  - **로그인 버튼 단일화**: Header 우측 상단, TodoList 중간 배너의 로그인 버튼 제거. 설정 화면에 클라우드 기능 설명 카드 + Google 로그인 버튼으로 통합.
  - **글자 크기 기능 전면 개편**: 기존 3버튼 클래스 방식 → 프리셋 버튼(2/4/6) + 슬라이더(1~7) 방식. `--font-scale` CSS 변수를 앱 전체 텍스트 요소에 확대 적용.
  - **캘린더 다중 생성 버그 근본 수정**: 싱글톤 프로미스 패턴 도입, CALENDAR_CONFLICT 분기 제거, AI 분석 우선 실행 후 단일 동기화로 변경 → 캘린더 1개, 일정 1개 생성 확인.
  - **캘린더 캐시 무효화 처리**: POST 404 시 `blenddo-calendar-id` 초기화 후 재생성 로직 추가.
  - **ADB 환경 확정**: 한글 사용자명으로 인한 경로 인코딩 문제 → `/d/Android/Sdk/platform-tools/adb.exe` 절대경로 사용.

- **2026-03-19** (세션 2):
  - **캘린더 동기화 버그 수정**: 로그아웃 시 `blenddo-calendar-id` 미삭제로 재로그인 후 캘린더 동기화 실패하는 버그 수정.
  - **게스트 모드 구현**: 비로그인 사용자도 할 일 추가/관리 가능. 로그인 전환 시 미완료 항목 자동 Firestore 마이그레이션.
  - `TodoList.jsx`: 비로그인 시 전체 차단 → 상단 로그인 유도 배너로 변경, FAB 항상 표시.
  - 개발 워크플로우 정립: 소스 변경 즉시 커밋+푸시, PROJECT_HISTORY.md 이력 관리.

- **2026-03-19** (세션 1):
  - 안드로이드 디버깅을 위한 환경 점검 및 빌드 수행.
  - **인증 방식 최종 확정**: `@codetrix-studio/capacitor-google-auth`로 네이티브 Calendar 스코프 포함 로그인 성공.
  - Google Calendar API 활성화 (Cloud Console에서 수동 활성화 필요했음).
  - 중복 BlendDo 캘린더 감지 및 `CalendarConflictModal` 구현.
  - `.gitignore`에 `.claude/` 추가.
  - `PROJECT_HISTORY.md` 최초 생성.

---
*최종 업데이트: 2026-03-20 (세션 5)*
