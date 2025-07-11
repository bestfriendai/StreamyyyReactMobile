import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Platform,
  Text,
  Vibration,
  DeviceEventEmitter,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
} from 'react-native';
import {
  PanGestureHandler,
  PinchGestureHandler,
  TapGestureHandler,
  LongPressGestureHandler,
  RotationGestureHandler,
  FlingGestureHandler,
  State,
  Directions,
  ForceTouchGestureHandler,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  interpolateColor,
  withSequence,
  withDelay,
  cancelAnimation,
} from 'react-native-reanimated';
import { MotiView, MotiText } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  Volume2,
  VolumeX,
  Brightness,
  BrightnessDown,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Maximize,
  Minimize,
  RotateCcw,
  Settings,
  Move,
  ZoomIn,
  ZoomOut,
  Hand,
  Smartphone,
  Tablet,
  Zap,
  Target,
  Sparkles,
  Heart,
  Star,
  ThumbsUp,
  Share,
  Bookmark,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  Flashlight,
  FlashlightOff,
  Compass,
  Activity,
  Battery,
  Wifi,
  Signal,
  Moon,
  Sun,
} from 'lucide-react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface MobileGestureProps {
  children: React.ReactNode;
  onVolumeChange?: (volume: number) => void;
  onBrightnessChange?: (brightness: number) => void;
  onPlayPause?: () => void;
  onSeek?: (seconds: number) => void;
  onFullscreen?: () => void;
  onRotate?: (rotation: number) => void;
  onZoom?: (scale: number) => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onDoubleTap?: () => void;
  onTripleTap?: () => void;
  onLongPress?: () => void;
  onForceTouch?: (force: number) => void;
  onShake?: () => void;
  onTilt?: (angle: number) => void;
  onProximity?: (isNear: boolean) => void;
  onBookmark?: () => void;
  onShare?: () => void;
  onLike?: () => void;
  onReaction?: (reaction: string) => void;
  enableAdvancedGestures?: boolean;
  enableHapticFeedback?: boolean;
  enableVisualFeedback?: boolean;
  enableAudioFeedback?: boolean;
  gestureThreshold?: number;
  batteryOptimized?: boolean;
  isLandscape?: boolean;
  deviceType?: 'phone' | 'tablet' | 'foldable';
  networkType?: 'wifi' | 'cellular' | 'offline';
  powerSaveMode?: boolean;
}

interface GestureState {
  type: string;
  value: number;
  icon: React.ReactNode;
  color: string[];
  position: { x: number; y: number };
  timestamp: number;
}

interface DeviceCapabilities {
  hasForceTouch: boolean;
  hasHapticEngine: boolean;
  hasGyroscope: boolean;
  hasAccelerometer: boolean;
  hasProximitySensor: boolean;
  hasAmbientLightSensor: boolean;
  supportsPictureInPicture: boolean;
  supportsMultitouch: boolean;
  maxTouchPoints: number;
}

class MobileGestureSystem {
  private static instance: MobileGestureSystem;
  private gestureHistory: GestureState[] = [];
  private deviceCapabilities: DeviceCapabilities;
  private batteryLevel: number = 1;
  private isLowPowerMode: boolean = false;
  private networkConnected: boolean = true;
  private deviceOrientation: 'portrait' | 'landscape' = 'portrait';
  private gestureListeners: Map<string, Function[]> = new Map();
  private hapticPatterns: Map<string, any[]> = new Map();
  private audioFeedbackEnabled: boolean = true;
  private visualFeedbackEnabled: boolean = true;

  private constructor() {
    this.deviceCapabilities = this.detectDeviceCapabilities();
    this.initializeHapticPatterns();
    this.setupSystemListeners();
    this.optimizeForBattery();
  }

  static getInstance(): MobileGestureSystem {
    if (!MobileGestureSystem.instance) {
      MobileGestureSystem.instance = new MobileGestureSystem();
    }
    return MobileGestureSystem.instance;
  }

