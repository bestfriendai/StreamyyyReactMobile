/**
 * Memory Management and Cleanup Utilities
 * Provides comprehensive memory management for React Native app
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { imageCache } from '@/utils/imageOptimization';

// Memory management interface
interface MemoryStats {
  heapUsed: number;
  heapTotal: number;
  heapLimit: number;
  external: number;
  rss: number;
  arrayBuffers: number;
}

// Cleanup registry to track all cleanup functions
class CleanupRegistry {
  private cleanupFunctions: Map<string, () => void> = new Map();
  private timers: Set<NodeJS.Timeout> = new Set();
  private intervals: Set<NodeJS.Timeout> = new Set();
  private subscriptions: Set<{ remove: () => void }> = new Set();

  // Register cleanup function
  register(id: string, cleanupFn: () => void) {
    this.cleanupFunctions.set(id, cleanupFn);
  }

  // Unregister cleanup function
  unregister(id: string) {
    this.cleanupFunctions.delete(id);
  }

  // Register timer for automatic cleanup
  registerTimer(timer: NodeJS.Timeout) {
    this.timers.add(timer);
  }

  // Register interval for automatic cleanup
  registerInterval(interval: NodeJS.Timeout) {
    this.intervals.add(interval);
  }

  // Register subscription for automatic cleanup
  registerSubscription(subscription: { remove: () => void }) {
    this.subscriptions.add(subscription);
  }

  // Execute specific cleanup
  executeCleanup(id: string) {
    const cleanupFn = this.cleanupFunctions.get(id);
    if (cleanupFn) {
      try {
        cleanupFn();
        this.cleanupFunctions.delete(id);
      } catch (error) {
        console.error(`Cleanup error for ${id}:`, error);
      }
    }
  }

  // Execute all cleanup functions
  executeAllCleanup() {
    // Clear all timers
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();

    // Clear all intervals
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();

    // Remove all subscriptions
    this.subscriptions.forEach(subscription => {
      try {
        subscription.remove();
      } catch (error) {
        console.error('Subscription cleanup error:', error);
      }
    });
    this.subscriptions.clear();

    // Execute all registered cleanup functions
    this.cleanupFunctions.forEach((cleanupFn, id) => {
      try {
        cleanupFn();
      } catch (error) {
        console.error(`Cleanup error for ${id}:`, error);
      }
    });
    this.cleanupFunctions.clear();

    console.log('🧹 All cleanup functions executed');
  }

  // Get cleanup stats
  getStats() {
    return {
      cleanupFunctions: this.cleanupFunctions.size,
      timers: this.timers.size,
      intervals: this.intervals.size,
      subscriptions: this.subscriptions.size,
    };
  }
}

// Global cleanup registry
export const cleanupRegistry = new CleanupRegistry();

/**
 * Memory Manager class
 */
class MemoryManager {
  private memoryThreshold = 0.8; // 80% memory usage threshold
  private cleanupInterval: NodeJS.Timeout | null = null;
  private isLowMemoryMode = false;
  private listeners: ((isLowMemory: boolean) => void)[] = [];

  constructor() {
    this.startMonitoring();
    this.setupAppStateListener();
  }

  // Start memory monitoring
  private startMonitoring() {
    this.cleanupInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, 30000); // Check every 30 seconds

