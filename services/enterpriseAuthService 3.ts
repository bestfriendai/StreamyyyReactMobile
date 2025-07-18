import { authService, User } from './authService';
import { databaseService } from './databaseService';

export interface EnterpriseUser extends User {
  role: 'admin' | 'moderator' | 'content_manager' | 'analytics_viewer' | 'user';
  permissions: Permission[];
  department?: string;
  organizationId?: string;
  managerId?: string;
  lastLogin?: string;
  loginCount?: number;
  isActive: boolean;
  ssoProvider?: string;
  ssoId?: string;
  failedLoginAttempts?: number;
  lockedUntil?: string;
  twoFactorEnabled?: boolean;
  profileCompleteness?: number;
  complianceStatus?: 'compliant' | 'non_compliant' | 'under_review';
  dataRetentionPolicy?: 'standard' | 'extended' | 'minimal';
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'execute';
  scope: 'global' | 'organization' | 'department' | 'own';
  conditions?: Record<string, any>;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isCustom: boolean;
  organizationId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  domain: string;
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  customCss?: string;
  subscriptionTier: 'enterprise' | 'business' | 'team';
  maxUsers: number;
  currentUsers: number;
  features: string[];
  settings: OrganizationSettings;
  createdAt: string;
  isActive: boolean;
  ssoConfig?: SSOConfig;
  complianceConfig?: ComplianceConfig;
}

export interface OrganizationSettings {
  requireTwoFactor: boolean;
  passwordPolicy: PasswordPolicy;
  sessionTimeout: number;
  allowedDomains: string[];
  blockedDomains: string[];
  defaultRole: string;
  approvalWorkflow: boolean;
  auditLogging: boolean;
  dataRetentionDays: number;
  allowPersonalAccounts: boolean;
  requireProfileCompletion: boolean;
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSymbols: boolean;
  prohibitCommonPasswords: boolean;
  maxAge: number;
  preventReuse: number;
}

export interface SSOConfig {
  provider: 'saml' | 'oidc' | 'oauth2' | 'ldap';
  entityId: string;
  loginUrl: string;
  logoutUrl: string;
  certificateFingerprint: string;
  attributeMapping: Record<string, string>;
  isActive: boolean;
  autoProvisioning: boolean;
  defaultRole: string;
}

export interface ComplianceConfig {
  gdprEnabled: boolean;
  coppaEnabled: boolean;
  hipaEnabled: boolean;
  soxEnabled: boolean;
  dataProcessingPurposes: string[];
  consentRequired: boolean;
  rightToErasure: boolean;
  dataPortability: boolean;
  auditRetentionDays: number;
  anonymizationEnabled: boolean;
}

export interface SessionInfo {
  id: string;
  userId: string;
  deviceId: string;
  ipAddress: string;
  userAgent: string;
  location?: string;
  isActive: boolean;
  createdAt: string;
  lastActivity: string;
  expiresAt: string;
  loginMethod: 'password' | 'sso' | 'oauth' | 'biometric';
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'authentication' | 'authorization' | 'data_access' | 'data_modification' | 'system' | 'security';
}

class EnterpriseAuthService {
  private readonly baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.streammulti.com';
  private auditBuffer: AuditLog[] = [];
  private readonly auditFlushInterval = 5000; // 5 seconds

