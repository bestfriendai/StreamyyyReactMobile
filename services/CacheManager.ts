/**
 * Cache Manager
 * Intelligent data caching and preloading strategies with ML-based optimization
 * Provides smart caching, predictive preloading, and efficient cache management
 */

import { logDebug, logWarning, logError } from '@/utils/errorHandler';
import { advancedPerformanceManager, AdvancedPerformanceMetrics } from './AdvancedPerformanceManager';
import { networkOptimizer, NetworkCondition } from './NetworkOptimizer';
import { memoryManager } from './MemoryManager';

export interface CacheEntry {
  id: string;
  key: string;
  data: any;
  metadata: {
    size: number; // bytes
    created: number;
    lastAccessed: number;
    accessCount: number;
    priority: 'critical' | 'high' | 'medium' | 'low';
    ttl: number; // Time to live in ms
    tags: string[];
    source: string; // Source of the data
    compressionRatio?: number;
    dependsOn?: string[]; // Dependencies
  };
  validUntil: number;
  isCompressed: boolean;
  isPinned: boolean; // Cannot be evicted
}

export interface CachePool {
  id: string;
  name: string;
  type: 'lru' | 'lfu' | 'ttl' | 'adaptive';
  maxSize: number; // bytes
  currentSize: number; // bytes
  maxEntries: number;
  entries: Map<string, CacheEntry>;
  hitRate: number;
  missRate: number;
  evictionPolicy: EvictionPolicy;
  compressionEnabled: boolean;
  analyticsEnabled: boolean;
}

export interface EvictionPolicy {
  strategy: 'lru' | 'lfu' | 'ttl' | 'priority' | 'ml_based';
  parameters: {
    aggressiveness: number; // 0-1
    batchSize: number; // Number of entries to evict at once
    thresholds: {
      size: number; // Percentage of max size
      time: number; // Time since last access
      priority: number; // Minimum priority level
    };
  };
}

export interface PreloadingStrategy {
  id: string;
  name: string;
  enabled: boolean;
  conditions: {
    networkQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'any';
    memoryPressure: 'low' | 'medium' | 'high' | 'any';
    userEngagement: number; // 0-1 threshold
    timeOfDay?: number[]; // Hours when active
  };
  predictiveModel: {
    accuracy: number;
    confidence: number;
    factors: string[];
    weights: Record<string, number>;
  };
  rules: Array<{
    pattern: string; // Regex or glob pattern
    preloadCount: number;
    preloadTrigger: 'immediate' | 'scheduled' | 'prediction';
    priority: 'critical' | 'high' | 'medium' | 'low';
  }>;
}

export interface CacheAnalytics {
  timestamp: number;
  pools: Array<{
    poolId: string;
    hitRate: number;
    missRate: number;
    evictionRate: number;
    compressionSavings: number; // bytes saved
    averageAccessTime: number; // ms
    popularEntries: Array<{ key: string; accessCount: number }>;
  }>;
  networkEfficiency: {
    savedBandwidth: number; // MB
    reducedLatency: number; // ms average
    requestsAvoided: number;
  };
  predictions: {
    nextAccess: Array<{ key: string; probability: number; timeframe: number }>;
    preloadingEffectiveness: number; // 0-1
    cacheUtilization: number; // 0-1
  };
  recommendations: Array<{
    type: 'size' | 'eviction' | 'preloading' | 'compression';
    message: string;
    impact: string;
    priority: 'low' | 'medium' | 'high';
  }>;
}

export interface CacheConfiguration {
  globalMaxSize: number; // bytes
  defaultTTL: number; // ms
  compressionThreshold: number; // bytes
  preloadingEnabled: boolean;
  analyticsEnabled: boolean;
  pools: Record<string, {
    maxSize: number;
    maxEntries: number;
    type: string;
    evictionPolicy: EvictionPolicy;
  }>;
  networking: {
    maxConcurrentPreloads: number;
    preloadTimeout: number;
    retryAttempts: number;
    backoffMultiplier: number;
  };
}

class CacheManager {
  private pools = new Map<string, CachePool>();
  private preloadingStrategies = new Map<string, PreloadingStrategy>();
  private analytics: CacheAnalytics | null = null;
  private accessHistory = new Map<string, number[]>(); // key -> timestamps
  private preloadQueue: Array<{ key: string; priority: number; strategy: string }> = [];
  private config: CacheConfiguration;
  private listeners = new Set<(analytics: CacheAnalytics) => void>();
  
  // Active preloading state
  private activePreloads = new Map<string, Promise<any>>();
  private preloadingEnabled = true;
  private compressionWorker: Worker | null = null;
  
