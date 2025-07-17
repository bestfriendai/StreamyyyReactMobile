import React, { useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
  Vibration,
  Platform,
} from 'react-native';
import {
  PanGestureHandler,
  PinchGestureHandler,
  TapGestureHandler,
  LongPressGestureHandler,
  State,
  PinchGestureHandlerGestureEvent,
  TapGestureHandlerGestureEvent,
  LongPressGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  useAnimatedGestureHandler,
  PanGestureHandlerGestureEvent,
} from 'react-native-reanimated';
import { TwitchStream } from '@/services/twitchApi';

export interface GridGestureConfig {
  enablePanToReorder?: boolean;
  enablePinchToZoom?: boolean;
  enableSwipeToRemove?: boolean;
  enableDoubleTapToFocus?: boolean;
  enableLongPressMenu?: boolean;
  hapticFeedback?: boolean;
  animationDuration?: number;
}

export interface GestureCallbacks {
  onStreamReorder?: (fromIndex: number, toIndex: number) => void;
  onStreamRemove?: (stream: TwitchStream) => void;
  onStreamFocus?: (stream: TwitchStream) => void;
  onStreamMenu?: (stream: TwitchStream, position: { x: number; y: number }) => void;
  onZoomChange?: (scale: number) => void;
  onPanStart?: () => void;
  onPanEnd?: () => void;
}

interface GridGestureHandlerProps {
  children: React.ReactNode;
  stream: TwitchStream;
  index: number;
  config?: GridGestureConfig;
  callbacks?: GestureCallbacks;
  width: number;
  height: number;
  disabled?: boolean;
}

const DEFAULT_CONFIG: GridGestureConfig = {
  enablePanToReorder: true,
  enablePinchToZoom: false, // Disabled by default in grid context
  enableSwipeToRemove: true,
  enableDoubleTapToFocus: true,
  enableLongPressMenu: true,
  hapticFeedback: true,
  animationDuration: 300,
};

const GESTURE_THRESHOLDS = {
  swipeDistance: 50,
  longPressDuration: 500,
  panThreshold: 10,
  zoomMin: 0.8,
  zoomMax: 3.0,
  hapticIntensity: Platform.OS === 'ios' ? 'medium' : 'heavy',
};

