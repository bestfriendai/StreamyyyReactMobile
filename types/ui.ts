/**
 * UI-related types and interfaces
 */
import { ReactNode } from 'react';
import { ViewStyle, TextStyle } from 'react-native';

/**
 * Theme configuration
 */
export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    error: string;
    warning: string;
    success: string;
    info: string;
    // Stream-specific colors
    twitch: string;
    youtube: string;
    kick: string;
  };
  fonts: {
    regular: string;
    medium: string;
    bold: string;
    light: string;
  };
  sizes: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  borderRadius: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    full: number;
  };
  shadows: {
    sm: ViewStyle;
    md: ViewStyle;
    lg: ViewStyle;
    xl: ViewStyle;
  };
}

/**
 * Component props for consistent styling
 */
export interface StyledComponentProps {
  style?: ViewStyle;
  textStyle?: TextStyle;
  theme?: Theme;
  testID?: string;
  accessible?: boolean;
  accessibilityLabel?: string;
  accessibilityRole?: string;
  accessibilityState?: any;
}

/**
 * Loading state types
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Component size variants
 */
export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Component variants
 */
export type ComponentVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'link';

/**
 * Button component props
 */
export interface ButtonProps extends StyledComponentProps {
  title: string;
  onPress: () => void;
  variant?: ComponentVariant;
  size?: ComponentSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

/**
 * Card component props
 */
export interface CardProps extends StyledComponentProps {
  children: ReactNode;
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: ComponentSize;
  onPress?: () => void;
  pressable?: boolean;
}

/**
 * Input component props
 */
export interface InputProps extends StyledComponentProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  secureTextEntry?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'url';
}

/**
 * Modal component props
 */
export interface ModalProps extends StyledComponentProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closable?: boolean;
  backdrop?: boolean;
  backdropOpacity?: number;
  animation?: 'slide' | 'fade' | 'none';
  position?: 'center' | 'top' | 'bottom';
}

/**
 * Toast/Notification props
 */
export interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  position?: 'top' | 'bottom' | 'center';
  action?: {
    label: string;
    onPress: () => void;
  };
  onDismiss?: () => void;
}

/**
 * Navigation types
 */
export interface NavigationRoute {
  name: string;
  path: string;
  component: React.ComponentType<any>;
  options?: {
    title?: string;
    headerShown?: boolean;
    tabBarIcon?: (props: any) => ReactNode;
    tabBarLabel?: string;
  };
}

/**
 * Screen dimensions and breakpoints
 */
export interface ScreenDimensions {
  width: number;
  height: number;
  scale: number;
  fontScale: number;
}

export interface Breakpoints {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

/**
 * Animation configuration
 */
export interface AnimationConfig {
  duration: number;
  easing: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';
  delay?: number;
  repeat?: number;
  repeatReverse?: boolean;
}

/**
 * Gesture configuration
 */
export interface GestureConfig {
  enabled: boolean;
  sensitivity: number;
  threshold: number;
  direction: 'horizontal' | 'vertical' | 'both';
}

/**
 * Accessibility configuration
 */
export interface AccessibilityConfig {
  enabled: boolean;
  announceUpdates: boolean;
  reduceMotion: boolean;
  highContrast: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
}

/**
 * Layout configuration
 */
export interface LayoutConfig {
  orientation: 'portrait' | 'landscape';
  safeAreaInsets: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  statusBarHeight: number;
  headerHeight: number;
  tabBarHeight: number;
}

/**
 * Component state for complex components
 */
export interface ComponentState<T = any> {
  data?: T;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  lastUpdated?: string;
}

/**
 * Form field configuration
 */
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'checkbox' | 'radio' | 'textarea';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  validation?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: any) => string | null;
  };
  options?: Array<{
    label: string;
    value: any;
  }>;
}

/**
 * Form state management
 */
export interface FormState {
  values: Record<string, any>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isValid: boolean;
  isSubmitting: boolean;
  isDirty: boolean;
}

/**
 * Grid system configuration
 */
export interface GridConfig {
  columns: number;
  spacing: number;
  aspectRatio?: number;
  minItemWidth?: number;
  maxItemWidth?: number;
}

/**
 * Virtualization configuration for large lists
 */
export interface VirtualizationConfig {
  itemHeight: number;
  overscan: number;
  windowSize: number;
  maintainVisibleContentPosition?: boolean;
}