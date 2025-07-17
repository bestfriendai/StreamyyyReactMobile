import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Dimensions, StatusBar, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { TwitchStream, twitchApi } from '@/services/twitchApi';
import { ModernTheme } from '@/theme/modernTheme';

// Import our enhanced components
import { ModernPlayerInterface } from './ModernPlayerInterface';
import { ModernStreamPlayer } from './ModernStreamPlayer';
import { StreamStateManager, StreamState, StreamError, ConnectionQuality } from './StreamStateManager';
import { GestureEnhancedPlayer, GestureConfig } from './GestureEnhancedPlayer';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface IntegratedStreamPlayerProps {
  stream: TwitchStream;
  onRemove: (streamId: string) => void;
  width?: number;
  height?: number;
  isActive?: boolean;
  onToggleActive?: () => void;
  showAdvancedControls?: boolean;
  enableGestures?: boolean;
  autoHideControls?: boolean;
  customControlsTimeout?: number;
}

export const IntegratedStreamPlayer: React.FC<IntegratedStreamPlayerProps> = ({
  stream,
  onRemove,
  width,
  height,
  isActive = false,
  onToggleActive,
  showAdvancedControls = true,
  enableGestures = true,
  autoHideControls = true,
  customControlsTimeout = 4000,
}) => {
  // Player state
  const [playerState, setPlayerState] = useState({
    isPlaying: true,
    isMuted: false,
    volume: 1.0,
    playbackRate: 1.0,
    isFullscreen: false,
    quality: '720p',
    buffering: false,
    currentTime: 0,
    duration: 0,
  });

  // Stream state
  const [streamState, setStreamState] = useState<StreamState>('loading');
  const [streamError, setStreamError] = useState<StreamError | undefined>();
  const [connectionQuality, setConnectionQuality] = useState<ConnectionQuality>('good');
  const [retryCount, setRetryCount] = useState(0);

  // UI state
  const [showControls, setShowControls] = useState(false);
  const [brightness, setBrightness] = useState(1.0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Stream stats
  const [streamStats, setStreamStats] = useState({
    viewerCount: stream.viewer_count || 0,
    chatActivity: 'medium' as const,
    streamQuality: '720p',
    uptime: '2:30:45',
    likes: 1250,
    follows: 890,
  });

  // Refs
  const webViewRef = useRef<WebView>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const screenWidth = Dimensions.get('window').width;
  const viewerWidth = width || screenWidth - 32;
  const viewerHeight = height || (viewerWidth * 9) / 16;

  // Gesture configuration
  const gestureConfig: Partial<GestureConfig> = {
    swipeThreshold: 50,
    tapThreshold: 250,
    longPressThreshold: 800,
    doubleTapDelay: 300,
    vibrationEnabled: true,
    zoneBasedGestures: true,
    showFeedback: true,
    sensitivityLevel: 'medium',
  };

  // Generate embed URL
  const embedUrl =
    twitchApi.generateEmbedUrl(stream.user_login) +
    (playerState.isMuted ? '&muted=true' : '&muted=false');

  // Initialize component
  useEffect(() => {
    setStreamState('loading');

    // Simulate connection quality monitoring
    const qualityInterval = setInterval(() => {
      const qualities: ConnectionQuality[] = ['excellent', 'good', 'poor'];
      const randomQuality = qualities[Math.floor(Math.random() * qualities.length)];
      setConnectionQuality(randomQuality);
    }, 10000);

    // Simulate viewer count updates
    const viewerInterval = setInterval(() => {
      setStreamStats(prev => ({
        ...prev,
        viewerCount: Math.max(0, prev.viewerCount + Math.floor(Math.random() * 100) - 50),
      }));
    }, 30000);

    return () => {
      clearInterval(qualityInterval);
      clearInterval(viewerInterval);
    };
  }, []);

  // Auto-hide controls
  useEffect(() => {
    if (showControls && autoHideControls) {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }

      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, customControlsTimeout);
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControls, autoHideControls, customControlsTimeout]);

  // WebView event handlers
  const handleWebViewLoadStart = useCallback(() => {
    setStreamState('loading');
    setStreamError(undefined);
  }, []);

  const handleWebViewLoad = useCallback(() => {
    setStreamState('playing');
    setStreamError(undefined);
    setRetryCount(0);
  }, []);

  const handleWebViewError = useCallback((error: any) => {
    console.error('WebView error:', error);
    setStreamState('error');
    setStreamError({
      type: 'network',
      message: 'Failed to load stream',
      code: error.nativeEvent?.code || 'UNKNOWN',
      retryable: true,
      retryDelay: 2000,
    });
  }, []);

  // Player control handlers
  const handlePlayPause = useCallback(() => {
    setPlayerState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));

    if (playerState.isPlaying) {
      setStreamState('paused');
    } else {
      setStreamState('playing');
    }
  }, [playerState.isPlaying]);

  const handleMuteToggle = useCallback(() => {
    setPlayerState(prev => ({ ...prev, isMuted: !prev.isMuted }));
  }, []);

  const handleVolumeChange = useCallback((volume: number) => {
    setPlayerState(prev => ({
      ...prev,
      volume: Math.max(0, Math.min(1, volume)),
      isMuted: volume === 0,
    }));
  }, []);

  const handleBrightnessChange = useCallback((brightness: number) => {
    setBrightness(Math.max(0, Math.min(1, brightness)));
  }, []);

  const handleSeek = useCallback((seconds: number) => {
    setPlayerState(prev => ({
      ...prev,
      currentTime: Math.max(0, Math.min(prev.duration, prev.currentTime + seconds)),
    }));
  }, []);

  const handleDoubleTapSeek = useCallback(
    (direction: 'forward' | 'backward') => {
      const seekAmount = direction === 'forward' ? 10 : -10;
      handleSeek(seekAmount);
    },
    [handleSeek]
  );

  const handleFullscreenToggle = useCallback(() => {
    setPlayerState(prev => ({ ...prev, isFullscreen: !prev.isFullscreen }));
  }, []);

  const handleShowControls = useCallback(() => {
    setShowControls(true);
    onToggleActive?.();
  }, [onToggleActive]);

  const handleHideControls = useCallback(() => {
    setShowControls(false);
  }, []);

  const handlePlaybackRateChange = useCallback((rate: number) => {
    setPlayerState(prev => ({ ...prev, playbackRate: rate }));
  }, []);

  const handleQualityChange = useCallback((quality: string) => {
    setPlayerState(prev => ({ ...prev, quality }));
    setStreamState('buffering');

    // Simulate quality change loading
    setTimeout(() => {
      setStreamState('playing');
    }, 1500);
  }, []);

  const handleShare = useCallback(() => {
    // Implement share functionality
    console.log('Sharing stream:', stream.user_name);
  }, [stream.user_name]);

  const handleLike = useCallback(() => {
    setIsFavorite(!isFavorite);
    setStreamStats(prev => ({
      ...prev,
      likes: prev.likes + (isFavorite ? -1 : 1),
    }));
  }, [isFavorite]);

  const handleFollow = useCallback(() => {
    // Implement follow functionality
    console.log('Following streamer:', stream.user_name);
  }, [stream.user_name]);

  const handleBookmark = useCallback(() => {
    setIsBookmarked(!isBookmarked);
  }, [isBookmarked]);

  const handleOpenChat = useCallback(() => {
    // Implement chat functionality
    console.log('Opening chat for:', stream.user_name);
  }, [stream.user_name]);

  const handleOpenSettings = useCallback(() => {
    // Implement settings functionality
    console.log('Opening settings for:', stream.user_name);
  }, [stream.user_name]);

  const handleRetry = useCallback(() => {
    if (retryCount < 3) {
      setRetryCount(prev => prev + 1);
      setStreamState('loading');
      setStreamError(undefined);
      webViewRef.current?.reload();
    }
  }, [retryCount]);

  const handleStateManagerDismiss = useCallback(() => {
    if (streamState === 'error') {
      onRemove(stream.id);
    }
  }, [streamState, onRemove, stream.id]);

  // Generate enhanced Twitch embed HTML with better error handling
  const generateEmbedHtml = useCallback(() => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Enhanced Twitch Player</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { 
            width: 100%; 
            height: 100%; 
            background: #0e0e10; 
            overflow: hidden;
            font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif;
        }
        .container { width: 100%; height: 100%; position: relative; }
        .loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #8B5CF6;
            font-size: 14px;
            z-index: 100;
        }
        iframe { 
            width: 100% !important; 
            height: 100% !important; 
            border: none !important;
            background: #0e0e10;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="loading" id="loading">Loading ${stream.user_name}...</div>
        <iframe
            src="${embedUrl}"
            frameborder="0"
            allowfullscreen="false"
            scrolling="no"
            allow="autoplay; encrypted-media">
        </iframe>
    </div>
    <script>
        const iframe = document.querySelector('iframe');
        const loading = document.getElementById('loading');
        
        // Hide loading when iframe loads
        iframe.addEventListener('load', function() {
            if (loading) loading.style.display = 'none';
            
            // Notify React Native
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'loaded',
                    streamer: '${stream.user_name}'
                }));
            }
        });
        
        iframe.addEventListener('error', function() {
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'error',
                    message: 'Failed to load stream'
                }));
            }
        });
        
        // Handle player state changes
        window.addEventListener('message', function(event) {
            try {
                const data = JSON.parse(event.data);
                if (data.action === 'play' || data.action === 'pause') {
                    if (window.ReactNativeWebView) {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'playstate',
                            playing: data.action === 'play'
                        }));
                    }
                }
            } catch (e) {
                // Ignore parsing errors
            }
        });
        
        // Prevent fullscreen
        document.addEventListener('fullscreenchange', function() {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            }
        });
    </script>
