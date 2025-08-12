// Settings JavaScript for Pointfour Fashion Assistant
// Handles user preferences and settings management

class SettingsManager {
  constructor() {
    this.settings = {};
    this.init();
  }

  async init() {
    // Load current settings
    await this.loadSettings();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Apply current settings to UI
    this.applySettingsToUI();
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get({
        enabled: true,
        autoExpand: false,
        position: 'top-right',
        theme: 'light',
        notifications: true,
        cacheDuration: 30,
        apiEndpoint: 'https://www.pointfour.in'
      });
      
      this.settings = result;
    } catch (error) {
      console.error('Error loading settings:', error);
      this.settings = {
        enabled: true,
        autoExpand: false,
        position: 'top-right',
        theme: 'light',
        notifications: true,
        cacheDuration: 30,
        apiEndpoint: 'https://www.pointfour.in'
      };
    }
  }

  async saveSettings() {
    try {
      await chrome.storage.sync.set(this.settings);
      
      // Notify content scripts of preference changes
      this.notifyContentScripts();
      
      this.showStatus('Settings saved successfully!', 'success');
    } catch (error) {
      console.error('Error saving settings:', error);
      this.showStatus('Error saving settings', 'error');
    }
  }

  setupEventListeners() {
    // General settings
    document.getElementById('enabled').addEventListener('change', (e) => {
      this.settings.enabled = e.target.checked;
      this.saveSettings();
    });

    document.getElementById('autoExpand').addEventListener('change', (e) => {
      this.settings.autoExpand = e.target.checked;
      this.saveSettings();
    });

    document.getElementById('notifications').addEventListener('change', (e) => {
      this.settings.notifications = e.target.checked;
      this.saveSettings();
    });

    // Appearance settings
    document.getElementById('position').addEventListener('change', (e) => {
      this.settings.position = e.target.value;
      this.saveSettings();
    });

    document.getElementById('theme').addEventListener('change', (e) => {
      this.settings.theme = e.target.value;
      this.saveSettings();
    });

    // Data & Privacy settings
    document.getElementById('cacheDuration').addEventListener('change', (e) => {
      this.settings.cacheDuration = parseInt(e.target.value);
      this.saveSettings();
    });

    document.getElementById('clearCache').addEventListener('click', () => {
      this.clearCache();
    });

    // Integration settings
    document.getElementById('apiEndpoint').addEventListener('change', (e) => {
      this.settings.apiEndpoint = e.target.value;
      this.saveSettings();
    });

    document.getElementById('testConnection').addEventListener('click', () => {
      this.testConnection();
    });
  }

  applySettingsToUI() {
    // Apply boolean settings
    document.getElementById('enabled').checked = this.settings.enabled;
    document.getElementById('autoExpand').checked = this.settings.autoExpand;
    document.getElementById('notifications').checked = this.settings.notifications;

    // Apply select settings
    document.getElementById('position').value = this.settings.position;
    document.getElementById('theme').value = this.settings.theme;
    document.getElementById('cacheDuration').value = this.settings.cacheDuration;
    document.getElementById('apiEndpoint').value = this.settings.apiEndpoint;
  }

  async clearCache() {
    try {
      // Clear extension cache
      await chrome.storage.local.clear();
      
      // Clear background script cache (send message)
      await chrome.runtime.sendMessage({
        type: 'CLEAR_CACHE'
      });
      
      this.showStatus('Cache cleared successfully!', 'success');
    } catch (error) {
      console.error('Error clearing cache:', error);
      this.showStatus('Error clearing cache', 'error');
    }
  }

  async testConnection() {
    const button = document.getElementById('testConnection');
    const originalText = button.textContent;
    
    try {
      button.textContent = 'Testing...';
      button.disabled = true;
      
      const response = await fetch(`${this.settings.apiEndpoint}/api/recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: 'Test connection',
          enableExternalSearch: false
        })
      });
      
      if (response.ok) {
        this.showStatus('Connection successful!', 'success');
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      this.showStatus(`Connection failed: ${error.message}`, 'error');
    } finally {
      button.textContent = originalText;
      button.disabled = false;
    }
  }

  async notifyContentScripts() {
    try {
      // Get all tabs
      const tabs = await chrome.tabs.query({});
      
      // Send preference update to each tab
      tabs.forEach(tab => {
        try {
          chrome.tabs.sendMessage(tab.id, {
            type: 'PREFERENCES_UPDATED',
            changes: this.settings
          });
        } catch (error) {
          // Tab might not be ready or have content script
        }
      });
    } catch (error) {
      console.error('Error notifying content scripts:', error);
    }
  }

  showStatus(message, type) {
    const statusEl = document.getElementById('status');
    statusEl.textContent = message;
    statusEl.className = `status ${type}`;
    statusEl.style.display = 'block';
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      statusEl.style.display = 'none';
    }, 3000);
  }
}

// Initialize settings manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new SettingsManager();
});

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SETTINGS_UPDATED') {
    // Reload settings if they were updated elsewhere
    window.location.reload();
  }
});
