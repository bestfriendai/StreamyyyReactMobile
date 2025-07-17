import { LinearGradient } from 'expo-linear-gradient';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  visible: boolean;
  onHide: () => void;
  duration?: number;
}

export function Toast({ message, type, visible, onHide, duration = 3000 }: ToastProps) {
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 15 });
      opacity.value = withTiming(1, { duration: 300 });
      scale.value = withSpring(1, { damping: 15 });

      // Auto-hide after duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      hideToast();
    }
  }, [visible, duration]);

  const hideToast = () => {
    translateY.value = withTiming(-100, { duration: 300 });
    opacity.value = withTiming(0, { duration: 300 });
    scale.value = withTiming(0.8, { duration: 300 }, finished => {
      if (finished) {
        runOnJS(onHide)();
      }
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  const getToastConfig = () => {
    switch (type) {
      case 'success':
        return {
          colors: ['#22C55E', '#16A34A'],
          icon: <CheckCircle size={20} color="#fff" />,
          borderColor: 'rgba(34, 197, 94, 0.3)',
        };
      case 'error':
        return {
          colors: ['#EF4444', '#DC2626'],
          icon: <XCircle size={20} color="#fff" />,
          borderColor: 'rgba(239, 68, 68, 0.3)',
        };
      case 'warning':
        return {
          colors: ['#F59E0B', '#D97706'],
          icon: <AlertCircle size={20} color="#fff" />,
          borderColor: 'rgba(245, 158, 11, 0.3)',
        };
      case 'info':
        return {
          colors: ['#3B82F6', '#2563EB'],
          icon: <Info size={20} color="#fff" />,
          borderColor: 'rgba(59, 130, 246, 0.3)',
        };
      default:
        return {
          colors: ['#6B7280', '#4B5563'],
          icon: <Info size={20} color="#fff" />,
          borderColor: 'rgba(107, 114, 128, 0.3)',
        };
    }
  };

  if (!visible) {
    return null;
  }

  const config = getToastConfig();

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <LinearGradient
        colors={config.colors}
        style={[styles.toast, { borderColor: config.borderColor }]}
      >
        <View style={styles.content}>
          {config.icon}
          <Text style={styles.message} numberOfLines={2}>
            {message}
          </Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  toast: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
      },
    }),
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  message: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    lineHeight: 20,
  },
});
