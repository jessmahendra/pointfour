import { airtableService } from '@/lib/airtable';

export async function POST(request: Request) {
  try {
    const { brand } = await request.json();
    
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

    // Get real data from Airtable database
    let hasData = false;
    let reviewCount = 0;
    let brandData = null;

    try {
      // Check if brand exists in our database
      const brands = await airtableService.getBrands();
      const normalizedBrand = brand.toLowerCase().trim();
      
      // Find matching brand (case-insensitive)
      brandData = brands.find(existingBrand => {
        const existingName = existingBrand.name.toLowerCase().trim();
        const searchName = normalizedBrand;
        
        // Exact match
        if (existingName === searchName) {
          return true;
        }
        
        // Partial match (in case of extra spaces or slight variations)
        if (existingName.includes(searchName) || searchName.includes(existingName)) {
          return true;
        }
        
        return false;
      });
      
      if (brandData) {
        console.log('✅ API: Brand found in database:', brandData.name);
        hasData = true;
        
        // Get actual review count for this brand
        console.log('🔍 DEBUG: Starting review filtering...');
        const reviews = await airtableService.getReviews();
        console.log('🔍 DEBUG: Reviews fetched, starting filtering logic...');
        
        // DEBUG: Log all unique brand names in reviews to see what we're working with
        const allBrandNamesInReviews = [...new Set(reviews.map(r => r.brandName))].sort();
        console.log('🔍 DEBUG: All brand names in reviews table:', allBrandNamesInReviews);
        console.log('🔍 DEBUG: Looking for brand:', normalizedBrand);
        console.log('🔍 DEBUG: Total reviews found:', reviews.length);
        
        // FIXED: More robust brand name matching for reviews
        const brandReviews = reviews.filter(review => {
          const reviewBrandName = review.brandName.toLowerCase().trim();
          const searchBrandName = normalizedBrand;
          
          // DEBUG: Log the first few brand matching attempts
          if (review.id === reviews[0].id || review.id === reviews[1].id || review.id === reviews[2].id) {
            console.log(`🔍 DEBUG: Review ${review.id} - Brand: "${reviewBrandName}" vs Search: "${searchBrandName}"`);
          }
          
          // TEMPORARY: Make filtering more strict to debug the issue
          // Only allow exact matches for now
          if (reviewBrandName === searchBrandName) {
            if (review.id === reviews[0].id || review.id === reviews[1].id || review.id === reviews[2].id) {
              console.log(`✅ DEBUG: Exact match found for review ${review.id}`);
            }
            return true;
          }
          
          return false;
        });
        
        reviewCount = brandReviews.length;
        
        console.log(`🔍 DEBUG: Found ${reviewCount} reviews for brand "${brand}"`);
        if (reviewCount > 0) {
          console.log('🔍 DEBUG: First few matching reviews:', brandReviews.slice(0, 3).map(r => ({ 
            brand: r.brandName, 
            item: r.itemName, 
            type: r.garmentType 
          })));
        }
        
        if (reviewCount > 0) {
          // console.log('�� API: Brand reviews:', brandReviews.map(r => ({ 
          //   brand: r.brandName, 
          //   item: r.itemName, 
          //   rating: r.fitRating,
          //   type: r.garmentType 
          // })));
        } else {
          // console.log('📊 API: No reviews found - checking all available brand names in reviews:');
          // console.log('📊 API: Available brand names in reviews:', allBrandNamesInReviews);
        }
      } else {
        // console.log('❌ API: Brand not found in database');
      }
      
    } catch (dbError) {
      // console.error('💥 API: Database query error:', dbError);
      // Fallback to error response
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

    // FIXED: Generate appropriate message based on data availability
    let message;
    if (hasData && reviewCount > 0) {
      message = `Found ${reviewCount} reviews for ${brand}`;
    } else if (hasData && reviewCount === 0) {
      message = `Brand data available for ${brand} (no reviews yet)`;
    } else {
      message = `No data found for ${brand}`;
    }

    const responseData = {
      hasData,
      reviewCount,
      brand: brand,
      brandData: brandData ? {
        name: brandData.name,
        fitSummary: brandData.fitSummary,
        sizingSystem: brandData.sizingSystem,
        bestForBodyTypes: brandData.bestForBodyTypes,
        commonFitInformation: brandData.commonFitInformation
      } : null,
      message: message
    };

    // console.log('📤 API: Sending response:', responseData);
    // console.log('📤 API: Response structure:', {
    //   hasData: responseData.hasData,
    //   reviewCount: responseData.reviewCount,
    //   hasBrandData: !!responseData.brandData,
    //   message: responseData.message
    // });

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

  } catch {
    // console.error('💥 API: Error checking brand:', error);
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
