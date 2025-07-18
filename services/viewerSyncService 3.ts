import { EventEmitter } from 'eventemitter3';
import { webSocketService, WebSocketMessage } from './webSocketService';
import { logError, logDebug, withErrorHandling } from '@/utils/errorHandler';

export interface ViewerSyncState {
  streamId: string;
  userId: string;
  username: string;
  currentTime: number;
  playbackState: PlaybackState;
  quality: string;
  volume: number;
  timestamp: string;
  isHost: boolean;
  isSyncing: boolean;
  latency: number;
  bufferHealth: number;
  connectionQuality: ConnectionQuality;
}

export type PlaybackState = 'playing' | 'paused' | 'buffering' | 'seeking' | 'error' | 'ended';

export type ConnectionQuality = 'excellent' | 'good' | 'fair' | 'poor';

export interface SyncRoom {
  id: string;
  streamId: string;
  hostId: string;
  hostUsername: string;
  viewers: ViewerSyncState[];
  syncMode: SyncMode;
  masterTime: number;
  masterPlaybackState: PlaybackState;
  tolerance: number;
  createdAt: string;
  settings: SyncRoomSettings;
  statistics: SyncStatistics;
}

export type SyncMode = 'host_controlled' | 'democratic' | 'auto_sync' | 'manual';

export interface SyncRoomSettings {
  allowViewerControl: boolean;
  syncTolerance: number;
  autoSyncEnabled: boolean;
  qualitySync: boolean;
  volumeSync: boolean;
  bufferAheadTime: number;
  maxSyncDelay: number;
  reconnectGracePeriod: number;
  enableLatencyCompensation: boolean;
}

export interface SyncStatistics {
  totalViewers: number;
  syncedViewers: number;
  averageLatency: number;
  syncAccuracy: number;
  dropoutRate: number;
  bufferEvents: number;
  syncEvents: number;
  qualityChanges: number;
  reconnections: number;
}

export interface SyncEvent {
  type: SyncEventType;
  fromUserId: string;
  fromUsername: string;
  data: any;
  timestamp: string;
  roomId: string;
}

export type SyncEventType = 
  | 'sync_request'
  | 'sync_response'
  | 'playback_change'
  | 'seek_change'
  | 'quality_change'
  | 'volume_change'
  | 'buffer_event'
  | 'sync_drift'
  | 'viewer_join'
  | 'viewer_leave'
  | 'host_change'
  | 'sync_mode_change';

export interface SyncCommand {
  type: 'play' | 'pause' | 'seek' | 'quality' | 'volume' | 'sync';
  data: any;
  timestamp: string;
  executionTime?: string;
  priority: 'high' | 'normal' | 'low';
}

export interface BufferMetrics {
  currentBuffer: number;
  targetBuffer: number;
  bufferHealth: number;
  downloadRate: number;
  uploadRate: number;
  droppedFrames: number;
  decodedFrames: number;
  presentedFrames: number;
}

export interface LatencyMetrics {
  networkLatency: number;
  processingLatency: number;
  renderLatency: number;
  totalLatency: number;
  jitter: number;
  packetLoss: number;
}

class ViewerSyncService extends EventEmitter {
  private currentRoom: SyncRoom | null = null;
  private currentUser: ViewerSyncState | null = null;
  private syncTimer: NodeJS.Timeout | null = null;
  private latencyTimer: NodeJS.Timeout | null = null;
  private bufferTimer: NodeJS.Timeout | null = null;
  private syncCommands: SyncCommand[] = [];
  private bufferMetrics: BufferMetrics | null = null;
  private latencyMetrics: LatencyMetrics | null = null;
  private isInitialized: boolean = false;
  private lastSyncTime: number = 0;
  private syncDriftThreshold: number = 0.5; // 500ms
  private maxSyncAttempts: number = 3;
  private currentSyncAttempts: number = 0;

  constructor() {
    super();
    this.setupEventHandlers();
  }

