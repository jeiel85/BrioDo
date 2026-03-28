import { AdMob, RewardAdPluginEvents } from '@capacitor-community/admob';

const REWARDED_AD_ID = import.meta.env.VITE_ADMOB_REWARDED_ID || 'ca-app-pub-3940256099942544/5224354917'; // 폴백: 구글 공식 테스트 ID

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
    const adId = REWARDED_AD_ID;

    await AdMob.prepareRewardVideoAd({
      adId,
      isTesting: import.meta.env.DEV,
    });

    return new Promise((resolve) => {
      const rewardedListener = AdMob.addListener(RewardAdPluginEvents.Rewarded, (reward) => {
        rewardedListener.then(l => l.remove());
        onRewarded(reward.amount || 5);
        resolve(true);
      });

      AdMob.showRewardVideoAd().catch((e) => {
        console.warn('AdMob show failed:', e);
        resolve(false);
      });
    });
  } catch (e) {
    console.warn('AdMob rewarded ad error:', e);
    return false;
  }
}
