/**
 * Multi-Stream Performance Optimizer Component
 * Provides intelligent stream management and performance optimization
 */

import React, { useEffect, useCallback, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { useStreamManager } from '@/hooks/useStreamManager';
import { 
  streamHealthMonitor, 
  generateHealthReport, 
  StreamPerformanceReport 
} from '@/services/streamHealthMonitor';
import { logDebug, logWarning, withErrorHandling } from '@/utils/errorHandler';

interface PerformanceOptimizerProps {
  children: React.ReactNode;
  enableAutoOptimization?: boolean;
  maxStreams?: number;
  performanceThreshold?: number; // milliseconds
}

export const MultiStreamPerformanceOptimizer: React.FC<PerformanceOptimizerProps> = ({
  children,
  enableAutoOptimization = true,
  maxStreams = 4,
  performanceThreshold = 5000,
}) => {
  const { activeStreams, removeStream } = useStreamManager();
  const [lastOptimization, setLastOptimization] = useState<number>(0);
  const [performanceReport, setPerformanceReport] = useState<StreamPerformanceReport | null>(null);

  // Performance monitoring interval
  useEffect(() => {
    if (!enableAutoOptimization) return;

    const monitorInterval = setInterval(() => {
      performPerformanceCheck();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(monitorInterval);
  }, [enableAutoOptimization, activeStreams.length]);

  // Initial performance analysis when streams change
  useEffect(() => {
    if (activeStreams.length > 0) {
      // Delay initial check to allow streams to load
      const timer = setTimeout(() => {
        performPerformanceCheck();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [activeStreams.length]);

  const performPerformanceCheck = useCallback(async () => {
    await withErrorHandling(async () => {
      const report = generateHealthReport();
      setPerformanceReport(report);

      logDebug('Performance check results', {
        totalStreams: report.totalStreams,
        healthyStreams: report.healthyStreams,
        unhealthyStreams: report.unhealthyStreams,
        averageLoadTime: `${report.averageLoadTime.toFixed(0)}ms`,
        memoryUsage: `${report.totalMemoryUsage}MB`
      });

      // Auto-optimization logic
      if (enableAutoOptimization) {
        await handleAutoOptimization(report);
      }
    }, { component: 'MultiStreamPerformanceOptimizer', action: 'performPerformanceCheck' });
  }, [enableAutoOptimization]);

  const handleAutoOptimization = useCallback(async (report: StreamPerformanceReport) => {
    const now = Date.now();
    const timeSinceLastOptimization = now - lastOptimization;
    
    // Don't optimize too frequently (minimum 2 minutes between optimizations)
    if (timeSinceLastOptimization < 120000) return;

    let optimizationPerformed = false;

    // Check if too many streams are causing performance issues
    if (report.totalStreams > maxStreams && report.averageLoadTime > performanceThreshold) {
      logWarning('Too many streams detected, suggesting optimization', {
        currentStreams: report.totalStreams,
        maxRecommended: maxStreams,
        averageLoadTime: report.averageLoadTime
      });

      if (Platform.OS !== 'web') {
        Alert.alert(
          'Performance Optimization',
          `You have ${report.totalStreams} active streams which may affect performance. Consider reducing to ${maxStreams} or fewer for optimal experience.`,
          [
            {
              text: 'Keep All',
              style: 'cancel'
            },
            {
              text: 'Optimize',
              onPress: () => optimizeStreamCount(),
            }
          ]
        );
      }
      optimizationPerformed = true;
    }

    // Handle unhealthy streams
    if (report.unhealthyStreams > 0) {
      const healthCheck = streamHealthMonitor.performHealthCheck();
      
      // Auto-remove streams that have been failing for too long
      for (const streamId of healthCheck.unhealthyStreams) {
        const streamHealth = streamHealthMonitor.getStreamHealth(streamId);
        if (streamHealth && streamHealth.consecutiveFailures >= 5) {
          logWarning('Auto-removing consistently failing stream', { 
            streamId, 
            consecutiveFailures: streamHealth.consecutiveFailures 
          });
          
          await removeStream(streamId);
          optimizationPerformed = true;
        }
      }
    }

    // Memory usage optimization
    if (report.totalMemoryUsage > 300) { // More than 300MB
      logWarning('High memory usage detected', { 
        memoryUsage: report.totalMemoryUsage,
        totalStreams: report.totalStreams 
      });

      if (Platform.OS !== 'web') {
        Alert.alert(
          'Memory Usage Warning',
          `High memory usage detected (${report.totalMemoryUsage}MB). Consider reducing active streams to improve performance.`,
          [{ text: 'OK' }]
        );
      }
    }

    if (optimizationPerformed) {
      setLastOptimization(now);
    }
  }, [lastOptimization, maxStreams, performanceThreshold, removeStream]);

  const optimizeStreamCount = useCallback(async () => {
    const streamsToRemove = activeStreams.length - maxStreams;
    
    if (streamsToRemove > 0) {
      // Remove streams with worst health first
      const streamHealths = activeStreams.map(stream => ({
        stream,
        health: streamHealthMonitor.getStreamHealth(stream.id)
      })).sort((a, b) => {
        const aScore = (a.health?.consecutiveFailures || 0) + (a.health?.errorCount || 0);
        const bScore = (b.health?.consecutiveFailures || 0) + (b.health?.errorCount || 0);
        return bScore - aScore; // Sort by worst health first
      });

      for (let i = 0; i < streamsToRemove; i++) {
        const streamToRemove = streamHealths[i];
        if (streamToRemove) {
          logDebug('Auto-removing stream for optimization', {
            streamId: streamToRemove.stream.id,
            streamName: streamToRemove.stream.user_name,
            health: streamToRemove.health
          });
          
          await removeStream(streamToRemove.stream.id);
        }
      }

      setLastOptimization(Date.now());
    }
  }, [activeStreams, maxStreams, removeStream]);

  // Memory cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up any remaining health monitoring
      streamHealthMonitor.reset();
    };
  }, []);

  // Performance warning for development
  useEffect(() => {
    if (__DEV__ && activeStreams.length > 6) {
      console.warn(
        `🔥 Performance Warning: ${activeStreams.length} active streams detected. ` +
        'Consider limiting to 4-6 streams for optimal performance on mobile devices.'
      );
    }
  }, [activeStreams.length]);

  return <>{children}</>;
};

export default MultiStreamPerformanceOptimizer;