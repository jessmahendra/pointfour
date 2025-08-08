import { NextRequest, NextResponse } from 'next/server';

interface UserProfile {
  bodyShape: string;
  footType: string;
  ukClothingSize: string;
  ukShoeSize: string;
  height: string;
  fitPreference: string;
}

interface RecommendationRequest {
  itemQuery: string;
  userProfile: UserProfile;
}

interface BrandRecommendation {
  brandName: string;
  confidence: number;
  reason: string;
  fitAdvice: string;
  priceRange?: string;
  shopLinks: Array<{
    retailer: string;
    url: string;
  }>;
  reviewSummary: string;
}

interface RecommendationResponse {
  query: string;
  userProfile: UserProfile;
  recommendations: BrandRecommendation[];
  totalResults: number;
}

// Real brand data interface (from your existing API)
interface Brand {
  id: string;
  name: string;
  category: string;
  description?: string;
  website?: string;
  priceRange?: string;
  sizeRange?: string;
  fitNotes?: string;
  garmentTypes?: string;
  fitSummary?: string;
  bestForBodyTypes?: string;
  commonFitInformation?: string;
  fabricStretch?: string;
  userQuotes?: string;
}

// Real review data interface (from your existing API)  
interface Review {
  id: string;
  brandName?: string;
  brand?: string;
  Brand?: string;
  itemName?: string;
  garmentType?: string;
  userBodyType?: string;
  sizeBought?: string;
  usualSize?: string;
  fitRating?: number;
  fitComments?: string;
  wouldRecommend?: boolean;
  height?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: RecommendationRequest = await req.json();
    const { itemQuery, userProfile } = body;

    // Basic validation
    if (!itemQuery?.trim()) {
      return NextResponse.json(
        { error: 'Item query is required' },
        { status: 400 }
      );
    }

    if (!userProfile?.fitPreference) {
      return NextResponse.json(
        { error: 'Fit preference is required' },
        { status: 400 }
      );
    }

    // Determine if this is footwear - MUST match frontend logic exactly
    const isFootwear = itemQuery.toLowerCase().includes('shoe') || 
                      itemQuery.toLowerCase().includes('boot') || 
                      itemQuery.toLowerCase().includes('sandal') ||
                      itemQuery.toLowerCase().includes('sneaker') ||
                      itemQuery.toLowerCase().includes('heel') ||
                      itemQuery.toLowerCase().includes('loafer') ||
                      itemQuery.toLowerCase().includes('flat'); // Added 'flat' for ballet flats

    // Check for required body shape or foot type
    if (isFootwear && !userProfile.footType) {
      return NextResponse.json(
        { error: 'Foot type is required for footwear recommendations' },
        { status: 400 }
      );
    }

    if (!isFootwear && !userProfile.bodyShape) {
      return NextResponse.json(
        { error: 'Body shape is required for clothing recommendations' },
        { status: 400 }
      );
    }

    // Fetch real data from existing APIs
    const [brandsData, reviewsData] = await Promise.all([
      fetchBrands(),
      fetchReviews()
    ]);

    // Generate recommendations using real data
    const recommendations = await generateRecommendationsWithRealData(
      itemQuery, 
      userProfile, 
      isFootwear,
      brandsData,
      reviewsData
    );

    const response: RecommendationResponse = {
      query: itemQuery,
      userProfile,
      recommendations,
      totalResults: recommendations.length,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error processing item recommendations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Fetch brands from existing API
async function fetchBrands(): Promise<Brand[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/brands`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn('Failed to fetch brands:', response.status);
      return [];
    }

    return await response.json();
  } catch (error) {
    console.warn('Error fetching brands:', error);
    return [];
  }
}

// Fetch reviews from existing API
async function fetchReviews(): Promise<Review[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/reviews`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn('Failed to fetch reviews:', response.status);
      return [];
    }

    return await response.json();
  } catch (error) {
    console.warn('Error fetching reviews:', error);
    return [];
  }
}

