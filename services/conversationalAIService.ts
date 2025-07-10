import { ChatMessage, ChatUser } from './realtimeChatService';
import { NLPAnalysis } from './nlpChatAnalysisService';
import { EmotionAnalysis } from './emotionRecognitionService';

export interface AIAssistant {
  id: string;
  name: string;
  type: AssistantType;
  personality: PersonalityProfile;
  capabilities: AssistantCapability[];
  specializations: string[];
  languages: string[];
  status: AssistantStatus;
  configuration: AssistantConfiguration;
  performance: AssistantPerformance;
  metadata: AssistantMetadata;
}

export type AssistantType = 
  | 'general' | 'streaming_helper' | 'moderator' | 'content_advisor'
  | 'technical_support' | 'community_manager' | 'analytics_advisor'
  | 'growth_coach' | 'monetization_expert' | 'brand_manager'
  | 'educational' | 'entertainment' | 'therapeutic' | 'creative';

export interface PersonalityProfile {
  traits: PersonalityTrait[];
  communication_style: CommunicationStyle;
  emotional_intelligence: EmotionalIntelligence;
  humor_style: HumorStyle;
  adaptability: number;
  empathy: number;
  assertiveness: number;
  creativity: number;
}

export interface PersonalityTrait {
  trait: string;
  value: number; // 0-1 scale
  consistency: number;
  context_dependent: boolean;
  manifestations: string[];
}

export interface CommunicationStyle {
  formality: 'formal' | 'casual' | 'adaptive';
  verbosity: 'concise' | 'moderate' | 'detailed';
  tone: 'professional' | 'friendly' | 'enthusiastic' | 'supportive' | 'playful';
  response_speed: 'immediate' | 'thoughtful' | 'context_dependent';
  personalization: number;
}

export interface EmotionalIntelligence {
  emotion_recognition: number;
  emotion_regulation: number;
  empathy_level: number;
  social_awareness: number;
  emotional_contagion: number;
  crisis_handling: number;
}

export interface HumorStyle {
  enabled: boolean;
  style: 'witty' | 'playful' | 'sarcastic' | 'punny' | 'observational' | 'none';
  appropriateness_filter: number;
  timing_sensitivity: number;
  cultural_awareness: number;
}

export interface AssistantCapability {
  capability: CapabilityType;
  proficiency: number;
  enabled: boolean;
  context_requirements: string[];
  limitations: string[];
  improvement_areas: string[];
}

export type CapabilityType = 
  | 'conversation' | 'question_answering' | 'task_assistance' | 'content_creation'
  | 'moderation' | 'translation' | 'summarization' | 'analysis'
  | 'recommendation' | 'tutoring' | 'emotional_support' | 'entertainment'
  | 'scheduling' | 'research' | 'problem_solving' | 'creative_writing';

export interface AssistantStatus {
  online: boolean;
  availability: 'available' | 'busy' | 'away' | 'do_not_disturb';
  current_conversations: number;
  max_conversations: number;
  response_time: number;
  queue_length: number;
  last_active: string;
}

export interface AssistantConfiguration {
  response_settings: ResponseSettings;
  knowledge_base: KnowledgeBaseConfig;
  learning_settings: LearningSettings;
  safety_settings: SafetySettings;
  integration_settings: IntegrationSettings;
  customization: CustomizationSettings;
}

export interface ResponseSettings {
  max_response_length: number;
  response_style: 'direct' | 'explanatory' | 'conversational';
  include_sources: boolean;
  confidence_threshold: number;
  fallback_responses: string[];
  context_window: number;
}

export interface KnowledgeBaseConfig {
  domains: string[];
  last_updated: string;
  update_frequency: string;
  custom_knowledge: CustomKnowledge[];
  fact_checking: boolean;
  source_verification: boolean;
}

export interface CustomKnowledge {
  id: string;
  topic: string;
  content: string;
  confidence: number;
  last_verified: string;
  source: string;
  tags: string[];
}

