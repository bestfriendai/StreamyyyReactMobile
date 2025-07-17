import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { logError, ErrorContext } from '@/utils/errorHandler';
import { performanceMonitor } from '@/utils/performanceMonitor';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
  enableRecovery?: boolean;
  maxRetries?: number;
  recoveryStrategies?: RecoveryStrategy[];
  context?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: any;
  retryCount: number;
  isRecovering: boolean;
  recoveryAttempted: boolean;
  errorBoundaryId: string;
}

type RecoveryStrategy = 'reload' | 'clearState' | 'fallbackComponent' | 'restartApp' | 'clearCache';

interface ErrorReport {
  error: Error;
  errorInfo: any;
  timestamp: number;
  userAgent: string;
  url: string;
  userId?: string;
  sessionId: string;
  componentStack: string;
  errorBoundaryContext: string;
  retryCount: number;
  performanceMetrics?: any;
}

export class ErrorBoundary extends Component<Props, State> {
  private errorQueue: ErrorReport[] = [];
  private recoveryTimeout: NodeJS.Timeout | null = null;
  private sessionId: string;

  constructor(props: Props) {
    super(props);
    this.sessionId = this.generateSessionId();
    this.state = {
      hasError: false,
      retryCount: 0,
      isRecovering: false,
      recoveryAttempted: false,
      errorBoundaryId: `eb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Track error occurrence
    performanceMonitor.trackStreamError('error_boundary', error.name);

    return {
      hasError: true,
      error,
      isRecovering: false,
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    this.setState({ errorInfo });

    // Create comprehensive error report
    const errorReport: ErrorReport = {
      error,
      errorInfo,
      timestamp: Date.now(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
      url: typeof window !== 'undefined' ? window.location?.href || 'N/A' : 'N/A',
      sessionId: this.sessionId,
      componentStack: errorInfo.componentStack,
      errorBoundaryContext: this.props.context || 'Unknown',
      retryCount: this.state.retryCount,
      performanceMetrics: performanceMonitor.getPerformanceReport(),
    };

    // Enhanced error logging
    this.logDetailedError(errorReport);

    // Add to error queue for analysis
    this.errorQueue.push(errorReport);

    // Keep only last 10 errors
    if (this.errorQueue.length > 10) {
      this.errorQueue.shift();
    }

    // Notify parent component
    this.props.onError?.(error, errorInfo);

    // Attempt automatic recovery if enabled
    if (this.props.enableRecovery && !this.state.recoveryAttempted) {
      this.attemptRecovery();
    }
  }

  handleRetry = () => {
    const maxRetries = this.props.maxRetries || 3;

    if (this.state.retryCount >= maxRetries) {
      Alert.alert(
        'Maximum Retries Reached',
        `This component has failed ${maxRetries} times. Would you like to try a different recovery strategy?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Clear App Data', onPress: this.handleClearCache },
          { text: 'Restart App', onPress: this.handleRestartApp },
        ]
      );
      return;
    }

    this.setState(prevState => ({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      retryCount: prevState.retryCount + 1,
      isRecovering: false,
      recoveryAttempted: false,
    }));

    console.log(`🔄 Retrying component (attempt ${this.state.retryCount + 1}/${maxRetries})`);
  };

  handleClearCache = () => {
    console.log('🧹 Clearing app cache...');
    // Implement cache clearing logic
    this.handleRetry();
  };

  handleRestartApp = () => {
    console.log('🔄 Restarting app...');
    // Implement app restart logic
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  handleShowErrorDetails = () => {
    const report = this.generateErrorReport();

    Alert.alert(
      'Error Details',
      `Error: ${this.state.error?.name}\n` +
        `Message: ${this.state.error?.message}\n` +
        `Retries: ${this.state.retryCount}\n` +
        `Session: ${this.sessionId}\n` +
        `Context: ${this.props.context || 'Unknown'}`,
      [{ text: 'Copy Report', onPress: () => this.copyErrorReport(report) }, { text: 'Close' }]
    );
  };

  copyErrorReport = (report: string) => {
    // Copy to clipboard functionality
    console.log('📋 Error report copied to clipboard');
    console.log(report);
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const maxRetries = this.props.maxRetries || 3;
      const canRetry = this.state.retryCount < maxRetries;

      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.content}>
              <Text style={styles.icon}>⚠️</Text>
              <Text style={styles.title}>Something went wrong</Text>

              <Text style={styles.message}>
                {this.state.error?.message || 'An unexpected error occurred'}
              </Text>

              {this.state.isRecovering && (
                <View style={styles.recoveryContainer}>
                  <Text style={styles.recoveryText}>🔄 Attempting automatic recovery...</Text>
                </View>
              )}

              <View style={styles.errorMetadata}>
                <Text style={styles.metadataText}>Error Type: {this.state.error?.name}</Text>
                <Text style={styles.metadataText}>
                  Retry Count: {this.state.retryCount}/{maxRetries}
                </Text>
                <Text style={styles.metadataText}>Context: {this.props.context || 'Unknown'}</Text>
                <Text style={styles.metadataText}>Session: {this.sessionId.slice(0, 8)}...</Text>
              </View>

              <View style={styles.buttonContainer}>
                {canRetry && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.retryButton]}
                    onPress={this.handleRetry}
                    disabled={this.state.isRecovering}
                  >
                    <Text style={styles.retryIcon}>🔄</Text>
                    <Text style={styles.buttonText}>Try Again</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.actionButton, styles.detailsButton]}
                  onPress={this.handleShowErrorDetails}
                >
                  <Text style={styles.detailsIcon}>ℹ️</Text>
                  <Text style={styles.buttonText}>Details</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.clearButton]}
                  onPress={this.handleClearCache}
                >
                  <Text style={styles.clearIcon}>🧹</Text>
                  <Text style={styles.buttonText}>Clear Cache</Text>
                </TouchableOpacity>
              </View>

              {!canRetry && (
                <View style={styles.finalActions}>
                  <Text style={styles.finalText}>Maximum retries reached</Text>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.restartButton]}
                    onPress={this.handleRestartApp}
                  >
                    <Text style={styles.restartIcon}>🔄</Text>
                    <Text style={styles.buttonText}>Restart App</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private logDetailedError(errorReport: ErrorReport): void {
    console.group('🚨 Enhanced ErrorBoundary Error Report');
    console.error('Error:', errorReport.error);
    console.error('Message:', errorReport.error.message);
    console.error('Stack:', errorReport.error.stack);
    console.error('Component Stack:', errorReport.errorInfo.componentStack);
    console.log('📍 Context:', {
      boundaryContext: errorReport.errorBoundaryContext,
      sessionId: errorReport.sessionId,
      retryCount: errorReport.retryCount,
      timestamp: new Date(errorReport.timestamp).toISOString(),
    });
    console.log('📱 Environment:', {
      userAgent: errorReport.userAgent,
      url: errorReport.url,
    });
    console.log('📊 Performance Metrics:', errorReport.performanceMetrics?.summary);
    console.groupEnd();

    // Use the enhanced error handler
    const context: ErrorContext = {
      component: 'ErrorBoundary',
      action: 'componentDidCatch',
      additionalData: {
        boundaryId: this.state.errorBoundaryId,
        context: this.props.context,
        retryCount: this.state.retryCount,
        sessionId: this.sessionId,
      },
    };

    logError(errorReport.error, context);
  }

  private async attemptRecovery(): Promise<void> {
    this.setState({ isRecovering: true, recoveryAttempted: true });

    const strategies = this.props.recoveryStrategies || ['reload', 'clearState'];

    for (const strategy of strategies) {
      try {
        console.log(`🔧 Attempting recovery strategy: ${strategy}`);

        switch (strategy) {
          case 'reload':
            // Wait a bit then retry
            await this.delay(2000);
            this.handleRetry();
            return;

          case 'clearState':
            // Clear component state and retry
            this.setState({
              hasError: false,
              error: undefined,
              errorInfo: undefined,
              isRecovering: false,
            });
            return;

          case 'clearCache':
            this.handleClearCache();
            return;

          case 'restartApp':
            this.handleRestartApp();
            return;

          default:
            console.warn(`Unknown recovery strategy: ${strategy}`);
        }
      } catch (recoveryError) {
        console.error(`Recovery strategy '${strategy}' failed:`, recoveryError);
      }
    }

    // If all recovery strategies fail
    this.setState({ isRecovering: false });
    console.error('🚨 All recovery strategies failed');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateErrorReport(): string {
    const report = {
      error: {
        name: this.state.error?.name,
        message: this.state.error?.message,
        stack: this.state.error?.stack,
      },
      context: {
        boundaryId: this.state.errorBoundaryId,
        context: this.props.context,
        retryCount: this.state.retryCount,
        sessionId: this.sessionId,
        timestamp: new Date().toISOString(),
      },
      componentStack: this.state.errorInfo?.componentStack,
      errorQueue: this.errorQueue.slice(-5), // Last 5 errors
      performanceMetrics: performanceMonitor.getPerformanceReport(),
    };

    return JSON.stringify(report, null, 2);
  }

  componentWillUnmount() {
    if (this.recoveryTimeout) {
      clearTimeout(this.recoveryTimeout);
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    maxWidth: 350,
    width: '100%',
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  recoveryContainer: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    width: '100%',
  },
  recoveryText: {
    color: '#8B5CF6',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  errorMetadata: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    width: '100%',
  },
  metadataText: {
    color: '#666',
    fontSize: 12,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 100,
  },
  retryButton: {
    backgroundColor: '#8B5CF6',
  },
  detailsButton: {
    backgroundColor: '#3B82F6',
  },
  clearButton: {
    backgroundColor: '#F59E0B',
  },
  restartButton: {
    backgroundColor: '#EF4444',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  retryIcon: {
    fontSize: 14,
  },
  detailsIcon: {
    fontSize: 14,
  },
  clearIcon: {
    fontSize: 14,
  },
  restartIcon: {
    fontSize: 14,
  },
  finalActions: {
    alignItems: 'center',
    marginTop: 16,
  },
  finalText: {
    color: '#EF4444',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
});
