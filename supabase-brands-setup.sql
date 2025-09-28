-- Create the brands table
CREATE TABLE brands (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name text NOT NULL,
  description text,
  website_url text,
  logo_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Insert some sample data
INSERT INTO brands (name, description, website_url) VALUES
  ('Nike', 'Just Do It - Athletic wear and footwear', 'https://nike.com'),
  ('Adidas', 'Impossible is Nothing - Sports and lifestyle brand', 'https://adidas.com'),
  ('Zara', 'Fast fashion for men, women and children', 'https://zara.com'),
  ('H&M', 'Fashion and quality at the best price', 'https://hm.com'),
  ('Uniqlo', 'LifeWear - Simple made better', 'https://uniqlo.com');

-- Enable Row Level Security
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

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
