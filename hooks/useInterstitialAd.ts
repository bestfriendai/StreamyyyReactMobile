/**
 * React Hook for Interstitial Ads
 * Provides easy-to-use interface for showing interstitial ads
 */
import { useEffect, useCallback, useState } from 'react';
import { interstitialAdService } from '@/services/interstitialAdService';
import { logDebug } from '@/utils/errorHandler';

interface UseInterstitialAdReturn {
  showAd: (placement?: string) => Promise<boolean>;
  isReady: boolean;
  canShow: boolean;
  adStatus: object;
  initializeAd: () => Promise<void>;
}

export const useInterstitialAd = (): UseInterstitialAdReturn => {
  const [isReady, setIsReady] = useState(false);
  const [canShow, setCanShow] = useState(false);
  const [adStatus, setAdStatus] = useState({});

  // Initialize the ad service
  const initializeAd = useCallback(async () => {
    try {
      await interstitialAdService.initialize();
      setIsReady(true);
      logDebug('Interstitial ad hook initialized');
    } catch (error) {
      logDebug('Failed to initialize interstitial ad hook', { error: error.message });
    }
  }, []);

  // Show an ad with optional placement context
  const showAd = useCallback(async (placement?: string): Promise<boolean> => {
    const result = await interstitialAdService.show(placement || 'unknown');
    
    // Update status after showing attempt
    const status = interstitialAdService.getStatus();
    setAdStatus(status);
    setCanShow(status.canShow as boolean);
    
    return result;
  }, []);

  // Update status periodically
  useEffect(() => {
    if (!isReady) return;

    const updateStatus = () => {
      const status = interstitialAdService.getStatus();
      setAdStatus(status);
      setCanShow(status.canShow as boolean);
    };

    // Update immediately
    updateStatus();

    // Set up periodic updates
    const interval = setInterval(updateStatus, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [isReady]);

  // Initialize on mount
  useEffect(() => {
    initializeAd();
  }, [initializeAd]);

  return {
    showAd,
    isReady,
    canShow,
    adStatus,
    initializeAd,
  };
};