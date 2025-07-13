import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
  ImageStyle,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  Play,
  Users,
  Clock,
  Heart,
  Plus,
  Star,
  Zap,
  Eye,
  Circle,
  Gamepad2,
  TrendingUp,
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  FadeIn,
  SlideInUp,
} from 'react-native-reanimated';
import { TwitchStream } from '@/services/twitchApi';
import { ModernTheme } from '@/theme/modernTheme';
import { HapticFeedback } from '@/utils/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface EnhancedStreamCardV2Props {
  stream: TwitchStream & {
    isNewStream?: boolean;
    isVeryNew?: boolean;
    isTrending?: boolean;
    isHot?: boolean;
    isRising?: boolean;
    trendingScore?: number;
    engagementScore?: number;
    streamAge?: number;
    minutesLive?: number;
  };
  onPress: () => void;
  onAddToMultiView: () => Promise<{ success: boolean; message: string }>;
  onToggleFavorite: () => void;
  isFavorite: boolean;
  isActive: boolean;
  width?: number;
  showTrending?: boolean;
  isNewStreamer?: boolean;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export const EnhancedStreamCardV2: React.FC<EnhancedStreamCardV2Props> = ({
  stream,
  onPress,
  onAddToMultiView,
  onToggleFavorite,
  isFavorite,
  isActive,
  width = SCREEN_WIDTH * 0.46,
  showTrending = false,
  isNewStreamer = false,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Reset image state when stream changes
  React.useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
  }, [stream.id]);
  
  // Animation values
  const cardScale = useSharedValue(1);
  const favoriteScale = useSharedValue(1);
  const addButtonScale = useSharedValue(1);
  const trendingPulse = useSharedValue(1);

  // Calculate responsive dimensions
  const cardHeight = width * 0.75; // More rectangular for better thumbnail viewing
  const thumbnailHeight = cardHeight * 0.65; // Bigger thumbnail ratio
  const contentHeight = cardHeight - thumbnailHeight;

  // Format viewer count
  const formatViewerCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  // Format stream duration
  const getStreamDuration = (): string => {
    const started = new Date(stream.started_at);
    const now = new Date();
    const diffMs = now.getTime() - started.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    }
    return `${diffMinutes}m`;
  };

  // Get thumbnail URL with higher resolution
  const getThumbnailUrl = (): string => {
    if (!stream.thumbnail_url || stream.thumbnail_url.includes('ttv-boxart')) {
      return '';
    }
    return stream.thumbnail_url
      .replace('{width}', '440')
      .replace('{height}', '248');
  };

  // Handle press with animation
  const handlePress = useCallback(() => {
    HapticFeedback.light();
    cardScale.value = withSpring(0.95, { damping: 15 }, () => {
      cardScale.value = withSpring(1.02, { damping: 12 }, () => {
        cardScale.value = withSpring(1);
      });
    });
    onPress();
  }, [onPress]);

  // Handle add to multi-view
  const handleAddToMultiView = useCallback(async () => {
    if (isAdding) return;
    
    HapticFeedback.medium();
    setIsAdding(true);
    addButtonScale.value = withSpring(0.8, { damping: 15 }, () => {
      addButtonScale.value = withSpring(1.1, { damping: 10 }, () => {
        addButtonScale.value = withSpring(1);
      });
    });
    
    try {
      const result = await onAddToMultiView();
      if (result.success) {
        HapticFeedback.success();
      } else {
        HapticFeedback.error();
      }
    } finally {
      setIsAdding(false);
    }
  }, [onAddToMultiView, isAdding]);

  // Handle favorite toggle
  const handleToggleFavorite = useCallback(() => {
    HapticFeedback.selection();
    favoriteScale.value = withSpring(0.8, { damping: 20 }, () => {
      favoriteScale.value = withSpring(1.3, { damping: 15 }, () => {
        favoriteScale.value = withSpring(1);
      });
    });
    onToggleFavorite();
  }, [onToggleFavorite]);

  // Animated styles
  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const favoriteAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: favoriteScale.value }],
  }));

  const addButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: addButtonScale.value }],
  }));

  const trendingAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: trendingPulse.value }],
      opacity: interpolate(trendingPulse.value, [1, 1.1], [0.8, 1]),
    };
  });

  // Start trending animation if needed
  React.useEffect(() => {
    if (showTrending) {
      trendingPulse.value = withTiming(1.1, { duration: 1000 }, () => {
        trendingPulse.value = withTiming(1, { duration: 1000 });
      });
    }
  }, [showTrending]);

  return (
    <AnimatedTouchableOpacity
      style={[styles.container, { width, height: cardHeight }, cardAnimatedStyle]}
      onPress={handlePress}
      activeOpacity={0.9}
      entering={FadeIn.delay(100)}
    >
      {/* Main Card */}
      <View style={styles.card}>
        {/* Thumbnail Section */}
        <View style={[styles.thumbnailContainer, { height: thumbnailHeight }]}>
          {/* Loading Placeholder */}
          {!imageLoaded && !imageError && (
            <View style={styles.thumbnailPlaceholder}>
              <LinearGradient
                colors={['#1f2937', '#374151']}
                style={styles.placeholderGradient}
              >
                <Animated.View entering={FadeIn.duration(500)}>
                  <Play size={32} color="rgba(255,255,255,0.6)" />
                </Animated.View>
              </LinearGradient>
            </View>
          )}

          {/* Error Placeholder */}
          {imageError && (
            <View style={styles.thumbnailError}>
              <LinearGradient
                colors={['#1f2937', '#374151']}
                style={styles.errorGradient}
              >
                <Eye size={28} color="rgba(255,255,255,0.5)" />
                <Text style={styles.errorText}>Stream Offline</Text>
              </LinearGradient>
            </View>
          )}

          {getThumbnailUrl() ? (
            <Image
              source={{ uri: getThumbnailUrl() }}
              style={[styles.thumbnail, { opacity: imageLoaded ? 1 : 0 }]}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              resizeMode="cover"
            />
          ) : null}
          
          {/* Thumbnail Overlay */}
          {imageLoaded && (
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.4)']}
              style={styles.thumbnailOverlay}
            />
          )}

          {/* Live Indicator */}
          <View style={styles.liveIndicator}>
            <BlurView intensity={80} style={styles.liveBlur}>
              <View style={styles.liveContent}>
                <Circle size={6} color="#ef4444" fill="#ef4444" />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            </BlurView>
          </View>

          {/* Viewer Count */}
          <View style={styles.viewerCount}>
            <BlurView intensity={80} style={styles.viewerBlur}>
              <View style={styles.viewerContent}>
                <Eye size={10} color="#fff" />
                <Text style={styles.viewerText}>{formatViewerCount(stream.viewer_count)}</Text>
              </View>
            </BlurView>
          </View>

          {/* Duration */}
          <View style={styles.duration}>
            <BlurView intensity={80} style={styles.durationBlur}>
              <View style={styles.durationContent}>
                <Clock size={10} color="#fff" />
                <Text style={styles.durationText}>{getStreamDuration()}</Text>
              </View>
            </BlurView>
          </View>

          {/* Hot Badge */}
          {stream.isHot && (
            <Animated.View style={[styles.hotBadge, trendingAnimatedStyle]}>
              <BlurView intensity={80} style={styles.hotBlur}>
                <LinearGradient
                  colors={['#ef4444', '#dc2626']}
                  style={styles.hotGradient}
                >
                  <Zap size={12} color="#fff" />
                  <Text style={styles.hotText}>HOT</Text>
                </LinearGradient>
              </BlurView>
            </Animated.View>
          )}

          {/* Trending Badge */}
          {(showTrending || stream.isTrending) && !stream.isHot && (
            <Animated.View style={[styles.trendingBadge, trendingAnimatedStyle]}>
              <BlurView intensity={80} style={styles.trendingBlur}>
                <LinearGradient
                  colors={['#ff6b35', '#f7931e']}
                  style={styles.trendingGradient}
                >
                  <TrendingUp size={12} color="#fff" />
                </LinearGradient>
              </BlurView>
            </Animated.View>
          )}

          {/* Rising Badge */}
          {stream.isRising && !stream.isTrending && !stream.isHot && (
            <View style={styles.risingBadge}>
              <BlurView intensity={80} style={styles.risingBlur}>
                <LinearGradient
                  colors={['#8b5cf6', '#7c3aed']}
                  style={styles.risingGradient}
                >
                  <TrendingUp size={10} color="#fff" />
                  <Text style={styles.risingText}>RISING</Text>
                </LinearGradient>
              </BlurView>
            </View>
          )}

          {/* New Streamer Badge */}
          {(isNewStreamer || stream.isVeryNew) && (
            <View style={styles.newBadge}>
              <BlurView intensity={80} style={styles.newBlur}>
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  style={styles.newGradient}
                >
                  <Star size={10} color="#fff" />
                  <Text style={styles.newText}>
                    {stream.isVeryNew ? 'LIVE' : 'NEW'}
                  </Text>
                </LinearGradient>
              </BlurView>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {/* Favorite Button */}
            <AnimatedTouchableOpacity
              style={[styles.actionButton, favoriteAnimatedStyle]}
              onPress={handleToggleFavorite}
            >
              <BlurView intensity={80} style={styles.actionBlur}>
                <Heart
                  size={16}
                  color={isFavorite ? "#ef4444" : "#fff"}
                  fill={isFavorite ? "#ef4444" : "transparent"}
                />
              </BlurView>
            </AnimatedTouchableOpacity>

            {/* Add to Multi-View Button */}
            <AnimatedTouchableOpacity
              style={[styles.actionButton, addButtonAnimatedStyle]}
              onPress={handleAddToMultiView}
              disabled={isAdding || isActive}
            >
              <BlurView intensity={80} style={styles.actionBlur}>
                <LinearGradient
                  colors={
                    isActive
                      ? ['rgba(34, 197, 94, 0.8)', 'rgba(34, 197, 94, 0.6)']
                      : ['rgba(139, 92, 246, 0.8)', 'rgba(139, 92, 246, 0.6)']
                  }
                  style={styles.addButtonGradient}
                >
                  {isActive ? (
                    <Eye size={14} color="#fff" />
                  ) : (
                    <Plus size={14} color="#fff" />
                  )}
                </LinearGradient>
              </BlurView>
            </AnimatedTouchableOpacity>
          </View>
        </View>

        {/* Content Section */}
        <View style={[styles.content, { height: contentHeight }]}>
          {/* Game Category */}
          <View style={styles.gameCategory}>
            <Gamepad2 size={10} color={ModernTheme.colors.primary[400]} />
            <Text style={styles.gameName} numberOfLines={1}>
              {stream.game_name}
            </Text>
          </View>

          {/* Stream Title */}
          <Text style={styles.title} numberOfLines={2}>
            {stream.title}
          </Text>

          {/* Streamer Info */}
          <View style={styles.streamerInfo}>
            <Text style={styles.streamerName} numberOfLines={1}>
              {stream.user_name}
            </Text>
            <Text style={styles.language}>
              {stream.language.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      {/* Active Border */}
      {isActive && (
        <View style={styles.activeBorder}>
          <LinearGradient
            colors={['#22c55e', '#16a34a']}
            style={styles.activeBorderGradient}
          />
        </View>
      )}
    </AnimatedTouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 6,
  },
  card: {
    flex: 1,
    backgroundColor: ModernTheme.colors.background.secondary,
    borderRadius: ModernTheme.borderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  thumbnailContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  placeholderGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailError: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  errorGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  errorText: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  thumbnailOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '30%',
  },
  liveIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  liveBlur: {
    borderRadius: 12,
  },
  liveContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    gap: 3,
  },
  liveText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  viewerCount: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 10,
    overflow: 'hidden',
  },
  viewerBlur: {
    borderRadius: 10,
  },
  viewerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    gap: 3,
  },
  viewerText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  duration: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  durationBlur: {
    borderRadius: 8,
  },
  durationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 2,
    gap: 2,
  },
  durationText: {
    fontSize: 9,
    fontWeight: '500',
    color: '#fff',
  },
  hotBadge: {
    position: 'absolute',
    top: 8,
    left: '50%',
    marginLeft: -16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  hotBlur: {
    borderRadius: 12,
  },
  hotGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
    gap: 2,
    borderRadius: 12,
  },
  hotText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  trendingBadge: {
    position: 'absolute',
    top: 8,
    left: '50%',
    marginLeft: -12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  trendingBlur: {
    borderRadius: 12,
  },
  trendingGradient: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 12,
  },
  risingBadge: {
    position: 'absolute',
    top: 8,
    left: '50%',
    marginLeft: -18,
    borderRadius: 10,
    overflow: 'hidden',
  },
  risingBlur: {
    borderRadius: 10,
  },
  risingGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 3,
    gap: 2,
    borderRadius: 10,
  },
  risingText: {
    fontSize: 7,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  newBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    borderRadius: 10,
    overflow: 'hidden',
  },
  newBlur: {
    borderRadius: 10,
  },
  newGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 2,
    gap: 2,
    borderRadius: 10,
  },
  newText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  actionButtons: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'column',
    gap: 6,
  },
  actionButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  actionBlur: {
    borderRadius: 20,
  },
  addButtonGradient: {
    width: 32,
    height: 32,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 10,
    justifyContent: 'space-between',
  },
  gameCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  gameName: {
    fontSize: 10,
    fontWeight: '500',
    color: ModernTheme.colors.primary[400],
    flex: 1,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: ModernTheme.colors.text.primary,
    lineHeight: 16,
    flex: 1,
  },
  streamerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  streamerName: {
    fontSize: 11,
    fontWeight: '500',
    color: ModernTheme.colors.text.secondary,
    flex: 1,
  },
  language: {
    fontSize: 8,
    fontWeight: '600',
    color: ModernTheme.colors.text.tertiary,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  activeBorder: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: ModernTheme.borderRadius.lg + 2,
    padding: 2,
  },
  activeBorderGradient: {
    flex: 1,
    borderRadius: ModernTheme.borderRadius.lg,
  },
});

export default EnhancedStreamCardV2;