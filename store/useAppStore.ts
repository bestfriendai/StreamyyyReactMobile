import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TwitchStream } from '@/services/twitchApi';

export interface Layout {
  id: string;
  name: string;
  streams: TwitchStream[];
  gridType: 'grid' | 'stacked' | 'pip' | 'focus';
  gridColumns: number;
  createdAt: string;
  userId?: string;
  isDefault?: boolean;
}

export interface StreamState {
  activeStreams: TwitchStream[];
  savedLayouts: Layout[];
  currentLayout: Layout | null;
  maxStreams: number;
  isLoading: boolean;
  error: string | null;
  
  // Stream actions
  addStream: (stream: TwitchStream) => void;
  removeStream: (streamId: string) => void;
  updateStream: (streamId: string, updates: Partial<TwitchStream>) => void;
  clearStreams: () => void;
  
  // Layout actions
  saveLayout: (layout: Omit<Layout, 'id' | 'createdAt'>) => Promise<void>;
  loadLayout: (layoutId: string) => void;
  deleteLayout: (layoutId: string) => void;
  setCurrentLayout: (layout: Layout | null) => void;
  
  // Utility actions
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setMaxStreams: (maxStreams: number) => void;
}

export interface SubscriptionState {
  tier: 'free' | 'pro' | 'premium';
  status: 'active' | 'inactive' | 'cancelled' | 'past_due';
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  customerId: string | null;
  
  // Subscription actions
  updateSubscription: (subscription: Partial<SubscriptionState>) => void;
  getMaxStreams: () => number;
  canAddMoreStreams: (currentCount: number) => boolean;
}

export interface SettingsState {
  theme: 'light' | 'dark' | 'system';
  streamQuality: 'auto' | 'source' | '720p' | '480p' | '360p';
  autoPlay: boolean;
  chatEnabled: boolean;
  notificationsEnabled: boolean;
  hapticsEnabled: boolean;
  
  // Settings actions
  updateSettings: (settings: Partial<SettingsState>) => void;
  resetSettings: () => void;
}

export interface AppState extends StreamState, SubscriptionState, SettingsState {}

const defaultSettings: SettingsState = {
  theme: 'dark',
  streamQuality: 'auto',
  autoPlay: true,
  chatEnabled: true,
  notificationsEnabled: true,
  hapticsEnabled: true,
  updateSettings: () => {},
  resetSettings: () => {},
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Stream state
      activeStreams: [],
      savedLayouts: [],
      currentLayout: null,
      maxStreams: 4,
      isLoading: false,
      error: null,

      // Subscription state
      tier: 'free',
      status: 'active',
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      customerId: null,

      // Settings state
      ...defaultSettings,

      // Stream actions
      addStream: (stream: TwitchStream) => {
        const state = get();
        const streamExists = state.activeStreams.some(s => s.id === stream.id);
        
        if (!streamExists && state.activeStreams.length < state.maxStreams) {
          set(state => ({
            activeStreams: [...state.activeStreams, stream],
            error: null,
          }));
        }
      },

      removeStream: (streamId: string) => {
        set(state => ({
          activeStreams: state.activeStreams.filter(s => s.id !== streamId),
        }));
      },

      updateStream: (streamId: string, updates: Partial<TwitchStream>) => {
        set(state => ({
          activeStreams: state.activeStreams.map(stream =>
            stream.id === streamId ? { ...stream, ...updates } : stream
          ),
        }));
      },

      clearStreams: () => {
        set({ activeStreams: [], currentLayout: null });
      },

      // Layout actions
      saveLayout: async (layout: Omit<Layout, 'id' | 'createdAt'>) => {
        set({ isLoading: true, error: null });
        
        try {
          const newLayout: Layout = {
            ...layout,
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
          };

          set(state => ({
            savedLayouts: [...state.savedLayouts, newLayout],
            isLoading: false,
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to save layout',
            isLoading: false,
          });
        }
      },

      loadLayout: (layoutId: string) => {
        const state = get();
        const layout = state.savedLayouts.find(l => l.id === layoutId);
        
        if (layout) {
          set({
            currentLayout: layout,
            activeStreams: layout.streams,
          });
        }
      },

      deleteLayout: (layoutId: string) => {
        set(state => {
          const updatedLayouts = state.savedLayouts.filter(l => l.id !== layoutId);
          const currentLayout = state.currentLayout?.id === layoutId ? null : state.currentLayout;
          
          return {
            savedLayouts: updatedLayouts,
            currentLayout,
          };
        });
      },

      setCurrentLayout: (layout: Layout | null) => {
        set({ currentLayout: layout });
      },

      // Subscription actions
      updateSubscription: (subscription: Partial<SubscriptionState>) => {
        set(state => ({ ...state, ...subscription }));
      },

      getMaxStreams: () => {
        const state = get();
        switch (state.tier) {
          case 'free': return 4;
          case 'pro': return 8;
          case 'premium': return 20;
          default: return 4;
        }
      },

      canAddMoreStreams: (currentCount: number) => {
        const state = get();
        return currentCount < state.getMaxStreams();
      },

      // Settings actions
      updateSettings: (settings: Partial<SettingsState>) => {
        set(state => ({ ...state, ...settings }));
      },

      resetSettings: () => {
        set(state => ({ ...state, ...defaultSettings }));
      },

      // Utility actions
      setLoading: (isLoading: boolean) => {
        set({ isLoading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      setMaxStreams: (maxStreams: number) => {
        set({ maxStreams });
      },
    }),
    {
      name: 'streamyyy-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        activeStreams: state.activeStreams,
        savedLayouts: state.savedLayouts,
        currentLayout: state.currentLayout,
        tier: state.tier,
        status: state.status,
        theme: state.theme,
        streamQuality: state.streamQuality,
        autoPlay: state.autoPlay,
        chatEnabled: state.chatEnabled,
        notificationsEnabled: state.notificationsEnabled,
        hapticsEnabled: state.hapticsEnabled,
      }),
    }
  )
);

