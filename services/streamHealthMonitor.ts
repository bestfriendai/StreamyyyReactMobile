/**
 * Stream Health Monitoring Service
 * Monitors the health and performance of multiple Twitch streams
 */

import { TwitchStream } from './twitchApi';
import { logDebug, logWarning, logError } from '@/utils/errorHandler';

export interface StreamHealthMetrics {
  streamId: string;
  isHealthy: boolean;
  loadTime: number;
  errorCount: number;
  lastError?: string;
  retryAttempts: number;
  lastSuccessfulLoad: string;
  consecutiveFailures: number;
  averageLoadTime: number;
  memoryUsage?: number;
}

export interface StreamPerformanceReport {
  totalStreams: number;
  healthyStreams: number;
  unhealthyStreams: number;
  averageLoadTime: number;
  totalMemoryUsage: number;
  recommendations: string[];
}

class StreamHealthMonitor {
  private healthMetrics = new Map<string, StreamHealthMetrics>();
  private performanceHistory: number[] = [];
  private maxHistoryLength = 50;

  /**
   * Initialize health monitoring for a stream
   */
  initializeStream(stream: TwitchStream): void {
    const streamId = stream.id;
    
    if (!this.healthMetrics.has(streamId)) {
      this.healthMetrics.set(streamId, {
        streamId,
        isHealthy: true,
        loadTime: 0,
        errorCount: 0,
        retryAttempts: 0,
        lastSuccessfulLoad: new Date().toISOString(),
        consecutiveFailures: 0,
        averageLoadTime: 0,
      });
      
      logDebug('Stream health monitoring initialized', { 
        streamId, 
        streamName: stream.user_name 
      });
    }
  }

  /**
   * Record a successful stream load
   */
  recordSuccess(streamId: string, loadTime: number): void {
    const metrics = this.healthMetrics.get(streamId);
    if (!metrics) return;

    // Update metrics
    metrics.isHealthy = true;
    metrics.loadTime = loadTime;
    metrics.lastSuccessfulLoad = new Date().toISOString();
    metrics.consecutiveFailures = 0;
    
    // Update average load time
    this.performanceHistory.push(loadTime);
    if (this.performanceHistory.length > this.maxHistoryLength) {
      this.performanceHistory.shift();
    }
    
    metrics.averageLoadTime = this.performanceHistory.reduce((sum, time) => sum + time, 0) / this.performanceHistory.length;

    logDebug('Stream load success recorded', { 
      streamId, 
      loadTime: `${loadTime}ms`,
      averageLoadTime: `${metrics.averageLoadTime.toFixed(0)}ms`
    });
  }

  /**
   * Record a stream error
   */
  recordError(streamId: string, error: string, isRetrying: boolean = false): void {
    const metrics = this.healthMetrics.get(streamId);
    if (!metrics) return;

    metrics.errorCount++;
    metrics.lastError = error;
    metrics.consecutiveFailures++;
    
    if (isRetrying) {
      metrics.retryAttempts++;
    }

    // Mark as unhealthy after 3 consecutive failures
    if (metrics.consecutiveFailures >= 3) {
      metrics.isHealthy = false;
      logWarning('Stream marked as unhealthy', { 
        streamId, 
        error, 
        consecutiveFailures: metrics.consecutiveFailures 
      });
    } else {
      logDebug('Stream error recorded', { 
        streamId, 
        error, 
        consecutiveFailures: metrics.consecutiveFailures,
        isRetrying 
      });
    }
  }

  /**
   * Get health metrics for a specific stream
   */
  getStreamHealth(streamId: string): StreamHealthMetrics | null {
    return this.healthMetrics.get(streamId) || null;
  }

  /**
   * Get health metrics for all streams
   */
  getAllHealthMetrics(): Map<string, StreamHealthMetrics> {
    return new Map(this.healthMetrics);
  }