</body>
</html>`;
  }, [embedUrl, stream.user_name]);

  const handleWebViewMessage = useCallback(
    (event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);

      switch (data.type) {
          case 'loaded':
            handleWebViewLoad();
            break;
          case 'error':
            handleWebViewError({ nativeEvent: { message: data.message } });
            break;
          case 'playstate':
            setPlayerState(prev => ({ ...prev, isPlaying: data.playing }));
            break;
        }
      } catch (error) {
        console.log('WebView message parse error:', error);
      }
    },
    [handleWebViewLoad, handleWebViewError]
  );

  return (
    <View style={[styles.container, { width: viewerWidth, height: viewerHeight }]}>
      <GestureEnhancedPlayer
        isPlaying={playerState.isPlaying}
        volume={playerState.volume}
        brightness={brightness}
        onPlayPause={handlePlayPause}
        onVolumeChange={handleVolumeChange}
        onBrightnessChange={handleBrightnessChange}
        onSeek={handleSeek}
        onFullscreenToggle={handleFullscreenToggle}
        onShowControls={handleShowControls}
        onHideControls={handleHideControls}
        onDoubleTapSeek={handleDoubleTapSeek}
        config={gestureConfig}
        enabled={enableGestures}
      >
        {/* Main WebView */}
        <WebView
          ref={webViewRef}
          source={{ html: generateEmbedHtml() }}
          style={styles.webview}
          onLoadStart={handleWebViewLoadStart}
          onLoad={handleWebViewLoad}
          onError={handleWebViewError}
          onMessage={handleWebViewMessage}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          scrollEnabled={false}
          bounces={false}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState={false}
          mixedContentMode="compatibility"
          userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1"
        />

        {/* Stream State Manager - handles loading, error, buffering states */}
        <StreamStateManager
          state={streamState}
          error={streamError}
          connectionQuality={connectionQuality}
          retryCount={retryCount}
          maxRetries={3}
          streamName={stream.user_name}
          platform="Twitch"
          onRetry={handleRetry}
          onDismiss={handleStateManagerDismiss}
          onOpenSettings={handleOpenSettings}
          showDetails
          loadingProgress={0}
        />

        {/* Modern Player Interface - advanced controls and UI */}
        {showControls && streamState === 'playing' && (
          <ModernPlayerInterface
            playerState={playerState}
            streamStats={streamStats}
            streamTitle={stream.title || `${stream.user_name}'s Stream`}
            streamerName={stream.user_name}
            gameName={stream.game_name || 'Just Chatting'}
            onPlayPause={handlePlayPause}
            onMuteToggle={handleMuteToggle}
            onVolumeChange={handleVolumeChange}
            onSkipForward={() => handleDoubleTapSeek('forward')}
            onSkipBack={() => handleDoubleTapSeek('backward')}
            onPlaybackRateChange={handlePlaybackRateChange}
            onQualityChange={handleQualityChange}
            onFullscreenToggle={handleFullscreenToggle}
            onShare={handleShare}
            onLike={handleLike}
            onFollow={handleFollow}
            onBookmark={handleBookmark}
            onOpenChat={handleOpenChat}
            onOpenSettings={handleOpenSettings}
            visible={showControls}
            compact={false}
            theme="dark"
            platform="twitch"
          />
        )}

        {/* Active indicator */}
        {isActive && (
          <View style={[styles.activeIndicator, { borderColor: ModernTheme.colors.twitch }]} />
        )}

        {/* Connection quality indicator */}
        <View style={styles.connectionIndicator}>
          <View
            style={[
              styles.connectionDot,
              {
                backgroundColor:
                  connectionQuality === 'excellent'
                    ? ModernTheme.colors.success[500]
                  connectionQuality === 'good' ? ModernTheme.colors.success[400] :
                    connectionQuality === 'poor' ? ModernTheme.colors.warning :
                      ModernTheme.colors.error[500]
              },
            ]}
          />
        </View>
      </GestureEnhancedPlayer>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: ModernTheme.colors.background.secondary,
    borderRadius: ModernTheme.borderRadius.xl,
    overflow: 'hidden',
    margin: ModernTheme.spacing.sm,
    ...ModernTheme.shadows.lg,
  },
  webview: {
    flex: 1,
    backgroundColor: '#0e0e10',
  },
  activeIndicator: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: ModernTheme.borderRadius.xl + 3,
    borderWidth: 3,
  },
  connectionIndicator: {
    position: 'absolute',
    top: ModernTheme.spacing.sm,
    right: ModernTheme.spacing.sm,
    zIndex: 1000,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
});

export default IntegratedStreamPlayer;
