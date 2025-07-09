import { useState, useEffect, useCallback } from 'react';
import { twitchApi, TwitchStream, TwitchUser, TwitchGame } from '@/services/twitchApi';

interface UseStreamsResult {
  streams: TwitchStream[];
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  hasMore: boolean;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  searchStreams: (query: string) => Promise<void>;
  filterByGame: (gameId: string) => Promise<void>;
  clearSearch: () => void;
}

export function useTwitchStreams(): UseStreamsResult {
  const [streams, setStreams] = useState<TwitchStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);

  const loadStreams = useCallback(async (reset: boolean = false, gameId?: string) => {
    try {
      setError(null);
      if (reset) {
        setLoading(true);
        setCursor(undefined);
        console.log('Loading fresh streams...');
      } else {
        console.log('Loading more streams...');
      }

      let response;
      if (gameId) {
        response = await twitchApi.getStreamsByGame(gameId, 20);
        // Game-specific streams don't have pagination in the same way
        response.pagination = { cursor: undefined };
      } else {
        response = await twitchApi.getTopStreams(20, reset ? undefined : cursor);
      }
      
      if (reset) {
        setStreams(response.data);
        console.log(`Loaded ${response.data.length} fresh streams`);
      } else {
        setStreams(prev => {
          const newStreams = [...prev, ...response.data];
          console.log(`Total streams: ${newStreams.length}`);
          return newStreams;
        });
      }
      
      setCursor(response.pagination?.cursor);
      setHasMore(!!response.pagination?.cursor);
      
      if (response.data.length > 0) {
        console.log('Sample stream:', {
          title: response.data[0].title,
          streamer: response.data[0].user_name,
          viewers: response.data[0].viewer_count,
          game: response.data[0].game_name
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load streams';
      setError(errorMessage);
      console.error('Error loading streams:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [cursor]);

  const refresh = useCallback(async () => {
    console.log('Refreshing streams...');
    setRefreshing(true);
    setIsSearching(false);
    setSearchQuery('');
    await loadStreams(true, currentGameId || undefined);
  }, [loadStreams, currentGameId]);

  const loadMore = useCallback(async () => {
    if (!loading && !refreshing && hasMore && !isSearching && !currentGameId) {
      console.log('Loading more streams...');
      await loadStreams(false);
    }
  }, [loading, refreshing, hasMore, isSearching, currentGameId, loadStreams]);

  const searchStreams = useCallback(async (query: string) => {
    if (!query.trim()) {
      clearSearch();
      return;
    }

    try {
      console.log(`Searching for: "${query}"`);
      setLoading(true);
      setError(null);
      setIsSearching(true);
      setSearchQuery(query);
      setCurrentGameId(null);

      const response = await twitchApi.searchStreams(query.trim(), 20);
      setStreams(response.data);
      setHasMore(false);
      
      console.log(`Search returned ${response.data.length} results`);
      if (response.data.length === 0) {
        console.log('No live streams found for search query');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
      console.error('Error searching streams:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const filterByGame = useCallback(async (gameId: string) => {
    try {
      console.log(`Filtering streams by game ID: ${gameId}`);
      setLoading(true);
      setError(null);
      setIsSearching(true);
      setSearchQuery('');
      setCurrentGameId(gameId);

      const response = await twitchApi.getStreamsByGame(gameId, 20);
      setStreams(response.data);
      setHasMore(false);
      
      console.log(`Game filter returned ${response.data.length} results`);
      if (response.data.length === 0) {
        console.log('No live streams found for this game');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Game filter failed';
      setError(errorMessage);
      console.error('Error filtering streams by game:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    console.log('Clearing search, returning to top streams');
    setIsSearching(false);
    setSearchQuery('');
    setCurrentGameId(null);
    setHasMore(true);
    loadStreams(true);
  }, [loadStreams]);

  // Initial load
  useEffect(() => {
    console.log('Initializing Twitch streams...');
    loadStreams(true);
  }, []);

  return {
    streams,
    loading,
    error,
    refreshing,
    hasMore,
    refresh,
    loadMore,
    searchStreams,
    filterByGame,
    clearSearch,
  };
}

interface UseTopGamesResult {
  games: TwitchGame[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useTopGames(): UseTopGamesResult {
  const [games, setGames] = useState<TwitchGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGames = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      console.log('Loading top games...');
      
      const response = await twitchApi.getTopGames(10);
      setGames(response.data);
      
      console.log(`Loaded ${response.data.length} top games`);
      if (response.data.length > 0) {
        console.log('Top games:', response.data.slice(0, 3).map(g => g.name).join(', '));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load games';
      setError(errorMessage);
      console.error('Error loading games:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    console.log('Refreshing top games...');
    await loadGames();
  }, [loadGames]);

  useEffect(() => {
    loadGames();
  }, [loadGames]);

  return {
    games,
    loading,
    error,
    refresh,
  };
}