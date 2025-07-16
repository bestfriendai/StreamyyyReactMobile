/**
 * Intelligent Quality Manager
 * Advanced adaptive streaming with predictive quality selection using ML algorithms
 * Provides intelligent bitrate adaptation, quality optimization, and user experience enhancement
 */

import { logDebug, logWarning, logError } from '@/utils/errorHandler';
import { bandwidthMonitor, BandwidthMetrics } from './bandwidthMonitor';
import { advancedPerformanceManager, AdvancedPerformanceMetrics } from './AdvancedPerformanceManager';

export interface StreamQuality {
  id: string;
  name: string;
  resolution: string;
  bitrate: number; // kbps
  fps: number;
  codec: string;
  bandwidth: number; // Required bandwidth in Mbps
  cpuUsage: number; // Estimated CPU usage percentage
  memoryUsage: number; // Estimated memory usage in MB
}

export interface QualityProfile {
  qualities: StreamQuality[];
  adaptationAlgorithm: 'conservative' | 'aggressive' | 'ml_based' | 'custom';
  bufferTarget: number; // seconds
  maxBufferSize: number; // seconds
  switchThreshold: number; // percentage change required for switch
  cooldownPeriod: number; // milliseconds between switches
}

export interface AdaptationMetrics {
  timestamp: number;
  streamId: string;
  currentQuality: string;
  targetQuality: string;
  bandwidth: number;
  bufferHealth: number;
  qualityScore: number;
  userSatisfaction: number;
  switchReason: string;
  switchSuccess: boolean;
  rebufferingEvents: number;
  averageBitrate: number;
  qualityVariations: number;
}

export interface PredictiveModel {
  // Quality prediction weights
  bandwidthWeight: number;
  bufferWeight: number;
  deviceWeight: number;
  historyWeight: number;
  userPreferenceWeight: number;
  
  // Performance metrics
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  
  // Training data
  trainingSize: number;
  lastUpdate: number;
  
  // Hyperparameters
  learningRate: number;
  smoothingFactor: number;
  predictionHorizon: number; // seconds into the future
}

export interface QualityRecommendation {
  streamId: string;
  recommendedQuality: string;
  confidence: number;
  reasoning: string[];
  expectedImpact: {
    bufferHealth: number;
    userExperience: number;
    bandwidth: number;
    performance: number;
  };
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

export interface UserPreference {
  preferredQuality: string;
  adaptationSpeed: 'slow' | 'medium' | 'fast';
  qualityPriority: 'performance' | 'quality' | 'balanced';
  batteryMode: boolean;
  dataUsageLimit: number; // MB per hour
  qualityConsistency: number; // 0-1, higher = prefer consistent quality
}

class IntelligentQualityManager {
  private qualities: Map<string, StreamQuality> = new Map();
  private profiles: Map<string, QualityProfile> = new Map();
  private streamQualities: Map<string, string> = new Map(); // streamId -> qualityId
  private adaptationHistory: AdaptationMetrics[] = [];
  private predictiveModel: PredictiveModel;
  private userPreferences: UserPreference;
  private listeners = new Set<(metrics: AdaptationMetrics) => void>();
  
  // Buffer and performance tracking
  private bufferStates: Map<string, number> = new Map(); // streamId -> buffer seconds
  private rebufferingEvents: Map<string, number> = new Map(); // streamId -> count
  private qualityVariations: Map<string, number> = new Map(); // streamId -> count
  private lastQualitySwitch: Map<string, number> = new Map(); // streamId -> timestamp
  
  // ML training data
  private trainingData: Array<{
    input: {
      bandwidth: number;
      bufferHealth: number;
      cpuUsage: number;
      memoryUsage: number;
      thermalState: number;
      userEngagement: number;
      timeOfDay: number;
      networkStability: number;
    };
    output: {
      optimalQuality: string;
      userSatisfaction: number;
      performanceScore: number;
    };
  }> = [];
  
  // Monitoring intervals
  private adaptationInterval: NodeJS.Timeout | null = null;
  private modelUpdateInterval: NodeJS.Timeout | null = null;
  private metricsCollectionInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeQualities();
    this.initializeProfiles();
    this.initializePredictiveModel();
    this.initializeUserPreferences();
    this.startAdaptationEngine();
  }

