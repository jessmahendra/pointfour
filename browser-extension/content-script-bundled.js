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
        '.expandable-content'
    ];
    
    const materialPatterns = [
        /(\d+%\s+(?:organic\s+)?(?:merino\s+)?wool)/gi,
        /(\d+%\s+(?:organic\s+)?cotton)/gi, 
        /(\d+%\s+silk)/gi,
        /(\d+%\s+linen)/gi,
        /(\d+%\s+cashmere)/gi,
        /(\d+%\s+polyester)/gi,
        /(\d+%\s+viscose)/gi,
        /(\d+%\s+lyocell)/gi,
        /(\d+%\s+tencel)/gi,
        /(\d+%\s+modal)/gi,
        /(\d+%\s+spandex)/gi,
        /(\d+%\s+elastane)/gi,
        /(100%\s+\w+)/gi,
        /(?:composition|material|fabric):\s*([^\.]+)/gi
    ];
    
    const carePatterns = [
        /machine wash/gi,
        /hand wash/gi,
        /dry clean/gi,
        /do not bleach/gi,
        /tumble dry/gi,
        /iron on low/gi,
        /lay flat to dry/gi,
        /wash separately/gi
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
    
    // Remove duplicates
    materials.composition = [...new Set(materials.composition)];
    materials.careInstructions = [...new Set(materials.careInstructions)];
    
    console.log('[PointFour] Extracted materials:', materials);
    
    return materials;
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
// PRODUCT CATEGORY DETECTION
// ========================================

function detectCategoryFromItemName(itemName = '') {
    const categoryMappings = {
        'jeans': ['jean', 'denim'],
        'dress': ['dress', 'midi', 'maxi', 'mini'],
        'top': ['top', 'blouse', 'shirt', 'tee', 't-shirt', 'tank', 'cami', 'bodysuit'],
        'outerwear': ['jacket', 'coat', 'blazer', 'cardigan', 'sweater', 'hoodie', 'vest'],
        'bottom': ['pant', 'trouser', 'short', 'skirt', 'legging'],
        'shoes': ['shoe', 'boot', 'sandal', 'sneaker', 'heel', 'flat', 'loafer'],
        'accessories': ['bag', 'purse', 'wallet', 'belt', 'scarf', 'hat', 'jewelry', 'necklace', 'earring', 'bracelet', 'ring']
    };
    
    const lowerItemName = itemName.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categoryMappings)) {
        if (keywords.some(keyword => lowerItemName.includes(keyword))) {
            return category;
        }
    }
    
    return 'clothing'; // Default category
}

// ========================================
// COMPREHENSIVE PRODUCT EXTRACTION
// ========================================

