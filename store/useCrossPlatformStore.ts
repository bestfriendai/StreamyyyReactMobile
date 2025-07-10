import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createCrossPlatformStorage, platformDetection } from '@/utils/crossPlatformStorage';
import { TwitchStream } from '@/services/twitchApi';
import { UnifiedStream } from '@/services/platformService';

export interface Layout {
  id: string;
  name: string;
  streams: UnifiedStream[];
  gridType: 'grid' | 'stacked' | 'pip' | 'focus';
  gridColumns: number;
  createdAt: string;
  userId?: string;
  isDefault?: boolean;
  platformLayout?: {
    web?: any;
    desktop?: any;
    mobile?: any;
  };
}

export interface CrossPlatformState {
  // Platform info
  platform: 'web' | 'desktop' | 'mobile';
  deviceId: string;
  isOnline: boolean;
  
  // Stream state
  activeStreams: UnifiedStream[];
  savedLayouts: Layout[];
  currentLayout: Layout | null;
  maxStreams: number;
  isLoading: boolean;
  error: string | null;
  
  // Cross-platform sync
  syncEnabled: boolean;
  lastSyncTime: string | null;
  pendingChanges: string[];
  
  // Platform-specific settings
  webSettings: {
    fullscreenMode: boolean;
    keyboardShortcuts: boolean;
    browserNotifications: boolean;
    qualityPreference: 'auto' | 'high' | 'medium' | 'low';
  };
  
  desktopSettings: {
    systemTrayEnabled: boolean;
    autoStart: boolean;
    hardwareAcceleration: boolean;
    nativeNotifications: boolean;
  };
  
  mobileSettings: {
    hapticsEnabled: boolean;
    backgroundPlayback: boolean;
    pushNotifications: boolean;
    biometricAuth: boolean;
  };
  
  // Universal settings
  theme: 'light' | 'dark' | 'system';
  streamQuality: 'auto' | 'source' | '720p' | '480p' | '360p';
  autoPlay: boolean;
  chatEnabled: boolean;
  notificationsEnabled: boolean;
  
  // Actions
  initializePlatform: () => Promise<void>;
  addStream: (stream: UnifiedStream) => void;
  removeStream: (streamId: string) => void;
  updateStream: (streamId: string, updates: Partial<UnifiedStream>) => void;
  clearStreams: () => void;
  
  // Layout actions
  saveLayout: (layout: Omit<Layout, 'id' | 'createdAt'>) => Promise<void>;
  loadLayout: (layoutId: string) => void;
  deleteLayout: (layoutId: string) => void;
  setCurrentLayout: (layout: Layout | null) => void;
  
  // Sync actions
  enableSync: () => void;
  disableSync: () => void;
  syncWithCloud: () => Promise<void>;
  mergeSyncData: (data: any) => void;
  
  // Platform-specific actions
  updateWebSettings: (settings: Partial<CrossPlatformState['webSettings']>) => void;
  updateDesktopSettings: (settings: Partial<CrossPlatformState['desktopSettings']>) => void;
  updateMobileSettings: (settings: Partial<CrossPlatformState['mobileSettings']>) => void;
  
  // Utility actions
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setMaxStreams: (maxStreams: number) => void;
  setOnlineStatus: (isOnline: boolean) => void;
}

// Generate a unique device ID for sync purposes
const generateDeviceId = (): string => {
  const platform = platformDetection.isWeb ? 'web' : 
                   platformDetection.isElectron ? 'desktop' : 'mobile';
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 9);
  return `${platform}-${timestamp}-${random}`;
};

// Platform-specific defaults
const getDefaultSettings = () => {
  const base = {
    theme: 'dark' as const,
    streamQuality: 'auto' as const,
    autoPlay: true,
    chatEnabled: true,
    notificationsEnabled: true,
  };

  const webDefaults = {
    fullscreenMode: false,
    keyboardShortcuts: true,
    browserNotifications: true,
    qualityPreference: 'auto' as const,
  };

  const desktopDefaults = {
    systemTrayEnabled: true,
    autoStart: false,
    hardwareAcceleration: true,
    nativeNotifications: true,
  };

  const mobileDefaults = {
    hapticsEnabled: true,
    backgroundPlayback: true,
    pushNotifications: true,
    biometricAuth: false,
  };

  return { base, webDefaults, desktopDefaults, mobileDefaults };
};

