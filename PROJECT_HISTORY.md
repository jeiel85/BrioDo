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
- **"The Mindful Curator" UI 리뉴얼** (`feature/curator-ui-renewal` 브랜치, 테스트 중):
  - **4탭 바텀 내비게이션**: 오늘/할일/컬렉션/통계. 설정은 헤더 상단 우측 아이콘으로 이동. CSS grid `repeat(4, 1fr)` 동일 간격.
  - **CollectionsScreen**: 태그별 컬렉션 카드 그리드, 히어로 카드 + SVG 도넛 링, 7색 액센트 자동 배정.
  - **StatsScreen**: 연속 달성 스트릭, 오늘/주간/전체 완료 수, 최근 완료 8개, 완료 링 SVG(130px).
    - 업적 3종: 🔥 연속 달성(streak ≥ 3일) / 📥 인박스 제로(오늘 할일 전부 완료) / ⚡ 집중 모드(전체 완료 ≥ 10개)
  - **Momentum Orb**: 헤더 우상단 80px 원형 진행률. 텍스트 수직 정렬 수정.
  - **할일 탭**: 전체 미완료 할일 날짜별 그룹 표시 + 완료됨 섹션.
  - **태그 필터**: date 뷰에서 선택 날짜의 할일 태그만 표시.
  - **Deep Work Pulse 통합**: 주간 날짜 스트립 카드 상단에 활동 미니 바 내장.
  - **FAB**: 로그인 여부에 따라 스마트(✨) / 수동(+) 입력 분기.
  - **인앱 브라우저 이벤트 차단**: `user-select: none; -webkit-touch-callout: none` 전체 적용.

### 2. 업적 시스템
- **50개 업적 정의** (`ACHIEVEMENTS.md` 별도 관리): 스트릭, 완료 횟수, 태그, 우선순위, AI 사용, 캘린더 연동 등 13개 카테고리. 난이도 1~10 등급.
- **`useAchievements.js` 훅**: 전체 업적 달성 체크 로직, localStorage 기반 달성 내역 관리, 큐 기반 언락 모달 시스템(여러 업적 동시 달성 시 순차 표시), 첫 마운트 조용한 초기화(앱 첫 실행 시 모달 미표시).
- **업적 언락 모달** (`AchievementUnlockModal.jsx`): 파티클 버스트 + 아이콘 바운스 + 골드 글로우 애니메이션. 4초 후 자동 닫힘.
- **업적 전체보기 모달** (`AchievementsModal.jsx`): 바텀시트, 전체/달성/미달성 필터 탭, 카테고리 그룹, 잠긴 업적은 `??? (잠김)` 표시 → 탭 시 상세 공개(서프라이즈 디스커버리).
- **통계 화면 업적 배지**: 달성 업적 중 난이도 높은 순 상위 3개 표시 + 업적 더보기 버튼.
- **알림 센터 (전구 아이콘)**: 헤더 상단에 전구 아이콘 추가. 새 업적 달성 시 빨간 뱃지 표시. `NotificationsModal` 경유 후 업적 목록으로 이동.
- **Engagement 트래커**: 앱 접속 횟수/연속일, AI 사용, 음성 입력, 검색, 컬렉션 방문 자동 집계 → 관련 업적 달성 조건으로 활용.
- **Firestore 클라우드 동기화**: 로그인 시 `userSettings/{uid}`에서 달성 내역 복원. 신규 달성 시 클라우드 백업.

### 3. 스마트 기능 (AI)
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
- [x] **알림/리마인더**: 일정 시간에 푸시 알림 발송 (Capacitor LocalNotifications 활용) — 세션 7 완료
- [x] **반복 일정**: 매일/매주/매월 반복 옵션 — 세션 8 완료
- [x] **검색 기능**: 제목/태그/날짜 범위 검색 — 세션 8 완료
- [x] **하위 태스크(체크리스트)**: 큰 할 일 하위 항목 분해 — 세션 8 완료
- [ ] **Google OAuth 토큰 자동 갱신**: accessToken 만료(1시간) 시 재로그인 없이 자동 갱신

### 중간 우선순위
- [x] **바텀 내비게이션**: 오늘/할일/컬렉션/통계 4탭 (설정은 헤더 아이콘) — 세션 9~10 완료
- [x] **Daily Momentum 게이지**: 헤더 우상단 원형 완료율 Orb — 세션 9 완료
- [x] **통계 화면**: 스트릭, 주간 완료 수, 성취 배지 — 세션 9 완료
- [x] **카테고리 관리 화면**: 태그별 Collection Cards + 도넛 링 — 세션 9 완료
- [ ] **위젯**: 안드로이드 홈 화면 위젯

