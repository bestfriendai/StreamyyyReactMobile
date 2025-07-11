import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Platform,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  PanResponder,
  Pressable,
  LayoutAnimation,
  UIManager,
  StatusBar,
  SafeAreaView,
  Keyboard,
  KeyboardAvoidingView,
  DeviceEventEmitter,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
  useDerivedValue,
  withSequence,
  withDelay,
  cancelAnimation,
} from 'react-native-reanimated';
import { MotiView, MotiText, MotiPressable } from 'moti';
import { BlurViewFallback as BlurView } from './BlurViewFallback';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  Check,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Settings,
  Star,
  Heart,
  Share,
  Download,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  MoreHorizontal,
  Plus,
  Minus,
  Info,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  User,
  Home,
  Grid,
  List,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Wifi,
  WifiOff,
  Battery,
  BatteryLow,
  Smartphone,
  Tablet,
  Monitor,
  Headphones,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  Image,
  Video,
  Music,
  FileText,
  Folder,
  Archive,
  Trash2,
  Edit,
  Copy,
  Move,
  Refresh,
  Upload,
  Send,
  Mail,
  Phone,
  MessageSquare,
  Bell,
  BellOff,
  Navigation,
  MapPin,
  Clock3,
  Zap,
  Activity,
  TrendingUp,
  BarChart3,
  PieChart,
  Target,
  Award,
  Bookmark,
  Tag,
  Hash,
  AtSign,
  DollarSign,
  Percent,
  Globe,
  Link,
  ExternalLink,
  Download2,
  Upload2,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  RotateCw,
  Shuffle,
  Repeat,
  SkipBack,
  SkipForward,
  FastForward,
  Rewind,
  Square,
  Circle,
  Triangle,
  Hexagon,
  Octagon,
  Pentagon,
  Diamond,
  Sparkles,
  Flame,
  Droplet,
  Leaf,
  Sun,
  Moon,
  Cloud,
  CloudRain,
  Snowflake,
  Wind,
  Thermometer,
  Umbrella,
} from 'lucide-react-native';

// Get device dimensions and calculate safe areas
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 768;
const isLandscape = SCREEN_WIDTH > SCREEN_HEIGHT;

// Touch target sizes according to Apple and Google guidelines
const TOUCH_TARGET_SIZE = {
  minimum: 44, // iOS minimum
  recommended: 48, // Material Design recommendation
  comfortable: 56, // Comfortable size for most users
  large: 64, // Large targets for accessibility
};

// Spacing system based on 8px grid
const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Typography scale optimized for mobile
const TYPOGRAPHY = {
  caption: { fontSize: 12, lineHeight: 16 },
  body2: { fontSize: 14, lineHeight: 20 },
  body1: { fontSize: 16, lineHeight: 24 },
  subtitle2: { fontSize: 18, lineHeight: 28 },
  subtitle1: { fontSize: 20, lineHeight: 32 },
  h6: { fontSize: 24, lineHeight: 32 },
  h5: { fontSize: 28, lineHeight: 36 },
  h4: { fontSize: 32, lineHeight: 40 },
  h3: { fontSize: 36, lineHeight: 44 },
  h2: { fontSize: 40, lineHeight: 48 },
  h1: { fontSize: 48, lineHeight: 56 },
};

// Enhanced color system with accessibility considerations
const COLORS = {
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  secondary: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',
    600: '#9333ea',
    700: '#7c3aed',
    800: '#6b21a8',
    900: '#581c87',
  },
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },
  dark: {
    50: '#18181b',
    100: '#27272a',
    200: '#3f3f46',
    300: '#52525b',
    400: '#71717a',
    500: '#a1a1aa',
    600: '#d4d4d8',
    700: '#e4e4e7',
    800: '#f4f4f5',
    900: '#fafafa',
  },
};

// Device-specific configurations
interface DeviceConfig {
  touchTargetSize: number;
  borderRadius: number;
  shadowRadius: number;
  animationDuration: number;
  hapticIntensity: 'light' | 'medium' | 'heavy';
  fontSize: number;
  iconSize: number;
  spacing: number;
}

