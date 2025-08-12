// Background Service Worker for Pointfour Fashion Assistant
// Handles brand detection, API calls, and cross-tab state management

// Use production URL by default, fallback to localhost for development
const API_BASE_URL = 'https://www.pointfour.in';
const BRAND_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const brandCache = new Map();
const tabStates = new Map();

// Brand detection patterns for different fashion websites
const BRAND_PATTERNS = {
  'zara.com': {
    name: 'Zara',
    selectors: ['[data-brand="zara"]', '.brand-name', 'h1', 'title'],
    keywords: ['zara', 'zarahome']
  },
  'hm.com': {
    name: 'H&M',
    selectors: ['.brand', '.brand-name', 'h1', 'title'],
    keywords: ['h&m', 'hm', 'hennes']
  },
  'asos.com': {
    name: 'ASOS',
    selectors: ['.product-brand', '.brand', 'h1', 'title'],
    keywords: ['asos', 'asosdesign']
  },
  'reformation.com': {
    name: 'Reformation',
    selectors: ['.brand', '.brand-name', 'h1', 'title'],
    keywords: ['reformation', 'ref']
  },
  'everlane.com': {
    name: 'Everlane',
    selectors: ['.brand', '.brand-name', 'h1', 'title'],
    keywords: ['everlane']
  },
  'cos.com': {
    name: 'COS',
    selectors: ['.brand', '.brand-name', 'h1', 'title'],
    keywords: ['cos', 'collection of style']
  },
  'uniqlo.com': {
    name: 'Uniqlo',
    selectors: ['.brand', '.brand-name', 'h1', 'title'],
    keywords: ['uniqlo']
  },
  'mango.com': {
    name: 'Mango',
    selectors: ['.brand', '.brand-name', 'h1', 'title'],
    keywords: ['mango']
  },
  'farfetch.com': {
    name: 'Farfetch',
    selectors: ['.product-brand', '.brand', 'h1', 'title'],
    keywords: ['farfetch']
  },
  'net-a-porter.com': {
    name: 'Net-a-Porter',
    selectors: ['.product-brand', '.brand', 'h1', 'title'],
    keywords: ['net-a-porter', 'netaporter']
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
    notifications: true
  });
});

// Handle tab updates for brand detection
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const domain = extractDomain(tab.url);
    if (isFashionWebsite(domain)) {
      detectBrand(tabId, domain, tab.url);
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

// Detect brand from website
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

    console.log('Detected brand:', brandName, 'on domain:', domain);

    // Get brand data from API
    const brandData = await fetchBrandData(brandName);
    
    // Cache the result
    brandCache.set(cacheKey, {
      data: brandData,
      timestamp: Date.now()
    });

    // Send data to content script
    sendBrandDataToTab(tabId, brandData);

  } catch (error) {
    console.error('Error detecting brand:', error);
  }
}

// Fetch brand data from Pointfour API
async function fetchBrandData(brandName) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/recommendations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `Brand: ${brandName}`,
        enableExternalSearch: true
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      brandName,
      hasData: data.hasDatabaseData || data.hasExternalData,
      searchType: data.searchType || 'database',
      recommendation: data.recommendation,
      externalSearchResults: data.externalSearchResults,
      timestamp: Date.now()
    };

  } catch (error) {
    console.error('Error fetching brand data:', error);
    
    // Return fallback data
    return {
      brandName,
      hasData: false,
      searchType: 'none',
      recommendation: `Limited information available for ${brandName}. Check their size guide for best fit.`,
      externalSearchResults: null,
      timestamp: Date.now()
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
