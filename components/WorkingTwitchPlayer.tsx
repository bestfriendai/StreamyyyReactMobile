import { LinearGradient } from 'expo-linear-gradient';
import { Volume2, VolumeX, X, Eye, ExternalLink, AlertCircle } from 'lucide-react-native';
import React, { useState, useRef, useCallback, useEffect } from 'react';
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
import { TwitchStream } from '@/services/twitchApi';
import { ModernTheme } from '@/theme/modernTheme';

interface WorkingTwitchPlayerProps {
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

export const WorkingTwitchPlayer: React.FC<WorkingTwitchPlayerProps> = ({
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
  const [hasLoaded, setHasLoaded] = useState(false);
  const webViewRef = useRef<WebView>(null);

  // Generate working Twitch embed HTML that actually plays video
  const getTwitchEmbedHtml = useCallback(() => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Twitch Player</title>
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
        
        body {
            position: relative;
        }
        
        .loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #fff;
            text-align: center;
            z-index: 100;
            font-size: 14px;
        }
        
        .spinner {
            width: 30px;
            height: 30px;
            border: 2px solid #333;
            border-top: 2px solid #9146ff;
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
            z-index: 100;
            padding: 20px;
            font-size: 14px;
        }
        
        .retry-btn {
            background: #9146ff;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            margin-top: 10px;
            cursor: pointer;
            font-size: 12px;
        }
        
        .player-container {
            width: 100%;
            height: 100%;
            position: relative;
        }
        
        iframe {
            width: 100%;
            height: 100%;
            border: none;
            background: #000;
        }
    </style>
</head>
<body>
    <div class="player-container">
        <div class="loading" id="loading">
            <div class="spinner"></div>
            <div>Loading ${stream.user_name}</div>
        </div>
        
        <div class="error" id="error" style="display: none;">
            <div>Stream unavailable</div>
            <button class="retry-btn" onclick="retryLoad()">Retry</button>
        </div>
        
        <iframe 
            id="twitch-player"
            src="https://player.twitch.tv/?channel=${stream.user_login}&parent=localhost&parent=127.0.0.1&parent=expo.dev&parent=exp.host&parent=snack.expo.dev&parent=reactnative.dev&muted=${isMuted}&autoplay=true&controls=true&time=0s"
            allowfullscreen="true"
            scrolling="no"
            frameborder="0"
            allow="autoplay; fullscreen">
        </iframe>
    </div>
    
    <script>
        let loadTimeout;
        let hasLoaded = false;
        
        const iframe = document.getElementById('twitch-player');
        const loading = document.getElementById('loading');
        const error = document.getElementById('error');
        
        function hideLoading() {
            if (loading) {
                loading.style.display = 'none';
            }
            hasLoaded = true;
            clearTimeout(loadTimeout);
        }
        
        function showError() {
            if (loading) loading.style.display = 'none';
            if (error) error.style.display = 'block';
            clearTimeout(loadTimeout);
            
            // Notify React Native about error
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'error',
                    message: 'Stream failed to load'
                }));
            }
        }
        
        function retryLoad() {
            if (error) error.style.display = 'none';
            if (loading) loading.style.display = 'block';
            hasLoaded = false;
            
            // Reload iframe with cache busting
            iframe.src = iframe.src.split('&_retry')[0] + '&_retry=' + Date.now();
            
            // Reset timeout
            loadTimeout = setTimeout(() => {
                if (!hasLoaded) {
                    showError();
                }
            }, 15000);
        }
        
        // Set up load timeout
        loadTimeout = setTimeout(() => {
            if (!hasLoaded) {
                console.log('Twitch player load timeout');
                showError();
            }
        }, 15000);
        
        // Listen for iframe load events
        iframe.addEventListener('load', function() {
            console.log('Twitch iframe loaded');
            setTimeout(() => {
                hideLoading();
                
                // Notify React Native about successful load
                if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'loaded',
                        channel: '${stream.user_login}'
                    }));
                }
            }, 2000); // Give it 2 seconds to actually start playing
        });
        
        iframe.addEventListener('error', function() {
            console.log('Twitch iframe error');
            showError();
        });
        
        // Handle touch events
        document.addEventListener('click', function(e) {
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'touch'
                }));
            }
        });
        
        // Prevent context menu
        document.addEventListener('contextmenu', e => e.preventDefault());
        document.addEventListener('selectstart', e => e.preventDefault());
        
        // Try to focus iframe for better interaction
        setTimeout(() => {
            if (iframe.contentWindow) {
                iframe.contentWindow.focus();
            }
        }, 3000);
    </script>
