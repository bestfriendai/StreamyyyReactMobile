import { 
  Volume2, 
  VolumeX,
  Volume1,
  Sun,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Maximize,
  Minimize,
  RotateCcw,
  FastForward,
  Rewind,
  Zap,
  Target,
} from 'lucide-react-native';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Text,
  Vibration,
  Platform,
} from 'react-native';
import {
  PanGestureHandler,
  TapGestureHandler,
  PinchGestureHandler,
  State,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView, MotiText, AnimatePresence } from 'moti';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withSpring,
  withTiming,
  withSequence,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  withDelay,
} from 'react-native-reanimated';
import { ModernTheme } from '@/theme/modernTheme';
import { BlurViewFallback as BlurView } from './BlurViewFallback';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export type GestureType =
  | 'single_tap'
  | 'double_tap'
  | 'triple_tap'
  | 'long_press'
  | 'swipe_left'
  | 'swipe_right'
  | 'swipe_up'
  | 'swipe_down'
  | 'pinch_in'
  | 'pinch_out'
  | 'pan'
  | 'none';

export type GestureZone =
  | 'left'
  | 'center'
  | 'right'
  | 'top'
  | 'bottom'
  | 'full';

export interface GestureAction {
  type: GestureType;
  zone: GestureZone;
  action: () => void;
  label: string;
  icon: React.ReactNode;
  haptic?: boolean;
  preventDuringPlayback?: boolean;
}

export interface GestureConfig {
  swipeThreshold: number;
  tapThreshold: number;
  longPressThreshold: number;
  pinchThreshold: number;
  doubleTapDelay: number;
  vibrationEnabled: boolean;
  zoneBasedGestures: boolean;
  showFeedback: boolean;
  sensitivityLevel: 'low' | 'medium' | 'high';
}

interface GestureEnhancedPlayerProps {
  children: React.ReactNode;
  isPlaying: boolean;
  volume: number;
  brightness: number;
  onPlayPause: () => void;
  onVolumeChange: (volume: number) => void;
  onBrightnessChange: (brightness: number) => void;
  onSeek: (seconds: number) => void;
  onFullscreenToggle: () => void;
  onShowControls: () => void;
  onHideControls: () => void;
  onDoubleTapSeek: (direction: 'forward' | 'backward') => void;
  customGestures?: GestureAction[];
  config?: Partial<GestureConfig>;
  enabled?: boolean;
}

const defaultConfig: GestureConfig = {
  swipeThreshold: 50,
  tapThreshold: 250,
  longPressThreshold: 800,
  pinchThreshold: 0.2,
  doubleTapDelay: 300,
  vibrationEnabled: true,
  zoneBasedGestures: true,
  showFeedback: true,
  sensitivityLevel: 'medium',
};

