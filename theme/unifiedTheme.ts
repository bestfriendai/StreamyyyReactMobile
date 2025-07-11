/**
 * Unified Theme System for Multi-Streaming App
 * Consolidates all theme approaches into a single, comprehensive design system
 */

import { ViewStyle, TextStyle, ImageStyle } from 'react-native';

// Base design tokens
const tokens = {
  // Color scales using industry-standard naming
  colors: {
    // Primary brand colors - purple/violet theme
    primary: {
      50: '#f5f3ff',
      100: '#ede9fe', 
      200: '#ddd6fe',
      300: '#c4b5fd',
      400: '#a78bfa',
      500: '#8b5cf6', // Main brand color
      600: '#7c3aed',
      700: '#6d28d9',
      800: '#5b21b6',
      900: '#4c1d95',
      950: '#2e1065',
    },

    // Secondary colors - slate/gray
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
      950: '#020617',
    },

    // Semantic colors
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
      950: '#022c22',
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
      950: '#450a0a',
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
      950: '#451a03',
    },

    info: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554',
    },

    // Dark theme optimized grays
    gray: {
      50: '#fafafa',
      100: '#f4f4f5',
      200: '#e4e4e7',
      300: '#d4d4d8',
      400: '#a1a1aa',
      500: '#71717a',
      600: '#52525b',
      700: '#3f3f46',
      800: '#27272a',
      900: '#18181b',
      950: '#09090b',
    },

    // Platform specific colors
    platform: {
      twitch: '#9146ff',
      youtube: '#ff0000',
      discord: '#5865f2',
      kick: '#53fc18',
      facebook: '#1877f2',
    },

    // Live streaming specific
    live: {
      active: '#ff4444',
      inactive: '#6b7280',
      loading: '#fbbf24',
      error: '#ef4444',
    },
  },

  // Typography system
  typography: {
    // Font families
    fonts: {
      primary: 'Inter',
      mono: 'SF Mono',
      display: 'Inter',
    },

    // Font sizes using consistent scale
    sizes: {
      xs: 10,
      sm: 12,
      base: 14,
      md: 16,
      lg: 18,
      xl: 20,
      '2xl': 22,
      '3xl': 24,
      '4xl': 28,
      '5xl': 32,
      '6xl': 36,
      '7xl': 48,
      '8xl': 60,
      '9xl': 72,
    },

    // Font weights
    weights: {
      thin: '100',
      extralight: '200',
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
      black: '900',
    },

    // Line heights
    lineHeights: {
      none: 1,
      tight: 1.25,
      snug: 1.375,
      normal: 1.5,
      relaxed: 1.625,
      loose: 2,
    },

    // Letter spacing
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em',
    },
  },

  // Spacing system (8pt grid)
  spacing: {
    0: 0,
    px: 1,
    0.5: 2,
    1: 4,
    1.5: 6,
    2: 8,
    2.5: 10,
    3: 12,
    3.5: 14,
    4: 16,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
    9: 36,
    10: 40,
    11: 44,
    12: 48,
    14: 56,
    16: 64,
    20: 80,
    24: 96,
    28: 112,
    32: 128,
    36: 144,
    40: 160,
    44: 176,
    48: 192,
    52: 208,
    56: 224,
    60: 240,
    64: 256,
    72: 288,
    80: 320,
    96: 384,
  },

  // Border radius system
  radius: {
    none: 0,
    xs: 2,
    sm: 4,
    md: 6,
    lg: 8,
    xl: 12,
    '2xl': 16,
    '3xl': 20,
    '4xl': 24,
    full: 9999,
  },

  // Z-index scale
  zIndex: {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1020,
    banner: 1030,
    overlay: 1040,
    modal: 1050,
    popover: 1060,
    skipLink: 1070,
    toast: 1080,
    tooltip: 1090,
  },

  // Shadow system
  shadows: {
    xs: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 1,
      elevation: 1,
    },
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.15,
      shadowRadius: 15,
      elevation: 8,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.25,
      shadowRadius: 25,
      elevation: 12,
    },
    '2xl': {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 25 },
      shadowOpacity: 0.25,
      shadowRadius: 50,
      elevation: 16,
    },
  },

  // Animation system
  animations: {
    durations: {
      instant: 0,
      fastest: 50,
      faster: 100,
      fast: 150,
      normal: 200,
      slow: 300,
      slower: 500,
      slowest: 1000,
    },
    
    easings: {
      linear: 'linear',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },

  // Breakpoints for responsive design
  breakpoints: {
    xs: 0,
    sm: 480,
    md: 768,
    lg: 992,
    xl: 1280,
    '2xl': 1536,
  },
};

