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
// ENHANCED CATEGORY DETECTION
// ========================================

export function detectProductCategory() {
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

export function detectCategoryFromURL() {
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

export function detectCategoryFromBreadcrumbs() {
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

export function detectCategoryFromHeadings() {
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

export function detectCategoryFromItemName(itemName) {
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

export function extractProductType(itemName, category) {
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

export function cleanProductName(name) {
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

export function extractBrandFromHostname(hostname) {
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

export function extractProductSKU() {
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

export function extractProductColor() {
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

export function extractProductSize() {
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

export function extractProductLine(itemName) {
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

export function calculateProductSimilarity(product1, product2) {
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

export function normalizeProductName(name) {
    if (!name) return '';
    return name.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

export function normalizeColor(color) {
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

export function calculateStringSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    if (str1 === str2) return 100;
    
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    const editDistance = getEditDistance(longer, shorter);
    const similarity = ((longer.length - editDistance) / longer.length) * 100;
    
    return Math.max(0, similarity);
}

export function getEditDistance(str1, str2) {
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

export function extractAllProductData() {
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

export function generateProductFingerprint(productData) {
    const components = [];
    
    if (productData.brand) components.push(`brand:${productData.brand.toLowerCase()}`);
    if (productData.itemName) components.push(`name:${normalizeProductName(productData.itemName)}`);
    if (productData.sku) components.push(`sku:${productData.sku.toLowerCase()}`);
    if (productData.category) components.push(`cat:${productData.category}`);
    if (productData.productType) components.push(`type:${productData.productType}`);
    if (productData.color) components.push(`color:${normalizeColor(productData.color)}`);
    
    return components.join('|');
}

export default {
    extractProductFromURL,
    extractProductImageFromPage,
    extractItemNameFromPage,
    extractMaterialsFromPage,
    extractSizeGuideFromPage,
    extractTableData,
    detectProductCategory,
    detectCategoryFromURL,
    detectCategoryFromBreadcrumbs,
    detectCategoryFromHeadings,
    detectCategoryFromItemName,
    extractProductType,
    extractProductLine,
    extractAllProductData,
    // New enhanced functions
    cleanProductName,
    extractBrandFromHostname,
    extractProductSKU,
    extractProductColor,
    extractProductSize,
    calculateProductSimilarity,
    normalizeProductName,
    normalizeColor,
    calculateStringSimilarity,
    generateProductFingerprint
};