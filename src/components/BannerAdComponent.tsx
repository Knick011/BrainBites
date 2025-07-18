import React from 'react';
import { View, ViewStyle } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import AdMobService from '../services/AdMobService';

interface BannerAdProps {
  style?: ViewStyle;
  onAdFailedToLoad?: (error: Error) => void;
}

const BannerAdComponent: React.FC<BannerAdProps> = ({ style = {}, onAdFailedToLoad = null }) => {
  const adUnitId = AdMobService.getBannerAdUnitId();
  
  return (
    <View style={[{
      alignSelf: 'center',
      marginVertical: 8,
    }, style]}>
      <BannerAd
        unitId={adUnitId}
        size={BannerAdSize.BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdFailedToLoad={(error) => {
          console.log('Ad failed to load:', error);
          if (onAdFailedToLoad) onAdFailedToLoad(new Error(error.message));
        }}
      />
    </View>
  );
};

export default BannerAdComponent; 