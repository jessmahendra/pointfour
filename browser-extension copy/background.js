// Background Service Worker for Pointfour Fashion Assistant
// Handles brand detection, API calls, and cross-tab state management

// Use production URL by default, fallback to localhost for development
const API_BASE_URL = 'https://www.pointfour.in';
const BRAND_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes (reduced for testing fresh data)
const brandCache = new Map();
const tabStates = new Map();

// Enhanced analysis categories for better content filtering
const ANALYSIS_CATEGORIES = {
  fit: {
    keywords: ['true to size', 'runs small', 'runs large', 'size up', 'size down', 'tight', 'loose', 'baggy', 'snug', 'roomy', 'fits', 'sizing', 'fitted', 'oversized', 'relaxed fit', 'slim fit'],
    patterns: {
      runsSmall: ['runs small', 'size up', 'tight', 'snug fit', 'order a size up', 'smaller than expected', 'fits small', 'too small', 'sized up', 'go up a size'],
      runsLarge: ['runs large', 'size down', 'loose', 'baggy', 'oversized', 'order a size down', 'bigger than expected', 'fits large', 'too big', 'sized down', 'go down a size'],
      trueToSize: ['true to size', 'fits as expected', 'perfect fit', 'accurate sizing', 'fits perfectly', 'tts', 'standard sizing', 'usual size'],
      inconsistent: ['inconsistent', 'varies', 'depends on style', 'different fits', 'some run small some run large', 'hit or miss', 'mixed']
    }
  },
  washing: {
    keywords: ['wash', 'shrink', 'stretch', 'laundry', 'care', 'machine wash', 'dry clean', 'after washing', 'washed', 'dryer', 'cold wash', 'delicate'],
    patterns: {
      shrinks: ['shrinks', 'shrank', 'got smaller', 'reduced in size', 'shrinkage', 'shrunk in wash', 'shrank after washing'],
      holds: ['holds up', 'maintains shape', "doesn't shrink", 'keeps its form', 'washes well', 'holds shape', 'no shrinkage'],
      stretches: ['stretches out', 'loses shape', 'gets baggy', 'stretched after wash', 'lost shape']
    }
  },
  quality: {
    keywords: ['quality', 'durable', 'last', 'wear', 'pilling', 'fade', 'tear', 'holds up', 'construction', 'stitching', 'material quality', 'fabric quality', 'well-made', 'cheap', 'flimsy'],
    patterns: {
      highQuality: ['high quality', 'durable', 'lasts', 'holds up well', 'well-made', 'excellent quality', 'sturdy', 'great quality', 'worth the price'],
      lowQuality: ['poor quality', 'falls apart', 'pilling', 'fades quickly', 'cheap', 'flimsy', 'thin material', 'bad quality', 'not worth it']
    }
  },
  fabric: {
    keywords: ['cotton', 'polyester', 'wool', 'linen', 'silk', 'blend', 'material', 'fabric', 'rayon', 'viscose', 'spandex', 'elastane', 'nylon', 'cashmere', 'denim', 'jersey'],
    patterns: {
      natural: ['100% cotton', 'pure wool', 'linen', 'silk', 'organic cotton', 'natural fibers', 'bamboo', 'hemp'],
      synthetic: ['polyester', 'nylon', 'acrylic', 'spandex', 'elastane', 'synthetic', 'man-made'],
      blend: ['cotton blend', 'wool blend', 'mixed fabric', 'poly blend', 'cotton-poly', 'blend']
    }
  }
};

