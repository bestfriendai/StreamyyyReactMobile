// PWA Service for cross-platform Progressive Web App capabilities
import { platformDetection } from '@/utils/crossPlatformStorage';

export interface PWAInstallEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface NotificationPermissionState {
  granted: boolean;
  denied: boolean;
  prompt: boolean;
}

export interface PWAFeatures {
  installable: boolean;
  standalone: boolean;
  notifications: boolean;
  backgroundSync: boolean;
  periodicSync: boolean;
  shareTarget: boolean;
  webShare: boolean;
  offlineSupport: boolean;
}

class PWAService {
  private deferredPrompt: PWAInstallEvent | null = null;
  private swRegistration: ServiceWorkerRegistration | null = null;
  private notificationPermission: NotificationPermissionState = {
    granted: false,
    denied: false,
    prompt: true,
  };

  constructor() {
    this.init();
  }

  private async init() {
    if (!this.isPWASupported()) {
      console.log('PWA features not supported in this environment');
      return;
    }

    await this.registerServiceWorker();
    this.setupEventListeners();
    this.checkNotificationPermission();
    this.setupBackgroundSync();
    
    console.log('PWA Service initialized');
  }

  private isPWASupported(): boolean {
    return typeof window !== 'undefined' && 
           'serviceWorker' in navigator &&
           'caches' in window;
  }

