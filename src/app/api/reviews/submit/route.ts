import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      productId,
      brandId,
      rating,
      fitRating, // 'true-to-size' | 'runs-small' | 'runs-large'
      reviewText,
      sizeWorn,
      photos = [] // Array of photo URLs (already uploaded to storage)
    } = body;

    // Validate required fields
    if (!productId || !brandId || !rating || !fitRating || !reviewText || !sizeWorn) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Validate fit rating
    const validFitRatings = ['true_to_size', 'runs_small', 'runs_large'];
    if (!validFitRatings.includes(fitRating)) {
      return NextResponse.json(
        { error: 'Invalid fit rating' },
        { status: 400 }
      );
    }

    // Validate photo limit
    if (photos.length > 5) {
      return NextResponse.json(
        { error: 'Maximum 5 photos allowed per review' },
        { status: 400 }
      );
    }

    // Get user measurements to snapshot with review
    const { data: measurements } = await supabase
      .from('user_measurements')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Insert review
    const { data: review, error: reviewError } = await supabase
      .from('user_reviews')
      .insert({
        user_id: user.id,
        product_id: productId,
        brand_id: brandId,
        rating,
        fit_rating: fitRating,
        review_text: reviewText,
        size_worn: sizeWorn,
        measurements_snapshot: measurements || null,
        is_verified_purchase: false // Default to false, can be updated later
      })
      .select()
      .single();

    if (reviewError) {
      console.error('Error creating review:', reviewError);
      return NextResponse.json(
        { error: 'Failed to create review' },
        { status: 500 }
      );
    }

    // Insert photos if provided
    if (photos.length > 0) {
      const photoInserts = photos.map((photoUrl: string, index: number) => ({
        review_id: review.id,
        photo_url: photoUrl,
        display_order: index
      }));

      const { error: photosError } = await supabase
        .from('review_photos')
        .insert(photoInserts);

      if (photosError) {
        console.error('Error adding photos:', photosError);
        // Don't fail the whole request, review is already created
      }
    }

    // Points are automatically awarded via database trigger

    return NextResponse.json({
      success: true,
      review: {
        id: review.id,
        rating: review.rating,
        fitRating: review.fit_rating,
        reviewText: review.review_text,
        sizeWorn: review.size_worn,
        createdAt: review.created_at,
        photoCount: photos.length
      }
    });

  } catch (error) {
    console.error('Error submitting review:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
