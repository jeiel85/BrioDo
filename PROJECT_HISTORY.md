# BrioDo 프로젝트 이력 관리 (Project History)

본 문서는 BrioDo 프로젝트의 개발 과정, 주요 결정 사항, 실패 및 개선 사례를 기록하여 프로젝트의 방향성을 유지하기 위해 작성되었습니다.

---

## 2026-04-02 — 이슈 5종 대응 (세션 24)

**세션 목표:** GitHub 우선순위 이슈 5종 처리

### #55/#79 — Brio Firestore 동기화 (`useBrio.js`)
- 로그인 시 `userSettings/{uid}.brio` 에서 불러와 로컬과 병합 (더 높은 잔량 채택)
- `consume()`/`charge()` 시 2초 디바운스로 Firestore 비동기 저장
- `useBrio(user)` 시그니처 변경 — App.jsx에서 `useBrio(user)` 로 호출
- 로그아웃/재설치 후 로그인해도 Brio 유실 없음

### #82 — Brio 충전 진행률 표시기 (`BrioChargeModal.jsx`, `index.css`)
- `useBrio`에서 `chargeProgress` (0~1) 반환 추가
- BrioChargeModal에 **잔량 게이지 바** + **다음 자동 충전 타이머 바** 추가
- 잔량 색상: 부족(빨강) / 보통(primary) / 가득(초록)
- 타이머 바: primary → 골드 그라데이션

### #67 — 날씨 지역명 한국어 표시 개선 (`useWeather.js`, `SettingsModal.jsx`)
- **플랜 A**: 자동감지(locationKey 빈 값) 시 wttr.in 영어 로마자 지역명 숨김 → 온도·아이콘만 표시
- **플랜 A 유지**: Nominatim 역지오코딩 시도는 유지, 실패 시 빈 값 (영어 노출 방지)
- **플랜 B**: SettingsModal 지역명 입력란 아래 "예: 광명시, 서울" 안내 문구 추가

### #71 — 음성 인식 대기 시간 여유롭게 개선 (`SmartInputModal.jsx`)
- Android 묵음 감지(`listeningState: stopped`) 후 사용자가 완료 탭 전까지 자동 재시작
- 최대 5회 자동 재시작 (`MAX_AUTO_RESTARTS`) — Galaxy 키보드처럼 길게 대기
- 재시작 중 파형 느려지고 "계속 듣는 중..." 표시
- 웹 폴백: `continuous: true` 로 변경
- `.voice-wave-bar.paused` CSS 추가

### #59 — 랜덤 테마 생성 시 ⚡1 Brio 소비 (`SettingsModal.jsx`, `App.jsx`)
- 랜덤 테마 버튼에 `consumeBrio(1)` 연결
- Brio 부족 시 테마 생성 차단
- 버튼에 `⚡1` 비용 표시 추가

---

## 2026-04-01 — 탭하여 말하기 버그 수정 + 이슈 정리 (세션 23)

**세션 목표:** 버그 이슈 대응 — #80 탭하여 말하기, #73/#77 깜빡임 이슈 종결

### #81 — 수동 입력 시 AI 자동 태그 제거

**원인:** App.jsx에 `showInputModal` 열릴 때 1200ms 디바운스로 `getAiTagsOnly()`를 호출해 태그를 자동 주입하는 useEffect가 존재. 자동 태그는 AI 전용 기능(SmartInput)이므로 수동 입력에 부적절.

**수정 내용:**
1. `App.jsx` — AI 태그 자동 제안 디바운스 useEffect 전체 제거
2. `App.jsx` — `InputModal`에 `isAiAnalyzing` prop 전달 제거, `getAiTagsOnly` destructuring 제거
3. `InputModal.jsx` — `isAiAnalyzing` prop 및 "AI 분석 중" 표시 UI 제거

---

### #80 — 탭하여 말하기 "듣는 중" 전환 안 됨 수정

**근본 원인 — `partialResults: true` 즉시 리턴 문제:**
- `@capacitor-community/speech-recognition` v7 스펙: `partialResults: true`로 `start()` 호출 시 **즉시 리턴** (결과 없음)
- 실제 결과는 `addListener('partialResults', ...)` 이벤트로만 수신
- 기존 코드는 `start()` 반환값에서 결과를 읽으려 했기 때문에 `setIsListening(true)` → `start()` 즉시 리턴 → `finally`에서 `setIsListening(false)` 가 React에 배치됨 → "듣는 중" UI가 절대 렌더되지 않음