  /**
   * Initialize viewer sync service
   */
  async initialize(userId: string, username: string): Promise<void> {
    return withErrorHandling(async () => {
      logDebug('Initializing viewer sync service', { userId, username });
      
      this.currentUser = {
        streamId: '',
        userId,
        username,
        currentTime: 0,
        playbackState: 'paused',
        quality: 'auto',
        volume: 1.0,
        timestamp: new Date().toISOString(),
        isHost: false,
        isSyncing: false,
        latency: 0,
        bufferHealth: 100,
        connectionQuality: 'excellent',
      };
      
      this.isInitialized = true;
      this.startMetricsCollection();
      
      this.emit('initialized', { userId, username });
    }, { component: 'ViewerSyncService', action: 'initialize' });
  }

  /**
   * Join a sync room
   */
  async joinSyncRoom(roomId: string, streamId: string): Promise<void> {
    return withErrorHandling(async () => {
      logDebug('Joining sync room', { roomId, streamId });
      
      if (!this.isInitialized || !this.currentUser) {
        throw new Error('Service not initialized');
      }

      this.currentUser.streamId = streamId;
      
      await webSocketService.sendMessage('viewer_sync_join', {
        roomId,
        streamId,
        viewerState: this.currentUser,
      });
      
      this.emit('room_joining', { roomId, streamId });
    }, { component: 'ViewerSyncService', action: 'joinSyncRoom' });
  }

  /**
   * Leave current sync room
   */
  async leaveSyncRoom(): Promise<void> {
    if (!this.currentRoom) return;

    await webSocketService.sendMessage('viewer_sync_leave', {
      roomId: this.currentRoom.id,
      userId: this.currentUser?.userId,
    });
    
    this.stopSync();
    const oldRoom = this.currentRoom;
    this.currentRoom = null;
    
    this.emit('room_left', { room: oldRoom });
  }

  /**
   * Update playback state
   */
  async updatePlaybackState(state: PlaybackState, currentTime?: number): Promise<void> {
    if (!this.currentUser || !this.currentRoom) return;

    this.currentUser.playbackState = state;
    if (currentTime !== undefined) {
      this.currentUser.currentTime = currentTime;
    }
    this.currentUser.timestamp = new Date().toISOString();

    await webSocketService.sendMessage('viewer_sync_update', {
      roomId: this.currentRoom.id,
      viewerState: this.currentUser,
      event: 'playback_change',
    });

    this.emit('playback_state_changed', { state, currentTime });
  }

  /**
   * Seek to specific time
   */
  async seekTo(time: number): Promise<void> {
    if (!this.currentUser || !this.currentRoom) return;

    const seekEvent: SyncEvent = {
      type: 'seek_change',
      fromUserId: this.currentUser.userId,
      fromUsername: this.currentUser.username,
      data: { time, timestamp: Date.now() },
      timestamp: new Date().toISOString(),
      roomId: this.currentRoom.id,
    };

    await webSocketService.sendMessage('viewer_sync_event', seekEvent);
    
    this.currentUser.currentTime = time;
    this.currentUser.timestamp = new Date().toISOString();
    
    this.emit('seek_requested', { time });
  }

  /**
   * Change quality
   */
  async changeQuality(quality: string): Promise<void> {
    if (!this.currentUser || !this.currentRoom) return;

    this.currentUser.quality = quality;
    this.currentUser.timestamp = new Date().toISOString();

    await webSocketService.sendMessage('viewer_sync_update', {
      roomId: this.currentRoom.id,
      viewerState: this.currentUser,
      event: 'quality_change',
    });

    this.emit('quality_changed', { quality });
  }

  /**
   * Change volume
   */
  async changeVolume(volume: number): Promise<void> {
    if (!this.currentUser || !this.currentRoom) return;

    this.currentUser.volume = Math.max(0, Math.min(1, volume));
    this.currentUser.timestamp = new Date().toISOString();

    await webSocketService.sendMessage('viewer_sync_update', {
      roomId: this.currentRoom.id,
      viewerState: this.currentUser,
      event: 'volume_change',
    });

    this.emit('volume_changed', { volume: this.currentUser.volume });
  }

