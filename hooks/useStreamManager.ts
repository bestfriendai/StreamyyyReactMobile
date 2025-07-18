import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TwitchStream } from '@/services/twitchApi';

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
  const [activeStreams, setActiveStreams] = useState<TwitchStream[]>([]);
  const [favorites, setFavorites] = useState<TwitchStream[]>([]);
  const [settings, setSettings] = useState<StreamSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [isReloading, setIsReloading] = useState(false);


  // Load stored data on mount
  useEffect(() => {
    loadStoredData();
  }, []);

  const loadStoredData = async () => {
    if (isReloading) {
      return;
    }
    
    try {
      setIsReloading(true);
      const [storedStreams, storedFavorites, storedSettings] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_STREAMS),
        AsyncStorage.getItem(STORAGE_KEYS.FAVORITES),
        AsyncStorage.getItem(STORAGE_KEYS.SETTINGS),
      ]);

      if (storedStreams) {
        const parsedStreams = JSON.parse(storedStreams);
        setActiveStreams(parsedStreams);
      } else {
        setActiveStreams([]);
      }
      if (storedFavorites) {
        setFavorites(JSON.parse(storedFavorites));
      }
      if (storedSettings) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(storedSettings) });
      }
    } catch (error) {
      console.error('Error loading stored data:', error);
    } finally {
      setLoading(false);
      setIsReloading(false);
    }
  };

  const addStream = useCallback(async (stream: TwitchStream): Promise<{ success: boolean; message: string }> => {
    try {
      console.log('🎯 ADD STREAM CALLED - Stream:', stream.user_name, 'ID:', stream.id);

      // Check current state first
      const currentStreams = await new Promise<TwitchStream[]>((resolve) => {
        setActiveStreams(streams => {
          console.log('🎯 CURRENT STREAMS IN STATE:', streams.length, 'streams:', streams.map(s => s.user_name));
          resolve(streams);
          return streams;
        });
      });

      console.log('🎯 CHECKING CONDITIONS - Current streams:', currentStreams.length);

      const isAlreadyActive = currentStreams.some(s => s.id === stream.id);
      if (isAlreadyActive) {
        console.log('❌ STREAM ALREADY ACTIVE:', stream.user_name);
        return { success: false, message: 'Stream is already in your multi-view' };
      }

      if (currentStreams.length >= 6) {
        console.log('❌ MAX STREAMS REACHED:', currentStreams.length);
        return { success: false, message: 'Maximum of 6 streams allowed' };
      }

      const updatedStreams = [...currentStreams, stream];
      console.log('🎯 UPDATING STATE - New streams array:', updatedStreams.map(s => s.user_name));

      // Update state and storage
      setActiveStreams(updatedStreams);

      try {
        await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_STREAMS, JSON.stringify(updatedStreams));
        console.log('✅ STREAM ADDED SUCCESSFULLY:', stream.user_name, 'Total streams:', updatedStreams.length);
      } catch (storageError) {
        console.error('❌ Error saving to storage:', storageError);
        // Don't fail the operation if storage fails
      }

      return { success: true, message: `${stream.user_name} added to multi-view` };
    } catch (error) {
      console.error('❌ ERROR ADDING STREAM:', error);
      return { success: false, message: 'Failed to add stream' };
    }
  }, []);

  const removeStream = useCallback(async (streamId: string) => {
    try {
      setActiveStreams(currentStreams => {
        const updatedStreams = currentStreams.filter(stream => stream.id !== streamId);
        
        AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_STREAMS, JSON.stringify(updatedStreams))
          .catch(error => console.error('Error removing stream:', error));
        
        return updatedStreams;
      });
    } catch (error) {
      console.error('Error removing stream:', error);
    }
  }, []);

  const toggleFavorite = useCallback(async (stream: TwitchStream) => {
    const isFavorite = favorites.some(fav => fav.user_id === stream.user_id);
    
    const updatedFavorites = isFavorite
      ? favorites.filter(fav => fav.user_id !== stream.user_id)
      : [...favorites, stream];
    
    setFavorites(updatedFavorites);
    
    AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(updatedFavorites)).catch(error => {
      console.error('Error saving favorites to storage:', error);
    });
  }, [favorites]);

  const removeFavorite = useCallback(async (streamId: string) => {
    try {
      setFavorites(currentFavorites => {
        // Use user_id for consistency with toggleFavorite function
        const updatedFavorites = currentFavorites.filter(fav => fav.user_id !== streamId && fav.id !== streamId);
        
        AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(updatedFavorites))
          .catch(error => console.error('Error removing favorite:', error));
        
        return updatedFavorites;
      });
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  }, []);

  const addToMultiView = useCallback(async (streamData: any) => {
    console.log('🚀 ADD TO MULTI-VIEW CALLED - Data:', streamData);

    // Convert the stream data to TwitchStream format
    const stream: TwitchStream = {
      id: streamData.id,
      user_id: streamData.id, // For favorites, use the same ID for both
      user_login: streamData.username || streamData.user_login,
      user_name: streamData.username || streamData.user_name,
      game_id: streamData.game_id || '',
      game_name: streamData.game || streamData.game_name || '',
      type: 'live',
      title: streamData.title || '',
      viewer_count: streamData.viewers || streamData.viewer_count || 0,
      started_at: streamData.started_at || new Date().toISOString(),
      language: streamData.language || 'en',
      thumbnail_url: streamData.thumbnail || streamData.thumbnail_url || '',
      tag_ids: streamData.tag_ids || [],
      is_mature: streamData.is_mature || false
    };

    console.log('🚀 CONVERTED STREAM DATA:', stream);
    const result = await addStream(stream);
    console.log('🚀 ADD TO MULTI-VIEW RESULT:', result);
    return result;
  }, [addStream]);

  const isFavorite = useCallback((userId: string) => {
    return favorites.some(fav => fav.user_id === userId);
  }, [favorites]);

  const isStreamActive = useCallback((streamId: string) => {
    const isActive = activeStreams.some(stream => stream.id === streamId);
    console.log('🔍 IS STREAM ACTIVE CHECK - Stream ID:', streamId, 'Active:', isActive, 'Total active streams:', activeStreams.length);
    return isActive;
  }, [activeStreams]);

  const updateSettings = useCallback(async (newSettings: Partial<StreamSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    
    // Non-blocking storage update
    AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updatedSettings)).catch(error => {
      console.error('Error saving settings to storage:', error);
    });
  }, [settings]);

  const clearAllStreams = useCallback(async () => {
    try {
      console.log('🧹 CLEARING ALL STREAMS - Before clear, activeStreams length:', activeStreams.length);
      setActiveStreams([]);
      await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_STREAMS);
      console.log('🧹 CLEARED ALL STREAMS - Storage cleared, state set to empty array');
    } catch (error) {
      console.error('❌ Error clearing streams from storage:', error);
    }
  }, [activeStreams.length]);

  const forceReload = useCallback(() => {
    loadStoredData();
  }, []);

  return {
    activeStreams,
    favorites,
    settings,
    loading,
    addStream,
    removeStream,
    toggleFavorite,
    removeFavorite,
    addToMultiView,
    isFavorite,
    isStreamActive,
    updateSettings,
    clearAllStreams,
    forceReload,
  };
}