  private detectDeviceCapabilities(): DeviceCapabilities {
    return {
      hasForceTouch: Platform.OS === 'ios' && Platform.Version >= '13.0',
      hasHapticEngine: Platform.OS === 'ios' || Platform.Version >= 21,
      hasGyroscope: true, // Assume most modern devices have this
      hasAccelerometer: true,
      hasProximitySensor: true,
      hasAmbientLightSensor: true,
      supportsPictureInPicture: Platform.OS === 'ios' || Platform.Version >= 26,
      supportsMultitouch: true,
      maxTouchPoints: Platform.OS === 'ios' ? 11 : 10,
    };
  }

  private initializeHapticPatterns(): void {
    this.hapticPatterns.set('light', [
      { type: 'impact', style: 'light' },
    ]);
    this.hapticPatterns.set('medium', [
      { type: 'impact', style: 'medium' },
    ]);
    this.hapticPatterns.set('heavy', [
      { type: 'impact', style: 'heavy' },
    ]);
    this.hapticPatterns.set('success', [
      { type: 'notification', style: 'success' },
    ]);
    this.hapticPatterns.set('error', [
      { type: 'notification', style: 'error' },
    ]);
    this.hapticPatterns.set('warning', [
      { type: 'notification', style: 'warning' },
    ]);
    this.hapticPatterns.set('selection', [
      { type: 'selection' },
    ]);
    this.hapticPatterns.set('double_tap', [
      { type: 'impact', style: 'light' },
      { delay: 100, type: 'impact', style: 'light' },
    ]);
    this.hapticPatterns.set('triple_tap', [
      { type: 'impact', style: 'light' },
      { delay: 100, type: 'impact', style: 'light' },
      { delay: 200, type: 'impact', style: 'light' },
    ]);
    this.hapticPatterns.set('long_press', [
      { type: 'impact', style: 'medium' },
      { delay: 500, type: 'impact', style: 'heavy' },
    ]);
    this.hapticPatterns.set('gesture_start', [
      { type: 'impact', style: 'light' },
    ]);
    this.hapticPatterns.set('gesture_end', [
      { type: 'impact', style: 'medium' },
    ]);
    this.hapticPatterns.set('boundary', [
      { type: 'impact', style: 'heavy' },
    ]);
    this.hapticPatterns.set('reaction', [
      { type: 'notification', style: 'success' },
    ]);
  }

  private setupSystemListeners(): void {
    // Battery level monitoring
    if (Platform.OS === 'ios') {
      DeviceEventEmitter.addListener('batteryLevel', (level) => {
        this.batteryLevel = level.level;
        this.isLowPowerMode = level.lowPowerMode;
        this.optimizeForBattery();
      });
    }

    // Network connectivity
    DeviceEventEmitter.addListener('networkStatus', (status) => {
      this.networkConnected = status.isConnected;
      this.optimizeForNetwork();
    });

    // Device orientation
    DeviceEventEmitter.addListener('orientation', (orientation) => {
      this.deviceOrientation = orientation.isLandscape ? 'landscape' : 'portrait';
    });

    // Proximity sensor
    if (this.deviceCapabilities.hasProximitySensor) {
      DeviceEventEmitter.addListener('proximity', (data) => {
        this.triggerEvent('proximity', data.isNear);
      });
    }

    // Ambient light sensor
    if (this.deviceCapabilities.hasAmbientLightSensor) {
      DeviceEventEmitter.addListener('ambientLight', (data) => {
        this.triggerEvent('ambientLight', data.lightLevel);
      });
    }

    // Shake gesture
    DeviceEventEmitter.addListener('shake', () => {
      this.triggerEvent('shake');
    });

    // Device tilt
    DeviceEventEmitter.addListener('tilt', (data) => {
      this.triggerEvent('tilt', data.angle);
    });
  }

