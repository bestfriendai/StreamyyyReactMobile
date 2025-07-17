import { BlurView } from '@react-native-community/blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Heart, Users, Eye, Plus, Check, Star, Clock, Gamepad2 } from 'lucide-react-native';
import { MotiView, MotiText, AnimatePresence } from 'moti';
import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Text,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TwitchStream {
  id: string;
  user_id: string;
  user_login: string;
  user_name: string;
  game_id: string;
  game_name: string;
  type: string;
  title: string;
  viewer_count: number;
  started_at: string;
  language: string;
  thumbnail_url: string;
  tag_ids: string[];
  is_mature: boolean;
}

interface StreamCardProps {
  stream: TwitchStream;
  onAdd: (stream: TwitchStream) => Promise<{ success: boolean; message: string }>;
  onToggleFavorite: (userId: string) => void;
  isFavorite: boolean;
  isActive: boolean;
  showAddButton?: boolean;
}

export const EnhancedStreamCard: React.FC<StreamCardProps> = ({
  stream,
  onAdd,
  onToggleFavorite,
  isFavorite,
  isActive,
  showAddButton = true,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Animation values
  const scale = useSharedValue(1);
  const elevation = useSharedValue(0);
  const heartScale = useSharedValue(1);
  const addButtonRotation = useSharedValue(0);
  const successOpacity = useSharedValue(0);

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(0.92, { damping: 20 }),
      withSpring(1.02, { damping: 15 }),
      withSpring(1, { damping: 20 })
    );
  };

  const handleLongPress = () => {
    scale.value = withSpring(1.08, { damping: 12 });
    elevation.value = withTiming(12, { duration: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 20 });
    elevation.value = withTiming(0, { duration: 300 });
  };

  const handleAddPress = async () => {
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    addButtonRotation.value = withSequence(
      withTiming(180, { duration: 250 }),
      withTiming(360, { duration: 250 })
    );

    try {
      const result = await onAdd(stream);
      if (result.success) {
        runOnJS(setShowSuccess)(true);
        successOpacity.value = withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(1, { duration: 1200 }),
          withTiming(0, { duration: 400 }, () => {
            runOnJS(setShowSuccess)(false);
          })
        );
      }
    } catch (error) {
      console.error('Error adding stream:', error);
    } finally {
      setIsLoading(false);
      addButtonRotation.value = 0;
    }
  };

  const handleFavoritePress = () => {
    heartScale.value = withSequence(
      withSpring(1.4, { damping: 12 }),
      withSpring(0.9, { damping: 15 }),
      withSpring(1.1, { damping: 20 }),
      withSpring(1, { damping: 25 })
    );
    onToggleFavorite(stream.user_id);
  };

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    shadowOpacity: interpolate(elevation.value, [0, 8], [0.1, 0.3]),
    shadowRadius: interpolate(elevation.value, [0, 8], [4, 12]),
    elevation: elevation.value,
  }));

  const animatedHeartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const animatedAddButtonStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${addButtonRotation.value}deg` }],
  }));

  const animatedSuccessStyle = useAnimatedStyle(() => ({
    opacity: successOpacity.value,
    transform: [
      {
        scale: interpolate(successOpacity.value, [0, 1], [0.5, 1]),
      },
    ],
  }));

  const formatViewerCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const getTimeSinceStart = (startedAt: string): string => {
    const now = new Date();
    const start = new Date(startedAt);
    const diffMs = now.getTime() - start.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    }
    return `${diffMinutes}m`;
  };

  return (
    <MotiView
      from={{
        opacity: 0,
        scale: 0.8,
        translateY: 20,
      }}
      animate={{
        opacity: 1,
        scale: 1,
        translateY: 0,
      }}
      transition={{
        type: 'spring',
        damping: 15,
        stiffness: 150,
        delay: Math.random() * 200,
      }}
      style={styles.container}
    >
      <Animated.View style={[styles.card, animatedCardStyle]}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handlePress}
          onLongPress={handleLongPress}
          onPressOut={handlePressOut}
          style={styles.touchable}
        >
          {/* Background gradient */}
          <LinearGradient
            colors={
              isActive
                ? ['rgba(139, 92, 246, 0.2)', 'rgba(124, 58, 237, 0.1)', 'rgba(15, 15, 15, 0.95)']
                : ['rgba(26, 26, 26, 0.95)', 'rgba(15, 15, 15, 0.98)', 'rgba(10, 10, 10, 1)']
            }
            style={styles.cardBackground}
          >
            {/* Thumbnail section */}
            <View style={styles.thumbnailContainer}>
              <MotiView
                animate={{
                  opacity: isImageLoaded ? 1 : 0,
                }}
                transition={{ duration: 300 }}
              >
                <Image
                  source={{
                    uri: stream.thumbnail_url.replace('{width}', '320').replace('{height}', '180'),
                  }}
                  style={styles.thumbnail}
                  onLoad={() => setIsImageLoaded(true)}
                />
              </MotiView>

              {/* Enhanced loading skeleton */}
              {!isImageLoaded && (
                <MotiView
                  from={{ opacity: 0.3, scale: 0.95 }}
                  animate={{ opacity: 0.7, scale: 1 }}
                  transition={{
                    type: 'timing',
                    duration: 1200,
                    loop: true,
                    repeatReverse: true,
                  }}
                  style={styles.thumbnailSkeleton}
                >
                  <LinearGradient
                    colors={[
                      'rgba(51, 51, 51, 0.8)',
                      'rgba(68, 68, 68, 0.9)',
                      'rgba(51, 51, 51, 0.8)',
                    ]}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                  <View style={styles.skeletonIcon}>
                    <Play size={32} color="rgba(255, 255, 255, 0.3)" />
                  </View>
                </MotiView>
              )}

              {/* Enhanced live indicator */}
              <MotiView
                from={{ scale: 0.8, opacity: 0.8 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  type: 'spring',
                  damping: 12,
                  loop: true,
                  repeatReverse: true,
                }}
                style={styles.liveIndicator}
              >
                <LinearGradient
                  colors={['rgba(255, 68, 68, 0.95)', 'rgba(220, 38, 38, 0.9)']}
                  style={styles.liveGradient}
                >
                  <MotiView
                    from={{ scale: 0.8 }}
                    animate={{ scale: 1.2 }}
                    transition={{
                      type: 'timing',
                      duration: 1000,
                      loop: true,
                      repeatReverse: true,
                    }}
                    style={styles.liveDot}
                  />
                  <Text style={styles.liveText}>LIVE</Text>
                </LinearGradient>
              </MotiView>

              {/* Enhanced viewer count */}
              <MotiView
                from={{ opacity: 0, translateY: -10 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: 300 }}
                style={styles.viewerCountContainer}
              >
                <LinearGradient
                  colors={['rgba(0, 0, 0, 0.8)', 'rgba(0, 0, 0, 0.6)']}
                  style={styles.viewerGradient}
                >
                  <Eye size={12} color="#fff" />
                  <Text style={styles.viewerCount}>{formatViewerCount(stream.viewer_count)}</Text>
                </LinearGradient>
              </MotiView>

              {/* Enhanced stream duration */}
              <MotiView
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: 400 }}
                style={styles.durationContainer}
              >
                <LinearGradient
                  colors={['rgba(139, 92, 246, 0.9)', 'rgba(124, 58, 237, 0.8)']}
                  style={styles.durationGradient}
                >
                  <Clock size={12} color="#fff" />
                  <Text style={styles.durationText}>{getTimeSinceStart(stream.started_at)}</Text>
                </LinearGradient>
              </MotiView>

              {/* Active indicator */}
              {isActive && (
                <MotiView
                  from={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={styles.activeIndicator}
                >
                  <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.activeGradient}>
                    <Play size={16} color="#fff" fill="#fff" />
                  </LinearGradient>
                </MotiView>
              )}
            </View>

            {/* Content section */}
            <View style={styles.content}>
              {/* Streamer info */}
              <View style={styles.streamerInfo}>
                <MotiText
                  style={styles.streamerName}
                  numberOfLines={1}
                  from={{ opacity: 0, translateX: -10 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={{ delay: 200 }}
                >
                  {stream.user_name}
                </MotiText>

                <View style={styles.gameInfo}>
                  <Gamepad2 size={14} color="#666" />
                  <MotiText
                    style={styles.gameName}
                    numberOfLines={1}
                    from={{ opacity: 0, translateX: -10 }}
                    animate={{ opacity: 1, translateX: 0 }}
                    transition={{ delay: 300 }}
                  >
                    {stream.game_name || 'Just Chatting'}
                  </MotiText>
                </View>
              </View>

              {/* Stream title */}
              <MotiText
                style={styles.streamTitle}
                numberOfLines={2}
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: 400 }}
              >
                {stream.title}
              </MotiText>

              {/* Actions */}
              <View style={styles.actions}>
                {/* Favorite button */}
                <TouchableOpacity style={styles.actionButton} onPress={handleFavoritePress}>
                  <Animated.View style={animatedHeartStyle}>
                    <Heart
                      size={20}
                      color={isFavorite ? '#FF4444' : '#666'}
                      fill={isFavorite ? '#FF4444' : 'transparent'}
                    />
                  </Animated.View>
                </TouchableOpacity>

                {/* Rating */}
                <View style={styles.ratingContainer}>
                  <Star size={14} color="#FFD700" fill="#FFD700" />
                  <Text style={styles.ratingText}>{(Math.random() * 2 + 3).toFixed(1)}</Text>
                </View>

                {/* Add button */}
                {showAddButton && (
                  <TouchableOpacity
                    style={[
                      styles.addButton,
                      isActive && styles.addButtonActive,
                      isLoading && styles.addButtonLoading,
                    ]}
                    onPress={handleAddPress}
                    disabled={isLoading || isActive}
                  >
                    <LinearGradient
                      colors={
                        isActive
                          ? ['#10B981', '#059669']
                          : isLoading
                            ? ['#6B7280', '#4B5563']
                            : ['#8B5CF6', '#7C3AED']
                      }
                      style={styles.addButtonGradient}
                    >
                      <Animated.View style={animatedAddButtonStyle}>
                        {isActive ? (
                          <Check size={16} color="#fff" />
                        ) : (
                          <Plus size={16} color="#fff" />
                        )}
                      </Animated.View>
                      <Text style={styles.addButtonText}>
                        {isActive ? 'Added' : isLoading ? 'Adding...' : 'Add'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Success overlay */}
        <AnimatePresence>
          {showSuccess && (
            <Animated.View style={[styles.successOverlay, animatedSuccessStyle]}>
              <BlurView blurType="dark" blurAmount={20} style={styles.successBlur}>
                <Check size={32} color="#10B981" />
                <Text style={styles.successText}>Added!</Text>
              </BlurView>
            </Animated.View>
          )}
        </AnimatePresence>
      </Animated.View>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(26, 26, 26, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
    ...Platform.select({
      ios: {
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  touchable: {
    overflow: 'hidden',
  },
  cardBackground: {
    flex: 1,
    borderRadius: 20,
  },
  thumbnailContainer: {
    height: 180,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1a1a',
  },
  thumbnailSkeleton: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(51, 51, 51, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  skeletonIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveIndicator: {
    position: 'absolute',
    top: 12,
    left: 12,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#ff4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 4,
  },
  liveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ff4444',
  },
  liveText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  viewerCountContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  viewerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 5,
  },
  viewerCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  durationContainer: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 3,
  },
  durationGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 5,
  },
  durationText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    borderRadius: 20,
    overflow: 'hidden',
  },
  activeGradient: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
  },
  streamerInfo: {
    marginBottom: 8,
  },
  streamerName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  gameInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gameName: {
    color: '#666',
    fontSize: 12,
    flex: 1,
  },
  streamTitle: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    marginLeft: 8,
  },
  ratingText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '600',
  },
  addButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonActive: {
    opacity: 0.8,
  },
  addButtonLoading: {
    opacity: 0.6,
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successBlur: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
  },
  successText: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '600',
  },
});
