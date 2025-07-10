import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  Linking,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Volume2,
  VolumeX,
  X,
  Eye,
  ExternalLink,
  Play,
} from 'lucide-react-native';
import { TwitchStream } from '@/services/twitchApi';
import { ModernTheme } from '@/theme/modernTheme';

interface ImprovedTwitchPlayerProps {
  stream: TwitchStream;
  width: number;
  height: number;
  isActive?: boolean;
  isMuted?: boolean;
  onPress?: () => void;
  onRemove?: () => void;
  onMuteToggle?: () => void;
  showControls?: boolean;
}

export const ImprovedTwitchPlayer: React.FC<ImprovedTwitchPlayerProps> = ({
  stream,
  width,
  height,
  isActive = false,
  isMuted = true,
  onPress,
  onRemove,
  onMuteToggle,
  showControls = true,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPlaceholder, setShowPlaceholder] = useState(false);
  const webViewRef = useRef<WebView>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Generate enhanced Twitch embed HTML using direct Twitch Player API
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
            margin: 10px 5px;
            cursor: pointer;
        }
        .twitch-btn {
            background: #9146ff;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            margin: 10px 5px;
            cursor: pointer;
        }
        #twitch-embed {
            width: 100%;
            height: 100%;
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
            <div>Stream not available</div>
            <div>
                <button class="retry-btn" onclick="retryLoad()">Retry</button>
                <button class="twitch-btn" onclick="openTwitch()">Open in Twitch</button>
            </div>
        </div>
        
        <div id="twitch-embed"></div>
    </div>
    
    <script src="https://player.twitch.tv/js/embed/v1.js"></script>
    <script>
        let player = null;
        let isPlayerReady = false;
        let retryCount = 0;
        const maxRetries = 3;
        
        function hideLoading() {
            document.getElementById('loading').style.display = 'none';
        }
        
        function showError(message) {
            hideLoading();
            const errorEl = document.getElementById('error');
            errorEl.style.display = 'block';
            if (message) {
                errorEl.querySelector('div').textContent = message;
            }
        }
        
        function retryLoad() {
            if (retryCount < maxRetries) {
                retryCount++;
                document.getElementById('error').style.display = 'none';
                document.getElementById('loading').style.display = 'block';
                initPlayer();
            } else {
                showError('Max retries reached - Stream may be offline');
            }
        }
        
        function openTwitch() {
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'open_twitch',
                    channel: '${stream.user_login}',
                    url: 'https://twitch.tv/${stream.user_login}'
                }));
            }
        }
        
        function initPlayer() {
            try {
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
                    controls: false,
                    time: '0s',
                    parent: [
                        'localhost',
                        '127.0.0.1',
                        'expo.dev',
                        'exp.host',
                        'expo.io',
                        'snack.expo.dev',
                        'reactnative.dev'
                    ]
                };
                
                console.log('Initializing Twitch player with options:', options);
                
                // Use setTimeout to ensure DOM is ready
                setTimeout(() => {
                    try {
                        player = new Twitch.Player('twitch-embed', options);
                        
                        player.addEventListener(Twitch.Player.READY, () => {
                            console.log('✅ Twitch player ready');
                            isPlayerReady = true;
                            hideLoading();
                            
                            if (${isMuted}) {
                                player.setMuted(true);
                            }
                            
                            // Notify React Native
                            if (window.ReactNativeWebView) {
                                window.ReactNativeWebView.postMessage(JSON.stringify({
                                    type: 'player_ready',
                                    channel: '${stream.user_login}'
                                }));
                            }
                        });
                        
                        player.addEventListener(Twitch.Player.PLAYING, () => {
                            console.log('🎥 Twitch player playing');
                            hideLoading();
                            
                            if (window.ReactNativeWebView) {
                                window.ReactNativeWebView.postMessage(JSON.stringify({
                                    type: 'playing',
                                    channel: '${stream.user_login}'
                                }));
                            }
                        });
                        
                        player.addEventListener(Twitch.Player.OFFLINE, () => {
                            console.log('❌ Stream is offline');
                            showError('${stream.user_name} is currently offline');
                            
                            if (window.ReactNativeWebView) {
                                window.ReactNativeWebView.postMessage(JSON.stringify({
                                    type: 'offline',
                                    channel: '${stream.user_login}'
                                }));
                            }
                        });
                        
                        player.addEventListener(Twitch.Player.PLAYBACK_BLOCKED, () => {
                            console.log('⚠️ Playback blocked, trying to fix...');
                            player.setMuted(true);
                            setTimeout(() => {
                                if (player && isPlayerReady) {
                                    player.play();
                                }
                            }, 500);
                        });
                        
                        player.addEventListener(Twitch.Player.PAUSE, () => {
                            console.log('⏸️ Player paused');
                        });
                        
                        player.addEventListener(Twitch.Player.PLAY, () => {
                            console.log('▶️ Player play event');
                        });
                        
                    } catch (playerError) {
                        console.error('Failed to create Twitch player:', playerError);
                        showError('Failed to initialize player');
                    }
                }, 100);
                
                // Fallback timeout for loading
                setTimeout(() => {
                    if (!isPlayerReady) {
                        console.log('⏰ Player initialization timeout');
                        showError('Loading timeout - Stream may be offline');
                    }
                }, 15000);
                
            } catch (error) {
                console.error('Error in initPlayer:', error);
                showError('Failed to load player');
            }
        }
        
        // Initialize when DOM and Twitch Player API are ready
        function waitForTwitchAPI() {
            if (typeof Twitch !== 'undefined' && Twitch.Player) {
                console.log('Twitch API ready, initializing player');
                initPlayer();
            } else {
                console.log('Waiting for Twitch API...');
                setTimeout(waitForTwitchAPI, 100);
            }
        }
        
        // Start initialization
        window.addEventListener('load', waitForTwitchAPI);
        
        // Expose player controls to React Native
        window.toggleMute = function() {
            if (player && isPlayerReady) {
                try {
                    const currentMuted = player.getMuted();
                    player.setMuted(!currentMuted);
                    return !currentMuted;
                } catch (e) {
                    console.error('Failed to toggle mute:', e);
                    return false;
                }
            }
            return false;
        };
        
        window.setMuted = function(muted) {
            if (player && isPlayerReady) {
                try {
                    player.setMuted(muted);
                    return true;
                } catch (e) {
                    console.error('Failed to set mute:', e);
                    return false;
                }
            }
            return false;
        };
        
        window.getPlayerState = function() {
            if (player && isPlayerReady) {
                try {
                    return {
                        muted: player.getMuted(),
                        volume: player.getVolume(),
                        paused: player.isPaused(),
                        ready: isPlayerReady
                    };
                } catch (e) {
                    console.error('Failed to get player state:', e);
                    return null;
                }
            }
            return { ready: false };
        };
        
        // Handle messages from React Native
        document.addEventListener('message', function(event) {
            try {
                const data = JSON.parse(event.data);
                if (data.action === 'toggleMute') {
                    toggleMute();
                } else if (data.action === 'setMuted') {
                    setMuted(data.muted);
                }
            } catch (e) {
                console.log('Error handling message from React Native:', e);
            }
        });
        
        // Handle touch events for React Native
        document.addEventListener('touchstart', (e) => {
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'touch',
                    channel: '${stream.user_login}'
                }));
            }
        });
        
        // Prevent context menu
        document.addEventListener('contextmenu', e => e.preventDefault());
        document.addEventListener('selectstart', e => e.preventDefault());
    </script>
