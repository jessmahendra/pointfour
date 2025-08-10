// Function to extract domain from URL
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch (error) {
    return 'Unknown';
  }
}

// Function to detect brand from page content and URL
function detectBrand(url, itemName) {
  // First, try to extract brand from URL
  const domain = extractDomain(url);
  
  // Common brand mappings from domains
  const domainBrands = {
    'asos.com': 'ASOS',
    'zara.com': 'Zara',
    'hm.com': 'H&M',
    'uniqlo.com': 'Uniqlo',
    'cos.com': 'COS',
    'arket.com': 'Arket',
    'ganni.com': 'Ganni',
    'intimissimi.com': 'Intimissimi',
    'mango.com': 'Mango',
    'massimodutti.com': 'Massimo Dutti',
    'stories.com': '& Other Stories',
    'weekday.com': 'Weekday',
    'monki.com': 'Monki',
    'bershka.com': 'Bershka',
    'pullandbear.com': 'Pull&Bear'
  };

  // Check if we have a direct domain match
  if (domainBrands[domain]) {
    return domainBrands[domain];
  }

  // If no direct match, try to extract brand from item name
  if (itemName) {
    // Common brand patterns in product names
    const brandPatterns = [
      /^(ASOS|Zara|H&M|Uniqlo|COS|Arket|Ganni|Intimissimi|Mango|Massimo Dutti|& Other Stories|Weekday|Monki|Bershka|Pull&Bear)/i,
      /by\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
      /from\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i
    ];

    for (const pattern of brandPatterns) {
      const match = itemName.match(pattern);
      if (match) {
        return match[1] || match[0];
      }
    }
  }

  // Fallback: try to extract from domain (remove .com, capitalize)
  if (domain && domain !== 'Unknown') {
    return domain.split('.')[0]
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  return 'Unknown Brand';
}

// Function to detect fashion item from page content
function detectFashionItem() {
  // Common selectors for product titles on fashion websites
  const selectors = [
    // Generic product selectors
    'h1[class*="product"]',
    'h1[class*="title"]',
    'h1[class*="name"]',
    '[data-testid*="title"]',
    '[data-testid*="product"]',
    '[class*="product-title"]',
    '[class*="product-name"]',
    '[class*="item-title"]',
    '[class*="item-name"]',
    
    // Specific to common fashion sites
    'h1[class*="product-title"]', // ASOS
    '[data-testid="product-title"]', // Common pattern
    '[class*="product-details"] h1', // Product detail pages
    '[class*="product-info"] h1', // Product info sections
    
    // Fallback to main h1 if no specific product selectors found
    'h1',
    
    // Meta tags as fallback
    'meta[property="og:title"]',
    'meta[name="twitter:title"]'
  ];

  // Try to find product title using selectors
  for (const selector of selectors) {
    try {
      const element = document.querySelector(selector);
      if (element) {
        let text = element.textContent || element.getAttribute('content') || '';
        text = text.trim();
        
        // Filter out very short or generic text
        if (text.length > 3 && text.length < 200) {
          // Clean up the text
          text = text.replace(/\s+/g, ' ').trim();
          return text;
        }
      }
    } catch (error) {
      continue;
    }
  }

  return null;
}

// Function to check brand review data via Pointfour API
async function checkBrandReviewData(brand) {
  try {
    console.log('Attempting to fetch brand data for:', brand);
    console.log('Fetching from:', 'http://localhost:3001/api/extension/check-brand');
    
    const response = await fetch('http://localhost:3001/api/extension/check-brand', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ brand }),
      mode: 'cors',
      credentials: 'omit'
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Response data:', data);
    return data;
  } catch (error) {
    console.error('Error checking brand data:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    // Check if it's a CORS or network error
    if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
      console.log('CORS or network error detected, showing offline mode');
      return { 
        error: 'Network error - check if server is running', 
        details: error.message,
        offline: true 
      };
    }
    
    return { error: 'Failed to check brand data', details: error.message };
  }
}

