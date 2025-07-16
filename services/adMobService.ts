/**
 * Google AdMob Service
 * Handles AdMob initialization, consent management, and ad configuration
 */
import { Platform } from 'react-native';
import { logDebug, logError } from '@/utils/errorHandler';

// Safely import AdMob modules with fallbacks
let mobileAds: any = null;
let AdsConsent: any = null;
let AdsConsentStatus: any = null;
let AdsConsentDebugGeography: any = null;
let RequestConfiguration: any = null;
let UMP: any = null;

try {
  const adMobModule = require('react-native-google-mobile-ads');
  mobileAds = adMobModule.default;
  AdsConsent = adMobModule.AdsConsent;
  AdsConsentStatus = adMobModule.AdsConsentStatus;
  AdsConsentDebugGeography = adMobModule.AdsConsentDebugGeography;
  RequestConfiguration = adMobModule.RequestConfiguration;
  
  const umpModule = require('react-native-ad-consent');
  UMP = umpModule.UMP;
} catch (error) {
  // Silently handle missing AdMob modules in development
  console.log('AdMob modules not available in development environment');
}

// Ad Unit IDs from environment variables
const AD_UNIT_IDS = {
  banner: {
    android: process.env.EXPO_PUBLIC_ADMOB_BANNER_ID || 'ca-app-pub-3940256099942544/6300978111', // Test ID fallback
    ios: process.env.EXPO_PUBLIC_ADMOB_BANNER_ID || 'ca-app-pub-3940256099942544/2934735716', // Test ID fallback
  },
  interstitial: {
    android: 'ca-app-pub-4679934692726562/8447577403', // Production ID as specified
    ios: 'ca-app-pub-4679934692726562/8447577403', // Production ID as specified
  },
  rewarded: {
    android: process.env.EXPO_PUBLIC_ADMOB_REWARDED_ID || 'ca-app-pub-3940256099942544/5224354917', // Test ID fallback
    ios: process.env.EXPO_PUBLIC_ADMOB_REWARDED_ID || 'ca-app-pub-3940256099942544/1712485313', // Test ID fallback
  },
};

// Test device IDs for development
const TEST_DEVICE_IDS = [
  '__DEVICE_ID_HERE__', // Add your device ID for testing
];

interface AdMobConfig {
  isInitialized: boolean;
  consentStatus: string | null;
  canRequestAds: boolean;
  isTestMode: boolean;
}

class AdMobService {
  private config: AdMobConfig = {
    isInitialized: false,
    consentStatus: null,
    canRequestAds: false,
    isTestMode: __DEV__,
  };

  /**
   * Initialize AdMob SDK following official Google Mobile Ads SDK guide
   */
  async initialize(): Promise<boolean> {
    try {
      // Check if AdMob modules are available
      if (!mobileAds) {
        logDebug('AdMob modules not available - skipping initialization');
        this.config.isInitialized = false;
        this.config.canRequestAds = false;
        return false;
      }

      logDebug('Initializing Google Mobile Ads SDK...');

      // Step 1: Initialize the Mobile Ads SDK
      const adapterStatuses = await mobileAds().initialize();
      
      // Log initialization status
      logDebug('Mobile Ads SDK initialized', { adapterStatuses });

      // Step 2: Configure request settings for development
      if (__DEV__) {
        await mobileAds().setRequestConfiguration({
          // Add test device IDs for development
          testDeviceIdentifiers: TEST_DEVICE_IDS,
          // Set max ad content rating
          maxAdContentRating: 'T', // Teen
          // Tag for child-directed treatment
          tagForChildDirectedTreatment: false,
          // Tag for under age of consent
          tagForUnderAgeOfConsent: false,
        });
        logDebug('Development request configuration set');
      }

      // Step 3: Handle user consent (GDPR/CCPA)
      await this.handleConsent();

      // Step 4: Set initialization flag
      this.config.isInitialized = true;
      
      logDebug('Google Mobile Ads SDK initialization complete', {
        canRequestAds: this.config.canRequestAds,
        consentStatus: this.config.consentStatus,
      });

      return true;
    } catch (error) {
      logError('Failed to initialize Google Mobile Ads SDK', { 
        error: error.message,
        stack: error.stack 
      });
      return false;
    }
  }

  /**
   * Handle GDPR consent and privacy requirements
   */
  private async handleConsent(): Promise<void> {
    try {
      logDebug('Handling user consent...');

      const {
        consentStatus,
        isConsentFormAvailable,
        isRequestLocationInEeaOrUnknown,
      } = await UMP.requestConsentInfoUpdate();

      this.config.consentStatus = consentStatus;

      // If user is in EEA and consent is required
      if (
        isRequestLocationInEeaOrUnknown &&
        isConsentFormAvailable &&
        consentStatus === UMP.CONSENT_STATUS.REQUIRED
      ) {
        const { canRequestAds } = await UMP.showConsentForm();
        this.config.canRequestAds = canRequestAds;
      } else {
        // User not in EEA or consent already given
        this.config.canRequestAds = true;
      }

      logDebug('Consent handling completed', {
        canRequestAds: this.config.canRequestAds,
        consentStatus: this.config.consentStatus,
      });
    } catch (error) {
      logError('Error handling consent', { error: error.message });
      // Default to allowing ads if consent handling fails
      this.config.canRequestAds = true;
    }
  }

  /**
   * Get appropriate ad unit ID for current platform
   */
  getAdUnitId(adType: 'banner' | 'interstitial' | 'rewarded'): string {
    const platform = Platform.OS as keyof typeof AD_UNIT_IDS.banner;
    return AD_UNIT_IDS[adType][platform];
  }

  /**
   * Check if ads can be requested (consent + initialization)
   */
  canShowAds(): boolean {
    return this.config.isInitialized && this.config.canRequestAds;
  }

  /**
   * Get current configuration
   */
  getConfig(): AdMobConfig {
    return { ...this.config };
  }

  /**
   * Reset consent (for testing purposes)
   */
  async resetConsent(): Promise<void> {
    try {
      await UMP.reset();
      
      this.config.consentStatus = null;
      this.config.canRequestAds = false;
      
      logDebug('Consent reset successfully');
    } catch (error) {
      logError('Error resetting consent', { error: error.message });
    }
  }

  /**
   * Request consent form (for privacy settings)
   */
  async showPrivacyOptionsForm(): Promise<void> {
    try {
      await UMP.showPrivacyOptionsForm();
      
      logDebug('Privacy options form shown');
    } catch (error) {
      logError('Error showing privacy options', { error: error.message });
    }
  }

  /**
   * Set test geography for development
   */
  async setTestGeography(geography: 'EEA' | 'NOT_EEA'): Promise<void> {
    if (!__DEV__) return;

    try {
      await UMP.requestConsentInfoUpdate({
        debugGeography: geography === 'EEA' 
          ? AdsConsentDebugGeography.EEA 
          : AdsConsentDebugGeography.NOT_EEA,
        testDeviceIdentifiers: TEST_DEVICE_IDS,
      });

      logDebug(`Test geography set to ${geography}`);
    } catch (error) {
      logError('Error setting test geography', { error: error.message });
    }
  }
}

// Export singleton instance
export const adMobService = new AdMobService();

// Export ad unit IDs for direct use in components
export { AD_UNIT_IDS };

// Export types
export type { AdMobConfig };