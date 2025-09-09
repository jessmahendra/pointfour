// ========================================
// POINTFOUR BROWSER EXTENSION - BUNDLED VERSION
// Version: 4.0 (Modular Architecture - Bundled for Browser Compatibility)
// ========================================


// ========================================
// MODULE: CONFIG
// ========================================

// ========================================
// POINTFOUR - CONFIGURATION MODULE
// ========================================

const ALLOWED_API_ENDPOINTS = [
  'http://localhost:3000',
  'http://localhost:3002', 
  'https://pointfour.in',
  'https://www.pointfour.in',
  'https://api.pointfour.in'
];

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
// MODULE: API-SECURITY
// ========================================

// ========================================
// POINTFOUR - API SECURITY MODULE
// ========================================

// Initialize API security by overriding fetch and XMLHttpRequest
function initializeAPISecurity() {
  // Override fetch to block unauthorized API calls
  const originalFetch = window.fetch;
  window.fetch = function(url, options) {
    const urlString = typeof url === 'string' ? url : url.toString();
    
    // Check if this is a Scarab API call and block it
    if (urlString.includes('scarabresearch.com')) {
      console.warn('🚫 [PointFour] Blocked Scarab API call:', urlString);
      return Promise.reject(new Error('Scarab API calls are not allowed. Use PointFour API endpoints only.'));
    }
    
    // Check if this is an allowed endpoint
    const isAllowed = ALLOWED_API_ENDPOINTS.some(endpoint => urlString.startsWith(endpoint));
    if (!isAllowed && urlString.startsWith('http')) {
      console.warn('🚫 [PointFour] Blocked unauthorized API call:', urlString);
      return Promise.reject(new Error('Unauthorized API endpoint. Use PointFour API endpoints only.'));
    }
    
    return originalFetch.apply(this, arguments);
  };

  // Override XMLHttpRequest to block unauthorized API calls
  const originalXHROpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, ...args) {
    const urlString = url.toString();
    
    // Check if this is a Scarab API call and block it
    if (urlString.includes('scarabresearch.com')) {
      console.warn('🚫 [PointFour] Blocked Scarab XMLHttpRequest:', urlString);
      this.abort();
      return;
    }
    
    // Check if this is an allowed endpoint
    const isAllowed = ALLOWED_API_ENDPOINTS.some(endpoint => urlString.startsWith(endpoint));
    if (!isAllowed && urlString.startsWith('http')) {
      console.warn('🚫 [PointFour] Blocked unauthorized XMLHttpRequest:', urlString);
      this.abort();
      return;
    }
    
    return originalXHROpen.apply(this, [method, url, ...args]);
  };
}




// ========================================
// MODULE: STATE
// ========================================

// ========================================
// POINTFOUR - STATE MANAGEMENT MODULE
// ========================================

// Global state management for the content script
const state = {
  widgetInjected: false,
  widgetContainer: null,
  currentBrand: null,
  initTimeout: null,
  isProcessing: false,
  detectionScore: 0,
  analysisTimeoutId: null,
  
  // Loading state tracking
  currentLoadingPhase: 'initial',
  hasShownFinalData: false,
  loadingStartTime: Date.now(),
  lastDataQuality: 0, // Track the quality of data received
  dataUpdateCount: 0  // Count how many times we've received data
};

// State getters and setters
function getState(key) {
  return state[key];
}

function setState(key, value) {
  state[key] = value;
}

function updateState(updates) {
  Object.assign(state, updates);
}

function resetState() {
  Object.assign(state, {
    widgetInjected: false,
    widgetContainer: null,
    currentBrand: null,
    initTimeout: null,
    isProcessing: false,
    detectionScore: 0,
    analysisTimeoutId: null,
    currentLoadingPhase: 'initial',
    hasShownFinalData: false,
    loadingStartTime: Date.now(),
    lastDataQuality: 0,
    dataUpdateCount: 0
  });
}




// ========================================
// MODULE: SITE-DETECTION
// ========================================

// ========================================
// POINTFOUR - SITE DETECTION MODULE
// ========================================

// ========================================
// FASHION SITE DETECTION
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
    
    setState('detectionScore', score);
    return {
        isFashionSite: score >= CONFIG.DETECTION_THRESHOLDS.MIN_SCORE,
        isHighConfidence: score >= CONFIG.DETECTION_THRESHOLDS.HIGH_CONFIDENCE,
        score: score,
        signals: signals,
        productElementsCount: productElementsCount,
        hasPriceElements: hasPriceElements
    };
}

// ========================================
// PAGE TYPE DETECTION
// ========================================

function detectPageType() {
    console.log('[PointFour] Detecting page type: Product vs Listing...');
    
    const url = window.location.href.toLowerCase();
    const path = window.location.pathname.toLowerCase();
    
    // Strong indicators for individual product pages
    const productPageIndicators = {
        url: [
            /\/product\/[^\/]+$/,           // /product/item-name
            /\/item\/[^\/]+$/,              // /item/item-name  
            /\/p\/[^\/]+$/,                 // /p/item-name
            /\/dp\/[^\/]+$/,                // /dp/item-name (Amazon style)
            /\/[^\/]+-p-\d+/,               // item-name-p-12345
            /\/products\/[^\/]+$/,          // /products/item-name (singular in path)
            /\/.+-\d+\.html$/               // item-name-12345.html
        ],
        dom: [
            // Single product specific elements
            'button[data-add-to-cart]',
            'button[data-add-to-bag]', 
            'select[name="size"]',
            'select[name="color"]',
            '.size-selector',
            '.color-selector',
            '.product-options',
            '.add-to-cart',
            '.add-to-bag',
            '.add-to-wishlist',
            '.quantity-selector',
            '.product-gallery',
            '.product-thumbnails',
            '.zoom-image',
            '[data-product-id]:not([data-product-list])',
            '.breadcrumb:has(a[href*="product"])'
        ],
        content: [
            'add to cart',
            'add to bag', 
            'add to basket',
            'select size',
            'choose color',
            'size guide',
            'product details',
            'care instructions',
            'composition:',
            'material:',
            'model wears',
            'model is wearing'
        ]
    };
    
    // Strong indicators for listing/category pages
    const listingPageIndicators = {
        url: [
            /\/products\/?$/,               // /products (plural, no item)
            /\/category\//,                 // /category/...
            /\/collection\//,               // /collection/...
            /\/shop\//,                     // /shop/...
            /\/browse\//,                   // /browse/...
            /\/search/,                     // /search...
            /\/filter/,                     // /filter...
            /\/sale\/?$/,                   // /sale
            /\/new\/?$/,                    // /new
            /\/bestsellers\/?$/             // /bestsellers
        ],
        dom: [
            '.product-grid',
            '.product-list',
            '.products-grid', 
            '.products-list',
            '[data-product-list]',
            '.category-products',
            '.search-results',
            '.filter-sidebar',
            '.sort-dropdown',
            '.pagination',
            '.load-more',
            '.product-card:nth-child(3)', // Multiple product cards
            '.grid-item:nth-child(4)'     // Grid of items
        ],
        content: [
            'showing \\d+ of \\d+ products',
            'sort by',
            'filter by',
            'load more',
            'view all',
            'products found',
            'results for'
        ]
    };
    
    let productScore = 0;
    let listingScore = 0;
    const signals = [];
    
    // Check URL patterns
    for (const pattern of productPageIndicators.url) {
        if (pattern.test(url) || pattern.test(path)) {
            productScore += 3;
            signals.push(`Product URL pattern: ${pattern}`);
        }
    }
    
    for (const pattern of listingPageIndicators.url) {
        if (pattern.test(url) || pattern.test(path)) {
            listingScore += 3;
            signals.push(`Listing URL pattern: ${pattern}`);
        }
    }
    
    // Check DOM elements
    for (const selector of productPageIndicators.dom) {
        if (document.querySelector(selector)) {
            productScore += 2;
            signals.push(`Product DOM element: ${selector}`);
        }
    }
    
    for (const selector of listingPageIndicators.dom) {
        if (document.querySelector(selector)) {
            listingScore += 2;
            signals.push(`Listing DOM element: ${selector}`);
        }
    }
    
    // Check content patterns
    const pageText = document.body?.innerText?.toLowerCase() || '';
    
    for (const pattern of productPageIndicators.content) {
        if (pageText.includes(pattern.toLowerCase())) {
            productScore += 1;
            signals.push(`Product content: ${pattern}`);
        }
    }
    
    for (const pattern of listingPageIndicators.content) {
        const regex = new RegExp(pattern, 'i');
        if (regex.test(pageText)) {
            listingScore += 1;
            signals.push(`Listing content: ${pattern}`);
        }
    }
    
    // Additional product page bonus checks
    const hasUniqueProductData = !!(
        document.querySelector('[data-product-id]') ||
        document.querySelector('[data-sku]') ||
        document.querySelector('.product-sku') ||
        document.querySelector('.item-number')
    );
    
    if (hasUniqueProductData) {
        productScore += 2;
        signals.push('Has unique product identifiers');
    }
    
    // Check for multiple product links (strong listing indicator)
    const productLinks = document.querySelectorAll('a[href*="/product/"], a[href*="/item/"], a[href*="/p/"]');
    if (productLinks.length > 3) {
        listingScore += 3;
        signals.push(`Multiple product links found: ${productLinks.length}`);
    }
    
    console.log('[PointFour] Page type detection scores:', { productScore, listingScore, signals });
    
    return {
        isProductPage: productScore > listingScore && productScore >= 3,
        isListingPage: listingScore > productScore && listingScore >= 3,
        productScore,
        listingScore,
        signals,
        confidence: Math.max(productScore, listingScore) >= 5 ? 'high' : 'medium'
    };
}

// ========================================
// SHOULD RUN CHECK
// ========================================

function shouldRunOnThisPage() {
    const url = window.location.href.toLowerCase();
    const hostname = window.location.hostname.toLowerCase();
    
    // Skip common non-fashion domains
    const skipDomains = [
        'google.com', 'youtube.com', 'facebook.com', 'twitter.com', 'instagram.com',
        'amazon.com', 'ebay.com', // E-commerce but too generic
        'github.com', 'stackoverflow.com', 'reddit.com', 'wikipedia.org',
        'news.ycombinator.com', 'medium.com', 'linkedin.com',
        'paypal.com', 'stripe.com', 'checkout.com',
        'localhost:3000', 'localhost:3001', 'localhost:8080' // Development
    ];
    
    if (skipDomains.some(domain => hostname.includes(domain))) {
        console.log('[PointFour] Skipping known non-fashion domain:', hostname);
        return false;
    }
    
    // Skip certain URL patterns that are unlikely to be fashion
    const skipPatterns = [
        '/admin', '/login', '/register', '/checkout', '/cart', '/account',
        '/api/', '/docs/', '/help/', '/support/', '/legal/', '/terms/',
        '/privacy/', '/contact/', '/about/', '/blog/', '/news/'
    ];
    
    if (skipPatterns.some(pattern => url.includes(pattern))) {
        console.log('[PointFour] Skipping URL with non-fashion pattern:', url);
        return false;
    }
    
    // Skip if page is clearly not loaded yet
    if (!document.body || document.body.children.length < 2) {
        console.log('[PointFour] Page not fully loaded, skipping...');
        return false;
    }
    
    return true;
}




// ========================================
// MODULE: BRAND-DETECTION
// ========================================

// ========================================
// POINTFOUR - BRAND DETECTION MODULE
// ========================================

// ========================================
// MAIN BRAND EXTRACTION
// ========================================

function extractBrandFromContent() {
    console.log('[PointFour] Starting dynamic content-based brand extraction...');
    
    // Method 1: JSON-LD Structured Data
    let brand = extractBrandFromJSONLD();
    if (brand) {
        brand = cleanBrandName(brand);
        console.log('[PointFour] Brand found in JSON-LD:', brand);
        return brand;
    }
    
    // Method 2: Meta Tags (prioritize over breadcrumbs for brand sites)
    const metaBrand = extractBrandFromMetaTags();
    if (metaBrand) {
        const cleanedMetaBrand = cleanBrandName(metaBrand);
        console.log('[PointFour] Brand found in meta tags:', cleanedMetaBrand);
        return cleanedMetaBrand;
    }
    
    // Method 3: Breadcrumb Analysis (after meta tags to avoid collection names)
    const breadcrumbBrand = extractBrandFromBreadcrumbs();
    if (breadcrumbBrand) {
        const cleanedBrand = cleanBrandName(breadcrumbBrand);
        console.log('[PointFour] Brand found in breadcrumbs:', cleanedBrand);
        return cleanedBrand;
    }
    
    // Method 4: Product Heading Analysis
    const headingBrand = extractBrandFromHeadings();
    if (headingBrand) {
        const cleanedBrand = cleanBrandName(headingBrand);
        console.log('[PointFour] Brand found in headings:', cleanedBrand);
        return cleanedBrand;
    }
    
    console.log('[PointFour] No brand found via content analysis');
    return null;
}

// ========================================
// BRAND EXTRACTION METHODS
// ========================================

function extractBrandFromJSONLD() {
    const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
    
    for (const script of jsonLdScripts) {
        try {
            const data = JSON.parse(script.textContent);
            const items = Array.isArray(data) ? data : [data];
            
            for (const item of items) {
                // Check for Product schema
                if (item['@type'] === 'Product' || (Array.isArray(item['@type']) && item['@type'].includes('Product'))) {
                    if (item.brand) {
                        const brandName = typeof item.brand === 'string' ? item.brand : 
                                        item.brand.name || item.brand['@name'] || 
                                        (typeof item.brand === 'object' ? Object.values(item.brand)[0] : null);
                        if (brandName && typeof brandName === 'string' && brandName.length > 1) {
                            return brandName.trim();
                        }
                    }
                }
                
                // Check for BreadcrumbList with brand info
                if (item['@type'] === 'BreadcrumbList' && item.itemListElement) {
                    for (const breadcrumb of item.itemListElement) {
                        if (breadcrumb.item && breadcrumb.item.name) {
                            const name = breadcrumb.item.name.toLowerCase();
                            // Skip common navigation terms
                            if (!['home', 'women', 'men', 'clothing', 'shoes', 'bags', 'accessories', 'créateurs', 'creators', 'designers'].includes(name)) {
                                const position = breadcrumb.position;
                                // Brand is usually in position 2 or 3 (after Home > Gender/Category)
                                if (position === 2 || position === 3) {
                                    return breadcrumb.item.name.trim();
                                }
                            }
                        }
                    }
                }
            }
        } catch (e) {
            console.log('[PointFour] Failed to parse JSON-LD:', e);
        }
    }
    
    return null;
}

function extractBrandFromBreadcrumbs() {
    const breadcrumbSelectors = [
        'nav[aria-label*="breadcrumb"] a, nav[aria-label*="Breadcrumb"] a',
        '.breadcrumb a, .breadcrumbs a',
        '[data-testid*="breadcrumb"] a',
        'ol.breadcrumb a, ul.breadcrumb a',
        '.navigation-breadcrumbs a',
        '[class*="breadcrumb"] a'
    ];
    
    for (const selector of breadcrumbSelectors) {
        const links = document.querySelectorAll(selector);
        if (links.length > 1) { // Need at least Home + one more level
            for (let i = 1; i < Math.min(links.length - 1, 4); i++) { // Check positions 1-3, skip last (current item)
                const text = links[i].textContent.trim();
                if (text && text.length > 1 && text.length < 30) {
                    const lowerText = text.toLowerCase();
                    // Skip common category terms and section headers
                    if (!['home', 'women', 'men', 'woman', 'man', 'clothing', 'shoes', 'bags', 'accessories', 
                         'dresses', 'tops', 'bottoms', 'new', 'sale', 'shop', 'créateurs', 'creators', 'designers', 'brands',
                         'bestsellers', 'best sellers', 'featured', 'popular', 'trending', 'latest', 'collection', 'products',
                         'summer', 'winter', 'spring', 'fall', 'autumn'].includes(lowerText)) {
                        
                        // Clean up section terms from brand names
                        let cleanedText = text;
                        const sectionTerms = ['bestsellers', 'best sellers', 'new arrivals', 'featured', 'popular', 'trending', 'collection', 'sale'];
                        for (const term of sectionTerms) {
                            const regex = new RegExp(`\\s+${term}$`, 'i');
                            cleanedText = cleanedText.replace(regex, '').trim();
                        }
                        
                        return cleanedText.length >= 2 ? cleanedText : text;
                    }
                }
            }
        }
    }
    
    return null;
}

function extractBrandFromHeadings() {
    // Look for product headings that often contain brand names
    const headingSelectors = ['h1', 'h2', '.product-title', '.product-name', '[data-testid*="product-title"]'];
    
    for (const selector of headingSelectors) {
        const headings = document.querySelectorAll(selector);
        for (const heading of headings) {
            const text = heading.textContent.trim();
            
            // Skip category/navigation terms and section headers
            const lowerText = text.toLowerCase();
            if (['créateurs', 'creators', 'designers', 'brands', 'new arrivals', 'sale', 'bestsellers', 'best sellers', 
                 'featured', 'popular', 'trending', 'new', 'latest', 'collection', 'products', 'summer', 'winter', 'spring', 'fall', 'autumn'].includes(lowerText)) {
                continue;
            }
            
            // Clean up brand names that contain section terms
            let cleanedText = text;
            const sectionTerms = ['bestsellers', 'best sellers', 'new arrivals', 'featured', 'popular', 'trending', 'collection', 'sale'];
            for (const term of sectionTerms) {
                const regex = new RegExp(`\\s+${term}$`, 'i'); // Remove section term at end
                cleanedText = cleanedText.replace(regex, '').trim();
            }
            
            // Use cleaned text for all brand detection
            const textToAnalyze = cleanedText.length > 0 ? cleanedText : text;
            
            // Priority: All-caps standalone words that look like brand names (like "TOTEME")
            if (textToAnalyze.length >= 2 && textToAnalyze.length <= 25 && textToAnalyze === textToAnalyze.toUpperCase() && /^[A-Z][A-Z\s&]+$/.test(textToAnalyze)) {
                // Exclude common all-caps words that aren't brands
                if (!['NEW', 'SALE', 'SHOP', 'SIZE', 'COLOR', 'PRICE', 'BESTSELLERS', 'FEATURED'].includes(textToAnalyze)) {
                    return textToAnalyze;
                }
            }
            
            // Common patterns: "BRAND Product Name" or "Product Name by BRAND"
            const byMatch = textToAnalyze.match(/\bby\s+([A-Z][a-zA-Z\s&]+?)(?:\s|$)/i);
            if (byMatch) {
                return byMatch[1].trim();
            }
            
            // Pattern: "BRAND - Product" or "BRAND | Product"
            const separatorMatch = textToAnalyze.match(/^([A-Z][a-zA-Z\s&]+?)\s*[-|]\s*.+/);
            if (separatorMatch) {
                const potentialBrand = separatorMatch[1].trim();
                if (potentialBrand.length < 25) { // Reasonable brand name length
                    return potentialBrand;
                }
            }
            
            // Pattern: Multi-word brand detection (prioritize full brand names)
            const words = textToAnalyze.split(/\s+/);
            if (words.length > 1) {
                // Look for multi-word brand patterns first (like "Golden Goose", "Saint Laurent")
                for (let i = 2; i <= Math.min(words.length, 4); i++) { // Try 2-4 word combinations
                    const multiWordBrand = words.slice(0, i).join(' ');
                    if (isValidBrandName(multiWordBrand)) {
                        return multiWordBrand;
                    }
                }
                
                // Fallback: Single word if it looks like a complete brand
                const firstWord = words[0];
                if (firstWord.length >= 3 && firstWord.length <= 20 && // Increased minimum length to avoid incomplete brands
                    (firstWord === firstWord.toUpperCase() || /^[A-Z][a-z]+$/.test(firstWord)) &&
                    !isLikelyIncomplete(firstWord, words)) {
                    return firstWord;
                }
            }
            
            // Enhanced pattern recognition for complex brand headings
            const extractedBrand = extractBrandFromComplexPattern(textToAnalyze);
            if (extractedBrand) {
                return extractedBrand;
            }
            
            // If we cleaned the text and it's a reasonable brand name, return it
            if (cleanedText !== text && cleanedText.length >= 2 && cleanedText.length <= 25) {
                return cleanedText;
            }
        }
    }
    
    return null;
}

