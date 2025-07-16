/**
 * Banner Ad Component
 * Displays AdMob banner ads with proper error handling and loading states
 */
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';

import { adMobService } from '@/services/adMobService';
import { logDebug, logError } from '@/utils/errorHandler';

// Safely import AdMob modules with fallbacks
let BannerAd: any = null;
let BannerAdSize: any = null;
let TestIds: any = null;

try {
  const adMobModule = require('react-native-google-mobile-ads');
  BannerAd = adMobModule.BannerAd;
  BannerAdSize = adMobModule.BannerAdSize;
  TestIds = adMobModule.TestIds;
} catch (error) {
  // Silently handle missing AdMob modules in development
  console.log('AdMob BannerAd module not available in development environment');
}

interface BannerAdComponentProps {
  size?: 'BANNER' | 'LARGE_BANNER' | 'MEDIUM_RECTANGLE' | 'ADAPTIVE_BANNER';
  position?: 'top' | 'bottom';
  style?: object;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const BannerAdComponent: React.FC<BannerAdComponentProps> = ({
  size = 'ADAPTIVE_BANNER',
  position = 'bottom',
  style,
}) => {
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState<string | null>(null);
  const [canShowAds, setCanShowAds] = useState(false);

  useEffect(() => {
    checkAdMobStatus();
  }, []);

  const checkAdMobStatus = async () => {
    const canShow = adMobService.canShowAds();
    setCanShowAds(canShow);
    
    if (!canShow) {
      logDebug('Banner ad not shown - AdMob not ready or no consent');
    }
  };

  const handleAdLoaded = () => {
    setAdLoaded(true);
    setAdError(null);
    logDebug('Banner ad loaded successfully');
  };

  const handleAdError = (error: any) => {
    setAdLoaded(false);
    setAdError(error?.message || 'Failed to load ad');
    logError('Banner ad failed to load', { error: error?.message });
  };

  const getAdUnitId = () => {
    return adMobService.getAdUnitId('banner');
  };

  // Don't render if ads are not allowed or modules not available
  if (!canShowAds || !BannerAd) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <BannerAd
        unitId={getAdUnitId()}
        size={BannerAdSize ? BannerAdSize[size] : 'BANNER'}
        requestOptions={{
          requestNonPersonalizedAdsOnly: false,
        }}
        onAdLoaded={handleAdLoaded}
        onAdFailedToLoad={handleAdError}
      />
      
      {/* Show placeholder only if ad failed to load */}
      {adError && (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            Ad failed to load
          </Text>
          <Text style={styles.errorText}>
            {adError}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  placeholder: {
    width: SCREEN_WIDTH - 20,
    height: 50,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  placeholderText: {
    color: '#8B5CF6',
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    marginTop: 4,
    textAlign: 'center',
  },
});

export default BannerAdComponent;