  /**
   * Initialize available stream qualities
   */
  private initializeQualities(): void {
    const qualities: StreamQuality[] = [
      {
        id: 'source',
        name: 'Source Quality',
        resolution: '1920x1080',
        bitrate: 6000,
        fps: 60,
        codec: 'h264',
        bandwidth: 8.0,
        cpuUsage: 80,
        memoryUsage: 120
      },
      {
        id: '1080p60',
        name: '1080p 60fps',
        resolution: '1920x1080',
        bitrate: 5000,
        fps: 60,
        codec: 'h264',
        bandwidth: 6.5,
        cpuUsage: 70,
        memoryUsage: 100
      },
      {
        id: '1080p30',
        name: '1080p 30fps',
        resolution: '1920x1080',
        bitrate: 3500,
        fps: 30,
        codec: 'h264',
        bandwidth: 4.5,
        cpuUsage: 50,
        memoryUsage: 80
      },
      {
        id: '720p60',
        name: '720p 60fps',
        resolution: '1280x720',
        bitrate: 2500,
        fps: 60,
        codec: 'h264',
        bandwidth: 3.5,
        cpuUsage: 40,
        memoryUsage: 60
      },
      {
        id: '720p30',
        name: '720p 30fps',
        resolution: '1280x720',
        bitrate: 1800,
        fps: 30,
        codec: 'h264',
        bandwidth: 2.5,
        cpuUsage: 30,
        memoryUsage: 50
      },
      {
        id: '480p',
        name: '480p',
        resolution: '854x480',
        bitrate: 1000,
        fps: 30,
        codec: 'h264',
        bandwidth: 1.5,
        cpuUsage: 20,
        memoryUsage: 35
      },
      {
        id: '360p',
        name: '360p',
        resolution: '640x360',
        bitrate: 600,
        fps: 30,
        codec: 'h264',
        bandwidth: 0.8,
        cpuUsage: 15,
        memoryUsage: 25
      },
      {
        id: '160p',
        name: '160p',
        resolution: '284x160',
        bitrate: 230,
        fps: 30,
        codec: 'h264',
        bandwidth: 0.3,
        cpuUsage: 10,
        memoryUsage: 15
      }
    ];

    qualities.forEach(quality => this.qualities.set(quality.id, quality));
  }

  /**
   * Initialize quality profiles for different scenarios
   */
  private initializeProfiles(): void {
    // Standard adaptive profile
    this.profiles.set('adaptive', {
      qualities: Array.from(this.qualities.values()),
      adaptationAlgorithm: 'ml_based',
      bufferTarget: 10,
      maxBufferSize: 30,
      switchThreshold: 15,
      cooldownPeriod: 3000
    });

    // Conservative profile (fewer quality switches)
    this.profiles.set('conservative', {
      qualities: Array.from(this.qualities.values()),
      adaptationAlgorithm: 'conservative',
      bufferTarget: 15,
      maxBufferSize: 45,
      switchThreshold: 25,
      cooldownPeriod: 5000
    });

    // Aggressive profile (frequent optimization)
    this.profiles.set('aggressive', {
      qualities: Array.from(this.qualities.values()),
      adaptationAlgorithm: 'aggressive',
      bufferTarget: 5,
      maxBufferSize: 20,
      switchThreshold: 10,
      cooldownPeriod: 1500
    });

    // Performance optimized profile
    this.profiles.set('performance', {
      qualities: Array.from(this.qualities.values()).filter(q => 
        ['480p', '360p', '720p30', '720p60'].includes(q.id)
      ),
      adaptationAlgorithm: 'aggressive',
      bufferTarget: 8,
      maxBufferSize: 25,
      switchThreshold: 15,
      cooldownPeriod: 2000
    });

    // Quality focused profile
    this.profiles.set('quality', {
      qualities: Array.from(this.qualities.values()).filter(q => 
        ['720p30', '720p60', '1080p30', '1080p60', 'source'].includes(q.id)
      ),
      adaptationAlgorithm: 'conservative',
      bufferTarget: 20,
      maxBufferSize: 60,
      switchThreshold: 30,
      cooldownPeriod: 8000
    });
  }