const getDeviceConfig = (): DeviceConfig => {
  if (isTablet) {
    return {
      touchTargetSize: TOUCH_TARGET_SIZE.large,
      borderRadius: 12,
      shadowRadius: 8,
      animationDuration: 300,
      hapticIntensity: 'medium',
      fontSize: 18,
      iconSize: 24,
      spacing: SPACING.lg,
    };
  } else {
    return {
      touchTargetSize: TOUCH_TARGET_SIZE.comfortable,
      borderRadius: 8,
      shadowRadius: 4,
      animationDuration: 250,
      hapticIntensity: 'light',
      fontSize: 16,
      iconSize: 20,
      spacing: SPACING.md,
    };
  }
};

// Accessibility helpers
const getAccessibilityProps = (
  role: string,
  label?: string,
  hint?: string,
  state?: { expanded?: boolean; selected?: boolean; disabled?: boolean }
) => ({
  accessible: true,
  accessibilityRole: role as any,
  accessibilityLabel: label,
  accessibilityHint: hint,
  accessibilityState: state,
});

// Enhanced Button Component
interface MobileButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  loading?: boolean;
  hapticFeedback?: boolean;
  fullWidth?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: any;
}

export const MobileButton: React.FC<MobileButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  icon,
  iconPosition = 'left',
  disabled = false,
  loading = false,
  hapticFeedback = true,
  fullWidth = false,
  accessibilityLabel,
  accessibilityHint,
  style,
}) => {
  const config = getDeviceConfig();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: COLORS.primary[600],
          borderColor: COLORS.primary[600],
          color: '#ffffff',
        };
      case 'secondary':
        return {
          backgroundColor: COLORS.secondary[600],
          borderColor: COLORS.secondary[600],
          color: '#ffffff',
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: COLORS.primary[600],
          color: COLORS.primary[600],
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          color: COLORS.neutral[700],
        };
      case 'danger':
        return {
          backgroundColor: COLORS.error[600],
          borderColor: COLORS.error[600],
          color: '#ffffff',
        };
      default:
        return {
          backgroundColor: COLORS.primary[600],
          borderColor: COLORS.primary[600],
          color: '#ffffff',
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          height: 40,
          paddingHorizontal: 16,
          fontSize: 14,
        };
      case 'medium':
        return {
          height: config.touchTargetSize,
          paddingHorizontal: 24,
          fontSize: config.fontSize,
        };
      case 'large':
        return {
          height: 56,
          paddingHorizontal: 32,
          fontSize: 18,
        };
      default:
        return {
          height: config.touchTargetSize,
          paddingHorizontal: 24,
          fontSize: config.fontSize,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  const handlePressIn = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(0.95, { damping: 15 });
      opacity.value = withTiming(0.8, { duration: 100 });
      
      if (hapticFeedback) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  const handlePressOut = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(1, { damping: 15 });
      opacity.value = withTiming(1, { duration: 100 });
    }
  };

  const handlePress = () => {
    if (!disabled && !loading) {
      if (hapticFeedback) {
        Haptics.impactAsync(config.hapticIntensity === 'light' ? 
          Haptics.ImpactFeedbackStyle.Light : 
          config.hapticIntensity === 'medium' ? 
          Haptics.ImpactFeedbackStyle.Medium : 
          Haptics.ImpactFeedbackStyle.Heavy
        );
      }
      onPress();
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[animatedStyle, fullWidth && { width: '100%' }]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={disabled || loading}
        style={[
          styles.button,
          {
            backgroundColor: variantStyles.backgroundColor,
            borderColor: variantStyles.borderColor,
            height: sizeStyles.height,
            paddingHorizontal: sizeStyles.paddingHorizontal,
            borderRadius: config.borderRadius,
            opacity: disabled ? 0.5 : 1,
          },
          style,
        ]}
        {...getAccessibilityProps(
          'button',
          accessibilityLabel || title,
          accessibilityHint,
          { disabled: disabled || loading }
        )}
      >
        <View style={styles.buttonContent}>
          {loading && (
            <MotiView
              from={{ rotate: '0deg' }}
              animate={{ rotate: '360deg' }}
              transition={{
                type: 'timing',
                duration: 1000,
                loop: true,
              }}
              style={styles.loadingIcon}
            >
              <RotateCcw size={config.iconSize} color={variantStyles.color} />
            </MotiView>
          )}
          
          {!loading && icon && iconPosition === 'left' && (
            <View style={[styles.buttonIcon, { marginRight: 8 }]}>
              {icon}
            </View>
          )}
          
          {!loading && (
            <Text
              style={[
                styles.buttonText,
                {
                  color: variantStyles.color,
                  fontSize: sizeStyles.fontSize,
                  fontWeight: '600',
                },
              ]}
            >
              {title}
            </Text>
          )}
          
          {!loading && icon && iconPosition === 'right' && (
            <View style={[styles.buttonIcon, { marginLeft: 8 }]}>
              {icon}
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
};

// Enhanced Input Component
interface MobileInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  error?: string;
  success?: boolean;
  disabled?: boolean;
  label?: string;
  hint?: string;
  required?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  style?: any;
}

export const MobileInput: React.FC<MobileInputProps> = ({
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoCorrect = true,
  multiline = false,
  numberOfLines = 1,
  maxLength,
  leftIcon,
  rightIcon,
  onRightIconPress,
  error,
  success = false,
  disabled = false,
  label,
  hint,
  required = false,
  onFocus,
  onBlur,
  style,
}) => {
  const config = getDeviceConfig();
  const [isFocused, setIsFocused] = useState(false);
  const borderColor = useSharedValue(COLORS.neutral[300]);
  const labelScale = useSharedValue(value ? 0.8 : 1);
  const labelY = useSharedValue(value ? -10 : 0);

  useEffect(() => {
    if (error) {
      borderColor.value = withTiming(COLORS.error[500]);
    } else if (success) {
      borderColor.value = withTiming(COLORS.success[500]);
    } else if (isFocused) {
      borderColor.value = withTiming(COLORS.primary[500]);
    } else {
      borderColor.value = withTiming(COLORS.neutral[300]);
    }
  }, [error, success, isFocused]);

  useEffect(() => {
    if (value || isFocused) {
      labelScale.value = withSpring(0.8);
      labelY.value = withSpring(-10);
    } else {
      labelScale.value = withSpring(1);
      labelY.value = withSpring(0);
    }
  }, [value, isFocused]);

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
    Haptics.selectionAsync();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  const animatedBorderStyle = useAnimatedStyle(() => ({
    borderColor: borderColor.value,
  }));

  const animatedLabelStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: labelScale.value },
      { translateY: labelY.value },
    ],
  }));

  return (
    <View style={[styles.inputContainer, style]}>
      {label && (
        <View style={styles.labelContainer}>
          <Animated.View style={animatedLabelStyle}>
            <Text style={[
              styles.inputLabel,
              {
                color: error ? COLORS.error[600] : 
                       success ? COLORS.success[600] :
                       isFocused ? COLORS.primary[600] : COLORS.neutral[600],
              }
            ]}>
              {label}
              {required && <Text style={styles.requiredIndicator}> *</Text>}
            </Text>
          </Animated.View>
        </View>
      )}
      
      <Animated.View style={[styles.inputWrapper, animatedBorderStyle]}>
        {leftIcon && (
          <View style={styles.inputIcon}>
            {leftIcon}
          </View>
        )}
        
        <TextInput
          style={[
            styles.textInput,
            {
              fontSize: config.fontSize,
              minHeight: multiline ? config.touchTargetSize * (numberOfLines || 1) : config.touchTargetSize,
              paddingLeft: leftIcon ? 0 : config.spacing,
              paddingRight: rightIcon ? 0 : config.spacing,
              color: disabled ? COLORS.neutral[400] : COLORS.neutral[900],
            }
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.neutral[400]}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          multiline={multiline}
          numberOfLines={numberOfLines}
          maxLength={maxLength}
          editable={!disabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...getAccessibilityProps(
            'text',
            label || placeholder,
            hint,
            { disabled }
          )}
        />
        
        {rightIcon && (
          <TouchableOpacity
            style={styles.inputIcon}
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
            {...getAccessibilityProps('button', 'Input action')}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </Animated.View>
      
      {(error || hint) && (
        <MotiView
          from={{ opacity: 0, translateY: -5 }}
          animate={{ opacity: 1, translateY: 0 }}
          style={styles.inputMessage}
        >
          {error ? (
            <View style={styles.errorMessage}>
              <AlertCircle size={14} color={COLORS.error[600]} />
              <Text style={[styles.messageText, { color: COLORS.error[600] }]}>
                {error}
              </Text>
            </View>
          ) : hint ? (
            <Text style={[styles.messageText, { color: COLORS.neutral[500] }]}>
              {hint}
            </Text>
          ) : null}
        </MotiView>
      )}
    </View>
  );
};

// Enhanced Card Component
interface MobileCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  padding?: 'none' | 'small' | 'medium' | 'large';
  margin?: 'none' | 'small' | 'medium' | 'large';
  borderRadius?: 'none' | 'small' | 'medium' | 'large' | 'full';
  pressable?: boolean;
  hapticFeedback?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: any;
}

export const MobileCard: React.FC<MobileCardProps> = ({
  children,
  onPress,
  variant = 'default',
  padding = 'medium',
  margin = 'none',
  borderRadius = 'medium',
  pressable = false,
  hapticFeedback = true,
  accessibilityLabel,
  accessibilityHint,
  style,
}) => {
  const config = getDeviceConfig();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const getVariantStyles = () => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: '#ffffff',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: config.shadowRadius,
          elevation: 4,
        };
      case 'outlined':
        return {
          backgroundColor: '#ffffff',
          borderWidth: 1,
          borderColor: COLORS.neutral[200],
        };
      case 'filled':
        return {
          backgroundColor: COLORS.neutral[50],
        };
      default:
        return {
          backgroundColor: '#ffffff',
        };
    }
  };

  const getPaddingStyles = () => {
    switch (padding) {
      case 'none':
        return { padding: 0 };
      case 'small':
        return { padding: SPACING.sm };
      case 'medium':
        return { padding: config.spacing };
      case 'large':
        return { padding: SPACING.xl };
      default:
        return { padding: config.spacing };
    }
  };

  const getMarginStyles = () => {
    switch (margin) {
      case 'none':
        return { margin: 0 };
      case 'small':
        return { margin: SPACING.sm };
      case 'medium':
        return { margin: config.spacing };
      case 'large':
        return { margin: SPACING.xl };
      default:
        return { margin: 0 };
    }
  };

  const getBorderRadiusStyles = () => {
    switch (borderRadius) {
      case 'none':
        return { borderRadius: 0 };
      case 'small':
        return { borderRadius: 4 };
      case 'medium':
        return { borderRadius: config.borderRadius };
      case 'large':
        return { borderRadius: 16 };
      case 'full':
        return { borderRadius: 9999 };
      default:
        return { borderRadius: config.borderRadius };
    }
  };

  const handlePressIn = () => {
    if (pressable || onPress) {
      scale.value = withSpring(0.98, { damping: 15 });
      opacity.value = withTiming(0.8, { duration: 100 });
      
      if (hapticFeedback) {
        Haptics.selectionAsync();
      }
    }
  };

  const handlePressOut = () => {
    if (pressable || onPress) {
      scale.value = withSpring(1, { damping: 15 });
      opacity.value = withTiming(1, { duration: 100 });
    }
  };

  const handlePress = () => {
    if (onPress) {
      if (hapticFeedback) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onPress();
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const variantStyles = getVariantStyles();
  const paddingStyles = getPaddingStyles();
  const marginStyles = getMarginStyles();
  const borderRadiusStyles = getBorderRadiusStyles();

  const cardStyles = [
    styles.card,
    variantStyles,
    paddingStyles,
    marginStyles,
    borderRadiusStyles,
    style,
  ];

  if (pressable || onPress) {
    return (
      <Animated.View style={animatedStyle}>
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handlePress}
          style={cardStyles}
          {...getAccessibilityProps(
            'button',
            accessibilityLabel,
            accessibilityHint
          )}
        >
          {children}
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <View style={cardStyles}>
      {children}
    </View>
  );
};

// Enhanced Modal Component
interface MobileModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  variant?: 'fullscreen' | 'bottom-sheet' | 'center' | 'top';
  dismissible?: boolean;
  showCloseButton?: boolean;
  animationType?: 'slide' | 'fade' | 'scale';
  hapticFeedback?: boolean;
  onShow?: () => void;
  onHide?: () => void;
  style?: any;
}

