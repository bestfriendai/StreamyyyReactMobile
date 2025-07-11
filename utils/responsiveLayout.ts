import { Dimensions, Platform } from 'react-native';

export interface ScreenDimensions {
  width: number;
  height: number;
  isLandscape: boolean;
  aspectRatio: number;
}

export interface DeviceInfo {
  isTablet: boolean;
  isPhone: boolean;
  isDesktop: boolean;
  isLandscape: boolean;
  screenSize: 'small' | 'medium' | 'large' | 'xlarge';
  platform: 'ios' | 'android' | 'web';
}

export interface GridDimensions {
  columns: number;
  rows: number;
  cellWidth: number;
  cellHeight: number;
  gap: number;
  padding: number;
  maxCells: number;
}

export interface LayoutBreakpoints {
  small: number;    // Phone portrait
  medium: number;   // Phone landscape / small tablet
  large: number;    // Tablet portrait
  xlarge: number;   // Tablet landscape / desktop
}

// Standard breakpoints (based on common device sizes)
export const BREAKPOINTS: LayoutBreakpoints = {
  small: 480,   // iPhone SE, small phones
  medium: 768,  // iPad mini, large phones
  large: 1024,  // iPad, small tablets
  xlarge: 1440, // Large tablets, laptops
};

// Aspect ratios for video content
export const ASPECT_RATIOS = {
  standard: 16 / 9,     // Most streaming content
  widescreen: 21 / 9,   // Ultrawide content
  square: 1 / 1,        // Social media content
  portrait: 9 / 16,     // Mobile-first content
} as const;

/**
 * Get current screen dimensions and metadata
 */
export function getScreenDimensions(): ScreenDimensions {
  const { width, height } = Dimensions.get('window');
  const isLandscape = width > height;
  const aspectRatio = width / height;

  return {
    width,
    height,
    isLandscape,
    aspectRatio,
  };
}

/**
 * Determine device type and capabilities
 */
export function getDeviceInfo(): DeviceInfo {
  const { width, height } = Dimensions.get('window');
  const smallerDimension = Math.min(width, height);
  const largerDimension = Math.max(width, height);
  
  // Device type detection
  const isTablet = smallerDimension >= 600 && largerDimension >= 900;
  const isPhone = !isTablet && Platform.OS !== 'web';
  const isDesktop = Platform.OS === 'web' && largerDimension >= 1024;
  
  // Screen size classification
  let screenSize: DeviceInfo['screenSize'];
  if (largerDimension <= BREAKPOINTS.small) {
    screenSize = 'small';
  } else if (largerDimension <= BREAKPOINTS.medium) {
    screenSize = 'medium';
  } else if (largerDimension <= BREAKPOINTS.large) {
    screenSize = 'large';
  } else {
    screenSize = 'xlarge';
  }
  
  return {
    isTablet,
    isPhone,
    isDesktop,
    isLandscape: width > height,
    screenSize,
    platform: Platform.OS as 'ios' | 'android' | 'web',
  };
}

/**
 * Calculate optimal grid layout based on content and screen constraints
 */