export interface LearningSettings {
  adaptive_learning: boolean;
  personalization: boolean;
  feedback_learning: boolean;
  conversation_memory: number; // days
  user_preference_learning: boolean;
  model_updates: boolean;
}

export interface SafetySettings {
  content_filtering: boolean;
  toxicity_threshold: number;
  privacy_protection: boolean;
  data_retention: number; // days
  bias_mitigation: boolean;
  inappropriate_content_handling: string;
}

export interface IntegrationSettings {
  external_apis: APIIntegration[];
  webhook_endpoints: string[];
  authentication_required: boolean;
  rate_limiting: RateLimitConfig;
  monitoring: MonitoringConfig;
}

export interface APIIntegration {
  service: string;
  endpoint: string;
  authentication: string;
  rate_limit: number;
  timeout: number;
  fallback_strategy: string;
}

export interface RateLimitConfig {
  requests_per_minute: number;
  burst_limit: number;
  per_user_limit: number;
  throttling_strategy: string;
}

export interface MonitoringConfig {
  performance_tracking: boolean;
  error_logging: boolean;
  usage_analytics: boolean;
  conversation_quality: boolean;
  user_satisfaction: boolean;
}

export interface CustomizationSettings {
  branding: BrandingConfig;
  ui_customization: UICustomization;
  voice_settings: VoiceSettings;
  avatar: AvatarConfig;
  greeting_messages: string[];
}

export interface BrandingConfig {
  name: string;
  logo: string;
  colors: string[];
  fonts: string[];
  style_guide: string;
}

export interface UICustomization {
  theme: string;
  layout: string;
  animations: boolean;
  quick_actions: QuickAction[];
  customizable_interface: boolean;
}

export interface QuickAction {
  label: string;
  action: string;
  icon: string;
  category: string;
  enabled: boolean;
}

export interface VoiceSettings {
  voice_enabled: boolean;
  voice_model: string;
  speed: number;
  pitch: number;
  emotion_expression: boolean;
  languages: string[];
}

export interface AvatarConfig {
  enabled: boolean;
  style: string;
  customization: Record<string, any>;
  animations: boolean;
  emotion_display: boolean;
}

export interface AssistantPerformance {
  metrics: PerformanceMetric[];
  user_satisfaction: UserSatisfaction;
  conversation_quality: ConversationQuality;
  task_completion: TaskCompletion;
  learning_progress: LearningProgress;
  error_analysis: ErrorAnalysis;
}

export interface PerformanceMetric {
  metric: string;
  value: number;
  trend: 'improving' | 'stable' | 'declining';
  benchmark: number;
  last_updated: string;
}

export interface UserSatisfaction {
  overall_rating: number;
  response_quality: number;
  helpfulness: number;
  personality_appeal: number;
  reliability: number;
  feedback_count: number;
}

export interface ConversationQuality {
  coherence: number;
  relevance: number;
  informativeness: number;
  engagement: number;
  naturalness: number;
  error_rate: number;
}

export interface TaskCompletion {
  success_rate: number;
  partial_completion_rate: number;
  average_completion_time: number;
  complexity_handling: number;
  follow_up_required: number;
}

export interface LearningProgress {
  knowledge_growth: number;
  adaptation_speed: number;
  personalization_accuracy: number;
  bias_reduction: number;
  skill_development: SkillDevelopment[];
}

export interface SkillDevelopment {
  skill: string;
  current_level: number;
  improvement_rate: number;
  target_level: number;
  milestones: string[];
}

export interface ErrorAnalysis {
  error_types: ErrorType[];
  frequency: { [errorType: string]: number };
  severity: { [errorType: string]: number };
  resolution_time: { [errorType: string]: number };
  prevention_strategies: string[];
}

export interface ErrorType {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  frequency: number;
  examples: string[];
  mitigation: string[];
}

export interface AssistantMetadata {
  version: string;
  created_date: string;
  last_updated: string;
  creator: string;
  category: string;
  tags: string[];
  usage_count: number;
  popularity_score: number;
}