// Enhanced brand detection patterns for different fashion websites
// This is now a simplified mapping that works with the new categorization system
const BRAND_PATTERNS = {
  // Fast Fashion
  'zara.com': { name: 'Zara', category: 'fashion-clothing', subcategory: 'fast-fashion' },
  'hm.com': { name: 'H&M', category: 'fashion-clothing', subcategory: 'fast-fashion' },
  'asos.com': { name: 'ASOS', category: 'marketplace', subcategory: 'fast-fashion' },
  'uniqlo.com': { name: 'Uniqlo', category: 'fashion-clothing', subcategory: 'contemporary' },
  'mango.com': { name: 'Mango', category: 'fashion-clothing', subcategory: 'fast-fashion' },
  'topshop.com': { name: 'Topshop', category: 'fashion-clothing', subcategory: 'fast-fashion' },
  'riverisland.com': { name: 'River Island', category: 'fashion-clothing', subcategory: 'fast-fashion' },
  'newlook.com': { name: 'New Look', category: 'fashion-clothing', subcategory: 'fast-fashion' },
  'boohoo.com': { name: 'Boohoo', category: 'fashion-clothing', subcategory: 'fast-fashion' },
  'prettylittlething.com': { name: 'PrettyLittleThing', category: 'fashion-clothing', subcategory: 'fast-fashion' },
  'missguided.com': { name: 'Missguided', category: 'fashion-clothing', subcategory: 'fast-fashion' },
  'nastygal.com': { name: 'Nasty Gal', category: 'fashion-clothing', subcategory: 'fast-fashion' },
  
  // Contemporary & Premium
  'reformation.com': { name: 'Reformation', category: 'fashion-clothing', subcategory: 'contemporary' },
  'everlane.com': { name: 'Everlane', category: 'fashion-clothing', subcategory: 'contemporary' },
  'rohe.co': { name: 'Rohe', category: 'fashion-clothing', subcategory: 'contemporary' },
  'cos.com': { name: 'COS', category: 'fashion-clothing', subcategory: 'contemporary' },
  'whistles.co.uk': { name: 'Whistles', category: 'fashion-clothing', subcategory: 'contemporary' },
  'reiss.com': { name: 'Reiss', category: 'fashion-clothing', subcategory: 'contemporary' },
  'tedbaker.com': { name: 'Ted Baker', category: 'fashion-clothing', subcategory: 'contemporary' },
  'karenmillen.com': { name: 'Karen Millen', category: 'fashion-clothing', subcategory: 'contemporary' },
  
  // Luxury & Designer
  'farfetch.com': { name: 'Farfetch', category: 'marketplace', subcategory: 'luxury' },
  'net-a-porter.com': { name: 'Net-a-Porter', category: 'marketplace', subcategory: 'luxury' },
  'ssense.com': { name: 'SSENSE', category: 'marketplace', subcategory: 'luxury' },
  'matchesfashion.com': { name: 'Matches Fashion', category: 'marketplace', subcategory: 'luxury' },
  'selfridges.com': { name: 'Selfridges', category: 'department-store', subcategory: 'luxury' },
  'harrods.com': { name: 'Harrods', category: 'department-store', subcategory: 'luxury' },
  'libertylondon.com': { name: 'Liberty London', category: 'department-store', subcategory: 'luxury' },
  
  // Department Stores
  'johnlewis.com': { name: 'John Lewis', category: 'department-store', subcategory: 'mid-range' },
  'debenhams.com': { name: 'Debenhams', category: 'department-store', subcategory: 'mid-range' },
  'houseoffraser.com': { name: 'House of Fraser', category: 'department-store', subcategory: 'mid-range' },
  'marksandspencer.com': { name: 'Marks & Spencer', category: 'department-store', subcategory: 'mid-range' },
  'next.co.uk': { name: 'Next', category: 'department-store', subcategory: 'mid-range' },
  
  // Specialty & Accessories
  'warehouse.co.uk': { name: 'Warehouse', category: 'fashion-clothing', subcategory: 'contemporary' },
  'oasis-stores.com': { name: 'Oasis', category: 'fashion-clothing', subcategory: 'contemporary' },
  'coastfashion.com': { name: 'Coast', category: 'fashion-clothing', subcategory: 'contemporary' },
  'monsoon.co.uk': { name: 'Monsoon', category: 'fashion-clothing', subcategory: 'contemporary' },
  'accessorize.com': { name: 'Accessorize', category: 'jewelry-accessories', subcategory: 'accessories' },
  'dorothyperkins.com': { name: 'Dorothy Perkins', category: 'fashion-clothing', subcategory: 'fast-fashion' },
  'evans.co.uk': { name: 'Evans', category: 'fashion-clothing', subcategory: 'contemporary' },
  'wallis.co.uk': { name: 'Wallis', category: 'fashion-clothing', subcategory: 'contemporary' },
  'burton.co.uk': { name: 'Burton', category: 'fashion-clothing', subcategory: 'contemporary' },
  'topman.com': { name: 'Topman', category: 'fashion-clothing', subcategory: 'contemporary' },
  
  // Jewelry & Accessories
  'jujuvera.com': { name: 'JUJU VERA', category: 'jewelry-accessories', subcategory: 'fine-jewelry' },
  'mejuri.com': { name: 'Mejuri', category: 'jewelry-accessories', subcategory: 'fine-jewelry' },
  'gorjana.com': { name: 'Gorjana', category: 'jewelry-accessories', subcategory: 'fine-jewelry' },
  'kendra.com': { name: 'Kendra Scott', category: 'jewelry-accessories', subcategory: 'fine-jewelry' },
  'pandora.net': { name: 'Pandora', category: 'jewelry-accessories', subcategory: 'costume-jewelry' },
  'swarovski.com': { name: 'Swarovski', category: 'jewelry-accessories', subcategory: 'costume-jewelry' },
  
  // Footwear & Shoes
  'nike.com': { name: 'Nike', category: 'footwear', subcategory: 'athletic' },
  'adidas.com': { name: 'Adidas', category: 'footwear', subcategory: 'athletic' },
  'converse.com': { name: 'Converse', category: 'footwear', subcategory: 'casual' },
  'vans.com': { name: 'Vans', category: 'footwear', subcategory: 'casual' },
  'dr-martens.com': { name: 'Dr. Martens', category: 'footwear', subcategory: 'casual' },
  'clarks.com': { name: 'Clarks', category: 'footwear', subcategory: 'casual' },
  'timberland.com': { name: 'Timberland', category: 'footwear', subcategory: 'casual' },
  
  // Handbags & Bags
  'coach.com': { name: 'Coach', category: 'handbags-bags', subcategory: 'luxury' },
  'katespade.com': { name: 'Kate Spade', category: 'handbags-bags', subcategory: 'luxury' },
  'michaelkors.com': { name: 'Michael Kors', category: 'handbags-bags', subcategory: 'luxury' },
  'longchamp.com': { name: 'Longchamp', category: 'handbags-bags', subcategory: 'luxury' },
  
  // Watches
  'rolex.com': { name: 'Rolex', category: 'jewelry-accessories', subcategory: 'watches' },
  'omega.com': { name: 'Omega', category: 'jewelry-accessories', subcategory: 'watches' },
  'cartier.com': { name: 'Cartier', category: 'jewelry-accessories', subcategory: 'watches' },
  
  // Clothing Brands (Contemporary)
  'sirthelabel.com': { name: 'SIR the Label', category: 'fashion-clothing', subcategory: 'contemporary' }
};

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('Pointfour Fashion Assistant installed');
  
  // Set default preferences
  chrome.storage.sync.set({
    enabled: true,
    autoExpand: false,
    position: 'top-right',
    theme: 'light',
    notifications: true,
    autoHideDelay: 5000,
    widgetOpacity: 0.95,
    brandDetectionSensitivity: 'medium'
  });
});

// Handle tab updates for brand detection
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const domain = new URL(tab.url).hostname;
    console.log('Tab updated:', domain);
    
    // Check if this is a fashion website
    if (isFashionWebsite(domain)) {
      console.log('Fashion website detected:', domain);
      
      // Store tab state
      tabStates.set(tabId, {
        domain,
        url: tab.url,
        timestamp: Date.now(),
        status: 'detecting'
      });
      
      // Detect brand
      detectBrand(tabId, domain, tab.url);
    } else {
      console.log('Non-fashion website:', domain);
      // Clear tab state for non-fashion sites
      tabStates.delete(tabId);
    }
  }
});

// Handle tab removal
chrome.tabs.onRemoved.addListener((tabId) => {
  tabStates.delete(tabId);
  console.log('Tab removed, cleared state for:', tabId);
});

