import { EventEmitter } from 'eventemitter3';
import { logError, logDebug, withErrorHandling } from '@/utils/errorHandler';
import { mobileHardwareService } from './mobileHardwareService';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface HapticPattern {
  id: string;
  name: string;
  description: string;
  type: HapticPatternType;
  duration: number;
  intensity: number;
  frequency: number;
  waveform: HapticWaveform;
  envelope: HapticEnvelope;
  layers: HapticLayer[];
  metadata: HapticPatternMetadata;
  created: string;
  updated: string;
}

export type HapticPatternType = 
  | 'pulse'
  | 'burst'
  | 'wave'
  | 'rhythm'
  | 'texture'
  | 'impact'
  | 'vibration'
  | 'touch'
  | 'feedback'
  | 'notification'
  | 'ambient'
  | 'spatial'
  | 'procedural'
  | 'custom';

export interface HapticWaveform {
  type: WaveformType;
  frequency: number;
  amplitude: number;
  phase: number;
  harmonics: HarmonicComponent[];
  modulation: ModulationSettings;
}

export type WaveformType = 
  | 'sine'
  | 'square'
  | 'triangle'
  | 'sawtooth'
  | 'noise'
  | 'pulse'
  | 'custom'
  | 'sample';

export interface HarmonicComponent {
  frequency: number;
  amplitude: number;
  phase: number;
  weight: number;
}

export interface ModulationSettings {
  enabled: boolean;
  type: ModulationType;
  frequency: number;
  depth: number;
  phase: number;
}

export type ModulationType = 
  | 'amplitude'
  | 'frequency'
  | 'phase'
  | 'pulse_width'
  | 'ring'
  | 'tremolo';

export interface HapticEnvelope {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  curve: EnvelopeCurve;
  segments: EnvelopeSegment[];
}

export type EnvelopeCurve = 
  | 'linear'
  | 'exponential'
  | 'logarithmic'
  | 'sine'
  | 'cosine'
  | 'custom';

export interface EnvelopeSegment {
  duration: number;
  startLevel: number;
  endLevel: number;
  curve: EnvelopeCurve;
}

export interface HapticLayer {
  id: string;
  name: string;
  enabled: boolean;
  waveform: HapticWaveform;
  envelope: HapticEnvelope;
  spatialSettings: SpatialHapticSettings;
  effects: HapticEffect[];
  volume: number;
  pan: number;
  delay: number;
  feedback: number;
}

export interface SpatialHapticSettings {
  enabled: boolean;
  position: Vector3D;
  radius: number;
  falloff: SpatialFalloff;
  direction: Vector3D;
  spread: number;
  tracking: SpatialTracking;
}

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export type SpatialFalloff = 
  | 'linear'
  | 'inverse'
  | 'exponential'
  | 'custom';

export interface SpatialTracking {
  enabled: boolean;
  method: TrackingMethod;
  sensitivity: number;
  smoothing: number;
  prediction: number;
}

export type TrackingMethod = 
  | 'device_motion'
  | 'camera'
  | 'touch'
  | 'gesture'
  | 'external';

export interface HapticEffect {
  id: string;
  name: string;
  type: HapticEffectType;
  enabled: boolean;
  parameters: Record<string, number>;
  intensity: number;
  duration: number;
  delay: number;
}

export type HapticEffectType = 
  | 'reverb'
  | 'delay'
  | 'distortion'
  | 'filter'
  | 'compressor'
  | 'limiter'
  | 'chorus'
  | 'flanger'
  | 'phaser'
  | 'tremolo'
  | 'vibrato'
  | 'gate'
  | 'shaper'
  | 'spatializer'
  | 'custom';

export interface HapticPatternMetadata {
  category: string;
  tags: string[];
  author: string;
  version: string;
  license: string;
  description: string;
  usage: string;
  compatibility: string[];
  ratings: PatternRating[];
}

export interface PatternRating {
  userId: string;
  rating: number;
  comment: string;
  timestamp: string;
}

export interface HapticDevice {
  id: string;
  name: string;
  type: HapticDeviceType;
  capabilities: HapticCapabilities;
  properties: HapticDeviceProperties;
  state: HapticDeviceState;
  calibration: HapticCalibration;
  limits: HapticLimits;
  connected: boolean;
  lastUpdate: number;
}

export type HapticDeviceType = 
  | 'smartphone'
  | 'tablet'
  | 'controller'
  | 'wearable'
  | 'haptic_suit'
  | 'glove'
  | 'vest'
  | 'chair'
  | 'platform'
  | 'external'
  | 'custom';

export interface HapticCapabilities {
  supportsVibration: boolean;
  supportsForce: boolean;
  supportsTexture: boolean;
  supportsTemperature: boolean;
  supportsDirection: boolean;
  supportsSpatial: boolean;
  supportsMultipoint: boolean;
  supportsCustomWaveforms: boolean;
  maxFrequency: number;
  minFrequency: number;
  maxAmplitude: number;
  minAmplitude: number;
  resolution: number;
  latency: number;
  actuators: ActuatorInfo[];
}

export interface ActuatorInfo {
  id: string;
  type: ActuatorType;
  position: Vector3D;
  orientation: Vector3D;
  capabilities: ActuatorCapabilities;
  calibration: ActuatorCalibration;
}

export type ActuatorType = 
  | 'linear'
  | 'rotational'
  | 'piezo'
  | 'electromagnetic'
  | 'pneumatic'
  | 'ultrasonic'
  | 'thermal'
  | 'custom';

export interface ActuatorCapabilities {
  maxForce: number;
  maxDisplacement: number;
  maxFrequency: number;
  bandwidth: number;
  precision: number;
  power: number;
}

export interface ActuatorCalibration {
  offset: number;
  scale: number;
  linearization: number[];
  temperatureCompensation: boolean;
  agingCompensation: boolean;
}

export interface HapticDeviceProperties {
  batteryLevel: number;
  temperature: number;
  processingPower: number;
  memoryUsage: number;
  firmwareVersion: string;
  driverVersion: string;
  customSettings: Record<string, any>;
}

