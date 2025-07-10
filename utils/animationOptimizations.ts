/**
 * Animation Performance Optimizations for React Native Multi-Stream App
 * Provides utilities for optimized animations and reduced re-renders
 */

import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS } from 'react-native-reanimated';
import { InteractionManager, LayoutAnimation, UIManager, Platform } from 'react-native';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * Performance-optimized spring animation configuration
 */
export const SPRING_CONFIGS = {
  // Ultra-fast for immediate feedback
  immediate: {
    damping: 20,
    stiffness: 300,
    mass: 0.5,
  },
  // Fast for UI interactions
  fast: {
    damping: 15,
    stiffness: 200,
    mass: 0.8,
  },
  // Normal for general animations
  normal: {
    damping: 12,
    stiffness: 150,
    mass: 1,
  },
  // Smooth for decorative animations
  smooth: {
    damping: 10,
    stiffness: 100,
    mass: 1.2,
  },
  // Gentle for large movements
  gentle: {
    damping: 8,
    stiffness: 80,
    mass: 1.5,
  },
};

/**
 * Performance-optimized timing animation configuration
 */
export const TIMING_CONFIGS = {
  // Ultra-fast transitions
  immediate: { duration: 100 },
  // Quick UI feedback
  fast: { duration: 200 },
  // Standard animations
  normal: { duration: 300 },
  // Smooth transitions
  smooth: { duration: 500 },
  // Slow, attention-drawing animations
  slow: { duration: 800 },
};

/**
 * Custom hook for optimized press animations
 */
export const useOptimizedPressAnimation = (
  config: keyof typeof SPRING_CONFIGS = 'fast',
  onPressCallback?: () => void
) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }), []);
  
  const onPressIn = useCallback(() => {
    scale.value = withSpring(0.95, SPRING_CONFIGS[config]);
    opacity.value = withTiming(0.8, TIMING_CONFIGS.fast);
  }, [config]);
  
  const onPressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING_CONFIGS[config], (finished) => {
      if (finished && onPressCallback) {
        runOnJS(onPressCallback)();
      }
    });
    opacity.value = withTiming(1, TIMING_CONFIGS.fast);
  }, [config, onPressCallback]);
  
  return {
    animatedStyle,
    onPressIn,
    onPressOut,
  };
};

/**
 * Custom hook for optimized fade animations
 */
export const useOptimizedFadeAnimation = (
  visible: boolean,
  config: keyof typeof TIMING_CONFIGS = 'normal'
) => {
  const opacity = useSharedValue(visible ? 1 : 0);
  
  useEffect(() => {
    opacity.value = withTiming(visible ? 1 : 0, TIMING_CONFIGS[config]);
  }, [visible, config]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }), []);
  
  return animatedStyle;
};

/**
 * Custom hook for optimized slide animations
 */
