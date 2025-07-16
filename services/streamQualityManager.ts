/**
 * Stream Quality Manager Service
 * Intelligent quality management and adaptive streaming for multiple concurrent streams
 */

import { logDebug, logWarning, logError } from '@/utils/errorHandler';

export type QualityLevel = 'auto' | 'source' | '720p60' | '720p' | '480p' | '360p' | '160p';

export interface QualitySettings {
  level: QualityLevel;
  bitrate: number;
  fps: number;
  resolution: string;
  bandwidth: number; // Required bandwidth in Mbps
}

export interface StreamQualityState {
  streamId: string;
  currentQuality: QualityLevel;
  targetQuality: QualityLevel;
  isAdaptive: boolean;
  lastQualityChange: number;
  bufferHealth: number;
  frameDrops: number;
  bitrate: number;
  fps: number;
  latency: number;
  isThrottled: boolean;
}

export interface QualityChangeEvent {
  streamId: string;
  oldQuality: QualityLevel;
  newQuality: QualityLevel;
  reason: 'bandwidth' | 'performance' | 'manual' | 'error';
  timestamp: number;
}

export interface AdaptiveSettings {
  enabled: boolean;
  aggressiveness: 'conservative' | 'moderate' | 'aggressive';
  minimumQuality: QualityLevel;
  priorityMode: 'balanced' | 'quality' | 'performance';
  batteryOptimization: boolean;
}

const QUALITY_PRESETS: Record<QualityLevel, QualitySettings> = {
  source: {
    level: 'source',
    bitrate: 6000,
    fps: 60,
    resolution: '1920x1080',
    bandwidth: 8.0
  },
  '720p60': {
    level: '720p60',
    bitrate: 4500,
    fps: 60,
    resolution: '1280x720',
    bandwidth: 6.0
  },
  '720p': {
    level: '720p',
    bitrate: 3000,
    fps: 30,
    resolution: '1280x720',
    bandwidth: 4.0
  },
  '480p': {
    level: '480p',
    bitrate: 1500,
    fps: 30,
    resolution: '854x480',
    bandwidth: 2.5
  },
  '360p': {
    level: '360p',
    bitrate: 800,
    fps: 30,
    resolution: '640x360',
    bandwidth: 1.5
  },
  '160p': {
    level: '160p',
    bitrate: 400,
    fps: 30,
    resolution: '284x160',
    bandwidth: 0.8
  },
  auto: {
    level: 'auto',
    bitrate: 0,
    fps: 0,
    resolution: 'adaptive',
    bandwidth: 0
  }
};

class StreamQualityManager {
  private qualityStates = new Map<string, StreamQualityState>();
  private listeners = new Set<(event: QualityChangeEvent) => void>();
  private adaptiveSettings: AdaptiveSettings = {
    enabled: true,
    aggressiveness: 'moderate',
    minimumQuality: '160p',
    priorityMode: 'balanced',
    batteryOptimization: true
  };
  private updateInterval: NodeJS.Timeout | null = null;
  private performanceThresholds = {
    cpuUsage: 70, // Percentage
    memoryUsage: 80, // Percentage
    frameDropThreshold: 5, // Drops per second
    latencyThreshold: 300, // Milliseconds
  };

  constructor() {
    this.startPerformanceMonitoring();
  }

  /**
   * Initialize quality management for a stream
   */
  initializeStream(
    streamId: string, 
    initialQuality: QualityLevel = 'auto',
    isAdaptive: boolean = true
  ): void {
    const state: StreamQualityState = {
      streamId,
      currentQuality: initialQuality,
      targetQuality: initialQuality,
      isAdaptive,
      lastQualityChange: Date.now(),
      bufferHealth: 100,
      frameDrops: 0,
      bitrate: 0,
      fps: 0,
      latency: 0,
      isThrottled: false
    };

    this.qualityStates.set(streamId, state);
    
    logDebug('Stream quality management initialized', {
      streamId,
      initialQuality,
      isAdaptive
    });
  }

  /**
   * Update adaptive settings
   */
  updateAdaptiveSettings(settings: Partial<AdaptiveSettings>): void {
    this.adaptiveSettings = { ...this.adaptiveSettings, ...settings };
    logDebug('Adaptive settings updated', this.adaptiveSettings);
  }

  /**
   * Get current quality settings for a stream
   */
  getStreamQuality(streamId: string): StreamQualityState | null {
    return this.qualityStates.get(streamId) || null;
  }

