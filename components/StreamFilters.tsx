/**
 * Stream Filters Component
 * Advanced filtering interface for stream search
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurViewFallback as BlurView } from './BlurViewFallback';
import {
  Filter,
  ChevronDown,
  ChevronUp,
  Users,
  Globe,
  Hash,
  SortAsc,
  X,
  Check,
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutUp,
} from 'react-native-reanimated';
import { ModernTheme } from '@/theme/modernTheme';
import { HapticFeedback } from '@/utils/haptics';
import { SearchFilters } from '@/services/searchService';

interface StreamFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  visible: boolean;
  onClose: () => void;
}

interface FilterOption {
  id: string;
  label: string;
  value: any;
}

const SORT_OPTIONS: FilterOption[] = [
  { id: 'relevance', label: 'Relevance', value: 'relevance' },
  { id: 'viewers', label: 'Viewer Count', value: 'viewers' },
  { id: 'recent', label: 'Recently Started', value: 'recent' },
  { id: 'alphabetical', label: 'Alphabetical', value: 'alphabetical' },
];

const LANGUAGE_OPTIONS: FilterOption[] = [
  { id: 'all', label: 'All Languages', value: undefined },
  { id: 'en', label: 'English', value: 'en' },
  { id: 'es', label: 'Spanish', value: 'es' },
  { id: 'fr', label: 'French', value: 'fr' },
  { id: 'de', label: 'German', value: 'de' },
  { id: 'pt', label: 'Portuguese', value: 'pt' },
  { id: 'ru', label: 'Russian', value: 'ru' },
  { id: 'ja', label: 'Japanese', value: 'ja' },
  { id: 'ko', label: 'Korean', value: 'ko' },
  { id: 'zh', label: 'Chinese', value: 'zh' },
];

const VIEWER_RANGES: FilterOption[] = [
  { id: 'any', label: 'Any', value: { min: undefined, max: undefined } },
  { id: 'small', label: '1-100', value: { min: 1, max: 100 } },
  { id: 'medium', label: '100-1K', value: { min: 100, max: 1000 } },
  { id: 'large', label: '1K-10K', value: { min: 1000, max: 10000 } },
  { id: 'huge', label: '10K+', value: { min: 10000, max: undefined } },
];

const POPULAR_TAGS: FilterOption[] = [
  { id: 'english', label: 'English', value: 'english' },
  { id: 'educational', label: 'Educational', value: 'educational' },
  { id: 'family-friendly', label: 'Family Friendly', value: 'family-friendly' },
  { id: 'competitive', label: 'Competitive', value: 'competitive' },
  { id: 'speedrun', label: 'Speedrun', value: 'speedrun' },
  { id: 'first-playthrough', label: 'First Playthrough', value: 'first-playthrough' },
  { id: 'co-op', label: 'Co-op', value: 'co-op' },
  { id: 'pvp', label: 'PvP', value: 'pvp' },
];

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export const StreamFilters: React.FC<StreamFiltersProps> = ({
  filters,
  onFiltersChange,
  visible,
  onClose,
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['sort']));

  // Animation values
  const overlayOpacity = useSharedValue(0);
  const panelTranslateY = useSharedValue(300);

  // Update animations based on visibility
  React.useEffect(() => {
    if (visible) {
      overlayOpacity.value = withTiming(1, { duration: 200 });
      panelTranslateY.value = withSpring(0, { damping: 20 });
    } else {
      overlayOpacity.value = withTiming(0, { duration: 200 });
      panelTranslateY.value = withTiming(300, { duration: 200 });
    }
  }, [visible]);

  // Toggle section expansion
  const toggleSection = useCallback((section: string) => {
    HapticFeedback.light();
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  }, []);

  // Update filters
  const updateFilters = useCallback((updates: Partial<SearchFilters>) => {
    const newFilters = { ...filters, ...updates };
    onFiltersChange(newFilters);
  }, [filters, onFiltersChange]);

  // Handle viewer range selection
  const handleViewerRangeSelect = useCallback((range: { min?: number; max?: number }) => {
    updateFilters({
      minViewers: range.min,
      maxViewers: range.max,
    });
  }, [updateFilters]);

  // Handle tag toggle
  const handleTagToggle = useCallback((tag: string) => {
    const currentTags = filters.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
    
    updateFilters({ tags: newTags });
  }, [filters.tags, updateFilters]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    HapticFeedback.medium();
    updateFilters({
      category: undefined,
      language: undefined,
      minViewers: undefined,
      maxViewers: undefined,
      tags: [],
      sortBy: 'relevance',
    });
  }, [updateFilters]);

  // Animated styles
  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: panelTranslateY.value }],
  }));

  // Render filter section
  const renderSection = (
    id: string,
    title: string,
    icon: React.ReactNode,
    content: React.ReactNode
  ) => {
    const isExpanded = expandedSections.has(id);

    return (
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection(id)}
        >
          <View style={styles.sectionHeaderLeft}>
            {icon}
            <Text style={styles.sectionTitle}>{title}</Text>
          </View>
          {isExpanded ? (
            <ChevronUp size={20} color={ModernTheme.colors.text.secondary} />
          ) : (
            <ChevronDown size={20} color={ModernTheme.colors.text.secondary} />
          )}
        </TouchableOpacity>

        {isExpanded && (
          <Animated.View
            entering={SlideInDown}
            exiting={SlideOutUp}
            style={styles.sectionContent}
          >
            {content}
          </Animated.View>
        )}
      </View>
    );
  };

  // Render option chips
  const renderOptionChips = (
    options: FilterOption[],
    selectedValue: any,
    onSelect: (value: any) => void,
    multiSelect = false
  ) => (
    <View style={styles.chipContainer}>
      {options.map((option) => {
        const isSelected = multiSelect
          ? (Array.isArray(selectedValue) && selectedValue.includes(option.value))
          : selectedValue === option.value;

        return (
          <TouchableOpacity
            key={option.id}
            style={[styles.chip, isSelected && styles.chipSelected]}
            onPress={() => onSelect(option.value)}
          >
            {isSelected && (
              <Check size={14} color="#fff" style={styles.chipIcon} />
            )}
            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Overlay */}
      <Animated.View style={[styles.overlay, overlayStyle]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          activeOpacity={1}
        />
      </Animated.View>

      {/* Filter Panel */}
      <Animated.View style={[styles.panel, panelStyle]}>
        <BlurView style={styles.panelBlur} blurType="dark" blurAmount={20}>
          <LinearGradient
            colors={['rgba(0, 0, 0, 0.95)', 'rgba(0, 0, 0, 0.9)']}
            style={styles.panelGradient}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Filter size={24} color={ModernTheme.colors.primary[400]} />
                <Text style={styles.title}>Filters</Text>
              </View>
              
              <View style={styles.headerRight}>
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={clearAllFilters}
                >
                  <Text style={styles.clearButtonText}>Clear All</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={onClose}
                >
                  <X size={24} color={ModernTheme.colors.text.secondary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Filter Content */}
            <ScrollView
              style={styles.content}
              showsVerticalScrollIndicator={false}
            >
              {/* Sort By */}
              {renderSection(
                'sort',
                'Sort By',
                <SortAsc size={20} color={ModernTheme.colors.primary[400]} />,
                renderOptionChips(
                  SORT_OPTIONS,
                  filters.sortBy,
                  (value) => updateFilters({ sortBy: value })
                )
              )}

              {/* Viewer Count */}
              {renderSection(
                'viewers',
                'Viewer Count',
                <Users size={20} color={ModernTheme.colors.accent[400]} />,
                renderOptionChips(
                  VIEWER_RANGES,
                  VIEWER_RANGES.find(r => 
                    r.value.min === filters.minViewers && r.value.max === filters.maxViewers
                  )?.value,
                  handleViewerRangeSelect
                )
              )}

              {/* Language */}
              {renderSection(
                'language',
                'Language',
                <Globe size={20} color={ModernTheme.colors.success[400]} />,
                renderOptionChips(
                  LANGUAGE_OPTIONS,
                  filters.language,
                  (value) => updateFilters({ language: value })
                )
              )}

              {/* Tags */}
              {renderSection(
                'tags',
                'Tags',
                <Hash size={20} color={ModernTheme.colors.warning[400]} />,
                renderOptionChips(
                  POPULAR_TAGS,
                  filters.tags || [],
                  handleTagToggle,
                  true
                )
              )}

              {/* Custom Category */}
              {renderSection(
                'category',
                'Category',
                <Hash size={20} color={ModernTheme.colors.error[400]} />,
                <View style={styles.customInput}>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter game or category..."
                    placeholderTextColor={ModernTheme.colors.text.secondary}
                    value={filters.category || ''}
                    onChangeText={(value) => updateFilters({ category: value || undefined })}
                  />
                </View>
              )}
            </ScrollView>
          </LinearGradient>
        </BlurView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  panel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',
    borderTopLeftRadius: ModernTheme.borderRadius.xl,
    borderTopRightRadius: ModernTheme.borderRadius.xl,
    overflow: 'hidden',
  },
  panelBlur: {
    flex: 1,
  },
  panelGradient: {
    flex: 1,
    borderTopLeftRadius: ModernTheme.borderRadius.xl,
    borderTopRightRadius: ModernTheme.borderRadius.xl,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: ModernTheme.colors.border.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ModernTheme.spacing.lg,
    paddingVertical: ModernTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: ModernTheme.colors.border.secondary,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ModernTheme.spacing.sm,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ModernTheme.spacing.sm,
  },
  title: {
    fontSize: ModernTheme.typography.sizes.xl,
    fontWeight: ModernTheme.typography.weights.bold,
    color: ModernTheme.colors.text.primary,
    fontFamily: ModernTheme.typography.fonts.primary,
  },
  clearButton: {
    paddingHorizontal: ModernTheme.spacing.sm,
    paddingVertical: ModernTheme.spacing.xs,
    borderRadius: ModernTheme.borderRadius.sm,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  clearButtonText: {
    fontSize: ModernTheme.typography.sizes.sm,
    fontWeight: ModernTheme.typography.weights.medium,
    color: ModernTheme.colors.error[400],
    fontFamily: ModernTheme.typography.fonts.primary,
  },
  closeButton: {
    padding: ModernTheme.spacing.xs,
  },
  content: {
    flex: 1,
    paddingHorizontal: ModernTheme.spacing.lg,
  },
  section: {
    marginVertical: ModernTheme.spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: ModernTheme.spacing.sm,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ModernTheme.spacing.sm,
  },
  sectionTitle: {
    fontSize: ModernTheme.typography.sizes.lg,
    fontWeight: ModernTheme.typography.weights.semibold,
    color: ModernTheme.colors.text.primary,
    fontFamily: ModernTheme.typography.fonts.primary,
  },
  sectionContent: {
    paddingLeft: ModernTheme.spacing.xl,
    paddingBottom: ModernTheme.spacing.sm,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ModernTheme.spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ModernTheme.spacing.sm,
    paddingVertical: ModernTheme.spacing.xs,
    borderRadius: ModernTheme.borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    gap: ModernTheme.spacing.xs,
  },
  chipSelected: {
    backgroundColor: ModernTheme.colors.primary[500],
    borderColor: ModernTheme.colors.primary[400],
  },
  chipIcon: {
    marginRight: 2,
  },
  chipText: {
    fontSize: ModernTheme.typography.sizes.sm,
    fontWeight: ModernTheme.typography.weights.medium,
    color: ModernTheme.colors.text.secondary,
    fontFamily: ModernTheme.typography.fonts.primary,
  },
  chipTextSelected: {
    color: '#fff',
  },
  customInput: {
    marginTop: ModernTheme.spacing.xs,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: ModernTheme.colors.border.secondary,
    borderRadius: ModernTheme.borderRadius.md,
    paddingHorizontal: ModernTheme.spacing.md,
    paddingVertical: ModernTheme.spacing.sm,
    fontSize: ModernTheme.typography.sizes.md,
    color: ModernTheme.colors.text.primary,
    fontFamily: ModernTheme.typography.fonts.primary,
  },
});

export default StreamFilters;