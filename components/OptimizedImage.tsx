/**
 * OptimizedImage Component
 * High-performance image component with caching, lazy loading, and optimization
 */

import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
  View,
  Image,
  StyleSheet,
  ViewStyle,
  ImageStyle,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useOptimizedImage, ImageOptimizer } from '@/utils/imageOptimization';
import { useRenderPerformance } from '@/utils/performanceMonitoring';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OptimizedImageProps {
  source: string;
  width: number;
  height: number;
  style?: ViewStyle | ImageStyle;
  placeholder?: string;
  fallback?: string;
  quality?: number;
  priority?: 'low' | 'normal' | 'high';
  lazy?: boolean;
  cache?: boolean;
  onLoad?: () => void;
  onError?: (error: string) => void;
  onPress?: () => void;
  borderRadius?: number;
  enableProgressiveLoading?: boolean;
  showLoadingIndicator?: boolean;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
  blurRadius?: number;
  tintColor?: string;
  overlayColor?: string;
  overlayOpacity?: number;
}

const OptimizedImage: React.FC<OptimizedImageProps> = memo(({
  source,
  width,
  height,
  style,
  placeholder,
  fallback,
  quality = 80,
  priority = 'normal',
  lazy = false,
  cache = true,
  onLoad,
  onError,
  onPress,
  borderRadius = 0,
  enableProgressiveLoading = true,
  showLoadingIndicator = true,
  resizeMode = 'cover',
  blurRadius,
  tintColor,
  overlayColor,
  overlayOpacity = 0.3,
}) => {
  // Performance monitoring
  const { metrics } = useRenderPerformance('OptimizedImage');
  
  // State management
  const [isVisible, setIsVisible] = useState(!lazy);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [shouldShowProgressiveImage, setShouldShowProgressiveImage] = useState(false);
  
  // Refs
  const imageRef = useRef<View>(null);
  const intersectionObserver = useRef<any>(null);
  
  // Animation values
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.95);
  const loadingOpacity = useSharedValue(showLoadingIndicator ? 1 : 0);
  const progressiveOpacity = useSharedValue(0);
  
  // Optimize image URL
  const optimizedOptions = {
    quality,
    maxWidth: width,
    maxHeight: height,
    priority,
    cache,
    placeholder,
    fallback,
  };
  
  const { imageUri, loading, error, optimizedUrl } = useOptimizedImage(source, optimizedOptions);
  
  // Progressive loading setup
  const progressiveImageUrl = enableProgressiveLoading 
    ? ImageOptimizer.optimizeUrl(source, { ...optimizedOptions, quality: 20 })
    : null;
  
  // Lazy loading intersection observer
  useEffect(() => {
    if (!lazy || isVisible) return;
    
    const checkVisibility = () => {
      if (imageRef.current) {
        // Simple visibility check - in production, use proper intersection observer
        setIsVisible(true);
      }
    };
    
    const timer = setTimeout(checkVisibility, 100);
    return () => clearTimeout(timer);
  }, [lazy, isVisible]);
  
  // Handle loading states
  useEffect(() => {
    setIsLoading(loading);
    setHasError(!!error);
    
    if (error) {
      onError?.(error);
    }
  }, [loading, error, onError]);
  
  // Handle successful image load
  const handleImageLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
    
    // Animate in
    opacity.value = withSpring(1, { damping: 20, stiffness: 200 });
    scale.value = withSpring(1, { damping: 20, stiffness: 200 });
    loadingOpacity.value = withTiming(0, { duration: 300 });
    
    onLoad?.();
  }, [onLoad, opacity, scale, loadingOpacity]);
  
  // Handle image error
  const handleImageError = useCallback(() => {
    setHasError(true);
    setIsLoading(false);
    loadingOpacity.value = withTiming(0, { duration: 300 });
    
    onError?.('Failed to load image');
  }, [onError, loadingOpacity]);
  
  // Handle progressive image load
  const handleProgressiveLoad = useCallback(() => {
    setShouldShowProgressiveImage(true);
    progressiveOpacity.value = withTiming(1, { duration: 200 });
  }, [progressiveOpacity]);
  
  // Animated styles
  const imageAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));
  
  const loadingAnimatedStyle = useAnimatedStyle(() => ({
    opacity: loadingOpacity.value,
  }));
  
  const progressiveAnimatedStyle = useAnimatedStyle(() => ({
    opacity: progressiveOpacity.value,
  }));
  
  // Container style
  const containerStyle: ViewStyle = {
    width,
    height,
    borderRadius,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    ...style,
  };
  
  // Image style
  const imageStyle: ImageStyle = {
    width: '100%',
    height: '100%',
    borderRadius,
  };
  
  // Render loading indicator
  const renderLoadingIndicator = () => {
    if (!showLoadingIndicator) return null;
    
    return (
      <Animated.View 
        style={[styles.loadingContainer, loadingAnimatedStyle]}
        entering={FadeIn}
        exiting={FadeOut}
      >
        <LinearGradient
          colors={['#f0f0f0', '#e0e0e0', '#f0f0f0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.loadingGradient, { borderRadius }]}
        />
      </Animated.View>
    );
  };
  
  // Render progressive image
  const renderProgressiveImage = () => {
    if (!enableProgressiveLoading || !progressiveImageUrl) return null;
    
    return (
      <Animated.View 
        style={[styles.progressiveContainer, progressiveAnimatedStyle]}
      >
        <Image
          source={{ uri: progressiveImageUrl }}
          style={[imageStyle, { position: 'absolute' }]}
          onLoad={handleProgressiveLoad}
          blurRadius={2}
          resizeMode={resizeMode}
        />
      </Animated.View>
    );
  };
  
  // Render overlay
  const renderOverlay = () => {
    if (!overlayColor) return null;
    
    return (
      <View 
        style={[
          styles.overlay,
          {
            backgroundColor: overlayColor,
            opacity: overlayOpacity,
            borderRadius,
          }
        ]}
      />
    );
  };
  
  // Don't render if not visible (lazy loading)
  if (!isVisible) {
    return <View style={containerStyle} ref={imageRef} />;
  }
  
  // Render error state
  if (hasError && !fallback) {
    return (
      <View style={[containerStyle, styles.errorContainer]}>
        <View style={styles.errorIcon}>
          <View style={styles.errorIconInner} />
        </View>
      </View>
    );
  }
  
  // Main render
  return (
    <View style={containerStyle} ref={imageRef}>
      {/* Progressive loading background */}
      {renderProgressiveImage()}
      
      {/* Loading indicator */}
      {isLoading && renderLoadingIndicator()}
      
      {/* Main image */}
      <Animated.View style={[styles.imageContainer, imageAnimatedStyle]}>
        <Image
          source={{ uri: imageUri || fallback }}
          style={[
            imageStyle,
            tintColor && { tintColor },
            blurRadius && { blurRadius },
          ]}
          onLoad={handleImageLoad}
          onError={handleImageError}
          resizeMode={resizeMode}
          // Performance optimizations
          fadeDuration={0} // Disable default fade
          progressiveRenderingEnabled={Platform.OS === 'android'}
          shouldRasterizeIOS={true}
          renderToHardwareTextureAndroid={true}
        />
      </Animated.View>
      
      {/* Overlay */}
      {renderOverlay()}
    </View>
  );
});