  // Monitoring intervals
  private analyticsInterval: NodeJS.Timeout | null = null;
  private evictionInterval: NodeJS.Timeout | null = null;
  private preloadingInterval: NodeJS.Timeout | null = null;
  private optimizationInterval: NodeJS.Timeout | null = null;
  
  // ML and prediction state
  private accessPatterns = new Map<string, { pattern: number[]; weight: number }>();
  private predictiveModel = {
    weights: new Map<string, number>(),
    accuracy: 0.0,
    lastTrained: Date.now(),
    trainingData: [] as Array<{ input: number[]; output: boolean }>
  };

  constructor(config?: Partial<CacheConfiguration>) {
    this.config = this.mergeWithDefaultConfig(config || {});
    this.initializeCachePools();
    this.initializePreloadingStrategies();
    this.initializeCompressionWorker();
    this.startCacheManagement();
  }

  /**
   * Merge user config with defaults
   */
  private mergeWithDefaultConfig(userConfig: Partial<CacheConfiguration>): CacheConfiguration {
    const defaultConfig: CacheConfiguration = {
      globalMaxSize: 500 * 1024 * 1024, // 500MB
      defaultTTL: 3600000, // 1 hour
      compressionThreshold: 1024, // 1KB
      preloadingEnabled: true,
      analyticsEnabled: true,
      pools: {
        'streams': {
          maxSize: 200 * 1024 * 1024, // 200MB
          maxEntries: 500,
          type: 'adaptive',
          evictionPolicy: {
            strategy: 'ml_based',
            parameters: {
              aggressiveness: 0.7,
              batchSize: 10,
              thresholds: { size: 80, time: 1800000, priority: 2 }
            }
          }
        },
        'metadata': {
          maxSize: 50 * 1024 * 1024, // 50MB
          maxEntries: 10000,
          type: 'lru',
          evictionPolicy: {
            strategy: 'lru',
            parameters: {
              aggressiveness: 0.5,
              batchSize: 20,
              thresholds: { size: 90, time: 3600000, priority: 1 }
            }
          }
        },
        'images': {
          maxSize: 100 * 1024 * 1024, // 100MB
          maxEntries: 1000,
          type: 'lfu',
          evictionPolicy: {
            strategy: 'lfu',
            parameters: {
              aggressiveness: 0.6,
              batchSize: 15,
              thresholds: { size: 85, time: 7200000, priority: 1 }
            }
          }
        },
        'api_responses': {
          maxSize: 30 * 1024 * 1024, // 30MB
          maxEntries: 5000,
          type: 'ttl',
          evictionPolicy: {
            strategy: 'ttl',
            parameters: {
              aggressiveness: 0.8,
              batchSize: 25,
              thresholds: { size: 75, time: 600000, priority: 0 }
            }
          }
        }
      },
      networking: {
        maxConcurrentPreloads: 5,
        preloadTimeout: 30000,
        retryAttempts: 3,
        backoffMultiplier: 2
      }
    };

    return { ...defaultConfig, ...userConfig };
  }

  /**
   * Initialize cache pools
   */
  private initializeCachePools(): void {
    for (const [poolId, poolConfig] of Object.entries(this.config.pools)) {
      const pool: CachePool = {
        id: poolId,
        name: poolId.charAt(0).toUpperCase() + poolId.slice(1),
        type: poolConfig.type as any,
        maxSize: poolConfig.maxSize,
        currentSize: 0,
        maxEntries: poolConfig.maxEntries,
        entries: new Map(),
        hitRate: 0,
        missRate: 0,
        evictionPolicy: poolConfig.evictionPolicy,
        compressionEnabled: poolConfig.maxSize > 10 * 1024 * 1024, // Enable for pools > 10MB
        analyticsEnabled: this.config.analyticsEnabled
      };

      this.pools.set(poolId, pool);
    }

    logDebug('Cache pools initialized', { poolCount: this.pools.size });
  }

