/**
 * Memory Manager
 * Advanced memory management with intelligent garbage collection and resource optimization
 * Provides memory leak detection, cache optimization, and predictive memory allocation
 */

import { logDebug, logWarning, logError } from '@/utils/errorHandler';
import { advancedPerformanceManager, AdvancedPerformanceMetrics } from './AdvancedPerformanceManager';

export interface MemoryMetrics {
  timestamp: number;
  usedMemory: number; // MB
  availableMemory: number; // MB
  totalMemory: number; // MB
  memoryPressure: 'low' | 'medium' | 'high' | 'critical';
  heapSize: number; // MB
  heapUsed: number; // MB
  heapLimit: number; // MB
  gcFrequency: number; // GC events per minute
  gcDuration: number; // Average GC duration in ms
  fragmentationRatio: number; // 0-1, higher = more fragmented
  leakSuspicion: number; // 0-1, higher = potential leak
}

export interface MemoryAllocation {
  id: string;
  type: 'stream' | 'cache' | 'ui' | 'background' | 'temporary';
  size: number; // MB
  priority: 'critical' | 'high' | 'medium' | 'low';
  lastAccessed: number;
  accessCount: number;
  lifetime: number; // Expected lifetime in ms
  isActive: boolean;
  metadata: any;
}

export interface MemoryPool {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'image' | 'data' | 'ui';
  maxSize: number; // MB
  currentSize: number; // MB
  allocations: Map<string, MemoryAllocation>;
  gcThreshold: number; // Percentage before GC
  compressionEnabled: boolean;
  autoResize: boolean;
}

export interface MemoryOptimizationStrategy {
  id: string;
  name: string;
  description: string;
  trigger: (metrics: MemoryMetrics) => boolean;
  execute: (metrics: MemoryMetrics) => Promise<number>; // Returns freed memory in MB
  priority: number;
  aggressiveness: 'gentle' | 'moderate' | 'aggressive';
  impact: {
    memoryReduction: number; // MB expected to free
    performanceImpact: number; // -1 to 1, negative = worse performance
    userExperienceImpact: number; // -1 to 1
  };
}

export interface MemoryLeakDetection {
  objectType: string;
  growthRate: number; // MB per minute
  suspicionLevel: 'low' | 'medium' | 'high' | 'critical';
  detectionTime: number;
  samples: Array<{ timestamp: number; count: number; size: number }>;
  isConfirmed: boolean;
  mitigation?: string;
}

export interface MemoryPrediction {
  timestamp: number;
  predictedUsage: number; // MB
  confidence: number; // 0-1
  timeHorizon: number; // minutes
  factors: {
    streamCount: number;
    userActivity: number;
    historicalPattern: number;
    systemLoad: number;
  };
  recommendations: string[];
}

class MemoryManager {
  private metrics: MemoryMetrics | null = null;
  private memoryPools = new Map<string, MemoryPool>();
  private optimizationStrategies = new Map<string, MemoryOptimizationStrategy>();
  private allocationHistory: MemoryMetrics[] = [];
  private leakDetections = new Map<string, MemoryLeakDetection>();
  private predictions: MemoryPrediction[] = [];
  private listeners = new Set<(metrics: MemoryMetrics) => void>();
  
  // GC and optimization tracking
  private gcEvents: Array<{ timestamp: number; duration: number; memoryFreed: number }> = [];
  private lastGC = 0;
  private gcScheduled = false;
  private optimizationCooldown = new Map<string, number>();
  
  // Monitoring intervals
  private monitoringInterval: NodeJS.Timeout | null = null;
  private gcInterval: NodeJS.Timeout | null = null;
  private leakDetectionInterval: NodeJS.Timeout | null = null;
  private predictionInterval: NodeJS.Timeout | null = null;
  
  // Configuration
  private config = {
    gcThreshold: 85, // Percentage of heap usage before GC
    criticalThreshold: 95, // Percentage for emergency cleanup
    leakDetectionWindow: 300000, // 5 minutes
    predictionAccuracyTarget: 0.8,
    maxMemoryPools: 10,
    compressionThreshold: 70 // Percentage before enabling compression
  };