export const GridGestureHandler: React.FC<GridGestureHandlerProps> = ({
  children,
  stream,
  index,
  config = DEFAULT_CONFIG,
  callbacks = {},
  width,
  height,
  disabled = false,
}) => {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

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
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(1);
  const borderGlow = useSharedValue(0);

  // Gesture state tracking
  const isDragging = useSharedValue(false);
  const isZooming = useSharedValue(false);
  const dragStartPosition = useSharedValue({ x: 0, y: 0 });

  // Haptic feedback helper
  const triggerHaptic = useCallback(
    (intensity: 'light' | 'medium' | 'heavy' = 'medium') => {
      if (!mergedConfig.hapticFeedback) {
        return;
      }

      if (Platform.OS === 'ios') {
        const HapticFeedback = require('react-native-haptic-feedback').default;
        const options = {
          enableVibrateFallback: true,
          ignoreAndroidSystemSettings: false,
        };

        switch (intensity) {
          case 'light':
            HapticFeedback.trigger('impactLight', options);
            break;
          case 'heavy':
            HapticFeedback.trigger('impactHeavy', options);
            break;
          default:
            HapticFeedback.trigger('impactMedium', options);
        }
      } else {
        Vibration.vibrate(intensity === 'heavy' ? 100 : 50);
      }
    },
    [mergedConfig.hapticFeedback]
  );

  // Reset animations to default state
  const resetAnimations = useCallback(() => {
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    scale.value = withSpring(1);
    rotation.value = withSpring(0);
    opacity.value = withSpring(1);
    isDragging.value = false;
    isZooming.value = false;
  }, []);

  // Pan gesture handler (for reordering)
  const panGestureHandler = useAnimatedGestureHandler<
    PanGestureHandlerGestureEvent,
    { startX: number; startY: number }
  >({
    onStart: (_, context) => {
      if (!mergedConfig.enablePanToReorder) {
        return;
      }

      context.startX = translateX.value;
      context.startY = translateY.value;
      dragStartPosition.value = { x: context.startX, y: context.startY };
      isDragging.value = true;

      runOnJS(triggerHaptic)('light');
      runOnJS(callbacks.onPanStart || (() => {}))();

      // Visual feedback for drag start
      scale.value = withSpring(1.1, { damping: 15 });
      borderGlow.value = withTiming(1, { duration: 200 });
    },

    onActive: (event, context) => {
      if (!mergedConfig.enablePanToReorder) {
        return;
      }

      translateX.value = context.startX + event.translationX;
      translateY.value = context.startY + event.translationY;

      // Add subtle rotation during drag
      const rotationIntensity = Math.min(Math.abs(event.translationX) / 100, 1);
      rotation.value = (event.translationX > 0 ? 5 : -5) * rotationIntensity;

      // Reduce opacity when dragging far
      const distance = Math.sqrt(
        event.translationX * event.translationX + event.translationY * event.translationY
      );
      opacity.value = Math.max(0.7, 1 - distance / 200);
    },

    onEnd: event => {
      if (!mergedConfig.enablePanToReorder) {
        return;
      }

      isDragging.value = false;
      runOnJS(callbacks.onPanEnd || (() => {}))();

      // Check if this was a swipe to remove gesture
      const isSwipeRemove =
        mergedConfig.enableSwipeToRemove &&
        Math.abs(event.translationX) > GESTURE_THRESHOLDS.swipeDistance;

      if (isSwipeRemove) {
        // Animate out and remove
        translateX.value = withTiming(event.translationX > 0 ? width * 1.5 : -width * 1.5, {
          duration: mergedConfig.animationDuration,
        });
        opacity.value = withTiming(0, { duration: mergedConfig.animationDuration });

        runOnJS(triggerHaptic)('heavy');
        runOnJS(callbacks.onStreamRemove || (() => {}))(stream);
      } else {
        // Reset to original position
        runOnJS(resetAnimations)();
      }

      borderGlow.value = withTiming(0, { duration: 200 });
    },
  });

  // Pinch gesture handler (for zooming in focus mode)
  const pinchGestureHandler = useAnimatedGestureHandler<PinchGestureHandlerGestureEvent>({
    onStart: () => {
      if (!mergedConfig.enablePinchToZoom) {
        return;
      }
      isZooming.value = true;
      runOnJS(triggerHaptic)('light');
    },

    onActive: event => {
      if (!mergedConfig.enablePinchToZoom) {
        return;
      }

      const newScale = Math.max(
        GESTURE_THRESHOLDS.zoomMin,
        Math.min(GESTURE_THRESHOLDS.zoomMax, event.scale)
      );
      scale.value = newScale;
      runOnJS(callbacks.onZoomChange || (() => {}))(newScale);
    },

    onEnd: () => {
      if (!mergedConfig.enablePinchToZoom) {
        return;
      }

      isZooming.value = false;
      // Reset scale if not significantly zoomed
      if (scale.value < 1.2) {
        scale.value = withSpring(1);
      }
    },
  });

  // Single tap handler
  const tapGestureHandler = (event: TapGestureHandlerGestureEvent) => {
    if (event.nativeEvent.state === State.ACTIVE) {
      // Quick visual feedback
      scale.value = withSpring(0.95, { damping: 20 }, () => {
        scale.value = withSpring(1);
      });
    }
  };

  // Double tap handler (focus stream)
  const doubleTapGestureHandler = (event: TapGestureHandlerGestureEvent) => {
    if (event.nativeEvent.state === State.ACTIVE && mergedConfig.enableDoubleTapToFocus) {
      runOnJS(triggerHaptic)('medium');

      // Focus animation
      scale.value = withSpring(1.1, { damping: 12 }, () => {
        scale.value = withSpring(1);
      });

      runOnJS(callbacks.onStreamFocus || (() => {}))(stream);
    }
  };

  // Long press handler (context menu)
  const longPressGestureHandler = (event: LongPressGestureHandlerGestureEvent) => {
    if (event.nativeEvent.state === State.ACTIVE && mergedConfig.enableLongPressMenu) {
      runOnJS(triggerHaptic)('heavy');

      // Long press visual feedback
      scale.value = withSpring(1.05);
      borderGlow.value = withTiming(1, { duration: 200 });

      const menuPosition = {
        x: event.nativeEvent.absoluteX,
        y: event.nativeEvent.absoluteY,
      };

      runOnJS(callbacks.onStreamMenu || (() => {}))(stream, menuPosition);

      // Reset after a delay
      setTimeout(() => {
        resetAnimations();
      }, 1000);
    }
  };

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
        { rotate: `${rotation.value}deg` },
      ],
      opacity: opacity.value,
      borderWidth: interpolate(borderGlow.value, [0, 1], [0, 2]),
      borderColor: `rgba(139, 92, 246, ${borderGlow.value})`,
      shadowOpacity: interpolate(borderGlow.value, [0, 1], [0.2, 0.6]),
      shadowRadius: interpolate(borderGlow.value, [0, 1], [4, 12]),
      zIndex: isDragging.value || isZooming.value ? 1000 : 1,
    };
  });

  if (disabled) {
    return <View style={[{ width, height }]}>{children}</View>;
  }

  return (
    <PanGestureHandler
      ref={panRef}
      onGestureEvent={panGestureHandler}
      enabled={mergedConfig.enablePanToReorder}
      minPointers={1}
      maxPointers={1}
      simultaneousHandlers={[tapRef, doubleTapRef]}
    >
      <Animated.View>
        <PinchGestureHandler
          ref={pinchRef}
          onGestureEvent={pinchGestureHandler}
          enabled={mergedConfig.enablePinchToZoom}
          simultaneousHandlers={[panRef]}
        >
          <Animated.View>
            <LongPressGestureHandler
              ref={longPressRef}
              onHandlerStateChange={longPressGestureHandler}
              enabled={mergedConfig.enableLongPressMenu}
              minDurationMs={GESTURE_THRESHOLDS.longPressDuration}
              simultaneousHandlers={[tapRef]}
            >
              <Animated.View>
                <TapGestureHandler
                  ref={doubleTapRef}
                  onHandlerStateChange={doubleTapGestureHandler}
                  enabled={mergedConfig.enableDoubleTapToFocus}
                  numberOfTaps={2}
                  waitFor={tapRef}
                >
                  <Animated.View>
                    <TapGestureHandler
                      ref={tapRef}
                      onHandlerStateChange={tapGestureHandler}
                      enabled
                      waitFor={doubleTapRef}
                      shouldCancelWhenOutside
                    >
                      <Animated.View style={[styles.container, { width, height }, animatedStyle]}>
                        {children}
                      </Animated.View>
                    </TapGestureHandler>
                  </Animated.View>
                </TapGestureHandler>
              </Animated.View>
            </LongPressGestureHandler>
          </Animated.View>
        </PinchGestureHandler>
      </Animated.View>
    </PanGestureHandler>
  );
};

