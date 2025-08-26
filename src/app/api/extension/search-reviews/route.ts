import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// TEMPORARY: Bypass SSL certificate validation for google.serper.dev DNS issue
// Remove this once Serper fixes their DNS/certificate configuration
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000, // 30 second timeout
});

interface SerperResult {
  title?: string;
  snippet?: string;
  link?: string;
  displayed_link?: string;
}

interface Review {
  title: string;
  snippet: string;
  url: string;
  source: string;
  tags: string[];
  confidence: "high" | "medium" | "low";
  brandLevel: boolean;
  fullContent: string;
}

interface DirectFitAdvice {
  hasDirectAdvice: boolean;
  advice: string[];
  recommendation: string | null;
  confidence: 'low' | 'medium' | 'high';
}

interface AnalysisResult {
  fit?: {
    recommendation: string;
    confidence: 'low' | 'medium' | 'high';
    evidence: string[];
  };
  quality?: {
    recommendation: string;
    confidence: 'low' | 'medium' | 'high';
    evidence: string[];
  };
  fabric?: {
    recommendation: string;
    confidence: 'low' | 'medium' | 'high';
    evidence: string[];
  };
  washCare?: {
    recommendation: string;
    confidence: 'low' | 'medium' | 'high';
    evidence: string[];
  };
  materials?: {
    composition: string[];
    confidence: 'low' | 'medium' | 'high';
    evidence: string[];
  };
  overallConfidence?: 'low' | 'medium' | 'high';
}

// Product category detection
function detectProductCategory(brand: string, itemName: string = ''): 'clothing' | 'bags' | 'shoes' | 'accessories' | 'general' {
  const text = `${brand} ${itemName}`.toLowerCase();
  
  console.log('🏷️ CATEGORY DETECTION:', {
    brand: brand,
    itemName: itemName,
    searchText: text
  });
  
  // Known bag brands (brands that primarily make bags/backpacks)
  const bagBrands = [
    'evergoods', 'peak design', 'bellroy', 'away', 'rimowa', 'tumi',
    'osprey', 'patagonia black hole', 'arc\'teryx', 'mystery ranch',
    'goruck', 'fjallraven kanken', 'herschel', 'jansport', 'eastpak',
    'thule', 'incase', 'chrome', 'timbuk2', 'manhattan portage'
  ];
  
  // Check if brand is a known bag brand
  if (bagBrands.some(bagBrand => text.includes(bagBrand))) {
    console.log('🏷️ FINAL CATEGORY: bags (matched known bag brand) for:', brand);
    return 'bags';
  }
  
  // Bag indicators by keywords
  if (text.includes('bag') || text.includes('handbag') || text.includes('purse') || text.includes('wallet') || 
      text.includes('backpack') || text.includes('tote') || text.includes('clutch') || text.includes('crossbody') ||
      text.includes('satchel') || text.includes('messenger') || text.includes('briefcase') ||
      text.includes('duffel') || text.includes('carry-on') || text.includes('luggage')) {
    return 'bags';
  }
  
  // Shoe indicators
  if (text.includes('shoe') || text.includes('boot') || text.includes('sneaker') || text.includes('heel') ||
      text.includes('sandal') || text.includes('loafer') || text.includes('oxford') || text.includes('footwear')) {
    return 'shoes';
  }
  
  // Accessory indicators
  if (text.includes('jewelry') || text.includes('watch') || text.includes('belt') || text.includes('scarf') ||
      text.includes('sunglasses') || text.includes('hat') || text.includes('gloves') || text.includes('earring') ||
      text.includes('necklace') || text.includes('bracelet') || text.includes('ring')) {
    return 'accessories';
  }
  
  // Clothing indicators (or default)
  if (text.includes('dress') || text.includes('shirt') || text.includes('pants') || text.includes('jacket') ||
      text.includes('sweater') || text.includes('blouse') || text.includes('skirt') || text.includes('jeans') ||
      text.includes('coat') || text.includes('top') || text.includes('clothing') || text.includes('apparel') ||
      text.includes('tee') || text.includes('t-shirt') || text.includes('cotton') || text.includes('silk') ||
      text.includes('denim') || text.includes('knit') || text.includes('fabric') || text.includes('garment')) {
    return 'clothing';
  }
  
  // Known shoe brands that don't have obvious category indicators in their name
  const shoeBrands = [
    'norda', 'hoka', 'salomon', 'merrell', 'altra', 'topo', 'la sportiva',
    'scarpa', 'mammut', 'dynafit', 'tecnica', 'arc\'teryx', 'patagonia',
    'black diamond', 'petzl', 'mammut', 'rab', 'montane', 'haglofs',
    'on', 'on running', 'allbirds', 'veja', 'golden goose', 'common projects'
  ];
  
  // Known clothing/fashion brands that don't have obvious category indicators in their name
  const clothingBrands = [
    'proche', 'celine', 'ganni', 'staud', 'reformation', 'nanushka', 'toteme',
    'arket', 'cos', 'acne', 'mansur gavriel', 'khaite', 'lemaire', 'jacquemus',
    'marine serre', 'gauchere', 'cecilie bahnsen', 'simone rocha', 'rejina pyo',
    'me+em', 'me em', 'uniqlo', 'zara', 'h&m', 'mango', 'massimo dutti', 'everlane'
  ];
  
  const brandLower = brand.toLowerCase().trim();
  if (shoeBrands.includes(brandLower)) {
    return 'shoes';
  }
  if (clothingBrands.includes(brandLower)) {
    return 'clothing';
  }
  
  return 'general';
}

// Calculate string similarity using Levenshtein distance
function calculateStringSimilarity(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  
  // Create a matrix to store distances
  const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(null));
  
  // Initialize first row and column
  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;
  
  // Calculate distances
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,       // deletion
        matrix[i][j - 1] + 1,       // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }
  
  // Return similarity as percentage
  const maxLen = Math.max(len1, len2);
  return maxLen === 0 ? 1 : (maxLen - matrix[len1][len2]) / maxLen;
}

// Detect if user is searching for a specific item rather than just a brand
function detectSpecificItemSearch(brand: string, itemName: string = ''): boolean {
  const text = `${brand} ${itemName}`.toLowerCase();
  
  // Look for specific item descriptors that suggest the user is looking for a particular product
  const specificItemIndicators = [
    // Material descriptors
    'wool', 'cotton', 'silk', 'linen', 'cashmere', 'merino', 'organic cotton',
    'polyester', 'nylon', 'spandex', 'modal', 'tencel', 'bamboo',
    
    // Specific garment types with descriptors
    't-shirt', 'tshirt', 'tee shirt', 'button down', 'button-down',
    'crew neck', 'v-neck', 'tank top', 'long sleeve', 'short sleeve',
    'midi dress', 'maxi dress', 'mini dress', 'wrap dress',
    'skinny jeans', 'straight leg', 'wide leg', 'high waist',
    'cropped pants', 'straight pants', 'palazzo pants',
    'cardigan', 'pullover', 'hoodie', 'zip-up',
    'blazer', 'trench coat', 'puffer jacket', 'bomber jacket',
    
    // Colors and patterns
    'black', 'white', 'navy', 'striped', 'polka dot', 'floral',
    'plaid', 'checkered', 'solid color',
    
    // Style descriptors
    'oversized', 'fitted', 'loose', 'tight', 'relaxed', 'tailored',
    'vintage', 'classic', 'modern', 'minimalist',
    
    // Specific product names or collections
    'frames', 'perfect tee', 'essential', 'basic', 'staple'
  ];
  
  // Check if the search contains specific item descriptors
  const hasSpecificDescriptors = specificItemIndicators.some(indicator => 
    text.includes(indicator)
  );
  
  // Also check if itemName has substantial content (more than just the brand name)
  const hasSubstantialItemName = itemName.length > 0 && 
    itemName.toLowerCase() !== brand.toLowerCase() &&
    itemName.split(' ').length > 1;
  
  return hasSpecificDescriptors || hasSubstantialItemName;
}

function generateSearchQueries(brand: string, category: 'clothing' | 'bags' | 'shoes' | 'accessories' | 'general', itemName: string = '', isSpecificItem: boolean = false): string[] {
  // Base queries for each category
  const baseQueries = (() => {
    switch (category) {
      case 'bags':
        return [
          `${brand} bag review quality "well made" OR "poorly made" OR "durable"`,
          `${brand} handbag quality leather material construction review`,
          `${brand} bag "holds up" OR "falling apart" OR "worth it" review`
        ];
      
      case 'shoes':
        return [
          `${brand} shoes fit review "runs small" OR "runs large" OR "true to size"`,
          `${brand} shoe quality comfort "uncomfortable" OR "comfortable" review`,
          `${brand} footwear durability "lasted" OR "wore out" review`
        ];
      
      case 'accessories':
        return [
          `${brand} accessory quality review "well made" OR "cheap" OR "durable"`,
          `${brand} jewelry watch quality "tarnish" OR "scratches" OR "holds up"`,
          `${brand} accessory "worth it" OR "overpriced" review`
        ];
      
      case 'clothing':
      default:
        return [
          `"${brand}" "runs small" OR "runs large" OR "true to size" OR "size up" OR "size down"`,
          `"${brand}" "fit" review "tight" OR "loose" OR "perfect" OR "weird" sizing`,
          `"${brand}" "quality" "fabric" "material" "cotton" OR "wool" OR "polyester"`,
          `"${brand}" "shrinks" OR "shrink" OR "wash" OR "care" OR "dry clean"`,
          `"${brand}" site:reddit.com fit size review`,
          `"${brand}" review "disappointed" OR "impressed" OR "worth it" OR "overpriced"`
        ];
    }
  })();

  // Add platform-specific queries to target high-quality fashion content
  const platformQueries = [
    `"${brand}" site:substack.com review fit quality`,
    `"${brand}" site:reddit.com "runs small" OR "runs large" OR "true to size"`,
    `"${brand}" site:youtube.com review "fit" OR "size" OR "quality"`,
    `"${brand}" fashion blog review fit sizing`,
    `"${brand}" "wardrobe" OR "closet" review fit size`,
  ];

  // If this is a specific item search, add item-focused queries with exact matching
  if (isSpecificItem && itemName) {
    const specificItemQueries = [
      `"${brand} ${itemName}" review`,
      `"${brand} ${itemName}" fit "runs small" OR "runs large" OR "true to size"`,
      `"${brand} ${itemName}" quality "well made" OR "poorly made"`,
      `"${brand} ${itemName}" material fabric composition`,
      `"${brand} ${itemName}" "100%" OR "cotton" OR "wool" OR "silk" OR "polyester" OR "blend"`,
      `"${brand} ${itemName}" site:substack.com review`,
      `"${brand} ${itemName}" site:reddit.com review`
    ];
    
    // For clothing items, add more specific material queries
    if (category === 'clothing') {
      specificItemQueries.push(
        `"${brand} ${itemName}" "merino wool" OR "organic cotton" OR "cashmere" OR "linen"`,
        `"${brand} ${itemName}" care instructions washing shrink`
      );
    }
    
    // Return ONLY specific item queries - don't include generic brand queries
    return specificItemQueries;
  }
  
  // For general brand searches, include both base queries and platform-specific queries
  return [...baseQueries, ...platformQueries];
}

// Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(request: NextRequest) {
  let brand = ''; // Declare brand outside try block for error handling
  
  try {
    const body = await request.json();
    const brandData = body.brand;
    const extractedData = body.extractedData;
    const pageData = body.pageData;
    
    brand = brandData;
    
    if (!brand) {
      return NextResponse.json({ error: 'Brand name is required' }, { status: 400 });
    }

    // Log extracted data for debugging
    if (extractedData) {
      console.log('🔍 EXTRACTED DATA: Received from browser extension:', JSON.stringify(extractedData, null, 2));
    }
    
    if (pageData) {
      console.log('📄 PAGE DATA: Enhanced detection results:', JSON.stringify(pageData, null, 2));
    }
    
    // Log specific size guide and materials data if present
    if (extractedData?.materials) {
      console.log('🧵 MATERIALS EXTRACTED:', {
        composition: extractedData.materials.composition,
        careInstructions: extractedData.materials.careInstructions,
        confidence: extractedData.materials.confidence
      });
    }
    
    if (extractedData?.sizeGuide) {
      console.log('📏 SIZE GUIDE EXTRACTED:', {
        measurements: extractedData.sizeGuide.measurements,
        sizingAdvice: extractedData.sizeGuide.sizingAdvice,
        modelInfo: extractedData.sizeGuide.modelInfo,
        confidence: extractedData.sizeGuide.confidence
      });
      
      // Log sizing advice specifically if found
      if (extractedData.sizeGuide.sizingAdvice && extractedData.sizeGuide.sizingAdvice.length > 0) {
        console.log('🎯 DIRECT FIT ADVICE FOUND:', extractedData.sizeGuide.sizingAdvice);
      }
    }
    
    if (pageData?.pageType) {
      console.log('🔍 PAGE TYPE DETECTION:', {
        isProductPage: pageData.pageType.isProductPage,
        isListingPage: pageData.pageType.isListingPage,
        confidence: pageData.pageType.confidence,
        productScore: pageData.pageType.productScore,
        listingScore: pageData.pageType.listingScore,
        signals: pageData.pageType.signals?.slice(0, 5) // Log first 5 signals to avoid clutter
      });
    }

    // Validate that this is a fashion brand, not a tech/general company
    const nonFashionBrands = [
      // Tech companies
      'google', 'microsoft', 'apple', 'amazon', 'facebook', 'meta', 'twitter', 'x',
      'youtube', 'linkedin', 'instagram', 'tiktok', 'snapchat', 'pinterest',
      'netflix', 'spotify', 'uber', 'lyft', 'airbnb', 'tesla', 'boeing',
      
      // Automotive
      'ford', 'gm', 'toyota', 'honda', 'bmw', 'mercedes', 'audi',
      
      // Retail (general)
      'walmart', 'target', 'costco', 'home depot', 'lowes', 'cvs', 'walgreens',
      
      // Food & beverage
      'mcdonalds', 'burger king', 'kfc', 'subway', 'starbucks', 'dunkin',
      
      // Financial services
      'visa', 'mastercard', 'paypal', 'stripe', 'square',
      
      // Platforms and communities
      'reddit', 'github', 'stackoverflow', 'wikipedia', 'twitch',
      
      // Home goods and interior design
      'nordic nest', 'nordicnest', 'ikea', 'west elm', 'pottery barn', 'crate and barrel',
      'cb2', 'williams sonoma', 'restoration hardware', 'anthropologie home',
      'wayfair', 'overstock', 'bed bath beyond', 'pier 1', 'homegoods',
      'world market', 'ballard designs', 'serena lily', 'one kings lane',
      'chairish', 'article', 'floyd', 'burrow', 'casper', 'purple',
      
      // Beauty and cosmetics (different from fashion)
      'sephora', 'ulta', 'sally beauty', 'cvs beauty', 'walgreens beauty',
      
      // Sports equipment and fitness
      'nike sports', 'adidas sports', 'under armour sports', 'lululemon sports',
      'peloton', 'nordictrack', 'bowflex', 'schwinn',
      
      // Electronics and appliances
      'best buy', 'circuit city', 'radio shack', 'frys electronics'
    ];

    const brandLower = brand.toLowerCase().trim();
    if (nonFashionBrands.includes(brandLower)) {
      return NextResponse.json({
        error: 'Brand not supported',
        message: `${brand} is not a fashion or apparel brand. Our analysis is designed for clothing, footwear, and fashion accessories brands only.`,
        brandFitSummary: {
          summary: `${brand} is not a fashion brand.`,
          confidence: 'none',
          sections: {},
          hasData: false,
          totalResults: 0,
          sources: []
        }
      }, { status: 400 });
    }

    const serperApiKey = process.env.SERPER_API_KEY;
    
    if (!serperApiKey) {
      return NextResponse.json({
        brandFitSummary: {
          summary: `Search API not configured. Add SERPER_API_KEY to environment.`,
          confidence: 'low',
          sections: {}
        },
        reviews: [],
        groupedReviews: {
          primary: [],
          community: [],
          blogs: [],
          videos: [],
          social: [],
          publications: [],
          other: []
        },
        totalResults: 0
      });
    }

    // Detect product category and check if this is a specific item search
    const itemName = body.productName || body.itemName || body.productType || '';
    const productCategory = detectProductCategory(brand, itemName);
    const isSpecificItemSearch = detectSpecificItemSearch(brand, itemName);
    
    // Handle URL extraction data from browser extension
    const urlExtraction = body.urlExtraction;
    console.log('🔗 API: URL extraction data received:', urlExtraction);
    
    // If we have URL extraction data, use it to enhance our search
    let enhancedBrand = brand;
    let enhancedItemName = itemName;
    let extractionConfidence = 'low';
    
    if (urlExtraction) {
      if (urlExtraction.brand && urlExtraction.confidence === 'high') {
        enhancedBrand = urlExtraction.brand;
        console.log('🔗 API: Using URL-extracted brand:', enhancedBrand);
      }
      
      if (urlExtraction.itemName) {
        enhancedItemName = urlExtraction.itemName;
        extractionConfidence = urlExtraction.confidence || 'medium';
        console.log('🔗 API: Using URL-extracted item name:', enhancedItemName);
      }
    }
    
    // Search for reviews with category-appropriate queries using enhanced data
    const finalIsSpecificItem = isSpecificItemSearch || (urlExtraction && urlExtraction.itemName);
    const searchQueries = generateSearchQueries(enhancedBrand, productCategory, enhancedItemName, finalIsSpecificItem);
    
    console.log('🔍 API: Enhanced search parameters:', {
      originalBrand: brand,
      enhancedBrand,
      originalItemName: itemName,
      enhancedItemName,
      isSpecificItem: finalIsSpecificItem,
      extractionConfidence
    });
    
    let allResults: SerperResult[] = [];
    
    console.log('🔍 SERPER: Starting search for brand:', brand);
    console.log('🔍 SERPER: Search queries:', searchQueries);
    
    // Helper function to execute a single search query with retry logic
    const executeSearchQuery = async (query: string, maxRetries: number = 2): Promise<SerperResult[]> => {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`🔍 SERPER: Executing query (attempt ${attempt}/${maxRetries}):`, query);
          
          // Add timeout to prevent hanging
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
          
          const response = await fetch('https://google.serper.dev/search', {
            method: 'POST',
            headers: {
              'X-API-KEY': serperApiKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ q: query, gl: 'us', num: 20 }),
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const data = await response.json();
            console.log('✅ SERPER: Query response for:', query.substring(0, 50) + '...', {
              organicResults: data.organic?.length || 0,
              totalResults: data.searchParameters?.q || 'N/A'
            });
            
            if (data.organic) {
              console.log('📄 SERPER: First few results for query:');
              data.organic.slice(0, 3).forEach((result: SerperResult, index: number) => {
                console.log(`  ${index + 1}. ${result.title}`);
                console.log(`     Snippet: ${result.snippet?.substring(0, 100)}...`);
              });
              
              return data.organic;
            }
          } else {
            console.error('❌ SERPER: Failed query:', query, 'Status:', response.status);
            if (attempt === maxRetries) {
              return [];
            }
          }
        } catch (error) {
          console.error(`❌ SERPER: Search error for query (attempt ${attempt}/${maxRetries}):`, query, error);
          
          // Handle timeout/abort errors
          if (error instanceof Error && error.name === 'AbortError') {
            console.log(`⏰ SERPER: Query timed out after 15 seconds`);
          } else if (error instanceof Error && error.message.includes('certificate')) {
            console.log(`⏰ SERPER: Waiting 1 second before retry due to certificate error...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
          // If this is the last attempt, return empty array
          if (attempt === maxRetries) {
            console.error(`💥 SERPER: All retry attempts failed for query: ${query}`);
            return [];
          }
        }
      }
      return [];
    };

    // Execute all search queries with retry logic
    for (const query of searchQueries) {
      const queryResults = await executeSearchQuery(query);
      allResults = [...allResults, ...queryResults];
    }
    
    console.log('📊 SERPER: Total results collected:', allResults.length);
    
    // If no results collected, return early with informative message
    if (allResults.length === 0) {
      console.warn('⚠️ SERPER: No search results collected - all queries may have failed');
      
      const fallbackSummary = `Unable to find reviews for ${brand} at this time. This may be due to temporary connectivity issues. Please try again in a few moments or use the full analysis page for more comprehensive results.`;
      
      return NextResponse.json({
        brandFitSummary: {
          summary: fallbackSummary,
          confidence: 'low',
          sections: {},
          hasData: false,
          totalResults: 0,
          sources: []
        },
        reviews: [],
        groupedReviews: {
          primary: [],
          community: [],
          blogs: [],
          videos: [],
          social: [],
          publications: [],
          other: []
        },
        totalResults: 0
      });
    }
    
    // Limit results sent to GPT analysis to prevent rate limiting (max 30 results)
    // Prioritize most relevant results first by fit score
    const prioritizedForGPT = allResults
      .map(result => ({
        result,
        fitScore: calculateFitRelevanceScoreForResult(result, enhancedBrand)
      }))
      .sort((a, b) => b.fitScore - a.fitScore)
      .slice(0, 30) // Limit to top 30 results to stay under OpenAI token limits
      .map(item => item.result);
    
    console.log(`🤖 GPT ANALYSIS: Limiting analysis from ${allResults.length} to ${prioritizedForGPT.length} top results to prevent rate limiting`);
    
    // Extract direct fit advice from page data if available
    const directFitAdvice = extractDirectFitAdvice(extractedData);
    
    // Analyze results for patterns based on product category using enhanced data
    const analysis = await analyzeResultsWithGPT5(prioritizedForGPT, enhancedBrand, productCategory, enhancedItemName, finalIsSpecificItem, directFitAdvice);
    
    // Debug: Log the analysis object
    console.log('🔍 ANALYSIS DEBUG: Full analysis object:', JSON.stringify(analysis, null, 2));
    console.log('🔍 ANALYSIS DEBUG: Analysis keys:', Object.keys(analysis));
    console.log('🔍 ANALYSIS DEBUG: Has fit?', !!analysis.fit);
    console.log('🔍 ANALYSIS DEBUG: Has quality?', !!analysis.quality);
    console.log('🔍 ANALYSIS DEBUG: Has materials?', !!analysis.materials);
    
    // Create structured sections
    const sections: Record<string, {
      title: string;
      recommendation: string;
      confidence: 'low' | 'medium' | 'high';
      evidence: string[];
    }> = {};
    
    if (analysis.fit) {
      sections.fit = {
        title: 'Fit',
        recommendation: analysis.fit.recommendation,
        confidence: analysis.fit.confidence,
        evidence: analysis.fit.evidence
      };
    }
    
    // Combine quality, fabric, and materials into a single "Quality & Materials" section
    if (analysis.quality || analysis.fabric || analysis.materials) {
      let qualityMaterialsRecommendation = '';
      // eslint-disable-next-line prefer-const
      let qualityMaterialsEvidence: string[] = [];
      let qualityMaterialsConfidence: 'low' | 'medium' | 'high' = 'low';
      
      // Start with materials if available
      if (analysis.materials && analysis.materials.composition.length > 0) {
        const cleanMaterials = analysis.materials.composition.join(', ');
        qualityMaterialsRecommendation = `Materials: ${cleanMaterials}\n\n`;
        qualityMaterialsEvidence.push(...analysis.materials.evidence);
        qualityMaterialsConfidence = analysis.materials.confidence;
      }
      
      // Add quality information
      if (analysis.quality) {
        if (qualityMaterialsRecommendation) {
          qualityMaterialsRecommendation += `Quality: ${analysis.quality.recommendation}`;
        } else {
          qualityMaterialsRecommendation = analysis.quality.recommendation;
        }
        qualityMaterialsEvidence.push(...analysis.quality.evidence);
        
        // Use highest confidence
        if (analysis.quality.confidence === 'high' || qualityMaterialsConfidence !== 'high') {
          qualityMaterialsConfidence = analysis.quality.confidence;
        }
      }
      
      // Add fabric information if no quality info
      if (analysis.fabric && !analysis.quality) {
        if (qualityMaterialsRecommendation) {
          qualityMaterialsRecommendation += `Fabric: ${analysis.fabric.recommendation}`;
        } else {
          qualityMaterialsRecommendation = analysis.fabric.recommendation;
        }
        qualityMaterialsEvidence.push(...analysis.fabric.evidence);
        
        if (analysis.fabric.confidence === 'high' || qualityMaterialsConfidence !== 'high') {
          qualityMaterialsConfidence = analysis.fabric.confidence;
        }
      }
      
      sections.qualityMaterials = {
        title: 'Quality & Materials',
        recommendation: qualityMaterialsRecommendation,
        confidence: qualityMaterialsConfidence,
        evidence: Array.from(new Set(qualityMaterialsEvidence)).slice(0, 3) // Remove duplicates, limit to 3
      };
    }
    
    if (analysis.washCare) {
      sections.washCare = {
        title: 'Wash & Care',
        recommendation: analysis.washCare.recommendation,
        confidence: analysis.washCare.confidence,
        evidence: analysis.washCare.evidence
      };
    }
    
    // Summary will be generated after review prioritization to use correct count
    
    // Helper function to use GPT for generating meaningful summaries
    const generateMeaningfulSummary = async (title: string, snippet: string, brand: string): Promise<string | null> => {
      try {
        const prompt = `Based on this review title and snippet, extract 2-3 key points about the reviewer's actual experience with the ${brand} product. Focus on specific pros/cons, not just restating that it's a review.

Title: ${title}
Snippet: ${snippet}

Format as bullet points like:
• Durable construction, handles daily use well
• Heavy for travel, shoulder straps uncomfortable
• Great organization but too many pockets

Focus on concrete experiences like comfort, durability, functionality, value, etc. If insufficient information, return just the title without "Review of" prefix.`;

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini", // Keep using mini for snippet processing (cost optimization)
          messages: [{
            role: "system",
            content: "You are an expert at extracting specific pros/cons from product reviews. Provide concrete bullet points about user experiences."
          }, {
            role: "user", 
            content: prompt
          }],
          max_tokens: 2000,
          temperature: 0.3
          // Note: GPT-5 models only support default temperature (1)
        });

        const summary = completion.choices[0]?.message?.content?.trim();
        if (summary && summary.length > 10 && !summary.includes('insufficient')) {
          return summary;
        }
      } catch (error) {
        console.log('GPT summary generation failed:', error);
      }
      return null; // Fallback to original logic
    };

    // Helper function to convert SerperResult to Review format with enhanced snippets
    const convertToReview = async (result: SerperResult): Promise<Review> => {
      const source = extractSourceName(result.link || '');
      const tags = extractTags(result.title, result.snippet);
      const confidence = calculateConfidence(result);
      
      // Enhance snippet to be more meaningful
      const enhanceSnippet = async (title: string, snippet: string, url: string = ''): Promise<string> => {
        // First try GPT if we have enough context and it's a quality source
        const isQualitySource = url.includes('blog') || url.includes('review') || 
                               url.includes('reddit') || url.includes('youtube') ||
                               url.includes('wired') || url.includes('medium');
        
        if ((title?.length > 25 || snippet?.length > 40) && isQualitySource) {
          const gptSummary = await generateMeaningfulSummary(title, snippet, brand);
          if (gptSummary) {
            console.log(`🤖 GPT SUMMARY: ${title.substring(0, 50)}... → ${gptSummary}`);
            return gptSummary;
          }
        }

        if (!snippet || snippet.length < 20) {
          // If no snippet, try to create a meaningful description from title
          if (title && title.length > 10) {
            return title.replace(/^(Review of|Review:|Review\s+)/i, '').trim();
          }
          return title || 'Review content available at source';
        }
        
        // If snippet is generic or just says "discussion about...", try to extract from title
        const genericIndicators = [
          'discussion about',
          'see full review for details',
          'post about',
          'thread about',
          'review of',
          'thoughts on',
          'missing:',
          'more details',
          'check out the full',
          'visit the website',
          'click here',
          'read the full',
          'view more',
          'learn more'
        ];
        
        const isGeneric = genericIndicators.some(indicator => 
          snippet.toLowerCase().includes(indicator)
        );
        
        if (isGeneric && title) {
          // Try to extract meaningful info from title instead
          let meaningfulTitle = title
            .replace(/^(r\/\w+\s*-\s*)?/i, '') // Remove r/subreddit prefix
            .replace(/\s*-\s*Reddit$/i, '') // Remove "- Reddit" suffix
            .replace(/\s*-\s*YouTube$/i, '') // Remove "- YouTube" suffix
            .replace(/\s*\|\s*.*$/i, '') // Remove everything after | symbol
            .replace(/\s*\.\.\.$/, '') // Remove trailing ellipsis
            .trim();
          
          // For blog URLs, try to create a more descriptive summary
          if (url && (url.includes('blog') || url.includes('review')) && meaningfulTitle.length > 15) {
            // Create a summary based on what type of review this appears to be
            if (meaningfulTitle.toLowerCase().includes('review')) {
              return `In-depth review of ${meaningfulTitle.replace(/review of\s*/gi, '').trim()}`;
            } else if (meaningfulTitle.toLowerCase().includes('vs') || meaningfulTitle.toLowerCase().includes('comparison')) {
              return `Comparison review: ${meaningfulTitle}`;
            } else {
              return `Review analysis: ${meaningfulTitle}`;
            }
          }
          
          // If title is still too generic, try to create a better description
          if (meaningfulTitle.length < 10 || meaningfulTitle.toLowerCase().includes('missing:')) {
            meaningfulTitle = `Review about ${brand} products`;
          }
          
          return meaningfulTitle;
        }
        
        // Clean up snippet by removing generic phrases
        const cleanedSnippet = snippet
          .replace(/\s*-\s*see full review for details\s*/gi, '')
          .replace(/\s*discussion about\s*/gi, '')
          .replace(/\s*missing:\s*/gi, '')
          .replace(/\s*more details\s*/gi, '')
          .replace(/\s*\.\.\.\s*$/gi, '')
          .trim();
        
        // If cleaned snippet is too short, use title or fallback
        if (cleanedSnippet.length < 10) {
          return title || 'Review content available at source';
        }
        
        return cleanedSnippet;
      };
      
      const enhancedSnippet = await enhanceSnippet(result.title || '', result.snippet || '', result.link || '');
      
      return {
        title: result.title || 'Untitled Review',
        snippet: enhancedSnippet,
        url: result.link || '',
        source: source,
        tags: tags,
        confidence: confidence,
        brandLevel: false,
        fullContent: result.snippet || ''
      };
    };
    
    // Filter results to only include those that actually mention the brand AND specific item (if provided)
    const brandFilteredResults = allResults.filter(result => {
      const title = (result.title || '').toLowerCase();
      const snippet = (result.snippet || '').toLowerCase();
      const brandLower = brand.toLowerCase();
      const fullText = `${title} ${snippet}`;
      
      // Create flexible brand variations for common brand name formats
      const createBrandVariations = (brandName: string) => {
        const base = brandName.toLowerCase();
        const variations = [base];
        
        // Handle common brand formatting variations
        if (base.includes('+')) {
          // For brands like "ME+EM" -> also check "me&em", "me & em", "me em", "me and em"
          const withoutPlus = base.replace(/\+/g, '');
          const withAmpersand = base.replace(/\+/g, '&');
          const withSpaces = base.replace(/\+/g, ' ');
          const withAnd = base.replace(/\+/g, ' and ');
          const withSpacedAmpersand = base.replace(/\+/g, ' & ');
          
          variations.push(withoutPlus, withAmpersand, withSpaces, withAnd, withSpacedAmpersand);
        }
        
        // Handle brands with spaces -> also check without spaces and with other separators
        if (base.includes(' ')) {
          const withoutSpaces = base.replace(/\s+/g, '');
          const withUnderscores = base.replace(/\s+/g, '_');
          const withHyphens = base.replace(/\s+/g, '-');
          
          variations.push(withoutSpaces, withUnderscores, withHyphens);
        }
        
        // Handle brands with hyphens -> also check with spaces and without separators
        if (base.includes('-')) {
          const withSpaces = base.replace(/-/g, ' ');
          const withoutHyphens = base.replace(/-/g, '');
          
          variations.push(withSpaces, withoutHyphens);
        }
        
        return Array.from(new Set(variations)); // Remove duplicates
      };
      
      const brandVariations = createBrandVariations(brandLower);
      console.log(`🔍 BRAND VARIATIONS: Checking for brand "${brand}" using variations:`, brandVariations);
      
      // STRICT REQUIREMENT: Must mention brand
      const hasBrandMention = brandVariations.some(variation => 
        title.includes(variation) || snippet.includes(variation)
      );
      
      if (!hasBrandMention) {
        console.log(`🚫 BRAND FILTER: Removing result without brand mention: "${result.title}"`);
        return false;
      }
      
      // STRICT REQUIREMENT: If this is a specific item search, must mention the specific item
      if (finalIsSpecificItem && enhancedItemName) {
        const itemNameLower = enhancedItemName.toLowerCase();
        
        // Normalize both the item name and full text for better matching
        const normalizeText = (text: string) => {
          return text.toLowerCase()
            .replace(/[,.\-_]/g, ' ')  // Replace punctuation with spaces
            .replace(/\s+/g, ' ')       // Collapse multiple spaces
            .trim();
        };
        
        const normalizedItemName = normalizeText(itemNameLower);
        const normalizedFullText = normalizeText(fullText);
        
        // Split into words for flexible matching
        const itemWords = normalizedItemName.split(' ').filter(word => word.length > 2);
        const textWords = normalizedFullText.split(' ');
        
        // Check if most of the significant item words are present
        const matchingWords = itemWords.filter(word => textWords.includes(word));
        const matchPercentage = matchingWords.length / itemWords.length;
        
        const hasSpecificItemMention = matchPercentage >= 0.7; // 70% of words must match
        
        if (!hasSpecificItemMention) {
          console.log(`🚫 ITEM FILTER: Removing result without specific item "${enhancedItemName}" mention (${Math.round(matchPercentage * 100)}% match): "${result.title}"`);
          return false;
        }
        
        console.log(`✅ ITEM MATCH: Found specific item "${enhancedItemName}" in: "${result.title}" (${Math.round(matchPercentage * 100)}% match)`);
      }
      
      // Log which brand variation matched
      const matchedVariations = brandVariations.filter(variation => 
        title.includes(variation) || snippet.includes(variation)
      );
      console.log(`✅ BRAND MATCH: Found brand mention using variations: ${matchedVariations.join(', ')} in "${result.title}"`);
      
      // STRICT REQUIREMENT: Must have substantial brand mention (not just passing reference)
      let totalBrandMentions = 0;
      let hasContextualMention = false;
      
      // Count mentions across all brand variations
      brandVariations.forEach(variation => {
        const matches = (fullText.match(new RegExp(variation, 'g')) || []).length;
        totalBrandMentions += matches;
        
        // Check for contextual mentions with this variation
        if (fullText.includes(`${variation} review`) ||
            fullText.includes(`${variation} quality`) ||
            fullText.includes(`${variation} fit`) ||
            fullText.includes(`${variation} brand`) ||
            fullText.includes(`${variation} product`) ||
            fullText.includes(`${variation} experience`) ||
            fullText.includes(`${variation} recommend`) ||
            fullText.includes(`${variation} sizing`) ||
            fullText.includes(`${variation} clothes`) ||
            fullText.includes(`${variation} clothing`) ||
            fullText.includes(`from ${variation}`) ||
            fullText.includes(`${variation}'s`) ||
            fullText.includes(`the ${variation}`) ||
            // Brand mentioned in title is usually substantial
            title.includes(variation)) {
          hasContextualMention = true;
        }
      });
      
      // Must have either multiple brand mentions OR contextual mention
      const hasSubstantialMention = totalBrandMentions > 1 || hasContextualMention;
      
      if (!hasSubstantialMention) {
        console.log(`🚫 SUBSTANCE FILTER: Removing result with only passing brand mention: "${result.title}"`);
        return false;
      }
      
      console.log(`✅ FINAL VALIDATION: Keeping result with ${totalBrandMentions} brand mentions, contextual: ${hasContextualMention}: "${result.title}"`);
      return true;
    });
    
    console.log(`🔍 BRAND FILTERING: Reduced from ${allResults.length} to ${brandFilteredResults.length} results`);

    // Convert all results to Review format and deduplicate (with GPT enhancement)
    console.log('🤖 Starting GPT-enhanced snippet processing...');
    const formattedReviews = await Promise.all(brandFilteredResults.map(convertToReview));
    
    // Deduplicate reviews with improved logic
    const uniqueReviews = formattedReviews.filter((review, index, array) => {
      // Check if this is the first occurrence of this title or URL
      const firstIndex = array.findIndex(r => {
        // Exact URL match (highest priority)
        if (r.url === review.url) return true;
        
        // Exact title match
        if (r.title === review.title) return true;
        
        // Similarity check only for longer titles and with 80% threshold
        if (r.title.length > 20 && review.title.length > 20) {
          const similarity = calculateStringSimilarity(r.title.toLowerCase(), review.title.toLowerCase());
          return similarity > 0.8;
        }
        
        return false;
      });
      return firstIndex === index;
    });
    
    console.log(`🔄 DEDUPLICATION: Reduced from ${formattedReviews.length} to ${uniqueReviews.length} reviews`);
    
    // Add minimum result threshold - if too few results after dedup, be less aggressive

    let finalUniqueReviews: Review[];

