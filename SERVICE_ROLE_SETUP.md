# Service Role Setup for Enhanced Product Parsing

## Step 1: Add Service Role Key to Environment

Add your Supabase service role key to your `.env.local` file:

```bash
# Add this line to your .env.local file
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## Step 2: Get Your Service Role Key

If you don't have your service role key yet:

1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy the "service_role" key (not the "anon" key)
4. Add it to your `.env.local` file

## Step 3: Test the Service Role Implementation

Once you've added the service role key, test it:

```bash
# Test the service role implementation
npx tsx --env-file=.env.local test-service-role-parsing.ts
```

## Step 4: Test via API

Start your development server and test the API:

```bash
# Start the dev server
npm run dev

# In another terminal, test the API
curl -X POST http://localhost:3000/api/enhanced-product-parsing-service-role \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Query: \"Nike Air Max 270 running shoes\"", "options": {}}'
```

## What This Enables

With the service role key, the system can:

✅ **Create new brands** - Bypasses RLS policies
✅ **Create new products** - Full database write access
✅ **Fuzzy matching** - Find similar existing brands
✅ **Duplicate prevention** - Check before creating
✅ **Complete automation** - No manual intervention needed

## Files Created

- `src/lib/services/database-service-service-role.ts` - Database service with service role
- `src/lib/services/enhanced-product-parsing-service-role.ts` - Enhanced parsing with service role
- `src/app/api/enhanced-product-parsing-service-role/route.ts` - API endpoint with service role
- `test-service-role-parsing.ts` - Test script for service role implementation

## Security Note

The service role key has full database access. Keep it secure and never commit it to version control. It's already in your `.gitignore` file.

## Expected Results

Once you add the service role key and run the test, you should see:

```
🧪 Testing Enhanced Product Parsing with Service Role

=== Test 1: New Brand and Product ===
✅ Created new brand: Nike (slug: nike)
✅ Created new product: Nike Air Max 270 (ID: 123)

=== Test 2: Fuzzy Brand Matching ===
✅ Found existing brand: Nike (slug: nike)
✅ Created new product: Nike Air Max 90 (ID: 124)

=== Test 3: Different Brand ===
✅ Created new brand: Adidas (slug: adidas)
✅ Created new product: Adidas Stan Smith (ID: 125)

=== Test 4: Duplicate Product ===
✅ Found existing brand: Nike (slug: nike)
✅ Found existing product: Nike Air Max 270 (ID: 123)
```

The system will automatically handle all the complexity of brand matching, creation, and product management!