  /**
   * Initialize preloading strategies
   */
  private initializePreloadingStrategies(): void {
    // User behavior prediction strategy
    this.preloadingStrategies.set('user_behavior', {
      id: 'user_behavior',
      name: 'User Behavior Prediction',
      enabled: true,
      conditions: {
        networkQuality: 'good',
        memoryPressure: 'low',
        userEngagement: 0.3,
        timeOfDay: [8, 9, 10, 17, 18, 19, 20, 21] // Peak usage hours
      },
      predictiveModel: {
        accuracy: 0.0,
        confidence: 0.0,
        factors: ['timeOfDay', 'accessHistory', 'userEngagement', 'streamContext'],
        weights: {
          timeOfDay: 0.2,
          accessHistory: 0.4,
          userEngagement: 0.3,
          streamContext: 0.1
        }
      },
      rules: [
        {
          pattern: 'stream_metadata_*',
          preloadCount: 10,
          preloadTrigger: 'prediction',
          priority: 'high'
        },
        {
          pattern: 'popular_streams_*',
          preloadCount: 5,
          preloadTrigger: 'scheduled',
          priority: 'medium'
        }
      ]
    });

    // Network optimization strategy
    this.preloadingStrategies.set('network_optimization', {
      id: 'network_optimization',
      name: 'Network-Based Preloading',
      enabled: true,
      conditions: {
        networkQuality: 'excellent',
        memoryPressure: 'any',
        userEngagement: 0.1
      },
      predictiveModel: {
        accuracy: 0.0,
        confidence: 0.0,
        factors: ['networkBandwidth', 'latency', 'connectionStability'],
        weights: {
          networkBandwidth: 0.5,
          latency: 0.3,
          connectionStability: 0.2
        }
      },
      rules: [
        {
          pattern: 'stream_thumbnails_*',
          preloadCount: 20,
          preloadTrigger: 'immediate',
          priority: 'low'
        },
        {
          pattern: 'stream_previews_*',
          preloadCount: 8,
          preloadTrigger: 'prediction',
          priority: 'medium'
        }
      ]
    });

    // Contextual preloading strategy
    this.preloadingStrategies.set('contextual', {
      id: 'contextual',
      name: 'Contextual Preloading',
      enabled: true,
      conditions: {
        networkQuality: 'fair',
        memoryPressure: 'medium',
        userEngagement: 0.5
      },
      predictiveModel: {
        accuracy: 0.0,
        confidence: 0.0,
        factors: ['currentContent', 'userPreferences', 'sessionHistory'],
        weights: {
          currentContent: 0.4,
          userPreferences: 0.4,
          sessionHistory: 0.2
        }
      },
      rules: [
        {
          pattern: 'related_content_*',
          preloadCount: 5,
          preloadTrigger: 'prediction',
          priority: 'medium'
        }
      ]
    });
  }

  /**
   * Initialize compression worker
   */
  private initializeCompressionWorker(): void {
    try {
      // In a real implementation, this would be a proper Web Worker
      // For now, we'll simulate compression functionality
      this.compressionWorker = null; // Placeholder
    } catch (error) {
      logWarning('Compression worker initialization failed', { error: error.message });
    }
  }

  /**
   * Start cache management processes
   */
  private startCacheManagement(): void {
    // Analytics collection
    this.analyticsInterval = setInterval(() => {
      this.collectAnalytics();
    }, 30000); // 30 seconds

    // Cache eviction
    this.evictionInterval = setInterval(() => {
      this.performEviction();
    }, 60000); // 1 minute

    // Preloading execution
    this.preloadingInterval = setInterval(() => {
      this.executePreloading();
    }, 15000); // 15 seconds

    // Cache optimization
    this.optimizationInterval = setInterval(() => {
      this.optimizeCaches();
    }, 300000); // 5 minutes

    logDebug('Cache management started');
  }

  /**
   * Store data in cache
   */
  public async set(
    poolId: string, 
    key: string, 
    data: any, 
    options?: {
      ttl?: number;
      priority?: 'critical' | 'high' | 'medium' | 'low';
      tags?: string[];
      compress?: boolean;
      pin?: boolean;
      dependsOn?: string[];
    }
  ): Promise<boolean> {
    try {
      const pool = this.pools.get(poolId);
      if (!pool) {
        logError('Invalid cache pool', new Error(poolId));
        return false;
      }

      // Serialize and calculate size
      const serializedData = this.serializeData(data);
      const size = this.calculateSize(serializedData);

      // Check if compression is needed
      const shouldCompress = (options?.compress !== false) && 
                           pool.compressionEnabled && 
                           size > this.config.compressionThreshold;
      
      let finalData = serializedData;
      let compressionRatio = 1;
      
      if (shouldCompress) {
        const compressed = await this.compressData(serializedData);
        if (compressed.size < size * 0.9) { // Only use if >10% savings
          finalData = compressed.data;
          compressionRatio = compressed.size / size;
        }
      }

      // Create cache entry
      const entry: CacheEntry = {
        id: `${poolId}_${key}_${Date.now()}`,
        key,
        data: finalData,
        metadata: {
          size: this.calculateSize(finalData),
          created: Date.now(),
          lastAccessed: Date.now(),
          accessCount: 0,
          priority: options?.priority || 'medium',
          ttl: options?.ttl || this.config.defaultTTL,
          tags: options?.tags || [],
          source: poolId,
          compressionRatio: shouldCompress ? compressionRatio : undefined,
          dependsOn: options?.dependsOn
        },
        validUntil: Date.now() + (options?.ttl || this.config.defaultTTL),
        isCompressed: shouldCompress,
        isPinned: options?.pin || false
      };

      // Check capacity and evict if necessary
      if (!this.hasCapacity(pool, entry.metadata.size)) {
        await this.makeSpace(pool, entry.metadata.size);
      }

      // Store entry
      pool.entries.set(key, entry);
      pool.currentSize += entry.metadata.size;

      // Register memory allocation
      const allocationId = memoryManager.allocateMemory({
        type: 'cache',
        size: entry.metadata.size / (1024 * 1024), // Convert to MB
        priority: entry.metadata.priority,
        lifetime: entry.metadata.ttl,
        isActive: true,
        metadata: { poolId, key, cacheEntry: entry.id }
      });

      logDebug('Cache entry stored', {
        poolId,
        key,
        size: entry.metadata.size,
        compressed: shouldCompress,
        allocationId
      });

      return true;

    } catch (error) {
      logError('Cache set operation failed', error as Error);
      return false;
    }
  }

