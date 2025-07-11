import { analyticsService } from './analyticsService';

export interface EnterpriseAnalyticsConfig {
  organizationId: string;
  dataRetentionDays: number;
  reportingFrequency: 'daily' | 'weekly' | 'monthly';
  customDashboards: string[];
  allowedMetrics: string[];
  privacySettings: {
    anonymizeUsers: boolean;
    excludePII: boolean;
    geoMasking: boolean;
    aggregationOnly: boolean;
  };
  complianceSettings: {
    gdprCompliant: boolean;
    hipaaCompliant: boolean;
    soxCompliant: boolean;
    auditTrail: boolean;
  };
}

export interface BusinessIntelligenceReport {
  id: string;
  name: string;
  type: 'revenue' | 'engagement' | 'growth' | 'retention' | 'performance' | 'competitive' | 'custom';
  organizationId: string;
  timeRange: {
    start: string;
    end: string;
    granularity: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
  };
  filters: {
    platforms?: string[];
    categories?: string[];
    regions?: string[];
    userSegments?: string[];
    customFilters?: Record<string, any>;
  };
  metrics: EnterpriseMetric[];
  insights: BusinessInsight[];
  recommendations: BusinessRecommendation[];
  visualizations: DataVisualization[];
  exportUrls: {
    pdf: string;
    excel: string;
    json: string;
    csv: string;
  };
  createdAt: string;
  updatedAt: string;
  generatedBy: string;
  accessLevel: 'public' | 'internal' | 'confidential' | 'restricted';
}

export interface EnterpriseMetric {
  id: string;
  name: string;
  displayName: string;
  description: string;
  value: number;
  unit: string;
  change: number;
  changeType: 'percentage' | 'absolute';
  trend: 'up' | 'down' | 'stable';
  benchmark?: number;
  target?: number;
  category: string;
  importance: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  dataSource: string;
  confidence: number;
  methodology: string;
}

export interface BusinessInsight {
  id: string;
  type: 'opportunity' | 'risk' | 'trend' | 'anomaly' | 'correlation' | 'forecast';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  evidence: {
    metrics: string[];
    correlations: { x: string; y: string; coefficient: number }[];
    dataPoints: { timestamp: string; value: number }[];
  };
  timeframe: string;
  affectedSegments: string[];
  relatedInsights: string[];
  actionable: boolean;
  category: string;
  tags: string[];
  createdAt: string;
}

export interface BusinessRecommendation {
  id: string;
  title: string;
  description: string;
  category: 'growth' | 'optimization' | 'retention' | 'monetization' | 'efficiency' | 'compliance';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  timeline: string;
  roi: {
    investment: number;
    expectedReturn: number;
    paybackPeriod: string;
    riskLevel: 'low' | 'medium' | 'high';
  };
  implementation: {
    steps: string[];
    resources: string[];
    skills: string[];
    tools: string[];
  };
  kpis: {
    metric: string;
    currentValue: number;
    targetValue: number;
    timeframe: string;
  }[];
  basedOn: string[];
  createdAt: string;
  status: 'pending' | 'approved' | 'in_progress' | 'completed' | 'rejected';
}

export interface DataVisualization {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'scatter' | 'heatmap' | 'funnel' | 'gauge' | 'table' | 'map' | 'treemap';
  title: string;
  description: string;
  data: any[];
  config: {
    xAxis?: string;
    yAxis?: string;
    groupBy?: string;
    colorBy?: string;
    size?: 'small' | 'medium' | 'large';
    theme?: 'light' | 'dark' | 'auto';
    interactive?: boolean;
    animations?: boolean;
    annotations?: { x: any; y: any; text: string }[];
  };
  filters: Record<string, any>;
  refreshRate: number;
  isRealTime: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomDashboard {
  id: string;
  name: string;
  description: string;
  organizationId: string;
  createdBy: string;
  isPublic: boolean;
  layout: {
    columns: number;
    rows: number;
    widgets: DashboardWidget[];
  };
  refreshRate: number;
  filters: {
    global: Record<string, any>;
    widget: Record<string, any>;
  };
  permissions: {
    viewers: string[];
    editors: string[];
    admins: string[];
  };
  tags: string[];
  createdAt: string;
  updatedAt: string;
  lastViewedAt: string;
  viewCount: number;
}

export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'text' | 'image' | 'map' | 'iframe';
  title: string;
  position: { x: number; y: number; width: number; height: number };
  dataSource: string;
  query: string;
  visualization: DataVisualization;
  refreshRate: number;
  isRealTime: boolean;
  alerts: WidgetAlert[];
  config: Record<string, any>;
  permissions: {
    visible: boolean;
    interactive: boolean;
    exportable: boolean;
  };
}