  /**
   * Initialize ML-based predictive model
   */
  private initializePredictiveModel(): void {
    this.predictiveModel = {
      bandwidthWeight: 0.35,
      bufferWeight: 0.25,
      deviceWeight: 0.20,
      historyWeight: 0.15,
      userPreferenceWeight: 0.05,
      
      accuracy: 0.0,
      precision: 0.0,
      recall: 0.0,
      f1Score: 0.0,
      
      trainingSize: 0,
      lastUpdate: Date.now(),
      
      learningRate: 0.01,
      smoothingFactor: 0.8,
      predictionHorizon: 10
    };
  }

  /**
   * Initialize default user preferences
   */
  private initializeUserPreferences(): void {
    this.userPreferences = {
      preferredQuality: '720p60',
      adaptationSpeed: 'medium',
      qualityPriority: 'balanced',
      batteryMode: false,
      dataUsageLimit: 1024, // 1GB per hour
      qualityConsistency: 0.7
    };
  }

  /**
   * Start adaptive streaming engine
   */
  private startAdaptationEngine(): void {
    // Main adaptation loop
    this.adaptationInterval = setInterval(() => {
      this.performAdaptation();
    }, 1000);

    // Model updates
    this.modelUpdateInterval = setInterval(() => {
      this.updatePredictiveModel();
    }, 30000);

    // Metrics collection
    this.metricsCollectionInterval = setInterval(() => {
      this.collectQualityMetrics();
    }, 5000);

    logDebug('Intelligent Quality Manager started');
  }

  /**
   * Perform intelligent quality adaptation for all active streams
   */
  private async performAdaptation(): Promise<void> {
    try {
      const activeStreams = Array.from(this.streamQualities.keys());
      
      for (const streamId of activeStreams) {
        const recommendation = await this.generateQualityRecommendation(streamId);
        
        if (recommendation && this.shouldApplyRecommendation(recommendation)) {
          await this.applyQualityChange(streamId, recommendation);
        }
      }
    } catch (error) {
      logError('Adaptation cycle failed', error as Error);
    }
  }

  /**
   * Generate quality recommendation using ML model
   */
  private async generateQualityRecommendation(streamId: string): Promise<QualityRecommendation | null> {
    try {
      const currentQuality = this.streamQualities.get(streamId);
      if (!currentQuality) return null;

      const bandwidthMetrics = bandwidthMonitor.getCurrentMetrics();
      const performanceMetrics = advancedPerformanceManager.getCurrentMetrics();
      
      if (!bandwidthMetrics || !performanceMetrics) return null;

      // Prepare input features for ML model
      const features = this.extractFeatures(streamId, bandwidthMetrics, performanceMetrics);
      
      // Generate recommendations using different algorithms
      const mlRecommendation = this.generateMLRecommendation(features, currentQuality);
      const ruleBasedRecommendation = this.generateRuleBasedRecommendation(features, currentQuality);
      
      // Combine recommendations with confidence weighting
      const finalRecommendation = this.combineRecommendations(
        mlRecommendation, 
        ruleBasedRecommendation, 
        streamId
      );

      return finalRecommendation;

    } catch (error) {
      logError('Quality recommendation generation failed', error as Error);
      return null;
    }
  }

  /**
   * Extract features for ML model
   */
  private extractFeatures(
    streamId: string, 
    bandwidth: BandwidthMetrics, 
    performance: AdvancedPerformanceMetrics
  ): any {
    const bufferHealth = this.bufferStates.get(streamId) || 0;
    const networkStability = bandwidth.isStable ? 1 : 0;
    const thermalStateMap = { normal: 0, fair: 0.33, serious: 0.66, critical: 1 };
    
    return {
      bandwidth: bandwidth.downloadSpeed,
      bufferHealth: Math.min(bufferHealth / 30, 1), // Normalize to 0-1
      cpuUsage: performance.cpuUsage / 100,
      memoryUsage: performance.memoryUsage / 1024, // GB
      thermalState: thermalStateMap[performance.thermalState] || 0,
      userEngagement: performance.userEngagementScore,
      timeOfDay: (new Date().getHours()) / 24,
      networkStability,
      latency: Math.min(bandwidth.latency / 500, 1), // Normalize
      jitter: Math.min(bandwidth.jitter / 100, 1), // Normalize
      batteryLevel: (performance.batteryLevel || 100) / 100,
      isCharging: performance.isCharging ? 1 : 0,
      activeStreams: performance.activeStreams,
      deviceClass: this.getDeviceClassScore(performance.deviceClass)
    };
  }