  constructor() {
    this.initializeMemoryPools();
    this.initializeOptimizationStrategies();
    this.startMemoryMonitoring();
  }

  /**
   * Initialize memory pools for different resource types
   */
  private initializeMemoryPools(): void {
    const pools: Omit<MemoryPool, 'allocations'>[] = [
      {
        id: 'video_streams',
        name: 'Video Streams',
        type: 'video',
        maxSize: 512, // 512MB
        currentSize: 0,
        gcThreshold: 80,
        compressionEnabled: true,
        autoResize: true
      },
      {
        id: 'audio_streams',
        name: 'Audio Streams', 
        type: 'audio',
        maxSize: 64, // 64MB
        currentSize: 0,
        gcThreshold: 85,
        compressionEnabled: true,
        autoResize: true
      },
      {
        id: 'image_cache',
        name: 'Image Cache',
        type: 'image',
        maxSize: 128, // 128MB
        currentSize: 0,
        gcThreshold: 75,
        compressionEnabled: true,
        autoResize: true
      },
      {
        id: 'data_cache',
        name: 'Data Cache',
        type: 'data',
        maxSize: 64, // 64MB
        currentSize: 0,
        gcThreshold: 80,
        compressionEnabled: false,
        autoResize: true
      },
      {
        id: 'ui_components',
        name: 'UI Components',
        type: 'ui',
        maxSize: 32, // 32MB
        currentSize: 0,
        gcThreshold: 90,
        compressionEnabled: false,
        autoResize: false
      }
    ];

    pools.forEach(poolConfig => {
      const pool: MemoryPool = {
        ...poolConfig,
        allocations: new Map()
      };
      this.memoryPools.set(pool.id, pool);
    });
  }

  /**
   * Initialize memory optimization strategies
   */
  private initializeOptimizationStrategies(): void {
    // Gentle cleanup strategy
    this.addOptimizationStrategy({
      id: 'gentle_cleanup',
      name: 'Gentle Cleanup',
      description: 'Remove unused allocations with low impact',
      trigger: (metrics) => metrics.memoryPressure === 'medium',
      execute: async (metrics) => this.executeGentleCleanup(metrics),
      priority: 5,
      aggressiveness: 'gentle',
      impact: {
        memoryReduction: 50,
        performanceImpact: -0.1,
        userExperienceImpact: 0
      }
    });

    // Cache compression strategy
    this.addOptimizationStrategy({
      id: 'cache_compression',
      name: 'Cache Compression',
      description: 'Compress cacheable data to reduce memory usage',
      trigger: (metrics) => metrics.memoryPressure === 'medium' || metrics.memoryPressure === 'high',
      execute: async (metrics) => this.executeCacheCompression(metrics),
      priority: 7,
      aggressiveness: 'moderate',
      impact: {
        memoryReduction: 80,
        performanceImpact: -0.2,
        userExperienceImpact: -0.1
      }
    });

    // Aggressive cleanup strategy
    this.addOptimizationStrategy({
      id: 'aggressive_cleanup',
      name: 'Aggressive Cleanup',
      description: 'Aggressively free memory by pausing non-critical operations',
      trigger: (metrics) => metrics.memoryPressure === 'high',
      execute: async (metrics) => this.executeAggressiveCleanup(metrics),
      priority: 9,
      aggressiveness: 'aggressive',
      impact: {
        memoryReduction: 150,
        performanceImpact: -0.4,
        userExperienceImpact: -0.3
      }
    });

    // Emergency cleanup strategy
    this.addOptimizationStrategy({
      id: 'emergency_cleanup',
      name: 'Emergency Cleanup',
      description: 'Emergency memory recovery to prevent crashes',
      trigger: (metrics) => metrics.memoryPressure === 'critical',
      execute: async (metrics) => this.executeEmergencyCleanup(metrics),
      priority: 10,
      aggressiveness: 'aggressive',
      impact: {
        memoryReduction: 300,
        performanceImpact: -0.7,
        userExperienceImpact: -0.6
      }
    });

    // Proactive GC strategy
    this.addOptimizationStrategy({
      id: 'proactive_gc',
      name: 'Proactive Garbage Collection',
      description: 'Trigger garbage collection before memory pressure builds',
      trigger: (metrics) => metrics.heapUsed / metrics.heapLimit > 0.75,
      execute: async (metrics) => this.executeProactiveGC(metrics),
      priority: 6,
      aggressiveness: 'gentle',
      impact: {
        memoryReduction: 100,
        performanceImpact: -0.3,
        userExperienceImpact: -0.1
      }
    });

    // Memory defragmentation strategy
    this.addOptimizationStrategy({
      id: 'memory_defragmentation',
      name: 'Memory Defragmentation',
      description: 'Reorganize memory to reduce fragmentation',
      trigger: (metrics) => metrics.fragmentationRatio > 0.6,
      execute: async (metrics) => this.executeDefragmentation(metrics),
      priority: 4,
      aggressiveness: 'moderate',
      impact: {
        memoryReduction: 30,
        performanceImpact: -0.5,
        userExperienceImpact: -0.2
      }
    });
  }