export interface WidgetAlert {
  id: string;
  condition: string;
  threshold: number;
  comparison: 'greater' | 'less' | 'equal' | 'not_equal';
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  actions: {
    email?: string[];
    webhook?: string;
    sms?: string[];
    slack?: string;
  };
  isActive: boolean;
  lastTriggered?: string;
}

export interface DataExportJob {
  id: string;
  type: 'report' | 'dashboard' | 'raw_data' | 'analytics';
  format: 'pdf' | 'excel' | 'csv' | 'json' | 'xml';
  parameters: {
    startDate: string;
    endDate: string;
    filters: Record<string, any>;
    metrics: string[];
    groupBy?: string[];
    includeCharts?: boolean;
    includeRawData?: boolean;
  };
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  downloadUrl?: string;
  expiresAt?: string;
  createdBy: string;
  createdAt: string;
  completedAt?: string;
  error?: string;
  size?: number;
}

export interface AuditDataEvent {
  id: string;
  userId: string;
  action: 'view' | 'export' | 'modify' | 'delete' | 'create';
  resource: string;
  resourceId: string;
  details: {
    metrics?: string[];
    timeRange?: string;
    filters?: Record<string, any>;
    exportFormat?: string;
    changes?: Record<string, any>;
  };
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  sessionId: string;
  organizationId: string;
  complianceNote?: string;
}

export interface ComplianceReport {
  id: string;
  type: 'gdpr' | 'ccpa' | 'hipaa' | 'sox' | 'pci' | 'custom';
  organizationId: string;
  period: {
    start: string;
    end: string;
  };
  status: 'compliant' | 'non_compliant' | 'partially_compliant' | 'under_review';
  requirements: {
    id: string;
    name: string;
    description: string;
    status: 'met' | 'not_met' | 'partially_met' | 'not_applicable';
    evidence: string[];
    notes: string;
  }[];
  recommendations: {
    requirement: string;
    action: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    timeline: string;
  }[];
  generatedAt: string;
  generatedBy: string;
  approvedBy?: string;
  approvedAt?: string;
  nextReviewDate: string;
}

class EnterpriseAnalyticsService {
  private readonly baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.streammulti.com';
  private readonly cache = new Map<string, { data: any; timestamp: number }>();
  private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor() {
    console.log('Enterprise Analytics Service initialized');
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
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Enterprise Analytics API request failed: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Enterprise Analytics API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    this.cache.set(cacheKey, { data, timestamp: Date.now() });
    
    return data;
  }

  // Business Intelligence Reports
  async generateBusinessIntelligenceReport(params: {
    organizationId: string;
    type: 'revenue' | 'engagement' | 'growth' | 'retention' | 'performance' | 'competitive' | 'custom';
    timeRange: { start: string; end: string; granularity: string };
    filters?: Record<string, any>;
    metrics?: string[];
    includeInsights?: boolean;
    includeRecommendations?: boolean;
  }): Promise<BusinessIntelligenceReport> {
    console.log('🔄 Generating business intelligence report:', params.type);
    
    try {
      const report = await this.makeRequest<BusinessIntelligenceReport>('/enterprise/analytics/reports/generate', {
        method: 'POST',
        body: JSON.stringify(params),
      });

      console.log('✅ Business intelligence report generated:', report.id);
      return report;
    } catch (error) {
      console.error('❌ Failed to generate business intelligence report:', error);
      throw error;
    }
  }

  async getBusinessIntelligenceReport(reportId: string): Promise<BusinessIntelligenceReport> {
    console.log('🔄 Fetching business intelligence report:', reportId);
    
    try {
      const report = await this.makeRequest<BusinessIntelligenceReport>(`/enterprise/analytics/reports/${reportId}`);
      console.log('✅ Business intelligence report fetched');
      return report;
    } catch (error) {
      console.error('❌ Failed to fetch business intelligence report:', error);
      throw error;
    }
  }

