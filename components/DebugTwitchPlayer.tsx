import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  Linking,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Volume2,
  VolumeX,
  X,
  Eye,
  ExternalLink,
  Play,
  Info,
} from 'lucide-react-native';
import { TwitchStream } from '@/services/twitchApi';
import { ModernTheme } from '@/theme/modernTheme';

interface DebugTwitchPlayerProps {
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

export const DebugTwitchPlayer: React.FC<DebugTwitchPlayerProps> = ({
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
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  // Generate Twitch URL for debugging
  const getTwitchUrl = useCallback(() => {
    const params = new URLSearchParams({
      channel: stream.user_login,
      muted: isMuted.toString(),
      autoplay: 'true',
      controls: 'false',
      parent: 'localhost',
    });
    
    return `https://player.twitch.tv/?${params.toString()}`;
  }, [stream.user_login, isMuted]);

  // Handle debug info
  const handleShowDebugInfo = useCallback(() => {
    const url = getTwitchUrl();
    Alert.alert(
      'Stream Debug Info',
      `Channel: ${stream.user_login}\nUser: ${stream.user_name}\nGame: ${stream.game_name}\nViewers: ${stream.viewer_count}\n\nTwitch URL:\n${url}`,
      [
        { text: 'Copy URL', onPress: () => console.log('URL:', url) },
        { text: 'Open Twitch', onPress: () => handleOpenExternal() },
        { text: 'Close' },
      ]
    );
  }, [stream, getTwitchUrl]);

  // Handle external link
  const handleOpenExternal = useCallback(() => {
    const twitchUrl = `https://twitch.tv/${stream.user_login}`;
    Linking.openURL(twitchUrl).catch(err => {
      console.error('Failed to open Twitch URL:', err);
    });
  }, [stream.user_login]);

  // Handle play button - simulate loading and playing
  const handlePlay = useCallback(() => {
    Alert.alert(
      'Stream Player',
      `This would load the stream for ${stream.user_name}.\n\nFor now, tap "Open Twitch" to view the stream in the Twitch app.`,
      [
        { text: 'Open Twitch', onPress: handleOpenExternal },
        { text: 'Debug Info', onPress: handleShowDebugInfo },
        { text: 'Cancel' },
      ]
    );
  }, [stream.user_name, handleOpenExternal, handleShowDebugInfo]);

  return (
    <View style={[styles.container, { width, height }]}>
      <TouchableOpacity
        style={styles.touchArea}
        onPress={onPress}
        activeOpacity={1}
      >
        {/* Mock Stream Background */}
        <LinearGradient
          colors={[
            'rgba(145, 70, 255, 0.3)',
            'rgba(0, 0, 0, 0.8)',
            'rgba(145, 70, 255, 0.2)',
          ]}
          style={styles.mockBackground}
        >
          {/* Play Button */}
          <TouchableOpacity style={styles.playButton} onPress={handlePlay}>
            <View style={styles.playIconContainer}>
              <Play size={32} color="#fff" fill="#fff" />
            </View>
            <Text style={styles.playText}>Tap to Load Stream</Text>
          </TouchableOpacity>
        </LinearGradient>

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
                    onPress={handleShowDebugInfo}
                  >
                    <Info size={16} color="#fff" />
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

        {/* Debug Badge */}
        <View style={styles.debugBadge}>
          <Text style={styles.debugText}>DEBUG</Text>
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
  mockBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  playButton: {
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  playIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ModernTheme.spacing.md,
  } as ViewStyle,
  playText: {
    color: ModernTheme.colors.text.primary,
    fontSize: ModernTheme.typography.sizes.md,
    fontWeight: ModernTheme.typography.weights.semibold,
    textAlign: 'center',
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
  debugBadge: {
    position: 'absolute',
    top: ModernTheme.spacing.sm,
    right: ModernTheme.spacing.sm,
    backgroundColor: 'rgba(255, 165, 0, 0.8)',
    paddingHorizontal: ModernTheme.spacing.sm,
    paddingVertical: ModernTheme.spacing.xs,
    borderRadius: ModernTheme.borderRadius.sm,
  } as ViewStyle,
  debugText: {
    color: '#000',
    fontSize: 10,
    fontWeight: ModernTheme.typography.weights.bold,
    letterSpacing: 0.5,
  } as TextStyle,
});

export default DebugTwitchPlayer;