async function generateRecommendationsWithRealData(
  itemQuery: string,
  userProfile: UserProfile,
  isFootwear: boolean,
  allBrands: Brand[],
  allReviews: Review[]
): Promise<BrandRecommendation[]> {
  
  // If no real data available, fall back to mock data
  if (allBrands.length === 0) {
    console.log('No brands data available, using fallback recommendations');
    return generateFallbackRecommendations(itemQuery, userProfile, isFootwear);
  }

  // Filter brands by item type and category
  const relevantBrands = filterBrandsByItem(allBrands, itemQuery, isFootwear);
  
  // Take top brands (limit to prevent overwhelming results)
  const topBrands = relevantBrands.slice(0, 6);
  
  if (topBrands.length === 0) {
    console.log('No matching brands found, using fallback recommendations');
    return generateFallbackRecommendations(itemQuery, userProfile, isFootwear);
  }

  // Generate recommendations for each brand
  const recommendations = await Promise.all(
    topBrands.map(async (brand) => {
      const brandReviews = findReviewsForBrand(brand.name, allReviews, itemQuery, isFootwear);
      return generateBrandRecommendation(brand, brandReviews, userProfile, isFootwear, itemQuery);
    })
  );

  // Sort by confidence score
  return recommendations.sort((a, b) => b.confidence - a.confidence);
}

// FIXED: Enhanced brand filtering with quality control
function filterBrandsByItem(brands: Brand[], itemQuery: string, isFootwear: boolean): Brand[] {
  const queryWords = itemQuery.toLowerCase().split(' ').filter(word => word.length > 2);
  const specificItem = itemQuery.toLowerCase().trim();
  
  const filteredBrands = brands.filter(brand => {
    // STRICT category filtering - this is critical
    const categoryMatch = isFootwear ? 
      brand.category.toLowerCase().includes('footwear') || 
      brand.category.toLowerCase().includes('shoe') :
      !brand.category.toLowerCase().includes('footwear') && 
      !brand.category.toLowerCase().includes('shoe');
    
    if (!categoryMatch) {
      return false; // Immediately exclude wrong category
    }
    
    // Enhanced garment type matching
    const garmentTypes = brand.garmentTypes?.toLowerCase() || '';
    const description = brand.description?.toLowerCase() || '';
    const name = brand.name.toLowerCase();
    const allBrandText = `${garmentTypes} ${description} ${name}`;
    
    // Check for exact item type matches first (highest priority)
    const exactMatches = [
      // Bottoms - more specific matching
      specificItem.includes('linen pants') && (allBrandText.includes('linen') || allBrandText.includes('pant')),
      specificItem.includes('jeans') && allBrandText.includes('jeans'),
      specificItem.includes('trousers') && (allBrandText.includes('trousers') || allBrandText.includes('pants')),
      specificItem.includes('pants') && allBrandText.includes('pants'),
      specificItem.includes('shorts') && allBrandText.includes('shorts'),
      specificItem.includes('skirt') && allBrandText.includes('skirt'),
      
      // Tops
      specificItem.includes('t-shirt') && (allBrandText.includes('t-shirt') || allBrandText.includes('tshirt') || allBrandText.includes('tee')),
      specificItem.includes('shirt') && allBrandText.includes('shirt') && !specificItem.includes('t-shirt'),
      specificItem.includes('blouse') && allBrandText.includes('blouse'),
      specificItem.includes('sweater') && (allBrandText.includes('sweater') || allBrandText.includes('jumper')),
      specificItem.includes('hoodie') && allBrandText.includes('hoodie'),
      
      // Outerwear
      specificItem.includes('jacket') && allBrandText.includes('jacket'),
      specificItem.includes('blazer') && allBrandText.includes('blazer'),
      specificItem.includes('coat') && allBrandText.includes('coat'),
      specificItem.includes('cardigan') && allBrandText.includes('cardigan'),
      
      // Dresses
      specificItem.includes('dress') && allBrandText.includes('dress'),
      
      // Footwear
      specificItem.includes('boots') && allBrandText.includes('boots'),
      specificItem.includes('sneakers') && (allBrandText.includes('sneakers') || allBrandText.includes('trainers')),
      specificItem.includes('sandals') && allBrandText.includes('sandals'),
      specificItem.includes('flats') && (allBrandText.includes('flats') || allBrandText.includes('ballet')),
      specificItem.includes('heels') && allBrandText.includes('heels'),
    ];
    
    // If we have exact matches, prioritize those
    if (exactMatches.some(match => match)) {
      return true;
    }
    
    // Secondary: General word matching in garment types (most reliable field)
    const hasRelevantWords = queryWords.some(word => {
      return garmentTypes.includes(word) || 
             (word.length > 4 && garmentTypes.includes(word.substring(0, word.length - 1)));
    });
    
    // Tertiary: Brand specialization in the category
    const specializationMatch = queryWords.some(word => {
      return name.includes(word) && garmentTypes.includes(word);
    });
    
    return hasRelevantWords || specializationMatch;
  });
  
  // Quality control: Remove brands with clearly problematic data
  const qualityFilteredBrands = filteredBrands.filter(brand => {
    const fitInfo = ((brand.fitSummary || '') + ' ' + (brand.commonFitInformation || '')).toLowerCase();
    
    // Exclude brands with contradictory or very negative fit information
    const hasContradictions = (fitInfo.includes('runs small') && fitInfo.includes('runs large')) ||
                             (fitInfo.includes('true to size') && fitInfo.includes('inconsistent'));
    
    const hasVeryNegativeInfo = fitInfo.includes('avoid') || 
                               fitInfo.includes('terrible') || 
                               fitInfo.includes('worst');
    
    return !hasContradictions && !hasVeryNegativeInfo;
  });
  
  return qualityFilteredBrands.slice(0, 8); // Reasonable limit
}

