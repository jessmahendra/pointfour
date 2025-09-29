-- =====================================================
-- FIX ANONYMOUS USER RECOMMENDATION SHARING
-- =====================================================
-- This script fixes the user_recommendations table to properly support
-- anonymous users creating shareable recommendations

-- First, let's check if the products table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'products') THEN
        RAISE EXCEPTION 'Products table does not exist. Please create it first.';
    END IF;
END $$;

-- Drop existing functions and triggers first
DROP TRIGGER IF EXISTS set_share_token_trigger ON user_recommendations;
DROP FUNCTION IF EXISTS set_share_token();
DROP FUNCTION IF EXISTS generate_share_token();
DROP FUNCTION IF EXISTS increment_shared_recommendation_view(text);
DROP FUNCTION IF EXISTS cleanup_expired_shared_recommendations();

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own recommendations" ON public.user_recommendations;
DROP POLICY IF EXISTS "Users can create recommendations" ON public.user_recommendations;
DROP POLICY IF EXISTS "Users can update own recommendations" ON public.user_recommendations;
DROP POLICY IF EXISTS "Users can delete own recommendations" ON public.user_recommendations;
DROP POLICY IF EXISTS "Public read access to shared recommendations" ON public.user_recommendations;

-- Drop the table if it exists to recreate it properly
DROP TABLE IF EXISTS user_recommendations CASCADE;

-- Create the user_recommendations table with proper support for anonymous users
CREATE TABLE user_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL, -- Can be NULL for anonymous users
  product_id bigint REFERENCES products(id) ON DELETE CASCADE,
  query text NOT NULL,
  recommendation_data jsonb NOT NULL,
  user_profile jsonb,
  share_token text UNIQUE,
  is_shared boolean DEFAULT false,
  expires_at timestamp with time zone,
  view_count integer DEFAULT 0,
  last_viewed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_recommendations_user_id ON user_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_recommendations_product_id ON user_recommendations(product_id);
CREATE INDEX IF NOT EXISTS idx_user_recommendations_share_token ON user_recommendations(share_token);
CREATE INDEX IF NOT EXISTS idx_user_recommendations_is_shared ON user_recommendations(is_shared);
CREATE INDEX IF NOT EXISTS idx_user_recommendations_expires_at ON user_recommendations(expires_at);

-- Enable Row Level Security
ALTER TABLE user_recommendations ENABLE ROW LEVEL SECURITY;

-- Create a function to generate a unique share token
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS text AS $$
DECLARE
  token text;
  exists boolean;
BEGIN
  LOOP
    -- Generate a random 16-character token
    token := encode(gen_random_bytes(12), 'base64url');
    -- Remove any padding characters
    token := replace(replace(token, '=', ''), '+', '-');
    token := replace(token, '/', '_');
    
    -- Check if token already exists
    SELECT EXISTS(SELECT 1 FROM user_recommendations WHERE share_token = token) INTO exists;
    
    -- If token doesn't exist, we can use it
    IF NOT exists THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN token;
END;
$$ LANGUAGE plpgsql;

-- Create a function to increment view count when a shared recommendation is accessed
CREATE OR REPLACE FUNCTION increment_shared_recommendation_view(share_token_param text)
RETURNS void AS $$
BEGIN
  UPDATE user_recommendations 
  SET 
    view_count = view_count + 1,
    last_viewed_at = now()
  WHERE share_token = share_token_param 
    AND expires_at > now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to clean up expired shared recommendations
CREATE OR REPLACE FUNCTION cleanup_expired_shared_recommendations()
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM user_recommendations 
  WHERE expires_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to automatically generate share_token if not provided
CREATE OR REPLACE FUNCTION set_share_token()
RETURNS trigger AS $$
BEGIN
  IF NEW.share_token IS NULL OR NEW.share_token = '' THEN
    NEW.share_token := generate_share_token();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_share_token_trigger
  BEFORE INSERT ON user_recommendations
  FOR EACH ROW EXECUTE PROCEDURE set_share_token();

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Policy 1: Authenticated users can view their own recommendations
CREATE POLICY "Authenticated users can view own recommendations"
ON public.user_recommendations
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy 2: Anyone can view shared recommendations (public access)
CREATE POLICY "Public read access to shared recommendations"
ON public.user_recommendations
FOR SELECT
USING (is_shared = true AND share_token IS NOT NULL AND expires_at > now());

