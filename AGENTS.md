# BrioDo — AI 에이전트 개발 지침 (AGENTS.md)

이 문서는 BrioDo 프로젝트의 AI 에이전트(Claude, Gemini 등)를 위한 핵심 개발 지침입니다. 에이전트는 모든 세션에서 이 규칙을 최우선으로 준수해야 합니다.

---

## ⚡ 1. 개발 워크플로우 규칙

1. **커밋 + 푸시 자동 세트**: 소스코드 변경 시 즉시 `git commit` + `git push` 처리. (메시지는 한국어)
2. **빌드 파이프라인**: "빌드해줘" / "디바이스에 올려줘" 등 명시적 요청 시에만 실행. (Galaxy S24 설치 완료 기준)
3. **이력 관리**: 기능 추가/수정 시 `PROJECT_HISTORY.md`에 세션별 기록 후 커밋.
4. **버전 번호 동기화**: `App.jsx`의 `APP_VERSION`과 `build.gradle`의 `versionName/versionCode` 항상 동시 수정.
5. **GitHub 이슈**: 모든 작업은 GitHub 이슈를 먼저 생성하여 관리하고, 작업 완료 후 버전을 올리고 릴리즈 수행.
6. **릴리즈 노트 필수 반영**: 태그 릴리즈(`v*`)마다 사용자 변경사항 중심의 릴리즈 노트를 반드시 작성/검증.

---

## 🏗️ 2. 아키텍처 및 코딩 원칙

### 핵심 설계 원칙
- **오프라인 우선**: IndexedDB(idb)에 즉시 저장 → Firestore 비동기 동기화.
- **데이터 무손실**: 게스트 모드 마이그레이션, 캘린더 타임스탬프 충돌 해결 로직 준수.
- **AI 비동기**: AI 분석(제목 정제, 태그 추출 등)은 저장 완료 후 300ms 딜레이를 두고 처리.
- **캘린더 싱글톤**: `ensureBrioDoCalendar()` Promise 싱글톤 패턴 유지.

### 기술 스택 및 컨벤션
- **언어**: TypeScript 없이 순수 JavaScript 사용.
- **스타일**: Material Design 3 토큰 기반 커스텀 CSS (Manrope + Inter 폰트).
- **컴포넌트**: 모든 컴포넌트는 함수형 + Hooks (Class 컴포넌트 금지).
- **네이밍**: 컴포넌트는 PascalCase, 훅/유틸은 camelCase (use 접두사 필수).
- **비동기**: async/await + try-catch 필수 사용.

---

## 📦 3. 데이터 구조 및 프로젝트 레이아웃

### Todo 객체 스키마
```javascript
{
  id: string,               // Firestore ID 또는 "guest_timestamp"
  uid: string,              // Firebase 유저 ID
  text: string,             // 할 일 내용
  description: string,      // 상세 설명
  date: "YYYY-MM-DD",
  time: "HH:MM",            // 24시간 형식
  tags: string[],           // AI 추출 태그
  priority: "low|medium|high|urgent",
  completed: boolean,
  googleEventId: string,    // Google Calendar 동기화용
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 주요 파일 구조
- `App.jsx`: 루트 오케스트레이션
- `firebase.js`: Firebase 및 Gemini 초기화
- `calendar.js`: Google Calendar API 연동
- `db.js`: IndexedDB CRUD 로직
- `src/hooks/`: 인증(useAuth), 데이터(useTodosData), 테마(useTheme) 등 핵심 비즈니스 로직
- `src/components/`: UI 위젯 (SmartInputModal 등)

---

## 🛠️ 4. 에이전트용 필수 명령어

### node_modules 패치 (npm install 후 실행)
```bash
sed -i "s/getDefaultProguardFile('proguard-android.txt')/getDefaultProguardFile('proguard-android-optimize.txt')/g" \
  node_modules/@capacitor-community/speech-recognition/android/build.gradle \
  node_modules/@codetrix-studio/capacitor-google-auth/android/build.gradle \
  node_modules/@capacitor-community/admob/android/build.gradle
```

### 릴리즈 명령어
```bash
npm run release 1.x.x
```

### 릴리즈 노트 반영 규칙 (필수)
- 태그 생성 후 GitHub Release 본문이 자동 템플릿(커밋/빌드 시각)만 들어갔는지 반드시 확인한다.
- 모든 정식 릴리즈(`v*`)는 아래 형식을 기본으로 사용한다.
```md
## BrioDo vX.Y.Z

### 주요 변경
- 사용자 체감 변경사항 2개 이상

### 기술 변경
- 내부 수정/버그 원인/버전 메타데이터 변경
```
- 릴리즈 노트에는 최소 2개 이상의 실질 변경점을 적고, 단순 버전 범프만 있는 경우에도 "안정화 릴리즈" 목적과 변경된 메타데이터(versionCode/versionName)를 명시한다.
- 릴리즈 직후 검증 순서:
  1) `gh release view vX.Y.Z --json body`로 본문 확인
  2) 누락/템플릿 본문이면 즉시 `gh release edit vX.Y.Z --notes "<본문>"`로 수정
  3) 수정 사실을 `PROJECT_HISTORY.md`에 기록

---

## 📖 5. 참조 문서
- **상세 시스템 설계/운영**: [DEVELOPMENT.md](DEVELOPMENT.md)
- **전체 개발 이력**: [PROJECT_HISTORY.md](PROJECT_HISTORY.md)
