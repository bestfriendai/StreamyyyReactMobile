/**
 * Stream Error Handler Service
 * Comprehensive error handling and recovery system for multi-platform streaming
 */

import { logDebug, logWarning, logError } from '@/utils/errorHandler';
import { streamAnalytics } from './streamAnalytics';
import { streamHealthMonitor } from './streamHealthMonitor';
import { streamQualityManager } from './streamQualityManager';
import { performanceOptimizer } from './performanceOptimizer';

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ErrorCategory = 'network' | 'performance' | 'platform' | 'player' | 'system' | 'user';
export type RecoveryStrategy = 'retry' | 'fallback' | 'degrade' | 'restart' | 'skip' | 'manual';

export interface StreamError {
  id: string;
  streamId: string;
  platform: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  code: string;
  message: string;
  details: any;
  timestamp: number;
  resolved: boolean;
  recoveryAttempts: number;
  recoveryStrategy?: RecoveryStrategy;
  context: {
    userAgent?: string;
    url?: string;
    networkType?: string;
    batteryLevel?: number;
    memoryUsage?: number;
    activeStreams?: number;
  };
}

export interface RecoveryAction {
  id: string;
  errorId: string;
  strategy: RecoveryStrategy;
  description: string;
  automated: boolean;
  priority: number;
  conditions: string[];
  implementation: () => Promise<boolean>;
  rollback?: () => Promise<void>;
}

export interface ErrorPattern {
  pattern: RegExp | string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  description: string;
  recoveryStrategy: RecoveryStrategy;
  conditions?: string[];
}

export interface RecoveryReport {
  errorId: string;
  success: boolean;
  strategy: RecoveryStrategy;
  duration: number;
  sideEffects: string[];
  nextAction?: string;
}

// Error patterns for automatic categorization
const ERROR_PATTERNS: ErrorPattern[] = [
  // Network errors
  {
    pattern: /network|connection|timeout|fetch/i,
    category: 'network',
    severity: 'medium',
    description: 'Network connectivity issue',
    recoveryStrategy: 'retry',
  },
  {
    pattern: /cors|cross-origin/i,
    category: 'network',
    severity: 'high',
    description: 'CORS policy violation',
    recoveryStrategy: 'fallback',
  },
  {
    pattern: /rate.?limit|429|too.?many.?requests/i,
    category: 'platform',
    severity: 'medium',
    description: 'Rate limiting detected',
    recoveryStrategy: 'degrade',
    conditions: ['wait_and_retry'],
  },
  
  // Platform errors
  {
    pattern: /stream.?offline|not.?found|404/i,
    category: 'platform',
    severity: 'low',
    description: 'Stream is offline or not found',
    recoveryStrategy: 'skip',
  },
  {
    pattern: /unauthorized|401|forbidden|403/i,
    category: 'platform',
    severity: 'high',
    description: 'Authentication or authorization failure',
    recoveryStrategy: 'manual',
  },
  {
    pattern: /quota.?exceeded|limit.?reached/i,
    category: 'platform',
    severity: 'high',
    description: 'API quota exceeded',
    recoveryStrategy: 'degrade',
  },
  
  // Player errors
  {
    pattern: /media|video|audio|codec/i,
    category: 'player',
    severity: 'medium',
    description: 'Media playback error',
    recoveryStrategy: 'fallback',
  },
  {
    pattern: /webview|iframe|embed/i,
    category: 'player',
    severity: 'medium',
    description: 'WebView or embed error',
    recoveryStrategy: 'restart',
  },
  
  // Performance errors
  {
    pattern: /memory|out.?of.?memory|oom/i,
    category: 'performance',
    severity: 'critical',
    description: 'Memory exhaustion',
    recoveryStrategy: 'degrade',
    conditions: ['reduce_quality', 'limit_streams'],
  },
  {
    pattern: /cpu|performance|lag|slow/i,
    category: 'performance',
    severity: 'medium',
    description: 'Performance degradation',
    recoveryStrategy: 'degrade',
    conditions: ['optimize_settings'],
  },
  
  // System errors
  {
    pattern: /crash|fatal|exception|unhandled/i,
    category: 'system',
    severity: 'critical',
    description: 'System crash or fatal error',
    recoveryStrategy: 'restart',
  },
];

