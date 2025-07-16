/**
 * Enhanced Search Service
 * Provides advanced search capabilities with auto-complete, history, and intelligent filtering
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { TwitchStream, TwitchGame, searchStreams, searchCategories } from './twitchApi';

export interface SearchFilters {
  query: string;
  category?: string;
  language?: string;
  minViewers?: number;
  maxViewers?: number;
  tags?: string[];
  sortBy: 'relevance' | 'viewers' | 'recent' | 'alphabetical';
}

export interface SearchSuggestion {
  type: 'stream' | 'category' | 'tag' | 'query';
  text: string;
  subtitle?: string;
  data?: any;
}

export interface SearchHistory {
  query: string;
  timestamp: number;
  resultCount: number;
}

const STORAGE_KEYS = {
  SEARCH_HISTORY: 'search_history',
  TRENDING_SEARCHES: 'trending_searches',
  SUGGESTIONS_CACHE: 'suggestions_cache',
};

class SearchService {
  private static instance: SearchService;
  private searchHistory: SearchHistory[] = [];
  private trendingSearches: string[] = [];
  private suggestionsCache: Map<string, SearchSuggestion[]> = new Map();

  private constructor() {
    this.loadSearchData();
  }

  static getInstance(): SearchService {
    if (!SearchService.instance) {
      SearchService.instance = new SearchService();
    }
    return SearchService.instance;
  }

  /**
   * Load search data from storage
   */
  private async loadSearchData(): Promise<void> {
    try {
      const [history, trending] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY),
        AsyncStorage.getItem(STORAGE_KEYS.TRENDING_SEARCHES),
      ]);

      if (history) {
        this.searchHistory = JSON.parse(history);
      }

      if (trending) {
        this.trendingSearches = JSON.parse(trending);
      }
    } catch (error) {
      console.error('Failed to load search data:', error);
    }
  }

  /**
   * Save search data to storage
   */
  private async saveSearchData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(this.searchHistory)),
        AsyncStorage.setItem(STORAGE_KEYS.TRENDING_SEARCHES, JSON.stringify(this.trendingSearches)),
      ]);
    } catch (error) {
      console.error('Failed to save search data:', error);
    }
  }

  /**
   * Perform enhanced search with filters
   */
  async search(filters: SearchFilters): Promise<{
    streams: TwitchStream[];
    categories: TwitchGame[];
    totalResults: number;
  }> {
    try {
      // Add to search history
      this.addToHistory(filters.query);

      const [streams, categories] = await Promise.all([
        this.searchStreams(filters),
        filters.query ? searchCategories(filters.query) : [],
      ]);

      const filteredStreams = this.applyFilters(streams, filters);
      const sortedStreams = this.sortResults(filteredStreams, filters.sortBy);

      return {
        streams: sortedStreams,
        categories: categories.slice(0, 10), // Limit categories
        totalResults: filteredStreams.length,
      };
    } catch (error) {
      console.error('Search failed:', error);
      throw error;
    }
  }

  /**
   * Search streams with basic query
   */
  private async searchStreams(filters: SearchFilters): Promise<TwitchStream[]> {
    if (!filters.query.trim()) {
      // Return trending streams if no query
      const { fetchTopStreams } = await import('./twitchApi');
      return fetchTopStreams(50);
    }

    return searchStreams(filters.query);
  }

  /**
   * Apply advanced filters to search results
   */
  private applyFilters(streams: TwitchStream[], filters: SearchFilters): TwitchStream[] {
    return streams.filter(stream => {
      // Viewer count filter
      if (filters.minViewers !== undefined && stream.viewer_count < filters.minViewers) {
        return false;
      }
      if (filters.maxViewers !== undefined && stream.viewer_count > filters.maxViewers) {
        return false;
      }

      // Language filter
      if (filters.language && stream.language !== filters.language) {
        return false;
      }

      // Category filter
      if (filters.category && stream.game_name !== filters.category) {
        return false;
      }

      // Tags filter
      if (filters.tags && filters.tags.length > 0) {
        const streamTags = stream.tag_ids || [];
        const hasMatchingTag = filters.tags.some(tag => 
          streamTags.includes(tag) || 
          stream.title.toLowerCase().includes(tag.toLowerCase())
        );
        if (!hasMatchingTag) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Sort search results
   */
  private sortResults(streams: TwitchStream[], sortBy: string): TwitchStream[] {
    switch (sortBy) {
      case 'viewers':
        return streams.sort((a, b) => b.viewer_count - a.viewer_count);
      case 'recent':
        return streams.sort((a, b) => 
          new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
        );
      case 'alphabetical':
        return streams.sort((a, b) => a.user_name.localeCompare(b.user_name));
      case 'relevance':
      default:
        // Basic relevance scoring
        return streams.sort((a, b) => {
          const scoreA = this.calculateRelevanceScore(a);
          const scoreB = this.calculateRelevanceScore(b);
          return scoreB - scoreA;
        });
    }
  }

  /**
   * Calculate relevance score for sorting
   */
  private calculateRelevanceScore(stream: TwitchStream): number {
    let score = 0;
    
    // Viewer count contributes to relevance
    score += Math.log(stream.viewer_count + 1) * 0.3;
    
    // Recent streams get boost
    const hoursAgo = (Date.now() - new Date(stream.started_at).getTime()) / (1000 * 60 * 60);
    score += Math.max(0, 24 - hoursAgo) * 0.1;
    
    // Popular games get slight boost
    const popularGames = ['Just Chatting', 'League of Legends', 'Fortnite', 'Valorant'];
    if (popularGames.includes(stream.game_name)) {
      score += 0.2;
    }

    return score;
  }

  /**
   * Get search suggestions based on input
   */
  async getSuggestions(query: string): Promise<SearchSuggestion[]> {
    if (query.length < 2) {
      return this.getPopularSuggestions();
    }

    // Check cache first
    if (this.suggestionsCache.has(query)) {
      return this.suggestionsCache.get(query)!;
    }

    try {
      const suggestions: SearchSuggestion[] = [];

      // Add history matches
      const historyMatches = this.searchHistory
        .filter(h => h.query.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 3)
        .map(h => ({
          type: 'query' as const,
          text: h.query,
          subtitle: `${h.resultCount} results`,
        }));

      suggestions.push(...historyMatches);

      // Add trending matches
      const trendingMatches = this.trendingSearches
        .filter(t => t.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 2)
        .map(t => ({
          type: 'query' as const,
          text: t,
          subtitle: 'Trending',
        }));

      suggestions.push(...trendingMatches);

      // Add category suggestions
      try {
        const categories = await searchCategories(query);
        const categoryMatches = categories.slice(0, 3).map(cat => ({
          type: 'category' as const,
          text: cat.name,
          subtitle: 'Category',
          data: cat,
        }));
        suggestions.push(...categoryMatches);
      } catch (error) {
        // Ignore category search errors
      }

      // Cache results
      this.suggestionsCache.set(query, suggestions);

      return suggestions;
    } catch (error) {
      console.error('Failed to get suggestions:', error);
      return this.getPopularSuggestions();
    }
  }

  /**
   * Get popular/trending suggestions
   */
  private getPopularSuggestions(): SearchSuggestion[] {
    const popularQueries = [
      'Just Chatting',
      'League of Legends',
      'Fortnite',
      'Valorant',
      'Minecraft',
      'World of Warcraft',
      'Counter-Strike',
      'Grand Theft Auto V',
    ];

    return popularQueries.map(query => ({
      type: 'query' as const,
      text: query,
      subtitle: 'Popular',
    }));
  }

  /**
   * Add query to search history
   */
  private addToHistory(query: string): void {
    if (!query.trim()) return;

    const existingIndex = this.searchHistory.findIndex(h => h.query === query);
    
    if (existingIndex >= 0) {
      // Update existing entry
      this.searchHistory[existingIndex].timestamp = Date.now();
    } else {
      // Add new entry
      this.searchHistory.unshift({
        query,
        timestamp: Date.now(),
        resultCount: 0,
      });

      // Limit history size
      if (this.searchHistory.length > 50) {
        this.searchHistory = this.searchHistory.slice(0, 50);
      }
    }

    this.saveSearchData();
  }

  /**
   * Update result count for last search
   */
  updateLastSearchResultCount(count: number): void {
    if (this.searchHistory.length > 0) {
      this.searchHistory[0].resultCount = count;
      this.saveSearchData();
    }
  }

  /**
   * Get search history
   */
  getSearchHistory(): SearchHistory[] {
    return this.searchHistory.slice(0, 10);
  }

  /**
   * Clear search history
   */
  async clearSearchHistory(): Promise<void> {
    this.searchHistory = [];
    await this.saveSearchData();
  }

  /**
   * Get trending searches
   */
  getTrendingSearches(): string[] {
    return this.trendingSearches;
  }

  /**
   * Update trending searches (called periodically)
   */
  updateTrendingSearches(trending: string[]): void {
    this.trendingSearches = trending;
    this.saveSearchData();
  }

  /**
   * Clear suggestions cache
   */
  clearSuggestionsCache(): void {
    this.suggestionsCache.clear();
  }
}

export const searchService = SearchService.getInstance();
export default searchService;