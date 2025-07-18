import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { RefreshCw, AlertTriangle, X } from 'lucide-react-native';
import { ErrorBoundary } from './ErrorBoundary';
import { HapticFeedback } from '@/utils/haptics';

interface StreamErrorBoundaryProps {
  children: ReactNode;
  streamId?: string;
  streamName?: string;
  onStreamRemove?: (streamId: string) => void;
  onStreamReload?: (streamId: string) => void;
  fallback?: ReactNode;
}

interface StreamErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  retryCount: number;
  isRetrying: boolean;
}

export class StreamErrorBoundary extends Component<StreamErrorBoundaryProps, StreamErrorBoundaryState> {
  private maxRetries = 3;
  private retryDelay = 2000;

  constructor(props: StreamErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0,
      isRetrying: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<StreamErrorBoundaryState> {
    return {
      hasError: true,
      error,
      isRetrying: false,
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Stream Error:', error);
    console.error('Stream Error Info:', errorInfo);
    
    // Log specific stream error
    if (this.props.streamId) {
      console.error(`Stream ${this.props.streamId} (${this.props.streamName}) failed:`, error.message);
    }
  }

  handleRetry = async () => {
    if (this.state.retryCount >= this.maxRetries) {
      Alert.alert(
        'Stream Error',
        `Stream ${this.props.streamName || 'Unknown'} has failed ${this.maxRetries} times. Would you like to remove it?`,
        [
          { text: 'Keep', style: 'cancel' },
          { 
            text: 'Remove Stream', 
            style: 'destructive',
            onPress: () => {
              if (this.props.streamId && this.props.onStreamRemove) {
                this.props.onStreamRemove(this.props.streamId);
              }
            }
          },
        ]
      );
      return;
    }

    this.setState({ isRetrying: true });
    HapticFeedback.medium();

    try {
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, this.retryDelay));

      // Attempt to reload the stream
      if (this.props.streamId && this.props.onStreamReload) {
        this.props.onStreamReload(this.props.streamId);
      }

      this.setState(prevState => ({
        hasError: false,
        error: undefined,
        retryCount: prevState.retryCount + 1,
        isRetrying: false,
      }));

      HapticFeedback.success();
    } catch (error) {
      console.error('Stream retry failed:', error);
      this.setState({ isRetrying: false });
      HapticFeedback.error();
    }
  };

  handleRemove = () => {
    HapticFeedback.warning();
    
    if (this.props.streamId && this.props.onStreamRemove) {
      this.props.onStreamRemove(this.props.streamId);
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const canRetry = this.state.retryCount < this.maxRetries;

      return (
        <View style={styles.errorContainer}>
          <View style={styles.errorContent}>
            <AlertTriangle size={24} color="#ef4444" />
            <Text style={styles.errorTitle}>Stream Error</Text>
            <Text style={styles.errorMessage}>
              {this.props.streamName || 'Stream'} failed to load
            </Text>
            
            {this.state.isRetrying && (
              <View style={styles.retryingContainer}>
                <RefreshCw size={16} color="#8b5cf6" />
                <Text style={styles.retryingText}>Retrying...</Text>
              </View>
            )}

            <View style={styles.buttonContainer}>
              {canRetry && !this.state.isRetrying && (
                <TouchableOpacity
                  style={[styles.button, styles.retryButton]}
                  onPress={this.handleRetry}
                >
                  <RefreshCw size={16} color="#fff" />
                  <Text style={styles.buttonText}>
                    Retry ({this.state.retryCount}/{this.maxRetries})
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.button, styles.removeButton]}
                onPress={this.handleRemove}
              >
                <X size={16} color="#fff" />
                <Text style={styles.buttonText}>Remove</Text>
              </TouchableOpacity>
            </View>

            {!canRetry && (
              <Text style={styles.maxRetriesText}>
                Maximum retries reached. Consider removing this stream.
              </Text>
            )}
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
  },
  errorContent: {
    alignItems: 'center',
    maxWidth: 300,
  },
  errorTitle: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  errorMessage: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  retryingText: {
    color: '#8b5cf6',
    fontSize: 14,
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  retryButton: {
    backgroundColor: '#8b5cf6',
  },
  removeButton: {
    backgroundColor: '#ef4444',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  maxRetriesText: {
    color: '#fbbf24',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
  },
});

// Wrapper component for easier usage
interface StreamErrorWrapperProps {
  children: ReactNode;
  streamId?: string;
  streamName?: string;
  onStreamRemove?: (streamId: string) => void;
  onStreamReload?: (streamId: string) => void;
}

export const StreamErrorWrapper: React.FC<StreamErrorWrapperProps> = ({
  children,
  streamId,
  streamName,
  onStreamRemove,
  onStreamReload,
}) => (
  <ErrorBoundary
    context={`Stream-${streamId || 'unknown'}`}
    enableRecovery={true}
    maxRetries={3}
    recoveryStrategies={['reload', 'clearState']}
    fallback={
      <StreamErrorBoundary
        streamId={streamId}
        streamName={streamName}
        onStreamRemove={onStreamRemove}
        onStreamReload={onStreamReload}
      >
        {children}
      </StreamErrorBoundary>
    }
  >
    <StreamErrorBoundary
      streamId={streamId}
      streamName={streamName}
      onStreamRemove={onStreamRemove}
      onStreamReload={onStreamReload}
    >
      {children}
    </StreamErrorBoundary>
  </ErrorBoundary>
);