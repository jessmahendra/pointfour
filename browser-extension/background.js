// Background Service Worker for Pointfour Fashion Assistant
// Handles brand detection, API calls, and cross-tab state management

// Use production URL by default, fallback to localhost for development
const API_BASE_URL = 'https://www.pointfour.in';
const BRAND_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const brandCache = new Map();
const tabStates = new Map();

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

// Get brand category from domain
function getBrandCategory(domain) {
  const brandPattern = Object.entries(BRAND_PATTERNS).find(([pattern, config]) => 
    domain.includes(pattern)
  );
  
  return brandPattern ? brandPattern[1].category : null;
}

// Enhanced brand detection with multiple fallback strategies
async function detectBrand(tabId, domain, url) {
  try {
    // Check cache first
    const cacheKey = `${domain}_${url}`;
    if (brandCache.has(cacheKey)) {
      const cached = brandCache.get(cacheKey);
      if (Date.now() - cached.timestamp < BRAND_CACHE_DURATION) {
        console.log('Using cached brand data for:', domain);
        sendBrandDataToTab(tabId, cached.data);
        return;
      }
    }

    // Find matching brand pattern
    const brandPattern = Object.entries(BRAND_PATTERNS).find(([pattern, config]) => 
      domain.includes(pattern)
    );

    if (!brandPattern) {
      console.log('No brand pattern found for:', domain);
      return;
    }

    const [pattern, config] = brandPattern;
    const brandName = config.name;
    const category = config.category;

    console.log('Detected brand:', brandName, 'on domain:', domain, 'category:', category);
    console.log('Should show fit advice:', shouldShowFitAdvice(category));

    // Get brand data from API with enhanced parameters
    const brandData = await fetchBrandData(brandName, category);
    
    // Cache the result
    brandCache.set(cacheKey, {
      data: brandData,
      timestamp: Date.now()
    });

    // Send data to content script
    sendBrandDataToTab(tabId, brandData);

  } catch (error) {
    console.error('Error detecting brand:', error);
    
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

// Enhanced brand data fetching with category information
async function fetchBrandData(brandName, category = 'general') {
  try {
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
        externalSearchResults: null,
        fitTips: [],
        sizeGuide: null,
        timestamp: Date.now(),
        error: false,
        noFitAdvice: true
      };
    }
    
    // Use the working search-reviews endpoint for brands that should show fit advice
    console.log('🔍 Using working search-reviews endpoint for:', brandName, 'category:', category);
    
    const response = await fetch(`${API_BASE_URL}/api/extension/search-reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        brandName,
        itemName: '',
        category
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Brand data fetched successfully:', data);

    return {
      brandName,
      category,
      hasData: true,
      searchType: 'search-reviews',
      recommendation: data.recommendation || `Fit information available for ${brandName}`,
      externalSearchResults: data.externalSearchResults || null,
      fitTips: data.fitTips || [],
      sizeGuide: data.sizeGuide || null,
      timestamp: Date.now(),
      error: false
    };

  } catch (error) {
    console.error('Error fetching brand data:', error);
    
    // Return error data
    return {
      brandName,
      category,
      hasData: false,
      searchType: 'error',
      recommendation: `Unable to load fit information for ${brandName} at this time. Please try again later or manually search for reviews.`,
      externalSearchResults: null,
      fitTips: [],
      sizeGuide: null,
      timestamp: Date.now(),
      error: true
    };
  }
}

// Send brand data to content script
function sendBrandDataToTab(tabId, brandData) {
  try {
    chrome.tabs.sendMessage(tabId, {
      type: 'BRAND_DATA',
      data: brandData
    });
    
    console.log('Brand data sent to tab:', tabId);
    
    // Update tab state
    const tabState = tabStates.get(tabId);
    if (tabState) {
      tabState.status = 'active';
      tabState.brandData = brandData;
      tabStates.set(tabId, tabState);
    }
    
  } catch (error) {
    console.error('Error sending brand data to tab:', error);
  }
}

// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_BRAND_INFO') {
    const tabId = sender.tab.id;
    const tabState = tabStates.get(tabId);
    
    if (tabState && tabState.brandData) {
      sendResponse({ success: true, data: tabState.brandData });
    } else {
      sendResponse({ success: false, message: 'No brand data available' });
    }
    
    return true; // Keep message channel open for async response
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
  } else if (details.reason === 'update') {
    console.log('Pointfour Fashion Assistant updated to version:', chrome.runtime.getManifest().version);
  }
});

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
  console.log('Pointfour Fashion Assistant started');
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
    fetchBrandData
  };
}
