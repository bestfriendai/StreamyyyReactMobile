import {
  X,
  Maximize2,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Minimize2,
  Move3D,
} from 'lucide-react-native';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  PanGestureHandler,
  TapGestureHandler,
  State,
  ViewStyle,
  Dimensions,
  TouchableOpacity,
  Text,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { UniversalStream } from '@/services/multiPlatformStreamingApi';
import { TwitchStream } from '@/services/twitchApi';
import { ModernTheme } from '@/theme/modernTheme';
import EnhancedKickPlayer from './EnhancedKickPlayer';
import EnhancedTwitchPlayer from './EnhancedTwitchPlayer';
import EnhancedYouTubePlayer from './EnhancedYouTubePlayer';

interface PictureInPicturePlayerProps {
  stream: TwitchStream | UniversalStream;
  platform: 'twitch' | 'youtube' | 'kick' | 'facebook';
  isVisible: boolean;
  initialPosition?: { x: number; y: number };
  initialSize?: { width: number; height: number };
  onClose?: () => void;
  onExpand?: () => void;
  onPositionChange?: (position: { x: number; y: number }) => void;
  onSizeChange?: (size: { width: number; height: number }) => void;
  enableResizing?: boolean;
  enableDocking?: boolean;
  minSize?: { width: number; height: number };
  maxSize?: { width: number; height: number };
  autoHideControls?: boolean;
  allowOutsideBounds?: boolean;
}

interface PiPState {
  position: { x: number; y: number };
  size: { width: number; height: number };
  isDragging: boolean;
  isResizing: boolean;
  isDocked: boolean;
  dockSide: 'left' | 'right' | 'top' | 'bottom' | null;
  opacity: number;
  isMinimized: boolean;
}

const SCREEN_DIMENSIONS = Dimensions.get('window');
const DOCK_THRESHOLD = 50;
const RESIZE_HANDLE_SIZE = 20;
const MIN_PIP_SIZE = { width: 120, height: 68 }; // 16:9 aspect ratio
const MAX_PIP_SIZE = { width: 400, height: 225 };
const DEFAULT_PIP_SIZE = { width: 200, height: 112 };