  /**
   * Generate ML-based recommendation
   */
  private generateMLRecommendation(features: any, currentQuality: string): QualityRecommendation {
    // Simplified ML scoring - in production, this would use a trained model
    const availableQualities = Array.from(this.qualities.values())
      .sort((a, b) => b.bitrate - a.bitrate);

    let bestQuality = currentQuality;
    let bestScore = 0;
    const reasoning: string[] = [];

    for (const quality of availableQualities) {
      const score = this.calculateQualityScore(quality, features);
      
      if (score > bestScore) {
        bestScore = score;
        bestQuality = quality.id;
      }
    }

    // Generate reasoning
    if (features.bandwidth < 2) {
      reasoning.push('Low bandwidth detected');
    }
    if (features.cpuUsage > 0.8) {
      reasoning.push('High CPU usage detected');
    }
    if (features.bufferHealth < 0.3) {
      reasoning.push('Buffer health is low');
    }
    if (features.batteryLevel < 0.2 && !features.isCharging) {
      reasoning.push('Battery level is low');
    }

    return {
      streamId: '',
      recommendedQuality: bestQuality,
      confidence: Math.min(bestScore, 1),
      reasoning,
      expectedImpact: this.calculateExpectedImpact(currentQuality, bestQuality),
      urgency: this.calculateUrgency(features)
    };
  }

  /**
   * Calculate quality score for ML recommendation
   */
  private calculateQualityScore(quality: StreamQuality, features: any): number {
    let score = 0;

    // Bandwidth compatibility
    const bandwidthRatio = features.bandwidth / quality.bandwidth;
    if (bandwidthRatio >= 1.5) {
      score += 0.4; // Excellent bandwidth
    } else if (bandwidthRatio >= 1.2) {
      score += 0.3; // Good bandwidth
    } else if (bandwidthRatio >= 1.0) {
      score += 0.2; // Adequate bandwidth
    } else {
      score -= 0.3; // Insufficient bandwidth
    }

    // Device performance compatibility
    const cpuScore = Math.max(0, 1 - (quality.cpuUsage / 100) / (1 - features.cpuUsage));
    const memoryScore = Math.max(0, 1 - (quality.memoryUsage / 1024) / (1 - features.memoryUsage / 1024));
    score += (cpuScore + memoryScore) * 0.15;

    // Buffer health consideration
    if (features.bufferHealth > 0.8) {
      score += 0.1; // Good buffer allows higher quality
    } else if (features.bufferHealth < 0.3) {
      score -= 0.2; // Poor buffer requires lower quality
    }

    // User preferences
    const preferredQuality = this.qualities.get(this.userPreferences.preferredQuality);
    if (preferredQuality && quality.bitrate <= preferredQuality.bitrate * 1.2) {
      score += 0.1;
    }

    // Battery considerations
    if (features.batteryLevel < 0.2 && !features.isCharging) {
      score -= (quality.cpuUsage / 100) * 0.2;
    }

    // Network stability
    if (!features.networkStability) {
      score -= 0.1;
    }

    return Math.max(0, score);
  }

  /**
   * Generate rule-based recommendation for fallback
   */
  private generateRuleBasedRecommendation(features: any, currentQuality: string): QualityRecommendation {
    let recommendedQuality = currentQuality;
    const reasoning: string[] = [];

    // Simple rule-based logic
    if (features.bandwidth < 1) {
      recommendedQuality = '360p';
      reasoning.push('Very low bandwidth - switching to 360p');
    } else if (features.bandwidth < 2) {
      recommendedQuality = '480p';
      reasoning.push('Low bandwidth - switching to 480p');
    } else if (features.bandwidth < 3.5) {
      recommendedQuality = '720p30';
      reasoning.push('Moderate bandwidth - switching to 720p 30fps');
    } else if (features.bandwidth < 6) {
      recommendedQuality = '720p60';
      reasoning.push('Good bandwidth - switching to 720p 60fps');
    } else {
      recommendedQuality = '1080p60';
      reasoning.push('Excellent bandwidth - switching to 1080p 60fps');
    }

    // CPU override
    if (features.cpuUsage > 0.85) {
      const currentQualityObj = this.qualities.get(recommendedQuality);
      const lowerQualities = Array.from(this.qualities.values())
        .filter(q => q.cpuUsage < (currentQualityObj?.cpuUsage || 100))
        .sort((a, b) => b.cpuUsage - a.cpuUsage);
      
      if (lowerQualities.length > 0) {
        recommendedQuality = lowerQualities[0].id;
        reasoning.push('High CPU usage - reducing quality');
      }
    }

    return {
      streamId: '',
      recommendedQuality,
      confidence: 0.7,
      reasoning,
      expectedImpact: this.calculateExpectedImpact(currentQuality, recommendedQuality),
      urgency: this.calculateUrgency(features)
    };
  }

