import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { ModernTheme } from '@/theme/modernTheme';

export type BadgeVariant =
  | 'live'
  | 'offline'
  | 'loading'
  | 'error'
  | 'success'
  | 'warning'
  | 'info'
  | 'primary'
  | 'secondary';
export type BadgeSize = 'sm' | 'md' | 'lg';

interface StatusBadgeProps {
  variant: BadgeVariant;
  size?: BadgeSize;
  label?: string;
  showDot?: boolean;
  showPulse?: boolean;
  gradient?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  customColor?: string;
  customTextColor?: string;
  icon?: React.ReactNode;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  variant,
  size = 'md',
  label,
  showDot = true,
  showPulse = false,
  gradient = false,
  style,
  textStyle,
  customColor,
  customTextColor,
  icon,
}) => {
  const pulseScale = useSharedValue(1);
  const glowIntensity = useSharedValue(0);

  // Pulse animation
  React.useEffect(() => {
    if (showPulse) {
      pulseScale.value = withRepeat(
        withSequence(withTiming(1.2, { duration: 1000 }), withTiming(1, { duration: 1000 })),
        -1
      );

      glowIntensity.value = withRepeat(
        withSequence(withTiming(1, { duration: 1000 }), withTiming(0.3, { duration: 1000 })),
        -1
      );
    }
  }, [showPulse]);

  // Get variant styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'live':
        return {
          backgroundColor: ModernTheme.colors.status.live,
          borderColor: ModernTheme.colors.success[400],
          textColor: '#ffffff',
          dotColor: ModernTheme.colors.status.live,
          gradientColors: ['#00ff00', '#00cc00'],
        };
      case 'offline':
        return {
          backgroundColor: ModernTheme.colors.status.offline,
          borderColor: ModernTheme.colors.gray[600],
          textColor: ModernTheme.colors.text.primary,
          dotColor: ModernTheme.colors.status.offline,
          gradientColors: ['#666666', '#555555'],
        };
      case 'loading':
        return {
          backgroundColor: ModernTheme.colors.status.loading,
          borderColor: ModernTheme.colors.warning[400],
          textColor: '#000000',
          dotColor: ModernTheme.colors.status.loading,
          gradientColors: ['#fbbf24', '#f59e0b'],
        };
      case 'error':
        return {
          backgroundColor: ModernTheme.colors.status.error,
          borderColor: ModernTheme.colors.error[400],
          textColor: '#ffffff',
          dotColor: ModernTheme.colors.status.error,
          gradientColors: ['#ef4444', '#dc2626'],
        };
      case 'success':
        return {
          backgroundColor: ModernTheme.colors.success[500],
          borderColor: ModernTheme.colors.success[400],
          textColor: '#ffffff',
          dotColor: ModernTheme.colors.success[500],
          gradientColors: ['#10b981', '#059669'],
        };
      case 'warning':
        return {
          backgroundColor: ModernTheme.colors.warning[500],
          borderColor: ModernTheme.colors.warning[400],
          textColor: '#000000',
          dotColor: ModernTheme.colors.warning[500],
          gradientColors: ['#f59e0b', '#d97706'],
        };
      case 'info':
        return {
          backgroundColor: ModernTheme.colors.primary[500],
          borderColor: ModernTheme.colors.primary[400],
          textColor: '#ffffff',
          dotColor: ModernTheme.colors.primary[500],
          gradientColors: ['#3b82f6', '#2563eb'],
        };
      case 'primary':
        return {
          backgroundColor: ModernTheme.colors.accent[500],
          borderColor: ModernTheme.colors.accent[400],
          textColor: '#ffffff',
          dotColor: ModernTheme.colors.accent[500],
          gradientColors: ModernTheme.colors.gradients.accent,
        };
      case 'secondary':
        return {
          backgroundColor: ModernTheme.colors.background.secondary,
          borderColor: ModernTheme.colors.border.primary,
          textColor: ModernTheme.colors.text.primary,
          dotColor: ModernTheme.colors.text.secondary,
          gradientColors: ['#1a1a1a', '#2a2a2a'],
        };
      default:
        return {
          backgroundColor: ModernTheme.colors.accent[500],
          borderColor: ModernTheme.colors.accent[400],
          textColor: '#ffffff',
          dotColor: ModernTheme.colors.accent[500],
          gradientColors: ModernTheme.colors.gradients.accent,
        };
    }
  };

  // Get size styles
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          paddingHorizontal: ModernTheme.spacing.sm,
          paddingVertical: ModernTheme.spacing.xs,
          fontSize: ModernTheme.typography.sizes.xs,
          borderRadius: ModernTheme.borderRadius.sm,
          dotSize: 4,
          height: 20,
        };
      case 'lg':
        return {
          paddingHorizontal: ModernTheme.spacing.lg,
          paddingVertical: ModernTheme.spacing.sm,
          fontSize: ModernTheme.typography.sizes.md,
          borderRadius: ModernTheme.borderRadius.lg,
          dotSize: 8,
          height: 36,
        };
      default:
        return {
          paddingHorizontal: ModernTheme.spacing.md,
          paddingVertical: ModernTheme.spacing.sm,
          fontSize: ModernTheme.typography.sizes.sm,
          borderRadius: ModernTheme.borderRadius.md,
          dotSize: 6,
          height: 28,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  // Default labels
  const getDefaultLabel = () => {
    switch (variant) {
      case 'live':
        return 'LIVE';
      case 'offline':
        return 'OFFLINE';
      case 'loading':
        return 'LOADING';
      case 'error':
        return 'ERROR';
      case 'success':
        return 'SUCCESS';
      case 'warning':
        return 'WARNING';
      case 'info':
        return 'INFO';
      default:
        return '';
    }
  };

  // Animated styles
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(glowIntensity.value, [0, 1], [0.2, 0.8], Extrapolate.CLAMP),
    shadowRadius: interpolate(glowIntensity.value, [0, 1], [2, 8], Extrapolate.CLAMP),
  }));

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: sizeStyles.height,
    paddingHorizontal: sizeStyles.paddingHorizontal,
    paddingVertical: sizeStyles.paddingVertical,
    borderRadius: sizeStyles.borderRadius,
    backgroundColor: customColor || variantStyles.backgroundColor,
    borderWidth: 1,
    borderColor: variantStyles.borderColor,
    shadowColor: variantStyles.backgroundColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
    ...style,
  };

  const textStyleCombined: TextStyle = {
    color: customTextColor || variantStyles.textColor,
    fontSize: sizeStyles.fontSize,
    fontWeight: ModernTheme.typography.weights.bold,
    fontFamily: ModernTheme.typography.fonts.primary,
    letterSpacing: 0.5,
    ...textStyle,
  };

  const renderContent = () => (
    <>
      {icon && <View style={{ marginRight: ModernTheme.spacing.xs }}>{icon}</View>}

      {showDot && (
        <Animated.View
          style={[
            {
              width: sizeStyles.dotSize,
              height: sizeStyles.dotSize,
              borderRadius: sizeStyles.dotSize / 2,
              backgroundColor: variantStyles.dotColor,
              marginRight: label || getDefaultLabel() ? ModernTheme.spacing.xs : 0,
            },
            showPulse && pulseStyle,
          ]}
        />
      )}

      {(label || getDefaultLabel()) && (
        <Text style={textStyleCombined}>{label || getDefaultLabel()}</Text>
      )}
    </>
  );

  return (
    <Animated.View style={[showPulse && glowStyle]}>
      {gradient ? (
        <LinearGradient colors={variantStyles.gradientColors} style={containerStyle}>
          {renderContent()}
        </LinearGradient>
      ) : (
        <View style={containerStyle}>{renderContent()}</View>
      )}
    </Animated.View>
  );
};

export default StatusBadge;
