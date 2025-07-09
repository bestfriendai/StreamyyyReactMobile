import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  PanResponder,
  Animated,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { MotiView, MotiText } from 'moti';
import { BlurView } from '@react-native-community/blur';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  X,
  Move,
  RotateCw,
} from 'lucide-react-native';
import { TwitchStream } from '@/services/twitchApi';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PictureInPictureViewerProps {
  stream: TwitchStream;
  onClose: () => void;
  onMaximize: () => void;
  isVisible: boolean;
}

export const PictureInPictureViewer: React.FC<PictureInPictureViewerProps> = ({
  stream,
  onClose,
  onMaximize,
  isVisible,
}) => {
  const [position, setPosition] = useState({ x: SCREEN_WIDTH - 180, y: 100 });
  const [size, setSize] = useState({ width: 160, height: 90 });
  const [isMuted, setIsMuted] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  
  const pan = useRef(new Animated.ValueXY(position)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    if (isVisible) {
      Animated.spring(opacity, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 8,
      }).start();
    } else {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible]);

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
    },
    
    onPanResponderGrant: () => {
      setIsDragging(true);
      Animated.spring(scale, {
        toValue: 1.1,
        useNativeDriver: true,
        tension: 300,
        friction: 8,
      }).start();
    },
    
    onPanResponderMove: Animated.event(
      [null, { dx: pan.x, dy: pan.y }],
      { useNativeDriver: false }
    ),
    
    onPanResponderRelease: (evt, gestureState) => {
      setIsDragging(false);
      
      // Snap to edges
      const newX = Math.max(10, Math.min(SCREEN_WIDTH - size.width - 10, 
        position.x + gestureState.dx));
      const newY = Math.max(50, Math.min(SCREEN_HEIGHT - size.height - 100, 
        position.y + gestureState.dy));
      
      setPosition({ x: newX, y: newY });
      
      Animated.parallel([
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
        }),
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 300,
          friction: 8,
        })
      ]).start();
    },
  });

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({
        action: isMuted ? 'unmute' : 'mute',
        id: stream.id
      }));
    }
  };

  const handleResize = () => {
    const newSize = size.width === 160 
      ? { width: 240, height: 135 }
      : { width: 160, height: 90 };
    
    setSize(newSize);
    
    // Adjust position if resized PiP goes off screen
    const adjustedX = Math.min(position.x, SCREEN_WIDTH - newSize.width - 10);
    const adjustedY = Math.min(position.y, SCREEN_HEIGHT - newSize.height - 100);
    
    if (adjustedX !== position.x || adjustedY !== position.y) {
      setPosition({ x: adjustedX, y: adjustedY });
    }
  };

  // Generate Twitch embed HTML optimized for PiP
  const embedUrl = `https://player.twitch.tv/?channel=${stream.user_name}&parent=localhost&muted=${isMuted}&autoplay=true`;
  
  const twitchEmbedHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          background: #0e0e10;
          overflow: hidden;
          width: 100%;
          height: 100%;
        }
        iframe { 
          width: 100% !important; 
          height: 100% !important; 
          border: none !important;
          display: block !important;
        }
        .container {
          width: 100%;
          height: 100%;
          position: relative;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <iframe
          src="${embedUrl}"
          frameborder="0"
          allowfullscreen="false"
          scrolling="no"
          allow="autoplay; encrypted-media">
        </iframe>
      </div>
    </body>
    </html>
  `;

  if (!isVisible) return null;

  return (
    <Animated.View
      style={[
        styles.pipContainer,
        {
          left: position.x,
          top: position.y,
          width: size.width,
          height: size.height,
          opacity: opacity,
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { scale: scale }
          ],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <MotiView
        from={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        style={StyleSheet.absoluteFill}
      >
        {/* Main PiP Container */}
        <BlurView style={styles.pipBlur} blurType="dark" blurAmount={10}>
          <LinearGradient
            colors={['rgba(139, 92, 246, 0.2)', 'rgba(0, 0, 0, 0.8)']}
            style={styles.pipGradient}
          >
            {/* Stream Content */}
            <View style={styles.streamContainer}>
              <WebView
                ref={webViewRef}
                source={{ html: twitchEmbedHtml }}
                style={StyleSheet.absoluteFill}
                onLoadStart={() => setIsLoading(true)}
                onLoadEnd={() => setIsLoading(false)}
                allowsInlineMediaPlaybook={true}
                mediaPlaybackRequiresUserAction={false}
                scrollEnabled={false}
                bounces={false}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
              />
              
              {/* Loading overlay */}
              {isLoading && (
                <MotiView
                  from={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={[StyleSheet.absoluteFill, styles.loadingOverlay]}
                >
                  <BlurView
                    style={StyleSheet.absoluteFill}
                    blurType="dark"
                    blurAmount={20}
                  />
                  <MotiView
                    from={{ rotate: '0deg' }}
                    animate={{ rotate: '360deg' }}
                    transition={{
                      type: 'timing',
                      duration: 1000,
                      loop: true,
                    }}
                  >
                    <RotateCw size={16} color="#8B5CF6" />
                  </MotiView>
                </MotiView>
              )}

              {/* Drag indicator */}
              {isDragging && (
                <MotiView
                  from={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={styles.dragIndicator}
                >
                  <Move size={12} color="#8B5CF6" />
                </MotiView>
              )}
            </View>

            {/* Control overlay */}
            <View style={styles.controlsOverlay}>
              {/* Stream info */}
              <LinearGradient
                colors={['rgba(0,0,0,0.8)', 'transparent']}
                style={styles.infoOverlay}
              >
                <MotiText
                  style={styles.streamTitle}
                  numberOfLines={1}
                >
                  {stream.user_name}
                </MotiText>
                <View style={styles.liveIndicator}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
              </LinearGradient>

              {/* Controls */}
              <BlurView style={styles.controlsContainer} blurType="dark" blurAmount={10}>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={toggleMute}
                >
                  {isMuted ? (
                    <VolumeX size={12} color="#fff" />
                  ) : (
                    <Volume2 size={12} color="#8B5CF6" />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={handleResize}
                >
                  {size.width === 160 ? (
                    <Maximize2 size={12} color="#fff" />
                  ) : (
                    <Minimize2 size={12} color="#fff" />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={onMaximize}
                >
                  <Maximize2 size={12} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={onClose}
                >
                  <X size={12} color="#ff4444" />
                </TouchableOpacity>
              </BlurView>
            </View>

            {/* Border glow */}
            <MotiView
              from={{ opacity: 0.5 }}
              animate={{ opacity: isDragging ? 1 : 0.5 }}
              style={styles.borderGlow}
            />
          </LinearGradient>
        </BlurView>
      </MotiView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  pipContainer: {
    position: 'absolute',
    borderRadius: 12,
    overflow: 'hidden',
    zIndex: 1000,
    ...Platform.select({
      ios: {
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  pipBlur: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  pipGradient: {
    flex: 1,
    borderRadius: 12,
  },
  streamContainer: {
    flex: 1,
    position: 'relative',
  },
  loadingOverlay: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  dragIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.8)',
    borderRadius: 12,
    padding: 4,
  },
  controlsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  infoOverlay: {
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 4,
  },
  streamTitle: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ff4444',
  },
  liveText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '600',
  },
  controlsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 6,
    paddingVertical: 4,
    justifyContent: 'space-between',
  },
  controlButton: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  borderGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.6)',
  },
});