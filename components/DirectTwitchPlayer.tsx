import React, { useState, useRef, useCallback } from 'react';
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

interface DirectTwitchPlayerProps {
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

export const DirectTwitchPlayer: React.FC<DirectTwitchPlayerProps> = ({
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
  const webViewRef = useRef<WebView>(null);

  // Generate the most direct Twitch embed URL possible
  const getDirectTwitchUrl = useCallback(() => {
    const params = new URLSearchParams({
      channel: stream.user_login,
      muted: 'false', // Force unmuted to trigger autoplay
      autoplay: 'true',
      controls: 'true',
      time: '0s',
      parent: 'localhost',
    });
    
    const url = `https://player.twitch.tv/?${params.toString()}`;
    console.log('🎯 Direct Twitch URL:', url);
    return url;
  }, [stream.user_login]);

  // WebView event handlers - minimal and direct
  const handleWebViewLoad = useCallback(() => {
    console.log('✅ Direct Twitch player loaded:', stream.user_login);
    setTimeout(() => {
      setIsLoading(false);
    }, 2000); // Give it 2 seconds to start playing
  }, [stream.user_login]);

  const handleWebViewLoadStart = useCallback(() => {
    console.log('🔄 Direct Twitch player loading:', stream.user_login);
    setIsLoading(true);
  }, [stream.user_login]);

  // Handle external link
  const handleOpenExternal = useCallback(() => {
    const twitchUrl = `https://twitch.tv/${stream.user_login}`;
    Linking.openURL(twitchUrl).catch(err => {
      console.error('Failed to open Twitch URL:', err);
    });
  }, [stream.user_login]);

  // Force hide loading after timeout
  React.useEffect(() => {
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 5000); // Force show video after 5 seconds

    return () => clearTimeout(timeout);
  }, []);

  const twitchUrl = getDirectTwitchUrl();

  return (
    <View style={[styles.container, { width, height }]}>
      <TouchableOpacity
        style={styles.touchArea}
        onPress={onPress}
        activeOpacity={1}
      >
        {/* Direct Twitch WebView - No custom HTML */}
        <WebView
          ref={webViewRef}
          source={{ uri: twitchUrl }}
          style={styles.video}
          onLoad={handleWebViewLoad}
          onLoadStart={handleWebViewLoadStart}
          // Minimal configuration focused on autoplay
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
          allowsFullscreenVideo={true}
          allowsProtectedMedia={true}
          // Force autoplay settings
          userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1 TwitchMobile/1.0"
        />

        {/* Minimal Loading Overlay */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color={ModernTheme.colors.primary[400]} />
            <Text style={styles.loadingText}>{stream.user_name}</Text>
          </View>
        )}

        {/* Stream Info Overlay */}
        <View style={styles.infoOverlay}>
          <LinearGradient
            colors={['rgba(0,0,0,0.7)', 'transparent']}
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

        {/* Minimal Controls */}
        {showControls && (
          <View style={styles.controlsOverlay}>
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)']}
              style={styles.controlsGradient}
            >
              <View style={styles.controlsContainer}>
                <View style={styles.leftControls}>
                  <TouchableOpacity
                    style={styles.controlButton}
                    onPress={onMuteToggle}
                  >
                    {isMuted ? (
                      <VolumeX size={14} color="#fff" />
                    ) : (
                      <Volume2 size={14} color="#fff" />
                    )}
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.controlButton}
                    onPress={handleOpenExternal}
                  >
                    <ExternalLink size={14} color="#fff" />
                  </TouchableOpacity>
                </View>

                <View style={styles.rightControls}>
                  {onRemove && (
                    <TouchableOpacity
                      style={[styles.controlButton, styles.removeButton]}
                      onPress={onRemove}
                    >
                      <X size={14} color="#fff" />
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
    marginTop: ModernTheme.spacing.xs,
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
    padding: ModernTheme.spacing.xs,
  } as ViewStyle,
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  leftControls: {
    flexDirection: 'row',
    gap: ModernTheme.spacing.xs,
  } as ViewStyle,
  rightControls: {
    flexDirection: 'row',
    gap: ModernTheme.spacing.xs,
  } as ViewStyle,
  controlButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 28,
    height: 28,
    borderRadius: 14,
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

export default DirectTwitchPlayer;