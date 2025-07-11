/**
 * Image Optimization and Caching System for React Native Multi-Stream App
 * Provides efficient image loading, caching, and optimization strategies
 */

import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image, Dimensions } from 'react-native';

// Simple logging functions
const logError = (error: Error, context?: any) => {
  console.error('Error:', error.message, context);
};

const logDebug = (message: string) => {
  console.log('Debug:', message);
};

interface CacheEntry {
  uri: string;
  timestamp: number;
  size: number;
  dimensions?: { width: number; height: number };
  format?: string;
  quality?: number;
}

interface ImageOptimizationOptions {
  quality?: number; // 0-100
  format?: 'jpeg' | 'png' | 'webp';
  maxWidth?: number;
  maxHeight?: number;
  priority?: 'low' | 'normal' | 'high';
  cache?: boolean;
  placeholder?: string;
  fallback?: string;
}

interface ThumbnailConfig {
  width: number;
  height: number;
  quality?: number;
}

class ImageCache {
  private cache: Map<string, CacheEntry> = new Map();
  private loadingPromises: Map<string, Promise<string>> = new Map();
  private maxCacheSize: number = 50 * 1024 * 1024; // 50MB
  private currentCacheSize: number = 0;
  private maxAge: number = 7 * 24 * 60 * 60 * 1000; // 7 days

  constructor() {
    this.loadCacheFromStorage();
  }

  /**
   * Load cache metadata from AsyncStorage
   */
  private async loadCacheFromStorage(): Promise<void> {
    try {
      const cacheDataString = await AsyncStorage.getItem('image_cache_metadata');
      if (cacheDataString) {
        const cacheData = JSON.parse(cacheDataString);
        this.cache = new Map(cacheData.entries || []);
        this.currentCacheSize = cacheData.totalSize || 0;
        
        // Clean expired entries on load
        await this.cleanExpiredEntries();
      }
    } catch (error) {
      logError(error as Error, { component: 'ImageCache', action: 'loadCacheFromStorage' });
    }
  }

  /**
   * Save cache metadata to AsyncStorage
   */
  private async saveCacheToStorage(): Promise<void> {
    try {
      const cacheData = {
        entries: Array.from(this.cache.entries()),
        totalSize: this.currentCacheSize,
        lastUpdated: Date.now(),
      };
      
      await AsyncStorage.setItem('image_cache_metadata', JSON.stringify(cacheData));
    } catch (error) {
      logError(error as Error, { component: 'ImageCache', action: 'saveCacheToStorage' });
    }
  }

