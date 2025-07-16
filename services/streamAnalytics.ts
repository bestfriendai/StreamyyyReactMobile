/**
 * Stream Analytics Service
 * Advanced analytics and insights for multi-platform streaming performance
 */

import { logDebug, logWarning, logError } from '@/utils/errorHandler';
import { performanceOptimizer } from './performanceOptimizer';
import { bandwidthMonitor } from './bandwidthMonitor';
import { streamQualityManager } from './streamQualityManager';
import { streamHealthMonitor } from './streamHealthMonitor';

export interface StreamMetrics {
  streamId: string;
  platform: string;
  streamer: string;
  startTime: number;
  endTime?: number;
  duration: number;
  viewTime: number;
  bufferEvents: number;
  qualityChanges: number;
  errors: number;
  averageQuality: string;
  peakQuality: string;
  lowestQuality: string;
  averageBitrate: number;
  peakBitrate: number;
  averageFPS: number;
  averageLatency: number;
  dataUsage: number; // MB
  retryAttempts: number;
  crashEvents: number;
}

export interface SessionAnalytics {
  sessionId: string;
  startTime: number;
  endTime?: number;
  totalDuration: number;
  totalStreams: number;
  uniquePlatforms: string[];
  totalViewTime: number;
  totalDataUsage: number;
  averageStreamCount: number;
  peakStreamCount: number;
  totalBufferEvents: number;
  totalErrors: number;
  totalRetries: number;
  systemPerformance: {
    averageCPU: number;
    peakCPU: number;
    averageMemory: number;
    peakMemory: number;
    averageBandwidth: number;
    lowestBandwidth: number;
  };
  qualityDistribution: Record<string, number>;
  platformUsage: Record<string, number>;
  engagement: {
    streamSwitches: number;
    qualityAdjustments: number;
    layoutChanges: number;
  };
}

export interface PerformanceInsights {
  overallRating: 'excellent' | 'good' | 'fair' | 'poor';
  bottlenecks: string[];
  recommendations: {
    category: string;
    priority: 'high' | 'medium' | 'low';
    description: string;
    impact: string;
    actionable: boolean;
  }[];
  optimizations: {
    appliedCount: number;
    potentialSavings: {
      cpu: number;
      memory: number;
      bandwidth: number;
    };
  };
}

export interface UserBehaviorAnalytics {
  preferredPlatforms: { platform: string; usage: number }[];
  preferredQuality: string;
  averageSessionDuration: number;
  peakConcurrentStreams: number;
  mostWatchedCategories: { category: string; time: number }[];
  streamingPatterns: {
    peakHours: number[];
    averageStreamsPerSession: number;
    layoutPreferences: Record<string, number>;
  };
  qualityPreferences: {
    autoQuality: boolean;
    manualAdjustments: number;
    preferredResolution: string;
  };
}

class StreamAnalyticsService {
  private streamMetrics = new Map<string, StreamMetrics>();
  private sessionMetrics: SessionAnalytics | null = null;
  private performanceHistory: any[] = [];
  private userBehavior: UserBehaviorAnalytics | null = null;
  private analyticsListeners = new Set<(data: any) => void>();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private sessionStartTime = Date.now();

  constructor() {
    this.initializeSession();
    this.startMonitoring();
    this.loadUserBehavior();
  }

  /**
   * Initialize a new analytics session
   */
  private initializeSession(): void {
    this.sessionMetrics = {
      sessionId: this.generateSessionId(),
      startTime: Date.now(),
      totalDuration: 0,
      totalStreams: 0,
      uniquePlatforms: [],
      totalViewTime: 0,
      totalDataUsage: 0,
      averageStreamCount: 0,
      peakStreamCount: 0,
      totalBufferEvents: 0,
      totalErrors: 0,
      totalRetries: 0,
      systemPerformance: {
        averageCPU: 0,
        peakCPU: 0,
        averageMemory: 0,
        peakMemory: 0,
        averageBandwidth: 0,
        lowestBandwidth: 100,
      },
      qualityDistribution: {},
      platformUsage: {},
      engagement: {
        streamSwitches: 0,
        qualityAdjustments: 0,
        layoutChanges: 0,
      },
    };

    logDebug('Analytics session initialized', { sessionId: this.sessionMetrics.sessionId });
  }