### 낮은 우선순위
- [ ] **Focus "Orb"**: tertiary-container 색상의 플로팅 집중 지표 위젯
- [ ] **iOS 지원**: Capacitor iOS 빌드 및 Apple 로그인 연동
- [ ] **공유 기능**: 특정 할 일을 다른 사람과 공유
- [x] **patch-package 도입**: node_modules 패치 영구 적용
- [x] **업적 시스템**: 50개 업적 정의, 언락 모달, 알림 센터, 통계 배지 — 세션 12~13 완료

---

## 📝 최근 활동 로그 (Recent Activity)

- **2026-03-25** (세션 13 — 업적 시스템 연동 고도화 및 브랜치 정리):
  - **앱 포그라운드 복귀 시 오늘 탭 자동 리셋**: `CapApp.addListener('appStateChange')` 리스너 추가. 앱이 백그라운드에서 포그라운드로 복귀할 때(`isActive === true`) 항상 `viewMode='date'`로 복귀하고 날짜를 오늘로 리셋.
  - **알림 센터 NotificationsModal 신규**: 전구 아이콘 탭 시 즉시 업적 목록으로 이동하는 대신 `NotificationsModal` 중간 화면 추가. 미읽은 알림 목록 확인 후 업적 더보기로 이동 가능.
  - **Engagement 추적 강화**: `trackEngagement`를 App.jsx 전역에 연결.
    - 앱 실행 횟수(`totalOpens`), 접속 연속일(`appStreak`) — 앱 시작 시 자동 계산.
    - 검색 기능 사용(`searchUsed`) — `setSearchQuery` 호출 시.
    - AI 입력 사용(`aiUsed`, `aiTasks`) — `handleSmartSave` 호출 시.
    - 컬렉션 화면 방문(`collectionVisited`) — `viewMode === 'lists'` 전환 시.
  - **AndroidManifest 확인**: `MAIN` / `LAUNCHER` intent-filter 정상 설정 확인. 별도 수정 불필요.
  - **feature/curator-ui-renewal → main 머지 완료**: 브랜치 작업 모두 main에 반영. 이후 작업은 main 기준으로 진행.

- **2026-03-24** (세션 12 — 업적 시스템 구현):
  - **업적 추적 로직(js)**: `useAchievements.js` 내에 정의된 50개 업적(`D1..D6`, `W1..W5`, `R1..R4`, `T1..T4`, `ST1..ST4`, `P1..P4`, `AI1..AI4`, `CAL1..CAL2`, `N1..N2`, `E1..E7`, `SP1..SP3`)의 트리거 조건(`check()`)을 모두 채워 넣음.
  - **데이터 모델 반영**: `useTodosData`의 `toggleComplete`에서 `completedAt` 타임스탬프를 부여하도록 구조화하여 시간 판별(스피드런, 얼리버드 등) 지원.
  - **사용량 지표 (Engagement)**: `App.jsx` 내부에서 `trackEngagement` 훅을 호출하여 앱 실행 횟수(`totalOpens`), 접속 연속일(`appStreak`), 검색 기능 사용, AI 및 음성 입력 사용 데이터를 감정하도록 연결.
  - **오프라인 큐**: `completedAt`과 트래킹 요소가 오프라인에서도 작동하도록 `addSyncQueue`에 페이로드 갱신.
  - **Firestore 동기화**: 앱 재설치 시 데이터 유실 방지를 위해 로그인이 감지되면 `userSettings/{uid}`에서 달성된 `unlockedIds`와 트래커를 불러와 로컬 스토리지와 동기화(`union`). 신규 달성 시 Cloud Firestore로 백업.

- **2026-03-24** (세션 11 — 기타 기능 및 유지보수):
  - **patch-package 도입**: 매번 번거롭게 진행하던 `@capacitor-community/speech-recognition` 및 `@codetrix-studio/capacitor-google-auth` 플러그인의 `android/build.gradle` 다운로드 시 발생하는 오류 패치 자동화 (npx patch-package 적용).
  - **Google OAuth 토큰 자동 갱신**: 앱에서 구글 캘린더 접근 토큰의 만료 시간을 추적하여 백그라운드에서 자동 재갱신 (`GoogleAuth.refresh()` 결과 다양성 대응).

