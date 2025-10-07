import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET - Fetch a single review
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    const { data: review, error } = await supabase
      .from('user_reviews')
      .select(`
        *,
        review_photos (
          id,
          photo_url,
          display_order
        )
      `)
      .eq('id', id)
      .single();

    if (error || !review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ review });

  } catch (error) {
    console.error('Error fetching review:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Update a review
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify ownership
    const { data: existingReview, error: fetchError } = await supabase
      .from('user_reviews')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingReview) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    if (existingReview.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Not authorized to edit this review' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      rating,
      fitRating,
      reviewText,
      sizeWorn,
      photos = []
    } = body;

    // Build update object
    const updates: Record<string, unknown> = {};
    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return NextResponse.json(
          { error: 'Rating must be between 1 and 5' },
          { status: 400 }
        );
      }
      updates.rating = rating;
    }
    if (fitRating !== undefined) {
      const validFitRatings = ['true_to_size', 'runs_small', 'runs_large'];
      if (!validFitRatings.includes(fitRating)) {
        return NextResponse.json(
          { error: 'Invalid fit rating' },
          { status: 400 }
        );
      }
      updates.fit_rating = fitRating;
    }
    if (reviewText !== undefined) updates.review_text = reviewText;
    if (sizeWorn !== undefined) updates.size_worn = sizeWorn;
    updates.updated_at = new Date().toISOString();

    // Update review
    const { data: updatedReview, error: updateError } = await supabase
      .from('user_reviews')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating review:', updateError);
      return NextResponse.json(
        { error: 'Failed to update review' },
        { status: 500 }
      );
    }

    // Update photos if provided
    if (photos && photos.length > 0) {
      if (photos.length > 5) {
        return NextResponse.json(
          { error: 'Maximum 5 photos allowed per review' },
          { status: 400 }
        );
      }

      // Delete existing photos
      const { error: deletePhotosError } = await supabase
        .from('review_photos')
        .delete()
        .eq('review_id', id);

      if (deletePhotosError) {
        console.error('Error deleting old photos:', deletePhotosError);
      }

      // Insert new photos
      const photoInserts = photos.map((photoUrl: string, index: number) => ({
        review_id: id,
        photo_url: photoUrl,
        display_order: index
      }));

      const { error: insertPhotosError } = await supabase
        .from('review_photos')
        .insert(photoInserts);

      if (insertPhotosError) {
        console.error('Error inserting new photos:', insertPhotosError);
      }
    }

    return NextResponse.json({
      success: true,
      review: updatedReview
    });

  } catch (error) {
    console.error('Error updating review:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a review
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify ownership
    const { data: existingReview, error: fetchError } = await supabase
      .from('user_reviews')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingReview) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    if (existingReview.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Not authorized to delete this review' },
        { status: 403 }
      );
    }

    // Delete review (photos will cascade delete due to FK constraint)
    const { error: deleteError } = await supabase
      .from('user_reviews')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting review:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete review' },
        { status: 500 }
      );
    }

    // Note: Points deduction not implemented yet
    // You may want to add logic to deduct points when a review is deleted

    return NextResponse.json({
      success: true,
      message: 'Review deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
