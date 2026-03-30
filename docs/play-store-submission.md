# BrioDo — Google Play Store 제출 체크리스트

> Play Console: https://play.google.com/console
> 개발자 계정 등록비: USD $25 (1회)

---

## 제출 전 체크리스트

- [ ] 개발자 계정 등록 ($25 결제 완료)
- [ ] Google OAuth 심사 제출 (`docs/google-oauth-review.md` 참조)
- [ ] AAB 파일: `android/app/build/outputs/bundle/release/app-release.aab`
- [ ] 아이콘: `docs/icon-512.png` (512×512 PNG)
- [ ] 피처 그래픽: `docs/featured-graphic.png` (1024×500 PNG)
- [ ] 스크린샷: `docs/screenshots/` (5장)

---

## Play Console 입력값 (복붙용)

### 기본 정보

| 항목 | 값 |
|------|-----|
| 앱 이름 | `BrioDo` |
| 기본 언어 | 한국어 (ko-KR) |
| 앱 유형 | 앱 |
| 무료/유료 | 무료 |

---

### 스토어 등록 정보 → 한국어

**짧은 설명** (80자 이내):
```
AI와 함께하는 스마트 할 일 관리 — 활기차게, 해내다.
```

**전체 설명** (4000자 이내):
```
BrioDo — 활기차게, 해내다.

AI가 당신의 할 일을 똑똑하게 정리해줍니다.

🤖 AI 스마트 입력
자연어로 입력하세요. "내일 오전 10시에 팀 미팅"이라고 쓰면 날짜, 시간, 태그가 자동으로 설정됩니다. Gemini AI가 할 일을 분석해 우선순위와 태그를 자동 추출합니다.

🎤 음성 입력
말하는 대로 할 일이 만들어집니다. Android 네이티브 음성 인식으로 빠르게 기록하세요.

📅 Google 캘린더 연동
BrioDo의 할 일이 Google 캘린더와 자동 동기화됩니다. 어디서나 일정을 확인하세요.

⚡ 브리오 시스템
AI 기능을 사용하면 브리오 포인트가 소모됩니다. 보상형 광고를 시청하거나 매일 출석하면 포인트를 충전할 수 있습니다.

🌐 오프라인 우선
인터넷이 없어도 완벽하게 동작합니다. 온라인 상태가 되면 자동으로 클라우드에 동기화됩니다.

🎨 완전한 커스터마이징
다양한 테마, 폰트, 색상을 자유롭게 설정하세요. 나만의 할 일 앱을 만들어보세요.

🌍 다국어 지원
한국어, English, 日本語, 中文을 지원합니다.

■ 주요 기능
• 자연어 AI 할 일 입력 (Gemini 2.5)
• 음성 인식 입력
• Google 캘린더 양방향 동기화
• 오프라인 우선 (IndexedDB + Firebase)
• 게스트 모드 (로그인 없이 사용 가능)
• 우선순위 설정 (낮음 / 보통 / 높음 / 긴급)
• 태그 자동 추출 및 필터링
• 캘린더 뷰 (월간/주간/일간)
• 다크 모드 및 랜덤 테마
• 200개 업적 시스템
• 4개 언어 지원

개인정보처리방침: https://jeiel85.github.io/BrioDo/privacy-policy.html
```

---

### 스토어 등록 정보 → English (번역 추가)

**Short description:**
```
Smart AI-powered to-do manager — Do it with brio.
```

**Full description:**
```
BrioDo — Do it with brio.

Let AI organize your tasks the smart way.

🤖 AI Smart Input
Just type naturally. Write "team meeting tomorrow at 10am" and BrioDo automatically sets the date, time, and tags. Powered by Gemini AI.

🎤 Voice Input
Create tasks by speaking. Native Android speech recognition makes it fast and easy.

📅 Google Calendar Sync
Your tasks sync automatically with Google Calendar. Stay on top of your schedule everywhere.

⚡ Brio System
AI features use Brio points. Recharge by watching optional rewarded ads or checking in daily.

🌐 Offline First
Works perfectly without internet. Syncs to the cloud automatically when you're back online.

🎨 Full Customization
Choose from various themes, fonts, and colors. Make it truly yours.

🌍 Multilingual
Supports Korean, English, Japanese, and Chinese.

■ Key Features
• Natural language AI task input (Gemini 2.5)
• Voice recognition input
• Google Calendar two-way sync
• Offline-first (IndexedDB + Firebase)
• Guest mode (no sign-in required)
• Priority levels (low / medium / high / urgent)
• Auto tag extraction & filtering
• Calendar views (monthly / weekly / daily)
• Dark mode & random themes
• 200 achievements system
• 4 language support

Privacy Policy: https://jeiel85.github.io/BrioDo/privacy-policy.html
```

