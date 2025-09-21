// ========================================
// POINTFOUR - SITE DETECTION MODULE
// ========================================

import { CONFIG } from './config.js';
import { setState } from './state.js';

// ========================================
// FASHION SITE DETECTION
// ========================================

export function detectFashionSite() {
    console.log('[PointFour] Starting intelligent fashion site detection...');
    let score = 0;
    const signals = [];
    let fashionSpecificScore = 0; // Track fashion-specific signals separately
    
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
        fashionSpecificScore += Math.min(fashionKeywordsFound.length, 3); // Count as fashion-specific
        signals.push(`Meta tags contain fashion keywords: ${fashionKeywordsFound.slice(0, 3).join(', ')}`);
    }
    
    // Check 1.5: NEGATIVE SIGNALS - Detect non-fashion categories and penalize heavily
    const negativeSignals = detectNegativeSignals(metaContent, document.title.toLowerCase(), document.body?.innerText?.toLowerCase() || '');
    if (negativeSignals.score < 0) {
        score += negativeSignals.score; // Apply penalty
        signals.push(`Negative signals detected: ${negativeSignals.reasons.join(', ')}`);
        console.log('[PointFour] Heavy penalty applied for non-fashion signals:', negativeSignals);
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
        fashionSpecificScore += Math.min(urlMatches.length, 2); // Count as fashion-specific
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
        fashionSpecificScore += 2; // Count as fashion-specific
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
        fashionSpecificScore += 1; // Count as fashion-specific
        signals.push('Found fashion-related images');
    }
    
    // Enhanced detection logic: Require fashion-specific signals for ambiguous sites
    const isClearFashionSite = score >= CONFIG.DETECTION_THRESHOLDS.HIGH_CONFIDENCE && fashionSpecificScore >= 3;
    const isAmbiguousSite = score >= CONFIG.DETECTION_THRESHOLDS.MIN_SCORE && score < CONFIG.DETECTION_THRESHOLDS.HIGH_CONFIDENCE;
    const hasStrongFashionSignals = fashionSpecificScore >= 2;
    
    // Special case: If we have very strong fashion signals, ignore penalties
    const hasVeryStrongFashionSignals = fashionSpecificScore >= 4;
    
    // For ambiguous sites, require strong fashion-specific signals
    // But if we have very strong fashion signals, always show widget regardless of penalties
    const isFashionSite = isClearFashionSite || (isAmbiguousSite && hasStrongFashionSignals) || hasVeryStrongFashionSignals;
    
    // Log detection results
    console.log('[PointFour] Detection Score:', score);
    console.log('[PointFour] Fashion-Specific Score:', fashionSpecificScore);
    console.log('[PointFour] Signals found:', signals);
    console.log('[PointFour] Detection Logic:', {
        isClearFashionSite,
        isAmbiguousSite,
        hasStrongFashionSignals,
        hasVeryStrongFashionSignals,
        finalDecision: isFashionSite
    });
    
    setState('detectionScore', score);
    return {
        isFashionSite: isFashionSite,
        isHighConfidence: score >= CONFIG.DETECTION_THRESHOLDS.HIGH_CONFIDENCE,
        score: score,
        fashionSpecificScore: fashionSpecificScore,
        signals: signals,
        productElementsCount: productElementsCount,
        hasPriceElements: hasPriceElements
    };
}

// ========================================
// PAGE TYPE DETECTION
// ========================================

export function detectPageType() {
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

export function shouldRunOnThisPage() {
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
// NEGATIVE SIGNAL DETECTION
// ========================================

function detectNegativeSignals(metaContent, pageTitle, pageText) {
    const negativeCategories = {
        electronics: {
            keywords: ['tech specs', 'processor', 'memory', 'storage', 'battery', 'cpu', 'gpu', 'ram', 'operating system', 'smartphone', 'laptop', 'tablet', 'computer', 'gaming console', 'motherboard', 'graphics card'],
            penalty: -3
        },
        automotive: {
            keywords: ['engine', 'horsepower', 'mpg', 'transmission', 'warranty', 'mileage', 'fuel', 'gas', 'hybrid', 'electric vehicle', 'car', 'truck', 'suv', 'automotive', 'vehicle parts', 'tires', 'oil'],
            penalty: -3
        },
        home: {
            keywords: ['assembly required', 'installation', 'maintenance', 'furniture', 'appliance', 'home decor', 'kitchen', 'bathroom', 'bedroom', 'living room', 'outdoor', 'garden', 'tools', 'hardware', 'construction', 'renovation'],
            penalty: -2
        },
        books: {
            keywords: ['pages', 'author', 'isbn', 'publication', 'edition', 'book', 'ebook', 'audiobook', 'magazine', 'journal', 'textbook', 'novel', 'fiction', 'non-fiction', 'publisher'],
            penalty: -2
        },
        health: {
            keywords: ['supplement', 'vitamin', 'medicine', 'pharmaceutical', 'medical', 'health', 'wellness', 'fitness equipment', 'exercise', 'nutrition', 'diet', 'protein', 'organic'],
            penalty: -2
        },
        business: {
            keywords: ['business', 'enterprise', 'saas', 'crm', 'erp', 'accounting', 'finance', 'investment', 'trading', 'insurance', 'legal', 'consulting'],
            penalty: -2
        }
    };
    
    let totalPenalty = 0;
    const detectedCategories = [];
    
    // Check each category
    for (const [category, config] of Object.entries(negativeCategories)) {
        const matches = config.keywords.filter(keyword => 
            metaContent.includes(keyword) || 
            pageTitle.includes(keyword) || 
            pageText.includes(keyword)
        );
        
        if (matches.length >= 2) { // Require at least 2 matches to avoid false positives
            totalPenalty += config.penalty;
            detectedCategories.push(category);
            console.log(`[PointFour] Detected ${category} signals:`, matches.slice(0, 3));
        }
    }
    
    return {
        score: totalPenalty,
        reasons: detectedCategories,
        categories: detectedCategories
    };
}

export default {
    detectFashionSite,
    detectPageType,
    shouldRunOnThisPage
};