// Check if a domain is a fashion website
function isFashionWebsite(domain) {
  const lowerDomain = domain.toLowerCase();
  
  // Check if we have a direct brand pattern match
  if (Object.keys(BRAND_PATTERNS).some(pattern => lowerDomain.includes(pattern))) {
    return true;
  }
  
  // Check for common fashion-related terms in domain
  const fashionTerms = [
    'fashion', 'style', 'clothing', 'apparel', 'boutique', 'shop', 'store',
    'shoes', 'footwear', 'jewelry', 'accessories', 'handbags', 'bags',
    'lingerie', 'intimates', 'sportswear', 'activewear'
  ];
  
  return fashionTerms.some(term => lowerDomain.includes(term));
}

// Check if a brand category should show fit advice
function shouldShowFitAdvice(category) {
  // Categories that support fit advice
  const fitAdviceCategories = [
    'fashion-clothing', 'footwear', 'lingerie-intimates', 'sportswear-activewear'
  ];
  
  return fitAdviceCategories.includes(category);
}

// Calculate relevance score for content
function calculateRelevanceScore(text, brandName) {
  let score = 0;
  const lowerText = text.toLowerCase();
  const brandLower = brandName.toLowerCase();
  
  // Check for brand mention (required)
  if (!lowerText.includes(brandLower)) {
    return 0;
  }
  
  // Base score for brand mention
  score += 10;
  
  // Score based on category mentions
  let categoriesFound = 0;
  
  for (const [category, config] of Object.entries(ANALYSIS_CATEGORIES)) {
    const hasKeywords = config.keywords.some(keyword => 
      lowerText.includes(keyword.toLowerCase())
    );
    
    if (hasKeywords) {
      score += 15;
      categoriesFound++;
    }
  }
  
  // Bonus for multiple categories
  if (categoriesFound >= 2) score += 20;
  
  // Check for specific user experience indicators
  const experienceIndicators = [
    /i (bought|purchased|ordered|wear|have)/i,
    /size \d+/i,
    /usually wear|normally a|typical size/i,
    /months? ago|years? ago|weeks? ago/i,
    /returned|kept|exchange/i
  ];
  
  experienceIndicators.forEach(pattern => {
    if (pattern.test(text)) score += 10;
  });
  
  return score;
}

// Get brand category from domain
function getBrandCategory(domain) {
  const brandPattern = Object.entries(BRAND_PATTERNS).find(([pattern, config]) => 
    domain.includes(pattern)
  );
  
  return brandPattern ? brandPattern[1].category : null;
}

// Helper function to get brand category from brand name
function getBrandCategoryFromName(brandName) {
  const lowerBrandName = brandName.toLowerCase();
  
  // Check if brand name matches any known patterns
  for (const [pattern, config] of Object.entries(BRAND_PATTERNS)) {
    if (lowerBrandName.includes(pattern.toLowerCase()) || pattern.toLowerCase().includes(lowerBrandName)) {
      return config.category;
    }
  }
  
  // Default to general fashion category for unknown brands
  return 'fashion-clothing';
}

// Enhanced brand detection with multiple fallback strategies
async function detectBrand(tabId, domainOrBrand, url, urlExtraction = null) {
  try {
    console.log('🎯 Background: detectBrand called with:', { tabId, domainOrBrand, url, urlExtraction });
    
    // Check cache first
    const cacheKey = `${domainOrBrand}_${url}`;
    if (brandCache.has(cacheKey)) {
      const cached = brandCache.get(cacheKey);
      const age = Date.now() - cached.timestamp;
      if (age < BRAND_CACHE_DURATION) {
        console.log(`🎯 Background: Using cached brand data for: ${domainOrBrand} (age: ${Math.round(age/1000)}s)`);
        console.log('🎯 Background: Cached data preview:', cached.data.brandName, cached.data.externalSearchResults?.totalResults || 0, 'reviews');
        sendBrandDataToTab(tabId, cached.data);
        return;
      } else {
        console.log(`🎯 Background: Cache expired for ${domainOrBrand} (age: ${Math.round(age/1000)}s), fetching fresh data`);
        brandCache.delete(cacheKey);
      }
    }

    let brandName, category;

    // Check if this is a direct brand name or a domain
    if (domainOrBrand.includes('.') || domainOrBrand.includes('://')) {
      // This is a domain/URL - use pattern matching
      const domain = domainOrBrand.includes('://') ? new URL(domainOrBrand).hostname : domainOrBrand;
      
      // Find matching brand pattern
      const brandPattern = Object.entries(BRAND_PATTERNS).find(([pattern, config]) => 
        domain.includes(pattern)
      );

      if (!brandPattern) {
        console.log('🎯 Background: No brand pattern found for domain:', domain);
        return;
      }

      const [pattern, config] = brandPattern;
      brandName = config.name;
      category = config.category;
    } else {
      // This is a direct brand name - try to find category
      brandName = domainOrBrand;
      category = getBrandCategoryFromName(brandName) || 'general';
      console.log('🎯 Background: Direct brand name detected:', brandName, 'category:', category);
    }

    console.log('🎯 Background: Detected brand:', brandName, 'category:', category);
    console.log('🎯 Background: Should show fit advice:', shouldShowFitAdvice(category));

    // Get brand data from API with enhanced parameters
    console.log('🎯 Background: Calling fetchBrandData for:', brandName, 'category:', category, 'urlExtraction:', urlExtraction);
    const brandData = await fetchBrandData(brandName, category, urlExtraction);
    console.log('🎯 Background: fetchBrandData returned:', brandData);
    
    // Extract product image from the page
    console.log('🖼️ Background: Extracting product image from tab:', tabId);
    const productImage = await extractProductImage(tabId);
    
    // Add product image and URL to brand data
    if (productImage) {
      brandData.productImage = productImage;
      brandData.pageUrl = url;
      console.log('✅ Product image added to brand data:', productImage.src);
    } else {
      brandData.pageUrl = url;
      console.log('❌ No product image found for tab:', tabId);
    }
    
    // Cache the result
    brandCache.set(cacheKey, {
      data: brandData,
      timestamp: Date.now()
    });

    // Send data to content script
    console.log('🎯 Background: Sending brand data to tab:', tabId);
    sendBrandDataToTab(tabId, brandData);

  } catch (error) {
    console.error('🎯 Background: Error detecting brand:', error);
    
    // Send error data on error
    const errorData = {
      brandName: 'Unknown Brand',
      hasData: false,
      searchType: 'error',
      recommendation: 'Unable to load brand information at this time. Please try refreshing the page or manually search for a brand.',
      externalSearchResults: null,
      timestamp: Date.now(),
      error: true
    };
    
    sendBrandDataToTab(tabId, errorData);
  }
}

