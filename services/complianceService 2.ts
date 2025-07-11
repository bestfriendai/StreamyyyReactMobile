export interface ComplianceFramework {
  id: string;
  name: string;
  description: string;
  version: string;
  jurisdiction: string;
  category: 'privacy' | 'security' | 'financial' | 'healthcare' | 'industry' | 'international';
  requirements: ComplianceRequirement[];
  controls: ComplianceControl[];
  assessmentFrequency: 'monthly' | 'quarterly' | 'annually' | 'continuous';
  mandatory: boolean;
  penalties: {
    type: 'fine' | 'suspension' | 'criminal' | 'civil';
    amount?: number;
    currency?: string;
    description: string;
  }[];
  lastUpdated: string;
  effectiveDate: string;
  expirationDate?: string;
}

export interface ComplianceRequirement {
  id: string;
  frameworkId: string;
  section: string;
  title: string;
  description: string;
  mandatory: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  controlObjectives: string[];
  evidence: string[];
  testingProcedures: string[];
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
  automatedCheck: boolean;
  dependencies: string[];
  tags: string[];
}

export interface ComplianceControl {
  id: string;
  name: string;
  description: string;
  type: 'preventive' | 'detective' | 'corrective' | 'compensating';
  category: 'access' | 'data' | 'system' | 'physical' | 'administrative';
  implementation: 'manual' | 'automated' | 'hybrid';
  frequency: 'continuous' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
  owner: string;
  status: 'implemented' | 'in_progress' | 'planned' | 'not_applicable';
  effectiveness: 'effective' | 'needs_improvement' | 'ineffective' | 'not_tested';
  lastTested: string;
  nextTest: string;
  evidence: ComplianceEvidence[];
  risks: string[];
  requirements: string[];
}

export interface ComplianceEvidence {
  id: string;
  type: 'document' | 'screenshot' | 'log' | 'certificate' | 'audit_report' | 'test_result';
  name: string;
  description: string;
  url: string;
  hash: string;
  collectedAt: string;
  collectedBy: string;
  validUntil?: string;
  automated: boolean;
  metadata: Record<string, any>;
}

export interface ComplianceAssessment {
  id: string;
  organizationId: string;
  frameworkId: string;
  name: string;
  description: string;
  type: 'self_assessment' | 'external_audit' | 'certification' | 'penetration_test';
  status: 'planned' | 'in_progress' | 'completed' | 'remediation' | 'certified';
  scope: {
    systems: string[];
    processes: string[];
    locations: string[];
    timeRange: { start: string; end: string };
  };
  assessor: {
    type: 'internal' | 'external';
    name: string;
    organization?: string;
    credentials: string[];
    contactInfo: string;
  };
  schedule: {
    startDate: string;
    endDate: string;
    milestones: {
      name: string;
      date: string;
      status: 'pending' | 'completed' | 'delayed';
    }[];
  };
  findings: ComplianceFinding[];
  score: {
    overall: number;
    byCategory: Record<string, number>;
    byRequirement: Record<string, number>;
  };
  recommendations: ComplianceRecommendation[];
  certificationStatus?: {
    issued: boolean;
    certificateNumber?: string;
    validFrom?: string;
    validUntil?: string;
    renewalDate?: string;
  };
  createdAt: string;
  completedAt?: string;
}

