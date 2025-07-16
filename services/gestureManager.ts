import { Haptics } from 'expo-haptics';
import { Platform, Dimensions } from 'react-native';
import Animated, {
  runOnJS,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export type GestureType = 'tap' | 'doubleTap' | 'longPress' | 'pan' | 'pinch' | 'swipe' | 'rotation';
export type SwipeDirection = 'up' | 'down' | 'left' | 'right';
export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

export interface GestureConfig {
  enabled: boolean;
  threshold?: number;
  duration?: number;
  hapticFeedback?: HapticType;
  preventDefault?: boolean;
}

export interface GestureEvent {
  type: GestureType;
  x: number;
  y: number;
  translationX?: number;
  translationY?: number;
  velocityX?: number;
  velocityY?: number;
  scale?: number;
  rotation?: number;
  direction?: SwipeDirection;
  timestamp: number;
  target?: string;
}

export interface GestureHandler {
  onStart?: (event: GestureEvent) => void;
  onActive?: (event: GestureEvent) => void;
  onEnd?: (event: GestureEvent) => void;
}

export interface StreamGestureHandlers {
  onTap?: (streamId: string, event: GestureEvent) => void;
  onDoubleTap?: (streamId: string, event: GestureEvent) => void;
  onLongPress?: (streamId: string, event: GestureEvent) => void;
  onPan?: (streamId: string, event: GestureEvent) => void;
  onPinch?: (streamId: string, event: GestureEvent) => void;
  onSwipe?: (streamId: string, direction: SwipeDirection, event: GestureEvent) => void;
  onRotation?: (streamId: string, event: GestureEvent) => void;
}

export interface GestureSettings {
  hapticEnabled: boolean;
  gestureThreshold: number;
  longPressDelay: number;
  doubleTapDelay: number;
  swipeThreshold: number;
  pinchThreshold: number;
  rotationThreshold: number;
  panThreshold: number;
  enableGlobalGestures: boolean;
  enableStreamGestures: boolean;
  preventDefaultScrolling: boolean;
}

class GestureManager {
  private gestureConfigs: Map<GestureType, GestureConfig> = new Map();
  private gestureHandlers: Map<string, StreamGestureHandlers> = new Map();
  private globalHandlers: Map<GestureType, GestureHandler[]> = new Map();
  private activeGestures: Set<string> = new Set();
  private gestureHistory: GestureEvent[] = [];
  private settings: GestureSettings;

  // Gesture state tracking
  private lastTapTime = 0;
  private lastTapPosition = { x: 0, y: 0 };
  private tapCount = 0;
  private isLongPressActive = false;
  private longPressTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.settings = {
      hapticEnabled: true,
      gestureThreshold: 10,
      longPressDelay: 500,
      doubleTapDelay: 300,
      swipeThreshold: 50,
      pinchThreshold: 0.1,
      rotationThreshold: 0.1,
      panThreshold: 10,
      enableGlobalGestures: true,
      enableStreamGestures: true,
      preventDefaultScrolling: false,
    };

    this.initializeDefaultConfigs();
  }

  private initializeDefaultConfigs(): void {
    const defaultConfig: GestureConfig = {
      enabled: true,
      hapticFeedback: 'light',
      preventDefault: false,
    };

    this.gestureConfigs.set('tap', { ...defaultConfig, hapticFeedback: 'light' });
    this.gestureConfigs.set('doubleTap', { ...defaultConfig, hapticFeedback: 'medium' });
    this.gestureConfigs.set('longPress', { 
      ...defaultConfig, 
      duration: this.settings.longPressDelay,
      hapticFeedback: 'heavy' 
    });
    this.gestureConfigs.set('pan', { 
      ...defaultConfig, 
      threshold: this.settings.panThreshold,
      hapticFeedback: 'light' 
    });
    this.gestureConfigs.set('pinch', { 
      ...defaultConfig, 
      threshold: this.settings.pinchThreshold,
      hapticFeedback: 'medium' 
    });
    this.gestureConfigs.set('swipe', { 
      ...defaultConfig, 
      threshold: this.settings.swipeThreshold,
      hapticFeedback: 'light' 
    });
    this.gestureConfigs.set('rotation', { 
      ...defaultConfig, 
      threshold: this.settings.rotationThreshold,
      hapticFeedback: 'light' 
    });
  }

  // Configuration methods
  public updateSettings(newSettings: Partial<GestureSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    
    // Update gesture configs based on new settings
    if ('longPressDelay' in newSettings) {
      this.updateGestureConfig('longPress', { duration: newSettings.longPressDelay });
    }
    if ('swipeThreshold' in newSettings) {
      this.updateGestureConfig('swipe', { threshold: newSettings.swipeThreshold });
    }
    if ('pinchThreshold' in newSettings) {
      this.updateGestureConfig('pinch', { threshold: newSettings.pinchThreshold });
    }
    if ('rotationThreshold' in newSettings) {
      this.updateGestureConfig('rotation', { threshold: newSettings.rotationThreshold });
    }
    if ('panThreshold' in newSettings) {
      this.updateGestureConfig('pan', { threshold: newSettings.panThreshold });
    }
  }

  public updateGestureConfig(gestureType: GestureType, config: Partial<GestureConfig>): void {
    const currentConfig = this.gestureConfigs.get(gestureType) || { enabled: true };
    this.gestureConfigs.set(gestureType, { ...currentConfig, ...config });
  }

  public getGestureConfig(gestureType: GestureType): GestureConfig | undefined {
    return this.gestureConfigs.get(gestureType);
  }

  public getSettings(): GestureSettings {
    return { ...this.settings };
  }

  // Handler registration
  public registerStreamGestureHandlers(streamId: string, handlers: StreamGestureHandlers): void {
    this.gestureHandlers.set(streamId, handlers);
  }

  public unregisterStreamGestureHandlers(streamId: string): void {
    this.gestureHandlers.delete(streamId);
  }

  public registerGlobalGestureHandler(gestureType: GestureType, handler: GestureHandler): void {
    if (!this.globalHandlers.has(gestureType)) {
      this.globalHandlers.set(gestureType, []);
    }
    this.globalHandlers.get(gestureType)!.push(handler);
  }

  public unregisterGlobalGestureHandler(gestureType: GestureType, handler: GestureHandler): void {
    const handlers = this.globalHandlers.get(gestureType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  // Haptic feedback
  public triggerHaptic(type: HapticType = 'light'): void {
    if (!this.settings.hapticEnabled || Platform.OS !== 'ios') return;

    switch (type) {
      case 'light':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'heavy':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'success':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'warning':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'error':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      case 'selection':
        Haptics.selectionAsync();
        break;
    }
  }

  // Gesture processing methods
  public processTapGesture(x: number, y: number, streamId?: string): void {
    const config = this.gestureConfigs.get('tap');
    if (!config?.enabled) return;

    const now = Date.now();
    const timeSinceLastTap = now - this.lastTapTime;
    const distance = Math.sqrt(
      Math.pow(x - this.lastTapPosition.x, 2) + Math.pow(y - this.lastTapPosition.y, 2)
    );

    // Check for double tap
    if (timeSinceLastTap < this.settings.doubleTapDelay && distance < this.settings.gestureThreshold) {
      this.tapCount++;
      if (this.tapCount === 2) {
        this.processDoubleTapGesture(x, y, streamId);
        this.tapCount = 0;
        return;
      }
    } else {
      this.tapCount = 1;
    }

    // Single tap
    setTimeout(() => {
      if (this.tapCount === 1) {
        this.emitGestureEvent('tap', { x, y }, streamId);
        this.tapCount = 0;
      }
    }, this.settings.doubleTapDelay);

    this.lastTapTime = now;
    this.lastTapPosition = { x, y };
  }

  public processDoubleTapGesture(x: number, y: number, streamId?: string): void {
    const config = this.gestureConfigs.get('doubleTap');
    if (!config?.enabled) return;

    this.emitGestureEvent('doubleTap', { x, y }, streamId);
  }

  public processLongPressStart(x: number, y: number, streamId?: string): void {
    const config = this.gestureConfigs.get('longPress');
    if (!config?.enabled) return;

    this.isLongPressActive = false;
    
    this.longPressTimer = setTimeout(() => {
      this.isLongPressActive = true;
      this.emitGestureEvent('longPress', { x, y }, streamId);
    }, config.duration || this.settings.longPressDelay);
  }

  public processLongPressEnd(): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
    this.isLongPressActive = false;
  }

  public processPanGesture(
    x: number, 
    y: number, 
    translationX: number, 
    translationY: number, 
    velocityX: number, 
    velocityY: number,
    streamId?: string
  ): void {
    const config = this.gestureConfigs.get('pan');
    if (!config?.enabled) return;

    const distance = Math.sqrt(translationX * translationX + translationY * translationY);
    if (distance < (config.threshold || this.settings.panThreshold)) return;

    this.emitGestureEvent('pan', {
      x,
      y,
      translationX,
      translationY,
      velocityX,
      velocityY,
    }, streamId);
  }

  public processPinchGesture(
    x: number, 
    y: number, 
    scale: number,
    streamId?: string
  ): void {
    const config = this.gestureConfigs.get('pinch');
    if (!config?.enabled) return;

    const scaleChange = Math.abs(scale - 1);
    if (scaleChange < (config.threshold || this.settings.pinchThreshold)) return;

    this.emitGestureEvent('pinch', { x, y, scale }, streamId);
  }

  public processSwipeGesture(
    x: number, 
    y: number, 
    translationX: number, 
    translationY: number, 
    velocityX: number, 
    velocityY: number,
    streamId?: string
  ): void {
    const config = this.gestureConfigs.get('swipe');
    if (!config?.enabled) return;

    const threshold = config.threshold || this.settings.swipeThreshold;
    
    let direction: SwipeDirection | undefined;
    
    if (Math.abs(translationX) > Math.abs(translationY)) {
      // Horizontal swipe
      if (Math.abs(translationX) > threshold) {
        direction = translationX > 0 ? 'right' : 'left';
      }
    } else {
      // Vertical swipe
      if (Math.abs(translationY) > threshold) {
        direction = translationY > 0 ? 'down' : 'up';
      }
    }

    if (direction) {
      this.emitGestureEvent('swipe', {
        x,
        y,
        translationX,
        translationY,
        velocityX,
        velocityY,
        direction,
      }, streamId);
    }
  }

  public processRotationGesture(
    x: number, 
    y: number, 
    rotation: number,
    streamId?: string
  ): void {
    const config = this.gestureConfigs.get('rotation');
    if (!config?.enabled) return;

    const rotationChange = Math.abs(rotation);
    if (rotationChange < (config.threshold || this.settings.rotationThreshold)) return;

    this.emitGestureEvent('rotation', { x, y, rotation }, streamId);
  }

  // Event emission
  private emitGestureEvent(
    type: GestureType, 
    eventData: Partial<GestureEvent>, 
    streamId?: string
  ): void {
    const config = this.gestureConfigs.get(type);
    if (!config?.enabled) return;

    // Trigger haptic feedback
    if (config.hapticFeedback) {
      this.triggerHaptic(config.hapticFeedback);
    }

    const event: GestureEvent = {
      type,
      x: eventData.x || 0,
      y: eventData.y || 0,
      timestamp: Date.now(),
      ...eventData,
    };

    // Add to gesture history
    this.gestureHistory.push(event);
    if (this.gestureHistory.length > 100) {
      this.gestureHistory.shift();
    }

    // Emit to stream-specific handlers
    if (streamId && this.settings.enableStreamGestures) {
      const handlers = this.gestureHandlers.get(streamId);
      if (handlers) {
        switch (type) {
          case 'tap':
            handlers.onTap?.(streamId, event);
            break;
          case 'doubleTap':
            handlers.onDoubleTap?.(streamId, event);
            break;
          case 'longPress':
            handlers.onLongPress?.(streamId, event);
            break;
          case 'pan':
            handlers.onPan?.(streamId, event);
            break;
          case 'pinch':
            handlers.onPinch?.(streamId, event);
            break;
          case 'swipe':
            handlers.onSwipe?.(streamId, event.direction!, event);
            break;
          case 'rotation':
            handlers.onRotation?.(streamId, event);
            break;
        }
      }
    }

    // Emit to global handlers
    if (this.settings.enableGlobalGestures) {
      const globalHandlers = this.globalHandlers.get(type);
      if (globalHandlers) {
        globalHandlers.forEach(handler => {
          try {
            handler.onStart?.(event);
            handler.onActive?.(event);
            handler.onEnd?.(event);
          } catch (error) {
            console.error('Error in global gesture handler:', error);
          }
        });
      }
    }
  }

  // Utility methods
  public isGestureActive(gestureId: string): boolean {
    return this.activeGestures.has(gestureId);
  }

  public startGesture(gestureId: string): void {
    this.activeGestures.add(gestureId);
  }

  public endGesture(gestureId: string): void {
    this.activeGestures.delete(gestureId);
  }

  public getActiveGestures(): string[] {
    return Array.from(this.activeGestures);
  }

  public getGestureHistory(limit?: number): GestureEvent[] {
    const history = [...this.gestureHistory];
    return limit ? history.slice(-limit) : history;
  }

  public clearGestureHistory(): void {
    this.gestureHistory = [];
  }

  // Boundary checking
  public isWithinBounds(x: number, y: number, bounds?: { x: number; y: number; width: number; height: number }): boolean {
    if (!bounds) {
      // Check screen bounds
      return x >= 0 && x <= screenWidth && y >= 0 && y <= screenHeight;
    }

    return (
      x >= bounds.x &&
      x <= bounds.x + bounds.width &&
      y >= bounds.y &&
      y <= bounds.y + bounds.height
    );
  }

  // Gesture conflict resolution
  public shouldPreventGesture(type: GestureType, event: GestureEvent): boolean {
    const config = this.gestureConfigs.get(type);
    
    // Check if gesture should be prevented based on configuration
    if (config?.preventDefault) return true;

    // Prevent scrolling if setting is enabled
    if (this.settings.preventDefaultScrolling && (type === 'pan' || type === 'swipe')) {
      return true;
    }

    // Long press should prevent tap
    if (type === 'tap' && this.isLongPressActive) {
      return true;
    }

    return false;
  }

  // Animation helpers
  public createGestureAnimation(
    type: GestureType,
    initialValue: number = 0,
    config?: { damping?: number; stiffness?: number; duration?: number }
  ) {
    const animatedValue = useSharedValue(initialValue);

    const animateToValue = (value: number, animated: boolean = true) => {
      if (animated) {
        if (type === 'pinch' || type === 'rotation') {
          animatedValue.value = withSpring(value, {
            damping: config?.damping || 15,
            stiffness: config?.stiffness || 300,
          });
        } else {
          animatedValue.value = withTiming(value, {
            duration: config?.duration || 300,
          });
        }
      } else {
        animatedValue.value = value;
      }
    };

    return {
      value: animatedValue,
      animateTo: animateToValue,
    };
  }

  // Performance optimization
  public optimizeForPerformance(): void {
    // Reduce gesture sensitivity on low-performance devices
    if (this.gestureHistory.length > 50) {
      this.settings.gestureThreshold *= 1.2;
      this.updateGestureConfig('pan', { threshold: this.settings.panThreshold * 1.2 });
      this.updateGestureConfig('swipe', { threshold: this.settings.swipeThreshold * 1.2 });
    }

    // Clear old gesture history
    if (this.gestureHistory.length > 200) {
      this.gestureHistory = this.gestureHistory.slice(-100);
    }
  }

  // Debug methods
  public getDebugInfo(): any {
    return {
      settings: this.settings,
      gestureConfigs: Object.fromEntries(this.gestureConfigs),
      activeGestures: Array.from(this.activeGestures),
      registeredStreams: Array.from(this.gestureHandlers.keys()),
      globalHandlers: Object.fromEntries(
        Array.from(this.globalHandlers.entries()).map(([key, handlers]) => [
          key,
          handlers.length,
        ])
      ),
      gestureHistoryCount: this.gestureHistory.length,
      lastTapTime: this.lastTapTime,
      isLongPressActive: this.isLongPressActive,
    };
  }

  // Cleanup
  public dispose(): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }

    this.gestureHandlers.clear();
    this.globalHandlers.clear();
    this.activeGestures.clear();
    this.gestureHistory = [];
  }
}

// Create and export singleton instance
export const gestureManager = new GestureManager();