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
          MIN_SCORE: 4,           // Minimum score to detect fashion sites
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
          // Lightly penalize sites with no product indicators
          score -= 1;
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
          // Lightly penalize sites with no price elements
          score -= 1;
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
          // Development and local
          'localhost', '127.0.0.1', '0.0.0.0',
          
          // Code repositories and development
          'github.com', 'gitlab.com', 'bitbucket.org', 'codepen.io', 'jsfiddle.net',
          
          // Forums and Q&A sites
          'stackoverflow.com', 'stackexchange.com', 'reddit.com', 'quora.com',
          
          // Search engines - comprehensive global list
          'google.com', 'google.co.uk', 'google.ca', 'google.de', 'google.fr', 'google.it', 'google.es', 'google.nl', 'google.be', 'google.ch', 'google.at', 'google.pl', 'google.ru', 'google.in', 'google.com.au', 'google.com.br', 'google.com.mx', 'google.co.jp', 'google.co.kr', 'google.com.sg', 'google.co.za', 'google.se', 'google.no', 'google.dk', 'google.fi', 'google.pt', 'google.gr', 'google.ie', 'google.hu', 'google.cz', 'google.sk', 'google.ro', 'google.bg', 'google.hr', 'google.si', 'google.lt', 'google.lv', 'google.ee',
          'bing.com', 'yahoo.com', 'duckduckgo.com', 'baidu.com', 'yandex.com', 'ask.com', 'ecosia.org', 'startpage.com',
          
          // AI and productivity tools
          'cursor.sh', 'claude.ai', 'chatgpt.com', 'openai.com', 'anthropic.com', 'perplexity.ai',
          'copilot.microsoft.com', 'bard.google.com', 'chat.openai.com',
          
          // Hosting and development platforms
          'vercel.app', 'netlify.app', 'herokuapp.com', 'replit.com', 'glitch.com',
          'codesandbox.io', 'stackblitz.com',
          
          // Social media platforms
          'twitter.com', 'x.com', 'facebook.com', 'instagram.com', 'linkedin.com',
          'tiktok.com', 'snapchat.com', 'pinterest.com', 'tumblr.com',
          
          // Video and streaming
          'youtube.com', 'twitch.tv', 'vimeo.com', 'dailymotion.com',
          
          // Communication and collaboration
          'discord.com', 'slack.com', 'zoom.us', 'teams.microsoft.com', 'meet.google.com',
          'telegram.org', 'whatsapp.com', 'signal.org',
          
          // Publishing and blogging platforms
          'medium.com', 'substack.com', 'dev.to', 'hashnode.dev', 'ghost.org',
          'wordpress.com', 'blogger.com', 'wix.com', 'squarespace.com',
          
          // Design and creative tools
          'notion.so', 'figma.com', 'canva.com', 'adobe.com', 'sketch.com',
          'invision.com', 'dribbble.com', 'behance.net',
          
          // Educational and reference
          'wikipedia.org', 'wikimedia.org', 'coursera.org', 'udemy.com', 'edx.org',
          'khanacademy.org', 'duolingo.com',
          
          // News and media sites
          'cnn.com', 'bbc.com', 'nytimes.com', 'guardian.com', 'wsj.com',
          'reuters.com', 'ap.org', 'npr.org', 'bloomberg.com',
          
          // Financial and business
          'paypal.com', 'stripe.com', 'square.com', 'mint.com', 'robinhood.com',
          'coinbase.com', 'binance.com', 'kraken.com',
          
          // Email and cloud services
          'gmail.com', 'outlook.com', 'yahoo.com', 'protonmail.com',
          'dropbox.com', 'onedrive.com', 'icloud.com', 'box.com',
          
          // Maps and navigation
          'maps.google.com', 'maps.apple.com', 'waze.com', 'mapquest.com',
          
          // Home goods and interior design
          'nordicnest.com', 'ikea.com', 'westelm.com', 'potterybarn.com', 'crateandbarrel.com',
          'cb2.com', 'williams-sonoma.com', 'restorationhardware.com', 'wayfair.com',
          'overstock.com', 'bedbathandbeyond.com', 'homegoods.com', 'worldmarket.com',
          
          // Government and official sites
          '.gov', '.edu', '.mil', '.int'
      ];
      
      const hostname = window.location.hostname.toLowerCase();
      
      // Strong exclusion check - exact match, ends with domain, or TLD match
      const isExcluded = excludedDomains.some(domain => {
          if (domain.startsWith('.')) {
              // Handle TLD exclusions like .gov, .edu
              return hostname.endsWith(domain);
          }
          return hostname === domain || hostname.endsWith('.' + domain);
      });
      
      if (isExcluded) {
          console.log(`[PointFour] Skipping: Excluded domain (${hostname})`);
          return false;
      }
      
      // CONTENT-BASED EXCLUSION - Check for non-fashion site indicators in page content
      const pageTitle = document.title.toLowerCase();
      const pageContent = document.body?.textContent?.toLowerCase() || '';
      const metaDescription = document.querySelector('meta[name="description"]')?.content?.toLowerCase() || '';
      const combinedContent = `${pageTitle} ${pageContent.substring(0, 2000)} ${metaDescription}`;
      
      // Strong indicators this is NOT a fashion site - only very specific non-fashion terms
      const strongNonFashionIndicators = [
          'search results for', 'google search', 'bing search',
          'ai assistant', 'chatbot', 'language model',
          'stack overflow', 'github repository',
          'documentation site', 'api reference'
      ];
      
      const foundStrongNonFashionIndicators = strongNonFashionIndicators.filter(indicator => 
          combinedContent.includes(indicator)
      );
      
      if (foundStrongNonFashionIndicators.length > 0) {
          console.log(`[PointFour] Skipping: Strong non-fashion content detected (${foundStrongNonFashionIndicators.slice(0, 2).join(', ')})`);
          return false;
      }
      
      // DOMAIN WHITELIST - Always allow known fashion sites
      const whitelistDomains = [
          'deijistudios.com',
          'on-running.com', 'on.com',
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
  // URL-BASED PRODUCT EXTRACTION
  // ========================================
  
  function extractProductFromURL() {
      console.log('🔗 [PointFour] Starting URL-based product extraction...');
      const url = window.location.href;
      const hostname = window.location.hostname.replace('www.', '').toLowerCase();
      const pathname = window.location.pathname.toLowerCase();
      
      console.log('🔗 [PointFour] URL details:', { url, hostname, pathname });
      
      // URL patterns for major fashion sites
      const sitePatterns = {
          // Rohe Frames - /products/item-name OR /en-uk/collections/tops/products/item-name
          'roheframes.com': {
              pattern: /\/(?:[^\/]+\/)*products\/([^\/\?]+)/,
              brandName: 'Rohe',
              itemProcessor: (match) => {
                  // Remove color suffixes and clean up
                  let itemName = match[1];
                  // Remove common color patterns at the end
                  itemName = itemName.replace(/-(?:black|white|grey|gray|blue|red|green|brown|navy|cream|beige|tan|khaki|olive|burgundy|wine|pink|purple|yellow|orange|silver|gold|bronze|copper)(?:-\w+)*$/i, '');
                  return itemName.replace(/-/g, ' ').trim();
              }
          },
          
          // Zara - various patterns
          'zara.com': {
              pattern: /\/([^\/]+)-p(\d+)\.html/,
              brandName: 'Zara',
              itemProcessor: (match) => match[1].replace(/-/g, ' ')
          },
          
          // Everlane - /products/item-name
          'everlane.com': {
              pattern: /\/products\/([^\/\?]+)/,
              brandName: 'Everlane',
              itemProcessor: (match) => match[1].replace(/-/g, ' ')
          },
          
          // Reformation - /products/item-name
          'reformation.com': {
              pattern: /\/products\/([^\/\?]+)/,
              brandName: 'Reformation',
              itemProcessor: (match) => match[1].replace(/-/g, ' ')
          },
          
          // COS - /en_usd/productpage.item-code.html
          'cosstores.com': {
              pattern: /\/[^\/]+\/productpage\.([^\.]+)\.html/,
              brandName: 'COS',
              itemProcessor: (match) => match[1].replace(/[\d\-\.]+/g, '').replace(/-/g, ' ').trim()
          },
          'cos.com': {
              pattern: /\/[^\/]+\/productpage\.([^\.]+)\.html/,
              brandName: 'COS',
              itemProcessor: (match) => match[1].replace(/[\d\-\.]+/g, '').replace(/-/g, ' ').trim()
          },
          
          // Arket - /en/product/item-name
          'arket.com': {
              pattern: /\/[^\/]+\/product\/([^\/\?]+)/,
              brandName: 'Arket',
              itemProcessor: (match) => match[1].replace(/-/g, ' ')
          },
          
          // & Other Stories - /en/product/item-name
          'stories.com': {
              pattern: /\/[^\/]+\/product\/([^\/\?]+)/,
              brandName: '& Other Stories',
              itemProcessor: (match) => match[1].replace(/-/g, ' ')
          },
          
          // Aritzia - /en/product/item-name/code
          'aritzia.com': {
              pattern: /\/[^\/]+\/product\/([^\/\?]+)\/\d+/,
              brandName: 'Aritzia',
              itemProcessor: (match) => match[1].replace(/-/g, ' ')
          },
          
          // Toteme - /products/item-name
          'toteme-studio.com': {
              pattern: /\/products\/([^\/\?]+)/,
              brandName: 'Toteme',
              itemProcessor: (match) => match[1].replace(/-/g, ' ')
          },
          
          // Ganni - /en-us/item-name
          'ganni.com': {
              pattern: /\/[^\/]+\/([^\/\?]+)(?:\?|$)/,
              brandName: 'Ganni',
              itemProcessor: (match) => {
                  // Skip common page types
                  const item = match[1];
                  if (['collections', 'pages', 'blogs', 'search', 'cart', 'account'].includes(item)) return null;
                  return item.replace(/-/g, ' ');
              }
          },
          
          // Susamusa - /products/item-name
          'susamusa.com': {
              pattern: /\/products\/([^\/\?]+)/,
              brandName: 'Susamusa',
              itemProcessor: (match) => match[1].replace(/-/g, ' ')
          },
          
          // Shopify-based stores - generic pattern
          'generic_shopify': {
              pattern: /\/products\/([^\/\?]+)/,
              brandName: null, // Will be detected separately
              itemProcessor: (match) => match[1].replace(/-/g, ' ')
          }
      };
      
      console.log('[PointFour] Checking URL:', url);
      console.log('[PointFour] Hostname:', hostname);
      
      // First, check specific site patterns
      const siteConfig = sitePatterns[hostname];
      console.log('🔗 [PointFour] Site config found for', hostname, ':', !!siteConfig);
      
      if (siteConfig) {
          console.log('🔗 [PointFour] Testing pattern:', siteConfig.pattern);
          const match = pathname.match(siteConfig.pattern);
          console.log('🔗 [PointFour] Pattern match result:', match);
          
          if (match) {
              const itemName = siteConfig.itemProcessor(match);
              console.log('🔗 [PointFour] Processed item name:', itemName);
              
              if (itemName) {
                  console.log('🔗 [PointFour] ✅ URL extraction successful:', {
                      brand: siteConfig.brandName,
                      item: itemName,
                      source: 'site_specific'
                  });
                  return {
                      brand: siteConfig.brandName,
                      itemName: itemName,
                      confidence: 'high',
                      source: 'url_pattern'
                  };
              }
          }
      }
      
      // Fallback: Generic Shopify pattern detection
      if (pathname.includes('/products/')) {
          const genericMatch = pathname.match(/\/products\/([^\/\?]+)/);
          if (genericMatch) {
              const itemName = genericMatch[1].replace(/-/g, ' ');
              console.log('[PointFour] Generic Shopify pattern detected:', itemName);
              return {
                  brand: null, // Will need to be detected via other methods
                  itemName: itemName,
                  confidence: 'medium',
                  source: 'generic_shopify'
              };
          }
      }
      
      // Additional pattern: WooCommerce sites
      if (pathname.includes('/product/')) {
          const wooMatch = pathname.match(/\/product\/([^\/\?]+)/);
          if (wooMatch) {
              const itemName = wooMatch[1].replace(/-/g, ' ');
              console.log('[PointFour] WooCommerce pattern detected:', itemName);
              return {
                  brand: null,
                  itemName: itemName,
                  confidence: 'medium',
                  source: 'woocommerce'
              };
          }
      }
      
      console.log('[PointFour] No URL patterns matched');
      return null;
  }

  // ========================================
  // BRAND DETECTION
  // ========================================
  
  function detectBrandFromPage() {
      console.log('[PointFour] Detecting brand...');
      console.log('[PointFour] Current URL:', window.location.href);
      console.log('[PointFour] Current pathname:', window.location.pathname);
      
      let detectedBrand = null;
      let urlExtraction = null;
      
      // First, try URL-based extraction
      console.log('[PointFour] About to call extractProductFromURL...');
      urlExtraction = extractProductFromURL();
      if (urlExtraction && urlExtraction.brand) {
          detectedBrand = urlExtraction.brand;
          console.log('[PointFour] Brand detected from URL:', detectedBrand);
          
          // Store URL extraction data for later use
          window.pointFourURLExtraction = urlExtraction;
          return detectedBrand;
      } else if (urlExtraction && urlExtraction.itemName) {
          // We have an item name but need to detect brand via other methods
          console.log('[PointFour] Item detected from URL:', urlExtraction.itemName, '- will detect brand via other methods');
          window.pointFourURLExtraction = urlExtraction;
      }
      
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

  function extractRelevantQuotes(data, section = null, sectionClaim = null) {
    if (!data.externalSearchResults?.reviews || !section || !sectionClaim) {
        return [];
    }
    
    const reviews = data.externalSearchResults.reviews;
    const quotes = [];
    
    // Helper function to detect if text sounds like a genuine user review
    const isUserReview = (text) => {
        const userReviewIndicators = [
            // Personal pronouns and opinions
            /\bi\s/i, /\bmy\s/i, /\bme\s/i, /\bwould\s/i, /\blove\s/i, /\bhate\s/i, /\bthink\s/i, /\bfeel\s/i,
            // Purchase/experience language
            /\bbought\s/i, /\bpurchased\s/i, /\bordered\s/i, /\breceived\s/i, /\bwearing\s/i, /\bwore\s/i,
            // Review-specific language
            /\brecommend\s/i, /\bwould buy\s/i, /\bso happy\s/i, /\bdisappointed\s/i, /\bexpected\s/i,
            // Quality assessments
            /\bgreat quality\s/i, /\bpoor quality\s/i, /\bworth it\s/i, /\bnot worth\s/i
        ];
        
        // Must contain at least one user review indicator
        const hasUserIndicator = userReviewIndicators.some(pattern => pattern.test(text));
        
        // Exclude obvious product descriptions/marketing copy
        const marketingIndicators = [
            /^[A-Z][a-z]+ - /i, // "Brand - product name" format
            /\b(classic|iconic|premium|luxury|collection|designed|crafted|features|composition|model is wearing|drop shoulder|crew neck)\b/i,
            /\bmade (in|from|with)\b/i,
            /\b(uk|us|eu) size\b/i,
            /\bwomen's clothing\b/i,
            /\btall women's fashion\b/i,
            /\bfinely knitted\b/i,
            /100% (organic )?cotton/i,
            /100% (soft )?merino wool/i
        ];
        
        const hasMarketingIndicator = marketingIndicators.some(pattern => pattern.test(text));
        
        return hasUserIndicator && !hasMarketingIndicator;
    };
    
    // Define claim-specific patterns that must match the exact section claim
    const getClaimPatterns = (section, claim) => {
        const claimLower = claim.toLowerCase();
        
        if (section === 'fit') {
            if (claimLower.includes('true to size')) {
                return [
                    /true to size/i,
                    /fits (true to|as expected|perfectly)/i,
                    /(ordered|bought|got) my (usual|normal|regular) size/i,
                    /size (s|m|l|xl|\d+) (fits|is) (perfect|great)/i,
                    /no need to size (up|down)/i
                ];
            } else if (claimLower.includes('runs small')) {
                return [
                    /runs small/i,
                    /size up/i,
                    /ordered (a )?size (up|larger)/i,
                    /too (small|tight)/i,
                    /smaller than expected/i
                ];
            } else if (claimLower.includes('runs large')) {
                return [
                    /runs large/i,
                    /size down/i,
                    /ordered (a )?size (down|smaller)/i,
                    /too (big|loose)/i,
                    /larger than expected/i
                ];
            } else if (claimLower.includes('oversized') || claimLower.includes('relaxed')) {
                return [
                    /oversized/i,
                    /relaxed fit/i,
                    /loose/i,
                    /roomy/i,
                    /baggy/i
                ];
            }
        } else if (section === 'quality') {
            if (claimLower.includes('high quality') || claimLower.includes('excellent') || claimLower.includes('premium')) {
                return [
                    /high quality/i,
                    /(excellent|amazing|great|premium|superior) quality/i,
                    /(very )?well made/i,
                    /feels (premium|luxurious|expensive)/i,
                    /worth (the money|every penny)/i,
                    /quality is (amazing|excellent|great)/i
                ];
            } else if (claimLower.includes('good quality') || claimLower.includes('decent')) {
                return [
                    /good quality/i,
                    /decent quality/i,
                    /quality is (good|decent|okay)/i,
                    /well constructed/i
                ];
            } else if (claimLower.includes('poor quality') || claimLower.includes('cheap')) {
                return [
                    /poor quality/i,
                    /cheap (feeling|quality)/i,
                    /not worth/i,
                    /disappointing quality/i,
                    /feels cheap/i
                ];
            } else if (claimLower.includes('soft') || claimLower.includes('comfortable')) {
                return [
                    /(very |so )?soft/i,
                    /(really |very )?comfortable/i,
                    /feels (great|amazing|soft)/i,
                    /comfortable to wear/i
                ];
            }
        } else if (section === 'washCare') {
            if (claimLower.includes('shrink')) {
                return [
                    /shrink/i,
                    /shrunk/i,
                    /got smaller/i,
                    /after wash/i
                ];
            } else if (claimLower.includes('wash') || claimLower.includes('care')) {
                return [
                    /wash(ed|ing)/i,
                    /(after|post) wash/i,
                    /easy to care for/i,
                    /holds up well/i,
                    /maintained/i,
                    /care instructions/i
                ];
            }
        }
        
        return []; // No patterns match - no quotes should be shown
    };
    
    const claimPatterns = getClaimPatterns(section, sectionClaim);
    
    // If no specific patterns for this claim, don't show quotes
    if (claimPatterns.length === 0) {
        return [];
    }
    
    for (const review of reviews.slice(0, 15)) { // Check more reviews for better matching
        // Only use actual review content fields
        const reviewFields = [
            review.fullContent,
            review.reviewText,
            review.content,
            review.text
        ].filter(Boolean);
        
        if (reviewFields.length === 0) continue;
        
        const fullText = reviewFields.join(' ').toLowerCase();
        
        // Look for sentences containing relevant keywords
        const sentences = fullText.split(/[.!?]+/).filter(s => s.trim().length > 15);
        
        for (const sentence of sentences) {
            const trimmedSentence = sentence.trim();
            
            // Check if sentence matches the specific claim patterns
            const matchesClaim = claimPatterns.some(pattern => pattern.test(trimmedSentence));
            
            if (matchesClaim && trimmedSentence.length >= 30 && trimmedSentence.length <= 150) {
                // Check if this sounds like a genuine user review
                if (!isUserReview(trimmedSentence)) {
                    continue;
                }
                
                // Clean up the sentence
                let cleanSentence = trimmedSentence
                    .replace(/^[^a-zA-Z]*/, '') // Remove leading non-letters
                    .replace(/[^a-zA-Z\s'!,.]*$/, '') // Remove trailing non-letters but keep basic punctuation
                    .trim();
                
                if (cleanSentence.length >= 25) {
                    // Capitalize first letter
                    cleanSentence = cleanSentence.charAt(0).toUpperCase() + cleanSentence.slice(1);
                    
                    // Add period if missing
                    if (!/[.!?]$/.test(cleanSentence)) {
                        cleanSentence += '.';
                    }
                    
                    // Calculate relevance based on how many claim patterns it matches
                    const relevanceScore = claimPatterns.filter(pattern => pattern.test(trimmedSentence)).length;
                    
                    console.log('✅ QUOTE EXTRACTED:', {
                        section: section,
                        claim: sectionClaim,
                        extractedQuote: cleanSentence,
                        originalSentence: trimmedSentence.substring(0, 100),
                        reviewSource: review.source,
                        matchedPatterns: claimPatterns.filter(pattern => pattern.test(trimmedSentence)).length
                    });
                    
                    quotes.push({
                        text: cleanSentence,
                        source: review.source || 'Review',
                        relevance: relevanceScore,
                        originalText: trimmedSentence // Keep original for debugging
                    });
                }
            }
        }
    }
    
    // Sort by relevance and remove duplicates
    const uniqueQuotes = quotes
        .filter((quote, index, self) => 
            index === self.findIndex(q => q.text.toLowerCase() === quote.text.toLowerCase())
        )
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, 1); // Max 1 highly relevant quote per section
    
    return uniqueQuotes;
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
        
        // Debug the actual review content to verify quotes are real
        if (data.externalSearchResults?.reviews) {
            console.log('🔍 DEBUGGING: Sample review content:', data.externalSearchResults.reviews.slice(0, 3).map(review => ({
                snippet: review.snippet?.substring(0, 100) + '...',
                fullContent: review.fullContent?.substring(0, 100) + '...',
                title: review.title,
                source: review.source
            })));
        }
        
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
                    const summaryLower = location.value.toLowerCase();
                    
                    // Check if this looks like a brand fit summary vs product description
                    const brandFitIndicators = [
                        'true to size', 'runs small', 'runs large', 'based on', 'reviews', 
                        'customers', 'users say', 'fit analysis', 'sizing', 'recommend',
                        'most reviewers', 'generally', 'tends to', 'typically'
                    ];
                    
                    const productDescIndicators = [
                        'described as', 'features', 'composition', 'model is wearing',
                        'drop shoulder', 'crew neck', 'elbow-length', 'relaxed fit with',
                        'made from', 'crafted', 'designed', 'collection'
                    ];
                    
                    const hasBrandFitIndicators = brandFitIndicators.some(indicator => 
                        summaryLower.includes(indicator));
                    const hasProductDescIndicators = productDescIndicators.some(indicator => 
                        summaryLower.includes(indicator));
                    
                    // Only accept if it has brand fit indicators and doesn't look like product description
                    if (hasBrandFitIndicators && !hasProductDescIndicators) {
                        console.log('✅ DEBUGGING: Found brand fit summary in:', location.name, 'Preview:', location.value.substring(0, 100) + '...');
                        return location.value;
                    } else {
                        console.log('⚠️ DEBUGGING: Rejecting non-brand-fit summary in:', location.name, 'Reason:', hasProductDescIndicators ? 'Product description' : 'No brand fit indicators');
                    }
                }
            }
            
            // Priority 2: Use recommendation field (from Phase 1 fix)
            console.log('🔍 DEBUGGING: Checking recommendation field:', {
                exists: !!data.recommendation,
                includesBasedOn: data.recommendation ? data.recommendation.includes('Based on') : false,
                preview: data.recommendation?.substring(0, 100) + '...' || 'N/A'
            });
            
            if (data.recommendation && data.recommendation.trim().length > 50 && data.recommendation !== 'Analyzing fit information...') {
                const recommendationLower = data.recommendation.toLowerCase();
                
                // Apply same filtering as above
                const brandFitIndicators = [
                    'true to size', 'runs small', 'runs large', 'based on', 'reviews', 
                    'customers', 'users say', 'fit analysis', 'sizing', 'recommend',
                    'most reviewers', 'generally', 'tends to', 'typically'
                ];
                
                const productDescIndicators = [
                    'described as', 'features', 'composition', 'model is wearing',
                    'drop shoulder', 'crew neck', 'elbow-length', 'relaxed fit with',
                    'made from', 'crafted', 'designed', 'collection'
                ];
                
                const hasBrandFitIndicators = brandFitIndicators.some(indicator => 
                    recommendationLower.includes(indicator));
                const hasProductDescIndicators = productDescIndicators.some(indicator => 
                    recommendationLower.includes(indicator));
                
                if (hasBrandFitIndicators && !hasProductDescIndicators) {
                    console.log('✅ DEBUGGING: Using recommendation field as brand fit summary');
                    return data.recommendation;
                } else {
                    console.log('⚠️ DEBUGGING: Rejecting recommendation field - appears to be product description');
                }
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
            
            // Priority 5: Generate basic brand fit summary from structured sections if available
            const searchData = data.externalSearchResults?.brandFitSummary || 
                              data.richSummaryData?.brandFitSummary || 
                              data.brandFitSummary;
            
            if (searchData?.sections && Object.keys(searchData.sections).length > 0) {
                console.log('🔍 DEBUGGING: Trying to generate summary from sections');
                const sectionSummaries = [];
                
                if (searchData.sections.fit?.recommendation) {
                    sectionSummaries.push(searchData.sections.fit.recommendation);
                }
                if (searchData.sections.quality?.recommendation) {
                    sectionSummaries.push(searchData.sections.quality.recommendation);
                }
                
                if (sectionSummaries.length > 0) {
                    const generatedSummary = sectionSummaries.join('. ');
                    console.log('✅ DEBUGGING: Generated summary from sections:', generatedSummary.substring(0, 100) + '...');
                    return generatedSummary;
                }
            }
            
            // Priority 6: Show placeholder for brand analysis if we have reviews but no structured data
            if (totalReviews > 0) {
                console.log('🔍 DEBUGGING: Using placeholder message with review count');
                return `Based on ${totalReviews} reviews - Brand fit analysis available. Detailed insights shown below.`;
            }
            
            // Priority 7: Default loading message
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
            // Debug the data structure we're working with
            console.log('🔍 DEBUGGING: extractStructuredAnalysis data sources:', {
                externalSearchResults: !!data.externalSearchResults,
                hasBrandFitSummary: !!data.externalSearchResults?.brandFitSummary,
                hasRichSummaryData: !!data.richSummaryData,
                hasBrandFitSummary2: !!data.brandFitSummary,
                externalSections: data.externalSearchResults?.brandFitSummary?.sections ? Object.keys(data.externalSearchResults.brandFitSummary.sections) : 'none',
                richSections: data.richSummaryData?.brandFitSummary?.sections ? Object.keys(data.richSummaryData.brandFitSummary.sections) : 'none',
                directSections: data.brandFitSummary?.sections ? Object.keys(data.brandFitSummary.sections) : 'none'
            });
            
            const searchData = data.externalSearchResults?.brandFitSummary || 
                              data.richSummaryData?.brandFitSummary || 
                              data.brandFitSummary;
            
            if (!searchData) {
                console.log('❌ No searchData found for structured analysis');
                return null;
            }
            
            console.log('🔍 DEBUGGING: searchData structure:', {
                hasSections: !!searchData.sections,
                sectionKeys: searchData.sections ? Object.keys(searchData.sections) : 'none',
                hasConfidence: !!searchData.confidence,
                sampleSection: searchData.sections ? searchData.sections[Object.keys(searchData.sections)[0]] : 'none'
            });
            
            // Check if we have any structured sections
            if (!searchData.sections || Object.keys(searchData.sections).length === 0) {
                console.log('❌ No sections found in searchData');
                return null;
            }
            
            // Filter sections to remove obvious product descriptions, but be less aggressive
            const isValidSection = (section) => {
                if (!section?.recommendation) return false;
                
                const text = section.recommendation.toLowerCase();
                
                // Only filter out obvious product marketing copy
                const productDescIndicators = [
                    'the composition is 100%',
                    'crafted from fine knit',
                    'made from 100%',
                    'features a relaxed silhouette',
                    'designed with a relaxed silhouette',
                    'given the delicate nature of',
                    'it is advisable to wash in cold water',
                    'the model is wearing size',
                    'model is 178cm and is wearing'
                ];
                
                // If it contains obvious product marketing language, filter it out
                const hasProductDescIndicators = productDescIndicators.some(indicator => text.includes(indicator));
                
                // Keep section unless it's clearly product marketing copy
                if (hasProductDescIndicators) {
                    console.log('🚫 FILTERING OUT product description:', text.substring(0, 100) + '...');
                    return false;
                }
                
                console.log('✅ KEEPING section (appears to be analysis):', text.substring(0, 100) + '...');
                return true;
            };
            
            const result = {
                fit: isValidSection(searchData.sections?.fit) ? searchData.sections.fit : null,
                quality: isValidSection(searchData.sections?.quality) ? searchData.sections.quality : null,
                fabric: isValidSection(searchData.sections?.fabric) ? searchData.sections.fabric : null,
                washCare: isValidSection(searchData.sections?.washCare) ? searchData.sections.washCare : null,
                qualityMaterials: isValidSection(searchData.sections?.qualityMaterials) ? searchData.sections.qualityMaterials : null,
                confidence: searchData.confidence,
                totalResults: totalReviews
            };
            
            console.log('✅ DEBUGGING: Extracted structured data:', {
                hasFit: !!result.fit,
                hasQuality: !!result.quality,
                hasFabric: !!result.fabric,
                hasWashCare: !!result.washCare,
                hasQualityMaterials: !!result.qualityMaterials,
                confidence: result.confidence,
                filteredOutSections: {
                    fit: searchData.sections?.fit && !result.fit ? 'Filtered out (product description)' : 'OK',
                    quality: searchData.sections?.quality && !result.quality ? 'Filtered out (product description)' : 'OK',
                    washCare: searchData.sections?.washCare && !result.washCare ? 'Filtered out (product description)' : 'OK'
                }
            });
            
            // Debug the actual content of sections to verify they're from reviews
            if (result.fit) {
                console.log('🔍 FIT SECTION CONTENT:', {
                    recommendation: result.fit.recommendation?.substring(0, 100) + '...',
                    confidence: result.fit.confidence,
                    isReviewBased: result.fit.recommendation?.toLowerCase().includes('reviews') || result.fit.recommendation?.toLowerCase().includes('customers')
                });
            }
            if (result.quality) {
                console.log('🔍 QUALITY SECTION CONTENT:', {
                    recommendation: result.quality.recommendation?.substring(0, 100) + '...',
                    confidence: result.quality.confidence,
                    isReviewBased: result.quality.recommendation?.toLowerCase().includes('reviews') || result.quality.recommendation?.toLowerCase().includes('customers')
                });
            }
            if (result.washCare) {
                console.log('🔍 WASH CARE SECTION CONTENT:', {
                    recommendation: result.washCare.recommendation?.substring(0, 100) + '...',
                    confidence: result.washCare.confidence,
                    isReviewBased: result.washCare.recommendation?.toLowerCase().includes('reviews') || result.washCare.recommendation?.toLowerCase().includes('customers')
                });
            }
            
            return result;
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
            const fitQuotes = extractRelevantQuotes(data, 'fit', structuredData.fit.recommendation);
            let fitQuotesHTML = '';
            if (fitQuotes.length > 0) {
                fitQuotesHTML = fitQuotes.map(quote => 
                    `<li class="pointfour-quote">"${quote.text}"</li>`
                ).join('');
            }
            
            content += `
                <div class="pointfour-fit-info">
                    <h4>Fit Analysis:</h4>
                    <ul class="pointfour-bullet-list">
                        <li>${structuredData.fit.recommendation}</li>
                        ${fitQuotesHTML}
                        ${structuredData.fit.confidence ? `<li class="pointfour-source">Confidence: ${structuredData.fit.confidence.toUpperCase()}</li>` : ''}
                    </ul>
                </div>
            `;
        } else if (recommendation !== 'Analyzing fit information...' && totalReviews > 0) {
            // Fallback: try to extract fit info from the general recommendation
            const fitKeywords = ['runs small', 'runs large', 'true to size', 'size up', 'size down', 'tight', 'loose', 'fits'];
            const hasFitInfo = fitKeywords.some(keyword => recommendation.toLowerCase().includes(keyword));
            
            if (hasFitInfo) {
                const fitQuotes = extractRelevantQuotes(data, 'fit', recommendation);
                let fitQuotesHTML = '';
                if (fitQuotes.length > 0) {
                    fitQuotesHTML = fitQuotes.map(quote => 
                        `<li class="pointfour-quote">"${quote.text}"</li>`
                    ).join('');
                }
                
                content += `
                    <div class="pointfour-fit-info">
                        <h4>Fit Analysis:</h4>
                        <ul class="pointfour-bullet-list">
                            <li>${recommendation}</li>
                            ${fitQuotesHTML}
                        </ul>
                    </div>
                `;
            } else {
                // Show general summary under brand name if no specific fit data
                // Don't show quotes for general summaries unless they're very specific
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
        
        // QUALITY & MATERIALS SECTION - Show combined quality and materials info
        if (structuredData?.qualityMaterials) {
            const sectionHeader = isBagBrand ? 'Quality & Construction:' : 'Quality & Materials:';
            const qualityQuotes = extractRelevantQuotes(data, 'quality', structuredData.qualityMaterials.recommendation);
            let qualityQuotesHTML = '';
            if (qualityQuotes.length > 0) {
                qualityQuotesHTML = qualityQuotes.map(quote => 
                    `<li class="pointfour-quote">"${quote.text}"</li>`
                ).join('');
            }
            
            // Split the recommendation by lines to handle "Materials: X\n\nQuality: Y" format
            const lines = structuredData.qualityMaterials.recommendation.split('\n').filter(line => line.trim());
            
            content += `
                <div class="pointfour-quality-info">
                    <h4>${sectionHeader}</h4>
                    <ul class="pointfour-bullet-list">
                        ${lines.map(line => `<li>${line.trim()}</li>`).join('')}
                        ${qualityQuotesHTML}
                        ${structuredData.qualityMaterials.confidence ? `<li class="pointfour-source">Confidence: ${structuredData.qualityMaterials.confidence.toUpperCase()}</li>` : ''}
                    </ul>
                </div>
            `;
        } else {
            // Fallback: show individual sections if combined section not available
            const qualityInsights = structuredData ? extractQualityInsights({ brandFitSummary: { sections: structuredData } }) : null;
            if (qualityInsights) {
                const sectionHeader = isBagBrand ? 'Quality & Construction:' : 'Quality & Materials:';
                const qualityQuotes = extractRelevantQuotes(data, 'quality', qualityInsights.recommendation);
                let qualityQuotesHTML = '';
                if (qualityQuotes.length > 0) {
                    qualityQuotesHTML = qualityQuotes.map(quote => 
                        `<li class="pointfour-quote">"${quote.text}"</li>`
                    ).join('');
                }
                
                content += `
                    <div class="pointfour-quality-info">
                        <h4>${sectionHeader}</h4>
                        <ul class="pointfour-bullet-list">
                            <li>${qualityInsights.recommendation}</li>
                            ${qualityQuotesHTML}
                            ${qualityInsights.confidence ? `<li class="pointfour-source">Confidence: ${qualityInsights.confidence.toUpperCase()}</li>` : ''}
                        </ul>
                    </div>
                `;
            } else if (structuredData?.quality) {
                const sectionHeader = isBagBrand ? 'Quality & Construction:' : 'Quality & Materials:';
                const qualityQuotes = extractRelevantQuotes(data, 'quality', structuredData.quality.recommendation);
                let qualityQuotesHTML = '';
                if (qualityQuotes.length > 0) {
                    qualityQuotesHTML = qualityQuotes.map(quote => 
                        `<li class="pointfour-quote">"${quote.text}"</li>`
                    ).join('');
                }
                
                content += `
                    <div class="pointfour-quality-info">
                        <h4>${sectionHeader}</h4>
                        <ul class="pointfour-bullet-list">
                            <li>${structuredData.quality.recommendation}</li>
                            ${qualityQuotesHTML}
                            ${structuredData.quality.confidence ? `<li class="pointfour-source">Confidence: ${structuredData.quality.confidence.toUpperCase()}</li>` : ''}
                        </ul>
                    </div>
                `;
            }
        }
        
        // WASH/CARE SECTION - Show if we have wash/care data
        if (structuredData?.washCare && structuredData.washCare.recommendation) {
            const careQuotes = extractRelevantQuotes(data, 'washCare', structuredData.washCare.recommendation);
            let careQuotesHTML = '';
            if (careQuotes.length > 0) {
                careQuotesHTML = careQuotes.map(quote => 
                    `<li class="pointfour-quote">"${quote.text}"</li>`
                ).join('');
            }
            
            content += `
                <div class="pointfour-washcare-info">
                    <h4>Wash & Care:</h4>
                    <ul class="pointfour-bullet-list">
                        <li>${structuredData.washCare.recommendation}</li>
                        ${careQuotesHTML}
                        ${structuredData.washCare.confidence ? `<li class="pointfour-source">Confidence: ${structuredData.washCare.confidence.toUpperCase()}</li>` : ''}
                    </ul>
                </div>
            `;
        }
        
        // REMOVED: Redundant FABRIC/MATERIALS SECTION since we already have QUALITY & MATERIALS combined section above
        
        // REMOVED: Redundant MATERIALS SECTION since we already have QUALITY & MATERIALS combined section above
        
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
            // Get URL extraction data and materials for enhanced reviews page
            const urlExtraction = window.pointFourURLExtraction || null;
            
            // Check multiple sources for materials data  
            let materials = structuredData?.materials || 
                           data.externalSearchResults?.brandFitSummary?.sections?.materials ||
                           data.externalSearchResults?.sections?.materials;
            
            // Fallback: extract from brandFitSummary summary text if no structured materials
            if (!materials && data.externalSearchResults?.brandFitSummary?.summary) {
                const summary = data.externalSearchResults.brandFitSummary.summary;
                const materialMatches = summary.match(/(\d+%\s+\w+)/g);
                if (materialMatches) {
                    materials = {
                        composition: materialMatches,
                        confidence: 'medium'
                    };
                    console.log('🔗 [PointFour] Extracted materials from summary:', materialMatches);
                }
            }
            
            // Additional fallback: look for materials in the review snippets, but only for specific item
            if (!materials && data.externalSearchResults?.reviews && urlExtraction?.itemName) {
                const itemName = urlExtraction.itemName.toLowerCase();
                
                // Filter reviews that mention this specific item
                const itemSpecificReviews = data.externalSearchResults.reviews.filter(review => {
                    const reviewText = (review.snippet + ' ' + review.fullContent + ' ' + review.title).toLowerCase();
                    return reviewText.includes(itemName) || 
                           itemName.split(' ').some(word => word.length > 3 && reviewText.includes(word));
                });
                
                if (itemSpecificReviews.length > 0) {
                    const itemText = itemSpecificReviews
                        .map(review => review.snippet + ' ' + review.fullContent + ' ' + review.title)
                        .join(' ');
                    
                    const materialPatterns = [
                        /(\d+%\s+(?:merino\s+)?wool)/gi,
                        /(\d+%\s+(?:organic\s+)?cotton)/gi,
                        /(\d+%\s+silk)/gi,
                        /(\d+%\s+linen)/gi,
                        /(\d+%\s+cashmere)/gi,
                        /(\d+%\s+polyester)/gi,
                        /(\d+%\s+viscose)/gi,
                        /(\d+%\s+lyocell)/gi,
                        /(100%\s+\w+)/gi
                    ];
                    
                    const foundMaterials = [];
                    for (const pattern of materialPatterns) {
                        const matches = itemText.match(pattern);
                        if (matches) {
                            foundMaterials.push(...matches);
                        }
                    }
                    
                    if (foundMaterials.length > 0) {
                        materials = {
                            composition: [...new Set(foundMaterials)], // Remove duplicates
                            confidence: 'high' // Higher confidence since it's item-specific
                        };
                        console.log('🔗 [PointFour] Extracted materials from item-specific reviews:', foundMaterials);
                    }
                }
            }
            
            console.log('🔗 [PointFour] Materials data sources:', {
                structuredData: structuredData?.materials,
                sections: data.externalSearchResults?.brandFitSummary?.sections?.materials,
                altSections: data.externalSearchResults?.sections?.materials,
                finalMaterials: materials,
                fullAPIResponse: data.externalSearchResults ? {
                    hasBrandFitSummary: !!data.externalSearchResults.brandFitSummary,
                    hasSections: !!data.externalSearchResults.brandFitSummary?.sections,
                    sectionKeys: data.externalSearchResults.brandFitSummary?.sections ? Object.keys(data.externalSearchResults.brandFitSummary.sections) : [],
                    hasReviews: !!data.externalSearchResults.reviews,
                    reviewCount: data.externalSearchResults.reviews?.length || 0,
                    summaryPreview: data.externalSearchResults.brandFitSummary?.summary?.substring(0, 100) + '...'
                } : null
            });
            
            // Create enhanced search query for the analyze page
            const params = new URLSearchParams({
                brand: brandName
            });
            
            // Add item name if available from URL extraction
            if (urlExtraction && urlExtraction.itemName) {
                params.set('item', urlExtraction.itemName);
                console.log('🔗 [PointFour] Added item to URL:', urlExtraction.itemName);
            } else {
                console.log('🔗 [PointFour] No URL extraction data for item');
            }
            
            // Add materials if detected
            if (materials && materials.composition && materials.composition.length > 0) {
                params.set('materials', materials.composition.join(', '));
                console.log('🔗 [PointFour] Added materials to URL:', materials.composition.join(', '));
            } else {
                console.log('🔗 [PointFour] No materials data found. Checked:', {
                    structuredData: !!structuredData,
                    materials: !!structuredData?.materials,
                    externalSearchResults: !!data.externalSearchResults,
                    sections: !!data.externalSearchResults?.brandFitSummary?.sections,
                    materialsSection: !!data.externalSearchResults?.brandFitSummary?.sections?.materials
                });
            }
            
            const analyzeUrl = `https://www.pointfour.in/extension-reviews?${params.toString()}`;
            console.log('🔗 [PointFour] Reviews page URL:', analyzeUrl);
            
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
        // Get URL extraction data if available
        const urlExtraction = window.pointFourURLExtraction || null;
        
        const messageData = {
            type: 'GET_BRAND_DATA',
            brandName: brand,
            url: window.location.href,
            title: document.title,
            urlExtraction: urlExtraction
        };
        
        console.log('[PointFour] Sending message to background script:', messageData);
        
        const response = await chrome.runtime.sendMessage(messageData);
        
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