// Function to test CORS connection
async function testCORSConnection() {
  try {
    console.log('Testing CORS connection...');
    const response = await fetch('http://localhost:3001/api/extension/test', {
      method: 'GET',
      headers: { 
        'Accept': 'application/json'
      },
      mode: 'cors',
      credentials: 'omit'
    });
    
    console.log('Test response status:', response.status);
    const data = await response.json();
    console.log('Test response data:', data);
    
    // Update the popup to show test result
    const reviewStatusElement = document.getElementById('review-status');
    if (response.ok) {
      reviewStatusElement.innerHTML = '<span class="status-available">✅ CORS Test Successful!</span>';
    } else {
      reviewStatusElement.innerHTML = '<span class="status-unavailable">❌ CORS Test Failed</span>';
    }
    
    return data;
  } catch (error) {
    console.error('CORS test failed:', error);
    const reviewStatusElement = document.getElementById('review-status');
    reviewStatusElement.innerHTML = '<span class="status-unavailable">❌ CORS Test Failed: ' + error.message + '</span>';
    return { error: 'CORS test failed', details: error.message };
  }
}

// Function to update the popup with detected information
function updatePopup(website, item, brand, reviewData) {
  const websiteElement = document.getElementById('website');
  const itemElement = document.getElementById('item');
  const brandElement = document.getElementById('brand');
  const reviewStatusElement = document.getElementById('review-status');
  const reviewCountElement = document.getElementById('review-count');
  
  websiteElement.textContent = website;
  
  if (item) {
    itemElement.textContent = item;
  } else {
    itemElement.innerHTML = '<span class="no-item">Unable to detect item</span>';
  }

  if (brand) {
    brandElement.textContent = brand;
  } else {
    brandElement.innerHTML = '<span class="no-item">Unable to detect brand</span>';
  }

  // Update review status
  if (reviewData && reviewData.offline) {
    reviewStatusElement.innerHTML = '<span class="status-unavailable">⚠️ Offline Mode - Server not accessible</span>';
    reviewCountElement.textContent = 'Check if localhost:3001 is running';
  } else if (reviewData && reviewData.error) {
    reviewStatusElement.innerHTML = '<span class="status-unavailable">❌ Error checking data</span>';
    reviewCountElement.textContent = '';
  } else if (reviewData && reviewData.hasData) {
    reviewStatusElement.innerHTML = '<span class="status-available">✅ Review data available</span>';
    reviewCountElement.textContent = `${reviewData.reviewCount} reviews found`;
  } else if (reviewData && !reviewData.hasData) {
    reviewStatusElement.innerHTML = '<span class="status-unavailable">❌ No review data yet</span>';
    reviewCountElement.textContent = '';
  } else {
    reviewStatusElement.innerHTML = '<span class="status-loading">🔄 Checking...</span>';
    reviewCountElement.textContent = '';
  }
}

// Main function to get current tab info
async function getCurrentTabInfo() {
  try {
    // Get the current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      updatePopup('Error', 'Unable to access tab', 'Error', null);
      return;
    }

    const website = extractDomain(tab.url);
    
    // Execute script in the active tab to detect fashion item
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: detectFashionItem
      });
      
      const item = results[0]?.result;
      
      // Detect brand from URL and item name
      const brand = detectBrand(tab.url, item);
      
      // Check review data for the brand
      const reviewData = await checkBrandReviewData(brand);
      
      updatePopup(website, item, brand, reviewData);
      
    } catch (error) {
      // If we can't execute script (e.g., on chrome:// pages), show website only
      const brand = detectBrand(tab.url, null);
      updatePopup(website, null, brand, null);
    }
    
  } catch (error) {
    updatePopup('Error', 'Unable to access tab information', 'Error', null);
  }
}

// Initialize popup when it opens
document.addEventListener('DOMContentLoaded', getCurrentTabInfo);

// Update when popup is focused (in case user switches tabs)
window.addEventListener('focus', getCurrentTabInfo);

// Add event listener for test CORS button
document.addEventListener('DOMContentLoaded', function() {
  const testButton = document.getElementById('test-cors-btn');
  if (testButton) {
    testButton.addEventListener('click', testCORSConnection);
  }
});
