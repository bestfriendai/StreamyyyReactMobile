import React from 'react';
import {
  TouchableOpacity,
  Text,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ModernTheme } from '@/theme/modernTheme';
import { HapticFeedback } from '@/utils/haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface ModernButtonProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  isDisabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  hapticFeedback?: boolean;
  gradient?: boolean;
  fullWidth?: boolean;
  borderRadius?: number;
}

export const ModernButton: React.FC<ModernButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  isDisabled = false,
  icon,
  iconPosition = 'left',
  onPress,
  style,
  textStyle,
  hapticFeedback = true,
  gradient = false,
  fullWidth = false,
  borderRadius,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  
  // Get variant styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: ModernTheme.colors.accent[500],
          borderColor: ModernTheme.colors.accent[400],
          textColor: '#ffffff',
          gradientColors: ModernTheme.colors.gradients.accent,
        };
      case 'secondary':
        return {
          backgroundColor: ModernTheme.colors.background.secondary,
          borderColor: ModernTheme.colors.border.primary,
          textColor: ModernTheme.colors.text.primary,
          gradientColors: ModernTheme.colors.gradients.secondary,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: ModernTheme.colors.accent[500],
          textColor: ModernTheme.colors.accent[500],
          gradientColors: ['transparent', 'transparent'],
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          textColor: ModernTheme.colors.text.primary,
          gradientColors: ['transparent', 'transparent'],
        };
      case 'danger':
        return {
          backgroundColor: ModernTheme.colors.error[500],
          borderColor: ModernTheme.colors.error[400],
          textColor: '#ffffff',
          gradientColors: ModernTheme.colors.gradients.danger,
        };
      case 'success':
        return {
          backgroundColor: ModernTheme.colors.success[500],
          borderColor: ModernTheme.colors.success[400],
          textColor: '#ffffff',
          gradientColors: ModernTheme.colors.gradients.success,
        };
      default:
        return {
          backgroundColor: ModernTheme.colors.accent[500],
          borderColor: ModernTheme.colors.accent[400],
          textColor: '#ffffff',
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
          fontSize: ModernTheme.typography.sizes.sm,
          height: 32,
          borderRadius: ModernTheme.borderRadius.sm,
        };
      case 'lg':
        return {
          paddingHorizontal: ModernTheme.spacing.lg,
          paddingVertical: ModernTheme.spacing.md,
          fontSize: ModernTheme.typography.sizes.lg,
          height: 56,
          borderRadius: ModernTheme.borderRadius.lg,
        };
      case 'xl':
        return {
          paddingHorizontal: ModernTheme.spacing.xl,
          paddingVertical: ModernTheme.spacing.lg,
          fontSize: ModernTheme.typography.sizes.xl,
          height: 64,
          borderRadius: ModernTheme.borderRadius.xl,
        };
      default:
        return {
          paddingHorizontal: ModernTheme.spacing.md,
          paddingVertical: ModernTheme.spacing.sm,
          fontSize: ModernTheme.typography.sizes.md,
          height: 48,
          borderRadius: ModernTheme.borderRadius.md,
        };
    }
  };
  
  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();
  
  // Handle press with animation
  const handlePress = () => {
    if (isDisabled || isLoading) return;
    
    scale.value = withSpring(0.95, { damping: 15 }, () => {
      scale.value = withSpring(1);
    });
    
    if (hapticFeedback) {
      HapticFeedback.light();
    }
    
    onPress();
  };
  
  // Animated styles
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
  
  // Disabled state
  React.useEffect(() => {
    opacity.value = withTiming(isDisabled ? 0.5 : 1, { duration: 200 });
  }, [isDisabled]);
  
  const buttonStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: sizeStyles.height,
    paddingHorizontal: sizeStyles.paddingHorizontal,
    paddingVertical: sizeStyles.paddingVertical,
    borderRadius: borderRadius ?? sizeStyles.borderRadius,
    backgroundColor: variantStyles.backgroundColor,
    borderWidth: variant === 'outline' ? 2 : 1,
    borderColor: variantStyles.borderColor,
    width: fullWidth ? '100%' : undefined,
    ...ModernTheme.shadows.sm,
  };
  
  const textStyleCombined: TextStyle = {
    color: variantStyles.textColor,
    fontSize: sizeStyles.fontSize,
    fontWeight: ModernTheme.typography.weights.semibold,
    fontFamily: ModernTheme.typography.fonts.primary,
    ...textStyle,
  };
  
  const renderContent = () => (
    <>
      {isLoading && (
        <ActivityIndicator
          size="small"
          color={variantStyles.textColor}
          style={{ marginRight: ModernTheme.spacing.sm }}
        />
      )}
      
      {icon && iconPosition === 'left' && !isLoading && (
        <div style={{ marginRight: ModernTheme.spacing.sm }}>
          {icon}
        </div>
      )}
      
      <Text style={textStyleCombined}>
        {isLoading ? 'Loading...' : title}
      </Text>
      
      {icon && iconPosition === 'right' && !isLoading && (
        <div style={{ marginLeft: ModernTheme.spacing.sm }}>
          {icon}
        </div>
      )}
    </>
  );
  
  return (
    <Animated.View style={[animatedStyle, style]}>
      {gradient && !isDisabled ? (
        <LinearGradient
          colors={variantStyles.gradientColors}
          style={buttonStyle}
        >
          <TouchableOpacity
            onPress={handlePress}
            disabled={isDisabled || isLoading}
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
            activeOpacity={0.8}
          >
            {renderContent()}
          </TouchableOpacity>
        </LinearGradient>
      ) : (
        <TouchableOpacity
          onPress={handlePress}
          disabled={isDisabled || isLoading}
          style={buttonStyle}
          activeOpacity={0.8}
        >
          {renderContent()}
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

export default ModernButton;