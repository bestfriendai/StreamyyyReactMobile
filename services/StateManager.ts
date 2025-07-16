import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
interface Stream {
  id: string;
  user_name: string;
  user_login: string;
  game_name: string;
  title: string;
  viewer_count: number;
  thumbnail_url: string;
  started_at: string;
  language: string;
  is_mature: boolean;
}

interface User {
  id: string;
  email: string;
  username: string;
  avatar_url: string;
  created_at: string;
  is_premium: boolean;
}

interface Layout {
  id: string;
  name: string;
  type: 'grid' | 'list' | 'custom';
  configuration: any;
  is_default: boolean;
}

interface AppState {
  isLoading: boolean;
  error: string | null;
  theme: 'light' | 'dark' | 'system';
  language: string;
  version: string;
}

interface GlobalState {
  user: User | null;
  streams: {
    active: Stream[];
    favorites: Stream[];
    recent: Stream[];
    lastUpdated: number;
  };
  layouts: Layout[];
  app: AppState;
  temp: {
    searchQuery: string;
    selectedStreams: string[];
    isConnected: boolean;
  };
}

// Default states
const defaultUser: User | null = null;
const defaultStreams = {
  active: [],
  favorites: [],
  recent: [],
  lastUpdated: 0,
};
const defaultLayouts: Layout[] = [];
const defaultAppState: AppState = {
  isLoading: false,
  error: null,
  theme: 'system',
  language: 'en',
  version: '1.0.0',
};
const defaultTempState = {
  searchQuery: '',
  selectedStreams: [],
  isConnected: true,
};

// Create the store
const useGlobalStore = create<GlobalState>()(
  persist(
    (set, get) => ({
      user: defaultUser,
      streams: defaultStreams,
      layouts: defaultLayouts,
      app: defaultAppState,
      temp: defaultTempState,
      
      // Actions would go here
    }),
    {
      name: 'global-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        streams: state.streams,
        layouts: state.layouts,
        app: state.app,
        // Don't persist temp state
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Reset temporary state after rehydration
          state.temp = defaultTempState;
          state.app.isLoading = false;
          state.app.error = null;
        }
      },
    }
  )
);

// Optimized selectors
export const useUser = () => useGlobalStore(state => state.user);
export const useActiveStreams = () => useGlobalStore(state => state.streams.active);
export const useFavoriteStreams = () => useGlobalStore(state => state.streams.favorites);
export const useRecentStreams = () => useGlobalStore(state => state.streams.recent);
export const useLayouts = () => useGlobalStore(state => state.layouts);
export const useAppTheme = () => useGlobalStore(state => state.app.theme);
export const useAppLoading = () => useGlobalStore(state => state.app.isLoading);
export const useAppError = () => useGlobalStore(state => state.app.error);
export const useSearchQuery = () => useGlobalStore(state => state.temp.searchQuery);
export const useSelectedStreams = () => useGlobalStore(state => state.temp.selectedStreams);
export const useIsConnected = () => useGlobalStore(state => state.temp.isConnected);

// Performance monitoring
if (__DEV__) {
  useGlobalStore.subscribe(
    (state) => state.streams.active.length,
    (activeStreamsCount) => {
      console.log('Active streams count changed', { count: activeStreamsCount });
    }
  );

  useGlobalStore.subscribe(
    (state) => state.app.error,
    (error) => {
      if (error) {
        console.error('Global app error', error);
      }
    }
  );
}

export default useGlobalStore;