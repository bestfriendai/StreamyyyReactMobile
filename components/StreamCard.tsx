import { Heart, Users, Play, X, Eye } from 'lucide-react-native';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  withSequence,
} from 'react-native-reanimated';
import { TwitchStream } from '@/services/twitchApi';
import { twitchApi } from '@/services/twitchApi';

const { width: screenWidth } = Dimensions.get('window');

interface StreamCardProps {
  stream: TwitchStream;
  onAdd?: (stream: TwitchStream) => void;
  onRemove?: (streamId: string) => void;
  onToggleFavorite?: (stream: TwitchStream) => void;
  isFavorite?: boolean;
  isActive?: boolean;
  showAddButton?: boolean;
  showRemoveButton?: boolean;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export function StreamCard({
  stream,
  onAdd,
  onRemove,
  onToggleFavorite,
  isFavorite = false,
  isActive = false,
  showAddButton = false,
  showRemoveButton = false,
}: StreamCardProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const heartScale = useSharedValue(1);
  const shimmer = useSharedValue(0);

  React.useEffect(() => {
    // Subtle shimmer effect for live indicator
    shimmer.value = withTiming(1, { duration: 2000 });
  }, []);

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15 });
    opacity.value = withTiming(0.9);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
    opacity.value = withTiming(1);
  };

  const handleFavoritePress = () => {
    heartScale.value = withSequence(
      withSpring(1.3, { damping: 10 }),
      withSpring(1, { damping: 10 })
    );
    if (onToggleFavorite) {
      onToggleFavorite(stream);
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const animatedHeartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const animatedShimmerStyle = useAnimatedStyle(() => {
    const translateX = interpolate(shimmer.value, [0, 1], [-100, 100]);
    return {
      transform: [{ translateX }],
    };
  });

  const thumbnailUrl = twitchApi.getThumbnailUrl(stream.thumbnail_url, 400, 225);
  const formatViewerCount = (count: number) => {
    if (count >= 1000000) {return `${(count / 1000000).toFixed(1)}M`;}
    if (count >= 1000) {return `${(count / 1000).toFixed(1)}K`;}
    return count.toString();
  };

  const handleStreamPress = () => {
    if (showAddButton && onAdd && !isActive) {
      onAdd(stream);
      // Navigate to multi-view tab after adding stream
      router.push('/(tabs)/grid');
    }
  };

  const profileImageUrl = stream.user_login
    ? twitchApi.getProfileImageUrl(stream.user_login)
    : 'https://static-cdn.jtvnw.net/jtv_user_pictures/default-profile_image-70x70.png';

  return (
    <AnimatedTouchableOpacity
      style={[styles.card, animatedStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handleStreamPress}
      activeOpacity={1}
    >
      <View style={styles.thumbnailContainer}>
        <Image source={{ uri: thumbnailUrl }} style={styles.thumbnail} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.9)']}
          style={styles.thumbnailOverlay}
        />

        <View style={styles.liveIndicator}>
          <LinearGradient colors={['#FF4444', '#FF0000', '#CC0000']} style={styles.liveGradient}>
            <Animated.View style={[styles.shimmerOverlay, animatedShimmerStyle]} />
            <Text style={styles.liveText}>LIVE</Text>
          </LinearGradient>
        </View>

        <View style={styles.viewerBadge}>
          <LinearGradient
            colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.6)']}
            style={styles.viewerBadgeGradient}
          >
            <Eye size={12} color="#fff" />
            <Text style={styles.viewerBadgeText}>{formatViewerCount(stream.viewer_count)}</Text>
          </LinearGradient>
        </View>

        {/* Floating category badge */}
        <View style={styles.categoryBadge}>
          <LinearGradient
            colors={['rgba(139, 92, 246, 0.9)', 'rgba(124, 58, 237, 0.9)']}
            style={styles.categoryBadgeGradient}
          >
            <Text style={styles.categoryBadgeText} numberOfLines={1}>
              {stream.game_name}
            </Text>
          </LinearGradient>
        </View>
      </View>

      <View style={styles.content}>
        <LinearGradient
          colors={['rgba(42, 42, 42, 0.95)', 'rgba(26, 26, 26, 0.95)']}
          style={styles.contentGradient}
        >
          <View style={styles.header}>
            <View style={styles.avatarContainer}>
              <Image
                source={{ uri: profileImageUrl }}
                style={styles.avatar}
                defaultSource={{
                  uri: 'https://static-cdn.jtvnw.net/jtv_user_pictures/default-profile_image-70x70.png',
                }}
              />
              <View style={styles.onlineIndicator}>
                <LinearGradient colors={['#00FF88', '#00CC66']} style={styles.onlineGradient} />
              </View>
            </View>
            <View style={styles.info}>
              <Text style={styles.username}>{stream.user_name}</Text>
              <View style={styles.platformContainer}>
                <View style={styles.platformDot} />
                <Text style={styles.platform}>TWITCH</Text>
              </View>
            </View>

            <View style={styles.actions}>
              {onToggleFavorite && (
                <Animated.View style={animatedHeartStyle}>
                  <TouchableOpacity
                    style={[styles.actionButton, isFavorite && styles.favoriteButton]}
                    onPress={handleFavoritePress}
                  >
                    <LinearGradient
                      colors={
                        isFavorite
                          ? ['#FF4444', '#CC0000']
                          : ['rgba(58, 58, 58, 0.8)', 'rgba(42, 42, 42, 0.8)']
                      }
                      style={styles.actionGradient}
                    >
                      <Heart
                        size={18}
                        color={isFavorite ? '#fff' : '#666'}
                        fill={isFavorite ? '#fff' : 'none'}
                      />
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              )}

              {showAddButton && onAdd && (
                <TouchableOpacity
                  style={[styles.actionButton, isActive ? styles.activeButton : styles.addButton]}
                  onPress={() => onAdd(stream)}
                  disabled={isActive}
                >
                  <LinearGradient
                    colors={isActive
                      ? ['#22C55E', '#16A34A']
                      : ['#8B5CF6', '#7C3AED']
                    }
                    style={styles.actionGradient}
                  >
                    {isActive ? <Eye size={16} color="#fff" /> : <Play size={16} color="#fff" />}
                  </LinearGradient>
                </TouchableOpacity>
              )}

              {showRemoveButton && onRemove && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.removeButton]}
                  onPress={() => onRemove(stream.id)}
                >
                  <LinearGradient colors={['#EF4444', '#DC2626']} style={styles.actionGradient}>
                    <X size={16} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <Text style={styles.title} numberOfLines={2}>
            {stream.title}

          <View style={styles.stats}>
            <View style={styles.viewerCount}>
              <Users size={14} color="#8B5CF6" />
              <Text style={styles.viewerText}>
                {formatViewerCount(stream.viewer_count)} viewers
              </Text>
            </View>

            <View style={styles.qualityBadge}>
              <Text style={styles.qualityText}>HD</Text>
            </View>
          </View>
        </LinearGradient>
      </View>
    </AnimatedTouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'transparent',
    borderRadius: 20,
    marginVertical: 10,
    marginHorizontal: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
      web: {
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      },
    }),
  },
  thumbnailContainer: {
    position: 'relative',
    height: 200,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  thumbnailOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  liveIndicator: {
    position: 'absolute',
    top: 12,
    left: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  liveGradient: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    position: 'relative',
    overflow: 'hidden',
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    width: 20,
  },
  liveText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.8,
  },
  viewerBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  viewerBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  viewerBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  categoryBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    maxWidth: '60%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  categoryBadgeGradient: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  categoryBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
  },
  content: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  contentGradient: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(139, 92, 246, 0.4)',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#2a2a2a',
    overflow: 'hidden',
  },
  onlineGradient: {
    flex: 1,
  },
  info: {
    flex: 1,
  },
  username: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  platformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  platformDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#8B5CF6',
  },
  platform: {
    color: '#8B5CF6',
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    letterSpacing: 0.5,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteButton: {
    borderColor: 'rgba(255, 68, 68, 0.3)',
  },
  addButton: {
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  activeButton: {
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  removeButton: {
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  title: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    lineHeight: 20,
    marginBottom: 12,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewerCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewerText: {
    color: '#999',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  qualityBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  qualityText: {
    color: '#8B5CF6',
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.5,
  },
});
