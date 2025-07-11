import { UnifiedStream } from './platformService';
import { ImageAnalysis } from './computerVisionService';

export interface GenerativeRequest {
  id: string;
  type: GenerationType;
  input: GenerationInput;
  parameters: GenerationParameters;
  constraints: GenerationConstraints;
  options: GenerationOptions;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  created_at: string;
  completed_at?: string;
}

export type GenerationType = 
  | 'thumbnail' | 'title' | 'description' | 'logo' | 'banner' | 'avatar'
  | 'icon' | 'background' | 'overlay' | 'graphic' | 'animation' | 'video'
  | 'audio' | 'music' | 'voiceover' | 'text' | 'code' | 'layout' | 'ui_component';

export interface GenerationInput {
  text_prompt?: string;
  image_references?: string[];
  style_references?: string[];
  brand_guidelines?: BrandGuidelines;
  content_context?: ContentContext;
  technical_specs?: TechnicalSpecs;
  creative_brief?: CreativeBrief;
}

export interface BrandGuidelines {
  colors: ColorPalette;
  typography: TypographyGuidelines;
  imagery: ImageryGuidelines;
  tone: ToneGuidelines;
  logo_usage: LogoUsageGuidelines;
  restrictions: BrandRestriction[];
}

export interface ColorPalette {
  primary: string[];
  secondary: string[];
  accent: string[];
  neutral: string[];
  gradients: Gradient[];
  color_harmony: 'monochromatic' | 'analogous' | 'complementary' | 'triadic' | 'split_complementary';
}

export interface Gradient {
  name: string;
  colors: string[];
  direction: string;
  stops: GradientStop[];
}

export interface GradientStop {
  color: string;
  position: number;
  opacity?: number;
}

export interface TypographyGuidelines {
  primary_font: FontDefinition;
  secondary_font: FontDefinition;
  heading_styles: HeadingStyle[];
  body_styles: BodyStyle[];
  special_fonts: FontDefinition[];
  font_pairing_rules: FontPairingRule[];
}

export interface FontDefinition {
  family: string;
  weights: number[];
  styles: string[];
  fallbacks: string[];
  usage_context: string[];
}

export interface HeadingStyle {
  level: number;
  font_family: string;
  font_size: string;
  font_weight: number;
  line_height: number;
  letter_spacing: number;
  color: string;
}

export interface BodyStyle {
  name: string;
  font_family: string;
  font_size: string;
  font_weight: number;
  line_height: number;
  color: string;
  usage: string;
}

export interface FontPairingRule {
  primary_font: string;
  secondary_font: string;
  relationship: string;
  usage_guidelines: string[];
}

export interface ImageryGuidelines {
  style: ImageStyle;
  subjects: string[];
  moods: string[];
  composition_rules: CompositionRule[];
  color_treatment: ColorTreatment;
  technical_requirements: ImageTechnicalReqs;
}

export interface ImageStyle {
  aesthetic: string;
  photography_style: string;
  illustration_style: string;
  iconography_style: string;
  treatment: string;
}

export interface CompositionRule {
  rule: string;
  description: string;
  examples: string[];
  weight: number;
}

export interface ColorTreatment {
  saturation: string;
  contrast: string;
  brightness: string;
  filters: string[];
  overlays: string[];
}

export interface ImageTechnicalReqs {
  min_resolution: { width: number; height: number };
  max_file_size: number;
  preferred_formats: string[];
  color_space: string;
  compression_quality: number;
}

export interface ToneGuidelines {
  voice: VoiceCharacteristics;
  personality: PersonalityTrait[];
  communication_style: CommunicationStyleGuide;
  do_and_donts: DoAndDont[];
}

export interface VoiceCharacteristics {
  descriptors: string[];
  tone_attributes: ToneAttribute[];
  emotional_range: EmotionalRange;
  formality_level: number;
}

export interface ToneAttribute {
  attribute: string;
  intensity: number;
  context: string[];
}

export interface EmotionalRange {
  primary_emotions: string[];
  emotional_intensity: number;
  emotional_consistency: number;
  contextual_adaptation: boolean;
}

export interface CommunicationStyleGuide {
  sentence_structure: string;
  vocabulary_level: string;
  technical_language: boolean;
  humor_usage: string;
  cultural_sensitivity: string[];
}

export interface DoAndDont {
  category: string;
  do: string[];
  dont: string[];
  examples: { do: string; dont: string }[];
}

export interface LogoUsageGuidelines {
  minimum_size: { width: number; height: number };
  clear_space: number;
  placement_rules: PlacementRule[];
  color_variations: LogoColorVariation[];
  usage_restrictions: string[];
}

export interface PlacementRule {
  context: string;
  preferred_positions: string[];
  size_guidelines: string;
  spacing_requirements: string;
}

export interface LogoColorVariation {
  name: string;
  usage_context: string[];
  color_specifications: string[];
  background_requirements: string[];
}

export interface BrandRestriction {
  category: string;
  restriction: string;
  severity: 'guideline' | 'requirement' | 'strict';
  exceptions: string[];
}

export interface ContentContext {
  platform: string;
  content_type: string;
  target_audience: AudienceDefinition;
  content_pillars: string[];
  campaign_context?: CampaignContext;
  competitive_context?: CompetitiveContext;
  temporal_context?: TemporalContext;
}

export interface AudienceDefinition {
  primary_audience: AudienceSegment;
  secondary_audiences: AudienceSegment[];
  psychographics: PsychographicData;
  behavioral_patterns: BehavioralPattern[];
  preferences: AudiencePreference[];
}

export interface AudienceSegment {
  name: string;
  demographics: DemographicData;
  size: number;
  importance: number;
  characteristics: string[];
}

export interface DemographicData {
  age_range: { min: number; max: number };
  gender_distribution: Record<string, number>;
  geographic_distribution: GeographicData[];
  income_level: string;
  education_level: string;
  occupation_categories: string[];
}

