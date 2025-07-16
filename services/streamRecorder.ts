/**
 * Stream Recorder Service
 * Advanced recording and clip capturing functionality for multi-platform streams
 */

import { logDebug, logWarning, logError } from '@/utils/errorHandler';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Alert } from 'react-native';

export interface RecordingConfig {
  quality: 'low' | 'medium' | 'high' | 'source';
  format: 'mp4' | 'webm' | 'mov';
  frameRate: 30 | 60;
  bitrate: number; // kbps
  resolution: {
    width: number;
    height: number;
  };
  audioEnabled: boolean;
  audioBitrate: number; // kbps
}

export interface ClipConfig {
  duration: number; // seconds
  quality: 'low' | 'medium' | 'high';
  includeAudio: boolean;
  trimStart?: number; // seconds to trim from start
  trimEnd?: number; // seconds to trim from end
}

export interface RecordingSession {
  id: string;
  streamId: string;
  platform: string;
  streamer: string;
  startTime: number;
  endTime?: number;
  duration: number;
  config: RecordingConfig;
  status: 'recording' | 'paused' | 'stopped' | 'processing' | 'completed' | 'failed';
  filePath?: string;
  fileSize: number; // bytes
  thumbnailPath?: string;
  metadata: {
    title: string;
    description: string;
    tags: string[];
    game?: string;
    viewers?: number;
  };
  error?: string;
}

export interface Highlight {
  id: string;
  sessionId: string;
  streamId: string;
  timestamp: number;
  duration: number;
  title: string;
  description: string;
  type: 'manual' | 'auto' | 'ai_detected';
  confidence?: number; // for AI-detected highlights
  tags: string[];
  filePath?: string;
  thumbnailPath?: string;
  viewCount: number;
  shareCount: number;
  rating: number;
  createdAt: number;
}

export interface RecordingStats {
  totalSessions: number;
  totalDuration: number; // milliseconds
  totalFileSize: number; // bytes
  totalHighlights: number;
  averageSessionDuration: number;
  popularTags: { tag: string; count: number }[];
  platformDistribution: Record<string, number>;
  qualityDistribution: Record<string, number>;
  storageUsed: number; // bytes
  storageQuota: number; // bytes
}

const DEFAULT_RECORDING_CONFIG: RecordingConfig = {
  quality: 'high',
  format: 'mp4',
  frameRate: 30,
  bitrate: 2500,
  resolution: { width: 1280, height: 720 },
  audioEnabled: true,
  audioBitrate: 128,
};

const DEFAULT_CLIP_CONFIG: ClipConfig = {
  duration: 30,
  quality: 'medium',
  includeAudio: true,
};

class StreamRecorderService {
  private activeSessions = new Map<string, RecordingSession>();
  private highlights = new Map<string, Highlight>();
  private recordingListeners = new Set<(data: any) => void>();
  private autoHighlightEnabled = true;
  private recordingDirectory: string;
  private maxStorageSize = 5 * 1024 * 1024 * 1024; // 5GB default
  private compressionQueue: string[] = [];
  
  constructor() {
    this.recordingDirectory = FileSystem.documentDirectory + 'recordings/';
    this.initializeStorage();
    this.loadSavedData();
  }

