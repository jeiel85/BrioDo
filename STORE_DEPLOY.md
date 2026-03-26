# BrioDo 앱스토어 배포 가이드

> 마지막 업데이트: 2026-03-26
> 현재 버전: v1.0.0 (`app.briodo`)

---

## 사전 준비 (모든 스토어 공통)

### 1. 릴리즈 APK / AAB 빌드

```bash
# 1. 웹 에셋 빌드
npm run build

# 2. Android 동기화
npx cap sync android

# 3-A. Play Store용 AAB (권장)
cd android && ./gradlew bundleRelease
# 출력: android/app/build/outputs/bundle/release/app-release.aab

# 3-B. 기타 스토어 / 직접 배포용 APK
cd android && ./gradlew assembleRelease
# 출력: android/app/build/outputs/apk/release/app-release.apk
```

### 2. 릴리즈 서명 설정 확인

`keystore.properties` (루트, git 제외):
```properties
storeFile=blenddo-release.jks
storePassword=blenddo2024
keyAlias=blenddo
keyPassword=blenddo2024
```

키스토어 파일: `android/app/blenddo-release.jks`

### 3. 버전 번호 관리

`android/app/build.gradle`:
```groovy
versionCode 1          // 업로드마다 +1 증가 (스토어 내부용)
versionName "1.0.0"    // 사용자에게 표시되는 버전
```

> **중요**: 동일 versionCode로는 스토어에 재업로드 불가. 업데이트마다 반드시 versionCode를 올릴 것.

### 4. 필수 자산 준비

| 항목 | 규격 | 비고 |
|------|------|------|
| 앱 아이콘 (고해상도) | 512×512 px, PNG | 투명 배경 가능 |
| 스크린샷 (세로) | 최소 1080×1920 px | 스토어별 2~8장 |
| 피처 그래픽 | 1024×500 px, JPG/PNG | Play Store 필수 |
| 개인정보처리방침 URL | https:// 접근 가능한 URL | 모든 스토어 필수 |

---

## Google Play Store

**비용**: 개발자 계정 등록비 USD $25 (1회)
**심사 기간**: 영업일 기준 3~7일 (첫 앱) / 수 시간~1일 (업데이트)

### 배포 절차

