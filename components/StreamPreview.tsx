import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  Modal, 
  Dimensions, 
  Platform 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Users, Clock, X, Eye } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { TwitchStream } from '@/services/twitchApi';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface StreamPreviewProps {
  stream: TwitchStream;
  visible: boolean;
  onClose: () => void;
  onAdd: (stream: TwitchStream) => void;
  onToggleFavorite: (stream: TwitchStream) => void;
  isFavorite: boolean;
  isActive: boolean;
}

export function StreamPreview({ 
  stream, 
  visible, 
  onClose, 
  onAdd, 
  onToggleFavorite, 
  isFavorite, 
  isActive 
}: StreamPreviewProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const slideY = useSharedValue(50);

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      opacity.value = withTiming(1, { duration: 200 });
      slideY.value = withSpring(0, { damping: 15, stiffness: 200 });
    } else {
      scale.value = withSpring(0.8, { damping: 15, stiffness: 300 });
      opacity.value = withTiming(0, { duration: 150 });
      slideY.value = withSpring(50, { damping: 15, stiffness: 200 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: slideY.value }
    ],
    opacity: opacity.value,
  }));

  const formatViewerCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const formatDuration = (startedAt: string) => {
    const start = new Date(startedAt);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - start.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m`;
    } else {
      const hours = Math.floor(diffInMinutes / 60);
      const minutes = diffInMinutes % 60;
      return `${hours}h ${minutes}m`;
    }
  };

  const getThumbnailUrl = (templateUrl: string) => {
    return templateUrl
      .replace('{width}', '480')
      .replace('{height}', '270');
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} />
        
        <Animated.View style={[styles.container, animatedStyle]}>
          <LinearGradient
            colors={['rgba(26, 26, 26, 0.98)', 'rgba(15, 15, 15, 0.98)']}
            style={styles.content}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Eye size={20} color="#8B5CF6" />
                <Text style={styles.headerTitle}>Stream Preview</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={20} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Stream Thumbnail */}
            <View style={styles.thumbnailContainer}>
              <Image
                source={{ uri: getThumbnailUrl(stream.thumbnail_url) }}
                style={styles.thumbnail}
                onLoad={() => setImageLoaded(true)}
                resizeMode="cover"
              />
              {!imageLoaded && (
                <View style={styles.thumbnailPlaceholder}>
                  <Play size={32} color="#666" />
                </View>
              )}
              <View style={styles.liveIndicator}>
                <LinearGradient
                  colors={['#FF0000', '#CC0000']}
                  style={styles.liveGradient}
                >
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>LIVE</Text>
                </LinearGradient>
              </View>
            </View>

            {/* Stream Info */}
            <View style={styles.info}>
              <Text style={styles.title} numberOfLines={2}>
                {stream.title}
              </Text>
              
              <View style={styles.streamerInfo}>
                <Text style={styles.streamerName}>{stream.user_name}</Text>
                <Text style={styles.gameInfo}>{stream.game_name}</Text>
              </View>

              <View style={styles.stats}>
                <View style={styles.stat}>
                  <Users size={16} color="#8B5CF6" />
                  <Text style={styles.statText}>
                    {formatViewerCount(stream.viewer_count)}
                  </Text>
                </View>
                <View style={styles.stat}>
                  <Clock size={16} color="#8B5CF6" />
                  <Text style={styles.statText}>
                    {formatDuration(stream.started_at)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.favoriteButton]}
                onPress={() => onToggleFavorite(stream)}
              >
                <LinearGradient
                  colors={
                    isFavorite 
                      ? ['#FF4444', '#CC0000'] 
                      : ['rgba(68, 68, 68, 0.8)', 'rgba(85, 85, 85, 0.8)']
                  }
                  style={styles.actionGradient}
                >
                  <Text style={styles.actionText}>
                    {isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.addButton]}
                onPress={() => onAdd(stream)}
                disabled={isActive}
              >
                <LinearGradient
                  colors={
                    isActive 
                      ? ['rgba(68, 68, 68, 0.5)', 'rgba(85, 85, 85, 0.5)']
                      : ['#8B5CF6', '#7C3AED']
                  }
                  style={styles.actionGradient}
                >
                  <Play size={16} color="#fff" />
                  <Text style={[styles.actionText, isActive && styles.disabledText]}>
                    {isActive ? 'Already Added' : 'Add to Multi-View'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    width: screenWidth * 0.9,
    maxWidth: 400,
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
      },
      android: {
        elevation: 20,
      },
      web: {
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
      },
    }),
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  closeButton: {
    padding: 8,
    backgroundColor: 'rgba(68, 68, 68, 0.3)',
    borderRadius: 20,
  },
  thumbnailContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  thumbnail: {
    width: '100%',
    height: 200,
    backgroundColor: '#2a2a2a',
  },
  thumbnailPlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveIndicator: {
    position: 'absolute',
    top: 12,
    left: 12,
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
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  liveText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'Inter-Bold',
  },
  info: {
    marginBottom: 20,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    lineHeight: 22,
    marginBottom: 8,
  },
  streamerInfo: {
    marginBottom: 12,
  },
  streamerName: {
    color: '#8B5CF6',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginBottom: 2,
  },
  gameInfo: {
    color: '#999',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  stats: {
    flexDirection: 'row',
    gap: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    color: '#ccc',
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  actions: {
    gap: 12,
  },
  actionButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  favoriteButton: {
    // Additional styling for favorite button
  },
  addButton: {
    // Additional styling for add button
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  actionText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  disabledText: {
    opacity: 0.6,
  },
});