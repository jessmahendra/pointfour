-- =====================================================
-- USER RECOMMENDATIONS TABLE SETUP
-- =====================================================
-- This script creates a comprehensive user_recommendations table
-- that handles both authenticated and anonymous users
-- and supports sharing functionality

-- Drop the old shared_recommendations table if it exists
DROP TABLE IF EXISTS shared_recommendations CASCADE;

-- Create the user_recommendations table
CREATE TABLE user_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id bigint REFERENCES products(id) ON DELETE CASCADE,
  query text NOT NULL, -- The original query used
  recommendation_data jsonb NOT NULL, -- The full recommendation result
  user_profile jsonb, -- The user profile data used for the recommendation
  share_token text UNIQUE, -- Optional share token for public sharing
  is_shared boolean DEFAULT false, -- Whether this recommendation is shared publicly
  expires_at timestamp with time zone, -- Optional expiration for shared recommendations
  view_count integer DEFAULT 0, -- Track how many times shared recommendations have been viewed
  last_viewed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_user_recommendations_user_id ON user_recommendations(user_id);
CREATE INDEX idx_user_recommendations_product_id ON user_recommendations(product_id);
CREATE INDEX idx_user_recommendations_share_token ON user_recommendations(share_token);
CREATE INDEX idx_user_recommendations_is_shared ON user_recommendations(is_shared);
CREATE INDEX idx_user_recommendations_expires_at ON user_recommendations(expires_at);

-- Enable Row Level Security
ALTER TABLE user_recommendations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own recommendations" ON public.user_recommendations;
DROP POLICY IF EXISTS "Users can create recommendations" ON public.user_recommendations;
DROP POLICY IF EXISTS "Users can update own recommendations" ON public.user_recommendations;
DROP POLICY IF EXISTS "Users can delete own recommendations" ON public.user_recommendations;
DROP POLICY IF EXISTS "Public read access to shared recommendations" ON public.user_recommendations;

-- Create a policy for users to read their own recommendations
CREATE POLICY "Users can view own recommendations"
ON public.user_recommendations
FOR SELECT
USING (auth.uid() = user_id);

-- Create a policy for users (authenticated or anonymous) to create recommendations
CREATE POLICY "Users can create recommendations"
ON public.user_recommendations
FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Create a policy for users to update their own recommendations
CREATE POLICY "Users can update own recommendations"
ON public.user_recommendations
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create a policy for users to delete their own recommendations
CREATE POLICY "Users can delete own recommendations"
ON public.user_recommendations
FOR DELETE
USING (auth.uid() = user_id);

-- Create a policy for public read access to shared recommendations
CREATE POLICY "Public read access to shared recommendations"
ON public.user_recommendations
FOR SELECT
USING (is_shared = true AND share_token IS NOT NULL AND (expires_at IS NULL OR expires_at > now()));

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
    AND is_shared = true
    AND (expires_at IS NULL OR expires_at > now());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to clean up expired shared recommendations
CREATE OR REPLACE FUNCTION cleanup_expired_shared_recommendations()
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  UPDATE user_recommendations 
  SET 
    is_shared = false,
    share_token = NULL,
    expires_at = NULL
  WHERE is_shared = true 
    AND expires_at IS NOT NULL 
    AND expires_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
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

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS set_share_token_trigger ON user_recommendations;

-- Create the trigger
CREATE TRIGGER set_share_token_trigger
  BEFORE INSERT OR UPDATE ON user_recommendations
  FOR EACH ROW EXECUTE PROCEDURE set_share_token();

-- Grant necessary permissions for anonymous users
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON user_recommendations TO anon;
GRANT INSERT ON user_recommendations TO anon;
GRANT EXECUTE ON FUNCTION increment_shared_recommendation_view(text) TO anon;

-- Grant permissions for authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON user_recommendations TO authenticated;
GRANT INSERT ON user_recommendations TO authenticated;
GRANT UPDATE ON user_recommendations TO authenticated;
GRANT DELETE ON user_recommendations TO authenticated;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify table was created successfully
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_recommendations' 
ORDER BY ordinal_position;

-- Verify policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'user_recommendations';

-- Verify functions were created
SELECT 
  routine_name, 
  routine_type, 
  data_type 
FROM information_schema.routines 
WHERE routine_name IN ('generate_share_token', 'increment_shared_recommendation_view', 'cleanup_expired_shared_recommendations', 'set_share_token');

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
SELECT 'user_recommendations table setup completed successfully!' as status;
