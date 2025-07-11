/**
 * Performance Monitoring Utilities for React Native Multi-Stream App
 * Provides comprehensive performance tracking and optimization recommendations
 */

import React from 'react';

interface PerformanceMetrics {
  componentRenderCount: number;
  memoryUsage: number;
  streamLoadTimes: Record<string, number>;
  fpsData: number[];
  networkLatency: number;
  errorCount: number;
  warningCount: number;
  lastMeasurement: number;
}

interface RenderMetrics {
  componentName: string;
  renderTime: number;
  propsCount: number;
  isOptimized: boolean;
}

interface MemoryMetrics {
  used: number;
  total: number;
  percentage: number;
  jsHeapSizeLimit?: number;
  usedJSHeapSize?: number;
  totalJSHeapSize?: number;
}

interface StreamMetrics {
  streamId: string;
  loadTime: number;
  errorCount: number;
  reconnectCount: number;
  avgLatency: number;
  qualityChanges: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics;
  private renderHistory: RenderMetrics[] = [];
  private memoryHistory: MemoryMetrics[] = [];
  private streamMetrics: Map<string, StreamMetrics> = new Map();
  private fpsTimer: NodeJS.Timeout | null = null;
  private memoryTimer: ReturnType<typeof setInterval> | null = null;
  private isMonitoring: boolean = false;

  constructor() {
    this.metrics = {
      componentRenderCount: 0,
      memoryUsage: 0,
      streamLoadTimes: {},
      fpsData: [],
      networkLatency: 0,
      errorCount: 0,
      warningCount: 0,
      lastMeasurement: Date.now(),
    };
  }

  /**
   * Start performance monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log('📊 Performance monitoring started');
    
    // Monitor FPS
    this.startFPSMonitoring();
    
    // Monitor memory usage
    this.startMemoryMonitoring();
    
    // Setup global error tracking
    this.setupErrorTracking();
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    console.log('📊 Performance monitoring stopped');
    
    if (this.fpsTimer) {
      clearInterval(this.fpsTimer);
      this.fpsTimer = null;
    }
    
    if (this.memoryTimer) {
      clearInterval(this.memoryTimer);
      this.memoryTimer = null;
    }
  }

  /**
   * Track component render performance
   */
  trackComponentRender(componentName: string, renderTime: number, propsCount: number = 0): void {
    this.metrics.componentRenderCount++;
    
    const renderMetric: RenderMetrics = {
      componentName,
      renderTime,
      propsCount,
      isOptimized: renderTime < 16.67, // 60 FPS threshold
    };
    
    this.renderHistory.push(renderMetric);
    
    // Keep only last 100 render measurements
    if (this.renderHistory.length > 100) {
      this.renderHistory.shift();
    }
    
    // Log slow renders
    if (renderTime > 50) {
      console.warn(`🐌 Slow render detected: ${componentName} took ${renderTime.toFixed(2)}ms`);
    }
  }

  /**
   * Track stream loading performance
   */
  trackStreamLoad(streamId: string, loadTime: number): void {
    this.metrics.streamLoadTimes[streamId] = loadTime;
    
    const existingMetrics = this.streamMetrics.get(streamId) || {
      streamId,
      loadTime: 0,
      errorCount: 0,
      reconnectCount: 0,
      avgLatency: 0,
      qualityChanges: 0,
    };
    
    existingMetrics.loadTime = loadTime;
    this.streamMetrics.set(streamId, existingMetrics);
    
    // Log slow stream loads
    if (loadTime > 5000) {
      console.warn(`🐌 Slow stream load: ${streamId} took ${loadTime}ms`);
    }
  }

  /**
   * Track stream errors
   */
  trackStreamError(streamId: string, errorType: string): void {
    this.metrics.errorCount++;
    
    const existingMetrics = this.streamMetrics.get(streamId) || {
      streamId,
      loadTime: 0,
      errorCount: 0,
      reconnectCount: 0,
      avgLatency: 0,
      qualityChanges: 0,
    };
    
    existingMetrics.errorCount++;
    this.streamMetrics.set(streamId, existingMetrics);
    
    console.error(`❌ Stream error: ${streamId} - ${errorType}`);
  }

  /**
   * Track network latency
   */
  async trackNetworkLatency(url: string = 'https://api.twitch.tv/helix/streams'): Promise<number> {
    const startTime = performance.now();
    
    try {
      const response = await Promise.race([
        fetch(url, { method: 'HEAD' }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), 5000))
      ]) as Response;
      