function extractBrandFromMetaTags() {
    const metaSelectors = [
        'meta[property="og:site_name"]',
        'meta[property="og:title"]',
        'meta[name="application-name"]',
        'meta[name="apple-mobile-web-app-title"]'
    ];
    
    for (const selector of metaSelectors) {
        const metaTag = document.querySelector(selector);
        if (metaTag && metaTag.content) {
            const content = metaTag.content.trim();
            if (content.length >= 2 && content.length <= 25 && isReasonableBrandName(content)) {
                return content;
            }
        }
    }
    
    return null;
}

function extractBrandFromDomain() {
    const domain = window.location.hostname.replace('www.', '');
    const domainParts = domain.split('.');
    let brandFromDomain = domainParts[0];
    
    // Skip common platform domains
    const platformDomains = ['shopify', 'squarespace', 'wix', 'bigcommerce', 'shop', 'store'];
    if (platformDomains.includes(brandFromDomain.toLowerCase())) {
        return null;
    }
    
    // Clean and format brand name from domain
    brandFromDomain = brandFromDomain
        .replace(/([a-z])([A-Z])/g, '$1 $2') // CamelCase to spaces
        .replace(/[_-]/g, ' ') // Replace underscores and dashes
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    
    // Validate domain-based brand name
    if (brandFromDomain.length >= 2 && brandFromDomain.length <= 25) {
        return brandFromDomain;
    }
    
    return null;
}

// ========================================
// BRAND VALIDATION AND CLEANING
// ========================================

function isValidBrandName(brandName) {
    if (!brandName || brandName.length < 4 || brandName.length > 30) return false;
    
    // Must start with capital letter
    if (!/^[A-Z]/.test(brandName)) return false;
    
    // Check for common multi-word brand patterns
    const words = brandName.split(/\s+/);
    if (words.length >= 2) {
        // All words should be capitalized (Title Case or ALL CAPS)
        const allCapitalized = words.every(word => 
            word.length > 0 && 
            (word === word.toUpperCase() || /^[A-Z][a-z]+$/.test(word))
        );
        
        if (!allCapitalized) return false;
        
        // Known good multi-word brand patterns
        const goodPatterns = [
            /^[A-Z][a-z]+\s+[A-Z][a-z]+$/, // "Golden Goose", "Saint Laurent"
            /^[A-Z]+\s+[A-Z]+$/, // "GOLDEN GOOSE", "SAINT LAURENT"  
            /^[A-Z][a-z]+\s+&\s+[A-Z][a-z]+$/, // "Dolce & Gabbana"
            /^[A-Z][a-z]+\s+[A-Z][a-z]+\s+[A-Z][a-z]+$/ // "Ralph Lauren Polo"
        ];
        
        return goodPatterns.some(pattern => pattern.test(brandName));
    }
    
    return true; // Single words handled elsewhere
}

function isLikelyIncomplete(word, allWords) {
    // Check if this word is likely part of a larger brand name
    if (allWords.length < 2) return false;
    
    const secondWord = allWords[1];
    if (!secondWord) return false;
    
    // Common incomplete brand patterns to avoid
    const incompletePrefixes = ['GOLDEN', 'SAINT', 'TOM', 'MARC', 'CALVIN', 'RALPH', 'TOMMY'];
    const commonSecondWords = ['GOOSE', 'LAURENT', 'FORD', 'JACOBS', 'KLEIN', 'LAUREN', 'HILFIGER'];
    
    const upperWord = word.toUpperCase();
    const upperSecond = secondWord.toUpperCase();
    
    // If first word is a common prefix and second word is a common brand suffix
    if (incompletePrefixes.includes(upperWord) && 
        (commonSecondWords.includes(upperSecond) || 
         secondWord.length >= 3 && /^[A-Z][a-z]+$/.test(secondWord))) {
        return true;
    }
    
    // Check for other patterns that suggest incompleteness
    if (word.length <= 4 && secondWord.length >= 4 && 
        word === word.toUpperCase() && 
        (secondWord === secondWord.toUpperCase() || /^[A-Z][a-z]+$/.test(secondWord))) {
        return true;
    }
    
    return false;
}

function cleanBrandName(brandName) {
    if (!brandName || typeof brandName !== 'string') return brandName;
    
    // First, try the complex pattern recognition
    const patternResult = extractBrandFromComplexPattern(brandName);
    if (patternResult && patternResult !== brandName) {
        console.log('[PointFour] Pattern cleaned:', brandName, '→', patternResult);
        return patternResult;
    }
    
    // Fallback: simple suffix removal for common cases
    let cleanedName = brandName;
    const suffixesToRemove = [
        'bestsellers', 'best sellers', 'collection', 'new arrivals', 'featured',
        'popular', 'trending', 'sale', 'products', 'items', 'shop', 'store',
        'summer', 'winter', 'spring', 'fall', 'autumn'
    ];
    
    for (const suffix of suffixesToRemove) {
        const regex = new RegExp(`\\s+${suffix}$`, 'i');
        const beforeCleaning = cleanedName;
        cleanedName = cleanedName.replace(regex, '').trim();
        if (cleanedName !== beforeCleaning) {
            console.log('[PointFour] Suffix cleaned:', beforeCleaning, '→', cleanedName);
            break; // Only remove one suffix
        }
    }
    
    // Return cleaned name if it's reasonable, otherwise original
    return (cleanedName.length >= 2 && cleanedName.length <= 25) ? cleanedName : brandName;
}

function extractBrandFromComplexPattern(text) {
    if (!text || text.length < 4) return null;
    
    // Pattern 1: "Brand Section" → extract "Brand"
    // Examples: "Nike Collection", "Adidas Bestsellers", "Gucci New Arrivals"
    const brandSectionPattern = /^([A-Z][a-zA-Z\s&]+?)\s+(Collection|Bestsellers|Best Sellers|New Arrivals|Featured|Popular|Trending|Sale|Products|Items|Shop|Store)$/i;
    const brandSectionMatch = text.match(brandSectionPattern);
    if (brandSectionMatch) {
        const brandPart = brandSectionMatch[1].trim();
        if (isValidBrandLength(brandPart) && !isCommonWord(brandPart)) {
            return brandPart;
        }
    }
    
    // Pattern 2: "New Brand Collection" → extract "Brand"  
    // Examples: "New Nike Collection", "Featured Adidas Items", "Latest Gucci Products"
    const newBrandPattern = /^(New|Latest|Featured|Popular|Trending|Shop|Discover)\s+([A-Z][a-zA-Z\s&]+?)\s+(Collection|Bestsellers|Best Sellers|New Arrivals|Products|Items|Shop|Store)$/i;
    const newBrandMatch = text.match(newBrandPattern);
    if (newBrandMatch) {
        const brandPart = newBrandMatch[2].trim();
        if (isValidBrandLength(brandPart) && !isCommonWord(brandPart)) {
            return brandPart;
        }
    }
    
    // Pattern 3: "Discover Brand" or "Shop Brand" → extract "Brand"
    // Examples: "Shop Nike", "Discover Adidas", "Browse Gucci"
    const actionBrandPattern = /^(Shop|Discover|Browse|Explore|View|See)\s+([A-Z][a-zA-Z\s&]+?)$/i;
    const actionBrandMatch = text.match(actionBrandPattern);
    if (actionBrandMatch) {
        const brandPart = actionBrandMatch[2].trim();
        if (isValidBrandLength(brandPart) && !isCommonWord(brandPart)) {
            return brandPart;
        }
    }
    
    // Pattern 4: "Brand - Description" → extract "Brand"
    // Examples: "Nike - Athletic Wear", "Gucci - Luxury Fashion"
    const brandDashPattern = /^([A-Z][a-zA-Z\s&]+?)\s*-\s*(.+)$/;
    const brandDashMatch = text.match(brandDashPattern);
    if (brandDashMatch) {
        const brandPart = brandDashMatch[1].trim();
        const descriptionPart = brandDashMatch[2].trim();
        // Only extract if description looks like category/description, not part of brand name
        if (isValidBrandLength(brandPart) && !isCommonWord(brandPart) && 
            (descriptionPart.length > brandPart.length || isDescriptiveText(descriptionPart))) {
            return brandPart;
        }
    }
    
    // Pattern 5: "Brand | Description" → extract "Brand"
    // Examples: "Nike | Athletic Footwear", "Adidas | Sports Apparel"
    const brandPipePattern = /^([A-Z][a-zA-Z\s&]+?)\s*\|\s*(.+)$/;
    const brandPipeMatch = text.match(brandPipePattern);
    if (brandPipeMatch) {
        const brandPart = brandPipeMatch[1].trim();
        const descriptionPart = brandPipeMatch[2].trim();
        if (isValidBrandLength(brandPart) && !isCommonWord(brandPart) && 
            (descriptionPart.length > brandPart.length || isDescriptiveText(descriptionPart))) {
            return brandPart;
        }
    }
    
    // Pattern 6: Position-based extraction for multi-brand scenarios
    // Look for brand names in specific positions within longer text
    const words = text.split(/\s+/);
    if (words.length >= 3) {
        // Check if any 1-3 word combination looks like a brand in the beginning/middle
        for (let start = 0; start < Math.min(words.length - 1, 3); start++) {
            for (let len = 1; len <= Math.min(3, words.length - start); len++) {
                const candidate = words.slice(start, start + len).join(' ');
                if (looksLikeBrandInContext(candidate, text, start)) {
                    return candidate;
                }
            }
        }
    }
    
    return null;
}

// ========================================
// MARKETPLACE DETECTION
// ========================================

function isMarketplaceSite(extractedBrand) {
    console.log('[PointFour] Analyzing if site is marketplace...');
    let marketplaceScore = 0;
    let brandSiteScore = 0;
    
    const hostname = window.location.hostname.replace('www.', '').toLowerCase();
    const pathname = window.location.pathname.toLowerCase();
    
    // Score 1: Meta tag analysis
    const siteName = document.querySelector('meta[property="og:site_name"]')?.content;
    if (siteName && extractedBrand) {
        const siteNameLower = siteName.toLowerCase();
        const brandLower = extractedBrand.toLowerCase();
        
        if (siteNameLower !== brandLower && !siteNameLower.includes(brandLower) && !brandLower.includes(siteNameLower)) {
            marketplaceScore += 3; // Strong marketplace indicator
            console.log('[PointFour] Meta mismatch - Site:', siteName, 'vs Brand:', extractedBrand, '+3 marketplace');
        } else {
            brandSiteScore += 2; // Brand sites usually have consistent naming
            console.log('[PointFour] Meta match - Site:', siteName, 'Brand:', extractedBrand, '+2 brand site');
        }
    }
    
    // Score 2: Domain vs brand analysis
    if (extractedBrand) {
        const domainParts = hostname.split('.');
        const domainName = domainParts[0];
        const brandWords = extractedBrand.toLowerCase().split(' ');
        
        // Check if domain contains brand name
        if (brandWords.some(word => domainName.includes(word.replace(/[^a-z]/g, '')))) {
            brandSiteScore += 3; // Strong brand site indicator
            console.log('[PointFour] Domain contains brand:', domainName, 'Brand:', extractedBrand, '+3 brand site');
        } else if (domainName.length > 6) { // Avoid short domains that might match accidentally
            marketplaceScore += 1;
            console.log('[PointFour] Domain differs from brand:', domainName, 'vs', extractedBrand, '+1 marketplace');
        }
    }
    
    // Score 3: Navigation analysis
    const navSelectors = ['nav', '.navigation', '.navbar', '.menu', 'header'];
    let foundBrandsNavigation = false;
    
    for (const selector of navSelectors) {
        const navElements = document.querySelectorAll(selector);
        for (const nav of navElements) {
            const navText = nav.textContent.toLowerCase();
            if (navText.includes('brands') || navText.includes('designers') || navText.includes('créateurs')) {
                foundBrandsNavigation = true;
                break;
            }
        }
        if (foundBrandsNavigation) break;
    }
    
    if (foundBrandsNavigation) {
        marketplaceScore += 2;
        console.log('[PointFour] Found brands navigation, +2 marketplace');
    }
    
    // Score 4: URL structure analysis
    if (extractedBrand && pathname.length > 1) {
        const pathParts = pathname.split('/').filter(part => part.length > 0);
        const brandWords = extractedBrand.toLowerCase().split(' ');
        
        // Check if brand appears in URL path (marketplace pattern)
        const brandInPath = pathParts.some(part => 
            brandWords.some(word => part.includes(word.replace(/[^a-z]/g, '')))
        );
        
        if (brandInPath && pathParts.length >= 2) {
            marketplaceScore += 2;
            console.log('[PointFour] Brand in URL path (marketplace pattern):', pathname, '+2 marketplace');
        }
    }
    
    // Score 5: Page content analysis
    const headings = document.querySelectorAll('h1, h2, h3, .page-title, .product-title');
    let marketplaceLanguageFound = false;
    
    for (const heading of headings) {
        const text = heading.textContent.toLowerCase();
        if (text.includes('shop ') || text.includes('browse ') || text.includes('discover ') || 
            text.includes('explore ') || text.includes('all brands')) {
            marketplaceLanguageFound = true;
            break;
        }
    }
    
    if (marketplaceLanguageFound) {
        marketplaceScore += 1;
        console.log('[PointFour] Marketplace language found, +1 marketplace');
    }
    
    // Score 6: Breadcrumb analysis
    const breadcrumbs = document.querySelectorAll('.breadcrumb, .breadcrumbs, nav[aria-label*="breadcrumb"]');
    if (breadcrumbs.length > 0 && extractedBrand) {
        for (const breadcrumb of breadcrumbs) {
            const breadcrumbText = breadcrumb.textContent.toLowerCase();
            const brandLower = extractedBrand.toLowerCase();
            
            // If brand appears in breadcrumbs but not as the site name, likely marketplace
            if (breadcrumbText.includes(brandLower) && breadcrumbText.includes('>')) {
                marketplaceScore += 1;
                console.log('[PointFour] Brand in breadcrumbs (category pattern), +1 marketplace');
                break;
            }
        }
    }
    
    // Final decision
    const isMarketplace = marketplaceScore > brandSiteScore;
    console.log('[PointFour] Marketplace detection - Marketplace score:', marketplaceScore, 'Brand site score:', brandSiteScore, 'Result:', isMarketplace ? 'MARKETPLACE' : 'BRAND SITE');
    
    return isMarketplace;
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

function isValidBrandLength(brand) {
    return brand && brand.length >= 2 && brand.length <= 25;
}

function isCommonWord(text) {
    const commonWords = [
        'new', 'latest', 'featured', 'popular', 'trending', 'shop', 'store', 'collection',
        'products', 'items', 'sale', 'bestsellers', 'best', 'sellers', 'discover', 'explore',
        'browse', 'view', 'see', 'men', 'women', 'kids', 'home', 'about', 'contact',
        'summer', 'winter', 'spring', 'fall', 'autumn'
    ];
    return commonWords.includes(text.toLowerCase());
}

function isDescriptiveText(text) {
    // Check if text looks like a category/description rather than part of brand name
    const descriptiveWords = [
        'athletic', 'sports', 'luxury', 'fashion', 'apparel', 'clothing', 'footwear', 'shoes',
        'accessories', 'bags', 'jewelry', 'watches', 'beauty', 'cosmetics', 'skincare',
        'wear', 'collection', 'line', 'series', 'range'
    ];
    return descriptiveWords.some(word => text.toLowerCase().includes(word));
}

function looksLikeBrandInContext(candidate, fullText, position) {
    if (!isValidBrandLength(candidate) || isCommonWord(candidate)) return false;
    
    // Must start with capital letter
    if (!/^[A-Z]/.test(candidate)) return false;
    
    // If it's in the first 3 positions and looks like a proper noun, likely a brand
    if (position <= 2) {
        // Check if it follows brand capitalization patterns
        if (/^[A-Z][a-z]+$/.test(candidate) || // "Nike"
            /^[A-Z]+$/.test(candidate) || // "NIKE"
            /^[A-Z][a-z]+\s+[A-Z][a-z]+$/.test(candidate) || // "Ralph Lauren"
            /^[A-Z]+\s+[A-Z]+$/.test(candidate)) { // "RALPH LAUREN"
            return true;
        }
    }
    
    return false;
}

function isReasonableBrandName(brandName) {
    if (!brandName || brandName.length < 2 || brandName.length > 30) return false;
    
    // Must contain at least one letter
    if (!/[a-zA-Z]/.test(brandName)) return false;
    
    // Reject common section terms even if they passed other filters
    const commonSectionTerms = [
        'bestsellers', 'best sellers', 'featured', 'popular', 'trending', 'new arrivals',
        'collection', 'products', 'items', 'catalog', 'shop', 'store', 'brand', 'brands',
        'sale', 'offers', 'deals', 'discount', 'clearance'
    ];
    
    const lowerBrandName = brandName.toLowerCase();
    if (commonSectionTerms.includes(lowerBrandName)) return false;
    
    return true;
}




// ========================================
// MODULE: PRODUCT-EXTRACTION
// ========================================

// ========================================
// POINTFOUR - PRODUCT EXTRACTION MODULE
// ========================================

// Enhanced size chart extraction function (moved inline to avoid import issues)

// ========================================
// PRODUCT URL EXTRACTION
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
        
        // Generic patterns for common e-commerce platforms
        'shopify.com': {
            pattern: /\/products\/([^\/\?]+)/,
            brandName: null, // Will be detected from page
            itemProcessor: (match) => match[1].replace(/-/g, ' ')
        }
    };
    
    // Check for site-specific patterns
    for (const [domain, config] of Object.entries(sitePatterns)) {
        if (hostname.includes(domain) || hostname === domain) {
            const match = pathname.match(config.pattern);
            if (match) {
                const itemName = config.itemProcessor(match);
                if (itemName) {
                    console.log('🔗 [PointFour] Extracted from URL:', {
                        brand: config.brandName,
                        item: itemName,
                        domain: domain
                    });
                    return {
                        brand: config.brandName,
                        itemName: itemName,
                        source: 'url',
                        confidence: 'high'
                    };
                }
            }
        }
    }
    
    // Generic product URL patterns
    const genericPatterns = [
        /\/products?\/([^\/\?]+)/i,
        /\/item\/([^\/\?]+)/i,
        /\/p\/([^\/\?]+)/i,
        /\/dp\/([^\/\?]+)/i
    ];
    
    for (const pattern of genericPatterns) {
        const match = pathname.match(pattern);
        if (match) {
            const itemName = match[1].replace(/-/g, ' ').trim();
            if (itemName.length > 2) {
                console.log('🔗 [PointFour] Generic URL extraction:', itemName);
                return {
                    brand: null,
                    itemName: itemName,
                    source: 'url',
                    confidence: 'medium'
                };
            }
        }
    }
    
    console.log('🔗 [PointFour] No product found in URL');
    return null;
}