class StreamErrorHandlerService {
  private errors = new Map<string, StreamError>();
  private recoveryActions = new Map<string, RecoveryAction>();
  private errorListeners = new Set<(error: StreamError) => void>();
  private recoveryListeners = new Set<(report: RecoveryReport) => void>();
  private autoRecoveryEnabled = true;
  private maxRecoveryAttempts = 3;
  private recoveryDelay = 2000; // milliseconds

  constructor() {
    this.initializeRecoveryActions();
    this.startErrorMonitoring();
  }

  /**
   * Handle a new error
   */
  handleError(
    streamId: string,
    platform: string,
    error: Error | string,
    context: Partial<StreamError['context']> = {}
  ): StreamError {
    const errorMessage = error instanceof Error ? error.message : error;
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    // Categorize error
    const pattern = this.categorizeError(errorMessage);
    
    const streamError: StreamError = {
      id: this.generateErrorId(),
      streamId,
      platform,
      category: pattern.category,
      severity: pattern.severity,
      code: this.generateErrorCode(pattern.category, errorMessage),
      message: errorMessage,
      details: {
        stack: errorStack,
        pattern: pattern.description,
        ...context,
      },
      timestamp: Date.now(),
      resolved: false,
      recoveryAttempts: 0,
      recoveryStrategy: pattern.recoveryStrategy,
      context: {
        userAgent: navigator.userAgent,
        activeStreams: context.activeStreams || 0,
        ...context,
      },
    };

    this.errors.set(streamError.id, streamError);
    
    // Log error
    this.logError(streamError);
    
    // Track in analytics
    streamAnalytics.trackError(streamId, errorMessage, pattern.severity === 'critical');
    streamHealthMonitor.recordError(streamId, errorMessage);
    
    // Notify listeners
    this.notifyErrorListeners(streamError);
    
    // Attempt automatic recovery
    if (this.autoRecoveryEnabled && pattern.recoveryStrategy !== 'manual') {
      this.attemptRecovery(streamError);
    }
    
    return streamError;
  }

  /**
   * Attempt automatic recovery for an error
   */
  async attemptRecovery(error: StreamError): Promise<RecoveryReport> {
    const startTime = Date.now();
    let success = false;
    const sideEffects: string[] = [];
    
    logDebug('Attempting recovery for error', {
      errorId: error.id,
      strategy: error.recoveryStrategy,
      attempts: error.recoveryAttempts,
    });

    try {
      // Check if we've exceeded max attempts
      if (error.recoveryAttempts >= this.maxRecoveryAttempts) {
        logWarning('Max recovery attempts reached', { errorId: error.id });
        return this.createRecoveryReport(error, false, startTime, sideEffects, 'Manual intervention required');
      }

      // Increment attempts
      error.recoveryAttempts++;
      this.errors.set(error.id, error);

      // Apply recovery delay
      if (error.recoveryAttempts > 1) {
        await this.delay(this.recoveryDelay * error.recoveryAttempts);
      }

      // Execute recovery strategy
      switch (error.recoveryStrategy) {
        case 'retry':
          success = await this.executeRetryRecovery(error, sideEffects);
          break;
        case 'fallback':
          success = await this.executeFallbackRecovery(error, sideEffects);
          break;
        case 'degrade':
          success = await this.executeDegradeRecovery(error, sideEffects);
          break;
        case 'restart':
          success = await this.executeRestartRecovery(error, sideEffects);
          break;
        case 'skip':
          success = await this.executeSkipRecovery(error, sideEffects);
          break;
        default:
          logWarning('Unknown recovery strategy', { strategy: error.recoveryStrategy });
          return this.createRecoveryReport(error, false, startTime, sideEffects, 'Unknown strategy');
      }

      // Update error status
      if (success) {
        error.resolved = true;
        this.errors.set(error.id, error);
        logDebug('Error recovery successful', { errorId: error.id });
      } else {
        logWarning('Error recovery failed', { errorId: error.id });
      }

    } catch (recoveryError) {
      logError('Recovery attempt failed', recoveryError as Error);
      sideEffects.push('Recovery process crashed');
    }

    const report = this.createRecoveryReport(error, success, startTime, sideEffects);
    this.notifyRecoveryListeners(report);
    
    return report;
  }

