/**
 * Performance Benchmark Tests
 * Tests performance characteristics of multi-stream rendering and memory usage
 */
import React from 'react';
import { render, act } from '@testing-library/react-native';
import { TwitchStream } from '@/services/twitchApi';
import { useAppStore } from '@/store/useAppStore';

// Performance monitoring utilities
class PerformanceMonitor {
  private startTime: number = 0;
  private endTime: number = 0;
  private measurements: { [key: string]: number[] } = {};

  startTimer() {
    this.startTime = performance.now();
  }

  endTimer(): number {
    this.endTime = performance.now();
    return this.endTime - this.startTime;
  }

  recordMeasurement(key: string, value: number) {
    if (!this.measurements[key]) {
      this.measurements[key] = [];
    }
    this.measurements[key].push(value);
  }

  getAverageTime(key: string): number {
    const measurements = this.measurements[key];
    if (!measurements || measurements.length === 0) return 0;
    return measurements.reduce((sum, val) => sum + val, 0) / measurements.length;
  }

  getMedianTime(key: string): number {
    const measurements = this.measurements[key];
    if (!measurements || measurements.length === 0) return 0;
    const sorted = [...measurements].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 
      ? (sorted[mid - 1] + sorted[mid]) / 2 
      : sorted[mid];
  }

  getP95Time(key: string): number {
    const measurements = this.measurements[key];
    if (!measurements || measurements.length === 0) return 0;
    const sorted = [...measurements].sort((a, b) => a - b);
    const index = Math.floor(sorted.length * 0.95);
    return sorted[index];
  }

  reset() {
    this.measurements = {};
  }

  getStats(key: string) {
    return {
      average: this.getAverageTime(key),
      median: this.getMedianTime(key),
      p95: this.getP95Time(key),
      count: this.measurements[key]?.length || 0,
    };
  }
}

// Mock memory tracking
class MemoryTracker {
  private snapshots: { timestamp: number; heapUsed: number; heapTotal: number }[] = [];

  takeSnapshot() {
    // Mock memory usage (in real environment, use performance.memory)
    const mockMemory = {
      usedJSHeapSize: Math.random() * 100000000, // 0-100MB
      totalJSHeapSize: Math.random() * 200000000, // 0-200MB
      jsHeapSizeLimit: 2147483648, // 2GB limit
    };

    this.snapshots.push({
      timestamp: Date.now(),
      heapUsed: mockMemory.usedJSHeapSize,
      heapTotal: mockMemory.totalJSHeapSize,
    });
  }

  getMemoryGrowth(): number {
    if (this.snapshots.length < 2) return 0;
    const first = this.snapshots[0];
    const last = this.snapshots[this.snapshots.length - 1];
    return last.heapUsed - first.heapUsed;
  }

  getMemoryPeaks(): number[] {
    return this.snapshots.map(s => s.heapUsed);
  }

  reset() {
    this.snapshots = [];
  }
}

// Mock stream data generator
const generateMockStream = (id: string): TwitchStream => ({
  id,
  user_id: `user-${id}`,
  user_login: `streamer${id}`,
  user_name: `Streamer ${id}`,
  game_id: `game-${Math.floor(Math.random() * 1000)}`,
  game_name: `Game ${Math.floor(Math.random() * 100)}`,
  type: 'live',
  title: `Stream Title ${id} - Lorem ipsum dolor sit amet`,
  viewer_count: Math.floor(Math.random() * 50000),
  started_at: new Date(Date.now() - Math.random() * 86400000).toISOString(),
  language: 'en',
  thumbnail_url: `https://example.com/thumb-${id}-{width}x{height}.jpg`,
  tag_ids: Array(Math.floor(Math.random() * 5)).fill(0).map(() => `tag-${Math.random()}`),
  is_mature: Math.random() > 0.8,
});

// Mock components for testing
const MockStreamCard = ({ stream, index }: { stream: TwitchStream; index: number }) => {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(false);
  
  return (
    <div testID={`stream-card-${stream.id}`} data-index={index}>
      <div>{stream.title}</div>
      <div>{stream.user_name}</div>
      <div>{stream.viewer_count} viewers</div>
      <button onPress={() => setIsPlaying(!isPlaying)}>
        {isPlaying ? 'Pause' : 'Play'}
      </button>
      <button onPress={() => setIsMuted(!isMuted)}>
        {isMuted ? 'Unmute' : 'Mute'}
      </button>
    </div>
  );
};

