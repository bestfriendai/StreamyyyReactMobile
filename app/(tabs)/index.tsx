import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EnhancedDiscoverScreenV2 } from '@/components/EnhancedDiscoverScreenV2';
import { TwitchStream, TwitchGame, fetchTopStreams, fetchTopGames } from '@/services/twitchApi';
import { useStreamManager } from '@/hooks/useStreamManager';

export default function DiscoverScreen() {
  const [streams, setStreams] = useState<TwitchStream[]>([]);
  const [games, setGames] = useState<TwitchGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const { addStream } = useStreamManager();

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
      const moreStreams = await fetchTopStreams(20, streams.length);
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

  return (
    <SafeAreaView style={styles.container}>
      <EnhancedDiscoverScreenV2
        streams={streams}
        games={games}
        onStreamSelect={handleStreamSelect}
        onRefresh={handleRefresh}
        isLoading={loading}
        onLoadMore={handleLoadMore}
        hasMore={hasMore}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});