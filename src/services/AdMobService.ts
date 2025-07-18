// src/services/AdMobService.ts
import { Platform } from 'react-native';
import { TestIds } from 'react-native-google-mobile-ads';
import { AdConfig } from '../types';

class AdMobService {
  private adConfig: AdConfig;

  constructor() {
    // Production Ad Unit IDs - replace with your actual IDs when ready
    this.adConfig = {
      bannerId: Platform.select({
        android: __DEV__ ? TestIds.BANNER : 'ca-app-pub-7353957756801275/1234567890',
        ios: __DEV__ ? TestIds.BANNER : 'ca-app-pub-7353957756801275/0987654321',
      }) || TestIds.BANNER,
      interstitialId: '', // Not used
      rewardedId: '', // Not used
      testMode: __DEV__,
    };
  }

  getBannerAdUnitId(): string {
    return this.adConfig.bannerId;
  }
}

export default new AdMobService();