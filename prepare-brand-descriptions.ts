#!/usr/bin/env tsx

/**
 * Brand Description Update Script with Real Web Search
 * 
 * This script fetches brand descriptions from web search and updates
 * the description column in your Supabase brands table.
 * 
 * Note: This script requires manual execution as it uses web search
 * that needs to be run through the AI assistant.
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

// Types
interface Brand {
  slug: string;
  name: string;
  description: string | null;
  url: string | null;
}

// Validate configuration
function validateConfig(): void {
  const missing: string[] = [];
  
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

// Initialize Supabase client
function initializeSupabase() {
  return createClient(config.supabase.url!, config.supabase.anonKey!);
}

// Get all brands from Supabase
async function getAllBrands(supabase: any): Promise<Brand[]> {
  console.log('📊 Fetching brands from Supabase...');
  
  try {
    const { data: brands, error } = await supabase
      .from('brands')
      .select('slug, name, description, url')
      .order('name');
    
    if (error) {
      throw error;
    }
    
    console.log(`📦 Found ${brands?.length || 0} brands`);
    return brands || [];
  } catch (error) {
    console.error('❌ Error fetching brands:', error);
    throw error;
  }
}

// Update brand description in Supabase
async function updateBrandDescription(
  supabase: any, 
  slug: string, 
  description: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('brands')
      .update({ description })
      .eq('slug', slug);
    
    if (error) {
      throw error;
    }
    
    console.log(`✅ Updated description for slug: ${slug}`);
  } catch (error) {
    console.error(`❌ Error updating description for ${slug}:`, error);
    throw error;
  }
}

// Generate SQL update statements for manual execution
function generateUpdateSQL(brands: Brand[], descriptions: Record<string, string>): string {
  let sql = '-- Brand Description Updates\n';
  sql += '-- Run these statements in your Supabase SQL Editor\n\n';
  
  for (const brand of brands) {
    if (descriptions[brand.slug]) {
      const escapedDescription = descriptions[brand.slug].replace(/'/g, "''");
      sql += `UPDATE brands SET description = '${escapedDescription}' WHERE slug = '${brand.slug}';\n`;
    }
  }
  
  return sql;
}

// Main function to prepare brand descriptions
async function prepareBrandDescriptions(): Promise<Brand[]> {
  console.log('🚀 Preparing brand descriptions for update...\n');
  
  try {
    // Validate configuration
    validateConfig();
    
    // Initialize Supabase client
    const supabase = initializeSupabase();
    
    // Get all brands
    const brands = await getAllBrands(supabase);
    
    if (brands.length === 0) {
      console.log('⚠️ No brands found in Supabase');
      return [];
    }
    
    // Show current state
    const brandsWithDescriptions = brands.filter(brand => 
      brand.description && brand.description.trim() !== ''
    );
    const brandsNeedingDescriptions = brands.filter(brand => 
      !brand.description || brand.description.trim() === ''
    );
    
    console.log(`📊 Current state:`);
    console.log(`   - Brands with descriptions: ${brandsWithDescriptions.length}`);
    console.log(`   - Brands needing descriptions: ${brandsNeedingDescriptions.length}`);
    
    if (brandsNeedingDescriptions.length === 0) {
      console.log('✅ All brands already have descriptions');
      return [];
    }
    
    // Show brands that need descriptions
    console.log('\n📝 Brands needing descriptions:');
    brandsNeedingDescriptions.forEach((brand, index) => {
      console.log(`   ${index + 1}. ${brand.name} (${brand.slug})`);
    });
    
    console.log('\n🔍 Next steps:');
    console.log('1. I will search for descriptions for each brand');
    console.log('2. Generate SQL update statements');
    console.log('3. You can run the SQL in your Supabase SQL Editor');
    
    return brandsNeedingDescriptions;
    
  } catch (error) {
    console.error('\n💥 Preparation failed:', error);
    process.exit(1);
  }
}

// Run preparation if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  prepareBrandDescriptions();
}

export { prepareBrandDescriptions, updateBrandDescription, generateUpdateSQL };
