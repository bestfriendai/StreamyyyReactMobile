import { LinearGradient } from 'expo-linear-gradient';
import {
  Plus,
  Minus,
  Save,
  RotateCcw,
  Grid,
  Move,
  Resize,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  Edit3,
  Check,
  X,
  Layout,
  Layers,
  Settings,
} from 'lucide-react-native';
import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import {
  PanGestureHandler,
  PinchGestureHandler,
  State,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import { TwitchStream } from '@/services/twitchApi';
import { LayoutConfiguration, StreamPosition } from './AdvancedLayoutManager';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface DraggableStreamSlot {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  scale: number;
  opacity: number;
  isSelected: boolean;
  streamId?: string;
  label: string;
}

interface CustomLayoutBuilderProps {
  streams: TwitchStream[];
  existingLayouts: LayoutConfiguration[];
  onSaveLayout: (layout: LayoutConfiguration) => void;
  onDeleteLayout: (layoutId: string) => void;
  onClose: () => void;
  isVisible: boolean;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export function CustomLayoutBuilder({
  streams,
  existingLayouts,
  onSaveLayout,
  onDeleteLayout,
  onClose,
  isVisible,
}: CustomLayoutBuilderProps) {
  const [mode, setMode] = useState<'design' | 'preview' | 'manage'>('design');
  const [streamSlots, setStreamSlots] = useState<DraggableStreamSlot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [layoutName, setLayoutName] = useState('');
  const [layoutDescription, setLayoutDescription] = useState('');
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize, setGridSize] = useState(20);
  const [editingLayoutId, setEditingLayoutId] = useState<string | null>(null);

  // Canvas dimensions
  const canvasWidth = screenWidth - 40;
  const canvasHeight = 300;

  // Animation values
  const containerOpacity = useSharedValue(0);
  const containerScale = useSharedValue(0.9);

  React.useEffect(() => {
    if (isVisible) {
      containerOpacity.value = withTiming(1, { duration: 300 });
      containerScale.value = withSpring(1, { damping: 15, stiffness: 300 });
    } else {
      containerOpacity.value = withTiming(0, { duration: 200 });
      containerScale.value = withTiming(0.9, { duration: 200 });
    }
  }, [isVisible]);

  // Initialize with default slots
  React.useEffect(() => {
    if (streamSlots.length === 0 && streams.length > 0) {
      initializeDefaultLayout();
    }
  }, [streams]);

  const generateSlotId = () => `slot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const initializeDefaultLayout = () => {
    const defaultSlots: DraggableStreamSlot[] = streams.slice(0, 4).map((stream, index) => {
      const cols = 2;
      const slotWidth = canvasWidth / cols - 20;
      const slotHeight = slotWidth * (9 / 16);
      const x = (index % cols) * (slotWidth + 20) + 10;
      const y = Math.floor(index / cols) * (slotHeight + 20) + 10;

      return {
        id: generateSlotId(),
        x,
        y,
        width: slotWidth,
        height: slotHeight,
        zIndex: index + 1,
        scale: 1,
        opacity: 1,
        isSelected: false,
        streamId: stream.id,
        label: stream.user_name,
      };
    });

    setStreamSlots(defaultSlots);
  };

  const addNewSlot = useCallback(() => {
    const newSlot: DraggableStreamSlot = {
      id: generateSlotId(),
      x: 20,
      y: 20,
      width: 120,
      height: 68,
      zIndex: streamSlots.length + 1,
      scale: 1,
      opacity: 1,
      isSelected: false,
      label: `Slot ${streamSlots.length + 1}`,
    };

    setStreamSlots(prev => [...prev, newSlot]);
  }, [streamSlots.length]);

  const removeSlot = useCallback(
    (slotId: string) => {
      setStreamSlots(prev => prev.filter(slot => slot.id !== slotId));
      if (selectedSlotId === slotId) {
        setSelectedSlotId(null);
      }
    },
    [selectedSlotId]
  );

  const snapToGridValue = useCallback(
    (value: number) => {
      if (!snapToGrid) {
        return value;
      }
      return Math.round(value / gridSize) * gridSize;
    },
    [snapToGrid, gridSize]
  );

  const updateSlotPosition = useCallback(
    (slotId: string, x: number, y: number) => {
      const snappedX = snapToGridValue(Math.max(0, Math.min(canvasWidth - 60, x)));
      const snappedY = snapToGridValue(Math.max(0, Math.min(canvasHeight - 40, y)));

      setStreamSlots(prev =>
        prev.map(slot => (slot.id === slotId ? { ...slot, x: snappedX, y: snappedY } : slot))
      );
    },
    [snapToGridValue, canvasWidth, canvasHeight]
  );

  const updateSlotSize = useCallback(
    (slotId: string, width: number, height: number) => {
      const snappedWidth = snapToGridValue(Math.max(60, Math.min(canvasWidth - 20, width)));
      const snappedHeight = snapToGridValue(Math.max(40, Math.min(canvasHeight - 20, height)));

      setStreamSlots(prev =>
        prev.map(slot =>
          slot.id === slotId ? { ...slot, width: snappedWidth, height: snappedHeight } : slot
        )
      );
    },
    [snapToGridValue, canvasWidth, canvasHeight]
  );

  const selectSlot = useCallback((slotId: string) => {
    setStreamSlots(prev =>
      prev.map(slot => ({
        ...slot,
        isSelected: slot.id === slotId,
      }))
    );
    setSelectedSlotId(slotId);
  }, []);

  const duplicateSlot = useCallback(
    (slotId: string) => {
      const slotToDuplicate = streamSlots.find(slot => slot.id === slotId);
      if (!slotToDuplicate) {
        return;
      }

      const newSlot: DraggableStreamSlot = {
        ...slotToDuplicate,
        id: generateSlotId(),
        x: slotToDuplicate.x + 20,
        y: slotToDuplicate.y + 20,
        isSelected: false,
        label: `${slotToDuplicate.label} Copy`,
      };

      setStreamSlots(prev => [...prev, newSlot]);
    },
    [streamSlots]
  );

  const assignStreamToSlot = useCallback(
    (slotId: string, streamId: string) => {
      const stream = streams.find(s => s.id === streamId);
      if (!stream) {
        return;
      }

      setStreamSlots(prev =>
        prev.map(slot =>
          slot.id === slotId ? { ...slot, streamId, label: stream.user_name } : slot
        )
      );
    },
    [streams]
  );

  const saveLayout = useCallback(() => {
    if (!layoutName.trim()) {
      Alert.alert('Error', 'Please enter a layout name');
      return;
    }

    if (streamSlots.length === 0) {
      Alert.alert('Error', 'Please add at least one stream slot');
      return;
    }

    const positions: StreamPosition[] = streamSlots.map(slot => ({
      streamId: slot.streamId || '',
      x: slot.x,
      y: slot.y,
      width: slot.width,
      height: slot.height,
      zIndex: slot.zIndex,
      scale: slot.scale,
      opacity: slot.opacity,
    }));

    const layout: LayoutConfiguration = {
      id: editingLayoutId || `custom_${Date.now()}`,
      name: layoutName,
      type: 'custom',
      positions,
      isCustom: true,
      description: layoutDescription,
    };

    onSaveLayout(layout);

    Alert.alert('Layout Saved', `Custom layout "${layoutName}" has been saved successfully`, [
      {
        text: 'OK',
        onPress: () => {
          setLayoutName('');
          setLayoutDescription('');
          setEditingLayoutId(null);
          setMode('manage');
        },
      },
    ]);
  }, [layoutName, layoutDescription, streamSlots, editingLayoutId, onSaveLayout]);

  const loadLayout = useCallback(
    (layout: LayoutConfiguration) => {
      const slots: DraggableStreamSlot[] = layout.positions.map((position, index) => {
        const stream = streams.find(s => s.id === position.streamId);
        return {
          id: generateSlotId(),
          x: position.x,
          y: position.y,
          width: position.width,
          height: position.height,
          zIndex: position.zIndex,
          scale: position.scale,
          opacity: position.opacity,
          isSelected: false,
          streamId: position.streamId,
          label: stream?.user_name || `Slot ${index + 1}`,
        };
      });

      setStreamSlots(slots);
      setLayoutName(layout.name);
      setLayoutDescription(layout.description || '');
      setEditingLayoutId(layout.id);
      setMode('design');
    },
    [streams]
  );

  const resetLayout = useCallback(() => {
    Alert.alert(
      'Reset Layout',
      'Are you sure you want to reset the current layout? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setStreamSlots([]);
            setSelectedSlotId(null);
            initializeDefaultLayout();
          },
        },
      ]
    );
  }, []);

  const renderGridLines = () => {
    if (!showGrid) {
      return null;
    }

    const lines = [];

    // Vertical lines
    for (let x = 0; x <= canvasWidth; x += gridSize) {
      lines.push(
        <View
          key={`v-${x}`}
          style={[
            styles.gridLine,
            {
              left: x,
              top: 0,
              width: 1,
              height: canvasHeight,
            },
          ]}
        />
      );
    }

    // Horizontal lines
    for (let y = 0; y <= canvasHeight; y += gridSize) {
      lines.push(
        <View
          key={`h-${y}`}
          style={[
            styles.gridLine,
            {
              left: 0,
              top: y,
              width: canvasWidth,
              height: 1,
            },
          ]}
        />
      );
    }

    return lines;
  };

  const renderDraggableSlot = (slot: DraggableStreamSlot) => {
    return (
      <DraggableStreamSlot
        key={slot.id}
        slot={slot}
        isSelected={slot.isSelected}
        onSelect={() => selectSlot(slot.id)}
        onPositionChange={(x, y) => updateSlotPosition(slot.id, x, y)}
        onSizeChange={(width, height) => updateSlotSize(slot.id, width, height)}
        onRemove={() => removeSlot(slot.id)}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
      />
    );
  };

  const renderDesignMode = () => (
    <View style={styles.designContainer}>
      {/* Canvas */}
      <View style={styles.canvasContainer}>
        <View style={[styles.canvas, { width: canvasWidth, height: canvasHeight }]}>
          {renderGridLines()}
          {streamSlots.map(renderDraggableSlot)}
        </View>
      </View>

      {/* Design tools */}
      <View style={styles.toolsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.tools}>
            <TouchableOpacity style={styles.tool} onPress={addNewSlot}>
              <LinearGradient colors={['#22C55E', '#16A34A']} style={styles.toolGradient}>
                <Plus size={16} color="#fff" />
              </LinearGradient>
              <Text style={styles.toolLabel}>Add Slot</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.tool} onPress={() => setShowGrid(!showGrid)}>
              <LinearGradient
                colors={showGrid ? ['#8B5CF6', '#7C3AED'] : ['#6B7280', '#4B5563']}
                style={styles.toolGradient}
              >
                {showGrid ? <Eye size={16} color="#fff" /> : <EyeOff size={16} color="#fff" />}
              </LinearGradient>
              <Text style={styles.toolLabel}>Grid</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.tool} onPress={() => setSnapToGrid(!snapToGrid)}>
              <LinearGradient
                colors={snapToGrid ? ['#F59E0B', '#D97706'] : ['#6B7280', '#4B5563']}
                style={styles.toolGradient}
              >
                <Grid size={16} color="#fff" />
              </LinearGradient>
              <Text style={styles.toolLabel}>Snap</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.tool} onPress={resetLayout}>
              <LinearGradient colors={['#EF4444', '#DC2626']} style={styles.toolGradient}>
                <RotateCcw size={16} color="#fff" />
              </LinearGradient>
              <Text style={styles.toolLabel}>Reset</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {/* Layout info */}
      <View style={styles.layoutInfo}>
        <TextInput
          style={styles.input}
          placeholder="Layout name"
          placeholderTextColor="#666"
          value={layoutName}
          onChangeText={setLayoutName}
        />
        <TextInput
          style={[styles.input, styles.descriptionInput]}
          placeholder="Description (optional)"
          placeholderTextColor="#666"
          value={layoutDescription}
          onChangeText={setLayoutDescription}
          multiline
        />
      </View>
    </View>
  );

  const renderManageMode = () => (
    <View style={styles.manageContainer}>
      <ScrollView style={styles.layoutsList}>
        {existingLayouts
          .filter(layout => layout.isCustom)
          .map(layout => (
            <View key={layout.id} style={styles.layoutItem}>
              <LinearGradient
                colors={['rgba(42, 42, 42, 0.8)', 'rgba(58, 58, 58, 0.8)']}
                style={styles.layoutItemGradient}
              >
                <View style={styles.layoutItemContent}>
                  <View style={styles.layoutItemInfo}>
                    <Text style={styles.layoutItemName}>{layout.name}</Text>
                    <Text style={styles.layoutItemDescription}>
                      {layout.description || 'No description'}
                    </Text>
                    <Text style={styles.layoutItemMeta}>{layout.positions.length} streams</Text>
                  </View>
                  <View style={styles.layoutItemActions}>
                    <TouchableOpacity
                      style={styles.layoutAction}
                      onPress={() => loadLayout(layout)}
                    >
                      <Edit3 size={16} color="#8B5CF6" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.layoutAction}
                      onPress={() => onDeleteLayout(layout.id)}
                    >
                      <Trash2 size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </LinearGradient>
            </View>
          ))}
      </ScrollView>
    </View>
  );

  const renderPreviewMode = () => (
    <View style={styles.previewContainer}>
      <View style={[styles.canvas, { width: canvasWidth, height: canvasHeight }]}>
        {streamSlots.map(slot => (
          <View
            key={slot.id}
            style={[
              styles.previewSlot,
              {
                left: slot.x,
                top: slot.y,
                width: slot.width,
                height: slot.height,
                opacity: slot.opacity,
                transform: [{ scale: slot.scale }],
                zIndex: slot.zIndex,
              },
            ]}
          >
            <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.previewSlotGradient}>
              <Text style={styles.previewSlotText} numberOfLines={1}>
                {slot.label}
              </Text>
            </LinearGradient>
          </View>
        ))}
      </View>
    </View>
  );

  const animatedContainerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    transform: [{ scale: containerScale.value }],
  }));

  if (!isVisible) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.overlay}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <View style={styles.backdropContent} />
      </TouchableOpacity>

      <Animated.View style={[styles.container, animatedContainerStyle]}>
        <LinearGradient
          colors={['rgba(26, 26, 26, 0.98)', 'rgba(15, 15, 15, 0.95)']}
          style={styles.content}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Custom Layout Builder</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Mode tabs */}
          <View style={styles.modeTabs}>
            {(['design', 'preview', 'manage'] as const).map(tabMode => (
              <TouchableOpacity
                key={tabMode}
                style={[styles.modeTab, mode === tabMode && styles.activeModeTab]}
                onPress={() => setMode(tabMode)}
              >
                <Text style={[styles.modeTabText, mode === tabMode && styles.activeModeTabText]}>
                  {tabMode.charAt(0).toUpperCase() + tabMode.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Content */}
          <View style={styles.modeContent}>
            {mode === 'design' && renderDesignMode()}
            {mode === 'preview' && renderPreviewMode()}
            {mode === 'manage' && renderManageMode()}
          </View>

          {/* Footer actions */}
          {mode === 'design' && (
            <View style={styles.footer}>
              <TouchableOpacity style={styles.footerButton} onPress={() => setMode('preview')}>
                <LinearGradient colors={['#06B6D4', '#0891B2']} style={styles.footerGradient}>
                  <Eye size={16} color="#fff" />
                  <Text style={styles.footerButtonText}>Preview</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.footerButton} onPress={saveLayout}>
                <LinearGradient colors={['#22C55E', '#16A34A']} style={styles.footerGradient}>
                  <Save size={16} color="#fff" />
                  <Text style={styles.footerButtonText}>Save Layout</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </LinearGradient>
      </Animated.View>
    </GestureHandlerRootView>
  );
}

// Draggable stream slot component
interface DraggableStreamSlotProps {
  slot: DraggableStreamSlot;
  isSelected: boolean;
  onSelect: () => void;
  onPositionChange: (x: number, y: number) => void;
  onSizeChange: (width: number, height: number) => void;
  onRemove: () => void;
  canvasWidth: number;
  canvasHeight: number;
}

function DraggableStreamSlot({
  slot,
  isSelected,
  onSelect,
  onPositionChange,
  onSizeChange,
  onRemove,
  canvasWidth,
  canvasHeight,
}: DraggableStreamSlotProps) {
  const translateX = useSharedValue(slot.x);
  const translateY = useSharedValue(slot.y);
  const scale = useSharedValue(1);

  const panGestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      scale.value = withSpring(1.05);
      runOnJS(onSelect)();
    },
    onActive: event => {
      translateX.value = Math.max(
        0,
        Math.min(canvasWidth - slot.width, slot.x + event.translationX)
      );
      translateY.value = Math.max(
        0,
        Math.min(canvasHeight - slot.height, slot.y + event.translationY)
      );
    },
    onEnd: () => {
      scale.value = withSpring(1);
      runOnJS(onPositionChange)(translateX.value, translateY.value);
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value - slot.x },
      { translateY: translateY.value - slot.y },
      { scale: scale.value },
    ],
  }));

  return (
    <PanGestureHandler onGestureEvent={panGestureHandler}>
      <Animated.View
        style={[
          styles.draggableSlot,
          {
            left: slot.x,
            top: slot.y,
            width: slot.width,
            height: slot.height,
            zIndex: slot.zIndex,
          },
          animatedStyle,
          isSelected && styles.selectedSlot,
        ]}
      >
        <LinearGradient
          colors={
            isSelected ? ['#8B5CF6', '#7C3AED'] : ['rgba(42, 42, 42, 0.8)', 'rgba(58, 58, 58, 0.8)']
          }
          style={styles.slotGradient}
        >
          <Text style={styles.slotLabel} numberOfLines={1}>
            {slot.label}
          </Text>
          {isSelected && (
            <TouchableOpacity style={styles.removeButton} onPress={onRemove}>
              <Minus size={12} color="#fff" />
            </TouchableOpacity>
          )}
        </LinearGradient>
      </Animated.View>
    </PanGestureHandler>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2000,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  backdropContent: {
    flex: 1,
  },
  container: {
    position: 'absolute',
    top: '5%',
    left: '5%',
    right: '5%',
    bottom: '5%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(42, 42, 42, 0.3)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeModeTab: {
    backgroundColor: '#8B5CF6',
  },
  modeTabText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#666',
  },
  activeModeTabText: {
    color: '#fff',
  },
  modeContent: {
    flex: 1,
  },
  designContainer: {
    flex: 1,
  },
  canvasContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  canvas: {
    backgroundColor: 'rgba(42, 42, 42, 0.2)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  toolsContainer: {
    marginBottom: 16,
  },
  tools: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 4,
  },
  tool: {
    alignItems: 'center',
    gap: 6,
  },
  toolGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolLabel: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    color: '#999',
  },
  layoutInfo: {
    gap: 12,
  },
  input: {
    backgroundColor: 'rgba(42, 42, 42, 0.5)',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  descriptionInput: {
    height: 60,
    textAlignVertical: 'top',
  },
  draggableSlot: {
    position: 'absolute',
    borderRadius: 8,
    overflow: 'hidden',
  },
  selectedSlot: {
    borderWidth: 2,
    borderColor: '#8B5CF6',
  },
  slotGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  slotLabel: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
    textAlign: 'center',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewContainer: {
    alignItems: 'center',
  },
  previewSlot: {
    position: 'absolute',
    borderRadius: 8,
    overflow: 'hidden',
  },
  previewSlotGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewSlotText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
    textAlign: 'center',
  },
  manageContainer: {
    flex: 1,
  },
  layoutsList: {
    flex: 1,
  },
  layoutItem: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  layoutItemGradient: {
    padding: 16,
  },
  layoutItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  layoutItemInfo: {
    flex: 1,
    marginRight: 12,
  },
  layoutItemName: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginBottom: 4,
  },
  layoutItemDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#999',
    marginBottom: 4,
  },
  layoutItemMeta: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    color: '#8B5CF6',
  },
  layoutItemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  layoutAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  footerButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  footerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  footerButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
  },
});
