import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Image,
  ViewStyle,
  TextStyle,
  Dimensions,
  PanResponder,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  Play,
  Pause,
  Eye,
  X,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Move,
  RotateCcw,
  Settings,
  Share,
  Heart,
  MoreVertical,
  Fullscreen,
  PictureInPicture2,
  Users,
  Clock,
  TrendingUp,
} from 'lucide-react-native';
import { TwitchStream } from '@/services/twitchApi';
import { ModernTheme } from '@/theme/modernTheme';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  runOnJS,
  interpolate,
  Extrapolate,
  useAnimatedGestureHandler,
  FadeIn,
  FadeOut,
  SlideInDown,
  ZoomIn,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import {
  PanGestureHandler,
  PinchGestureHandler,
  State,
} from 'react-native-gesture-handler';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export type StreamLayoutMode = 'grid' | 'fullscreen' | 'pip' | 'floating';
export type StreamQuality = 'auto' | '1080p' | '720p' | '480p' | '360p';

interface ModernStreamCardProps {
  stream: TwitchStream;
  width: number;
  height: number;
  layoutMode: StreamLayoutMode;
  isPlaying?: boolean;
  isMuted?: boolean;
  isSelected?: boolean;
  isFavorite?: boolean;
  showControls?: boolean;
  quality?: StreamQuality;
  onPress?: () => void;
  onRemove?: () => void;
  onTogglePlay?: () => void;
  onToggleMute?: () => void;
  onToggleFavorite?: () => void;
  onQualityChange?: (quality: StreamQuality) => void;
  onLayoutChange?: (mode: StreamLayoutMode) => void;
  onMove?: (x: number, y: number) => void;
  onResize?: (width: number, height: number) => void;
  position?: { x: number; y: number };
  isDraggable?: boolean;
  isResizable?: boolean;
  zIndex?: number;
}