export interface HapticDeviceState {
  isActive: boolean;
  isCalibrated: boolean;
  isOverheating: boolean;
  isLowBattery: boolean;
  errorCode: number;
  errorMessage: string;
  lastActivity: number;
  playbackState: PlaybackState;
}

export type PlaybackState = 
  | 'idle'
  | 'playing'
  | 'paused'
  | 'buffering'
  | 'error';

export interface HapticCalibration {
  isCalibrated: boolean;
  calibrationDate: string;
  sensitivity: number;
  threshold: number;
  range: number;
  precision: number;
  userPreferences: UserHapticPreferences;
  deviceSpecific: Record<string, any>;
}

export interface UserHapticPreferences {
  globalIntensity: number;
  frequencyAdjustment: number;
  spatialSensitivity: number;
  comfortSettings: HapticComfortSettings;
  accessibility: HapticAccessibilitySettings;
  personalizedSettings: PersonalizedHapticSettings;
}

export interface HapticComfortSettings {
  maxIntensity: number;
  maxDuration: number;
  maxFrequency: number;
  restPeriods: boolean;
  fadeIn: boolean;
  fadeOut: boolean;
  safetyLimits: boolean;
}

export interface HapticAccessibilitySettings {
  enhancedIntensity: boolean;
  visualIndicators: boolean;
  audioIndicators: boolean;
  alternativePatterns: boolean;
  simplifiedControls: boolean;
  customMappings: Record<string, string>;
}

export interface PersonalizedHapticSettings {
  learningEnabled: boolean;
  adaptiveIntensity: boolean;
  contextAwareness: boolean;
  emotionalMapping: EmotionalHapticMapping;
  biometricAdaptation: BiometricAdaptation;
}

export interface EmotionalHapticMapping {
  enabled: boolean;
  mappings: Record<string, HapticPattern>;
  intensity: number;
  context: string[];
}

export interface BiometricAdaptation {
  enabled: boolean;
  heartRate: boolean;
  skinConductance: boolean;
  temperature: boolean;
  stress: boolean;
  fatigue: boolean;
}

export interface HapticLimits {
  maxConcurrentPatterns: number;
  maxPatternDuration: number;
  maxIntensity: number;
  maxFrequency: number;
  thermalLimit: number;
  powerLimit: number;
  bandwidthLimit: number;
}

export interface HapticEvent {
  id: string;
  type: HapticEventType;
  trigger: HapticTrigger;
  pattern: string;
  context: HapticContext;
  priority: HapticPriority;
  conditions: HapticCondition[];
  timing: HapticTiming;
  repeatSettings: RepeatSettings;
  spatialSettings: SpatialHapticSettings;
  metadata: HapticEventMetadata;
  created: string;
}

export type HapticEventType = 
  | 'ui_feedback'
  | 'notification'
  | 'alert'
  | 'confirmation'
  | 'error'
  | 'success'
  | 'warning'
  | 'ambient'
  | 'spatial'
  | 'interaction'
  | 'gesture'
  | 'content'
  | 'system'
  | 'custom';

export interface HapticTrigger {
  type: TriggerType;
  source: string;
  data: any;
  conditions: TriggerCondition[];
}

export type TriggerType = 
  | 'touch'
  | 'gesture'
  | 'voice'
  | 'proximity'
  | 'time'
  | 'event'
  | 'state_change'
  | 'sensor'
  | 'network'
  | 'custom';

export interface TriggerCondition {
  parameter: string;
  operator: ComparisonOperator;
  value: any;
  weight: number;
}

export type ComparisonOperator = 
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'less_than'
  | 'greater_equal'
  | 'less_equal'
  | 'contains'
  | 'matches'
  | 'in_range';

export interface HapticContext {
  application: string;
  scene: string;
  location: Vector3D;
  environment: string;
  userState: UserState;
  deviceState: string;
  networkState: string;
  timeOfDay: string;
  customContext: Record<string, any>;
}

export interface UserState {
  activity: string;
  attention: number;
  stress: number;
  fatigue: number;
  engagement: number;
  preference: string;
}

export type HapticPriority = 
  | 'critical'
  | 'high'
  | 'normal'
  | 'low'
  | 'background';

export interface HapticCondition {
  type: ConditionType;
  parameter: string;
  operator: ComparisonOperator;
  value: any;
  weight: number;
}

export type ConditionType = 
  | 'device'
  | 'user'
  | 'environment'
  | 'application'
  | 'time'
  | 'location'
  | 'battery'
  | 'network'
  | 'custom';

export interface HapticTiming {
  delay: number;
  startTime: number;
  duration: number;
  fadeIn: number;
  fadeOut: number;
  synchronization: SynchronizationSettings;
}

export interface SynchronizationSettings {
  enabled: boolean;
  source: string;
  tolerance: number;
  compensation: boolean;
  priority: number;
}

export interface RepeatSettings {
  enabled: boolean;
  count: number;
  interval: number;
  variation: VariationSettings;
  decay: DecaySettings;
}

export interface VariationSettings {
  enabled: boolean;
  intensity: number;
  frequency: number;
  timing: number;
  pattern: number;
}

export interface DecaySettings {
  enabled: boolean;
  rate: number;
  curve: EnvelopeCurve;
  minimum: number;
}

export interface HapticEventMetadata {
  category: string;
  importance: number;
  urgency: number;
  persistence: boolean;
  logging: boolean;
  analytics: boolean;
  debugging: boolean;
}

export interface HapticSequence {
  id: string;
  name: string;
  description: string;
  events: HapticEvent[];
  timeline: HapticTimeline;
  synchronization: SequenceSynchronization;
  variations: SequenceVariation[];
  metadata: HapticSequenceMetadata;
  created: string;
  updated: string;
}

export interface HapticTimeline {
  duration: number;
  markers: TimelineMarker[];
  tracks: TimelineTrack[];
  tempo: number;
  timeSignature: string;
}

