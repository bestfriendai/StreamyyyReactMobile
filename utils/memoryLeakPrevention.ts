import { useEffect, useRef, useCallback } from 'react';
import { cancelAnimation } from 'react-native-reanimated';

export interface CleanupFunction {
  (): void;
}

export class MemoryLeakPreventer {
  private static instance: MemoryLeakPreventer;
  private activeComponents = new Set<string>();
  private cleanupFunctions = new Map<string, CleanupFunction[]>();
  private timers = new Map<string, NodeJS.Timeout[]>();
  private intervals = new Map<string, NodeJS.Timeout[]>();
  private animations = new Map<string, any[]>();
  private subscriptions = new Map<string, any[]>();

  private constructor() {}

  static getInstance(): MemoryLeakPreventer {
    if (!MemoryLeakPreventer.instance) {
      MemoryLeakPreventer.instance = new MemoryLeakPreventer();
    }
    return MemoryLeakPreventer.instance;
  }

  registerComponent(componentId: string): void {
    this.activeComponents.add(componentId);
    this.cleanupFunctions.set(componentId, []);
    this.timers.set(componentId, []);
    this.intervals.set(componentId, []);
    this.animations.set(componentId, []);
    this.subscriptions.set(componentId, []);
  }

  unregisterComponent(componentId: string): void {
    // Clean up all resources for this component
    this.cleanupComponent(componentId);
    
    // Remove from active components
    this.activeComponents.delete(componentId);
    this.cleanupFunctions.delete(componentId);
    this.timers.delete(componentId);
    this.intervals.delete(componentId);
    this.animations.delete(componentId);
    this.subscriptions.delete(componentId);
  }

  private cleanupComponent(componentId: string): void {
    // Execute cleanup functions
    const cleanupFns = this.cleanupFunctions.get(componentId) || [];
    cleanupFns.forEach(fn => {
      try {
        fn();
      } catch (error) {
        console.error(`Error during cleanup for ${componentId}:`, error);
      }
    });

    // Clear timers
    const timers = this.timers.get(componentId) || [];
    timers.forEach(timer => clearTimeout(timer));

    // Clear intervals
    const intervals = this.intervals.get(componentId) || [];
    intervals.forEach(interval => clearInterval(interval));

    // Cancel animations
    const animations = this.animations.get(componentId) || [];
    animations.forEach(animation => {
      if (animation && typeof animation.cancel === 'function') {
        animation.cancel();
      } else if (animation) {
        cancelAnimation(animation);
      }
    });

    // Unsubscribe from subscriptions
    const subscriptions = this.subscriptions.get(componentId) || [];
    subscriptions.forEach(subscription => {
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      } else if (subscription && typeof subscription.remove === 'function') {
        subscription.remove();
      } else if (subscription && typeof subscription === 'function') {
        subscription();
      }
    });
  }

  addCleanupFunction(componentId: string, cleanup: CleanupFunction): void {
    const cleanupFns = this.cleanupFunctions.get(componentId) || [];
    cleanupFns.push(cleanup);
    this.cleanupFunctions.set(componentId, cleanupFns);
  }

  addTimer(componentId: string, timer: NodeJS.Timeout): void {
    const timers = this.timers.get(componentId) || [];
    timers.push(timer);
    this.timers.set(componentId, timers);
  }

  addInterval(componentId: string, interval: NodeJS.Timeout): void {
    const intervals = this.intervals.get(componentId) || [];
    intervals.push(interval);
    this.intervals.set(componentId, intervals);
  }

  addAnimation(componentId: string, animation: any): void {
    const animations = this.animations.get(componentId) || [];
    animations.push(animation);
    this.animations.set(componentId, animations);
  }

  addSubscription(componentId: string, subscription: any): void {
    const subscriptions = this.subscriptions.get(componentId) || [];
    subscriptions.push(subscription);
    this.subscriptions.set(componentId, subscriptions);
  }

  getActiveComponents(): string[] {
    return Array.from(this.activeComponents);
  }

  getMemoryUsage(): {
    activeComponents: number;
    totalCleanupFunctions: number;
    totalTimers: number;
    totalIntervals: number;
    totalAnimations: number;
    totalSubscriptions: number;
  } {
    return {
      activeComponents: this.activeComponents.size,
      totalCleanupFunctions: Array.from(this.cleanupFunctions.values()).reduce((sum, arr) => sum + arr.length, 0),
      totalTimers: Array.from(this.timers.values()).reduce((sum, arr) => sum + arr.length, 0),
      totalIntervals: Array.from(this.intervals.values()).reduce((sum, arr) => sum + arr.length, 0),
      totalAnimations: Array.from(this.animations.values()).reduce((sum, arr) => sum + arr.length, 0),
      totalSubscriptions: Array.from(this.subscriptions.values()).reduce((sum, arr) => sum + arr.length, 0),
    };
  }

  // Global cleanup for emergency situations
  cleanupAll(): void {
    console.warn('Performing global cleanup of all components');
    Array.from(this.activeComponents).forEach(componentId => {
      this.cleanupComponent(componentId);
    });
  }
}

