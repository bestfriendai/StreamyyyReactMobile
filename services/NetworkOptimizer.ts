/**
 * Network Optimizer
 * Advanced connectivity management with adaptive bandwidth allocation and intelligent networking
 * Provides network condition analysis, bandwidth optimization, and connection reliability
 */

import { logDebug, logWarning, logError } from '@/utils/errorHandler';
import { bandwidthMonitor, BandwidthMetrics } from './bandwidthMonitor';
import { advancedPerformanceManager, AdvancedPerformanceMetrics } from './AdvancedPerformanceManager';

export interface NetworkCondition {
  timestamp: number;
  connectionType: 'wifi' | 'cellular' | 'ethernet' | 'unknown';
  effectiveType: '2g' | '3g' | '4g' | '5g' | 'unknown';
  bandwidth: number; // Mbps
  latency: number; // ms
  jitter: number; // ms
  packetLoss: number; // percentage
  stability: number; // 0-1, higher = more stable
  quality: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  isMetered: boolean;
  signalStrength: number; // 0-100
}

export interface BandwidthAllocation {
  streamId: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  allocatedBandwidth: number; // Mbps
  requestedBandwidth: number; // Mbps
  actualUsage: number; // Mbps
  efficiency: number; // 0-1, actual/allocated
  lastUpdate: number;
  isActive: boolean;
  qualityLevel: string;
}

export interface NetworkOptimizationStrategy {
  id: string;
  name: string;
  description: string;
  conditions: (condition: NetworkCondition) => boolean;
  execute: (condition: NetworkCondition, allocations: BandwidthAllocation[]) => Promise<NetworkOptimizationResult>;
  priority: number;
  aggressiveness: 'conservative' | 'moderate' | 'aggressive';
  impact: {
    bandwidthSavings: number; // Expected bandwidth saved in Mbps
    qualityImpact: number; // -1 to 1, negative = quality reduction
    stabilityImprovement: number; // 0-1
    latencyReduction: number; // ms
  };
}

export interface NetworkOptimizationResult {
  success: boolean;
  bandwidthSaved: number; // Mbps
  affectedStreams: string[];
  qualityChanges: Array<{ streamId: string; oldQuality: string; newQuality: string }>;
  message: string;
  duration: number; // ms
}

export interface ConnectionProfile {
  id: string;
  name: string;
  conditions: {
    minBandwidth: number;
    maxLatency: number;
    minStability: number;
    connectionTypes: string[];
  };
  optimizations: {
    compressionEnabled: boolean;
    priorityStreaming: boolean;
    adaptiveBitrate: boolean;
    backgroundThrottling: boolean;
    preloadingEnabled: boolean;
  };
  bandwidthLimits: {
    maxTotal: number; // Mbps
    maxPerStream: number; // Mbps
    reservedForUI: number; // Mbps
  };
}

export interface NetworkPrediction {
  timestamp: number;
  predictedBandwidth: number; // Mbps for next interval
  predictedLatency: number; // ms
  predictedStability: number; // 0-1
  confidence: number; // 0-1
  timeHorizon: number; // seconds
  factors: {
    historicalTrend: number;
    timeOfDay: number;
    networkLoad: number;
    userMovement: number;
  };
  recommendations: string[];
}

export interface DataUsageOptimization {
  compressionRatio: number; // 0-1, higher = more compression
  cacheHitRate: number; // 0-1
  prefetchAccuracy: number; // 0-1
  redundantDataElimination: number; // percentage
  totalDataSaved: number; // MB
  qualityAdjustments: number; // count of quality reductions
}

class NetworkOptimizer {
  private currentCondition: NetworkCondition | null = null;
  private bandwidthAllocations = new Map<string, BandwidthAllocation>();
  private optimizationStrategies = new Map<string, NetworkOptimizationStrategy>();
  private connectionProfiles = new Map<string, ConnectionProfile>();
  private currentProfile: string = 'adaptive';
  private networkHistory: NetworkCondition[] = [];
  private predictions: NetworkPrediction[] = [];
  private dataUsageStats: DataUsageOptimization;
  private listeners = new Set<(condition: NetworkCondition) => void>();
  
  // Connection monitoring
  private monitoringInterval: NodeJS.Timeout | null = null;
  private optimizationInterval: NodeJS.Timeout | null = null;
  private predictionInterval: NodeJS.Timeout | null = null;
  private connectionTests: Array<{ url: string; size: number; timeout: number }> = [];
  
  // Adaptive algorithms
  private adaptationModel = {
    learningRate: 0.1,
    momentumFactor: 0.9,
    adaptationThreshold: 0.15,
    predictionAccuracy: 0.0,
    lastUpdate: Date.now()
  };
  
