-- Migration: Add review photos and points system
-- Date: 2025-01-07

-- =============================================
-- 1. Review Photos Table
-- =============================================
CREATE TABLE IF NOT EXISTS public.review_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.user_reviews(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT review_photos_display_order_check CHECK (display_order >= 0)
);

-- Add index for faster lookups
CREATE INDEX idx_review_photos_review_id ON public.review_photos(review_id);
CREATE INDEX idx_review_photos_display_order ON public.review_photos(review_id, display_order);

-- Enable RLS
ALTER TABLE public.review_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for review_photos
CREATE POLICY "Anyone can view review photos"
  ON public.review_photos
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert photos for their own reviews"
  ON public.review_photos
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_reviews
      WHERE id = review_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own review photos"
  ON public.review_photos
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_reviews
      WHERE id = review_id AND user_id = auth.uid()
    )
  );

-- =============================================
-- 2. User Points Table
-- =============================================
CREATE TABLE IF NOT EXISTS public.user_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT user_points_total_check CHECK (total_points >= 0),
  CONSTRAINT user_points_user_unique UNIQUE (user_id)
);

-- Add index
CREATE INDEX idx_user_points_user_id ON public.user_points(user_id);

-- Enable RLS
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_points
CREATE POLICY "Users can view their own points"
  ON public.user_points
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own points record"
  ON public.user_points
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 3. Points Transactions Table (for tracking)
-- =============================================
CREATE TABLE IF NOT EXISTS public.points_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points_change INTEGER NOT NULL,
  reason TEXT NOT NULL,
  reference_id UUID, -- e.g., review_id
  reference_type TEXT, -- e.g., 'review', 'referral'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT points_transactions_points_change_check CHECK (points_change <> 0)
);

-- Add indexes
CREATE INDEX idx_points_transactions_user_id ON public.points_transactions(user_id);
CREATE INDEX idx_points_transactions_reference ON public.points_transactions(reference_type, reference_id);

-- Enable RLS
ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for points_transactions
CREATE POLICY "Users can view their own transactions"
  ON public.points_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- =============================================
-- 4. Function to Award Points
-- =============================================
CREATE OR REPLACE FUNCTION public.award_points(
  p_user_id UUID,
  p_points INTEGER,
  p_reason TEXT,
  p_reference_id UUID DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert or update user_points
  INSERT INTO public.user_points (user_id, total_points, updated_at)
  VALUES (p_user_id, p_points, NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET
    total_points = public.user_points.total_points + p_points,
    updated_at = NOW();

  -- Record transaction
  INSERT INTO public.points_transactions (user_id, points_change, reason, reference_id, reference_type)
  VALUES (p_user_id, p_points, p_reason, p_reference_id, p_reference_type);
END;
$$;

-- =============================================
-- 5. Trigger to Award Points for Reviews
-- =============================================
CREATE OR REPLACE FUNCTION public.award_review_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  points_to_award INTEGER := 10; -- Base points for review
  photo_bonus INTEGER := 0;
  photo_count INTEGER;
BEGIN
  -- Count photos in the review (if any)
  SELECT COUNT(*) INTO photo_count
  FROM public.review_photos
  WHERE review_id = NEW.id;

  -- Award 2 points per photo (max 5 photos = 10 bonus points)
  IF photo_count > 0 THEN
    photo_bonus := LEAST(photo_count * 2, 10);
  END IF;

  -- Award points
  PERFORM public.award_points(
    NEW.user_id,
    points_to_award + photo_bonus,
    CASE
      WHEN photo_bonus > 0 THEN
        'Review submission with ' || photo_count || ' photo(s)'
      ELSE
        'Review submission'
    END,
    NEW.id,
    'review'
  );

  RETURN NEW;
END;
$$;

-- Create trigger on user_reviews (only on INSERT)
CREATE TRIGGER trigger_award_review_points
AFTER INSERT ON public.user_reviews
FOR EACH ROW
EXECUTE FUNCTION public.award_review_points();

-- =============================================
-- 6. Add helpful votes column to user_reviews (optional)
-- =============================================
ALTER TABLE public.user_reviews
ADD COLUMN IF NOT EXISTS helpful_count INTEGER NOT NULL DEFAULT 0;

-- =============================================
-- Comments
-- =============================================
COMMENT ON TABLE public.review_photos IS 'Stores photos attached to user reviews (max 5 per review)';
COMMENT ON TABLE public.user_points IS 'Tracks total points accumulated by users';
COMMENT ON TABLE public.points_transactions IS 'Audit log for all point changes';
COMMENT ON FUNCTION public.award_points IS 'Awards points to a user and records transaction';
COMMENT ON FUNCTION public.award_review_points IS 'Automatically awards points when a user submits a review';
