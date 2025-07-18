import { UserProfile } from './aiRecommendationService';
import { ViewerAnalytics } from './analyticsService';
import { UnifiedStream } from './platformService';

export interface PersonalizationProfile {
  userId: string;
  preferences: UserPreferences;
  behavior: BehaviorProfile;
  context: ContextProfile;
  demographics: DemographicProfile;
  psychographics: PsychographicProfile;
  segments: UserSegment[];
  personalization_settings: PersonalizationSettings;
  adaptation_history: AdaptationHistory;
  last_updated: string;
}

export interface UserPreferences {
  content: ContentPreferences;
  ui: UIPreferences;
  interaction: InteractionPreferences;
  notification: NotificationPreferences;
  privacy: PrivacyPreferences;
  accessibility: AccessibilityPreferences;
  experimental: ExperimentalPreferences;
}

export interface ContentPreferences {
  categories: { category: string; weight: number; explicit: boolean }[];
  platforms: { platform: string; preference: number }[];
  streamers: { streamer: string; affinity: number; reason: string }[];
  content_types: { type: string; preference: number }[];
  languages: { language: string; proficiency: number; preference: number }[];
  maturity_rating: string;
  content_length: { min: number; max: number; optimal: number };
  quality_preference: string;
  freshness_importance: number;
  diversity_preference: number;
  novelty_seeking: number;
}

export interface UIPreferences {
  theme: ThemePreferences;
  layout: LayoutPreferences;
  navigation: NavigationPreferences;
  display: DisplayPreferences;
  animations: AnimationPreferences;
  customization: CustomizationPreferences;
}

export interface ThemePreferences {
  color_scheme: 'light' | 'dark' | 'auto' | 'custom';
  primary_colors: string[];
  accent_colors: string[];
  contrast_level: number;
  saturation_level: number;
  brightness_level: number;
  custom_themes: CustomTheme[];
}

export interface CustomTheme {
  id: string;
  name: string;
  colors: Record<string, string>;
  typography: Typography;
  spacing: Spacing;
  borders: BorderStyle;
  shadows: ShadowStyle;
}

export interface Typography {
  font_family: string;
  font_size: number;
  line_height: number;
  letter_spacing: number;
  font_weight: number;
  text_color: string;
}

export interface Spacing {
  base_unit: number;
  scale_factor: number;
  component_spacing: Record<string, number>;
}

export interface BorderStyle {
  radius: number;
  width: number;
  style: string;
  color: string;
}

export interface ShadowStyle {
  elevation: number;
  blur_radius: number;
  spread_radius: number;
  color: string;
  opacity: number;
}

export interface LayoutPreferences {
  grid_type: 'fixed' | 'masonry' | 'list' | 'adaptive';
  columns: number;
  card_size: 'compact' | 'medium' | 'large' | 'adaptive';
  information_density: 'minimal' | 'standard' | 'detailed' | 'comprehensive';
  sidebar_position: 'left' | 'right' | 'hidden' | 'floating';
  header_style: 'minimal' | 'standard' | 'detailed' | 'hidden';
  footer_style: 'minimal' | 'standard' | 'detailed' | 'hidden';
}

export interface NavigationPreferences {
  menu_style: 'sidebar' | 'topbar' | 'bottom' | 'floating' | 'minimal';
  breadcrumbs: boolean;
  quick_actions: boolean;
  search_prominence: number;
  keyboard_shortcuts: boolean;
  gesture_navigation: boolean;
  voice_navigation: boolean;
}

export interface DisplayPreferences {
  thumbnails: ThumbnailPreferences;
  text: TextDisplayPreferences;
  media: MediaDisplayPreferences;
  overlays: OverlayPreferences;
  indicators: IndicatorPreferences;
}

export interface ThumbnailPreferences {
  style: 'standard' | 'hover_preview' | 'animated' | 'static';
  quality: 'low' | 'medium' | 'high' | 'adaptive';
  show_duration: boolean;
  show_viewer_count: boolean;
  show_platform_icon: boolean;
  blur_inappropriate: boolean;
}

export interface TextDisplayPreferences {
  truncation_style: 'ellipsis' | 'fade' | 'expand' | 'tooltip';
  description_length: 'none' | 'short' | 'medium' | 'full';
  timestamp_format: 'relative' | 'absolute' | 'both';
  number_format: 'compact' | 'full' | 'localized';
  language_fallback: string[];
}

export interface MediaDisplayPreferences {
  autoplay: 'never' | 'on_hover' | 'on_focus' | 'always';
  mute_by_default: boolean;
  quality_adaptation: boolean;
  preload_strategy: 'none' | 'metadata' | 'auto';
  pip_support: boolean;
  fullscreen_preference: 'window' | 'browser' | 'native';
}

export interface OverlayPreferences {
  chat_overlay: boolean;
  stats_overlay: boolean;
  controls_overlay: boolean;
  branding_overlay: boolean;
  overlay_opacity: number;
  overlay_position: string;
}

export interface IndicatorPreferences {
  live_indicators: boolean;
  quality_indicators: boolean;
  platform_indicators: boolean;
  status_indicators: boolean;
  progress_indicators: boolean;
  notification_badges: boolean;
}

export interface AnimationPreferences {
  enabled: boolean;
  duration_multiplier: number;
  easing_preference: string;
  reduced_motion: boolean;
  parallax_effects: boolean;
  transitions: boolean;
  micro_interactions: boolean;
}

export interface CustomizationPreferences {
  dashboard_widgets: DashboardWidget[];
  quick_access_items: QuickAccessItem[];
  toolbar_configuration: ToolbarConfig;
  shortcuts: KeyboardShortcut[];
  personal_collections: PersonalCollection[];
}

