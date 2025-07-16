/**
 * Interstitial Ad Service
 * Follows Google Mobile Ads SDK official implementation guide
 * https://developers.google.com/admob/react-native/interstitial
 */
import { adMobService } from './adMobService';
import { logDebug, logError } from '@/utils/errorHandler';

// Safely import AdMob modules with fallbacks
let InterstitialAd: any = null;
let AdEventType: any = null;
let TestIds: any = null;

try {
  const adMobModule = require('react-native-google-mobile-ads');
  InterstitialAd = adMobModule.InterstitialAd;
  AdEventType = adMobModule.AdEventType;
  TestIds = adMobModule.TestIds;
} catch (error) {
  // Silently handle missing AdMob modules in development
  console.log('AdMob InterstitialAd module not available in development environment');
}

interface InterstitialAdConfig {
  adUnitId: string;
  minInterval: number; // Minutes between ads
  maxFrequency: number; // Max ads per hour
}

export class InterstitialAdService {
  private static instance: InterstitialAdService;
  private interstitialAd: InterstitialAd | null = null;
  private isLoaded = false;
  private isShowing = false;
  private config: InterstitialAdConfig;
  
  // Frequency control
  private lastShownTime = 0;
  private adsShownThisHour = 0;
  private hourlyResetTime = 0;

  private constructor() {
    this.config = {
      adUnitId: adMobService.getAdUnitId('interstitial'),
      minInterval: 3, // 3 minutes between ads
      maxFrequency: 8, // Max 8 ads per hour
    };
  }

  public static getInstance(): InterstitialAdService {
    if (!InterstitialAdService.instance) {
      InterstitialAdService.instance = new InterstitialAdService();
    }
    return InterstitialAdService.instance;
  }

  /**
   * Initialize interstitial ad following SDK guide
   */
  public async initialize(): Promise<void> {
    try {
      // Check if AdMob modules are available
      if (!InterstitialAd) {
        logDebug('InterstitialAd module not available - skipping initialization');
        return;
      }

      if (!adMobService.canShowAds()) {
        logDebug('Interstitial ad initialization skipped - ads not allowed');
        return;
      }

      logDebug('Initializing interstitial ad', { adUnitId: this.config.adUnitId });

      // Create interstitial ad instance
      this.interstitialAd = InterstitialAd.createForAdRequest(this.config.adUnitId, {
        requestNonPersonalizedAdsOnly: false,
        keywords: ['gaming', 'streaming', 'entertainment'],
      });

      // Set up event listeners following SDK guide
      this.setupEventListeners();

      // Load the first ad
      await this.loadAd();

    } catch (error) {
      logError('Failed to initialize interstitial ad', { 
        error: error.message,
        adUnitId: this.config.adUnitId 
      });
    }
  }

