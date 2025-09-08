// ========================================
// POINTFOUR - CONFIGURATION MODULE
// ========================================

export const ALLOWED_API_ENDPOINTS = [
  'http://localhost:3000',
  'http://localhost:3002', 
  'https://pointfour.in',
  'https://www.pointfour.in',
  'https://api.pointfour.in'
];

export const CONFIG = {
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