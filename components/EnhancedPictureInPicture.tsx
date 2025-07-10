import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
  PanResponder,
  Animated,
  Platform,
} from 'react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Maximize2,
  Minimize2,
  X,
  Volume2,
  VolumeX,
  RotateCcw,
  Move,
  Settings,
  Eye,
  ExternalLink,
} from 'lucide-react-native';
import { TwitchStream } from '@/services/twitchApi';
import { ModernTheme } from '@/theme/modernTheme';
import { WorkingTwitchPlayer } from './WorkingTwitchPlayer';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PiPPosition {
  x: number;
  y: number;
}

interface PiPSize {
  width: number;
  height: number;
}

interface EnhancedPictureInPictureProps {
  stream: TwitchStream;
  isVisible: boolean;
  isMinimized: boolean;
  isMuted: boolean;
  position: PiPPosition;
  size: PiPSize;
  onClose: () => void;
  onToggleMinimize: () => void;
  onToggleMute: () => void;
  onPositionChange: (position: PiPPosition) => void;
  onSizeChange: (size: PiPSize) => void;
  onMaximize: () => void;
  onOpenExternal: () => void;
  zIndex?: number;
}

const DEFAULT_PIP_SIZE = {
  width: 200,
  height: 120,
};

const MIN_PIP_SIZE = {
  width: 120,
  height: 80,
};

const MAX_PIP_SIZE = {
  width: 300,
  height: 200,
};

const EDGE_SNAP_THRESHOLD = 20;