export const MobileModal: React.FC<MobileModalProps> = ({
  visible,
  onClose,
  title,
  children,
  variant = 'center',
  dismissible = true,
  showCloseButton = true,
  animationType = 'slide',
  hapticFeedback = true,
  onShow,
  onHide,
  style,
}) => {
  const config = getDeviceConfig();
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);
  
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      setIsVisible(true);
      onShow?.();
      
      if (hapticFeedback) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      
      backdropOpacity.value = withTiming(1, { duration: config.animationDuration });
      
      switch (animationType) {
        case 'slide':
          if (variant === 'bottom-sheet') {
            translateY.value = withSpring(0, { damping: 20 });
          } else {
            translateY.value = withSpring(0, { damping: 20 });
            opacity.value = withTiming(1, { duration: config.animationDuration });
          }
          break;
        case 'scale':
          scale.value = withSpring(1, { damping: 15 });
          opacity.value = withTiming(1, { duration: config.animationDuration });
          break;
        case 'fade':
          opacity.value = withTiming(1, { duration: config.animationDuration });
          break;
      }
    } else if (isVisible) {
      backdropOpacity.value = withTiming(0, { duration: config.animationDuration });
      
      switch (animationType) {
        case 'slide':
          if (variant === 'bottom-sheet') {
            translateY.value = withTiming(SCREEN_HEIGHT, { duration: config.animationDuration });
          } else {
            translateY.value = withTiming(-SCREEN_HEIGHT, { duration: config.animationDuration });
            opacity.value = withTiming(0, { duration: config.animationDuration });
          }
          break;
        case 'scale':
          scale.value = withTiming(0.8, { duration: config.animationDuration });
          opacity.value = withTiming(0, { duration: config.animationDuration });
          break;
        case 'fade':
          opacity.value = withTiming(0, { duration: config.animationDuration });
          break;
      }
      
      setTimeout(() => {
        setIsVisible(false);
        onHide?.();
      }, config.animationDuration);
    }
  }, [visible]);

  const handleBackdropPress = () => {
    if (dismissible) {
      onClose();
    }
  };

  const handleClosePress = () => {
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onClose();
  };

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => {
    switch (animationType) {
      case 'slide':
        return {
          transform: [{ translateY: translateY.value }],
          opacity: variant === 'bottom-sheet' ? 1 : opacity.value,
        };
      case 'scale':
        return {
          transform: [{ scale: scale.value }],
          opacity: opacity.value,
        };
      case 'fade':
        return {
          opacity: opacity.value,
        };
      default:
        return {};
    }
  });

  const getVariantStyles = () => {
    switch (variant) {
      case 'fullscreen':
        return {
          flex: 1,
          margin: 0,
          borderRadius: 0,
        };
      case 'bottom-sheet':
        return {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          maxHeight: SCREEN_HEIGHT * 0.9,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
        };
      case 'top':
        return {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          maxHeight: SCREEN_HEIGHT * 0.9,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          borderBottomLeftRadius: 20,
          borderBottomRightRadius: 20,
        };
      case 'center':
      default:
        return {
          margin: config.spacing,
          borderRadius: config.borderRadius * 2,
          maxHeight: SCREEN_HEIGHT * 0.8,
        };
    }
  };

  if (!isVisible) return null;

  return (
    <View style={styles.modalOverlay}>
      <Animated.View style={[styles.modalBackdrop, backdropAnimatedStyle]}>
        <TouchableWithoutFeedback onPress={handleBackdropPress}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>
      </Animated.View>
      
      <Animated.View
        style={[
          styles.modalContent,
          getVariantStyles(),
          contentAnimatedStyle,
          style,
        ]}
      >
        {(title || showCloseButton) && (
          <View style={styles.modalHeader}>
            {title && (
              <Text style={[styles.modalTitle, { fontSize: config.fontSize + 4 }]}>
                {title}
              </Text>
            )}
            {showCloseButton && (
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={handleClosePress}
                {...getAccessibilityProps('button', 'Close modal')}
              >
                <X size={config.iconSize} color={COLORS.neutral[600]} />
              </TouchableOpacity>
            )}
          </View>
        )}
        
        <View style={styles.modalBody}>
          {children}
        </View>
      </Animated.View>
    </View>
  );
};

