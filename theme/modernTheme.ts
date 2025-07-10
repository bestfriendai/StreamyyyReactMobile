import { ViewStyle, TextStyle, ImageStyle } from 'react-native';

// Define specific style types
export interface ModernThemeStyles {
  container: ViewStyle;
  text: TextStyle;
  button: ViewStyle;
  input: ViewStyle;
  card: ViewStyle;
  header: ViewStyle;
  content: ViewStyle;
  footer: ViewStyle;
}

// Modern color palette inspired by streaming platforms
export const ModernTheme = {
  colors: {
    // Primary brand colors
    primary: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9', // Main brand color
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
    },
    
    // Secondary colors
    secondary: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
    
    // Accent colors
    accent: {
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
    
    // Gray colors
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
    
    // Success colors
    success: {
      50: '#ecfdf5',
      100: '#d1fae5',
      200: '#a7f3d0',
      300: '#6ee7b7',
      400: '#34d399',
      500: '#10b981',
      600: '#059669',
      700: '#047857',
      800: '#065f46',
      900: '#064e3b',
    },
    
    // Error colors
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
    
    // Streaming platform inspired colors
    twitch: '#9146FF',
    youtube: '#FF0000',
    discord: '#5865F2',
    
    // Dark theme optimized for video content
    background: {
      primary: '#0a0a0a',
      secondary: '#1a1a1a',
      tertiary: '#2a2a2a',
      card: '#1e1e1e',
      overlay: 'rgba(0, 0, 0, 0.8)',
    },
    
    // Text colors with proper contrast
    text: {
      primary: '#ffffff',
      secondary: '#b3b3b3',
      tertiary: '#666666',
      accent: '#8B5CF6',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
    },
    
    // Interactive elements
    interactive: {
      hover: 'rgba(139, 92, 246, 0.1)',
      pressed: 'rgba(139, 92, 246, 0.2)',
      disabled: 'rgba(255, 255, 255, 0.1)',
      border: 'rgba(139, 92, 246, 0.3)',
    },
    
    // Border colors
    border: {
      primary: 'rgba(255, 255, 255, 0.1)',
      secondary: 'rgba(255, 255, 255, 0.05)',
      accent: 'rgba(139, 92, 246, 0.3)',
      active: 'rgba(139, 92, 246, 0.5)',
    },
    
    // Status indicators
    status: {
      live: '#00ff00',
      offline: '#666666',
      loading: '#fbbf24',
      error: '#ef4444',
    },
    
    // Gradients for modern UI
    gradients: {
      primary: ['#8B5CF6', '#3B82F6'],
      secondary: ['#1a1a1a', '#2a2a2a'],
      accent: ['#9146FF', '#8B5CF6'],
      danger: ['#ef4444', '#dc2626'],
      success: ['#10b981', '#059669'],
      background: ['#0a0a0a', '#1a1a1a'],
      card: ['#1e1e1e', '#2a2a2a'],
    },
  },
  
  // Typography system
  typography: {
    fonts: {
      primary: 'Inter',
      mono: 'SF Mono',
    },
    sizes: {
      xs: 12,
      sm: 14,
      md: 16,
      base: 16,
      lg: 18,
      xl: 20,
      xxl: 22,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
    },
    weights: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },
  },
  
  // Spacing system (8pt grid)
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
  },
  
  // Border radius system
  borderRadius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 24,
    full: 9999,
  },
  
  // Shadow system
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.15,
      shadowRadius: 15,
      elevation: 6,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.25,
      shadowRadius: 25,
      elevation: 10,
    },
  },
  
  // Animation timings
  animations: {
    fast: 150,
    normal: 300,
    slow: 500,
    
    // Easing curves
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  },
  
  // Component specific styles
  components: {
    button: {
      height: {
        sm: 32,
        md: 40,
        lg: 48,
        xl: 56,
      },
      padding: {
        sm: { horizontal: 12, vertical: 6 },
        md: { horizontal: 16, vertical: 8 },
        lg: { horizontal: 20, vertical: 12 },
        xl: { horizontal: 24, vertical: 16 },
      },
    },
    
    card: {
      padding: 16,
      borderRadius: 12,
      backgroundColor: '#1e1e1e',
    },
    
    input: {
      height: 48,
      borderRadius: 8,
      padding: 16,
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderColor: 'rgba(139, 92, 246, 0.3)',
    },
  },
};

// Helper functions for theme usage
export const getGradient = (gradientName: keyof typeof ModernTheme.colors.gradients) => {
  return ModernTheme.colors.gradients[gradientName];
};

export const getSpacing = (size: keyof typeof ModernTheme.spacing) => {
  return ModernTheme.spacing[size];
};

export const getTypography = (size: keyof typeof ModernTheme.typography.sizes, weight?: keyof typeof ModernTheme.typography.weights) => {
  return {
    fontSize: ModernTheme.typography.sizes[size],
    fontWeight: weight ? ModernTheme.typography.weights[weight] : ModernTheme.typography.weights.normal,
    fontFamily: ModernTheme.typography.fonts.primary,
  };
};

export default ModernTheme;