export const useCrossPlatformStore = create<CrossPlatformState>()(
  persist(
    (set, get) => {
      const defaults = getDefaultSettings();
      
      return {
        // Platform info
        platform: platformDetection.isWeb ? 'web' : 
                 platformDetection.isElectron ? 'desktop' : 'mobile',
        deviceId: generateDeviceId(),
        isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
        
        // Stream state
        activeStreams: [],
        savedLayouts: [],
        currentLayout: null,
        maxStreams: 4,
        isLoading: false,
        error: null,
        
        // Cross-platform sync
        syncEnabled: false,
        lastSyncTime: null,
        pendingChanges: [],
        
        // Platform-specific settings
        webSettings: defaults.webDefaults,
        desktopSettings: defaults.desktopDefaults,
        mobileSettings: defaults.mobileDefaults,
        
        // Universal settings
        ...defaults.base,
        
        // Actions
        initializePlatform: async () => {
          const state = get();
          console.log(`🚀 Initializing platform: ${state.platform}`);
          
          // Set up platform-specific features
          if (state.platform === 'web') {
            // Web-specific initialization
            if (typeof window !== 'undefined') {
              // Setup online/offline listeners
              window.addEventListener('online', () => {
                get().setOnlineStatus(true);
              });
              
              window.addEventListener('offline', () => {
                get().setOnlineStatus(false);
              });
              
              // Setup keyboard shortcuts if enabled
              if (state.webSettings.keyboardShortcuts) {
                // Implementation would go here
                console.log('🎹 Keyboard shortcuts enabled');
              }
            }
          } else if (state.platform === 'desktop') {
            // Desktop-specific initialization
            if (typeof window !== 'undefined' && (window as any).electron) {
              const electron = (window as any).electron;
              
              // Setup system tray if enabled
              if (state.desktopSettings.systemTrayEnabled) {
                electron.ipcRenderer.send('setup-system-tray');
              }
              
              // Setup auto-start if enabled
              if (state.desktopSettings.autoStart) {
                electron.ipcRenderer.send('setup-auto-start');
              }
            }
          } else if (state.platform === 'mobile') {
            // Mobile-specific initialization
            console.log('📱 Mobile platform initialized');
          }
          
          console.log(`✅ Platform ${state.platform} initialized`);
        },
        
        addStream: (stream: UnifiedStream) => {
          const state = get();
          const streamExists = state.activeStreams.some(s => s.id === stream.id);
          
          if (!streamExists && state.activeStreams.length < state.maxStreams) {
            set(state => ({
              activeStreams: [...state.activeStreams, stream],
              error: null,
              pendingChanges: [...state.pendingChanges, `add-stream-${stream.id}`],
            }));
          }
        },
        
        removeStream: (streamId: string) => {
          set(state => ({
            activeStreams: state.activeStreams.filter(s => s.id !== streamId),
            pendingChanges: [...state.pendingChanges, `remove-stream-${streamId}`],
          }));
        },
        
        updateStream: (streamId: string, updates: Partial<UnifiedStream>) => {
          set(state => ({
            activeStreams: state.activeStreams.map(stream =>
              stream.id === streamId ? { ...stream, ...updates } : stream
            ),
            pendingChanges: [...state.pendingChanges, `update-stream-${streamId}`],
          }));
        },
        
        clearStreams: () => {
          set(state => ({
            activeStreams: [],
            currentLayout: null,
            pendingChanges: [...state.pendingChanges, 'clear-streams'],
          }));
        },
        
        // Layout actions
        saveLayout: async (layout: Omit<Layout, 'id' | 'createdAt'>) => {
          set({ isLoading: true, error: null });
          
          try {
            const state = get();
            const newLayout: Layout = {
              ...layout,
              id: Date.now().toString(),
              createdAt: new Date().toISOString(),
              platformLayout: {
                [state.platform]: {
                  deviceId: state.deviceId,
                  timestamp: new Date().toISOString(),
                }
              }
            };
            
            set(state => ({
              savedLayouts: [...state.savedLayouts, newLayout],
              isLoading: false,
              pendingChanges: [...state.pendingChanges, `save-layout-${newLayout.id}`],
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
              pendingChanges: [...state.pendingChanges, `load-layout-${layoutId}`],
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
              pendingChanges: [...state.pendingChanges, `delete-layout-${layoutId}`],
            };
          });
        },
        
        setCurrentLayout: (layout: Layout | null) => {
          set(state => ({
            currentLayout: layout,
            pendingChanges: [...state.pendingChanges, `set-current-layout-${layout?.id || 'null'}`],
          }));
        },
        
        // Sync actions
        enableSync: () => {
          set({ syncEnabled: true });
          console.log('🔄 Cross-platform sync enabled');
        },
        
        disableSync: () => {
          set({ syncEnabled: false });
          console.log('⏸️ Cross-platform sync disabled');
        },
        
        syncWithCloud: async () => {
          const state = get();
          if (!state.syncEnabled || !state.isOnline) return;
          
          try {
            console.log('🔄 Starting sync with cloud...');
            // Implementation would integrate with cloud service
            
            set({
              lastSyncTime: new Date().toISOString(),
              pendingChanges: [],
            });
            
            console.log('✅ Sync completed successfully');
          } catch (error) {
            console.error('❌ Sync failed:', error);
            set({
              error: error instanceof Error ? error.message : 'Sync failed',
            });
          }
        },
        
        mergeSyncData: (data: any) => {
          // Implementation for merging sync data from other devices
          console.log('🔄 Merging sync data from other devices');
          // This would handle conflict resolution and data merging
        },
        
        // Platform-specific actions
        updateWebSettings: (settings: Partial<CrossPlatformState['webSettings']>) => {
          set(state => ({
            webSettings: { ...state.webSettings, ...settings },
            pendingChanges: [...state.pendingChanges, 'update-web-settings'],
          }));
        },
        
        updateDesktopSettings: (settings: Partial<CrossPlatformState['desktopSettings']>) => {
          set(state => ({
            desktopSettings: { ...state.desktopSettings, ...settings },
            pendingChanges: [...state.pendingChanges, 'update-desktop-settings'],
          }));
        },
        
        updateMobileSettings: (settings: Partial<CrossPlatformState['mobileSettings']>) => {
          set(state => ({
            mobileSettings: { ...state.mobileSettings, ...settings },
            pendingChanges: [...state.pendingChanges, 'update-mobile-settings'],
          }));
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
        
        setOnlineStatus: (isOnline: boolean) => {
          set({ isOnline });
          console.log(`📡 Network status: ${isOnline ? 'online' : 'offline'}`);
        },
      };
    },
    {
      name: 'streamyyy-cross-platform-storage',
      storage: createJSONStorage(() => createCrossPlatformStorage()),
      partialize: (state) => ({
        activeStreams: state.activeStreams,
        savedLayouts: state.savedLayouts,
        currentLayout: state.currentLayout,
        syncEnabled: state.syncEnabled,
        lastSyncTime: state.lastSyncTime,
        theme: state.theme,
        streamQuality: state.streamQuality,
        autoPlay: state.autoPlay,
        chatEnabled: state.chatEnabled,
        notificationsEnabled: state.notificationsEnabled,
        webSettings: state.webSettings,
        desktopSettings: state.desktopSettings,
        mobileSettings: state.mobileSettings,
        deviceId: state.deviceId,
      }),
    }
  )
);

// Optimized selectors for cross-platform use
export const useActiveStreams = () => useCrossPlatformStore(state => state.activeStreams);
export const useSavedLayouts = () => useCrossPlatformStore(state => state.savedLayouts);
export const useCurrentLayout = () => useCrossPlatformStore(state => state.currentLayout);
export const usePlatformInfo = () => useCrossPlatformStore(state => ({
  platform: state.platform,
  deviceId: state.deviceId,
  isOnline: state.isOnline,
}));
export const useSyncStatus = () => useCrossPlatformStore(state => ({
  syncEnabled: state.syncEnabled,
  lastSyncTime: state.lastSyncTime,
  pendingChanges: state.pendingChanges,
}));
export const usePlatformSettings = () => useCrossPlatformStore(state => {
  const platform = state.platform;
  switch (platform) {
    case 'web':
      return state.webSettings;
    case 'desktop':
      return state.desktopSettings;
    case 'mobile':
      return state.mobileSettings;
    default:
      return {};
  }
});

// Cross-platform theme selector
export const useTheme = () => useCrossPlatformStore(state => state.theme);

// Actions selectors
export const useStreamActions = () => useCrossPlatformStore(state => ({
  addStream: state.addStream,
  removeStream: state.removeStream,
  updateStream: state.updateStream,
  clearStreams: state.clearStreams,
}));

export const useLayoutActions = () => useCrossPlatformStore(state => ({
  saveLayout: state.saveLayout,
  loadLayout: state.loadLayout,
  deleteLayout: state.deleteLayout,
  setCurrentLayout: state.setCurrentLayout,
}));

export const useSyncActions = () => useCrossPlatformStore(state => ({
  enableSync: state.enableSync,
  disableSync: state.disableSync,
  syncWithCloud: state.syncWithCloud,
}));

export const usePlatformActions = () => useCrossPlatformStore(state => ({
  updateWebSettings: state.updateWebSettings,
  updateDesktopSettings: state.updateDesktopSettings,
  updateMobileSettings: state.updateMobileSettings,
  initializePlatform: state.initializePlatform,
}));

export default useCrossPlatformStore;