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
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Volume2,
  VolumeX,
  X,
  Eye,
  ExternalLink,
} from 'lucide-react-native';
import { TwitchStream } from '@/services/twitchApi';
import { ModernTheme } from '@/theme/modernTheme';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface TwitchPlayerWebViewProps {
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

export const TwitchPlayerWebView: React.FC<TwitchPlayerWebViewProps> = ({
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

  // Generate enhanced Twitch embed HTML
  const getTwitchEmbedHtml = useCallback(() => {
    return `
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
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .container {
            width: 100%;
            height: 100%;
            position: relative;
            background: #000;
        }
        .loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #fff;
            text-align: center;
            z-index: 10;
        }
        .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid #333;
            border-top: 3px solid #9146ff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 10px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .error {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #ff6b6b;
            text-align: center;
            z-index: 10;
            padding: 20px;
        }
        .retry-btn {
            background: #9146ff;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            margin-top: 10px;
            cursor: pointer;
        }
        #twitch-embed {
            width: 100%;
            height: 100%;
            border: none;
            background: #000;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="loading" id="loading">
            <div class="spinner"></div>
            <div>Loading ${stream.user_name}...</div>
        </div>
        
        <div class="error" id="error" style="display: none;">
            <div>Failed to load stream</div>
            <button class="retry-btn" onclick="retryLoad()">Retry</button>
        </div>
        
        <div id="twitch-embed"></div>
    </div>
    
    <script src="https://player.twitch.tv/js/embed/v1.js"></script>
    <script>
        let player = null;
        let retryCount = 0;
        const maxRetries = 3;
        
        function hideLoading() {
            document.getElementById('loading').style.display = 'none';
        }
        
        function showError(message) {
            hideLoading();
            const errorEl = document.getElementById('error');
            errorEl.style.display = 'block';
            errorEl.querySelector('div').textContent = message || 'Failed to load stream';
        }
        
        function retryLoad() {
            if (retryCount < maxRetries) {
                retryCount++;
                document.getElementById('error').style.display = 'none';
                document.getElementById('loading').style.display = 'block';
                initPlayer();
            }
        }
        
        function initPlayer() {
            try {
                // Clear existing player
                if (player) {
                    player = null;
                }
                
                const embed = document.getElementById('twitch-embed');
                embed.innerHTML = '';
                
                const options = {
                    width: '100%',
                    height: '100%',
                    channel: '${stream.user_login}',
                    muted: ${isMuted},
                    autoplay: true,
                    // Parent domains for mobile app
                    parent: [
                        'localhost',
                        '127.0.0.1',
                        'expo.dev',
                        'exp.host',
                        'expo.io',
                        'snack.expo.dev'
                    ]
                };
                
                player = new Twitch.Player('twitch-embed', options);
                
                // Set up event listeners
                player.addEventListener(Twitch.Player.READY, () => {
                    console.log('Twitch player ready');
                    hideLoading();
                    if (${isMuted}) {
                        player.setMuted(true);
                    }
                });
                
                player.addEventListener(Twitch.Player.PLAYING, () => {
                    console.log('Twitch player playing');
                    hideLoading();
                });
                
                player.addEventListener(Twitch.Player.OFFLINE, () => {
                    showError('Stream is offline');
                });
                
                player.addEventListener(Twitch.Player.PLAYBACK_BLOCKED, () => {
                    console.log('Playback blocked, trying to unmute and play');
                    player.setMuted(true);
                    player.play();
                });
                
                // Timeout fallback
                setTimeout(() => {
                    if (document.getElementById('loading').style.display !== 'none') {
                        showError('Loading timeout - Stream may be offline');
                    }
                }, 15000);
                
            } catch (error) {
                console.error('Player init error:', error);
                showError('Failed to initialize player');
            }
        }
        
        // Initialize player when page loads
        window.addEventListener('load', initPlayer);
        
        // Prevent context menu and text selection
        document.addEventListener('contextmenu', e => e.preventDefault());
        document.addEventListener('selectstart', e => e.preventDefault());
        
        // Handle mobile touch events
        let touchStartTime = 0;
        document.addEventListener('touchstart', (e) => {
            touchStartTime = Date.now();
        });
        
        document.addEventListener('touchend', (e) => {
            const touchDuration = Date.now() - touchStartTime;
            if (touchDuration < 200) {
                // Short tap - toggle controls
                window.ReactNativeWebView?.postMessage(JSON.stringify({
                    type: 'tap',
                    timestamp: Date.now()
                }));
            }
        });
        
        // Expose player controls to React Native
        window.toggleMute = function() {
            if (player) {
                const isMuted = player.getMuted();
                player.setMuted(!isMuted);
                return !isMuted;
            }
            return false;
        };
        
        window.getPlayerState = function() {
            if (player) {
                return {
                    muted: player.getMuted(),
                    volume: player.getVolume(),
                    paused: player.isPaused()
                };
            }
            return null;
        };
    </script>
</body>
</html>`;
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
            console.log('Open in Twitch:', stream.user_login);
          }
        },
        onRemove && {
          text: 'Remove',
          style: 'destructive',
          onPress: onRemove
        }
      ].filter(Boolean)
    );
    onLongPress?.();
  }, [stream, onRemove, onLongPress]);

  // WebView event handlers
  const handleWebViewLoad = useCallback(() => {
    console.log('✅ Twitch WebView loaded successfully:', stream.user_login);
    setIsLoading(false);
    setError(null);

    // Clear loading timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
  }, [stream.user_login]);

  const handleWebViewError = useCallback((syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('❌ Twitch WebView error:', stream.user_login, nativeEvent);

    let errorMessage = 'Failed to load stream';
    if (nativeEvent.description?.includes('network')) {
      errorMessage = 'Network error - Check connection';
    } else if (nativeEvent.description?.includes('SSL')) {
      errorMessage = 'SSL error - Try refreshing';
    }

    setError(errorMessage);
    setIsLoading(false);
  }, [stream.user_login]);

  const handleWebViewLoadStart = useCallback(() => {
    console.log('🔄 Twitch WebView loading started:', stream.user_login);
    setIsLoading(true);
    setError(null);

    // Set a timeout for loading
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    loadingTimeoutRef.current = setTimeout(() => {
      setError('Loading timeout - Try refreshing');
      setIsLoading(false);
    }, 20000); // 20 second timeout for Twitch
  }, [stream.user_login]);

  // Handle WebView messages
  const handleWebViewMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'tap') {
        handlePress();
      }
    } catch (error) {
      console.log('WebView message error:', error);
    }
  }, [handlePress]);

  // Handle retry
  const handleRetry = useCallback(() => {
    setError(null);
    setIsLoading(true);
    webViewRef.current?.reload();
  }, []);

  // Handle mute toggle
  const handleMuteToggle = useCallback(() => {
    // Send message to WebView to toggle mute
    webViewRef.current?.postMessage(JSON.stringify({
      action: 'toggleMute'
    }));
    onMuteToggle?.();
  }, [onMuteToggle]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  const embedHtml = getTwitchEmbedHtml();

  return (
    <Animated.View style={[styles.container, { width, height }, containerStyle]}>
      <TouchableOpacity
        style={styles.touchArea}
        onPress={handlePress}
        onLongPress={handleLongPress}
        activeOpacity={1}
      >
        {/* Enhanced Twitch WebView */}
        <WebView
          ref={webViewRef}
          source={{ html: embedHtml }}
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
          originWhitelist={['*']}
          mixedContentMode={'compatibility'}
          allowsFullscreenVideo={true}
          allowsProtectedMedia={true}
          thirdPartyCookiesEnabled={true}
          sharedCookiesEnabled={true}
          cacheEnabled={false}
          incognito={true}
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
            <LinearGradient
              colors={['rgba(0,0,0,0.8)', 'transparent']}
              style={styles.infoGradient}
            >
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
                    <TouchableOpacity
                      style={styles.controlButton}
                      onPress={onRemove}
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

export default TwitchPlayerWebView;
