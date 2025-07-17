/**
 * Standardized Animation Components
 * Provides consistent animations across the app using unified theme
 */

import React, { useEffect } from 'react';
import { ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  withRepeat,
  interpolate,
  Easing,
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideInUp,
  SlideInLeft,
  SlideInRight,
  SlideOutDown,
  SlideOutUp,
  SlideOutLeft,
  SlideOutRight,
  ZoomIn,
  ZoomOut,
  BounceIn,
  BounceOut,
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';

// Animation presets based on unified theme
export type AnimationPreset =
  | 'fadeIn'
  | 'fadeOut'
  | 'slideUp'
  | 'slideDown'
  | 'slideLeft'
  | 'slideRight'
  | 'scale'
  | 'bounce'
  | 'pulse'
  | 'shake'
  | 'rotate'
  | 'elastic'
  | 'spring';

export type AnimationSpeed = 'fast' | 'normal' | 'slow';

interface AnimatedContainerProps {
  children: React.ReactNode;
  preset?: AnimationPreset;
  speed?: AnimationSpeed;
  delay?: number;
  loop?: boolean;
  style?: ViewStyle;
  entering?: any;
  exiting?: any;
  onAnimationComplete?: () => void;
}

export const AnimatedContainer: React.FC<AnimatedContainerProps> = ({
  children,
  preset = 'fadeIn',
  speed = 'normal',
  delay = 0,
  loop = false,
  style,
  entering,
  exiting,
  onAnimationComplete,
}) => {
  const { theme } = useTheme();

  // Animation values
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);

  // Get animation duration from theme
  const getDuration = () => {
    switch (speed) {
      case 'fast':
        return theme.tokens.animations.durations.fast;
      case 'slow':
        return theme.tokens.animations.durations.slow;
      default:
        return theme.tokens.animations.durations.normal;
    }
  };

  // Animation configurations
  const animationConfigs = {
    fadeIn: () => {
      opacity.value = withDelay(
        delay,
        withTiming(1, { duration: getDuration() }, () => {
          onAnimationComplete?.();
        })
      );
    },
    fadeOut: () => {
      opacity.value = withDelay(
        delay,
        withTiming(0, { duration: getDuration() }, () => {
          onAnimationComplete?.();
        })
      );
    },
    slideUp: () => {
      translateY.value = 20;
      opacity.value = 0;
      translateY.value = withDelay(delay, withSpring(0, { damping: 15 }));
      opacity.value = withDelay(delay, withTiming(1, { duration: getDuration() }));
    },
    slideDown: () => {
      translateY.value = -20;
      opacity.value = 0;
      translateY.value = withDelay(delay, withSpring(0, { damping: 15 }));
      opacity.value = withDelay(delay, withTiming(1, { duration: getDuration() }));
    },
    slideLeft: () => {
      translateX.value = 20;
      opacity.value = 0;
      translateX.value = withDelay(delay, withSpring(0, { damping: 15 }));
      opacity.value = withDelay(delay, withTiming(1, { duration: getDuration() }));
    },
    slideRight: () => {
      translateX.value = -20;
      opacity.value = 0;
      translateX.value = withDelay(delay, withSpring(0, { damping: 15 }));
      opacity.value = withDelay(delay, withTiming(1, { duration: getDuration() }));
    },
    scale: () => {
      scale.value = 0.8;
      opacity.value = 0;
      scale.value = withDelay(delay, withSpring(1, { damping: 15 }));
      opacity.value = withDelay(delay, withTiming(1, { duration: getDuration() }));
    },
    bounce: () => {
      scale.value = withDelay(
        delay,
        withSequence(withSpring(1.1, { damping: 8 }), withSpring(1, { damping: 12 }))
      );
      opacity.value = withDelay(delay, withTiming(1, { duration: getDuration() }));
    },
    pulse: () => {
      const animation = withSequence(
        withTiming(1.05, { duration: getDuration() / 2 }),
        withTiming(1, { duration: getDuration() / 2 })
      );
      scale.value = withDelay(delay, loop ? withRepeat(animation, -1, true) : animation);
      opacity.value = withDelay(delay, withTiming(1, { duration: getDuration() }));
    },
    shake: () => {
      const shakeAnimation = withSequence(
        withTiming(-5, { duration: 50 }),
        withTiming(5, { duration: 50 }),
        withTiming(-5, { duration: 50 }),
        withTiming(5, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
      translateX.value = withDelay(delay, loop ? withRepeat(shakeAnimation, -1) : shakeAnimation);
      opacity.value = withDelay(delay, withTiming(1, { duration: getDuration() }));
    },
    rotate: () => {
      const rotateAnimation = withTiming(360, {
        duration: getDuration() * 2,
        easing: Easing.linear,
      });
      rotate.value = withDelay(delay, loop ? withRepeat(rotateAnimation, -1) : rotateAnimation);
      opacity.value = withDelay(delay, withTiming(1, { duration: getDuration() }));
    },
    elastic: () => {
      scale.value = 0;
      opacity.value = 0;
      scale.value = withDelay(
        delay,
        withSpring(1, {
          damping: 8,
          stiffness: 100,
          mass: 0.8,
        })
      );
      opacity.value = withDelay(delay, withTiming(1, { duration: getDuration() }));
    },
    spring: () => {
      translateY.value = 50;
      opacity.value = 0;
      translateY.value = withDelay(
        delay,
        withSpring(0, {
          damping: 10,
          stiffness: 100,
        })
      );
      opacity.value = withDelay(delay, withTiming(1, { duration: getDuration() }));
    },
  };

  // Apply animation on mount
  useEffect(() => {
    if (animationConfigs[preset]) {
      animationConfigs[preset]();
    }
  }, [preset, delay, loop, speed]);

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => {
    const rotateValue = interpolate(rotate.value, [0, 360], [0, 360]);

    return {
      opacity: opacity.value,
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
        { rotate: `${rotateValue}deg` },
      ],
    };
  });

  // Use Reanimated's built-in animations if provided
  if (entering || exiting) {
    return (
      <Animated.View style={[style, animatedStyle]} entering={entering} exiting={exiting}>
        {children}
      </Animated.View>
    );
  }

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
};

