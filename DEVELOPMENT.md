# BrioDo — 시스템 설계 및 개발 정책

이 문서는 BrioDo 프로젝트의 상세 시스템 설계, 보안 정책, 배포 전략 및 스토어 운영 가이드를 통합하여 관리합니다.

---

## 🏗️ 시스템 설계 (BRIO System)

### 1. 수익 모델 및 재화 (Brio)
- **Brio**: AI 기능을 사용하기 위한 인앱 재화.
- **충전 방식**:
  - 자동 충전: 2시간마다 1개씩 자동 충전 (최대 10개).
  - 업적 보상: 난이도에 따라 ⚡1 ~ ⚡15 지급.
  - 광고 시청: AdMob 보상형 광고 시청 시 지급.
- **소비**: AI 전체 분석 1회당 ⚡2 소비.

### 2. 업적 시스템
- 총 200여 개의 업적이 정의되어 있으며, `useAchievements.js`에서 로직을 관리합니다.
- 달성 내역은 Firestore `userSettings` 컬렉션에 동기화됩니다.

---

## 🔒 보안 정책 (Security & Privacy)

### 1. 데이터 보호
- **PII Masking**: 개인정보(전화번호, 계좌번호 등)는 저장 전 자동으로 마스킹 처리됩니다.
- **Gemini Proxy**: 클라이언트에서 직접 API 키를 노출하지 않고, Firebase Cloud Functions를 거쳐 AI를 호출합니다.

### 2. 권한 관리
- **Android Permissions**:
  - `SCHEDULE_EXACT_ALARM`: 정확한 시간의 알림 발송.
  - `USE_FULL_SCREEN_INTENT`: 잠금화면 위젯 표시.
  - `RECORD_AUDIO`: 음성 인식 기능.

---

## 🚀 배포 및 스토어 운영

### 1. 배포 정책
- **Main Branch**: 항상 출시 가능한 안정적인 상태를 유지합니다.
- **Versioning**: `PROJECT_HISTORY.md`에 기록된 세션별 변경 사항을 기반으로 버전을 관리합니다.

### 2. 스토어 배포 채널
- **Google Play Store**: AAB 형식으로 배포, 비공개 테스트 과정을 거쳐 프로덕션 출시.
- **Samsung Galaxy Store**: Galaxy 전용 기능(잠금화면 등) 최적화 버전 배포.
- **직접 배포**: GitHub Releases를 통해 최신 APK 제공 (Obtainium 등 호환).

---

## 📝 개발 체크리스트

### 빌드 전 필수 확인 사항
- [ ] `src/App.jsx` 버전 번호 업데이트 확인.
- [ ] `android/app/build.gradle`의 `versionCode`, `versionName` 일치 확인.
- [ ] `node_modules` 패치 적용 여부 확인.
- [ ] 주요 기능(AI, 캘린더 동기화) 테스트 통과 여부.

---

## 📈 향후 계획 (Roadmap)
- Android 홈 화면 위젯 개발.
- 태블릿 레이아웃 최적화 (Split-pane).
- iOS 버전 출시 및 Apple 로그인 연동.