// FIXED: Find reviews for a specific brand with strict item-type filtering
function findReviewsForBrand(brandName: string, allReviews: Review[], itemQuery: string, isFootwear: boolean): Review[] {
  const normalizedBrandName = brandName.toLowerCase().trim();
  const queryWords = itemQuery.toLowerCase().split(' ').filter(word => word.length > 2);
  const specificItem = itemQuery.toLowerCase().trim();
  
  // First, get all reviews for the brand
  const brandReviews = allReviews.filter(review => {
    const brandFields = [
      review.brandName,
      review.brand,
      review.Brand
    ].filter(Boolean);
    
    return brandFields.some(field => 
      field && field.toLowerCase().trim() === normalizedBrandName
    );
  });
  
  // CRITICAL FIX: Strict category separation to prevent footwear/clothing mixing
  const categoryFilteredReviews = brandReviews.filter(review => {
    const itemName = review.itemName?.toLowerCase() || '';
    const garmentType = review.garmentType?.toLowerCase() || '';
    const fitComments = review.fitComments?.toLowerCase() || '';
    const allReviewText = `${itemName} ${garmentType} ${fitComments}`;
    
    // Define clear footwear vs clothing terms
    const footwearTerms = ['shoe', 'boot', 'sandal', 'sneaker', 'heel', 'loafer', 'flat', 'trainer', 'pump', 'oxford', 'derby', 'mule', 'slipper'];
    const clothingTerms = ['dress', 'jean', 'pant', 'trouser', 'skirt', 'short', 'blouse', 'shirt', 't-shirt', 'tshirt', 'sweater', 'jumper', 'hoodie', 'jacket', 'coat', 'blazer', 'cardigan', 'top'];
    
    const hasFootwearMention = footwearTerms.some(term => allReviewText.includes(term));
    const hasClothingMention = clothingTerms.some(term => allReviewText.includes(term));
    
    // If we're looking for footwear
    if (isFootwear) {
      // EXCLUDE reviews that clearly mention clothing items but not footwear
      if (hasClothingMention && !hasFootwearMention) {
        return false;
      }
      // INCLUDE reviews that mention footwear or are generic (no specific item mentioned)
      return hasFootwearMention || (!hasClothingMention && !hasFootwearMention);
    } 
    // If we're looking for clothing
    else {
      // EXCLUDE reviews that clearly mention footwear items but not clothing
      if (hasFootwearMention && !hasClothingMention) {
        return false;
      }
      // INCLUDE reviews that mention clothing or are generic (no specific item mentioned)
      return hasClothingMention || (!hasClothingMention && !hasFootwearMention);
    }
  });
  
  // Now filter for item-specific relevance within the correct category
  const itemRelevantReviews = categoryFilteredReviews.filter(review => {
    const itemName = review.itemName?.toLowerCase() || '';
    const garmentType = review.garmentType?.toLowerCase() || '';
    const fitComments = review.fitComments?.toLowerCase() || '';
    const allReviewText = `${itemName} ${garmentType} ${fitComments}`;
    
    // If no specific item mentioned, include it (generic brand review)
    if (!itemName && !garmentType) {
      return true;
    }
    
    // Check for positive matches with the searched item
    const positiveMatch = queryWords.some(word => 
      itemName.includes(word) || 
      garmentType.includes(word) ||
      (word.length > 4 && (itemName.includes(word.substring(0, word.length - 1)) || garmentType.includes(word.substring(0, word.length - 1))))
    );
    
    return positiveMatch;
  });
  
  // Return the most relevant reviews, prioritizing item-specific ones
  if (itemRelevantReviews.length >= 3) {
    return itemRelevantReviews.slice(0, 10); // Limit to prevent overwhelming data
  }
  
  // If few item-specific reviews, include more general reviews from the correct category
  return categoryFilteredReviews.slice(0, 8);
}

