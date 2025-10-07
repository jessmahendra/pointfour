import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

interface Review {
  id: string;
  rating: number;
  helpful_count: number;
  created_at: string;
  measurements_snapshot?: Record<string, number>;
  [key: string]: unknown;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const supabase = await createClient();
    const { productId } = params;
    const { searchParams } = new URL(request.url);

    // Get current user to filter by similar measurements
    const { data: { user } } = await supabase.auth.getUser();

    // Get filter parameters
    const filterBySimilar = searchParams.get('similar') === 'true';
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Base query
    let query = supabase
      .from('user_reviews')
      .select(`
        *,
        review_photos (
          id,
          photo_url,
          display_order
        )
      `)
      .eq('product_id', productId);

    // If user is authenticated and wants similar measurements
    if (user && filterBySimilar) {
      // Get user's measurements
      const { data: userMeasurements } = await supabase
        .from('user_measurements')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (userMeasurements) {
        // For now, we'll fetch all and filter in memory
        // In production, you might want to use a Postgres function for better performance
        const { data: allReviews, error } = await query;

        if (error) {
          console.error('Error fetching reviews:', error);
          return NextResponse.json(
            { error: 'Failed to fetch reviews' },
            { status: 500 }
          );
        }

        // Filter reviews by similar measurements (within 10% tolerance)
        const similarReviews = (allReviews || []).filter((review: Review) => {
          if (!review.measurements_snapshot) return false;

          const snapshot = review.measurements_snapshot;

          // Check clothing measurements similarity
          if (userMeasurements.waist_cm && snapshot.waist_cm) {
            const waistDiff = Math.abs(userMeasurements.waist_cm - snapshot.waist_cm);
            if (waistDiff / userMeasurements.waist_cm > 0.1) return false;
          }

          if (userMeasurements.hips_cm && snapshot.hips_cm) {
            const hipsDiff = Math.abs(userMeasurements.hips_cm - snapshot.hips_cm);
            if (hipsDiff / userMeasurements.hips_cm > 0.1) return false;
          }

          if (userMeasurements.bust_cm && snapshot.bust_cm) {
            const bustDiff = Math.abs(userMeasurements.bust_cm - snapshot.bust_cm);
            if (bustDiff / userMeasurements.bust_cm > 0.1) return false;
          }

          // Check shoe size similarity (exact match or within 1 size)
          if (userMeasurements.uk_shoe_size && snapshot.uk_shoe_size) {
            const shoeSizeDiff = Math.abs(
              parseFloat(userMeasurements.uk_shoe_size) - parseFloat(snapshot.uk_shoe_size)
            );
            if (shoeSizeDiff > 1) return false;
          }

          return true;
        });

        // Sort similar reviews
        const sortedReviews = sortReviews(similarReviews, sortBy, sortOrder);

        return NextResponse.json({
          reviews: sortedReviews,
          total: sortedReviews.length,
          filtered: true
        });
      }
    }

    // Default: fetch all reviews
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    const { data: reviews, error } = await query;

    if (error) {
      console.error('Error fetching reviews:', error);
      return NextResponse.json(
        { error: 'Failed to fetch reviews' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      reviews: reviews || [],
      total: reviews?.length || 0,
      filtered: false
    });

  } catch (error) {
    console.error('Error fetching product reviews:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function sortReviews(reviews: Review[], sortBy: string, sortOrder: string) {
  const sorted = [...reviews].sort((a, b) => {
    let aVal, bVal;

    switch (sortBy) {
      case 'rating':
        aVal = a.rating;
        bVal = b.rating;
        break;
      case 'helpful_count':
        aVal = a.helpful_count || 0;
        bVal = b.helpful_count || 0;
        break;
      case 'created_at':
      default:
        aVal = new Date(a.created_at).getTime();
        bVal = new Date(b.created_at).getTime();
        break;
    }

    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  return sorted;
}
