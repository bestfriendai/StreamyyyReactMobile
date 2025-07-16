# Google Mobile Ads SDK Implementation Guide

## Overview
This app integrates Google Mobile Ads SDK following the official implementation guide with proper interstitial ad placement and GDPR compliance.

## Configuration

### App IDs
- **App ID**: `ca-app-pub-4679934692726562~6257879408`
- **Interstitial Ad Unit**: `ca-app-pub-4679934692726562/8447577403`

### Files Configured
- `app.json` - Plugin configuration with proper app ID
- `.env` - Environment variables for ad unit IDs
- `eas.json` - Build configuration for development testing

## Implementation Structure

### Core Services
1. **AdMobService** (`/services/adMobService.ts`)
   - SDK initialization following Google's guide
   - GDPR consent management with UMP SDK
   - Request configuration for development/production

2. **InterstitialAdService** (`/services/interstitialAdService.ts`)
   - Dedicated interstitial ad management
   - Frequency control (max 8 ads/hour, 3min intervals)
   - Proper event handling per SDK guide
   - Automatic ad preloading

### React Integration
1. **useInterstitialAd Hook** (`/hooks/useInterstitialAd.ts`)
   - Easy-to-use React interface
   - Status tracking and updates
   - Placement context support

2. **Component Integration**
   - Banner ads on discover page
   - Interstitial ads on navigation transitions
   - Strategic placement after user actions

## Ad Placements

### Interstitial Ads
- **Tab Navigation**: 30% chance on tab switches
- **Stream Addition**: 50% chance after adding 2+ streams
- **Frequency Control**: Max 8 per hour, 3-minute intervals

### Banner Ads
- **Discover Page**: Bottom adaptive banner
- **Error Handling**: Graceful fallback display

## Testing & Debugging

### Development Testing
1. Build with development profile:
   ```bash
   eas build --platform ios --profile development
   eas build --platform android --profile development
   ```

2. Use debug utilities in console:
   ```javascript
   adDebug.status()        // Show ad status
   adDebug.testInterstitial() // Test interstitial ad
   adDebug.report()        // Generate debug report
   ```

### Test Device Setup
- Add device advertising ID to `TEST_DEVICE_IDS` in `adMobService.ts`
- Check console logs for device ID during development

## GDPR Compliance
- UMP SDK integration for EU users
- Consent management with privacy options
- Non-personalized ads fallback

## Key Features
- ✅ Official SDK implementation
- ✅ Frequency control to prevent ad fatigue
- ✅ GDPR/CCPA compliance
- ✅ Test device configuration
- ✅ Comprehensive error handling
- ✅ Debug utilities for testing
- ✅ Strategic ad placement
- ✅ Automatic ad preloading

## Production Deployment
1. Ensure proper ad unit IDs in `.env`
2. Build with production profile
3. Test with real devices before app store submission
4. Monitor ad performance in AdMob console

## Troubleshooting
- Check initialization status with `adDebug.status()`
- Verify consent status for GDPR regions
- Ensure development build (not Expo Go) for testing
- Check device logs for detailed error messages