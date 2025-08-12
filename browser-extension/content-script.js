// Content Script for Pointfour Fashion Assistant
// Injects floating widget and handles user interactions

// Wrap everything in a try-catch to handle page errors gracefully
try {
  class FashionWidget {
    constructor() {
      console.log('🎯 FashionWidget: Constructor called');
      
      this.isVisible = false;
      this.isExpanded = false;
      this.isDismissed = false;
      this.lastShowTime = 0;
      this.preferences = {
        theme: 'light',
        position: 'top-right',
        autoHide: true,
        enabled: true  // Ensure enabled is true by default
      };
      
      // Initialize immediately
      this.init();
    }

    // Clean up any existing widgets
    cleanupExistingWidgets() {
      try {
        // Remove any existing widgets with the same ID
        const existingWidgets = document.querySelectorAll('#fashion-fit-widget, .fashion-fit-widget');
        existingWidgets.forEach(widget => {
          console.log('🎯 FashionWidget: Removing existing widget:', widget);
          widget.remove();
        });
        
        // Also remove any widgets with similar classes
        const similarWidgets = document.querySelectorAll('[id*="fashion"], [class*="fashion-widget"]');
        similarWidgets.forEach(widget => {
          if (widget.id !== 'fashion-fit-widget' && !widget.classList.contains('fashion-fit-widget')) {
            console.log('🎯 FashionWidget: Removing similar widget:', widget);
            widget.remove();
          }
        });
        
        console.log('🎯 FashionWidget: Cleanup completed');
      } catch (error) {
        console.error('🎯 FashionWidget: Error during cleanup:', error);
      }
    }

    // Initialize the widget
    init() {
      try {
        console.log('🎯 FashionWidget: Initializing...');
        console.log('🎯 FashionWidget: Current URL:', window.location.href);
        console.log('🎯 FashionWidget: Page title:', document.title);
        console.log('🎯 FashionWidget: Hostname:', window.location.hostname);
        
        // Clean up any existing widgets first
        this.cleanupExistingWidgets();
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', () => {
            console.log('🎯 FashionWidget: DOM loaded, creating widget...');
            this.createWidget();
            this.startDetection();
          });
        } else {
          console.log('🎯 FashionWidget: DOM already ready, creating widget...');
          this.createWidget();
          this.startDetection();
        }
        
        // Also listen for page changes (SPA navigation)
        this.observePageChanges();
        
        console.log('🎯 FashionWidget: Initialization complete');
        
      } catch (error) {
        console.error('🎯 FashionWidget: Error during initialization:', error);
        // Try to recover by creating widget anyway
        setTimeout(() => {
          try {
            this.createWidget();
            this.startDetection();
          } catch (recoveryError) {
            console.error('🎯 FashionWidget: Recovery failed:', recoveryError);
          }
        }, 1000);
      }
    }

    // Start the detection process
    startDetection() {
      try {
        console.log('🎯 FashionWidget: Starting detection process...');
        
        // Check if we're on a search engine or clearly non-fashion site first
        if (this.isSearchEngine() || this.isNonFashionSite()) {
          console.log('🎯 FashionWidget: Search engine or non-fashion site detected, skipping...');
          return;
        }
        
        // Run universal detection on potentially fashion sites
        console.log('🎯 FashionWidget: Running universal detection...');
        const detectionResults = this.detectFashionWebsite();
        
        console.log('🎯 FashionWidget: Detection results:', detectionResults);
        
        // Show widget if we have any fashion indicators (lower threshold)
        if (detectionResults.isFashionWebsite && detectionResults.confidence >= 30) {
          console.log('🎯 FashionWidget: Fashion website detected with confidence:', detectionResults.confidence);
          
          // Create brand data from detection results
          const brandData = {
            brandName: detectionResults.detectedBrand || 'Fashion Brand',
            category: detectionResults.fashionType || 'general',
            hasData: false,
            searchType: 'universal-detection',
            recommendation: `Fashion website detected! ${detectionResults.reasons.join(' ')}`,
            externalSearchResults: null,
            fitTips: [],
            sizeGuide: null,
            timestamp: Date.now(),
            error: false,
            detectionDetails: detectionResults
          };
          
          this.handleBrandDetected(brandData);
          
          // Try to fetch data for the detected brand
          if (detectionResults.detectedBrand) {
            this.fetchBrandDataForDetectedBrand(detectionResults.detectedBrand);
          }
          
        } else if (detectionResults.confidence >= 20) {
          // Show widget even with low confidence, but allow manual input
          console.log('🎯 FashionWidget: Low confidence fashion indicators, showing widget with manual input option...');
          
          const brandData = {
            brandName: 'Fashion Website',
            category: 'general',
            hasData: false,
            searchType: 'low-confidence-detection',
            recommendation: 'Fashion website detected with low confidence. You can manually enter a brand name.',
            externalSearchResults: null,
            fitTips: [],
            sizeGuide: null,
            timestamp: Date.now(),
            error: false,
            detectionDetails: detectionResults
          };
          
          this.handleBrandDetected(brandData);
          
        } else {
          console.log('🎯 FashionWidget: Not a fashion website (confidence:', detectionResults.confidence, ')');
          // Don't show widget on clearly non-fashion sites
        }
        
      } catch (error) {
        console.error('🎯 FashionWidget: Error in detection process:', error);
        // Show widget as fallback if detection fails
        this.showFallbackWidget();
      }
    }

    // Check if we're on a search engine
    isSearchEngine() {
      const hostname = window.location.hostname.toLowerCase();
      const searchEngines = [
        'google.com', 'google.co.uk', 'google.de', 'google.fr', 'google.it', 'google.es', 'google.ca', 'google.com.au',
        'bing.com', 'yahoo.com', 'duckduckgo.com', 'yandex.com', 'baidu.com', 'search.yahoo.com'
      ];
      
      return searchEngines.some(engine => hostname.includes(engine));
    }

    // Check if we're on a clearly non-fashion site
    isNonFashionSite() {
      const hostname = window.location.hostname.toLowerCase();
      const url = window.location.href.toLowerCase();
      
      // Only block clearly non-fashion domains (very restrictive list)
      const clearlyNonFashionDomains = [
        'github.com', 'stackoverflow.com', 'news.ycombinator.com', 'dev.to', 'hashnode.dev'
      ];
      
      // Check if current domain is in clearly non-fashion list
      if (clearlyNonFashionDomains.some(domain => hostname.includes(domain))) {
        return true;
      }
      
      // Only block very specific non-fashion URL patterns
      const clearlyNonFashionPatterns = [
        '/api/', '/docs/', '/help/', '/support/', '/admin', '/dashboard', '/settings'
      ];
      
      if (clearlyNonFashionPatterns.some(pattern => url.includes(pattern))) {
        return true;
      }
      
      // Don't block social media, news, or other sites that might have fashion content
      return false;
    }

    async loadPreferences() {
      try {
        const result = await chrome.storage.sync.get([
          'enabled',
          'autoExpand',
          'position',
          'theme',
          'notifications',
          'autoHideDelay',
          'widgetOpacity'
        ]);
        this.preferences = {
          enabled: true,
          autoExpand: false,
          position: 'top-right',
          theme: 'light',
          notifications: true,
          autoHideDelay: 5000,
          widgetOpacity: 0.95,
          ...result
        };
        this.position = this.preferences.position;
      } catch (error) {
        console.error('Error loading preferences:', error);
        this.preferences = {
          enabled: true,
          autoExpand: false,
          position: 'top-right',
          theme: 'light',
          notifications: true,
          autoHideDelay: 5000,
          widgetOpacity: 0.95
        };
      }
    }

    createWidget() {
      try {
        console.log('🎯 FashionWidget: Creating widget...');
        
        // Check if widget already exists
        if (document.getElementById('fashion-fit-widget')) {
          console.log('🎯 FashionWidget: Widget already exists, removing old one...');
          document.getElementById('fashion-fit-widget').remove();
        }
        
        // Create main widget container
        this.widget = document.createElement('div');
        this.widget.className = 'fashion-fit-widget';
        this.widget.id = 'fashion-fit-widget';
        
        // Set initial position
        this.updateWidgetPosition();
        
        // Create minimal and expanded modes
        this.createMinimalMode();
        this.createExpandedMode();
        
        // Add to page
        document.body.appendChild(this.widget);
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load Inter font
        this.loadInterFont();
        
        // Add manual trigger for debugging
        this.addManualTrigger();
        
        console.log('🎯 FashionWidget: Widget creation complete');
        
      } catch (error) {
        console.error('🎯 FashionWidget: Error creating widget:', error);
      }
    }

    updateWidgetPosition() {
      const baseStyles = `
        position: fixed !important;
        z-index: 999999 !important;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        backdrop-filter: blur(10px) !important;
        -webkit-backdrop-filter: blur(10px) !important;
        max-width: 400px !important;
        min-width: 320px !important;
        width: 350px !important;
        height: auto !important;
        min-height: 120px !important;
        overflow: visible !important;
        box-sizing: border-box !important;
      `;

      let positionStyles = '';
      
      // Ensure we're using top-right as default
      if (!this.position || this.position === 'default') {
        this.position = 'top-right';
      }
      
      console.log('🎯 FashionWidget: Positioning widget at:', this.position);
      
      // Get viewport dimensions for bounds checking
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const widgetWidth = 350; // Fixed width
      
      switch (this.position) {
        case 'top-left':
          positionStyles = 'top: 20px !important; left: 20px !important;';
          break;
        case 'top-center':
          positionStyles = 'top: 20px !important; left: 50% !important; transform: translateX(-50%) !important;';
          break;
        case 'bottom-right':
          positionStyles = 'bottom: 20px !important; right: 20px !important;';
          break;
        case 'bottom-left':
          positionStyles = 'bottom: 20px !important; left: 20px !important;';
          break;
        case 'bottom-center':
          positionStyles = 'bottom: 20px !important; left: 50% !important; transform: translateX(-50%) !important;';
          break;
        case 'top-right':
        default:
          // Ensure widget doesn't go beyond right edge
          const rightMargin = Math.max(20, viewportWidth - widgetWidth - 20);
          positionStyles = `top: 20px !important; right: ${rightMargin}px !important;`;
          break;
      }
      
      const finalStyles = baseStyles + positionStyles;
      this.widget.style.cssText = finalStyles;
      
      // Force apply critical styles
      this.widget.style.setProperty('position', 'fixed', 'important');
      this.widget.style.setProperty('z-index', '999999', 'important');
      this.widget.style.setProperty('width', '350px', 'important');
      this.widget.style.setProperty('max-width', '400px', 'important');
      this.widget.style.setProperty('min-width', '320px', 'important');
      this.widget.style.setProperty('height', 'auto', 'important');
      this.widget.style.setProperty('min-height', '120px', 'important');
      this.widget.style.setProperty('overflow', 'visible', 'important');
      
      console.log('🎯 FashionWidget: Applied styles:', finalStyles);
      console.log('🎯 FashionWidget: Viewport dimensions:', { width: viewportWidth, height: viewportHeight });
      console.log('🎯 FashionWidget: Widget position computed:', this.widget.getBoundingClientRect());
    }

    createMinimalMode() {
      this.minimalMode = document.createElement('div');
      this.minimalMode.className = 'fashion-fit-widget minimal';
      this.minimalMode.innerHTML = `
        <div class="widget-header">
          <button class="widget-close" title="Close widget">×</button>
          <div class="minimal-content">
            <div class="brand-info">
              <div class="brand-name"></div>
              <div class="fit-summary"></div>
            </div>
            <div class="click-hint">
              <span class="hint-icon">👆</span>
              <span class="hint-text">Click to expand</span>
            </div>
          </div>
        </div>
      `;

      this.widget.appendChild(this.minimalMode);

      // Add event listeners for expanding
      this.minimalMode.addEventListener('click', (e) => {
        // Don't expand if clicking on close button
        if (!e.target.closest('.widget-close')) {
          console.log('🎯 FashionWidget: Minimal mode clicked, expanding...');
          this.expand();
        }
      });
      
      // Close button
      const closeBtn = this.minimalMode.querySelector('.widget-close');
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.dismiss();
      });
    }

    createExpandedMode() {
      this.expandedMode = document.createElement('div');
      this.expandedMode.className = 'fashion-fit-widget expanded';
      this.expandedMode.style.display = 'none';
      this.expandedMode.innerHTML = `
        <div class="widget-header">
          <button class="widget-close" title="Close widget">×</button>
          <h3 class="widget-title"></h3>
          <div class="brand-meta"></div>
        </div>
        <div class="widget-content">
          <div class="fit-summary-section">
            <h4 class="fit-summary-title">📏 Fit Summary</h4>
            <div class="fit-summary-text"></div>
          </div>
          
          <div class="fit-tips-section" style="display: none;">
            <h4 class="fit-tips-title">💡 Fit Tips</h4>
            <div class="tips-content"></div>
          </div>
          
          <!-- User Reviews Section -->
          <div class="reviews-section" style="display: none;">
            <h4 class="reviews-title">🔍 User Reviews & Feedback</h4>
            <div class="reviews-header">
              <div class="reviews-count"></div>
              <div class="reviews-status"></div>
            </div>
            <div class="reviews-content"></div>
          </div>
          
          <!-- Item-Specific Reviews -->
          <div class="item-reviews-section" style="display: none;">
            <h4 class="item-reviews-title">👕 Item-Specific Reviews</h4>
            <div class="item-reviews-content"></div>
          </div>
          
          <!-- Source Grouped Reviews -->
          <div class="source-reviews-section" style="display: none;">
            <h4 class="source-reviews-title">📚 Reviews by Source</h4>
            <div class="source-tabs">
              <button class="source-tab active" data-source="primary">Primary</button>
              <button class="source-tab" data-source="community">Community</button>
              <button class="source-tab" data-source="blogs">Blogs</button>
              <button class="source-tab" data-source="videos">Videos</button>
            </div>
            <div class="source-reviews-content"></div>
          </div>
          
          <!-- External Web Reviews -->
          <div class="external-reviews-section" style="display: none;">
            <h4 class="external-reviews-title">🌐 Web Reviews</h4>
            <div class="external-summary"></div>
          </div>
        </div>
        <div class="widget-footer">
          <button class="widget-btn secondary" id="back-btn">← Back</button>
          <button class="widget-btn primary" id="get-analysis-btn">Get Full Analysis</button>
        </div>
      `;

      this.widget.appendChild(this.expandedMode);

      // Add event listeners
      const closeBtn = this.expandedMode.querySelector('.widget-close');
      const backBtn = this.expandedMode.querySelector('#back-btn');
      const getAnalysisBtn = this.expandedMode.querySelector('#get-analysis-btn');

      // Close button
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.dismiss();
      });

      // Back button
      backBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.collapse();
      });

      // Get analysis button
      getAnalysisBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openFullAnalysis();
      });
      
      // Source tab event listeners
      const sourceTabs = this.expandedMode.querySelectorAll('.source-tab');
      sourceTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
          e.stopPropagation();
          this.switchSourceTab(tab.dataset.source);
        });
      });
    }

    setupEventListeners() {
      // Click outside to close
      document.addEventListener('click', (e) => {
        if (!this.widget.contains(e.target) && this.isExpanded) {
          this.collapse();
        }
      });

      // Keyboard navigation
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isExpanded) {
          this.collapse();
        }
      });
    }

    setupIntersectionObserver() {
      // Monitor if widget is intersecting with important page elements
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && this.isVisible) {
            // Widget is blocking content, consider repositioning
            this.considerRepositioning();
          }
        });
      }, {
        threshold: 0.1,
        rootMargin: '20px'
      });

      if (this.widget) {
        observer.observe(this.widget);
      }
    }

    considerRepositioning() {
      // Simple repositioning logic - could be enhanced
      const currentPosition = this.position;
      const positions = ['top-right', 'top-left', 'bottom-right', 'bottom-left'];
      const currentIndex = positions.indexOf(currentPosition);
      const nextPosition = positions[(currentIndex + 1) % positions.length];
      
      this.position = nextPosition;
      this.updateWidgetPosition();
      
      // Save preference
      chrome.storage.sync.set({ position: nextPosition });
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
        console.log('🎯 FashionWidget: Checking for existing brand data...');
        
        // Try to get brand data from background script (if available) with timeout
        let response = null;
        try {
          const messagePromise = chrome.runtime.sendMessage({
            type: 'GET_BRAND_DATA'
          });
          
          // Add timeout to prevent hanging
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Message timeout')), 1000)
          );
          
          response = await Promise.race([messagePromise, timeoutPromise]);
        } catch (messageError) {
          console.log('🎯 FashionWidget: Background script not available or timed out, proceeding with universal detection');
        }
        
        if (response && response.brandName) {
          console.log('🎯 FashionWidget: Found existing brand data:', response.brandName);
          this.handleBrandDetected(response);
        } else {
          console.log('🎯 FashionWidget: No existing brand data, running universal detection...');
          // Always run universal detection as fallback
          this.detectBrandFromPage();
        }
      } catch (error) {
        console.error('🎯 FashionWidget: Error checking existing brand data:', error);
        // Always run universal detection as fallback
        this.detectBrandFromPage();
      }
    }

    detectBrandFromPage() {
      try {
        console.log('🎯 FashionWidget: Starting universal fashion website detection...');
        
        // Use the new universal detection system
        const detectionResults = this.detectFashionWebsite();
        
        if (detectionResults.isFashionWebsite) {
          console.log('🎯 FashionWidget: Fashion website detected with confidence:', detectionResults.confidence);
          
          // Create brand data from detection results
          const brandData = {
            brandName: detectionResults.detectedBrand || 'Fashion Brand',
            category: detectionResults.fashionType || 'general',
            hasData: false,
            searchType: 'universal-detection',
            recommendation: `Fashion website detected! ${detectionResults.reasons.join(' ')}`,
            externalSearchResults: null,
            fitTips: [],
            sizeGuide: null,
            timestamp: Date.now(),
            error: false,
            detectionDetails: detectionResults
          };
          
          this.handleBrandDetected(brandData);
          
          // Try to fetch data for the detected brand
          if (detectionResults.detectedBrand) {
            this.fetchBrandDataForDetectedBrand(detectionResults.detectedBrand);
          }
          
        } else {
          console.log('🎯 FashionWidget: Not a fashion website (confidence:', detectionResults.confidence, ')');
          
          // Show manual input for potential fashion sites with low confidence
          if (detectionResults.confidence >= 30) {
            console.log('🎯 FashionWidget: Low confidence fashion indicators, showing manual input...');
            this.showManualBrandInput();
          } else {
            console.log('🎯 FashionWidget: No fashion indicators found, showing fallback widget...');
            this.showFallbackWidget();
          }
        }
        
      } catch (error) {
        console.error('🎯 FashionWidget: Error during universal detection:', error);
        this.showManualBrandInput();
      }
    }

    // Extract brand from text content using common patterns
    extractBrandFromText(text) {
      if (!text) return null;
      
      const lowerText = text.toLowerCase();
      
      // Common fashion brand patterns with variations
      const brandPatterns = [
        /reformation/i,
        /everlane/i,
        /ganni/i,
        /asos/i,
        /zara/i,
        /h&m/i,
        /mango/i,
        /uniqlo/i,
        /cos/i,
        /arket/i,
        /massimo\s*dutti/i,
        /bershka/i,
        /pull\s*&\s*bear/i,
        /stradivarius/i,
        /urban\s*outfitters/i,
        /anthropologie/i,
        /free\s*people/i,
        /madewell/i,
        /revolve/i,
        /shopbop/i,
        /nordstrom/i,
        /bloomingdale/i,
        /saks\s*fifth\s*avenue/i,
        /neiman\s*marcus/i,
        /bergdorf\s*goodman/i,
        /barneys/i,
        /net\s*a\s*porter/i,
        /matches\s*fashion/i,
        /farfetch/i,
        /ssense/i,
        /lyst/i
      ];
      
      for (const pattern of brandPatterns) {
        const match = lowerText.match(pattern);
        if (match) {
          return match[0];
        }
      }
      
      return null;
    }

    // Extract brand from URL
    extractBrandFromUrl(url) {
      try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname.toLowerCase();
        
        // Remove common TLDs and subdomains
        const cleanHostname = hostname
          .replace(/^www\./, '')
          .replace(/\.com$/, '')
          .replace(/\.co\.uk$/, '')
          .replace(/\.de$/, '')
          .replace(/\.fr$/, '')
          .replace(/\.it$/, '')
          .replace(/\.es$/, '')
          .replace(/\.ca$/, '');
        
        // Check if it's a known brand
        if (cleanHostname.length > 2 && cleanHostname.length < 20) {
          return cleanHostname.charAt(0).toUpperCase() + cleanHostname.slice(1);
        }
      } catch (error) {
        // URL parsing failed
      }
      
      return null;
    }

    // Clean brand name for consistency
    cleanBrandName(brandName) {
      if (!brandName) return null;
      
      return brandName
        .replace(/[^\w\s]/g, ' ') // Remove special characters
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim()
        .replace(/^\w/, c => c.toUpperCase()); // Capitalize first letter
    }

    // Show manual brand input when automatic detection fails
    showManualBrandInput() {
      console.log('🎯 FashionWidget: Showing manual brand input...');
      
      // Create manual input overlay
      const manualInput = document.createElement('div');
      manualInput.id = 'fashion-widget-manual-input';
      manualInput.innerHTML = `
        <div class="manual-input-overlay">
          <div class="manual-input-content">
            <h3>🎯 Fashion Widget</h3>
            <p>We couldn't automatically detect the brand on this page.</p>
            <p>Please enter the brand name manually:</p>
            <input type="text" id="manual-brand-input" placeholder="e.g., Reformation, GANNI, ASOS..." />
            <div class="manual-input-buttons">
              <button id="manual-brand-submit" class="btn-primary">Search Brand</button>
              <button id="manual-brand-skip" class="btn-secondary">Skip</button>
            </div>
            <div class="manual-input-suggestions">
              <p><strong>Popular brands:</strong></p>
              <div class="brand-suggestions">
                <span class="brand-suggestion" data-brand="Reformation">Reformation</span>
                <span class="brand-suggestion" data-brand="GANNI">GANNI</span>
                <span class="brand-suggestion" data-brand="ASOS">ASOS</span>
                <span class="brand-suggestion" data-brand="Zara">Zara</span>
                <span class="brand-suggestion" data-brand="H&M">H&M</span>
              </div>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(manualInput);
      
      // Add event listeners
      const submitBtn = manualInput.querySelector('#manual-brand-submit');
      const skipBtn = manualInput.querySelector('#manual-brand-skip');
      const input = manualInput.querySelector('#manual-brand-input');
      const suggestions = manualInput.querySelectorAll('.brand-suggestion');
      
      submitBtn.addEventListener('click', () => {
        const brandName = input.value.trim();
        if (brandName) {
          this.handleManualBrandInput(brandName);
          manualInput.remove();
        }
      });
      
      skipBtn.addEventListener('click', () => {
        manualInput.remove();
        this.showFallbackWidget();
      });
      
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          submitBtn.click();
        }
      });
      
      suggestions.forEach(suggestion => {
        suggestion.addEventListener('click', () => {
          input.value = suggestion.dataset.brand;
          submitBtn.click();
        });
      });
      
      // Auto-focus input
      input.focus();
    }

    // Handle manual brand input
    handleManualBrandInput(brandName) {
      console.log('🎯 FashionWidget: Manual brand input received:', brandName);
      
      const brandData = {
        brandName: brandName,
        category: 'general',
        hasData: false,
        searchType: 'manual-input',
        recommendation: `Brand entered manually: ${brandName}. Searching for fit information...`,
        externalSearchResults: null,
        fitTips: [],
        sizeGuide: null,
        timestamp: Date.now(),
        error: false
      };
      
      this.handleBrandDetected(brandData);
      
      // Try to fetch data for this brand
      this.fetchBrandDataForDetectedBrand(brandName);
    }

    // Show fallback widget when no brand is available
    showFallbackWidget() {
      console.log('🎯 FashionWidget: Showing fallback widget...');
      
      const brandData = {
        brandName: 'Fashion Website',
        category: 'general',
        hasData: false,
        searchType: 'fallback',
        recommendation: 'Unable to detect fashion website automatically. You can manually enter a brand name.',
        externalSearchResults: null,
        fitTips: [],
        sizeGuide: null,
        timestamp: Date.now(),
        error: false,
        detectionDetails: null
      };
      
      this.handleBrandDetected(brandData);
    }

    switchSourceTab(source) {
      // Update active tab
      const sourceTabs = this.expandedMode.querySelectorAll('.source-tab');
      sourceTabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.source === source);
      });
      
      // Update content based on selected source
      if (this.brandData && this.brandData.externalSearchResults && this.brandData.externalSearchResults.groupedReviews) {
        const sourceReviewsContentEl = this.expandedMode.querySelector('.source-reviews-content');
        const sourceReviews = this.brandData.externalSearchResults.groupedReviews[source] || [];
        
        sourceReviewsContentEl.innerHTML = `
          <div class="source-reviews-content-inner">
            ${sourceReviews.length > 0 ? sourceReviews.map(review => `
              <div class="source-review-item">
                <div class="review-header">
                  <span class="review-source">${review.source}</span>
                  <span class="review-confidence confidence-${review.confidence}">${review.confidence}</span>
                </div>
                <div class="review-title">${review.title}</div>
                <div class="review-snippet">${review.snippet}</div>
                <div class="review-tags">
                  ${review.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
                <a href="${review.url}" target="_blank" class="review-link">Read full review →</a>
              </div>
            `).join('') : '<div class="no-reviews">No reviews found for this source type.</div>'}
          </div>
        `;
      }
    }

    async fetchBrandDataForDetectedBrand(brandName) {
      try {
        console.log('🎯 FashionWidget: Fetching data for manually detected brand:', brandName);
        
        // Extract item name from page title
        const itemName = this.extractItemNameFromPage();
        
        // Use production API endpoint - process.env doesn't work in browser extensions
        const apiUrl = 'https://www.pointfour.in/api/extension/search-reviews';
        
        console.log('🎯 FashionWidget: Fetching from API:', apiUrl);
        
        // Try to fetch data from our API with both brand and item
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            brand: brandName, 
            itemName: itemName || '' 
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // Update the widget with real data
            const enhancedBrandData = {
              brandName,
              category: 'general',
              hasData: data.totalResults > 0,
              searchType: 'web-search',
              recommendation: data.brandFitSummary ? 
                `${data.brandFitSummary.summary} (Based on ${data.totalResults} web search results)` :
                `Limited information available for ${brandName}. Check their size guide for best fit.`,
              externalSearchResults: data,
              fitTips: [],
              sizeGuide: null,
              timestamp: Date.now(),
              error: false
            };
            
            this.handleBrandDetected(enhancedBrandData);
            console.log('🎯 FashionWidget: Successfully fetched data for manually detected brand');
          } else {
            console.log('🎯 FashionWidget: API returned success: false');
            // Still show widget with basic info even if API fails
            this.handleBrandDetected({
              brandName,
              category: 'general',
              hasData: false,
              searchType: 'manual-detection',
              recommendation: `Brand detected: ${brandName}. Limited information available.`,
              externalSearchResults: null,
              fitTips: [],
              sizeGuide: null,
              timestamp: Date.now(),
              error: false
            });
          }
        } else {
          console.log('🎯 FashionWidget: API response not ok:', response.status);
          // Show widget with basic info even if API fails
          this.handleBrandDetected({
            brandName,
            category: 'general',
            hasData: false,
            searchType: 'manual-detection',
            recommendation: `Brand detected: ${brandName}. Limited information available.`,
            externalSearchResults: null,
            fitTips: [],
            sizeGuide: null,
            timestamp: Date.now(),
            error: false
          });
        }
      } catch (error) {
        console.error('🎯 FashionWidget: Error fetching data for manually detected brand:', error);
        // Show widget with basic info even if API fails
        this.handleBrandDetected({
          brandName,
          category: 'general',
          hasData: false,
          searchType: 'manual-detection',
          recommendation: `Brand detected: ${brandName}. Limited information available.`,
          externalSearchResults: null,
          fitTips: [],
          sizeGuide: null,
          timestamp: Date.now(),
          error: false
        });
      }
    }

    extractItemNameFromPage() {
      try {
        // Try to extract item name from page title first
        const title = document.title;
        if (title && title.trim()) {
          // Remove common website suffixes and clean up
          let cleanTitle = title.trim();
          
          // Remove common website name patterns
          cleanTitle = cleanTitle.replace(/\s*[-|]\s*(Reformation|GANNI|ASOS|And Other Stories|Intimissimi|Zara|H&M|Mango|Uniqlo|COS|Arket|Massimo Dutti|Bershka|Pull&Bear|Stradivarius|Urban Outfitters|Anthropologie|Free People|Madewell|Everlane|Revolve|Shopbop|Nordstrom|Bloomingdale's|Saks Fifth Avenue|Neiman Marcus|Bergdorf Goodman|Barneys|Net-a-Porter|Matches Fashion|Farfetch|SSENSE|Lyst|The RealReal|Poshmark|Depop|Vestiaire Collective|Grailed|StockX|GOAT|Flight Club|Stadium Goods)\s*$/i, '');
          
          // Remove common separators and clean up
          cleanTitle = cleanTitle.replace(/\s*[-|]\s*$/, '');
          cleanTitle = cleanTitle.replace(/^\s*[-|]\s*/, '');
          
          // Remove common product page suffixes
          cleanTitle = cleanTitle.replace(/\s*(Buy|Shop|Purchase|Order|Add to Cart|Add to Bag|View|Details|Product|Item)\s*$/i, '');
          
          // Remove common size/color indicators that might be in titles
          cleanTitle = cleanTitle.replace(/\s*(XS|S|M|L|XL|XXL|0|2|4|6|8|10|12|14|16|18|20|22|24|26|28|30|32|34|36|38|40|42|44|46|48|50)\s*$/i, '');
          cleanTitle = cleanTitle.replace(/\s*(Black|White|Blue|Red|Green|Yellow|Pink|Purple|Orange|Brown|Gray|Grey|Navy|Beige|Cream|Ivory|Tan|Olive|Maroon|Burgundy|Rust|Coral|Teal|Turquoise|Lavender|Mint|Rose|Gold|Silver|Bronze|Copper)\s*$/i, '');
          
          // Clean up extra whitespace
          cleanTitle = cleanTitle.replace(/\s+/g, ' ').trim();
          
          if (cleanTitle.length > 3 && cleanTitle.length < 200) {
            return cleanTitle;
          }
        }
        
        // Fallback: try to extract from URL path
        try {
          const urlObj = new URL(window.location.href);
          const pathParts = urlObj.pathname.split('/').filter(part => part.length > 0);
          
          // Look for meaningful path segments (skip common words)
          const meaningfulParts = pathParts.filter(part => 
            part.length > 2 && 
            !['product', 'item', 'clothing', 'dress', 'shirt', 'pants', 'shoes', 'accessories', 'women', 'men', 'kids', 'sale', 'new', 'trending'].includes(part.toLowerCase())
          );
          
          if (meaningfulParts.length > 0) {
            // Take the last meaningful part and clean it up
            let urlItemName = meaningfulParts[meaningfulParts.length - 1];
            urlItemName = urlItemName.replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();
            
            // Remove common URL suffixes
            urlItemName = urlItemName.replace(/\s*(html|htm|php|asp|aspx|jsp|do|action)\s*$/i, '');
            
            if (urlItemName.length > 3 && urlItemName.length < 100) {
              return urlItemName;
            }
          }
        } catch (error) {
          // URL parsing failed, continue to fallback
        }
        
        // Final fallback
        return null;
      } catch (error) {
        console.error('Error extracting item name:', error);
        return null;
      }
    }

    handleBrandDetected(brandData) {
      console.log('🎯 FashionWidget: Brand detected:', brandData);
      this.brandData = brandData;
      
      // Ensure preferences.enabled has a default value
      if (this.preferences.enabled === undefined) {
        this.preferences.enabled = true;
      }
      
      // Show widget if enabled and not dismissed
      if (this.preferences.enabled && !this.isDismissed) {
        console.log('🎯 FashionWidget: Showing widget...');
        
        // Small delay to ensure smooth appearance
        setTimeout(() => {
          this.show();
          this.updateContent(brandData);
          
          // Ensure widget is visible even if content update fails
          setTimeout(() => {
            if (this.widget && this.widget.style.opacity === '0') {
              console.log('🎯 FashionWidget: Forcing widget visibility...');
              this.widget.style.opacity = '1';
              this.widget.style.transform = this.widget.style.transform.replace('scale(0.9)', 'scale(1)');
            }
          }, 100);
        }, 200);
        
        // Remove auto-hide - make it persistent
        // if (!this.preferences.autoExpand) {
        //   this.startAutoHideTimer();
        // }
      } else {
        console.log('🎯 FashionWidget: Widget not shown - enabled:', this.preferences.enabled, 'dismissed:', this.isDismissed);
        
        // Force show widget if detection succeeded but preferences are blocking it
        if (brandData && !this.isDismissed) {
          console.log('🎯 FashionWidget: Forcing widget show despite preferences...');
          this.preferences.enabled = true;
          this.show();
          this.updateContent(brandData);
        }
      }
    }

    handleUrlChange() {
      // Hide widget when URL changes
      this.hide();
      this.brandData = null;
      this.isDismissed = false;
      
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
      
      if (changes.position !== undefined) {
        this.position = changes.position;
        this.updateWidgetPosition();
      }
      
      if (changes.theme !== undefined) {
        this.updateTheme();
      }
      
      if (changes.widgetOpacity !== undefined) {
        this.updateOpacity();
      }
    }

    show() {
      if (this.isVisible) return;
      
      console.log('🎯 FashionWidget: Showing widget...');
      
      this.isVisible = true;
      this.lastShowTime = Date.now();
      
      // Ensure widget exists and is positioned
      if (!this.widget) {
        console.log('🎯 FashionWidget: Widget not created, creating now...');
        this.createWidget();
      }
      
      // Force the widget to be visible and properly sized
      this.widget.style.setProperty('visibility', 'visible', 'important');
      this.widget.style.setProperty('display', 'block', 'important');
      this.widget.style.setProperty('opacity', '1', 'important');
      this.widget.style.setProperty('transform', 'scale(1)', 'important');
      this.widget.style.setProperty('width', '350px', 'important');
      this.widget.style.setProperty('height', 'auto', 'important');
      this.widget.style.setProperty('min-height', '120px', 'important');
      this.widget.style.setProperty('overflow', 'visible', 'important');
      this.widget.style.setProperty('position', 'fixed', 'important');
      this.widget.style.setProperty('z-index', '999999', 'important');
      
      // Ensure it's positioned correctly
      this.updateWidgetPosition();
      
      // Load and apply Inter font
      this.loadInterFont();
      
      console.log('🎯 FashionWidget: Widget should now be visible');
      console.log('🎯 FashionWidget: Widget styles:', {
        visibility: this.widget.style.visibility,
        display: this.widget.style.display,
        opacity: this.widget.style.opacity,
        transform: this.widget.style.transform,
        position: this.widget.style.position,
        zIndex: this.widget.style.zIndex,
        width: this.widget.style.width,
        height: this.widget.style.height,
        minHeight: this.widget.style.minHeight
      });
      console.log('🎯 FashionWidget: Widget bounding rect:', this.widget.getBoundingClientRect());
    }

    hide() {
      console.log('🎯 FashionWidget: hide() called');
      if (!this.isVisible) {
        console.log('🎯 FashionWidget: Already hidden, returning');
        return;
      }
      
      // Prevent hiding too quickly after showing
      if (this.lastShowTime && Date.now() - this.lastShowTime < 3000) {
        console.log('🎯 FashionWidget: Widget shown too recently, preventing hide');
        return;
      }
      
      this.isVisible = false;
      
      // Animate out
      this.widget.style.opacity = '0';
      this.widget.style.transform = this.widget.style.transform.replace('scale(1)', 'scale(0.9)');
      
      setTimeout(() => {
        if (!this.isVisible) {
          this.widget.style.visibility = 'hidden';
          this.widget.style.display = 'none';
          console.log('🎯 FashionWidget: Widget is now hidden');
        }
      }, 300);
      
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
      
      // Smooth transition
      this.minimalMode.style.opacity = '0';
      this.minimalMode.style.transform = 'scale(0.9)';
      
      setTimeout(() => {
        this.minimalMode.style.display = 'none';
        this.expandedMode.style.display = 'block';
        
        // Trigger animation
        requestAnimationFrame(() => {
          this.expandedMode.style.opacity = '1';
          this.expandedMode.style.transform = 'scale(1)';
        });
      }, 150);
      
      // Stop auto-hide timer
      this.stopAutoHideTimer();
      
      // Update tab state
      this.updateTabState();
    }

    collapse() {
      if (!this.isExpanded) return;
      
      this.isExpanded = false;
      
      // Smooth transition
      this.expandedMode.style.opacity = '0';
      this.expandedMode.style.transform = 'scale(0.9)';
      
      setTimeout(() => {
        this.expandedMode.style.display = 'none';
        this.minimalMode.style.display = 'block';
        
        // Trigger animation
        requestAnimationFrame(() => {
          this.minimalMode.style.opacity = '1';
          this.minimalMode.style.transform = 'scale(1)';
        });
      }, 150);
      
      // Remove auto-hide timer restart - keep it persistent
      // if (!this.preferences.autoExpand) {
      //   this.startAutoHideTimer();
      // }
      
      // Update tab state
      this.updateTabState();
    }

    updateContent(brandData) {
      try {
        console.log('🎯 FashionWidget: Updating content with brand data:', brandData);
        
        // Update minimal mode
        const brandName = this.minimalMode.querySelector('.brand-name');
        const fitSummary = this.minimalMode.querySelector('.fit-summary');
        
        if (brandName) brandName.textContent = brandData.brandName || 'Fashion Brand';
        if (fitSummary) fitSummary.textContent = brandData.recommendation || 'Loading fit information...';
        
        // Update expanded mode
        const title = this.expandedMode.querySelector('.widget-title');
        const meta = this.expandedMode.querySelector('.brand-meta');
        const summaryText = this.expandedMode.querySelector('.fit-summary-text');
        
        if (title) title.textContent = brandData.brandName || 'Fashion Brand';
        if (summaryText) summaryText.textContent = brandData.recommendation || 'Loading fit information...';
        
        // Update meta information
        if (meta) {
          meta.innerHTML = `
            <div class="meta-item">
              <span class="meta-icon">🎯</span>
              <span>${brandData.searchType || 'auto-detection'}</span>
            </div>
            <div class="meta-item">
              <span class="meta-icon">📅</span>
              <span>${new Date(brandData.timestamp).toLocaleDateString()}</span>
            </div>
          `;
        }
        
        // Show reviews section if we have review data
        if (brandData.externalSearchResults && brandData.externalSearchResults.length > 0) {
          this.showReviewsSection(brandData.externalSearchResults);
        } else if (brandData.externalSearchResults && brandData.externalSearchResults.reviews) {
          // Handle structured review data
          this.showStructuredReviews(brandData.externalSearchResults);
        }
        
        // Show fit tips if available
        if (brandData.fitTips && brandData.fitTips.length > 0) {
          this.showFitTipsSection(brandData.fitTips);
        }
        
        // Apply Inter font to new content
        this.applyInterFont();
        
        console.log('🎯 FashionWidget: Content updated successfully');
        
      } catch (error) {
        console.error('🎯 FashionWidget: Error updating content:', error);
      }
    }

    // Show structured reviews from API response
    showStructuredReviews(data) {
      console.log('🎯 FashionWidget: Showing structured reviews:', data);
      
      // Show reviews section
      const reviewsSection = this.expandedMode.querySelector('.reviews-section');
      if (reviewsSection) {
        reviewsSection.style.display = 'block';
        
        const reviewsCount = reviewsSection.querySelector('.reviews-count');
        const reviewsContent = reviewsSection.querySelector('.reviews-content');
        
        if (reviewsCount) {
          const totalReviews = data.totalResults || data.reviews?.length || 0;
          reviewsCount.textContent = `${totalReviews} reviews found`;
        }
        
        if (reviewsContent && data.reviews) {
          reviewsContent.innerHTML = data.reviews.map(review => `
            <div class="review-item">
              <div class="review-source">${review.source || 'Web Review'}</div>
              <div class="review-text">${review.snippet || review.content || review.title || 'No content available'}</div>
              <div class="review-meta">
                <span class="review-date">${review.date || 'Unknown date'}</span>
                <span class="review-rating">${review.rating || 'No rating'}</span>
              </div>
            </div>
          `).join('');
        }
      }
      
      // Show item-specific reviews if available
      if (data.itemReviews && data.itemReviews.length > 0) {
        this.showItemReviewsSection(data.itemReviews);
      }
      
      // Show source-grouped reviews if available
      if (data.groupedReviews) {
        this.showSourceReviewsSection(data.groupedReviews);
      }
    }

    // Show item-specific reviews
    showItemReviewsSection(itemReviews) {
      const itemReviewsSection = this.expandedMode.querySelector('.item-reviews-section');
      const itemReviewsContent = itemReviewsSection.querySelector('.item-reviews-content');
      
      if (itemReviewsSection && itemReviewsContent) {
        itemReviewsSection.style.display = 'block';
        itemReviewsContent.innerHTML = itemReviews.map(review => `
          <div class="review-item">
            <div class="review-source">${review.source || 'Item Review'}</div>
            <div class="review-text">${review.snippet || review.content || 'No content available'}</div>
            <div class="review-meta">
              <span class="review-date">${review.date || 'Unknown date'}</span>
              <span class="review-rating">${review.rating || 'No rating'}</span>
            </div>
          </div>
        `).join('');
      }
    }

    // Show source-grouped reviews
    showSourceReviewsSection(groupedReviews) {
      const sourceReviewsSection = this.expandedMode.querySelector('.source-reviews-section');
      if (sourceReviewsSection) {
        sourceReviewsSection.style.display = 'block';
        
        const sourceReviewsContent = sourceReviewsSection.querySelector('.source-reviews-content');
        if (sourceReviewsContent) {
          // Show primary reviews by default
          const primaryReviews = groupedReviews.primary || [];
          sourceReviewsContent.innerHTML = primaryReviews.map(review => `
            <div class="review-item">
              <div class="review-source">${review.source || 'Primary'}</div>
              <div class="review-text">${review.snippet || review.content || 'No content available'}</div>
              <div class="review-meta">
                <span class="review-date">${review.date || 'Unknown date'}</span>
                <span class="review-rating">${review.rating || 'No rating'}</span>
              </div>
            </div>
          `).join('');
        }
      }
    }

    // Show reviews section with data
    showReviewsSection(reviews) {
      const reviewsSection = this.expandedMode.querySelector('.reviews-section');
      const reviewsCount = this.expandedMode.querySelector('.reviews-count');
      const reviewsContent = this.expandedMode.querySelector('.reviews-content');
      
      if (reviewsSection && reviewsCount && reviewsContent) {
        reviewsSection.style.display = 'block';
        reviewsCount.textContent = `${reviews.length} reviews found`;
        
        // Display reviews
        reviewsContent.innerHTML = reviews.map(review => `
          <div class="review-item">
            <div class="review-source">${review.source || 'Web'}</div>
            <div class="review-text">${review.snippet || review.content || 'No content available'}</div>
            <div class="review-meta">
              <span class="review-date">${review.date || 'Unknown date'}</span>
              <span class="review-rating">${review.rating || 'No rating'}</span>
            </div>
          </div>
        `).join('');
      }
    }

    // Show fit tips section
    showFitTipsSection(fitTips) {
      const fitTipsSection = this.expandedMode.querySelector('.fit-tips-section');
      const tipsContent = this.expandedMode.querySelector('.tips-content');
      
      if (fitTipsSection && tipsContent) {
        fitTipsSection.style.display = 'block';
        tipsContent.innerHTML = fitTips.map(tip => `
          <div class="fit-tip-item">
            <span class="tip-icon">💡</span>
            <span class="tip-text">${tip}</span>
          </div>
        `).join('');
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

    extractFitTips(recommendation) {
      // Extract actionable tips from recommendation
      const tips = [];
      const sentences = recommendation.split('.');
      
      sentences.forEach(sentence => {
        const trimmed = sentence.trim().toLowerCase();
        if (trimmed.includes('size up') || trimmed.includes('size down') || 
            trimmed.includes('order') || trimmed.includes('try') ||
            trimmed.includes('recommend') || trimmed.includes('suggest')) {
          tips.push(sentence.trim());
        }
      });
      
      return tips.slice(0, 3); // Limit to 3 tips
    }

    startAutoHideTimer() {
      this.stopAutoHideTimer();
      this.autoHideTimer = setTimeout(() => {
        this.hide();
      }, this.preferences.autoHideDelay);
    }

    stopAutoHideTimer() {
      if (this.autoHideTimer) {
        clearTimeout(this.autoHideTimer);
        this.autoHideTimer = null;
      }
    }

    dismiss() {
      // Prevent dismissing too quickly after showing
      if (this.isVisible && Date.now() - this.lastShowTime < 5000) {
        console.log('🎯 FashionWidget: Widget shown too recently, preventing dismiss');
        return;
      }
      
      this.isDismissed = true;
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
      if (isDark) {
        this.widget.classList.add('dark');
      } else {
        this.widget.classList.remove('dark');
      }
    }

    updateOpacity() {
      // Update widget opacity based on preferences
      const opacity = this.preferences.widgetOpacity;
      this.minimalMode.style.background = `rgba(245, 245, 244, ${opacity})`; // stone-100
      this.expandedMode.style.background = `rgba(250, 250, 249, ${opacity})`; // stone-50
    }

    updateTabState() {
      try {
        chrome.runtime.sendMessage({
          type: 'UPDATE_TAB_STATE',
          state: {
            isVisible: this.isVisible,
            isExpanded: this.isExpanded,
            dismissed: this.isDismissed,
            position: this.position
          }
        });
      } catch (error) {
        console.error('Error updating tab state:', error);
      }
    }

    // Force show widget - bypasses all checks
    forceShow() {
      console.log('🎯 FashionWidget: Force showing widget...');
      
      this.isVisible = true;
      this.isDismissed = false;
      
      // Ensure widget is properly positioned
      this.updateWidgetPosition();
      
      // Make it visible immediately
      this.widget.style.visibility = 'visible';
      this.widget.style.display = 'block';
      this.widget.style.opacity = '1';
      this.widget.style.transform = this.widget.style.transform.replace('scale(0.9)', 'scale(1)');
      
      // Update content
      this.updateContent();
      
      console.log('🎯 FashionWidget: Widget force shown');
      this.updateTabState();
    }

    // Manual trigger for testing
    manualTrigger() {
      console.log('🎯 FashionWidget: Manual trigger activated');
      if (!this.widget) {
        console.log('🎯 FashionWidget: Widget not created, creating now...');
        this.createWidget();
      }
      
      // Force show widget
      this.forceShow();
      
      console.log('🎯 FashionWidget: Manual trigger complete');
    }

    // Expose manual trigger globally for testing
    exposeForTesting() {
      window.testFashionWidget = {
        show: () => this.manualTrigger(),
        forceShow: () => this.forceShow(),
        hide: () => this.hide(),
        expand: () => this.expand(),
        collapse: () => this.collapse(),
        position: () => this.updateWidgetPosition(),
        manualInput: () => this.showManualBrandInput(),
        detectBrand: () => this.detectBrandFromPage(),
        universalDetection: () => this.detectFashionWebsite(),
        analyzeContent: () => this.analyzeFashionContent(),
        analyzeEcommerce: () => this.detectEcommercePatterns(),
        analyzeUrl: () => this.analyzeUrlPatterns(),
        analyzeVisual: () => this.analyzeVisualElements(),
        extractBrand: () => this.extractBrandFromContext(),
        widget: this.widget
      };
      console.log('🎯 FashionWidget: Testing methods exposed to window.testFashionWidget');
    }

    // Load Inter font and apply to widget
    loadInterFont() {
      try {
        // Check if Inter font is already loaded
        if (document.fonts && document.fonts.check('1em Inter')) {
          console.log('🎨 FashionWidget: Inter font already loaded');
          this.applyInterFont();
          return;
        }

        // Load Inter font from Google Fonts
        const link = document.createElement('link');
        link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap';
        link.rel = 'stylesheet';
        link.type = 'text/css';
        
        link.onload = () => {
          console.log('🎨 FashionWidget: Inter font loaded successfully');
          this.applyInterFont();
        };
        
        link.onerror = () => {
          console.warn('🎨 FashionWidget: Failed to load Inter font, using fallbacks');
          this.applyInterFont();
        };
        
        document.head.appendChild(link);
        
        // Fallback: Apply font after a short delay
        setTimeout(() => {
          this.applyInterFont();
        }, 1000);
        
      } catch (error) {
        console.error('🎨 FashionWidget: Error loading Inter font:', error);
        this.applyInterFont();
      }
    }

    // Apply Inter font to widget elements
    applyInterFont() {
      try {
        if (!this.widget) return;
        
        const interFont = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
        
        // Apply to main widget
        this.widget.style.setProperty('font-family', interFont, 'important');
        
        // Apply to all child elements
        const allElements = this.widget.querySelectorAll('*');
        allElements.forEach(element => {
          element.style.setProperty('font-family', interFont, 'important');
        });
        
        // Apply to specific text elements with enhanced specificity
        const textElements = this.widget.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div, button, input, label');
        textElements.forEach(element => {
          element.style.setProperty('font-family', interFont, 'important');
        });
        
        console.log('🎨 FashionWidget: Inter font applied to widget and all elements');
        
      } catch (error) {
        console.error('🎨 FashionWidget: Error applying Inter font:', error);
      }
    }

    // Universal fashion website detection
    detectFashionWebsite() {
      try {
        console.log('🎯 FashionWidget: Starting universal fashion website detection...');
        console.log('🎯 FashionWidget: Current URL:', window.location.href);
        console.log('🎯 FashionWidget: Page title:', document.title);
        
        const detectionResults = {
          isFashionWebsite: false,
          confidence: 0,
          detectedBrand: null,
          fashionType: null,
          targetDemographic: null,
          indicators: [],
          reasons: []
        };
        
        // 1. Content Analysis (40% weight)
        console.log('🎯 FashionWidget: Running content analysis...');
        const contentScore = this.analyzeFashionContent();
        detectionResults.indicators.push(`Content analysis: ${contentScore.score}/100`);
        console.log('🎯 FashionWidget: Content analysis score:', contentScore.score);
        
        // 2. E-commerce Pattern Detection (30% weight)
        console.log('🎯 FashionWidget: Running e-commerce pattern detection...');
        const ecommerceScore = this.detectEcommercePatterns();
        detectionResults.indicators.push(`E-commerce patterns: ${ecommerceScore.score}/100`);
        console.log('🎯 FashionWidget: E-commerce pattern score:', ecommerceScore.score);
        
        // 3. URL Analysis (20% weight)
        console.log('🎯 FashionWidget: Running URL analysis...');
        const urlScore = this.analyzeUrlPatterns();
        detectionResults.indicators.push(`URL analysis: ${urlScore.score}/100`);
        console.log('🎯 FashionWidget: URL analysis score:', urlScore.score);
        
        // 4. Visual Elements Analysis (10% weight)
        console.log('🎯 FashionWidget: Running visual analysis...');
        const visualScore = this.analyzeVisualElements();
        detectionResults.indicators.push(`Visual analysis: ${visualScore.score}/100`);
        console.log('🎯 FashionWidget: Visual analysis score:', visualScore.score);
        
        // Calculate weighted confidence score
        const weightedScore = (
          (contentScore.score * 0.4) +
          (ecommerceScore.score * 0.3) +
          (urlScore.score * 0.2) +
          (visualScore.score * 0.1)
        );
        
        detectionResults.confidence = Math.round(weightedScore);
        detectionResults.isFashionWebsite = weightedScore >= 60; // Threshold for fashion website
        
        console.log('🎯 FashionWidget: Weighted score calculation:', {
          content: contentScore.score * 0.4,
          ecommerce: ecommerceScore.score * 0.3,
          url: urlScore.score * 0.2,
          visual: visualScore.score * 0.1,
          total: weightedScore,
          confidence: detectionResults.confidence,
          isFashionWebsite: detectionResults.isFashionWebsite
        });
        
        // Extract brand information
        if (detectionResults.isFashionWebsite) {
          console.log('🎯 FashionWidget: Fashion website detected, extracting brand...');
          detectionResults.detectedBrand = this.extractBrandFromContext();
          detectionResults.fashionType = this.classifyFashionType();
          detectionResults.targetDemographic = this.detectTargetDemographic();
        }
        
        // Generate reasons
        detectionResults.reasons = this.generateDetectionReasons(detectionResults);
        
        console.log('🎯 FashionWidget: Final detection results:', detectionResults);
        return detectionResults;
        
      } catch (error) {
        console.error('🎯 FashionWidget: Error in universal detection:', error);
        return {
          isFashionWebsite: false,
          confidence: 0,
          detectedBrand: null,
          fashionType: null,
          targetDemographic: null,
          indicators: ['Detection error occurred'],
          reasons: ['Technical error prevented detection']
        };
      }
    }

    // Analyze page content for fashion indicators
    analyzeFashionContent() {
      try {
        const text = document.body.textContent.toLowerCase();
        let score = 0;
        const foundTerms = [];
        
        // Fashion product categories (high weight)
        const fashionCategories = [
          'dress', 'dresses', 'shirt', 'shirts', 'pants', 'jeans', 'skirt', 'skirts',
          'blouse', 'blouses', 'jacket', 'jackets', 'coat', 'coats', 'sweater', 'sweaters',
          'hoodie', 'hoodies', 't-shirt', 't-shirts', 'tshirt', 'tshirts', 'top', 'tops',
          'shorts', 'jumpsuit', 'jumpsuits', 'romper', 'rompers', 'cardigan', 'cardigans',
          'blazer', 'blazers', 'vest', 'vests', 'tank top', 'tank tops', 'tanktop', 'tanktops'
        ];
        
        fashionCategories.forEach(term => {
          if (text.includes(term)) {
            score += 3;
            foundTerms.push(term);
          }
        });
        
        // Activewear and sportswear (high weight for Lululemon, etc.)
        const activewearTerms = [
          'leggings', 'legging', 'athletic', 'athleisure', 'workout', 'gym', 'fitness',
          'yoga', 'pilates', 'running', 'training', 'performance', 'moisture wicking',
          'compression', 'sports bra', 'sports bras', 'joggers', 'jogger', 'biker shorts',
          'tennis skirt', 'tennis skirts', 'golf', 'swimming', 'cycling', 'hiking'
        ];
        
        activewearTerms.forEach(term => {
          if (text.includes(term)) {
            score += 4; // Higher weight for activewear
            foundTerms.push(term);
          }
        });
        
        // Luxury and boutique fashion (high weight for Wax London, Lisa Yang)
        const luxuryTerms = [
          'luxury', 'premium', 'exclusive', 'designer', 'boutique', 'artisan', 'craftsmanship',
          'heritage', 'authentic', 'curated', 'limited edition', 'made to order', 'bespoke',
          'sustainable', 'ethical', 'slow fashion', 'conscious', 'responsible', 'quality'
        ];
        
        luxuryTerms.forEach(term => {
          if (text.includes(term)) {
            score += 3;
            foundTerms.push(term);
          }
        });
        
        // Fashion accessories (medium weight)
        const accessories = [
          'shoes', 'boots', 'sneakers', 'heels', 'flats', 'sandals', 'pumps', 'loafers',
          'bag', 'bags', 'handbag', 'handbags', 'purse', 'purses', 'wallet', 'wallets',
          'jewelry', 'necklace', 'necklaces', 'earrings', 'ring', 'rings', 'bracelet', 'bracelets',
          'scarf', 'scarves', 'belt', 'belts', 'hat', 'hats', 'sunglasses', 'watch', 'watches'
        ];
        
        accessories.forEach(term => {
          if (text.includes(term)) {
            score += 2;
            foundTerms.push(term);
          }
        });
        
        // Fashion-related actions and features (medium weight)
        const fashionActions = [
          'size', 'sizing', 'fit', 'fitting', 'measurement', 'measurements',
          'style', 'styling', 'trend', 'trends', 'fashion', 'outfit', 'outfits',
          'collection', 'collections', 'seasonal', 'new arrivals', 'sale', 'clearance',
          'add to cart', 'shopping cart', 'checkout', 'order', 'shipping', 'returns'
        ];
        
        fashionActions.forEach(term => {
          if (text.includes(term)) {
            score += 2;
            foundTerms.push(term);
          }
        });
        
        // Fashion materials and quality (low weight)
        const materials = [
          'cotton', 'silk', 'wool', 'linen', 'denim', 'leather', 'suede', 'polyester',
          'cashmere', 'satin', 'velvet', 'lace', 'knit', 'woven', 'premium', 'luxury',
          'lycra', 'spandex', 'elastane', 'nylon', 'acrylic', 'rayon', 'viscose'
        ];
        
        materials.forEach(term => {
          if (text.includes(term)) {
            score += 1;
            foundTerms.push(term);
          }
        });
        
        // Cap the score at 100
        score = Math.min(score, 100);
        
        console.log('🎯 FashionWidget: Content analysis found terms:', foundTerms, 'Score:', score);
        
        return {
          score,
          foundTerms,
          totalTerms: foundTerms.length
        };
        
      } catch (error) {
        console.error('🎯 FashionWidget: Error in content analysis:', error);
        return { score: 0, foundTerms: [], totalTerms: 0 };
      }
    }

    // Detect e-commerce patterns
    detectEcommercePatterns() {
      try {
        let score = 0;
        const foundPatterns = [];
        
        // Shopping cart indicators (high weight)
        if (document.querySelector('[class*="cart"], [class*="Cart"], [id*="cart"], [id*="Cart"], [class*="bag"], [class*="Bag"], [class*="basket"], [class*="Basket"]')) {
          score += 20;
          foundPatterns.push('shopping cart');
        }
        
        // Product grid patterns (high weight)
        if (document.querySelector('[class*="product"], [class*="Product"], [class*="item"], [class*="Item"], [class*="card"], [class*="Card"], [class*="grid"], [class*="Grid"]')) {
          score += 20;
          foundPatterns.push('product grid');
        }
        
        // Price displays (high weight)
        if (document.querySelector('[class*="price"], [class*="Price"], [class*="cost"], [class*="Cost"], [class*="amount"], [class*="Amount"], [class*="currency"], [class*="Currency"]')) {
          score += 15;
          foundPatterns.push('price display');
        }
        
        // Size selectors (medium weight)
        if (document.querySelector('[class*="size"], [class*="Size"], select option[value*="S"], select option[value*="M"], select option[value*="L"], [class*="sizing"], [class*="Sizing"]')) {
          score += 15;
          foundPatterns.push('size selector');
        }
        
        // Add to cart buttons (high weight)
        if (document.querySelector('[class*="add"], [class*="Add"], button[class*="cart"], button[class*="Cart"], [class*="buy"], [class*="Buy"], [class*="purchase"], [class*="Purchase"]')) {
          score += 15;
          foundPatterns.push('add to cart');
        }
        
        // Product images (medium weight)
        if (document.querySelectorAll('img[src*="product"], img[alt*="product"], img[src*="item"], img[alt*="item"], img[src*="model"], img[alt*="model"]').length > 0) {
          score += 10;
          foundPatterns.push('product images');
        }
        
        // Filter and sort options (medium weight)
        if (document.querySelector('[class*="filter"], [class*="Filter"], [class*="sort"], [class*="Sort"], [class*="category"], [class*="Category"], [class*="collection"], [class*="Collection"]')) {
          score += 10;
          foundPatterns.push('filters/sorting');
        }
        
        // Checkout process (low weight)
        if (document.querySelector('[class*="checkout"], [class*="Checkout"], [class*="payment"], [class*="Payment"], [class*="order"], [class*="Order"]')) {
          score += 5;
          foundPatterns.push('checkout process');
        }
        
        // Product details and descriptions (medium weight)
        if (document.querySelector('[class*="description"], [class*="Description"], [class*="details"], [class*="Details"], [class*="specs"], [class*="Specs"]')) {
          score += 8;
          foundPatterns.push('product details');
        }
        
        // Inventory and availability (low weight)
        if (document.querySelector('[class*="stock"], [class*="Stock"], [class*="availability"], [class*="Availability"], [class*="inventory"], [class*="Inventory"]')) {
          score += 5;
          foundPatterns.push('inventory info');
        }
        
        // Cap the score at 100
        score = Math.min(score, 100);
        
        console.log('🎯 FashionWidget: E-commerce patterns found:', foundPatterns, 'Score:', score);
        
        return {
          score,
          foundPatterns,
          totalPatterns: foundPatterns.length
        };
        
      } catch (error) {
        console.error('🎯 FashionWidget: Error in e-commerce pattern detection:', error);
        return { score: 0, foundPatterns: [], totalPatterns: 0 };
      }
    }

    // Analyze URL patterns for fashion indicators
    analyzeUrlPatterns() {
      try {
        let score = 0;
        const foundPatterns = [];
        const url = window.location.href.toLowerCase();
        const hostname = window.location.hostname.toLowerCase();
        
        // Fashion-related domains (high weight)
        const fashionDomains = [
          'fashion', 'style', 'clothing', 'apparel', 'outfit', 'wardrobe',
          'boutique', 'store', 'shop', 'retail', 'brand', 'designer'
        ];
        
        fashionDomains.forEach(term => {
          if (hostname.includes(term)) {
            score += 25;
            foundPatterns.push(`domain: ${term}`);
          }
        });
        
        // E-commerce platforms (medium weight)
        const ecommercePlatforms = [
          'shopify', 'woocommerce', 'magento', 'bigcommerce', 'prestashop'
        ];
        
        ecommercePlatforms.forEach(term => {
          if (url.includes(term)) {
            score += 15;
            foundPatterns.push(`platform: ${term}`);
          }
        });
        
        // Fashion-related URL paths (medium weight)
        const fashionPaths = [
          '/clothing', '/dresses', '/shirts', '/pants', '/shoes', '/accessories',
          '/women', '/men', '/kids', '/sale', '/new', '/collection'
        ];
        
        fashionPaths.forEach(path => {
          if (url.includes(path)) {
            score += 10;
            foundPatterns.push(`path: ${path}`);
          }
        });
        
        // Regional fashion indicators (low weight)
        const regionalIndicators = [
          '.fashion', '.style', '.boutique', '.store', '.shop'
        ];
        
        regionalIndicators.forEach(indicator => {
          if (hostname.includes(indicator)) {
            score += 5;
            foundPatterns.push(`regional: ${indicator}`);
          }
        });
        
        // Cap the score at 100
        score = Math.min(score, 100);
        
        console.log('🎯 FashionWidget: URL patterns found:', foundPatterns, 'Score:', score);
        
        return {
          score,
          foundPatterns,
          totalPatterns: foundPatterns.length
        };
        
      } catch (error) {
        console.error('🎯 FashionWidget: Error in URL analysis:', error);
        return { score: 0, foundPatterns: [], totalPatterns: 0 };
      }
    }

    // Analyze visual elements for fashion indicators
    analyzeVisualElements() {
      try {
        let score = 0;
        const foundElements = [];
        
        // Product image galleries (high weight)
        const productImages = document.querySelectorAll('img[src*="product"], img[alt*="product"], img[src*="item"], img[alt*="item"]');
        if (productImages.length > 0) {
          score += 20;
          foundElements.push(`product images: ${productImages.length}`);
        }
        
        // Fashion model photos (medium weight)
        const modelImages = document.querySelectorAll('img[alt*="model"], img[alt*="Model"], img[alt*="wearing"], img[alt*="Wearing"]');
        if (modelImages.length > 0) {
          score += 15;
          foundElements.push(`model images: ${modelImages.length}`);
        }
        
        // Color swatches (medium weight)
        const colorSwatches = document.querySelectorAll('[class*="color"], [class*="Color"], [class*="swatch"], [class*="Swatch"]');
        if (colorSwatches.length > 0) {
          score += 15;
          foundElements.push('color swatches');
        }
        
        // Size charts (medium weight)
        const sizeCharts = document.querySelectorAll('[class*="size"], [class*="Size"], [class*="chart"], [class*="Chart"]');
        if (sizeCharts.length > 0) {
          score += 15;
          foundElements.push('size charts');
        }
        
        // Fashion layout patterns (low weight)
        const gridLayouts = document.querySelectorAll('[class*="grid"], [class*="Grid"], [class*="masonry"], [class*="Masonry"]');
        if (gridLayouts.length > 0) {
          score += 10;
          foundElements.push('grid layouts');
        }
        
        // Fashion-specific UI elements (low weight)
        const fashionUI = document.querySelectorAll('[class*="fashion"], [class*="Fashion"], [class*="style"], [class*="Style"]');
        if (fashionUI.length > 0) {
          score += 10;
          foundElements.push('fashion UI elements');
        }
        
        // Cap the score at 100
        score = Math.min(score, 100);
        
        console.log('🎯 FashionWidget: Visual elements found:', foundElements, 'Score:', score);
        
        return {
          score,
          foundElements,
          totalElements: foundElements.length
        };
        
      } catch (error) {
        console.error('🎯 FashionWidget: Error in visual analysis:', error);
        return { score: 0, foundElements: [], totalElements: 0 };
      }
    }

    // Extract brand name from context using multiple methods
    extractBrandFromContext() {
      try {
        let brandName = null;
        
        // Method 1: Meta tags (highest priority)
        const metaBrand = this.extractBrandFromMetaTags();
        if (metaBrand) {
          brandName = metaBrand;
          console.log('🎯 FashionWidget: Brand extracted from meta tags:', brandName);
          return brandName;
        }
        
        // Method 2: Page title analysis
        const titleBrand = this.extractBrandFromTitle();
        if (titleBrand) {
          brandName = titleBrand;
          console.log('🎯 FashionWidget: Brand extracted from title:', brandName);
          return brandName;
        }
        
        // Method 3: Logo and branding elements
        const logoBrand = this.extractBrandFromLogos();
        if (logoBrand) {
          brandName = logoBrand;
          console.log('🎯 FashionWidget: Brand extracted from logos:', brandName);
          return brandName;
        }
        
        // Method 4: URL analysis
        const urlBrand = this.extractBrandFromUrl();
        if (urlBrand) {
          brandName = urlBrand;
          console.log('🎯 FashionWidget: Brand extracted from URL:', brandName);
          return brandName;
        }
        
        // Method 5: Content analysis for brand mentions
        const contentBrand = this.extractBrandFromContent();
        if (contentBrand) {
          brandName = contentBrand;
          console.log('🎯 FashionWidget: Brand extracted from content:', brandName);
          return brandName;
        }
        
        console.log('🎯 FashionWidget: No brand could be extracted from context');
        return null;
        
      } catch (error) {
        console.error('🎯 FashionWidget: Error extracting brand from context:', error);
        return null;
      }
    }

    // Extract brand from meta tags
    extractBrandFromMetaTags() {
      try {
        const selectors = [
          'meta[property="og:site_name"]',
          'meta[name="application-name"]',
          'meta[property="og:title"]',
          'meta[name="title"]',
          'meta[property="twitter:site"]'
        ];
        
        for (const selector of selectors) {
          const element = document.querySelector(selector);
          if (element && element.content) {
            const content = element.content.trim();
            if (content && content.length > 1 && content.length < 50) {
              return this.cleanBrandName(content);
            }
          }
        }
        
        return null;
      } catch (error) {
        return null;
      }
    }

    // Extract brand from page title
    extractBrandFromTitle() {
      try {
        const title = document.title;
        if (!title) return null;
        
        // Common title patterns
        const patterns = [
          /^([^|]+)/,           // Everything before first |
          /^([^-]+)/,           // Everything before first -
          /^([—]+)/,            // Everything before first em dash
          /^([–]+)/,            // Everything before first en dash
          /^([:]+)/,            // Everything before first :
          /^([•]+)/,            // Everything before first bullet
        ];
        
        for (const pattern of patterns) {
          const match = title.match(pattern);
          if (match && match[1]) {
            const extracted = match[1].trim();
            if (extracted && extracted.length > 1 && extracted.length < 50) {
              return this.cleanBrandName(extracted);
            }
          }
        }
        
        return null;
      } catch (error) {
        return null;
      }
    }

    // Extract brand from logos and branding elements
    extractBrandFromLogos() {
      try {
        const selectors = [
          'img[alt*="logo"]',
          'img[alt*="Logo"]',
          '.logo',
          '.brand',
          '[class*="logo"]',
          '[class*="brand"]',
          '[id*="logo"]',
          '[id*="brand"]'
        ];
        
        for (const selector of selectors) {
          const element = document.querySelector(selector);
          if (element) {
            // Try alt text first
            if (element.alt) {
              const altBrand = element.alt.replace(/logo|Logo/gi, '').trim();
              if (altBrand && altBrand.length > 1) {
                return this.cleanBrandName(altBrand);
              }
            }
            
            // Try text content
            if (element.textContent) {
              const textBrand = element.textContent.trim();
              if (textBrand && textBrand.length > 1 && textBrand.length < 50) {
                return this.cleanBrandName(textBrand);
              }
            }
          }
        }
        
        return null;
      } catch (error) {
        return null;
      }
    }

    // Extract brand from URL
    extractBrandFromUrl() {
      try {
        const hostname = window.location.hostname.toLowerCase();
        
        // Remove common TLDs and subdomains
        let cleanHostname = hostname
          .replace(/^www\./, '')
          .replace(/\.com$/, '')
          .replace(/\.co\.uk$/, '')
          .replace(/\.de$/, '')
          .replace(/\.fr$/, '')
          .replace(/\.it$/, '')
          .replace(/\.es$/, '')
          .replace(/\.ca$/, '')
          .replace(/\.au$/, '')
          .replace(/\.jp$/, '')
          .replace(/\.cn$/, '');
        
        // Check if it's a reasonable brand name
        if (cleanHostname.length > 2 && cleanHostname.length < 25) {
          // Capitalize first letter and handle common patterns
          const brandName = cleanHostname
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          
          return this.cleanBrandName(brandName);
        }
        
        return null;
      } catch (error) {
        return null;
      }
    }

    // Extract brand from page content
    extractBrandFromContent() {
      try {
        const text = document.body.textContent;
        if (!text) return null;
        
        // Look for brand patterns in text
        const brandPatterns = [
          /©\s*([^,]+)/i,                    // Copyright notices
          /Copyright\s*([^,]+)/i,            // Copyright text
          /All rights reserved.*?([^,]+)/i,   // Rights reserved
          /Powered by\s*([^,]+)/i,           // Powered by
          /Designed by\s*([^,]+)/i,          // Designed by
        ];
        
        for (const pattern of brandPatterns) {
          const match = text.match(pattern);
          if (match && match[1]) {
            const extracted = match[1].trim();
            if (extracted && extracted.length > 1 && extracted.length < 50) {
              return this.cleanBrandName(extracted);
            }
          }
        }
        
        return null;
      } catch (error) {
        return null;
      }
    }

    // Classify the type of fashion website
    classifyFashionType() {
      try {
        const text = document.body.textContent.toLowerCase();
        const url = window.location.href.toLowerCase();
        
        // Clothing and apparel
        if (text.includes('clothing') || text.includes('apparel') || text.includes('garments')) {
          return 'clothing';
        }
        
        // Shoes and footwear
        if (text.includes('shoes') || text.includes('footwear') || text.includes('boots') || text.includes('sneakers')) {
          return 'footwear';
        }
        
        // Accessories and jewelry
        if (text.includes('accessories') || text.includes('jewelry') || text.includes('handbags') || text.includes('bags')) {
          return 'accessories';
        }
        
        // Lingerie and intimate apparel
        if (text.includes('lingerie') || text.includes('intimate') || text.includes('underwear')) {
          return 'lingerie';
        }
        
        // Sportswear and activewear
        if (text.includes('sportswear') || text.includes('activewear') || text.includes('athletic')) {
          return 'sportswear';
        }
        
        // Luxury and designer
        if (text.includes('luxury') || text.includes('designer') || text.includes('premium') || text.includes('exclusive')) {
          return 'luxury';
        }
        
        // Fast fashion
        if (text.includes('trendy') || text.includes('affordable') || text.includes('budget') || text.includes('cheap')) {
          return 'fast-fashion';
        }
        
        // Vintage and second-hand
        if (text.includes('vintage') || text.includes('second-hand') || text.includes('pre-owned') || text.includes('thrift')) {
          return 'vintage';
        }
        
        // General fashion (default)
        return 'general';
        
      } catch (error) {
        return 'general';
      }
    }

    // Detect target demographic
    detectTargetDemographic() {
      try {
        const text = document.body.textContent.toLowerCase();
        const url = window.location.href.toLowerCase();
        
        // Women's fashion
        if (text.includes("women's") || text.includes('womens') || text.includes('ladies') || text.includes('female') || url.includes('/women')) {
          return 'women';
        }
        
        // Men's fashion
        if (text.includes("men's") || text.includes('mens') || text.includes('gentlemen') || text.includes('male') || url.includes('/men')) {
          return 'men';
        }
        
        // Children's fashion
        if (text.includes("children's") || text.includes('childrens') || text.includes('kids') || text.includes('baby') || text.includes('toddler') || url.includes('/kids')) {
          return 'children';
        }
        
        // Unisex or general
        if (text.includes('unisex') || text.includes('gender-neutral') || text.includes('all genders')) {
          return 'unisex';
        }
        
        // Check URL paths
        if (url.includes('/women') || url.includes('/ladies')) {
          return 'women';
        }
        if (url.includes('/men') || url.includes('/gentlemen')) {
          return 'men';
        }
        if (url.includes('/kids') || url.includes('/children')) {
          return 'children';
        }
        
        // Default to general
        return 'general';
        
      } catch (error) {
        return 'general';
      }
    }

    // Generate human-readable detection reasons
    generateDetectionReasons(detectionResults) {
      const reasons = [];
      
      if (detectionResults.confidence >= 80) {
        reasons.push('Strong fashion website indicators detected');
      } else if (detectionResults.confidence >= 60) {
        reasons.push('Moderate fashion website indicators detected');
      } else {
        reasons.push('Limited fashion website indicators');
      }
      
      // Add specific reasons based on indicators
      detectionResults.indicators.forEach(indicator => {
        if (indicator.includes('Content analysis') && indicator.includes('/100')) {
          const score = parseInt(indicator.match(/(\d+)\/100/)[1]);
          if (score >= 70) {
            reasons.push('Rich fashion-related content found');
          } else if (score >= 40) {
            reasons.push('Some fashion-related content detected');
          }
        }
        
        if (indicator.includes('E-commerce patterns') && indicator.includes('/100')) {
          const score = parseInt(indicator.match(/(\d+)\/100/)[1]);
          if (score >= 70) {
            reasons.push('Strong e-commerce functionality detected');
          } else if (score >= 40) {
            reasons.push('Basic e-commerce features present');
          }
        }
      });
      
      if (detectionResults.detectedBrand) {
        reasons.push(`Brand identified: ${detectionResults.detectedBrand}`);
      }
      
      if (detectionResults.fashionType && detectionResults.fashionType !== 'general') {
        reasons.push(`Fashion type: ${detectionResults.fashionType}`);
      }
      
      if (detectionResults.targetDemographic && detectionResults.targetDemographic !== 'general') {
        reasons.push(`Target demographic: ${detectionResults.targetDemographic}`);
      }
      
      return reasons;
    }

    // Manual trigger that bypasses all checks
    manualTrigger() {
      console.log('🎯 FashionWidget: Manual trigger activated, bypassing all checks...');
      
      // Force show widget and run universal detection
      this.forceShow();
      this.detectBrandFromPage();
    }

    // Force show widget (bypasses all checks)
    forceShow() {
      console.log('🎯 FashionWidget: Force showing widget...');
      
      if (!this.widget) {
        console.log('🎯 FashionWidget: Widget not created yet, creating...');
        this.createWidget();
      }
      
      this.isVisible = true;
      this.lastShowTime = Date.now();
      
      // Force all critical styles
      this.widget.style.setProperty('visibility', 'visible', 'important');
      this.widget.style.setProperty('display', 'block', 'important');
      this.widget.style.setProperty('opacity', '1', 'important');
      this.widget.style.setProperty('transform', 'scale(1)', 'important');
      this.widget.style.setProperty('width', '350px', 'important');
      this.widget.style.setProperty('height', 'auto', 'important');
      this.widget.style.setProperty('min-height', '120px', 'important');
      this.widget.style.setProperty('overflow', 'visible', 'important');
      this.widget.style.setProperty('position', 'fixed', 'important');
      this.widget.style.setProperty('z-index', '999999', 'important');
      
      // Ensure proper positioning
      this.updateWidgetPosition();
      
      // Load and apply Inter font
      this.loadInterFont();
      
      console.log('🎯 FashionWidget: Widget force shown successfully');
      console.log('🎯 FashionWidget: Final widget styles:', {
        visibility: this.widget.style.visibility,
        display: this.widget.style.display,
        opacity: this.widget.style.opacity,
        width: this.widget.style.width,
        height: this.widget.style.height,
        position: this.widget.style.position,
        zIndex: this.widget.style.zIndex,
        top: this.widget.style.top,
        right: this.widget.style.right
      });
      console.log('🎯 FashionWidget: Widget bounding rect:', this.widget.getBoundingClientRect());
    }

    // Force fix widget display issues
    forceFixWidget() {
      console.log('🎯 FashionWidget: Force fixing widget display...');
      
      if (!this.widget) {
        console.log('🎯 FashionWidget: No widget to fix');
        return;
      }
      
      // Reset all styles and force proper display
      this.widget.style.cssText = '';
      this.updateWidgetPosition();
      this.show();
      
      console.log('🎯 FashionWidget: Widget display fixed');
    }

    // Add manual trigger to window for console access
    addManualTrigger() {
      window.forceShowWidget = () => {
        console.log('🎯 FashionWidget: Manual trigger called from console');
        this.manualTrigger();
      };
      
      // Add force fix function
      window.forceFixWidget = () => {
        console.log('🎯 FashionWidget: Force fix called from console');
        this.forceFixWidget();
      };
      
      // Add debug function
      window.debugWidget = () => {
        console.log('🎯 FashionWidget: Debug information:');
        console.log('Widget element:', this.widget);
        if (this.widget) {
          console.log('Widget styles:', {
            visibility: this.widget.style.visibility,
            display: this.widget.style.display,
            opacity: this.widget.style.opacity,
            transform: this.widget.style.transform,
            position: this.widget.style.position,
            zIndex: this.widget.style.zIndex,
            top: this.widget.style.top,
            right: this.widget.style.right,
            left: this.widget.style.left,
            bottom: this.widget.style.bottom,
            width: this.widget.style.width,
            height: this.widget.style.height,
            minHeight: this.widget.style.minHeight
          });
          console.log('Widget bounding rect:', this.widget.getBoundingClientRect());
          console.log('Widget computed styles:', window.getComputedStyle(this.widget));
          console.log('Widget parent:', this.widget.parentElement);
          console.log('Widget is in DOM:', document.body.contains(this.widget));
        }
        console.log('Widget state:', {
          isVisible: this.isVisible,
          isExpanded: this.isExpanded,
          isDismissed: this.isDismissed,
          preferences: this.preferences
        });
      };
      
      console.log('🎯 FashionWidget: Manual trigger added to window.forceShowWidget()');
      console.log('🎯 FashionWidget: Force fix added to window.forceFixWidget()');
      console.log('🎯 FashionWidget: Debug function added to window.debugWidget()');
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

  // Add global test function for debugging
  window.testFashionExtension = function() {
    console.log('🎯 FashionWidget: Global test function called');
    console.log('🎯 FashionWidget: Extension status check...');
    
    if (window.fashionWidget) {
      console.log('✅ FashionWidget instance found:', window.fashionWidget);
      return 'Extension loaded successfully';
    } else {
      console.log('❌ FashionWidget instance not found');
      return 'Extension not loaded';
    }
  };
} catch (error) {
  console.error('🎯 FashionWidget: Error initializing widget due to page error:', error);
  
  // Fallback: Try to initialize after a delay, even if page has errors
  console.log('🎯 FashionWidget: Attempting fallback initialization...');
  setTimeout(() => {
    try {
      new FashionWidget();
      console.log('🎯 FashionWidget: Fallback initialization successful');
    } catch (fallbackError) {
      console.error('🎯 FashionWidget: Fallback initialization also failed:', fallbackError);
    }
  }, 2000); // Wait 2 seconds for page to stabilize
}

// Fashion Widget Content Script
console.log('🎯 FashionWidget: Content script loaded!');
console.log('🎯 FashionWidget: Current URL:', window.location.href);
console.log('🎯 FashionWidget: Page title:', document.title);