  private optimizeForBattery(): void {
    if (this.batteryLevel < 0.2 || this.isLowPowerMode) {
      // Reduce haptic feedback intensity
      this.hapticPatterns.forEach((pattern, key) => {
        this.hapticPatterns.set(key, pattern.map(p => ({
          ...p,
          style: p.style === 'heavy' ? 'medium' : p.style === 'medium' ? 'light' : p.style
        })));
      });
      
      // Disable some visual effects
      this.visualFeedbackEnabled = false;
      
      // Reduce gesture sensitivity
      console.log('🔋 Battery optimization: Reduced gesture sensitivity');
    }
  }

  private optimizeForNetwork(): void {
    if (!this.networkConnected) {
      // Disable network-dependent features
      console.log('📡 Network optimization: Offline mode enabled');
    }
  }

  async triggerHaptic(pattern: string, intensity: number = 1): Promise<void> {
    if (!this.deviceCapabilities.hasHapticEngine) return;
    
    const hapticPattern = this.hapticPatterns.get(pattern);
    if (!hapticPattern) return;

    try {
      for (const haptic of hapticPattern) {
        if (haptic.delay) {
          await new Promise(resolve => setTimeout(resolve, haptic.delay));
        }

        switch (haptic.type) {
          case 'impact':
            await Haptics.impactAsync(
              haptic.style === 'light' ? Haptics.ImpactFeedbackStyle.Light :
              haptic.style === 'medium' ? Haptics.ImpactFeedbackStyle.Medium :
              Haptics.ImpactFeedbackStyle.Heavy
            );
            break;
          case 'notification':
            await Haptics.notificationAsync(
              haptic.style === 'success' ? Haptics.NotificationFeedbackType.Success :
              haptic.style === 'error' ? Haptics.NotificationFeedbackType.Error :
              Haptics.NotificationFeedbackType.Warning
            );
            break;
          case 'selection':
            await Haptics.selectionAsync();
            break;
        }
      }
    } catch (error) {
      console.error('Haptic feedback error:', error);
    }
  }

  addEventListener(event: string, callback: Function): void {
    if (!this.gestureListeners.has(event)) {
      this.gestureListeners.set(event, []);
    }
    this.gestureListeners.get(event)!.push(callback);
  }

  removeEventListener(event: string, callback: Function): void {
    const listeners = this.gestureListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private triggerEvent(event: string, ...args: any[]): void {
    const listeners = this.gestureListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(...args));
    }
  }

  addGestureToHistory(gesture: GestureState): void {
    this.gestureHistory.push(gesture);
    if (this.gestureHistory.length > 50) {
      this.gestureHistory.shift();
    }
  }

  getGestureHistory(): GestureState[] {
    return [...this.gestureHistory];
  }

  getDeviceCapabilities(): DeviceCapabilities {
    return { ...this.deviceCapabilities };
  }

  isOptimizedForBattery(): boolean {
    return this.batteryLevel < 0.2 || this.isLowPowerMode;
  }

  getDeviceInfo(): {
    batteryLevel: number;
    isLowPowerMode: boolean;
    networkConnected: boolean;
    deviceOrientation: string;
    capabilities: DeviceCapabilities;
  } {
    return {
      batteryLevel: this.batteryLevel,
      isLowPowerMode: this.isLowPowerMode,
      networkConnected: this.networkConnected,
      deviceOrientation: this.deviceOrientation,
      capabilities: this.deviceCapabilities,
    };
  }
}