export const useOptimizedSlideAnimation = (
  visible: boolean,
  direction: 'up' | 'down' | 'left' | 'right' = 'up',
  distance: number = 100,
  config: keyof typeof SPRING_CONFIGS = 'normal'
) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(visible ? 1 : 0);
  
  useEffect(() => {
    if (visible) {
      translateX.value = withSpring(0, SPRING_CONFIGS[config]);
      translateY.value = withSpring(0, SPRING_CONFIGS[config]);
      opacity.value = withTiming(1, TIMING_CONFIGS.fast);
    } else {\n      const targetX = direction === 'left' ? -distance : direction === 'right' ? distance : 0;\n      const targetY = direction === 'up' ? -distance : direction === 'down' ? distance : 0;\n      \n      translateX.value = withSpring(targetX, SPRING_CONFIGS[config]);\n      translateY.value = withSpring(targetY, SPRING_CONFIGS[config]);\n      opacity.value = withTiming(0, TIMING_CONFIGS.fast);\n    }\n  }, [visible, direction, distance, config]);\n  \n  const animatedStyle = useAnimatedStyle(() => ({\n    transform: [\n      { translateX: translateX.value },\n      { translateY: translateY.value },\n    ],\n    opacity: opacity.value,\n  }), []);\n  \n  return animatedStyle;\n};\n\n/**\n * Custom hook for optimized scale animations\n */\nexport const useOptimizedScaleAnimation = (\n  visible: boolean,\n  fromScale: number = 0.8,\n  toScale: number = 1,\n  config: keyof typeof SPRING_CONFIGS = 'normal'\n) => {\n  const scale = useSharedValue(visible ? toScale : fromScale);\n  const opacity = useSharedValue(visible ? 1 : 0);\n  \n  useEffect(() => {\n    if (visible) {\n      scale.value = withSpring(toScale, SPRING_CONFIGS[config]);\n      opacity.value = withTiming(1, TIMING_CONFIGS.fast);\n    } else {\n      scale.value = withSpring(fromScale, SPRING_CONFIGS[config]);\n      opacity.value = withTiming(0, TIMING_CONFIGS.fast);\n    }\n  }, [visible, fromScale, toScale, config]);\n  \n  const animatedStyle = useAnimatedStyle(() => ({\n    transform: [{ scale: scale.value }],\n    opacity: opacity.value,\n  }), []);\n  \n  return animatedStyle;\n};\n\n/**\n * Custom hook for optimized rotation animations\n */\nexport const useOptimizedRotationAnimation = (\n  rotating: boolean,\n  duration: number = 1000,\n  continuous: boolean = true\n) => {\n  const rotation = useSharedValue(0);\n  \n  useEffect(() => {\n    if (rotating) {\n      if (continuous) {\n        // Continuous rotation\n        const animate = () => {\n          rotation.value = withTiming(rotation.value + 360, { duration }, (finished) => {\n            if (finished && rotating) {\n              runOnJS(animate)();\n            }\n          });\n        };\n        animate();\n      } else {\n        // Single rotation\n        rotation.value = withTiming(360, { duration });\n      }\n    } else {\n      rotation.value = withTiming(0, TIMING_CONFIGS.fast);\n    }\n  }, [rotating, duration, continuous]);\n  \n  const animatedStyle = useAnimatedStyle(() => ({\n    transform: [{ rotate: `${rotation.value}deg` }],\n  }), []);\n  \n  return animatedStyle;\n};\n\n/**\n * Performance-optimized LayoutAnimation presets\n */\nexport const LAYOUT_ANIMATIONS = {\n  easeInEaseOut: {\n    duration: 300,\n    create: {\n      type: LayoutAnimation.Types.easeInEaseOut,\n      property: LayoutAnimation.Properties.opacity,\n    },\n    update: {\n      type: LayoutAnimation.Types.easeInEaseOut,\n    },\n  },\n  spring: {\n    duration: 400,\n    create: {\n      type: LayoutAnimation.Types.spring,\n      property: LayoutAnimation.Properties.scaleXY,\n      springDamping: 0.7,\n    },\n    update: {\n      type: LayoutAnimation.Types.spring,\n      springDamping: 0.7,\n    },\n  },\n  linear: {\n    duration: 200,\n    create: {\n      type: LayoutAnimation.Types.linear,\n      property: LayoutAnimation.Properties.opacity,\n    },\n    update: {\n      type: LayoutAnimation.Types.linear,\n    },\n  },\n};\n\n/**\n * Optimized LayoutAnimation trigger\n */\nexport const triggerLayoutAnimation = (\n  preset: keyof typeof LAYOUT_ANIMATIONS = 'easeInEaseOut',\n  onComplete?: () => void\n) => {\n  LayoutAnimation.configureNext(LAYOUT_ANIMATIONS[preset], onComplete);\n};\n\n/**\n * Custom hook for managing animation states with performance optimization\n */\nexport const useAnimationState = <T extends string>(\n  initialState: T,\n  animationConfig: Record<T, any> = {}\n) => {\n  const [currentState, setCurrentState] = useState(initialState);\n  const previousState = useRef(initialState);\n  \n  const transitionTo = useCallback((newState: T, withLayoutAnimation: boolean = false) => {\n    if (currentState === newState) return;\n    \n    if (withLayoutAnimation) {\n      triggerLayoutAnimation();\n    }\n    \n    previousState.current = currentState;\n    setCurrentState(newState);\n  }, [currentState]);\n  \n  const isTransitioning = useCallback((state: T) => {\n    return currentState === state;\n  }, [currentState]);\n  \n  const wasInState = useCallback((state: T) => {\n    return previousState.current === state;\n  }, []);\n  \n  return {\n    currentState,\n    previousState: previousState.current,\n    transitionTo,\n    isTransitioning,\n    wasInState,\n  };\n};\n\n/**\n * Performance-optimized gesture responder system\n */\nexport const useOptimizedGestureResponder = (\n  onPress?: () => void,\n  onLongPress?: () => void,\n  disabled: boolean = false\n) => {\n  const gestureState = useRef({\n    startTime: 0,\n    startPosition: { x: 0, y: 0 },\n    longPressTriggered: false,\n  });\n  \n  const longPressTimer = useRef<NodeJS.Timeout | null>(null);\n  \n  const responder = useMemo(() => {\n    if (disabled) return {};\n    \n    return {\n      onStartShouldSetResponder: () => true,\n      onMoveShouldSetResponder: () => false,\n      \n      onResponderGrant: (evt: any) => {\n        gestureState.current.startTime = Date.now();\n        gestureState.current.startPosition = {\n          x: evt.nativeEvent.pageX,\n          y: evt.nativeEvent.pageY,\n        };\n        gestureState.current.longPressTriggered = false;\n        \n        // Setup long press timer\n        if (onLongPress) {\n          longPressTimer.current = setTimeout(() => {\n            gestureState.current.longPressTriggered = true;\n            onLongPress();\n          }, 500);\n        }\n      },\n      \n      onResponderMove: (evt: any) => {\n        const { pageX, pageY } = evt.nativeEvent;\n        const { x: startX, y: startY } = gestureState.current.startPosition;\n        \n        // Cancel long press if moved too far\n        const distance = Math.sqrt(\n          Math.pow(pageX - startX, 2) + Math.pow(pageY - startY, 2)\n        );\n        \n        if (distance > 10 && longPressTimer.current) {\n          clearTimeout(longPressTimer.current);\n          longPressTimer.current = null;\n        }\n      },\n      \n      onResponderRelease: () => {\n        if (longPressTimer.current) {\n          clearTimeout(longPressTimer.current);\n          longPressTimer.current = null;\n        }\n        \n        // Trigger press if it wasn't a long press\n        if (!gestureState.current.longPressTriggered && onPress) {\n          // Use InteractionManager to defer callback for better performance\n          InteractionManager.runAfterInteractions(onPress);\n        }\n      },\n      \n      onResponderTerminate: () => {\n        if (longPressTimer.current) {\n          clearTimeout(longPressTimer.current);\n          longPressTimer.current = null;\n        }\n      },\n    };\n  }, [onPress, onLongPress, disabled]);\n  \n  useEffect(() => {\n    return () => {\n      if (longPressTimer.current) {\n        clearTimeout(longPressTimer.current);\n      }\n    };\n  }, []);\n  \n  return responder;\n};\n\n/**\n * Debounced animation trigger for performance\n */\nexport const useDebouncedAnimation = (\n  animationFn: () => void,\n  delay: number = 100,\n  deps: React.DependencyList = []\n) => {\n  const timeoutRef = useRef<NodeJS.Timeout | null>(null);\n  \n  const debouncedFn = useCallback(() => {\n    if (timeoutRef.current) {\n      clearTimeout(timeoutRef.current);\n    }\n    \n    timeoutRef.current = setTimeout(() => {\n      InteractionManager.runAfterInteractions(animationFn);\n    }, delay);\n  }, [animationFn, delay]);\n  \n  useEffect(() => {\n    return () => {\n      if (timeoutRef.current) {\n        clearTimeout(timeoutRef.current);\n      }\n    };\n  }, []);\n  \n  useEffect(() => {\n    debouncedFn();\n  }, deps);\n  \n  return debouncedFn;\n};\n\n/**\n * Performance monitoring for animations\n */\nexport const useAnimationPerformanceMonitor = (animationName: string) => {\n  const startTime = useRef<number>(0);\n  \n  const startMonitoring = useCallback(() => {\n    startTime.current = performance.now();\n  }, []);\n  \n  const stopMonitoring = useCallback(() => {\n    const duration = performance.now() - startTime.current;\n    \n    if (duration > 16.67) { // More than one frame at 60fps\n      console.warn(`🐌 Slow animation detected: ${animationName} took ${duration.toFixed(2)}ms`);\n    }\n    \n    return duration;\n  }, [animationName]);\n  \n  return {\n    startMonitoring,\n    stopMonitoring,\n  };\n};\n\n/**\n * Batch animation updates for better performance\n */\nexport class AnimationBatcher {\n  private pendingUpdates: (() => void)[] = [];\n  private isScheduled: boolean = false;\n  \n  addUpdate(updateFn: () => void) {\n    this.pendingUpdates.push(updateFn);\n    this.scheduleFlush();\n  }\n  \n  private scheduleFlush() {\n    if (this.isScheduled) return;\n    \n    this.isScheduled = true;\n    requestAnimationFrame(() => {\n      this.flush();\n    });\n  }\n  \n  private flush() {\n    const updates = this.pendingUpdates.slice();\n    this.pendingUpdates.length = 0;\n    this.isScheduled = false;\n    \n    // Execute all updates in a single frame\n    updates.forEach(updateFn => updateFn());\n  }\n  \n  clear() {\n    this.pendingUpdates.length = 0;\n    this.isScheduled = false;\n  }\n}\n\n// Global animation batcher instance\nexport const globalAnimationBatcher = new AnimationBatcher();\n\n/**\n * Hook for using the global animation batcher\n */\nexport const useBatchedAnimations = () => {\n  const batchUpdate = useCallback((updateFn: () => void) => {\n    globalAnimationBatcher.addUpdate(updateFn);\n  }, []);\n  \n  return { batchUpdate };\n};\n\n/**\n * Utility for creating performance-optimized animated components\n */\nexport const createOptimizedAnimatedComponent = <T extends React.ComponentType<any>>(\n  Component: T,\n  defaultProps: Partial<React.ComponentProps<T>> = {}\n) => {\n  return React.memo(\n    React.forwardRef<any, React.ComponentProps<T>>((props, ref) => {\n      const optimizedProps = useMemo(() => ({\n        ...defaultProps,\n        ...props,\n      }), [props]);\n      \n      return <Component ref={ref} {...optimizedProps} />;\n    })\n  );\n};\n\nexport default {\n  SPRING_CONFIGS,\n  TIMING_CONFIGS,\n  LAYOUT_ANIMATIONS,\n  useOptimizedPressAnimation,\n  useOptimizedFadeAnimation,\n  useOptimizedSlideAnimation,\n  useOptimizedScaleAnimation,\n  useOptimizedRotationAnimation,\n  triggerLayoutAnimation,\n  useAnimationState,\n  useOptimizedGestureResponder,\n  useDebouncedAnimation,\n  useAnimationPerformanceMonitor,\n  AnimationBatcher,\n  globalAnimationBatcher,\n  useBatchedAnimations,\n  createOptimizedAnimatedComponent,\n};