  // Configuration
  private config = {
    monitoringInterval: 3000, // 3 seconds
    optimizationInterval: 10000, // 10 seconds
    predictionInterval: 30000, // 30 seconds
    historySize: 200,
    minAllocationBandwidth: 0.1, // Mbps
    maxAllocationBandwidth: 50, // Mbps
    stabilityThreshold: 0.7
  };

  constructor() {
    this.initializeDataUsageStats();
    this.initializeConnectionTests();
    this.initializeOptimizationStrategies();
    this.initializeConnectionProfiles();
    this.startNetworkOptimization();
  }

  /**
   * Initialize data usage optimization tracking
   */
  private initializeDataUsageStats(): void {
    this.dataUsageStats = {
      compressionRatio: 0.3,
      cacheHitRate: 0.0,
      prefetchAccuracy: 0.0,
      redundantDataElimination: 0.0,
      totalDataSaved: 0,
      qualityAdjustments: 0
    };
  }

  /**
   * Initialize connection test endpoints
   */
  private initializeConnectionTests(): void {
    this.connectionTests = [
      { url: 'https://httpbin.org/bytes/1024', size: 1024, timeout: 5000 }, // 1KB
      { url: 'https://httpbin.org/bytes/10240', size: 10240, timeout: 8000 }, // 10KB
      { url: 'https://httpbin.org/bytes/102400', size: 102400, timeout: 15000 }, // 100KB
    ];
  }

  /**
   * Initialize network optimization strategies
   */
  private initializeOptimizationStrategies(): void {
    // Bandwidth reallocation strategy
    this.addOptimizationStrategy({
      id: 'bandwidth_reallocation',
      name: 'Smart Bandwidth Reallocation',
      description: 'Dynamically reallocate bandwidth based on priority and usage',
      conditions: (condition) => condition.stability < 0.8 || this.hasBandwidthImbalance(),
      execute: async (condition, allocations) => this.executeBandwidthReallocation(condition, allocations),
      priority: 8,
      aggressiveness: 'moderate',
      impact: {
        bandwidthSavings: 2.0,
        qualityImpact: -0.1,
        stabilityImprovement: 0.3,
        latencyReduction: 20
      }
    });

    // Quality degradation strategy
    this.addOptimizationStrategy({
      id: 'quality_degradation',
      name: 'Adaptive Quality Reduction',
      description: 'Reduce stream quality when bandwidth is limited',
      conditions: (condition) => condition.bandwidth < this.getTotalRequestedBandwidth() * 1.2,
      execute: async (condition, allocations) => this.executeQualityDegradation(condition, allocations),
      priority: 7,
      aggressiveness: 'moderate',
      impact: {
        bandwidthSavings: 3.5,
        qualityImpact: -0.4,
        stabilityImprovement: 0.4,
        latencyReduction: 30
      }
    });

    // Connection switching strategy
    this.addOptimizationStrategy({
      id: 'connection_switching',
      name: 'Intelligent Connection Switching',
      description: 'Switch between available connections for optimal performance',
      conditions: (condition) => condition.quality === 'poor' && this.hasAlternativeConnection(),
      execute: async (condition, allocations) => this.executeConnectionSwitching(condition, allocations),
      priority: 9,
      aggressiveness: 'aggressive',
      impact: {
        bandwidthSavings: 1.0,
        qualityImpact: 0.3,
        stabilityImprovement: 0.6,
        latencyReduction: 50
      }
    });

    // Data compression strategy
    this.addOptimizationStrategy({
      id: 'data_compression',
      name: 'Adaptive Data Compression',
      description: 'Enable compression to reduce bandwidth usage',
      conditions: (condition) => condition.bandwidth < 5 || condition.isMetered,
      execute: async (condition, allocations) => this.executeDataCompression(condition, allocations),
      priority: 6,
      aggressiveness: 'conservative',
      impact: {
        bandwidthSavings: 1.5,
        qualityImpact: -0.2,
        stabilityImprovement: 0.2,
        latencyReduction: 10
      }
    });

    // Prefetching optimization strategy
    this.addOptimizationStrategy({
      id: 'prefetching_optimization',
      name: 'Smart Prefetching Control',
      description: 'Optimize prefetching based on network conditions',
      conditions: (condition) => condition.bandwidth < 3 || condition.latency > 200,
      execute: async (condition, allocations) => this.executePrefetchingOptimization(condition, allocations),
      priority: 5,
      aggressiveness: 'conservative',
      impact: {
        bandwidthSavings: 0.8,
        qualityImpact: 0.1,
        stabilityImprovement: 0.1,
        latencyReduction: 15
      }
    });

    // Emergency bandwidth conservation
    this.addOptimizationStrategy({
      id: 'emergency_conservation',
      name: 'Emergency Bandwidth Conservation',
      description: 'Aggressive bandwidth saving for critical network conditions',
      conditions: (condition) => condition.quality === 'critical' || condition.bandwidth < 1,
      execute: async (condition, allocations) => this.executeEmergencyConservation(condition, allocations),
      priority: 10,
      aggressiveness: 'aggressive',
      impact: {
        bandwidthSavings: 5.0,
        qualityImpact: -0.7,
        stabilityImprovement: 0.5,
        latencyReduction: 40
      }
    });
  }

