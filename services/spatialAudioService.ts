import { EventEmitter } from 'eventemitter3';
import { logError, logDebug, withErrorHandling } from '@/utils/errorHandler';
import { mobileHardwareService } from './mobileHardwareService';
import * as Audio from 'expo-av';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

export interface SpatialAudioSource {
  id: string;
  name: string;
  type: AudioSourceType;
  url: string;
  position: Vector3D;
  rotation: Vector3D;
  velocity: Vector3D;
  properties: AudioSourceProperties;
  state: AudioSourceState;
  effects: AudioEffect[];
  metadata: AudioSourceMetadata;
  analytics: AudioSourceAnalytics;
  created: string;
  updated: string;
}

export type AudioSourceType = 
  | 'stream'
  | 'music'
  | 'ambient'
  | 'effect'
  | 'voice'
  | 'notification'
  | 'system'
  | 'interactive'
  | 'spatial_stream'
  | 'binaural'
  | 'ambisonics'
  | 'custom';

export interface AudioSourceProperties {
  volume: number;
  pitch: number;
  pan: number;
  gain: number;
  loop: boolean;
  autoPlay: boolean;
  fadeIn: number;
  fadeOut: number;
  delay: number;
  offset: number;
  playbackRate: number;
  preservesPitch: boolean;
  quality: AudioQuality;
  format: AudioFormat;
  spatialization: SpatializationSettings;
  occlusion: OcclusionSettings;
  reverb: ReverbSettings;
  doppler: DopplerSettings;
  attenuation: AttenuationSettings;
}

export type AudioQuality = 'low' | 'medium' | 'high' | 'lossless';
export type AudioFormat = 'mp3' | 'aac' | 'wav' | 'flac' | 'opus' | 'ogg' | 'webm';

export interface SpatializationSettings {
  enabled: boolean;
  algorithm: SpatializationAlgorithm;
  hrtfProfile: HRTFProfile;
  roomScale: number;
  distanceModel: DistanceModel;
  rolloffFactor: number;
  maxDistance: number;
  referenceDistance: number;
  coneInnerAngle: number;
  coneOuterAngle: number;
  coneOuterGain: number;
  directivity: DirectivityPattern;
  interpolation: InterpolationMethod;
}

export type SpatializationAlgorithm = 
  | 'hrtf'
  | 'binaural'
  | 'ambisonics'
  | 'vector_base_amplitude_panning'
  | 'wave_field_synthesis'
  | 'convolution_reverb'
  | 'frequency_domain'
  | 'time_domain';

export type HRTFProfile = 
  | 'generic'
  | 'personalized'
  | 'kemar'
  | 'mit'
  | 'iem'
  | 'sadie'
  | 'custom';

export type DistanceModel = 
  | 'none'
  | 'inverse'
  | 'inverse_clamped'
  | 'linear'
  | 'linear_clamped'
  | 'exponential'
  | 'exponential_clamped';

export type DirectivityPattern = 
  | 'omnidirectional'
  | 'cardioid'
  | 'bidirectional'
  | 'hypercardioid'
  | 'supercardioid'
  | 'shotgun'
  | 'custom';

export type InterpolationMethod = 
  | 'linear'
  | 'cubic'
  | 'spline'
  | 'lagrange'
  | 'sinc';

export interface OcclusionSettings {
  enabled: boolean;
  method: OcclusionMethod;
  strength: number;
  frequency: number;
  raycastResolution: number;
  updateRate: number;
  materials: AudioMaterial[];
  portals: AudioPortal[];
  dynamicGeometry: boolean;
}

export type OcclusionMethod = 
  | 'raycast'
  | 'portal'
  | 'diffraction'
  | 'scattering'
  | 'hybrid';

export interface AudioMaterial {
  id: string;
  name: string;
  absorption: number[];
  transmission: number[];
  scattering: number;
  density: number;
  roughness: number;
}

export interface AudioPortal {
  id: string;
  name: string;
  position: Vector3D;
  size: Vector3D;
  transmission: number;
  diffraction: number;
  isOpen: boolean;
}

export interface ReverbSettings {
  enabled: boolean;
  type: ReverbType;
  roomSize: number;
  damping: number;
  wetLevel: number;
  dryLevel: number;
  preDelay: number;
  width: number;
  freezeMode: boolean;
  earlyReflections: EarlyReflectionSettings;
  lateReverb: LateReverbSettings;
  convolution: ConvolutionSettings;
}

export type ReverbType = 
  | 'algorithmic'
  | 'convolution'
  | 'hybrid'
  | 'physical'
  | 'procedural';

export interface EarlyReflectionSettings {
  enabled: boolean;
  level: number;
  delay: number;
  pattern: ReflectionPattern;
  roomGeometry: RoomGeometry;
}

export type ReflectionPattern = 
  | 'simple'
  | 'complex'
  | 'realistic'
  | 'custom';

export interface RoomGeometry {
  width: number;
  height: number;
  depth: number;
  wallMaterials: AudioMaterial[];
  shape: RoomShape;
}

export type RoomShape = 
  | 'rectangular'
  | 'circular'
  | 'irregular'
  | 'outdoor';

export interface LateReverbSettings {
  enabled: boolean;
  level: number;
  time: number;
  diffusion: number;
  density: number;
  highCut: number;
  lowCut: number;
  modulation: ModulationSettings;
}

export interface ModulationSettings {
  enabled: boolean;
  rate: number;
  depth: number;
  type: ModulationType;
}

export type ModulationType = 
  | 'chorus'
  | 'flanger'
  | 'phaser'
  | 'tremolo'
  | 'vibrato';

export interface ConvolutionSettings {
  enabled: boolean;
  impulseResponse: string;
  wetLevel: number;
  dryLevel: number;
  preDelay: number;
  stretch: number;
  reverse: boolean;
}

export interface DopplerSettings {
  enabled: boolean;
  factor: number;
  threshold: number;
  smoothing: number;
  maxShift: number;
  speedOfSound: number;
}

export interface AttenuationSettings {
  enabled: boolean;
  curve: AttenuationCurve;
  nearDistance: number;
  farDistance: number;
  nearGain: number;
  farGain: number;
  logarithmic: boolean;
  customCurve?: number[];
}

export type AttenuationCurve = 
  | 'linear'
  | 'logarithmic'
  | 'exponential'
  | 'inverse'
  | 'custom';

export interface AudioSourceState {
  isPlaying: boolean;
  isPaused: boolean;
  isLoaded: boolean;
  isBuffering: boolean;
  currentTime: number;
  duration: number;
  bufferedTime: number;
  loadProgress: number;
  error: string | null;
  networkState: NetworkState;
  readyState: ReadyState;
}

export type NetworkState = 'empty' | 'idle' | 'loading' | 'no_source';
export type ReadyState = 'nothing' | 'metadata' | 'current_data' | 'future_data' | 'enough_data';