- **2026-03-24** (세션 10 — UX 개선 및 버그 수정):
  - **할일 탭 신규**: 바텀 내비에서 설정 제거 → `할일(viewMode=all)` 탭 추가. 전체 미완료+완료 할일 날짜별 그룹 표시.
  - **설정 버튼 헤더 이동**: 헤더 상단 검색 버튼 오른쪽에 설정 아이콘 배치.
  - **태그 필터 버그 수정**: date 뷰에서 선택 날짜의 할일 태그만 표시 (이전: 전체 할일 태그 표시).
  - **할일 탭 완료됨 표시 수정**: `showAllIncomplete` 브랜치의 early return으로 완료 섹션이 렌더링 안 되던 버그 수정.
  - **Momentum Orb 크기 개선**: SVG 64×64 r=24 → 80×80 r=32로 확대. 텍스트 여백 확보.
  - **통계 완료율 링 크기 개선**: SVG 100×100 r=36 → 130×130 r=48로 확대.

- **2026-03-24** (세션 9 — "The Mindful Curator" UI 리뉴얼):
  - **작업 브랜치**: `feature/curator-ui-renewal` — main 머지 전 테스트 중.
  - **인앱 브라우저 이벤트 차단**: `body`에 `user-select: none; -webkit-touch-callout: none; touch-action: manipulation` 적용. 텍스트 길게 누름 시 컨텍스트 메뉴 차단.
  - **바텀 내비게이션 재구성** (`BottomNav.jsx` 신규):
    - 4탭(Today/Lists/Progress/Settings) CSS grid `repeat(4, 1fr)` 동일 간격.
    - FAB을 BottomNav에서 분리 → `App.jsx`로 이동, 뷰별 표시 제어.
  - **비로그인 시 스마트 입력 차단**: FAB에서 `user ? inputMode : 'manual'` 분기. 비로그인 상태에서 ✨ 버튼 클릭 불가.
  - **CollectionsScreen.jsx 신규**: 태그별 컬렉션 카드 그리드. 히어로 카드(r=28 SVG 도넛 링, 완료율 표시). 7색 액센트 해시 자동 배정. 체크박스 + 편집 클릭 지원.
  - **StatsScreen.jsx 신규**: `calcStreak` 연속 달성일 계산. 오늘/주간/전체 완료 통계. 성취 뱃지(🔥 streak≥3, 📥 inbox zero, ⚡ allDone≥10). r=36 완료율 링. 최근 완료 항목 8개.
  - **Header.jsx 고도화**:
    - Deep Work Pulse 차트를 별도 섹션에서 **주간 날짜 스트립으로 통합**: 각 날짜 카드 상단에 5px 미니 바 내장. 높이=할 일 수, 그라디언트(primary→gray)=완료율. 중복 주간 표시 제거.
    - viewMode별 인삿말/서브타이틀 분기 (date/lists/progress).
    - Momentum Orb 텍스트 수직 정렬 수정: `momentum-text` 래퍼 + `gap: 2px`, `margin-top` 제거.
  - **App.jsx 확장**: `viewMode` `'all'` → `'lists'` / `'progress'` 로 교체. `weeklyPulse` useMemo 추가 (최근 7일 활동량 배열). CollectionsScreen / StatsScreen 조건부 렌더링.
  - **translations.js**: lists/progress/stats 관련 키 추가 (ko/en/ja/zh 4개 언어).
  - **Android 자동생성 파일 gitignore 처리**: `capacitor.build.gradle`, `capacitor.settings.gradle`을 `.gitignore`에 추가 + `git rm --cached`로 추적 제거.