  /**
   * Set up event listeners as per SDK guide
   */
  private setupEventListeners(): void {
    if (!this.interstitialAd) return;

    // Ad loaded event
    this.interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
      this.isLoaded = true;
      logDebug('Interstitial ad loaded successfully');
    });

    // Ad failed to load event
    this.interstitialAd.addAdEventListener(AdEventType.ERROR, (error) => {
      this.isLoaded = false;
      logError('Interstitial ad failed to load', { 
        error: error.message,
        code: error.code 
      });
      
      // Retry loading after delay
      setTimeout(() => {
        this.loadAd();
      }, 30000); // Retry after 30 seconds
    });

    // Ad opened event
    this.interstitialAd.addAdEventListener(AdEventType.OPENED, () => {
      this.isShowing = true;
      logDebug('Interstitial ad opened');
    });

    // Ad closed event
    this.interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
      this.isShowing = false;
      this.lastShownTime = Date.now();
      this.adsShownThisHour++;
      
      logDebug('Interstitial ad closed', {
        adsShownThisHour: this.adsShownThisHour,
        nextAvailableIn: this.getNextAvailableTime()
      });

      // Preload next ad
      setTimeout(() => {
        this.loadAd();
      }, 1000);
    });

    // Ad clicked event
    this.interstitialAd.addAdEventListener(AdEventType.CLICKED, () => {
      logDebug('Interstitial ad clicked');
    });

    // Ad impression event
    this.interstitialAd.addAdEventListener(AdEventType.IMPRESSION, () => {
      logDebug('Interstitial ad impression recorded');
    });
  }

  /**
   * Load interstitial ad
   */
  private async loadAd(): Promise<void> {
    try {
      if (!this.interstitialAd || !adMobService.canShowAds()) {
        return;
      }

      this.isLoaded = false;
      await this.interstitialAd.load();
      logDebug('Interstitial ad load requested');
      
    } catch (error) {
      logError('Failed to load interstitial ad', { error: error.message });
    }
  }

  /**
   * Show interstitial ad with placement context
   */
  public async show(placement: string = 'default'): Promise<boolean> {
    try {
      // Check if we can show ads
      if (!this.canShowAd()) {
        const reason = this.getBlockingReason();
        logDebug('Interstitial ad not shown', { placement, reason });
        return false;
      }

      if (!this.isLoaded || !this.interstitialAd) {
        logDebug('Interstitial ad not ready', { placement, isLoaded: this.isLoaded });
        return false;
      }

      // Show the ad
      await this.interstitialAd.show();
      logDebug('Interstitial ad shown successfully', { placement });
      return true;

    } catch (error) {
      logError('Failed to show interstitial ad', { 
        error: error.message, 
        placement 
      });
      return false;
    }
  }

  /**
   * Check if ad can be shown based on frequency rules
   */
  private canShowAd(): boolean {
    if (!adMobService.canShowAds()) return false;
    if (this.isShowing) return false;
    if (!this.isLoaded) return false;

    // Reset hourly counter if needed
    this.resetHourlyCounterIfNeeded();

    // Check frequency limits
    if (this.adsShownThisHour >= this.config.maxFrequency) {
      return false;
    }

    // Check minimum interval
    const timeSinceLastAd = Date.now() - this.lastShownTime;
    const minIntervalMs = this.config.minInterval * 60 * 1000;
    
    return timeSinceLastAd >= minIntervalMs;
  }

  /**
   * Get reason why ad cannot be shown
   */
  private getBlockingReason(): string {
    if (!adMobService.canShowAds()) return 'Ads not allowed (consent/initialization)';
    if (this.isShowing) return 'Ad already showing';
    if (!this.isLoaded) return 'Ad not loaded';

    this.resetHourlyCounterIfNeeded();
    
    if (this.adsShownThisHour >= this.config.maxFrequency) {
      return `Hourly frequency limit reached (${this.adsShownThisHour}/${this.config.maxFrequency})`;
    }

    const timeSinceLastAd = Date.now() - this.lastShownTime;
    const minIntervalMs = this.config.minInterval * 60 * 1000;
    
    if (timeSinceLastAd < minIntervalMs) {
      const remainingSeconds = Math.ceil((minIntervalMs - timeSinceLastAd) / 1000);
      return `Minimum interval not met (${remainingSeconds}s remaining)`;
    }

    return 'Unknown';
  }

  /**
   * Get time until next ad can be shown (in minutes)
   */
  private getNextAvailableTime(): number {
    const timeSinceLastAd = Date.now() - this.lastShownTime;
    const minIntervalMs = this.config.minInterval * 60 * 1000;
    const remainingMs = Math.max(0, minIntervalMs - timeSinceLastAd);
    return Math.ceil(remainingMs / (60 * 1000));
  }

  /**
   * Reset hourly counter if hour has passed
   */
  private resetHourlyCounterIfNeeded(): void {
    const currentHour = Math.floor(Date.now() / (60 * 60 * 1000));
    if (currentHour > this.hourlyResetTime) {
      this.adsShownThisHour = 0;
      this.hourlyResetTime = currentHour;
      logDebug('Hourly ad counter reset');
    }
  }

  /**
   * Get current ad status for debugging
   */
  public getStatus(): object {
    this.resetHourlyCounterIfNeeded();
    
    return {
      isLoaded: this.isLoaded,
      isShowing: this.isShowing,
      canShow: this.canShowAd(),
      adsShownThisHour: this.adsShownThisHour,
      maxFrequency: this.config.maxFrequency,
      nextAvailableIn: this.getNextAvailableTime(),
      blockingReason: this.canShowAd() ? null : this.getBlockingReason(),
      adUnitId: this.config.adUnitId,
    };
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<InterstitialAdConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logDebug('Interstitial ad config updated', this.config);
  }
}

// Export singleton instance
export const interstitialAdService = InterstitialAdService.getInstance();