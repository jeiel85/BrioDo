# BrioDo 릴리즈 가이드

## 릴리즈 프로세스 요약

버전 번호 수정 → 커밋 + 푸시 → 태그 푸시 → CI 자동 빌드 → GitHub Release 자동 생성

---

## 1단계: 버전 번호 수정

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

---

## 2단계: 커밋 + 푸시

```bash
git add src/App.jsx android/app/build.gradle
git commit -m "bump: v1.x.x → v1.x.x (versionCode N → N+1)"
git push origin main
```

---

## 3단계: 태그 푸시 (릴리즈 트리거)

```bash
git tag v1.x.x
git push origin v1.x.x
```

태그 푸시 즉시 GitHub Actions CI가 트리거된다.

---

## 4단계: CI 자동 처리 (~5분 소요)

CI(`android-release` 잡)가 자동으로:
1. 서명 APK (`app-release.apk`) 빌드
2. 릴리즈 AAB (`app-release.aab`) 빌드
3. GitHub Release 생성 (Latest, prerelease: false)
4. 두 파일 에셋으로 첨부

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
- **직접 설치 (Obtainium 등)**: \`app-release.apk\` 다운로드
- **Play Store 업로드용**: \`app-release.aab\` 다운로드"
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

각 릴리즈에는 반드시 두 파일이 포함되어야 한다.

| 파일 | 용도 |
|------|------|
| `app-release.apk` | Obtainium / 직접 설치 |
| `app-release.aab` | Play Store 업로드 |

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