// Predefined sizes for common use cases
export const ImageSizes = {
  thumbnail: { width: 120, height: 90 },
  card: { width: 300, height: 200 },
  banner: { width: SCREEN_WIDTH, height: 200 },
  avatar: { width: 40, height: 40 },
  avatarLarge: { width: 80, height: 80 },
  stream: { width: 320, height: 180 },
  streamLarge: { width: 480, height: 270 },
};

// Preset configurations
export const ImagePresets = {
  streamThumbnail: {
    quality: 70,
    priority: 'high' as const,
    lazy: true,
    cache: true,
    enableProgressiveLoading: true,
    showLoadingIndicator: true,
    resizeMode: 'cover' as const,
  },
  
  avatar: {
    quality: 90,
    priority: 'normal' as const,
    lazy: false,
    cache: true,
    enableProgressiveLoading: false,
    showLoadingIndicator: false,
    resizeMode: 'cover' as const,
  },
  
  banner: {
    quality: 85,
    priority: 'high' as const,
    lazy: false,
    cache: true,
    enableProgressiveLoading: true,
    showLoadingIndicator: true,
    resizeMode: 'cover' as const,
  },
  
  lowPriority: {
    quality: 60,
    priority: 'low' as const,
    lazy: true,
    cache: true,
    enableProgressiveLoading: false,
    showLoadingIndicator: false,
    resizeMode: 'cover' as const,
  },
};

const styles = StyleSheet.create({
  imageContainer: {
    width: '100%',
    height: '100%',
  },
  
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  
  loadingGradient: {
    width: '100%',
    height: '100%',
  },
  
  progressiveContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
  },
  
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  
  errorIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  errorIconInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ccc',
  },
});

OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage;