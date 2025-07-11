import React, { useState, useCallback } from 'react';
import { View, StatusBar, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { OptimizedMultiStreamGrid } from '@/components/OptimizedMultiStreamGrid';
import { MultiStreamPerformanceOptimizer } from '@/components/MultiStreamPerformanceOptimizer';

type GridLayout = '1x1' | '2x2' | '3x3' | '2x1' | '1x2' | 'adaptive';
type ViewMode = 'grid' | 'stack' | 'pip' | 'focus';

export default function GridScreen() {
  const [layout, setLayout] = useState<GridLayout>('adaptive');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const handleLayoutChange = useCallback((newLayout: GridLayout) => {
    setLayout(newLayout);
  }, []);

  const handleViewModeChange = useCallback((newMode: ViewMode) => {
    setViewMode(newMode);
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="#000" 
        translucent={Platform.OS === 'android'}
      />
      <MultiStreamPerformanceOptimizer
        enableAutoOptimization={true}
        maxStreams={6}
        performanceThreshold={4000}
      >
        <View style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
          <OptimizedMultiStreamGrid
            maxStreams={9}
            initialLayout={layout}
            initialViewMode={viewMode}
            onLayoutChange={handleLayoutChange}
            onViewModeChange={handleViewModeChange}
            showControls={true}
            enableGestures={true}
          />
        </View>
      </MultiStreamPerformanceOptimizer>
    </SafeAreaProvider>
  );
}