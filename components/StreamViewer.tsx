import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Dimensions, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { Volume2, VolumeX, Maximize, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TwitchStream, twitchApi } from '@/services/twitchApi';

interface StreamViewerProps {
  stream: TwitchStream;
  onRemove: (streamId: string) => void;
  width?: number;
  height?: number;
}

export function StreamViewer({ stream, onRemove, width, height }: StreamViewerProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(false);

  const screenWidth = Dimensions.get('window').width;
  const viewerWidth = width || screenWidth - 32;
  const viewerHeight = height || (viewerWidth * 9) / 16;

  const embedUrl = twitchApi.generateEmbedUrl(stream.user_login) + (isMuted ? '&muted=true' : '&muted=false');

  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      // Clear any existing timeout when component unmounts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (showControls) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        // Only update state if component is still mounted
        if (isMountedRef.current) {
          setShowControls(false);
        }
      }, 3000);
    }

    // Cleanup function to clear timeout on unmount or when showControls changes
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [showControls]);

  const handlePress = () => {
    if (isMountedRef.current) {
      setShowControls(!showControls);
    }
  };

  const handleMuteToggle = () => {
    if (isMountedRef.current) {
      setIsMuted(!isMuted);
    }
  };

  return (
    <View style={[styles.container, { width: viewerWidth, height: viewerHeight }]}>
      <TouchableOpacity
        style={styles.touchArea}
        onPress={handlePress}
        activeOpacity={1}
      >
        <WebView
          source={{ uri: embedUrl }}
          style={styles.webview}
          allowsFullscreenVideo={false}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          mixedContentMode="compatibility"
          scrollEnabled={false}
          bounces={false}
          onLoadStart={() => console.log(`Loading stream: ${stream.user_name}`)}
          onLoad={() => console.log(`Stream loaded: ${stream.user_name}`)}
          onError={(error) => console.error(`Stream error for ${stream.user_name}:`, error)}
        />
        
        {showControls && (
          <View style={styles.controlsOverlay}>
            <LinearGradient
              colors={['rgba(0,0,0,0.8)', 'transparent', 'rgba(0,0,0,0.8)']}
              style={styles.controlsGradient}
            >
              <View style={styles.topControls}>
                <View style={styles.streamInfo}>
                  <View style={styles.platformBadge}>
                    <Text style={styles.platformText}>TWITCH</Text>
                  </View>
                  <View style={styles.liveIndicator}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>LIVE</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => onRemove(stream.id)}
                >
                  <LinearGradient
                    colors={['rgba(239, 68, 68, 0.9)', 'rgba(220, 38, 38, 0.9)']}
                    style={styles.closeGradient}
                  >
                    <X size={20} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
              
              <View style={styles.bottomControls}>
                <View style={styles.streamDetails}>
                  <Text style={styles.streamTitle} numberOfLines={1}>
                    {stream.user_name}
                  </Text>
                  <Text style={styles.streamGame} numberOfLines={1}>
                    {stream.game_name}
                  </Text>
                </View>
                <View style={styles.controlButtons}>
                  <TouchableOpacity
                    style={styles.controlButton}
                    onPress={handleMuteToggle}
                  >
                    <LinearGradient
                      colors={['rgba(139, 92, 246, 0.9)', 'rgba(124, 58, 237, 0.9)']}
                      style={styles.controlGradient}
                    >
                      {isMuted ? (
                        <VolumeX size={16} color="#fff" />
                      ) : (
                        <Volume2 size={16} color="#fff" />
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.controlButton}>
                    <LinearGradient
                      colors={['rgba(139, 92, 246, 0.9)', 'rgba(124, 58, 237, 0.9)']}
                      style={styles.controlGradient}
                    >
                      <Maximize size={16} color="#fff" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
    margin: 4,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
      },
    }),
  },
  touchArea: {
    flex: 1,
    position: 'relative',
  },
  webview: {
    flex: 1,
  },
  controlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  controlsGradient: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 12,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  streamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  platformBadge: {
    backgroundColor: '#9146FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  platformText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.5,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00FF00',
  },
  liveText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0.5,
  },
  closeButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  closeGradient: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  streamDetails: {
    flex: 1,
    marginRight: 12,
  },
  streamTitle: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  streamGame: {
    color: '#8B5CF6',
    fontSize: 11,
    fontFamily: 'Inter-Medium',
  },
  controlButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  controlButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  controlGradient: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
});