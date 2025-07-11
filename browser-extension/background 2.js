// Background script for Streamyyy browser extension
class StreamyyyBackground {
  constructor() {
    this.streams = new Map();
    this.notifications = [];
    this.settings = {
      autoDetect: true,
      notifications: true,
      contextMenus: true,
      syncWithApp: true,
      maxStreams: 10,
    };
    
    this.init();
  }

  async init() {
    // Load saved settings
    await this.loadSettings();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Create context menus
    this.createContextMenus();
    
    // Set up periodic sync
    this.startPeriodicSync();
    
    console.log('Streamyyy background script initialized');
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get('settings');
      if (result.settings) {
        this.settings = { ...this.settings, ...result.settings };
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  async saveSettings() {
    try {
      await chrome.storage.sync.set({ settings: this.settings });
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  setupEventListeners() {
    // Handle extension icon click
    chrome.action.onClicked.addListener((tab) => {
      this.handleActionClick(tab);
    });

    // Handle messages from content scripts
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // Keep message channel open for async responses
    });

    // Handle tab updates
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url) {
        this.handleTabUpdate(tabId, tab);
      }
    });

    // Handle tab removal
    chrome.tabs.onRemoved.addListener((tabId) => {
      this.handleTabRemoved(tabId);
    });

    // Handle context menu clicks
    chrome.contextMenus.onClicked.addListener((info, tab) => {
      this.handleContextMenuClick(info, tab);
    });

