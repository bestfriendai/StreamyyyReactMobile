import React from 'react';
import { styled, Stack, Text, GetProps } from '@tamagui/core';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  interpolate,
  Easing,
} from 'react-native-reanimated';

// Animated wrapper for Tamagui components
const AnimatedStack = Animated.createAnimatedComponent(Stack);
const AnimatedText = Animated.createAnimatedComponent(Text);

// Pulse animation component
export const PulseView = styled(AnimatedStack, {
  variants: {
    intensity: {
      low: {},
      medium: {},
      high: {},
    },
  } as const,
});

interface AnimatedPulseProps extends GetProps<typeof PulseView> {
  children: React.ReactNode;
  intensity?: 'low' | 'medium' | 'high';
  duration?: number;
}

export const AnimatedPulse: React.FC<AnimatedPulseProps> = ({
  children,
  intensity = 'medium',
  duration = 2000,
  ...props
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  React.useEffect(() => {
    const scaleValues = {
      low: [1, 1.02],
      medium: [1, 1.05],
      high: [1, 1.1],
    };
    
    const opacityValues = {
      low: [1, 0.9],
      medium: [1, 0.8],
      high: [1, 0.7],
    };

    scale.value = withRepeat(
      withSequence(
        withTiming(scaleValues[intensity][1], { duration: duration / 2 }),
        withTiming(scaleValues[intensity][0], { duration: duration / 2 })
      ),
      -1,
      false
    );

    opacity.value = withRepeat(
      withSequence(
        withTiming(opacityValues[intensity][1], { duration: duration / 2 }),
        withTiming(opacityValues[intensity][0], { duration: duration / 2 })
      ),
      -1,
      false
    );
  }, [intensity, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <PulseView {...props} style={animatedStyle}>
      {children}
    </PulseView>
  );
};

// Floating animation component
interface FloatingViewProps extends GetProps<typeof AnimatedStack> {
  children: React.ReactNode;
  offset?: number;
  duration?: number;
}

export const FloatingView: React.FC<FloatingViewProps> = ({
  children,
  offset = 10,
  duration = 3000,
  ...props
}) => {
  const translateY = useSharedValue(0);

  React.useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-offset, { duration: duration / 2, easing: Easing.inOut(Easing.sin) }),
        withTiming(offset, { duration: duration / 2, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, [offset, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <AnimatedStack {...props} style={animatedStyle}>
      {children}
    </AnimatedStack>
  );
};

// Shimmer loading component
const ShimmerContainer = styled(Stack, {
  overflow: 'hidden',
  backgroundColor: 'rgba(42, 42, 42, 0.8)',
});

interface ShimmerProps extends GetProps<typeof ShimmerContainer> {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
}

export const Shimmer: React.FC<ShimmerProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  ...props
}) => {
  const translateX = useSharedValue(-200);

  React.useEffect(() => {
    translateX.value = withRepeat(
      withTiming(200, { duration: 1500, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <ShimmerContainer
      width={width}
      height={height}
      borderRadius={borderRadius}
      {...props}
    >
      <Animated.View style={[{ flex: 1 }, animatedStyle]}>
        <LinearGradient
          colors={[
            'transparent',
            'rgba(255, 255, 255, 0.1)',
            'transparent',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </ShimmerContainer>
  );
};

// Scale animation on press
interface ScalePressProps extends GetProps<typeof AnimatedStack> {
  children: React.ReactNode;
  scale?: number;
  onPress?: () => void;
}

export const ScalePress: React.FC<ScalePressProps> = ({
  children,
  scale = 0.95,
  onPress,
  ...props
}) => {
  const scaleValue = useSharedValue(1);

  const handlePressIn = () => {
    scaleValue.value = withSpring(scale, { damping: 15 });
  };

  const handlePressOut = () => {
    scaleValue.value = withSpring(1, { damping: 15 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
  }));

  return (
    <AnimatedStack
      {...props}
      style={animatedStyle}
      onTouchStart={handlePressIn}
      onTouchEnd={handlePressOut}
      onPress={onPress}
    >
      {children}
    </AnimatedStack>
  );
};

// Slide in from direction
interface SlideInProps extends GetProps<typeof AnimatedStack> {
  children: React.ReactNode;
  direction: 'left' | 'right' | 'up' | 'down';
  distance?: number;
  duration?: number;
  delay?: number;
}

export const SlideIn: React.FC<SlideInProps> = ({
  children,
  direction,
  distance = 100,
  duration = 500,
  delay = 0,
  ...props
}) => {
  const translateX = useSharedValue(direction === 'left' ? -distance : direction === 'right' ? distance : 0);
  const translateY = useSharedValue(direction === 'up' ? -distance : direction === 'down' ? distance : 0);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    setTimeout(() => {
      translateX.value = withSpring(0, { damping: 20 });
      translateY.value = withSpring(0, { damping: 20 });
      opacity.value = withTiming(1, { duration });
    }, delay);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <AnimatedStack {...props} style={animatedStyle}>
      {children}
    </AnimatedStack>
  );
};

// Rotating component
interface RotateProps extends GetProps<typeof AnimatedStack> {
  children: React.ReactNode;
  duration?: number;
  clockwise?: boolean;
}

export const Rotate: React.FC<RotateProps> = ({
  children,
  duration = 2000,
  clockwise = true,
  ...props
}) => {
  const rotation = useSharedValue(0);

  React.useEffect(() => {
    rotation.value = withRepeat(
      withTiming(clockwise ? 360 : -360, { duration, easing: Easing.linear }),
      -1,
      false
    );
  }, [duration, clockwise]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <AnimatedStack {...props} style={animatedStyle}>
      {children}
    </AnimatedStack>
  );
};

// Bounce animation
interface BounceProps extends GetProps<typeof AnimatedStack> {
  children: React.ReactNode;
  intensity?: number;
  duration?: number;
}

export const Bounce: React.FC<BounceProps> = ({
  children,
  intensity = 0.1,
  duration = 1000,
  ...props
}) => {
  const scale = useSharedValue(1);

  React.useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withSpring(1 + intensity, { damping: 8 }),
        withSpring(1, { damping: 8 })
      ),
      -1,
      false
    );
  }, [intensity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedStack {...props} style={animatedStyle}>
      {children}
    </AnimatedStack>
  );
};

// Gradient text animation
interface AnimatedGradientTextProps extends GetProps<typeof AnimatedText> {
  children: React.ReactNode;
  colors?: string[];
}

export const AnimatedGradientText: React.FC<AnimatedGradientTextProps> = ({
  children,
  colors = ['#8B5CF6', '#7C3AED', '#6D28D9'],
  ...props
}) => {
  const colorIndex = useSharedValue(0);

  React.useEffect(() => {
    colorIndex.value = withRepeat(
      withTiming(colors.length - 1, { duration: 2000 }),
      -1,
      true
    );
  }, [colors.length]);

  const animatedStyle = useAnimatedStyle(() => {
    const currentIndex = Math.floor(colorIndex.value);
    const nextIndex = (currentIndex + 1) % colors.length;
    const progress = colorIndex.value - currentIndex;
    
    // Simple color interpolation (this would need proper color interpolation in a real app)
    return {
      color: colors[currentIndex],
      opacity: interpolate(progress, [0, 1], [1, 0.8]),
    };
  });

  return (
    <AnimatedText {...props} style={animatedStyle}>
      {children}
    </AnimatedText>
  );
};