// Enhanced brand data fetching with improved analysis
async function fetchBrandData(brandName, category = 'general', urlExtraction = null) {
  try {
    console.log('🔗 fetchBrandData called with URL extraction:', urlExtraction);
    // Check if this brand category should show fit advice
    const showFitAdvice = shouldShowFitAdvice(category);
    
    if (!showFitAdvice) {
      // For non-fit categories, return appropriate message without fit advice
      return {
        brandName,
        category,
        hasData: false,
        searchType: 'category-specific',
        recommendation: `This is a ${category.replace('-', ' ')} brand. Fit advice is not applicable.`,
        timestamp: Date.now(),
        error: false
      };
    }
    
    // Prepare API request data
    const apiRequestData = {
      brand: brandName,
      itemName: urlExtraction?.itemName || '',
      category,
      enhancedAnalysis: true
    };
    
    // Add URL extraction data if available
    if (urlExtraction) {
      apiRequestData.urlExtraction = urlExtraction;
      console.log('🔗 Including URL extraction in API request:', {
        brand: urlExtraction.brand,
        itemName: urlExtraction.itemName,
        confidence: urlExtraction.confidence,
        source: urlExtraction.source
      });
    }
    
    // Use the working search-reviews endpoint for brands that should show fit advice
    console.log('🔍 Making API call to search-reviews endpoint for brand:', brandName, 'category:', category);
    console.log('🔍 API URL:', `${API_BASE_URL}/api/extension/search-reviews`);
    console.log('🔍 Request body:', JSON.stringify(apiRequestData));
    
    const response = await fetch(`${API_BASE_URL}/api/extension/search-reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiRequestData)
    });
    
    console.log('🔍 API response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API response not ok:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ API Response received for brand:', brandName);
    console.log('✅ Response summary:', {
      totalResults: data.totalResults || 0,
      hasBrandFitSummary: !!data.brandFitSummary,
      summaryPreview: data.brandFitSummary?.summary?.substring(0, 100) + '...' || 'N/A',
      sectionsCount: data.brandFitSummary?.sections ? Object.keys(data.brandFitSummary.sections).length : 0
    });
    
    // Don't generate old-style summary - let popup handle rich summaries
    // Enhanced analysis of the response
    const analysis = analyzeSearchResults(data, brandName);
    
    // Extract high-quality fit tips (but don't generate old summary)
    const fitTips = extractHighQualityFitTips(data.reviews, brandName);
    
    // Extract the summary from API response
    const apiSummary = data.brandFitSummary?.summary || null;
    const hasUsefulData = !!(apiSummary || (data.reviews && data.reviews.length > 0) || data.totalResults > 0);

    console.log('🔍 BACKGROUND DEBUGGING: API response summary extraction:', {
      hasBrandFitSummary: !!data.brandFitSummary,
      brandFitSummaryStructure: data.brandFitSummary ? Object.keys(data.brandFitSummary) : 'N/A',
      apiSummaryExists: !!apiSummary,
      apiSummaryPreview: apiSummary?.substring(0, 100) + '...' || 'N/A',
      hasUsefulData,
      totalResults: data.totalResults || 0
    });

    const resultData = {
      brandName,
      category,
      hasData: hasUsefulData, // True if we have summary or reviews
      searchType: 'enhanced-analysis',
      recommendation: apiSummary, // Use the actual generated summary from API
      externalSearchResults: {
        brandFitSummary: data.brandFitSummary,
        reviews: data.reviews || [],
        groupedReviews: data.groupedReviews || {},
        totalResults: data.totalResults || 0,
        isFallback: data.isFallback || false,
        analysis: analysis
      },
      fitTips: fitTips,
      sizeGuide: null,
      timestamp: Date.now(),
      error: false
    };

    console.log('🔍 BACKGROUND DEBUGGING: Final data structure being returned:', JSON.stringify(resultData, null, 2));
    return resultData;

  } catch (error) {
    console.error('Error fetching brand data:', error);
    
    // Check if it's an API key issue
    let errorMessage = `Unable to load fit information for ${brandName} at this time. Please try again later or manually search for reviews.`;
    
    if (error.message.includes('SERPER_API_KEY not found') || error.message.includes('Search API not configured')) {
      errorMessage = `Search API not configured. Please contact support to enable live review search.`;
    } else if (error.message.includes('403') || error.message.includes('authorization')) {
      errorMessage = `Search API authorization failed. Please check API configuration.`;
    }
    
    // Return error data
    return {
      brandName,
      category,
      hasData: false,
      searchType: 'error',
      recommendation: errorMessage,
      externalSearchResults: null,
      fitTips: [],
      sizeGuide: null,
      timestamp: Date.now(),
      error: true
    };
  }
}

// Enhanced analysis of search results
function analyzeSearchResults(data, brandName) {
  const analysis = {
    hasRelevantData: false,
    fitPattern: null,
    washingBehavior: null,
    qualityAssessment: null,
    fabricInfo: [],
    confidence: 'low',
    relevantReviews: 0,
    totalReviews: data.totalResults || 0
  };
  
  if (!data.reviews || data.reviews.length === 0) {
    return analysis;
  }
  
  // Analyze each review for relevance and content
  const relevantReviews = [];
  
  data.reviews.forEach(review => {
    const text = (review.snippet || review.content || '').toLowerCase();
    const relevanceScore = calculateRelevanceScore(text, brandName.toLowerCase());
    
    if (relevanceScore >= 30) {
      relevantReviews.push({
        text,
        score: relevanceScore,
        categories: detectCategories(text)
      });
    }
  });
  
  analysis.relevantReviews = relevantReviews.length;
  analysis.hasRelevantData = relevantReviews.length > 0;
  
  if (relevantReviews.length === 0) {
    return analysis;
  }
  
  // Analyze fit patterns
  const fitAnalysis = analyzeFitPatterns(relevantReviews);
  if (fitAnalysis.dominant) {
    analysis.fitPattern = fitAnalysis.dominant;
    analysis.confidence = fitAnalysis.confidence;
  }
  
  // Analyze washing behavior
  const washingAnalysis = analyzeWashingPatterns(relevantReviews);
  if (washingAnalysis.dominant) {
    analysis.washingBehavior = washingAnalysis.dominant;
  }
  
  // Analyze quality
  const qualityAnalysis = analyzeQualityPatterns(relevantReviews);
  if (qualityAnalysis.dominant) {
    analysis.qualityAssessment = qualityAnalysis.dominant;
  }
  
  // Extract fabric information
  analysis.fabricInfo = extractFabricInfo(relevantReviews);
  
  return analysis;
}

// Extract product image from page

async function extractProductImage(tabId) {
  try {
    console.log('🖼️ Extracting product images from tab:', tabId);
    
    const results = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: () => {
        // Function to check if image likely shows product only (no model)
        const isProductOnlyImage = (imgUrl) => {
          if (!imgUrl) return false;
          const urlLower = imgUrl.toLowerCase();
          
          // Strong indicators of product-only images
          const productOnlyKeywords = [
            '_flat', 'flat_', 'flatlay',
            '_still', 'still_', 
            '_alt', 'alternate',
            '_detail', 'detail_',
            '_back', 'back_',
            '_close', 'closeup',
            '_product', 'product_',
            '_lay', 'lay_',
            // Numbered images after first are often product-only
            '_02', '_03', '_04', '_05', '_06',
            '/2_', '/3_', '/4_', '/5_', '/6_',
            '-2.', '-3.', '-4.', '-5.', '-6.'
          ];
          
          // Indicators that image has a model
          const modelKeywords = [
            '_model', 'model_', 
            '_worn', 'worn_',
            '_lifestyle', 'lifestyle_',
            '_campaign', 'campaign_',
            '_editorial', 'editorial_',
            '_lookbook', 'lookbook_',
            '_on-figure', 'onfigure',
            // First image often has model
            '_01', '_1.', '/1_', '-1.'
          ];
          
          const hasProductKeyword = productOnlyKeywords.some(kw => urlLower.includes(kw));
          const hasModelKeyword = modelKeywords.some(kw => urlLower.includes(kw));
          
          // If URL suggests it's image 2-6, likely product-only
          const imageNumberMatch = urlLower.match(/[_\-\/]([2-6])[_\-\.]/);
          if (imageNumberMatch) {
            return !hasModelKeyword;
          }
          
          return hasProductKeyword && !hasModelKeyword;
        };

        // Collect all unique image URLs from the page
        const allImageUrls = new Set();
        const images = {
          primary: null,
          productOnly: null,
          gallery: [],
          allImages: []
        };

        // Strategy 1: Find ALL images in product galleries (including hidden/inactive slides)
        const gallerySelectors = [
          // Swiper/Slick sliders (including inactive slides)
          '.swiper-wrapper img',
          '.swiper-slide img',
          '.slick-list img',
          '.slick-slide img',
          '.slick-track img',
          
          // Product galleries
          '.product-images img',
          '.product-gallery img',
          '.product__images img',
          '.product-photos img',
          '.product__photos img',
          '.product-thumbnails img',
          '.product-gallery-thumbnails img',
          
          // Thumbnail specific
          '[class*="thumbnail"] img',
          '[class*="thumb"] img',
          '.thumbs img',
          
          // Generic gallery patterns
          '[class*="gallery"] img',
          '[class*="ProductImage"] img',
          '[class*="product-image"] img',
          
          // Data attributes
          '[data-image] img',
          '[data-src]',
          '[data-zoom]',
          
          // Róhe specific patterns
          '.product__slideshow img',
          '.product-single__photos img'
        ];

        // Collect all images from galleries
        for (const selector of gallerySelectors) {
          try {
            const elements = document.querySelectorAll(selector);
            elements.forEach(img => {
              // Get actual image URL from various sources
              let imgUrl = img.src || img.dataset.src || img.dataset.zoom || img.getAttribute('data-src');
              
              if (imgUrl && imgUrl.startsWith('http')) {
                // Clean URL
                imgUrl = imgUrl.split('?')[0];
                
                if (!allImageUrls.has(imgUrl)) {
                  allImageUrls.add(imgUrl);
                  images.allImages.push(imgUrl);
                  
                  // Check if this is likely a product-only image
                  if (isProductOnlyImage(imgUrl)) {
                    console.log('Found product-only image:', imgUrl);
                    if (!images.productOnly) {
                      images.productOnly = imgUrl;
                    }
                  }
                }
              }
            });
          } catch (e) {
            // Continue if selector fails
          }
        }

        // Strategy 2: Check for images in data attributes (lazy loaded images)
        const lazyImageSelectors = [
          '[data-src*="product"]',
          '[data-src*="flat"]',
          '[data-src*="_2"]',
          '[data-src*="_3"]',
          '[data-src*="_4"]',
          '[data-src*="_5"]'
        ];

        for (const selector of lazyImageSelectors) {
          try {
            const elements = document.querySelectorAll(selector);
            elements.forEach(elem => {
              const imgUrl = elem.getAttribute('data-src');
              if (imgUrl && imgUrl.startsWith('http')) {
                const cleanUrl = imgUrl.split('?')[0];
                if (!allImageUrls.has(cleanUrl)) {
                  allImageUrls.add(cleanUrl);
                  images.allImages.push(cleanUrl);
                  
                  if (isProductOnlyImage(cleanUrl)) {
                    if (!images.productOnly) {
                      images.productOnly = cleanUrl;
                    }
                  }
                }
              }
            });
          } catch (e) {
            // Continue
          }
        }

        // Strategy 3: Extract from JavaScript objects (many sites store gallery data in JS)
        try {
          // Look for product data in window object
          const productDataKeys = ['product', 'productData', 'productImages', 'galleryImages'];
          for (const key of productDataKeys) {
            if (window[key] && typeof window[key] === 'object') {
              const extractImagesFromObj = (obj) => {
                if (typeof obj === 'string' && obj.startsWith('http')) {
                  const cleanUrl = obj.split('?')[0];
                  if (!allImageUrls.has(cleanUrl)) {
                    allImageUrls.add(cleanUrl);
                    images.allImages.push(cleanUrl);
                  }
                } else if (Array.isArray(obj)) {
                  obj.forEach(item => extractImagesFromObj(item));
                } else if (obj && typeof obj === 'object') {
                  Object.values(obj).forEach(value => extractImagesFromObj(value));
                }
              };
              extractImagesFromObj(window[key]);
            }
          }
        } catch (e) {
          // Continue
        }

        // Strategy 4: If no product-only image found yet, use position-based heuristic
        if (!images.productOnly && images.allImages.length > 1) {
          // Images at position 2-5 are often product-only (skip first which is usually model)
          for (let i = 1; i < Math.min(6, images.allImages.length); i++) {
            const imgUrl = images.allImages[i];
            // Skip if URL suggests it's the main/model image
            if (!imgUrl.includes('_01') && !imgUrl.includes('_1.') && !imgUrl.includes('model')) {
              console.log(`Using image at position ${i + 1} as likely product-only:`, imgUrl);
              images.productOnly = imgUrl;
              break;
            }
          }
        }

        // Get main image as fallback
        const mainImg = document.querySelector('.product-image-main img, .product__main-photos img, [class*="ProductImage"] img');
        if (mainImg && mainImg.src) {
          images.primary = mainImg.src.split('?')[0];
        }

        // Final fallback: use any found image
        if (!images.productOnly && images.allImages.length > 0) {
          // Try position 4 or 5 first (often flat lay)
          images.productOnly = images.allImages[4] || images.allImages[3] || images.allImages[1] || images.allImages[0];
        }

        console.log('🖼️ Image extraction complete:', {
          totalImages: images.allImages.length,
          productOnly: images.productOnly ? 'Found' : 'Not found',
          usingPosition: images.productOnly ? images.allImages.indexOf(images.productOnly) + 1 : 'N/A'
        });

        return {
          src: images.productOnly || images.primary || images.allImages[0],
          productOnly: images.productOnly,
          primary: images.primary,
          allImages: images.allImages,
          selector: images.productOnly ? `product-only (position ${images.allImages.indexOf(images.productOnly) + 1})` : 'fallback'
        };
      }
    });
    
    if (results && results[0] && results[0].result) {
      console.log('✅ Product images extracted:', {
        ...results[0].result,
        totalFound: results[0].result.allImages?.length || 0
      });
      return results[0].result;
    }
    
    console.log('❌ No product images found');
    return null;
  } catch (error) {
    console.error('Error extracting product image:', error);
    return null;
  }
}

// Detect categories mentioned in text
function detectCategories(text) {
  const categories = [];
  
  for (const [category, config] of Object.entries(ANALYSIS_CATEGORIES)) {
    const hasKeywords = config.keywords.some(keyword => 
      text.includes(keyword.toLowerCase())
    );
    
    if (hasKeywords) {
      categories.push(category);
    }
  }
  
  return categories;
}

// Analyze fit patterns from relevant reviews
function analyzeFitPatterns(reviews) {
  const patterns = {
    runsSmall: 0,
    runsLarge: 0,
    trueToSize: 0,
    inconsistent: 0
  };
  
  reviews.forEach(review => {
    const text = review.text;
    
    // Check each pattern
    for (const [pattern, keywords] of Object.entries(ANALYSIS_CATEGORIES.fit.patterns)) {
      if (keywords.some(keyword => text.includes(keyword.toLowerCase()))) {
        patterns[pattern]++;
      }
    }
  });
  
  // Find dominant pattern
  const total = Object.values(patterns).reduce((sum, count) => sum + count, 0);
  if (total === 0) return { dominant: null, confidence: 'low' };
  
  const sortedPatterns = Object.entries(patterns).sort((a, b) => b[1] - a[1]);
  const dominant = sortedPatterns[0];
  const percentage = (dominant[1] / total) * 100;
  
  let confidence = 'low';
  if (total >= 5 && percentage >= 60) confidence = 'high';
  else if (total >= 3 && percentage >= 50) confidence = 'medium';
  
  return {
    dominant: dominant[1] > 0 ? dominant[0] : null,
    confidence,
    distribution: patterns,
    total
  };
}

// Analyze washing patterns from relevant reviews
function analyzeWashingPatterns(reviews) {
  const patterns = {
    shrinks: 0,
    holds: 0,
    stretches: 0
  };
  
  reviews.forEach(review => {
    const text = review.text;
    
    // Check each pattern
    for (const [pattern, keywords] of Object.entries(ANALYSIS_CATEGORIES.washing.patterns)) {
      if (keywords.some(keyword => text.includes(keyword.toLowerCase()))) {
        patterns[pattern]++;
      }
    }
  });
  
  // Find dominant pattern
  const total = Object.values(patterns).reduce((sum, count) => sum + count, 0);
  if (total === 0) return { dominant: null };
  
  const sortedPatterns = Object.entries(patterns).sort((a, b) => b[1] - a[1]);
  const dominant = sortedPatterns[0];
  
  return {
    dominant: dominant[1] > 0 ? dominant[0] : null,
    distribution: patterns,
    total
  };
}

// Analyze quality patterns from relevant reviews
function analyzeQualityPatterns(reviews) {
  const patterns = {
    highQuality: 0,
    lowQuality: 0
  };
  
  reviews.forEach(review => {
    const text = review.text;
    
    // Check each pattern
    for (const [pattern, keywords] of Object.entries(ANALYSIS_CATEGORIES.quality.patterns)) {
      if (keywords.some(keyword => text.includes(keyword.toLowerCase()))) {
        patterns[pattern]++;
      }
    }
  });
  
  // Find dominant pattern
  const total = Object.values(patterns).reduce((sum, count) => sum + count, 0);
  if (total === 0) return { dominant: null };
  
  const sortedPatterns = Object.entries(patterns).sort((a, b) => b[1] - a[1]);
  const dominant = sortedPatterns[0];
  
  return {
    dominant: dominant[1] > 0 ? dominant[0] : null,
    distribution: patterns,
    total
  };
}

// Extract fabric information from relevant reviews
function extractFabricInfo(reviews) {
  const fabrics = new Set();
  
  reviews.forEach(review => {
    const text = review.text;
    
    // Check for fabric mentions
    ANALYSIS_CATEGORIES.fabric.keywords.forEach(fabric => {
      if (text.includes(fabric.toLowerCase())) {
        fabrics.add(fabric);
      }
    });
  });
  
  return Array.from(fabrics);
}

// DEPRECATED: Generate enhanced recommendation based on analysis
// This function is no longer used - popup now uses rich API summaries
function generateEnhancedRecommendation(brandName, analysis) {
  // Return null to prevent old-style summary generation
  return null;
  
  /* DEPRECATED CODE - keeping for reference but not used
  if (!analysis.hasRelevantData) {
    return `No specific sizing or quality information found for ${brandName}. We searched but couldn't find relevant reviews. Try searching for a different brand or check back later.`;
  }
  
  let recommendation = '';
  
  // Start with review count
  if (analysis.totalReviews > 0) {
    recommendation = `Based on ${analysis.relevantReviews} relevant reviews (from ${analysis.totalReviews} total): `;
  }
  
  // Add fit pattern if available
  if (analysis.fitPattern) {
    const fitMessages = {
      runsSmall: `${brandName} tends to run small - consider sizing up`,
      runsLarge: `${brandName} tends to run large - consider sizing down`,
      trueToSize: `${brandName} generally fits true to size`,
      inconsistent: `${brandName} has inconsistent sizing - check individual item reviews`
    };
    
    recommendation += fitMessages[analysis.fitPattern] || '';
    
    if (analysis.confidence === 'high') {
      recommendation += ' (high confidence)';
    } else if (analysis.confidence === 'medium') {
      recommendation += ' (moderate confidence)';
    } else {
      recommendation += ' (limited data)';
    }
  }
  
  // Add washing behavior if available
  if (analysis.washingBehavior) {
    const washMessages = {
      shrinks: '. May shrink in wash - consider cold wash or sizing up',
      holds: '. Holds shape well after washing',
      stretches: '. May stretch out with wear/washing'
    };
    
    recommendation += washMessages[analysis.washingBehavior] || '';
  }
  
  // Add quality assessment if available
  if (analysis.qualityAssessment) {
    const qualityMessages = {
      highQuality: '. Generally reported as good quality',
      lowQuality: '. Some quality concerns reported'
    };
    
    recommendation += qualityMessages[analysis.qualityAssessment] || '';
  }
  
  // Add fabric info if available
  if (analysis.fabricInfo.length > 0) {
    recommendation += `. Common materials: ${analysis.fabricInfo.slice(0, 3).join(', ')}`;
  }
  
  // If no specific patterns found but we have reviews
  if (!analysis.fitPattern && !analysis.washingBehavior && !analysis.qualityAssessment) {
    recommendation = `Found ${analysis.totalReviews} reviews for ${brandName}, but no clear patterns emerged. Check individual reviews for specific advice.`;
  }
  
  return recommendation;
  */
}

// Extract high-quality fit tips from reviews
function extractHighQualityFitTips(reviews, brandName) {
  const tips = [];
  
  if (!reviews || reviews.length === 0) return tips;
  
  // Filter for reviews with relevant content
  const relevantReviews = reviews.filter(review => {
    const text = (review.snippet || review.content || '').toLowerCase();
    const score = calculateRelevanceScore(text, brandName.toLowerCase());
    return score >= 30;
  });
  
  // Extract tips from top relevant reviews
  relevantReviews.slice(0, 5).forEach(review => {
    const text = review.snippet || review.content || '';
    
    // Look for specific patterns
    const patterns = [
      /(?:runs small|fits small|size up).*?(?:\.|$)/i,
      /(?:runs large|fits large|size down).*?(?:\.|$)/i,
      /(?:true to size|fits true|perfect fit).*?(?:\.|$)/i,
      /(?:for size \d+|i'm \d+'\d+"|normally wear).*?(?:\.|$)/i,
      /(?:shrinks?|stretch|wash).*?(?:\.|$)/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        let tip = match[0].trim();
        
        // Clean up the tip
        tip = tip.replace(/^\s*(?:and|but|however|though|,)\s*/i, '');
        tip = tip.replace(/\s+/g, ' ').trim();
        
        // Ensure it's not too long
        if (tip.length > 150) {
          tip = tip.substring(0, 150) + '...';
        }
        
        // Avoid duplicates
        if (tip.length > 20 && !tips.some(existing => 
          existing.toLowerCase().includes(tip.toLowerCase().substring(0, 30))
        )) {
          tips.push(tip);
        }
        
        break; // Only one tip per review
      }
    }
  });
  
  return tips.slice(0, 3); // Return top 3 tips
}

// Send brand data to content script
function sendBrandDataToTab(tabId, brandData) {
  try {
    console.log('🎯 Background: sendBrandDataToTab called for tab:', tabId);
    console.log('🎯 Background: Brand data to send:', brandData);
    
    chrome.tabs.sendMessage(tabId, {
      type: 'BRAND_DATA',
      data: brandData
    });
    
    console.log('🎯 Background: Brand data sent to tab:', tabId);
    
    // Update tab state
    const tabState = tabStates.get(tabId);
    if (tabState) {
      tabState.status = 'active';
      tabState.brandData = brandData;
      tabStates.set(tabId, tabState);
      console.log('🎯 Background: Tab state updated for tab:', tabId);
    } else {
      console.log('🎯 Background: No existing tab state, creating new one for tab:', tabId);
      tabStates.set(tabId, {
        status: 'active',
        brandData: brandData,
        timestamp: Date.now()
      });
    }
    
  } catch (error) {
    console.error('🎯 Background: Error sending brand data to tab:', tabId, error);
  }
}

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_BRAND_INFO') {
    // Handle both content script and popup requests
    const tabId = sender.tab?.id || message.tabId;
    
    console.log('🎯 Background: GET_BRAND_INFO request for tab:', tabId);
    console.log('🎯 Background: Sender:', sender);
    console.log('🎯 Background: Message:', message);
    console.log('🎯 Background: Available tab states:', Array.from(tabStates.keys()));
    console.log('🎯 Background: All tab states:', Array.from(tabStates.entries()).map(([id, state]) => ({
      tabId: id,
      hasData: !!state.brandData,
      brandName: state.brandData?.brandName || 'N/A'
    })));
    
    const tabState = tabStates.get(tabId);
    
    if (tabState && tabState.brandData) {
      console.log('🎯 Background: Found brand data for tab:', tabId, 'Brand:', tabState.brandData.brandName);
      sendResponse({ success: true, data: tabState.brandData });
    } else {
      console.log('🎯 Background: No brand data available for tab:', tabId);
      
      // Try to find brand data in any tab state if exact match fails
      const allStates = Array.from(tabStates.values());
      const anyBrandData = allStates.find(state => state.brandData);
      
      if (anyBrandData) {
        console.log('🎯 Background: Using brand data from any available tab:', anyBrandData.brandData.brandName);
        sendResponse({ success: true, data: anyBrandData.brandData });
      } else {
        sendResponse({ success: false, message: 'No brand data available' });
      }
    }
    
    return true; // Keep message channel open for async response
  }
  
  if (message.type === 'GET_BRAND_DATA') {
    const tabId = sender.tab.id;
    const { brandName, url, title, urlExtraction } = message;
    
    console.log('🎯 Background: GET_BRAND_DATA requested for:', brandName, 'on tab:', tabId);
    console.log('🎯 Background: Message details:', { brandName, url, title, urlExtraction });
    console.log('🎯 Background: Sender tab info:', sender.tab);
    
    // Log URL extraction details
    if (urlExtraction) {
      console.log('🔗 Background: URL extraction data received:', {
        brand: urlExtraction.brand,
        itemName: urlExtraction.itemName,
        confidence: urlExtraction.confidence,
        source: urlExtraction.source
      });
    }
    
    // Check if we already have brand data for this tab
    const tabState = tabStates.get(tabId);
    if (tabState && tabState.brandData) {
      console.log('🎯 Background: Using existing brand data for tab:', tabId);
      console.log('🎯 Background: Existing data:', tabState.brandData);
      sendResponse({ success: true, brandData: tabState.brandData });
      return true;
    }
    
    // If no existing data, trigger brand detection
    console.log('🎯 Background: No existing brand data, triggering detection for:', brandName);
    console.log('🎯 Background: Calling detectBrand with:', { tabId, brandName, url, urlExtraction });
    
    // Start the detection process but don't wait for it to complete
    // The response will be sent via sendBrandDataToTab when detection completes
    detectBrand(tabId, brandName, url, urlExtraction).catch(error => {
      console.error('🎯 Background: Error during brand detection:', error);
      // Send error response via message to content script
      chrome.tabs.sendMessage(tabId, {
        type: 'BRAND_DATA',
        data: {
          error: true,
          message: 'Brand detection error: ' + error.message
        }
      });
    });
    
    // Send immediate response indicating detection is in progress
    sendResponse({ success: true, message: 'Brand detection initiated' });
    return true;
  }
  
  if (message.type === 'REQUEST_BRAND_DETECTION') {
    const tabId = sender.tab.id;
    const domain = new URL(sender.tab.url).hostname;
    
    console.log('Brand detection requested for:', domain);
    detectBrand(tabId, domain, sender.tab.url);
    
    sendResponse({ success: true, message: 'Brand detection initiated' });
    return true;
  }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  if (tab.url) {
    const domain = new URL(tab.url).hostname;
    console.log('Extension icon clicked on:', domain);
    
    // Check if this is a fashion website
    if (isFashionWebsite(domain)) {
      // Trigger brand detection
      detectBrand(tab.id, domain, tab.url);
    } else {
      // Show message that this isn't a fashion website
      chrome.tabs.sendMessage(tab.id, {
        type: 'SHOW_MESSAGE',
        message: 'This website doesn\'t appear to be a fashion site. The Pointfour Fashion Assistant only works on fashion, jewelry, footwear, and related websites.'
      });
    }
  }
});

