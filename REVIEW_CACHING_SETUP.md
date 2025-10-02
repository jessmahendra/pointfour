# Review Caching System - Setup Guide

This guide explains how to set up and test the review caching system (Phase 2A).

## 🎯 What Was Implemented

1. **Database-backed review caching** (7-day expiry)
2. **On-demand cache population** (saves API costs)
3. **Automatic cache refresh** (via cron job)
4. **Foundation for user reviews** (tables ready but not in use yet)

## 📋 Benefits

- ✅ **Reduced API costs**: Serper API called once per week per product (instead of every view)
- ✅ **Faster recommendations**: Reviews loaded from database cache
- ✅ **Historical data**: All reviews preserved for analysis
- ✅ **Ready for user reviews**: Infrastructure in place for future feature

## 🗄️ Database Tables Created

### **product_reviews**
Stores individual external reviews from Serper
```sql
- product_id → links to products table
- source → platform (reddit, youtube, etc.)
- source_url → direct link to review
- snippet → review text
- search_date → when we found this review
```

### **review_search_cache**
Tracks when we last searched for each product
```sql
- product_id → unique, one cache per product
- search_query → what we searched for
- last_search_at → when we last searched
- next_search_due → when cache expires (7 days)
```

### **user_reviews** (Future use)
Ready for user-generated reviews
```sql
- user_id + product_id → unique
- rating, fit_rating, review_text
- measurements_snapshot → user measurements when reviewed
- is_approved → moderation flag
```

### **user_product_recommendations** (Future use)
Cache personalized recommendations per user
```sql
- user_id + product_id → unique
- recommendation_text → personalized advice
- user_measurements → snapshot of measurements used
- expires_at → when to regenerate (7 days)
```

## 🚀 Setup Steps

### Step 1: Run the Database Migration

**Option A: Via Supabase Dashboard (Recommended)**
1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `supabase/migrations/20250102_add_review_caching_tables.sql`
3. Paste and click **Run**

**Option B: Via Supabase CLI**
```bash
supabase db push
```

### Step 2: Verify Tables Were Created

Run in Supabase SQL Editor:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('product_reviews', 'review_search_cache', 'user_reviews', 'user_product_recommendations');
```

Should return 4 rows.

### Step 3: Test Review Caching

1. **Analyze a product** (e.g., http://localhost:3000/analyze)
2. **Check console logs** - should see:
   ```
   🔄 DATABASE CACHE MISS: Making fresh Serper API calls
   💾 STORED: 10 reviews in database for product 63
   ```

3. **Analyze the SAME product again**
4. **Check console logs** - should see:
   ```
   🎯 DATABASE CACHE HIT: Using 10 cached reviews from database
   ```

5. **Verify in database**:
   ```sql
   SELECT * FROM review_search_cache WHERE product_id = 63;
   SELECT COUNT(*) FROM product_reviews WHERE product_id = 63;
   ```

### Step 4: Set Up Cron Job (Optional but Recommended)

**For Vercel deployment:**

Create `vercel.json` in project root:
```json
{
  "crons": [{
    "path": "/api/cron/refresh-reviews",
    "schedule": "0 0 * * 0"
  }]
}
```

Schedule: Every Sunday at midnight

**Add environment variable:**
```
CRON_SECRET=your_random_secret_here
```

**Test the cron endpoint manually:**
```bash
curl -H "Authorization: Bearer your_random_secret_here" \
  http://localhost:3000/api/cron/refresh-reviews
```

## 🧪 Testing the System

### Test 1: Cache Population

```bash
# 1. Clear existing cache (if any)
DELETE FROM product_reviews WHERE product_id = 63;
DELETE FROM review_search_cache WHERE product_id = 63;

# 2. Analyze product via app
# 3. Check if reviews were cached
SELECT * FROM product_reviews WHERE product_id = 63;
SELECT * FROM review_search_cache WHERE product_id = 63;
```

### Test 2: Cache Hit

```bash
# 1. Analyze same product twice
# 2. Second time should use cache
# 3. Check console logs for "DATABASE CACHE HIT"
```

### Test 3: Cache Expiry

```sql
# Force cache expiry for testing
UPDATE review_search_cache
SET next_search_due = NOW() - INTERVAL '1 day'
WHERE product_id = 63;

# Analyze product again
# Should trigger fresh Serper search
```

### Test 4: Cron Job

```bash
# Force some caches to be stale
UPDATE review_search_cache
SET next_search_due = NOW() - INTERVAL '1 day';