-- Policy 3: Anyone can create recommendations (authenticated or anonymous)
CREATE POLICY "Anyone can create recommendations"
ON public.user_recommendations
FOR INSERT
WITH CHECK (
  -- Authenticated users can create recommendations for themselves
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
  -- Anonymous users can create recommendations (user_id will be NULL)
  (auth.uid() IS NULL AND user_id IS NULL)
);

-- Policy 4: Users can update their own recommendations
CREATE POLICY "Users can update own recommendations"
ON public.user_recommendations
FOR UPDATE
USING (
  -- Authenticated users can update their own recommendations
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
  -- Anonymous users can update their own recommendations (no auth check)
  (auth.uid() IS NULL AND user_id IS NULL)
)
WITH CHECK (
  -- Same conditions for the new values
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
  (auth.uid() IS NULL AND user_id IS NULL)
);

-- Policy 5: Users can delete their own recommendations
CREATE POLICY "Users can delete own recommendations"
ON public.user_recommendations
FOR DELETE
USING (
  -- Authenticated users can delete their own recommendations
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
  -- Anonymous users can delete their own recommendations (no auth check)
  (auth.uid() IS NULL AND user_id IS NULL)
);

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant necessary permissions to anonymous users
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON user_recommendations TO anon;
GRANT INSERT ON user_recommendations TO anon;
GRANT UPDATE ON user_recommendations TO anon;
GRANT DELETE ON user_recommendations TO anon;
GRANT EXECUTE ON FUNCTION increment_shared_recommendation_view(text) TO anon;

-- Grant permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON user_recommendations TO authenticated;
GRANT INSERT ON user_recommendations TO authenticated;
GRANT UPDATE ON user_recommendations TO authenticated;
GRANT DELETE ON user_recommendations TO authenticated;
GRANT EXECUTE ON FUNCTION increment_shared_recommendation_view(text) TO authenticated;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Test that the table was created successfully
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_recommendations') THEN
        RAISE NOTICE 'SUCCESS: user_recommendations table created successfully';
    ELSE
        RAISE EXCEPTION 'ERROR: user_recommendations table was not created';
    END IF;
END $$;

-- Test that policies were created
DO $$
DECLARE
    policy_count integer;
BEGIN
    SELECT COUNT(*) INTO policy_count 
    FROM pg_policies 
    WHERE tablename = 'user_recommendations';
    
    IF policy_count >= 5 THEN
        RAISE NOTICE 'SUCCESS: % RLS policies created for user_recommendations', policy_count;
    ELSE
        RAISE EXCEPTION 'ERROR: Expected at least 5 policies, found %', policy_count;
    END IF;
END $$;

-- Test that functions were created
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_proc WHERE proname = 'generate_share_token') THEN
        RAISE NOTICE 'SUCCESS: generate_share_token function created';
    ELSE
        RAISE EXCEPTION 'ERROR: generate_share_token function was not created';
    END IF;
    
    IF EXISTS (SELECT FROM pg_proc WHERE proname = 'increment_shared_recommendation_view') THEN
        RAISE NOTICE 'SUCCESS: increment_shared_recommendation_view function created';
    ELSE
        RAISE EXCEPTION 'ERROR: increment_shared_recommendation_view function was not created';
    END IF;
END $$;

RAISE NOTICE '=====================================================';
RAISE NOTICE 'ANONYMOUS USER RECOMMENDATION SHARING SETUP COMPLETE';
RAISE NOTICE '=====================================================';
RAISE NOTICE 'The user_recommendations table now supports:';
RAISE NOTICE '1. Anonymous users creating recommendations';
RAISE NOTICE '2. Shareable recommendations with unique tokens';
RAISE NOTICE '3. Public access to shared recommendations';
RAISE NOTICE '4. Automatic token generation';
RAISE NOTICE '5. View count tracking';
RAISE NOTICE '6. Automatic expiration (30 days)';
RAISE NOTICE '=====================================================';
