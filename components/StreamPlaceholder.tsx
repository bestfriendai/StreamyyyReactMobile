import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Play,
  Volume2,
  VolumeX,
  X,
  Eye,
  ExternalLink,
} from 'lucide-react-native';
import { TwitchStream } from '@/services/twitchApi';
import { ModernTheme } from '@/theme/modernTheme';

interface StreamPlaceholderProps {
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

export const StreamPlaceholder: React.FC<StreamPlaceholderProps> = ({
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
  return (
    <View style={[styles.container, { width, height }]}>
      <TouchableOpacity
        style={styles.touchArea}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {/* Background Gradient */}
        <LinearGradient
          colors={[
            'rgba(145, 70, 255, 0.3)',
            'rgba(0, 0, 0, 0.8)',
            'rgba(145, 70, 255, 0.2)',
          ]}
          style={styles.background}
        >
          {/* Stream Preview Placeholder */}
          <View style={styles.previewContainer}>
            <View style={styles.playIconContainer}>
              <Play size={32} color="#fff" fill="#fff" />
            </View>
            
            {/* Stream Info */}
            <View style={styles.streamInfo}>
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
              
              <Text style={styles.streamTitle} numberOfLines={2}>
                {stream.title || `${stream.user_name}'s Stream`}
              </Text>
              
              <Text style={styles.streamerName} numberOfLines={1}>
                {stream.user_name}
              </Text>
              
              <Text style={styles.gameCategory} numberOfLines={1}>
                {stream.game_name}
              </Text>
              
              <View style={styles.viewerInfo}>
                <Eye size={14} color={ModernTheme.colors.text.secondary} />
                <Text style={styles.viewerCount}>
                  {stream.viewer_count?.toLocaleString() || '0'} viewers
                </Text>
              </View>
            </View>
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
                      onPress={() => {
                        // Open in external Twitch app/browser
                        console.log('Open Twitch:', stream.user_login);
                      }}
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
          
          {/* Tap to Play Overlay */}
          <View style={styles.tapOverlay}>
            <Text style={styles.tapText}>Tap to open in Twitch</Text>
          </View>
        </LinearGradient>
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
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: ModernTheme.spacing.md,
  } as ViewStyle,
  previewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  } as ViewStyle,
  playIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: ModernTheme.spacing.md,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  } as ViewStyle,
  streamInfo: {
    alignItems: 'center',
    width: '100%',
  } as ViewStyle,
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ModernTheme.colors.status.live,
    paddingHorizontal: ModernTheme.spacing.sm,
    paddingVertical: ModernTheme.spacing.xs,
    borderRadius: ModernTheme.borderRadius.sm,
    marginBottom: ModernTheme.spacing.sm,
  } as ViewStyle,
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
    marginRight: ModernTheme.spacing.xs,
  } as ViewStyle,
  liveText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: ModernTheme.typography.weights.bold,
    letterSpacing: 0.5,
  } as TextStyle,
  streamTitle: {
    color: ModernTheme.colors.text.primary,
    fontSize: ModernTheme.typography.sizes.sm,
    fontWeight: ModernTheme.typography.weights.semibold,
    textAlign: 'center',
    marginBottom: ModernTheme.spacing.xs,
    lineHeight: 18,
  } as TextStyle,
  streamerName: {
    color: ModernTheme.colors.primary[400],
    fontSize: ModernTheme.typography.sizes.md,
    fontWeight: ModernTheme.typography.weights.bold,
    textAlign: 'center',
    marginBottom: ModernTheme.spacing.xs,
  } as TextStyle,
  gameCategory: {
    color: ModernTheme.colors.text.secondary,
    fontSize: ModernTheme.typography.sizes.sm,
    fontWeight: ModernTheme.typography.weights.medium,
    textAlign: 'center',
    marginBottom: ModernTheme.spacing.sm,
  } as TextStyle,
  viewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: ModernTheme.spacing.sm,
    paddingVertical: ModernTheme.spacing.xs,
    borderRadius: ModernTheme.borderRadius.sm,
    gap: ModernTheme.spacing.xs,
  } as ViewStyle,
  viewerCount: {
    color: ModernTheme.colors.text.secondary,
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
  tapOverlay: {
    position: 'absolute',
    top: ModernTheme.spacing.sm,
    left: ModernTheme.spacing.sm,
    right: ModernTheme.spacing.sm,
  } as ViewStyle,
  tapText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: ModernTheme.typography.sizes.xs,
    fontWeight: ModernTheme.typography.weights.medium,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: ModernTheme.spacing.sm,
    paddingVertical: ModernTheme.spacing.xs,
    borderRadius: ModernTheme.borderRadius.sm,
  } as TextStyle,
});

export default StreamPlaceholder;
