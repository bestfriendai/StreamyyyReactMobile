import { create } from 'zustand';
import { persist, createJSONStorage, subscribeWithSelector } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TwitchStream } from '@/services/twitchApi';
import { logDebug, logError } from '@/utils/errorHandler';

// Simplified state interfaces
export interface AppTheme {
  mode: 'light' | 'dark' | 'system';
  primaryColor: string;
  accentColor: string;
}

export interface UserPreferences {
  language: string;
  region: string;
  notifications: {
    streamStart: boolean;
    streamEnd: boolean;
    favoriteOnline: boolean;
    appUpdates: boolean;
  };
  privacy: {
    analyticsEnabled: boolean;
    crashReporting: boolean;
  };
  accessibility: {
    reduceMotion: boolean;
    fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  };
}

export interface AppMetrics {
  totalWatchTime: number;
  streamsWatched: number;
  favoriteStreamers: number;
  layoutsCreated: number;
  lastActiveDate: string;
}

export interface TemporaryState {
  currentToast: {
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
  } | null;
  isConnected: boolean;
  backgroundMode: boolean;
  pipMode: boolean;
  currentRoute: string;
  searchQuery: string;
  filters: {
    category: string[];
    language: string[];
    viewerCount: { min: number; max: number };
  };
}

// Main state interface
export interface GlobalAppState {
  // User & Auth
  user: {
    id: string | null;
    email: string | null;
    name: string | null;
    avatar: string | null;
    subscription: {
      tier: 'free' | 'pro' | 'premium';
      status: 'active' | 'inactive' | 'cancelled' | 'past_due';
      expiresAt: string | null;
    };
    preferences: UserPreferences;
  };

  // Streams & Content
  streams: {
    active: TwitchStream[];
    favorites: TwitchStream[];
    recent: TwitchStream[];
    blocked: string[];
  };

  // Layouts
  layouts: {
    saved: Array<{
      id: string;
      name: string;
      streams: TwitchStream[];
      layout: 'grid' | 'stacked' | 'pip' | 'focus';
      gridColumns: number;
      createdAt: string;
      isDefault: boolean;
    }>;
    current: string | null;
  };

  // App State
  app: {
    theme: AppTheme;
    isLoading: boolean;
    error: string | null;
    version: string;
    buildNumber: string;
    firstLaunch: boolean;
    onboardingCompleted: boolean;
    metrics: AppMetrics;
  };

  // Temporary state (not persisted)
  temp: TemporaryState;

  // Actions
  setUser: (user: Partial<GlobalAppState['user']>) => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  updateSubscription: (subscription: Partial<GlobalAppState['user']['subscription']>) => void;

  // Stream actions
  addStream: (stream: TwitchStream) => void;
  removeStream: (streamId: string) => void;
  toggleFavorite: (stream: TwitchStream) => void;
  blockUser: (userId: string) => void;
  unblockUser: (userId: string) => void;
  addToRecent: (stream: TwitchStream) => void;
  clearRecent: () => void;

  // Layout actions
  saveLayout: (layout: Omit<GlobalAppState['layouts']['saved'][0], 'id' | 'createdAt'>) => void;
  deleteLayout: (layoutId: string) => void;
  setCurrentLayout: (layoutId: string | null) => void;

  // App actions
  setTheme: (theme: Partial<AppTheme>) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  completeOnboarding: () => void;
  incrementMetric: (metric: keyof AppMetrics) => void;

  // Temporary state actions
  showToast: (message: string, type: TemporaryState['currentToast']['type'], duration?: number) => void;
  hideToast: () => void;
  setConnectionStatus: (isConnected: boolean) => void;
  setBackgroundMode: (backgroundMode: boolean) => void;
  setPipMode: (pipMode: boolean) => void;
  setCurrentRoute: (route: string) => void;
  setSearchQuery: (query: string) => void;
  updateFilters: (filters: Partial<TemporaryState['filters']>) => void;

  // Utility actions
  reset: () => void;
}

// Default values
const defaultPreferences: UserPreferences = {
  language: 'en',
  region: 'US',
  notifications: {
    streamStart: true,
    streamEnd: false,
    favoriteOnline: true,
    appUpdates: true,
  },
  privacy: {
    analyticsEnabled: true,
    crashReporting: true,
  },
  accessibility: {
    reduceMotion: false,
    fontSize: 'medium',
  },
};

const defaultTheme: AppTheme = {
  mode: 'dark',
  primaryColor: '#8B5CF6',
  accentColor: '#A855F7',
};

const defaultMetrics: AppMetrics = {
  totalWatchTime: 0,
  streamsWatched: 0,
  favoriteStreamers: 0,
  layoutsCreated: 0,
  lastActiveDate: new Date().toISOString(),
};

const defaultTempState: TemporaryState = {
  currentToast: null,
  isConnected: true,
  backgroundMode: false,
  pipMode: false,
  currentRoute: '/(tabs)',
  searchQuery: '',
  filters: {
    category: [],
    language: [],
    viewerCount: { min: 0, max: 1000000 },
  },
};

