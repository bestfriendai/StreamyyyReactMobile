import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';
import { Platform } from 'react-native';
import { performanceMonitor } from '../utils/performanceMonitor';

export interface DataUsageSettings {
  enabled: boolean;
  dataLimitMB: number; // Monthly data limit in MB
  warningThresholdPercent: number; // Warning at X% of limit
  criticalThresholdPercent: number; // Critical at X% of limit
  enableBackgroundRestriction: boolean;
  enableVideoCompression: boolean;
  enableImageCompression: boolean;
  enableAudioCompression: boolean;
  enableCaching: boolean;
  maxCacheSizeMB: number;
  compressOnCellular: boolean;
  blockLargeDownloadsOnCellular: boolean;
  maxDownloadSizeMBOnCellular: number;
  enableDataSaver: boolean;
  preloadOnWiFiOnly: boolean;
  enableOfflineMode: boolean;
  smartBandwidthAdaptation: boolean;
  prioritizeQuality: boolean; // false = prioritize data savings
}

export interface DataUsageStats {
  currentUsageMB: number;
  dailyUsageMB: number;
  weeklyUsageMB: number;
  monthlyUsageMB: number;
  backgroundUsageMB: number;
  foregroundUsageMB: number;
  streamingUsageMB: number;
  downloadUsageMB: number;
  cacheUsageMB: number;
  lastResetDate: string;
  averageDailyUsageMB: number;
  projectedMonthlyUsageMB: number;
  usageByCategory: {
    video: number;
    audio: number;
    images: number;
    metadata: number;
    other: number;
  };
  usageByQuality: {
    '4K': number;
    '1080p': number;
    '720p': number;
    '480p': number;
    '360p': number;
  };
  savingsMB: number; // Data saved through optimizations
}

export interface CompressionConfig {
  video: {
    enabled: boolean;
    quality: 'ultra' | 'high' | 'medium' | 'low' | 'minimal';
    bitrate: number; // kbps
    resolution: 'original' | '1080p' | '720p' | '480p' | '360p';
    framerate: number; // fps
    codec: 'h264' | 'h265' | 'vp9' | 'av1';
    adaptiveBitrate: boolean;
  };
  audio: {
    enabled: boolean;
    quality: 'lossless' | 'high' | 'medium' | 'low' | 'minimal';
    bitrate: number; // kbps
    sampleRate: number; // Hz
    channels: 1 | 2; // mono or stereo
    codec: 'aac' | 'mp3' | 'opus' | 'flac';
    enableNormalization: boolean;
  };
  images: {
    enabled: boolean;
    quality: number; // 0-100
    format: 'webp' | 'jpeg' | 'png' | 'avif';
    maxWidth: number;
    maxHeight: number;
    enableProgressiveJPEG: boolean;
    stripMetadata: boolean;
  };
}

export interface BandwidthInfo {
  downloadSpeedMbps: number;
  uploadSpeedMbps: number;
  latencyMs: number;
  networkType: 'wifi' | 'cellular' | 'ethernet' | 'unknown';
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
  isMetered: boolean;
  signalStrength: number; // 0-100
  lastUpdated: number;
}

export interface OptimizationStrategy {
  id: string;
  name: string;
  description: string;
  dataSavingPercent: number;
  qualityImpact: 'none' | 'minimal' | 'moderate' | 'significant';
  applicableNetworks: ('wifi' | 'cellular')[];
  triggers: {
    dataUsagePercent?: number;
    bandwidthMbps?: number;
    batteryPercent?: number;
    networkType?: 'wifi' | 'cellular';
  };
  optimizations: {
    videoQuality?: string;
    audioQuality?: string;
    imageQuality?: number;
    cacheSize?: number;
    prefetchingEnabled?: boolean;
    backgroundSyncEnabled?: boolean;
  };
}

class DataOptimizationService {
  private static instance: DataOptimizationService;
  private settings: DataUsageSettings;
  private stats: DataUsageStats;
  private compressionConfig: CompressionConfig;
  private bandwidthInfo: BandwidthInfo;
  private strategies: OptimizationStrategy[];
  private activeStrategy: OptimizationStrategy | null = null;
  private compressionWorkers: Map<string, Worker> = new Map();
  private bandwidthMonitorInterval: NodeJS.Timeout | null = null;
  private usageResetInterval: NodeJS.Timeout | null = null;
  private optimizationTimers: Map<string, NodeJS.Timeout> = new Map();
  private networkChangeListener: any = null;
  private isMonitoring: boolean = false;
  private dataBuffer: Map<string, number> = new Map(); // Temporary data usage buffer

