import React, { useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ViewStyle,
  TextStyle,
  Pressable,
  Dimensions,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  interpolate,
  interpolateColor,
  runOnJS,
  SlideInRight,
  SlideOutLeft,
  FadeIn,
  FadeOut,
  BounceIn,
  ZoomIn,
  FlipInEasyX,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView, MotiText, AnimatePresence } from 'moti';
import { BlurView } from 'expo-blur';
import {
  Play,
  Pause,
  Heart,
  Share,
  Download,
  Bookmark,
  Settings,
  ChevronRight,
  Plus,
  Minus,
  Check,
  X,
  Star,
  ThumbsUp,
  ThumbsDown,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  Zap,
  Shield,
  Gift,
  Award,
  Target,
  Sparkles,
  Flame,
  Crown,
  Diamond,
  Lock,
  Unlock,
} from 'lucide-react-native';
import { Theme } from '@/constants/Theme';
import { hapticFeedbackService } from '@/services/hapticFeedbackService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Button variants and styles
export type ButtonVariant = 
  | 'primary' 
  | 'secondary' 
  | 'outline' 
  | 'ghost' 
  | 'danger' 
  | 'success' 
  | 'warning' 
  | 'premium' 
  | 'gradient'
  | 'glassmorphic'
  | 'neon'
  | 'minimal';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'custom';

export type ButtonState = 'idle' | 'loading' | 'success' | 'error' | 'disabled';

export type AnimationType = 
  | 'bounce' 
  | 'pulse' 
  | 'shake' 
  | 'glow' 
  | 'ripple' 
  | 'morph' 
  | 'slide' 
  | 'rotate' 
  | 'scale'
  | 'flip';

export interface ButtonConfig {
  variant: ButtonVariant;
  size: ButtonSize;
  state: ButtonState;
  animation?: AnimationType;
  hapticType?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';
  soundEnabled?: boolean;
  longPressEnabled?: boolean;
  doubleClickEnabled?: boolean;
  swipeEnabled?: boolean;
  pressAndHoldEnabled?: boolean;
}

export interface InteractiveButtonProps {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right' | 'top' | 'bottom';
  onPress?: () => void;
  onLongPress?: () => void;
  onDoublePress?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  config: ButtonConfig;
  disabled?: boolean;
  loading?: boolean;
  progress?: number;
  badge?: string | number;
  badgeColor?: string;
  customStyle?: ViewStyle;
  customTextStyle?: TextStyle;
  children?: React.ReactNode;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  fullWidth?: boolean;
  aspectRatio?: number;
  minWidth?: number;
  maxWidth?: number;
  gradient?: string[];
  glowColor?: string;
  borderRadius?: number;
  elevation?: number;
  shadowColor?: string;
  rippleColor?: string;
  activeScale?: number;
  animationDuration?: number;
  delayMs?: number;
  repeatCount?: number;
  autoAnimate?: boolean;
  persistAnimation?: boolean;
}