  /**
   * Manually set quality for a stream
   */
  setStreamQuality(streamId: string, quality: QualityLevel, force: boolean = false): boolean {
    const state = this.qualityStates.get(streamId);
    if (!state) return false;

    // Check if quality change is too frequent (unless forced)
    if (!force && Date.now() - state.lastQualityChange < 5000) {
      logWarning('Quality change too frequent, ignoring', { streamId, quality });
      return false;
    }

    const oldQuality = state.currentQuality;
    state.currentQuality = quality;
    state.targetQuality = quality;
    state.isAdaptive = quality === 'auto';
    state.lastQualityChange = Date.now();

    // Emit quality change event
    this.emitQualityChange({
      streamId,
      oldQuality,
      newQuality: quality,
      reason: 'manual',
      timestamp: Date.now()
    });

    logDebug('Stream quality manually set', {
      streamId,
      oldQuality,
      newQuality: quality
    });

    return true;
  }

  /**
   * Update stream performance metrics
   */
  updateStreamMetrics(
    streamId: string,
    metrics: {
      bufferHealth?: number;
      frameDrops?: number;
      bitrate?: number;
      fps?: number;
      latency?: number;
    }
  ): void {
    const state = this.qualityStates.get(streamId);
    if (!state) return;

    // Update metrics
    if (metrics.bufferHealth !== undefined) state.bufferHealth = metrics.bufferHealth;
    if (metrics.frameDrops !== undefined) state.frameDrops = metrics.frameDrops;
    if (metrics.bitrate !== undefined) state.bitrate = metrics.bitrate;
    if (metrics.fps !== undefined) state.fps = metrics.fps;
    if (metrics.latency !== undefined) state.latency = metrics.latency;

    // Trigger adaptive quality adjustment if enabled
    if (state.isAdaptive && this.adaptiveSettings.enabled) {
      this.evaluateQualityAdjustment(streamId);
    }
  }

  /**
   * Get optimal quality for current network and system conditions
   */
  getOptimalQuality(
    availableBandwidth: number,
    activeStreamCount: number,
    systemLoad: number
  ): QualityLevel {
    const bandwidthPerStream = availableBandwidth / Math.max(activeStreamCount, 1);
    
    // Apply system load penalty
    const effectiveBandwidth = bandwidthPerStream * (1 - systemLoad / 100);
    
    // Select quality based on available bandwidth
    if (effectiveBandwidth >= 6.0 && activeStreamCount <= 2) return 'source';
    if (effectiveBandwidth >= 4.0 && activeStreamCount <= 3) return '720p';
    if (effectiveBandwidth >= 2.5 && activeStreamCount <= 4) return '480p';
    if (effectiveBandwidth >= 1.5) return '360p';
    return '160p';
  }

  /**
   * Apply quality prioritization for focused stream
   */
  prioritizeStream(streamId: string): void {
    const state = this.qualityStates.get(streamId);
    if (!state) return;

    // Reduce quality for other streams
    for (const [otherId, otherState] of this.qualityStates) {
      if (otherId !== streamId && otherState.isAdaptive) {
        this.downgradeStreamQuality(otherId, 'Prioritizing focused stream');
      }
    }

    // Upgrade focused stream quality
    if (state.isAdaptive) {
      this.upgradeStreamQuality(streamId, 'Stream prioritized');
    }

    logDebug('Stream prioritized', { streamId });
  }

  /**
   * Get all available quality levels
   */
  getAvailableQualities(): QualityLevel[] {
    return Object.keys(QUALITY_PRESETS) as QualityLevel[];
  }

  /**
   * Get quality preset information
   */
  getQualityPreset(quality: QualityLevel): QualitySettings {
    return QUALITY_PRESETS[quality];
  }

  /**
   * Calculate total bandwidth usage for all streams
   */
  getTotalBandwidthUsage(): number {
    let totalBandwidth = 0;
    
    for (const state of this.qualityStates.values()) {
      if (state.currentQuality !== 'auto') {
        totalBandwidth += QUALITY_PRESETS[state.currentQuality].bandwidth;
      }
    }
    
    return totalBandwidth;
  }

  /**
   * Get stream quality statistics
   */
  getQualityStatistics(): {
    totalStreams: number;
    qualityDistribution: Record<QualityLevel, number>;
    averageQuality: string;
    adaptiveStreams: number;
    throttledStreams: number;
  } {
    const stats = {
      totalStreams: this.qualityStates.size,
      qualityDistribution: {} as Record<QualityLevel, number>,
      averageQuality: 'unknown',
      adaptiveStreams: 0,
      throttledStreams: 0
    };

    // Initialize quality distribution
    for (const quality of Object.keys(QUALITY_PRESETS) as QualityLevel[]) {
      stats.qualityDistribution[quality] = 0;
    }

    // Count streams by quality
    for (const state of this.qualityStates.values()) {
      stats.qualityDistribution[state.currentQuality]++;
      if (state.isAdaptive) stats.adaptiveStreams++;
      if (state.isThrottled) stats.throttledStreams++;
    }

    return stats;
  }

