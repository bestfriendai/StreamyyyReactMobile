import { create } from 'zustand';
import { persist, createJSONStorage, subscribeWithSelector } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TwitchStream } from '@/services/twitchApi';
import { logDebug, logError } from '@/utils/errorHandler';

// Types for different state slices
export interface AppTheme {
  mode: 'light' | 'dark' | 'system';
  primaryColor: string;
  accentColor: string;
  customColors?: Record<string, string>;
}

export interface UserPreferences {
  language: string;
  region: string;
  timeZone: string;
  notifications: {
    streamStart: boolean;
    streamEnd: boolean;
    favoriteOnline: boolean;
    appUpdates: boolean;
    marketing: boolean;
  };
  privacy: {
    analyticsEnabled: boolean;
    crashReporting: boolean;
    personalizedAds: boolean;
  };
  accessibility: {
    reduceMotion: boolean;
    highContrast: boolean;
    fontSize: 'small' | 'medium' | 'large' | 'xlarge';
    voiceOverEnabled: boolean;
  };
}

export interface StreamSession {
  id: string;
  streams: TwitchStream[];
  layout: 'grid' | 'stacked' | 'pip' | 'focus';
  gridColumns: number;
  startTime: number;
  endTime?: number;
  totalWatchTime: number;
  isActive: boolean;
}

export interface AppMetrics {
  totalWatchTime: number;
  streamsWatched: number;
  favoriteStreamers: number;
  layoutsCreated: number;
  lastActiveDate: string;
  crashCount: number;
  performanceIssues: number;
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
    viewerCount: {
      min: number;
      max: number;
    };
  };
}

export interface UndoableAction {
  id: string;
  type: 'stream_add' | 'stream_remove' | 'layout_save' | 'layout_delete' | 'favorite_toggle';
  timestamp: number;
  data: any;
  description: string;
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
    blocked: string[]; // user IDs
  };

  // Layouts & Sessions
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

  // Undo/Redo
  history: {
    past: UndoableAction[];
    future: UndoableAction[];
    maxSize: number;
  };

  // Actions
  actions: {
    // User actions
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
    duplicateLayout: (layoutId: string, newName: string) => void;

    // App actions
    setTheme: (theme: Partial<AppTheme>) => void;
    setLoading: (isLoading: boolean) => void;
    setError: (error: string | null) => void;
    completeOnboarding: () => void;
    incrementMetric: (metric: keyof AppMetrics) => void;
    updateMetrics: (metrics: Partial<AppMetrics>) => void;

    // Temporary state actions
    showToast: (message: string, type: TemporaryState['currentToast']['type'], duration?: number) => void;
    hideToast: () => void;
    setConnectionStatus: (isConnected: boolean) => void;
    setBackgroundMode: (backgroundMode: boolean) => void;
    setPipMode: (pipMode: boolean) => void;
    setCurrentRoute: (route: string) => void;
    setSearchQuery: (query: string) => void;
    updateFilters: (filters: Partial<TemporaryState['filters']>) => void;

    // Undo/Redo actions
    undo: () => void;
    redo: () => void;
    canUndo: () => boolean;
    canRedo: () => boolean;
    clearHistory: () => void;

    // Utility actions
    reset: () => void;
    exportState: () => string;
    importState: (state: string) => void;
  };
}