export const InteractiveButton: React.FC<InteractiveButtonProps> = ({
  title,
  subtitle,
  icon,
  iconPosition = 'left',
  onPress,
  onLongPress,
  onDoublePress,
  onSwipeLeft,
  onSwipeRight,
  onPressIn,
  onPressOut,
  config,
  disabled = false,
  loading = false,
  progress = 0,
  badge,
  badgeColor,
  customStyle,
  customTextStyle,
  children,
  testID,
  accessibilityLabel,
  accessibilityHint,
  fullWidth = false,
  aspectRatio,
  minWidth,
  maxWidth,
  gradient,
  glowColor,
  borderRadius,
  elevation,
  shadowColor,
  rippleColor = Theme.colors.accent.primary,
  activeScale = 0.95,
  animationDuration = 200,
  delayMs = 0,
  repeatCount = 1,
  autoAnimate = false,
  persistAnimation = false,
}) => {
  // Animation values
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const rotation = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const borderWidth = useSharedValue(1);
  const backgroundOpacity = useSharedValue(1);
  const progressWidth = useSharedValue(0);
  const badgeScale = useSharedValue(0);
  const rippleScale = useSharedValue(0);
  const rippleOpacity = useSharedValue(0);

  // Refs for interaction tracking
  const pressStartTime = useRef<number>(0);
  const doubleTapTimer = useRef<NodeJS.Timeout>();
  const longPressTimer = useRef<NodeJS.Timeout>();
  const swipeStartX = useRef<number>(0);
  const swipeStartY = useRef<number>(0);

  // Initialize animation states
  useEffect(() => {
    if (badge) {
      badgeScale.value = withSpring(1, { damping: 15 });
    } else {
      badgeScale.value = withTiming(0);
    }
  }, [badge]);

  useEffect(() => {
    progressWidth.value = withTiming(progress * 100, { duration: 300 });
  }, [progress]);

  useEffect(() => {
    if (autoAnimate && !disabled && !loading) {
      startAutoAnimation();
    }
  }, [autoAnimate, disabled, loading]);

  // Get variant styles
  const getVariantStyles = useCallback(() => {
    const baseStyles = getBaseStyles();
    
    switch (config.variant) {
      case 'primary':
        return {
          ...baseStyles,
          backgroundColor: Theme.colors.accent.primary,
          borderColor: Theme.colors.accent.primary,
          colors: [Theme.colors.accent.primary, Theme.colors.accent.secondary],
        };
      case 'secondary':
        return {
          ...baseStyles,
          backgroundColor: Theme.colors.background.secondary,
          borderColor: Theme.colors.border.primary,
          colors: [Theme.colors.background.secondary, Theme.colors.background.tertiary],
        };
      case 'outline':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          borderColor: Theme.colors.accent.primary,
          borderWidth: 2,
        };
      case 'ghost':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          borderColor: 'transparent',
        };
      case 'danger':
        return {
          ...baseStyles,
          backgroundColor: Theme.colors.functional.error,
          borderColor: Theme.colors.functional.error,
          colors: ['#ef4444', '#dc2626'],
        };
      case 'success':
        return {
          ...baseStyles,
          backgroundColor: Theme.colors.functional.success,
          borderColor: Theme.colors.functional.success,
          colors: ['#10b981', '#059669'],
        };
      case 'warning':
        return {
          ...baseStyles,
          backgroundColor: Theme.colors.functional.warning,
          borderColor: Theme.colors.functional.warning,
          colors: ['#f59e0b', '#d97706'],
        };
      case 'premium':
        return {
          ...baseStyles,
          backgroundColor: '#FFD700',
          borderColor: '#FFD700',
          colors: ['#FFD700', '#FFA500', '#FF8C00'],
        };
      case 'gradient':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          colors: gradient || Theme.gradients.primary,
        };
      case 'glassmorphic':
        return {
          ...baseStyles,
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderColor: 'rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(10px)',
        };
      case 'neon':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          borderColor: glowColor || Theme.colors.accent.primary,
          borderWidth: 2,
          shadowColor: glowColor || Theme.colors.accent.primary,
          shadowOpacity: 0.8,
          shadowRadius: 20,
          elevation: 20,
        };
      case 'minimal':
        return {
          ...baseStyles,
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderColor: 'transparent',
        };
      default:
        return baseStyles;
    }
  }, [config.variant, gradient, glowColor]);

  // Get base styles
  const getBaseStyles = useCallback(() => ({
    borderRadius: borderRadius || getSizeConfig().borderRadius,
    paddingHorizontal: getSizeConfig().paddingHorizontal,
    paddingVertical: getSizeConfig().paddingVertical,
    minHeight: getSizeConfig().height,
    minWidth: minWidth || getSizeConfig().minWidth,
    maxWidth: maxWidth,
  }), [borderRadius, minWidth, maxWidth]);

  // Get size configuration
  const getSizeConfig = useCallback(() => {
    switch (config.size) {
      case 'xs':
        return {
          height: 32,
          paddingHorizontal: 12,
          paddingVertical: 6,
          fontSize: 12,
          iconSize: 14,
          borderRadius: 6,
          minWidth: 64,
        };
      case 'sm':
        return {
          height: 40,
          paddingHorizontal: 16,
          paddingVertical: 8,
          fontSize: 14,
          iconSize: 16,
          borderRadius: 8,
          minWidth: 80,
        };
      case 'md':
        return {
          height: 48,
          paddingHorizontal: 20,
          paddingVertical: 12,
          fontSize: 16,
          iconSize: 18,
          borderRadius: 10,
          minWidth: 96,
        };
      case 'lg':
        return {
          height: 56,
          paddingHorizontal: 24,
          paddingVertical: 16,
          fontSize: 18,
          iconSize: 20,
          borderRadius: 12,
          minWidth: 112,
        };
      case 'xl':
        return {
          height: 64,
          paddingHorizontal: 32,
          paddingVertical: 20,
          fontSize: 20,
          iconSize: 24,
          borderRadius: 16,
          minWidth: 128,
        };
      default:
        return {
          height: 48,
          paddingHorizontal: 20,
          paddingVertical: 12,
          fontSize: 16,
          iconSize: 18,
          borderRadius: 10,
          minWidth: 96,
        };
    }
  }, [config.size]);

  // Get text color
  const getTextColor = useCallback(() => {
    if (disabled) return Theme.colors.text.disabled;
    
    switch (config.variant) {
      case 'primary':
      case 'danger':
      case 'success':
      case 'warning':
      case 'premium':
        return '#ffffff';
      case 'outline':
      case 'neon':
        return Theme.colors.accent.primary;
      case 'ghost':
      case 'minimal':
        return Theme.colors.text.primary;
      case 'glassmorphic':
        return Theme.colors.text.primary;
      default:
        return Theme.colors.text.primary;
    }
  }, [config.variant, disabled]);

  // Start auto animation
  const startAutoAnimation = useCallback(() => {
    if (!config.animation) return;

    const runAnimation = () => {
      switch (config.animation) {
        case 'pulse':
          scale.value = withSequence(
            withTiming(1.05, { duration: animationDuration }),
            withTiming(1, { duration: animationDuration })
          );
          break;
        case 'glow':
          glowOpacity.value = withSequence(
            withTiming(1, { duration: animationDuration }),
            withTiming(0, { duration: animationDuration })
          );
          break;
        case 'bounce':
          translateY.value = withSequence(
            withTiming(-5, { duration: animationDuration / 2 }),
            withTiming(0, { duration: animationDuration / 2 })
          );
          break;
        case 'rotate':
          rotation.value = withTiming(rotation.value + 360, { duration: animationDuration * 2 });
          break;
        case 'shake':
          translateX.value = withSequence(
            withTiming(-5, { duration: 50 }),
            withTiming(5, { duration: 50 }),
            withTiming(-5, { duration: 50 }),
            withTiming(0, { duration: 50 })
          );
          break;
      }
    };

    if (delayMs > 0) {
      setTimeout(runAnimation, delayMs);
    } else {
      runAnimation();
    }

    if (persistAnimation && repeatCount > 1) {
      for (let i = 1; i < repeatCount; i++) {
        setTimeout(runAnimation, (delayMs + animationDuration * 2) * i);
      }
    }
  }, [config.animation, animationDuration, delayMs, repeatCount, persistAnimation]);

  // Handle press events
  const handlePressIn = useCallback(() => {
    if (disabled || loading) return;

    pressStartTime.current = Date.now();
    
    // Haptic feedback
    if (config.hapticType) {
      hapticFeedbackService.quickFeedback(config.hapticType);
    }

    // Visual feedback
    scale.value = withSpring(activeScale, { damping: 15 });
    
    if (config.variant === 'neon' || config.animation === 'glow') {
      glowOpacity.value = withTiming(1, { duration: 100 });
    }

    // Ripple effect
    if (config.animation === 'ripple') {
      rippleScale.value = 0;
      rippleOpacity.value = 0.3;
      rippleScale.value = withTiming(1, { duration: 300 });
      rippleOpacity.value = withTiming(0, { duration: 300 });
    }

    onPressIn?.();

    // Long press detection
    if (config.longPressEnabled && onLongPress) {
      longPressTimer.current = setTimeout(() => {
        hapticFeedbackService.quickFeedback('heavy');
        onLongPress();
      }, 500);
    }
  }, [disabled, loading, config, activeScale, onPressIn, onLongPress]);

  const handlePressOut = useCallback(() => {
    if (disabled || loading) return;

    const pressDuration = Date.now() - pressStartTime.current;
    
    // Reset visual state
    scale.value = withSpring(1, { damping: 15 });
    glowOpacity.value = withTiming(0, { duration: 200 });

    // Clear long press timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }

    onPressOut?.();
  }, [disabled, loading, onPressOut]);

  const handlePress = useCallback(() => {
    if (disabled || loading) return;

    // Double tap detection
    if (config.doubleClickEnabled && onDoublePress) {
      if (doubleTapTimer.current) {
        clearTimeout(doubleTapTimer.current);
        doubleTapTimer.current = undefined;
        hapticFeedbackService.quickFeedback('medium');
        onDoublePress();
        return;
      } else {
        doubleTapTimer.current = setTimeout(() => {
          doubleTapTimer.current = undefined;
          onPress?.();
        }, 300);
        return;
      }
    }

    // State-based animations
    if (config.state === 'success') {
      scale.value = withSequence(
        withTiming(1.1, { duration: 100 }),
        withTiming(1, { duration: 100 })
      );
    } else if (config.state === 'error') {
      translateX.value = withSequence(
        withTiming(-5, { duration: 50 }),
        withTiming(5, { duration: 50 }),
        withTiming(-5, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }

    onPress?.();
  }, [disabled, loading, config, onPress, onDoublePress]);

  // Animated styles
  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
    opacity: opacity.value,
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    shadowOpacity: glowOpacity.value * 0.8,
  }));

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const animatedBadgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
  }));

  const animatedRippleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rippleScale.value }],
    opacity: rippleOpacity.value,
  }));

  // Get content layout
  const getContentLayout = () => {
    const hasIcon = !!icon;
    const hasTitle = !!title;
    const hasSubtitle = !!subtitle;

    if (iconPosition === 'top' || iconPosition === 'bottom') {
      return 'column';
    } else {
      return 'row';
    }
  };

  const variantStyles = getVariantStyles();
  const sizeConfig = getSizeConfig();
  const textColor = getTextColor();
  const contentLayout = getContentLayout();

  return (
    <View style={[
      fullWidth && { width: '100%' },
      aspectRatio && { aspectRatio },
      customStyle,
    ]}>
      {/* Glow Effect */}
      {(config.variant === 'neon' || config.animation === 'glow') && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: variantStyles.borderRadius,
              backgroundColor: glowColor || Theme.colors.accent.primary,
              opacity: 0.3,
            },
            animatedGlowStyle,
          ]}
        />
      )}

      {/* Main Button */}
      <Animated.View style={[animatedButtonStyle]}>
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handlePress}
          disabled={disabled || loading}
          style={({ pressed }) => [
            styles.buttonBase,
            variantStyles,
            {
              opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
            },
          ]}
          testID={testID}
          accessibilityLabel={accessibilityLabel || title}
          accessibilityHint={accessibilityHint}
          accessibilityRole="button"
          accessibilityState={{
            disabled: disabled || loading,
            busy: loading,
          }}
        >
          {/* Background Gradient */}
          {(config.variant === 'gradient' || config.variant === 'primary' || 
            config.variant === 'premium') && variantStyles.colors && (
            <LinearGradient
              colors={variantStyles.colors}
              style={StyleSheet.absoluteFill}
            />
          )}

          {/* Progress Bar */}
          {progress > 0 && (
            <View style={styles.progressContainer}>
              <Animated.View
                style={[
                  styles.progressBar,
                  { backgroundColor: textColor },
                  animatedProgressStyle,
                ]}
              />
            </View>
          )}

          {/* Ripple Effect */}
          {config.animation === 'ripple' && (
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: rippleColor,
                  borderRadius: variantStyles.borderRadius,
                },
                animatedRippleStyle,
              ]}
            />
          )}

          {/* Content Container */}
          <View
            style={[
              styles.contentContainer,
              contentLayout === 'column' ? styles.columnLayout : styles.rowLayout,
            ]}
          >
            {/* Icon */}
            {icon && (iconPosition === 'left' || iconPosition === 'top') && (
              <View style={[
                styles.iconContainer,
                iconPosition === 'top' && styles.iconTop,
                iconPosition === 'left' && title && styles.iconLeft,
              ]}>
                {React.cloneElement(icon as React.ReactElement, {
                  size: sizeConfig.iconSize,
                  color: textColor,
                })}
              </View>
            )}

            {/* Text Content */}
            {(title || subtitle || children) && (
              <View style={styles.textContainer}>
                {title && (
                  <Text
                    style={[
                      styles.titleText,
                      {
                        fontSize: sizeConfig.fontSize,
                        color: textColor,
                      },
                      customTextStyle,
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {title}
                  </Text>
                )}
                
                {subtitle && (
                  <Text
                    style={[
                      styles.subtitleText,
                      {
                        fontSize: sizeConfig.fontSize - 2,
                        color: textColor,
                        opacity: 0.7,
                      },
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {subtitle}
                  </Text>
                )}
                
                {children}
              </View>
            )}

            {/* Icon Right/Bottom */}
            {icon && (iconPosition === 'right' || iconPosition === 'bottom') && (
              <View style={[
                styles.iconContainer,
                iconPosition === 'bottom' && styles.iconBottom,
                iconPosition === 'right' && title && styles.iconRight,
              ]}>
                {React.cloneElement(icon as React.ReactElement, {
                  size: sizeConfig.iconSize,
                  color: textColor,
                })}
              </View>
            )}
          </View>

          {/* Loading Indicator */}
          {loading && (
            <View style={[StyleSheet.absoluteFill, styles.loadingContainer]}>
              <MotiView
                from={{ rotate: '0deg' }}
                animate={{ rotate: '360deg' }}
                transition={{
                  type: 'timing',
                  duration: 1000,
                  loop: true,
                }}
              >
                <RotateCcw size={sizeConfig.iconSize} color={textColor} />
              </MotiView>
            </View>
          )}
        </Pressable>
      </Animated.View>

      {/* Badge */}
      {badge && (
        <Animated.View style={[styles.badge, animatedBadgeStyle]}>
          <View
            style={[
              styles.badgeContent,
              { backgroundColor: badgeColor || Theme.colors.functional.error },
            ]}
          >
            <Text style={styles.badgeText}>
              {typeof badge === 'number' && badge > 99 ? '99+' : badge}
            </Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
};

// Button group component for related actions
export interface ButtonGroupProps {
  buttons: InteractiveButtonProps[];
  direction?: 'horizontal' | 'vertical';
  spacing?: number;
  connected?: boolean;
  style?: ViewStyle;
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  buttons,
  direction = 'horizontal',
  spacing = Theme.spacing.sm,
  connected = false,
  style,
}) => {
  return (
    <View
      style={[
        styles.buttonGroup,
        direction === 'horizontal' ? styles.horizontalGroup : styles.verticalGroup,
        { gap: connected ? 0 : spacing },
        style,
      ]}
    >
      {buttons.map((buttonProps, index) => (
        <InteractiveButton
          key={index}
          {...buttonProps}
          customStyle={[
            buttonProps.customStyle,
            connected && getConnectedButtonStyle(index, buttons.length, direction),
          ]}
        />
      ))}
    </View>
  );
};

// Helper function for connected button styles
const getConnectedButtonStyle = (
  index: number,
  totalButtons: number,
  direction: 'horizontal' | 'vertical'
): ViewStyle => {
  const isFirst = index === 0;
  const isLast = index === totalButtons - 1;
  const isMiddle = !isFirst && !isLast;

  if (direction === 'horizontal') {
    return {
      borderTopRightRadius: isLast ? undefined : 0,
      borderBottomRightRadius: isLast ? undefined : 0,
      borderTopLeftRadius: isFirst ? undefined : 0,
      borderBottomLeftRadius: isFirst ? undefined : 0,
      borderRightWidth: isLast ? undefined : 0,
    };
  } else {
    return {
      borderTopLeftRadius: isFirst ? undefined : 0,
      borderTopRightRadius: isFirst ? undefined : 0,
      borderBottomLeftRadius: isLast ? undefined : 0,
      borderBottomRightRadius: isLast ? undefined : 0,
      borderBottomWidth: isLast ? undefined : 0,
    };
  }
};

const styles = StyleSheet.create({
  buttonBase: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    overflow: 'hidden',
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  rowLayout: {
    flexDirection: 'row',
  },
  columnLayout: {
    flexDirection: 'column',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: Theme.spacing.sm,
  },
  iconRight: {
    marginLeft: Theme.spacing.sm,
  },
  iconTop: {
    marginBottom: Theme.spacing.xs,
  },
  iconBottom: {
    marginTop: Theme.spacing.xs,
  },
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  titleText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  subtitleText: {
    fontWeight: '400',
    textAlign: 'center',
    marginTop: 2,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  progressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  progressBar: {
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    zIndex: 10,
  },
  badgeContent: {
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  buttonGroup: {
    flexDirection: 'row',
  },
  horizontalGroup: {
    flexDirection: 'row',
  },
  verticalGroup: {
    flexDirection: 'column',
  },
});

export default InteractiveButton;