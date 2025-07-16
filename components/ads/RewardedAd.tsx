/**
 * Rewarded Ad Component
 * Handles rewarded video ads for premium features and benefits
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Gift, Play, Clock, Star } from 'lucide-react-native';

import { adMobService } from '@/services/adMobService';
import { logDebug, logError } from '@/utils/errorHandler';

// Safely import AdMob modules with fallbacks
let RewardedAd: any = null;
let RewardedAdEventType: any = null;
let AdEventType: any = null;

try {
  const adMobModule = require('react-native-google-mobile-ads');
  RewardedAd = adMobModule.RewardedAd;
  RewardedAdEventType = adMobModule.RewardedAdEventType;
  AdEventType = adMobModule.AdEventType;
} catch (error) {
  // Silently handle missing AdMob modules in development
  console.log('AdMob RewardedAd module not available in development environment');
}

interface RewardedAdButtonProps {
  title: string;
  description: string;
  rewardText: string;
  onRewardEarned: () => void;
  onAdFailed?: (error: string) => void;
  style?: object;
  disabled?: boolean;
}

export const RewardedAdButton: React.FC<RewardedAdButtonProps> = ({
  title,
  description,
  rewardText,
  onRewardEarned,
  onAdFailed,
  style,
  disabled = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isAdLoaded, setIsAdLoaded] = useState(false);
  const [canShowAds, setCanShowAds] = useState(false);
  const rewardedAdRef = useRef<RewardedAd | null>(null);

  useEffect(() => {
    initializeAd();
  }, []);

  const initializeAd = async () => {
    try {
      if (!adMobService.canShowAds() || !RewardedAd) {
        setCanShowAds(false);
        return;
      }

      setCanShowAds(true);
      const adUnitId = adMobService.getAdUnitId('rewarded');

      rewardedAdRef.current = RewardedAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: false,
      });

      if (RewardedAdEventType && AdEventType) {
        rewardedAdRef.current.addAdEventListener(RewardedAdEventType.LOADED, () => {
          setIsAdLoaded(true);
          logDebug('Rewarded ad loaded');
        });

        rewardedAdRef.current.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward) => {
          logDebug('Rewarded ad reward earned', { reward });
          onRewardEarned();
        });

        rewardedAdRef.current.addAdEventListener(AdEventType.ERROR, (error) => {
          setIsAdLoaded(false);
          logError('Rewarded ad error', { error: error.message });
          onAdFailed?.(error.message);
        });
        
        rewardedAdRef.current.addAdEventListener(AdEventType.CLOSED, () => {
          setIsLoading(false);
          // Preload next ad
          setTimeout(() => {
            rewardedAdRef.current?.load();
          }, 1000);
        });
      }

      // Load the ad
      rewardedAdRef.current.load();
    } catch (error) {
      logError('Failed to initialize rewarded ad', { error: error.message });
      setCanShowAds(false);
    }
  };

  const handleWatchAd = async () => {
    try {
      if (!canShowAds) {
        Alert.alert(
          'Ads not available',
          'Rewarded ads are not available at the moment. Please try again later.'
        );
        return;
      }

      if (!isAdLoaded) {
        Alert.alert(
          'Ad not ready',
          'The rewarded ad is still loading. Please try again in a moment.'
        );
        return;
      }

      setIsLoading(true);

      if (rewardedAdRef.current) {
        await rewardedAdRef.current.show();
      }

    } catch (error) {
      setIsLoading(false);
      logError('Failed to show rewarded ad', { error: error.message });
      onAdFailed?.(error.message);
      Alert.alert(
        'Error',
        'Failed to show the rewarded ad. Please try again.'
      );
    }
  };

  // Don't render if ads are not available
  if (!canShowAds) {
    return null;
  }

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={handleWatchAd}
      disabled={disabled || isLoading || !isAdLoaded}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={
          disabled || !isAdLoaded
            ? ['rgba(107, 114, 128, 0.3)', 'rgba(75, 85, 99, 0.3)']
            : ['rgba(139, 92, 246, 0.8)', 'rgba(124, 58, 237, 0.8)']
        }
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : !isAdLoaded ? (
              <Clock size={24} color="#9CA3AF" />
            ) : (
              <Gift size={24} color="#fff" />
            )}
          </View>

          <View style={styles.textContainer}>
            <Text style={[
              styles.title,
              { color: disabled || !isAdLoaded ? '#9CA3AF' : '#fff' }
            ]}>
              {title}
            </Text>
            <Text style={[
              styles.description,
              { color: disabled || !isAdLoaded ? '#6B7280' : '#E5E7EB' }
            ]}>
              {isLoading
                ? 'Loading ad...'
                : !isAdLoaded
                ? 'Ad loading...'
                : description
              }
            </Text>
          </View>

          <View style={styles.actionContainer}>
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <View style={styles.playButton}>
                <Play size={16} color={disabled || !isAdLoaded ? '#6B7280' : '#fff'} />
              </View>
            )}
          </View>
        </View>

        {isAdLoaded && !disabled && (
          <View style={styles.rewardBadge}>
            <Star size={12} color="#F59E0B" />
            <Text style={styles.rewardText}>Reward</Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

// Hook for managing multiple rewarded ads
export const useRewardedAds = () => {
  const [adStats, setAdStats] = useState({
    totalWatched: 0,
    rewardsEarned: 0,
    lastWatchedTime: 0,
  });

  const updateStats = () => {
    setAdStats(prev => ({
      totalWatched: prev.totalWatched + 1,
      rewardsEarned: prev.rewardsEarned + 1,
      lastWatchedTime: Date.now(),
    }));
  };

  const canWatchAd = (cooldownMinutes = 30) => {
    const timeSinceLastWatch = Date.now() - adStats.lastWatchedTime;
    const cooldownMs = cooldownMinutes * 60 * 1000;
    return timeSinceLastWatch >= cooldownMs;
  };

  const getCooldownRemaining = (cooldownMinutes = 30) => {
    const timeSinceLastWatch = Date.now() - adStats.lastWatchedTime;
    const cooldownMs = cooldownMinutes * 60 * 1000;
    const remaining = Math.max(0, cooldownMs - timeSinceLastWatch);
    return Math.ceil(remaining / (60 * 1000)); // Return minutes remaining
  };

  return {
    adStats,
    updateStats,
    canWatchAd,
    getCooldownRemaining,
  };
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    marginVertical: 8,
  },
  gradient: {
    position: 'relative',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  actionContainer: {
    marginLeft: 16,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  rewardText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#F59E0B',
  },
});

export default RewardedAdButton;