  /**
   * Clean expired cache entries
   */
  private async cleanExpiredEntries(): Promise<void> {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.maxAge) {
        expiredKeys.push(key);
        this.currentCacheSize -= entry.size;
      }
    }
    
    // Remove expired entries
    for (const key of expiredKeys) {
      this.cache.delete(key);
      try {
        await AsyncStorage.removeItem(`image_cache_${this.hashUrl(key)}`);
      } catch (error) {
        logError(error as Error, { component: 'ImageCache', action: 'cleanExpiredEntries' });
      }
    }
    
    if (expiredKeys.length > 0) {
      logDebug(`Cleaned ${expiredKeys.length} expired cache entries`);
      await this.saveCacheToStorage();
    }
  }

  /**
   * Ensure cache size doesn't exceed limit
   */
  private async enforceSize(): Promise<void> {
    if (this.currentCacheSize <= this.maxCacheSize) return;
    
    // Sort by timestamp (oldest first)
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp);
    
    // Remove oldest entries until we're under the limit
    while (this.currentCacheSize > this.maxCacheSize * 0.8 && entries.length > 0) {
      const [key, entry] = entries.shift()!;
      this.cache.delete(key);
      this.currentCacheSize -= entry.size;
      
      try {
        await AsyncStorage.removeItem(`image_cache_${this.hashUrl(key)}`);
      } catch (error) {
        logError(error as Error, { component: 'ImageCache', action: 'enforceSize' });
      }
    }
    
    await this.saveCacheToStorage();
    logDebug(`Cache size enforced: ${(this.currentCacheSize / 1024 / 1024).toFixed(2)}MB`);
  }

  /**
   * Hash URL for storage key
   */
  private hashUrl(url: string): string {
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Get cached image
   */
  async get(url: string): Promise<string | null> {
    const entry = this.cache.get(url);
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(url);
      return null;
    }
    
    try {
      const cachedData = await AsyncStorage.getItem(`image_cache_${this.hashUrl(url)}`);
      if (cachedData) {
        // Update timestamp for LRU
        entry.timestamp = Date.now();
        return cachedData;
      }
    } catch (error) {
      logError(error as Error, { component: 'ImageCache', action: 'get' });
    }
    
    // Remove invalid entry
    this.cache.delete(url);
    return null;
  }

  /**
   * Cache image data
   */
  async set(url: string, data: string, size: number): Promise<void> {
    try {
      const entry: CacheEntry = {
        uri: url,
        timestamp: Date.now(),
        size,
      };
      
      // Store the data
      await AsyncStorage.setItem(`image_cache_${this.hashUrl(url)}`, data);
      
      // Update cache metadata
      const existingEntry = this.cache.get(url);
      if (existingEntry) {
        this.currentCacheSize -= existingEntry.size;
      }
      
      this.cache.set(url, entry);
      this.currentCacheSize += size;
      
      // Enforce cache size limits
      await this.enforceSize();
      await this.saveCacheToStorage();
      
    } catch (error) {
      logError(error as Error, { component: 'ImageCache', action: 'set' });
    }
  }

  /**
   * Check if image is cached
   */
  has(url: string): boolean {
    const entry = this.cache.get(url);
    return entry !== undefined && (Date.now() - entry.timestamp) <= this.maxAge;
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      // Remove all cached images
      for (const url of this.cache.keys()) {
        await AsyncStorage.removeItem(`image_cache_${this.hashUrl(url)}`);
      }
      
      // Clear metadata
      await AsyncStorage.removeItem('image_cache_metadata');
      
      // Reset cache
      this.cache.clear();
      this.currentCacheSize = 0;
      
      logDebug('Image cache cleared');
    } catch (error) {
      logError(error as Error, { component: 'ImageCache', action: 'clear' });
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    totalEntries: number;
    totalSize: number;
    sizeInMB: number;
    maxSize: number;
    maxSizeInMB: number;
    usage: number;
  } {
    return {
      totalEntries: this.cache.size,
      totalSize: this.currentCacheSize,
      sizeInMB: this.currentCacheSize / 1024 / 1024,
      maxSize: this.maxCacheSize,
      maxSizeInMB: this.maxCacheSize / 1024 / 1024,
      usage: (this.currentCacheSize / this.maxCacheSize) * 100,
    };
  }
}

// Global cache instance
const imageCache = new ImageCache();

/**
 * Image optimization utilities
 */
class ImageOptimizer {
  /**
   * Optimize Twitch thumbnail URL
   */
  static optimizeTwitchThumbnail(
    templateUrl: string,
    config: ThumbnailConfig = { width: 320, height: 180, quality: 80 }
  ): string {
    if (!templateUrl || !templateUrl.includes('{width}')) {
      return templateUrl;
    }
    
    // Replace template variables
    return templateUrl
      .replace('{width}', config.width.toString())
      .replace('{height}', config.height.toString());
  }

  /**
   * Get responsive image size based on screen dimensions
   */
  static getResponsiveSize(
    containerWidth: number,
    containerHeight: number,
    aspectRatio: number = 16 / 9
  ): { width: number; height: number } {
    const { width: screenWidth } = Dimensions.get('window');
    
    // Use device pixel ratio for high-DPI displays
    const pixelRatio = 1; // Keep at 1 for performance, can be increased for quality
    
    let width = Math.min(containerWidth * pixelRatio, screenWidth * pixelRatio);
    let height = width / aspectRatio;
    
    // Ensure we don't exceed container height
    if (height > containerHeight * pixelRatio) {
      height = containerHeight * pixelRatio;
      width = height * aspectRatio;
    }
    
    // Round to even numbers for better compression
    return {
      width: Math.round(width / 2) * 2,
      height: Math.round(height / 2) * 2,
    };
  }

  /**
   * Generate srcSet for responsive images
   */
  static generateSrcSet(
    baseUrl: string,
    sizes: { width: number; height: number; suffix: string }[]
  ): string {
    return sizes
      .map(({ width, height, suffix }) => {
        const url = baseUrl
          .replace('{width}', width.toString())
          .replace('{height}', height.toString());
        return `${url} ${suffix}`;
      })
      .join(', ');
  }

  /**
   * Preload critical images
   */
  static async preloadImages(urls: string[]): Promise<void> {
    const promises = urls.map(url => {
      return new Promise<void>((resolve) => {
        Image.prefetch(url)
          .then(() => {
            logDebug(`Preloaded image: ${url}`);
            resolve();
          })
          .catch(error => {
            logError(error, { component: 'ImageOptimizer', action: 'preloadImages', additionalData: { url } });
            resolve(); // Don't fail the entire batch
          });
      });
    });
    
    await Promise.all(promises);
  }

