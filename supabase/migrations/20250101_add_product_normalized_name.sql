-- Add normalized_name column to products table for better duplicate detection
-- This column will store a normalized version of the product name (lowercase, no special chars)

-- Step 1: Add the column as nullable first
ALTER TABLE products
ADD COLUMN IF NOT EXISTS normalized_name TEXT;

-- Step 2: Create a function to normalize product names
CREATE OR REPLACE FUNCTION normalize_product_name(name TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(name, '[^a-zA-Z0-9\s]', '', 'g'),  -- Remove special characters
      '\s+', ' ', 'g'  -- Replace multiple spaces with single space
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 3: Backfill existing products with normalized names
UPDATE products
SET normalized_name = normalize_product_name(name)
WHERE normalized_name IS NULL;

-- Step 4: Make the column NOT NULL now that it's populated
ALTER TABLE products
ALTER COLUMN normalized_name SET NOT NULL;

-- Step 5: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_products_normalized_name
ON products(brand_id, normalized_name);

-- Step 6: Add unique constraint to prevent duplicates
-- Note: This will fail if duplicates exist - we need to clean them first
-- Uncomment after cleaning duplicates:
-- ALTER TABLE products
-- ADD CONSTRAINT unique_brand_product_normalized
-- UNIQUE (brand_id, normalized_name);

-- Step 7: Create trigger to auto-update normalized_name on INSERT/UPDATE
CREATE OR REPLACE FUNCTION update_product_normalized_name()
RETURNS TRIGGER AS $$
BEGIN
  NEW.normalized_name := normalize_product_name(NEW.name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_product_normalized_name
BEFORE INSERT OR UPDATE OF name ON products
FOR EACH ROW
EXECUTE FUNCTION update_product_normalized_name();

COMMENT ON COLUMN products.normalized_name IS 'Auto-generated normalized product name for duplicate detection';