- **2026-03-20** (세션 7 — PC A):
  - **브랜치 전략 수립**: `main` (안정/릴리즈) / `develop` (개발 중) 분리. debug 빌드에 `.dev` suffix + `BlendDo_Dev` 앱 이름 적용 → 폰에 두 앱 동시 설치 가능.
  - **릴리즈 서명 설정**: `blenddo-release.jks` 키스토어 생성, `build.gradle`에 `signingConfigs.release` 추가. `assembleRelease`로 서명된 APK 배포 가능. 키스토어는 `.gitignore` 처리.
  - **알림/리마인더 기능 구현** (`@capacitor/local-notifications@8.0.2`):
    - `useNotifications.js` 신규 생성: `scheduleNotification`, `cancelNotification`, `initNotificationChannels`
    - 알림 시점: 정각 / 10분 전 / 30분 전 / 1시간 전 버튼 선택 방식 (`reminderOffset` 필드)
    - 설정에서 기본 알림 오프셋 및 종일 일정 기본 알림 시간(기본 오전 9시) 관리. 각 일정마다 개별 변경 가능.
    - 우선순위별 알림 채널 4개 분리: `low`(조용), `medium`(진동), `high`(진동+LED), `urgent`(진동+LED 빨간 플래시)
    - 알림 body에 일정 시간 및 상세내용 포함
    - 시간 없는 종일 일정: `allDayReminderTime`(localStorage) 기준 알림
    - 완료 처리 시 알림 자동 취소, 완료 취소 시 재스케줄
    - 삭제 시 알림 취소
    - AndroidManifest 권한 추가: `SCHEDULE_EXACT_ALARM`, `POST_NOTIFICATIONS`, `RECEIVE_BOOT_COMPLETED`
  - **develop → main 머지** 및 릴리즈 APK 폰 설치 완료.

- **2026-03-22** (세션 7 — PC B):
  - **새 PC 개발 환경 인계 작업** (이전 세션 컨텍스트 복구 후 이어서 진행).
  - **Google 로그인 불동작 원인 진단 및 해결**:
    - 증상: 계정 선택까지는 표시되나 이후 무증상으로 닫힘 (로그인 실패).
    - 원인: 이전 세션에서 이 PC의 `debug.keystore`를 git에 커밋했으나, Firebase Console에는 다른 PC의 SHA-1만 등록되어 있어 Google OAuth 서버 측 검증 실패.
      - 커밋된 keystore SHA-1: `1D:09:7C:59:11:25:22:D5:C4:46:49:4E:5B:F9:73:40:CE:57:F4:7A`
      - Firebase에 등록된 SHA-1: `C4:CF:5D:3D:01:DE:71:6A:63:DA:73:C5:36:34:C2:CD:9E:39:33:AE`
    - 해결: Firebase Console에서 이 PC의 SHA-1 추가 등록 → 새 `google-services.json` 다운로드 → 교체 후 빌드.
  - **자연어 처리 불동작** — 로그인 실패의 2차 문제로 확인.
  - **`google-services.json` 업데이트**: 두 PC의 SHA-1 모두 포함된 파일로 교체.
  - **빌드 & 갤럭시 설치 완료**: 정상 빌드 확인 후 ADB 무선으로 Galaxy 기기에 재설치.
  - **앱 자동 실행 추가**: 설치 후 `adb shell am start -n biz.todoest.app/.MainActivity`로 즉시 실행되도록 빌드 프로세스에 추가.
  - **비로그인 시 AI 입력 차단**: 로그인 없이 ✨ AI 입력 버튼 클릭 시 설정 화면(로그인 유도)으로 연결.
  - **Claude Code 자동 승인 설정 정리**: `~/.claude/settings.json` 22개 → 17개로 간소화.
  - **CLAUDE.md 업데이트**: SHA-1 핑거프린트 관리 섹션 추가, 자동 승인 설정 JSON 명시.
  - **공용 debug keystore**: `android/keystore/debug.keystore` 커밋 — 멀티 PC 서명 통일, Foojay 플러그인 제거로 빌드 안정화.

- **2026-03-20** (세션 5):
  - **스마트 입력 모드 도입**: 단일 textarea → 저장 후 Gemini AI 비동기 분석. FAB에서 스마트/수동 모드 전환. 설정에서 모드 토글(기본: 스마트).
  - **수동 입력 AI 제거**: 기존 + 버튼 흐름에서 AI 분석 완전 분리. 편집 시 AI 호출도 제거 (날짜 덮어쓰기 버그 수정).
  - **캘린더 다중기기 공유**: `blenddo-calendar-id`를 Firestore `userSettings/{userId}`에 저장하여 디바이스 간 공유. localStorage는 캐시 역할만.
  - **캘린더 API 페이지네이션**: `calendarList` 250개 한계 극복 — `nextPageToken` 기반 `fetchAllCalendars` 함수 추가.
  - **AI fallback 강화**: `generateWithFallback`에서 에러 종류 무관하게 항상 다음 모델로 시도하도록 단순화.
  - **음성 입력 구현 (3단계 시행착오)**:
    - 1차: Web Speech API → Capacitor WebView에서 `service-not-allowed` 구조적 오류 (WebView는 브라우저 아님)
    - 2차: `@capacitor-community/speech-recognition` 네이티브 플러그인 도입 + `requestPermissions()` 반환값 체크 → 이미 허용 상태에서도 차단되는 문제
    - 3차(완료): `requestPermissions()` 반환값 체크 제거, `start()` 직접 호출 → 정상 동작
    - 필수 조건: AndroidManifest `RECORD_AUDIO` 권한 + node_modules proguard 패치(`proguard-android.txt` → `proguard-android-optimize.txt`)
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

