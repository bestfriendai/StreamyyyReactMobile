import React, { useState, useEffect, useCallback } from 'react';
import { Alert, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { EnhancedDiscoverScreenV4 } from '@/components/EnhancedDiscoverScreenV4';
import { NavigationHeader } from '@/components/NavigationHeader';
import { TwitchStream, TwitchGame, fetchTopStreams, fetchEnhancedStreams, fetchTopGames } from '@/services/twitchApi';
import { useStreamManager } from '@/hooks/useStreamManager';
import { RefreshCw, Filter } from 'lucide-react-native';

export default function DiscoverScreen() {
  const [streams, setStreams] = useState<TwitchStream[]>([]);
  const [games, setGames] = useState<TwitchGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const { addStream, activeStreams } = useStreamManager();

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [enhancedStreams, topGames] = await Promise.all([
        fetchEnhancedStreams(100), // Get more streams with enhanced metadata
        fetchTopGames(12) // Get more games for better categorization
      ]);
      setStreams(enhancedStreams);
      setGames(topGames);
      setHasMore(enhancedStreams.length === 100);
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
    if (loading || !hasMore) return;

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
    const result = await addStream(stream);
    if (result.success) {
      Alert.alert(
        'Stream Added',
        result.message,
        [
          { text: 'OK' },
          { text: 'View Grid', onPress: () => {
            router.push('/(tabs)/grid');
          }}
        ]
      );
    } else {
      Alert.alert('Error', result.message);
    }
  };

  const handleAddStream = async (stream: TwitchStream) => {
    try {
      const result = await addStream(stream);
      return result;
    } catch (error) {
      console.error('Error in handleAddStream:', error);
      return { success: false, message: 'Failed to add stream' };
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

  const isStreamActive = useCallback((streamId: string) => {
    return activeStreams.some(stream => stream.id === streamId);
  }, [activeStreams]);

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
      </SafeAreaView>
    </View>
  );
}