// ========================================
// PRODUCT IMAGE EXTRACTION
// ========================================

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

// ========================================
// ITEM NAME EXTRACTION
// ========================================

function extractItemNameFromPage() {
    // Try to extract item name from various page elements
    const selectors = [
        'h1[class*="product"]',
        'h1[class*="title"]',
        'h1[data-testid*="title"]',
        '.product-title',
        '.product-name',
        '[data-testid*="product-title"]',
        '[data-testid*="product-name"]',
        '[data-testid*="name"]',
        '.pdp-title',
        '.item-title',
        '.product-info h1',
        '.product-details h1',
        'h1' // Fallback to any h1
    ];
    
    for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
            let text = element.textContent?.trim();
            if (text && text.length > 3 && text.length < 200) {
                // Clean up the text
                text = cleanProductName(text);
                if (text.length > 3) {
                    console.log('🎨 Found item name with selector:', selector, 'Text:', text);
                    return text;
                }
            }
        }
    }
    
    // Fallback to page title
    const title = document.title;
    if (title && title.length > 3 && title.length < 200) {
        // Clean up title by removing common e-commerce suffixes
        let cleanTitle = title.replace(/\s*[-|]\s*.+$/g, '').trim();
        cleanTitle = cleanProductName(cleanTitle);
        if (cleanTitle.length > 3) {
            console.log('🎨 Using cleaned page title as item name:', cleanTitle);
            return cleanTitle;
        }
    }
    
    return '';
}

// ========================================
// MATERIALS EXTRACTION
// ========================================

function extractMaterialsFromPage() {
    console.log('[PointFour] Extracting materials from product page...');
    
    const materials = {
        composition: [],
        careInstructions: [],
        sizeGuide: {},
        confidence: 'low'
    };
    
    // Look for material composition in common locations
    const materialSelectors = [
        '.product-details',
        '.product-description', 
        '.product-info',
        '.composition',
        '.materials',
        '.care-instructions',
        '.product-specifications',
        '.spec-table',
        '[data-tab="details"]',
        '[data-tab="care"]',
        '.accordion-content',
        '.expandable-content',
        // Reformation specific selectors
        '.pdp-product-details',
        '.pdp-details',
        '.product-details-accordion',
        '.details-content',
        '.product-info-details',
        // Generic details sections
        '.details',
        '[class*="detail"]',
        '[class*="fabric"]',
        '[class*="material"]',
        '[class*="composition"]',
        // List items that might contain details
        '.product-details ul li',
        '.product-info ul li',
        '.details ul li'
    ];
    
    const materialPatterns = [
        // Flexible patterns for percentage + material (handles complex names)
        /(\d+%\s+[^,\.\n]+?(?:cotton|wool|silk|linen|cashmere|polyester|viscose|lyocell|tencel|modal|spandex|elastane|nylon|rayon|bamboo|hemp)(?:[^,\.\n]*?))/gi,
        
        // Specific patterns for common materials with modifiers
        /(\d+%\s+(?:regeneratively\s+grown\s+|organic\s+|recycled\s+|merino\s+|pima\s+)*cotton[^,\.\n]*)/gi,
        /(\d+%\s+(?:merino\s+|lambswool\s+|virgin\s+)*wool[^,\.\n]*)/gi,
        /(\d+%\s+(?:mulberry\s+)*silk[^,\.\n]*)/gi,
        /(\d+%\s+(?:french\s+|european\s+)*linen[^,\.\n]*)/gi,
        /(\d+%\s+tencel[™\u2122]*\s*lyocell[^,\.\n]*)/gi,
        /(\d+%\s+lyocell[^,\.\n]*)/gi,
        /(\d+%\s+tencel[™\u2122]*[^,\.\n]*)/gi,
        /(\d+%\s+(?:recycled\s+)*polyester[^,\.\n]*)/gi,
        /(\d+%\s+viscose[^,\.\n]*)/gi,
        /(\d+%\s+modal[^,\.\n]*)/gi,
        /(\d+%\s+(?:recycled\s+)*nylon[^,\.\n]*)/gi,
        /(\d+%\s+spandex[^,\.\n]*)/gi,
        /(\d+%\s+elastane[^,\.\n]*)/gi,
        
        // Handle "100% Material" patterns
        /(100%\s+[^,\.\n]+)/gi,
        
        // General composition patterns
        /(?:composition|material|fabric|made\s+(?:of|with|from))[:]*\s*([^\.]+)/gi,
        
        // Handle "X and Y" patterns like "57% Cotton and 43% Lyocell"
        /(\d+%\s+[^,\.\n]+?\s+and\s+\d+%\s+[^,\.\n]+)/gi
    ];
    
    const carePatterns = [
        /machine wash/gi,
        /hand wash/gi,
        /wash cold/gi,
        /wash warm/gi,
        /cold wash/gi,
        /warm wash/gi,
        /dry clean/gi,
        /do not bleach/gi,
        /tumble dry/gi,
        /line dry/gi,
        /air dry/gi,
        /hang dry/gi,
        /iron on low/gi,
        /lay flat to dry/gi,
        /wash separately/gi,
        /gentle cycle/gi,
        /delicate cycle/gi,
        /do not iron/gi,
        /low heat/gi,
        /medium heat/gi,
        /high heat/gi,
        // Handle combined instructions like "Wash cold + line dry"
        /wash\s+cold\s*\+\s*line\s+dry/gi,
        /wash\s+\w+\s*\+\s*\w+\s+dry/gi
    ];
    
    const sizeGuidePatterns = [
        /size\s+(\w+):\s*([\d\-\s]+(?:cm|in|inches)?)/gi,
        /(?:bust|chest|waist|hip|shoulder|length|inseam):\s*([\d\-\s]+(?:cm|in|inches)?)/gi
    ];
    
    for (const selector of materialSelectors) {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
            const text = element.innerText || element.textContent || '';
            
            // Extract materials
            for (const pattern of materialPatterns) {
                const matches = text.match(pattern);
                if (matches) {
                    materials.composition.push(...matches);
                    materials.confidence = 'high';
                }
            }
            
            // Extract care instructions  
            for (const pattern of carePatterns) {
                const matches = text.match(pattern);
                if (matches) {
                    materials.careInstructions.push(...matches);
                }
            }
            
            // Extract size guide info
            for (const pattern of sizeGuidePatterns) {
                const matches = [...text.matchAll(pattern)];
                for (const match of matches) {
                    materials.sizeGuide[match[1] || 'measurement'] = match[2] || match[1];
                }
            }
        }
    }
    
    // Clean up and filter materials
    materials.composition = cleanMaterialsList(materials.composition);
    materials.careInstructions = cleanCareInstructions(materials.careInstructions);
    
    console.log('[PointFour] Extracted materials:', materials);
    
    return materials;
}

function cleanMaterialsList(compositions) {
    // Remove duplicates
    let cleaned = [...new Set(compositions)];
    
    // Filter out overly long or irrelevant matches
    cleaned = cleaned.filter(comp => {
        const trimmed = comp.trim();
        
        // Keep if it starts with percentage
        if (/^\d+%/.test(trimmed)) {
            // Remove if too long (over 100 chars) or contains irrelevant words
            return trimmed.length < 100 && 
                   !trimmed.toLowerCase().includes('vintage jeans') &&
                   !trimmed.toLowerCase().includes('fabric & care') &&
                   !trimmed.toLowerCase().includes('stretch just like');
        }
        
        // Keep general material descriptions if they're concise
        return trimmed.length < 50 && 
               (trimmed.toLowerCase().includes('fabric') || 
                trimmed.toLowerCase().includes('material') || 
                trimmed.toLowerCase().includes('composition'));
    });
    
    // Prioritize specific percentage matches over general ones
    const percentageMatches = cleaned.filter(comp => /^\d+%/.test(comp.trim()));
    const generalMatches = cleaned.filter(comp => !/^\d+%/.test(comp.trim()));
    
    // If we have percentage matches, prefer them
    if (percentageMatches.length > 0) {
        // Sort percentage matches by specificity (shorter = more specific usually)
        return percentageMatches.sort((a, b) => a.length - b.length).slice(0, 5);
    }
    
    return generalMatches.slice(0, 3);
}

function cleanCareInstructions(careInstructions) {
    // Remove duplicates
    let cleaned = [...new Set(careInstructions)];
    
    // Sort by preference (combined instructions first, then specific ones)
    cleaned.sort((a, b) => {
        const aHasPlus = a.includes('+');
        const bHasPlus = b.includes('+');
        
        if (aHasPlus && !bHasPlus) return -1;
        if (!aHasPlus && bHasPlus) return 1;
        return a.length - b.length;
    });
    
    return cleaned.slice(0, 4); // Max 4 care instructions
}

// ========================================
// SIZE GUIDE EXTRACTION
// ========================================

