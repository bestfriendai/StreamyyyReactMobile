/**
 * Performance Configuration System
 * Centralized performance settings and optimizations
 */

import { Dimensions, Platform } from 'react-native';
import { PerformanceUtils } from './performanceMonitoring';

// Device performance tier
type DevicePerformanceTier = 'low' | 'medium' | 'high';

// Performance configuration interface
interface PerformanceConfig {
  // FlatList optimizations
  flatList: {
    initialNumToRender: number;
    maxToRenderPerBatch: number;
    windowSize: number;
    removeClippedSubviews: boolean;
    updateCellsBatchingPeriod: number;
    getItemLayoutEnabled: boolean;
    lazy: boolean;
  };
  
  // Image optimizations
  image: {
    quality: number;
    enableCaching: boolean;
    enableProgressive: boolean;
    maxCacheSize: number;
    compressionRatio: number;
    placeholder: boolean;
    lazyLoading: boolean;
  };
  
  // Animation settings
  animation: {
    duration: number;
    enableSpringAnimations: boolean;
    enableBlurEffects: boolean;
    enableShadows: boolean;
    enableGestures: boolean;
    reducedMotion: boolean;
  };
  
  // Memory management
  memory: {
    maxActiveStreams: number;
    cleanupInterval: number;
    memoryThreshold: number;
    enableAggressiveCleanup: boolean;
    batchUpdates: boolean;
  };
  
  // Rendering optimizations
  rendering: {
    enableVirtualization: boolean;
    enableMemoization: boolean;
    enableShallowComparison: boolean;
    maxRenderDepth: number;
    enableConcurrentFeatures: boolean;
  };
  
  // Network optimizations
  network: {
    enableRequestBatching: boolean;
    requestTimeout: number;
    maxConcurrentRequests: number;
    enableRetry: boolean;
    cacheStrategy: 'aggressive' | 'moderate' | 'minimal';
  };
}

// Performance configurations for different device tiers
const LOW_PERFORMANCE_CONFIG: PerformanceConfig = {
  flatList: {
    initialNumToRender: 3,
    maxToRenderPerBatch: 2,
    windowSize: 5,
    removeClippedSubviews: true,
    updateCellsBatchingPeriod: 200,
    getItemLayoutEnabled: true,
    lazy: true,
  },
  image: {
    quality: 50,
    enableCaching: true,
    enableProgressive: false,
    maxCacheSize: 25 * 1024 * 1024, // 25MB
    compressionRatio: 0.6,
    placeholder: true,
    lazyLoading: true,
  },
  animation: {
    duration: 150,
    enableSpringAnimations: false,
    enableBlurEffects: false,
    enableShadows: false,
    enableGestures: false,
    reducedMotion: true,
  },
  memory: {
    maxActiveStreams: 2,
    cleanupInterval: 10000, // 10 seconds
    memoryThreshold: 0.7,
    enableAggressiveCleanup: true,
    batchUpdates: true,
  },
  rendering: {
    enableVirtualization: true,
    enableMemoization: true,
    enableShallowComparison: true,
    maxRenderDepth: 3,
    enableConcurrentFeatures: false,
  },
  network: {
    enableRequestBatching: true,
    requestTimeout: 8000,
    maxConcurrentRequests: 2,
    enableRetry: false,
    cacheStrategy: 'aggressive',
  },
};

const MEDIUM_PERFORMANCE_CONFIG: PerformanceConfig = {
  flatList: {
    initialNumToRender: 5,
    maxToRenderPerBatch: 3,
    windowSize: 7,
    removeClippedSubviews: true,
    updateCellsBatchingPeriod: 150,
    getItemLayoutEnabled: true,
    lazy: true,
  },
  image: {
    quality: 70,
    enableCaching: true,
    enableProgressive: true,
    maxCacheSize: 50 * 1024 * 1024, // 50MB
    compressionRatio: 0.8,
    placeholder: true,
    lazyLoading: true,
  },
  animation: {
    duration: 200,
    enableSpringAnimations: true,
    enableBlurEffects: false,
    enableShadows: true,
    enableGestures: true,
    reducedMotion: false,
  },
  memory: {
    maxActiveStreams: 4,
    cleanupInterval: 15000, // 15 seconds
    memoryThreshold: 0.8,
    enableAggressiveCleanup: false,
    batchUpdates: true,
  },
  rendering: {
    enableVirtualization: true,
    enableMemoization: true,
    enableShallowComparison: true,
    maxRenderDepth: 5,
    enableConcurrentFeatures: true,
  },
  network: {
    enableRequestBatching: true,
    requestTimeout: 10000,
    maxConcurrentRequests: 4,
    enableRetry: true,
    cacheStrategy: 'moderate',
  },
};

