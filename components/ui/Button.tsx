/**
 * Standardized Button Component
 * Uses unified theme system for consistent styling
 */

import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  TouchableOpacity,
  Text,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'link' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  gradient?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  gradient = false,
  style,
  textStyle,
}) => {
  const { theme, helpers } = useTheme();
  const scale = useSharedValue(1);

  // Animation handlers
  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Get button configuration from theme
  const buttonConfig = theme.components.button.sizes[size];
  const buttonVariant = theme.components.button.variants[variant];

  // Build styles based on variant and theme
  const getButtonStyles = (): ViewStyle => {
    const baseStyles: ViewStyle = {
      ...buttonConfig,
      ...buttonVariant,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: iconPosition === 'left' ? 'row' : 'row-reverse',
      opacity: disabled ? 0.6 : 1,
      width: fullWidth ? '100%' : 'auto',
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyles,
          backgroundColor: gradient ? 'transparent' : theme.interactive.primary,
        };
      case 'secondary':
        return {
          ...baseStyles,
          backgroundColor: theme.interactive.secondary,
          borderColor: theme.border.primary,
        };
      case 'ghost':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
        };
      case 'link':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          paddingHorizontal: 0,
          paddingVertical: 0,
          height: 'auto',
        };
      case 'danger':
        return {
          ...baseStyles,
          backgroundColor: gradient ? 'transparent' : theme.interactive.danger,
        };
      default:
        return baseStyles;
    }
  };

  const getTextStyles = (): TextStyle => {
    const fontSize =
      theme.tokens.typography.sizes[
        size === 'xs'
          ? 'xs'
          : size === 'sm'
            ? 'sm'
            : size === 'md' ? 'base' :
            size === 'lg' ? 'md' :
              'lg'
      ];

    const baseTextStyles: TextStyle = {
      fontSize,
      fontWeight: theme.tokens.typography.weights.medium,
      fontFamily: theme.tokens.typography.fonts.primary,
    };

    switch (variant) {
      case 'primary':
      case 'danger':
        return {
          ...baseTextStyles,
          color: theme.text.inverse,
        };
      case 'secondary':
        return {
          ...baseTextStyles,
          color: theme.text.primary,
        };
      case 'ghost':
      case 'link':
        return {
          ...baseTextStyles,
          color: theme.interactive.primary,
        };
      default:
        return {
          ...baseTextStyles,
          color: theme.text.primary,
        };
    }
  };

  const getGradientColors = (): string[] => {
    switch (variant) {
      case 'primary':
        return theme.gradients.primary;
      case 'danger':
        return theme.gradients.error;
      default:
        return theme.gradients.primary;
    }
  };

  const buttonStyles = getButtonStyles();
  const textStyles = getTextStyles();

  const renderContent = () => (
    <View
      style={{
        flexDirection: iconPosition === 'left' ? 'row' : 'row-reverse',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={textStyles.color}
          style={{ marginRight: title ? theme.tokens.spacing[2] : 0 }}
        />
      )}
      {!loading && icon && (
        <View
          style={{
            marginRight: iconPosition === 'left' && title ? theme.tokens.spacing[2] : 0,
            marginLeft: iconPosition === 'right' && title ? theme.tokens.spacing[2] : 0,
          }}
        >
          {icon}
        </View>
      )}
      {title && (
        <Text style={[textStyles, textStyle]} numberOfLines={1}>
          {title}
        </Text>
      )}
    </View>
  );

  const ButtonComponent = () => (
    <AnimatedTouchableOpacity
      style={[buttonStyles, style, animatedStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {renderContent()}
    </AnimatedTouchableOpacity>
  );

  if (gradient && (variant === 'primary' || variant === 'danger')) {
    return (
      <AnimatedTouchableOpacity
        style={[buttonStyles, style, animatedStyle]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={getGradientColors()}
          style={{
            ...buttonStyles,
            margin: 0,
            width: '100%',
            height: '100%',
          }}
        >
          {renderContent()}
        </LinearGradient>
      </AnimatedTouchableOpacity>
    );
  }

  return <ButtonComponent />;
};

export default Button;