export interface Conversation {
  id: string;
  participants: ConversationParticipant[];
  messages: ConversationMessage[];
  context: ConversationContext;
  state: ConversationState;
  analytics: ConversationAnalytics;
  metadata: ConversationMetadata;
}

export interface ConversationParticipant {
  id: string;
  type: 'user' | 'assistant' | 'system';
  name: string;
  role: string;
  permissions: string[];
  preferences: UserPreferences;
  history: InteractionHistory;
}

export interface UserPreferences {
  communication_style: string;
  response_length: string;
  topics_of_interest: string[];
  language: string;
  timezone: string;
  accessibility_needs: string[];
}

export interface InteractionHistory {
  total_conversations: number;
  total_messages: number;
  average_session_length: number;
  satisfaction_rating: number;
  preferred_assistants: string[];
  common_requests: string[];
}

export interface ConversationMessage {
  id: string;
  sender_id: string;
  sender_type: 'user' | 'assistant' | 'system';
  content: MessageContent;
  timestamp: string;
  processing: MessageProcessing;
  evaluation: MessageEvaluation;
  metadata: MessageMetadata;
}

export interface MessageContent {
  text: string;
  formatted_text?: string;
  attachments?: Attachment[];
  actions?: MessageAction[];
  suggestions?: MessageSuggestion[];
  media?: MediaContent[];
}

export interface Attachment {
  id: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'link';
  url: string;
  name: string;
  size: number;
  metadata: Record<string, any>;
}

export interface MessageAction {
  id: string;
  type: 'button' | 'link' | 'form' | 'selection';
  label: string;
  action: string;
  parameters: Record<string, any>;
  enabled: boolean;
}

export interface MessageSuggestion {
  id: string;
  text: string;
  type: 'quick_reply' | 'follow_up' | 'related_topic';
  confidence: number;
  context: string;
}

export interface MediaContent {
  id: string;
  type: 'image' | 'video' | 'audio' | 'gif';
  url: string;
  thumbnail?: string;
  duration?: number;
  dimensions?: { width: number; height: number };
}

export interface MessageProcessing {
  intent: IntentRecognition;
  entities: EntityExtraction[];
  sentiment: SentimentAnalysis;
  context: ContextUnderstanding;
  response_generation: ResponseGeneration;
}

export interface IntentRecognition {
  primary_intent: string;
  confidence: number;
  alternative_intents: { intent: string; confidence: number }[];
  parameters: { [key: string]: any };
  context_dependent: boolean;
}

export interface EntityExtraction {
  entity: string;
  type: string;
  value: string;
  confidence: number;
  context: string;
  resolved_value?: any;
}

export interface SentimentAnalysis {
  polarity: number; // -1 to 1
  emotions: { emotion: string; intensity: number }[];
  subjectivity: number;
  confidence: number;
  context_sentiment: string;
}

export interface ContextUnderstanding {
  conversation_context: string;
  user_context: string;
  situational_context: string;
  temporal_context: string;
  relevance_score: number;
}

export interface ResponseGeneration {
  strategy: string;
  reasoning: string[];
  alternatives_considered: string[];
  personalization_applied: string[];
  safety_checks: string[];
  confidence: number;
}

export interface MessageEvaluation {
  quality_score: number;
  relevance: number;
  helpfulness: number;
  clarity: number;
  appropriateness: number;
  user_feedback?: UserFeedback;
}

export interface UserFeedback {
  rating: number;
  feedback_type: 'thumbs_up' | 'thumbs_down' | 'rating' | 'text';
  comments?: string;
  aspects: { aspect: string; rating: number }[];
  timestamp: string;
}

export interface MessageMetadata {
  processing_time: number;
  model_version: string;
  confidence: number;
  fallback_used: boolean;
  external_api_calls: number;
  tokens_used: number;
}

export interface ConversationContext {
  topic: string;
  purpose: string;
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  domain: string;
  user_goal: string;
  assistant_role: string;
  constraints: string[];
}