export interface GeographicData {
  region: string;
  percentage: number;
  cultural_considerations: string[];
  language_preferences: string[];
}

export interface PsychographicData {
  values: string[];
  interests: string[];
  lifestyle_indicators: string[];
  personality_traits: string[];
  motivations: string[];
  pain_points: string[];
}

export interface BehavioralPattern {
  behavior: string;
  frequency: string;
  triggers: string[];
  context: string[];
  implications: string[];
}

export interface AudiencePreference {
  category: string;
  preferences: string[];
  intensity: number;
  context_dependency: boolean;
}

export interface CampaignContext {
  campaign_name: string;
  campaign_goals: string[];
  key_messages: string[];
  campaign_timeline: CampaignTimeline;
  budget_constraints: BudgetConstraints;
  success_metrics: string[];
}

export interface CampaignTimeline {
  start_date: string;
  end_date: string;
  milestones: CampaignMilestone[];
  seasonal_considerations: string[];
}

export interface CampaignMilestone {
  milestone: string;
  date: string;
  deliverables: string[];
  success_criteria: string[];
}

export interface BudgetConstraints {
  total_budget: number;
  cost_per_asset: number;
  resource_limitations: string[];
  quality_vs_cost_preferences: string;
}

export interface CompetitiveContext {
  competitors: CompetitorAnalysis[];
  market_positioning: string;
  differentiation_points: string[];
  competitive_advantages: string[];
  market_trends: string[];
}

export interface CompetitorAnalysis {
  competitor: string;
  strengths: string[];
  weaknesses: string[];
  visual_style: string;
  messaging_approach: string;
  market_position: string;
}

export interface TemporalContext {
  seasonality: string;
  cultural_events: string[];
  industry_events: string[];
  trending_topics: string[];
  time_sensitivity: string;
}

export interface TechnicalSpecs {
  dimensions: DimensionSpec;
  format_requirements: FormatRequirement[];
  quality_settings: QualitySettings;
  file_constraints: FileConstraints;
  platform_specifications: PlatformSpec[];
  accessibility_requirements: AccessibilityReqs;
}

export interface DimensionSpec {
  width: number;
  height: number;
  aspect_ratio: string;
  dpi: number;
  units: 'px' | 'in' | 'cm' | 'mm' | 'pt';
  responsive_variants?: ResponsiveVariant[];
}

export interface ResponsiveVariant {
  breakpoint: string;
  dimensions: { width: number; height: number };
  scale_factor: number;
  quality_adjustments: Record<string, any>;
}

export interface FormatRequirement {
  format: string;
  usage_context: string[];
  quality_settings: Record<string, any>;
  compression_settings: Record<string, any>;
  metadata_requirements: string[];
}

export interface QualitySettings {
  resolution: 'low' | 'medium' | 'high' | 'ultra' | 'custom';
  compression_level: number;
  color_depth: number;
  interpolation_method: string;
  noise_reduction: boolean;
  sharpening: number;
}

export interface FileConstraints {
  max_file_size: number;
  min_file_size?: number;
  naming_convention: string;
  metadata_preservation: boolean;
  version_requirements: VersionRequirements;
}

export interface VersionRequirements {
  source_files: boolean;
  working_files: boolean;
  final_outputs: string[];
  backup_requirements: boolean;
}

export interface PlatformSpec {
  platform: string;
  specific_requirements: Record<string, any>;
  optimization_settings: Record<string, any>;
  validation_rules: string[];
  best_practices: string[];
}

export interface AccessibilityReqs {
  alt_text_required: boolean;
  contrast_requirements: ContrastRequirement[];
  color_blind_considerations: boolean;
  screen_reader_compatibility: boolean;
  keyboard_navigation: boolean;
}

export interface ContrastRequirement {
  element_type: string;
  minimum_ratio: number;
  compliance_level: 'AA' | 'AAA';
  testing_method: string;
}

export interface CreativeBrief {
  project_overview: string;
  objectives: string[];
  target_audience: string;
  key_message: string;
  tone_and_style: string;
  inspirations: string[];
  creative_direction: CreativeDirection;
  success_criteria: string[];
}

export interface CreativeDirection {
  visual_style: string;
  mood_and_feel: string;
  artistic_approach: string;
  innovation_level: 'conservative' | 'moderate' | 'innovative' | 'cutting_edge';
  risk_tolerance: number;
  uniqueness_priority: number;
}

export interface GenerationParameters {
  creativity_level: number; // 0-1
  style_strength: number; // 0-1
  variation_count: number;
  seed?: number;
  guidance_scale: number;
  inference_steps: number;
  model_preferences: ModelPreference[];
  post_processing: PostProcessingStep[];
  quality_vs_speed: 'quality' | 'balanced' | 'speed';
}

export interface ModelPreference {
  model_type: string;
  model_name: string;
  weight: number;
  specific_settings: Record<string, any>;
}

export interface PostProcessingStep {
  step: string;
  parameters: Record<string, any>;
  order: number;
  conditional: boolean;
}

export interface GenerationConstraints {
  content_safety: ContentSafetyConstraints;
  technical_constraints: TechnicalConstraints;
  brand_compliance: BrandComplianceConstraints;
  legal_constraints: LegalConstraints;
  budget_constraints: GenerationBudgetConstraints;
}

export interface ContentSafetyConstraints {
  nsfw_filter: boolean;
  violence_filter: boolean;
  hate_speech_filter: boolean;
  copyright_awareness: boolean;
  age_appropriateness: string;
  cultural_sensitivity: string[];
}

export interface TechnicalConstraints {
  processing_time_limit: number;
  memory_usage_limit: number;
  gpu_availability: boolean;
  fallback_models: string[];
  quality_thresholds: Record<string, number>;
}

export interface BrandComplianceConstraints {
  strict_brand_adherence: boolean;
  allowed_deviations: string[];
  approval_required: boolean;
  compliance_checks: string[];
}

