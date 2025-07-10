import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  X,
  Eye,
  Settings,
} from 'lucide-react-native';
import { TwitchStream } from '@/services/twitchApi';
import { ModernTheme } from '@/theme/modernTheme';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';

interface EnhancedVideoPlayerProps {
  stream: TwitchStream;
  width: number;
  height: number;
  isActive?: boolean;
  isMuted?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  onRemove?: () => void;
  onMuteToggle?: () => void;
  onPlayPause?: () => void;
  showControls?: boolean;
  quality?: 'auto' | 'source' | 'high' | 'medium' | 'low';
}

export const EnhancedVideoPlayer: React.FC<EnhancedVideoPlayerProps> = ({
  stream,
  width,
  height,
  isActive = false,
  isMuted = true,
  onPress,
  onLongPress,
  onRemove,
  onMuteToggle,
  onPlayPause,
  showControls = true,
  quality = 'auto',
}) => {
  // State management
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [controlsVisible, setControlsVisible] = useState(false);
  const webViewRef = useRef<WebView>(null);
  
  // Generate Twitch embed URL
  const getTwitchEmbedUrl = useCallback(() => {
    // Use direct Twitch player URL with proper parameters
    const params = new URLSearchParams({
      channel: stream.user_login,
      muted: isMuted.toString(),
      autoplay: 'true',
      controls: 'true'
    });
    
    // Add multiple parent domains for compatibility
    params.append('parent', 'localhost');
    params.append('parent', '127.0.0.1');
    params.append('parent', 'expo.dev');
    
    return `https://player.twitch.tv/?${params.toString()}`;
  }, [stream.user_login, isMuted]);
  
  const embedUrl = getTwitchEmbedUrl();
  
  // Animation values
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const controlsOpacity = useSharedValue(0);
  
  // Auto-hide controls timer
  const controlsTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
  
  const controlsStyle = useAnimatedStyle(() => ({
    opacity: controlsOpacity.value,
  }));
  
  // Handle press with animation
  const handlePress = useCallback(() => {
    scale.value = withSpring(0.95, { damping: 15 }, () => {
      scale.value = withSpring(1);
    });
    
    // Toggle controls visibility
    setControlsVisible(!controlsVisible);
    controlsOpacity.value = withTiming(controlsVisible ? 0 : 1, { duration: 200 });
    
    // Auto-hide controls after 3 seconds
    if (!controlsVisible) {
      if (controlsTimer.current) clearTimeout(controlsTimer.current);
      controlsTimer.current = setTimeout(() => {
        setControlsVisible(false);
        controlsOpacity.value = withTiming(0, { duration: 200 });
      }, 3000);
    }
    
    onPress?.();
  }, [controlsVisible, onPress]);
  
  // Handle long press with animation
  const handleLongPress = useCallback(() => {
    scale.value = withSpring(1.05, { damping: 12 }, () => {
      scale.value = withSpring(1);
    });
    onLongPress?.();
  }, [onLongPress]);
  
  // Handle play/pause
  const handlePlayPause = useCallback(() => {
    setIsPlaying(!isPlaying);
    onPlayPause?.();
  }, [isPlaying, onPlayPause]);

  // Handle mute toggle
  const handleMuteToggle = useCallback(() => {
    onMuteToggle?.();
  }, [onMuteToggle]);
  
  // WebView event handlers
  const handleWebViewLoad = useCallback(() => {
    console.log('WebView loaded successfully for:', stream.user_login);
    setIsLoading(false);
    setError(null);
  }, [stream.user_login]);

  const handleWebViewError = useCallback((syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.log('WebView error for', stream.user_login, ':', nativeEvent);
    setError(`Failed to load stream: ${nativeEvent.description || 'Unknown error'}`);
    setIsLoading(false);
  }, [stream.user_login]);

  const handleWebViewLoadStart = useCallback(() => {
    console.log('WebView load started for:', stream.user_login);
    setIsLoading(true);
    setError(null);
  }, [stream.user_login]);

  const handleWebViewMessage = useCallback((event: any) => {
    console.log('WebView message:', event.nativeEvent.data);
  }, []);
  
  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (controlsTimer.current) {
        clearTimeout(controlsTimer.current);
      }
    };
  }, []);
  
  return (
    <Animated.View style={[styles.container, { width, height }, containerStyle]}>
      <TouchableOpacity
        style={styles.touchArea}
        onPress={handlePress}
        onLongPress={handleLongPress}
        activeOpacity={1}
      >
        {/* Twitch Embed Player */}
        <WebView
          ref={webViewRef}
          source={{ uri: embedUrl }}
          style={styles.video}
          onLoad={handleWebViewLoad}
          onError={handleWebViewError}
          onLoadStart={handleWebViewLoadStart}
          onMessage={handleWebViewMessage}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={false}
          scalesPageToFit={false}
          bounces={false}
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          originWhitelist={['https://*']}
          mixedContentMode={'compatibility'}
          allowsFullscreenVideo={false}
          allowsProtectedMedia={true}
          userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1"
        />
        
        {/* Loading Overlay */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={ModernTheme.colors.primary[500]} />
            <Text style={styles.loadingText}>Loading stream...</Text>
          </View>
        )}
        
        {/* Error Overlay */}
        {error && (
          <View style={styles.errorOverlay}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setError(null);
                setIsLoading(true);
              }}
            >
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Stream Info Overlay */}
        {!isLoading && !error && (
          <View style={styles.infoOverlay}>
            <LinearGradient
              colors={['rgba(0,0,0,0.8)', 'transparent']}
              style={styles.infoGradient}
            >
              <View style={styles.streamInfo}>
                <View style={styles.platformBadge}>
                  <Text style={styles.platformText}>TWITCH</Text>
                </View>
                <View style={styles.liveIndicator}>
                  <View style={[styles.liveDot, { backgroundColor: ModernTheme.colors.status.live }]} />
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
              </View>
              <Text style={styles.streamTitle} numberOfLines={1}>
                {stream.user_name}
              </Text>
              <Text style={styles.streamGame} numberOfLines={1}>
                {stream.game_name}
              </Text>
              {stream.viewer_count && (
                <View style={styles.viewerInfo}>
                  <Eye size={12} color={ModernTheme.colors.text.secondary} />
                  <Text style={styles.viewerCount}>
                    {stream.viewer_count.toLocaleString()} viewers
                  </Text>
                </View>
              )}
            </LinearGradient>
          </View>
        )}
        
        {/* Controls Overlay */}
        {showControls && !isLoading && !error && (
          <Animated.View style={[styles.controlsOverlay, controlsStyle]}>
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)']}
              style={styles.controlsGradient}
            >
              <View style={styles.controlsContainer}>
                <View style={styles.leftControls}>
                  <TouchableOpacity
                    style={styles.controlButton}
                    onPress={handlePlayPause}
                  >
                    <LinearGradient
                      colors={ModernTheme.colors.gradients.primary}
                      style={styles.controlButtonGradient}
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
                  >
                    <LinearGradient
                      colors={ModernTheme.colors.gradients.primary}
                      style={styles.controlButtonGradient}
                    >
                      {isMuted ? (
                        <VolumeX size={16} color="#fff" />
                      ) : (
                        <Volume2 size={16} color="#fff" />
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.rightControls}>
                  <TouchableOpacity style={styles.controlButton}>
                    <LinearGradient
                      colors={ModernTheme.colors.gradients.primary}
                      style={styles.controlButtonGradient}
                    >
                      <Settings size={16} color="#fff" />
                    </LinearGradient>
                  </TouchableOpacity>
                  
                  {onRemove && (
                    <TouchableOpacity
                      style={styles.controlButton}
                      onPress={() => onRemove()}
                    >
                      <LinearGradient
                        colors={ModernTheme.colors.gradients.danger}
                        style={styles.controlButtonGradient}
                      >
                        <X size={16} color="#fff" />
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
        )}
        
        {/* Active Stream Indicator */}
        {isActive && (
          <View style={styles.activeIndicator}>
            <LinearGradient
              colors={ModernTheme.colors.gradients.accent}
              style={styles.activeGradient}
            />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: ModernTheme.colors.background.secondary,
    borderRadius: ModernTheme.borderRadius.lg,
    overflow: 'hidden',
    margin: ModernTheme.spacing.xs,
    ...ModernTheme.shadows.md,
  },
  touchArea: {
    flex: 1,
    position: 'relative',
  },
  video: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: ModernTheme.colors.text.secondary,
    fontSize: ModernTheme.typography.sizes.sm,
    marginTop: ModernTheme.spacing.sm,
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: ModernTheme.spacing.md,
  },
  errorText: {
    color: ModernTheme.colors.text.error,
    fontSize: ModernTheme.typography.sizes.sm,
    textAlign: 'center',
    marginBottom: ModernTheme.spacing.md,
  },
  retryButton: {
    backgroundColor: ModernTheme.colors.primary[500],
    paddingHorizontal: ModernTheme.spacing.md,
    paddingVertical: ModernTheme.spacing.sm,
    borderRadius: ModernTheme.borderRadius.md,
  },
  retryText: {
    color: ModernTheme.colors.text.primary,
    fontSize: ModernTheme.typography.sizes.sm,
    fontWeight: ModernTheme.typography.weights.semibold,
  },
  infoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  infoGradient: {
    padding: ModernTheme.spacing.sm,
  },
  streamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ModernTheme.spacing.sm,
    marginBottom: ModernTheme.spacing.xs,
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: ModernTheme.spacing.sm,
    paddingVertical: ModernTheme.spacing.xs,
    borderRadius: ModernTheme.borderRadius.sm,
    gap: ModernTheme.spacing.xs,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveText: {
    color: ModernTheme.colors.text.primary,
    fontSize: 10,
    fontWeight: ModernTheme.typography.weights.semibold,
    letterSpacing: 0.5,
  },
  streamTitle: {
    color: ModernTheme.colors.text.primary,
    fontSize: ModernTheme.typography.sizes.sm,
    fontWeight: ModernTheme.typography.weights.semibold,
    marginBottom: 2,
  },
  streamGame: {
    color: ModernTheme.colors.text.accent,
    fontSize: ModernTheme.typography.sizes.xs,
    fontWeight: ModernTheme.typography.weights.medium,
  },
  viewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ModernTheme.spacing.xs,
    marginTop: ModernTheme.spacing.xs,
  },
  viewerCount: {
    color: ModernTheme.colors.text.secondary,
    fontSize: ModernTheme.typography.sizes.xs,
  },
  controlsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  controlsGradient: {
    padding: ModernTheme.spacing.sm,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftControls: {
    flexDirection: 'row',
    gap: ModernTheme.spacing.sm,
  },
  rightControls: {
    flexDirection: 'row',
    gap: ModernTheme.spacing.sm,
  },
  controlButton: {
    borderRadius: ModernTheme.borderRadius.md,
    overflow: 'hidden',
  },
  controlButtonGradient: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: ModernTheme.borderRadius.lg,
  },
  activeGradient: {
    flex: 1,
    borderRadius: ModernTheme.borderRadius.lg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
});

export default EnhancedVideoPlayer;