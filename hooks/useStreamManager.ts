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
    console.log('🔄 useStreamManager useEffect triggered, loading data...');
    loadData();
  }, [user]);

  // Also load data on component mount (independent of user)
  useEffect(() => {
    console.log('🚀 useStreamManager mounted, loading initial data...');
    loadInitialData();
  }, []);

  // Load initial data (activeStreams and settings) independent of user
  const loadInitialData = async () => {
    try {
      console.log('📂 Loading initial data (activeStreams and settings)...');
      
      // Load active streams from local storage (these are temporary)
      const activeStreamsData = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_STREAMS);
      if (activeStreamsData) {
        const parsedStreams = JSON.parse(activeStreamsData);
        setActiveStreams(parsedStreams);
        console.log('✅ Loaded active streams from storage:', parsedStreams.length);
      } else {
        console.log('ℹ️ No active streams in storage');
      }
      
      // Load settings from local storage
      const settingsData = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (settingsData) {
        setSettings(JSON.parse(settingsData));
        console.log('✅ Loaded settings from storage');
      } else {
        console.log('ℹ️ Using default settings');
      }
    } catch (error) {
      console.error('❌ Error loading initial data:', error);
    }
  };

  const loadData = async () => {
    await withErrorHandling(async () => {
      setLoading(true);
      logDebug('Loading stream manager data', { userId: user?.id });
      
      // Load active streams from local storage (these are temporary)
      const activeStreamsData = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_STREAMS);
      if (activeStreamsData) {
        const parsedStreams = JSON.parse(activeStreamsData);
        setActiveStreams(parsedStreams);
        console.log('✅ Reloaded active streams:', parsedStreams.length);
        logDebug('Loaded active streams', { count: parsedStreams.length });
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

  // Add stream to active streams with simple validation
  const addStream = useCallback(async (stream: TwitchStream) => {
    try {
      console.log('🎬 useStreamManager.addStream called:', {
        streamId: stream.id,
        streamName: stream.user_name,
        currentActiveCount: activeStreams.length
      });
      
      logDebug('Adding stream to active streams', { streamId: stream.id, streamName: stream.user_name });
      
      // Basic validation
      if (!stream.user_login || !stream.user_name || !stream.id) {
        console.log('❌ Validation failed: Missing required fields');
        return { success: false, message: 'Invalid stream data' };
      }
      
      // Check if stream is already active
      const isDuplicate = activeStreams.some(s => s.id === stream.id || s.user_login === stream.user_login);
      if (isDuplicate) {
        console.log('❌ Stream already active');
        return { success: false, message: 'Stream already in multi-view' };
      }
      
      // Simple stream limit
      if (activeStreams.length >= 6) {
        console.log('❌ Stream limit reached:', activeStreams.length);
        return { success: false, message: 'Maximum 6 streams allowed' };
      }
      
      const newActiveStreams = [...activeStreams, stream];
      console.log('✅ Adding stream, new total will be:', newActiveStreams.length);
      
      setActiveStreams(newActiveStreams);
      await saveActiveStreams(newActiveStreams);
      
      logDebug('Stream added successfully', { 
        streamId: stream.id, 
        totalStreams: newActiveStreams.length
      });
      
      console.log('✅ Stream added successfully:', stream.user_name);
      
      return { 
        success: true, 
        message: `${stream.user_name} added to multi-view`
      };
    } catch (error) {
      console.error('❌ Error adding stream:', error);
      return { success: false, message: 'Failed to add stream' };
    }
  }, [activeStreams, saveActiveStreams]);

  // Helper function to determine max streams based on device capabilities
  const getMaxStreamsForDevice = useCallback(() => {
    // Check available memory and processing power
    const memory = (navigator as any)?.deviceMemory || 4; // Default to 4GB
    const connection = (navigator as any)?.connection?.effectiveType || '4g';
    
    // Determine max streams based on device capabilities
    if (memory >= 8 && connection === '4g') {
      return 6; // High-end devices
    } else if (memory >= 4 && (connection === '4g' || connection === '3g')) {
      return 4; // Mid-range devices
    } else {
      return 2; // Low-end devices or poor connection
    }
  }, []);

  // Remove stream from active streams
  const removeStream = useCallback(async (streamId: string) => {
    const newActiveStreams = activeStreams.filter(s => s.id !== streamId);
    setActiveStreams(newActiveStreams);
    await saveActiveStreams(newActiveStreams);
    
    logDebug('Stream removed successfully', { 
      streamId, 
      remainingStreams: newActiveStreams.length 
    });
  }, [activeStreams, saveActiveStreams]);

  // Clear all active streams
  const clearAllStreams = useCallback(async () => {
    setActiveStreams([]);
    await saveActiveStreams([]);
    logDebug('All streams cleared successfully');
  }, [activeStreams, saveActiveStreams]);

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

  // Force reload function for debugging
  const forceReload = useCallback(async () => {
    console.log('🔄 Force reloading stream manager data...');
    await loadInitialData();
  }, []);

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
    forceReload,
  };
}