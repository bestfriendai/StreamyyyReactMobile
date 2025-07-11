import { UnifiedStream } from './platformService';
import { VideoAnalysis, ImageAnalysis } from './computerVisionService';
import { EmotionAnalysis } from './emotionRecognitionService';

export interface ContentGeneration {
  id: string;
  type: ContentType;
  sourceId: string;
  sourceType: 'video' | 'stream' | 'image' | 'text' | 'audio';
  generated_content: GeneratedContent;
  quality_metrics: QualityMetrics;
  optimization: OptimizationSuggestions;
  metadata: GenerationMetadata;
  timestamp: string;
}

export type ContentType = 
  | 'highlight' | 'clip' | 'summary' | 'thumbnail' | 'title' | 'description'
  | 'transcript' | 'captions' | 'tags' | 'social_post' | 'article'
  | 'promotional_material' | 'advertisement' | 'meme' | 'gif'
  | 'montage' | 'compilation' | 'trailer' | 'teaser';

export interface GeneratedContent {
  content: string | MediaContent;
  format: ContentFormat;
  variations: ContentVariation[];
  style: ContentStyle;
  target_audience: TargetAudience;
  language: string;
  tone: ContentTone;
  length: ContentLength;
}

export interface MediaContent {
  url: string;
  format: string;
  duration?: number;
  dimensions?: { width: number; height: number };
  fileSize: number;
  quality: string;
  thumbnail?: string;
  metadata: Record<string, any>;
}

export interface ContentFormat {
  primary: string;
  alternatives: string[];
  encoding: string;
  compression: string;
  container: string;
}

export interface ContentVariation {
  id: string;
  content: string | MediaContent;
  variation_type: VariationType;
  score: number;
  target_use_case: string;
  optimization_focus: string[];
}

export type VariationType = 
  | 'length' | 'style' | 'tone' | 'format' | 'audience' 
  | 'platform' | 'timing' | 'engagement' | 'accessibility';

export interface ContentStyle {
  style_name: string;
  characteristics: StyleCharacteristic[];
  emotional_tone: string;
  visual_elements?: VisualElements;
  narrative_structure?: NarrativeStructure;
}

export interface StyleCharacteristic {
  attribute: string;
  value: string | number;
  confidence: number;
}

export interface VisualElements {
  color_scheme: string[];
  font_style: string;
  layout: string;
  graphics: string[];
  effects: string[];
}

export interface NarrativeStructure {
  structure_type: 'linear' | 'non_linear' | 'circular' | 'episodic';
  pacing: 'slow' | 'medium' | 'fast' | 'variable';
  perspective: 'first_person' | 'third_person' | 'omniscient';
  climax_timing: number;
  resolution_style: string;
}

export interface TargetAudience {
  primary: AudienceSegment;
  secondary: AudienceSegment[];
  demographics: Demographics;
  psychographics: Psychographics;
  platform_preferences: PlatformPreference[];
}

export interface AudienceSegment {
  name: string;
  size: number;
  characteristics: string[];
  preferences: string[];
  behavior_patterns: string[];
}

export interface Demographics {
  age_range: { min: number; max: number };
  gender_distribution: { male: number; female: number; other: number };
  geographic_distribution: { region: string; percentage: number }[];
  income_level: string;
  education_level: string;
}

export interface Psychographics {
  interests: string[];
  values: string[];
  lifestyle: string;
  personality_traits: string[];
  content_consumption_habits: string[];
}

export interface PlatformPreference {
  platform: string;
  engagement_level: number;
  content_format_preference: string[];
  optimal_timing: string[];
}

export interface ContentTone {
  primary_tone: string;
  emotional_undertones: string[];
  formality: 'formal' | 'informal' | 'casual' | 'professional';
  energy_level: 'low' | 'medium' | 'high' | 'very_high';
  personality_traits: string[];
}

export interface ContentLength {
  target_duration?: number;
  word_count?: number;
  character_count?: number;
  optimal_range: { min: number; max: number };
  platform_optimal: { platform: string; length: number }[];
}

