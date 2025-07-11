import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Network from 'expo-network';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { UnifiedStream } from './platformService';
import { performanceMonitor } from '../utils/performanceMonitor';

// Background sync task
const BACKGROUND_SYNC_TASK = 'background-sync-task';

TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  console.log('🔄 Background sync task started');
  try {
    const offlineService = await import('./offlineService');
    await offlineService.offlineService.performBackgroundSync();
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('Background sync failed:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export interface OfflineStream {
  id: string;
  originalStreamId: string;
  streamerName: string;
  streamerDisplayName: string;
  platform: string;
  title: string;
  description: string;
  category: string;
  thumbnailUrl: string;
  profileImageUrl: string;
  duration: number; // in seconds
  fileSize: number; // in bytes
  quality: 'auto' | 'source' | '720p' | '480p' | '360p';
  downloadUrl: string;
  localPath: string;
  downloadProgress: number; // 0-100
  status: 'queued' | 'downloading' | 'completed' | 'failed' | 'paused';
  startTime: string;
  endTime?: string;
  downloadedAt: string;
  expiresAt?: string; // For temporary offline content
  watchProgress: number; // 0-100
  lastWatchedAt?: string;
  bookmarks: {
    id: string;
    timestamp: number;
    title: string;
    description?: string;
    createdAt: string;
  }[];
  metadata: {
    originalLiveDate: string;
    clipCount: number;
    averageViewers: number;
    peakViewers: number;
    chatMessages?: {
      timestamp: number;
      username: string;
      message: string;
      color?: string;
    }[];
    tags: string[];
    language: string;
    isHighlight: boolean;
    chapters?: {
      start: number;
      end: number;
      title: string;
      description?: string;
    }[];
  };
  settings: {
    autoDelete: boolean;
    deleteAfterDays: number;
    allowCellularDownload: boolean;
    notifyWhenComplete: boolean;
    downloadSubtitles: boolean;
    downloadChat: boolean;
    syncEnabled: boolean;
    intelligentCaching: boolean;
    adaptiveQuality: boolean;
    backgroundSync: boolean;
    compressionLevel: 'low' | 'medium' | 'high';
  };
  createdAt: string;
  updatedAt: string;
}

export interface DownloadQueue {
  id: string;
  streamId: string;
  priority: 'low' | 'normal' | 'high';
  estimatedSize: number;
  estimatedDuration: number;
  status: 'waiting' | 'active' | 'paused' | 'completed' | 'failed';
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
}

export interface OfflineSettings {
  maxStorageGB: number;
  currentStorageGB: number;
  autoDeleteWatched: boolean;
  deleteWatchedAfterDays: number;
  downloadOnlyOnWiFi: boolean;
  maxConcurrentDownloads: number;
  defaultQuality: 'auto' | 'source' | '720p' | '480p' | '360p';
  downloadSubtitles: boolean;
  downloadChat: boolean;
  notificationsEnabled: boolean;
  compressDownloads: boolean;
  lowPowerMode: boolean;
  syncEnabled: boolean;
  intelligentCaching: boolean;
  adaptiveQuality: boolean;
  backgroundSync: boolean;
  compressionLevel: 'low' | 'medium' | 'high';
  cacheStrategy: 'aggressive' | 'balanced' | 'conservative';
  syncInterval: number; // in minutes
  prefetchCount: number;
  maxCacheSize: number; // in MB
  networkAware: boolean;
  batteryOptimized: boolean;
}

export interface PlaybackState {
  streamId: string;
  position: number; // in seconds
  duration: number;
  isPlaying: boolean;
  volume: number;
  playbackRate: number;
  quality: string;
  subtitlesEnabled: boolean;
  currentSubtitleTrack?: string;
  audioTrack?: string;
  lastUpdated: string;
  deviceId: string;
  sessionId: string;
  syncStatus: 'synced' | 'pending' | 'conflict' | 'error';
  conflictResolution?: 'server' | 'client' | 'manual';
}

export interface SyncData {
  id: string;
  type: 'stream' | 'playback' | 'settings' | 'bookmark';
  data: any;
  timestamp: number;
  deviceId: string;
  userId?: string;
  hash: string;
  version: number;
  syncStatus: 'pending' | 'synced' | 'conflict' | 'error';
  retryCount: number;
  lastSyncAttempt?: number;
}

export interface CacheEntry {
  id: string;
  key: string;
  data: any;
  timestamp: number;
  expiresAt: number;
  size: number;
  accessCount: number;
  lastAccessed: number;
  priority: 'low' | 'medium' | 'high';
  type: 'stream' | 'thumbnail' | 'metadata' | 'chunk';
  compressionLevel: number;
  checksum: string;
}

export interface NetworkState {
  isConnected: boolean;
  type: 'wifi' | 'cellular' | 'none';
  effectiveType: '2g' | '3g' | '4g' | '5g' | 'unknown';
  downloadSpeed: number; // Mbps
  uploadSpeed: number; // Mbps
  latency: number; // ms
  isMetered: boolean;
  strength: number; // 0-100
  lastChecked: number;
}

class OfflineService {
  private readonly storageKey = 'offline_streams';
  private readonly queueKey = 'download_queue';
  private readonly settingsKey = 'offline_settings';
  private readonly playbackKey = 'playback_states';
  private readonly baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.streammulti.com';
  
  private activeDownloads: Map<string, any> = new Map();
  private downloadQueue: DownloadQueue[] = [];
  private settings: OfflineSettings = {
    maxStorageGB: 10,
    currentStorageGB: 0,
    autoDeleteWatched: true,
    deleteWatchedAfterDays: 7,
    downloadOnlyOnWiFi: true,
    maxConcurrentDownloads: 2,
    defaultQuality: '720p',
    downloadSubtitles: true,
    downloadChat: false,
    notificationsEnabled: true,
    compressDownloads: false,
    lowPowerMode: false,
    syncEnabled: true,
    intelligentCaching: true,
    adaptiveQuality: true,
    backgroundSync: true,
    compressionLevel: 'medium',
    cacheStrategy: 'balanced',
    syncInterval: 30, // 30 minutes
    prefetchCount: 5,
    maxCacheSize: 500, // 500MB
    networkAware: true,
    batteryOptimized: true,
  };

  // New properties for enhanced offline capabilities
  private syncQueue: SyncData[] = [];
  private cache: Map<string, CacheEntry> = new Map();
  private networkState: NetworkState = {
    isConnected: true,
    type: 'wifi',
    effectiveType: '4g',
    downloadSpeed: 0,
    uploadSpeed: 0,
    latency: 0,
    isMetered: false,
    strength: 100,
    lastChecked: Date.now(),
  };
  private syncInProgress: boolean = false;
  private deviceId: string = '';
  private userId: string = '';
  private lastSyncTime: number = 0;
  private syncInterval: NodeJS.Timeout | null = null;
  private cacheCleanupInterval: NodeJS.Timeout | null = null;
  private networkMonitorInterval: NodeJS.Timeout | null = null;
  private prefetchQueue: string[] = [];
  private compressionWorkers: Map<string, any> = new Map();

  constructor() {
    console.log('🚀 Enhanced Offline Service initialized');
    this.generateDeviceId();
    this.initializeService();
    this.setupBackgroundSync();
  }

  private async initializeService() {
    await this.loadSettings();
    await this.loadDownloadQueue();
    await this.loadSyncQueue();
    await this.loadCache();
    await this.calculateStorageUsage();
    this.startQueueProcessor();
    this.setupCleanupScheduler();
    this.startNetworkMonitoring();
    this.startSyncScheduler();
    this.startCacheCleanup();
    this.initializeIntelligentCaching();
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Offline API request failed: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Offline API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Download Management
  async downloadStream(
    stream: UnifiedStream,
    options: {
      quality?: OfflineStream['quality'];
      startTime?: number;
      endTime?: number;
      priority?: DownloadQueue['priority'];
      settings?: Partial<OfflineStream['settings']>;
    } = {}
  ): Promise<string> {
    console.log(`🔄 Queuing stream for download: ${stream.title}`);
    
    try {
      // Check if already downloaded or in queue
      const existingStream = await this.getOfflineStream(stream.id);
      if (existingStream && existingStream.status === 'completed') {
        throw new Error('Stream already downloaded');
      }

      // Check storage space
      const estimatedSize = await this.estimateDownloadSize(stream, options.quality || this.settings.defaultQuality);
      if (!await this.hasEnoughSpace(estimatedSize)) {
        throw new Error('Insufficient storage space');
      }

      // Get download URL from backend
      const downloadInfo = await this.makeRequest<{
        downloadUrl: string;
        duration: number;
        fileSize: number;
        subtitleTracks?: any[];
        audioTracks?: any[];
      }>('/offline/prepare', {
        method: 'POST',
        body: JSON.stringify({
          streamId: stream.id,
          platform: stream.platform,
          quality: options.quality || this.settings.defaultQuality,
          startTime: options.startTime,
          endTime: options.endTime,
        }),
      });

      // Create offline stream record
      const offlineStream: OfflineStream = {
        id: `offline_${stream.id}_${Date.now()}`,
        originalStreamId: stream.id,
        streamerName: stream.streamerName,
        streamerDisplayName: stream.streamerDisplayName,
        platform: stream.platform,
        title: stream.title,
        description: stream.description || '',
        category: stream.category,
        thumbnailUrl: stream.thumbnailUrl,
        profileImageUrl: stream.profileImageUrl,
        duration: downloadInfo.duration,
        fileSize: downloadInfo.fileSize,
        quality: options.quality || this.settings.defaultQuality,
        downloadUrl: downloadInfo.downloadUrl,
        localPath: `${FileSystem.documentDirectory}offline/${stream.platform}/${stream.streamerName}/${offlineStream.id}.mp4`,
        downloadProgress: 0,
        status: 'queued',
        startTime: options.startTime ? new Date(options.startTime * 1000).toISOString() : stream.startedAt,
        endTime: options.endTime ? new Date(options.endTime * 1000).toISOString() : undefined,
        downloadedAt: new Date().toISOString(),
        watchProgress: 0,
        bookmarks: [],
        metadata: {
          originalLiveDate: stream.startedAt,
          clipCount: 0,
          averageViewers: stream.viewerCount,
          peakViewers: stream.viewerCount,
          tags: stream.tags || [],
          language: stream.language || 'en',
          isHighlight: false,
        },
        settings: {
          autoDelete: true,
          deleteAfterDays: this.settings.deleteWatchedAfterDays,
          allowCellularDownload: !this.settings.downloadOnlyOnWiFi,
          notifyWhenComplete: this.settings.notificationsEnabled,
          downloadSubtitles: this.settings.downloadSubtitles,
          downloadChat: this.settings.downloadChat,
          ...options.settings,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save offline stream
      await this.saveOfflineStream(offlineStream);

      // Add to download queue
      const queueItem: DownloadQueue = {
        id: `queue_${Date.now()}`,
        streamId: offlineStream.id,
        priority: options.priority || 'normal',
        estimatedSize: estimatedSize,
        estimatedDuration: downloadInfo.duration,
        status: 'waiting',
        createdAt: new Date().toISOString(),
        retryCount: 0,
        maxRetries: 3,
      };

      await this.addToDownloadQueue(queueItem);

      console.log(`✅ Stream queued for download: ${stream.title}`);
      return offlineStream.id;
    } catch (error) {
      console.error('❌ Failed to queue stream for download:', error);
      throw error;
    }
  }

  async pauseDownload(streamId: string): Promise<void> {
    console.log(`⏸️ Pausing download: ${streamId}`);
    
    try {
      const download = this.activeDownloads.get(streamId);
      if (download) {
        download.pauseAsync();
        await this.updateOfflineStreamStatus(streamId, 'paused');
      }
      
      await this.updateQueueItemStatus(streamId, 'paused');
      console.log(`✅ Download paused: ${streamId}`);
    } catch (error) {
      console.error('❌ Failed to pause download:', error);
    }
  }

  async resumeDownload(streamId: string): Promise<void> {
    console.log(`▶️ Resuming download: ${streamId}`);
    
    try {
      const download = this.activeDownloads.get(streamId);
      if (download) {
        download.resumeAsync();
        await this.updateOfflineStreamStatus(streamId, 'downloading');
      }
      
      await this.updateQueueItemStatus(streamId, 'active');
      console.log(`✅ Download resumed: ${streamId}`);
    } catch (error) {
      console.error('❌ Failed to resume download:', error);
    }
  }

  async cancelDownload(streamId: string): Promise<void> {
    console.log(`❌ Cancelling download: ${streamId}`);
    
    try {
      const download = this.activeDownloads.get(streamId);
      if (download) {
        download.cancelAsync();
        this.activeDownloads.delete(streamId);
      }
      
      // Remove from queue
      this.downloadQueue = this.downloadQueue.filter(item => item.streamId !== streamId);
      await this.saveDownloadQueue();
      
      // Delete partial file and stream record
      const stream = await this.getOfflineStream(streamId);
      if (stream) {
        await this.deleteLocalFile(stream.localPath);
        await this.deleteOfflineStream(streamId);
      }
      
      console.log(`✅ Download cancelled: ${streamId}`);
    } catch (error) {
      console.error('❌ Failed to cancel download:', error);
    }
  }

  private async startDownload(queueItem: DownloadQueue): Promise<void> {
    const stream = await this.getOfflineStream(queueItem.streamId);
    if (!stream) return;

    console.log(`🔄 Starting download: ${stream.title}`);
    
    try {
      // Ensure directory exists
      const dir = stream.localPath.substring(0, stream.localPath.lastIndexOf('/'));
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });

      // Start download
      const downloadResumable = FileSystem.createDownloadResumable(
        stream.downloadUrl,
        stream.localPath,
        {},
        (downloadProgress) => {
          const progress = (downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite) * 100;
          this.updateDownloadProgress(stream.id, progress);
        }
      );

      this.activeDownloads.set(stream.id, downloadResumable);
      await this.updateOfflineStreamStatus(stream.id, 'downloading');
      await this.updateQueueItemStatus(queueItem.streamId, 'active');

      const result = await downloadResumable.downloadAsync();
      
      if (result) {
        await this.updateOfflineStreamStatus(stream.id, 'completed');
        await this.updateQueueItemStatus(queueItem.streamId, 'completed');
        
        // Download additional content if enabled
        if (stream.settings.downloadSubtitles) {
          await this.downloadSubtitles(stream);
        }
        
        if (stream.settings.downloadChat) {
          await this.downloadChatReplay(stream);
        }

        // Send notification if enabled
        if (stream.settings.notifyWhenComplete) {
          // Implementation would integrate with notification service
          console.log(`📱 Download complete notification: ${stream.title}`);
        }

        console.log(`✅ Download completed: ${stream.title}`);
      }
    } catch (error) {
      console.error(`❌ Download failed: ${stream.title}`, error);
      await this.updateOfflineStreamStatus(stream.id, 'failed');
      await this.updateQueueItemStatus(queueItem.streamId, 'failed', error.message);
      
      // Retry if possible
      if (queueItem.retryCount < queueItem.maxRetries) {
        queueItem.retryCount++;
        queueItem.status = 'waiting';
        await this.saveDownloadQueue();
      }
    } finally {
      this.activeDownloads.delete(stream.id);
    }
  }

  // Playback Management
  async getPlaybackState(streamId: string): Promise<PlaybackState | null> {
    try {
      const stored = await AsyncStorage.getItem(`${this.playbackKey}_${streamId}`);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('❌ Failed to get playback state:', error);
      return null;
    }
  }

  async savePlaybackState(state: PlaybackState): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `${this.playbackKey}_${state.streamId}`,
        JSON.stringify({
          ...state,
          lastUpdated: new Date().toISOString(),
        })
      );
    } catch (error) {
      console.error('❌ Failed to save playback state:', error);
    }
  }

  async addBookmark(streamId: string, timestamp: number, title: string, description?: string): Promise<void> {
    console.log(`🔖 Adding bookmark: ${title} at ${timestamp}s`);
    
    try {
      const stream = await this.getOfflineStream(streamId);
      if (!stream) throw new Error('Stream not found');

      const bookmark = {
        id: Date.now().toString(),
        timestamp,
        title,
        description,
        createdAt: new Date().toISOString(),
      };

      stream.bookmarks.push(bookmark);
      stream.updatedAt = new Date().toISOString();
      
      await this.saveOfflineStream(stream);
      console.log(`✅ Bookmark added: ${title}`);
    } catch (error) {
      console.error('❌ Failed to add bookmark:', error);
      throw error;
    }
  }

  // Storage Management
  async getOfflineStreams(): Promise<OfflineStream[]> {
    try {
      const stored = await AsyncStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('❌ Failed to get offline streams:', error);
      return [];
    }
  }

  async getOfflineStream(streamId: string): Promise<OfflineStream | null> {
    try {
      const streams = await this.getOfflineStreams();
      return streams.find(s => s.id === streamId || s.originalStreamId === streamId) || null;
    } catch (error) {
      console.error('❌ Failed to get offline stream:', error);
      return null;
    }
  }

  async deleteOfflineStream(streamId: string): Promise<void> {
    console.log(`🗑️ Deleting offline stream: ${streamId}`);
    
    try {
      const stream = await this.getOfflineStream(streamId);
      if (stream) {
        // Delete local files
        await this.deleteLocalFile(stream.localPath);
        
        // Delete subtitle files
        const subtitlePath = stream.localPath.replace('.mp4', '.srt');
        await this.deleteLocalFile(subtitlePath);
        
        // Delete chat file
        const chatPath = stream.localPath.replace('.mp4', '_chat.json');
        await this.deleteLocalFile(chatPath);
      }

      // Remove from storage
      const streams = await this.getOfflineStreams();
      const updatedStreams = streams.filter(s => s.id !== streamId);
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(updatedStreams));

      // Remove playback state
      await AsyncStorage.removeItem(`${this.playbackKey}_${streamId}`);

      await this.calculateStorageUsage();
      console.log(`✅ Offline stream deleted: ${streamId}`);
    } catch (error) {
      console.error('❌ Failed to delete offline stream:', error);
      throw error;
    }
  }

  async getStorageInfo(): Promise<{
    totalSpace: number;
    usedSpace: number;
    availableSpace: number;
    streamCount: number;
    oldestStream?: OfflineStream;
  }> {
    try {
      const diskInfo = await FileSystem.getFreeDiskStorageAsync();
      const streams = await this.getOfflineStreams();
      const usedSpace = streams.reduce((total, stream) => total + stream.fileSize, 0);
      
      const oldestStream = streams
        .filter(s => s.status === 'completed')
        .sort((a, b) => new Date(a.downloadedAt).getTime() - new Date(b.downloadedAt).getTime())[0];

      return {
        totalSpace: diskInfo,
        usedSpace,
        availableSpace: diskInfo - usedSpace,
        streamCount: streams.length,
        oldestStream,
      };
    } catch (error) {
      console.error('❌ Failed to get storage info:', error);
      return {
        totalSpace: 0,
        usedSpace: 0,
        availableSpace: 0,
        streamCount: 0,
      };
    }
  }

  async cleanupStorage(forceCleanup: boolean = false): Promise<void> {
    console.log('🧹 Starting storage cleanup...');
    
    try {
      const streams = await this.getOfflineStreams();
      const now = new Date();
      let deletedCount = 0;

      for (const stream of streams) {
        let shouldDelete = false;

        // Auto-delete based on settings
        if (stream.settings.autoDelete) {
          const downloadDate = new Date(stream.downloadedAt);
          const daysSinceDownload = (now.getTime() - downloadDate.getTime()) / (1000 * 60 * 60 * 24);
          
          if (daysSinceDownload > stream.settings.deleteAfterDays) {
            shouldDelete = true;
          }
        }

        // Delete if watched completely and auto-delete is enabled
        if (this.settings.autoDeleteWatched && stream.watchProgress >= 95) {
          const lastWatched = stream.lastWatchedAt ? new Date(stream.lastWatchedAt) : null;
          if (lastWatched) {
            const daysSinceWatch = (now.getTime() - lastWatched.getTime()) / (1000 * 60 * 60 * 24);
            if (daysSinceWatch > this.settings.deleteWatchedAfterDays) {
              shouldDelete = true;
            }
          }
        }

        // Force cleanup if storage is full
        if (forceCleanup) {
          shouldDelete = true;
        }

        if (shouldDelete) {
          await this.deleteOfflineStream(stream.id);
          deletedCount++;
        }
      }

      console.log(`✅ Storage cleanup completed: ${deletedCount} streams deleted`);
    } catch (error) {
      console.error('❌ Storage cleanup failed:', error);
    }
  }

  // Utility Methods
  private async saveOfflineStream(stream: OfflineStream): Promise<void> {
    try {
      const streams = await this.getOfflineStreams();
      const existingIndex = streams.findIndex(s => s.id === stream.id);
      
      if (existingIndex >= 0) {
        streams[existingIndex] = stream;
      } else {
        streams.push(stream);
      }
      
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(streams));
    } catch (error) {
      console.error('❌ Failed to save offline stream:', error);
    }
  }

  private async updateOfflineStreamStatus(streamId: string, status: OfflineStream['status']): Promise<void> {
    try {
      const streams = await this.getOfflineStreams();
      const stream = streams.find(s => s.id === streamId);
      
      if (stream) {
        stream.status = status;
        stream.updatedAt = new Date().toISOString();
        await AsyncStorage.setItem(this.storageKey, JSON.stringify(streams));
      }
    } catch (error) {
      console.error('❌ Failed to update stream status:', error);
    }
  }

  private async updateDownloadProgress(streamId: string, progress: number): Promise<void> {
    try {
      const streams = await this.getOfflineStreams();
      const stream = streams.find(s => s.id === streamId);
      
      if (stream) {
        stream.downloadProgress = progress;
        stream.updatedAt = new Date().toISOString();
        await AsyncStorage.setItem(this.storageKey, JSON.stringify(streams));
      }
    } catch (error) {
      console.error('❌ Failed to update download progress:', error);
    }
  }

  private async loadSettings(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.settingsKey);
      if (stored) {
        this.settings = { ...this.settings, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('❌ Failed to load offline settings:', error);
    }
  }

  private async saveSettings(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.settingsKey, JSON.stringify(this.settings));
    } catch (error) {
      console.error('❌ Failed to save offline settings:', error);
    }
  }

  private async loadDownloadQueue(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.queueKey);
      this.downloadQueue = stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('❌ Failed to load download queue:', error);
    }
  }

  private async saveDownloadQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.queueKey, JSON.stringify(this.downloadQueue));
    } catch (error) {
      console.error('❌ Failed to save download queue:', error);
    }
  }

  private async addToDownloadQueue(item: DownloadQueue): Promise<void> {
    this.downloadQueue.push(item);
    await this.saveDownloadQueue();
  }

  private async updateQueueItemStatus(streamId: string, status: DownloadQueue['status'], error?: string): Promise<void> {
    const item = this.downloadQueue.find(q => q.streamId === streamId);
    if (item) {
      item.status = status;
      if (error) item.errorMessage = error;
      if (status === 'active' && !item.startedAt) {
        item.startedAt = new Date().toISOString();
      }
      if (status === 'completed' || status === 'failed') {
        item.completedAt = new Date().toISOString();
      }
      await this.saveDownloadQueue();
    }
  }

  private async estimateDownloadSize(stream: UnifiedStream, quality: string): Promise<number> {
    // Rough estimates based on quality and duration
    const baseSizePerMinute = {
      '360p': 15 * 1024 * 1024, // 15MB per minute
      '480p': 25 * 1024 * 1024, // 25MB per minute
      '720p': 50 * 1024 * 1024, // 50MB per minute
      'source': 100 * 1024 * 1024, // 100MB per minute
      'auto': 40 * 1024 * 1024, // 40MB per minute
    };
    
    const estimatedDurationMinutes = 60; // Default to 1 hour if unknown
    return baseSizePerMinute[quality as keyof typeof baseSizePerMinute] * estimatedDurationMinutes;
  }

  private async hasEnoughSpace(requiredBytes: number): Promise<boolean> {
    const storageInfo = await this.getStorageInfo();
    const maxStorageBytes = this.settings.maxStorageGB * 1024 * 1024 * 1024;
    return (storageInfo.usedSpace + requiredBytes) <= maxStorageBytes;
  }

  private async calculateStorageUsage(): Promise<void> {
    try {
      const streams = await this.getOfflineStreams();
      const totalSize = streams.reduce((total, stream) => total + stream.fileSize, 0);
      this.settings.currentStorageGB = totalSize / (1024 * 1024 * 1024);
      await this.saveSettings();
    } catch (error) {
      console.error('❌ Failed to calculate storage usage:', error);
    }
  }

  private async deleteLocalFile(path: string): Promise<void> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(path);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(path);
      }
    } catch (error) {
      console.error('❌ Failed to delete local file:', error);
    }
  }

  private async downloadSubtitles(stream: OfflineStream): Promise<void> {
    // Implementation would download subtitle files
    console.log(`📝 Downloading subtitles for: ${stream.title}`);
  }

  private async downloadChatReplay(stream: OfflineStream): Promise<void> {
    // Implementation would download chat replay data
    console.log(`💬 Downloading chat replay for: ${stream.title}`);
  }

  private startQueueProcessor(): void {
    setInterval(async () => {
      try {
        const waitingItems = this.downloadQueue
          .filter(item => item.status === 'waiting')
          .sort((a, b) => {
            const priorityOrder = { high: 3, normal: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
          });

        const activeDownloads = this.activeDownloads.size;
        const slotsAvailable = this.settings.maxConcurrentDownloads - activeDownloads;

        for (let i = 0; i < Math.min(slotsAvailable, waitingItems.length); i++) {
          const item = waitingItems[i];
          this.startDownload(item);
        }
      } catch (error) {
        console.error('❌ Queue processor error:', error);
      }
    }, 5000); // Check every 5 seconds
  }

  private setupCleanupScheduler(): void {
    // Run cleanup daily
    setInterval(async () => {
      await this.cleanupStorage();
    }, 24 * 60 * 60 * 1000);
  }

  // Enhanced Methods for Mobile-First Architecture
  private async generateDeviceId(): Promise<void> {
    try {
      let deviceId = await AsyncStorage.getItem('device_id');
      if (!deviceId) {
        deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await AsyncStorage.setItem('device_id', deviceId);
      }
      this.deviceId = deviceId;
    } catch (error) {
      console.error('❌ Failed to generate device ID:', error);
      this.deviceId = `fallback_${Date.now()}`;
    }
  }

  private async setupBackgroundSync(): Promise<void> {
    try {
      if (this.settings.backgroundSync) {
        await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
          minimumInterval: this.settings.syncInterval * 60 * 1000,
          stopOnTerminate: false,
          startOnBoot: true,
        });
        console.log('🔄 Background sync registered');
      }
    } catch (error) {
      console.error('❌ Background sync setup failed:', error);
    }
  }

  private async startNetworkMonitoring(): Promise<void> {
    try {
      // Initial network state
      const networkState = await Network.getNetworkStateAsync();
      this.updateNetworkState(networkState);
      
      // Monitor network changes
      this.networkMonitorInterval = setInterval(async () => {
        const currentState = await Network.getNetworkStateAsync();
        this.updateNetworkState(currentState);
      }, 10000); // Check every 10 seconds
      
      console.log('📶 Network monitoring started');
    } catch (error) {
      console.error('❌ Network monitoring failed:', error);
    }
  }

  private updateNetworkState(networkState: any): void {
    const prevConnected = this.networkState.isConnected;
    
    this.networkState = {
      isConnected: networkState.isConnected,
      type: networkState.type === 'wifi' ? 'wifi' : networkState.type === 'cellular' ? 'cellular' : 'none',
      effectiveType: networkState.effectiveType || '4g',
      downloadSpeed: networkState.downloadSpeed || 0,
      uploadSpeed: networkState.uploadSpeed || 0,
      latency: networkState.latency || 0,
      isMetered: networkState.isMetered || false,
      strength: networkState.strength || 100,
      lastChecked: Date.now(),
    };
    
    // Trigger sync when network comes back online
    if (!prevConnected && this.networkState.isConnected) {
      console.log('📶 Network reconnected, triggering sync');
      this.performSync();
    }
    
    // Adapt quality based on network
    if (this.settings.adaptiveQuality) {
      this.adaptQualityToNetwork();
    }
  }

  private async adaptQualityToNetwork(): Promise<void> {
    try {
      let recommendedQuality: string;
      
      if (this.networkState.type === 'wifi') {
        recommendedQuality = this.networkState.downloadSpeed > 25 ? 'source' : 
                           this.networkState.downloadSpeed > 10 ? '720p' : '480p';
      } else if (this.networkState.type === 'cellular') {
        recommendedQuality = this.networkState.isMetered ? '360p' : 
                           this.networkState.downloadSpeed > 5 ? '480p' : '360p';
      } else {
        recommendedQuality = '360p';
      }
      
      if (recommendedQuality !== this.settings.defaultQuality) {
        console.log(`📶 Adapting quality to network: ${recommendedQuality}`);
        this.settings.defaultQuality = recommendedQuality as any;
        await this.saveSettings();
      }
    } catch (error) {
      console.error('❌ Quality adaptation failed:', error);
    }
  }

  private async startSyncScheduler(): Promise<void> {
    if (!this.settings.syncEnabled) return;
    
    this.syncInterval = setInterval(async () => {
      await this.performSync();
    }, this.settings.syncInterval * 60 * 1000);
    
    console.log(`🔄 Sync scheduler started (${this.settings.syncInterval}min intervals)`);
  }

  private async startCacheCleanup(): Promise<void> {
    this.cacheCleanupInterval = setInterval(async () => {
      await this.cleanupCache();
    }, 30 * 60 * 1000); // Every 30 minutes
    
    console.log('🧼 Cache cleanup scheduler started');
  }

  // Enhanced Sync Methods
  async performSync(): Promise<void> {
    if (this.syncInProgress || !this.settings.syncEnabled || !this.networkState.isConnected) {
      return;
    }
    
    this.syncInProgress = true;
    console.log('🔄 Starting sync...');
    
    try {
      // Sync playback states
      await this.syncPlaybackStates();
      
      // Sync offline streams metadata
      await this.syncStreamMetadata();
      
      // Sync settings
      await this.syncSettings();
      
      // Sync bookmarks
      await this.syncBookmarks();
      
      // Process sync queue
      await this.processSyncQueue();
      
      this.lastSyncTime = Date.now();
      console.log('✅ Sync completed successfully');
    } catch (error) {
      console.error('❌ Sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  async performBackgroundSync(): Promise<void> {
    console.log('🔄 Background sync started');
    
    try {
      // Only sync critical data in background
      await this.syncPlaybackStates();
      await this.syncCriticalData();
      
      // Update performance metrics
      performanceMonitor.trackNetworkLatency();
      
      console.log('✅ Background sync completed');
    } catch (error) {
      console.error('❌ Background sync failed:', error);
    }
  }

  private async syncPlaybackStates(): Promise<void> {
    try {
      const playbackStates = await this.getAllPlaybackStates();
      
      for (const state of playbackStates) {
        if (state.syncStatus === 'pending') {
          await this.syncPlaybackState(state);
        }
      }
    } catch (error) {
      console.error('❌ Playback state sync failed:', error);
    }
  }

  private async syncPlaybackState(state: PlaybackState): Promise<void> {
    try {
      const response = await this.makeRequest('/sync/playback', {
        method: 'POST',
        body: JSON.stringify({
          deviceId: this.deviceId,
          userId: this.userId,
          playbackState: state,
        }),
      });
      
      if (response.success) {
        state.syncStatus = 'synced';
        await this.savePlaybackState(state);
      }
    } catch (error) {
      console.error('❌ Playback state sync failed:', error);
      state.syncStatus = 'error';
      await this.savePlaybackState(state);
    }
  }

  private async syncStreamMetadata(): Promise<void> {
    try {
      const streams = await this.getOfflineStreams();
      const metadata = streams.map(s => ({
        id: s.id,
        originalStreamId: s.originalStreamId,
        watchProgress: s.watchProgress,
        lastWatchedAt: s.lastWatchedAt,
        bookmarks: s.bookmarks,
      }));
      
      await this.makeRequest('/sync/metadata', {
        method: 'POST',
        body: JSON.stringify({
          deviceId: this.deviceId,
          userId: this.userId,
          metadata,
        }),
      });
    } catch (error) {
      console.error('❌ Stream metadata sync failed:', error);
    }
  }

  private async syncSettings(): Promise<void> {
    try {
      await this.makeRequest('/sync/settings', {
        method: 'POST',
        body: JSON.stringify({
          deviceId: this.deviceId,
          userId: this.userId,
          settings: this.settings,
        }),
      });
    } catch (error) {
      console.error('❌ Settings sync failed:', error);
    }
  }

  private async syncBookmarks(): Promise<void> {
    try {
      const streams = await this.getOfflineStreams();
      const allBookmarks = streams.flatMap(s => 
        s.bookmarks.map(b => ({ ...b, streamId: s.id }))
      );
      
      await this.makeRequest('/sync/bookmarks', {
        method: 'POST',
        body: JSON.stringify({
          deviceId: this.deviceId,
          userId: this.userId,
          bookmarks: allBookmarks,
        }),
      });
    } catch (error) {
      console.error('❌ Bookmarks sync failed:', error);
    }
  }

  private async syncCriticalData(): Promise<void> {
    try {
      // Sync only the most critical data in background
      const criticalSyncData = this.syncQueue.filter(item => 
        item.type === 'playback' && item.syncStatus === 'pending'
      ).slice(0, 5); // Limit to 5 items
      
      for (const item of criticalSyncData) {
        await this.processSyncItem(item);
      }
    } catch (error) {
      console.error('❌ Critical data sync failed:', error);
    }
  }

  private async processSyncQueue(): Promise<void> {
    try {
      const pendingItems = this.syncQueue.filter(item => 
        item.syncStatus === 'pending' && item.retryCount < 3
      );
      
      for (const item of pendingItems) {
        await this.processSyncItem(item);
      }
    } catch (error) {
      console.error('❌ Sync queue processing failed:', error);
    }
  }

  private async processSyncItem(item: SyncData): Promise<void> {
    try {
      const response = await this.makeRequest(`/sync/${item.type}`, {
        method: 'POST',
        body: JSON.stringify({
          deviceId: this.deviceId,
          userId: this.userId,
          syncData: item,
        }),
      });
      
      if (response.success) {
        item.syncStatus = 'synced';
        console.log(`✅ Synced ${item.type} item: ${item.id}`);
      } else {
        throw new Error(response.error || 'Sync failed');
      }
    } catch (error) {
      console.error(`❌ Sync item failed: ${item.id}`, error);
      item.syncStatus = 'error';
      item.retryCount++;
      item.lastSyncAttempt = Date.now();
    }
    
    await this.saveSyncQueue();
  }

  // Enhanced Caching Methods
  async cacheData(key: string, data: any, options: {
    ttl?: number;
    priority?: 'low' | 'medium' | 'high';
    type?: 'stream' | 'thumbnail' | 'metadata' | 'chunk';
    compress?: boolean;
  } = {}): Promise<void> {
    try {
      const {
        ttl = 24 * 60 * 60 * 1000, // 24 hours default
        priority = 'medium',
        type = 'metadata',
        compress = this.settings.compressDownloads,
      } = options;
      
      let processedData = data;
      let compressionLevel = 0;
      
      if (compress) {
        // Compress data based on settings
        const result = await this.compressData(data, this.settings.compressionLevel);
        processedData = result.data;
        compressionLevel = result.level;
      }
      
      const entry: CacheEntry = {
        id: `cache_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        key,
        data: processedData,
        timestamp: Date.now(),
        expiresAt: Date.now() + ttl,
        size: JSON.stringify(processedData).length,
        accessCount: 0,
        lastAccessed: Date.now(),
        priority,
        type,
        compressionLevel,
        checksum: await this.calculateChecksum(processedData),
      };
      
      this.cache.set(key, entry);
      await this.persistCache();
      
      // Trigger cache cleanup if needed
      if (this.getCacheSize() > this.settings.maxCacheSize * 1024 * 1024) {
        await this.cleanupCache();
      }
    } catch (error) {
      console.error('❌ Cache data failed:', error);
    }
  }

  async getCachedData(key: string): Promise<any | null> {
    try {
      const entry = this.cache.get(key);
      if (!entry) return null;
      
      // Check if expired
      if (Date.now() > entry.expiresAt) {
        this.cache.delete(key);
        await this.persistCache();
        return null;
      }
      
      // Update access statistics
      entry.accessCount++;
      entry.lastAccessed = Date.now();
      
      // Decompress if needed
      let data = entry.data;
      if (entry.compressionLevel > 0) {
        data = await this.decompressData(entry.data, entry.compressionLevel);
      }
      
      return data;
    } catch (error) {
      console.error('❌ Get cached data failed:', error);
      return null;
    }
  }

  private async cleanupCache(): Promise<void> {
    try {
      const entries = Array.from(this.cache.entries());
      const now = Date.now();
      
      // Remove expired entries
      const expiredKeys = entries
        .filter(([_, entry]) => now > entry.expiresAt)
        .map(([key]) => key);
      
      expiredKeys.forEach(key => this.cache.delete(key));
      
      // If still over limit, remove least recently used
      if (this.getCacheSize() > this.settings.maxCacheSize * 1024 * 1024) {
        const sortedEntries = entries
          .filter(([key]) => !expiredKeys.includes(key))
          .sort(([_, a], [__, b]) => {
            // Sort by priority first, then by last accessed
            const priorityOrder = { low: 1, medium: 2, high: 3 };
            const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
            if (priorityDiff !== 0) return priorityDiff;
            return a.lastAccessed - b.lastAccessed;
          });
        
        // Remove lowest priority, least recently used entries
        const toRemove = Math.ceil(sortedEntries.length * 0.2); // Remove 20%
        for (let i = 0; i < toRemove; i++) {
          this.cache.delete(sortedEntries[i][0]);
        }
      }
      
      await this.persistCache();
      console.log(`🧼 Cache cleanup completed: ${expiredKeys.length} expired entries removed`);
    } catch (error) {
      console.error('❌ Cache cleanup failed:', error);
    }
  }

  private getCacheSize(): number {
    return Array.from(this.cache.values())
      .reduce((total, entry) => total + entry.size, 0);
  }

  private async compressData(data: any, level: 'low' | 'medium' | 'high'): Promise<{ data: any; level: number }> {
    try {
      // Implement compression based on level
      const compressionLevels = { low: 1, medium: 6, high: 9 };
      const numLevel = compressionLevels[level];
      
      // This would use a compression library like pako or similar
      // For now, we'll simulate compression
      const compressed = JSON.stringify(data); // Placeholder
      
      return {
        data: compressed,
        level: numLevel,
      };
    } catch (error) {
      console.error('❌ Data compression failed:', error);
      return { data, level: 0 };
    }
  }

  private async decompressData(data: any, level: number): Promise<any> {
    try {
      if (level === 0) return data;
      
      // This would use a decompression library
      // For now, we'll simulate decompression
      return JSON.parse(data); // Placeholder
    } catch (error) {
      console.error('❌ Data decompression failed:', error);
      return data;
    }
  }

  private async calculateChecksum(data: any): Promise<string> {
    try {
      // This would use a proper hashing library
      const str = JSON.stringify(data);
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return hash.toString(16);
    } catch (error) {
      console.error('❌ Checksum calculation failed:', error);
      return 'error';
    }
  }

  // Storage Methods for Enhanced Features
  private async loadSyncQueue(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('sync_queue');
      this.syncQueue = stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('❌ Failed to load sync queue:', error);
    }
  }

  private async saveSyncQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem('sync_queue', JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('❌ Failed to save sync queue:', error);
    }
  }

  private async loadCache(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('cache_data');
      if (stored) {
        const cacheArray = JSON.parse(stored);
        this.cache = new Map(cacheArray);
      }
    } catch (error) {
      console.error('❌ Failed to load cache:', error);
    }
  }

  private async persistCache(): Promise<void> {
    try {
      const cacheArray = Array.from(this.cache.entries());
      await AsyncStorage.setItem('cache_data', JSON.stringify(cacheArray));
    } catch (error) {
      console.error('❌ Failed to persist cache:', error);
    }
  }

  private async getAllPlaybackStates(): Promise<PlaybackState[]> {
    try {
      const streams = await this.getOfflineStreams();
      const states: PlaybackState[] = [];
      
      for (const stream of streams) {
        const state = await this.getPlaybackState(stream.id);
        if (state) {
          states.push(state);
        }
      }
      
      return states;
    } catch (error) {
      console.error('❌ Failed to get all playback states:', error);
      return [];
    }
  }

  // Enhanced Public API methods
  async updateSettings(newSettings: Partial<OfflineSettings>): Promise<void> {
    const previousSettings = { ...this.settings };
    this.settings = { ...this.settings, ...newSettings };
    await this.saveSettings();
    
    // Handle setting changes that require action
    if (newSettings.syncEnabled !== undefined && newSettings.syncEnabled !== previousSettings.syncEnabled) {
      if (newSettings.syncEnabled) {
        await this.startSyncScheduler();
      } else if (this.syncInterval) {
        clearInterval(this.syncInterval);
        this.syncInterval = null;
      }
    }
    
    if (newSettings.syncInterval !== undefined && newSettings.syncInterval !== previousSettings.syncInterval) {
      if (this.syncInterval) {
        clearInterval(this.syncInterval);
        await this.startSyncScheduler();
      }
    }
    
    if (newSettings.backgroundSync !== undefined && newSettings.backgroundSync !== previousSettings.backgroundSync) {
      if (newSettings.backgroundSync) {
        await this.setupBackgroundSync();
      } else {
        await BackgroundFetch.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
      }
    }
    
    console.log('⚙️ Settings updated:', Object.keys(newSettings));
  }

  getSettings(): OfflineSettings {
    return { ...this.settings };
  }

  getDownloadQueue(): DownloadQueue[] {
    return [...this.downloadQueue];
  }

  getActiveDownloads(): string[] {
    return Array.from(this.activeDownloads.keys());
  }

  // Public API Methods for Enhanced Features
  async addToSyncQueue(type: SyncData['type'], data: any, userId?: string): Promise<void> {
    try {
      const syncItem: SyncData = {
        id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        data,
        timestamp: Date.now(),
        deviceId: this.deviceId,
        userId: userId || this.userId,
        hash: await this.calculateChecksum(data),
        version: 1,
        syncStatus: 'pending',
        retryCount: 0,
      };
      
      this.syncQueue.push(syncItem);
      await this.saveSyncQueue();
      
      // Trigger immediate sync if connected
      if (this.networkState.isConnected && this.settings.syncEnabled) {
        this.performSync();
      }
    } catch (error) {
      console.error('❌ Failed to add to sync queue:', error);
    }
  }

  async getNetworkState(): Promise<NetworkState> {
    return { ...this.networkState };
  }

  async getCacheStats(): Promise<{
    totalSize: number;
    entryCount: number;
    hitRate: number;
    oldestEntry: Date;
    newestEntry: Date;
  }> {
    try {
      const entries = Array.from(this.cache.values());
      const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
      const totalAccess = entries.reduce((sum, entry) => sum + entry.accessCount, 0);
      
      return {
        totalSize,
        entryCount: entries.length,
        hitRate: totalAccess > 0 ? entries.filter(e => e.accessCount > 0).length / entries.length : 0,
        oldestEntry: entries.length > 0 ? new Date(Math.min(...entries.map(e => e.timestamp))) : new Date(),
        newestEntry: entries.length > 0 ? new Date(Math.max(...entries.map(e => e.timestamp))) : new Date(),
      };
    } catch (error) {
      console.error('❌ Failed to get cache stats:', error);
      return {
        totalSize: 0,
        entryCount: 0,
        hitRate: 0,
        oldestEntry: new Date(),
        newestEntry: new Date(),
      };
    }
  }

  async getSyncStatus(): Promise<{
    lastSyncTime: Date;
    pendingItems: number;
    syncInProgress: boolean;
    nextSyncTime: Date;
  }> {
    return {
      lastSyncTime: new Date(this.lastSyncTime),
      pendingItems: this.syncQueue.filter(item => item.syncStatus === 'pending').length,
      syncInProgress: this.syncInProgress,
      nextSyncTime: new Date(this.lastSyncTime + (this.settings.syncInterval * 60 * 1000)),
    };
  }

  async setUserId(userId: string): Promise<void> {
    this.userId = userId;
    await AsyncStorage.setItem('user_id', userId);
  }

  async getUserId(): Promise<string> {
    try {
      const stored = await AsyncStorage.getItem('user_id');
      return stored || '';
    } catch (error) {
      console.error('❌ Failed to get user ID:', error);
      return '';
    }
  }

  async getDeviceId(): Promise<string> {
    return this.deviceId;
  }

  async forceSyncNow(): Promise<void> {
    if (this.networkState.isConnected) {
      await this.performSync();
    } else {
      throw new Error('No network connection available');
    }
  }

  async clearCache(): Promise<void> {
    this.cache.clear();
    await this.persistCache();
    console.log('🧼 Cache cleared');
  }

  async clearSyncQueue(): Promise<void> {
    this.syncQueue = [];
    await this.saveSyncQueue();
    console.log('🔄 Sync queue cleared');
  }

  // Cleanup methods for service shutdown
  async cleanup(): Promise<void> {
    try {
      if (this.syncInterval) {
        clearInterval(this.syncInterval);
        this.syncInterval = null;
      }
      
      if (this.cacheCleanupInterval) {
        clearInterval(this.cacheCleanupInterval);
        this.cacheCleanupInterval = null;
      }
      
      if (this.networkMonitorInterval) {
        clearInterval(this.networkMonitorInterval);
        this.networkMonitorInterval = null;
      }
      
      // Save final state
      await this.saveSyncQueue();
      await this.persistCache();
      await this.saveSettings();
      
      console.log('💫 Offline service cleanup completed');
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
    }
  }
}

export const offlineService = new OfflineService();

// Helper functions for easier importing
export const downloadStream = async (stream: UnifiedStream, options?: any) => {
  return offlineService.downloadStream(stream, options);
};

export const getOfflineStreams = async () => {
  return offlineService.getOfflineStreams();
};

export const deleteOfflineStream = async (streamId: string) => {
  return offlineService.deleteOfflineStream(streamId);
};

export const getStorageInfo = async () => {
  return offlineService.getStorageInfo();
};