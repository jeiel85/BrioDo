# BrioDo — Google OAuth 앱 심사 제출 서류

> Google Cloud Console → API 및 서비스 → OAuth 동의 화면 → "앱 게시" 심사 요청 시 사용

---

## 제출 정보 요약

| 항목 | 내용 |
|------|------|
| 앱 이름 | BrioDo |
| 패키지 ID | app.briodo |
| 개발자 이메일 | jeiel85@gmail.com |
| 개인정보처리방침 | https://jeiel85.github.io/BrioDo/privacy-policy.html |
| 요청 스코프 | `https://www.googleapis.com/auth/calendar` |

---

## 1. OAuth 동의 화면 설정값

Google Cloud Console에서 아래 내용으로 채우세요.

**앱 이름:** `BrioDo`
**사용자 지원 이메일:** `jeiel85@gmail.com`
**앱 로고:** `docs/icon-512.png` 업로드
**애플리케이션 홈페이지:** `https://github.com/jeiel85/BrioDo`
**개인정보처리방침 링크:** `https://jeiel85.github.io/BrioDo/privacy-policy.html`
**서비스 약관 링크:** `https://jeiel85.github.io/BrioDo/privacy-policy.html`
**개발자 연락처 이메일:** `jeiel85@gmail.com`

---

## 2. 스코프 사용 목적 설명서 (Google 제출용 — 영문 작성 필수)

> Google 심사팀에 제출할 영문 설명서. Google Form 또는 심사 신청 화면의 텍스트 필드에 붙여넣기.

---

### Scope: `https://www.googleapis.com/auth/calendar`

**Why does BrioDo need this scope?**

BrioDo is a smart to-do management app that provides two-way synchronization between user tasks and Google Calendar. Users can optionally connect their Google account to:

1. **Automatically create calendar events** when a task with a date and time is added
2. **Update calendar events** when a task is edited (title, time, priority, completion status)
3. **Delete calendar events** when a task is deleted
4. **Deduplicate and manage** a dedicated "BrioDo" calendar created exclusively for the app

The app creates a single dedicated calendar named "BrioDo" in the user's Google Calendar account. All events are clearly marked with a "B]" prefix so users can identify them. Users can disable calendar sync at any time in the app settings.

**What data does BrioDo access?**

- Creates, reads, updates, and deletes events **only in the BrioDo-dedicated calendar**
- Does not access, read, or modify any other calendars or existing events
- Does not store or transmit raw calendar data to third parties
- Calendar event data is processed locally and synced only between the app and the user's own Google Calendar

**How is the scope used in the UI?**

- Calendar sync is **opt-in** — users must sign in with Google and explicitly enable sync
- Guest mode is available without any Google account or calendar access
- Calendar sync can be disabled independently of Google account sign-in

---

## 3. 데모 영상 촬영 가이드

> YouTube에 비공개(Unlisted)로 업로드 후 URL 제출. 길이: 1~3분 권장.

### 촬영 순서 (스크립트)

```
[0:00~0:15] 인트로
- 앱 아이콘 클릭 → BrioDo 실행
- "BrioDo는 Google Calendar와 연동되는 스마트 할 일 관리 앱입니다."

[0:15~0:40] Google 로그인 + Calendar 권한 동의
- 설정 탭 → "Google로 로그인" 버튼 탭
- Google 계정 선택 화면 표시
- 권한 동의 화면에서 Calendar 접근 권한 확인 후 허용
- "사용자가 Calendar 권한에 명시적으로 동의합니다."

[0:40~1:10] 캘린더 연동 할 일 추가
- "+" 버튼 → 할 일 입력 모달 열기
- 제목 입력: "팀 회의"
- 날짜: 오늘
- 시간: 오후 3:00 설정
- "저장" 탭
- Google Calendar 앱으로 전환 → BrioDo 캘린더에 "🟡 B] 팀 회의" 이벤트 생성 확인

[1:10~1:40] 할 일 완료 → 캘린더 업데이트
- BrioDo로 돌아와 "팀 회의" 할 일 완료 체크
- Google Calendar 앱으로 전환 → 이벤트가 회색(완료)으로 업데이트 확인

[1:40~2:00] 캘린더 동기화 설정 끄기
- 설정 탭 → "캘린더 동기화" 토글 OFF
- "사용자가 언제든 동기화를 해제할 수 있습니다."

[2:00~2:10] 마무리
- "BrioDo는 사용자의 BrioDo 전용 캘린더만 접근하며,
   다른 캘린더나 이벤트는 읽거나 수정하지 않습니다."
```

### 촬영 팁
- Galaxy S24 화면 녹화 사용 (빠른 설정 패널 → 화면 녹화)
- 마이크 켜고 위 스크립트 읽으면서 촬영
- YouTube 업로드: 공개 범위 → **비공개(Unlisted)** 설정 (검색 노출 없이 URL로만 접근)

---

## 4. 심사 요청 절차

1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. BrioDo 프로젝트 선택
3. **API 및 서비스** → **OAuth 동의 화면**
4. 화면 하단 **"앱 게시"** 버튼 클릭
5. 팝업에서 "프로덕션으로 이동" 확인
6. 스코프 심사 필요 항목 확인 → **"심사를 위해 제출"** 클릭
7. 위 설명서 내용 + 데모 영상 URL 입력 후 제출

> ⏱ 심사 기간: 통상 1~3주. 미완료 시 앱은 "테스트" 모드 유지 (100명 사용자 제한).

---

## 5. 심사 대기 중 운영 방법 (테스트 모드)

심사 완료 전에도 아래 방법으로 100명까지 테스트 가능:

1. Google Cloud Console → OAuth 동의 화면 → **테스트 사용자** 탭
2. "사용자 추가" → 테스트할 Google 계정 이메일 입력
3. 추가된 계정은 심사 완료 전에도 정상적으로 Google 로그인 + 캘린더 연동 사용 가능