  /**
   * Start comprehensive memory monitoring
   */
  private startMemoryMonitoring(): void {
    // Main monitoring loop
    this.monitoringInterval = setInterval(() => {
      this.collectMemoryMetrics();
    }, 2000);

    // Proactive GC scheduling
    this.gcInterval = setInterval(() => {
      this.scheduleGarbageCollection();
    }, 10000);

    // Memory leak detection
    this.leakDetectionInterval = setInterval(() => {
      this.detectMemoryLeaks();
    }, 30000);

    // Memory usage prediction
    this.predictionInterval = setInterval(() => {
      this.generateMemoryPredictions();
    }, 60000);

    logDebug('Memory Manager monitoring started');
  }

  /**
   * Collect comprehensive memory metrics
   */
  private async collectMemoryMetrics(): Promise<void> {
    try {
      const metrics = await this.getDetailedMemoryMetrics();
      this.metrics = metrics;
      
      // Add to history
      this.allocationHistory.push(metrics);
      if (this.allocationHistory.length > 300) { // Keep 10 minutes of history
        this.allocationHistory.shift();
      }

      // Check for optimization needs
      await this.checkOptimizationNeeds(metrics);

      // Notify listeners
      this.notifyListeners(metrics);

    } catch (error) {
      logError('Memory metrics collection failed', error as Error);
    }
  }

  /**
   * Get detailed memory metrics from various sources
   */
  private async getDetailedMemoryMetrics(): Promise<MemoryMetrics> {
    const performanceMemory = 'memory' in performance ? (performance as any).memory : null;
    
    // Calculate total pool usage
    let totalPoolUsage = 0;
    for (const pool of this.memoryPools.values()) {
      totalPoolUsage += pool.currentSize;
    }

    const usedMemory = performanceMemory ? 
      Math.round(performanceMemory.usedJSHeapSize / 1024 / 1024) : 
      totalPoolUsage;

    const heapSize = performanceMemory ? 
      Math.round(performanceMemory.totalJSHeapSize / 1024 / 1024) : 
      usedMemory * 1.3;

    const heapLimit = performanceMemory ? 
      Math.round(performanceMemory.jsHeapSizeLimit / 1024 / 1024) : 
      2048; // 2GB estimate

    const availableMemory = heapLimit - usedMemory;
    const memoryPressure = this.calculateMemoryPressure(usedMemory, heapLimit);
    const fragmentationRatio = this.calculateFragmentationRatio();
    
    return {
      timestamp: Date.now(),
      usedMemory,
      availableMemory,
      totalMemory: heapLimit,
      memoryPressure,
      heapSize,
      heapUsed: usedMemory,
      heapLimit,
      gcFrequency: this.calculateGCFrequency(),
      gcDuration: this.calculateAverageGCDuration(),
      fragmentationRatio,
      leakSuspicion: this.calculateLeakSuspicion()
    };
  }

  /**
   * Calculate memory pressure level
   */
  private calculateMemoryPressure(used: number, limit: number): 'low' | 'medium' | 'high' | 'critical' {
    const percentage = (used / limit) * 100;
    
    if (percentage > 95) return 'critical';
    if (percentage > 85) return 'high';
    if (percentage > 70) return 'medium';
    return 'low';
  }