export interface QualityMetrics {
  overall_score: number;
  component_scores: ComponentScore[];
  engagement_prediction: EngagementPrediction;
  viral_potential: ViralPotential;
  accessibility: AccessibilityScore;
  brand_safety: BrandSafetyScore;
}

export interface ComponentScore {
  component: string;
  score: number;
  weight: number;
  feedback: string;
  improvement_suggestions: string[];
}

export interface EngagementPrediction {
  predicted_engagement: number;
  confidence: number;
  factors: EngagementFactor[];
  platform_specific: { platform: string; engagement: number }[];
  time_based: { timeframe: string; engagement: number }[];
}

export interface EngagementFactor {
  factor: string;
  impact: number;
  confidence: number;
  explanation: string;
}

export interface ViralPotential {
  viral_score: number;
  shareability: number;
  meme_potential: number;
  trending_probability: number;
  viral_factors: ViralFactor[];
}

export interface ViralFactor {
  factor: string;
  strength: number;
  context: string;
  historical_evidence: string[];
}

export interface AccessibilityScore {
  overall_score: number;
  visual_accessibility: number;
  auditory_accessibility: number;
  cognitive_accessibility: number;
  motor_accessibility: number;
  compliance: ComplianceCheck[];
}

export interface ComplianceCheck {
  standard: string;
  compliance_level: 'full' | 'partial' | 'none';
  issues: string[];
  recommendations: string[];
}

export interface BrandSafetyScore {
  safety_score: number;
  risk_factors: RiskFactor[];
  content_rating: ContentRating;
  advertiser_friendly: boolean;
  monetization_safe: boolean;
}

export interface RiskFactor {
  risk: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  probability: number;
  mitigation: string[];
}

export interface ContentRating {
  overall_rating: string;
  violence: number;
  adult_content: number;
  language: number;
  substance_use: number;
  controversial_topics: number;
}

export interface OptimizationSuggestions {
  priority_improvements: PriorityImprovement[];
  platform_optimizations: PlatformOptimization[];
  audience_optimizations: AudienceOptimization[];
  seo_recommendations: SEORecommendation[];
  monetization_optimizations: MonetizationOptimization[];
}

export interface PriorityImprovement {
  improvement: string;
  impact: number;
  effort: number;
  timeline: string;
  implementation: string[];
  expected_outcome: string;
}

export interface PlatformOptimization {
  platform: string;
  recommendations: string[];
  format_suggestions: string[];
  timing_suggestions: string[];
  engagement_strategies: string[];
}

export interface AudienceOptimization {
  audience_segment: string;
  customizations: string[];
  content_adjustments: string[];
  delivery_strategies: string[];
  engagement_tactics: string[];
}

export interface SEORecommendation {
  category: 'title' | 'description' | 'tags' | 'thumbnail' | 'metadata';
  recommendation: string;
  keywords: string[];
  expected_impact: number;
  competition_level: string;
}

export interface MonetizationOptimization {
  strategy: string;
  revenue_potential: number;
  implementation_complexity: number;
  requirements: string[];
  timeline: string;
}

export interface GenerationMetadata {
  algorithm: string;
  model_version: string;
  processing_time: number;
  confidence: number;
  source_analysis: SourceAnalysis;
  generation_parameters: GenerationParameters;
  quality_checks: QualityCheck[];
}

export interface SourceAnalysis {
  content_type: string;
  quality: number;
  suitability: number;
  key_features: string[];
  limitations: string[];
  processing_notes: string[];
}

export interface GenerationParameters {
  creativity: number;
  accuracy: number;
  diversity: number;
  safety: number;
  optimization_focus: string[];
  constraints: string[];
}

export interface QualityCheck {
  check_type: string;
  passed: boolean;
  score: number;
  details: string;
  recommendations: string[];
}

export interface AutoHighlight {
  id: string;
  sourceId: string;
  highlights: HighlightSegment[];
  compilation: MediaContent;
  theme: HighlightTheme;
  music: MusicSelection;
  transitions: TransitionEffect[];
  branding: BrandingElements;
  metadata: HighlightMetadata;
}

