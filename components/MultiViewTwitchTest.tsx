/**
 * Multi-View Twitch Embed Test Component
 * Comprehensive testing component for multi-stream functionality
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Play,
  Pause,
  AlertCircle,
  CheckCircle,
  Activity,
  Monitor,
  Wifi,
  Users,
} from 'lucide-react-native';
import { useStreamManager } from '@/hooks/useStreamManager';
import { twitchApi, TwitchStream } from '@/services/twitchApi';
import { 
  streamHealthMonitor, 
  generateHealthReport, 
  StreamPerformanceReport 
} from '@/services/streamHealthMonitor';
import { ModernTheme } from '@/theme/modernTheme';
import { logDebug, withErrorHandling } from '@/utils/errorHandler';

interface TestResult {
  testName: string;
  passed: boolean;
  message: string;
  details?: any;
}

interface TestSuiteProps {
  onTestComplete?: (results: TestResult[]) => void;
}

export const MultiViewTwitchTest: React.FC<TestSuiteProps> = ({ onTestComplete }) => {
  const { activeStreams, addStream, removeStream, clearAllStreams } = useStreamManager();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [performanceReport, setPerformanceReport] = useState<StreamPerformanceReport | null>(null);
  const [testStreams, setTestStreams] = useState<TwitchStream[]>([]);

  // Load test streams on component mount
  useEffect(() => {
    loadTestStreams();
  }, []);

  const loadTestStreams = useCallback(async () => {
    await withErrorHandling(async () => {
      const streams = await twitchApi.getTopStreams(10);
      setTestStreams(streams.data.slice(0, 6)); // Limit to 6 for testing
      logDebug('Test streams loaded', { count: streams.data.length });
    }, { component: 'MultiViewTwitchTest', action: 'loadTestStreams' });
  }, []);

  const runComprehensiveTest = useCallback(async () => {
    setIsRunning(true);
    setTestResults([]);
    
    const results: TestResult[] = [];

    try {
      // Test 1: Stream Manager Functionality
      setCurrentTest('Testing Stream Manager...');
      const streamManagerTest = await testStreamManager();
      results.push(streamManagerTest);

      // Test 2: Twitch API Integration
      setCurrentTest('Testing Twitch API...');
      const apiTest = await testTwitchAPI();
      results.push(apiTest);

      // Test 3: Multi-Stream Loading
      setCurrentTest('Testing Multi-Stream Loading...');
      const multiStreamTest = await testMultiStreamLoading();
      results.push(multiStreamTest);

      // Test 4: Performance Monitoring
      setCurrentTest('Testing Performance Monitoring...');
      const performanceTest = await testPerformanceMonitoring();
      results.push(performanceTest);

      // Test 5: Error Handling
      setCurrentTest('Testing Error Handling...');
      const errorTest = await testErrorHandling();
      results.push(errorTest);

      // Test 6: Memory Management
      setCurrentTest('Testing Memory Management...');
      const memoryTest = await testMemoryManagement();
      results.push(memoryTest);

      setTestResults(results);
      onTestComplete?.(results);

    } catch (error) {
      results.push({
        testName: 'Test Suite Execution',
        passed: false,
        message: 'Test suite failed to complete',
        details: error
      });
      setTestResults(results);
    } finally {
      setIsRunning(false);
      setCurrentTest('');
    }
  }, [testStreams, onTestComplete]);

  const testStreamManager = async (): Promise<TestResult> => {
    try {
      // Clear existing streams
      await clearAllStreams();
      
      if (testStreams.length === 0) {
        return {
          testName: 'Stream Manager',
          passed: false,
          message: 'No test streams available'
        };
      }

      // Test adding a stream
      const result = await addStream(testStreams[0]);
      
      if (!result.success) {
        return {
          testName: 'Stream Manager',
          passed: false,
          message: `Failed to add stream: ${result.message}`
        };
      }

      // Test stream limit
      let limitReached = false;
      for (let i = 1; i < testStreams.length; i++) {
        const addResult = await addStream(testStreams[i]);
        if (!addResult.success && addResult.message.includes('Maximum')) {
          limitReached = true;
          break;
        }
      }

      return {
        testName: 'Stream Manager',
        passed: true,
        message: `Successfully added streams, limit protection: ${limitReached ? 'Working' : 'Not tested'}`,
        details: { activeStreams: activeStreams.length }
      };

    } catch (error) {
      return {
        testName: 'Stream Manager',
        passed: false,
        message: 'Stream manager test failed',
        details: error
      };
    }
  };

  const testTwitchAPI = async (): Promise<TestResult> => {
    try {
      // Test API connectivity
      const streams = await twitchApi.getTopStreams(5);
      
      if (!streams.data || streams.data.length === 0) {
        return {
          testName: 'Twitch API',
          passed: false,
          message: 'No streams returned from API'
        };
      }

      // Test embed URL generation
      const testStream = streams.data[0];
      const embedUrl = twitchApi.generateEmbedUrl(testStream.user_login);
      
      const hasParentDomains = embedUrl.includes('parent=localhost') && 
                               embedUrl.includes('parent=expo.dev');

      return {
        testName: 'Twitch API',
        passed: hasParentDomains,
        message: hasParentDomains 
          ? 'API and embed URL generation working correctly'
          : 'Embed URL missing required parent domains',
        details: { 
          streamsCount: streams.data.length,
          embedUrl: embedUrl.substring(0, 100) + '...'
        }
      };

    } catch (error) {
      return {
        testName: 'Twitch API',
        passed: false,
        message: 'Twitch API test failed',
        details: error
      };
    }
  };

  const testMultiStreamLoading = async (): Promise<TestResult> => {
    try {
      // Clear and add multiple streams
      await clearAllStreams();
      
      const streamsToAdd = testStreams.slice(0, 3);
      let successCount = 0;

      for (const stream of streamsToAdd) {
        const result = await addStream(stream);
        if (result.success) {
          successCount++;
          streamHealthMonitor.initializeStream(stream);
        }
      }

      // Wait for streams to initialize
      await new Promise(resolve => setTimeout(resolve, 2000));

      return {
        testName: 'Multi-Stream Loading',
        passed: successCount === streamsToAdd.length,
        message: `${successCount}/${streamsToAdd.length} streams loaded successfully`,
        details: { 
          attempted: streamsToAdd.length,
          successful: successCount,
          activeStreams: activeStreams.length
        }
      };

    } catch (error) {
      return {
        testName: 'Multi-Stream Loading',
        passed: false,
        message: 'Multi-stream loading test failed',
        details: error
      };
    }
  };

  const testPerformanceMonitoring = async (): Promise<TestResult> => {
    try {
      // Generate performance report
      const report = generateHealthReport();
      setPerformanceReport(report);

      const hasValidReport = report && 
                           typeof report.totalStreams === 'number' &&
                           typeof report.averageLoadTime === 'number';

      return {
        testName: 'Performance Monitoring',
        passed: hasValidReport,
        message: hasValidReport 
          ? `Performance monitoring active: ${report.totalStreams} streams, ${report.averageLoadTime.toFixed(0)}ms avg load time`
          : 'Performance monitoring not functioning',
        details: report
      };

    } catch (error) {
      return {
        testName: 'Performance Monitoring',
        passed: false,
        message: 'Performance monitoring test failed',
        details: error
      };
    }
  };

  const testErrorHandling = async (): Promise<TestResult> => {
    try {
      // Test invalid stream handling
      const invalidStream: TwitchStream = {
        id: 'test-invalid',
        user_id: 'invalid',
        user_login: '', // Invalid empty username
        user_name: 'Invalid Stream',
        game_id: '',
        game_name: '',
        type: 'live',
        title: 'Test Stream',
        viewer_count: 0,
        started_at: new Date().toISOString(),
        language: 'en',
        thumbnail_url: '',
        tag_ids: [],
        is_mature: false
      };

      const result = await addStream(invalidStream);
      const handledCorrectly = !result.success;

      return {
        testName: 'Error Handling',
        passed: handledCorrectly,
        message: handledCorrectly 
          ? 'Invalid stream correctly rejected'
          : 'Invalid stream was incorrectly accepted',
        details: { result }
      };

    } catch (error) {
      return {
        testName: 'Error Handling',
        passed: true, // Error catching is working
        message: 'Error handling working - exception caught',
        details: error
      };
    }
  };

  const testMemoryManagement = async (): Promise<TestResult> => {
    try {
      const report = generateHealthReport();
      const estimatedMemory = report.totalMemoryUsage;
      const streamCount = activeStreams.length;
      
      // Check if memory estimation is reasonable (50-80MB per stream)
      const expectedMemoryRange = {
        min: streamCount * 40,
        max: streamCount * 100
      };

      const memoryInRange = estimatedMemory >= expectedMemoryRange.min && 
                           estimatedMemory <= expectedMemoryRange.max;

      return {
        testName: 'Memory Management',
        passed: memoryInRange,
        message: `Estimated memory usage: ${estimatedMemory}MB for ${streamCount} streams`,
        details: {
          estimatedMemory,
          streamCount,
          expectedRange: expectedMemoryRange,
          memoryPerStream: streamCount > 0 ? (estimatedMemory / streamCount).toFixed(1) : 0
        }
      };

    } catch (error) {
      return {
        testName: 'Memory Management',
        passed: false,
        message: 'Memory management test failed',
        details: error
      };
    }
  };

  const getTestIcon = (passed: boolean) => {
    return passed ? CheckCircle : AlertCircle;
  };

  const getTestColor = (passed: boolean) => {
    return passed ? ModernTheme.colors.success[400] : ModernTheme.colors.error[400];
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['rgba(139, 92, 246, 0.1)', 'rgba(139, 92, 246, 0.05)']}
        style={styles.header}
      >
        <Monitor size={32} color={ModernTheme.colors.accent[400]} />
        <Text style={styles.headerTitle}>Multi-View Twitch Test Suite</Text>
        <Text style={styles.headerSubtitle}>
          Comprehensive testing for multi-stream functionality
        </Text>
      </LinearGradient>

      {/* Test Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.testButton, isRunning && styles.testButtonDisabled]}
          onPress={runComprehensiveTest}
          disabled={isRunning}
        >
          <LinearGradient
            colors={
              isRunning 
                ? ['#666', '#555']
                : [ModernTheme.colors.accent[500], ModernTheme.colors.accent[600]]
            }
            style={styles.testButtonGradient}
          >
            <Activity size={20} color="#fff" />
            <Text style={styles.testButtonText}>
              {isRunning ? 'Running Tests...' : 'Run Full Test Suite'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {currentTest && (
          <Text style={styles.currentTest}>
            Currently: {currentTest}
          </Text>
        )}
      </View>

      {/* Test Results */}
      <ScrollView style={styles.results} showsVerticalScrollIndicator={false}>
        {testResults.map((result, index) => {
          const Icon = getTestIcon(result.passed);
          const color = getTestColor(result.passed);

          return (
            <View key={index} style={styles.resultItem}>
              <View style={styles.resultHeader}>
                <Icon size={20} color={color} />
                <Text style={[styles.resultTitle, { color }]}>
                  {result.testName}
                </Text>
              </View>
              <Text style={styles.resultMessage}>{result.message}</Text>
              {result.details && (
                <View style={styles.resultDetails}>
                  <Text style={styles.detailsLabel}>Details:</Text>
                  <Text style={styles.detailsText}>
                    {JSON.stringify(result.details, null, 2)}
                  </Text>
                </View>
              )}
            </View>
          );
        })}

        {/* Performance Report */}
        {performanceReport && (
          <View style={styles.performanceReport}>
            <Text style={styles.reportTitle}>Performance Report</Text>
            <View style={styles.reportGrid}>
              <View style={styles.reportItem}>
                <Users size={16} color={ModernTheme.colors.text.secondary} />
                <Text style={styles.reportLabel}>Total Streams</Text>
                <Text style={styles.reportValue}>{performanceReport.totalStreams}</Text>
              </View>
              <View style={styles.reportItem}>
                <CheckCircle size={16} color={ModernTheme.colors.success[400]} />
                <Text style={styles.reportLabel}>Healthy</Text>
                <Text style={styles.reportValue}>{performanceReport.healthyStreams}</Text>
              </View>
              <View style={styles.reportItem}>
                <Wifi size={16} color={ModernTheme.colors.text.secondary} />
                <Text style={styles.reportLabel}>Avg Load Time</Text>
                <Text style={styles.reportValue}>
                  {performanceReport.averageLoadTime.toFixed(0)}ms
                </Text>
              </View>
              <View style={styles.reportItem}>
                <Activity size={16} color={ModernTheme.colors.text.secondary} />
                <Text style={styles.reportLabel}>Memory Usage</Text>
                <Text style={styles.reportValue}>
                  {performanceReport.totalMemoryUsage}MB
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ModernTheme.colors.background.primary,
  },
  header: {
    padding: ModernTheme.spacing.lg,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: ModernTheme.colors.border.primary,
  },
  headerTitle: {
    fontSize: ModernTheme.typography.sizes['2xl'],
    fontWeight: ModernTheme.typography.weights.bold,
    color: ModernTheme.colors.text.primary,
    marginTop: ModernTheme.spacing.sm,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: ModernTheme.typography.sizes.sm,
    color: ModernTheme.colors.text.secondary,
    marginTop: ModernTheme.spacing.xs,
    textAlign: 'center',
  },
  controls: {
    padding: ModernTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: ModernTheme.colors.border.primary,
  },
  testButton: {
    borderRadius: ModernTheme.borderRadius.lg,
    overflow: 'hidden',
  },
  testButtonDisabled: {
    opacity: 0.6,
  },
  testButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ModernTheme.spacing.md,
    paddingHorizontal: ModernTheme.spacing.lg,
    gap: ModernTheme.spacing.sm,
  },
  testButtonText: {
    fontSize: ModernTheme.typography.sizes.md,
    fontWeight: ModernTheme.typography.weights.semibold,
    color: '#fff',
  },
  currentTest: {
    fontSize: ModernTheme.typography.sizes.sm,
    color: ModernTheme.colors.text.secondary,
    marginTop: ModernTheme.spacing.sm,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  results: {
    flex: 1,
    padding: ModernTheme.spacing.md,
  },
  resultItem: {
    backgroundColor: ModernTheme.colors.background.secondary,
    borderRadius: ModernTheme.borderRadius.lg,
    padding: ModernTheme.spacing.md,
    marginBottom: ModernTheme.spacing.sm,
    borderWidth: 1,
    borderColor: ModernTheme.colors.border.primary,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ModernTheme.spacing.sm,
    marginBottom: ModernTheme.spacing.sm,
  },
  resultTitle: {
    fontSize: ModernTheme.typography.sizes.md,
    fontWeight: ModernTheme.typography.weights.semibold,
  },
  resultMessage: {
    fontSize: ModernTheme.typography.sizes.sm,
    color: ModernTheme.colors.text.secondary,
    lineHeight: 20,
  },
  resultDetails: {
    marginTop: ModernTheme.spacing.sm,
    padding: ModernTheme.spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: ModernTheme.borderRadius.sm,
  },
  detailsLabel: {
    fontSize: ModernTheme.typography.sizes.xs,
    color: ModernTheme.colors.text.tertiary,
    marginBottom: ModernTheme.spacing.xs,
    fontWeight: ModernTheme.typography.weights.medium,
  },
  detailsText: {
    fontSize: ModernTheme.typography.sizes.xs,
    color: ModernTheme.colors.text.secondary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  performanceReport: {
    backgroundColor: ModernTheme.colors.background.secondary,
    borderRadius: ModernTheme.borderRadius.lg,
    padding: ModernTheme.spacing.md,
    marginTop: ModernTheme.spacing.md,
    borderWidth: 1,
    borderColor: ModernTheme.colors.border.primary,
  },
  reportTitle: {
    fontSize: ModernTheme.typography.sizes.lg,
    fontWeight: ModernTheme.typography.weights.semibold,
    color: ModernTheme.colors.text.primary,
    marginBottom: ModernTheme.spacing.md,
    textAlign: 'center',
  },
  reportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ModernTheme.spacing.sm,
  },
  reportItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: ModernTheme.spacing.sm,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: ModernTheme.borderRadius.md,
  },
  reportLabel: {
    fontSize: ModernTheme.typography.sizes.xs,
    color: ModernTheme.colors.text.secondary,
    marginTop: ModernTheme.spacing.xs,
  },
  reportValue: {
    fontSize: ModernTheme.typography.sizes.sm,
    fontWeight: ModernTheme.typography.weights.semibold,
    color: ModernTheme.colors.text.primary,
    marginTop: 2,
  },
});

export default MultiViewTwitchTest;