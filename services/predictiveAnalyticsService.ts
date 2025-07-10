import { UnifiedStream } from './platformService';
import { ViewerAnalytics, StreamAnalytics } from './analyticsService';
import { UserProfile } from './aiRecommendationService';

export interface PredictionModel {
  id: string;
  name: string;
  type: ModelType;
  version: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  rmse?: number;
  mae?: number;
  trainingDate: string;
  lastUpdated: string;
  datasetSize: number;
  features: ModelFeature[];
  hyperparameters: Record<string, any>;
  crossValidationScore: number;
  metadata: {
    algorithm: string;
    framework: string;
    computeRequirements: ComputeRequirements;
    performanceMetrics: PerformanceMetrics;
  };
}

export type ModelType = 
  | 'viewer_behavior' | 'content_performance' | 'trend_forecasting'
  | 'churn_prediction' | 'engagement_prediction' | 'revenue_prediction'
  | 'growth_prediction' | 'sentiment_forecasting' | 'anomaly_detection'
  | 'time_series' | 'classification' | 'regression' | 'clustering'
  | 'reinforcement_learning' | 'deep_learning' | 'ensemble';

export interface ModelFeature {
  name: string;
  type: 'numerical' | 'categorical' | 'text' | 'image' | 'time_series';
  importance: number;
  description: string;
  source: string;
  preprocessing: string[];
}

export interface ComputeRequirements {
  cpu: string;
  memory: string;
  gpu?: string;
  storage: string;
  avgInferenceTime: number;
  maxThroughput: number;
}

export interface PerformanceMetrics {
  latency: number;
  throughput: number;
  memoryUsage: number;
  cpuUsage: number;
  errorRate: number;
  uptime: number;
}

export interface ViewerBehaviorPrediction {
  userId: string;
  predictions: BehaviorPrediction[];
  riskFactors: RiskFactor[];
  opportunities: Opportunity[];
  recommendations: BehaviorRecommendation[];
  confidence: number;
  timeframe: string;
  metadata: {
    modelVersion: string;
    featuresUsed: string[];
    processingTime: number;
    dataQuality: number;
  };
}

export interface BehaviorPrediction {
  behavior: BehaviorType;
  probability: number;
  confidence: number;
  timeframe: string;
  factors: PredictionFactor[];
  scenarios: PredictionScenario[];
  impact: ImpactAssessment;
}

export type BehaviorType = 
  | 'churn' | 'upgrade' | 'engagement_increase' | 'engagement_decrease'
  | 'platform_switch' | 'content_discovery' | 'social_activity'
  | 'subscription_renewal' | 'feature_adoption' | 'community_participation'
  | 'content_creation' | 'sharing_behavior' | 'feedback_provision';

export interface PredictionFactor {
  factor: string;
  weight: number;
  direction: 'positive' | 'negative' | 'neutral';
  confidence: number;
  description: string;
  historical_evidence: string[];
}

export interface PredictionScenario {
  scenario: string;
  probability: number;
  conditions: string[];
  outcomes: string[];
  interventions: string[];
}

export interface ImpactAssessment {
  business_impact: 'low' | 'medium' | 'high' | 'critical';
  user_experience_impact: number;
  revenue_impact: number;
  engagement_impact: number;
  retention_impact: number;
  viral_coefficient: number;
}

export interface RiskFactor {
  risk: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  probability: number;
  impact: string;
  mitigation: string[];
  early_warning_signs: string[];
}

export interface Opportunity {
  opportunity: string;
  potential: 'low' | 'medium' | 'high';
  probability: number;
  value: string;
  actions: string[];
  timing: string;
}

export interface BehaviorRecommendation {
  type: 'intervention' | 'optimization' | 'personalization' | 'engagement';
  recommendation: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  expected_impact: number;
  effort_required: number;
  timeline: string;
  success_metrics: string[];
}

export interface ContentPerformancePrediction {
  contentId: string;
  contentType: string;
  predictions: PerformancePrediction[];
  benchmarks: PerformanceBenchmark[];
  optimization: OptimizationSuggestion[];
  trends: TrendPrediction[];
  metadata: {
    modelVersion: string;
    predictionHorizon: string;
    confidence: number;
    lastUpdated: string;
  };
}