export interface AudioSourceMetadata {
  title: string;
  artist: string;
  album: string;
  genre: string;
  duration: number;
  bitrate: number;
  sampleRate: number;
  channels: number;
  format: string;
  codec: string;
  tags: Record<string, string>;
}

export interface AudioSourceAnalytics {
  playCount: number;
  totalPlayTime: number;
  averageVolume: number;
  peakVolume: number;
  frequencySpectrum: number[];
  spatialMovement: number;
  occlusionEvents: number;
  performanceMetrics: AudioPerformanceMetrics;
}

export interface AudioPerformanceMetrics {
  cpuUsage: number;
  memoryUsage: number;
  latency: number;
  bufferUnderruns: number;
  glitches: number;
  dropouts: number;
}

export interface AudioEffect {
  id: string;
  name: string;
  type: AudioEffectType;
  enabled: boolean;
  parameters: Record<string, number>;
  bypass: boolean;
  wetLevel: number;
  dryLevel: number;
  order: number;
}

export type AudioEffectType = 
  | 'equalizer'
  | 'compressor'
  | 'limiter'
  | 'gate'
  | 'distortion'
  | 'chorus'
  | 'flanger'
  | 'phaser'
  | 'delay'
  | 'reverb'
  | 'filter'
  | 'pitch_shift'
  | 'time_stretch'
  | 'formant'
  | 'vocoder'
  | 'harmonizer'
  | 'exciter'
  | 'enhancer'
  | 'stereo_widener'
  | 'spatializer'
  | 'custom';

export interface AudioListener {
  id: string;
  position: Vector3D;
  rotation: Vector3D;
  velocity: Vector3D;
  forward: Vector3D;
  up: Vector3D;
  properties: AudioListenerProperties;
  headTracking: HeadTrackingSettings;
  personalization: PersonalizationSettings;
  calibration: CalibrationSettings;
}

export interface AudioListenerProperties {
  masterVolume: number;
  dopplerFactor: number;
  speedOfSound: number;
  environmentSize: number;
  headSize: number;
  earDistance: number;
  roomCorrection: boolean;
  crossfeed: CrossfeedSettings;
  virtualization: VirtualizationSettings;
}

export interface CrossfeedSettings {
  enabled: boolean;
  amount: number;
  cutoff: number;
  feedback: number;
}

export interface VirtualizationSettings {
  enabled: boolean;
  type: VirtualizationType;
  speakerLayout: SpeakerLayout;
  roomSize: number;
  listenerDistance: number;
}

export type VirtualizationType = 
  | 'headphones'
  | 'speakers'
  | 'surround'
  | 'binaural'
  | 'transaural';

export type SpeakerLayout = 
  | 'stereo'
  | 'quad'
  | 'surround_5_1'
  | 'surround_7_1'
  | 'atmos'
  | 'custom';

export interface HeadTrackingSettings {
  enabled: boolean;
  method: HeadTrackingMethod;
  sensitivity: number;
  smoothing: number;
  prediction: number;
  compensation: boolean;
  calibration: boolean;
}

export type HeadTrackingMethod = 
  | 'imu'
  | 'camera'
  | 'marker'
  | 'optical'
  | 'magnetic'
  | 'hybrid';

export interface PersonalizationSettings {
  enabled: boolean;
  hrtfProfile: HRTFProfile;
  earMeasurements: EarMeasurements;
  listeningPreferences: ListeningPreferences;
  hearingProfile: HearingProfile;
}

export interface EarMeasurements {
  earWidth: number;
  earHeight: number;
  earDepth: number;
  canalLength: number;
  canalDiameter: number;
  pinnaAngle: number;
}

export interface ListeningPreferences {
  preferredVolume: number;
  frequencyResponse: number[];
  spatialPreference: SpatialPreference;
  comfortSettings: ComfortSettings;
}

export type SpatialPreference = 
  | 'natural'
  | 'enhanced'
  | 'focused'
  | 'wide'
  | 'intimate';

export interface ComfortSettings {
  fatigueReduction: boolean;
  listeningSafetyLimit: number;
  adaptiveVolume: boolean;
  intelligibilityBoost: boolean;
}

export interface HearingProfile {
  leftEar: EarProfile;
  rightEar: EarProfile;
  overallSensitivity: number;
  frequencyLoss: number[];
  tinnitusMasking: boolean;
}

export interface EarProfile {
  sensitivity: number;
  frequencyResponse: number[];
  threshold: number[];
  recruitment: boolean;
  asymmetry: number;
}

export interface CalibrationSettings {
  roomCorrection: RoomCorrectionSettings;
  speakerCalibration: SpeakerCalibrationSettings;
  headphoneCalibration: HeadphoneCalibrationSettings;
  microphoneCalibration: MicrophoneCalibrationSettings;
}

export interface RoomCorrectionSettings {
  enabled: boolean;
  method: RoomCorrectionMethod;
  measurements: RoomMeasurement[];
  filters: RoomCorrectionFilter[];
  targetCurve: number[];
}

export type RoomCorrectionMethod = 
  | 'manual'
  | 'automatic'
  | 'microphone'
  | 'sweep'
  | 'noise';

export interface RoomMeasurement {
  position: Vector3D;
  response: number[];
  reverbTime: number;
  clarity: number;
  definition: number;
}

export interface RoomCorrectionFilter {
  frequency: number;
  gain: number;
  q: number;
  type: FilterType;
}

export type FilterType = 
  | 'peak'
  | 'notch'
  | 'highpass'
  | 'lowpass'
  | 'bandpass'
  | 'highshelf'
  | 'lowshelf'
  | 'allpass';

export interface SpeakerCalibrationSettings {
  enabled: boolean;
  speakers: SpeakerConfiguration[];
  delays: number[];
  gains: number[];
  crossovers: CrossoverSettings[];
  timeAlignment: boolean;
}

export interface SpeakerConfiguration {
  id: string;
  position: Vector3D;
  orientation: Vector3D;
  type: SpeakerType;
  frequency: FrequencyRange;
  power: number;
  impedance: number;
}

export type SpeakerType = 
  | 'full_range'
  | 'woofer'
  | 'midrange'
  | 'tweeter'
  | 'subwoofer'
  | 'satellite';

export interface FrequencyRange {
  min: number;
  max: number;
  response: number[];
}

export interface CrossoverSettings {
  frequency: number;
  slope: number;
  type: CrossoverType;
}

export type CrossoverType = 
  | 'butterworth'
  | 'chebyshev'
  | 'elliptic'
  | 'bessel'
  | 'linkwitz_riley';

export interface HeadphoneCalibrationSettings {
  enabled: boolean;
  model: string;
  response: number[];
  compensation: number[];
  targetCurve: number[];
  leakageCompensation: boolean;
}