export interface ConversationState {
  status: 'active' | 'paused' | 'completed' | 'abandoned' | 'escalated';
  current_step: string;
  progress: number;
  next_actions: string[];
  unresolved_issues: string[];
  satisfaction_level: number;
}

export interface ConversationAnalytics {
  duration: number;
  message_count: number;
  turn_count: number;
  goal_completion: boolean;
  user_satisfaction: number;
  conversation_quality: number;
  knowledge_gaps: string[];
  improvement_opportunities: string[];
}

export interface ConversationMetadata {
  channel: string;
  platform: string;
  session_id: string;
  user_agent: string;
  location?: string;
  referrer?: string;
  campaign?: string;
}

export interface ChatbotTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  use_cases: string[];
  personality: PersonalityProfile;
  capabilities: AssistantCapability[];
  configuration: TemplateConfiguration;
  customization_options: CustomizationOption[];
  examples: ConversationExample[];
}

export interface TemplateConfiguration {
  base_settings: Record<string, any>;
  required_integrations: string[];
  optional_features: string[];
  setup_steps: SetupStep[];
  deployment_options: DeploymentOption[];
}

export interface CustomizationOption {
  option: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'multiselect';
  default_value: any;
  options?: any[];
  validation: ValidationRule[];
  description: string;
}

export interface ValidationRule {
  type: string;
  value: any;
  message: string;
}

export interface SetupStep {
  step: number;
  title: string;
  description: string;
  required: boolean;
  estimated_time: number;
  dependencies: string[];
  validation: string[];
}

export interface DeploymentOption {
  option: string;
  description: string;
  requirements: string[];
  limitations: string[];
  pricing_tier: string;
}

export interface ConversationExample {
  title: string;
  scenario: string;
  conversation: { user: string; assistant: string }[];
  outcome: string;
  notes: string[];
}

class ConversationalAIService {
  private readonly baseUrl = process.env.EXPO_PUBLIC_AI_API_URL || 'https://api.streammulti.com/conversational';
  private readonly apiKey = process.env.EXPO_PUBLIC_AI_API_KEY || '';
  private readonly cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutes
  private assistants: Map<string, AIAssistant> = new Map();
  private conversations: Map<string, Conversation> = new Map();
  private templates: Map<string, ChatbotTemplate> = new Map();