      const latency = performance.now() - startTime;
      this.metrics.networkLatency = latency;
      
      return latency;
    } catch (error) {
      console.error('Network latency measurement failed:', error);
      return -1;
    }
  }

  /**
   * Get comprehensive performance report
   */
  getPerformanceReport(): {
    summary: any;
    recommendations: string[];
    metrics: PerformanceMetrics;
    renderHistory: RenderMetrics[];
    memoryHistory: MemoryMetrics[];
    streamMetrics: StreamMetrics[];
  } {
    const avgRenderTime = this.renderHistory.length > 0 
      ? this.renderHistory.reduce((sum, r) => sum + r.renderTime, 0) / this.renderHistory.length
      : 0;
    
    const slowRenders = this.renderHistory.filter(r => r.renderTime > 16.67).length;
    const optimizedComponents = this.renderHistory.filter(r => r.isOptimized).length;
    
    const avgMemoryUsage = this.memoryHistory.length > 0
      ? this.memoryHistory.reduce((sum, m) => sum + m.used, 0) / this.memoryHistory.length
      : 0;
    
    const avgFPS = this.metrics.fpsData.length > 0
      ? this.metrics.fpsData.reduce((sum, fps) => sum + fps, 0) / this.metrics.fpsData.length
      : 0;
    
    const summary = {
      avgRenderTime: avgRenderTime.toFixed(2),
      slowRenders,
      optimizedComponents,
      totalRenders: this.renderHistory.length,
      avgMemoryUsage: (avgMemoryUsage / 1024 / 1024).toFixed(2), // MB
      avgFPS: avgFPS.toFixed(1),
      networkLatency: this.metrics.networkLatency.toFixed(2),
      errorCount: this.metrics.errorCount,
      activeStreams: this.streamMetrics.size,
    };
    
    const recommendations = this.generateRecommendations();
    
    return {
      summary,
      recommendations,
      metrics: this.metrics,
      renderHistory: this.renderHistory,
      memoryHistory: this.memoryHistory,
      streamMetrics: Array.from(this.streamMetrics.values()),
    };
  }

  /**
   * Generate performance optimization recommendations
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    // Check render performance
    const avgRenderTime = this.renderHistory.length > 0 
      ? this.renderHistory.reduce((sum, r) => sum + r.renderTime, 0) / this.renderHistory.length
      : 0;
    
    if (avgRenderTime > 16.67) {
      recommendations.push('Consider memoizing components with React.memo() to improve render performance');
    }
    
    // Check memory usage
    const latestMemory = this.memoryHistory[this.memoryHistory.length - 1];
    if (latestMemory && latestMemory.percentage > 80) {
      recommendations.push('Memory usage is high - consider implementing component cleanup and lazy loading');
    }
    
    // Check FPS
    const avgFPS = this.metrics.fpsData.length > 0
      ? this.metrics.fpsData.reduce((sum, fps) => sum + fps, 0) / this.metrics.fpsData.length
      : 0;
    
    if (avgFPS < 30) {
      recommendations.push('Low FPS detected - reduce animations and optimize heavy operations');
    }
    
    // Check stream performance
    const slowStreams = Array.from(this.streamMetrics.values()).filter(s => s.loadTime > 5000);
    if (slowStreams.length > 0) {
      recommendations.push(`${slowStreams.length} streams have slow load times - check network conditions`);
    }
    
    // Check error rates
    const errorRate = this.metrics.errorCount / Math.max(1, this.metrics.componentRenderCount);
    if (errorRate > 0.01) {
      recommendations.push('High error rate detected - implement better error boundaries');
    }
    
    // Check network latency
    if (this.metrics.networkLatency > 1000) {
      recommendations.push('High network latency detected - consider caching and offline strategies');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Performance looks good! 🎉');
    }
    
    return recommendations;
  }

  /**
   * Start FPS monitoring
   */
  private startFPSMonitoring(): void {
    let lastTime = performance.now();
    let frameCount = 0;
    
    const measureFPS = () => {
      const currentTime = performance.now();
      frameCount++;
      
      if (currentTime - lastTime >= 1000) {
        const fps = frameCount * 1000 / (currentTime - lastTime);
        this.metrics.fpsData.push(fps);
        
        // Keep only last 60 measurements (1 minute)
        if (this.metrics.fpsData.length > 60) {
          this.metrics.fpsData.shift();
        }
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      if (this.isMonitoring) {
        requestAnimationFrame(measureFPS);
      }
    };
    
    requestAnimationFrame(measureFPS);
  }

  /**
   * Start memory monitoring
   */
  private startMemoryMonitoring(): void {
    this.memoryTimer = setInterval(() => {
      const memoryInfo = this.getMemoryUsage();
      this.memoryHistory.push(memoryInfo);
      
      // Keep only last 100 memory measurements
      if (this.memoryHistory.length > 100) {
        this.memoryHistory.shift();
      }
      
      this.metrics.memoryUsage = memoryInfo.used;
      
      // Log memory warnings
      if (memoryInfo.percentage > 90) {
        console.warn(`🚨 Critical memory usage: ${memoryInfo.percentage.toFixed(1)}%`);
      } else if (memoryInfo.percentage > 80) {
        console.warn(`⚠️ High memory usage: ${memoryInfo.percentage.toFixed(1)}%`);
      }
    }, 2000); // Check every 2 seconds
  }

  /**
   * Get current memory usage
   */
  private getMemoryUsage(): MemoryMetrics {
    // Use React Native's performance API or estimate
    const memoryInfo = (performance as any).memory;
    
    if (memoryInfo) {
      return {
        used: memoryInfo.usedJSHeapSize || 0,
        total: memoryInfo.totalJSHeapSize || 0,
        percentage: memoryInfo.usedJSHeapSize / memoryInfo.totalJSHeapSize * 100,
        jsHeapSizeLimit: memoryInfo.jsHeapSizeLimit,
        usedJSHeapSize: memoryInfo.usedJSHeapSize,
        totalJSHeapSize: memoryInfo.totalJSHeapSize,
      };
    }
    
    // Fallback estimation
    return {
      used: 0,
      total: 0,
      percentage: 0,
    };
  }

  /**
   * Setup global error tracking
   */
  private setupErrorTracking(): void {
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.error = (...args) => {
      this.metrics.errorCount++;
      originalError.apply(console, args);
    };
    
    console.warn = (...args) => {
      this.metrics.warningCount++;
      originalWarn.apply(console, args);
    };
  }

  /**
   * Export performance data for analysis
   */
  exportPerformanceData(): string {
    const report = this.getPerformanceReport();
    return JSON.stringify(report, null, 2);
  }

  /**
   * Clear all performance data
   */
  clearData(): void {
    this.metrics = {
      componentRenderCount: 0,
      memoryUsage: 0,
      streamLoadTimes: {},
      fpsData: [],
      networkLatency: 0,
      errorCount: 0,
      warningCount: 0,
      lastMeasurement: Date.now(),
    };
    
    this.renderHistory = [];
    this.memoryHistory = [];
    this.streamMetrics.clear();
    
    console.log('🧹 Performance data cleared');
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for performance monitoring
export const usePerformanceMonitor = () => {
  const [isMonitoring, setIsMonitoring] = React.useState(false);
  const [report, setReport] = React.useState<{
    summary: any;
    recommendations: string[];
    metrics: PerformanceMetrics;
    renderHistory: RenderMetrics[];
    memoryHistory: MemoryMetrics[];
    streamMetrics: StreamMetrics[];
  } | null>(null);
  
  const startMonitoring = React.useCallback(() => {
    performanceMonitor.startMonitoring();
    setIsMonitoring(true);
  }, []);
  
  const stopMonitoring = React.useCallback(() => {
    performanceMonitor.stopMonitoring();
    setIsMonitoring(false);
  }, []);
  
  const generateReport = React.useCallback(() => {
    const newReport = performanceMonitor.getPerformanceReport();
    setReport(newReport);
    return newReport;
  }, []);
  
  const clearData = React.useCallback(() => {
    performanceMonitor.clearData();
    setReport(null);
  }, []);
  
  return {
    isMonitoring,
    report,
    startMonitoring,
    stopMonitoring,
    generateReport,
    clearData,
    trackComponentRender: performanceMonitor.trackComponentRender.bind(performanceMonitor),
    trackStreamLoad: performanceMonitor.trackStreamLoad.bind(performanceMonitor),
    trackStreamError: performanceMonitor.trackStreamError.bind(performanceMonitor),
  };
};

// Performance measurement decorator
export const measurePerformance = (componentName: string) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    
    descriptor.value = function (...args: any[]) {
      const startTime = performance.now();
      const result = originalMethod.apply(this, args);
      const endTime = performance.now();
      
      performanceMonitor.trackComponentRender(
        `${componentName}.${propertyKey}`,
        endTime - startTime,
        args.length
      );
      
      return result;
    };
    
    return descriptor;
  };
};

export default performanceMonitor;