export interface MicrophoneCalibrationSettings {
  enabled: boolean;
  sensitivity: number;
  response: number[];
  noiseFloor: number;
  maxSPL: number;
  phantomPower: boolean;
}

export interface SpatialAudioEnvironment {
  id: string;
  name: string;
  type: EnvironmentType;
  geometry: EnvironmentGeometry;
  acoustics: EnvironmentAcoustics;
  materials: AudioMaterial[];
  zones: AudioZone[];
  effects: EnvironmentEffect[];
  settings: EnvironmentSettings;
  metadata: EnvironmentMetadata;
}

export type EnvironmentType = 
  | 'indoor'
  | 'outdoor'
  | 'virtual'
  | 'mixed'
  | 'anechoic'
  | 'reverberant';

export interface EnvironmentGeometry {
  bounds: BoundingBox;
  mesh: GeometryMesh;
  obstacles: Obstacle[];
  surfaces: Surface[];
  volumes: Volume[];
}

export interface BoundingBox {
  min: Vector3D;
  max: Vector3D;
  center: Vector3D;
  size: Vector3D;
}

export interface GeometryMesh {
  vertices: Vector3D[];
  faces: number[][];
  normals: Vector3D[];
  materials: number[];
}

export interface Obstacle {
  id: string;
  position: Vector3D;
  size: Vector3D;
  rotation: Vector3D;
  material: string;
  type: ObstacleType;
}

export type ObstacleType = 
  | 'wall'
  | 'pillar'
  | 'furniture'
  | 'barrier'
  | 'partition'
  | 'custom';

export interface Surface {
  id: string;
  vertices: Vector3D[];
  normal: Vector3D;
  material: string;
  area: number;
  roughness: number;
}

export interface Volume {
  id: string;
  bounds: BoundingBox;
  material: string;
  density: number;
  temperature: number;
  humidity: number;
}

export interface EnvironmentAcoustics {
  reverbTime: number;
  clarity: number;
  definition: number;
  warmth: number;
  spaciousness: number;
  envelopment: number;
  intimacy: number;
  loudness: number;
  noiseLevel: number;
  frequencyResponse: number[];
}

export interface AudioZone {
  id: string;
  name: string;
  bounds: BoundingBox;
  properties: ZoneProperties;
  effects: AudioEffect[];
  sources: string[];
  priority: number;
}

export interface ZoneProperties {
  volume: number;
  reverbTime: number;
  damping: number;
  occlusion: number;
  transmission: number;
  isolation: boolean;
  spatialization: boolean;
}

export interface EnvironmentEffect {
  id: string;
  name: string;
  type: EnvironmentEffectType;
  enabled: boolean;
  parameters: Record<string, number>;
  coverage: EffectCoverage;
}

export type EnvironmentEffectType = 
  | 'global_reverb'
  | 'wind'
  | 'rain'
  | 'echo'
  | 'ambience'
  | 'doppler'
  | 'reflection'
  | 'diffraction'
  | 'scattering';

export interface EffectCoverage {
  type: CoverageType;
  area: BoundingBox;
  falloff: number;
  intensity: number;
}

export type CoverageType = 
  | 'global'
  | 'zone'
  | 'point'
  | 'line'
  | 'area'
  | 'volume';

export interface EnvironmentSettings {
  quality: AudioQuality;
  updateRate: number;
  maxSources: number;
  cullingDistance: number;
  lodEnabled: boolean;
  occlusionEnabled: boolean;
  reverbEnabled: boolean;
  dopplerEnabled: boolean;
  adaptiveQuality: boolean;
  powerOptimization: boolean;
}

export interface EnvironmentMetadata {
  created: string;
  updated: string;
  version: string;
  author: string;
  description: string;
  tags: string[];
  category: string;
  license: string;
  credits: string[];
}

export interface SpatialAudioConfig {
  engine: AudioEngine;
  quality: AudioQuality;
  maxSources: number;
  maxDistance: number;
  updateRate: number;
  bufferSize: number;
  sampleRate: number;
  bitDepth: number;
  channels: number;
  latency: AudioLatency;
  spatialization: SpatializationAlgorithm;
  hrtfProfile: HRTFProfile;
  occlusionEnabled: boolean;
  reverbEnabled: boolean;
  dopplerEnabled: boolean;
  headTrackingEnabled: boolean;
  roomCorrectionEnabled: boolean;
  adaptiveQuality: boolean;
  powerOptimization: boolean;
  debugMode: boolean;
}

export type AudioEngine = 
  | 'web_audio'
  | 'core_audio'
  | 'open_al'
  | 'wwise'
  | 'fmod'
  | 'steam_audio'
  | 'resonance_audio'
  | 'custom';

export type AudioLatency = 
  | 'ultra_low'
  | 'low'
  | 'normal'
  | 'high'
  | 'adaptive';

class SpatialAudioService extends EventEmitter {
  private static instance: SpatialAudioService;
  private isInitialized: boolean = false;
  private audioContext: any = null;
  private listener: AudioListener | null = null;
  private sources: Map<string, SpatialAudioSource> = new Map();
  private environment: SpatialAudioEnvironment | null = null;
  private config: SpatialAudioConfig;
  private audioEngine: any = null;
  private spatialProcessor: any = null;
  private hrtfProcessor: any = null;
  private reverbProcessor: any = null;
  private occlusionProcessor: any = null;
  private performanceMonitor: any = null;
  private headTracker: any = null;
  private roomCorrector: any = null;

  private readonly defaultConfig: SpatialAudioConfig = {
    engine: 'web_audio',
    quality: 'high',
    maxSources: 32,
    maxDistance: 100,
    updateRate: 60,
    bufferSize: 512,
    sampleRate: 48000,
    bitDepth: 24,
    channels: 2,
    latency: 'low',
    spatialization: 'hrtf',
    hrtfProfile: 'generic',
    occlusionEnabled: true,
    reverbEnabled: true,
    dopplerEnabled: true,
    headTrackingEnabled: true,
    roomCorrectionEnabled: false,
    adaptiveQuality: true,
    powerOptimization: true,
    debugMode: false,
  };

  private constructor() {
    super();
    this.config = { ...this.defaultConfig };
    this.setupEventHandlers();
  }

  static getInstance(): SpatialAudioService {
    if (!SpatialAudioService.instance) {
      SpatialAudioService.instance = new SpatialAudioService();
    }
    return SpatialAudioService.instance;
  }