// Create the store
export const useGlobalStore = create<GlobalAppState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial state
        user: {
          id: null,
          email: null,
          name: null,
          avatar: null,
          subscription: {
            tier: 'free',
            status: 'inactive',
            expiresAt: null,
          },
          preferences: defaultPreferences,
        },
        
        streams: {
          active: [],
          favorites: [],
          recent: [],
          blocked: [],
        },
        
        layouts: {
          saved: [],
          current: null,
        },
        
        app: {
          theme: defaultTheme,
          isLoading: false,
          error: null,
          version: '1.0.0',
          buildNumber: '1',
          firstLaunch: true,
          onboardingCompleted: false,
          metrics: defaultMetrics,
        },
        
        temp: defaultTempState,

        // Actions
        setUser: (user) =>
          set((state) => ({
            ...state,
            user: { ...state.user, ...user },
          })),

        updatePreferences: (preferences) =>
          set((state) => ({
            ...state,
            user: {
              ...state.user,
              preferences: { ...state.user.preferences, ...preferences },
            },
          })),

        updateSubscription: (subscription) =>
          set((state) => ({
            ...state,
            user: {
              ...state.user,
              subscription: { ...state.user.subscription, ...subscription },
            },
          })),

        // Stream actions
        addStream: (stream) =>
          set((state) => {
            if (state.streams.active.find(s => s.id === stream.id)) {
              return state;
            }
            return {
              ...state,
              streams: {
                ...state.streams,
                active: [...state.streams.active, stream],
                recent: [stream, ...state.streams.recent.filter(s => s.id !== stream.id)].slice(0, 20),
              },
              app: {
                ...state.app,
                metrics: {
                  ...state.app.metrics,
                  streamsWatched: state.app.metrics.streamsWatched + 1,
                  lastActiveDate: new Date().toISOString(),
                },
              },
            };
          }),

        removeStream: (streamId) =>
          set((state) => ({
            ...state,
            streams: {
              ...state.streams,
              active: state.streams.active.filter(s => s.id !== streamId),
            },
          })),

        toggleFavorite: (stream) =>
          set((state) => {
            const isFavorite = state.streams.favorites.find(s => s.user_id === stream.user_id);
            if (isFavorite) {
              return {
                ...state,
                streams: {
                  ...state.streams,
                  favorites: state.streams.favorites.filter(s => s.user_id !== stream.user_id),
                },
              };
            } else {
              return {
                ...state,
                streams: {
                  ...state.streams,
                  favorites: [...state.streams.favorites, stream],
                },
                app: {
                  ...state.app,
                  metrics: {
                    ...state.app.metrics,
                    favoriteStreamers: state.app.metrics.favoriteStreamers + 1,
                    lastActiveDate: new Date().toISOString(),
                  },
                },
              };
            }
          }),

        blockUser: (userId) =>
          set((state) => ({
            ...state,
            streams: {
              ...state.streams,
              blocked: [...state.streams.blocked, userId],
              active: state.streams.active.filter(s => s.user_id !== userId),
              favorites: state.streams.favorites.filter(s => s.user_id !== userId),
            },
          })),

        unblockUser: (userId) =>
          set((state) => ({
            ...state,
            streams: {
              ...state.streams,
              blocked: state.streams.blocked.filter(id => id !== userId),
            },
          })),

        addToRecent: (stream) =>
          set((state) => ({
            ...state,
            streams: {
              ...state.streams,
              recent: [stream, ...state.streams.recent.filter(s => s.id !== stream.id)].slice(0, 20),
            },
          })),

        clearRecent: () =>
          set((state) => ({
            ...state,
            streams: {
              ...state.streams,
              recent: [],
            },
          })),

        // Layout actions
        saveLayout: (layout) =>
          set((state) => {
            const newLayout = {
              ...layout,
              id: Date.now().toString(),
              createdAt: new Date().toISOString(),
            };
            return {
              ...state,
              layouts: {
                ...state.layouts,
                saved: [...state.layouts.saved, newLayout],
              },
              app: {
                ...state.app,
                metrics: {
                  ...state.app.metrics,
                  layoutsCreated: state.app.metrics.layoutsCreated + 1,
                  lastActiveDate: new Date().toISOString(),
                },
              },
            };
          }),

        deleteLayout: (layoutId) =>
          set((state) => ({
            ...state,
            layouts: {
              ...state.layouts,
              saved: state.layouts.saved.filter(l => l.id !== layoutId),
              current: state.layouts.current === layoutId ? null : state.layouts.current,
            },
          })),

        setCurrentLayout: (layoutId) =>
          set((state) => ({
            ...state,
            layouts: {
              ...state.layouts,
              current: layoutId,
            },
          })),

        // App actions
        setTheme: (theme) =>
          set((state) => ({
            ...state,
            app: {
              ...state.app,
              theme: { ...state.app.theme, ...theme },
            },
          })),

        setLoading: (isLoading) =>
          set((state) => ({
            ...state,
            app: {
              ...state.app,
              isLoading,
            },
          })),

        setError: (error) =>
          set((state) => ({
            ...state,
            app: {
              ...state.app,
              error,
            },
          })),

        completeOnboarding: () =>
          set((state) => ({
            ...state,
            app: {
              ...state.app,
              onboardingCompleted: true,
              firstLaunch: false,
            },
          })),

        incrementMetric: (metric) =>
          set((state) => ({
            ...state,
            app: {
              ...state.app,
              metrics: {
                ...state.app.metrics,
                [metric]: (state.app.metrics[metric] as number) + 1,
                lastActiveDate: new Date().toISOString(),
              },
            },
          })),

        // Temporary state actions
        showToast: (message, type, duration = 3000) =>
          set((state) => ({
            ...state,
            temp: {
              ...state.temp,
              currentToast: { message, type, duration },
            },
          })),

        hideToast: () =>
          set((state) => ({
            ...state,
            temp: {
              ...state.temp,
              currentToast: null,
            },
          })),

        setConnectionStatus: (isConnected) =>
          set((state) => ({
            ...state,
            temp: {
              ...state.temp,
              isConnected,
            },
          })),

        setBackgroundMode: (backgroundMode) =>
          set((state) => ({
            ...state,
            temp: {
              ...state.temp,
              backgroundMode,
            },
          })),

        setPipMode: (pipMode) =>
          set((state) => ({
            ...state,
            temp: {
              ...state.temp,
              pipMode,
            },
          })),

        setCurrentRoute: (route) =>
          set((state) => ({
            ...state,
            temp: {
              ...state.temp,
              currentRoute: route,
            },
          })),

        setSearchQuery: (query) =>
          set((state) => ({
            ...state,
            temp: {
              ...state.temp,
              searchQuery: query,
            },
          })),

        updateFilters: (filters) =>
          set((state) => ({
            ...state,
            temp: {
              ...state.temp,
              filters: { ...state.temp.filters, ...filters },
            },
          })),

        // Utility actions
        reset: () =>
          set((state) => ({
            ...state,
            streams: { active: [], favorites: [], recent: [], blocked: [] },
            layouts: { saved: [], current: null },
            temp: defaultTempState,
          })),
      }),
      {
        name: 'streamyyy-global-state',
        storage: createJSONStorage(() => AsyncStorage),
        partialize: (state) => ({
          user: state.user,
          streams: {
            favorites: state.streams.favorites,
            recent: state.streams.recent,
            blocked: state.streams.blocked,
          },
          layouts: state.layouts,
          app: {
            theme: state.app.theme,
            onboardingCompleted: state.app.onboardingCompleted,
            firstLaunch: state.app.firstLaunch,
            metrics: state.app.metrics,
          },
        }),
        onRehydrateStorage: () => (state) => {
          if (state) {
            logDebug('Global state rehydrated successfully');
            // Reset temporary state after rehydration
            state.temp = defaultTempState;
            state.app.isLoading = false;
            state.app.error = null;
          }
        },
      }
    )
  )
);