  /**
   * Start monitoring system and stream performance
   */
  private startMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.collectPerformanceData();
      this.updateSessionMetrics();
      this.analyzePerformance();
    }, 5000);
  }

  /**
   * Track when a stream starts playing
   */
  trackStreamStart(streamId: string, platform: string, streamer: string): void {
    const metrics: StreamMetrics = {
      streamId,
      platform,
      streamer,
      startTime: Date.now(),
      duration: 0,
      viewTime: 0,
      bufferEvents: 0,
      qualityChanges: 0,
      errors: 0,
      averageQuality: 'auto',
      peakQuality: 'auto',
      lowestQuality: 'auto',
      averageBitrate: 0,
      peakBitrate: 0,
      averageFPS: 0,
      averageLatency: 0,
      dataUsage: 0,
      retryAttempts: 0,
      crashEvents: 0,
    };

    this.streamMetrics.set(streamId, metrics);
    
    // Update session metrics
    if (this.sessionMetrics) {
      this.sessionMetrics.totalStreams++;
      if (!this.sessionMetrics.uniquePlatforms.includes(platform)) {
        this.sessionMetrics.uniquePlatforms.push(platform);
      }
      this.sessionMetrics.platformUsage[platform] = (this.sessionMetrics.platformUsage[platform] || 0) + 1;
    }

    logDebug('Stream tracking started', { streamId, platform, streamer });
    this.notifyListeners({ type: 'stream_start', streamId, platform, streamer });
  }

  /**
   * Track when a stream ends
   */
  trackStreamEnd(streamId: string): void {
    const metrics = this.streamMetrics.get(streamId);
    if (!metrics) return;

    metrics.endTime = Date.now();
    metrics.duration = metrics.endTime - metrics.startTime;

    // Update session totals
    if (this.sessionMetrics) {
      this.sessionMetrics.totalViewTime += metrics.viewTime;
      this.sessionMetrics.totalDataUsage += metrics.dataUsage;
      this.sessionMetrics.totalBufferEvents += metrics.bufferEvents;
      this.sessionMetrics.totalErrors += metrics.errors;
      this.sessionMetrics.totalRetries += metrics.retryAttempts;
    }

    logDebug('Stream tracking ended', { 
      streamId, 
      duration: metrics.duration,
      viewTime: metrics.viewTime 
    });
    
    this.notifyListeners({ type: 'stream_end', streamId, metrics });
  }

  /**
   * Track quality changes
   */
  trackQualityChange(streamId: string, oldQuality: string, newQuality: string, reason: string): void {
    const metrics = this.streamMetrics.get(streamId);
    if (!metrics) return;

    metrics.qualityChanges++;
    
    // Update quality tracking
    if (this.isHigherQuality(newQuality, metrics.peakQuality)) {
      metrics.peakQuality = newQuality;
    }
    if (this.isLowerQuality(newQuality, metrics.lowestQuality)) {
      metrics.lowestQuality = newQuality;
    }

    // Update session engagement
    if (this.sessionMetrics) {
      this.sessionMetrics.engagement.qualityAdjustments++;
      this.sessionMetrics.qualityDistribution[newQuality] = 
        (this.sessionMetrics.qualityDistribution[newQuality] || 0) + 1;
    }

    logDebug('Quality change tracked', { streamId, oldQuality, newQuality, reason });
    this.notifyListeners({ 
      type: 'quality_change', 
      streamId, 
      oldQuality, 
      newQuality, 
      reason 
    });
  }

  /**
   * Track buffer events
   */
  trackBufferEvent(streamId: string, duration: number): void {
    const metrics = this.streamMetrics.get(streamId);
    if (!metrics) return;

    metrics.bufferEvents++;
    
    logDebug('Buffer event tracked', { streamId, duration });
    this.notifyListeners({ type: 'buffer_event', streamId, duration });
  }

  /**
   * Track errors
   */
  trackError(streamId: string, error: string, isCritical: boolean = false): void {
    const metrics = this.streamMetrics.get(streamId);
    if (!metrics) return;

    metrics.errors++;
    if (isCritical) {
      metrics.crashEvents++;
    }

    logDebug('Error tracked', { streamId, error, isCritical });
    this.notifyListeners({ type: 'error', streamId, error, isCritical });
  }

  /**
   * Track retry attempts
   */
  trackRetry(streamId: string): void {
    const metrics = this.streamMetrics.get(streamId);
    if (!metrics) return;

    metrics.retryAttempts++;
    
    logDebug('Retry tracked', { streamId });
    this.notifyListeners({ type: 'retry', streamId });
  }

  /**
   * Track user engagement actions
   */
  trackEngagement(action: 'stream_switch' | 'layout_change' | 'manual_quality', data?: any): void {
    if (!this.sessionMetrics) return;

    switch (action) {
      case 'stream_switch':
        this.sessionMetrics.engagement.streamSwitches++;
        break;
      case 'layout_change':
        this.sessionMetrics.engagement.layoutChanges++;
        break;
      case 'manual_quality':
        this.sessionMetrics.engagement.qualityAdjustments++;
        break;
    }

    logDebug('Engagement tracked', { action, data });
    this.notifyListeners({ type: 'engagement', action, data });
  }

  /**
   * Get real-time analytics for a specific stream
   */
  getStreamAnalytics(streamId: string): StreamMetrics | null {
    return this.streamMetrics.get(streamId) || null;
  }

  /**
   * Get current session analytics
   */
  getSessionAnalytics(): SessionAnalytics | null {
    if (!this.sessionMetrics) return null;

    // Update duration
    this.sessionMetrics.totalDuration = Date.now() - this.sessionMetrics.startTime;
    
    // Calculate averages
    const activeStreams = this.streamMetrics.size;
    this.sessionMetrics.averageStreamCount = this.sessionMetrics.totalStreams > 0 
      ? this.sessionMetrics.totalViewTime / this.sessionMetrics.totalDuration 
      : 0;

    return { ...this.sessionMetrics };
  }

  /**
   * Generate performance insights and recommendations
   */
  generateInsights(): PerformanceInsights {
    const insights: PerformanceInsights = {
      overallRating: 'good',
      bottlenecks: [],
      recommendations: [],
      optimizations: {
        appliedCount: 0,
        potentialSavings: {
          cpu: 0,
          memory: 0,
          bandwidth: 0,
        },
      },
    };

    if (!this.sessionMetrics) return insights;

    // Analyze performance
    const avgCPU = this.sessionMetrics.systemPerformance.averageCPU;
    const avgMemory = this.sessionMetrics.systemPerformance.averageMemory;
    const errorRate = this.sessionMetrics.totalErrors / Math.max(this.sessionMetrics.totalStreams, 1);
    const bufferRate = this.sessionMetrics.totalBufferEvents / Math.max(this.sessionMetrics.totalViewTime / 1000, 1);

    // Determine overall rating
    if (avgCPU > 80 || avgMemory > 85 || errorRate > 0.1 || bufferRate > 2) {
      insights.overallRating = 'poor';
    } else if (avgCPU > 60 || avgMemory > 70 || errorRate > 0.05 || bufferRate > 1) {
      insights.overallRating = 'fair';
    } else if (avgCPU > 40 || avgMemory > 50 || errorRate > 0.02 || bufferRate > 0.5) {
      insights.overallRating = 'good';
    } else {
      insights.overallRating = 'excellent';
    }

    // Identify bottlenecks
    if (avgCPU > 70) insights.bottlenecks.push('CPU usage is high');
    if (avgMemory > 75) insights.bottlenecks.push('Memory usage is high');
    if (this.sessionMetrics.systemPerformance.averageBandwidth < 5) {
      insights.bottlenecks.push('Network bandwidth is limited');
    }
    if (bufferRate > 1) insights.bottlenecks.push('Frequent buffering detected');

    // Generate recommendations
    if (avgCPU > 70) {
      insights.recommendations.push({
        category: 'Performance',
        priority: 'high',
        description: 'Reduce CPU usage by limiting concurrent streams or lowering quality',
        impact: 'Smoother playback, reduced device heat',
        actionable: true,
      });
    }

    if (avgMemory > 75) {
      insights.recommendations.push({
        category: 'Performance',
        priority: 'high',
        description: 'Free up memory by closing unused streams or apps',
        impact: 'Prevent crashes and improve responsiveness',
        actionable: true,
      });
    }

    if (this.sessionMetrics.totalStreams > 6) {
      insights.recommendations.push({
        category: 'Optimization',
        priority: 'medium',
        description: 'Consider using fewer concurrent streams for better performance',
        impact: 'Improved quality and stability',
        actionable: true,
      });
    }

    if (errorRate > 0.05) {
      insights.recommendations.push({
        category: 'Stability',
        priority: 'high',
        description: 'Check network connection and platform stability',
        impact: 'Reduced interruptions and better viewing experience',
        actionable: true,
      });
    }

    return insights;
  }

  /**
   * Export analytics data for reporting
   */
  exportAnalytics(): {
    session: SessionAnalytics | null;
    streams: StreamMetrics[];
    insights: PerformanceInsights;
    userBehavior: UserBehaviorAnalytics | null;
  } {
    return {
      session: this.getSessionAnalytics(),
      streams: Array.from(this.streamMetrics.values()),
      insights: this.generateInsights(),
      userBehavior: this.userBehavior,
    };
  }

  /**
   * Subscribe to analytics events
   */
  onAnalyticsUpdate(listener: (data: any) => void): () => void {
    this.analyticsListeners.add(listener);
    return () => this.analyticsListeners.delete(listener);
  }

  /**
   * Reset analytics data
   */
  reset(): void {
    this.streamMetrics.clear();
    this.performanceHistory = [];
    this.initializeSession();
    logDebug('Analytics data reset');
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.analyticsListeners.clear();
    this.streamMetrics.clear();
    this.performanceHistory = [];
    logDebug('Analytics service destroyed');
  }

  // Private helper methods

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private collectPerformanceData(): void {
    const performance = performanceOptimizer.getCurrentPerformance();
    const bandwidth = bandwidthMonitor.getCurrentBandwidth();
    
    if (performance && bandwidth) {
      this.performanceHistory.push({
        timestamp: Date.now(),
        cpu: performance.cpuUsage,
        memory: performance.memoryUsage,
        bandwidth: bandwidth.downloadSpeed,
        activeStreams: this.streamMetrics.size,
      });

      // Keep only last 100 data points
      if (this.performanceHistory.length > 100) {
        this.performanceHistory.shift();
      }
    }
  }

  private updateSessionMetrics(): void {
    if (!this.sessionMetrics || this.performanceHistory.length === 0) return;

    const latest = this.performanceHistory[this.performanceHistory.length - 1];
    const performance = this.sessionMetrics.systemPerformance;

    // Update peak values
    performance.peakCPU = Math.max(performance.peakCPU, latest.cpu);
    performance.peakMemory = Math.max(performance.peakMemory, latest.memory);
    performance.lowestBandwidth = Math.min(performance.lowestBandwidth, latest.bandwidth);

    // Update averages
    const dataPoints = this.performanceHistory.slice(-20); // Last 20 points
    performance.averageCPU = dataPoints.reduce((sum, p) => sum + p.cpu, 0) / dataPoints.length;
    performance.averageMemory = dataPoints.reduce((sum, p) => sum + p.memory, 0) / dataPoints.length;
    performance.averageBandwidth = dataPoints.reduce((sum, p) => sum + p.bandwidth, 0) / dataPoints.length;

    // Update peak stream count
    this.sessionMetrics.peakStreamCount = Math.max(
      this.sessionMetrics.peakStreamCount, 
      this.streamMetrics.size
    );
  }

  private analyzePerformance(): void {
    // Update individual stream metrics
    for (const [streamId, metrics] of this.streamMetrics) {
      const qualityState = streamQualityManager.getStreamQuality(streamId);
      const healthState = streamHealthMonitor.getStreamHealth(streamId);

      if (qualityState) {
        metrics.averageBitrate = qualityState.bitrate;
        metrics.averageFPS = qualityState.fps;
        metrics.averageLatency = qualityState.latency;
        metrics.peakBitrate = Math.max(metrics.peakBitrate, qualityState.bitrate);
      }

      if (healthState && !healthState.isHealthy) {
        metrics.errors = healthState.consecutiveErrors;
      }

      // Estimate data usage (very rough approximation)
      if (metrics.averageBitrate > 0) {
        const durationHours = (Date.now() - metrics.startTime) / (1000 * 60 * 60);
        metrics.dataUsage = (metrics.averageBitrate * durationHours * 0.45) / 8; // Convert to MB
      }

      // Update view time
      metrics.viewTime = Date.now() - metrics.startTime;
    }
  }

  private isHigherQuality(quality1: string, quality2: string): boolean {
    const qualityOrder = ['160p', '360p', '480p', '720p', '720p60', 'source'];
    return qualityOrder.indexOf(quality1) > qualityOrder.indexOf(quality2);
  }

  private isLowerQuality(quality1: string, quality2: string): boolean {
    const qualityOrder = ['160p', '360p', '480p', '720p', '720p60', 'source'];
    return qualityOrder.indexOf(quality1) < qualityOrder.indexOf(quality2);
  }

  private loadUserBehavior(): void {
    // This would load from persistent storage in a real implementation
    this.userBehavior = {
      preferredPlatforms: [
        { platform: 'twitch', usage: 0.7 },
        { platform: 'youtube', usage: 0.2 },
        { platform: 'kick', usage: 0.1 },
      ],
      preferredQuality: 'auto',
      averageSessionDuration: 45 * 60 * 1000, // 45 minutes
      peakConcurrentStreams: 4,
      mostWatchedCategories: [
        { category: 'Gaming', time: 80 },
        { category: 'Just Chatting', time: 15 },
        { category: 'Music', time: 5 },
      ],
      streamingPatterns: {
        peakHours: [19, 20, 21, 22], // 7-10 PM
        averageStreamsPerSession: 2.5,
        layoutPreferences: {
          grid: 0.4,
          focus: 0.3,
          theater: 0.2,
          pip: 0.1,
        },
      },
      qualityPreferences: {
        autoQuality: true,
        manualAdjustments: 0.2,
        preferredResolution: '720p',
      },
    };
  }

  private notifyListeners(data: any): void {
    for (const listener of this.analyticsListeners) {
      try {
        listener(data);
      } catch (error) {
        logError('Error in analytics listener', error as Error);
      }
    }
  }
}

// Export singleton instance
export const streamAnalytics = new StreamAnalyticsService();

// Export utility functions
export const trackStreamStart = (streamId: string, platform: string, streamer: string) =>
  streamAnalytics.trackStreamStart(streamId, platform, streamer);

export const trackStreamEnd = (streamId: string) =>
  streamAnalytics.trackStreamEnd(streamId);

export const trackQualityChange = (streamId: string, oldQuality: string, newQuality: string, reason: string) =>
  streamAnalytics.trackQualityChange(streamId, oldQuality, newQuality, reason);

export const trackBufferEvent = (streamId: string, duration: number) =>
  streamAnalytics.trackBufferEvent(streamId, duration);

export const trackError = (streamId: string, error: string, isCritical?: boolean) =>
  streamAnalytics.trackError(streamId, error, isCritical);

export const trackRetry = (streamId: string) =>
  streamAnalytics.trackRetry(streamId);

export const trackEngagement = (action: string, data?: any) =>
  streamAnalytics.trackEngagement(action as any, data);

export const getSessionAnalytics = () =>
  streamAnalytics.getSessionAnalytics();

export const generateInsights = () =>
  streamAnalytics.generateInsights();

export default streamAnalytics;