// Theme variants
const createThemeVariant = (mode: 'light' | 'dark') => {
  const isDark = mode === 'dark';
  
  return {
    // Semantic color mappings
    background: {
      primary: isDark ? tokens.colors.gray[950] : tokens.colors.gray[50],
      secondary: isDark ? tokens.colors.gray[900] : tokens.colors.gray[100],
      tertiary: isDark ? tokens.colors.gray[800] : tokens.colors.gray[200],
      card: isDark ? '#1a1a1a' : tokens.colors.gray[50],
      elevated: isDark ? tokens.colors.gray[800] : '#ffffff',
      overlay: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',
      modal: isDark ? 'rgba(0, 0, 0, 0.9)' : 'rgba(0, 0, 0, 0.5)',
    },

    text: {
      primary: isDark ? tokens.colors.gray[50] : tokens.colors.gray[900],
      secondary: isDark ? tokens.colors.gray[300] : tokens.colors.gray[600],
      tertiary: isDark ? tokens.colors.gray[400] : tokens.colors.gray[500],
      disabled: isDark ? tokens.colors.gray[600] : tokens.colors.gray[400],
      accent: tokens.colors.primary[500],
      inverse: isDark ? tokens.colors.gray[900] : tokens.colors.gray[50],
    },

    border: {
      primary: isDark ? tokens.colors.gray[800] : tokens.colors.gray[200],
      secondary: isDark ? tokens.colors.gray[700] : tokens.colors.gray[300],
      accent: tokens.colors.primary[500],
      muted: isDark ? tokens.colors.gray[800] : tokens.colors.gray[100],
    },

    interactive: {
      primary: tokens.colors.primary[500],
      primaryHover: tokens.colors.primary[600],
      primaryPressed: tokens.colors.primary[700],
      secondary: isDark ? tokens.colors.gray[700] : tokens.colors.gray[200],
      secondaryHover: isDark ? tokens.colors.gray[600] : tokens.colors.gray[300],
      secondaryPressed: isDark ? tokens.colors.gray[500] : tokens.colors.gray[400],
      disabled: isDark ? tokens.colors.gray[800] : tokens.colors.gray[300],
      danger: tokens.colors.error[500],
      dangerHover: tokens.colors.error[600],
    },

    // Status colors
    status: {
      success: tokens.colors.success[500],
      error: tokens.colors.error[500],
      warning: tokens.colors.warning[500],
      info: tokens.colors.info[500],
      live: tokens.colors.live.active,
      offline: tokens.colors.live.inactive,
    },

    // Gradients
    gradients: {
      primary: [tokens.colors.primary[500], tokens.colors.primary[600]],
      secondary: isDark 
        ? [tokens.colors.gray[800], tokens.colors.gray[900]]
        : [tokens.colors.gray[100], tokens.colors.gray[200]],
      accent: [tokens.colors.primary[400], tokens.colors.primary[600]],
      success: [tokens.colors.success[400], tokens.colors.success[600]],
      error: [tokens.colors.error[400], tokens.colors.error[600]],
      warning: [tokens.colors.warning[400], tokens.colors.warning[600]],
      card: isDark
        ? ['rgba(26, 26, 26, 0.95)', 'rgba(15, 15, 15, 0.98)']
        : ['rgba(255, 255, 255, 0.95)', 'rgba(249, 250, 251, 0.98)'],
      background: isDark
        ? [tokens.colors.gray[950], tokens.colors.gray[900]]
        : [tokens.colors.gray[50], tokens.colors.gray[100]],
    },
  };
};

// Create theme variants
const lightTheme = createThemeVariant('light');
const darkTheme = createThemeVariant('dark');