    cleanupRegistry.registerInterval(this.cleanupInterval);
  }

  // Setup app state listener for aggressive cleanup
  private setupAppStateListener() {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background') {
        this.performBackgroundCleanup();
      } else if (nextAppState === 'active') {
        this.performForegroundOptimization();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    cleanupRegistry.registerSubscription(subscription);
  }

  // Check memory usage
  private checkMemoryUsage() {
    const stats = this.getMemoryStats();
    
    if (stats.heapUsed / stats.heapTotal > this.memoryThreshold) {
      console.warn('⚠️ High memory usage detected, performing cleanup...');
      this.performMemoryCleanup();
    }
  }

  // Get memory statistics
  getMemoryStats(): MemoryStats {
    if (global.performance?.memory) {
      const memory = global.performance.memory;
      return {
        heapUsed: memory.usedJSHeapSize || 0,
        heapTotal: memory.totalJSHeapSize || 0,
        heapLimit: memory.jsHeapSizeLimit || 0,
        external: 0,
        rss: 0,
        arrayBuffers: 0,
      };
    }

    // Fallback stats
    return {
      heapUsed: 0,
      heapTotal: 0,
      heapLimit: 0,
      external: 0,
      rss: 0,
      arrayBuffers: 0,
    };
  }

  // Perform memory cleanup
  performMemoryCleanup() {
    console.log('🧹 Performing memory cleanup...');
    
    // Clear image cache partially
    this.cleanupImageCache();
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    // Set low memory mode
    this.setLowMemoryMode(true);
    
    // Notify listeners
    this.notifyMemoryStateChange(true);
  }

  // Background cleanup when app goes to background
  private performBackgroundCleanup() {
    console.log('🧹 Performing background cleanup...');
    
    // Aggressive image cache cleanup
    imageCache.clear();
    
    // Clear temporary data
    this.clearTemporaryData();
    
    // Execute all registered cleanup functions
    cleanupRegistry.executeAllCleanup();
  }

  // Foreground optimization when app becomes active
  private performForegroundOptimization() {
    console.log('🚀 Performing foreground optimization...');
    
    // Reset low memory mode
    this.setLowMemoryMode(false);
    
    // Notify listeners
    this.notifyMemoryStateChange(false);
  }

  // Cleanup image cache
  private cleanupImageCache() {
    const cacheStats = imageCache.getStats();
    
    if (cacheStats.usage > 70) {
      console.log('🖼️ Clearing image cache due to high usage');
      // Clear older entries but keep recent ones
      imageCache.clear();
    }
  }

  // Clear temporary data
  private clearTemporaryData() {
    // Clear any temporary arrays, objects, or caches
    if (global.temporaryData) {
      global.temporaryData = {};
    }
  }

  // Set low memory mode
  private setLowMemoryMode(isLowMemory: boolean) {
    if (this.isLowMemoryMode !== isLowMemory) {
      this.isLowMemoryMode = isLowMemory;
      console.log(`🔄 Low memory mode: ${isLowMemory ? 'ON' : 'OFF'}`);
    }
  }

  // Add memory state listener
  addMemoryStateListener(listener: (isLowMemory: boolean) => void) {
    this.listeners.push(listener);
    
    // Return cleanup function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Notify listeners of memory state change
  private notifyMemoryStateChange(isLowMemory: boolean) {
    this.listeners.forEach(listener => {
      try {
        listener(isLowMemory);
      } catch (error) {
        console.error('Memory state listener error:', error);
      }
    });
  }

  // Get current memory mode
  isInLowMemoryMode(): boolean {
    return this.isLowMemoryMode;
  }

  // Manual memory cleanup trigger
  triggerCleanup() {
    this.performMemoryCleanup();
  }

  // Get memory pressure level
  getMemoryPressureLevel(): 'low' | 'moderate' | 'high' | 'critical' {
    const stats = this.getMemoryStats();
    const usage = stats.heapUsed / stats.heapTotal;
    
    if (usage > 0.9) return 'critical';
    if (usage > 0.8) return 'high';
    if (usage > 0.6) return 'moderate';
    return 'low';
  }
}

// Global memory manager instance
export const memoryManager = new MemoryManager();

/**
 * Hook for automatic cleanup management
 */
export const useCleanup = (cleanupFn: () => void, deps: React.DependencyList = []) => {
  const cleanupId = useRef(`cleanup_${Date.now()}_${Math.random()}`);

  useEffect(() => {
    const id = cleanupId.current;
    cleanupRegistry.register(id, cleanupFn);

    return () => {
      cleanupRegistry.unregister(id);
    };
  }, deps);

  // Return manual cleanup trigger
  return useCallback(() => {
    cleanupRegistry.executeCleanup(cleanupId.current);
  }, []);
};

/**
 * Hook for memory state monitoring
 */
export const useMemoryState = () => {
  const [isLowMemory, setIsLowMemory] = React.useState(false);
  const [memoryStats, setMemoryStats] = React.useState<MemoryStats>({
    heapUsed: 0,
    heapTotal: 0,
    heapLimit: 0,
    external: 0,
    rss: 0,
    arrayBuffers: 0,
  });

  useEffect(() => {
    // Initial state
    setIsLowMemory(memoryManager.isInLowMemoryMode());
    setMemoryStats(memoryManager.getMemoryStats());

    // Listen for memory state changes
    const removeListener = memoryManager.addMemoryStateListener((lowMemory) => {
      setIsLowMemory(lowMemory);
      setMemoryStats(memoryManager.getMemoryStats());
    });

    // Update stats periodically
    const interval = setInterval(() => {
      setMemoryStats(memoryManager.getMemoryStats());
    }, 5000);

    return () => {
      removeListener();
      clearInterval(interval);
    };
  }, []);

  return {
    isLowMemory,
    memoryStats,
    memoryPressure: memoryManager.getMemoryPressureLevel(),
    triggerCleanup: memoryManager.triggerCleanup.bind(memoryManager),
  };
};