  /**
   * Initialize spatial audio service
   */
  async initialize(config?: Partial<SpatialAudioConfig>): Promise<void> {
    return withErrorHandling(async () => {
      logDebug('Initializing spatial audio service...');

      if (config) {
        this.config = { ...this.config, ...config };
      }

      // Check audio capabilities
      const capabilities = await this.checkAudioCapabilities();
      if (!capabilities.isSpatialAudioSupported) {
        throw new Error('Spatial audio not supported on this device');
      }

      // Initialize audio context
      await this.initializeAudioContext();

      // Initialize audio engine
      await this.initializeAudioEngine();

      // Initialize spatial processor
      await this.initializeSpatialProcessor();

      // Initialize HRTF processor
      await this.initializeHRTFProcessor();

      // Initialize reverb processor
      if (this.config.reverbEnabled) {
        await this.initializeReverbProcessor();
      }

      // Initialize occlusion processor
      if (this.config.occlusionEnabled) {
        await this.initializeOcclusionProcessor();
      }

      // Initialize listener
      await this.initializeListener();

      // Initialize head tracking
      if (this.config.headTrackingEnabled) {
        await this.initializeHeadTracking();
      }

      // Initialize room correction
      if (this.config.roomCorrectionEnabled) {
        await this.initializeRoomCorrection();
      }

      // Start performance monitoring
      this.startPerformanceMonitoring();

      this.isInitialized = true;
      this.emit('initialized', { capabilities, config: this.config });

      logDebug('Spatial audio service initialized successfully');
    }, { component: 'SpatialAudioService', action: 'initialize' });
  }

  /**
   * Create spatial audio source
   */
  async createAudioSource(
    id: string,
    url: string,
    position: Vector3D,
    options?: {
      type?: AudioSourceType;
      properties?: Partial<AudioSourceProperties>;
      effects?: AudioEffect[];
      autoPlay?: boolean;
    }
  ): Promise<SpatialAudioSource> {
    return withErrorHandling(async () => {
      if (!this.isInitialized) {
        throw new Error('Spatial audio service not initialized');
      }

      const source: SpatialAudioSource = {
        id,
        name: options?.type || 'Audio Source',
        type: options?.type || 'stream',
        url,
        position,
        rotation: { x: 0, y: 0, z: 0 },
        velocity: { x: 0, y: 0, z: 0 },
        properties: this.createDefaultSourceProperties(options?.properties),
        state: this.createDefaultSourceState(),
        effects: options?.effects || [],
        metadata: this.createDefaultSourceMetadata(),
        analytics: this.createDefaultSourceAnalytics(),
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      };

      // Load audio
      await this.loadAudioSource(source);

      // Setup spatialization
      await this.setupSourceSpatialization(source);

      // Setup effects
      await this.setupSourceEffects(source);

      // Add to sources collection
      this.sources.set(id, source);

      // Auto play if requested
      if (options?.autoPlay) {
        await this.playSource(id);
      }

      this.emit('source_created', source);
      return source;
    }, { component: 'SpatialAudioService', action: 'createAudioSource' });
  }

  /**
   * Play audio source
   */
  async playSource(sourceId: string): Promise<void> {
    return withErrorHandling(async () => {
      const source = this.sources.get(sourceId);
      if (!source) {
        throw new Error(`Audio source ${sourceId} not found`);
      }

      if (source.state.isPlaying) {
        return;
      }

      source.state.isPlaying = true;
      source.state.isPaused = false;
      source.analytics.playCount++;

      await this.audioEngine.playSource(source);
      this.emit('source_started', source);
    }, { component: 'SpatialAudioService', action: 'playSource' });
  }

  /**
   * Pause audio source
   */
  async pauseSource(sourceId: string): Promise<void> {
    return withErrorHandling(async () => {
      const source = this.sources.get(sourceId);
      if (!source) {
        throw new Error(`Audio source ${sourceId} not found`);
      }

      if (!source.state.isPlaying) {
        return;
      }

      source.state.isPlaying = false;
      source.state.isPaused = true;

      await this.audioEngine.pauseSource(source);
      this.emit('source_paused', source);
    }, { component: 'SpatialAudioService', action: 'pauseSource' });
  }

  /**
   * Stop audio source
   */
  async stopSource(sourceId: string): Promise<void> {
    return withErrorHandling(async () => {
      const source = this.sources.get(sourceId);
      if (!source) {
        throw new Error(`Audio source ${sourceId} not found`);
      }

      source.state.isPlaying = false;
      source.state.isPaused = false;
      source.state.currentTime = 0;

      await this.audioEngine.stopSource(source);
      this.emit('source_stopped', source);
    }, { component: 'SpatialAudioService', action: 'stopSource' });
  }

  /**
   * Remove audio source
   */
  async removeSource(sourceId: string): Promise<void> {
    return withErrorHandling(async () => {
      const source = this.sources.get(sourceId);
      if (!source) {
        return;
      }

      // Stop if playing
      if (source.state.isPlaying) {
        await this.stopSource(sourceId);
      }

      // Cleanup audio resources
      await this.cleanupAudioSource(source);

      // Remove from collection
      this.sources.delete(sourceId);

      this.emit('source_removed', source);
    }, { component: 'SpatialAudioService', action: 'removeSource' });
  }

  /**
   * Update source position
   */
  async updateSourcePosition(sourceId: string, position: Vector3D, velocity?: Vector3D): Promise<void> {
    return withErrorHandling(async () => {
      const source = this.sources.get(sourceId);
      if (!source) {
        throw new Error(`Audio source ${sourceId} not found`);
      }

      source.position = position;
      if (velocity) {
        source.velocity = velocity;
      }
      source.updated = new Date().toISOString();

      // Update spatialization
      await this.updateSourceSpatialization(source);

      this.emit('source_moved', source);
    }, { component: 'SpatialAudioService', action: 'updateSourcePosition' });
  }

  /**
   * Update source properties
   */
  async updateSourceProperties(sourceId: string, properties: Partial<AudioSourceProperties>): Promise<void> {
    return withErrorHandling(async () => {
      const source = this.sources.get(sourceId);
      if (!source) {
        throw new Error(`Audio source ${sourceId} not found`);
      }

      source.properties = { ...source.properties, ...properties };
      source.updated = new Date().toISOString();

      await this.applySourceProperties(source);
      this.emit('source_properties_updated', source);
    }, { component: 'SpatialAudioService', action: 'updateSourceProperties' });
  }

  /**
   * Update listener position and orientation
   */
  async updateListener(
    position: Vector3D,
    rotation: Vector3D,
    velocity?: Vector3D
  ): Promise<void> {
    return withErrorHandling(async () => {
      if (!this.listener) {
        throw new Error('Audio listener not initialized');
      }

      this.listener.position = position;
      this.listener.rotation = rotation;
      if (velocity) {
        this.listener.velocity = velocity;
      }

      // Update forward and up vectors based on rotation
      this.listener.forward = this.rotationToForward(rotation);
      this.listener.up = this.rotationToUp(rotation);

      // Update spatial processor
      await this.spatialProcessor.updateListener(this.listener);

      // Update all source spatializations
      for (const source of this.sources.values()) {
        await this.updateSourceSpatialization(source);
      }

      this.emit('listener_updated', this.listener);
    }, { component: 'SpatialAudioService', action: 'updateListener' });
  }

