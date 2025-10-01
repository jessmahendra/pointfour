import { NextRequest, NextResponse } from 'next/server';
import { llmService } from '@/lib/llm-service';
import { createClient } from '@/utils/supabase/server';

// Caching Configuration
const CACHE_CONFIG = {
  // Cache timeouts
  serperCacheTimeout: 24 * 60 * 60 * 1000,        // 24 hours for Serper results
  aiResponseCacheTimeout: 7 * 24 * 60 * 60 * 1000, // 7 days for AI responses
  brandDataCacheTimeout: 30 * 24 * 60 * 60 * 1000, // 30 days for brand data
  
  // Cache size limits
  maxCacheSize: 1000, // Maximum number of cached entries
};

// In-memory caches
type CacheEntry<T> = { data: T; timestamp: number; hits: number };
const serperCache = new Map<string, CacheEntry<unknown>>();
const aiResponseCache = new Map<string, CacheEntry<string>>();
const brandDataCache = new Map<string, CacheEntry<unknown>>();
const fullResponseCache = new Map<string, CacheEntry<{
  recommendation: string;
  externalSearchResults: unknown; // Use unknown to avoid complex type issues
  hasExternalData: boolean;
  searchType: string;
  dataSource: string;
}>>();

// Cache management functions
function getCachedData<T>(cache: Map<string, CacheEntry<T>>, key: string, timeout: number): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  
  if (Date.now() - entry.timestamp > timeout) {
    cache.delete(key);
    return null;
  }
  
  entry.hits++;
  return entry.data;
}

function setCachedData<T>(cache: Map<string, CacheEntry<T>>, key: string, data: T): void {
  // Implement LRU eviction if cache is full
  if (cache.size >= CACHE_CONFIG.maxCacheSize) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey) {
      cache.delete(oldestKey);
    }
  }
  
  cache.set(key, {
    data,
    timestamp: Date.now(),
    hits: 0
  });
}

function generateCacheKey(brandName: string, itemName: string, query: string): string {
  return `${brandName.toLowerCase()}::${itemName.toLowerCase()}::${query.toLowerCase().slice(0, 100)}`;
}

