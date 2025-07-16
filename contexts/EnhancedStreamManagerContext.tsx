import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TwitchStream } from '@/services/twitchApi';
import { UniversalStream } from '@/services/multiPlatformStreamingApi';
import { useAuth } from '@/contexts/AuthContext';
import { databaseService } from '@/services/databaseService';
import { logError, logDebug, withErrorHandling } from '@/utils/errorHandler';
import { streamAnalytics, SessionAnalytics, PerformanceInsights } from '@/services/streamAnalytics';
import { streamRecorder, RecordingSession, Highlight, RecordingStats } from '@/services/streamRecorder';
import { streamQualityManager, QualityLevel } from '@/services/streamQualityManager';
import { streamHealthMonitor } from '@/services/streamHealthMonitor';
import { performanceOptimizer, PerformanceMetrics } from '@/services/performanceOptimizer';
import { bandwidthMonitor, BandwidthMetrics } from '@/services/bandwidthMonitor';

// Enhanced stream interface with additional metadata
export interface EnhancedStreamInstance {
  id: string;
  stream: TwitchStream | UniversalStream;
  platform: 'twitch' | 'youtube' | 'kick' | 'facebook';
  status: 'active' | 'paused' | 'buffering' | 'error' | 'loading';
  quality: QualityLevel;
  isMuted: boolean;
  isPlaying: boolean;
  volume: number;
  priority: 'high' | 'medium' | 'low';
  addedAt: number;
  lastInteraction: number;
  viewTime: number;
  metrics: {
    loadTime: number;
    bufferEvents: number;
    qualityChanges: number;
    errors: number;
    averageFPS: number;
    averageLatency: number;
    dataUsage: number;
  };
  recording?: {
    sessionId: string;
    isRecording: boolean;
    duration: number;
  };
  pictureInPicture?: {
    enabled: boolean;
    position: { x: number; y: number };
    size: { width: number; height: number };
  };
}

export interface StreamLayoutConfig {
  mode: 'grid' | 'focus' | 'theater' | 'pip' | 'custom';
  gridColumns?: number;
  focusedStreamId?: string;
  customLayout?: {
    streamId: string;
    position: { x: number; y: number; width: number; height: number };
  }[];
  transitions: {
    duration: number;
    easing: 'linear' | 'ease' | 'ease-in' | 'ease-out';
  };
}

export interface StreamSettings {
  defaultVolume: number;
  autoPlay: boolean;
  chatEnabled: boolean;
  qualityPreference: QualityLevel;
  adaptiveQuality: boolean;
  performanceOptimization: boolean;
  dataUsageLimit: number;
  batteryOptimization: boolean;
  maxConcurrentStreams: number;
  autoRecord: boolean;
  autoHighlights: boolean;
  notificationsEnabled: boolean;
  layout: StreamLayoutConfig;
  advanced: {
    enableSyncPlayback: boolean;
    lowLatencyMode: boolean;
    hardwareAcceleration: boolean;
    backgroundPlayback: boolean;
    analyticsEnabled: boolean;
  };
}

export interface StreamNotification {
  id: string;
  type: 'stream_online' | 'stream_offline' | 'quality_change' | 'error' | 'recording_complete' | 'highlight_created';
  streamId: string;
  streamer: string;
  platform: string;
  message: string;
  timestamp: number;
  isRead: boolean;
  actionable: boolean;
  action?: () => void;
}

export interface RealTimeStreamData {
  streamId: string;
  viewerCount: number;
  chatActivity: number;
  uptime: number;
  quality: string;
  fps: number;
  bitrate: number;
  latency: number;
  lastUpdated: number;
}

// Context type definition
interface EnhancedStreamManagerContextType {
  // Stream management
  activeStreams: EnhancedStreamInstance[];
  favorites: (TwitchStream | UniversalStream)[];
  settings: StreamSettings;
  loading: boolean;
  