export interface PerformancePrediction {
  metric: PerformanceMetric;
  predicted_value: number;
  confidence_interval: { lower: number; upper: number };
  timeframe: string;
  factors: PredictionFactor[];
  scenarios: PerformanceScenario[];
}

export type PerformanceMetric = 
  | 'views' | 'unique_viewers' | 'watch_time' | 'engagement_rate'
  | 'retention_rate' | 'click_through_rate' | 'share_rate'
  | 'comment_rate' | 'like_rate' | 'subscriber_growth'
  | 'revenue' | 'ad_revenue' | 'donation_amount';

export interface PerformanceScenario {
  scenario: string;
  probability: number;
  predicted_values: { metric: string; value: number }[];
  conditions: string[];
  catalysts: string[];
}

export interface PerformanceBenchmark {
  category: string;
  metric: string;
  benchmark_value: number;
  percentile: number;
  comparison: 'above' | 'at' | 'below';
  context: string;
}

export interface OptimizationSuggestion {
  aspect: string;
  suggestion: string;
  priority: number;
  expected_lift: number;
  effort: number;
  risk: number;
  evidence: string[];
}

export interface TrendPrediction {
  trend: string;
  direction: 'rising' | 'falling' | 'stable' | 'volatile';
  magnitude: number;
  duration: string;
  confidence: number;
  drivers: string[];
  implications: string[];
}

export interface MarketTrendForecast {
  market: string;
  timeframe: string;
  trends: MarketTrend[];
  disruptions: DisruptionPrediction[];
  opportunities: MarketOpportunity[];
  risks: MarketRisk[];
  recommendations: MarketRecommendation[];
  metadata: {
    dataSource: string[];
    modelAccuracy: number;
    lastUpdated: string;
    confidence: number;
  };
}

export interface MarketTrend {
  trend: string;
  category: TrendCategory;
  strength: number;
  velocity: number;
  longevity: string;
  adoption_curve: AdoptionCurve;
  geographic_distribution: GeographicDistribution[];
  demographic_patterns: DemographicPattern[];
  influencers: TrendInfluencer[];
}

export type TrendCategory = 
  | 'technology' | 'content' | 'social' | 'economic' | 'cultural'
  | 'platform' | 'gaming' | 'entertainment' | 'education' | 'commerce';

export interface AdoptionCurve {
  phase: 'introduction' | 'growth' | 'maturity' | 'decline';
  adoption_rate: number;
  saturation_point: number;
  time_to_peak: string;
  market_penetration: number;
}

export interface GeographicDistribution {
  region: string;
  adoption_rate: number;
  growth_rate: number;
  market_size: number;
  cultural_factors: string[];
}

export interface DemographicPattern {
  demographic: string;
  adoption_likelihood: number;
  engagement_level: number;
  influence_factor: number;
  barriers: string[];
}

export interface TrendInfluencer {
  type: 'technology' | 'celebrity' | 'platform' | 'event' | 'content';
  name: string;
  influence_score: number;
  reach: number;
  credibility: number;
}

export interface DisruptionPrediction {
  disruption: string;
  probability: number;
  timeframe: string;
  impact_level: 'low' | 'medium' | 'high' | 'transformative';
  affected_areas: string[];
  indicators: string[];
  preparation_strategies: string[];
}

export interface MarketOpportunity {
  opportunity: string;
  market_size: number;
  growth_potential: number;
  competition_level: number;
  barriers_to_entry: string[];
  success_factors: string[];
  timeline: string;
}

export interface MarketRisk {
  risk: string;
  probability: number;
  impact: string;
  mitigation_strategies: string[];
  early_warning_indicators: string[];
  contingency_plans: string[];
}

export interface MarketRecommendation {
  recommendation: string;
  category: 'strategic' | 'tactical' | 'operational' | 'innovation';
  priority: number;
  investment_required: string;
  expected_return: string;
  timeline: string;
  success_metrics: string[];
}