export interface LegalConstraints {
  copyright_clearance: boolean;
  trademark_awareness: boolean;
  licensing_requirements: string[];
  attribution_requirements: string[];
  usage_rights: string[];
}

export interface GenerationBudgetConstraints {
  max_cost_per_generation: number;
  priority_level: 'low' | 'medium' | 'high' | 'urgent';
  cost_optimization: boolean;
  batch_processing: boolean;
}

export interface GenerationOptions {
  real_time_preview: boolean;
  interactive_refinement: boolean;
  version_control: boolean;
  collaboration_features: boolean;
  approval_workflow: boolean;
  analytics_tracking: boolean;
  a_b_testing: boolean;
}

export interface GeneratedAsset {
  id: string;
  request_id: string;
  type: GenerationType;
  asset_url: string;
  metadata: AssetMetadata;
  quality_scores: QualityScore[];
  variations: AssetVariation[];
  usage_rights: UsageRights;
  performance_data?: PerformanceData;
  feedback?: AssetFeedback;
}

export interface AssetMetadata {
  file_info: FileInfo;
  generation_info: GenerationInfo;
  technical_info: TechnicalInfo;
  creative_info: CreativeInfo;
  compliance_info: ComplianceInfo;
}

export interface FileInfo {
  filename: string;
  format: string;
  size: number;
  dimensions: { width: number; height: number };
  color_profile: string;
  creation_date: string;
  checksum: string;
}

export interface GenerationInfo {
  model_used: string;
  parameters_used: Record<string, any>;
  processing_time: number;
  iterations: number;
  seed_used: number;
  guidance_scale: number;
}

export interface TechnicalInfo {
  resolution: string;
  dpi: number;
  color_depth: number;
  compression: string;
  layers?: LayerInfo[];
  fonts_used?: string[];
}

export interface LayerInfo {
  name: string;
  type: string;
  blending_mode: string;
  opacity: number;
  effects: string[];
}

export interface CreativeInfo {
  style_analysis: StyleAnalysis;
  composition_analysis: CompositionAnalysis;
  color_analysis: ColorAnalysisResult;
  content_analysis: ContentAnalysisResult;
}

export interface StyleAnalysis {
  artistic_style: string;
  influences: string[];
  era: string;
  movements: string[];
  techniques: string[];
  uniqueness_score: number;
}

export interface CompositionAnalysisResult {
  balance: number;
  focal_points: FocalPoint[];
  visual_flow: VisualFlow;
  rule_adherence: RuleAdherence[];
  complexity_score: number;
}

export interface FocalPoint {
  position: { x: number; y: number };
  strength: number;
  type: string;
  description: string;
}

export interface VisualFlow {
  direction: string;
  strength: number;
  pathways: FlowPathway[];
  effectiveness: number;
}

export interface FlowPathway {
  start: { x: number; y: number };
  end: { x: number; y: number };
  strength: number;
  type: string;
}

export interface RuleAdherence {
  rule: string;
  adherence_score: number;
  deviations: string[];
  impact: string;
}

export interface ColorAnalysisResult {
  dominant_colors: ColorInfo[];
  color_harmony: ColorHarmonyAnalysis;
  emotional_impact: EmotionalImpact;
  brand_alignment: BrandAlignment;
}

export interface ColorInfo {
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  percentage: number;
  role: 'primary' | 'secondary' | 'accent' | 'neutral';
}

export interface ColorHarmonyAnalysis {
  harmony_type: string;
  harmony_score: number;
  balance: number;
  contrast: number;
  temperature: string;
}

export interface EmotionalImpact {
  primary_emotion: string;
  emotional_intensity: number;
  mood_descriptors: string[];
  psychological_effects: string[];
}

export interface BrandAlignment {
  alignment_score: number;
  matches: string[];
  deviations: string[];
  recommendations: string[];
}

export interface ContentAnalysisResult {
  subject_matter: string[];
  themes: string[];
  symbolism: SymbolismAnalysis[];
  cultural_references: CulturalReference[];
  accessibility_score: number;
}

export interface SymbolismAnalysis {
  symbol: string;
  meaning: string;
  cultural_context: string[];
  significance: number;
}

export interface CulturalReference {
  reference: string;
  culture: string;
  context: string;
  appropriateness: number;
}

export interface ComplianceInfo {
  brand_compliance: ComplianceCheck[];
  legal_compliance: ComplianceCheck[];
  safety_compliance: ComplianceCheck[];
  platform_compliance: ComplianceCheck[];
}

export interface ComplianceCheck {
  category: string;
  status: 'passed' | 'warning' | 'failed';
  details: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
}

export interface QualityScore {
  dimension: string;
  score: number;
  details: string;
  benchmark: number;
  improvement_suggestions: string[];
}

export interface AssetVariation {
  id: string;
  variation_type: string;
  asset_url: string;
  differences: string[];
  use_case: string;
  quality_score: number;
}

export interface UsageRights {
  license_type: string;
  usage_scope: string[];
  restrictions: string[];
  attribution_required: boolean;
  commercial_use: boolean;
  modification_allowed: boolean;
  redistribution_allowed: boolean;
  expiry_date?: string;
}

export interface PerformanceData {
  engagement_metrics: EngagementMetric[];
  conversion_metrics: ConversionMetric[];
  reach_metrics: ReachMetric[];
  quality_metrics: QualityMetric[];
  comparative_analysis: ComparativeAnalysis;
}

export interface EngagementMetric {
  metric: string;
  value: number;
  benchmark: number;
  trend: 'improving' | 'stable' | 'declining';
  context: string;
}

export interface ConversionMetric {
  metric: string;
  conversion_rate: number;
  attribution: string;
  value: number;
  funnel_stage: string;
}

export interface ReachMetric {
  metric: string;
  reach: number;
  impressions: number;
  frequency: number;
  demographics: Record<string, number>;
}

