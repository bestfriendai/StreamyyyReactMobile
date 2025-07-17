import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect, useNavigation } from 'expo-router';
import { RefreshCw, Filter } from 'lucide-react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { Alert, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BannerAdComponent } from '@/components/ads/BannerAd';
import { EnhancedDiscoverScreenV4 } from '@/components/EnhancedDiscoverScreenV4';
import { NavigationHeader } from '@/components/NavigationHeader';
import { useInterstitialAd } from '@/hooks/useInterstitialAd';
import { useStreamManager } from '@/hooks/useStreamManager';
import {
  TwitchStream,
  TwitchGame,
  fetchTopStreams,
  fetchEnhancedStreams,
  fetchTopGames,
} from '@/services/twitchApi';

export default function DiscoverScreen() {
  const [streams, setStreams] = useState<TwitchStream[]>([]);
  const [games, setGames] = useState<TwitchGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const {
    addStream,
    activeStreams,
    loading: streamManagerLoading,
    forceReload,
  } = useStreamManager();
  const { showAd, canShow } = useInterstitialAd();

  // Refresh active streams state when the screen is focused (optimized)
  useFocusEffect(
    useCallback(() => {
      // Only reload if needed, don't force streams array recreation
      forceReload();
    }, [forceReload])
  );

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [enhancedStreams, topGames] = await Promise.all([
        fetchEnhancedStreams(50), // Reduce initial load for better performance
        fetchTopGames(8), // Reduce games for faster initial load
      ]);
      setStreams(enhancedStreams);
      setGames(topGames);
      setHasMore(enhancedStreams.length === 50);
    } catch (error) {
      console.error('Error loading initial data:', error);
      Alert.alert('Error', 'Failed to load streams. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await loadInitialData();
  };

  const handleLoadMore = async () => {
    if (loading || !hasMore) {
      return;
    }

    try {
      const moreStreams = await fetchEnhancedStreams(50);
      if (moreStreams.length > 0) {
        setStreams(prev => [...prev, ...moreStreams]);
        setHasMore(moreStreams.length === 50);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more streams:', error);
    }
  };

  const handleStreamSelect = async (stream: TwitchStream) => {
    console.log('handleStreamSelect called - delegating to handleAddStream');
    return await handleAddStream(stream);
  };

  const handleAddStream = async (stream: TwitchStream) => {
    try {
      console.log('handleAddStream called with:', stream.user_name, stream.id);
      const result = await addStream(stream);
      console.log('addStream result:', result);

      if (result.success) {
        // Show interstitial ad occasionally after successful stream add
        if (canShow && activeStreams.length >= 2 && Math.random() < 0.5) {
          // 50% chance after 2+ streams
          showAd('stream_added');
        }

        Alert.alert('Stream Added!', `${stream.user_name} has been added to your multi-view`, [
          { text: 'OK' },
          {
            text: 'View Grid',
            onPress: () => router.push('/(tabs)/grid'),
          },
        ]);
      } else {
        Alert.alert('Error', result.message);
      }

      return result;
    } catch (error) {
      console.error('Error in handleAddStream:', error);
      const errorResult = { success: false, message: 'Failed to add stream' };
      Alert.alert('Error', errorResult.message);
      return errorResult;
    }
  };

  const handleToggleFavorite = (userId: string) => {
    // TODO: Implement favorites functionality
    console.log('Toggle favorite for user:', userId);
  };

  const isFavorite = (userId: string) => {
    // TODO: Implement favorites check
    return false;
  };

  const isStreamActive = useCallback(
    (streamId: string) => {
      return activeStreams.some(stream => stream.id === streamId);
    },
    [activeStreams]
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <EnhancedDiscoverScreenV4
          streams={streams}
          games={games}
          onStreamSelect={handleStreamSelect}
          onRefresh={handleRefresh}
          isLoading={loading}
          onLoadMore={handleLoadMore}
          hasMore={hasMore}
          onAddStream={handleAddStream}
          onToggleFavorite={handleToggleFavorite}
          isFavorite={isFavorite}
          isStreamActive={isStreamActive}
        />
        <BannerAdComponent size="ADAPTIVE_BANNER" position="bottom" />
      </SafeAreaView>
    </View>
  );
}
