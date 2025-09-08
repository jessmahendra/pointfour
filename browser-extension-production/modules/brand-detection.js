// ========================================
// POINTFOUR - BRAND DETECTION MODULE
// ========================================

// ========================================
// MAIN BRAND EXTRACTION
// ========================================

export function extractBrandFromContent() {
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

export function extractBrandFromJSONLD() {
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

export function extractBrandFromBreadcrumbs() {
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

export function extractBrandFromHeadings() {
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

export function extractBrandFromMetaTags() {
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

export function extractBrandFromDomain() {
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

export function isValidBrandName(brandName) {
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

export function isLikelyIncomplete(word, allWords) {
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

export function cleanBrandName(brandName) {
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

export function extractBrandFromComplexPattern(text) {
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

export function isMarketplaceSite(extractedBrand) {
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

export function isValidBrandLength(brand) {
    return brand && brand.length >= 2 && brand.length <= 25;
}

export function isCommonWord(text) {
    const commonWords = [
        'new', 'latest', 'featured', 'popular', 'trending', 'shop', 'store', 'collection',
        'products', 'items', 'sale', 'bestsellers', 'best', 'sellers', 'discover', 'explore',
        'browse', 'view', 'see', 'men', 'women', 'kids', 'home', 'about', 'contact',
        'summer', 'winter', 'spring', 'fall', 'autumn'
    ];
    return commonWords.includes(text.toLowerCase());
}

export function isDescriptiveText(text) {
    // Check if text looks like a category/description rather than part of brand name
    const descriptiveWords = [
        'athletic', 'sports', 'luxury', 'fashion', 'apparel', 'clothing', 'footwear', 'shoes',
        'accessories', 'bags', 'jewelry', 'watches', 'beauty', 'cosmetics', 'skincare',
        'wear', 'collection', 'line', 'series', 'range'
    ];
    return descriptiveWords.some(word => text.toLowerCase().includes(word));
}

export function looksLikeBrandInContext(candidate, fullText, position) {
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

export function isReasonableBrandName(brandName) {
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

export default {
    extractBrandFromContent,
    extractBrandFromJSONLD,
    extractBrandFromBreadcrumbs,
    extractBrandFromHeadings,
    extractBrandFromMetaTags,
    extractBrandFromDomain,
    isValidBrandName,
    isLikelyIncomplete,
    cleanBrandName,
    extractBrandFromComplexPattern,
    isMarketplaceSite,
    isValidBrandLength,
    isCommonWord,
    isDescriptiveText,
    looksLikeBrandInContext,
    isReasonableBrandName
};