  /**
   * Calculate memory fragmentation ratio
   */
  private calculateFragmentationRatio(): number {
    // Simplified fragmentation calculation based on allocation patterns
    let totalAllocations = 0;
    let activeAllocations = 0;
    
    for (const pool of this.memoryPools.values()) {
      totalAllocations += pool.allocations.size;
      for (const allocation of pool.allocations.values()) {
        if (allocation.isActive) activeAllocations++;
      }
    }
    
    return totalAllocations > 0 ? 1 - (activeAllocations / totalAllocations) : 0;
  }

  /**
   * Calculate GC frequency (events per minute)
   */
  private calculateGCFrequency(): number {
    const oneMinuteAgo = Date.now() - 60000;
    const recentEvents = this.gcEvents.filter(event => event.timestamp > oneMinuteAgo);
    return recentEvents.length;
  }

  /**
   * Calculate average GC duration
   */
  private calculateAverageGCDuration(): number {
    if (this.gcEvents.length === 0) return 0;
    
    const recent = this.gcEvents.slice(-10);
    const totalDuration = recent.reduce((sum, event) => sum + event.duration, 0);
    return totalDuration / recent.length;
  }

  /**
   * Calculate memory leak suspicion level
   */
  private calculateLeakSuspicion(): number {
    if (this.allocationHistory.length < 10) return 0;
    
    // Look for sustained growth over time
    const recent = this.allocationHistory.slice(-10);
    const growthRate = (recent[recent.length - 1].usedMemory - recent[0].usedMemory) / recent.length;
    
    // Normalize to 0-1 scale
    return Math.min(1, Math.max(0, growthRate / 50)); // 50MB growth = max suspicion
  }

  /**
   * Check if memory optimization is needed
   */
  private async checkOptimizationNeeds(metrics: MemoryMetrics): Promise<void> {
    const applicableStrategies = Array.from(this.optimizationStrategies.values())
      .filter(strategy => {
        // Check if strategy should trigger
        if (!strategy.trigger(metrics)) return false;
        
        // Check cooldown
        const lastRun = this.optimizationCooldown.get(strategy.id) || 0;
        const cooldownPeriod = this.getCooldownPeriod(strategy.aggressiveness);
        return Date.now() - lastRun > cooldownPeriod;
      })
      .sort((a, b) => b.priority - a.priority);

    if (applicableStrategies.length > 0) {
      await this.executeOptimizationStrategy(applicableStrategies[0], metrics);
    }
  }

  /**
   * Execute optimization strategy
   */
  private async executeOptimizationStrategy(
    strategy: MemoryOptimizationStrategy, 
    metrics: MemoryMetrics
  ): Promise<void> {
    try {
      logDebug('Executing memory optimization strategy', { 
        strategy: strategy.name, 
        pressure: metrics.memoryPressure 
      });

      const startTime = Date.now();
      const freedMemory = await strategy.execute(metrics);
      const duration = Date.now() - startTime;

      // Record execution
      this.optimizationCooldown.set(strategy.id, Date.now());
      
      logDebug('Memory optimization completed', {
        strategy: strategy.name,
        freedMemory,
        duration
      });

    } catch (error) {
      logError('Memory optimization strategy failed', error as Error);
    }
  }

  /**
   * Strategy implementations
   */
  private async executeGentleCleanup(metrics: MemoryMetrics): Promise<number> {
    let freedMemory = 0;
    const oneHourAgo = Date.now() - 3600000;

    for (const pool of this.memoryPools.values()) {
      const toRemove: string[] = [];
      
      for (const [id, allocation] of pool.allocations) {
        // Remove old, inactive allocations
        if (!allocation.isActive && allocation.lastAccessed < oneHourAgo) {
          toRemove.push(id);
          freedMemory += allocation.size;
        }
      }

      toRemove.forEach(id => pool.allocations.delete(id));
      pool.currentSize = Math.max(0, pool.currentSize - freedMemory);
    }

    return freedMemory;
  }

  private async executeCacheCompression(metrics: MemoryMetrics): Promise<number> {
    let freedMemory = 0;

    for (const pool of this.memoryPools.values()) {
      if (pool.compressionEnabled && pool.type !== 'ui') {
        // Simulate compression (in practice, this would compress actual data)
        const compressionRatio = 0.6; // 40% size reduction
        const compressibleSize = pool.currentSize * 0.8; // 80% is compressible
        const savedMemory = compressibleSize * (1 - compressionRatio);
        
        pool.currentSize -= savedMemory;
        freedMemory += savedMemory;
      }
    }

    return freedMemory;
  }

