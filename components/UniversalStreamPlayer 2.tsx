import { LinearGradient } from 'expo-linear-gradient';
import {
  Volume2,
  VolumeX,
  X,
  Eye,
  ExternalLink,
  AlertCircle,
  Play,
  Pause,
  RotateCcw,
} from 'lucide-react-native';
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
import {
  UniversalStream,
  getPlatformColor,
  getPlatformIcon,
  getPlatformDisplayName,
  multiPlatformApi,
} from '@/services/multiPlatformStreamingApi';
import { ModernTheme } from '@/theme/modernTheme';

interface UniversalStreamPlayerProps {
  stream: UniversalStream;
  width: number;
  height: number;
  isActive?: boolean;
  isMuted?: boolean;
  isPlaying?: boolean;
  onPress?: () => void;
  onRemove?: () => void;
  onMuteToggle?: () => void;
  onPlayToggle?: () => void;
  showControls?: boolean;
  autoplay?: boolean;
}

export const UniversalStreamPlayer: React.FC<UniversalStreamPlayerProps> = ({
  stream,
  width,
  height,
  isActive = false,
  isMuted = true,
  isPlaying = true,
  onPress,
  onRemove,
  onMuteToggle,
  onPlayToggle,
  showControls = true,
  autoplay = true,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const webViewRef = useRef<WebView>(null);

  const platformColor = getPlatformColor(stream.platform);
  const platformIcon = getPlatformIcon(stream.platform);
  const platformName = getPlatformDisplayName(stream.platform);

  // Generate platform-specific embed HTML
  const getEmbedHtml = useCallback(() => {
    const embedUrl = multiPlatformApi.generateEmbedUrl(stream, {
      autoplay: autoplay && isPlaying,
      muted: isMuted,
    });

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>${platformName} Player</title>
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
            border-top: 2px solid ${platformColor};
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
            background: ${platformColor};
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

        .platform-indicator {
            position: absolute;
            top: 10px;
            left: 10px;
            background: ${platformColor};
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: bold;
            z-index: 50;
        }
    </style>
</head>
<body>
    <div class="player-container">
        <div class="loading" id="loading">
            <div class="spinner"></div>
            <div>Loading ${stream.streamerDisplayName}</div>
            <div style="font-size: 11px; opacity: 0.7; margin-top: 5px;">${platformName}</div>
        </div>
        
        <div class="error" id="error" style="display: none;">
            <div>Stream unavailable</div>
            <div style="font-size: 11px; margin: 5px 0;">Platform: ${platformName}</div>
            <button class="retry-btn" onclick="retryLoad()">Retry</button>
        </div>
        
        <div class="platform-indicator">
            ${platformIcon} ${platformName.toUpperCase()}
        </div>
        
        <iframe 
            id="stream-player"
            src="${embedUrl}"
            allowfullscreen="true"
            scrolling="no"
            frameborder="0"
            allow="autoplay; fullscreen; encrypted-media">
        </iframe>
    </div>
    
    <script>
        let loadTimeout;
        let hasLoaded = false;
        
        const iframe = document.getElementById('stream-player');
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
                    message: 'Stream failed to load',
                    platform: '${stream.platform}'
                }));
            }
        }
        
        function retryLoad() {
            if (error) error.style.display = 'none';
            if (loading) loading.style.display = 'block';
            hasLoaded = false;
            
            // Reload iframe with cache busting
            const currentSrc = iframe.src;
            const separator = currentSrc.includes('?') ? '&' : '?';
            iframe.src = currentSrc.split('&_retry')[0] + separator + '_retry=' + Date.now();
            
            // Reset timeout
            loadTimeout = setTimeout(() => {
                if (!hasLoaded) {
                    showError();
                }
            }, 20000);

            // Notify React Native about retry
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'retry',
                    platform: '${stream.platform}'
                }));
            }
        }
        
        // Set up load timeout (longer for some platforms)
        const timeoutDuration = ${stream.platform === 'youtube' ? '25000' : '15000'};
        loadTimeout = setTimeout(() => {
            if (!hasLoaded) {
                console.log('${platformName} player load timeout');
                showError();
            }
        }, timeoutDuration);
        
        // Listen for iframe load events
        iframe.addEventListener('load', function() {
            console.log('${platformName} iframe loaded');
            setTimeout(() => {
                hideLoading();
                
                // Notify React Native about successful load
                if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'loaded',
                        platform: '${stream.platform}',
                        streamer: '${stream.streamerName}'
                    }));
                }
            }, 3000); // Give more time for video to start
        });
        
        iframe.addEventListener('error', function() {
            console.log('${platformName} iframe error');
            showError();
        });
        
        // Handle touch events
        document.addEventListener('click', function(e) {
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'touch',
                    platform: '${stream.platform}'
                }));
            }
        });
        
        // Prevent context menu
        document.addEventListener('contextmenu', e => e.preventDefault());
        document.addEventListener('selectstart', e => e.preventDefault());
        
        // Platform-specific initialization
        ${
  stream.platform === 'youtube'
    ? `
        // YouTube-specific event handling
        window.addEventListener('message', function(event) {
            if (event.data && typeof event.data === 'string') {
                try {
                    const data = JSON.parse(event.data);
                    if (data.event === 'video-progress') {
                        hideLoading();
                    }
                } catch (e) {
                    // Ignore JSON parse errors
                }
            }
        });
        `
    : ''
}
        
        // Try to focus iframe for better interaction
        setTimeout(() => {
            if (iframe.contentWindow) {
                iframe.contentWindow.focus();
            }
        }, 4000);
    </script>