export function calculateOptimalGrid(
  streamCount: number,
  screenDimensions: ScreenDimensions,
  deviceInfo: DeviceInfo,
  options: {
    maxStreams?: number;
    minCellWidth?: number;
    minCellHeight?: number;
    aspectRatio?: number;
    padding?: number;
    gap?: number;
    headerHeight?: number;
    footerHeight?: number;
  } = {}
): GridDimensions {
  const {
    maxStreams = 9,
    minCellWidth = 120,
    minCellHeight = 68,
    aspectRatio = ASPECT_RATIOS.standard,
    padding = 16,
    gap = 8,
    headerHeight = 120,
    footerHeight = 100,
  } = options;

  const { width, height, isLandscape } = screenDimensions;
  const { screenSize, isTablet } = deviceInfo;

  // Calculate available space
  const availableWidth = width - (padding * 2);
  const availableHeight = height - headerHeight - footerHeight - (padding * 2);

  // Determine optimal grid configuration
  const effectiveStreamCount = Math.min(streamCount, maxStreams);
  
  let bestLayout = { columns: 1, rows: 1, score: 0 };
  
  // Try different grid configurations
  for (let cols = 1; cols <= Math.ceil(Math.sqrt(effectiveStreamCount * 1.5)); cols++) {
    const rows = Math.ceil(effectiveStreamCount / cols);
    
    // Skip if this configuration can't fit all streams
    if (cols * rows < effectiveStreamCount) continue;
    
    // Calculate cell dimensions
    const cellWidth = (availableWidth - (gap * (cols - 1))) / cols;
    const cellHeight = (availableHeight - (gap * (rows - 1))) / rows;
    
    // Check minimum size constraints
    if (cellWidth < minCellWidth || cellHeight < minCellHeight) continue;
    
    // Calculate aspect ratio fitness
    const cellAspectRatio = cellWidth / cellHeight;
    const aspectRatioScore = Math.min(cellAspectRatio / aspectRatio, aspectRatio / cellAspectRatio);
    
    // Calculate space utilization
    const usedWidth = (cellWidth * cols) + (gap * (cols - 1));
    const usedHeight = (cellHeight * rows) + (gap * (rows - 1));
    const spaceUtilization = (usedWidth * usedHeight) / (availableWidth * availableHeight);
    
    // Calculate cell size score (prefer larger cells)
    const cellArea = cellWidth * cellHeight;
    const maxPossibleArea = (availableWidth / 1) * (availableHeight / 1);
    const sizeScore = cellArea / maxPossibleArea;
    
    // Prefer layouts that use screen real estate efficiently
    let layoutPreference = 1;
    
    // Device-specific preferences
    if (isTablet) {
      // Tablets can handle more complex layouts
      if (isLandscape && cols > rows) layoutPreference *= 1.2;
      if (!isLandscape && rows >= cols) layoutPreference *= 1.1;
    } else {
      // Phones prefer simpler layouts
      if (effectiveStreamCount <= 2 && (cols === 1 || rows === 1)) layoutPreference *= 1.3;
      if (effectiveStreamCount <= 4 && cols <= 2 && rows <= 2) layoutPreference *= 1.2;
    }
    
    // Screen size adjustments
    switch (screenSize) {
      case 'small':
        if (cols <= 2 && rows <= 2) layoutPreference *= 1.2;
        break;
      case 'medium':
        if (cols <= 3 && rows <= 3) layoutPreference *= 1.1;
        break;
      case 'large':
      case 'xlarge':
        if (cols >= 2 || rows >= 2) layoutPreference *= 1.1;
        break;
    }
    
    // Composite score
    const score = aspectRatioScore * spaceUtilization * sizeScore * layoutPreference;
    
    if (score > bestLayout.score) {
      bestLayout = { columns: cols, rows, score };
    }
  }
  
  // Calculate final dimensions
  const { columns, rows } = bestLayout;
  const cellWidth = Math.floor((availableWidth - (gap * (columns - 1))) / columns);
  const cellHeight = Math.floor((availableHeight - (gap * (rows - 1))) / rows);
  
  return {
    columns,
    rows,
    cellWidth,
    cellHeight,
    gap,
    padding,
    maxCells: columns * rows,
  };
}

/**
 * Get responsive padding based on device and screen size
 */
export function getResponsivePadding(deviceInfo: DeviceInfo, baseSize: number = 16): number {
  const { screenSize, isTablet } = deviceInfo;
  
  let multiplier = 1;
  
  switch (screenSize) {
    case 'small':
      multiplier = 0.75;
      break;
    case 'medium':
      multiplier = 1;
      break;
    case 'large':
      multiplier = 1.25;
      break;
    case 'xlarge':
      multiplier = 1.5;
      break;
  }
  
  if (isTablet) {
    multiplier *= 1.2;
  }
  
  return Math.round(baseSize * multiplier);
}

