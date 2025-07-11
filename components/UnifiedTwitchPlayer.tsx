/**
 * Unified Twitch Player Component
 * A clean, unified approach to Twitch stream embedding
 */

import React, { useState, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

interface UnifiedTwitchPlayerProps {
  streamId: string;
  onLoad?: () => void;
  onError?: (error: any) => void;
  style?: any;
}

export const UnifiedTwitchPlayer: React.FC<UnifiedTwitchPlayerProps> = ({
  streamId,
  onLoad,
  onError,
  style,
}) => {
  const [loading, setLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);

  // Simple parent domain configuration that works
  const embedUrl = `https://player.twitch.tv/?channel=${streamId}&parent=localhost&parent=expo.dev&muted=true&autoplay=true&controls=true`;

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
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#9146FF" />
        </View>
      )}
      
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
        startInLoadingState={true}
      />
    </View>
  );
};

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