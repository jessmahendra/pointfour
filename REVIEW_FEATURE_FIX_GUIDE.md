# Review Feature Fix Guide

## Problem Summary
The review submission feature is failing with error: `invalid input syntax for type uuid: "undefined"`

This is because:
1. The `brands` table doesn't have an `id` UUID column yet
2. The `user_reviews` table is missing new columns (brand_id, fit_rating, etc.)
3. The database schema cache needs to be refreshed

## Solution Steps

### Step 1: Run Database Migrations in Supabase

You need to run these 2 migration files in your Supabase SQL Editor:

#### Migration 1: Add `id` column to brands table
File: `supabase/migrations/20250107_add_brands_id.sql`

```sql
-- Migration: Add id column to brands table
-- Date: 2025-01-07

-- Add id column as UUID with default value
ALTER TABLE public.brands
ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();

-- Set id as primary key (this will also create a unique constraint)
-- First, we need to populate any NULL ids
UPDATE public.brands SET id = gen_random_uuid() WHERE id IS NULL;

-- Now make it NOT NULL
ALTER TABLE public.brands
ALTER COLUMN id SET NOT NULL;

-- Create unique index on id
CREATE UNIQUE INDEX IF NOT EXISTS brands_id_unique ON public.brands(id);

-- Note: We're keeping slug as well since it's used throughout the app
-- The slug will remain the main way to look up brands in URLs
```

#### Migration 2: Update user_reviews table
File: `supabase/migrations/20250107_update_user_reviews.sql`

```sql
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
    CHECK (fit_rating IN ('true-to-size', 'runs-small', 'runs-large'));
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
```

### Step 2: Reload Schema Cache in Supabase

After running both migrations:

1. Go to your Supabase Dashboard
2. Navigate to **Settings** → **API**
3. Click on **"Reload schema cache"** button
4. Wait for confirmation

### Step 3: Verify the Changes

Run these queries in Supabase SQL Editor to verify:

```sql
-- Check brands table has id column
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'brands'
AND column_name = 'id';

-- Check user_reviews table has new columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'user_reviews'
AND column_name IN ('brand_id', 'fit_rating', 'size_worn', 'measurements_snapshot', 'is_verified_purchase', 'helpful_count');

-- Test that brands have UUIDs
SELECT id, slug, name FROM public.brands LIMIT 5;
```

### Step 4: Test Review Submission

1. Go to any product page (e.g., http://localhost:3000/products/12)
2. Click the "Review" button
3. Fill out the review form
4. Submit the review
5. Verify it saves successfully

## Expected Behavior After Fix

✅ Brands table will have UUID `id` column
✅ Product pages will correctly pass `brandId` to review form
✅ Review submissions will save successfully to database
✅ Users will earn points for submitting reviews

## Troubleshooting

### If you still see "undefined" error:
- Make sure you reloaded the schema cache
- Try hard refresh on the product page (Cmd+Shift+R / Ctrl+Shift+R)
- Check browser console for any JavaScript errors

### If migrations fail:
- Check if columns already exist: `SELECT * FROM information_schema.columns WHERE table_name = 'brands';`
- The migrations use `IF NOT EXISTS` so they're safe to run multiple times

### If review button is missing:
- Clear your browser cache
- The dev server should auto-reload, but you can restart it: `npm run dev`

## Files Modified in This Fix

1. `/src/app/products/[id]/page.tsx` - Added `id` to brand query
2. `/src/app/products/[id]/ProductPageClient.tsx` - Passes `product.brand.id` to review link
3. `/src/components/ReviewSubmissionForm.tsx` - Already uses correct import paths
4. `/src/app/api/reviews/submit/route.ts` - Handles brand_id in review creation
5. Database migrations created in `/supabase/migrations/`

## Next Steps After Review Feature Works

Once review submission is working, you may want to consider:

1. **Add review photo storage** - Run the `supabase/setup_storage.sql` to create storage buckets
2. **Display reviews on product pages** - The `/src/components/UserReviewsSection.tsx` component is ready
3. **Add review management** - Users can edit/delete their reviews via `/src/app/api/reviews/[id]/route.ts`
4. **Test points system** - Verify users are earning 10 points for reviews + 2 points per photo

## Contact

If issues persist after following this guide, please check:
- Supabase logs (Dashboard → Logs)
- Browser developer console
- Next.js terminal output