// Generate recommendation for a specific brand
function generateBrandRecommendation(
  brand: Brand,
  brandReviews: Review[],
  userProfile: UserProfile,
  isFootwear: boolean,
  itemQuery: string
): BrandRecommendation {
  
  const confidence = calculateRealConfidence(brand, brandReviews, userProfile, isFootwear, itemQuery);
  
  return {
    brandName: brand.name,
    confidence,
    reason: generateRealReason(brand, brandReviews, userProfile, isFootwear, itemQuery),
    fitAdvice: generateRealFitAdvice(brand, brandReviews, userProfile, isFootwear),
    priceRange: brand.priceRange || "Check retailer for pricing",
    shopLinks: [
      {
        retailer: `${brand.name} Official`,
        url: brand.website || `https://www.google.com/search?q=${encodeURIComponent(brand.name + ' ' + itemQuery)}`
      },
      {
        retailer: "Search UK",
        url: `https://www.google.com/search?q=${encodeURIComponent(brand.name + ' ' + itemQuery + ' buy UK')}`
      }
    ],
    reviewSummary: generateRealReviewSummary(brand, brandReviews, userProfile, isFootwear, itemQuery)
  };
}

// FIXED: Smart confidence calculation that penalizes poor data
function calculateRealConfidence(
  brand: Brand,
  brandReviews: Review[],
  userProfile: UserProfile,
  isFootwear: boolean,
  itemQuery: string
): number {
  let confidence = 70; // Base confidence
  
  // Boost for item-specific match in brand data
  const specificItem = itemQuery.toLowerCase().trim();
  const garmentTypes = brand.garmentTypes?.toLowerCase() || '';
  const description = brand.description?.toLowerCase() || '';
  const itemWords = specificItem.split(' ').filter(word => word.length > 2);
  
  // High boost for direct item type match
  const hasDirectMatch = itemWords.some(word => 
    garmentTypes.includes(word) || description.includes(word)
  );
  
  if (hasDirectMatch) {
    confidence += 20;
  }
  
  // Category relevance check - penalize if brand doesn't match category
  const categoryMatch = isFootwear ? 
    brand.category.toLowerCase().includes('footwear') || brand.category.toLowerCase().includes('shoe') :
    !brand.category.toLowerCase().includes('footwear') && !brand.category.toLowerCase().includes('shoe');
  
  if (!categoryMatch) {
    confidence -= 30; // Heavy penalty for wrong category
  }
  
  // Review quality assessment
  if (brandReviews.length > 0) {
    const positiveReviews = brandReviews.filter(r => r.wouldRecommend === true || (r.fitRating && r.fitRating >= 4));
    const satisfactionRate = positiveReviews.length / brandReviews.length;
    
    if (satisfactionRate >= 0.8) {
      confidence += 15; // High satisfaction
    } else if (satisfactionRate >= 0.6) {
      confidence += 8; // Moderate satisfaction
    } else if (satisfactionRate < 0.4) {
      confidence -= 10; // Poor satisfaction should lower confidence
    }
    
    // Boost for having substantial review data
    if (brandReviews.length >= 5) {
      confidence += 5;
    }
  } else {
    confidence -= 5; // Slight penalty for no review data
  }
  
  // Body type / foot type matching boost
  if (brand.bestForBodyTypes) {
    const userType = isFootwear ? userProfile.footType : userProfile.bodyShape;
    if (userType && brand.bestForBodyTypes.toLowerCase().includes(userType.toLowerCase())) {
      confidence += 15;
    }
  }
  
  // Fit preference alignment
  if (brand.fitSummary || brand.commonFitInformation) {
    const fitInfo = ((brand.fitSummary || '') + ' ' + (brand.commonFitInformation || '')).toLowerCase();
    
    // Check for negative indicators that should reduce confidence
    if (fitInfo.includes('inconsistent') || fitInfo.includes('varies') || fitInfo.includes('unreliable')) {
      confidence -= 15;
    }
    
    // Positive fit alignment
    if (userProfile.fitPreference === "True to size" && fitInfo.includes("true to size")) {
      confidence += 10;
    } else if (userProfile.fitPreference.toLowerCase().includes("relaxed") && fitInfo.includes("relaxed")) {
      confidence += 10;
    }
  }
  
  // Penalize brands with poor fit information
  const fitInfo = ((brand.fitSummary || '') + ' ' + (brand.commonFitInformation || '')).toLowerCase();
  if (fitInfo.includes('runs small') && fitInfo.includes('runs large')) {
    confidence -= 10; // Contradictory information
  }
  
  return Math.min(95, Math.max(40, Math.round(confidence))); // Wider range, allow lower scores
}

