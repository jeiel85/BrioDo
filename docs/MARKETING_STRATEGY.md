# BrioDo Marketing Strategy

## App Store Optimization (ASO) - Issue #134

### Current App Title
**BrioDo** (단일 단어)

### Proposed App Title
**BrioDo - AI 잠금화면 할 일 관리** / **BrioDo - AI Lock Screen Todo**

### Target Keywords

| Keyword (KR) | Keyword (EN) | Priority | Competition |
|--------------|--------------|----------|-------------|
| 잠금화면 할일 | lock screen todo | HIGH | LOW |
| AI 투두 | AI todo | HIGH | MEDIUM |
| 음성 다이어리 | voice diary | MEDIUM | LOW |
| 스마트 할일 관리 | smart task manager | HIGH | HIGH |
| 아침 브리핑 | morning briefing | MEDIUM | LOW |
| Google 캘린더 동기화 | Google Calendar sync | HIGH | MEDIUM |
| 무료 할일 관리 | free todo app | MEDIUM | HIGH |

### ASO Implementation Plan

#### 1. App Title Optimization
- Current: "BrioDo"
- Proposed: "BrioDo - AI 잠금화면 할 일 관리" (30자 이내)
- Include primary keyword in title

#### 2. Short Description (80자)
```
AI가 날짜·태그 자동 추출! 음성으로 말하면 바로 등록.
Google 캘린더 실시간 동기화. 잠금화면에서도 확인 가능.
```

#### 3. Full Description Structure
```
[Hook - 2줄]
매일 아침 "안녕, 오늘 할 일 있어?" AI가 묻습니다.

[Problem - 3줄]
할 일 목록이 점점 길어지나요?
기procal 일정 관리가 어려우신가요?
깔끔한 할 일 앱을 찾고 계신가요?

[Solution - 5줄]
BrioDo는 AI가 자동으로 날짜와 태그를 추출해드려요.
말로 입력하면 바로 등록. 캘린더와 실시간 동기화.
잠금화면에서도 할 일을 확인하고 완료 체크.
2주 묵은 할 일은 AI가 정리 제안.

[Features - bullet points]
✓ AI 자연어 입력 - "내일 오후 3시 팀 회의" → 자동 파싱
✓ 음성 인식 - 말만 하면 바로 등록
✓ Google 캘린더 동기화 - 양방향 실시간
✓ 잠금화면 위젯 - 바로 확인, 바로 완료
✓ 통계 & 잔디 심기 - 매일 접속하세요
✓ 오프라인 우선 - 인터넷 없어도 OK

[CTA]
지금 다운로드하고, 활기차게 하루를 시작하세요!
```

#### 4. Screenshots Strategy
- 5-8 screenshots highlighting:
  1. AI voice input screen
  2. Calendar sync visualization
  3. Lock screen widget
  4. Statistics / Streak
  5. Clean todo list UI
  6. Achievement system

#### 5. Category Selection
- Primary: Productivity
- Secondary: Lifestyle

#### 6. Localization
- Korean (default)
- English
- Japanese
- Chinese (Simplified)

---

## Social Viral Loop - Issue #135

### Share Feature Implementation

#### Trigger Points
- 100 tasks completed → Share badge
- 7-day streak achieved → Share celebration
- 30-day streak → Special badge
- First achievement unlocked

#### Share Template Design

**Image Specifications:**
- Size: 1080x1920px (Instagram Story)
- Size: 1200x630px (Twitter/Facebook)
- Format: PNG with transparency

**Template Content:**
```
[BrioDo Badge]
[Achievement Icon]
"[Achievement Name]"
[Stats: X tasks completed | Y day streak]

[App Download]
👇 Install BrioDo
app.briodo | Google Play
```

#### Technical Implementation
```javascript
// html2canvas + Capacitor Share API
import { Share } from '@capacitor/share'

async function shareAchievement(achievement, stats) {
  const canvas = await html2canvas(achievementElement)
  const imageBlob = await canvas.toBlob()

  await Share.share({
    title: 'BrioDo Achievement',
    text: `I just unlocked "${achievement.name}" on BrioDo! ${stats.tasks} tasks done, ${stats.streak} day streak!`,
    url: 'https://play.google.com/store/apps/details?id=app.briodo',
    files: [imageBlob]
  })
}
```

---

## Launch Strategy - Issue #136

### Disquiet (디스콰이엇) Posting

**Title Format:**
```
[서비스 런칭] BrioDo - AI가 아침마다 묻는 "오늘 할 일 있니?"
```

**Content:**
```
안녕하세요, BrioDo 개발자입니다.

"매일 아침 스마트폰 잠금화면을 풀면, AI가 묻습니다.
'오늘 할 일 있니?'"

BrioDo는 AI 자연어 처리, 음성 인식, Google 캘린더 연동을
하나로 결합한 안드로이드 할 일 앱입니다.

주요 차별점:
• 말로 입력하면 AI가 날짜/시간/태그 자동 추출
• 잠금화면 위젯으로 바로 확인 & 완료 체크
• Google 캘린더 실시간 양방향 동기화
• GitHub 잔디처럼 매일 접속하고 싶게 만드는 통계

현재 Google Play에서 베타 공개 중입니다.
검증 사용자분들 피드백 환영합니다!

🔗 Google Play: https://play.google.com/store/apps/details?id=app.briodo
```

### Product Hunt Submission

**Tagline:** "Your AI companion asks 'Do you have tasks today?' every morning"

**Maker Story:**
```
I've been building BrioDo to solve my own problem - I kept forgetting
tasks and checking my phone constantly. Now AI reminds me every morning
and I can see tasks right on my lock screen.

BrioDo is completely free with no ads. Just Google account required.
```

**Launch Checklist:**
- [ ] Prepare 1080x1920 feature images
- [ ] Write compelling tagline
- [ ] Create Maker profile
- [ ] Schedule for optimal timing (Tuesday-Thursday, 3-4 AM PST)
- [ ] Prepare Reddit/HN cross-post

---

## Metrics & KPIs

| Metric | Target (3 months) |
|--------|-------------------|
| Play Store Downloads | 10,000 |
| Daily Active Users | 1,000 |
| 7-Day Retention | 40% |
| ASO Keyword Rankings | Top 10 for "잠금화면 할일" |
| Product Hunt Votes | 500+ |
| Social Shares | 100 |

---

## Timeline

| Week | Milestone |
|------|-----------|
| Week 1 | ASO implementation, Share feature code |
| Week 2 | Share feature testing, Launch page prep |
| Week 3 | Disquiet posting, Soft launch |
| Week 4 | Product Hunt launch, Feedback iteration |