export interface HighlightSegment {
  start: number;
  end: number;
  type: HighlightType;
  score: number;
  description: string;
  emotions: string[];
  key_moments: KeyMoment[];
  visual_appeal: number;
  audio_quality: number;
}

export type HighlightType = 
  | 'epic_moment' | 'funny_moment' | 'emotional_moment' | 'skill_display'
  | 'interaction' | 'reaction' | 'achievement' | 'surprise' | 'dramatic'
  | 'educational' | 'social' | 'creative' | 'technical';

export interface KeyMoment {
  timestamp: number;
  type: string;
  intensity: number;
  description: string;
  visual_elements: string[];
  audio_elements: string[];
}

export interface HighlightTheme {
  name: string;
  style: string;
  mood: string;
  color_palette: string[];
  visual_effects: VisualEffect[];
  pacing: string;
}

export interface VisualEffect {
  effect: string;
  intensity: number;
  duration: number;
  timing: string;
  parameters: Record<string, any>;
}

export interface MusicSelection {
  track: string;
  mood: string;
  energy: number;
  sync_points: SyncPoint[];
  volume_curve: VolumeCurve[];
  copyright_status: string;
}

export interface SyncPoint {
  music_time: number;
  video_time: number;
  sync_type: 'beat' | 'drop' | 'crescendo' | 'silence';
  intensity: number;
}

export interface VolumeCurve {
  timestamp: number;
  volume: number;
  fade_duration: number;
}

export interface TransitionEffect {
  type: string;
  duration: number;
  style: string;
  parameters: Record<string, any>;
  sync_audio: boolean;
}

export interface BrandingElements {
  logo_placement: LogoPlacement[];
  watermark: WatermarkSettings;
  intro: MediaContent;
  outro: MediaContent;
  color_scheme: string[];
}

export interface LogoPlacement {
  timestamp: number;
  position: { x: number; y: number };
  size: number;
  opacity: number;
  duration: number;
}

export interface WatermarkSettings {
  enabled: boolean;
  position: string;
  opacity: number;
  size: number;
  content: string;
}

export interface HighlightMetadata {
  total_duration: number;
  segments_count: number;
  dominant_emotions: string[];
  engagement_score: number;
  viral_potential: number;
  processing_time: number;
}

export interface AutoSummary {
  id: string;
  sourceId: string;
  summary_type: SummaryType;
  content: SummaryContent;
  key_points: KeyPoint[];
  timeline: TimelineEvent[];
  participants: Participant[];
  topics: TopicSummary[];
  sentiment: SentimentSummary;
  metadata: SummaryMetadata;
}

export type SummaryType = 
  | 'extractive' | 'abstractive' | 'bullet_points' | 'timeline'
  | 'highlights' | 'key_moments' | 'participant_focus' | 'topic_focus';

export interface SummaryContent {
  text: string;
  formatted_text: string;
  audio?: MediaContent;
  video?: MediaContent;
  infographic?: MediaContent;
  word_cloud?: MediaContent;
}

export interface KeyPoint {
  point: string;
  importance: number;
  timestamp?: number;
  evidence: string[];
  related_topics: string[];
  sentiment: string;
}

export interface TimelineEvent {
  timestamp: number;
  event: string;
  importance: number;
  participants: string[];
  topics: string[];
  emotions: string[];
}

export interface Participant {
  name: string;
  role: string;
  contribution: number;
  key_moments: number[];
  sentiment: string;
  topics: string[];
}

export interface TopicSummary {
  topic: string;
  coverage: number;
  sentiment: string;
  key_points: string[];
  participants: string[];
  timeline: number[];
}

export interface SentimentSummary {
  overall: string;
  progression: SentimentProgression[];
  by_participant: { participant: string; sentiment: string }[];
  by_topic: { topic: string; sentiment: string }[];
}

export interface SentimentProgression {
  timestamp: number;
  sentiment: string;
  intensity: number;
  triggers: string[];
}

export interface SummaryMetadata {
  source_duration: number;
  compression_ratio: number;
  accuracy_score: number;
  coverage_score: number;
  readability_score: number;
  processing_time: number;
}

