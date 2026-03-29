import { AdMob, RewardAdPluginEvents } from '@capacitor-community/admob';

const REWARDED_AD_ID = import.meta.env.VITE_ADMOB_REWARDED_ID || 'ca-app-pub-3940256099942544/5224354917'; // 폴백: 구글 공식 테스트 ID
// 실제 광고 ID가 없을 때는 테스트 모드 강제 활성화 (운영 빌드에서도 테스트 ID 사용 시 isTesting 필수)
const IS_TEST_AD = !import.meta.env.VITE_ADMOB_REWARDED_ID;

export async function initAdMob() {
  try {
    await AdMob.initialize({
      requestTrackingAuthorization: false,
    });
  } catch (e) {
    console.warn('AdMob init failed:', e);
  }
}

export async function showRewardedAd(onRewarded) {
  try {
    await AdMob.prepareRewardVideoAd({
      adId: REWARDED_AD_ID,
      isTesting: import.meta.env.DEV || IS_TEST_AD,
    });

    return new Promise((resolve) => {
      const listeners = [];
      const cleanup = () => listeners.forEach(l => l.then(h => h.remove()).catch(() => {}));

      listeners.push(AdMob.addListener(RewardAdPluginEvents.Rewarded, (reward) => {
        cleanup();
        onRewarded(reward.amount || 5);
        resolve(true);
      }));

      listeners.push(AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
        cleanup();
        resolve(false);
      }));

      listeners.push(AdMob.addListener(RewardAdPluginEvents.FailedToShow, (error) => {
        console.warn('AdMob FailedToShow:', error);
        cleanup();
        resolve(false);
      }));

      AdMob.showRewardVideoAd().catch((e) => {
        console.warn('AdMob show failed:', e);
        cleanup();
        resolve(false);
      });
    });
  } catch (e) {
    console.warn('AdMob rewarded ad error:', e);
    return false;
  }
}
