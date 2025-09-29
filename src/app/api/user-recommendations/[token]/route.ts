import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// GET /api/user-recommendations/[token] - Get a shared recommendation by token (public access)
export async function GET(
  request: NextRequest,
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
      userId: sharedRecommendation.user_id || 'anonymous'
    });
    
    // Get the product data separately
    let product = null;
    if (sharedRecommendation.product_id) {
      // First get the product
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', sharedRecommendation.product_id)
        .single();
      
      if (!productError && productData) {
        // Then get the brand separately
        const { data: brandData, error: brandError } = await supabase
          .from('brands')
          .select('*')
          .eq('id', productData.brand_id)
          .single();
        
        if (!brandError && brandData) {
          product = {
            ...productData,
            brand: brandData
          };
        } else {
          // If brand query fails, create a minimal product with fallback brand
          product = {
            ...productData,
            brand: {
              id: productData.brand_id || 1,
              slug: 'unknown',
              name: 'Unknown Brand',
              logo_url: null,
              description: 'Brand information not available',
              url: '#'
            }
          };
        }
      }
    }
    
    // If we can't get product data, create a minimal product object
    if (!product) {
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
        product: sharedRecommendation.product,
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