// Pre-configured animation components
export const FadeInContainer: React.FC<Omit<AnimatedContainerProps, 'preset'>> = props => (
  <AnimatedContainer {...props} preset="fadeIn" />
);

export const SlideUpContainer: React.FC<Omit<AnimatedContainerProps, 'preset'>> = props => (
  <AnimatedContainer {...props} preset="slideUp" />
);

export const ScaleContainer: React.FC<Omit<AnimatedContainerProps, 'preset'>> = props => (
  <AnimatedContainer {...props} preset="scale" />
);

export const BounceContainer: React.FC<Omit<AnimatedContainerProps, 'preset'>> = props => (
  <AnimatedContainer {...props} preset="bounce" />
);

export const PulseContainer: React.FC<Omit<AnimatedContainerProps, 'preset'>> = props => (
  <AnimatedContainer {...props} preset="pulse" loop />
);

export const SpringContainer: React.FC<Omit<AnimatedContainerProps, 'preset'>> = props => (
  <AnimatedContainer {...props} preset="spring" />
);

// Animation utilities
export const animationPresets = {
  // Entrance animations
  entrance: {
    fadeIn: FadeIn.duration(300),
    slideUp: SlideInUp.duration(300).springify(),
    slideDown: SlideInDown.duration(300).springify(),
    slideLeft: SlideInLeft.duration(300).springify(),
    slideRight: SlideInRight.duration(300).springify(),
    zoomIn: ZoomIn.duration(300),
    bounceIn: BounceIn.duration(500),
  },

  // Exit animations
  exit: {
    fadeOut: FadeOut.duration(200),
    slideUp: SlideOutUp.duration(200),
    slideDown: SlideOutDown.duration(200),
    slideLeft: SlideOutLeft.duration(200),
    slideRight: SlideOutRight.duration(200),
    zoomOut: ZoomOut.duration(200),
    bounceOut: BounceOut.duration(300),
  },
};

// Staggered animation helper
export const StaggeredContainer: React.FC<{
  children: React.ReactNode[];
  staggerDelay?: number;
  preset?: AnimationPreset;
  speed?: AnimationSpeed;
  style?: ViewStyle;
}> = ({ children, staggerDelay = 100, preset = 'fadeIn', speed = 'normal', style }) => {
  return (
    <Animated.View style={style}>
      {React.Children.map(children, (child, index) => (
        <AnimatedContainer key={index} preset={preset} speed={speed} delay={index * staggerDelay}>
          {child}
        </AnimatedContainer>
      ))}
    </Animated.View>
  );
};

export default AnimatedContainer;
