import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// GET /api/shared-recommendations/[token] - Get a shared recommendation by token
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
    
    // Get the shared recommendation
    const { data: sharedRecommendation, error } = await supabase
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
      .eq('share_token', token)
      .eq('is_shared', true)
      .gt('expires_at', new Date().toISOString())
      .single();
    
    if (error || !sharedRecommendation) {
      return NextResponse.json(
        { error: 'Shared recommendation not found or expired' },
        { status: 404 }
      );
    }
    
    // Increment view count
    await supabase
      .from('user_recommendations')
      .update({
        view_count: (sharedRecommendation.view_count || 0) + 1,
        last_viewed_at: new Date().toISOString()
      })
      .eq('share_token', token);
    
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
    console.error('Error in shared recommendations GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