function extractSizeGuideFromPage() {
    console.log('[PointFour] Extracting size guide from product page...');
    
    const sizeGuide = {
        measurements: {},
        sizingAdvice: [],
        modelInfo: {},
        confidence: 'low'
    };
    
    // Look for size guide in common locations - focusing on tables and structured data
    const sizeGuideSelectors = [
        // Direct size guide containers
        '.size-guide',
        '.size-chart', 
        '.sizing-info',
        '.fit-guide',
        '[data-tab="sizing"]',
        '[data-tab="size-guide"]',
        '.modal-size-guide',
        '.sizing-table',
        '.measurement-table',
        
        // Table-based size guides (most common)
        'table',  // We'll analyze all tables and filter by content
        
        // More specific table selectors
        'table[class*="size"]',
        'table[id*="size"]',
        '.size-table table',
        '.sizing-chart table',
        
        // Modal and popup selectors
        '[class*="modal"] table',
        '[class*="popup"] table',
        '[class*="overlay"] table',
        
        // Additional selectors for various sites
        'a[href*="size-guide"]',
        'button[class*="size-guide"]',
        '[class*="size-fit"]',
        '.product-size-guide'
    ];
    
    // Patterns to identify size guide content
    const sizeKeywords = ['xs', 'small', 'medium', 'large', 'xl', 'bust', 'waist', 'hip', 'chest', 'shoulder', 'length'];
    const measurementPatterns = [
        /(\d+(?:\.\d+)?)\s*(?:cm|inch|inches|in|")/gi,
        /size\s+(\w+):\s*([\d\-\s]+)/gi,
        /(\w+):\s*(\d+(?:\.\d+)?)\s*(?:cm|inch|inches|in|")?/gi
    ];
    
    for (const selector of sizeGuideSelectors) {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
            const text = (element.innerText || element.textContent || '').toLowerCase();
            
            // Check if this element contains size-related content
            const containsSizeInfo = sizeKeywords.some(keyword => text.includes(keyword));
            
            if (containsSizeInfo) {
                // If it's a table, extract structured data
                if (element.tagName === 'TABLE') {
                    const tableData = extractTableData(element);
                    if (tableData.measurements && Object.keys(tableData.measurements).length > 0) {
                        Object.assign(sizeGuide.measurements, tableData.measurements);
                        sizeGuide.confidence = 'high';
                    }
                } else {
                    // Extract measurements from text
                    for (const pattern of measurementPatterns) {
                        const matches = [...text.matchAll(pattern)];
                        for (const match of matches) {
                            if (match[1] && match[2]) {
                                sizeGuide.measurements[match[1]] = match[2];
                                sizeGuide.confidence = 'medium';
                            }
                        }
                    }
                }
                
                // Extract sizing advice
                const advicePatterns = [
                    /runs?\s+(small|large|true\s+to\s+size)/gi,
                    /model\s+(?:is\s+)?wearing\s+size\s+(\w+)/gi,
                    /model\s+(?:is\s+)?(\d+(?:'\s*\d+")?\s*tall)/gi,
                    /recommend\s+sizing\s+(up|down)/gi
                ];
                
                for (const pattern of advicePatterns) {
                    const matches = text.match(pattern);
                    if (matches) {
                        sizeGuide.sizingAdvice.push(...matches);
                    }
                }
            }
        }
    }
    
    // Remove duplicates from sizing advice
    sizeGuide.sizingAdvice = [...new Set(sizeGuide.sizingAdvice)];
    
    console.log('[PointFour] Extracted size guide:', sizeGuide);
    
    return sizeGuide;
}

// ========================================
// TABLE DATA EXTRACTION
// ========================================

function extractTableData(table) {
    const data = {
        measurements: {},
        confidence: 'low'
    };
    
    if (!table || table.tagName !== 'TABLE') return data;
    
    try {
        const rows = table.querySelectorAll('tr');
        if (rows.length < 2) return data; // Need at least header + 1 data row
        
        // Try to identify header row and data structure
        const headerRow = rows[0];
        const headers = Array.from(headerRow.querySelectorAll('th, td')).map(cell => 
            cell.textContent.trim().toLowerCase()
        );
        
        // Check if this looks like a size chart
        const sizeIndicators = ['size', 'bust', 'waist', 'hip', 'chest', 'shoulder', 'length', 'xs', 'sm', 'md', 'lg', 'xl'];
        const isSizeChart = headers.some(header => 
            sizeIndicators.some(indicator => header.includes(indicator))
        );
        
        if (isSizeChart) {
            // Extract measurements from data rows
            for (let i = 1; i < Math.min(rows.length, 10); i++) { // Limit to first 10 rows
                const cells = Array.from(rows[i].querySelectorAll('td, th')).map(cell => 
                    cell.textContent.trim()
                );
                
                if (cells.length >= 2) {
                    const sizeOrMeasurement = cells[0];
                    const value = cells[1];
                    
                    if (sizeOrMeasurement && value) {
                        data.measurements[sizeOrMeasurement] = value;
                        data.confidence = 'medium';
                    }
                }
            }
        }
    } catch (error) {
        console.log('[PointFour] Error extracting table data:', error);
    }
    
    return data;
}

// ========================================
// ENHANCED CATEGORY DETECTION
// ========================================

function detectProductCategory() {
    console.log('[PointFour] Detecting product category using multiple methods...');
    
    let bestCategory = { category: 'unknown', confidence: 'low', source: 'none', score: 0 };
    
    // Method 1: URL-based detection (most reliable)
    const urlCategory = detectCategoryFromURL();
    if (urlCategory.confidence !== 'low') {
        bestCategory = urlCategory;
        console.log('[PointFour] URL category detection:', urlCategory);
    }
    
    // Method 2: Breadcrumb-based detection
    const breadcrumbCategory = detectCategoryFromBreadcrumbs();
    if (breadcrumbCategory.confidence !== 'low' && breadcrumbCategory.score > bestCategory.score) {
        bestCategory = breadcrumbCategory;
        console.log('[PointFour] Breadcrumb category detection:', breadcrumbCategory);
    }
    
    // Method 3: Page heading detection
    const headingCategory = detectCategoryFromHeadings();
    if (headingCategory.confidence !== 'low' && headingCategory.score > bestCategory.score) {
        bestCategory = headingCategory;
        console.log('[PointFour] Heading category detection:', headingCategory);
    }
    
    // Method 4: Product title/name detection (fallback)
    const itemName = extractItemNameFromPage();
    if (itemName && bestCategory.confidence === 'low') {
        const itemCategory = detectCategoryFromItemName(itemName);
        if (itemCategory.confidence !== 'low') {
            bestCategory = { ...itemCategory, source: 'item_name' };
            console.log('[PointFour] Item name category detection:', itemCategory);
        }
    }
    
    console.log('[PointFour] Final category detection result:', bestCategory);
    return bestCategory;
}

function detectCategoryFromURL() {
    const url = window.location.href.toLowerCase();
    const pathname = window.location.pathname.toLowerCase();
    
    // URL patterns for different categories
    const categoryPatterns = {
        shoes: {
            patterns: ['/shoes/', '/footwear/', '/sneakers/', '/boots/', '/heels/', '/flats/', '/sandals/', '/pumps/', '/loafers/'],
            score: 20
        },
        bags: {
            patterns: ['/bags/', '/handbags/', '/purses/', '/backpacks/', '/clutches/', '/totes/', '/wallets/'],
            score: 20
        },
        clothing: {
            patterns: ['/clothing/', '/apparel/', '/dresses/', '/tops/', '/bottoms/', '/jackets/', '/coats/', '/shirts/', '/pants/', '/jeans/', '/skirts/'],
            score: 15
        },
        accessories: {
            patterns: ['/accessories/', '/jewelry/', '/watches/', '/scarves/', '/belts/', '/hats/', '/sunglasses/'],
            score: 20
        }
    };
    
    for (const [category, config] of Object.entries(categoryPatterns)) {
        for (const pattern of config.patterns) {
            if (pathname.includes(pattern)) {
                return {
                    category: category,
                    confidence: 'high',
                    source: 'url',
                    score: config.score,
                    matchedPattern: pattern
                };
            }
        }
    }
    
    return { category: 'unknown', confidence: 'low', source: 'url', score: 0 };
}

function detectCategoryFromBreadcrumbs() {
    const breadcrumbSelectors = [
        'nav[aria-label*="breadcrumb"] a, nav[aria-label*="Breadcrumb"] a',
        '.breadcrumb a, .breadcrumbs a',
        '[data-testid*="breadcrumb"] a',
        'ol.breadcrumb a, ul.breadcrumb a',
        '.navigation-breadcrumbs a',
        '[class*="breadcrumb"] a'
    ];
    
    const categoryKeywords = {
        shoes: ['shoes', 'footwear', 'sneakers', 'boots', 'heels', 'flats', 'sandals', 'pumps', 'loafers'],
        bags: ['bags', 'handbags', 'purses', 'backpacks', 'clutches', 'totes', 'wallets', 'luggage'],
        clothing: ['clothing', 'apparel', 'dresses', 'tops', 'bottoms', 'jackets', 'coats', 'shirts', 'pants', 'jeans', 'skirts'],
        accessories: ['accessories', 'jewelry', 'watches', 'scarves', 'belts', 'hats', 'sunglasses', 'gloves']
    };
    
    for (const selector of breadcrumbSelectors) {
        const links = document.querySelectorAll(selector);
        for (const link of links) {
            const text = link.textContent.trim().toLowerCase();
            
            for (const [category, keywords] of Object.entries(categoryKeywords)) {
                for (const keyword of keywords) {
                    if (text.includes(keyword)) {
                        return {
                            category: category,
                            confidence: 'high',
                            source: 'breadcrumb',
                            score: 18,
                            matchedKeyword: keyword
                        };
                    }
                }
            }
        }
    }
    
    return { category: 'unknown', confidence: 'low', source: 'breadcrumb', score: 0 };
}

function detectCategoryFromHeadings() {
    const headingSelectors = ['h1', 'h2', 'h3', '.page-title', '.category-title', '.product-category'];
    
    const categoryKeywords = {
        shoes: ['shoes', 'footwear', 'sneakers', 'boots', 'heels', 'flats', 'sandals', 'pumps', 'loafers'],
        bags: ['bags', 'handbags', 'purses', 'backpacks', 'clutches', 'totes', 'wallets'],
        clothing: ['clothing', 'apparel', 'dresses', 'tops', 'bottoms', 'jackets', 'coats', 'shirts', 'pants', 'jeans', 'skirts'],
        accessories: ['accessories', 'jewelry', 'watches', 'scarves', 'belts', 'hats', 'sunglasses']
    };
    
    for (const selector of headingSelectors) {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
            const text = element.textContent.trim().toLowerCase();
            
            for (const [category, keywords] of Object.entries(categoryKeywords)) {
                for (const keyword of keywords) {
                    if (text.includes(keyword)) {
                        return {
                            category: category,
                            confidence: 'medium',
                            source: 'heading',
                            score: 15,
                            matchedKeyword: keyword
                        };
                    }
                }
            }
        }
    }
    
    return { category: 'unknown', confidence: 'low', source: 'heading', score: 0 };
}

function detectCategoryFromItemName(itemName) {
    // Basic implementation to avoid circular imports
    // The full implementation is in review-analysis.js
    const lowerItemName = itemName.toLowerCase();
    
    const categoryKeywords = {
        shoes: ['shoes', 'sneakers', 'boots', 'heels', 'flats', 'sandals', 'pumps', 'loafers'],
        bags: ['bag', 'handbag', 'purse', 'backpack', 'clutch', 'tote', 'wallet'],
        clothing: ['dress', 'shirt', 'top', 'pants', 'jeans', 'jacket', 'coat', 'skirt'],
        accessories: ['jewelry', 'watch', 'scarf', 'belt', 'hat', 'sunglasses']
    };
    
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
        for (const keyword of keywords) {
            if (lowerItemName.includes(keyword)) {
                return {
                    category: category,
                    confidence: 'medium',
                    source: 'item_name',
                    score: 10
                };
            }
        }
    }
    
    return { category: 'unknown', confidence: 'low', source: 'item_name', score: 0 };
}

function extractProductType(itemName, category) {
    if (!itemName) return null;
    
    const lowerItemName = itemName.toLowerCase();
    
    const productTypes = {
        shoes: {
            pumps: ['pumps', 'pump'],
            heels: ['heels', 'heel', 'stiletto', 'stilettos'],
            sneakers: ['sneakers', 'sneaker', 'trainers', 'trainer'],
            boots: ['boots', 'boot', 'ankle boots', 'knee boots'],
            flats: ['flats', 'flat', 'ballet flats', 'ballerinas'],
            sandals: ['sandals', 'sandal'],
            loafers: ['loafers', 'loafer', 'slip-on', 'slip-ons']
        },
        bags: {
            handbag: ['handbag', 'handbags'],
            tote: ['tote', 'totes'],
            clutch: ['clutch', 'clutches'],
            backpack: ['backpack', 'backpacks'],
            crossbody: ['crossbody', 'cross-body'],
            shoulder: ['shoulder bag', 'shoulder bags']
        },
        clothing: {
            dress: ['dress', 'dresses', 'midi dress', 'maxi dress', 'mini dress'],
            top: ['top', 'tops', 'shirt', 'blouse'],
            pants: ['pants', 'trousers', 'jeans'],
            jacket: ['jacket', 'blazer', 'coat'],
            skirt: ['skirt', 'skirts']
        },
        accessories: {
            watch: ['watch', 'watches'],
            jewelry: ['necklace', 'bracelet', 'earrings', 'ring'],
            scarf: ['scarf', 'scarves'],
            belt: ['belt', 'belts']
        }
    };
    
    if (category && productTypes[category]) {
        for (const [type, keywords] of Object.entries(productTypes[category])) {
            for (const keyword of keywords) {
                if (lowerItemName.includes(keyword)) {
                    return type;
                }
            }
        }
    }
    
    return null;
}

// ========================================
// PRODUCT NAME CLEANING AND ENHANCEMENT
// ========================================

function cleanProductName(name) {
    if (!name) return '';
    
    let cleaned = name.trim();
    
    // Remove common e-commerce noise
    cleaned = cleaned.replace(/\s*[-|]\s*Shop.*$/i, '');
    cleaned = cleaned.replace(/\s*[-|]\s*Buy.*$/i, '');
    cleaned = cleaned.replace(/\s*[-|]\s*Free.*$/i, '');
    cleaned = cleaned.replace(/\s*[-|]\s*\$.*$/i, '');
    cleaned = cleaned.replace(/\s*[-|]\s*Sale.*$/i, '');
    
    // Remove brand repetition if it's at the start
    const hostname = window.location.hostname.replace('www.', '').toLowerCase();
    const brandFromDomain = extractBrandFromHostname(hostname);
    if (brandFromDomain) {
        const brandRegex = new RegExp(`^${brandFromDomain}\\s+`, 'i');
        cleaned = cleaned.replace(brandRegex, '');
    }
    
    // Remove extra whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned;
}

function extractBrandFromHostname(hostname) {
    const brandMap = {
        'zara.com': 'Zara',
        'everlane.com': 'Everlane',
        'reformation.com': 'Reformation',
        'roheframes.com': 'Rohe',
        'cosstores.com': 'COS',
        'cos.com': 'COS',
        'arket.com': 'Arket',
        'stories.com': '& Other Stories',
        'aritzia.com': 'Aritzia',
        'toteme-studio.com': 'Toteme',
        'ganni.com': 'Ganni'
    };
    
    return brandMap[hostname] || null;
}

function extractProductSKU() {
    // Look for SKU patterns in various places
    const skuSelectors = [
        '[data-testid*="sku"]',
        '[class*="sku"]',
        '[id*="sku"]',
        '.product-code',
        '.item-code',
        '.style-number',
        '.model-number'
    ];
    
    for (const selector of skuSelectors) {
        const element = document.querySelector(selector);
        if (element) {
            const text = element.textContent?.trim();
            if (text && /[A-Z0-9]{3,}/.test(text)) {
                return text;
            }
        }
    }
    
    // Look for SKU patterns in the URL
    const url = window.location.href;
    const skuPatterns = [
        /[\?&]sku=([A-Z0-9]+)/i,
        /[\?&]style=([A-Z0-9]+)/i,
        /[\?&]pid=([A-Z0-9]+)/i,
        /\/p([A-Z0-9]{5,})\//i,
        /-p(\d{5,})\.html/i
    ];
    
    for (const pattern of skuPatterns) {
        const match = url.match(pattern);
        if (match) {
            return match[1];
        }
    }
    
    return null;
}

function extractProductColor() {
    // Look for color information in various places
    const colorSelectors = [
        '[data-testid*="color"]',
        '[class*="color"]',
        '.color-name',
        '.color-selected',
        '.selected-color',
        '.color-option.active',
        '.variant-color'
    ];
    
    for (const selector of colorSelectors) {
        const element = document.querySelector(selector);
        if (element) {
            const text = element.textContent?.trim();
            if (text && text.length > 1 && text.length < 30) {
                return text;
            }
        }
    }
    
    // Look for color in item name
    const itemName = extractItemNameFromPage();
    if (itemName) {
        const colorKeywords = [
            'black', 'white', 'grey', 'gray', 'blue', 'red', 'green', 'brown',
            'navy', 'cream', 'beige', 'tan', 'khaki', 'olive', 'burgundy', 'wine',
            'pink', 'purple', 'yellow', 'orange', 'silver', 'gold', 'bronze', 'copper'
        ];
        
        const lowerItemName = itemName.toLowerCase();
        for (const color of colorKeywords) {
            if (lowerItemName.includes(color)) {
                return color.charAt(0).toUpperCase() + color.slice(1);
            }
        }
    }
    
    return null;
}

function extractProductSize() {
    // Look for selected size information
    const sizeSelectors = [
        '.size-selected',
        '.selected-size',
        '.size-option.active',
        '.size-option.selected',
        '[data-testid*="size"].selected',
        '.variant-size'
    ];
    
    for (const selector of sizeSelectors) {
        const element = document.querySelector(selector);
        if (element) {
            const text = element.textContent?.trim();
            if (text && /^(XXS|XS|S|M|L|XL|XXL|\d+|\d+\.\d+)$/i.test(text)) {
                return text.toUpperCase();
            }
        }
    }
    
    return null;
}

function extractProductLine(itemName) {
    if (!itemName) return null;
    
    // Extract potential product line names (usually first 1-2 words)
    const words = itemName.trim().split(/\s+/);
    if (words.length >= 2) {
        // Look for capitalized words that might be product line names
        const potentialLine = words.slice(0, 2).join(' ');
        if (/^[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?$/.test(potentialLine)) {
            return potentialLine;
        }
    }
    
    // Look for collection/line names in brackets or after "from"
    const collectionPatterns = [
        /from\s+the\s+([^\n\r,]+?)\s+(?:collection|line)/i,
        /\(([^)]+?)\s+(?:collection|line)\)/i,
        /part\s+of\s+(?:the\s+)?([^\n\r,]+?)\s+(?:collection|line)/i
    ];
    
    for (const pattern of collectionPatterns) {
        const match = itemName.match(pattern);
        if (match && match[1]) {
            return match[1].trim();
        }
    }
    
    return null;
}

// ========================================
// COMPREHENSIVE PRODUCT EXTRACTION
// ========================================

// ========================================
// SEMANTIC SIMILARITY FUNCTIONS
// ========================================

function calculateProductSimilarity(product1, product2) {
    let similarity = 0;
    let factors = 0;
    
    // Exact name match (highest weight)
    if (product1.itemName && product2.itemName) {
        const name1 = normalizeProductName(product1.itemName);
        const name2 = normalizeProductName(product2.itemName);
        
        if (name1 === name2) {
            similarity += 100;
            factors += 1;
        } else {
            // Partial name similarity
            const nameSimilarity = calculateStringSimilarity(name1, name2);
            similarity += nameSimilarity * 60; // Weight: 60
            factors += 1;
        }
    }
    
    // SKU/Product Code match
    if (product1.sku && product2.sku) {
        if (product1.sku === product2.sku) {
            similarity += 90;
        }
        factors += 1;
    }
    
    // Color match
    if (product1.color && product2.color) {
        const colorSimilarity = normalizeColor(product1.color) === normalizeColor(product2.color) ? 15 : 0;
        similarity += colorSimilarity;
        factors += 1;
    }
    
    // Category match
    if (product1.category && product2.category) {
        const categorySimilarity = product1.category === product2.category ? 20 : 0;
        similarity += categorySimilarity;
        factors += 1;
    }
    
    // Product Type match
    if (product1.productType && product2.productType) {
        const typeSimilarity = product1.productType === product2.productType ? 25 : 0;
        similarity += typeSimilarity;
        factors += 1;
    }
    
    // Product Line match
    if (product1.productLine && product2.productLine) {
        const lineSimilarity = product1.productLine === product2.productLine ? 30 : 0;
        similarity += lineSimilarity;
        factors += 1;
    }
    
    return factors > 0 ? similarity / factors : 0;
}

function normalizeProductName(name) {
    if (!name) return '';
    return name.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function normalizeColor(color) {
    if (!color) return '';
    const colorMap = {
        'grey': 'gray',
        'navy blue': 'navy',
        'dark blue': 'navy',
        'light blue': 'blue'
    };
    
    const normalized = color.toLowerCase().trim();
    return colorMap[normalized] || normalized;
}

function calculateStringSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    if (str1 === str2) return 100;
    
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    const editDistance = getEditDistance(longer, shorter);
    const similarity = ((longer.length - editDistance) / longer.length) * 100;
    
    return Math.max(0, similarity);
}

function getEditDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    
    return matrix[str2.length][str1.length];
}

function extractAllProductData() {
    console.log('[PointFour] Starting comprehensive product data extraction...');
    
    const productData = {
        // URL-based extraction
        urlData: extractProductFromURL(),
        
        // Page content extraction
        itemName: extractItemNameFromPage(),
        productImage: extractProductImageFromPage(),
        
        // Enhanced product identifiers
        sku: extractProductSKU(),
        color: extractProductColor(),
        size: extractProductSize(),
        
        // Detailed product information
        materials: extractMaterialsFromPage(),
        sizeGuide: extractSizeGuideFromPage(),
        
        // Enhanced size chart extraction for tailored recommendations
        enhancedSizeChart: extractEnhancedSizeChart(),
        
        // Enhanced category detection
        categoryDetection: detectProductCategory(),
        
        // Meta information
        extractedAt: new Date().toISOString(),
        url: window.location.href,
        hostname: window.location.hostname
    };
    
    // Set main category from detection
    productData.category = productData.categoryDetection.category;
    
    // Extract product type and line if we have an item name and category
    if (productData.itemName && productData.category !== 'unknown') {
        productData.productType = extractProductType(productData.itemName, productData.category);
        productData.productLine = extractProductLine(productData.itemName);
    }
    
    // Merge URL data if available
    if (productData.urlData) {
        if (!productData.itemName) {
            productData.itemName = productData.urlData.itemName;
        }
        if (productData.urlData.brand) {
            productData.brand = productData.urlData.brand;
        }
    }
    
    // Generate product fingerprint for better matching
    productData.productFingerprint = generateProductFingerprint(productData);
    
    console.log('[PointFour] Comprehensive product extraction completed:', productData);
    
    return productData;
}

function generateProductFingerprint(productData) {
    const components = [];
    
    if (productData.brand) components.push(`brand:${productData.brand.toLowerCase()}`);
    if (productData.itemName) components.push(`name:${normalizeProductName(productData.itemName)}`);
    if (productData.sku) components.push(`sku:${productData.sku.toLowerCase()}`);
    if (productData.category) components.push(`cat:${productData.category}`);
    if (productData.productType) components.push(`type:${productData.productType}`);
    if (productData.color) components.push(`color:${normalizeColor(productData.color)}`);
    
    return components.join('|');
}

/**
 * Enhanced size chart extraction with improved accuracy
 */
function extractEnhancedSizeChart() {
    console.log('[PointFour] Starting enhanced size chart extraction...');
    
    const sizeChart = {
        brand: 'Unknown',
        productType: 'general',
        measurements: {},
        sizeSystem: 'US',
        confidence: 'low',
        source: window.location.href,
        sizingAdvice: [],
        modelInfo: {}
    };

    // Enhanced selectors for better coverage
    const sizeChartSelectors = [
        '.size-guide', '.size-chart', '.sizing-info', '.fit-guide',
        '[data-tab="sizing"]', '[data-tab="size-guide"]',
        'table[class*="size"]', 'table[id*="size"]',
        'a[href*="size-guide"]', 'button[class*="size-guide"]',
        // Popup/modal selectors
        '.modal', '.popup', '.overlay', '.lightbox',
        '[class*="modal"]', '[class*="popup"]', '[class*="overlay"]',
        '[class*="lightbox"]', '[class*="drawer"]',
        // Size guide specific popup selectors
        '.size-guide-modal', '.size-chart-popup', '.sizing-modal',
        '[data-modal="size-guide"]', '[data-popup="size-guide"]',
        // Details and size guide links
        'a[href*="details"]', 'a[href*="size"]', 'button[class*="details"]',
        'a[class*="details"]', 'button[class*="size"]',
        // Generic table selector (fallback)
        'table'
    ];

    // Enhanced size keywords for better detection
    const sizeKeywords = [
        'xs', 'small', 'medium', 'large', 'xl', 'xxl', 'xxxl',
        'bust', 'waist', 'hip', 'chest', 'shoulder', 'length', 'inseam',
        'size', 'measurement', 'fit', 'sizing', 'chart', 'guide'
    ];

    // First, try to extract size guide data from DOM inspection (including hidden content)
    console.log('[PointFour] Looking for size guide content in DOM (including hidden elements)...');
    
    // Look for ALL tables in the DOM, including hidden ones
    const allTables = document.querySelectorAll('table');
    console.log(`[PointFour] Found ${allTables.length} tables in DOM`);
    
    for (const table of allTables) {
        const tableText = (table.innerText || table.textContent || '').toLowerCase();
        const sizeKeywords = ['size', 'bust', 'waist', 'hip', 'chest', 'shoulder', 'length', 'xs', 'sm', 'md', 'lg', 'xl', 'measurement'];
        
        if (sizeKeywords.some(keyword => tableText.includes(keyword))) {
            console.log(`[PointFour] ✅ Found size chart table in DOM`);
            console.log(`[PointFour] Table content preview:`, tableText.substring(0, 200));
            
            const tableData = extractTableData(table);
            if (tableData.measurements && Object.keys(tableData.measurements).length > 0) {
                Object.assign(sizeChart.measurements, tableData.measurements);
                sizeChart.confidence = 'high';
                console.log(`[PointFour] ✅ Added ${Object.keys(tableData.measurements).length} measurements from DOM table`);
            }
        }
    }
    
    // Look for size guide containers (including hidden ones)
    const sizeGuideContainers = document.querySelectorAll('.size-guide, .size-chart, .sizing-info, .fit-guide, [data-tab="sizing"], [data-tab="size-guide"], .modal-size-guide, .sizing-table, .measurement-table, [class*="size-guide"], [class*="size-chart"]');
    console.log(`[PointFour] Found ${sizeGuideContainers.length} size guide containers in DOM`);
    
    for (const container of sizeGuideContainers) {
        const containerText = (container.innerText || container.textContent || '').toLowerCase();
        if (containerText.includes('size') || containerText.includes('measurement') || containerText.includes('waist') || containerText.includes('hip')) {
            console.log(`[PointFour] ✅ Found size guide container in DOM`);
            console.log(`[PointFour] Container content preview:`, containerText.substring(0, 200));
            
            const containerData = extractSizeDataFromElement(container);
            if (containerData.measurements && Object.keys(containerData.measurements).length > 0) {
                Object.assign(sizeChart.measurements, containerData.measurements);
                sizeChart.confidence = 'high';
                console.log(`[PointFour] ✅ Added ${Object.keys(containerData.measurements).length} measurements from DOM container`);
            }
            if (containerData.sizingAdvice && containerData.sizingAdvice.length > 0) {
                sizeChart.sizingAdvice.push(...containerData.sizingAdvice);
                console.log(`[PointFour] ✅ Added ${containerData.sizingAdvice.length} sizing advice items from DOM container`);
            }
        }
    }
    
    // Only perform flash extraction if DOM inspection didn't find any size data
    const hasSizeData = Object.keys(sizeChart.measurements).length > 0;
    console.log(`[PointFour] DOM inspection found ${Object.keys(sizeChart.measurements).length} measurements`);
    
    if (!hasSizeData) {
        console.log(`[PointFour] No size data found in DOM, trying flash extraction...`);
        
        // Look for size guide buttons and perform flash extraction
        const sizeGuideButtons = document.querySelectorAll('button[class*="size-guide"], button[class*="details"], a[class*="details"], a[class*="size"], button[class*="size"], [data-tab="sizing"], [data-tab="size-guide"]');
        
        console.log(`[PointFour] Found ${sizeGuideButtons.length} potential size guide buttons`);
        
        for (const button of sizeGuideButtons) {
            const buttonText = (button.innerText || button.textContent || '').toLowerCase();
            console.log(`[PointFour] Checking button: "${buttonText}"`);
            
            if (buttonText.includes('size') || buttonText.includes('guide') || buttonText.includes('details')) {
                console.log(`[PointFour] ✅ Found size guide button: "${buttonText}"`);
                
                try {
                    // Perform invisible extraction: hide popup, extract, restore
                    console.log(`[PointFour] Performing invisible extraction...`);
                    
                    // Click the button to open the size guide
                    button.click();
                    console.log(`[PointFour] Clicked size guide button`);
                    
                    // Wait a very short time for the popup to load
                    setTimeout(() => {
                        console.log(`[PointFour] Looking for size guide popup...`);
                        
                        // Look for the size guide popup
                        const sizeGuidePopups = document.querySelectorAll('.modal, .popup, .overlay, .lightbox, [class*="modal"], [class*="popup"], [class*="overlay"], [class*="lightbox"], [class*="drawer"], [class*="dialog"], [role="dialog"], [aria-modal="true"]');
                        
                        for (const popup of sizeGuidePopups) {
                            const isVisible = popup.offsetParent !== null && 
                                            popup.style.display !== 'none' && 
                                            popup.style.visibility !== 'hidden' &&
                                            popup.offsetWidth > 0 && 
                                            popup.offsetHeight > 0;
                            
                            if (isVisible) {
                                const popupText = (popup.innerText || popup.textContent || '').toLowerCase();
                                if (popupText.includes('size') || popupText.includes('measurement') || popupText.includes('waist') || popupText.includes('hip')) {
                                    console.log(`[PointFour] ✅ Found size guide popup with measurements`);
                                    console.log(`[PointFour] Popup content preview:`, popup.innerText.substring(0, 500));
                                    
                                    // Hide the popup immediately to prevent user disruption
                                    const originalDisplay = popup.style.display;
                                    const originalVisibility = popup.style.visibility;
                                    const originalOpacity = popup.style.opacity;
                                    
                                    popup.style.display = 'none';
                                    popup.style.visibility = 'hidden';
                                    popup.style.opacity = '0';
                                    
                                    console.log(`[PointFour] Hidden popup to prevent user disruption`);
                                    
                                    // Extract data from the hidden popup
                                    const popupData = extractSizeDataFromElement(popup);
                                    if (popupData.measurements && Object.keys(popupData.measurements).length > 0) {
                                        Object.assign(sizeChart.measurements, popupData.measurements);
                                        sizeChart.confidence = 'high';
                                        console.log(`[PointFour] ✅ Added ${Object.keys(popupData.measurements).length} measurements from popup`);
                                    }
                                    if (popupData.sizingAdvice && popupData.sizingAdvice.length > 0) {
                                        sizeChart.sizingAdvice.push(...popupData.sizingAdvice);
                                        console.log(`[PointFour] ✅ Added ${popupData.sizingAdvice.length} sizing advice items from popup`);
                                    }
                                    
                                    // Close the popup completely to restore original state
                                    const closeButton = popup.querySelector('button[aria-label="Close"], .close, [class*="close"], [class*="dismiss"], [aria-label="close"]');
                                    if (closeButton) {
                                        closeButton.click();
                                        console.log(`[PointFour] Closed size guide popup via close button`);
                                    } else {
                                        // Try pressing Escape key
                                        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
                                        console.log(`[PointFour] Attempted to close popup with Escape key`);
                                    }
                                    
                                    break;
                                }
                            }
                        }
                    }, 50); // Even shorter delay - 50ms for popup to load
                    
                } catch (error) {
                    console.log('[PointFour] Error during invisible extraction:', error);
                }
            }
        }
    } else {
        console.log(`[PointFour] Size data already found in DOM, skipping flash extraction`);
    }

    // Process each selector for existing content
    for (const selector of sizeChartSelectors) {
        const elements = document.querySelectorAll(selector);
        
        for (const element of elements) {
            const text = (element.innerText || element.textContent || '').toLowerCase();
            
            // Check if this element contains size-related content
            const containsSizeInfo = sizeKeywords.some(keyword => text.includes(keyword));
            
            if (containsSizeInfo) {
                console.log(`[PointFour] Found size chart candidate: ${selector}`);
                
                const elementData = extractSizeDataFromElement(element);
                if (elementData.measurements && Object.keys(elementData.measurements).length > 0) {
                    Object.assign(sizeChart.measurements, elementData.measurements);
                    sizeChart.confidence = 'high';
                }
                if (elementData.sizingAdvice && elementData.sizingAdvice.length > 0) {
                    sizeChart.sizingAdvice.push(...elementData.sizingAdvice);
                }
            }
        }
    }

    // Remove duplicates from sizing advice
    sizeChart.sizingAdvice = [...new Set(sizeChart.sizingAdvice)];

    console.log('[PointFour] Enhanced size chart extraction complete:', {
        measurements: Object.keys(sizeChart.measurements).length,
        confidence: sizeChart.confidence,
        sizingAdvice: sizeChart.sizingAdvice.length
    });

    return sizeChart;
}