  // Stream operations
  addStream: (stream: TwitchStream | UniversalStream, platform?: string) => Promise<{ success: boolean; message: string }>;
  removeStream: (streamId: string) => Promise<void>;
  clearAllStreams: () => Promise<void>;
  updateStreamSettings: (streamId: string, settings: Partial<EnhancedStreamInstance>) => Promise<void>;
  toggleFavorite: (stream: TwitchStream | UniversalStream) => Promise<void>;
  
  // Quality and performance
  setStreamQuality: (streamId: string, quality: QualityLevel) => void;
  optimizePerformance: () => void;
  getPerformanceReport: () => any;
  performanceMetrics: PerformanceMetrics | null;
  bandwidthMetrics: BandwidthMetrics | null;
  
  // Layout management
  layoutConfig: StreamLayoutConfig;
  setLayoutMode: (mode: StreamLayoutConfig['mode']) => void;
  setFocusedStream: (streamId: string) => void;
  updateCustomLayout: (layout: StreamLayoutConfig['customLayout']) => void;
  
  // Recording and highlights
  startRecording: (streamId: string) => Promise<string>;
  stopRecording: (sessionId: string) => Promise<void>;
  createHighlight: (streamId: string, duration?: number) => Promise<Highlight>;
  getRecordings: () => RecordingSession[];
  getHighlights: () => Highlight[];
  recordingStats: RecordingStats | null;
  
  // Analytics and insights
  sessionAnalytics: SessionAnalytics | null;
  performanceInsights: PerformanceInsights | null;
  realTimeData: Map<string, RealTimeStreamData>;
  
  // Notifications
  notifications: StreamNotification[];
  unreadNotifications: number;
  markNotificationRead: (notificationId: string) => void;
  clearAllNotifications: () => void;
  
  // Utility methods
  isFavorite: (userId: string) => boolean;
  isStreamActive: (streamId: string) => boolean;
  getStreamById: (streamId: string) => EnhancedStreamInstance | null;
  updateSettings: (newSettings: Partial<StreamSettings>) => Promise<void>;
  
  // Real-time features
  subscribeToStreamUpdates: (streamId: string) => void;
  unsubscribeFromStreamUpdates: (streamId: string) => void;
  syncStreams: (action: 'play' | 'pause' | 'mute' | 'unmute') => void;
  
  // Picture-in-Picture
  enablePiP: (streamId: string) => void;
  disablePiP: (streamId: string) => void;
  updatePiPPosition: (streamId: string, position: { x: number; y: number }) => void;
}

const DEFAULT_SETTINGS: StreamSettings = {
  defaultVolume: 0.7,
  autoPlay: true,
  chatEnabled: true,
  qualityPreference: 'auto',
  adaptiveQuality: true,
  performanceOptimization: true,
  dataUsageLimit: 1024,
  batteryOptimization: true,
  maxConcurrentStreams: 4,
  autoRecord: false,
  autoHighlights: true,
  notificationsEnabled: true,
  layout: {
    mode: 'grid',
    gridColumns: 2,
    transitions: {
      duration: 300,
      easing: 'ease',
    },
  },
  advanced: {
    enableSyncPlayback: false,
    lowLatencyMode: false,
    hardwareAcceleration: true,
    backgroundPlayback: false,
    analyticsEnabled: true,
  },
};

const STORAGE_KEYS = {
  ACTIVE_STREAMS: 'enhanced_active_streams',
  FAVORITES: 'enhanced_favorites',
  SETTINGS: 'enhanced_settings',
  LAYOUT: 'enhanced_layout',
  NOTIFICATIONS: 'enhanced_notifications',
};

// Create the context
const EnhancedStreamManagerContext = createContext<EnhancedStreamManagerContextType | undefined>(undefined);

// Provider component
interface EnhancedStreamManagerProviderProps {
  children: ReactNode;
}

