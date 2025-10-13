import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// GET /api/user-recommendations/[token] - Get a recommendation by ID (authenticated) or share token (public)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token or ID is required' },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    
    // Check if token is a UUID (recommendation ID) or a share token
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token);
    
    // If it's a UUID, treat it as a recommendation ID (requires authentication)
    if (isUUID) {
      console.log('🔍 DEBUG: Fetching recommendation by ID:', token);
      
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      // Fetch the recommendation with product details
      const { data: recommendation, error } = await supabase
        .from('user_recommendations')
        .select(`
          *,
          product:products!user_recommendations_product_id_fkey (
            id,
            name,
            url,
            description,
            image_url,
            price,
            currency,
            brand:brands!products_brand_id_fkey (
              id,
              slug,
              name,
              logo_url,
              description,
              url
            )
          )
        `)
        .eq('id', token)
        .eq('user_id', user.id) // Ensure user owns this recommendation
        .single();
      
      if (error || !recommendation) {
        return NextResponse.json(
          { error: 'Recommendation not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        data: {
          id: recommendation.id,
          recommendation: recommendation.recommendation_data,
          product: recommendation.product,
          userProfile: recommendation.user_profile,
          productQuery: recommendation.query,
          createdAt: recommendation.created_at
        }
      });
    }
    
    // Otherwise, treat it as a share token (public access)
    console.log('🔍 DEBUG: Fetching shared recommendation for token:', token);
    
    // Get the shared recommendation (public access - no auth required)
    const { data: sharedRecommendation, error } = await supabase
      .from('user_recommendations')
      .select('*')
      .eq('share_token', token)
      .eq('is_shared', true)
      .gt('expires_at', new Date().toISOString())
      .single();
    
    if (error || !sharedRecommendation) {
      console.log('❌ Shared recommendation not found or expired:', error?.message);
      return NextResponse.json(
        { error: 'Shared recommendation not found or expired' },
        { status: 404 }
      );
    }
    
    console.log('✅ Found shared recommendation:', {
      id: sharedRecommendation.id,
      productId: sharedRecommendation.product_id,
      productIdType: typeof sharedRecommendation.product_id,
      userId: sharedRecommendation.user_id || 'anonymous'
    });
    
    // Get the product data with brand information using JOIN
    let product = null;
    
    console.log('🔍 Product ID check:', {
      productId: sharedRecommendation.product_id,
      productIdType: typeof sharedRecommendation.product_id,
      isNull: sharedRecommendation.product_id === null,
      isUndefined: sharedRecommendation.product_id === undefined,
      isEmpty: sharedRecommendation.product_id === '',
      truthy: !!sharedRecommendation.product_id
    });
    
    if (sharedRecommendation.product_id) {
      console.log('🔍 Fetching product with ID:', sharedRecommendation.product_id);
      
      // Try both string and number conversion for product_id
      const productId = sharedRecommendation.product_id;
      const numericProductId = parseInt(productId);
      
      console.log('🔍 Attempting product query with:', {
        originalId: productId,
        numericId: numericProductId,
        isNaN: isNaN(numericProductId)
      });
      
      // First try the JOIN query
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select(`
          *,
          brand:brands!products_brand_id_fkey (
            id,
            slug,
            name,
            logo_url,
            description,
            url
          )
        `)
        .eq('id', numericProductId)
        .single();
      
      console.log('🔍 Product query result:', {
        productData,
        productError: productError?.message
      });
      
      if (!productError && productData) {
        product = productData;
        console.log('✅ Successfully fetched product with brand data:', {
          productName: product.name,
          brandName: product.brand?.name,
          brandId: product.brand?.id
        });
      } else {
        console.log('❌ JOIN query failed, trying separate queries:', productError?.message);
        
        // If JOIN fails, try separate queries
        const { data: productOnly, error: productOnlyError } = await supabase
          .from('products')
          .select('*')
          .eq('id', numericProductId)
          .single();
          
        if (!productOnlyError && productOnly) {
          console.log('✅ Fetched product without brand:', productOnly);
          
          // Try to get brand separately
          const { data: brandData, error: brandError } = await supabase
            .from('brands')
            .select('*')
            .eq('id', productOnly.brand_id)
            .single();
            
          if (!brandError && brandData) {
            product = {
              ...productOnly,
              brand: brandData
            };
            console.log('✅ Successfully combined product and brand data');
          } else {
            console.log('❌ Brand query also failed:', brandError?.message);
            // Use product without brand
            product = productOnly;
          }
        } else {
          console.log('❌ Product query failed completely:', productOnlyError?.message);
        }
      }
    } else {
      console.log('❌ No product_id found in shared recommendation');
      
      // Try to extract brand information from the recommendation data itself
      const recommendationData = sharedRecommendation.recommendation_data;
      if (recommendationData && typeof recommendationData === 'object') {
        console.log('🔍 Attempting to extract brand info from recommendation data');
        
        // Look for brand information in the recommendation data
        const data = recommendationData as Record<string, unknown>;
        const brandInfo = data?.brand || 
                         (data?.product as Record<string, unknown>)?.brand ||
                         (data?.analysisResult as Record<string, unknown>)?.brand;
        
        if (brandInfo && typeof brandInfo === 'object') {
          const brand = brandInfo as Record<string, unknown>;
          console.log('✅ Found brand info in recommendation data:', brand);
          const productData = data?.product as Record<string, unknown> | undefined;
          product = {
            id: 'unknown',
            name: (productData?.name as string) || 'Product',
            url: (productData?.url as string) || '#',
            description: (productData?.description as string) || 'Product information not available',
            image_url: (productData?.image_url as string) || null,
            price: (productData?.price as number) || null,
            currency: (productData?.currency as string) || 'USD',
            brand: {
              id: (brand.id as number) || 1,
              slug: (brand.slug as string) || 'unknown',
              name: (brand.name as string) || 'Unknown Brand',
              logo_url: (brand.logo_url as string) || null,
              description: (brand.description as string) || 'Brand information not available',
              url: (brand.url as string) || '#'
            }
          };
        }
      }
    }
    
    // If we can't get product data, create a minimal product object
    if (!product) {
      console.log('❌ No product data found, creating fallback product');
      
      // Try to extract any available information from the query
      const query = sharedRecommendation.query || '';
      
      // Try to parse brand and product name from the query
      let brandName = 'Unknown Brand';
      let productName = 'Product';
      
      if (query) {
        // Common patterns: "Brand Product", "Brand - Product", "Brand: Product"
        const parts = query.split(/[-:]/).map((part: string) => part.trim());
        if (parts.length >= 2) {
          brandName = parts[0];
          productName = parts.slice(1).join(' ');
        } else {
          // Try to extract brand from the beginning of the query
          const words = query.split(' ');
          if (words.length >= 2) {
            brandName = words[0];
            productName = words.slice(1).join(' ');
          } else {
            productName = query;
          }
        }
      }
      
      product = {
        id: sharedRecommendation.product_id || 'unknown',
        name: productName,
        url: '#',
        description: 'Product information not available',
        image_url: null,
        price: null,
        currency: 'USD',
        brand: {
          id: 1,
          slug: brandName.toLowerCase().replace(/\s+/g, '-'),
          name: brandName,
          logo_url: null,
          description: 'Brand information not available',
          url: '#'
        }
      };
    } else if (!product.brand) {
      console.log('⚠️ Product found but brand is missing, creating fallback brand');
      product.brand = {
        id: product.brand_id || 1,
        slug: 'unknown',
        name: 'Unknown Brand',
        logo_url: null,
        description: 'Brand information not available',
        url: '#'
      };
    }
    
    // Increment view count (this function should work for anonymous users)
    try {
      await supabase.rpc('increment_shared_recommendation_view', {
        share_token_param: token
      });
    } catch (viewError) {
      console.log('⚠️ Could not increment view count:', viewError);
      // Don't fail the request if view count increment fails
    }
    
    return NextResponse.json({
      success: true,
      data: {
        recommendation: sharedRecommendation.recommendation_data,
        product: product, // Use the properly fetched product data
        userProfile: sharedRecommendation.user_profile,
        productQuery: sharedRecommendation.query,
        createdAt: sharedRecommendation.created_at,
        viewCount: sharedRecommendation.view_count + 1, // Include the incremented count
        expiresAt: sharedRecommendation.expires_at
      }
    });
    
  } catch (error) {
    console.error('❌ Exception in user recommendations GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