  private defaultSettings: DataUsageSettings = {
    enabled: true,
    dataLimitMB: 5000, // 5GB monthly limit
    warningThresholdPercent: 80,
    criticalThresholdPercent: 95,
    enableBackgroundRestriction: true,
    enableVideoCompression: true,
    enableImageCompression: true,
    enableAudioCompression: true,
    enableCaching: true,
    maxCacheSizeMB: 500,
    compressOnCellular: true,
    blockLargeDownloadsOnCellular: true,
    maxDownloadSizeMBOnCellular: 100,
    enableDataSaver: false,
    preloadOnWiFiOnly: true,
    enableOfflineMode: false,
    smartBandwidthAdaptation: true,
    prioritizeQuality: false,
  };

  private defaultCompressionConfig: CompressionConfig = {
    video: {
      enabled: true,
      quality: 'medium',
      bitrate: 2000,
      resolution: '720p',
      framerate: 30,
      codec: 'h264',
      adaptiveBitrate: true,
    },
    audio: {
      enabled: true,
      quality: 'medium',
      bitrate: 128,
      sampleRate: 44100,
      channels: 2,
      codec: 'aac',
      enableNormalization: true,
    },
    images: {
      enabled: true,
      quality: 80,
      format: 'webp',
      maxWidth: 1920,
      maxHeight: 1080,
      enableProgressiveJPEG: true,
      stripMetadata: true,
    },
  };

  private builtInStrategies: OptimizationStrategy[] = [
    {
      id: 'data_saver',
      name: 'Data Saver',
      description: 'Aggressive data savings with quality trade-offs',
      dataSavingPercent: 60,
      qualityImpact: 'significant',
      applicableNetworks: ['cellular'],
      triggers: {
        dataUsagePercent: 80,
        networkType: 'cellular',
      },
      optimizations: {
        videoQuality: '360p',
        audioQuality: 'low',
        imageQuality: 60,
        cacheSize: 50,
        prefetchingEnabled: false,
        backgroundSyncEnabled: false,
      },
    },
    {
      id: 'balanced',
      name: 'Balanced',
      description: 'Good balance between quality and data usage',
      dataSavingPercent: 30,
      qualityImpact: 'moderate',
      applicableNetworks: ['cellular'],
      triggers: {
        dataUsagePercent: 60,
        bandwidthMbps: 5,
      },
      optimizations: {
        videoQuality: '720p',
        audioQuality: 'medium',
        imageQuality: 75,
        cacheSize: 200,
        prefetchingEnabled: true,
        backgroundSyncEnabled: true,
      },
    },
    {
      id: 'quality_first',
      name: 'Quality First',
      description: 'Prioritize quality over data savings',
      dataSavingPercent: 10,
      qualityImpact: 'minimal',
      applicableNetworks: ['wifi', 'cellular'],
      triggers: {
        networkType: 'wifi',
      },
      optimizations: {
        videoQuality: '1080p',
        audioQuality: 'high',
        imageQuality: 90,
        cacheSize: 500,
        prefetchingEnabled: true,
        backgroundSyncEnabled: true,
      },
    },
    {
      id: 'low_bandwidth',
      name: 'Low Bandwidth',
      description: 'Optimized for slow connections',
      dataSavingPercent: 50,
      qualityImpact: 'moderate',
      applicableNetworks: ['cellular'],
      triggers: {
        bandwidthMbps: 2,
      },
      optimizations: {
        videoQuality: '480p',
        audioQuality: 'medium',
        imageQuality: 70,
        cacheSize: 100,
        prefetchingEnabled: false,
        backgroundSyncEnabled: false,
      },
    },
    {
      id: 'emergency',
      name: 'Emergency Mode',
      description: 'Minimal data usage for critical functions only',
      dataSavingPercent: 80,
      qualityImpact: 'significant',
      applicableNetworks: ['cellular'],
      triggers: {
        dataUsagePercent: 95,
      },
      optimizations: {
        videoQuality: '240p',
        audioQuality: 'minimal',
        imageQuality: 50,
        cacheSize: 25,
        prefetchingEnabled: false,
        backgroundSyncEnabled: false,
      },
    },
  ];

  private constructor() {
    this.settings = { ...this.defaultSettings };
    this.compressionConfig = JSON.parse(JSON.stringify(this.defaultCompressionConfig));
    this.stats = this.getInitialStats();
    this.bandwidthInfo = this.getInitialBandwidthInfo();
    this.strategies = [...this.builtInStrategies];
    this.initializeService();
  }

  static getInstance(): DataOptimizationService {
    if (!DataOptimizationService.instance) {
      DataOptimizationService.instance = new DataOptimizationService();
    }
    return DataOptimizationService.instance;
  }

  private async initializeService(): Promise<void> {
    try {
      console.log('📊 Initializing data optimization service...');
      
      await this.loadSettings();
      await this.loadStats();
      await this.loadCompressionConfig();
      
      if (this.settings.enabled) {
        await this.startMonitoring();
      }
      
      console.log('✅ Data optimization service initialized');
    } catch (error) {
      console.error('❌ Data optimization service initialization failed:', error);
    }
  }

  private getInitialStats(): DataUsageStats {
    const now = new Date();
    return {
      currentUsageMB: 0,
      dailyUsageMB: 0,
      weeklyUsageMB: 0,
      monthlyUsageMB: 0,
      backgroundUsageMB: 0,
      foregroundUsageMB: 0,
      streamingUsageMB: 0,
      downloadUsageMB: 0,
      cacheUsageMB: 0,
      lastResetDate: now.toISOString(),
      averageDailyUsageMB: 0,
      projectedMonthlyUsageMB: 0,
      usageByCategory: {
        video: 0,
        audio: 0,
        images: 0,
        metadata: 0,
        other: 0,
      },
      usageByQuality: {
        '4K': 0,
        '1080p': 0,
        '720p': 0,
        '480p': 0,
        '360p': 0,
      },
      savingsMB: 0,
    };
  }