// FIXED: Generate intelligent, contextual reasons based on brand data
function generateRealReason(
  brand: Brand,
  brandReviews: Review[],
  userProfile: UserProfile,
  isFootwear: boolean,
  itemQuery: string
): string {
  const reasons = [];
  const itemCategory = isFootwear ? 'footwear' : 'clothing';
  
  // Check if brand specializes in the searched item type
  const garmentTypes = brand.garmentTypes?.toLowerCase() || '';
  const description = brand.description?.toLowerCase() || '';
  const itemWords = itemQuery.toLowerCase().split(' ').filter(word => word.length > 2);
  
  const hasItemSpecialization = itemWords.some(word => 
    garmentTypes.includes(word) || description.includes(word)
  );
  
  if (hasItemSpecialization) {
    reasons.push(`specializes in ${itemQuery}`);
  }
  
  // Add body type specific reasons (only if relevant and positive)
  if (brand.bestForBodyTypes) {
    const userType = isFootwear ? userProfile.footType : userProfile.bodyShape;
    if (userType && brand.bestForBodyTypes.toLowerCase().includes(userType.toLowerCase())) {
      reasons.push(`works well for ${userType.toLowerCase()} ${isFootwear ? 'feet' : 'body types'}`);
    }
  }
  
  // Add fit preference alignment (only positive aspects)
  if (brand.fitSummary || brand.commonFitInformation) {
    const fitInfo = ((brand.fitSummary || '') + ' ' + (brand.commonFitInformation || '')).toLowerCase();
    
    // Only include positive fit information that matches user preferences
    if (userProfile.fitPreference === "True to size" && fitInfo.includes("true to size")) {
      reasons.push("offers consistent, true-to-size fit");
    } else if (userProfile.fitPreference.toLowerCase().includes("relaxed") && fitInfo.includes("relaxed")) {
      reasons.push("known for comfortable, relaxed fits");
    } else if (fitInfo.includes("quality") || fitInfo.includes("well-made")) {
      reasons.push("known for quality construction");
    }
  }
  
  // Add review-based positive reasons
  if (brandReviews.length >= 3) {
    const positiveReviews = brandReviews.filter(r => r.wouldRecommend === true || (r.fitRating && r.fitRating >= 4));
    const satisfactionRate = (positiveReviews.length / brandReviews.length);
    
    if (satisfactionRate >= 0.8) {
      reasons.push("highly recommended by customers");
    } else if (satisfactionRate >= 0.6) {
      reasons.push("generally well-reviewed");
    }
    
    // Check for specific positive feedback patterns
    const fitComments = brandReviews.map(r => r.fitComments?.toLowerCase() || '').join(' ');
    if (fitComments.includes('comfortable') || fitComments.includes('perfect fit')) {
      reasons.push("praised for comfort and fit");
    }
  }
  
  // Add category-appropriate reasons
  if (brand.category && brand.category.toLowerCase().includes(itemCategory)) {
    if (reasons.length === 0) {
      reasons.push(`a reliable ${itemCategory} brand`);
    }
  }
  
  // Fallback to generic but logical reason
  if (reasons.length === 0) {
    reasons.push(`offers quality ${itemQuery} options`);
  }
  
  // Construct natural-sounding reason
  if (reasons.length === 1) {
    return `Recommended because ${brand.name} ${reasons[0]}.`;
  } else {
    const lastReason = reasons.pop();
    return `Recommended because ${brand.name} ${reasons.join(', ')} and ${lastReason}.`;
  }
}