export const EnhancedPictureInPicture: React.FC<EnhancedPictureInPictureProps> = ({
  stream,
  isVisible,
  isMinimized,
  isMuted,
  position,
  size,
  onClose,
  onToggleMinimize,
  onToggleMute,
  onPositionChange,
  onSizeChange,
  onMaximize,
  onOpenExternal,
  zIndex = 1000,
}) => {
  const [showControls, setShowControls] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const animatedPosition = useRef(new Animated.ValueXY(position)).current;
  const animatedSize = useRef(new Animated.ValueXY(size)).current;
  const controlsOpacity = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(1)).current;
  
  // Auto-hide controls
  const controlsTimer = useRef<NodeJS.Timeout>();
  
  const showControlsWithTimeout = useCallback(() => {
    setShowControls(true);
    Animated.timing(controlsOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    
    // Clear existing timer
    if (controlsTimer.current) {
      clearTimeout(controlsTimer.current);
    }
    
    // Hide controls after 3 seconds
    controlsTimer.current = setTimeout(() => {
      setShowControls(false);
      Animated.timing(controlsOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }, 3000);
  }, [controlsOpacity]);

  // Snap to edges
  const snapToEdges = useCallback((newPosition: PiPPosition) => {
    const { x, y } = newPosition;
    const { width, height } = size;
    
    let snappedX = x;
    let snappedY = y;
    
    // Snap to edges
    if (x < EDGE_SNAP_THRESHOLD) {
      snappedX = 0;
    } else if (x + width > SCREEN_WIDTH - EDGE_SNAP_THRESHOLD) {
      snappedX = SCREEN_WIDTH - width;
    }
    
    if (y < EDGE_SNAP_THRESHOLD) {
      snappedY = 0;
    } else if (y + height > SCREEN_HEIGHT - EDGE_SNAP_THRESHOLD) {
      snappedY = SCREEN_HEIGHT - height;
    }
    
    return { x: snappedX, y: snappedY };
  }, [size]);

  // Pan responder for dragging
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
    },
    onPanResponderGrant: (evt, gestureState) => {
      setIsDragging(true);
      setDragOffset({
        x: gestureState.x0 - position.x,
        y: gestureState.y0 - position.y,
      });
      
      // Show controls when dragging starts
      showControlsWithTimeout();
      
      // Scale down slightly when dragging
      Animated.spring(scaleValue, {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
    },
    onPanResponderMove: (evt, gestureState) => {
      const newPosition = {
        x: Math.max(0, Math.min(SCREEN_WIDTH - size.width, gestureState.moveX - dragOffset.x)),
        y: Math.max(0, Math.min(SCREEN_HEIGHT - size.height, gestureState.moveY - dragOffset.y)),
      };
      
      animatedPosition.setValue(newPosition);
    },
    onPanResponderRelease: (evt, gestureState) => {
      setIsDragging(false);
      
      const newPosition = {
        x: Math.max(0, Math.min(SCREEN_WIDTH - size.width, gestureState.moveX - dragOffset.x)),
        y: Math.max(0, Math.min(SCREEN_HEIGHT - size.height, gestureState.moveY - dragOffset.y)),
      };
      
      const snappedPosition = snapToEdges(newPosition);
      
      // Animate to final position
      Animated.spring(animatedPosition, {
        toValue: snappedPosition,
        useNativeDriver: false,
      }).start();
      
      // Scale back to normal
      Animated.spring(scaleValue, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
      
      onPositionChange(snappedPosition);
    },
  });

  // Resize handler
  const handleResize = useCallback((direction: 'grow' | 'shrink') => {
    const currentSize = size;
    const factor = direction === 'grow' ? 1.2 : 0.8;
    
    const newWidth = Math.max(MIN_PIP_SIZE.width, Math.min(MAX_PIP_SIZE.width, currentSize.width * factor));
    const newHeight = Math.max(MIN_PIP_SIZE.height, Math.min(MAX_PIP_SIZE.height, currentSize.height * factor));
    
    const newSize = { width: newWidth, height: newHeight };
    
    // Adjust position if needed to keep PiP in bounds
    const adjustedPosition = {
      x: Math.max(0, Math.min(SCREEN_WIDTH - newSize.width, position.x)),
      y: Math.max(0, Math.min(SCREEN_HEIGHT - newSize.height, position.y)),
    };
    
    Animated.spring(animatedSize, {
      toValue: newSize,
      useNativeDriver: false,
    }).start();
    
    if (adjustedPosition.x !== position.x || adjustedPosition.y !== position.y) {
      Animated.spring(animatedPosition, {
        toValue: adjustedPosition,
        useNativeDriver: false,
      }).start();
      onPositionChange(adjustedPosition);
    }
    
    onSizeChange(newSize);
  }, [size, position, onSizeChange, onPositionChange]);

  // Update animated values when props change
  useEffect(() => {
    animatedPosition.setValue(position);
  }, [position]);

  useEffect(() => {
    animatedSize.setValue(size);
  }, [size]);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (controlsTimer.current) {
        clearTimeout(controlsTimer.current);
      }
    };
  }, []);

  if (!isVisible) return null;

  return (
    <Animated.View
      style={[
        styles.pipContainer,
        {
          left: animatedPosition.x,
          top: animatedPosition.y,
          width: animatedSize.x,
          height: animatedSize.y,
          zIndex,
          transform: [{ scale: scaleValue }],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <MotiView
        from={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        style={styles.pipContent}
      >
        {/* Background Shadow */}
        <LinearGradient
          colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.4)']}
          style={styles.shadowGradient}
        />

        {/* Player Container */}
        <View style={styles.playerContainer}>
          {!isMinimized && (
            <WorkingTwitchPlayer
              stream={stream}
              width={size.width}
              height={size.height}
              isActive={true}
              isMuted={isMuted}
              onPress={showControlsWithTimeout}
              showControls={false}
            />
          )}
          
          {isMinimized && (
            <View style={styles.minimizedContent}>
              <LinearGradient
                colors={[ModernTheme.colors.primary[600], ModernTheme.colors.primary[500]]}
                style={styles.minimizedGradient}
              >
                <Text style={styles.minimizedText} numberOfLines={1}>
                  {stream.user_name}
                </Text>
                <View style={styles.minimizedInfo}>
                  <Eye size={12} color={ModernTheme.colors.text.primary} />
                  <Text style={styles.minimizedViewers}>
                    {stream.viewer_count?.toLocaleString() || '0'}
                  </Text>
                </View>
              </LinearGradient>
            </View>
          )}
        </View>

        {/* Controls Overlay */}
        {showControls && (
          <Animated.View
            style={[
              styles.controlsOverlay,
              { opacity: controlsOpacity },
            ]}
          >
            <LinearGradient
              colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.6)']}
              style={styles.controlsGradient}
            >
              {/* Top Controls */}
              <View style={styles.topControls}>
                <View style={styles.streamInfo}>
                  <Text style={styles.streamName} numberOfLines={1}>
                    {stream.user_name}
                  </Text>
                  <Text style={styles.streamGame} numberOfLines={1}>
                    {stream.game_name}
                  </Text>
                </View>
                
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={onClose}
                >
                  <X size={16} color={ModernTheme.colors.text.primary} />
                </TouchableOpacity>
              </View>

              {/* Bottom Controls */}
              <View style={styles.bottomControls}>
                <View style={styles.leftControls}>
                  <TouchableOpacity
                    style={styles.controlButton}
                    onPress={onToggleMute}
                  >
                    {isMuted ? (
                      <VolumeX size={16} color={ModernTheme.colors.text.primary} />
                    ) : (
                      <Volume2 size={16} color={ModernTheme.colors.text.primary} />
                    )}
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.controlButton}
                    onPress={onOpenExternal}
                  >
                    <ExternalLink size={16} color={ModernTheme.colors.text.primary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.rightControls}>
                  <TouchableOpacity
                    style={styles.controlButton}
                    onPress={() => handleResize('shrink')}
                  >
                    <Minimize2 size={16} color={ModernTheme.colors.text.primary} />
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.controlButton}
                    onPress={() => handleResize('grow')}
                  >
                    <Maximize2 size={16} color={ModernTheme.colors.text.primary} />
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.controlButton}
                    onPress={onToggleMinimize}
                  >
                    {isMinimized ? (
                      <Maximize2 size={16} color={ModernTheme.colors.text.primary} />
                    ) : (
                      <Minimize2 size={16} color={ModernTheme.colors.text.primary} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Dragging Indicator */}
        {isDragging && (
          <View style={styles.dragIndicator}>
            <Move size={20} color={ModernTheme.colors.text.primary} />
          </View>
        )}
      </MotiView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  pipContainer: {
    position: 'absolute',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  pipContent: {
    flex: 1,
    position: 'relative',
  },
  shadowGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
  },
  playerContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  minimizedContent: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  minimizedGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  minimizedText: {
    color: ModernTheme.colors.text.primary,
    fontSize: 12,
    fontWeight: ModernTheme.typography.weights.semibold,
    textAlign: 'center',
    marginBottom: 4,
  },
  minimizedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  minimizedViewers: {
    color: ModernTheme.colors.text.primary,
    fontSize: 10,
    fontWeight: ModernTheme.typography.weights.medium,
  },
  controlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
  },
  controlsGradient: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 8,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  streamInfo: {
    flex: 1,
    marginRight: 8,
  },
  streamName: {
    color: ModernTheme.colors.text.primary,
    fontSize: 12,
    fontWeight: ModernTheme.typography.weights.semibold,
  },
  streamGame: {
    color: ModernTheme.colors.text.secondary,
    fontSize: 10,
    fontWeight: ModernTheme.typography.weights.medium,
    marginTop: 2,
  },
  closeButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
    borderRadius: 16,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftControls: {
    flexDirection: 'row',
    gap: 4,
  },
  rightControls: {
    flexDirection: 'row',
    gap: 4,
  },
  controlButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 16,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  dragIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -10 }, { translateY: -10 }],
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default EnhancedPictureInPicture;