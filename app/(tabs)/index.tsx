import React, { useState, useEffect } from 'react';
import { Alert, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CleanDiscoverScreen } from '@/components/CleanDiscoverScreen';
import { TwitchStream, TwitchGame, fetchTopStreams, fetchTopGames } from '@/services/twitchApi';
import { useStreamManager } from '@/hooks/useStreamManager';

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
      const [topStreams, topGames] = await Promise.all([
        fetchTopStreams(20),
        fetchTopGames(10)
      ]);
      setStreams(topStreams);
      setGames(topGames);
      setHasMore(topStreams.length === 20);
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
      const moreStreams = await fetchTopStreams(20);
      if (moreStreams.length > 0) {
        setStreams(prev => [...prev, ...moreStreams]);
        setHasMore(moreStreams.length === 20);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more streams:', error);
    }
  };

  const handleStreamSelect = (stream: TwitchStream) => {
    addStream(stream);
    Alert.alert(
      'Stream Added',
      `${stream.user_name} has been added to your multi-view!`,
      [
        { text: 'OK' },
        { text: 'Go to Multi-View', onPress: () => {
          // TODO: Navigate to grid tab
        }}
      ]
    );
  };

  const handleAddStream = async (stream: TwitchStream) => {
    try {
      addStream(stream);
      return { success: true, message: 'Stream added successfully!' };
    } catch (error) {
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

  const isStreamActive = (streamId: string) => {
    return activeStreams.some(stream => stream.id === streamId);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <SafeAreaView style={{ flex: 1 }}>
        <CleanDiscoverScreen
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