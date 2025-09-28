-- Temporarily allow public inserts for brands and products for testing
-- This should be reverted in production

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can manage brands" ON public.brands;
DROP POLICY IF EXISTS "Authenticated users can manage products" ON public.products;

-- Create new policies that allow public inserts
CREATE POLICY "Public can manage brands"
ON public.brands
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Public can manage products"
ON public.products
FOR ALL
USING (true)
WITH CHECK (true);

-- Verify the policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('brands', 'products')
ORDER BY tablename, policyname;