/**
 * Extract size data from any element (table or text)
 */
function extractSizeDataFromElement(element) {
    const data = {
        measurements: {},
        sizingAdvice: []
    };

    console.log(`[PointFour] Extracting size data from element: ${element.tagName}`);

    // If it's a table, extract structured data
    if (element.tagName === 'TABLE') {
        console.log('[PointFour] Processing table element');
        const tableData = extractTableData(element);
        if (tableData.measurements && Object.keys(tableData.measurements).length > 0) {
            Object.assign(data.measurements, tableData.measurements);
            console.log(`[PointFour] Found ${Object.keys(tableData.measurements).length} measurements in table`);
        }
    }

    // Look for tables within the element
    const tables = element.querySelectorAll('table');
    console.log(`[PointFour] Found ${tables.length} tables within element`);
    
    for (const table of tables) {
        const tableData = extractTableData(table);
        if (tableData.measurements && Object.keys(tableData.measurements).length > 0) {
            Object.assign(data.measurements, tableData.measurements);
            console.log(`[PointFour] Found ${Object.keys(tableData.measurements).length} measurements in nested table`);
        }
    }

    // Extract measurements from text using more aggressive patterns
    const text = (element.innerText || element.textContent || '');
    console.log(`[PointFour] Processing text content (${text.length} chars):`, text.substring(0, 300));
    
    // Enhanced measurement patterns for size charts
    const measurementPatterns = [
        // Size chart table patterns: "Size 24" "25" "26" etc.
        /size\s+(\w+)[:\s]*(\d+(?:\.\d+)?)/gi,
        // Direct measurements: "28" waist, 38" hip
        /(\d+(?:\.\d+)?)\s*["\s]*(?:waist|bust|chest)[,\s]*(\d+(?:\.\d+)?)\s*["\s]*(?:hip|hips)/gi,
        // Size ranges: "26-28" or "XS-S"
        /(\w+)[-\s]+(\w+)[:\s]+(\d+(?:\.\d+)?)\s*["\s]*(?:waist|bust|chest)/gi,
        // Simple size patterns
        /size\s+(\w+)[:\s]+(\d+(?:\.\d+)?) /gi,
        // Measurement with units
        /(\d+(?:\.\d+)?)\s*(?:cm|inch|inches|in|")/gi,
        // Size chart specific: "24" "25" "26" etc.
        /\b(\d{2,3})\b/gi,
        // Size conversion patterns (for FRAME): "US 23 UK 4 IT 36 FR 32"
        /(?:US|UK|IT|FR|EU)\s+(\d+(?:\.\d+)?)/gi,
        // Size conversion with labels: "US: 23, UK: 4, IT: 36, FR: 32"
        /(?:US|UK|IT|FR|EU)[:\s]+(\d+(?:\.\d+)?)/gi
    ];

    for (const pattern of measurementPatterns) {
        const matches = [...text.matchAll(pattern)];
        console.log(`[PointFour] Pattern ${pattern.source} found ${matches.length} matches`);
        
        for (const match of matches) {
            if (match[1] && match[2]) {
                const size = match[1].toLowerCase().trim();
                const measurement = parseFloat(match[2]);
                if (!isNaN(measurement)) {
                    data.measurements[size] = data.measurements[size] || {};
                    data.measurements[size].waist = measurement;
                    console.log(`[PointFour] Added measurement: ${size} -> waist: ${measurement}`);
                }
            }
            if (match[3] && !isNaN(parseFloat(match[3]))) {
                const size = match[1] ? match[1].toLowerCase().trim() : 'unknown';
                const measurement = parseFloat(match[3]);
                data.measurements[size] = data.measurements[size] || {};
                data.measurements[size].hip = measurement;
                console.log(`[PointFour] Added measurement: ${size} -> hip: ${measurement}`);
            }
        }
        
        // Handle size conversion patterns (US/UK/IT/FR)
        if (pattern.source.includes('US|UK|IT|FR|EU')) {
            for (const match of matches) {
                if (match[1]) {
                    const size = match[1].toLowerCase().trim();
                    const measurement = parseFloat(match[1]);
                    if (!isNaN(measurement)) {
                        // Store as size conversion data
                        data.measurements[size] = data.measurements[size] || {};
                        data.measurements[size].sizeConversion = measurement;
                        console.log(`[PointFour] Added size conversion: ${size} -> ${measurement}`);
                    }
                }
            }
        }
    }

    // Extract sizing advice from text
    const advicePatterns = [
        /runs?\s+(small|large|true\s+to\s+size)/gi,
        /model\s+(?:is\s+)?wearing\s+size\s+(\w+)/gi,
        /recommend\s+sizing\s+(up|down)/gi,
        /suggest\s+sizing\s+(up|down)/gi,
        /we\s+recommend\s+sizing\s+(up|down)/gi,
        /consider\s+sizing\s+(up|down)/gi,
        /size\s+(up|down)\s+for\s+(.+)fit/gi,
        /runs?\s+(tight|loose|narrow|wide)/gi
    ];
    
    for (const pattern of advicePatterns) {
        const matches = text.match(pattern);
        if (matches) {
            data.sizingAdvice.push(...matches);
            console.log(`[PointFour] Found sizing advice: ${matches.join(', ')}`);
        }
    }

    console.log(`[PointFour] Final extracted data:`, data);
    return data;
}


// ========================================
// MODULE: REVIEW-ANALYSIS
// ========================================

// ========================================
// POINTFOUR - REVIEW ANALYSIS MODULE
// ========================================

// ========================================
// QUALITY INSIGHTS EXTRACTION
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
// REVIEW RELEVANCE CLASSIFICATION
// ========================================

function classifyReviewRelevance(review, itemName, brandName) {
    if (!itemName || itemName === 'Unknown Item') {
        return { isItemSpecific: false, relevance: 'low' };
    }
    
    const text = `${review.title} ${review.snippet} ${review.fullContent || ''}`.toLowerCase();
    const itemWords = itemName.toLowerCase().split(' ').filter(word => word.length > 2);
    const brandWords = brandName.toLowerCase().split(' ').filter(word => word.length > 2);
    
    // Check for exact item name matches
    const hasExactItemMatch = itemWords.some(word => text.includes(word));
    const hasExactBrandMatch = brandWords.some(word => text.includes(word));
    
    // Check for fit/sizing keywords
    const hasFitKeywords = review.tags.some(tag => 
        tag.toLowerCase().includes('fit') || 
        tag.toLowerCase().includes('size') ||
        tag.toLowerCase().includes('sizing')
    );
    
    // Check for quality keywords
    const hasQualityKeywords = review.tags.some(tag => 
        tag.toLowerCase().includes('quality') || 
        tag.toLowerCase().includes('durable') ||
        tag.toLowerCase().includes('material') ||
        tag.toLowerCase().includes('fabric') ||
        tag.toLowerCase().includes('excellent') ||
        tag.toLowerCase().includes('cheap')
    );
    
    // Determine relevance
    if (hasExactItemMatch && hasExactBrandMatch && (hasFitKeywords || hasQualityKeywords)) {
        return { isItemSpecific: true, relevance: 'high' };
    } else if ((hasExactItemMatch || hasExactBrandMatch) && (hasFitKeywords || hasQualityKeywords)) {
        return { isItemSpecific: true, relevance: 'medium' };
    } else if (hasFitKeywords || hasQualityKeywords) {
        return { isItemSpecific: false, relevance: 'medium' };
    } else {
        return { isItemSpecific: false, relevance: 'low' };
    }
}

// ========================================
// CATEGORY DETECTION AND FILTERING
// ========================================

function detectCategoryFromItemName(itemName = '') {
    console.log('[PointFour] Detecting category from item name:', itemName);
    
    const lowerItemName = itemName.toLowerCase();
    
    // Define category keywords with priority scoring
    const categoryKeywords = {
        footwear: {
            keywords: [
                'sneakers', 'shoes', 'boots', 'sandals', 'heels', 'flats', 'loafers', 
                'oxfords', 'pumps', 'stilettos', 'wedges', 'clogs', 'moccasins',
                'trainers', 'runners', 'athletic shoes', 'dress shoes', 'casual shoes',
                'ankle boots', 'knee boots', 'combat boots', 'chelsea boots',
                'ballerinas', 'ballet flats', 'espadrilles', 'slip-ons',
                'footwear', 'chaussures', 'scarpe', 'zapatos', 'schuhe'
            ],
            score: 0
        },
        tops: {
            keywords: [
                'shirt', 't-shirt', 'tshirt', 'blouse', 'top', 'sweater', 'jumper',
                'cardigan', 'hoodie', 'sweatshirt', 'pullover', 'vest', 'tank',
                'camisole', 'tunic', 'polo', 'henley', 'crop top', 'bodysuit',
                'blazer', 'jacket', 'coat', 'outerwear', 'windbreaker', 'parka',
                'bomber', 'denim jacket', 'leather jacket', 'suit jacket'
            ],
            score: 0
        },
        bottoms: {
            keywords: [
                'pants', 'trousers', 'jeans', 'chinos', 'shorts', 'skirt', 'dress',
                'leggings', 'joggers', 'sweatpants', 'cargo pants', 'wide-leg',
                'skinny jeans', 'straight jeans', 'bootcut', 'flare jeans',
                'mini skirt', 'maxi skirt', 'pencil skirt', 'a-line skirt',
                'midi dress', 'maxi dress', 'mini dress', 'shift dress', 'wrap dress'
            ],
            score: 0
        },
        accessories: {
            keywords: [
                'bag', 'purse', 'handbag', 'clutch', 'tote', 'backpack', 'satchel',
                'wallet', 'belt', 'scarf', 'hat', 'cap', 'beanie', 'jewelry',
                'necklace', 'bracelet', 'earrings', 'ring', 'watch', 'sunglasses',
                'gloves', 'mittens', 'hair accessory', 'headband', 'brooch'
            ],
            score: 0
        }
    };
    
    // Score each category based on keyword matches
    for (const [category, data] of Object.entries(categoryKeywords)) {
        for (const keyword of data.keywords) {
            if (lowerItemName.includes(keyword)) {
                data.score += keyword.length; // Longer keywords get higher scores
                
                // Exact matches get bonus points
                if (lowerItemName === keyword) {
                    data.score += 10;
                }
                
                // Word boundary matches get bonus points
                const wordBoundaryRegex = new RegExp(`\\b${keyword}\\b`, 'i');
                if (wordBoundaryRegex.test(itemName)) {
                    data.score += 5;
                }
            }
        }
    }
    
    // Find the category with the highest score
    let bestCategory = 'unknown';
    let highestScore = 0;
    let confidence = 'low';
    
    for (const [category, data] of Object.entries(categoryKeywords)) {
        if (data.score > highestScore) {
            highestScore = data.score;
            bestCategory = category;
        }
    }
    
    // Determine confidence based on score
    if (highestScore >= 15) {
        confidence = 'high';
    } else if (highestScore >= 8) {
        confidence = 'medium';
    } else if (highestScore > 0) {
        confidence = 'low';
    }
    
    console.log('[PointFour] Category detection results:', {
        category: bestCategory,
        confidence: confidence,
        score: highestScore,
        scores: Object.fromEntries(
            Object.entries(categoryKeywords).map(([cat, data]) => [cat, data.score])
        )
    });
    
    return { category: bestCategory, confidence: confidence, score: highestScore };
}

function filterReviewsByCategory(reviews, detectedCategory, itemName = '') {
    if (!reviews || !Array.isArray(reviews) || !detectedCategory) {
        return reviews;
    }
    
    console.log('[PointFour] Filtering reviews by category:', detectedCategory, 'for item:', itemName);
    
    // Define category-specific keywords for review filtering
    const categoryFilters = {
        footwear: {
            include: [
                'shoe', 'boot', 'sneaker', 'sandal', 'heel', 'flat', 'loafer',
                'oxford', 'pump', 'stiletto', 'wedge', 'clog', 'moccasin',
                'trainer', 'runner', 'athletic', 'dress shoe', 'casual shoe',
                'ankle boot', 'knee boot', 'combat boot', 'chelsea boot',
                'ballerina', 'ballet flat', 'espadrille', 'slip-on',
                'footwear', 'sole', 'lace', 'strap', 'arch support', 'heel height',
                'toe box', 'insole', 'outsole', 'sizing', 'width', 'comfortable to walk'
            ],
            exclude: [
                'shirt', 'top', 'blouse', 'sweater', 'cardigan', 'jacket', 'coat',
                'dress', 'skirt', 'pants', 'trouser', 'jean', 'short', 'legging',
                'sleeve', 'collar', 'button', 'zipper', 'pocket', 'waist', 'hem'
            ]
        },
        tops: {
            include: [
                'shirt', 'top', 'blouse', 'sweater', 'cardigan', 'jacket', 'coat',
                'blazer', 'vest', 'hoodie', 'sweatshirt', 't-shirt', 'tank top',
                'camisole', 'crop top', 'tunic', 'polo', 'button-down',
                'sleeve', 'collar', 'neckline', 'shoulder', 'chest', 'armpit',
                'length', 'fit around chest', 'arm length', 'sleeve length'
            ],
            exclude: [
                'shoe', 'boot', 'sneaker', 'sandal', 'heel', 'flat',
                'pants', 'trouser', 'jean', 'short', 'legging', 'skirt', 'dress',
                'bag', 'purse', 'wallet', 'belt', 'scarf', 'hat', 'jewelry'
            ]
        },
        bottoms: {
            include: [
                'pants', 'trouser', 'jean', 'short', 'legging', 'skirt', 'dress',
                'overall', 'jumpsuit', 'romper', 'culotte', 'palazzo',
                'waist', 'hip', 'thigh', 'leg', 'inseam', 'rise', 'hem',
                'length', 'fit around waist', 'leg length', 'crotch', 'seat'
            ],
            exclude: [
                'shoe', 'boot', 'sneaker', 'sandal', 'heel', 'flat',
                'shirt', 'top', 'blouse', 'sweater', 'cardigan', 'jacket',
                'bag', 'purse', 'wallet', 'belt', 'scarf', 'hat', 'jewelry'
            ]
        },
        accessories: {
            include: [
                'bag', 'purse', 'wallet', 'belt', 'scarf', 'hat', 'jewelry',
                'watch', 'bracelet', 'necklace', 'earring', 'ring', 'brooch',
                'hair accessory', 'headband', 'tie', 'bow tie', 'cufflink',
                'sunglasses', 'glove', 'mitten', 'clutch', 'handbag', 'backpack',
                'tote', 'messenger bag', 'crossbody', 'shoulder bag'
            ],
            exclude: [
                'shoe', 'boot', 'sneaker', 'sandal', 'heel', 'flat',
                'shirt', 'top', 'blouse', 'sweater', 'cardigan', 'jacket',
                'pants', 'trouser', 'jean', 'short', 'legging', 'skirt', 'dress'
            ]
        }
    };
    
    const filter = categoryFilters[detectedCategory.category];
    if (!filter) {
        console.log('[PointFour] No filter found for category:', detectedCategory.category);
        return reviews;
    }
    
    const filteredReviews = reviews.filter(review => {
        const reviewText = `${review.title || ''} ${review.snippet || ''} ${review.fullContent || ''}`.toLowerCase();
        
        // Check if review contains category-specific keywords
        const hasIncludeKeywords = filter.include.some(keyword => reviewText.includes(keyword));
        const hasExcludeKeywords = filter.exclude.some(keyword => reviewText.includes(keyword));
        
        // Prioritize item name mentions
        let mentionsItem = false;
        if (itemName) {
            const itemWords = itemName.toLowerCase().split(' ').filter(word => word.length > 2);
            mentionsItem = itemWords.some(word => reviewText.includes(word));
        }
        
        // If review mentions the specific item, always include (high relevance)
        if (mentionsItem) {
            return true;
        }
        
        // Otherwise, use category filtering
        return hasIncludeKeywords && !hasExcludeKeywords;
    });
    
    console.log('[PointFour] Category filtering results:', {
        category: detectedCategory.category,
        originalCount: reviews.length,
        filteredCount: filteredReviews.length,
        filterRatio: Math.round((filteredReviews.length / reviews.length) * 100) + '%'
    });
    
    return filteredReviews;
}

// ========================================
// RELEVANT QUOTES EXTRACTION
// ========================================

function extractRelevantQuotes(data, section = null, sectionClaim = null) {
    if (!data.externalSearchResults?.reviews || !section || !sectionClaim) {
        return [];
    }
    
    let reviews = data.externalSearchResults.reviews;
    const quotes = [];
    
    // ENHANCEMENT: Filter and prioritize reviews based on relevance
    const brandName = data.brandName;
    const itemName = window.pointFourURLExtraction?.itemName;
    
    console.log('🔍 [PointFour] Quote extraction with differentiation:', {
        totalReviews: reviews.length,
        hasItemName: !!itemName,
        itemName: itemName,
        brandName: brandName
    });
    
    if (itemName && brandName) {
        // Apply category filtering first if available
        const pageData = window.pointFourPageData;
        let productCategory = pageData?.productCategory;
        
        // Fallback: if no category is available, try to detect from item name
        if (!productCategory || productCategory.category === 'unknown') {
            productCategory = detectCategoryFromItemName(itemName);
            console.log('[PointFour] Using fallback category detection:', productCategory);
        }
        
        let categoryFilteredReviews = reviews;
        if (productCategory && productCategory.category !== 'unknown') {
            categoryFilteredReviews = filterReviewsByCategory(reviews, productCategory, itemName);
            console.log('[PointFour] Applied category filtering:', productCategory.category);
        }
        
        // Classify and sort reviews by relevance
        const classifiedReviews = categoryFilteredReviews.map(review => ({
            ...review,
            relevance: classifyReviewRelevance(review, itemName, brandName)
        }));
        
        // Sort by relevance: item-specific high > item-specific medium > general medium > general low
        classifiedReviews.sort((a, b) => {
            if (a.relevance.isItemSpecific && !b.relevance.isItemSpecific) return -1;
            if (!a.relevance.isItemSpecific && b.relevance.isItemSpecific) return 1;
            
            const relevanceOrder = { 'high': 3, 'medium': 2, 'low': 1 };
            return relevanceOrder[b.relevance.relevance] - relevanceOrder[a.relevance.relevance];
        });
        
        // Use sorted reviews prioritizing item-specific content
        reviews = classifiedReviews;
        
        console.log('🔍 [PointFour] Review prioritization results:', {
            highRelevanceCount: classifiedReviews.filter(r => r.relevance.relevance === 'high').length,
            itemSpecificHighCount: classifiedReviews.filter(r => r.relevance.isItemSpecific && r.relevance.relevance === 'high').length
        });
    }
    
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
        
        // Double-check brand relevance
        const brandName = data.brandName?.toLowerCase() || '';
        if (brandName) {
            // Create flexible brand matching
            const brandVariations = [
                brandName,
                brandName.replace(/frames?$/, ''),
                brandName.replace(/[^a-z]/g, ''),
                brandName.split(/[^a-z]/)[0]
            ].filter(v => v.length > 2);
            
            const hasValidBrandMention = brandVariations.some(variation => 
                fullText.includes(variation)
            );
            
            if (!hasValidBrandMention) {
                continue;
            }
        }
        
        // Check if this text matches the claim patterns
        const matchingPatterns = claimPatterns.filter(pattern => pattern.test(fullText));
        
        if (matchingPatterns.length === 0) continue;
        
        // Verify it's actually a user review
        if (!isUserReview(fullText)) continue;
        
        // Extract the most relevant sentence containing the match
        const sentences = fullText.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 10);
        
        for (const pattern of matchingPatterns) {
            const matchingSentence = sentences.find(sentence => pattern.test(sentence));
            
            if (matchingSentence && matchingSentence.length >= 20 && matchingSentence.length <= 200) {
                // Clean up the sentence
                const cleanedSentence = matchingSentence
                    .replace(/^(and |but |so |also )/i, '')
                    .charAt(0).toUpperCase() + matchingSentence.slice(1);
                
                quotes.push({
                    text: cleanedSentence,
                    source: review.source || 'Review',
                    confidence: 'high',
                    pattern: pattern.source
                });
                
                if (quotes.length >= 2) break; // Limit quotes per section
            }
        }
        
        if (quotes.length >= 2) break;
    }
    
    return quotes.slice(0, 2); // Max 2 quotes per section
}




