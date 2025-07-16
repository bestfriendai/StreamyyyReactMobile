import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ViewStyle,
  TextStyle,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Plus,
  Settings,
  Grid3X3,
  Maximize2,
  Minimize2,
  RotateCw,
  Shuffle,
  Activity,
  Eye,
  Users,
  Zap,
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
} from 'lucide-react-native';
import { ModernTheme } from '@/theme/modernTheme';
import { HapticFeedback } from '@/utils/haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  interpolate,
  Extrapolate,
  runOnJS,
  FadeIn,
  FadeOut,
  SlideInUp,
  SlideOutDown,
  ZoomIn,
  ZoomOut,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FloatingControlsProps {
  isVisible: boolean;
  isPlaying: boolean;
  isMuted: boolean;
  showStats: boolean;
  streamCount: number;
  totalViewers: number;
  onPlayPause: () => void;
  onMuteToggle: () => void;
  onAddStream: () => void;
  onLayoutChange: () => void;
  onSettings: () => void;
  onStatsToggle: () => void;
  onShuffle?: () => void;
  onFullscreen?: () => void;
  position?: 'bottom' | 'top' | 'left' | 'right';
  size?: 'small' | 'medium' | 'large';
  variant?: 'minimal' | 'full' | 'compact';
}

export const FloatingControls: React.FC<FloatingControlsProps> = ({
  isVisible,
  isPlaying,
  isMuted,
  showStats,
  streamCount,
  totalViewers,
  onPlayPause,
  onMuteToggle,
  onAddStream,
  onLayoutChange,
  onSettings,
  onStatsToggle,
  onShuffle,
  onFullscreen,
  position = 'bottom',
  size = 'medium',
  variant = 'full',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSecondaryControls, setShowSecondaryControls] = useState(false);
  
  // Animation values
  const opacity = useSharedValue(isVisible ? 1 : 0);
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const expandedWidth = useSharedValue(0);
  const secondaryOpacity = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  
  // Auto-hide after inactivity
  useEffect(() => {
    opacity.value = withTiming(isVisible ? 1 : 0, { duration: 300 });
    
    if (isVisible) {
      const timer = setTimeout(() => {
        opacity.value = withTiming(0.7, { duration: 300 });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);
  
  // Pulse animation for active states
  useEffect(() => {
    if (isPlaying) {
      pulseScale.value = withSequence(
        withTiming(1.1, { duration: 150 }),
        withTiming(1, { duration: 150 })
      );
    }
  }, [isPlaying]);
  
  // Handle expand/collapse
  const toggleExpanded = () => {
    HapticFeedback.light();
    setIsExpanded(!isExpanded);
    
    expandedWidth.value = withSpring(
      isExpanded ? 0 : 200,
      { damping: 15, stiffness: 200 }
    );
    
    secondaryOpacity.value = withTiming(
      isExpanded ? 0 : 1,
      { duration: 200 }
    );
  };
  
  // Handle button press with animation
  const handlePress = (action: () => void) => {
    scale.value = withSpring(0.9, { damping: 15 }, () => {
      scale.value = withSpring(1);
    });
    
    HapticFeedback.light();
    action();
  };
  
  // Get container style based on position
  const getContainerStyle = () => {
    switch (position) {
      case 'top':
        return [styles.container, styles.topPosition];
      case 'left':
        return [styles.container, styles.leftPosition];
      case 'right':
        return [styles.container, styles.rightPosition];
      default:
        return [styles.container, styles.bottomPosition];
    }
  };
  
  // Get size-specific styles
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { buttonSize: 40, iconSize: 16, padding: 8 };
      case 'large':
        return { buttonSize: 56, iconSize: 24, padding: 16 };
      default:
        return { buttonSize: 48, iconSize: 20, padding: 12 };
    }
  };
  
  const sizeStyles = getSizeStyles();
  
  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
  }));
  
  const expandedStyle = useAnimatedStyle(() => ({
    width: expandedWidth.value,
    opacity: secondaryOpacity.value,
  }));
  
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));
  
  // Render primary controls
  const renderPrimaryControls = () => (
    <View style={[styles.controlsRow, { gap: sizeStyles.padding }]}>
      {/* Play/Pause Button */}
      <Animated.View style={pulseStyle}>
        <TouchableOpacity
          style={[
            styles.controlButton,
            styles.primaryButton,
            { 
              width: sizeStyles.buttonSize, 
              height: sizeStyles.buttonSize,
              borderRadius: sizeStyles.buttonSize / 2,
            }
          ]}
          onPress={() => handlePress(onPlayPause)}
        >
          {isPlaying ? (
            <Pause size={sizeStyles.iconSize} color="#ffffff" />
          ) : (
            <Play size={sizeStyles.iconSize} color="#ffffff" />
          )}
        </TouchableOpacity>
      </Animated.View>
      
      {/* Mute Button */}
      <TouchableOpacity
        style={[
          styles.controlButton,
          isMuted && styles.activeButton,
          { 
            width: sizeStyles.buttonSize, 
            height: sizeStyles.buttonSize,
            borderRadius: sizeStyles.buttonSize / 2,
          }
        ]}
        onPress={() => handlePress(onMuteToggle)}
      >
        {isMuted ? (
          <VolumeX size={sizeStyles.iconSize} color={ModernTheme.colors.text.primary} />
        ) : (
          <Volume2 size={sizeStyles.iconSize} color={ModernTheme.colors.text.primary} />
        )}
      </TouchableOpacity>
      
      {variant === 'full' && (
        <>
          {/* Add Stream Button */}
          <TouchableOpacity
            style={[
              styles.controlButton,
              { 
                width: sizeStyles.buttonSize, 
                height: sizeStyles.buttonSize,
                borderRadius: sizeStyles.buttonSize / 2,
              }
            ]}
            onPress={() => handlePress(onAddStream)}
          >
            <Plus size={sizeStyles.iconSize} color={ModernTheme.colors.text.primary} />
          </TouchableOpacity>
          
          {/* Layout Button */}
          <TouchableOpacity
            style={[
              styles.controlButton,
              { 
                width: sizeStyles.buttonSize, 
                height: sizeStyles.buttonSize,
                borderRadius: sizeStyles.buttonSize / 2,
              }
            ]}
            onPress={() => handlePress(onLayoutChange)}
          >
            <Grid3X3 size={sizeStyles.iconSize} color={ModernTheme.colors.text.primary} />
          </TouchableOpacity>
        </>
      )}
      
      {/* More/Expand Button */}
      <TouchableOpacity
        style={[
          styles.controlButton,
          { 
            width: sizeStyles.buttonSize, 
            height: sizeStyles.buttonSize,
            borderRadius: sizeStyles.buttonSize / 2,
          }
        ]}
        onPress={toggleExpanded}
      >
        <MoreHorizontal size={sizeStyles.iconSize} color={ModernTheme.colors.text.primary} />
      </TouchableOpacity>
    </View>
  );
  
  // Render secondary controls
  const renderSecondaryControls = () => (
    <Animated.View style={[styles.secondaryControls, expandedStyle]}>
      <View style={styles.controlsColumn}>
        {/* Stats Toggle */}
        <TouchableOpacity
          style={[
            styles.secondaryButton,
            showStats && styles.activeButton,
          ]}
          onPress={() => handlePress(onStatsToggle)}
        >
          <Activity size={16} color={ModernTheme.colors.text.primary} />
          <Text style={styles.buttonLabel}>Stats</Text>
        </TouchableOpacity>
        
        {/* Settings */}
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => handlePress(onSettings)}
        >
          <Settings size={16} color={ModernTheme.colors.text.primary} />
          <Text style={styles.buttonLabel}>Settings</Text>
        </TouchableOpacity>
        
        {/* Shuffle (if available) */}
        {onShuffle && (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => handlePress(onShuffle)}
          >
            <Shuffle size={16} color={ModernTheme.colors.text.primary} />
            <Text style={styles.buttonLabel}>Shuffle</Text>
          </TouchableOpacity>
        )}
        
        {/* Fullscreen (if available) */}
        {onFullscreen && (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => handlePress(onFullscreen)}
          >
            <Maximize2 size={16} color={ModernTheme.colors.text.primary} />
            <Text style={styles.buttonLabel}>Fullscreen</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
  
  // Render stream info
  const renderStreamInfo = () => (
    <View style={styles.streamInfo}>
      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Eye size={12} color={ModernTheme.colors.text.secondary} />
          <Text style={styles.infoText}>
            {totalViewers.toLocaleString()}
          </Text>
        </View>
        
        <View style={styles.infoItem}>
          <Users size={12} color={ModernTheme.colors.text.secondary} />
          <Text style={styles.infoText}>
            {streamCount} stream{streamCount !== 1 ? 's' : ''}
          </Text>
        </View>
        
        <View style={styles.infoItem}>
          <Zap size={12} color={ModernTheme.colors.success[500]} />
          <Text style={[styles.infoText, { color: ModernTheme.colors.success[500] }]}>
            LIVE
          </Text>
        </View>
      </View>
    </View>
  );
  
  if (!isVisible) return null;
  
  return (
    <Animated.View
      style={[getContainerStyle(), containerStyle]}
      entering={variant === 'minimal' ? FadeIn : SlideInUp}
      exiting={variant === 'minimal' ? FadeOut : SlideOutDown}
    >
      <BlurView 
        intensity={80} 
        style={[
          styles.blurContainer,
          position === 'left' || position === 'right' ? styles.verticalContainer : styles.horizontalContainer
        ]}
      >
        {/* Stream Info (if not minimal) */}
        {variant !== 'minimal' && renderStreamInfo()}
        
        {/* Primary Controls */}
        {renderPrimaryControls()}
        
        {/* Secondary Controls */}
        {variant === 'full' && renderSecondaryControls()}
      </BlurView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 1000,
  } as ViewStyle,
  bottomPosition: {
    bottom: ModernTheme.spacing.xl,
    left: ModernTheme.spacing.md,
    right: ModernTheme.spacing.md,
  } as ViewStyle,
  topPosition: {
    top: ModernTheme.spacing.xl,
    left: ModernTheme.spacing.md,
    right: ModernTheme.spacing.md,
  } as ViewStyle,
  leftPosition: {
    left: ModernTheme.spacing.md,
    top: '50%',
    transform: [{ translateY: -100 }],
  } as ViewStyle,
  rightPosition: {
    right: ModernTheme.spacing.md,
    top: '50%',
    transform: [{ translateY: -100 }],
  } as ViewStyle,
  blurContainer: {
    borderRadius: ModernTheme.borderRadius.xl,
    overflow: 'hidden',
    ...ModernTheme.shadows.lg,
  } as ViewStyle,
  horizontalContainer: {
    padding: ModernTheme.spacing.md,
  } as ViewStyle,
  verticalContainer: {
    padding: ModernTheme.spacing.md,
    flexDirection: 'column',
  } as ViewStyle,
  streamInfo: {
    marginBottom: ModernTheme.spacing.sm,
  } as ViewStyle,
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  } as ViewStyle,
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ModernTheme.spacing.xs,
  } as ViewStyle,
  infoText: {
    color: ModernTheme.colors.text.secondary,
    fontSize: ModernTheme.typography.sizes.xs,
    fontWeight: ModernTheme.typography.weights.medium,
  } as TextStyle,
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  controlsColumn: {
    flexDirection: 'column',
    gap: ModernTheme.spacing.sm,
  } as ViewStyle,
  controlButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  } as ViewStyle,
  primaryButton: {
    backgroundColor: ModernTheme.colors.accent[500],
    borderColor: ModernTheme.colors.accent[400],
  } as ViewStyle,
  activeButton: {
    backgroundColor: ModernTheme.colors.accent[500],
    borderColor: ModernTheme.colors.accent[400],
  } as ViewStyle,
  secondaryControls: {
    marginTop: ModernTheme.spacing.md,
    overflow: 'hidden',
  } as ViewStyle,
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: ModernTheme.borderRadius.md,
    padding: ModernTheme.spacing.sm,
    gap: ModernTheme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  } as ViewStyle,
  buttonLabel: {
    color: ModernTheme.colors.text.primary,
    fontSize: ModernTheme.typography.sizes.sm,
    fontWeight: ModernTheme.typography.weights.medium,
  } as TextStyle,
});

export default FloatingControls;