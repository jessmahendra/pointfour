// Content Script for Pointfour Fashion Assistant
// Injects floating widget and handles user interactions

class FashionWidget {
  constructor() {
    this.isVisible = false;
    this.isExpanded = false;
    this.brandData = null;
    this.widget = null;
    this.autoHideTimer = null;
    this.preferences = {};
    
    this.init();
  }

  async init() {
    // Load user preferences
    await this.loadPreferences();
    
    // Create and inject widget
    this.createWidget();
    
    // Listen for messages from background script
    this.setupMessageListener();
    
    // Listen for URL changes (for SPAs)
    this.setupUrlChangeListener();
    
    // Check if we already have brand data
    this.checkExistingBrandData();
  }

  async loadPreferences() {
    try {
      const result = await chrome.storage.sync.get([
        'enabled',
        'autoExpand',
        'position',
        'theme',
        'notifications'
      ]);
      this.preferences = result;
    } catch (error) {
      console.error('Error loading preferences:', error);
      this.preferences = {
        enabled: true,
        autoExpand: false,
        position: 'top-right',
        theme: 'light',
        notifications: true
      };
    }
  }

  createWidget() {
    // Create widget container
    this.widget = document.createElement('div');
    this.widget.id = 'pointfour-fashion-widget';
    this.widget.className = 'pointfour-widget';
    this.widget.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      transition: all 0.3s ease;
      opacity: 0;
      transform: translateX(100%);
    `;

    // Create minimal mode content
    this.createMinimalMode();
    
    // Create expanded mode content
    this.createExpandedMode();
    
    // Add to page
    document.body.appendChild(this.widget);
    
    // Add event listeners
    this.setupEventListeners();
  }

  createMinimalMode() {
    const minimalMode = document.createElement('div');
    minimalMode.className = 'widget-minimal';
    minimalMode.style.cssText = `
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 12px 16px;
      border-radius: 25px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      cursor: pointer;
      user-select: none;
      min-width: 200px;
      text-align: center;
      font-size: 14px;
      font-weight: 500;
      line-height: 1.4;
    `;

    minimalMode.innerHTML = `
      <div class="minimal-content">
        <span class="brand-name"></span>
        <div class="fit-summary"></div>
        <div class="click-hint">Click for details</div>
      </div>
    `;

    this.widget.appendChild(minimalMode);
    this.minimalMode = minimalMode;
  }

  createExpandedMode() {
    const expandedMode = document.createElement('div');
    expandedMode.className = 'widget-expanded';
    expandedMode.style.cssText = `
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
      padding: 20px;
      max-width: 400px;
      display: none;
      border: 1px solid #e5e7eb;
    `;

    expandedMode.innerHTML = `
      <div class="expanded-header">
        <h3 class="expanded-title"></h3>
        <button class="close-btn" aria-label="Close">×</button>
      </div>
      <div class="expanded-content">
        <div class="brand-info"></div>
        <div class="fit-details"></div>
        <div class="external-reviews" style="display: none;"></div>
        <div class="actions">
          <button class="action-btn primary">Get Full Analysis</button>
          <button class="action-btn secondary">Dismiss</button>
        </div>
      </div>
    `;

    this.widget.appendChild(expandedMode);
    this.expandedMode = expandedMode;
  }

  setupEventListeners() {
    // Minimal mode click to expand
    this.minimalMode.addEventListener('click', () => {
      this.expand();
    });

    // Close button
    const closeBtn = this.expandedMode.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
      this.collapse();
    });

    // Action buttons
    const actionBtns = this.expandedMode.querySelectorAll('.action-btn');
    actionBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (btn.classList.contains('primary')) {
          this.openFullAnalysis();
        } else if (btn.classList.contains('secondary')) {
          this.dismiss();
        }
      });
    });

    // Click outside to close
    document.addEventListener('click', (e) => {
      if (!this.widget.contains(e.target) && this.isExpanded) {
        this.collapse();
      }
    });
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.type) {
        case 'BRAND_DETECTED':
          this.handleBrandDetected(message.data);
          break;
        case 'TOGGLE_WIDGET':
          this.toggle();
          break;
        case 'PREFERENCES_UPDATED':
          this.handlePreferencesUpdated(message.changes);
          break;
      }
    });
  }

  setupUrlChangeListener() {
    // Monitor URL changes for SPAs
    let currentUrl = window.location.href;
    
    const observer = new MutationObserver(() => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        this.handleUrlChange();
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  async checkExistingBrandData() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_BRAND_DATA'
      });
      
      if (response) {
        this.handleBrandDetected(response);
      }
    } catch (error) {
      console.error('Error checking existing brand data:', error);
    }
  }

  handleBrandDetected(brandData) {
    this.brandData = brandData;
    
    if (this.preferences.enabled) {
      this.show();
      this.updateContent();
      
      // Auto-hide after 5 seconds if not expanded
      if (!this.preferences.autoExpand) {
        this.startAutoHideTimer();
      }
    }
  }

  handleUrlChange() {
    // Hide widget when URL changes
    this.hide();
    this.brandData = null;
    
    // Check for new brand data
    setTimeout(() => {
      this.checkExistingBrandData();
    }, 1000);
  }

  handlePreferencesUpdated(changes) {
    Object.assign(this.preferences, changes);
    
    if (changes.enabled !== undefined) {
      if (changes.enabled) {
        this.show();
      } else {
        this.hide();
      }
    }
    
    if (changes.theme !== undefined) {
      this.updateTheme();
    }
  }

  show() {
    if (this.isVisible) return;
    
    this.isVisible = true;
    this.widget.style.opacity = '1';
    this.widget.style.transform = 'translateX(0)';
    
    // Update tab state
    this.updateTabState();
  }

  hide() {
    if (!this.isVisible) return;
    
    this.isVisible = false;
    this.widget.style.opacity = '0';
    this.widget.style.transform = 'translateX(100%)';
    
    // Update tab state
    this.updateTabState();
  }

  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  expand() {
    if (this.isExpanded) return;
    
    this.isExpanded = true;
    this.minimalMode.style.display = 'none';
    this.expandedMode.style.display = 'block';
    
    // Stop auto-hide timer
    this.stopAutoHideTimer();
    
    // Update tab state
    this.updateTabState();
  }

  collapse() {
    if (!this.isExpanded) return;
    
    this.isExpanded = false;
    this.minimalMode.style.display = 'block';
    this.expandedMode.style.display = 'none';
    
    // Restart auto-hide timer
    if (!this.preferences.autoExpand) {
      this.startAutoHideTimer();
    }
    
    // Update tab state
    this.updateTabState();
  }

  updateContent() {
    if (!this.brandData) return;

    const { brandName, recommendation, externalSearchResults, searchType } = this.brandData;

    // Update minimal mode
    const brandNameEl = this.minimalMode.querySelector('.brand-name');
    const fitSummaryEl = this.minimalMode.querySelector('.fit-summary');
    
    brandNameEl.textContent = brandName;
    
    // Extract fit summary from recommendation
    const fitSummary = this.extractFitSummary(recommendation);
    fitSummaryEl.textContent = fitSummary;

    // Update expanded mode
    const titleEl = this.expandedMode.querySelector('.expanded-title');
    const brandInfoEl = this.expandedMode.querySelector('.brand-info');
    const fitDetailsEl = this.expandedMode.querySelector('.fit-details');
    const externalReviewsEl = this.expandedMode.querySelector('.external-reviews');

    titleEl.textContent = `${brandName} Fit Guide`;
    
    brandInfoEl.innerHTML = `
      <div class="info-item">
        <strong>Data Source:</strong> ${searchType === 'hybrid' ? 'Database + Web Search' : 'Database'}
      </div>
    `;

    fitDetailsEl.innerHTML = `
      <div class="fit-summary-text">${recommendation}</div>
    `;

    // Show external reviews if available
    if (externalSearchResults && externalSearchResults.brandFitSummary) {
      externalReviewsEl.style.display = 'block';
      externalReviewsEl.innerHTML = `
        <h4>🌐 Web Reviews</h4>
        <div class="external-summary">
          <p><strong>Summary:</strong> ${externalSearchResults.brandFitSummary.summary}</p>
          <p><strong>Confidence:</strong> ${externalSearchResults.brandFitSummary.confidence}</p>
          <p><strong>Sources:</strong> ${externalSearchResults.brandFitSummary.sources.join(', ')}</p>
        </div>
      `;
    } else {
      externalReviewsEl.style.display = 'none';
    }
  }

  extractFitSummary(recommendation) {
    // Extract key fit information from recommendation
    const fitKeywords = ['runs small', 'runs large', 'true to size', 'oversized', 'fitted', 'loose'];
    
    for (const keyword of fitKeywords) {
      if (recommendation.toLowerCase().includes(keyword)) {
        return `Typically ${keyword}`;
      }
    }
    
    // Fallback to first sentence
    const firstSentence = recommendation.split('.')[0];
    return firstSentence.length > 50 ? firstSentence.substring(0, 50) + '...' : firstSentence;
  }

  startAutoHideTimer() {
    this.stopAutoHideTimer();
    this.autoHideTimer = setTimeout(() => {
      this.hide();
    }, 5000);
  }

  stopAutoHideTimer() {
    if (this.autoHideTimer) {
      clearTimeout(this.autoHideTimer);
      this.autoHideTimer = null;
    }
  }

  dismiss() {
    this.hide();
    // Mark as dismissed for this session
    this.updateTabState({ dismissed: true });
  }

  openFullAnalysis() {
    // Open Pointfour analysis page in new tab
    const analysisUrl = `https://www.pointfour.in/analyze?brand=${encodeURIComponent(this.brandData.brandName)}`;
    window.open(analysisUrl, '_blank');
  }

  updateTheme() {
    // Apply theme-specific styles
    const isDark = this.preferences.theme === 'dark';
    this.widget.style.filter = isDark ? 'invert(1) hue-rotate(180deg)' : 'none';
  }

  updateTabState() {
    try {
      chrome.runtime.sendMessage({
        type: 'UPDATE_TAB_STATE',
        state: {
          isVisible: this.isVisible,
          isExpanded: this.isExpanded,
          dismissed: false
        }
      });
    } catch (error) {
      console.error('Error updating tab state:', error);
    }
  }
}

// Initialize widget when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new FashionWidget();
  });
} else {
  new FashionWidget();
}
