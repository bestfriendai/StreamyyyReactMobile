import { LinearGradient } from 'expo-linear-gradient';
import { Play, Pause, Volume2, VolumeX, X, Eye, ExternalLink } from 'lucide-react-native';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { WebView } from 'react-native-webview';
import { TwitchStream } from '@/services/twitchApi';
import { ModernTheme } from '@/theme/modernTheme';

interface FixedVideoPlayerProps {
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
}

export const FixedVideoPlayer: React.FC<FixedVideoPlayerProps> = ({
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
}) => {
  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [controlsVisible, setControlsVisible] = useState(false);
  const webViewRef = useRef<WebView>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Generate proper Twitch embed URL with comprehensive mobile support
  const getTwitchEmbedUrl = useCallback(() => {
    // For mobile apps, we need to use a different approach
    // Create an HTML page that embeds the Twitch player
    const embedHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        html, body {
            width: 100%;
            height: 100%;
            background: #000;
            overflow: hidden;
        }
        #twitch-embed {
            width: 100%;
            height: 100%;
            border: none;
        }
        .loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #fff;
            font-family: Arial, sans-serif;
        }
    </style>
</head>
<body>
    <div class="loading" id="loading">Loading ${stream.user_name}...</div>
    <iframe
        id="twitch-embed"
        src="https://player.twitch.tv/?channel=${stream.user_login}&parent=localhost&parent=127.0.0.1&parent=expo.dev&parent=exp.host&parent=expo.io&parent=snack.expo.dev&parent=reactnative.dev&parent=facebook.github.io&muted=${isMuted}&autoplay=true&controls=false"
        allowfullscreen
        style="display: none;">
    </iframe>

    <script>
        const iframe = document.getElementById('twitch-embed');
        const loading = document.getElementById('loading');

        // Show iframe after a short delay
        setTimeout(() => {
            iframe.style.display = 'block';
            loading.style.display = 'none';
        }, 1000);

        // Handle iframe load
        iframe.onload = () => {
            loading.style.display = 'none';
            iframe.style.display = 'block';
        };

        // Handle errors
        iframe.onerror = () => {
            loading.innerHTML = 'Failed to load stream';
            loading.style.color = '#ff6b6b';
        };

        // Prevent context menu and selection
        document.addEventListener('contextmenu', e => e.preventDefault());
        document.addEventListener('selectstart', e => e.preventDefault());

        // Handle touch events for mobile
        document.addEventListener('touchstart', e => e.preventDefault());
    </script>
</body>
</html>`;

    // Convert HTML to data URL
    return `data:text/html;charset=utf-8,${encodeURIComponent(embedHtml)}`;
  }, [stream.user_login, stream.user_name, isMuted]);

  // Animation values
  const scale = useSharedValue(1);
  const controlsOpacity = useSharedValue(0);

  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const controlsStyle = useAnimatedStyle(() => ({
    opacity: controlsOpacity.value,
  }));

  // Handle press with animation
  const handlePress = useCallback(() => {
    scale.value = withSpring(0.98, { damping: 15 }, () => {
      scale.value = withSpring(1);
    });

    // Toggle controls visibility
    setControlsVisible(!controlsVisible);
    controlsOpacity.value = withTiming(controlsVisible ? 0 : 1, { duration: 200 });

    onPress?.();
  }, [controlsVisible, onPress]);

  // Handle long press
  const handleLongPress = useCallback(() => {
    Alert.alert(
      'Stream Options',
      `${stream.user_name} - ${stream.game_name}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open in Twitch',
          onPress: () => {
            // TODO: Open in Twitch app or browser
            console.log('Open in Twitch:', stream.user_login);
          },
        },
        onRemove && {
          text: 'Remove',
          style: 'destructive',
          onPress: onRemove,
        },
      ].filter(Boolean)
    );
    onLongPress?.();
  }, [stream, onRemove, onLongPress]);

  // WebView event handlers
  const handleWebViewLoad = useCallback(() => {
    console.log('✅ Stream loaded successfully:', stream.user_login);
    setIsLoading(false);
    setError(null);

    // Clear loading timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
  }, [stream.user_login]);

  const handleWebViewError = useCallback(
    (syntheticEvent: any) => {
      const { nativeEvent } = syntheticEvent;
      console.error('❌ Stream load error:', stream.user_login, nativeEvent);

      // Provide more specific error messages
      let errorMessage = 'Failed to load stream';
      if (nativeEvent.description?.includes('network')) {
        errorMessage = 'Network error - Check connection';
      } else if (nativeEvent.description?.includes('parent')) {
        errorMessage = 'Twitch embed error - Try refreshing';
      } else if (nativeEvent.code === -1009) {
        errorMessage = 'No internet connection';
      }

      setError(errorMessage);
      setIsLoading(false);
    },
    [stream.user_login]
  );

  const handleWebViewLoadStart = useCallback(() => {
    console.log('🔄 Stream loading started:', stream.user_login);
    setIsLoading(true);
    setError(null);

    // Set a timeout for loading
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    loadingTimeoutRef.current = setTimeout(() => {
      if (isLoading) {
        setError('Stream loading timeout - Try refreshing');
        setIsLoading(false);
      }
    }, 15000); // 15 second timeout
  }, [stream.user_login, isLoading]);

  // Handle retry
  const handleRetry = useCallback(() => {
    setError(null);
    setIsLoading(true);
    webViewRef.current?.reload();
  }, []);

  // Handle mute toggle
  const handleMuteToggle = useCallback(() => {
    onMuteToggle?.();
  }, [onMuteToggle]);

  const embedUrl = getTwitchEmbedUrl();

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
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
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState={false}
          scalesPageToFit={false}
          bounces={false}
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          originWhitelist={['https://*', 'http://*', 'data:']}
          mixedContentMode="compatibility"
          allowsFullscreenVideo={false}
          allowsProtectedMedia
          thirdPartyCookiesEnabled
          sharedCookiesEnabled
          cacheEnabled={false}
          incognito={false}
          userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1"
        />

        {/* Loading Overlay */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={ModernTheme.colors.primary[500]} />
            <Text style={styles.loadingText}>Loading {stream.user_name}...</Text>
          </View>
        )}

        {/* Error Overlay */}
        {error && (
          <View style={styles.errorOverlay}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Stream Info Overlay */}
        {!isLoading && !error && (
          <View style={styles.infoOverlay}>
            <LinearGradient colors={['rgba(0,0,0,0.8)', 'transparent']} style={styles.infoGradient}>
              <View style={styles.streamInfo}>
                <View style={styles.platformBadge}>
                  <Text style={styles.platformText}>LIVE</Text>
                </View>
                <View style={styles.viewerInfo}>
                  <Eye size={12} color={ModernTheme.colors.text.primary} />
                  <Text style={styles.viewerText}>
                    {stream.viewer_count?.toLocaleString() || '0'}
                  </Text>
                </View>
              </View>
              <Text style={styles.streamTitle} numberOfLines={1}>
                {stream.user_name}
              </Text>
              <Text style={styles.streamGame} numberOfLines={1}>
                {stream.game_name}
              </Text>
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
                  <TouchableOpacity style={styles.controlButton} onPress={handleMuteToggle}>
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
                  <TouchableOpacity
                    style={styles.controlButton}
                    onPress={() => console.log('Open external')}
                  >
                    <LinearGradient
                      colors={ModernTheme.colors.gradients.primary}
                      style={styles.controlButtonGradient}
                    >
                      <ExternalLink size={16} color="#fff" />
                    </LinearGradient>
                  </TouchableOpacity>

                  {onRemove && (
                    <TouchableOpacity style={styles.controlButton} onPress={onRemove}>
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
  } as ViewStyle,
  touchArea: {
    flex: 1,
    position: 'relative',
  } as ViewStyle,
  video: {
    flex: 1,
    backgroundColor: '#000',
  } as ViewStyle,
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  loadingText: {
    color: ModernTheme.colors.text.secondary,
    fontSize: ModernTheme.typography.sizes.sm,
    marginTop: ModernTheme.spacing.sm,
    fontWeight: ModernTheme.typography.weights.medium,
  } as TextStyle,
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: ModernTheme.spacing.md,
  } as ViewStyle,
  errorText: {
    color: ModernTheme.colors.text.error,
    fontSize: ModernTheme.typography.sizes.sm,
    textAlign: 'center',
    marginBottom: ModernTheme.spacing.md,
    fontWeight: ModernTheme.typography.weights.medium,
  } as TextStyle,
  retryButton: {
    backgroundColor: ModernTheme.colors.primary[500],
    paddingHorizontal: ModernTheme.spacing.md,
    paddingVertical: ModernTheme.spacing.sm,
    borderRadius: ModernTheme.borderRadius.md,
  } as ViewStyle,
  retryText: {
    color: ModernTheme.colors.text.primary,
    fontSize: ModernTheme.typography.sizes.sm,
    fontWeight: ModernTheme.typography.weights.semibold,
  } as TextStyle,
  infoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  } as ViewStyle,
  infoGradient: {
    padding: ModernTheme.spacing.sm,
  } as ViewStyle,
  streamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ModernTheme.spacing.sm,
    marginBottom: ModernTheme.spacing.xs,
  } as ViewStyle,
  platformBadge: {
    backgroundColor: ModernTheme.colors.status.live,
    paddingHorizontal: ModernTheme.spacing.sm,
    paddingVertical: ModernTheme.spacing.xs,
    borderRadius: ModernTheme.borderRadius.sm,
  } as ViewStyle,
  platformText: {
    color: ModernTheme.colors.text.primary,
    fontSize: 10,
    fontWeight: ModernTheme.typography.weights.bold,
    letterSpacing: 0.5,
  } as TextStyle,
  viewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: ModernTheme.spacing.sm,
    paddingVertical: ModernTheme.spacing.xs,
    borderRadius: ModernTheme.borderRadius.sm,
    gap: ModernTheme.spacing.xs,
  } as ViewStyle,
  viewerText: {
    color: ModernTheme.colors.text.primary,
    fontSize: 10,
    fontWeight: ModernTheme.typography.weights.semibold,
  } as TextStyle,
  streamTitle: {
    color: ModernTheme.colors.text.primary,
    fontSize: ModernTheme.typography.sizes.sm,
    fontWeight: ModernTheme.typography.weights.semibold,
    marginBottom: 2,
  } as TextStyle,
  streamGame: {
    color: ModernTheme.colors.text.accent,
    fontSize: ModernTheme.typography.sizes.xs,
    fontWeight: ModernTheme.typography.weights.medium,
  } as TextStyle,
  controlsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  } as ViewStyle,
  controlsGradient: {
    padding: ModernTheme.spacing.sm,
  } as ViewStyle,
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  leftControls: {
    flexDirection: 'row',
    gap: ModernTheme.spacing.sm,
  } as ViewStyle,
  rightControls: {
    flexDirection: 'row',
    gap: ModernTheme.spacing.sm,
  } as ViewStyle,
  controlButton: {
    borderRadius: ModernTheme.borderRadius.md,
    overflow: 'hidden',
  } as ViewStyle,
  controlButtonGradient: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  } as ViewStyle,
  activeIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: ModernTheme.borderRadius.lg,
    borderWidth: 3,
    borderColor: ModernTheme.colors.primary[500],
  } as ViewStyle,
  activeGradient: {
    flex: 1,
    borderRadius: ModernTheme.borderRadius.lg,
  } as ViewStyle,
});

export default FixedVideoPlayer;