// Default values
const defaultPreferences: UserPreferences = {
  language: 'en',
  region: 'US',
  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  notifications: {
    streamStart: true,
    streamEnd: false,
    favoriteOnline: true,
    appUpdates: true,
    marketing: false,
  },
  privacy: {
    analyticsEnabled: true,
    crashReporting: true,
    personalizedAds: false,
  },
  accessibility: {
    reduceMotion: false,
    highContrast: false,
    fontSize: 'medium',
    voiceOverEnabled: false,
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
  crashCount: 0,
  performanceIssues: 0,
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

// Helper function to add undoable action
const addUndoableAction = (
  state: GlobalAppState,
  type: UndoableAction['type'],
  data: any,
  description: string
) => {
  const action: UndoableAction = {
    id: Date.now().toString(),
    type,
    timestamp: Date.now(),
    data,
    description,
  };

  state.history.past.push(action);
  
  // Keep history size manageable
  if (state.history.past.length > state.history.maxSize) {
    state.history.past = state.history.past.slice(-state.history.maxSize);
  }
  
  // Clear future actions when new action is performed
  state.history.future = [];
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
        
        history: {
          past: [],
          future: [],
          maxSize: 50,
        },

        // Actions
        actions: {
          // User actions
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
              if (!state.streams.active.find(s => s.id === stream.id)) {
                const newState = { ...state };
                addUndoableAction(newState, 'stream_add', stream, `Added ${stream.user_name}`);
                return {
                  ...newState,
                  streams: {
                    ...newState.streams,
                    active: [...newState.streams.active, stream],
                    recent: [stream, ...newState.streams.recent.filter(s => s.id !== stream.id)].slice(0, 20),
                  },
                  app: {
                    ...newState.app,
                    metrics: {
                      ...newState.app.metrics,
                      streamsWatched: newState.app.metrics.streamsWatched + 1,
                    },
                  },
                };
              }
              return state;
            }),

          removeStream: (streamId) =>
            set((state) => {
              const streamIndex = state.streams.active.findIndex(s => s.id === streamId);
              if (streamIndex !== -1) {
                const stream = state.streams.active[streamIndex];
                addUndoableAction(state, 'stream_remove', { stream, index: streamIndex }, `Removed ${stream.user_name}`);
                state.streams.active.splice(streamIndex, 1);
              }
            }),

          toggleFavorite: (stream) =>
            set((state) => {
              const index = state.streams.favorites.findIndex(s => s.user_id === stream.user_id);
              if (index !== -1) {
                addUndoableAction(state, 'favorite_toggle', { stream, action: 'remove' }, `Removed ${stream.user_name} from favorites`);
                state.streams.favorites.splice(index, 1);
              } else {
                addUndoableAction(state, 'favorite_toggle', { stream, action: 'add' }, `Added ${stream.user_name} to favorites`);
                state.streams.favorites.push(stream);
                state.actions.incrementMetric('favoriteStreamers');
              }
            }),

          blockUser: (userId) =>
            set((state) => {
              if (!state.streams.blocked.includes(userId)) {
                state.streams.blocked.push(userId);
                // Remove from active and favorites
                state.streams.active = state.streams.active.filter(s => s.user_id !== userId);
                state.streams.favorites = state.streams.favorites.filter(s => s.user_id !== userId);
              }
            }),

          unblockUser: (userId) =>
            set((state) => {
              state.streams.blocked = state.streams.blocked.filter(id => id !== userId);
            }),

          addToRecent: (stream) =>
            set((state) => {
              // Remove if already exists
              state.streams.recent = state.streams.recent.filter(s => s.id !== stream.id);
              // Add to beginning
              state.streams.recent.unshift(stream);
              // Keep only last 20
              state.streams.recent = state.streams.recent.slice(0, 20);
            }),

          clearRecent: () =>
            set((state) => {
              state.streams.recent = [];
            }),

          // Layout actions
          saveLayout: (layout) =>
            set((state) => {
              const newLayout = {
                ...layout,
                id: Date.now().toString(),
                createdAt: new Date().toISOString(),
              };
              addUndoableAction(state, 'layout_save', newLayout, `Saved layout "${layout.name}"`);
              state.layouts.saved.push(newLayout);
              state.actions.incrementMetric('layoutsCreated');
            }),

          deleteLayout: (layoutId) =>
            set((state) => {
              const layoutIndex = state.layouts.saved.findIndex(l => l.id === layoutId);
              if (layoutIndex !== -1) {
                const layout = state.layouts.saved[layoutIndex];
                addUndoableAction(state, 'layout_delete', { layout, index: layoutIndex }, `Deleted layout "${layout.name}"`);
                state.layouts.saved.splice(layoutIndex, 1);
                if (state.layouts.current === layoutId) {
                  state.layouts.current = null;
                }
              }
            }),

          setCurrentLayout: (layoutId) =>
            set((state) => {
              state.layouts.current = layoutId;
            }),

          duplicateLayout: (layoutId, newName) =>
            set((state) => {
              const layout = state.layouts.saved.find(l => l.id === layoutId);
              if (layout) {
                const newLayout = {
                  ...layout,
                  id: Date.now().toString(),
                  name: newName,
                  createdAt: new Date().toISOString(),
                  isDefault: false,
                };
                state.layouts.saved.push(newLayout);
                state.actions.incrementMetric('layoutsCreated');
              }
            }),

          // App actions
          setTheme: (theme) =>
            set((state) => {
              Object.assign(state.app.theme, theme);
            }),

          setLoading: (isLoading) =>
            set((state) => {
              state.app.isLoading = isLoading;
            }),

          setError: (error) =>
            set((state) => {
              state.app.error = error;
            }),

          completeOnboarding: () =>
            set((state) => {
              state.app.onboardingCompleted = true;
              state.app.firstLaunch = false;
            }),

          incrementMetric: (metric) =>
            set((state) => {
              if (typeof state.app.metrics[metric] === 'number') {
                (state.app.metrics[metric] as number)++;
              }
              state.app.metrics.lastActiveDate = new Date().toISOString();
            }),

          updateMetrics: (metrics) =>
            set((state) => {
              Object.assign(state.app.metrics, metrics);
            }),

          // Temporary state actions
          showToast: (message, type, duration = 3000) =>
            set((state) => {
              state.temp.currentToast = { message, type, duration };
            }),

          hideToast: () =>
            set((state) => {
              state.temp.currentToast = null;
            }),

          setConnectionStatus: (isConnected) =>
            set((state) => {
              state.temp.isConnected = isConnected;
            }),

          setBackgroundMode: (backgroundMode) =>
            set((state) => {
              state.temp.backgroundMode = backgroundMode;
            }),

          setPipMode: (pipMode) =>
            set((state) => {
              state.temp.pipMode = pipMode;
            }),

          setCurrentRoute: (route) =>
            set((state) => {
              state.temp.currentRoute = route;
            }),

          setSearchQuery: (query) =>
            set((state) => {
              state.temp.searchQuery = query;
            }),

          updateFilters: (filters) =>
            set((state) => {
              Object.assign(state.temp.filters, filters);
            }),

          // Undo/Redo actions
          undo: () =>
            set((state) => {
              const action = state.history.past.pop();
              if (action) {
                state.history.future.push(action);
                // Apply undo logic based on action type
                switch (action.type) {
                  case 'stream_add':
                    state.streams.active = state.streams.active.filter(s => s.id !== action.data.id);
                    break;
                  case 'stream_remove':
                    state.streams.active.splice(action.data.index, 0, action.data.stream);
                    break;
                  case 'favorite_toggle':
                    if (action.data.action === 'add') {
                      state.streams.favorites = state.streams.favorites.filter(s => s.user_id !== action.data.stream.user_id);
                    } else {
                      state.streams.favorites.push(action.data.stream);
                    }
                    break;
                  case 'layout_save':
                    state.layouts.saved = state.layouts.saved.filter(l => l.id !== action.data.id);
                    break;
                  case 'layout_delete':
                    state.layouts.saved.splice(action.data.index, 0, action.data.layout);
                    break;
                }
              }
            }),

          redo: () =>
            set((state) => {
              const action = state.history.future.pop();
              if (action) {
                state.history.past.push(action);
                // Apply redo logic (same as original action)
                switch (action.type) {
                  case 'stream_add':
                    state.streams.active.push(action.data);
                    break;
                  case 'stream_remove':
                    state.streams.active.splice(action.data.index, 1);
                    break;
                  case 'favorite_toggle':
                    if (action.data.action === 'add') {
                      state.streams.favorites.push(action.data.stream);
                    } else {
                      state.streams.favorites = state.streams.favorites.filter(s => s.user_id !== action.data.stream.user_id);
                    }
                    break;
                  case 'layout_save':
                    state.layouts.saved.push(action.data);
                    break;
                  case 'layout_delete':
                    state.layouts.saved.splice(action.data.index, 1);
                    break;
                }
              }
            }),

          canUndo: () => get().history.past.length > 0,
          canRedo: () => get().history.future.length > 0,

          clearHistory: () =>
            set((state) => {
              state.history.past = [];
              state.history.future = [];
            }),

          // Utility actions
          reset: () =>
            set((state) => {
              // Reset to initial state but keep user preferences
              const userPrefs = state.user.preferences;
              Object.assign(state, {
                streams: { active: [], favorites: [], recent: [], blocked: [] },
                layouts: { saved: [], current: null },
                temp: defaultTempState,
                history: { past: [], future: [], maxSize: 50 },
              });
              state.user.preferences = userPrefs;
            }),

          exportState: () => {
            const state = get();
            return JSON.stringify({
              user: state.user,
              streams: state.streams,
              layouts: state.layouts,
              app: state.app,
            });
          },

          importState: (stateString) => {
            try {
              const importedState = JSON.parse(stateString);
              set((state) => {
                Object.assign(state.user, importedState.user);
                Object.assign(state.streams, importedState.streams);
                Object.assign(state.layouts, importedState.layouts);
                Object.assign(state.app, importedState.app);
              });
            } catch (error) {
              logError('Failed to import state', error);
            }
          },
        },
      })),
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
export const useActions = () => useGlobalStore(state => state.actions);
export const useUndoRedo = () => useGlobalStore(state => ({
  undo: state.actions.undo,
  redo: state.actions.redo,
  canUndo: state.actions.canUndo(),
  canRedo: state.actions.canRedo(),
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