  /**
   * Generate a performance report
   */
  generatePerformanceReport(): StreamPerformanceReport {
    const allMetrics = Array.from(this.healthMetrics.values());
    const totalStreams = allMetrics.length;
    const healthyStreams = allMetrics.filter(m => m.isHealthy).length;
    const unhealthyStreams = totalStreams - healthyStreams;
    
    const averageLoadTime = allMetrics.length > 0 
      ? allMetrics.reduce((sum, m) => sum + m.averageLoadTime, 0) / allMetrics.length 
      : 0;

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (unhealthyStreams > totalStreams * 0.3) {
      recommendations.push('Consider reducing the number of active streams to improve stability');
    }
    
    if (averageLoadTime > 5000) {
      recommendations.push('High load times detected - check network connection');
    }
    
    if (totalStreams > 4) {
      recommendations.push('For optimal performance, consider limiting to 4 or fewer streams');
    }

    const report: StreamPerformanceReport = {
      totalStreams,
      healthyStreams,
      unhealthyStreams,
      averageLoadTime,
      totalMemoryUsage: this.estimateMemoryUsage(totalStreams),
      recommendations,
    };

    logDebug('Performance report generated', report);
    return report;
  }

  /**
   * Clean up monitoring for removed streams
   */
  removeStream(streamId: string): void {
    if (this.healthMetrics.delete(streamId)) {
      logDebug('Stream health monitoring removed', { streamId });
    }
  }

  /**
   * Reset all health metrics
   */
  reset(): void {
    this.healthMetrics.clear();
    this.performanceHistory = [];
    logDebug('Stream health monitor reset');
  }

  /**
   * Check if a stream should be auto-retried based on health
   */
  shouldRetryStream(streamId: string): boolean {
    const metrics = this.healthMetrics.get(streamId);
    if (!metrics) return false;

    // Retry if:
    // - Stream has fewer than 5 retry attempts
    // - Last successful load was within 10 minutes
    // - Not consecutively failing for more than 5 times
    const lastSuccessTime = new Date(metrics.lastSuccessfulLoad).getTime();
    const tenMinutesAgo = Date.now() - (10 * 60 * 1000);

    return metrics.retryAttempts < 5 && 
           lastSuccessTime > tenMinutesAgo && 
           metrics.consecutiveFailures <= 5;
  }

  /**
   * Estimate memory usage based on stream count
   */
  private estimateMemoryUsage(streamCount: number): number {
    // Rough estimate: ~50-80MB per WebView stream
    const baseMemoryPerStream = 65; // MB
    return streamCount * baseMemoryPerStream;
  }

  /**
   * Periodic health check for all active streams
   */
  performHealthCheck(): {
    healthyStreams: string[];
    unhealthyStreams: string[];
    needsRetry: string[];
  } {
    const healthy: string[] = [];
    const unhealthy: string[] = [];
    const needsRetry: string[] = [];

    for (const [streamId, metrics] of this.healthMetrics) {
      if (metrics.isHealthy) {
        healthy.push(streamId);
      } else {
        unhealthy.push(streamId);
        
        if (this.shouldRetryStream(streamId)) {
          needsRetry.push(streamId);
        }
      }
    }

    logDebug('Health check completed', {
      healthy: healthy.length,
      unhealthy: unhealthy.length,
      needsRetry: needsRetry.length
    });

    return { healthyStreams: healthy, unhealthyStreams: unhealthy, needsRetry };
  }
}

// Export singleton instance
export const streamHealthMonitor = new StreamHealthMonitor();

// Helper functions for easier use
export const initializeStreamHealth = (stream: TwitchStream) => 
  streamHealthMonitor.initializeStream(stream);

export const recordStreamSuccess = (streamId: string, loadTime: number) => 
  streamHealthMonitor.recordSuccess(streamId, loadTime);

export const recordStreamError = (streamId: string, error: string, isRetrying: boolean = false) => 
  streamHealthMonitor.recordError(streamId, error, isRetrying);

export const getStreamHealthStatus = (streamId: string) => 
  streamHealthMonitor.getStreamHealth(streamId);

export const generateHealthReport = () => 
  streamHealthMonitor.generatePerformanceReport();

export const shouldRetryFailedStream = (streamId: string) => 
  streamHealthMonitor.shouldRetryStream(streamId);