const HIGH_PERFORMANCE_CONFIG: PerformanceConfig = {
  flatList: {
    initialNumToRender: 8,
    maxToRenderPerBatch: 5,
    windowSize: 10,
    removeClippedSubviews: true,
    updateCellsBatchingPeriod: 100,
    getItemLayoutEnabled: true,
    lazy: false,
  },
  image: {
    quality: 85,
    enableCaching: true,
    enableProgressive: true,
    maxCacheSize: 100 * 1024 * 1024, // 100MB
    compressionRatio: 0.9,
    placeholder: true,
    lazyLoading: false,
  },
  animation: {
    duration: 300,
    enableSpringAnimations: true,
    enableBlurEffects: true,
    enableShadows: true,
    enableGestures: true,
    reducedMotion: false,
  },
  memory: {
    maxActiveStreams: 9,
    cleanupInterval: 30000, // 30 seconds
    memoryThreshold: 0.9,
    enableAggressiveCleanup: false,
    batchUpdates: false,
  },
  rendering: {
    enableVirtualization: true,
    enableMemoization: true,
    enableShallowComparison: false,
    maxRenderDepth: 10,
    enableConcurrentFeatures: true,
  },
  network: {
    enableRequestBatching: false,
    requestTimeout: 15000,
    maxConcurrentRequests: 8,
    enableRetry: true,
    cacheStrategy: 'minimal',
  },
};

/**
 * Performance Configuration Manager
 */
class PerformanceConfigManager {
  private currentConfig: PerformanceConfig;
  private deviceTier: DevicePerformanceTier;
  private isLowMemoryMode: boolean = false;
  private listeners: ((config: PerformanceConfig) => void)[] = [];

  constructor() {
    this.deviceTier = this.detectDevicePerformanceTier();
    this.currentConfig = this.getConfigForTier(this.deviceTier);
    console.log(`📱 Device performance tier: ${this.deviceTier}`);
  }

  /**
   * Detect device performance tier
   */
  private detectDevicePerformanceTier(): DevicePerformanceTier {
    const { width, height } = Dimensions.get('window');
    const screenSize = width * height;
    
    // Use multiple factors to determine performance tier
    const factors = {
      screenSize: screenSize > 1920 * 1080 ? 2 : screenSize > 1280 * 720 ? 1 : 0,
      platform: Platform.OS === 'ios' ? 1 : 0,
      // Add more factors based on available APIs
    };
    
    const score = Object.values(factors).reduce((sum, factor) => sum + factor, 0);
    
    if (score >= 3) return 'high';
    if (score >= 1) return 'medium';
    return 'low';
  }

  /**
   * Get configuration for device tier
   */
  private getConfigForTier(tier: DevicePerformanceTier): PerformanceConfig {
    switch (tier) {
      case 'high':
        return HIGH_PERFORMANCE_CONFIG;
      case 'medium':
        return MEDIUM_PERFORMANCE_CONFIG;
      case 'low':
        return LOW_PERFORMANCE_CONFIG;
      default:
        return MEDIUM_PERFORMANCE_CONFIG;
    }
  }

  /**
   * Get current performance configuration
   */
  getConfig(): PerformanceConfig {
    return this.currentConfig;
  }

  /**
   * Get device performance tier
   */
  getDeviceTier(): DevicePerformanceTier {
    return this.deviceTier;
  }

  /**
   * Update configuration based on runtime conditions
   */
  updateConfig(memoryPressure: 'low' | 'moderate' | 'high' | 'critical') {
    let newConfig = { ...this.currentConfig };

    // Adjust based on memory pressure
    if (memoryPressure === 'high' || memoryPressure === 'critical') {
      newConfig = {
        ...newConfig,
        flatList: {
          ...newConfig.flatList,
          initialNumToRender: Math.max(2, newConfig.flatList.initialNumToRender - 2),
          maxToRenderPerBatch: Math.max(1, newConfig.flatList.maxToRenderPerBatch - 1),
          windowSize: Math.max(3, newConfig.flatList.windowSize - 2),
        },
        image: {
          ...newConfig.image,
          quality: Math.max(30, newConfig.image.quality - 20),
          enableProgressive: false,
        },
        animation: {
          ...newConfig.animation,
          duration: Math.max(100, newConfig.animation.duration - 50),
          enableBlurEffects: false,
          enableShadows: false,
        },
        memory: {
          ...newConfig.memory,
          maxActiveStreams: Math.max(1, newConfig.memory.maxActiveStreams - 2),
          cleanupInterval: Math.max(5000, newConfig.memory.cleanupInterval - 5000),
          enableAggressiveCleanup: true,
        },
      };
    }

    this.currentConfig = newConfig;
    this.notifyListeners(newConfig);
  }

  /**
   * Enable low memory mode
   */
  enableLowMemoryMode() {
    if (this.isLowMemoryMode) return;
    
    this.isLowMemoryMode = true;
    
    // Apply aggressive optimizations
    this.currentConfig = {
      ...this.currentConfig,
      flatList: {
        ...this.currentConfig.flatList,
        initialNumToRender: 2,
        maxToRenderPerBatch: 1,
        windowSize: 3,
        removeClippedSubviews: true,
        lazy: true,
      },
      image: {
        ...this.currentConfig.image,
        quality: 40,
        enableProgressive: false,
        lazyLoading: true,
      },
      animation: {
        ...this.currentConfig.animation,
        duration: 100,
        enableSpringAnimations: false,
        enableBlurEffects: false,
        enableShadows: false,
        reducedMotion: true,
      },
      memory: {
        ...this.currentConfig.memory,
        maxActiveStreams: 1,
        cleanupInterval: 5000,
        enableAggressiveCleanup: true,
      },
    };
    
    this.notifyListeners(this.currentConfig);
    console.log('🔥 Low memory mode enabled');
  }