// Enhanced Loading Component
interface MobileLoadingProps {
  visible: boolean;
  message?: string;
  variant?: 'spinner' | 'dots' | 'bars' | 'pulse';
  size?: 'small' | 'medium' | 'large';
  color?: string;
  overlay?: boolean;
  style?: any;
}

export const MobileLoading: React.FC<MobileLoadingProps> = ({
  visible,
  message,
  variant = 'spinner',
  size = 'medium',
  color = COLORS.primary[600],
  overlay = true,
  style,
}) => {
  const config = getDeviceConfig();
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const getLoadingSize = () => {
    switch (size) {
      case 'small':
        return 24;
      case 'medium':
        return 32;
      case 'large':
        return 48;
      default:
        return 32;
    }
  };

  const renderLoadingIndicator = () => {
    const loadingSize = getLoadingSize();
    
    switch (variant) {
      case 'spinner':
        return (
          <MotiView
            from={{ rotate: '0deg' }}
            animate={{ rotate: '360deg' }}
            transition={{
              type: 'timing',
              duration: 1000,
              loop: true,
            }}
          >
            <RotateCcw size={loadingSize} color={color} />
          </MotiView>
        );
      
      case 'dots':
        return (
          <View style={styles.dotsContainer}>
            {[0, 1, 2].map((index) => (
              <MotiView
                key={index}
                from={{ scale: 0.8, opacity: 0.5 }}
                animate={{ scale: 1.2, opacity: 1 }}
                transition={{
                  type: 'timing',
                  duration: 600,
                  delay: index * 200,
                  loop: true,
                  repeatReverse: true,
                }}
                style={[
                  styles.dot,
                  {
                    width: loadingSize / 4,
                    height: loadingSize / 4,
                    backgroundColor: color,
                  },
                ]}
              />
            ))}
          </View>
        );
      
      case 'bars':
        return (
          <View style={styles.barsContainer}>
            {[0, 1, 2, 3].map((index) => (
              <MotiView
                key={index}
                from={{ scaleY: 0.4 }}
                animate={{ scaleY: 1 }}
                transition={{
                  type: 'timing',
                  duration: 500,
                  delay: index * 100,
                  loop: true,
                  repeatReverse: true,
                }}
                style={[
                  styles.bar,
                  {
                    width: loadingSize / 8,
                    height: loadingSize,
                    backgroundColor: color,
                  },
                ]}
              />
            ))}
          </View>
        );
      
      case 'pulse':
        return (
          <MotiView
            from={{ scale: 0.8, opacity: 0.6 }}
            animate={{ scale: 1.2, opacity: 1 }}
            transition={{
              type: 'timing',
              duration: 800,
              loop: true,
              repeatReverse: true,
            }}
          >
            <Circle size={loadingSize} color={color} fill={color} />
          </MotiView>
        );
      
      default:
        return (
          <MotiView
            from={{ rotate: '0deg' }}
            animate={{ rotate: '360deg' }}
            transition={{
              type: 'timing',
              duration: 1000,
              loop: true,
            }}
          >
            <RotateCcw size={loadingSize} color={color} />
          </MotiView>
        );
    }
  };

  if (!visible) return null;

  const loadingContent = (
    <View style={[styles.loadingContainer, !overlay && styles.loadingInline, style]}>
      {renderLoadingIndicator()}
      {message && (
        <Text style={[styles.loadingMessage, { fontSize: config.fontSize - 2 }]}>
          {message}
        </Text>
      )}
    </View>
  );

  if (overlay) {
    return (
      <Animated.View style={[styles.loadingOverlay, animatedStyle]}>
        {loadingContent}
      </Animated.View>
    );
  }

  return (
    <Animated.View style={animatedStyle}>
      {loadingContent}
    </Animated.View>
  );
};