/**
 * Hook for safe timers with automatic cleanup
 */
export const useSafeTimer = () => {
  const timers = useRef<Set<NodeJS.Timeout>>(new Set());

  const setSafeTimeout = useCallback((callback: () => void, delay: number) => {
    const timer = setTimeout(() => {
      callback();
      timers.current.delete(timer);
    }, delay);
    
    timers.current.add(timer);
    cleanupRegistry.registerTimer(timer);
    
    return timer;
  }, []);

  const setSafeInterval = useCallback((callback: () => void, delay: number) => {
    const interval = setInterval(callback, delay);
    timers.current.add(interval);
    cleanupRegistry.registerInterval(interval);
    
    return interval;
  }, []);

  const clearSafeTimer = useCallback((timer: NodeJS.Timeout) => {
    clearTimeout(timer);
    clearInterval(timer);
    timers.current.delete(timer);
  }, []);

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      timers.current.forEach(timer => {
        clearTimeout(timer);
        clearInterval(timer);
      });
      timers.current.clear();
    };
  }, []);

  return {
    setSafeTimeout,
    setSafeInterval,
    clearSafeTimer,
  };
};

/**
 * Hook for safe subscriptions with automatic cleanup
 */
export const useSafeSubscription = () => {
  const subscriptions = useRef<Set<{ remove: () => void }>>(new Set());

  const addSubscription = useCallback((subscription: { remove: () => void }) => {
    subscriptions.current.add(subscription);
    cleanupRegistry.registerSubscription(subscription);
    
    return () => {
      subscription.remove();
      subscriptions.current.delete(subscription);
    };
  }, []);

  // Cleanup all subscriptions on unmount
  useEffect(() => {
    return () => {
      subscriptions.current.forEach(subscription => {
        try {
          subscription.remove();
        } catch (error) {
          console.error('Subscription cleanup error:', error);
        }
      });
      subscriptions.current.clear();
    };
  }, []);

  return { addSubscription };
};

/**
 * Memory optimization utilities
 */
export const MemoryUtils = {
  // Optimize array operations
  optimizeArray: <T>(array: T[], maxSize: number = 1000): T[] => {
    if (array.length <= maxSize) return array;
    
    // Keep most recent items
    return array.slice(-maxSize);
  },

  // Optimize object for memory
  optimizeObject: (obj: any, maxDepth: number = 3, currentDepth: number = 0): any => {
    if (currentDepth >= maxDepth) return '[Object]';
    
    const optimized: any = {};
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        
        if (typeof value === 'object' && value !== null) {
          optimized[key] = MemoryUtils.optimizeObject(value, maxDepth, currentDepth + 1);
        } else {
          optimized[key] = value;
        }
      }
    }
    
    return optimized;
  },

  // Get memory-safe chunk size based on available memory
  getOptimalChunkSize: (baseSize: number = 100): number => {
    const memoryPressure = memoryManager.getMemoryPressureLevel();
    
    switch (memoryPressure) {
      case 'low':
        return baseSize * 2;
      case 'moderate':
        return baseSize;
      case 'high':
        return Math.floor(baseSize * 0.5);
      case 'critical':
        return Math.floor(baseSize * 0.25);
      default:
        return baseSize;
    }
  },

  // Process array in memory-safe chunks
  processInChunks: async <T, R>(
    array: T[],
    processor: (chunk: T[]) => Promise<R[]>,
    chunkSize?: number
  ): Promise<R[]> => {
    const optimalChunkSize = chunkSize || MemoryUtils.getOptimalChunkSize();
    const results: R[] = [];
    
    for (let i = 0; i < array.length; i += optimalChunkSize) {
      const chunk = array.slice(i, i + optimalChunkSize);
      const chunkResults = await processor(chunk);
      results.push(...chunkResults);
      
      // Allow event loop to process other tasks
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    
    return results;
  },
};

export default {
  memoryManager,
  cleanupRegistry,
  useCleanup,
  useMemoryState,
  useSafeTimer,
  useSafeSubscription,
  MemoryUtils,
};