import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Share,
  Haptics,
  Platform,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCw,
  Camera,
  Share as ShareIcon,
  Star,
  StarOff,
  Bookmark,
  BookmarkOff,
  Settings,
  MoreVertical,
  ZoomIn,
  ZoomOut,
  SkipForward,
  SkipBack,
  Download,
  Cast,
  PictureInPicture,
  Focus,
  Grid,
  X,
  Check,
} from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
  withDelay,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { TwitchStream } from '@/services/twitchApi';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface FloatingAction {
  id: string;
  label: string;
  icon: any;
  color: string[];
  action: () => void;
  disabled?: boolean;
  badge?: string;
}

interface StreamStats {
  viewers: number;
  duration: string;
  bitrate: string;
  resolution: string;
  fps: number;
}

interface FloatingStreamControlsProps {
  stream: TwitchStream;
  isVisible: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onVolumeToggle: (muted: boolean) => void;
  onQualityChange: (quality: string) => void;
  onScreenshot: () => void;
  onRecord: (recording: boolean) => void;
  onShare: () => void;
  onFavorite: (favorited: boolean) => void;
  onBookmark: (bookmarked: boolean) => void;
  onFullscreen: () => void;
  onPictureInPicture: () => void;
  onCast: () => void;
  initialMuted?: boolean;
  initialFavorited?: boolean;
  initialBookmarked?: boolean;
  initialRecording?: boolean;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

export function FloatingStreamControls({
  stream,
  isVisible,
  position,
  onClose,
  onVolumeToggle,
  onQualityChange,
  onScreenshot,
  onRecord,
  onShare,
  onFavorite,
  onBookmark,
  onFullscreen,
  onPictureInPicture,
  onCast,
  initialMuted = false,
  initialFavorited = false,
  initialBookmarked = false,
  initialRecording = false,
}: FloatingStreamControlsProps) {
  const [muted, setMuted] = useState(initialMuted);
  const [favorited, setFavorited] = useState(initialFavorited);
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [recording, setRecording] = useState(initialRecording);
  const [selectedQuality, setSelectedQuality] = useState('auto');
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [streamStats, setStreamStats] = useState<StreamStats>({
    viewers: stream.viewer_count || 0,
    duration: '2:34:15',
    bitrate: '6000 kbps',
    resolution: '1920x1080',
    fps: 60,
  });

  // Animation values
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const translateY = useSharedValue(20);
  const qualityMenuOpacity = useSharedValue(0);
  const qualityMenuScale = useSharedValue(0.9);

  // Show/hide animations
  useEffect(() => {
    if (isVisible) {
      opacity.value = withTiming(1, { duration: 300 });
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      translateY.value = withSpring(0, { damping: 15, stiffness: 300 });
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      scale.value = withTiming(0.8, { duration: 200 });
      translateY.value = withTiming(20, { duration: 200 });
      setShowQualityMenu(false);
    }
  }, [isVisible]);

  // Quality menu animations
  useEffect(() => {
    if (showQualityMenu) {
      qualityMenuOpacity.value = withDelay(100, withTiming(1, { duration: 200 }));
      qualityMenuScale.value = withDelay(100, withSpring(1, { damping: 15, stiffness: 300 }));
    } else {
      qualityMenuOpacity.value = withTiming(0, { duration: 150 });
      qualityMenuScale.value = withTiming(0.9, { duration: 150 });
    }
  }, [showQualityMenu]);

  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (Platform.OS === 'ios') {
      switch (type) {
        case 'light':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
      }
    }
  }, []);

  const handleVolumeToggle = useCallback(() => {
    const newMuted = !muted;
    setMuted(newMuted);
    onVolumeToggle(newMuted);
    triggerHaptic('light');
  }, [muted, onVolumeToggle, triggerHaptic]);

  const handleFavoriteToggle = useCallback(() => {
    const newFavorited = !favorited;
    setFavorited(newFavorited);
    onFavorite(newFavorited);
    triggerHaptic('medium');
  }, [favorited, onFavorite, triggerHaptic]);

  const handleBookmarkToggle = useCallback(() => {
    const newBookmarked = !bookmarked;
    setBookmarked(newBookmarked);
    onBookmark(newBookmarked);
    triggerHaptic('light');
  }, [bookmarked, onBookmark, triggerHaptic]);

  const handleRecordToggle = useCallback(() => {
    const newRecording = !recording;
    setRecording(newRecording);
    onRecord(newRecording);
    triggerHaptic(newRecording ? 'heavy' : 'medium');

    Alert.alert(
      newRecording ? 'Recording Started' : 'Recording Stopped',
      newRecording 
        ? `Started recording ${stream.user_name}'s stream`
        : 'Recording saved to your device',
      [{ text: 'OK' }]
    );
  }, [recording, onRecord, triggerHaptic, stream.user_name]);

  const handleScreenshot = useCallback(() => {
    onScreenshot();
    triggerHaptic('medium');
    
    // Show success feedback
    Alert.alert(
      'Screenshot Captured',
      `Screenshot of ${stream.user_name}'s stream saved`,
      [{ text: 'OK' }]
    );
  }, [onScreenshot, triggerHaptic, stream.user_name]);

  const handleShare = useCallback(() => {
    const shareData = {
      title: `${stream.user_name} - ${stream.title}`,
      message: `Check out ${stream.user_name} playing ${stream.game_name} on Twitch!`,
      url: `https://twitch.tv/${stream.user_login}`,
    };

    Share.share(shareData).then(() => {
      onShare();
      triggerHaptic('light');
    });
  }, [stream, onShare, triggerHaptic]);

  const handleQualityChange = useCallback((quality: string) => {
    setSelectedQuality(quality);
    onQualityChange(quality);
    setShowQualityMenu(false);
    triggerHaptic('light');
  }, [onQualityChange, triggerHaptic]);

  const qualityOptions = [
    { id: 'source', label: 'Source', detail: streamStats.resolution },
    { id: 'auto', label: 'Auto', detail: 'Adaptive' },
    { id: '720p60', label: '720p60', detail: '1280x720' },
    { id: '720p', label: '720p', detail: '1280x720' },
    { id: '480p', label: '480p', detail: '854x480' },
    { id: '360p', label: '360p', detail: '640x360' },
    { id: '160p', label: '160p', detail: '284x160' },
  ];

  const primaryActions: FloatingAction[] = [
    {
      id: 'volume',
      label: muted ? 'Unmute' : 'Mute',
      icon: muted ? VolumeX : Volume2,
      color: muted ? ['#6B7280', '#4B5563'] : ['#22C55E', '#16A34A'],
      action: handleVolumeToggle,
    },
    {
      id: 'favorite',
      label: favorited ? 'Unfavorite' : 'Favorite',
      icon: favorited ? Star : StarOff,
      color: favorited ? ['#F59E0B', '#D97706'] : ['#6B7280', '#4B5563'],
      action: handleFavoriteToggle,
    },
    {
      id: 'fullscreen',
      label: 'Fullscreen',
      icon: Maximize,
      color: ['#8B5CF6', '#7C3AED'],
      action: onFullscreen,
    },
    {
      id: 'pip',
      label: 'Picture-in-Picture',
      icon: PictureInPicture,
      color: ['#06B6D4', '#0891B2'],
      action: onPictureInPicture,
    },
  ];

  const secondaryActions: FloatingAction[] = [
    {
      id: 'screenshot',
      label: 'Screenshot',
      icon: Camera,
      color: ['#8B5CF6', '#7C3AED'],
      action: handleScreenshot,
    },
    {
      id: 'record',
      label: recording ? 'Stop Recording' : 'Record',
      icon: recording ? Check : Download,
      color: recording ? ['#EF4444', '#DC2626'] : ['#F59E0B', '#D97706'],
      action: handleRecordToggle,
      badge: recording ? 'REC' : undefined,
    },
    {
      id: 'bookmark',
      label: bookmarked ? 'Remove Bookmark' : 'Bookmark',
      icon: bookmarked ? Bookmark : BookmarkOff,
      color: bookmarked ? ['#8B5CF6', '#7C3AED'] : ['#6B7280', '#4B5563'],
      action: handleBookmarkToggle,
    },
    {
      id: 'share',
      label: 'Share',
      icon: ShareIcon,
      color: ['#06B6D4', '#0891B2'],
      action: handleShare,
    },
    {
      id: 'cast',
      label: 'Cast',
      icon: Cast,
      color: ['#10B981', '#059669'],
      action: onCast,
    },
    {
      id: 'quality',
      label: `Quality (${selectedQuality})`,
      icon: Settings,
      color: ['#6366F1', '#4F46E5'],
      action: () => setShowQualityMenu(!showQualityMenu),
    },
  ];

  const animatedContainerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
  }));

  const animatedQualityMenuStyle = useAnimatedStyle(() => ({
    opacity: qualityMenuOpacity.value,
    transform: [{ scale: qualityMenuScale.value }],
    pointerEvents: qualityMenuOpacity.value > 0.5 ? 'auto' : 'none',
  }));

  const renderActionButton = (action: FloatingAction, size: 'small' | 'large' = 'small') => (
    <AnimatedTouchableOpacity
      key={action.id}
      style={[
        styles.actionButton,
        size === 'large' && styles.largeActionButton,
        action.disabled && styles.disabledButton,
      ]}
      onPress={action.action}
      disabled={action.disabled}
    >
      <LinearGradient
        colors={action.disabled ? ['#6B7280', '#4B5563'] : action.color}
        style={[styles.actionGradient, size === 'large' && styles.largeActionGradient]}
      >
        <action.icon 
          size={size === 'large' ? 20 : 16} 
          color="#fff" 
        />
        {action.badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{action.badge}</Text>
          </View>
        )}
      </LinearGradient>
    </AnimatedTouchableOpacity>
  );

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.backdropContent} />
      </TouchableOpacity>

      {/* Main controls container */}
      <Animated.View
        style={[
          styles.container,
          animatedContainerStyle,
          {
            left: Math.max(16, Math.min(position.x, screenWidth - 320)),
            top: Math.max(80, Math.min(position.y, screenHeight - 400)),
          },
        ]}
      >
        <AnimatedBlurView intensity={80} style={styles.blurContainer}>
          <LinearGradient
            colors={['rgba(26, 26, 26, 0.95)', 'rgba(15, 15, 15, 0.9)']}
            style={styles.content}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.streamInfo}>
                <Text style={styles.streamTitle} numberOfLines={1}>
                  {stream.user_name}
                </Text>
                <Text style={styles.streamGame} numberOfLines={1}>
                  {stream.game_name}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
              >
                <X size={20} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Stream stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{streamStats.viewers.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Viewers</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{streamStats.duration}</Text>
                <Text style={styles.statLabel}>Duration</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{streamStats.fps} FPS</Text>
                <Text style={styles.statLabel}>Quality</Text>
              </View>
            </View>

            {/* Primary actions */}
            <View style={styles.primaryActions}>
              {primaryActions.map(action => renderActionButton(action, 'large'))}
            </View>

            {/* Secondary actions */}
            <View style={styles.secondaryActions}>
              {secondaryActions.map(action => renderActionButton(action))}
            </View>
          </LinearGradient>
        </AnimatedBlurView>
      </Animated.View>

      {/* Quality selection menu */}
      {showQualityMenu && (
        <Animated.View
          style={[
            styles.qualityMenu,
            animatedQualityMenuStyle,
            {
              left: Math.max(16, Math.min(position.x + 50, screenWidth - 200)),
              top: Math.max(80, Math.min(position.y + 100, screenHeight - 300)),
            },
          ]}
        >
          <AnimatedBlurView intensity={80} style={styles.qualityBlurContainer}>
            <LinearGradient
              colors={['rgba(26, 26, 26, 0.95)', 'rgba(15, 15, 15, 0.9)']}
              style={styles.qualityContent}
            >
              <Text style={styles.qualityTitle}>Select Quality</Text>
              {qualityOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.qualityOption,
                    selectedQuality === option.id && styles.selectedQualityOption,
                  ]}
                  onPress={() => handleQualityChange(option.id)}
                >
                  <View style={styles.qualityOptionContent}>
                    <Text
                      style={[
                        styles.qualityLabel,
                        selectedQuality === option.id && styles.selectedQualityLabel,
                      ]}
                    >
                      {option.label}
                    </Text>
                    <Text
                      style={[
                        styles.qualityDetail,
                        selectedQuality === option.id && styles.selectedQualityDetail,
                      ]}
                    >
                      {option.detail}
                    </Text>
                  </View>
                  {selectedQuality === option.id && (
                    <Check size={16} color="#8B5CF6" />
                  )}
                </TouchableOpacity>
              ))}
            </LinearGradient>
          </AnimatedBlurView>
        </Animated.View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 1000,
  },
  backdropContent: {
    flex: 1,
  },
  container: {
    position: 'absolute',
    width: 300,
    zIndex: 1001,
  },
  blurContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  streamInfo: {
    flex: 1,
    marginRight: 12,
  },
  streamTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginBottom: 2,
  },
  streamGame: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#8B5CF6',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    padding: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: '#999',
  },
  primaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  secondaryActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  largeActionButton: {
    // Additional styling for large buttons
  },
  disabledButton: {
    opacity: 0.5,
  },
  actionGradient: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  largeActionGradient: {
    width: 48,
    height: 48,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  badgeText: {
    fontSize: 8,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  qualityMenu: {
    position: 'absolute',
    width: 180,
    zIndex: 1002,
  },
  qualityBlurContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  qualityContent: {
    padding: 12,
  },
  qualityTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  qualityOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: 6,
    marginBottom: 4,
  },
  selectedQualityOption: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
  },
  qualityOptionContent: {
    flex: 1,
  },
  qualityLabel: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
    marginBottom: 2,
  },
  selectedQualityLabel: {
    color: '#8B5CF6',
  },
  qualityDetail: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: '#666',
  },
  selectedQualityDetail: {
    color: '#999',
  },
});