import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';

interface NavigationHeaderProps {
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  leftElement?: React.ReactNode;
  variant?: 'default' | 'transparent' | 'minimal';
}

export function NavigationHeader({ 
  title, 
  subtitle, 
  rightElement, 
  leftElement,
  variant = 'default' 
}: NavigationHeaderProps) {
  const insets = useSafeAreaInsets();
  
  // Animation values
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-20);
  
  useEffect(() => {
    opacity.value = withSpring(1, { damping: 20, stiffness: 300 });
    translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const getHeaderStyles = () => {
    switch (variant) {
      case 'transparent':
        return styles.transparentHeader;
      case 'minimal':
        return styles.minimalHeader;
      default:
        return styles.defaultHeader;
    }
  };

  const HeaderContent = () => (
    <Animated.View style={[styles.container, { paddingTop: insets.top }, animatedStyle]}>
      <View style={styles.content}>
        {leftElement && (
          <Animated.View style={[styles.leftElement, animatedStyle]}>
            {leftElement}
          </Animated.View>
        )}
        
        <View style={styles.titleContainer}>
          <Animated.Text style={[styles.title, animatedStyle]} numberOfLines={1}>
            {title}
          </Animated.Text>
          {subtitle && (
            <Animated.Text style={[styles.subtitle, animatedStyle]} numberOfLines={1}>
              {subtitle}
            </Animated.Text>
          )}
        </View>
        
        {rightElement && (
          <Animated.View style={[styles.rightElement, animatedStyle]}>
            {rightElement}
          </Animated.View>
        )}
      </View>
    </Animated.View>
  );

  if (variant === 'transparent' || variant === 'minimal') {
    return <HeaderContent />;
  }

  return (
    <LinearGradient
      colors={[
        'rgba(15, 15, 15, 1)',
        'rgba(26, 26, 26, 0.95)',
        'rgba(15, 15, 15, 0.8)'
      ]}
      style={getHeaderStyles()}
    >
      <HeaderContent />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  defaultHeader: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 92, 246, 0.2)',
  },
  transparentHeader: {
    backgroundColor: 'transparent',
  },
  minimalHeader: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    minHeight: Platform.OS === 'ios' ? 44 : 56,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: Platform.OS === 'ios' ? 44 : 56,
  },
  leftElement: {
    width: 40,
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  rightElement: {
    width: 40,
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 2,
    letterSpacing: 0.3,
  },
});