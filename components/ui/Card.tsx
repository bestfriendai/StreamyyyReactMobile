/**
 * Standardized Card Component
 * Uses unified theme system for consistent styling
 */

import React from 'react';
import {
  View,
  ViewStyle,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'flat' | 'glass';
  interactive?: boolean;
  onPress?: () => void;
  gradient?: boolean;
  gradientColors?: string[];
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  padding?: keyof typeof import('@/theme/unifiedTheme').unifiedTheme.tokens.spacing;
  margin?: keyof typeof import('@/theme/unifiedTheme').unifiedTheme.tokens.spacing;
  borderRadius?: keyof typeof import('@/theme/unifiedTheme').unifiedTheme.tokens.radius;
}

const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  interactive = false,
  onPress,
  gradient = false,
  gradientColors,
  style,
  contentStyle,
  padding = 6,
  margin,
  borderRadius = 'xl',
}) => {
  const { theme, helpers } = useTheme();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  // Animation handlers for interactive cards
  const handlePressIn = () => {
    if (interactive) {
      scale.value = withSpring(0.98, { damping: 15 });
      opacity.value = withTiming(0.9, { duration: 150 });
    }
  };

  const handlePressOut = () => {
    if (interactive) {
      scale.value = withSpring(1, { damping: 15 });
      opacity.value = withTiming(1, { duration: 150 });
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  // Get card styles based on variant
  const getCardStyles = (): ViewStyle => {
    const baseStyles: ViewStyle = {
      borderRadius: theme.tokens.radius[borderRadius],
      padding: theme.tokens.spacing[padding],
      overflow: 'hidden',
    };

    if (margin) {
      baseStyles.margin = theme.tokens.spacing[margin];
    }

    switch (variant) {
      case 'default':
        return {
          ...baseStyles,
          backgroundColor: theme.background.card,
          ...theme.tokens.shadows.md,
        };

      case 'elevated':
        return {
          ...baseStyles,
          backgroundColor: theme.background.elevated,
          ...theme.tokens.shadows.lg,
        };

      case 'flat':
        return {
          ...baseStyles,
          backgroundColor: theme.background.card,
          borderWidth: 1,
          borderColor: theme.border.primary,
        };

      case 'glass':
        return {
          ...baseStyles,
          backgroundColor: helpers.getColorWithOpacity(theme.background.card, 0.8),
          borderWidth: 1,
          borderColor: helpers.getColorWithOpacity(theme.border.primary, 0.2),
          backdropFilter: 'blur(10px)',
          ...Platform.select({
            web: {
              backdropFilter: 'blur(10px)',
            },
          }),
        };

      default:
        return baseStyles;
    }
  };

  const cardStyles = getCardStyles();
  const defaultGradientColors = gradientColors || theme.gradients.card;

  const renderContent = () => (
    <View style={contentStyle}>
      {children}
    </View>
  );

  // Interactive card with touch handling
  if (interactive && onPress) {
    const InteractiveCard = () => (
      <AnimatedTouchableOpacity
        style={[cardStyles, style, animatedStyle]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        {renderContent()}
      </AnimatedTouchableOpacity>
    );

    if (gradient) {
      return (
        <AnimatedTouchableOpacity
          style={[cardStyles, style, animatedStyle]}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
        >
          <LinearGradient
            colors={defaultGradientColors}
            style={{
              ...cardStyles,
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

    return <InteractiveCard />;
  }

  // Static card
  const StaticCard = () => (
    <AnimatedView style={[cardStyles, style]}>
      {renderContent()}
    </AnimatedView>
  );

  if (gradient) {
    return (
      <AnimatedView style={[cardStyles, style]}>
        <LinearGradient
          colors={defaultGradientColors}
          style={{
            ...cardStyles,
            margin: 0,
            width: '100%',
            height: '100%',
          }}
        >
          {renderContent()}
        </LinearGradient>
      </AnimatedView>
    );
  }

  return <StaticCard />;
};

// Specialized card variants
export const StreamCard: React.FC<Omit<CardProps, 'variant'> & {
  variant?: 'default' | 'compact';
}> = ({ variant = 'default', ...props }) => {
  const cardVariant = variant === 'compact' ? 'flat' : 'elevated';
  const borderRadius = variant === 'compact' ? 'lg' : 'xl';
  
  return (
    <Card
      {...props}
      variant={cardVariant}
      borderRadius={borderRadius}
      interactive
    />
  );
};

export const ControlCard: React.FC<Omit<CardProps, 'variant'>> = (props) => {
  return (
    <Card
      {...props}
      variant="glass"
      borderRadius="lg"
      padding={4}
    />
  );
};

export const InfoCard: React.FC<Omit<CardProps, 'variant'>> = (props) => {
  return (
    <Card
      {...props}
      variant="flat"
      borderRadius="lg"
      padding={5}
    />
  );
};

export default Card;