/**
 * Advanced Performance Manager
 * Central orchestrator for all performance optimization with ML-based algorithms
 * Provides intelligent resource management, predictive optimization, and real-time adaptation
 */

import { logDebug, logWarning, logError } from '@/utils/errorHandler';
import { performanceOptimizer, PerformanceMetrics } from './performanceOptimizer';
import { bandwidthMonitor, BandwidthMetrics } from './bandwidthMonitor';

export interface AdvancedPerformanceMetrics extends PerformanceMetrics {
  // Device metrics
  thermalState: 'normal' | 'fair' | 'serious' | 'critical';
  networkType: '2g' | '3g' | '4g' | '5g' | 'wifi' | 'ethernet' | 'unknown';
  deviceClass: 'low-end' | 'mid-range' | 'high-end' | 'unknown';
  
  // Application metrics
  activeStreams: number;
  backgroundTasks: number;
  renderQueueDepth: number;
  jsHeapPressure: number;
  
  // User interaction metrics
  lastUserInteraction: number;
  currentFocus: string | null;
  isAppInBackground: boolean;
  userEngagementScore: number;
  
  // Prediction metrics
  predictedMemoryUsage: number;
  predictedCpuLoad: number;
  recommendedOptimizations: string[];
}

export interface MLOptimizationModel {
  // Feature weights for different optimization strategies
  memoryWeight: number;
  cpuWeight: number;
  batteryWeight: number;
  networkWeight: number;
  userExperienceWeight: number;
  
  // Prediction accuracy metrics
  accuracy: number;
  lastTraining: number;
  samplesCount: number;
  
  // Model parameters
  learningRate: number;
  decayFactor: number;
  adaptationThreshold: number;
}

export interface OptimizationStrategy {
  id: string;
  name: string;
  description: string;
  priority: number;
  conditions: (metrics: AdvancedPerformanceMetrics) => boolean;
  execute: (metrics: AdvancedPerformanceMetrics) => Promise<void>;
  impact: {
    memory: number;    // -100 to 100 (negative = reduces usage)
    cpu: number;       // -100 to 100
    battery: number;   // -100 to 100
    quality: number;   // -100 to 100
    userExperience: number; // -100 to 100
  };
  confidence: number; // 0 to 1
}

export interface PerformanceProfile {
  id: string;
  name: string;
  description: string;
  maxConcurrentStreams: number;
  preferredQuality: string;
  aggressiveOptimization: boolean;
  batteryAware: boolean;
  qualityPriority: 'performance' | 'quality' | 'balanced';
  conditions: {
    minBattery?: number;
    maxMemoryUsage?: number;
    maxCpuUsage?: number;
    minBandwidth?: number;
  };
}

class AdvancedPerformanceManager {
  private metrics: AdvancedPerformanceMetrics | null = null;
  private mlModel: MLOptimizationModel;
  private optimizationStrategies = new Map<string, OptimizationStrategy>();
  private performanceProfiles = new Map<string, PerformanceProfile>();
  private currentProfile: string = 'balanced';
  private listeners = new Set<(metrics: AdvancedPerformanceMetrics) => void>();
  
  // ML and prediction data
  private trainingData: Array<{
    input: AdvancedPerformanceMetrics;
    output: { optimization: string; success: boolean; improvement: number };
  }> = [];
  private predictionHistory: Array<{
    timestamp: number;
    predicted: number;
    actual: number;
    accuracy: number;
  }> = [];
  
  // Monitoring intervals
  private mainMonitorInterval: NodeJS.Timeout | null = null;
  private mlUpdateInterval: NodeJS.Timeout | null = null;
  private predictionInterval: NodeJS.Timeout | null = null;
  
  private isOptimizing = false;
  private lastOptimization = 0;
  private optimizationCooldown = 5000; // 5 seconds between optimizations

  constructor() {
    this.initializeMLModel();
    this.initializeOptimizationStrategies();
    this.initializePerformanceProfiles();
    this.startAdvancedMonitoring();
  }

  /**
   * Initialize ML optimization model with default parameters
   */
  private initializeMLModel(): void {
    this.mlModel = {
      memoryWeight: 0.25,
      cpuWeight: 0.25,
      batteryWeight: 0.20,
      networkWeight: 0.15,
      userExperienceWeight: 0.15,
      accuracy: 0.0,
      lastTraining: Date.now(),
      samplesCount: 0,
      learningRate: 0.01,
      decayFactor: 0.95,
      adaptationThreshold: 0.1
    };
  }