  async getBusinessIntelligenceReports(organizationId: string, filters?: {
    type?: string;
    createdBy?: string;
    startDate?: string;
    endDate?: string;
    accessLevel?: string;
  }): Promise<BusinessIntelligenceReport[]> {
    console.log('🔄 Fetching business intelligence reports');
    
    try {
      const params = new URLSearchParams({ organizationId });
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });
      }

      const reports = await this.makeRequest<BusinessIntelligenceReport[]>(`/enterprise/analytics/reports?${params.toString()}`);
      console.log('✅ Business intelligence reports fetched:', reports.length);
      return reports;
    } catch (error) {
      console.error('❌ Failed to fetch business intelligence reports:', error);
      throw error;
    }
  }

  // Custom Dashboards
  async createCustomDashboard(dashboardData: Omit<CustomDashboard, 'id' | 'createdAt' | 'updatedAt' | 'lastViewedAt' | 'viewCount'>): Promise<CustomDashboard> {
    console.log('🔄 Creating custom dashboard:', dashboardData.name);
    
    try {
      const dashboard = await this.makeRequest<CustomDashboard>('/enterprise/analytics/dashboards', {
        method: 'POST',
        body: JSON.stringify(dashboardData),
      });

      console.log('✅ Custom dashboard created:', dashboard.name);
      return dashboard;
    } catch (error) {
      console.error('❌ Failed to create custom dashboard:', error);
      throw error;
    }
  }

  async getCustomDashboard(dashboardId: string): Promise<CustomDashboard> {
    console.log('🔄 Fetching custom dashboard:', dashboardId);
    
    try {
      const dashboard = await this.makeRequest<CustomDashboard>(`/enterprise/analytics/dashboards/${dashboardId}`);
      console.log('✅ Custom dashboard fetched');
      return dashboard;
    } catch (error) {
      console.error('❌ Failed to fetch custom dashboard:', error);
      throw error;
    }
  }

  async getCustomDashboards(organizationId: string): Promise<CustomDashboard[]> {
    console.log('🔄 Fetching custom dashboards');
    
    try {
      const dashboards = await this.makeRequest<CustomDashboard[]>(`/enterprise/analytics/dashboards?organizationId=${organizationId}`);
      console.log('✅ Custom dashboards fetched:', dashboards.length);
      return dashboards;
    } catch (error) {
      console.error('❌ Failed to fetch custom dashboards:', error);
      throw error;
    }
  }

  async updateCustomDashboard(dashboardId: string, updates: Partial<CustomDashboard>): Promise<CustomDashboard> {
    console.log('🔄 Updating custom dashboard:', dashboardId);
    
    try {
      const dashboard = await this.makeRequest<CustomDashboard>(`/enterprise/analytics/dashboards/${dashboardId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });

      console.log('✅ Custom dashboard updated');
      return dashboard;
    } catch (error) {
      console.error('❌ Failed to update custom dashboard:', error);
      throw error;
    }
  }

  // Enterprise Metrics
  async getEnterpriseMetrics(organizationId: string, params: {
    metrics: string[];
    timeRange: { start: string; end: string };
    granularity: 'hour' | 'day' | 'week' | 'month';
    filters?: Record<string, any>;
    groupBy?: string[];
    includeComparisons?: boolean;
  }): Promise<{
    metrics: EnterpriseMetric[];
    comparisons?: { period: string; metrics: EnterpriseMetric[] }[];
    aggregations?: { groupBy: string; metrics: EnterpriseMetric[] }[];
  }> {
    console.log('🔄 Fetching enterprise metrics:', params.metrics.join(', '));
    
    try {
      const result = await this.makeRequest<any>('/enterprise/analytics/metrics', {
        method: 'POST',
        body: JSON.stringify({ organizationId, ...params }),
      });

      console.log('✅ Enterprise metrics fetched');
      return result;
    } catch (error) {
      console.error('❌ Failed to fetch enterprise metrics:', error);
      throw error;
    }
  }

  async getMetricDefinitions(organizationId: string): Promise<{
    id: string;
    name: string;
    displayName: string;
    description: string;
    category: string;
    unit: string;
    type: 'count' | 'sum' | 'average' | 'percentage' | 'ratio';
    aggregation: 'sum' | 'avg' | 'min' | 'max' | 'count' | 'distinct';
    isCustom: boolean;
    formula?: string;
    dependencies?: string[];
  }[]> {
    console.log('🔄 Fetching metric definitions');
    
    try {
      const definitions = await this.makeRequest<any>(`/enterprise/analytics/metrics/definitions?organizationId=${organizationId}`);
      console.log('✅ Metric definitions fetched:', definitions.length);
      return definitions;
    } catch (error) {
      console.error('❌ Failed to fetch metric definitions:', error);
      throw error;
    }
  }

  // Advanced Analytics
  async performCohortAnalysis(organizationId: string, params: {
    cohortType: 'acquisition' | 'behavioral' | 'revenue';
    timeRange: { start: string; end: string };
    cohortSize: 'day' | 'week' | 'month';
    metric: string;
    filters?: Record<string, any>;
  }): Promise<{
    cohorts: {
      cohortId: string;
      cohortDate: string;
      cohortSize: number;
      periods: { period: number; value: number; retention: number }[];
    }[];
    summary: {
      averageRetention: number[];
      cohortSizes: number[];
      totalValue: number;
    };
  }> {
    console.log('🔄 Performing cohort analysis:', params.cohortType);
    
    try {
      const result = await this.makeRequest<any>('/enterprise/analytics/cohort', {
        method: 'POST',
        body: JSON.stringify({ organizationId, ...params }),
      });

      console.log('✅ Cohort analysis completed');
      return result;
    } catch (error) {
      console.error('❌ Failed to perform cohort analysis:', error);
      throw error;
    }
  }

  async performFunnelAnalysis(organizationId: string, params: {
    steps: { name: string; event: string; filters?: Record<string, any> }[];
    timeRange: { start: string; end: string };
    conversionWindow: number;
    groupBy?: string;
  }): Promise<{
    funnel: {
      step: string;
      users: number;
      conversions: number;
      conversionRate: number;
      dropoffRate: number;
    }[];
    segments?: Record<string, any>;
  }> {
    console.log('🔄 Performing funnel analysis');
    
    try {
      const result = await this.makeRequest<any>('/enterprise/analytics/funnel', {
        method: 'POST',
        body: JSON.stringify({ organizationId, ...params }),
      });

      console.log('✅ Funnel analysis completed');
      return result;
    } catch (error) {
      console.error('❌ Failed to perform funnel analysis:', error);
      throw error;
    }
  }

  async performABTestAnalysis(organizationId: string, testId: string): Promise<{
    test: {
      id: string;
      name: string;
      hypothesis: string;
      startDate: string;
      endDate: string;
      status: 'running' | 'completed' | 'paused';
    };
    variants: {
      name: string;
      users: number;
      conversions: number;
      conversionRate: number;
      confidence: number;
    }[];
    results: {
      winner: string;
      significance: number;
      confidenceInterval: { lower: number; upper: number };
      recommendation: string;
    };
  }> {
    console.log('🔄 Performing A/B test analysis:', testId);
    
    try {
      const result = await this.makeRequest<any>(`/enterprise/analytics/ab-test/${testId}`, {
        method: 'POST',
        body: JSON.stringify({ organizationId }),
      });

      console.log('✅ A/B test analysis completed');
      return result;
    } catch (error) {
      console.error('❌ Failed to perform A/B test analysis:', error);
      throw error;
    }
  }

  // Predictive Analytics
  async generateForecast(organizationId: string, params: {
    metric: string;
    timeRange: { start: string; end: string };
    forecastPeriod: number;
    model: 'linear' | 'exponential' | 'seasonal' | 'arima' | 'prophet';
    confidence: number;
    filters?: Record<string, any>;
  }): Promise<{
    historical: { date: string; value: number }[];
    forecast: { date: string; value: number; lower: number; upper: number }[];
    accuracy: { mape: number; rmse: number; mae: number };
    insights: string[];
  }> {
    console.log('🔄 Generating forecast for:', params.metric);
    
    try {
      const result = await this.makeRequest<any>('/enterprise/analytics/forecast', {
        method: 'POST',
        body: JSON.stringify({ organizationId, ...params }),
      });

      console.log('✅ Forecast generated');
      return result;
    } catch (error) {
      console.error('❌ Failed to generate forecast:', error);
      throw error;
    }
  }

  async detectAnomalies(organizationId: string, params: {
    metric: string;
    timeRange: { start: string; end: string };
    sensitivity: 'low' | 'medium' | 'high';
    filters?: Record<string, any>;
  }): Promise<{
    anomalies: {
      timestamp: string;
      value: number;
      expected: number;
      severity: 'low' | 'medium' | 'high';
      type: 'spike' | 'dip' | 'trend_change';
      description: string;
    }[];
    summary: {
      totalAnomalies: number;
      severity: { low: number; medium: number; high: number };
      patterns: string[];
    };
  }> {
    console.log('🔄 Detecting anomalies for:', params.metric);
    
    try {
      const result = await this.makeRequest<any>('/enterprise/analytics/anomalies', {
        method: 'POST',
        body: JSON.stringify({ organizationId, ...params }),
      });

      console.log('✅ Anomaly detection completed');
      return result;
    } catch (error) {
      console.error('❌ Failed to detect anomalies:', error);
      throw error;
    }
  }

  // Data Export
  async createDataExportJob(jobData: Omit<DataExportJob, 'id' | 'status' | 'progress' | 'createdAt'>): Promise<DataExportJob> {
    console.log('🔄 Creating data export job:', jobData.type);
    
    try {
      const job = await this.makeRequest<DataExportJob>('/enterprise/analytics/export', {
        method: 'POST',
        body: JSON.stringify(jobData),
      });

      console.log('✅ Data export job created:', job.id);
      return job;
    } catch (error) {
      console.error('❌ Failed to create data export job:', error);
      throw error;
    }
  }

  async getDataExportJob(jobId: string): Promise<DataExportJob> {
    console.log('🔄 Fetching data export job:', jobId);
    
    try {
      const job = await this.makeRequest<DataExportJob>(`/enterprise/analytics/export/${jobId}`);
      console.log('✅ Data export job fetched');
      return job;
    } catch (error) {
      console.error('❌ Failed to fetch data export job:', error);
      throw error;
    }
  }

  // Audit & Compliance
  async logDataAccess(event: Omit<AuditDataEvent, 'id' | 'timestamp'>): Promise<void> {
    console.log('🔄 Logging data access event:', event.action);
    
    try {
      await this.makeRequest('/enterprise/analytics/audit', {
        method: 'POST',
        body: JSON.stringify(event),
      });

      console.log('✅ Data access event logged');
    } catch (error) {
      console.error('❌ Failed to log data access event:', error);
      throw error;
    }
  }

  async getAuditTrail(organizationId: string, filters?: {
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<AuditDataEvent[]> {
    console.log('🔄 Fetching audit trail');
    
    try {
      const params = new URLSearchParams({ organizationId });
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value.toString());
        });
      }

      const events = await this.makeRequest<AuditDataEvent[]>(`/enterprise/analytics/audit?${params.toString()}`);
      console.log('✅ Audit trail fetched:', events.length);
      return events;
    } catch (error) {
      console.error('❌ Failed to fetch audit trail:', error);
      throw error;
    }
  }

  async generateComplianceReport(organizationId: string, type: 'gdpr' | 'ccpa' | 'hipaa' | 'sox' | 'pci' | 'custom'): Promise<ComplianceReport> {
    console.log('🔄 Generating compliance report:', type);
    
    try {
      const report = await this.makeRequest<ComplianceReport>('/enterprise/analytics/compliance', {
        method: 'POST',
        body: JSON.stringify({ organizationId, type }),
      });

      console.log('✅ Compliance report generated');
      return report;
    } catch (error) {
      console.error('❌ Failed to generate compliance report:', error);
      throw error;
    }
  }

  // Real-time Analytics
  async subscribeToRealTimeMetrics(organizationId: string, metrics: string[], callback: (data: any) => void): Promise<() => void> {
    console.log('🔄 Subscribing to real-time metrics:', metrics.join(', '));
    
    try {
      const eventSource = new EventSource(`${this.baseUrl}/enterprise/analytics/realtime?organizationId=${organizationId}&metrics=${metrics.join(',')}`);
      
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        callback(data);
      };

      eventSource.onerror = (error) => {
        console.error('❌ Real-time metrics stream error:', error);
      };

      console.log('✅ Subscribed to real-time metrics');
      
      return () => {
        eventSource.close();
        console.log('✅ Unsubscribed from real-time metrics');
      };
    } catch (error) {
      console.error('❌ Failed to subscribe to real-time metrics:', error);
      throw error;
    }
  }

  // Utility Methods
  async validateQuery(query: string): Promise<{ valid: boolean; errors?: string[]; suggestions?: string[] }> {
    console.log('🔄 Validating query');
    
    try {
      const result = await this.makeRequest<{ valid: boolean; errors?: string[]; suggestions?: string[] }>('/enterprise/analytics/validate', {
        method: 'POST',
        body: JSON.stringify({ query }),
      });

      console.log('✅ Query validation completed');
      return result;
    } catch (error) {
      console.error('❌ Failed to validate query:', error);
      throw error;
    }
  }

  async optimizeQuery(query: string): Promise<{ optimized: string; improvements: string[]; performance: number }> {
    console.log('🔄 Optimizing query');
    
    try {
      const result = await this.makeRequest<{ optimized: string; improvements: string[]; performance: number }>('/enterprise/analytics/optimize', {
        method: 'POST',
        body: JSON.stringify({ query }),
      });

      console.log('✅ Query optimization completed');
      return result;
    } catch (error) {
      console.error('❌ Failed to optimize query:', error);
      throw error;
    }
  }

  clearCache(): void {
    this.cache.clear();
    console.log('✅ Enterprise analytics cache cleared');
  }
}

export const enterpriseAnalyticsService = new EnterpriseAnalyticsService();
export default enterpriseAnalyticsService;