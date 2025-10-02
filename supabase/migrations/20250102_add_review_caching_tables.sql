-- Migration: Add review caching infrastructure
-- This enables caching of external reviews and sets up foundation for user reviews

-- ============================================================================
-- 1. PRODUCT REVIEWS TABLE (External reviews from Serper)
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_reviews (
  id BIGSERIAL PRIMARY KEY,
  product_id INT8 NOT NULL REFERENCES products(id) ON DELETE CASCADE,

  -- Review content
  source TEXT NOT NULL, -- 'reddit', 'youtube', 'instagram', etc.
  source_url TEXT,
  snippet TEXT NOT NULL,
  title TEXT,

  -- Metadata
  search_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate reviews from same source
  UNIQUE(product_id, source_url)
);

CREATE INDEX IF NOT EXISTS idx_product_reviews_product
  ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_search_date
  ON product_reviews(search_date DESC);

COMMENT ON TABLE product_reviews IS 'External reviews scraped from web (Serper API)';
COMMENT ON COLUMN product_reviews.snippet IS 'The review text/quote';
COMMENT ON COLUMN product_reviews.source IS 'Platform where review was found (reddit, youtube, etc)';
COMMENT ON COLUMN product_reviews.source_url IS 'Direct link to the review';

-- ============================================================================
-- 2. REVIEW SEARCH CACHE TABLE (Serper search results cache)
-- ============================================================================

CREATE TABLE IF NOT EXISTS review_search_cache (
  id BIGSERIAL PRIMARY KEY,
  product_id INT8 NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,

  -- Search metadata
  search_query TEXT NOT NULL,
  total_results INT DEFAULT 0,

  -- Cache timing
  last_search_at TIMESTAMPTZ DEFAULT NOW(),
  next_search_due TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_review_cache_next_search
  ON review_search_cache(next_search_due);

CREATE INDEX IF NOT EXISTS idx_review_cache_product
  ON review_search_cache(product_id);

COMMENT ON TABLE review_search_cache IS 'Tracks when we last searched for reviews for each product';
COMMENT ON COLUMN review_search_cache.next_search_due IS 'When the cache expires and needs refresh (7 days from last search)';

-- ============================================================================
-- 3. USER REVIEWS TABLE (Future: User-generated reviews)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id INT8 NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Review content
  rating INT CHECK (rating >= 1 AND rating <= 5),
  fit_rating TEXT CHECK (fit_rating IN ('runs_small', 'true_to_size', 'runs_large')),
  review_text TEXT NOT NULL,
  size_worn TEXT,

  -- User measurements at time of review (snapshot)
  measurements_snapshot JSONB,

  -- Verification & moderation
  is_verified BOOLEAN DEFAULT FALSE,
  verification_type TEXT,
  is_approved BOOLEAN DEFAULT FALSE,
  moderation_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One review per user per product
  UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_user_reviews_product
  ON user_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_user_reviews_user
  ON user_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_user_reviews_approved
  ON user_reviews(is_approved) WHERE is_approved = TRUE;

COMMENT ON TABLE user_reviews IS 'User-generated reviews (future feature - not currently used)';
COMMENT ON COLUMN user_reviews.measurements_snapshot IS 'Snapshot of user measurements when review was written';
COMMENT ON COLUMN user_reviews.is_verified IS 'Whether the review has been verified (e.g., purchase verification)';

-- ============================================================================
-- 4. USER PRODUCT RECOMMENDATIONS TABLE (Personalized recommendations cache)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_product_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id INT8 NOT NULL REFERENCES products(id) ON DELETE CASCADE,

  -- The personalized recommendation
  recommendation_text TEXT NOT NULL,
  recommendation_data JSONB, -- Structured recommendation data

  -- User measurements used for this recommendation
  user_measurements JSONB,

  -- Which reviews were used to generate this
  review_count INT DEFAULT 0,

  -- Caching/freshness
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One cached recommendation per user per product
  UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_user_product_recs_user_product
  ON user_product_recommendations(user_id, product_id);
CREATE INDEX IF NOT EXISTS idx_user_product_recs_expiry
  ON user_product_recommendations(expires_at);

COMMENT ON TABLE user_product_recommendations IS 'Cached personalized recommendations for each user+product combination';
COMMENT ON COLUMN user_product_recommendations.expires_at IS 'When this cached recommendation expires and should be regenerated';
COMMENT ON COLUMN user_product_recommendations.user_measurements IS 'Snapshot of user measurements used to generate this recommendation';

-- ============================================================================
-- 5. UPDATE TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp for review_search_cache
CREATE OR REPLACE FUNCTION update_review_cache_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_review_cache_timestamp
BEFORE UPDATE ON review_search_cache
FOR EACH ROW
EXECUTE FUNCTION update_review_cache_timestamp();

-- Auto-update updated_at timestamp for user_reviews
CREATE TRIGGER trigger_update_user_reviews_timestamp
BEFORE UPDATE ON user_reviews
FOR EACH ROW
EXECUTE FUNCTION update_review_cache_timestamp();

-- Auto-update updated_at timestamp for user_product_recommendations
CREATE TRIGGER trigger_update_user_product_recs_timestamp
BEFORE UPDATE ON user_product_recommendations
FOR EACH ROW
EXECUTE FUNCTION update_review_cache_timestamp();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify tables were created
DO $$
BEGIN
  RAISE NOTICE 'Review caching tables created successfully:';
  RAISE NOTICE '  - product_reviews';
  RAISE NOTICE '  - review_search_cache';
  RAISE NOTICE '  - user_reviews';
  RAISE NOTICE '  - user_product_recommendations';
END $$;