// FIXED: Generate contextual, item-relevant fit advice
function generateRealFitAdvice(
  brand: Brand,
  brandReviews: Review[],
  userProfile: UserProfile,
  isFootwear: boolean
): string {
  const itemCategory = isFootwear ? 'footwear' : 'clothing';
  
  // Generate advice from reviews if available (prioritize this over brand data)
  if (brandReviews.length > 0) {
    const sizingFeedback = brandReviews
      .filter(r => r.sizeBought && r.usualSize)
      .map(r => {
        const bought = parseFloat(r.sizeBought!);
        const usual = parseFloat(r.usualSize!);
        return bought - usual;
      })
      .filter(diff => !isNaN(diff));
    
    if (sizingFeedback.length >= 2) {
      const avgSizeDiff = sizingFeedback.reduce((sum, diff) => sum + diff, 0) / sizingFeedback.length;
      
      if (avgSizeDiff > 0.5) {
        return "Based on customer reviews, this brand tends to run small. Consider sizing up.";
      } else if (avgSizeDiff < -0.5) {
        return "Based on customer reviews, this brand tends to run large. Consider sizing down.";
      } else {
        return "Based on customer reviews, this brand runs true to size.";
      }
    }
    
    // Look for specific fit feedback in comments
    const fitComments = brandReviews.map(r => r.fitComments?.toLowerCase() || '').join(' ');
    if (fitComments.includes('runs small')) {
      return "Customer reviews suggest sizing up for best fit.";
    } else if (fitComments.includes('runs large') || fitComments.includes('oversized')) {
      return "Customer reviews suggest this brand runs large.";
    } else if (fitComments.includes('true to size')) {
      return "Customer reviews indicate true-to-size fit.";
    }
  }
  
  // Only use brand fit data if it's relevant to the item category
  if (brand.commonFitInformation) {
    const fitInfo = brand.commonFitInformation.toLowerCase();
    
    // Filter out category-irrelevant information
    const isFootwearSpecific = fitInfo.includes('shoe') || fitInfo.includes('boot') || fitInfo.includes('narrow') && fitInfo.includes('wide');
    const isClothingSpecific = fitInfo.includes('dress') || fitInfo.includes('pant') || fitInfo.includes('shirt') || fitInfo.includes('relaxed');
    
    // Only use if category-appropriate or generic
    if ((isFootwear && isFootwearSpecific) || (!isFootwear && isClothingSpecific) || (!isFootwearSpecific && !isClothingSpecific)) {
      return brand.commonFitInformation;
    }
  }
  
  if (brand.fitNotes) {
    const fitNotes = brand.fitNotes.toLowerCase();
    
    // Apply same category filtering
    const isFootwearSpecific = fitNotes.includes('shoe') || fitNotes.includes('boot') || fitNotes.includes('narrow') && fitNotes.includes('wide');
    const isClothingSpecific = fitNotes.includes('dress') || fitNotes.includes('pant') || fitNotes.includes('shirt') || fitNotes.includes('relaxed');
    
    if ((isFootwear && isFootwearSpecific) || (!isFootwear && isClothingSpecific) || (!isFootwearSpecific && !isClothingSpecific)) {
      return brand.fitNotes;
    }
  }
  
  return "Refer to the brand's size guide for the most accurate fit guidance.";
}

