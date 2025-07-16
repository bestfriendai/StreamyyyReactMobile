import React from 'react';
import { Dimensions, Platform } from 'react-native';

export interface ScreenDimensions {
  width: number;
  height: number;
}

export interface ResponsiveBreakpoints {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

export type ScreenSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type Orientation = 'portrait' | 'landscape';

// Default breakpoints (similar to Tailwind CSS)
const DEFAULT_BREAKPOINTS: ResponsiveBreakpoints = {
  xs: 0,     // 0px and up (mobile portrait)
  sm: 640,   // 640px and up (mobile landscape, small tablets)
  md: 768,   // 768px and up (tablets)
  lg: 1024,  // 1024px and up (desktop)
  xl: 1280,  // 1280px and up (large desktop)
};

export class ResponsiveLayout {
  private static breakpoints: ResponsiveBreakpoints = DEFAULT_BREAKPOINTS;
  private static dimensions: ScreenDimensions = Dimensions.get('window');

  /**
   * Update screen dimensions (call this on orientation change)
   */
  static updateDimensions() {
    ResponsiveLayout.dimensions = Dimensions.get('window');
  }

  /**
   * Get current screen dimensions
   */
  static getDimensions(): ScreenDimensions {
    return ResponsiveLayout.dimensions;
  }

  /**
   * Get current screen orientation
   */
  static getOrientation(): Orientation {
    const { width, height } = ResponsiveLayout.dimensions;
    return width > height ? 'landscape' : 'portrait';
  }

  /**
   * Get current screen size category
   */
  static getScreenSize(): ScreenSize {
    const { width } = ResponsiveLayout.dimensions;
    const { xs, sm, md, lg, xl } = ResponsiveLayout.breakpoints;

    if (width >= xl) return 'xl';
    if (width >= lg) return 'lg';
    if (width >= md) return 'md';
    if (width >= sm) return 'sm';
    return 'xs';
  }

  /**
   * Check if screen width is at least the specified breakpoint
   */
  static isMinWidth(breakpoint: ScreenSize): boolean {
    const { width } = ResponsiveLayout.dimensions;
    return width >= ResponsiveLayout.breakpoints[breakpoint];
  }

  /**
   * Check if screen width is at most the specified breakpoint
   */
  static isMaxWidth(breakpoint: ScreenSize): boolean {
    const { width } = ResponsiveLayout.dimensions;
    const nextBreakpoint = ResponsiveLayout.getNextBreakpoint(breakpoint);
    return nextBreakpoint ? width < ResponsiveLayout.breakpoints[nextBreakpoint] : true;
  }

  /**
   * Check if current platform is tablet
   */
  static isTablet(): boolean {
    if (Platform.OS === 'ios') {
      // For iOS, check if it's iPad using screen dimensions
      const { width, height } = ResponsiveLayout.dimensions;
      const minDimension = Math.min(width, height);
      const maxDimension = Math.max(width, height);
      
      // iPad dimensions are typically 768x1024 or larger
      return minDimension >= 768 && maxDimension >= 1024;
    } else if (Platform.OS === 'android') {
      // For Android, use screen size categories
      return ResponsiveLayout.isMinWidth('md');
    }
    return false;
  }

  /**
   * Check if current platform is mobile
   */
  static isMobile(): boolean {
    return !ResponsiveLayout.isTablet() && !ResponsiveLayout.isDesktop();
  }

  /**
   * Check if current platform is desktop
   */
  static isDesktop(): boolean {
    return Platform.OS === 'web' && ResponsiveLayout.isMinWidth('lg');
  }

  /**
   * Get responsive value based on screen size
   */
  static getResponsiveValue<T>(values: Partial<Record<ScreenSize, T>>): T | undefined {
    const currentSize = ResponsiveLayout.getScreenSize();
    const sizeOrder: ScreenSize[] = ['xl', 'lg', 'md', 'sm', 'xs'];
    
    // Find the first available value at or below current screen size
    for (const size of sizeOrder) {
      if (ResponsiveLayout.isMinWidth(size) && values[size] !== undefined) {
        return values[size];
      }
    }
    
    // Fallback to the smallest available value
    for (const size of ['xs', 'sm', 'md', 'lg', 'xl'] as ScreenSize[]) {
      if (values[size] !== undefined) {
        return values[size];
      }
    }
    
    return undefined;
  }

  /**
   * Calculate responsive grid columns
   */
  static getGridColumns(options?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  }): number {
    const { mobile = 1, tablet = 2, desktop = 3 } = options || {};
    
    if (ResponsiveLayout.isDesktop()) return desktop;
    if (ResponsiveLayout.isTablet()) return tablet;
    return mobile;
  }

  /**
   * Calculate responsive spacing
   */
  static getResponsiveSpacing(baseSpacing: number): {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  } {
    return {
      xs: baseSpacing * 0.5,
      sm: baseSpacing * 0.75,
      md: baseSpacing,
      lg: baseSpacing * 1.25,
      xl: baseSpacing * 1.5,
    };
  }

  /**
   * Calculate responsive font sizes
   */
  static getResponsiveFontSize(baseFontSize: number): {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  } {
    return {
      xs: baseFontSize * 0.875,  // 14px if base is 16px
      sm: baseFontSize * 0.9375, // 15px if base is 16px
      md: baseFontSize,          // 16px
      lg: baseFontSize * 1.125,  // 18px if base is 16px
      xl: baseFontSize * 1.25,   // 20px if base is 16px
    };
  }