/**
 * Get responsive gap between grid items
 */
export function getResponsiveGap(deviceInfo: DeviceInfo, baseSize: number = 8): number {
  const { screenSize } = deviceInfo;
  
  switch (screenSize) {
    case 'small':
      return baseSize * 0.5;
    case 'medium':
      return baseSize;
    case 'large':
      return baseSize * 1.25;
    case 'xlarge':
      return baseSize * 1.5;
    default:
      return baseSize;
  }
}

/**
 * Get adaptive layout suggestions based on content type and stream count
 */
export function getLayoutSuggestions(
  streamCount: number,
  contentType: 'gaming' | 'music' | 'talk' | 'creative' | 'mixed' = 'mixed',
  deviceInfo: DeviceInfo
): Array<{
  layout: string;
  description: string;
  columns: number;
  rows: number;
  recommended: boolean;
}> {
  const suggestions = [];
  
  // Single stream
  if (streamCount === 1) {
    suggestions.push({
      layout: '1x1',
      description: 'Full screen focus',
      columns: 1,
      rows: 1,
      recommended: true,
    });
  }
  
  // Two streams
  if (streamCount === 2) {
    if (deviceInfo.isLandscape) {
      suggestions.push({
        layout: '2x1',
        description: 'Side by side',
        columns: 2,
        rows: 1,
        recommended: true,
      });
    }
    suggestions.push({
      layout: '1x2',
      description: 'Stacked view',
      columns: 1,
      rows: 2,
      recommended: !deviceInfo.isLandscape,
    });
  }
  
  // Three to four streams
  if (streamCount >= 3 && streamCount <= 4) {
    suggestions.push({
      layout: '2x2',
      description: 'Balanced grid',
      columns: 2,
      rows: 2,
      recommended: true,
    });
    
    if (contentType === 'gaming' && deviceInfo.isTablet) {
      suggestions.push({
        layout: 'pip',
        description: 'Picture-in-picture (good for gaming)',
        columns: 0,
        rows: 0,
        recommended: false,
      });
    }
  }
  
  // Five to nine streams
  if (streamCount >= 5 && streamCount <= 9) {
    suggestions.push({
      layout: '3x3',
      description: 'Comprehensive view',
      columns: 3,
      rows: 3,
      recommended: deviceInfo.isTablet || deviceInfo.screenSize === 'large',
    });
    
    if (deviceInfo.isLandscape && streamCount <= 6) {
      suggestions.push({
        layout: '3x2',
        description: 'Landscape optimized',
        columns: 3,
        rows: 2,
        recommended: true,
      });
    }
  }
  
  // Always suggest adaptive mode
  suggestions.push({
    layout: 'adaptive',
    description: 'Smart auto-layout',
    columns: 0,
    rows: 0,
    recommended: streamCount > 4 || deviceInfo.screenSize === 'small',
  });
  
  return suggestions;
}

/**
 * Hook-like function to get responsive grid dimensions that updates with screen changes
 */
export function useResponsiveGrid(
  streamCount: number,
  options: Parameters<typeof calculateOptimalGrid>[3] = {}
) {
  const screenDimensions = getScreenDimensions();
  const deviceInfo = getDeviceInfo();
  
  const gridDimensions = calculateOptimalGrid(
    streamCount,
    screenDimensions,
    deviceInfo,
    options
  );
  
  const padding = getResponsivePadding(deviceInfo, 16);
  const gap = getResponsiveGap(deviceInfo, 8);
  
  return {
    ...gridDimensions,
    padding,
    gap,
    screenDimensions,
    deviceInfo,
    suggestions: getLayoutSuggestions(streamCount, 'mixed', deviceInfo),
  };
}

export default {
  getScreenDimensions,
  getDeviceInfo,
  calculateOptimalGrid,
  getResponsivePadding,
  getResponsiveGap,
  getLayoutSuggestions,
  useResponsiveGrid,
  BREAKPOINTS,
  ASPECT_RATIOS,
};