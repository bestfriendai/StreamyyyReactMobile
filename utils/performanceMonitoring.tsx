/**
 * Performance Monitoring and Optimization Utilities
 * Provides hooks and utilities for monitoring app performance
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { InteractionManager, PixelRatio } from 'react-native';

// Performance metrics interface
interface PerformanceMetrics {
  renderTime: number;
  componentMountTime: number;
  lastUpdateTime: number;
  rerenderCount: number;
  memoryUsage?: number;
  jsHeapSize?: number;
}

// Performance warning thresholds
const PERFORMANCE_THRESHOLDS = {
  RENDER_TIME_WARNING: 16, // 16ms for 60fps
  RENDER_TIME_CRITICAL: 33, // 33ms for 30fps
  RERENDER_COUNT_WARNING: 5,
  RERENDER_COUNT_CRITICAL: 10,
};

/**
 * Hook to monitor component render performance
 */
export const useRenderPerformance = (componentName: string = 'Component') => {
  const renderStartTime = useRef<number>(0);
  const mountTime = useRef<number>(0);
  const rerenderCount = useRef<number>(0);
  const lastRenderTime = useRef<number>(0);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    componentMountTime: 0,
    lastUpdateTime: 0,
    rerenderCount: 0,
  });

  // Track component mount time
  useEffect(() => {
    mountTime.current = performance.now();
    if (__DEV__ && mountTime.current > 100) {
      console.log(`🏁 ${componentName} mounted in ${mountTime.current.toFixed(2)}ms`);
    }
  }, [componentName]);

  // Track render performance (throttled to prevent render loops)
  useEffect(() => {
    const startTime = performance.now();
    renderStartTime.current = startTime;
    
    // Use requestAnimationFrame to measure actual render time
    const measureRenderTime = () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      lastRenderTime.current = renderTime;
      rerenderCount.current += 1;

      // Only update metrics every 5 renders to prevent render loops
      if (rerenderCount.current % 5 === 0) {
        setMetrics(prev => ({
          ...prev,
          renderTime,
          lastUpdateTime: endTime,
          rerenderCount: rerenderCount.current,
        }));
      }

      // Performance warnings (only in development and heavily throttled)
      if (__DEV__ && rerenderCount.current % 50 === 0) {
        if (renderTime > PERFORMANCE_THRESHOLDS.RENDER_TIME_CRITICAL) {
          console.warn(`⚠️ ${componentName} render time critical: ${renderTime.toFixed(2)}ms`);
        } else if (renderTime > PERFORMANCE_THRESHOLDS.RENDER_TIME_WARNING) {
          console.warn(`⚠️ ${componentName} render time slow: ${renderTime.toFixed(2)}ms`);
        }

        if (rerenderCount.current > PERFORMANCE_THRESHOLDS.RERENDER_COUNT_CRITICAL) {
          console.warn(`⚠️ ${componentName} excessive rerenders: ${rerenderCount.current}`);
        }
      }
    };

    requestAnimationFrame(measureRenderTime);
  });

  // Get performance report
  const getPerformanceReport = useCallback(() => {
    return {
      componentName,
      ...metrics,
      averageRenderTime: metrics.renderTime,
      isPerformant: metrics.renderTime < PERFORMANCE_THRESHOLDS.RENDER_TIME_WARNING,
      warnings: {
        slowRender: metrics.renderTime > PERFORMANCE_THRESHOLDS.RENDER_TIME_WARNING,
        criticalRender: metrics.renderTime > PERFORMANCE_THRESHOLDS.RENDER_TIME_CRITICAL,
        excessiveRerenders: metrics.rerenderCount > PERFORMANCE_THRESHOLDS.RERENDER_COUNT_WARNING,
      },
    };
  }, [componentName, metrics]);

  return {
    metrics,
    getPerformanceReport,
    isPerformant: metrics.renderTime < PERFORMANCE_THRESHOLDS.RENDER_TIME_WARNING,
  };
};

