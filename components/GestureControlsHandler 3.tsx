import { LinearGradient } from 'expo-linear-gradient';
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
} from 'lucide-react-native';
import { MotiView, MotiText } from 'moti';
import React, { useRef, useState } from 'react';
import { View, StyleSheet, Dimensions, Platform, Text, Vibration } from 'react-native';
import {
  PanGestureHandler,
  PinchGestureHandler,
  TapGestureHandler,
  LongPressGestureHandler,
  State,
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
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface GestureControlsProps {
  children: React.ReactNode;
  onVolumeChange?: (volume: number) => void;
  onBrightnessChange?: (brightness: number) => void;
  onPlayPause?: () => void;
  onSeek?: (seconds: number) => void;
  onFullscreen?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
  onPinch?: (scale: number) => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  enableGestures?: boolean;
  showGestureIndicators?: boolean;
}

export const GestureControlsHandler: React.FC<GestureControlsProps> = ({
  children,
  onVolumeChange,
  onBrightnessChange,
  onPlayPause,
  onSeek,
  onFullscreen,
  onDoubleTap,
  onLongPress,
  onPinch,
  onSwipeUp,
  onSwipeDown,
  onSwipeLeft,
  onSwipeRight,
  enableGestures = true,
  showGestureIndicators = true,
}) => {
  const [gestureActive, setGestureActive] = useState(false);
  const [gestureType, setGestureType] = useState<string>('');
  const [gestureValue, setGestureValue] = useState(0);

  // Gesture refs
  const panRef = useRef<PanGestureHandler>(null);
  const pinchRef = useRef<PinchGestureHandler>(null);
  const tapRef = useRef<TapGestureHandler>(null);
  const doubleTapRef = useRef<TapGestureHandler>(null);
  const longPressRef = useRef<LongPressGestureHandler>(null);

  // Animation values
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const indicatorOpacity = useSharedValue(0);
  const indicatorScale = useSharedValue(0.8);

  // Haptic feedback helper
  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (Platform.OS === 'ios') {
      // iOS haptic feedback would be implemented here
      // For now, we'll use Android vibration as fallback
      Vibration.vibrate(type === 'light' ? 10 : type === 'medium' ? 20 : 50);
    } else {
      Vibration.vibrate(type === 'light' ? 50 : type === 'medium' ? 100 : 200);
    }
  };

  // Show gesture indicator
  const showIndicator = (type: string, value?: number) => {
    if (!showGestureIndicators) {
      return;
    }

    setGestureType(type);
    setGestureValue(value || 0);
    setGestureActive(true);

    indicatorOpacity.value = withTiming(1, { duration: 200 });
    indicatorScale.value = withSpring(1, { damping: 15 });
  };

  // Hide gesture indicator
  const hideIndicator = () => {
    indicatorOpacity.value = withTiming(0, { duration: 300 });
    indicatorScale.value = withTiming(0.8, { duration: 300 });

    setTimeout(() => {
      setGestureActive(false);
      setGestureType('');
      setGestureValue(0);
    }, 300);
  };

  // Pan gesture handler
  const panGestureHandler = useAnimatedGestureHandler({
    onStart: (event, context) => {
      context.startX = translateX.value;
      context.startY = translateY.value;
    },
    onActive: (event, context) => {
      const { translationX, translationY, velocityX, velocityY } = event;

      // Determine gesture type based on direction and position
      const isHorizontal = Math.abs(translationX) > Math.abs(translationY);
      const isVertical = Math.abs(translationY) > Math.abs(translationX);

      if (isHorizontal && Math.abs(translationX) > 50) {
        // Horizontal swipe for seeking
        const seekAmount = (translationX / SCREEN_WIDTH) * 30; // 30 seconds max
        runOnJS(showIndicator)('seek', seekAmount);
      } else if (isVertical && Math.abs(translationY) > 50) {
        // Vertical swipe for volume/brightness
        const isLeftSide = event.x < SCREEN_WIDTH / 2;
        const changeAmount = -translationY / SCREEN_HEIGHT;

        if (isLeftSide) {
          // Left side: brightness
          runOnJS(showIndicator)('brightness', changeAmount);
        } else {
          // Right side: volume
          runOnJS(showIndicator)('volume', changeAmount);
        }
      }
    },
    onEnd: (event, context) => {
      const { translationX, translationY, velocityX, velocityY } = event;

      // Determine final gesture
      const isHorizontal = Math.abs(translationX) > Math.abs(translationY);
      const isVertical = Math.abs(translationY) > Math.abs(translationX);

      if (isHorizontal && Math.abs(translationX) > 50) {
        const seekAmount = (translationX / SCREEN_WIDTH) * 30;
        runOnJS(onSeek)?.(seekAmount);
        runOnJS(triggerHaptic)('medium');

        if (translationX > 0) {
          runOnJS(onSwipeRight)?.();
        } else {
          runOnJS(onSwipeLeft)?.();
        }
      } else if (isVertical && Math.abs(translationY) > 50) {
        const isLeftSide = event.x < SCREEN_WIDTH / 2;
        const changeAmount = -translationY / SCREEN_HEIGHT;

        if (isLeftSide) {
          runOnJS(onBrightnessChange)?.(Math.max(0, Math.min(1, changeAmount)));
        } else {
          runOnJS(onVolumeChange)?.(Math.max(0, Math.min(1, changeAmount)));
        }

        runOnJS(triggerHaptic)('light');

        if (translationY > 0) {
          runOnJS(onSwipeDown)?.();
        } else {
          runOnJS(onSwipeUp)?.();
        }
      }

      // Reset animation values
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      runOnJS(hideIndicator)();
    },
  });

  // Pinch gesture handler
  const pinchGestureHandler = useAnimatedGestureHandler({
    onStart: (event, context) => {
      context.startScale = scale.value;
    },
    onActive: (event, context) => {
      const newScale = context.startScale * event.scale;
      scale.value = Math.max(0.5, Math.min(3, newScale));

      runOnJS(showIndicator)('zoom', newScale);
    },
    onEnd: (event, context) => {
      const finalScale = context.startScale * event.scale;
      runOnJS(onPinch)?.(finalScale);
      runOnJS(triggerHaptic)('medium');
      runOnJS(hideIndicator)();
    },
  });

  // Tap gesture handler
  const tapGestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      scale.value = withSpring(0.95, { damping: 15 });
    },
    onEnd: () => {
      scale.value = withSpring(1, { damping: 15 });
      runOnJS(onPlayPause)?.();
      runOnJS(triggerHaptic)('light');
    },
  });

  // Double tap gesture handler
  const doubleTapGestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      scale.value = withSpring(1.1, { damping: 10 });
    },
    onEnd: () => {
      scale.value = withSpring(1, { damping: 15 });
      runOnJS(onDoubleTap)?.();
      runOnJS(triggerHaptic)('medium');
    },
  });

  // Long press gesture handler
  const longPressGestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      scale.value = withSpring(1.05, { damping: 12 });
    },
    onActive: () => {
      // Visual feedback for long press
      opacity.value = withTiming(0.8, { duration: 200 });
    },
    onEnd: () => {
      scale.value = withSpring(1, { damping: 15 });
      opacity.value = withTiming(1, { duration: 200 });
      runOnJS(onLongPress)?.();
      runOnJS(triggerHaptic)('heavy');
    },
  });

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const indicatorAnimatedStyle = useAnimatedStyle(() => ({
    opacity: indicatorOpacity.value,
    transform: [{ scale: indicatorScale.value }],
  }));

  // Get gesture indicator content
  const getGestureIndicator = () => {
    switch (gestureType) {
      case 'volume':
        return {
          icon:
            gestureValue > 0 ? (
              <Volume2 size={24} color="#fff" />
            ) : (
              <VolumeX size={24} color="#fff" />
            ),
          text: `Volume ${Math.round(gestureValue * 100)}%`,
          color: ['#10B981', '#059669'],
        };
      case 'brightness':
        return {
          icon:
            gestureValue > 0 ? (
              <Brightness size={24} color="#fff" />
            ) : (
              <BrightnessDown size={24} color="#fff" />
            ),
          text: `Brightness ${Math.round(gestureValue * 100)}%`,
          color: ['#F59E0B', '#D97706'],
        };
      case 'seek':
        return {
          icon:
            gestureValue > 0 ? (
              <SkipForward size={24} color="#fff" />
            ) : (
              <SkipBack size={24} color="#fff" />
            ),
          text: `${gestureValue > 0 ? '+' : ''}${Math.round(gestureValue)}s`,
          color: ['#8B5CF6', '#7C3AED'],
        };
      case 'zoom':
        return {
          icon:
            gestureValue > 1 ? (
              <ZoomIn size={24} color="#fff" />
            ) : (
              <ZoomOut size={24} color="#fff" />
            ),
          text: `${Math.round(gestureValue * 100)}%`,
          color: ['#6366F1', '#4F46E5'],
        };
      default:
        return {
          icon: <Hand size={24} color="#fff" />,
          text: 'Gesture',
          color: ['#666', '#555'],
        };
    }
  };

  const indicator = getGestureIndicator();

  if (!enableGestures) {
    return <View style={styles.container}>{children}</View>;
  }

  return (
    <View style={styles.container}>
      <LongPressGestureHandler
        ref={longPressRef}
        onGestureEvent={longPressGestureHandler}
        minDurationMs={500}
        enabled={enableGestures}
      >
        <Animated.View style={StyleSheet.absoluteFill}>
          <TapGestureHandler
            ref={doubleTapRef}
            onGestureEvent={doubleTapGestureHandler}
            numberOfTaps={2}
            enabled={enableGestures}
          >
            <Animated.View style={StyleSheet.absoluteFill}>
              <TapGestureHandler
                ref={tapRef}
                onGestureEvent={tapGestureHandler}
                waitFor={doubleTapRef}
                enabled={enableGestures}
              >
                <Animated.View style={StyleSheet.absoluteFill}>
                  <PinchGestureHandler
                    ref={pinchRef}
                    onGestureEvent={pinchGestureHandler}
                    simultaneousHandlers={[panRef]}
                    enabled={enableGestures}
                  >
                    <Animated.View style={StyleSheet.absoluteFill}>
                      <PanGestureHandler
                        ref={panRef}
                        onGestureEvent={panGestureHandler}
                        simultaneousHandlers={[pinchRef]}
                        enabled={enableGestures}
                      >
                        <Animated.View style={[styles.gestureArea, animatedStyle]}>
                          {children}
                        </Animated.View>
                      </PanGestureHandler>
                    </Animated.View>
                  </PinchGestureHandler>
                </Animated.View>
              </TapGestureHandler>
            </Animated.View>
          </TapGestureHandler>
        </Animated.View>
      </LongPressGestureHandler>

      {/* Gesture Indicator */}
      {gestureActive && showGestureIndicators && (
        <Animated.View style={[styles.gestureIndicator, indicatorAnimatedStyle]}>
          <LinearGradient colors={indicator.color} style={styles.indicatorGradient}>
            <View style={styles.indicatorContent}>
              {indicator.icon}
              <Text style={styles.indicatorText}>{indicator.text}</Text>
            </View>
          </LinearGradient>
        </Animated.View>
      )}

      {/* Gesture Hints */}
      {showGestureIndicators && (
        <View style={styles.gestureHints}>
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ delay: 2000 }}
            style={styles.hintContainer}
          >
            <View style={styles.hintItem}>
              <Hand size={12} color="#666" />
              <Text style={styles.hintText}>Swipe for volume/brightness</Text>
            </View>
            <View style={styles.hintItem}>
              <Move size={12} color="#666" />
              <Text style={styles.hintText}>Pinch to zoom</Text>
            </View>
            <View style={styles.hintItem}>
              <Play size={12} color="#666" />
              <Text style={styles.hintText}>Tap to play/pause</Text>
            </View>
          </MotiView>
        </View>
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
    transform: [{ translateX: -75 }, { translateY: -40 }],
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  indicatorGradient: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    minWidth: 150,
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
  gestureHints: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  hintContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  hintItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hintText: {
    color: '#666',
    fontSize: 12,
  },
});

export default GestureControlsHandler;