export interface AnomalyDetection {
  anomalyId: string;
  type: AnomalyType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  detection_time: string;
  affected_entities: string[];
  patterns: AnomalyPattern[];
  root_causes: RootCause[];
  impact_assessment: AnomalyImpact;
  response_recommendations: ResponseRecommendation[];
  false_positive_probability: number;
}

export type AnomalyType = 
  | 'statistical' | 'behavioral' | 'seasonal' | 'contextual'
  | 'collective' | 'point' | 'trend' | 'pattern';

export interface AnomalyPattern {
  pattern: string;
  deviation: number;
  baseline: number;
  statistical_significance: number;
  temporal_context: string;
  spatial_context?: string;
}

export interface RootCause {
  cause: string;
  probability: number;
  evidence: string[];
  correlation: number;
  temporal_relationship: string;
}

export interface AnomalyImpact {
  business_impact: number;
  user_impact: number;
  system_impact: number;
  financial_impact: number;
  reputational_impact: number;
  cascading_effects: CascadingEffect[];
}

export interface CascadingEffect {
  effect: string;
  probability: number;
  delay: string;
  magnitude: number;
  affected_systems: string[];
}

export interface ResponseRecommendation {
  action: string;
  urgency: 'immediate' | 'urgent' | 'moderate' | 'low';
  effectiveness: number;
  cost: number;
  risk: number;
  resources_required: string[];
}

export interface TimeSeriesForecast {
  seriesId: string;
  metric: string;
  forecasts: ForecastPoint[];
  seasonality: SeasonalityAnalysis;
  trends: TrendAnalysis[];
  changepoints: Changepoint[];
  uncertainty: UncertaintyAnalysis;
  model_diagnostics: ModelDiagnostics;
  metadata: {
    horizon: string;
    frequency: string;
    model_type: string;
    last_updated: string;
  };
}

export interface ForecastPoint {
  timestamp: string;
  predicted_value: number;
  lower_bound: number;
  upper_bound: number;
  confidence: number;
  components: ForecastComponent[];
}

export interface ForecastComponent {
  component: 'trend' | 'seasonal' | 'holiday' | 'external' | 'residual';
  contribution: number;
  confidence: number;
}

export interface SeasonalityAnalysis {
  has_seasonality: boolean;
  seasonal_periods: SeasonalPeriod[];
  strength: number;
  stability: number;
  pattern_changes: PatternChange[];
}

export interface SeasonalPeriod {
  period: string;
  frequency: number;
  amplitude: number;
  phase: number;
  stability: number;
}

export interface TrendAnalysis {
  trend_type: 'linear' | 'exponential' | 'logarithmic' | 'polynomial' | 'step';
  direction: 'increasing' | 'decreasing' | 'stable';
  strength: number;
  acceleration: number;
  inflection_points: InflectionPoint[];
}

export interface InflectionPoint {
  timestamp: string;
  type: 'acceleration' | 'deceleration' | 'reversal';
  magnitude: number;
  confidence: number;
  causes: string[];
}

export interface Changepoint {
  timestamp: string;
  magnitude: number;
  direction: 'increase' | 'decrease';
  type: 'level' | 'trend' | 'seasonal';
  confidence: number;
  causes: string[];
}

export interface PatternChange {
  timestamp: string;
  old_pattern: string;
  new_pattern: string;
  transition_period: string;
  causes: string[];
}

export interface UncertaintyAnalysis {
  overall_uncertainty: number;
  sources: UncertaintySource[];
  confidence_intervals: ConfidenceInterval[];
  sensitivity_analysis: SensitivityAnalysis[];
}

export interface UncertaintySource {
  source: string;
  contribution: number;
  type: 'aleatory' | 'epistemic';
  mitigation: string[];
}

export interface ConfidenceInterval {
  level: number;
  lower_bound: number;
  upper_bound: number;
  coverage: number;
}

export interface SensitivityAnalysis {
  parameter: string;
  sensitivity: number;
  impact_range: { min: number; max: number };
  critical_threshold: number;
}

