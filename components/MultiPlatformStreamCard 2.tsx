import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView, MotiText } from 'moti';
import { BlurViewFallback as BlurView } from './BlurViewFallback';
import {
  Play,
  Heart,
  Share2,
  Users,
  Clock,
  Star,
  Plus,
  Eye,
  MessageCircle,
  BookmarkPlus,
  ExternalLink,
  TrendingUp,
  Award,
  Zap,
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { UnifiedStream } from '@/services/platformService';
import { socialService } from '@/services/socialService';
import { notificationService } from '@/services/notificationService';
import { discordService } from '@/services/discordService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 32;

interface MultiPlatformStreamCardProps {
  stream: UnifiedStream;
  onPress: (stream: UnifiedStream) => void;
  onAdd?: (stream: UnifiedStream) => void;
  onToggleFavorite?: (stream: UnifiedStream) => void;
  isFavorite?: boolean;
  isActive?: boolean;
  showAddButton?: boolean;
  showSocialFeatures?: boolean;
  userId?: string;
  compact?: boolean;
}

const platformConfig = {
  twitch: {
    color: '#9146FF',
    gradient: ['#9146FF', '#772CE8'],
    icon: '🟣',
    name: 'Twitch',
  },
  youtube: {
    color: '#FF0000',
    gradient: ['#FF0000', '#CC0000'],
    icon: '🔴',
    name: 'YouTube',
  },
  kick: {
    color: '#53FC18',
    gradient: ['#53FC18', '#3FBF12'],
    icon: '🟢',
    name: 'Kick',
  },
};

export const MultiPlatformStreamCard: React.FC<MultiPlatformStreamCardProps> = ({
  stream,
  onPress,
  onAdd,
  onToggleFavorite,
  isFavorite = false,
  isActive = false,
  showAddButton = true,
  showSocialFeatures = true,
  userId,
  compact = false,
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [shareCount, setShareCount] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Animation values
  const scale = useSharedValue(1);
  const favoriteScale = useSharedValue(1);
  const likeScale = useSharedValue(1);
  const expandHeight = useSharedValue(0);
  const opacity = useSharedValue(1);

  const platform = platformConfig[stream.platform as keyof typeof platformConfig];

  useEffect(() => {
    // Animate card entrance
    scale.value = withSpring(1, { damping: 15 });
    opacity.value = withTiming(1, { duration: 300 });
  }, []);

  const handlePress = () => {
    scale.value = withSpring(0.95, { damping: 15 }, () => {
      scale.value = withSpring(1);
      runOnJS(onPress)(stream);
    });
  };

  const handleAdd = () => {
    if (onAdd) {
      scale.value = withSpring(0.95, { damping: 15 }, () => {
        scale.value = withSpring(1);
        runOnJS(onAdd)(stream);
      });
    }
  };

  const handleToggleFavorite = async () => {
    favoriteScale.value = withSpring(0.8, { damping: 15 }, () => {
      favoriteScale.value = withSpring(1);
    });
    
    if (onToggleFavorite) {
      onToggleFavorite(stream);
    }

    // Track social activity
    if (userId && !isFavorite) {
      try {
        await socialService.followStreamer(userId, stream.streamerName, stream.platform);
        await notificationService.sendStreamLiveNotification(stream, userId);
      } catch (error) {
        console.error('Failed to follow streamer:', error);
      }
    }
  };

  const handleLike = async () => {
    likeScale.value = withSpring(0.8, { damping: 15 }, () => {
      likeScale.value = withSpring(1);
    });
    
    setIsLiked(!isLiked);
    
    if (userId) {
      try {
        // Track like activity
        await socialService.trackActivity({
          userId,
          type: 'stream_watched',
          title: `Liked ${stream.streamerDisplayName}'s stream`,
          description: stream.title,
          metadata: {
            streamId: stream.id,
            platform: stream.platform,
            streamerName: stream.streamerName,
          },
          isPublic: true,
        });
      } catch (error) {
        console.error('Failed to track like activity:', error);
      }
    }
  };

  const handleShare = async () => {
    setShareCount(prev => prev + 1);
    
    if (userId) {
      try {
        await socialService.shareStream(stream, 'native');
        
        // Create social post
        await socialService.createPost({
          authorId: userId,
          author: {
            username: 'user',
            displayName: 'User',
            avatar: '',
            verified: false,
          },
          content: `Check out this amazing stream by ${stream.streamerDisplayName}!`,
          type: 'stream_share',
          attachments: [{
            type: 'stream',
            url: stream.embedUrl,
            metadata: {
              title: stream.title,
              platform: stream.platform,
              thumbnailUrl: stream.thumbnailUrl,
              viewerCount: stream.viewerCount,
            },
          }],
          visibility: 'public',
          tags: [stream.platform, stream.category],
          mentions: [],
          streamId: stream.id,
        });
      } catch (error) {
        console.error('Failed to share stream:', error);
      }
    }
  };

  const handleDiscordShare = async () => {
    try {
      await discordService.sendStreamNotification(stream);
    } catch (error) {
      console.error('Failed to share to Discord:', error);
    }
  };

  const handleExpand = () => {
    setIsExpanded(!isExpanded);
    expandHeight.value = withTiming(isExpanded ? 0 : 120, { duration: 300 });
  };

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const animatedFavoriteStyle = useAnimatedStyle(() => ({
    transform: [{ scale: favoriteScale.value }],
  }));

  const animatedLikeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: likeScale.value }],
  }));

  const animatedExpandStyle = useAnimatedStyle(() => ({
    height: expandHeight.value,
    opacity: interpolate(expandHeight.value, [0, 120], [0, 1]),
  }));

  const formatViewerCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const formatDuration = (startedAt: string) => {
    const now = new Date();
    const start = new Date(startedAt);
    const diffMs = now.getTime() - start.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    } else {
      return `${diffMinutes}m`;
    }
  };

  const getTrendingScore = () => {
    // Simple trending algorithm based on viewer count and time
    const viewerMultiplier = Math.min(stream.viewerCount / 1000, 10);
    const timeMultiplier = Math.max(1, 24 - new Date().getHours());
    return Math.round(viewerMultiplier * timeMultiplier);
  };

  const isHighViewerCount = stream.viewerCount > 10000;
  const isNewStream = Date.now() - new Date(stream.startedAt).getTime() < 3600000; // Less than 1 hour
  const trendingScore = getTrendingScore();

  return (
    <Animated.View style={[styles.container, animatedCardStyle]}>
      <TouchableOpacity
        onPress={handlePress}
        style={styles.touchable}
        activeOpacity={0.9}
      >
        <BlurView style={styles.card} blurType="dark" blurAmount={10}>
          <LinearGradient
            colors={[
              'rgba(255, 255, 255, 0.05)',
              'rgba(255, 255, 255, 0.02)',
              'transparent',
            ]}
            style={styles.cardGradient}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.platformBadge}>
                <LinearGradient
                  colors={platform.gradient}
                  style={styles.platformGradient}
                >
                  <Text style={styles.platformEmoji}>{platform.icon}</Text>
                  <Text style={styles.platformText}>{platform.name}</Text>
                </LinearGradient>
              </View>
              
              <View style={styles.headerIcons}>
                {isHighViewerCount && (
                  <View style={styles.badge}>
                    <TrendingUp size={12} color="#FFD700" />
                    <Text style={styles.badgeText}>Hot</Text>
                  </View>
                )}
                
                {isNewStream && (
                  <View style={[styles.badge, { backgroundColor: 'rgba(34, 197, 94, 0.2)' }]}>
                    <Zap size={12} color="#22C55E" />
                    <Text style={styles.badgeText}>New</Text>
                  </View>
                )}
                
                <Animated.View style={animatedFavoriteStyle}>
                  <TouchableOpacity onPress={handleToggleFavorite} style={styles.iconButton}>
                    <Heart
                      size={18}
                      color={isFavorite ? '#FF6B6B' : '#666'}
                      fill={isFavorite ? '#FF6B6B' : 'transparent'}
                    />
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </View>

            {/* Main Content */}
            <View style={styles.mainContent}>
              <View style={styles.thumbnailContainer}>
                <Image
                  source={{ uri: stream.thumbnailUrl }}
                  style={styles.thumbnail}
                  resizeMode="cover"
                />
                
                {/* Live Indicator */}
                <View style={styles.liveIndicator}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
                
                {/* Viewer Count */}
                <View style={styles.viewerBadge}>
                  <Eye size={12} color="#fff" />
                  <Text style={styles.viewerText}>{formatViewerCount(stream.viewerCount)}</Text>
                </View>
                
                {/* Duration */}
                <View style={styles.durationBadge}>
                  <Clock size={12} color="#fff" />
                  <Text style={styles.durationText}>{formatDuration(stream.startedAt)}</Text>
                </View>
              </View>

              <View style={styles.contentInfo}>
                <View style={styles.streamerInfo}>
                  <Image
                    source={{ uri: stream.profileImageUrl }}
                    style={styles.avatar}
                    resizeMode="cover"
                  />
                  <View style={styles.streamerDetails}>
                    <Text style={styles.streamerName} numberOfLines={1}>
                      {stream.streamerDisplayName}
                    </Text>
                    <Text style={styles.category} numberOfLines={1}>
                      {stream.category}
                    </Text>
                  </View>
                </View>

                <Text style={styles.title} numberOfLines={compact ? 2 : 3}>
                  {stream.title}
                </Text>

                {/* Social Features */}
                {showSocialFeatures && (
                  <View style={styles.socialActions}>
                    <Animated.View style={animatedLikeStyle}>
                      <TouchableOpacity onPress={handleLike} style={styles.socialButton}>
                        <Heart
                          size={16}
                          color={isLiked ? '#FF6B6B' : '#666'}
                          fill={isLiked ? '#FF6B6B' : 'transparent'}
                        />
                        <Text style={styles.socialText}>Like</Text>
                      </TouchableOpacity>
                    </Animated.View>
                    
                    <TouchableOpacity onPress={handleShare} style={styles.socialButton}>
                      <Share2 size={16} color="#666" />
                      <Text style={styles.socialText}>Share</Text>
                      {shareCount > 0 && (
                        <View style={styles.countBadge}>
                          <Text style={styles.countText}>{shareCount}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                    
                    <TouchableOpacity onPress={handleDiscordShare} style={styles.socialButton}>
                      <MessageCircle size={16} color="#7289DA" />
                      <Text style={styles.socialText}>Discord</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity onPress={handleExpand} style={styles.socialButton}>
                      <ExternalLink size={16} color="#666" />
                      <Text style={styles.socialText}>More</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                onPress={handlePress}
                style={[styles.playButton, { backgroundColor: platform.color }]}
              >
                <Play size={18} color="#fff" />
                <Text style={styles.playText}>Watch</Text>
              </TouchableOpacity>
              
              {showAddButton && (
                <TouchableOpacity
                  onPress={handleAdd}
                  style={[styles.addButton, isActive && styles.activeButton]}
                >
                  <Plus size={18} color={isActive ? '#fff' : platform.color} />
                  <Text style={[styles.addText, isActive && styles.activeText]}>
                    {isActive ? 'Added' : 'Add'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Expanded Content */}
            <Animated.View style={[styles.expandedContent, animatedExpandStyle]}>
              <View style={styles.expandedInfo}>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Users size={16} color="#666" />
                    <Text style={styles.statText}>{formatViewerCount(stream.viewerCount)} viewers</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Clock size={16} color="#666" />
                    <Text style={styles.statText}>{formatDuration(stream.startedAt)} ago</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Award size={16} color="#666" />
                    <Text style={styles.statText}>Trend: {trendingScore}</Text>
                  </View>
                </View>
                
                {stream.tags && stream.tags.length > 0 && (
                  <View style={styles.tagsContainer}>
                    {stream.tags.slice(0, 3).map((tag, index) => (
                      <View key={index} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
                
                <View style={styles.expandedActions}>
                  <TouchableOpacity style={styles.expandedButton}>
                    <BookmarkPlus size={16} color="#666" />
                    <Text style={styles.expandedButtonText}>Bookmark</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.expandedButton}>
                    <Star size={16} color="#666" />
                    <Text style={styles.expandedButtonText}>Rate</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.expandedButton}>
                    <ExternalLink size={16} color="#666" />
                    <Text style={styles.expandedButtonText}>Open</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          </LinearGradient>
        </BlurView>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  touchable: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardGradient: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  platformBadge: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  platformGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  platformEmoji: {
    fontSize: 12,
  },
  platformText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  badgeText: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '600',
  },
  iconButton: {
    padding: 8,
  },
  mainContent: {
    gap: 12,
  },
  thumbnailContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: 180,
    borderRadius: 12,
  },
  liveIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220, 38, 38, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  viewerText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  durationText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  contentInfo: {
    gap: 12,
  },
  streamerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  streamerDetails: {
    flex: 1,
  },
  streamerName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  category: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  title: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
  socialActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 8,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    position: 'relative',
  },
  socialText: {
    color: '#666',
    fontSize: 12,
  },
  countBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  countText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  playButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  playText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    gap: 8,
  },
  activeButton: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  addText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  activeText: {
    color: '#fff',
  },
  expandedContent: {
    marginTop: 16,
    overflow: 'hidden',
  },
  expandedInfo: {
    gap: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    color: '#666',
    fontSize: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    color: '#fff',
    fontSize: 10,
  },
  expandedActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  expandedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expandedButtonText: {
    color: '#666',
    fontSize: 12,
  },
});