  /**
   * Disable low memory mode
   */
  disableLowMemoryMode() {
    if (!this.isLowMemoryMode) return;
    
    this.isLowMemoryMode = false;
    this.currentConfig = this.getConfigForTier(this.deviceTier);
    this.notifyListeners(this.currentConfig);
    console.log('✅ Low memory mode disabled');
  }

  /**
   * Get optimized FlatList props
   */
  getFlatListProps() {
    const config = this.currentConfig.flatList;
    return {
      initialNumToRender: config.initialNumToRender,
      maxToRenderPerBatch: config.maxToRenderPerBatch,
      windowSize: config.windowSize,
      removeClippedSubviews: config.removeClippedSubviews,
      updateCellsBatchingPeriod: config.updateCellsBatchingPeriod,
      // Add getItemLayout if enabled and items have fixed height
      ...(config.getItemLayoutEnabled && {
        getItemLayout: (data: any, index: number) => ({
          length: 200, // Adjust based on your item height
          offset: 200 * index,
          index,
        }),
      }),
    };
  }

  /**
   * Get optimized image props
   */
  getImageProps() {
    const config = this.currentConfig.image;
    return {
      quality: config.quality,
      cache: config.enableCaching,
      enableProgressiveLoading: config.enableProgressive,
      lazy: config.lazyLoading,
      placeholder: config.placeholder,
    };
  }

  /**
   * Get optimized animation props
   */
  getAnimationProps() {
    const config = this.currentConfig.animation;
    return {
      duration: config.duration,
      enableSpring: config.enableSpringAnimations,
      enableBlur: config.enableBlurEffects,
      enableShadows: config.enableShadows,
      enableGestures: config.enableGestures,
      reducedMotion: config.reducedMotion,
    };
  }

  /**
   * Add configuration change listener
   */
  addConfigListener(listener: (config: PerformanceConfig) => void) {
    this.listeners.push(listener);
    
    // Return cleanup function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify listeners of configuration changes
   */
  private notifyListeners(config: PerformanceConfig) {
    this.listeners.forEach(listener => {
      try {
        listener(config);
      } catch (error) {
        console.error('Performance config listener error:', error);
      }
    });
  }

  /**
   * Get performance recommendations
   */
  getPerformanceRecommendations(): {
    component: string;
    recommendation: string;
    priority: 'low' | 'medium' | 'high';
  }[] {
    const recommendations = [];
    
    if (this.deviceTier === 'low') {
      recommendations.push(
        {
          component: 'FlatList',
          recommendation: 'Use getItemLayout for better scroll performance',
          priority: 'high' as const,
        },
        {
          component: 'Images',
          recommendation: 'Enable lazy loading and reduce image quality',
          priority: 'high' as const,
        },
        {
          component: 'Animations',
          recommendation: 'Disable complex animations and blur effects',
          priority: 'medium' as const,
        }
      );
    }
    
    if (this.isLowMemoryMode) {
      recommendations.push({
        component: 'Memory',
        recommendation: 'Reduce active streams and enable aggressive cleanup',
        priority: 'high' as const,
      });
    }
    
    return recommendations;
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return {
      deviceTier: this.deviceTier,
      isLowMemoryMode: this.isLowMemoryMode,
      currentConfig: this.currentConfig,
      screenSize: Dimensions.get('window'),
      platform: Platform.OS,
    };
  }
}

// Global performance configuration manager
export const performanceConfig = new PerformanceConfigManager();

/**
 * React hook for performance configuration
 */
export const usePerformanceConfig = () => {
  const [config, setConfig] = React.useState(performanceConfig.getConfig());
  
  React.useEffect(() => {
    const removeListener = performanceConfig.addConfigListener(setConfig);
    return removeListener;
  }, []);
  
  return {
    config,
    deviceTier: performanceConfig.getDeviceTier(),
    getFlatListProps: performanceConfig.getFlatListProps.bind(performanceConfig),
    getImageProps: performanceConfig.getImageProps.bind(performanceConfig),
    getAnimationProps: performanceConfig.getAnimationProps.bind(performanceConfig),
    enableLowMemoryMode: performanceConfig.enableLowMemoryMode.bind(performanceConfig),
    disableLowMemoryMode: performanceConfig.disableLowMemoryMode.bind(performanceConfig),
    getRecommendations: performanceConfig.getPerformanceRecommendations.bind(performanceConfig),
    getMetrics: performanceConfig.getPerformanceMetrics.bind(performanceConfig),
  };
};

export default performanceConfig;