if (uniqueReviews.length < 5 && formattedReviews.length >= 10) {
  console.log(`⚠️ DEDUP WARNING: Too few results (${uniqueReviews.length}), relaxing criteria`);
  const relaxedUniqueReviews = formattedReviews.filter((review, index, array) => {
    const firstIndex = array.findIndex(r => r.url === review.url || r.title === review.title);
    return firstIndex === index;
  });
  console.log(`🔄 RELAXED DEDUPLICATION: Using ${relaxedUniqueReviews.length} reviews instead`);
  finalUniqueReviews = relaxedUniqueReviews;
} else {
  finalUniqueReviews = uniqueReviews;
}
    
    // Prioritize reviews by fit relevance using final deduplicated results
    const prioritizedReviews = finalUniqueReviews.sort((a, b) => {
      const scoreA = calculateFitRelevanceScore(a);
      const scoreB = calculateFitRelevanceScore(b);
      
      // Sort by score descending (highest score first)
      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }
      
      // If scores are equal, prioritize by confidence level
      const confidenceOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      return confidenceOrder[b.confidence] - confidenceOrder[a.confidence];
    });
    
    console.log(`📊 FIT PRIORITIZATION: Sorted ${finalUniqueReviews.length} reviews by fit relevance`);
    
    // Log top fit-relevant reviews
    prioritizedReviews.slice(0, 5).forEach((review, index) => {
      const score = calculateFitRelevanceScore(review);
      console.log(`🏆 #${index + 1} FIT RELEVANT: "${review.title.substring(0, 60)}..." (score: ${score})`);
    });
    
    // Create detailed summary based on analysis using filtered/prioritized results
    const summary = generateDetailedSummary(analysis, prioritizedReviews, brand, productCategory);
    
    // Group reviews by source type with proper Review structure using prioritized reviews
    const groupedReviews = {
      primary: prioritizedReviews.filter(r => r.url.includes('reddit') || r.url.includes('substack')),
      community: prioritizedReviews.filter(r => r.url.includes('forum') || r.url.includes('community')),
      blogs: prioritizedReviews.filter(r => r.url.includes('blog') || r.url.includes('medium')),
      videos: prioritizedReviews.filter(r => r.url.includes('youtube') || r.url.includes('video')),
      social: prioritizedReviews.filter(r => r.url.includes('instagram') || r.url.includes('twitter')),
      publications: prioritizedReviews.filter(r => r.url.includes('magazine') || r.url.includes('vogue')),
      other: prioritizedReviews.filter(r => 
        !['reddit', 'substack', 'forum', 'community', 'blog', 'medium', 'youtube', 'video', 'instagram', 'twitter', 'magazine', 'vogue']
          .some(s => r.url.includes(s))
      )
    };

    // Debug: Log the sections object being returned
    console.log('🔍 API RESPONSE DEBUG: Final sections object:', JSON.stringify(sections, null, 2));
    console.log('🔍 API RESPONSE DEBUG: Sections keys:', Object.keys(sections));
    console.log('🔍 API RESPONSE DEBUG: hasData will be:', Object.keys(sections).length > 0);

    const response = NextResponse.json({
      brandName: brand, // Include the brand name in the response
      brandFitSummary: {
        summary,
        confidence: analysis.overallConfidence || 'low',
        sections,
        hasData: Object.keys(sections).length > 0,
        totalResults: prioritizedReviews.length,
        sources: []
      },
      reviews: prioritizedReviews.slice(0, 20),
      groupedReviews,
      totalResults: prioritizedReviews.length
    });
    
    // Add CORS headers for browser extension
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    return response;
    
  } catch (error) {
    console.error('API Error:', error);
    const errorResponse = NextResponse.json({
      brandName: brand || 'Unknown Brand', // Include brand name even in error response
      brandFitSummary: {
        summary: 'Error loading reviews',
        confidence: 'low',
        sections: {},
        totalResults: 0,
        sources: []
      },
      reviews: [],
      groupedReviews: {
        primary: [],
        community: [],
        blogs: [],
        videos: [],
        social: [],
        publications: [],
        other: []
      },
      totalResults: 0
    });
    
    // Add CORS headers for browser extension
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    errorResponse.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    return errorResponse;
  }
}

