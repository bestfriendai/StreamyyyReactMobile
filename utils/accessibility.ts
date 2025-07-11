/**
 * Accessibility Utilities
 * Enhances accessibility support throughout the app using unified theme
 */

import { AccessibilityInfo, Platform } from 'react-native';
// import { unifiedTheme } from '@/theme/unifiedTheme'; // TODO: Fix import path

// Accessibility levels
export type AccessibilityLevel = 'AA' | 'AAA';

// Color contrast utilities
class ColorContrastUtils {
  /**
   * Calculate relative luminance of a color
   */
  static getRelativeLuminance(color: string): number {
    // Convert hex to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    // Apply gamma correction
    const gamma = (c: number) => {
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };

    return 0.2126 * gamma(r) + 0.7152 * gamma(g) + 0.0722 * gamma(b);
  }

  /**
   * Calculate contrast ratio between two colors
   */
  static getContrastRatio(color1: string, color2: string): number {
    const lum1 = this.getRelativeLuminance(color1);
    const lum2 = this.getRelativeLuminance(color2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    
    return (brightest + 0.05) / (darkest + 0.05);
  }

  /**
   * Check if color combination meets WCAG accessibility standards
   */
  static meetsAccessibilityStandard(
    foreground: string,
    background: string,
    level: AccessibilityLevel = 'AA',
    isLargeText = false
  ): boolean {
    const ratio = this.getContrastRatio(foreground, background);
    
    if (level === 'AAA') {
      return isLargeText ? ratio >= 4.5 : ratio >= 7;
    }
    
    // AA level
    return isLargeText ? ratio >= 3 : ratio >= 4.5;
  }

  /**
   * Get accessible text color for a given background
   */
  static getAccessibleTextColor(
    backgroundColor: string,
    theme: any, // TODO: Fix theme type
    level: AccessibilityLevel = 'AA'
  ): string {
    const { text } = theme;
    
    // Test different text colors
    const textColors = [
      text.primary,
      text.secondary,
      text.tertiary,
      '#ffffff',
      '#000000',
    ];

    for (const color of textColors) {
      if (this.meetsAccessibilityStandard(color, backgroundColor, level)) {
        return color;
      }
    }

    // Fallback to high contrast
    const ratio = this.getContrastRatio('#ffffff', backgroundColor);
    return ratio > this.getContrastRatio('#000000', backgroundColor) ? '#ffffff' : '#000000';
  }

  /**
   * Adjust color opacity for better accessibility
   */
  static getAccessibleOpacity(
    color: string,
    backgroundColor: string,
    targetRatio = 4.5
  ): number {
    for (let opacity = 1; opacity >= 0.1; opacity -= 0.1) {
      const adjustedColor = this.applyOpacity(color, opacity);
      if (this.getContrastRatio(adjustedColor, backgroundColor) >= targetRatio) {
        return opacity;
      }
    }
    return 1;
  }

  /**
   * Apply opacity to a hex color
   */
  private static applyOpacity(color: string, opacity: number): string {
    const alpha = Math.round(opacity * 255).toString(16).padStart(2, '0');
    return `${color}${alpha}`;
  }
}

// Focus management utilities
class FocusManager {
  private static focusOrder: string[] = [];
  private static currentFocusIndex = 0;

  /**
   * Register focusable element
   */
  static registerFocusable(id: string, index?: number): void {
    if (index !== undefined) {
      this.focusOrder.splice(index, 0, id);
    } else {
      this.focusOrder.push(id);
    }
  }

  /**
   * Unregister focusable element
   */
  static unregisterFocusable(id: string): void {
    const index = this.focusOrder.indexOf(id);
    if (index > -1) {
      this.focusOrder.splice(index, 1);
    }
  }

  /**
   * Move focus to next element
   */
  static focusNext(): void {
    this.currentFocusIndex = (this.currentFocusIndex + 1) % this.focusOrder.length;
    // Implementation would depend on the specific focus system used
  }

  /**
   * Move focus to previous element
   */
  static focusPrevious(): void {
    this.currentFocusIndex = 
      this.currentFocusIndex === 0 
        ? this.focusOrder.length - 1 
        : this.currentFocusIndex - 1;
    // Implementation would depend on the specific focus system used
  }
}

// Screen reader utilities
class ScreenReaderUtils {
  /**
   * Check if screen reader is enabled
   */
  static async isScreenReaderEnabled(): Promise<boolean> {
    return AccessibilityInfo.isScreenReaderEnabled();
  }

  /**
   * Announce message to screen reader
   */
  static announce(message: string): void {
    AccessibilityInfo.announceForAccessibility(message);
  }

  /**
   * Generate accessible label for streaming content
   */
  static generateStreamLabel(
    streamerName: string,
    viewerCount: number,
    category?: string,
    isLive = false
  ): string {
    const status = isLive ? 'Live' : 'Offline';
    const viewers = `${viewerCount.toLocaleString()} viewers`;
    const categoryText = category ? `, playing ${category}` : '';
    
    return `${streamerName}, ${status}, ${viewers}${categoryText}`;
  }

