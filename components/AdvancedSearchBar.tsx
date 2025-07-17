/**
 * Advanced Search Bar Component
 * Provides intelligent search with auto-complete, suggestions, and history
 */

import { LinearGradient } from 'expo-linear-gradient';
import { Search, X, Clock, TrendingUp, Hash, Filter, ArrowUpRight } from 'lucide-react-native';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Text,
  ScrollView,
  Keyboard,
  Platform,
} from 'react-native';
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
import { searchService, SearchSuggestion, SearchFilters } from '@/services/searchService';
import { ModernTheme } from '@/theme/modernTheme';
import { HapticFeedback } from '@/utils/haptics';
import { BlurViewFallback as BlurView } from './BlurViewFallback';

interface AdvancedSearchBarProps {
  onSearch: (filters: SearchFilters) => void;
  onFiltersChange?: (filters: SearchFilters) => void;
  placeholder?: string;
  showFilters?: boolean;
  autoFocus?: boolean;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export const AdvancedSearchBar: React.FC<AdvancedSearchBarProps> = ({
  onSearch,
  onFiltersChange,
  placeholder = 'Search streams, games, or creators...',
  showFilters = true,
  autoFocus = false,
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    sortBy: 'relevance',
  });

  const inputRef = useRef<TextInput>(null);
  const suggestionsTimeoutRef = useRef<NodeJS.Timeout>();

  // Animation values
  const searchBarScale = useSharedValue(1);
  const suggestionsHeight = useSharedValue(0);
  const filterIconRotation = useSharedValue(0);

  // Auto-focus on mount if specified
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  // Handle query changes with debounced suggestions
  const handleQueryChange = useCallback(
    async (text: string) => {
      setQuery(text);

      // Update filters
      const newFilters = { ...filters, query: text };
      setFilters(newFilters);
      onFiltersChange?.(newFilters);

      // Clear previous timeout
      if (suggestionsTimeoutRef.current) {
        clearTimeout(suggestionsTimeoutRef.current);
      }

      // Debounced suggestions
      if (text.length > 0) {
        suggestionsTimeoutRef.current = setTimeout(async () => {
          try {
            const newSuggestions = await searchService.getSuggestions(text);
            setSuggestions(newSuggestions);
            setShowSuggestions(true);

            // Animate suggestions height
            suggestionsHeight.value = withSpring(Math.min(newSuggestions.length * 60, 300));
          } catch (error) {
            console.error('Failed to get suggestions:', error);
          }
        }, 300);
      } else {
        // Show popular suggestions when empty
        try {
          const popularSuggestions = await searchService.getSuggestions('');
          setSuggestions(popularSuggestions);
          setShowSuggestions(true);
          suggestionsHeight.value = withSpring(Math.min(popularSuggestions.length * 60, 240));
        } catch (error) {
          console.error('Failed to get popular suggestions:', error);
        }
      }
    },
    [filters, onFiltersChange]
  );

  // Handle search submission
  const handleSearch = useCallback(() => {
    if (query.trim()) {
      HapticFeedback.light();

      // Animate search bar
      searchBarScale.value = withSpring(0.98, { damping: 20 }, () => {
        searchBarScale.value = withSpring(1);
      });

      // Hide suggestions
      setShowSuggestions(false);
      suggestionsHeight.value = withTiming(0);

      // Dismiss keyboard
      Keyboard.dismiss();

      // Perform search
      onSearch({ ...filters, query });

      // Update search service
      searchService.updateLastSearchResultCount(0); // Will be updated by parent
    }
  }, [query, filters, onSearch]);

  // Handle suggestion selection
  const handleSuggestionPress = useCallback(
    (suggestion: SearchSuggestion) => {
      HapticFeedback.light();

      setQuery(suggestion.text);
      setShowSuggestions(false);
      suggestionsHeight.value = withTiming(0);

      // Update filters and search
      const newFilters = {
        ...filters,
        query: suggestion.text,
        ...(suggestion.type === 'category' && { category: suggestion.text }),
      };
      setFilters(newFilters);
      onSearch(newFilters);

      Keyboard.dismiss();
    },
    [filters, onSearch]
  );

  // Handle clear query
  const handleClear = useCallback(() => {
    HapticFeedback.light();
    setQuery('');
    setShowSuggestions(false);
    suggestionsHeight.value = withTiming(0);

    const newFilters = { ...filters, query: '' };
    setFilters(newFilters);
    onFiltersChange?.(newFilters);

    inputRef.current?.focus();
  }, [filters, onFiltersChange]);

  // Handle focus
  const handleFocus = useCallback(async () => {
    if (query.length === 0) {
      try {
        const popularSuggestions = await searchService.getSuggestions('');
        setSuggestions(popularSuggestions);
        setShowSuggestions(true);
        suggestionsHeight.value = withSpring(Math.min(popularSuggestions.length * 60, 240));
      } catch (error) {
        console.error('Failed to get popular suggestions on focus:', error);
      }
    }
  }, [query]);

  // Handle blur
  const handleBlur = useCallback(() => {
    // Delay hiding suggestions to allow for suggestion taps
    setTimeout(() => {
      setShowSuggestions(false);
      suggestionsHeight.value = withTiming(0);
    }, 150);
  }, []);