export interface TitleGeneration {
  id: string;
  sourceId: string;
  titles: GeneratedTitle[];
  optimization: TitleOptimization;
  testing: TitleTesting;
  metadata: TitleMetadata;
}

export interface GeneratedTitle {
  title: string;
  type: TitleType;
  style: string;
  hook_strength: number;
  seo_score: number;
  click_prediction: number;
  engagement_prediction: number;
  viral_potential: number;
  character_count: number;
  keywords: string[];
}

export type TitleType = 
  | 'descriptive' | 'emotional' | 'question' | 'list' | 'how_to'
  | 'controversial' | 'urgent' | 'curiosity' | 'benefit' | 'story';

export interface TitleOptimization {
  platform_specific: { platform: string; optimal_title: string }[];
  audience_specific: { audience: string; optimal_title: string }[];
  timing_specific: { time_context: string; optimal_title: string }[];
  seo_optimized: string[];
}

export interface TitleTesting {
  ab_test_candidates: string[];
  predicted_winners: { title: string; confidence: number }[];
  testing_recommendations: string[];
  success_metrics: string[];
}

export interface TitleMetadata {
  generation_algorithm: string;
  source_analysis: string[];
  creativity_level: number;
  safety_checks: string[];
  processing_time: number;
}

class ContentGenerationService {
  private readonly baseUrl = process.env.EXPO_PUBLIC_AI_API_URL || 'https://api.streammulti.com/generate';
  private readonly apiKey = process.env.EXPO_PUBLIC_AI_API_KEY || '';
  private readonly cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly cacheTimeout = 15 * 60 * 1000; // 15 minutes for generated content
  private generationQueue: Map<string, ContentGeneration> = new Map();

  constructor() {
    console.log('Content Generation Service initialized');
    this.startQueueProcessor();
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const cacheKey = `${endpoint}_${JSON.stringify(options)}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`Content Generation API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    this.cache.set(cacheKey, { data, timestamp: Date.now() });
    
    return data;
  }

  /**
   * Generate automatic highlights from video content
   */
  async generateHighlights(
    sourceId: string,
    sourceType: 'video' | 'stream',
    options?: {
      maxHighlights?: number;
      minDuration?: number;
      maxDuration?: number;
      theme?: string;
      targetAudience?: string;
      includeMusic?: boolean;
      includeBranding?: boolean;
    }
  ): Promise<AutoHighlight> {
    console.log('✨ Generating highlights for:', sourceId);
    
    try {
      const startTime = Date.now();
      
      const highlights = await this.makeRequest<AutoHighlight>('/highlights/generate', {
        method: 'POST',
        body: JSON.stringify({
          sourceId,
          sourceType,
          options: {
            maxHighlights: options?.maxHighlights ?? 10,
            minDuration: options?.minDuration ?? 5,
            maxDuration: options?.maxDuration ?? 30,
            theme: options?.theme ?? 'auto',
            targetAudience: options?.targetAudience ?? 'general',
            includeMusic: options?.includeMusic ?? true,
            includeBranding: options?.includeBranding ?? true,
            qualityThreshold: 0.7,
            emotionalIntensity: 0.8,
            visualAppeal: 0.7
          }
        })
      });

      highlights.metadata.processing_time = Date.now() - startTime;
      
      console.log('✅ Highlights generated:', highlights.highlights.length, 'segments');
      return highlights;
      
    } catch (error) {
      console.error('❌ Failed to generate highlights:', error);
      throw error;
    }
  }

  /**
   * Generate automatic content summary
   */
  async generateSummary(
    sourceId: string,
    sourceType: 'video' | 'stream' | 'chat' | 'text',
    summaryType: SummaryType,
    options?: {
      maxLength?: number;
      includeTimeline?: boolean;
      includeParticipants?: boolean;
      includeTopics?: boolean;
      format?: 'text' | 'audio' | 'video' | 'infographic';
    }
  ): Promise<AutoSummary> {
    console.log('📝 Generating summary for:', sourceId, 'type:', summaryType);
    
    try {
      const summary = await this.makeRequest<AutoSummary>('/summary/generate', {
        method: 'POST',
        body: JSON.stringify({
          sourceId,
          sourceType,
          summaryType,
          options: {
            maxLength: options?.maxLength ?? 500,
            includeTimeline: options?.includeTimeline ?? true,
            includeParticipants: options?.includeParticipants ?? true,
            includeTopics: options?.includeTopics ?? true,
            format: options?.format ?? 'text',
            comprehensiveness: 0.8,
            accuracy: 0.9,
            readability: 0.8
          }
        })
      });
      
      console.log('✅ Summary generated, compression ratio:', summary.metadata.compression_ratio);
      return summary;
      
    } catch (error) {
      console.error('❌ Failed to generate summary:', error);
      throw error;
    }
  }

