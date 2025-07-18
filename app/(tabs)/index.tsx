import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect, useNavigation } from 'expo-router';
import { RefreshCw, Filter } from 'lucide-react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { Alert, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BannerAdComponent } from '@/components/ads/BannerAd';
import { ModernDiscoverScreen } from '@/components/ModernDiscoverScreen';
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
    toggleFavorite,
    isFavorite: checkIsFavorite,
    loading: streamManagerLoading,
    forceReload,
  } = useStreamManager();
  const { showAd, canShow } = useInterstitialAd();


  const handleManualRefresh = useCallback(() => {
    forceReload();
  }, [forceReload]);

  // Refresh when screen comes into focus, but only if needed to prevent race conditions
  useFocusEffect(
    useCallback(() => {
      // Only reload if we don't have recent data or if streams were cleared
      if (activeStreams.length === 0 || !streams.length) {
        forceReload();
      }
    }, [forceReload, activeStreams.length, streams.length])
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
    return await handleAddStream(stream);
  };

  const handleAddStream = async (stream: TwitchStream) => {
    try {
      const result = await addStream(stream);

      if (result.success) {
        // Show interstitial ad occasionally after successful stream add
        if (canShow && activeStreams.length >= 2 && Math.random() < 0.5) {
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
      console.error('Error adding stream:', error);
      const errorResult = { success: false, message: 'Failed to add stream' };
      Alert.alert('Error', errorResult.message);
      return errorResult;
    }
  };

  const handleToggleFavorite = async (userId: string) => {
    try {
      // Find the stream by user_id
      const stream = streams.find(s => s.user_id === userId);
      if (stream) {
        await toggleFavorite(stream);
        console.log('Toggled favorite for:', stream.user_name);
      } else {
        console.error('Stream not found for user_id:', userId);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorites');
    }
  };

  const isFavorite = (userId: string) => {
    return checkIsFavorite(userId);
  };

  const isStreamActive = useCallback(
    (streamId: string) => {
      return activeStreams.some(stream => stream.id === streamId);
    },
    [activeStreams]
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#09090b' }}>
      <ModernDiscoverScreen
        key={`discover-${activeStreams.length}`}
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
    </View>
  );
}
