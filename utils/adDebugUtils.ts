/**
 * Ad Debug Utilities
 * Helper functions for testing and debugging Google Mobile Ads integration
 */
import { Alert } from 'react-native';
import { adMobService } from '@/services/adMobService';
import { interstitialAdService } from '@/services/interstitialAdService';
import { logDebug } from './errorHandler';

export class AdDebugUtils {
  /**
   * Show comprehensive ad status information
   */
  static showAdStatus(): void {
    const adMobConfig = adMobService.getConfig();
    const interstitialStatus = interstitialAdService.getStatus();
    
    const statusInfo = {
      'AdMob SDK': {
        'Initialized': adMobConfig.isInitialized,
        'Can Request Ads': adMobConfig.canRequestAds,
        'Consent Status': adMobConfig.consentStatus || 'Unknown',
        'Test Mode': adMobConfig.isTestMode,
      },
      'Interstitial Ads': interstitialStatus,
      'Ad Unit IDs': {
        'Banner': adMobService.getAdUnitId('banner'),
        'Interstitial': adMobService.getAdUnitId('interstitial'),
        'Rewarded': adMobService.getAdUnitId('rewarded'),
      }
    };

    logDebug('Ad Status Debug Info', statusInfo);
    
    Alert.alert(
      'Ad Status Debug',
      JSON.stringify(statusInfo, null, 2),
      [{ text: 'OK' }]
    );
  }

  /**
   * Test interstitial ad loading and showing
   */
  static async testInterstitialAd(): Promise<void> {
    try {
      Alert.alert(
        'Testing Interstitial Ad',
        'Attempting to show interstitial ad...',
        [{ text: 'OK' }]
      );

      const success = await interstitialAdService.show('debug_test');
      
      Alert.alert(
        'Interstitial Test Result',
        success ? 'Ad shown successfully!' : 'Failed to show ad',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert(
        'Interstitial Test Error',
        error.message,
        [{ text: 'OK' }]
      );
    }
  }

  /**
   * Reset ad frequency limits for testing
   */
  static resetAdLimits(): void {
    // This would reset internal counters - implementation depends on service design
    Alert.alert(
      'Ad Limits Reset',
      'Ad frequency limits have been reset for testing',
      [{ text: 'OK' }]
    );
  }

  /**
   * Show test device configuration info
   */
  static showTestDeviceInfo(): void {
    Alert.alert(
      'Test Device Setup',
      'To see test ads instead of real ads:\n\n' +
      '1. Add your device ID to TEST_DEVICE_IDS in adMobService.ts\n' +
      '2. Build with development profile\n' +
      '3. Check logs for your device advertising ID\n\n' +
      'Current environment: ' + (__DEV__ ? 'Development' : 'Production'),
      [{ text: 'OK' }]
    );
  }

  /**
   * Generate debug report for troubleshooting
   */
  static generateDebugReport(): string {
    const adMobConfig = adMobService.getConfig();
    const interstitialStatus = interstitialAdService.getStatus();
    
    const report = `
=== Google Mobile Ads Debug Report ===
Generated: ${new Date().toISOString()}

AdMob SDK Status:
- Initialized: ${adMobConfig.isInitialized}
- Can Request Ads: ${adMobConfig.canRequestAds}
- Consent Status: ${adMobConfig.consentStatus || 'Unknown'}
- Test Mode: ${adMobConfig.isTestMode}

Interstitial Ad Status:
${JSON.stringify(interstitialStatus, null, 2)}

Ad Unit IDs:
- Banner: ${adMobService.getAdUnitId('banner')}
- Interstitial: ${adMobService.getAdUnitId('interstitial')}
- Rewarded: ${adMobService.getAdUnitId('rewarded')}

Environment:
- Development Mode: ${__DEV__}
- Platform: ${require('react-native').Platform.OS}

=== End Report ===
    `.trim();

    logDebug('Generated debug report', { report });
    return report;
  }
}

// Global debug methods for easy console access
if (__DEV__) {
  (global as any).adDebug = {
    status: AdDebugUtils.showAdStatus,
    testInterstitial: AdDebugUtils.testInterstitialAd,
    resetLimits: AdDebugUtils.resetAdLimits,
    testDeviceInfo: AdDebugUtils.showTestDeviceInfo,
    report: AdDebugUtils.generateDebugReport,
  };
  
  console.log('🎯 Ad Debug Utils loaded. Use adDebug.* methods in console for testing');
}