/**
 * Unified Twitch Player Component
 * A clean, unified approach to Twitch stream embedding
 */

import React, { useState, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

interface UnifiedTwitchPlayerProps {
  streamId: string;
  muted?: boolean;
  onLoad?: () => void;
  onError?: (error: any) => void;
  style?: any;
  isVisible?: boolean; // For viewport culling
  priority?: 'high' | 'normal' | 'low'; // Loading priority
}

export const UnifiedTwitchPlayer: React.FC<UnifiedTwitchPlayerProps> = React.memo(
  ({ streamId, muted = true, onLoad, onError, style, isVisible = true, priority = 'normal' }) => {
    const [loading, setLoading] = useState(true);
    const [shouldLoad, setShouldLoad] = useState(priority === 'high');
    const [currentMuted, setCurrentMuted] = useState(muted);
    const webViewRef = useRef<WebView>(null);

    // Lazy loading based on visibility and priority
    React.useEffect(() => {
      if (isVisible && !shouldLoad) {
        // Add delay based on priority to prevent all WebViews loading at once
        const delay = priority === 'high' ? 0 : priority === 'normal' ? 300 : 600;
        const timer = setTimeout(() => setShouldLoad(true), delay);
        return () => clearTimeout(timer);
      }
    }, [isVisible, priority, shouldLoad]);

    // Update muted state and trigger efficient refresh only when needed
    React.useEffect(() => {
      if (muted !== currentMuted) {
        setCurrentMuted(muted);
      }
    }, [muted, currentMuted]);

    // Optimized embed URL that updates only mute parameter
    const embedUrl = React.useMemo(() => {
      return `https://player.twitch.tv/?channel=${streamId}&parent=localhost&parent=expo.dev&parent=expo.io&parent=snack.expo.dev&muted=${currentMuted}&autoplay=${isVisible}&controls=false&time=0s`;
    }, [streamId, currentMuted, isVisible]);

    const handleLoadEnd = () => {
      setLoading(false);
      onLoad?.();
    };

    const handleError = (event: any) => {
      setLoading(false);
      onError?.(event);
    };

    return (
      <View style={[styles.container, style]}>
        {(loading || !shouldLoad) && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#9146FF" />
          </View>
        )}

        {shouldLoad && (
          <WebView
            ref={webViewRef}
            source={{ uri: embedUrl }}
            style={styles.webview}
            onLoadEnd={handleLoadEnd}
            onError={handleError}
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState={false} // Reduce loading state duration
            // Performance optimizations for faster mute changes
            cacheEnabled={false} // Disable cache to ensure mute state updates
            mixedContentMode="compatibility"
            allowsBackForwardNavigationGestures={false}
            // Optimize rendering for mute state changes
            renderLoading={() => null} // Remove loading overlay for faster transitions
          />
        )}
      </View>
    );
  }
);

UnifiedTwitchPlayer.displayName = 'UnifiedTwitchPlayer';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    zIndex: 1,
  },
});

export default UnifiedTwitchPlayer;