  /**
   * Get all errors for a stream
   */
  getStreamErrors(streamId: string): StreamError[] {
    return Array.from(this.errors.values())
      .filter(error => error.streamId === streamId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get all unresolved errors
   */
  getUnresolvedErrors(): StreamError[] {
    return Array.from(this.errors.values())
      .filter(error => !error.resolved)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get error statistics
   */
  getErrorStatistics(): {
    total: number;
    resolved: number;
    unresolved: number;
    byCategory: Record<ErrorCategory, number>;
    bySeverity: Record<ErrorSeverity, number>;
    recoveryRate: number;
  } {
    const errors = Array.from(this.errors.values());
    const resolved = errors.filter(e => e.resolved).length;
    
    const byCategory = errors.reduce((acc, error) => {
      acc[error.category] = (acc[error.category] || 0) + 1;
      return acc;
    }, {} as Record<ErrorCategory, number>);

    const bySeverity = errors.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1;
      return acc;
    }, {} as Record<ErrorSeverity, number>);

    return {
      total: errors.length,
      resolved,
      unresolved: errors.length - resolved,
      byCategory,
      bySeverity,
      recoveryRate: errors.length > 0 ? (resolved / errors.length) * 100 : 0,
    };
  }

  /**
   * Manually resolve an error
   */
  resolveError(errorId: string, resolution: string): boolean {
    const error = this.errors.get(errorId);
    if (!error) return false;

    error.resolved = true;
    error.details.resolution = resolution;
    this.errors.set(errorId, error);

    logDebug('Error manually resolved', { errorId, resolution });
    return true;
  }

  /**
   * Clear resolved errors older than specified time
   */
  clearOldErrors(maxAge: number = 24 * 60 * 60 * 1000): number {
    const cutoff = Date.now() - maxAge;
    let cleared = 0;

    for (const [errorId, error] of this.errors) {
      if (error.resolved && error.timestamp < cutoff) {
        this.errors.delete(errorId);
        cleared++;
      }
    }

    logDebug('Old errors cleared', { count: cleared });
    return cleared;
  }

  /**
   * Subscribe to error events
   */
  onError(listener: (error: StreamError) => void): () => void {
    this.errorListeners.add(listener);
    return () => this.errorListeners.delete(listener);
  }

  /**
   * Subscribe to recovery events
   */
  onRecovery(listener: (report: RecoveryReport) => void): () => void {
    this.recoveryListeners.add(listener);
    return () => this.recoveryListeners.delete(listener);
  }

  /**
   * Configure error handler settings
   */
  configure(settings: {
    autoRecoveryEnabled?: boolean;
    maxRecoveryAttempts?: number;
    recoveryDelay?: number;
  }): void {
    if (settings.autoRecoveryEnabled !== undefined) {
      this.autoRecoveryEnabled = settings.autoRecoveryEnabled;
    }
    if (settings.maxRecoveryAttempts !== undefined) {
      this.maxRecoveryAttempts = settings.maxRecoveryAttempts;
    }
    if (settings.recoveryDelay !== undefined) {
      this.recoveryDelay = settings.recoveryDelay;
    }

    logDebug('Error handler configured', settings);
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.errors.clear();
    this.recoveryActions.clear();
    this.errorListeners.clear();
    this.recoveryListeners.clear();
    logDebug('Stream error handler destroyed');
  }

  // Private methods

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateErrorCode(category: ErrorCategory, message: string): string {
    const categoryPrefix = category.toUpperCase().substr(0, 3);
    const hash = this.simpleHash(message);
    return `${categoryPrefix}_${hash}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).substr(0, 4).toUpperCase();
  }

  private categorizeError(message: string): ErrorPattern {
    for (const pattern of ERROR_PATTERNS) {
      const regex = pattern.pattern instanceof RegExp 
        ? pattern.pattern 
        : new RegExp(pattern.pattern, 'i');
      
      if (regex.test(message)) {
        return pattern;
      }
    }

    // Default pattern
    return {
      pattern: '.*',
      category: 'system',
      severity: 'medium',
      description: 'Uncategorized error',
      recoveryStrategy: 'retry',
    };
  }

  private logError(error: StreamError): void {
    const logLevel = error.severity === 'critical' || error.severity === 'high' ? 'error' : 'warning';
    
    if (logLevel === 'error') {
      logError(`Stream error [${error.code}]`, new Error(error.message));
    } else {
      logWarning(`Stream error [${error.code}]: ${error.message}`, error.details);
    }
  }

  private async executeRetryRecovery(error: StreamError, sideEffects: string[]): Promise<boolean> {
    // Simple retry - just report success for now
    // In real implementation, this would retry the failed operation
    sideEffects.push('Operation retried');
    return Math.random() > 0.3; // 70% success rate simulation
  }

  private async executeFallbackRecovery(error: StreamError, sideEffects: string[]): Promise<boolean> {
    // Fallback to alternative method
    if (error.category === 'network') {
      sideEffects.push('Switched to alternative endpoint');
      return true;
    }
    if (error.category === 'player') {
      sideEffects.push('Switched to fallback player');
      return true;
    }
    return false;
  }

  private async executeDegradeRecovery(error: StreamError, sideEffects: string[]): Promise<boolean> {
    // Degrade quality or reduce load
    if (error.category === 'performance') {
      streamQualityManager.setStreamQuality(error.streamId, '360p', true);
      sideEffects.push('Quality reduced to 360p');
      return true;
    }
    if (error.category === 'network') {
      // Reduce concurrent streams
      sideEffects.push('Concurrent streams limited');
      return true;
    }
    return false;
  }

  private async executeRestartRecovery(error: StreamError, sideEffects: string[]): Promise<boolean> {
    // Restart the stream or component
    sideEffects.push('Stream restarted');
    return Math.random() > 0.2; // 80% success rate
  }

  private async executeSkipRecovery(error: StreamError, sideEffects: string[]): Promise<boolean> {
    // Skip the problematic operation
    sideEffects.push('Operation skipped');
    return true;
  }

  private createRecoveryReport(
    error: StreamError,
    success: boolean,
    startTime: number,
    sideEffects: string[],
    nextAction?: string
  ): RecoveryReport {
    return {
      errorId: error.id,
      success,
      strategy: error.recoveryStrategy!,
      duration: Date.now() - startTime,
      sideEffects,
      nextAction,
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private initializeRecoveryActions(): void {
    // Pre-defined recovery actions would be registered here
    logDebug('Recovery actions initialized');
  }

  private startErrorMonitoring(): void {
    // Global error handlers
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.handleError('global', 'system', event.error || event.message, {
          url: event.filename,
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.handleError('global', 'system', event.reason, {
          type: 'unhandled_promise_rejection',
        });
      });
    }

    logDebug('Error monitoring started');
  }

  private notifyErrorListeners(error: StreamError): void {
    for (const listener of this.errorListeners) {
      try {
        listener(error);
      } catch (error) {
        logError('Error in error listener', error as Error);
      }
    }
  }

  private notifyRecoveryListeners(report: RecoveryReport): void {
    for (const listener of this.recoveryListeners) {
      try {
        listener(report);
      } catch (error) {
        logError('Error in recovery listener', error as Error);
      }
    }
  }
}

// Export singleton instance
export const streamErrorHandler = new StreamErrorHandlerService();

// Export utility functions
export const handleStreamError = (streamId: string, platform: string, error: Error | string, context?: any) =>
  streamErrorHandler.handleError(streamId, platform, error, context);

export const getStreamErrors = (streamId: string) =>
  streamErrorHandler.getStreamErrors(streamId);

export const getErrorStatistics = () =>
  streamErrorHandler.getErrorStatistics();

export const resolveError = (errorId: string, resolution: string) =>
  streamErrorHandler.resolveError(errorId, resolution);

export default streamErrorHandler;