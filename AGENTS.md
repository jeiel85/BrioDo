# BrioDo 릴리즈 가이드

## CI/CD 동작 방식

| 액션 | 트리거되는 작업 |
|------|----------------|
| `git push origin main` (일반 푸시) | 웹 빌드 테스트 + ESLint만 실행. APK 빌드 없음. |
| `git push origin v1.x.x` (태그 푸시) | Android 릴리즈 빌드 추가 실행 → 서명 APK 생성 + GitHub Release 자동 생성 |

버전 올릴 때만 태그 푸시하면 된다.

---

## 릴리즈 프로세스 요약

```bash
npm run release 1.x.x
```

이 명령 하나로 아래를 자동 처리한다:
1. `src/App.jsx` `APP_VERSION` 업데이트
2. `android/app/build.gradle` `versionCode` + `versionName` 업데이트
3. 두 파일 버전 일치 검증
4. 커밋 + 푸시 + 태그 푸시 → CI 자동 빌드 트리거

> 수동으로 하려면 아래 단계를 따른다.

---

## 수동 릴리즈 (참고용)

### 1단계: 버전 번호 수정

두 파일을 항상 함께 수정한다.

**`src/App.jsx`**
```js
const APP_VERSION = '1.x.x'
```

**`android/app/build.gradle`**
```groovy
versionCode N        // 숫자 1 증가
versionName "1.x.x"
```

### 2단계: 커밋 + 푸시

```bash
git add src/App.jsx android/app/build.gradle
git commit -m "bump: v1.x.x → v1.x.x (versionCode N → N+1)"
git push origin main
```

### 3단계: 태그 푸시 (릴리즈 트리거)

```bash
git tag v1.x.x
git push origin v1.x.x
```

태그 푸시 즉시 GitHub Actions CI가 트리거된다.

---

## 4단계: CI 자동 처리 (~5분 소요)

CI(`android-release` 잡)가 자동으로:
1. 서명 APK (`app-release.apk`) 빌드
2. GitHub Release 생성 (Latest, prerelease: false)
3. APK 에셋으로 첨부

> **AAB는 릴리즈에 포함하지 않는다.** Play Store 업로드는 로컬 빌드 후 개발자 콘솔에서 직접 올린다.

---

## 5단계: 릴리즈 노트 작성

CI 완료 후 자동 생성된 릴리즈 제목/내용을 수정한다.

```bash
gh release edit v1.x.x \
  --title "v1.x.x — 변경 내용 요약" \
  --notes "## v1.x.x

### ✨ 새 기능
- ...

### 🐛 버그 수정
- ...

### 📦 설치
- **직접 설치 (Obtainium 등)**: \`app-release.apk\` 다운로드"
```

---

## 릴리즈 제목 규칙

| 형식 | Obtainium 인식 |
|------|---------------|
| `v1.1.2 — 설명` | ✅ 정상 |
| `BrioDo v1.1.2 — 설명` | ❌ 버전 파싱 실패 |
| `v1.1.2` | ✅ 정상 |

**앱 이름(`BrioDo`)을 제목 앞에 붙이지 않는다.**

---

## 에셋 구성

각 릴리즈에는 APK 하나만 포함한다.

| 파일 | 용도 |
|------|------|
| `app-release.apk` | Obtainium / 직접 설치 |

AAB는 릴리즈 에셋에 올리지 않는다. Play Store용 AAB는 로컬에서 아래 순서로 빌드 후 개발자 콘솔에 직접 업로드한다.

```bash
# node_modules 패치 먼저 (npm install 후 또는 빌드 오류 시)
sed -i "s/getDefaultProguardFile('proguard-android.txt')/getDefaultProguardFile('proguard-android-optimize.txt')/g" \
  node_modules/@capacitor-community/speech-recognition/android/build.gradle \
  node_modules/@codetrix-studio/capacitor-google-auth/android/build.gradle \
  node_modules/@capacitor-community/admob/android/build.gradle
sed -i "s/jcenter()/mavenCentral()/g" \
  node_modules/@codetrix-studio/capacitor-google-auth/android/build.gradle

npm run build
npx cap sync android
cd android && ./gradlew bundleRelease --quiet
# 출력: android/app/build/outputs/bundle/release/app-release.aab
```

---

## GitHub Secrets 설정

CI 빌드 시 실제 API 키가 주입되려면 아래 시크릿이 GitHub 저장소에 등록되어 있어야 한다.

| 시크릿 이름 | 내용 |
|------------|------|
| `VITE_FIREBASE_API_KEY` | Firebase API 키 |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth 도메인 |
| `VITE_FIREBASE_PROJECT_ID` | Firebase 프로젝트 ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage 버킷 |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase App ID |
| `VITE_GEMINI_API_KEY` | Gemini API 키 |
| `ANDROID_KEYSTORE_BASE64` | 키스토어 파일 base64 인코딩 값 |
| `ANDROID_STORE_PASSWORD` | 키스토어 비밀번호 |
| `ANDROID_KEY_PASSWORD` | 키 비밀번호 |

등록 방법:
```bash
# 환경변수
gh secret set VITE_FIREBASE_API_KEY --body "값"

# 키스토어 파일
base64 -w 0 android/app/blenddo-release.jks | gh secret set ANDROID_KEYSTORE_BASE64
```

---

## 키스토어 백업

`android/app/blenddo-release.jks` 파일은 분실 시 재서명이 불가능하므로 반드시 외부에 백업한다.

**백업할 정보:**
```
파일: blenddo-release.jks
storePassword: blenddo2024
keyAlias: blenddo
keyPassword: blenddo2024
```

권장 백업 위치: Google Drive (파일 + 비밀번호 메모 함께 보관)

---

## 릴리즈 후 에셋 확인

태그 푸시 후 CI 완료되면 아래 명령으로 에셋이 정상 첨부됐는지 확인한다.

```bash
gh release view v1.x.x --json assets --jq '[.assets[].name] | join(", ")'
```

**정상 상태**: `app-release.apk` 하나만 있어야 함.
- AAB가 있으면: `gh release delete-asset v1.x.x app-release.aab --yes`
- APK가 없으면: 태그 재트리거 (아래 섹션 참고)

전체 버전 일괄 확인:
```bash
gh release list --limit 20 | awk '{print $1}' | while read tag; do
  assets=$(gh release view $tag --json assets --jq '[.assets[].name] | join(", ")')
  echo "$tag: ${assets:-없음}"
done
```

---

## 태그 재트리거 (실수로 잘못된 커밋에 태그 붙였을 때)

```bash
# GitHub Release 먼저 삭제 (이미 생성된 경우)
gh release delete v1.x.x --yes

# 원격 태그 삭제
git push origin :refs/tags/v1.x.x

# 로컬 태그 삭제 후 재생성
git tag -d v1.x.x
git tag v1.x.x <커밋 해시>
git push origin v1.x.x
```

---

## 관련 파일

- CI 워크플로우: `.github/workflows/ci.yml`
- 스토어 배포 절차: `docs/play-store-submission.md`
- 개발 히스토리: `PROJECT_HISTORY.md`
