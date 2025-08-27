import { airtableService } from '@/lib/airtable';

// Helper function to calculate brand-item relevance score for ranking reviews
function calculateBrandItemRelevanceScore(
  review: { brandName?: string; itemName?: string; fitComments?: string; fitRating?: number }, 
  targetBrand: string, 
  targetItemName?: string
): number {
  let score = 0;
  
  const reviewBrand = (review.brandName || '').toLowerCase().trim();
  const reviewItem = (review.itemName || '').toLowerCase().trim();
  const targetBrandLower = targetBrand.toLowerCase().trim();
  const targetItemLower = (targetItemName || '').toLowerCase().trim();
  
  // Brand match is essential - high score if exact match
  if (reviewBrand === targetBrandLower) {
    score += 100;
  } else if (reviewBrand.includes(targetBrandLower) || targetBrandLower.includes(reviewBrand)) {
    score += 50;
  }
  
  // Item-specific bonus if we have a target item name
  if (targetItemLower && targetItemLower.length > 2) {
    // Exact item match gets highest bonus
    if (reviewItem === targetItemLower) {
      score += 150;
    }
    // Partial matches get moderate bonus
    else if (reviewItem.includes(targetItemLower) || targetItemLower.includes(reviewItem)) {
      score += 75;
    }
    // Word-based matching for variations like "Val Jeans" vs "Val 90s Mid Rise Straight Jeans"
    else {
      const targetWords = targetItemLower.split(/\s+/).filter(word => word.length > 2);
      const reviewWords = reviewItem.split(/\s+/).filter(word => word.length > 2);
      
      const matchingWords = targetWords.filter(targetWord =>
        reviewWords.some(reviewWord =>
          reviewWord.includes(targetWord) || targetWord.includes(reviewWord)
        )
      );
      
      // Give points for each matching significant word
      if (matchingWords.length >= Math.min(2, targetWords.length)) {
        score += 30 * matchingWords.length;
      } else if (matchingWords.length > 0) {
        score += 15 * matchingWords.length;
      }
    }
  }
  
  // Bonus for reviews with specific details that are more helpful
  if (review.fitComments && review.fitComments.length > 50) {
    score += 10; // Detailed reviews are more valuable
  }
  
  // Bonus for reviews with fit rating
  if (review.fitRating && review.fitRating > 0) {
    score += 5;
  }
  
  // Penalty for reviews that are too item-specific when user is looking at different item
  if (targetItemLower && targetItemLower.length > 2 && 
      reviewItem && reviewItem.length > 2 &&
      !reviewItem.includes(targetItemLower) && !targetItemLower.includes(reviewItem)) {
    
    // Check if the items are completely different garment types
    const itemTypes = ['jeans', 'dress', 'shirt', 'pants', 'jacket', 'sweater', 'top', 'blouse', 'skirt'];
    const targetType = itemTypes.find(type => targetItemLower.includes(type));
    const reviewType = itemTypes.find(type => reviewItem.includes(type));
    
    if (targetType && reviewType && targetType !== reviewType) {
      score -= 50; // Heavy penalty for different garment types
    } else if (targetType !== reviewType) {
      score -= 20; // Moderate penalty for potentially different items
    }
  }
  
  return Math.max(0, score); // Ensure score doesn't go negative
}