  constructor() {
    console.log('Conversational AI Service initialized');
    this.initializeAssistants();
    this.loadTemplates();
    this.startConversationMonitoring();
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
      throw new Error(`Conversational AI API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    this.cache.set(cacheKey, { data, timestamp: Date.now() });
    
    return data;
  }

  /**
   * Start a new conversation with an AI assistant
   */
  async startConversation(
    assistantId: string,
    userId: string,
    initialMessage?: string,
    context?: {
      channel?: string;
      purpose?: string;
      urgency?: string;
      user_preferences?: UserPreferences;
    }
  ): Promise<Conversation> {
    console.log('🤖 Starting conversation with assistant:', assistantId);
    
    try {
      const conversation = await this.makeRequest<Conversation>('/conversations/start', {
        method: 'POST',
        body: JSON.stringify({
          assistantId,
          userId,
          initialMessage,
          context: context || {},
          options: {
            enablePersonalization: true,
            enableLearning: true,
            enableAnalytics: true,
            responseFormat: 'structured'
          }
        })
      });
      
      this.conversations.set(conversation.id, conversation);
      
      console.log('✅ Conversation started:', conversation.id);
      return conversation;
      
    } catch (error) {
      console.error('❌ Failed to start conversation:', error);
      throw error;
    }
  }

  /**
   * Send message and get AI response
   */
  async sendMessage(
    conversationId: string,
    message: string,
    options?: {
      attachments?: Attachment[];
      context?: Record<string, any>;
      responseType?: 'text' | 'structured' | 'action';
    }
  ): Promise<ConversationMessage> {
    console.log('💬 Sending message to conversation:', conversationId);
    
    try {
      const startTime = Date.now();
      
      const response = await this.makeRequest<ConversationMessage>(`/conversations/${conversationId}/message`, {
        method: 'POST',
        body: JSON.stringify({
          message,
          options: {
            attachments: options?.attachments ?? [],
            context: options?.context ?? {},
            responseType: options?.responseType ?? 'structured',
            includeAnalytics: true,
            includeSuggestions: true,
            enablePersonalization: true
          }
        })
      });

      response.metadata.processing_time = Date.now() - startTime;
      
      // Update conversation
      const conversation = this.conversations.get(conversationId);
      if (conversation) {
        conversation.messages.push(response);
        this.conversations.set(conversationId, conversation);
      }
      
      console.log('✅ Message processed and response generated');
      return response;
      
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      throw error;
    }
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(
    conversationId: string,
    options?: {
      limit?: number;
      includeAnalytics?: boolean;
      format?: 'full' | 'summary' | 'messages_only';
    }
  ): Promise<Conversation> {
    console.log('📖 Getting conversation history:', conversationId);
    
    try {
      const conversation = await this.makeRequest<Conversation>(`/conversations/${conversationId}`, {
        method: 'GET',
        headers: {
          'X-Options': JSON.stringify({
            limit: options?.limit ?? 100,
            includeAnalytics: options?.includeAnalytics ?? true,
            format: options?.format ?? 'full'
          })
        }
      });
      
      this.conversations.set(conversationId, conversation);
      
      console.log('✅ Conversation history retrieved:', conversation.messages.length, 'messages');
      return conversation;
      
    } catch (error) {
      console.error('❌ Failed to get conversation history:', error);
      throw error;
    }
  }

  /**
   * Create a custom AI assistant
   */
  async createAssistant(
    config: {
      name: string;
      type: AssistantType;
      personality: Partial<PersonalityProfile>;
      capabilities: CapabilityType[];
      specializations: string[];
      configuration: Partial<AssistantConfiguration>;
    }
  ): Promise<AIAssistant> {
    console.log('🛠️ Creating custom AI assistant:', config.name);
    
    try {
      const assistant = await this.makeRequest<AIAssistant>('/assistants/create', {
        method: 'POST',
        body: JSON.stringify({
          config,
          options: {
            enableTraining: true,
            enableCustomization: true,
            enableAnalytics: true,
            autoOptimization: true
          }
        })
      });
      
      this.assistants.set(assistant.id, assistant);
      
      console.log('✅ AI assistant created:', assistant.id);
      return assistant;
      
    } catch (error) {
      console.error('❌ Failed to create assistant:', error);
      throw error;
    }
  }

  /**
   * Train assistant with custom data
   */
  async trainAssistant(
    assistantId: string,
    trainingData: {
      conversations?: Conversation[];
      knowledge_base?: CustomKnowledge[];
      examples?: ConversationExample[];
      feedback?: UserFeedback[];
    },
    options?: {
      trainingMode?: 'incremental' | 'full_retrain';
      validationSplit?: number;
      epochs?: number;
    }
  ): Promise<{
    trainingJob: string;
    status: 'queued' | 'training' | 'completed' | 'failed';
    progress: number;
    estimatedCompletion: string;
    metrics?: {
      accuracy: number;
      loss: number;
      validation_score: number;
    };
  }> {
    console.log('📚 Training AI assistant:', assistantId);
    
    try {
      const trainingResult = await this.makeRequest<{
        trainingJob: string;
        status: 'queued' | 'training' | 'completed' | 'failed';
        progress: number;
        estimatedCompletion: string;
        metrics?: {
          accuracy: number;
          loss: number;
          validation_score: number;
        };
      }>(`/assistants/${assistantId}/train`, {
        method: 'POST',
        body: JSON.stringify({
          trainingData,
          options: {
            trainingMode: options?.trainingMode ?? 'incremental',
            validationSplit: options?.validationSplit ?? 0.2,
            epochs: options?.epochs ?? 10,
            enableValidation: true,
            enableEarlyStop: true,
            saveCheckpoints: true
          }
        })
      });
      
      console.log('✅ Training started for assistant:', assistantId, 'Job:', trainingResult.trainingJob);
      return trainingResult;
      
    } catch (error) {
      console.error('❌ Failed to train assistant:', error);
      throw error;
    }
  }

  /**
   * Deploy assistant to specific channels
   */
  async deployAssistant(
    assistantId: string,
    channels: string[],
    deploymentConfig: {
      autoScaling?: boolean;
      maxConcurrentConversations?: number;
      responseTimeTarget?: number;
      fallbackStrategy?: string;
      monitoring?: boolean;
    }
  ): Promise<{
    deploymentId: string;
    endpoints: { channel: string; endpoint: string; status: string }[];
    configuration: Record<string, any>;
    monitoring: {
      healthCheck: string;
      metrics: string;
      logs: string;
    };
  }> {
    console.log('🚀 Deploying assistant:', assistantId, 'to channels:', channels.join(', '));
    
    try {
      const deployment = await this.makeRequest<{
        deploymentId: string;
        endpoints: { channel: string; endpoint: string; status: string }[];
        configuration: Record<string, any>;
        monitoring: {
          healthCheck: string;
          metrics: string;
          logs: string;
        };
      }>(`/assistants/${assistantId}/deploy`, {
        method: 'POST',
        body: JSON.stringify({
          channels,
          deploymentConfig,
          options: {
            enableMonitoring: true,
            enableAutoScaling: true,
            enableFallback: true,
            validateBeforeDeployment: true
          }
        })
      });
      
      console.log('✅ Assistant deployed successfully:', deployment.deploymentId);
      return deployment;
      
    } catch (error) {
      console.error('❌ Failed to deploy assistant:', error);
      throw error;
    }
  }

  /**
   * Get assistant performance analytics
   */
  async getAssistantAnalytics(
    assistantId: string,
    timeframe: string,
    metrics: string[]
  ): Promise<{
    overall_performance: AssistantPerformance;
    time_series: { timestamp: string; metrics: Record<string, number> }[];
    comparisons: { metric: string; value: number; benchmark: number; percentile: number }[];
    insights: { insight: string; category: string; impact: string; recommendations: string[] }[];
  }> {
    console.log('📊 Getting assistant analytics:', assistantId);
    
    try {
      const analytics = await this.makeRequest<{
        overall_performance: AssistantPerformance;
        time_series: { timestamp: string; metrics: Record<string, number> }[];
        comparisons: { metric: string; value: number; benchmark: number; percentile: number }[];
        insights: { insight: string; category: string; impact: string; recommendations: string[] }[];
      }>(`/assistants/${assistantId}/analytics`, {
        method: 'POST',
        body: JSON.stringify({
          timeframe,
          metrics,
          options: {
            includeComparisons: true,
            includeInsights: true,
            includeTimeSeries: true,
            granularity: 'hour'
          }
        })
      });
      
      console.log('✅ Assistant analytics retrieved');
      return analytics;
      
    } catch (error) {
      console.error('❌ Failed to get assistant analytics:', error);
      throw error;
    }
  }

  /**
   * Optimize assistant based on performance data
   */
  async optimizeAssistant(
    assistantId: string,
    optimizationGoals: string[],
    constraints?: {
      maxResponseTime?: number;
      minAccuracy?: number;
      maxCost?: number;
      preservePersonality?: boolean;
    }
  ): Promise<{
    optimizationJob: string;
    recommendations: {
      category: string;
      recommendations: string[];
      expectedImpact: number;
      implementationEffort: number;
    }[];
    estimatedImprovement: Record<string, number>;
    timeline: string;
  }> {
    console.log('⚡ Optimizing assistant:', assistantId);
    
    try {
      const optimization = await this.makeRequest<{
        optimizationJob: string;
        recommendations: {
          category: string;
          recommendations: string[];
          expectedImpact: number;
          implementationEffort: number;
        }[];
        estimatedImprovement: Record<string, number>;
        timeline: string;
      }>(`/assistants/${assistantId}/optimize`, {
        method: 'POST',
        body: JSON.stringify({
          optimizationGoals,
          constraints: constraints || {},
          options: {
            includeRecommendations: true,
            enableAutoOptimization: false,
            validateChanges: true,
            backupCurrentVersion: true
          }
        })
      });
      
      console.log('✅ Assistant optimization started:', optimization.optimizationJob);
      return optimization;
      
    } catch (error) {
      console.error('❌ Failed to optimize assistant:', error);
      throw error;
    }
  }

  /**
   * Handle multi-turn conversation context
   */
  async manageConversationContext(
    conversationId: string,
    contextUpdates: {
      topic_shift?: string;
      goal_update?: string;
      user_preference_change?: Record<string, any>;
      context_memory?: Record<string, any>;
    }
  ): Promise<{
    updated_context: ConversationContext;
    context_summary: string;
    next_turn_strategy: string;
    memory_updates: string[];
  }> {
    console.log('🧠 Managing conversation context:', conversationId);
    
    try {
      const contextManagement = await this.makeRequest<{
        updated_context: ConversationContext;
        context_summary: string;
        next_turn_strategy: string;
        memory_updates: string[];
      }>(`/conversations/${conversationId}/context`, {
        method: 'PUT',
        body: JSON.stringify({
          contextUpdates,
          options: {
            enableMemoryUpdates: true,
            enableContextPrediction: true,
            enableGoalTracking: true,
            maxContextHistory: 20
          }
        })
      });
      
      console.log('✅ Conversation context updated');
      return contextManagement;
      
    } catch (error) {
      console.error('❌ Failed to manage conversation context:', error);
      throw error;
    }
  }

  /**
   * Generate conversation insights
   */
  async generateConversationInsights(
    conversationId: string,
    analysisType: 'user_satisfaction' | 'goal_completion' | 'conversation_quality' | 'learning_opportunities'
  ): Promise<{
    insights: {
      category: string;
      insight: string;
      confidence: number;
      evidence: string[];
      recommendations: string[];
    }[];
    scores: Record<string, number>;
    trends: { metric: string; direction: string; significance: number }[];
    action_items: { action: string; priority: number; timeline: string }[];
  }> {
    console.log('💡 Generating conversation insights:', conversationId);
    
    try {
      const insights = await this.makeRequest<{
        insights: {
          category: string;
          insight: string;
          confidence: number;
          evidence: string[];
          recommendations: string[];
        }[];
        scores: Record<string, number>;
        trends: { metric: string; direction: string; significance: number }[];
        action_items: { action: string; priority: number; timeline: string }[];
      }>(`/conversations/${conversationId}/insights`, {
        method: 'POST',
        body: JSON.stringify({
          analysisType,
          options: {
            includeScores: true,
            includeTrends: true,
            includeActionItems: true,
            confidenceThreshold: 0.7
          }
        })
      });
      
      console.log('✅ Conversation insights generated:', insights.insights.length);
      return insights;
      
    } catch (error) {
      console.error('❌ Failed to generate conversation insights:', error);
      throw error;
    }
  }

  /**
   * Initialize default assistants
   */
  private async initializeAssistants(): Promise<void> {
    try {
      const assistants = await this.makeRequest<AIAssistant[]>('/assistants');
      assistants.forEach(assistant => {
        this.assistants.set(assistant.id, assistant);
      });
      console.log('✅ AI assistants initialized:', assistants.length);
    } catch (error) {
      console.error('Failed to initialize assistants:', error);
    }
  }

  /**
   * Load chatbot templates
   */
  private async loadTemplates(): Promise<void> {
    try {
      const templates = await this.makeRequest<ChatbotTemplate[]>('/templates');
      templates.forEach(template => {
        this.templates.set(template.id, template);
      });
      console.log('✅ Chatbot templates loaded:', templates.length);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  }

  /**
   * Start conversation monitoring
   */
  private startConversationMonitoring(): void {
    console.log('🔄 Starting conversation monitoring');
    
    // Monitor active conversations every 30 seconds
    setInterval(async () => {
      for (const [conversationId, conversation] of this.conversations) {
        try {
          // Check conversation health
          if (conversation.state.status === 'active') {
            const lastMessage = conversation.messages[conversation.messages.length - 1];
            const timeSinceLastMessage = Date.now() - new Date(lastMessage.timestamp).getTime();
            
            // Mark as abandoned if no activity for 30 minutes
            if (timeSinceLastMessage > 30 * 60 * 1000) {
              conversation.state.status = 'abandoned';
              this.conversations.set(conversationId, conversation);
            }
          }
          
          // Clean up completed conversations after 1 hour
          if (conversation.state.status === 'completed') {
            const completionTime = Date.now() - new Date(conversation.messages[conversation.messages.length - 1].timestamp).getTime();
            if (completionTime > 60 * 60 * 1000) {
              this.conversations.delete(conversationId);
            }
          }
        } catch (error) {
          console.error('Failed to monitor conversation:', conversationId, error);
        }
      }
    }, 30000);
  }

  /**
   * Get available assistants
   */
  getAvailableAssistants(type?: AssistantType): AIAssistant[] {
    const assistants = Array.from(this.assistants.values());
    return type ? assistants.filter(assistant => assistant.type === type) : assistants;
  }

  /**
   * Get available templates
   */
  getAvailableTemplates(category?: string): ChatbotTemplate[] {
    const templates = Array.from(this.templates.values());
    return category ? templates.filter(template => template.category === category) : templates;
  }

  /**
   * Get active conversations
   */
  getActiveConversations(): Conversation[] {
    return Array.from(this.conversations.values()).filter(conv => conv.state.status === 'active');
  }

  /**
   * End conversation
   */
  async endConversation(
    conversationId: string,
    reason?: string,
    feedback?: UserFeedback
  ): Promise<{
    summary: string;
    analytics: ConversationAnalytics;
    satisfaction_score: number;
    follow_up_recommendations: string[];
  }> {
    console.log('👋 Ending conversation:', conversationId);
    
    try {
      const result = await this.makeRequest<{
        summary: string;
        analytics: ConversationAnalytics;
        satisfaction_score: number;
        follow_up_recommendations: string[];
      }>(`/conversations/${conversationId}/end`, {
        method: 'POST',
        body: JSON.stringify({
          reason,
          feedback,
          options: {
            generateSummary: true,
            generateAnalytics: true,
            enableLearning: true,
            saveHistory: true
          }
        })
      });
      
      // Update local conversation
      const conversation = this.conversations.get(conversationId);
      if (conversation) {
        conversation.state.status = 'completed';
        this.conversations.set(conversationId, conversation);
      }
      
      console.log('✅ Conversation ended successfully');
      return result;
      
    } catch (error) {
      console.error('❌ Failed to end conversation:', error);
      throw error;
    }
  }

  /**
   * Clear conversation cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('✅ Conversational AI cache cleared');
  }

  /**
   * Get service statistics
   */
  getServiceStatistics(): {
    totalAssistants: number;
    activeConversations: number;
    totalConversations: number;
    averageConversationLength: number;
    averageSatisfactionRating: number;
    cacheSize: number;
  } {
    const conversations = Array.from(this.conversations.values());
    const avgLength = conversations.length > 0 
      ? conversations.reduce((sum, conv) => sum + conv.messages.length, 0) / conversations.length 
      : 0;
    
    const avgSatisfaction = conversations.length > 0
      ? conversations.reduce((sum, conv) => sum + (conv.analytics?.user_satisfaction || 0), 0) / conversations.length
      : 0;
    
    return {
      totalAssistants: this.assistants.size,
      activeConversations: this.getActiveConversations().length,
      totalConversations: this.conversations.size,
      averageConversationLength: avgLength,
      averageSatisfactionRating: avgSatisfaction,
      cacheSize: this.cache.size
    };
  }
}

export const conversationalAIService = new ConversationalAIService();
export default conversationalAIService;