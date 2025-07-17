import { LinearGradient } from 'expo-linear-gradient';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  X,
  Eye,
  Users,
  Wifi,
  WifiOff,
  AlertCircle,
  MoreVertical,
  Maximize2,
  Minimize2,
  Zap,
  Radio,
} from 'lucide-react-native';
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Platform, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  interpolateColor,
  FadeIn,
  FadeOut,
  SlideInUp,
  SlideInDown,
  BounceIn,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { TwitchStream } from '@/services/twitchApi';
import { ModernTheme } from '@/theme/modernTheme';
import { HapticFeedback } from '@/utils/haptics';
import { BlurViewFallback as BlurView } from './BlurViewFallback';
import { UnifiedTwitchPlayer } from './UnifiedTwitchPlayer';

interface StreamPlayerCardProps {
  stream: TwitchStream;
  width: number;
  height: number;
  isActive?: boolean;
  isMuted?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  onRemove?: () => void;
  onMuteToggle?: () => void;
  showControls?: boolean;
  showQuality?: boolean;
  showViewers?: boolean;
  compact?: boolean;
  expanded?: boolean;
  isVisible?: boolean;
  priority?: 'high' | 'normal' | 'low';
}

interface StreamState {
  isLoading: boolean;
  hasError: boolean;
  isPlaying: boolean;
  quality: 'HD' | 'SD' | 'AUTO';
  loadAttempts: number;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export const StreamPlayerCard: React.FC<StreamPlayerCardProps> = React.memo(
  ({
    stream,
    width,
    height,
    isActive = false,
    isMuted = true,
    onPress,
    onLongPress,
    onRemove,
    onMuteToggle,
    showControls = true,
    showQuality = true,
    showViewers = true,
    compact = false,
    expanded = false,
    isVisible = true,
    priority = 'normal',
  }) => {
    const [streamState, setStreamState] = useState<StreamState>({
      isLoading: true,
      hasError: false,
      isPlaying: true,
      quality: 'AUTO',
      loadAttempts: 0,
    });

    const [controlsVisible, setControlsVisible] = useState(false);

    // Animation values
    const scale = useSharedValue(1);
    const borderGlow = useSharedValue(0);
    const controlsOpacity = useSharedValue(0);
    const overlayOpacity = useSharedValue(1);
    const livePulse = useSharedValue(1);
    const spinnerRotation = useSharedValue(0);
    const qualityPulse = useSharedValue(1);

    // Initialize animations
    useEffect(() => {
      // Live indicator pulse
      livePulse.value = withRepeat(
        withSequence(withTiming(1.2, { duration: 1000 }), withTiming(1, { duration: 1000 })),
        -1
      );

      // Loading spinner rotation
      if (streamState.isLoading) {
        spinnerRotation.value = withRepeat(
          withTiming(360, { duration: 1000, easing: Easing.linear }),
          -1
        );
      }

      // Quality indicator pulse on change
      qualityPulse.value = withSpring(1.1, { damping: 15 }, () => {
        qualityPulse.value = withSpring(1);
      });
    }, [streamState.isLoading, streamState.quality]);

    // Auto-hide controls
    useEffect(() => {
      if (controlsVisible) {
        const timer = setTimeout(() => {
          setControlsVisible(false);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }, [controlsVisible]);

    // Active state animation
    useEffect(() => {
      borderGlow.value = withTiming(isActive ? 1 : 0, { duration: 300 });
    }, [isActive]);

    // Controls visibility animation
    useEffect(() => {
      controlsOpacity.value = withTiming(controlsVisible ? 1 : 0, { duration: 200 });
    }, [controlsVisible]);

    // Adaptive overlay opacity based on content
    useEffect(() => {
      if (compact) {
        overlayOpacity.value = withTiming(0.6, { duration: 200 });
      } else if (expanded) {
        overlayOpacity.value = withTiming(0.8, { duration: 200 });
      } else {
        overlayOpacity.value = withTiming(0.7, { duration: 200 });
      }
    }, [compact, expanded]);

    // Stream loading handlers
    const handleLoadStart = useCallback(() => {
      setStreamState(prev => ({ ...prev, isLoading: true, hasError: false }));
    }, []);

    const handleLoadEnd = useCallback(() => {
      setStreamState(prev => ({
        ...prev,
        isLoading: false,
        hasError: false,
        quality: width > 300 ? 'HD' : 'SD',
      }));
    }, [width]);

    const handleLoadError = useCallback(() => {
      setStreamState(prev => ({
        ...prev,
        isLoading: false,
        hasError: true,
        loadAttempts: prev.loadAttempts + 1,
      }));
    }, []);

    // Interaction handlers
    const handlePress = useCallback(() => {
      HapticFeedback.light();

      scale.value = withSpring(0.95, { damping: 20 }, () => {
        scale.value = withSpring(1.02, { damping: 15 }, () => {
          scale.value = withSpring(1);
        });
      });

      if (!compact) {
        setControlsVisible(!controlsVisible);
      }

      onPress?.();
    }, [compact, controlsVisible, onPress]);

    const handleLongPress = useCallback(() => {
      HapticFeedback.medium();

      scale.value = withSpring(1.05, { damping: 12 });

      // Enhanced visual feedback for long press
      borderGlow.value = withTiming(1, { duration: 150 }, () => {
        borderGlow.value = withTiming(0, { duration: 300 });
      });

      onLongPress?.();
    }, [onLongPress]);

    const handlePressOut = useCallback(() => {
      scale.value = withSpring(1, { damping: 20 });
    }, []);

    const togglePlayPause = useCallback(() => {
      HapticFeedback.medium();
      setStreamState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
      // WebView control logic would go here
    }, []);

    const handleMuteToggle = useCallback(() => {
      HapticFeedback.light();

      // Visual feedback without disrupting stream
      scale.value = withSpring(0.95, { damping: 20 }, () => {
        scale.value = withSpring(1);
      });

      onMuteToggle?.();
    }, [onMuteToggle]);

    const handleRemove = useCallback(() => {
      HapticFeedback.warning();

      // Animate out before removing
      scale.value = withSpring(0.8, { damping: 20 }, () => {
        onRemove?.();
      });
    }, [onRemove]);

    const retryLoad = useCallback(() => {
      HapticFeedback.medium();

      setStreamState(prev => ({
        ...prev,
        isLoading: true,
        hasError: false,
        loadAttempts: 0,
      }));

      // Restart loading animation
      spinnerRotation.value = 0;
      spinnerRotation.value = withRepeat(
        withTiming(360, { duration: 1000, easing: Easing.linear }),
        -1
      );
    }, []);

    const handleMessage = useCallback(
      (event: any) => {
        try {
          const data = JSON.parse(event.nativeEvent.data);
          switch (data.type) {
            case 'ready':
              setStreamState(prev => ({
                ...prev,
                isLoading: false,
                hasError: false,
                quality: width > 300 ? 'HD' : 'SD',
              }));
              break;
            case 'error':
              setStreamState(prev => ({
                ...prev,
                isLoading: false,
                hasError: true,
                loadAttempts: prev.loadAttempts + 1,
              }));
              break;
            default:
              break;
          }
        } catch (e) {
          // Ignore parsing errors for non-JSON messages
        }
      },
      [width]
    );

    // Generate optimized Twitch embed (memoized for performance)
    const embedHtml = useMemo(() => {
      // Enhanced parent domain configuration for better compatibility
      const getParentDomains = () => {
        const domains = [
          'localhost',
          '127.0.0.1',
          'expo.dev',
          'exp.host',
          'expo.io',
          'snack.expo.dev',
          'reactnative.dev',
          'github.dev',
          'codesandbox.io',
          'bolt.new',
        ];
        return domains.map(domain => `parent=${encodeURIComponent(domain)}`).join('&');
      };

      const embedUrl = `https://player.twitch.tv/?channel=${stream.user_login}&${getParentDomains()}&muted=${isMuted}&autoplay=true&controls=false&time=0s`;

      return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            background: #0e0e10;
            overflow: hidden;
            width: 100%;
            height: 100%;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
          }
          .container {
            width: 100%;
            height: 100%;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          iframe { 
            width: 100%;
            height: 100%;
            border: none;
            display: block;
            background: #0e0e10;
          }
          .error-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: #fff;
            text-align: center;
            padding: 20px;
            height: 100%;
          }
          .error-icon {
            font-size: 24px;
            margin-bottom: 8px;
          }
          .error-text {
            font-size: 12px;
            opacity: 0.8;
            margin-bottom: 12px;
          }
          .retry-button {
            padding: 6px 12px;
            background: #9146FF;
            color: white;
            border: none;
            border-radius: 4px;
            font-size: 11px;
            cursor: pointer;
          }
          .retry-button:hover {
            background: #8B5CF6;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <iframe
            src="${embedUrl}"
            frameborder="0"
            allowfullscreen="false"
            scrolling="no"
            allow="autoplay; encrypted-media"
            onload="window.parent.postMessage('loaded', '*')"
            onerror="window.parent.postMessage('error', '*')">
          </iframe>
        </div>
        <script>
          // Enhanced multi-stream player controls
          let playerReady = false;
          let loadTimeout;
          
          // Prevent fullscreen completely
          document.addEventListener('fullscreenchange', function() {
            if (document.fullscreenElement) {
              document.exitFullscreen().catch(() => {});
            }
          });
          
          document.addEventListener('webkitfullscreenchange', function() {
            if (document.webkitFullscreenElement) {
              document.webkitExitFullscreen().catch(() => {});
            }
          });
          
          // Enhanced error detection and reporting
          window.addEventListener('error', function(e) {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'error',
                message: e.message,
                filename: e.filename,
                lineno: e.lineno,
                timestamp: Date.now()
              }));
            }
          });
          
          // Monitor for successful iframe load
          const iframe = document.querySelector('iframe');
          if (iframe) {
            iframe.addEventListener('load', function() {
              playerReady = true;
              clearTimeout(loadTimeout);
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'ready',
                  timestamp: Date.now()
                }));
              }
            });
          }
          
          // Fallback ready notification
          loadTimeout = setTimeout(() => {
            if (!playerReady && window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'ready',
                timestamp: Date.now(),
                fallback: true
              }));
            }
          }, 5000);
          
          // Handle WebView messages from React Native
          window.addEventListener('message', function(event) {
            try {
              const data = JSON.parse(event.data);
              if (data.action === 'mute') {
                // Handle mute command if needed
              } else if (data.action === 'unmute') {
                // Handle unmute command if needed
              }
            } catch (e) {
              // Ignore parsing errors
            }
          });
        </script>
      </body>
      </html>
    `;
    }, [stream.user_login, isMuted]);

    // Animated styles
    const cardStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
      borderColor: interpolateColor(
        borderGlow.value,
        [0, 1],
        ['rgba(255, 255, 255, 0.1)', '#38bdf8']
      ),
      borderWidth: interpolate(borderGlow.value, [0, 1], [1, 3]),
      shadowOpacity: interpolate(borderGlow.value, [0, 1], [0.2, 0.6]),
      shadowRadius: interpolate(borderGlow.value, [0, 1], [4, 16]),
      shadowColor: interpolateColor(borderGlow.value, [0, 1], ['#000000', '#38bdf8']),
    }));

    const overlayStyle = useAnimatedStyle(() => ({
      opacity: overlayOpacity.value,
    }));

    const controlsStyle = useAnimatedStyle(() => ({
      opacity: controlsOpacity.value,
      transform: [{ translateY: interpolate(controlsOpacity.value, [0, 1], [20, 0]) }],
    }));

    const livePulseStyle = useAnimatedStyle(() => ({
      transform: [{ scale: livePulse.value }],
    }));

    const spinnerStyle = useAnimatedStyle(() => ({
      transform: [{ rotate: `${spinnerRotation.value}deg` }],
    }));

    const qualityStyle = useAnimatedStyle(() => ({
      transform: [{ scale: qualityPulse.value }],
    }));

    // Responsive sizing (memoized)
    const { fontSize, iconSize, padding } = useMemo(
      () => ({
        fontSize: {
          title: compact ? 10 : expanded ? 14 : 12,
          subtitle: compact ? 8 : expanded ? 12 : 10,
          badge: compact ? 7 : expanded ? 9 : 8,
        },
        iconSize: compact ? 12 : expanded ? 18 : 14,
        padding: compact ? 6 : expanded ? 12 : 8,
      }),
      [compact, expanded]
    );

    return (
      <Animated.View style={[styles.container, { width, height }, cardStyle]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={0.9}
          onPress={handlePress}
          onLongPress={handleLongPress}
          onPressOut={handlePressOut}
        >
          {/* Stream Content */}
          <View style={styles.webViewContainer}>
            {!streamState.hasError ? (
              <UnifiedTwitchPlayer
                streamId={stream.user_login}
                muted={isMuted}
                isVisible={isVisible}
                priority={isActive ? 'high' : priority}
                onLoad={() => {
                  setStreamState(prev => ({
                    ...prev,
                    isLoading: false,
                    hasError: false,
                    quality: width > 300 ? 'HD' : 'SD',
                  }));
                }}
                onError={() => {
                  setStreamState(prev => ({
                    ...prev,
                    isLoading: false,
                    hasError: true,
                    loadAttempts: prev.loadAttempts + 1,
                  }));
                }}
                style={StyleSheet.absoluteFill}
              />
            ) : (
              <Animated.View entering={SlideInDown.delay(200)} style={styles.errorContainer}>
                <LinearGradient colors={['#1a1a1a', '#0e0e10']} style={StyleSheet.absoluteFill} />
                <Animated.View entering={BounceIn.delay(300)} style={styles.errorContent}>
                  <AlertCircle size={iconSize * 2} color={ModernTheme.colors.error[400]} />
                  <Text style={[styles.errorText, { fontSize: fontSize.subtitle }]}>
                    Stream unavailable
                  </Text>
                  <Text style={[styles.errorSubtext, { fontSize: fontSize.badge }]}>
                    Connection failed or stream is offline
                  </Text>
                  <Pressable
                    onPress={retryLoad}
                    style={({ pressed }) => [
                      styles.retryButton,
                      { transform: [{ scale: pressed ? 0.95 : 1 }] },
                    ]}
                  >
                    <LinearGradient
                      colors={[ModernTheme.colors.primary[500], ModernTheme.colors.primary[600]]}
                      style={styles.retryGradient}
                    >
                      <Text style={[styles.retryText, { fontSize: fontSize.badge }]}>
                        Retry ({streamState.loadAttempts}/3)
                      </Text>
                    </LinearGradient>
                  </Pressable>
                </Animated.View>
              </Animated.View>
            )}
          </View>

          {/* Loading Overlay */}
          {streamState.isLoading && (
            <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.loadingOverlay}>
              <BlurView style={StyleSheet.absoluteFill} blurType="dark" blurAmount={20} />
              <View style={styles.loadingContent}>
                <Animated.View
                  style={[
                    styles.loadingSpinner,
                    { width: iconSize, height: iconSize },
                    spinnerStyle,
                  ]}
                />
                <Text style={[styles.loadingText, { fontSize: fontSize.subtitle }]}>
                  Loading...
                </Text>
              </View>
            </Animated.View>
          )}

          {/* Stream Info Overlay */}
          <Animated.View style={[styles.infoOverlay, overlayStyle]}>
            <LinearGradient
              colors={['rgba(0, 0, 0, 0.8)', 'rgba(0, 0, 0, 0.4)', 'transparent']}
              style={[styles.infoGradient, { padding }]}
            >
              {/* Top Row: Live indicator, quality, viewer count */}
              <View style={styles.topRow}>
                <View style={styles.leftInfo}>
                  <Animated.View
                    style={[styles.liveIndicator, { height: fontSize.badge + 4 }, livePulseStyle]}
                  >
                    <Animated.View style={[styles.liveDot, { width: 4, height: 4 }]} />
                    <Text style={[styles.liveText, { fontSize: fontSize.badge }]}>LIVE</Text>
                    <Radio size={fontSize.badge} color={ModernTheme.colors.status.live} />
                  </Animated.View>

                  {showQuality && (
                    <Animated.View
                      style={[styles.qualityBadge, { height: fontSize.badge + 4 }, qualityStyle]}
                    >
                      <Zap size={fontSize.badge} color={ModernTheme.colors.success[400]} />
                      <Text style={[styles.qualityText, { fontSize: fontSize.badge }]}>
                        {streamState.quality}
                      </Text>
                    </Animated.View>
                  )}
                </View>

                {showViewers && (
                  <View style={[styles.viewersBadge, { height: fontSize.badge + 4 }]}>
                    <Eye size={fontSize.badge} color={ModernTheme.colors.text.secondary} />
                    <Text style={[styles.viewersText, { fontSize: fontSize.badge }]}>
                      {(stream.viewer_count || 0).toLocaleString()}
                    </Text>
                  </View>
                )}
              </View>

              {/* Stream Title */}
              {!compact && (
                <Text
                  style={[styles.streamTitle, { fontSize: fontSize.title }]}
                  numberOfLines={expanded ? 2 : 1}
                >
                  {stream.user_name}
                </Text>
              )}

              {/* Game/Category */}
              {expanded && stream.game_name && (
                <Text
                  style={[styles.streamCategory, { fontSize: fontSize.subtitle }]}
                  numberOfLines={1}
                >
                  {stream.game_name}
                </Text>
              )}
            </LinearGradient>
          </Animated.View>

          {/* Controls Overlay */}
          {showControls && (
            <Animated.View style={[styles.controlsOverlay, controlsStyle]}>
              <BlurView style={styles.controlsContainer} blurType="dark" blurAmount={15}>
                <View style={[styles.controlsContent, { padding: padding / 2 }]}>
                  {/* Left Controls */}
                  <View style={styles.leftControls}>
                    <TouchableOpacity
                      style={[styles.controlButton, { width: iconSize + 8, height: iconSize + 8 }]}
                      onPress={togglePlayPause}
                    >
                      {streamState.isPlaying ? (
                        <Pause size={iconSize * 0.8} color="#fff" />
                      ) : (
                        <Play size={iconSize * 0.8} color="#fff" />
                      )}
                    </TouchableOpacity>

                    <Pressable
                      style={({ pressed }) => [
                        styles.controlButton,
                        styles.muteButton,
                        {
                          width: iconSize + 16,
                          height: iconSize + 16,
                          transform: [{ scale: pressed ? 0.9 : 1 }],
                        },
                      ]}
                      onPress={handleMuteToggle}
                    >
                      {isMuted ? (
                        <VolumeX size={iconSize} color="#fff" />
                      ) : (
                        <Volume2 size={iconSize} color="#38bdf8" />
                      )}
                    </Pressable>
                  </View>

                  {/* Right Controls */}
                  <View style={styles.rightControls}>
                    {onRemove && (
                      <Pressable
                        style={({ pressed }) => [
                          styles.controlButton,
                          styles.removeButton,
                          {
                            width: iconSize + 8,
                            height: iconSize + 8,
                            transform: [{ scale: pressed ? 0.9 : 1 }],
                          },
                        ]}
                        onPress={handleRemove}
                      >
                        <X size={iconSize * 0.8} color="#fff" />
                      </Pressable>
                    )}
                  </View>
                </View>
              </BlurView>
            </Animated.View>
          )}

          {/* Active Indicator */}
          {isActive && (
            <Animated.View entering={BounceIn.delay(200)} style={styles.activeIndicator}>
              <LinearGradient
                colors={[ModernTheme.colors.primary[400], ModernTheme.colors.primary[600]]}
                style={styles.activeGradient}
              >
                <Zap size={iconSize} color="#fff" />
              </LinearGradient>
            </Animated.View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  }
);

StreamPlayerCard.displayName = 'StreamPlayerCard';

const styles = StyleSheet.create({
  container: {
    borderRadius: ModernTheme.borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: ModernTheme.colors.background.secondary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: '#0e0e10',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: ModernTheme.spacing.md,
  },
  errorContent: {
    alignItems: 'center',
    gap: ModernTheme.spacing.sm,
  },
  errorText: {
    color: ModernTheme.colors.text.primary,
    textAlign: 'center',
    fontWeight: ModernTheme.typography.weights.semibold,
  },
  errorSubtext: {
    color: ModernTheme.colors.text.secondary,
    textAlign: 'center',
    fontWeight: ModernTheme.typography.weights.medium,
  },
  retryButton: {
    borderRadius: ModernTheme.borderRadius.md,
    overflow: 'hidden',
    shadowColor: ModernTheme.colors.primary[500],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  retryGradient: {
    paddingHorizontal: ModernTheme.spacing.sm,
    paddingVertical: ModernTheme.spacing.xs,
  },
  retryText: {
    color: '#fff',
    fontWeight: ModernTheme.typography.weights.medium,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    gap: ModernTheme.spacing.xs,
  },
  loadingSpinner: {
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderTopColor: ModernTheme.colors.accent[400],
    borderRadius: 50,
    // Animation would be handled by Animated.loop in real implementation
  },
  loadingText: {
    color: ModernTheme.colors.text.secondary,
    fontWeight: ModernTheme.typography.weights.medium,
  },
  infoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  infoGradient: {
    minHeight: 50,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: ModernTheme.spacing.xs,
  },
  leftInfo: {
    flexDirection: 'row',
    gap: ModernTheme.spacing.xs,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 6,
    borderRadius: ModernTheme.borderRadius.sm,
    gap: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 0, 0.3)',
  },
  liveDot: {
    borderRadius: 2,
    backgroundColor: ModernTheme.colors.status.live,
  },
  liveText: {
    color: '#fff',
    fontWeight: ModernTheme.typography.weights.bold,
  },
  qualityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 6,
    borderRadius: ModernTheme.borderRadius.sm,
    gap: 3,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 0, 0.3)',
  },
  qualityText: {
    color: ModernTheme.colors.success[400],
    fontWeight: ModernTheme.typography.weights.bold,
  },
  viewersBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    borderRadius: ModernTheme.borderRadius.sm,
    gap: 3,
  },
  viewersText: {
    color: ModernTheme.colors.text.secondary,
    fontWeight: ModernTheme.typography.weights.medium,
  },
  streamTitle: {
    color: '#fff',
    fontWeight: ModernTheme.typography.weights.semibold,
    marginBottom: 2,
  },
  streamCategory: {
    color: ModernTheme.colors.accent[300],
    fontWeight: ModernTheme.typography.weights.medium,
  },
  controlsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  controlsContainer: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  controlsContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftControls: {
    flexDirection: 'row',
    gap: ModernTheme.spacing.xs,
  },
  rightControls: {
    flexDirection: 'row',
    gap: ModernTheme.spacing.xs,
  },
  controlButton: {
    borderRadius: ModernTheme.borderRadius.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  removeButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    borderColor: 'rgba(239, 68, 68, 0.5)',
  },
  muteButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  activeIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: ModernTheme.borderRadius.md,
    overflow: 'hidden',
  },
  activeGradient: {
    padding: 6,
    borderRadius: ModernTheme.borderRadius.md,
  },
});

export default StreamPlayerCard;
