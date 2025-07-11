import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';

interface AnimatedTabScreenProps {
  children: React.ReactNode;
  isActive: boolean;
  animationType?: 'slide' | 'fade' | 'scale';
  duration?: number;
}

export function AnimatedTabScreen({ 
  children, 
  isActive, 
  animationType = 'fade',
  duration = 300 
}: AnimatedTabScreenProps) {
  const opacity = useSharedValue(isActive ? 1 : 0);
  const translateY = useSharedValue(isActive ? 0 : 20);
  const scale = useSharedValue(isActive ? 1 : 0.95);

  useEffect(() => {
    if (isActive) {
      opacity.value = withTiming(1, { duration });
      translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
      scale.value = withSpring(1, { damping: 20, stiffness: 300 });
    } else {
      opacity.value = withTiming(0, { duration: duration / 2 });
      translateY.value = withTiming(20, { duration: duration / 2 });
      scale.value = withTiming(0.95, { duration: duration / 2 });
    }
  }, [isActive, duration, opacity, translateY, scale]);

  const animatedStyle = useAnimatedStyle(() => {
    const baseStyle = {
      flex: 1,
      opacity: opacity.value,
    };

    switch (animationType) {
      case 'slide':
        return {
          ...baseStyle,
          transform: [{ translateY: translateY.value }],
        };
      case 'scale':
        return {
          ...baseStyle,
          transform: [{ scale: scale.value }],
        };
      case 'fade':
      default:
        return baseStyle;
    }
  });

  return (
    <Animated.View style={animatedStyle}>
      {children}
    </Animated.View>
  );
}

// Hook for tab animations
export function useTabAnimation() {
  const fadeIn = useSharedValue(0);
  const slideUp = useSharedValue(50);

  const animateIn = () => {
    fadeIn.value = withSpring(1, { damping: 15, stiffness: 300 });
    slideUp.value = withSpring(0, { damping: 15, stiffness: 300 });
  };

  const animateOut = () => {
    fadeIn.value = withTiming(0, { duration: 200 });
    slideUp.value = withTiming(50, { duration: 200 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
    transform: [{ translateY: slideUp.value }],
  }));

  return {
    animateIn,
    animateOut,
    animatedStyle,
  };
}