</body>
</html>`;
  }, [stream, isMuted, isPlaying, autoplay, platformColor, platformName, platformIcon]);

  // WebView event handlers
  const handleWebViewLoad = useCallback(() => {
    console.log(`✅ ${platformName} player WebView loaded:`, stream.streamerName);
  }, [stream.streamerName, platformName]);

  const handleWebViewError = useCallback(
    (syntheticEvent: any) => {
      const { nativeEvent } = syntheticEvent;
      console.error(`❌ ${platformName} player error:`, stream.streamerName, nativeEvent);
      setError(`Failed to load ${platformName} player`);
      setIsLoading(false);
    },
    [stream.streamerName, platformName]
  );

  const handleWebViewLoadStart = useCallback(() => {
    console.log(`🔄 ${platformName} player loading:`, stream.streamerName);
    setIsLoading(true);
    setError(null);
    setHasLoaded(false);
  }, [stream.streamerName, platformName]);

  // Handle WebView messages
  const handleWebViewMessage = useCallback(
    (event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        console.log(`${platformName} player message:`, data);

        switch (data.type) {
          case 'loaded':
            console.log(`✅ ${platformName} iframe loaded successfully:`, data.streamer);
            setIsLoading(false);
            setError(null);
            setHasLoaded(true);
            setRetryCount(0);
            break;
          case 'error':
            console.log(`❌ ${platformName} iframe error:`, data.message);
            setIsLoading(false);
            setError(data.message || `${platformName} stream unavailable`);
            break;
          case 'retry':
            console.log(`🔄 ${platformName} player retrying...`);
            setRetryCount(prev => prev + 1);
            break;
          case 'touch':
            onPress?.();
            break;
        }
      } catch (error) {
        console.log('WebView message parse error:', error);
      }
    },
    [onPress, platformName]
  );

  // Handle retry
  const handleRetry = useCallback(() => {
    setError(null);
    setIsLoading(true);
    setHasLoaded(false);
    setRetryCount(prev => prev + 1);
    webViewRef.current?.reload();
  }, []);

  // Handle external link
  const handleOpenExternal = useCallback(() => {
    Linking.openURL(stream.streamUrl).catch(err => {
      console.error(`Failed to open ${platformName} URL:`, err);
    });
  }, [stream.streamUrl, platformName]);

  // Auto-hide loading after extended timeout
  useEffect(() => {
    if (isLoading && !hasLoaded) {
      const timeout = setTimeout(
        () => {
          if (!hasLoaded) {
            setError(`Loading timeout - ${platformName} stream may be offline`);
            setIsLoading(false);
          }
        },
        stream.platform === 'youtube' ? 30000 : 25000
      ); // Longer timeout for YouTube

      return () => clearTimeout(timeout);
    }
  }, [isLoading, hasLoaded, stream.platform, platformName]);

  const embedHtml = getEmbedHtml();

  return (
    <View style={[styles.container, { width, height }]}>
      <TouchableOpacity
        style={styles.touchArea}
        onPress={error ? handleOpenExternal : onPress}
        activeOpacity={1}
      >
        {/* Universal Stream WebView */}
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
            <ActivityIndicator size="large" color={platformColor} />
            <Text style={styles.loadingText}>Loading {stream.streamerDisplayName}...</Text>
            <Text style={styles.loadingSubtext}>
              {platformName} • Please wait for video to start
            </Text>
            {retryCount > 0 && (
              <Text style={styles.retryCountText}>Retry attempt: {retryCount}</Text>
            )}
          </View>
        )}

        {/* Error Overlay */}
        {error && (
          <View style={styles.errorOverlay}>
            <AlertCircle size={32} color={ModernTheme.colors.text.error} />
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.errorPlatform}>Platform: {platformName}</Text>
            <View style={styles.errorButtons}>
              <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.platformButton, { backgroundColor: platformColor }]}
                onPress={handleOpenExternal}
              >
                <Text style={styles.platformText}>Open {platformName}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Stream Info Overlay */}
        {!error && (
          <View style={styles.infoOverlay}>
            <LinearGradient colors={['rgba(0,0,0,0.8)', 'transparent']} style={styles.infoGradient}>
              <View style={styles.streamInfo}>
                <View style={[styles.platformBadge, { backgroundColor: platformColor }]}>
                  <Text style={styles.platformBadgeText}>{platformIcon} LIVE</Text>
                </View>
                <View style={styles.viewerInfo}>
                  <Eye size={12} color={ModernTheme.colors.text.primary} />
                  <Text style={styles.viewerText}>
                    {stream.viewerCount?.toLocaleString() || '0'}
                  </Text>
                </View>
              </View>
              <Text style={styles.streamTitle} numberOfLines={1}>
                {stream.streamerDisplayName}
              </Text>
              <Text style={styles.streamGame} numberOfLines={1}>
                {stream.game} • {platformName}
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

                  {onPlayToggle && (
                    <TouchableOpacity style={styles.controlButton} onPress={onPlayToggle}>
                      {isPlaying ? (
                        <Pause size={16} color="#fff" />
                      ) : (
                        <Play size={16} color="#fff" />
                      )}
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity style={styles.controlButton} onPress={handleOpenExternal}>
                    <ExternalLink size={16} color="#fff" />
                  </TouchableOpacity>
                </View>

                <View style={styles.rightControls}>
                  {retryCount > 0 && (
                    <TouchableOpacity style={styles.controlButton} onPress={handleRetry}>
                      <RotateCcw size={16} color="#fff" />
                    </TouchableOpacity>
                  )}

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
        {isActive && <View style={[styles.activeIndicator, { borderColor: platformColor }]} />}

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
  retryCountText: {
    color: ModernTheme.colors.text.secondary,
    fontSize: ModernTheme.typography.sizes.xs,
    marginTop: ModernTheme.spacing.xs,
    opacity: 0.6,
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
    marginBottom: ModernTheme.spacing.xs,
    fontWeight: ModernTheme.typography.weights.semibold,
  } as TextStyle,
  errorPlatform: {
    color: ModernTheme.colors.text.secondary,
    fontSize: ModernTheme.typography.sizes.sm,
    textAlign: 'center',
    marginBottom: ModernTheme.spacing.md,
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
  platformButton: {
    paddingHorizontal: ModernTheme.spacing.md,
    paddingVertical: ModernTheme.spacing.sm,
    borderRadius: ModernTheme.borderRadius.md,
  } as ViewStyle,
  platformText: {
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
    paddingHorizontal: ModernTheme.spacing.sm,
    paddingVertical: ModernTheme.spacing.xs,
    borderRadius: ModernTheme.borderRadius.sm,
  } as ViewStyle,
  platformBadgeText: {
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
});

export default UniversalStreamPlayer;