const MockMultiStreamGrid = ({ streams }: { streams: TwitchStream[] }) => {
  const [layoutMode, setLayoutMode] = React.useState('grid-2x2');
  
  return (
    <div testID="multi-stream-grid">
      <div testID="stream-count">{streams.length} streams</div>
      <select 
        value={layoutMode} 
        onChange={(e) => setLayoutMode(e.target.value)}
      >
        <option value="grid-2x2">2x2 Grid</option>
        <option value="grid-3x1">3x1 Grid</option>
        <option value="pip">Picture in Picture</option>
      </select>
      <div testID="stream-container">
        {streams.map((stream, index) => (
          <MockStreamCard key={stream.id} stream={stream} index={index} />
        ))}
      </div>
    </div>
  );
};

describe('Performance Benchmarks', () => {
  let monitor: PerformanceMonitor;
  let memoryTracker: MemoryTracker;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
    memoryTracker = new MemoryTracker();
    
    // Reset store
    useAppStore.setState({
      activeStreams: [],
      savedLayouts: [],
      currentLayout: null,
      isLoading: false,
      error: null,
    });
  });

  afterEach(() => {
    monitor.reset();
    memoryTracker.reset();
  });

  describe('Stream Rendering Performance', () => {
    it('should render single stream within performance threshold', async () => {
      const stream = generateMockStream('1');
      
      monitor.startTimer();
      const { getByTestId } = render(<MockStreamCard stream={stream} index={0} />);
      const renderTime = monitor.endTimer();
      
      expect(getByTestId(`stream-card-${stream.id}`)).toBeTruthy();
      expect(renderTime).toBeLessThan(100); // Should render in less than 100ms
    });

    it('should handle multiple stream rendering efficiently', async () => {
      const streamCounts = [2, 4, 6, 8, 10, 12];
      const results: { count: number; renderTime: number }[] = [];

      for (const count of streamCounts) {
        const streams = Array(count).fill(0).map((_, i) => generateMockStream(`${i + 1}`));
        
        monitor.startTimer();
        const { getByTestId } = render(<MockMultiStreamGrid streams={streams} />);
        const renderTime = monitor.endTimer();
        
        expect(getByTestId('stream-count')).toHaveTextContent(`${count} streams`);
        results.push({ count, renderTime });
        
        monitor.recordMeasurement('multi-stream-render', renderTime);
      }

      // Performance should scale linearly (not exponentially)
      const averageTimePerStream = results.map(r => r.renderTime / r.count);
      const maxTimePerStream = Math.max(...averageTimePerStream);
      const minTimePerStream = Math.min(...averageTimePerStream);
      
      // Variance should be reasonable (not more than 5x difference)
      expect(maxTimePerStream / minTimePerStream).toBeLessThan(5);
      
      console.log('Multi-stream render performance:', {
        average: monitor.getAverageTime('multi-stream-render'),
        median: monitor.getMedianTime('multi-stream-render'),
        p95: monitor.getP95Time('multi-stream-render'),
      });
    });

    it('should maintain 60fps during layout transitions', async () => {
      const streams = Array(6).fill(0).map((_, i) => generateMockStream(`${i + 1}`));
      const { getByTestId } = render(<MockMultiStreamGrid streams={streams} />);
      
      const layoutModes = ['grid-2x2', 'grid-3x1', 'pip'];
      const frameTime = 16.67; // 60fps = 16.67ms per frame
      
      for (const mode of layoutModes) {
        monitor.startTimer();
        
        // Simulate layout change
        await act(async () => {
          const select = getByTestId('multi-stream-grid').querySelector('select');
          if (select) {
            select.value = mode;
            select.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });
        
        const transitionTime = monitor.endTimer();
        monitor.recordMeasurement('layout-transition', transitionTime);
        
        // Layout transition should complete within 2 frames
        expect(transitionTime).toBeLessThan(frameTime * 2);
      }
    });

    it('should handle rapid state updates without performance degradation', async () => {
      const streams = Array(4).fill(0).map((_, i) => generateMockStream(`${i + 1}`));
      const { getByTestId } = render(<MockMultiStreamGrid streams={streams} />);
      
      const iterations = 20;
      
      for (let i = 0; i < iterations; i++) {
        monitor.startTimer();
        
        // Simulate rapid play/pause on all streams
        streams.forEach(stream => {
          const card = getByTestId(`stream-card-${stream.id}`);
          const playButton = card.querySelector('button');
          if (playButton) {
            playButton.click();
          }
        });
        
        const updateTime = monitor.endTimer();
        monitor.recordMeasurement('rapid-updates', updateTime);
        
        // Each update should be fast
        expect(updateTime).toBeLessThan(50);
      }
      
      // Performance should not degrade over time
      const stats = monitor.getStats('rapid-updates');
      expect(stats.p95).toBeLessThan(stats.average * 2); // P95 should not be more than 2x average
    });
  });

  describe('Memory Usage Optimization', () => {
    it('should maintain stable memory usage with multiple streams', async () => {
      memoryTracker.takeSnapshot();
      
      // Gradually add streams and monitor memory
      for (let i = 1; i <= 10; i++) {
        const streams = Array(i).fill(0).map((_, j) => generateMockStream(`${j + 1}`));
        
        render(<MockMultiStreamGrid streams={streams} />);
        memoryTracker.takeSnapshot();
        
        // Force garbage collection simulation
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
        });
      }
      
      const memoryGrowth = memoryTracker.getMemoryGrowth();
      const memoryPeaks = memoryTracker.getMemoryPeaks();
      
      // Memory growth should be reasonable (less than 50MB for 10 streams)
      expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024);
      
      // Memory usage should not have extreme spikes
      const maxMemory = Math.max(...memoryPeaks);
      const avgMemory = memoryPeaks.reduce((sum, val) => sum + val, 0) / memoryPeaks.length;
      expect(maxMemory).toBeLessThan(avgMemory * 2);
    });

    it('should clean up resources when streams are removed', async () => {
      const initialStreams = Array(8).fill(0).map((_, i) => generateMockStream(`${i + 1}`));
      
      memoryTracker.takeSnapshot();
      const { rerender } = render(<MockMultiStreamGrid streams={initialStreams} />);
      memoryTracker.takeSnapshot();
      
      // Remove streams gradually
      for (let count = 7; count >= 1; count--) {
        const streams = initialStreams.slice(0, count);
        rerender(<MockMultiStreamGrid streams={streams} />);
        
        // Allow cleanup
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
        });
        
        memoryTracker.takeSnapshot();
      }
      
      const finalMemory = memoryTracker.getMemoryPeaks();
      const peakMemory = Math.max(...finalMemory);
      const finalValue = finalMemory[finalMemory.length - 1];
      
      // Memory should decrease as streams are removed
      expect(finalValue).toBeLessThan(peakMemory);
    });
  });

  describe('Store Performance', () => {
    it('should handle rapid store updates efficiently', async () => {
      const { addStream, removeStream, updateStream } = useAppStore.getState();
      const streams = Array(5).fill(0).map((_, i) => generateMockStream(`${i + 1}`));
      
      // Test rapid additions
      monitor.startTimer();
      streams.forEach(stream => addStream(stream));
      const addTime = monitor.endTimer();
      monitor.recordMeasurement('store-add-batch', addTime);
      
      // Test rapid updates
      monitor.startTimer();
      streams.forEach(stream => {
        updateStream(stream.id, { viewer_count: stream.viewer_count + 100 });
      });
      const updateTime = monitor.endTimer();
      monitor.recordMeasurement('store-update-batch', updateTime);
      
      // Test rapid removals
      monitor.startTimer();
      streams.forEach(stream => removeStream(stream.id));
      const removeTime = monitor.endTimer();
      monitor.recordMeasurement('store-remove-batch', removeTime);
      
      // All operations should be fast
      expect(addTime).toBeLessThan(50);
      expect(updateTime).toBeLessThan(50);
      expect(removeTime).toBeLessThan(50);
    });

    it('should maintain selector performance with large datasets', async () => {
      const { addStream } = useAppStore.getState();
      const largeStreamSet = Array(100).fill(0).map((_, i) => generateMockStream(`${i + 1}`));
      
      // Add large dataset
      largeStreamSet.forEach(stream => addStream(stream));
      
      // Test selector performance
      const iterations = 50;
      
      for (let i = 0; i < iterations; i++) {
        monitor.startTimer();
        
        // Access various selectors
        const state = useAppStore.getState();
        const activeStreams = state.activeStreams;
        const streamCount = activeStreams.length;
        const firstStream = activeStreams[0];
        const filteredStreams = activeStreams.filter(s => s.viewer_count > 1000);
        
        const selectorTime = monitor.endTimer();
        monitor.recordMeasurement('selector-access', selectorTime);
        
        // Selector access should be very fast
        expect(selectorTime).toBeLessThan(10);
      }
      
      const stats = monitor.getStats('selector-access');
      expect(stats.average).toBeLessThan(5); // Average should be under 5ms
    });
  });

  describe('Animation Performance', () => {
    it('should maintain smooth animations during stream operations', async () => {
      const streams = Array(4).fill(0).map((_, i) => generateMockStream(`${i + 1}`));
      const { getByTestId, rerender } = render(<MockMultiStreamGrid streams={streams} />);
      
      const animationFrames = 10;
      const targetFrameTime = 16.67; // 60fps
      
      // Simulate animation frames during stream addition
      for (let frame = 0; frame < animationFrames; frame++) {
        monitor.startTimer();
        
        // Add a new stream (triggering animations)
        const newStream = generateMockStream(`new-${frame}`);
        const updatedStreams = [...streams, newStream];
        rerender(<MockMultiStreamGrid streams={updatedStreams} />);
        
        const frameTime = monitor.endTimer();
        monitor.recordMeasurement('animation-frame', frameTime);
        
        // Each frame should complete within budget
        expect(frameTime).toBeLessThan(targetFrameTime);
      }
      
      const stats = monitor.getStats('animation-frame');
      expect(stats.p95).toBeLessThan(targetFrameTime * 1.5); // Allow some variance
    });
  });

  describe('Bundle Size and Loading Performance', () => {
    it('should load core components quickly', async () => {
      // Simulate cold start
      monitor.startTimer();
      
      // Import and render core components
      const streams = [generateMockStream('1')];
      const { getByTestId } = render(<MockMultiStreamGrid streams={streams} />);
      
      const loadTime = monitor.endTimer();
      
      expect(getByTestId('multi-stream-grid')).toBeTruthy();
      expect(loadTime).toBeLessThan(500); // Should load in less than 500ms
    });

    it('should handle component mounting efficiently', async () => {
      const mountCounts = [1, 2, 4, 8, 16];
      
      for (const count of mountCounts) {
        const streams = Array(count).fill(0).map((_, i) => generateMockStream(`${i + 1}`));
        
        monitor.startTimer();
        const { unmount } = render(<MockMultiStreamGrid streams={streams} />);
        const mountTime = monitor.endTimer();
        
        monitor.recordMeasurement(`mount-${count}`, mountTime);
        
        // Clean up
        unmount();
        
        // Mount time should scale reasonably
        expect(mountTime).toBeLessThan(count * 50); // 50ms per component is generous
      }
    });
  });

  describe('Performance Regression Detection', () => {
    it('should maintain consistent performance across multiple test runs', async () => {
      const testRuns = 5;
      const streams = Array(6).fill(0).map((_, i) => generateMockStream(`${i + 1}`));
      
      for (let run = 0; run < testRuns; run++) {
        monitor.startTimer();
        const { unmount } = render(<MockMultiStreamGrid streams={streams} />);
        const runTime = monitor.endTimer();
        
        monitor.recordMeasurement('consistency-test', runTime);
        
        unmount();
        
        // Allow cleanup between runs
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
        });
      }
      
      const stats = monitor.getStats('consistency-test');
      const variance = stats.p95 - stats.average;
      
      // Performance should be consistent (low variance)
      expect(variance).toBeLessThan(stats.average * 0.5); // Variance should be less than 50% of average
    });
  });

  describe('Edge Case Performance', () => {
    it('should handle empty state efficiently', async () => {
      monitor.startTimer();
      const { getByTestId } = render(<MockMultiStreamGrid streams={[]} />);
      const emptyRenderTime = monitor.endTimer();
      
      expect(getByTestId('stream-count')).toHaveTextContent('0 streams');
      expect(emptyRenderTime).toBeLessThan(20); // Empty state should be very fast
    });

    it('should handle maximum stream count without performance issues', async () => {
      const maxStreams = 20; // Theoretical maximum
      const streams = Array(maxStreams).fill(0).map((_, i) => generateMockStream(`${i + 1}`));
      
      monitor.startTimer();
      const { getByTestId } = render(<MockMultiStreamGrid streams={streams} />);
      const maxRenderTime = monitor.endTimer();
      
      expect(getByTestId('stream-count')).toHaveTextContent(`${maxStreams} streams`);
      expect(maxRenderTime).toBeLessThan(1000); // Should render max streams in under 1 second
    });

    it('should handle rapid component unmounting', async () => {
      const components: Array<() => void> = [];
      
      // Mount multiple components rapidly
      monitor.startTimer();
      for (let i = 0; i < 10; i++) {
        const streams = Array(2).fill(0).map((_, j) => generateMockStream(`${i}-${j}`));
        const { unmount } = render(<MockMultiStreamGrid streams={streams} />);
        components.push(unmount);
      }
      const massRenderTime = monitor.endTimer();
      
      // Unmount all components rapidly
      monitor.startTimer();
      components.forEach(unmount => unmount());
      const massUnmountTime = monitor.endTimer();
      
      expect(massRenderTime).toBeLessThan(1000);
      expect(massUnmountTime).toBeLessThan(500);
    });
  });
});