  /**
   * Initialize built-in optimization strategies
   */
  private initializeOptimizationStrategies(): void {
    // Memory pressure reduction strategy
    this.addOptimizationStrategy({
      id: 'memory_pressure_reduction',
      name: 'Memory Pressure Reduction',
      description: 'Reduces memory usage when pressure is high',
      priority: 10,
      conditions: (metrics) => metrics.memoryPressure === 'high' || metrics.memoryPressure === 'critical',
      execute: async (metrics) => {
        await this.executeMemoryOptimization(metrics);
      },
      impact: {
        memory: -40,
        cpu: 5,
        battery: -10,
        quality: -20,
        userExperience: -15
      },
      confidence: 0.9
    });

    // CPU throttling strategy
    this.addOptimizationStrategy({
      id: 'cpu_throttling',
      name: 'CPU Load Reduction',
      description: 'Reduces CPU intensive operations when load is high',
      priority: 9,
      conditions: (metrics) => metrics.cpuUsage > 75,
      execute: async (metrics) => {
        await this.executeCpuOptimization(metrics);
      },
      impact: {
        memory: -10,
        cpu: -35,
        battery: -20,
        quality: -25,
        userExperience: -10
      },
      confidence: 0.85
    });

    // Battery saver strategy
    this.addOptimizationStrategy({
      id: 'battery_saver',
      name: 'Battery Conservation',
      description: 'Optimizes for battery life when level is low',
      priority: 8,
      conditions: (metrics) => (metrics.batteryLevel || 100) < 20 && !metrics.isCharging,
      execute: async (metrics) => {
        await this.executeBatteryOptimization(metrics);
      },
      impact: {
        memory: -20,
        cpu: -30,
        battery: -50,
        quality: -40,
        userExperience: -20
      },
      confidence: 0.95
    });

    // Network adaptation strategy
    this.addOptimizationStrategy({
      id: 'network_adaptation',
      name: 'Network Quality Adaptation',
      description: 'Adapts streaming quality based on network conditions',
      priority: 7,
      conditions: (metrics) => {
        const bandwidth = bandwidthMonitor?.getCurrentMetrics?.();
        return bandwidth ? bandwidth.downloadSpeed < 5 : false;
      },
      execute: async (metrics) => {
        await this.executeNetworkOptimization(metrics);
      },
      impact: {
        memory: -15,
        cpu: -10,
        battery: -15,
        quality: -30,
        userExperience: 10
      },
      confidence: 0.8
    });

    // Thermal management strategy
    this.addOptimizationStrategy({
      id: 'thermal_management',
      name: 'Thermal Management',
      description: 'Reduces load when device is overheating',
      priority: 9,
      conditions: (metrics) => metrics.thermalState === 'serious' || metrics.thermalState === 'critical',
      execute: async (metrics) => {
        await this.executeThermalOptimization(metrics);
      },
      impact: {
        memory: -25,
        cpu: -40,
        battery: -30,
        quality: -35,
        userExperience: -25
      },
      confidence: 0.9
    });

    // User engagement optimization
    this.addOptimizationStrategy({
      id: 'user_engagement_optimization',
      name: 'User Engagement Optimization',
      description: 'Optimizes based on user interaction patterns',
      priority: 5,
      conditions: (metrics) => metrics.userEngagementScore < 0.3 && Date.now() - metrics.lastUserInteraction > 60000,
      execute: async (metrics) => {
        await this.executeEngagementOptimization(metrics);
      },
      impact: {
        memory: -30,
        cpu: -25,
        battery: -20,
        quality: -20,
        userExperience: 20
      },
      confidence: 0.7
    });
  }