  /**
   * Initialize connection profiles for different scenarios
   */
  private initializeConnectionProfiles(): void {
    // Adaptive profile (default)
    this.connectionProfiles.set('adaptive', {
      id: 'adaptive',
      name: 'Adaptive Optimization',
      conditions: {
        minBandwidth: 0.5,
        maxLatency: 1000,
        minStability: 0.3,
        connectionTypes: ['wifi', 'cellular', 'ethernet']
      },
      optimizations: {
        compressionEnabled: true,
        priorityStreaming: true,
        adaptiveBitrate: true,
        backgroundThrottling: true,
        preloadingEnabled: true
      },
      bandwidthLimits: {
        maxTotal: 50,
        maxPerStream: 10,
        reservedForUI: 0.5
      }
    });

    // WiFi optimized profile
    this.connectionProfiles.set('wifi', {
      id: 'wifi',
      name: 'WiFi Optimized',
      conditions: {
        minBandwidth: 5,
        maxLatency: 100,
        minStability: 0.8,
        connectionTypes: ['wifi', 'ethernet']
      },
      optimizations: {
        compressionEnabled: false,
        priorityStreaming: false,
        adaptiveBitrate: false,
        backgroundThrottling: false,
        preloadingEnabled: true
      },
      bandwidthLimits: {
        maxTotal: 100,
        maxPerStream: 25,
        reservedForUI: 1.0
      }
    });

    // Cellular optimized profile
    this.connectionProfiles.set('cellular', {
      id: 'cellular',
      name: 'Cellular Optimized',
      conditions: {
        minBandwidth: 1,
        maxLatency: 300,
        minStability: 0.5,
        connectionTypes: ['cellular']
      },
      optimizations: {
        compressionEnabled: true,
        priorityStreaming: true,
        adaptiveBitrate: true,
        backgroundThrottling: true,
        preloadingEnabled: false
      },
      bandwidthLimits: {
        maxTotal: 10,
        maxPerStream: 3,
        reservedForUI: 0.3
      }
    });

    // Low bandwidth profile
    this.connectionProfiles.set('low_bandwidth', {
      id: 'low_bandwidth',
      name: 'Low Bandwidth Mode',
      conditions: {
        minBandwidth: 0.5,
        maxLatency: 500,
        minStability: 0.3,
        connectionTypes: ['wifi', 'cellular', 'ethernet']
      },
      optimizations: {
        compressionEnabled: true,
        priorityStreaming: true,
        adaptiveBitrate: true,
        backgroundThrottling: true,
        preloadingEnabled: false
      },
      bandwidthLimits: {
        maxTotal: 3,
        maxPerStream: 1,
        reservedForUI: 0.2
      }
    });
  }

  /**
   * Start network optimization monitoring
   */
  private startNetworkOptimization(): void {
    // Network condition monitoring
    this.monitoringInterval = setInterval(() => {
      this.monitorNetworkConditions();
    }, this.config.monitoringInterval);

    // Optimization execution
    this.optimizationInterval = setInterval(() => {
      this.performNetworkOptimization();
    }, this.config.optimizationInterval);

    // Network prediction
    this.predictionInterval = setInterval(() => {
      this.generateNetworkPredictions();
    }, this.config.predictionInterval);

    logDebug('Network Optimizer started');
  }

  /**
   * Monitor current network conditions
   */
  private async monitorNetworkConditions(): Promise<void> {
    try {
      const bandwidthMetrics = bandwidthMonitor?.getCurrentMetrics?.();
      const performanceMetrics = advancedPerformanceManager?.getCurrentMetrics?.();
      
      if (!bandwidthMetrics) return;

      // Perform additional network tests
      const detailedMetrics = await this.performDetailedNetworkTests();
      
      const condition: NetworkCondition = {
        timestamp: Date.now(),
        connectionType: this.detectConnectionType(),
        effectiveType: this.mapBandwidthToEffectiveType(bandwidthMetrics.downloadSpeed),
        bandwidth: bandwidthMetrics.downloadSpeed,
        latency: bandwidthMetrics.latency,
        jitter: bandwidthMetrics.jitter,
        packetLoss: detailedMetrics.packetLoss,
        stability: this.calculateNetworkStability(bandwidthMetrics),
        quality: this.assessNetworkQuality(bandwidthMetrics),
        isMetered: this.detectMeteredConnection(),
        signalStrength: detailedMetrics.signalStrength
      };

      this.currentCondition = condition;
      this.addToHistory(condition);
      this.notifyListeners(condition);

      // Update connection profile if needed
      this.updateConnectionProfile(condition);

    } catch (error) {
      logError('Network condition monitoring failed', error as Error);
    }
  }