    // Handle notifications
    chrome.notifications.onClicked.addListener((notificationId) => {
      this.handleNotificationClick(notificationId);
    });
  }

  createContextMenus() {
    if (!this.settings.contextMenus) return;

    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({
        id: 'add-stream',
        title: 'Add stream to Streamyyy',
        contexts: ['page'],
        documentUrlPatterns: [
          'https://www.twitch.tv/*',
          'https://twitch.tv/*',
          'https://www.youtube.com/*',
          'https://youtube.com/*',
          'https://kick.com/*',
          'https://www.kick.com/*',
        ],
      });

      chrome.contextMenus.create({
        id: 'view-streams',
        title: 'View all streams',
        contexts: ['action'],
      });

      chrome.contextMenus.create({
        id: 'open-app',
        title: 'Open Streamyyy app',
        contexts: ['action'],
      });
    });
  }

  async handleActionClick(tab) {
    // Open popup or perform default action
    console.log('Extension icon clicked');
  }

  async handleMessage(request, sender, sendResponse) {
    switch (request.action) {
      case 'getStreams':
        sendResponse({ streams: Array.from(this.streams.values()) });
        break;

      case 'addStream':
        await this.addStream(request.stream, sender.tab);
        sendResponse({ success: true });
        break;

      case 'removeStream':
        await this.removeStream(request.streamId);
        sendResponse({ success: true });
        break;

      case 'getSettings':
        sendResponse({ settings: this.settings });
        break;

      case 'updateSettings':
        this.settings = { ...this.settings, ...request.settings };
        await this.saveSettings();
        sendResponse({ success: true });
        break;

      case 'detectStream':
        const stream = await this.detectStreamFromTab(sender.tab);
        sendResponse({ stream });
        break;

      case 'syncWithApp':
        await this.syncWithApp();
        sendResponse({ success: true });
        break;

      default:
        sendResponse({ error: 'Unknown action' });
    }
  }

  async handleTabUpdate(tabId, tab) {
    if (!this.settings.autoDetect) return;

    // Auto-detect streams on supported platforms
    const streamingPlatforms = [
      'twitch.tv',
      'youtube.com',
      'kick.com',
    ];

    const isStreamingPlatform = streamingPlatforms.some(platform => 
      tab.url.includes(platform)
    );

    if (isStreamingPlatform) {
      setTimeout(() => {
        this.detectStreamFromTab(tab);
      }, 2000); // Wait for page to load
    }
  }

  handleTabRemoved(tabId) {
    // Clean up any streams associated with this tab
    for (const [streamId, stream] of this.streams.entries()) {
      if (stream.tabId === tabId) {
        this.streams.delete(streamId);
      }
    }
  }

  async handleContextMenuClick(info, tab) {
    switch (info.menuItemId) {
      case 'add-stream':
        const stream = await this.detectStreamFromTab(tab);
        if (stream) {
          await this.addStream(stream, tab);
          this.showNotification('Stream added successfully!', `${stream.title} has been added to your collection.`);
        }
        break;

      case 'view-streams':
        await this.openStreamsViewer();
        break;

      case 'open-app':
        await this.openApp();
        break;
    }
  }

  handleNotificationClick(notificationId) {
    // Handle notification clicks
    chrome.notifications.clear(notificationId);
    
    if (notificationId.startsWith('stream-')) {
      // Open the stream or app
      this.openStreamsViewer();
    }
  }

  async detectStreamFromTab(tab) {
    if (!tab || !tab.url) return null;

    try {
      // Inject detection script
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: this.detectStreamOnPage,
      });

      if (results && results[0] && results[0].result) {
        const streamData = results[0].result;
        return {
          id: `${streamData.platform}_${streamData.channelName}_${Date.now()}`,
          platform: streamData.platform,
          channelName: streamData.channelName,
          title: streamData.title,
          viewerCount: streamData.viewerCount,
          thumbnailUrl: streamData.thumbnailUrl,
          url: tab.url,
          tabId: tab.id,
          addedAt: new Date().toISOString(),
        };
      }
    } catch (error) {
      console.error('Error detecting stream:', error);
    }

    return null;
  }

  // This function runs in the context of the web page
  detectStreamOnPage() {
    const url = window.location.href;
    let streamData = null;

    // Twitch detection
    if (url.includes('twitch.tv')) {
      const channelName = url.split('twitch.tv/')[1]?.split('/')[0];
      const titleElement = document.querySelector('[data-a-target="stream-title"]');
      const viewerCountElement = document.querySelector('[data-a-target="animated-channel-viewers-count"]');
      const thumbnailElement = document.querySelector('video');

      if (channelName && titleElement) {
        streamData = {
          platform: 'twitch',
          channelName,
          title: titleElement.textContent?.trim() || 'Untitled Stream',
          viewerCount: viewerCountElement ? 
            parseInt(viewerCountElement.textContent?.replace(/[^\d]/g, '') || '0') : 0,
          thumbnailUrl: thumbnailElement ? thumbnailElement.poster : '',
          isLive: document.querySelector('[data-a-target="animated-channel-viewers-count"]') !== null,
        };
      }
    }
    
    // YouTube detection
    else if (url.includes('youtube.com') && url.includes('/watch')) {
      const titleElement = document.querySelector('#container h1.title yt-formatted-string');
      const channelElement = document.querySelector('#channel-name a');
      const viewerCountElement = document.querySelector('.view-count');
      const thumbnailElement = document.querySelector('video');

      if (titleElement && channelElement) {
        streamData = {
          platform: 'youtube',
          channelName: channelElement.textContent?.trim() || 'Unknown Channel',
          title: titleElement.textContent?.trim() || 'Untitled Video',
          viewerCount: viewerCountElement ? 
            parseInt(viewerCountElement.textContent?.replace(/[^\d]/g, '') || '0') : 0,
          thumbnailUrl: thumbnailElement ? thumbnailElement.poster : '',
          isLive: document.querySelector('.live-badge') !== null,
        };
      }
    }
    
    // Kick detection
    else if (url.includes('kick.com')) {
      const channelName = url.split('kick.com/')[1]?.split('/')[0];
      const titleElement = document.querySelector('[data-testid="stream-title"]');
      const viewerCountElement = document.querySelector('[data-testid="viewer-count"]');
      const thumbnailElement = document.querySelector('video');

      if (channelName && titleElement) {
        streamData = {
          platform: 'kick',
          channelName,
          title: titleElement.textContent?.trim() || 'Untitled Stream',
          viewerCount: viewerCountElement ? 
            parseInt(viewerCountElement.textContent?.replace(/[^\d]/g, '') || '0') : 0,
          thumbnailUrl: thumbnailElement ? thumbnailElement.poster : '',
          isLive: document.querySelector('[data-testid="live-indicator"]') !== null,
        };
      }
    }

    return streamData;
  }

  async addStream(stream, tab) {
    if (!stream) return;

    // Check if stream already exists
    if (this.streams.has(stream.id)) {
      return;
    }

    // Check stream limit
    if (this.streams.size >= this.settings.maxStreams) {
      this.showNotification('Stream limit reached', `You can only have ${this.settings.maxStreams} streams. Remove some streams first.`);
      return;
    }

    // Add stream to collection
    this.streams.set(stream.id, stream);

    // Save to storage
    await this.saveStreams();

    // Sync with app if enabled
    if (this.settings.syncWithApp) {
      await this.syncWithApp();
    }

    // Update badge
    this.updateBadge();

    console.log('Stream added:', stream);
  }

  async removeStream(streamId) {
    if (this.streams.has(streamId)) {
      this.streams.delete(streamId);
      await this.saveStreams();
      this.updateBadge();
    }
  }

  async saveStreams() {
    try {
      const streamsArray = Array.from(this.streams.values());
      await chrome.storage.local.set({ streams: streamsArray });
    } catch (error) {
      console.error('Error saving streams:', error);
    }
  }

  async loadStreams() {
    try {
      const result = await chrome.storage.local.get('streams');
      if (result.streams) {
        this.streams.clear();
        result.streams.forEach(stream => {
          this.streams.set(stream.id, stream);
        });
      }
    } catch (error) {
      console.error('Error loading streams:', error);
    }
  }

  updateBadge() {
    const count = this.streams.size;
    chrome.action.setBadgeText({
      text: count > 0 ? count.toString() : '',
    });
    chrome.action.setBadgeBackgroundColor({
      color: count > 0 ? '#007bff' : '#999',
    });
  }

  showNotification(title, message) {
    if (!this.settings.notifications) return;

    const notificationId = `stream-${Date.now()}`;
    chrome.notifications.create(notificationId, {
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title,
      message,
    });
  }

  async openStreamsViewer() {
    // Open the streams viewer (could be popup or new tab)
    try {
      await chrome.tabs.create({
        url: chrome.runtime.getURL('viewer/viewer.html'),
      });
    } catch (error) {
      console.error('Error opening streams viewer:', error);
    }
  }

  async openApp() {
    // Open the main Streamyyy app
    try {
      await chrome.tabs.create({
        url: 'https://streamyyy.com',
      });
    } catch (error) {
      console.error('Error opening app:', error);
    }
  }

  async syncWithApp() {
    // Sync collected streams with the main app
    try {
      const streams = Array.from(this.streams.values());
      
      // This would make a request to the app's API
      // For now, we'll just store it in sync storage
      await chrome.storage.sync.set({
        extensionStreams: streams,
        lastSync: new Date().toISOString(),
      });
      
      console.log('Synced with app:', streams.length, 'streams');
    } catch (error) {
      console.error('Error syncing with app:', error);
    }
  }

  startPeriodicSync() {
    // Sync every 5 minutes
    setInterval(() => {
      if (this.settings.syncWithApp) {
        this.syncWithApp();
      }
    }, 5 * 60 * 1000);
  }
}

// Initialize the background script
const streamyyyBackground = new StreamyyyBackground();

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Streamyyy extension installed');
    chrome.tabs.create({
      url: chrome.runtime.getURL('options/options.html'),
    });
  }
});