  /**
   * Generate optimized titles
   */
  async generateTitles(
    sourceId: string,
    sourceMetadata: {
      content: string;
      category: string;
      tags: string[];
      duration?: number;
      description?: string;
    },
    options?: {
      count?: number;
      style?: string[];
      targetPlatform?: string;
      targetAudience?: string;
      includeEmojis?: boolean;
      maxLength?: number;
    }
  ): Promise<TitleGeneration> {
    console.log('💡 Generating titles for:', sourceId);
    
    try {
      const titles = await this.makeRequest<TitleGeneration>('/titles/generate', {
        method: 'POST',
        body: JSON.stringify({
          sourceId,
          sourceMetadata,
          options: {
            count: options?.count ?? 20,
            style: options?.style ?? ['descriptive', 'emotional', 'curiosity', 'benefit'],
            targetPlatform: options?.targetPlatform ?? 'universal',
            targetAudience: options?.targetAudience ?? 'general',
            includeEmojis: options?.includeEmojis ?? false,
            maxLength: options?.maxLength ?? 60,
            creativityLevel: 0.7,
            hookStrength: 0.8,
            seoOptimization: true
          }
        })
      });
      
      console.log('✅ Titles generated:', titles.titles.length, 'variations');
      return titles;
      
    } catch (error) {
      console.error('❌ Failed to generate titles:', error);
      throw error;
    }
  }

  /**
   * Generate content descriptions
   */
  async generateDescription(
    sourceId: string,
    sourceType: 'video' | 'stream' | 'image',
    options?: {
      maxLength?: number;
      style?: 'formal' | 'casual' | 'professional' | 'creative';
      includeKeywords?: boolean;
      includeCallToAction?: boolean;
      targetPlatform?: string;
    }
  ): Promise<{
    descriptions: {
      description: string;
      style: string;
      length: number;
      seo_score: number;
      engagement_prediction: number;
      keywords: string[];
    }[];
    metadata: {
      source_analysis: string[];
      generation_time: number;
      confidence: number;
    };
  }> {
    console.log('📄 Generating descriptions for:', sourceId);
    
    try {
      const descriptions = await this.makeRequest<{
        descriptions: {
          description: string;
          style: string;
          length: number;
          seo_score: number;
          engagement_prediction: number;
          keywords: string[];
        }[];
        metadata: {
          source_analysis: string[];
          generation_time: number;
          confidence: number;
        };
      }>('/descriptions/generate', {
        method: 'POST',
        body: JSON.stringify({
          sourceId,
          sourceType,
          options: {
            maxLength: options?.maxLength ?? 300,
            style: options?.style ?? 'casual',
            includeKeywords: options?.includeKeywords ?? true,
            includeCallToAction: options?.includeCallToAction ?? true,
            targetPlatform: options?.targetPlatform ?? 'universal',
            variationCount: 5,
            optimizeForSEO: true,
            optimizeForEngagement: true
          }
        })
      });
      
      console.log('✅ Descriptions generated:', descriptions.descriptions.length, 'variations');
      return descriptions;
      
    } catch (error) {
      console.error('❌ Failed to generate descriptions:', error);
      throw error;
    }
  }

