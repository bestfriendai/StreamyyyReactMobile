/**
 * Interstitial Ad Component
 * Handles full-screen interstitial ads with proper timing and frequency control
 */
import React, { useEffect, useRef } from 'react';
import { InterstitialAd, AdEventType } from 'react-native-google-mobile-ads';

import { adMobService } from '@/services/adMobService';
import { logDebug, logError } from '@/utils/errorHandler';

interface InterstitialAdManagerProps {
  // Configuration
  minIntervalMinutes?: number; // Minimum time between ads
  maxFrequencyPerHour?: number; // Maximum ads per hour
  // Events
  onAdShown?: () => void;
  onAdDismissed?: () => void;
  onAdError?: (error: string) => void;
}

class InterstitialAdManager {
  private static instance: InterstitialAdManager;
  private interstitialAd: InterstitialAd | null = null;
  private isLoaded = false;
  private isShowing = false;
  private lastShownTime = 0;
  private adCountThisHour = 0;
  private hourlyResetTime = 0;

  // Configuration
  private minIntervalMs: number;
  private maxFrequencyPerHour: number;

  private constructor(
    minIntervalMinutes = 3, // Default: 3 minutes between ads
    maxFrequencyPerHour = 10 // Default: max 10 ads per hour
  ) {
    this.minIntervalMs = minIntervalMinutes * 60 * 1000;
    this.maxFrequencyPerHour = maxFrequencyPerHour;
    this.resetHourlyCountIfNeeded();
  }

  static getInstance(
    minIntervalMinutes?: number,
    maxFrequencyPerHour?: number
  ): InterstitialAdManager {
    if (!InterstitialAdManager.instance) {
      InterstitialAdManager.instance = new InterstitialAdManager(
        minIntervalMinutes,
        maxFrequencyPerHour
      );
    }
    return InterstitialAdManager.instance;
  }

  /**
   * Initialize and preload interstitial ad
   */
  async initialize(): Promise<void> {
    try {
      if (!adMobService.canShowAds()) {
        logDebug('Interstitial ad not initialized - no consent or AdMob not ready');
        return;
      }

      const adUnitId = adMobService.getAdUnitId('interstitial');
      
      this.interstitialAd = InterstitialAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: false,
      });

      this.interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
        this.isLoaded = true;
        logDebug('Interstitial ad loaded');
      });

      this.interstitialAd.addAdEventListener(AdEventType.ERROR, (error) => {
        this.isLoaded = false;
        logError('Interstitial ad error', { error: error.message });
      });

      this.interstitialAd.addAdEventListener(AdEventType.OPENED, () => {
        this.isShowing = true;
        logDebug('Interstitial ad opened');
      });

      this.interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
        this.isShowing = false;
        this.lastShownTime = Date.now();
        this.adCountThisHour++;
        this.preloadNextAd();
        logDebug('Interstitial ad closed');
      });

      // Start loading the ad
      this.interstitialAd.load();

      logDebug('Interstitial ad manager initialized');
    } catch (error) {
      logError('Failed to initialize interstitial ad', { error: error.message });
    }
  }

  /**
   * Show interstitial ad if conditions are met
   */
  async show(context?: string): Promise<boolean> {
    try {
      if (!this.canShowAd()) {
        logDebug('Interstitial ad not shown', {
          context,
          reason: this.getBlockingReason(),
        });
        return false;
      }

      if (!this.isLoaded) {
        logDebug('Interstitial ad not ready - preloading for next time');
        this.preloadNextAd();
        return false;
      }

      if (this.interstitialAd) {
        await this.interstitialAd.show();
        return true;
      }

      logDebug('Interstitial ad shown successfully', { context });
      return true;
    } catch (error) {
      logError('Failed to show interstitial ad', { 
        error: error.message,
        context 
      });
      return false;
    }
  }

  /**
   * Check if ad can be shown based on frequency and timing rules
   */
  private canShowAd(): boolean {
    if (!adMobService.canShowAds()) return false;
    if (this.isShowing) return false;
    
    this.resetHourlyCountIfNeeded();
    
    // Check frequency limits
    if (this.adCountThisHour >= this.maxFrequencyPerHour) return false;
    
    // Check minimum interval
    const timeSinceLastAd = Date.now() - this.lastShownTime;
    if (timeSinceLastAd < this.minIntervalMs) return false;
    
    return this.isLoaded;
  }

  /**
   * Get reason why ad cannot be shown (for debugging)
   */
  private getBlockingReason(): string {
    if (!adMobService.canShowAds()) return 'No consent or AdMob not ready';
    if (this.isShowing) return 'Ad already showing';
    if (!this.isLoaded) return 'Ad not loaded';
    
    this.resetHourlyCountIfNeeded();
    if (this.adCountThisHour >= this.maxFrequencyPerHour) return 'Hourly frequency limit reached';
    
    const timeSinceLastAd = Date.now() - this.lastShownTime;
    if (timeSinceLastAd < this.minIntervalMs) {
      const remainingMs = this.minIntervalMs - timeSinceLastAd;
      return `Minimum interval not met (${Math.ceil(remainingMs / 1000)}s remaining)`;
    }
    
    return 'Unknown';
  }

  /**
   * Preload next ad
   */
  private preloadNextAd(): void {
    if (this.interstitialAd) {
      this.isLoaded = false;
      this.interstitialAd.load();
    }
  }

  /**
   * Reset hourly counter if hour has passed
   */
  private resetHourlyCountIfNeeded(): void {
    const currentHour = Math.floor(Date.now() / (60 * 60 * 1000));
    if (currentHour > this.hourlyResetTime) {
      this.adCountThisHour = 0;
      this.hourlyResetTime = currentHour;
      logDebug('Hourly ad count reset');
    }
  }

  /**
   * Get current status for debugging
   */
  getStatus(): object {
    this.resetHourlyCountIfNeeded();
    
    return {
      isLoaded: this.isLoaded,
      isShowing: this.isShowing,
      canShow: this.canShowAd(),
      adCountThisHour: this.adCountThisHour,
      timeSinceLastAd: Date.now() - this.lastShownTime,
      blockingReason: this.canShowAd() ? null : this.getBlockingReason(),
    };
  }
}

// Hook for using interstitial ads in components
export const useInterstitialAd = (props: InterstitialAdManagerProps = {}) => {
  const managerRef = useRef<InterstitialAdManager>();

  useEffect(() => {
    managerRef.current = InterstitialAdManager.getInstance(
      props.minIntervalMinutes,
      props.maxFrequencyPerHour
    );
    
    managerRef.current.initialize();
  }, []);

  const showInterstitial = async (context?: string): Promise<boolean> => {
    if (!managerRef.current) return false;
    
    const success = await managerRef.current.show(context);
    
    if (success) {
      props.onAdShown?.(context);
    } else {
      props.onAdError?.(`Failed to show ad: ${context}`);
    }
    
    return success;
  };

  const getStatus = () => {
    return managerRef.current?.getStatus() || {};
  };

  return {
    showInterstitial,
    getStatus,
  };
};

export default InterstitialAdManager;