  constructor() {
    console.log('Enterprise Auth Service initialized');
    this.startAuditBufferFlush();
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
      console.error(`Enterprise API request failed: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Enterprise API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // User Management
  async createEnterpriseUser(userData: Omit<EnterpriseUser, 'id' | 'created_at' | 'updated_at'>): Promise<EnterpriseUser> {
    console.log('🔄 Creating enterprise user:', userData.email);
    
    try {
      const user = await this.makeRequest<EnterpriseUser>('/enterprise/users', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      await this.logActivity('user_created', 'user', user.id, {
        role: user.role,
        email: user.email,
        organization: user.organizationId,
      });

      console.log('✅ Enterprise user created:', user.email);
      return user;
    } catch (error) {
      console.error('❌ Failed to create enterprise user:', error);
      throw error;
    }
  }

  async updateUserRole(userId: string, roleId: string, actorId: string): Promise<EnterpriseUser> {
    console.log('🔄 Updating user role:', userId, 'to', roleId);
    
    try {
      const user = await this.makeRequest<EnterpriseUser>(`/enterprise/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ roleId, actorId }),
      });

      await this.logActivity('role_updated', 'user', userId, {
        newRole: roleId,
        actor: actorId,
      });

      console.log('✅ User role updated:', userId);
      return user;
    } catch (error) {
      console.error('❌ Failed to update user role:', error);
      throw error;
    }
  }

  async getEnterpriseUsers(organizationId?: string, filters?: {
    role?: string;
    department?: string;
    isActive?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<EnterpriseUser[]> {
    console.log('🔄 Fetching enterprise users');
    
    try {
      const params = new URLSearchParams();
      if (organizationId) params.append('organizationId', organizationId);
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) params.append(key, value.toString());
        });
      }

      const users = await this.makeRequest<EnterpriseUser[]>(`/enterprise/users?${params.toString()}`);
      console.log('✅ Fetched enterprise users:', users.length);
      return users;
    } catch (error) {
      console.error('❌ Failed to fetch enterprise users:', error);
      throw error;
    }
  }

  async suspendUser(userId: string, reason: string, actorId: string): Promise<void> {
    console.log('🔄 Suspending user:', userId);
    
    try {
      await this.makeRequest(`/enterprise/users/${userId}/suspend`, {
        method: 'POST',
        body: JSON.stringify({ reason, actorId }),
      });

      await this.logActivity('user_suspended', 'user', userId, {
        reason,
        actor: actorId,
      });

      console.log('✅ User suspended:', userId);
    } catch (error) {
      console.error('❌ Failed to suspend user:', error);
      throw error;
    }
  }

  // Permission Management
  async checkPermission(userId: string, resource: string, action: string, context?: Record<string, any>): Promise<boolean> {
    console.log('🔄 Checking permission:', userId, resource, action);
    
    try {
      const result = await this.makeRequest<{ allowed: boolean }>('/enterprise/permissions/check', {
        method: 'POST',
        body: JSON.stringify({ userId, resource, action, context }),
      });

      console.log('✅ Permission check result:', result.allowed);
      return result.allowed;
    } catch (error) {
      console.error('❌ Failed to check permission:', error);
      return false;
    }
  }

  async getUserPermissions(userId: string): Promise<Permission[]> {
    console.log('🔄 Fetching user permissions:', userId);
    
    try {
      const permissions = await this.makeRequest<Permission[]>(`/enterprise/users/${userId}/permissions`);
      console.log('✅ Fetched user permissions:', permissions.length);
      return permissions;
    } catch (error) {
      console.error('❌ Failed to fetch user permissions:', error);
      throw error;
    }
  }

  // Role Management
  async createRole(roleData: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>): Promise<Role> {
    console.log('🔄 Creating role:', roleData.name);
    
    try {
      const role = await this.makeRequest<Role>('/enterprise/roles', {
        method: 'POST',
        body: JSON.stringify(roleData),
      });

      await this.logActivity('role_created', 'role', role.id, {
        name: role.name,
        permissions: role.permissions.length,
      });

      console.log('✅ Role created:', role.name);
      return role;
    } catch (error) {
      console.error('❌ Failed to create role:', error);
      throw error;
    }
  }

  async getRoles(organizationId?: string): Promise<Role[]> {
    console.log('🔄 Fetching roles');
    
    try {
      const params = organizationId ? `?organizationId=${organizationId}` : '';
      const roles = await this.makeRequest<Role[]>(`/enterprise/roles${params}`);
      console.log('✅ Fetched roles:', roles.length);
      return roles;
    } catch (error) {
      console.error('❌ Failed to fetch roles:', error);
      throw error;
    }
  }

  // Organization Management
  async getOrganization(organizationId: string): Promise<Organization> {
    console.log('🔄 Fetching organization:', organizationId);
    
    try {
      const organization = await this.makeRequest<Organization>(`/enterprise/organizations/${organizationId}`);
      console.log('✅ Fetched organization:', organization.name);
      return organization;
    } catch (error) {
      console.error('❌ Failed to fetch organization:', error);
      throw error;
    }
  }

  async updateOrganizationSettings(organizationId: string, settings: Partial<OrganizationSettings>): Promise<Organization> {
    console.log('🔄 Updating organization settings:', organizationId);
    
    try {
      const organization = await this.makeRequest<Organization>(`/enterprise/organizations/${organizationId}/settings`, {
        method: 'PUT',
        body: JSON.stringify(settings),
      });

      await this.logActivity('organization_settings_updated', 'organization', organizationId, {
        updatedSettings: Object.keys(settings),
      });

      console.log('✅ Organization settings updated:', organizationId);
      return organization;
    } catch (error) {
      console.error('❌ Failed to update organization settings:', error);
      throw error;
    }
  }

  // SSO Management
  async configureSSOProvider(organizationId: string, config: SSOConfig): Promise<void> {
    console.log('🔄 Configuring SSO provider:', config.provider);
    
    try {
      await this.makeRequest(`/enterprise/organizations/${organizationId}/sso`, {
        method: 'POST',
        body: JSON.stringify(config),
      });

      await this.logActivity('sso_configured', 'organization', organizationId, {
        provider: config.provider,
        autoProvisioning: config.autoProvisioning,
      });

      console.log('✅ SSO provider configured:', config.provider);
    } catch (error) {
      console.error('❌ Failed to configure SSO provider:', error);
      throw error;
    }
  }

  async authenticateWithSSO(organizationId: string, ssoToken: string): Promise<EnterpriseUser> {
    console.log('🔄 Authenticating with SSO:', organizationId);
    
    try {
      const user = await this.makeRequest<EnterpriseUser>('/enterprise/auth/sso', {
        method: 'POST',
        body: JSON.stringify({ organizationId, ssoToken }),
      });

      await this.logActivity('sso_login', 'user', user.id, {
        provider: user.ssoProvider,
        organization: organizationId,
      });

      console.log('✅ SSO authentication successful:', user.email);
      return user;
    } catch (error) {
      console.error('❌ Failed to authenticate with SSO:', error);
      throw error;
    }
  }

  // Session Management
  async getUserSessions(userId: string): Promise<SessionInfo[]> {
    console.log('🔄 Fetching user sessions:', userId);
    
    try {
      const sessions = await this.makeRequest<SessionInfo[]>(`/enterprise/users/${userId}/sessions`);
      console.log('✅ Fetched user sessions:', sessions.length);
      return sessions;
    } catch (error) {
      console.error('❌ Failed to fetch user sessions:', error);
      throw error;
    }
  }

  async terminateSession(sessionId: string, reason: string): Promise<void> {
    console.log('🔄 Terminating session:', sessionId);
    
    try {
      await this.makeRequest(`/enterprise/sessions/${sessionId}/terminate`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });

      await this.logActivity('session_terminated', 'session', sessionId, {
        reason,
      });

      console.log('✅ Session terminated:', sessionId);
    } catch (error) {
      console.error('❌ Failed to terminate session:', error);
      throw error;
    }
  }

  // Audit Logging
  async logActivity(action: string, resource: string, resourceId?: string, details?: Record<string, any>): Promise<void> {
    const auditLog: AuditLog = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: 'system', // TODO: Get current user ID
      action,
      resource,
      resourceId,
      details: details || {},
      ipAddress: '127.0.0.1', // TODO: Get actual IP
      userAgent: 'Enterprise Service',
      timestamp: new Date().toISOString(),
      severity: this.getSeverityLevel(action),
      category: this.getCategoryForAction(action),
    };

    this.auditBuffer.push(auditLog);
    console.log('📊 Audit log queued:', action, resource);
  }

  private getSeverityLevel(action: string): 'low' | 'medium' | 'high' | 'critical' {
    const criticalActions = ['user_suspended', 'role_deleted', 'organization_deleted', 'sso_configured'];
    const highActions = ['user_created', 'role_created', 'permissions_modified', 'organization_settings_updated'];
    const mediumActions = ['role_updated', 'user_login', 'session_terminated'];
    
    if (criticalActions.includes(action)) return 'critical';
    if (highActions.includes(action)) return 'high';
    if (mediumActions.includes(action)) return 'medium';
    return 'low';
  }

  private getCategoryForAction(action: string): AuditLog['category'] {
    if (action.includes('login') || action.includes('logout') || action.includes('sso')) return 'authentication';
    if (action.includes('permission') || action.includes('role')) return 'authorization';
    if (action.includes('created') || action.includes('updated') || action.includes('deleted')) return 'data_modification';
    if (action.includes('access') || action.includes('view')) return 'data_access';
    if (action.includes('system') || action.includes('config')) return 'system';
    return 'security';
  }

  private async startAuditBufferFlush(): Promise<void> {
    setInterval(async () => {
      if (this.auditBuffer.length > 0) {
        try {
          await this.makeRequest('/enterprise/audit/logs', {
            method: 'POST',
            body: JSON.stringify({ logs: this.auditBuffer }),
          });
          
          console.log('📊 Audit logs flushed:', this.auditBuffer.length);
          this.auditBuffer = [];
        } catch (error) {
          console.error('❌ Failed to flush audit logs:', error);
        }
      }
    }, this.auditFlushInterval);
  }

  async getAuditLogs(filters?: {
    userId?: string;
    action?: string;
    resource?: string;
    severity?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<AuditLog[]> {
    console.log('🔄 Fetching audit logs');
    
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) params.append(key, value.toString());
        });
      }

      const logs = await this.makeRequest<AuditLog[]>(`/enterprise/audit/logs?${params.toString()}`);
      console.log('✅ Fetched audit logs:', logs.length);
      return logs;
    } catch (error) {
      console.error('❌ Failed to fetch audit logs:', error);
      throw error;
    }
  }

  // Compliance Functions
  async exportUserData(userId: string, format: 'json' | 'csv' | 'xml' = 'json'): Promise<string> {
    console.log('🔄 Exporting user data:', userId);
    
    try {
      const response = await this.makeRequest<{ downloadUrl: string }>(`/enterprise/compliance/export/${userId}`, {
        method: 'POST',
        body: JSON.stringify({ format }),
      });

      await this.logActivity('data_exported', 'user', userId, {
        format,
        purpose: 'gdpr_request',
      });

      console.log('✅ User data export ready:', response.downloadUrl);
      return response.downloadUrl;
    } catch (error) {
      console.error('❌ Failed to export user data:', error);
      throw error;
    }
  }

  async deleteUserData(userId: string, reason: string, actorId: string): Promise<void> {
    console.log('🔄 Deleting user data:', userId);
    
    try {
      await this.makeRequest(`/enterprise/compliance/delete/${userId}`, {
        method: 'DELETE',
        body: JSON.stringify({ reason, actorId }),
      });

      await this.logActivity('data_deleted', 'user', userId, {
        reason,
        actor: actorId,
        purpose: 'gdpr_erasure',
      });

      console.log('✅ User data deleted:', userId);
    } catch (error) {
      console.error('❌ Failed to delete user data:', error);
      throw error;
    }
  }

  async anonymizeUserData(userId: string, retainAnalytics: boolean = true): Promise<void> {
    console.log('🔄 Anonymizing user data:', userId);
    
    try {
      await this.makeRequest(`/enterprise/compliance/anonymize/${userId}`, {
        method: 'POST',
        body: JSON.stringify({ retainAnalytics }),
      });

      await this.logActivity('data_anonymized', 'user', userId, {
        retainAnalytics,
        purpose: 'gdpr_anonymization',
      });

      console.log('✅ User data anonymized:', userId);
    } catch (error) {
      console.error('❌ Failed to anonymize user data:', error);
      throw error;
    }
  }

  // Utility Methods
  async healthCheck(): Promise<{ status: 'healthy' | 'degraded' | 'down'; checks: Record<string, boolean> }> {
    console.log('🔄 Performing health check');
    
    try {
      const health = await this.makeRequest<{ status: 'healthy' | 'degraded' | 'down'; checks: Record<string, boolean> }>('/enterprise/health');
      console.log('✅ Health check completed:', health.status);
      return health;
    } catch (error) {
      console.error('❌ Health check failed:', error);
      return { status: 'down', checks: {} };
    }
  }

  async getSystemStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    totalOrganizations: number;
    totalRoles: number;
    totalPermissions: number;
    auditLogsCount: number;
    activeSessions: number;
  }> {
    console.log('🔄 Fetching system stats');
    
    try {
      const stats = await this.makeRequest<any>('/enterprise/stats');
      console.log('✅ Fetched system stats');
      return stats;
    } catch (error) {
      console.error('❌ Failed to fetch system stats:', error);
      throw error;
    }
  }
}

export const enterpriseAuthService = new EnterpriseAuthService();
export default enterpriseAuthService;