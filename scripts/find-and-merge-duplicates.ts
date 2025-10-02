/**
 * Enhanced script to find and merge duplicate products
 * Groups all duplicates together and merges them in one go
 * Run with: npx tsx scripts/find-and-merge-duplicates.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as readline from 'readline';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

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
 * Normalize a URL for comparison (remove protocol, www, query params, trailing slash)
 */
function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '') + urlObj.pathname.replace(/\/$/, '');
  } catch {
    return url.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/$/, '');
  }
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

/**
 * Group products that are duplicates of each other
 */
function groupDuplicates(products: Product[]): Product[][] {
  const groups: Product[][] = [];
  const processed = new Set<number>();

  for (let i = 0; i < products.length; i++) {
    if (processed.has(products[i].id)) continue;

    const group: Product[] = [products[i]];
    processed.add(products[i].id);

    for (let j = i + 1; j < products.length; j++) {
      if (processed.has(products[j].id)) continue;

      const product1 = products[i];
      const product2 = products[j];

      // Check URL match (strong signal)
      const url1 = normalizeUrl(product1.url);
      const url2 = normalizeUrl(product2.url);
      const urlMatch = url1 === url2;

      // Check name similarity
      const normalizedName1 = product1.normalized_name || normalizeProductName(product1.name);
      const normalizedName2 = product2.normalized_name || normalizeProductName(product2.name);
      const nameSimilarity = calculateSimilarity(normalizedName1, normalizedName2);

      // Consider duplicates if:
      // - URLs match exactly, OR
      // - Names are 85%+ similar
      if (urlMatch || nameSimilarity >= 0.85) {
        group.push(product2);
        processed.add(product2.id);
      }
    }

    if (group.length > 1) {
      // Sort by created_at (oldest first)
      group.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      groups.push(group);
    }
  }

  return groups;
}

/**
 * Merge a group of duplicate products
 */
async function mergeDuplicateGroup(group: Product[], autoConfirm: boolean = false): Promise<boolean> {
  const keepProduct = group[0]; // Oldest product
  const deleteProducts = group.slice(1);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📦 DUPLICATE GROUP (${group.length} products)`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  console.log('\n✅ KEEPING (oldest):');
  console.log(`   ID: ${keepProduct.id}`);
  console.log(`   Name: ${keepProduct.name}`);
  console.log(`   URL: ${keepProduct.url}`);
  console.log(`   Created: ${new Date(keepProduct.created_at).toLocaleString()}`);

  console.log('\n❌ DELETING:');
  for (const product of deleteProducts) {
    console.log(`   ID: ${product.id}`);
    console.log(`   Name: ${product.name}`);
    console.log(`   URL: ${product.url}`);
    console.log(`   Created: ${new Date(product.created_at).toLocaleString()}`);
    console.log('');
  }

  if (!autoConfirm) {
    const confirm = await question('Merge this group? (yes/no/skip): ');
    if (confirm.toLowerCase() === 'skip') {
      console.log('⏭️  Skipped');
      return false;
    }
    if (confirm.toLowerCase() !== 'yes') {
      console.log('❌ Cancelled');
      return false;
    }
  }

  try {
    // Update user_recommendations to point to the kept product
    for (const deleteProduct of deleteProducts) {
      const { data: updatedRecs, error: recError } = await supabase
        .from('user_recommendations')
        .update({ product_id: keepProduct.id })
        .eq('product_id', deleteProduct.id)
        .select();

      if (recError) {
        console.error(`❌ Error updating user_recommendations for product ${deleteProduct.id}:`, recError);
        return false;
      }

      console.log(`   Updated ${updatedRecs?.length || 0} user_recommendations from product ${deleteProduct.id}`);
    }

    // Delete the duplicate products
    const deleteIds = deleteProducts.map(p => p.id);
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .in('id', deleteIds);

    if (deleteError) {
      console.error('❌ Error deleting products:', deleteError);
      return false;
    }

    console.log(`✅ Deleted ${deleteProducts.length} duplicate products`);
    console.log(`✅ Kept product ID: ${keepProduct.id}`);
    return true;
  } catch (error) {
    console.error('❌ Error during merge:', error);
    return false;
  }
}

async function main() {
  console.log('🔍 Enhanced Duplicate Product Finder & Merger\n');

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
    rl.close();
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

  let totalGroups = 0;
  let mergedGroups = 0;

  // Process each brand
  for (const [brandId, brandProducts] of productsByBrand) {
    if (brandProducts.length < 2) continue;

    const duplicateGroups = groupDuplicates(brandProducts);

    if (duplicateGroups.length === 0) continue;

    console.log(`\n🏷️  Brand: ${brandId} - Found ${duplicateGroups.length} duplicate group(s)\n`);

    for (const group of duplicateGroups) {
      totalGroups++;
      const success = await mergeDuplicateGroup(group, false);
      if (success) {
        mergedGroups++;
      }
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`\n📊 SUMMARY:`);
  console.log(`   Total duplicate groups found: ${totalGroups}`);
  console.log(`   Groups merged: ${mergedGroups}`);
  console.log(`   Groups skipped: ${totalGroups - mergedGroups}`);

  if (mergedGroups > 0) {
    console.log('\n✅ Deduplication complete!');
    console.log('\n💡 Next steps:');
    console.log('1. Run the duplicate finder again to verify: npx tsx scripts/find-duplicate-products.ts');
    console.log('2. If no duplicates remain, add the unique constraint in Supabase SQL Editor');
  } else {
    console.log('\n✅ No changes made');
  }

  rl.close();
}

main().catch(console.error);