  /**
   * Request sync with host
   */
  async requestSync(): Promise<void> {
    if (!this.currentRoom || !this.currentUser) return;

    const syncRequest: SyncEvent = {
      type: 'sync_request',
      fromUserId: this.currentUser.userId,
      fromUsername: this.currentUser.username,
      data: {
        currentTime: this.currentUser.currentTime,
        playbackState: this.currentUser.playbackState,
        latency: this.currentUser.latency,
      },
      timestamp: new Date().toISOString(),
      roomId: this.currentRoom.id,
    };

    await webSocketService.sendMessage('viewer_sync_event', syncRequest);
    
    this.currentUser.isSyncing = true;
    this.emit('sync_requested');
  }

  /**
   * Take host control
   */
  async takeHostControl(): Promise<void> {
    if (!this.currentRoom || !this.currentUser) return;

    await webSocketService.sendMessage('viewer_sync_host_request', {
      roomId: this.currentRoom.id,
      userId: this.currentUser.userId,
      username: this.currentUser.username,
    });

    this.emit('host_control_requested');
  }

  /**
   * Start auto sync
   */
  startAutoSync(): void {
    if (!this.currentRoom || this.syncTimer) return;

    const syncInterval = 1000; // 1 second
    
    this.syncTimer = setInterval(() => {
      this.checkSyncDrift();
    }, syncInterval);

    this.emit('auto_sync_started');
  }

