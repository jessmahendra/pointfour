# Enhanced Product Parsing System

## Overview

This system extends the existing product parsing service to automatically create brands and products in the Supabase database when they don't exist. It includes fuzzy brand name matching to handle typos and variations.

## Features

### ✅ Implemented

1. **Fuzzy Brand Matching**: Uses Levenshtein distance algorithm to find similar brand names
2. **Database Integration**: Automatically creates brands and products if they don't exist
3. **Duplicate Prevention**: Checks for existing brands/products before creating new ones
4. **API Endpoints**: RESTful API for testing and integration
5. **Comprehensive Logging**: Detailed console output for debugging

### 🔧 Components

#### 1. Database Service (`src/lib/services/database-service.ts`)
- Handles all database operations for brands and products
- Implements fuzzy matching algorithm
- Uses server-side Supabase client with proper authentication

#### 2. Enhanced Product Parsing Service (`src/lib/services/enhanced-product-parsing-service.ts`)
- Extends the original product parsing service
- Integrates with database service
- Provides comprehensive result tracking

#### 3. API Endpoint (`src/app/api/enhanced-product-parsing/route.ts`)
- POST: Parse and store a product
- GET: Get database summary or test fuzzy matching

#### 4. Test Scripts
- `test-enhanced-parsing.ts`: Direct service testing
- `test-api-enhanced-parsing.ts`: API endpoint testing
- `test-static-parsing.ts`: Read-only operations testing

## Usage

### API Usage

```typescript
// Parse and store a product
const response = await fetch('/api/enhanced-product-parsing', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'Query: "Nike Air Max 270 running shoes"',
    options: {
      fuzzyMatchThreshold: 0.7,
      enableWebSearch: true
    }
  })
});

const result = await response.json();
```

### Direct Service Usage

```typescript
import { enhancedProductParsingService } from './src/lib/services/enhanced-product-parsing-service';

const result = await enhancedProductParsingService.parseAndStoreProduct(
  'Query: "Nike Air Max 270 running shoes"'
);

console.log({
  brandName: result.parsedData.brandName,
  productName: result.parsedData.productName,
  brandId: result.brand.id,
  productId: result.product.id,
  wasBrandCreated: result.wasBrandCreated,
  wasProductCreated: result.wasProductCreated
});
```

## Current Status

### ✅ Working Features
- Product parsing with web search
- Fuzzy brand name matching
- Database read operations
- API endpoints
- Comprehensive logging

### ⚠️ Known Issues

1. **Database Schema Mismatch**: The brands table appears to be missing the `id` field in responses
2. **RLS Policy Restrictions**: Row Level Security policies prevent public inserts
3. **Authentication Context**: Server client requires request context

### 🔧 Required Fixes

#### 1. Fix Database Schema
The brands table needs to have proper primary key fields. Run this SQL:

```sql
-- Check current schema
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'brands' 
ORDER BY ordinal_position;

-- If id field is missing, add it
ALTER TABLE brands ADD COLUMN IF NOT EXISTS id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY;
```

#### 2. Update RLS Policies
For testing purposes, temporarily allow public inserts:

```sql
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
```

#### 3. Alternative: Use Service Role Key
For production, use a service role key instead of public policies:

```typescript
// In database-service.ts
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Add this to .env.local
);
```

## Testing

### Run Tests

```bash
# Test static operations (read-only)
npx tsx --env-file=.env.local test-static-parsing.ts

# Test API endpoints (requires dev server running)
npm run dev
npx tsx test-api-enhanced-parsing.ts
```

### Expected Output

```
🧪 Testing Enhanced Product Parsing Service

=== Test 1: New Brand and Product ===
✅ Created new brand: Nike (ID: 1)
✅ Created new product: Nike Air Max 270 (ID: 1)

=== Test 2: Fuzzy Brand Matching ===
✅ Found fuzzy brand match: Nike (similarity: 0.95)
✅ Found existing product: Nike Air Max 90 (ID: 2)
```

## Configuration

### Environment Variables

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Optional (for service role)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Required for web search
SERPER_API_KEY=your_serper_key
```

### Options

```typescript
interface EnhancedProductParsingOptions {
  fuzzyMatchThreshold?: number; // Default: 0.7
  skipDatabaseOperations?: boolean; // Default: false
  enableWebSearch?: boolean; // Default: true
  temperature?: number; // Default: 0.3
  systemPrompt?: string; // Custom LLM prompt
}
```

## Next Steps

1. **Fix Database Schema**: Ensure brands table has proper ID field
2. **Update RLS Policies**: Allow inserts or use service role key
3. **Test Full Flow**: Verify brand and product creation works
4. **Add Error Handling**: Improve error messages and recovery
5. **Add Validation**: Validate brand/product data before insertion
6. **Performance Optimization**: Add caching and batch operations

## Architecture

```
User Input → Product Parsing Service → Enhanced Parsing Service → Database Service → Supabase
     ↓              ↓                        ↓                      ↓
Web Search → LLM Processing → Fuzzy Matching → Brand/Product Creation
```

The system provides a complete pipeline from user input to database storage with intelligent duplicate detection and fuzzy matching capabilities.