  /**
   * Create spatial audio environment
   */
  async createEnvironment(
    name: string,
    type: EnvironmentType,
    options?: {
      geometry?: Partial<EnvironmentGeometry>;
      acoustics?: Partial<EnvironmentAcoustics>;
      settings?: Partial<EnvironmentSettings>;
    }
  ): Promise<SpatialAudioEnvironment> {
    return withErrorHandling(async () => {
      const environment: SpatialAudioEnvironment = {
        id: this.generateEnvironmentId(),
        name,
        type,
        geometry: this.createDefaultGeometry(options?.geometry),
        acoustics: this.createDefaultAcoustics(options?.acoustics),
        materials: this.createDefaultMaterials(),
        zones: [],
        effects: [],
        settings: this.createDefaultEnvironmentSettings(options?.settings),
        metadata: this.createDefaultEnvironmentMetadata(),
      };

      this.environment = environment;

      // Apply environment settings
      await this.applyEnvironmentSettings(environment);

      this.emit('environment_created', environment);
      return environment;
    }, { component: 'SpatialAudioService', action: 'createEnvironment' });
  }

  /**
   * Add audio zone to environment
   */
  async addAudioZone(
    name: string,
    bounds: BoundingBox,
    properties: Partial<ZoneProperties>
  ): Promise<AudioZone> {
    return withErrorHandling(async () => {
      if (!this.environment) {
        throw new Error('No active environment');
      }

      const zone: AudioZone = {
        id: this.generateZoneId(),
        name,
        bounds,
        properties: {
          volume: 1.0,
          reverbTime: 1.0,
          damping: 0.5,
          occlusion: 1.0,
          transmission: 0.1,
          isolation: false,
          spatialization: true,
          ...properties,
        },
        effects: [],
        sources: [],
        priority: 0,
      };

      this.environment.zones.push(zone);
      this.emit('zone_added', zone);

      return zone;
    }, { component: 'SpatialAudioService', action: 'addAudioZone' });
  }

  /**
   * Get all audio sources
   */
  getAudioSources(): SpatialAudioSource[] {
    return Array.from(this.sources.values());
  }

  /**
   * Get audio source by ID
   */
  getAudioSource(sourceId: string): SpatialAudioSource | null {
    return this.sources.get(sourceId) || null;
  }

  /**
   * Get current listener
   */
  getListener(): AudioListener | null {
    return this.listener;
  }

  /**
   * Get current environment
   */
  getEnvironment(): SpatialAudioEnvironment | null {
    return this.environment;
  }

  /**
   * Get source analytics
   */
  getSourceAnalytics(sourceId: string): AudioSourceAnalytics | null {
    const source = this.sources.get(sourceId);
    return source?.analytics || null;
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): any {
    return this.performanceMonitor?.getMetrics() || {
      cpuUsage: 0,
      memoryUsage: 0,
      latency: 0,
      activeSources: this.sources.size,
      bufferUnderruns: 0,
      dropouts: 0,
    };
  }

  /**
   * Enable/disable head tracking
   */
  async setHeadTrackingEnabled(enabled: boolean): Promise<void> {
    this.config.headTrackingEnabled = enabled;
    
    if (enabled && !this.headTracker) {
      await this.initializeHeadTracking();
    } else if (!enabled && this.headTracker) {
      await this.cleanupHeadTracking();
    }
  }

  /**
   * Enable/disable room correction
   */
  async setRoomCorrectionEnabled(enabled: boolean): Promise<void> {
    this.config.roomCorrectionEnabled = enabled;
    
    if (enabled && !this.roomCorrector) {
      await this.initializeRoomCorrection();
    } else if (!enabled && this.roomCorrector) {
      await this.cleanupRoomCorrection();
    }
  }

  /**
   * Calibrate HRTF profile
   */
  async calibrateHRTF(measurements: EarMeasurements): Promise<void> {
    return withErrorHandling(async () => {
      if (!this.hrtfProcessor) {
        throw new Error('HRTF processor not initialized');
      }

      await this.hrtfProcessor.calibrate(measurements);
      
      if (this.listener) {
        this.listener.personalization.earMeasurements = measurements;
      }

      this.emit('hrtf_calibrated', measurements);
    }, { component: 'SpatialAudioService', action: 'calibrateHRTF' });
  }

  /**
   * Dispose spatial audio service
   */
  async dispose(): Promise<void> {
    try {
      // Stop all sources
      for (const sourceId of this.sources.keys()) {
        await this.removeSource(sourceId);
      }

      // Cleanup processors
      await this.cleanupProcessors();

      // Cleanup tracking
      if (this.headTracker) {
        await this.cleanupHeadTracking();
      }

      // Cleanup room correction
      if (this.roomCorrector) {
        await this.cleanupRoomCorrection();
      }

      // Stop performance monitoring
      this.stopPerformanceMonitoring();

      // Cleanup audio context
      if (this.audioContext) {
        await this.audioContext.close();
        this.audioContext = null;
      }

      this.sources.clear();
      this.environment = null;
      this.listener = null;
      this.isInitialized = false;

      this.emit('disposed');
    } catch (error) {
      logError('Error disposing spatial audio service', error);
    }
  }

  // Private methods

  private async checkAudioCapabilities(): Promise<any> {
    const capabilities = mobileHardwareService.getCapabilities();
    const deviceInfo = {
      hasMicrophone: capabilities?.hasMicrophone || false,
      processorCount: capabilities?.processorCount || 4,
      totalMemory: capabilities?.totalMemory || 4096,
    };

    // Spatial audio support heuristics
    const isSpatialAudioSupported = 
      deviceInfo.processorCount >= 4 &&
      deviceInfo.totalMemory >= 2048;

    return {
      isSpatialAudioSupported,
      deviceInfo,
      supportedFormats: this.getSupportedAudioFormats(),
      supportedAlgorithms: this.getSupportedSpatializationAlgorithms(),
    };
  }

  private getSupportedAudioFormats(): AudioFormat[] {
    return ['mp3', 'aac', 'wav', 'opus'];
  }

  private getSupportedSpatializationAlgorithms(): SpatializationAlgorithm[] {
    return ['hrtf', 'binaural', 'vector_base_amplitude_panning'];
  }