export interface QualityMetric {
  metric: string;
  score: number;
  measurement_method: string;
  reliability: number;
  context: string;
}

export interface ComparativeAnalysis {
  comparisons: AssetComparison[];
  insights: string[];
  recommendations: string[];
  statistical_significance: number;
}

export interface AssetComparison {
  compared_asset: string;
  performance_difference: Record<string, number>;
  significance: number;
  context: string;
}

export interface AssetFeedback {
  user_ratings: UserRating[];
  expert_reviews: ExpertReview[];
  usage_analytics: UsageAnalytics;
  sentiment_analysis: SentimentAnalysisResult;
}

export interface UserRating {
  user_id: string;
  rating: number;
  aspects: { aspect: string; rating: number }[];
  comments: string;
  context: string;
  timestamp: string;
}

export interface ExpertReview {
  reviewer_id: string;
  expertise_area: string;
  overall_score: number;
  detailed_scores: Record<string, number>;
  review_text: string;
  recommendations: string[];
  timestamp: string;
}

export interface UsageAnalytics {
  usage_frequency: number;
  usage_contexts: UsageContext[];
  performance_metrics: Record<string, number>;
  user_behavior: UserBehaviorData;
}

export interface UsageContext {
  context: string;
  frequency: number;
  effectiveness: number;
  user_satisfaction: number;
}

export interface UserBehaviorData {
  interaction_patterns: string[];
  preference_indicators: string[];
  satisfaction_signals: string[];
  improvement_requests: string[];
}

export interface SentimentAnalysisResult {
  overall_sentiment: number;
  sentiment_distribution: Record<string, number>;
  key_themes: string[];
  emotional_responses: string[];
}

class GenerativeAIService {
  private readonly baseUrl = process.env.EXPO_PUBLIC_AI_API_URL || 'https://api.streammulti.com/generative';
  private readonly apiKey = process.env.EXPO_PUBLIC_AI_API_KEY || '';
  private readonly cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly cacheTimeout = 30 * 60 * 1000; // 30 minutes for generated assets
  private requests: Map<string, GenerativeRequest> = new Map();
  private assets: Map<string, GeneratedAsset> = new Map();

