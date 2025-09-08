// ========================================
// POINTFOUR - PRODUCT EXTRACTION MODULE
// ========================================

// ========================================
// PRODUCT URL EXTRACTION
// ========================================

export function extractProductFromURL() {
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

export function extractProductImageFromPage() {
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

export function extractItemNameFromPage() {
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

export function extractMaterialsFromPage() {
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

export function extractSizeGuideFromPage() {
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

export function extractTableData(table) {
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

export function detectCategoryFromItemName(itemName = '') {
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

export function extractAllProductData() {
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

export default {
    extractProductFromURL,
    extractProductImageFromPage,
    extractItemNameFromPage,
    extractMaterialsFromPage,
    extractSizeGuideFromPage,
    extractTableData,
    detectCategoryFromItemName,
    extractAllProductData
};