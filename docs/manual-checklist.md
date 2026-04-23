# BrioDo — 직접 처리해야 할 항목 체크리스트

> Claude Code가 대신 처리할 수 없는 **콘솔/브라우저 작업** 목록입니다.
> 완료된 항목은 `[ ]` → `[x]`로 바꿔서 기록해 두세요.

---

## 🔐 보안 설정 (배포 전 반드시 처리)

### 1. Gemini API 키 — 일일 할당량 제한

APK에 키가 번들되기 때문에, 누군가 키를 탈취해 대량 호출하더라도 피해를 제한하는 설정입니다.

- [ ] [Google Cloud Console](https://console.cloud.google.com) → 프로젝트 선택
- [ ] "API 및 서비스" → "사용자 인증 정보" → Gemini API 키 클릭
- [ ] "API 제한사항" → "키 제한" → `Generative Language API` 만 선택
- [ ] "할당량" 탭 → `Generative Language API` → 일일 요청 수 제한 설정 (예: **2,000 req/일**)
  - 일반 사용자 기준 충분한 수치. 필요 시 나중에 올리면 됨

---

### 2. Firebase API 키 — 앱/패키지 제한

Firebase API 키도 APK에 포함되므로, `app.briodo` 패키지 + 등록된 SHA-1에서만 동작하도록 제한합니다.

- [ ] [Google Cloud Console](https://console.cloud.google.com) → "사용자 인증 정보" → Firebase용 API 키 클릭
  - 키 이름: 보통 `Android key (auto created by Firebase)` 형태
- [ ] "앱 제한사항" → "Android 앱" 선택
- [ ] 패키지 이름 추가: `app.briodo`
- [ ] SHA-1 인증서 지문 추가 (두 PC 모두):
  ```
  1D:09:7C:59:11:25:22:D5:C4:46:49:4E:5B:F9:73:40:CE:57:F4:7A
  C4:CF:5D:3D:01:DE:71:6A:63:DA:73:C5:36:34:C2:CD:9E:39:33:AE
  ```
- [ ] 저장

> **주의**: 이 설정 후 웹 브라우저에서 Firebase를 사용하는 경우(Hosting 등) 별도 웹용 키가 필요합니다. BrioDo는 순수 Android 앱이므로 문제없습니다.

---

## 💰 비용 모니터링 설정 (배포 전 반드시 처리)

### 3. Google Cloud — 예산 알림

- [ ] [Google Cloud Console](https://console.cloud.google.com) → 좌측 메뉴 "결제" → "예산 및 알림"
- [ ] "예산 만들기" 클릭
- [ ] 예산 유형: 지정 금액 → **$5/월**
- [ ] 알림 기준: 50% / 90% / 100% 에서 이메일 수신 설정
- [ ] 저장

> 이 알림은 비용을 막지는 않지만, 예상치 못한 폭탄 청구를 사전에 감지합니다.

---

### 4. Firebase — Blaze 플랜 전환 시점 파악

현재 Spark(무료) 플랜 한도:
| 항목 | 한도 |
|------|------|
| Firestore 읽기 | 50,000회/일 |
| Firestore 쓰기 | 20,000회/일 |
| Firestore 저장소 | 1 GB |
| Firebase Auth | 무제한 |

- [ ] [Firebase Console](https://console.firebase.google.com) → 프로젝트 선택 → "사용량" 탭에서 현황 확인
- [ ] 한도의 **70% 이상** 도달 시 Blaze 플랜으로 전환 (초과해도 앱이 중단될 뿐 자동 청구 없음)
  - Blaze 전환 후 Firebase에도 월 예산 한도 설정 가능

---

## 🚀 Google Play Store 출시 전 처리 (Play Store 제출 시)

### 5. OAuth 동의 화면 — 프로덕션 전환

현재 "테스트" 상태 → **100명 사용자 제한**. Play Store 출시 전 필수.

- [ ] [Google Cloud Console](https://console.cloud.google.com) → "API 및 서비스" → "OAuth 동의 화면"
- [ ] "앱 게시" 버튼 클릭 → 심사 요청
- [ ] 준비 서류:
  - [ ] 앱 동작 데모 영상 (Google Calendar 사용 장면 포함, 1~3분)
  - [ ] 개인정보처리방침 URL (공개 웹페이지 필요)
  - [ ] OAuth 사용 목적 설명 (한국어/영어)
- [ ] 검토 기간: 수 일 ~ 수 주 소요

---

### 6. Play Store — 개인정보처리방침 페이지

모든 앱 스토어에서 필수. 외부에서 접근 가능한 URL이어야 합니다.

- [ ] 개인정보처리방침 작성 (수집 항목: 이메일, 할 일 데이터, Google Calendar 접근)
- [ ] 공개 URL에 게시 (예: GitHub Pages, Notion 공개 페이지, 개인 블로그 등)
- [ ] Play Console "앱 콘텐츠" 섹션에 URL 입력

---

## 📦 첫 배포 전 버전 태그 절차 (GitHub Releases)

코드 작업은 Claude가 하지만, **릴리즈 노트 내용**은 직접 확인 후 편집하세요.

```bash
# Claude가 실행하는 명령 (참고용)
git tag v1.0.0
git push --tags
gh release create v1.0.0 \
  android/app/build/outputs/apk/release/app-release.apk \
  --title "BrioDo v1.0.0" \
  --notes "첫 공개 릴리즈"
```

- [ ] 릴리즈 노트 내용 확인 및 편집
- [ ] GitHub → Releases 페이지에서 정상 게시 확인

---

## ✅ 완료 기록

| 날짜 | 항목 | 비고 |
|------|------|------|
| | | |
