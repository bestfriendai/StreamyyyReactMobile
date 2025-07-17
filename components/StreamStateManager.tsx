import { LinearGradient } from 'expo-linear-gradient';
import {
  AlertCircle,
  RotateCcw,
  Wifi,
  WifiOff,
  Settings,
  Info,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Signal,
  AlertTriangle,
} from 'lucide-react-native';
import { MotiView, MotiText, AnimatePresence } from 'moti';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { ModernTheme } from '@/theme/modernTheme';
import { BlurViewFallback as BlurView } from './BlurViewFallback';

export type StreamState =
  | 'idle'
  | 'loading'
  | 'buffering'
  | 'playing'
  | 'paused'
  | 'error'
  | 'offline'
  | 'reconnecting'
  | 'timeout';

export type ConnectionQuality = 'excellent' | 'good' | 'poor' | 'disconnected';

export interface StreamError {
  type: 'network' | 'timeout' | 'authentication' | 'not_found' | 'rate_limit' | 'unknown';
  message: string;
  code?: string | number;
  retryable: boolean;
  retryDelay?: number;
}

interface StreamStateManagerProps {
  state: StreamState;
  error?: StreamError;
  connectionQuality?: ConnectionQuality;
  retryCount?: number;
  maxRetries?: number;
  streamName?: string;
  platform?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  onOpenSettings?: () => void;
  showDetails?: boolean;
  loadingProgress?: number;
}