  /**
   * Optimize image URL based on options
   */
  static optimizeUrl(
    url: string,
    options: ImageOptimizationOptions = {}
  ): string {
    if (!url) return url;
    
    const {
      quality = 80,
      maxWidth,
      maxHeight,
    } = options;
    
    // For Twitch thumbnails
    if (url.includes('twitch.tv') && url.includes('{width}')) {
      const { width, height } = this.getResponsiveSize(
        maxWidth || 320,
        maxHeight || 180
      );
      
      return this.optimizeTwitchThumbnail(url, {
        width,
        height,
        quality,
      });
    }
    
    // For other URLs, return as-is (could be extended for other CDNs)
    return url;
  }
}

/**
 * Custom hook for optimized image loading
 */
export const useOptimizedImage = (
  url: string,
  options: ImageOptimizationOptions = {}
) => {
  const [imageUri, setImageUri] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  
  const optimizedUrl = React.useMemo(() => {
    return ImageOptimizer.optimizeUrl(url, options);
  }, [url, options]);
  
  React.useEffect(() => {
    if (!optimizedUrl) {
      setLoading(false);
      return;
    }
    
    const loadImage = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check cache first
        if (options.cache !== false) {
          const cachedUri = await imageCache.get(optimizedUrl);
          if (cachedUri) {
            setImageUri(cachedUri);
            setLoading(false);
            return;
          }
        }
        
        // Load from network
        const success = await Image.prefetch(optimizedUrl);
        if (success) {
          setImageUri(optimizedUrl);
          
          // Cache the result if enabled
          if (options.cache !== false) {
            // Estimate size (rough approximation)
            const estimatedSize = 50 * 1024; // 50KB average
            await imageCache.set(optimizedUrl, optimizedUrl, estimatedSize);
          }
        } else {
          throw new Error('Failed to load image');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        
        // Use fallback if provided
        if (options.fallback) {
          setImageUri(options.fallback);
        }
        
        logError(err as Error, {
          component: 'useOptimizedImage',
          action: 'loadImage',
          additionalData: { url: optimizedUrl },
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadImage();
  }, [optimizedUrl, options.cache, options.fallback]);
  
  return {
    imageUri: imageUri || options.placeholder,
    loading,
    error,
    optimizedUrl,
  };
};

/**
 * Hook for batch image preloading
 */
export const useImagePreloader = () => {
  const [preloadProgress, setPreloadProgress] = React.useState(0);
  const [isPreloading, setIsPreloading] = React.useState(false);
  
  const preloadImages = React.useCallback(async (urls: string[]) => {
    if (urls.length === 0) return;
    
    setIsPreloading(true);
    setPreloadProgress(0);
    
    let loaded = 0;
    const updateProgress = () => {
      loaded++;
      setPreloadProgress((loaded / urls.length) * 100);
    };
    
    const promises = urls.map(async (url) => {
      try {
        await Image.prefetch(url);
        updateProgress();
      } catch (error) {
        updateProgress(); // Still count as processed
      }
    });
    
    await Promise.all(promises);
    setIsPreloading(false);
    
    logDebug(`Preloaded ${urls.length} images`);
  }, []);
  
  return {
    preloadImages,
    preloadProgress,
    isPreloading,
  };
};

/**
 * Performance-focused lazy image component
 */
interface LazyImageProps {
  source: { uri: string } | number;
  style?: any;
  placeholder?: string;
  onLoad?: () => void;
  onError?: (error: any) => void;
  options?: ImageOptimizationOptions;
}

export const LazyImage: React.FC<LazyImageProps> = React.memo(({ source, style, placeholder, onLoad, onError, options = {} }) => {
  const [shouldLoad, setShouldLoad] = React.useState(false);
  
  // Lazy loading logic would go here
  // For now, we'll load immediately
  React.useEffect(() => {
    setShouldLoad(true);
  }, []);
  
  const imageSource = typeof source === 'object' && source.uri
    ? { uri: ImageOptimizer.optimizeUrl(source.uri, options) }
    : source;
  
  if (!shouldLoad && placeholder) {
    return (
      <Image
        source={{ uri: placeholder }}
        style={style}
        resizeMode="cover"
      />
    );
  }
  
  return (
    <Image
      source={imageSource}
      style={style}
      onLoad={onLoad}
      onError={onError}
      resizeMode="cover"
    />
  );
});

// Export utilities
export {
  imageCache,
  ImageOptimizer,
};

export default {
  imageCache,
  ImageOptimizer,
  useOptimizedImage,
  useImagePreloader,
  LazyImage,
};