  private async executeAggressiveCleanup(metrics: MemoryMetrics): Promise<number> {
    let freedMemory = 0;
    const thirtyMinutesAgo = Date.now() - 1800000;

    for (const pool of this.memoryPools.values()) {
      const toRemove: string[] = [];
      
      for (const [id, allocation] of pool.allocations) {
        // Remove allocations not accessed in 30 minutes, except critical ones
        if (allocation.priority !== 'critical' && allocation.lastAccessed < thirtyMinutesAgo) {
          toRemove.push(id);
          freedMemory += allocation.size;
        }
      }

      toRemove.forEach(id => pool.allocations.delete(id));
      pool.currentSize = Math.max(0, pool.currentSize - freedMemory);
    }

    return freedMemory;
  }

  private async executeEmergencyCleanup(metrics: MemoryMetrics): Promise<number> {
    let freedMemory = 0;

    // Emergency cleanup - remove all non-critical allocations
    for (const pool of this.memoryPools.values()) {
      const toRemove: string[] = [];
      
      for (const [id, allocation] of pool.allocations) {
        if (allocation.priority !== 'critical') {
          toRemove.push(id);
          freedMemory += allocation.size;
        }
      }

      toRemove.forEach(id => pool.allocations.delete(id));
      pool.currentSize = Math.max(0, pool.currentSize - freedMemory);
    }

    // Force garbage collection
    await this.forceGarbageCollection();

    return freedMemory;
  }

  private async executeProactiveGC(metrics: MemoryMetrics): Promise<number> {
    const memoryBefore = metrics.usedMemory;
    await this.forceGarbageCollection();
    
    // Estimate freed memory (would be measured in practice)
    const estimatedFreed = memoryBefore * 0.1; // Estimate 10% freed
    return estimatedFreed;
  }

  private async executeDefragmentation(metrics: MemoryMetrics): Promise<number> {
    // Simulate memory defragmentation
    // In practice, this would involve reorganizing data structures
    let freedMemory = 0;

    for (const pool of this.memoryPools.values()) {
      if (pool.autoResize) {
        // Compact allocations
        const fragmentation = pool.allocations.size * 0.1; // Estimate fragmentation overhead
        freedMemory += fragmentation;
        pool.currentSize = Math.max(0, pool.currentSize - fragmentation);
      }
    }

    return freedMemory;
  }

  /**
   * Force garbage collection if available
   */
  private async forceGarbageCollection(): Promise<void> {
    if (this.gcScheduled) return;
    
    this.gcScheduled = true;
    const startTime = Date.now();

    try {
      if ('gc' in window && typeof (window as any).gc === 'function') {
        (window as any).gc();
      }
      
      // Simulate async GC
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const duration = Date.now() - startTime;
      this.gcEvents.push({
        timestamp: Date.now(),
        duration,
        memoryFreed: 50 // Estimate
      });

      // Keep only recent GC events
      if (this.gcEvents.length > 50) {
        this.gcEvents.shift();
      }

      this.lastGC = Date.now();
      
    } finally {
      this.gcScheduled = false;
    }
  }

  /**
   * Schedule garbage collection based on heuristics
   */
  private scheduleGarbageCollection(): void {
    if (!this.metrics) return;

    const shouldGC = 
      this.metrics.heapUsed / this.metrics.heapLimit > (this.config.gcThreshold / 100) ||
      Date.now() - this.lastGC > 300000; // Force GC every 5 minutes

    if (shouldGC) {
      this.forceGarbageCollection();
    }
  }