// Helper function to extract direct fit advice from page data
function extractDirectFitAdvice(extractedData: unknown): { 
  hasDirectAdvice: boolean; 
  advice: string[]; 
  recommendation: string | null;
  confidence: 'low' | 'medium' | 'high';
} {
  const result: {
    hasDirectAdvice: boolean;
    advice: string[];
    recommendation: string | null;
    confidence: 'low' | 'medium' | 'high';
  } = {
    hasDirectAdvice: false,
    advice: [],
    recommendation: null,
    confidence: 'low'
  };
  
  // Type guard for extracted data
  if (!extractedData || typeof extractedData !== 'object') {
    return result;
  }
  
  const data = extractedData as Record<string, unknown>;
  const sizeGuide = data.sizeGuide as Record<string, unknown> | undefined;
  
  if (!sizeGuide?.sizingAdvice || !Array.isArray(sizeGuide.sizingAdvice) || sizeGuide.sizingAdvice.length === 0) {
    return result;
  }
  
  const advice = sizeGuide.sizingAdvice as string[];
  result.hasDirectAdvice = true;
  result.advice = advice;
  result.confidence = (sizeGuide.confidence as 'low' | 'medium' | 'high') || 'medium';
  
  // Analyze the advice to create a recommendation
  const adviceText = advice.join(' ').toLowerCase();
  
  if (adviceText.includes('runs small') || adviceText.includes('size up') || adviceText.includes('recommend sizing up')) {
    result.recommendation = 'runs small';
  } else if (adviceText.includes('runs large') || adviceText.includes('size down') || adviceText.includes('recommend sizing down') || adviceText.includes('generous')) {
    result.recommendation = 'runs large';
  } else if (adviceText.includes('true to size') || adviceText.includes('fits as expected')) {
    result.recommendation = 'true to size';
  } else if (adviceText.includes('snug') || adviceText.includes('tight')) {
    result.recommendation = 'runs small';
  } else if (adviceText.includes('loose') || adviceText.includes('relaxed') || adviceText.includes('oversized')) {
    result.recommendation = 'runs large';
  }
  
  console.log('🎯 PROCESSED DIRECT FIT ADVICE:', result);
  return result;
}

// Helper function to extract source name from URL
function extractSourceName(url: string): string {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    
    // Remove www. and .com/.org etc
    let source = hostname.replace(/^www\./, '').split('.')[0];
    
    // Capitalize first letter
    source = source.charAt(0).toUpperCase() + source.slice(1);
    
    return source;
  } catch {
    return 'Unknown Source';
  }
}

// Helper function to extract tags from title and snippet
function extractTags(title?: string, snippet?: string): string[] {
  const tags: string[] = [];
  const text = `${title || ''} ${snippet || ''}`.toLowerCase();
  
  // Check for fit-related tags
  if (text.includes('runs small') || text.includes('size up')) tags.push('runs-small');
  if (text.includes('runs large') || text.includes('size down')) tags.push('runs-large');
  if (text.includes('true to size')) tags.push('true-to-size');
  
  // Check for quality-related tags
  if (text.includes('high quality') || text.includes('excellent')) tags.push('high-quality');
  if (text.includes('poor quality') || text.includes('cheap')) tags.push('low-quality');
  
  // Check for material tags
  if (text.includes('cotton')) tags.push('cotton');
  if (text.includes('polyester')) tags.push('polyester');
  if (text.includes('wool')) tags.push('wool');
  if (text.includes('sustainable')) tags.push('sustainable');
  
  // Check for care tags
  if (text.includes('shrink')) tags.push('may-shrink');
  if (text.includes('wash')) tags.push('care-instructions');
  
  // If no tags found, add a default
  if (tags.length === 0) {
    tags.push('general-review');
  }
  
  return tags;
}

// Helper function to calculate fit relevance score for SerperResult (used for GPT prioritization)
function calculateFitRelevanceScoreForResult(result: SerperResult, brand: string): number {
  const text = `${result.title || ''} ${result.snippet || ''}`.toLowerCase();
  let score = 0;
  
  // High priority fit terms (most valuable for fit analysis)
  const highPriorityFitTerms = [
    'runs small', 'runs large', 'true to size', 'fits small', 'fits large',
    'size up', 'size down', 'sized up', 'sized down',
    'too small', 'too big', 'too large', 'too tight', 'too loose',
    'fits perfectly', 'perfect fit', 'great fit', 'good fit',
    'fits well', 'fits true', 'sizing'
  ];
  
  // Medium priority fit terms
  const mediumPriorityFitTerms = [
    'fit', 'size', 'quality', 'material', 'fabric', 'review'
  ];
  
  // Experience indicators (shows first-hand experience)
  const experienceTerms = [
    'i bought', 'i ordered', 'i tried', 'i wear', 'i own', 'i have',
    'my size', 'my usual', 'i purchased', 'fit me', 'on me', 'for me'
  ];
  
  // Count high priority terms (worth 10 points each)
  highPriorityFitTerms.forEach(term => {
    if (text.includes(term)) score += 10;
  });
  
  // Count medium priority terms (worth 3 points each, max 15 points)
  let mediumTermCount = 0;
  mediumPriorityFitTerms.forEach(term => {
    if (text.includes(term)) mediumTermCount++;
  });
  score += Math.min(mediumTermCount * 3, 15);
  
  // Count experience terms (worth 5 points each, max 10 points)  
  let experienceCount = 0;
  experienceTerms.forEach(term => {
    if (text.includes(term)) experienceCount++;
  });
  score += Math.min(experienceCount * 5, 10);
  
  // Brand mention bonus (ensures relevance)
  if (text.includes(brand.toLowerCase())) score += 5;
  
  // Quality sources bonus
  if (result.link && (result.link.includes('reddit') || result.link.includes('substack'))) {
    score += 2;
  }
  
  return score;
}