# Trigger cron job
curl http://localhost:3000/api/cron/refresh-reviews

# Check response:
{
  "message": "Review cache refresh complete",
  "productsRefreshed": 3,
  "errors": 0,
  "totalProducts": 3
}
```

## 📊 How It Works

### First Visit (Cache Miss)
```
User analyzes "Khaite Danielle Jean" (product_id: 63)
        ↓
Check review_search_cache for product_id 63
        ↓
NOT FOUND → Call Serper API
        ↓
Store 10 reviews in product_reviews table
Store cache metadata in review_search_cache (expires in 7 days)
        ↓
Pass reviews to LLM → Generate recommendation
```

### Second Visit (Cache Hit)
```
User analyzes "Khaite Danielle Jean" (product_id: 63)
        ↓
Check review_search_cache for product_id 63
        ↓
FOUND & FRESH (< 7 days old)
        ↓
Load 10 reviews from product_reviews table
        ↓
Pass cached reviews to LLM → Generate recommendation
        ↓
No Serper API call! 💰
```

### After 7 Days (Cache Expired)
```
Cron job runs weekly
        ↓
Find products with next_search_due < NOW()
        ↓
For each product:
  - Call Serper API
  - Update product_reviews
  - Update review_search_cache (new 7-day expiry)
```

## 🔍 Monitoring

### Check Cache Stats

```sql
-- How many products have cached reviews?
SELECT COUNT(*) FROM review_search_cache;

-- How many total reviews cached?
SELECT COUNT(*) FROM product_reviews;

-- Which products have stale caches?
SELECT p.id, p.name, rsc.next_search_due
FROM products p
JOIN review_search_cache rsc ON p.id = rsc.product_id
WHERE rsc.next_search_due < NOW();

-- Average reviews per product
SELECT AVG(review_count) FROM (
  SELECT product_id, COUNT(*) as review_count
  FROM product_reviews
  GROUP BY product_id
) AS counts;
```

### Check Cache Freshness

```sql
SELECT
  p.id,
  p.name,
  rsc.last_search_at,
  rsc.next_search_due,
  CASE
    WHEN rsc.next_search_due > NOW() THEN 'FRESH'
    ELSE 'STALE'
  END as status
FROM products p
LEFT JOIN review_search_cache rsc ON p.id = rsc.product_id
ORDER BY rsc.last_search_at DESC NULLS LAST;
```

## 🐛 Troubleshooting

### Issue: No reviews being cached

**Check:**
1. Is `productId` being passed to the recommendations API?
2. Check console logs for "STORED: X reviews in database"
3. Verify Supabase connection works

**Debug SQL:**
```sql
SELECT * FROM review_search_cache ORDER BY created_at DESC LIMIT 5;
```

### Issue: Always getting cache miss

**Check:**
1. Is the cache expired? Check `next_search_due`
2. Is the product_id correct?

**Debug:**
```sql
SELECT
  product_id,
  last_search_at,
  next_search_due,
  next_search_due > NOW() as is_fresh
FROM review_search_cache
WHERE product_id = 63;
```

### Issue: Cron job not working

**Check:**
1. Is `CRON_SECRET` set in environment variables?
2. Is the authorization header correct?
3. Check Vercel logs for cron execution

**Manual test:**
```bash
curl -v -H "Authorization: Bearer YOUR_SECRET" \
  https://your-domain.vercel.app/api/cron/refresh-reviews
```

## ✅ Success Criteria

You'll know caching is working when:

1. ✅ First product analysis shows "DATABASE CACHE MISS" → "STORED: X reviews"
2. ✅ Second analysis of same product shows "DATABASE CACHE HIT"
3. ✅ Database has rows in `review_search_cache` and `product_reviews`
4. ✅ Cron job successfully refreshes stale caches
5. ✅ Serper API calls reduced by ~85% (once per week instead of every view)

## 📈 Next Steps

After caching is working:
- **Phase 2B**: Add user review upload UI
- **Phase 2C**: Implement personalized recommendation caching
- **Phase 2D**: Add "Follow users with similar measurements" feature

## 📝 Files Created/Modified

**New Files:**
- `supabase/migrations/20250102_add_review_caching_tables.sql`
- `src/lib/services/review-cache-service.ts`
- `src/app/api/cron/refresh-reviews/route.ts`

**Modified Files:**
- `src/app/api/recommendations/route.ts` (integrated cache checking and storage)