  /**
   * Combine ML and rule-based recommendations
   */
  private combineRecommendations(
    mlRec: QualityRecommendation,
    ruleRec: QualityRecommendation,
    streamId: string
  ): QualityRecommendation {
    // Weight based on model confidence and accuracy
    const mlWeight = this.predictiveModel.accuracy > 0.7 ? 0.7 : 0.3;
    const ruleWeight = 1 - mlWeight;

    // For simplicity, choose the higher confidence recommendation
    const selectedRec = mlRec.confidence > ruleRec.confidence ? mlRec : ruleRec;
    
    return {
      ...selectedRec,
      streamId,
      confidence: (mlRec.confidence * mlWeight) + (ruleRec.confidence * ruleWeight),
      reasoning: [...mlRec.reasoning, ...ruleRec.reasoning].filter((r, i, arr) => arr.indexOf(r) === i)
    };
  }

  /**
   * Calculate expected impact of quality change
   */
  private calculateExpectedImpact(fromQuality: string, toQuality: string): any {
    const from = this.qualities.get(fromQuality);
    const to = this.qualities.get(toQuality);
    
    if (!from || !to) {
      return { bufferHealth: 0, userExperience: 0, bandwidth: 0, performance: 0 };
    }

    const bitrateChange = (to.bitrate - from.bitrate) / from.bitrate;
    const cpuChange = (to.cpuUsage - from.cpuUsage) / from.cpuUsage;
    const memoryChange = (to.memoryUsage - from.memoryUsage) / from.memoryUsage;

    return {
      bufferHealth: -bitrateChange * 0.5, // Higher bitrate = more buffer pressure
      userExperience: bitrateChange * 0.3, // Higher bitrate = better experience
      bandwidth: bitrateChange, // Direct correlation
      performance: -(cpuChange + memoryChange) * 0.5 // Higher usage = worse performance
    };
  }