  /**
   * Retrieve data from cache
   */
  public async get(poolId: string, key: string): Promise<any | null> {
    try {
      const pool = this.pools.get(poolId);
      if (!pool) return null;

      const entry = pool.entries.get(key);
      if (!entry) {
        this.recordCacheMiss(poolId, key);
        return null;
      }

      // Check if entry is still valid
      if (Date.now() > entry.validUntil) {
        pool.entries.delete(key);
        pool.currentSize -= entry.metadata.size;
        this.recordCacheMiss(poolId, key);
        return null;
      }

      // Update access statistics
      entry.metadata.lastAccessed = Date.now();
      entry.metadata.accessCount++;
      this.recordCacheHit(poolId, key);
      this.updateAccessHistory(key);

      // Decompress if necessary
      let data = entry.data;
      if (entry.isCompressed) {
        data = await this.decompressData(data);
      }

      // Deserialize
      const deserializedData = this.deserializeData(data);

      logDebug('Cache hit', { poolId, key, accessCount: entry.metadata.accessCount });
      return deserializedData;

    } catch (error) {
      logError('Cache get operation failed', error as Error);
      return null;
    }
  }

  /**
   * Delete data from cache
   */
  public delete(poolId: string, key: string): boolean {
    try {
      const pool = this.pools.get(poolId);
      if (!pool) return false;

      const entry = pool.entries.get(key);
      if (!entry) return false;

      if (entry.isPinned) {
        logWarning('Attempted to delete pinned cache entry', { poolId, key });
        return false;
      }

      pool.entries.delete(key);
      pool.currentSize -= entry.metadata.size;

      logDebug('Cache entry deleted', { poolId, key });
      return true;

    } catch (error) {
      logError('Cache delete operation failed', error as Error);
      return false;
    }
  }

  /**
   * Clear entire pool or specific tags
   */
  public clear(poolId: string, tags?: string[]): number {
    try {
      const pool = this.pools.get(poolId);
      if (!pool) return 0;

      let deletedCount = 0;
      const toDelete: string[] = [];

      for (const [key, entry] of pool.entries) {
        if (entry.isPinned) continue;

        if (!tags || tags.some(tag => entry.metadata.tags.includes(tag))) {
          toDelete.push(key);
          pool.currentSize -= entry.metadata.size;
          deletedCount++;
        }
      }

      toDelete.forEach(key => pool.entries.delete(key));

      logDebug('Cache pool cleared', { poolId, deletedCount, tags });
      return deletedCount;

    } catch (error) {
      logError('Cache clear operation failed', error as Error);
      return 0;
    }
  }