  /**
   * Generate social media posts
   */
  async generateSocialPosts(
    sourceId: string,
    platforms: string[],
    options?: {
      tone?: string;
      includeHashtags?: boolean;
      includeEmojis?: boolean;
      maxLength?: number;
      campaignType?: string;
    }
  ): Promise<{
    posts: {
      platform: string;
      content: string;
      hashtags: string[];
      engagement_prediction: number;
      optimal_timing: string[];
      character_count: number;
    }[];
    cross_platform_strategy: {
      consistency_score: number;
      adaptation_notes: string[];
      timing_coordination: string[];
    };
  }> {
    console.log('📱 Generating social posts for:', platforms.join(', '));
    
    try {
      const posts = await this.makeRequest<{
        posts: {
          platform: string;
          content: string;
          hashtags: string[];
          engagement_prediction: number;
          optimal_timing: string[];
          character_count: number;
        }[];
        cross_platform_strategy: {
          consistency_score: number;
          adaptation_notes: string[];
          timing_coordination: string[];
        };
      }>('/social/generate', {
        method: 'POST',
        body: JSON.stringify({
          sourceId,
          platforms,
          options: {
            tone: options?.tone ?? 'engaging',
            includeHashtags: options?.includeHashtags ?? true,
            includeEmojis: options?.includeEmojis ?? true,
            maxLength: options?.maxLength ?? 280,
            campaignType: options?.campaignType ?? 'promotional',
            optimizeForEngagement: true,
            includeCallToAction: true,
            brandConsistency: true
          }
        })
      });
      
      console.log('✅ Social posts generated for', posts.posts.length, 'platforms');
      return posts;
      
    } catch (error) {
      console.error('❌ Failed to generate social posts:', error);
      throw error;
    }
  }

  /**
   * Generate automated transcripts with timestamps
   */
  async generateTranscript(
    sourceId: string,
    options?: {
      includeTimestamps?: boolean;
      includeSpeakerLabels?: boolean;
      includeEmotions?: boolean;
      format?: 'srt' | 'vtt' | 'txt' | 'json';
      language?: string;
    }
  ): Promise<{
    transcript: string;
    segments: {
      start: number;
      end: number;
      text: string;
      speaker?: string;
      confidence: number;
      emotions?: string[];
    }[];
    metadata: {
      duration: number;
      word_count: number;
      speaker_count: number;
      accuracy: number;
      processing_time: number;
    };
  }> {
    console.log('🎤 Generating transcript for:', sourceId);
    
    try {
      const transcript = await this.makeRequest<{
        transcript: string;
        segments: {
          start: number;
          end: number;
          text: string;
          speaker?: string;
          confidence: number;
          emotions?: string[];
        }[];
        metadata: {
          duration: number;
          word_count: number;
          speaker_count: number;
          accuracy: number;
          processing_time: number;
        };
      }>('/transcript/generate', {
        method: 'POST',
        body: JSON.stringify({
          sourceId,
          options: {
            includeTimestamps: options?.includeTimestamps ?? true,
            includeSpeakerLabels: options?.includeSpeakerLabels ?? true,
            includeEmotions: options?.includeEmotions ?? true,
            format: options?.format ?? 'srt',
            language: options?.language ?? 'auto',
            punctuation: true,
            formatting: true,
            confidenceThreshold: 0.8
          }
        })
      });
      
      console.log('✅ Transcript generated:', transcript.metadata.word_count, 'words');
      return transcript;
      
    } catch (error) {
      console.error('❌ Failed to generate transcript:', error);
      throw error;
    }
  }