export const EnhancedStreamManagerProvider: React.FC<EnhancedStreamManagerProviderProps> = ({ children }) => {
  const authResult = useAuth();
  const user = authResult?.user || null;
  
  // State management
  const [activeStreams, setActiveStreams] = useState<EnhancedStreamInstance[]>([]);
  const [favorites, setFavorites] = useState<(TwitchStream | UniversalStream)[]>([]);
  const [settings, setSettings] = useState<StreamSettings>(DEFAULT_SETTINGS);
  const [layoutConfig, setLayoutConfig] = useState<StreamLayoutConfig>(DEFAULT_SETTINGS.layout);
  const [notifications, setNotifications] = useState<StreamNotification[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Performance and analytics state
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [bandwidthMetrics, setBandwidthMetrics] = useState<BandwidthMetrics | null>(null);
  const [sessionAnalytics, setSessionAnalytics] = useState<SessionAnalytics | null>(null);
  const [performanceInsights, setPerformanceInsights] = useState<PerformanceInsights | null>(null);
  const [recordingStats, setRecordingStats] = useState<RecordingStats | null>(null);
  const [realTimeData, setRealTimeData] = useState<Map<string, RealTimeStreamData>>(new Map());

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [user]);

  // Initialize analytics and monitoring
  useEffect(() => {
    if (settings.advanced.analyticsEnabled) {
      // Subscribe to analytics updates
      const unsubscribeAnalytics = streamAnalytics.onAnalyticsUpdate((data) => {
        switch (data.type) {
          case 'session_update':
            setSessionAnalytics(data.session);
            break;
          case 'insights_update':
            setPerformanceInsights(data.insights);
            break;
        }
      });

      // Subscribe to recording updates
      const unsubscribeRecording = streamRecorder.onRecordingEvent((data) => {
        handleRecordingEvent(data);
      });

      // Subscribe to performance updates
      const unsubscribePerf = performanceOptimizer.onPerformanceUpdate((metrics) => {
        setPerformanceMetrics(metrics);
      });

      const unsubscribeBandwidth = bandwidthMonitor.onBandwidthUpdate((metrics) => {
        setBandwidthMetrics(metrics);
      });

      // Update analytics periodically
      const analyticsInterval = setInterval(() => {
        setSessionAnalytics(streamAnalytics.getSessionAnalytics());
        setPerformanceInsights(streamAnalytics.generateInsights());
        updateRecordingStats();
      }, 10000);

      return () => {
        unsubscribeAnalytics();
        unsubscribeRecording();
        unsubscribePerf();
        unsubscribeBandwidth();
        clearInterval(analyticsInterval);
      };
    }
  }, [settings.advanced.analyticsEnabled]);

  // Real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      updateRealTimeData();
    }, 5000);

    return () => clearInterval(interval);
  }, [activeStreams]);

  const loadData = async () => {
    await withErrorHandling(async () => {
      setLoading(true);
      logDebug('Loading enhanced stream manager data', { userId: user?.id });
      
      try {
        // Load settings
        const settingsData = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
        if (settingsData) {
          setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(settingsData) });
        }

        // Load layout config
        const layoutData = await AsyncStorage.getItem(STORAGE_KEYS.LAYOUT);
        if (layoutData) {
          setLayoutConfig(JSON.parse(layoutData));
        }

        // Load notifications
        const notificationsData = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
        if (notificationsData) {
          setNotifications(JSON.parse(notificationsData));
        }

        // Load favorites
        if (user) {
          const userFavorites = await databaseService.getFavoriteStreams(user.id);
          setFavorites(userFavorites);
        } else {
          const favoritesData = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITES);
          if (favoritesData) {
            setFavorites(JSON.parse(favoritesData));
          }
        }

        logDebug('Enhanced stream manager data loaded successfully');
      } catch (error) {
        logError('Failed to load enhanced stream manager data', error as Error);
      }
    }, { component: 'EnhancedStreamManager', action: 'loadData' });
    
    setLoading(false);
  };

  const saveActiveStreams = useCallback(async (streams: EnhancedStreamInstance[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_STREAMS, JSON.stringify(streams));
    } catch (error) {
      logError('Failed to save active streams', error as Error);
    }
  }, []);

  const saveFavorites = useCallback(async (favs: (TwitchStream | UniversalStream)[]) => {
    try {
      if (user) {
        // Favorites are saved per operation in database
        return;
      } else {
        await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favs));
      }
    } catch (error) {
      logError('Failed to save favorites', error as Error);
    }
  }, [user]);

  const saveSettings = useCallback(async (newSettings: StreamSettings) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
    } catch (error) {
      logError('Failed to save settings', error as Error);
    }
  }, []);

  // Enhanced add stream with analytics tracking
  const addStream = useCallback(async (stream: TwitchStream | UniversalStream, platform?: string): Promise<{ success: boolean; message: string }> => {
    try {
      const streamId = 'id' in stream ? stream.id : stream.id;
      const streamPlatform = platform || ('platform' in stream ? stream.platform : 'twitch');
      const streamerName = 'user_name' in stream ? stream.user_name : stream.streamerDisplayName;

      logDebug('Enhanced addStream called', {
        streamId,
        streamerName,
        platform: streamPlatform,
        currentActiveStreams: activeStreams.length
      });

      // Validation
      if (!streamId || !streamerName) {
        return { success: false, message: 'Invalid stream data' };
      }

      // Check if already active
      if (activeStreams.some(s => s.id === streamId)) {
        return { success: false, message: 'Stream already active' };
      }

      // Check stream limit
      if (activeStreams.length >= settings.maxConcurrentStreams) {
        return { 
          success: false, 
          message: `Maximum ${settings.maxConcurrentStreams} streams allowed` 
        };
      }

      // Create enhanced stream instance
      const enhancedStream: EnhancedStreamInstance = {
        id: streamId,
        stream,
        platform: streamPlatform as any,
        status: 'loading',
        quality: settings.qualityPreference,
        isMuted: activeStreams.length > 0, // Mute all except first
        isPlaying: true,
        volume: settings.defaultVolume,
        priority: activeStreams.length === 0 ? 'high' : 'medium',
        addedAt: Date.now(),
        lastInteraction: Date.now(),
        viewTime: 0,
        metrics: {
          loadTime: 0,
          bufferEvents: 0,
          qualityChanges: 0,
          errors: 0,
          averageFPS: 0,
          averageLatency: 0,
          dataUsage: 0,
        },
      };

      // Auto-start recording if enabled
      if (settings.autoRecord) {
        try {
          const sessionId = await streamRecorder.startRecording(
            streamId,
            streamPlatform,
            streamerName
          );
          enhancedStream.recording = {
            sessionId,
            isRecording: true,
            duration: 0,
          };
        } catch (error) {
          logError('Failed to auto-start recording', error as Error);
        }
      }

      const newActiveStreams = [...activeStreams, enhancedStream];
      setActiveStreams(newActiveStreams);
      await saveActiveStreams(newActiveStreams);

      // Initialize analytics tracking
      streamAnalytics.trackStreamStart(streamId, streamPlatform, streamerName);
      
      // Initialize quality management
      streamQualityManager.initializeStream(streamId, settings.qualityPreference);
      
      // Add notification
      addNotification({
        type: 'stream_online',
        streamId,
        streamer: streamerName,
        platform: streamPlatform,
        message: `${streamerName} is now live on ${streamPlatform}`,
        actionable: false,
      });

      logDebug('Enhanced stream added successfully', { streamId, streamerName });
      return { 
        success: true, 
        message: `${streamerName} added to multi-view` 
      };
    } catch (error) {
      logError('Failed to add enhanced stream', error as Error);
      return { success: false, message: 'Failed to add stream' };
    }
  }, [activeStreams, settings, saveActiveStreams]);

  // Enhanced remove stream
  const removeStream = useCallback(async (streamId: string) => {
    const streamInstance = activeStreams.find(s => s.id === streamId);
    if (!streamInstance) return;

    // Stop recording if active
    if (streamInstance.recording?.isRecording) {
      try {
        await streamRecorder.stopRecording(streamInstance.recording.sessionId);
      } catch (error) {
        logError('Failed to stop recording on stream removal', error as Error);
      }
    }

    // Track analytics
    streamAnalytics.trackStreamEnd(streamId);
    
    // Clean up quality management
    streamQualityManager.removeStream(streamId);
    streamHealthMonitor.removeStream(streamId);

    const newActiveStreams = activeStreams.filter(s => s.id !== streamId);
    setActiveStreams(newActiveStreams);
    await saveActiveStreams(newActiveStreams);

    logDebug('Enhanced stream removed', { streamId });
  }, [activeStreams, saveActiveStreams]);

  const clearAllStreams = useCallback(async () => {
    // Stop all recordings
    for (const stream of activeStreams) {
      if (stream.recording?.isRecording) {
        try {
          await streamRecorder.stopRecording(stream.recording.sessionId);
        } catch (error) {
          logError('Failed to stop recording during clear all', error as Error);
        }
      }
      streamAnalytics.trackStreamEnd(stream.id);
    }

    setActiveStreams([]);
    await saveActiveStreams([]);
    logDebug('All enhanced streams cleared');
  }, [activeStreams, saveActiveStreams]);

  const updateStreamSettings = useCallback(async (streamId: string, updates: Partial<EnhancedStreamInstance>) => {
    setActiveStreams(prev => prev.map(stream => 
      stream.id === streamId 
        ? { ...stream, ...updates, lastInteraction: Date.now() }
        : stream
    ));
  }, []);

  // Layout management
  const setLayoutMode = useCallback((mode: StreamLayoutConfig['mode']) => {
    const newLayout = { ...layoutConfig, mode };
    setLayoutConfig(newLayout);
    AsyncStorage.setItem(STORAGE_KEYS.LAYOUT, JSON.stringify(newLayout));
    streamAnalytics.trackEngagement('layout_change', { mode });
  }, [layoutConfig]);

  const setFocusedStream = useCallback((streamId: string) => {
    const newLayout = { ...layoutConfig, focusedStreamId: streamId };
    setLayoutConfig(newLayout);
    updateStreamSettings(streamId, { priority: 'high' });
    streamAnalytics.trackEngagement('stream_switch', { streamId });
  }, [layoutConfig, updateStreamSettings]);

  // Recording methods
  const startRecording = useCallback(async (streamId: string): Promise<string> => {
    const streamInstance = activeStreams.find(s => s.id === streamId);
    if (!streamInstance) throw new Error('Stream not found');

    const streamerName = 'user_name' in streamInstance.stream 
      ? streamInstance.stream.user_name 
      : streamInstance.stream.streamerDisplayName;

    const sessionId = await streamRecorder.startRecording(
      streamId,
      streamInstance.platform,
      streamerName
    );

    await updateStreamSettings(streamId, {
      recording: {
        sessionId,
        isRecording: true,
        duration: 0,
      }
    });

    addNotification({
      type: 'recording_complete',
      streamId,
      streamer: streamerName,
      platform: streamInstance.platform,
      message: `Recording started for ${streamerName}`,
      actionable: false,
    });

    return sessionId;
  }, [activeStreams, updateStreamSettings]);

  const stopRecording = useCallback(async (sessionId: string) => {
    const session = await streamRecorder.stopRecording(sessionId);
    
    // Update stream instance
    const streamInstance = activeStreams.find(s => s.recording?.sessionId === sessionId);
    if (streamInstance) {
      await updateStreamSettings(streamInstance.id, {
        recording: {
          sessionId,
          isRecording: false,
          duration: session.duration,
        }
      });
    }
  }, [activeStreams, updateStreamSettings]);

  const createHighlight = useCallback(async (streamId: string, duration: number = 30): Promise<Highlight> => {
    const streamInstance = activeStreams.find(s => s.id === streamId);
    if (!streamInstance) throw new Error('Stream not found');

    const streamerName = 'user_name' in streamInstance.stream 
      ? streamInstance.stream.user_name 
      : streamInstance.stream.streamerDisplayName;

    return await streamRecorder.createClip(
      streamId,
      { duration },
      { title: `${streamerName} Highlight`, description: 'Created from live stream' }
    );
  }, [activeStreams]);

  // Utility methods
  const isFavorite = useCallback((userId: string) => {
    return favorites.some(fav => {
      const favUserId = 'user_id' in fav ? fav.user_id : fav.id;
      return favUserId === userId;
    });
  }, [favorites]);

  const isStreamActive = useCallback((streamId: string) => {
    return activeStreams.some(stream => stream.id === streamId);
  }, [activeStreams]);

  const getStreamById = useCallback((streamId: string) => {
    return activeStreams.find(stream => stream.id === streamId) || null;
  }, [activeStreams]);

  // Notification management
  const addNotification = useCallback((notification: Omit<StreamNotification, 'id' | 'timestamp' | 'isRead'>) => {
    if (!settings.notificationsEnabled) return;

    const newNotification: StreamNotification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      isRead: false,
    };

    setNotifications(prev => [newNotification, ...prev.slice(0, 49)]); // Keep last 50
  }, [settings.notificationsEnabled]);

  const markNotificationRead = useCallback((notificationId: string) => {
    setNotifications(prev => prev.map(notif => 
      notif.id === notificationId ? { ...notif, isRead: true } : notif
    ));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
  }, []);

  // Real-time data updates
  const updateRealTimeData = useCallback(() => {
    const newRealTimeData = new Map<string, RealTimeStreamData>();
    
    activeStreams.forEach(streamInstance => {
      const streamId = streamInstance.id;
      const qualityState = streamQualityManager.getStreamQuality(streamId);
      const healthState = streamHealthMonitor.getStreamHealth(streamId);

      const realTimeInfo: RealTimeStreamData = {
        streamId,
        viewerCount: 'viewer_count' in streamInstance.stream 
          ? streamInstance.stream.viewer_count 
          : streamInstance.stream.viewerCount,
        chatActivity: Math.floor(Math.random() * 50), // Simulated
        uptime: Date.now() - streamInstance.addedAt,
        quality: qualityState?.currentQuality || 'auto',
        fps: qualityState?.fps || 30,
        bitrate: qualityState?.bitrate || 0,
        latency: qualityState?.latency || 0,
        lastUpdated: Date.now(),
      };

      newRealTimeData.set(streamId, realTimeInfo);
    });

    setRealTimeData(newRealTimeData);
  }, [activeStreams]);

  // Picture-in-Picture methods
  const enablePiP = useCallback((streamId: string) => {
    updateStreamSettings(streamId, {
      pictureInPicture: {
        enabled: true,
        position: { x: 20, y: 100 },
        size: { width: 200, height: 112 },
      }
    });
  }, [updateStreamSettings]);

  const disablePiP = useCallback((streamId: string) => {
    updateStreamSettings(streamId, {
      pictureInPicture: {
        enabled: false,
        position: { x: 0, y: 0 },
        size: { width: 0, height: 0 },
      }
    });
  }, [updateStreamSettings]);

  // Event handlers
  const handleRecordingEvent = useCallback((data: any) => {
    switch (data.type) {
      case 'recording_complete':
        addNotification({
          type: 'recording_complete',
          streamId: data.streamId || '',
          streamer: data.streamer || 'Unknown',
          platform: data.platform || 'unknown',
          message: 'Recording completed successfully',
          actionable: false,
        });
        break;
      case 'highlight_created':
        addNotification({
          type: 'highlight_created',
          streamId: data.streamId || '',
          streamer: data.streamer || 'Unknown',
          platform: data.platform || 'unknown',
          message: 'New highlight created',
          actionable: true,
          action: () => {/* Navigate to highlights */},
        });
        break;
    }
  }, [addNotification]);

  const updateRecordingStats = useCallback(async () => {
    try {
      const stats = await streamRecorder.getRecordingStats();
      setRecordingStats(stats);
    } catch (error) {
      logError('Failed to update recording stats', error as Error);
    }
  }, []);

  // Context value
  const contextValue: EnhancedStreamManagerContextType = {
    // Stream management
    activeStreams,
    favorites,
    settings,
    loading,
    
    // Stream operations
    addStream,
    removeStream,
    clearAllStreams,
    updateStreamSettings,
    toggleFavorite: async (stream) => {
      // Implementation would be similar to the original but enhanced
    },
    
    // Quality and performance
    setStreamQuality: (streamId, quality) => {
      streamQualityManager.setStreamQuality(streamId, quality);
      streamAnalytics.trackEngagement('manual_quality', { streamId, quality });
    },
    optimizePerformance: () => performanceOptimizer.applyAutoOptimizations(),
    getPerformanceReport: () => ({
      performance: performanceMetrics,
      bandwidth: bandwidthMetrics,
      analytics: sessionAnalytics,
      insights: performanceInsights,
    }),
    performanceMetrics,
    bandwidthMetrics,
    
    // Layout management
    layoutConfig,
    setLayoutMode,
    setFocusedStream,
    updateCustomLayout: (layout) => {
      const newLayout = { ...layoutConfig, customLayout: layout };
      setLayoutConfig(newLayout);
    },
    
    // Recording and highlights
    startRecording,
    stopRecording,
    createHighlight,
    getRecordings: () => streamRecorder.getRecordingSessions(),
    getHighlights: () => streamRecorder.getHighlights(),
    recordingStats,
    
    // Analytics and insights
    sessionAnalytics,
    performanceInsights,
    realTimeData,
    
    // Notifications
    notifications,
    unreadNotifications: notifications.filter(n => !n.isRead).length,
    markNotificationRead,
    clearAllNotifications,
    
    // Utility methods
    isFavorite,
    isStreamActive,
    getStreamById,
    updateSettings: async (newSettings) => {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      await saveSettings(updatedSettings);
    },
    
    // Real-time features
    subscribeToStreamUpdates: (streamId) => {
      // Implementation for real-time updates
    },
    unsubscribeFromStreamUpdates: (streamId) => {
      // Implementation for unsubscribing
    },
    syncStreams: (action) => {
      // Sync action across all streams
      activeStreams.forEach(stream => {
        switch (action) {
          case 'play':
            updateStreamSettings(stream.id, { isPlaying: true });
            break;
          case 'pause':
            updateStreamSettings(stream.id, { isPlaying: false });
            break;
          case 'mute':
            updateStreamSettings(stream.id, { isMuted: true });
            break;
          case 'unmute':
            updateStreamSettings(stream.id, { isMuted: false });
            break;
        }
      });
    },
    
    // Picture-in-Picture
    enablePiP,
    disablePiP,
    updatePiPPosition: (streamId, position) => {
      const stream = getStreamById(streamId);
      if (stream?.pictureInPicture) {
        updateStreamSettings(streamId, {
          pictureInPicture: {
            ...stream.pictureInPicture,
            position,
          }
        });
      }
    },
  };

  return (
    <EnhancedStreamManagerContext.Provider value={contextValue}>
      {children}
    </EnhancedStreamManagerContext.Provider>
  );
};

// Hook to use the enhanced stream manager context
export const useEnhancedStreamManager = (): EnhancedStreamManagerContextType => {
  const context = useContext(EnhancedStreamManagerContext);
  if (!context) {
    throw new Error('useEnhancedStreamManager must be used within an EnhancedStreamManagerProvider');
  }
  return context;
};

export default EnhancedStreamManagerProvider;