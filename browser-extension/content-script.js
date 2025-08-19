// ========================================
// POINTFOUR BROWSER EXTENSION - CONTENT SCRIPT
// Version: 3.0 (Intelligent Fashion Site Detection)
// ========================================

(function() {
  'use strict';

  // ========================================
  // CONFIGURATION
  // ========================================
  
  const CONFIG = {
      // Fashion-related keywords to look for
      FASHION_SIGNALS: {
          // Meta tag indicators
          META_KEYWORDS: [
              'fashion', 'clothing', 'apparel', 'wear', 'style', 'outfit',
              'dress', 'shirt', 't-shirt', 'tshirt', 'pants', 'jeans', 'shoes', 'accessories',
              'mens', 'womens', 'unisex', 'designer', 'boutique', 'collection',
              'jacket', 'coat', 'sweater', 'blazer', 'suit', 'skirt',
              'handbag', 'footwear', 'sneakers', 'boots', 'heels',
              'athleisure', 'activewear', 'sportswear', 'streetwear',
              'luxury', 'premium', 'couture', 'ready-to-wear', 'rtw', 'rohe'
          ],
          
          // Shopping cart indicators
          CART_SELECTORS: [
              '[class*="cart"]', '[id*="cart"]', '[data-cart]',
              '[class*="basket"]', '[id*="basket"]',
              '[class*="bag"]', '[id*="bag"]', '.shopping-bag',
              '[class*="checkout"]', '[aria-label*="cart"]',
              'button[class*="add-to"]', '.add-to-cart', '.add-to-bag',
              '[class*="size-selector"]', '[class*="size-guide"]',
              '.product-add', '.btn-add-to-cart', '.add-item'
          ],
          
          // Product page indicators
          PRODUCT_INDICATORS: [
              'select[name*="size"]', 'select[id*="size"]',
              '[class*="size-chart"]', '[class*="size-guide"]',
              '[class*="product-price"]', '[class*="product-title"]',
              '[class*="product-image"]', '[class*="product-gallery"]',
              '[itemprop="price"]', '[itemprop="priceCurrency"]',
              '[class*="color-swatch"]', '[class*="color-option"]',
              '.product-info', '.product-details', '.product-description',
              '[data-product-id]', '[data-variant-id]',
              'button[name="add"]', 'form[action*="cart"]'
          ],
          
          // Fashion-specific structured data types
          STRUCTURED_DATA_TYPES: [
              'Product', 'Clothing', 'Apparel', 'Shoe', 'Accessory',
              'ClothingStore', 'OnlineStore', 'RetailStore'
          ],
          
          // Fashion category indicators in URLs
          URL_PATTERNS: [
              'clothing', 'fashion', 'apparel', 'wear', 'style',
              'mens', 'womens', 'kids', 'boys', 'girls',
              'shoes', 'accessories', 'bags', 'jewelry',
              'dress', 'shirt', 'pants', 'jacket', 'coat',
              'collection', 'category', 'products', 'shop'
          ]
      },
      
      // Scoring thresholds
      DETECTION_THRESHOLDS: {
          MIN_SCORE: 4,           // Increased minimum score to reduce false positives
          HIGH_CONFIDENCE: 8,     // High confidence it's a fashion site
          PRODUCT_PAGE_BONUS: 3   // Extra points if it looks like a product page
      },
      
      // Timing
      INIT_DELAY: 1000,        // Reduced delay since we're being smarter
      DEBOUNCE_DELAY: 300
  };

  // ========================================
  // STATE MANAGEMENT
  // ========================================
  
  let widgetInjected = false;
  let widgetContainer = null;
  let currentBrand = null;
  let initTimeout = null;
  let isProcessing = false;
  let detectionScore = 0;

  // ========================================
  // INTELLIGENT DETECTION
  // ========================================
  
  function detectFashionSite() {
      console.log('[PointFour] Starting intelligent fashion site detection...');
      let score = 0;
      const signals = [];
      
      // Check 1: Meta tags analysis
      const metaTags = {
          keywords: document.querySelector('meta[name="keywords"]')?.content?.toLowerCase() || '',
          description: document.querySelector('meta[name="description"]')?.content?.toLowerCase() || '',
          ogType: document.querySelector('meta[property="og:type"]')?.content?.toLowerCase() || '',
          ogSiteName: document.querySelector('meta[property="og:site_name"]')?.content?.toLowerCase() || '',
          ogTitle: document.querySelector('meta[property="og:title"]')?.content?.toLowerCase() || ''
      };
      
      // Score meta tags
      const metaContent = Object.values(metaTags).join(' ');
      const fashionKeywordsFound = CONFIG.FASHION_SIGNALS.META_KEYWORDS.filter(keyword => 
          metaContent.includes(keyword)
      );
      
      if (fashionKeywordsFound.length > 0) {
          score += Math.min(fashionKeywordsFound.length, 3); // Cap at 3 points
          signals.push(`Meta tags contain fashion keywords: ${fashionKeywordsFound.slice(0, 3).join(', ')}`);
      }
      
      // Check 2: Structured data (Schema.org)
      const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
      for (const script of jsonLdScripts) {
          try {
              const data = JSON.parse(script.textContent);
              const dataString = JSON.stringify(data).toLowerCase();
              
              // Check for fashion-related schema types
              if (CONFIG.FASHION_SIGNALS.STRUCTURED_DATA_TYPES.some(type => 
                  dataString.includes(type.toLowerCase())
              )) {
                  score += 2;
                  signals.push('Found fashion-related structured data');
                  
                  // Extra point for product schema with clothing categories
                  if (dataString.includes('category') && 
                      (dataString.includes('clothing') || dataString.includes('apparel'))) {
                      score += 1;
                      signals.push('Product schema with clothing category');
                  }
              }
          } catch (e) {
              // Ignore parsing errors
          }
      }
      
      // Check 3: Shopping cart functionality
      const cartElements = CONFIG.FASHION_SIGNALS.CART_SELECTORS.filter(selector => {
          try {
              return document.querySelector(selector) !== null;
          } catch (e) {
              return false;
          }
      });
      
      if (cartElements.length > 0) {
          score += Math.min(cartElements.length, 2); // Cap at 2 points
          signals.push(`Found shopping cart elements (${cartElements.length})`);
      }
      
      // Check 4: Product page indicators (REQUIRED for fashion sites)
      const productElements = CONFIG.FASHION_SIGNALS.PRODUCT_INDICATORS.filter(selector => {
          try {
              return document.querySelector(selector) !== null;
          } catch (e) {
              return false;
          }
      });
      const productElementsCount = productElements.length;
      
      if (productElementsCount >= 3) {
          score += CONFIG.DETECTION_THRESHOLDS.PRODUCT_PAGE_BONUS;
          signals.push(`Found product page elements (${productElementsCount})`);
      } else if (productElementsCount === 0) {
          // Penalize sites with no product indicators
          score -= 2;
          signals.push('No product page indicators found');
      }
      
      // Check 5: URL analysis
      const urlPath = window.location.href.toLowerCase();
      const urlMatches = CONFIG.FASHION_SIGNALS.URL_PATTERNS.filter(pattern => 
          urlPath.includes(pattern)
      );
      
      if (urlMatches.length > 0) {
          score += Math.min(urlMatches.length, 2); // Cap at 2 points
          signals.push(`URL contains fashion terms: ${urlMatches.join(', ')}`);
      }
      
      // Check 6: Page content analysis (visible text)
      const pageText = document.body?.innerText?.toLowerCase() || '';
      const pageTextSample = pageText.substring(0, 5000); // Check first 5000 chars for performance
      
      // Look for size-related content (strong indicator of fashion)
      const sizeIndicators = [
          'size guide', 'size chart', 'fit guide', 'measurements',
          'true to size', 'runs small', 'runs large', 'model wears',
          'model is wearing', 'length:', 'bust:', 'waist:', 'hip:',
          'small', 'medium', 'large', 'xl', 'xxl', 'xs'
      ];
      
      const sizeMatches = sizeIndicators.filter(indicator => 
          pageTextSample.includes(indicator)
      );
      
      if (sizeMatches.length >= 2) {
          score += 2;
          signals.push('Found size-related content');
      }
      
      // Check 7: Look for "Add to Cart" or similar buttons
      const buttons = Array.from(document.querySelectorAll('button, a[role="button"], input[type="submit"]'));
      const cartButtons = buttons.filter(btn => {
          const text = btn.textContent?.toLowerCase() || '';
          const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
          return text.includes('add to') || text.includes('buy') || 
                 text.includes('shop') || ariaLabel.includes('add to') ||
                 text.includes('select size') || text.includes('choose size');
      });
      
      if (cartButtons.length > 0) {
          score += 1;
          signals.push('Found shopping action buttons');
      }
      
      // Check 7.5: Price elements (REQUIRED for fashion sites)
      const priceElements = document.querySelectorAll('[class*="price"], [class*="Price"], [itemprop="price"], [data-price], .price, .Price');
      const hasPriceElements = priceElements.length > 0;
      if (!hasPriceElements) {
          // Penalize sites with no price elements
          score -= 2;
          signals.push('No price elements found');
      } else {
          score += 1;
          signals.push(`Found price elements (${priceElements.length})`);
      }
      
      // Check 8: Images with fashion-related alt text
      const images = Array.from(document.querySelectorAll('img')).slice(0, 20); // Check first 20 images
      const fashionImages = images.filter(img => {
          const alt = img.alt?.toLowerCase() || '';
          const src = img.src?.toLowerCase() || '';
          return CONFIG.FASHION_SIGNALS.META_KEYWORDS.some(keyword => 
              alt.includes(keyword) || src.includes(keyword)
          );
      });
      
      if (fashionImages.length >= 3) {
          score += 1;
          signals.push('Found fashion-related images');
      }
      
      // Log detection results
      console.log('[PointFour] Detection Score:', score);
      console.log('[PointFour] Signals found:', signals);
      
      detectionScore = score;
      return {
          isFashionSite: score >= CONFIG.DETECTION_THRESHOLDS.MIN_SCORE,
          isHighConfidence: score >= CONFIG.DETECTION_THRESHOLDS.HIGH_CONFIDENCE,
          score: score,
          signals: signals,
          productElementsCount: productElementsCount,
          hasPriceElements: hasPriceElements
      };
  }
  
  function shouldRunOnThisPage() {
      // Basic checks first
      if (window.location.protocol !== 'http:' && window.location.protocol !== 'https:') {
          console.log('[PointFour] Skipping: Not an HTTP/HTTPS page');
          return false;
      }
      
      const internalPages = ['chrome://', 'chrome-extension://', 'about:', 'file://'];
      if (internalPages.some(prefix => window.location.href.startsWith(prefix))) {
          console.log('[PointFour] Skipping: Browser internal page');
          return false;
      }
      
      // DOMAIN EXCLUSION LIST - Completely exclude these domains
      const excludedDomains = [
          'localhost', '127.0.0.1', '0.0.0.0',
          'github.com', 'gitlab.com', 'bitbucket.org',
          'stackoverflow.com', 'stackexchange.com', 'reddit.com',
          'google.com', 'google.co.uk', 'google.ca', 'google.de', 'google.fr', 'google.it', 'google.es', 'google.nl', 'google.be', 'google.ch', 'google.at', 'google.pl', 'google.ru', 'google.in', 'google.com.au', 'google.com.br', 'google.com.mx', 'google.co.jp', 'google.co.kr', 'google.com.sg', 'google.co.za', 'google.se', 'google.no', 'google.dk', 'google.fi', 'google.pt', 'google.gr', 'google.ie', 'google.hu', 'google.cz', 'google.sk', 'google.ro', 'google.bg', 'google.hr', 'google.si', 'google.lt', 'google.lv', 'google.ee',
          'bing.com', 'yahoo.com', 'duckduckgo.com', 'baidu.com', 'yandex.com', 'ask.com',
          'cursor.sh', 'claude.ai', 'chatgpt.com', 'openai.com',
          'vercel.app', 'netlify.app', 'herokuapp.com',
          'twitter.com', 'facebook.com', 'instagram.com', 'linkedin.com',
          'youtube.com', 'twitch.tv', 'discord.com',
          'medium.com', 'dev.to', 'hashnode.dev',
          'notion.so', 'figma.com', 'canva.com',
          'slack.com', 'zoom.us', 'teams.microsoft.com',
          'wikipedia.org', 'wikimedia.org'
      ];
      
      const hostname = window.location.hostname.toLowerCase();
      
      // Strong exclusion check - exact match or ends with domain
      const isExcluded = excludedDomains.some(domain => {
          return hostname === domain || hostname.endsWith('.' + domain);
      });
      
      if (isExcluded) {
          console.log(`[PointFour] Skipping: Excluded domain (${hostname})`);
          return false;
      }
      
      // DOMAIN WHITELIST - Always allow known fashion sites
      const whitelistDomains = [
          'deijistudios.com',
          'aritzia.com',
          'zara.com',
          'roheframes.com',
          'cos.com',
          'everlane.com'
      ];
      const isWhitelisted = whitelistDomains.some(d => hostname === d || hostname.endsWith('.' + d));

      // Skip PointFour's own domain to avoid widget showing on style page
      if (hostname.includes('pointfour.in') || hostname.includes('localhost')) {
          console.log('[PointFour] Skipping: PointFour domain');
          return false;
      }
      
      if (window.location.href === 'about:blank' || window.location.href === '') {
          console.log('[PointFour] Skipping: Blank page');
          return false;
      }
      
      // DOMAIN VERIFICATION - Must look like e-commerce or fashion
      const hasEcommerceIndicators = hostname.includes('shop') || 
                                   hostname.includes('store') || 
                                   hostname.includes('boutique') ||
                                   hostname.includes('fashion') ||
                                   hostname.includes('clothing') ||
                                   hostname.includes('apparel');
      
      // Skip pages that are definitely not shopping pages
      const excludePatterns = [
          '/cart', '/checkout', '/payment', '/login', '/register', 
          '/account', '/privacy', '/terms', '/about', '/contact',
          '/help', '/support', '/faq', '/blog', '/news', '/docs',
          '/documentation', '/api', '/admin', '/dashboard'
      ];
      
      const currentPath = window.location.pathname.toLowerCase();
      if (excludePatterns.some(pattern => currentPath.includes(pattern))) {
          console.log('[PointFour] Skipping: Non-shopping page');
          return false;
      }
      
      // Now do intelligent detection with higher standards
      const detection = detectFashionSite();
      
      // Accept if:
      // - Domain is whitelisted
      // - OR we meet hostname e-commerce indicators
      // - OR we have high confidence
      // - OR we have strong product signals (product indicators + price elements)
      const hasStrongProductSignals = (detection.productElementsCount >= 3 && detection.hasPriceElements);
      
      if (
          isWhitelisted ||
          (detection.isFashionSite && (hasEcommerceIndicators || detection.isHighConfidence || hasStrongProductSignals))
      ) {
          console.log(`[PointFour] Fashion site verified! (Score: ${detection.score}, E-commerce: ${hasEcommerceIndicators}, Whitelist: ${isWhitelisted}, StrongSignals: ${hasStrongProductSignals})`);
          return true;
      } else {
          console.log(`[PointFour] Not a verified fashion site (Score: ${detection.score}, E-commerce: ${hasEcommerceIndicators}, Whitelist: ${isWhitelisted})`);
          return false;
      }
  }

  // ========================================
  // BRAND DETECTION
  // ========================================
  
  function detectBrandFromPage() {
      console.log('[PointFour] Detecting brand...');
      
      let detectedBrand = null;
      
      // Method 1: Check meta tags
      const metaTags = {
          'og:site_name': document.querySelector('meta[property="og:site_name"]')?.content,
          'og:brand': document.querySelector('meta[property="og:brand"]')?.content,
          'product:brand': document.querySelector('meta[property="product:brand"]')?.content,
          'twitter:site': document.querySelector('meta[name="twitter:site"]')?.content,
          'application-name': document.querySelector('meta[name="application-name"]')?.content,
          'author': document.querySelector('meta[name="author"]')?.content
      };
      
      for (const [key, value] of Object.entries(metaTags)) {
          if (value && value.length > 1 && value.length < 50) { // Reasonable brand name length
              detectedBrand = value.replace('@', '').trim();
              console.log(`[PointFour] Brand detected from ${key}:`, detectedBrand);
              break;
          }
      }
      
      // Method 2: Check structured data
      if (!detectedBrand) {
          const jsonLd = document.querySelectorAll('script[type="application/ld+json"]');
          for (const script of jsonLd) {
              try {
                  const data = JSON.parse(script.textContent);
                  
                  // Direct brand property
                  if (data.brand?.name) {
                      detectedBrand = data.brand.name;
                      console.log('[PointFour] Brand from structured data:', detectedBrand);
                      break;
                  }
                  
                  // Manufacturer property
                  if (data.manufacturer?.name) {
                      detectedBrand = data.manufacturer.name;
                      console.log('[PointFour] Brand from manufacturer:', detectedBrand);
                      break;
                  }
                  
                  // Graph structure
                  if (data['@graph']) {
                      for (const item of data['@graph']) {
                          if (item.brand?.name || item.manufacturer?.name) {
                              detectedBrand = item.brand?.name || item.manufacturer?.name;
                              console.log('[PointFour] Brand from graph:', detectedBrand);
                              break;
                          }
                      }
                  }
              } catch (e) {
                  // Continue to next script
              }
          }
      }
      
      // Method 3: Check common brand selectors
      if (!detectedBrand) {
          const selectors = [
              '[itemprop="brand"]',
              '[data-brand]',
              '.brand-name',
              '.product-brand',
              '.designer-name',
              '.vendor',
              '.manufacturer',
              'h1 .brand',
              '.product-info .brand',
              '[class*="product-brand"]',
              '[class*="brand-title"]'
          ];
          
          for (const selector of selectors) {
              const element = document.querySelector(selector);
              if (element) {
                  const text = element.textContent?.trim();
                  if (text && text.length > 1 && text.length < 50) {
                      detectedBrand = text;
                      console.log(`[PointFour] Brand from selector ${selector}:`, detectedBrand);
                      break;
                  }
              }
          }
      }
      
      // Method 4: Check logo/header area
      if (!detectedBrand) {
          const logoSelectors = [
              'header .logo img[alt]',
              '.site-logo img[alt]',
              '.navbar-brand',
              '.header-logo',
              'a[href="/"] img[alt]'
          ];
          
          for (const selector of logoSelectors) {
              const element = document.querySelector(selector);
              if (element) {
                  const altText = element.alt || element.textContent;
                  if (altText && altText.length > 1 && altText.length < 50) {
                      detectedBrand = altText.trim();
                      console.log(`[PointFour] Brand from logo:`, detectedBrand);
                      break;
                  }
              }
          }
      }
      
      // Method 5: Smart domain parsing (improved)
      if (!detectedBrand) {
          const domain = window.location.hostname.replace('www.', '');
          const domainParts = domain.split('.');
          let brandFromDomain = domainParts[0];
          
          // Remove common e-commerce platforms
          const platformDomains = ['shopify', 'squarespace', 'wix', 'bigcommerce', 'shop'];
          if (!platformDomains.includes(brandFromDomain.toLowerCase())) {
              // Capitalize properly (handle names like "cottonon" -> "Cotton On")
              brandFromDomain = brandFromDomain
                  .replace(/([a-z])([A-Z])/g, '$1 $2') // CamelCase to spaces
                  .replace(/[_-]/g, ' ') // Replace underscores and dashes
                  .split(' ')
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                  .join(' ');
              
              detectedBrand = brandFromDomain;
              console.log('[PointFour] Brand from domain:', detectedBrand);
          }
      }
      
      return detectedBrand;
  }

  // ========================================
  // HELPER FUNCTIONS
  // ========================================
  
  function extractQualityInsights(searchData) {
    if (!searchData || !searchData.brandFitSummary || !searchData.brandFitSummary.sections) {
        return null;
    }
    
    const sections = searchData.brandFitSummary.sections;
    const insights = [];
    
    // Check for quality section
    if (sections.quality) {
        insights.push({
            type: 'quality',
            recommendation: sections.quality.recommendation,
            confidence: sections.quality.confidence,
            priority: 3 // Highest priority
        });
    }
    
    // Check for fabric section
    if (sections.fabric) {
        insights.push({
            type: 'fabric',
            recommendation: sections.fabric.recommendation,
            confidence: sections.fabric.confidence,
            priority: 2
        });
    }
    
    // Check for wash care section
    if (sections.washCare) {
        insights.push({
            type: 'care',
            recommendation: sections.washCare.recommendation,
            confidence: sections.washCare.confidence,
            priority: 1
        });
    }
    
    if (insights.length === 0) {
        return null;
    }
    
    // Sort by priority (highest first) and combine
    insights.sort((a, b) => b.priority - a.priority);
    
    // Build a comprehensive but concise recommendation
    const recommendations = [];
    
    // Add quality info first if available
    const qualityInsight = insights.find(i => i.type === 'quality');
    if (qualityInsight) {
        recommendations.push(qualityInsight.recommendation);
    }
    
    // Add fabric info if different from quality
    const fabricInsight = insights.find(i => i.type === 'fabric');
    if (fabricInsight && !qualityInsight?.recommendation.toLowerCase().includes('material')) {
        recommendations.push(fabricInsight.recommendation);
    }
    
    // Add care info if significant
    const careInsight = insights.find(i => i.type === 'care');
    if (careInsight && careInsight.confidence !== 'low') {
        recommendations.push(careInsight.recommendation);
    }
    
    // Get the highest confidence level from included insights
    const includedConfidences = recommendations.length > 0 ? 
        insights.filter(i => recommendations.some(r => r === i.recommendation))
               .map(i => i.confidence)
               .filter(Boolean) : [];
    
    const highestConfidence = includedConfidences.includes('high') ? 'high' : 
                             includedConfidences.includes('medium') ? 'medium' : 'low';
    
    return recommendations.length > 0 ? {
        recommendation: recommendations.join('. '),
        confidence: highestConfidence,
        sections: insights.length
    } : null;
  }

  // ========================================
  // WIDGET CREATION & MANAGEMENT
  // ========================================
  
  function createWidget() {
      if (widgetInjected) {
          console.log('[PointFour] Widget already exists');
          return;
      }
      
      console.log('[PointFour] Creating widget...');
      
      widgetContainer = document.createElement('div');
      widgetContainer.id = 'pointfour-widget';
      widgetContainer.className = 'pointfour-widget pointfour-loading';
      
      // Add confidence indicator based on detection score
      if (detectionScore >= CONFIG.DETECTION_THRESHOLDS.HIGH_CONFIDENCE) {
          widgetContainer.classList.add('high-confidence');
      }
      
      widgetContainer.innerHTML = `
          <div class="pointfour-header">
              <div class="pointfour-logo">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <circle cx="12" cy="12" r="10" stroke-width="2"/>
                      <path d="M12 6v6l4 2" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                  <span>PointFour</span>
              </div>
              <button class="pointfour-close" aria-label="Close">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <line x1="18" y1="6" x2="6" y2="18" stroke-width="2" stroke-linecap="round"/>
                      <line x1="6" y1="6" x2="18" y2="18" stroke-width="2" stroke-linecap="round"/>
                  </svg>
              </button>
          </div>
          <div class="pointfour-content">
              <div class="pointfour-loading-spinner">
                  <div class="pointfour-spinner"></div>
                  <p>Analyzing fit data...</p>
              </div>
          </div>
      `;
      
      document.body.appendChild(widgetContainer);
      widgetInjected = true;
      
      // Add event listeners
      const closeBtn = widgetContainer.querySelector('.pointfour-close');
      if (closeBtn) {
          closeBtn.addEventListener('click', hideWidget);
      }
      
      // Click outside to close
      document.addEventListener('click', function(e) {
          if (widgetContainer && !widgetContainer.contains(e.target)) {
              hideWidget();
          }
      });
      
      console.log('[PointFour] Widget created successfully');
  }
  
  function showWidget() {
    if (!widgetContainer) return;
    
    // Force display and visibility
    widgetContainer.style.display = 'block';
    widgetContainer.style.visibility = 'visible';
    
    // Trigger reflow to ensure CSS transition works
    widgetContainer.offsetHeight;
    
    // Add the visible class
    widgetContainer.classList.add('pointfour-visible');
    
    console.log('[PointFour] Widget shown');
  }
  
  function hideWidget() {
      if (!widgetContainer) return;
      widgetContainer.classList.remove('pointfour-visible');
      
      setTimeout(() => {
          if (widgetContainer && !widgetContainer.classList.contains('pointfour-visible')) {
              widgetContainer.remove();
              widgetContainer = null;
              widgetInjected = false;
          }
      }, 300);
  }
  
  function updateWidgetContent(data) {
    if (!widgetContainer) return;
    
    const contentDiv = widgetContainer.querySelector('.pointfour-content');
    if (!contentDiv) return;
    
    // Keep loading state if we're still processing
    if (isProcessing && !data) {
        console.log('[PointFour] Still processing, maintaining loading state');
        return;
    }
    
    // Only remove loading state when we have actual data or an error
    if (data) {
        widgetContainer.classList.remove('pointfour-loading');
    }
    
    if (data && data.error) {
        contentDiv.innerHTML = `
            <div class="pointfour-error">
                <p>Unable to load fit analysis</p>
                <small>${data.error === true ? 'Please try refreshing the page' : data.error}</small>
            </div>
        `;
    } else if (data && data.status === 'no_data') {
        contentDiv.innerHTML = `
            <div class="pointfour-no-data">
                <p>${data.message || 'No fit data available for this brand'}</p>
                <small>We're working on adding more brands!</small>
            </div>
        `;
    } else if (data) {
        // Handle the actual data structure from background script
        console.log('🔍 DEBUGGING: Complete data object received from background:', JSON.stringify(data, null, 2));
        
        const brandName = data.brandName || currentBrand || 'Unknown Brand';
        const fitTips = data.fitTips || [];
        const hasData = data.hasData;
        const totalReviews = data.externalSearchResults?.totalResults || 0;
        
        // Smart summary detection - check multiple locations
        const findBestSummary = () => {
            console.log('🔍 DEBUGGING: Content script received data structure:', {
                hasExternalSearchResults: !!data.externalSearchResults,
                hasRichSummaryData: !!data.richSummaryData,
                hasBrandFitSummary: !!data.brandFitSummary,
                hasRecommendation: !!data.recommendation,
                recommendationPreview: data.recommendation?.substring(0, 100) + '...' || 'N/A'
            });
            
            console.log('🔍 DEBUGGING: External search results structure:', {
                exists: !!data.externalSearchResults,
                hasBrandFitSummary: !!data.externalSearchResults?.brandFitSummary,
                brandFitSummaryStructure: data.externalSearchResults?.brandFitSummary ? Object.keys(data.externalSearchResults.brandFitSummary) : 'N/A',
                summaryExists: !!data.externalSearchResults?.brandFitSummary?.summary,
                summaryPreview: data.externalSearchResults?.brandFitSummary?.summary?.substring(0, 100) + '...' || 'N/A'
            });
            
            // Priority 1: Check for structured brandFitSummary
            const summaryLocations = [
                {name: 'externalSearchResults', value: data.externalSearchResults?.brandFitSummary?.summary},
                {name: 'richSummaryData', value: data.richSummaryData?.brandFitSummary?.summary},
                {name: 'brandFitSummary', value: data.brandFitSummary?.summary}
            ];
            
            console.log('🔍 DEBUGGING: Checking summary locations:', summaryLocations.map(loc => ({
                location: loc.name,
                exists: !!loc.value,
                includesBasedOn: loc.value ? loc.value.includes('Based on') : false,
                preview: loc.value?.substring(0, 50) + '...' || 'N/A'
            })));
            
            for (const location of summaryLocations) {
                if (location.value && location.value.trim().length > 50) {
                    // Accept any substantial summary, not just ones starting with "Based on"
                    console.log('✅ DEBUGGING: Found summary in:', location.name, 'Preview:', location.value.substring(0, 100) + '...');
                    return location.value;
                }
            }
            
            // Priority 2: Use recommendation field (from Phase 1 fix)
            console.log('🔍 DEBUGGING: Checking recommendation field:', {
                exists: !!data.recommendation,
                includesBasedOn: data.recommendation ? data.recommendation.includes('Based on') : false,
                preview: data.recommendation?.substring(0, 100) + '...' || 'N/A'
            });
            
            if (data.recommendation && data.recommendation.trim().length > 50 && data.recommendation !== 'Analyzing fit information...') {
                console.log('✅ DEBUGGING: Using recommendation field');
                return data.recommendation;
            }
            
            // Priority 3: Try to find ANY summary content in the API response
            console.log('🔍 DEBUGGING: Trying fallback - any summary content from API');
            const fallbackSummary = data.externalSearchResults?.brandFitSummary?.summary || 
                                   data.brandFitSummary?.summary ||
                                   data.richSummaryData?.brandFitSummary?.summary;
            
            if (fallbackSummary && fallbackSummary.trim().length > 20) {
                console.log('✅ DEBUGGING: Using fallback summary:', fallbackSummary.substring(0, 100) + '...');
                return fallbackSummary;
            }
            
            // Priority 3.5: Try to construct summary from sections if available
            const sections = data.externalSearchResults?.brandFitSummary?.sections || data.brandFitSummary?.sections;
            if (sections && Object.keys(sections).length > 0) {
                console.log('🔍 DEBUGGING: Trying to construct summary from sections:', Object.keys(sections));
                const sectionSummaries = [];
                
                if (sections.fit) {
                    sectionSummaries.push(sections.fit.recommendation);
                }
                if (sections.quality) {
                    sectionSummaries.push(sections.quality.recommendation);
                }
                if (sections.fabric) {
                    sectionSummaries.push(sections.fabric.recommendation);
                }
                
                if (sectionSummaries.length > 0) {
                    const constructedSummary = sectionSummaries.join('. ');
                    console.log('✅ DEBUGGING: Using constructed summary from sections');
                    return constructedSummary;
                }
            }
            
            // Priority 4: If we have reviews, create a basic summary
            if (totalReviews > 0) {
                const basicSummary = `Found ${totalReviews} reviews for ${brandName}. Analysis in progress - detailed fit and quality information available.`;
                console.log('✅ DEBUGGING: Using basic summary with review count');
                return basicSummary;
            }
            
            // Priority 5: Default loading message
            console.log('❌ DEBUGGING: No valid summary found, using loading message');
            return 'Analyzing fit information...';
        };
        
        const recommendation = findBestSummary();
        console.log('📋 Content script summary:', {
            brandName,
            summaryFound: recommendation !== 'Analyzing fit information...',
            summaryPreview: recommendation.substring(0, 100) + '...',
            hasData,
            totalReviews
        });
        
        // Check if we're still in loading state - be more restrictive about showing loading
        const isStillLoading = recommendation === 'Analyzing fit information...' && 
                              totalReviews === 0 && 
                              !hasData &&
                              !data.externalSearchResults;
        
        if (isStillLoading) {
            // Still loading - show spinner
            contentDiv.innerHTML = `
                <div class="pointfour-results">
                    <h3>${brandName}</h3>
                    <div class="pointfour-fit-info">
                        <div class="pointfour-loading-spinner">
                            <div class="pointfour-spinner"></div>
                            <p>Searching for reviews and fit information...</p>
                        </div>
                    </div>
                </div>
            `;
            return;
        }
        
        // Extract structured fit and quality data from search results
        const extractStructuredAnalysis = () => {
            const searchData = data.externalSearchResults?.brandFitSummary || 
                              data.richSummaryData?.brandFitSummary || 
                              data.brandFitSummary;
            
            if (!searchData) return null;
            
            return {
                fit: searchData.sections?.fit,
                quality: searchData.sections?.quality,
                fabric: searchData.sections?.fabric,
                washCare: searchData.sections?.washCare,
                confidence: searchData.confidence,
                totalResults: totalReviews
            };
        };

        const structuredData = extractStructuredAnalysis();
        
        // Determine if this is a bag brand for appropriate labeling
        const isBagBrand = brandName.toLowerCase().includes('bag') || 
                          brandName.toLowerCase().includes('backpack') ||
                          brandName.toLowerCase().includes('handbag') ||
                          window.location.href.toLowerCase().includes('bag') ||
                          document.title.toLowerCase().includes('bag') ||
                          document.title.toLowerCase().includes('backpack');
        
        // Create quality badge based on structured data
        let qualityBadge = '';
        if (structuredData?.quality) {
            if (structuredData.quality.confidence === 'high') {
                const badgeText = isBagBrand ? '⭐ HIGH CONSTRUCTION' : '⭐ HIGH QUALITY';
                qualityBadge = `<div class="pointfour-quality-badge">${badgeText}</div>`;
            } else if (structuredData.quality.confidence === 'medium') {
                const badgeText = isBagBrand ? '✓ GOOD CONSTRUCTION' : '✓ GOOD QUALITY';
                qualityBadge = `<div class="pointfour-quality-badge medium-quality">${badgeText}</div>`;
            }
        }
        
        let content = `
            <div class="pointfour-results">
                <h3>${brandName}</h3>
                ${qualityBadge}
        `;
        
        // FIT SECTION - Always show if we have fit data or general recommendation
        if (structuredData?.fit) {
            content += `
                <div class="pointfour-fit-info">
                    <h4>Fit Analysis:</h4>
                    <ul class="pointfour-bullet-list">
                        <li>${structuredData.fit.recommendation}</li>
                        ${structuredData.fit.confidence ? `<li class="pointfour-source">Confidence: ${structuredData.fit.confidence.toUpperCase()}</li>` : ''}
                    </ul>
                </div>
            `;
        } else if (recommendation !== 'Analyzing fit information...' && totalReviews > 0) {
            // Fallback: try to extract fit info from the general recommendation
            const fitKeywords = ['runs small', 'runs large', 'true to size', 'size up', 'size down', 'tight', 'loose', 'fits'];
            const hasFitInfo = fitKeywords.some(keyword => recommendation.toLowerCase().includes(keyword));
            
            if (hasFitInfo) {
                content += `
                    <div class="pointfour-fit-info">
                        <h4>Fit Analysis:</h4>
                        <ul class="pointfour-bullet-list">
                            <li>${recommendation}</li>
                        </ul>
                    </div>
                `;
            } else {
                // Show general summary under brand name if no specific fit data
                content += `
                    <div class="pointfour-fit-info">
                        <h4>Analysis Summary:</h4>
                        <ul class="pointfour-bullet-list">
                            <li>${recommendation}</li>
                        </ul>
                    </div>
                `;
            }
        } else if (totalReviews > 0) {
            // Show basic info when we have reviews but no detailed analysis
            content += `
                <div class="pointfour-fit-info">
                    <h4>Fit Analysis:</h4>
                    <ul class="pointfour-bullet-list">
                        <li>Analysis in progress. Found ${totalReviews} review${totalReviews === 1 ? '' : 's'} for ${brandName}.</li>
                    </ul>
                </div>
            `;
        }
        
        // QUALITY SECTION - Show structured quality info with appropriate header
        const qualityInsights = structuredData ? extractQualityInsights({ brandFitSummary: { sections: structuredData } }) : null;
        if (qualityInsights) {
            const sectionHeader = isBagBrand ? 'Quality & Construction:' : 'Quality & Materials:';
            
            content += `
                <div class="pointfour-quality-info">
                    <h4>${sectionHeader}</h4>
                    <ul class="pointfour-bullet-list">
                        <li>${qualityInsights.recommendation}</li>
                        ${qualityInsights.confidence ? `<li class="pointfour-source">Confidence: ${qualityInsights.confidence.toUpperCase()}</li>` : ''}
                    </ul>
                </div>
            `;
        } else if (structuredData?.quality) {
            // Fallback: show quality section directly if available
            const sectionHeader = isBagBrand ? 'Quality & Construction:' : 'Quality & Materials:';
            content += `
                <div class="pointfour-quality-info">
                    <h4>${sectionHeader}</h4>
                    <ul class="pointfour-bullet-list">
                        <li>${structuredData.quality.recommendation}</li>
                        ${structuredData.quality.confidence ? `<li class="pointfour-source">Confidence: ${structuredData.quality.confidence.toUpperCase()}</li>` : ''}
                    </ul>
                </div>
            `;
        }
        
        // WASH/CARE SECTION - Show if we have wash/care data
        if (structuredData?.washCare && structuredData.washCare.recommendation) {
            content += `
                <div class="pointfour-washcare-info">
                    <h4>Wash & Care:</h4>
                    <ul class="pointfour-bullet-list">
                        <li>${structuredData.washCare.recommendation}</li>
                        ${structuredData.washCare.confidence ? `<li class="pointfour-source">Confidence: ${structuredData.washCare.confidence.toUpperCase()}</li>` : ''}
                    </ul>
                </div>
            `;
        }
        
        // FABRIC SECTION - Show if we have fabric/material data
        if (structuredData?.fabric && structuredData.fabric.recommendation) {
            content += `
                <div class="pointfour-fabric-info">
                    <h4>Materials:</h4>
                    <ul class="pointfour-bullet-list">
                        <li>${structuredData.fabric.recommendation}</li>
                        ${structuredData.fabric.confidence ? `<li class="pointfour-source">Confidence: ${structuredData.fabric.confidence.toUpperCase()}</li>` : ''}
                    </ul>
                </div>
            `;
        }
        
        // Add confidence indicator for overall analysis
        if (structuredData?.confidence && totalReviews > 0) {
            content += `
                <div class="pointfour-confidence">
                    <small>Based on ${totalReviews} review${totalReviews === 1 ? '' : 's'} • ${structuredData.confidence.toUpperCase()} confidence</small>
                </div>
            `;
        } else if (totalReviews > 0) {
            // Show basic confidence info when we have reviews but no structured confidence
            content += `
                <div class="pointfour-confidence">
                    <small>Based on ${totalReviews} review${totalReviews === 1 ? '' : 's'}</small>
                </div>
            `;
        }
        
        if (fitTips.length > 0) {
            content += `
                <div class="pointfour-fit-tips">
                    <h4>Fit Tips:</h4>
                    <ul>
                        ${fitTips.map(tip => `<li>${tip}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
        
        // Add clickable button for review count
        if (totalReviews > 0) {
            // Create a search query for the analyze page
            const searchQuery = encodeURIComponent(brandName);
            const analyzeUrl = `https://www.pointfour.in/extension-reviews?brand=${searchQuery}`;            
            content += `
                <div class="pointfour-search-info">
                    <a href="${analyzeUrl}" 
                       target="_blank" 
                       rel="noopener noreferrer" 
                       class="pointfour-reviews-button">
                        <span>Found ${totalReviews} reviews</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M7 17L17 7"></path>
                            <path d="M7 7h10v10"></path>
                        </svg>
                    </a>
                </div>
            `;
        }

        // Add "Style with your pieces" button when we have fit data
        if (recommendation !== 'Analyzing fit information...' && totalReviews > 0) {
            content += `
                <div class="pointfour-style-info">
                    <button class="pointfour-style-button" id="pointfour-style-btn">
                        <span>✨ Style with your pieces</span>
                    </button>
                </div>
            `;
        }
        
        // DEBUG: Show data structure when in development
        if (window.location.hostname === 'localhost' || window.location.hostname.includes('pointfour.in')) {
            content += `
                <div class="pointfour-debug" style="margin-top: 12px; padding: 8px; background: #f5f5f5; border-radius: 4px; font-size: 10px; color: #666;">
                    <strong>Debug Info:</strong><br>
                    Has structured data: ${!!structuredData}<br>
                    Has fit data: ${!!structuredData?.fit}<br>
                    Has quality data: ${!!structuredData?.quality}<br>
                    Total reviews: ${totalReviews}<br>
                    Recommendation length: ${recommendation?.length || 0}
                </div>
            `;
        }
        
        content += `
                </div>
            </div>
        `;
        
        contentDiv.innerHTML = content;
        
        // Add event listener for Style button
        const styleButton = contentDiv.querySelector('#pointfour-style-btn');
        if (styleButton) {
            styleButton.addEventListener('click', () => handleStyleButtonClick(brandName, data));
        }
    }
}


  // ========================================
  // STYLE BUTTON FUNCTIONALITY
  // ========================================
  
  function handleStyleButtonClick(brandName, data) {
      console.log('🎨 Style button clicked for brand:', brandName);
      
      // Extract product image from current page
      const productImage = extractProductImageFromPage();
      
      // Extract item name from page title/URL
      const itemName = extractItemNameFromPage();
      
      // Build parameters for the style page
      const params = new URLSearchParams({
          brand: brandName || '',
          itemName: itemName || '',
          imageUrl: productImage || '',
          pageUrl: window.location.href
      });

      // Open the style page in a new tab
      const styleUrl = `https://www.pointfour.in/style?${params.toString()}`;
      console.log('🎨 Opening style URL:', styleUrl);
      
      window.open(styleUrl, '_blank', 'noopener,noreferrer');
  }
  
function extractProductImageFromPage() {
    // Helper to check if image URL suggests it's product-only
    const isLikelyProductOnly = (url) => {
      if (!url) return false;
      const urlLower = url.toLowerCase();
      
      // Positive indicators (product only)
      const productIndicators = ['_flat', '_alt', '_back', '_detail', '_zoom', '_product', '_still', '_02', '_03', '_04'];
      // Negative indicators (has model)
      const modelIndicators = ['_model', '_worn', '_lifestyle', '_hero', '_campaign', '_01'];
      
      const hasProductIndicator = productIndicators.some(ind => urlLower.includes(ind));
      const hasModelIndicator = modelIndicators.some(ind => urlLower.includes(ind));
      
      return hasProductIndicator && !hasModelIndicator;
    };
  
    // First, try to find product gallery images
    const galleryImages = [];
    const gallerySelectors = [
      '.product-thumbnails img',
      '.product-gallery__thumbnail img',
      '.thumbnails img',
      '[class*="thumb"] img',
      '.product-images img',
      '.product__photos img',
      '[class*="ProductThumbnail"] img',
      '.swiper-slide img',
      '.slick-slide img'
    ];
    
    for (const selector of gallerySelectors) {
      document.querySelectorAll(selector).forEach(img => {
        if (img.src && img.src.startsWith('http')) {
          const cleanSrc = img.src.split('?')[0]; // Remove query parameters
          if (!galleryImages.includes(cleanSrc)) {
            galleryImages.push(cleanSrc);
          }
        }
      });
    }
    
    console.log('🎨 Found gallery images:', galleryImages.length);
    
    // Check gallery images for product-only shots
    for (const imgUrl of galleryImages) {
      if (isLikelyProductOnly(imgUrl)) {
        console.log('🎨 Found product-only image in gallery:', imgUrl);
        return imgUrl;
      }
    }
    
    // If gallery has multiple images, often 2nd or 3rd is product-only
    if (galleryImages.length > 1) {
      // Skip first (usually hero/model) and check next few
      for (let i = 1; i < Math.min(4, galleryImages.length); i++) {
        if (!galleryImages[i].includes('_01') && !galleryImages[i].includes('hero')) {
          console.log('🎨 Using gallery image #' + (i+1) + ' as likely product-only:', galleryImages[i]);
          return galleryImages[i];
        }
      }
    }
    
    // Try specific selectors for product-only images
    const productOnlySelectors = [
      'img[alt*="flat" i]',
      'img[alt*="product" i]',
      'img[alt*="detail" i]',
      'img[src*="_flat"]',
      'img[src*="_alt"]',
      'img[src*="_detail"]',
      'img[src*="_back"]',
      '.product-image-alt img',
      '.product-flat-lay img'
    ];
    
    for (const selector of productOnlySelectors) {
      try {
        const element = document.querySelector(selector);
        if (element && element.src && element.src.startsWith('http')) {
          console.log('🎨 Found product-only image with selector:', selector);
          return element.src.split('?')[0];
        }
      } catch (e) {
        // Continue if selector fails
      }
    }
    
    // Fallback to meta tags but check if they're product-only
    const metaImage = document.querySelector('meta[property="og:image"]');
    if (metaImage && metaImage.content) {
      const metaImageUrl = metaImage.content;
      if (isLikelyProductOnly(metaImageUrl)) {
        console.log('🎨 Using meta image as product-only');
        return metaImageUrl;
      }
    }
    
    // Last resort: main product image
    const mainImageSelectors = [
      '.product-image img',
      '.product-photo img',
      '[class*="ProductImage"] img',
      'picture img',
      'main img'
    ];
  
    for (const selector of mainImageSelectors) {
      const element = document.querySelector(selector);
      if (element && element.src && element.src.startsWith('http')) {
        console.log('🎨 Using main image (may include model):', selector);
        return element.src.split('?')[0];
      }
    }
    
    console.log('🎨 No product image found');
    return null;
  }
  
  function extractItemNameFromPage() {
      // Try to extract item name from various page elements
      const selectors = [
          'h1',
          '.product-title',
          '.product-name',
          '[data-testid*="title"]',
          '[data-testid*="name"]',
          '.pdp-title',
          '.item-title'
      ];
      
      for (const selector of selectors) {
          const element = document.querySelector(selector);
          if (element) {
              const text = element.textContent?.trim();
              if (text && text.length > 3 && text.length < 200) {
                  console.log('🎨 Found item name with selector:', selector, 'Text:', text);
                  return text;
              }
          }
      }
      
      // Fallback to page title
      const title = document.title;
      if (title && title.length > 3 && title.length < 200) {
          // Clean up title by removing common e-commerce suffixes
          const cleanTitle = title.replace(/\s*[-|]\s*.+$/g, '').trim();
          if (cleanTitle.length > 3) {
              return cleanTitle;
          }
      }
      
      return '';
  }

  // ========================================
  // API COMMUNICATION
  // ========================================
  
  async function fetchBrandAnalysis(brand) {
    if (!brand || isProcessing) return;
    
    // Additional brand validation - don't even attempt to analyze non-fashion brands
    const nonFashionBrands = [
      'google', 'microsoft', 'apple', 'amazon', 'facebook', 'meta', 'twitter', 'x',
      'youtube', 'linkedin', 'instagram', 'tiktok', 'snapchat', 'pinterest',
      'netflix', 'spotify', 'uber', 'lyft', 'airbnb', 'tesla', 'boeing',
      'ford', 'gm', 'toyota', 'honda', 'bmw', 'mercedes', 'audi',
      'walmart', 'target', 'costco', 'home depot', 'lowes', 'cvs', 'walgreens',
      'mcdonalds', 'burger king', 'kfc', 'subway', 'starbucks', 'dunkin',
      'visa', 'mastercard', 'paypal', 'stripe', 'square',
      'reddit', 'github', 'stackoverflow', 'wikipedia', 'twitch'
    ];

    if (nonFashionBrands.includes(brand.toLowerCase().trim())) {
      console.log('[PointFour] Skipping: Non-fashion brand detected:', brand);
      hideWidget();
      return;
    }
    
    console.log('[PointFour] Fetching analysis for brand:', brand);
    isProcessing = true;
    
    // Ensure loading state is shown
    if (widgetContainer) {
        widgetContainer.classList.add('pointfour-loading');
        const contentDiv = widgetContainer.querySelector('.pointfour-content');
        if (contentDiv) {
            contentDiv.innerHTML = `
                <div class="pointfour-loading-spinner">
                    <div class="pointfour-spinner"></div>
                    <p>Searching for ${brand} reviews...</p>
                </div>
            `;
        }
    }
    
    try {
        console.log('[PointFour] Sending message to background script:', {
            type: 'GET_BRAND_DATA',
            brandName: brand,
            url: window.location.href,
            title: document.title
        });
        
        const response = await chrome.runtime.sendMessage({
            type: 'GET_BRAND_DATA',
            brandName: brand,
            url: window.location.href,
            title: document.title
        });
        
        console.log('[PointFour] Received response from background:', response);
        
        // Don't update immediately if we're still waiting for real data
        if (response && response.message === 'Brand detection initiated') {
            console.log('[PointFour] Brand detection in progress, waiting for data...');
            // Keep the loading state - data will come via message listener
            return;
        }
        
        if (response && response.success && response.brandData) {
            console.log('[PointFour] Updating widget with brand data:', response.brandData);
            updateWidgetContent(response.brandData);
        } else if (response && !response.success) {
            console.log('[PointFour] Response indicates failure:', response);
            updateWidgetContent({
                error: response?.message || 'Unable to connect to our servers. Please try again.'
            });
        }
    } catch (error) {
        console.error('[PointFour] Error fetching analysis:', error);
        
        // Only show error if we're truly unable to connect
        if (error.message.includes('Could not establish connection')) {
            updateWidgetContent({
                error: 'Extension is reloading. Please refresh the page.'
            });
        } else {
            // Keep loading state for other errors as data might still be coming
            console.log('[PointFour] Keeping loading state despite error:', error);
        }
    } finally {
        // Don't immediately set isProcessing to false - wait for actual data
        setTimeout(() => {
            isProcessing = false;
        }, 5000); // Give it 5 seconds to receive data
    }
}

  // ========================================
  // MAIN INITIALIZATION
  // ========================================
  
  function initialize() {
      if (initTimeout) {
          clearTimeout(initTimeout);
      }
      
      // Run detection
      if (!shouldRunOnThisPage()) {
          return;
      }
      
      // Wait for page to stabilize
      initTimeout = setTimeout(() => {
          currentBrand = detectBrandFromPage();
          
          if (currentBrand) {
              console.log('[PointFour] Initializing for brand:', currentBrand);
              createWidget();
              
              setTimeout(() => {
                  showWidget();
                  fetchBrandAnalysis(currentBrand);
              }, 100);
          } else {
              console.log('[PointFour] Could not detect brand name');
              // Optionally still show widget with a message
              // createWidget();
              // showWidget();
              // updateWidgetContent({
              //     status: 'no_data',
              //     message: 'Brand not recognized. Try our manual search!'
              // });
          }
      }, CONFIG.INIT_DELAY);
  }

  // ========================================
  // EVENT LISTENERS
  // ========================================
  
  if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initialize);
  } else if (document.readyState === 'interactive') {
      window.addEventListener('load', initialize);
  } else {
      initialize();
  }
  
  // Handle SPA navigation
  let lastUrl = window.location.href;
  const urlObserver = new MutationObserver(() => {
      const currentUrl = window.location.href;
      if (currentUrl !== lastUrl) {
          lastUrl = currentUrl;
          console.log('[PointFour] URL changed, reinitializing...');
          
          if (widgetContainer) {
              widgetContainer.remove();
              widgetContainer = null;
              widgetInjected = false;
          }
          
          initialize();
      }
  });
  
  urlObserver.observe(document.body, {
      childList: true,
      subtree: true
  });
  
  // Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[PointFour] Received message from background:', message);
  
  if (message.type === 'BRAND_DATA') {
      console.log('[PointFour] Processing brand data:', message.data);
      
      // Clear processing flag when we receive actual data
      isProcessing = false;
      
      // Update the widget with the received data
      updateWidgetContent(message.data);
      sendResponse({ success: true });
  } else if (message.type === 'SHOW_MESSAGE') {
      console.log('[PointFour] Show message:', message.message);
      
      // Show the message as an error if widget exists
      if (widgetContainer) {
          updateWidgetContent({
              error: message.message
          });
      }
      sendResponse({ success: true });
  }
  
  return true; // Keep message channel open
});
  
  window.addEventListener('beforeunload', () => {
      if (initTimeout) {
          clearTimeout(initTimeout);
      }
      if (urlObserver) {
          urlObserver.disconnect();
      }
  });

  console.log('[PointFour] Content script loaded - Intelligent detection enabled');
})();