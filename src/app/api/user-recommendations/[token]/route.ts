import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// GET /api/user-recommendations/[token] - Get a shared recommendation by token (public access)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Share token is required' },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    
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
    }
    
    // If we can't get product data, create a minimal product object
    if (!product) {
      console.log('❌ No product data found, creating fallback product');
      product = {
        id: sharedRecommendation.product_id,
        name: 'Product',
        url: '#',
        description: 'Product information not available',
        image_url: null,
        price: null,
        currency: 'USD',
        brand: {
          id: 1,
          slug: 'unknown',
          name: 'Unknown Brand',
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