  private async initializeAudioContext(): Promise<void> {
    // Initialize Web Audio API context
    const AudioContext = (global as any).AudioContext || (global as any).webkitAudioContext;
    
    if (AudioContext) {
      this.audioContext = new AudioContext({
        sampleRate: this.config.sampleRate,
        latencyHint: this.config.latency,
      });
    } else {
      // Fallback to Expo Audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: true,
      });
    }
  }

  private async initializeAudioEngine(): Promise<void> {
    this.audioEngine = {
      loadSource: async (source: SpatialAudioSource) => {
        // Load audio from URL
        return { duration: 0, isLoaded: true };
      },
      playSource: async (source: SpatialAudioSource) => {
        // Start audio playback
      },
      pauseSource: async (source: SpatialAudioSource) => {
        // Pause audio playback
      },
      stopSource: async (source: SpatialAudioSource) => {
        // Stop audio playback
      },
      updateSource: async (source: SpatialAudioSource) => {
        // Update audio source parameters
      },
      cleanupSource: async (source: SpatialAudioSource) => {
        // Cleanup audio resources
      },
    };
  }

  private async initializeSpatialProcessor(): Promise<void> {
    this.spatialProcessor = {
      initialize: async () => {
        // Initialize spatial audio processing
      },
      updateListener: async (listener: AudioListener) => {
        // Update listener position and orientation
      },
      updateSource: async (source: SpatialAudioSource) => {
        // Update source spatialization
      },
      setAlgorithm: async (algorithm: SpatializationAlgorithm) => {
        // Change spatialization algorithm
      },
    };
  }

  private async initializeHRTFProcessor(): Promise<void> {
    this.hrtfProcessor = {
      initialize: async (profile: HRTFProfile) => {
        // Initialize HRTF processing
      },
      calibrate: async (measurements: EarMeasurements) => {
        // Calibrate HRTF profile
      },
      setProfile: async (profile: HRTFProfile) => {
        // Set HRTF profile
      },
    };
  }

  private async initializeReverbProcessor(): Promise<void> {
    this.reverbProcessor = {
      initialize: async () => {
        // Initialize reverb processing
      },
      updateEnvironment: async (acoustics: EnvironmentAcoustics) => {
        // Update environmental reverb
      },
      setParameters: async (settings: ReverbSettings) => {
        // Set reverb parameters
      },
    };
  }

  private async initializeOcclusionProcessor(): Promise<void> {
    this.occlusionProcessor = {
      initialize: async () => {
        // Initialize occlusion processing
      },
      updateGeometry: async (geometry: EnvironmentGeometry) => {
        // Update occlusion geometry
      },
      calculateOcclusion: async (source: Vector3D, listener: Vector3D) => {
        // Calculate occlusion between source and listener
        return { occlusion: 0, transmission: 1 };
      },
    };
  }

  private async initializeListener(): Promise<void> {
    this.listener = {
      id: 'default_listener',
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      forward: { x: 0, y: 0, z: -1 },
      up: { x: 0, y: 1, z: 0 },
      properties: this.createDefaultListenerProperties(),
      headTracking: this.createDefaultHeadTrackingSettings(),
      personalization: this.createDefaultPersonalizationSettings(),
      calibration: this.createDefaultCalibrationSettings(),
    };
  }

  private async initializeHeadTracking(): Promise<void> {
    this.headTracker = {
      start: async () => {
        // Start head tracking using device sensors
        await mobileHardwareService.startSensorMonitoring(['accelerometer', 'gyroscope', 'magnetometer']);
        
        // Setup sensor event listeners
        mobileHardwareService.addEventListener('sensor:accelerometer', (event) => {
          this.handleHeadTrackingData('accelerometer', event.data);
        });

        mobileHardwareService.addEventListener('sensor:gyroscope', (event) => {
          this.handleHeadTrackingData('gyroscope', event.data);
        });

        mobileHardwareService.addEventListener('sensor:magnetometer', (event) => {
          this.handleHeadTrackingData('magnetometer', event.data);
        });
      },
      stop: async () => {
        await mobileHardwareService.stopSensorMonitoring();
      },
      calibrate: async () => {
        // Calibrate head tracking
      },
    };

    if (this.config.headTrackingEnabled) {
      await this.headTracker.start();
    }
  }

  private async initializeRoomCorrection(): Promise<void> {
    this.roomCorrector = {
      measure: async () => {
        // Perform room measurement
        return { response: [], reverbTime: 0.5 };
      },
      calibrate: async (measurements: RoomMeasurement[]) => {
        // Calculate room correction filters
        return [];
      },
      apply: async (filters: RoomCorrectionFilter[]) => {
        // Apply room correction
      },
    };
  }

  private setupEventHandlers(): void {
    this.on('source_created', (source) => {
      this.analyticsCollector?.trackSourceCreated(source);
    });

    this.on('source_started', (source) => {
      this.analyticsCollector?.trackSourceStarted(source);
    });

    this.on('source_moved', (source) => {
      this.analyticsCollector?.trackSourceMoved(source);
    });
  }

  private handleHeadTrackingData(sensorType: string, data: any): void {
    if (!this.listener) return;

    // Process sensor data and update listener orientation
    switch (sensorType) {
      case 'gyroscope':
        this.updateListenerRotation(data);
        break;
      case 'accelerometer':
        this.updateListenerPosition(data);
        break;
      case 'magnetometer':
        this.updateListenerHeading(data);
        break;
    }
  }

  private updateListenerRotation(gyroData: any): void {
    if (!this.listener) return;

    // Integrate gyroscope data to get rotation
    const dt = 1/60; // Assume 60Hz update rate
    this.listener.rotation.x += gyroData.x * dt;
    this.listener.rotation.y += gyroData.y * dt;
    this.listener.rotation.z += gyroData.z * dt;

    // Update forward and up vectors
    this.listener.forward = this.rotationToForward(this.listener.rotation);
    this.listener.up = this.rotationToUp(this.listener.rotation);

    this.emit('head_rotation_updated', this.listener.rotation);
  }

  private updateListenerPosition(accelData: any): void {
    if (!this.listener) return;

    // Process accelerometer data for position tracking
    // This is a simplified implementation
    this.emit('head_position_updated', this.listener.position);
  }

  private updateListenerHeading(magnetoData: any): void {
    if (!this.listener) return;

    // Use magnetometer for compass heading
    const heading = Math.atan2(magnetoData.y, magnetoData.x);
    this.listener.rotation.y = heading;

    this.emit('head_heading_updated', heading);
  }

  private rotationToForward(rotation: Vector3D): Vector3D {
    // Convert Euler angles to forward vector
    const { x, y, z } = rotation;
    return {
      x: Math.sin(y) * Math.cos(x),
      y: -Math.sin(x),
      z: -Math.cos(y) * Math.cos(x),
    };
  }

  private rotationToUp(rotation: Vector3D): Vector3D {
    // Convert Euler angles to up vector
    const { x, y, z } = rotation;
    return {
      x: Math.sin(y) * Math.sin(x),
      y: Math.cos(x),
      z: -Math.cos(y) * Math.sin(x),
    };
  }

  private async loadAudioSource(source: SpatialAudioSource): Promise<void> {
    try {
      source.state.isBuffering = true;
      const result = await this.audioEngine.loadSource(source);
      
      source.state.isLoaded = true;
      source.state.isBuffering = false;
      source.state.duration = result.duration;
      source.metadata.duration = result.duration;
      
      this.emit('source_loaded', source);
    } catch (error) {
      source.state.error = error.message;
      source.state.isBuffering = false;
      logError(`Failed to load audio source ${source.id}`, error);
    }
  }

  private async setupSourceSpatialization(source: SpatialAudioSource): Promise<void> {
    if (source.properties.spatialization.enabled) {
      await this.spatialProcessor.updateSource(source);
    }
  }

  private async updateSourceSpatialization(source: SpatialAudioSource): Promise<void> {
    if (source.properties.spatialization.enabled) {
      await this.spatialProcessor.updateSource(source);
    }
  }

  private async setupSourceEffects(source: SpatialAudioSource): Promise<void> {
    for (const effect of source.effects) {
      if (effect.enabled) {
        await this.applyEffect(source, effect);
      }
    }
  }

  private async applyEffect(source: SpatialAudioSource, effect: AudioEffect): Promise<void> {
    // Apply audio effect to source
  }

  private async applySourceProperties(source: SpatialAudioSource): Promise<void> {
    await this.audioEngine.updateSource(source);
  }

  private async cleanupAudioSource(source: SpatialAudioSource): Promise<void> {
    await this.audioEngine.cleanupSource(source);
  }

  private async applyEnvironmentSettings(environment: SpatialAudioEnvironment): Promise<void> {
    if (this.reverbProcessor) {
      await this.reverbProcessor.updateEnvironment(environment.acoustics);
    }

    if (this.occlusionProcessor) {
      await this.occlusionProcessor.updateGeometry(environment.geometry);
    }
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
          cpuUsage: 0.3,
          memoryUsage: 0.4,
          latency: 20,
          activeSources: this.sources.size,
          bufferUnderruns: 0,
          dropouts: 0,
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

  private async cleanupProcessors(): Promise<void> {
    this.spatialProcessor = null;
    this.hrtfProcessor = null;
    this.reverbProcessor = null;
    this.occlusionProcessor = null;
  }

  private async cleanupHeadTracking(): Promise<void> {
    if (this.headTracker) {
      await this.headTracker.stop();
      this.headTracker = null;
    }
  }

  private async cleanupRoomCorrection(): Promise<void> {
    this.roomCorrector = null;
  }

  // Helper methods for creating default configurations

  private createDefaultSourceProperties(properties?: Partial<AudioSourceProperties>): AudioSourceProperties {
    return {
      volume: 1.0,
      pitch: 1.0,
      pan: 0.0,
      gain: 1.0,
      loop: false,
      autoPlay: false,
      fadeIn: 0,
      fadeOut: 0,
      delay: 0,
      offset: 0,
      playbackRate: 1.0,
      preservesPitch: true,
      quality: 'high',
      format: 'aac',
      spatialization: {
        enabled: true,
        algorithm: 'hrtf',
        hrtfProfile: 'generic',
        roomScale: 1.0,
        distanceModel: 'inverse',
        rolloffFactor: 1.0,
        maxDistance: 100,
        referenceDistance: 1.0,
        coneInnerAngle: 360,
        coneOuterAngle: 360,
        coneOuterGain: 0.0,
        directivity: 'omnidirectional',
        interpolation: 'linear',
      },
      occlusion: {
        enabled: true,
        method: 'raycast',
        strength: 1.0,
        frequency: 1000,
        raycastResolution: 10,
        updateRate: 30,
        materials: [],
        portals: [],
        dynamicGeometry: false,
      },
      reverb: {
        enabled: true,
        type: 'algorithmic',
        roomSize: 0.5,
        damping: 0.5,
        wetLevel: 0.1,
        dryLevel: 0.9,
        preDelay: 0.02,
        width: 1.0,
        freezeMode: false,
        earlyReflections: {
          enabled: true,
          level: 0.3,
          delay: 0.01,
          pattern: 'simple',
          roomGeometry: {
            width: 10,
            height: 3,
            depth: 10,
            wallMaterials: [],
            shape: 'rectangular',
          },
        },
        lateReverb: {
          enabled: true,
          level: 0.2,
          time: 1.0,
          diffusion: 0.5,
          density: 0.5,
          highCut: 5000,
          lowCut: 200,
          modulation: {
            enabled: false,
            rate: 0.5,
            depth: 0.1,
            type: 'chorus',
          },
        },
        convolution: {
          enabled: false,
          impulseResponse: '',
          wetLevel: 0.3,
          dryLevel: 0.7,
          preDelay: 0,
          stretch: 1.0,
          reverse: false,
        },
      },
      doppler: {
        enabled: true,
        factor: 1.0,
        threshold: 0.1,
        smoothing: 0.8,
        maxShift: 2.0,
        speedOfSound: 343.0,
      },
      attenuation: {
        enabled: true,
        curve: 'inverse',
        nearDistance: 1.0,
        farDistance: 100.0,
        nearGain: 1.0,
        farGain: 0.0,
        logarithmic: false,
      },
      ...properties,
    };
  }

  private createDefaultSourceState(): AudioSourceState {
    return {
      isPlaying: false,
      isPaused: false,
      isLoaded: false,
      isBuffering: false,
      currentTime: 0,
      duration: 0,
      bufferedTime: 0,
      loadProgress: 0,
      error: null,
      networkState: 'empty',
      readyState: 'nothing',
    };
  }

  private createDefaultSourceMetadata(): AudioSourceMetadata {
    return {
      title: '',
      artist: '',
      album: '',
      genre: '',
      duration: 0,
      bitrate: 128,
      sampleRate: 44100,
      channels: 2,
      format: 'aac',
      codec: 'aac',
      tags: {},
    };
  }

  private createDefaultSourceAnalytics(): AudioSourceAnalytics {
    return {
      playCount: 0,
      totalPlayTime: 0,
      averageVolume: 0,
      peakVolume: 0,
      frequencySpectrum: [],
      spatialMovement: 0,
      occlusionEvents: 0,
      performanceMetrics: {
        cpuUsage: 0,
        memoryUsage: 0,
        latency: 0,
        bufferUnderruns: 0,
        glitches: 0,
        dropouts: 0,
      },
    };
  }

  private createDefaultListenerProperties(): AudioListenerProperties {
    return {
      masterVolume: 1.0,
      dopplerFactor: 1.0,
      speedOfSound: 343.0,
      environmentSize: 1.0,
      headSize: 0.2,
      earDistance: 0.15,
      roomCorrection: false,
      crossfeed: {
        enabled: false,
        amount: 0.3,
        cutoff: 700,
        feedback: 0.2,
      },
      virtualization: {
        enabled: false,
        type: 'headphones',
        speakerLayout: 'stereo',
        roomSize: 1.0,
        listenerDistance: 2.0,
      },
    };
  }

  private createDefaultHeadTrackingSettings(): HeadTrackingSettings {
    return {
      enabled: this.config.headTrackingEnabled,
      method: 'imu',
      sensitivity: 1.0,
      smoothing: 0.8,
      prediction: 0.02,
      compensation: true,
      calibration: false,
    };
  }

  private createDefaultPersonalizationSettings(): PersonalizationSettings {
    return {
      enabled: false,
      hrtfProfile: 'generic',
      earMeasurements: {
        earWidth: 0.065,
        earHeight: 0.06,
        earDepth: 0.025,
        canalLength: 0.025,
        canalDiameter: 0.008,
        pinnaAngle: 30,
      },
      listeningPreferences: {
        preferredVolume: 0.7,
        frequencyResponse: [],
        spatialPreference: 'natural',
        comfortSettings: {
          fatigueReduction: true,
          listeningSafetyLimit: 85,
          adaptiveVolume: false,
          intelligibilityBoost: false,
        },
      },
      hearingProfile: {
        leftEar: {
          sensitivity: 1.0,
          frequencyResponse: [],
          threshold: [],
          recruitment: false,
          asymmetry: 0,
        },
        rightEar: {
          sensitivity: 1.0,
          frequencyResponse: [],
          threshold: [],
          recruitment: false,
          asymmetry: 0,
        },
        overallSensitivity: 1.0,
        frequencyLoss: [],
        tinnitusMasking: false,
      },
    };
  }

  private createDefaultCalibrationSettings(): CalibrationSettings {
    return {
      roomCorrection: {
        enabled: false,
        method: 'automatic',
        measurements: [],
        filters: [],
        targetCurve: [],
      },
      speakerCalibration: {
        enabled: false,
        speakers: [],
        delays: [],
        gains: [],
        crossovers: [],
        timeAlignment: false,
      },
      headphoneCalibration: {
        enabled: false,
        model: '',
        response: [],
        compensation: [],
        targetCurve: [],
        leakageCompensation: false,
      },
      microphoneCalibration: {
        enabled: false,
        sensitivity: 1.0,
        response: [],
        noiseFloor: -60,
        maxSPL: 120,
        phantomPower: false,
      },
    };
  }

  private createDefaultGeometry(geometry?: Partial<EnvironmentGeometry>): EnvironmentGeometry {
    return {
      bounds: {
        min: { x: -50, y: -5, z: -50 },
        max: { x: 50, y: 10, z: 50 },
        center: { x: 0, y: 2.5, z: 0 },
        size: { x: 100, y: 15, z: 100 },
      },
      mesh: {
        vertices: [],
        faces: [],
        normals: [],
        materials: [],
      },
      obstacles: [],
      surfaces: [],
      volumes: [],
      ...geometry,
    };
  }

  private createDefaultAcoustics(acoustics?: Partial<EnvironmentAcoustics>): EnvironmentAcoustics {
    return {
      reverbTime: 1.2,
      clarity: 0.8,
      definition: 0.7,
      warmth: 0.6,
      spaciousness: 0.5,
      envelopment: 0.4,
      intimacy: 0.6,
      loudness: 0.7,
      noiseLevel: 0.1,
      frequencyResponse: [],
      ...acoustics,
    };
  }

  private createDefaultMaterials(): AudioMaterial[] {
    return [
      {
        id: 'concrete',
        name: 'Concrete',
        absorption: [0.01, 0.01, 0.02, 0.02, 0.02, 0.02],
        transmission: [0.01, 0.01, 0.01, 0.01, 0.01, 0.01],
        scattering: 0.1,
        density: 2400,
        roughness: 0.8,
      },
      {
        id: 'wood',
        name: 'Wood',
        absorption: [0.15, 0.11, 0.10, 0.07, 0.06, 0.07],
        transmission: [0.1, 0.08, 0.05, 0.03, 0.02, 0.02],
        scattering: 0.3,
        density: 600,
        roughness: 0.6,
      },
      {
        id: 'carpet',
        name: 'Carpet',
        absorption: [0.02, 0.06, 0.14, 0.37, 0.60, 0.65],
        transmission: [0.02, 0.02, 0.05, 0.1, 0.2, 0.3],
        scattering: 0.4,
        density: 200,
        roughness: 0.9,
      },
    ];
  }

  private createDefaultEnvironmentSettings(settings?: Partial<EnvironmentSettings>): EnvironmentSettings {
    return {
      quality: this.config.quality,
      updateRate: this.config.updateRate,
      maxSources: this.config.maxSources,
      cullingDistance: this.config.maxDistance,
      lodEnabled: true,
      occlusionEnabled: this.config.occlusionEnabled,
      reverbEnabled: this.config.reverbEnabled,
      dopplerEnabled: this.config.dopplerEnabled,
      adaptiveQuality: this.config.adaptiveQuality,
      powerOptimization: this.config.powerOptimization,
      ...settings,
    };
  }

  private createDefaultEnvironmentMetadata(): EnvironmentMetadata {
    return {
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      version: '1.0.0',
      author: 'system',
      description: 'Default spatial audio environment',
      tags: ['spatial', 'audio', 'environment'],
      category: 'general',
      license: 'MIT',
      credits: [],
    };
  }

  private generateEnvironmentId(): string {
    return `env_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateZoneId(): string {
    return `zone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const spatialAudioService = SpatialAudioService.getInstance();

// Helper functions
export const initializeSpatialAudio = async (config?: Partial<SpatialAudioConfig>) => {
  return spatialAudioService.initialize(config);
};

export const createAudioSource = async (
  id: string,
  url: string,
  position: Vector3D,
  options?: any
) => {
  return spatialAudioService.createAudioSource(id, url, position, options);
};

export const playAudioSource = async (sourceId: string) => {
  return spatialAudioService.playSource(sourceId);
};

export const pauseAudioSource = async (sourceId: string) => {
  return spatialAudioService.pauseSource(sourceId);
};

export const stopAudioSource = async (sourceId: string) => {
  return spatialAudioService.stopSource(sourceId);
};

export const updateAudioSourcePosition = async (sourceId: string, position: Vector3D, velocity?: Vector3D) => {
  return spatialAudioService.updateSourcePosition(sourceId, position, velocity);
};

export const updateAudioListener = async (position: Vector3D, rotation: Vector3D, velocity?: Vector3D) => {
  return spatialAudioService.updateListener(position, rotation, velocity);
};

export const createSpatialEnvironment = async (
  name: string,
  type: EnvironmentType,
  options?: any
) => {
  return spatialAudioService.createEnvironment(name, type, options);
};

export default spatialAudioService;