export interface ComplianceFinding {
  id: string;
  assessmentId: string;
  requirementId: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'accepted_risk' | 'false_positive';
  category: 'deficiency' | 'weakness' | 'non_compliance' | 'improvement_opportunity';
  evidence: ComplianceEvidence[];
  impact: string;
  likelihood: 'low' | 'medium' | 'high';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  assignedTo: string;
  dueDate: string;
  resolution?: {
    action: string;
    implementedBy: string;
    implementedAt: string;
    verification: string;
    verifiedBy: string;
    verifiedAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ComplianceRecommendation {
  id: string;
  title: string;
  description: string;
  category: 'security' | 'privacy' | 'process' | 'training' | 'technology';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  effort: 'low' | 'medium' | 'high';
  cost: {
    estimate: number;
    currency: string;
    breakdown: { item: string; cost: number }[];
  };
  timeline: {
    estimate: number;
    unit: 'days' | 'weeks' | 'months';
    phases: { name: string; duration: number; dependencies: string[] }[];
  };
  benefits: string[];
  risks: string[];
  requirements: string[];
  implementation: {
    steps: string[];
    resources: string[];
    skills: string[];
    tools: string[];
  };
  success_criteria: string[];
  status: 'proposed' | 'approved' | 'in_progress' | 'completed' | 'rejected';
}

export interface DataMapping {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  dataElements: DataElement[];
  dataFlows: DataFlow[];
  purposes: DataPurpose[];
  legalBasis: LegalBasis[];
  retentionPolicies: RetentionPolicy[];
  accessControls: AccessControl[];
  transfers: DataTransfer[];
  breachProcedures: BreachProcedure[];
  createdAt: string;
  updatedAt: string;
  version: string;
  approvedBy: string;
  approvedAt: string;
}

export interface DataElement {
  id: string;
  name: string;
  type: 'personal' | 'sensitive' | 'anonymous' | 'pseudonymous' | 'public';
  category: 'identity' | 'contact' | 'financial' | 'health' | 'biometric' | 'behavioral' | 'other';
  description: string;
  sources: string[];
  storage: {
    location: string;
    encryption: boolean;
    backups: boolean;
    retention: string;
  };
  processing: {
    automated: boolean;
    profiling: boolean;
    decisionMaking: boolean;
    sharing: boolean;
  };
  subjects: string[];
  controllers: string[];
  processors: string[];
  purposes: string[];
  legalBasis: string[];
}

export interface DataFlow {
  id: string;
  name: string;
  source: string;
  destination: string;
  dataElements: string[];
  purpose: string;
  frequency: string;
  encryption: boolean;
  authentication: boolean;
  logging: boolean;
  monitoring: boolean;
}

export interface DataPurpose {
  id: string;
  name: string;
  description: string;
  category: 'operational' | 'analytical' | 'marketing' | 'research' | 'compliance' | 'security';
  legalBasis: string;
  dataMinimization: boolean;
  retention: string;
  automated: boolean;
  profiling: boolean;
  sharing: boolean;
  consent: {
    required: boolean;
    granular: boolean;
    withdrawable: boolean;
  };
}

export interface LegalBasis {
  id: string;
  name: string;
  type: 'consent' | 'contract' | 'legal_obligation' | 'vital_interests' | 'public_task' | 'legitimate_interests';
  description: string;
  documentation: string;
  assessment?: string;
  balancingTest?: string;
  alternatives?: string;
}

export interface RetentionPolicy {
  id: string;
  name: string;
  description: string;
  dataCategories: string[];
  retentionPeriod: {
    duration: number;
    unit: 'days' | 'months' | 'years';
    startEvent: string;
  };
  disposalMethod: 'deletion' | 'anonymization' | 'archival';
  exceptions: string[];
  legalBasis: string;
  automation: {
    enabled: boolean;
    schedule: string;
    verification: boolean;
  };
}

export interface AccessControl {
  id: string;
  name: string;
  description: string;
  scope: string[];
  principals: {
    users: string[];
    roles: string[];
    systems: string[];
  };
  permissions: {
    read: boolean;
    write: boolean;
    delete: boolean;
    export: boolean;
    share: boolean;
  };
  conditions: {
    timeRestrictions?: string;
    locationRestrictions?: string[];
    deviceRestrictions?: string[];
    purposeRestrictions?: string[];
  };
  monitoring: {
    logging: boolean;
    alerting: boolean;
    reporting: boolean;
  };
}

export interface DataTransfer {
  id: string;
  name: string;
  description: string;
  type: 'internal' | 'external' | 'international';
  source: string;
  destination: string;
  recipient: {
    name: string;
    type: 'controller' | 'processor' | 'joint_controller';
    country: string;
    adequacyDecision: boolean;
    safeguards: string[];
    contact: string;
  };
  dataCategories: string[];
  purposes: string[];
  frequency: string;
  volume: string;
  encryption: boolean;
  authorization: string;
  contractualProtections: string[];
  monitoringMeasures: string[];
}

export interface BreachProcedure {
  id: string;
  name: string;
  description: string;
  triggerConditions: string[];
  responseTeam: {
    lead: string;
    members: string[];
    external: string[];
  };
  timeline: {
    detection: string;
    assessment: string;
    containment: string;
    notification: string;
    resolution: string;
  };
  notifications: {
    internal: { recipients: string[]; template: string };
    regulatory: { authorities: string[]; template: string; timeframe: string };
    individuals: { criteria: string; template: string; timeframe: string };
    media: { criteria: string; spokesperson: string };
  };
  documentation: string[];
  recovery: string[];
  prevention: string[];
}

export interface RiskAssessment {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  scope: string;
  methodology: string;
  risks: ComplianceRisk[];
  treatments: RiskTreatment[];
  residualRisk: {
    level: 'low' | 'medium' | 'high' | 'critical';
    score: number;
    acceptanceCriteria: string;
    approvedBy: string;
    approvedAt: string;
  };
  reviewSchedule: {
    frequency: string;
    nextReview: string;
    triggers: string[];
  };
  createdAt: string;
  updatedAt: string;
  version: string;
}

export interface ComplianceRisk {
  id: string;
  name: string;
  description: string;
  category: 'regulatory' | 'operational' | 'reputational' | 'financial' | 'strategic';
  likelihood: {
    level: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
    score: number;
    justification: string;
  };
  impact: {
    level: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
    score: number;
    financial?: number;
    operational?: string;
    reputational?: string;
    legal?: string;
  };
  inherentRisk: {
    level: 'low' | 'medium' | 'high' | 'critical';
    score: number;
  };
  controls: string[];
  residualRisk: {
    level: 'low' | 'medium' | 'high' | 'critical';
    score: number;
  };
  tolerance: {
    acceptable: boolean;
    threshold: number;
    justification?: string;
  };
  indicators: string[];
  triggers: string[];
}

export interface RiskTreatment {
  id: string;
  riskId: string;
  strategy: 'avoid' | 'mitigate' | 'transfer' | 'accept';
  actions: {
    description: string;
    owner: string;
    dueDate: string;
    status: 'planned' | 'in_progress' | 'completed' | 'overdue';
    cost?: number;
    effectiveness?: number;
  }[];
  monitoring: {
    indicators: string[];
    frequency: string;
    responsible: string;
  };
  contingency: {
    triggers: string[];
    actions: string[];
    responsible: string;
  };
}

class ComplianceService {
  private readonly baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.streammulti.com';

  constructor() {
    console.log('Compliance Service initialized');
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
      console.error(`Compliance API request failed: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Compliance API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Framework Management
  async getComplianceFrameworks(jurisdiction?: string, category?: string): Promise<ComplianceFramework[]> {
    console.log('🔄 Fetching compliance frameworks');
    
    try {
      const params = new URLSearchParams();
      if (jurisdiction) params.append('jurisdiction', jurisdiction);
      if (category) params.append('category', category);

      const frameworks = await this.makeRequest<ComplianceFramework[]>(`/enterprise/compliance/frameworks?${params.toString()}`);
      console.log('✅ Compliance frameworks fetched:', frameworks.length);
      return frameworks;
    } catch (error) {
      console.error('❌ Failed to fetch compliance frameworks:', error);
      throw error;
    }
  }

  async getFrameworkRequirements(frameworkId: string): Promise<ComplianceRequirement[]> {
    console.log('🔄 Fetching framework requirements:', frameworkId);
    
    try {
      const requirements = await this.makeRequest<ComplianceRequirement[]>(`/enterprise/compliance/frameworks/${frameworkId}/requirements`);
      console.log('✅ Framework requirements fetched:', requirements.length);
      return requirements;
    } catch (error) {
      console.error('❌ Failed to fetch framework requirements:', error);
      throw error;
    }
  }

  // Assessment Management
  async createAssessment(assessment: Omit<ComplianceAssessment, 'id' | 'createdAt' | 'findings' | 'score' | 'recommendations'>): Promise<ComplianceAssessment> {
    console.log('🔄 Creating compliance assessment:', assessment.name);
    
    try {
      const newAssessment = await this.makeRequest<ComplianceAssessment>('/enterprise/compliance/assessments', {
        method: 'POST',
        body: JSON.stringify(assessment),
      });

      console.log('✅ Compliance assessment created:', newAssessment.name);
      return newAssessment;
    } catch (error) {
      console.error('❌ Failed to create compliance assessment:', error);
      throw error;
    }
  }

  async getAssessments(organizationId: string, filters?: {
    frameworkId?: string;
    status?: string;
    type?: string;
  }): Promise<ComplianceAssessment[]> {
    console.log('🔄 Fetching compliance assessments');
    
    try {
      const params = new URLSearchParams({ organizationId });
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });
      }

      const assessments = await this.makeRequest<ComplianceAssessment[]>(`/enterprise/compliance/assessments?${params.toString()}`);
      console.log('✅ Compliance assessments fetched:', assessments.length);
      return assessments;
    } catch (error) {
      console.error('❌ Failed to fetch compliance assessments:', error);
      throw error;
    }
  }

  async startAssessment(assessmentId: string): Promise<ComplianceAssessment> {
    console.log('🔄 Starting compliance assessment:', assessmentId);
    
    try {
      const assessment = await this.makeRequest<ComplianceAssessment>(`/enterprise/compliance/assessments/${assessmentId}/start`, {
        method: 'POST',
      });

      console.log('✅ Compliance assessment started');
      return assessment;
    } catch (error) {
      console.error('❌ Failed to start compliance assessment:', error);
      throw error;
    }
  }

  async submitAssessmentResponse(assessmentId: string, requirementId: string, response: {
    compliant: boolean;
    evidence: ComplianceEvidence[];
    notes: string;
    score?: number;
  }): Promise<void> {
    console.log('🔄 Submitting assessment response:', requirementId);
    
    try {
      await this.makeRequest(`/enterprise/compliance/assessments/${assessmentId}/responses`, {
        method: 'POST',
        body: JSON.stringify({ requirementId, ...response }),
      });

      console.log('✅ Assessment response submitted');
    } catch (error) {
      console.error('❌ Failed to submit assessment response:', error);
      throw error;
    }
  }

  async generateAssessmentReport(assessmentId: string, format: 'pdf' | 'docx' | 'html'): Promise<string> {
    console.log('🔄 Generating assessment report:', assessmentId);
    
    try {
      const result = await this.makeRequest<{ downloadUrl: string }>(`/enterprise/compliance/assessments/${assessmentId}/report`, {
        method: 'POST',
        body: JSON.stringify({ format }),
      });

      console.log('✅ Assessment report generated');
      return result.downloadUrl;
    } catch (error) {
      console.error('❌ Failed to generate assessment report:', error);
      throw error;
    }
  }

  // Control Management
  async getControls(organizationId: string, filters?: {
    frameworkId?: string;
    category?: string;
    status?: string;
    effectiveness?: string;
  }): Promise<ComplianceControl[]> {
    console.log('🔄 Fetching compliance controls');
    
    try {
      const params = new URLSearchParams({ organizationId });
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });
      }

      const controls = await this.makeRequest<ComplianceControl[]>(`/enterprise/compliance/controls?${params.toString()}`);
      console.log('✅ Compliance controls fetched:', controls.length);
      return controls;
    } catch (error) {
      console.error('❌ Failed to fetch compliance controls:', error);
      throw error;
    }
  }

  async updateControlStatus(controlId: string, status: ComplianceControl['status'], evidence?: ComplianceEvidence[]): Promise<ComplianceControl> {
    console.log('🔄 Updating control status:', controlId);
    
    try {
      const control = await this.makeRequest<ComplianceControl>(`/enterprise/compliance/controls/${controlId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, evidence }),
      });

      console.log('✅ Control status updated');
      return control;
    } catch (error) {
      console.error('❌ Failed to update control status:', error);
      throw error;
    }
  }

  async testControl(controlId: string, testPlan: {
    procedure: string;
    expectedResult: string;
    testData?: any;
    environment: string;
  }): Promise<{
    testId: string;
    result: 'pass' | 'fail' | 'partial';
    findings: string[];
    evidence: ComplianceEvidence[];
    recommendations: string[];
  }> {
    console.log('🔄 Testing control:', controlId);
    
    try {
      const result = await this.makeRequest<any>(`/enterprise/compliance/controls/${controlId}/test`, {
        method: 'POST',
        body: JSON.stringify(testPlan),
      });

      console.log('✅ Control test completed');
      return result;
    } catch (error) {
      console.error('❌ Failed to test control:', error);
      throw error;
    }
  }

  // Data Mapping & Privacy
  async createDataMapping(mapping: Omit<DataMapping, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'approvedBy' | 'approvedAt'>): Promise<DataMapping> {
    console.log('🔄 Creating data mapping:', mapping.name);
    
    try {
      const dataMapping = await this.makeRequest<DataMapping>('/enterprise/compliance/data-mapping', {
        method: 'POST',
        body: JSON.stringify(mapping),
      });

      console.log('✅ Data mapping created:', dataMapping.name);
      return dataMapping;
    } catch (error) {
      console.error('❌ Failed to create data mapping:', error);
      throw error;
    }
  }

  async getDataMappings(organizationId: string): Promise<DataMapping[]> {
    console.log('🔄 Fetching data mappings');
    
    try {
      const mappings = await this.makeRequest<DataMapping[]>(`/enterprise/compliance/data-mapping?organizationId=${organizationId}`);
      console.log('✅ Data mappings fetched:', mappings.length);
      return mappings;
    } catch (error) {
      console.error('❌ Failed to fetch data mappings:', error);
      throw error;
    }
  }

  async generatePrivacyNotice(organizationId: string, template: 'gdpr' | 'ccpa' | 'pipeda' | 'custom', customizations?: Record<string, any>): Promise<{
    html: string;
    text: string;
    lastUpdated: string;
    effectiveDate: string;
  }> {
    console.log('🔄 Generating privacy notice');
    
    try {
      const notice = await this.makeRequest<any>('/enterprise/compliance/privacy-notice', {
        method: 'POST',
        body: JSON.stringify({ organizationId, template, customizations }),
      });

      console.log('✅ Privacy notice generated');
      return notice;
    } catch (error) {
      console.error('❌ Failed to generate privacy notice:', error);
      throw error;
    }
  }

  async processDataSubjectRequest(organizationId: string, request: {
    type: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction' | 'objection';
    subject: {
      email: string;
      identifiers: Record<string, string>;
      verification: string;
    };
    scope?: string[];
    reason?: string;
  }): Promise<{
    requestId: string;
    status: 'pending' | 'processing' | 'completed' | 'rejected';
    estimatedCompletion: string;
    verificationRequired: boolean;
  }> {
    console.log('🔄 Processing data subject request:', request.type);
    
    try {
      const result = await this.makeRequest<any>('/enterprise/compliance/data-subject-requests', {
        method: 'POST',
        body: JSON.stringify({ organizationId, ...request }),
      });

      console.log('✅ Data subject request processed');
      return result;
    } catch (error) {
      console.error('❌ Failed to process data subject request:', error);
      throw error;
    }
  }

  // Risk Assessment
  async createRiskAssessment(assessment: Omit<RiskAssessment, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<RiskAssessment> {
    console.log('🔄 Creating risk assessment:', assessment.name);
    
    try {
      const riskAssessment = await this.makeRequest<RiskAssessment>('/enterprise/compliance/risk-assessments', {
        method: 'POST',
        body: JSON.stringify(assessment),
      });

      console.log('✅ Risk assessment created:', riskAssessment.name);
      return riskAssessment;
    } catch (error) {
      console.error('❌ Failed to create risk assessment:', error);
      throw error;
    }
  }

  async getRiskAssessments(organizationId: string): Promise<RiskAssessment[]> {
    console.log('🔄 Fetching risk assessments');
    
    try {
      const assessments = await this.makeRequest<RiskAssessment[]>(`/enterprise/compliance/risk-assessments?organizationId=${organizationId}`);
      console.log('✅ Risk assessments fetched:', assessments.length);
      return assessments;
    } catch (error) {
      console.error('❌ Failed to fetch risk assessments:', error);
      throw error;
    }
  }

  async updateRiskTreatment(riskId: string, treatment: RiskTreatment): Promise<RiskTreatment> {
    console.log('🔄 Updating risk treatment:', riskId);
    
    try {
      const updatedTreatment = await this.makeRequest<RiskTreatment>(`/enterprise/compliance/risks/${riskId}/treatment`, {
        method: 'PUT',
        body: JSON.stringify(treatment),
      });

      console.log('✅ Risk treatment updated');
      return updatedTreatment;
    } catch (error) {
      console.error('❌ Failed to update risk treatment:', error);
      throw error;
    }
  }

  // Finding Management
  async createFinding(finding: Omit<ComplianceFinding, 'id' | 'createdAt' | 'updatedAt'>): Promise<ComplianceFinding> {
    console.log('🔄 Creating compliance finding:', finding.title);
    
    try {
      const newFinding = await this.makeRequest<ComplianceFinding>('/enterprise/compliance/findings', {
        method: 'POST',
        body: JSON.stringify(finding),
      });

      console.log('✅ Compliance finding created:', newFinding.title);
      return newFinding;
    } catch (error) {
      console.error('❌ Failed to create compliance finding:', error);
      throw error;
    }
  }

  async getFindings(organizationId: string, filters?: {
    assessmentId?: string;
    severity?: string;
    status?: string;
    assignedTo?: string;
  }): Promise<ComplianceFinding[]> {
    console.log('🔄 Fetching compliance findings');
    
    try {
      const params = new URLSearchParams({ organizationId });
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });
      }

      const findings = await this.makeRequest<ComplianceFinding[]>(`/enterprise/compliance/findings?${params.toString()}`);
      console.log('✅ Compliance findings fetched:', findings.length);
      return findings;
    } catch (error) {
      console.error('❌ Failed to fetch compliance findings:', error);
      throw error;
    }
  }

  async resolveFinding(findingId: string, resolution: ComplianceFinding['resolution']): Promise<ComplianceFinding> {
    console.log('🔄 Resolving compliance finding:', findingId);
    
    try {
      const finding = await this.makeRequest<ComplianceFinding>(`/enterprise/compliance/findings/${findingId}/resolve`, {
        method: 'POST',
        body: JSON.stringify(resolution),
      });

      console.log('✅ Compliance finding resolved');
      return finding;
    } catch (error) {
      console.error('❌ Failed to resolve compliance finding:', error);
      throw error;
    }
  }

  // Monitoring & Reporting
  async getComplianceDashboard(organizationId: string, timeRange?: string): Promise<{
    overview: {
      totalFrameworks: number;
      activeAssessments: number;
      openFindings: number;
      compliance_score: number;
      riskLevel: 'low' | 'medium' | 'high' | 'critical';
    };
    trends: {
      assessments: { date: string; count: number }[];
      findings: { date: string; count: number; severity: string }[];
      controls: { date: string; effective: number; total: number }[];
    };
    frameworks: {
      name: string;
      compliance: number;
      lastAssessed: string;
      nextAssessment: string;
      status: 'compliant' | 'non_compliant' | 'partial';
    }[];
    upcomingTasks: {
      type: 'assessment' | 'control_test' | 'finding_remediation' | 'review';
      title: string;
      dueDate: string;
      priority: string;
      assignee: string;
    }[];
  }> {
    console.log('🔄 Fetching compliance dashboard');
    
    try {
      const params = new URLSearchParams({ organizationId });
      if (timeRange) params.append('timeRange', timeRange);

      const dashboard = await this.makeRequest<any>(`/enterprise/compliance/dashboard?${params.toString()}`);
      console.log('✅ Compliance dashboard fetched');
      return dashboard;
    } catch (error) {
      console.error('❌ Failed to fetch compliance dashboard:', error);
      throw error;
    }
  }

  async generateComplianceReport(organizationId: string, params: {
    type: 'summary' | 'detailed' | 'executive' | 'technical';
    frameworks?: string[];
    timeRange: { start: string; end: string };
    includeFindings: boolean;
    includeRecommendations: boolean;
    format: 'pdf' | 'docx' | 'html' | 'json';
  }): Promise<string> {
    console.log('🔄 Generating compliance report');
    
    try {
      const result = await this.makeRequest<{ downloadUrl: string }>('/enterprise/compliance/reports', {
        method: 'POST',
        body: JSON.stringify({ organizationId, ...params }),
      });

      console.log('✅ Compliance report generated');
      return result.downloadUrl;
    } catch (error) {
      console.error('❌ Failed to generate compliance report:', error);
      throw error;
    }
  }

  async scheduleAutomatedCheck(organizationId: string, check: {
    name: string;
    type: 'control_test' | 'data_scan' | 'access_review' | 'log_analysis';
    schedule: string;
    parameters: Record<string, any>;
    notifications: {
      success: string[];
      failure: string[];
      warnings: string[];
    };
  }): Promise<{
    checkId: string;
    nextRun: string;
    status: 'scheduled' | 'active' | 'paused';
  }> {
    console.log('🔄 Scheduling automated check:', check.name);
    
    try {
      const result = await this.makeRequest<any>('/enterprise/compliance/automated-checks', {
        method: 'POST',
        body: JSON.stringify({ organizationId, ...check }),
      });

      console.log('✅ Automated check scheduled');
      return result;
    } catch (error) {
      console.error('❌ Failed to schedule automated check:', error);
      throw error;
    }
  }

  // Utility Methods
  async validateCompliance(organizationId: string, frameworkId: string): Promise<{
    valid: boolean;
    score: number;
    gaps: {
      requirement: string;
      severity: string;
      description: string;
      remediation: string;
    }[];
    recommendations: string[];
    nextSteps: string[];
  }> {
    console.log('🔄 Validating compliance:', frameworkId);
    
    try {
      const validation = await this.makeRequest<any>('/enterprise/compliance/validate', {
        method: 'POST',
        body: JSON.stringify({ organizationId, frameworkId }),
      });

      console.log('✅ Compliance validation completed');
      return validation;
    } catch (error) {
      console.error('❌ Failed to validate compliance:', error);
      throw error;
    }
  }

  async exportComplianceData(organizationId: string, format: 'json' | 'xml' | 'csv', scope?: string[]): Promise<string> {
    console.log('🔄 Exporting compliance data');
    
    try {
      const result = await this.makeRequest<{ downloadUrl: string }>('/enterprise/compliance/export', {
        method: 'POST',
        body: JSON.stringify({ organizationId, format, scope }),
      });

      console.log('✅ Compliance data export ready');
      return result.downloadUrl;
    } catch (error) {
      console.error('❌ Failed to export compliance data:', error);
      throw error;
    }
  }
}

export const complianceService = new ComplianceService();
export default complianceService;