  /**
   * Stop auto sync
   */
  stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }

    this.emit('auto_sync_stopped');
  }

  /**
   * Get current sync room
   */
  getCurrentRoom(): SyncRoom | null {
    return this.currentRoom;
  }

  /**
   * Get current user state
   */
  getCurrentUser(): ViewerSyncState | null {
    return this.currentUser;
  }

  /**
   * Get sync statistics
   */
  getSyncStatistics(): SyncStatistics | null {
    return this.currentRoom?.statistics || null;
  }

  /**
   * Get buffer metrics
   */
  getBufferMetrics(): BufferMetrics | null {
    return this.bufferMetrics;
  }

  /**
   * Get latency metrics
   */
  getLatencyMetrics(): LatencyMetrics | null {
    return this.latencyMetrics;
  }

  /**
   * Update buffer metrics
   */
  updateBufferMetrics(metrics: Partial<BufferMetrics>): void {
    this.bufferMetrics = { ...this.bufferMetrics, ...metrics } as BufferMetrics;
    
    if (this.currentUser) {
      this.currentUser.bufferHealth = this.calculateBufferHealth();
    }
    
    this.emit('buffer_metrics_updated', this.bufferMetrics);
  }

  /**
   * Update latency metrics
   */
  updateLatencyMetrics(metrics: Partial<LatencyMetrics>): void {
    this.latencyMetrics = { ...this.latencyMetrics, ...metrics } as LatencyMetrics;
    
    if (this.currentUser) {
      this.currentUser.latency = this.latencyMetrics.totalLatency;
      this.currentUser.connectionQuality = this.calculateConnectionQuality();
    }
    
    this.emit('latency_metrics_updated', this.latencyMetrics);
  }

  // Private methods

  private setupEventHandlers(): void {
    webSocketService.on('message:viewer_sync_room_state', this.handleRoomState.bind(this));
    webSocketService.on('message:viewer_sync_event', this.handleSyncEvent.bind(this));
    webSocketService.on('message:viewer_sync_command', this.handleSyncCommand.bind(this));
    webSocketService.on('message:viewer_sync_host_change', this.handleHostChange.bind(this));
    webSocketService.on('disconnected', this.handleDisconnected.bind(this));
  }

  private handleRoomState(wsMessage: WebSocketMessage): void {
    const roomState: SyncRoom = wsMessage.data;
    this.currentRoom = roomState;
    
    // Update current user from room state
    const userState = roomState.viewers.find(v => v.userId === this.currentUser?.userId);
    if (userState) {
      this.currentUser = userState;
    }
    
    this.emit('room_state_updated', roomState);
    
    // Start auto sync if enabled
    if (roomState.settings.autoSyncEnabled) {
      this.startAutoSync();
    }
  }

  private handleSyncEvent(wsMessage: WebSocketMessage): void {
    const event: SyncEvent = wsMessage.data;
    
    switch (event.type) {
      case 'sync_request':
        this.handleSyncRequest(event);
        break;
      case 'sync_response':
        this.handleSyncResponse(event);
        break;
      case 'playback_change':
        this.handlePlaybackChange(event);
        break;
      case 'seek_change':
        this.handleSeekChange(event);
        break;
      case 'quality_change':
        this.handleQualityChange(event);
        break;
      case 'volume_change':
        this.handleVolumeChange(event);
        break;
      case 'buffer_event':
        this.handleBufferEvent(event);
        break;
      case 'sync_drift':
        this.handleSyncDrift(event);
        break;
      case 'viewer_join':
        this.handleViewerJoin(event);
        break;
      case 'viewer_leave':
        this.handleViewerLeave(event);
        break;
    }
    
    this.emit('sync_event_received', event);
  }

  private handleSyncCommand(wsMessage: WebSocketMessage): void {
    const command: SyncCommand = wsMessage.data;
    
    // Add to command queue
    this.syncCommands.push(command);
    this.syncCommands.sort((a, b) => {
      const priorityOrder = { high: 0, normal: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
    
    this.processSyncCommands();
  }

  private handleHostChange(wsMessage: WebSocketMessage): void {
    const { newHostId, newHostUsername } = wsMessage.data;
    
    if (this.currentRoom) {
      this.currentRoom.hostId = newHostId;
      this.currentRoom.hostUsername = newHostUsername;
    }
    
    if (this.currentUser) {
      this.currentUser.isHost = this.currentUser.userId === newHostId;
    }
    
    this.emit('host_changed', { newHostId, newHostUsername });
  }

  private handleDisconnected(): void {
    this.stopSync();
    this.currentRoom = null;
    this.emit('disconnected');
  }

  private handleSyncRequest(event: SyncEvent): void {
    if (!this.currentUser?.isHost) return;
    
    const syncResponse: SyncEvent = {
      type: 'sync_response',
      fromUserId: this.currentUser.userId,
      fromUsername: this.currentUser.username,
      data: {
        masterTime: this.currentUser.currentTime,
        masterPlaybackState: this.currentUser.playbackState,
        timestamp: Date.now(),
        latencyCompensation: this.calculateLatencyCompensation(event.data.latency),
      },
      timestamp: new Date().toISOString(),
      roomId: this.currentRoom!.id,
    };
    
    webSocketService.sendMessage('viewer_sync_event', syncResponse);
  }

  private handleSyncResponse(event: SyncEvent): void {
    if (!this.currentUser || this.currentUser.isHost) return;
    
    const { masterTime, masterPlaybackState, timestamp, latencyCompensation } = event.data;
    const now = Date.now();
    const networkDelay = now - timestamp;
    const compensatedTime = masterTime + (networkDelay / 1000) + (latencyCompensation || 0);
    
    const timeDiff = Math.abs(compensatedTime - this.currentUser.currentTime);
    
    if (timeDiff > this.syncDriftThreshold) {
      this.applySyncCorrection(compensatedTime, masterPlaybackState);
    }
    
    this.currentUser.isSyncing = false;
    this.currentSyncAttempts = 0;
    
    this.emit('sync_applied', { masterTime: compensatedTime, timeDiff });
  }

  private handlePlaybackChange(event: SyncEvent): void {
    if (event.fromUserId === this.currentUser?.userId) return;
    
    const { playbackState, currentTime } = event.data;
    
    if (this.currentRoom?.syncMode === 'host_controlled' && event.fromUserId === this.currentRoom.hostId) {
      this.emit('host_playback_change', { playbackState, currentTime });
    } else if (this.currentRoom?.syncMode === 'democratic') {
      this.emit('democratic_playback_change', { playbackState, currentTime, fromUser: event.fromUsername });
    }
  }

  private handleSeekChange(event: SyncEvent): void {
    if (event.fromUserId === this.currentUser?.userId) return;
    
    const { time } = event.data;
    
    if (this.currentRoom?.syncMode === 'host_controlled' && event.fromUserId === this.currentRoom.hostId) {
      this.emit('host_seek_change', { time });
    } else if (this.currentRoom?.settings.allowViewerControl) {
      this.emit('viewer_seek_change', { time, fromUser: event.fromUsername });
    }
  }

  private handleQualityChange(event: SyncEvent): void {
    if (!this.currentRoom?.settings.qualitySync) return;
    
    const { quality } = event.data;
    
    if (event.fromUserId === this.currentRoom.hostId) {
      this.emit('host_quality_change', { quality });
    }
  }

  private handleVolumeChange(event: SyncEvent): void {
    if (!this.currentRoom?.settings.volumeSync) return;
    
    const { volume } = event.data;
    
    if (event.fromUserId === this.currentRoom.hostId) {
      this.emit('host_volume_change', { volume });
    }
  }

  private handleBufferEvent(event: SyncEvent): void {
    const { bufferHealth, action } = event.data;
    
    if (action === 'buffer_low' && bufferHealth < 30) {
      this.emit('buffer_warning', { bufferHealth, fromUser: event.fromUsername });
    }
  }

  private handleSyncDrift(event: SyncEvent): void {
    const { drift, threshold } = event.data;
    
    if (drift > threshold) {
      this.emit('sync_drift_detected', { drift, threshold });
    }
  }

  private handleViewerJoin(event: SyncEvent): void {
    this.emit('viewer_joined', { userId: event.fromUserId, username: event.fromUsername });
  }

  private handleViewerLeave(event: SyncEvent): void {
    this.emit('viewer_left', { userId: event.fromUserId, username: event.fromUsername });
  }

  private checkSyncDrift(): void {
    if (!this.currentRoom || !this.currentUser || this.currentUser.isHost) return;
    
    const now = Date.now();
    const timeSinceLastSync = now - this.lastSyncTime;
    
    // Check if we need to sync
    if (timeSinceLastSync > 10000) { // 10 seconds
      this.requestSync();
      this.lastSyncTime = now;
    }
  }

  private applySyncCorrection(targetTime: number, targetState: PlaybackState): void {
    const correction = {
      time: targetTime,
      state: targetState,
      drift: Math.abs(targetTime - (this.currentUser?.currentTime || 0)),
    };
    
    this.emit('sync_correction_applied', correction);
  }

  private processSyncCommands(): void {
    while (this.syncCommands.length > 0) {
      const command = this.syncCommands.shift()!;
      
      // Check if command should be executed now
      const shouldExecute = !command.executionTime || 
        new Date(command.executionTime).getTime() <= Date.now();
      
      if (shouldExecute) {
        this.executeSyncCommand(command);
      } else {
        // Re-queue for later
        this.syncCommands.unshift(command);
        break;
      }
    }
  }

  private executeSyncCommand(command: SyncCommand): void {
    switch (command.type) {
      case 'play':
        this.emit('sync_command_play', command.data);
        break;
      case 'pause':
        this.emit('sync_command_pause', command.data);
        break;
      case 'seek':
        this.emit('sync_command_seek', command.data);
        break;
      case 'quality':
        this.emit('sync_command_quality', command.data);
        break;
      case 'volume':
        this.emit('sync_command_volume', command.data);
        break;
      case 'sync':
        this.emit('sync_command_sync', command.data);
        break;
    }
  }

  private calculateBufferHealth(): number {
    if (!this.bufferMetrics) return 100;
    
    const { currentBuffer, targetBuffer } = this.bufferMetrics;
    
    if (currentBuffer >= targetBuffer) {
      return 100;
    } else if (currentBuffer <= 0) {
      return 0;
    } else {
      return (currentBuffer / targetBuffer) * 100;
    }
  }

  private calculateConnectionQuality(): ConnectionQuality {
    if (!this.latencyMetrics) return 'excellent';
    
    const { totalLatency, jitter, packetLoss } = this.latencyMetrics;
    
    if (totalLatency < 50 && jitter < 10 && packetLoss < 0.01) {
      return 'excellent';
    } else if (totalLatency < 100 && jitter < 20 && packetLoss < 0.05) {
      return 'good';
    } else if (totalLatency < 200 && jitter < 50 && packetLoss < 0.1) {
      return 'fair';
    } else {
      return 'poor';
    }
  }

  private calculateLatencyCompensation(viewerLatency: number): number {
    if (!this.currentUser) return 0;
    
    const hostLatency = this.currentUser.latency;
    const compensation = (viewerLatency - hostLatency) / 1000; // Convert to seconds
    
    return Math.max(0, compensation);
  }

  private startMetricsCollection(): void {
    // Start latency measurement
    this.latencyTimer = setInterval(() => {
      this.measureLatency();
    }, 5000);
    
    // Start buffer monitoring
    this.bufferTimer = setInterval(() => {
      this.collectBufferMetrics();
    }, 1000);
  }

  private measureLatency(): void {
    if (!webSocketService.isConnected()) return;
    
    const startTime = Date.now();
    
    webSocketService.sendMessage('ping', { timestamp: startTime });
    
    const handlePong = (wsMessage: WebSocketMessage) => {
      if (wsMessage.type === 'pong') {
        const endTime = Date.now();
        const latency = endTime - startTime;
        
        this.updateLatencyMetrics({ networkLatency: latency });
        webSocketService.off('message:pong', handlePong);
      }
    };
    
    webSocketService.on('message:pong', handlePong);
  }

  private collectBufferMetrics(): void {
    // This would integrate with the video player to collect real buffer metrics
    // For now, we'll simulate the metrics
    
    if (this.currentUser?.playbackState === 'playing') {
      const mockMetrics: Partial<BufferMetrics> = {
        currentBuffer: Math.random() * 10 + 5, // 5-15 seconds
        targetBuffer: 10,
        bufferHealth: Math.random() * 100,
        downloadRate: Math.random() * 1000 + 500, // 500-1500 kbps
      };
      
      this.updateBufferMetrics(mockMetrics);
    }
  }

  private stopSync(): void {
    this.stopAutoSync();
    
    if (this.latencyTimer) {
      clearInterval(this.latencyTimer);
      this.latencyTimer = null;
    }
    
    if (this.bufferTimer) {
      clearInterval(this.bufferTimer);
      this.bufferTimer = null;
    }
    
    this.syncCommands = [];
    this.currentSyncAttempts = 0;
    
    if (this.currentUser) {
      this.currentUser.isSyncing = false;
    }
  }
}

// Singleton instance
export const viewerSyncService = new ViewerSyncService();

// Helper functions
export const initializeViewerSync = async (userId: string, username: string) => {
  return viewerSyncService.initialize(userId, username);
};

export const joinSyncRoom = async (roomId: string, streamId: string) => {
  return viewerSyncService.joinSyncRoom(roomId, streamId);
};

export const updatePlaybackState = async (state: PlaybackState, currentTime?: number) => {
  return viewerSyncService.updatePlaybackState(state, currentTime);
};

export const seekToTime = async (time: number) => {
  return viewerSyncService.seekTo(time);
};

export const requestViewerSync = async () => {
  return viewerSyncService.requestSync();
};