// FIXED: Generate review summary based on correctly filtered data
function generateRealReviewSummary(
  brand: Brand,
  brandReviews: Review[],
  userProfile: UserProfile,
  isFootwear: boolean,
  itemQuery: string
): string {
  
  if (brandReviews.length === 0) {
    return `Limited review data available for ${brand.name} ${itemQuery}. Check retailer websites for customer feedback.`;
  }
  
  const userType = isFootwear ? userProfile.footType : userProfile.bodyShape;
  const itemCategory = isFootwear ? 'footwear' : 'clothing';
  
  // Filter for reviews relevant to the searched item type
  const queryWords = itemQuery.toLowerCase().split(' ');
  const itemRelevantReviews = brandReviews.filter(r => {
    const itemName = r.itemName?.toLowerCase() || '';
    const garmentType = r.garmentType?.toLowerCase() || '';
    const hasItemMatch = queryWords.some(word => 
      itemName.includes(word) || garmentType.includes(word)
    );
    const isGeneral = !itemName && !garmentType; // General brand reviews
    return hasItemMatch || isGeneral;
  });
  
  const relevantReviews = itemRelevantReviews.filter(r => 
    !userType || !r.userBodyType || r.userBodyType.toLowerCase().includes(userType.toLowerCase())
  );
  
  const totalReviews = brandReviews.length;
  const itemRelevantCount = itemRelevantReviews.length;
  const relevantCount = relevantReviews.length;
  
  // Generate summary based on filtered, category-appropriate reviews
  if (itemRelevantCount > 0) {
    const positiveItemReviews = itemRelevantReviews.filter(r => r.wouldRecommend === true || (r.fitRating && r.fitRating >= 4));
    const itemSatisfactionRate = (positiveItemReviews.length / itemRelevantCount * 100).toFixed(0);
    
    if (relevantCount > 0 && userType) {
      return `${itemSatisfactionRate}% customer satisfaction for ${brand.name} ${itemCategory}. ${relevantCount} reviews from customers with ${userType.toLowerCase()} ${isFootwear ? 'feet' : 'body types'}.`;
    } else {
      return `${itemSatisfactionRate}% customer satisfaction for ${brand.name} ${itemCategory} (${itemRelevantCount} relevant reviews).`;
    }
  }
  
  // Fallback to general brand reviews
  if (relevantCount > 0) {
    const positiveReviews = relevantReviews.filter(r => r.wouldRecommend === true || (r.fitRating && r.fitRating >= 4));
    const positiveRate = (positiveReviews.length / relevantCount * 100).toFixed(0);
    
    return `${positiveRate}% of customers with ${userType?.toLowerCase()} ${isFootwear ? 'feet' : 'body types'} recommend ${brand.name} (${relevantCount} of ${totalReviews} reviews).`;
  }
  
  const overallPositive = brandReviews.filter(r => r.wouldRecommend === true || (r.fitRating && r.fitRating >= 4));
  const overallRate = (overallPositive.length / totalReviews * 100).toFixed(0);
  
  return `${overallRate}% of ${totalReviews} customers recommend ${brand.name}. Limited ${itemQuery} specific feedback available.`;
}

// Fallback to mock recommendations if no real data
function generateFallbackRecommendations(
  itemQuery: string,
  userProfile: UserProfile,
  isFootwear: boolean
): BrandRecommendation[] {
  
  const mockBrands = isFootwear ? [
    { name: "Everlane", priceRange: "£80-£150", specialty: "minimalist footwear" },
    { name: "Veja", priceRange: "£90-£130", specialty: "sustainable sneakers" },
  ] : [
    { name: "Everlane", priceRange: "£30-£80", specialty: "quality basics" },
    { name: "COS", priceRange: "£50-£150", specialty: "minimalist clothing" },
  ];

  return mockBrands.map((brand, index) => ({
    brandName: brand.name,
    confidence: 75 + Math.random() * 15,
    reason: `Recommended for ${itemQuery} based on ${brand.specialty}`,
    fitAdvice: "Check brand size guide for best fit",
    priceRange: brand.priceRange,
    shopLinks: [
      {
        retailer: `${brand.name} Official`,
        url: `https://www.google.com/search?q=${encodeURIComponent(brand.name + ' ' + itemQuery)}`
      }
    ],
    reviewSummary: `Popular choice for ${itemQuery}. Limited data available in our database.`
  }));
}