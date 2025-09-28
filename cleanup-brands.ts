#!/usr/bin/env tsx

/**
 * Manual Cleanup Script for Brands Table
 * 
 * This script manually clears all brands from the Supabase table
 * to resolve duplicate key issues during migration.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Configuration
const config = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  }
};

// Validate configuration
function validateConfig() {
  const missing = [];
  
  if (!config.supabase.url) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!config.supabase.anonKey) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(envVar => console.error(`   - ${envVar}`));
    console.error('\nPlease add these to your .env.local file and try again.');
    process.exit(1);
  }
  
  console.log('✅ Configuration validated');
}

// Clear all brands from Supabase
async function clearAllBrands(supabase: ReturnType<typeof createClient>): Promise<void> {
  console.log('🧹 Clearing ALL brands from Supabase...');
  
  try {
    // First, get count of existing brands
    const { count: beforeCount, error: countError } = await supabase
      .from('brands')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      throw countError;
    }
    
    console.log(`📊 Found ${beforeCount} existing brands to clear`);
    
    if (beforeCount === 0) {
      console.log('✅ No existing brands to clear');
      return;
    }
    
    // Show what will be deleted
    const { data: existingBrands, error: fetchError } = await supabase
      .from('brands')
      .select('name, slug')
      .limit(10);
    
    if (fetchError) {
      throw fetchError;
    }
    
    console.log('\n📝 Sample brands that will be deleted:');
    existingBrands?.forEach((brand: { name: string; slug: string }, index: number) => {
      console.log(`   ${index + 1}. ${brand.name} (${brand.slug})`);
    });
    
    if (beforeCount > 10) {
      console.log(`   ... and ${beforeCount - 10} more`);
    }
    
    // Confirm deletion
    console.log('\n⚠️  This will delete ALL brands from your Supabase table!');
    console.log('   Make sure you have a backup if needed.');
    
    // Delete all records
    const { error } = await supabase
      .from('brands')
      .delete()
      .neq('slug', ''); // Delete all records (slug is never empty)
    
    if (error) {
      throw error;
    }
    
    // Verify deletion
    const { count: afterCount, error: verifyError } = await supabase
      .from('brands')
      .select('*', { count: 'exact', head: true });
    
    if (verifyError) {
      throw verifyError;
    }
    
    console.log(`\n✅ Successfully cleared all brands (${beforeCount} → ${afterCount})`);
    console.log('🚀 You can now run the migration: npm run migrate:brands');
    
  } catch (error) {
    console.error('❌ Error clearing brands:', error);
    throw error;
  }
}

// Main cleanup function
async function cleanupBrands(): Promise<void> {
  console.log('🧹 Brand Cleanup Script\n');
  
  try {
    // Validate configuration
    validateConfig();
    
    // Initialize Supabase client
    const supabase = createClient(config.supabase.url, config.supabase.anonKey);
    
    // Clear all brands
    await clearAllBrands(supabase);
    
  } catch (error) {
    console.error('\n💥 Cleanup failed:', error);
    process.exit(1);
  }
}

// Run cleanup if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanupBrands();
}

export { cleanupBrands };