// Handle extension installation/update
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Pointfour Fashion Assistant installed');
    brandCache.clear();
  } else if (details.reason === 'update') {
    console.log('Pointfour Fashion Assistant updated to version:', chrome.runtime.getManifest().version);
    brandCache.clear();
  }
});

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
  console.log('Pointfour Fashion Assistant started');
  brandCache.clear();
});

// Add manual cache clearing for debugging
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CLEAR_CACHE') {
    console.log('🧹 Background: Manually clearing cache');
    brandCache.clear();
    sendResponse({ success: true, message: 'Cache cleared' });
    return true;
  }
  
  if (message.type === 'GET_CACHE_INFO') {
    console.log('📊 Background: Cache status requested');
    const cacheInfo = {
      size: brandCache.size,
      entries: Array.from(brandCache.keys()),
      ages: Array.from(brandCache.entries()).map(([key, value]) => ({
        key,
        ageSeconds: Math.round((Date.now() - value.timestamp) / 1000),
        brand: value.data.brandName
      }))
    };
    console.log('📊 Background: Cache info:', cacheInfo);
    sendResponse(cacheInfo);
    return true;
  }
});

// Handle extension shutdown
chrome.runtime.onSuspend.addListener(() => {
  console.log('Pointfour Fashion Assistant shutting down');
  // Clear caches
  brandCache.clear();
  tabStates.clear();
});

// Export for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    isFashionWebsite,
    shouldShowFitAdvice,
    getBrandCategory,
    detectBrand,
    fetchBrandData,
    ANALYSIS_CATEGORIES
  };
}