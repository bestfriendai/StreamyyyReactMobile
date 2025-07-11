// Cross-Platform Authentication Service
import { platformDetection, crossPlatformStorage } from '@/utils/crossPlatformStorage';
import { User, AuthError } from './authService';

export interface AuthSession {
  id: string;
  userId: string;
  deviceId: string;
  platform: 'web' | 'desktop' | 'mobile';
  deviceName: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  lastActiveAt: string;
  isActive: boolean;
  refreshToken?: string;
  accessToken?: string;
  expiresAt?: string;
}

export interface AuthSyncData {
  user: User | null;
  sessions: AuthSession[];
  settings: any;
  layouts: any[];
  preferences: any;
  lastSyncTime: string;
  deviceId: string;
  platform: string;
}

export interface DeviceInfo {
  deviceId: string;
  platform: 'web' | 'desktop' | 'mobile';
  deviceName: string;
  userAgent?: string;
  os?: string;
  browser?: string;
  version?: string;
}

class CrossPlatformAuthService {
  private currentSession: AuthSession | null = null;
  private activeSessions: AuthSession[] = [];
  private deviceInfo: DeviceInfo;
  private syncInterval: NodeJS.Timeout | null = null;
  private lastSyncTime: string | null = null;

  constructor() {
    this.deviceInfo = this.generateDeviceInfo();
    this.init();
  }

  private async init() {
    await this.loadLocalSession();
    await this.validateSession();
    this.startPeriodicSync();
    
    console.log('Cross-Platform Auth Service initialized');
  }

  private generateDeviceInfo(): DeviceInfo {
    const deviceId = this.generateDeviceId();
    const platform = platformDetection.isWeb ? 'web' : 
                    platformDetection.isElectron ? 'desktop' : 'mobile';
    
    let deviceName = 'Unknown Device';
    let os = 'Unknown';
    let browser = 'Unknown';
    
    if (typeof window !== 'undefined' && navigator) {
      const userAgent = navigator.userAgent;
      
      // Detect OS
      if (userAgent.includes('Mac OS X')) {
        os = 'macOS';
        deviceName = 'Mac';
      } else if (userAgent.includes('Windows')) {
        os = 'Windows';
        deviceName = 'PC';
      } else if (userAgent.includes('Linux')) {
        os = 'Linux';
        deviceName = 'Linux PC';
      } else if (userAgent.includes('iPhone')) {
        os = 'iOS';
        deviceName = 'iPhone';
      } else if (userAgent.includes('iPad')) {
        os = 'iOS';
        deviceName = 'iPad';
      } else if (userAgent.includes('Android')) {
        os = 'Android';
        deviceName = 'Android Device';
      }
      
      // Detect browser
      if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
        browser = 'Chrome';
      } else if (userAgent.includes('Firefox')) {
        browser = 'Firefox';
      } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
        browser = 'Safari';
      } else if (userAgent.includes('Edg')) {
        browser = 'Edge';
      }
      