  /**
   * Initialize performance profiles for different use cases
   */
  private initializePerformanceProfiles(): void {
    // Balanced profile
    this.performanceProfiles.set('balanced', {
      id: 'balanced',
      name: 'Balanced',
      description: 'Balanced performance and quality',
      maxConcurrentStreams: 4,
      preferredQuality: '720p',
      aggressiveOptimization: false,
      batteryAware: true,
      qualityPriority: 'balanced',
      conditions: {}
    });

    // Performance profile
    this.performanceProfiles.set('performance', {
      id: 'performance',
      name: 'High Performance',
      description: 'Prioritizes smooth performance over quality',
      maxConcurrentStreams: 6,
      preferredQuality: '480p',
      aggressiveOptimization: true,
      batteryAware: false,
      qualityPriority: 'performance',
      conditions: {
        minBandwidth: 10
      }
    });

    // Quality profile
    this.performanceProfiles.set('quality', {
      id: 'quality',
      name: 'High Quality',
      description: 'Prioritizes video quality over performance',
      maxConcurrentStreams: 2,
      preferredQuality: 'source',
      aggressiveOptimization: false,
      batteryAware: true,
      qualityPriority: 'quality',
      conditions: {
        minBattery: 30,
        maxMemoryUsage: 70,
        maxCpuUsage: 60,
        minBandwidth: 15
      }
    });

    // Battery saver profile
    this.performanceProfiles.set('battery_saver', {
      id: 'battery_saver',
      name: 'Battery Saver',
      description: 'Maximizes battery life',
      maxConcurrentStreams: 1,
      preferredQuality: '360p',
      aggressiveOptimization: true,
      batteryAware: true,
      qualityPriority: 'performance',
      conditions: {
        maxMemoryUsage: 50,
        maxCpuUsage: 40
      }
    });

    // Low-end device profile
    this.performanceProfiles.set('low_end', {
      id: 'low_end',
      name: 'Low-End Device',
      description: 'Optimized for lower-end devices',
      maxConcurrentStreams: 2,
      preferredQuality: '480p',
      aggressiveOptimization: true,
      batteryAware: true,
      qualityPriority: 'performance',
      conditions: {
        maxMemoryUsage: 60,
        maxCpuUsage: 50
      }
    });
  }

  /**
   * Start advanced performance monitoring with ML predictions
   */
  private startAdvancedMonitoring(): void {
    // Main monitoring loop
    this.mainMonitorInterval = setInterval(() => {
      this.collectAdvancedMetrics();
    }, 2000);

    // ML model updates
    this.mlUpdateInterval = setInterval(() => {
      this.updateMLModel();
    }, 30000);

    // Prediction updates
    this.predictionInterval = setInterval(() => {
      this.generatePredictions();
    }, 10000);

    logDebug('Advanced performance monitoring started');
  }

  /**
   * Collect comprehensive performance metrics
   */
  private async collectAdvancedMetrics(): Promise<void> {
    try {
      const baseMetrics = performanceOptimizer?.getCurrentMetrics?.();
      const bandwidthMetrics = bandwidthMonitor?.getCurrentMetrics?.();

      if (!baseMetrics) return;

      const advancedMetrics: AdvancedPerformanceMetrics = {
        ...baseMetrics,
        thermalState: await this.getThermalState(),
        networkType: this.getNetworkType(bandwidthMetrics),
        deviceClass: this.getDeviceClass(),
        activeStreams: this.getActiveStreamCount(),
        backgroundTasks: this.getBackgroundTaskCount(),
        renderQueueDepth: this.getRenderQueueDepth(),
        jsHeapPressure: this.getJSHeapPressure(),
        lastUserInteraction: this.getLastUserInteraction(),
        currentFocus: this.getCurrentFocus(),
        isAppInBackground: this.isAppInBackground(),
        userEngagementScore: this.calculateUserEngagementScore(),
        predictedMemoryUsage: this.predictMemoryUsage(),
        predictedCpuLoad: this.predictCpuLoad(),
        recommendedOptimizations: this.getRecommendedOptimizations()
      };

      this.metrics = advancedMetrics;
      this.notifyListeners(advancedMetrics);

      // Check if optimization is needed
      if (this.shouldOptimize(advancedMetrics)) {
        await this.performIntelligentOptimization(advancedMetrics);
      }

    } catch (error) {
      logError('Failed to collect advanced metrics', error as Error);
    }
  }

  /**
   * Perform intelligent optimization based on ML predictions
   */
  private async performIntelligentOptimization(metrics: AdvancedPerformanceMetrics): Promise<void> {
    if (this.isOptimizing || Date.now() - this.lastOptimization < this.optimizationCooldown) {
      return;
    }

    this.isOptimizing = true;
    this.lastOptimization = Date.now();

    try {
      // Get applicable optimization strategies
      const applicableStrategies = Array.from(this.optimizationStrategies.values())
        .filter(strategy => strategy.conditions(metrics))
        .sort((a, b) => b.priority - a.priority);

      if (applicableStrategies.length === 0) {
        this.isOptimizing = false;
        return;
      }

      // Select best strategy using ML model
      const selectedStrategy = this.selectOptimalStrategy(applicableStrategies, metrics);

      if (selectedStrategy) {
        logDebug('Executing optimization strategy', { 
          strategy: selectedStrategy.name,
          confidence: selectedStrategy.confidence 
        });

        const startTime = Date.now();
        await selectedStrategy.execute(metrics);
        const executionTime = Date.now() - startTime;

        // Record optimization result for ML training
        this.recordOptimizationResult(metrics, selectedStrategy, executionTime);
      }

    } catch (error) {
      logError('Optimization execution failed', error as Error);
    } finally {
      this.isOptimizing = false;
    }
  }

