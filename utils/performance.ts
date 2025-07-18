/**
 * Performance Utilities - Main Export
 * Centralized exports for all performance-related utilities
 */

// Core performance monitoring
export {
  useRenderPerformance,
  useListPerformance,
  useMemoryMonitoring,
  useOptimizedState,
  useBatchedUpdates,
  useDebounce,
  useThrottle,
  useDeepMemo,
  PerformanceUtils,
  default as performanceMonitoring,
} from './performanceMonitoring';

// Memory management
export {
  memoryManager,
  cleanupRegistry,
  useCleanup,
  useMemoryState,
  useSafeTimer,
  useSafeSubscription,
  MemoryUtils,
  default as memoryManagement,
} from './memoryManagement';

// Image optimization
export {
  imageCache,
  ImageOptimizer,
  useOptimizedImage,
  useImagePreloader,
  LazyImage,
  default as imageOptimization,
} from './imageOptimization';

// Performance configuration
export {
  performanceConfig,
  usePerformanceConfig,
  default as performanceConfiguration,
} from './performanceConfig';

// Re-export optimized components
export { default as OptimizedImage, ImagePresets, ImageSizes } from '../components/OptimizedImage';

// Performance constants
export const PERFORMANCE_CONSTANTS = {
  // FlatList optimization thresholds
  FLATLIST: {
    SMALL_LIST_THRESHOLD: 50,
    MEDIUM_LIST_THRESHOLD: 200,
    LARGE_LIST_THRESHOLD: 1000,
    INITIAL_RENDER_SMALL: 5,
    INITIAL_RENDER_MEDIUM: 10,
    INITIAL_RENDER_LARGE: 15,
    WINDOW_SIZE_SMALL: 5,
    WINDOW_SIZE_MEDIUM: 10,
    WINDOW_SIZE_LARGE: 21,
  },
  
  // Image optimization thresholds
  IMAGE: {
    QUALITY_HIGH: 90,
    QUALITY_MEDIUM: 70,
    QUALITY_LOW: 50,
    CACHE_SIZE_HIGH: 100 * 1024 * 1024, // 100MB
    CACHE_SIZE_MEDIUM: 50 * 1024 * 1024, // 50MB
    CACHE_SIZE_LOW: 25 * 1024 * 1024, // 25MB
  },
  
  // Animation thresholds
  ANIMATION: {
    DURATION_FAST: 150,
    DURATION_NORMAL: 250,
    DURATION_SLOW: 400,
    SPRING_CONFIG_FAST: { damping: 25, stiffness: 300 },
    SPRING_CONFIG_NORMAL: { damping: 20, stiffness: 200 },
    SPRING_CONFIG_SLOW: { damping: 15, stiffness: 100 },
  },
  
  // Memory management thresholds
  MEMORY: {
    WARNING_THRESHOLD: 0.7,
    CRITICAL_THRESHOLD: 0.9,
    CLEANUP_INTERVAL: 30000, // 30 seconds
    LOW_MEMORY_CLEANUP_INTERVAL: 5000, // 5 seconds
  },
  
  // Performance targets
  PERFORMANCE_TARGETS: {
    RENDER_TIME_TARGET: 16, // 16ms for 60fps
    INTERACTION_RESPONSE_TIME: 100, // 100ms
    ANIMATION_FRAME_DROP_THRESHOLD: 3,
    MEMORY_USAGE_TARGET: 0.6, // 60% of available memory
  },
};

