// Background Service Worker for Pointfour Fashion Assistant
// Handles brand detection, API calls, and cross-tab state management

// Use production URL by default, fallback to localhost for development
const API_BASE_URL = 'https://www.pointfour.in';
const BRAND_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const brandCache = new Map();
const tabStates = new Map();

// Enhanced brand detection patterns for different fashion websites
const BRAND_PATTERNS = {
  // Fast Fashion
  'zara.com': {
    name: 'Zara',
    selectors: ['[data-brand="zara"]', '.brand-name', 'h1', 'title', '[data-testid="brand"]'],
    keywords: ['zara', 'zarahome'],
    category: 'fast-fashion'
  },
  'hm.com': {
    name: 'H&M',
    selectors: ['.brand', '.brand-name', 'h1', 'title', '[data-testid="brand"]'],
    keywords: ['h&m', 'hm', 'hennes'],
    category: 'fast-fashion'
  },
  'asos.com': {
    name: 'ASOS',
    selectors: ['.product-brand', '.brand', 'h1', 'title', '[data-testid="brand"]'],
    keywords: ['asos', 'asosdesign'],
    category: 'fast-fashion'
  },
  'uniqlo.com': {
    name: 'Uniqlo',
    selectors: ['.brand', '.brand-name', 'h1', 'title', '[data-testid="brand"]'],
    keywords: ['uniqlo'],
    category: 'fast-fashion'
  },
  'mango.com': {
    name: 'Mango',
    selectors: ['.brand', '.brand-name', 'h1', 'title', '[data-testid="brand"]'],
    keywords: ['mango'],
    category: 'fast-fashion'
  },
  'topshop.com': {
    name: 'Topshop',
    selectors: ['.brand', '.brand-name', 'h1', 'title', '[data-testid="brand"]'],
    keywords: ['topshop'],
    category: 'fast-fashion'
  },
  'riverisland.com': {
    name: 'River Island',
    selectors: ['.brand', '.brand-name', 'h1', 'title', '[data-testid="brand"]'],
    keywords: ['river island', 'riverisland'],
    category: 'fast-fashion'
  },
  'newlook.com': {
    name: 'New Look',
    selectors: ['.brand', '.brand-name', 'h1', 'title', '[data-testid="brand"]'],
    keywords: ['new look', 'newlook'],
    category: 'fast-fashion'
  },
  'boohoo.com': {
    name: 'Boohoo',
    selectors: ['.brand', '.brand-name', 'h1', 'title', '[data-testid="brand"]'],
    keywords: ['boohoo'],
    category: 'fast-fashion'
  },
  'prettylittlething.com': {
    name: 'PrettyLittleThing',
    selectors: ['.brand', '.brand-name', 'h1', 'title', '[data-testid="brand"]'],
    keywords: ['pretty little thing', 'prettylittlething'],
    category: 'fast-fashion'
  },
  'missguided.com': {
    name: 'Missguided',
    selectors: ['.brand', '.brand-name', 'h1', 'title', '[data-testid="brand"]'],
    keywords: ['missguided'],
    category: 'fast-fashion'
  },
  'nastygal.com': {
    name: 'Nasty Gal',
    selectors: ['.brand', '.brand-name', 'h1', 'title', '[data-testid="brand"]'],
    keywords: ['nasty gal', 'nastygal'],
    category: 'fast-fashion'
  },
  
  // Contemporary & Premium
  'reformation.com': {
    name: 'Reformation',
    selectors: ['.brand', '.brand-name', 'h1', 'title', '[data-testid="brand"]'],
    keywords: ['reformation', 'ref'],
    category: 'contemporary'
  },
  'everlane.com': {
    name: 'Everlane',
    selectors: ['.brand', '.brand-name', 'h1', 'title', '[data-testid="brand"]'],
    keywords: ['everlane'],
    category: 'contemporary'
  },
  'cos.com': {
    name: 'COS',
    selectors: ['.brand', '.brand-name', 'h1', 'title', '[data-testid="brand"]'],
    keywords: ['cos', 'collection of style'],
    category: 'contemporary'
  },
  'whistles.co.uk': {
    name: 'Whistles',
    selectors: ['.brand', '.brand-name', 'h1', 'title', '[data-testid="brand"]'],
    keywords: ['whistles'],
    category: 'contemporary'
  },
  'reiss.com': {
    name: 'Reiss',
    selectors: ['.brand', '.brand-name', 'h1', 'title', '[data-testid="brand"]'],
    keywords: ['reiss'],
    category: 'contemporary'
  },
  'tedbaker.com': {
    name: 'Ted Baker',
    selectors: ['.brand', '.brand-name', 'h1', 'title', '[data-testid="brand"]'],
    keywords: ['ted baker'],
    category: 'contemporary'
  },
  'karenmillen.com': {
    name: 'Karen Millen',
    selectors: ['.brand', '.brand-name', 'h1', 'title', '[data-testid="brand"]'],
    keywords: ['karen millen'],
    category: 'contemporary'
  },
  
  // Luxury & Designer
  'farfetch.com': {
    name: 'Farfetch',
    selectors: ['.product-brand', '.brand', 'h1', 'title', '[data-testid="brand"]'],
    keywords: ['farfetch'],
    category: 'luxury'
  },
  'net-a-porter.com': {
    name: 'Net-a-Porter',
    selectors: ['.product-brand', '.brand', 'h1', 'title', '[data-testid="brand"]'],
    keywords: ['net-a-porter', 'netaporter'],
    category: 'luxury'
  },
  'ssense.com': {
    name: 'SSENSE',
    selectors: ['.product-brand', '.brand', 'h1', 'title', '[data-testid="brand"]'],
    keywords: ['ssense'],
    category: 'luxury'
  },
  'matchesfashion.com': {
    name: 'Matches Fashion',
    selectors: ['.product-brand', '.brand', 'h1', 'title', '[data-testid="brand"]'],
    keywords: ['matches fashion', 'matchesfashion'],
    category: 'luxury'
  },
  'selfridges.com': {
    name: 'Selfridges',
    selectors: ['.product-brand', '.brand', 'h1', 'title', '[data-testid="brand"]'],
    keywords: ['selfridges'],
    category: 'luxury'
  },
  'harrods.com': {
    name: 'Harrods',
    selectors: ['.product-brand', '.brand', 'h1', 'title', '[data-testid="brand"]'],
    keywords: ['harrods'],
    category: 'luxury'
  },
  'libertylondon.com': {
    name: 'Liberty London',
    selectors: ['.product-brand', '.brand', 'h1', 'title', '[data-testid="brand"]'],
    keywords: ['liberty london', 'libertylondon'],
    category: 'luxury'
  },
  
  // Department Stores
  'johnlewis.com': {
    name: 'John Lewis',
    selectors: ['.product-brand', '.brand', 'h1', 'title', '[data-testid="brand"]'],
    keywords: ['john lewis', 'johnlewis'],
    category: 'department-store'
  },
  'debenhams.com': {
    name: 'Debenhams',
    selectors: ['.product-brand', '.brand', 'h1', 'title', '[data-testid="brand"]'],
    keywords: ['debenhams'],
    category: 'department-store'
  },
  'houseoffraser.com': {
    name: 'House of Fraser',
    selectors: ['.product-brand', '.brand', 'h1', 'title', '[data-testid="brand"]'],
    keywords: ['house of fraser', 'houseoffraser'],
    category: 'department-store'
  },
  'marksandspencer.com': {
    name: 'Marks & Spencer',
    selectors: ['.product-brand', '.brand', 'h1', 'title', '[data-testid="brand"]'],
    keywords: ['marks & spencer', 'marksandspencer', 'm&s'],
    category: 'department-store'
  },
  'next.co.uk': {
    name: 'Next',
    selectors: ['.product-brand', '.brand', 'h1', 'title', '[data-testid="brand"]'],
    keywords: ['next'],
    category: 'department-store'
  },
  
  // Specialty & Accessories
  'warehouse.co.uk': {
    name: 'Warehouse',
    selectors: ['.brand', '.brand-name', 'h1', 'title', '[data-testid="brand"]'],
    keywords: ['warehouse'],
    category: 'specialty'
  },
  'oasis-stores.com': {
    name: 'Oasis',
    selectors: ['.brand', '.brand-name', 'h1', 'title', '[data-testid="brand"]'],
    keywords: ['oasis'],
    category: 'specialty'
  },
  'coastfashion.com': {
    name: 'Coast',
    selectors: ['.brand', '.brand-name', 'h1', 'title', '[data-testid="brand"]'],
    keywords: ['coast'],
    category: 'specialty'
  },
  'monsoon.co.uk': {
    name: 'Monsoon',
    selectors: ['.brand', '.brand-name', 'h1', 'title', '[data-testid="brand"]'],
    keywords: ['monsoon'],
    category: 'specialty'
  },
  'accessorize.com': {
    name: 'Accessorize',
    selectors: ['.brand', '.brand-name', 'h1', 'title', '[data-testid="brand"]'],
    keywords: ['accessorize'],
    category: 'specialty'
  },
  'dorothyperkins.com': {
    name: 'Dorothy Perkins',
    selectors: ['.brand', '.brand-name', 'h1', 'title', '[data-testid="brand"]'],
    keywords: ['dorothy perkins', 'dorothyperkins'],
    category: 'specialty'
  },
  'evans.co.uk': {
    name: 'Evans',
    selectors: ['.brand', '.brand-name', 'h1', 'title', '[data-testid="brand"]'],
    keywords: ['evans'],
    category: 'specialty'
  },
  'wallis.co.uk': {
    name: 'Wallis',
    selectors: ['.brand', '.brand-name', 'h1', 'title', '[data-testid="brand"]'],
    keywords: ['wallis'],
    category: 'specialty'
  },
  'burton.co.uk': {
    name: 'Burton',
    selectors: ['.brand', '.brand-name', 'h1', 'title', '[data-testid="brand"]'],
    keywords: ['burton'],
    category: 'specialty'
  },
  'topman.com': {
    name: 'Topman',
    selectors: ['.brand', '.brand-name', 'h1', 'title', '[data-testid="brand"]'],
    keywords: ['topman'],
    category: 'specialty'
  }
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
    const domain = extractDomain(tab.url);
    if (isFashionWebsite(domain)) {
      // Add a small delay to ensure page is fully loaded
      setTimeout(() => {
        detectBrand(tabId, domain, tab.url);
      }, 500);
    }
  }
});