export interface TimelineMarker {
  time: number;
  name: string;
  type: MarkerType;
  data: any;
}

export type MarkerType = 
  | 'cue'
  | 'sync'
  | 'loop'
  | 'fade'
  | 'stop'
  | 'custom';

export interface TimelineTrack {
  id: string;
  name: string;
  events: HapticEvent[];
  volume: number;
  muted: boolean;
  solo: boolean;
  effects: HapticEffect[];
}

export interface SequenceSynchronization {
  enabled: boolean;
  master: boolean;
  source: string;
  offset: number;
  tolerance: number;
  compensation: boolean;
}

export interface SequenceVariation {
  id: string;
  name: string;
  conditions: HapticCondition[];
  modifications: VariationModification[];
  probability: number;
}

export interface VariationModification {
  target: string;
  property: string;
  operation: ModificationOperation;
  value: any;
}

export type ModificationOperation = 
  | 'set'
  | 'add'
  | 'multiply'
  | 'replace'
  | 'interpolate'
  | 'randomize';

export interface HapticSequenceMetadata {
  genre: string;
  mood: string;
  energy: number;
  complexity: number;
  duration: number;
  bpm: number;
  tags: string[];
  author: string;
  version: string;
}

export interface HapticConfig {
  enabled: boolean;
  globalIntensity: number;
  adaptiveIntensity: boolean;
  spatialHapticsEnabled: boolean;
  multiDeviceEnabled: boolean;
  lowLatencyMode: boolean;
  powerOptimization: boolean;
  thermalProtection: boolean;
  accessibilityEnabled: boolean;
  debugMode: boolean;
  maxConcurrentPatterns: number;
  maxPatternDuration: number;
  defaultDevice: string;
  fallbackDevice: string;
  updateRate: number;
  bufferSize: number;
  compression: CompressionSettings;
  quality: HapticQuality;
}

export interface CompressionSettings {
  enabled: boolean;
  algorithm: CompressionAlgorithm;
  quality: number;
  latency: number;
}

export type CompressionAlgorithm = 
  | 'none'
  | 'lossless'
  | 'perceptual'
  | 'adaptive'
  | 'custom';

export type HapticQuality = 
  | 'low'
  | 'medium'
  | 'high'
  | 'ultra'
  | 'adaptive';

class HapticFeedbackService extends EventEmitter {
  private static instance: HapticFeedbackService;
  private isInitialized: boolean = false;
  private devices: Map<string, HapticDevice> = new Map();
  private patterns: Map<string, HapticPattern> = new Map();
  private sequences: Map<string, HapticSequence> = new Map();
  private events: Map<string, HapticEvent> = new Map();
  private activePatterns: Map<string, any> = new Map();
  private config: HapticConfig;
  private hapticEngine: any = null;
  private spatialProcessor: any = null;
  private patternProcessor: any = null;
  private eventManager: any = null;
  private deviceManager: any = null;
  private calibrationManager: any = null;
  private performanceMonitor: any = null;

  private readonly defaultConfig: HapticConfig = {
    enabled: true,
    globalIntensity: 0.8,
    adaptiveIntensity: true,
    spatialHapticsEnabled: true,
    multiDeviceEnabled: false,
    lowLatencyMode: true,
    powerOptimization: true,
    thermalProtection: true,
    accessibilityEnabled: false,
    debugMode: false,
    maxConcurrentPatterns: 8,
    maxPatternDuration: 10000,
    defaultDevice: 'primary',
    fallbackDevice: 'builtin',
    updateRate: 1000,
    bufferSize: 256,
    compression: {
      enabled: false,
      algorithm: 'perceptual',
      quality: 0.8,
      latency: 10,
    },
    quality: 'high',
  };

  private constructor() {
    super();
    this.config = { ...this.defaultConfig };
    this.setupEventHandlers();
  }

  static getInstance(): HapticFeedbackService {
    if (!HapticFeedbackService.instance) {
      HapticFeedbackService.instance = new HapticFeedbackService();
    }
    return HapticFeedbackService.instance;
  }

  /**
   * Initialize haptic feedback service
   */
  async initialize(config?: Partial<HapticConfig>): Promise<void> {
    return withErrorHandling(async () => {
      logDebug('Initializing haptic feedback service...');

      if (config) {
        this.config = { ...this.config, ...config };
      }

      // Check haptic capabilities
      const capabilities = await this.checkHapticCapabilities();
      if (!capabilities.isHapticSupported) {
        logDebug('Haptic feedback not supported, using fallback mode');
      }

      // Initialize haptic engine
      await this.initializeHapticEngine();

      // Initialize device manager
      await this.initializeDeviceManager();

      // Discover and initialize devices
      await this.discoverDevices();

      // Initialize pattern processor
      await this.initializePatternProcessor();

      // Initialize spatial processor
      if (this.config.spatialHapticsEnabled) {
        await this.initializeSpatialProcessor();
      }

      // Initialize event manager
      await this.initializeEventManager();

      // Initialize calibration manager
      await this.initializeCalibrationManager();

      // Load default patterns
      await this.loadDefaultPatterns();

      // Load user preferences
      await this.loadUserPreferences();

      // Start performance monitoring
      this.startPerformanceMonitoring();

      this.isInitialized = true;
      this.emit('initialized', { capabilities, config: this.config });

      logDebug('Haptic feedback service initialized successfully');
    }, { component: 'HapticFeedbackService', action: 'initialize' });
  }

  /**
   * Create haptic pattern
   */
  async createPattern(
    name: string,
    type: HapticPatternType,
    options?: {
      duration?: number;
      intensity?: number;
      waveform?: Partial<HapticWaveform>;
      envelope?: Partial<HapticEnvelope>;
      layers?: Partial<HapticLayer>[];
    }
  ): Promise<HapticPattern> {
    return withErrorHandling(async () => {
      if (!this.isInitialized) {
        throw new Error('Haptic service not initialized');
      }

      const pattern: HapticPattern = {
        id: this.generatePatternId(),
        name,
        description: `${type} haptic pattern`,
        type,
        duration: options?.duration || 1000,
        intensity: options?.intensity || 0.8,
        frequency: 100,
        waveform: this.createDefaultWaveform(options?.waveform),
        envelope: this.createDefaultEnvelope(options?.envelope),
        layers: this.createDefaultLayers(options?.layers),
        metadata: this.createDefaultPatternMetadata(),
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      };

      // Process pattern
      await this.processPattern(pattern);

      // Store pattern
      this.patterns.set(pattern.id, pattern);

      this.emit('pattern_created', pattern);
      return pattern;
    }, { component: 'HapticFeedbackService', action: 'createPattern' });
  }

  /**
   * Play haptic pattern
   */
  async playPattern(
    patternId: string,
    options?: {
      intensity?: number;
      duration?: number;
      device?: string;
      spatialSettings?: SpatialHapticSettings;
      priority?: HapticPriority;
    }
  ): Promise<void> {
    return withErrorHandling(async () => {
      const pattern = this.patterns.get(patternId);
      if (!pattern) {
        throw new Error(`Haptic pattern ${patternId} not found`);
      }

      if (!this.config.enabled) {
        return;
      }

      // Check concurrent pattern limit
      if (this.activePatterns.size >= this.config.maxConcurrentPatterns) {
        this.stopOldestPattern();
      }

      // Get target device
      const deviceId = options?.device || this.config.defaultDevice;
      const device = this.devices.get(deviceId) || this.getDefaultDevice();

      if (!device || !device.connected) {
        throw new Error(`Haptic device ${deviceId} not available`);
      }

      // Apply options
      const playbackPattern = this.applyPatternOptions(pattern, options);

      // Check device limits
      await this.validateDeviceLimits(device, playbackPattern);

      // Start pattern playback
      const playbackId = await this.hapticEngine.playPattern(device, playbackPattern);
      
      // Track active pattern
      this.activePatterns.set(playbackId, {
        patternId,
        deviceId: device.id,
        startTime: Date.now(),
        duration: playbackPattern.duration,
        intensity: playbackPattern.intensity,
      });

      // Auto-cleanup after duration
      setTimeout(() => {
        this.activePatterns.delete(playbackId);
      }, playbackPattern.duration);

      this.emit('pattern_started', { patternId, playbackId, device: device.id });
    }, { component: 'HapticFeedbackService', action: 'playPattern' });
  }

  /**
   * Stop haptic pattern
   */
  async stopPattern(playbackId: string): Promise<void> {
    return withErrorHandling(async () => {
      const activePattern = this.activePatterns.get(playbackId);
      if (!activePattern) {
        return;
      }

      await this.hapticEngine.stopPattern(playbackId);
      this.activePatterns.delete(playbackId);

      this.emit('pattern_stopped', { playbackId });
    }, { component: 'HapticFeedbackService', action: 'stopPattern' });
  }

  /**
   * Stop all haptic patterns
   */
  async stopAllPatterns(): Promise<void> {
    return withErrorHandling(async () => {
      for (const playbackId of this.activePatterns.keys()) {
        await this.stopPattern(playbackId);
      }
    }, { component: 'HapticFeedbackService', action: 'stopAllPatterns' });
  }

  /**
   * Create haptic event
   */
  async createEvent(
    type: HapticEventType,
    trigger: HapticTrigger,
    patternId: string,
    options?: {
      priority?: HapticPriority;
      conditions?: HapticCondition[];
      timing?: Partial<HapticTiming>;
      spatialSettings?: SpatialHapticSettings;
    }
  ): Promise<HapticEvent> {
    return withErrorHandling(async () => {
      const event: HapticEvent = {
        id: this.generateEventId(),
        type,
        trigger,
        pattern: patternId,
        context: await this.getCurrentContext(),
        priority: options?.priority || 'normal',
        conditions: options?.conditions || [],
        timing: this.createDefaultTiming(options?.timing),
        repeatSettings: this.createDefaultRepeatSettings(),
        spatialSettings: options?.spatialSettings || this.createDefaultSpatialSettings(),
        metadata: this.createDefaultEventMetadata(),
        created: new Date().toISOString(),
      };

      this.events.set(event.id, event);
      await this.eventManager.registerEvent(event);

      this.emit('event_created', event);
      return event;
    }, { component: 'HapticFeedbackService', action: 'createEvent' });
  }

  /**
   * Trigger haptic event
   */
  async triggerEvent(eventId: string, context?: any): Promise<void> {
    return withErrorHandling(async () => {
      const event = this.events.get(eventId);
      if (!event) {
        throw new Error(`Haptic event ${eventId} not found`);
      }

      // Check conditions
      const conditionsMet = await this.checkEventConditions(event, context);
      if (!conditionsMet) {
        return;
      }

      // Apply timing
      const delay = event.timing.delay;
      if (delay > 0) {
        setTimeout(() => this.executeEvent(event, context), delay);
      } else {
        await this.executeEvent(event, context);
      }
    }, { component: 'HapticFeedbackService', action: 'triggerEvent' });
  }

  /**
   * Create haptic sequence
   */
  async createSequence(
    name: string,
    events: HapticEvent[],
    options?: {
      duration?: number;
      synchronization?: Partial<SequenceSynchronization>;
      variations?: SequenceVariation[];
    }
  ): Promise<HapticSequence> {
    return withErrorHandling(async () => {
      const sequence: HapticSequence = {
        id: this.generateSequenceId(),
        name,
        description: `Haptic sequence with ${events.length} events`,
        events,
        timeline: this.createTimeline(events, options?.duration),
        synchronization: this.createDefaultSequenceSynchronization(options?.synchronization),
        variations: options?.variations || [],
        metadata: this.createDefaultSequenceMetadata(),
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      };

      this.sequences.set(sequence.id, sequence);

      this.emit('sequence_created', sequence);
      return sequence;
    }, { component: 'HapticFeedbackService', action: 'createSequence' });
  }