function extractAllProductData() {
    console.log('[PointFour] Starting comprehensive product data extraction...');
    
    const productData = {
        // URL-based extraction
        urlData: extractProductFromURL(),
        
        // Page content extraction
        itemName: extractItemNameFromPage(),
        productImage: extractProductImageFromPage(),
        
        // Detailed product information
        materials: extractMaterialsFromPage(),
        sizeGuide: extractSizeGuideFromPage(),
        
        // Derived information
        category: null,
        
        // Meta information
        extractedAt: new Date().toISOString(),
        url: window.location.href,
        hostname: window.location.hostname
    };
    
    // Determine category from item name
    if (productData.itemName) {
        productData.category = detectCategoryFromItemName(productData.itemName);
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
    
    console.log('[PointFour] Comprehensive product extraction completed:', productData);
    
    return productData;
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
                <p>Initializing analysis...</p>
            </div>
        </div>
    `;
    
    document.body.appendChild(widgetContainer);
    setState('widgetInjected', true);
    setState('widgetContainer', widgetContainer);
    
    // Add event listeners
    const closeBtn = widgetContainer.querySelector('.pointfour-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', hideWidget);
    }
    
    // Click outside to close
    document.addEventListener('click', function(e) {
        const currentContainer = getState('widgetContainer');
        if (currentContainer && !currentContainer.contains(e.target)) {
            hideWidget();
        }
    });
    
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
    
    const isCompleteData = (hasReviews && (hasStructuredAnalysis || hasRecommendation)) || isFinalResponse;
    
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
    
    let contentHTML = `
        <div class="pointfour-results">
            <h3>${brandName}</h3>
            <div class="pointfour-meta">
                <span class="pointfour-review-count">Based on ${totalReviews} reviews</span>
                ${isMarketplace ? '<span class="pointfour-marketplace-tag">Multi-brand site</span>' : ''}
            </div>
    `;
    
    // Main recommendation - only show if we have sections with evidence
    const hasMeaningfulData = Object.values(sections).some(section => 
        section && section.evidence && section.evidence.length > 0
    );
    
    if (data.recommendation && hasMeaningfulData) {
        const cleanedRecommendation = cleanRecommendationText(data.recommendation);
        contentHTML += `
            <div class="pointfour-fit-info">
                <div class="pointfour-main-rec">${cleanedRecommendation}</div>
            </div>
        `;
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
        contentHTML += '<div class="pointfour-sections">';
        
        // Prioritize sections: fit > quality > washCare
        const sectionPriority = ['fit', 'quality', 'washCare'];
        const sortedSections = sectionPriority.filter(key => sections[key]);
        
        for (const sectionKey of sortedSections.slice(0, 3)) {
            const section = sections[sectionKey];
            if (section && section.recommendation && isUsefulRecommendation(section.recommendation)) {
                contentHTML += renderSectionWithQuotes(sectionKey, section);
            }
        }
        
        contentHTML += '</div>';
    }
    
    // Materials and Care - only show on product pages
    if (isProductPage()) {
        const materials = extractMaterialsFromPage();
        if (materials && (materials.composition.length > 0 || materials.careInstructions.length > 0)) {
            contentHTML += renderMaterialsAndCare(materials);
        }
    }
    
    // Reviews page button - show if we have reviews OR analysis data
    if (totalReviews > 0 || sections && Object.keys(sections).length > 0) {
        const urlExtraction = window.pointFourURLExtraction || null;
        
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

    // Style button
    const urlExtraction = window.pointFourURLExtraction;
    if (urlExtraction && urlExtraction.itemName) {
        contentHTML += `
            <div class="pointfour-actions">
                <button class="pointfour-style-btn" data-brand="${brandName}" data-item="${urlExtraction.itemName}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M20 6L9 17l-5-5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Find Similar Styles
                </button>
            </div>
        `;
    }
    
    contentHTML += '</div>';
    contentDiv.innerHTML = contentHTML;
    
    // Add style button event listener
    const styleBtn = contentDiv.querySelector('.pointfour-style-btn');
    if (styleBtn) {
        styleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const brand = styleBtn.dataset.brand;
            const item = styleBtn.dataset.item;
            handleStyleButtonClick(brand, data);
        });
    }
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
                ${sectionIcon}
                <span>${sectionTitle}</span>
            </div>
            <div class="pointfour-section-content">
                <p class="pointfour-main-insight">${mainInsight}</p>
    `;
    
    // Add real user quotes if evidence exists - filter for section relevance
    if (section.evidence && section.evidence.length > 0) {
        const relevantQuotes = filterQuotesForSection(section.evidence, sectionKey);
        
        if (relevantQuotes.length > 0) {
            html += '<ul class="pointfour-bullet-list">';
            for (const quote of relevantQuotes.slice(0, 3)) { // Show max 3 relevant quotes
                if (quote && quote.trim().length > 10) {
                    const cleanedQuote = cleanQuoteText(quote);
                    html += `<li class="pointfour-quote">"${cleanedQuote}"</li>`;
                }
            }
            html += '</ul>';
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
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M12 2L2 7v10l10 5 10-5V7l-10-5z" stroke-width="2"/>
                        </svg>
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
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle cx="12" cy="12" r="3" stroke-width="2"/>
                            <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" stroke-width="2"/>
                        </svg>
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

function handleStyleButtonClick(brandName, data) {
    const urlExtraction = window.pointFourURLExtraction;
    if (!urlExtraction) return;
    
    const params = new URLSearchParams({
        brand: brandName,
        item: urlExtraction.itemName || '',
        category: urlExtraction.category || '',
        source: 'extension'
    });
    
    // Add product image if available
    if (urlExtraction.productImage) {
        params.set('image', urlExtraction.productImage);
    }
    
    // Open the style page in a new tab
    const styleUrl = `https://www.pointfour.in/style?${params.toString()}`;
    console.log('🎨 Opening style URL:', styleUrl);
    
    window.open(styleUrl, '_blank', 'noopener,noreferrer');
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
            const apiUrl = `http://localhost:3000/api/extension/search-reviews?${params.toString()}`;
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
