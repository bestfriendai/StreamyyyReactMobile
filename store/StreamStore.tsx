import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Stream {
  id: string;
  user_name: string;
  game_name: string;
  viewer_count: number;
  thumbnail_url: string;
  title: string;
  is_live: boolean;
}

interface StreamStore {
  activeStreams: Stream[];
  favorites: Stream[];
  addStream: (stream: Stream) => void;
  removeStream: (streamId: string) => void;
  addToFavorites: (stream: Stream) => void;
  removeFromFavorites: (streamId: string) => void;
  isStreamActive: (streamId: string) => boolean;
  isFavorite: (streamId: string) => boolean;
}

const StreamContext = createContext<StreamStore | undefined>(undefined);

export const useStreamStore = () => {
  const context = useContext(StreamContext);
  if (!context) {
    throw new Error('useStreamStore must be used within a StreamProvider');
  }
  return context;
};

interface StreamProviderProps {
  children: ReactNode;
}

export const StreamProvider: React.FC<StreamProviderProps> = ({ children }) => {
  const [activeStreams, setActiveStreams] = useState<Stream[]>([]);
  const [favorites, setFavorites] = useState<Stream[]>([]);

  const addStream = (stream: Stream) => {
    setActiveStreams(prev => {
      if (prev.find(s => s.id === stream.id)) {
        return prev; // Already exists
      }
      return [...prev, stream];
    });
  };

  const removeStream = (streamId: string) => {
    setActiveStreams(prev => prev.filter(s => s.id !== streamId));
  };

  const addToFavorites = (stream: Stream) => {
    setFavorites(prev => {
      if (prev.find(s => s.id === stream.id)) {
        return prev; // Already exists
      }
      return [...prev, stream];
    });
  };

  const removeFromFavorites = (streamId: string) => {
    setFavorites(prev => prev.filter(s => s.id !== streamId));
  };

  const isStreamActive = (streamId: string) => {
    return activeStreams.some(s => s.id === streamId);
  };

  const isFavorite = (streamId: string) => {
    return favorites.some(s => s.id === streamId);
  };

  const value: StreamStore = {
    activeStreams,
    favorites,
    addStream,
    removeStream,
    addToFavorites,
    removeFromFavorites,
    isStreamActive,
    isFavorite,
  };

  return (
    <StreamContext.Provider value={value}>
      {children}
    </StreamContext.Provider>
  );
};