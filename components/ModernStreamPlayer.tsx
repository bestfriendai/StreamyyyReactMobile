import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
  Platform,
  PanGestureHandler,
  TapGestureHandler,
  State,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { 
  Volume2, 
  VolumeX, 
  Maximize, 
  X, 
  Settings,
  Monitor,
  Heart,
  Play,
  Pause,
  MoreVertical,
  Eye,
  Users,
  Wifi,
  WifiOff,
  RotateCcw,
  Share,
  Bookmark,
  PictureInPicture2,
  Maximize2,
  MinusCircle,
  PlusCircle,
  SkipForward,
  SkipBack,
  FastForward,
  Rewind,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView, MotiText, AnimatePresence } from 'moti';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
  withSequence,
  withDelay,
} from 'react-native-reanimated';
import { TwitchStream, twitchApi } from '@/services/twitchApi';
import { ModernTheme } from '@/theme/modernTheme';
import { BlurViewFallback as BlurView } from './BlurViewFallback';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ModernStreamPlayerProps {
  stream: TwitchStream;
  onRemove: (streamId: string) => void;
  width?: number;
  height?: number;
  isActive?: boolean;
  onToggleActive?: () => void;
  onTogglePiP?: () => void;
  onOpenQuality?: () => void;
  onShare?: () => void;
  showAdvancedControls?: boolean;
  allowFullscreen?: boolean;
  enableGestures?: boolean;
  autoHideControls?: boolean;
  customControlsTimeout?: number;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedPanGestureHandler = Animated.createAnimatedComponent(PanGestureHandler);

export function ModernStreamPlayer({
  stream,
  onRemove,
  width,
  height,
  isActive = false,
  onToggleActive,
  onTogglePiP,
  onOpenQuality,
  onShare,
  showAdvancedControls = true,
  allowFullscreen = true,
  enableGestures = true,
  autoHideControls = true,
  customControlsTimeout = 4000,
}: ModernStreamPlayerProps) {
  // State management
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [volume, setVolume] = useState(1.0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [viewerCount, setViewerCount] = useState(stream.viewer_count || 0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showPlaybackRateOptions, setShowPlaybackRateOptions] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<
    'excellent' | 'good' | 'poor' | 'disconnected'
  >('good');
  const [isBuffering, setIsBuffering] = useState(false);
  const [lastTapTime, setLastTapTime] = useState(0);
  const [tapCount, setTapCount] = useState(0);

  // Refs
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(false);
  const webViewRef = useRef<WebView>(null);
  const panRef = useRef<PanGestureHandler>(null);
  const tapRef = useRef<TapGestureHandler>(null);
  const doubleTapRef = useRef<TapGestureHandler>(null);

  // Animation values
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const controlsOpacity = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const borderGlow = useSharedValue(0);
  const volumeSliderOpacity = useSharedValue(0);
  const playbackRateOpacity = useSharedValue(0);
  const loadingRotation = useSharedValue(0);
  const bufferingScale = useSharedValue(1);
  const gestureScale = useSharedValue(1);
  const gestureX = useSharedValue(0);
  const gestureY = useSharedValue(0);

  const screenWidth = Dimensions.get('window').width;
  const viewerWidth = width || screenWidth - 32;
  const viewerHeight = height || (viewerWidth * 9) / 16;

  const embedUrl =
    twitchApi.generateEmbedUrl(stream.user_login) + (isMuted ? '&muted=true' : '&muted=false');

  // Lifecycle effects
  useEffect(() => {
    isMountedRef.current = true;

    // Start loading animation
    loadingRotation.value = withTiming(360, { duration: 2000 }, () => {
      loadingRotation.value = 0;
    });

    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  // Active state animation
  useEffect(() => {
    if (isActive) {
      pulseScale.value = withSequence(
        withTiming(1.02, { duration: 200 }),
        withTiming(1, { duration: 200 })
      );
      borderGlow.value = withTiming(1, { duration: 300 });
    } else {
      pulseScale.value = withTiming(1, { duration: 300 });
      borderGlow.value = withTiming(0, { duration: 300 });
    }
  }, [isActive]);

  // Buffering animation
  useEffect(() => {
    if (isBuffering) {
      bufferingScale.value = withSequence(
        withTiming(1.1, { duration: 500 }),
        withTiming(1, { duration: 500 })
      );
    }
  }, [isBuffering]);

  // Loading animation loop
  useEffect(() => {
    if (isLoading) {
      const startRotation = () => {
        loadingRotation.value = withTiming(360, { duration: 2000 }, () => {
          loadingRotation.value = 0;
          if (isLoading) {
            startRotation();
          }
        });
      };
      startRotation();
    }
  }, [isLoading]);

  // Viewer count animation
  useEffect(() => {
    const interval = setInterval(() => {
      const variation = Math.floor(Math.random() * 100) - 50;
      setViewerCount(Math.max(0, (stream.viewer_count || 0) + variation));
    }, 30000);
    return () => clearInterval(interval);
  }, [stream.viewer_count]);

  // Controls auto-hide logic
  useEffect(() => {
    if (showControls && autoHideControls) {
      controlsOpacity.value = withTiming(1, { duration: 200 });

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      timeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          setShowControls(false);
        }
      }, customControlsTimeout);
    } else {
      controlsOpacity.value = withTiming(0, { duration: 200 });
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [showControls, autoHideControls, customControlsTimeout]);

  // Volume slider visibility
  useEffect(() => {
    volumeSliderOpacity.value = withTiming(showVolumeSlider ? 1 : 0, { duration: 200 });
  }, [showVolumeSlider]);

  // Playback rate options visibility
  useEffect(() => {
    playbackRateOpacity.value = withTiming(showPlaybackRateOptions ? 1 : 0, { duration: 200 });
  }, [showPlaybackRateOptions]);

  // Gesture handlers
  const panGestureHandler = useAnimatedGestureHandler({
    onStart: (_, context) => {
      context.startX = gestureX.value;
      context.startY = gestureY.value;
    },
    onActive: (event, context) => {
      if (!enableGestures) {return;}

      gestureX.value = context.startX + event.translationX;
      gestureY.value = context.startY + event.translationY;

      // Scale based on gesture magnitude
      const distance = Math.sqrt(
        event.translationX * event.translationX + event.translationY * event.translationY
      );
      gestureScale.value = 1 + distance / 500;
    },
    onEnd: event => {
      if (!enableGestures) {return;}

      gestureX.value = withSpring(0);
      gestureY.value = withSpring(0);
      gestureScale.value = withSpring(1);

      // Handle swipe gestures
      const velocityThreshold = 500;
      const distanceThreshold = 100;

      if (
        Math.abs(event.velocityX) > velocityThreshold ||
        Math.abs(event.translationX) > distanceThreshold
      ) {
        if (event.translationX > 0) {
          // Swipe right - skip forward
          runOnJS(handleSkipForward)();
        } else {
          // Swipe left - skip back
          runOnJS(handleSkipBack)();
        }
      }

        Math.abs(event.velocityY) > velocityThreshold ||
        Math.abs(event.translationY) > distanceThreshold
      ) {
        if (event.translationY < 0) {
          // Swipe up - increase volume
          runOnJS(handleVolumeUp)();
        } else {
          // Swipe down - decrease volume
          runOnJS(handleVolumeDown)();
        }
      }
    },
  });

  const tapGestureHandler = useAnimatedGestureHandler({
    onEnd: () => {
      runOnJS(handleSingleTap)();
    },
  });

  const doubleTapGestureHandler = useAnimatedGestureHandler({
    onEnd: () => {
      runOnJS(handleDoubleTap)();
    },
  });

  // Event handlers
  const handleSingleTap = useCallback(() => {
    if (isMountedRef.current) {
      scale.value = withSequence(
        withTiming(0.95, { duration: 100 }),
        withTiming(1, { duration: 100 })
      );
      setShowControls(!showControls);
      onToggleActive?.();
    }
  }, [showControls, onToggleActive]);

  const handleDoubleTap = useCallback(() => {
    if (isMountedRef.current) {
      scale.value = withSequence(
        withTiming(1.05, { duration: 100 }),
        withTiming(1, { duration: 100 })
      );
      handlePlayPause();
    }
  }, []);

  const handleLongPress = useCallback(() => {
    if (isMountedRef.current) {
      scale.value = withSequence(
        withTiming(1.05, { duration: 200 }),
        withTiming(1, { duration: 200 })
      );

      Alert.alert(
        stream.user_name,
        `${stream.game_name}\n${viewerCount.toLocaleString()} viewers`,
        [
          { text: 'Picture-in-Picture', onPress: () => onTogglePiP?.() },
          { text: 'Quality Settings', onPress: () => onOpenQuality?.() },
          { text: 'Share Stream', onPress: () => onShare?.() },
          { text: 'Toggle Favorite', onPress: () => setIsFavorite(!isFavorite) },
          { text: 'Toggle Bookmark', onPress: () => setIsBookmarked(!isBookmarked) },
          { text: 'Remove Stream', style: 'destructive', onPress: () => onRemove(stream.id) },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    }
  }, [
    stream,
    viewerCount,
    isFavorite,
    isBookmarked,
    onTogglePiP,
    onOpenQuality,
    onShare,
    onRemove,
  ]);

  const handleMuteToggle = useCallback(() => {
    if (isMountedRef.current) {
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  const handlePlayPause = useCallback(() => {
    if (isMountedRef.current) {
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const handleVolumeToggle = useCallback(() => {
    setShowVolumeSlider(!showVolumeSlider);
  }, [showVolumeSlider]);

  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(Math.max(0, Math.min(1, newVolume)));
    setIsMuted(newVolume === 0);
  }, []);

  const handleVolumeUp = useCallback(() => {
    handleVolumeChange(volume + 0.1);
  }, [volume, handleVolumeChange]);

  const handleVolumeDown = useCallback(() => {
    handleVolumeChange(volume - 0.1);
  }, [volume, handleVolumeChange]);

  const handlePlaybackRateToggle = useCallback(() => {
    setShowPlaybackRateOptions(!showPlaybackRateOptions);
  }, [showPlaybackRateOptions]);

  const handlePlaybackRateChange = useCallback((rate: number) => {
    setPlaybackRate(rate);
    setShowPlaybackRateOptions(false);
  }, []);

  const handleSkipForward = useCallback(() => {
    // Skip forward 10 seconds (placeholder)
    console.log('Skip forward 10 seconds');
  }, []);

  const handleSkipBack = useCallback(() => {
    // Skip back 10 seconds (placeholder)
    console.log('Skip back 10 seconds');
  }, []);

  const handleRetry = useCallback(() => {
    setHasError(false);
    setIsLoading(true);
    setRetryCount(prev => prev + 1);
    webViewRef.current?.reload();
  }, []);

  const handleConnectionQualityCheck = useCallback(() => {
    // Simulate connection quality check
    const qualities = ['excellent', 'good', 'poor'] as const;
    const randomQuality = qualities[Math.floor(Math.random() * qualities.length)];
    setConnectionQuality(randomQuality);
  }, []);

  // WebView event handlers
  const handleWebViewLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
    console.log(`✅ Stream loaded: ${stream.user_name}`);
  }, [stream.user_name]);

  const handleWebViewError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    console.error(`❌ Stream error: ${stream.user_name}`);
  }, [stream.user_name]);

  const handleWebViewLoadStart = useCallback(() => {
    setIsLoading(true);
    setHasError(false);
    console.log(`🔄 Stream loading: ${stream.user_name}`);
  }, [stream.user_name]);

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { scaleX: gestureScale.value },
      { scaleY: gestureScale.value },
      { translateX: gestureX.value },
      { translateY: gestureY.value },
    ],
    opacity: opacity.value,
  }));

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    borderColor:
      interpolate(borderGlow.value, [0, 1], [0, 1]) > 0.5
        ? ModernTheme.colors.accent[500]
        : ModernTheme.colors.border.primary,
    borderWidth: interpolate(borderGlow.value, [0, 1], [1, 3]),
  }));

  const animatedControlsStyle = useAnimatedStyle(() => ({
    opacity: controlsOpacity.value,
    transform: [{ scale: interpolate(controlsOpacity.value, [0, 1], [0.9, 1]) }],
  }));

  const animatedLoadingStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${loadingRotation.value}deg` }],
  }));

  const animatedBufferingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bufferingScale.value }],
  }));

  const animatedVolumeSliderStyle = useAnimatedStyle(() => ({
    opacity: volumeSliderOpacity.value,
    transform: [{ scale: interpolate(volumeSliderOpacity.value, [0, 1], [0.8, 1]) }],
  }));

  const animatedPlaybackRateStyle = useAnimatedStyle(() => ({
    opacity: playbackRateOpacity.value,
    transform: [{ scale: interpolate(playbackRateOpacity.value, [0, 1], [0.8, 1]) }],
  }));

  // Connection quality indicator
  const getConnectionColor = () => {
    switch (connectionQuality) {
      case 'excellent':
        return ModernTheme.colors.success[500];
      case 'good':
        return ModernTheme.colors.success[400];
      case 'poor':
        return ModernTheme.colors.error[400];
      case 'disconnected':
        return ModernTheme.colors.gray[500];
      default:
        return ModernTheme.colors.gray[400];
    }
  };

  const getConnectionIcon = () => {
    switch (connectionQuality) {
      case 'excellent':
      case 'good':
        return <Wifi size={12} color={getConnectionColor()} />;
      case 'poor':
      case 'disconnected':
        return <WifiOff size={12} color={getConnectionColor()} />;
      default:
        return <Wifi size={12} color={getConnectionColor()} />;
    }
  };

  // Volume slider component
  const VolumeSlider = () => (
    <Animated.View style={[styles.volumeSlider, animatedVolumeSliderStyle]}>
      <BlurView style={styles.volumeSliderBlur} blurType="dark" blurAmount={20}>
        <View style={styles.volumeSliderContent}>
          <TouchableOpacity onPress={() => handleVolumeChange(0)}>
            <VolumeX size={16} color={ModernTheme.colors.text.secondary} />
          </TouchableOpacity>
          <View style={styles.volumeTrack}>
            <View style={[styles.volumeFill, { width: `${volume * 100}%` }]} />
            <TouchableOpacity
              style={[styles.volumeThumb, { left: `${volume * 100}%` }]}
              onPress={() => {}}
            />
          </View>
          <TouchableOpacity onPress={() => handleVolumeChange(1)}>
            <Volume2 size={16} color={ModernTheme.colors.text.secondary} />
          </TouchableOpacity>
        </View>
      </BlurView>
    </Animated.View>
  );

  // Playback rate options
  const PlaybackRateOptions = () => (
    <Animated.View style={[styles.playbackRateOptions, animatedPlaybackRateStyle]}>
      <BlurView style={styles.playbackRateBlur} blurType="dark" blurAmount={20}>
        <View style={styles.playbackRateContent}>
          {[0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map(rate => (
            <TouchableOpacity
              key={rate}
              style={[
                styles.playbackRateOption,
                playbackRate === rate && styles.playbackRateOptionActive,
              ]}
              onPress={() => handlePlaybackRateChange(rate)}
            >
              <Text
                style={[
                  styles.playbackRateText,
                  playbackRate === rate && styles.playbackRateTextActive,
                ]}
              >
                {rate}x
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </BlurView>
    </Animated.View>
  );

  return (
    <Animated.View
      style={[
        styles.container,
        { width: viewerWidth, height: viewerHeight },
        animatedContainerStyle,
      ]}
    >
      <MotiView
        from={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          type: 'spring',
          damping: 15,
          stiffness: 150,
        }}
        style={StyleSheet.absoluteFill}
      >
        <AnimatedPanGestureHandler
          ref={panRef}
          onGestureEvent={panGestureHandler}
          enabled={enableGestures}
        >
          <Animated.View style={StyleSheet.absoluteFill}>
            <TapGestureHandler
              ref={doubleTapRef}
              onGestureEvent={doubleTapGestureHandler}
              numberOfTaps={2}
            >
              <TapGestureHandler
                ref={tapRef}
                onGestureEvent={tapGestureHandler}
                waitFor={doubleTapRef}
              >
                <TouchableOpacity
                  style={styles.touchArea}
                  onLongPress={handleLongPress}
                  activeOpacity={1}
                >
                  <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
                    {/* WebView */}
                    <WebView
                      ref={webViewRef}
                      source={{ uri: embedUrl }}
                      style={styles.webview}
                      onLoadStart={handleWebViewLoadStart}
                      onLoad={handleWebViewLoad}
                      onError={handleWebViewError}
                      allowsInlineMediaPlaybook
                      mediaPlaybackRequiresUserAction={false}
                      scrollEnabled={false}
                      bounces={false}
                      javaScriptEnabled
                      domStorageEnabled
                      startInLoadingState
                      allowsFullscreenVideo={allowFullscreen}
                    />

                    {/* Loading overlay */}
                    {isLoading && (
                      <MotiView
                        from={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={[StyleSheet.absoluteFill, styles.loadingOverlay]}
                      >
                        <BlurView style={StyleSheet.absoluteFill} blurType="dark" blurAmount={25} />
                        <Animated.View style={[styles.loadingSpinner, animatedLoadingStyle]}>
                          <Settings size={32} color={ModernTheme.colors.accent[500]} />
                        </Animated.View>
                        <MotiText
                          from={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 500 }}
                          style={styles.loadingText}
                        >
                          Loading {stream.user_name}...
                        </MotiText>
                        <Text style={styles.loadingSubtext}>
                          {retryCount > 0 && `Retry attempt: ${retryCount}`}
                        </Text>
                      </MotiView>
                    )}

                    {/* Error overlay */}
                    {hasError && (
                      <MotiView
                        from={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={[StyleSheet.absoluteFill, styles.errorOverlay]}
                      >
                        <BlurView style={StyleSheet.absoluteFill} blurType="dark" blurAmount={30} />
                        <View style={styles.errorContent}>
                          <X size={48} color={ModernTheme.colors.error[500]} />
                          <Text style={styles.errorTitle}>Stream Unavailable</Text>
                          <Text style={styles.errorMessage}>
                            Unable to load {stream.user_name}'s stream
                          </Text>
                          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                            <LinearGradient
                              colors={ModernTheme.colors.gradients.primary}
                              style={styles.retryGradient}
                            >
                              <RotateCcw size={16} color="#fff" />
                              <Text style={styles.retryText}>Retry</Text>
                            </LinearGradient>
                          </TouchableOpacity>
                        </View>
                      </MotiView>
                    )}

                    {/* Buffering indicator */}
                    {isBuffering && (
                      <Animated.View style={[styles.bufferingIndicator, animatedBufferingStyle]}>
                        <BlurView style={styles.bufferingBlur} blurType="dark" blurAmount={15}>
                          <Text style={styles.bufferingText}>Buffering...</Text>
                        </BlurView>
                      </Animated.View>
                    )}

                    {/* Info overlay */}
                    <LinearGradient
                      colors={['rgba(0,0,0,0.8)', 'transparent']}
                      style={styles.infoOverlay}
                    >
                      <View style={styles.streamInfo}>
                        <View style={styles.topRow}>
                          <View style={styles.platformBadge}>
                            <Text style={styles.platformText}>TWITCH</Text>
                          </View>
                          <View style={styles.liveIndicator}>
                            <MotiView
                              from={{ scale: 0.8 }}
                              animate={{ scale: 1.2 }}
                              transition={{
                                type: 'timing',
                                duration: 1000,
                                loop: true,
                                repeatReverse: true,
                              }}
                              style={styles.liveDot}
                            />
                            <Text style={styles.liveText}>LIVE</Text>
                          </View>
                          <View style={styles.connectionIndicator}>{getConnectionIcon()}</View>
                        </View>

                        <MotiText
                          from={{ opacity: 0, translateY: 10 }}
                          animate={{ opacity: 1, translateY: 0 }}
                          transition={{ delay: 300 }}
                          style={styles.streamTitle}
                          numberOfLines={1}
                        >
                          {stream.user_name}
                        </MotiText>

                        <View style={styles.streamMeta}>
                          <Text style={styles.streamGame} numberOfLines={1}>
                            {stream.game_name}
                          </Text>
                          <View style={styles.viewerInfo}>
                            <Eye size={12} color={ModernTheme.colors.text.secondary} />
                            <Text style={styles.viewerCount}>{viewerCount.toLocaleString()}</Text>
                          </View>
                        </View>
                      </View>
                    </LinearGradient>

                    {/* Volume slider */}
                    {showVolumeSlider && <VolumeSlider />}

                    {/* Playback rate options */}
                    {showPlaybackRateOptions && <PlaybackRateOptions />}

                    {/* Controls overlay */}
                    <Animated.View style={[styles.controlsOverlay, animatedControlsStyle]}>
                      <BlurView style={styles.controlsContainer} blurType="dark" blurAmount={25}>
                        <LinearGradient
                          colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.5)']}
                          style={styles.controlsGradient}
                        >
                          {/* Primary controls */}
                          <View style={styles.primaryControls}>
                            <TouchableOpacity
                              style={styles.controlButton}
                              onPress={handlePlayPause}
                            >
                              <LinearGradient
                                colors={ModernTheme.colors.gradients.primary}
                                style={styles.controlGradient}
                              >
                                {isPlaying ? (
                                  <Pause size={16} color="#fff" />
                                ) : (
                                  <Play size={16} color="#fff" />
                                )}
                              </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={styles.controlButton}
                              onPress={handleMuteToggle}
                              onLongPress={handleVolumeToggle}
                            >
                              <LinearGradient
                                colors={
                                  isMuted
                                    ? ModernTheme.colors.gradients.danger
                                    : ModernTheme.colors.gradients.primary
                                }
                                style={styles.controlGradient}
                              >
                                {isMuted ? (
                                  <VolumeX size={16} color="#fff" />
                                ) : (
                                  <Volume2 size={16} color="#fff" />
                                )}
                              </LinearGradient>
                            </TouchableOpacity>

                            {enableGestures && (
                              <>
                                <TouchableOpacity
                                  style={styles.controlButton}
                                  onPress={handleSkipBack}
                                >
                                  <LinearGradient
                                    colors={ModernTheme.colors.gradients.secondary}
                                    style={styles.controlGradient}
                                  >
                                    <SkipBack size={16} color="#fff" />
                                  </LinearGradient>
                                </TouchableOpacity>

                                <TouchableOpacity
                                  style={styles.controlButton}
                                  onPress={handleSkipForward}
                                >
                                  <LinearGradient
                                    colors={ModernTheme.colors.gradients.secondary}
                                    style={styles.controlGradient}
                                  >
                                    <SkipForward size={16} color="#fff" />
                                  </LinearGradient>
                                </TouchableOpacity>
                              </>
                            )}

                            {showAdvancedControls && (
                              <>
                                <TouchableOpacity
                                  style={styles.controlButton}
                                  onPress={() => onTogglePiP?.()}
                                >
                                  <LinearGradient
                                    colors={ModernTheme.colors.gradients.accent}
                                    style={styles.controlGradient}
                                  >
                                    <PictureInPicture2 size={16} color="#fff" />
                                  </LinearGradient>
                                </TouchableOpacity>

                                <TouchableOpacity
                                  style={styles.controlButton}
                                  onPress={() => setIsFavorite(!isFavorite)}
                                >
                                  <LinearGradient
                                    colors={
                                      isFavorite
                                        ? ModernTheme.colors.gradients.danger
                                        : ModernTheme.colors.gradients.secondary
                                    }
                                    style={styles.controlGradient}
                                  >
                                    <Heart
                                      size={16}
                                      color="#fff"
                                      fill={isFavorite ? '#fff' : 'transparent'}
                                    />
                                  </LinearGradient>
                                </TouchableOpacity>

                                <TouchableOpacity
                                  style={styles.controlButton}
                                  onPress={() => setIsBookmarked(!isBookmarked)}
                                >
                                  <LinearGradient
                                    colors={
                                      isBookmarked
                                        ? ModernTheme.colors.gradients.success
                                        : ModernTheme.colors.gradients.secondary
                                    }
                                    style={styles.controlGradient}
                                  >
                                    <Bookmark
                                      size={16}
                                      color="#fff"
                                      fill={isBookmarked ? '#fff' : 'transparent'}
                                    />
                                  </LinearGradient>
                                </TouchableOpacity>

                                {onShare && (
                                  <TouchableOpacity style={styles.controlButton} onPress={onShare}>
                                    <LinearGradient
                                      colors={ModernTheme.colors.gradients.primary}
                                      style={styles.controlGradient}
                                    >
                                      <Share size={16} color="#fff" />
                                    </LinearGradient>
                                  </TouchableOpacity>
                                )}
                              </>
                            )}
                          </View>

                          {/* Secondary controls */}
                          <View style={styles.secondaryControls}>
                            <TouchableOpacity
                              style={styles.controlButton}
                              onPress={handlePlaybackRateToggle}
                            >
                              <LinearGradient
                                colors={ModernTheme.colors.gradients.secondary}
                                style={styles.controlGradient}
                              >
                                <Text style={styles.playbackRateIndicator}>{playbackRate}x</Text>
                              </LinearGradient>
                            </TouchableOpacity>

                            {onOpenQuality && (
                              <TouchableOpacity
                                style={styles.controlButton}
                                onPress={onOpenQuality}
                              >
                                <LinearGradient
                                  colors={ModernTheme.colors.gradients.secondary}
                                  style={styles.controlGradient}
                                >
                                  <Settings size={16} color="#fff" />
                                </LinearGradient>
                              </TouchableOpacity>
                            )}

                            <TouchableOpacity
                              style={styles.removeButton}
                              onPress={() => onRemove(stream.id)}
                            >
                              <LinearGradient
                                colors={ModernTheme.colors.gradients.danger}
                                style={styles.removeGradient}
                              >
                                <X size={16} color="#fff" />
                              </LinearGradient>
                            </TouchableOpacity>
                          </View>
                        </LinearGradient>
                      </BlurView>
                    </Animated.View>

                    {/* Active indicator */}
                    {isActive && (
                      <MotiView
                        from={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={styles.activeIndicator}
                      >
                        <LinearGradient
                          colors={ModernTheme.colors.gradients.accent}
                          style={styles.activeGradient}
                        />
                      </MotiView>
                    )}

                    {/* Gesture feedback */}
                    {enableGestures && (
                      <View style={styles.gestureHints}>
                        <Text style={styles.gestureHintText}>
                          Double tap: Play/Pause • Swipe: Skip/Volume • Long press: Options
                        </Text>
                      </View>
                    )}
                  </Animated.View>
                </TouchableOpacity>
              </TapGestureHandler>
            </TapGestureHandler>
          </Animated.View>
        </AnimatedPanGestureHandler>
      </MotiView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: ModernTheme.colors.background.secondary,
    borderRadius: ModernTheme.borderRadius.xl,
    overflow: 'hidden',
    margin: ModernTheme.spacing.sm,
    ...ModernTheme.shadows.lg,
  },
  touchArea: {
    flex: 1,
    position: 'relative',
  },
  webview: {
    flex: 1,
    backgroundColor: '#0e0e10',
  },
  loadingOverlay: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  loadingSpinner: {
    marginBottom: ModernTheme.spacing.md,
  },
  loadingText: {
    color: ModernTheme.colors.text.primary,
    fontSize: ModernTheme.typography.sizes.md,
    fontWeight: ModernTheme.typography.weights.medium,
    marginBottom: ModernTheme.spacing.xs,
  },
  loadingSubtext: {
    color: ModernTheme.colors.text.secondary,
    fontSize: ModernTheme.typography.sizes.sm,
    opacity: 0.7,
  },
  errorOverlay: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  errorContent: {
    alignItems: 'center',
    padding: ModernTheme.spacing.lg,
  },
  errorTitle: {
    color: ModernTheme.colors.text.error,
    fontSize: ModernTheme.typography.sizes.lg,
    fontWeight: ModernTheme.typography.weights.bold,
    marginTop: ModernTheme.spacing.md,
    marginBottom: ModernTheme.spacing.sm,
  },
  errorMessage: {
    color: ModernTheme.colors.text.secondary,
    fontSize: ModernTheme.typography.sizes.md,
    textAlign: 'center',
    marginBottom: ModernTheme.spacing.lg,
  },
  retryButton: {
    borderRadius: ModernTheme.borderRadius.lg,
    overflow: 'hidden',
  },
  retryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ModernTheme.spacing.lg,
    paddingVertical: ModernTheme.spacing.md,
    gap: ModernTheme.spacing.sm,
  },
  retryText: {
    color: ModernTheme.colors.text.primary,
    fontSize: ModernTheme.typography.sizes.md,
    fontWeight: ModernTheme.typography.weights.semibold,
  },
  bufferingIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
    borderRadius: ModernTheme.borderRadius.md,
    overflow: 'hidden',
  },
  bufferingBlur: {
    paddingHorizontal: ModernTheme.spacing.md,
    paddingVertical: ModernTheme.spacing.sm,
  },
  bufferingText: {
    color: ModernTheme.colors.text.primary,
    fontSize: ModernTheme.typography.sizes.sm,
    fontWeight: ModernTheme.typography.weights.medium,
  },
  infoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: ModernTheme.spacing.md,
    paddingHorizontal: ModernTheme.spacing.md,
    paddingBottom: ModernTheme.spacing.lg,
  },
  streamInfo: {
    gap: ModernTheme.spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  platformBadge: {
    backgroundColor: ModernTheme.colors.twitch,
    paddingHorizontal: ModernTheme.spacing.sm,
    paddingVertical: ModernTheme.spacing.xs,
    borderRadius: ModernTheme.borderRadius.sm,
  },
  platformText: {
    color: ModernTheme.colors.text.primary,
    fontSize: 10,
    fontWeight: ModernTheme.typography.weights.bold,
    letterSpacing: 0.5,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: ModernTheme.spacing.sm,
    paddingVertical: ModernTheme.spacing.xs,
    borderRadius: ModernTheme.borderRadius.sm,
    gap: ModernTheme.spacing.xs,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: ModernTheme.colors.status.live,
  },
  liveText: {
    color: ModernTheme.colors.text.primary,
    fontSize: 10,
    fontWeight: ModernTheme.typography.weights.bold,
    letterSpacing: 0.5,
  },
  connectionIndicator: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: ModernTheme.spacing.sm,
    paddingVertical: ModernTheme.spacing.xs,
    borderRadius: ModernTheme.borderRadius.sm,
  },
  streamTitle: {
    color: ModernTheme.colors.text.primary,
    fontSize: ModernTheme.typography.sizes.lg,
    fontWeight: ModernTheme.typography.weights.bold,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  streamMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  streamGame: {
    color: ModernTheme.colors.text.accent,
    fontSize: ModernTheme.typography.sizes.sm,
    fontWeight: ModernTheme.typography.weights.semibold,
    flex: 1,
    marginRight: ModernTheme.spacing.sm,
  },
  viewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ModernTheme.spacing.xs,
  },
  viewerCount: {
    color: ModernTheme.colors.text.secondary,
    fontSize: ModernTheme.typography.sizes.sm,
    fontWeight: ModernTheme.typography.weights.medium,
  },
  volumeSlider: {
    position: 'absolute',
    left: ModernTheme.spacing.md,
    bottom: 80,
    borderRadius: ModernTheme.borderRadius.lg,
    overflow: 'hidden',
  },
  volumeSliderBlur: {
    borderRadius: ModernTheme.borderRadius.lg,
  },
  volumeSliderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ModernTheme.spacing.md,
    paddingVertical: ModernTheme.spacing.sm,
    gap: ModernTheme.spacing.sm,
  },
  volumeTrack: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    position: 'relative',
  },
  volumeFill: {
    height: '100%',
    backgroundColor: ModernTheme.colors.accent[500],
    borderRadius: 2,
  },
  volumeThumb: {
    position: 'absolute',
    width: 12,
    height: 12,
    backgroundColor: ModernTheme.colors.accent[500],
    borderRadius: 6,
    top: -4,
    marginLeft: -6,
  },
  playbackRateOptions: {
    position: 'absolute',
    right: ModernTheme.spacing.md,
    bottom: 80,
    borderRadius: ModernTheme.borderRadius.lg,
    overflow: 'hidden',
  },
  playbackRateBlur: {
    borderRadius: ModernTheme.borderRadius.lg,
  },
  playbackRateContent: {
    padding: ModernTheme.spacing.sm,
    gap: ModernTheme.spacing.xs,
  },
  playbackRateOption: {
    paddingHorizontal: ModernTheme.spacing.sm,
    paddingVertical: ModernTheme.spacing.xs,
    borderRadius: ModernTheme.borderRadius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  playbackRateOptionActive: {
    backgroundColor: ModernTheme.colors.accent[500],
  },
  playbackRateText: {
    color: ModernTheme.colors.text.secondary,
    fontSize: ModernTheme.typography.sizes.sm,
    fontWeight: ModernTheme.typography.weights.medium,
    textAlign: 'center',
  },
  playbackRateTextActive: {
    color: ModernTheme.colors.text.primary,
    fontWeight: ModernTheme.typography.weights.bold,
  },
  controlsOverlay: {
    position: 'absolute',
    bottom: ModernTheme.spacing.md,
    left: ModernTheme.spacing.md,
    right: ModernTheme.spacing.md,
    borderRadius: ModernTheme.borderRadius.lg,
    overflow: 'hidden',
  },
  controlsContainer: {
    borderRadius: ModernTheme.borderRadius.lg,
    overflow: 'hidden',
  },
  controlsGradient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: ModernTheme.spacing.md,
    paddingVertical: ModernTheme.spacing.sm,
  },
  primaryControls: {
    flexDirection: 'row',
    gap: ModernTheme.spacing.sm,
  },
  secondaryControls: {
    flexDirection: 'row',
    gap: ModernTheme.spacing.sm,
  },
  controlButton: {
    borderRadius: ModernTheme.borderRadius.md,
    overflow: 'hidden',
  },
  controlGradient: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playbackRateIndicator: {
    color: ModernTheme.colors.text.primary,
    fontSize: 10,
    fontWeight: ModernTheme.typography.weights.bold,
  },
  removeButton: {
    borderRadius: ModernTheme.borderRadius.md,
    overflow: 'hidden',
  },
  removeGradient: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIndicator: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: ModernTheme.borderRadius.xl + 3,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  activeGradient: {
    flex: 1,
    borderRadius: ModernTheme.borderRadius.xl + 3,
  },
  gestureHints: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: ModernTheme.spacing.xs,
    paddingHorizontal: ModernTheme.spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  gestureHintText: {
    color: ModernTheme.colors.text.secondary,
    fontSize: 9,
    textAlign: 'center',
    opacity: 0.6,
  },
});