export const ModernStreamCard: React.FC<ModernStreamCardProps> = ({
  stream,
  width,
  height,
  layoutMode = 'grid',
  isPlaying = false,
  isMuted = false,
  isSelected = false,
  isFavorite = false,
  showControls = true,
  quality = 'auto',
  onPress,
  onRemove,
  onTogglePlay,
  onToggleMute,
  onToggleFavorite,
  onQualityChange,
  onLayoutChange,
  onMove,
  onResize,
  position = { x: 0, y: 0 },
  isDraggable = false,
  isResizable = false,
  zIndex = 1,
}) => {
  const [imageError, setImageError] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  
  // Animation values
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const translateX = useSharedValue(position.x);
  const translateY = useSharedValue(position.y);
  const cardWidth = useSharedValue(width);
  const cardHeight = useSharedValue(height);
  const rotation = useSharedValue(0);
  const livePulse = useSharedValue(1);
  const heartScale = useSharedValue(1);
  const controlsOpacity = useSharedValue(showControls ? 1 : 0);
  const glowIntensity = useSharedValue(0);
  
  // Pulse animation for live indicator
  React.useEffect(() => {
    livePulse.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1
    );
  }, []);
  
  // Glow effect for selected state
  React.useEffect(() => {
    glowIntensity.value = withTiming(isSelected ? 1 : 0, { duration: 300 });
  }, [isSelected]);
  
  // Auto-hide controls
  React.useEffect(() => {
    if (showControls && layoutMode !== 'pip') {
      controlsOpacity.value = withTiming(1, { duration: 300 });
      const timer = setTimeout(() => {
        controlsOpacity.value = withTiming(0, { duration: 300 });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showControls, layoutMode]);
  
  // Get thumbnail URL with proper resolution
  const getThumbnailUrl = () => {
    if (!stream.thumbnail_url) return null;
    
    const thumbnailWidth = Math.floor(cardWidth.value * 2);
    const thumbnailHeight = Math.floor(cardHeight.value * 1.5);
    
    return stream.thumbnail_url
      .replace('{width}', thumbnailWidth.toString())
      .replace('{height}', thumbnailHeight.toString());
  };
  
  // Pan gesture handler for dragging
  const panGestureHandler = useAnimatedGestureHandler({
    onStart: (_, context) => {
      context.startX = translateX.value;
      context.startY = translateY.value;
      scale.value = withSpring(1.05);
      runOnJS(setIsDragging)(true);
    },
    onActive: (event, context) => {
      translateX.value = context.startX + event.translationX;
      translateY.value = context.startY + event.translationY;
    },
    onEnd: () => {
      scale.value = withSpring(1);
      runOnJS(setIsDragging)(false);
      
      // Snap to edges if close
      const snapThreshold = 20;
      if (translateX.value < snapThreshold) {
        translateX.value = withSpring(0);
      } else if (translateX.value > SCREEN_WIDTH - cardWidth.value - snapThreshold) {
        translateX.value = withSpring(SCREEN_WIDTH - cardWidth.value);
      }
      
      if (translateY.value < snapThreshold) {
        translateY.value = withSpring(0);
      } else if (translateY.value > SCREEN_HEIGHT - cardHeight.value - snapThreshold) {
        translateY.value = withSpring(SCREEN_HEIGHT - cardHeight.value);
      }
      
      runOnJS(onMove)?.(translateX.value, translateY.value);
    },
  });
  
  // Pinch gesture handler for resizing
  const pinchGestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      runOnJS(setIsResizing)(true);
    },
    onActive: (event) => {
      const newScale = event.scale;
      const minScale = 0.3;
      const maxScale = 2.0;
      const clampedScale = Math.max(minScale, Math.min(maxScale, newScale));
      
      cardWidth.value = width * clampedScale;
      cardHeight.value = height * clampedScale;
    },
    onEnd: () => {
      runOnJS(setIsResizing)(false);
      runOnJS(onResize)?.(cardWidth.value, cardHeight.value);
    },
  });
  
  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
    width: cardWidth.value,
    height: cardHeight.value,
    opacity: opacity.value,
    zIndex: isDragging || isResizing ? 1000 : zIndex,
    shadowOpacity: interpolate(
      glowIntensity.value,
      [0, 1],
      [0.1, 0.4],
      Extrapolate.CLAMP
    ),
    shadowColor: ModernTheme.colors.accent[500],
    shadowRadius: interpolate(
      glowIntensity.value,
      [0, 1],
      [4, 12],
      Extrapolate.CLAMP
    ),
  }));
  
  const livePulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: livePulse.value }],
  }));
  
  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));
  
  const controlsStyle = useAnimatedStyle(() => ({
    opacity: controlsOpacity.value,
  }));
  
  // Handle various actions
  const handlePress = () => {
    scale.value = withSpring(0.95, { damping: 15 }, () => {
      scale.value = withSpring(1);
    });
    onPress?.();
  };
  
  const handleRemove = () => {
    opacity.value = withTiming(0, { duration: 300 });
    scale.value = withTiming(0.8, { duration: 300 }, () => {
      runOnJS(onRemove)?.();
    });
  };
  
  const handleTogglePlay = () => {
    scale.value = withSpring(0.95, { damping: 15 }, () => {
      scale.value = withSpring(1);
    });
    onTogglePlay?.();
  };
  
  const handleToggleFavorite = () => {
    heartScale.value = withSpring(0.8, { damping: 15 }, () => {
      heartScale.value = withSpring(1.3, { damping: 15 }, () => {
        heartScale.value = withSpring(1);
      });
    });
    onToggleFavorite?.();
  };
  
  const handleLayoutChange = (mode: StreamLayoutMode) => {
    rotation.value = withSpring(360, { damping: 15 }, () => {
      rotation.value = 0;
    });
    onLayoutChange?.(mode);
    setShowMoreMenu(false);
  };
  
  const qualityOptions: StreamQuality[] = ['auto', '1080p', '720p', '480p', '360p'];
  const thumbnailUrl = getThumbnailUrl();
  
  const renderQualityMenu = () => (
    <Animated.View 
      entering={SlideInDown.delay(100)}
      exiting={FadeOut}
      style={styles.qualityMenu}
    >
      <BlurView intensity={95} style={styles.menuBlur}>
        {qualityOptions.map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.menuItem, quality === option && styles.menuItemActive]}
            onPress={() => {
              onQualityChange?.(option);
              setShowQualityMenu(false);
            }}
          >
            <Text style={[styles.menuText, quality === option && styles.menuTextActive]}>
              {option.toUpperCase()}
            </Text>
            {quality === option && (
              <View style={styles.activeIndicator} />
            )}
          </TouchableOpacity>
        ))}
      </BlurView>
    </Animated.View>
  );
  
  const renderMoreMenu = () => (
    <Animated.View 
      entering={SlideInDown.delay(100)}
      exiting={FadeOut}
      style={styles.moreMenu}
    >
      <BlurView intensity={95} style={styles.menuBlur}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => handleLayoutChange('fullscreen')}
        >
          <Fullscreen size={16} color={ModernTheme.colors.text.primary} />
          <Text style={styles.menuText}>Fullscreen</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => handleLayoutChange('pip')}
        >
          <PictureInPicture2 size={16} color={ModernTheme.colors.text.primary} />
          <Text style={styles.menuText}>Picture in Picture</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => setShowMoreMenu(false)}
        >
          <Share size={16} color={ModernTheme.colors.text.primary} />
          <Text style={styles.menuText}>Share Stream</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => setShowMoreMenu(false)}
        >
          <Settings size={16} color={ModernTheme.colors.text.primary} />
          <Text style={styles.menuText}>Stream Settings</Text>
        </TouchableOpacity>
      </BlurView>
    </Animated.View>
  );
  
  return (
    <PanGestureHandler 
      onGestureEvent={isDraggable ? panGestureHandler : undefined}
      enabled={isDraggable}
    >
      <Animated.View>
        <PinchGestureHandler
          onGestureEvent={isResizable ? pinchGestureHandler : undefined}
          enabled={isResizable}
        >
          <Animated.View style={[styles.container, containerStyle]}>
            <TouchableOpacity
              style={styles.touchArea}
              onPress={handlePress}
              activeOpacity={0.95}
            >
              {/* Background Gradient */}
              <LinearGradient
                colors={
                  layoutMode === 'pip' 
                    ? ['rgba(0,0,0,0.95)', 'rgba(0,0,0,0.8)']
                    : isSelected 
                      ? ModernTheme.colors.gradients.accent
                      : ModernTheme.colors.gradients.card
                }
                style={styles.cardGradient}
              >
                {/* Main Content */}
                <View style={styles.content}>
                  {/* Thumbnail/Video Area */}
                  <View style={styles.videoContainer}>
                    {thumbnailUrl && !imageError ? (
                      <Image
                        source={{ uri: thumbnailUrl }}
                        style={styles.thumbnail}
                        onError={() => setImageError(true)}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.placeholderThumbnail}>
                        <Play size={layoutMode === 'pip' ? 24 : 48} color={ModernTheme.colors.text.secondary} />
                      </View>
                    )}
                    
                    {/* Streaming Overlay */}
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.7)']}
                      style={styles.streamOverlay}
                    />
                    
                    {/* Status Indicators */}
                    <View style={styles.statusContainer}>
                      {/* Live Indicator */}
                      <Animated.View style={[styles.liveBadge, livePulseStyle]}>
                        <Animated.View style={styles.liveDot} />
                        <Text style={styles.liveText}>LIVE</Text>
                      </Animated.View>
                      
                      {/* Viewer Count */}
                      <View style={styles.viewerBadge}>
                        <Eye size={12} color={ModernTheme.colors.text.primary} />
                        <Text style={styles.viewerText}>
                          {stream.viewer_count?.toLocaleString() || '0'}
                        </Text>
                      </View>
                      
                      {/* Quality Indicator */}
                      <TouchableOpacity
                        style={styles.qualityBadge}
                        onPress={() => setShowQualityMenu(!showQualityMenu)}
                      >
                        <Text style={styles.qualityText}>{quality.toUpperCase()}</Text>
                      </TouchableOpacity>
                    </View>
                    
                    {/* Controls Overlay */}
                    <Animated.View style={[styles.controlsOverlay, controlsStyle]}>
                      {/* Top Controls */}
                      <View style={styles.topControls}>
                        <View style={styles.leftControls}>
                          {isDraggable && (
                            <TouchableOpacity style={styles.controlButton}>
                              <Move size={16} color={ModernTheme.colors.text.primary} />
                            </TouchableOpacity>
                          )}
                          
                          <Animated.View style={heartStyle}>
                            <TouchableOpacity
                              style={[styles.controlButton, isFavorite && styles.favoriteActive]}
                              onPress={handleToggleFavorite}
                            >
                              <Heart 
                                size={16} 
                                color={isFavorite ? ModernTheme.colors.status.live : ModernTheme.colors.text.primary}
                                fill={isFavorite ? ModernTheme.colors.status.live : 'transparent'}
                              />
                            </TouchableOpacity>
                          </Animated.View>
                        </View>
                        
                        <View style={styles.rightControls}>
                          <TouchableOpacity
                            style={styles.controlButton}
                            onPress={() => setShowMoreMenu(!showMoreMenu)}
                          >
                            <MoreVertical size={16} color={ModernTheme.colors.text.primary} />
                          </TouchableOpacity>
                          
                          <TouchableOpacity
                            style={styles.controlButton}
                            onPress={handleRemove}
                          >
                            <X size={16} color={ModernTheme.colors.text.primary} />
                          </TouchableOpacity>
                        </View>
                      </View>
                      
                      {/* Center Play/Pause Button */}
                      <View style={styles.centerControls}>
                        <TouchableOpacity
                          style={styles.playButton}
                          onPress={handleTogglePlay}
                        >
                          <LinearGradient
                            colors={ModernTheme.colors.gradients.accent}
                            style={styles.playButtonGradient}
                          >
                            {isPlaying ? (
                              <Pause size={24} color="#ffffff" />
                            ) : (
                              <Play size={24} color="#ffffff" />
                            )}
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                      
                      {/* Bottom Controls */}
                      <View style={styles.bottomControls}>
                        <TouchableOpacity
                          style={[styles.controlButton, isMuted && styles.mutedActive]}
                          onPress={onToggleMute}
                        >
                          {isMuted ? (
                            <VolumeX size={16} color={ModernTheme.colors.text.primary} />
                          ) : (
                            <Volume2 size={16} color={ModernTheme.colors.text.primary} />
                          )}
                        </TouchableOpacity>
                        
                        <View style={styles.progressBar}>
                          <View style={styles.progressFill} />
                        </View>
                        
                        <TouchableOpacity
                          style={styles.controlButton}
                          onPress={() => handleLayoutChange(layoutMode === 'grid' ? 'fullscreen' : 'grid')}
                        >
                          {layoutMode === 'fullscreen' ? (
                            <Minimize2 size={16} color={ModernTheme.colors.text.primary} />
                          ) : (
                            <Maximize2 size={16} color={ModernTheme.colors.text.primary} />
                          )}
                        </TouchableOpacity>
                      </View>
                    </Animated.View>
                    
                    {/* Resize Handle */}
                    {isResizable && (
                      <View style={styles.resizeHandle}>
                        <View style={styles.resizeIcon} />
                      </View>
                    )}
                  </View>
                  
                  {/* Stream Info (only for grid mode) */}
                  {layoutMode === 'grid' && (
                    <Animated.View entering={FadeIn.delay(200)} style={styles.streamInfo}>
                      <Text style={styles.streamTitle} numberOfLines={1}>
                        {stream.user_name}
                      </Text>
                      <Text style={styles.streamGame} numberOfLines={1}>
                        {stream.game_name}
                      </Text>
                      
                      {/* Additional Stats */}
                      <View style={styles.streamStats}>
                        <View style={styles.statItem}>
                          <Users size={12} color={ModernTheme.colors.text.tertiary} />
                          <Text style={styles.statText}>
                            {stream.viewer_count?.toLocaleString() || '0'}
                          </Text>
                        </View>
                        
                        <View style={styles.statItem}>
                          <Clock size={12} color={ModernTheme.colors.text.tertiary} />
                          <Text style={styles.statText}>2h 14m</Text>
                        </View>
                        
                        <View style={styles.statItem}>
                          <TrendingUp size={12} color={ModernTheme.colors.success[500]} />
                          <Text style={[styles.statText, { color: ModernTheme.colors.success[500] }]}>
                            +12%
                          </Text>
                        </View>
                      </View>
                    </Animated.View>
                  )}
                </View>
              </LinearGradient>
            </TouchableOpacity>
            
            {/* Quality Menu */}
            {showQualityMenu && renderQualityMenu()}
            
            {/* More Menu */}
            {showMoreMenu && renderMoreMenu()}
          </Animated.View>
        </PinchGestureHandler>
      </Animated.View>
    </PanGestureHandler>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: ModernTheme.borderRadius.lg,
    overflow: 'hidden',
    ...ModernTheme.shadows.lg,
  } as ViewStyle,
  touchArea: {
    flex: 1,
  } as ViewStyle,
  cardGradient: {
    flex: 1,
  } as ViewStyle,
  content: {
    flex: 1,
  } as ViewStyle,
  videoContainer: {
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
  streamOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  } as ViewStyle,
  statusContainer: {
    position: 'absolute',
    top: ModernTheme.spacing.sm,
    left: ModernTheme.spacing.sm,
    right: ModernTheme.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  } as ViewStyle,
  liveBadge: {
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
  qualityBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: ModernTheme.borderRadius.sm,
    paddingHorizontal: ModernTheme.spacing.sm,
    paddingVertical: ModernTheme.spacing.xs,
  } as ViewStyle,
  qualityText: {
    color: ModernTheme.colors.text.primary,
    fontSize: 10,
    fontWeight: ModernTheme.typography.weights.bold,
  } as TextStyle,
  controlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    padding: ModernTheme.spacing.sm,
  } as ViewStyle,
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  } as ViewStyle,
  leftControls: {
    flexDirection: 'row',
    gap: ModernTheme.spacing.xs,
  } as ViewStyle,
  rightControls: {
    flexDirection: 'row',
    gap: ModernTheme.spacing.xs,
  } as ViewStyle,
  centerControls: {
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ModernTheme.spacing.sm,
  } as ViewStyle,
  controlButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: ModernTheme.borderRadius.md,
    padding: ModernTheme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  } as ViewStyle,
  favoriteActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
    borderColor: ModernTheme.colors.status.live,
  } as ViewStyle,
  mutedActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
    borderColor: ModernTheme.colors.error[500],
  } as ViewStyle,
  playButton: {
    borderRadius: 35,
  } as ViewStyle,
  playButtonGradient: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  } as ViewStyle,
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
  } as ViewStyle,
  progressFill: {
    width: '35%',
    height: '100%',
    backgroundColor: ModernTheme.colors.accent[500],
    borderRadius: 2,
  } as ViewStyle,
  resizeHandle: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  resizeIcon: {
    width: 8,
    height: 8,
    backgroundColor: ModernTheme.colors.text.primary,
    borderRadius: 1,
  } as ViewStyle,
  streamInfo: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    padding: ModernTheme.spacing.sm,
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
    marginBottom: ModernTheme.spacing.xs,
  } as TextStyle,
  streamStats: {
    flexDirection: 'row',
    gap: ModernTheme.spacing.sm,
  } as ViewStyle,
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  } as ViewStyle,
  statText: {
    color: ModernTheme.colors.text.tertiary,
    fontSize: 10,
    fontWeight: ModernTheme.typography.weights.medium,
  } as TextStyle,
  qualityMenu: {
    position: 'absolute',
    top: 40,
    right: ModernTheme.spacing.sm,
    borderRadius: ModernTheme.borderRadius.md,
    overflow: 'hidden',
    ...ModernTheme.shadows.lg,
  } as ViewStyle,
  moreMenu: {
    position: 'absolute',
    top: 40,
    right: 40,
    borderRadius: ModernTheme.borderRadius.md,
    overflow: 'hidden',
    ...ModernTheme.shadows.lg,
  } as ViewStyle,
  menuBlur: {
    padding: ModernTheme.spacing.sm,
  } as ViewStyle,
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: ModernTheme.spacing.sm,
    paddingHorizontal: ModernTheme.spacing.md,
    gap: ModernTheme.spacing.sm,
    borderRadius: ModernTheme.borderRadius.sm,
  } as ViewStyle,
  menuItemActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
  } as ViewStyle,
  menuText: {
    color: ModernTheme.colors.text.primary,
    fontSize: ModernTheme.typography.sizes.sm,
    fontWeight: ModernTheme.typography.weights.medium,
  } as TextStyle,
  menuTextActive: {
    color: ModernTheme.colors.accent[500],
    fontWeight: ModernTheme.typography.weights.semibold,
  } as TextStyle,
  activeIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: ModernTheme.colors.accent[500],
    marginLeft: 'auto',
  } as ViewStyle,
});

export default ModernStreamCard;