/**
 * Hook to monitor list performance (for FlatList optimization)
 */
export const useListPerformance = (listName: string = 'List') => {
  const scrollStartTime = useRef<number>(0);
  const itemRenderTimes = useRef<number[]>([]);
  const [listMetrics, setListMetrics] = useState({
    scrollPerformance: 0,
    averageItemRenderTime: 0,
    totalItems: 0,
    visibleItems: 0,
  });

  const onScrollBeginDrag = useCallback(() => {
    scrollStartTime.current = performance.now();
  }, []);

  const onScrollEndDrag = useCallback(() => {
    const scrollTime = performance.now() - scrollStartTime.current;
    setListMetrics(prev => ({
      ...prev,
      scrollPerformance: scrollTime,
    }));

    if (__DEV__ && scrollTime > 100) {
      console.warn(`⚠️ ${listName} scroll performance slow: ${scrollTime.toFixed(2)}ms`);
    }
  }, [listName]);

  const trackItemRender = useCallback((itemIndex: number) => {
    const renderTime = performance.now();
    itemRenderTimes.current[itemIndex] = renderTime;
    
    // Calculate average render time
    const averageRenderTime = itemRenderTimes.current.reduce((sum, time) => sum + time, 0) / itemRenderTimes.current.length;
    
    setListMetrics(prev => ({
      ...prev,
      averageItemRenderTime: averageRenderTime,
      totalItems: itemRenderTimes.current.length,
    }));
  }, []);

  const getListLayoutProps = useCallback(() => ({
    onScrollBeginDrag,
    onScrollEndDrag,
    // Optimize scroll performance
    removeClippedSubviews: true,
    maxToRenderPerBatch: 3,
    windowSize: 7,
    initialNumToRender: 5,
    updateCellsBatchingPeriod: 100,
    getItemLayout: (data: any, index: number) => {
      // Provide getItemLayout for better performance if items have fixed height
      const itemHeight = 200; // Adjust based on your item height
      return {
        length: itemHeight,
        offset: itemHeight * index,
        index,
      };
    },
  }), [onScrollBeginDrag, onScrollEndDrag]);

  return {
    listMetrics,
    trackItemRender,
    getListLayoutProps,
    onScrollBeginDrag,
    onScrollEndDrag,
  };
};

/**
 * Hook to monitor memory usage
 */