export interface DashboardWidget {
  id: string;
  type: string;
  position: { x: number; y: number; width: number; height: number };
  configuration: Record<string, any>;
  enabled: boolean;
  permissions: string[];
}

export interface QuickAccessItem {
  id: string;
  label: string;
  action: string;
  icon: string;
  position: number;
  enabled: boolean;
  context: string[];
}

export interface ToolbarConfig {
  items: ToolbarItem[];
  layout: 'horizontal' | 'vertical' | 'grid';
  grouping: boolean;
  customizable: boolean;
}

export interface ToolbarItem {
  id: string;
  type: 'button' | 'dropdown' | 'search' | 'separator' | 'group';
  label: string;
  icon: string;
  action: string;
  enabled: boolean;
  visible: boolean;
  position: number;
}

export interface KeyboardShortcut {
  id: string;
  combination: string;
  action: string;
  context: string;
  enabled: boolean;
  custom: boolean;
}

export interface PersonalCollection {
  id: string;
  name: string;
  type: 'favorites' | 'watchlist' | 'playlist' | 'folder';
  items: string[];
  sharing: 'private' | 'friends' | 'public';
  auto_populate: boolean;
  criteria: Record<string, any>;
}

export interface InteractionPreferences {
  click_behavior: ClickBehavior;
  hover_behavior: HoverBehavior;
  touch_gestures: TouchGestures;
  voice_commands: VoiceCommands;
  multi_touch: MultiTouchPreferences;
  haptic_feedback: HapticFeedback;
}

export interface ClickBehavior {
  single_click_action: string;
  double_click_action: string;
  middle_click_action: string;
  right_click_behavior: 'context_menu' | 'custom_action' | 'disabled';
  long_press_action: string;
  delay_tolerance: number;
}

export interface HoverBehavior {
  preview_delay: number;
  preview_type: 'tooltip' | 'popup' | 'sidebar' | 'modal';
  auto_play_on_hover: boolean;
  info_display: 'minimal' | 'standard' | 'detailed';
  follow_cursor: boolean;
}

export interface TouchGestures {
  swipe_actions: SwipeAction[];
  pinch_zoom: boolean;
  two_finger_scroll: boolean;
  edge_gestures: boolean;
  gesture_sensitivity: number;
}

export interface SwipeAction {
  direction: 'left' | 'right' | 'up' | 'down';
  action: string;
  context: string;
  enabled: boolean;
}

export interface VoiceCommands {
  enabled: boolean;
  wake_word: string;
  language: string;
  commands: VoiceCommand[];
  noise_suppression: boolean;
  confirmation_required: boolean;
}

export interface VoiceCommand {
  phrase: string;
  action: string;
  context: string;
  confidence_threshold: number;
  enabled: boolean;
}

export interface MultiTouchPreferences {
  enabled: boolean;
  max_touch_points: number;
  gesture_combinations: GestureCombination[];
  palm_rejection: boolean;
}

export interface GestureCombination {
  gesture: string;
  fingers: number;
  action: string;
  enabled: boolean;
}

export interface HapticFeedback {
  enabled: boolean;
  intensity: number;
  pattern_customization: boolean;
  context_aware: boolean;
  battery_aware: boolean;
}

export interface NotificationPreferences {
  channels: NotificationChannel[];
  timing: NotificationTiming;
  content: NotificationContent;
  delivery: NotificationDelivery;
  privacy: NotificationPrivacy;
}

export interface NotificationChannel {
  type: string;
  enabled: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  frequency: 'instant' | 'batched' | 'daily' | 'weekly';
  quiet_hours: { start: string; end: string }[];
  platforms: string[];
}

export interface NotificationTiming {
  optimal_times: string[];
  time_zone_aware: boolean;
  delay_when_active: boolean;
  batch_similar: boolean;
  rate_limiting: boolean;
}

export interface NotificationContent {
  detail_level: 'minimal' | 'standard' | 'detailed';
  include_previews: boolean;
  include_actions: boolean;
  personalize_content: boolean;
  language: string;
}

export interface NotificationDelivery {
  methods: DeliveryMethod[];
  fallback_strategy: string;
  retry_attempts: number;
  delivery_confirmation: boolean;
}

export interface DeliveryMethod {
  method: 'push' | 'email' | 'sms' | 'in_app' | 'webhook';
  priority: number;
  enabled: boolean;
  configuration: Record<string, any>;
}

export interface NotificationPrivacy {
  show_on_lock_screen: boolean;
  include_sensitive_info: boolean;
  anonymize_senders: boolean;
  group_conversations: boolean;
}

export interface PrivacyPreferences {
  data_collection: DataCollectionPreferences;
  sharing: SharingPreferences;
  tracking: TrackingPreferences;
  storage: StoragePreferences;
  visibility: VisibilityPreferences;
}

export interface DataCollectionPreferences {
  analytics: boolean;
  behavioral_data: boolean;
  interaction_data: boolean;
  performance_data: boolean;
  crash_reports: boolean;
  usage_statistics: boolean;
  granular_controls: Record<string, boolean>;
}

export interface SharingPreferences {
  activity_sharing: boolean;
  recommendation_sharing: boolean;
  social_features: boolean;
  third_party_integrations: boolean;
  data_portability: boolean;
  sharing_controls: Record<string, string>;
}

export interface TrackingPreferences {
  cross_site_tracking: boolean;
  advertising_tracking: boolean;
  analytics_tracking: boolean;
  personalization_tracking: boolean;
  do_not_track: boolean;
  tracking_exceptions: string[];
}

export interface StoragePreferences {
  local_storage: boolean;
  cloud_storage: boolean;
  data_retention: number; // days
  automatic_cleanup: boolean;
  encryption_required: boolean;
  backup_preferences: BackupPreferences;
}

