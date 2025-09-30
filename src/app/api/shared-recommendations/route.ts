import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Generate a unique share token
function generateShareToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// POST /api/shared-recommendations - Create a shared recommendation
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get the current user (optional - can be null for anonymous shares)
    const { data: { user } } = await supabase.auth.getUser();
    
    const body = await request.json();
    const { 
      productId, 
      recommendationData, 
      userProfile, 
      productQuery 
    } = body;
    
    if (!productId || !recommendationData || !productQuery) {
      return NextResponse.json(
        { error: 'Missing required fields: productId, recommendationData, productQuery' },
        { status: 400 }
      );
    }
    
    // Generate a unique share token
    const shareToken = generateShareToken();
    
    // Insert the shared recommendation into user_recommendations table
    const { data: sharedRecommendation, error } = await supabase
      .from('user_recommendations')
      .insert({
        product_id: productId,
        user_id: user?.id || null,
        query: productQuery,
        recommendation_data: recommendationData,
        user_profile: userProfile || null,
        share_token: shareToken,
        is_shared: true,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
      })
      .select('share_token, id')
      .single();
    
    if (error) {
      console.error('Error creating shared recommendation:', error);
      return NextResponse.json(
        { error: 'Failed to create shared recommendation' },
        { status: 500 }
      );
    }
    
    // Generate the share URL with proper environment detection
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (process.env.NODE_ENV === 'production' ? 'https://pointfour.in' : 'http://localhost:3000');
    const shareUrl = `${baseUrl}/shared/${sharedRecommendation.share_token}`;
    
    console.log('🔍 DEBUG: Share URL generation:', {
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
      NODE_ENV: process.env.NODE_ENV,
      baseUrl,
      shareUrl
    });
    
    return NextResponse.json({
      success: true,
      shareToken: sharedRecommendation.share_token,
      shareUrl
    });
    
  } catch (error) {
    console.error('Error in shared recommendations POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/shared-recommendations/[token] - Get a shared recommendation by token
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const token = url.pathname.split('/').pop();
    
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
