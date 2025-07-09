// Black Theme Design System
export const Theme = {
  colors: {
    // Background colors
    background: {
      primary: '#000000',
      secondary: '#0a0a0a', 
      tertiary: '#111111',
      card: '#1a1a1a',
      overlay: '#000000cc',
    },
    
    // Text colors
    text: {
      primary: '#ffffff',
      secondary: '#cccccc',
      tertiary: '#999999',
      disabled: '#666666',
      accent: '#ffffff',
    },
    
    // Accent colors (replacing purple)
    accent: {
      primary: '#ffffff',
      secondary: '#f0f0f0',
      tertiary: '#e0e0e0',
      red: '#ff4444',
      green: '#00ff00',
      blue: '#00aaff',
      yellow: '#ffaa00',
    },
    
    // UI element colors
    border: {
      primary: '#333333',
      secondary: '#222222',
      accent: '#ffffff22',
      active: '#ffffff44',
    },
    
    // State colors
    state: {
      active: '#ffffff',
      inactive: '#666666',
      hover: '#ffffff11',
      pressed: '#ffffff22',
      disabled: '#333333',
    },
    
    // Functional colors
    functional: {
      success: '#00ff00',
      warning: '#ffaa00',
      error: '#ff4444',
      info: '#00aaff',
    },
    
    // Twitch brand (only for platform badges)
    twitch: '#9146ff',
  },
  
  // Spacing system
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  // Border radius
  radius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 24,
    round: 999,
  },
  
  // Typography
  typography: {
    sizes: {
      xs: 10,
      sm: 12,
      md: 14,
      lg: 16,
      xl: 18,
      xxl: 20,
      title: 24,
      heading: 28,
      display: 32,
    },
    weights: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
  
  // Shadows
  shadows: {
    sm: {
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
      },
      android: { elevation: 2 },
      web: { boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)' },
    },
    md: {
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
      },
      android: { elevation: 4 },
      web: { boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)' },
    },
    lg: {
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
      },
      android: { elevation: 8 },
      web: { boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)' },
    },
  },
  
  // Gradients
  gradients: {
    background: ['#000000', '#0a0a0a', '#000000'],
    card: ['#1a1a1a', '#222222'],
    overlay: ['rgba(0, 0, 0, 0.9)', 'rgba(0, 0, 0, 0.7)'],
    button: ['#333333', '#222222'],
    buttonActive: ['#ffffff', '#f0f0f0'],
  },
};

export type ThemeColors = typeof Theme.colors;
export type ThemeSpacing = typeof Theme.spacing;
export type ThemeRadius = typeof Theme.radius;