export interface ModelDiagnostics {
  residual_analysis: ResidualAnalysis;
  goodness_of_fit: GoodnessOfFit;
  model_stability: ModelStability;
  feature_importance: FeatureImportance[];
  performance_metrics: ModelPerformanceMetrics;
}

export interface ResidualAnalysis {
  mean: number;
  std_deviation: number;
  autocorrelation: number;
  heteroscedasticity: number;
  normality_test: number;
  outliers: OutlierInfo[];
}

export interface OutlierInfo {
  timestamp: string;
  value: number;
  z_score: number;
  influence: number;
  explanation: string;
}

export interface GoodnessOfFit {
  r_squared: number;
  adjusted_r_squared: number;
  aic: number;
  bic: number;
  log_likelihood: number;
  cross_validation_score: number;
}

export interface ModelStability {
  stability_score: number;
  consistency: number;
  robustness: number;
  drift_detection: DriftDetection;
  retraining_recommendation: RetrainingRecommendation;
}

export interface DriftDetection {
  has_drift: boolean;
  drift_type: 'concept' | 'data' | 'virtual';
  severity: number;
  first_detected: string;
  affected_features: string[];
}

export interface RetrainingRecommendation {
  should_retrain: boolean;
  urgency: 'immediate' | 'soon' | 'scheduled' | 'none';
  reasons: string[];
  expected_improvement: number;
  cost_benefit: number;
}

export interface FeatureImportance {
  feature: string;
  importance: number;
  stability: number;
  interpretation: string;
  correlation_with_target: number;
}

export interface ModelPerformanceMetrics {
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1_score?: number;
  auc_roc?: number;
  mae?: number;
  rmse?: number;
  mape?: number;
  directional_accuracy?: number;
}

class PredictiveAnalyticsService {
  private readonly baseUrl = process.env.EXPO_PUBLIC_AI_API_URL || 'https://api.streammulti.com/predict';
  private readonly apiKey = process.env.EXPO_PUBLIC_AI_API_KEY || '';
  private readonly cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly cacheTimeout = 10 * 60 * 1000; // 10 minutes for predictions
  private models: Map<string, PredictionModel> = new Map();
  private forecastCache: Map<string, TimeSeriesForecast> = new Map();