  /**
   * Detect potential memory leaks
   */
  private detectMemoryLeaks(): void {
    if (this.allocationHistory.length < 20) return;

    // Analyze growth patterns for each pool
    for (const [poolId, pool] of this.memoryPools) {
      const samples = this.allocationHistory.slice(-20).map(h => ({
        timestamp: h.timestamp,
        count: pool.allocations.size,
        size: pool.currentSize
      }));

      const growthRate = this.calculateGrowthRate(samples.map(s => s.size));
      
      if (growthRate > 1) { // Growing more than 1MB per minute
        const suspicionLevel = this.categorizeSuspicion(growthRate);
        
        const existing = this.leakDetections.get(poolId);
        if (existing) {
          existing.growthRate = growthRate;
          existing.suspicionLevel = suspicionLevel;
          existing.samples = samples;
        } else {
          this.leakDetections.set(poolId, {
            objectType: pool.name,
            growthRate,
            suspicionLevel,
            detectionTime: Date.now(),
            samples,
            isConfirmed: false
          });
        }

        if (suspicionLevel === 'high' || suspicionLevel === 'critical') {
          logWarning('Potential memory leak detected', {
            pool: pool.name,
            growthRate: `${growthRate.toFixed(2)} MB/min`,
            suspicion: suspicionLevel
          });
        }
      }
    }
  }

  /**
   * Generate memory usage predictions
   */
  private generateMemoryPredictions(): void {
    if (this.allocationHistory.length < 10) return;

    const performanceMetrics = advancedPerformanceManager.getCurrentMetrics();
    if (!performanceMetrics) return;

    const timeHorizons = [5, 15, 30, 60]; // minutes

    timeHorizons.forEach(horizon => {
      const prediction = this.predictMemoryUsage(horizon, performanceMetrics);
      this.predictions.push(prediction);
    });

    // Keep only recent predictions
    if (this.predictions.length > 100) {
      this.predictions.splice(0, this.predictions.length - 100);
    }
  }

  /**
   * Predict memory usage for a given time horizon
   */
  private predictMemoryUsage(horizonMinutes: number, performanceMetrics: AdvancedPerformanceMetrics): MemoryPrediction {
    const recent = this.allocationHistory.slice(-20);
    const currentUsage = recent[recent.length - 1].usedMemory;
    
    // Calculate trend
    const growthRate = this.calculateGrowthRate(recent.map(h => h.usedMemory));
    
    // Factor in system conditions
    const streamFactor = Math.max(1, performanceMetrics.activeStreams * 0.2);
    const engagementFactor = performanceMetrics.userEngagementScore;
    const systemLoadFactor = Math.max(1, performanceMetrics.cpuUsage / 100);
    
    // Predict usage
    const predictedGrowth = growthRate * horizonMinutes * streamFactor * systemLoadFactor;
    const predictedUsage = Math.max(0, currentUsage + predictedGrowth);
    
    // Calculate confidence based on historical accuracy
    const confidence = Math.max(0.3, 1 - (growthRate / 10)); // Lower confidence for high growth rates
    
    const recommendations: string[] = [];
    if (predictedUsage > this.metrics!.heapLimit * 0.9) {
      recommendations.push('High memory usage predicted - consider reducing stream quality');
    }
    if (growthRate > 5) {
      recommendations.push('Rapid memory growth detected - check for leaks');
    }

    return {
      timestamp: Date.now(),
      predictedUsage,
      confidence,
      timeHorizon: horizonMinutes,
      factors: {
        streamCount: performanceMetrics.activeStreams,
        userActivity: engagementFactor,
        historicalPattern: growthRate,
        systemLoad: systemLoadFactor
      },
      recommendations
    };
  }

  /**
   * Utility methods
   */
  private calculateGrowthRate(values: number[]): number {
    if (values.length < 2) return 0;
    
    const timeSpan = (values.length - 1) * 2; // 2 seconds between samples
    const growth = values[values.length - 1] - values[0];
    return (growth / timeSpan) * 60; // MB per minute
  }

  private categorizeSuspicion(growthRate: number): 'low' | 'medium' | 'high' | 'critical' {
    if (growthRate > 10) return 'critical';
    if (growthRate > 5) return 'high';
    if (growthRate > 2) return 'medium';
    return 'low';
  }

  private getCooldownPeriod(aggressiveness: string): number {
    const periods = { gentle: 30000, moderate: 20000, aggressive: 10000 };
    return periods[aggressiveness as keyof typeof periods] || 30000;
  }