export const StreamStateManager: React.FC<StreamStateManagerProps> = ({
  state,
  error,
  connectionQuality = 'good',
  retryCount = 0,
  maxRetries = 3,
  streamName,
  platform = 'Twitch',
  onRetry,
  onDismiss,
  onOpenSettings,
  showDetails = true,
  loadingProgress = 0,
}) => {
  const [pulseAnimation] = useState(new Animated.Value(1));
  const [fadeAnimation] = useState(new Animated.Value(0));
  const [slideAnimation] = useState(new Animated.Value(50));

  useEffect(() => {
    // Fade in animation
    Animated.parallel([
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for loading states
    if (state === 'loading' || state === 'buffering' || state === 'reconnecting') {
      const pulse = () => {
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (state === 'loading' || state === 'buffering' || state === 'reconnecting') {
            pulse();
          }
        });
      };
      pulse();
    }
  }, [state, fadeAnimation, slideAnimation, pulseAnimation]);

  const getStateConfig = useCallback(() => {
    switch (state) {
      case 'loading':
        return {
          icon: <Settings size={32} color={ModernTheme.colors.primary[500]} />,
          title: 'Loading Stream',
          message: `Connecting to ${streamName || platform}...`,
          color: ModernTheme.colors.primary[500],
          showProgress: true,
          showRetry: false,
        };
      case 'buffering':
        return {
          icon: <Zap size={32} color={ModernTheme.colors.warning} />,
          title: 'Buffering',
          message: 'Buffering video content...',
          color: ModernTheme.colors.warning,
          showProgress: true,
          showRetry: false,
        };
      case 'reconnecting':
        return {
          icon: <Signal size={32} color={ModernTheme.colors.accent[500]} />,
          title: 'Reconnecting',
          message: `Attempting to reconnect (${retryCount}/${maxRetries})`,
          color: ModernTheme.colors.accent[500],
          showProgress: false,
          showRetry: true,
        };
      case 'error':
        return {
          icon: <XCircle size={32} color={ModernTheme.colors.error[500]} />,
          title: getErrorTitle(),
          message: error?.message || 'An unexpected error occurred',
          color: ModernTheme.colors.error[500],
          showProgress: false,
          showRetry: error?.retryable !== false,
        };
      case 'offline':
        return {
          icon: <WifiOff size={32} color={ModernTheme.colors.gray[500]} />,
          title: 'Stream Offline',
          message: `${streamName || 'This stream'} is currently offline`,
          color: ModernTheme.colors.gray[500],
          showProgress: false,
          showRetry: true,
        };
      case 'timeout':
        return {
          icon: <Clock size={32} color={ModernTheme.colors.error[400]} />,
          title: 'Connection Timeout',
          message: 'The stream took too long to load',
          color: ModernTheme.colors.error[400],
          showProgress: false,
          showRetry: true,
        };
      default:
        return {
          icon: <Info size={32} color={ModernTheme.colors.gray[500]} />,
          title: 'Stream Status',
          message: 'Checking stream status...',
          color: ModernTheme.colors.gray[500],
          showProgress: false,
          showRetry: false,
        };
    }
  }, [state, error, streamName, platform, retryCount, maxRetries]);

  const getErrorTitle = useCallback(() => {
    if (!error) {
      return 'Error';
    }

    switch (error.type) {
      case 'network':
        return 'Network Error';
      case 'timeout':
        return 'Connection Timeout';
      case 'authentication':
        return 'Authentication Failed';
      case 'not_found':
        return 'Stream Not Found';
      case 'rate_limit':
        return 'Rate Limited';
      default:
        return 'Stream Error';
    }
  }, [error]);

  const getConnectionQualityConfig = useCallback(() => {
    switch (connectionQuality) {
      case 'excellent':
        return {
          icon: <Wifi size={16} color={ModernTheme.colors.success[500]} />,
          text: 'Excellent',
          color: ModernTheme.colors.success[500],
        };
      case 'good':
        return {
          icon: <Wifi size={16} color={ModernTheme.colors.success[400]} />,
          text: 'Good',
          color: ModernTheme.colors.success[400],
        };
      case 'poor':
        return {
          icon: <Signal size={16} color={ModernTheme.colors.warning} />,
          text: 'Poor',
          color: ModernTheme.colors.warning,
        };
      case 'disconnected':
        return {
          icon: <WifiOff size={16} color={ModernTheme.colors.error[500]} />,
          text: 'Disconnected',
          color: ModernTheme.colors.error[500],
        };
    }
  }, [connectionQuality]);

  const handleRetry = useCallback(() => {
    if (onRetry && retryCount < maxRetries) {
      onRetry();
    }
  }, [onRetry, retryCount, maxRetries]);

  const config = getStateConfig();
  const connectionConfig = getConnectionQualityConfig();

  // Don't render anything for playing/paused states unless there's an error
  if ((state === 'playing' || state === 'paused') && !error) {
    return null;
  }

  return (
    <AnimatePresence>
      <MotiView
        from={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{
          type: 'spring',
          damping: 15,
          stiffness: 150,
        }}
        style={[StyleSheet.absoluteFill, styles.container]}
      >
        <BlurView style={StyleSheet.absoluteFill} blurType="dark" blurAmount={30} />

        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnimation,
              transform: [{ scale: pulseAnimation }, { translateY: slideAnimation }],
            },
          ]}
        >
          {/* Main content */}
          <View style={styles.mainContent}>
            {/* Icon */}
            <MotiView
              from={{ scale: 0, rotate: '0deg' }}
              animate={{ scale: 1, rotate: state === 'loading' ? '360deg' : '0deg' }}
              transition={{
                type: state === 'loading' ? 'timing' : 'spring',
                duration: state === 'loading' ? 2000 : 500,
                loop: state === 'loading',
                damping: 12,
              }}
              style={styles.iconContainer}
            >
              {config.icon}
            </MotiView>

            {/* Title */}
            <MotiText
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 200 }}
              style={[styles.title, { color: config.color }]}
            >
              {config.title}
            </MotiText>

            {/* Message */}
            <MotiText
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 300 }}
              style={styles.message}
            >
              {config.message}
            </MotiText>

            {/* Progress indicator */}
            {config.showProgress && (
              <MotiView
                from={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ delay: 400 }}
                style={styles.progressContainer}
              >
                <View style={styles.progressTrack}>
                  <Animated.View
                    style={[
                      styles.progressFill,
                      {
                        backgroundColor: config.color,
                        width: `${loadingProgress}%`,
                      },
                    ]}
                  />
                </View>
                {loadingProgress > 0 && (
                  <Text style={styles.progressText}>{Math.round(loadingProgress)}%</Text>
                )}
              </MotiView>
            )}

            {/* Connection quality indicator */}
            {showDetails && (
              <MotiView
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: 500 }}
                style={styles.connectionIndicator}
              >
                <BlurView style={styles.connectionBlur} blurType="light" blurAmount={10}>
                  <View style={styles.connectionContent}>
                    {connectionConfig.icon}
                    <Text style={[styles.connectionText, { color: connectionConfig.color }]}>
                      {connectionConfig.text} Connection
                    </Text>
                    {platform && <Text style={styles.platformText}>• {platform}</Text>}
                  </View>
                </BlurView>
              </MotiView>
            )}

            {/* Error details */}
            {error && showDetails && (
              <MotiView
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: 600 }}
                style={styles.errorDetails}
              >
                <BlurView style={styles.errorDetailsBlur} blurType="dark" blurAmount={15}>
                  <View style={styles.errorDetailsContent}>
                    <AlertTriangle size={16} color={ModernTheme.colors.warning} />
                    <View style={styles.errorDetailsText}>
                      <Text style={styles.errorCode}>Error Code: {error.code || 'UNKNOWN'}</Text>
                      <Text style={styles.errorType}>Type: {error.type.toUpperCase()}</Text>
                      {error.retryDelay && (
                        <Text style={styles.retryDelay}>Retry delay: {error.retryDelay}ms</Text>
                      )}
                    </View>
                  </View>
                </BlurView>
              </MotiView>
            )}
          </View>

          {/* Action buttons */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 700 }}
            style={styles.actions}
          >
            {config.showRetry && retryCount < maxRetries && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleRetry}
                disabled={!onRetry}
              >
                <LinearGradient
                  colors={[config.color, `${config.color}80`]}
                  style={styles.actionGradient}
                >
                  <RotateCcw size={16} color="#fff" />
                  <Text style={styles.actionText}>
                    Retry {retryCount > 0 && `(${retryCount}/${maxRetries})`}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {retryCount >= maxRetries && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={onOpenSettings}
                disabled={!onOpenSettings}
              >
                <LinearGradient
                  colors={ModernTheme.colors.gradients.secondary}
                  style={styles.actionGradient}
                >
                  <Settings size={16} color="#fff" />
                  <Text style={styles.actionText}>Settings</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {onDismiss && (
              <TouchableOpacity
                style={[styles.actionButton, styles.dismissButton]}
                onPress={onDismiss}
              >
                <View style={styles.dismissGradient}>
                  <Text style={styles.dismissText}>Dismiss</Text>
                </View>
              </TouchableOpacity>
            )}
          </MotiView>

          {/* Retry exhausted message */}
          {retryCount >= maxRetries && config.showRetry && (
            <MotiView
              from={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 800 }}
              style={styles.retryExhausted}
            >
              <AlertCircle size={16} color={ModernTheme.colors.warning} />
              <Text style={styles.retryExhaustedText}>Maximum retry attempts reached</Text>
            </MotiView>
          )}
        </Animated.View>
      </MotiView>
    </AnimatePresence>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  content: {
    alignItems: 'center',
    padding: ModernTheme.spacing.xl,
    maxWidth: 300,
  },
  mainContent: {
    alignItems: 'center',
    marginBottom: ModernTheme.spacing.lg,
  },
  iconContainer: {
    marginBottom: ModernTheme.spacing.md,
  },
  title: {
    fontSize: ModernTheme.typography.sizes.xl,
    fontWeight: ModernTheme.typography.weights.bold,
    textAlign: 'center',
    marginBottom: ModernTheme.spacing.sm,
  },
  message: {
    color: ModernTheme.colors.text.secondary,
    fontSize: ModernTheme.typography.sizes.md,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: ModernTheme.spacing.md,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: ModernTheme.spacing.md,
  },
  progressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: ModernTheme.spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    color: ModernTheme.colors.text.secondary,
    fontSize: ModernTheme.typography.sizes.sm,
    fontWeight: ModernTheme.typography.weights.medium,
  },
  connectionIndicator: {
    borderRadius: ModernTheme.borderRadius.lg,
    overflow: 'hidden',
    marginBottom: ModernTheme.spacing.sm,
  },
  connectionBlur: {
    borderRadius: ModernTheme.borderRadius.lg,
  },
  connectionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ModernTheme.spacing.md,
    paddingVertical: ModernTheme.spacing.sm,
    gap: ModernTheme.spacing.xs,
  },
  connectionText: {
    fontSize: ModernTheme.typography.sizes.sm,
    fontWeight: ModernTheme.typography.weights.semibold,
  },
  platformText: {
    color: ModernTheme.colors.text.tertiary,
    fontSize: ModernTheme.typography.sizes.sm,
  },
  errorDetails: {
    borderRadius: ModernTheme.borderRadius.lg,
    overflow: 'hidden',
    marginBottom: ModernTheme.spacing.sm,
  },
  errorDetailsBlur: {
    borderRadius: ModernTheme.borderRadius.lg,
  },
  errorDetailsContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: ModernTheme.spacing.md,
    paddingVertical: ModernTheme.spacing.sm,
    gap: ModernTheme.spacing.sm,
  },
  errorDetailsText: {
    flex: 1,
  },
  errorCode: {
    color: ModernTheme.colors.text.secondary,
    fontSize: ModernTheme.typography.sizes.xs,
    fontWeight: ModernTheme.typography.weights.medium,
    marginBottom: 2,
  },
  errorType: {
    color: ModernTheme.colors.text.tertiary,
    fontSize: ModernTheme.typography.sizes.xs,
    marginBottom: 2,
  },
  retryDelay: {
    color: ModernTheme.colors.text.tertiary,
    fontSize: ModernTheme.typography.sizes.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: ModernTheme.spacing.sm,
    marginBottom: ModernTheme.spacing.md,
  },
  actionButton: {
    borderRadius: ModernTheme.borderRadius.lg,
    overflow: 'hidden',
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ModernTheme.spacing.lg,
    paddingVertical: ModernTheme.spacing.md,
    gap: ModernTheme.spacing.sm,
  },
  actionText: {
    color: ModernTheme.colors.text.primary,
    fontSize: ModernTheme.typography.sizes.md,
    fontWeight: ModernTheme.typography.weights.semibold,
  },
  dismissButton: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  dismissGradient: {
    paddingHorizontal: ModernTheme.spacing.lg,
    paddingVertical: ModernTheme.spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dismissText: {
    color: ModernTheme.colors.text.secondary,
    fontSize: ModernTheme.typography.sizes.md,
    fontWeight: ModernTheme.typography.weights.medium,
  },
  retryExhausted: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ModernTheme.spacing.xs,
    padding: ModernTheme.spacing.sm,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: ModernTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  retryExhaustedText: {
    color: ModernTheme.colors.warning,
    fontSize: ModernTheme.typography.sizes.sm,
    fontWeight: ModernTheme.typography.weights.medium,
  },
});

export default StreamStateManager;
