import { analyticsService } from './analyticsService';

export interface ModerationRule {
  id: string;
  name: string;
  description: string;
  type: 'content' | 'user' | 'stream' | 'chat' | 'title' | 'category';
  severity: 'low' | 'medium' | 'high' | 'critical';
  action: 'flag' | 'hide' | 'remove' | 'ban' | 'warn' | 'quarantine';
  isActive: boolean;
  conditions: ModerationCondition[];
  exceptions: string[];
  organizationId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  statistics: {
    totalMatches: number;
    falsePositives: number;
    truePositives: number;
    accuracy: number;
  };
}

export interface ModerationCondition {
  id: string;
  type: 'keyword' | 'regex' | 'ai_classification' | 'image_analysis' | 'sentiment' | 'toxicity' | 'spam';
  operator: 'contains' | 'equals' | 'matches' | 'greater_than' | 'less_than' | 'in_range';
  value: string | number | string[];
  sensitivity: 'low' | 'medium' | 'high';
  weight: number;
  isNegation: boolean;
}

export interface ModerationCase {
  id: string;
  type: 'content' | 'user' | 'stream' | 'report';
  status: 'pending' | 'approved' | 'rejected' | 'escalated' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  content: {
    id: string;
    type: 'text' | 'image' | 'video' | 'audio' | 'stream' | 'chat_message';
    data: string;
    metadata: Record<string, any>;
  };
  reporter?: {
    id: string;
    type: 'user' | 'system' | 'ai';
    reason: string;
    details?: string;
  };
  violationType: string;
  ruleId?: string;
  aiConfidence?: number;
  moderatorId?: string;
  moderatorNotes?: string;
  actionTaken?: string;
  appealStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  evidence: Evidence[];
}

export interface Evidence {
  id: string;
  type: 'screenshot' | 'video' | 'audio' | 'text' | 'metadata' | 'user_report';
  url?: string;
  description: string;
  timestamp: string;
  isVerified: boolean;
  verifiedBy?: string;
  hash?: string;
}

export interface ModerationAction {
  id: string;
  caseId: string;
  type: 'approve' | 'reject' | 'escalate' | 'ban' | 'warn' | 'remove_content' | 'quarantine' | 'require_review';
  reason: string;
  details?: string;
  duration?: number;
  moderatorId: string;
  timestamp: string;
  isAppealable: boolean;
  notificationSent: boolean;
  reversedBy?: string;
  reversedAt?: string;
  reversalReason?: string;
}

export interface AIClassification {
  id: string;
  contentId: string;
  contentType: 'text' | 'image' | 'video' | 'audio';
  classifications: {
    category: string;
    confidence: number;
    reasons: string[];
  }[];
  toxicityScore: number;
  sentimentScore: number;
  spamScore: number;
  adultContentScore: number;
  violenceScore: number;
  hateSpeechScore: number;
  timestamp: string;
  modelVersion: string;
  processingTime: number;
}

export interface ModerationReport {
  id: string;
  reporterId: string;
  reportedUserId?: string;
  reportedContentId?: string;
  reportedStreamId?: string;
  reportType: 'harassment' | 'hate_speech' | 'spam' | 'violence' | 'adult_content' | 'copyright' | 'other';
  description: string;
  evidence?: Evidence[];
  status: 'pending' | 'under_review' | 'resolved' | 'dismissed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  resolution?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface ModerationQueue {
  id: string;
  name: string;
  description: string;
  type: 'auto' | 'manual' | 'escalation';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedModerators: string[];
  rules: string[];
  maxCases: number;
  currentCases: number;
  averageProcessingTime: number;
  isActive: boolean;
  organizationId?: string;
}

