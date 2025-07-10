// Universal Push Notification Service for cross-platform notifications
import { platformDetection } from '@/utils/crossPlatformStorage';
import { pwaService } from './pwaService';

export interface NotificationPayload {
  id: string;
  title: string;
  body: string;
  icon?: string;
  image?: string;
  badge?: string;
  tag?: string;
  data?: any;
  actions?: NotificationAction[];
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
  timestamp?: number;
  url?: string;
  priority?: 'low' | 'normal' | 'high';
  category?: 'stream' | 'system' | 'social' | 'update';
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface NotificationSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  expirationTime?: number;
}

export interface NotificationSettings {
  enabled: boolean;
  web: boolean;
  desktop: boolean;
  mobile: boolean;
  sound: boolean;
  vibration: boolean;
  streamStarted: boolean;
  streamEnded: boolean;
  newFollower: boolean;
  chatMention: boolean;
  systemUpdates: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string;   // HH:mm format
  };
}

class UniversalNotificationService {
  private settings: NotificationSettings;
  private subscription: NotificationSubscription | null = null;
  private registeredStreams: Set<string> = new Set();
  private notificationQueue: NotificationPayload[] = [];
  private isOnline: boolean = true;

  constructor() {
    this.settings = this.getDefaultSettings();
    this.init();
  }

