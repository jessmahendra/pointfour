-- Migration: Update existing user_reviews table for new review system
-- Date: 2025-01-07

-- Add missing columns to user_reviews table if they don't exist
ALTER TABLE public.user_reviews
ADD COLUMN IF NOT EXISTS brand_id UUID,
ADD COLUMN IF NOT EXISTS fit_rating TEXT,
ADD COLUMN IF NOT EXISTS size_worn TEXT,
ADD COLUMN IF NOT EXISTS measurements_snapshot JSONB,
ADD COLUMN IF NOT EXISTS is_verified_purchase BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0;

-- Add check constraint for fit_rating
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_reviews_fit_rating_check'
  ) THEN
    ALTER TABLE public.user_reviews
    ADD CONSTRAINT user_reviews_fit_rating_check
    CHECK (fit_rating IN ('true_to_size', 'runs_small', 'runs_large'));
  END IF;
END $$;

-- Update the review_text column to be NOT NULL if it isn't already
DO $$
BEGIN
  ALTER TABLE public.user_reviews
  ALTER COLUMN review_text SET NOT NULL;
EXCEPTION
  WHEN others THEN
    -- Column might already be NOT NULL or have data issues
    NULL;
END $$;

-- Update the rating column to be NOT NULL if it isn't already
DO $$
BEGIN
  ALTER TABLE public.user_reviews
  ALTER COLUMN rating SET NOT NULL;
EXCEPTION
  WHEN others THEN
    NULL;
END $$;

-- Add indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_user_reviews_product_id ON public.user_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_user_reviews_brand_id ON public.user_reviews(brand_id);
CREATE INDEX IF NOT EXISTS idx_user_reviews_user_id ON public.user_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_user_reviews_created_at ON public.user_reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_reviews_rating ON public.user_reviews(rating);
