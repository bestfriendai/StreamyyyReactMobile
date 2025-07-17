import { LinearGradient } from 'expo-linear-gradient';
import { Play, Eye, Plus, Check, Heart } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Image,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { TwitchStream } from '@/services/twitchApi';
import { ModernTheme } from '@/theme/modernTheme';

interface StreamPreviewCardProps {
  stream: TwitchStream;
  onPress: () => void;
  onAddStream?: () => void;
  onToggleFavorite?: () => void;
  isFavorite?: boolean;
  isActive?: boolean;
  width: number;
  height: number;
}

export const StreamPreviewCard: React.FC<StreamPreviewCardProps> = ({
  stream,
  onPress,
  onAddStream,
  onToggleFavorite,
  isFavorite = false,
  isActive = false,
  width,
  height,
}) => {
  const [imageError, setImageError] = useState(false);

  // Animation values
  const scale = useSharedValue(1);
  const heartScale = useSharedValue(1);

  // Get thumbnail URL
  const getThumbnailUrl = () => {
    if (!stream.thumbnail_url) {
      return null;
    }

    // Replace template variables with actual dimensions
    return stream.thumbnail_url
      .replace('{width}', Math.floor(width * 2).toString())
      .replace('{height}', Math.floor(height * 1.5).toString());
  };

  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  // Handle press with animation
  const handlePress = () => {
    scale.value = withSpring(0.95, { damping: 15 }, () => {
      scale.value = withSpring(1);
    });
    onPress();
  };

  // Handle add stream
  const handleAddStream = (e: any) => {
    e.stopPropagation();
    scale.value = withSpring(0.95, { damping: 15 }, () => {
      scale.value = withSpring(1);
    });
    onAddStream?.();
  };

  // Handle favorite toggle
  const handleToggleFavorite = (e: any) => {
    e.stopPropagation();
    heartScale.value = withSpring(0.8, { damping: 15 }, () => {
      heartScale.value = withSpring(1.2, { damping: 15 }, () => {
        heartScale.value = withSpring(1);
      });
    });
    onToggleFavorite?.();
  };

  const thumbnailUrl = getThumbnailUrl();

  return (
    <Animated.View style={[styles.container, { width, height }, containerStyle]}>
      <TouchableOpacity style={styles.touchArea} onPress={handlePress} activeOpacity={0.9}>
        <LinearGradient
          colors={
            isActive ? ModernTheme.colors.gradients.accent : ModernTheme.colors.gradients.card
          }
          style={styles.cardGradient}
        >
          {/* Thumbnail */}
          <View style={styles.thumbnailContainer}>
            {thumbnailUrl && !imageError ? (
              <Image
                source={{ uri: thumbnailUrl }}
                style={styles.thumbnail}
                onError={() => setImageError(true)}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.placeholderThumbnail}>
                <Play size={32} color={ModernTheme.colors.text.secondary} />
              </View>
            )}

            {/* Live Badge */}
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>

            {/* Viewer Count */}
            <View style={styles.viewerBadge}>
              <Eye size={12} color={ModernTheme.colors.text.primary} />
              <Text style={styles.viewerText}>{stream.viewer_count?.toLocaleString() || '0'}</Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              {onToggleFavorite && (
                <Animated.View style={heartStyle}>
                  <TouchableOpacity
                    style={[styles.actionButton, isFavorite && styles.favoriteActive]}
                    onPress={handleToggleFavorite}
                  >
                    <Heart
                      size={16}
                      color={
                        isFavorite
                          ? ModernTheme.colors.status.live
                          : ModernTheme.colors.text.primary
                      }
                      fill={isFavorite ? ModernTheme.colors.status.live : 'transparent'}
                    />
                  </TouchableOpacity>
                </Animated.View>
              )}

              {onAddStream && (
                <TouchableOpacity
                  style={[styles.actionButton, isActive && styles.addedActive]}
                  onPress={handleAddStream}
                >
                  {isActive ? (
                    <Check size={16} color={ModernTheme.colors.text.primary} />
                  ) : (
                    <Plus size={16} color={ModernTheme.colors.text.primary} />
                  )}
                </TouchableOpacity>
              )}
            </View>

            {/* Play Overlay */}
            <View style={styles.playOverlay}>
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.3)']}
                style={styles.playGradient}
              >
                <View style={styles.playButton}>
                  <Play size={24} color={ModernTheme.colors.text.primary} />
                </View>
              </LinearGradient>
            </View>
          </View>

          {/* Stream Info */}
          <View style={styles.streamInfo}>
            <Text style={styles.streamTitle} numberOfLines={1}>
              {stream.user_name}
            </Text>
            <Text style={styles.streamGame} numberOfLines={1}>
              {stream.game_name}
            </Text>
            {stream.title && (
              <Text style={styles.streamDescription} numberOfLines={2}>
                {stream.title}
              </Text>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: ModernTheme.spacing.sm,
  } as ViewStyle,
  touchArea: {
    flex: 1,
    borderRadius: ModernTheme.borderRadius.lg,
    overflow: 'hidden',
    ...ModernTheme.shadows.md,
  } as ViewStyle,
  cardGradient: {
    flex: 1,
  } as ViewStyle,
  thumbnailContainer: {
    flex: 1,
    position: 'relative',
  } as ViewStyle,
  thumbnail: {
    flex: 1,
    width: '100%',
  } as ViewStyle,
  placeholderThumbnail: {
    flex: 1,
    backgroundColor: ModernTheme.colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  liveBadge: {
    position: 'absolute',
    top: ModernTheme.spacing.sm,
    left: ModernTheme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: ModernTheme.borderRadius.sm,
    paddingHorizontal: ModernTheme.spacing.sm,
    paddingVertical: ModernTheme.spacing.xs,
    gap: ModernTheme.spacing.xs,
  } as ViewStyle,
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: ModernTheme.colors.status.live,
  } as ViewStyle,
  liveText: {
    color: ModernTheme.colors.text.primary,
    fontSize: 10,
    fontWeight: ModernTheme.typography.weights.bold,
    letterSpacing: 0.5,
  } as TextStyle,
  viewerBadge: {
    position: 'absolute',
    top: ModernTheme.spacing.sm,
    right: ModernTheme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: ModernTheme.borderRadius.sm,
    paddingHorizontal: ModernTheme.spacing.sm,
    paddingVertical: ModernTheme.spacing.xs,
    gap: ModernTheme.spacing.xs,
  } as ViewStyle,
  viewerText: {
    color: ModernTheme.colors.text.primary,
    fontSize: 10,
    fontWeight: ModernTheme.typography.weights.semibold,
  } as TextStyle,
  actionButtons: {
    position: 'absolute',
    bottom: ModernTheme.spacing.sm,
    right: ModernTheme.spacing.sm,
    flexDirection: 'row',
    gap: ModernTheme.spacing.xs,
  } as ViewStyle,
  actionButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: ModernTheme.borderRadius.md,
    padding: ModernTheme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  } as ViewStyle,
  favoriteActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: ModernTheme.colors.status.live,
  } as ViewStyle,
  addedActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderColor: ModernTheme.colors.status.success,
  } as ViewStyle,
  playOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
  } as ViewStyle,
  playGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: ModernTheme.spacing.md,
  } as ViewStyle,
  playButton: {
    backgroundColor: 'rgba(139, 92, 246, 0.9)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  } as ViewStyle,
  streamInfo: {
    padding: ModernTheme.spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  } as ViewStyle,
  streamTitle: {
    color: ModernTheme.colors.text.primary,
    fontSize: ModernTheme.typography.sizes.md,
    fontWeight: ModernTheme.typography.weights.semibold,
    marginBottom: 2,
  } as TextStyle,
  streamGame: {
    color: ModernTheme.colors.text.accent,
    fontSize: ModernTheme.typography.sizes.sm,
    fontWeight: ModernTheme.typography.weights.medium,
    marginBottom: 4,
  } as TextStyle,
  streamDescription: {
    color: ModernTheme.colors.text.secondary,
    fontSize: ModernTheme.typography.sizes.xs,
    lineHeight: 16,
  } as TextStyle,
});

export default StreamPreviewCard;