  private getDefaultSettings(): NotificationSettings {
    return {
      enabled: true,
      web: true,
      desktop: true,
      mobile: true,
      sound: true,
      vibration: true,
      streamStarted: true,
      streamEnded: false,
      newFollower: true,
      chatMention: true,
      systemUpdates: true,
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00',
      },
    };
  }

  private async init() {
    await this.loadSettings();
    this.setupEventListeners();
    
    if (this.settings.enabled) {
      await this.requestPermission();
      await this.setupPushSubscription();
    }
    
    console.log('Universal Notification Service initialized');
  }

  private async loadSettings() {
    try {
      const saved = localStorage.getItem('notification-settings');
      if (saved) {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  }

  private async saveSettings() {
    try {
      localStorage.setItem('notification-settings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  }

  private setupEventListeners() {
    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.processQueuedNotifications();
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
      });
    }

    // Listen for PWA events
    if (typeof window !== 'undefined') {
      window.addEventListener('pwa-visible', () => {
        this.handleAppVisible();
      });

      window.addEventListener('pwa-hidden', () => {
        this.handleAppHidden();
      });
    }
  }

  // Public methods

  public async requestPermission(): Promise<boolean> {
    if (!this.isNotificationSupported()) {
      console.log('Notifications not supported');
      return false;
    }

    // For web/PWA
    if (platformDetection.isWeb || platformDetection.isBrowser) {
      return await pwaService.requestNotificationPermission();
    }

    // For Electron desktop
    if (platformDetection.isElectron && typeof window !== 'undefined') {
      const electron = (window as any).electron;
      if (electron && electron.notification) {
        // Electron handles permissions automatically
        return true;
      }
    }

    // For React Native mobile
    if (platformDetection.isMobile) {
      // This would integrate with react-native push notification library
      return true;
    }

    return false;
  }

  public async showNotification(payload: NotificationPayload): Promise<void> {
    if (!this.settings.enabled) {
      console.log('Notifications disabled');
      return;
    }

    if (this.isInQuietHours()) {
      console.log('In quiet hours, queuing notification');
      this.notificationQueue.push(payload);
      return;
    }

    if (!this.shouldShowNotification(payload)) {
      return;
    }

    try {
      await this.sendNotification(payload);
    } catch (error) {
      console.error('Error showing notification:', error);
      this.notificationQueue.push(payload);
    }
  }

  private async sendNotification(payload: NotificationPayload): Promise<void> {
    const options: NotificationOptions = {
      body: payload.body,
      icon: payload.icon || '/assets/images/icon-192x192.png',
      badge: payload.badge || '/assets/images/icon-96x96.png',
      image: payload.image,
      tag: payload.tag || payload.id,
      data: {
        ...payload.data,
        id: payload.id,
        url: payload.url,
        timestamp: payload.timestamp || Date.now(),
      },
      requireInteraction: payload.requireInteraction || false,
      silent: payload.silent || !this.settings.sound,
      vibrate: this.settings.vibration ? (payload.vibrate || [100, 50, 100]) : [],
      actions: payload.actions,
    };

    // Platform-specific notification sending
    if (platformDetection.isWeb || platformDetection.isBrowser) {
      await this.sendWebNotification(payload.title, options);
    } else if (platformDetection.isElectron) {
      await this.sendDesktopNotification(payload.title, options);
    } else if (platformDetection.isMobile) {
      await this.sendMobileNotification(payload.title, options);
    }
  }

  private async sendWebNotification(title: string, options: NotificationOptions): Promise<void> {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      // Use service worker for better notification management
      await pwaService.showNotification(title, options);
    } else {
      // Fallback to regular notification
      new Notification(title, options);
    }
  }

  private async sendDesktopNotification(title: string, options: NotificationOptions): Promise<void> {
    if (typeof window !== 'undefined' && (window as any).electron) {
      const electron = (window as any).electron;
      await electron.notification.show({
        title,
        body: options.body,
        icon: options.icon,
        silent: options.silent,
      });
    } else {
      // Fallback to web notification
      await this.sendWebNotification(title, options);
    }
  }

  private async sendMobileNotification(title: string, options: NotificationOptions): Promise<void> {
    // This would integrate with react-native push notifications
    // For now, we'll use web notification as fallback
    await this.sendWebNotification(title, options);
  }

  public async setupPushSubscription(): Promise<void> {
    if (!this.settings.enabled || !platformDetection.isWeb) {
      return;
    }

    try {
      const subscription = await pwaService.subscribeToPushNotifications();
      if (subscription) {
        this.subscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.getKey('p256dh') ? 
              btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))) : '',
            auth: subscription.getKey('auth') ? 
              btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!))) : '',
          },
          expirationTime: subscription.expirationTime || undefined,
        };

        // Send subscription to server
        await this.sendSubscriptionToServer(this.subscription);
      }
    } catch (error) {
      console.error('Error setting up push subscription:', error);
    }
  }

  private async sendSubscriptionToServer(subscription: NotificationSubscription): Promise<void> {
    // This would send the subscription to your backend server
    try {
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription,
          settings: this.settings,
          platform: platformDetection.isWeb ? 'web' : 
                   platformDetection.isElectron ? 'desktop' : 'mobile',
        }),
      });

      if (response.ok) {
        console.log('Push subscription sent to server');
      }
    } catch (error) {
      console.error('Error sending subscription to server:', error);
    }
  }

  public async subscribeToStream(streamId: string, platform: string): Promise<void> {
    this.registeredStreams.add(`${platform}:${streamId}`);
    
    // Notify server about stream subscription
    try {
      await fetch('/api/notifications/streams/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          streamId,
          platform,
          subscription: this.subscription,
        }),
      });
    } catch (error) {
      console.error('Error subscribing to stream notifications:', error);
    }
  }

  public async unsubscribeFromStream(streamId: string, platform: string): Promise<void> {
    this.registeredStreams.delete(`${platform}:${streamId}`);
    
    try {
      await fetch('/api/notifications/streams/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          streamId,
          platform,
          subscription: this.subscription,
        }),
      });
    } catch (error) {
      console.error('Error unsubscribing from stream notifications:', error);
    }
  }

  // Predefined notification types
  public async notifyStreamStarted(streamData: any): Promise<void> {
    if (!this.settings.streamStarted) return;

    await this.showNotification({
      id: `stream-started-${streamData.id}`,
      title: `${streamData.streamerName} is now live!`,
      body: streamData.title,
      icon: streamData.profileImage,
      image: streamData.thumbnail,
      tag: `stream-${streamData.id}`,
      category: 'stream',
      url: `/stream/${streamData.id}`,
      actions: [
        {
          action: 'watch',
          title: 'Watch Stream',
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
        },
      ],
      requireInteraction: true,
    });
  }

  public async notifyStreamEnded(streamData: any): Promise<void> {
    if (!this.settings.streamEnded) return;

    await this.showNotification({
      id: `stream-ended-${streamData.id}`,
      title: `${streamData.streamerName} stream ended`,
      body: `Stream lasted ${streamData.duration}`,
      tag: `stream-${streamData.id}`,
      category: 'stream',
      silent: true,
    });
  }

  public async notifyAppUpdate(version: string): Promise<void> {
    if (!this.settings.systemUpdates) return;

    await this.showNotification({
      id: `app-update-${version}`,
      title: 'App Update Available',
      body: `Version ${version} is ready to install`,
      category: 'update',
      actions: [
        {
          action: 'update',
          title: 'Update Now',
        },
        {
          action: 'later',
          title: 'Update Later',
        },
      ],
      requireInteraction: true,
    });
  }

  // Settings management
  public updateSettings(newSettings: Partial<NotificationSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();

    // Update push subscription if needed
    if (newSettings.enabled !== undefined) {
      if (newSettings.enabled) {
        this.setupPushSubscription();
      } else {
        this.disablePushNotifications();
      }
    }
  }

  public getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  private async disablePushNotifications(): Promise<void> {
    if (this.subscription) {
      await pwaService.unsubscribeFromPushNotifications();
      this.subscription = null;
    }
  }

  // Helper methods
  private isNotificationSupported(): boolean {
    return typeof window !== 'undefined' && (
      'Notification' in window ||
      (platformDetection.isElectron && (window as any).electron?.notification) ||
      platformDetection.isMobile
    );
  }

  private shouldShowNotification(payload: NotificationPayload): boolean {
    // Check platform-specific settings
    if (platformDetection.isWeb && !this.settings.web) return false;
    if (platformDetection.isElectron && !this.settings.desktop) return false;
    if (platformDetection.isMobile && !this.settings.mobile) return false;

    // Check category-specific settings
    switch (payload.category) {
      case 'stream':
        return this.settings.streamStarted;
      case 'system':
      case 'update':
        return this.settings.systemUpdates;
      default:
        return true;
    }
  }

  private isInQuietHours(): boolean {
    if (!this.settings.quietHours.enabled) return false;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const start = this.settings.quietHours.start;
    const end = this.settings.quietHours.end;

    // Handle quiet hours that span midnight
    if (start > end) {
      return currentTime >= start || currentTime <= end;
    } else {
      return currentTime >= start && currentTime <= end;
    }
  }

  private async processQueuedNotifications(): Promise<void> {
    if (this.notificationQueue.length === 0) return;

    console.log(`Processing ${this.notificationQueue.length} queued notifications`);

    const notifications = [...this.notificationQueue];
    this.notificationQueue = [];

    for (const notification of notifications) {
      try {
        await this.sendNotification(notification);
        // Add delay to avoid spam
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error('Error processing queued notification:', error);
        // Re-queue if still failing
        this.notificationQueue.push(notification);
      }
    }
  }

  private handleAppVisible(): void {
    // Clear notifications when app becomes visible
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CLEAR_NOTIFICATIONS',
      });
    }
  }

  private handleAppHidden(): void {
    // App is hidden, notifications will be more prominent
    console.log('App hidden, notifications will be shown as system notifications');
  }

  // Test notification
  public async testNotification(): Promise<void> {
    await this.showNotification({
      id: `test-${Date.now()}`,
      title: 'Test Notification',
      body: 'This is a test notification from Streamyyy',
      category: 'system',
      actions: [
        {
          action: 'ok',
          title: 'OK',
        },
      ],
    });
  }

  // Cleanup
  public async cleanup(): Promise<void> {
    await this.disablePushNotifications();
    this.notificationQueue = [];
    this.registeredStreams.clear();
  }
}

export const notificationService = new UniversalNotificationService();
export default notificationService;