// Helper function to calculate fit relevance score for prioritizing reviews
function calculateFitRelevanceScore(review: Review): number {
  const text = `${review.title} ${review.snippet}`.toLowerCase();
  let score = 0;
  
  // High priority fit terms (most valuable for fit analysis)
  const highPriorityFitTerms = [
    'runs small', 'runs large', 'true to size', 'fits small', 'fits large',
    'size up', 'size down', 'sized up', 'sized down',
    'too small', 'too big', 'too large', 'too tight', 'too loose',
    'fits perfectly', 'perfect fit', 'great fit', 'good fit',
    'fits well', 'fits true', 'sizing'
  ];
  
  // Medium priority fit terms
  const mediumPriorityFitTerms = [
    'fit', 'size', 'length', 'width', 'measurements', 'dimensions',
    'petite', 'regular', 'tall', 'plus size', 'xs', 'small', 'medium', 'large', 'xl',
    'inches', 'cm', 'bust', 'waist', 'hips', 'chest',
    'sleeve', 'hem', 'inseam', 'rise'
  ];
  
  // Experience indicators (shows first-hand experience with fit)
  const experienceTerms = [
    'i bought', 'i ordered', 'i tried', 'i wear', 'i own', 'i have',
    'my size', 'my usual', 'i\'m', 'i am', 'i purchased',
    'fit me', 'on me', 'for me'
  ];
  
  // Count high priority terms (worth 10 points each)
  highPriorityFitTerms.forEach(term => {
    if (text.includes(term)) {
      score += 10;
      console.log(`🎯 HIGH FIT: "${term}" found in "${review.title.substring(0, 40)}..." (+10 points)`);
    }
  });
  
  // Count medium priority terms (worth 3 points each, max 15 points)
  let mediumTermCount = 0;
  mediumPriorityFitTerms.forEach(term => {
    if (text.includes(term)) {
      mediumTermCount++;
    }
  });
  score += Math.min(mediumTermCount * 3, 15);
  
  // Count experience terms (worth 5 points each, max 10 points)
  let experienceCount = 0;
  experienceTerms.forEach(term => {
    if (text.includes(term)) {
      experienceCount++;
    }
  });
  score += Math.min(experienceCount * 5, 10);
  
  // Bonus for fit-related tags
  if (review.tags.includes('true-to-size') || review.tags.includes('sizing')) {
    score += 5;
  }
  
  // Bonus for high confidence reviews
  if (review.confidence === 'high') {
    score += 3;
  } else if (review.confidence === 'medium') {
    score += 1;
  }
  
  // Bonus for quality sources (Reddit discussions tend to have good fit info)
  if (text.includes('reddit') || review.url.includes('reddit')) {
    score += 2;
  }
  
  return score;
}

// Helper function to calculate confidence based on result relevance
function calculateConfidence(result: SerperResult): "high" | "medium" | "low" {
  const text = `${result.title || ''} ${result.snippet || ''}`.toLowerCase();
  let score = 0;
  
  // Check for specific fit mentions
  if (text.includes('runs small') || text.includes('runs large') || text.includes('true to size')) {
    score += 2;
  }
  
  // Check for quality mentions
  if (text.includes('quality') || text.includes('fabric') || text.includes('material')) {
    score += 1;
  }
  
  // Check for detailed review indicators
  if (text.includes('review') || text.includes('tried') || text.includes('bought')) {
    score += 1;
  }
  
  // Check for first-hand experience indicators
  if (text.includes('i bought') || text.includes('i tried') || text.includes('my experience') || 
      text.includes('i ordered') || text.includes('i own') || text.includes('i have')) {
    score += 2;
  }
  
  // Check for specific measurements or detailed descriptions
  if (text.includes('size') || text.includes('fit') || text.includes('length') || 
      text.includes('width') || text.includes('measurements')) {
    score += 1;
  }
  
  // Return confidence based on score
  if (score >= 4) return 'high';
  if (score >= 2) return 'medium';
  return 'low';
}

// GPT-5 powered analysis function
async function analyzeResultsWithGPT5(results: SerperResult[], brand: string, category: 'clothing' | 'bags' | 'shoes' | 'accessories' | 'general' = 'general', itemName: string = '', isSpecificItem: boolean = false, directFitAdvice?: DirectFitAdvice): Promise<AnalysisResult> {
  console.log(`🤖 GPT-5 ANALYSIS: Starting AI analysis for ${brand} with ${results.length} results`);
  
  if (results.length === 0) {
    return {};
  }
  
  // Prepare review data for GPT-5
  const reviewTexts = results.map((result, index) => {
    const source = extractSourceName(result.link || '');
    return `Review ${index + 1} (${source}): ${result.title || ''} - ${result.snippet || ''}`;
  }).join('\n\n');
  
  const itemContext = isSpecificItem && itemName ? 
    `\nFocus specifically on reviews about the "${itemName}" item from ${brand}.` : 
    `\nAnalyze reviews about ${brand} products in general.`;
  
  const categoryContext = category !== 'general' ? 
    `\nThis is a ${category} brand, so focus on ${category}-specific aspects.` : '';
    
  const directFitContext = directFitAdvice?.hasDirectAdvice ? 
    `\n\nIMPORTANT: Direct fit advice found on product page: "${directFitAdvice.advice.join(', ')}". This should take priority over conflicting review analysis. Use this as the primary fit recommendation unless reviews strongly contradict it.` : '';
  
  // Create category-aware JSON structure
  const getFitSection = () => {
    if (category === 'bags' || category === 'accessories') {
      // For bags/accessories, fit doesn't make sense - skip it entirely
      return '';
    }
    return `  "fit": {
    "recommendation": "Clear, specific fit advice based on the reviews (e.g., 'runs small, size up' or 'true to size')",
    "confidence": "low|medium|high",
    "evidence": ["Direct quotes from reviews supporting this assessment"]
  },`;
  };

  const getQualityLabel = () => {
    if (category === 'bags' || category === 'accessories') {
      return 'construction and durability assessment';
    }
    return 'quality assessment based on customer feedback';
  };

  const getMaterialsLabel = () => {
    if (category === 'bags') {
      return 'List of materials mentioned (e.g., "ballistic nylon", "leather", "Cordura")';
    }
    return 'List of materials mentioned (e.g., "100% cotton", "merino wool")';
  };

  const getWashCareSection = () => {
    if (category === 'bags' || category === 'accessories') {
      return `  "durability": {
    "recommendation": "Durability and longevity assessment based on customer experiences",
    "confidence": "low|medium|high",
    "evidence": ["Quotes about long-term use, wear patterns, durability"]
  },`;
    }
    return `  "washCare": {
    "recommendation": "Washing and care advice based on customer experiences",
    "confidence": "low|medium|high",
    "evidence": ["Quotes about washing, care, durability"]
  },`;
  };

  const prompt = `You are a fashion expert analyzing customer reviews to provide structured insights. Your goal is to extract useful insights even from limited data, rather than returning empty analysis.

Brand: ${brand}
Category: ${category}${itemContext}${categoryContext}${directFitContext}

Reviews to analyze:
${reviewTexts}

Please analyze these reviews and return a JSON object with the following structure:
{
${getFitSection()}
  "quality": {
    "recommendation": "${getQualityLabel()}",
    "confidence": "low|medium|high", 
    "evidence": ["Direct quotes about quality or general customer experiences"]
  },
  "materials": {
    "composition": ["${getMaterialsLabel()}"],
    "confidence": "low|medium|high",
    "evidence": ["Quotes mentioning materials or fabric"]
  },
${getWashCareSection()}
  "overallConfidence": "low|medium|high"
}

IMPORTANT GUIDELINES:
- ALWAYS try to provide SOME analysis rather than completely empty sections
- If you find ANY customer feedback patterns, include them even with low confidence
- Use direct quotes from reviews as evidence, but also paraphrase customer sentiment when helpful
- Be specific and actionable in recommendations when possible
- For limited data, focus on what customers ARE saying rather than what's missing
- If only 1-2 reviews mention something, still include it but mark confidence as "low"
- Extract insights from review titles and snippets even if not perfectly detailed
- Better to provide cautious insights than no insights at all
- Focus on customer experiences, not brand descriptions
- Return valid JSON only, no other text`;

  try {
    // Use higher quality model (gpt-4o) for final analysis and recommendations
    // This provides better insight extraction and more nuanced analysis
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Temporarily using gpt-4o while debugging GPT-5 issues
      messages: [
        {
          role: "system",
          content: "You are a fashion expert who analyzes customer reviews to provide structured insights. Always return valid JSON and be specific and actionable in your analysis."
        },
        {
          role: "user", 
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.3
    });

    // Debug: Log key completion info 
    console.log('🔍 GPT-5 DEBUG: Message content length:', (completion.choices?.[0]?.message?.content || '').length);
    console.log('🔍 GPT-5 DEBUG: Finish reason:', completion.choices?.[0]?.finish_reason);
    console.log('🔍 GPT-5 DEBUG: Reasoning tokens:', completion.usage?.completion_tokens_details?.reasoning_tokens || 0);
    
    const aiResponse = completion.choices[0]?.message?.content;
    if (!aiResponse) {
      console.log('🤖 GPT-5 ANALYSIS: No response from GPT-5');
      return {};
    }

    // Parse JSON response - strip markdown code blocks if present
    try {
      let cleanResponse = aiResponse.trim();
      
      // Remove markdown code blocks if present
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      const analysisResult = JSON.parse(cleanResponse);
      console.log('🤖 GPT-5 ANALYSIS: Successfully parsed AI analysis');
      console.log('🤖 GPT-5 ANALYSIS: Sections found:', Object.keys(analysisResult));
      return analysisResult;
    } catch (parseError) {
      console.error('🤖 GPT-5 ANALYSIS: Failed to parse JSON response:', parseError);
      console.log('🤖 GPT-5 ANALYSIS: Raw response:', aiResponse.substring(0, 500));
      
      // Fallback to rule-based analysis
      console.log('🤖 GPT-5 ANALYSIS: Falling back to rule-based analysis');
      return analyzeResultsRuleBased(results, brand, category, itemName, isSpecificItem);
    }
  } catch (error) {
    console.error('🤖 GPT-5 ANALYSIS: Error calling GPT-5:', error);
    
    // Check if this is a rate limit error
    if (error instanceof Error && (error.message.includes('429') || error.message.includes('Rate limit'))) {
      console.warn('🤖 GPT-5 ANALYSIS: Rate limit hit - this should be reduced with the new result limiting');
    }
    
    // Fallback to rule-based analysis
    console.log('🤖 GPT-5 ANALYSIS: Falling back to rule-based analysis');
    return analyzeResultsRuleBased(results, brand, category, itemName, isSpecificItem, directFitAdvice);
  }
}

