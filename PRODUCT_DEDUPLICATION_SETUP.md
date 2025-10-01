# Product Deduplication Setup Guide

This guide will help you set up and test the product deduplication system.

## 🎯 What Was Implemented

1. **Fuzzy product matching** - Products with similar names (e.g., "Khaite Danielle Jean" vs "Khaite Danielle Jeans") are now recognized as the same product
2. **Normalized name column** - Auto-generated column for fast duplicate detection
3. **Database constraint** - Prevents creating duplicate products at the database level
4. **Duplicate detection scripts** - Tools to find and merge existing duplicates

## 📋 Setup Steps

### Step 1: Run the Database Migration

The migration adds a `normalized_name` column to the products table and sets up automatic normalization.

**Option A: Via Supabase Dashboard (Recommended)**

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase/migrations/20250101_add_product_normalized_name.sql`
4. Paste into the SQL Editor
5. Click **Run**

**Option B: Via Supabase CLI**

```bash
# If you have Supabase CLI installed
supabase db push
```

### Step 2: Check for Existing Duplicates

Run the duplicate detection script:

```bash
npx tsx scripts/find-duplicate-products.ts
```

**Expected Output:**

If no duplicates exist:
```
✅ No duplicate products found!
```

If duplicates are found:
```
⚠️  Found X potential duplicate pairs:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Brand ID: khaite
Similarity: 95.0%

  Product ID: 123
  Name: Khaite Danielle Jean
  Normalized: khaite danielle jean
  URL: https://...
  Created: 1/1/2025

  Product ID: 456
  Name: Khaite Danielle Jeans
  Normalized: khaite danielle jeans
  URL: https://...
  Created: 1/2/2025
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Step 3: Merge Duplicates (If Found)

If you found duplicates in Step 2, merge them:

```bash
npx tsx scripts/merge-duplicate-products.ts
```

The script will:
1. Ask you for the product IDs to keep and delete
2. Show you the details of both products
3. Ask for confirmation
4. Update all references to point to the kept product
5. Delete the duplicate

**Example:**
```bash
Enter the product ID to KEEP: 123
Enter the product ID to DELETE: 456

PRODUCT TO KEEP:
  ID: 123
  Name: Khaite Danielle Jean
  ...

PRODUCT TO DELETE:
  ID: 456
  Name: Khaite Danielle Jeans
  ...

Are you sure you want to proceed? (yes/no): yes

✅ Updated 2 user_recommendations
✅ Deleted product ID 456
✅ Products merged successfully!
```

### Step 4: Enable Unique Constraint

After all duplicates are merged, enable the unique constraint:

1. Go to Supabase SQL Editor
2. Run this SQL:

```sql
ALTER TABLE products
ADD CONSTRAINT unique_brand_product_normalized
UNIQUE (brand_id, normalized_name);
```

This prevents future duplicates from being created.

## 🧪 Testing the Deduplication

### Test 1: Same Product, Different Name Variations

1. Go to your app's analyze page (e.g., `http://localhost:3000/analyze`)
2. Paste a product URL for "Khaite Danielle Jean"
3. Click "Get Recommendations"
4. Note the product ID in the URL (e.g., `/products/123`)
5. Go back and analyze again with slightly different text:
   - "Khaite Danielle Jeans" (with 's')
   - "khaite danielle jean" (lowercase)
   - "Khaite Danielle Jean!" (with punctuation)
6. **Expected Result**: You should be redirected to the SAME product ID each time

### Test 2: Check Console Logs

When analyzing a product that already exists, you should see console logs like:

```
✅ Found exact product match: Khaite Danielle Jean (ID: 123)
```

or

```
✅ Found fuzzy product match: Khaite Danielle Jean (ID: 123, similarity: 95.0%)
```

### Test 3: Verify No Duplicates in Database

After testing, run the duplicate checker again:

```bash
npx tsx scripts/find-duplicate-products.ts
```

**Expected Result**: `✅ No duplicate products found!`

## 📊 How It Works

### Normalization Process

When a product name is entered:
1. Convert to lowercase: `"Khaite Danielle Jean"` → `"khaite danielle jean"`
2. Remove special characters: `"jean!"` → `"jean"`
3. Normalize spaces: `"danielle  jean"` → `"danielle jean"`
4. Result: `"khaite danielle jean"`

### Matching Algorithm

1. **Fast Path** - Check for exact normalized match in database (instant)
2. **Fuzzy Path** - If no exact match, compare with all products from same brand using Levenshtein distance
3. **Threshold** - Products with 85%+ similarity are considered matches

### Examples of Matches

| Product 1 | Product 2 | Similarity | Match? |
|-----------|-----------|------------|--------|
| Khaite Danielle Jean | Khaite Danielle Jeans | 95% | ✅ Yes |
| Frame Le Slim Palazzo | Frame Le Slim Palazzo Jean | 88% | ✅ Yes |
| Khaite Danielle | Khaite Isabella | 45% | ❌ No |

## 🐛 Troubleshooting

### Issue: Migration fails with "column already exists"

This means the migration was already run. Check if `normalized_name` column exists:

```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'products';
```

### Issue: Unique constraint fails with "duplicate key value"

This means duplicates still exist in the database. Run the duplicate detection script again and merge them.

### Issue: Script shows "Missing Supabase credentials"

Make sure your `.env.local` file has:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## ✅ Success Criteria

You'll know deduplication is working when:

1. ✅ Migration runs successfully
2. ✅ Duplicate detection script finds no duplicates
3. ✅ Unique constraint is enabled
4. ✅ Analyzing the same product twice returns the same product ID
5. ✅ Console logs show "Found exact/fuzzy product match" messages

## 🚀 Next Steps

After deduplication is working:
- **Phase 2**: Implement review caching system
- **Phase 3**: Add cron job for weekly review refresh
- **Phase 4**: Add user review infrastructure

## 📝 Files Changed

- `supabase/migrations/20250101_add_product_normalized_name.sql` - Database migration
- `src/lib/services/database-service.ts` - Added fuzzy product matching
- `scripts/find-duplicate-products.ts` - Duplicate detection tool
- `scripts/merge-duplicate-products.ts` - Duplicate merging tool