  /**
   * Generate content tags and keywords
   */
  async generateTags(
    sourceId: string,
    sourceType: 'video' | 'stream' | 'image' | 'text',
    options?: {
      maxTags?: number;
      includeCategories?: boolean;
      includeEmotions?: boolean;
      includeSEO?: boolean;
      targetPlatform?: string;
    }
  ): Promise<{
    tags: {
      tag: string;
      relevance: number;
      popularity: number;
      category: string;
      seo_value: number;
    }[];
    categories: {
      category: string;
      confidence: number;
      subcategories: string[];
    }[];
    keywords: {
      keyword: string;
      search_volume: number;
      competition: string;
      relevance: number;
    }[];
    metadata: {
      source_analysis: string[];
      confidence: number;
      processing_time: number;
    };
  }> {
    console.log('🏷️ Generating tags for:', sourceId);
    
    try {
      const tags = await this.makeRequest<{
        tags: {
          tag: string;
          relevance: number;
          popularity: number;
          category: string;
          seo_value: number;
        }[];
        categories: {
          category: string;
          confidence: number;
          subcategories: string[];
        }[];
        keywords: {
          keyword: string;
          search_volume: number;
          competition: string;
          relevance: number;
        }[];
        metadata: {
          source_analysis: string[];
          confidence: number;
          processing_time: number;
        };
      }>('/tags/generate', {
        method: 'POST',
        body: JSON.stringify({
          sourceId,
          sourceType,
          options: {
            maxTags: options?.maxTags ?? 20,
            includeCategories: options?.includeCategories ?? true,
            includeEmotions: options?.includeEmotions ?? true,
            includeSEO: options?.includeSEO ?? true,
            targetPlatform: options?.targetPlatform ?? 'universal',
            relevanceThreshold: 0.6,
            popularityWeight: 0.3,
            seoWeight: 0.4
          }
        })
      });
      
      console.log('✅ Tags generated:', tags.tags.length, 'tags');
      return tags;
      
    } catch (error) {
      console.error('❌ Failed to generate tags:', error);
      throw error;
    }
  }

  /**
   * Generate video montage/compilation
   */
  async generateMontage(
    sourceIds: string[],
    theme: string,
    options?: {
      targetDuration?: number;
      style?: string;
      music?: string;
      transitions?: string;
      pacing?: 'slow' | 'medium' | 'fast';
    }
  ): Promise<{
    montage: MediaContent;
    segments: {
      sourceId: string;
      start: number;
      end: number;
      duration: number;
      order: number;
      transitions: string[];
    }[];
    music: MusicSelection;
    effects: VisualEffect[];
    metadata: {
      total_duration: number;
      sources_used: number;
      theme: string;
      style: string;
      processing_time: number;
    };
  }> {
    console.log('🎬 Generating montage with', sourceIds.length, 'sources');
    
    try {
      const montage = await this.makeRequest<{
        montage: MediaContent;
        segments: {
          sourceId: string;
          start: number;
          end: number;
          duration: number;
          order: number;
          transitions: string[];
        }[];
        music: MusicSelection;
        effects: VisualEffect[];
        metadata: {
          total_duration: number;
          sources_used: number;
          theme: string;
          style: string;
          processing_time: number;
        };
      }>('/montage/generate', {
        method: 'POST',
        body: JSON.stringify({
          sourceIds,
          theme,
          options: {
            targetDuration: options?.targetDuration ?? 60,
            style: options?.style ?? 'dynamic',
            music: options?.music ?? 'auto',
            transitions: options?.transitions ?? 'auto',
            pacing: options?.pacing ?? 'medium',
            quality: 'high',
            includeEffects: true,
            syncToMusic: true
          }
        })
      });
      
      console.log('✅ Montage generated:', montage.metadata.total_duration, 'seconds');
      return montage;
      
    } catch (error) {
      console.error('❌ Failed to generate montage:', error);
      throw error;
    }
  }

  /**
   * Generate promotional materials
   */
  async generatePromotionalMaterial(
    sourceId: string,
    materialType: 'trailer' | 'teaser' | 'poster' | 'banner' | 'advertisement',
    options?: {
      duration?: number;
      style?: string;
      targetAudience?: string;
      platform?: string;
      callToAction?: string;
    }
  ): Promise<{
    material: MediaContent;
    variations: MediaContent[];
    optimization: {
      platform_specific: { platform: string; material: MediaContent }[];
      audience_specific: { audience: string; material: MediaContent }[];
    };
    performance_prediction: {
      engagement: number;
      conversion: number;
      reach: number;
      viral_potential: number;
    };
  }> {
    console.log('📢 Generating promotional material:', materialType, 'for', sourceId);
    
    try {
      const material = await this.makeRequest<{
        material: MediaContent;
        variations: MediaContent[];
        optimization: {
          platform_specific: { platform: string; material: MediaContent }[];
          audience_specific: { audience: string; material: MediaContent }[];
        };
        performance_prediction: {
          engagement: number;
          conversion: number;
          reach: number;
          viral_potential: number;
        };
      }>('/promotional/generate', {
        method: 'POST',
        body: JSON.stringify({
          sourceId,
          materialType,
          options: {
            duration: options?.duration ?? 30,
            style: options?.style ?? 'engaging',
            targetAudience: options?.targetAudience ?? 'general',
            platform: options?.platform ?? 'universal',
            callToAction: options?.callToAction ?? 'auto',
            quality: 'high',
            includeVariations: true,
            optimizeForPlatforms: true
          }
        })
      });
      
      console.log('✅ Promotional material generated with', material.variations.length, 'variations');
      return material;
      
    } catch (error) {
      console.error('❌ Failed to generate promotional material:', error);
      throw error;
    }
  }