// Handle tab activation
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab.url) {
      const domain = extractDomain(tab.url);
      if (isFashionWebsite(domain)) {
        detectBrand(activeInfo.tabId, domain, tab.url);
      }
    }
  });
});

// Extract domain from URL
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.toLowerCase();
  } catch (e) {
    return '';
  }
}

// Check if website is a fashion website
function isFashionWebsite(domain) {
  return Object.keys(BRAND_PATTERNS).some(pattern => 
    domain.includes(pattern)
  );
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
    
    // Send fallback data on error
    const fallbackData = {
      brandName: 'Unknown Brand',
      hasData: false,
      searchType: 'none',
      recommendation: 'Unable to load brand information at this time. Please try refreshing the page.',
      externalSearchResults: null,
      timestamp: Date.now(),
      error: true
    };
    
    sendBrandDataToTab(tabId, fallbackData);
  }
}

// Enhanced brand data fetching with category information
async function fetchBrandData(brandName, category = 'general') {
  try {
    // Use the working search-reviews endpoint instead of the broken recommendations endpoint
    console.log('🔍 Using working search-reviews endpoint for:', brandName);
    
    const response = await fetch(`${API_BASE_URL}/api/extension/search-reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        brand: brandName,
        itemName: ''
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Search-reviews API response:', {
      success: data.success,
      totalResults: data.totalResults,
      hasBrandFitSummary: !!data.brandFitSummary,
      isFallback: data.isFallback
    });
    
    // Transform the search-reviews response to match expected format
    return {
      brandName,
      category,
      hasData: data.success && data.totalResults > 0,
      searchType: data.isFallback ? 'fallback' : 'web-search',
      recommendation: data.brandFitSummary ? 
        `${data.brandFitSummary.summary} (Based on ${data.totalResults} web search results)` :
        `Limited information available for ${brandName}. Check their size guide for best fit.`,
      externalSearchResults: data,
      fitTips: [],
      sizeGuide: null,
      timestamp: Date.now(),
      error: false
    };

  } catch (error) {
    console.error('Error fetching brand data:', error);
    
    // Return enhanced fallback data
    return {
      brandName,
      category,
      hasData: false,
      searchType: 'none',
      recommendation: `Limited information available for ${brandName}. Check their size guide for best fit.`,
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
      type: 'BRAND_DETECTED',
      data: brandData
    });
  } catch (error) {
    console.error('Error sending message to tab:', error);
  }
}

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_BRAND_DATA') {
    // Return cached brand data if available
    const tabId = sender.tab.id;
    const domain = extractDomain(sender.tab.url);
    const cacheKey = `${domain}_${sender.tab.url}`;
    
    if (brandCache.has(cacheKey)) {
      const cached = brandCache.get(cacheKey);
      sendResponse(cached.data);
    } else {
      sendResponse(null);
    }
    return true; // Keep message channel open for async response
  }
  
  if (message.type === 'UPDATE_TAB_STATE') {
    const tabId = sender.tab.id;
    tabStates.set(tabId, message.state);
    sendResponse({ success: true });
    return true;
  }
  
  if (message.type === 'GET_TAB_STATE') {
    const tabId = sender.tab.id;
    const state = tabStates.get(tabId) || {};
    sendResponse(state);
    return true;
  }
  
  if (message.type === 'CLEAR_CACHE') {
    // Clear expired cache entries
    const now = Date.now();
    for (const [key, value] of brandCache.entries()) {
      if (now - value.timestamp > BRAND_CACHE_DURATION) {
        brandCache.delete(key);
      }
    }
    sendResponse({ success: true, clearedEntries: brandCache.size });
    return true;
  }
  
  if (message.type === 'PING') {
    // Simple ping/pong for testing extension responsiveness
    sendResponse({ 
      pong: true, 
      timestamp: Date.now(),
      extension: 'Pointfour Fashion Assistant',
      version: '2.0.0'
    });
    return true;
  }
  
  if (message.type === 'TEST_BRAND_DETECTION') {
    // Test brand detection functionality
    console.log('🧪 Test brand detection received:', message.data);
    sendResponse({ 
      success: true, 
      message: 'Brand detection test received',
      data: message.data
    });
    return true;
  }
});

// Handle extension action click
chrome.action.onClicked.addListener((tab) => {
  if (tab.url && isFashionWebsite(extractDomain(tab.url))) {
    // Toggle widget visibility
    chrome.tabs.sendMessage(tab.id, {
      type: 'TOGGLE_WIDGET'
    });
  }
});

// Clean up when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  tabStates.delete(tabId);
  
  // Clean up expired cache entries
  const now = Date.now();
  for (const [key, value] of brandCache.entries()) {
    if (now - value.timestamp > BRAND_CACHE_DURATION) {
      brandCache.delete(key);
    }
  }
});

// Handle storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    // Notify all tabs of preference changes
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        if (tab.url && isFashionWebsite(extractDomain(tab.url))) {
          try {
            chrome.tabs.sendMessage(tab.id, {
              type: 'PREFERENCES_UPDATED',
              changes
            });
          } catch (error) {
            // Tab might not be ready yet
          }
        }
      });
    });
  }
});

// Periodic cache cleanup
setInterval(() => {
  const now = Date.now();
  let clearedCount = 0;
  
  for (const [key, value] of brandCache.entries()) {
    if (now - value.timestamp > BRAND_CACHE_DURATION) {
      brandCache.delete(key);
      clearedCount++;
    }
  }
  
  if (clearedCount > 0) {
    console.log(`Cleared ${clearedCount} expired cache entries`);
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes
