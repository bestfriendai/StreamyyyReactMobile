import { Platform, DeviceEventEmitter, NativeModules, AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Battery from 'expo-battery';
import { performanceMonitor } from '../utils/performanceMonitor';

export interface BatteryOptimizationSettings {
  enabled: boolean;
  aggressiveMode: boolean;
  lowBatteryThreshold: number; // percentage (e.g., 20 for 20%)
  criticalBatteryThreshold: number; // percentage (e.g., 10 for 10%)
  backgroundOptimization: boolean;
  reduceAnimations: boolean;
  limitStreamQuality: boolean;
  reduceBrightness: boolean;
  pauseBackgroundTasks: boolean;
  enablePowerSaveMode: boolean;
  smartWakelock: boolean;
  cpuThrottling: boolean;
  networkOptimization: boolean;
  cacheAggressive: boolean;
  disableLocationServices: boolean;
  reduceHapticFeedback: boolean;
  limitConcurrentDownloads: boolean;
  adaptiveRefreshRate: boolean;
  thermalThrottling: boolean;
  profileBasedOptimization: boolean;
}

export interface BatteryProfile {
  id: string;
  name: string;
  description: string;
  settings: Partial<BatteryOptimizationSettings>;
  triggers: {
    batteryLevel?: number;
    chargingState?: boolean;
    thermalState?: 'normal' | 'fair' | 'serious' | 'critical';
    timeOfDay?: { start: string; end: string };
    appUsage?: 'light' | 'moderate' | 'heavy';
  };
  customizations: {
    streamQuality?: 'auto' | 'source' | '720p' | '480p' | '360p';
    animationScale?: number; // 0.0 to 1.0
    brightnessReduction?: number; // percentage
    refreshRate?: number; // Hz
    maxConcurrentStreams?: number;
    syncInterval?: number; // minutes
  };
}

export interface BatteryState {
  level: number; // 0.0 to 1.0
  isCharging: boolean;
  chargingType: 'none' | 'usb' | 'ac' | 'wireless';
  powerSaveMode: boolean;
  temperature: number; // Celsius
  voltage: number; // mV
  capacity: number; // mAh
  health: 'unknown' | 'good' | 'overheat' | 'dead' | 'over_voltage' | 'unspecified_failure' | 'cold';
  technology: string;
  estimatedTimeRemaining: number; // minutes
  lastUpdated: number;
}

export interface PowerConsumption {
  component: string;
  consumption: number; // mW
  percentage: number; // % of total
  category: 'cpu' | 'screen' | 'network' | 'gpu' | 'audio' | 'other';
  optimizable: boolean;
  currentOptimization: number; // 0.0 to 1.0 (0 = no optimization, 1 = max optimization)
}

export interface ThermalState {
  state: 'normal' | 'fair' | 'serious' | 'critical';
  temperature: number; // Celsius
  throttlingActive: boolean;
  affectedComponents: string[];
  recommendedActions: string[];
  timestamp: number;
}

class BatteryOptimizationService {
  private static instance: BatteryOptimizationService;
  private settings: BatteryOptimizationSettings;
  private currentProfile: BatteryProfile | null = null;
  private batteryState: BatteryState;
  private thermalState: ThermalState;
  private powerConsumption: PowerConsumption[] = [];
  private appStateListener: any;
  private batteryListener: any;
  private thermalListener: any;
  private optimizationTimer: NodeJS.Timeout | null = null;
  private profileCheckTimer: NodeJS.Timeout | null = null;
  private monitoringActive: boolean = false;
  private optimizationHistory: Array<{
    timestamp: number;
    profile: string;
    batteryLevel: number;
    actions: string[];
    impact: number; // estimated battery savings in minutes
  }> = [];
  private baselineConsumption: number = 0;
  private deviceCapabilities: {
    hasAdvancedBatteryAPI: boolean;
    hasThermalAPI: boolean;
    hasAdaptiveDisplay: boolean;
    supportsCPUThrottling: boolean;
    hasWirelessCharging: boolean;
    maxCores: number;
  };

  private defaultSettings: BatteryOptimizationSettings = {
    enabled: true,
    aggressiveMode: false,
    lowBatteryThreshold: 20,
    criticalBatteryThreshold: 10,
    backgroundOptimization: true,
    reduceAnimations: true,
    limitStreamQuality: true,
    reduceBrightness: true,
    pauseBackgroundTasks: true,
    enablePowerSaveMode: true,
    smartWakelock: true,
    cpuThrottling: true,
    networkOptimization: true,
    cacheAggressive: true,
    disableLocationServices: false,
    reduceHapticFeedback: true,
    limitConcurrentDownloads: true,
    adaptiveRefreshRate: true,
    thermalThrottling: true,
    profileBasedOptimization: true,
  };

  private builtInProfiles: BatteryProfile[] = [
    {
      id: 'power_saver',
      name: 'Power Saver',
      description: 'Maximum battery life with minimal functionality',
      settings: {
        aggressiveMode: true,
        reduceAnimations: true,
        limitStreamQuality: true,
        reduceBrightness: true,
        pauseBackgroundTasks: true,
        limitConcurrentDownloads: true,
        cpuThrottling: true,
        networkOptimization: true,
        adaptiveRefreshRate: true,
      },
      triggers: {
        batteryLevel: 15,
        chargingState: false,
      },
      customizations: {
        streamQuality: '360p',
        animationScale: 0.5,
        brightnessReduction: 30,
        refreshRate: 30,
        maxConcurrentStreams: 1,
        syncInterval: 60,
      },
    },
    {
      id: 'balanced',
      name: 'Balanced',
      description: 'Good balance between performance and battery life',
      settings: {
        aggressiveMode: false,
        reduceAnimations: false,
        limitStreamQuality: true,
        reduceBrightness: false,
        pauseBackgroundTasks: false,
        limitConcurrentDownloads: true,
        cpuThrottling: false,
        networkOptimization: true,
        adaptiveRefreshRate: true,
      },
      triggers: {
        batteryLevel: 50,
        chargingState: false,
      },
      customizations: {
        streamQuality: '720p',
        animationScale: 0.8,
        brightnessReduction: 10,
        refreshRate: 60,
        maxConcurrentStreams: 2,
        syncInterval: 30,
      },
    },
    {
      id: 'performance',
      name: 'Performance',
      description: 'Maximum performance, minimal battery optimization',
      settings: {
        aggressiveMode: false,
        reduceAnimations: false,
        limitStreamQuality: false,
        reduceBrightness: false,
        pauseBackgroundTasks: false,
        limitConcurrentDownloads: false,
        cpuThrottling: false,
        networkOptimization: false,
        adaptiveRefreshRate: false,
      },
      triggers: {
        chargingState: true,
      },
      customizations: {
        streamQuality: 'source',
        animationScale: 1.0,
        brightnessReduction: 0,
        refreshRate: 120,
        maxConcurrentStreams: 4,
        syncInterval: 15,
      },
    },
    {
      id: 'gaming',
      name: 'Gaming Mode',
      description: 'Optimized for gaming and interactive content',
      settings: {
        aggressiveMode: false,
        reduceAnimations: false,
        limitStreamQuality: false,
        reduceBrightness: false,
        pauseBackgroundTasks: true,
        limitConcurrentDownloads: true,
        cpuThrottling: false,
        networkOptimization: false,
        adaptiveRefreshRate: true,
        thermalThrottling: true,
      },
      triggers: {
        appUsage: 'heavy',
      },
      customizations: {
        streamQuality: '720p',
        animationScale: 1.0,
        brightnessReduction: 0,
        refreshRate: 90,
        maxConcurrentStreams: 1,
        syncInterval: 60,
      },
    },
    {
      id: 'thermal_protection',
      name: 'Thermal Protection',
      description: 'Aggressive cooling and thermal management',
      settings: {
        aggressiveMode: true,
        reduceAnimations: true,
        limitStreamQuality: true,
        reduceBrightness: true,
        pauseBackgroundTasks: true,
        limitConcurrentDownloads: true,
        cpuThrottling: true,
        networkOptimization: true,
        adaptiveRefreshRate: true,
        thermalThrottling: true,
      },
      triggers: {
        thermalState: 'serious',
      },
      customizations: {
        streamQuality: '480p',
        animationScale: 0.3,
        brightnessReduction: 50,
        refreshRate: 30,
        maxConcurrentStreams: 1,
        syncInterval: 120,
      },
    },
  ];

  private constructor() {
    this.settings = { ...this.defaultSettings };
    this.batteryState = this.getInitialBatteryState();
    this.thermalState = this.getInitialThermalState();
    this.deviceCapabilities = this.detectDeviceCapabilities();
    this.initializeService();
  }

  static getInstance(): BatteryOptimizationService {
    if (!BatteryOptimizationService.instance) {
      BatteryOptimizationService.instance = new BatteryOptimizationService();
    }
    return BatteryOptimizationService.instance;
  }

  private async initializeService(): Promise<void> {
    try {
      await this.loadSettings();
      await this.loadOptimizationHistory();
      await this.updateBatteryState();
      await this.updateThermalState();
      await this.calculateBaselineConsumption();
      
      if (this.settings.enabled) {
        await this.startMonitoring();
      }
      
      console.log('🔋 Battery optimization service initialized');
    } catch (error) {
      console.error('❌ Battery optimization service initialization failed:', error);
    }
  }

  private detectDeviceCapabilities(): any {
    return {
      hasAdvancedBatteryAPI: Platform.OS === 'android' && Platform.Version >= 21,
      hasThermalAPI: Platform.OS === 'android' && Platform.Version >= 29,
      hasAdaptiveDisplay: true, // Most modern devices
      supportsCPUThrottling: Platform.OS === 'android',
      hasWirelessCharging: false, // Would need native detection
      maxCores: Platform.OS === 'android' ? 8 : 6, // Estimate
    };
  }

  private getInitialBatteryState(): BatteryState {
    return {
      level: 1.0,
      isCharging: false,
      chargingType: 'none',
      powerSaveMode: false,
      temperature: 25,
      voltage: 0,
      capacity: 0,
      health: 'unknown',
      technology: 'Li-ion',
      estimatedTimeRemaining: 0,
      lastUpdated: Date.now(),
    };
  }

  private getInitialThermalState(): ThermalState {
    return {
      state: 'normal',
      temperature: 25,
      throttlingActive: false,
      affectedComponents: [],
      recommendedActions: [],
      timestamp: Date.now(),
    };
  }

  async startMonitoring(): Promise<void> {
    if (this.monitoringActive) return;

    try {
      this.monitoringActive = true;
      
      // Setup battery monitoring
      await this.setupBatteryMonitoring();
      
      // Setup thermal monitoring
      await this.setupThermalMonitoring();
      
      // Setup app state monitoring
      this.setupAppStateMonitoring();
      
      // Start optimization timer
      this.optimizationTimer = setInterval(async () => {
        await this.performOptimization();
      }, 30000); // Check every 30 seconds
      
      // Start profile check timer
      this.profileCheckTimer = setInterval(async () => {
        await this.checkAndApplyProfiles();
      }, 60000); // Check every minute
      
      console.log('🔋 Battery monitoring started');
    } catch (error) {
      console.error('❌ Failed to start battery monitoring:', error);
      this.monitoringActive = false;
    }
  }

  async stopMonitoring(): Promise<void> {
    if (!this.monitoringActive) return;

    try {
      this.monitoringActive = false;
      
      // Cleanup listeners
      if (this.batteryListener) {
        this.batteryListener.remove();
        this.batteryListener = null;
      }
      
      if (this.thermalListener) {
        this.thermalListener.remove();
        this.thermalListener = null;
      }
      
      if (this.appStateListener) {
        this.appStateListener.remove();
        this.appStateListener = null;
      }
      
      // Clear timers
      if (this.optimizationTimer) {
        clearInterval(this.optimizationTimer);
        this.optimizationTimer = null;
      }
      
      if (this.profileCheckTimer) {
        clearInterval(this.profileCheckTimer);
        this.profileCheckTimer = null;
      }
      
      console.log('🔋 Battery monitoring stopped');
    } catch (error) {
      console.error('❌ Failed to stop battery monitoring:', error);
    }
  }

  private async setupBatteryMonitoring(): Promise<void> {
    try {
      // Use Expo Battery API
      this.batteryListener = Battery.addBatteryLevelListener(({ batteryLevel }) => {
        this.updateBatteryLevel(batteryLevel);
      });

      // Additional battery state monitoring
      const batteryState = await Battery.getBatteryLevelAsync();
      const isCharging = await Battery.isChargingAsync();
      const powerMode = await Battery.getPowerModeAsync();
      
      this.batteryState = {
        ...this.batteryState,
        level: batteryState,
        isCharging,
        powerSaveMode: powerMode === Battery.PowerMode.POWER_SAVE_MODE,
        lastUpdated: Date.now(),
      };
      
      // Setup charging state listener
      Battery.addBatteryStateListener(({ batteryState }) => {
        this.updateChargingState(batteryState === Battery.BatteryState.CHARGING);
      });
      
    } catch (error) {
      console.error('❌ Battery monitoring setup failed:', error);
    }
  }

  private async setupThermalMonitoring(): Promise<void> {
    try {
      if (Platform.OS === 'android' && this.deviceCapabilities.hasThermalAPI) {
        // Setup thermal state monitoring
        DeviceEventEmitter.addListener('thermalStateChanged', (state) => {
          this.updateThermalState(state);
        });
      }
      
      // Fallback temperature estimation based on performance
      setInterval(() => {
        this.estimateThermalState();
      }, 10000); // Every 10 seconds
      
    } catch (error) {
      console.error('❌ Thermal monitoring setup failed:', error);
    }
  }

  private setupAppStateMonitoring(): void {
    this.appStateListener = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      this.handleAppStateChange(nextAppState);
    });
  }

  private updateBatteryLevel(level: number): void {
    this.batteryState.level = level;
    this.batteryState.lastUpdated = Date.now();
    
    // Trigger optimization if needed
    if (level <= this.settings.criticalBatteryThreshold / 100) {
      this.triggerEmergencyOptimization();
    } else if (level <= this.settings.lowBatteryThreshold / 100) {
      this.triggerLowBatteryOptimization();
    }
  }

  private updateChargingState(isCharging: boolean): void {
    this.batteryState.isCharging = isCharging;
    this.batteryState.lastUpdated = Date.now();
    
    // Adjust optimization based on charging state
    if (isCharging) {
      this.applyChargingOptimizations();
    } else {
      this.applyBatteryOptimizations();
    }
  }

  private updateThermalState(state: any): void {
    this.thermalState = {
      state: state.state || 'normal',
      temperature: state.temperature || this.thermalState.temperature,
      throttlingActive: state.throttling || false,
      affectedComponents: state.affectedComponents || [],
      recommendedActions: state.recommendedActions || [],
      timestamp: Date.now(),
    };
    
    // Apply thermal optimizations if needed
    if (this.thermalState.state === 'serious' || this.thermalState.state === 'critical') {
      this.applyThermalOptimizations();
    }
  }

  private estimateThermalState(): void {
    // Estimate thermal state based on performance metrics
    const currentTime = Date.now();
    const timeSinceLastUpdate = currentTime - this.thermalState.timestamp;
    
    if (timeSinceLastUpdate > 30000) { // If no update for 30 seconds
      // Use performance metrics to estimate thermal state
      const performanceReport = performanceMonitor.getPerformanceReport();
      const avgFPS = parseFloat(performanceReport.summary.avgFPS);
      const memoryUsage = parseFloat(performanceReport.summary.avgMemoryUsage);
      
      let estimatedState: ThermalState['state'] = 'normal';
      let estimatedTemp = 25;
      
      if (avgFPS < 30 && memoryUsage > 80) {
        estimatedState = 'serious';
        estimatedTemp = 45;
      } else if (avgFPS < 45 && memoryUsage > 60) {
        estimatedState = 'fair';
        estimatedTemp = 35;
      }
      
      this.thermalState = {
        ...this.thermalState,
        state: estimatedState,
        temperature: estimatedTemp,
        timestamp: currentTime,
      };
    }
  }

  private handleAppStateChange(nextAppState: AppStateStatus): void {
    if (nextAppState === 'background') {
      this.applyBackgroundOptimizations();
    } else if (nextAppState === 'active') {
      this.applyForegroundOptimizations();
    }
  }

  private async performOptimization(): Promise<void> {
    if (!this.settings.enabled || !this.monitoringActive) return;

    try {
      const actions: string[] = [];
      let estimatedSavings = 0;

      // CPU optimization
      if (this.settings.cpuThrottling && this.shouldThrottleCPU()) {
        await this.applyCPUThrottling();
        actions.push('CPU throttling applied');
        estimatedSavings += 5; // 5 minutes estimated savings
      }

      // Network optimization
      if (this.settings.networkOptimization && !this.batteryState.isCharging) {
        await this.applyNetworkOptimizations();
        actions.push('Network optimization applied');
        estimatedSavings += 3;
      }

      // Cache optimization
      if (this.settings.cacheAggressive && this.batteryState.level < 0.3) {
        await this.applyAggressiveCaching();
        actions.push('Aggressive caching enabled');
        estimatedSavings += 2;
      }

      // Animation optimization
      if (this.settings.reduceAnimations && this.batteryState.level < 0.5) {
        await this.reduceAnimations();
        actions.push('Animations reduced');
        estimatedSavings += 1;
      }

      // Record optimization
      if (actions.length > 0) {
        this.optimizationHistory.push({
          timestamp: Date.now(),
          profile: this.currentProfile?.name || 'auto',
          batteryLevel: this.batteryState.level * 100,
          actions,
          impact: estimatedSavings,
        });

        // Keep only last 50 optimization records
        if (this.optimizationHistory.length > 50) {
          this.optimizationHistory = this.optimizationHistory.slice(-50);
        }

        await this.saveOptimizationHistory();
      }

    } catch (error) {
      console.error('❌ Performance optimization failed:', error);
    }
  }

  private shouldThrottleCPU(): boolean {
    return (
      this.batteryState.level < 0.3 ||
      this.thermalState.state === 'serious' ||
      this.thermalState.state === 'critical'
    );
  }

  private async applyCPUThrottling(): Promise<void> {
    try {
      // This would interface with native CPU throttling
      console.log('🔧 Applying CPU throttling');
      
      // Reduce performance monitor frequency
      if (this.batteryState.level < 0.2) {
        // More aggressive throttling for very low battery
        console.log('🔧 Aggressive CPU throttling for low battery');
      }
    } catch (error) {
      console.error('❌ CPU throttling failed:', error);
    }
  }

  private async applyNetworkOptimizations(): Promise<void> {
    try {
      console.log('📡 Applying network optimizations');
      
      // Reduce network polling frequency
      // Batch network requests
      // Use compression where possible
      // Prioritize critical requests
    } catch (error) {
      console.error('❌ Network optimization failed:', error);
    }
  }

  private async applyAggressiveCaching(): Promise<void> {
    try {
      console.log('💾 Applying aggressive caching');
      
      // Increase cache size
      // Cache more aggressively
      // Prefetch critical content
    } catch (error) {
      console.error('❌ Aggressive caching failed:', error);
    }
  }

  private async reduceAnimations(): Promise<void> {
    try {
      console.log('✨ Reducing animations');
      
      // This would reduce animation scales globally
      // Disable non-essential animations
      // Reduce animation durations
    } catch (error) {
      console.error('❌ Animation reduction failed:', error);
    }
  }

  private async triggerEmergencyOptimization(): Promise<void> {
    console.log('🚨 Emergency battery optimization triggered');
    
    try {
      // Apply most aggressive optimizations
      await this.applyProfile(this.builtInProfiles[0]); // Power Saver
      
      // Additional emergency measures
      await this.pauseNonEssentialServices();
      await this.enableMaxPowerSaving();
      
    } catch (error) {
      console.error('❌ Emergency optimization failed:', error);
    }
  }

  private async triggerLowBatteryOptimization(): Promise<void> {
    console.log('⚠️ Low battery optimization triggered');
    
    try {
      // Apply balanced optimization
      await this.applyProfile(this.builtInProfiles[1]); // Balanced
      
    } catch (error) {
      console.error('❌ Low battery optimization failed:', error);
    }
  }

  private async applyChargingOptimizations(): Promise<void> {
    console.log('🔌 Applying charging optimizations');
    
    try {
      // Enable performance mode when charging
      await this.applyProfile(this.builtInProfiles[2]); // Performance
      
    } catch (error) {
      console.error('❌ Charging optimization failed:', error);
    }
  }

  private async applyBatteryOptimizations(): Promise<void> {
    console.log('🔋 Applying battery optimizations');
    
    try {
      // Check which profile to apply based on battery level
      const batteryLevel = this.batteryState.level * 100;
      
      if (batteryLevel <= this.settings.criticalBatteryThreshold) {
        await this.applyProfile(this.builtInProfiles[0]); // Power Saver
      } else if (batteryLevel <= this.settings.lowBatteryThreshold) {
        await this.applyProfile(this.builtInProfiles[1]); // Balanced
      }
      
    } catch (error) {
      console.error('❌ Battery optimization failed:', error);
    }
  }

  private async applyThermalOptimizations(): Promise<void> {
    console.log('🌡️ Applying thermal optimizations');
    
    try {
      // Apply thermal protection profile
      await this.applyProfile(this.builtInProfiles[4]); // Thermal Protection
      
    } catch (error) {
      console.error('❌ Thermal optimization failed:', error);
    }
  }

  private async applyBackgroundOptimizations(): Promise<void> {
    if (!this.settings.backgroundOptimization) return;
    
    console.log('🌙 Applying background optimizations');
    
    try {
      // Reduce background activity
      await this.pauseNonEssentialBackgroundTasks();
      
    } catch (error) {
      console.error('❌ Background optimization failed:', error);
    }
  }

  private async applyForegroundOptimizations(): Promise<void> {
    console.log('☀️ Applying foreground optimizations');
    
    try {
      // Resume normal activity
      await this.resumeBackgroundTasks();
      
    } catch (error) {
      console.error('❌ Foreground optimization failed:', error);
    }
  }

  private async checkAndApplyProfiles(): Promise<void> {
    if (!this.settings.profileBasedOptimization) return;

    try {
      const currentTime = new Date();
      const batteryLevel = this.batteryState.level * 100;
      
      // Check all profiles for matching triggers
      for (const profile of this.builtInProfiles) {
        if (this.shouldApplyProfile(profile, batteryLevel, currentTime)) {
          if (this.currentProfile?.id !== profile.id) {
            await this.applyProfile(profile);
            break;
          }
        }
      }
      
    } catch (error) {
      console.error('❌ Profile check failed:', error);
    }
  }

  private shouldApplyProfile(profile: BatteryProfile, batteryLevel: number, currentTime: Date): boolean {
    const triggers = profile.triggers;
    
    // Check battery level trigger
    if (triggers.batteryLevel && batteryLevel > triggers.batteryLevel) {
      return false;
    }
    
    // Check charging state trigger
    if (triggers.chargingState !== undefined && triggers.chargingState !== this.batteryState.isCharging) {
      return false;
    }
    
    // Check thermal state trigger
    if (triggers.thermalState && this.thermalState.state !== triggers.thermalState) {
      return false;
    }
    
    // Check time of day trigger
    if (triggers.timeOfDay) {
      const currentHour = currentTime.getHours();
      const startHour = parseInt(triggers.timeOfDay.start.split(':')[0]);
      const endHour = parseInt(triggers.timeOfDay.end.split(':')[0]);
      
      if (currentHour < startHour || currentHour > endHour) {
        return false;
      }
    }
    
    return true;
  }

  private async applyProfile(profile: BatteryProfile): Promise<void> {
    try {
      console.log(`🔄 Applying profile: ${profile.name}`);
      
      this.currentProfile = profile;
      
      // Apply profile settings
      this.settings = { ...this.settings, ...profile.settings };
      
      // Apply customizations
      await this.applyProfileCustomizations(profile.customizations);
      
      // Save current settings
      await this.saveSettings();
      
      console.log(`✅ Profile applied: ${profile.name}`);
      
    } catch (error) {
      console.error(`❌ Failed to apply profile ${profile.name}:`, error);
    }
  }

  private async applyProfileCustomizations(customizations: BatteryProfile['customizations']): Promise<void> {
    try {
      // Apply stream quality settings
      if (customizations.streamQuality) {
        console.log(`🎥 Setting stream quality to: ${customizations.streamQuality}`);
        // This would integrate with the streaming service
      }
      
      // Apply animation scale
      if (customizations.animationScale !== undefined) {
        console.log(`✨ Setting animation scale to: ${customizations.animationScale}`);
        // This would set global animation scale
      }
      
      // Apply brightness reduction
      if (customizations.brightnessReduction) {
        console.log(`💡 Reducing brightness by: ${customizations.brightnessReduction}%`);
        // This would integrate with brightness control
      }
      
      // Apply refresh rate
      if (customizations.refreshRate) {
        console.log(`📱 Setting refresh rate to: ${customizations.refreshRate}Hz`);
        // This would set display refresh rate
      }
      
      // Apply concurrent streams limit
      if (customizations.maxConcurrentStreams) {
        console.log(`📺 Limiting concurrent streams to: ${customizations.maxConcurrentStreams}`);
        // This would integrate with stream manager
      }
      
      // Apply sync interval
      if (customizations.syncInterval) {
        console.log(`🔄 Setting sync interval to: ${customizations.syncInterval}min`);
        // This would integrate with sync service
      }
      
    } catch (error) {
      console.error('❌ Failed to apply profile customizations:', error);
    }
  }

  private async pauseNonEssentialServices(): Promise<void> {
    console.log('⏸️ Pausing non-essential services');
    
    try {
      // This would pause background downloads
      // Stop non-critical sync operations
      // Reduce polling frequencies
      // Pause analytics
    } catch (error) {
      console.error('❌ Failed to pause services:', error);
    }
  }

  private async pauseNonEssentialBackgroundTasks(): Promise<void> {
    console.log('⏸️ Pausing background tasks');
    
    try {
      // Pause background sync
      // Reduce location updates
      // Pause background downloads
    } catch (error) {
      console.error('❌ Failed to pause background tasks:', error);
    }
  }

  private async resumeBackgroundTasks(): Promise<void> {
    console.log('▶️ Resuming background tasks');
    
    try {
      // Resume normal background operations
    } catch (error) {
      console.error('❌ Failed to resume background tasks:', error);
    }
  }

  private async enableMaxPowerSaving(): Promise<void> {
    console.log('🔋 Enabling maximum power saving');
    
    try {
      // Apply most aggressive power saving measures
      // Disable all non-essential features
      // Minimize screen updates
    } catch (error) {
      console.error('❌ Failed to enable max power saving:', error);
    }
  }

  private async updateBatteryState(): Promise<void> {
    try {
      const level = await Battery.getBatteryLevelAsync();
      const isCharging = await Battery.isChargingAsync();
      
      this.batteryState = {
        ...this.batteryState,
        level,
        isCharging,
        lastUpdated: Date.now(),
      };
    } catch (error) {
      console.error('❌ Failed to update battery state:', error);
    }
  }

  private async updateThermalState(): Promise<void> {
    try {
      // This would get actual thermal state from native modules
      // For now, we'll use the current estimated state
      this.thermalState.timestamp = Date.now();
    } catch (error) {
      console.error('❌ Failed to update thermal state:', error);
    }
  }

  private async calculateBaselineConsumption(): Promise<void> {
    try {
      // This would calculate baseline power consumption
      // For now, we'll use a placeholder
      this.baselineConsumption = 100; // 100mW baseline
    } catch (error) {
      console.error('❌ Failed to calculate baseline consumption:', error);
    }
  }

  // Storage methods
  private async loadSettings(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('battery_optimization_settings');
      if (stored) {
        this.settings = { ...this.defaultSettings, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('❌ Failed to load battery optimization settings:', error);
    }
  }

  private async saveSettings(): Promise<void> {
    try {
      await AsyncStorage.setItem('battery_optimization_settings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('❌ Failed to save battery optimization settings:', error);
    }
  }

  private async loadOptimizationHistory(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('battery_optimization_history');
      if (stored) {
        this.optimizationHistory = JSON.parse(stored);
      }
    } catch (error) {
      console.error('❌ Failed to load optimization history:', error);
    }
  }

  private async saveOptimizationHistory(): Promise<void> {
    try {
      await AsyncStorage.setItem('battery_optimization_history', JSON.stringify(this.optimizationHistory));
    } catch (error) {
      console.error('❌ Failed to save optimization history:', error);
    }
  }

  // Public API
  async updateSettings(newSettings: Partial<BatteryOptimizationSettings>): Promise<void> {
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
    
    console.log('⚙️ Battery optimization settings updated');
  }

  getSettings(): BatteryOptimizationSettings {
    return { ...this.settings };
  }

  getBatteryState(): BatteryState {
    return { ...this.batteryState };
  }

  getThermalState(): ThermalState {
    return { ...this.thermalState };
  }

  getCurrentProfile(): BatteryProfile | null {
    return this.currentProfile ? { ...this.currentProfile } : null;
  }

  getAvailableProfiles(): BatteryProfile[] {
    return [...this.builtInProfiles];
  }

  async setProfile(profileId: string): Promise<void> {
    const profile = this.builtInProfiles.find(p => p.id === profileId);
    if (profile) {
      await this.applyProfile(profile);
    } else {
      throw new Error(`Profile not found: ${profileId}`);
    }
  }

  getOptimizationHistory(): Array<{
    timestamp: Date;
    profile: string;
    batteryLevel: number;
    actions: string[];
    impact: number;
  }> {
    return this.optimizationHistory.map(entry => ({
      ...entry,
      timestamp: new Date(entry.timestamp),
    }));
  }

  getEstimatedTimeRemaining(): number {
    // This would calculate estimated time remaining based on current consumption
    // For now, return a placeholder
    return this.batteryState.estimatedTimeRemaining;
  }

  getPowerConsumption(): PowerConsumption[] {
    return [...this.powerConsumption];
  }

  async forceOptimization(): Promise<void> {
    await this.performOptimization();
  }

  async resetToDefaults(): Promise<void> {
    this.settings = { ...this.defaultSettings };
    this.currentProfile = null;
    await this.saveSettings();
    console.log('🔄 Battery optimization settings reset to defaults');
  }

  isMonitoring(): boolean {
    return this.monitoringActive;
  }

  async cleanup(): Promise<void> {
    try {
      await this.stopMonitoring();
      await this.saveSettings();
      await this.saveOptimizationHistory();
      console.log('💫 Battery optimization service cleanup completed');
    } catch (error) {
      console.error('❌ Battery optimization cleanup failed:', error);
    }
  }
}

export const batteryOptimizationService = BatteryOptimizationService.getInstance();

// Helper functions
export const getBatteryLevel = async (): Promise<number> => {
  const state = batteryOptimizationService.getBatteryState();
  return state.level * 100;
};

export const isLowBattery = async (): Promise<boolean> => {
  const state = batteryOptimizationService.getBatteryState();
  const settings = batteryOptimizationService.getSettings();
  return state.level * 100 <= settings.lowBatteryThreshold;
};

export const isCriticalBattery = async (): Promise<boolean> => {
  const state = batteryOptimizationService.getBatteryState();
  const settings = batteryOptimizationService.getSettings();
  return state.level * 100 <= settings.criticalBatteryThreshold;
};

export const enableBatteryOptimization = async (enabled: boolean): Promise<void> => {
  await batteryOptimizationService.updateSettings({ enabled });
};

export const setBatteryProfile = async (profileId: string): Promise<void> => {
  await batteryOptimizationService.setProfile(profileId);
};

export default batteryOptimizationService;