  private notifyListeners(metrics: MemoryMetrics): void {
    for (const listener of this.listeners) {
      try {
        listener(metrics);
      } catch (error) {
        logError('Error in memory listener', error as Error);
      }
    }
  }

  // Public API methods
  public allocateMemory(allocation: Omit<MemoryAllocation, 'id' | 'lastAccessed' | 'accessCount'>): string {
    const id = `alloc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const poolType = allocation.type === 'stream' ? 'video_streams' : 
                    allocation.type === 'cache' ? 'data_cache' : 
                    allocation.type === 'ui' ? 'ui_components' : 'data_cache';
    
    const pool = this.memoryPools.get(poolType);
    if (!pool) {
      logError('Invalid memory pool type', new Error(poolType));
      return '';
    }

    const fullAllocation: MemoryAllocation = {
      ...allocation,
      id,
      lastAccessed: Date.now(),
      accessCount: 0
    };

    pool.allocations.set(id, fullAllocation);
    pool.currentSize += allocation.size;

    logDebug('Memory allocated', { id, type: allocation.type, size: allocation.size });
    return id;
  }

  public deallocateMemory(allocationId: string): boolean {
    for (const pool of this.memoryPools.values()) {
      const allocation = pool.allocations.get(allocationId);
      if (allocation) {
        pool.allocations.delete(allocationId);
        pool.currentSize = Math.max(0, pool.currentSize - allocation.size);
        logDebug('Memory deallocated', { id: allocationId, size: allocation.size });
        return true;
      }
    }
    return false;
  }

  public updateAllocationAccess(allocationId: string): void {
    for (const pool of this.memoryPools.values()) {
      const allocation = pool.allocations.get(allocationId);
      if (allocation) {
        allocation.lastAccessed = Date.now();
        allocation.accessCount++;
        break;
      }
    }
  }

  public getCurrentMetrics(): MemoryMetrics | null {
    return this.metrics;
  }

  public getMemoryPools(): MemoryPool[] {
    return Array.from(this.memoryPools.values());
  }

  public getLeakDetections(): MemoryLeakDetection[] {
    return Array.from(this.leakDetections.values());
  }

  public getMemoryPredictions(): MemoryPrediction[] {
    return [...this.predictions];
  }

  public addOptimizationStrategy(strategy: MemoryOptimizationStrategy): void {
    this.optimizationStrategies.set(strategy.id, strategy);
    logDebug('Memory optimization strategy added', { id: strategy.id });
  }

  public removeOptimizationStrategy(id: string): void {
    this.optimizationStrategies.delete(id);
    logDebug('Memory optimization strategy removed', { id });
  }

  public onMemoryUpdate(listener: (metrics: MemoryMetrics) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public triggerOptimization(aggressive: boolean = false): Promise<void> {
    if (!this.metrics) return Promise.resolve();

    const strategy = aggressive ? 
      this.optimizationStrategies.get('aggressive_cleanup') :
      this.optimizationStrategies.get('gentle_cleanup');

    if (strategy) {
      return this.executeOptimizationStrategy(strategy, this.metrics);
    }
    
    return Promise.resolve();
  }

  public destroy(): void {
    if (this.monitoringInterval) clearInterval(this.monitoringInterval);
    if (this.gcInterval) clearInterval(this.gcInterval);
    if (this.leakDetectionInterval) clearInterval(this.leakDetectionInterval);
    if (this.predictionInterval) clearInterval(this.predictionInterval);
    
    this.memoryPools.clear();
    this.optimizationStrategies.clear();
    this.listeners.clear();
    
    logDebug('Memory Manager destroyed');
  }
}

// Export singleton instance
export const memoryManager = new MemoryManager();

// Helper functions
export const allocateMemory = (allocation: Omit<MemoryAllocation, 'id' | 'lastAccessed' | 'accessCount'>) =>
  memoryManager.allocateMemory(allocation);

export const deallocateMemory = (allocationId: string) =>
  memoryManager.deallocateMemory(allocationId);

export const getCurrentMemoryMetrics = () =>
  memoryManager.getCurrentMetrics();

export const getMemoryLeakDetections = () =>
  memoryManager.getLeakDetections();

export const triggerMemoryOptimization = (aggressive?: boolean) =>
  memoryManager.triggerOptimization(aggressive);