- **2026-03-25** (세션 11 — 음성 인식 안정화 및 UX 개선):
  - **SmartInputModal 전면 개선**:
    - 알림(reminder) 섹션 제거 — 기본값 자동 적용
    - 마이크 버튼 → `.mic-large-btn` 전체 너비 점선 버튼으로 교체
    - 에러 메시지 친절한 한국어/영어로 변경
    - `getLangLocale()` 헬퍼 `helpers.js`로 추출 (기존 중복 코드 통합)
    - 동적 import → 정적 import (trackEngagement)
    - 미사용 props(reminderOffset 등) 정리
  - **Samsung SpeechRecognizer 버그 수정**:
    - 근본 원인: `partialResults: true`가 Samsung Galaxy S24에서 즉시 `ERROR_NO_MATCH` 유발
    - `partialResults: false`로 변경 후 정상 동작 확인
    - `popup: false` 복원
  - **자동 음성 재시도 구현**:
    - `no match` / `no speech` 에러 시 1회 자동 재시도
    - 재시도 중 파형 대신 "🎤 마이크를 준비 중이에요..." 표시 (isRetrying 상태)
    - `retryingRef`로 재시도 중 `setIsListening(false)` 방지 → 파형 연속 유지
  - **이벤트 버블링 버그 수정**: `voice-stop-btn`, `mic-large-btn` 모두 `e.stopPropagation()` 추가
  - **컬렉션 탭 TOP3 너비 수정**:
    - `top-achievements-row`를 `insight-stats-section` 바깥으로 이동 (이중 패딩 제거)
    - CSS padding `0 16px 8px` → `4px 0 8px` 조정
  - **업적 모달 X 버튼 CSS 추가**: `.modal-close-btn` 스타일 정의
  - **App.jsx useMemo 최적화**: `headerActiveTodosCount`, `headerCompletedTodosCount` 검색 중 불필요한 filter 방지
  - **autoStartVoice 로직**: FAB 탭 시 600ms delay 후 음성 자동 시작 (Samsung One UI 전환 대기)

---

## 🗺️ 다음 개발 로드맵

### 킬링 포인트 기능
1. ✅ 자연어 처리 (Gemini AI)
2. ✅ 캘린더 연동 (Google Calendar 동기화)
3. ✅ 업적 시스템 (Firestore 클라우드 동기화)
4. ⬜ 잠금화면 바로 보기 (Android Activity FLAG_SHOW_WHEN_LOCKED)

### 단기 작업 (우선순위 순)
1. **잠금화면 지원**: `android/app/src/.../MainActivity` `FLAG_SHOW_WHEN_LOCKED` 추가 → 빠른 구현
2. **로컬 푸시 알림**: `@capacitor/local-notifications` — 업적 달성 알림, 할일 리마인더
3. **반복 일정**: 이미 plan 수립됨 (`plan` 파일 참조) — `recurrence` 필드 + 뷰 레벨 인스턴스 생성 전략
4. **검색 기능**: 이미 plan 수립됨 — 전체 todos 텍스트/태그/설명 검색
5. **하위 태스크**: 이미 plan 수립됨 — `subtasks` 배열 필드

### 중기 작업
- OAuth 토큰 자동 갱신 (5분 주기 체크, 만료 배너)
- 업적 시스템 확장 (새 업적 추가: `useAchievements.js`의 `ACHIEVEMENT_DEFS` 배열에 직접 추가)
- patch-package로 node_modules 패치 자동화

### 업적 시스템 관리 방침
- 현 단계: `useAchievements.js`의 `ACHIEVEMENT_DEFS` 배열에 직접 추가 후 재배포
- Firebase 이관 고려 시점: 사용자 수 증가 or 업적 추가 빈도 높아질 때

---
*최종 업데이트: 2026-03-25 (세션 11 — 음성 인식 안정화, 재시도 로직, TOP3 너비, 업적 X 버튼)*