// React Hook for memory leak prevention
export function useMemoryLeakPrevention(componentName: string) {
  const componentId = useRef(`${componentName}_${Date.now()}_${Math.random()}`);
  const memoryManager = useRef(MemoryLeakPreventer.getInstance());

  useEffect(() => {
    const id = componentId.current;
    memoryManager.current.registerComponent(id);

    return () => {
      memoryManager.current.unregisterComponent(id);
    };
  }, []);

  const addCleanup = useCallback((cleanup: CleanupFunction) => {
    memoryManager.current.addCleanupFunction(componentId.current, cleanup);
  }, []);

  const safeTimeout = useCallback((callback: () => void, delay: number) => {
    const timer = setTimeout(callback, delay);
    memoryManager.current.addTimer(componentId.current, timer);
    return timer;
  }, []);

  const safeInterval = useCallback((callback: () => void, delay: number) => {
    const interval = setInterval(callback, delay);
    memoryManager.current.addInterval(componentId.current, interval);
    return interval;
  }, []);

  const safeAnimation = useCallback((animation: any) => {
    memoryManager.current.addAnimation(componentId.current, animation);
    return animation;
  }, []);

  const safeSubscription = useCallback((subscription: any) => {
    memoryManager.current.addSubscription(componentId.current, subscription);
    return subscription;
  }, []);

  const clearTimer = useCallback((timer: NodeJS.Timeout) => {
    clearTimeout(timer);
    // Remove from tracking
    const timers = memoryManager.current['timers'].get(componentId.current) || [];
    const index = timers.indexOf(timer);
    if (index > -1) {
      timers.splice(index, 1);
    }
  }, []);

  const clearIntervalSafe = useCallback((interval: NodeJS.Timeout) => {
    clearInterval(interval);
    // Remove from tracking
    const intervals = memoryManager.current['intervals'].get(componentId.current) || [];
    const index = intervals.indexOf(interval);
    if (index > -1) {
      intervals.splice(index, 1);
    }
  }, []);

  return {
    addCleanup,
    safeTimeout,
    safeInterval,
    safeAnimation,
    safeSubscription,
    clearTimer,
    clearInterval: clearIntervalSafe,
    componentId: componentId.current,
  };
}

// Hook for safe event listeners
export function useSafeEventListener() {
  const { addCleanup, safeSubscription } = useMemoryLeakPrevention('EventListener');

  const addEventListener = useCallback((
    target: EventTarget,
    event: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ) => {
    target.addEventListener(event, listener, options);
    
    const cleanup = () => {
      target.removeEventListener(event, listener, options);
    };
    
    addCleanup(cleanup);
    return cleanup;
  }, [addCleanup]);

  return { addEventListener };
}

// Hook for safe async operations
export function useSafeAsync() {
  const { addCleanup } = useMemoryLeakPrevention('AsyncOperation');
  const mountedRef = useRef(true);

  useEffect(() => {
    addCleanup(() => {
      mountedRef.current = false;
    });
  }, [addCleanup]);

  const safeAsync = useCallback(async <T>(
    asyncOperation: () => Promise<T>,
    onResult?: (result: T) => void,
    onError?: (error: Error) => void
  ): Promise<T | null> => {
    try {
      const result = await asyncOperation();
      
      if (mountedRef.current && onResult) {
        onResult(result);
      }
      
      return mountedRef.current ? result : null;
    } catch (error) {
      if (mountedRef.current && onError) {
        onError(error instanceof Error ? error : new Error(String(error)));
      }
      return null;
    }
  }, []);

  return { safeAsync, isMounted: () => mountedRef.current };
}

// Hook for safe animations
export function useSafeAnimation() {
  const { safeAnimation } = useMemoryLeakPrevention('Animation');

  const createSafeAnimation = useCallback((animationValue: any) => {
    return safeAnimation(animationValue);
  }, [safeAnimation]);

  return { createSafeAnimation };
}

// Memory usage monitor hook
export function useMemoryMonitor() {
  const memoryManager = MemoryLeakPreventer.getInstance();

  const getMemoryUsage = useCallback(() => {
    return memoryManager.getMemoryUsage();
  }, [memoryManager]);

  const getActiveComponents = useCallback(() => {
    return memoryManager.getActiveComponents();
  }, [memoryManager]);

  const performGlobalCleanup = useCallback(() => {
    memoryManager.cleanupAll();
  }, [memoryManager]);

  return {
    getMemoryUsage,
    getActiveComponents,
    performGlobalCleanup,
  };
}

// Global function to check for memory leaks
export function checkMemoryLeaks(): void {
  const memoryManager = MemoryLeakPreventer.getInstance();
  const usage = memoryManager.getMemoryUsage();
  
  console.group('🔍 Memory Leak Check');
  console.log('Active Components:', usage.activeComponents);
  console.log('Total Cleanup Functions:', usage.totalCleanupFunctions);
  console.log('Total Timers:', usage.totalTimers);
  console.log('Total Intervals:', usage.totalIntervals);
  console.log('Total Animations:', usage.totalAnimations);
  console.log('Total Subscriptions:', usage.totalSubscriptions);
  
  if (usage.totalTimers > 10) {
    console.warn('⚠️ High number of active timers detected');
  }
  
  if (usage.totalIntervals > 5) {
    console.warn('⚠️ High number of active intervals detected');
  }
  
  if (usage.totalAnimations > 20) {
    console.warn('⚠️ High number of active animations detected');
  }
  
  console.groupEnd();
}

// Auto-check memory leaks in development
if (__DEV__) {
  setInterval(() => {
    checkMemoryLeaks();
  }, 30000); // Check every 30 seconds in development
}