**수정 내용 (`SmartInputModal.jsx`):**
1. `partialListenerRef` + `stateListenerRef` + `pendingPartialRef` 추가
2. `start()` 전에 `addListener('partialResults')` 등록 — 결과를 `pendingPartialRef`에 실시간 저장
3. `addListener('listeningState')` 등록 — 자연 종료(묵음) 시 partial 텍스트를 `smartText`에 커밋
4. `start()` return값 처리 제거 — 즉시 리턴이므로 무의미
5. `finally` 블록의 `setIsListening(false)` 제거 — 리스너/수동 stopMic으로만 관리
6. `stopMic` 수정 — 정지 전 `pendingPartialRef.current` 커밋 + 리스너 cleanup
7. 언마운트 시 `cleanupNativeListeners()` 호출 추가

### #73/#77 — 업적 달성 깜빡임
이전 세션 수정(세션 22)으로 해결 확인. 이슈 종결.

---

## 2026-04-01 — 업적 모달 깜빡임 근본 수정 3차 (세션 22)

**세션 목표:** 업적 달성 시 화면 깜빡임 근본 원인 완전 제거

### 근본 원인 분석
이전 수정(#73 #77 #78)에서 `box-shadow` transition 제거, `chargeBrio` 600ms 지연으로 2가지 원인을 제거했으나 깜빡임이 지속됨.

**3번째 원인 — GPU 레이어 생성 타이밍:**
- `AchievementUnlockModal`이 `!localAchievement`일 때 `return null` → overlay div가 DOM에서 제거
- 업적 발생 시 overlay div가 DOM에 새로 추가됨
- Android WebView는 `position: fixed + will-change: opacity`를 가진 요소가 DOM에 추가될 때 **GPU 레이어를 생성**하며 화면 전체를 재합성 → **흰 플래시(깜빡임)**

**4번째 원인 — confetti DOM 변경 타이밍:**
- `confetti()` 호출이 `setVisible(true)` **이전**에 실행됨 (effect 동기 코드)
- overlay GPU 레이어가 확립되기 전에 confetti canvas가 DOM에 추가됨
- Android WebView 재합성이 transition 시작 전에 발생 → 추가 깜빡임

### 수정 내용 (`AchievementUnlockModal.jsx`)
1. `if (!localAchievement) return null` → `return <div className="ach-unlock-overlay" aria-hidden="true" />`
   - overlay div를 항상 DOM에 유지 → GPU 레이어 최초 마운트 시 1회만 생성
   - 이후 업적 발생 시 기존 DOM 노드 업데이트 (React reconciliation) → GPU 레이어 재생성 없음
2. `confetti()` 호출을 double-rAF 내부(`setVisible(true)` 직후)로 이동
   - overlay GPU 레이어 확립 이후 confetti canvas 생성
   - `confettiTimerRef` 추가로 cleanup 정확하게 처리

---

## 2026-03-31 — 버그 수정 4종 + 앱 아이콘 교체 (세션 21)

**세션 목표:** GitHub Issues 우선순위 선정 및 수정, 앱 아이콘 변경

**수정 이슈:**
1. **#73 업적 달성 시 화면 깜빡임 근본 수정**
   - **원인 A**: `ach-glow-pulse` 애니메이션이 `box-shadow` 변화 → Android WebView full repaint → 깜빡임
   - **원인 B (핵심)**: `canvas-confetti`가 생성한 `position: fixed` 전체화면 canvas가 `confetti.reset()` 미호출로 DOM 잔류 → 모달 닫힌 후에도 GPU 레이어 점유 → 일반 사용 중에도 깜빡임
   - `AchievementUnlockModal.jsx`: useEffect cleanup + handleClick에 `confetti.reset()` 추가, confetti 250ms timer도 clearTimeout 처리
   - `index.css`: `ach-glow-pulse`를 box-shadow 변화 → `::after` 가상 요소 + opacity 애니메이션으로 교체

2. **#74 브리오 꽉 찬 상태에서 업적/광고 보상 누락**
   - `useBrio.js`: `MAX_BRIO_OVERFLOW = 50` 상수 추가, `charge()` 캡을 `MAX_BRIO(10)` → `MAX_BRIO_OVERFLOW(50)`으로 완화
   - 자동 충전은 여전히 10까지만, 업적·광고는 최대 50까지 보유 가능

3. **#54 SmartInputModal AI 비용 안내 개선**
   - Brio 부족 시 저장 버튼 텍스트 `저장` → `저장 (AI 없음)`으로 명시 (ja/zh 다국어 포함)
   - 버튼 스타일 구분: `.smart-save-btn.no-ai` (회색 그라디언트)

4. **#71 음성 인식 타임아웃 여유 개선**
   - 네이티브 SpeechRecognition: `partialResults: false` → `true` (Android가 더 오래 입력 대기)
   - 자동 재시도 횟수: 1회 → 2회 (Samsung SpeechRecognizer 간헐적 실패 대응)

**앱 아이콘 교체:**
- 5개 Gemini 생성 후보 중 `e6m8x9` 선정: B(BrioDo) + 체크마크 + 상향 화살표 + 컬러 그라디언트
- `docs/icon-512.png` 교체 + Android 전 mipmap 크기(ldpi~xxxhdpi) 업데이트
- 나머지 후보 4개 및 `docs/icon_choice/` 폴더 삭제 (git 용량 절감)

---

## 2026-03-30 — 스토어 등록 준비 (세션 20)

**세션 목표:** 스토어 제출용 자산 준비 및 버전 정보 수정

**수행 작업:**
1. **versionName 수정** — `"1.0"` → `"1.0.0"` (android/app/build.gradle)
2. **스크린샷 5장 캡처** — Galaxy S24 ADB 스크린샷 → `docs/screenshots/`
   - 01_today.png (오늘 탭)
   - 02_smart_input.png (할 일 입력 모달)
   - 03_settings.png (설정 화면)
   - 04_collection.png (컬렉션/업적)
   - 05_tasks.png (전체 할 일)
3. **GitHub Pages 확인** — `https://jeiel85.github.io/BrioDo/` 빌드 완료 (개인정보처리방침 URL 사용 가능)
4. **릴리즈 빌드** — v1.0.0 AAB(7.6MB) + APK(5.3MB) 재생성

**다음 할 일:**
- Samsung Galaxy Store 등록 (https://seller.samsungapps.com)
- Google OAuth 동의 화면 프로덕션 전환 (Google Cloud Console)
- Google Play Store 등록 ($25 개발자 계정 필요)

---

## 2026-03-30 — 릴리즈 전 코드 감사 + 보안 수정 (세션 19)

**세션 목표:** Play Store 출시 전 코드 감사 및 릴리즈 블로커 수정

**수행 작업:**
1. **소스 최신화** — `git pull origin main` (2 커밋 반영: AdMob/날씨/상태바 수정)
2. **크리티컬 버그 머지** — `fix-critical-launch-issues-MrdAw` 브랜치 병합
   - 오프라인 알림 미발송 오타 수정 (`savedReminderTime` → `savedReminderOffset !== null`)
   - 네트워크 리스너 메모리 누수 방지 (Promise 체이닝 → 명시적 cleanup)
3. **BLOCKER 수정: 코드 난독화 비활성화** — `android/app/build.gradle`
   - `minifyEnabled false` → `true`, `shrinkResources true` 추가
4. **BLOCKER 수정: console.log 전수 제거** — 민감 정보 Logcat 노출 방지
   - `useAuth.js` (사용자 이메일, OAuth 토큰, deep link URL 등 9개 제거)
   - `calendar.js` (토큰 갱신 로그 2개 제거)
   - `useNotifications.js` (알림 scheduled/cancelled 로그 2개 제거)
   - `useTodosData.js` (마이그레이션 로그 2개 제거)
   - `console.error/warn`(실제 오류 핸들링)은 유지
5. **WARNING 수정: allowBackup 비활성화** — `AndroidManifest.xml`
   - `android:allowBackup="true"` → `false`

**확인 사항:**
- `.env`는 git-tracked 아님 (`.env.example`만 추적) → 보안 이상 없음

---

## 2026-03-29 — 버그 수정 4종 (#53 #46 #52 #47)

**세션 목표:** 빌드 전 잔여 버그 4종 해결

**수정 내용:**
1. **#53 Brio 잔량 체크 누락** — `App.jsx` `handleSmartSave`의 setTimeout 콜백 첫 줄에 `if (!hasBrio(2)) return` 추가. 기존엔 `consumeBrio(2)` 실패해도 AI 분석이 이미 완료된 상태였음.
2. **#46/#52 날씨 지역명 영어 표시** — `useWeather.js`: wttr.in 응답의 lat/lon으로 Nominatim OpenStreetMap 역지오코딩 호출(`lang=ko`). `lang === 'ko'` + IP 자동감지 시에만 적용. "Kwangmyeong" → "광명시" 형태로 수정.
3. **#47 광고 로딩 stuck** — `useAdMob.js`: `RewardAdPluginEvents.Dismissed`, `FailedToShow` 핸들러 추가. 기존엔 Rewarded 이벤트만 처리 → 광고 중간 닫기/실패 시 Promise 미해결로 로딩 상태 무한 대기. ※ 실제 광고 fill 미발생 시 AdMob 대시보드 앱 승인 상태 확인 필요.

**수정 이슈:** #53, #46, #52, #47

---

## 2026-03-29 — 상태바 동기화 근본 수정 + 업적 모달 개선 (#51 #48 #50)

**세션 목표:** 디바이스 테스트에서 발견된 버그 3종 수정

**근본 원인 (상태바):**
1. `android/app/src/main/res/values/styles.xml`에 `windowLightStatusBar=true` 하드코딩 → Android XML이 JS API보다 우선 적용되어 항상 검은 아이콘 강제
2. `getComputedStyle(document.body)` → Android WebView에서 CSS 변수 해석 불가 → 항상 잘못된 brightness 계산
3. Capacitor `Style` enum 반전: `Style.Dark` = 흰색 아이콘(어두운 배경용), `Style.Light` = 검은 아이콘(밝은 배경용)

**주요 변경:**
- `styles.xml`: `windowLightStatusBar` true → false (XML 강제 해제)
- `capacitor.config.json`: StatusBar 초기값 `style: "DARK"` (흰색 아이콘, 기본 다크 테마 대응)
- `useTheme.js`: `getComputedStyle` 제거 → 테마 state 직접 읽어 StatusBar 결정. `appStateChange` 리스너로 앱 재개 시 재동기화
- `index.css`: `.ach-unlock-overlay` `backdrop-filter` 트랜지션 제거 + GPU 레이어 강제 (#50 흰 테마 깜빡임)

**수정 이슈:** #51 (다크 테마 상단바), #48 (흰 테마 상단 글씨), #50 (흰 테마 업적 깜빡임)

---

## 2026-03-28 — 브리오 경제 시스템 재설계 (#37)

**세션 목표:** 수익 균형화 — 업적 보상 과다 지급 문제 해결, 시간 기반 충전으로 전환

**핵심 결정 (20년차 마케터 관점):**
- 광고 시청 동기 유지를 위해 공급/소비 균형 재조정
- 업적 = 소량 보너스, 시간 충전 = 일상 연료, 광고 = 추가 충전 선택지

**주요 변경:**
- `useBrio.js`: 자정 리셋 → 2시간마다 1개 자동 충전 (max 10), 마이그레이션 로직 포함
- `useBrio.js`: `BRIO_REWARD_BY_DIFFICULTY` 축소 (최대 30→15)
- `useAchievements.js`: `ACHIEVEMENT_BRIO_REWARD` 재조정 + 단일 보상 상한 15개 적용
- `AchievementUnlockModal.jsx`: 표시용 BRIO_BY_DIFF 동기화
- `App.jsx`: AI 전체 분석 소비량 1→2 브리오, 게이트 체크 hasBrio(2)

**경제 수치 변화:**
- 전체 업적 보상 합계: ~509 → ~150개
- AI 1회 사용 비용: 1 → 2 브리오
- 자연 충전량: 하루 최대 12개 (2h × 12 = 24h, max 10으로 cap)

---

## 2026-03-28 — Play Store 출시 준비 자산 생성 (#25)

**세션 목표:** Play Store 제출에 필요한 자산 준비

**주요 작업:**
- `docs/privacy-policy.html`: AdMob 광고 식별자(GAID) 항목 추가, 광고 섹션 신설, 날짜 업데이트
- `docs/store-listing.md`: 한/영 앱 설명, Data Safety 섹션 가이드, 릴리즈 노트 작성
- `docs/icon-512.png`: 앱 아이콘 512×512 (퍼플 그라디언트 + 체크마크 + ⚡ 브리오 뱃지)
- `docs/featured-graphic.png`: 피처드 그래픽 1024×500 (기능 소개 + 목업 UI)
- `CLAUDE.md`: ADB 경로 업데이트 (jeiel PC: `/c/Users/jeiel/AppData/Local/Android/Sdk`)

**개인정보처리방침 URL:** `https://jeiel85.github.io/BrioDo/privacy-policy.html`

**남은 작업 (수동):** 스크린샷 캡처, Play Console 앱 등록, Google OAuth 프로덕션 전환, AAB 빌드

**커밋:** `docs: 개인정보처리방침 AdMob 항목 추가 + Play Store 등록 정보 작성 (#25)`

---

## 2026-03-28 — AdMob 보상형 광고 실제 연동

**세션 목표:** BrioChargeModal의 광고 시청 버튼을 실제 AdMob 보상형 광고로 교체 (Phase 1 즉시 지급 → Phase 2 AdMob 연동)

**주요 작업:**
- `@capacitor-community/admob` 패키지 설치 및 android/build.gradle 패치 (jcenter→mavenCentral, proguard-android-optimize)
- `src/hooks/useAdMob.js` 신규 생성: `initAdMob()` (앱 초기화), `showRewardedAd(onRewarded)` (보상형 광고 호출 + 리스너 해제)
- `src/components/BrioChargeModal.jsx`: 실제 AdMob 보상형 광고 호출로 교체, 광고 준비 중 버튼 비활성화 로딩 상태, 광고 실패 시 즉시 지급 폴백
- `src/App.jsx`: 앱 시작 useEffect에서 `initAdMob()` 호출 추가
- `android/app/src/main/AndroidManifest.xml`: `<application>` 내 AdMob APPLICATION_ID meta-data 추가 (앱 ID: `ca-app-pub-7262251786684458~9750978148`)
- `capacitor.config.json`: AdMob 플러그인 appId 설정 추가
- `.env`: `VITE_ADMOB_REWARDED_ID` 추가 (광고 단위 ID: `ca-app-pub-7262251786684458/2962208516`)

**광고 단위:**
- 앱 ID: `ca-app-pub-7262251786684458~9750978148`
- 보상형 광고 단위 ID: `ca-app-pub-7262251786684458/2962208516`
- 폴백 테스트 ID (DEV 미설정 환경): `ca-app-pub-3940256099942544/5224354917` (구글 공식 테스트 ID)

**커밋:** `feat: AdMob 보상형 광고 실제 연동 (#23)`

## 📌 프로젝트 개요
- **이름**: BrioDo (브리오두) - *이전 명칭: BlendDo → Todoest*
- **슬로건**: "Do it with brio." / "활기차게, 해내다."
- **목표**: AI와 함께하는 스마트 할 일 관리 앱
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

### 1. 프로젝트 리브랜딩 (Todoest → BlendDo → BrioDo)
- Todoest → BlendDo: 단순 할 일 목록에서 '일상의 조화'를 강조하는 브랜드로 변경.
- BlendDo → BrioDo: `blend.do` 도메인이 경쟁 앱에 선점, Blendo.co(ETL 툴)와 충돌. "brio"(이탈리아어·음악 용어 — 활기, 생동감) + "Do"(해내다) 조합으로 최종 확정. 패키지 ID `app.briodo`, 슬로건 "Do it with brio." (2026-03-25)

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
- [x] **Google OAuth 토큰 자동 갱신**: 5분 주기 인터벌 + 만료 시 재연결 배너 — 세션 11 완료

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
- [x] **업적 확장**: 50개 추가(총 106개) — 세션 15 완료
- [x] **잠금화면 위젯**: 잠금화면 감지 플러그인 + 심플 위젯 UI (블러 frosted glass) — 세션 15 완료

---

## 📝 최근 활동 로그 (Recent Activity)

- **2026-03-28** (세션 20~21 — 버그 수정 다수 + 설정 탭 UX + Brio 경제 재설계 + AdMob 연동):

  **버그 수정 (#34, #35, #36, #38, #40, #44, #45)**
  - **#45 StatusBar 색상 반전 버그 수정**: `useTheme.js`의 `brightness > 128 ? Style.Light : Style.Dark` 로직이 반전되어 있어 밝은 테마에서 상단 시계/배터리 아이콘이 흰색(안 보임)으로 표시되던 문제 수정. 올바른 로직: 밝은 배경 → `Style.Dark`(어두운 아이콘), 어두운 배경 → `Style.Light`(밝은 아이콘). `useEffect`와 `syncStatusBar` 함수 두 곳 모두 수정.
  - **#44 업적 카운트 비밀 업적 미포함 버그 수정**: `AchievementsModal.jsx`에서 `visibleDefs`(표시용)와 `unlockedCount`/`totalCount`(뱃지용) 계산을 분리. 뱃지는 숨겨진 비밀 업적까지 포함한 전체 기준으로 표시.
  - **#40 AI 사용량 게이지 진행바 제거**: `SettingsModal.jsx`에서 AI 게이지 progress bar 완전 제거. Brio 경제 재설계에 따른 UI 정리.
  - **#36 업적 언락 모달 confetti 깜빡임(flicker) 버그 수정**: `useAchievements.js`의 `dismissUnlock`, `clearNotifications` 함수를 `useCallback`으로 안정화. 기존에는 매 렌더마다 새 함수 참조가 생성되어 `AchievementUnlockModal`의 `useEffect([achievement, onDismiss])`가 재실행 → confetti 반복 발생.
  - 업적 언락 모달 glow 애니메이션 딜레이 0.6s 추가 (card 등장 애니메이션 이후 시작).

  **설정 모달 탭 네비게이션 (#42, #43)**
  - `SettingsModal.jsx`를 4탭 구조로 재편: **외관**(언어·글자크기·테마) / **기능**(입력방식) / **알림**(알림기본값·종일알림·기본보기·날씨·잠금화면) / **계정**(구글캘린더·로그인·앱정보).
  - `index.css`: `.settings-tabs`, `.settings-tab-btn`, `.settings-tab-icon`, `.settings-tab-label`, `.settings-tab-body` 스타일 추가. 가로 모드(≥600px)에서 2열 그리드 레이아웃.
  - `settings-scroll-body` padding 상단 16px 제거 (탭 바텀 보더와 간격 최적화).

  **Brio 경제 시스템 재설계 (#37)**
  - 20년차 마케터 관점 분석: 업적 총 보상 509개 → ~150개로 축소, AI 소비 1 → 2 브리오, 시간 기반 자동 충전(2h/1개, 하루 최대 10개) 도입.
  - `useBrio.js`: `CHARGE_INTERVAL_MS = 2h`, `MAX_BRIO = 10`, `BRIO_REWARD_BY_DIFFICULTY` 최대값 15로 캡. 자정 리셋 → 시간 누적 충전으로 전환. 기존 사용자 마이그레이션 로직 포함.
  - `App.jsx`: AI 분석 시 `hasBrio(2)` 체크, `consumeBrio(2)` 소비.
  - `AchievementUnlockModal.jsx`: BRIO_BY_DIFF 표시값 동기화.

  **AdMob 보상형 광고 연동 (#23)**
  - `@capacitor-community/admob` 설치 및 android/build.gradle 패치.
  - `src/hooks/useAdMob.js` 신규: `initAdMob()`, `showRewardedAd(onRewarded)`.
  - `BrioChargeModal.jsx`: 실제 AdMob 광고 호출, 준비 중 로딩 상태, 실패 시 즉시 지급 폴백.
  - `AndroidManifest.xml`: AdMob App ID meta-data 추가.
  - 앱 ID: `ca-app-pub-7262251786684458~9750978148`, 광고 단위: `ca-app-pub-7262251786684458/2962208516`.

  **Play Store 출시 준비 자산 (#25)**
  - `docs/privacy-policy.html`: AdMob GAID 항목 추가, 광고 섹션 신설.
  - `docs/store-listing.md`: 한/영 앱 설명, Data Safety 섹션, 릴리즈 노트.
  - `docs/icon-512.png`, `docs/featured-graphic.png`: 512×512 아이콘 + 1024×500 피처드 그래픽.

  **디바이스 테스트 후 발견된 이슈 (신규 등록)**
  - **#46** 날씨 지역명 영문 표시 — 코드 수정 완료, 캐시 초기화 필요
  - **#47** AdMob 광고 불러오기 실패 — 초기화/환경 문제 진단 필요
  - **#48** 흰색 테마에서 헤더 텍스트 안 보임 — CSS 수정 필요
  - **#49** 화면 좌우 스와이프로 날짜 이동 — 기능 요청
  - **#50** 흰색 테마에서 업적 달성 시 화면 깜빡임 — 진단 필요 (useCallback 수정으로 일부 개선됐을 수 있음)

  **닫힌 이슈:** #23, #25 (부분), #34, #35, #36, #37, #38, #40, #42, #43, #44, #45

- **2026-03-26** (세션 19 — 구글 로그인 분석, 태블릿 로드맵, 문서 정비):
  - **구글 로그인 코드 검토**: `useAuth.js` 분기 로직 정상 확인. 사용자가 경험하는 "웹뷰 같은 화면"은 `grantOfflineAccess: true` 설정으로 인해 Google이 Calendar 스코프 refresh token 발급 시 Chrome Custom Tab으로 띄우는 OAuth 동의 화면이며, 최초 로그인 1회에만 표시되는 정상 동작. 코드 수정 불필요.
  - **미래 개선 메모**: `@codetrix-studio/capacitor-google-auth`는 deprecated된 구글 Sign-In SDK v4 사용 중. 장기적으로 `@capawesome-team/capacitor-google-sign-in`(Android Credential Manager API)로 교체 고려.
  - **태블릿 지원 로드맵 추가**: CLAUDE.md 다음 작업 후보에 Android 태블릿 최적화 항목 추가.
  - **STORE_DEPLOY.md 신규 생성**: Google Play, Samsung Galaxy Store, Amazon Appstore, APKPure/APKMirror, F-Droid 각 스토어별 배포 절차 문서화.
  - **CLAUDE.md 로드맵 전면 갱신**: 앱스토어 배포 체크리스트 + Google Sign-In 플러그인 업그레이드 항목 추가.

- **2026-03-26** (세션 18 — 모달 UX 통합 + 마이크 버그 수정):
  - **모달 디자인 통합**: `InputModal`에 `.modal-header` / `.modal-title` / `.modal-close-btn` 구조 적용. 이전에는 헤더 없는 구조로 다른 모달과 경험 불일치.
  - **X 버튼 32px 원형 통일**: `.modal-close-btn { width:32px; height:32px; border-radius:50% }` — 모든 모달(InputModal / SmartInputModal / SettingsModal / NotificationsModal) 동일 스타일.
  - **알림 센터 드래그 핸들 제거**: `NotificationsModal`에서 불필요하게 표시되던 `notif-drag-handle` 제거.
  - **`useSwipeToDismiss.js` 훅 신규 생성**: 아래로 스와이프하여 모달 닫기 — 속도(0.4px/ms) + 거리(120px) 임계값 기반 dismiss 판정. 드래그 중 배경 opacity 페이드 연동. `scrollRef` 옵션으로 내용 스크롤 중 오작동 방지. 모든 바텀시트 모달에 적용.
  - **기본 입력 모드 = 수동**: `inputMode` 초기값 `'smart'` → `'manual'`. 비로그인 신규 사용자에게 스마트 입력 강제 노출 방지.
  - **비로그인 스마트 입력 차단 토스트**: SettingsModal에서 비로그인 상태로 스마트 입력 선택 시 토스트 메시지 표시.
  - **AI 사용량 progress bar**: 기존 "1/10" 텍스트 → 색상 코딩 막대 그래프(0-50% 초록, 51-80% 주황, 81%+ 빨강) + 숫자 병기.
  - **SmartInputModal 마이크 세션 정리 버그 수정**: 외부 터치로 모달 종료 시 Android `SpeechRecognition.start()` Promise가 pending 상태에서 컴포넌트 언마운트되어 재진입 시 마이크 오작동하는 문제 수정. `isListeningRef`로 동기 상태 추적 + `handleClose`에서 `stopMic()` 선행 호출 후 `onClose`.
  - **기본 보기 영속화**: `viewMode` 초기값 `'date'` 하드코딩 → `localStorage.getItem('briodo-viewMode') || 'date'`. viewMode 변경 시 자동 저장, 앱 재시작 후에도 마지막 선택 보기 유지.

- **2026-03-26** (세션 17 — blend 흔적 전면 제거 + 잠금화면 버그 수정):
  - **localStorage/DB 키 전면 통일**: `blenddo-*` → `briodo-*` 일괄 변경.
    - `useTheme.js`: `blenddo-theme`, `blenddo-font-scale`, `blenddo-random-colors` → `briodo-*`
    - `db.js`: IndexedDB 이름 `blenddo-db` → `briodo-db`
    - `calendar.js`: localStorage `blenddo-calendar-id` → `briodo-calendar-id`
    - `useAuth.js`: 로그아웃 시 삭제 키 업데이트
    - `App.jsx` / `useAchievements.js`: `blenddo_engagement_flags`, `blenddo_unlocked_ids` → `briodo_*`
  - **Firestore 필드**: `blendoCalendarId` → `briodoCalendarId` (기존 데이터 폴백 유지: 신규 필드 없을 시 구 필드에서 읽음)
  - **SettingsModal 슬로건**: "Blend your life, Do it smoothly." → "Do it with brio."
  - **잠금화면 미리보기 닫기 버그 수정**: 설정 → 잠금화면 미리보기 → 닫기 시 할일 탭으로 이동하는 문제 수정. `onOpen` 콜백에서 `showLockPreview` 여부로 분기 — 미리보기 종료 시 `setShowSettings(true)` 호출, 실제 잠금화면 해제 시에만 `setIsLockScreen(false)` 호출.

- **2026-03-25~26** (세션 16 — BrioDo 리브랜딩 전면 적용):
  - **패키지 ID 변경**: `biz.blendo.app` → `app.briodo`
  - **Java 패키지 이동**: `android/app/src/main/java/biz/blendo/app/` → `app/briodo/`. `MainActivity.java`, `LockScreenPlugin.java` 패키지 선언 업데이트.
  - **Android 앱 이름 로컬라이즈**: `res/values/strings.xml` 영문 "BrioDo", `res/values-ko/strings.xml` 신규 생성 — 한국어 기기에서 "브리오Do" 표시.
  - **Firebase 새 앱 등록**: `app.briodo` 패키지 ID로 Firebase Console에 Android 앱 추가. SHA-1 3개 등록 (이 PC 디버그 `1d097c...`, 다른 PC 디버그 `c4cf5d...`, 릴리즈 키스토어 `2ac6fc...`). 새 `google-services.json` 교체.
  - **Playwright 테스트 셋업**: `playwright.config.js` + `tests/todo.spec.js` 신규 생성. 12개 테스트 전부 통과 (22.0s). `npm test` 스크립트 추가.
  - **README.md 슬로건** 및 앱 설명 전면 최신화.
  - **Git remote**: `BlendDo.git` → `BrioDo.git` (GitHub 리포 이름 변경 후 자동 리다이렉트).
  - **APK 빌드 & Galaxy S24 설치**: `assembleDebug` BUILD SUCCESSFUL, ADB 무선 설치 완료.

- **2026-03-25** (세션 15 — 업적 50개 추가 + 잠금화면 위젯 구현):
  - **업적 106개**: 기존 56개에 50개 추가. S6-S9(스트릭), C7-C11(완료), D7-D10(일간), W6-W8(주간), R5-R8(반복), T5-T8(태그), ST5-ST7(하위태스크), P5-P8(우선순위), AI5-AI8(AI/음성), CAL3-CAL4(캘린더), N3-N5(설명), SP4-SP8(특별날짜), E8-E12(참여). `perfectWeek`, `calSyncCount` 신규 stats 추가.
  - **잠금화면 위젯 (LockScreenPlugin.java)**: Capacitor 8 네이티브 플러그인 신규 생성. `isLocked()` — `KeyguardManager.isKeyguardLocked()` 반환. MainActivity에 `registerPlugin(LockScreenPlugin.class)` 등록.
  - **LockScreenView.jsx 신규**: 잠금화면 감지 시 표시되는 심플 위젯 UI. 애니메이션 그라디언트 배경(블러 배경화면 느낌) + frosted glass 패널. 현재 시간 + 오늘 미완료 상위 5개 할일 표시. "앱 열기" 버튼으로 전체 앱 전환.
  - **컬렉션 탭 UI 개선** (세션 14): 태그 모달 펼치기 버그 수정(flex-wrap), 너비 통일, TOP3 업적 배지 금/은/동 스타일, 업적 버튼 1.5배 확대.
  - **모든 업적 보기 버튼**: padding 10→15px, font-size 13→15px (1.5배 확대).

- **2026-03-25** (세션 14 — 음성 인식 안정화 및 컬렉션 UI):
  - **Samsung SpeechRecognizer 버그 수정**: `partialResults: true` 대신 `false` 사용. `ERROR_NO_MATCH` 발생 시 1회 자동 재시도 + "🎤 마이크를 준비 중이에요..." 메시지.
  - **이벤트 버블링 수정**: 음성 버튼 클릭 `e.stopPropagation()` 추가.
  - **업적 모달 X 버튼** `.modal-close-btn` CSS 추가.
  - **TOP3 너비**: `insight-stats-section` 바깥으로 이동하여 이중 패딩 수정.

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
4. ✅ 잠금화면 위젯 (LockScreenPlugin + LockScreenView)

### 단기 작업 (우선순위 순)
1. **Play Store 출시 준비**: AAB 빌드, 스토어 등록, 개인정보처리방침 페이지 (GitHub Pages)
2. **홈 화면 위젯**: Android App Widget API
3. **iOS 지원**: Capacitor iOS 빌드

### 중기 작업
- 업적 시스템 확장 (`useAchievements.js`의 `ACHIEVEMENT_DEFS` 배열에 직접 추가)

### 업적 시스템 관리 방침
- 현 단계: `useAchievements.js`의 `ACHIEVEMENT_DEFS` 배열에 직접 추가 후 재배포
- Firebase 이관 고려 시점: 사용자 수 증가 or 업적 추가 빈도 높아질 때

---
---

## 세션 18 — 2026-03-27: 업적 시스템 200개 확장 + 브리오 보상 연동

### 변경 내용
- **업적 시스템 106개 → 200개 확장**
  - 공개 업적 44개 추가 → 총 150개 (S/C/D/W/R/T/ST/P/AI/CAL/N/SP/E 전 카테고리 확장)
  - 비공개(hidden) 업적 50개 추가 (X1~X50): UI에 완전 비공개, 달성 시에만 팝업 노출
  - `hidden: true` + `brioReward` 필드로 비공개 업적 구분
- **업적 달성 시 브리오 자동 지급**
  - 난이도별 보상: ⚡1(난이도1)~⚡30(난이도10), 비공개 업적 ⚡30~50
  - `chargeBrio` 콜백을 `useAchievements`에 전달하는 방식으로 연동
  - `brioFromAchievements` 플래그 누적 추적 (비밀 업적 X45 조건)
- **AchievementUnlockModal 개선**
  - 브리오 획득량 표시 (`⚡+N` 배지, 팝업 애니메이션)
  - 비밀 업적 달성 시 "🔮 비밀 업적 해제!" 특별 타이틀
- **AchievementsModal 개선**
  - `hidden: true` 업적 완전 필터링 (목록 미표시)
  - 카운트 배지 `/150` 기준으로 수정
- **BrioChargeModal**: 광고 시청 시 `adsWatched` 플래그 트래킹 (비밀 업적 X44 연동)
- **새 특별 날짜 추가**: 할로윈(10/31), 근로자의날(5/1), 제헌절(7/17), 12월31일
- **stats 계산 확장**: `completedBigPlan8`, `totalRegistered`, `weekdayTotal`, `unlockedPublicCount`, `unlockedSecretCount` 신규 추적

### 비공개 업적 구현 방식
- 조건이 간단한 것(X1~X2 스트릭, X4~X6 완료수, X7~X10 특별날짜 등): 기존 stats로 즉시 동작
- 새로운 flag 기반 조건(X11~X46): `flags?.flagName >= N` 패턴으로 구현 — 플래그 미추적 시 자동 `false`, 향후 트래킹 코드 추가 시 자동 활성화
- 메타 업적 (X47~X50, E13, E14): `unlockedPublicCount/unlockedSecretCount` 기반 2패스 계산

*최종 업데이트: 2026-03-27 (세션 18 — 업적 시스템 200개 확장, 브리오 보상 연동)*
