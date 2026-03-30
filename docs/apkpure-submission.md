# BrioDo — APKPure 등록 가이드

> APKPure: https://developer.apkpure.com
> 비용: 무료 | 심사 기간: 24~48시간

---

## 사전 준비

- [x] 릴리즈 APK: `android/app/build/outputs/apk/release/app-release.apk`
- [x] 앱 아이콘: `docs/icon-512.png`
- [x] 스크린샷: `docs/screenshots/` 폴더
- [x] 개인정보처리방침 URL: `https://jeiel85.github.io/BrioDo/privacy-policy.html`

---

## 등록 절차

### 1단계: 개발자 계정 생성
1. https://developer.apkpure.com 접속
2. "Sign Up" → Google 계정 또는 이메일로 가입
3. 이메일 인증 완료

### 2단계: 앱 등록
1. 대시보드 → "Submit App" 클릭
2. APK 파일 업로드: `app-release.apk`
3. APKPure가 자동으로 앱 정보 파싱 (패키지명, 버전 등)

### 3단계: 등록 정보 입력

**앱 이름:** `BrioDo`
**패키지명:** `app.briodo` (자동 감지)
**버전:** `1.0.0` (자동 감지)
**카테고리:** Productivity

**짧은 설명:**
```
AI와 함께하는 스마트 할 일 관리 — 활기차게, 해내다.
```

**전체 설명:**
```
BrioDo — 활기차게, 해내다.

AI가 당신의 할 일을 똑똑하게 정리해줍니다.

주요 기능:
• AI 자연어 할 일 입력 (Gemini 2.5)
• 음성 인식 입력
• Google 캘린더 양방향 동기화
• 오프라인 우선 동작
• 게스트 모드 (로그인 불필요)
• 우선순위, 태그, 캘린더 뷰
• 200개 업적 시스템
• 다크 모드 + 랜덤 테마
• 한국어/영어/일본어/중국어 지원

Privacy Policy: https://jeiel85.github.io/BrioDo/privacy-policy.html
```

### 4단계: 이미지 업로드
- **아이콘:** `docs/icon-512.png`
- **스크린샷:** `docs/screenshots/01_today.png` ~ `05_tasks.png` (최소 3장)

### 5단계: 개인정보처리방침 URL 입력
```
https://jeiel85.github.io/BrioDo/privacy-policy.html
```

### 6단계: 제출
- "Submit for Review" 클릭
- 24~48시간 내 승인/반려 이메일 수신

---

## APKMirror 등록 (추가 옵션)

> APKMirror는 더 까다로운 서명 검증 프로세스가 있음.
> https://www.apkmirror.com/developers/

1. developers@apkmirror.com 로 이메일 문의
   - 주제: "Developer account request for BrioDo (app.briodo)"
   - 내용: 앱 이름, 패키지명, GitHub 링크, 개발자 연락처
2. 계정 승인 후 APK 업로드
3. 동일 키스토어로 서명된 APK만 수락

> APKMirror는 자동 게재보다 개발자 검증이 먼저이므로, APKPure를 우선 진행 권장.
