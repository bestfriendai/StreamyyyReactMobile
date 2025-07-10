import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { logError, logWarning, logDebug, withSyncErrorHandling } from '@/utils/errorHandler';
import { ModernTheme } from '@/theme/modernTheme';

export const ErrorTestComponent: React.FC = () => {
  const [errorCount, setErrorCount] = useState(0);

  const triggerError = () => {
    withSyncErrorHandling(() => {
      logDebug('About to trigger an intentional error for testing');
      throw new Error(`Test error #${errorCount + 1}: This is an intentional error for testing console logging`);
    }, { component: 'ErrorTestComponent', action: 'triggerError' });
    setErrorCount(prev => prev + 1);
  };

  const triggerWarning = () => {
    logWarning('This is a test warning message', {
      component: 'ErrorTestComponent',
      action: 'triggerWarning',
      additionalData: { warningCount: errorCount }
    });
  };

  const triggerDebugLog = () => {
    logDebug('This is a test debug message', {
      timestamp: new Date().toISOString(),
      userAction: 'debug button pressed',
      debugCount: errorCount
    });
  };

  const triggerAsyncError = async () => {
    try {
      // Simulate an async operation that fails
      await new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Async operation failed: Network timeout'));
        }, 1000);
      });
    } catch (error) {
      logError(error as Error, {
        component: 'ErrorTestComponent',
        action: 'triggerAsyncError',
        additionalData: { asyncErrorCount: errorCount }
      });
    }
    setErrorCount(prev => prev + 1);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Error Testing Console</Text>
      <Text style={styles.subtitle}>Test enhanced error logging and debugging</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.errorButton} onPress={triggerError}>
          <Text style={styles.buttonText}>Trigger Error</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.warningButton} onPress={triggerWarning}>
          <Text style={styles.buttonText}>Trigger Warning</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.debugButton} onPress={triggerDebugLog}>
          <Text style={styles.buttonText}>Debug Log</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.asyncButton} onPress={triggerAsyncError}>
          <Text style={styles.buttonText}>Async Error</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.counter}>Tests triggered: {errorCount}</Text>
      <Text style={styles.instruction}>Check the console for detailed error logs</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: ModernTheme.spacing.lg,
    backgroundColor: ModernTheme.colors.background.secondary,
    borderRadius: ModernTheme.borderRadius.lg,
    margin: ModernTheme.spacing.md,
  },
  title: {
    fontSize: ModernTheme.typography.sizes.lg,
    fontWeight: ModernTheme.typography.weights.bold,
    color: ModernTheme.colors.text.primary,
    textAlign: 'center',
    marginBottom: ModernTheme.spacing.sm,
  },
  subtitle: {
    fontSize: ModernTheme.typography.sizes.sm,
    color: ModernTheme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: ModernTheme.spacing.lg,
  },
  buttonContainer: {
    gap: ModernTheme.spacing.md,
  },
  errorButton: {
    backgroundColor: '#ff4444',
    padding: ModernTheme.spacing.md,
    borderRadius: ModernTheme.borderRadius.md,
    alignItems: 'center',
  },
  warningButton: {
    backgroundColor: '#ffaa00',
    padding: ModernTheme.spacing.md,
    borderRadius: ModernTheme.borderRadius.md,
    alignItems: 'center',
  },
  debugButton: {
    backgroundColor: '#00aaff',
    padding: ModernTheme.spacing.md,
    borderRadius: ModernTheme.borderRadius.md,
    alignItems: 'center',
  },
  asyncButton: {
    backgroundColor: '#aa00ff',
    padding: ModernTheme.spacing.md,
    borderRadius: ModernTheme.borderRadius.md,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: ModernTheme.typography.weights.semibold,
    fontSize: ModernTheme.typography.sizes.md,
  },
  counter: {
    fontSize: ModernTheme.typography.sizes.md,
    color: ModernTheme.colors.text.primary,
    textAlign: 'center',
    marginTop: ModernTheme.spacing.lg,
  },
  instruction: {
    fontSize: ModernTheme.typography.sizes.sm,
    color: ModernTheme.colors.text.secondary,
    textAlign: 'center',
    marginTop: ModernTheme.spacing.sm,
    fontStyle: 'italic',
  },
});