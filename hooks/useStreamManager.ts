import React, { useState, useEffect, useCallback } from 'react';
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
      return new Promise((resolve) => {
        setActiveStreams(currentStreams => {
          const isAlreadyActive = currentStreams.some(s => s.id === stream.id);
          if (isAlreadyActive) {
            resolve({ success: false, message: 'Stream is already in your multi-view' });
            return currentStreams;
          }

          if (currentStreams.length >= 6) {
            resolve({ success: false, message: 'Maximum of 6 streams allowed' });
            return currentStreams;
          }

          const updatedStreams = [...currentStreams, stream];
          
          // Save to storage
          AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_STREAMS, JSON.stringify(updatedStreams))
            .then(() => {
              resolve({ success: true, message: `${stream.user_name} added to multi-view` });
            })
            .catch(error => {
              console.error('Error saving to storage:', error);
              resolve({ success: false, message: 'Failed to add stream' });
            });
          
          return updatedStreams;
        });
      });
    } catch (error) {
      console.error('Error adding stream:', error);
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

  const isFavorite = useCallback((userId: string) => {
    return favorites.some(fav => fav.user_id === userId);
  }, [favorites]);

  const isStreamActive = useCallback((streamId: string) => {
    return activeStreams.some(stream => stream.id === streamId);
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
      setActiveStreams([]);
      await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_STREAMS);
    } catch (error) {
      console.error('Error clearing streams from storage:', error);
    }
  }, []);

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
    isFavorite,
    isStreamActive,
    updateSettings,
    clearAllStreams,
    forceReload,
  };
}