export const PictureInPicturePlayer: React.FC<PictureInPicturePlayerProps> = ({
  stream,
  platform,
  isVisible,
  initialPosition = { x: SCREEN_DIMENSIONS.width - 220, y: 100 },
  initialSize = DEFAULT_PIP_SIZE,
  onClose,
  onExpand,
  onPositionChange,
  onSizeChange,
  enableResizing = true,
  enableDocking = true,
  minSize = MIN_PIP_SIZE,
  maxSize = MAX_PIP_SIZE,
  autoHideControls = true,
  allowOutsideBounds = false,
}) => {
  const [pipState, setPipState] = useState<PiPState>({
    position: initialPosition,
    size: initialSize,
    isDragging: false,
    isResizing: false,
    isDocked: false,
    dockSide: null,
    opacity: 1,
    isMinimized: false,
  });

  const [showControls, setShowControls] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);

  // Animation values
  const translateX = useRef(new Animated.Value(initialPosition.x)).current;
  const translateY = useRef(new Animated.Value(initialPosition.y)).current;
  const scaleX = useRef(new Animated.Value(1)).current;
  const scaleY = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const controlsOpacity = useRef(new Animated.Value(0)).current;

  // Gesture refs
  const panRef = useRef<PanGestureHandler>(null);
  const tapRef = useRef<TapGestureHandler>(null);
  const resizeRef = useRef<PanGestureHandler>(null);

  // Timers
  const controlsTimer = useRef<NodeJS.Timeout | null>(null);
  const dockTimer = useRef<NodeJS.Timeout | null>(null);

  // Initialize animations
  useEffect(() => {
    translateX.setValue(pipState.position.x);
    translateY.setValue(pipState.position.y);
  }, []);

  // Auto-hide controls
  useEffect(() => {
    if (autoHideControls && showControls) {
      if (controlsTimer.current) {clearTimeout(controlsTimer.current);}
      controlsTimer.current = setTimeout(() => {
        hideControls();
      }, 3000);
    }
    return () => {
      if (controlsTimer.current) {clearTimeout(controlsTimer.current);}
    };
  }, [showControls, autoHideControls]);

  // Show/hide controls animations
  const showControlsAnimated = useCallback(() => {
    setShowControls(true);
    Animated.timing(controlsOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [controlsOpacity]);

  const hideControls = useCallback(() => {
    Animated.timing(controlsOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowControls(false);
    });
  }, [controlsOpacity]);

  // Handle pan gesture (dragging)
  const onPanGestureEvent = useCallback(
    (event: any) => {
      const { translationX: tx, translationY: ty } = event.nativeEvent;

    if (!pipState.isDragging) {return;}

      let newX = pipState.position.x + tx;
      let newY = pipState.position.y + ty;

      // Boundary checking
      if (!allowOutsideBounds) {
        newX = Math.max(0, Math.min(SCREEN_DIMENSIONS.width - pipState.size.width, newX));
        newY = Math.max(0, Math.min(SCREEN_DIMENSIONS.height - pipState.size.height, newY));
      }

      // Check for docking
      let dockSide: PiPState['dockSide'] = null;
      let shouldDock = false;

      if (enableDocking) {
        if (newX < DOCK_THRESHOLD) {
          dockSide = 'left';
          shouldDock = true;
          newX = 0;
        } else if (newX > SCREEN_DIMENSIONS.width - pipState.size.width - DOCK_THRESHOLD) {
          dockSide = 'right';
          shouldDock = true;
          newX = SCREEN_DIMENSIONS.width - pipState.size.width;
        }

        if (newY < DOCK_THRESHOLD) {
          dockSide = 'top';
          shouldDock = true;
          newY = 0;
        } else if (newY > SCREEN_DIMENSIONS.height - pipState.size.height - DOCK_THRESHOLD) {
          dockSide = 'bottom';
          shouldDock = true;
          newY = SCREEN_DIMENSIONS.height - pipState.size.height;
        }
      }

      // Update position
      translateX.setValue(newX);
      translateY.setValue(newY);

      // Update state
      setPipState(prev => ({
        ...prev,
        position: { x: newX, y: newY },
        isDocked: shouldDock,
        dockSide,
      }));

      onPositionChange?.({ x: newX, y: newY });
    },
    [pipState, enableDocking, allowOutsideBounds, onPositionChange]
  );

  const onPanHandlerStateChange = useCallback(
    (event: any) => {
      const { state } = event.nativeEvent;

      if (state === State.BEGAN) {
        setPipState(prev => ({ ...prev, isDragging: true }));
        showControlsAnimated();
      } else if (state === State.END || state === State.CANCELLED) {
        setPipState(prev => ({ ...prev, isDragging: false }));

      // Snap to dock if close enough
        if (enableDocking && pipState.isDocked) {
          animateToPosition(pipState.position);
        }
      }
    },
    [pipState, enableDocking, showControlsAnimated]
  );

  // Handle resize gesture
  const onResizeGestureEvent = useCallback(
    (event: any) => {
      if (!enableResizing || !pipState.isResizing) {return;}

      const { translationX: tx, translationY: ty } = event.nativeEvent;

    let newWidth = Math.max(minSize.width, Math.min(maxSize.width, pipState.size.width + tx));
      let newHeight = Math.max(minSize.height, Math.min(maxSize.height, pipState.size.height + ty));

      // Maintain aspect ratio (16:9)
      const aspectRatio = 16 / 9;
      if (newWidth / newHeight > aspectRatio) {
        newWidth = newHeight * aspectRatio;
      } else {
        newHeight = newWidth / aspectRatio;
      }

      setPipState(prev => ({
        ...prev,
        size: { width: newWidth, height: newHeight },
      }));

      onSizeChange?.({ width: newWidth, height: newHeight });
    },
    [pipState, enableResizing, minSize, maxSize, onSizeChange]
  );

  const onResizeHandlerStateChange = useCallback(
    (event: any) => {
      const { state } = event.nativeEvent;

      if (state === State.BEGAN) {
        setPipState(prev => ({ ...prev, isResizing: true }));
        showControlsAnimated();
      } else if (state === State.END || state === State.CANCELLED) {
        setPipState(prev => ({ ...prev, isResizing: false }));
      }
    },
    [showControlsAnimated]
  );

  // Handle tap gesture
  const onTapHandlerStateChange = useCallback(
    (event: any) => {
      const { state } = event.nativeEvent;

      if (state === State.END) {
        if (showControls) {
          hideControls();
        } else {
          showControlsAnimated();
        }
      }
    },
    [showControls, showControlsAnimated, hideControls]
  );

  // Animate to position
  const animateToPosition = useCallback(
    (position: { x: number; y: number }) => {
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: position.x,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.spring(translateY, {
          toValue: position.y,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
      ]).start();
    },
    [translateX, translateY]
  );

  // Minimize/restore animations
  const minimizePlayer = useCallback(() => {
    const miniSize = { width: 80, height: 45 };

    Animated.parallel([
      Animated.timing(scaleX, {
        toValue: miniSize.width / pipState.size.width,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleY, {
        toValue: miniSize.height / pipState.size.height,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0.7,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    setPipState(prev => ({ ...prev, isMinimized: true }));
  }, [pipState.size, scaleX, scaleY, opacity]);

  const restorePlayer = useCallback(() => {
    Animated.parallel([
      Animated.timing(scaleX, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleY, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    setPipState(prev => ({ ...prev, isMinimized: false }));
  }, [scaleX, scaleY, opacity]);

  // Render player based on platform
  const renderPlayer = useCallback(() => {
    const playerProps = {
      stream,
      width: pipState.size.width,
      height: pipState.size.height,
      isMuted,
      isPlaying,
      showControls: false, // PiP has its own controls
      autoplay: true,
      onMuteToggle: () => setIsMuted(!isMuted),
      onPlayToggle: () => setIsPlaying(!isPlaying),
    };

    switch (platform) {
      case 'twitch':
        return <EnhancedTwitchPlayer {...playerProps} stream={stream as TwitchStream} />;
      case 'youtube':
        return <EnhancedYouTubePlayer {...playerProps} stream={stream as UniversalStream} />;
      case 'kick':
        return <EnhancedKickPlayer {...playerProps} stream={stream as UniversalStream} />;
      default:
        return (
          <View
            style={[
              styles.placeholder,
              { width: pipState.size.width, height: pipState.size.height },
            ]}
          />
        );
    }
  }, [stream, platform, pipState.size, isMuted, isPlaying]);

  if (!isVisible) {return null;}

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateX }, { translateY }, { scaleX }, { scaleY }],
          opacity,
          width: pipState.size.width,
          height: pipState.size.height,
          borderColor: pipState.isDocked ? '#9146FF' : 'transparent',
        },
      ]}
    >
      {/* Pan gesture handler for dragging */}
      <PanGestureHandler
        ref={panRef}
        onGestureEvent={onPanGestureEvent}
        onHandlerStateChange={onPanHandlerStateChange}
        simultaneousHandlers={[tapRef]}
      >
        <Animated.View style={styles.dragArea}>
          {/* Tap gesture handler for showing/hiding controls */}
          <TapGestureHandler
            ref={tapRef}
            onHandlerStateChange={onTapHandlerStateChange}
            simultaneousHandlers={[panRef]}
          >
            <Animated.View style={styles.playerArea}>
              {/* Video Player */}
              {renderPlayer()}

              {/* Docking indicator */}
              {pipState.isDocked && (
                <View style={[styles.dockIndicator, styles[`dock${pipState.dockSide}`]]}>
                  <Text style={styles.dockText}>DOCKED</Text>
                </View>
              )}

              {/* Controls overlay */}
              {showControls && (
                <Animated.View style={[styles.controlsOverlay, { opacity: controlsOpacity }]}>
                  <LinearGradient
                    colors={['rgba(0,0,0,0.8)', 'transparent', 'rgba(0,0,0,0.8)']}
                    style={styles.controlsGradient}
                  >
                    {/* Top controls */}
                    <View style={styles.topControls}>
                      <TouchableOpacity style={styles.controlButton} onPress={onClose}>
                        <X size={16} color="#fff" />
                      </TouchableOpacity>

                      <Text style={styles.streamTitle} numberOfLines={1}>
                        {'user_name' in stream ? stream.user_name : stream.streamerDisplayName}
                      </Text>

                      <TouchableOpacity style={styles.controlButton} onPress={onExpand}>
                        <Maximize2 size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>

                    {/* Center controls */}
                    <View style={styles.centerControls}>
                      <TouchableOpacity
                        style={styles.controlButton}
                        onPress={() => setIsMuted(!isMuted)}
                      >
                        {isMuted ? (
                          <VolumeX size={20} color="#fff" />
                        ) : (
                          <Volume2 size={20} color="#fff" />
                        )}

                      <TouchableOpacity
                        style={styles.controlButton}
                        onPress={() => setIsPlaying(!isPlaying)}
                      >
                        {isPlaying ? (
                          <Pause size={20} color="#fff" />
                        ) : (
                          <Play size={20} color="#fff" />
                        )}
                      </TouchableOpacity>
                    </View>

                    {/* Bottom controls */}
                    <View style={styles.bottomControls}>
                      <TouchableOpacity
                        style={styles.controlButton}
                        onPress={pipState.isMinimized ? restorePlayer : minimizePlayer}
                      >
                        <Minimize2 size={16} color="#fff" />
                      </TouchableOpacity>

                      <View style={styles.dragHandle}>
                        <Move3D size={16} color="#fff" />
                      </View>
                    </View>
                  </LinearGradient>
                </Animated.View>
              )}

              {/* Resize handle */}
              {enableResizing && showControls && (
                <PanGestureHandler
                  ref={resizeRef}
                  onGestureEvent={onResizeGestureEvent}
                  onHandlerStateChange={onResizeHandlerStateChange}
                >
                  <Animated.View style={styles.resizeHandle} />
                </PanGestureHandler>
              )}
            </Animated.View>
          </TapGestureHandler>
        </Animated.View>
      </PanGestureHandler>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    borderRadius: ModernTheme.borderRadius.md,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderWidth: 2,
    zIndex: 1000,
  } as ViewStyle,

  dragArea: {
    flex: 1,
  } as ViewStyle,

  playerArea: {
    flex: 1,
    position: 'relative',
  } as ViewStyle,

  placeholder: {
    backgroundColor: ModernTheme.colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,

  controlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  } as ViewStyle,

  controlsGradient: {
    flex: 1,
    justifyContent: 'space-between',
    padding: ModernTheme.spacing.sm,
  } as ViewStyle,

  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,

  centerControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: ModernTheme.spacing.md,
  } as ViewStyle,

  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,

  controlButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  } as ViewStyle,

  streamTitle: {
    color: ModernTheme.colors.text.primary,
    fontSize: ModernTheme.typography.sizes.xs,
    fontWeight: ModernTheme.typography.weights.semibold,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: ModernTheme.spacing.xs,
  },

  dragHandle: {
    padding: ModernTheme.spacing.xs,
  } as ViewStyle,

  resizeHandle: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: RESIZE_HANDLE_SIZE,
    height: RESIZE_HANDLE_SIZE,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderTopLeftRadius: ModernTheme.borderRadius.sm,
  } as ViewStyle,

  dockIndicator: {
    position: 'absolute',
    backgroundColor: '#9146FF',
    paddingHorizontal: ModernTheme.spacing.xs,
    paddingVertical: 2,
    borderRadius: ModernTheme.borderRadius.xs,
  } as ViewStyle,

  dockleft: {
    left: 0,
    top: '50%',
    transform: [{ translateY: -10 }],
  } as ViewStyle,

  dockright: {
    right: 0,
    top: '50%',
    transform: [{ translateY: -10 }],
  } as ViewStyle,

  docktop: {
    top: 0,
    left: '50%',
    transform: [{ translateX: -25 }],
  } as ViewStyle,

  dockbottom: {
    bottom: 0,
    left: '50%',
    transform: [{ translateX: -25 }],
  } as ViewStyle,

  dockText: {
    color: ModernTheme.colors.text.primary,
    fontSize: 8,
    fontWeight: ModernTheme.typography.weights.bold,
  },
});

export default PictureInPicturePlayer;
