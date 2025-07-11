/**
 * Standardized Loading Spinner Component
 * Uses unified theme system for consistent styling
 */

import React, { useEffect } from 'react';
import { View, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'gradient' | 'pulse' | 'dots' | 'bars';
  color?: string;
  speed?: 'slow' | 'normal' | 'fast';
  style?: ViewStyle;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'default',
  color,
  speed = 'normal',
  style,
}) => {
  const { theme } = useTheme();

  // Size mapping
  const sizeMap = {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 32,
    xl: 40,
  };

  const spinnerSize = sizeMap[size];
  const spinnerColor = color || theme.interactive.primary;

  // Animation values
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  // Speed mapping
  const durationMap = {
    slow: 1500,
    normal: 1000,
    fast: 600,
  };

  const duration = durationMap[speed];

  useEffect(() => {
    // Start animations based on variant
    switch (variant) {
      case 'default':
      case 'gradient':
        rotation.value = withRepeat(
          withTiming(360, {
            duration,
            easing: Easing.linear,
          }),
          -1,
          false
        );
        break;
      
      case 'pulse':
        scale.value = withRepeat(
          withSequence(
            withTiming(1.2, { duration: duration / 2 }),
            withTiming(1, { duration: duration / 2 })
          ),
          -1,
          true
        );
        opacity.value = withRepeat(
          withSequence(
            withTiming(0.6, { duration: duration / 2 }),
            withTiming(1, { duration: duration / 2 })
          ),
          -1,
          true
        );
        break;
    }
  }, [variant, duration, rotation, scale, opacity]);

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  // Render different spinner variants
  const renderSpinner = () => {
    switch (variant) {
      case 'default':
        return (
          <Animated.View
            style={[
              {
                width: spinnerSize,
                height: spinnerSize,
                borderRadius: spinnerSize / 2,
                borderWidth: Math.max(2, spinnerSize / 8),
                borderColor: theme.helpers.getColorWithOpacity(spinnerColor, 0.2),
                borderTopColor: spinnerColor,
              },
              animatedStyle,
            ]}
          />
        );

      case 'gradient':
        return (
          <Animated.View
            style={[
              {
                width: spinnerSize,
                height: spinnerSize,
                borderRadius: spinnerSize / 2,
                overflow: 'hidden',
              },
              animatedStyle,
            ]}
          >
            <LinearGradient
              colors={[spinnerColor, theme.helpers.getColorWithOpacity(spinnerColor, 0.3)]}
              style={{
                width: '100%',
                height: '100%',
                borderRadius: spinnerSize / 2,
              }}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View
              style={{
                position: 'absolute',
                top: Math.max(2, spinnerSize / 8),
                left: Math.max(2, spinnerSize / 8),
                right: Math.max(2, spinnerSize / 8),
                bottom: Math.max(2, spinnerSize / 8),
                borderRadius: (spinnerSize - Math.max(4, spinnerSize / 4)) / 2,
                backgroundColor: theme.background.primary,
              }}
            />
          </Animated.View>
        );

      case 'pulse':
        return (
          <Animated.View
            style={[
              {
                width: spinnerSize,
                height: spinnerSize,
                borderRadius: spinnerSize / 2,
                backgroundColor: spinnerColor,
              },
              animatedStyle,
            ]}
          />
        );

      case 'dots':
        return <DotsSpinner size={spinnerSize} color={spinnerColor} speed={speed} />;

      case 'bars':
        return <BarsSpinner size={spinnerSize} color={spinnerColor} speed={speed} />;

      default:
        return null;
    }
  };

  return (
    <View
      style={[
        {
          justifyContent: 'center',
          alignItems: 'center',
          width: spinnerSize,
          height: spinnerSize,
        },
        style,
      ]}
    >
      {renderSpinner()}
    </View>
  );
};

// Dots Spinner Component
const DotsSpinner: React.FC<{
  size: number;
  color: string;
  speed: 'slow' | 'normal' | 'fast';
}> = ({ size, color, speed }) => {
  const { theme } = useTheme();
  const dotSize = size / 4;
  const spacing = size / 8;

  const durationMap = {
    slow: 1500,
    normal: 1000,
    fast: 600,
  };

  const duration = durationMap[speed];

  const Dot: React.FC<{ delay: number }> = ({ delay }) => {
    const scale = useSharedValue(0.8);
    const opacity = useSharedValue(0.4);

    useEffect(() => {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: duration / 3 }),
          withTiming(0.8, { duration: duration / 3 }),
          withTiming(0.8, { duration: duration / 3 })
        ),
        -1,
        false
      );
      
      opacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: duration / 3 }),
          withTiming(0.4, { duration: duration / 3 }),
          withTiming(0.4, { duration: duration / 3 })
        ),
        -1,
        false
      );
    }, [scale, opacity, duration]);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    }));

    return (
      <Animated.View
        style={[
          {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: color,
            marginHorizontal: spacing / 2,
          },
          animatedStyle,
        ]}
      />
    );
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Dot delay={0} />
      <Dot delay={duration / 6} />
      <Dot delay={duration / 3} />
    </View>
  );
};

// Bars Spinner Component
const BarsSpinner: React.FC<{
  size: number;
  color: string;
  speed: 'slow' | 'normal' | 'fast';
}> = ({ size, color, speed }) => {
  const barWidth = size / 6;
  const barHeight = size;
  const spacing = size / 12;

  const durationMap = {
    slow: 1500,
    normal: 1000,
    fast: 600,
  };

  const duration = durationMap[speed];

  const Bar: React.FC<{ delay: number }> = ({ delay }) => {
    const scaleY = useSharedValue(0.4);

    useEffect(() => {
      scaleY.value = withRepeat(
        withSequence(
          withTiming(1, { duration: duration / 4 }),
          withTiming(0.4, { duration: duration / 4 }),
          withTiming(0.4, { duration: duration / 2 })
        ),
        -1,
        false
      );
    }, [scaleY, duration]);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scaleY: scaleY.value }],
    }));

    return (
      <Animated.View
        style={[
          {
            width: barWidth,
            height: barHeight,
            backgroundColor: color,
            marginHorizontal: spacing / 2,
            borderRadius: barWidth / 2,
          },
          animatedStyle,
        ]}
      />
    );
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', height: barHeight }}>
      <Bar delay={0} />
      <Bar delay={duration / 8} />
      <Bar delay={duration / 4} />
      <Bar delay={duration / 8} />
    </View>
  );
};

// Specialized loading components
export const StreamLoadingSpinner: React.FC<Omit<LoadingSpinnerProps, 'variant'>> = (props) => (
  <LoadingSpinner {...props} variant="gradient" />
);

export const ButtonLoadingSpinner: React.FC<Omit<LoadingSpinnerProps, 'size' | 'variant'>> = (props) => (
  <LoadingSpinner {...props} size="sm" variant="default" />
);

export const PageLoadingSpinner: React.FC<Omit<LoadingSpinnerProps, 'size' | 'variant'>> = (props) => (
  <LoadingSpinner {...props} size="lg" variant="pulse" />
);

export default LoadingSpinner;