  /**
   * Play haptic sequence
   */
  async playSequence(sequenceId: string, options?: { loop?: boolean; variations?: boolean }): Promise<void> {
    return withErrorHandling(async () => {
      const sequence = this.sequences.get(sequenceId);
      if (!sequence) {
        throw new Error(`Haptic sequence ${sequenceId} not found`);
      }

      await this.hapticEngine.playSequence(sequence, options);
      this.emit('sequence_started', { sequenceId, options });
    }, { component: 'HapticFeedbackService', action: 'playSequence' });
  }

  /**
   * Quick haptic feedback for common UI interactions
   */
  async quickFeedback(type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error'): Promise<void> {
    return withErrorHandling(async () => {
      if (!this.config.enabled) {
        return;
      }

      // Use system haptic feedback for common types
      switch (type) {
        case 'light':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'success':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'warning':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        case 'error':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
      }

      this.emit('quick_feedback', { type });
    }, { component: 'HapticFeedbackService', action: 'quickFeedback' });
  }

  /**
   * Update spatial haptic position
   */
  async updateSpatialPosition(
    playbackId: string,
    position: Vector3D,
    intensity?: number
  ): Promise<void> {
    return withErrorHandling(async () => {
      const activePattern = this.activePatterns.get(playbackId);
      if (!activePattern) {
        return;
      }

      if (this.spatialProcessor) {
        await this.spatialProcessor.updatePosition(playbackId, position, intensity);
      }

      this.emit('spatial_position_updated', { playbackId, position, intensity });
    }, { component: 'HapticFeedbackService', action: 'updateSpatialPosition' });
  }

  /**
   * Calibrate haptic device
   */
  async calibrateDevice(deviceId: string): Promise<void> {
    return withErrorHandling(async () => {
      const device = this.devices.get(deviceId);
      if (!device) {
        throw new Error(`Haptic device ${deviceId} not found`);
      }

      await this.calibrationManager.calibrateDevice(device);
      device.calibration.isCalibrated = true;
      device.calibration.calibrationDate = new Date().toISOString();

      this.emit('device_calibrated', device);
    }, { component: 'HapticFeedbackService', action: 'calibrateDevice' });
  }

  /**
   * Get available haptic devices
   */
  getDevices(): HapticDevice[] {
    return Array.from(this.devices.values());
  }

  /**
   * Get haptic patterns
   */
  getPatterns(): HapticPattern[] {
    return Array.from(this.patterns.values());
  }

  /**
   * Get haptic pattern by ID
   */
  getPattern(patternId: string): HapticPattern | null {
    return this.patterns.get(patternId) || null;
  }

  /**
   * Get active patterns
   */
  getActivePatterns(): any[] {
    return Array.from(this.activePatterns.values());
  }

  /**
   * Update haptic configuration
   */
  async updateConfig(config: Partial<HapticConfig>): Promise<void> {
    this.config = { ...this.config, ...config };
    await this.applyConfig();
    this.emit('config_updated', this.config);
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): any {
    return this.performanceMonitor?.getMetrics() || {
      activePatterns: this.activePatterns.size,
      totalPatterns: this.patterns.size,
      deviceCount: this.devices.size,
      cpuUsage: 0,
      memoryUsage: 0,
      latency: 0,
      errors: 0,
    };
  }

  /**
   * Export haptic pattern
   */
  async exportPattern(patternId: string): Promise<string> {
    const pattern = this.patterns.get(patternId);
    if (!pattern) {
      throw new Error(`Pattern ${patternId} not found`);
    }
    return JSON.stringify(pattern, null, 2);
  }

  /**
   * Import haptic pattern
   */
  async importPattern(patternData: string): Promise<HapticPattern> {
    const pattern: HapticPattern = JSON.parse(patternData);
    pattern.id = this.generatePatternId();
    pattern.created = new Date().toISOString();
    pattern.updated = new Date().toISOString();
    
    this.patterns.set(pattern.id, pattern);
    this.emit('pattern_imported', pattern);
    
    return pattern;
  }

  /**
   * Dispose haptic service
   */
  async dispose(): Promise<void> {
    try {
      // Stop all patterns
      await this.stopAllPatterns();

      // Cleanup processors
      await this.cleanupProcessors();

      // Disconnect devices
      await this.disconnectDevices();

      // Stop performance monitoring
      this.stopPerformanceMonitoring();

      // Clear collections
      this.devices.clear();
      this.patterns.clear();
      this.sequences.clear();
      this.events.clear();
      this.activePatterns.clear();

      this.isInitialized = false;
      this.emit('disposed');
    } catch (error) {
      logError('Error disposing haptic service', error);
    }
  }

  // Private methods

  private async checkHapticCapabilities(): Promise<any> {
    const capabilities = mobileHardwareService.getCapabilities();
    const deviceInfo = {
      hasHapticEngine: capabilities?.hasHapticEngine || false,
      platform: Platform.OS,
      version: Platform.Version,
    };

    const isHapticSupported = 
      deviceInfo.hasHapticEngine ||
      Platform.OS === 'ios' ||
      (Platform.OS === 'android' && Platform.Version >= 26);

    return {
      isHapticSupported,
      deviceInfo,
      supportedTypes: this.getSupportedHapticTypes(),
      supportedEffects: this.getSupportedEffects(),
    };
  }

  private getSupportedHapticTypes(): HapticPatternType[] {
    return ['pulse', 'burst', 'wave', 'vibration', 'touch', 'feedback', 'notification'];
  }

  private getSupportedEffects(): HapticEffectType[] {
    return ['delay', 'filter', 'compressor', 'tremolo', 'spatializer'];
  }