// ========================================
// MODULE: WIDGET-MANAGEMENT
// ========================================

// ========================================
// POINTFOUR - WIDGET MANAGEMENT MODULE
// ========================================

// ========================================
// WIDGET CREATION AND LIFECYCLE
// ========================================

function createWidget() {
    const widgetInjected = getState('widgetInjected');
    if (widgetInjected) {
        console.log('[PointFour] Widget already exists');
        return;
    }
    
    console.log('[PointFour] Creating widget...');
    
    // Reset loading state
    setState('currentLoadingPhase', 'initial');
    setState('hasShownFinalData', false);
    setState('loadingStartTime', Date.now());
    setState('lastDataQuality', 0);
    setState('dataUpdateCount', 0);
    
    const widgetContainer = document.createElement('div');
    widgetContainer.id = 'pointfour-widget';
    widgetContainer.className = 'pointfour-widget pointfour-loading';
    
    // Add confidence indicator based on detection score
    const detectionScore = getState('detectionScore');
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
            <div class="pointfour-header-buttons">
                <button class="pointfour-minimize" aria-label="Minimize">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <line x1="5" y1="12" x2="19" y2="12" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                </button>
                <button class="pointfour-close" aria-label="Close">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <line x1="18" y1="6" x2="6" y2="18" stroke-width="2" stroke-linecap="round"/>
                        <line x1="6" y1="6" x2="18" y2="18" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                </button>
            </div>
        </div>
        <div class="pointfour-content">
            <div class="pointfour-loading-spinner">
                <div class="pointfour-spinner"></div>
                <p>Initializing analysis...</p>
            </div>
        </div>
    `;
    
    document.body.appendChild(widgetContainer);
    setState('widgetInjected', true);
    setState('widgetContainer', widgetContainer);
    
    // Add event listeners
    const closeBtn = widgetContainer.querySelector('.pointfour-close');
    const minimizeBtn = widgetContainer.querySelector('.pointfour-minimize');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', hideWidget);
    }
    
    if (minimizeBtn) {
        minimizeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleMinimize();
        });
    }
    
    // Note: Click-outside-to-close behavior has been removed 
    // Users can close the widget using the X button or minimize it
    
    console.log('[PointFour] Widget created successfully');
}

function showWidget() {
    const widgetContainer = getState('widgetContainer');
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
    const widgetContainer = getState('widgetContainer');
    if (!widgetContainer) return;
    
    widgetContainer.classList.remove('pointfour-visible');
    
    setTimeout(() => {
        const currentContainer = getState('widgetContainer');
        if (currentContainer && !currentContainer.classList.contains('pointfour-visible')) {
            currentContainer.remove();
            setState('widgetContainer', null);
            setState('widgetInjected', false);
        }
    }, 300);
}

function toggleMinimize() {
    console.log('[PointFour] Toggle minimize clicked');
    const widgetContainer = getState('widgetContainer');
    if (!widgetContainer) {
        console.log('[PointFour] No widget container found');
        return;
    }
    
    const isMinimized = widgetContainer.classList.contains('pointfour-minimized');
    const minimizeBtn = widgetContainer.querySelector('.pointfour-minimize');
    const content = widgetContainer.querySelector('.pointfour-content');
    
    console.log('[PointFour] Current minimized state:', isMinimized);
    
    if (isMinimized) {
        // Expand widget
        console.log('[PointFour] Expanding widget');
        widgetContainer.classList.remove('pointfour-minimized');
        if (content) {
            content.style.display = 'block';
            console.log('[PointFour] Content display set to block');
        }
        
        // Change minimize button icon to minimize (horizontal line)
        if (minimizeBtn) {
            minimizeBtn.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <line x1="5" y1="12" x2="19" y2="12" stroke-width="2" stroke-linecap="round"/>
                </svg>
            `;
            minimizeBtn.setAttribute('aria-label', 'Minimize');
        }
        
        setState('widgetMinimized', false);
    } else {
        // Minimize widget
        console.log('[PointFour] Minimizing widget');
        widgetContainer.classList.add('pointfour-minimized');
        if (content) {
            content.style.display = 'none';
            console.log('[PointFour] Content display set to none');
        }
        
        // Change minimize button icon to expand (plus or up arrow)
        if (minimizeBtn) {
            minimizeBtn.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="18,15 12,9 6,15" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            `;
            minimizeBtn.setAttribute('aria-label', 'Expand');
        }
        
        setState('widgetMinimized', true);
    }
}

// ========================================
// WIDGET CONTENT MANAGEMENT
// ========================================

function updateWidgetContent(data) {
    const widgetContainer = getState('widgetContainer');
    if (!widgetContainer) return;
    
    const contentDiv = widgetContainer.querySelector('.pointfour-content');
    if (!contentDiv) return;
    
    // Log all data updates for debugging
    console.log('🔄 [PointFour] updateWidgetContent called with data:', {
        hasData: !!data,
        error: data?.error,
        brandName: data?.brandName,
        hasReviews: !!(data?.reviews || data?.externalSearchResults?.reviews),
        reviewsCount: (data?.reviews?.length || data?.externalSearchResults?.reviews?.length || 0),
        hasStructuredData: !!(data?.brandFitSummary?.sections || data?.externalSearchResults?.brandFitSummary?.sections),
        sectionsCount: (data?.brandFitSummary?.sections ? Object.keys(data.brandFitSummary.sections).length : 
                       (data?.externalSearchResults?.brandFitSummary?.sections ? Object.keys(data.externalSearchResults.brandFitSummary.sections).length : 0)),
        recommendation: data?.recommendation?.substring(0, 100) + '...' || 'N/A',
        currentLoadingPhase: getState('currentLoadingPhase'),
        hasShownFinalData: getState('hasShownFinalData'),
        elapsed: Date.now() - getState('loadingStartTime')
    });
    
    // Keep loading state if we're still processing
    const isProcessing = getState('isProcessing');
    if (isProcessing && !data) {
        console.log('[PointFour] Still processing, maintaining loading state');
        return;
    }
    
    // If we've already shown final data, don't show intermediate states
    const hasShownFinalData = getState('hasShownFinalData');
    if (hasShownFinalData && data && !data.error) {
        console.log('[PointFour] Final data already shown, ignoring intermediate update');
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
        setState('hasShownFinalData', true);
    } else if (data && data.status === 'no_data') {
        contentDiv.innerHTML = `
            <div class="pointfour-no-data">
                <p>${data.message || 'No fit data available for this brand'}</p>
                <small>We're working on adding more brands!</small>
            </div>
        `;
        setState('hasShownFinalData', true);
    } else if (data) {
        renderMainContent(data, contentDiv);
    }
}

function renderMainContent(data, contentDiv) {
    const brandName = data.brandName || getState('currentBrand') || 'Unknown Brand';
    const totalReviews = data.totalResults ||
                        data.brandFitSummary?.totalResults ||
                        data.externalSearchResults?.totalResults || 
                        data.richSummaryData?.totalResults || 
                        0;
    
    // Check if this is complete data that should be shown
    const hasReviews = (data.externalSearchResults?.reviews && data.externalSearchResults.reviews.length > 0) ||
                       (data.reviews && data.reviews.length > 0);
    const hasStructuredAnalysis = (data.externalSearchResults?.brandFitSummary?.sections && Object.keys(data.externalSearchResults.brandFitSummary.sections).length > 0) ||
                                (data.brandFitSummary?.sections && Object.keys(data.brandFitSummary.sections).length > 0);
    const hasRecommendation = data.recommendation && 
                             data.recommendation !== 'Analyzing fit information...' &&
                             data.recommendation.length > 20;
    
    // Debug logging for data detection
    console.log('🔍 [PointFour] Data detection debug:', {
        hasReviews,
        hasStructuredAnalysis,
        hasRecommendation,
        sectionsData: data.externalSearchResults?.brandFitSummary?.sections || data.brandFitSummary?.sections,
        sectionsKeys: data.externalSearchResults?.brandFitSummary?.sections ? Object.keys(data.externalSearchResults.brandFitSummary.sections) : 
                     (data.brandFitSummary?.sections ? Object.keys(data.brandFitSummary.sections) : []),
        recommendation: data.recommendation?.substring(0, 100)
    });
    
    // Calculate data quality score (0-100)
    let dataQuality = 0;
    if (hasReviews) dataQuality += 30;
    if (hasStructuredAnalysis) dataQuality += 40;
    if (hasRecommendation) dataQuality += 30;
    
    // Check if this is a final/definitive response (even if negative)
    const isFinalResponse = data.recommendation && (
        data.recommendation.includes('marketplace brand') ||
        data.recommendation.includes('not applicable') ||
        data.recommendation.includes('not available') ||
        data.recommendation.includes('no data') ||
        data.recommendation.includes('unable to analyze')
    );
    
    // Simplified logic: if we have structured analysis OR recommendation, show it
    const isCompleteData = hasStructuredAnalysis || hasRecommendation || isFinalResponse;
    
    // Track data quality progression
    const dataUpdateCount = getState('dataUpdateCount') + 1;
    setState('dataUpdateCount', dataUpdateCount);
    
    const lastDataQuality = getState('lastDataQuality');
    const qualityImproved = dataQuality > lastDataQuality;
    setState('lastDataQuality', dataQuality);
    
    // Check if we should force completion due to timeout or processing state
    const elapsed = Date.now() - getState('loadingStartTime');
    const isProcessing = getState('isProcessing');
    const forceComplete = elapsed > 20000 || (!isProcessing && elapsed > 5000);
    
    // If this isn't complete data yet and we're not forcing completion, show progressive loading
    if (!isCompleteData && !data.error && !forceComplete) {
        renderProgressiveLoading(brandName, contentDiv);
        return;
    }
    
    // Mark as complete and render final content (even if incomplete)
    setState('hasShownFinalData', true);
    renderFinalContent(data, brandName, totalReviews, contentDiv);
}

function renderProgressiveLoading(brandName, contentDiv) {
    const elapsed = Date.now() - getState('loadingStartTime');
    const currentLoadingPhase = getState('currentLoadingPhase');
    
    if (elapsed < 5000) {
        // First 5 seconds: Searching
        if (currentLoadingPhase !== 'searching') {
            setState('currentLoadingPhase', 'searching');
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
        }
    } else if (elapsed < 15000) {
        // 5-15 seconds: Collating
        if (currentLoadingPhase !== 'collating') {
            setState('currentLoadingPhase', 'collating');
            contentDiv.innerHTML = `
                <div class="pointfour-results">
                    <h3>${brandName}</h3>
                    <div class="pointfour-fit-info">
                        <div class="pointfour-loading-spinner">
                            <div class="pointfour-spinner"></div>
                            <p>Collating reviews and analyzing patterns...</p>
                        </div>
                    </div>
                </div>
            `;
        }
    } else {
        // 15+ seconds: Analyzing
        if (currentLoadingPhase !== 'analyzing') {
            setState('currentLoadingPhase', 'analyzing');
            contentDiv.innerHTML = `
                <div class="pointfour-results">
                    <h3>${brandName}</h3>
                    <div class="pointfour-fit-info">
                        <div class="pointfour-loading-spinner">
                            <div class="pointfour-spinner"></div>
                            <p>Generating fit analysis...</p>
                        </div>
                    </div>
                </div>
            `;
        }
    }
}

function renderFinalContent(data, brandName, totalReviews, contentDiv) {
    const isMarketplace = data.isMarketplace || false;
    const sections = data.externalSearchResults?.brandFitSummary?.sections || data.brandFitSummary?.sections || {};
    const qualityInsight = extractQualityInsights(data);
    
    // Debug logging for sections
    console.log('🔍 [PointFour] renderFinalContent debug:', {
        sectionsData: sections,
        sectionsKeys: Object.keys(sections),
        sectionsCount: Object.keys(sections).length,
        hasFit: !!sections.fit,
        hasQuality: !!sections.quality,
        hasWashCare: !!sections.washCare,
        fitRecommendation: sections.fit?.recommendation?.substring(0, 100),
        qualityRecommendation: sections.quality?.recommendation?.substring(0, 100),
        fitEvidence: sections.fit?.evidence?.length || 0,
        qualityEvidence: sections.quality?.evidence?.length || 0,
        washCareEvidence: sections.washCare?.evidence?.length || 0
    });
    
    // Determine if this is item-specific or brand-general
    const urlExtraction = window.pointFourURLExtraction || null;
    const itemName = urlExtraction?.itemName || null;
    const isItemSpecific = itemName && itemName.length > 0;
    
    // Generate category-specific review context copy with sources
    let reviewContext = '';
    const genericTerms = ['shop', 'store', 'collection', 'brand', 'clothing', 'fashion'];
    const isGenericTerm = itemName && genericTerms.includes(itemName.toLowerCase());
    
    // Get category information from data
    const category = data.category || urlExtraction?.category;
    const productType = data.productType || urlExtraction?.productType;
    const relevanceLevel = data.relevanceLevel;
    
    // Get top sources for transparency
    const sources = data.externalSearchResults?.brandFitSummary?.sources || [];
    const hasMoreSources = data.externalSearchResults?.brandFitSummary?.hasMoreSources || false;
    let sourcesText = '';
    
    if (sources.length > 0) {
        const sourceNames = sources.slice(0, 3).map(s => s.name);
        
        if (sourceNames.length === 1) {
            sourcesText = ` from ${sourceNames[0]}`;
        } else if (sourceNames.length === 2) {
            sourcesText = ` from ${sourceNames[0]} and ${sourceNames[1]}`;
        } else if (sourceNames.length === 3) {
            sourcesText = ` from ${sourceNames[0]}, ${sourceNames[1]}, and ${sourceNames[2]}`;
        }
        
        // Add "and more" if there are additional sources
        if (hasMoreSources) {
            sourcesText += ' and more';
        }
    }
    
    // Generate context based on category specificity and relevance
    if (relevanceLevel === 'exact_product' && itemName && !isGenericTerm) {
        reviewContext = `Based on ${totalReviews} reviews${sourcesText} for ${itemName}`;
    } else if (relevanceLevel === 'product_type' && productType) {
        const categoryText = getCategoryDisplayText(category, productType);
        reviewContext = `Based on ${totalReviews} ${brandName} ${categoryText} reviews${sourcesText}`;
    } else if (relevanceLevel === 'category' && category && category !== 'unknown') {
        const categoryText = getCategoryDisplayText(category);
        reviewContext = `Based on ${totalReviews} ${brandName} ${categoryText} reviews${sourcesText}`;
    } else if (isItemSpecific && itemName && !isGenericTerm) {
        reviewContext = `Based on ${totalReviews} reviews${sourcesText} for ${itemName}`;
    } else if (category && category !== 'unknown') {
        const categoryText = getCategoryDisplayText(category);
        reviewContext = `Based on ${totalReviews} ${brandName} ${categoryText} reviews${sourcesText}`;
    } else {
        reviewContext = `Based on ${totalReviews} ${brandName} reviews${sourcesText}`;
    }
    
    let contentHTML = `
        <div class="pointfour-results">
            <h3>${brandName}</h3>
            <div class="pointfour-meta">
                <span class="pointfour-review-count">${reviewContext}</span>
                ${isMarketplace ? '<span class="pointfour-marketplace-tag">Multi-brand site</span>' : ''}
            </div>
    `;
    
    // Main recommendation - only show if we have sections with evidence
    const hasMeaningfulData = Object.values(sections).some(section => 
        section && section.evidence && section.evidence.length > 0
    );
    
    console.log('🔍 [PointFour] Main recommendation check:', {
        hasRecommendation: !!data.recommendation,
        hasMeaningfulData,
        recommendation: data.recommendation?.substring(0, 100),
        sectionsWithEvidence: Object.values(sections).map(section => ({
            hasEvidence: !!(section && section.evidence && section.evidence.length > 0),
            evidenceCount: section?.evidence?.length || 0
        }))
    });
    
    if (data.recommendation) {
        const cleanedRecommendation = cleanRecommendationText(data.recommendation);
        console.log('🔍 [PointFour] Showing main recommendation:', cleanedRecommendation.substring(0, 100));
        contentHTML += `
            <div class="pointfour-fit-info">
                <div class="pointfour-main-rec">${cleanedRecommendation}</div>
            </div>
        `;
    } else {
        console.log('🔍 [PointFour] Not showing main recommendation - missing recommendation');
    }
    
    // Quality insights
    if (qualityInsight) {
        contentHTML += `
            <div class="pointfour-quality-insight">
                <strong>Quality:</strong> ${qualityInsight.recommendation}
            </div>
        `;
    }
    
    // Fit sections with real quotes
    if (Object.keys(sections).length > 0) {
        console.log('🔍 [PointFour] Rendering sections:', {
            sectionsCount: Object.keys(sections).length,
            sectionKeys: Object.keys(sections),
            sections: sections
        });
        
        contentHTML += '<div class="pointfour-sections">';
        
        // Prioritize sections: fit > quality > washCare
        const sectionPriority = ['fit', 'quality', 'washCare'];
        const sortedSections = sectionPriority.filter(key => sections[key]);
        
        console.log('🔍 [PointFour] Sorted sections to render:', sortedSections);
        
        for (const sectionKey of sortedSections.slice(0, 3)) {
            const section = sections[sectionKey];
            console.log(`🔍 [PointFour] Processing section ${sectionKey}:`, {
                hasSection: !!section,
                hasRecommendation: !!(section && section.recommendation),
                recommendation: section?.recommendation?.substring(0, 100),
                isUseful: section && section.recommendation ? isUsefulRecommendation(section.recommendation) : false,
                hasEvidence: !!(section && section.evidence && section.evidence.length > 0),
                evidenceCount: section?.evidence?.length || 0
            });
            
            if (section && section.recommendation) {
                const renderedSection = renderSectionWithQuotes(sectionKey, section);
                console.log(`🔍 [PointFour] Rendered section ${sectionKey}:`, renderedSection.substring(0, 200) + '...');
                contentHTML += renderedSection;
            } else {
                console.log(`🔍 [PointFour] Skipping section ${sectionKey} - missing data`);
            }
        }
        
        contentHTML += '</div>';
    } else {
        console.log('🔍 [PointFour] No sections to render - sections object is empty');
    }
    
    // Enhanced Size Chart - show if available
    if (data.enhancedSizeChart && data.enhancedSizeChart.measurements && Object.keys(data.enhancedSizeChart.measurements).length > 0) {
        contentHTML += renderEnhancedSizeChart(data.enhancedSizeChart);
    }
    
    // Always show tailored recommendations section (even without size chart)
    contentHTML += `
        <div class="pointfour-tailored-recommendations">
            <button class="pointfour-tailored-btn" onclick="window.pointFourShowSizeInput()">
                Find my size
            </button>
        </div>
    `;
    
    // Materials and Care - only show on product pages
    if (isProductPage()) {
        const materials = extractMaterialsFromPage();
        if (materials && (materials.composition.length > 0 || materials.careInstructions.length > 0)) {
            contentHTML += renderMaterialsAndCare(materials);
        }
    }
    
    // Reviews page button - show if we have reviews OR analysis data
    if (totalReviews > 0 || sections && Object.keys(sections).length > 0) {
        // Reuse urlExtraction already declared above
        
        // Build URL parameters for the full reviews page
        const params = new URLSearchParams({
            brand: brandName,
            from: 'extension'
        });
        
        // Add extracted data if available
        if (urlExtraction) {
            if (urlExtraction.itemName) params.set('item', urlExtraction.itemName);
            if (urlExtraction.category) params.set('category', urlExtraction.category);
            if (urlExtraction.productImage) params.set('image', urlExtraction.productImage);
        }
        
        // Add page context
        params.set('url', window.location.href);
        params.set('pageTitle', document.title);
        
        const analyzeUrl = `https://www.pointfour.in/extension-reviews?${params.toString()}`;
        
        contentHTML += `
            <div class="pointfour-search-info">
                <a href="${analyzeUrl}" 
                   target="_blank" 
                   rel="noopener noreferrer" 
                   class="pointfour-reviews-button">
                    <span>${totalReviews > 0 ? `Found ${totalReviews} review${totalReviews === 1 ? '' : 's'}` : 'View Full Analysis'}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M7 17L17 7"></path>
                        <path d="M7 7h10v10"></path>
                    </svg>
                </a>
            </div>
        `;
    }

    contentHTML += '</div>';
    contentDiv.innerHTML = contentHTML;
    
}

