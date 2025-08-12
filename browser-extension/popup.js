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
    
    // Remove common product page suffixes
    cleanTitle = cleanTitle.replace(/\s*(Buy|Shop|Purchase|Order|Add to Cart|Add to Bag|View|Details|Product|Item)\s*$/i, '');
    
    // Remove common size/color indicators that might be in titles
    cleanTitle = cleanTitle.replace(/\s*(XS|S|M|L|XL|XXL|0|2|4|6|8|10|12|14|16|18|20|22|24|26|28|30|32|34|36|38|40|42|44|46|48|50)\s*$/i, '');
    cleanTitle = cleanTitle.replace(/\s*(Black|White|Blue|Red|Green|Yellow|Pink|Purple|Orange|Brown|Gray|Grey|Navy|Beige|Cream|Ivory|Tan|Olive|Maroon|Burgundy|Rust|Coral|Teal|Turquoise|Lavender|Mint|Rose|Gold|Silver|Bronze|Copper)\s*$/i, '');
    
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
      !['product', 'item', 'clothing', 'dress', 'shirt', 'pants', 'shoes', 'accessories', 'women', 'men', 'kids', 'sale', 'new', 'trending'].includes(part.toLowerCase())
    );
    
    if (meaningfulParts.length > 0) {
      // Take the last meaningful part and clean it up
      let urlItemName = meaningfulParts[meaningfulParts.length - 1];
      urlItemName = urlItemName.replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();
      
      // Remove common URL suffixes
      urlItemName = urlItemName.replace(/\s*(html|htm|php|asp|aspx|jsp|do|action)\s*$/i, '');
      
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
    'benamun': 'Ben-Amun',
    'shopdonni': 'Donni',
    'donni': 'Donni'
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
    'paige.com': 'Paige',
    'shopdonni.com': 'Donni',
    'donni.com': 'Donni'
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
    let domainBrand = domain.split('.')[0];
    
    // Handle common domain patterns
    if (domainBrand.includes('-')) {
      // Split by hyphens and capitalize
      domainBrand = domainBrand.split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    } else if (domainBrand.length > 6) {
      // Try to intelligently split camelCase or run-together words
      // Look for common brand patterns
      const commonBrands = [
        'waxlondon', 'roheframes', 'ganni', 'reformation', 'madewell',
        'everlane', 'sezane', 'toteme', 'khaite', 'motherdenim'
      ];
      
      const lowerDomain = domainBrand.toLowerCase();
      for (const brand of commonBrands) {
        if (lowerDomain.includes(brand)) {
          // Extract the brand part and format it properly
          const brandIndex = lowerDomain.indexOf(brand);
          const beforeBrand = domainBrand.substring(0, brandIndex);
          const brandPart = domainBrand.substring(brandIndex, brandIndex + brand.length);
          const afterBrand = domainBrand.substring(brandIndex + brand.length);
          
          // Format each part
          const formattedBrand = brandPart.charAt(0).toUpperCase() + brandPart.slice(1);
          const formattedBefore = beforeBrand ? beforeBrand.charAt(0).toUpperCase() + beforeBrand.slice(1) + ' ' : '';
          const formattedAfter = afterBrand ? ' ' + afterBrand.charAt(0).toUpperCase() + afterBrand.slice(1) : '';
          
          domainBrand = formattedBefore + formattedBrand + formattedAfter;
          break;
        }
      }
      
      // If no pattern match, try to add spaces before capital letters (camelCase)
      if (domainBrand === domain.split('.')[0]) {
        domainBrand = domainBrand.replace(/([A-Z])/g, ' $1').trim();
        domainBrand = domainBrand.charAt(0).toUpperCase() + domainBrand.slice(1);
      }
    }
    
    console.log('🔍 Domain brand extraction:', { original: domain, extracted: domainBrand });
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
    console.log('Fetching from:', 'https://www.pointfour.in/api/extension/check-brand');
    
    const response = await fetch('https://www.pointfour.in/api/extension/check-brand', {
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
    const response = await fetch('https://www.pointfour.in/api/extension/test', {
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

// Function to fetch and display reviews for a brand
async function fetchAndDisplayReviews(brand, itemName) {
  try {
    console.log('🔍 Fetching reviews for brand:', brand, 'item:', itemName);
    
    const response = await fetch('https://www.pointfour.in/api/extension/get-reviews', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      mode: 'cors',
      credentials: 'omit',
      body: JSON.stringify({ brand, itemName })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('📊 Reviews data received:', data);
    
    if (data.success && data.reviews && data.reviews.length > 0) {
      displayReviews(data.reviews, data.totalReviews);
    } else {
      displayNoReviews();
    }
    
    // Return the data for chaining
    return data;
    
  } catch (error) {
    console.error('💥 Error fetching reviews:', error);
    displayReviewsError(error.message);
    throw error; // Re-throw for chaining
  }
}

// Function to display reviews in the popup
function displayReviews(reviews, totalReviews) {
  const reviewsContent = document.getElementById('reviews-content');
  
  let reviewsHTML = '';
  
  reviews.forEach((review, index) => {
    const ratingStars = '★'.repeat(review.fitRating || 0) + '☆'.repeat(5 - (review.fitRating || 0));
    const ratingText = review.fitRating ? `${review.fitRating}/5` : 'No rating';
    
    const reviewDetails = [];
    if (review.userBodyType) reviewDetails.push(`Body type: ${review.userBodyType}`);
    if (review.sizeBought) reviewDetails.push(`Size bought: ${review.sizeBought}`);
    if (review.usualSize) reviewDetails.push(`Usual size: ${review.usualSize}`);
    if (review.height) reviewDetails.push(`Height: ${review.height}`);
    
    const recommendationClass = review.wouldRecommend ? 'recommend-yes' : 'recommend-no';
    const recommendationText = review.wouldRecommend ? '✓ Would recommend' : '✗ Would not recommend';
    
    reviewsHTML += `
      <div class="review-item">
        <div class="review-header">
          <div class="review-item-name">${review.itemName || 'Unknown Item'}</div>
          <div class="review-garment-type">${review.garmentType || 'Unknown Type'}</div>
        </div>
        
        <div class="review-rating">
          <span class="rating-stars">${ratingStars}</span>
          <span class="rating-text">${ratingText}</span>
        </div>
        
        ${reviewDetails.length > 0 ? `<div class="review-details">${reviewDetails.join(' • ')}</div>` : ''}
        
        ${review.fitComments ? `<div class="review-comments">"${review.fitComments}"</div>` : ''}
        
        <div class="review-recommendation ${recommendationClass}">${recommendationText}</div>
      </div>
    `;
  });
  
  // Add total count and load more button if there are more reviews
  if (totalReviews > reviews.length) {
    reviewsHTML += `
      <div class="load-more-reviews">
        <div class="review-details">Showing ${reviews.length} of ${totalReviews} reviews</div>
        <button class="load-more-btn" onclick="loadMoreReviews()">Load More Reviews</button>
      </div>
    `;
  }
  
  reviewsContent.innerHTML = reviewsHTML;
}

// Function to display no reviews message
function displayNoReviews() {
  const reviewsContent = document.getElementById('reviews-content');
  reviewsContent.innerHTML = '<div class="no-reviews">No reviews found for this brand/item combination.</div>';
}

// Function to display reviews error
function displayReviewsError(errorMessage) {
  const reviewsContent = document.getElementById('reviews-content');
  reviewsContent.innerHTML = `<div class="no-reviews">Error loading reviews: ${errorMessage}</div>`;
}

// Function to search for reviews dynamically
async function searchForReviews(brandName, itemName = '') {
  try {
    console.log('🔍 Dynamic search initiated for brand:', brandName, 'item:', itemName);
    
    const response = await fetch('https://www.pointfour.in/api/extension/search-reviews', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      mode: 'cors',
      credentials: 'omit',
      body: JSON.stringify({ brand: brandName, itemName })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('🔍 Dynamic search results:', data);
    
    // Enhanced debugging
    if (data.success) {
      console.log('✅ Search successful:', {
        totalResults: data.totalResults,
        isFallback: data.isFallback,
        hasBrandFitSummary: !!data.brandFitSummary,
        groupedReviews: data.groupedReviews ? Object.keys(data.groupedReviews).map(key => `${key}: ${data.groupedReviews[key].length}`) : 'none'
      });
      
      if (data.isFallback) {
        console.log('⚠️ Using fallback data - Serper API may not be working');
      } else {
        console.log('🎯 Real search results from Serper API');
      }
      
      return data; // Return full data object instead of just reviews
    } else {
      console.log('No dynamic reviews found');
      return { success: false, reviews: [] };
    }
    
  } catch (error) {
    console.error('Dynamic search failed:', error);
    throw error;
  }
}

// Function to classify review relevance for better display
function classifyReviewRelevance(review, itemName, brandName) {
  if (!itemName || itemName === 'Unknown Item') {
    return { isItemSpecific: false, relevance: 'low' };
  }
  
  const text = `${review.title} ${review.snippet} ${review.fullContent || ''}`.toLowerCase();
  const itemWords = itemName.toLowerCase().split(' ').filter(word => word.length > 2);
  const brandWords = brandName.toLowerCase().split(' ').filter(word => word.length > 2);
  
  // Check for exact item name matches
  const hasExactItemMatch = itemWords.some(word => text.includes(word));
  const hasExactBrandMatch = brandWords.some(word => text.includes(word));
  
  // Check for fit/sizing keywords
  const hasFitKeywords = review.tags.some(tag => 
    tag.toLowerCase().includes('fit') || 
    tag.toLowerCase().includes('size') ||
    tag.toLowerCase().includes('sizing')
  );
  
  // Determine relevance
  if (hasExactItemMatch && hasExactBrandMatch && hasFitKeywords) {
    return { isItemSpecific: true, relevance: 'high' };
  } else if ((hasExactItemMatch || hasExactBrandMatch) && hasFitKeywords) {
    return { isItemSpecific: true, relevance: 'medium' };
  } else if (hasFitKeywords) {
    return { isItemSpecific: false, relevance: 'medium' };
  } else {
    return { isItemSpecific: false, relevance: 'low' };
  }
}

// Function to display a group of reviews
function displayReviewGroup(reviews, container, isItemSpecific = false) {
  let reviewsHTML = '';
  
  // Sort reviews by relevance if we have item name context
  const sortedReviews = [...reviews];
  if (window.currentItemName && window.currentBrandName) {
    sortedReviews.sort((a, b) => {
      const aRelevance = classifyReviewRelevance(a, window.currentItemName, window.currentBrandName);
      const bRelevance = classifyReviewRelevance(b, window.currentItemName, window.currentBrandName);
      
      if (aRelevance.isItemSpecific && !bRelevance.isItemSpecific) return -1;
      if (!aRelevance.isItemSpecific && bRelevance.isItemSpecific) return 1;
      if (aRelevance.relevance === 'high' && bRelevance.relevance !== 'high') return -1;
      if (aRelevance.relevance !== 'high' && bRelevance.relevance === 'high') return 1;
      return 0;
    });
  }
  
  sortedReviews.forEach((review, index) => {
    const sourceBadge = review.source ? `<span class="source-badge">${review.source}</span>` : '';
    const tags = review.tags && review.tags.length > 0 ? 
      `<div class="review-tags">${review.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>` : '';
    
    // Determine if this review is item-specific
    const relevance = window.currentItemName && window.currentBrandName ? 
      classifyReviewRelevance(review, window.currentItemName, window.currentBrandName) : 
      { isItemSpecific: false, relevance: 'medium' };
    
    const reviewClass = `dynamic-review ${relevance.isItemSpecific ? 'item-specific' : ''}`;
    
    reviewsHTML += `
      <div class="review-item ${reviewClass}">
        <div class="review-header">
          <div class="review-item-name">${review.title || 'Web Review'}</div>
          ${sourceBadge}
        </div>
        
        <div class="review-comments">"${review.snippet}"</div>
        ${tags}
        
        <div class="review-source">
          <small>Source: <a href="${review.url}" target="_blank" rel="noopener noreferrer">${review.source || 'Web'}</a></small>
          <span class="confidence-badge">Confidence: ${review.confidence}</span>
          ${relevance.isItemSpecific ? '<span class="relevance-badge">Item-specific</span>' : ''}
        </div>
      </div>
    `;
  });
  
  container.innerHTML += reviewsHTML;
}

// Function to load more reviews (placeholder for future implementation)
function loadMoreReviews() {
  console.log('Load more reviews functionality to be implemented');
  // TODO: Implement pagination for reviews
}

// Function to update popup with review data
async function updatePopupWithReviewData(reviewData) {
  const reviewStatusElement = document.getElementById('review-status');
  const reviewCountElement = document.getElementById('review-count');
  const fitSummarySection = document.getElementById('fit-summary-section');
  const fitSummaryElement = document.getElementById('fit-summary');
  const reviewsSection = document.getElementById('reviews-section');
  const reviewsContent = document.getElementById('reviews-content');
  
  if (!reviewStatusElement || !reviewCountElement || !fitSummarySection || !fitSummaryElement || !reviewsSection || !reviewsContent) {
    console.error('Required elements not found');
    return;
  }
  
  // Extract item name from reviewData if available
  const itemName = reviewData.itemName || null;
  
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
      
      // Show reviews section and fetch reviews
      reviewsSection.style.display = 'block';
      
      // First try to get database reviews
      fetchAndDisplayReviews(reviewData.brand, itemName).then(() => {
        // After database reviews are processed, also try dynamic search for item-specific content
        if (itemName && itemName !== 'Unknown Item') {
          console.log('Database reviews loaded, now searching for additional item-specific content:', itemName);
          
          // Perform dynamic search for this specific item
          return searchForReviews(reviewData.brand, itemName);
        }
      }).then(searchResults => {
        if (searchResults && searchResults.success && searchResults.totalResults > 0) {
          console.log('Found additional dynamic content:', searchResults.totalResults, 'results');
          
          // Add dynamic content to the existing reviews
          const reviewsContent = document.getElementById('reviews-content');
          if (reviewsContent) {
            // Add separator
            reviewsContent.innerHTML += '<hr style="margin: 20px 0; border: 1px solid #e7e5e4;">';
            reviewsContent.innerHTML += '<h4 style="margin: 16px 0 8px 0; font-size: 13px; color: #78716c; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Additional Web Reviews</h4>';
            
            // Display dynamic reviews
            displayDynamicReviews(searchResults);
          }
        }
      }).catch(error => {
        console.error('Dynamic search after database reviews failed:', error);
      });
      
    } else {
      // Has brand data but NO reviews
      reviewStatusElement.innerHTML = '<span class="status-available">ℹ️ Brand data available</span>';
      reviewCountElement.textContent = 'Brand info available - No reviews yet';
      reviewsSection.style.display = 'none';
      
      // NEW: Even with database brand data, try to get item-specific reviews
      if (itemName && itemName !== 'Unknown Item') {
        console.log('Brand data available but no reviews - trying dynamic search for item:', itemName);
        
        // Show loading state for item search
        reviewCountElement.textContent = 'Brand info available - Searching for item-specific reviews...';
        
        // Perform dynamic search for this specific item
        searchForReviews(reviewData.brand, itemName).then(searchResults => {
          if (searchResults.success && searchResults.totalResults > 0) {
            // Show dynamic reviews alongside brand data
            reviewCountElement.textContent = `Brand info + ${searchResults.totalResults} item reviews found`;
            reviewsSection.style.display = 'block';
            displayDynamicReviews(searchResults);
          } else {
            reviewCountElement.textContent = 'Brand info available - No item-specific reviews found';
          }
        }).catch(error => {
          console.error('Item search failed:', error);
          reviewCountElement.textContent = 'Brand info available - Item search failed';
        });
      }
    }
  } else if (reviewData && !reviewData.hasData) {
    // Check if dynamic search is enabled
    const dynamicSearchToggle = document.getElementById('dynamic-search-toggle');
    const isDynamicSearchEnabled = dynamicSearchToggle ? dynamicSearchToggle.checked : true;
    
    if (isDynamicSearchEnabled) {
      // NEW: Trigger dynamic search when no Airtable data
      console.log('No Airtable data for brand:', reviewData.brand, '- initiating dynamic search');
      
      // Show loading state
      reviewStatusElement.innerHTML = '<span class="status-loading">🔄 Searching for reviews...</span>';
      reviewCountElement.textContent = 'Searching the web for reviews...';
      fitSummarySection.style.display = 'none';
      reviewsSection.style.display = 'none';
      
      try {
        // Perform dynamic search
        const searchResults = await searchForReviews(reviewData.brand, itemName);
        
        if (searchResults.success && searchResults.totalResults > 0) {
          // Show dynamic reviews
          const statusText = searchResults.isFallback ? '🔍 Fallback reviews found' : '🔍 Dynamic reviews found';
          const countText = searchResults.isFallback 
            ? `${searchResults.totalResults} fallback results` 
            : `${searchResults.totalResults} live search results`;
          
          reviewStatusElement.innerHTML = `<span class="status-available">${statusText}</span>`;
          reviewCountElement.textContent = countText;
          
          // Display dynamic reviews
          displayDynamicReviews(searchResults);
          reviewsSection.style.display = 'block';
        } else {
          // No dynamic reviews found
          reviewStatusElement.innerHTML = '<span class="status-unavailable">❌ No reviews found</span>';
          reviewCountElement.textContent = 'No reviews found in database or web search';
          reviewsSection.style.display = 'none';
        }
      } catch (error) {
        console.error('Dynamic search failed:', error);
        reviewStatusElement.innerHTML = '<span class="status-unavailable">❌ Search failed</span>';
        reviewCountElement.textContent = 'Dynamic search failed - try again later';
        reviewsSection.style.display = 'none';
      }
    } else {
      // Dynamic search is disabled
      reviewStatusElement.innerHTML = '<span class="status-unavailable">❌ No brand data yet</span>';
      reviewCountElement.textContent = 'This brand is not in our database (live search disabled)';
      fitSummarySection.style.display = 'none';
      reviewsSection.style.display = 'none';
    }
  } else {
    reviewStatusElement.innerHTML = '<span class="status-loading">🔄 Checking...</span>';
    reviewCountElement.textContent = '';
    fitSummarySection.style.display = 'none';
    reviewsSection.style.display = 'none';
  }
}

// Function to display dynamic reviews
function displayDynamicReviews(searchResults) {
  const reviewsContent = document.getElementById('reviews-content');
  
  // Show notification that these are dynamic results
  const notification = document.createElement('div');
  const isFallback = searchResults.isFallback || false;
  notification.className = isFallback ? 'dynamic-notification fallback' : 'dynamic-notification';
  notification.innerHTML = isFallback 
    ? '⚠️ <strong>Fallback Results</strong> - Showing sample data while we resolve API access. Real search results coming soon!'
    : '🔍 <strong>Live Search Results</strong> - These reviews were found through web search, not from our database';
  reviewsContent.appendChild(notification);
  
  // Display brand fit summary if available
  if (searchResults.brandFitSummary) {
    const summaryHTML = `
      <div class="brand-fit-summary">
        <h4>Brand Fit Summary</h4>
        <div class="summary-content">
          <div class="summary-text">${searchResults.brandFitSummary.summary}</div>
          <div class="summary-meta">
            <span class="confidence-badge">Confidence: ${searchResults.brandFitSummary.confidence}</span>
            <span class="sources">Sources: ${searchResults.brandFitSummary.sources.join(', ')}</span>
          </div>
        </div>
      </div>
    `;
    reviewsContent.innerHTML += summaryHTML;
  }
  
  // Group reviews by source type and relevance
  const groupedReviews = searchResults.groupedReviews || {};
  
  // Separate item-specific reviews from general brand reviews
  const itemSpecificReviews = searchResults.reviews.filter(r => 
    r.tags.some(tag => tag.toLowerCase().includes('fit') || tag.toLowerCase().includes('size')) &&
    !r.brandLevel
  );
  
  const generalBrandReviews = searchResults.reviews.filter(r => 
    r.brandLevel || !r.tags.some(tag => tag.toLowerCase().includes('fit') || tag.toLowerCase().includes('size'))
  );
  
  // Display item-specific reviews first (most relevant)
  if (itemSpecificReviews.length > 0) {
    reviewsContent.innerHTML += '<h4>Item-Specific Reviews</h4>';
    displayReviewGroup(itemSpecificReviews, reviewsContent, true);
  }
  
  // Display primary sources first (Reddit and Substack - most detailed content)
  if (groupedReviews.primary && groupedReviews.primary.length > 0) {
    reviewsContent.innerHTML += '<h4>Primary Sources (Reddit & Substack)</h4>';
    displayReviewGroup(groupedReviews.primary, reviewsContent);
  }
  
  // Display community reviews (Style Forum, Fashion Spot, etc.)
  if (groupedReviews.community && groupedReviews.community.length > 0) {
    reviewsContent.innerHTML += '<h4>Community Reviews</h4>';
    displayReviewGroup(groupedReviews.community, reviewsContent);
  }
  
  // Display blog reviews
  if (groupedReviews.blogs && groupedReviews.blogs.length > 0) {
    reviewsContent.innerHTML += '<h4>Blog Reviews</h4>';
    displayReviewGroup(groupedReviews.blogs, reviewsContent);
  }
  
  // Display video reviews
  if (groupedReviews.videos && groupedReviews.videos.length > 0) {
    reviewsContent.innerHTML += '<h4>Video Reviews</h4>';
    displayReviewGroup(groupedReviews.videos, reviewsContent);
  }
  
  // Display fashion publication reviews
  if (groupedReviews.publications && groupedReviews.publications.length > 0) {
    reviewsContent.innerHTML += '<h4>Fashion Publications</h4>';
    displayReviewGroup(groupedReviews.publications, reviewsContent);
  }
  
  // Display social media reviews (reduced priority)
  if (groupedReviews.social && groupedReviews.social.length > 0) {
    reviewsContent.innerHTML += '<h4>Social Media</h4>';
    displayReviewGroup(groupedReviews.social, reviewsContent);
  }
  
  // Display other reviews
  if (groupedReviews.other && groupedReviews.other.length > 0) {
    reviewsContent.innerHTML += '<h4>Other Sources</h4>';
    displayReviewGroup(groupedReviews.other, reviewsContent);
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
    
    // Store globally for review relevance classification
    window.currentItemName = itemName;
    window.currentBrandName = normalizedBrand;
    
    console.log('Detected brand:', detectedBrand);
    console.log('Normalized brand:', normalizedBrand);
    
    // Update popup with detected information
    updatePopup(itemName, normalizedBrand);
    
    // Check if we have review data for this brand
    if (normalizedBrand && normalizedBrand !== 'Unknown Brand') {
      try {
        console.log('🔍 Checking brand data for:', normalizedBrand);
        console.log('🌐 API endpoint: https://www.pointfour.in/api/extension/check-brand');
        
        const response = await fetch('https://www.pointfour.in/api/extension/check-brand', {
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
          updatePopupWithReviewData({ ...data, itemName });
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
  
  // Add event listener for dynamic search toggle
  const dynamicSearchToggle = document.getElementById('dynamic-search-toggle');
  if (dynamicSearchToggle) {
    // Load saved preference
    const savedPreference = localStorage.getItem('dynamicSearchEnabled');
    if (savedPreference !== null) {
      dynamicSearchToggle.checked = savedPreference === 'true';
    }
    
    // Save preference when changed
    dynamicSearchToggle.addEventListener('change', function() {
      localStorage.setItem('dynamicSearchEnabled', this.checked.toString());
      console.log('Dynamic search enabled:', this.checked);
    });
  }
});