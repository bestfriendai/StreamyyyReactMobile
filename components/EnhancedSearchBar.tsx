import {
  Search,
  X,
  Filter,
  Clock,
  TrendingUp,
  History,
  ArrowUpRight,
  Mic,
  Camera,
  Settings,
} from 'lucide-react-native';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Text,
  FlatList,
  Keyboard,
  Dimensions,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '@/constants/Theme';
import { hapticFeedbackService } from '@/services/hapticFeedbackService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'history' | 'trending' | 'suggestion';
  category?: string;
  metadata?: any;
}

interface EnhancedSearchBarProps {
  onSearch: (query: string) => void;
  onClear: () => void;
  onFilterPress?: () => void;
  onVoiceSearch?: () => void;
  onVisualSearch?: () => void;
  placeholder?: string;
  loading?: boolean;
  showSuggestions?: boolean;
  showFilters?: boolean;
  showVoiceSearch?: boolean;
  showVisualSearch?: boolean;
  maxSuggestions?: number;
  debounceMs?: number;
  enableHistory?: boolean;
  enableAnalytics?: boolean;
  customSuggestions?: SearchSuggestion[];
  value?: string;
  onValueChange?: (value: string) => void;
}

const SEARCH_HISTORY_KEY = 'search_history';
const MAX_HISTORY_ITEMS = 10;
const DEFAULT_DEBOUNCE_MS = 300;

