import { Platform, DeviceEventEmitter, NativeModules, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Camera from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as Audio from 'expo-av';
import * as Location from 'expo-location';
import * as Sensors from 'expo-sensors';
import * as Device from 'expo-device';
import * as Brightness from 'expo-brightness';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { performanceMonitor } from '../utils/performanceMonitor';

export interface HardwareCapabilities {
  hasCamera: boolean;
  hasFrontCamera: boolean;
  hasBackCamera: boolean;
  hasFlash: boolean;
  hasMicrophone: boolean;
  hasAccelerometer: boolean;
  hasGyroscope: boolean;
  hasMagnetometer: boolean;
  hasBarometer: boolean;
  hasProximitySensor: boolean;
  hasAmbientLightSensor: boolean;
  hasGPS: boolean;
  hasNFC: boolean;
  hasBluetooth: boolean;
  hasWiFi: boolean;
  hasCellular: boolean;
  hasBiometrics: boolean;
  hasHapticEngine: boolean;
  hasAdaptiveBrightness: boolean;
  hasAutoRotation: boolean;
  maxCameraResolution: string;
  supportedVideoFormats: string[];
  supportedAudioFormats: string[];
  processorCount: number;
  totalMemory: number;
  availableStorage: number;
  screenDensity: number;
  refreshRate: number;
}

export interface CameraConfig {
  quality: 'low' | 'medium' | 'high' | 'ultra';
  flashMode: 'off' | 'on' | 'auto' | 'torch';
  focusMode: 'auto' | 'manual' | 'macro' | 'infinity';
  whiteBalance: 'auto' | 'sunny' | 'cloudy' | 'shadow' | 'fluorescent' | 'incandescent';
  stabilization: boolean;
  zoom: number; // 1.0 to maxZoom
  enableAudio: boolean;
  format: 'mp4' | 'mov' | 'webm';
  frameRate: 24 | 30 | 60 | 120 | 240;
  bitrate: number; // kbps
}

export interface AudioConfig {
  sampleRate: 44100 | 48000 | 96000;
  bitDepth: 16 | 24 | 32;
  channels: 1 | 2; // mono or stereo
  quality: 'low' | 'medium' | 'high' | 'lossless';
  format: 'mp3' | 'aac' | 'wav' | 'flac';
  enableNoiseReduction: boolean;
  enableEchoCancellation: boolean;
  enableAutomaticGainControl: boolean;
  inputGain: number; // 0.0 to 1.0
  outputVolume: number; // 0.0 to 1.0
}

export interface SensorData {
  accelerometer: {
    x: number;
    y: number;
    z: number;
    timestamp: number;
  };
  gyroscope: {
    x: number;
    y: number;
    z: number;
    timestamp: number;
  };
  magnetometer: {
    x: number;
    y: number;
    z: number;
    timestamp: number;
  };
  barometer: {
    pressure: number; // hPa
    relativeAltitude: number; // meters
    timestamp: number;
  };
  ambientLight: {
    illuminance: number; // lux
    timestamp: number;
  };
  proximity: {
    distance: number; // cm
    isNear: boolean;
    timestamp: number;
  };
}

export interface LocationData {
  latitude: number;
  longitude: number;
  altitude: number;
  accuracy: number;
  speed: number; // m/s
  heading: number; // degrees
  timestamp: number;
}

export interface BiometricData {
  isAvailable: boolean;
  supportedTypes: ('fingerprint' | 'faceId' | 'iris' | 'voice')[];
  isEnrolled: boolean;
  securityLevel: 'none' | 'biometric_weak' | 'biometric_strong';
}

export interface HardwareEvent {
  type: 'camera' | 'audio' | 'sensor' | 'location' | 'biometric' | 'system';
  event: string;
  data: any;
  timestamp: number;
}

class MobileHardwareService {
  private static instance: MobileHardwareService;
  private capabilities: HardwareCapabilities | null = null;
  private cameraConfig: CameraConfig;
  private audioConfig: AudioConfig;
  private sensorData: SensorData;
  private locationData: LocationData | null = null;
  private biometricData: BiometricData | null = null;
  
  // Subscriptions and listeners
  private accelerometerSubscription: any = null;
  private gyroscopeSubscription: any = null;
  private magnetometerSubscription: any = null;
  private barometerSubscription: any = null;
  private locationSubscription: any = null;
  private orientationSubscription: any = null;
  private proximitySubscription: any = null;
  private ambientLightSubscription: any = null;
  
  // State management
  private isRecordingVideo: boolean = false;
  private isRecordingAudio: boolean = false;
  private isStreamingCamera: boolean = false;
  private isMonitoringSensors: boolean = false;
  private isTrackingLocation: boolean = false;
  
  // Event handlers
  private eventListeners: Map<string, Function[]> = new Map();
  private eventHistory: HardwareEvent[] = [];
  
  // Permissions cache
  private permissionsCache: Map<string, boolean> = new Map();

  private defaultCameraConfig: CameraConfig = {
    quality: 'high',
    flashMode: 'auto',
    focusMode: 'auto',
    whiteBalance: 'auto',
    stabilization: true,
    zoom: 1.0,
    enableAudio: true,
    format: 'mp4',
    frameRate: 30,
    bitrate: 5000,
  };

  private defaultAudioConfig: AudioConfig = {
    sampleRate: 44100,
    bitDepth: 16,
    channels: 2,
    quality: 'high',
    format: 'aac',
    enableNoiseReduction: true,
    enableEchoCancellation: true,
    enableAutomaticGainControl: true,
    inputGain: 0.8,
    outputVolume: 0.8,
  };

  private constructor() {
    this.cameraConfig = { ...this.defaultCameraConfig };
    this.audioConfig = { ...this.defaultAudioConfig };
    this.sensorData = this.getInitialSensorData();
    this.initializeService();
  }

  static getInstance(): MobileHardwareService {
    if (!MobileHardwareService.instance) {
      MobileHardwareService.instance = new MobileHardwareService();
    }
    return MobileHardwareService.instance;
  }

  private async initializeService(): Promise<void> {
    try {
      console.log('📱 Initializing mobile hardware service...');
      
      // Detect hardware capabilities
      await this.detectHardwareCapabilities();
      
      // Load saved configurations
      await this.loadConfigurations();
      
      // Initialize biometric data
      await this.initializeBiometrics();
      
      // Setup system event listeners
      this.setupSystemEventListeners();
      
      console.log('✅ Mobile hardware service initialized');
    } catch (error) {
      console.error('❌ Hardware service initialization failed:', error);
    }
  }

  private getInitialSensorData(): SensorData {
    return {
      accelerometer: { x: 0, y: 0, z: 0, timestamp: 0 },
      gyroscope: { x: 0, y: 0, z: 0, timestamp: 0 },
      magnetometer: { x: 0, y: 0, z: 0, timestamp: 0 },
      barometer: { pressure: 0, relativeAltitude: 0, timestamp: 0 },
      ambientLight: { illuminance: 0, timestamp: 0 },
      proximity: { distance: 0, isNear: false, timestamp: 0 },
    };
  }

  private async detectHardwareCapabilities(): Promise<void> {
    try {
      console.log('🔍 Detecting hardware capabilities...');
      
      // Camera capabilities
      const cameraPermission = await Camera.getCameraPermissionsAsync();
      const hasCamera = cameraPermission.status === 'granted' || cameraPermission.canAskAgain;
      
      // Audio capabilities
      const audioPermission = await Audio.getPermissionsAsync();
      const hasMicrophone = audioPermission.status === 'granted' || audioPermission.canAskAgain;
      
      // Location capabilities
      const locationPermission = await Location.getForegroundPermissionsAsync();
      const hasGPS = locationPermission.status === 'granted' || locationPermission.canAskAgain;
      
      // Sensor capabilities
      const hasAccelerometer = await Sensors.Accelerometer.isAvailableAsync();
      const hasGyroscope = await Sensors.Gyroscope.isAvailableAsync();
      const hasMagnetometer = await Sensors.Magnetometer.isAvailableAsync();
      const hasBarometer = await Sensors.Barometer.isAvailableAsync();
      
      // Biometric capabilities
      const biometricTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      const hasBiometrics = biometricTypes.length > 0;
      
      // Device info
      const deviceInfo = {
        brand: Device.brand,
        modelName: Device.modelName,
        osName: Device.osName,
        osVersion: Device.osVersion,
        platformApiLevel: Device.platformApiLevel,
        totalMemory: Device.totalMemory,
      };
      
      this.capabilities = {
        hasCamera,
        hasFrontCamera: hasCamera, // Assume both if camera available
        hasBackCamera: hasCamera,
        hasFlash: Platform.OS === 'ios' || Platform.Version >= 23,
        hasMicrophone,
        hasAccelerometer,
        hasGyroscope,
        hasMagnetometer,
        hasBarometer,
        hasProximitySensor: Platform.OS === 'ios' || Platform.Version >= 21,
        hasAmbientLightSensor: Platform.OS === 'ios' || Platform.Version >= 21,
        hasGPS,
        hasNFC: Platform.OS === 'android' && Platform.Version >= 19,
        hasBluetooth: true, // Most devices have Bluetooth
        hasWiFi: true, // Most devices have WiFi
        hasCellular: Device.deviceType === Device.DeviceType.PHONE,
        hasBiometrics,
        hasHapticEngine: Platform.OS === 'ios' || Platform.Version >= 26,
        hasAdaptiveBrightness: true,
        hasAutoRotation: true,
        maxCameraResolution: '4K', // Default assumption
        supportedVideoFormats: ['mp4', 'mov'],
        supportedAudioFormats: ['mp3', 'aac', 'wav'],
        processorCount: 8, // Default assumption
        totalMemory: deviceInfo.totalMemory || 4096, // MB
        availableStorage: 0, // Would need native implementation
        screenDensity: Platform.OS === 'ios' ? 3 : 2,
        refreshRate: 60, // Default assumption
      };
      
      console.log('✅ Hardware capabilities detected:', this.capabilities);
    } catch (error) {
      console.error('❌ Hardware capability detection failed:', error);
    }
  }

  private async initializeBiometrics(): Promise<void> {
    try {
      const isAvailable = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      const securityLevel = await LocalAuthentication.getEnrolledLevelAsync();
      
      this.biometricData = {
        isAvailable,
        supportedTypes: supportedTypes.map(type => {
          switch (type) {
            case LocalAuthentication.AuthenticationType.FINGERPRINT:
              return 'fingerprint';
            case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
              return 'faceId';
            case LocalAuthentication.AuthenticationType.IRIS:
              return 'iris';
            default:
              return 'fingerprint';
          }
        }),
        isEnrolled,
        securityLevel: securityLevel === LocalAuthentication.SecurityLevel.BIOMETRIC_STRONG ? 'biometric_strong' :
                      securityLevel === LocalAuthentication.SecurityLevel.BIOMETRIC_WEAK ? 'biometric_weak' : 'none',
      };
      
      console.log('🔐 Biometric data initialized:', this.biometricData);
    } catch (error) {
      console.error('❌ Biometric initialization failed:', error);
    }
  }

  private setupSystemEventListeners(): void {
    try {
      // Orientation change listener
      ScreenOrientation.addOrientationChangeListener((event) => {
        this.emitEvent('system', 'orientationChange', {
          orientation: event.orientationInfo.orientation,
          orientationLock: event.orientationInfo.orientationLock,
        });
      });
      
      // Battery level changes (if available)
      if (Platform.OS === 'android') {
        DeviceEventEmitter.addListener('batteryChanged', (data) => {
          this.emitEvent('system', 'batteryChanged', data);
        });
      }
      
      // Memory warnings
      DeviceEventEmitter.addListener('memoryWarning', (data) => {
        this.emitEvent('system', 'memoryWarning', data);
        performanceMonitor.trackComponentRender('memoryWarning', 0);
      });
      
      // Network state changes
      DeviceEventEmitter.addListener('networkStateChanged', (data) => {
        this.emitEvent('system', 'networkStateChanged', data);
      });
      
      console.log('🎧 System event listeners setup complete');
    } catch (error) {
      console.error('❌ System event listener setup failed:', error);
    }
  }

  // Camera Methods
  async requestCameraPermissions(): Promise<boolean> {
    try {
      const cacheKey = 'camera_permissions';
      const cached = this.permissionsCache.get(cacheKey);
      if (cached !== undefined) return cached;
      
      const permission = await Camera.requestCameraPermissionsAsync();
      const granted = permission.status === 'granted';
      
      this.permissionsCache.set(cacheKey, granted);
      return granted;
    } catch (error) {
      console.error('❌ Camera permission request failed:', error);
      return false;
    }
  }

  async startCamera(config?: Partial<CameraConfig>): Promise<boolean> {
    try {
      console.log('📸 Starting camera...');
      
      const hasPermission = await this.requestCameraPermissions();
      if (!hasPermission) {
        throw new Error('Camera permission not granted');
      }
      
      // Update camera config
      if (config) {
        this.cameraConfig = { ...this.cameraConfig, ...config };
      }
      
      this.isStreamingCamera = true;
      this.emitEvent('camera', 'started', this.cameraConfig);
      
      console.log('✅ Camera started successfully');
      return true;
    } catch (error) {
      console.error('❌ Camera start failed:', error);
      return false;
    }
  }

  async stopCamera(): Promise<void> {
    try {
      if (!this.isStreamingCamera) return;
      
      this.isStreamingCamera = false;
      this.emitEvent('camera', 'stopped', {});
      
      console.log('📸 Camera stopped');
    } catch (error) {
      console.error('❌ Camera stop failed:', error);
    }
  }

  async capturePhoto(options?: {
    quality?: number;
    base64?: boolean;
    skipProcessing?: boolean;
  }): Promise<{ uri: string; base64?: string; width: number; height: number }> {
    try {
      console.log('📷 Capturing photo...');
      
      if (!this.isStreamingCamera) {
        throw new Error('Camera not started');
      }
      
      // This would integrate with the actual camera component
      // For now, we'll simulate a photo capture
      const photo = {
        uri: `file://photo_${Date.now()}.jpg`,
        width: 1920,
        height: 1080,
        base64: options?.base64 ? 'simulated_base64_data' : undefined,
      };
      
      this.emitEvent('camera', 'photoCaptured', photo);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      console.log('✅ Photo captured successfully');
      return photo;
    } catch (error) {
      console.error('❌ Photo capture failed:', error);
      throw error;
    }
  }

  async startVideoRecording(): Promise<boolean> {
    try {
      console.log('🎥 Starting video recording...');
      
      if (!this.isStreamingCamera) {
        throw new Error('Camera not started');
      }
      
      if (this.isRecordingVideo) {
        throw new Error('Already recording video');
      }
      
      this.isRecordingVideo = true;
      this.emitEvent('camera', 'videoRecordingStarted', this.cameraConfig);
      
      console.log('✅ Video recording started');
      return true;
    } catch (error) {
      console.error('❌ Video recording start failed:', error);
      return false;
    }
  }

  async stopVideoRecording(): Promise<{ uri: string; duration: number; size: number }> {
    try {
      console.log('🎥 Stopping video recording...');
      
      if (!this.isRecordingVideo) {
        throw new Error('Not recording video');
      }
      
      this.isRecordingVideo = false;
      
      // Simulate video recording result
      const video = {
        uri: `file://video_${Date.now()}.mp4`,
        duration: 30000, // 30 seconds
        size: 50 * 1024 * 1024, // 50MB
      };
      
      this.emitEvent('camera', 'videoRecordingStopped', video);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      
      console.log('✅ Video recording stopped');
      return video;
    } catch (error) {
      console.error('❌ Video recording stop failed:', error);
      throw error;
    }
  }

  // Audio Methods
  async requestAudioPermissions(): Promise<boolean> {
    try {
      const cacheKey = 'audio_permissions';
      const cached = this.permissionsCache.get(cacheKey);
      if (cached !== undefined) return cached;
      
      const permission = await Audio.requestPermissionsAsync();
      const granted = permission.status === 'granted';
      
      this.permissionsCache.set(cacheKey, granted);
      return granted;
    } catch (error) {
      console.error('❌ Audio permission request failed:', error);
      return false;
    }
  }

  async startAudioRecording(config?: Partial<AudioConfig>): Promise<boolean> {
    try {
      console.log('🎤 Starting audio recording...');
      
      const hasPermission = await this.requestAudioPermissions();
      if (!hasPermission) {
        throw new Error('Audio permission not granted');
      }
      
      if (this.isRecordingAudio) {
        throw new Error('Already recording audio');
      }
      
      // Update audio config
      if (config) {
        this.audioConfig = { ...this.audioConfig, ...config };
      }
      
      // Set audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      
      this.isRecordingAudio = true;
      this.emitEvent('audio', 'recordingStarted', this.audioConfig);
      
      console.log('✅ Audio recording started');
      return true;
    } catch (error) {
      console.error('❌ Audio recording start failed:', error);
      return false;
    }
  }

  async stopAudioRecording(): Promise<{ uri: string; duration: number; size: number }> {
    try {
      console.log('🎤 Stopping audio recording...');
      
      if (!this.isRecordingAudio) {
        throw new Error('Not recording audio');
      }
      
      this.isRecordingAudio = false;
      
      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: false,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
      });
      
      // Simulate audio recording result
      const audio = {
        uri: `file://audio_${Date.now()}.${this.audioConfig.format}`,
        duration: 15000, // 15 seconds
        size: 5 * 1024 * 1024, // 5MB
      };
      
      this.emitEvent('audio', 'recordingStopped', audio);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      console.log('✅ Audio recording stopped');
      return audio;
    } catch (error) {
      console.error('❌ Audio recording stop failed:', error);
      throw error;
    }
  }

  // Sensor Methods
  async startSensorMonitoring(sensors: ('accelerometer' | 'gyroscope' | 'magnetometer' | 'barometer')[] = ['accelerometer']): Promise<boolean> {
    try {
      console.log('📊 Starting sensor monitoring...', sensors);
      
      if (this.isMonitoringSensors) {
        console.log('⚠️ Sensor monitoring already active');
        return true;
      }
      
      this.isMonitoringSensors = true;
      
      // Start accelerometer monitoring
      if (sensors.includes('accelerometer') && this.capabilities?.hasAccelerometer) {
        Sensors.Accelerometer.setUpdateInterval(100); // 10Hz
        this.accelerometerSubscription = Sensors.Accelerometer.addListener((data) => {
          this.sensorData.accelerometer = { ...data, timestamp: Date.now() };
          this.emitEvent('sensor', 'accelerometer', this.sensorData.accelerometer);
        });
      }
      
      // Start gyroscope monitoring
      if (sensors.includes('gyroscope') && this.capabilities?.hasGyroscope) {
        Sensors.Gyroscope.setUpdateInterval(100); // 10Hz
        this.gyroscopeSubscription = Sensors.Gyroscope.addListener((data) => {
          this.sensorData.gyroscope = { ...data, timestamp: Date.now() };
          this.emitEvent('sensor', 'gyroscope', this.sensorData.gyroscope);
        });
      }
      
      // Start magnetometer monitoring
      if (sensors.includes('magnetometer') && this.capabilities?.hasMagnetometer) {
        Sensors.Magnetometer.setUpdateInterval(100); // 10Hz
        this.magnetometerSubscription = Sensors.Magnetometer.addListener((data) => {
          this.sensorData.magnetometer = { ...data, timestamp: Date.now() };
          this.emitEvent('sensor', 'magnetometer', this.sensorData.magnetometer);
        });
      }
      
      // Start barometer monitoring
      if (sensors.includes('barometer') && this.capabilities?.hasBarometer) {
        Sensors.Barometer.setUpdateInterval(1000); // 1Hz
        this.barometerSubscription = Sensors.Barometer.addListener((data) => {
          this.sensorData.barometer = { 
            pressure: data.pressure,
            relativeAltitude: data.relativeAltitude || 0,
            timestamp: Date.now() 
          };
          this.emitEvent('sensor', 'barometer', this.sensorData.barometer);
        });
      }
      
      console.log('✅ Sensor monitoring started');
      return true;
    } catch (error) {
      console.error('❌ Sensor monitoring start failed:', error);
      return false;
    }
  }

  async stopSensorMonitoring(): Promise<void> {
    try {
      if (!this.isMonitoringSensors) return;
      
      this.isMonitoringSensors = false;
      
      // Stop all sensor subscriptions
      if (this.accelerometerSubscription) {
        this.accelerometerSubscription.remove();
        this.accelerometerSubscription = null;
      }
      
      if (this.gyroscopeSubscription) {
        this.gyroscopeSubscription.remove();
        this.gyroscopeSubscription = null;
      }
      
      if (this.magnetometerSubscription) {
        this.magnetometerSubscription.remove();
        this.magnetometerSubscription = null;
      }
      
      if (this.barometerSubscription) {
        this.barometerSubscription.remove();
        this.barometerSubscription = null;
      }
      
      console.log('📊 Sensor monitoring stopped');
    } catch (error) {
      console.error('❌ Sensor monitoring stop failed:', error);
    }
  }

  // Location Methods
  async requestLocationPermissions(): Promise<boolean> {
    try {
      const cacheKey = 'location_permissions';
      const cached = this.permissionsCache.get(cacheKey);
      if (cached !== undefined) return cached;
      
      const permission = await Location.requestForegroundPermissionsAsync();
      const granted = permission.status === 'granted';
      
      this.permissionsCache.set(cacheKey, granted);
      return granted;
    } catch (error) {
      console.error('❌ Location permission request failed:', error);
      return false;
    }
  }

  async startLocationTracking(accuracy: Location.Accuracy = Location.Accuracy.Balanced): Promise<boolean> {
    try {
      console.log('📍 Starting location tracking...');
      
      const hasPermission = await this.requestLocationPermissions();
      if (!hasPermission) {
        throw new Error('Location permission not granted');
      }
      
      if (this.isTrackingLocation) {
        console.log('⚠️ Location tracking already active');
        return true;
      }
      
      this.isTrackingLocation = true;
      
      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy,
          timeInterval: 5000, // 5 seconds
          distanceInterval: 10, // 10 meters
        },
        (location) => {
          this.locationData = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            altitude: location.coords.altitude || 0,
            accuracy: location.coords.accuracy || 0,
            speed: location.coords.speed || 0,
            heading: location.coords.heading || 0,
            timestamp: location.timestamp,
          };
          
          this.emitEvent('location', 'updated', this.locationData);
        }
      );
      
      console.log('✅ Location tracking started');
      return true;
    } catch (error) {
      console.error('❌ Location tracking start failed:', error);
      return false;
    }
  }

  async stopLocationTracking(): Promise<void> {
    try {
      if (!this.isTrackingLocation) return;
      
      this.isTrackingLocation = false;
      
      if (this.locationSubscription) {
        this.locationSubscription.remove();
        this.locationSubscription = null;
      }
      
      console.log('📍 Location tracking stopped');
    } catch (error) {
      console.error('❌ Location tracking stop failed:', error);
    }
  }

  async getCurrentLocation(): Promise<LocationData | null> {
    try {
      const hasPermission = await this.requestLocationPermissions();
      if (!hasPermission) {
        throw new Error('Location permission not granted');
      }
      
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        altitude: location.coords.altitude || 0,
        accuracy: location.coords.accuracy || 0,
        speed: location.coords.speed || 0,
        heading: location.coords.heading || 0,
        timestamp: location.timestamp,
      };
    } catch (error) {
      console.error('❌ Get current location failed:', error);
      return null;
    }
  }

  // Biometric Methods
  async authenticateWithBiometrics(options?: {
    promptMessage?: string;
    cancelLabel?: string;
    fallbackLabel?: string;
    disableDeviceFallback?: boolean;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔐 Starting biometric authentication...');
      
      if (!this.biometricData?.isAvailable) {
        return { success: false, error: 'Biometrics not available' };
      }
      
      if (!this.biometricData?.isEnrolled) {
        return { success: false, error: 'No biometrics enrolled' };
      }
      
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: options?.promptMessage || 'Authenticate to continue',
        cancelLabel: options?.cancelLabel || 'Cancel',
        fallbackLabel: options?.fallbackLabel || 'Use Passcode',
        disableDeviceFallback: options?.disableDeviceFallback || false,
      });
      
      if (result.success) {
        this.emitEvent('biometric', 'authenticated', { success: true });
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        console.log('✅ Biometric authentication successful');
        return { success: true };
      } else {
        this.emitEvent('biometric', 'authenticationFailed', { error: result.error });
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        console.log('❌ Biometric authentication failed:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ Biometric authentication error:', error);
      return { success: false, error: error.message };
    }
  }

  // Secure Storage Methods
  async storeSecurely(key: string, value: string): Promise<boolean> {
    try {
      await SecureStore.setItemAsync(key, value);
      console.log(`🔒 Secure storage: ${key} stored successfully`);
      return true;
    } catch (error) {
      console.error(`❌ Secure storage failed for ${key}:`, error);
      return false;
    }
  }

  async getSecurely(key: string): Promise<string | null> {
    try {
      const value = await SecureStore.getItemAsync(key);
      if (value) {
        console.log(`🔒 Secure storage: ${key} retrieved successfully`);
      }
      return value;
    } catch (error) {
      console.error(`❌ Secure retrieval failed for ${key}:`, error);
      return null;
    }
  }

  async deleteSecurely(key: string): Promise<boolean> {
    try {
      await SecureStore.deleteItemAsync(key);
      console.log(`🔒 Secure storage: ${key} deleted successfully`);
      return true;
    } catch (error) {
      console.error(`❌ Secure deletion failed for ${key}:`, error);
      return false;
    }
  }

  // System Control Methods
  async setBrightness(brightness: number): Promise<boolean> {
    try {
      if (brightness < 0 || brightness > 1) {
        throw new Error('Brightness must be between 0 and 1');
      }
      
      await Brightness.setBrightnessAsync(brightness);
      this.emitEvent('system', 'brightnessChanged', { brightness });
      
      console.log(`💡 Brightness set to ${Math.round(brightness * 100)}%`);
      return true;
    } catch (error) {
      console.error('❌ Set brightness failed:', error);
      return false;
    }
  }

  async getBrightness(): Promise<number> {
    try {
      const brightness = await Brightness.getBrightnessAsync();
      return brightness;
    } catch (error) {
      console.error('❌ Get brightness failed:', error);
      return 0.5; // Default fallback
    }
  }

  async setScreenOrientation(orientation: ScreenOrientation.OrientationLock): Promise<boolean> {
    try {
      await ScreenOrientation.lockAsync(orientation);
      this.emitEvent('system', 'orientationLocked', { orientation });
      
      console.log(`📱 Screen orientation locked to: ${orientation}`);
      return true;
    } catch (error) {
      console.error('❌ Set screen orientation failed:', error);
      return false;
    }
  }

  async unlockScreenOrientation(): Promise<boolean> {
    try {
      await ScreenOrientation.unlockAsync();
      this.emitEvent('system', 'orientationUnlocked', {});
      
      console.log('📱 Screen orientation unlocked');
      return true;
    } catch (error) {
      console.error('❌ Unlock screen orientation failed:', error);
      return false;
    }
  }

  // Event Management
  addEventListener(eventType: string, callback: Function): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(callback);
  }

  removeEventListener(eventType: string, callback: Function): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emitEvent(type: HardwareEvent['type'], event: string, data: any): void {
    const hardwareEvent: HardwareEvent = {
      type,
      event,
      data,
      timestamp: Date.now(),
    };
    
    // Add to event history
    this.eventHistory.push(hardwareEvent);
    if (this.eventHistory.length > 100) {
      this.eventHistory.shift(); // Keep only last 100 events
    }
    
    // Emit to listeners
    const eventKey = `${type}:${event}`;
    const listeners = this.eventListeners.get(eventKey);
    if (listeners) {
      listeners.forEach(callback => callback(hardwareEvent));
    }
    
    // Emit to global listeners
    const globalListeners = this.eventListeners.get('*');
    if (globalListeners) {
      globalListeners.forEach(callback => callback(hardwareEvent));
    }
  }

  // Configuration Management
  private async loadConfigurations(): Promise<void> {
    try {
      const cameraConfigStr = await AsyncStorage.getItem('hardware_camera_config');
      if (cameraConfigStr) {
        this.cameraConfig = { ...this.defaultCameraConfig, ...JSON.parse(cameraConfigStr) };
      }
      
      const audioConfigStr = await AsyncStorage.getItem('hardware_audio_config');
      if (audioConfigStr) {
        this.audioConfig = { ...this.defaultAudioConfig, ...JSON.parse(audioConfigStr) };
      }
      
      console.log('⚙️ Hardware configurations loaded');
    } catch (error) {
      console.error('❌ Failed to load configurations:', error);
    }
  }

  private async saveConfigurations(): Promise<void> {
    try {
      await AsyncStorage.setItem('hardware_camera_config', JSON.stringify(this.cameraConfig));
      await AsyncStorage.setItem('hardware_audio_config', JSON.stringify(this.audioConfig));
      
      console.log('⚙️ Hardware configurations saved');
    } catch (error) {
      console.error('❌ Failed to save configurations:', error);
    }
  }

  // Public API
  getCapabilities(): HardwareCapabilities | null {
    return this.capabilities;
  }

  getCameraConfig(): CameraConfig {
    return { ...this.cameraConfig };
  }

  getAudioConfig(): AudioConfig {
    return { ...this.audioConfig };
  }

  getSensorData(): SensorData {
    return { ...this.sensorData };
  }

  getLocationData(): LocationData | null {
    return this.locationData ? { ...this.locationData } : null;
  }

  getBiometricData(): BiometricData | null {
    return this.biometricData ? { ...this.biometricData } : null;
  }

  getEventHistory(): HardwareEvent[] {
    return [...this.eventHistory];
  }

  async updateCameraConfig(config: Partial<CameraConfig>): Promise<void> {
    this.cameraConfig = { ...this.cameraConfig, ...config };
    await this.saveConfigurations();
    this.emitEvent('camera', 'configUpdated', this.cameraConfig);
  }

  async updateAudioConfig(config: Partial<AudioConfig>): Promise<void> {
    this.audioConfig = { ...this.audioConfig, ...config };
    await this.saveConfigurations();
    this.emitEvent('audio', 'configUpdated', this.audioConfig);
  }

  isRecording(): { video: boolean; audio: boolean } {
    return {
      video: this.isRecordingVideo,
      audio: this.isRecordingAudio,
    };
  }

  isMonitoring(): { 
    camera: boolean; 
    sensors: boolean; 
    location: boolean; 
  } {
    return {
      camera: this.isStreamingCamera,
      sensors: this.isMonitoringSensors,
      location: this.isTrackingLocation,
    };
  }

  async cleanup(): Promise<void> {
    try {
      console.log('🧹 Cleaning up hardware service...');
      
      // Stop all monitoring
      await this.stopCamera();
      await this.stopSensorMonitoring();
      await this.stopLocationTracking();
      
      // Stop any active recordings
      if (this.isRecordingVideo) {
        await this.stopVideoRecording();
      }
      
      if (this.isRecordingAudio) {
        await this.stopAudioRecording();
      }
      
      // Clear all listeners
      this.eventListeners.clear();
      
      // Save final configurations
      await this.saveConfigurations();
      
      console.log('✅ Hardware service cleanup completed');
    } catch (error) {
      console.error('❌ Hardware service cleanup failed:', error);
    }
  }
}

export const mobileHardwareService = MobileHardwareService.getInstance();

// Helper functions
export const requestAllPermissions = async (): Promise<{
  camera: boolean;
  audio: boolean;
  location: boolean;
}> => {
  const camera = await mobileHardwareService.requestCameraPermissions();
  const audio = await mobileHardwareService.requestAudioPermissions();
  const location = await mobileHardwareService.requestLocationPermissions();
  
  return { camera, audio, location };
};

export const getDeviceInfo = (): HardwareCapabilities | null => {
  return mobileHardwareService.getCapabilities();
};

export const authenticateUser = async (message?: string): Promise<boolean> => {
  const result = await mobileHardwareService.authenticateWithBiometrics({
    promptMessage: message,
  });
  return result.success;
};

export default mobileHardwareService;