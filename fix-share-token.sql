-- Fix the share token generation function to use base64 instead of base64url
-- PostgreSQL doesn't support base64url in older versions
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