1. **개발자 계정 등록**
   [Google Play Console](https://play.google.com/console) → 개발자 계정 생성 → $25 결제

2. **앱 만들기**
   Play Console → "앱 만들기" → 앱 이름(BrioDo) / 기본 언어(한국어) / 앱 유형(앱) / 무료

3. **스토어 등록 정보 작성**
   - 짧은 설명 (80자 이내): `AI와 함께하는 스마트 할 일 관리 — Do it with brio.`
   - 전체 설명 (4000자 이내): 주요 기능 설명
   - 스크린샷: 세로 최소 2장, 가로 옵션
   - 피처 그래픽: 1024×500 px
   - 앱 아이콘: 512×512 px

4. **콘텐츠 등급 설문**
   "앱 콘텐츠" → "콘텐츠 등급" → IARC 설문 완료 → 등급 자동 발급 (통상 Everyone/전체이용가)

5. **개인정보처리방침**
   접근 가능한 URL 입력 필수. Firebase Auth + Google Calendar 데이터 처리 내용 포함 필요.

6. **앱 액세스**
   로그인 없이도 기본 사용 가능 (게스트 모드) → "앱의 일부 기능에 제한된 액세스 필요" 선택
   테스터 계정 정보 제공 가능

7. **대상 독자 및 콘텐츠**
   연령 제한: 없음 (13세 이상 권장)

8. **AAB 업로드**
   "프로덕션" → "새 버전 만들기" → `app-release.aab` 업로드
   릴리즈 노트 작성 (한국어/영어)

9. **검토 제출**

### Google Play 주의사항

- **Data Safety 섹션 필수**: Firebase Auth(이메일), Firestore(할 일 데이터) 수집 항목 명시
- **TARGET_SDK**: `targetSdkVersion` 34 이상 유지 (현재 설정 확인 필요)
- **인터넷 권한**: `AndroidManifest.xml`에 `INTERNET` 권한 선언 확인
- **Calendar API**: Google Cloud Console에서 OAuth 동의 화면 "프로덕션" 상태로 전환 필요
  (현재 테스트 모드라면 100명 사용자 제한)

---

## Samsung Galaxy Store

**비용**: 무료
**심사 기간**: 영업일 기준 5~10일

### 배포 절차

1. **개발자 계정**
   [Samsung Seller Portal](https://seller.samsungapps.com) 가입 (무료)

2. **앱 등록**
   "Add New Application" → Android → APK 업로드 (`app-release.apk`)

3. **등록 정보**
   - 앱 이름, 설명, 카테고리 (생산성)
   - 스크린샷 최소 4장
   - 아이콘 512×512 px

4. **국가/지역 선택**
   한국 포함 원하는 국가 체크

5. **제출**
   Samsung 내부 검토 후 승인 시 Galaxy Store에 게재

### Galaxy Store 주의사항

- **APK 서명**: 릴리즈 키스토어로 서명된 APK 필요 (debug keystore 불가)
- **Samsung DeX**: 태블릿/PC 연결 시 대화면 지원 여부 명시 가능

---

## Amazon Appstore

**비용**: 무료 (수익의 20% 수수료, 첫 $1M은 수수료 없음)
**심사 기간**: 영업일 기준 1~3일

### 배포 절차

1. **개발자 계정**
   [Amazon Developer Console](https://developer.amazon.com) 가입

2. **앱 제출**
   "Add a New App" → Android → APK 업로드

3. **가용성 및 가격**
   무료 선택, 국가 설정

4. **등록 정보**
   스크린샷 최소 3장, 아이콘 114×114 / 512×512 px

5. **제출 및 검토**

### Amazon 주의사항

- **Google Play Services**: Amazon 기기(Fire tablet 등)는 Google Play Services 미탑재 → Firebase, Google 로그인이 Amazon 기기에서 작동하지 않을 수 있음
- **현실적 제약**: BrioDo는 Firebase/Google 서비스에 의존하므로 Amazon Fire 기기 지원은 제한적

---

## APKPure / APKMirror (서드파티)

**비용**: 무료
**심사**: APKMirror는 개발자 검증 필요, APKPure는 거의 즉시

### APKMirror

1. [APKMirror 개발자 등록](https://www.apkmirror.com/developers/)
2. 릴리즈 서명된 APK 업로드
3. 앱 정보 및 버전 기록 작성
4. 자동 서명 검증 — 동일 키스토어로 서명된 APK만 허용

### APKPure

1. [APKPure 개발자 센터](https://developer.apkpure.com) 가입
2. APK 업로드 및 앱 정보 입력
3. 검토 후 게재 (보통 24~48시간)

### 직접 GitHub Releases 배포

GitHub 리포지터리 Releases에 APK를 첨부하는 방법도 유효함:
```bash
gh release create v1.0.0 \
  android/app/build/outputs/apk/release/app-release.apk \
  --title "BrioDo v1.0.0" \
  --notes "첫 공개 릴리즈"
```

---

## F-Droid

**비용**: 무료
**심사**: 수 주 ~ 수 개월 (커뮤니티 리뷰)
**요건**: 완전 오픈소스, 빌드 재현성(reproducible build), 비자유 종속성 없음

### F-Droid의 현실적 제약

BrioDo는 현재 다음 이유로 F-Droid 등록이 **어렵습니다**:

| 항목 | 요건 | 현황 |
|------|------|------|
| 소스코드 공개 | 필수 (GitHub 공개 리포) | ✅ 공개 |
| 오픈소스 라이선스 | 필수 | ⚠️ 라이선스 파일 미작성 |
| 비자유 종속성 | 없어야 함 | ❌ Firebase, Google Sign-In, Gemini AI (모두 사유 서비스) |
| API 키 하드코딩 | 없어야 함 | ❌ `.env`로 관리하지만 빌드 시 번들에 포함 |
| 빌드 재현성 | F-Droid 서버에서 직접 빌드 가능해야 함 | ❌ API 키 없이는 빌드 불가 |

**결론**: Firebase / Gemini / Google Calendar에 의존하는 현재 구조로는 F-Droid 등록 불가. 향후 오프라인 전용 모드 + 자체 서버 옵션을 제공하는 방향으로 리팩토링 시 검토 가능.

---

## 업데이트 배포 시 체크리스트

```
[ ] android/app/build.gradle — versionCode +1, versionName 업데이트
[ ] npm run build && npx cap sync android
[ ] ./gradlew bundleRelease (Play Store) / assembleRelease (기타)
[ ] Play Store: 릴리즈 노트 작성 후 "프로덕션" 트랙에 AAB 업로드
[ ] Galaxy Store: 새 버전 APK 업로드
[ ] GitHub Releases: 태그 생성 + APK 첨부
[ ] PROJECT_HISTORY.md 버전 기록 갱신
```

---

## Google Cloud Console — 프로덕션 전환 필수

Google Calendar API는 OAuth 동의 화면이 **"테스트" 상태면 100명 사용자 제한**이 걸립니다.
Play Store 출시 전 반드시 "프로덕션" 상태로 전환하세요.

1. [Google Cloud Console](https://console.cloud.google.com) → 프로젝트 선택
2. "API 및 서비스" → "OAuth 동의 화면"
3. "앱 게시" 버튼 클릭 → 심사 요청 (민감한 스코프 사용 시 Google 검토 필요)
   - `https://www.googleapis.com/auth/calendar` 는 민감한 스코프 → 앱 검토 필요
   - 검토 기간: 수 일 ~ 수 주
   - 필요 서류: 앱 동작 데모 영상, 개인정보처리방침, OAuth 사용 목적 설명

---

## 권장 배포 순서

```
1단계: GitHub Releases (즉시 가능, APK 직접 다운로드)
2단계: APKMirror / APKPure (며칠 내 가능)
3단계: Samsung Galaxy Store (1~2주 소요)
4단계: Google Play Store (Google OAuth 심사 + Play 심사 포함 2~4주 예상)
5단계: Amazon Appstore (Firebase 제한 감안하여 우선순위 낮음)
```

> **팁**: GitHub Releases 배포를 먼저 해서 지인/베타 테스터에게 테스트 받고, 피드백 반영 후 공식 스토어 제출을 권장합니다.