      // Adjust device name for web
      if (platform === 'web') {
        deviceName = `${browser} on ${os}`;
      } else if (platform === 'desktop') {
        deviceName = `Streamyyy Desktop on ${os}`;
      }
    }

    return {
      deviceId,
      platform,
      deviceName,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      os,
      browser,
      version: '1.0.0',
    };
  }

  private generateDeviceId(): string {
    const stored = localStorage.getItem('device-id');
    if (stored) {
      return stored;
    }

    const platform = platformDetection.isWeb ? 'web' : 
                    platformDetection.isElectron ? 'desktop' : 'mobile';
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    const deviceId = `${platform}-${timestamp}-${random}`;
    
    localStorage.setItem('device-id', deviceId);
    return deviceId;
  }

  private async loadLocalSession(): Promise<void> {
    try {
      const sessionData = await crossPlatformStorage.getItem('auth-session');
      if (sessionData) {
        const session = JSON.parse(sessionData);
        if (this.isSessionValid(session)) {
          this.currentSession = session;
        }
      }
    } catch (error) {
      console.error('Error loading local session:', error);
    }
  }

  private async saveLocalSession(session: AuthSession | null): Promise<void> {
    try {
      if (session) {
        await crossPlatformStorage.setItem('auth-session', JSON.stringify(session));
      } else {
        await crossPlatformStorage.removeItem('auth-session');
      }
    } catch (error) {
      console.error('Error saving local session:', error);
    }
  }

  private isSessionValid(session: AuthSession): boolean {
    if (!session || !session.expiresAt) {
      return false;
    }
    
    const expiryTime = new Date(session.expiresAt);
    const now = new Date();
    
    return expiryTime > now;
  }

  private async validateSession(): Promise<boolean> {
    if (!this.currentSession) {
      return false;
    }

    try {
      const response = await fetch('/api/auth/validate-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.currentSession.accessToken}`,
        },
        body: JSON.stringify({
          sessionId: this.currentSession.id,
          deviceId: this.deviceInfo.deviceId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        this.currentSession = { ...this.currentSession, ...data.session };
        await this.saveLocalSession(this.currentSession);
        return true;
      } else {
        // Session invalid, clear it
        await this.signOut();
        return false;
      }
    } catch (error) {
      console.error('Error validating session:', error);
      return false;
    }
  }

  // Public methods

  public async signIn(credentials: {
    email: string;
    password: string;
    platform?: string;
  }): Promise<{ user: User | null; error: AuthError | null; session: AuthSession | null }> {
    try {
      const response = await fetch('/api/auth/sign-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...credentials,
          deviceInfo: this.deviceInfo,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        this.currentSession = data.session;
        await this.saveLocalSession(this.currentSession);
        await this.syncAuthData();
        
        return {
          user: data.user,
          error: null,
          session: data.session,
        };
      } else {
        return {
          user: null,
          error: data.error,
          session: null,
        };
      }
    } catch (error) {
      return {
        user: null,
        error: {
          message: error instanceof Error ? error.message : 'Sign in failed',
          type: 'network',
        },
        session: null,
      };
    }
  }

  public async signOut(allDevices: boolean = false): Promise<void> {
    try {
      if (this.currentSession) {
        await fetch('/api/auth/sign-out', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.currentSession.accessToken}`,
          },
          body: JSON.stringify({
            sessionId: this.currentSession.id,
            allDevices,
            deviceId: this.deviceInfo.deviceId,
          }),
        });
      }
    } catch (error) {
      console.error('Error during sign out:', error);
    } finally {
      this.currentSession = null;
      await this.saveLocalSession(null);
      await this.clearLocalData();
      this.stopPeriodicSync();
    }
  }

  public async refreshToken(): Promise<boolean> {
    if (!this.currentSession?.refreshToken) {
      return false;
    }

    try {
      const response = await fetch('/api/auth/refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: this.currentSession.refreshToken,
          deviceId: this.deviceInfo.deviceId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        this.currentSession = { ...this.currentSession, ...data.session };
        await this.saveLocalSession(this.currentSession);
        return true;
      } else {
        await this.signOut();
        return false;
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
  }

  public async getActiveSessions(): Promise<AuthSession[]> {
    if (!this.currentSession) {
      return [];
    }

    try {
      const response = await fetch('/api/auth/sessions', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.currentSession.accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        this.activeSessions = data.sessions;
        return this.activeSessions;
      }
    } catch (error) {
      console.error('Error fetching active sessions:', error);
    }

    return [];
  }

  public async revokeSession(sessionId: string): Promise<boolean> {
    if (!this.currentSession) {
      return false;
    }

    try {
      const response = await fetch(`/api/auth/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.currentSession.accessToken}`,
        },
      });

      if (response.ok) {
        this.activeSessions = this.activeSessions.filter(s => s.id !== sessionId);
        return true;
      }
    } catch (error) {
      console.error('Error revoking session:', error);
    }

    return false;
  }

  public async syncAuthData(): Promise<void> {
    if (!this.currentSession) {
      return;
    }

    try {
      // Upload local data to server
      const localData = await this.gatherLocalData();
      
      const uploadResponse = await fetch('/api/auth/sync/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.currentSession.accessToken}`,
        },
        body: JSON.stringify({
          deviceId: this.deviceInfo.deviceId,
          platform: this.deviceInfo.platform,
          data: localData,
          lastSyncTime: this.lastSyncTime,
        }),
      });

      if (uploadResponse.ok) {
        // Download latest data from server
        const downloadResponse = await fetch('/api/auth/sync/download', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.currentSession.accessToken}`,
          },
        });

        if (downloadResponse.ok) {
          const syncData: AuthSyncData = await downloadResponse.json();
          await this.applySync(syncData);
          this.lastSyncTime = new Date().toISOString();
          
          console.log('Auth data synced successfully');
        }
      }
    } catch (error) {
      console.error('Error syncing auth data:', error);
    }
  }

  private async gatherLocalData(): Promise<any> {
    try {
      const [settings, layouts, preferences] = await Promise.all([
        crossPlatformStorage.getItem('streamyyy-cross-platform-storage'),
        crossPlatformStorage.getItem('saved-layouts'),
        crossPlatformStorage.getItem('user-preferences'),
      ]);

      return {
        settings: settings ? JSON.parse(settings) : null,
        layouts: layouts ? JSON.parse(layouts) : [],
        preferences: preferences ? JSON.parse(preferences) : {},
        deviceInfo: this.deviceInfo,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error gathering local data:', error);
      return {};
    }
  }

  private async applySync(syncData: AuthSyncData): Promise<void> {
    try {
      // Merge data intelligently based on timestamps and platform priority
      const mergedData = await this.mergeAuthData(syncData);
      
      // Apply merged data to local storage
      if (mergedData.settings) {
        await crossPlatformStorage.setItem(
          'streamyyy-cross-platform-storage',
          JSON.stringify(mergedData.settings)
        );
      }

      if (mergedData.layouts) {
        await crossPlatformStorage.setItem(
          'saved-layouts',
          JSON.stringify(mergedData.layouts)
        );
      }

      if (mergedData.preferences) {
        await crossPlatformStorage.setItem(
          'user-preferences',
          JSON.stringify(mergedData.preferences)
        );
      }

      // Trigger UI updates
      window.dispatchEvent(new CustomEvent('auth-sync-complete', {
        detail: { syncData: mergedData }
      }));

    } catch (error) {
      console.error('Error applying sync data:', error);
    }
  }

  private async mergeAuthData(serverData: AuthSyncData): Promise<any> {
    const localData = await this.gatherLocalData();
    
    // Simple merge strategy - server wins for most cases
    // In a real implementation, you'd have more sophisticated conflict resolution
    return {
      settings: this.mergeObjects(localData.settings, serverData.settings),
      layouts: this.mergeArrays(localData.layouts, serverData.layouts, 'id'),
      preferences: this.mergeObjects(localData.preferences, serverData.preferences),
    };
  }

  private mergeObjects(local: any, server: any): any {
    if (!local) return server;
    if (!server) return local;
    
    // Merge with server taking precedence for most fields
    return {
      ...local,
      ...server,
      // Keep local device-specific settings
      deviceSettings: local.deviceSettings,
    };
  }

  private mergeArrays(local: any[], server: any[], idField: string): any[] {
    if (!local) return server || [];
    if (!server) return local;
    
    const merged = [...server];
    const serverIds = new Set(server.map((item: any) => item[idField]));
    
    // Add local items that aren't on server
    local.forEach(localItem => {
      if (!serverIds.has(localItem[idField])) {
        merged.push(localItem);
      }
    });
    
    return merged;
  }

  private async clearLocalData(): Promise<void> {
    try {
      await Promise.all([
        crossPlatformStorage.removeItem('auth-session'),
        crossPlatformStorage.removeItem('streamyyy-cross-platform-storage'),
        crossPlatformStorage.removeItem('saved-layouts'),
        crossPlatformStorage.removeItem('user-preferences'),
      ]);
    } catch (error) {
      console.error('Error clearing local data:', error);
    }
  }

  private startPeriodicSync(): void {
    // Sync every 5 minutes if authenticated
    this.syncInterval = setInterval(() => {
      if (this.currentSession) {
        this.syncAuthData();
      }
    }, 5 * 60 * 1000);
  }

  private stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Getters
  public getCurrentSession(): AuthSession | null {
    return this.currentSession;
  }

  public getDeviceInfo(): DeviceInfo {
    return this.deviceInfo;
  }

  public isSignedIn(): boolean {
    return this.currentSession !== null && this.isSessionValid(this.currentSession);
  }

  public getActiveSessions(): AuthSession[] {
    return this.activeSessions;
  }

  // Cross-platform specific methods
  public async enableCrossPlatformSync(): Promise<boolean> {
    if (!this.currentSession) {
      return false;
    }

    try {
      const response = await fetch('/api/auth/sync/enable', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.currentSession.accessToken}`,
        },
        body: JSON.stringify({
          deviceId: this.deviceInfo.deviceId,
          platform: this.deviceInfo.platform,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error enabling cross-platform sync:', error);
      return false;
    }
  }

  public async disableCrossPlatformSync(): Promise<boolean> {
    if (!this.currentSession) {
      return false;
    }

    try {
      const response = await fetch('/api/auth/sync/disable', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.currentSession.accessToken}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Error disabling cross-platform sync:', error);
      return false;
    }
  }

  public async transferSession(targetPlatform: string): Promise<string | null> {
    if (!this.currentSession) {
      return null;
    }

    try {
      const response = await fetch('/api/auth/transfer-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.currentSession.accessToken}`,
        },
        body: JSON.stringify({
          targetPlatform,
          sourceDeviceId: this.deviceInfo.deviceId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.transferCode; // QR code or link for other device
      }
    } catch (error) {
      console.error('Error transferring session:', error);
    }

    return null;
  }

  public async acceptTransferredSession(transferCode: string): Promise<boolean> {
    try {
      const response = await fetch('/api/auth/accept-transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transferCode,
          deviceInfo: this.deviceInfo,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        this.currentSession = data.session;
        await this.saveLocalSession(this.currentSession);
        await this.syncAuthData();
        return true;
      }
    } catch (error) {
      console.error('Error accepting transferred session:', error);
    }

    return false;
  }

  // Cleanup
  public cleanup(): void {
    this.stopPeriodicSync();
  }
}

export const crossPlatformAuthService = new CrossPlatformAuthService();
export default crossPlatformAuthService;