export const GestureEnhancedPlayer: React.FC<GestureEnhancedPlayerProps> = ({
  children,
  isPlaying,
  volume,
  brightness,
  onPlayPause,
  onVolumeChange,
  onBrightnessChange,
  onSeek,
  onFullscreenToggle,
  onShowControls,
  onHideControls,
  onDoubleTapSeek,
  customGestures = [],
  config: userConfig = {},
  enabled = true,
}) => {
  const config = { ...defaultConfig, ...userConfig };

  // State
  const [activeGesture, setActiveGesture] = useState<GestureType>('none');
  const [gestureZone, setGestureZone] = useState<GestureZone>('center');
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackIcon, setFeedbackIcon] = useState<React.ReactNode>(null);
  const [lastTapTime, setLastTapTime] = useState(0);
  const [tapCount, setTapCount] = useState(0);

  // Refs
  const panRef = useRef<PanGestureHandler>(null);
  const tapRef = useRef<TapGestureHandler>(null);
  const doubleTapRef = useRef<TapGestureHandler>(null);
  const pinchRef = useRef<PinchGestureHandler>(null);
  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Animation values
  const gestureScale = useSharedValue(1);
  const gestureX = useSharedValue(0);
  const gestureY = useSharedValue(0);
  const feedbackOpacity = useSharedValue(0);
  const feedbackScale = useSharedValue(0.8);
  const volumeIndicatorOpacity = useSharedValue(0);
  const brightnessIndicatorOpacity = useSharedValue(0);
  const seekIndicatorOpacity = useSharedValue(0);
  const rippleScale = useSharedValue(0);
  const rippleOpacity = useSharedValue(0);
  const rippleX = useSharedValue(SCREEN_WIDTH / 2);
  const rippleY = useSharedValue(SCREEN_HEIGHT / 2);

  // Gesture zone detection
  const getGestureZone = useCallback(
    (x: number, y: number): GestureZone => {
      if (!config.zoneBasedGestures) {return 'full';}

    const leftZone = SCREEN_WIDTH * 0.3;
      const rightZone = SCREEN_WIDTH * 0.7;
      const topZone = SCREEN_HEIGHT * 0.3;
      const bottomZone = SCREEN_HEIGHT * 0.7;

    if (y < topZone) {return 'top';}
      if (y > bottomZone) {return 'bottom';}
      if (x < leftZone) {return 'left';}
      if (x > rightZone) {return 'right';}
      return 'center';
    },
    [config.zoneBasedGestures]
  );

  // Haptic feedback
  const triggerHaptic = useCallback(
    (type: 'light' | 'medium' | 'heavy' = 'light') => {
      if (!config.vibrationEnabled) {return;}

    if (Platform.OS === 'ios') {
        const impact = require('react-native').Haptics?.impactAsync;
        if (impact) {
          impact(type === 'light' ? 0 : type === 'medium' ? 1 : 2);
        }
      } else {
        Vibration.vibrate(type === 'light' ? 50 : type === 'medium' ? 100 : 200);
      }
    },
    [config.vibrationEnabled]
  );

  // Show feedback
  const showFeedback = useCallback(
    (text: string, icon: React.ReactNode, haptic: boolean = true) => {
      if (!config.showFeedback) {return;}

    if (haptic) {triggerHaptic('light');}

    setFeedbackText(text);
      setFeedbackIcon(icon);
      setFeedbackVisible(true);


    feedbackOpacity.value = withTiming(1, { duration: 200 });
      feedbackScale.value = withSequence(
        withTiming(1.1, { duration: 100 }),
        withTiming(1, { duration: 100 })
      );


    // Auto hide after delay
      setTimeout(() => {
        feedbackOpacity.value = withTiming(0, { duration: 300 });
        feedbackScale.value = withTiming(0.8, { duration: 300 }, () => {
          runOnJS(setFeedbackVisible)(false);
        });
      }, 1500);
    },
    [config.showFeedback, triggerHaptic, feedbackOpacity, feedbackScale]
  );

  // Show ripple effect
  const showRipple = useCallback(
    (x: number, y: number) => {
      rippleX.value = x;
      rippleY.value = y;
      rippleScale.value = 0;
      rippleOpacity.value = 0.3;

    rippleScale.value = withTiming(1, { duration: 600 });
      rippleOpacity.value = withTiming(0, { duration: 600 });
    },
    [rippleX, rippleY, rippleScale, rippleOpacity]
  );

  // Handle volume adjustment
  const handleVolumeAdjustment = useCallback(
    (deltaY: number) => {
      const sensitivity =
        config.sensitivityLevel === 'high'
      config.sensitivityLevel === 'medium' ? 0.005 : 0.002;
      const volumeChange = -(deltaY * sensitivity);
      const newVolume = Math.max(0, Math.min(1, volume + volumeChange));

    onVolumeChange(newVolume);

    volumeIndicatorOpacity.value = withTiming(1, { duration: 100 });
      volumeIndicatorOpacity.value = withDelay(1000, withTiming(0, { duration: 300 }));

    const volumeIcon = newVolume === 0 ? <VolumeX size={24} color="#fff" /> :
      newVolume < 0.5 ? <Volume1 size={24} color="#fff" /> :
        <Volume2 size={24} color="#fff" />;


      showFeedback(`Volume ${Math.round(newVolume * 100)}%`, volumeIcon, false);
    },
    [volume, onVolumeChange, config.sensitivityLevel, showFeedback, volumeIndicatorOpacity]
  );

  // Handle brightness adjustment
  const handleBrightnessAdjustment = useCallback(
    (deltaY: number) => {
      const sensitivity =
        config.sensitivityLevel === 'high'
      config.sensitivityLevel === 'medium' ? 0.005 : 0.002;
      const brightnessChange = -(deltaY * sensitivity);
      const newBrightness = Math.max(0, Math.min(1, brightness + brightnessChange));

    onBrightnessChange(newBrightness);

    brightnessIndicatorOpacity.value = withTiming(1, { duration: 100 });
      brightnessIndicatorOpacity.value = withDelay(1000, withTiming(0, { duration: 300 }));

    showFeedback(`Brightness ${Math.round(newBrightness * 100)}%`,
      <Sun size={24} color="#fff" />, false);
    },
    [
      brightness,
      onBrightnessChange,
      config.sensitivityLevel,
      showFeedback,
      brightnessIndicatorOpacity,
    ]
  );

  // Handle seeking
  const handleSeeking = useCallback(
    (deltaX: number) => {
      const sensitivity =
        config.sensitivityLevel === 'high' ? 0.5 : config.sensitivityLevel === 'medium' ? 0.3 : 0.1;
      const seekSeconds = deltaX * sensitivity;

    onSeek(seekSeconds);

    seekIndicatorOpacity.value = withTiming(1, { duration: 100 });
      seekIndicatorOpacity.value = withDelay(1000, withTiming(0, { duration: 300 }));

    const seekIcon = seekSeconds > 0 ? <FastForward size={24} color="#fff" /> :
      <Rewind size={24} color="#fff" />;
      const seekText =
        seekSeconds > 0 ? `+${Math.round(seekSeconds)}s` : `${Math.round(seekSeconds)}s`;

    showFeedback(seekText, seekIcon, false);
    },
    [onSeek, config.sensitivityLevel, showFeedback, seekIndicatorOpacity]
  );

  // Pan gesture handler
  const panGestureHandler = useAnimatedGestureHandler({
    onStart: (event, context) => {
      if (!enabled) {return;}

      context.startX = gestureX.value;
      context.startY = gestureY.value;
      context.gestureZone = runOnJS(getGestureZone)(event.x, event.y);

      gestureScale.value = withTiming(1.02, { duration: 100 });
    },
    onActive: (event, context) => {
      if (!enabled) {return;}

      gestureX.value = context.startX + event.translationX;
      gestureY.value = context.startY + event.translationY;

      const zone = context.gestureZone as GestureZone;

      // Handle different gestures based on zone
      if (Math.abs(event.translationY) > Math.abs(event.translationX)) {
        // Vertical gesture
        if (zone === 'left') {
          // Left side - brightness control
          runOnJS(handleBrightnessAdjustment)(event.translationY);
        } else if (zone === 'right') {
          // Right side - volume control
          runOnJS(handleVolumeAdjustment)(event.translationY);
        }
      } else {
        // Horizontal gesture - seeking
        if (zone === 'center' || zone === 'full') {
          runOnJS(handleSeeking)(event.translationX);
        }
      }
    },
    onEnd: (event, context) => {
      if (!enabled) {return;}

      gestureX.value = withSpring(0);
      gestureY.value = withSpring(0);
      gestureScale.value = withTiming(1, { duration: 200 });

      const absX = Math.abs(event.translationX);
      const absY = Math.abs(event.translationY);
      const velocityThreshold = 500;

      // Handle swipe gestures
      if (absX > config.swipeThreshold || Math.abs(event.velocityX) > velocityThreshold) {
        if (event.translationX > 0) {
          runOnJS(onDoubleTapSeek)('forward');
          runOnJS(showFeedback)('Skip Forward', <SkipForward size={24} color="#fff" />);
        } else {
          runOnJS(onDoubleTapSeek)('backward');
          runOnJS(showFeedback)('Skip Backward', <SkipBack size={24} color="#fff" />);
        }
      }

      if (absY > config.swipeThreshold || Math.abs(event.velocityY) > velocityThreshold) {
        if (event.translationY < 0) {
          // Swipe up - show controls
          runOnJS(onShowControls)();
        } else {
          // Swipe down - hide controls or minimize
          runOnJS(onHideControls)();
        }
      }
    },
  });

  // Tap gesture handler
  const tapGestureHandler = useAnimatedGestureHandler({
    onEnd: event => {
      if (!enabled) {return;}

      const now = Date.now();
      const zone = runOnJS(getGestureZone)(event.x, event.y);

      runOnJS(showRipple)(event.x, event.y);
      runOnJS(setGestureZone)(zone);

      // Handle tap counting for multiple taps
      runOnJS((currentTime: number) => {
        const timeDiff = currentTime - lastTapTime;

        if (timeDiff < config.doubleTapDelay) {
          setTapCount(prev => prev + 1);
        } else {
          setTapCount(1);
        }

        setLastTapTime(currentTime);

        // Handle different tap counts
        setTimeout(() => {
          if (tapCount === 1) {
            // Single tap - toggle controls
            onShowControls();
            showFeedback('Controls', <Target size={24} color="#fff" />);
          } else if (tapCount === 2) {
            // Double tap - play/pause or seek based on zone
            if (zone === 'left') {
              onDoubleTapSeek('backward');
              showFeedback('Skip Backward', <SkipBack size={24} color="#fff" />);
            } else if (zone === 'right') {
              onDoubleTapSeek('forward');
              showFeedback('Skip Forward', <SkipForward size={24} color="#fff" />);
            } else {
              onPlayPause();
              showFeedback(
                isPlaying ? 'Pause' : 'Play',
                isPlaying ? <Pause size={24} color="#fff" /> : <Play size={24} color="#fff" />);
            }
          } else if (tapCount === 3) {
            // Triple tap - fullscreen toggle
            onFullscreenToggle();
            showFeedback('Fullscreen', <Maximize size={24} color="#fff" />);
          }

          setTapCount(0);
        }, config.doubleTapDelay);
      })(now);
    },
  });

  // Long press handler
  const handleLongPress = useCallback(() => {
    if (!enabled) {return;}

    triggerHaptic('medium');
    showFeedback('Options', <RotateCcw size={24} color="#fff" />);
    // Add custom long press action here
  }, [enabled, triggerHaptic, showFeedback]);

  // Pinch gesture handler
  const pinchGestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      if (!enabled) {return;}
      gestureScale.value = 1;
    },
    onActive: event => {
      if (!enabled) {return;}
      gestureScale.value = event.scale;
    },
    onEnd: event => {
      if (!enabled) {return;}

      gestureScale.value = withSpring(1);

      if (event.scale > 1 + config.pinchThreshold) {
        // Pinch out - fullscreen
        runOnJS(onFullscreenToggle)();
        runOnJS(showFeedback)('Fullscreen', <Maximize size={24} color="#fff" />);
      } else if (event.scale < 1 - config.pinchThreshold) {
        // Pinch in - minimize
        runOnJS(showFeedback)('Minimize', <Minimize size={24} color="#fff" />);
      }
    },
  });

  // Animated styles
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: gestureScale.value },
      { translateX: gestureX.value * 0.1 },
      { translateY: gestureY.value * 0.1 },
    ],
  }));

  const feedbackAnimatedStyle = useAnimatedStyle(() => ({
    opacity: feedbackOpacity.value,
    transform: [{ scale: feedbackScale.value }],
  }));

  const rippleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: rippleOpacity.value,
    transform: [
      { scale: rippleScale.value },
      { translateX: rippleX.value - 50 },
      { translateY: rippleY.value - 50 },
    ],
  }));

  const volumeIndicatorStyle = useAnimatedStyle(() => ({
    opacity: volumeIndicatorOpacity.value,
  }));

  const brightnessIndicatorStyle = useAnimatedStyle(() => ({
    opacity: brightnessIndicatorOpacity.value,
  }));

  const seekIndicatorStyle = useAnimatedStyle(() => ({
    opacity: seekIndicatorOpacity.value,
  }));

  if (!enabled) {
    return <View style={styles.container}>{children}</View>;
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <PinchGestureHandler
        ref={pinchRef}
        onGestureEvent={pinchGestureHandler}
        simultaneousHandlers={[panRef]}
      >
        <Animated.View style={StyleSheet.absoluteFill}>
          <PanGestureHandler
            ref={panRef}
            onGestureEvent={panGestureHandler}
            simultaneousHandlers={[pinchRef]}
            minPointers={1}
            maxPointers={2}
          >
            <Animated.View style={StyleSheet.absoluteFill}>
              <TapGestureHandler ref={tapRef} onGestureEvent={tapGestureHandler} numberOfTaps={1}>
                <Animated.View style={[StyleSheet.absoluteFill, containerAnimatedStyle]}>
                  {children}

                  {/* Gesture feedback overlay */}
                  <AnimatePresence>
                    {feedbackVisible && (
                      <Animated.View style={[styles.feedbackOverlay, feedbackAnimatedStyle]}>
                        <BlurView style={styles.feedbackBlur} blurType="dark" blurAmount={20}>
                          <LinearGradient
                            colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.6)']}
                            style={styles.feedbackContent}
                          >
                            {feedbackIcon}
                            <Text style={styles.feedbackText}>{feedbackText}</Text>
                          </LinearGradient>
                        </BlurView>
                      </Animated.View>
                    )}
                  </AnimatePresence>

                  {/* Ripple effect */}
                  <Animated.View style={[styles.ripple, rippleAnimatedStyle]} />

                  {/* Volume indicator */}
                  <Animated.View style={[styles.volumeIndicator, volumeIndicatorStyle]}>
                    <BlurView style={styles.indicatorBlur} blurType="dark" blurAmount={15}>
                      <View style={styles.indicatorContent}>
                        {volume === 0 ? (
                          <VolumeX size={20} color="#fff" />
                          volume < 0.5 ? <Volume1 size={20} color="#fff" /> :
                            <Volume2 size={20} color="#fff" />}
                        <View style={styles.volumeBars}>
                          {[...Array(10)].map((_, index) => (
                            <View
                              key={index}
                              style={[
                                styles.volumeBar,
                                {
                                  backgroundColor:
                                    index < volume * 10 ? '#fff' : 'rgba(255,255,255,0.3)',
                                  height: 4 + index * 2,
                                },
                              ]}
                            />
                          ))}
                        </View>
                      </View>
                    </BlurView>
                  </Animated.View>

                  {/* Brightness indicator */}
                  <Animated.View style={[styles.brightnessIndicator, brightnessIndicatorStyle]}>
                    <BlurView style={styles.indicatorBlur} blurType="dark" blurAmount={15}>
                      <View style={styles.indicatorContent}>
                        <Sun size={20} color="#fff" />
                        <View style={styles.brightnessCircle}>
                          <View
                            style={[
                              styles.brightnessFill,
                              {
                                height: `${brightness * 100}%`,
                              },
                            ]}
                          />
                        </View>
                      </View>
                    </BlurView>
                  </Animated.View>

                  {/* Seek indicator */}
                  <Animated.View style={[styles.seekIndicator, seekIndicatorStyle]}>
                    <BlurView style={styles.indicatorBlur} blurType="dark" blurAmount={15}>
                      <View style={styles.seekContent}>
                        <Zap size={20} color="#fff" />
                        <Text style={styles.seekText}>Seeking...</Text>
                      </View>
                    </BlurView>
                  </Animated.View>

                  {/* Gesture zones indicator (debug mode) */}
                  {__DEV__ && config.zoneBasedGestures && (
                    <View style={styles.gestureZones}>
                      <View style={[styles.zone, styles.leftZone]} />
                      <View style={[styles.zone, styles.centerZone]} />
                      <View style={[styles.zone, styles.rightZone]} />
                    </View>
                  )}
                </Animated.View>
              </TapGestureHandler>
            </Animated.View>
          </PanGestureHandler>
        </Animated.View>
      </PinchGestureHandler>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  feedbackOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -60 }, { translateY: -40 }],
    width: 120,
    height: 80,
    borderRadius: ModernTheme.borderRadius.lg,
    overflow: 'hidden',
  },
  feedbackBlur: {
    flex: 1,
    borderRadius: ModernTheme.borderRadius.lg,
  },
  feedbackContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: ModernTheme.spacing.sm,
  },
  feedbackText: {
    color: ModernTheme.colors.text.primary,
    fontSize: ModernTheme.typography.sizes.sm,
    fontWeight: ModernTheme.typography.weights.semibold,
    textAlign: 'center',
  },
  ripple: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    pointerEvents: 'none',
  },
  volumeIndicator: {
    position: 'absolute',
    right: ModernTheme.spacing.lg,
    top: '50%',
    transform: [{ translateY: -40 }],
    borderRadius: ModernTheme.borderRadius.lg,
    overflow: 'hidden',
  },
  brightnessIndicator: {
    position: 'absolute',
    left: ModernTheme.spacing.lg,
    top: '50%',
    transform: [{ translateY: -40 }],
    borderRadius: ModernTheme.borderRadius.lg,
    overflow: 'hidden',
  },
  seekIndicator: {
    position: 'absolute',
    bottom: 100,
    left: '50%',
    transform: [{ translateX: -60 }],
    borderRadius: ModernTheme.borderRadius.lg,
    overflow: 'hidden',
  },
  indicatorBlur: {
    borderRadius: ModernTheme.borderRadius.lg,
  },
  indicatorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: ModernTheme.spacing.md,
    gap: ModernTheme.spacing.sm,
  },
  volumeBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: 20,
  },
  volumeBar: {
    width: 3,
    borderRadius: 1.5,
  },
  brightnessCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  brightnessFill: {
    width: '100%',
    backgroundColor: '#fff',
  },
  seekContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ModernTheme.spacing.md,
    paddingVertical: ModernTheme.spacing.sm,
    gap: ModernTheme.spacing.sm,
  },
  seekText: {
    color: ModernTheme.colors.text.primary,
    fontSize: ModernTheme.typography.sizes.sm,
    fontWeight: ModernTheme.typography.weights.medium,
  },
  gestureZones: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  zone: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  leftZone: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
  },
  centerZone: {
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
  },
  rightZone: {
    backgroundColor: 'rgba(0, 0, 255, 0.1)',
  },
});

export default GestureEnhancedPlayer;
