## v1.1.0 — 보안 강화 및 UX 개선 (2026-04-17)

### 주요 변경사항

#### 보안 강화
- **Firebase App Check**: Play Integrity API 연동으로 Cloud Functions 무단 호출 방지 (현재 비활성화)
- **PII 마스킹**: 전화번호, 이메일 등 개인정보 자동 마스킹 처리
- **Firestore Rules**: Rate limiting 및 데이터 검증 강화

#### UX 개선
- **Android 홈 화면 위젯**: 위젯 기초 구조 추가 (설정 후 활성화 필요)
- **Contribution Graph**: GitHub 스타일 잔디 그래프 + 연속 달성 Streak 배지
- **PWA 지원**: 데스크톱 레이아웃 최적화
- **AI Nudge**: 2주 이상 묵은 할 일 스마트 정리 제안

#### 마케팅 & 수익화 인프라
- **ASO 전략**: 앱스토어 최적화 가이드 (`docs/MARKETING_STRATEGY.md`)
- **인앱 결제**: Pro 구독/커피 후원 인프라 (현재 비활성화)
- **네이티브 광고**: 광고 삽입 인프라 (Pro 사용자 제외)

### 수정 사항
- PII 마스킹 유틸리티 추가 (`src/utils/piiMask.js`)
- Contribution Graph 컴포넌트 추가 (`StatsScreen.jsx`)
- Nudge 기능 추가 (`BriefingModal.jsx`, `helpers.js`)
- NativeAd 컴포넌트 추가 (Pro 제외 표시)
- 인앱 결제 훅 추가 (`useInAppPurchase.js`)
- PWA 설정 추가 (`vite.config.js`)
- Android 위젯 Provider 추가 (`BrioDoWidgetProvider.kt`)

### 이슈 처리
- #128, #129, #130: 보안 강화
- #134, #135, #136: 마케팅 전략
- #137, #138, #139, #140: UX 개선
- #131, #132, #133: 수익화 인프라

---

### 참고사항
- 일부 기능 (App Check, 인앱 결제, 광고)은 하드코딩으로 비활성화됨
- 활성화 시 `APP_CHECK_ENABLED`, `PRO_ENABLED` 플래그 변경 필요
- APK 설치: Galaxy S24 (R3CWC0KB53Z)에서 테스트 완료

**테스트 환경**: Galaxy S24 (Android), npm build + Capacitor sync