  /**
   * Perform detailed network tests
   */
  private async performDetailedNetworkTests(): Promise<{ packetLoss: number; signalStrength: number }> {
    let packetLoss = 0;
    let signalStrength = 80; // Default value

    try {
      // Perform multiple small requests to estimate packet loss
      const testResults = await Promise.allSettled(
        this.connectionTests.slice(0, 2).map(test => this.performConnectionTest(test))
      );

      const failedTests = testResults.filter(result => result.status === 'rejected').length;
      packetLoss = (failedTests / testResults.length) * 100;

      // Estimate signal strength based on latency and jitter
      const bandwidthMetrics = bandwidthMonitor?.getCurrentMetrics?.();
      if (bandwidthMetrics) {
        const latencyScore = Math.max(0, 100 - bandwidthMetrics.latency / 5);
        const jitterScore = Math.max(0, 100 - bandwidthMetrics.jitter * 2);
        signalStrength = (latencyScore + jitterScore) / 2;
      }

    } catch (error) {
      logWarning('Detailed network tests failed', { error: error.message });
    }

    return { packetLoss, signalStrength };
  }

  /**
   * Perform single connection test
   */
  private async performConnectionTest(test: { url: string; size: number; timeout: number }): Promise<number> {
    const startTime = Date.now();
    
    try {
      const response = await Promise.race([
        fetch(test.url, { method: 'GET', cache: 'no-cache' }),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), test.timeout)
        )
      ]);

      if (response.ok) {
        await response.arrayBuffer();
        return Date.now() - startTime;
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      throw new Error(`Connection test failed: ${error.message}`);
    }
  }

  /**
   * Perform network optimization
   */
  private async performNetworkOptimization(): Promise<void> {
    if (!this.currentCondition) return;

    try {
      const allocations = Array.from(this.bandwidthAllocations.values());
      const applicableStrategies = Array.from(this.optimizationStrategies.values())
        .filter(strategy => strategy.conditions(this.currentCondition!))
        .sort((a, b) => b.priority - a.priority);

      if (applicableStrategies.length > 0) {
        const strategy = applicableStrategies[0];
        const result = await strategy.execute(this.currentCondition, allocations);
        
        if (result.success) {
          logDebug('Network optimization applied', {
            strategy: strategy.name,
            bandwidthSaved: result.bandwidthSaved,
            affectedStreams: result.affectedStreams.length
          });

          // Update data usage stats
          this.updateDataUsageStats(result);
        }
      }

    } catch (error) {
      logError('Network optimization failed', error as Error);
    }
  }

  /**
   * Strategy implementations
   */
  private async executeBandwidthReallocation(
    condition: NetworkCondition, 
    allocations: BandwidthAllocation[]
  ): Promise<NetworkOptimizationResult> {
    const startTime = Date.now();
    let bandwidthSaved = 0;
    const affectedStreams: string[] = [];
    const qualityChanges: Array<{ streamId: string; oldQuality: string; newQuality: string }> = [];

    try {
      const profile = this.connectionProfiles.get(this.currentProfile)!;
      const availableBandwidth = Math.min(condition.bandwidth * 0.9, profile.bandwidthLimits.maxTotal);
      
      // Sort allocations by priority and efficiency
      const sortedAllocations = allocations
        .filter(a => a.isActive)
        .sort((a, b) => {
          const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
          const aScore = priorityWeight[a.priority] + a.efficiency;
          const bScore = priorityWeight[b.priority] + b.efficiency;
          return bScore - aScore;
        });

      let remainingBandwidth = availableBandwidth - profile.bandwidthLimits.reservedForUI;
      
      // Reallocate bandwidth based on priority and efficiency
      for (const allocation of sortedAllocations) {
        const optimalBandwidth = Math.min(
          allocation.requestedBandwidth,
          profile.bandwidthLimits.maxPerStream,
          remainingBandwidth * 0.8 // Leave some buffer
        );

        if (optimalBandwidth !== allocation.allocatedBandwidth) {
          const difference = allocation.allocatedBandwidth - optimalBandwidth;
          allocation.allocatedBandwidth = optimalBandwidth;
          allocation.lastUpdate = Date.now();
          
          if (difference > 0) {
            bandwidthSaved += difference;
            affectedStreams.push(allocation.streamId);
          }
        }

        remainingBandwidth -= optimalBandwidth;
        if (remainingBandwidth <= 0) break;
      }

      return {
        success: true,
        bandwidthSaved,
        affectedStreams,
        qualityChanges,
        message: `Reallocated bandwidth for ${affectedStreams.length} streams`,
        duration: Date.now() - startTime
      };

    } catch (error) {
      return {
        success: false,
        bandwidthSaved: 0,
        affectedStreams: [],
        qualityChanges: [],
        message: `Bandwidth reallocation failed: ${error.message}`,
        duration: Date.now() - startTime
      };
    }
  }

  private async executeQualityDegradation(
    condition: NetworkCondition, 
    allocations: BandwidthAllocation[]
  ): Promise<NetworkOptimizationResult> {
    const startTime = Date.now();
    let bandwidthSaved = 0;
    const affectedStreams: string[] = [];
    const qualityChanges: Array<{ streamId: string; oldQuality: string; newQuality: string }> = [];

    try {
      const activeAllocations = allocations.filter(a => a.isActive);
      const totalRequested = activeAllocations.reduce((sum, a) => sum + a.requestedBandwidth, 0);
      const shortfall = totalRequested - condition.bandwidth * 0.8;

      if (shortfall > 0) {
        // Reduce quality for lower priority streams first
        const sortedByPriority = activeAllocations
          .sort((a, b) => {
            const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
            return priorityWeight[a.priority] - priorityWeight[b.priority];
          });

        let remainingShortfall = shortfall;
        
        for (const allocation of sortedByPriority) {
          if (remainingShortfall <= 0) break;
          if (allocation.priority === 'critical') continue;

          const reduction = Math.min(
            allocation.requestedBandwidth * 0.4, // Max 40% reduction
            remainingShortfall
          );

          if (reduction > 0.1) { // Only if meaningful reduction
            const oldQuality = allocation.qualityLevel;
            const newQuality = this.getReducedQuality(oldQuality);
            
            allocation.requestedBandwidth -= reduction;
            allocation.allocatedBandwidth -= reduction;
            allocation.qualityLevel = newQuality;
            allocation.lastUpdate = Date.now();
            
            bandwidthSaved += reduction;
            affectedStreams.push(allocation.streamId);
            qualityChanges.push({ streamId: allocation.streamId, oldQuality, newQuality });
            
            remainingShortfall -= reduction;
          }
        }

        this.dataUsageStats.qualityAdjustments++;
      }

      return {
        success: true,
        bandwidthSaved,
        affectedStreams,
        qualityChanges,
        message: `Reduced quality for ${affectedStreams.length} streams to save bandwidth`,
        duration: Date.now() - startTime
      };

    } catch (error) {
      return {
        success: false,
        bandwidthSaved: 0,
        affectedStreams: [],
        qualityChanges: [],
        message: `Quality degradation failed: ${error.message}`,
        duration: Date.now() - startTime
      };
    }
  }

  private async executeConnectionSwitching(
    condition: NetworkCondition, 
    allocations: BandwidthAllocation[]
  ): Promise<NetworkOptimizationResult> {
    // Placeholder for connection switching logic
    // In practice, this would switch between available network interfaces
    return {
      success: true,
      bandwidthSaved: 1.0,
      affectedStreams: [],
      qualityChanges: [],
      message: 'Connection switching not implemented',
      duration: 100
    };
  }

  private async executeDataCompression(
    condition: NetworkCondition, 
    allocations: BandwidthAllocation[]
  ): Promise<NetworkOptimizationResult> {
    const startTime = Date.now();
    let bandwidthSaved = 0;
    const affectedStreams: string[] = [];

    try {
      // Enable compression for eligible streams
      const profile = this.connectionProfiles.get(this.currentProfile)!;
      
      if (profile.optimizations.compressionEnabled) {
        const compressionRatio = 0.7; // 30% bandwidth saving
        
        for (const allocation of allocations) {
          if (allocation.isActive && allocation.priority !== 'critical') {
            const savings = allocation.allocatedBandwidth * (1 - compressionRatio);
            allocation.allocatedBandwidth *= compressionRatio;
            allocation.lastUpdate = Date.now();
            
            bandwidthSaved += savings;
            affectedStreams.push(allocation.streamId);
          }
        }

        this.dataUsageStats.compressionRatio = Math.max(
          this.dataUsageStats.compressionRatio,
          compressionRatio
        );
      }

      return {
        success: true,
        bandwidthSaved,
        affectedStreams,
        qualityChanges: [],
        message: `Enabled compression for ${affectedStreams.length} streams`,
        duration: Date.now() - startTime
      };

    } catch (error) {
      return {
        success: false,
        bandwidthSaved: 0,
        affectedStreams: [],
        qualityChanges: [],
        message: `Data compression failed: ${error.message}`,
        duration: Date.now() - startTime
      };
    }
  }

  private async executePrefetchingOptimization(
    condition: NetworkCondition, 
    allocations: BandwidthAllocation[]
  ): Promise<NetworkOptimizationResult> {
    const startTime = Date.now();
    
    // Disable prefetching under poor network conditions
    const profile = this.connectionProfiles.get(this.currentProfile)!;
    const shouldDisablePrefetching = 
      condition.bandwidth < 3 || 
      condition.latency > 200 || 
      condition.isMetered;

    if (shouldDisablePrefetching && profile.optimizations.preloadingEnabled) {
      profile.optimizations.preloadingEnabled = false;
      
      return {
        success: true,
        bandwidthSaved: 0.8,
        affectedStreams: [],
        qualityChanges: [],
        message: 'Disabled prefetching to conserve bandwidth',
        duration: Date.now() - startTime
      };
    }

    return {
      success: true,
      bandwidthSaved: 0,
      affectedStreams: [],
      qualityChanges: [],
      message: 'Prefetching already optimized',
      duration: Date.now() - startTime
    };
  }

  private async executeEmergencyConservation(
    condition: NetworkCondition, 
    allocations: BandwidthAllocation[]
  ): Promise<NetworkOptimizationResult> {
    const startTime = Date.now();
    let bandwidthSaved = 0;
    const affectedStreams: string[] = [];
    const qualityChanges: Array<{ streamId: string; oldQuality: string; newQuality: string }> = [];

    try {
      // Aggressive bandwidth conservation
      for (const allocation of allocations) {
        if (allocation.isActive && allocation.priority !== 'critical') {
          const oldQuality = allocation.qualityLevel;
          const newQuality = '360p'; // Force minimum quality
          
          const originalBandwidth = allocation.allocatedBandwidth;
          allocation.allocatedBandwidth = Math.min(allocation.allocatedBandwidth * 0.3, 0.8); // 70% reduction
          allocation.requestedBandwidth = allocation.allocatedBandwidth;
          allocation.qualityLevel = newQuality;
          allocation.lastUpdate = Date.now();
          
          bandwidthSaved += originalBandwidth - allocation.allocatedBandwidth;
          affectedStreams.push(allocation.streamId);
          qualityChanges.push({ streamId: allocation.streamId, oldQuality, newQuality });
        }
      }

      // Disable all non-essential features
      const profile = this.connectionProfiles.get(this.currentProfile)!;
      profile.optimizations.preloadingEnabled = false;
      profile.optimizations.backgroundThrottling = true;

      this.dataUsageStats.qualityAdjustments += affectedStreams.length;

      return {
        success: true,
        bandwidthSaved,
        affectedStreams,
        qualityChanges,
        message: `Emergency conservation applied to ${affectedStreams.length} streams`,
        duration: Date.now() - startTime
      };

    } catch (error) {
      return {
        success: false,
        bandwidthSaved: 0,
        affectedStreams: [],
        qualityChanges: [],
        message: `Emergency conservation failed: ${error.message}`,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Generate network predictions
   */
  private generateNetworkPredictions(): void {
    if (this.networkHistory.length < 10) return;

    const timeHorizons = [30, 60, 300]; // 30s, 1min, 5min

    timeHorizons.forEach(horizon => {
      const prediction = this.predictNetworkCondition(horizon);
      this.predictions.push(prediction);
    });

    // Keep only recent predictions
    if (this.predictions.length > 50) {
      this.predictions.splice(0, this.predictions.length - 50);
    }
  }

  /**
   * Predict network condition for given time horizon
   */
  private predictNetworkCondition(horizonSeconds: number): NetworkPrediction {
    const recent = this.networkHistory.slice(-20);
    const current = recent[recent.length - 1];
    
    // Calculate trends
    const bandwidthTrend = this.calculateTrend(recent.map(h => h.bandwidth));
    const latencyTrend = this.calculateTrend(recent.map(h => h.latency));
    const stabilityTrend = this.calculateTrend(recent.map(h => h.stability));
    
    // Time-based factors
    const hour = new Date().getHours();
    const timeOfDayFactor = this.getTimeOfDayNetworkFactor(hour);
    
    // Predict values
    const predictedBandwidth = Math.max(0, current.bandwidth + (bandwidthTrend * horizonSeconds / 60) * timeOfDayFactor);
    const predictedLatency = Math.max(10, current.latency + (latencyTrend * horizonSeconds / 60));
    const predictedStability = Math.max(0, Math.min(1, current.stability + (stabilityTrend * horizonSeconds / 60)));
    
    // Calculate confidence
    const trendVariance = this.calculateTrendVariance(recent);
    const confidence = Math.max(0.3, 1 - trendVariance);
    
    const recommendations: string[] = [];
    if (predictedBandwidth < current.bandwidth * 0.8) {
      recommendations.push('Bandwidth degradation expected - prepare for quality reduction');
    }
    if (predictedLatency > current.latency * 1.5) {
      recommendations.push('Latency increase expected - consider connection optimization');
    }
    if (predictedStability < 0.5) {
      recommendations.push('Network instability predicted - enable conservative mode');
    }

    return {
      timestamp: Date.now(),
      predictedBandwidth,
      predictedLatency,
      predictedStability,
      confidence,
      timeHorizon: horizonSeconds,
      factors: {
        historicalTrend: bandwidthTrend,
        timeOfDay: timeOfDayFactor,
        networkLoad: this.estimateNetworkLoad(),
        userMovement: this.estimateUserMovement()
      },
      recommendations
    };
  }

  /**
   * Utility methods
   */
  private detectConnectionType(): 'wifi' | 'cellular' | 'ethernet' | 'unknown' {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        const type = connection.type || connection.effectiveType;
        if (type === 'wifi') return 'wifi';
        if (type === 'cellular' || type.includes('g')) return 'cellular';
        if (type === 'ethernet') return 'ethernet';
      }
    }
    return 'unknown';
  }

  private mapBandwidthToEffectiveType(bandwidth: number): '2g' | '3g' | '4g' | '5g' | 'unknown' {
    if (bandwidth >= 20) return '5g';
    if (bandwidth >= 10) return '4g';
    if (bandwidth >= 3) return '3g';
    if (bandwidth >= 0.5) return '2g';
    return 'unknown';
  }

  private calculateNetworkStability(metrics: BandwidthMetrics): number {
    // Simplified stability calculation
    if (metrics.jitter > 100) return 0.2;
    if (metrics.jitter > 50) return 0.5;
    if (metrics.jitter > 20) return 0.7;
    return 0.9;
  }

  private assessNetworkQuality(metrics: BandwidthMetrics): 'excellent' | 'good' | 'fair' | 'poor' | 'critical' {
    const bandwidth = metrics.downloadSpeed;
    const latency = metrics.latency;
    
    if (bandwidth >= 10 && latency <= 50) return 'excellent';
    if (bandwidth >= 5 && latency <= 100) return 'good';
    if (bandwidth >= 2 && latency <= 200) return 'fair';
    if (bandwidth >= 0.5 && latency <= 500) return 'poor';
    return 'critical';
  }

  private detectMeteredConnection(): boolean {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      return connection?.saveData || false;
    }
    return false;
  }

  private updateConnectionProfile(condition: NetworkCondition): void {
    // Auto-switch profiles based on conditions
    if (condition.connectionType === 'cellular' && this.currentProfile !== 'cellular') {
      this.setConnectionProfile('cellular');
    } else if (condition.bandwidth < 3 && this.currentProfile !== 'low_bandwidth') {
      this.setConnectionProfile('low_bandwidth');
    } else if (condition.connectionType === 'wifi' && condition.bandwidth > 10 && this.currentProfile !== 'wifi') {
      this.setConnectionProfile('wifi');
    }
  }

  private hasBandwidthImbalance(): boolean {
    const allocations = Array.from(this.bandwidthAllocations.values());
    const totalAllocated = allocations.reduce((sum, a) => sum + a.allocatedBandwidth, 0);
    const totalUsed = allocations.reduce((sum, a) => sum + a.actualUsage, 0);
    
    return Math.abs(totalAllocated - totalUsed) > totalAllocated * 0.2;
  }

  private hasAlternativeConnection(): boolean {
    // Simplified check - in practice, would detect multiple network interfaces
    return false;
  }

  private getTotalRequestedBandwidth(): number {
    return Array.from(this.bandwidthAllocations.values())
      .reduce((sum, a) => sum + a.requestedBandwidth, 0);
  }

  private getReducedQuality(currentQuality: string): string {
    const qualityMap = {
      'source': '1080p',
      '1080p': '720p',
      '720p': '480p',
      '480p': '360p',
      '360p': '240p',
      '240p': '160p'
    };
    return qualityMap[currentQuality as keyof typeof qualityMap] || '360p';
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    const n = values.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += values[i];
      sumXY += i * values[i];
      sumX2 += i * i;
    }
    
    return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  }

  private calculateTrendVariance(conditions: NetworkCondition[]): number {
    const bandwidths = conditions.map(c => c.bandwidth);
    const mean = bandwidths.reduce((sum, b) => sum + b, 0) / bandwidths.length;
    const variance = bandwidths.reduce((sum, b) => sum + Math.pow(b - mean, 2), 0) / bandwidths.length;
    return Math.sqrt(variance) / mean; // Coefficient of variation
  }

  private getTimeOfDayNetworkFactor(hour: number): number {
    // Peak usage hours (8-10 AM, 6-10 PM) have lower available bandwidth
    if ((hour >= 8 && hour <= 10) || (hour >= 18 && hour <= 22)) {
      return 0.7;
    }
    return 1.0;
  }

  private estimateNetworkLoad(): number {
    const allocations = Array.from(this.bandwidthAllocations.values());
    const activeCount = allocations.filter(a => a.isActive).length;
    return Math.min(1, activeCount / 10); // Normalize to 0-1
  }

  private estimateUserMovement(): number {
    // Simplified - in practice, would use device sensors
    return 0.1;
  }

  private addToHistory(condition: NetworkCondition): void {
    this.networkHistory.push(condition);
    if (this.networkHistory.length > this.config.historySize) {
      this.networkHistory.shift();
    }
  }

  private updateDataUsageStats(result: NetworkOptimizationResult): void {
    this.dataUsageStats.totalDataSaved += result.bandwidthSaved * 60; // Convert to MB (rough estimate)
    if (result.qualityChanges.length > 0) {
      this.dataUsageStats.qualityAdjustments += result.qualityChanges.length;
    }
  }

  private notifyListeners(condition: NetworkCondition): void {
    for (const listener of this.listeners) {
      try {
        listener(condition);
      } catch (error) {
        logError('Error in network condition listener', error as Error);
      }
    }
  }

  // Public API methods
  public allocateBandwidth(allocation: Omit<BandwidthAllocation, 'lastUpdate' | 'actualUsage' | 'efficiency'>): void {
    const fullAllocation: BandwidthAllocation = {
      ...allocation,
      lastUpdate: Date.now(),
      actualUsage: 0,
      efficiency: 0
    };

    this.bandwidthAllocations.set(allocation.streamId, fullAllocation);
    logDebug('Bandwidth allocated', { streamId: allocation.streamId, bandwidth: allocation.allocatedBandwidth });
  }

  public updateBandwidthUsage(streamId: string, actualUsage: number): void {
    const allocation = this.bandwidthAllocations.get(streamId);
    if (allocation) {
      allocation.actualUsage = actualUsage;
      allocation.efficiency = allocation.allocatedBandwidth > 0 ? actualUsage / allocation.allocatedBandwidth : 0;
      allocation.lastUpdate = Date.now();
    }
  }

  public deallocateBandwidth(streamId: string): void {
    this.bandwidthAllocations.delete(streamId);
    logDebug('Bandwidth deallocated', { streamId });
  }

  public setConnectionProfile(profileId: string): void {
    if (this.connectionProfiles.has(profileId)) {
      this.currentProfile = profileId;
      logDebug('Connection profile changed', { profile: profileId });
    }
  }

  public getCurrentCondition(): NetworkCondition | null {
    return this.currentCondition;
  }

  public getBandwidthAllocations(): BandwidthAllocation[] {
    return Array.from(this.bandwidthAllocations.values());
  }

  public getNetworkPredictions(): NetworkPrediction[] {
    return [...this.predictions];
  }

  public getDataUsageStats(): DataUsageOptimization {
    return { ...this.dataUsageStats };
  }

  public addOptimizationStrategy(strategy: NetworkOptimizationStrategy): void {
    this.optimizationStrategies.set(strategy.id, strategy);
    logDebug('Network optimization strategy added', { id: strategy.id });
  }

  public onNetworkConditionChange(listener: (condition: NetworkCondition) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public destroy(): void {
    if (this.monitoringInterval) clearInterval(this.monitoringInterval);
    if (this.optimizationInterval) clearInterval(this.optimizationInterval);
    if (this.predictionInterval) clearInterval(this.predictionInterval);
    
    this.bandwidthAllocations.clear();
    this.optimizationStrategies.clear();
    this.listeners.clear();
    
    logDebug('Network Optimizer destroyed');
  }
}

// Export singleton instance
export const networkOptimizer = new NetworkOptimizer();

// Helper functions
export const allocateBandwidth = (allocation: Omit<BandwidthAllocation, 'lastUpdate' | 'actualUsage' | 'efficiency'>) =>
  networkOptimizer.allocateBandwidth(allocation);

export const updateBandwidthUsage = (streamId: string, actualUsage: number) =>
  networkOptimizer.updateBandwidthUsage(streamId, actualUsage);

export const getCurrentNetworkCondition = () =>
  networkOptimizer.getCurrentCondition();

export const getNetworkPredictions = () =>
  networkOptimizer.getNetworkPredictions();

export const setNetworkProfile = (profileId: string) =>
  networkOptimizer.setConnectionProfile(profileId);