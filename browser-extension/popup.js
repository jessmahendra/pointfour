// Function to extract domain from URL
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch (error) {
    return 'Unknown';
  }
}

// Function to extract item name from page title and URL
function extractItemName(title, url) {
  // Try to extract item name from page title first
  if (title && title.trim()) {
    // Remove common website suffixes and clean up
    let cleanTitle = title.trim();
    
    // Remove common website name patterns
    cleanTitle = cleanTitle.replace(/\s*[-|]\s*(Reformation|GANNI|ASOS|And Other Stories|Intimissimi|Zara|H&M|Mango|Uniqlo|COS|Arket|Massimo Dutti|Bershka|Pull&Bear|Stradivarius|Urban Outfitters|Anthropologie|Free People|Madewell|Everlane|Revolve|Shopbop|Nordstrom|Bloomingdale's|Saks Fifth Avenue|Neiman Marcus|Bergdorf Goodman|Barneys|Net-a-Porter|Matches Fashion|Farfetch|SSENSE|Lyst|The RealReal|Poshmark|Depop|Vestiaire Collective|Grailed|StockX|GOAT|Flight Club|Stadium Goods)\s*$/i, '');
    
    // Remove common separators and clean up
    cleanTitle = cleanTitle.replace(/\s*[-|]\s*$/, '');
    cleanTitle = cleanTitle.replace(/^\s*[-|]\s*/, '');
    
    // Clean up extra whitespace
    cleanTitle = cleanTitle.replace(/\s+/g, ' ').trim();
    
    if (cleanTitle.length > 3 && cleanTitle.length < 200) {
      return cleanTitle;
    }
  }
  
  // Fallback: try to extract from URL path
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(part => part.length > 0);
    
    // Look for meaningful path segments (skip common words)
    const meaningfulParts = pathParts.filter(part => 
      part.length > 2 && 
      !['product', 'item', 'clothing', 'dress', 'shirt', 'pants', 'shoes', 'accessories'].includes(part.toLowerCase())
    );
    
    if (meaningfulParts.length > 0) {
      // Take the last meaningful part and clean it up
      let urlItemName = meaningfulParts[meaningfulParts.length - 1];
      urlItemName = urlItemName.replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();
      
      if (urlItemName.length > 3 && urlItemName.length < 100) {
        return urlItemName;
      }
    }
  } catch (error) {
    // URL parsing failed, continue to fallback
  }
  
  // Final fallback
  return 'Unknown Item';
}

// Function to normalize brand names for better matching
function normalizeBrandName(brandName) {
  if (!brandName) return '';
  
  let normalized = brandName.trim();
  
  // Common variations and abbreviations
  const brandVariations = {
    'ganni': 'GANNI',
    'ganni': 'GANNI',
    'thereformation': 'Reformation',
    'the reformation': 'Reformation',
    '& other stories': 'And Other Stories',
    'and other stories': 'And Other Stories',
    'other stories': 'And Other Stories',
    'abercrombie': 'Abercrombie & Fitch',
    'abercrombie & fitch': 'Abercrombie & Fitch',
    'a&f': 'Abercrombie & Fitch',
    'levis': 'Levi\'s',
    'levi\'s': 'Levi\'s',
    'levi': 'Levi\'s',
    'mother': 'MOTHER',
    'mother denim': 'MOTHER',
    'st agni': 'St. Agni',
    'st. agni': 'St. Agni',
    'le monde beryl': 'Le Monde Beryl',
    'lemondeberyl': 'Le Monde Beryl',
    'jamie haller': 'Jamie Haller',
    'jamiehaller': 'Jamie Haller',
    'frank & eileen': 'Frank & Eileen',
    'frankandeileen': 'Frank & Eileen',
    'with nothing underneath': 'With Nothing Underneath',
    'withnothingunderneath': 'With Nothing Underneath',
    'jenni kayne': 'Jenni Kayne',
    'jennikayne': 'Jenni Kayne',
    'rejina pyo': 'Rejina Pyo',
    'rejinapyo': 'Rejina Pyo',
    'vibi venezia': 'Vibi Venezia',
    'vibivenezia': 'Vibi Venezia',
    'le bon shoppe': 'Le Bon Shoppe',
    'lebon-shoppe': 'Le Bon Shoppe',
    'lebon shoppe': 'Le Bon Shoppe',
    'emme parsons': 'Emme Parsons',
    'emmeparsons': 'Emme Parsons',
    'ancient greek sandals': 'Ancient Greek Sandals',
    'ancientgreeksandals': 'Ancient Greek Sandals',
    'a. emery': 'A. Emery',
    'aemery': 'A. Emery',
    'ben-amun': 'Ben-Amun',
    'ben amun': 'Ben-Amun',
    'benamun': 'Ben-Amun'
  };
  
  // Check for exact matches in variations
  const lowerBrand = normalized.toLowerCase();
  if (brandVariations[lowerBrand]) {
    return brandVariations[lowerBrand];
  }
  
  // Check for partial matches
  for (const [variation, standardName] of Object.entries(brandVariations)) {
    if (lowerBrand.includes(variation) || variation.includes(lowerBrand)) {
      return standardName;
    }
  }
  
  return normalized;
}

// Function to detect brand from page content and URL
function detectBrand(url, itemName) {
  // First, try to extract brand from URL
  const domain = extractDomain(url);
  
  // Common brand mappings from domains - using exact database names
  const domainBrands = {
    'asos.com': 'ASOS',
    'zara.com': 'Zara',
    'hm.com': 'H&M',
    'uniqlo.com': 'Uniqlo',
    'cos.com': 'COS',
    'arket.com': 'Arket',
    'ganni.com': 'GANNI',
    'intimissimi.com': 'Intimissimi',
    'mango.com': 'Mango',
    'massimodutti.com': 'Massimo Dutti',
    'stories.com': 'And Other Stories',
    'weekday.com': 'Weekday',
    'monki.com': 'Monki',
    'bershka.com': 'Bershka',
    'pullandbear.com': 'Pull&Bear',
    'thereformation.com': 'Reformation',  // Fixed: was 'Thereformation'
    'reformation.com': 'Reformation',      // Also handle without 'the' prefix
    'sezane.com': 'Sezane',
    'madewell.com': 'Madewell',
    'everlane.com': 'Everlane',
    'quince.com': 'Quince',
    'dissh.com': 'Dissh',
    'posse.com': 'Posse',
    'abercrombie.com': 'Abercrombie & Fitch',
    'toteme.com': 'Toteme',
    'khaite.com': 'Khaite',
    'aminamuaddi.com': 'Amina Muaddi',
    'levis.com': 'Levi\'s',
    'lemondeberyl.com': 'Le Monde Beryl',
    'jamiehaller.com': 'Jamie Haller',
    'motherdenim.com': 'MOTHER',
    'thefrankieshop.com': 'The Frankie Shop',
    'withnothingunderneath.com': 'With Nothing Underneath',
    'jennikayne.com': 'Jenni Kayne',
    'vollebak.com': 'Vollebak',
    'frankandeileen.com': 'Frank & Eileen',
    'rejinapyo.com': 'Rejina Pyo',
    'vibivenezia.com': 'Vibi Venezia',
    'stagni.com': 'St. Agni',
    'lebon-shoppe.com': 'Le Bon Shoppe',
    'doen.com': 'Doen',
    'emmeparsons.com': 'Emme Parsons',
    'ancientgreeksandals.com': 'Ancient Greek Sandals',
    'leset.com': 'Leset',
    'aemery.com': 'A. Emery',
    'ben-amun.com': 'Ben-Amun',
    'maje.com': 'Maje',
    'paige.com': 'Paige'
  };

  // Check if we have a direct domain match
  if (domainBrands[domain]) {
    return domainBrands[domain];
  }

  // Handle "the" prefix domains more intelligently
  if (domain.startsWith('the') && domain.length > 3) {
    const brandWithoutThe = domain.substring(3); // Remove "the" prefix
    const brandWithCom = brandWithoutThe + '.com';
    if (domainBrands[brandWithCom]) {
      return domainBrands[brandWithCom];
    }
  }

  // If no direct match, try to extract brand from item name
  if (itemName) {
    // Common brand patterns in product names - updated with actual database names
    const brandPatterns = [
      /^(ASOS|Zara|H&M|Uniqlo|COS|Arket|GANNI|Intimissimi|Mango|Massimo Dutti|And Other Stories|Weekday|Monki|Bershka|Pull&Bear|Reformation|Sezane|Madewell|Everlane|Quince|Dissh|Posse|Abercrombie & Fitch|Toteme|Khaite|Amina Muaddi|Levi's|Le Monde Beryl|Jamie Haller|MOTHER|The Frankie Shop|With Nothing Underneath|Jenni Kayne|Vollebak|Frank & Eileen|Rejina Pyo|Vibi Venezia|St\. Agni|Le Bon Shoppe|Doen|Emme Parsons|Ancient Greek Sandals|Leset|A\. Emery|Ben-Amun|Maje|Paige)/i,
      /by\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
      /from\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i
    ];

    for (const pattern of brandPatterns) {
      const match = itemName.match(pattern);
      if (match) {
        const detectedBrand = match[1] || match[0];
        return normalizeBrandName(detectedBrand);
      }
    }
  }

  // Fallback: try to extract from domain (remove .com, capitalize)
  if (domain && domain !== 'Unknown') {
    const domainBrand = domain.split('.')[0]
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    return normalizeBrandName(domainBrand);
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
    console.log('Fetching from:', 'http://localhost:3000/api/extension/check-brand');
    
    const response = await fetch('http://localhost:3000/api/extension/check-brand', {
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
    const response = await fetch('http://localhost:3000/api/extension/test', {
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
      reviewStatusElement.innerHTML = '<span class="status-available">✅ Server Connection Successful!</span>';
    } else {
      reviewStatusElement.innerHTML = '<span class="status-unavailable">❌ Server Connection Failed</span>';
    }
    
    return data;
  } catch (error) {
    console.error('CORS test failed:', error);
    const reviewStatusElement = document.getElementById('review-status');
    reviewStatusElement.innerHTML = '<span class="status-unavailable">❌ Server Connection Failed: ' + error.message + '</span>';
    return { error: 'Server connection test failed', details: error.message };
  }
}

// Function to update the popup with detected information
function updatePopup(item, brand) {
  const itemElement = document.getElementById('item');
  const brandElement = document.getElementById('brand');
  
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
}

// Function to update popup with review data
function updatePopupWithReviewData(reviewData) {
  const reviewStatusElement = document.getElementById('review-status');
  const reviewCountElement = document.getElementById('review-count');
  const fitSummarySection = document.getElementById('fit-summary-section');
  const fitSummaryElement = document.getElementById('fit-summary');
  
  if (!reviewStatusElement || !reviewCountElement || !fitSummarySection || !fitSummaryElement) {
    console.error('Required elements not found');
    return;
  }
  
  // === COMPREHENSIVE DEBUG INFO ===
  console.log('=== FULL DEBUG INFO ===');
  console.log('Brand:', reviewData.brand);
  console.log('Has Data:', reviewData.hasData);
  console.log('Review Count:', reviewData.reviewCount);
  console.log('Brand Data Object:', reviewData.brandData);
  console.log('Message:', reviewData.message);
  console.log('Full Response:', JSON.stringify(reviewData, null, 2));
  console.log('======================');
  
  // Update review status with real data
  if (reviewData && reviewData.offline) {
    reviewStatusElement.innerHTML = '<span class="status-unavailable">⚠️ Database Connection Failed</span>';
    reviewCountElement.textContent = reviewData.details || 'Check server logs for details';
    fitSummarySection.style.display = 'none';
  } else if (reviewData && reviewData.error) {
    reviewStatusElement.innerHTML = '<span class="status-unavailable">❌ Error checking data</span>';
    reviewCountElement.textContent = reviewData.details || '';
    fitSummarySection.style.display = 'none';
  } else if (reviewData && reviewData.hasData) {
    // Show fit summary section if we have brand data
    if (reviewData.brandData && (reviewData.brandData.fitSummary || reviewData.brandData.sizingSystem)) {
      fitSummarySection.style.display = 'block';
      
      // Build fit summary content
      let fitSummaryText = '';
      if (reviewData.brandData.fitSummary) {
        fitSummaryText += reviewData.brandData.fitSummary;
      }
      if (reviewData.brandData.sizingSystem) {
        if (fitSummaryText) fitSummaryText += '\n\n';
        fitSummaryText += `Sizing: ${reviewData.brandData.sizingSystem}`;
      }
      if (reviewData.brandData.bestForBodyTypes) {
        if (fitSummaryText) fitSummaryText += '\n\n';
        fitSummaryText += `Best for: ${reviewData.brandData.bestForBodyTypes}`;
      }
      if (reviewData.brandData.commonFitInformation) {
        if (fitSummaryText) fitSummaryText += '\n\n';
        fitSummaryText += `Fit notes: ${reviewData.brandData.commonFitInformation}`;
      }
      
      fitSummaryElement.textContent = fitSummaryText || 'No fit information available';
    } else {
      fitSummarySection.style.display = 'none';
    }
    
    // FIXED: Distinguish between brand data and review data
    if (reviewData.reviewCount > 0) {
      // Has both brand data AND reviews
      reviewStatusElement.innerHTML = '<span class="status-available">✅ Review data available</span>';
      reviewCountElement.textContent = `${reviewData.reviewCount} reviews found`;
    } else {
      // Has brand data but NO reviews
      reviewStatusElement.innerHTML = '<span class="status-available">ℹ️ Brand data available</span>';
      reviewCountElement.textContent = 'Brand info available - No reviews yet';
    }
  } else if (reviewData && !reviewData.hasData) {
    reviewStatusElement.innerHTML = '<span class="status-unavailable">❌ No brand data yet</span>';
    reviewCountElement.textContent = 'This brand is not in our database';
    fitSummarySection.style.display = 'none';
  } else {
    reviewStatusElement.innerHTML = '<span class="status-loading">🔄 Checking...</span>';
    reviewCountElement.textContent = '';
    fitSummarySection.style.display = 'none';
  }
}

// Main function to analyze the current page
async function analyzePage() {
  try {
    // Get current tab info
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = tab.url;
    const title = tab.title;
    
    // Extract domain and item name
    const domain = extractDomain(url);
    const itemName = extractItemName(title, url);
    
    // Detect brand with normalization
    const detectedBrand = detectBrand(url, itemName);
    const normalizedBrand = normalizeBrandName(detectedBrand);
    
    console.log('Detected brand:', detectedBrand);
    console.log('Normalized brand:', normalizedBrand);
    
    // Update popup with detected information
    updatePopup(itemName, normalizedBrand);
    
    // Check if we have review data for this brand
    if (normalizedBrand && normalizedBrand !== 'Unknown Brand') {
      try {
        console.log('🔍 Checking brand data for:', normalizedBrand);
        console.log('🌐 API endpoint: http://localhost:3000/api/extension/check-brand');
        
        const response = await fetch('http://localhost:3000/api/extension/check-brand', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          mode: 'cors',
          credentials: 'omit',
          body: JSON.stringify({ brand: normalizedBrand })
        });
        
        console.log('📡 Response status:', response.status);
        console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (response.ok) {
          const data = await response.json();
          console.log('📊 Raw API response:', data);
          console.log('📊 Response structure:', {
            hasData: data.hasData,
            reviewCount: data.reviewCount,
            brandData: data.brandData ? 'Present' : 'Missing',
            message: data.message
          });
          
          // Update popup with review information
          updatePopupWithReviewData(data);
        } else {
          console.error('❌ Failed to fetch brand data:', response.status);
          const errorText = await response.text();
          console.error('❌ Error response body:', errorText);
          updatePopupWithReviewData({ 
            hasData: false, 
            reviewCount: 0, 
            message: 'Failed to fetch brand data' 
          });
        }
      } catch (error) {
        console.error('💥 Error fetching brand data:', error);
        console.error('💥 Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        updatePopupWithReviewData({ 
          hasData: false, 
          reviewCount: 0, 
          message: 'Network error' 
        });
      }
    } else {
      // No brand detected
      console.log('❌ No brand detected or brand is unknown');
      updatePopupWithReviewData({ 
        hasData: false, 
        reviewCount: 0, 
        message: 'No brand detected' 
      });
    }
    
  } catch (error) {
    console.error('Error analyzing page:', error);
    updatePopup('Error', 'Error analyzing page', 'Unknown Brand');
  }
}

// Initialize popup when it opens
document.addEventListener('DOMContentLoaded', analyzePage);

// Update when popup is focused (in case user switches tabs)
window.addEventListener('focus', analyzePage);

// Add event listener for test CORS button
document.addEventListener('DOMContentLoaded', function() {
  const testButton = document.getElementById('test-cors-btn');
  if (testButton) {
    testButton.addEventListener('click', testCORSConnection);
  }
});