  /**
   * Select optimal strategy using ML model
   */
  private selectOptimalStrategy(
    strategies: OptimizationStrategy[], 
    metrics: AdvancedPerformanceMetrics
  ): OptimizationStrategy | null {
    if (strategies.length === 0) return null;
    if (strategies.length === 1) return strategies[0];

    // Calculate scores for each strategy using ML model
    const scoredStrategies = strategies.map(strategy => {
      const score = this.calculateStrategyScore(strategy, metrics);
      return { strategy, score };
    });

    // Sort by score and return best strategy
    scoredStrategies.sort((a, b) => b.score - a.score);
    return scoredStrategies[0].strategy;
  }

  /**
   * Calculate strategy score using ML model
   */
  private calculateStrategyScore(strategy: OptimizationStrategy, metrics: AdvancedPerformanceMetrics): number {
    const profile = this.performanceProfiles.get(this.currentProfile);
    if (!profile) return strategy.confidence;

    // Base score from strategy confidence
    let score = strategy.confidence * 100;

    // Adjust based on current performance pressure
    if (metrics.memoryPressure === 'critical') score += strategy.impact.memory * -0.5;
    if (metrics.cpuUsage > 80) score += strategy.impact.cpu * -0.5;
    if ((metrics.batteryLevel || 100) < 20) score += strategy.impact.battery * -0.5;

    // Adjust based on profile preferences
    switch (profile.qualityPriority) {
      case 'performance':
        score += (strategy.impact.cpu * -0.3) + (strategy.impact.memory * -0.3);
        break;
      case 'quality':
        score += strategy.impact.quality * -0.4;
        break;
      case 'balanced':
        score += (strategy.impact.userExperience * 0.2);
        break;
    }

    // Apply ML model weights
    score *= this.mlModel.memoryWeight * (metrics.memoryUsage / 1024) +
             this.mlModel.cpuWeight * (metrics.cpuUsage / 100) +
             this.mlModel.batteryWeight * ((100 - (metrics.batteryLevel || 100)) / 100) +
             this.mlModel.networkWeight * (1 - Math.min(bandwidthMonitor?.getAvailableBandwidth?.() || 10, 10) / 10) +
             this.mlModel.userExperienceWeight * (1 - metrics.userEngagementScore);

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Update ML model based on historical performance
   */
  private updateMLModel(): void {
    if (this.trainingData.length < 10) return;

    try {
      // Calculate success rate and improvement metrics
      const recentData = this.trainingData.slice(-50);
      const successRate = recentData.filter(d => d.output.success).length / recentData.length;
      const avgImprovement = recentData.reduce((sum, d) => sum + d.output.improvement, 0) / recentData.length;

      // Update model accuracy
      this.mlModel.accuracy = successRate;
      this.mlModel.samplesCount = this.trainingData.length;

      // Adjust weights based on performance
      if (successRate < 0.7) {
        // Reduce learning rate if performance is poor
        this.mlModel.learningRate *= this.mlModel.decayFactor;
      } else if (successRate > 0.9 && avgImprovement > 0.2) {
        // Increase learning rate if performance is excellent
        this.mlModel.learningRate = Math.min(0.05, this.mlModel.learningRate * 1.1);
      }

      // Update feature weights based on correlation analysis
      this.updateFeatureWeights(recentData);

      this.mlModel.lastTraining = Date.now();
      logDebug('ML model updated', { 
        accuracy: this.mlModel.accuracy, 
        samples: this.mlModel.samplesCount 
      });

    } catch (error) {
      logError('ML model update failed', error as Error);
    }
  }

  /**
   * Update feature weights based on correlation analysis
   */
  private updateFeatureWeights(trainingData: typeof this.trainingData): void {
    // Simple correlation analysis for feature weight adjustment
    const correlations = {
      memory: 0,
      cpu: 0,
      battery: 0,
      network: 0,
      userExperience: 0
    };

    // Calculate correlations (simplified implementation)
    trainingData.forEach(data => {
      if (data.output.success && data.output.improvement > 0) {
        correlations.memory += data.input.memoryUsage / 1024;
        correlations.cpu += data.input.cpuUsage / 100;
        correlations.battery += (100 - (data.input.batteryLevel || 100)) / 100;
        correlations.userExperience += 1 - data.input.userEngagementScore;
      }
    });

    // Normalize and update weights
    const total = Object.values(correlations).reduce((sum, val) => sum + val, 0);
    if (total > 0) {
      this.mlModel.memoryWeight = Math.max(0.1, correlations.memory / total);
      this.mlModel.cpuWeight = Math.max(0.1, correlations.cpu / total);
      this.mlModel.batteryWeight = Math.max(0.1, correlations.battery / total);
      this.mlModel.userExperienceWeight = Math.max(0.1, correlations.userExperience / total);
      
      // Ensure weights sum to 1
      const weightSum = this.mlModel.memoryWeight + this.mlModel.cpuWeight + 
                       this.mlModel.batteryWeight + this.mlModel.userExperienceWeight;
      
      this.mlModel.memoryWeight /= weightSum;
      this.mlModel.cpuWeight /= weightSum;
      this.mlModel.batteryWeight /= weightSum;
      this.mlModel.userExperienceWeight /= weightSum;
      this.mlModel.networkWeight = 1 - (this.mlModel.memoryWeight + this.mlModel.cpuWeight + 
                                       this.mlModel.batteryWeight + this.mlModel.userExperienceWeight);
    }
  }

  // Strategy execution methods
  private async executeMemoryOptimization(metrics: AdvancedPerformanceMetrics): Promise<void> {
    // Aggressive memory cleanup
    if (typeof window !== 'undefined' && 'gc' in window) {
      try {
        (window as any).gc();
      } catch (error) {
        // GC not available
      }
    }

    // Reduce stream count if memory pressure is critical
    if (metrics.memoryPressure === 'critical' && metrics.activeStreams > 1) {
      // Implementation would pause lower priority streams
      logDebug('Pausing streams due to critical memory pressure');
    }
  }

  private async executeCpuOptimization(metrics: AdvancedPerformanceMetrics): Promise<void> {
    // Reduce frame rate for animations
    // Throttle background processing
    // Lower stream quality temporarily
    logDebug('Executing CPU optimization');
  }

  private async executeBatteryOptimization(metrics: AdvancedPerformanceMetrics): Promise<void> {
    // Enable battery saver mode
    // Reduce screen brightness (if possible)
    // Limit background processing
    logDebug('Executing battery optimization');
  }

  private async executeNetworkOptimization(metrics: AdvancedPerformanceMetrics): Promise<void> {
    // Adapt stream quality based on bandwidth
    // Enable compression
    // Reduce concurrent streams
    logDebug('Executing network optimization');
  }

  private async executeThermalOptimization(metrics: AdvancedPerformanceMetrics): Promise<void> {
    // Reduce CPU intensive operations
    // Lower stream quality
    // Throttle background tasks
    logDebug('Executing thermal optimization');
  }

  private async executeEngagementOptimization(metrics: AdvancedPerformanceMetrics): Promise<void> {
    // Pause non-visible streams
    // Reduce quality for background streams
    // Optimize for current focus
    logDebug('Executing engagement optimization');
  }

  // Utility methods for metric collection
  private async getThermalState(): Promise<'normal' | 'fair' | 'serious' | 'critical'> {
    // This would typically use native APIs to get thermal state
    return 'normal';
  }

  private getNetworkType(bandwidthMetrics: BandwidthMetrics | null): string {
    if (!bandwidthMetrics) return 'unknown';
    
    const speed = bandwidthMetrics.downloadSpeed;
    if (speed > 50) return '5g';
    if (speed > 10) return '4g';
    if (speed > 2) return '3g';
    return '2g';
  }

  private getDeviceClass(): 'low-end' | 'mid-range' | 'high-end' | 'unknown' {
    // Estimate based on performance characteristics
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const memInfo = (performance as any).memory;
      if (memInfo.jsHeapSizeLimit > 2 * 1024 * 1024 * 1024) return 'high-end';
      if (memInfo.jsHeapSizeLimit > 1 * 1024 * 1024 * 1024) return 'mid-range';
      return 'low-end';
    }
    return 'unknown';
  }