export interface ModerationDashboard {
  totalCases: number;
  pendingCases: number;
  resolvedCases: number;
  escalatedCases: number;
  averageResolutionTime: number;
  accuracyScore: number;
  topViolations: { type: string; count: number }[];
  moderatorPerformance: {
    id: string;
    name: string;
    casesHandled: number;
    averageTime: number;
    accuracy: number;
  }[];
  aiPerformance: {
    totalClassifications: number;
    accuracy: number;
    falsePositiveRate: number;
    falseNegativeRate: number;
  };
  trends: {
    date: string;
    newCases: number;
    resolvedCases: number;
    accuracy: number;
  }[];
}

class ContentModerationService {
  private readonly baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.streammulti.com';
  private readonly aiApiKey = process.env.EXPO_PUBLIC_AI_API_KEY || '';

  constructor() {
    console.log('Content Moderation Service initialized');
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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
      console.error(`Moderation API request failed: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Moderation API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // AI Content Classification
  async classifyContent(content: {
    id: string;
    type: 'text' | 'image' | 'video' | 'audio';
    data: string;
    metadata?: Record<string, any>;
  }): Promise<AIClassification> {
    console.log('🔄 Classifying content with AI:', content.id);
    
    try {
      const startTime = Date.now();
      
      const classification = await this.makeRequest<AIClassification>('/moderation/ai/classify', {
        method: 'POST',
        body: JSON.stringify({
          content,
          options: {
            checkToxicity: true,
            checkSentiment: true,
            checkSpam: true,
            checkAdultContent: true,
            checkViolence: true,
            checkHateSpeech: true,
          },
        }),
      });

      classification.processingTime = Date.now() - startTime;
      
      console.log('✅ Content classified:', content.id, 'Toxicity:', classification.toxicityScore);
      return classification;
    } catch (error) {
      console.error('❌ Failed to classify content:', error);
      throw error;
    }
  }

  async bulkClassifyContent(contents: Array<{
    id: string;
    type: 'text' | 'image' | 'video' | 'audio';
    data: string;
    metadata?: Record<string, any>;
  }>): Promise<AIClassification[]> {
    console.log('🔄 Bulk classifying content:', contents.length, 'items');
    
    try {
      const classifications = await this.makeRequest<AIClassification[]>('/moderation/ai/classify/bulk', {
        method: 'POST',
        body: JSON.stringify({ contents }),
      });

      console.log('✅ Bulk classification completed:', classifications.length);
      return classifications;
    } catch (error) {
      console.error('❌ Failed to bulk classify content:', error);
      throw error;
    }
  }

  // Moderation Rules
  async createModerationRule(rule: Omit<ModerationRule, 'id' | 'createdAt' | 'updatedAt' | 'statistics'>): Promise<ModerationRule> {
    console.log('🔄 Creating moderation rule:', rule.name);
    
    try {
      const newRule = await this.makeRequest<ModerationRule>('/moderation/rules', {
        method: 'POST',
        body: JSON.stringify(rule),
      });

      console.log('✅ Moderation rule created:', newRule.name);
      return newRule;
    } catch (error) {
      console.error('❌ Failed to create moderation rule:', error);
      throw error;
    }
  }

  async getModerationRules(organizationId?: string, isActive?: boolean): Promise<ModerationRule[]> {
    console.log('🔄 Fetching moderation rules');
    
    try {
      const params = new URLSearchParams();
      if (organizationId) params.append('organizationId', organizationId);
      if (isActive !== undefined) params.append('isActive', isActive.toString());

      const rules = await this.makeRequest<ModerationRule[]>(`/moderation/rules?${params.toString()}`);
      console.log('✅ Fetched moderation rules:', rules.length);
      return rules;
    } catch (error) {
      console.error('❌ Failed to fetch moderation rules:', error);
      throw error;
    }
  }

  async updateModerationRule(ruleId: string, updates: Partial<ModerationRule>): Promise<ModerationRule> {
    console.log('🔄 Updating moderation rule:', ruleId);
    
    try {
      const rule = await this.makeRequest<ModerationRule>(`/moderation/rules/${ruleId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });

      console.log('✅ Moderation rule updated:', ruleId);
      return rule;
    } catch (error) {
      console.error('❌ Failed to update moderation rule:', error);
      throw error;
    }
  }

  async testModerationRule(ruleId: string, testContent: {
    type: 'text' | 'image' | 'video' | 'audio';
    data: string;
  }): Promise<{ matches: boolean; confidence: number; reasons: string[] }> {
    console.log('🔄 Testing moderation rule:', ruleId);
    
    try {
      const result = await this.makeRequest<{ matches: boolean; confidence: number; reasons: string[] }>(`/moderation/rules/${ruleId}/test`, {
        method: 'POST',
        body: JSON.stringify(testContent),
      });

      console.log('✅ Rule test completed:', result.matches);
      return result;
    } catch (error) {
      console.error('❌ Failed to test moderation rule:', error);
      throw error;
    }
  }

  // Moderation Cases
  async createModerationCase(caseData: Omit<ModerationCase, 'id' | 'createdAt' | 'updatedAt'>): Promise<ModerationCase> {
    console.log('🔄 Creating moderation case:', caseData.type);
    
    try {
      const moderationCase = await this.makeRequest<ModerationCase>('/moderation/cases', {
        method: 'POST',
        body: JSON.stringify(caseData),
      });

      console.log('✅ Moderation case created:', moderationCase.id);
      return moderationCase;
    } catch (error) {
      console.error('❌ Failed to create moderation case:', error);
      throw error;
    }
  }

  async getModerationCases(filters?: {
    status?: string;
    priority?: string;
    type?: string;
    moderatorId?: string;
    organizationId?: string;
    limit?: number;
    offset?: number;
  }): Promise<ModerationCase[]> {
    console.log('🔄 Fetching moderation cases');
    
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) params.append(key, value.toString());
        });
      }

      const cases = await this.makeRequest<ModerationCase[]>(`/moderation/cases?${params.toString()}`);
      console.log('✅ Fetched moderation cases:', cases.length);
      return cases;
    } catch (error) {
      console.error('❌ Failed to fetch moderation cases:', error);
      throw error;
    }
  }

  async assignModerationCase(caseId: string, moderatorId: string): Promise<ModerationCase> {
    console.log('🔄 Assigning moderation case:', caseId, 'to', moderatorId);
    
    try {
      const moderationCase = await this.makeRequest<ModerationCase>(`/moderation/cases/${caseId}/assign`, {
        method: 'POST',
        body: JSON.stringify({ moderatorId }),
      });

      console.log('✅ Moderation case assigned:', caseId);
      return moderationCase;
    } catch (error) {
      console.error('❌ Failed to assign moderation case:', error);
      throw error;
    }
  }

  async resolveModerationCase(caseId: string, action: ModerationAction): Promise<ModerationCase> {
    console.log('🔄 Resolving moderation case:', caseId, 'with action:', action.type);
    
    try {
      const moderationCase = await this.makeRequest<ModerationCase>(`/moderation/cases/${caseId}/resolve`, {
        method: 'POST',
        body: JSON.stringify(action),
      });

      console.log('✅ Moderation case resolved:', caseId);
      return moderationCase;
    } catch (error) {
      console.error('❌ Failed to resolve moderation case:', error);
      throw error;
    }
  }

  // Reporting System
  async createReport(report: Omit<ModerationReport, 'id' | 'createdAt' | 'updatedAt'>): Promise<ModerationReport> {
    console.log('🔄 Creating moderation report:', report.reportType);
    
    try {
      const newReport = await this.makeRequest<ModerationReport>('/moderation/reports', {
        method: 'POST',
        body: JSON.stringify(report),
      });

      console.log('✅ Moderation report created:', newReport.id);
      return newReport;
    } catch (error) {
      console.error('❌ Failed to create moderation report:', error);
      throw error;
    }
  }

  async getReports(filters?: {
    status?: string;
    reportType?: string;
    priority?: string;
    reporterId?: string;
    assignedTo?: string;
    limit?: number;
    offset?: number;
  }): Promise<ModerationReport[]> {
    console.log('🔄 Fetching moderation reports');
    
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) params.append(key, value.toString());
        });
      }

      const reports = await this.makeRequest<ModerationReport[]>(`/moderation/reports?${params.toString()}`);
      console.log('✅ Fetched moderation reports:', reports.length);
      return reports;
    } catch (error) {
      console.error('❌ Failed to fetch moderation reports:', error);
      throw error;
    }
  }

  // Automated Actions
  async processContent(contentId: string, contentType: string, contentData: string): Promise<{
    action: 'approve' | 'flag' | 'remove' | 'quarantine';
    confidence: number;
    reasons: string[];
    ruleMatches: string[];
  }> {
    console.log('🔄 Processing content for moderation:', contentId);
    
    try {
      // First classify content with AI
      const classification = await this.classifyContent({
        id: contentId,
        type: contentType as any,
        data: contentData,
      });

      // Get applicable rules
      const rules = await this.getModerationRules(undefined, true);
      
      // Process against rules
      const result = await this.makeRequest<{
        action: 'approve' | 'flag' | 'remove' | 'quarantine';
        confidence: number;
        reasons: string[];
        ruleMatches: string[];
      }>('/moderation/process', {
        method: 'POST',
        body: JSON.stringify({
          contentId,
          contentType,
          contentData,
          classification,
          rules: rules.map(r => r.id),
        }),
      });

      console.log('✅ Content processed:', contentId, 'Action:', result.action);
      return result;
    } catch (error) {
      console.error('❌ Failed to process content:', error);
      throw error;
    }
  }

  async moderateStreamTitle(streamId: string, title: string): Promise<{
    approved: boolean;
    suggestedTitle?: string;
    reasons: string[];
  }> {
    console.log('🔄 Moderating stream title:', streamId);
    
    try {
      const result = await this.makeRequest<{
        approved: boolean;
        suggestedTitle?: string;
        reasons: string[];
      }>('/moderation/stream/title', {
        method: 'POST',
        body: JSON.stringify({ streamId, title }),
      });

      console.log('✅ Stream title moderated:', streamId, 'Approved:', result.approved);
      return result;
    } catch (error) {
      console.error('❌ Failed to moderate stream title:', error);
      throw error;
    }
  }

  async moderateChatMessage(messageId: string, message: string, userId: string, channelId: string): Promise<{
    action: 'allow' | 'filter' | 'block' | 'timeout' | 'ban';
    duration?: number;
    reason?: string;
    filteredMessage?: string;
  }> {
    console.log('🔄 Moderating chat message:', messageId);
    
    try {
      const result = await this.makeRequest<{
        action: 'allow' | 'filter' | 'block' | 'timeout' | 'ban';
        duration?: number;
        reason?: string;
        filteredMessage?: string;
      }>('/moderation/chat/message', {
        method: 'POST',
        body: JSON.stringify({ messageId, message, userId, channelId }),
      });

      console.log('✅ Chat message moderated:', messageId, 'Action:', result.action);
      return result;
    } catch (error) {
      console.error('❌ Failed to moderate chat message:', error);
      throw error;
    }
  }

  // Analytics and Dashboard
  async getModerationDashboard(organizationId?: string, timeRange: string = '7d'): Promise<ModerationDashboard> {
    console.log('🔄 Fetching moderation dashboard');
    
    try {
      const params = new URLSearchParams();
      if (organizationId) params.append('organizationId', organizationId);
      params.append('timeRange', timeRange);

      const dashboard = await this.makeRequest<ModerationDashboard>(`/moderation/dashboard?${params.toString()}`);
      console.log('✅ Fetched moderation dashboard');
      return dashboard;
    } catch (error) {
      console.error('❌ Failed to fetch moderation dashboard:', error);
      throw error;
    }
  }

  async getModerationMetrics(organizationId?: string, timeRange: string = '30d'): Promise<{
    totalActions: number;
    accuracyTrend: { date: string; accuracy: number }[];
    topViolationTypes: { type: string; count: number; trend: number }[];
    moderatorWorkload: { moderatorId: string; casesHandled: number; averageTime: number }[];
    aiPerformance: {
      precision: number;
      recall: number;
      f1Score: number;
      processingTime: number;
    };
  }> {
    console.log('🔄 Fetching moderation metrics');
    
    try {
      const params = new URLSearchParams();
      if (organizationId) params.append('organizationId', organizationId);
      params.append('timeRange', timeRange);

      const metrics = await this.makeRequest<any>(`/moderation/metrics?${params.toString()}`);
      console.log('✅ Fetched moderation metrics');
      return metrics;
    } catch (error) {
      console.error('❌ Failed to fetch moderation metrics:', error);
      throw error;
    }
  }

  // Training and Feedback
  async provideFeedback(caseId: string, feedback: {
    isCorrect: boolean;
    actualViolationType?: string;
    notes?: string;
    suggestedImprovement?: string;
  }): Promise<void> {
    console.log('🔄 Providing feedback for case:', caseId);
    
    try {
      await this.makeRequest(`/moderation/cases/${caseId}/feedback`, {
        method: 'POST',
        body: JSON.stringify(feedback),
      });

      console.log('✅ Feedback provided for case:', caseId);
    } catch (error) {
      console.error('❌ Failed to provide feedback:', error);
      throw error;
    }
  }

  async trainAIModel(trainingData: {
    contentId: string;
    contentType: string;
    contentData: string;
    labels: string[];
    feedback: 'positive' | 'negative';
  }[]): Promise<{ status: 'queued' | 'processing' | 'completed'; jobId: string }> {
    console.log('🔄 Training AI model with', trainingData.length, 'samples');
    
    try {
      const result = await this.makeRequest<{ status: 'queued' | 'processing' | 'completed'; jobId: string }>('/moderation/ai/train', {
        method: 'POST',
        body: JSON.stringify({ trainingData }),
      });

      console.log('✅ AI model training queued:', result.jobId);
      return result;
    } catch (error) {
      console.error('❌ Failed to queue AI model training:', error);
      throw error;
    }
  }

  // Utility Methods
  async exportModerationData(organizationId?: string, filters?: {
    startDate?: string;
    endDate?: string;
    includeReports?: boolean;
    includeCases?: boolean;
    includeRules?: boolean;
    format?: 'json' | 'csv' | 'xml';
  }): Promise<string> {
    console.log('🔄 Exporting moderation data');
    
    try {
      const result = await this.makeRequest<{ downloadUrl: string }>('/moderation/export', {
        method: 'POST',
        body: JSON.stringify({ organizationId, ...filters }),
      });

      console.log('✅ Moderation data export ready:', result.downloadUrl);
      return result.downloadUrl;
    } catch (error) {
      console.error('❌ Failed to export moderation data:', error);
      throw error;
    }
  }

  async validateContentIntegrity(contentId: string, contentHash: string): Promise<{
    isValid: boolean;
    actualHash?: string;
    tampered?: boolean;
  }> {
    console.log('🔄 Validating content integrity:', contentId);
    
    try {
      const result = await this.makeRequest<{
        isValid: boolean;
        actualHash?: string;
        tampered?: boolean;
      }>(`/moderation/validate/${contentId}`, {
        method: 'POST',
        body: JSON.stringify({ expectedHash: contentHash }),
      });

      console.log('✅ Content integrity validated:', contentId, 'Valid:', result.isValid);
      return result;
    } catch (error) {
      console.error('❌ Failed to validate content integrity:', error);
      throw error;
    }
  }
}

export const contentModerationService = new ContentModerationService();
export default contentModerationService;