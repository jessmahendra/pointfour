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
async function detectBrand(tabId, domainOrBrand, url) {
  try {
    console.log('🎯 Background: detectBrand called with:', { tabId, domainOrBrand, url });
    
    // Check cache first
    const cacheKey = `${domainOrBrand}_${url}`;
    if (brandCache.has(cacheKey)) {
      const cached = brandCache.get(cacheKey);
      if (Date.now() - cached.timestamp < BRAND_CACHE_DURATION) {
        console.log('🎯 Background: Using cached brand data for:', domainOrBrand);
        sendBrandDataToTab(tabId, cached.data);
        return;
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
    console.log('🎯 Background: Calling fetchBrandData for:', brandName, 'category:', category);
    const brandData = await fetchBrandData(brandName, category);
    console.log('🎯 Background: fetchBrandData returned:', brandData);
    
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
        // externalSearchResults: null,
        // fitTips: [],
        // sizeGuide: null,
        // timestamp: Date.now(),
        // error: false,
        // noFitAdvice: true
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
        brand: brandName, // API expects 'brand' not 'brandName'
        itemName: '',
        category
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API response not ok:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Brand data fetched successfully:', data);
    
    // DEBUG: Log detailed information about what we received
    console.log('🔍 DEBUG: API Response Details:');
    console.log('  - Total Results:', data.totalResults);
    console.log('  - Has Reviews:', !!data.reviews);
    console.log('  - Reviews Count:', data.reviews ? data.reviews.length : 0);
    console.log('  - Has Brand Fit Summary:', !!data.brandFitSummary);
    if (data.brandFitSummary) {
      console.log('  - Brand Fit Summary:', data.brandFitSummary);
    }
    if (data.reviews && data.reviews.length > 0) {
      console.log('  - Sample Review:', data.reviews[0]);
      console.log('  - Review Sources:', data.reviews.map(r => r.source || 'no-source').slice(0, 5));
    }
    console.log('  - Is Fallback:', data.isFallback || false);
    console.log('  - API Endpoint Used:', 'search-reviews');

    // Check if the API returned an error
    if (data.error) {
      console.error('API returned error:', data.error);
      throw new Error(data.error);
    }

    // Generate recommendation from the data using enhanced analysis
    let recommendation = `Fit information available for ${brandName}`;
    
    // Always prioritize our enhanced analysis over potentially generic API summaries
    if (data.totalResults > 0 && data.reviews && data.reviews.length > 0) {
      // ALWAYS analyze the review content for fit mentions, regardless of tags
      const fitMentions = analyzeFitMentions(data.reviews);
      console.log('🔍 DEBUG: Fit analysis results:', fitMentions);
      
      if (fitMentions.total > 0) {
        // We found fit-related content, use our enhanced analysis
        recommendation = generateSpecificRecommendation(brandName, fitMentions);
        console.log('✅ Using enhanced analysis:', recommendation);
      } else {
        // No fit mentions found in content, provide generic guidance
        recommendation = `Found ${data.totalResults} reviews for ${brandName}, but limited specific fit information. Reviews focus on quality, style, or general experience.`;
        console.log('⚠️ No fit mentions found, using generic guidance');
      }
    } else if (data.brandFitSummary && data.brandFitSummary.summary) {
      // Only use API summary if it's not generic and we have no reviews
      const summary = data.brandFitSummary.summary;
      if (!summary.includes('runs small') || !summary.includes('consider sizing up')) {
        recommendation = summary;
        console.log('✅ Using non-generic API summary:', summary);
      } else {
        recommendation = `Limited information available for ${brandName}. We searched but found no specific reviews or fit information. Try searching for a different brand or check back later.`;
        console.log('❌ Rejected generic API summary, using fallback');
      }
    } else {
      recommendation = `Limited information available for ${brandName}. We searched but found no specific reviews or fit information. Try searching for a different brand or check back later.`;
      console.log('⚠️ No data available, using fallback message');
    }

    // Extract fit tips from reviews - be more aggressive in finding meaningful advice
    const fitTips = [];
    if (data.reviews && data.reviews.length > 0) {
      // Look for reviews with fit-related content, not just high-confidence tags
      const fitReviews = data.reviews.filter(review => {
        const text = (review.snippet || review.content || '').toLowerCase();
        return text.includes('fit') || text.includes('size') || text.includes('runs') || 
               text.includes('sizing') || text.includes('measurements') || text.includes('body type');
      });
      
      // Extract meaningful fit tips from the first few fit-related reviews
      fitReviews.slice(0, 5).forEach(review => {
        if (review.snippet && review.snippet.length > 20) {
          // Clean up the snippet to make it more readable
          let tip = review.snippet;
          
          // Remove common generic phrases
          tip = tip.replace(/(click here|read more|continue reading|share this|follow us)/gi, '');
          tip = tip.replace(/\s+/g, ' ').trim();
          
          // Extract specific fit advice if present
          const specificAdvice = extractSpecificFitAdvice(tip);
          if (specificAdvice) {
            tip = specificAdvice;
          }
          
          // Truncate if too long
          if (tip.length > 120) {
            tip = tip.substring(0, 120) + '...';
          }
          
          // Only add if it's meaningful and contains specific advice
          if (tip.length > 15 && !tip.includes('advertisement') && hasSpecificFitContent(tip)) {
            // Avoid duplicate tips
            if (!fitTips.some(existingTip => 
              existingTip.toLowerCase().includes(tip.toLowerCase().substring(0, 20)) ||
              tip.toLowerCase().includes(existingTip.toLowerCase().substring(0, 20))
            )) {
              fitTips.push(tip);
            }
          }
        }
      });
    }

    return {
      brandName,
      category,
      hasData: data.totalResults > 0,
      searchType: 'search-reviews',
      recommendation: recommendation,
      externalSearchResults: {
        brandFitSummary: data.brandFitSummary,
        reviews: data.reviews || [],
        groupedReviews: data.groupedReviews || {},
        totalResults: data.totalResults || 0,
        isFallback: data.isFallback || false
      },
      fitTips: fitTips,
      sizeGuide: null,
      timestamp: Date.now(),
      error: false
    };

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

// Helper method to analyze fit mentions in reviews
function analyzeFitMentions(reviews) {
  const analysis = {
    runsSmall: 0,
    runsLarge: 0,
    trueToSize: 0,
    inconsistent: 0,
    categorySpecific: 0,
    total: 0
  };

  if (!reviews || !Array.isArray(reviews)) {
    return analysis;
  }

  reviews.forEach(review => {
    if (!review.snippet && !review.content) return;

    const text = (review.snippet || review.content || '').toLowerCase();
    
    // Count different types of fit mentions - be more aggressive in detection
    if (text.includes('runs small') || text.includes('size up') || text.includes('fits small') || 
        text.includes('too small') || text.includes('tight fit') || text.includes('smaller than expected') ||
        text.includes('had to size up') || text.includes('needed to size up') || text.includes('sized up') ||
        text.includes('fits snug') || text.includes('snug fit') || text.includes('tight') ||
        text.includes('smaller') || text.includes('too tight') || text.includes('fits tight') ||
        text.includes('go one size up') || text.includes('could have gone one size up') ||
        text.includes('recommend sizing up') || text.includes('suggest sizing up')) {
      analysis.runsSmall++;
      analysis.total++;
    }
    
    if (text.includes('runs large') || text.includes('size down') || text.includes('fits large') ||
        text.includes('too big') || text.includes('loose fit') || text.includes('oversized') ||
        text.includes('larger than expected') || text.includes('had to size down') || 
        text.includes('needed to size down') || text.includes('sized down') ||
        text.includes('fits loose') || text.includes('loose') || text.includes('too loose') ||
        text.includes('baggy') || text.includes('oversized fit') ||
        text.includes('go one size down') || text.includes('recommend sizing down') ||
        text.includes('suggest sizing down')) {
      analysis.runsLarge++;
      analysis.total++;
    }
    
    if (text.includes('true to size') || text.includes('fits true') || text.includes('tts') ||
        text.includes('standard sizing') || text.includes('normal fit') || text.includes('fits as expected') ||
        text.includes('fits perfectly') || text.includes('exact fit') || text.includes('usual size') ||
        text.includes('normal size') || text.includes('fits like a glove') || text.includes('perfect fit') ||
        text.includes('fits just right') || text.includes('standard fit') || text.includes('fit as expected') ||
        text.includes('sizing is true to size') || text.includes('true to size sizing') ||
        text.includes('fits normally') || text.includes('standard fit')) {
      analysis.trueToSize++;
      analysis.total++;
    }
    
    if (text.includes('inconsistent') || text.includes('varies') || text.includes('depends on') ||
        text.includes('sometimes') || text.includes('hit or miss') || text.includes('unpredictable') ||
        text.includes('mixed') || text.includes('depends') || text.includes('varies by') ||
        text.includes('unreliable') || text.includes('inconsistent sizing') ||
        text.includes('depends on how you want to wear') || text.includes('varies by style') ||
        text.includes('mixed reviews') || text.includes('depends on the item')) {
      analysis.inconsistent++;
      analysis.total++;
    }
    
    if (text.includes('dresses') || text.includes('tops') || text.includes('bottoms') ||
        text.includes('jeans') || text.includes('shirts') || text.includes('pants') ||
        text.includes('skirts') || text.includes('outerwear') || text.includes('blouses') ||
        text.includes('sweaters') || text.includes('jackets') || text.includes('coats') ||
        text.includes('normal shirt') || text.includes('oversized fit') || text.includes('fitted style')) {
      analysis.categorySpecific++;
      analysis.total++;
    }
  });

  console.log('🔍 DEBUG: Fit analysis breakdown:', analysis);
  return analysis;
}

// Helper method to generate specific recommendations based on fit analysis
function generateSpecificRecommendation(brandName, fitMentions) {
  const { runsSmall, runsLarge, trueToSize, inconsistent, categorySpecific, total } = fitMentions;
  
  // Find the most common pattern
  const patterns = [
    { type: 'runs small', count: runsSmall },
    { type: 'runs large', count: runsLarge },
    { type: 'true to size', count: trueToSize },
    { type: 'inconsistent', count: inconsistent },
    { type: 'category specific', count: categorySpecific }
  ].filter(p => p.count > 0).sort((a, b) => b.count - a.count);

  if (patterns.length === 0) {
    return `Found fit information for ${brandName}, but no clear sizing pattern emerged. Check individual reviews for specific advice.`;
  }

  const topPattern = patterns[0];
  const percentage = Math.round((topPattern.count / total) * 100);
  
  let recommendation = '';
  
  switch (topPattern.type) {
    case 'runs small':
      if (percentage >= 70) {
        recommendation = `Based on ${total} reviews, ${brandName} consistently runs small (${percentage}% of mentions). Consider sizing up for a comfortable fit.`;
      } else if (percentage >= 50) {
        recommendation = `Based on ${total} reviews, ${brandName} tends to run small (${percentage}% of mentions). Most reviewers recommend sizing up.`;
      } else {
        recommendation = `Based on ${total} reviews, ${brandName} has mixed sizing with ${percentage}% reporting it runs small. Check individual reviews for specific advice.`;
      }
      break;
      
    case 'runs large':
      if (percentage >= 70) {
        recommendation = `Based on ${total} reviews, ${brandName} consistently runs large (${percentage}% of mentions). Consider sizing down for a better fit.`;
      } else if (percentage >= 50) {
        recommendation = `Based on ${total} reviews, ${brandName} tends to run large (${percentage}% of mentions). Most reviewers recommend sizing down.`;
      } else {
        recommendation = `Based on ${total} reviews, ${brandName} has mixed sizing with ${percentage}% reporting it runs large. Check individual reviews for specific advice.`;
      }
      break;
      
    case 'true to size':
      if (percentage >= 70) {
        recommendation = `Based on ${total} reviews, ${brandName} consistently runs true to size (${percentage}% of mentions). You can typically order your usual size.`;
      } else if (percentage >= 50) {
        recommendation = `Based on ${total} reviews, ${brandName} generally runs true to size (${percentage}% of mentions). Most reviewers found the sizing accurate.`;
      } else {
        recommendation = `Based on ${total} reviews, ${brandName} has mixed sizing with ${percentage}% reporting it runs true to size. Check individual reviews for specific advice.`;
      }
      break;
      
    case 'inconsistent':
      recommendation = `Based on ${total} reviews, sizing for ${brandName} can be inconsistent (${percentage}% of mentions). It's recommended to check specific item reviews or size charts.`;
      break;
      
    case 'category specific':
      recommendation = `Based on ${total} reviews, sizing for ${brandName} varies by category (${percentage}% of mentions). Check individual item reviews for specific fit advice.`;
      break;
      
    default:
      recommendation = `Found ${total} reviews with fit information for ${brandName}. Check individual reviews for specific sizing advice.`;
  }

  // Add context about other patterns if they exist
  const otherPatterns = patterns.slice(1).filter(p => p.count > 0);
  if (otherPatterns.length > 0) {
    const otherMentions = otherPatterns.map(p => `${p.count} ${p.type.replace(' ', ' ')}`).join(', ');
    recommendation += ` Other patterns found: ${otherMentions}.`;
  }

  return recommendation;
}

// Helper function to extract specific fit advice from text
function extractSpecificFitAdvice(text) {
  const lowerText = text.toLowerCase();
  
  // Look for specific fit patterns and extract the relevant part
  const fitPatterns = [
    /(?:runs small|fits small|too small|tight fit).*?(?:\.|$)/i,
    /(?:runs large|fits large|too big|loose fit).*?(?:\.|$)/i,
    /(?:true to size|fits true|tts|standard sizing).*?(?:\.|$)/i,
    /(?:size up|size down).*?(?:\.|$)/i,
    /(?:measurements|bust|waist|hips|length).*?(?:\.|$)/i,
    /(?:body type|height|weight|petite|tall|curvy).*?(?:\.|$)/i
  ];
  
  for (const pattern of fitPatterns) {
    const match = text.match(pattern);
    if (match) {
      let advice = match[0].trim();
      
      // Clean up the advice
      advice = advice.replace(/^\s*(?:and|but|however|though|,)\s*/i, '');
      advice = advice.replace(/\s+/g, ' ').trim();
      
      // Only return if it's meaningful
      if (advice.length > 15 && advice.length < 200) {
        return advice;
      }
    }
  }
  
  return null;
}

// Helper function to check if text contains specific fit content
function hasSpecificFitContent(text) {
  const lowerText = text.toLowerCase();
  
  // Check for specific fit keywords that indicate actionable advice
  const specificFitKeywords = [
    'runs small', 'runs large', 'true to size', 'size up', 'size down',
    'fits small', 'fits large', 'fits true', 'too small', 'too big',
    'tight fit', 'loose fit', 'measurements', 'bust', 'waist', 'hips',
    'body type', 'height', 'weight', 'petite', 'tall', 'curvy',
    'fits snug', 'snug fit', 'fits loose', 'oversized', 'fits perfectly',
    'usual size', 'normal size', 'had to size', 'needed to size',
    'fits like a glove', 'perfect fit', 'exact fit', 'standard fit'
  ];
  
  // Also check for more general but still relevant fit terms
  const generalFitTerms = [
    'fit', 'sizing', 'runs', 'fits', 'size', 'measurements',
    'tight', 'loose', 'small', 'large', 'perfect', 'comfortable'
  ];
  
  // Check for specific keywords first (higher priority)
  const hasSpecificKeywords = specificFitKeywords.some(keyword => lowerText.includes(keyword));
  
  // If no specific keywords, check for general terms but require more context
  if (!hasSpecificKeywords) {
    const hasGeneralTerms = generalFitTerms.some(term => lowerText.includes(term));
    // Only consider it fit content if it has multiple general terms (indicating more context)
    const generalTermCount = generalFitTerms.filter(term => lowerText.includes(term)).length;
    return hasGeneralTerms && generalTermCount >= 2;
  }
  
  return hasSpecificKeywords;
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
  
  if (message.type === 'GET_BRAND_DATA') {
    const tabId = sender.tab.id;
    const { brandName, url, title } = message;
    
    console.log('🎯 Background: GET_BRAND_DATA requested for:', brandName, 'on tab:', tabId);
    console.log('🎯 Background: Message details:', { brandName, url, title });
    console.log('🎯 Background: Sender tab info:', sender.tab);
    
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
    console.log('🎯 Background: Calling detectBrand with:', { tabId, brandName, url });
    
    // Start the detection process but don't wait for it to complete
    // The response will be sent via sendBrandDataToTab when detection completes
    detectBrand(tabId, brandName, url).catch(error => {
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
