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
  
  // Enhanced error tracking and retry logic
  const [retryCount, setRetryCount] = useState(0);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [rateLimitedUntil, setRateLimitedUntil] = useState<number>(0);
  
  // Cache management
  const [cachedStreams, setCachedStreams] = useState<{
    data: TwitchStream[];
    timestamp: number;
    query?: string;
    gameId?: string;
  } | null>(null);

  // Check if we should use cached data
  const shouldUseCachedData = useCallback((cacheKey: string) => {
    if (!cachedStreams) return false;
    
    const now = Date.now();
    const cacheAge = now - cachedStreams.timestamp;
    const maxCacheAge = 2 * 60 * 1000; // 2 minutes for fresh data
    
    // Use cache if data is fresh and matches current request
    if (cacheAge < maxCacheAge) {
      if (cacheKey === 'top' && !cachedStreams.query && !cachedStreams.gameId) {
        return true;
      }
      if (cacheKey === cachedStreams.query || cacheKey === cachedStreams.gameId) {
        return true;
      }
    }
    
    return false;
  }, [cachedStreams]);

  // Check rate limiting
  const isRateLimited = useCallback(() => {
    return Date.now() < rateLimitedUntil;
  }, [rateLimitedUntil]);

  const loadStreams = useCallback(async (reset: boolean = false, gameId?: string) => {
    try {
      // Check rate limiting
      if (isRateLimited() && reset) {
        const waitTime = Math.ceil((rateLimitedUntil - Date.now()) / 1000);
        setError(`Rate limited. Please wait ${waitTime} seconds before refreshing.`);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Prevent too frequent requests
      const now = Date.now();
      const timeSinceLastFetch = now - lastFetchTime;
      const minInterval = 1000; // 1 second minimum between requests
      
      if (timeSinceLastFetch < minInterval && !reset) {
        console.log('⏱️ Throttling request - too frequent');
        return;
      }

      setError(null);
      setLastFetchTime(now);
      
      // Check cache for initial load
      const cacheKey = gameId || 'top';
      if (reset && shouldUseCachedData(cacheKey)) {
        console.log('📋 Using cached streams data');
        setStreams(cachedStreams!.data);
        setLoading(false);
        setRefreshing(false);
        setRetryCount(0);
        return;
      }
      
      if (reset) {
        setLoading(true);
        setCursor(undefined);
        setRetryCount(0);
        console.log('🔄 Loading fresh streams...');
      } else {
        console.log('📄 Loading more streams...');
      }

      let response;
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        try {
          if (gameId) {
            response = await twitchApi.getStreamsByGame(gameId, 20);
            // Game-specific streams don't have pagination in the same way
            response.pagination = { cursor: undefined };
          } else {
            response = await twitchApi.getTopStreams(20, reset ? undefined : cursor);
          }
          
          // Success - break out of retry loop
          break;
        } catch (apiError: any) {
          attempts++;
          console.warn(`🔄 API request failed (attempt ${attempts}/${maxAttempts}):`, apiError.message);
          
          // Handle rate limiting
          if (apiError.message?.includes('429') || apiError.message?.includes('rate limit')) {
            const waitTime = Math.min(30000, 5000 * attempts); // Max 30 seconds
            setRateLimitedUntil(now + waitTime);
            console.log(`🚫 Rate limited, waiting ${waitTime/1000} seconds`);
            
            if (attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, waitTime));
              continue;
            }
          }
          
          // Handle network errors with exponential backoff
          if (apiError.message?.includes('Network') || apiError.message?.includes('fetch')) {
            if (attempts < maxAttempts) {
              const backoffTime = Math.min(10000, 1000 * Math.pow(2, attempts - 1));
              console.log(`🌐 Network error, retrying in ${backoffTime}ms`);
              await new Promise(resolve => setTimeout(resolve, backoffTime));
              continue;
            }
          }
          
          // If this is the last attempt, throw the error
          if (attempts >= maxAttempts) {
            throw apiError;
          }
        }
      }
      
      // Validate response
      if (!response || !Array.isArray(response.data)) {
        throw new Error('Invalid response format from API');
      }
      
      // Filter and enhance streams
      const validStreams = response.data.filter(stream => {
        return stream &&
               stream.user_login &&
               stream.user_name &&
               stream.type === 'live' &&
               /^[a-zA-Z0-9_]+$/.test(stream.user_login);
      });
      
      // Add metadata to streams
      const enhancedStreams = validStreams.map(stream => ({
        ...stream,
        fetchedAt: new Date().toISOString(),
        embedUrl: `https://player.twitch.tv/?channel=${stream.user_login}&parent=localhost&parent=expo.dev&muted=true&autoplay=true&controls=false`,
        thumbnailUrl: stream.thumbnail_url ? 
          stream.thumbnail_url.replace('{width}', '320').replace('{height}', '180') :
          `https://static-cdn.jtvnw.net/previews-ttv/live_user_${stream.user_login}-320x180.jpg`
      }));
      
      if (reset) {
        setStreams(enhancedStreams);
        
        // Cache the data
        setCachedStreams({
          data: enhancedStreams,
          timestamp: now,
          gameId: gameId || undefined,
          query: undefined
        });
        
        console.log(`✅ Loaded ${enhancedStreams.length} fresh streams`);
      } else {
        setStreams(prev => {
          const newStreams = [...prev, ...enhancedStreams];
          console.log(`📈 Total streams: ${newStreams.length}`);
          return newStreams;
        });
      }
      
      setCursor(response.pagination?.cursor);
      setHasMore(!!response.pagination?.cursor);
      setRetryCount(0);
      
      if (enhancedStreams.length > 0) {
        console.log('🎮 Sample stream:', {
          title: enhancedStreams[0].title,
          streamer: enhancedStreams[0].user_name,
          viewers: enhancedStreams[0].viewer_count,
          game: enhancedStreams[0].game_name
        });
      }
      
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to load streams';
      setError(errorMessage);
      setRetryCount(prev => prev + 1);
      
      console.error('❌ Error loading streams:', {
        error: errorMessage,
        retryCount: retryCount + 1,
        gameId,
        reset
      });
      
      // Use cached data as fallback if available
      if (reset && cachedStreams && cachedStreams.data.length > 0) {
        console.log('🔄 Using cached data as fallback');
        setStreams(cachedStreams.data);
        setError(null);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [cursor, cachedStreams, shouldUseCachedData, isRateLimited, lastFetchTime, rateLimitedUntil, retryCount]);

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

    const trimmedQuery = query.trim();
    
    // Check if we have cached search results
    if (cachedStreams && 
        cachedStreams.query === trimmedQuery && 
        Date.now() - cachedStreams.timestamp < 60000) { // 1 minute cache for searches
      console.log('📋 Using cached search results');
      setStreams(cachedStreams.data);
      setIsSearching(true);
      setSearchQuery(trimmedQuery);
      setCurrentGameId(null);
      setHasMore(false);
      return;
    }

    try {
      console.log(`🔍 Searching for: "${trimmedQuery}"`);
      setLoading(true);
      setError(null);
      setIsSearching(true);
      setSearchQuery(trimmedQuery);
      setCurrentGameId(null);

      let attempts = 0;
      const maxAttempts = 2;
      let response;
      
      while (attempts < maxAttempts) {
        try {
          response = await twitchApi.searchStreams(trimmedQuery, 20);
          break;
        } catch (searchError: any) {
          attempts++;
          console.warn(`🔄 Search failed (attempt ${attempts}/${maxAttempts}):`, searchError.message);
          
          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          }
          throw searchError;
        }
      }
      
      // Validate and enhance search results
      const validStreams = response.data.filter(stream => {
        return stream &&
               stream.user_login &&
               stream.user_name &&
               stream.type === 'live' &&
               /^[a-zA-Z0-9_]+$/.test(stream.user_login) &&
               (stream.user_login.toLowerCase().includes(trimmedQuery.toLowerCase()) ||
                stream.user_name.toLowerCase().includes(trimmedQuery.toLowerCase()) ||
                stream.title?.toLowerCase().includes(trimmedQuery.toLowerCase()));
      });
      
      // Add metadata to search results
      const enhancedStreams = validStreams.map(stream => ({
        ...stream,
        fetchedAt: new Date().toISOString(),
        searchQuery: trimmedQuery,
        embedUrl: `https://player.twitch.tv/?channel=${stream.user_login}&parent=localhost&parent=expo.dev&muted=true&autoplay=true&controls=false`,
        thumbnailUrl: stream.thumbnail_url ? 
          stream.thumbnail_url.replace('{width}', '320').replace('{height}', '180') :
          `https://static-cdn.jtvnw.net/previews-ttv/live_user_${stream.user_login}-320x180.jpg`
      }));
      
      setStreams(enhancedStreams);
      setHasMore(false);
      
      // Cache search results
      setCachedStreams({
        data: enhancedStreams,
        timestamp: Date.now(),
        query: trimmedQuery,
        gameId: undefined
      });
      
      console.log(`✅ Search returned ${enhancedStreams.length} results`);
      if (enhancedStreams.length === 0) {
        setError(`No live streams found for "${trimmedQuery}". Try a different search term.`);
        console.log('❌ No live streams found for search query');
      } else {
        console.log('🎯 Search results preview:', {
          total: enhancedStreams.length,
          topResult: {
            streamer: enhancedStreams[0].user_name,
            title: enhancedStreams[0].title,
            viewers: enhancedStreams[0].viewer_count
          }
        });
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Search failed';
      setError(`Search failed: ${errorMessage}`);
      console.error('❌ Error searching streams:', {
        query: trimmedQuery,
        error: errorMessage
      });
      
      // Try to provide helpful error messages
      if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
        setError('Too many searches. Please wait a moment and try again.');
      } else if (errorMessage.includes('Network')) {
        setError('Network error. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [cachedStreams]);

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