  private async initializeHapticEngine(): Promise<void> {
    this.hapticEngine = {
      playPattern: async (device: HapticDevice, pattern: HapticPattern) => {
        // Play haptic pattern on device
        const playbackId = this.generatePlaybackId();
        
        // Use system haptic feedback as fallback
        if (pattern.type === 'pulse') {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } else if (pattern.type === 'notification') {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        
        return playbackId;
      },
      stopPattern: async (playbackId: string) => {
        // Stop pattern playback
      },
      playSequence: async (sequence: HapticSequence, options: any) => {
        // Play haptic sequence
        for (const event of sequence.events) {
          const pattern = this.patterns.get(event.pattern);
          if (pattern) {
            await this.playPattern(pattern.id);
            await new Promise(resolve => setTimeout(resolve, event.timing.delay));
          }
        }
      },
      updatePattern: async (playbackId: string, parameters: any) => {
        // Update running pattern parameters
      },
    };
  }

  private async initializeDeviceManager(): Promise<void> {
    this.deviceManager = {
      discoverDevices: async () => {
        // Discover available haptic devices
        return [];
      },
      connectDevice: async (device: HapticDevice) => {
        // Connect to haptic device
        device.connected = true;
      },
      disconnectDevice: async (device: HapticDevice) => {
        // Disconnect from haptic device
        device.connected = false;
      },
      getDeviceInfo: async (deviceId: string) => {
        // Get device information
        return this.devices.get(deviceId);
      },
    };
  }

  private async discoverDevices(): Promise<void> {
    // Create built-in device
    const builtinDevice: HapticDevice = {
      id: 'builtin',
      name: 'Built-in Haptics',
      type: Platform.OS === 'ios' ? 'smartphone' : 'tablet',
      capabilities: this.createDefaultCapabilities(),
      properties: this.createDefaultDeviceProperties(),
      state: this.createDefaultDeviceState(),
      calibration: this.createDefaultCalibration(),
      limits: this.createDefaultLimits(),
      connected: true,
      lastUpdate: Date.now(),
    };

    this.devices.set('builtin', builtinDevice);
    this.devices.set('primary', builtinDevice);

    // Discover external devices
    const externalDevices = await this.deviceManager.discoverDevices();
    for (const device of externalDevices) {
      this.devices.set(device.id, device);
    }

    this.emit('devices_discovered', Array.from(this.devices.values()));
  }

  private async initializePatternProcessor(): Promise<void> {
    this.patternProcessor = {
      processPattern: async (pattern: HapticPattern) => {
        // Process pattern waveform and envelope
        return pattern;
      },
      applyEffects: async (pattern: HapticPattern, effects: HapticEffect[]) => {
        // Apply effects to pattern
        return pattern;
      },
      optimizePattern: async (pattern: HapticPattern, device: HapticDevice) => {
        // Optimize pattern for specific device
        return pattern;
      },
    };
  }

  private async initializeSpatialProcessor(): Promise<void> {
    this.spatialProcessor = {
      updatePosition: async (playbackId: string, position: Vector3D, intensity?: number) => {
        // Update spatial haptic position
      },
      calculateSpatialIntensity: (position: Vector3D, listenerPosition: Vector3D) => {
        // Calculate intensity based on spatial distance
        const distance = this.calculateDistance(position, listenerPosition);
        return Math.max(0, 1 - distance / 10); // Simple linear falloff
      },
      applyDirectionalEffects: async (pattern: HapticPattern, direction: Vector3D) => {
        // Apply directional haptic effects
        return pattern;
      },
    };
  }

  private async initializeEventManager(): Promise<void> {
    this.eventManager = {
      registerEvent: async (event: HapticEvent) => {
        // Register haptic event for triggering
      },
      unregisterEvent: async (eventId: string) => {
        // Unregister haptic event
      },
      checkConditions: async (event: HapticEvent, context: any) => {
        // Check if event conditions are met
        return true;
      },
      executeEvent: async (event: HapticEvent, context: any) => {
        // Execute haptic event
        await this.playPattern(event.pattern);
      },
    };
  }

  private async initializeCalibrationManager(): Promise<void> {
    this.calibrationManager = {
      calibrateDevice: async (device: HapticDevice) => {
        // Calibrate haptic device
        // This would involve user interaction to test and adjust haptic parameters
        device.calibration.sensitivity = 0.8;
        device.calibration.threshold = 0.1;
        device.calibration.range = 1.0;
        device.calibration.precision = 0.9;
      },
      saveCalibration: async (device: HapticDevice) => {
        // Save calibration data
        await AsyncStorage.setItem(
          `haptic_calibration_${device.id}`,
          JSON.stringify(device.calibration)
        );
      },
      loadCalibration: async (device: HapticDevice) => {
        // Load calibration data
        try {
          const calibrationData = await AsyncStorage.getItem(`haptic_calibration_${device.id}`);
          if (calibrationData) {
            device.calibration = { ...device.calibration, ...JSON.parse(calibrationData) };
          }
        } catch (error) {
          logError(`Failed to load calibration for device ${device.id}`, error);
        }
      },
    };
  }

  private async loadDefaultPatterns(): Promise<void> {
    const defaultPatterns = [
      {
        name: 'Click',
        type: 'pulse' as HapticPatternType,
        duration: 50,
        intensity: 0.3,
      },
      {
        name: 'Success',
        type: 'notification' as HapticPatternType,
        duration: 200,
        intensity: 0.6,
      },
      {
        name: 'Error',
        type: 'burst' as HapticPatternType,
        duration: 300,
        intensity: 0.8,
      },
      {
        name: 'Heartbeat',
        type: 'rhythm' as HapticPatternType,
        duration: 1000,
        intensity: 0.5,
      },
    ];

    for (const patternData of defaultPatterns) {
      await this.createPattern(patternData.name, patternData.type, {
        duration: patternData.duration,
        intensity: patternData.intensity,
      });
    }
  }

  private async loadUserPreferences(): Promise<void> {
    try {
      const preferencesData = await AsyncStorage.getItem('haptic_preferences');
      if (preferencesData) {
        const preferences = JSON.parse(preferencesData);
        this.config = { ...this.config, ...preferences };
      }
    } catch (error) {
      logError('Failed to load haptic preferences', error);
    }
  }

  private setupEventHandlers(): void {
    this.on('pattern_created', (pattern) => {
      // Handle pattern creation
    });

    this.on('pattern_started', (data) => {
      // Handle pattern start
    });

    this.on('device_connected', (device) => {
      // Handle device connection
    });
  }

  private async processPattern(pattern: HapticPattern): Promise<void> {
    if (this.patternProcessor) {
      await this.patternProcessor.processPattern(pattern);
    }
  }

  private stopOldestPattern(): void {
    let oldestTime = Date.now();
    let oldestId = '';

    for (const [id, pattern] of this.activePatterns.entries()) {
      if (pattern.startTime < oldestTime) {
        oldestTime = pattern.startTime;
        oldestId = id;
      }
    }

    if (oldestId) {
      this.stopPattern(oldestId);
    }
  }

  private getDefaultDevice(): HapticDevice | null {
    return this.devices.get(this.config.defaultDevice) || 
           this.devices.get(this.config.fallbackDevice) ||
           Array.from(this.devices.values())[0] || null;
  }

  private applyPatternOptions(pattern: HapticPattern, options?: any): HapticPattern {
    const modifiedPattern = { ...pattern };
    
    if (options?.intensity) {
      modifiedPattern.intensity = options.intensity * this.config.globalIntensity;
    }
    
    if (options?.duration) {
      modifiedPattern.duration = Math.min(options.duration, this.config.maxPatternDuration);
    }
    
    return modifiedPattern;
  }

  private async validateDeviceLimits(device: HapticDevice, pattern: HapticPattern): Promise<void> {
    if (pattern.duration > device.limits.maxPatternDuration) {
      throw new Error('Pattern duration exceeds device limits');
    }
    
    if (pattern.intensity > device.limits.maxIntensity) {
      throw new Error('Pattern intensity exceeds device limits');
    }
    
    if (device.state.isOverheating) {
      throw new Error('Device is overheating');
    }
    
    if (device.state.isLowBattery) {
      throw new Error('Device battery is low');
    }
  }

  private async getCurrentContext(): Promise<HapticContext> {
    return {
      application: 'streaming_app',
      scene: 'main',
      location: { x: 0, y: 0, z: 0 },
      environment: 'mobile',
      userState: {
        activity: 'viewing',
        attention: 0.8,
        stress: 0.3,
        fatigue: 0.2,
        engagement: 0.7,
        preference: 'normal',
      },
      deviceState: 'active',
      networkState: 'connected',
      timeOfDay: new Date().toISOString(),
      customContext: {},
    };
  }

  private async checkEventConditions(event: HapticEvent, context?: any): Promise<boolean> {
    if (this.eventManager) {
      return this.eventManager.checkConditions(event, context);
    }
    return true;
  }

  private async executeEvent(event: HapticEvent, context?: any): Promise<void> {
    if (this.eventManager) {
      await this.eventManager.executeEvent(event, context);
    }
  }

  private createTimeline(events: HapticEvent[], duration?: number): HapticTimeline {
    return {
      duration: duration || 5000,
      markers: [],
      tracks: [],
      tempo: 120,
      timeSignature: '4/4',
    };
  }

  private startPerformanceMonitoring(): void {
    this.performanceMonitor = {
      start: () => {
        // Start performance monitoring
      },
      stop: () => {
        // Stop performance monitoring
      },
      getMetrics: () => {
        return {
          activePatterns: this.activePatterns.size,
          totalPatterns: this.patterns.size,
          deviceCount: this.devices.size,
          cpuUsage: 0.2,
          memoryUsage: 0.1,
          latency: 5,
          errors: 0,
        };
      },
    };
  }

  private stopPerformanceMonitoring(): void {
    if (this.performanceMonitor) {
      this.performanceMonitor.stop();
      this.performanceMonitor = null;
    }
  }

  private async applyConfig(): Promise<void> {
    // Apply configuration changes to haptic engine
  }

  private async cleanupProcessors(): Promise<void> {
    this.patternProcessor = null;
    this.spatialProcessor = null;
    this.eventManager = null;
    this.calibrationManager = null;
  }

  private async disconnectDevices(): Promise<void> {
    for (const device of this.devices.values()) {
      if (device.connected) {
        await this.deviceManager.disconnectDevice(device);
      }
    }
  }

  private calculateDistance(pos1: Vector3D, pos2: Vector3D): number {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    const dz = pos1.z - pos2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  // Helper methods for creating default configurations

  private createDefaultWaveform(waveform?: Partial<HapticWaveform>): HapticWaveform {
    return {
      type: 'sine',
      frequency: 100,
      amplitude: 0.8,
      phase: 0,
      harmonics: [],
      modulation: {
        enabled: false,
        type: 'amplitude',
        frequency: 5,
        depth: 0.1,
        phase: 0,
      },
      ...waveform,
    };
  }

  private createDefaultEnvelope(envelope?: Partial<HapticEnvelope>): HapticEnvelope {
    return {
      attack: 0.1,
      decay: 0.2,
      sustain: 0.7,
      release: 0.3,
      curve: 'exponential',
      segments: [],
      ...envelope,
    };
  }

  private createDefaultLayers(layers?: Partial<HapticLayer>[]): HapticLayer[] {
    return layers?.map((layer, index) => ({
      id: `layer_${index}`,
      name: `Layer ${index + 1}`,
      enabled: true,
      waveform: this.createDefaultWaveform(layer.waveform),
      envelope: this.createDefaultEnvelope(layer.envelope),
      spatialSettings: this.createDefaultSpatialSettings(layer.spatialSettings),
      effects: layer.effects || [],
      volume: layer.volume || 1.0,
      pan: layer.pan || 0.0,
      delay: layer.delay || 0,
      feedback: layer.feedback || 0,
    })) || [];
  }

  private createDefaultSpatialSettings(settings?: Partial<SpatialHapticSettings>): SpatialHapticSettings {
    return {
      enabled: false,
      position: { x: 0, y: 0, z: 0 },
      radius: 1.0,
      falloff: 'linear',
      direction: { x: 0, y: 0, z: 1 },
      spread: 360,
      tracking: {
        enabled: false,
        method: 'device_motion',
        sensitivity: 1.0,
        smoothing: 0.8,
        prediction: 0.1,
      },
      ...settings,
    };
  }

  private createDefaultPatternMetadata(): HapticPatternMetadata {
    return {
      category: 'general',
      tags: [],
      author: 'system',
      version: '1.0.0',
      license: 'MIT',
      description: '',
      usage: 'general',
      compatibility: ['ios', 'android'],
      ratings: [],
    };
  }

  private createDefaultTiming(timing?: Partial<HapticTiming>): HapticTiming {
    return {
      delay: 0,
      startTime: 0,
      duration: 1000,
      fadeIn: 0,
      fadeOut: 0,
      synchronization: {
        enabled: false,
        source: '',
        tolerance: 50,
        compensation: false,
        priority: 0,
      },
      ...timing,
    };
  }

  private createDefaultRepeatSettings(): RepeatSettings {
    return {
      enabled: false,
      count: 1,
      interval: 1000,
      variation: {
        enabled: false,
        intensity: 0,
        frequency: 0,
        timing: 0,
        pattern: 0,
      },
      decay: {
        enabled: false,
        rate: 0.1,
        curve: 'exponential',
        minimum: 0.1,
      },
    };
  }

  private createDefaultEventMetadata(): HapticEventMetadata {
    return {
      category: 'general',
      importance: 0.5,
      urgency: 0.5,
      persistence: false,
      logging: true,
      analytics: true,
      debugging: false,
    };
  }

  private createDefaultSequenceSynchronization(sync?: Partial<SequenceSynchronization>): SequenceSynchronization {
    return {
      enabled: false,
      master: false,
      source: '',
      offset: 0,
      tolerance: 50,
      compensation: false,
      ...sync,
    };
  }

  private createDefaultSequenceMetadata(): HapticSequenceMetadata {
    return {
      genre: 'general',
      mood: 'neutral',
      energy: 0.5,
      complexity: 0.5,
      duration: 0,
      bpm: 120,
      tags: [],
      author: 'system',
      version: '1.0.0',
    };
  }

  private createDefaultCapabilities(): HapticCapabilities {
    return {
      supportsVibration: true,
      supportsForce: false,
      supportsTexture: false,
      supportsTemperature: false,
      supportsDirection: false,
      supportsSpatial: false,
      supportsMultipoint: false,
      supportsCustomWaveforms: Platform.OS === 'ios',
      maxFrequency: 1000,
      minFrequency: 10,
      maxAmplitude: 1.0,
      minAmplitude: 0.0,
      resolution: 8,
      latency: 10,
      actuators: [],
    };
  }

  private createDefaultDeviceProperties(): HapticDeviceProperties {
    return {
      batteryLevel: 100,
      temperature: 25,
      processingPower: 0.5,
      memoryUsage: 0.3,
      firmwareVersion: '1.0.0',
      driverVersion: '1.0.0',
      customSettings: {},
    };
  }

  private createDefaultDeviceState(): HapticDeviceState {
    return {
      isActive: true,
      isCalibrated: false,
      isOverheating: false,
      isLowBattery: false,
      errorCode: 0,
      errorMessage: '',
      lastActivity: Date.now(),
      playbackState: 'idle',
    };
  }

  private createDefaultCalibration(): HapticCalibration {
    return {
      isCalibrated: false,
      calibrationDate: '',
      sensitivity: 1.0,
      threshold: 0.1,
      range: 1.0,
      precision: 0.8,
      userPreferences: {
        globalIntensity: 0.8,
        frequencyAdjustment: 0,
        spatialSensitivity: 1.0,
        comfortSettings: {
          maxIntensity: 1.0,
          maxDuration: 10000,
          maxFrequency: 1000,
          restPeriods: false,
          fadeIn: false,
          fadeOut: false,
          safetyLimits: true,
        },
        accessibility: {
          enhancedIntensity: false,
          visualIndicators: false,
          audioIndicators: false,
          alternativePatterns: false,
          simplifiedControls: false,
          customMappings: {},
        },
        personalizedSettings: {
          learningEnabled: false,
          adaptiveIntensity: false,
          contextAwareness: false,
          emotionalMapping: {
            enabled: false,
            mappings: {},
            intensity: 0.5,
            context: [],
          },
          biometricAdaptation: {
            enabled: false,
            heartRate: false,
            skinConductance: false,
            temperature: false,
            stress: false,
            fatigue: false,
          },
        },
      },
      deviceSpecific: {},
    };
  }

  private createDefaultLimits(): HapticLimits {
    return {
      maxConcurrentPatterns: 4,
      maxPatternDuration: 10000,
      maxIntensity: 1.0,
      maxFrequency: 1000,
      thermalLimit: 40,
      powerLimit: 100,
      bandwidthLimit: 1000,
    };
  }

  private generatePatternId(): string {
    return `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSequenceId(): string {
    return `sequence_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generatePlaybackId(): string {
    return `playback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const hapticFeedbackService = HapticFeedbackService.getInstance();

// Helper functions
export const initializeHaptics = async (config?: Partial<HapticConfig>) => {
  return hapticFeedbackService.initialize(config);
};

export const createHapticPattern = async (
  name: string,
  type: HapticPatternType,
  options?: any
) => {
  return hapticFeedbackService.createPattern(name, type, options);
};

export const playHapticPattern = async (patternId: string, options?: any) => {
  return hapticFeedbackService.playPattern(patternId, options);
};

export const quickHapticFeedback = async (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error') => {
  return hapticFeedbackService.quickFeedback(type);
};

export const createHapticEvent = async (
  type: HapticEventType,
  trigger: HapticTrigger,
  patternId: string,
  options?: any
) => {
  return hapticFeedbackService.createEvent(type, trigger, patternId, options);
};

export const triggerHapticEvent = async (eventId: string, context?: any) => {
  return hapticFeedbackService.triggerEvent(eventId, context);
};

export default hapticFeedbackService;