export const MobileGestureHandler: React.FC<MobileGestureProps> = ({
  children,
  onVolumeChange,
  onBrightnessChange,
  onPlayPause,
  onSeek,
  onFullscreen,
  onRotate,
  onZoom,
  onSwipeUp,
  onSwipeDown,
  onSwipeLeft,
  onSwipeRight,
  onDoubleTap,
  onTripleTap,
  onLongPress,
  onForceTouch,
  onShake,
  onTilt,
  onProximity,
  onBookmark,
  onShare,
  onLike,
  onReaction,
  enableAdvancedGestures = true,
  enableHapticFeedback = true,
  enableVisualFeedback = true,
  enableAudioFeedback = true,
  gestureThreshold = 50,
  batteryOptimized = true,
  isLandscape = false,
  deviceType = 'phone',
  networkType = 'wifi',
  powerSaveMode = false,
}) => {
  const gestureSystem = MobileGestureSystem.getInstance();
  const [currentGesture, setCurrentGesture] = useState<GestureState | null>(null);
  const [gestureIndicators, setGestureIndicators] = useState<GestureState[]>([]);
  const [deviceInfo, setDeviceInfo] = useState(gestureSystem.getDeviceInfo());
  
  // Gesture refs
  const panRef = useRef<PanGestureHandler>(null);
  const pinchRef = useRef<PinchGestureHandler>(null);
  const rotationRef = useRef<RotationGestureHandler>(null);
  const tapRef = useRef<TapGestureHandler>(null);
  const doubleTapRef = useRef<TapGestureHandler>(null);
  const tripleTapRef = useRef<TapGestureHandler>(null);
  const longPressRef = useRef<LongPressGestureHandler>(null);
  const forceTouchRef = useRef<ForceTouchGestureHandler>(null);
  const flingUpRef = useRef<FlingGestureHandler>(null);
  const flingDownRef = useRef<FlingGestureHandler>(null);
  const flingLeftRef = useRef<FlingGestureHandler>(null);
  const flingRightRef = useRef<FlingGestureHandler>(null);

  // Animation values
  const containerScale = useSharedValue(1);
  const containerRotation = useSharedValue(0);
  const containerX = useSharedValue(0);
  const containerY = useSharedValue(0);
  const indicatorOpacity = useSharedValue(0);
  const indicatorScale = useSharedValue(0.8);
  const feedbackOpacity = useSharedValue(0);
  const feedbackScale = useSharedValue(1);
  const gestureTrailOpacity = useSharedValue(0);

  // Gesture state
  const [tapCount, setTapCount] = useState(0);
  const [lastTapTime, setLastTapTime] = useState(0);
  const [multiTouchPoints, setMultiTouchPoints] = useState(0);
  const [currentForce, setCurrentForce] = useState(0);
  const [isGestureActive, setIsGestureActive] = useState(false);

  useEffect(() => {
    // Setup gesture system listeners
    gestureSystem.addEventListener('shake', onShake);
    gestureSystem.addEventListener('tilt', onTilt);
    gestureSystem.addEventListener('proximity', onProximity);
    gestureSystem.addEventListener('ambientLight', handleAmbientLight);

    return () => {
      gestureSystem.removeEventListener('shake', onShake);
      gestureSystem.removeEventListener('tilt', onTilt);
      gestureSystem.removeEventListener('proximity', onProximity);
      gestureSystem.removeEventListener('ambientLight', handleAmbientLight);
    };
  }, []);

  useEffect(() => {
    // Update device info periodically
    const interval = setInterval(() => {
      setDeviceInfo(gestureSystem.getDeviceInfo());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleAmbientLight = (lightLevel: number) => {
    // Auto-adjust brightness based on ambient light
    if (onBrightnessChange) {
      const adjustedBrightness = Math.max(0.1, Math.min(1, lightLevel / 100));
      onBrightnessChange(adjustedBrightness);
    }
  };

  const showGestureIndicator = (gesture: GestureState) => {
    if (!enableVisualFeedback) return;
    
    setCurrentGesture(gesture);
    gestureSystem.addGestureToHistory(gesture);
    
    indicatorOpacity.value = withSequence(
      withTiming(1, { duration: 200 }),
      withDelay(1000, withTiming(0, { duration: 300 }))
    );
    indicatorScale.value = withSequence(
      withSpring(1, { damping: 15 }),
      withDelay(800, withSpring(0.8, { damping: 15 }))
    );
  };

  const showFeedbackEffect = (type: 'success' | 'error' | 'warning' | 'info') => {
    if (!enableVisualFeedback) return;
    
    feedbackOpacity.value = withSequence(
      withTiming(1, { duration: 150 }),
      withDelay(500, withTiming(0, { duration: 300 }))
    );
    feedbackScale.value = withSequence(
      withSpring(1.2, { damping: 10 }),
      withSpring(1, { damping: 15 })
    );
  };

  const triggerHapticFeedback = (pattern: string, intensity: number = 1) => {
    if (!enableHapticFeedback) return;
    gestureSystem.triggerHaptic(pattern, intensity);
  };

  // Enhanced Pan Gesture Handler
  const panGestureHandler = useAnimatedGestureHandler({
    onStart: (event, context) => {
      runOnJS(setIsGestureActive)(true);
      runOnJS(triggerHapticFeedback)('gesture_start');
      
      context.startX = containerX.value;
      context.startY = containerY.value;
      context.startTime = Date.now();
    },
    onActive: (event, context) => {
      const { translationX, translationY, velocityX, velocityY } = event;
      
      // Determine gesture type based on movement
      const isHorizontal = Math.abs(translationX) > Math.abs(translationY);
      const isVertical = Math.abs(translationY) > Math.abs(translationX);
      const threshold = gestureThreshold;
      
      if (isHorizontal && Math.abs(translationX) > threshold) {
        // Horizontal swipe for seeking
        const seekAmount = (translationX / SCREEN_WIDTH) * 60; // 60 seconds max
        const gesture: GestureState = {
          type: 'seek',
          value: seekAmount,
          icon: seekAmount > 0 ? <SkipForward size={24} color="#fff" /> : <SkipBack size={24} color="#fff" />,
          color: ['#8B5CF6', '#7C3AED'],
          position: { x: event.x, y: event.y },
          timestamp: Date.now(),
        };
        runOnJS(showGestureIndicator)(gesture);
      } else if (isVertical && Math.abs(translationY) > threshold) {
        // Vertical swipe for volume/brightness
        const isLeftSide = event.x < SCREEN_WIDTH / 2;
        const changeAmount = -translationY / SCREEN_HEIGHT;
        
        if (isLeftSide) {
          // Left side: brightness
          const gesture: GestureState = {
            type: 'brightness',
            value: changeAmount,
            icon: changeAmount > 0 ? <Brightness size={24} color="#fff" /> : <BrightnessDown size={24} color="#fff" />,
            color: ['#F59E0B', '#D97706'],
            position: { x: event.x, y: event.y },
            timestamp: Date.now(),
          };
          runOnJS(showGestureIndicator)(gesture);
        } else {
          // Right side: volume
          const gesture: GestureState = {
            type: 'volume',
            value: changeAmount,
            icon: changeAmount > 0 ? <Volume2 size={24} color="#fff" /> : <VolumeX size={24} color="#fff" />,
            color: ['#10B981', '#059669'],
            position: { x: event.x, y: event.y },
            timestamp: Date.now(),
          };
          runOnJS(showGestureIndicator)(gesture);
        }
      }
    },
    onEnd: (event, context) => {
      runOnJS(setIsGestureActive)(false);
      runOnJS(triggerHapticFeedback)('gesture_end');
      
      const { translationX, translationY, velocityX, velocityY } = event;
      const isHorizontal = Math.abs(translationX) > Math.abs(translationY);
      const isVertical = Math.abs(translationY) > Math.abs(translationX);
      const threshold = gestureThreshold;
      
      if (isHorizontal && Math.abs(translationX) > threshold) {
        const seekAmount = (translationX / SCREEN_WIDTH) * 60;
        runOnJS(onSeek)?.(seekAmount);
        
        if (translationX > 0) {
          runOnJS(onSwipeRight)?.();
        } else {
          runOnJS(onSwipeLeft)?.();
        }
      } else if (isVertical && Math.abs(translationY) > threshold) {
        const isLeftSide = event.x < SCREEN_WIDTH / 2;
        const changeAmount = -translationY / SCREEN_HEIGHT;
        
        if (isLeftSide) {
          runOnJS(onBrightnessChange)?.(Math.max(0, Math.min(1, changeAmount)));
        } else {
          runOnJS(onVolumeChange)?.(Math.max(0, Math.min(1, changeAmount)));
        }
        
        if (translationY > 0) {
          runOnJS(onSwipeDown)?.();
        } else {
          runOnJS(onSwipeUp)?.();
        }
      }
      
      // Reset position
      containerX.value = withSpring(0);
      containerY.value = withSpring(0);
    },
  });

  // Enhanced Pinch Gesture Handler
  const pinchGestureHandler = useAnimatedGestureHandler({
    onStart: (event, context) => {
      runOnJS(triggerHapticFeedback)('gesture_start');
      context.startScale = containerScale.value;
    },
    onActive: (event, context) => {
      const newScale = context.startScale * event.scale;
      const clampedScale = Math.max(0.5, Math.min(3, newScale));
      containerScale.value = clampedScale;
      
      const gesture: GestureState = {
        type: 'zoom',
        value: clampedScale,
        icon: clampedScale > 1 ? <ZoomIn size={24} color="#fff" /> : <ZoomOut size={24} color="#fff" />,
        color: ['#6366F1', '#4F46E5'],
        position: { x: event.focalX, y: event.focalY },
        timestamp: Date.now(),
      };
      runOnJS(showGestureIndicator)(gesture);
    },
    onEnd: (event, context) => {
      runOnJS(triggerHapticFeedback)('gesture_end');
      const finalScale = context.startScale * event.scale;
      runOnJS(onZoom)?.(finalScale);
      
      // Reset scale with spring animation
      containerScale.value = withSpring(1);
    },
  });

  // Enhanced Rotation Gesture Handler
  const rotationGestureHandler = useAnimatedGestureHandler({
    onStart: (event, context) => {
      runOnJS(triggerHapticFeedback)('gesture_start');
      context.startRotation = containerRotation.value;
    },
    onActive: (event, context) => {
      const newRotation = context.startRotation + event.rotation;
      containerRotation.value = newRotation;
      
      const gesture: GestureState = {
        type: 'rotate',
        value: newRotation,
        icon: <RotateCcw size={24} color="#fff" />,
        color: ['#EC4899', '#DB2777'],
        position: { x: event.focalX, y: event.focalY },
        timestamp: Date.now(),
      };
      runOnJS(showGestureIndicator)(gesture);
    },
    onEnd: (event, context) => {
      runOnJS(triggerHapticFeedback)('gesture_end');
      const finalRotation = context.startRotation + event.rotation;
      runOnJS(onRotate)?.(finalRotation);
      
      // Reset rotation
      containerRotation.value = withSpring(0);
    },
  });

  // Enhanced Tap Gesture Handler
  const tapGestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      containerScale.value = withSpring(0.95, { damping: 15 });
    },
    onEnd: () => {
      containerScale.value = withSpring(1, { damping: 15 });
      runOnJS(handleTap)();
    },
  });

  const handleTap = () => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapTime;
    
    if (timeSinceLastTap < 300) {
      setTapCount(prev => prev + 1);
    } else {
      setTapCount(1);
    }
    
    setLastTapTime(now);
    
    // Handle different tap counts
    setTimeout(() => {
      if (tapCount === 1) {
        onPlayPause?.();
        triggerHapticFeedback('light');
      } else if (tapCount === 2) {
        onDoubleTap?.();
        triggerHapticFeedback('double_tap');
      } else if (tapCount === 3) {
        onTripleTap?.();
        triggerHapticFeedback('triple_tap');
      }
      setTapCount(0);
    }, 300);
  };

  // Long Press Gesture Handler
  const longPressGestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      containerScale.value = withSpring(1.05, { damping: 12 });
    },
    onActive: () => {
      // Visual feedback for long press
      runOnJS(triggerHapticFeedback)('long_press');
    },
    onEnd: () => {
      containerScale.value = withSpring(1, { damping: 15 });
      runOnJS(onLongPress)?.();
    },
  });

  // Force Touch Gesture Handler (iOS only)
  const forceTouchGestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      if (Platform.OS === 'ios') {
        runOnJS(triggerHapticFeedback)('medium');
      }
    },
    onActive: (event) => {
      if (Platform.OS === 'ios' && event.force) {
        runOnJS(setCurrentForce)(event.force);
        runOnJS(onForceTouch)?.(event.force);
      }
    },
    onEnd: () => {
      runOnJS(setCurrentForce)(0);
    },
  });

  // Animated styles
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: containerX.value },
      { translateY: containerY.value },
      { scale: containerScale.value },
      { rotate: `${containerRotation.value}rad` },
    ],
  }));

  const indicatorAnimatedStyle = useAnimatedStyle(() => ({
    opacity: indicatorOpacity.value,
    transform: [{ scale: indicatorScale.value }],
  }));

  const feedbackAnimatedStyle = useAnimatedStyle(() => ({
    opacity: feedbackOpacity.value,
    transform: [{ scale: feedbackScale.value }],
  }));

  // Get gesture indicator content
  const getGestureIndicatorContent = () => {
    if (!currentGesture) return null;
    
    return {
      icon: currentGesture.icon,
      text: `${currentGesture.type}: ${Math.round(currentGesture.value)}`,
      color: currentGesture.color,
      position: currentGesture.position,
    };
  };

  const indicatorContent = getGestureIndicatorContent();

  // Render gesture system
  return (
    <View style={styles.container}>
      {/* Force Touch Handler (iOS only) */}
      {Platform.OS === 'ios' && gestureSystem.getDeviceCapabilities().hasForceTouch && (
        <ForceTouchGestureHandler
          ref={forceTouchRef}
          onGestureEvent={forceTouchGestureHandler}
          minForce={0.2}
          maxForce={1.0}
          feedbackOnActivation={true}
        >
          <Animated.View style={StyleSheet.absoluteFill} />
        </ForceTouchGestureHandler>
      )}

      {/* Fling Gesture Handlers */}
      <FlingGestureHandler
        ref={flingUpRef}
        direction={Directions.UP}
        onHandlerStateChange={({ nativeEvent }) => {
          if (nativeEvent.state === State.ACTIVE) {
            onSwipeUp?.();
            triggerHapticFeedback('medium');
          }
        }}
      >
        <Animated.View style={StyleSheet.absoluteFill} />
      </FlingGestureHandler>

      <FlingGestureHandler
        ref={flingDownRef}
        direction={Directions.DOWN}
        onHandlerStateChange={({ nativeEvent }) => {
          if (nativeEvent.state === State.ACTIVE) {
            onSwipeDown?.();
            triggerHapticFeedback('medium');
          }
        }}
      >
        <Animated.View style={StyleSheet.absoluteFill} />
      </FlingGestureHandler>

      <FlingGestureHandler
        ref={flingLeftRef}
        direction={Directions.LEFT}
        onHandlerStateChange={({ nativeEvent }) => {
          if (nativeEvent.state === State.ACTIVE) {
            onSwipeLeft?.();
            triggerHapticFeedback('medium');
          }
        }}
      >
        <Animated.View style={StyleSheet.absoluteFill} />
      </FlingGestureHandler>

      <FlingGestureHandler
        ref={flingRightRef}
        direction={Directions.RIGHT}
        onHandlerStateChange={({ nativeEvent }) => {
          if (nativeEvent.state === State.ACTIVE) {
            onSwipeRight?.();
            triggerHapticFeedback('medium');
          }
        }}
      >
        <Animated.View style={StyleSheet.absoluteFill} />
      </FlingGestureHandler>

      {/* Main Gesture Handlers */}
      <LongPressGestureHandler
        ref={longPressRef}
        onGestureEvent={longPressGestureHandler}
        minDurationMs={500}
        maxDist={50}
      >
        <Animated.View style={StyleSheet.absoluteFill}>
          <RotationGestureHandler
            ref={rotationRef}
            onGestureEvent={rotationGestureHandler}
            simultaneousHandlers={[panRef, pinchRef]}
          >
            <Animated.View style={StyleSheet.absoluteFill}>
              <PinchGestureHandler
                ref={pinchRef}
                onGestureEvent={pinchGestureHandler}
                simultaneousHandlers={[panRef, rotationRef]}
              >
                <Animated.View style={StyleSheet.absoluteFill}>
                  <PanGestureHandler
                    ref={panRef}
                    onGestureEvent={panGestureHandler}
                    simultaneousHandlers={[pinchRef, rotationRef]}
                    minPointers={1}
                    maxPointers={5}
                  >
                    <Animated.View style={StyleSheet.absoluteFill}>
                      <TapGestureHandler
                        ref={tapRef}
                        onGestureEvent={tapGestureHandler}
                        numberOfTaps={1}
                        maxDurationMs={300}
                      >
                        <Animated.View style={[styles.gestureArea, containerAnimatedStyle]}>
                          {children}
                        </Animated.View>
                      </TapGestureHandler>
                    </Animated.View>
                  </PanGestureHandler>
                </Animated.View>
              </PinchGestureHandler>
            </Animated.View>
          </RotationGestureHandler>
        </Animated.View>
      </LongPressGestureHandler>

      {/* Gesture Indicator */}
      {indicatorContent && (
        <Animated.View style={[styles.gestureIndicator, indicatorAnimatedStyle]}>
          <LinearGradient
            colors={indicatorContent.color}
            style={styles.indicatorGradient}
          >
            <View style={styles.indicatorContent}>
              {indicatorContent.icon}
              <Text style={styles.indicatorText}>{indicatorContent.text}</Text>
            </View>
          </LinearGradient>
        </Animated.View>
      )}

      {/* Device Info Overlay */}
      {__DEV__ && (
        <View style={styles.deviceInfoOverlay}>
          <Text style={styles.deviceInfoText}>
            Battery: {Math.round(deviceInfo.batteryLevel * 100)}%
          </Text>
          <Text style={styles.deviceInfoText}>
            Network: {deviceInfo.networkConnected ? 'Connected' : 'Offline'}
          </Text>
          <Text style={styles.deviceInfoText}>
            Orientation: {deviceInfo.deviceOrientation}
          </Text>
          <Text style={styles.deviceInfoText}>
            Power Save: {deviceInfo.isLowPowerMode ? 'On' : 'Off'}
          </Text>
        </View>
      )}

      {/* Gesture Trail Effect */}
      {enableVisualFeedback && (
        <Animated.View style={[styles.gestureTrail, { opacity: gestureTrailOpacity.value }]}>
          {gestureIndicators.map((indicator, index) => (
            <MotiView
              key={index}
              from={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 0.6, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ type: 'timing', duration: 300 }}
              style={[
                styles.trailDot,
                {
                  left: indicator.position.x - 5,
                  top: indicator.position.y - 5,
                }
              ]}
            />
          ))}
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  gestureArea: {
    flex: 1,
  },
  gestureIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -100 }, { translateY: -50 }],
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  indicatorGradient: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    minWidth: 200,
  },
  indicatorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  indicatorText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deviceInfoOverlay: {
    position: 'absolute',
    top: 50,
    left: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    borderRadius: 8,
    gap: 2,
  },
  deviceInfoText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  gestureTrail: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  trailDot: {
    position: 'absolute',
    width: 10,
    height: 10,
    backgroundColor: '#8B5CF6',
    borderRadius: 5,
  },
});

export default MobileGestureHandler;
export { MobileGestureSystem };