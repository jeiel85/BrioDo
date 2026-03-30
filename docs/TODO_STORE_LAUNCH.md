# BrioDo 스토어 출시 체크리스트

> 마지막 업데이트: 2026-03-30 (오전 세션)
> 클로가 할 수 없는 **수동 작업** 목록입니다. 하나씩 완료 후 체크하세요.

---

## 🔴 최우선 — Google OAuth 심사 (1~3주 소요, 지금 시작해야 함)

> 참고: `docs/google-oauth-review.md`

- [ ] **Google Cloud Console** → 프로젝트 선택 → API 및 서비스 → OAuth 동의 화면
- [ ] OAuth 동의 화면 기본 정보 입력 (앱 이름, 이메일, 개인정보처리방침 URL)
  - 개인정보처리방침: `https://jeiel85.github.io/BrioDo/privacy-policy.html`
- [ ] "앱 게시" 버튼 클릭 → 심사를 위해 제출
- [ ] 스코프 사용 목적 영문 설명서 붙여넣기 (`google-oauth-review.md` 2번 항목)
- [ ] **데모 영상 촬영** (Galaxy S24 화면 녹화, 1~3분)
  - 촬영 스크립트: `google-oauth-review.md` 3번 항목 참조
- [ ] YouTube 비공개(Unlisted) 업로드 → URL 심사 제출란에 입력

---

## 🟡 APKPure 등록 (24~48시간 심사)

> 참고: `docs/apkpure-submission.md`

- [ ] https://developer.apkpure.com 개발자 계정 가입
- [ ] "Submit App" → APK 업로드
  - APK 경로: `android/app/build/outputs/apk/release/app-release.apk`
- [ ] 설명, 아이콘, 스크린샷 입력
  - 아이콘: `docs/icon-512.png`
  - 스크린샷: `docs/screenshots/` 폴더 내 파일들
- [ ] 개인정보처리방침 URL 입력
- [ ] 제출

---

## 🟡 Google Play Store 준비 (OAuth 심사와 병행)

> 참고: `docs/play-store-submission.md`

- ✅ 개발자 계정 등록 ($25 결제 완료)
- ✅ "앱 만들기" → BrioDo 생성 완료
- ✅ 스토어 설정 → 연락처 세부정보 저장 (이메일: jeiel85@gmail.com, 전화: +8210044722439)
- [ ] **🔴 개발자 신원 인증** — Play Console 상단 배너 "세부정보 보기" 클릭 → 신분증 제출 (1~3일 소요, 내부 테스트 게시 전 필수)
- [ ] 기본 스토어 등록정보 입력 (`Play Console → 앱 정보 → 스토어 등록정보`)
  - 앱 이름: `BrioDo — Do it with brio.` ✅ 입력됨
  - 간단한 설명 (80자): `docs/store-listing.md` 짧은 설명 (한국어, 마크다운 제거 텍스트)
  - 자세한 설명: `docs/store-listing.md` 한국어 전체 설명 (마크다운 제거, 순수 텍스트로 붙여넣기)
  - 아이콘 업로드: `docs/icon-512.png`
  - 피처 그래픽 업로드: `docs/featured-graphic.png`
  - 스크린샷 업로드: `docs/screenshots/01~05_*.png` (5장)
- [ ] 콘텐츠 등급 IARC 설문 완료
- [ ] 데이터 보안 섹션 작성
  - 항목: `docs/store-listing.md` Data Safety 표 참조
- [ ] 앱 액세스 설정 (게스트 모드로 리뷰 가능 설정)
- [ ] 내부 테스트 트랙에 AAB 업로드
  - AAB 경로: `android/app/build/outputs/bundle/release/app-release.aab`
- [ ] (**OAuth 심사 완료 후**) 프로덕션 트랙으로 이동 → 검토 제출

---

## 🟢 Samsung Galaxy Store (계정 승인 대기 중)

- [ ] 계정 승인 이메일 수신 확인
- [ ] "Add New Application" → APK 업로드
  - APK 경로: `android/app/build/outputs/apk/release/app-release.apk`
- [ ] 등록 정보 입력 (한국어 설명, 스크린샷, 아이콘)
- [ ] 국가/지역 선택 (최소 대한민국 포함)
- [ ] 제출 → 5~10 영업일 심사

---

## 완료된 것 ✅

- ✅ GitHub Releases v1.0.0 — APK 다운로드 가능
- ✅ 릴리즈 APK / AAB 빌드 완료 (v1.0.0)
- ✅ 개인정보처리방침 GitHub Pages 배포
- ✅ 앱 아이콘 512px / 피처 그래픽 1024×500
- ✅ 스크린샷 5장 (Galaxy S24 실기기)
- ✅ 스토어 등록 정보 초안 (한/영)
- ✅ OAuth 심사 서류 작성 완료
- ✅ Samsung Galaxy Store 개발자 계정 신청
- ✅ 릴리즈 보안 수정 (난독화, console.log 제거, allowBackup)
- ✅ Play Console 개발자 계정 생성 + 앱 등록 + 연락처 세부정보 저장