  /**
   * Generate accessible button label
   */
  static generateButtonLabel(
    action: string,
    state?: string,
    disabled = false
  ): string {
    let label = action;
    
    if (state) {
      label += `, ${state}`;
    }
    
    if (disabled) {
      label += ', disabled';
    }
    
    return label;
  }

  /**
   * Format time for screen readers
   */
  static formatTimeForScreenReader(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    let result = '';
    
    if (hours > 0) {
      result += `${hours} hour${hours > 1 ? 's' : ''} `;
    }
    
    if (minutes > 0) {
      result += `${minutes} minute${minutes > 1 ? 's' : ''} `;
    }
    
    if (remainingSeconds > 0 || result === '') {
      result += `${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`;
    }
    
    return result.trim();
  }
}

// High contrast mode utilities
class HighContrastUtils {
  /**
   * Check if high contrast mode is preferred
   */
  static async isHighContrastPreferred(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      return AccessibilityInfo.isHighTextContrastEnabled?.() || false;
    }
    // Android implementation would go here
    return false;
  }

  /**
   * Get high contrast color palette
   */
  static getHighContrastPalette(isDark: boolean) {
    if (isDark) {
      return {
        background: '#000000',
        surface: '#1a1a1a',
        primary: '#ffffff',
        secondary: '#cccccc',
        accent: '#00ff00',
        error: '#ff4444',
        warning: '#ffaa00',
        success: '#00ff00',
        border: '#ffffff',
        text: {
          primary: '#ffffff',
          secondary: '#cccccc',
          disabled: '#666666',
        },
      };
    }

    return {
      background: '#ffffff',
      surface: '#f5f5f5',
      primary: '#000000',
      secondary: '#333333',
      accent: '#0000ff',
      error: '#cc0000',
      warning: '#cc6600',
      success: '#006600',
      border: '#000000',
      text: {
        primary: '#000000',
        secondary: '#333333',
        disabled: '#999999',
      },
    };
  }
}

// Animation preferences
class MotionPreferences {
  /**
   * Check if reduced motion is preferred
   */
  static async isReducedMotionPreferred(): Promise<boolean> {
    return AccessibilityInfo.isReduceMotionEnabled();
  }

  /**
   * Get animation duration based on motion preferences
   */
  static async getAccessibleDuration(normalDuration: number): Promise<number> {
    const isReduced = await this.isReducedMotionPreferred();
    return isReduced ? normalDuration * 0.1 : normalDuration;
  }

  /**
   * Check if animation should be disabled
   */
  static async shouldDisableAnimation(): Promise<boolean> {
    return this.isReducedMotionPreferred();
  }
}

// Touch target utilities
class TouchTargetUtils {
  private static readonly MIN_TOUCH_TARGET_SIZE = 44; // iOS/Android recommendation

  /**
   * Ensure touch target meets minimum size requirements
   */
  static ensureMinimumTouchTarget(size: number): number {
    return Math.max(size, this.MIN_TOUCH_TARGET_SIZE);
  }

  /**
   * Get recommended padding for touch targets
   */
  static getRecommendedPadding(elementSize: number): number {
    const shortfall = this.MIN_TOUCH_TARGET_SIZE - elementSize;
    return shortfall > 0 ? shortfall / 2 : 0;
  }

  /**
   * Check if touch target is accessible
   */
  static isTouchTargetAccessible(width: number, height: number): boolean {
    return width >= this.MIN_TOUCH_TARGET_SIZE && height >= this.MIN_TOUCH_TARGET_SIZE;
  }
}

// Accessibility testing utilities
class AccessibilityTester {
  /**
   * Test component accessibility
   */
  static testComponent(config: {
    backgroundColor: string;
    textColor: string;
    touchTargetSize: { width: number; height: number };
    hasLabel: boolean;
    hasHint?: boolean;
    isInteractive: boolean;
  }) {
    const issues: string[] = [];

    // Test color contrast
    if (!ColorContrastUtils.meetsAccessibilityStandard(config.textColor, config.backgroundColor)) {
      issues.push('Color contrast does not meet WCAG AA standards');
    }

    // Test touch target size
    if (config.isInteractive && 
        !TouchTargetUtils.isTouchTargetAccessible(
          config.touchTargetSize.width, 
          config.touchTargetSize.height
        )) {
      issues.push('Touch target size is below recommended minimum (44x44)');
    }

    // Test accessibility labels
    if (!config.hasLabel) {
      issues.push('Missing accessibility label');
    }

    return {
      passed: issues.length === 0,
      issues,
    };
  }
}

// Export all utilities
export {
  ColorContrastUtils,
  FocusManager,
  ScreenReaderUtils,
  HighContrastUtils,
  MotionPreferences,
  TouchTargetUtils,
  AccessibilityTester,
};

export default {
  ColorContrastUtils,
  FocusManager,
  ScreenReaderUtils,
  HighContrastUtils,
  MotionPreferences,
  TouchTargetUtils,
  AccessibilityTester,
};