// ========================================
// SECTION RENDERING WITH QUOTES
// ========================================

function renderSectionWithQuotes(sectionKey, section) {
    const sectionTitle = getSectionTitle(sectionKey);
    const sectionIcon = getSectionIcon(sectionKey);
    
    // Extract the main insight from recommendation (before the quotes)
    let mainInsight = section.recommendation;
    if (mainInsight.length > 100) {
        // Truncate very long recommendations
        mainInsight = mainInsight.substring(0, 100) + '...';
    }
    
    let html = `
        <div class="pointfour-section">
            <div class="pointfour-section-header">
                <span>${sectionTitle}</span>
            </div>
            <div class="pointfour-section-content">
                <p class="pointfour-main-insight">${mainInsight}</p>
    `;
    
    // Add real user quotes if evidence exists - filter for section relevance
    if (section.evidence && section.evidence.length > 0) {
        const relevantQuotes = filterQuotesForSection(section.evidence, sectionKey);
        
        if (relevantQuotes.length > 0) {
            html += '<div class="pointfour-quotes-container">';
            for (const quote of relevantQuotes.slice(0, 3)) { // Show max 3 relevant quotes
                if (quote && quote.trim().length > 10) {
                    const cleanedQuote = cleanQuoteText(quote);
                    html += `<div class="pointfour-quote">"${cleanedQuote}"</div>`;
                }
            }
            html += '</div>';
        }
    }
    
    // Show confidence warning only if confidence is low
    if (section.confidence === 'low') {
        html += '<div class="pointfour-source">Limited data available - based on fewer reviews</div>';
    }
    
    html += `
            </div>
        </div>
    `;
    
    return html;
}

function filterQuotesForSection(quotes, sectionKey) {
    // Define keywords for each section type
    const sectionKeywords = {
        fit: [
            // Sizing terms
            'runs small', 'runs large', 'run small', 'run large', 'runs big', 'run big',
            'true to size', 'tts', 'size up', 'size down', 'sized up', 'sized down',
            'fits small', 'fits large', 'fits big', 'fits tight', 'fits loose',
            'tight', 'loose', 'snug', 'roomy', 'baggy', 'fitted', 'oversized',
            'smaller than expected', 'bigger than expected', 'larger than expected',
            'size', 'sizing', 'fit', 'fits', 'fitting',
            // Specific size references
            'went up a size', 'went down a size', 'order a size up', 'order a size down',
            'usual size', 'normal size', 'typical size', 'my size'
        ],
        
        quality: [
            // Quality terms
            'quality', 'well made', 'poorly made', 'cheap', 'expensive', 'worth it',
            'durable', 'lasted', 'lasts', 'falling apart', 'falls apart', 
            'construction', 'stitching', 'seams', 'pilling', 'pills',
            'fades', 'faded', 'color', 'fabric quality', 'material quality',
            'feels cheap', 'feels expensive', 'feels good', 'feels bad',
            'impressive', 'disappointed', 'disappointed with', 'love the quality',
            'hate the quality', 'amazing quality', 'terrible quality',
            'overpriced', 'worth the money', 'value for money'
        ],
        
        washCare: [
            // Care and washing terms
            'wash', 'washed', 'washing', 'shrink', 'shrinks', 'shrank', 'shrinkage',
            'dry clean', 'machine wash', 'hand wash', 'cold wash', 'hot wash',
            'dryer', 'tumble dry', 'air dry', 'hang dry', 'lay flat',
            'iron', 'ironing', 'wrinkle', 'wrinkles', 'care instructions',
            'bleach', 'detergent', 'fabric softener', 'delicate cycle',
            'after washing', 'holds up', 'maintains shape', 'lost shape'
        ]
    };
    
    const keywords = sectionKeywords[sectionKey] || [];
    if (keywords.length === 0) return quotes; // Return all if no keywords defined
    
    // Score each quote based on relevance to the section
    const scoredQuotes = quotes.map(quote => {
        const lowerQuote = quote.toLowerCase();
        let score = 0;
        
        // Count keyword matches
        for (const keyword of keywords) {
            if (lowerQuote.includes(keyword.toLowerCase())) {
                score += 1;
                // Give extra weight to exact phrase matches
                if (lowerQuote.includes(keyword.toLowerCase())) {
                    score += 0.5;
                }
            }
        }
        
        return { quote, score };
    });
    
    // Filter out quotes with no relevance and sort by relevance score
    return scoredQuotes
        .filter(item => item.score > 0) // Only keep quotes with at least one keyword match
        .sort((a, b) => b.score - a.score) // Sort by relevance (highest first)
        .map(item => item.quote); // Return just the quotes
}

