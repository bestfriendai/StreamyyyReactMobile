import { useEffect } from 'react';
import { Platform } from 'react-native';

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

export function useFrameworkReady() {
  useEffect(() => {
    console.log('useFrameworkReady: Platform.OS =', Platform.OS);
    console.log('useFrameworkReady: typeof window =', typeof window);
    
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.frameworkReady) {
      console.log('useFrameworkReady: Calling window.frameworkReady');
      window.frameworkReady();
    } else {
      console.log('useFrameworkReady: Skipping frameworkReady call');
    }
  }, []);
}
