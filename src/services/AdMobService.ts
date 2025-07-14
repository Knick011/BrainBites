import {
    AdEventType,
    BannerAd,
    BannerAdSize,
    InterstitialAd,
    RewardedAd,
    RewardedAdEventType,
    TestIds,
  } from '@react-native-firebase/admob';
  import { Platform } from 'react-native';
  import AsyncStorage from '@react-native-async-storage/async-storage';
  
  interface AdConfig {
    showAds: boolean;
    testMode: boolean;
    bannerAdUnit: string;
    interstitialAdUnit: string;
    rewardedAdUnit: string;
  }
  
  class AdMobService {
    private initialized = false;
    private interstitialAd: InterstitialAd | null = null;
    private rewardedAd: RewardedAd | null = null;
    private adConfig: AdConfig = {
      showAds: true,
      testMode: __DEV__, // Use test ads in development
      bannerAdUnit: '',
      interstitialAdUnit: '',
      rewardedAdUnit: '',
    };
    
    private STORAGE_KEY = 'brainbites_ads_enabled';
    private lastAdShownTime = 0;
    private MIN_AD_INTERVAL = 180000; // 3 minutes between ads
  
    async initialize(): Promise<void> {
      if (this.initialized) return;
  
      try {
        // Load ad preferences
        const adsEnabled = await AsyncStorage.getItem(this.STORAGE_KEY);
        if (adsEnabled === 'false') {
          this.adConfig.showAds = false;
          return;
        }
  
        // Set up ad unit IDs
        this.setupAdUnits();
  
        // Initialize ads
        if (this.adConfig.showAds) {
          this.initializeInterstitialAd();
          this.initializeRewardedAd();
        }
  
        this.initialized = true;
      } catch (error) {
        console.error('Error initializing AdMob:', error);
      }
    }
  
    private setupAdUnits(): void {
      if (this.adConfig.testMode) {
        // Use test ad IDs
        this.adConfig.bannerAdUnit = TestIds.BANNER;
        this.adConfig.interstitialAdUnit = TestIds.INTERSTITIAL;
        this.adConfig.rewardedAdUnit = TestIds.REWARDED;
      } else {
        // Production ad unit IDs
        if (Platform.OS === 'ios') {
          this.adConfig.bannerAdUnit = 'ca-app-pub-xxxxx/xxxxx';
          this.adConfig.interstitialAdUnit = 'ca-app-pub-xxxxx/xxxxx';
          this.adConfig.rewardedAdUnit = 'ca-app-pub-xxxxx/xxxxx';
        } else {
          this.adConfig.bannerAdUnit = 'ca-app-pub-7353957756801275/3370462815';
          this.adConfig.interstitialAdUnit = 'ca-app-pub-7353957756801275/3777656920';
          this.adConfig.rewardedAdUnit = 'ca-app-pub-7353957756801275/3777656920';
        }
      }
    }
  
    private initializeInterstitialAd(): void {
      this.interstitialAd = InterstitialAd.createForAdRequest(
        this.adConfig.interstitialAdUnit,
        {
          requestNonPersonalizedAdsOnly: true,
        }
      );
  
      this.interstitialAd.onAdEvent((type, error) => {
        if (type === AdEventType.LOADED) {
          console.log('Interstitial ad loaded');
        } else if (type === AdEventType.ERROR) {
          console.error('Interstitial ad error:', error);
        } else if (type === AdEventType.CLOSED) {
          // Load next ad
          this.interstitialAd?.load();
        }
      });
  
      // Load the first ad
      this.interstitialAd.load();
    }
  
    private initializeRewardedAd(): void {
      this.rewardedAd = RewardedAd.createForAdRequest(
        this.adConfig.rewardedAdUnit,
        {
          requestNonPersonalizedAdsOnly: true,
        }
      );
  
      this.rewardedAd.onAdEvent((type, error, reward) => {
        if (type === RewardedAdEventType.LOADED) {
          console.log('Rewarded ad loaded');
        } else if (type === RewardedAdEventType.ERROR) {
          console.error('Rewarded ad error:', error);
        } else if (type === RewardedAdEventType.EARNED_REWARD && reward) {
          console.log('User earned reward:', reward);
        } else if (type === AdEventType.CLOSED) {
          // Load next ad
          this.rewardedAd?.load();
        }
      });
  
      // Load the first ad
      this.rewardedAd.load();
    }
  
    // Get banner ad unit ID
    getBannerAdUnitId(): string {
      return this.adConfig.showAds ? this.adConfig.bannerAdUnit : '';
    }
  
    // Show interstitial ad
    async showInterstitialAd(): Promise<boolean> {
      if (!this.adConfig.showAds) return false;
  
      // Check minimum interval
      const now = Date.now();
      if (now - this.lastAdShownTime < this.MIN_AD_INTERVAL) {
        console.log('Too soon to show another ad');
        return false;
      }
  
      try {
        const isLoaded = await this.interstitialAd?.isLoaded();
        if (isLoaded) {
          await this.interstitialAd?.show();
          this.lastAdShownTime = now;
          return true;
        }
      } catch (error) {
        console.error('Error showing interstitial ad:', error);
      }
      
      return false;
    }
  
    // Show rewarded ad
    async showRewardedAd(): Promise<{ earned: boolean; reward?: any }> {
      if (!this.adConfig.showAds) {
        return { earned: false };
      }
  
      try {
        const isLoaded = await this.rewardedAd?.isLoaded();
        if (!isLoaded) {
          console.log('Rewarded ad not loaded');
          return { earned: false };
        }
  
        return new Promise((resolve) => {
          let earned = false;
          let rewardData: any;
  
          const unsubscribe = this.rewardedAd?.onAdEvent((type, error, reward) => {
            if (type === RewardedAdEventType.EARNED_REWARD && reward) {
              earned = true;
              rewardData = reward;
            } else if (type === AdEventType.CLOSED) {
              unsubscribe?.();
              resolve({ earned, reward: rewardData });
            } else if (type === AdEventType.ERROR) {
              unsubscribe?.();
              resolve({ earned: false });
            }
          });
  
          this.rewardedAd?.show();
        });
      } catch (error) {
        console.error('Error showing rewarded ad:', error);
        return { earned: false };
      }
    }
  
    // Check if ads are enabled
    isAdsEnabled(): boolean {
      return this.adConfig.showAds;
    }
  
    // Set ads enabled/disabled
    async setAdsEnabled(enabled: boolean): Promise<void> {
      this.adConfig.showAds = enabled;
      await AsyncStorage.setItem(this.STORAGE_KEY, enabled.toString());
  
      if (enabled && !this.initialized) {
        await this.initialize();
      }
    }
  
    // Check if interstitial is ready
    async isInterstitialReady(): Promise<boolean> {
      if (!this.adConfig.showAds) return false;
      
      try {
        return await this.interstitialAd?.isLoaded() || false;
      } catch {
        return false;
      }
    }
  
    // Check if rewarded ad is ready
    async isRewardedAdReady(): Promise<boolean> {
      if (!this.adConfig.showAds) return false;
      
      try {
        return await this.rewardedAd?.isLoaded() || false;
      } catch {
        return false;
      }
    }
  
    // Get banner ad size
    getBannerAdSize(): BannerAdSize {
      return BannerAdSize.SMART_BANNER;
    }
  }
  
  export default new AdMobService(); 