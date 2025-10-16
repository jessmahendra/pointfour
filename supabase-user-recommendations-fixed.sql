-- =====================================================
-- USER RECOMMENDATIONS TABLE SETUP (CORRECTED)
-- =====================================================
-- This script creates a comprehensive user_recommendations table
-- that handles both authenticated and anonymous users
-- and supports sharing functionality

-- First, let's check if the products table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'products') THEN
        RAISE EXCEPTION 'Products table does not exist. Please create it first.';
    END IF;
END $$;

-- Drop the old shared_recommendations table if it exists
DROP TABLE IF EXISTS shared_recommendations CASCADE;

-- Drop existing functions and triggers first
DROP TRIGGER IF EXISTS set_share_token_trigger ON user_recommendations;
DROP FUNCTION IF EXISTS set_share_token();
DROP FUNCTION IF EXISTS generate_share_token();
DROP FUNCTION IF EXISTS increment_shared_recommendation_view(text);
DROP FUNCTION IF EXISTS cleanup_expired_shared_recommendations();

-- Drop the table if it exists
DROP TABLE IF EXISTS user_recommendations CASCADE;

-- Create the user_recommendations table
CREATE TABLE user_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
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
    -- Generate a random 16-character token using base64, then make it URL-safe
    token := encode(gen_random_bytes(12), 'base64');
    -- Remove any padding characters and make URL-safe
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
    AND is_shared = true
    AND (expires_at IS NULL OR expires_at > now());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to clean up expired shared recommendations
CREATE OR REPLACE FUNCTION cleanup_expired_shared_recommendations()
RETURNS integer AS $$
DECLARE
  updated_count integer;
BEGIN
  UPDATE user_recommendations 
  SET 
    is_shared = false,
    share_token = NULL,
    expires_at = NULL
  WHERE is_shared = true 
    AND expires_at IS NOT NULL 
    AND expires_at < now();
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to automatically generate share_token when is_shared becomes true
CREATE OR REPLACE FUNCTION set_share_token()
RETURNS trigger AS $$
BEGIN
  -- Only generate token if is_shared is true and no token exists
  IF NEW.is_shared = true AND (NEW.share_token IS NULL OR NEW.share_token = '') THEN
    NEW.share_token := generate_share_token();
  END IF;
  
  -- Set expiration date if sharing and no expiration set
  IF NEW.is_shared = true AND NEW.expires_at IS NULL THEN
    NEW.expires_at := now() + interval '30 days';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER set_share_token_trigger
  BEFORE INSERT OR UPDATE ON user_recommendations
  FOR EACH ROW EXECUTE PROCEDURE set_share_token();

-- Create policies for Row Level Security
-- Policy for users to read their own recommendations
CREATE POLICY "Users can view own recommendations"
ON public.user_recommendations
FOR SELECT
USING (auth.uid() = user_id);

-- Policy for users (authenticated or anonymous) to create recommendations
CREATE POLICY "Users can create recommendations"
ON public.user_recommendations
FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Policy for users to update their own recommendations
CREATE POLICY "Users can update own recommendations"
ON public.user_recommendations
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy for users to delete their own recommendations
CREATE POLICY "Users can delete own recommendations"
ON public.user_recommendations
FOR DELETE
USING (auth.uid() = user_id);

-- Policy for public read access to shared recommendations
CREATE POLICY "Public read access to shared recommendations"
ON public.user_recommendations
FOR SELECT
USING (is_shared = true AND share_token IS NOT NULL AND (expires_at IS NULL OR expires_at > now()));

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant table permissions
GRANT SELECT, INSERT ON user_recommendations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_recommendations TO authenticated;

-- Grant function permissions
GRANT EXECUTE ON FUNCTION increment_shared_recommendation_view(text) TO anon;
GRANT EXECUTE ON FUNCTION generate_share_token() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_shared_recommendations() TO authenticated;

-- Test the setup with a sample insert (this will be rolled back)
DO $$
DECLARE
  test_product_id bigint;
BEGIN
  -- Get a sample product ID
  SELECT id INTO test_product_id FROM products LIMIT 1;
  
  IF test_product_id IS NOT NULL THEN
    -- Test insert (will be rolled back)
    INSERT INTO user_recommendations (product_id, query, recommendation_data, is_shared)
    VALUES (test_product_id, 'Test Query', '{"test": "data"}', true);
    
    RAISE NOTICE 'Test insert successful - table is working correctly';
    
    -- Rollback the test insert
    ROLLBACK;
  ELSE
    RAISE NOTICE 'No products found - please add some products first';
  END IF;
END $$;

-- Verification queries
SELECT 'user_recommendations table created successfully!' as status;

-- Show table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'user_recommendations' 
ORDER BY ordinal_position;