export interface BackupPreferences {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  retention_period: number;
  include_settings: boolean;
  include_history: boolean;
  cloud_backup: boolean;
}

export interface VisibilityPreferences {
  profile_visibility: 'public' | 'friends' | 'private';
  activity_visibility: 'public' | 'friends' | 'private';
  online_status: boolean;
  typing_indicators: boolean;
  read_receipts: boolean;
}

export interface AccessibilityPreferences {
  visual: VisualAccessibility;
  motor: MotorAccessibility;
  cognitive: CognitiveAccessibility;
  auditory: AuditoryAccessibility;
  assistive_technology: AssistiveTechnology;
}

export interface VisualAccessibility {
  high_contrast: boolean;
  large_text: boolean;
  screen_reader: boolean;
  magnification: number;
  color_filters: ColorFilter[];
  focus_indicators: boolean;
  reduce_transparency: boolean;
}

export interface ColorFilter {
  type: 'protanopia' | 'deuteranopia' | 'tritanopia' | 'monochrome' | 'custom';
  intensity: number;
  enabled: boolean;
}

export interface MotorAccessibility {
  sticky_keys: boolean;
  slow_keys: boolean;
  bounce_keys: boolean;
  mouse_keys: boolean;
  voice_control: boolean;
  switch_control: boolean;
  gesture_alternatives: boolean;
}

export interface CognitiveAccessibility {
  simplified_interface: boolean;
  reduced_distractions: boolean;
  clear_language: boolean;
  consistent_navigation: boolean;
  progress_indicators: boolean;
  timeout_extensions: boolean;
  content_warnings: boolean;
}

export interface AuditoryAccessibility {
  captions: boolean;
  audio_descriptions: boolean;
  sign_language: boolean;
  volume_amplification: boolean;
  frequency_adjustment: boolean;
  visual_sound_indicators: boolean;
}

export interface AssistiveTechnology {
  screen_reader_support: boolean;
  voice_recognition: boolean;
  eye_tracking: boolean;
  brain_computer_interface: boolean;
  custom_input_devices: boolean;
  api_integrations: string[];
}

export interface ExperimentalPreferences {
  beta_features: boolean;
  alpha_features: boolean;
  experimental_ui: boolean;
  ai_features: boolean;
  performance_experiments: boolean;
  feedback_participation: boolean;
  feature_flags: Record<string, boolean>;
}

export interface BehaviorProfile {
  usage_patterns: UsagePattern[];
  interaction_patterns: InteractionPattern[];
  content_consumption: ContentConsumption;
  social_behavior: SocialBehavior;
  temporal_patterns: TemporalPattern[];
  device_usage: DeviceUsage[];
  adaptation_rate: number;
}

export interface UsagePattern {
  pattern: string;
  frequency: number;
  context: string;
  triggers: string[];
  outcomes: string[];
  confidence: number;
}

export interface InteractionPattern {
  interaction_type: string;
  typical_duration: number;
  success_rate: number;
  error_patterns: string[];
  efficiency_score: number;
  improvement_trend: number;
}

export interface ContentConsumption {
  average_session_duration: number;
  content_completion_rate: number;
  skipping_behavior: SkippingBehavior;
  discovery_methods: DiscoveryMethod[];
  binge_watching_tendency: number;
  multitasking_frequency: number;
}

export interface SkippingBehavior {
  skip_rate: number;
  skip_patterns: SkipPattern[];
  skip_triggers: string[];
  content_tolerance: number;
}

export interface SkipPattern {
  content_type: string;
  timing: number;
  reason: string;
  frequency: number;
}

export interface DiscoveryMethod {
  method: string;
  usage_frequency: number;
  success_rate: number;
  preference_score: number;
}

export interface SocialBehavior {
  sharing_frequency: number;
  comment_frequency: number;
  like_patterns: LikePattern[];
  follow_behavior: FollowBehavior;
  community_participation: number;
  influence_score: number;
}

export interface LikePattern {
  content_type: string;
  like_probability: number;
  timing_preference: string;
  factors: string[];
}

export interface FollowBehavior {
  follow_rate: number;
  unfollow_rate: number;
  follow_criteria: string[];
  loyalty_score: number;
}

export interface TemporalPattern {
  pattern_type: 'daily' | 'weekly' | 'monthly' | 'seasonal';
  peak_times: string[];
  duration: number;
  activity_level: number;
  consistency: number;
}

export interface DeviceUsage {
  device_type: string;
  usage_percentage: number;
  performance_preference: Record<string, any>;
  feature_usage: Record<string, number>;
}

export interface ContextProfile {
  current_context: CurrentContext;
  location_patterns: LocationPattern[];
  social_context: SocialContextData;
  temporal_context: TemporalContext;
  environmental_factors: EnvironmentalFactor[];
  mood_indicators: MoodIndicator[];
}

export interface CurrentContext {
  location: string;
  device: string;
  network: string;
  time_of_day: string;
  day_of_week: string;
  activity: string;
  companions: string[];
  mood: string;
}

export interface LocationPattern {
  location: string;
  frequency: number;
  typical_activities: string[];
  duration: number;
  context_factors: string[];
}

export interface SocialContextData {
  social_situation: string;
  group_size: number;
  relationships: string[];
  social_norms: string[];
  influence_factors: string[];
}

export interface TemporalContext {
  time_pressure: number;
  schedule_flexibility: number;
  routine_adherence: number;
  temporal_preferences: string[];
}

export interface EnvironmentalFactor {
  factor: string;
  value: string | number;
  impact: number;
  adaptation_required: boolean;
}

export interface MoodIndicator {
  indicator: string;
  value: number;
  confidence: number;
  source: string;
  timestamp: string;
}