  /**
   * Initialize storage directory
   */
  private async initializeStorage(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.recordingDirectory);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.recordingDirectory, { intermediates: true });
        logDebug('Recording directory created');
      }
    } catch (error) {
      logError('Failed to initialize recording storage', error as Error);
    }
  }

  /**
   * Start recording a stream
   */
  async startRecording(
    streamId: string,
    platform: string,
    streamer: string,
    config: Partial<RecordingConfig> = {},
    metadata: Partial<RecordingSession['metadata']> = {}
  ): Promise<string> {
    try {
      // Check storage space
      const storageInfo = await this.getStorageInfo();
      if (storageInfo.used > storageInfo.quota * 0.9) {
        throw new Error('Insufficient storage space for recording');
      }

      // Check permissions
      const permissionResult = await MediaLibrary.requestPermissionsAsync();
      if (!permissionResult.granted) {
        throw new Error('Media library permission required for recording');
      }

      const sessionId = this.generateSessionId();
      const finalConfig = { ...DEFAULT_RECORDING_CONFIG, ...config };
      
      const session: RecordingSession = {
        id: sessionId,
        streamId,
        platform,
        streamer,
        startTime: Date.now(),
        duration: 0,
        config: finalConfig,
        status: 'recording',
        fileSize: 0,
        metadata: {
          title: `${streamer} - ${new Date().toLocaleDateString()}`,
          description: `Live stream recording from ${platform}`,
          tags: [platform, streamer],
          ...metadata,
        },
      };

      this.activeSessions.set(sessionId, session);
      
      // Start the actual recording process
      await this.initializeRecordingProcess(session);
      
      logDebug('Recording started', { sessionId, streamId, streamer });
      this.notifyListeners({ type: 'recording_started', sessionId, session });
      
      return sessionId;
    } catch (error) {
      logError('Failed to start recording', error as Error);
      throw error;
    }
  }

  /**
   * Stop recording a stream
   */
  async stopRecording(sessionId: string): Promise<RecordingSession> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error('Recording session not found');
    }

    try {
      session.status = 'processing';
      session.endTime = Date.now();
      session.duration = session.endTime - session.startTime;

      // Finalize the recording
      await this.finalizeRecording(session);
      
      session.status = 'completed';
      this.activeSessions.delete(sessionId);
      
      logDebug('Recording stopped', { sessionId, duration: session.duration });
      this.notifyListeners({ type: 'recording_stopped', sessionId, session });
      
      // Generate thumbnail
      await this.generateThumbnail(session);
      
      // Auto-detect highlights if enabled
      if (this.autoHighlightEnabled) {
        this.detectHighlights(session);
      }
      
      return session;
    } catch (error) {
      session.status = 'failed';
      session.error = error instanceof Error ? error.message : 'Unknown error';
      logError('Failed to stop recording', error as Error);
      throw error;
    }
  }

  /**
   * Pause recording
   */
  async pauseRecording(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error('Recording session not found');
    }

    session.status = 'paused';
    logDebug('Recording paused', { sessionId });
    this.notifyListeners({ type: 'recording_paused', sessionId });
  }

  /**
   * Resume recording
   */
  async resumeRecording(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error('Recording session not found');
    }

    session.status = 'recording';
    logDebug('Recording resumed', { sessionId });
    this.notifyListeners({ type: 'recording_resumed', sessionId });
  }

  /**
   * Create a clip from current stream
   */
  async createClip(
    streamId: string,
    clipConfig: Partial<ClipConfig> = {},
    metadata: { title: string; description?: string; tags?: string[] } = { title: 'Stream Clip' }
  ): Promise<Highlight> {
    try {
      const config = { ...DEFAULT_CLIP_CONFIG, ...clipConfig };
      const highlightId = this.generateHighlightId();
      
      const highlight: Highlight = {
        id: highlightId,
        sessionId: 'instant_clip',
        streamId,
        timestamp: Date.now(),
        duration: config.duration * 1000, // Convert to milliseconds
        title: metadata.title,
        description: metadata.description || 'Instant clip',
        type: 'manual',
        tags: metadata.tags || [],
        viewCount: 0,
        shareCount: 0,
        rating: 0,
        createdAt: Date.now(),
      };

      // Start clip creation process
      await this.createClipFile(highlight, config);
      
      this.highlights.set(highlightId, highlight);
      
      logDebug('Clip created', { highlightId, streamId });
      this.notifyListeners({ type: 'clip_created', highlightId, highlight });
      
      return highlight;
    } catch (error) {
      logError('Failed to create clip', error as Error);
      throw error;
    }
  }

  /**
   * Create highlight from existing recording
   */
  async createHighlight(
    sessionId: string,
    startTime: number,
    duration: number,
    metadata: { title: string; description?: string; tags?: string[] }
  ): Promise<Highlight> {
    try {
      const highlightId = this.generateHighlightId();
      
      const highlight: Highlight = {
        id: highlightId,
        sessionId,
        streamId: '', // Will be filled from session data
        timestamp: startTime,
        duration: duration * 1000, // Convert to milliseconds
        title: metadata.title,
        description: metadata.description || '',
        type: 'manual',
        tags: metadata.tags || [],
        viewCount: 0,
        shareCount: 0,
        rating: 0,
        createdAt: Date.now(),
      };

      // Extract highlight from recording
      await this.extractHighlight(highlight);
      
      this.highlights.set(highlightId, highlight);
      
      logDebug('Highlight created', { highlightId, sessionId });
      this.notifyListeners({ type: 'highlight_created', highlightId, highlight });
      
      return highlight;
    } catch (error) {
      logError('Failed to create highlight', error as Error);
      throw error;
    }
  }

  /**
   * Get all recording sessions
   */
  getRecordingSessions(): RecordingSession[] {
    return Array.from(this.activeSessions.values());
  }

  /**
   * Get all highlights
   */
  getHighlights(filter?: { sessionId?: string; tags?: string[]; type?: string }): Highlight[] {
    let highlights = Array.from(this.highlights.values());
    
    if (filter) {
      if (filter.sessionId) {
        highlights = highlights.filter(h => h.sessionId === filter.sessionId);
      }
      if (filter.tags) {
        highlights = highlights.filter(h => 
          filter.tags!.some(tag => h.tags.includes(tag))
        );
      }
      if (filter.type) {
        highlights = highlights.filter(h => h.type === filter.type);
      }
    }
    
    return highlights.sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Get recording statistics
   */
  async getRecordingStats(): Promise<RecordingStats> {
    const sessions = Array.from(this.activeSessions.values());
    const highlights = Array.from(this.highlights.values());
    const storageInfo = await this.getStorageInfo();
    
    const stats: RecordingStats = {
      totalSessions: sessions.length,
      totalDuration: sessions.reduce((sum, s) => sum + s.duration, 0),
      totalFileSize: sessions.reduce((sum, s) => sum + s.fileSize, 0),
      totalHighlights: highlights.length,
      averageSessionDuration: sessions.length > 0 
        ? sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length 
        : 0,
      popularTags: this.calculatePopularTags(highlights),
      platformDistribution: this.calculatePlatformDistribution(sessions),
      qualityDistribution: this.calculateQualityDistribution(sessions),
      storageUsed: storageInfo.used,
      storageQuota: storageInfo.quota,
    };
    
    return stats;
  }

  /**
   * Delete recording session
   */
  async deleteRecording(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error('Recording session not found');
    }

    try {
      // Delete files
      if (session.filePath) {
        await FileSystem.deleteAsync(session.filePath, { idempotent: true });
      }
      if (session.thumbnailPath) {
        await FileSystem.deleteAsync(session.thumbnailPath, { idempotent: true });
      }

      // Delete associated highlights
      const associatedHighlights = this.getHighlights({ sessionId });
      for (const highlight of associatedHighlights) {
        await this.deleteHighlight(highlight.id);
      }

      this.activeSessions.delete(sessionId);
      
      logDebug('Recording deleted', { sessionId });
      this.notifyListeners({ type: 'recording_deleted', sessionId });
    } catch (error) {
      logError('Failed to delete recording', error as Error);
      throw error;
    }
  }

  /**
   * Delete highlight
   */
  async deleteHighlight(highlightId: string): Promise<void> {
    const highlight = this.highlights.get(highlightId);
    if (!highlight) {
      throw new Error('Highlight not found');
    }

    try {
      // Delete files
      if (highlight.filePath) {
        await FileSystem.deleteAsync(highlight.filePath, { idempotent: true });
      }
      if (highlight.thumbnailPath) {
        await FileSystem.deleteAsync(highlight.thumbnailPath, { idempotent: true });
      }

      this.highlights.delete(highlightId);
      
      logDebug('Highlight deleted', { highlightId });
      this.notifyListeners({ type: 'highlight_deleted', highlightId });
    } catch (error) {
      logError('Failed to delete highlight', error as Error);
      throw error;
    }
  }

  /**
   * Share highlight
   */
  async shareHighlight(highlightId: string, platform: 'social' | 'clipboard' | 'file'): Promise<void> {
    const highlight = this.highlights.get(highlightId);
    if (!highlight) {
      throw new Error('Highlight not found');
    }

    try {
      switch (platform) {
        case 'social':
          // Implement social sharing
          break;
        case 'clipboard':
          // Copy file path to clipboard
          break;
        case 'file':
          // Save to media library
          if (highlight.filePath) {
            await MediaLibrary.saveToLibraryAsync(highlight.filePath);
          }
          break;
      }

      highlight.shareCount++;
      this.notifyListeners({ type: 'highlight_shared', highlightId, platform });
    } catch (error) {
      logError('Failed to share highlight', error as Error);
      throw error;
    }
  }

  /**
   * Configure auto-highlight detection
   */
  setAutoHighlightEnabled(enabled: boolean): void {
    this.autoHighlightEnabled = enabled;
    logDebug('Auto-highlight detection', { enabled });
  }

  /**
   * Set maximum storage size
   */
  setMaxStorageSize(sizeInBytes: number): void {
    this.maxStorageSize = sizeInBytes;
    logDebug('Max storage size updated', { size: sizeInBytes });
  }

  /**
   * Subscribe to recording events
   */
  onRecordingEvent(listener: (data: any) => void): () => void {
    this.recordingListeners.add(listener);
    return () => this.recordingListeners.delete(listener);
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.recordingListeners.clear();
    this.activeSessions.clear();
    this.highlights.clear();
    logDebug('Stream recorder service destroyed');
  }

  // Private helper methods

  private generateSessionId(): string {
    return `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateHighlightId(): string {
    return `highlight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async initializeRecordingProcess(session: RecordingSession): Promise<void> {
    // This would integrate with actual screen recording APIs
    // For now, we simulate the recording process
    const filename = `${session.id}.${session.config.format}`;
    session.filePath = this.recordingDirectory + filename;
    
    logDebug('Recording process initialized', { sessionId: session.id, filePath: session.filePath });
  }

  private async finalizeRecording(session: RecordingSession): Promise<void> {
    // Simulate recording finalization
    // In a real implementation, this would stop the recording process
    session.fileSize = Math.floor(Math.random() * 100) * 1024 * 1024; // Random size for demo
    
    logDebug('Recording finalized', { sessionId: session.id, fileSize: session.fileSize });
  }

  private async generateThumbnail(session: RecordingSession): Promise<void> {
    if (!session.filePath) return;
    
    // Generate thumbnail from video
    const thumbnailPath = session.filePath.replace(/\.[^/.]+$/, '_thumb.jpg');
    session.thumbnailPath = thumbnailPath;
    
    logDebug('Thumbnail generated', { sessionId: session.id, thumbnailPath });
  }

  private async detectHighlights(session: RecordingSession): Promise<void> {
    // AI-based highlight detection would go here
    // For now, we create sample highlights
    const sampleHighlights = [
      {
        timestamp: session.startTime + 30000, // 30 seconds in
        duration: 15000, // 15 seconds
        title: 'Great Play',
        confidence: 0.8,
      },
      {
        timestamp: session.startTime + 120000, // 2 minutes in
        duration: 20000, // 20 seconds
        title: 'Epic Moment',
        confidence: 0.9,
      },
    ];

    for (const highlight of sampleHighlights) {
      const highlightId = this.generateHighlightId();
      const fullHighlight: Highlight = {
        id: highlightId,
        sessionId: session.id,
        streamId: session.streamId,
        timestamp: highlight.timestamp,
        duration: highlight.duration,
        title: highlight.title,
        description: 'Auto-detected highlight',
        type: 'ai_detected',
        confidence: highlight.confidence,
        tags: ['auto', session.platform],
        viewCount: 0,
        shareCount: 0,
        rating: 0,
        createdAt: Date.now(),
      };

      this.highlights.set(highlightId, fullHighlight);
    }

    logDebug('Auto-highlights detected', { sessionId: session.id, count: sampleHighlights.length });
  }

  private async createClipFile(highlight: Highlight, config: ClipConfig): Promise<void> {
    // Create clip file from live stream
    const filename = `${highlight.id}.mp4`;
    highlight.filePath = this.recordingDirectory + filename;
    
    logDebug('Clip file created', { highlightId: highlight.id, filePath: highlight.filePath });
  }

  private async extractHighlight(highlight: Highlight): Promise<void> {
    // Extract highlight from existing recording
    const filename = `${highlight.id}_highlight.mp4`;
    highlight.filePath = this.recordingDirectory + filename;
    
    logDebug('Highlight extracted', { highlightId: highlight.id, filePath: highlight.filePath });
  }

  private async getStorageInfo(): Promise<{ used: number; quota: number }> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.recordingDirectory);
      const used = dirInfo.exists ? (dirInfo.size || 0) : 0;
      return { used, quota: this.maxStorageSize };
    } catch (error) {
      return { used: 0, quota: this.maxStorageSize };
    }
  }

  private calculatePopularTags(highlights: Highlight[]): { tag: string; count: number }[] {
    const tagCounts = new Map<string, number>();
    
    highlights.forEach(highlight => {
      highlight.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });
    
    return Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private calculatePlatformDistribution(sessions: RecordingSession[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    sessions.forEach(session => {
      distribution[session.platform] = (distribution[session.platform] || 0) + 1;
    });
    return distribution;
  }

  private calculateQualityDistribution(sessions: RecordingSession[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    sessions.forEach(session => {
      distribution[session.config.quality] = (distribution[session.config.quality] || 0) + 1;
    });
    return distribution;
  }

  private loadSavedData(): void {
    // Load saved recordings and highlights from persistent storage
    // This would be implemented with AsyncStorage or similar
    logDebug('Saved recording data loaded');
  }

  private notifyListeners(data: any): void {
    for (const listener of this.recordingListeners) {
      try {
        listener(data);
      } catch (error) {
        logError('Error in recording listener', error as Error);
      }
    }
  }
}

// Export singleton instance
export const streamRecorder = new StreamRecorderService();

// Export utility functions
export const startRecording = (streamId: string, platform: string, streamer: string, config?: Partial<RecordingConfig>) =>
  streamRecorder.startRecording(streamId, platform, streamer, config);

export const stopRecording = (sessionId: string) =>
  streamRecorder.stopRecording(sessionId);

export const createClip = (streamId: string, config?: Partial<ClipConfig>, metadata?: any) =>
  streamRecorder.createClip(streamId, config, metadata);

export const createHighlight = (sessionId: string, startTime: number, duration: number, metadata: any) =>
  streamRecorder.createHighlight(sessionId, startTime, duration, metadata);

export const getRecordingSessions = () =>
  streamRecorder.getRecordingSessions();

export const getHighlights = (filter?: any) =>
  streamRecorder.getHighlights(filter);

export const getRecordingStats = () =>
  streamRecorder.getRecordingStats();

export default streamRecorder;