  constructor() {
    console.log('Generative AI Service initialized');
    this.startRequestMonitoring();
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
      throw new Error(`Generative AI API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    this.cache.set(cacheKey, { data, timestamp: Date.now() });
    
    return data;
  }

  /**
   * Generate thumbnails for content
   */
  async generateThumbnails(
    input: {
      prompt: string;
      style?: string;
      brand_guidelines?: BrandGuidelines;
      technical_specs?: TechnicalSpecs;
      reference_images?: string[];
    },
    options?: {
      variation_count?: number;
      creativity_level?: number;
      style_strength?: number;
      real_time_preview?: boolean;
    }
  ): Promise<GenerativeRequest> {
    console.log('🖼️ Generating thumbnails with prompt:', input.prompt.substring(0, 50) + '...');
    
    try {
      const request = await this.makeRequest<GenerativeRequest>('/thumbnails/generate', {
        method: 'POST',
        body: JSON.stringify({
          type: 'thumbnail',
          input: {
            text_prompt: input.prompt,
            style_references: input.style ? [input.style] : [],
            brand_guidelines: input.brand_guidelines,
            technical_specs: input.technical_specs || this.getDefaultThumbnailSpecs(),
            image_references: input.reference_images || []
          },
          parameters: {
            creativity_level: options?.creativity_level ?? 0.7,
            style_strength: options?.style_strength ?? 0.8,
            variation_count: options?.variation_count ?? 4,
            guidance_scale: 7.5,
            inference_steps: 50,
            model_preferences: [
              { model_type: 'diffusion', model_name: 'stable-diffusion-xl', weight: 1.0, specific_settings: {} }
            ],
            post_processing: [
              { step: 'upscale', parameters: { factor: 2 }, order: 1, conditional: false },
              { step: 'enhance', parameters: { sharpness: 0.3 }, order: 2, conditional: true }
            ],
            quality_vs_speed: 'balanced'
          },
          constraints: this.getDefaultConstraints(),
          options: {
            real_time_preview: options?.real_time_preview ?? false,
            interactive_refinement: true,
            version_control: true,
            analytics_tracking: true,
            a_b_testing: false,
            collaboration_features: false,
            approval_workflow: false
          }
        })
      });
      
      this.requests.set(request.id, request);
      
      console.log('✅ Thumbnail generation request created:', request.id);
      return request;
      
    } catch (error) {
      console.error('❌ Failed to generate thumbnails:', error);
      throw error;
    }
  }

  /**
   * Generate titles and text content
   */
  async generateTitles(
    input: {
      content_context: string;
      target_audience?: string;
      brand_voice?: string;
      keywords?: string[];
      constraints?: string[];
    },
    options?: {
      variation_count?: number;
      creativity_level?: number;
      length_preference?: 'short' | 'medium' | 'long';
      style_preference?: string;
    }
  ): Promise<GenerativeRequest> {
    console.log('📝 Generating titles for context:', input.content_context.substring(0, 50) + '...');
    
    try {
      const request = await this.makeRequest<GenerativeRequest>('/titles/generate', {
        method: 'POST',
        body: JSON.stringify({
          type: 'title',
          input: {
            text_prompt: input.content_context,
            content_context: {
              target_audience: {
                primary_audience: {
                  name: input.target_audience || 'general',
                  demographics: {},
                  size: 1000,
                  importance: 1,
                  characteristics: []
                },
                secondary_audiences: [],
                psychographics: {},
                behavioral_patterns: [],
                preferences: []
              },
              content_pillars: input.keywords || [],
              platform: 'universal',
              content_type: 'title'
            },
            brand_guidelines: input.brand_voice ? {
              tone: {
                voice: {
                  descriptors: [input.brand_voice],
                  tone_attributes: [],
                  emotional_range: {
                    primary_emotions: [],
                    emotional_intensity: 0.7,
                    emotional_consistency: 0.8,
                    contextual_adaptation: true
                  },
                  formality_level: 0.5
                },
                personality: [],
                communication_style: {
                  sentence_structure: 'varied',
                  vocabulary_level: 'accessible',
                  technical_language: false,
                  humor_usage: 'moderate',
                  cultural_sensitivity: ['inclusive']
                },
                do_and_donts: []
              },
              colors: { primary: [], secondary: [], accent: [], neutral: [], gradients: [], color_harmony: 'complementary' },
              typography: { primary_font: { family: '', weights: [], styles: [], fallbacks: [], usage_context: [] }, secondary_font: { family: '', weights: [], styles: [], fallbacks: [], usage_context: [] }, heading_styles: [], body_styles: [], special_fonts: [], font_pairing_rules: [] },
              imagery: { style: { aesthetic: '', photography_style: '', illustration_style: '', iconography_style: '', treatment: '' }, subjects: [], moods: [], composition_rules: [], color_treatment: { saturation: '', contrast: '', brightness: '', filters: [], overlays: [] }, technical_requirements: { min_resolution: { width: 0, height: 0 }, max_file_size: 0, preferred_formats: [], color_space: '', compression_quality: 0 } },
              logo_usage: { minimum_size: { width: 0, height: 0 }, clear_space: 0, placement_rules: [], color_variations: [], usage_restrictions: [] },
              restrictions: []
            } : undefined
          },
          parameters: {
            creativity_level: options?.creativity_level ?? 0.8,
            style_strength: 0.7,
            variation_count: options?.variation_count ?? 10,
            guidance_scale: 8.0,
            inference_steps: 30,
            model_preferences: [
              { model_type: 'language', model_name: 'gpt-4', weight: 1.0, specific_settings: { temperature: 0.7, max_tokens: 100 } }
            ],
            post_processing: [
              { step: 'length_optimization', parameters: { target_length: options?.length_preference || 'medium' }, order: 1, conditional: false },
              { step: 'seo_optimization', parameters: { keywords: input.keywords || [] }, order: 2, conditional: true }
            ],
            quality_vs_speed: 'quality'
          },
          constraints: this.getDefaultConstraints(),
          options: {
            real_time_preview: true,
            interactive_refinement: true,
            version_control: true,
            analytics_tracking: true,
            a_b_testing: true,
            collaboration_features: false,
            approval_workflow: false
          }
        })
      });
      
      this.requests.set(request.id, request);
      
      console.log('✅ Title generation request created:', request.id);
      return request;
      
    } catch (error) {
      console.error('❌ Failed to generate titles:', error);
      throw error;
    }
  }

  /**
   * Generate logos and branding elements
   */
  async generateLogo(
    input: {
      brand_name: string;
      industry: string;
      brand_personality: string[];
      style_preferences: string[];
      color_preferences?: string[];
      symbol_preferences?: string[];
    },
    options?: {
      variation_count?: number;
      include_wordmark?: boolean;
      include_symbol?: boolean;
      include_combination?: boolean;
      file_formats?: string[];
    }
  ): Promise<GenerativeRequest> {
    console.log('🎨 Generating logo for brand:', input.brand_name);
    
    try {
      const request = await this.makeRequest<GenerativeRequest>('/logos/generate', {
        method: 'POST',
        body: JSON.stringify({
          type: 'logo',
          input: {
            text_prompt: `Create a professional logo for ${input.brand_name}, a ${input.industry} brand with ${input.brand_personality.join(', ')} personality. Style: ${input.style_preferences.join(', ')}.`,
            brand_guidelines: {
              colors: {
                primary: input.color_preferences || [],
                secondary: [],
                accent: [],
                neutral: [],
                gradients: [],
                color_harmony: 'complementary'
              },
              typography: {
                primary_font: { family: '', weights: [], styles: [], fallbacks: [], usage_context: [] },
                secondary_font: { family: '', weights: [], styles: [], fallbacks: [], usage_context: [] },
                heading_styles: [],
                body_styles: [],
                special_fonts: [],
                font_pairing_rules: []
              },
              imagery: {
                style: {
                  aesthetic: input.style_preferences[0] || 'modern',
                  photography_style: '',
                  illustration_style: input.style_preferences.join(', '),
                  iconography_style: 'minimal',
                  treatment: 'clean'
                },
                subjects: input.symbol_preferences || [],
                moods: input.brand_personality,
                composition_rules: [],
                color_treatment: {
                  saturation: 'moderate',
                  contrast: 'high',
                  brightness: 'balanced',
                  filters: [],
                  overlays: []
                },
                technical_requirements: {
                  min_resolution: { width: 500, height: 500 },
                  max_file_size: 5000000,
                  preferred_formats: ['svg', 'png', 'jpg'],
                  color_space: 'RGB',
                  compression_quality: 90
                }
              },
              tone: {
                voice: {
                  descriptors: input.brand_personality,
                  tone_attributes: [],
                  emotional_range: {
                    primary_emotions: input.brand_personality,
                    emotional_intensity: 0.7,
                    emotional_consistency: 0.9,
                    contextual_adaptation: false
                  },
                  formality_level: 0.7
                },
                personality: [],
                communication_style: {
                  sentence_structure: 'clear',
                  vocabulary_level: 'professional',
                  technical_language: false,
                  humor_usage: 'minimal',
                  cultural_sensitivity: ['universal']
                },
                do_and_donts: []
              },
              logo_usage: {
                minimum_size: { width: 50, height: 50 },
                clear_space: 20,
                placement_rules: [],
                color_variations: [],
                usage_restrictions: []
              },
              restrictions: []
            },
            technical_specs: {
              dimensions: { width: 1000, height: 1000, aspect_ratio: '1:1', dpi: 300, units: 'px' },
              format_requirements: (options?.file_formats || ['svg', 'png']).map(format => ({
                format,
                usage_context: ['digital', 'print'],
                quality_settings: {},
                compression_settings: {},
                metadata_requirements: []
              })),
              quality_settings: {
                resolution: 'high',
                compression_level: 0.1,
                color_depth: 24,
                interpolation_method: 'bicubic',
                noise_reduction: true,
                sharpening: 0.2
              },
              file_constraints: {
                max_file_size: 10000000,
                naming_convention: 'brand_logo_v{version}',
                metadata_preservation: true,
                version_requirements: {
                  source_files: true,
                  working_files: true,
                  final_outputs: ['svg', 'png_transparent', 'png_white_bg', 'jpg'],
                  backup_requirements: true
                }
              },
              platform_specifications: [],
              accessibility_requirements: {
                alt_text_required: true,
                contrast_requirements: [
                  { element_type: 'logo', minimum_ratio: 4.5, compliance_level: 'AA', testing_method: 'automated' }
                ],
                color_blind_considerations: true,
                screen_reader_compatibility: true,
                keyboard_navigation: false
              }
            },
            creative_brief: {
              project_overview: `Logo design for ${input.brand_name}`,
              objectives: ['Create memorable brand identity', 'Ensure scalability', 'Reflect brand personality'],
              target_audience: input.industry + ' customers',
              key_message: input.brand_personality.join(', '),
              tone_and_style: input.style_preferences.join(', '),
              inspirations: [],
              creative_direction: {
                visual_style: input.style_preferences[0] || 'modern',
                mood_and_feel: input.brand_personality.join(', '),
                artistic_approach: 'professional',
                innovation_level: 'moderate',
                risk_tolerance: 0.3,
                uniqueness_priority: 0.8
              },
              success_criteria: ['Memorable', 'Scalable', 'Distinctive', 'Appropriate']
            }
          },
          parameters: {
            creativity_level: 0.8,
            style_strength: 0.9,
            variation_count: options?.variation_count ?? 6,
            guidance_scale: 9.0,
            inference_steps: 75,
            model_preferences: [
              { model_type: 'diffusion', model_name: 'midjourney-v6', weight: 0.6, specific_settings: {} },
              { model_type: 'vector', model_name: 'logoai-pro', weight: 0.4, specific_settings: {} }
            ],
            post_processing: [
              { step: 'vectorize', parameters: { precision: 'high' }, order: 1, conditional: false },
              { step: 'optimize', parameters: { file_size: true, quality: true }, order: 2, conditional: false },
              { step: 'variants', parameters: { 
                types: [
                  options?.include_wordmark !== false ? 'wordmark' : null,
                  options?.include_symbol !== false ? 'symbol' : null,
                  options?.include_combination !== false ? 'combination' : null
                ].filter(Boolean)
              }, order: 3, conditional: false }
            ],
            quality_vs_speed: 'quality'
          },
          constraints: {
            ...this.getDefaultConstraints(),
            brand_compliance: {
              strict_brand_adherence: true,
              allowed_deviations: ['color_variations', 'size_adaptations'],
              approval_required: true,
              compliance_checks: ['trademark_clearance', 'cultural_sensitivity', 'scalability_test']
            }
          },
          options: {
            real_time_preview: false,
            interactive_refinement: true,
            version_control: true,
            analytics_tracking: true,
            a_b_testing: false,
            collaboration_features: true,
            approval_workflow: true
          }
        })
      });
      
      this.requests.set(request.id, request);
      
      console.log('✅ Logo generation request created:', request.id);
      return request;
      
    } catch (error) {
      console.error('❌ Failed to generate logo:', error);
      throw error;
    }
  }

  /**
   * Generate banners and promotional graphics
   */
  async generateBanner(
    input: {
      purpose: string;
      dimensions: { width: number; height: number };
      headline?: string;
      subtext?: string;
      call_to_action?: string;
      brand_elements?: boolean;
      imagery_style?: string;
    },
    options?: {
      variation_count?: number;
      include_text_overlay?: boolean;
      animation?: boolean;
      responsive_variants?: boolean;
    }
  ): Promise<GenerativeRequest> {
    console.log('🖼️ Generating banner for:', input.purpose);
    
    try {
      const request = await this.makeRequest<GenerativeRequest>('/banners/generate', {
        method: 'POST',
        body: JSON.stringify({
          type: 'banner',
          input: {
            text_prompt: `Create a ${input.purpose} banner with ${input.imagery_style || 'modern'} style. ${input.headline ? `Headline: "${input.headline}".` : ''} ${input.subtext ? `Subtext: "${input.subtext}".` : ''} ${input.call_to_action ? `Call to action: "${input.call_to_action}".` : ''}`,
            technical_specs: {
              dimensions: {
                width: input.dimensions.width,
                height: input.dimensions.height,
                aspect_ratio: `${input.dimensions.width}:${input.dimensions.height}`,
                dpi: 72,
                units: 'px',
                responsive_variants: options?.responsive_variants ? [
                  { breakpoint: 'mobile', dimensions: { width: 320, height: Math.round(320 * input.dimensions.height / input.dimensions.width) }, scale_factor: 0.5, quality_adjustments: {} },
                  { breakpoint: 'tablet', dimensions: { width: 768, height: Math.round(768 * input.dimensions.height / input.dimensions.width) }, scale_factor: 0.75, quality_adjustments: {} }
                ] : undefined
              },
              format_requirements: [
                { format: 'png', usage_context: ['web', 'digital'], quality_settings: {}, compression_settings: {}, metadata_requirements: [] },
                { format: 'jpg', usage_context: ['web', 'email'], quality_settings: {}, compression_settings: {}, metadata_requirements: [] }
              ],
              quality_settings: {
                resolution: 'high',
                compression_level: 0.15,
                color_depth: 24,
                interpolation_method: 'lanczos',
                noise_reduction: false,
                sharpening: 0.1
              },
              file_constraints: {
                max_file_size: 2000000,
                naming_convention: 'banner_{purpose}_{dimensions}',
                metadata_preservation: false,
                version_requirements: {
                  source_files: false,
                  working_files: false,
                  final_outputs: ['png', 'jpg'],
                  backup_requirements: false
                }
              },
              platform_specifications: [
                { platform: 'web', specific_requirements: { format: 'png', optimization: 'web' }, optimization_settings: {}, validation_rules: [], best_practices: [] }
              ],
              accessibility_requirements: {
                alt_text_required: true,
                contrast_requirements: [
                  { element_type: 'text', minimum_ratio: 4.5, compliance_level: 'AA', testing_method: 'automated' }
                ],
                color_blind_considerations: true,
                screen_reader_compatibility: false,
                keyboard_navigation: false
              }
            }
          },
          parameters: {
            creativity_level: 0.7,
            style_strength: 0.8,
            variation_count: options?.variation_count ?? 3,
            guidance_scale: 7.0,
            inference_steps: 50,
            model_preferences: [
              { model_type: 'diffusion', model_name: 'dall-e-3', weight: 1.0, specific_settings: {} }
            ],
            post_processing: [
              ...(options?.include_text_overlay !== false ? [
                { step: 'text_overlay', parameters: { 
                  headline: input.headline,
                  subtext: input.subtext,
                  cta: input.call_to_action
                }, order: 1, conditional: true }
              ] : []),
              ...(input.brand_elements ? [
                { step: 'brand_elements', parameters: { logo: true, colors: true }, order: 2, conditional: true }
              ] : []),
              ...(options?.animation ? [
                { step: 'animate', parameters: { type: 'subtle', duration: 3 }, order: 3, conditional: true }
              ] : [])
            ],
            quality_vs_speed: 'balanced'
          },
          constraints: this.getDefaultConstraints(),
          options: {
            real_time_preview: true,
            interactive_refinement: true,
            version_control: false,
            analytics_tracking: true,
            a_b_testing: true,
            collaboration_features: false,
            approval_workflow: false
          }
        })
      });
      
      this.requests.set(request.id, request);
      
      console.log('✅ Banner generation request created:', request.id);
      return request;
      
    } catch (error) {
      console.error('❌ Failed to generate banner:', error);
      throw error;
    }
  }

  /**
   * Get generation status and results
   */
  async getGenerationStatus(requestId: string): Promise<{
    request: GenerativeRequest;
    progress: number;
    estimated_completion?: string;
    generated_assets?: GeneratedAsset[];
    errors?: string[];
  }> {
    console.log('📊 Getting generation status for:', requestId);
    
    try {
      const status = await this.makeRequest<{
        request: GenerativeRequest;
        progress: number;
        estimated_completion?: string;
        generated_assets?: GeneratedAsset[];
        errors?: string[];
      }>(`/requests/${requestId}/status`);
      
      // Update local request
      this.requests.set(requestId, status.request);
      
      // Cache generated assets
      if (status.generated_assets) {
        status.generated_assets.forEach(asset => {
          this.assets.set(asset.id, asset);
        });
      }
      
      console.log('✅ Generation status retrieved, progress:', status.progress + '%');
      return status;
      
    } catch (error) {
      console.error('❌ Failed to get generation status:', error);
      throw error;
    }
  }

  /**
   * Refine generated asset
   */
  async refineAsset(
    assetId: string,
    refinements: {
      style_adjustments?: Record<string, any>;
      content_modifications?: string[];
      quality_improvements?: string[];
      format_changes?: string[];
    }
  ): Promise<GenerativeRequest> {
    console.log('🔧 Refining asset:', assetId);
    
    try {
      const request = await this.makeRequest<GenerativeRequest>(`/assets/${assetId}/refine`, {
        method: 'POST',
        body: JSON.stringify({
          refinements,
          options: {
            preserve_original: true,
            create_variation: true,
            track_changes: true
          }
        })
      });
      
      this.requests.set(request.id, request);
      
      console.log('✅ Asset refinement request created:', request.id);
      return request;
      
    } catch (error) {
      console.error('❌ Failed to refine asset:', error);
      throw error;
    }
  }

  /**
   * Batch generate multiple assets
   */
  async batchGenerate(
    requests: Array<{
      type: GenerationType;
      input: GenerationInput;
      parameters?: Partial<GenerationParameters>;
      priority?: 'low' | 'medium' | 'high';
    }>
  ): Promise<{
    batch_id: string;
    requests: GenerativeRequest[];
    estimated_completion: string;
    total_cost: number;
  }> {
    console.log('📦 Batch generating', requests.length, 'assets');
    
    try {
      const batchResult = await this.makeRequest<{
        batch_id: string;
        requests: GenerativeRequest[];
        estimated_completion: string;
        total_cost: number;
      }>('/batch/generate', {
        method: 'POST',
        body: JSON.stringify({
          requests: requests.map(req => ({
            type: req.type,
            input: req.input,
            parameters: {
              ...this.getDefaultParameters(),
              ...req.parameters
            },
            constraints: this.getDefaultConstraints(),
            options: {
              real_time_preview: false,
              interactive_refinement: false,
              version_control: true,
              analytics_tracking: true,
              a_b_testing: false,
              collaboration_features: false,
              approval_workflow: false
            },
            priority: req.priority || 'medium'
          })),
          batch_options: {
            parallel_processing: true,
            cost_optimization: true,
            quality_consistency: true,
            progress_updates: true
          }
        })
      });
      
      // Store all requests
      batchResult.requests.forEach(request => {
        this.requests.set(request.id, request);
      });
      
      console.log('✅ Batch generation started:', batchResult.batch_id);
      return batchResult;
      
    } catch (error) {
      console.error('❌ Failed to start batch generation:', error);
      throw error;
    }
  }

  /**
   * Get asset analytics and performance
   */
  async getAssetAnalytics(
    assetId: string,
    timeframe: string
  ): Promise<PerformanceData> {
    console.log('📈 Getting asset analytics for:', assetId);
    
    try {
      const analytics = await this.makeRequest<PerformanceData>(`/assets/${assetId}/analytics`, {
        method: 'POST',
        body: JSON.stringify({
          timeframe,
          include_metrics: ['engagement', 'conversion', 'reach', 'quality'],
          include_comparisons: true,
          include_insights: true
        })
      });
      
      console.log('✅ Asset analytics retrieved');
      return analytics;
      
    } catch (error) {
      console.error('❌ Failed to get asset analytics:', error);
      throw error;
    }
  }

  /**
   * Start request monitoring
   */
  private startRequestMonitoring(): void {
    console.log('🔄 Starting generation request monitoring');
    
    // Check request status every minute
    setInterval(async () => {
      for (const [requestId, request] of this.requests) {
        if (request.status === 'processing' || request.status === 'queued') {
          try {
            const status = await this.getGenerationStatus(requestId);
            
            if (status.request.status === 'completed') {
              console.log('✅ Generation completed:', requestId);
            } else if (status.request.status === 'failed') {
              console.log('❌ Generation failed:', requestId);
            }
          } catch (error) {
            console.error('Failed to check generation status:', requestId, error);
          }
        }
      }
    }, 60000); // Every minute
  }

  /**
   * Get default technical specs for thumbnails
   */
  private getDefaultThumbnailSpecs(): TechnicalSpecs {
    return {
      dimensions: { width: 1280, height: 720, aspect_ratio: '16:9', dpi: 72, units: 'px' },
      format_requirements: [
        { format: 'jpg', usage_context: ['web', 'social'], quality_settings: {}, compression_settings: {}, metadata_requirements: [] },
        { format: 'png', usage_context: ['web', 'overlay'], quality_settings: {}, compression_settings: {}, metadata_requirements: [] }
      ],
      quality_settings: {
        resolution: 'high',
        compression_level: 0.2,
        color_depth: 24,
        interpolation_method: 'lanczos',
        noise_reduction: true,
        sharpening: 0.15
      },
      file_constraints: {
        max_file_size: 1000000,
        naming_convention: 'thumbnail_{timestamp}',
        metadata_preservation: false,
        version_requirements: {
          source_files: false,
          working_files: false,
          final_outputs: ['jpg', 'png'],
          backup_requirements: false
        }
      },
      platform_specifications: [
        { platform: 'youtube', specific_requirements: { dimensions: '1280x720', format: 'jpg' }, optimization_settings: {}, validation_rules: [], best_practices: [] },
        { platform: 'twitch', specific_requirements: { dimensions: '1280x720', format: 'jpg' }, optimization_settings: {}, validation_rules: [], best_practices: [] }
      ],
      accessibility_requirements: {
        alt_text_required: true,
        contrast_requirements: [],
        color_blind_considerations: false,
        screen_reader_compatibility: false,
        keyboard_navigation: false
      }
    };
  }

  /**
   * Get default generation parameters
   */
  private getDefaultParameters(): GenerationParameters {
    return {
      creativity_level: 0.7,
      style_strength: 0.8,
      variation_count: 4,
      guidance_scale: 7.5,
      inference_steps: 50,
      model_preferences: [],
      post_processing: [],
      quality_vs_speed: 'balanced'
    };
  }

  /**
   * Get default generation constraints
   */
  private getDefaultConstraints(): GenerationConstraints {
    return {
      content_safety: {
        nsfw_filter: true,
        violence_filter: true,
        hate_speech_filter: true,
        copyright_awareness: true,
        age_appropriateness: 'general',
        cultural_sensitivity: ['inclusive', 'respectful']
      },
      technical_constraints: {
        processing_time_limit: 300,
        memory_usage_limit: 8000,
        gpu_availability: true,
        fallback_models: ['stable-diffusion-v2'],
        quality_thresholds: { minimum_quality: 0.7 }
      },
      brand_compliance: {
        strict_brand_adherence: false,
        allowed_deviations: ['style_variations', 'color_adaptations'],
        approval_required: false,
        compliance_checks: ['basic_safety']
      },
      legal_constraints: {
        copyright_clearance: true,
        trademark_awareness: true,
        licensing_requirements: ['commercial_use'],
        attribution_requirements: [],
        usage_rights: ['modify', 'distribute', 'commercial']
      },
      budget_constraints: {
        max_cost_per_generation: 5.0,
        priority_level: 'medium',
        cost_optimization: true,
        batch_processing: false
      }
    };
  }

  /**
   * Get pending requests
   */
  getPendingRequests(): GenerativeRequest[] {
    return Array.from(this.requests.values()).filter(req => 
      req.status === 'queued' || req.status === 'processing'
    );
  }

  /**
   * Get completed assets
   */
  getCompletedAssets(): GeneratedAsset[] {
    return Array.from(this.assets.values());
  }

  /**
   * Clear generation cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('✅ Generative AI cache cleared');
  }

  /**
   * Get service statistics
   */
  getServiceStatistics(): {
    totalRequests: number;
    pendingRequests: number;
    completedRequests: number;
    failedRequests: number;
    totalAssets: number;
    cacheSize: number;
    averageGenerationTime: number;
  } {
    const requests = Array.from(this.requests.values());
    const pending = requests.filter(r => r.status === 'processing' || r.status === 'queued').length;
    const completed = requests.filter(r => r.status === 'completed').length;
    const failed = requests.filter(r => r.status === 'failed').length;
    
    return {
      totalRequests: this.requests.size,
      pendingRequests: pending,
      completedRequests: completed,
      failedRequests: failed,
      totalAssets: this.assets.size,
      cacheSize: this.cache.size,
      averageGenerationTime: 0 // Would calculate from actual data
    };
  }
}

export const generativeAIService = new GenerativeAIService();
export default generativeAIService;