export interface DemographicProfile {
  age_group: string;
  gender: string;
  location: LocationData;
  education: string;
  occupation: string;
  income_bracket: string;
  language_preferences: LanguagePreference[];
  cultural_background: CulturalBackground;
}

export interface LocationData {
  country: string;
  region: string;
  city: string;
  timezone: string;
  coordinates?: { lat: number; lng: number };
}

export interface LanguagePreference {
  language: string;
  proficiency: number;
  preference: number;
  context: string[];
}

export interface CulturalBackground {
  primary_culture: string;
  secondary_cultures: string[];
  cultural_values: string[];
  cultural_practices: string[];
}

export interface PsychographicProfile {
  personality_traits: PersonalityTrait[];
  values: Value[];
  interests: Interest[];
  lifestyle: LifestyleIndicator[];
  motivations: Motivation[];
  attitudes: Attitude[];
}

export interface PersonalityTrait {
  trait: string;
  score: number;
  confidence: number;
  stability: number;
  context_dependency: number;
}

export interface Value {
  value: string;
  importance: number;
  expression: string[];
  conflicts: string[];
}

export interface Interest {
  interest: string;
  intensity: number;
  duration: string;
  related_activities: string[];
  expertise_level: number;
}

export interface LifestyleIndicator {
  indicator: string;
  score: number;
  evidence: string[];
  trends: string[];
}

export interface Motivation {
  motivation: string;
  strength: number;
  triggers: string[];
  satisfaction_sources: string[];
}

export interface Attitude {
  attitude: string;
  valence: number;
  strength: number;
  malleability: number;
  formation_source: string[];
}

export interface UserSegment {
  segment_id: string;
  segment_name: string;
  membership_probability: number;
  key_characteristics: string[];
  behavioral_patterns: string[];
  preferences: Record<string, any>;
  lifetime_value: number;
  engagement_potential: number;
}

export interface PersonalizationSettings {
  enabled: boolean;
  intensity: number; // 0-1 scale
  adaptation_speed: number;
  learning_enabled: boolean;
  explicit_feedback_weight: number;
  implicit_feedback_weight: number;
  context_awareness: number;
  privacy_mode: 'full' | 'limited' | 'anonymous';
  override_controls: OverrideControl[];
}

export interface OverrideControl {
  feature: string;
  enabled: boolean;
  manual_settings: Record<string, any>;
  auto_adaptation: boolean;
}

export interface AdaptationHistory {
  adaptations: Adaptation[];
  performance_metrics: AdaptationMetric[];
  user_satisfaction: SatisfactionHistory[];
  learning_milestones: LearningMilestone[];
}

export interface Adaptation {
  id: string;
  timestamp: string;
  type: string;
  trigger: string;
  changes: AdaptationChange[];
  impact: AdaptationImpact;
  user_feedback?: string;
  success: boolean;
}

export interface AdaptationChange {
  component: string;
  property: string;
  old_value: any;
  new_value: any;
  confidence: number;
  reasoning: string;
}

export interface AdaptationImpact {
  engagement_change: number;
  satisfaction_change: number;
  efficiency_change: number;
  error_rate_change: number;
  usage_change: number;
}

export interface AdaptationMetric {
  metric: string;
  value: number;
  trend: 'improving' | 'stable' | 'declining';
  confidence: number;
  measurement_date: string;
}

export interface SatisfactionHistory {
  timestamp: string;
  overall_satisfaction: number;
  feature_satisfaction: Record<string, number>;
  feedback_type: string;
  context: string;
}

export interface LearningMilestone {
  milestone: string;
  achieved_date: string;
  improvement_metrics: Record<string, number>;
  significance: number;
}

export interface PersonalizationExperiment {
  id: string;
  name: string;
  type: 'a_b_test' | 'multivariate' | 'personalized_bandit';
  status: 'draft' | 'running' | 'paused' | 'completed' | 'archived';
  participants: ExperimentParticipant[];
  variants: ExperimentVariant[];
  metrics: ExperimentMetric[];
  results: ExperimentResult[];
  insights: ExperimentInsight[];
}

export interface ExperimentParticipant {
  user_id: string;
  variant_id: string;
  enrollment_date: string;
  completion_status: string;
  metrics: Record<string, number>;
}

export interface ExperimentVariant {
  id: string;
  name: string;
  description: string;
  configuration: Record<string, any>;
  traffic_allocation: number;
  performance: VariantPerformance;
}

export interface VariantPerformance {
  participants: number;
  completion_rate: number;
  metrics: Record<string, number>;
  statistical_significance: number;
}

export interface ExperimentMetric {
  metric: string;
  type: 'primary' | 'secondary' | 'guardrail';
  measurement_method: string;
  target_improvement: number;
  current_value: number;
}

export interface ExperimentResult {
  variant_id: string;
  metrics: Record<string, number>;
  confidence_intervals: Record<string, { lower: number; upper: number }>;
  statistical_significance: Record<string, number>;
  practical_significance: Record<string, boolean>;
}

export interface ExperimentInsight {
  insight: string;
  confidence: number;
  impact: 'positive' | 'negative' | 'neutral';
  recommendation: string;
  evidence: string[];
}

class PersonalizationEngine {
  private readonly baseUrl = process.env.EXPO_PUBLIC_AI_API_URL || 'https://api.streammulti.com/personalization';
  private readonly apiKey = process.env.EXPO_PUBLIC_AI_API_KEY || '';
  private readonly cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutes
  private profiles: Map<string, PersonalizationProfile> = new Map();
  private experiments: Map<string, PersonalizationExperiment> = new Map();

