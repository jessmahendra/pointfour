-- Create the products table
CREATE TABLE products (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name text NOT NULL,
  url text NOT NULL,
  brand_id bigint NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  description text,
  image_url text,
  price numeric(10,2),
  currency text DEFAULT 'USD',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create an index on brand_id for faster queries
CREATE INDEX idx_products_brand_id ON products(brand_id);

-- Create an index on name for search functionality
CREATE INDEX idx_products_name ON products(name);

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create a policy for public read access
CREATE POLICY "Public read access to products"
ON public.products
FOR SELECT
USING (true);

-- Create a policy for authenticated users to insert/update/delete
CREATE POLICY "Authenticated users can manage products"
ON public.products
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Insert some sample data
INSERT INTO products (name, url, brand_id, description, price) VALUES
  ('Air Max 270', 'https://nike.com/air-max-270', 1, 'Comfortable running shoes with Max Air cushioning', 150.00),
  ('Stan Smith', 'https://adidas.com/stan-smith', 2, 'Classic tennis shoes with clean design', 80.00),
  ('Basic T-Shirt', 'https://zara.com/basic-tshirt', 3, 'Essential cotton t-shirt in various colors', 12.95),
  ('Skinny Jeans', 'https://hm.com/skinny-jeans', 4, 'Stretchy skinny jeans in dark wash', 24.99),
  ('Ultra Light Down Jacket', 'https://uniqlo.com/ultra-light-down', 5, 'Packable down jacket for all seasons', 79.90);