  private async registerServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported');
      return;
    }

    try {
      this.swRegistration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('Service Worker registered successfully');

      // Listen for updates
      this.swRegistration.addEventListener('updatefound', () => {
        const newWorker = this.swRegistration?.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.showUpdateNotification();
            }
          });
        }
      });

    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  private setupEventListeners(): void {
    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (event: Event) => {
      console.log('Install prompt available');
      event.preventDefault();
      this.deferredPrompt = event as PWAInstallEvent;
      this.showInstallBanner();
    });

    // Listen for app installed
    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
      this.deferredPrompt = null;
      this.hideInstallBanner();
      this.trackInstallation();
    });

    // Listen for online/offline events
    window.addEventListener('online', () => {
      console.log('App is online');
      this.handleOnline();
    });

    window.addEventListener('offline', () => {
      console.log('App is offline');
      this.handleOffline();
    });

    // Listen for visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.handleAppVisible();
      } else {
        this.handleAppHidden();
      }
    });
  }

  private checkNotificationPermission(): void {
    if (!('Notification' in window)) {
      console.log('Notifications not supported');
      return;
    }

    const permission = Notification.permission;
    this.notificationPermission = {
      granted: permission === 'granted',
      denied: permission === 'denied',
      prompt: permission === 'default',
    };
  }

  private setupBackgroundSync(): void {
    if (this.swRegistration && 'sync' in this.swRegistration) {
      console.log('Background sync is supported');
      // Register for background sync
      this.swRegistration.sync.register('stream-sync');
    }

    // Set up periodic sync if supported
    if (this.swRegistration && 'periodicSync' in this.swRegistration) {
      console.log('Periodic sync is supported');
      // This would require user permission
      // this.swRegistration.periodicSync.register('stream-updates', {
      //   minInterval: 24 * 60 * 60 * 1000, // 24 hours
      // });
    }
  }

  // Public methods

  public async installApp(): Promise<boolean> {
    if (!this.deferredPrompt) {
      console.log('Install prompt not available');
      return false;
    }

    try {
      await this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
        this.deferredPrompt = null;
        return true;
      } else {
        console.log('User dismissed the install prompt');
        return false;
      }
    } catch (error) {
      console.error('Install prompt failed:', error);
      return false;
    }
  }

  public isInstallable(): boolean {
    return this.deferredPrompt !== null;
  }

  public isStandalone(): boolean {
    return typeof window !== 'undefined' && (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    );
  }

  public async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('Notifications not supported');
      return false;
    }

    if (this.notificationPermission.granted) {
      return true;
    }

    if (this.notificationPermission.denied) {
      console.log('Notifications are blocked');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.checkNotificationPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Notification permission request failed:', error);
      return false;
    }
  }

  public async showNotification(title: string, options: NotificationOptions = {}): Promise<void> {
    if (!this.notificationPermission.granted) {
      console.log('Notification permission not granted');
      return;
    }

    const defaultOptions: NotificationOptions = {
      icon: '/assets/images/icon-192x192.png',
      badge: '/assets/images/icon-96x96.png',
      vibrate: [100, 50, 100],
      requireInteraction: false,
      ...options,
    };

    if (this.swRegistration) {
      // Use service worker to show notification
      await this.swRegistration.showNotification(title, defaultOptions);
    } else {
      // Fallback to regular notification
      new Notification(title, defaultOptions);
    }
  }

  public async subscribeToPushNotifications(): Promise<PushSubscription | null> {
    if (!this.swRegistration) {
      console.log('Service Worker not available');
      return null;
    }

    if (!('PushManager' in window)) {
      console.log('Push notifications not supported');
      return null;
    }

    try {
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlB64ToUint8Array(
          process.env.REACT_APP_VAPID_PUBLIC_KEY || ''
        ),
      });

      console.log('Push subscription successful');
      return subscription;
    } catch (error) {
      console.error('Push subscription failed:', error);
      return null;
    }
  }

  public async unsubscribeFromPushNotifications(): Promise<boolean> {
    if (!this.swRegistration) {
      return false;
    }

    try {
      const subscription = await this.swRegistration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        console.log('Unsubscribed from push notifications');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Unsubscribe failed:', error);
      return false;
    }
  }

  public async shareContent(data: ShareData): Promise<boolean> {
    if (!('share' in navigator)) {
      // Fallback to clipboard API
      return this.copyToClipboard(data.url || data.text || '');
    }

    try {
      await navigator.share(data);
      return true;
    } catch (error) {
      console.error('Share failed:', error);
      return false;
    }
  }

  public async copyToClipboard(text: string): Promise<boolean> {
    if (!navigator.clipboard) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        return successful;
      } catch (error) {
        document.body.removeChild(textArea);
        return false;
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error('Clipboard write failed:', error);
      return false;
    }
  }

  public async cacheUrls(urls: string[]): Promise<void> {
    if (!this.swRegistration) {
      return;
    }

    // Send message to service worker to cache URLs
    navigator.serviceWorker.controller?.postMessage({
      type: 'CACHE_URLS',
      urls,
    });
  }

  public async clearCache(): Promise<void> {
    if (!('caches' in window)) {
      return;
    }

    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('All caches cleared');
    } catch (error) {
      console.error('Cache clearing failed:', error);
    }
  }

  public getPWAFeatures(): PWAFeatures {
    return {
      installable: this.isInstallable(),
      standalone: this.isStandalone(),
      notifications: this.notificationPermission.granted,
      backgroundSync: this.swRegistration ? 'sync' in this.swRegistration : false,
      periodicSync: this.swRegistration ? 'periodicSync' in this.swRegistration : false,
      shareTarget: typeof window !== 'undefined' && 'share' in navigator,
      webShare: typeof window !== 'undefined' && 'share' in navigator,
      offlineSupport: this.swRegistration !== null,
    };
  }

  public getInstallationInstructions(): string {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('chrome')) {
      return 'Tap the menu (⋮) and select "Add to Home screen" or "Install app"';
    } else if (userAgent.includes('firefox')) {
      return 'Tap the menu (⋮) and select "Add to Home screen"';
    } else if (userAgent.includes('safari')) {
      return 'Tap the share button (📤) and select "Add to Home Screen"';
    } else if (userAgent.includes('edge')) {
      return 'Tap the menu (⋯) and select "Add to phone"';
    } else {
      return 'Look for "Add to Home screen" or "Install app" in your browser menu';
    }
  }

  // Private helper methods

  private urlB64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private showInstallBanner(): void {
    // This would show a custom install banner
    console.log('Show install banner');
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('pwa-install-available'));
  }

  private hideInstallBanner(): void {
    // This would hide the install banner
    console.log('Hide install banner');
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('pwa-install-completed'));
  }

  private showUpdateNotification(): void {
    // This would show an update notification
    console.log('App update available');
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('pwa-update-available'));
  }

  private trackInstallation(): void {
    // Track installation event
    console.log('PWA installation tracked');
    
    // This would send analytics data
    if (typeof gtag !== 'undefined') {
      gtag('event', 'pwa_install', {
        event_category: 'engagement',
        event_label: 'PWA Installation',
      });
    }
  }

  private handleOnline(): void {
    console.log('App is back online');
    
    // Sync data when back online
    if (this.swRegistration && 'sync' in this.swRegistration) {
      this.swRegistration.sync.register('stream-sync');
    }
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('pwa-online'));
  }

  private handleOffline(): void {
    console.log('App is offline');
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('pwa-offline'));
  }

  private handleAppVisible(): void {
    console.log('App is visible');
    
    // Refresh data when app becomes visible
    window.dispatchEvent(new CustomEvent('pwa-visible'));
  }

  private handleAppHidden(): void {
    console.log('App is hidden');
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('pwa-hidden'));
  }

  public async updateApp(): Promise<void> {
    if (!this.swRegistration) {
      return;
    }

    const waitingWorker = this.swRegistration.waiting;
    if (waitingWorker) {
      // Tell the waiting service worker to skip waiting
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      
      // Reload the page to use the new service worker
      window.location.reload();
    }
  }
}

export const pwaService = new PWAService();
export default pwaService;