</body>
</html>`;
  }, [stream.user_login, stream.user_name, isMuted]);

  // WebView event handlers
  const handleWebViewLoad = useCallback(() => {
    console.log('✅ Working Twitch player WebView loaded:', stream.user_login);
    // Don't hide loading here - wait for iframe load message
  }, [stream.user_login]);

  const handleWebViewError = useCallback(
    (syntheticEvent: any) => {
      const { nativeEvent } = syntheticEvent;
      console.error('❌ Working Twitch player error:', stream.user_login, nativeEvent);
      setError('Failed to load player');
      setIsLoading(false);
    },
    [stream.user_login]
  );

  const handleWebViewLoadStart = useCallback(() => {
    console.log('🔄 Working Twitch player loading:', stream.user_login);
    setIsLoading(true);
    setError(null);
    setHasLoaded(false);
  }, [stream.user_login]);

  // Handle WebView messages
  const handleWebViewMessage = useCallback(
    (event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        console.log('Working Twitch player message:', data);

        switch (data.type) {
          case 'loaded':
            console.log('✅ Twitch iframe loaded successfully:', data.channel);
            setIsLoading(false);
            setError(null);
            setHasLoaded(true);
            break;
          case 'error':
            console.log('❌ Twitch iframe error:', data.message);
            setIsLoading(false);
            setError(data.message || 'Stream unavailable');
            break;
          case 'touch':
            onPress?.();
            break;
        }
      } catch (error) {
        console.log('WebView message parse error:', error);
      }
    },
    [onPress]
  );

  // Handle retry
  const handleRetry = useCallback(() => {
    setError(null);
    setIsLoading(true);
    setHasLoaded(false);
    webViewRef.current?.reload();
  }, []);

  // Handle external link
  const handleOpenExternal = useCallback(() => {
    const twitchUrl = `https://twitch.tv/${stream.user_login}`;
    Linking.openURL(twitchUrl).catch(err => {
      console.error('Failed to open Twitch URL:', err);
    });
  }, [stream.user_login]);

  // Auto-hide loading after extended timeout
  useEffect(() => {
    if (isLoading && !hasLoaded) {
      const timeout = setTimeout(() => {
        if (!hasLoaded) {
          setError('Loading timeout - stream may be offline');
          setIsLoading(false);
        }
      }, 20000); // 20 second timeout

      return () => clearTimeout(timeout);
    }
  }, [isLoading, hasLoaded]);

  const embedHtml = getTwitchEmbedHtml();

  return (
    <View style={[styles.container, { width, height }]}>
      <TouchableOpacity
        style={styles.touchArea}
        onPress={error ? handleOpenExternal : onPress}
        activeOpacity={1}
      >
        {/* Working Twitch WebView */}
        <WebView
          ref={webViewRef}
          source={{ html: embedHtml }}
          style={styles.video}
          onLoad={handleWebViewLoad}
          onError={handleWebViewError}
          onLoadStart={handleWebViewLoadStart}
          onMessage={handleWebViewMessage}
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
          originWhitelist={['*']}
          mixedContentMode="compatibility"
          allowsFullscreenVideo
          allowsProtectedMedia
          thirdPartyCookiesEnabled
          sharedCookiesEnabled
          cacheEnabled={false}
          incognito={false}
          userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1"
        />

        {/* Loading Overlay */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={ModernTheme.colors.primary[500]} />
            <Text style={styles.loadingText}>Loading {stream.user_name}...</Text>
            <Text style={styles.loadingSubtext}>Please wait for video to start</Text>
          </View>
        )}

        {/* Error Overlay */}
        {error && (
          <View style={styles.errorOverlay}>
            <AlertCircle size={32} color={ModernTheme.colors.text.error} />
            <Text style={styles.errorText}>{error}</Text>
            <View style={styles.errorButtons}>
              <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.twitchButton} onPress={handleOpenExternal}>
                <Text style={styles.twitchText}>Open Twitch</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Stream Info Overlay */}
        {!error && (
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

        {/* Controls */}
        {showControls && !error && (
          <View style={styles.controlsOverlay}>
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)']}
              style={styles.controlsGradient}
            >
              <View style={styles.controlsContainer}>
                <View style={styles.leftControls}>
                  <TouchableOpacity style={styles.controlButton} onPress={onMuteToggle}>
                    {isMuted ? (
                      <VolumeX size={16} color="#fff" />
                    ) : (
                      <Volume2 size={16} color="#fff" />
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.controlButton} onPress={handleOpenExternal}>
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

        {/* Status Indicator */}
        <View style={styles.statusIndicator}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: hasLoaded ? '#00ff00' : isLoading ? '#ffff00' : '#ff0000' },
            ]}
          />
        </View>
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
  loadingSubtext: {
    color: ModernTheme.colors.text.secondary,
    fontSize: ModernTheme.typography.sizes.xs,
    marginTop: ModernTheme.spacing.xs,
    opacity: 0.7,
    textAlign: 'center',
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
    fontSize: ModernTheme.typography.sizes.md,
    textAlign: 'center',
    marginTop: ModernTheme.spacing.sm,
    marginBottom: ModernTheme.spacing.md,
    fontWeight: ModernTheme.typography.weights.semibold,
  } as TextStyle,
  errorButtons: {
    flexDirection: 'row',
    gap: ModernTheme.spacing.sm,
  } as ViewStyle,
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
  twitchButton: {
    backgroundColor: '#9146ff',
    paddingHorizontal: ModernTheme.spacing.md,
    paddingVertical: ModernTheme.spacing.sm,
    borderRadius: ModernTheme.borderRadius.md,
  } as ViewStyle,
  twitchText: {
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
  statusIndicator: {
    position: 'absolute',
    top: ModernTheme.spacing.xs,
    right: ModernTheme.spacing.xs,
    zIndex: 1000,
  } as ViewStyle,
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  } as ViewStyle,
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: ModernTheme.colors.background.secondary,
    padding: ModernTheme.spacing.md,
  } as ViewStyle,
  placeholderText: {
    color: ModernTheme.colors.text.secondary,
    fontSize: ModernTheme.typography.sizes.sm,
    textAlign: 'center',
    marginBottom: ModernTheme.spacing.md,
  } as TextStyle,
  loadButton: {
    backgroundColor: ModernTheme.colors.primary[500],
    paddingHorizontal: ModernTheme.spacing.md,
    paddingVertical: ModernTheme.spacing.sm,
    borderRadius: ModernTheme.borderRadius.md,
  } as ViewStyle,
  loadButtonText: {
    color: ModernTheme.colors.text.primary,
    fontSize: ModernTheme.typography.sizes.sm,
    fontWeight: ModernTheme.typography.weights.semibold,
  } as TextStyle,
});

// Memoize the component for performance
export const WorkingTwitchPlayer = memo(WorkingTwitchPlayerComponent);

export default WorkingTwitchPlayer;
