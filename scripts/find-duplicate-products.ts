/**
 * Script to find duplicate products in the database
 * Run with: npx tsx scripts/find-duplicate-products.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface Product {
  id: number;
  name: string;
  normalized_name: string;
  brand_id: string;
  url: string;
  created_at: string;
}

/**
 * Normalize a product name for comparison
 */
function normalizeProductName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Calculate similarity between two strings
 */
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

async function findDuplicates() {
  console.log('🔍 Finding duplicate products...\n');

  // Fetch all products
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, normalized_name, brand_id, url, created_at')
    .order('brand_id', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    console.error('❌ Error fetching products:', error);
    process.exit(1);
  }

  if (!products || products.length === 0) {
    console.log('✅ No products found in database');
    return;
  }

  console.log(`📊 Total products: ${products.length}\n`);

  // Group products by brand
  const productsByBrand = new Map<string, Product[]>();
  for (const product of products) {
    if (!productsByBrand.has(product.brand_id)) {
      productsByBrand.set(product.brand_id, []);
    }
    productsByBrand.get(product.brand_id)!.push(product);
  }

  let totalDuplicates = 0;
  const duplicateGroups: Array<{
    brand_id: string;
    products: Product[];
    similarity: number;
  }> = [];

  // Check for duplicates within each brand
  for (const [brandId, brandProducts] of productsByBrand) {
    if (brandProducts.length < 2) continue;

    // Compare each product with others in the same brand
    for (let i = 0; i < brandProducts.length; i++) {
      for (let j = i + 1; j < brandProducts.length; j++) {
        const product1 = brandProducts[i];
        const product2 = brandProducts[j];

        const normalizedName1 = product1.normalized_name || normalizeProductName(product1.name);
        const normalizedName2 = product2.normalized_name || normalizeProductName(product2.name);

        const similarity = calculateSimilarity(normalizedName1, normalizedName2);

        // Consider products duplicates if similarity > 85%
        if (similarity >= 0.85) {
          duplicateGroups.push({
            brand_id: brandId,
            products: [product1, product2],
            similarity
          });
          totalDuplicates++;
        }
      }
    }
  }

  if (duplicateGroups.length === 0) {
    console.log('✅ No duplicate products found!');
    return;
  }

  console.log(`⚠️  Found ${duplicateGroups.length} potential duplicate pairs:\n`);

  for (const group of duplicateGroups) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Brand ID: ${group.brand_id}`);
    console.log(`Similarity: ${(group.similarity * 100).toFixed(1)}%\n`);

    for (const product of group.products) {
      console.log(`  Product ID: ${product.id}`);
      console.log(`  Name: ${product.name}`);
      console.log(`  Normalized: ${product.normalized_name || normalizeProductName(product.name)}`);
      console.log(`  URL: ${product.url}`);
      console.log(`  Created: ${new Date(product.created_at).toLocaleDateString()}`);
      console.log('');
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`\n📝 Summary: Found ${duplicateGroups.length} duplicate pairs`);
  console.log('\n💡 Next steps:');
  console.log('1. Review the duplicates above');
  console.log('2. Manually merge duplicates if needed');
  console.log('3. Run the migration to add unique constraint');
  console.log('4. Test the deduplication by analyzing a product twice\n');
}

findDuplicates().catch(console.error);
