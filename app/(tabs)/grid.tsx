import React, { useState, useCallback } from 'react';
import { View, StatusBar, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { OptimizedMultiStreamGrid } from '@/components/OptimizedMultiStreamGrid';
import { useStreamManager } from '@/hooks/useStreamManager';

type GridLayout = '1x1' | '2x2' | '3x3' | '2x1' | '1x2' | 'adaptive';
type ViewMode = 'grid' | 'stack' | 'pip' | 'focus';

export default React.memo(function GridScreen() {
  const [layout, setLayout] = useState<GridLayout>('adaptive');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const { forceReload } = useStreamManager();

  // Remove automatic reload on focus to prevent race conditions with discover screen
  // The grid will update reactively through the shared useStreamManager state

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
      <View style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
        <OptimizedMultiStreamGrid
          maxStreams={6}
          initialLayout={layout}
          initialViewMode={viewMode}
          onLayoutChange={handleLayoutChange}
          onViewModeChange={handleViewModeChange}
          showControls
          enableGestures={false}
        />
      </View>
    </SafeAreaProvider>
  );
});