// Enhanced Toast Component
interface MobileToastProps {
  visible: boolean;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  position?: 'top' | 'center' | 'bottom';
  onHide?: () => void;
  action?: {
    label: string;
    onPress: () => void;
  };
  hapticFeedback?: boolean;
  style?: any;
}

export const MobileToast: React.FC<MobileToastProps> = ({
  visible,
  message,
  type = 'info',
  duration = 3000,
  position = 'bottom',
  onHide,
  action,
  hapticFeedback = true,
  style,
}) => {
  const config = getDeviceConfig();
  const translateY = useSharedValue(100);
  const opacity = useSharedValue(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      setIsVisible(true);
      
      if (hapticFeedback) {
        switch (type) {
          case 'success':
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            break;
          case 'error':
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            break;
          case 'warning':
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            break;
          default:
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            break;
        }
      }
      
      translateY.value = withSpring(0, { damping: 15 });
      opacity.value = withTiming(1, { duration: 200 });
      
      // Auto hide after duration
      if (duration > 0) {
        setTimeout(() => {
          hideToast();
        }, duration);
      }
    }
  }, [visible]);

  const hideToast = () => {
    translateY.value = withTiming(100, { duration: 200 });
    opacity.value = withTiming(0, { duration: 200 });
    
    setTimeout(() => {
      setIsVisible(false);
      onHide?.();
    }, 200);
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: COLORS.success[600],
          icon: <CheckCircle size={20} color="#ffffff" />,
        };
      case 'error':
        return {
          backgroundColor: COLORS.error[600],
          icon: <XCircle size={20} color="#ffffff" />,
        };
      case 'warning':
        return {
          backgroundColor: COLORS.warning[600],
          icon: <AlertCircle size={20} color="#ffffff" />,
        };
      case 'info':
      default:
        return {
          backgroundColor: COLORS.primary[600],
          icon: <Info size={20} color="#ffffff" />,
        };
    }
  };

  const getPositionStyles = () => {
    switch (position) {
      case 'top':
        return {
          top: 60,
          left: config.spacing,
          right: config.spacing,
        };
      case 'center':
        return {
          top: '50%',
          left: config.spacing,
          right: config.spacing,
          transform: [{ translateY: -50 }],
        };
      case 'bottom':
      default:
        return {
          bottom: 60,
          left: config.spacing,
          right: config.spacing,
        };
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const typeStyles = getTypeStyles();
  const positionStyles = getPositionStyles();

  if (!isVisible) return null;

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        positionStyles,
        {
          backgroundColor: typeStyles.backgroundColor,
          borderRadius: config.borderRadius,
        },
        animatedStyle,
        style,
      ]}
    >
      <View style={styles.toastContent}>
        {typeStyles.icon}
        <Text style={[styles.toastMessage, { fontSize: config.fontSize }]}>
          {message}
        </Text>
        {action && (
          <TouchableOpacity
            style={styles.toastAction}
            onPress={() => {
              action.onPress();
              hideToast();
            }}
            {...getAccessibilityProps('button', action.label)}
          >
            <Text style={[styles.toastActionText, { fontSize: config.fontSize - 2 }]}>
              {action.label}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

// Styles
const styles = StyleSheet.create({
  // Button styles
  button: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    textAlign: 'center',
  },
  buttonIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingIcon: {
    marginRight: 8,
  },

  // Input styles
  inputContainer: {
    marginVertical: SPACING.xs,
  },
  labelContainer: {
    marginBottom: SPACING.xs,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  requiredIndicator: {
    color: COLORS.error[600],
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  textInput: {
    flex: 1,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    paddingHorizontal: 12,
  },
  inputIcon: {
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputMessage: {
    marginTop: SPACING.xs,
    paddingHorizontal: SPACING.xs,
  },
  errorMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  messageText: {
    fontSize: 12,
    flex: 1,
  },

  // Card styles
  card: {
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },

  // Modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    maxWidth: SCREEN_WIDTH * 0.9,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral[200],
  },
  modalTitle: {
    fontWeight: '600',
    color: COLORS.neutral[900],
    flex: 1,
  },
  modalCloseButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.md,
  },
  modalBody: {
    padding: SPACING.lg,
  },

  // Loading styles
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    minWidth: 120,
  },
  loadingInline: {
    backgroundColor: 'transparent',
    padding: SPACING.md,
  },
  loadingMessage: {
    marginTop: SPACING.md,
    textAlign: 'center',
    color: COLORS.neutral[600],
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    borderRadius: 9999,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  bar: {
    borderRadius: 2,
  },

  // Toast styles
  toastContainer: {
    position: 'absolute',
    zIndex: 1000,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toastMessage: {
    flex: 1,
    color: '#ffffff',
    fontWeight: '500',
  },
  toastAction: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  toastActionText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});

export {
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  isTablet,
  isLandscape,
  TOUCH_TARGET_SIZE,
  SPACING,
  TYPOGRAPHY,
  COLORS,
  getDeviceConfig,
  getAccessibilityProps,
};