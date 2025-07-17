import { BlurView } from '@react-native-community/blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Heart, Users, Eye, Plus, Check, Star, Clock } from 'lucide-react-native';
import { MotiView, MotiText } from 'moti';
import React, { useState } from 'react';
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

interface ModernStreamCardProps {
  stream: TwitchStream;
  onPress?: () => void;
  onAdd?: (stream: TwitchStream) => Promise<{ success: boolean; message: string }>;
  onAddToMultiView?: () => void | Promise<{ success: boolean; message: string }>;
  onToggleFavorite: (userId: string) => void;
  isFavorite: boolean;
  isActive: boolean;
  width?: number;
  showAddButton?: boolean;
  showTrending?: boolean;
  isNewStreamer?: boolean;
}

export const ModernStreamCard: React.FC<ModernStreamCardProps> = ({
  stream,
  onPress,
  onAdd,
  onAddToMultiView,
  onToggleFavorite,
  isFavorite,
  isActive,
  width,
  showAddButton = true,
  showTrending = false,
  isNewStreamer = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Animation values
  const scale = useSharedValue(1);
  const heartScale = useSharedValue(1);
  const successOpacity = useSharedValue(0);

  const handlePress = () => {
    scale.value = withSpring(0.98, { damping: 15 }, () => {
      scale.value = withSpring(1, { damping: 15 });
    });
    onPress?.();
  };

  const handleAddPress = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      let result = { success: false, message: 'Unknown error' };
      
      if (onAddToMultiView) {
        const possibleResult = onAddToMultiView();
        if (possibleResult && typeof possibleResult.then === 'function') {
          result = await possibleResult;
        } else {
          result = { success: true, message: 'Stream added successfully' };
        }
      } else if (onAdd) {
        result = await onAdd(stream);
      }

      if (result.success) {
        runOnJS(setShowSuccess)(true);
        successOpacity.value = withTiming(1, { duration: 300 }, () => {
          successOpacity.value = withTiming(0, { duration: 300 }, () => {
            runOnJS(setShowSuccess)(false);
          });
        });
      }
    } catch (error) {
      console.error('Error adding stream:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFavoritePress = () => {
    heartScale.value = withSpring(1.3, { damping: 10 }, () => {
      heartScale.value = withSpring(1, { damping: 10 });
    });
    onToggleFavorite(stream.user_id);
  };

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedHeartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const animatedSuccessStyle = useAnimatedStyle(() => ({
    opacity: successOpacity.value,
  }));

  const formatViewerCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const getTimeSinceStart = (startedAt: string): string => {
    const now = new Date();
    const start = new Date(startedAt);
    const diffMs = now.getTime() - start.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) return `${diffHours}h ${diffMinutes}m`;
    return `${diffMinutes}m`;
  };

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.95, translateY: 20 }}
      animate={{ opacity: 1, scale: 1, translateY: 0 }}
      transition={{
        type: 'timing',
        duration: 400,
        delay: Math.random() * 200,
      }}
      style={[styles.container, width && { width }]}
    >
      <Animated.View style={[styles.card, animatedCardStyle]}>
        <TouchableOpacity
          activeOpacity={0.95}
          onPress={handlePress}
          style={styles.touchable}
        >
          {/* Thumbnail Container */}
          <View style={styles.thumbnailContainer}>
            <Image
              source={{
                uri: stream.thumbnail_url.replace('{width}', '320').replace('{height}', '180'),
              }}
              style={styles.thumbnail}
              onLoad={() => setIsImageLoaded(true)}
            />
            
            {/* Gradient Overlay */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)']}
              style={styles.thumbnailOverlay}
            />

            {/* Live Badge */}
            <View style={styles.liveBadge}>
              <Text style={styles.liveText}>LIVE</Text>
            </View>

            {/* Viewer Count */}
            <View style={styles.viewerBadge}>
              <Eye size={12} color="#fff" />
              <Text style={styles.viewerText}>{formatViewerCount(stream.viewer_count)}</Text>
            </View>

            {/* Duration */}
            <View style={styles.durationBadge}>
              <Clock size={12} color="#fff" />
              <Text style={styles.durationText}>{getTimeSinceStart(stream.started_at)}</Text>
            </View>

            {/* Play Button */}
            <View style={styles.playButton}>
              <Play size={24} color="#fff" fill="#fff" />
            </View>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.streamInfo}>
              <Text style={styles.streamTitle} numberOfLines={2}>
                {stream.title}
              </Text>
              
              <View style={styles.channelInfo}>
                <Text style={styles.channelName}>{stream.user_name}</Text>
                <Text style={styles.gameCategory}>{stream.game_name || 'Just Chatting'}</Text>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.favoriteButton}
                onPress={handleFavoritePress}
                activeOpacity={0.7}
              >
                <Animated.View style={animatedHeartStyle}>
                  <Heart
                    size={18}
                    color={isFavorite ? '#ef4444' : '#6b7280'}
                    fill={isFavorite ? '#ef4444' : 'transparent'}
                  />
                </Animated.View>
              </TouchableOpacity>

              {showAddButton && (
                <TouchableOpacity
                  style={[
                    styles.addButton,
                    isActive && styles.addButtonActive,
                    isLoading && styles.addButtonLoading,
                  ]}
                  onPress={handleAddPress}
                  disabled={isLoading || isActive}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={
                      isActive
                        ? ['#22c55e', '#16a34a']
                        : isLoading
                          ? ['#6b7280', '#4b5563']
                          : ['#3b82f6', '#2563eb']
                    }
                    style={styles.addButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {isActive ? (
                      <Check size={16} color="#fff" strokeWidth={2.5} />
                    ) : (
                      <Plus size={16} color="#fff" strokeWidth={2.5} />
                    )}
                    <Text style={styles.addButtonText}>
                      {isActive ? 'Added' : isLoading ? 'Adding...' : 'Add'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </TouchableOpacity>

        {/* Success Overlay */}
        {showSuccess && (
          <Animated.View style={[styles.successOverlay, animatedSuccessStyle]}>
            <BlurView intensity={20} style={styles.successBlur}>
              <Check size={32} color="#22c55e" strokeWidth={3} />
              <Text style={styles.successText}>Added!</Text>
            </BlurView>
          </Animated.View>
        )}
      </Animated.View>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  touchable: {
    overflow: 'hidden',
  },
  thumbnailContainer: {
    aspectRatio: 16 / 9,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#27272a',
  },
  thumbnailOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  liveBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#ef4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  liveText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  viewerBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
  },
  viewerText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
  },
  durationText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 48,
    height: 48,
    marginLeft: -24,
    marginTop: -24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 12,
  },
  streamInfo: {
    marginBottom: 8,
  },
  streamTitle: {
    color: '#f4f4f5',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 4,
  },
  channelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  channelName: {
    color: '#a1a1aa',
    fontSize: 12,
    fontWeight: '500',
  },
  gameCategory: {
    color: '#71717a',
    fontSize: 12,
    fontWeight: '400',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  favoriteButton: {
    padding: 8,
  },
  addButton: {
    borderRadius: 16,
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successBlur: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  successText: {
    color: '#22c55e',
    fontSize: 14,
    fontWeight: '600',
  },
});