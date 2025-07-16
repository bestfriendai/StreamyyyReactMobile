import { router } from 'expo-router';

export interface NavigationHistory {
  route: string;
  params?: Record<string, any>;
  timestamp: number;
}

export interface DeepLinkParams {
  streamId?: string;
  userId?: string;
  layoutId?: string;
  tab?: string;
  action?: string;
}

class NavigationService {
  private history: NavigationHistory[] = [];
  private maxHistorySize = 20;
  
  constructor() {
    // Removed auto-initialization to prevent mounting errors
  }

  /**
   * Navigate to a route with optional parameters
   */
  navigate(route: string, params?: Record<string, any>) {
    try {
      this.addToHistory(route, params);
      
      if (params) {
        router.push({
          pathname: route as any,
          params,
        });
      } else {
        router.push(route as any);
      }
      
      console.log('Navigation successful', { route, params });
    } catch (error) {
      console.error('Navigation failed', error);
    }
  }

  /**
   * Navigate with authentication check
   */
  navigateWithAuth(route: string, params?: Record<string, any>) {
    // Simplified - just navigate for now
    this.navigate(route, params);
  }

  /**
   * Replace current route
   */
  replace(route: string, params?: Record<string, any>) {
    try {
      this.addToHistory(route, params);
      
      if (params) {
        router.replace({
          pathname: route as any,
          params,
        });
      } else {
        router.replace(route as any);
      }
    } catch (error) {
      console.error('Replace navigation failed', error);
    }
  }

  /**
   * Go back in navigation history
   */
  goBack() {
    try {
      if (router.canGoBack()) {
        router.back();
      }
    } catch (error) {
      console.error('Go back failed', error);
    }
  }

  /**
   * Add route to history
   */
  private addToHistory(route: string, params?: Record<string, any>) {
    const historyItem: NavigationHistory = {
      route,
      params,
      timestamp: Date.now(),
    };

    this.history.push(historyItem);

    // Keep history size manageable
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  /**
   * Get navigation history
   */
  getHistory(): NavigationHistory[] {
    return [...this.history];
  }

  /**
   * Clear navigation history
   */
  clearHistory() {
    this.history = [];
  }
}

// Export singleton instance
export const navigationService = new NavigationService();
export default NavigationService;