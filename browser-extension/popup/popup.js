// Popup script for Streamyyy extension
class StreamyyyPopup {
  constructor() {
    this.streams = [];
    this.currentTab = null;
    this.settings = {};
    
    this.init();
  }

  async init() {
    await this.loadData();
    this.setupEventListeners();
    this.updateUI();
    this.detectCurrentTab();
  }

  async loadData() {
    try {
      // Load streams from background script
      const response = await chrome.runtime.sendMessage({ action: 'getStreams' });
      this.streams = response.streams || [];

      // Load settings
      const settingsResponse = await chrome.runtime.sendMessage({ action: 'getSettings' });
      this.settings = settingsResponse.settings || {};
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  setupEventListeners() {
    // Header actions
    document.getElementById('refreshBtn').addEventListener('click', () => {
      this.refresh();
    });

    document.getElementById('settingsBtn').addEventListener('click', () => {
      this.openSettings();
    });

    // Current tab
    document.getElementById('addCurrentBtn').addEventListener('click', () => {
      this.addCurrentStream();
    });

    // Quick actions
    document.getElementById('viewAllBtn').addEventListener('click', () => {
      this.openViewer();
    });

    document.getElementById('openAppBtn').addEventListener('click', () => {
      this.openApp();
    });

    // Stream actions
    document.getElementById('clearAllBtn').addEventListener('click', () => {
      this.clearAllStreams();
    });

    // Footer
    document.getElementById('syncBtn').addEventListener('click', () => {
      this.syncWithApp();
    });
  }

  async detectCurrentTab() {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentTab = tabs[0];
      
      if (currentTab) {
        this.currentTab = currentTab;
        
        // Check if it's a streaming platform
        const streamingPlatforms = ['twitch.tv', 'youtube.com', 'kick.com'];
        const isStreamingPlatform = streamingPlatforms.some(platform => 
          currentTab.url.includes(platform)
        );

        if (isStreamingPlatform) {
          // Try to detect stream info
          const response = await chrome.runtime.sendMessage({ 
            action: 'detectStream',
            tabId: currentTab.id 
          });
          
          if (response.stream) {
            this.showCurrentTab(response.stream);
          }
        }
      }
    } catch (error) {
      console.error('Error detecting current tab:', error);
    }
  }

  showCurrentTab(stream) {
    const currentTabEl = document.getElementById('currentTab');
    const tabPlatformEl = document.getElementById('tabPlatform');
    const tabTitleEl = document.getElementById('tabTitle');
    
    tabPlatformEl.textContent = stream.platform.toUpperCase();
    tabTitleEl.textContent = stream.title;
    
    currentTabEl.style.display = 'flex';
  }

  updateUI() {
    this.updateStats();
    this.updateStreamsList();
    this.updateSyncStatus();
  }

  updateStats() {
    const streamCount = this.streams.length;
    const platforms = new Set(this.streams.map(s => s.platform));
    const totalViewers = this.streams.reduce((sum, s) => sum + (s.viewerCount || 0), 0);

    document.getElementById('streamCount').textContent = streamCount;
    document.getElementById('platformCount').textContent = platforms.size;
    document.getElementById('totalViewers').textContent = this.formatNumber(totalViewers);
  }

  updateStreamsList() {
    const streamsList = document.getElementById('streamsList');
    const emptyState = document.getElementById('emptyState');
    
    if (this.streams.length === 0) {
      emptyState.classList.remove('hidden');
      streamsList.innerHTML = '';
      return;
    }
    
    emptyState.classList.add('hidden');
    
    // Sort streams by viewer count
    const sortedStreams = [...this.streams].sort((a, b) => (b.viewerCount || 0) - (a.viewerCount || 0));
    
    streamsList.innerHTML = '';
    sortedStreams.forEach(stream => {
      const streamEl = this.createStreamElement(stream);
      streamsList.appendChild(streamEl);
    });
  }

  createStreamElement(stream) {
    const template = document.getElementById('streamTemplate');
    const streamEl = template.content.cloneNode(true);
    
    // Set platform badge
    const platformBadge = streamEl.querySelector('.platform-badge');
    platformBadge.textContent = stream.platform;
    platformBadge.classList.add(stream.platform);
    
    // Set stream info
    streamEl.querySelector('.stream-title').textContent = stream.title;
    streamEl.querySelector('.stream-channel').textContent = stream.channelName;
    streamEl.querySelector('.stream-viewers').textContent = 
      `${this.formatNumber(stream.viewerCount || 0)} viewers`;
    
    // Set up actions
    const viewBtn = streamEl.querySelector('.view-btn');
    const removeBtn = streamEl.querySelector('.remove-btn');
    
    viewBtn.addEventListener('click', () => {
      this.viewStream(stream);
    });
    
    removeBtn.addEventListener('click', () => {
      this.removeStream(stream.id);
    });
    
    return streamEl;
  }

  updateSyncStatus() {
    const syncStatus = document.getElementById('syncStatus');
    // This would show the actual sync status
    syncStatus.textContent = 'Synced 2 min ago';
  }

  async refresh() {
    await this.loadData();
    this.updateUI();
    this.detectCurrentTab();
  }

  async addCurrentStream() {
    if (!this.currentTab) return;
    
    try {
      const response = await chrome.runtime.sendMessage({ 
        action: 'detectStream',
        tabId: this.currentTab.id 
      });
      
      if (response.stream) {
        await chrome.runtime.sendMessage({ 
          action: 'addStream',
          stream: response.stream 
        });
        
        await this.refresh();
        this.showNotification('Stream added successfully!');
      }
    } catch (error) {
      console.error('Error adding current stream:', error);
      this.showNotification('Error adding stream', 'error');
    }
  }

  async viewStream(stream) {
    try {
      await chrome.tabs.create({ url: stream.url });
    } catch (error) {
      console.error('Error opening stream:', error);
    }
  }

  async removeStream(streamId) {
    try {
      await chrome.runtime.sendMessage({ 
        action: 'removeStream',
        streamId 
      });
      
      await this.refresh();
      this.showNotification('Stream removed');
    } catch (error) {
      console.error('Error removing stream:', error);
      this.showNotification('Error removing stream', 'error');
    }
  }

  async clearAllStreams() {
    if (!confirm('Are you sure you want to clear all streams?')) {
      return;
    }
    
    try {
      // Remove all streams
      for (const stream of this.streams) {
        await chrome.runtime.sendMessage({ 
          action: 'removeStream',
          streamId: stream.id 
        });
      }
      
      await this.refresh();
      this.showNotification('All streams cleared');
    } catch (error) {
      console.error('Error clearing streams:', error);
      this.showNotification('Error clearing streams', 'error');
    }
  }

  async openViewer() {
    try {
      await chrome.tabs.create({
        url: chrome.runtime.getURL('viewer/viewer.html')
      });
    } catch (error) {
      console.error('Error opening viewer:', error);
    }
  }

  async openApp() {
    try {
      await chrome.tabs.create({
        url: 'https://streamyyy.com'
      });
    } catch (error) {
      console.error('Error opening app:', error);
    }
  }

  async openSettings() {
    try {
      await chrome.tabs.create({
        url: chrome.runtime.getURL('options/options.html')
      });
    } catch (error) {
      console.error('Error opening settings:', error);
    }
  }

  async syncWithApp() {
    try {
      await chrome.runtime.sendMessage({ action: 'syncWithApp' });
      this.showNotification('Synced with app');
      this.updateSyncStatus();
    } catch (error) {
      console.error('Error syncing with app:', error);
      this.showNotification('Error syncing with app', 'error');
    }
  }

  formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  showNotification(message, type = 'success') {
    // Create a simple notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 1000;
      background-color: ${type === 'error' ? '#dc3545' : '#28a745'};
      color: white;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new StreamyyyPopup();
});