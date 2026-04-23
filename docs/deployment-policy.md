# BrioDo 배포 규정 (Deployment Policy)

## 1. 릴리즈 노트 작성 규정

### 1.1 언어
- **반드시 한국어**로 작성
- 이슈 번호는 영어 그대로 표기 (예: #128)

### 1.2 형식
```
## 버전 - 한줄 요약 (날짜)

### 주요 변경사항
- 카테고리별 변경 내용 (3-5줄)

### 수정 사항
- 버그 수정 및 개선 목록

### 이슈 처리
- 처리한 이슈 번호 및简要 내용

### 참고사항
- 빌드 주의사항, 환경 설정, 비활성화된 기능 등

---
**배포자**: 배포 담당자 이름
**테스트 환경**: 테스트한 기기/환경
```

### 1.3 카테고리 순서
1. **새 기능** (New Features)
2. **개선** (Improvements)
3. **보안** (Security)
4. **버그 수정** (Bug Fixes)
5. **문서** (Documentation)

### 1.4 작성 원칙
- 한글로 간결하게 3-5줄 이내
- 기술적 세부사항은 PROJECT_HISTORY.md에 위임
- 사용자에게 의미 있는 변경사항 위주记载

---

## 2. APK 배포 규정

### 2.1 APK 파일 관리
- `android/app/build/outputs/apk/debug/app-debug.apk` 업로드
- Release ZIP에는 항상 APK 포함

### 2.2 APK 업로드 절차
1. `npm run build` - 웹 빌드
2. `npx cap sync android` - Capacitor 동기화
3. `cd android && ./gradlew assembleDebug` - APK 빌드
4. `gh release upload <version> <apk-path>` - GitHub에 업로드

---

## 3. Git 태그 규정

### 3.1 태그 형식
```
v{메이저}.{마이너}.{패치}
예: v1.1.0, v1.0.1, v2.0.0-beta
```

### 3.2 태그 생성
```bash
git tag -a v{버전} -m "릴리즈 요약"
git push origin v{버전}
```

---

## 4. GitHub Release 규정

### 4.1 Release 생성
```bash
gh release create v{버전} \
  --title "v{버전} - 한줄 요약" \
  --notes-file RELEASE_NOTES.md
```

### 4.2 릴리즈 제목 형식
```
v{버전} - {한줄 요약}
예: v1.1.0 - 보안 강화 및 UX 개선
```

---

## 5. 커밋 메시지 규정

### 5.1 형식
```
{타입}: {간단한 설명} ({이슈번호})

{상세 설명 (선택)}
```

### 5.2 타입
- `feat`: 새 기능
- `fix`: 버그 수정
- `security`: 보안 관련
- `chore`: 기타 변경
- `docs`: 문서
- `refactor`: 리팩토링

---

## 6. 버전 관리 규정

### 6.1 버전 번호 의미
- **메이저 (1.x.x)**: 주요 기능 추가, 하위 호환성 깨는 변경
- **마이너 (x.1.x)**: 신기능 추가, 하위 호환성 유지
- **패치 (x.x.1)**: 버그 수정, 작은 개선

### 6.2 버전 동기화
버전 변경 시 다음 두 파일을 반드시 함께 수정:
- `src/App.jsx`의 `APP_VERSION`
- `android/app/build.gradle`의 `versionName`, `versionCode`

---

## 7. 배포 후 체크리스트

- [ ] APK 빌드 성공 확인
- [ ] GitHub Release 생성
- [ ] APK Release에 업로드
- [ ] PROJECT_HISTORY.md 업데이트
- [ ] 모든 이슈 닫기
- [ ] 디바이스 설치 테스트 (가능한 경우)