  /**
   * Get responsive dimensions for components
   */
  static getResponsiveDimensions(config: {
    baseWidth: number;
    baseHeight: number;
    aspectRatio?: number;
    maxWidth?: number;
    maxHeight?: number;
  }) {
    const { baseWidth, baseHeight, aspectRatio, maxWidth, maxHeight } = config;
    const { width: screenWidth, height: screenHeight } = ResponsiveLayout.dimensions;
    const currentSize = ResponsiveLayout.getScreenSize();
    
    // Scale factors based on screen size
    const scaleFactors = {
      xs: 0.9,
      sm: 0.95,
      md: 1.0,
      lg: 1.1,
      xl: 1.2,
    };
    
    const scaleFactor = scaleFactors[currentSize];
    let width = baseWidth * scaleFactor;
    let height = baseHeight * scaleFactor;
    
    // Apply aspect ratio if specified
    if (aspectRatio) {
      height = width / aspectRatio;
    }
    
    // Apply max constraints
    if (maxWidth && width > maxWidth) {
      width = maxWidth;
      if (aspectRatio) height = width / aspectRatio;
    }
    
    if (maxHeight && height > maxHeight) {
      height = maxHeight;
      if (aspectRatio) width = height * aspectRatio;
    }
    
    // Ensure dimensions don't exceed screen size
    width = Math.min(width, screenWidth * 0.95);
    height = Math.min(height, screenHeight * 0.95);
    
    return { width, height };
  }

  /**
   * Helper to get the next breakpoint
   */
  private static getNextBreakpoint(current: ScreenSize): ScreenSize | null {
    const order = ['xs', 'sm', 'md', 'lg', 'xl'];
    const currentIndex = order.indexOf(current);
    return currentIndex < order.length - 1 ? order[currentIndex + 1] as ScreenSize : null;
  }

  /**
   * Set custom breakpoints
   */
  static setBreakpoints(breakpoints: Partial<ResponsiveBreakpoints>) {
    ResponsiveLayout.breakpoints = { ...ResponsiveLayout.breakpoints, ...breakpoints };
  }

  /**
   * Get current breakpoints
   */
  static getBreakpoints(): ResponsiveBreakpoints {
    return { ...ResponsiveLayout.breakpoints };
  }

  /**
   * Calculate optimal layout for multi-stream grid
   */
  static getOptimalStreamLayout(streamCount: number): {
    columns: number;
    rows: number;
    itemWidth: number;
    itemHeight: number;
    spacing: number;
  } {
    const { width, height } = ResponsiveLayout.dimensions;
    const isLandscape = ResponsiveLayout.getOrientation() === 'landscape';
    const isTabletOrLarger = ResponsiveLayout.isMinWidth('md');
    
    let columns: number;
    let rows: number;
    
    // Determine optimal grid layout
    if (streamCount === 1) {
      columns = 1;
      rows = 1;
    } else if (streamCount === 2) {
      if (isLandscape) {
        columns = 2;
        rows = 1;
      } else {
        columns = 1;
        rows = 2;
      }
    } else if (streamCount <= 4) {
      columns = 2;
      rows = 2;
    } else if (streamCount <= 6) {
      if (isTabletOrLarger) {
        columns = 3;
        rows = 2;
      } else {
        columns = 2;
        rows = 3;
      }
    } else {
      if (isTabletOrLarger) {
        columns = 4;
        rows = Math.ceil(streamCount / 4);
      } else {
        columns = 3;
        rows = Math.ceil(streamCount / 3);
      }
    }
    
    // Calculate spacing and dimensions
    const spacing = ResponsiveLayout.getResponsiveValue({
      xs: 8,
      sm: 12,
      md: 16,
      lg: 20,
      xl: 24,
    }) || 16;
    
    const padding = spacing * 2;
    const availableWidth = width - padding - ((columns - 1) * spacing);
    const availableHeight = height - padding - ((rows - 1) * spacing);
    
    const itemWidth = availableWidth / columns;
    const itemHeight = availableHeight / rows;
    
    return {
      columns,
      rows,
      itemWidth,
      itemHeight,
      spacing,
    };
  }
}

// Hook for React components to use responsive layout
export const useResponsiveLayout = () => {
  const [dimensions, setDimensions] = React.useState(ResponsiveLayout.getDimensions());
  
  React.useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      ResponsiveLayout.updateDimensions();
      setDimensions(ResponsiveLayout.getDimensions());
    });

    return () => subscription?.remove();
  }, []);

  return {
    dimensions,
    screenSize: ResponsiveLayout.getScreenSize(),
    orientation: ResponsiveLayout.getOrientation(),
    isTablet: ResponsiveLayout.isTablet(),
    isMobile: ResponsiveLayout.isMobile(),
    isDesktop: ResponsiveLayout.isDesktop(),
    getResponsiveValue: ResponsiveLayout.getResponsiveValue,
    getGridColumns: ResponsiveLayout.getGridColumns,
    getOptimalStreamLayout: ResponsiveLayout.getOptimalStreamLayout,
  };
};

export default ResponsiveLayout;