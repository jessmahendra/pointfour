-- Create the shared_recommendations table to store recommendations that can be shared with non-users
CREATE TABLE shared_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id bigint NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL, -- Can be null for anonymous shares
  share_token text NOT NULL UNIQUE, -- Unique token for the shareable link
  recommendation_data jsonb NOT NULL, -- The full recommendation result
  user_profile jsonb, -- The user profile data used for the recommendation
  product_query text NOT NULL, -- The original query used (e.g., "Brand Name Product Name")
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone DEFAULT (now() + interval '30 days'), -- Auto-expire after 30 days
  view_count integer DEFAULT 0, -- Track how many times this has been viewed
  last_viewed_at timestamp with time zone
);

-- Create indexes for better performance
CREATE INDEX idx_shared_recommendations_share_token ON shared_recommendations(share_token);
CREATE INDEX idx_shared_recommendations_product_id ON shared_recommendations(product_id);
CREATE INDEX idx_shared_recommendations_user_id ON shared_recommendations(user_id);
CREATE INDEX idx_shared_recommendations_expires_at ON shared_recommendations(expires_at);

-- Enable Row Level Security
ALTER TABLE shared_recommendations ENABLE ROW LEVEL SECURITY;

-- Create a policy for public read access to shared recommendations (anyone with the token can view)
CREATE POLICY "Public read access to shared recommendations"
ON public.shared_recommendations
FOR SELECT
USING (share_token IS NOT NULL AND expires_at > now());

-- Create a policy for authenticated users to create shared recommendations
CREATE POLICY "Authenticated users can create shared recommendations"
ON public.shared_recommendations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Create a policy for users to update their own shared recommendations (for view count tracking)
CREATE POLICY "Users can update own shared recommendations"
ON public.shared_recommendations
FOR UPDATE
USING (auth.uid() = user_id OR user_id IS NULL)
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Create a policy for users to delete their own shared recommendations
CREATE POLICY "Users can delete own shared recommendations"
ON public.shared_recommendations
FOR DELETE
USING (auth.uid() = user_id OR user_id IS NULL);

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
    SELECT EXISTS(SELECT 1 FROM shared_recommendations WHERE share_token = token) INTO exists;
    
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
  UPDATE shared_recommendations 
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
  DELETE FROM shared_recommendations 
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
  BEFORE INSERT ON shared_recommendations
  FOR EACH ROW EXECUTE PROCEDURE set_share_token();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON shared_recommendations TO anon;
GRANT EXECUTE ON FUNCTION increment_shared_recommendation_view(text) TO anon;