// Optimized selectors
export const useUser = () => useGlobalStore(state => state.user);
export const useActiveStreams = () => useGlobalStore(state => state.streams.active);
export const useFavoriteStreams = () => useGlobalStore(state => state.streams.favorites);
export const useRecentStreams = () => useGlobalStore(state => state.streams.recent);
export const useLayouts = () => useGlobalStore(state => state.layouts);
export const useAppTheme = () => useGlobalStore(state => state.app.theme);
export const useAppMetrics = () => useGlobalStore(state => state.app.metrics);
export const useTempState = () => useGlobalStore(state => state.temp);

// Combined actions selector
export const useActions = () => useGlobalStore(state => ({
  setUser: state.setUser,
  updatePreferences: state.updatePreferences,
  updateSubscription: state.updateSubscription,
  addStream: state.addStream,
  removeStream: state.removeStream,
  toggleFavorite: state.toggleFavorite,
  blockUser: state.blockUser,
  unblockUser: state.unblockUser,
  addToRecent: state.addToRecent,
  clearRecent: state.clearRecent,
  saveLayout: state.saveLayout,
  deleteLayout: state.deleteLayout,
  setCurrentLayout: state.setCurrentLayout,
  setTheme: state.setTheme,
  setLoading: state.setLoading,
  setError: state.setError,
  completeOnboarding: state.completeOnboarding,
  incrementMetric: state.incrementMetric,
  showToast: state.showToast,
  hideToast: state.hideToast,
  setConnectionStatus: state.setConnectionStatus,
  setBackgroundMode: state.setBackgroundMode,
  setPipMode: state.setPipMode,
  setCurrentRoute: state.setCurrentRoute,
  setSearchQuery: state.setSearchQuery,
  updateFilters: state.updateFilters,
  reset: state.reset,
}));

// Performance monitoring
if (__DEV__) {
  useGlobalStore.subscribe(
    (state) => state.streams.active.length,
    (activeStreamsCount) => {
      logDebug('Active streams count changed', { count: activeStreamsCount });
    }
  );

  useGlobalStore.subscribe(
    (state) => state.app.error,
    (error) => {
      if (error) {
        logError('Global app error', new Error(error));
      }
    }
  );
}

export default useGlobalStore;