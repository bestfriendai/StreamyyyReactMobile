import { ChatMessage } from './realtimeChatService';
import { EmotionAnalysis } from './emotionRecognitionService';

export interface NLPAnalysis {
  id: string;
  messageId: string;
  text: string;
  language: LanguageDetection;
  sentiment: SentimentAnalysis;
  entities: NamedEntity[];
  topics: TopicAnalysis[];
  keywords: Keyword[];
  intent: IntentAnalysis;
  toxicity: ToxicityAnalysis;
  complexity: TextComplexity;
  style: WritingStyle;
  contextual: ContextualAnalysis;
  semantic: SemanticAnalysis;
  timestamp: string;
  metadata: {
    processingTime: number;
    modelVersion: string;
    confidence: number;
    algorithms: string[];
  };
}

export interface LanguageDetection {
  language: string;
  confidence: number;
  alternativeLanguages: { language: string; confidence: number }[];
  script: string;
  region?: string;
}

export interface SentimentAnalysis {
  overall: SentimentScore;
  aspects: AspectSentiment[];
  emotions: EmotionSentiment[];
  subjectivity: number;
  intensity: number;
  confidence: number;
  contextualSentiment: ContextualSentiment[];
}

export interface SentimentScore {
  label: 'positive' | 'negative' | 'neutral';
  score: number; // -1 to 1
  confidence: number;
  magnitude: number;
}

export interface AspectSentiment {
  aspect: string;
  sentiment: SentimentScore;
  mentions: string[];
  context: string;
  relevance: number;
}

export interface EmotionSentiment {
  emotion: string;
  sentiment: SentimentScore;
  triggers: string[];
  intensity: number;
}

export interface ContextualSentiment {
  context: string;
  sentiment: SentimentScore;
  relevance: number;
  temporal: boolean;
}

export interface NamedEntity {
  entity: string;
  type: EntityType;
  startIndex: number;
  endIndex: number;
  confidence: number;
  metadata: EntityMetadata;
  relationships: EntityRelationship[];
}

export type EntityType = 
  | 'PERSON' | 'ORGANIZATION' | 'LOCATION' | 'PRODUCT' | 'EVENT'
  | 'GAME' | 'MOVIE' | 'BOOK' | 'BRAND' | 'TECHNOLOGY'
  | 'CURRENCY' | 'DATE' | 'TIME' | 'PERCENTAGE' | 'QUANTITY'
  | 'STREAMER' | 'PLATFORM' | 'CATEGORY' | 'HASHTAG' | 'EMOJI'
  | 'URL' | 'EMAIL' | 'PHONE' | 'USERNAME' | 'CUSTOM';

export interface EntityMetadata {
  canonicalForm: string;
  aliases: string[];
  description?: string;
  category?: string;
  popularity?: number;
  sentiment?: SentimentScore;
  wikipediaId?: string;
  knowledgeGraphId?: string;
}

export interface EntityRelationship {
  type: 'mentions' | 'related_to' | 'part_of' | 'similar_to' | 'opposite_of';
  target: string;
  confidence: number;
  context: string;
}

export interface TopicAnalysis {
  topic: string;
  relevance: number;
  keywords: string[];
  category: string;
  trending: boolean;
  sentiment: SentimentScore;
  entities: string[];
  subtopics: Subtopic[];
}

export interface Subtopic {
  name: string;
  relevance: number;
  keywords: string[];
  context: string;
}

export interface Keyword {
  word: string;
  importance: number;
  frequency: number;
  context: string[];
  pos: PartOfSpeech;
  sentiment: SentimentScore;
  trending: boolean;
}

export interface PartOfSpeech {
  tag: string;
  description: string;
  confidence: number;
}

export interface IntentAnalysis {
  primaryIntent: Intent;
  alternativeIntents: Intent[];
  confidence: number;
  context: string;
  actionable: boolean;
}

