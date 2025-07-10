const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  // Store operations
  store: {
    get: (key) => ipcRenderer.invoke('get-store-value', key),
    set: (key, value) => ipcRenderer.invoke('set-store-value', key, value),
    getAll: () => ipcRenderer.invoke('get-all-store-values'),
    clear: () => ipcRenderer.invoke('clear-store'),
  },

  // Dialog operations
  dialog: {
    showMessageBox: (options) => ipcRenderer.invoke('show-message-box', options),
    showErrorBox: (title, content) => ipcRenderer.invoke('show-error-box', title, content),
  },

  // Notification operations
  notification: {
    show: (options) => ipcRenderer.invoke('show-notification', options),
  },

  // Window operations
  window: {
    setAlwaysOnTop: (flag) => ipcRenderer.invoke('set-always-on-top', flag),
    minimizeToTray: () => ipcRenderer.send('minimize-to-tray'),
    quit: () => ipcRenderer.send('quit-app'),
  },

  // System info
  system: {
    getInfo: () => ipcRenderer.invoke('get-system-info'),
  },

  // Auto-start operations
  autoStart: {
    toggle: () => ipcRenderer.send('toggle-auto-start'),
    setup: () => ipcRenderer.send('setup-auto-start'),
  },

  // System tray operations
  systemTray: {
    setup: () => ipcRenderer.send('setup-system-tray'),
  },

  // IPC communication
  ipcRenderer: {
    send: (channel, data) => {
      // Whitelist channels for security
      const validChannels = [
        'setup-system-tray',
        'setup-auto-start',
        'toggle-auto-start',
        'minimize-to-tray',
        'quit-app',
      ];
      
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      }
    },
    
    on: (channel, func) => {
      // Whitelist channels for security
      const validChannels = [
        'navigate-to-settings',
        'create-new-layout',
        'save-current-layout',
        'export-settings',
        'import-settings',
        'show-about',
        'update-available',
        'download-progress',
        'update-downloaded',
      ];
      
      if (validChannels.includes(channel)) {
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    },
    
    removeListener: (channel, func) => {
      ipcRenderer.removeListener(channel, func);
    },
    
    removeAllListeners: (channel) => {
      ipcRenderer.removeAllListeners(channel);
    },
  },

  // Platform detection
  platform: {
    isElectron: true,
    isDesktop: true,
    isMac: process.platform === 'darwin',
    isWindows: process.platform === 'win32',
    isLinux: process.platform === 'linux',
  },

  // App metadata
  app: {
    getName: () => 'Streamyyy',
    getVersion: () => require('../package.json').version,
  },

  // Utility functions
  utils: {
    openExternal: (url) => {
      // This would be handled by the main process
      ipcRenderer.send('open-external', url);
    },
  },
});

// Security: Remove dangerous globals
delete global.require;
delete global.exports;
delete global.module;

// Add security headers
window.addEventListener('DOMContentLoaded', () => {
  // Prevent drag and drop of files
  document.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
  });

  document.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
  });

  // Prevent context menu in production
  if (process.env.NODE_ENV === 'production') {
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
  }

  // Prevent F12 and other dev shortcuts in production
  if (process.env.NODE_ENV === 'production') {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'F12' || 
          (e.ctrlKey && e.shiftKey && e.key === 'I') ||
          (e.ctrlKey && e.shiftKey && e.key === 'C') ||
          (e.ctrlKey && e.shiftKey && e.key === 'J')) {
        e.preventDefault();
      }
    });
  }
});

// Console security warning
if (process.env.NODE_ENV === 'production') {
  console.log('%cSecurity Warning!', 'color: red; font-size: 40px; font-weight: bold;');
  console.log('%cThis is a browser feature intended for developers. If someone told you to copy-paste something here, it is a scam and will give them access to your account.', 'color: red; font-size: 16px;');
}