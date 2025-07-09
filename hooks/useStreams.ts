import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stream, StreamLayout } from '@/types/stream';

const STORAGE_KEYS = {
  ACTIVE_STREAMS: 'active_streams',
  FAVORITES: 'favorite_streams',
  LAYOUTS: 'stream_layouts',
};

export function useStreams() {
  const [activeStreams, setActiveStreams] = useState<Stream[]>([]);
  const [favorites, setFavorites] = useState<Stream[]>([]);
  const [layouts, setLayouts] = useState<StreamLayout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredData();
  }, []);

  const loadStoredData = async () => {
    try {
      const [storedStreams, storedFavorites, storedLayouts] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_STREAMS),
        AsyncStorage.getItem(STORAGE_KEYS.FAVORITES),
        AsyncStorage.getItem(STORAGE_KEYS.LAYOUTS),
      ]);

      if (storedStreams) setActiveStreams(JSON.parse(storedStreams));
      if (storedFavorites) setFavorites(JSON.parse(storedFavorites));
      if (storedLayouts) setLayouts(JSON.parse(storedLayouts));
    } catch (error) {
      console.error('Error loading stored data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addStream = async (stream: Stream) => {
    const updatedStreams = [...activeStreams, stream];
    setActiveStreams(updatedStreams);
    await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_STREAMS, JSON.stringify(updatedStreams));
  };

  const removeStream = async (streamId: string) => {
    const updatedStreams = activeStreams.filter(stream => stream.id !== streamId);
    setActiveStreams(updatedStreams);
    await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_STREAMS, JSON.stringify(updatedStreams));
  };

  const toggleFavorite = async (stream: Stream) => {
    const isFavorite = favorites.some(fav => fav.id === stream.id);
    const updatedFavorites = isFavorite
      ? favorites.filter(fav => fav.id !== stream.id)
      : [...favorites, stream];
    
    setFavorites(updatedFavorites);
    await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(updatedFavorites));
  };

  const isFavorite = (streamId: string) => {
    return favorites.some(fav => fav.id === streamId);
  };

  const saveLayout = async (layout: StreamLayout) => {
    const updatedLayouts = [...layouts, layout];
    setLayouts(updatedLayouts);
    await AsyncStorage.setItem(STORAGE_KEYS.LAYOUTS, JSON.stringify(updatedLayouts));
  };

  return {
    activeStreams,
    favorites,
    layouts,
    loading,
    addStream,
    removeStream,
    toggleFavorite,
    isFavorite,
    saveLayout,
  };
}