  // Get suggestion icon
  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'query':
        return <Clock size={16} color={ModernTheme.colors.text.secondary} />;
      case 'category':
        return <Hash size={16} color={ModernTheme.colors.primary[400]} />;
      case 'tag':
        return <Hash size={16} color={ModernTheme.colors.accent[400]} />;
      default:
        return <TrendingUp size={16} color={ModernTheme.colors.success[400]} />;
    }
  };

  // Animated styles
  const searchBarStyle = useAnimatedStyle(() => ({
    transform: [{ scale: searchBarScale.value }],
  }));

  const suggestionsStyle = useAnimatedStyle(() => ({
    height: suggestionsHeight.value,
    opacity: suggestionsHeight.value / 300,
  }));

  const filterIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${filterIconRotation.value}deg` }],
  }));

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <Animated.View style={[styles.searchBarContainer, searchBarStyle]}>
        <BlurView style={styles.searchBarBlur} blurType="dark" blurAmount={20}>
          <LinearGradient
            colors={['rgba(0, 0, 0, 0.8)', 'rgba(0, 0, 0, 0.6)']}
            style={styles.searchBarGradient}
          >
            <View style={styles.searchBar}>
              <Search size={20} color={ModernTheme.colors.text.secondary} />

              <TextInput
                ref={inputRef}
                style={styles.searchInput}
                placeholder={placeholder}
                placeholderTextColor={ModernTheme.colors.text.secondary}
                value={query}
                onChangeText={handleQueryChange}
                onSubmitEditing={handleSearch}
                onFocus={handleFocus}
                onBlur={handleBlur}
                returnKeyType="search"
                autoCorrect={false}
                autoCapitalize="none"
              />

              {query.length > 0 && (
                <AnimatedTouchableOpacity
                  entering={FadeIn}
                  exiting={FadeOut}
                  onPress={handleClear}
                  style={styles.clearButton}
                >
                  <X size={18} color={ModernTheme.colors.text.secondary} />
                </AnimatedTouchableOpacity>
              )}

              {showFilters && (
                <TouchableOpacity
                  style={styles.filterButton}
                  onPress={() => {
                    HapticFeedback.light();
                    filterIconRotation.value = withSpring(filterIconRotation.value + 180, {
                      damping: 15,
                    });
                  }}
                >
                  <Animated.View style={filterIconStyle}>
                    <Filter size={18} color={ModernTheme.colors.primary[400]} />
                  </Animated.View>
                </TouchableOpacity>
              )}
            </View>
          </LinearGradient>
        </BlurView>
      </Animated.View>

      {/* Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <Animated.View style={[styles.suggestionsContainer, suggestionsStyle]}>
          <BlurView style={styles.suggestionsBlur} blurType="dark" blurAmount={15}>
            <LinearGradient
              colors={['rgba(0, 0, 0, 0.9)', 'rgba(0, 0, 0, 0.8)']}
              style={styles.suggestionsGradient}
            >
              <ScrollView
                style={styles.suggestionsList}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {suggestions.map((suggestion, index) => (
                  <AnimatedTouchableOpacity
                    key={`${suggestion.type}-${suggestion.text}-${index}`}
                    entering={SlideInDown.delay(index * 50)}
                    exiting={SlideOutUp}
                    style={styles.suggestionItem}
                    onPress={() => handleSuggestionPress(suggestion)}
                  >
                    <View style={styles.suggestionIcon}>{getSuggestionIcon(suggestion.type)}</View>

                    <View style={styles.suggestionContent}>
                      <Text style={styles.suggestionText}>{suggestion.text}</Text>
                      {suggestion.subtitle && (
                        <Text style={styles.suggestionSubtitle}>{suggestion.subtitle}</Text>
                      )}
                    </View>

                    <ArrowUpRight size={14} color={ModernTheme.colors.text.tertiary} />
                  </AnimatedTouchableOpacity>
                ))}
              </ScrollView>
            </LinearGradient>
          </BlurView>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  searchBarContainer: {
    borderRadius: ModernTheme.borderRadius.lg,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: ModernTheme.colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  searchBarBlur: {
    borderRadius: ModernTheme.borderRadius.lg,
    overflow: 'hidden',
  },
  searchBarGradient: {
    borderRadius: ModernTheme.borderRadius.lg,
    borderWidth: 1,
    borderColor: ModernTheme.colors.border.primary,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ModernTheme.spacing.md,
    paddingVertical: ModernTheme.spacing.sm,
    gap: ModernTheme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: ModernTheme.typography.sizes.md,
    color: ModernTheme.colors.text.primary,
    fontFamily: ModernTheme.typography.fonts.primary,
    fontWeight: ModernTheme.typography.weights.medium,
  },
  clearButton: {
    padding: 4,
    borderRadius: ModernTheme.borderRadius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterButton: {
    padding: 6,
    borderRadius: ModernTheme.borderRadius.sm,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 8,
    borderRadius: ModernTheme.borderRadius.lg,
    overflow: 'hidden',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    zIndex: 1001,
  },
  suggestionsBlur: {
    borderRadius: ModernTheme.borderRadius.lg,
    overflow: 'hidden',
  },
  suggestionsGradient: {
    borderRadius: ModernTheme.borderRadius.lg,
    borderWidth: 1,
    borderColor: ModernTheme.colors.border.secondary,
  },
  suggestionsList: {
    maxHeight: 300,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ModernTheme.spacing.md,
    paddingVertical: ModernTheme.spacing.sm,
    gap: ModernTheme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  suggestionIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: ModernTheme.borderRadius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionText: {
    fontSize: ModernTheme.typography.sizes.md,
    fontWeight: ModernTheme.typography.weights.medium,
    color: ModernTheme.colors.text.primary,
    fontFamily: ModernTheme.typography.fonts.primary,
  },
  suggestionSubtitle: {
    fontSize: ModernTheme.typography.sizes.sm,
    color: ModernTheme.colors.text.secondary,
    fontFamily: ModernTheme.typography.fonts.primary,
    marginTop: 2,
  },
});

export default AdvancedSearchBar;