export interface Intent {
  intent: string;
  category: IntentCategory;
  confidence: number;
  parameters: IntentParameter[];
  fulfillment: string;
  priority: number;
}

export type IntentCategory = 
  | 'question' | 'request' | 'complaint' | 'compliment' | 'suggestion'
  | 'information' | 'support' | 'social' | 'entertainment' | 'commercial'
  | 'moderation' | 'technical' | 'feedback' | 'spam' | 'other';

export interface IntentParameter {
  name: string;
  value: string;
  confidence: number;
  required: boolean;
  type: string;
}

export interface ToxicityAnalysis {
  overall: ToxicityScore;
  categories: ToxicityCategory[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  actionRequired: boolean;
  context: string;
  triggers: string[];
}

export interface ToxicityScore {
  score: number; // 0 to 1
  confidence: number;
  threshold: number;
  classification: 'safe' | 'caution' | 'unsafe' | 'toxic';
}

export interface ToxicityCategory {
  category: string;
  score: number;
  confidence: number;
  evidence: string[];
  context: string;
}

export interface TextComplexity {
  readabilityScore: number;
  gradeLevel: number;
  sentenceComplexity: number;
  vocabularyComplexity: number;
  syntacticComplexity: number;
  cognitiveLoad: number;
  metrics: ComplexityMetrics;
}

export interface ComplexityMetrics {
  averageWordsPerSentence: number;
  averageSyllablesPerWord: number;
  lexicalDiversity: number;
  sentenceVariety: number;
  clauseComplexity: number;
  abstractConcepts: number;
}

export interface WritingStyle {
  formality: number; // 0 to 1
  creativity: number;
  emotiveness: number;
  persuasiveness: number;
  clarity: number;
  conciseness: number;
  characteristics: StyleCharacteristic[];
}

export interface StyleCharacteristic {
  trait: string;
  score: number;
  description: string;
  examples: string[];
}

export interface ContextualAnalysis {
  conversationContext: ConversationContext;
  temporalContext: TemporalContext;
  socialContext: SocialContext;
  platformContext: PlatformContext;
  domainContext: DomainContext;
}

export interface ConversationContext {
  threadId?: string;
  replyTo?: string;
  conversationTurn: number;
  topicContinuity: number;
  coherence: number;
  relevance: number;
  newInformation: number;
}

export interface TemporalContext {
  timestamp: string;
  timeOfDay: string;
  dayOfWeek: string;
  season: string;
  eventContext?: string;
  urgency: number;
  timeliness: number;
}

export interface SocialContext {
  audience: string;
  relationships: string[];
  socialSignals: SocialSignal[];
  groupDynamics: GroupDynamics;
  influenceLevel: number;
}

export interface SocialSignal {
  type: 'mention' | 'emoji' | 'hashtag' | 'slang' | 'cultural_reference';
  value: string;
  meaning: string;
  context: string;
  popularity: number;
}

export interface GroupDynamics {
  leadershipIndicators: number;
  conformityIndicators: number;
  disruptionIndicators: number;
  engagementLevel: number;
  communityFit: number;
}

export interface PlatformContext {
  platform: string;
  roomType: string;
  moderationLevel: string;
  communityGuidelines: string[];
  platformSpecificFeatures: PlatformFeature[];
}

export interface PlatformFeature {
  feature: string;
  usage: string;
  appropriateness: number;
  effectiveness: number;
}

export interface DomainContext {
  domain: string;
  jargon: DomainJargon[];
  expertise: number;
  authenticity: number;
  knowledgeLevel: number;
}

export interface DomainJargon {
  term: string;
  definition: string;
  commonality: number;
  correctUsage: boolean;
}

export interface SemanticAnalysis {
  embedding: number[];
  semanticSimilarity: SemanticSimilarity[];
  conceptualThemes: ConceptualTheme[];
  abstractionLevel: number;
  semanticRoles: SemanticRole[];
  discourse: DiscourseAnalysis;
}

export interface SemanticSimilarity {
  text: string;
  similarity: number;
  context: string;
  type: 'lexical' | 'syntactic' | 'semantic' | 'pragmatic';
}

export interface ConceptualTheme {
  theme: string;
  relevance: number;
  abstractionLevel: number;
  related_concepts: string[];
  semantic_field: string;
}

export interface SemanticRole {
  role: string;
  entity: string;
  confidence: number;
  context: string;
}

export interface DiscourseAnalysis {
  rhetoricFunction: string;
  argumentStructure: ArgumentStructure;
  persuasionTechniques: PersuasionTechnique[];
  logicalFallacies: LogicalFallacy[];
  coherenceMarkers: CoherenceMarker[];
}

export interface ArgumentStructure {
  claim: string;
  evidence: string[];
  reasoning: string;
  counterarguments: string[];
  strength: number;
}

export interface PersuasionTechnique {
  technique: string;
  effectiveness: number;
  ethical: boolean;
  context: string;
}

export interface LogicalFallacy {
  fallacy: string;
  severity: number;
  context: string;
  correction: string;
}

export interface CoherenceMarker {
  marker: string;
  function: string;
  effectiveness: number;
  position: number;
}

export interface ConversationAnalysis {
  conversationId: string;
  participants: string[];
  messages: NLPAnalysis[];
  flow: ConversationFlow;
  dynamics: ConversationDynamics;
  quality: ConversationQuality;
  insights: ConversationInsight[];
  summary: ConversationSummary;
}

export interface ConversationFlow {
  turns: ConversationTurn[];
  transitions: FlowTransition[];
  patterns: ConversationPattern[];
  coherence: number;
  continuity: number;
}

export interface ConversationTurn {
  speaker: string;
  message: string;
  intent: string;
  response_quality: number;
  topic_shift: boolean;
  engagement_level: number;
}

export interface FlowTransition {
  from: string;
  to: string;
  trigger: string;
  smoothness: number;
  natural: boolean;
}

export interface ConversationPattern {
  pattern: string;
  frequency: number;
  participants: string[];
  effectiveness: number;
  context: string;
}

export interface ConversationDynamics {
  dominance: { participant: string; score: number }[];
  participation: { participant: string; contribution: number }[];
  influence: { participant: string; influence: number }[];
  cooperation: number;
  conflict: number;
  engagement: number;
}

export interface ConversationQuality {
  informativeness: number;
  relevance: number;
  coherence: number;
  depth: number;
  breadth: number;
  constructiveness: number;
  overall: number;
}

export interface ConversationInsight {
  type: 'pattern' | 'anomaly' | 'trend' | 'opportunity' | 'risk';
  description: string;
  confidence: number;
  actionable: boolean;
  recommendations: string[];
}

export interface ConversationSummary {
  mainTopics: string[];
  keyPoints: string[];
  decisions: string[];
  actionItems: string[];
  sentiment: SentimentScore;
  participants_summary: { participant: string; contribution: string }[];
  duration: string;
  outcome: string;
}

export interface ChatTrendAnalysis {
  timeframe: string;
  trends: ChatTrend[];
  anomalies: ChatAnomaly[];
  patterns: ChatPattern[];
  insights: ChatInsight[];
  predictions: ChatPrediction[];
}

export interface ChatTrend {
  type: 'topic' | 'sentiment' | 'toxicity' | 'engagement' | 'language';
  trend: string;
  direction: 'rising' | 'falling' | 'stable' | 'volatile';
  magnitude: number;
  significance: number;
  context: string;
}

export interface ChatAnomaly {
  type: string;
  description: string;
  severity: number;
  timestamp: string;
  context: string;
  impact: number;
}

export interface ChatPattern {
  pattern: string;
  frequency: number;
  strength: number;
  context: string;
  participants: string[];
  temporal: boolean;
}

export interface ChatInsight {
  insight: string;
  confidence: number;
  category: string;
  actionable: boolean;
  recommendations: string[];
  evidence: string[];
}

export interface ChatPrediction {
  prediction: string;
  probability: number;
  timeframe: string;
  factors: string[];
  confidence: number;
}

class NLPChatAnalysisService {
  private readonly baseUrl = process.env.EXPO_PUBLIC_AI_API_URL || 'https://api.streammulti.com/nlp';
  private readonly apiKey = process.env.EXPO_PUBLIC_AI_API_KEY || '';
  private readonly cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutes
  private conversationContexts: Map<string, ConversationAnalysis> = new Map();