  /**
   * Batch generate content
   */
  async batchGenerateContent(
    requests: {
      sourceId: string;
      contentTypes: ContentType[];
      priority: number;
      options?: any;
    }[]
  ): Promise<{
    completed: ContentGeneration[];
    failed: { sourceId: string; error: string }[];
    processing: string[];
    queue_position: number;
  }> {
    console.log('📦 Batch generating content for', requests.length, 'sources');
    
    try {
      const result = await this.makeRequest<{
        completed: ContentGeneration[];
        failed: { sourceId: string; error: string }[];
        processing: string[];
        queue_position: number;
      }>('/batch/generate', {
        method: 'POST',
        body: JSON.stringify({
          requests,
          options: {
            maxConcurrent: 5,
            priorityOrdering: true,
            progressUpdates: true
          }
        })
      });
      
      console.log('✅ Batch generation submitted:', result.completed.length, 'completed');
      return result;
      
    } catch (error) {
      console.error('❌ Failed to batch generate content:', error);
      throw error;
    }
  }

  /**
   * Get content generation status
   */
  async getGenerationStatus(jobId: string): Promise<{
    status: 'queued' | 'processing' | 'completed' | 'failed';
    progress: number;
    estimated_completion: string;
    result?: ContentGeneration;
    error?: string;
  }> {
    console.log('📊 Getting generation status for:', jobId);
    
    try {
      const status = await this.makeRequest<{
        status: 'queued' | 'processing' | 'completed' | 'failed';
        progress: number;
        estimated_completion: string;
        result?: ContentGeneration;
        error?: string;
      }>(`/status/${jobId}`);
      
      return status;
      
    } catch (error) {
      console.error('❌ Failed to get generation status:', error);
      throw error;
    }
  }

  /**
   * Start queue processor for background content generation
   */
  private startQueueProcessor(): void {
    console.log('🔄 Starting content generation queue processor');
    
    // Process queue every 30 seconds
    setInterval(async () => {
      // Process any queued generation requests
      for (const [id, generation] of this.generationQueue) {
        try {
          const status = await this.getGenerationStatus(id);
          
          if (status.status === 'completed' && status.result) {
            this.generationQueue.delete(id);
            console.log('✅ Content generation completed:', id);
          } else if (status.status === 'failed') {
            this.generationQueue.delete(id);
            console.log('❌ Content generation failed:', id, status.error);
          }
        } catch (error) {
          console.error('Failed to check generation status:', id, error);
        }
      }
    }, 30000);
  }

  /**
   * Get generation queue status
   */
  getQueueStatus(): {
    queued: number;
    processing: number;
    completed: number;
    failed: number;
  } {
    return {
      queued: 0, // Would get from API
      processing: this.generationQueue.size,
      completed: 0,
      failed: 0
    };
  }

  /**
   * Clear generation cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('✅ Content generation cache cleared');
  }

  /**
   * Get service statistics
   */
  getServiceStatistics(): {
    cacheSize: number;
    queueSize: number;
    totalGenerations: number;
    averageProcessingTime: number;
    successRate: number;
  } {
    return {
      cacheSize: this.cache.size,
      queueSize: this.generationQueue.size,
      totalGenerations: this.cache.size,
      averageProcessingTime: 0, // Would calculate from actual data
      successRate: 0.95
    };
  }
}

export const contentGenerationService = new ContentGenerationService();
export default contentGenerationService;