  private getInitialBandwidthInfo(): BandwidthInfo {
    return {
      downloadSpeedMbps: 10,
      uploadSpeedMbps: 5,
      latencyMs: 50,
      networkType: 'wifi',
      connectionQuality: 'good',
      isMetered: false,
      signalStrength: 100,
      lastUpdated: Date.now(),
    };
  }

  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) return;

    try {
      this.isMonitoring = true;
      console.log('📊 Starting data optimization monitoring...');
      
      // Monitor bandwidth changes
      this.startBandwidthMonitoring();
      
      // Setup network change listener
      this.setupNetworkChangeListener();
      
      // Setup usage reset scheduler
      this.setupUsageResetScheduler();
      
      // Start optimization strategy evaluation
      this.startStrategyEvaluation();
      
      console.log('✅ Data optimization monitoring started');
    } catch (error) {
      console.error('❌ Failed to start data monitoring:', error);
      this.isMonitoring = false;
    }
  }

  async stopMonitoring(): Promise<void> {
    if (!this.isMonitoring) return;

    try {
      this.isMonitoring = false;
      
      // Clear all intervals and listeners
      if (this.bandwidthMonitorInterval) {
        clearInterval(this.bandwidthMonitorInterval);
        this.bandwidthMonitorInterval = null;
      }
      
      if (this.usageResetInterval) {
        clearInterval(this.usageResetInterval);
        this.usageResetInterval = null;
      }
      
      if (this.networkChangeListener) {
        this.networkChangeListener.remove();
        this.networkChangeListener = null;
      }
      
      // Clear optimization timers
      this.optimizationTimers.forEach(timer => clearTimeout(timer));
      this.optimizationTimers.clear();
      
      console.log('📊 Data optimization monitoring stopped');
    } catch (error) {
      console.error('❌ Failed to stop data monitoring:', error);
    }
  }

  private async startBandwidthMonitoring(): Promise<void> {
    try {
      // Initial bandwidth measurement
      await this.measureBandwidth();
      
      // Setup periodic bandwidth monitoring
      this.bandwidthMonitorInterval = setInterval(async () => {
        await this.measureBandwidth();
        await this.evaluateOptimizationStrategy();
      }, 30000); // Every 30 seconds
      
    } catch (error) {
      console.error('❌ Bandwidth monitoring setup failed:', error);
    }
  }

  private setupNetworkChangeListener(): void {
    try {
      // Listen for network state changes
      this.networkChangeListener = Network.addNetworkStateListener((state) => {
        this.handleNetworkChange(state);
      });
    } catch (error) {
      console.error('❌ Network change listener setup failed:', error);
    }
  }

  private setupUsageResetScheduler(): void {
    try {
      // Reset daily stats at midnight
      const now = new Date();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const msUntilMidnight = tomorrow.getTime() - now.getTime();
      
      setTimeout(() => {
        this.resetDailyStats();
        
        // Set up daily interval
        this.usageResetInterval = setInterval(() => {
          this.resetDailyStats();
        }, 24 * 60 * 60 * 1000); // 24 hours
      }, msUntilMidnight);
      
    } catch (error) {
      console.error('❌ Usage reset scheduler setup failed:', error);
    }
  }

  private async startStrategyEvaluation(): Promise<void> {
    try {
      // Evaluate strategy every 60 seconds
      setInterval(async () => {
        await this.evaluateOptimizationStrategy();
      }, 60000);
      
      // Initial evaluation
      await this.evaluateOptimizationStrategy();
      
    } catch (error) {
      console.error('❌ Strategy evaluation setup failed:', error);
    }
  }

  private async measureBandwidth(): Promise<void> {
    try {
      const startTime = Date.now();
      const testUrl = 'https://httpbin.org/bytes/1024'; // 1KB test file
      
      const response = await fetch(testUrl, { cache: 'no-store' });
      const endTime = Date.now();
      
      if (response.ok) {
        const duration = (endTime - startTime) / 1000; // seconds
        const sizeKB = 1; // 1KB test file
        const speedKbps = (sizeKB * 8) / duration; // kbps
        const speedMbps = speedKbps / 1000; // Mbps
        
        // Update bandwidth info
        this.bandwidthInfo = {
          ...this.bandwidthInfo,
          downloadSpeedMbps: speedMbps,
          latencyMs: endTime - startTime,
          connectionQuality: this.getConnectionQuality(speedMbps),
          lastUpdated: Date.now(),
        };
        
        console.log(`📊 Bandwidth measured: ${speedMbps.toFixed(2)} Mbps`);
      }
    } catch (error) {
      console.error('❌ Bandwidth measurement failed:', error);
      
      // Fallback to poor connection quality
      this.bandwidthInfo = {
        ...this.bandwidthInfo,
        connectionQuality: 'poor',
        lastUpdated: Date.now(),
      };
    }
  }

  private getConnectionQuality(speedMbps: number): BandwidthInfo['connectionQuality'] {
    if (speedMbps >= 25) return 'excellent';
    if (speedMbps >= 10) return 'good';
    if (speedMbps >= 3) return 'fair';
    return 'poor';
  }

  private async handleNetworkChange(networkState: any): Promise<void> {
    try {
      console.log('📡 Network state changed:', networkState);
      
      // Update network info
      this.bandwidthInfo = {
        ...this.bandwidthInfo,
        networkType: networkState.type === 'wifi' ? 'wifi' : 
                    networkState.type === 'cellular' ? 'cellular' : 'unknown',
        isMetered: networkState.isMetered || false,
        lastUpdated: Date.now(),
      };
      
      // Re-evaluate optimization strategy
      await this.evaluateOptimizationStrategy();
      
    } catch (error) {
      console.error('❌ Network change handling failed:', error);
    }
  }

  private async evaluateOptimizationStrategy(): Promise<void> {
    try {
      const currentUsagePercent = (this.stats.monthlyUsageMB / this.settings.dataLimitMB) * 100;
      
      // Find best matching strategy
      let bestStrategy: OptimizationStrategy | null = null;
      
      for (const strategy of this.strategies) {
        const triggers = strategy.triggers;
        let matches = true;
        
        // Check data usage trigger
        if (triggers.dataUsagePercent && currentUsagePercent < triggers.dataUsagePercent) {
          matches = false;
        }
        
        // Check bandwidth trigger
        if (triggers.bandwidthMbps && this.bandwidthInfo.downloadSpeedMbps > triggers.bandwidthMbps) {
          matches = false;
        }
        
        // Check network type trigger
        if (triggers.networkType && this.bandwidthInfo.networkType !== triggers.networkType) {
          matches = false;
        }
        
        // Check if strategy applies to current network
        if (!strategy.applicableNetworks.includes(this.bandwidthInfo.networkType as any)) {
          matches = false;
        }
        
        if (matches) {
          bestStrategy = strategy;
          break; // Use first matching strategy
        }
      }
      
      // Apply strategy if different from current
      if (bestStrategy && bestStrategy.id !== this.activeStrategy?.id) {
        await this.applyOptimizationStrategy(bestStrategy);
      }
      
    } catch (error) {
      console.error('❌ Strategy evaluation failed:', error);
    }
  }

  private async applyOptimizationStrategy(strategy: OptimizationStrategy): Promise<void> {
    try {
      console.log(`🎯 Applying optimization strategy: ${strategy.name}`);
      
      this.activeStrategy = strategy;
      const optimizations = strategy.optimizations;
      
      // Apply video quality optimization
      if (optimizations.videoQuality) {
        await this.updateVideoQuality(optimizations.videoQuality);
      }
      
      // Apply audio quality optimization
      if (optimizations.audioQuality) {
        await this.updateAudioQuality(optimizations.audioQuality);
      }
      
      // Apply image quality optimization
      if (optimizations.imageQuality) {
        await this.updateImageQuality(optimizations.imageQuality);
      }
      
      // Apply cache size optimization
      if (optimizations.cacheSize) {
        await this.updateCacheSize(optimizations.cacheSize);
      }
      
      // Apply prefetching settings
      if (optimizations.prefetchingEnabled !== undefined) {
        await this.updatePrefetchingEnabled(optimizations.prefetchingEnabled);
      }
      
      // Apply background sync settings
      if (optimizations.backgroundSyncEnabled !== undefined) {
        await this.updateBackgroundSyncEnabled(optimizations.backgroundSyncEnabled);
      }
      
      console.log(`✅ Strategy applied: ${strategy.name} (${strategy.dataSavingPercent}% data savings)`);
      
    } catch (error) {
      console.error(`❌ Failed to apply strategy ${strategy.name}:`, error);
    }
  }

  private async updateVideoQuality(quality: string): Promise<void> {
    console.log(`🎥 Updating video quality to: ${quality}`);
    
    // Update compression config
    this.compressionConfig.video.resolution = quality as any;
    
    // Update bitrate based on quality
    const bitrateMap = {
      '240p': 400,
      '360p': 800,
      '480p': 1200,
      '720p': 2000,
      '1080p': 4000,
      '4K': 8000,
    };
    
    this.compressionConfig.video.bitrate = bitrateMap[quality as keyof typeof bitrateMap] || 2000;
    
    await this.saveCompressionConfig();
  }

  private async updateAudioQuality(quality: string): Promise<void> {
    console.log(`🎵 Updating audio quality to: ${quality}`);
    
    this.compressionConfig.audio.quality = quality as any;
    
    // Update bitrate based on quality
    const bitrateMap = {
      minimal: 64,
      low: 96,
      medium: 128,
      high: 192,
      lossless: 320,
    };
    
    this.compressionConfig.audio.bitrate = bitrateMap[quality as keyof typeof bitrateMap] || 128;
    
    await this.saveCompressionConfig();
  }

  private async updateImageQuality(quality: number): Promise<void> {
    console.log(`🖼️ Updating image quality to: ${quality}%`);
    
    this.compressionConfig.images.quality = quality;
    await this.saveCompressionConfig();
  }

  private async updateCacheSize(sizeMB: number): Promise<void> {
    console.log(`💾 Updating cache size to: ${sizeMB}MB`);
    
    this.settings.maxCacheSizeMB = sizeMB;
    await this.saveSettings();
  }

  private async updatePrefetchingEnabled(enabled: boolean): Promise<void> {
    console.log(`⚡ Updating prefetching enabled: ${enabled}`);
    
    this.settings.preloadOnWiFiOnly = !enabled;
    await this.saveSettings();
  }

  private async updateBackgroundSyncEnabled(enabled: boolean): Promise<void> {
    console.log(`🔄 Updating background sync enabled: ${enabled}`);
    
    this.settings.enableBackgroundRestriction = !enabled;
    await this.saveSettings();
  }

  // Data Usage Tracking
  async trackDataUsage(category: keyof DataUsageStats['usageByCategory'], sizeMB: number, quality?: string): Promise<void> {
    try {
      // Update category usage
      this.stats.usageByCategory[category] += sizeMB;
      
      // Update quality usage
      if (quality && this.stats.usageByQuality[quality as keyof DataUsageStats['usageByQuality']] !== undefined) {
        this.stats.usageByQuality[quality as keyof DataUsageStats['usageByQuality']] += sizeMB;
      }
      
      // Update total usage
      this.stats.currentUsageMB += sizeMB;
      this.stats.dailyUsageMB += sizeMB;
      this.stats.weeklyUsageMB += sizeMB;
      this.stats.monthlyUsageMB += sizeMB;
      
      // Check for warnings
      const usagePercent = (this.stats.monthlyUsageMB / this.settings.dataLimitMB) * 100;
      
      if (usagePercent >= this.settings.criticalThresholdPercent) {
        console.warn(`🚨 Critical data usage: ${usagePercent.toFixed(1)}%`);
        await this.triggerEmergencyMode();
      } else if (usagePercent >= this.settings.warningThresholdPercent) {
        console.warn(`⚠️ High data usage: ${usagePercent.toFixed(1)}%`);
      }
      
      // Save updated stats
      await this.saveStats();
      
    } catch (error) {
      console.error('❌ Data usage tracking failed:', error);
    }
  }

  private async triggerEmergencyMode(): Promise<void> {
    try {
      const emergencyStrategy = this.strategies.find(s => s.id === 'emergency');
      if (emergencyStrategy) {
        await this.applyOptimizationStrategy(emergencyStrategy);
      }
    } catch (error) {
      console.error('❌ Emergency mode trigger failed:', error);
    }
  }

  // Compression Methods
  async compressVideo(
    videoData: Uint8Array,
    options?: Partial<CompressionConfig['video']>
  ): Promise<{ data: Uint8Array; originalSize: number; compressedSize: number; savings: number }> {
    try {
      const config = { ...this.compressionConfig.video, ...options };
      
      if (!config.enabled) {
        return {
          data: videoData,
          originalSize: videoData.length,
          compressedSize: videoData.length,
          savings: 0,
        };
      }
      
      console.log(`🎥 Compressing video with ${config.quality} quality...`);
      
      // Simulate video compression
      const compressionRatio = this.getCompressionRatio('video', config.quality);
      const compressedSize = Math.floor(videoData.length * compressionRatio);
      const compressedData = new Uint8Array(compressedSize);
      
      // In a real implementation, this would use native video compression
      compressedData.set(videoData.subarray(0, compressedSize));
      
      const savings = ((videoData.length - compressedSize) / videoData.length) * 100;
      
      // Track compression savings
      this.stats.savingsMB += (videoData.length - compressedSize) / (1024 * 1024);
      
      console.log(`✅ Video compressed: ${savings.toFixed(1)}% savings`);
      
      return {
        data: compressedData,
        originalSize: videoData.length,
        compressedSize,
        savings,
      };
    } catch (error) {
      console.error('❌ Video compression failed:', error);
      return {
        data: videoData,
        originalSize: videoData.length,
        compressedSize: videoData.length,
        savings: 0,
      };
    }
  }

  async compressAudio(
    audioData: Uint8Array,
    options?: Partial<CompressionConfig['audio']>
  ): Promise<{ data: Uint8Array; originalSize: number; compressedSize: number; savings: number }> {
    try {
      const config = { ...this.compressionConfig.audio, ...options };
      
      if (!config.enabled) {
        return {
          data: audioData,
          originalSize: audioData.length,
          compressedSize: audioData.length,
          savings: 0,
        };
      }
      
      console.log(`🎵 Compressing audio with ${config.quality} quality...`);
      
      // Simulate audio compression
      const compressionRatio = this.getCompressionRatio('audio', config.quality);
      const compressedSize = Math.floor(audioData.length * compressionRatio);
      const compressedData = new Uint8Array(compressedSize);
      
      // In a real implementation, this would use native audio compression
      compressedData.set(audioData.subarray(0, compressedSize));
      
      const savings = ((audioData.length - compressedSize) / audioData.length) * 100;
      
      // Track compression savings
      this.stats.savingsMB += (audioData.length - compressedSize) / (1024 * 1024);
      
      console.log(`✅ Audio compressed: ${savings.toFixed(1)}% savings`);
      
      return {
        data: compressedData,
        originalSize: audioData.length,
        compressedSize,
        savings,
      };
    } catch (error) {
      console.error('❌ Audio compression failed:', error);
      return {
        data: audioData,
        originalSize: audioData.length,
        compressedSize: audioData.length,
        savings: 0,
      };
    }
  }

  async compressImage(
    imageData: Uint8Array,
    options?: Partial<CompressionConfig['images']>
  ): Promise<{ data: Uint8Array; originalSize: number; compressedSize: number; savings: number }> {
    try {
      const config = { ...this.compressionConfig.images, ...options };
      
      if (!config.enabled) {
        return {
          data: imageData,
          originalSize: imageData.length,
          compressedSize: imageData.length,
          savings: 0,
        };
      }
      
      console.log(`🖼️ Compressing image with ${config.quality}% quality...`);
      
      // Simulate image compression
      const compressionRatio = config.quality / 100;
      const compressedSize = Math.floor(imageData.length * compressionRatio);
      const compressedData = new Uint8Array(compressedSize);
      
      // In a real implementation, this would use native image compression
      compressedData.set(imageData.subarray(0, compressedSize));
      
      const savings = ((imageData.length - compressedSize) / imageData.length) * 100;
      
      // Track compression savings
      this.stats.savingsMB += (imageData.length - compressedSize) / (1024 * 1024);
      
      console.log(`✅ Image compressed: ${savings.toFixed(1)}% savings`);
      
      return {
        data: compressedData,
        originalSize: imageData.length,
        compressedSize,
        savings,
      };
    } catch (error) {
      console.error('❌ Image compression failed:', error);
      return {
        data: imageData,
        originalSize: imageData.length,
        compressedSize: imageData.length,
        savings: 0,
      };
    }
  }

  private getCompressionRatio(type: 'video' | 'audio' | 'image', quality: string): number {
    const ratios = {
      video: {
        minimal: 0.2,
        low: 0.4,
        medium: 0.6,
        high: 0.8,
        ultra: 0.9,
      },
      audio: {
        minimal: 0.3,
        low: 0.5,
        medium: 0.7,
        high: 0.9,
        lossless: 1.0,
      },
    };
    
    return ratios[type]?.[quality as keyof typeof ratios[typeof type]] || 0.7;
  }

  // Data Statistics
  private resetDailyStats(): void {
    console.log('📅 Resetting daily data usage stats');
    
    // Calculate averages before reset
    const daysThisMonth = new Date().getDate();
    this.stats.averageDailyUsageMB = this.stats.monthlyUsageMB / daysThisMonth;
    
    // Project monthly usage
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    this.stats.projectedMonthlyUsageMB = this.stats.averageDailyUsageMB * daysInMonth;
    
    // Reset daily stats
    this.stats.dailyUsageMB = 0;
    
    // Reset weekly stats on Sunday
    if (new Date().getDay() === 0) {
      this.stats.weeklyUsageMB = 0;
    }
    
    // Reset monthly stats on the 1st
    if (new Date().getDate() === 1) {
      this.stats.monthlyUsageMB = 0;
      this.stats.usageByCategory = {
        video: 0,
        audio: 0,
        images: 0,
        metadata: 0,
        other: 0,
      };
      this.stats.usageByQuality = {
        '4K': 0,
        '1080p': 0,
        '720p': 0,
        '480p': 0,
        '360p': 0,
      };
      this.stats.savingsMB = 0;
    }
    
    this.saveStats();
  }

  // Storage Methods
  private async loadSettings(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('data_optimization_settings');
      if (stored) {
        this.settings = { ...this.defaultSettings, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('❌ Failed to load data optimization settings:', error);
    }
  }

  private async saveSettings(): Promise<void> {
    try {
      await AsyncStorage.setItem('data_optimization_settings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('❌ Failed to save data optimization settings:', error);
    }
  }

  private async loadStats(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('data_usage_stats');
      if (stored) {
        this.stats = { ...this.getInitialStats(), ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('❌ Failed to load data usage stats:', error);
    }
  }

  private async saveStats(): Promise<void> {
    try {
      await AsyncStorage.setItem('data_usage_stats', JSON.stringify(this.stats));
    } catch (error) {
      console.error('❌ Failed to save data usage stats:', error);
    }
  }

  private async loadCompressionConfig(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('compression_config');
      if (stored) {
        this.compressionConfig = { ...this.defaultCompressionConfig, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('❌ Failed to load compression config:', error);
    }
  }

  private async saveCompressionConfig(): Promise<void> {
    try {
      await AsyncStorage.setItem('compression_config', JSON.stringify(this.compressionConfig));
    } catch (error) {
      console.error('❌ Failed to save compression config:', error);
    }
  }

  // Public API
  async updateSettings(newSettings: Partial<DataUsageSettings>): Promise<void> {
    const wasEnabled = this.settings.enabled;
    this.settings = { ...this.settings, ...newSettings };
    await this.saveSettings();
    
    if (newSettings.enabled !== undefined) {
      if (newSettings.enabled && !wasEnabled) {
        await this.startMonitoring();
      } else if (!newSettings.enabled && wasEnabled) {
        await this.stopMonitoring();
      }
    }
    
    console.log('⚙️ Data optimization settings updated');
  }

  getSettings(): DataUsageSettings {
    return { ...this.settings };
  }

  getStats(): DataUsageStats {
    return { ...this.stats };
  }

  getCompressionConfig(): CompressionConfig {
    return JSON.parse(JSON.stringify(this.compressionConfig));
  }

  getBandwidthInfo(): BandwidthInfo {
    return { ...this.bandwidthInfo };
  }

  getActiveStrategy(): OptimizationStrategy | null {
    return this.activeStrategy ? { ...this.activeStrategy } : null;
  }

  getAvailableStrategies(): OptimizationStrategy[] {
    return [...this.strategies];
  }

  async updateCompressionConfig(config: Partial<CompressionConfig>): Promise<void> {
    this.compressionConfig = {
      video: { ...this.compressionConfig.video, ...config.video },
      audio: { ...this.compressionConfig.audio, ...config.audio },
      images: { ...this.compressionConfig.images, ...config.images },
    };
    await this.saveCompressionConfig();
    console.log('⚙️ Compression config updated');
  }

  async setStrategy(strategyId: string): Promise<void> {
    const strategy = this.strategies.find(s => s.id === strategyId);
    if (strategy) {
      await this.applyOptimizationStrategy(strategy);
    } else {
      throw new Error(`Strategy not found: ${strategyId}`);
    }
  }

  async resetStats(): Promise<void> {
    this.stats = this.getInitialStats();
    await this.saveStats();
    console.log('📊 Data usage stats reset');
  }

  isMonitoring(): boolean {
    return this.isMonitoring;
  }

  async cleanup(): Promise<void> {
    try {
      await this.stopMonitoring();
      await this.saveSettings();
      await this.saveStats();
      await this.saveCompressionConfig();
      console.log('💫 Data optimization service cleanup completed');
    } catch (error) {
      console.error('❌ Data optimization cleanup failed:', error);
    }
  }
}

export const dataOptimizationService = DataOptimizationService.getInstance();

// Helper functions
export const trackDataUsage = async (category: keyof DataUsageStats['usageByCategory'], sizeMB: number, quality?: string): Promise<void> => {
  await dataOptimizationService.trackDataUsage(category, sizeMB, quality);
};

export const compressData = async (data: Uint8Array, type: 'video' | 'audio' | 'image'): Promise<Uint8Array> => {
  let result;
  switch (type) {
    case 'video':
      result = await dataOptimizationService.compressVideo(data);
      break;
    case 'audio':
      result = await dataOptimizationService.compressAudio(data);
      break;
    case 'image':
      result = await dataOptimizationService.compressImage(data);
      break;
    default:
      return data;
  }
  return result.data;
};

export const getCurrentDataUsage = (): DataUsageStats => {
  return dataOptimizationService.getStats();
};

export const enableDataSaver = async (enabled: boolean): Promise<void> => {
  await dataOptimizationService.updateSettings({ enableDataSaver: enabled });
};

export default dataOptimizationService;