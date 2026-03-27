# BrioDo — AdMob 광고 연동 계획

> 보상형 광고(Rewarded Ad)를 통한 브리오 충전 구현 가이드

---

## 1. 준비 순서 (콘솔 작업 — 직접 처리 필요)

### Step 1. Google AdMob 계정 설정
- [ ] [AdMob Console](https://admob.google.com) 접속 → Google 계정으로 로그인
- [ ] 앱 추가 → "Android" → 앱 이름: `BrioDo` → 패키지명: `app.briodo`
- [ ] **앱 ID 메모**: `ca-app-pub-XXXXXX~YYYYYYYY` (AndroidManifest.xml에 입력)

### Step 2. 광고 단위 생성
- [ ] AdMob Console → 앱 선택 → "광고 단위" → "추가"
- [ ] 형식: **보상형(Rewarded)**
- [ ] 이름: `brio_recharge_rewarded`
- [ ] **광고 단위 ID 메모**: `ca-app-pub-XXXXXX/ZZZZZZZZ`

### Step 3. 개인정보처리방침 업데이트
- [ ] 광고 식별자(IDFA/GAID) 사용 항목 추가
- [ ] GDPR 관련 동의 (한국은 해당 없지만 글로벌 배포 시 필요)

---

## 2. Capacitor 플러그인 설치

```bash
npm install @capacitor-community/admob
npx cap sync android
```

### android/app/src/main/AndroidManifest.xml 수정
```xml
<!-- <application> 태그 안에 추가 -->
<meta-data
    android:name="com.google.android.gms.ads.APPLICATION_ID"
    android:value="ca-app-pub-XXXXXX~YYYYYYYY"/>
```

### android/app/build.gradle 확인
```gradle
dependencies {
    // AdMob은 플러그인이 자동 추가하지만, 없으면 수동 추가:
    implementation 'com.google.android.gms:play-services-ads:23.x.x'
}
```

---

## 3. 코드 구현 위치

### `src/hooks/useAdMob.js` (신규 생성 예정)
```javascript
import { AdMob, RewardAdPluginEvents } from '@capacitor-community/admob'

const REWARDED_AD_ID = 'ca-app-pub-XXXXXX/ZZZZZZZZ'
// 테스트 중에는: 'ca-app-pub-3940256099942544/5224354917' (구글 공식 테스트 ID)

export async function showRewardedAd(onRewarded) {
  await AdMob.initialize()

  AdMob.addListener(RewardAdPluginEvents.Rewarded, () => {
    onRewarded(5) // ⚡5 지급
  })

  await AdMob.prepareRewardVideoAd({
    adId: REWARDED_AD_ID,
    isTesting: __DEV__, // 개발 중 테스트 광고 사용
  })

  await AdMob.showRewardVideoAd()
}
```

### `src/components/BrioChargeModal.jsx`에서 호출
```javascript
import { showRewardedAd } from '../hooks/useAdMob'

const handleWatchAd = async () => {
  await showRewardedAd((amount) => {
    chargeBrio(amount)  // useBrio의 charge 함수
    onClose()
  })
}
```

---

## 4. 개발 중 테스트 방법

AdMob 실제 연동 전 Phase 1에서는:
```javascript
// BrioChargeModal에서 광고 버튼 클릭 시 즉시 지급 (MVP)
const handleWatchAd = () => {
  // TODO: AdMob 연동 후 실제 광고로 교체
  charge(5)
  onClose()
}
```

**실제 기기 테스트 시 반드시 테스트 광고 ID 사용** (실제 광고로 테스트 시 AdMob 정책 위반 → 계정 정지 위험)

---

## 5. AdMob 정책 준수사항

| 항목 | 내용 |
|------|------|
| 광고 강제 노출 | 금지 — 사용자가 원할 때만 |
| 보상 지급 타이밍 | 광고 완전 시청 후 (Rewarded 이벤트 시) |
| 테스트 광고 | 개발 중 반드시 테스트 ID 사용 |
| 앱 출시 전 | 실제 광고 ID로 교체 후 빌드 |
| 개인정보처리방침 | 광고 식별자 사용 명시 필수 |

---

## 6. 수익 예측

| 시나리오 | MAU | 1인당 광고 시청/월 | 월 수익 |
|---------|-----|-----------------|---------|
| 초기 | 100 | 5회 | $5 |
| 성장 | 1,000 | 8회 | $80 |
| 안정 | 10,000 | 10회 | $1,000 |

> eCPM $10 기준. 한국은 $8~$15로 변동.

---

## 7. 환경변수 관리 (AdMob ID 보안)

AdMob 앱 ID는 AndroidManifest.xml에 하드코딩이 Google 표준 방식이나,
광고 단위 ID는 코드에서 분리 권장:

```javascript
// .env
VITE_ADMOB_REWARDED_ID=ca-app-pub-XXXXXX/ZZZZZZZZ
```

```javascript
// useAdMob.js
const REWARDED_AD_ID = import.meta.env.VITE_ADMOB_REWARDED_ID
```

> `.env`는 이미 `.gitignore`에 포함되어 있음 ✅
