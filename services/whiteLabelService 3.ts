export interface BrandingConfig {
  id: string;
  organizationId: string;
  name: string;
  isActive: boolean;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  surfaceColor: string;
  logo: {
    primary: string;
    secondary?: string;
    favicon: string;
    loginBanner?: string;
  };
  typography: {
    primaryFont: string;
    secondaryFont: string;
    headingScale: number;
    bodySize: number;
    lineHeight: number;
  };
  spacing: {
    baseUnit: number;
    scale: number;
  };
  borderRadius: {
    small: number;
    medium: number;
    large: number;
  };
  shadows: {
    light: string;
    medium: string;
    heavy: string;
  };
  customCss?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ThemeVariant {
  id: string;
  name: string;
  description: string;
  brandingConfigId: string;
  colors: {
    primary: Record<string, string>;
    secondary: Record<string, string>;
    accent: Record<string, string>;
    neutral: Record<string, string>;
    semantic: {
      success: Record<string, string>;
      warning: Record<string, string>;
      error: Record<string, string>;
      info: Record<string, string>;
    };
    gradient: Record<string, string[]>;
  };
  components: {
    button: ComponentTheme;
    input: ComponentTheme;
    card: ComponentTheme;
    modal: ComponentTheme;
    navigation: ComponentTheme;
    header: ComponentTheme;
    sidebar: ComponentTheme;
    table: ComponentTheme;
    chart: ComponentTheme;
  };
  animations: {
    duration: Record<string, number>;
    easing: Record<string, string>;
    transitions: Record<string, any>;
  };
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ComponentTheme {
  background: string;
  color: string;
  border: string;
  borderRadius: string;
  padding: string;
  margin: string;
  fontSize: string;
  fontWeight: string;
  boxShadow?: string;
  hover?: Partial<ComponentTheme>;
  active?: Partial<ComponentTheme>;
  disabled?: Partial<ComponentTheme>;
  variants?: Record<string, Partial<ComponentTheme>>;
}

export interface CustomDomain {
  id: string;
  organizationId: string;
  domain: string;
  subdomain?: string;
  isActive: boolean;
  isVerified: boolean;
  sslEnabled: boolean;
  sslCertificate?: {
    issuer: string;
    expiresAt: string;
    status: 'valid' | 'expired' | 'invalid';
  };
  dnsRecords: {
    type: 'A' | 'CNAME' | 'TXT';
    name: string;
    value: string;
    ttl: number;
    verified: boolean;
  }[];
  redirects: {
    from: string;
    to: string;
    statusCode: 301 | 302;
  }[];
  createdAt: string;
  verifiedAt?: string;
}

export interface CustomEmailTemplate {
  id: string;
  organizationId: string;
  type: 'welcome' | 'password_reset' | 'invitation' | 'notification' | 'marketing' | 'system';
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: {
    name: string;
    type: 'string' | 'number' | 'date' | 'boolean' | 'url';
    required: boolean;
    defaultValue?: any;
    description: string;
  }[];
  styling: {
    headerColor: string;
    footerColor: string;
    linkColor: string;
    buttonColor: string;
    fontFamily: string;
    fontSize: string;
    lineHeight: string;
  };
  sender: {
    name: string;
    email: string;
    replyTo?: string;
  };
  isActive: boolean;
  previewUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface WhiteLabelAsset {
  id: string;
  organizationId: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'font' | 'icon';
  category: 'logo' | 'banner' | 'background' | 'icon' | 'illustration' | 'custom';
  name: string;
  description?: string;
  originalUrl: string;
  optimizedUrls: {
    thumbnail: string;
    small: string;
    medium: string;
    large: string;
    original: string;
  };
  metadata: {
    width?: number;
    height?: number;
    fileSize: number;
    mimeType: string;
    format: string;
    duration?: number;
    altText?: string;
  };
  usageRights: {
    license: 'royalty_free' | 'creative_commons' | 'custom' | 'proprietary';
    attribution?: string;
    restrictions?: string[];
  };
  tags: string[];
  isActive: boolean;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomizationPreset {
  id: string;
  name: string;
  description: string;
  category: 'industry' | 'style' | 'purpose' | 'audience';
  preview: {
    thumbnailUrl: string;
    demoUrl: string;
    screenshots: string[];
  };
  configuration: {
    branding: Partial<BrandingConfig>;
    theme: Partial<ThemeVariant>;
    layout: LayoutConfig;
    features: FeatureConfig;
  };
  popularity: number;
  rating: number;
  downloads: number;
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface LayoutConfig {
  navigation: {
    type: 'sidebar' | 'top' | 'hybrid';
    position: 'left' | 'right' | 'top' | 'bottom';
    collapsible: boolean;
    pinned: boolean;
    width: number;
    items: NavigationItem[];
  };
  header: {
    height: number;
    background: string;
    showLogo: boolean;
    showSearch: boolean;
    showNotifications: boolean;
    showProfile: boolean;
    customElements: CustomElement[];
  };
  footer: {
    height: number;
    background: string;
    showCopyright: boolean;
    showLinks: boolean;
    customElements: CustomElement[];
  };
  content: {
    maxWidth: number;
    padding: number;
    gutter: number;
    sidebar: boolean;
    sidebarWidth: number;
  };
}

export interface NavigationItem {
  id: string;
  label: string;
  icon?: string;
  url: string;
  target?: '_self' | '_blank';
  children?: NavigationItem[];
  permissions?: string[];
  order: number;
  isVisible: boolean;
}

export interface CustomElement {
  id: string;
  type: 'text' | 'image' | 'button' | 'link' | 'html' | 'component';
  content: any;
  position: 'left' | 'center' | 'right';
  order: number;
  styling: Record<string, any>;
  conditions?: {
    userRole?: string[];
    userPermissions?: string[];
    deviceType?: string[];
    timeRange?: { start: string; end: string };
  };
}

export interface FeatureConfig {
  modules: {
    [key: string]: {
      enabled: boolean;
      configuration: Record<string, any>;
      permissions: string[];
    };
  };
  integrations: {
    [key: string]: {
      enabled: boolean;
      configuration: Record<string, any>;
      credentials?: Record<string, any>;
    };
  };
  customizations: {
    [key: string]: any;
  };
}

export interface BrandingAssetLibrary {
  logos: WhiteLabelAsset[];
  banners: WhiteLabelAsset[];
  icons: WhiteLabelAsset[];
  backgrounds: WhiteLabelAsset[];
  illustrations: WhiteLabelAsset[];
  fonts: WhiteLabelAsset[];
  colors: {
    id: string;
    name: string;
    hex: string;
    rgb: [number, number, number];
    hsl: [number, number, number];
    category: string;
    tags: string[];
  }[];
  patterns: {
    id: string;
    name: string;
    svg: string;
    category: string;
    variables: Record<string, any>;
  }[];
}

class WhiteLabelService {
  private readonly baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.streammulti.com';
  private readonly cache = new Map<string, { data: any; timestamp: number }>();
  private readonly cacheTimeout = 10 * 60 * 1000; // 10 minutes

  constructor() {
    console.log('White Label Service initialized');
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
      console.error(`White Label API request failed: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`White Label API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Branding Configuration
  async createBrandingConfig(config: Omit<BrandingConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<BrandingConfig> {
    console.log('🔄 Creating branding configuration:', config.name);
    
    try {
      const brandingConfig = await this.makeRequest<BrandingConfig>('/enterprise/white-label/branding', {
        method: 'POST',
        body: JSON.stringify(config),
      });

      console.log('✅ Branding configuration created:', brandingConfig.name);
      return brandingConfig;
    } catch (error) {
      console.error('❌ Failed to create branding configuration:', error);
      throw error;
    }
  }

  async getBrandingConfig(organizationId: string): Promise<BrandingConfig | null> {
    console.log('🔄 Fetching branding configuration');
    
    try {
      const config = await this.makeRequest<BrandingConfig>(`/enterprise/white-label/branding/${organizationId}`);
      console.log('✅ Branding configuration fetched');
      return config;
    } catch (error) {
      if (error.message.includes('404')) {
        return null;
      }
      console.error('❌ Failed to fetch branding configuration:', error);
      throw error;
    }
  }

  async updateBrandingConfig(configId: string, updates: Partial<BrandingConfig>): Promise<BrandingConfig> {
    console.log('🔄 Updating branding configuration:', configId);
    
    try {
      const config = await this.makeRequest<BrandingConfig>(`/enterprise/white-label/branding/${configId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });

      console.log('✅ Branding configuration updated');
      return config;
    } catch (error) {
      console.error('❌ Failed to update branding configuration:', error);
      throw error;
    }
  }

  async previewBrandingConfig(config: Partial<BrandingConfig>): Promise<{
    previewUrl: string;
    screenshots: string[];
    cssVariables: Record<string, string>;
  }> {
    console.log('🔄 Generating branding preview');
    
    try {
      const preview = await this.makeRequest<any>('/enterprise/white-label/branding/preview', {
        method: 'POST',
        body: JSON.stringify(config),
      });

      console.log('✅ Branding preview generated');
      return preview;
    } catch (error) {
      console.error('❌ Failed to generate branding preview:', error);
      throw error;
    }
  }

  // Theme Management
  async createThemeVariant(theme: Omit<ThemeVariant, 'id' | 'createdAt' | 'updatedAt'>): Promise<ThemeVariant> {
    console.log('🔄 Creating theme variant:', theme.name);
    
    try {
      const themeVariant = await this.makeRequest<ThemeVariant>('/enterprise/white-label/themes', {
        method: 'POST',
        body: JSON.stringify(theme),
      });

      console.log('✅ Theme variant created:', themeVariant.name);
      return themeVariant;
    } catch (error) {
      console.error('❌ Failed to create theme variant:', error);
      throw error;
    }
  }

  async getThemeVariants(brandingConfigId: string): Promise<ThemeVariant[]> {
    console.log('🔄 Fetching theme variants');
    
    try {
      const themes = await this.makeRequest<ThemeVariant[]>(`/enterprise/white-label/themes?brandingConfigId=${brandingConfigId}`);
      console.log('✅ Theme variants fetched:', themes.length);
      return themes;
    } catch (error) {
      console.error('❌ Failed to fetch theme variants:', error);
      throw error;
    }
  }

  async updateThemeVariant(themeId: string, updates: Partial<ThemeVariant>): Promise<ThemeVariant> {
    console.log('🔄 Updating theme variant:', themeId);
    
    try {
      const theme = await this.makeRequest<ThemeVariant>(`/enterprise/white-label/themes/${themeId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });

      console.log('✅ Theme variant updated');
      return theme;
    } catch (error) {
      console.error('❌ Failed to update theme variant:', error);
      throw error;
    }
  }

  async generateThemeFromColors(colors: {
    primary: string;
    secondary: string;
    accent: string;
  }): Promise<Partial<ThemeVariant>> {
    console.log('🔄 Generating theme from colors');
    
    try {
      const theme = await this.makeRequest<Partial<ThemeVariant>>('/enterprise/white-label/themes/generate', {
        method: 'POST',
        body: JSON.stringify(colors),
      });

      console.log('✅ Theme generated from colors');
      return theme;
    } catch (error) {
      console.error('❌ Failed to generate theme from colors:', error);
      throw error;
    }
  }

  // Custom Domain Management
  async addCustomDomain(domainData: Omit<CustomDomain, 'id' | 'createdAt' | 'verifiedAt' | 'isVerified' | 'dnsRecords'>): Promise<CustomDomain> {
    console.log('🔄 Adding custom domain:', domainData.domain);
    
    try {
      const domain = await this.makeRequest<CustomDomain>('/enterprise/white-label/domains', {
        method: 'POST',
        body: JSON.stringify(domainData),
      });

      console.log('✅ Custom domain added:', domain.domain);
      return domain;
    } catch (error) {
      console.error('❌ Failed to add custom domain:', error);
      throw error;
    }
  }

  async getCustomDomains(organizationId: string): Promise<CustomDomain[]> {
    console.log('🔄 Fetching custom domains');
    
    try {
      const domains = await this.makeRequest<CustomDomain[]>(`/enterprise/white-label/domains?organizationId=${organizationId}`);
      console.log('✅ Custom domains fetched:', domains.length);
      return domains;
    } catch (error) {
      console.error('❌ Failed to fetch custom domains:', error);
      throw error;
    }
  }

  async verifyCustomDomain(domainId: string): Promise<{
    verified: boolean;
    dnsRecords: CustomDomain['dnsRecords'];
    sslStatus: 'pending' | 'issued' | 'failed';
    issues?: string[];
  }> {
    console.log('🔄 Verifying custom domain:', domainId);
    
    try {
      const verification = await this.makeRequest<any>(`/enterprise/white-label/domains/${domainId}/verify`, {
        method: 'POST',
      });

      console.log('✅ Domain verification completed');
      return verification;
    } catch (error) {
      console.error('❌ Failed to verify custom domain:', error);
      throw error;
    }
  }

  async generateSSLCertificate(domainId: string): Promise<{
    status: 'requested' | 'issued' | 'failed';
    certificateId?: string;
    expiresAt?: string;
    error?: string;
  }> {
    console.log('🔄 Generating SSL certificate:', domainId);
    
    try {
      const ssl = await this.makeRequest<any>(`/enterprise/white-label/domains/${domainId}/ssl`, {
        method: 'POST',
      });

      console.log('✅ SSL certificate generation initiated');
      return ssl;
    } catch (error) {
      console.error('❌ Failed to generate SSL certificate:', error);
      throw error;
    }
  }

  // Asset Management
  async uploadAsset(organizationId: string, file: File, metadata: {
    type: WhiteLabelAsset['type'];
    category: WhiteLabelAsset['category'];
    name: string;
    description?: string;
    tags?: string[];
    altText?: string;
  }): Promise<WhiteLabelAsset> {
    console.log('🔄 Uploading asset:', metadata.name);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('organizationId', organizationId);
      formData.append('metadata', JSON.stringify(metadata));

      const asset = await fetch(`${this.baseUrl}/enterprise/white-label/assets/upload`, {
        method: 'POST',
        body: formData,
      }).then(res => res.json());

      console.log('✅ Asset uploaded:', asset.name);
      return asset;
    } catch (error) {
      console.error('❌ Failed to upload asset:', error);
      throw error;
    }
  }

  async getAssetLibrary(organizationId: string, filters?: {
    type?: WhiteLabelAsset['type'];
    category?: WhiteLabelAsset['category'];
    tags?: string[];
  }): Promise<BrandingAssetLibrary> {
    console.log('🔄 Fetching asset library');
    
    try {
      const params = new URLSearchParams({ organizationId });
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) {
            if (Array.isArray(value)) {
              value.forEach(v => params.append(key, v));
            } else {
              params.append(key, value);
            }
          }
        });
      }

      const library = await this.makeRequest<BrandingAssetLibrary>(`/enterprise/white-label/assets?${params.toString()}`);
      console.log('✅ Asset library fetched');
      return library;
    } catch (error) {
      console.error('❌ Failed to fetch asset library:', error);
      throw error;
    }
  }

  async optimizeAsset(assetId: string, optimizations: {
    formats?: string[];
    sizes?: { name: string; width: number; height: number }[];
    quality?: number;
    compression?: 'lossless' | 'lossy';
  }): Promise<WhiteLabelAsset> {
    console.log('🔄 Optimizing asset:', assetId);
    
    try {
      const asset = await this.makeRequest<WhiteLabelAsset>(`/enterprise/white-label/assets/${assetId}/optimize`, {
        method: 'POST',
        body: JSON.stringify(optimizations),
      });

      console.log('✅ Asset optimized');
      return asset;
    } catch (error) {
      console.error('❌ Failed to optimize asset:', error);
      throw error;
    }
  }

  // Email Template Customization
  async createEmailTemplate(template: Omit<CustomEmailTemplate, 'id' | 'createdAt' | 'updatedAt' | 'previewUrl'>): Promise<CustomEmailTemplate> {
    console.log('🔄 Creating email template:', template.name);
    
    try {
      const emailTemplate = await this.makeRequest<CustomEmailTemplate>('/enterprise/white-label/email-templates', {
        method: 'POST',
        body: JSON.stringify(template),
      });

      console.log('✅ Email template created:', emailTemplate.name);
      return emailTemplate;
    } catch (error) {
      console.error('❌ Failed to create email template:', error);
      throw error;
    }
  }

  async getEmailTemplates(organizationId: string, type?: CustomEmailTemplate['type']): Promise<CustomEmailTemplate[]> {
    console.log('🔄 Fetching email templates');
    
    try {
      const params = new URLSearchParams({ organizationId });
      if (type) params.append('type', type);

      const templates = await this.makeRequest<CustomEmailTemplate[]>(`/enterprise/white-label/email-templates?${params.toString()}`);
      console.log('✅ Email templates fetched:', templates.length);
      return templates;
    } catch (error) {
      console.error('❌ Failed to fetch email templates:', error);
      throw error;
    }
  }

  async previewEmailTemplate(templateId: string, variables?: Record<string, any>): Promise<{
    htmlPreview: string;
    textPreview: string;
    previewUrl: string;
  }> {
    console.log('🔄 Previewing email template:', templateId);
    
    try {
      const preview = await this.makeRequest<any>(`/enterprise/white-label/email-templates/${templateId}/preview`, {
        method: 'POST',
        body: JSON.stringify({ variables }),
      });

      console.log('✅ Email template preview generated');
      return preview;
    } catch (error) {
      console.error('❌ Failed to preview email template:', error);
      throw error;
    }
  }

  async testEmailTemplate(templateId: string, testData: {
    recipient: string;
    variables: Record<string, any>;
  }): Promise<{
    sent: boolean;
    messageId?: string;
    error?: string;
  }> {
    console.log('🔄 Testing email template:', templateId);
    
    try {
      const result = await this.makeRequest<any>(`/enterprise/white-label/email-templates/${templateId}/test`, {
        method: 'POST',
        body: JSON.stringify(testData),
      });

      console.log('✅ Email template test completed');
      return result;
    } catch (error) {
      console.error('❌ Failed to test email template:', error);
      throw error;
    }
  }

  // Customization Presets
  async getCustomizationPresets(filters?: {
    category?: CustomizationPreset['category'];
    industry?: string;
    popular?: boolean;
  }): Promise<CustomizationPreset[]> {
    console.log('🔄 Fetching customization presets');
    
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) params.append(key, value.toString());
        });
      }

      const presets = await this.makeRequest<CustomizationPreset[]>(`/enterprise/white-label/presets?${params.toString()}`);
      console.log('✅ Customization presets fetched:', presets.length);
      return presets;
    } catch (error) {
      console.error('❌ Failed to fetch customization presets:', error);
      throw error;
    }
  }

  async applyCustomizationPreset(organizationId: string, presetId: string, customizations?: Record<string, any>): Promise<{
    brandingConfig: BrandingConfig;
    themeVariant: ThemeVariant;
    appliedSettings: string[];
  }> {
    console.log('🔄 Applying customization preset:', presetId);
    
    try {
      const result = await this.makeRequest<any>('/enterprise/white-label/presets/apply', {
        method: 'POST',
        body: JSON.stringify({ organizationId, presetId, customizations }),
      });

      console.log('✅ Customization preset applied');
      return result;
    } catch (error) {
      console.error('❌ Failed to apply customization preset:', error);
      throw error;
    }
  }

  async createCustomPreset(preset: Omit<CustomizationPreset, 'id' | 'popularity' | 'rating' | 'downloads' | 'createdAt' | 'updatedAt'>): Promise<CustomizationPreset> {
    console.log('🔄 Creating custom preset:', preset.name);
    
    try {
      const customPreset = await this.makeRequest<CustomizationPreset>('/enterprise/white-label/presets', {
        method: 'POST',
        body: JSON.stringify(preset),
      });

      console.log('✅ Custom preset created:', customPreset.name);
      return customPreset;
    } catch (error) {
      console.error('❌ Failed to create custom preset:', error);
      throw error;
    }
  }

  // Layout & Navigation
  async updateLayoutConfig(organizationId: string, layout: LayoutConfig): Promise<void> {
    console.log('🔄 Updating layout configuration');
    
    try {
      await this.makeRequest('/enterprise/white-label/layout', {
        method: 'PUT',
        body: JSON.stringify({ organizationId, layout }),
      });

      console.log('✅ Layout configuration updated');
    } catch (error) {
      console.error('❌ Failed to update layout configuration:', error);
      throw error;
    }
  }

  async getLayoutConfig(organizationId: string): Promise<LayoutConfig | null> {
    console.log('🔄 Fetching layout configuration');
    
    try {
      const layout = await this.makeRequest<LayoutConfig>(`/enterprise/white-label/layout/${organizationId}`);
      console.log('✅ Layout configuration fetched');
      return layout;
    } catch (error) {
      if (error.message.includes('404')) {
        return null;
      }
      console.error('❌ Failed to fetch layout configuration:', error);
      throw error;
    }
  }

  // Feature Configuration
  async updateFeatureConfig(organizationId: string, features: FeatureConfig): Promise<void> {
    console.log('🔄 Updating feature configuration');
    
    try {
      await this.makeRequest('/enterprise/white-label/features', {
        method: 'PUT',
        body: JSON.stringify({ organizationId, features }),
      });

      console.log('✅ Feature configuration updated');
    } catch (error) {
      console.error('❌ Failed to update feature configuration:', error);
      throw error;
    }
  }

  async getFeatureConfig(organizationId: string): Promise<FeatureConfig | null> {
    console.log('🔄 Fetching feature configuration');
    
    try {
      const features = await this.makeRequest<FeatureConfig>(`/enterprise/white-label/features/${organizationId}`);
      console.log('✅ Feature configuration fetched');
      return features;
    } catch (error) {
      if (error.message.includes('404')) {
        return null;
      }
      console.error('❌ Failed to fetch feature configuration:', error);
      throw error;
    }
  }

  // Deployment & Publishing
  async deployConfiguration(organizationId: string, environment: 'staging' | 'production'): Promise<{
    deploymentId: string;
    status: 'pending' | 'building' | 'deploying' | 'completed' | 'failed';
    url: string;
    estimatedTime: number;
  }> {
    console.log('🔄 Deploying configuration to:', environment);
    
    try {
      const deployment = await this.makeRequest<any>('/enterprise/white-label/deploy', {
        method: 'POST',
        body: JSON.stringify({ organizationId, environment }),
      });

      console.log('✅ Deployment initiated:', deployment.deploymentId);
      return deployment;
    } catch (error) {
      console.error('❌ Failed to deploy configuration:', error);
      throw error;
    }
  }

  async getDeploymentStatus(deploymentId: string): Promise<{
    status: 'pending' | 'building' | 'deploying' | 'completed' | 'failed';
    progress: number;
    logs: string[];
    error?: string;
    completedAt?: string;
    url?: string;
  }> {
    console.log('🔄 Checking deployment status:', deploymentId);
    
    try {
      const status = await this.makeRequest<any>(`/enterprise/white-label/deploy/${deploymentId}/status`);
      console.log('✅ Deployment status fetched');
      return status;
    } catch (error) {
      console.error('❌ Failed to fetch deployment status:', error);
      throw error;
    }
  }

  // Export & Backup
  async exportConfiguration(organizationId: string, format: 'json' | 'zip' | 'css'): Promise<string> {
    console.log('🔄 Exporting configuration');
    
    try {
      const result = await this.makeRequest<{ downloadUrl: string }>('/enterprise/white-label/export', {
        method: 'POST',
        body: JSON.stringify({ organizationId, format }),
      });

      console.log('✅ Configuration export ready');
      return result.downloadUrl;
    } catch (error) {
      console.error('❌ Failed to export configuration:', error);
      throw error;
    }
  }

  async importConfiguration(organizationId: string, configFile: File): Promise<{
    imported: boolean;
    warnings: string[];
    errors: string[];
    conflicts: string[];
  }> {
    console.log('🔄 Importing configuration');
    
    try {
      const formData = new FormData();
      formData.append('file', configFile);
      formData.append('organizationId', organizationId);

      const result = await fetch(`${this.baseUrl}/enterprise/white-label/import`, {
        method: 'POST',
        body: formData,
      }).then(res => res.json());

      console.log('✅ Configuration import completed');
      return result;
    } catch (error) {
      console.error('❌ Failed to import configuration:', error);
      throw error;
    }
  }

  clearCache(): void {
    this.cache.clear();
    console.log('✅ White Label cache cleared');
  }
}

export const whiteLabelService = new WhiteLabelService();
export default whiteLabelService;