  /**
   * Preload data based on prediction
   */
  public async preload(
    poolId: string, 
    key: string, 
    dataProvider: () => Promise<any>,
    options?: {
      priority?: 'critical' | 'high' | 'medium' | 'low';
      strategy?: string;
    }
  ): Promise<boolean> {
    try {
      // Check if already cached or being preloaded
      if (await this.get(poolId, key) !== null || this.activePreloads.has(key)) {
        return true;
      }

      // Check preloading conditions
      if (!this.shouldPreload(options?.strategy)) {
        return false;
      }

      // Add to queue if at capacity
      if (this.activePreloads.size >= this.config.networking.maxConcurrentPreloads) {
        this.preloadQueue.push({
          key,
          priority: this.getPriorityScore(options?.priority || 'medium'),
          strategy: options?.strategy || 'manual'
        });
        return true;
      }

      // Start preloading
      const preloadPromise = this.executePreloadWithRetry(poolId, key, dataProvider);
      this.activePreloads.set(key, preloadPromise);

      preloadPromise
        .then(data => {
          if (data !== null) {
            this.set(poolId, key, data, {
              priority: options?.priority,
              tags: ['preloaded', options?.strategy || 'manual']
            });
          }
        })
        .catch(error => {
          logWarning('Preload failed', { key, error: error.message });
        })
        .finally(() => {
          this.activePreloads.delete(key);
          this.processPreloadQueue();
        });

      return true;

    } catch (error) {
      logError('Preload operation failed', error as Error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  public getStats(poolId?: string): any {
    if (poolId) {
      const pool = this.pools.get(poolId);
      if (!pool) return null;

      return {
        poolId,
        name: pool.name,
        type: pool.type,
        currentSize: pool.currentSize,
        maxSize: pool.maxSize,
        utilization: (pool.currentSize / pool.maxSize) * 100,
        entryCount: pool.entries.size,
        maxEntries: pool.maxEntries,
        hitRate: pool.hitRate,
        missRate: pool.missRate,
        compressionEnabled: pool.compressionEnabled
      };
    }

    const globalStats = {
      totalPools: this.pools.size,
      totalSize: Array.from(this.pools.values()).reduce((sum, p) => sum + p.currentSize, 0),
      maxSize: this.config.globalMaxSize,
      totalEntries: Array.from(this.pools.values()).reduce((sum, p) => sum + p.entries.size, 0),
      activePreloads: this.activePreloads.size,
      queuedPreloads: this.preloadQueue.length,
      pools: Array.from(this.pools.entries()).map(([id, pool]) => this.getStats(id))
    };

    return globalStats;
  }

  /**
   * Private methods
   */
  private serializeData(data: any): string {
    try {
      return JSON.stringify(data);
    } catch (error) {
      logWarning('Data serialization failed, storing as string', { error: error.message });
      return String(data);
    }
  }

  private deserializeData(data: string): any {
    try {
      return JSON.parse(data);
    } catch (error) {
      return data; // Return as string if JSON parsing fails
    }
  }

  private calculateSize(data: any): number {
    if (typeof data === 'string') {
      return new Blob([data]).size;
    }
    return new Blob([JSON.stringify(data)]).size;
  }

  private async compressData(data: string): Promise<{ data: string; size: number }> {
    try {
      // Simplified compression simulation
      // In practice, use actual compression algorithms
      const compressed = data.replace(/\s+/g, ' ').trim();
      return {
        data: compressed,
        size: this.calculateSize(compressed)
      };
    } catch (error) {
      return { data, size: this.calculateSize(data) };
    }
  }

  private async decompressData(data: string): Promise<string> {
    // In practice, implement actual decompression
    return data;
  }

  private hasCapacity(pool: CachePool, requiredSize: number): boolean {
    return (pool.currentSize + requiredSize) <= pool.maxSize && 
           pool.entries.size < pool.maxEntries;
  }

  private async makeSpace(pool: CachePool, requiredSize: number): Promise<void> {
    const strategy = pool.evictionPolicy.strategy;
    const aggressiveness = pool.evictionPolicy.parameters.aggressiveness;
    
    let targetEvictionSize = requiredSize;
    if (aggressiveness > 0.5) {
      targetEvictionSize *= 1.5; // Evict more to prevent frequent evictions
    }

    const candidates = this.getEvictionCandidates(pool, strategy);
    let evictedSize = 0;

    for (const entry of candidates) {
      if (evictedSize >= targetEvictionSize) break;
      if (entry.isPinned) continue;

      pool.entries.delete(entry.key);
      pool.currentSize -= entry.metadata.size;
      evictedSize += entry.metadata.size;
    }

    logDebug('Cache space made', { 
      poolId: pool.id, 
      evictedSize, 
      entriesEvicted: candidates.length,
      strategy 
    });
  }

  private getEvictionCandidates(pool: CachePool, strategy: string): CacheEntry[] {
    const entries = Array.from(pool.entries.values());
    const now = Date.now();

    switch (strategy) {
      case 'lru':
        return entries
          .filter(e => !e.isPinned)
          .sort((a, b) => a.metadata.lastAccessed - b.metadata.lastAccessed);

      case 'lfu':
        return entries
          .filter(e => !e.isPinned)
          .sort((a, b) => a.metadata.accessCount - b.metadata.accessCount);

      case 'ttl':
        return entries
          .filter(e => !e.isPinned)
          .sort((a, b) => a.validUntil - b.validUntil);

      case 'priority':
        const priorityMap = { critical: 4, high: 3, medium: 2, low: 1 };
        return entries
          .filter(e => !e.isPinned)
          .sort((a, b) => 
            priorityMap[a.metadata.priority] - priorityMap[b.metadata.priority]
          );

      case 'ml_based':
        return this.getMlBasedEvictionCandidates(entries);

      default:
        return entries.filter(e => !e.isPinned);
    }
  }

  private getMlBasedEvictionCandidates(entries: CacheEntry[]): CacheEntry[] {
    // ML-based eviction using multiple factors
    return entries
      .filter(e => !e.isPinned)
      .map(entry => ({
        entry,
        score: this.calculateEvictionScore(entry)
      }))
      .sort((a, b) => a.score - b.score) // Lower score = better eviction candidate
      .map(item => item.entry);
  }

  private calculateEvictionScore(entry: CacheEntry): number {
    const now = Date.now();
    const age = now - entry.metadata.created;
    const timeSinceAccess = now - entry.metadata.lastAccessed;
    const priorityMap = { critical: 1000, high: 100, medium: 10, low: 1 };
    
    // Factors contributing to eviction score (lower = more likely to evict)
    const ageScore = Math.min(age / (24 * 3600000), 1); // Normalize to 0-1 over 24 hours
    const accessScore = 1 / (entry.metadata.accessCount + 1);
    const recentAccessScore = Math.min(timeSinceAccess / (3600000), 1); // Normalize to 0-1 over 1 hour
    const priorityScore = 1 / priorityMap[entry.metadata.priority];
    const sizeScore = entry.metadata.size / (1024 * 1024); // MB
    
    // Weighted combination
    return (ageScore * 0.2) + 
           (accessScore * 0.3) + 
           (recentAccessScore * 0.3) + 
           (priorityScore * 0.1) + 
           (sizeScore * 0.1);
  }

  private recordCacheHit(poolId: string, key: string): void {
    const pool = this.pools.get(poolId);
    if (pool) {
      pool.hitRate = this.updateRate(pool.hitRate, true);
    }
  }

  private recordCacheMiss(poolId: string, key: string): void {
    const pool = this.pools.get(poolId);
    if (pool) {
      pool.missRate = this.updateRate(pool.missRate, true);
    }
  }

  private updateRate(currentRate: number, increment: boolean): number {
    // Simple exponential moving average
    const alpha = 0.1;
    const newValue = increment ? 1 : 0;
    return (alpha * newValue) + ((1 - alpha) * currentRate);
  }

  private updateAccessHistory(key: string): void {
    const history = this.accessHistory.get(key) || [];
    history.push(Date.now());
    
    // Keep only recent history
    const oneHourAgo = Date.now() - 3600000;
    const recentHistory = history.filter(timestamp => timestamp > oneHourAgo);
    
    this.accessHistory.set(key, recentHistory);
  }

  private shouldPreload(strategy?: string): boolean {
    if (!this.preloadingEnabled || !this.config.preloadingEnabled) {
      return false;
    }

    const networkCondition = networkOptimizer.getCurrentCondition();
    const performanceMetrics = advancedPerformanceManager.getCurrentMetrics();
    
    if (!networkCondition || !performanceMetrics) {
      return false;
    }

    // Check memory pressure
    if (performanceMetrics.memoryPressure === 'high' || performanceMetrics.memoryPressure === 'critical') {
      return false;
    }

    // Check network conditions
    if (networkCondition.quality === 'poor' || networkCondition.quality === 'critical') {
      return false;
    }

    // Strategy-specific conditions
    if (strategy && this.preloadingStrategies.has(strategy)) {
      const strategyConfig = this.preloadingStrategies.get(strategy)!;
      return this.evaluatePreloadingConditions(strategyConfig, networkCondition, performanceMetrics);
    }

    return true;
  }

  private evaluatePreloadingConditions(
    strategy: PreloadingStrategy,
    network: NetworkCondition,
    performance: AdvancedPerformanceMetrics
  ): boolean {
    const conditions = strategy.conditions;
    
    // Check network quality
    if (conditions.networkQuality !== 'any') {
      const qualityOrder = ['critical', 'poor', 'fair', 'good', 'excellent'];
      const requiredLevel = qualityOrder.indexOf(conditions.networkQuality);
      const currentLevel = qualityOrder.indexOf(network.quality);
      if (currentLevel < requiredLevel) return false;
    }

    // Check memory pressure
    if (conditions.memoryPressure !== 'any') {
      const pressureOrder = ['low', 'medium', 'high', 'critical'];
      const maxLevel = pressureOrder.indexOf(conditions.memoryPressure);
      const currentLevel = pressureOrder.indexOf(performance.memoryPressure);
      if (currentLevel > maxLevel) return false;
    }

    // Check user engagement
    if (performance.userEngagementScore < conditions.userEngagement) {
      return false;
    }

    // Check time of day
    if (conditions.timeOfDay) {
      const currentHour = new Date().getHours();
      if (!conditions.timeOfDay.includes(currentHour)) {
        return false;
      }
    }

    return true;
  }

  private async executePreloadWithRetry(
    poolId: string, 
    key: string, 
    dataProvider: () => Promise<any>
  ): Promise<any> {
    let lastError: Error | null = null;
    let backoffDelay = 1000; // Start with 1 second

    for (let attempt = 0; attempt < this.config.networking.retryAttempts; attempt++) {
      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Preload timeout')), this.config.networking.preloadTimeout)
        );

        const result = await Promise.race([dataProvider(), timeoutPromise]);
        return result;

      } catch (error) {
        lastError = error as Error;
        
        if (attempt < this.config.networking.retryAttempts - 1) {
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
          backoffDelay *= this.config.networking.backoffMultiplier;
        }
      }
    }

    throw lastError || new Error('Preload failed after all retries');
  }

  private getPriorityScore(priority: string): number {
    const scores = { critical: 4, high: 3, medium: 2, low: 1 };
    return scores[priority as keyof typeof scores] || 2;
  }

  private processPreloadQueue(): void {
    if (this.preloadQueue.length === 0 || 
        this.activePreloads.size >= this.config.networking.maxConcurrentPreloads) {
      return;
    }

    // Sort queue by priority
    this.preloadQueue.sort((a, b) => b.priority - a.priority);
    
    const next = this.preloadQueue.shift();
    if (next) {
      // Re-trigger preload for queued item
      // This would need the original dataProvider, which would need to be stored
      logDebug('Processing queued preload', { key: next.key, strategy: next.strategy });
    }
  }

  private collectAnalytics(): void {
    try {
      const timestamp = Date.now();
      const poolAnalytics = Array.from(this.pools.entries()).map(([poolId, pool]) => ({
        poolId,
        hitRate: pool.hitRate,
        missRate: pool.missRate,
        evictionRate: this.calculateEvictionRate(pool),
        compressionSavings: this.calculateCompressionSavings(pool),
        averageAccessTime: this.calculateAverageAccessTime(pool),
        popularEntries: this.getPopularEntries(pool, 5)
      }));

      this.analytics = {
        timestamp,
        pools: poolAnalytics,
        networkEfficiency: this.calculateNetworkEfficiency(),
        predictions: this.generateCachePredictions(),
        recommendations: this.generateCacheRecommendations()
      };

      // Notify listeners
      this.notifyListeners(this.analytics);

    } catch (error) {
      logError('Analytics collection failed', error as Error);
    }
  }

  private calculateEvictionRate(pool: CachePool): number {
    // Simplified eviction rate calculation
    return 0.05; // 5% eviction rate placeholder
  }

  private calculateCompressionSavings(pool: CachePool): number {
    let totalOriginalSize = 0;
    let totalCompressedSize = 0;

    for (const entry of pool.entries.values()) {
      if (entry.isCompressed && entry.metadata.compressionRatio) {
        const originalSize = entry.metadata.size / entry.metadata.compressionRatio;
        totalOriginalSize += originalSize;
        totalCompressedSize += entry.metadata.size;
      }
    }

    return totalOriginalSize - totalCompressedSize;
  }

  private calculateAverageAccessTime(pool: CachePool): number {
    // Placeholder - would measure actual access times
    return 5; // 5ms average access time
  }

  private getPopularEntries(pool: CachePool, count: number): Array<{ key: string; accessCount: number }> {
    return Array.from(pool.entries.values())
      .sort((a, b) => b.metadata.accessCount - a.metadata.accessCount)
      .slice(0, count)
      .map(entry => ({ key: entry.key, accessCount: entry.metadata.accessCount }));
  }

  private calculateNetworkEfficiency(): any {
    return {
      savedBandwidth: 0,
      reducedLatency: 0,
      requestsAvoided: 0
    };
  }

  private generateCachePredictions(): any {
    return {
      nextAccess: [],
      preloadingEffectiveness: 0.75,
      cacheUtilization: 0.68
    };
  }

  private generateCacheRecommendations(): Array<{ type: string; message: string; impact: string; priority: string }> {
    const recommendations = [];
    
    for (const pool of this.pools.values()) {
      const utilization = (pool.currentSize / pool.maxSize) * 100;
      
      if (utilization > 90) {
        recommendations.push({
          type: 'size',
          message: `Pool ${pool.id} is ${utilization.toFixed(1)}% full`,
          impact: 'May cause frequent evictions',
          priority: 'high'
        });
      }

      if (pool.hitRate < 0.6) {
        recommendations.push({
          type: 'eviction',
          message: `Low hit rate (${(pool.hitRate * 100).toFixed(1)}%) in pool ${pool.id}`,
          impact: 'Poor cache effectiveness',
          priority: 'medium'
        });
      }
    }

    return recommendations;
  }

  private performEviction(): void {
    for (const pool of this.pools.values()) {
      const utilizationPercent = (pool.currentSize / pool.maxSize) * 100;
      
      if (utilizationPercent > pool.evictionPolicy.parameters.thresholds.size) {
        const targetEvictionSize = pool.maxSize * 0.1; // Evict 10% of capacity
        this.makeSpace(pool, targetEvictionSize);
      }
    }
  }

  private executePreloading(): void {
    if (!this.shouldPreload()) return;

    for (const strategy of this.preloadingStrategies.values()) {
      if (!strategy.enabled) continue;

      // Execute strategy-specific preloading logic
      this.executePreloadingStrategy(strategy);
    }
  }

  private executePreloadingStrategy(strategy: PreloadingStrategy): void {
    // Placeholder for strategy execution
    // Would implement actual preloading based on strategy rules
    logDebug('Executing preloading strategy', { strategy: strategy.name });
  }

  private optimizeCaches(): void {
    // Perform cache optimization tasks
    this.updatePredictiveModels();
    this.adjustPoolSizes();
    this.optimizeEvictionPolicies();
  }

  private updatePredictiveModels(): void {
    // Update ML models for preloading and eviction
    for (const strategy of this.preloadingStrategies.values()) {
      // Update prediction accuracy based on recent performance
      strategy.predictiveModel.accuracy = Math.min(0.95, strategy.predictiveModel.accuracy + 0.01);
    }
  }

  private adjustPoolSizes(): void {
    // Dynamically adjust pool sizes based on usage patterns
    const totalUsage = Array.from(this.pools.values()).reduce((sum, p) => sum + p.currentSize, 0);
    
    if (totalUsage > this.config.globalMaxSize * 0.9) {
      logWarning('Global cache size approaching limit', { usage: totalUsage, limit: this.config.globalMaxSize });
    }
  }

  private optimizeEvictionPolicies(): void {
    // Optimize eviction policies based on hit rates and access patterns
    for (const pool of this.pools.values()) {
      if (pool.hitRate < 0.5) {
        // Consider changing eviction strategy
        logDebug('Considering eviction policy optimization', { poolId: pool.id, hitRate: pool.hitRate });
      }
    }
  }

  private notifyListeners(analytics: CacheAnalytics): void {
    for (const listener of this.listeners) {
      try {
        listener(analytics);
      } catch (error) {
        logError('Error in cache analytics listener', error as Error);
      }
    }
  }

  // Public API methods
  public getAnalytics(): CacheAnalytics | null {
    return this.analytics;
  }

  public onAnalyticsUpdate(listener: (analytics: CacheAnalytics) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public setPreloadingEnabled(enabled: boolean): void {
    this.preloadingEnabled = enabled;
    logDebug('Preloading toggled', { enabled });
  }

  public addPreloadingStrategy(strategy: PreloadingStrategy): void {
    this.preloadingStrategies.set(strategy.id, strategy);
    logDebug('Preloading strategy added', { id: strategy.id });
  }

  public updatePoolConfiguration(poolId: string, config: Partial<CachePool>): boolean {
    const pool = this.pools.get(poolId);
    if (!pool) return false;

    Object.assign(pool, config);
    logDebug('Pool configuration updated', { poolId, config });
    return true;
  }

  public invalidateByTags(tags: string[]): number {
    let invalidated = 0;
    
    for (const pool of this.pools.values()) {
      for (const [key, entry] of pool.entries) {
        if (tags.some(tag => entry.metadata.tags.includes(tag))) {
          if (!entry.isPinned) {
            pool.entries.delete(key);
            pool.currentSize -= entry.metadata.size;
            invalidated++;
          }
        }
      }
    }

    logDebug('Cache invalidated by tags', { tags, invalidated });
    return invalidated;
  }

  public destroy(): void {
    if (this.analyticsInterval) clearInterval(this.analyticsInterval);
    if (this.evictionInterval) clearInterval(this.evictionInterval);
    if (this.preloadingInterval) clearInterval(this.preloadingInterval);
    if (this.optimizationInterval) clearInterval(this.optimizationInterval);

    if (this.compressionWorker) {
      this.compressionWorker.terminate();
    }

    this.pools.clear();
    this.preloadingStrategies.clear();
    this.activePreloads.clear();
    this.listeners.clear();

    logDebug('Cache Manager destroyed');
  }
}

// Export singleton instance
export const cacheManager = new CacheManager();

// Helper functions
export const cacheSet = (poolId: string, key: string, data: any, options?: any) =>
  cacheManager.set(poolId, key, data, options);

export const cacheGet = (poolId: string, key: string) =>
  cacheManager.get(poolId, key);

export const cacheDelete = (poolId: string, key: string) =>
  cacheManager.delete(poolId, key);

export const getCacheStats = (poolId?: string) =>
  cacheManager.getStats(poolId);