// Advanced grid gesture manager for coordinating between multiple cells
export class GridGestureManager {
  private cells: Map<string, any> = new Map();
  private dragOrder: string[] = [];
  private isReordering = false;

  registerCell(streamId: string, cellRef: any) {
    this.cells.set(streamId, cellRef);
  }

  unregisterCell(streamId: string) {
    this.cells.delete(streamId);
  }

  startReorder(streamId: string) {
    this.isReordering = true;
    this.dragOrder = Array.from(this.cells.keys());

    // Animate other cells to create space
    this.cells.forEach((cell, id) => {
      if (id !== streamId) {
        cell.animateToReorderState?.();
      }
    });
  }

  updateReorder(draggedId: string, position: { x: number; y: number }) {
    if (!this.isReordering) {
      return;
    }

    // Calculate which position the dragged item should take
    // This would involve collision detection with other cells
    // and updating the order accordingly
  }

  endReorder(draggedId: string): { fromIndex: number; toIndex: number } | null {
    this.isReordering = false;

    // Reset all cell animations
    this.cells.forEach(cell => {
      cell.animateToNormalState?.();
    });

    // Calculate final reorder if position changed
    const oldIndex = this.dragOrder.indexOf(draggedId);
    // Calculate new index based on final position
    const newIndex = oldIndex; // This would be calculated from collision detection

    if (oldIndex !== newIndex) {
      return { fromIndex: oldIndex, toIndex: newIndex };
    }

    return null;
  }

  isCurrentlyReordering(): boolean {
    return this.isReordering;
  }
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});

export default GridGestureHandler;