  /**
   * Calculate urgency level
   */
  private calculateUrgency(features: any): 'low' | 'medium' | 'high' | 'critical' {
    if (features.bufferHealth < 0.1 || features.cpuUsage > 0.95) {
      return 'critical';
    }
    if (features.bufferHealth < 0.3 || features.cpuUsage > 0.8 || features.bandwidth < 0.5) {
      return 'high';
    }
    if (features.bufferHealth < 0.6 || features.cpuUsage > 0.6) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Check if recommendation should be applied
   */
  private shouldApplyRecommendation(recommendation: QualityRecommendation): boolean {
    const streamId = recommendation.streamId;
    const currentQuality = this.streamQualities.get(streamId);
    
    // Don't switch if already at recommended quality
    if (currentQuality === recommendation.recommendedQuality) {
      return false;
    }

    // Check cooldown period
    const lastSwitch = this.lastQualitySwitch.get(streamId) || 0;
    const profile = this.profiles.get('adaptive') || this.profiles.values().next().value;
    
    if (Date.now() - lastSwitch < profile.cooldownPeriod) {
      return false;
    }

    // Check confidence threshold
    if (recommendation.confidence < 0.5) {
      return false;
    }

    // Apply urgency-based override
    if (recommendation.urgency === 'critical') {
      return true;
    }

    // Check switch threshold
    const currentQualityObj = this.qualities.get(currentQuality || '');
    const recommendedQualityObj = this.qualities.get(recommendation.recommendedQuality);
    
    if (currentQualityObj && recommendedQualityObj) {
      const bitrateChange = Math.abs(recommendedQualityObj.bitrate - currentQualityObj.bitrate) / currentQualityObj.bitrate;
      if (bitrateChange < profile.switchThreshold / 100) {
        return false;
      }
    }

    return true;
  }

  /**
   * Apply quality change to stream
   */
  private async applyQualityChange(streamId: string, recommendation: QualityRecommendation): Promise<void> {
    try {
      const oldQuality = this.streamQualities.get(streamId);
      
      // Update quality mapping
      this.streamQualities.set(streamId, recommendation.recommendedQuality);
      this.lastQualitySwitch.set(streamId, Date.now());
      
      // Increment quality variations counter
      const variations = this.qualityVariations.get(streamId) || 0;
      this.qualityVariations.set(streamId, variations + 1);

      // Record adaptation metrics
      const metrics: AdaptationMetrics = {
        timestamp: Date.now(),
        streamId,
        currentQuality: oldQuality || '',
        targetQuality: recommendation.recommendedQuality,
        bandwidth: bandwidthMonitor.getCurrentMetrics()?.downloadSpeed || 0,
        bufferHealth: this.bufferStates.get(streamId) || 0,
        qualityScore: recommendation.confidence,
        userSatisfaction: this.calculateUserSatisfaction(recommendation),
        switchReason: recommendation.reasoning.join(', '),
        switchSuccess: true, // Would be updated based on actual result
        rebufferingEvents: this.rebufferingEvents.get(streamId) || 0,
        averageBitrate: this.qualities.get(recommendation.recommendedQuality)?.bitrate || 0,
        qualityVariations: this.qualityVariations.get(streamId) || 0
      };

      this.adaptationHistory.push(metrics);
      this.notifyListeners(metrics);

      // Collect training data
      this.collectTrainingData(streamId, recommendation);

      logDebug('Quality adaptation applied', {
        streamId,
        from: oldQuality,
        to: recommendation.recommendedQuality,
        confidence: recommendation.confidence,
        reasoning: recommendation.reasoning
      });

    } catch (error) {
      logError('Quality change application failed', error as Error);
    }
  }

  /**
   * Calculate user satisfaction score
   */
  private calculateUserSatisfaction(recommendation: QualityRecommendation): number {
    // Simplified satisfaction calculation
    let satisfaction = recommendation.confidence;
    
    // Adjust based on quality preference
    const recommendedQuality = this.qualities.get(recommendation.recommendedQuality);
    const preferredQuality = this.qualities.get(this.userPreferences.preferredQuality);
    
    if (recommendedQuality && preferredQuality) {
      const qualityRatio = recommendedQuality.bitrate / preferredQuality.bitrate;
      satisfaction *= Math.min(1, qualityRatio);
    }

    return Math.max(0, Math.min(1, satisfaction));
  }

  /**
   * Collect training data for ML model
   */
  private collectTrainingData(streamId: string, recommendation: QualityRecommendation): void {
    const bandwidthMetrics = bandwidthMonitor.getCurrentMetrics();
    const performanceMetrics = advancedPerformanceManager.getCurrentMetrics();
    
    if (!bandwidthMetrics || !performanceMetrics) return;

    const features = this.extractFeatures(streamId, bandwidthMetrics, performanceMetrics);
    
    this.trainingData.push({
      input: features,
      output: {
        optimalQuality: recommendation.recommendedQuality,
        userSatisfaction: this.calculateUserSatisfaction(recommendation),
        performanceScore: recommendation.confidence
      }
    });

    // Limit training data size
    if (this.trainingData.length > 1000) {
      this.trainingData.shift();
    }
  }

  /**
   * Update predictive model with new training data
   */
  private updatePredictiveModel(): void {
    if (this.trainingData.length < 50) return;

    try {
      // Simplified model update - in production, use proper ML algorithms
      const recentData = this.trainingData.slice(-100);
      
      // Calculate accuracy based on recent predictions vs actual outcomes
      let correctPredictions = 0;
      let totalPredictions = recentData.length;
      
      for (const data of recentData) {
        // Simplified accuracy calculation
        if (data.output.performanceScore > 0.7) {
          correctPredictions++;
        }
      }
      
      this.predictiveModel.accuracy = correctPredictions / totalPredictions;
      this.predictiveModel.trainingSize = this.trainingData.length;
      this.predictiveModel.lastUpdate = Date.now();
      
      // Update feature weights based on correlation analysis
      this.updateFeatureWeights(recentData);
      
      logDebug('Predictive model updated', {
        accuracy: this.predictiveModel.accuracy,
        trainingSize: this.predictiveModel.trainingSize
      });

    } catch (error) {
      logError('Model update failed', error as Error);
    }
  }

  /**
   * Update feature weights based on performance correlation
   */
  private updateFeatureWeights(trainingData: typeof this.trainingData): void {
    // Simplified weight adjustment based on feature importance
    const correlations = {
      bandwidth: 0,
      buffer: 0,
      device: 0,
      history: 0,
      user: 0
    };

    // Calculate feature correlations with successful outcomes
    trainingData.forEach(data => {
      if (data.output.performanceScore > 0.8) {
        correlations.bandwidth += data.input.bandwidth;
        correlations.buffer += data.input.bufferHealth;
        correlations.device += (1 - data.input.cpuUsage) + (1 - data.input.memoryUsage);
        correlations.user += data.output.userSatisfaction;
      }
    });

    // Normalize and update weights
    const total = Object.values(correlations).reduce((sum, val) => sum + val, 0);
    if (total > 0) {
      this.predictiveModel.bandwidthWeight = Math.max(0.1, correlations.bandwidth / total);
      this.predictiveModel.bufferWeight = Math.max(0.1, correlations.buffer / total);
      this.predictiveModel.deviceWeight = Math.max(0.1, correlations.device / total);
      this.predictiveModel.userPreferenceWeight = Math.max(0.05, correlations.user / total);
      
      // Normalize to sum to 1
      const weightSum = this.predictiveModel.bandwidthWeight + this.predictiveModel.bufferWeight + 
                       this.predictiveModel.deviceWeight + this.predictiveModel.userPreferenceWeight;
      this.predictiveModel.historyWeight = Math.max(0.05, 1 - weightSum);
    }
  }

  /**
   * Collect quality metrics for monitoring
   */
  private collectQualityMetrics(): void {
    // Collect buffer states, rebuffering events, etc.
    // This would integrate with actual video players
  }

  /**
   * Utility methods
   */
  private getDeviceClassScore(deviceClass: string): number {
    const scores = { 'high-end': 1, 'mid-range': 0.6, 'low-end': 0.3, 'unknown': 0.5 };
    return scores[deviceClass as keyof typeof scores] || 0.5;
  }

  private notifyListeners(metrics: AdaptationMetrics): void {
    for (const listener of this.listeners) {
      try {
        listener(metrics);
      } catch (error) {
        logError('Error in adaptation listener', error as Error);
      }
    }
  }

  // Public API methods
  public setStreamQuality(streamId: string, qualityId: string): void {
    if (this.qualities.has(qualityId)) {
      this.streamQualities.set(streamId, qualityId);
      this.lastQualitySwitch.set(streamId, Date.now());
    }
  }

  public getStreamQuality(streamId: string): StreamQuality | null {
    const qualityId = this.streamQualities.get(streamId);
    return qualityId ? this.qualities.get(qualityId) || null : null;
  }

  public updateUserPreferences(preferences: Partial<UserPreference>): void {
    this.userPreferences = { ...this.userPreferences, ...preferences };
    logDebug('User preferences updated', preferences);
  }

  public getAdaptationHistory(streamId?: string): AdaptationMetrics[] {
    return streamId 
      ? this.adaptationHistory.filter(m => m.streamId === streamId)
      : [...this.adaptationHistory];
  }

  public getPredictiveModelStats(): PredictiveModel {
    return { ...this.predictiveModel };
  }

  public getAvailableQualities(): StreamQuality[] {
    return Array.from(this.qualities.values());
  }

  public onAdaptationUpdate(listener: (metrics: AdaptationMetrics) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public destroy(): void {
    if (this.adaptationInterval) clearInterval(this.adaptationInterval);
    if (this.modelUpdateInterval) clearInterval(this.modelUpdateInterval);
    if (this.metricsCollectionInterval) clearInterval(this.metricsCollectionInterval);
    
    this.listeners.clear();
    logDebug('Intelligent Quality Manager destroyed');
  }
}

// Export singleton instance
export const intelligentQualityManager = new IntelligentQualityManager();

// Helper functions
export const setStreamQuality = (streamId: string, qualityId: string) =>
  intelligentQualityManager.setStreamQuality(streamId, qualityId);

export const getStreamQuality = (streamId: string) =>
  intelligentQualityManager.getStreamQuality(streamId);

export const updateQualityPreferences = (preferences: Partial<UserPreference>) =>
  intelligentQualityManager.updateUserPreferences(preferences);

export const getQualityAdaptationHistory = (streamId?: string) =>
  intelligentQualityManager.getAdaptationHistory(streamId);