/**
 * Theme Context Provider
 * Provides centralized theme management with dark/light mode switching
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { unifiedTheme, createThemeHelpers, ThemeMode, ThemeVariant } from '@/theme/unifiedTheme';

interface ThemeContextValue {
  theme: ThemeVariant;
  mode: ThemeMode;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
  helpers: ReturnType<typeof createThemeHelpers>;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_STORAGE_KEY = '@app_theme_mode';

interface ThemeProviderProps {
  children: ReactNode;
  defaultMode?: ThemeMode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  defaultMode = 'dark' 
}) => {
  const [mode, setMode] = useState<ThemeMode>(defaultMode);
  const [isInitialized, setIsInitialized] = useState(false);

  // Get current theme variant
  const currentTheme = mode === 'dark' ? unifiedTheme.dark : unifiedTheme.light;
  
  // Create theme helpers
  const helpers = createThemeHelpers(currentTheme);

  // Initialize theme from storage and system preference
  useEffect(() => {
    const initializeTheme = async () => {
      try {
        // First, try to get saved preference
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        
        if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
          setMode(savedTheme);
        } else {
          // Fall back to system preference
          const systemColorScheme = Appearance.getColorScheme();
          const preferredMode = systemColorScheme === 'light' ? 'light' : 'dark';
          setMode(preferredMode);
        }
      } catch (error) {
        console.warn('Failed to load theme preference:', error);
        // Fall back to default
        setMode(defaultMode);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeTheme();
  }, [defaultMode]);

  // Listen to system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      // Only auto-switch if user hasn't set a manual preference
      AsyncStorage.getItem(THEME_STORAGE_KEY).then((savedTheme) => {
        if (!savedTheme && colorScheme) {
          setMode(colorScheme === 'light' ? 'light' : 'dark');
        }
      });
    });

    return () => subscription?.remove();
  }, []);

  // Save theme preference when it changes
  useEffect(() => {
    if (isInitialized) {
      AsyncStorage.setItem(THEME_STORAGE_KEY, mode).catch((error) => {
        console.warn('Failed to save theme preference:', error);
      });
    }
  }, [mode, isInitialized]);

  const toggleTheme = () => {
    setMode(prevMode => prevMode === 'dark' ? 'light' : 'dark');
  };

  const setTheme = (newMode: ThemeMode) => {
    setMode(newMode);
  };

  const value: ThemeContextValue = {
    theme: currentTheme,
    mode,
    isDark: mode === 'dark',
    toggleTheme,
    setTheme,
    helpers,
  };

  // Don't render children until theme is initialized
  if (!isInitialized) {
    return null;
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook to use theme context
export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Hook for theme-aware styles
export const useThemedStyles = <T extends Record<string, any>>(
  createStyles: (theme: ThemeVariant) => T
): T => {
  const { theme } = useTheme();
  return createStyles(theme);
};

// HOC for theme-aware components
export const withTheme = <P extends object>(
  Component: React.ComponentType<P & { theme: ThemeVariant }>
) => {
  return React.forwardRef<any, P>((props, ref) => {
    const { theme } = useTheme();
    return <Component {...props} theme={theme} ref={ref} />;
  });
};

// Utility hook for responsive styles
export const useResponsiveValue = (values: any): any => {
  // This would be implemented based on screen dimensions
  // For now, return the default value
  return values.md || values.sm || values.xs;
};

export default ThemeProvider;