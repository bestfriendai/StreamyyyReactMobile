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
import { MotiView, MotiText, AnimatePresence } from 'moti';
import { BlurView } from '@react-native-community/blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import {
  Play,
  Heart,
  Users,
  Eye,
  Plus,
  Check,
  Star,
  Clock,
  Gamepad2,
} from 'lucide-react-native';

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
    scale.value = withSpring(0.95, { damping: 15 }, () => {
      scale.value = withSpring(1);
    });
  };

  const handleLongPress = () => {
    scale.value = withSpring(1.05, { damping: 12 });
    elevation.value = withTiming(8, { duration: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
    elevation.value = withTiming(0, { duration: 200 });
  };

  const handleAddPress = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    addButtonRotation.value = withTiming(360, { duration: 500 });
    
    try {
      const result = await onAdd(stream);
      if (result.success) {
        runOnJS(setShowSuccess)(true);
        successOpacity.value = withTiming(1, { duration: 300 }, () => {
          successOpacity.value = withTiming(0, { duration: 300, delay: 1500 }, () => {
            runOnJS(setShowSuccess)(false);
          });
        });
      }
    } catch (error) {
      console.error('Error adding stream:', error);
    } finally {
      setIsLoading(false);
      addButtonRotation.value = 0;
    }
  };

  const handleFavoritePress = () => {
    heartScale.value = withSpring(1.3, { damping: 10 }, () => {
      heartScale.value = withSpring(1);
    });
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
        scale: interpolate(successOpacity.value, [0, 1], [0.5, 1]) 
      }
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
            colors={isActive 
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
                    uri: stream.thumbnail_url
                      .replace('{width}', '320')
                      .replace('{height}', '180')
                  }}
                  style={styles.thumbnail}
                  onLoad={() => setIsImageLoaded(true)}
                />
              </MotiView>

              {/* Loading skeleton */}
              {!isImageLoaded && (
                <MotiView
                  from={{ opacity: 0.5 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    type: 'timing',
                    duration: 1000,
                    loop: true,
                    repeatReverse: true,
                  }}
                  style={styles.thumbnailSkeleton}
                />
              )}

              {/* Live indicator */}
              <MotiView
                from={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{
                  type: 'spring',
                  damping: 12,
                  loop: true,
                  repeatReverse: true,
                }}
                style={styles.liveIndicator}
              >
                <BlurView blurType="dark" blurAmount={10} style={styles.liveBlur}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>LIVE</Text>
                </BlurView>
              </MotiView>

              {/* Viewer count */}
              <View style={styles.viewerCountContainer}>
                <BlurView blurType="dark" blurAmount={10} style={styles.viewerBlur}>
                  <Eye size={12} color="#fff" />
                  <Text style={styles.viewerCount}>
                    {formatViewerCount(stream.viewer_count)}
                  </Text>
                </BlurView>
              </View>

              {/* Stream duration */}
              <View style={styles.durationContainer}>
                <BlurView blurType="dark" blurAmount={10} style={styles.durationBlur}>
                  <Clock size={12} color="#8B5CF6" />
                  <Text style={styles.durationText}>
                    {getTimeSinceStart(stream.started_at)}
                  </Text>
                </BlurView>
              </View>

              {/* Active indicator */}
              {isActive && (
                <MotiView
                  from={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={styles.activeIndicator}
                >
                  <LinearGradient
                    colors={['#8B5CF6', '#7C3AED']}
                    style={styles.activeGradient}
                  >
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
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleFavoritePress}
                >
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
                  <Text style={styles.ratingText}>
                    {(Math.random() * 2 + 3).toFixed(1)}
                  </Text>
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
                      colors={isActive
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
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(26, 26, 26, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  touchable: {
    overflow: 'hidden',
  },
  cardBackground: {
    flex: 1,
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
    backgroundColor: '#333',
  },
  liveIndicator: {
    position: 'absolute',
    top: 12,
    left: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  liveBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
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
    borderRadius: 8,
    overflow: 'hidden',
  },
  viewerBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
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
    borderRadius: 8,
    overflow: 'hidden',
  },
  durationBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  durationText: {
    color: '#8B5CF6',
    fontSize: 11,
    fontWeight: '600',
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
    borderRadius: 12,
    overflow: 'hidden',
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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