  /**
   * Subscribe to quality change events
   */
  onQualityChange(listener: (event: QualityChangeEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Remove stream from quality management
   */
  removeStream(streamId: string): void {
    if (this.qualityStates.delete(streamId)) {
      logDebug('Stream removed from quality management', { streamId });
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.qualityStates.clear();
    this.listeners.clear();
  }

  // Private methods

  private startPerformanceMonitoring(): void {
    this.updateInterval = setInterval(() => {
      this.performPeriodicQualityCheck();
    }, 10000); // Check every 10 seconds
  }

  private performPeriodicQualityCheck(): void {
    if (!this.adaptiveSettings.enabled) return;

    for (const [streamId, state] of this.qualityStates) {
      if (state.isAdaptive) {
        this.evaluateQualityAdjustment(streamId);
      }
    }
  }

  private evaluateQualityAdjustment(streamId: string): void {
    const state = this.qualityStates.get(streamId);
    if (!state) return;

    const shouldDowngrade = this.shouldDowngradeQuality(state);
    const shouldUpgrade = this.shouldUpgradeQuality(state);

    if (shouldDowngrade && !shouldUpgrade) {
      this.downgradeStreamQuality(streamId, 'Performance optimization');
    } else if (shouldUpgrade && !shouldDowngrade) {
      this.upgradeStreamQuality(streamId, 'Performance improved');
    }
  }

  private shouldDowngradeQuality(state: StreamQualityState): boolean {
    return (
      state.bufferHealth < 30 ||
      state.frameDrops > this.performanceThresholds.frameDropThreshold ||
      state.latency > this.performanceThresholds.latencyThreshold ||
      this.isSystemUnderLoad()
    );
  }

  private shouldUpgradeQuality(state: StreamQualityState): boolean {
    return (
      state.bufferHealth > 80 &&
      state.frameDrops < 1 &&
      state.latency < 150 &&
      !this.isSystemUnderLoad() &&
      Date.now() - state.lastQualityChange > 30000 // Wait 30s before upgrade
    );
  }

  private downgradeStreamQuality(streamId: string, reason: string): void {
    const state = this.qualityStates.get(streamId);
    if (!state) return;

    const qualities: QualityLevel[] = ['source', '720p60', '720p', '480p', '360p', '160p'];
    const currentIndex = qualities.indexOf(state.currentQuality);
    
    if (currentIndex < qualities.length - 1) {
      const newQuality = qualities[currentIndex + 1];
      const oldQuality = state.currentQuality;
      
      state.currentQuality = newQuality;
      state.targetQuality = newQuality;
      state.lastQualityChange = Date.now();
      state.isThrottled = true;

      this.emitQualityChange({
        streamId,
        oldQuality,
        newQuality,
        reason: 'performance',
        timestamp: Date.now()
      });

      logDebug('Stream quality downgraded', {
        streamId,
        oldQuality,
        newQuality,
        reason
      });
    }
  }

  private upgradeStreamQuality(streamId: string, reason: string): void {
    const state = this.qualityStates.get(streamId);
    if (!state) return;

    const qualities: QualityLevel[] = ['160p', '360p', '480p', '720p', '720p60', 'source'];
    const currentIndex = qualities.indexOf(state.currentQuality);
    
    if (currentIndex < qualities.length - 1) {
      const newQuality = qualities[currentIndex + 1];
      const oldQuality = state.currentQuality;
      
      state.currentQuality = newQuality;
      state.targetQuality = newQuality;
      state.lastQualityChange = Date.now();
      state.isThrottled = false;

      this.emitQualityChange({
        streamId,
        oldQuality,
        newQuality,
        reason: 'performance',
        timestamp: Date.now()
      });

      logDebug('Stream quality upgraded', {
        streamId,
        oldQuality,
        newQuality,
        reason
      });
    }
  }

  private isSystemUnderLoad(): boolean {
    // This would integrate with actual system monitoring
    // For now, use basic heuristics
    const activeStreams = this.qualityStates.size;
    const highQualityStreams = Array.from(this.qualityStates.values())
      .filter(s => ['source', '720p60', '720p'].includes(s.currentQuality)).length;

    return activeStreams > 4 || highQualityStreams > 2;
  }

  private emitQualityChange(event: QualityChangeEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (error) {
        logError('Error in quality change listener', error as Error);
      }
    }
  }
}

// Export singleton instance
export const streamQualityManager = new StreamQualityManager();

// Helper functions
export const initializeStreamQuality = (streamId: string, initialQuality?: QualityLevel) =>
  streamQualityManager.initializeStream(streamId, initialQuality);

export const setStreamQuality = (streamId: string, quality: QualityLevel) =>
  streamQualityManager.setStreamQuality(streamId, quality);

export const updateStreamMetrics = (streamId: string, metrics: any) =>
  streamQualityManager.updateStreamMetrics(streamId, metrics);

export const getOptimalQuality = (bandwidth: number, streamCount: number, systemLoad: number) =>
  streamQualityManager.getOptimalQuality(bandwidth, streamCount, systemLoad);

export const prioritizeStream = (streamId: string) =>
  streamQualityManager.prioritizeStream(streamId);