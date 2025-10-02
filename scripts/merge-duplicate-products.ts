/**
 * Script to merge duplicate products
 * This will keep the oldest product and update references
 * Run with: npx tsx scripts/merge-duplicate-products.ts
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

async function mergeDuplicates(keepProductId: number, deleteProductId: number) {
  console.log(`\n🔄 Merging products: keeping ID ${keepProductId}, deleting ID ${deleteProductId}`);

  try {
    // Update user_recommendations to point to the kept product
    const { data: updatedRecs, error: recError } = await supabase
      .from('user_recommendations')
      .update({ product_id: keepProductId })
      .eq('product_id', deleteProductId)
      .select();

    if (recError) {
      console.error('❌ Error updating user_recommendations:', recError);
      return false;
    }

    console.log(`✅ Updated ${updatedRecs?.length || 0} user_recommendations`);

    // Delete the duplicate product
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', deleteProductId);

    if (deleteError) {
      console.error('❌ Error deleting product:', deleteError);
      return false;
    }

    console.log(`✅ Deleted product ID ${deleteProductId}`);
    return true;
  } catch (error) {
    console.error('❌ Error during merge:', error);
    return false;
  }
}

async function interactiveMerge() {
  console.log('🔧 Interactive Duplicate Product Merger\n');
  console.log('This script will help you merge duplicate products.');
  console.log('It will keep the oldest product and delete the duplicate.\n');

  const keepIdStr = await question('Enter the product ID to KEEP: ');
  const deleteIdStr = await question('Enter the product ID to DELETE: ');

  const keepId = parseInt(keepIdStr);
  const deleteId = parseInt(deleteIdStr);

  if (isNaN(keepId) || isNaN(deleteId)) {
    console.error('❌ Invalid product IDs');
    rl.close();
    return;
  }

  if (keepId === deleteId) {
    console.error('❌ Product IDs must be different');
    rl.close();
    return;
  }

  // Fetch both products to confirm
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .in('id', [keepId, deleteId]);

  if (error || !products || products.length !== 2) {
    console.error('❌ Could not find both products');
    rl.close();
    return;
  }

  const keepProduct = products.find(p => p.id === keepId);
  const deleteProduct = products.find(p => p.id === deleteId);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('PRODUCT TO KEEP:');
  console.log(`  ID: ${keepProduct!.id}`);
  console.log(`  Name: ${keepProduct!.name}`);
  console.log(`  URL: ${keepProduct!.url}`);
  console.log(`  Created: ${new Date(keepProduct!.created_at).toLocaleString()}`);
  console.log('\nPRODUCT TO DELETE:');
  console.log(`  ID: ${deleteProduct!.id}`);
  console.log(`  Name: ${deleteProduct!.name}`);
  console.log(`  URL: ${deleteProduct!.url}`);
  console.log(`  Created: ${new Date(deleteProduct!.created_at).toLocaleString()}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const confirm = await question('Are you sure you want to proceed? (yes/no): ');

  if (confirm.toLowerCase() !== 'yes') {
    console.log('❌ Merge cancelled');
    rl.close();
    return;
  }

  const success = await mergeDuplicates(keepId, deleteId);

  if (success) {
    console.log('\n✅ Products merged successfully!');
  } else {
    console.log('\n❌ Merge failed - check errors above');
  }

  rl.close();
}

interactiveMerge().catch(console.error);