</body>
</html>`;
  }, [stream.user_login, stream.user_name, stream.game_name, stream.viewer_count, isMuted]);

  // WebView event handlers
  const handleWebViewLoad = useCallback(() => {
    console.log('✅ Improved Twitch player loaded:', stream.user_login);
  }, [stream.user_login]);

  const handleWebViewError = useCallback((syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('❌ Improved Twitch player error:', stream.user_login, nativeEvent);
    setError('Failed to load stream');
    setIsLoading(false);
    setShowPlaceholder(true);
  }, [stream.user_login]);

  const handleWebViewLoadStart = useCallback(() => {
    console.log('🔄 Improved Twitch player loading:', stream.user_login);
    setIsLoading(true);
    setError(null);
    setShowPlaceholder(false);
  }, [stream.user_login]);

  // Handle WebView messages
  const handleWebViewMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('Received WebView message:', data);
      
      switch (data.type) {
        case 'player_ready':
          console.log('✅ Player ready for:', data.channel);
          setIsLoading(false);
          setError(null);
          setShowPlaceholder(false);
          break;
        case 'playing':
          console.log('🎥 Player playing:', data.channel);
          setIsLoading(false);
          setError(null);
          setShowPlaceholder(false);
          break;
        case 'offline':
          console.log('❌ Stream offline:', data.channel);
          setIsLoading(false);
          setError(`${stream.user_name} is currently offline`);
          setShowPlaceholder(false);
          break;
        case 'error':
          console.log('❌ Player error:', data.channel, data.message);
          setIsLoading(false);
          setError(data.message || 'Failed to load stream');
          setShowPlaceholder(false);
          break;
        case 'open_twitch':
          // Open Twitch in external app/browser
          Linking.openURL(data.url).catch(err => {
            console.error('Failed to open Twitch URL:', err);
          });
          break;
        case 'touch':
          onPress?.();
          break;
      }
    } catch (error) {
      console.log('WebView message error:', error);
    }
  }, [onPress, stream.user_name]);

  // Handle retry
  const handleRetry = useCallback(() => {
    setError(null);
    setIsLoading(true);
    setShowPlaceholder(false);
    webViewRef.current?.reload();
  }, []);

  // Handle mute toggle
  const handleMuteToggle = useCallback(() => {
    // Send command to WebView to toggle mute
    webViewRef.current?.postMessage(JSON.stringify({
      action: 'toggleMute'
    }));
    onMuteToggle?.();
  }, [onMuteToggle]);

  // Handle external link
  const handleOpenExternal = useCallback(() => {
    const twitchUrl = `https://twitch.tv/${stream.user_login}`;
    Linking.openURL(twitchUrl).catch(err => {
      console.error('Failed to open Twitch URL:', err);
    });
  }, [stream.user_login]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  const embedHtml = getTwitchEmbedHtml();

  return (
    <View style={[styles.container, { width, height }]}>
      <TouchableOpacity
        style={styles.touchArea}
        onPress={onPress}
        activeOpacity={1}
      >
        {/* Improved Twitch WebView */}
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
        {isLoading && !showPlaceholder && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={ModernTheme.colors.primary[500]} />
            <Text style={styles.loadingText}>Loading {stream.user_name}...</Text>
          </View>
        )}

        {/* Error Overlay */}
        {error && !showPlaceholder && (
          <View style={styles.errorOverlay}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Stream Info Overlay (always visible) */}
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

        {/* Controls */}
        {showControls && (
          <View style={styles.controlsOverlay}>
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
                    {isMuted ? (
                      <VolumeX size={16} color="#fff" />
                    ) : (
                      <Volume2 size={16} color="#fff" />
                    )}
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.controlButton}
                    onPress={handleOpenExternal}
                  >
                    <ExternalLink size={16} color="#fff" />
                  </TouchableOpacity>
                </View>

                <View style={styles.rightControls}>
                  {onRemove && (
                    <TouchableOpacity
                      style={[styles.controlButton, styles.removeButton]}
                      onPress={onRemove}
                    >
                      <X size={16} color="#fff" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Active Stream Indicator */}
        {isActive && <View style={styles.activeIndicator} />}
      </TouchableOpacity>
    </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  } as ViewStyle,
  removeButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.6)',
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
});

export default ImprovedTwitchPlayer;
