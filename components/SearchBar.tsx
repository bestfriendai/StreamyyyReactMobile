import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Search, X, Sparkles } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onClear: () => void;
  placeholder?: string;
  loading?: boolean;
}

export function SearchBar({ 
  onSearch, 
  onClear, 
  placeholder = 'Search streamers...', 
  loading = false 
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const focusScale = useSharedValue(1);
  const borderOpacity = useSharedValue(0.3);
  const glowOpacity = useSharedValue(0);

  const handleSearch = (text?: string) => {
    const searchQuery = text !== undefined ? text : query;
    if (query.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  const handleClear = () => {
    setQuery('');
    onClear();
  };

  const handleFocus = () => {
    setIsFocused(true);
    focusScale.value = withSpring(1.02, { damping: 15 });
    borderOpacity.value = withTiming(1);
    glowOpacity.value = withTiming(0.6);
  };

  const handleBlur = () => {
    setIsFocused(false);
    focusScale.value = withSpring(1, { damping: 15 });
    borderOpacity.value = withTiming(0.3);
    glowOpacity.value = withTiming(0);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: focusScale.value }],
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const handleChangeText = (text: string) => {
    setQuery(text);
    if (text.length === 0) onClear();
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.searchWrapper, animatedStyle]}>
        <Animated.View style={[styles.glowEffect, animatedGlowStyle]} />
        <LinearGradient
          colors={[
            'rgba(42, 42, 42, 0.95)',
            'rgba(58, 58, 58, 0.9)',
            'rgba(42, 42, 42, 0.95)'
          ]}
          style={styles.searchContainer}
        >
          <View style={styles.searchIconContainer}>
            <Search size={20} color={isFocused ? "#8B5CF6" : "#666"} />
            {isFocused && (
              <Sparkles size={12} color="#8B5CF6" style={styles.sparkleIcon} />
            )}
          </View>
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={handleChangeText}
            placeholder={placeholder}
            placeholderTextColor="#666"
            onSubmitEditing={handleSearch}
            onFocus={handleFocus}
            onBlur={handleBlur}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
              <LinearGradient
                colors={['rgba(139, 92, 246, 0.2)', 'rgba(124, 58, 237, 0.2)']}
                style={styles.clearGradient}
              >
                <X size={16} color="#8B5CF6" />
              </LinearGradient>
            </TouchableOpacity>
          )}
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 20,
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
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: '0 0 20px rgba(139, 92, 246, 0.5)',
      },
    }),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
      },
    }),
  },
  searchIconContainer: {
    position: 'relative',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkleIcon: {
    position: 'absolute',
    top: -6,
    right: -6,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Inter-Medium',
  },
  clearButton: {
    marginLeft: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  clearGradient: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});