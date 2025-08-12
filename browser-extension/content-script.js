// Content Script for Pointfour Fashion Assistant
// Injects floating widget and handles user interactions

// Wrap everything in a try-catch to handle page errors gracefully
try {
  class FashionWidget {
    constructor() {
      this.isVisible = false;
      this.isExpanded = false;
      this.brandData = null;
      this.widget = null;
      this.autoHideTimer = null;
      this.preferences = {};
      this.position = 'top-right';
      this.isDismissed = false;
      this.animationFrame = null;
      
      this.init();
    }

    async init() {
      try {
        console.log('🎯 FashionWidget: Initializing...');
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', () => this.continueInit());
        } else {
          this.continueInit();
        }
      } catch (error) {
        console.error('🎯 FashionWidget: Error during init:', error);
      }
    }

    async continueInit() {
      try {
        // Load user preferences
        await this.loadPreferences();
        console.log('🎯 FashionWidget: Preferences loaded:', this.preferences);
        
        // Create and inject widget
        this.createWidget();
        console.log('🎯 FashionWidget: Widget created and injected');
        
        // Listen for messages from background script
        this.setupMessageListener();
        console.log('🎯 FashionWidget: Message listener setup');
        
        // Listen for URL changes (for SPAs)
        this.setupUrlChangeListener();
        console.log('🎯 FashionWidget: URL change listener setup');
        
        // Check if we already have brand data
        this.checkExistingBrandData();
        console.log('🎯 FashionWidget: Existing brand data checked');
        
        // Setup intersection observer for smart positioning
        this.setupIntersectionObserver();
        console.log('🎯 FashionWidget: Intersection observer setup');
        
        // Expose testing methods
        this.exposeForTesting();
        console.log('🎯 FashionWidget: Testing methods exposed');
        
        console.log('🎯 FashionWidget: Initialization complete');
      } catch (error) {
        console.error('🎯 FashionWidget: Error during continueInit:', error);
      }
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
      console.log('🎯 FashionWidget: Creating widget...');
      
      this.widget = document.createElement('div');
      this.widget.className = 'fashion-fit-widget';
      this.widget.id = 'fashion-fit-widget';
      
      // Create minimal and expanded modes
      this.createMinimalMode();
      this.createExpandedMode();
      
      // Set initial position
      this.updateWidgetPosition();
      
      // Inject into page
      document.body.appendChild(this.widget);
      
      console.log('🎯 FashionWidget: Widget created and appended to DOM');
      console.log('🎯 FashionWidget: Widget element:', this.widget);
      console.log('🎯 FashionWidget: Widget styles:', this.widget.style.cssText);
      
      // Add event listeners
      this.setupEventListeners();
      
      // Apply theme
      this.updateTheme();
      
      console.log('🎯 FashionWidget: Widget creation complete');
    }

    updateWidgetPosition() {
      const baseStyles = `
        position: fixed;
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        opacity: 0;
        visibility: hidden;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
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
      const widgetWidth = 400; // max-width from CSS
      const widgetHeight = 200; // approximate height
      
      switch (this.position) {
        case 'top-left':
          positionStyles = 'top: 20px; left: 20px; transform: scale(0.9);';
          break;
        case 'top-center':
          positionStyles = 'top: 20px; left: 50%; transform: translateX(-50%) scale(0.9);';
          break;
        case 'bottom-right':
          positionStyles = 'bottom: 20px; right: 20px; transform: scale(0.9);';
          break;
        case 'bottom-left':
          positionStyles = 'bottom: 20px; left: 20px; transform: scale(0.9);';
          break;
        case 'bottom-center':
          positionStyles = 'bottom: 20px; left: 50%; transform: translateX(-50%) scale(0.9);';
          break;
        case 'top-right':
        default:
          // Ensure widget doesn't go beyond right edge
          const rightMargin = Math.max(20, viewportWidth - widgetWidth - 20);
          positionStyles = `top: 20px; right: ${rightMargin}px; transform: scale(0.9);`;
          break;
      }
      
      const finalStyles = baseStyles + positionStyles;
      this.widget.style.cssText = finalStyles;
      
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

      // Add event listeners
      this.minimalMode.addEventListener('click', (e) => {
        // Don't expand if clicking on close button
        if (!e.target.closest('.widget-close')) {
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
          
          <!-- Enhanced Reviews Section -->
          <div class="reviews-section" style="display: none;">
            <h4 class="reviews-title">🔍 Reviews & Feedback</h4>
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
        const response = await chrome.runtime.sendMessage({
          type: 'GET_BRAND_DATA'
        });
        
        if (response) {
          this.handleBrandDetected(response);
        } else {
          // Fallback: Try to detect brand from page content
          this.detectBrandFromPage();
        }
      } catch (error) {
        console.error('Error checking existing brand data:', error);
        // Fallback: Try to detect brand from page content
        this.detectBrandFromPage();
      }
    }

    detectBrandFromPage() {
      try {
        console.log('🎯 FashionWidget: Attempting manual brand detection from page...');
        
        // Common brand detection patterns
        const brandPatterns = [
          // Look for brand names in common locations
          () => document.querySelector('meta[property="og:site_name"]')?.content,
          () => document.querySelector('meta[name="application-name"]')?.content,
          () => document.querySelector('title')?.textContent?.split('|')[0]?.trim(),
          () => document.querySelector('title')?.textContent?.split('-')[0]?.trim(),
          () => document.querySelector('title')?.textContent?.split('|')[0]?.trim(),
          // Look for brand in navigation
          () => document.querySelector('nav a[href*="/"]')?.textContent?.trim(),
          // Look for brand in logo alt text
          () => document.querySelector('img[alt*="logo"]')?.alt?.replace(/logo/i, '').trim(),
          // Look for brand in header
          () => document.querySelector('header h1')?.textContent?.trim(),
          // Look for brand in footer
          () => document.querySelector('footer')?.textContent?.match(/©\s*([^,]+)/)?.[1]?.trim()
        ];
        
        let detectedBrand = null;
        for (const pattern of brandPatterns) {
          try {
            const result = pattern();
            if (result && result.length > 1 && result.length < 50) {
              // Clean up the brand name
              const cleanBrand = result.replace(/[^\w\s]/g, '').trim();
              if (cleanBrand && !cleanBrand.toLowerCase().includes('undefined')) {
                detectedBrand = cleanBrand;
                break;
              }
            }
          } catch (e) {
            // Continue to next pattern
          }
        }
        
        if (detectedBrand) {
          console.log('🎯 FashionWidget: Manually detected brand:', detectedBrand);
          // Create a minimal brand data object
          const brandData = {
            brandName: detectedBrand,
            category: 'general',
            hasData: false,
            searchType: 'manual-detection',
            recommendation: `Brand detected: ${detectedBrand}. Searching for fit information...`,
            externalSearchResults: null,
            fitTips: [],
            sizeGuide: null,
            timestamp: Date.now(),
            error: false
          };
          
          this.handleBrandDetected(brandData);
          
          // Try to fetch data for this brand
          this.fetchBrandDataForDetectedBrand(detectedBrand);
        } else {
          console.log('🎯 FashionWidget: No brand detected from page content');
          
          // Fallback: Show widget with generic info for testing
          console.log('🎯 FashionWidget: Showing fallback widget for testing...');
          const fallbackData = {
            brandName: 'Fashion Brand',
            category: 'general',
            hasData: false,
            searchType: 'fallback',
            recommendation: 'Widget loaded successfully! This is a test mode. Visit a fashion website to see real brand detection.',
            externalSearchResults: null,
            fitTips: [],
            sizeGuide: null,
            timestamp: Date.now(),
            error: false
          };
          
          this.handleBrandDetected(fallbackData);
        }
      } catch (error) {
        console.error('🎯 FashionWidget: Error in manual brand detection:', error);
      }
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
      
      if (this.preferences.enabled && !this.isDismissed) {
        console.log('🎯 FashionWidget: Showing widget...');
        
        // Small delay to ensure smooth appearance
        setTimeout(() => {
          this.show();
          this.updateContent();
          
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
      console.log('🎯 FashionWidget: show() called');
      if (this.isVisible || this.isDismissed) {
        console.log('🎯 FashionWidget: Already visible or dismissed, returning');
        return;
      }
      
      this.isVisible = true;
      this.lastShowTime = Date.now(); // Track last show time
      
      // First make it visible but transparent
      this.widget.style.visibility = 'visible';
      this.widget.style.display = 'block';
      
      // Use requestAnimationFrame to ensure smooth transition
      requestAnimationFrame(() => {
        // Then animate to full opacity and scale
        this.widget.style.opacity = '1';
        this.widget.style.transform = this.widget.style.transform.replace('scale(0.9)', 'scale(1)');
      });
      
      console.log('🎯 FashionWidget: Widget is now visible');
      
      // Update tab state
      this.updateTabState();
      
      // Ensure widget stays visible for at least 5 seconds
      setTimeout(() => {
        if (this.isVisible && this.widget.style.opacity === '0') {
          console.log('🎯 FashionWidget: Widget was hidden too quickly, restoring visibility...');
          this.widget.style.opacity = '1';
          this.widget.style.transform = this.widget.style.transform.replace('scale(0.9)', 'scale(1)');
        }
      }, 5000);
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
      const titleEl = this.expandedMode.querySelector('.widget-title');
      const brandMetaEl = this.expandedMode.querySelector('.brand-meta');
      const fitSummaryTextEl = this.expandedMode.querySelector('.fit-summary-text');
      const fitTipsEl = this.expandedMode.querySelector('.fit-tips-section');
      const tipsContentEl = this.expandedMode.querySelector('.tips-content');
      const reviewsSectionEl = this.expandedMode.querySelector('.reviews-section');
      const reviewsCountEl = this.expandedMode.querySelector('.reviews-count');
      const reviewsStatusEl = this.expandedMode.querySelector('.reviews-status');
      const reviewsContentEl = this.expandedMode.querySelector('.reviews-content');
      const itemReviewsEl = this.expandedMode.querySelector('.item-reviews-section');
      const itemReviewsContentEl = this.expandedMode.querySelector('.item-reviews-content');
      const sourceReviewsEl = this.expandedMode.querySelector('.source-reviews-section');
      const sourceReviewsContentEl = this.expandedMode.querySelector('.source-reviews-content');
      const externalReviewsEl = this.expandedMode.querySelector('.external-reviews-section');
      const externalSummaryEl = this.expandedMode.querySelector('.external-summary');

      titleEl.textContent = `${brandName} Fit Guide`;
      
      brandMetaEl.innerHTML = `
        <span class="meta-item">
          <span class="meta-icon">📊</span>
          ${searchType === 'hybrid' ? 'Database + Web Search' : 'Web Search'}
        </span>
      `;

      fitSummaryTextEl.textContent = recommendation;

      // Show fit tips if available
      const tips = this.extractFitTips(recommendation);
      if (tips.length > 0) {
        fitTipsEl.style.display = 'block';
        tipsContentEl.innerHTML = tips.map(tip => `<div class="tip-item">• ${tip}</div>`).join('');
      } else {
        fitTipsEl.style.display = 'none';
      }

      // Show enhanced reviews if available
      if (externalSearchResults && externalSearchResults.totalResults > 0) {
        reviewsSectionEl.style.display = 'block';
        
        const totalResults = externalSearchResults.totalResults;
        const confidence = externalSearchResults.brandFitSummary?.confidence || 'unknown';
        
        reviewsCountEl.innerHTML = `<span class="count-number">${totalResults}</span> reviews found`;
        reviewsStatusEl.innerHTML = `<span class="status-badge confidence-${confidence}">${confidence} confidence</span>`;
        
        // Display brand fit summary
        if (externalSearchResults.brandFitSummary) {
          reviewsContentEl.innerHTML = `
            <div class="brand-fit-summary">
              <div class="summary-content">
                <div class="summary-text">${externalSearchResults.brandFitSummary.summary}</div>
                <div class="summary-meta">
                  <span class="confidence-badge confidence-${externalSearchResults.brandFitSummary.confidence}">
                    Confidence: ${externalSearchResults.brandFitSummary.confidence}
                  </span>
                  <span class="sources">Sources: ${externalSearchResults.brandFitSummary.sources.join(', ')}</span>
                </div>
              </div>
            </div>
          `;
        }
        
        // Show source-grouped reviews if available
        if (externalSearchResults.groupedReviews) {
          sourceReviewsEl.style.display = 'block';
          
          // Initialize with primary source content
          const primaryReviews = externalSearchResults.groupedReviews.primary || [];
          sourceReviewsContentEl.innerHTML = `
            <div class="source-reviews-content-inner">
              ${primaryReviews.length > 0 ? primaryReviews.map(review => `
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
              `).join('') : '<div class="no-reviews">No primary source reviews found.</div>'}
            </div>
          `;
        } else {
          sourceReviewsEl.style.display = 'none';
        }
        
        // Show item-specific reviews if available and different from brand reviews
        if (externalSearchResults.reviews && externalSearchResults.reviews.length > 0) {
          const itemSpecificReviews = externalSearchResults.reviews.filter(r => 
            r.tags.some(tag => tag.toLowerCase().includes('fit') || tag.toLowerCase().includes('size')) &&
            !r.brandLevel
          );
          
          if (itemSpecificReviews.length > 0) {
            itemReviewsEl.style.display = 'block';
            itemReviewsContentEl.innerHTML = `
              <div class="item-reviews-content-inner">
                ${itemSpecificReviews.slice(0, 3).map(review => `
                  <div class="item-review-item">
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
                `).join('')}
              </div>
            `;
          } else {
            itemReviewsEl.style.display = 'none';
          }
        } else {
          itemReviewsEl.style.display = 'none';
        }
      } else {
        // Hide all review sections if no data
        reviewsSectionEl.style.display = 'none';
        itemReviewsEl.style.display = 'none';
        sourceReviewsEl.style.display = 'none';
      }

      // Show external reviews if available (legacy support)
      if (externalSearchResults && externalSearchResults.brandFitSummary) {
        externalReviewsEl.style.display = 'block';
        externalSummaryEl.innerHTML = `
          <div class="external-summary-content">
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
        widget: this.widget
      };
      console.log('🎯 FashionWidget: Testing methods exposed to window.testFashionWidget');
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