export const useMemoryMonitoring = () => {
  const [memoryInfo, setMemoryInfo] = useState<{
    used: number;
    total: number;
    percentage: number;
  }>({
    used: 0,
    total: 0,
    percentage: 0,
  });

  useEffect(() => {
    const checkMemory = () => {
      // React Native doesn't have direct memory API, but we can approximate
      if (global.performance && global.performance.memory) {
        const memory = global.performance.memory;
        const used = memory.usedJSHeapSize || 0;
        const total = memory.totalJSHeapSize || 0;
        const percentage = total > 0 ? (used / total) * 100 : 0;

        setMemoryInfo({ used, total, percentage });

        if (__DEV__ && percentage > 80) {
          console.warn(`⚠️ High memory usage: ${percentage.toFixed(2)}%`);
        }
      }
    };

    checkMemory();
    const interval = setInterval(checkMemory, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return memoryInfo;
};

/**
 * Hook for optimized state updates
 */
export const useOptimizedState = <T>(
  initialValue: T,
  shouldUpdate?: (prev: T, next: T) => boolean
) => {
  const [state, setState] = useState<T>(initialValue);
  const previousValue = useRef<T>(initialValue);

  const optimizedSetState = useCallback((newValue: T | ((prev: T) => T)) => {
    const nextValue = typeof newValue === 'function' 
      ? (newValue as (prev: T) => T)(previousValue.current)
      : newValue;

    // Custom comparison function or shallow comparison
    const shouldPerformUpdate = shouldUpdate 
      ? shouldUpdate(previousValue.current, nextValue)
      : previousValue.current !== nextValue;

    if (shouldPerformUpdate) {
      previousValue.current = nextValue;
      setState(nextValue);
    }
  }, [shouldUpdate]);

  return [state, optimizedSetState] as const;
};

/**
 * Hook to batch state updates for better performance
 */
export const useBatchedUpdates = () => {
  const updateQueue = useRef<(() => void)[]>([]);
  const isProcessing = useRef<boolean>(false);

  const batchUpdate = useCallback((updateFn: () => void) => {
    updateQueue.current.push(updateFn);

    if (!isProcessing.current) {
      isProcessing.current = true;
      
      // Use InteractionManager to batch updates after interactions
      InteractionManager.runAfterInteractions(() => {
        const updates = updateQueue.current.splice(0);
        updates.forEach(update => update());
        isProcessing.current = false;
      });
    }
  }, []);

  return { batchUpdate };
};

/**
 * Hook to debounce expensive operations
 */
export const useDebounce = <T>(value: T, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Hook to throttle expensive operations
 */
export const useThrottle = <T>(value: T, limit: number) => {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRan = useRef<number>(0);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
};

/**
 * Performance-optimized memoization hook
 */
export const useDeepMemo = <T>(factory: () => T, deps: React.DependencyList) => {
  const ref = useRef<{ deps: React.DependencyList; value: T }>();

  if (!ref.current || !shallowEqual(ref.current.deps, deps)) {
    ref.current = { deps, value: factory() };
  }

  return ref.current.value;
};

/**
 * Shallow equality check for dependency arrays
 */
const shallowEqual = (deps1: React.DependencyList, deps2: React.DependencyList): boolean => {
  if (deps1.length !== deps2.length) return false;
  for (let i = 0; i < deps1.length; i++) {
    if (deps1[i] !== deps2[i]) return false;
  }
  return true;
};

/**
 * Performance utilities
 */
export const PerformanceUtils = {
  /**
   * Get device performance tier
   */
  getDevicePerformanceTier: (): 'low' | 'medium' | 'high' => {
    const pixelRatio = PixelRatio.get();
    
    if (pixelRatio >= 3) return 'high';
    if (pixelRatio >= 2) return 'medium';
    return 'low';
  },

  /**
   * Get optimized settings based on device performance
   */
  getOptimizedSettings: () => {
    const tier = PerformanceUtils.getDevicePerformanceTier();
    
    switch (tier) {
      case 'high':
        return {
          maxStreams: 9,
          imageQuality: 'high',
          animationDuration: 300,
          enableBlur: true,
          enableShadows: true,
        };
      case 'medium':
        return {
          maxStreams: 6,
          imageQuality: 'medium',
          animationDuration: 200,
          enableBlur: false,
          enableShadows: true,
        };
      case 'low':
        return {
          maxStreams: 4,
          imageQuality: 'low',
          animationDuration: 150,
          enableBlur: false,
          enableShadows: false,
        };
    }
  },

  /**
   * Log performance metrics
   */
  logPerformanceMetrics: (metrics: PerformanceMetrics, componentName: string) => {
    console.group(`📊 Performance Metrics - ${componentName}`);
    console.log(`Render Time: ${metrics.renderTime.toFixed(2)}ms`);
    console.log(`Mount Time: ${metrics.componentMountTime.toFixed(2)}ms`);
    console.log(`Rerender Count: ${metrics.rerenderCount}`);
    if (metrics.memoryUsage) {
      console.log(`Memory Usage: ${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`);
    }
    console.groupEnd();
  },
};

export default {
  useRenderPerformance,
  useListPerformance,
  useMemoryMonitoring,
  useOptimizedState,
  useBatchedUpdates,
  useDebounce,
  useThrottle,
  useDeepMemo,
  PerformanceUtils,
};