---

### 앱 카테고리

| 항목 | 값 |
|------|-----|
| 카테고리 | 생산성 (Productivity) |
| 태그 | 할 일, 생산성, AI, 캘린더, 작업관리 |

---

### 콘텐츠 등급 (IARC 설문)

Play Console → 앱 콘텐츠 → 콘텐츠 등급 → 설문 작성:

| 질문 | 답변 |
|------|------|
| 앱 유형 | 유틸리티/생산성 |
| 폭력적인 콘텐츠 | 아니오 |
| 성인 콘텐츠 | 아니오 |
| 도박 | 아니오 |
| 사용자 생성 콘텐츠 | 아니오 |
| 위치 공유 | 아니오 |

→ 예상 등급: **전체이용가 (Everyone)**

---

### 데이터 보안 (Data Safety)

Play Console → 앱 콘텐츠 → 데이터 보안

**수집하는 데이터:**

| 데이터 유형 | 항목 | 목적 | 공유 여부 | 필수 여부 |
|------------|------|------|----------|----------|
| 개인 정보 | 이메일 주소 | 계정 관리 | 아니오 | 아니오 (선택) |
| 개인 정보 | 이름 | 계정 관리 | 아니오 | 아니오 (선택) |
| 앱 활동 | 기타 사용자 생성 콘텐츠 (할 일 데이터) | 앱 기능 | 아니오 | 예 |
| 광고 또는 마케팅 | 광고 ID | 광고 | AdMob | 아니오 (선택) |

**공유하는 데이터:**

| 데이터 유형 | 대상 | 목적 |
|------------|------|------|
| 광고 ID | Google AdMob | 보상형 광고 제공 |

**보안 관행:**
- [x] 전송 중 데이터 암호화 (HTTPS/TLS)
- [x] 데이터 삭제 요청 제공

**계정 삭제 방법:**
설정 → 계정 → 로그아웃 (로컬 데이터 삭제) / 또는 jeiel85@gmail.com으로 삭제 요청

---

### 앱 액세스

- 앱의 모든 기능 또는 일부를 사용하려면 특별한 액세스가 필요한가요? → **예 (일부 기능)**
- 설명: 게스트 모드로 로그인 없이 기본 기능 사용 가능. AI 기능 및 캘린더 동기화는 Google 로그인 필요.
- 테스트 계정: 불필요 (게스트 모드로 리뷰어가 앱 사용 가능)

---

### 릴리즈 노트 v1.0.0

**한국어:**
```
BrioDo v1.0.0 첫 출시!

• AI 자연어 할 일 입력 (Gemini 2.5)
• 음성 인식 입력
• Google 캘린더 양방향 동기화
• 오프라인 우선 데이터 관리
• 게스트 모드 지원
• 200개 업적 시스템
• 한국어/영어/일본어/중국어 지원
```

**English:**
```
BrioDo v1.0.0 — First Release!

• AI natural language task input (Gemini 2.5)
• Voice recognition input
• Google Calendar two-way sync
• Offline-first data management
• Guest mode (no sign-in required)
• 200 achievements system
• Korean / English / Japanese / Chinese support
```

---

### 개인정보처리방침

```
https://jeiel85.github.io/BrioDo/privacy-policy.html
```

---

## 제출 순서

1. [Play Console](https://play.google.com/console) → 앱 만들기
2. 스토어 등록 정보 작성 (위 내용 복붙)
3. 콘텐츠 등급 설문 완료
4. 데이터 보안 섹션 작성
5. 앱 액세스 설정
6. 프로덕션 트랙 → 새 버전 → AAB 업로드
7. 출시 노트 작성
8. 검토 제출

> ⚠️ Google OAuth 심사 통과 전까지는 Google 로그인 기능이 테스트 모드(100명 제한)로 운영됩니다.
> 내부 테스트 트랙에 먼저 제출하여 심사를 받는 것을 권장합니다.