function cleanQuoteText(quote) {
    // Clean up quote text for display
    return quote
        .replace(/^\s*["']+|["']+\s*$/g, '') // Remove surrounding quotes
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim()
        .substring(0, 120); // Limit length
}

function isProductPage() {
    // Detect if we're on a specific product page vs a listing/category page
    const url = window.location.pathname.toLowerCase();
    const hostname = window.location.hostname.replace('www.', '').toLowerCase();
    
    // Common product page patterns
    const productPatterns = [
        /\/products?\//,  // /product/ or /products/
        /\/item\//,       // /item/
        /\/p\//,          // /p/
        /-p\d+\.html/,    // Zara style: item-name-p123.html
        /\/[^\/]+\.html/, // General .html product pages
    ];
    
    // Check URL patterns
    for (const pattern of productPatterns) {
        if (pattern.test(url)) return true;
    }
    
    // Site-specific detection
    const siteDetection = {
        'reformation.com': () => url.includes('/products/'),
        'roheframes.com': () => url.includes('/products/'),
        'everlane.com': () => url.includes('/products/'),
        'zara.com': () => /-p\d+\.html/.test(url),
    };
    
    if (siteDetection[hostname]) {
        return siteDetection[hostname]();
    }
    
    // Fallback: check for product-specific elements on page
    const productElements = [
        '.product-details',
        '.product-info', 
        '.product-form',
        '[class*="add-to-cart"]',
        '[class*="size-selector"]',
        '.product-images'
    ];
    
    return productElements.some(selector => document.querySelector(selector));
}

function renderMaterialsAndCare(materials) {
    let html = '';
    
    // Materials section
    if (materials.composition && materials.composition.length > 0) {
        // Remove duplicates and clean up
        const uniqueComposition = [...new Set(materials.composition)]
            .map(comp => comp.trim())
            .filter(comp => comp.length > 0);
            
        if (uniqueComposition.length > 0) {
            html += `
                <div class="pointfour-section">
                    <div class="pointfour-section-header">
                        <span>Materials</span>
                    </div>
                    <div class="pointfour-section-content">
                        <ul class="pointfour-bullet-list pointfour-materials-list">
            `;
            
            for (const comp of uniqueComposition.slice(0, 5)) { // Max 5 items
                html += `<li>${comp}</li>`;
            }
            
            html += `
                        </ul>
                    </div>
                </div>
            `;
        }
    }
    
    // Care instructions section
    if (materials.careInstructions && materials.careInstructions.length > 0) {
        const uniqueCareInstructions = [...new Set(materials.careInstructions)]
            .map(care => care.trim())
            .filter(care => care.length > 0);
            
        if (uniqueCareInstructions.length > 0) {
            html += `
                <div class="pointfour-section">
                    <div class="pointfour-section-header">
                        <span>Care</span>
                    </div>
                    <div class="pointfour-section-content">
                        <ul class="pointfour-bullet-list pointfour-care-list">
            `;
            
            for (const care of uniqueCareInstructions.slice(0, 4)) { // Max 4 items
                html += `<li>${care}</li>`;
            }
            
            html += `
                        </ul>
                    </div>
                </div>
            `;
        }
    }
    
    return html;
}

// ========================================
// HELPER FUNCTIONS
// ========================================

function isUsefulRecommendation(recommendation) {
    if (!recommendation || recommendation.length < 15) return false;
    
    // Filter out generic/unhelpful responses
    const genericPhrases = [
        'no specific washing or care instructions',
        'not applicable',
        'not explicitly mentioned',
        'information is not provided',
        'information not explicitly mentioned',
        'no specific advice',
        'general care should be followed'
    ];
    
    const lowerRec = recommendation.toLowerCase();
    const isGeneric = genericPhrases.some(phrase => lowerRec.includes(phrase));
    
    return !isGeneric;
}

function cleanRecommendationText(text) {
    // Remove redundant phrases and clean up the recommendation
    return text
        .replace(/Based on \d+ reviews?,?\s*/gi, '')
        .replace(/According to reviews?,?\s*/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function getSectionTitle(sectionKey) {
    const titles = {
        fit: 'Fit',
        quality: 'Quality',
        fabric: 'Fabric',
        washCare: 'Care'
    };
    return titles[sectionKey] || sectionKey;
}

function getSectionIcon(sectionKey) {
    const icons = {
        fit: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke-width="2"/></svg>',
        quality: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" stroke-width="2"/></svg>',
        fabric: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2L2 7v10l10 5 10-5V7l-10-5z" stroke-width="2"/></svg>',
        washCare: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="3" stroke-width="2"/><path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" stroke-width="2"/></svg>'
    };
    return icons[sectionKey] || '';
}

function getCategoryDisplayText(category, productType = null) {
    // Map category and product type to user-friendly display text
    const categoryMapping = {
        shoes: productType ? `${productType}` : 'shoe',
        bags: productType ? `${productType}` : 'bag', 
        clothing: productType ? `${productType}` : 'clothing',
        accessories: productType ? `${productType}` : 'accessory'
    };
    
    const displayText = categoryMapping[category];
    if (displayText) {
        // Ensure it's in singular form for better grammar
        return displayText.endsWith('s') && displayText !== 'dress' ? displayText : displayText;
    }
    
    return category || 'product';
}

function renderEnhancedSizeChart(sizeChart) {
    const { brand, productType, measurements, sizeSystem, confidence, sizingAdvice, modelInfo } = sizeChart;
    
    // Create size chart table
    const sizes = Object.keys(measurements).slice(0, 6); // Limit to first 6 sizes
    const measurementKeys = ['waist', 'hips', 'bust', 'chest', 'length', 'inseam'];
    
    let tableHTML = '';
    if (sizes.length > 0) {
        // Get available measurements from the first size
        const firstSize = measurements[sizes[0]];
        const availableMeasurements = measurementKeys.filter(key => firstSize[key] !== undefined);
        
        if (availableMeasurements.length > 0) {
            tableHTML = `
                <div class="pointfour-size-chart">
                    <h4>📏 Size Chart (${sizeSystem})</h4>
                    <div class="pointfour-size-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Size</th>
                                    ${availableMeasurements.map(key => `<th>${key.charAt(0).toUpperCase() + key.slice(1)}</th>`).join('')}
                                </tr>
                            </thead>
                            <tbody>
                                ${sizes.map(size => `
                                    <tr>
                                        <td><strong>${size}</strong></td>
                                        ${availableMeasurements.map(key => `<td>${measurements[size][key] || '-'}</td>`).join('')}
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        }
    }
    
    // Add sizing advice if available
    let adviceHTML = '';
    if (sizingAdvice && sizingAdvice.length > 0) {
        adviceHTML = `
            <div class="pointfour-sizing-advice">
                <h4>💡 Sizing Tips</h4>
                <ul>
                    ${sizingAdvice.slice(0, 3).map(advice => `<li>${advice}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    // Add model info if available
    let modelHTML = '';
    if (modelInfo && (modelInfo.height || modelInfo.size)) {
        modelHTML = `
            <div class="pointfour-model-info">
                <small>Model info: ${modelInfo.height ? `Height: ${modelInfo.height}` : ''}${modelInfo.height && modelInfo.size ? ', ' : ''}${modelInfo.size ? `Wearing size: ${modelInfo.size}` : ''}</small>
            </div>
        `;
    }
    
    return `
        <div class="pointfour-enhanced-size-chart">
            ${tableHTML}
            ${adviceHTML}
            ${modelHTML}
        </div>
    `;
}

// ========================================
// TAILORED RECOMMENDATIONS - SIZE INPUT MODAL
// ========================================

function showSizeInputModal() {
    console.log('[PointFour] Showing size input in widget...');
    
    // Get the current size chart data
    const currentData = getState('currentData');
    const sizeChart = currentData?.enhancedSizeChart;
    
    // Find the tailored recommendations section
    const tailoredSection = document.querySelector('.pointfour-tailored-recommendations');
    if (!tailoredSection) {
        console.log('[PointFour] Tailored recommendations section not found');
        return;
    }
    
    // Create size input form
    const sizeOptions = sizeChart && sizeChart.measurements ? 
        Object.keys(sizeChart.measurements).map(size => 
            `<option value="${size}">${size.toUpperCase()}</option>`
        ).join('') : 
        '<option value="xs">XS</option><option value="s">S</option><option value="m">M</option><option value="l">L</option><option value="xl">XL</option>';
    
    tailoredSection.innerHTML = `
        <div class="pointfour-size-input-form">
            <h4>Get Tailored Recommendations</h4>
            <p class="pointfour-form-description">Share your size for personalized fit advice</p>
            <form id="pointfour-size-form" class="pointfour-size-form">
                <div class="pointfour-form-group">
                    <label for="pointfour-size-select">Your Size</label>
                    <select id="pointfour-size-select" name="size">
                        <option value="">Select your size</option>
                        ${sizeOptions}
                    </select>
                </div>
                <div class="pointfour-form-group">
                    <label for="pointfour-measurements">Measurements (optional)</label>
                    <div class="pointfour-measurements-grid">
                        <input type="number" id="pointfour-bust" placeholder="Bust (cm)" min="0" max="200">
                        <input type="number" id="pointfour-waist" placeholder="Waist (cm)" min="0" max="200">
                        <input type="number" id="pointfour-hips" placeholder="Hips (cm)" min="0" max="200">
                    </div>
                </div>
                <div class="pointfour-form-actions">
                    <button type="button" class="pointfour-btn-secondary" onclick="window.pointFourResetSizeInput()">
                        Cancel
                    </button>
                    <button type="submit" class="pointfour-btn-primary">
                        Get Recommendations
                    </button>
                </div>
            </form>
        </div>
    `;
    
    // Handle form submission
    const form = document.getElementById('pointfour-size-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        handleSizeFormSubmission(form, sizeChart);
    });
    
    // Make reset function globally available
    window.pointFourResetSizeInput = () => {
        tailoredSection.innerHTML = `
            <button class="pointfour-tailored-btn" onclick="window.pointFourShowSizeInput()">
                Find my size
            </button>
        `;
    };
    
    // Make the size input function globally available
    window.pointFourShowSizeInput = showSizeInputModal;
}

function handleSizeFormSubmission(form, sizeChart) {
    const formData = new FormData(form);
    const selectedSize = formData.get('size');
    const bust = document.getElementById('pointfour-bust').value;
    const waist = document.getElementById('pointfour-waist').value;
    const hips = document.getElementById('pointfour-hips').value;
    
    console.log('[PointFour] Size form submitted:', { selectedSize, bust, waist, hips });
    
    // Generate tailored recommendations
    const recommendations = generateTailoredRecommendations(selectedSize, { bust, waist, hips }, sizeChart);
    
    // Show recommendations
    showTailoredRecommendations(recommendations, sizeChart);
    
    // Close the modal
    window.pointFourCloseSizeInput();
}

function generateTailoredRecommendations(selectedSize, measurements, sizeChart) {
    console.log('[PointFour] Generating tailored recommendations:', {
        selectedSize,
        measurements,
        hasSizeChart: !!sizeChart,
        sizeChartKeys: sizeChart ? Object.keys(sizeChart.measurements || {}) : []
    });
    
    const recommendations = {
        sizeMatch: null,
        fitAdvice: [],
        confidence: 'low',
        alternativeSizes: [],
        fitAnalysis: null,
        reviewInsights: []
    };
    
    if (sizeChart && sizeChart.measurements && Object.keys(sizeChart.measurements).length > 0) {
        // Use sophisticated size matching algorithm
        const bestMatch = findBestSizeMatch(selectedSize, measurements, sizeChart.measurements);
        
        recommendations.sizeMatch = bestMatch;
        recommendations.confidence = bestMatch.confidence;
        recommendations.fitAdvice = generateSizeAdvice(bestMatch, measurements, sizeChart);
        recommendations.alternativeSizes = findAlternativeSizes(bestMatch, sizeChart.measurements);
        recommendations.fitAnalysis = analyzeFitPatterns(bestMatch, sizeChart);
        
        // TODO: Add review insights when we implement review filtering
        // recommendations.reviewInsights = findSimilarReviewers(measurements, sizeChart);
        
    } else {
        recommendations.fitAdvice = [
            'No size chart available for this item.',
            'Consider trying your usual size or checking the brand\'s general sizing guide.',
            'Look for reviews mentioning sizing to get additional guidance.'
        ];
    }
    
    return recommendations;
}

// ========================================
// SOPHISTICATED SIZE MATCHING ALGORITHM
// ========================================

/**
 * Find the best size match using measurements and size chart data
 */
function findBestSizeMatch(selectedSize, measurements, sizeChartMeasurements) {
    console.log('[PointFour] Finding best size match:', {
        selectedSize,
        measurements,
        availableSizes: Object.keys(sizeChartMeasurements)
    });
    
    const availableSizes = Object.keys(sizeChartMeasurements);
    let bestMatch = {
        size: selectedSize || 'unknown',
        confidence: 'low',
        score: 0,
        measurements: null,
        fitNotes: []
    };
    
    // If user provided measurements, find the closest match
    if (measurements.bust || measurements.waist || measurements.hips) {
        let bestScore = Infinity;
        let bestSize = selectedSize;
        
        for (const size of availableSizes) {
            const sizeData = sizeChartMeasurements[size];
            if (!sizeData || typeof sizeData !== 'object') continue;
            
            const score = calculateSizeMatchScore(measurements, sizeData);
            console.log(`[PointFour] Size ${size} score:`, score);
            
            if (score < bestScore) {
                bestScore = score;
                bestSize = size;
                bestMatch = {
                    size: size,
                    confidence: score < 2 ? 'high' : score < 5 ? 'medium' : 'low',
                    score: score,
                    measurements: sizeData,
                    fitNotes: generateFitNotes(measurements, sizeData, score)
                };
            }
        }
    } else if (selectedSize && sizeChartMeasurements[selectedSize]) {
        // If no measurements provided, use selected size
        bestMatch = {
            size: selectedSize,
            confidence: 'medium',
            score: 0,
            measurements: sizeChartMeasurements[selectedSize],
            fitNotes: ['Based on your selected size']
        };
    }
    
    return bestMatch;
}

/**
 * Calculate how well user measurements match a size's measurements
 */
function calculateSizeMatchScore(userMeasurements, sizeMeasurements) {
    let totalScore = 0;
    let measurementCount = 0;
    
    // Check each measurement type
    const measurementTypes = ['bust', 'waist', 'hip', 'chest'];
    
    for (const type of measurementTypes) {
        const userValue = parseFloat(userMeasurements[type]);
        const sizeValue = parseFloat(sizeMeasurements[type]);
        
        if (!isNaN(userValue) && !isNaN(sizeValue)) {
            const difference = Math.abs(userValue - sizeValue);
            // Score based on difference (lower is better)
            totalScore += difference;
            measurementCount++;
        }
    }
    
    // Return average difference, or high score if no measurements match
    return measurementCount > 0 ? totalScore / measurementCount : 10;
}

/**
 * Generate fit notes based on measurement comparison
 */
function generateFitNotes(userMeasurements, sizeMeasurements, score) {
    const notes = [];
    
    if (score < 2) {
        notes.push('Excellent fit match!');
    } else if (score < 5) {
        notes.push('Good fit match with minor adjustments needed');
    } else {
        notes.push('Consider trying a different size');
    }
    
    // Add specific measurement notes
    const measurementTypes = ['bust', 'waist', 'hip', 'chest'];
    
    for (const type of measurementTypes) {
        const userValue = parseFloat(userMeasurements[type]);
        const sizeValue = parseFloat(sizeMeasurements[type]);
        
        if (!isNaN(userValue) && !isNaN(sizeValue)) {
            const difference = userValue - sizeValue;
            if (Math.abs(difference) > 2) {
                if (difference > 0) {
                    notes.push(`${type} is ${difference.toFixed(1)}cm larger than size chart`);
                } else {
                    notes.push(`${type} is ${Math.abs(difference).toFixed(1)}cm smaller than size chart`);
                }
            }
        }
    }
    
    return notes;
}

/**
 * Find alternative sizes based on the best match
 */
function findAlternativeSizes(bestMatch, sizeChartMeasurements) {
    const alternatives = [];
    const currentSize = bestMatch.size;
    
    // Get size order for finding adjacent sizes
    const sizeOrder = getSizeOrder(Object.keys(sizeChartMeasurements));
    const currentIndex = sizeOrder.indexOf(currentSize);
    
    if (currentIndex !== -1) {
        // Add adjacent sizes
        if (currentIndex > 0) {
            const smallerSize = sizeOrder[currentIndex - 1];
            if (sizeChartMeasurements[smallerSize]) {
                alternatives.push({
                    size: smallerSize,
                    reason: 'Try one size smaller if you prefer a tighter fit',
                    measurements: sizeChartMeasurements[smallerSize]
                });
            }
        }
        
        if (currentIndex < sizeOrder.length - 1) {
            const largerSize = sizeOrder[currentIndex + 1];
            if (sizeChartMeasurements[largerSize]) {
                alternatives.push({
                    size: largerSize,
                    reason: 'Try one size larger if you prefer a looser fit',
                    measurements: sizeChartMeasurements[largerSize]
                });
            }
        }
    }
    
    return alternatives;
}

/**
 * Get size order for finding adjacent sizes
 */
function getSizeOrder(sizes) {
    const sizeOrder = ['xxs', 'xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl'];
    const numericSizes = sizes.filter(size => !isNaN(parseInt(size))).sort((a, b) => parseInt(a) - parseInt(b));
    const alphaSizes = sizes.filter(size => isNaN(parseInt(size))).sort((a, b) => {
        const aIndex = sizeOrder.indexOf(a.toLowerCase());
        const bIndex = sizeOrder.indexOf(b.toLowerCase());
        return aIndex - bIndex;
    });
    
    return [...alphaSizes, ...numericSizes];
}

/**
 * Generate size advice based on the match and size chart
 */
function generateSizeAdvice(bestMatch, measurements, sizeChart) {
    const advice = [];
    
    // Add fit notes
    advice.push(...bestMatch.fitNotes);
    
    // Add confidence-based advice
    if (bestMatch.confidence === 'high') {
        advice.push('This size should fit you well based on the measurements');
    } else if (bestMatch.confidence === 'medium') {
        advice.push('This size is close to your measurements - consider your fit preference');
    } else {
        advice.push('Consider trying this size but be prepared to exchange if needed');
    }
    
    // Add size chart specific advice
    if (sizeChart.sizingAdvice && sizeChart.sizingAdvice.length > 0) {
        advice.push(...sizeChart.sizingAdvice.slice(0, 2));
    }
    
    // Add brand-specific advice based on confidence
    if (sizeChart.confidence === 'high') {
        advice.push('Size chart data is reliable for this brand');
    } else if (sizeChart.confidence === 'medium') {
        advice.push('Size chart data is generally accurate for this brand');
    }
    
    return advice;
}

/**
 * Analyze fit patterns for future review integration
 */
function analyzeFitPatterns(bestMatch, sizeChart) {
    return {
        recommendedSize: bestMatch.size,
        confidence: bestMatch.confidence,
        measurementAccuracy: bestMatch.score,
        // TODO: Add review-based fit patterns when we implement review filtering
        reviewFitPatterns: null,
        commonIssues: []
    };
}

function showTailoredRecommendations(recommendations, sizeChart) {
    console.log('[PointFour] Showing tailored recommendations:', recommendations);
    
    // Create recommendations display
    const recommendationsHTML = `
        <div class="pointfour-tailored-results">
            <h4>Your Personalized Size Recommendations</h4>
            
            ${recommendations.sizeMatch ? `
                <div class="pointfour-size-match">
                    <div class="pointfour-recommended-size">
                        <strong>Recommended Size:</strong> ${recommendations.sizeMatch.size.toUpperCase()}
                        <span class="pointfour-confidence-badge confidence-${recommendations.sizeMatch.confidence}">
                            ${recommendations.sizeMatch.confidence} confidence
                        </span>
                    </div>
                    ${recommendations.sizeMatch.measurements ? `
                        <div class="pointfour-size-measurements">
                            <small>Size chart measurements: 
                                ${Object.entries(recommendations.sizeMatch.measurements)
                                    .filter(([key, value]) => typeof value === 'number' && !isNaN(value))
                                    .map(([key, value]) => `${key}: ${value}cm`)
                                    .join(', ')}
                            </small>
                        </div>
                    ` : ''}
                </div>
            ` : ''}
            
            ${recommendations.fitAdvice.length > 0 ? `
                <div class="pointfour-fit-advice">
                    <strong>Fit Analysis:</strong>
                    <ul>
                        ${recommendations.fitAdvice.map(advice => `<li>${advice}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
            
            ${recommendations.alternativeSizes.length > 0 ? `
                <div class="pointfour-alternative-sizes">
                    <strong>Alternative Sizes:</strong>
                    <ul>
                        ${recommendations.alternativeSizes.map(alt => `
                            <li>
                                <strong>${alt.size.toUpperCase()}</strong> - ${alt.reason}
                                ${alt.measurements ? `
                                    <small>(${Object.entries(alt.measurements)
                                        .filter(([key, value]) => typeof value === 'number' && !isNaN(value))
                                        .map(([key, value]) => `${key}: ${value}cm`)
                                        .join(', ')})</small>
                                ` : ''}
                            </li>
                        `).join('')}
                    </ul>
                </div>
            ` : ''}
            
            <div class="pointfour-tailored-actions">
                <button class="pointfour-btn-secondary" onclick="window.pointFourResetSizeInput()">
                    Try Different Size
                </button>
            </div>
        </div>
    `;
    
    // Find the tailored recommendations section and replace it
    const tailoredSection = document.querySelector('.pointfour-tailored-recommendations');
    if (tailoredSection) {
        tailoredSection.innerHTML = recommendationsHTML;
    }
}

// ========================================
// PUBLIC API
// ========================================




// ========================================
// MAIN EXECUTION FLOW
// ========================================

(function() {
    'use strict';

    // Initialize API security measures
    initializeAPISecurity();

    async function initialize() {
        console.log('[PointFour] Bundled content script initializing...');
        
        // Check if we should run on this page
        if (!shouldRunOnThisPage()) {
            console.log('[PointFour] Page not suitable for analysis, skipping');
            return;
        }

        // Detect if this is a fashion site
        const fashionDetection = detectFashionSite();
        console.log('[PointFour] Fashion site detection:', fashionDetection);

        if (!fashionDetection.isFashionSite) {
            console.log('[PointFour] Not a fashion site, skipping analysis');
            return;
        }

        // Update state with detection results
        updateState({
            detectionScore: fashionDetection.score,
            isHighConfidence: fashionDetection.isHighConfidence
        });

        // Detect page type (product vs listing)
        const pageType = detectPageType();
        console.log('[PointFour] Page type detection:', pageType);

        // Extract comprehensive product data
        const productData = extractAllProductData();
        console.log('[PointFour] Product data extracted:', productData);
        
        // Store product data globally for other functions
        window.pointFourURLExtraction = productData;
        window.pointFourPageData = { pageType, fashionDetection };

        // Extract or detect brand
        let brandName = productData.brand || await detectBrandFromPage();
        
        if (!brandName) {
            console.log('[PointFour] No brand detected, cannot proceed');
            return;
        }

        // Clean the brand name
        brandName = cleanBrandName(brandName);
        console.log('[PointFour] Final brand name:', brandName);

        // Store current brand in state
        setState('currentBrand', brandName);

        // Check if this is a marketplace site
        const isMarketplace = isMarketplaceSite(brandName);
        console.log('[PointFour] Marketplace detection:', isMarketplace);

        // Create and show widget
        createWidget();
        showWidget();

        // Start brand analysis
        await fetchBrandAnalysis(brandName, productData);
    }

    async function detectBrandFromPage() {
        console.log('[PointFour] Detecting brand from page...');
        
        // Try content-based brand extraction first
        let brand = extractBrandFromContent();
        
        if (brand) {
            console.log('[PointFour] Brand found via content extraction:', brand);
            return brand;
        }

        // Fallback to domain-based extraction
        brand = extractBrandFromDomain();
        
        if (brand) {
            console.log('[PointFour] Brand found via domain extraction:', brand);
            return brand;
        }

        console.log('[PointFour] No brand could be detected from page');
        return null;
    }

    async function fetchBrandAnalysis(brand, extractedData = null) {
        if (!brand || getState('isProcessing')) return;

        // Additional brand validation - don't analyze non-fashion brands
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
        setState('isProcessing', true);

        // Show loading state in widget
        const widgetContainer = getState('widgetContainer');
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
            // Build API parameters
            const params = new URLSearchParams({
                brand: brand,
                searchType: 'all',
                enableExternalSearch: 'true'
            });

            // Add extracted data if available
            if (extractedData) {
                if (extractedData.itemName) {
                    params.set('item', extractedData.itemName);
                }
                if (extractedData.category) {
                    params.set('category', extractedData.category);
                }
                if (extractedData.productImage) {
                    params.set('productImage', extractedData.productImage);
                }
            }

            // Add page context
            params.set('url', window.location.href);
            params.set('pageTitle', document.title);

            // Make API call
            const apiUrl = `https://www.pointfour.in/api/extension/search-reviews?${params.toString()}`;
            console.log('[PointFour] API Request:', apiUrl);

            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('[PointFour] API Response:', data);

            // Update widget with results
            updateWidgetContent(data);

        } catch (error) {
            console.error('[PointFour] API request failed:', error);
            updateWidgetContent({
                error: 'Unable to load fit analysis. Please try refreshing the page.',
                brandName: brand
            });
        } finally {
            setState('isProcessing', false);
        }
    }

    // ========================================
    // URL CHANGE DETECTION
    // ========================================

    let currentUrl = window.location.href;
    let urlCheckInterval;

    function detectURLChanges() {
        const newUrl = window.location.href;
        if (newUrl !== currentUrl) {
            console.log('[PointFour] URL changed:', currentUrl, '->', newUrl);
            currentUrl = newUrl;
            
            // Reset state and re-initialize
            const currentContainer = getState('widgetContainer');
            if (currentContainer) {
                currentContainer.remove();
            }
            
            // Reset state
            updateState({
                widgetInjected: false,
                widgetContainer: null,
                currentBrand: null,
                isProcessing: false,
                detectionScore: 0
            });

            // Clear any existing timeouts
            const initTimeout = getState('initTimeout');
            if (initTimeout) {
                clearTimeout(initTimeout);
            }

            // Re-initialize after a short delay
            const newTimeout = setTimeout(initialize, CONFIG.INIT_DELAY);
            setState('initTimeout', newTimeout);
        }
    }

    // ========================================
    // STARTUP LOGIC
    // ========================================

    // Wait for page to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(initialize, CONFIG.INIT_DELAY);
        });
    } else {
        setTimeout(initialize, CONFIG.INIT_DELAY);
    }

    // Set up URL change detection
    urlCheckInterval = setInterval(detectURLChanges, 1000);

    // Also use MutationObserver for SPA navigation
    const urlObserver = new MutationObserver(() => {
        detectURLChanges();
    });

    if (document.body) {
        urlObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        if (urlCheckInterval) {
            clearInterval(urlCheckInterval);
        }
        if (urlObserver) {
            urlObserver.disconnect();
        }
        
        const initTimeout = getState('initTimeout');
        if (initTimeout) {
            clearTimeout(initTimeout);
        }
    });

    console.log('[PointFour] Bundled content script loaded successfully');

})();