// Renamed original function as fallback
function analyzeResultsRuleBased(results: SerperResult[], brand: string, category: 'clothing' | 'bags' | 'shoes' | 'accessories' | 'general' = 'general', itemName: string = '', isSpecificItem: boolean = false, directFitAdvice?: DirectFitAdvice): AnalysisResult {
  const analysis: AnalysisResult = {};
  const allText = results.map(r => `${r.title} ${r.snippet}`).join(' ').toLowerCase();
  
  console.log(`🔍 ANALYSIS: Starting analysis for ${brand} with ${results.length} results`);
  console.log(`🔍 ANALYSIS: Combined text sample (first 300 chars):`, allText.substring(0, 300) + '...');
  console.log(`🔍 ANALYSIS: Full text length:`, allText.length, 'characters');
  
  // Check for direct fit advice first - this takes priority
  if (directFitAdvice?.hasDirectAdvice && (category === 'clothing' || category === 'shoes')) {
    const productType = category === 'shoes' ? 'shoes' : 'items';
    console.log('🎯 PRIORITIZING DIRECT FIT ADVICE:', directFitAdvice);
    
    let recommendation = '';
    if (directFitAdvice.recommendation === 'runs small') {
      recommendation = `Product page indicates ${brand} ${productType} run small. Direct advice: "${directFitAdvice.advice.join(', ')}" Consider sizing up.`;
    } else if (directFitAdvice.recommendation === 'runs large') {
      recommendation = `Product page indicates ${brand} ${productType} run large. Direct advice: "${directFitAdvice.advice.join(', ')}" Consider sizing down.`;
    } else if (directFitAdvice.recommendation === 'true to size') {
      recommendation = `Product page indicates ${brand} ${productType} are true-to-size. Direct advice: "${directFitAdvice.advice.join(', ')}" Order your usual size.`;
    } else {
      recommendation = `Product page provides fit guidance: "${directFitAdvice.advice.join(', ')}" Refer to brand sizing advice.`;
    }
    
    analysis.fit = {
      recommendation,
      confidence: directFitAdvice.confidence === 'high' ? 'high' : 'medium',
      evidence: directFitAdvice.advice
    };
  }
  // If no direct advice, analyze fit from reviews for relevant categories
  else if (category === 'clothing' || category === 'shoes') {
    const fitPatterns = category === 'shoes' 
      ? {
          runsSmall: (allText.match(/runs small|size up|tight|narrow|small fit/g) || []).length,
          runsLarge: (allText.match(/runs large|size down|loose|wide|big fit/g) || []).length,
          trueToSize: (allText.match(/true to size|fits perfectly|accurate sizing|perfect fit/g) || []).length
        }
      : {
          runsSmall: (allText.match(/runs small|size up|tight|snug/g) || []).length,
          runsLarge: (allText.match(/runs large|size down|loose|baggy/g) || []).length,
          trueToSize: (allText.match(/true to size|fits perfectly|accurate sizing/g) || []).length
        };
    
    const dominantFit = Object.entries(fitPatterns).sort((a, b) => b[1] - a[1])[0];
    
    if (dominantFit[1] > 0) {
      // Extract actual quotes from reviews instead of using templates
      const fitEvidence = extractEvidence(results, dominantFit[0]);
      
      // ONLY generate fit analysis if we have actual evidence from reviews
      if (fitEvidence.length === 0) {
        console.log(`🔍 ANALYSIS: No fit evidence found in reviews despite ${dominantFit[1]} pattern matches, skipping fit analysis`);
      } else {
        // Get source information for authenticity
        const fitSources = extractSourcesFromEvidence(results, fitEvidence);
        const sourceText = fitSources.length > 0 ? ` (sources: ${fitSources.join(', ')})` : '';
        
        const productType = category === 'shoes' ? 'shoes' : 'items';
        
        let recommendation = '';
        if (dominantFit[0] === 'runsSmall') {
          const exampleQuote = fitEvidence[0].substring(0, 120) + '...';
          recommendation = `Reviews indicate ${brand} ${productType} tend to run small${sourceText}. Customer review: "${exampleQuote}" Consider sizing up.`;
        } else if (dominantFit[0] === 'runsLarge') {
          const exampleQuote = fitEvidence[0].substring(0, 120) + '...';
          recommendation = `Reviews suggest ${brand} ${productType} run large${sourceText}. Customer review: "${exampleQuote}" Consider sizing down.`;
        } else {
          const exampleQuote = fitEvidence[0].substring(0, 120) + '...';
          recommendation = `Reviews indicate ${brand} ${productType} are true-to-size${sourceText}. Customer review: "${exampleQuote}" Order your usual size.`;
        }
        
        analysis.fit = {
          recommendation,
          confidence: dominantFit[1] >= 3 ? 'high' : dominantFit[1] >= 2 ? 'medium' : 'low',
          evidence: fitEvidence
        };
      }
    }
  }
  
  // Analyze quality with enhanced pattern matching for better detection
  const qualityPositive = (allText.match(/high quality|durable|well-made|sturdy|excellent|premium|luxury|luxurious|solid construction|beautiful quality|great quality|amazing quality|love the quality|quality is great|quality is amazing|worth the money|investment piece|good quality|decent quality|quality materials|quality fabric|nice quality|quality pieces|quality construction|timeless construction|natural fabrics|thoughtful silhouettes|impressed|recommend|love|satisfied|happy|perfect|beautiful|gorgeous|amazing|fantastic/g) || []).length;
  const qualityNegative = (allText.match(/poor quality|cheap|flimsy|falls apart|thin material|see through|transparent|cheap feeling|not worth|disappointed|returned|poor construction|badly made|quality come down|quality has gone down|quality declined|fabric.*thinner|fabric.*thin|wish.*thicker|could be thicker|quality issues|quality concerns|regret|waste|terrible|awful|horrible/g) || []).length;
  
  // Much more adaptive quality threshold - prioritize extracting insights
  const totalQualityMentions = qualityPositive + qualityNegative;
  const qualityThreshold = results.length < 10 ? 1 : (results.length < 25 ? 1 : 2); // Very low threshold for smaller brands
  
  // Also check for general review sentiment even without explicit quality keywords
  const generalPositive = (allText.match(/recommend|love|great|amazing|perfect|beautiful|satisfied|happy|impressed|fantastic|excellent/g) || []).length;
  const generalNegative = (allText.match(/disappointed|returned|regret|waste|terrible|awful|horrible|not worth/g) || []).length;
  const totalGeneralSentiment = generalPositive + generalNegative;
  
  // If we have quality mentions OR general sentiment, provide analysis
  if (totalQualityMentions >= qualityThreshold || totalGeneralSentiment >= 2) {
    // Determine sentiment based on both quality and general feedback
    let isPositive, qualityRatio;
    
    if (totalQualityMentions > 0) {
      qualityRatio = qualityPositive / totalQualityMentions;
      isPositive = qualityPositive > qualityNegative;
    } else {
      // Fall back to general sentiment
      qualityRatio = generalPositive / totalGeneralSentiment;
      isPositive = generalPositive > generalNegative;
    }
    
    // Extract actual quality-related quotes from reviews
    const qualityEvidence = extractQualityEvidence(results, isPositive);
    
    let recommendation: string | undefined;
    let confidence: 'low' | 'medium' | 'high' | undefined;
    
    // Get source information for quality evidence
    const qualitySources = extractSourcesFromEvidence(results, qualityEvidence);
    const qualitySourceText = qualitySources.length > 0 ? ` (from ${qualitySources.join(', ')})` : '';
    
    // Generate analysis with available evidence, being more flexible
    const totalRelevantMentions = totalQualityMentions + totalGeneralSentiment;
    
    if (qualityEvidence.length === 0) {
      // Try to generate something useful even without perfect evidence
      if (totalRelevantMentions >= 2) {
        if (isPositive) {
          recommendation = `Customer feedback appears generally positive${qualitySourceText}. Based on available reviews.`;
          confidence = 'low';
        } else {
          recommendation = `Some customer concerns noted in reviews${qualitySourceText}. Mixed feedback reported.`;
          confidence = 'low';
        }
      } else {
        console.log(`🔍 ANALYSIS: Insufficient quality evidence (${totalRelevantMentions} total mentions)`);
      }
    } else if (qualityRatio >= 0.8 && (qualityPositive >= 2 || generalPositive >= 3)) {
      const topQuote = qualityEvidence[0].substring(0, 140) + '...';
      recommendation = `Reviews consistently mention good quality${qualitySourceText}. Customer review: "${topQuote}"`;
      confidence = totalRelevantMentions >= 6 ? 'high' : totalRelevantMentions >= 4 ? 'medium' : 'low';
    } else if (qualityRatio >= 0.6 && (qualityPositive >= 1 || generalPositive >= 2)) {
      const topQuote = qualityEvidence[0].substring(0, 140) + '...';
      recommendation = `Most quality feedback is positive${qualitySourceText}. Customer review: "${topQuote}"`;
      confidence = totalRelevantMentions >= 5 ? 'medium' : 'low';
    } else if (qualityRatio >= 0.4 && totalRelevantMentions >= 2) {
      const concernQuote = qualityEvidence[0].substring(0, 120) + '...';
      const positiveCount = qualityPositive + generalPositive;
      const negativeCount = qualityNegative + generalNegative;
      recommendation = `Mixed quality feedback (${positiveCount} positive vs ${negativeCount} negative mentions)${qualitySourceText}. Customer review: "${concernQuote}"`;
      confidence = totalRelevantMentions >= 5 ? 'medium' : 'low';
    } else if (!isPositive && totalRelevantMentions >= 1) {
      const negativeQuote = qualityEvidence.length > 0 ? qualityEvidence[0].substring(0, 140) + '...' : '';
      recommendation = `Quality concerns noted in reviews${qualitySourceText}. ${negativeQuote ? 'Customer review: "' + negativeQuote + '"' : 'Mixed customer feedback reported.'}`;
      confidence = totalRelevantMentions >= 4 ? 'medium' : 'low';
    } else if (qualityEvidence.length > 0) {
      // Fallback - provide something rather than nothing
      const quote = qualityEvidence[0].substring(0, 140) + '...';
      recommendation = `Customer feedback available${qualitySourceText}. Review: "${quote}"`;
      confidence = 'low';
    }
    
    if (recommendation && confidence) {
      analysis.quality = {
        recommendation,
        confidence,
        evidence: qualityEvidence
      };
    }
  } else {
    console.log(`🔍 ANALYSIS: Insufficient quality mentions (${totalQualityMentions}, need 2+) - skipping quality analysis`);
  }
  
  // Analyze wash/care behavior for clothing items
  if (category === 'clothing') {
    const washPatterns = {
      shrinks: (allText.match(/shrinks?|shrank|got smaller|reduced in size|shrinkage|shrunk in wash|shrank after washing|after wash|washed it|after washing/g) || []).length,
      holds: (allText.match(/holds up|maintains shape|doesn't shrink|keeps its form|washes well|holds shape|no shrinkage|maintained shape|kept its shape|still looks good|washes beautifully/g) || []).length,
      stretches: (allText.match(/stretches out|loses shape|gets baggy|stretched after wash|lost shape|stretchy|elastic|loose after wash/g) || []).length
    };
    
    console.log(`🔍 ANALYSIS: Wash patterns found:`, washPatterns);
    
    const totalWashMentions = washPatterns.shrinks + washPatterns.holds + washPatterns.stretches;
    
    if (totalWashMentions >= 2) {
      const dominantWash = Object.entries(washPatterns).sort((a, b) => b[1] - a[1])[0];
      
      if (dominantWash[1] > 0) {
        // Extract actual wash-related quotes from reviews
        const washEvidence = extractWashCareEvidence(results);
        
        // Get source information for wash evidence
        const washSources = extractSourcesFromEvidence(results, washEvidence);
        const washSourceText = washSources.length > 0 ? ` (from ${washSources.join(', ')})` : '';
        
        let recommendation = '';
        if (dominantWash[0] === 'shrinks') {
          const exampleQuote = washEvidence[0] ? washEvidence[0].substring(0, 120) + '...' : '';
          recommendation = `Multiple customers report items shrink after washing${washSourceText}. ${exampleQuote ? 'One review: "' + exampleQuote + '"' : 'Consider cold wash or sizing up.'}`;
        } else if (dominantWash[0] === 'holds') {
          const exampleQuote = washEvidence[0] ? washEvidence[0].substring(0, 120) + '...' : '';
          recommendation = `Items maintain shape well after washing${washSourceText}. ${exampleQuote ? 'Customer feedback: "' + exampleQuote + '"' : 'Good durability reported.'}`;
        } else if (dominantWash[0] === 'stretches') {
          const exampleQuote = washEvidence[0] ? washEvidence[0].substring(0, 120) + '...' : '';
          recommendation = `Some items may stretch out with wear/washing${washSourceText}. ${exampleQuote ? 'Review mentions: "' + exampleQuote + '"' : 'Consider sizing down or gentle care.'}`;
        }
        
        analysis.washCare = {
          recommendation,
          confidence: totalWashMentions >= 4 ? 'high' : totalWashMentions >= 2 ? 'medium' : 'low',
          evidence: washEvidence
        };
      }
    } else {
      console.log(`🔍 ANALYSIS: Insufficient wash mentions (${totalWashMentions}, need 2+) - skipping wash analysis`);
    }
  }
  
  // Analyze fabric/material information
  if (category === 'clothing') {
    const materialMentions = {
      cotton: (allText.match(/cotton|organic cotton|100% cotton/g) || []).length,
      polyester: (allText.match(/polyester|poly|synthetic/g) || []).length,
      wool: (allText.match(/wool|merino|cashmere|alpaca/g) || []).length,
      linen: (allText.match(/linen|flax/g) || []).length,
      silk: (allText.match(/silk/g) || []).length,
      modal: (allText.match(/modal|tencel|lyocell/g) || []).length,
      spandex: (allText.match(/spandex|elastane|stretch/g) || []).length
    };
    
    const fabricQuality = {
      soft: (allText.match(/soft|comfortable|cozy|smooth/g) || []).length,
      breathable: (allText.match(/breathable|airy|cooling/g) || []).length,
      durable: (allText.match(/durable|lasting|holds up|strong fabric/g) || []).length,
      pilling: (allText.match(/pilling|pills|bobbles/g) || []).length,
      stretchy: (allText.match(/stretchy|stretch|elastic|flexible/g) || []).length
    };
    
    const mentionedMaterials = Object.entries(materialMentions)
      .filter(([, count]) => count > 0)
      .sort(([, countA], [, countB]) => countB - countA)
      .map(([material]) => material);
    
    if (mentionedMaterials.length > 0 || Object.values(fabricQuality).some(count => count > 0)) {
      const qualityDescriptions = [];
      
      if (fabricQuality.soft > 0) qualityDescriptions.push('soft feel');
      if (fabricQuality.breathable > 0) qualityDescriptions.push('breathable');
      if (fabricQuality.stretchy > 0) qualityDescriptions.push('good stretch');
      if (fabricQuality.pilling > 0) qualityDescriptions.push('may pill');
      
      // Extract fabric-related evidence from actual reviews
      const fabricEvidence = extractFabricEvidence(results, mentionedMaterials, qualityDescriptions);
      
      // Get source information for fabric evidence
      const fabricSources = extractSourcesFromEvidence(results, fabricEvidence);
      const fabricSourceText = fabricSources.length > 0 ? ` (sources: ${fabricSources.join(', ')})` : '';
      
      let recommendation = '';
      if (mentionedMaterials.length > 0) {
        recommendation = `External reviews mention materials: ${mentionedMaterials.slice(0, 3).join(', ')}${fabricSourceText}`;
        if (qualityDescriptions.length > 0) {
          recommendation += `. Customers describe the fabric as ${qualityDescriptions.join(', ')}`;
        }
        if (fabricEvidence.length > 0) {
          recommendation += `. One review: "${fabricEvidence[0].substring(0, 120)}..."`;
        }
      } else if (qualityDescriptions.length > 0) {
        recommendation = `External sources describe fabric as ${qualityDescriptions.join(', ')}${fabricSourceText}`;
        if (fabricEvidence.length > 0) {
          recommendation += `. A reviewer noted: "${fabricEvidence[0].substring(0, 120)}..."`;
        }
      }
      
      const totalMentions = Object.values(materialMentions).reduce((a, b) => a + b, 0) + 
                           Object.values(fabricQuality).reduce((a, b) => a + b, 0);
      
      analysis.fabric = {
        recommendation,
        confidence: totalMentions >= 4 ? 'medium' : 'low',
        evidence: fabricEvidence
      };
    }
  } else if (category === 'bags') {
    // For bags, analyze leather/material quality differently
    const bagMaterials = {
      leather: (allText.match(/leather|genuine leather|real leather|cowhide/g) || []).length,
      canvas: (allText.match(/canvas|cotton canvas/g) || []).length,
      nylon: (allText.match(/nylon|ballistic nylon/g) || []).length,
      suede: (allText.match(/suede/g) || []).length,
      vegan: (allText.match(/vegan leather|faux leather|synthetic leather/g) || []).length
    };
    
    const bagQuality = {
      soft: (allText.match(/soft|supple|buttery/g) || []).length,
      durable: (allText.match(/durable|sturdy|holds up|strong/g) || []).length,
      scratches: (allText.match(/scratch|scratches|scuff|scuffs/g) || []).length,
      stiff: (allText.match(/stiff|rigid|structured/g) || []).length
    };
    
    const mentionedMaterials = Object.entries(bagMaterials)
      .filter(([, count]) => count > 0)
      .sort(([, countA], [, countB]) => countB - countA)
      .map(([material]) => material);
    
    if (mentionedMaterials.length > 0 || Object.values(bagQuality).some(count => count > 0)) {
      const materialEvidence = extractFabricEvidence(results, mentionedMaterials, []);
      const materialSources = extractSourcesFromEvidence(results, materialEvidence);
      const materialSourceText = materialSources.length > 0 ? ` (sources: ${materialSources.join(', ')})` : '';
      
      let recommendation = '';
      if (mentionedMaterials.length > 0) {
        recommendation = `External reviews mention materials: ${mentionedMaterials.slice(0, 3).join(', ')}${materialSourceText}`;
        if (materialEvidence.length > 0) {
          recommendation += `. One review: "${materialEvidence[0].substring(0, 120)}..."`;
        }
      }
      
      analysis.fabric = {
        recommendation,
        confidence: mentionedMaterials.length >= 2 ? 'medium' : 'low',
        evidence: materialEvidence
      };
    }
  }
  
  // Material analysis for specific item searches
  if (isSpecificItem && itemName && category === 'clothing') {
    const materialEvidence = extractMaterialComposition(results, brand, itemName);
    
    if (materialEvidence.composition.length > 0) {
      analysis.materials = {
        composition: materialEvidence.composition,
        confidence: materialEvidence.confidence,
        evidence: materialEvidence.evidence
      };
      
      console.log('🔍 ANALYSIS: Material composition found:', materialEvidence.composition);
    }
  }
  
  // Calculate overall confidence
  const confidences = Object.values(analysis)
    .map((a) => a.confidence)
    .filter(Boolean);
  
  analysis.overallConfidence = confidences.includes('high') ? 'high' 
    : confidences.includes('medium') ? 'medium' 
    : 'low';
  
  return analysis;
}

function extractEvidence(results: SerperResult[], pattern: string): string[] {
  const evidence: string[] = [];
  const keywords = {
    runsSmall: ['runs small', 'size up', 'tight', 'small', 'snug', 'fitted'],
    runsLarge: ['runs large', 'size down', 'loose', 'big', 'oversized', 'baggy'],
    trueToSize: ['true to size', 'fits perfectly', 'accurate', 'normal', 'as expected', 'usual size']
  };
  
  const relevant = keywords[pattern as keyof typeof keywords] || [];
  
  // More flexible evidence extraction - look through more results
  for (const result of results.slice(0, 10)) {
    const text = `${result.title} ${result.snippet}`.toLowerCase();
    
    // Check for any relevant keywords
    const hasRelevantKeyword = relevant.some(k => text.includes(k));
    
    // Also look for fit-related context even without exact keywords
    const hasFitContext = text.includes('fit') || text.includes('size') || text.includes('sizing');
    
    if (hasRelevantKeyword || (hasFitContext && pattern !== 'quality')) {
      const snippet = result.snippet || result.title;
      if (snippet && snippet.length > 10) {
        // Clean and truncate snippet
        const cleanSnippet = snippet.substring(0, 150).trim();
        if (cleanSnippet && !evidence.some(e => e.includes(cleanSnippet.substring(0, 30)))) {
          evidence.push(cleanSnippet + (cleanSnippet.length >= 150 ? '...' : ''));
        }
      }
    }
    if (evidence.length >= 3) break; // Increased from 2 to 3
  }
  
  return evidence;
}

function extractQualityEvidence(results: SerperResult[], isPositive: boolean): string[] {
  const evidence: string[] = [];
  
  // More comprehensive and flexible keyword matching
  const positiveKeywords = [
    'high quality', 'well-made', 'durable', 'excellent', 'premium', 'luxury', 'luxurious',
    'love the quality', 'great quality', 'amazing quality', 'good quality', 'quality is',
    'well made', 'solid construction', 'beautiful quality', 'worth the money', 
    'investment piece', 'quality materials', 'quality fabric', 'timeless construction',
    'thoughtful silhouettes', 'natural fabrics', 'impressed', 'recommend', 'love',
    'satisfied', 'happy', 'perfect', 'beautiful', 'gorgeous', 'amazing', 'fantastic'
  ];
  
  const negativeKeywords = [
    'poor quality', 'cheap', 'flimsy', 'falls apart', 'disappointed', 'not worth',
    'cheap feeling', 'thin material', 'see through', 'poor construction', 
    'badly made', 'quality declined', 'quality issues', 'quality concerns',
    'returned', 'regret', 'waste', 'terrible', 'awful', 'horrible'
  ];
  
  const keywords = isPositive ? positiveKeywords : negativeKeywords;
  
  // Look through more results and be more flexible
  for (const result of results.slice(0, 15)) {
    const text = `${result.title} ${result.snippet}`.toLowerCase();
    const matchingKeywords = keywords.filter(k => text.includes(k));
    
    // Also extract evidence for general review context even without perfect keyword matches
    const hasGeneralContext = text.includes('review') || text.includes('experience') || 
                              text.includes('bought') || text.includes('ordered') ||
                              text.includes('tried') || text.includes('wear');
    
    if (matchingKeywords.length > 0 || (hasGeneralContext && evidence.length < 2)) {
      const snippet = result.snippet || result.title;
      if (snippet && snippet.length > 15) {
        const cleanSnippet = snippet.substring(0, 180).trim();
        if (!evidence.some(e => e.includes(cleanSnippet.substring(0, 40)))) {
          evidence.push(cleanSnippet + (cleanSnippet.length >= 180 ? '...' : ''));
        }
      }
    }
    if (evidence.length >= 4) break; // Increased from 3 to 4
  }
  
  return evidence;
}

function extractWashCareEvidence(results: SerperResult[]): string[] {
  const evidence: string[] = [];
  // Focus on actual post-wash experiences, not care instructions
  const postWashKeywords = [
    'after wash', 'washed it', 'after washing', 'holds up well', 'maintained shape', 
    'kept its shape', 'shrunk', 'shrank', 'faded', 'pilled', 'stretched out',
    'lost its shape', 'fell apart', 'still looks good', 'washes beautifully'
  ];
  
  for (const result of results.slice(0, 10)) {
    const text = `${result.title} ${result.snippet}`.toLowerCase();
    
    // Look for actual customer experiences about post-wash results
    if (postWashKeywords.some(k => text.includes(k))) {
      const snippet = result.snippet;
      if (snippet && !evidence.some(e => e.includes(snippet.substring(0, 50)))) {
        evidence.push(snippet);
      }
    }
    if (evidence.length >= 3) break;
  }
  
  return evidence;
}

function extractFabricEvidence(results: SerperResult[], materials: string[], qualities: string[]): string[] {
  const evidence: string[] = [];
  const fabricKeywords = [
    ...materials,
    ...qualities.map(q => q.replace(' feel', '').replace('good ', '')),
    'material', 'fabric', 'soft', 'comfortable', 'breathable', 'stretchy', 'cotton', 'polyester'
  ];
  
  for (const result of results.slice(0, 8)) {
    const text = `${result.title} ${result.snippet}`.toLowerCase();
    
    if (fabricKeywords.some(k => text.includes(k.toLowerCase()))) {
      const snippet = result.snippet;
      if (snippet && !evidence.some(e => e.includes(snippet.substring(0, 50)))) {
        evidence.push(snippet);
      }
    }
    if (evidence.length >= 2) break;
  }
  
  return evidence;
}

function extractMaterialComposition(results: SerperResult[], brand: string, itemName: string): {
  composition: string[];
  confidence: 'low' | 'medium' | 'high';
  evidence: string[];
} {
  const composition: string[] = [];
  const evidence: string[] = [];
  
  // Common material patterns to look for
  const materialPatterns = [
    // Percentage-based compositions
    /(\d+%\s*(?:organic\s+)?(?:pima\s+)?(?:supima\s+)?cotton)/gi,
    /(\d+%\s*(?:merino\s+)?wool)/gi,
    /(\d+%\s*silk)/gi,
    /(\d+%\s*linen)/gi,
    /(\d+%\s*cashmere)/gi,
    /(\d+%\s*polyester)/gi,
    /(\d+%\s*nylon)/gi,
    /(\d+%\s*spandex)/gi,
    /(\d+%\s*elastane)/gi,
    /(\d+%\s*modal)/gi,
    /(\d+%\s*tencel)/gi,
    /(\d+%\s*lyocell)/gi,
    /(\d+%\s*viscose)/gi,
    
    // Full material descriptions
    /(100% organic cotton)/gi,
    /(100% cotton)/gi,
    /(100% merino wool)/gi,
    /(100% wool)/gi,
    /(100% silk)/gi,
    /(100% linen)/gi,
    /(100% cashmere)/gi,
    
    // Blends
    /(cotton blend)/gi,
    /(wool blend)/gi,
    /(silk blend)/gi,
    /(cotton\/polyester blend)/gi,
    /(wool\/cashmere blend)/gi,
  ];
  
  for (const result of results) {
    const text = `${result.title} ${result.snippet}`;
    
    // Check if this result is specifically about our brand and item
    const brandItemMatch = text.toLowerCase().includes(brand.toLowerCase()) && 
                          text.toLowerCase().includes(itemName.toLowerCase());
    
    if (brandItemMatch) {
      // Look for material patterns
      for (const pattern of materialPatterns) {
        const matches = text.match(pattern);
        if (matches) {
          for (const match of matches) {
            const cleanMatch = match.trim().toLowerCase();
            // Avoid duplicates and ensure quality
            if (!composition.some(c => c.toLowerCase() === cleanMatch)) {
              composition.push(match.trim());
            }
          }
          
          // Add evidence if we found material info
          if (matches.length > 0 && result.snippet) {
            const snippet = result.snippet.trim();
            if (!evidence.some(e => e.includes(snippet.substring(0, 50)))) {
              evidence.push(snippet);
            }
          }
        }
      }
    }
  }
  
  // Determine confidence based on amount of evidence found
  let confidence: 'low' | 'medium' | 'high' = 'low';
  if (composition.length >= 3 && evidence.length >= 2) {
    confidence = 'high';
  } else if (composition.length >= 2 && evidence.length >= 1) {
    confidence = 'medium';
  }
  
  return {
    composition: composition.slice(0, 5), // Limit to top 5 compositions
    confidence,
    evidence: evidence.slice(0, 3) // Limit to top 3 evidence pieces
  };
}

function extractSourcesFromEvidence(results: SerperResult[], evidence: string[]): string[] {
  if (!evidence.length) return [];
  
  const sources = new Set<string>();
  
  // Match evidence snippets back to their source URLs
  for (const evidenceText of evidence.slice(0, 3)) { // Check first 3 pieces of evidence
    for (const result of results) {
      if (result.snippet && evidenceText.includes(result.snippet.substring(0, 50))) {
        const sourceUrl = result.link || result.displayed_link || '';
        const sourceName = extractReadableSourceName(sourceUrl);
        if (sourceName) {
          sources.add(sourceName);
        }
      }
    }
  }
  
  return Array.from(sources).slice(0, 3); // Limit to 3 sources for readability
}

function extractReadableSourceName(url: string): string {
  if (!url) return '';
  
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace('www.', '');
    
    // Map common domains to readable names
    const sourceMap: { [key: string]: string } = {
      'reddit.com': 'Reddit',
      'substack.com': 'Substack', 
      'medium.com': 'Medium',
      'youtube.com': 'YouTube',
      'instagram.com': 'Instagram',
      'twitter.com': 'Twitter',
      'pinterest.com': 'Pinterest',
      'styleforum.net': 'StyleForum',
      'thefashionspot.com': 'The Fashion Spot',
      'vogue.com': 'Vogue',
      'elle.com': 'Elle',
      'harpersbazaar.com': 'Harper\'s Bazaar',
      'glamour.com': 'Glamour',
      'refinery29.com': 'Refinery29'
    };
    
    // Check for exact matches first
    if (sourceMap[hostname]) {
      return sourceMap[hostname];
    }
    
    // Check for subdomain matches (like user.substack.com)
    for (const [domain, name] of Object.entries(sourceMap)) {
      if (hostname.endsWith(domain)) {
        return name;
      }
    }
    
    // Fallback: capitalize first part of domain
    const domainParts = hostname.split('.');
    if (domainParts.length > 0) {
      const firstPart = domainParts[0];
      return firstPart.charAt(0).toUpperCase() + firstPart.slice(1);
    }
    
    return '';
  } catch {
    return '';
  }
}

// Generate a detailed, nuanced summary from the analysis
function generateDetailedSummary(analysis: AnalysisResult, results: Review[], brand: string, category: 'clothing' | 'bags' | 'shoes' | 'accessories' | 'general' = 'general'): string {
  const totalReviews = results.length;
  
  // Get unique sources for transparency
  const allSources = new Set<string>();
  for (const result of results.slice(0, 10)) {
    const sourceName = extractReadableSourceName(result.url || '');
    if (sourceName) {
      allSources.add(sourceName);
    }
  }
  const sourcesList = Array.from(allSources).slice(0, 4);
  
  // Generate conversational summary in personal summary style
  const summaryParts: string[] = [];
  
  // Start with context about what we found
  if (totalReviews > 0) {
    const sourcesText = sourcesList.length > 0 ? ` from sources like ${sourcesList.join(', ')}` : ' from various review sources';
    summaryParts.push(`Based on feedback from ${totalReviews} reviews${sourcesText}, here's what customers are saying about ${brand}:`);
    summaryParts.push(''); // Add spacing
  }
  
  // Add fit analysis in conversational tone (only for clothing/shoes)
  if (analysis.fit && analysis.fit.evidence && analysis.fit.evidence.length > 0 && (category === 'clothing' || category === 'shoes')) {
    const productType = category === 'shoes' ? 'shoes' : 'clothing';
    
    if (analysis.fit.recommendation.toLowerCase().includes('run small') || analysis.fit.recommendation.toLowerCase().includes('runs small')) {
      if (analysis.fit.confidence === 'high') {
        summaryParts.push(`**Sizing**: Most reviewers agree that ${brand} ${productType} run small. You'll likely want to size up from your usual size.`);
      } else {
        summaryParts.push(`**Sizing**: Some customers find ${brand} ${productType} run small, though experiences vary. Consider sizing up if you prefer a looser fit.`);
      }
    } else if (analysis.fit.recommendation.toLowerCase().includes('run large') || analysis.fit.recommendation.toLowerCase().includes('runs large')) {
      if (analysis.fit.confidence === 'high') {
        summaryParts.push(`**Sizing**: Customer reviews consistently mention that ${brand} ${productType} run large. Most people recommend sizing down.`);
      } else {
        summaryParts.push(`**Sizing**: There's some indication that ${brand} ${productType} may run large, but experiences are mixed. Your usual size should work for most people.`);
      }
    } else if (analysis.fit.recommendation.toLowerCase().includes('true to size') || analysis.fit.recommendation.toLowerCase().includes('true-to-size')) {
      if (analysis.fit.confidence === 'high') {
        summaryParts.push(`**Sizing**: Great news - ${brand} ${productType} are consistently described as true to size. Your usual size should work perfectly.`);
      } else {
        summaryParts.push(`**Sizing**: ${brand} ${productType} generally fit as expected. Most customers stick with their usual size.`);
      }
    } else {
      // Catch-all for other fit feedback
      if (analysis.fit.confidence === 'medium' || analysis.fit.confidence === 'high') {
        summaryParts.push(`**Sizing**: Customer experiences with ${brand} ${productType} sizing are mixed. Check individual reviews for specific items you're considering.`);
      }
    }
    summaryParts.push(''); // Add spacing
  }
  
  // Add quality insights in personal tone
  if (analysis.quality && analysis.quality.evidence && analysis.quality.evidence.length > 0) {
    if (analysis.quality.confidence === 'high') {
      summaryParts.push(`**Quality**: Customers consistently praise ${brand}'s construction quality. Reviews highlight attention to detail and durable materials.`);
    } else if (analysis.quality.confidence === 'medium') {
      summaryParts.push(`**Quality**: Most customers seem satisfied with ${brand}'s quality, though some mention inconsistencies.`);
    } else {
      summaryParts.push(`**Quality**: There's mixed feedback on quality - some love it, others have concerns. Worth reading individual reviews for specific items.`);
    }
    summaryParts.push(''); // Add spacing
  }
  
  // Add material insights for bags/accessories
  if (category === 'bags' || category === 'accessories') {
    if (analysis.fabric && analysis.fabric.recommendation) {
      const materialInfo = analysis.fabric.recommendation;
      if (materialInfo.includes('mention materials:')) {
        const materials = materialInfo.split('mention materials:')[1].split('.')[0].trim();
        summaryParts.push(`**Materials**: Reviews mention materials like ${materials}. Customers appreciate the material choices.`);
        summaryParts.push(''); // Add spacing
      }
    }
  }
  
  // Add care instructions insights if available
  if (analysis.washCare && analysis.washCare.recommendation) {
    if (analysis.washCare.recommendation.includes('gentle') || analysis.washCare.recommendation.includes('cold')) {
      summaryParts.push(`**Care**: Customers recommend gentle care - cold wash and air dry seem to work best for maintaining quality.`);
      summaryParts.push(''); // Add spacing
    } else if (analysis.washCare.recommendation.includes('shrink')) {
      summaryParts.push(`**Care**: Some customers mention sizing changes after washing. Follow care instructions carefully to maintain fit.`);
      summaryParts.push(''); // Add spacing
    }
  }
  
  // Add confidence note in personal tone
  if (analysis.overallConfidence === 'low' && totalReviews < 5) {
    summaryParts.push(`Keep in mind there's limited review data for ${brand}, so individual experiences might vary more than usual.`);
  } else if (analysis.overallConfidence === 'medium' && totalReviews >= 5) {
    summaryParts.push(`These insights come from real customer experiences, though everyone's preferences and body types are different.`);
  }
  
  // Improved fallback - try to provide some insight even with minimal analysis
  if (summaryParts.length <= 2) { // Only intro and spacing
    // Try to extract at least some general sentiment from the reviews
    let fallbackInsight = '';
    
    if (totalReviews >= 10) {
      fallbackInsight = `Found ${totalReviews} reviews for ${brand}. While individual experiences vary, customer feedback suggests checking specific product reviews for detailed fit and quality insights.`;
    } else if (totalReviews >= 5) {
      fallbackInsight = `Based on ${totalReviews} reviews for ${brand}, customer experiences show mixed feedback. Individual product reviews will provide the most relevant insights for your specific needs.`;
    } else if (totalReviews >= 2) {
      fallbackInsight = `Limited review data available for ${brand} (${totalReviews} reviews found). Consider checking individual product pages and recent customer feedback for the most current insights.`;
    } else {
      fallbackInsight = `Very limited review data found for ${brand}. You may want to check the brand's website or recent social media mentions for more current customer feedback.`;
    }
    
    return fallbackInsight;
  }
  
  // Join parts with proper line breaks
  return summaryParts.join('\n').trim();
}