// Component-specific styles
const components = {
  // Button variants
  button: {
    sizes: {
      xs: {
        height: 28,
        paddingHorizontal: tokens.spacing[2],
        paddingVertical: tokens.spacing[1],
        fontSize: tokens.typography.sizes.xs,
      },
      sm: {
        height: 32,
        paddingHorizontal: tokens.spacing[3],
        paddingVertical: tokens.spacing[1.5],
        fontSize: tokens.typography.sizes.sm,
      },
      md: {
        height: 40,
        paddingHorizontal: tokens.spacing[4],
        paddingVertical: tokens.spacing[2],
        fontSize: tokens.typography.sizes.base,
      },
      lg: {
        height: 48,
        paddingHorizontal: tokens.spacing[6],
        paddingVertical: tokens.spacing[3],
        fontSize: tokens.typography.sizes.md,
      },
      xl: {
        height: 56,
        paddingHorizontal: tokens.spacing[8],
        paddingVertical: tokens.spacing[4],
        fontSize: tokens.typography.sizes.lg,
      },
    },
    
    variants: {
      primary: {
        borderRadius: tokens.radius.lg,
        fontWeight: tokens.typography.weights.medium,
      },
      secondary: {
        borderRadius: tokens.radius.lg,
        fontWeight: tokens.typography.weights.medium,
        borderWidth: 1,
      },
      ghost: {
        borderRadius: tokens.radius.lg,
        fontWeight: tokens.typography.weights.medium,
        backgroundColor: 'transparent',
      },
      link: {
        backgroundColor: 'transparent',
        fontWeight: tokens.typography.weights.medium,
      },
    },
  },

  // Card styles
  card: {
    default: {
      borderRadius: tokens.radius.xl,
      padding: tokens.spacing[6],
      ...tokens.shadows.md,
    },
    elevated: {
      borderRadius: tokens.radius.xl,
      padding: tokens.spacing[6],
      ...tokens.shadows.lg,
    },
    flat: {
      borderRadius: tokens.radius.xl,
      padding: tokens.spacing[6],
      borderWidth: 1,
    },
  },

  // Input styles
  input: {
    default: {
      height: 48,
      borderRadius: tokens.radius.lg,
      paddingHorizontal: tokens.spacing[4],
      paddingVertical: tokens.spacing[3],
      fontSize: tokens.typography.sizes.base,
      borderWidth: 1,
    },
    sm: {
      height: 40,
      borderRadius: tokens.radius.md,
      paddingHorizontal: tokens.spacing[3],
      paddingVertical: tokens.spacing[2],
      fontSize: tokens.typography.sizes.sm,
      borderWidth: 1,
    },
    lg: {
      height: 56,
      borderRadius: tokens.radius.xl,
      paddingHorizontal: tokens.spacing[6],
      paddingVertical: tokens.spacing[4],
      fontSize: tokens.typography.sizes.md,
      borderWidth: 1,
    },
  },

  // Stream card styles
  streamCard: {
    default: {
      borderRadius: tokens.radius.xl,
      overflow: 'hidden',
      ...tokens.shadows.md,
    },
    compact: {
      borderRadius: tokens.radius.lg,
      overflow: 'hidden',
      ...tokens.shadows.sm,
    },
  },
};

// Unified theme object
export const unifiedTheme = {
  tokens,
  light: {
    ...lightTheme,
    tokens,
    components,
  },
  dark: {
    ...darkTheme,
    tokens,
    components,
  },
  components,
};

// Helper functions
export const createThemeHelpers = (theme: typeof lightTheme & { tokens: typeof tokens }) => ({
  // Get color with opacity
  getColorWithOpacity: (color: string, opacity: number) => {
    if (color.includes('rgba')) return color;
    return `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
  },

  // Get spacing value
  getSpacing: (size: keyof typeof tokens.spacing) => tokens.spacing[size],

  // Get typography styles
  getTypography: (
    size: keyof typeof tokens.typography.sizes,
    weight?: keyof typeof tokens.typography.weights,
    lineHeight?: keyof typeof tokens.typography.lineHeights
  ) => ({
    fontSize: tokens.typography.sizes[size],
    fontWeight: weight ? tokens.typography.weights[weight] : tokens.typography.weights.normal,
    lineHeight: lineHeight ? tokens.typography.lineHeights[lineHeight] : tokens.typography.lineHeights.normal,
    fontFamily: tokens.typography.fonts.primary,
  }),

  // Get shadow styles
  getShadow: (size: keyof typeof tokens.shadows) => tokens.shadows[size],

  // Get border radius
  getRadius: (size: keyof typeof tokens.radius) => tokens.radius[size],

  // Create button styles
  getButtonStyles: (
    size: keyof typeof components.button.sizes,
    variant: keyof typeof components.button.variants
  ) => ({
    ...components.button.sizes[size],
    ...components.button.variants[variant],
  }),

  // Create responsive styles
  responsive: (styles: Record<keyof typeof tokens.breakpoints, ViewStyle | TextStyle>) => {
    // This would be implemented based on the platform's responsive system
    return styles;
  },

  // Animation presets
  animations: {
    fadeIn: {
      opacity: [0, 1],
      duration: tokens.animations.durations.normal,
      easing: tokens.animations.easings.easeOut,
    },
    slideUp: {
      transform: [{ translateY: [20, 0] }],
      duration: tokens.animations.durations.normal,
      easing: tokens.animations.easings.smooth,
    },
    scale: {
      transform: [{ scale: [0.95, 1] }],
      duration: tokens.animations.durations.fast,
      easing: tokens.animations.easings.spring,
    },
  },
});

export type UnifiedTheme = typeof unifiedTheme;
export type ThemeMode = 'light' | 'dark';
export type ThemeVariant = typeof lightTheme & { tokens: typeof tokens };

export default unifiedTheme;