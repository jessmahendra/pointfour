-- Create the brands table
CREATE TABLE IF NOT EXISTS brands (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  url text,
  logo_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Clear any existing data (including fake data)
DELETE FROM brands;

-- Enable Row Level Security
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read access to brands" ON public.brands;
DROP POLICY IF EXISTS "Authenticated users can manage brands" ON public.brands;

-- Create a policy for public read access
CREATE POLICY "Public read access to brands"
ON public.brands
FOR SELECT
USING (true);

-- Create a policy for authenticated users to insert/update/delete
CREATE POLICY "Authenticated users can manage brands"
ON public.brands
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Verify the table was created
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'brands' 
ORDER BY ordinal_position;