// Performance monitoring subscription
useAppStore.subscribe(
  (state) => state.activeStreams.length,
  (streamCount) => {
    if (streamCount > 0) {
      useAppStore.getState().updatePerformanceMetrics({
        renderCount: useAppStore.getState().performanceMetrics.renderCount + 1,
      });
    }
  }
);

// Optimized selectors with shallow equality for better performance
import { shallow } from 'zustand/shallow';

export const useActiveStreams = () => useAppStore(state => state.activeStreams, shallow);
export const useSavedLayouts = () => useAppStore(state => state.savedLayouts, shallow);
export const useCurrentLayout = () => useAppStore(state => state.currentLayout);
export const useSubscriptionTier = () => useAppStore(state => state.tier);
export const useLoadingState = () => useAppStore(state => ({ isLoading: state.isLoading, error: state.error }));
export const useMaxStreams = () => useAppStore(state => state.maxStreams);

// Granular settings selectors to prevent unnecessary re-renders
export const useTheme = () => useAppStore(state => state.theme);
export const useStreamQuality = () => useAppStore(state => state.streamQuality);
export const useAutoPlay = () => useAppStore(state => state.autoPlay);
export const useChatEnabled = () => useAppStore(state => state.chatEnabled);
export const useNotificationsEnabled = () => useAppStore(state => state.notificationsEnabled);
export const useHapticsEnabled = () => useAppStore(state => state.hapticsEnabled);

// Combined settings selector with shallow comparison
export const useSettings = () => useAppStore(state => ({
  theme: state.theme,
  streamQuality: state.streamQuality,
  autoPlay: state.autoPlay,
  chatEnabled: state.chatEnabled,
  notificationsEnabled: state.notificationsEnabled,
  hapticsEnabled: state.hapticsEnabled,
}), shallow);

// Optimized actions selectors with shallow comparison
export const useStreamActions = () => useAppStore(state => ({
  addStream: state.addStream,
  removeStream: state.removeStream,
  updateStream: state.updateStream,
  clearStreams: state.clearStreams,
}), shallow);

export const useLayoutActions = () => useAppStore(state => ({
  saveLayout: state.saveLayout,
  loadLayout: state.loadLayout,
  deleteLayout: state.deleteLayout,
  setCurrentLayout: state.setCurrentLayout,
}), shallow);

export const useSubscriptionActions = () => useAppStore(state => ({
  updateSubscription: state.updateSubscription,
  getMaxStreams: state.getMaxStreams,
  canAddMoreStreams: state.canAddMoreStreams,
}), shallow);

export const useSettingsActions = () => useAppStore(state => ({
  updateSettings: state.updateSettings,
  resetSettings: state.resetSettings,
}), shallow);

// Performance-focused selectors
export const useActiveStreamIds = () => useAppStore(state => state.activeStreams.map(s => s.id), shallow);
export const useActiveStreamCount = () => useAppStore(state => state.activeStreams.length);
export const useCanAddMoreStreams = () => useAppStore(state => state.canAddMoreStreams(state.activeStreams.length));
export const useStreamById = (id: string) => useAppStore(state => state.activeStreams.find(s => s.id === id));
export const useLayoutById = (id: string) => useAppStore(state => state.savedLayouts.find(l => l.id === id));
export const usePerformanceMetrics = () => useAppStore(state => state.performanceMetrics, shallow);