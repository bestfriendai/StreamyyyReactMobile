import { LinearGradient } from 'expo-linear-gradient';
import {
  Volume2,
  VolumeX,
  Maximize,
  X,
  Settings,
  Monitor,
  MessageCircle,
  Heart,
  Play,
  Pause,
  MoreVertical,
  Eye,
  Users,
} from 'lucide-react-native';
import { MotiView, MotiText } from 'moti';
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { WebView } from 'react-native-webview';
import { TwitchStream, twitchApi } from '@/services/twitchApi';
import { BlurViewFallback as BlurView } from './BlurViewFallback';

interface EnhancedStreamViewerProps {
  stream: TwitchStream;
  onRemove: (streamId: string) => void;
  width?: number;
  height?: number;
  isActive?: boolean;
  onToggleActive?: () => void;
  onTogglePiP?: () => void;
  onOpenQuality?: () => void;
  showAdvancedControls?: boolean;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export function EnhancedStreamViewer({
  stream,
  onRemove,
  width,
  height,
  isActive = false,
  onToggleActive,
  onTogglePiP,
  onOpenQuality,
  showAdvancedControls = true,
}: EnhancedStreamViewerProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [viewerCount, setViewerCount] = useState(stream.viewer_count || 0);
  const [isFavorite, setIsFavorite] = useState(false);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(false);
  const webViewRef = useRef<WebView>(null);

  // Animation values
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const controlsOpacity = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const borderGlow = useSharedValue(0);

  const screenWidth = Dimensions.get('window').width;
  const viewerWidth = width || screenWidth - 32;
  const viewerHeight = height || (viewerWidth * 9) / 16;

  const embedUrl =
    twitchApi.generateEmbedUrl(stream.user_login) + (isMuted ? '&muted=true' : '&muted=false');

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // Pulse animation for active stream
    if (isActive) {
      pulseScale.value = withTiming(1.02, { duration: 1000 });
      borderGlow.value = withTiming(1, { duration: 300 });
    } else {
      pulseScale.value = withTiming(1, { duration: 300 });
      borderGlow.value = withTiming(0, { duration: 300 });
    }
  }, [isActive]);

  useEffect(() => {
    // Update viewer count periodically
    const interval = setInterval(() => {
      const variation = Math.floor(Math.random() * 100) - 50; // Random +/- 50
      setViewerCount(Math.max(0, (stream.viewer_count || 0) + variation));
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [stream.viewer_count]);

  useEffect(() => {
    if (showControls) {
      controlsOpacity.value = withTiming(1, { duration: 200 });

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      timeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          setShowControls(false);
        }
      }, 4000);
    } else {
      controlsOpacity.value = withTiming(0, { duration: 200 });
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [showControls]);

  const handlePress = () => {
    if (isMountedRef.current) {
      scale.value = withSpring(0.95, { damping: 15 }, () => {
        scale.value = withSpring(1);
      });
      setShowControls(!showControls);
      onToggleActive?.();
    }
  };

  const handleLongPress = () => {
    if (isMountedRef.current) {
      scale.value = withSpring(1.05, { damping: 12 }, () => {
        scale.value = withSpring(1);
      });
      // Show advanced options
      Alert.alert(
        stream.user_name,
        `${stream.game_name}\n${viewerCount.toLocaleString()} viewers`,
        [
          { text: 'Picture-in-Picture', onPress: () => onTogglePiP?.() },
          { text: 'Quality Settings', onPress: () => onOpenQuality?.() },
          { text: 'Toggle Favorite', onPress: () => setIsFavorite(!isFavorite) },
          { text: 'Remove Stream', style: 'destructive', onPress: () => onRemove(stream.id) },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  const handleMuteToggle = () => {
    if (isMountedRef.current) {
      setIsMuted(!isMuted);
    }
  };

  const handlePlayPause = () => {
    if (isMountedRef.current) {
      setIsPlaying(!isPlaying);
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    borderColor:
      interpolate(borderGlow.value, [0, 1], [0, 1]) > 0.5 ? '#8B5CF6' : 'rgba(139, 92, 246, 0.2)',
    borderWidth: interpolate(borderGlow.value, [0, 1], [1, 2]),
  }));

  const animatedControlsStyle = useAnimatedStyle(() => ({
    opacity: controlsOpacity.value,
  }));

  // Generate enhanced Twitch embed HTML
  const twitchEmbedHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          background: #0e0e10;
          overflow: hidden;
          width: 100%;
          height: 100%;
          font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif;
        }
        iframe { 
          width: 100% !important; 
          height: 100% !important; 
          border: none !important;
          display: block !important;
        }
        .container {
          width: 100%;
          height: 100%;
          position: relative;
        }
        .loading {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: #8B5CF6;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="loading">Loading ${stream.user_name}...</div>
        <iframe
          src="${embedUrl}"
          frameborder="0"
          allowfullscreen="false"
          scrolling="no"
          allow="autoplay; encrypted-media">
        </iframe>
      </div>
      <script>
        document['addEventListener']('fullscreenchange', function() {
          if (document.fullscreenElement) {
            document.exitFullscreen();
          }
        });
        
        window['addEventListener']('message', function(event) {
          try {
            const data = JSON.parse(event.data);
            if (data.action === 'mute' || data.action === 'unmute') {
              // Audio control handled by parent
            }
          } catch (e) {
            // Ignore parsing errors
          }
        });

        // Hide loading when iframe loads
        const iframe = document.querySelector('iframe');
        iframe['addEventListener']('load', function() {
          document.querySelector('.loading').style.display = 'none';
        });
      </script>
    </body>
    </html>
  `;

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
        <TouchableOpacity
          style={styles.touchArea}
          onPress={handlePress}
          onLongPress={handleLongPress}
          activeOpacity={1}
        >
          <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
            {/* WebView */}
            <WebView
              ref={webViewRef}
              source={{ html: twitchEmbedHtml }}
              style={styles.webview}
              onLoadStart={() => setIsLoading(true)}
              onLoadEnd={() => setIsLoading(false)}
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
              scrollEnabled={false}
              bounces={false}
              javaScriptEnabled
              domStorageEnabled
              startInLoadingState
              onError={error => console.error(`Stream error for ${stream.user_name}:`, error)}
            />

            {/* Loading overlay */}
            {isLoading && (
              <MotiView
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={[StyleSheet.absoluteFill, styles.loadingOverlay]}
              >
                <BlurView style={StyleSheet.absoluteFill} blurType="dark" blurAmount={20} />
                <MotiView
                  from={{ rotate: '0deg' }}
                  animate={{ rotate: '360deg' }}
                  transition={{
                    type: 'timing',
                    duration: 1000,
                    loop: true,
                  }}
                >
                  <Settings size={24} color="#8B5CF6" />
                </MotiView>
                <MotiText
                  from={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 500 }}
                  style={styles.loadingText}
                >
                  Loading {stream.user_name}...
                </MotiText>
              </MotiView>
            )}

            {/* Info overlay */}
            <LinearGradient colors={['rgba(0,0,0,0.8)', 'transparent']} style={styles.infoOverlay}>
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
                    <Eye size={12} color="#999" />
                    <Text style={styles.viewerCount}>{viewerCount.toLocaleString()}</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>

            {/* Controls overlay */}
            <Animated.View style={[styles.controlsOverlay, animatedControlsStyle]}>
              <BlurView style={styles.controlsContainer} blurType="dark" blurAmount={25}>
                <LinearGradient
                  colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.5)']}
                  style={styles.controlsGradient}
                >
                  {/* Primary controls */}
                  <View style={styles.primaryControls}>
                    <TouchableOpacity style={styles.controlButton} onPress={handlePlayPause}>
                      <LinearGradient
                        colors={['rgba(139, 92, 246, 0.9)', 'rgba(124, 58, 237, 0.9)']}
                        style={styles.controlGradient}
                      >
                        {isPlaying ? (
                          <Pause size={16} color="#fff" />
                        ) : (
                          <Play size={16} color="#fff" />
                        )}
                      </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.controlButton} onPress={handleMuteToggle}>
                      <LinearGradient
                        colors={
                          isMuted
                            ? ['rgba(239, 68, 68, 0.9)', 'rgba(220, 38, 38, 0.9)']
                            : ['rgba(139, 92, 246, 0.9)', 'rgba(124, 58, 237, 0.9)']
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

                    {showAdvancedControls && (
                      <>
                        <TouchableOpacity
                          style={styles.controlButton}
                          onPress={() => onTogglePiP?.()}
                        >
                          <LinearGradient
                            colors={['rgba(139, 92, 246, 0.9)', 'rgba(124, 58, 237, 0.9)']}
                            style={styles.controlGradient}
                          >
                            <Monitor size={16} color="#fff" />
                          </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.controlButton}
                          onPress={() => setIsFavorite(!isFavorite)}
                        >
                          <LinearGradient
                            colors={
                              isFavorite
                                ? ['rgba(239, 68, 68, 0.9)', 'rgba(220, 38, 38, 0.9)']
                                : ['rgba(75, 85, 99, 0.9)', 'rgba(55, 65, 81, 0.9)']
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
                      </>
                    )}
                  </View>

                  {/* Secondary controls */}
                  <View style={styles.secondaryControls}>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => onRemove(stream.id)}
                    >
                      <LinearGradient
                        colors={['rgba(239, 68, 68, 0.9)', 'rgba(220, 38, 38, 0.9)']}
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
                  colors={['#8B5CF6', '#7C3AED', '#6366F1']}
                  style={styles.activeGradient}
                />
              </MotiView>
            )}
          </Animated.View>
        </TouchableOpacity>
      </MotiView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
    borderRadius: 16,
    overflow: 'hidden',
    margin: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.4)',
      },
    }),
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
  loadingText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 12,
    fontWeight: '500',
  },
  infoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 12,
    paddingHorizontal: 12,
    paddingBottom: 16,
  },
  streamInfo: {
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  platformBadge: {
    backgroundColor: '#9146FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  platformText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00FF00',
  },
  liveText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  streamTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
    color: '#8B5CF6',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  viewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewerCount: {
    color: '#999',
    fontSize: 12,
    fontWeight: '500',
  },
  controlsOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  controlsContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  controlsGradient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  primaryControls: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryControls: {
    flexDirection: 'row',
    gap: 8,
  },
  controlButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  controlGradient: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButton: {
    borderRadius: 8,
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
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  activeGradient: {
    flex: 1,
    borderRadius: 18,
  },
});
