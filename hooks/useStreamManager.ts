import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TwitchStream } from '@/services/twitchApi';
import { useAuth } from '@/contexts/AuthContext';
import { databaseService } from '@/services/databaseService';
import { logError, logDebug, withErrorHandling } from '@/utils/errorHandler';

const STORAGE_KEYS = {
  ACTIVE_STREAMS: 'streamyyy_active_streams',
  FAVORITES: 'streamyyy_favorites',
  SETTINGS: 'streamyyy_settings',
};

interface StreamSettings {
  defaultVolume: number;
  autoPlay: boolean;
  chatEnabled: boolean;
  qualityPreference: 'auto' | 'source' | '720p' | '480p';
}

const DEFAULT_SETTINGS: StreamSettings = {
  defaultVolume: 0.7,
  autoPlay: true,
  chatEnabled: true,
  qualityPreference: 'auto',
};

export function useStreamManager() {
  const { user } = useAuth();
  const [activeStreams, setActiveStreams] = useState<TwitchStream[]>([]);
  const [favorites, setFavorites] = useState<TwitchStream[]>([]);
  const [settings, setSettings] = useState<StreamSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  // Load data from storage and database
  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    await withErrorHandling(async () => {
      setLoading(true);
      logDebug('Loading stream manager data', { userId: user?.id });
      
      // Load active streams from local storage (these are temporary)
      const activeStreamsData = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_STREAMS);
      if (activeStreamsData) {
        setActiveStreams(JSON.parse(activeStreamsData));
        logDebug('Loaded active streams', { count: JSON.parse(activeStreamsData).length });
      }
      
      // Load settings from local storage
      const settingsData = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (settingsData) {
        setSettings(JSON.parse(settingsData));
        logDebug('Loaded settings from storage');
      }
      
      // Load favorites from database if user is authenticated
      if (user) {
        const userFavorites = await databaseService.getFavoriteStreams(user.id);
        setFavorites(userFavorites);
        logDebug('Loaded favorites from database', { count: userFavorites.length });
      } else {
        // Load favorites from local storage if not authenticated
        const favoritesData = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITES);
        if (favoritesData) {
          setFavorites(JSON.parse(favoritesData));
          logDebug('Loaded favorites from storage', { count: JSON.parse(favoritesData).length });
        }
      }
    }, { component: 'useStreamManager', action: 'loadData' });
    
    setLoading(false);
  };

  // Save active streams to local storage
  const saveActiveStreams = useCallback(async (streams: TwitchStream[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_STREAMS, JSON.stringify(streams));
    } catch (error) {
      console.error('Error saving active streams:', error);
    }
  }, []);

  // Save favorites to database or local storage
  const saveFavorites = useCallback(async (favs: TwitchStream[]) => {
    try {
      if (user) {
        // Save to database - handled by individual add/remove operations
        return;
      } else {
        // Save to local storage if not authenticated
        await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favs));
      }
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  }, [user]);

  // Save settings to local storage
  const saveSettings = useCallback(async (newSettings: StreamSettings) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }, []);

  // Add stream to active streams with validation
  const addStream = useCallback(async (stream: TwitchStream) => {
    const result = await withErrorHandling(async () => {
      logDebug('Adding stream to active streams', { streamId: stream.id, streamName: stream.user_name });
      
      // Validate stream object
      if (!stream.user_login || !stream.user_name) {
        logDebug('Invalid stream object', { stream });
        return { success: false, message: 'Invalid stream data' };
      }
      
      // Check if stream is already active
      if (activeStreams.some(s => s.id === stream.id)) {
        logDebug('Stream already active', { streamId: stream.id });
        return { success: false, message: 'Stream is already in multi-view' };
      }
      
      // Check stream limit (max 4 streams for performance)
      if (activeStreams.length >= 4) {
        logDebug('Stream limit reached', { currentCount: activeStreams.length });
        return { success: false, message: 'Maximum 4 streams allowed in multi-view' };
      }
      
      // Add stream health check metadata
      const enhancedStream = {
        ...stream,
        addedAt: new Date().toISOString(),
        loadAttempts: 0,
        lastError: null
      };
      
      const newActiveStreams = [...activeStreams, enhancedStream];
      setActiveStreams(newActiveStreams);
      await saveActiveStreams(newActiveStreams);
      
      logDebug('Stream added successfully', { streamId: stream.id, totalStreams: newActiveStreams.length });
      return { success: true, message: 'Stream added successfully' };
    }, { component: 'useStreamManager', action: 'addStream', additionalData: { streamId: stream.id } });
    
    return result || { success: false, message: 'Failed to add stream' };
  }, [activeStreams, saveActiveStreams]);

  // Remove stream from active streams
  const removeStream = useCallback(async (streamId: string) => {
    const newActiveStreams = activeStreams.filter(s => s.id !== streamId);
    setActiveStreams(newActiveStreams);
    await saveActiveStreams(newActiveStreams);
  }, [activeStreams, saveActiveStreams]);

  // Clear all active streams
  const clearAllStreams = useCallback(async () => {
    setActiveStreams([]);
    await saveActiveStreams([]);
  }, [saveActiveStreams]);

  // Toggle favorite stream
  const toggleFavorite = useCallback(async (stream: TwitchStream) => {
    const isFav = favorites.some(fav => fav.user_id === stream.user_id);
    
    if (isFav) {
      // Remove from favorites
      const newFavorites = favorites.filter(fav => fav.user_id !== stream.user_id);
      setFavorites(newFavorites);
      
      if (user) {
        await databaseService.removeFavoriteStream(user.id, stream.user_id);
      } else {
        await saveFavorites(newFavorites);
      }
    } else {
      // Add to favorites
      const newFavorites = [...favorites, stream];
      setFavorites(newFavorites);
      
      if (user) {
        await databaseService.addFavoriteStream(user.id, stream);
      } else {
        await saveFavorites(newFavorites);
      }
    }
  }, [favorites, user, saveFavorites]);

  // Check if stream is favorite
  const isFavorite = useCallback((userId: string) => {
    return favorites.some(fav => fav.user_id === userId);
  }, [favorites]);

  // Check if stream is active
  const isStreamActive = useCallback((streamId: string) => {
    return activeStreams.some(stream => stream.id === streamId);
  }, [activeStreams]);

  // Update settings
  const updateSettings = useCallback(async (newSettings: Partial<StreamSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    await saveSettings(updatedSettings);
  }, [settings, saveSettings]);

  // Stream health monitoring
  const updateStreamHealth = useCallback(async (streamId: string, error: string | null) => {
    const updatedStreams = activeStreams.map(stream => {
      if (stream.id === streamId) {
        return {
          ...stream,
          loadAttempts: (stream.loadAttempts || 0) + 1,
          lastError: error,
          lastUpdated: new Date().toISOString()
        };
      }
      return stream;
    });
    
    setActiveStreams(updatedStreams);
    await saveActiveStreams(updatedStreams);
  }, [activeStreams, saveActiveStreams]);
  
  // Get stream health status
  const getStreamHealth = useCallback((streamId: string) => {
    const stream = activeStreams.find(s => s.id === streamId);
    if (!stream) return null;
    
    return {
      loadAttempts: stream.loadAttempts || 0,
      lastError: stream.lastError || null,
      isHealthy: (stream.loadAttempts || 0) < 3 && !stream.lastError
    };
  }, [activeStreams]);

  return {
    activeStreams,
    favorites,
    settings,
    loading,
    addStream,
    removeStream,
    clearAllStreams,
    toggleFavorite,
    isFavorite,
    isStreamActive,
    updateSettings,
     updateStreamHealth,
     getStreamHealth,
   };
}