export async function POST(request: Request) {
  try {
    const { brand, itemName, item } = await request.json();
    
    // Fix query param mismatch: read itemName if present, else item
    const finalItemName = itemName || item;
    
    if (!brand) {
      return new Response(
        JSON.stringify({ error: 'Brand parameter is required' }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        }
      );
    }

    try {
      // Use the same review fetching logic as check-brand API for consistency
      console.log('🔍 DEBUG: Fetching reviews for brand:', brand);
      
      // Get reviews through the airtable service (same as check-brand API)
      const allReviews = await airtableService.getReviews();
      
      console.log('🔍 DEBUG: Total reviews fetched:', allReviews.length);
      console.log('🔍 DEBUG: Looking for brand:', brand);
      
      // Filter reviews by brand (case-insensitive) - OPTIMIZED
      const normalizedBrand = brand.toLowerCase().trim();
      
      const brandReviews = allReviews.filter(review => {
        // Handle case where brandName might be empty or null
        if (!review.brandName) {
          return false;
        }
        
        const reviewBrandLower = review.brandName.toLowerCase().trim();
        return reviewBrandLower === normalizedBrand;
      });
      
      console.log('🔍 DEBUG: Found brand reviews:', brandReviews.length);
      
      // Process the filtered reviews
      const processedReviews = brandReviews.map(review => ({
        id: review.id,
        brandName: review.brandName,
        itemName: review.itemName,
        garmentType: review.garmentType,
        userBodyType: review.userBodyType,
        sizeBought: review.sizeBought,
        usualSize: review.usualSize,
        fitRating: review.fitRating,
        fitComments: review.fitComments,
        wouldRecommend: review.wouldRecommend,
        height: review.height,
        submissionDate: review.submissionDate,
      }));
      
      let finalReviews = processedReviews;
      
      // If item name is provided, also filter by item name (fuzzy match)
      if (finalItemName && finalItemName.trim()) {
        const normalizedItemName = finalItemName.toLowerCase().trim();
        console.log('🔍 DEBUG: Looking for item:', normalizedItemName);
        
        finalReviews = finalReviews.filter(review => {
          const reviewItemName = review.itemName.toLowerCase().trim();
          
          // Log the comparison for debugging
          console.log(`🔍 Comparing: "${reviewItemName}" vs "${normalizedItemName}"`);
          
          // Multiple matching strategies:
          // 1. Exact match
          if (reviewItemName === normalizedItemName) {
            console.log('✅ Exact match found');
            return true;
          }
          
          // 2. Contains match (either direction)
          if (reviewItemName.includes(normalizedItemName) || normalizedItemName.includes(reviewItemName)) {
            console.log('✅ Contains match found');
            return true;
          }
          
          // 3. Word-based matching (handle variations like "Val Jeans" vs "Val 90s Mid Rise Straight Jeans")
          const itemWords = normalizedItemName.split(/\s+/).filter((word: string) => word.length > 2);
          const reviewWords = reviewItemName.split(/\s+/).filter((word: string) => word.length > 2);
          
          // Check if key words match (e.g., "Val" and "Jeans")
          const keyWords = itemWords.filter((word: string) => 
            reviewWords.some((reviewWord: string) => 
              reviewWord.includes(word) || word.includes(reviewWord)
            )
          );
          
          if (keyWords.length >= Math.min(2, itemWords.length)) {
            console.log('✅ Key word match found:', keyWords);
            return true;
          }
          
          // 4. Common product name variations
          const variations = {
            'val jeans': ['val 90s mid rise straight jeans', 'val straight jeans', 'val denim'],
            'margo t-shirt': ['margo tee', 'margo shirt', 'ganni margo'],
            'ganni dress': ['ganni wrap dress', 'ganni maxi dress', 'ganni silk dress'],
            'rib kick flare': ['rib kick flare pants', 'rib kick flare', 'rib kick']
          };
          
          for (const [baseName, productVariations] of Object.entries(variations)) {
            if (normalizedItemName.includes(baseName) || baseName.includes(normalizedItemName)) {
              if (productVariations.some(variation => 
                reviewItemName.includes(variation) || variation.includes(reviewItemName)
              )) {
                console.log('✅ Variation match found:', baseName);
                return true;
              }
            }
          }
          
          return false;
        });
        
        console.log(`🔍 DEBUG: Found ${finalReviews.length} reviews after item filtering`);
      }
      
      // Sort reviews by relevance only if we have an item name, otherwise use simple date/rating sort
      if (finalItemName && finalItemName.trim() && finalReviews.length > 0) {
        finalReviews.sort((a, b) => {
          // Calculate relevance scores for both reviews
          const scoreA = calculateBrandItemRelevanceScore(a, brand, finalItemName);
          const scoreB = calculateBrandItemRelevanceScore(b, brand, finalItemName);
          
          // First sort by relevance score (highest first)
          if (scoreA !== scoreB) return scoreB - scoreA;
          
          // Then sort by submission date (newest first)
          const dateA = new Date(a.submissionDate || 0);
          const dateB = new Date(b.submissionDate || 0);
          if (dateA > dateB) return -1;
          if (dateA < dateB) return 1;
          
          // Finally sort by fit rating (highest first)
          const ratingA = a.fitRating || 0;
          const ratingB = b.fitRating || 0;
          return ratingB - ratingA;
        });
      } else {
        // Simple sort by date and rating when no specific item
        finalReviews.sort((a, b) => {
          // Sort by submission date (newest first)
          const dateA = new Date(a.submissionDate || 0);
          const dateB = new Date(b.submissionDate || 0);
          if (dateA > dateB) return -1;
          if (dateA < dateB) return 1;
          
          // Then sort by fit rating (highest first)
          const ratingA = a.fitRating || 0;
          const ratingB = b.fitRating || 0;
          return ratingB - ratingA;
        });
      }
      
      // Limit to top 10 reviews to avoid overwhelming the popup
      const limitedReviews = finalReviews.slice(0, 10);
      
      const responseData = {
        success: true,
        brand: brand,
        itemName: finalItemName || null,
        totalReviews: finalReviews.length,
        reviews: limitedReviews.map(review => ({
          id: review.id,
          itemName: review.itemName,
          garmentType: review.garmentType,
          userBodyType: review.userBodyType,
          sizeBought: review.sizeBought,
          usualSize: review.usualSize,
          fitRating: review.fitRating,
          fitComments: review.fitComments,
          wouldRecommend: review.wouldRecommend,
          height: review.height,
          submissionDate: review.submissionDate
        }))
      };

      return new Response(
        JSON.stringify(responseData),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        }
      );
      
    } catch (dbError) {
      return new Response(
        JSON.stringify({ 
          error: 'Database connection failed', 
          details: dbError instanceof Error ? dbError.message : 'Unknown error',
          offline: true 
        }),
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        }
      );
    }

  } catch {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
              { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
