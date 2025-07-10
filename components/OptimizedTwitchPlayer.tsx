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
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Volume2,
  VolumeX,
  X,
  Eye,
  ExternalLink,
  Wifi,
} from 'lucide-react-native';
import { TwitchStream } from '@/services/twitchApi';
import { ModernTheme } from '@/theme/modernTheme';

interface OptimizedTwitchPlayerProps {
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

export const OptimizedTwitchPlayer: React.FC<OptimizedTwitchPlayerProps> = ({
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const webViewRef = useRef<WebView>(null);
  const maxRetries = 3;

  // Generate optimized Twitch embed URL
  const getTwitchEmbedUrl = useCallback(() => {
    const baseUrl = 'https://player.twitch.tv/';
    const params = new URLSearchParams({
      channel: stream.user_login,
      muted: isMuted ? 'true' : 'false',
      autoplay: 'true',
      controls: 'true', // Enable controls for better mobile experience
      time: '0s',
      // Mobile-optimized quality
      quality: width < 300 ? 'mobile' : 'auto',
    });

    // Essential parent domains for React Native
    const parents = [
      'localhost',
      '127.0.0.1',
      'expo.dev', 
      'exp.host',
      'snack.expo.dev',
    ];

    parents.forEach(parent => params.append('parent', parent));

    const url = `${baseUrl}?${params.toString()}`;
    console.log('🔗 Twitch URL:', url);
    return url;
  }, [stream.user_login, isMuted, width]);

  // WebView event handlers
  const handleWebViewLoad = useCallback(() => {
    console.log('✅ Optimized Twitch player loaded:', stream.user_login);
    setIsLoading(false);
    setError(null);
    setIsPlaying(true);
    setRetryAttempt(0);
  }, [stream.user_login]);

  const handleWebViewError = useCallback((syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('❌ Optimized Twitch player error:', stream.user_login, nativeEvent);
    
    setIsPlaying(false);
    
    if (retryAttempt < maxRetries) {
      console.log(`🔄 Auto-retry ${retryAttempt + 1}/${maxRetries} for ${stream.user_login}`);
      setRetryAttempt(prev => prev + 1);
      
      // Progressive delay for retries
      const delay = (retryAttempt + 1) * 2000;
      setTimeout(() => {
        webViewRef.current?.reload();
      }, delay);
      
      setError(`Retrying... (${retryAttempt + 1}/${maxRetries})`);
    } else {
      setError('Stream not available');
      setIsLoading(false);
    }
  }, [stream.user_login, retryAttempt, maxRetries]);

  const handleWebViewLoadStart = useCallback(() => {
    console.log('🔄 Optimized Twitch player loading:', stream.user_login);
    setIsLoading(true);
    setError(null);
    setIsPlaying(false);
  }, [stream.user_login]);

  // Handle navigation state changes
  const handleNavigationStateChange = useCallback((navState: any) => {
    console.log('📍 Navigation state:', navState.url);
    
    // Check if we're still on Twitch domain
    if (navState.url && !navState.url.includes('twitch.tv')) {
      console.log('⚠️ Navigated away from Twitch, reloading...');
      webViewRef.current?.reload();
    }
  }, []);

  // Manual retry function
  const handleRetry = useCallback(() => {
    console.log('🔄 Manual retry for:', stream.user_login);
    setError(null);
    setIsLoading(true);
    setIsPlaying(false);
    setRetryAttempt(0);
    webViewRef.current?.reload();
  }, [stream.user_login]);

  // Handle external link
  const handleOpenExternal = useCallback(() => {
    const twitchUrl = `https://twitch.tv/${stream.user_login}`;
    console.log('🔗 Opening external Twitch:', twitchUrl);
    Linking.openURL(twitchUrl).catch(err => {
      console.error('Failed to open Twitch URL:', err);
    });
  }, [stream.user_login]);

  // Loading timeout
  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => {
        if (isLoading && !isPlaying) {
          console.log('⏰ Loading timeout for:', stream.user_login);
          setError('Loading timeout');
          setIsLoading(false);
        }
      }, 15000);

      return () => clearTimeout(timeout);
    }
  }, [isLoading, isPlaying, stream.user_login]);

  const embedUrl = getTwitchEmbedUrl();

  return (
    <View style={[styles.container, { width, height }]}>
      <TouchableOpacity
        style={styles.touchArea}
        onPress={error ? handleOpenExternal : onPress}
        activeOpacity={1}
      >
        {/* Optimized Twitch WebView */}
        <WebView
          ref={webViewRef}
          source={{ uri: embedUrl }}
          style={styles.video}
          onLoad={handleWebViewLoad}
          onError={handleWebViewError}
          onLoadStart={handleWebViewLoadStart}
          onNavigationStateChange={handleNavigationStateChange}
          // Optimized settings for mobile streaming
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={false}
          scalesPageToFit={true}
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
          cacheEnabled={false} // Disable caching for live streams
          incognito={false}
          // Mobile-optimized user agent
          userAgent={Platform.select({
            ios: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
            android: "Mozilla/5.0 (Linux; Android 12; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36",
            default: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1"
          })}
        />

        {/* Loading Overlay */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={ModernTheme.colors.primary[500]} />
            <Text style={styles.loadingText}>Loading {stream.user_name}</Text>
            {retryAttempt > 0 && (
              <Text style={styles.retryText}>Attempt {retryAttempt}/{maxRetries}</Text>
            )}
          </View>
        )}

        {/* Error Overlay */}
        {error && !isLoading && (
          <View style={styles.errorOverlay}>
            <Wifi size={32} color={ModernTheme.colors.text.error} />
            <Text style={styles.errorTitle}>Stream Unavailable</Text>
            <Text style={styles.errorText}>{error}</Text>
            <View style={styles.errorButtons}>
              {retryAttempt < maxRetries && (
                <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.twitchButton} onPress={handleOpenExternal}>
                <Text style={styles.twitchButtonText}>Open Twitch</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Stream Info Overlay */}
        {!error && (
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
                  styles.statusIndicator,
                  { backgroundColor: isPlaying ? '#00ff00' : isLoading ? '#ffff00' : '#ff0000' }
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
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  loadingText: {
    color: ModernTheme.colors.text.secondary,
    fontSize: ModernTheme.typography.sizes.sm,
    marginTop: ModernTheme.spacing.sm,
    fontWeight: ModernTheme.typography.weights.medium,
    textAlign: 'center',
  } as TextStyle,
  retryText: {
    color: ModernTheme.colors.text.secondary,
    fontSize: ModernTheme.typography.sizes.xs,
    marginTop: ModernTheme.spacing.xs,
    opacity: 0.7,
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
  errorTitle: {
    color: ModernTheme.colors.text.error,
    fontSize: ModernTheme.typography.sizes.lg,
    fontWeight: ModernTheme.typography.weights.bold,
    marginTop: ModernTheme.spacing.sm,
    marginBottom: ModernTheme.spacing.xs,
    textAlign: 'center',
  } as TextStyle,
  errorText: {
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
  retryButtonText: {
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
  twitchButtonText: {
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
  statusIndicator: {
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

export default OptimizedTwitchPlayer;