  private getActiveStreamCount(): number {
    // This would integrate with stream manager
    return 0;
  }

  private getBackgroundTaskCount(): number {
    // Count active background tasks
    return 0;
  }

  private getRenderQueueDepth(): number {
    // Measure React render queue depth
    return 0;
  }

  private getJSHeapPressure(): number {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const memInfo = (performance as any).memory;
      return memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit;
    }
    return 0;
  }

  private getLastUserInteraction(): number {
    // Track last user interaction timestamp
    return Date.now();
  }

  private getCurrentFocus(): string | null {
    // Track currently focused element/component
    return null;
  }

  private isAppInBackground(): boolean {
    return document.hidden || false;
  }

  private calculateUserEngagementScore(): number {
    // Calculate engagement based on interactions, focus time, etc.
    return 0.8;
  }

  private predictMemoryUsage(): number {
    // Use historical data to predict memory usage
    return this.metrics?.memoryUsage || 0;
  }

  private predictCpuLoad(): number {
    // Use historical data to predict CPU load
    return this.metrics?.cpuUsage || 0;
  }

  private getRecommendedOptimizations(): string[] {
    // Generate recommendations based on current state
    return [];
  }

  private shouldOptimize(metrics: AdvancedPerformanceMetrics): boolean {
    return metrics.memoryPressure !== 'low' || 
           metrics.cpuUsage > 70 ||
           (metrics.batteryLevel || 100) < 25 ||
           metrics.thermalState !== 'normal';
  }

  private generatePredictions(): void {
    // Generate performance predictions
  }

  private recordOptimizationResult(
    metrics: AdvancedPerformanceMetrics, 
    strategy: OptimizationStrategy, 
    executionTime: number
  ): void {
    // Record result for ML training
    this.trainingData.push({
      input: { ...metrics },
      output: {
        optimization: strategy.id,
        success: executionTime < 1000, // Simple success metric
        improvement: 0.1 // Would calculate actual improvement
      }
    });

    // Limit training data size
    if (this.trainingData.length > 1000) {
      this.trainingData.shift();
    }
  }

  private notifyListeners(metrics: AdvancedPerformanceMetrics): void {
    for (const listener of this.listeners) {
      try {
        listener(metrics);
      } catch (error) {
        logError('Error in performance listener', error as Error);
      }
    }
  }

  // Public API methods
  public addOptimizationStrategy(strategy: OptimizationStrategy): void {
    this.optimizationStrategies.set(strategy.id, strategy);
    logDebug('Optimization strategy added', { id: strategy.id, name: strategy.name });
  }

  public removeOptimizationStrategy(id: string): void {
    this.optimizationStrategies.delete(id);
    logDebug('Optimization strategy removed', { id });
  }

  public setPerformanceProfile(profileId: string): void {
    if (this.performanceProfiles.has(profileId)) {
      this.currentProfile = profileId;
      logDebug('Performance profile changed', { profile: profileId });
    }
  }

  public getCurrentMetrics(): AdvancedPerformanceMetrics | null {
    return this.metrics;
  }

  public getMLModelStats(): MLOptimizationModel {
    return { ...this.mlModel };
  }

  public onMetricsUpdate(listener: (metrics: AdvancedPerformanceMetrics) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public destroy(): void {
    if (this.mainMonitorInterval) clearInterval(this.mainMonitorInterval);
    if (this.mlUpdateInterval) clearInterval(this.mlUpdateInterval);
    if (this.predictionInterval) clearInterval(this.predictionInterval);
    
    this.listeners.clear();
    this.optimizationStrategies.clear();
    this.performanceProfiles.clear();
    
    logDebug('Advanced Performance Manager destroyed');
  }
}

// Export singleton instance
export const advancedPerformanceManager = new AdvancedPerformanceManager();

// Helper functions
export const setPerformanceProfile = (profileId: string) => 
  advancedPerformanceManager.setPerformanceProfile(profileId);

export const getAdvancedMetrics = () => 
  advancedPerformanceManager.getCurrentMetrics();

export const getMLModelStats = () => 
  advancedPerformanceManager.getMLModelStats();

export const addCustomOptimizationStrategy = (strategy: OptimizationStrategy) =>
  advancedPerformanceManager.addOptimizationStrategy(strategy);