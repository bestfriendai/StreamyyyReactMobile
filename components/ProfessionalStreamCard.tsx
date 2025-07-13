import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
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
  CheckCircle,
  Fire,
  Sparkles,
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  FadeIn,
  SlideInUp,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { TwitchStream } from '@/services/twitchApi';
import { ModernTheme } from '@/theme/modernTheme';
import { HapticFeedback } from '@/utils/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ProfessionalStreamCardProps {
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

export const ProfessionalStreamCard: React.FC<ProfessionalStreamCardProps> = ({
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
  
  // Enhanced animation values
  const cardScale = useSharedValue(1);
  const cardElevation = useSharedValue(0);
  const favoriteScale = useSharedValue(1);
  const addButtonScale = useSharedValue(1);
  const thumbnailScale = useSharedValue(1);
  const contentOpacity = useSharedValue(1);
  const shimmerX = useSharedValue(-width);

  // Calculate responsive dimensions with better proportions
  const cardHeight = width * 0.85; // Slightly taller for better content
  const thumbnailHeight = cardHeight * 0.62; // More balanced ratio
  const contentHeight = cardHeight - thumbnailHeight;

  // Enhanced utility functions
  const formatViewerCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const getStreamDuration = (): string => {
    const started = new Date(stream.started_at);
    const now = new Date();
    const diffMs = now.getTime() - started.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) return `${diffHours}h ${diffMinutes}m`;
    return `${diffMinutes}m`;
  };

  const getThumbnailUrl = (): string => {
    return stream.thumbnail_url
      .replace('{width}', '480')
      .replace('{height}', '270');
  };

  // Enhanced interaction handlers
  const handlePress = useCallback(() => {
    HapticFeedback.light();
    
    cardScale.value = withSpring(0.96, { damping: 20 }, () => {
      cardScale.value = withSpring(1.02, { damping: 15 }, () => {
        cardScale.value = withSpring(1, { damping: 12 });
      });
    });
    
    cardElevation.value = withSpring(8, { damping: 15 }, () => {
      cardElevation.value = withSpring(2, { damping: 10 });
    });
    
    onPress();
  }, [onPress]);

  const handleAddToMultiView = useCallback(async () => {
    if (isAdding) return;
    
    HapticFeedback.medium();
    setIsAdding(true);
    
    addButtonScale.value = withSequence(
      withSpring(0.8, { damping: 20 }),
      withSpring(1.2, { damping: 15 }),
      withSpring(1, { damping: 12 })
    );
    
    try {
      const result = await onAddToMultiView();
      if (result.success) {
        HapticFeedback.success();
        // Success animation
        contentOpacity.value = withSequence(
          withTiming(0.7, { duration: 150 }),
          withTiming(1, { duration: 300 })
        );
      } else {
        HapticFeedback.error();
      }
    } finally {
      setIsAdding(false);
    }
  }, [onAddToMultiView, isAdding]);

  const handleToggleFavorite = useCallback(() => {
    HapticFeedback.selection();
    
    favoriteScale.value = withSequence(
      withSpring(0.7, { damping: 20 }),
      withSpring(1.4, { damping: 15 }),
      withSpring(1, { damping: 12 })
    );
    
    onToggleFavorite();
  }, [onToggleFavorite]);

  // Enhanced animated styles
  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    shadowOpacity: interpolate(cardElevation.value, [0, 8], [0.1, 0.3]),
    shadowRadius: interpolate(cardElevation.value, [0, 8], [4, 12]),
    elevation: cardElevation.value,
  }));

  const thumbnailAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: thumbnailScale.value }],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const favoriteAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: favoriteScale.value }],
  }));

  const addButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: addButtonScale.value }],
  }));

  const shimmerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value }],
  }));

  // Start shimmer animation
  React.useEffect(() => {
    if (!imageLoaded && !imageError) {
      shimmerX.value = withRepeat(
        withTiming(width, { duration: 1500, easing: Easing.ease }),
        -1,
        false
      );
    }
  }, [imageLoaded, imageError, width]);

  // Get priority badge info
  const getPriorityBadge = () => {
    if (stream.isHot) {
      return {
        colors: ['#ff416c', '#ff4b2b'],
        icon: <Fire size={12} color="#fff" />,
        text: 'HOT',
        position: 'top-center',
      };
    }
    if (stream.isTrending || showTrending) {
      return {
        colors: ['#ff9a9e', '#fecfef'],
        icon: <TrendingUp size={12} color="#fff" />,
        text: 'TRENDING',
        position: 'top-center',
      };
    }
    if (stream.isRising) {
      return {
        colors: ['#667eea', '#764ba2'],
        icon: <Zap size={12} color="#fff" />,
        text: 'RISING',
        position: 'top-center',
      };
    }
    if (stream.isVeryNew || isNewStreamer) {
      return {
        colors: ['#43e97b', '#38f9d7'],
        icon: <Sparkles size={12} color="#fff" />,
        text: stream.isVeryNew ? 'JUST LIVE' : 'NEW',
        position: 'bottom-right',
      };
    }
    return null;
  };

  const priorityBadge = getPriorityBadge();

  return (
    <AnimatedTouchableOpacity
      style={[styles.container, { width, height: cardHeight }, cardAnimatedStyle]}
      onPress={handlePress}
      activeOpacity={0.95}
      entering={FadeIn.delay(50)}
    >
      {/* Professional Card Container */}
      <View style={styles.card}>
        {/* Enhanced Thumbnail Section */}
        <View style={[styles.thumbnailContainer, { height: thumbnailHeight }]}>
          
          {/* Loading State with Premium Shimmer */}
          {!imageLoaded && !imageError && (
            <View style={styles.thumbnailPlaceholder}>
              <LinearGradient
                colors={['#1a1a2e', '#16213e', '#0f3460']}
                style={styles.placeholderGradient}
              >
                <Animated.View style={[styles.shimmerOverlay, shimmerAnimatedStyle]}>
                  <LinearGradient
                    colors={[
                      'transparent',
                      'rgba(255,255,255,0.1)',
                      'rgba(255,255,255,0.2)',
                      'rgba(255,255,255,0.1)',
                      'transparent',
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.shimmerGradient, { width: width * 0.7 }]}
                  />
                </Animated.View>
                <Play size={40} color="rgba(255,255,255,0.4)" />
              </LinearGradient>
            </View>
          )}

          {/* Error State */}
          {imageError && (
            <View style={styles.thumbnailError}>
              <LinearGradient
                colors={['#2c2c54', '#40407a']}
                style={styles.errorGradient}
              >
                <Eye size={32} color="rgba(255,255,255,0.5)" />
                <Text style={styles.errorText}>Content Unavailable</Text>
              </LinearGradient>
            </View>
          )}

          {/* Actual Thumbnail */}
          <Animated.View style={[styles.thumbnailImageContainer, thumbnailAnimatedStyle]}>
            <Image
              source={{ uri: getThumbnailUrl() }}
              style={[styles.thumbnail, { opacity: imageLoaded ? 1 : 0 }]}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              resizeMode="cover"
            />
          </Animated.View>
          
          {/* Premium Overlay Effects */}
          {imageLoaded && (
            <>
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.6)']}
                style={styles.thumbnailOverlay}
              />
              
              {/* Subtle Inner Shadow */}
              <View style={styles.innerShadow} />
            </>
          )}

          {/* Enhanced Status Indicators */}
          <View style={styles.statusIndicators}>
            {/* Live Indicator */}
            <BlurView intensity={80} style={styles.liveIndicator}>
              <LinearGradient
                colors={['rgba(255, 59, 48, 0.9)', 'rgba(255, 59, 48, 0.7)']}
                style={styles.liveGradient}
              >
                <Circle size={6} color="#fff" fill="#fff" />
                <Text style={styles.liveText}>LIVE</Text>
              </LinearGradient>
            </BlurView>

            {/* Viewer Count */}
            <BlurView intensity={80} style={styles.viewerIndicator}>
              <View style={styles.viewerContent}>
                <Eye size={12} color="rgba(255,255,255,0.9)" />
                <Text style={styles.viewerText}>{formatViewerCount(stream.viewer_count)}</Text>
              </View>
            </BlurView>
          </View>

          {/* Duration Indicator */}
          <View style={styles.durationContainer}>
            <BlurView intensity={80} style={styles.durationIndicator}>
              <View style={styles.durationContent}>
                <Clock size={10} color="rgba(255,255,255,0.8)" />
                <Text style={styles.durationText}>{getStreamDuration()}</Text>
              </View>
            </BlurView>
          </View>

          {/* Priority Badge */}
          {priorityBadge && (
            <View style={[
              styles.priorityBadge,
              priorityBadge.position === 'top-center' ? styles.badgeTopCenter : styles.badgeBottomRight
            ]}>
              <BlurView intensity={80} style={styles.priorityBadgeBlur}>
                <LinearGradient
                  colors={priorityBadge.colors}
                  style={styles.priorityBadgeGradient}
                >
                  {priorityBadge.icon}
                  <Text style={styles.priorityBadgeText}>{priorityBadge.text}</Text>
                </LinearGradient>
              </BlurView>
            </View>
          )}

          {/* Professional Action Buttons */}
          <View style={styles.actionButtons}>
            {/* Favorite Button */}
            <AnimatedTouchableOpacity
              style={[styles.actionButton, favoriteAnimatedStyle]}
              onPress={handleToggleFavorite}
            >
              <BlurView intensity={80} style={styles.actionBlur}>
                <LinearGradient
                  colors={isFavorite 
                    ? ['rgba(255, 59, 48, 0.9)', 'rgba(255, 59, 48, 0.7)'] 
                    : ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']
                  }
                  style={styles.actionGradient}
                >
                  <Heart
                    size={16}
                    color={isFavorite ? "#fff" : "rgba(255,255,255,0.8)"}
                    fill={isFavorite ? "#fff" : "transparent"}
                  />
                </LinearGradient>
              </BlurView>
            </AnimatedTouchableOpacity>

            {/* Add to Multi-View Button */}
            <AnimatedTouchableOpacity
              style={[styles.actionButton, addButtonAnimatedStyle]}
              onPress={handleAddToMultiView}
              disabled={isAdding}
            >
              <BlurView intensity={80} style={styles.actionBlur}>
                <LinearGradient
                  colors={isActive
                    ? ['rgba(52, 211, 153, 0.9)', 'rgba(34, 197, 94, 0.7)']
                    : isAdding
                    ? ['rgba(156, 163, 175, 0.8)', 'rgba(107, 114, 128, 0.6)']
                    : ['rgba(102, 126, 234, 0.9)', 'rgba(118, 75, 162, 0.7)']
                  }
                  style={styles.actionGradient}
                >
                  {isActive ? (
                    <CheckCircle size={16} color="#fff" />
                  ) : isAdding ? (
                    <Clock size={16} color="#fff" />
                  ) : (
                    <Plus size={16} color="#fff" />
                  )}
                </LinearGradient>
              </BlurView>
            </AnimatedTouchableOpacity>
          </View>
        </View>

        {/* Enhanced Content Section */}
        <Animated.View style={[styles.contentSection, { height: contentHeight }, contentAnimatedStyle]}>
          <View style={styles.contentPadding}>
            {/* Game Category with Icon */}
            <View style={styles.gameCategory}>
              <Gamepad2 size={12} color="#667eea" />
              <Text style={styles.gameName} numberOfLines={1}>
                {stream.game_name}
              </Text>
            </View>

            {/* Stream Title */}
            <Text style={styles.streamTitle} numberOfLines={2}>
              {stream.title}
            </Text>

            {/* Streamer Info Row */}
            <View style={styles.streamerRow}>
              <View style={styles.streamerInfo}>
                <Text style={styles.streamerName} numberOfLines={1}>
                  {stream.user_name}
                </Text>
                <View style={styles.languageBadge}>
                  <Text style={styles.languageText}>
                    {stream.language.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>
      </View>

      {/* Active State Border */}
      {isActive && (
        <View style={styles.activeBorder}>
          <LinearGradient
            colors={['#34d399', '#22c55e']}
            style={styles.activeBorderGradient}
          />
        </View>
      )}

      {/* Professional Shadow Enhancement */}
      <View style={[
        styles.cardShadow,
        {
          shadowColor: isActive ? '#22c55e' : stream.isHot ? '#ff4b2b' : '#667eea',
        }
      ]} />
    </AnimatedTouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 8,
  },
  card: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardShadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    zIndex: -1,
  },
  thumbnailContainer: {
    position: 'relative',
    overflow: 'hidden',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  thumbnailImageContainer: {
    width: '100%',
    height: '100%',
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
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: -200,
  },
  shimmerGradient: {
    flex: 1,
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
    gap: 12,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  thumbnailOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
  },
  innerShadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  statusIndicators: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  liveIndicator: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  liveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  viewerIndicator: {
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  viewerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  viewerText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  durationContainer: {
    position: 'absolute',
    bottom: 12,
    left: 12,
  },
  durationIndicator: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  durationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    gap: 3,
  },
  durationText: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
  },
  priorityBadge: {
    position: 'absolute',
    borderRadius: 12,
    overflow: 'hidden',
  },
  badgeTopCenter: {
    top: 12,
    left: '50%',
    marginLeft: -24,
  },
  badgeBottomRight: {
    bottom: 12,
    right: 12,
  },
  priorityBadgeBlur: {
    borderRadius: 12,
  },
  priorityBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  priorityBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  actionButtons: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'column',
    gap: 8,
  },
  actionButton: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  actionBlur: {
    borderRadius: 18,
  },
  actionGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentSection: {
    backgroundColor: '#1a1a2e',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  contentPadding: {
    padding: 16,
    justifyContent: 'space-between',
    flex: 1,
  },
  gameCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  gameName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#667eea',
    flex: 1,
  },
  streamTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    lineHeight: 18,
    flex: 1,
    marginBottom: 8,
  },
  streamerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  streamerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  streamerName: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
    flex: 1,
  },
  languageBadge: {
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  languageText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#667eea',
  },
  activeBorder: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 22,
    padding: 2,
  },
  activeBorderGradient: {
    flex: 1,
    borderRadius: 20,
  },
});

export default ProfessionalStreamCard;