export const EnhancedSearchBar: React.FC<EnhancedSearchBarProps> = ({
  onSearch,
  onClear,
  onFilterPress,
  onVoiceSearch,
  onVisualSearch,
  placeholder = 'Search streamers, games, categories...',
  loading = false,
  showSuggestions = true,
  showFilters = true,
  showVoiceSearch = true,
  showVisualSearch = false,
  maxSuggestions = 8,
  debounceMs = DEFAULT_DEBOUNCE_MS,
  enableHistory = true,
  enableAnalytics = true,
  customSuggestions = [],
  value: controlledValue,
  onValueChange,
}) => {
  // State management
  const [query, setQuery] = useState(controlledValue || '');
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchSuggestion[]>([]);
  const [trendingSearches, setTrendingSearches] = useState<SearchSuggestion[]>([]);
  const [showSuggestionsPanel, setShowSuggestionsPanel] = useState(false);

  // Refs
  const inputRef = useRef<TextInput>(null);
  const debounceTimer = useRef<NodeJS.Timeout>();
  const searchAnalytics = useRef({
    sessionId: Date.now().toString(),
    searches: 0,
    suggestions_clicked: 0,
    voice_searches: 0,
    visual_searches: 0,
  });

  // Animation values
  const focusScale = useSharedValue(1);
  const borderOpacity = useSharedValue(0.3);
  const glowOpacity = useSharedValue(0);
  const suggestionsOpacity = useSharedValue(0);
  const suggestionsHeight = useSharedValue(0);
  const filterBadgeScale = useSharedValue(0);

  // Load search history on mount
  useEffect(() => {
    loadSearchHistory();
    loadTrendingSearches();
  }, []);

  // Handle controlled value changes
  useEffect(() => {
    if (controlledValue !== undefined && controlledValue !== query) {
      setQuery(controlledValue);
    }
  }, [controlledValue]);

  // Auto-suggestion generation
  useEffect(() => {
    if (query.length > 0) {
      generateSuggestions(query);
    } else {
      setSuggestions([]);
    }
  }, [query]);

  // Load search history from storage
  const loadSearchHistory = useCallback(async () => {
    try {
      const historyData = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
      if (historyData) {
        const history = JSON.parse(historyData);
        setSearchHistory(history.slice(0, MAX_HISTORY_ITEMS));
      }
    } catch (error) {
      console.error('Failed to load search history:', error);
    }
  }, []);

  // Load trending searches (mock data for now)
  const loadTrendingSearches = useCallback(() => {
    const trending: SearchSuggestion[] = [
      { id: '1', text: 'Just Chatting', type: 'trending', category: 'category' },
      { id: '2', text: 'Fortnite', type: 'trending', category: 'game' },
      { id: '3', text: 'League of Legends', type: 'trending', category: 'game' },
      { id: '4', text: 'Valorant', type: 'trending', category: 'game' },
      { id: '5', text: 'Minecraft', type: 'trending', category: 'game' },
    ];
    setTrendingSearches(trending);
  }, []);

  // Save search to history
  const saveToHistory = useCallback(
    async (searchQuery: string) => {
      if (!enableHistory || searchQuery.trim().length < 2) {return;}

      try {
        const newHistoryItem: SearchSuggestion = {
          id: Date.now().toString(),
          text: searchQuery.trim(),
          type: 'history',
          metadata: { timestamp: Date.now() },
        };

        const updatedHistory = [
          newHistoryItem,
          ...searchHistory.filter(item => item.text !== searchQuery.trim()),
        ].slice(0, MAX_HISTORY_ITEMS);

        setSearchHistory(updatedHistory);
        await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updatedHistory));
      } catch (error) {
        console.error('Failed to save search history:', error);
      }
    },
    [searchHistory, enableHistory]
  );

  // Generate suggestions based on query
  const generateSuggestions = useCallback(
    (searchQuery: string) => {
      const query_lower = searchQuery.toLowerCase();
      let generated: SearchSuggestion[] = [];

      // Add custom suggestions
      const customMatches = customSuggestions.filter(suggestion =>
        suggestion.text.toLowerCase().includes(query_lower)
      );
      generated.push(...customMatches);

      // Add history matches
      const historyMatches = searchHistory.filter(item =>
        item.text.toLowerCase().includes(query_lower)
      );
      generated.push(...historyMatches);

      // Add trending matches
      const trendingMatches = trendingSearches.filter(item =>
        item.text.toLowerCase().includes(query_lower)
      );
      generated.push(...trendingMatches);

      // Remove duplicates and limit
      const uniqueSuggestions = generated
        .filter(
          (suggestion, index, self) => index === self.findIndex(s => s.text === suggestion.text)
        )
        .slice(0, maxSuggestions);

      setSuggestions(uniqueSuggestions);
    },
    [customSuggestions, searchHistory, trendingSearches, maxSuggestions]
  );

  // Handle text input changes with debouncing
  const handleChangeText = useCallback(
    (text: string) => {
      setQuery(text);
      onValueChange?.(text);

      if (text.length === 0) {
        onClear();
        setSuggestions([]);
      }

      // Debounced search suggestions
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      if (text.length > 0) {
        debounceTimer.current = setTimeout(() => {
          // Trigger auto-search or suggestion update
        }, debounceMs);
      }
    },
    [onValueChange, onClear, debounceMs]
  );

  // Handle search submission
  const handleSearch = useCallback(
    (searchQuery?: string) => {
      const finalQuery = searchQuery || query;
      if (finalQuery.trim()) {
        hapticFeedbackService.quickFeedback('light');
        onSearch(finalQuery.trim());
        saveToHistory(finalQuery.trim());
        setShowSuggestionsPanel(false);
        Keyboard.dismiss();

        if (enableAnalytics) {
          searchAnalytics.current.searches++;
        }
      }
    },
    [query, onSearch, saveToHistory, enableAnalytics]
  );

  // Handle suggestion selection
  const handleSuggestionPress = useCallback(
    (suggestion: SearchSuggestion) => {
      hapticFeedbackService.quickFeedback('medium');
      setQuery(suggestion.text);
      onValueChange?.(suggestion.text);
      handleSearch(suggestion.text);

      if (enableAnalytics) {
        searchAnalytics.current.suggestions_clicked++;
      }
    },
    [handleSearch, onValueChange, enableAnalytics]
  );

  // Handle clear button
  const handleClear = useCallback(() => {
    hapticFeedbackService.quickFeedback('light');
    setQuery('');
    onValueChange?.('');
    onClear();
    setSuggestions([]);
    setShowSuggestionsPanel(false);
  }, [onValueChange, onClear]);

  // Handle focus events
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    focusScale.value = withSpring(1.02, { damping: 15 });
    borderOpacity.value = withTiming(1);
    glowOpacity.value = withTiming(0.6);

    if (showSuggestions && (suggestions.length > 0 || query.length === 0)) {
      setShowSuggestionsPanel(true);
      suggestionsOpacity.value = withTiming(1, { duration: 200 });
      suggestionsHeight.value = withSpring(Math.min(300, maxSuggestions * 50));
    }

    hapticFeedbackService.quickFeedback('light');
  }, [showSuggestions, suggestions.length, query.length, maxSuggestions]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    focusScale.value = withSpring(1, { damping: 15 });
    borderOpacity.value = withTiming(0.3);
    glowOpacity.value = withTiming(0);

    // Delay hiding suggestions to allow for suggestion selection
    setTimeout(() => {
      setShowSuggestionsPanel(false);
      suggestionsOpacity.value = withTiming(0, { duration: 200 });
      suggestionsHeight.value = withTiming(0, { duration: 200 });
    }, 150);
  }, []);

  // Handle voice search
  const handleVoiceSearch = useCallback(() => {
    hapticFeedbackService.quickFeedback('medium');
    onVoiceSearch?.();

    if (enableAnalytics) {
      searchAnalytics.current.voice_searches++;
    }
  }, [onVoiceSearch, enableAnalytics]);

  // Handle visual search
  const handleVisualSearch = useCallback(() => {
    hapticFeedbackService.quickFeedback('medium');
    onVisualSearch?.();

    if (enableAnalytics) {
      searchAnalytics.current.visual_searches++;
    }
  }, [onVisualSearch, enableAnalytics]);

  // Handle filter press
  const handleFilterPress = useCallback(() => {
    hapticFeedbackService.quickFeedback('medium');
    filterBadgeScale.value = withSequence(
      withSpring(1.2, { damping: 15 }),
      withSpring(1, { damping: 15 })
    );
    onFilterPress?.();
  }, [onFilterPress]);

  // Animated styles
  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: focusScale.value }],
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const animatedSuggestionsStyle = useAnimatedStyle(() => ({
    opacity: suggestionsOpacity.value,
    maxHeight: suggestionsHeight.value,
  }));

  const animatedFilterBadgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: filterBadgeScale.value }],
  }));

  // Get suggestion icon
  const getSuggestionIcon = (suggestion: SearchSuggestion) => {
    switch (suggestion.type) {
      case 'history':
        return <Clock size={16} color={Theme.colors.text.tertiary} />;
      case 'trending':
        return <TrendingUp size={16} color={Theme.colors.accent.primary} />;
      default:
        return <Search size={16} color={Theme.colors.text.tertiary} />;
    }
  };

  // Render suggestion item
  const renderSuggestion = ({ item }: { item: SearchSuggestion }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleSuggestionPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.suggestionIcon}>{getSuggestionIcon(item)}</View>
      <View style={styles.suggestionContent}>
        <Text style={styles.suggestionText} numberOfLines={1}>
          {item.text}
        </Text>
        {item.category && <Text style={styles.suggestionCategory}>{item.category}</Text>}
      </View>
      <ArrowUpRight size={14} color={Theme.colors.text.tertiary} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.searchWrapper, animatedContainerStyle]}>
        <Animated.View style={[styles.glowEffect, animatedGlowStyle]} />

        <LinearGradient colors={Theme.gradients.card} style={styles.searchContainer}>
          {/* Search Icon */}
          <View style={styles.searchIconContainer}>
            <Search
              size={20}
              color={isFocused ? Theme.colors.accent.primary : Theme.colors.text.tertiary}
            />
          </View>

          {/* Text Input */}
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={query}
            onChangeText={handleChangeText}
            placeholder={placeholder}
            placeholderTextColor={Theme.colors.text.tertiary}
            onSubmitEditing={() => handleSearch()}
            onFocus={handleFocus}
            onBlur={handleBlur}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
            selectTextOnFocus
            clearButtonMode="never"
          />

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {/* Voice Search */}
            {showVoiceSearch && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleVoiceSearch}
                activeOpacity={0.7}
              >
                <Mic size={18} color={Theme.colors.text.secondary} />
              </TouchableOpacity>
            )}

            {/* Visual Search */}
            {showVisualSearch && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleVisualSearch}
                activeOpacity={0.7}
              >
                <Camera size={18} color={Theme.colors.text.secondary} />
              </TouchableOpacity>
            )}

            {/* Clear Button */}
            {query.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClear}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['rgba(139, 92, 246, 0.2)', 'rgba(124, 58, 237, 0.2)']}
                  style={styles.clearGradient}
                >
                  <X size={16} color={Theme.colors.accent.primary} />
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* Filter Button */}
            {showFilters && (
              <Animated.View style={animatedFilterBadgeStyle}>
                <TouchableOpacity
                  style={styles.filterButton}
                  onPress={handleFilterPress}
                  activeOpacity={0.7}
                >
                  <LinearGradient colors={Theme.gradients.primary} style={styles.filterGradient}>
                    <Filter size={18} color={Theme.colors.text.primary} />
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Suggestions Panel */}
      {showSuggestionsPanel && showSuggestions && (
        <Animated.View
          entering={SlideInDown.duration(200)}
          exiting={SlideOutDown.duration(200)}
          style={[styles.suggestionsContainer, animatedSuggestionsStyle]}
        >
          <LinearGradient colors={Theme.gradients.card} style={styles.suggestionsGradient}>
            {/* Suggestions Header */}
            <View style={styles.suggestionsHeader}>
              <Text style={styles.suggestionsTitle}>
                {query.length > 0 ? 'Search Suggestions' : 'Recent & Trending'}
              </Text>
              {searchHistory.length > 0 && (
                <TouchableOpacity
                  style={styles.clearHistoryButton}
                  onPress={() => {
                    setSearchHistory([]);
                    AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
                  }}
                >
                  <Text style={styles.clearHistoryText}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Suggestions List */}
            <FlatList
              data={
                suggestions.length > 0
                  ? suggestions
                query.length === 0 ? [...searchHistory.slice(0, 3), ...trendingSearches.slice(0, 5)] : []}
              renderItem={renderSuggestion}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              style={styles.suggestionsList}
            />
          </LinearGradient>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
    position: 'relative',
    zIndex: 100,
  },
  searchWrapper: {
    position: 'relative',
  },
  glowEffect: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 18,
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    ...Platform.select({
      ios: {
        shadowColor: Theme.colors.accent.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: `0 0 20px ${Theme.colors.accent.primary}80`,
      },
    }),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Theme.radius.lg,
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Theme.colors.border.primary,
    minHeight: 52,
  },
  searchIconContainer: {
    marginRight: Theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    color: Theme.colors.text.primary,
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.regular,
    paddingVertical: 0,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
  },
  actionButton: {
    padding: Theme.spacing.xs,
    borderRadius: Theme.radius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  clearButton: {
    borderRadius: Theme.radius.sm,
    overflow: 'hidden',
  },
  clearGradient: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButton: {
    borderRadius: Theme.radius.sm,
    overflow: 'hidden',
  },
  filterGradient: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Suggestions styles
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: Theme.spacing.lg,
    right: Theme.spacing.lg,
    borderRadius: Theme.radius.lg,
    overflow: 'hidden',
    zIndex: 1000,
    marginTop: Theme.spacing.xs,
  },
  suggestionsGradient: {
    padding: Theme.spacing.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border.primary,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border.secondary,
    marginBottom: Theme.spacing.xs,
  },
  suggestionsTitle: {
    fontSize: Theme.typography.sizes.sm,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text.secondary,
  },
  clearHistoryButton: {
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
  },
  clearHistoryText: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.accent.primary,
    fontWeight: Theme.typography.weights.medium,
  },
  suggestionsList: {
    maxHeight: 250,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.radius.sm,
    marginVertical: 1,
  },
  suggestionIcon: {
    marginRight: Theme.spacing.sm,
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionText: {
    fontSize: Theme.typography.sizes.md,
    color: Theme.colors.text.primary,
    fontWeight: Theme.typography.weights.medium,
  },
  suggestionCategory: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.text.tertiary,
    marginTop: 2,
    textTransform: 'capitalize',
  },
});

export default EnhancedSearchBar;
