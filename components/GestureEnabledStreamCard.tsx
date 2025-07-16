import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Haptics,
  Platform,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  PanGestureHandler,
  PinchGestureHandler,
  TapGestureHandler,
  LongPressGestureHandler,
  State,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import {
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCw,
  Share,
  Star,
  MoreVertical,
  Move,
  ZoomIn,
  ZoomOut,
} from 'lucide-react-native';
import { StreamViewer } from './StreamViewer';
import { TwitchStream } from '@/services/twitchApi';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface GestureEnabledStreamCardProps {
  stream: TwitchStream;
  onRemove: (streamId: string) => void;
  onReorder: (streamId: string, newPosition: { x: number; y: number }) => void;
  onFocus: (streamId: string) => void;
  onVolumeToggle: (streamId: string, muted: boolean) => void;
  onQualityChange: (streamId: string, quality: string) => void;
  initialPosition: { x: number; y: number };
  initialSize: { width: number; height: number };
  isFloating?: boolean;
  isFocused?: boolean;
  muted?: boolean;
  zIndex?: number;
  onGestureStart?: () => void;
  onGestureEnd?: () => void;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export function GestureEnabledStreamCard({
  stream,
  onRemove,
  onReorder,
  onFocus,
  onVolumeToggle,
  onQualityChange,
  initialPosition,
  initialSize,
  isFloating = false,
  isFocused = false,
  muted = false,
  zIndex = 1,
  onGestureStart,
  onGestureEnd,
}: GestureEnabledStreamCardProps) {
  const [showControls, setShowControls] = useState(false);
  const [isGestureActive, setIsGestureActive] = useState(false);
  const [gestureType, setGestureType] = useState<'none' | 'pan' | 'pinch' | 'longPress'>('none');

  // Animated values
  const translateX = useSharedValue(initialPosition.x);
  const translateY = useSharedValue(initialPosition.y);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(1);
  const borderOpacity = useSharedValue(0);
  const controlsOpacity = useSharedValue(0);
  const cardElevation = useSharedValue(1);

  // Gesture state
  const gestureScale = useSharedValue(1);
  const gestureRotation = useSharedValue(0);
  const gestureTranslateX = useSharedValue(0);
  const gestureTranslateY = useSharedValue(0);

  // Refs for gesture handlers
  const panRef = useRef(null);
  const pinchRef = useRef(null);
  const tapRef = useRef(null);
  const longPressRef = useRef(null);

  // Haptic feedback
  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (Platform.OS === 'ios') {
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
      }
    }
  }, []);

  // Pan gesture handler (drag to move)
  const panGestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      runOnJS(setIsGestureActive)(true);
      runOnJS(setGestureType)('pan');
      runOnJS(triggerHaptic)('light');
      runOnJS(onGestureStart?.())();
      
      cardElevation.value = withSpring(4);
      borderOpacity.value = withTiming(1, { duration: 200 });
    },
    onActive: (event) => {
      gestureTranslateX.value = event.translationX;
      gestureTranslateY.value = event.translationY;
    },
    onEnd: (event) => {
      // Snap to grid or boundaries if needed
      const finalX = translateX.value + event.translationX;
      const finalY = translateY.value + event.translationY;
      
      // Boundary constraints
      const maxX = screenWidth - initialSize.width;
      const maxY = screenHeight - initialSize.height;
      
      const constrainedX = Math.max(0, Math.min(maxX, finalX));
      const constrainedY = Math.max(0, Math.min(maxY, finalY));
      
      translateX.value = withSpring(constrainedX);
      translateY.value = withSpring(constrainedY);
      gestureTranslateX.value = withSpring(0);
      gestureTranslateY.value = withSpring(0);
      
      cardElevation.value = withSpring(1);
      borderOpacity.value = withTiming(0, { duration: 200 });
      
      runOnJS(setIsGestureActive)(false);
      runOnJS(setGestureType)('none');
      runOnJS(onGestureEnd?.())();
      runOnJS(onReorder)(stream.id, { x: constrainedX, y: constrainedY });
    },
  });

  // Pinch gesture handler (scale/zoom)
  const pinchGestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      runOnJS(setIsGestureActive)(true);
      runOnJS(setGestureType)('pinch');
      runOnJS(triggerHaptic)('medium');
      runOnJS(onGestureStart?.())();
      
      borderOpacity.value = withTiming(1, { duration: 200 });
    },
    onActive: (event) => {
      gestureScale.value = Math.max(0.5, Math.min(2.0, event.scale));
      
      // Optional rotation during pinch
      if (Math.abs(event.rotation) > 0.1) {
        gestureRotation.value = event.rotation * 0.5; // Damped rotation
      }
    },
    onEnd: () => {
      // Apply final scale with constraints
      const finalScale = Math.max(0.7, Math.min(1.5, gestureScale.value));
      scale.value = withSpring(finalScale);
      rotation.value = withSpring(rotation.value + gestureRotation.value);
      
      gestureScale.value = withSpring(1);
      gestureRotation.value = withSpring(0);
      borderOpacity.value = withTiming(0, { duration: 200 });
      
      runOnJS(setIsGestureActive)(false);
      runOnJS(setGestureType)('none');
      runOnJS(onGestureEnd?.())();
    },
  });

  // Long press gesture handler (show context menu)
  const longPressGestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      runOnJS(setGestureType)('longPress');
      runOnJS(triggerHaptic)('heavy');
      
      cardElevation.value = withSpring(6);
      controlsOpacity.value = withTiming(1, { duration: 300 });
      runOnJS(setShowControls)(true);
    },
    onEnd: () => {
      cardElevation.value = withSpring(1);
      runOnJS(setGestureType)('none');
    },
  });

  // Tap gesture handler (focus/unfocus)
  const tapGestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      runOnJS(triggerHaptic)('light');
    },
    onEnd: () => {
      if (!isGestureActive) {
        runOnJS(onFocus)(stream.id);
        
        // Visual feedback for focus
        scale.value = withSpring(isFocused ? 1 : 1.05, {}, () => {
          scale.value = withSpring(1);
        });
      }
    },
  });

  // Hide controls after timeout
  React.useEffect(() => {
    if (showControls) {
      const timeout = setTimeout(() => {
        controlsOpacity.value = withTiming(0, { duration: 300 });
        setShowControls(false);
      }, 3000);
      
      return () => clearTimeout(timeout);
    }
  }, [showControls]);

  // Animated styles
  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value + gestureTranslateX.value },
      { translateY: translateY.value + gestureTranslateY.value },
      { scale: scale.value * gestureScale.value },
      { rotate: `${rotation.value + gestureRotation.value}rad` },
    ],
    opacity: opacity.value,
    zIndex: isGestureActive ? 100 : zIndex,
    elevation: cardElevation.value,
    shadowOpacity: interpolate(cardElevation.value, [1, 6], [0.1, 0.3]),
    shadowRadius: interpolate(cardElevation.value, [1, 6], [4, 12]),
  }));

  const borderAnimatedStyle = useAnimatedStyle(() => ({
    opacity: borderOpacity.value,
  }));

  const controlsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: controlsOpacity.value,
    pointerEvents: controlsOpacity.value > 0.5 ? 'auto' : 'none',
  }));

  const gestureIndicatorStyle = useAnimatedStyle(() => ({
    opacity: isGestureActive ? withTiming(1) : withTiming(0),
  }));

  const handleVolumeToggle = () => {
    onVolumeToggle(stream.id, !muted);
    triggerHaptic('light');
  };

  const handleRemove = () => {
    opacity.value = withTiming(0, { duration: 300 }, () => {
      runOnJS(onRemove)(stream.id);
    });
    triggerHaptic('medium');
  };

  const handleQualityToggle = () => {
    // Cycle through quality options
    const qualities = ['auto', 'source', '720p', '480p', '360p'];
    const currentIndex = qualities.indexOf('auto'); // Default to auto for now
    const nextQuality = qualities[(currentIndex + 1) % qualities.length];
    onQualityChange(stream.id, nextQuality);
    triggerHaptic('light');
  };

  const resetPosition = () => {
    translateX.value = withSpring(initialPosition.x);
    translateY.value = withSpring(initialPosition.y);
    scale.value = withSpring(1);
    rotation.value = withSpring(0);
    triggerHaptic('medium');
  };

  return (
    <GestureHandlerRootView style={[styles.container, { width: initialSize.width, height: initialSize.height }]}>
      <PanGestureHandler
        ref={panRef}
        onGestureEvent={panGestureHandler}
        simultaneousHandlers={[pinchRef]}
        enabled={isFloating}
      >
        <Animated.View>
          <PinchGestureHandler
            ref={pinchRef}
            onGestureEvent={pinchGestureHandler}
            simultaneousHandlers={[panRef]}
          >
            <Animated.View>
              <LongPressGestureHandler
                ref={longPressRef}
                onGestureEvent={longPressGestureHandler}
                minDurationMs={500}
              >
                <Animated.View>
                  <TapGestureHandler
                    ref={tapRef}
                    onGestureEvent={tapGestureHandler}
                    numberOfTaps={1}
                  >
                    <Animated.View style={[styles.card, cardAnimatedStyle]}>
                      {/* Gesture border indicator */}
                      <Animated.View style={[styles.gestureBorder, borderAnimatedStyle]}>
                        <LinearGradient
                          colors={['#8B5CF6', '#7C3AED', '#6D28D9']}
                          style={styles.borderGradient}
                        />
                      </Animated.View>

                      {/* Stream content */}
                      <View style={styles.streamContent}>
                        <StreamViewer
                          stream={stream}
                          onRemove={onRemove}
                          width={initialSize.width}
                          height={initialSize.height}
                          muted={muted}
                          showControls={false}
                        />
                      </View>

                      {/* Gesture type indicator */}
                      <Animated.View style={[styles.gestureIndicator, gestureIndicatorStyle]}>
                        <LinearGradient
                          colors={['rgba(139, 92, 246, 0.9)', 'rgba(124, 58, 237, 0.9)']}
                          style={styles.gestureIndicatorGradient}
                        >
                          <Text style={styles.gestureText}>
                            {gestureType === 'pan' && '↕️ Moving'}
                            {gestureType === 'pinch' && '🔍 Scaling'}
                            {gestureType === 'longPress' && '⚙️ Options'}
                          </Text>
                        </LinearGradient>
                      </Animated.View>

                      {/* Enhanced controls overlay */}
                      <Animated.View style={[styles.controlsOverlay, controlsAnimatedStyle]}>
                        <LinearGradient
                          colors={['rgba(0,0,0,0.8)', 'transparent', 'rgba(0,0,0,0.8)']}
                          style={styles.controlsGradient}
                        >
                          {/* Top controls */}
                          <View style={styles.topControls}>
                            <View style={styles.streamInfo}>
                              <Text style={styles.streamTitle} numberOfLines={1}>
                                {stream.user_name}
                              </Text>
                              <Text style={styles.streamGame} numberOfLines={1}>
                                {stream.game_name}
                              </Text>
                            </View>
                            <TouchableOpacity
                              style={styles.closeButton}
                              onPress={handleRemove}
                            >
                              <LinearGradient
                                colors={['#EF4444', '#DC2626']}
                                style={styles.controlButton}
                              >
                                <Text style={styles.closeText}>✕</Text>
                              </LinearGradient>
                            </TouchableOpacity>
                          </View>

                          {/* Center controls */}
                          <View style={styles.centerControls}>
                            <TouchableOpacity
                              style={styles.actionButton}
                              onPress={() => onFocus(stream.id)}
                            >
                              <LinearGradient
                                colors={['rgba(139, 92, 246, 0.9)', 'rgba(124, 58, 237, 0.9)']}
                                style={styles.controlButton}
                              >
                                <Maximize size={20} color="#fff" />
                              </LinearGradient>
                            </TouchableOpacity>
                          </View>

                          {/* Bottom controls */}
                          <View style={styles.bottomControls}>
                            <View style={styles.leftActions}>
                              <TouchableOpacity
                                style={styles.actionButton}
                                onPress={handleVolumeToggle}
                              >
                                <LinearGradient
                                  colors={muted ? ['#6B7280', '#4B5563'] : ['#22C55E', '#16A34A']}
                                  style={styles.controlButton}
                                >
                                  {muted ? (
                                    <VolumeX size={16} color="#fff" />
                                  ) : (
                                    <Volume2 size={16} color="#fff" />
                                  )}
                                </LinearGradient>
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={styles.actionButton}
                                onPress={handleQualityToggle}
                              >
                                <LinearGradient
                                  colors={['#F59E0B', '#D97706']}
                                  style={styles.controlButton}
                                >
                                  <Text style={styles.qualityText}>HD</Text>
                                </LinearGradient>
                              </TouchableOpacity>
                            </View>

                            <View style={styles.rightActions}>
                              {isFloating && (
                                <TouchableOpacity
                                  style={styles.actionButton}
                                  onPress={resetPosition}
                                >
                                  <LinearGradient
                                    colors={['#8B5CF6', '#7C3AED']}
                                    style={styles.controlButton}
                                  >
                                    <RotateCw size={16} color="#fff" />
                                  </LinearGradient>
                                </TouchableOpacity>
                              )}

                              <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => {/* Handle share */}}
                              >
                                <LinearGradient
                                  colors={['#06B6D4', '#0891B2']}
                                  style={styles.controlButton}
                                >
                                  <Share size={16} color="#fff" />
                                </LinearGradient>
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => {/* Handle favorite */}}
                              >
                                <LinearGradient
                                  colors={['#F59E0B', '#D97706']}
                                  style={styles.controlButton}
                                >
                                  <Star size={16} color="#fff" />
                                </LinearGradient>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </LinearGradient>
                      </Animated.View>

                      {/* Focus indicator */}
                      {isFocused && (
                        <View style={styles.focusIndicator}>
                          <LinearGradient
                            colors={['#8B5CF6', '#7C3AED']}
                            style={styles.focusGradient}
                          >
                            <Text style={styles.focusText}>FOCUSED</Text>
                          </LinearGradient>
                        </View>
                      )}
                    </Animated.View>
                  </TapGestureHandler>
                </Animated.View>
              </LongPressGestureHandler>
            </Animated.View>
          </PinchGestureHandler>
        </Animated.View>
      </PanGestureHandler>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
  },
  card: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  gestureBorder: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 14,
    zIndex: 1,
  },
  borderGradient: {
    flex: 1,
    borderRadius: 14,
  },
  streamContent: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  gestureIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
    borderRadius: 8,
    overflow: 'hidden',
    zIndex: 10,
  },
  gestureIndicatorGradient: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  gestureText: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
  },
  controlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
  },
  controlsGradient: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  streamInfo: {
    flex: 1,
    marginRight: 8,
  },
  streamTitle: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
    marginBottom: 2,
  },
  streamGame: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: '#8B5CF6',
  },
  closeButton: {
    borderRadius: 6,
    overflow: 'hidden',
  },
  closeText: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  centerControls: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftActions: {
    flexDirection: 'row',
    gap: 6,
  },
  rightActions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionButton: {
    borderRadius: 6,
    overflow: 'hidden',
  },
  controlButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  qualityText: {
    fontSize: 8,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  focusIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 6,
    overflow: 'hidden',
    zIndex: 10,
  },
  focusGradient: {
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  focusText: {
    fontSize: 8,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
});