  constructor() {
    console.log('Personalization Engine initialized');
    this.startPersonalizationLoop();
    this.loadExperiments();
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
      throw new Error(`Personalization API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    this.cache.set(cacheKey, { data, timestamp: Date.now() });
    
    return data;
  }

  /**
   * Get or create personalization profile
   */
  async getPersonalizationProfile(userId: string): Promise<PersonalizationProfile> {
    if (this.profiles.has(userId)) {
      return this.profiles.get(userId)!;
    }

    console.log('👤 Getting personalization profile:', userId);
    
    try {
      const profile = await this.makeRequest<PersonalizationProfile>(`/profiles/${userId}`);
      this.profiles.set(userId, profile);
      console.log('✅ Personalization profile retrieved');
      return profile;
      
    } catch (error) {
      console.error('❌ Failed to get personalization profile:', error);
      
      // Create default profile
      const defaultProfile: PersonalizationProfile = {
        userId,
        preferences: this.getDefaultPreferences(),
        behavior: this.getDefaultBehaviorProfile(),
        context: this.getDefaultContextProfile(),
        demographics: this.getDefaultDemographicProfile(),
        psychographics: this.getDefaultPsychographicProfile(),
        segments: [],
        personalization_settings: {
          enabled: true,
          intensity: 0.7,
          adaptation_speed: 0.5,
          learning_enabled: true,
          explicit_feedback_weight: 0.7,
          implicit_feedback_weight: 0.3,
          context_awareness: 0.8,
          privacy_mode: 'limited',
          override_controls: []
        },
        adaptation_history: {
          adaptations: [],
          performance_metrics: [],
          user_satisfaction: [],
          learning_milestones: []
        },
        last_updated: new Date().toISOString()
      };
      
      this.profiles.set(userId, defaultProfile);
      return defaultProfile;
    }
  }

  /**
   * Personalize UI components for a user
   */
  async personalizeUI(
    userId: string,
    componentType: string,
    context: Record<string, any>
  ): Promise<{
    component_configuration: Record<string, any>;
    personalization_applied: string[];
    confidence: number;
    alternatives: Array<{
      configuration: Record<string, any>;
      score: number;
      reasoning: string;
    }>;
  }> {
    console.log('🎨 Personalizing UI component:', componentType, 'for user:', userId);
    
    try {
      const profile = await this.getPersonalizationProfile(userId);
      
      const personalization = await this.makeRequest<{
        component_configuration: Record<string, any>;
        personalization_applied: string[];
        confidence: number;
        alternatives: Array<{
          configuration: Record<string, any>;
          score: number;
          reasoning: string;
        }>;
      }>('/ui/personalize', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          componentType,
          context,
          profile,
          options: {
            includeAlternatives: true,
            enableAdaptation: true,
            confidenceThreshold: 0.6
          }
        })
      });
      
      console.log('✅ UI personalization applied:', personalization.personalization_applied.length, 'changes');
      return personalization;
      
    } catch (error) {
      console.error('❌ Failed to personalize UI:', error);
      throw error;
    }
  }

  /**
   * Personalize content recommendations
   */
  async personalizeContent(
    userId: string,
    contentPool: UnifiedStream[],
    context: {
      page_type?: string;
      user_intent?: string;
      current_activity?: string;
      time_constraints?: number;
      social_context?: string;
    }
  ): Promise<{
    personalized_content: UnifiedStream[];
    personalization_reasons: { contentId: string; reasons: string[] }[];
    diversity_score: number;
    novelty_score: number;
    confidence: number;
  }> {
    console.log('📺 Personalizing content for user:', userId, 'with', contentPool.length, 'items');
    
    try {
      const profile = await this.getPersonalizationProfile(userId);
      
      const personalization = await this.makeRequest<{
        personalized_content: UnifiedStream[];
        personalization_reasons: { contentId: string; reasons: string[] }[];
        diversity_score: number;
        novelty_score: number;
        confidence: number;
      }>('/content/personalize', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          contentPool,
          context,
          profile,
          options: {
            diversityWeight: 0.3,
            noveltyWeight: 0.2,
            personalPreferenceWeight: 0.5,
            includeReasons: true,
            maxResults: 50
          }
        })
      });
      
      console.log('✅ Content personalization completed:', personalization.personalized_content.length, 'items');
      return personalization;
      
    } catch (error) {
      console.error('❌ Failed to personalize content:', error);
      throw error;
    }
  }

  /**
   * Adapt user experience based on behavior
   */
  async adaptExperience(
    userId: string,
    behaviorData: {
      interactions: InteractionPattern[];
      performance_metrics: Record<string, number>;
      user_feedback?: string;
      context_changes?: Record<string, any>;
    }
  ): Promise<{
    adaptations: Adaptation[];
    impact_prediction: AdaptationImpact;
    implementation_plan: {
      immediate: string[];
      short_term: string[];
      long_term: string[];
    };
    confidence: number;
  }> {
    console.log('🔄 Adapting experience for user:', userId);
    
    try {
      const profile = await this.getPersonalizationProfile(userId);
      
      const adaptation = await this.makeRequest<{
        adaptations: Adaptation[];
        impact_prediction: AdaptationImpact;
        implementation_plan: {
          immediate: string[];
          short_term: string[];
          long_term: string[];
        };
        confidence: number;
      }>('/experience/adapt', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          behaviorData,
          profile,
          options: {
            adaptationIntensity: profile.personalization_settings.intensity,
            learningEnabled: profile.personalization_settings.learning_enabled,
            contextAwareness: profile.personalization_settings.context_awareness
          }
        })
      });
      
      // Update profile with adaptations
      profile.adaptation_history.adaptations.push(...adaptation.adaptations);
      this.profiles.set(userId, profile);
      
      console.log('✅ Experience adaptation completed:', adaptation.adaptations.length, 'adaptations');
      return adaptation;
      
    } catch (error) {
      console.error('❌ Failed to adapt experience:', error);
      throw error;
    }
  }

  /**
   * Run personalization A/B test
   */
  async runPersonalizationExperiment(
    experimentConfig: {
      name: string;
      type: 'a_b_test' | 'multivariate' | 'personalized_bandit';
      variants: Array<{
        name: string;
        configuration: Record<string, any>;
        traffic_allocation: number;
      }>;
      target_metrics: string[];
      duration_days: number;
      participant_criteria: Record<string, any>;
    }
  ): Promise<PersonalizationExperiment> {
    console.log('🧪 Running personalization experiment:', experimentConfig.name);
    
    try {
      const experiment = await this.makeRequest<PersonalizationExperiment>('/experiments/create', {
        method: 'POST',
        body: JSON.stringify({
          experimentConfig,
          options: {
            enableRandomization: true,
            enableStatisticalAnalysis: true,
            enableRealTimeMonitoring: true,
            autoStopOnSignificance: true
          }
        })
      });
      
      this.experiments.set(experiment.id, experiment);
      
      console.log('✅ Personalization experiment started:', experiment.id);
      return experiment;
      
    } catch (error) {
      console.error('❌ Failed to run personalization experiment:', error);
      throw error;
    }
  }

  /**
   * Get personalization insights
   */
  async getPersonalizationInsights(
    userId: string,
    timeframe: string
  ): Promise<{
    effectiveness: {
      overall_score: number;
      category_scores: Record<string, number>;
      improvement_areas: string[];
    };
    user_satisfaction: {
      satisfaction_score: number;
      satisfaction_trends: Array<{ date: string; score: number }>;
      feedback_themes: string[];
    };
    adaptation_success: {
      successful_adaptations: number;
      failed_adaptations: number;
      adaptation_impact: Record<string, number>;
    };
    recommendations: Array<{
      recommendation: string;
      category: string;
      priority: number;
      expected_impact: number;
    }>;
  }> {
    console.log('💡 Getting personalization insights for user:', userId);
    
    try {
      const insights = await this.makeRequest<{
        effectiveness: {
          overall_score: number;
          category_scores: Record<string, number>;
          improvement_areas: string[];
        };
        user_satisfaction: {
          satisfaction_score: number;
          satisfaction_trends: Array<{ date: string; score: number }>;
          feedback_themes: string[];
        };
        adaptation_success: {
          successful_adaptations: number;
          failed_adaptations: number;
          adaptation_impact: Record<string, number>;
        };
        recommendations: Array<{
          recommendation: string;
          category: string;
          priority: number;
          expected_impact: number;
        }>;
      }>(`/insights/${userId}`, {
        method: 'POST',
        body: JSON.stringify({
          timeframe,
          options: {
            includeEffectiveness: true,
            includeSatisfaction: true,
            includeAdaptationSuccess: true,
            includeRecommendations: true
          }
        })
      });
      
      console.log('✅ Personalization insights retrieved');
      return insights;
      
    } catch (error) {
      console.error('❌ Failed to get personalization insights:', error);
      throw error;
    }
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(
    userId: string,
    preferences: Partial<UserPreferences>,
    source: 'explicit' | 'implicit' | 'inferred'
  ): Promise<void> {
    console.log('🔧 Updating user preferences:', userId, 'source:', source);
    
    try {
      const profile = await this.getPersonalizationProfile(userId);
      
      // Merge preferences
      profile.preferences = { ...profile.preferences, ...preferences };
      profile.last_updated = new Date().toISOString();
      
      // Send update to backend
      await this.makeRequest(`/profiles/${userId}/preferences`, {
        method: 'PUT',
        body: JSON.stringify({
          preferences,
          source,
          timestamp: new Date().toISOString()
        })
      });
      
      this.profiles.set(userId, profile);
      
      console.log('✅ User preferences updated');
      
    } catch (error) {
      console.error('❌ Failed to update user preferences:', error);
      throw error;
    }
  }

  /**
   * Record user interaction for learning
   */
  async recordInteraction(
    userId: string,
    interaction: {
      type: string;
      component: string;
      action: string;
      context: Record<string, any>;
      outcome: 'success' | 'failure' | 'abandoned';
      satisfaction?: number;
      duration?: number;
    }
  ): Promise<void> {
    console.log('📊 Recording user interaction:', userId, interaction.type);
    
    try {
      await this.makeRequest('/interactions/record', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          interaction,
          timestamp: new Date().toISOString()
        })
      });
      
      // Update local profile if needed
      const profile = this.profiles.get(userId);
      if (profile && interaction.satisfaction) {
        profile.adaptation_history.user_satisfaction.push({
          timestamp: new Date().toISOString(),
          overall_satisfaction: interaction.satisfaction,
          feature_satisfaction: { [interaction.component]: interaction.satisfaction },
          feedback_type: 'implicit',
          context: interaction.type
        });
        this.profiles.set(userId, profile);
      }
      
    } catch (error) {
      console.error('❌ Failed to record interaction:', error);
    }
  }

  /**
   * Get user segments
   */
  async getUserSegments(userId: string): Promise<UserSegment[]> {
    console.log('🎯 Getting user segments for:', userId);
    
    try {
      const segments = await this.makeRequest<UserSegment[]>(`/segments/${userId}`);
      
      const profile = this.profiles.get(userId);
      if (profile) {
        profile.segments = segments;
        this.profiles.set(userId, profile);
      }
      
      console.log('✅ User segments retrieved:', segments.length);
      return segments;
      
    } catch (error) {
      console.error('❌ Failed to get user segments:', error);
      throw error;
    }
  }

  /**
   * Start personalization loop
   */
  private startPersonalizationLoop(): void {
    console.log('🔄 Starting personalization loop');
    
    // Run personalization updates every 10 minutes
    setInterval(async () => {
      for (const [userId, profile] of this.profiles) {
        try {
          // Check if adaptation is needed
          const lastUpdate = new Date(profile.last_updated);
          const timeSinceUpdate = Date.now() - lastUpdate.getTime();
          
          if (timeSinceUpdate > 30 * 60 * 1000 && profile.personalization_settings.enabled) { // 30 minutes
            // Trigger adaptation based on recent behavior
            // This would analyze recent interactions and adapt accordingly
            console.log('🔄 Auto-adapting for user:', userId);
          }
        } catch (error) {
          console.error('Failed to process personalization loop for user:', userId, error);
        }
      }
    }, 10 * 60 * 1000); // Every 10 minutes
  }

  /**
   * Load experiments
   */
  private async loadExperiments(): Promise<void> {
    try {
      const experiments = await this.makeRequest<PersonalizationExperiment[]>('/experiments');
      experiments.forEach(experiment => {
        this.experiments.set(experiment.id, experiment);
      });
      console.log('✅ Personalization experiments loaded:', experiments.length);
    } catch (error) {
      console.error('Failed to load personalization experiments:', error);
    }
  }

  /**
   * Get default preferences
   */
  private getDefaultPreferences(): UserPreferences {
    return {
      content: {
        categories: [],
        platforms: [],
        streamers: [],
        content_types: [],
        languages: [{ language: 'en', proficiency: 1, preference: 1 }],
        maturity_rating: 'general',
        content_length: { min: 0, max: 3600, optimal: 1800 },
        quality_preference: 'auto',
        freshness_importance: 0.7,
        diversity_preference: 0.5,
        novelty_seeking: 0.5
      },
      ui: {
        theme: {
          color_scheme: 'auto',
          primary_colors: [],
          accent_colors: [],
          contrast_level: 1,
          saturation_level: 1,
          brightness_level: 1,
          custom_themes: []
        },
        layout: {
          grid_type: 'adaptive',
          columns: 3,
          card_size: 'medium',
          information_density: 'standard',
          sidebar_position: 'left',
          header_style: 'standard',
          footer_style: 'standard'
        },
        navigation: {
          menu_style: 'sidebar',
          breadcrumbs: true,
          quick_actions: true,
          search_prominence: 0.8,
          keyboard_shortcuts: true,
          gesture_navigation: false,
          voice_navigation: false
        },
        display: {
          thumbnails: {
            style: 'standard',
            quality: 'adaptive',
            show_duration: true,
            show_viewer_count: true,
            show_platform_icon: true,
            blur_inappropriate: true
          },
          text: {
            truncation_style: 'ellipsis',
            description_length: 'medium',
            timestamp_format: 'relative',
            number_format: 'compact',
            language_fallback: ['en']
          },
          media: {
            autoplay: 'on_hover',
            mute_by_default: true,
            quality_adaptation: true,
            preload_strategy: 'metadata',
            pip_support: true,
            fullscreen_preference: 'browser'
          },
          overlays: {
            chat_overlay: true,
            stats_overlay: false,
            controls_overlay: true,
            branding_overlay: true,
            overlay_opacity: 0.8,
            overlay_position: 'bottom-right'
          },
          indicators: {
            live_indicators: true,
            quality_indicators: false,
            platform_indicators: true,
            status_indicators: true,
            progress_indicators: true,
            notification_badges: true
          }
        },
        animations: {
          enabled: true,
          duration_multiplier: 1,
          easing_preference: 'ease-in-out',
          reduced_motion: false,
          parallax_effects: true,
          transitions: true,
          micro_interactions: true
        },
        customization: {
          dashboard_widgets: [],
          quick_access_items: [],
          toolbar_configuration: {
            items: [],
            layout: 'horizontal',
            grouping: true,
            customizable: true
          },
          shortcuts: [],
          personal_collections: []
        }
      },
      interaction: {
        click_behavior: {
          single_click_action: 'select',
          double_click_action: 'open',
          middle_click_action: 'new_tab',
          right_click_behavior: 'context_menu',
          long_press_action: 'context_menu',
          delay_tolerance: 300
        },
        hover_behavior: {
          preview_delay: 500,
          preview_type: 'tooltip',
          auto_play_on_hover: false,
          info_display: 'standard',
          follow_cursor: false
        },
        touch_gestures: {
          swipe_actions: [],
          pinch_zoom: true,
          two_finger_scroll: true,
          edge_gestures: false,
          gesture_sensitivity: 0.7
        },
        voice_commands: {
          enabled: false,
          wake_word: 'hey assistant',
          language: 'en',
          commands: [],
          noise_suppression: true,
          confirmation_required: true
        },
        multi_touch: {
          enabled: true,
          max_touch_points: 10,
          gesture_combinations: [],
          palm_rejection: true
        },
        haptic_feedback: {
          enabled: true,
          intensity: 0.7,
          pattern_customization: false,
          context_aware: true,
          battery_aware: true
        }
      },
      notification: {
        channels: [],
        timing: {
          optimal_times: [],
          time_zone_aware: true,
          delay_when_active: true,
          batch_similar: true,
          rate_limiting: true
        },
        content: {
          detail_level: 'standard',
          include_previews: true,
          include_actions: true,
          personalize_content: true,
          language: 'en'
        },
        delivery: {
          methods: [],
          fallback_strategy: 'email',
          retry_attempts: 3,
          delivery_confirmation: false
        },
        privacy: {
          show_on_lock_screen: true,
          include_sensitive_info: false,
          anonymize_senders: false,
          group_conversations: true
        }
      },
      privacy: {
        data_collection: {
          analytics: true,
          behavioral_data: true,
          interaction_data: true,
          performance_data: true,
          crash_reports: true,
          usage_statistics: true,
          granular_controls: {}
        },
        sharing: {
          activity_sharing: false,
          recommendation_sharing: false,
          social_features: true,
          third_party_integrations: false,
          data_portability: true,
          sharing_controls: {}
        },
        tracking: {
          cross_site_tracking: false,
          advertising_tracking: false,
          analytics_tracking: true,
          personalization_tracking: true,
          do_not_track: false,
          tracking_exceptions: []
        },
        storage: {
          local_storage: true,
          cloud_storage: false,
          data_retention: 90,
          automatic_cleanup: true,
          encryption_required: true,
          backup_preferences: {
            enabled: false,
            frequency: 'weekly',
            retention_period: 30,
            include_settings: true,
            include_history: false,
            cloud_backup: false
          }
        },
        visibility: {
          profile_visibility: 'private',
          activity_visibility: 'private',
          online_status: false,
          typing_indicators: true,
          read_receipts: false
        }
      },
      accessibility: {
        visual: {
          high_contrast: false,
          large_text: false,
          screen_reader: false,
          magnification: 1,
          color_filters: [],
          focus_indicators: true,
          reduce_transparency: false
        },
        motor: {
          sticky_keys: false,
          slow_keys: false,
          bounce_keys: false,
          mouse_keys: false,
          voice_control: false,
          switch_control: false,
          gesture_alternatives: false
        },
        cognitive: {
          simplified_interface: false,
          reduced_distractions: false,
          clear_language: false,
          consistent_navigation: true,
          progress_indicators: true,
          timeout_extensions: false,
          content_warnings: false
        },
        auditory: {
          captions: false,
          audio_descriptions: false,
          sign_language: false,
          volume_amplification: false,
          frequency_adjustment: false,
          visual_sound_indicators: false
        },
        assistive_technology: {
          screen_reader_support: false,
          voice_recognition: false,
          eye_tracking: false,
          brain_computer_interface: false,
          custom_input_devices: false,
          api_integrations: []
        }
      },
      experimental: {
        beta_features: false,
        alpha_features: false,
        experimental_ui: false,
        ai_features: true,
        performance_experiments: false,
        feedback_participation: true,
        feature_flags: {}
      }
    };
  }

  private getDefaultBehaviorProfile(): BehaviorProfile {
    return {
      usage_patterns: [],
      interaction_patterns: [],
      content_consumption: {
        average_session_duration: 1800,
        content_completion_rate: 0.6,
        skipping_behavior: {
          skip_rate: 0.3,
          skip_patterns: [],
          skip_triggers: [],
          content_tolerance: 0.7
        },
        discovery_methods: [],
        binge_watching_tendency: 0.5,
        multitasking_frequency: 0.3
      },
      social_behavior: {
        sharing_frequency: 0.1,
        comment_frequency: 0.05,
        like_patterns: [],
        follow_behavior: {
          follow_rate: 0.1,
          unfollow_rate: 0.05,
          follow_criteria: [],
          loyalty_score: 0.7
        },
        community_participation: 0.3,
        influence_score: 0.2
      },
      temporal_patterns: [],
      device_usage: [],
      adaptation_rate: 0.5
    };
  }

  private getDefaultContextProfile(): ContextProfile {
    return {
      current_context: {
        location: 'unknown',
        device: 'web',
        network: 'wifi',
        time_of_day: 'evening',
        day_of_week: 'weekday',
        activity: 'browsing',
        companions: [],
        mood: 'neutral'
      },
      location_patterns: [],
      social_context: {
        social_situation: 'alone',
        group_size: 1,
        relationships: [],
        social_norms: [],
        influence_factors: []
      },
      temporal_context: {
        time_pressure: 0.5,
        schedule_flexibility: 0.7,
        routine_adherence: 0.6,
        temporal_preferences: []
      },
      environmental_factors: [],
      mood_indicators: []
    };
  }

  private getDefaultDemographicProfile(): DemographicProfile {
    return {
      age_group: 'unknown',
      gender: 'unknown',
      location: {
        country: 'unknown',
        region: 'unknown',
        city: 'unknown',
        timezone: 'UTC'
      },
      education: 'unknown',
      occupation: 'unknown',
      income_bracket: 'unknown',
      language_preferences: [{ language: 'en', proficiency: 1, preference: 1, context: [] }],
      cultural_background: {
        primary_culture: 'unknown',
        secondary_cultures: [],
        cultural_values: [],
        cultural_practices: []
      }
    };
  }

  private getDefaultPsychographicProfile(): PsychographicProfile {
    return {
      personality_traits: [],
      values: [],
      interests: [],
      lifestyle: [],
      motivations: [],
      attitudes: []
    };
  }

  /**
   * Clear personalization cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('✅ Personalization cache cleared');
  }

  /**
   * Get service statistics
   */
  getServiceStatistics(): {
    totalProfiles: number;
    activeExperiments: number;
    cacheSize: number;
    averagePersonalizationScore: number;
    adaptationsPerformed: number;
  } {
    const profiles = Array.from(this.profiles.values());
    const avgPersonalization = profiles.length > 0
      ? profiles.reduce((sum, profile) => sum + profile.personalization_settings.intensity, 0) / profiles.length
      : 0;
    
    const totalAdaptations = profiles.reduce((sum, profile) => 
      sum + profile.adaptation_history.adaptations.length, 0);
    
    return {
      totalProfiles: this.profiles.size,
      activeExperiments: Array.from(this.experiments.values()).filter(exp => exp.status === 'running').length,
      cacheSize: this.cache.size,
      averagePersonalizationScore: avgPersonalization,
      adaptationsPerformed: totalAdaptations
    };
  }
}

export const personalizationEngine = new PersonalizationEngine();
export default personalizationEngine;