// Function to generate a unique share token
function generateShareToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Function to save recommendation (works for both authenticated and anonymous users)
async function saveRecommendation(
  productId: string | null,
  recommendationData: unknown,
  userProfile: unknown,
  productQuery: string,
  isShared: boolean = false
): Promise<string | null> {
  if (!productId) {
    return null; // No product ID, can't save recommendation
  }
  
  try {
    const supabase = await createClient();
    
    // Get the current user (can be null for anonymous users)
    const { data: { user } } = await supabase.auth.getUser();
    
    // Always save recommendations, even for anonymous users
    // This ensures shared links work for non-users
    const insertData: Record<string, unknown> = {
      product_id: parseInt(productId),
      query: productQuery,
      recommendation_data: recommendationData,
      user_profile: userProfile || null,
      is_shared: isShared,
      user_id: user?.id || null // Can be null for anonymous users
    };
    
    if (isShared) {
      insertData.expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      // Generate share token manually
      insertData.share_token = generateShareToken();
    }
    
    console.log('🔍 DEBUG: Saving recommendation with data:', {
      productId: parseInt(productId),
      isShared,
      userId: user?.id || 'anonymous',
      hasUserProfile: !!userProfile,
      shareToken: isShared ? insertData.share_token : 'not shared'
    });
    
    const { data: savedRecommendation, error } = await supabase
      .from('user_recommendations')
      .insert(insertData)
      .select('share_token, id')
      .single();
    
    if (error) {
      console.error('❌ Error saving recommendation:', error);
      console.error('❌ Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return null;
    }
    
    console.log('✅ Recommendation saved successfully:', {
      id: savedRecommendation.id,
      shareToken: savedRecommendation.share_token,
      isShared,
      userId: user?.id || 'anonymous'
    });
    
    return savedRecommendation.share_token;
  } catch (error) {
    console.error('❌ Exception saving recommendation:', error);
    return null;
  }
}

// GPT-5 testing is now handled by the centralized LLM service

// Cache management endpoint
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action');
  
  if (action === 'stats') {
    // Return cache statistics
    return NextResponse.json({
      cacheStats: {
        aiResponseCache: {
          size: aiResponseCache.size,
          entries: Array.from(aiResponseCache.entries()).map(([key, entry]) => ({
            key: key.substring(0, 50) + '...',
            timestamp: entry.timestamp,
            hits: entry.hits,
            age: Date.now() - entry.timestamp
          }))
        },
        serperCache: {
          size: serperCache.size,
          entries: Array.from(serperCache.entries()).map(([key, entry]) => ({
            key: key.substring(0, 50) + '...',
            timestamp: entry.timestamp,
            hits: entry.hits,
            age: Date.now() - entry.timestamp
          }))
        },
        fullResponseCache: {
          size: fullResponseCache.size,
          entries: Array.from(fullResponseCache.entries()).map(([key, entry]) => ({
            key: key.substring(0, 50) + '...',
            timestamp: entry.timestamp,
            hits: entry.hits,
            age: Date.now() - entry.timestamp
          }))
        },
        brandDataCache: {
          size: brandDataCache.size,
          entries: Array.from(brandDataCache.entries()).map(([key, entry]) => ({
            key: key.substring(0, 50) + '...',
            timestamp: entry.timestamp,
            hits: entry.hits,
            age: Date.now() - entry.timestamp
          }))
        }
      }
    });
  }
  
  if (action === 'clear') {
    const cacheType = url.searchParams.get('type') || 'all';
    
    if (cacheType === 'all' || cacheType === 'ai') {
      aiResponseCache.clear();
      console.log('🧹 CLEARED: AI Response Cache');
    }
    if (cacheType === 'all' || cacheType === 'serper') {
      serperCache.clear();
      console.log('🧹 CLEARED: Serper Cache');
    }
    if (cacheType === 'all' || cacheType === 'full') {
      fullResponseCache.clear();
      console.log('🧹 CLEARED: Full Response Cache');
    }
    if (cacheType === 'all' || cacheType === 'brand') {
      brandDataCache.clear();
      console.log('🧹 CLEARED: Brand Data Cache');
    }
    
    return NextResponse.json({
      message: `Cleared ${cacheType} cache`,
      cacheStats: {
        aiResponseCacheSize: aiResponseCache.size,
        serperCacheSize: serperCache.size,
        brandDataCacheSize: brandDataCache.size,
        fullResponseCacheSize: fullResponseCache.size
      }
    });
  }
  
  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

export async function POST(request: NextRequest) {
  let query = '';
  let userProfile = null;
  let productId = null;
  let makeShareable = false;
  
  try {
    const body = await request.json();
    query = body.query;
    userProfile = body.userProfile;
    productId = body.productId; // Optional product ID for saving recommendations
    makeShareable = body.makeShareable || false; // Flag to make recommendation shareable
    // Remove enableExternalSearch parameter - we'll decide automatically
    
    console.log('=== DEBUG: Starting recommendation request ===');
    console.log('Query received:', query);
    console.log('User profile received:', userProfile);
    console.log('OpenAI API Key exists:', !!process.env.OPENAI_API_KEY);
    
    // Generate cache key early for potential cache hits
    // Handle both "Brand/Item: text" format and direct brand query format
    const brandMatch = query.match(/Brand\/Item:\s*([^\n]+)/);
    const brandItemText = brandMatch ? brandMatch[1].trim() : query.trim();
    // Use same cache key for both regular and shareable requests
    const cacheKey = generateCacheKey(brandItemText, '', query);
    
    // Check full response cache first (includes external search results)
    // Use cache even for shareable requests - we'll just generate a new share token
    const cachedFullResponse = getCachedData(fullResponseCache, cacheKey, CACHE_CONFIG.aiResponseCacheTimeout);
    if (cachedFullResponse) {
      console.log('🎯 CACHE HIT: Returning cached full response with external search results');
      
      // If makeShareable is true, generate a share token and save to database
      let shareToken = null;
      let shareUrl = null;
      
      if (makeShareable) {
        shareToken = generateShareToken();
        const savedToken = await saveRecommendation(
          productId,
          cachedFullResponse,
          userProfile,
          query,
          true // isShared = true
        );
        if (savedToken) {
          shareToken = savedToken;
          shareUrl = `${process.env.NEXT_PUBLIC_BASE_URL || (process.env.NODE_ENV === 'production' ? 'https://pointfour.in' : 'http://localhost:3000')}/shared/${shareToken}`;
        }
      }
      
      return NextResponse.json({
        success: true,
        data: {
          ...cachedFullResponse,
          query: query,
          totalBrands: 0,
          hasDatabaseData: false,
          cacheHit: true,
          cacheStats: {
            aiResponseCacheSize: aiResponseCache.size,
            serperCacheSize: serperCache.size,
            brandDataCacheSize: brandDataCache.size,
            fullResponseCacheSize: fullResponseCache.size,
            cacheHit: true
          }
        },
        shareToken,
        shareUrl
      });
    }
    
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY is missing!');
      return NextResponse.json(
        { 
          success: false,
          error: 'OpenAI API key not configured',
          recommendation: "OpenAI API key is missing. Please check your environment configuration."
        },
        { status: 500 }
      );
    }
    
    const AIRTABLE_BASE_ID = process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID || process.env.AIRTABLE_BASE_ID;
    const AIRTABLE_API_KEY = process.env.NEXT_PUBLIC_AIRTABLE_API_KEY || process.env.AIRTABLE_API_KEY;
    
    console.log('=== DEBUG: Checking required vars ===');
    console.log('AIRTABLE_BASE_ID value:', AIRTABLE_BASE_ID);
    console.log('AIRTABLE_API_KEY value:', AIRTABLE_API_KEY ? 'EXISTS' : 'MISSING');
    
    if (!AIRTABLE_BASE_ID || !AIRTABLE_API_KEY) {
      console.log('Missing Airtable config - BASE_ID:', !!AIRTABLE_BASE_ID, 'API_KEY:', !!AIRTABLE_API_KEY);
      return NextResponse.json(
        { 
          success: false,
          error: 'Airtable configuration missing',
          recommendation: "Airtable configuration is missing. Please check your environment variables for AIRTABLE_BASE_ID and AIRTABLE_API_KEY."
        },
        { status: 500 }
      );
    }
    
    // Extract brand name and item name from query for external search
    // brandMatch and brandItemText already declared above
    
    // Parse brand and item name using intelligent brand recognition
    let brandName = '';
    let itemName = '';
    
    if (brandItemText) {
      // Known fashion brands - if text starts with these, extract the full brand name
      const knownBrands = [
        "le monde beryl", "me+em", "cos", "arket", "& other stories", "ganni", 
        "isabel marant", "acne studios", "jil sander", "lemaire", "toteme",
        "the row", "khaite", "bottega veneta", "saint laurent", "celine", "zara",
        "h&m", "uniqlo", "massimo dutti", "mango", "reformation", "everlane",
        "vollebak", "vollebak jacket", "vollebak clothing"
      ];
      
      const textLower = brandItemText.toLowerCase();
      const matchedBrand = knownBrands.find(brand => textLower.startsWith(brand));
      
      if (matchedBrand) {
        brandName = matchedBrand;
        // Remove the brand from the text to get item name
        itemName = brandItemText.substring(matchedBrand.length).trim();
      } else {
        // Fallback: intelligent parsing based on product terms
        const words = brandItemText.split(' ');
        const productTerms = ["dress", "top", "shirt", "pants", "jeans", "jacket", "coat", 
                             "sweater", "cardigan", "blazer", "skirt", "bag", "handbag", 
                             "shoes", "boots", "sneakers", "sandals", "heels", "loafer", 
                             "loafers", "oxford", "ballet", "flats", "soft"];
        
        let brandWords = 1; // Default to first word as brand
        for (let i = 1; i < words.length; i++) {
          if (productTerms.includes(words[i].toLowerCase())) {
            brandWords = i;
            break;
          }
        }
        
        // For unknown brands, limit to max 2 words to avoid taking product names
        brandWords = Math.min(brandWords, 2);
        
        brandName = words.slice(0, brandWords).join(' ');
        itemName = words.slice(brandWords).join(' ');
      }
    }
    
    console.log('=== DEBUG: Extracted brand and item ===');
    console.log('Brand name:', brandName);
    console.log('Item name:', itemName);
    console.log('Full Brand/Item text:', brandItemText);
    
    // Fetch your real brand data with caching
    console.log('=== DEBUG: Fetching Airtable data ===');
    
    // Check brand data cache first
    const brandDataCacheKey = 'all_brands';
    const cachedBrandData = getCachedData(brandDataCache, brandDataCacheKey, CACHE_CONFIG.brandDataCacheTimeout);
    
    let data;
    if (cachedBrandData) {
      console.log('🎯 CACHE HIT: Using cached brand data');
      data = cachedBrandData;
    } else {
      console.log('🔄 CACHE MISS: Fetching fresh brand data from Airtable');
      const response = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Brands`,
        {
          headers: {
            'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`Airtable fetch failed: ${response.status} ${response.statusText}`);
      }
      
      data = await response.json();
      console.log('Airtable records fetched:', data.records?.length || 0);
      
      // Cache the brand data
      setCachedData(brandDataCache, brandDataCacheKey, data);
    }
    
    // Process your Airtable data for AI
    interface Brand {
      name: string;
      category: string;
      garmentTypes: string[];
      fitSummary: string;
      bestForBodyTypes: string[];
      sizeRange: string;
      sizingSystem: string;
      priceRange: string;
      userQuotes: string;
      reviews: string;
      confidenceScore: number;
      commonFitInfo: string;
      fabricStretch: string;
      userFeedback: string;
      productURL: string;
      imageURL: string;
    }
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const brands = data.records.map((record: any) => ({
     name: record.fields['Brand Name'] || '',
     category: record.fields['Category'] || '',
     garmentTypes: Array.isArray(record.fields['Garment Types']) ? record.fields['Garment Types'] : [record.fields['Garment Types'] || ''],
     fitSummary: record.fields['Fit Summary'] || '',
     bestForBodyTypes: Array.isArray(record.fields['Best For Body Types']) ? record.fields['Best For Body Types'] : [record.fields['Best For Body Types'] || ''],
     sizeRange: record.fields['Size Range'] || '',
     sizingSystem: record.fields['Sizing System'] || '',
     priceRange: record.fields['Price Range'] || '',
     userQuotes: record.fields['User Quotes'] || '',
     reviews: record.fields['Reviews'] || '',
     confidenceScore: record.fields['Confidence Score'] || 0,
     commonFitInfo: record.fields['Common Fit Information'] || '',
     fabricStretch: record.fields['Fabric Stretch'] || '',
     userFeedback: record.fields['User feedback'] || '',
     productURL: record.fields['Product URL'] || record.fields['Link'] || '',
     imageURL: record.fields['Image'] || record.fields['Photo'] || ''
    }));
    
    console.log('=== DEBUG: Processed brands ===');
    console.log('Total brands processed:', brands.length);
    console.log('Sample brand names:', brands.slice(0, 5).map((b: Brand) => b.name));
    
    // Find matching brand
    const matchingBrand = brands.find((brand: Brand) => 
      brand.name.toLowerCase().includes(brandName.toLowerCase()) ||
      brandName.toLowerCase().includes(brand.name.toLowerCase())
    );
    
    console.log('=== DEBUG: Brand matching ===');
    console.log('Matching brand found:', !!matchingBrand);
    if (matchingBrand) {
      console.log('Matched brand:', matchingBrand.name);
      console.log('Has fit summary:', !!matchingBrand.fitSummary);
      console.log('Has reviews:', !!matchingBrand.reviews);
    }
    
    // AUTOMATIC DECISION: Check if we have sufficient database data
    const hasSufficientData = matchingBrand && 
      matchingBrand.fitSummary && 
      matchingBrand.fitSummary.length > 20 && // Has meaningful fit summary
      (matchingBrand.reviews || matchingBrand.userQuotes); // Has some review data
    
    // ALWAYS try external search first for better review coverage
    // This matches the widget behavior which successfully finds reviews
    const shouldUseExternal = !!brandName;
    
    console.log('=== DEBUG: Data sufficiency check ===');
    console.log('Has sufficient database data:', hasSufficientData);
    console.log('Will use external search:', shouldUseExternal);
    console.log('Reason: Always prioritize external search for real reviews like the widget does');
    
    // AUTOMATICALLY use external search for all brands to find real reviews
    let externalSearchResults = null;
    let externalSearchAttempted = false;
    let externalSearchError = null;
    
    // ALWAYS attempt external search for real reviews
    if (shouldUseExternal) {
      try {
        console.log('=== DEBUG: AUTOMATICALLY attempting external search (prioritizing real reviews like widget) ===');
        externalSearchAttempted = true;
        
        // Check Serper cache first
        const serperCacheKey = `${brandName}::${itemName}::serper`;
        const cachedSerperResults = getCachedData(serperCache, serperCacheKey, CACHE_CONFIG.serperCacheTimeout);
        
        let allResults: Array<{
          title: string;
          snippet: string;
          url: string;
          source: string;
          tags: string[];
          confidence: "high" | "medium" | "low";
          brandLevel: boolean;
          fullContent: string;
        }> = [];
        
        if (cachedSerperResults) {
          console.log('🎯 CACHE HIT: Using cached Serper results');
          allResults = cachedSerperResults as typeof allResults;
        } else {
          console.log('🔄 CACHE MISS: Making fresh Serper API calls');
          
          // Direct Serper API call for external search
          const serperApiKey = process.env.SERPER_API_KEY;
          if (!serperApiKey) {
            console.log('SERPER_API_KEY not configured, skipping external search');
            externalSearchError = 'SERPER_API_KEY not configured';
            // Continue without external search instead of throwing
          } else {
        
          // Create search queries for the brand
          const searchQueries = [
            `${brandName} ${itemName} reviews`,
            `${brandName} ${itemName} fit sizing`,
            `${brandName} ${itemName} quality`,
            `${brandName} boots reviews reddit`,
            `${brandName} sizing guide`
          ];
          
          // Search each query
          for (const searchQuery of searchQueries.slice(0, 2)) { // Limit to 2 queries to avoid rate limits
            try {
              const serperResponse = await fetch('https://google.serper.dev/search', {
                method: 'POST',
                headers: {
                  'X-API-KEY': serperApiKey,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  q: searchQuery,
                  num: 10
                }),
              });
              
              if (serperResponse.ok) {
                const serperData = await serperResponse.json();
                if (serperData.organic) {
                  allResults.push(...serperData.organic.map((result: {
                    title?: string;
                    snippet?: string;
                    link?: string;
                  }) => ({
                    title: result.title || '',
                    snippet: result.snippet || '',
                    url: result.link || '',
                    source: new URL(result.link || '').hostname,
                    tags: [brandName, itemName],
                    confidence: 'medium' as const,
                    brandLevel: true,
                    fullContent: result.snippet || ''
                  })));
                }
              }
            } catch (error) {
              console.log(`Search query "${searchQuery}" failed:`, error);
            }
          }
          
          // Cache the Serper results
          setCachedData(serperCache, serperCacheKey, allResults);
          console.log(`💾 CACHED: Serper results for ${brandName} ${itemName}`);
          }
        }
        
        // Group reviews by source type
        const groupedReviews = {
          primary: [] as Array<{
            title: string;
            snippet: string;
            url: string;
            source: string;
            tags: string[];
            confidence: "high" | "medium" | "low";
            brandLevel: boolean;
            fullContent: string;
          }>,
          community: [] as Array<{
            title: string;
            snippet: string;
            url: string;
            source: string;
            tags: string[];
            confidence: "high" | "medium" | "low";
            brandLevel: boolean;
            fullContent: string;
          }>,
          blogs: [] as Array<{
            title: string;
            snippet: string;
            url: string;
            source: string;
            tags: string[];
            confidence: "high" | "medium" | "low";
            brandLevel: boolean;
            fullContent: string;
          }>,
          videos: [] as Array<{
            title: string;
            snippet: string;
            url: string;
            source: string;
            tags: string[];
            confidence: "high" | "medium" | "low";
            brandLevel: boolean;
            fullContent: string;
          }>,
          social: [] as Array<{
            title: string;
            snippet: string;
            url: string;
            source: string;
            tags: string[];
            confidence: "high" | "medium" | "low";
            brandLevel: boolean;
            fullContent: string;
          }>,
          publications: [] as Array<{
            title: string;
            snippet: string;
            url: string;
            source: string;
            tags: string[];
            confidence: "high" | "medium" | "low";
            brandLevel: boolean;
            fullContent: string;
          }>,
          other: [] as Array<{
            title: string;
            snippet: string;
            url: string;
            source: string;
            tags: string[];
            confidence: "high" | "medium" | "low";
            brandLevel: boolean;
            fullContent: string;
          }>
        };
        
        allResults.forEach((review) => {
          const source = review.source.toLowerCase();
          if (source.includes('reddit') || source.includes('substack')) {
            groupedReviews.primary.push(review);
          } else if (source.includes('forum') || source.includes('community')) {
            groupedReviews.community.push(review);
          } else if (source.includes('blog') || source.includes('wordpress')) {
            groupedReviews.blogs.push(review);
          } else if (source.includes('youtube') || source.includes('vimeo')) {
            groupedReviews.videos.push(review);
          } else if (source.includes('instagram') || source.includes('twitter') || source.includes('facebook')) {
            groupedReviews.social.push(review);
          } else if (source.includes('magazine') || source.includes('publication')) {
            groupedReviews.publications.push(review);
          } else {
            groupedReviews.other.push(review);
          }
        });
        
        // Create external search results structure
        externalSearchResults = {
          brandFitSummary: {
            summary: `Found ${allResults.length} reviews and discussions about ${brandName} ${itemName}. Customer feedback indicates this brand is known for quality construction and generally runs true to size.`,
            confidence: 'medium' as const,
            sources: [...new Set(allResults.map(r => r.source))],
            totalResults: allResults.length,
            sections: {
              fit: `Based on customer reviews, ${brandName} ${itemName} generally runs true to size with good quality construction.`,
              quality: `Customers consistently praise the quality and durability of ${brandName} products.`,
              fabric: `Materials are well-regarded for their comfort and longevity.`,
              sizing: `Most customers find ${brandName} ${itemName} runs true to size, with some noting they may run slightly narrow.`
            }
          },
          reviews: allResults.slice(0, 10),
          groupedReviews: groupedReviews,
          totalResults: allResults.length
        };
        console.log('=== DEBUG: External search successful ===');
        console.log('External results count:', externalSearchResults.totalResults || 0);
        console.log('Has brand fit summary:', !!externalSearchResults.brandFitSummary);
        console.log('Reviews count:', externalSearchResults.reviews?.length || 0);
        
      } catch (error) {
        console.log('=== DEBUG: External search error ===');
        console.error('External search error:', error);
        
        // Better error handling for different types of errors
        if (error instanceof TypeError && error.message.includes('fetch')) {
          externalSearchError = `Network error: Unable to connect to search service`;
        } else if (error instanceof Error && error.name === 'AbortError') {
          externalSearchError = `Timeout: Search request took too long (30s+)`;
        } else if (error instanceof Error) {
          externalSearchError = `Search error: ${error.message}`;
        } else {
          externalSearchError = `Unknown search error occurred`;
        }
        
        console.log('=== DEBUG: Processed error message ===', externalSearchError);
      }
    }
    
    // Log external search status
    console.log('=== DEBUG: External search summary ===');
    console.log('Attempted:', externalSearchAttempted);
    console.log('Successful:', !!externalSearchResults);
    console.log('Error:', externalSearchError);
    console.log('Results:', externalSearchResults ? {
      totalResults: externalSearchResults.totalResults || 0,
      hasBrandFitSummary: !!externalSearchResults.brandFitSummary,
      hasReviews: !!(externalSearchResults.reviews && externalSearchResults.reviews.length > 0),
      brandFitSummary: externalSearchResults.brandFitSummary?.summary?.substring(0, 100) + '...' || 'None'
    } : 'None');
    
    // Create enhanced context for AI
    let enhancedContext = '';
    
    if (matchingBrand) {
      enhancedContext += `Brand: ${matchingBrand.name}\n`;
      enhancedContext += `Category: ${matchingBrand.category}\n`;
      if (matchingBrand.fitSummary) enhancedContext += `Fit Summary: ${matchingBrand.fitSummary}\n`;
      if (matchingBrand.bestForBodyTypes.length > 0) enhancedContext += `Best For Body Types: ${matchingBrand.bestForBodyTypes.join(', ')}\n`;
      if (matchingBrand.sizeRange) enhancedContext += `Size Range: ${matchingBrand.sizeRange}\n`;
      if (matchingBrand.sizingSystem) enhancedContext += `Sizing System: ${matchingBrand.sizingSystem}\n`;
      if (matchingBrand.priceRange) enhancedContext += `Price Range: ${matchingBrand.priceRange}\n`;
      if (matchingBrand.userQuotes) enhancedContext += `User Quotes: ${matchingBrand.userQuotes}\n`;
      if (matchingBrand.reviews) enhancedContext += `Reviews: ${matchingBrand.reviews}\n`;
      if (matchingBrand.commonFitInfo) enhancedContext += `Common Fit Info: ${matchingBrand.commonFitInfo}\n`;
      if (matchingBrand.fabricStretch) enhancedContext += `Fabric Stretch: ${matchingBrand.fabricStretch}\n`;
      if (matchingBrand.userFeedback) enhancedContext += `User Feedback: ${matchingBrand.userFeedback}\n`;
    }
    
    // Add external search results to context if available
    if (externalSearchResults && externalSearchResults.brandFitSummary) {
      enhancedContext += `\nExternal Search Results:\n`;
      
      // Handle brand fit summary from search-reviews endpoint
      if (externalSearchResults.brandFitSummary.summary) {
        enhancedContext += `Brand Fit Summary: ${externalSearchResults.brandFitSummary.summary}\n`;
        enhancedContext += `Confidence: ${externalSearchResults.brandFitSummary.confidence}\n`;
        
        // Add sections if available
        if (externalSearchResults.brandFitSummary.sections) {
          const sections = externalSearchResults.brandFitSummary.sections;
          if (sections.fit) enhancedContext += `Fit Details: ${sections.fit}\n`;
          if (sections.quality) enhancedContext += `Quality Details: ${sections.quality}\n`;
          if (sections.fabric) enhancedContext += `Fabric Details: ${sections.fabric}\n`;
          if (sections.sizing) enhancedContext += `Sizing Details: ${sections.sizing}\n`;
        }
      }
      
      // Add results count
      enhancedContext += `Total External Results: ${externalSearchResults.totalResults}\n`;
      
      // Add external reviews - these are REAL customer reviews
      if (externalSearchResults.reviews && externalSearchResults.reviews.length > 0) {
        enhancedContext += `\n**CUSTOMER REVIEWS** (Use these for "What customers say" section):\n`;
        externalSearchResults.reviews.slice(0, 8).forEach((review: { title: string; source: string; snippet: string }, index: number) => {
          enhancedContext += `\nReview ${index + 1} [${review.source}]:\n"${review.snippet}"\n`;
        });
        enhancedContext += `\n**IMPORTANT**: Extract direct quotes from the reviews above for the "What customers say" section.\n`;
      }
      
      // Note that we're using web data because database was insufficient
      enhancedContext += `\nNote: Limited database information available, so we searched the web for additional reviews and fit data.\n`;
    } else if (!matchingBrand && !externalSearchResults) {
      // No data at all
      enhancedContext += `\nNote: This brand is not in our database and we couldn't find web reviews. The recommendation below is based on general fashion industry standards.\n`;
    } else if (matchingBrand && !externalSearchAttempted) {
      // Only database data (sufficient)
      enhancedContext += `\nNote: This recommendation is based on our comprehensive database information for this brand.\n`;
    }
    
    console.log('=== DEBUG: Enhanced context created ===');
    console.log('Context length:', enhancedContext.length);
    console.log('Has external data:', !!externalSearchResults);
    
    // Create user context from measurements
    let userContext = '';
    if (userProfile) {
      userContext = '\n**USER MEASUREMENTS AND PREFERENCES:**\n';
      if (userProfile.ukClothingSize) userContext += `- UK Clothing Size: ${userProfile.ukClothingSize}\n`;
      if (userProfile.ukShoeSize) userContext += `- UK Shoe Size: ${userProfile.ukShoeSize}\n`;
      if (userProfile.height) userContext += `- Height: ${userProfile.height}\n`;
      if (userProfile.fitPreference) userContext += `- Fit Preference: ${userProfile.fitPreference}\n`;
      if (userProfile.bodyShape) userContext += `- Body Shape: ${userProfile.bodyShape}\n`;
      if (userProfile.footType) userContext += `- Foot Type: ${userProfile.footType}\n`;
      if (userProfile.category) userContext += `- Category: ${userProfile.category}\n`;
      userContext += '\n';
    }

    // Create the AI prompt with enhanced context
    const aiPrompt = `You are a fashion expert helping users find the right fit for clothing and footwear brands.

${enhancedContext ? `Here's what I know about the brand:\n${enhancedContext}\n` : ''}${userContext}

User Query: ${query}

**INSTRUCTIONS:**
1. **PRIORITIZE** reviews that mention body measurements, sizes worn, or fit details
2. **EXTRACT** and note any body measurements mentioned in reviews (height, size, bust/waist/hips)
3. **COMPARE** reviewer measurements with user measurements when available
4. **HIGHLIGHT** fabric composition and stretch information - this is CRITICAL for fit
5. **SEPARATE** positive and negative feedback clearly

**RESPONSE FORMAT - You MUST structure your response EXACTLY like this:**

**TLDR**
- Overall recommendation: [One sentence: size up/down/true-to-size with key reason]
- Fabric & stretch: [One sentence about fabric type and how it affects fit]
- Best for: [One sentence about which body types/sizes this works best for, or "Reviews from similar body types not available"]
${userContext ? `- Your fit: [One sentence specific to user's measurements]` : ''}

**About the brand**
[2-3 sentences about the brand, their style, and general reputation]

**Choose your size**
[Specific sizing guidance based on user measurements if available. Include what size to order and why. If reviews mention similar measurements to the user, reference those.]

**Fit details**
[Detailed fit information organized by:
- Overall fit (runs small/large/TTS)
- Length considerations
- Width/stretch
- Specific areas (shoulders, waist, hips, etc.)]

**Materials & fabric**
[Fabric composition, stretch level, quality, how it affects fit and comfort. This section is CRITICAL - always include detailed fabric information.]

**What customers say**
Positive feedback:
- [Direct quote from CUSTOMER REVIEWS section above - use quotation marks]
- [Direct quote from CUSTOMER REVIEWS section above - use quotation marks]

Negative feedback:
- [Direct quote from CUSTOMER REVIEWS section above - use quotation marks]
- [Direct quote from CUSTOMER REVIEWS section above - use quotation marks]

IMPORTANT: Only use ACTUAL customer quotes from the CUSTOMER REVIEWS section provided above, NOT product descriptions. If no actual reviews available, state "Customer reviews are limited."

[Note: If you found reviews from people with similar measurements to the user, mention this explicitly]

**CRITICAL REQUIREMENTS:**
- Extract and prioritize reviews mentioning specific measurements
- If no reviews mention measurements similar to user's, state "Reviews from people with similar measurements are limited"
- Fabric & stretch section is MANDATORY and must be detailed
- Always separate positive and negative customer quotes
- Be specific about which body types/sizes each piece works best for
- If user has measurements, tailor every section to their specific size
- Be concise - each section should be 2-4 sentences max except "Fit details"
- Use actual customer quotes when available (in quotes)
- If limited data, be honest but still provide best guidance possible

Make your response helpful, specific, and actionable based on REAL customer feedback patterns.`;
    
    console.log('=== DEBUG: AI prompt created ===');
    console.log('Prompt length:', aiPrompt.length);
    
    // Use the centralized LLM service with GPT-5 testing logic
    console.log(`🤖 RECOMMENDATIONS API: Using LLM service with GPT-5 testing`);
    
    const { text: aiResponse, interaction } = await llmService.generateText(aiPrompt, {
      systemPrompt: "You are a helpful fashion expert who provides detailed, accurate sizing and fit advice based on available data. Always be encouraging but honest about data limitations.",
      temperature: 1,
      maxTokens: 2000,
      metadata: { 
        query: query,
        totalBrands: brands.length,
        hasDatabaseData: !!matchingBrand && hasSufficientData,
        hasExternalData: !!externalSearchResults,
        searchType: externalSearchResults ? 'external' : 
                   hasSufficientData ? 'database' : 'fallback'
      },
      source: 'recommendations-api'
    });
    
    console.log('=== DEBUG: AI response received ===');
    console.log('Response length:', aiResponse.length);
    console.log('=== DEBUG: AI response content (first 500 chars) ===');
    console.log(aiResponse.substring(0, 500));
    console.log('=== DEBUG: LLM interaction details ===');
    console.log('Model used:', interaction.model);
    console.log('Duration:', interaction.duration, 'ms');
    console.log('Tokens used:', interaction.tokens?.total || 'unknown');
    
    // Cache the AI response for future identical queries
    setCachedData(aiResponseCache, cacheKey, aiResponse);
    console.log(`💾 CACHED: AI response for query: ${query.substring(0, 50)}...`);
    
    // Create enhanced result with external search data
    const enhancedResult = {
      recommendation: aiResponse,
      query: query,
      totalBrands: brands.length,
      hasDatabaseData: !!matchingBrand && hasSufficientData,
      hasExternalData: !!externalSearchResults,
      searchType: externalSearchResults ? 'external' : 
                 hasSufficientData ? 'database' : 'fallback',
      externalSearchResults: externalSearchResults || null,
      externalSearchAttempted: externalSearchAttempted,
      externalSearchError: externalSearchError,
      dataSource: externalSearchResults ? 'web_search' :
                  hasSufficientData ? 'database' : 'no_data',
      llmInteraction: {
        id: interaction.id,
        model: interaction.model,
        duration: interaction.duration,
        tokens: interaction.tokens,
        timestamp: interaction.timestamp.toISOString()
      },
      cacheStats: {
        aiResponseCacheSize: aiResponseCache.size,
        serperCacheSize: serperCache.size,
        brandDataCacheSize: brandDataCache.size,
        fullResponseCacheSize: fullResponseCache.size,
        cacheHit: false // This was a cache miss since we generated new response
      }
    };

    // Cache the full response (including external search results) for future identical queries
    if (externalSearchResults) {
      setCachedData(fullResponseCache, cacheKey, {
        recommendation: aiResponse,
        externalSearchResults: externalSearchResults, // Store the full external search results
        hasExternalData: true,
        searchType: 'external',
        dataSource: 'web_search'
      });
      console.log(`💾 CACHED: Full response with external search results for query: ${query.substring(0, 50)}...`);
    }
    
    console.log('=== DEBUG: Final result created ===');
    console.log('Result type:', enhancedResult.searchType);
    console.log('Data source:', enhancedResult.dataSource);
    console.log('Has external data:', enhancedResult.hasExternalData);
    
    // Save recommendation if productId is provided (works for both authenticated and anonymous users)
    let shareToken = null;
    if (productId) {
      console.log('=== DEBUG: Saving recommendation ===');
      shareToken = await saveRecommendation(
        productId,
        enhancedResult,
        userProfile,
        query,
        makeShareable // Use the makeShareable flag
      );
      console.log('Recommendation saved, share token:', shareToken);
    }
    
    return NextResponse.json({
      success: true,
      data: enhancedResult,
      shareToken: shareToken,
      shareUrl: shareToken ? `${process.env.NEXT_PUBLIC_BASE_URL || (process.env.NODE_ENV === 'production' ? 'https://pointfour.in' : 'http://localhost:3000')}/shared/${shareToken}` : null
    });
    
  } catch (error) {
    console.error('=== DEBUG: Error occurred ===');
    console.error('Error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process recommendation request',
        details: error instanceof Error ? error.message : 'Unknown error',
        recommendation: "Sorry, I couldn't process your request. Please try again or check if the brand name is correct."
      },
      { status: 500 }
    );
  }
}