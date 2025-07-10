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

interface AutoplayTwitchPlayerProps {
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

export const AutoplayTwitchPlayer: React.FC<AutoplayTwitchPlayerProps> = ({
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
  const [hasStarted, setHasStarted] = useState(false);
  const webViewRef = useRef<WebView>(null);

  // Generate autoplay-focused HTML that immediately starts the stream
  const getAutoplayHTML = useCallback(() => {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
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
        .container {
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
        .loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #fff;
            font-size: 14px;
            text-align: center;
            z-index: 10;
        }
        .spinner {
            width: 20px;
            height: 20px;
            border: 2px solid #333;
            border-top: 2px solid #9146ff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 8px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="loading" id="loading">
            <div class="spinner"></div>
            <div>Starting ${stream.user_name}...</div>
        </div>
        
        <iframe 
            id="twitch-iframe"
            src="https://player.twitch.tv/?channel=${stream.user_login}&parent=localhost&parent=127.0.0.1&parent=expo.dev&parent=exp.host&parent=snack.expo.dev&parent=reactnative.dev&muted=${isMuted}&autoplay=true&controls=false&time=0s&playsinline=1"
            allowfullscreen
            allow="autoplay; fullscreen; microphone; camera"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-presentation"
            style="display: none;">
        </iframe>
    </div>
    
    <script>
        const iframe = document.getElementById('twitch-iframe');
        const loading = document.getElementById('loading');
        let hasLoaded = false;
        
        // Function to show the iframe and hide loading
        function showStream() {
            if (loading) loading.style.display = 'none';
            if (iframe) iframe.style.display = 'block';
            hasLoaded = true;
            
            // Notify React Native that stream started
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'started',
                    channel: '${stream.user_login}'
                }));
            }
        }
        
        // Function to handle load timeout
        function handleTimeout() {
            if (!hasLoaded) {
                showStream(); // Show anyway after timeout
                console.log('Force showing stream after timeout');
            }
        }
        
        // Start showing the stream immediately after a short delay
        setTimeout(() => {
            showStream();
        }, 1500); // Show after 1.5 seconds regardless
        
        // Backup timeout
        setTimeout(handleTimeout, 5000);
        
        // Listen for iframe events
        iframe.addEventListener('load', function() {
            console.log('Twitch iframe loaded');
            showStream();
        });
        
        iframe.addEventListener('error', function() {
            console.log('Twitch iframe error');
            showStream(); // Still show in case of minor errors
        });
        
        // Handle touch events
        document.addEventListener('click', function() {
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'touch'
                }));
            }
        });
        
        // Prevent context menu
        document.addEventListener('contextmenu', e => e.preventDefault());
        document.addEventListener('selectstart', e => e.preventDefault());
        
        // Force iframe to be visible after DOM load
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(showStream, 2000);
        });
        
        // Immediate show as fallback
        window.addEventListener('load', function() {
            setTimeout(showStream, 1000);
        });
    </script>
</body>
</html>`;
  }, [stream.user_login, stream.user_name, isMuted]);

  // WebView handlers
  const handleWebViewLoad = useCallback(() => {
    console.log('✅ Autoplay Twitch player loaded:', stream.user_login);
    // Don't set loading false here - wait for the "started" message
  }, [stream.user_login]);

  const handleWebViewError = useCallback((syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('❌ Autoplay Twitch player error:', stream.user_login, nativeEvent);
    
    // Even on error, try to show the player
    setIsLoading(false);
    setHasStarted(true);
    setError(null); // Don't show error, let it try to play
  }, [stream.user_login]);

  const handleWebViewLoadStart = useCallback(() => {
    console.log('🔄 Autoplay Twitch player loading:', stream.user_login);
    setIsLoading(true);
    setError(null);
    setHasStarted(false);
  }, [stream.user_login]);

  // Handle WebView messages
  const handleWebViewMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('Autoplay message:', data);
      
      switch (data.type) {
        case 'started':
          console.log('✅ Stream started automatically:', data.channel);
          setIsLoading(false);
          setHasStarted(true);
          setError(null);
          break;
        case 'touch':
          onPress?.();
          break;
      }
    } catch (error) {
      console.log('WebView message parse error:', error);
    }
  }, [onPress]);

  // Handle external link
  const handleOpenExternal = useCallback(() => {
    const twitchUrl = `https://twitch.tv/${stream.user_login}`;
    Linking.openURL(twitchUrl).catch(err => {
      console.error('Failed to open Twitch URL:', err);
    });
  }, [stream.user_login]);

  // Force start after timeout
  useEffect(() => {
    const forceStartTimeout = setTimeout(() => {
      if (isLoading) {
        console.log('🔄 Force starting stream for:', stream.user_login);
        setIsLoading(false);
        setHasStarted(true);
        setError(null);
      }
    }, 8000); // Force start after 8 seconds

    return () => clearTimeout(forceStartTimeout);
  }, [isLoading, stream.user_login]);

  const embedHtml = getAutoplayHTML();

  return (
    <View style={[styles.container, { width, height }]}>
      <TouchableOpacity
        style={styles.touchArea}
        onPress={onPress}
        activeOpacity={1}
      >
        {/* Autoplay Twitch WebView */}
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
          userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1"
        />

        {/* Minimal Loading Overlay */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={ModernTheme.colors.primary[500]} />
            <Text style={styles.loadingText}>Starting {stream.user_name}...</Text>
          </View>
        )}

        {/* Stream Info Overlay */}
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
              {/* Status indicator */}
              <View style={[
                styles.statusDot,
                { backgroundColor: hasStarted ? '#00ff00' : isLoading ? '#ffff00' : '#ff6666' }
              ]} />
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
                    onPress={onMuteToggle}
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
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  loadingText: {
    color: ModernTheme.colors.text.secondary,
    fontSize: ModernTheme.typography.sizes.sm,
    marginTop: ModernTheme.spacing.sm,
    fontWeight: ModernTheme.typography.weights.medium,
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
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 'auto',
  } as ViewStyle,
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

export default AutoplayTwitchPlayer;