  constructor() {
    console.log('Predictive Analytics Service initialized');
    this.initializeModels();
    this.startModelMonitoring();
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
      throw new Error(`Predictive Analytics API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    this.cache.set(cacheKey, { data, timestamp: Date.now() });
    
    return data;
  }

  /**
   * Predict viewer behavior patterns
   */
  async predictViewerBehavior(
    userId: string, 
    timeframe: string,
    options?: {
      includeRisks?: boolean;
      includeOpportunities?: boolean;
      includeRecommendations?: boolean;
      modelVersion?: string;
    }
  ): Promise<ViewerBehaviorPrediction> {
    console.log('🔮 Predicting viewer behavior:', userId, 'for', timeframe);
    
    try {
      const startTime = Date.now();
      
      const prediction = await this.makeRequest<ViewerBehaviorPrediction>('/behavior/predict', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          timeframe,
          options: {
            includeRisks: options?.includeRisks ?? true,
            includeOpportunities: options?.includeOpportunities ?? true,
            includeRecommendations: options?.includeRecommendations ?? true,
            modelVersion: options?.modelVersion ?? 'latest',
            confidenceThreshold: 0.7
          }
        })
      });

      prediction.metadata.processingTime = Date.now() - startTime;
      
      console.log('✅ Viewer behavior prediction completed:', prediction.predictions.length, 'predictions');
      return prediction;
      
    } catch (error) {
      console.error('❌ Failed to predict viewer behavior:', error);
      throw error;
    }
  }

  /**
   * Predict content performance
   */
  async predictContentPerformance(
    contentId: string,
    contentMetadata: {
      title: string;
      category: string;
      tags: string[];
      duration?: number;
      thumbnail?: string;
      description?: string;
    },
    timeframe: string
  ): Promise<ContentPerformancePrediction> {
    console.log('📈 Predicting content performance:', contentId);
    
    try {
      const prediction = await this.makeRequest<ContentPerformancePrediction>('/content/predict', {
        method: 'POST',
        body: JSON.stringify({
          contentId,
          contentMetadata,
          timeframe,
          options: {
            includeBenchmarks: true,
            includeOptimization: true,
            includeTrends: true,
            includeScenarios: true,
            predictionHorizon: timeframe
          }
        })
      });
      
      console.log('✅ Content performance prediction completed');
      return prediction;
      
    } catch (error) {
      console.error('❌ Failed to predict content performance:', error);
      throw error;
    }
  }

  /**
   * Forecast market trends
   */
  async forecastMarketTrends(
    market: string,
    timeframe: string,
    options?: {
      includeDisruptions?: boolean;
      includeOpportunities?: boolean;
      includeRisks?: boolean;
      granularity?: 'daily' | 'weekly' | 'monthly';
    }
  ): Promise<MarketTrendForecast> {
    console.log('🌐 Forecasting market trends:', market, 'for', timeframe);
    
    try {
      const forecast = await this.makeRequest<MarketTrendForecast>('/market/forecast', {
        method: 'POST',
        body: JSON.stringify({
          market,
          timeframe,
          options: {
            includeDisruptions: options?.includeDisruptions ?? true,
            includeOpportunities: options?.includeOpportunities ?? true,
            includeRisks: options?.includeRisks ?? true,
            granularity: options?.granularity ?? 'weekly',
            confidenceLevel: 0.8,
            includeGeographic: true,
            includeDemographic: true
          }
        })
      });
      
      console.log('✅ Market trend forecast completed:', forecast.trends.length, 'trends');
      return forecast;
      
    } catch (error) {
      console.error('❌ Failed to forecast market trends:', error);
      throw error;
    }
  }

  /**
   * Detect anomalies in real-time data
   */
  async detectAnomalies(
    dataSource: string,
    data: { timestamp: string; value: number; metadata?: any }[],
    options?: {
      sensitivity?: 'low' | 'medium' | 'high';
      anomalyTypes?: AnomalyType[];
      includeRootCause?: boolean;
    }
  ): Promise<AnomalyDetection[]> {
    console.log('🚨 Detecting anomalies in:', dataSource, 'with', data.length, 'data points');
    
    try {
      const anomalies = await this.makeRequest<AnomalyDetection[]>('/anomaly/detect', {
        method: 'POST',
        body: JSON.stringify({
          dataSource,
          data,
          options: {
            sensitivity: options?.sensitivity ?? 'medium',
            anomalyTypes: options?.anomalyTypes ?? ['statistical', 'behavioral', 'trend'],
            includeRootCause: options?.includeRootCause ?? true,
            confidenceThreshold: 0.8,
            includeImpactAssessment: true,
            includeRecommendations: true
          }
        })
      });
      
      console.log('✅ Anomaly detection completed:', anomalies.length, 'anomalies found');
      return anomalies;
      
    } catch (error) {
      console.error('❌ Failed to detect anomalies:', error);
      throw error;
    }
  }

  /**
   * Generate time series forecast
   */
  async generateForecast(
    seriesId: string,
    metric: string,
    historicalData: { timestamp: string; value: number }[],
    horizon: string,
    options?: {
      includeSeasonality?: boolean;
      includeExternalFactors?: boolean;
      confidenceLevel?: number;
    }
  ): Promise<TimeSeriesForecast> {
    console.log('📊 Generating time series forecast:', seriesId, 'for', horizon);
    
    try {
      const forecast = await this.makeRequest<TimeSeriesForecast>('/timeseries/forecast', {
        method: 'POST',
        body: JSON.stringify({
          seriesId,
          metric,
          historicalData,
          horizon,
          options: {
            includeSeasonality: options?.includeSeasonality ?? true,
            includeExternalFactors: options?.includeExternalFactors ?? true,
            confidenceLevel: options?.confidenceLevel ?? 0.95,
            includeTrends: true,
            includeChangepoints: true,
            includeUncertainty: true,
            includeDiagnostics: true
          }
        })
      });
      
      this.forecastCache.set(seriesId, forecast);
      
      console.log('✅ Time series forecast generated:', forecast.forecasts.length, 'forecast points');
      return forecast;
      
    } catch (error) {
      console.error('❌ Failed to generate forecast:', error);
      throw error;
    }
  }

  /**
   * Predict churn risk for users
   */
  async predictChurnRisk(
    userIds: string[],
    timeframe: string
  ): Promise<{ userId: string; churnRisk: number; factors: PredictionFactor[]; recommendations: string[] }[]> {
    console.log('🚪 Predicting churn risk for', userIds.length, 'users');
    
    try {
      const predictions = await this.makeRequest<{ userId: string; churnRisk: number; factors: PredictionFactor[]; recommendations: string[] }[]>('/churn/predict', {
        method: 'POST',
        body: JSON.stringify({
          userIds,
          timeframe,
          options: {
            includeFactors: true,
            includeRecommendations: true,
            includeInterventions: true,
            riskThreshold: 0.3
          }
        })
      });
      
      console.log('✅ Churn risk prediction completed');
      return predictions;
      
    } catch (error) {
      console.error('❌ Failed to predict churn risk:', error);
      throw error;
    }
  }

  /**
   * Predict engagement levels
   */
  async predictEngagement(
    streamId: string,
    timeframe: string,
    context?: {
      streamerHistory?: any;
      contentType?: string;
      scheduledTime?: string;
      promotionalEfforts?: string[];
    }
  ): Promise<{
    predictedEngagement: number;
    engagementBreakdown: { metric: string; predicted_value: number; confidence: number }[];
    factors: PredictionFactor[];
    scenarios: PredictionScenario[];
    recommendations: string[];
  }> {
    console.log('💫 Predicting engagement for stream:', streamId);
    
    try {
      const prediction = await this.makeRequest<{
        predictedEngagement: number;
        engagementBreakdown: { metric: string; predicted_value: number; confidence: number }[];
        factors: PredictionFactor[];
        scenarios: PredictionScenario[];
        recommendations: string[];
      }>('/engagement/predict', {
        method: 'POST',
        body: JSON.stringify({
          streamId,
          timeframe,
          context: context || {},
          options: {
            includeBreakdown: true,
            includeFactors: true,
            includeScenarios: true,
            includeRecommendations: true,
            metrics: ['viewers', 'chat_rate', 'reactions', 'shares', 'retention']
          }
        })
      });
      
      console.log('✅ Engagement prediction completed:', prediction.predictedEngagement);
      return prediction;
      
    } catch (error) {
      console.error('❌ Failed to predict engagement:', error);
      throw error;
    }
  }

  /**
   * Predict revenue and monetization
   */
  async predictRevenue(
    streamerId: string,
    timeframe: string,
    options?: {
      includeBreakdown?: boolean;
      includeScenarios?: boolean;
      revenueStreams?: string[];
    }
  ): Promise<{
    totalRevenue: number;
    revenueBreakdown: { stream: string; amount: number; confidence: number }[];
    growthPrediction: number;
    factors: PredictionFactor[];
    scenarios: PredictionScenario[];
    optimization: OptimizationSuggestion[];
  }> {
    console.log('💰 Predicting revenue for streamer:', streamerId);
    
    try {
      const prediction = await this.makeRequest<{
        totalRevenue: number;
        revenueBreakdown: { stream: string; amount: number; confidence: number }[];
        growthPrediction: number;
        factors: PredictionFactor[];
        scenarios: PredictionScenario[];
        optimization: OptimizationSuggestion[];
      }>('/revenue/predict', {
        method: 'POST',
        body: JSON.stringify({
          streamerId,
          timeframe,
          options: {
            includeBreakdown: options?.includeBreakdown ?? true,
            includeScenarios: options?.includeScenarios ?? true,
            revenueStreams: options?.revenueStreams ?? ['ads', 'subscriptions', 'donations', 'merchandise'],
            includeOptimization: true,
            includeGrowthPrediction: true
          }
        })
      });
      
      console.log('✅ Revenue prediction completed:', prediction.totalRevenue);
      return prediction;
      
    } catch (error) {
      console.error('❌ Failed to predict revenue:', error);
      throw error;
    }
  }

  /**
   * Predict optimal content timing
   */
  async predictOptimalTiming(
    streamerId: string,
    contentType: string,
    options?: {
      targetAudience?: string;
      timeZones?: string[];
      contentDuration?: number;
    }
  ): Promise<{
    optimalTimes: { timestamp: string; score: number; reasons: string[] }[];
    audienceAnalysis: { timezone: string; peak_hours: number[]; engagement_score: number }[];
    competitorAnalysis: { competitor: string; schedule: string[]; overlap_risk: number }[];
    recommendations: string[];
  }> {
    console.log('⏰ Predicting optimal timing for:', streamerId, contentType);
    
    try {
      const prediction = await this.makeRequest<{
        optimalTimes: { timestamp: string; score: number; reasons: string[] }[];
        audienceAnalysis: { timezone: string; peak_hours: number[]; engagement_score: number }[];
        competitorAnalysis: { competitor: string; schedule: string[]; overlap_risk: number }[];
        recommendations: string[];
      }>('/timing/optimal', {
        method: 'POST',
        body: JSON.stringify({
          streamerId,
          contentType,
          options: {
            targetAudience: options?.targetAudience ?? 'global',
            timeZones: options?.timeZones ?? ['UTC', 'EST', 'PST', 'CET'],
            contentDuration: options?.contentDuration ?? 120,
            includeAudienceAnalysis: true,
            includeCompetitorAnalysis: true,
            includeRecommendations: true,
            lookAheadDays: 7
          }
        })
      });
      
      console.log('✅ Optimal timing prediction completed');
      return prediction;
      
    } catch (error) {
      console.error('❌ Failed to predict optimal timing:', error);
      throw error;
    }
  }

  /**
   * Predict growth trajectories
   */
  async predictGrowth(
    entityId: string,
    entityType: 'streamer' | 'channel' | 'platform' | 'category',
    timeframe: string,
    options?: {
      includeFactors?: boolean;
      includeScenarios?: boolean;
      growthMetrics?: string[];
    }
  ): Promise<{
    growthPredictions: { metric: string; current: number; predicted: number; growth_rate: number }[];
    milestones: { milestone: string; estimated_date: string; probability: number }[];
    factors: PredictionFactor[];
    scenarios: PredictionScenario[];
    strategies: GrowthStrategy[];
  }> {
    console.log('📈 Predicting growth for:', entityType, entityId);
    
    try {
      const prediction = await this.makeRequest<{
        growthPredictions: { metric: string; current: number; predicted: number; growth_rate: number }[];
        milestones: { milestone: string; estimated_date: string; probability: number }[];
        factors: PredictionFactor[];
        scenarios: PredictionScenario[];
        strategies: GrowthStrategy[];
      }>('/growth/predict', {
        method: 'POST',
        body: JSON.stringify({
          entityId,
          entityType,
          timeframe,
          options: {
            includeFactors: options?.includeFactors ?? true,
            includeScenarios: options?.includeScenarios ?? true,
            growthMetrics: options?.growthMetrics ?? ['followers', 'viewers', 'engagement', 'revenue'],
            includeMilestones: true,
            includeStrategies: true,
            confidenceLevel: 0.8
          }
        })
      });
      
      console.log('✅ Growth prediction completed');
      return prediction;
      
    } catch (error) {
      console.error('❌ Failed to predict growth:', error);
      throw error;
    }
  }

  /**
   * Run what-if scenario analysis
   */
  async runScenarioAnalysis(
    baselineData: any,
    scenarios: {
      name: string;
      changes: { parameter: string; value: any }[];
      probability?: number;
    }[],
    metrics: string[]
  ): Promise<{
    baseline: { metric: string; value: number }[];
    scenarios: {
      name: string;
      results: { metric: string; value: number; change: number }[];
      probability: number;
      risk_assessment: string;
    }[];
    recommendations: string[];
  }> {
    console.log('🎬 Running scenario analysis with', scenarios.length, 'scenarios');
    
    try {
      const analysis = await this.makeRequest<{
        baseline: { metric: string; value: number }[];
        scenarios: {
          name: string;
          results: { metric: string; value: number; change: number }[];
          probability: number;
          risk_assessment: string;
        }[];
        recommendations: string[];
      }>('/scenario/analyze', {
        method: 'POST',
        body: JSON.stringify({
          baselineData,
          scenarios,
          metrics,
          options: {
            includeRiskAssessment: true,
            includeRecommendations: true,
            confidenceLevel: 0.9,
            sensitivityAnalysis: true
          }
        })
      });
      
      console.log('✅ Scenario analysis completed');
      return analysis;
      
    } catch (error) {
      console.error('❌ Failed to run scenario analysis:', error);
      throw error;
    }
  }

  /**
   * Get model performance metrics
   */
  async getModelPerformance(modelId: string): Promise<{
    model: PredictionModel;
    recentPredictions: number;
    accuracy: number;
    drift: DriftDetection;
    recommendations: RetrainingRecommendation;
  }> {
    console.log('📊 Getting model performance:', modelId);
    
    try {
      const performance = await this.makeRequest<{
        model: PredictionModel;
        recentPredictions: number;
        accuracy: number;
        drift: DriftDetection;
        recommendations: RetrainingRecommendation;
      }>(`/models/${modelId}/performance`);
      
      console.log('✅ Model performance retrieved');
      return performance;
      
    } catch (error) {
      console.error('❌ Failed to get model performance:', error);
      throw error;
    }
  }

  /**
   * Initialize prediction models
   */
  private async initializeModels(): Promise<void> {
    try {
      const models = await this.makeRequest<PredictionModel[]>('/models');
      models.forEach(model => {
        this.models.set(model.id, model);
      });
      console.log('✅ Prediction models initialized:', models.length);
    } catch (error) {
      console.error('Failed to initialize prediction models:', error);
    }
  }

  /**
   * Start model monitoring
   */
  private startModelMonitoring(): void {
    console.log('🔄 Starting model monitoring');
    
    // Monitor model performance every hour
    setInterval(async () => {
      for (const [modelId, model] of this.models) {
        try {
          const performance = await this.getModelPerformance(modelId);
          
          if (performance.drift.has_drift) {
            console.log('⚠️ Model drift detected:', modelId);
          }
          
          if (performance.recommendations.should_retrain) {
            console.log('🔄 Model retraining recommended:', modelId);
          }
        } catch (error) {
          console.error('Failed to monitor model:', modelId, error);
        }
      }
    }, 60 * 60 * 1000); // Every hour
  }

  /**
   * Get available prediction models
   */
  getAvailableModels(): PredictionModel[] {
    return Array.from(this.models.values());
  }

  /**
   * Get cached forecast
   */
  getCachedForecast(seriesId: string): TimeSeriesForecast | null {
    return this.forecastCache.get(seriesId) || null;
  }

  /**
   * Clear prediction cache
   */
  clearCache(): void {
    this.cache.clear();
    this.forecastCache.clear();
    console.log('✅ Predictive analytics cache cleared');
  }

  /**
   * Get service statistics
   */
  getServiceStatistics(): {
    totalModels: number;
    activeForecasts: number;
    cacheSize: number;
    averageAccuracy: number;
    predictionsMade: number;
  } {
    const totalAccuracy = Array.from(this.models.values())
      .reduce((sum, model) => sum + model.accuracy, 0);
    
    return {
      totalModels: this.models.size,
      activeForecasts: this.forecastCache.size,
      cacheSize: this.cache.size,
      averageAccuracy: this.models.size > 0 ? totalAccuracy / this.models.size : 0,
      predictionsMade: this.cache.size
    };
  }
}

export interface GrowthStrategy {
  strategy: string;
  category: 'content' | 'marketing' | 'community' | 'monetization' | 'technical';
  priority: number;
  effort: number;
  impact: number;
  timeline: string;
  requirements: string[];
  success_metrics: string[];
}

export const predictiveAnalyticsService = new PredictiveAnalyticsService();
export default predictiveAnalyticsService;