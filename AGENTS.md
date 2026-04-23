# BrioDo — AI 에이전트 지침 및 워크플로우

이 문서는 BrioDo 프로젝트의 AI 에이전트(Claude, Gemini 등)를 위한 핵심 개발 지침, 아키텍처 원칙 및 릴리즈 프로세스를 정의합니다. 에이전트는 모든 세션에서 이 규칙을 최우선으로 준수해야 합니다.

---

## ⚡ 개발 워크플로우 규칙

> **이 규칙들은 사용자가 매번 요청하지 않아도 자동으로 적용한다.**

1. **커밋 + 푸시 자동 세트**: 소스코드 변경 → 즉시 `git commit` + `git push` 함께 처리. (Git 커밋 메시지는 한국어로 작성한다.)
2. **빌드 파이프라인은 명시 요청 시만 실행**: "빌드해줘" / "디바이스에 올려줘" 등 명시적 요청이 있을 때만 실행. Galaxy S24(`R3CWC0KB53Z`)에 설치까지 완료해야 빌드 작업이 끝난 것. gradle은 항상 `--quiet` 플래그 사용.
3. **버전 이력 유지**: 기능 추가/버그 수정 시 `PROJECT_HISTORY.md`에 날짜·세션·내용 기록 후 커밋.
4. **localStorage 키 네임스페이스**: 모든 키는 `briodo-*` 또는 `briodo_*` 접두사 사용.
5. **버전 번호 동기화**: 버전 변경 시 아래 두 곳을 항상 함께 수정한다.
   - `src/App.jsx` 상단 `const APP_VERSION = '...'`
   - `android/app/build.gradle` 의 `versionName` + `versionCode`
6. **GitHub 이슈 관리**: 모든 수정 요청 및 기능 추가 작업은 GitHub 이슈를 생성하여 관리한다. 작업 완료 후에는 버전을 올리고 GitHub에 릴리즈(태그 생성 등)를 수행한다.

---

## 🚀 릴리즈 및 배포 가이드

### CI/CD 동작 방식

| 액션 | 트리거되는 작업 |
|------|----------------|
| `git push origin main` | 웹 빌드 테스트 + ESLint 실행. APK 빌드 없음. |
| `git push origin v1.x.x` | Android 릴리즈 빌드 실행 → 서명 APK 생성 + GitHub Release 자동 생성 |

### 릴리즈 프로세스 (명령어 한 줄)
```bash
npm run release 1.x.x
```
이 명령은 버전 업데이트, 커밋, 푸시, 태그 생성을 모두 자동 처리합니다.

### 릴리즈 제목 규칙
- 형식: `v1.x.x — 설명` (예: `v1.1.8 — UI 밀도 개선`)
- **앱 이름(`BrioDo`)을 제목 앞에 붙이지 않는다.** (Obtainium 파싱 호환성)

---

## 🏗️ 아키텍처 및 기술 스택

### 핵심 원칙
1. **오프라인 우선**: 항상 IndexedDB에 먼저 저장 → Firestore는 비동기 동기화.
2. **데이터 무손실**: 게스트 모드 마이그레이션 및 캘린더 충돌 해결 로직 준수.
3. **AI 비동기 처리**: AI 분석은 저장 완료 후 300ms 딜레이를 두고 비동기로 처리.
4. **캘린더 싱글톤**: 레이스 컨디션 방지를 위한 Promise 싱글톤 패턴 유지.

### 기술 스택
- **Frontend**: React 19 + Vite 8
- **Mobile**: Capacitor 8 (Android)
- **Backend**: Firebase Auth, Firestore, Cloud Functions (Gemini Proxy)
- **Local DB**: IndexedDB (idb)
- **AI**: Google Gemini (Flash 2.5)
- **Calendar**: Google Calendar API v3

---

## 🛠️ 개발 환경 설정

### 주요 환경 파일 (gitignore 대상)
- `.env`: API 키 관리
- `android/app/google-services.json`: Firebase 설정
- `keystore.properties`: 릴리즈 서명 정보 (절대 커밋 금지)

### node_modules 패치
`npm install` 후 아래 명령을 통해 플러그인 버그를 수정해야 합니다.
```bash
sed -i "s/getDefaultProguardFile('proguard-android.txt')/getDefaultProguardFile('proguard-android-optimize.txt')/g" \
  node_modules/@capacitor-community/speech-recognition/android/build.gradle \
  node_modules/@codetrix-studio/capacitor-google-auth/android/build.gradle \
  node_modules/@capacitor-community/admob/android/build.gradle
```

---

## 📖 관련 문서
- **전체 이력**: [PROJECT_HISTORY.md](PROJECT_HISTORY.md)
- **시스템 설계 및 정책**: [DEVELOPMENT.md](DEVELOPMENT.md)
- **메인 소개**: [README.md](README.md)