// Performance utility functions
export const PerformanceHelpers = {
  /**
   * Calculate optimal FlatList props based on list size
   */
  getOptimalFlatListProps: (itemCount: number, itemHeight?: number) => {
    const { FLATLIST } = PERFORMANCE_CONSTANTS;
    
    if (itemCount <= FLATLIST.SMALL_LIST_THRESHOLD) {
      return {
        initialNumToRender: FLATLIST.INITIAL_RENDER_SMALL,
        maxToRenderPerBatch: 5,
        windowSize: FLATLIST.WINDOW_SIZE_SMALL,
        removeClippedSubviews: false,
        updateCellsBatchingPeriod: 50,
        getItemLayout: itemHeight ? (data: any, index: number) => ({
          length: itemHeight,
          offset: itemHeight * index,
          index,
        }) : undefined,
      };
    } else if (itemCount <= FLATLIST.MEDIUM_LIST_THRESHOLD) {
      return {
        initialNumToRender: FLATLIST.INITIAL_RENDER_MEDIUM,
        maxToRenderPerBatch: 8,
        windowSize: FLATLIST.WINDOW_SIZE_MEDIUM,
        removeClippedSubviews: true,
        updateCellsBatchingPeriod: 100,
        getItemLayout: itemHeight ? (data: any, index: number) => ({
          length: itemHeight,
          offset: itemHeight * index,
          index,
        }) : undefined,
      };
    } else {
      return {
        initialNumToRender: FLATLIST.INITIAL_RENDER_LARGE,
        maxToRenderPerBatch: 10,
        windowSize: FLATLIST.WINDOW_SIZE_LARGE,
        removeClippedSubviews: true,
        updateCellsBatchingPeriod: 200,
        getItemLayout: itemHeight ? (data: any, index: number) => ({
          length: itemHeight,
          offset: itemHeight * index,
          index,
        }) : undefined,
      };
    }
  },

  /**
   * Get optimal image quality based on context
   */
  getOptimalImageQuality: (context: 'thumbnail' | 'card' | 'fullscreen', deviceTier: 'low' | 'medium' | 'high') => {
    const { IMAGE } = PERFORMANCE_CONSTANTS;
    
    const baseQuality = {
      thumbnail: IMAGE.QUALITY_MEDIUM,
      card: IMAGE.QUALITY_HIGH,
      fullscreen: IMAGE.QUALITY_HIGH,
    }[context];
    
    const tierMultiplier = {
      low: 0.7,
      medium: 0.9,
      high: 1.0,
    }[deviceTier];
    
    return Math.floor(baseQuality * tierMultiplier);
  },

  /**
   * Get optimal animation duration based on context
   */
  getOptimalAnimationDuration: (context: 'micro' | 'standard' | 'complex', deviceTier: 'low' | 'medium' | 'high') => {
    const { ANIMATION } = PERFORMANCE_CONSTANTS;
    
    const baseDuration = {
      micro: ANIMATION.DURATION_FAST,
      standard: ANIMATION.DURATION_NORMAL,
      complex: ANIMATION.DURATION_SLOW,
    }[context];
    
    const tierMultiplier = {
      low: 0.7,
      medium: 0.9,
      high: 1.0,
    }[deviceTier];
    
    return Math.floor(baseDuration * tierMultiplier);
  },

  /**
   * Calculate optimal chunk size for batch processing
   */
  getOptimalChunkSize: (dataSize: number, memoryPressure: 'low' | 'moderate' | 'high' | 'critical') => {
    const baseChunkSize = Math.min(100, Math.max(10, Math.floor(dataSize / 10)));
    
    const pressureMultiplier = {
      low: 1.0,
      moderate: 0.8,
      high: 0.5,
      critical: 0.3,
    }[memoryPressure];
    
    return Math.floor(baseChunkSize * pressureMultiplier);
  },

  /**
   * Determine if feature should be enabled based on performance context
   */
  shouldEnableFeature: (
    feature: 'animations' | 'blur' | 'shadows' | 'gestures' | 'progressive_images',
    deviceTier: 'low' | 'medium' | 'high',
    memoryPressure: 'low' | 'moderate' | 'high' | 'critical'
  ) => {
    // Disable resource-intensive features on low-tier devices or high memory pressure
    if (deviceTier === 'low' || memoryPressure === 'high' || memoryPressure === 'critical') {
      return ['animations'].includes(feature);
    }
    
    // Enable most features on medium-tier devices with moderate memory pressure
    if (deviceTier === 'medium' && memoryPressure !== 'high') {
      return ['animations', 'gestures', 'progressive_images'].includes(feature);
    }
    
    // Enable all features on high-tier devices with low memory pressure
    return true;
  },
};

// Performance monitoring decorator
export const withPerformanceMonitoring = <T extends object>(
  WrappedComponent: React.ComponentType<T>,
  componentName: string
) => {
  return React.memo((props: T) => {
    const { metrics, isPerformant } = useRenderPerformance(componentName);
    
    React.useEffect(() => {
      if (!isPerformant) {
        console.warn(`⚠️ ${componentName} performance warning:`, metrics);
      }
    }, [isPerformant, metrics]);
    
    return <WrappedComponent {...props} />;
  });
};

// Export everything as default
export default {
  performanceMonitoring,
  memoryManagement,
  imageOptimization,
  performanceConfiguration,
  PERFORMANCE_CONSTANTS,
  PerformanceHelpers,
  withPerformanceMonitoring,
};