// src/services/AdMobService.ts
// AdMob App ID: ca-app-pub-7353957756801275~5242496423
// Banner ID: ca-app-pub-7353957756801275/3777656920
import {
  AdEventType,
  BannerAd,
  BannerAdSize,
  InterstitialAd,
  RewardedAd,
  RewardedAdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';
import { Platform } from 'react-native';

// Replace with your actual AdMob IDs
const adUnitIds = {
  banner: __DEV__
    ? TestIds.BANNER
    : Platform.select({
        ios: 'ca-app-pub-7353957756801275/3777656920', // Banner ID
        android: 'ca-app-pub-7353957756801275/3777656920', // Banner ID
      }),
  rewarded: __DEV__
    ? TestIds.REWARDED
    : Platform.select({
        ios: 'ca-app-pub-7353957756801275/3777656920',
        android: 'ca-app-pub-7353957756801275/3777656920',
      }),
};

class AdMobServiceClass {
  private rewardedAd: RewardedAd | null = null;
  private isInitialized: boolean = false;

  async init() {
    if (this.isInitialized) return;

    try {
      // Initialize ads
      this.setupRewardedAd();
      
      this.isInitialized = true;
      console.log('AdMob initialized successfully');
    } catch (error) {
      console.error('AdMob initialization error:', error);
    }
  }

  private setupRewardedAd() {
    if (!adUnitIds.rewarded) return;

    this.rewardedAd = RewardedAd.createForAdRequest(adUnitIds.rewarded);

    this.rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
      console.log('Rewarded ad loaded');
    });

    this.rewardedAd.addAdEventListener(AdEventType.ERROR, (error) => {
      console.error('Rewarded ad error:', error);
    });

    this.rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward) => {
      console.log('User earned reward:', reward);
    });

    this.rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
      // Load next ad
      this.loadRewardedAd();
    });

    // Load first ad
    this.loadRewardedAd();
  }

  private async loadRewardedAd() {
    try {
      if (this.rewardedAd) {
        await this.rewardedAd.load();
      }
    } catch (error) {
      console.error('Error loading rewarded ad:', error);
    }
  }

  async showRewardedAd(): Promise<{ earned: boolean; reward?: any }> {
    return new Promise(async (resolve) => {
      try {
        if (!this.rewardedAd || !(await this.rewardedAd.loaded)) {
          resolve({ earned: false });
          return;
        }

        // Set up one-time listeners for reward
        const unsubscribeLoaded = this.rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward) => {
          unsubscribeLoaded();
          unsubscribeClosed();
          resolve({ earned: true, reward });
        });

        const unsubscribeClosed = this.rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
          unsubscribeLoaded();
          unsubscribeClosed();
          resolve({ earned: false });
        });

        await this.rewardedAd.show();
      } catch (error) {
        console.error('Error showing rewarded ad:', error);
        resolve({ earned: false });
      }
    });
  }

  getBannerAdUnitId(): string | undefined {
    return adUnitIds.banner;
  }

  getBannerAdSize() {
    return BannerAdSize.ADAPTIVE_BANNER;
  }
}

export const AdMobService = new AdMobServiceClass();

// Banner Ad Component Helper
export { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';