  constructor() {
    console.log('NLP Chat Analysis Service initialized');
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
      throw new Error(`NLP API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    this.cache.set(cacheKey, { data, timestamp: Date.now() });
    
    return data;
  }

  /**
   * Comprehensive NLP analysis of chat message
   */
  async analyzeMessage(message: ChatMessage, context?: {
    conversationId?: string;
    previousMessages?: ChatMessage[];
    roomContext?: any;
  }): Promise<NLPAnalysis> {
    console.log('🔍 Analyzing message with NLP:', message.id);
    
    try {
      const startTime = Date.now();
      
      const analysis = await this.makeRequest<NLPAnalysis>('/analyze/message', {
        method: 'POST',
        body: JSON.stringify({
          message: {
            id: message.id,
            text: message.message,
            userId: message.userId,
            username: message.username,
            timestamp: message.timestamp,
            type: message.type,
            mentions: message.mentions,
            replyTo: message.replyTo
          },
          context: context || {},
          options: {
            includeSentiment: true,
            includeEntities: true,
            includeTopics: true,
            includeIntent: true,
            includeToxicity: true,
            includeComplexity: true,
            includeStyle: true,
            includeContextual: true,
            includeSemantic: true
          }
        })
      });

      analysis.metadata.processingTime = Date.now() - startTime;
      
      console.log('✅ NLP analysis completed in', analysis.metadata.processingTime, 'ms');
      return analysis;
      
    } catch (error) {
      console.error('❌ Failed to analyze message:', error);
      throw error;
    }
  }

  /**
   * Batch analyze multiple messages
   */
  async analyzeMessages(messages: ChatMessage[], options?: {
    includeConversationAnalysis?: boolean;
    includeRelationships?: boolean;
    maxConcurrency?: number;
  }): Promise<NLPAnalysis[]> {
    console.log('📦 Batch analyzing messages:', messages.length);
    
    try {
      const analyses = await this.makeRequest<NLPAnalysis[]>('/analyze/batch', {
        method: 'POST',
        body: JSON.stringify({
          messages: messages.map(msg => ({
            id: msg.id,
            text: msg.message,
            userId: msg.userId,
            username: msg.username,
            timestamp: msg.timestamp,
            type: msg.type,
            mentions: msg.mentions,
            replyTo: msg.replyTo
          })),
          options: {
            includeConversationAnalysis: options?.includeConversationAnalysis ?? true,
            includeRelationships: options?.includeRelationships ?? true,
            maxConcurrency: options?.maxConcurrency ?? 10
          }
        })
      });
      
      console.log('✅ Batch analysis completed:', analyses.length, 'analyses');
      return analyses;
      
    } catch (error) {
      console.error('❌ Failed to batch analyze messages:', error);
      throw error;
    }
  }

  /**
   * Analyze conversation flow and dynamics
   */
  async analyzeConversation(conversationId: string, messages: ChatMessage[]): Promise<ConversationAnalysis> {
    console.log('💬 Analyzing conversation:', conversationId);
    
    try {
      const analysis = await this.makeRequest<ConversationAnalysis>('/analyze/conversation', {
        method: 'POST',
        body: JSON.stringify({
          conversationId,
          messages: messages.map(msg => ({
            id: msg.id,
            text: msg.message,
            userId: msg.userId,
            username: msg.username,
            timestamp: msg.timestamp,
            type: msg.type,
            mentions: msg.mentions,
            replyTo: msg.replyTo
          })),
          options: {
            includeFlow: true,
            includeDynamics: true,
            includeQuality: true,
            generateInsights: true,
            createSummary: true
          }
        })
      });
      
      this.conversationContexts.set(conversationId, analysis);
      
      console.log('✅ Conversation analysis completed');
      return analysis;
      
    } catch (error) {
      console.error('❌ Failed to analyze conversation:', error);
      throw error;
    }
  }

  /**
   * Detect and analyze chat sentiment in real-time
   */
  async analyzeSentiment(text: string, context?: {
    previousMessages?: string[];
    userHistory?: any;
    roomContext?: any;
  }): Promise<SentimentAnalysis> {
    console.log('😊 Analyzing sentiment:', text.substring(0, 50) + '...');
    
    try {
      const sentiment = await this.makeRequest<SentimentAnalysis>('/analyze/sentiment', {
        method: 'POST',
        body: JSON.stringify({
          text,
          context: context || {},
          options: {
            includeAspects: true,
            includeEmotions: true,
            includeContextual: true,
            includeIntensity: true
          }
        })
      });
      
      console.log('✅ Sentiment analysis completed:', sentiment.overall.label);
      return sentiment;
      
    } catch (error) {
      console.error('❌ Failed to analyze sentiment:', error);
      throw error;
    }
  }

  /**
   * Extract and analyze named entities
   */
  async extractEntities(text: string, options?: {
    entityTypes?: EntityType[];
    includeRelationships?: boolean;
    includeMetadata?: boolean;
  }): Promise<NamedEntity[]> {
    console.log('🏷️ Extracting entities:', text.substring(0, 50) + '...');
    
    try {
      const entities = await this.makeRequest<NamedEntity[]>('/extract/entities', {
        method: 'POST',
        body: JSON.stringify({
          text,
          options: {
            entityTypes: options?.entityTypes || [],
            includeRelationships: options?.includeRelationships ?? true,
            includeMetadata: options?.includeMetadata ?? true,
            confidenceThreshold: 0.7
          }
        })
      });
      
      console.log('✅ Entity extraction completed:', entities.length, 'entities');
      return entities;
      
    } catch (error) {
      console.error('❌ Failed to extract entities:', error);
      throw error;
    }
  }

  /**
   * Analyze topics and themes
   */
  async analyzeTopics(text: string, options?: {
    maxTopics?: number;
    includeSubtopics?: boolean;
    includeTrending?: boolean;
  }): Promise<TopicAnalysis[]> {
    console.log('📚 Analyzing topics:', text.substring(0, 50) + '...');
    
    try {
      const topics = await this.makeRequest<TopicAnalysis[]>('/analyze/topics', {
        method: 'POST',
        body: JSON.stringify({
          text,
          options: {
            maxTopics: options?.maxTopics ?? 10,
            includeSubtopics: options?.includeSubtopics ?? true,
            includeTrending: options?.includeTrending ?? true,
            includeEntities: true,
            includeSentiment: true
          }
        })
      });
      
      console.log('✅ Topic analysis completed:', topics.length, 'topics');
      return topics;
      
    } catch (error) {
      console.error('❌ Failed to analyze topics:', error);
      throw error;
    }
  }

  /**
   * Detect user intent and purpose
   */
  async detectIntent(text: string, context?: {
    conversationHistory?: string[];
    userProfile?: any;
    roomContext?: any;
  }): Promise<IntentAnalysis> {
    console.log('🎯 Detecting intent:', text.substring(0, 50) + '...');
    
    try {
      const intent = await this.makeRequest<IntentAnalysis>('/detect/intent', {
        method: 'POST',
        body: JSON.stringify({
          text,
          context: context || {},
          options: {
            includeParameters: true,
            includeAlternatives: true,
            includeFulfillment: true,
            confidenceThreshold: 0.6
          }
        })
      });
      
      console.log('✅ Intent detection completed:', intent.primaryIntent.intent);
      return intent;
      
    } catch (error) {
      console.error('❌ Failed to detect intent:', error);
      throw error;
    }
  }

  /**
   * Analyze toxicity and harmful content
   */
  async analyzeToxicity(text: string, context?: {
    userHistory?: any;
    roomGuidelines?: string[];
    severity?: 'low' | 'medium' | 'high';
  }): Promise<ToxicityAnalysis> {
    console.log('🛡️ Analyzing toxicity:', text.substring(0, 50) + '...');
    
    try {
      const toxicity = await this.makeRequest<ToxicityAnalysis>('/analyze/toxicity', {
        method: 'POST',
        body: JSON.stringify({
          text,
          context: context || {},
          options: {
            includeCategories: true,
            includeContext: true,
            includeTriggers: true,
            sensitivityLevel: context?.severity || 'medium'
          }
        })
      });
      
      console.log('✅ Toxicity analysis completed:', toxicity.overall.classification);
      return toxicity;
      
    } catch (error) {
      console.error('❌ Failed to analyze toxicity:', error);
      throw error;
    }
  }

  /**
   * Analyze text complexity and readability
   */
  async analyzeComplexity(text: string): Promise<TextComplexity> {
    console.log('📊 Analyzing text complexity:', text.substring(0, 50) + '...');
    
    try {
      const complexity = await this.makeRequest<TextComplexity>('/analyze/complexity', {
        method: 'POST',
        body: JSON.stringify({
          text,
          options: {
            includeReadability: true,
            includeMetrics: true,
            includeSyntactic: true,
            includeVocabulary: true,
            includeCognitive: true
          }
        })
      });
      
      console.log('✅ Complexity analysis completed, grade level:', complexity.gradeLevel);
      return complexity;
      
    } catch (error) {
      console.error('❌ Failed to analyze complexity:', error);
      throw error;
    }
  }

  /**
   * Analyze writing style and characteristics
   */
  async analyzeWritingStyle(text: string): Promise<WritingStyle> {
    console.log('✍️ Analyzing writing style:', text.substring(0, 50) + '...');
    
    try {
      const style = await this.makeRequest<WritingStyle>('/analyze/style', {
        method: 'POST',
        body: JSON.stringify({
          text,
          options: {
            includeFormality: true,
            includeCreativity: true,
            includeEmotiveness: true,
            includePersuasiveness: true,
            includeClarity: true,
            includeCharacteristics: true
          }
        })
      });
      
      console.log('✅ Writing style analysis completed');
      return style;
      
    } catch (error) {
      console.error('❌ Failed to analyze writing style:', error);
      throw error;
    }
  }

  /**
   * Create semantic embedding for text
   */
  async createSemanticEmbedding(text: string): Promise<number[]> {
    console.log('🧠 Creating semantic embedding:', text.substring(0, 50) + '...');
    
    try {
      const embedding = await this.makeRequest<{ embedding: number[] }>('/semantic/embedding', {
        method: 'POST',
        body: JSON.stringify({
          text,
          options: {
            model: 'advanced',
            dimensions: 512,
            normalize: true
          }
        })
      });
      
      console.log('✅ Semantic embedding created, dimensions:', embedding.embedding.length);
      return embedding.embedding;
      
    } catch (error) {
      console.error('❌ Failed to create semantic embedding:', error);
      throw error;
    }
  }

  /**
   * Find semantically similar messages
   */
  async findSimilarMessages(targetText: string, corpus: string[], options?: {
    maxResults?: number;
    minSimilarity?: number;
    includeScores?: boolean;
  }): Promise<{ text: string; similarity: number; index: number }[]> {
    console.log('🔍 Finding similar messages:', targetText.substring(0, 50) + '...');
    
    try {
      const similar = await this.makeRequest<{ text: string; similarity: number; index: number }[]>('/semantic/similar', {
        method: 'POST',
        body: JSON.stringify({
          targetText,
          corpus,
          options: {
            maxResults: options?.maxResults ?? 10,
            minSimilarity: options?.minSimilarity ?? 0.5,
            includeScores: options?.includeScores ?? true
          }
        })
      });
      
      console.log('✅ Similar messages found:', similar.length, 'results');
      return similar;
      
    } catch (error) {
      console.error('❌ Failed to find similar messages:', error);
      throw error;
    }
  }

  /**
   * Analyze chat trends over time
   */
  async analyzeChatTrends(messages: ChatMessage[], timeframe: string): Promise<ChatTrendAnalysis> {
    console.log('📈 Analyzing chat trends:', messages.length, 'messages');
    
    try {
      const trends = await this.makeRequest<ChatTrendAnalysis>('/analyze/trends', {
        method: 'POST',
        body: JSON.stringify({
          messages: messages.map(msg => ({
            id: msg.id,
            text: msg.message,
            userId: msg.userId,
            username: msg.username,
            timestamp: msg.timestamp
          })),
          timeframe,
          options: {
            includeAnomalies: true,
            includePatterns: true,
            includeInsights: true,
            includePredictions: true,
            granularity: 'hour'
          }
        })
      });
      
      console.log('✅ Chat trends analysis completed');
      return trends;
      
    } catch (error) {
      console.error('❌ Failed to analyze chat trends:', error);
      throw error;
    }
  }

  /**
   * Generate automatic chat summary
   */
  async generateChatSummary(messages: ChatMessage[], options?: {
    summaryLength?: 'short' | 'medium' | 'long';
    includeKeyPoints?: boolean;
    includeParticipants?: boolean;
    includeSentiment?: boolean;
  }): Promise<ConversationSummary> {
    console.log('📝 Generating chat summary:', messages.length, 'messages');
    
    try {
      const summary = await this.makeRequest<ConversationSummary>('/generate/summary', {
        method: 'POST',
        body: JSON.stringify({
          messages: messages.map(msg => ({
            id: msg.id,
            text: msg.message,
            userId: msg.userId,
            username: msg.username,
            timestamp: msg.timestamp
          })),
          options: {
            summaryLength: options?.summaryLength ?? 'medium',
            includeKeyPoints: options?.includeKeyPoints ?? true,
            includeParticipants: options?.includeParticipants ?? true,
            includeSentiment: options?.includeSentiment ?? true,
            includeActionItems: true,
            includeDecisions: true
          }
        })
      });
      
      console.log('✅ Chat summary generated');
      return summary;
      
    } catch (error) {
      console.error('❌ Failed to generate chat summary:', error);
      throw error;
    }
  }

  /**
   * Detect language and auto-translate
   */
  async detectAndTranslate(text: string, targetLanguage: string): Promise<{
    detectedLanguage: LanguageDetection;
    translation: string;
    confidence: number;
    alternativeTranslations: string[];
  }> {
    console.log('🌍 Detecting language and translating:', text.substring(0, 50) + '...');
    
    try {
      const result = await this.makeRequest<{
        detectedLanguage: LanguageDetection;
        translation: string;
        confidence: number;
        alternativeTranslations: string[];
      }>('/translate', {
        method: 'POST',
        body: JSON.stringify({
          text,
          targetLanguage,
          options: {
            includeDetection: true,
            includeAlternatives: true,
            preserveFormatting: true,
            qualityCheck: true
          }
        })
      });
      
      console.log('✅ Language detection and translation completed');
      return result;
      
    } catch (error) {
      console.error('❌ Failed to detect language and translate:', error);
      throw error;
    }
  }

  /**
   * Analyze user communication patterns
   */
  async analyzeUserCommunicationPattern(userId: string, messages: ChatMessage[]): Promise<{
    communicationStyle: WritingStyle;
    topicPreferences: TopicAnalysis[];
    sentimentPattern: SentimentAnalysis;
    complexityLevel: TextComplexity;
    socialBehavior: SocialContext;
    engagement: { level: number; patterns: string[] };
    insights: string[];
  }> {
    console.log('👤 Analyzing user communication pattern:', userId);
    
    try {
      const pattern = await this.makeRequest<{
        communicationStyle: WritingStyle;
        topicPreferences: TopicAnalysis[];
        sentimentPattern: SentimentAnalysis;
        complexityLevel: TextComplexity;
        socialBehavior: SocialContext;
        engagement: { level: number; patterns: string[] };
        insights: string[];
      }>('/analyze/user-pattern', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          messages: messages.map(msg => ({
            id: msg.id,
            text: msg.message,
            timestamp: msg.timestamp,
            mentions: msg.mentions,
            replyTo: msg.replyTo
          })),
          options: {
            includeStyle: true,
            includeTopics: true,
            includeSentiment: true,
            includeComplexity: true,
            includeSocial: true,
            includeEngagement: true,
            includeInsights: true
          }
        })
      });
      
      console.log('✅ User communication pattern analysis completed');
      return pattern;
      
    } catch (error) {
      console.error('❌ Failed to analyze user communication pattern:', error);
      throw error;
    }
  }

  /**
   * Generate conversation insights
   */
  async generateConversationInsights(conversationId: string): Promise<ConversationInsight[]> {
    console.log('💡 Generating conversation insights:', conversationId);
    
    try {
      const insights = await this.makeRequest<ConversationInsight[]>(`/insights/${conversationId}`);
      
      console.log('✅ Conversation insights generated:', insights.length, 'insights');
      return insights;
      
    } catch (error) {
      console.error('❌ Failed to generate conversation insights:', error);
      throw error;
    }
  }

  /**
   * Real-time chat quality scoring
   */
  async scoreMessageQuality(message: ChatMessage, context?: {
    roomStandards?: any;
    userHistory?: any;
    conversationContext?: any;
  }): Promise<{
    overallScore: number;
    factors: { factor: string; score: number; weight: number }[];
    recommendations: string[];
    flagged: boolean;
    reasons: string[];
  }> {
    console.log('⭐ Scoring message quality:', message.id);
    
    try {
      const score = await this.makeRequest<{
        overallScore: number;
        factors: { factor: string; score: number; weight: number }[];
        recommendations: string[];
        flagged: boolean;
        reasons: string[];
      }>('/score/quality', {
        method: 'POST',
        body: JSON.stringify({
          message: {
            id: message.id,
            text: message.message,
            userId: message.userId,
            username: message.username,
            timestamp: message.timestamp
          },
          context: context || {},
          options: {
            includeFactors: true,
            includeRecommendations: true,
            includeFlagging: true,
            includeReasons: true
          }
        })
      });
      
      console.log('✅ Message quality scored:', score.overallScore);
      return score;
      
    } catch (error) {
      console.error('❌ Failed to score message quality:', error);
      throw error;
    }
  }

  /**
   * Clear NLP cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('✅ NLP cache cleared');
  }

  /**
   * Get conversation context
   */
  getConversationContext(conversationId: string): ConversationAnalysis | null {
    return this.conversationContexts.get(conversationId) || null;
  }

  /**
   * Update conversation context
   */
  updateConversationContext(conversationId: string, newMessage: ChatMessage): void {
    const context = this.conversationContexts.get(conversationId);
    if (context) {
      // Update context with new message
      // This would involve re-analyzing the conversation
      console.log('📝 Updating conversation context:', conversationId);
    }
  }

  /**
   * Get service statistics
   */
  getServiceStatistics(): {
    cacheSize: number;
    activeConversations: number;
    totalAnalyses: number;
    averageProcessingTime: number;
  } {
    return {
      cacheSize: this.cache.size,
      activeConversations: this.conversationContexts.size,
      totalAnalyses: this.cache.size,
      averageProcessingTime: 0 // Would calculate from actual data
    };
  }
}

export const nlpChatAnalysisService = new NLPChatAnalysisService();
export default nlpChatAnalysisService;