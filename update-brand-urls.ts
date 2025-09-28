#!/usr/bin/env tsx

/**
 * Brand URL Update Script
 * 
 * This script fetches official website URLs for each brand and updates
 * the url column in your Supabase brands table.
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

// Curated brand URLs based on research
const brandUrls: Record<string, string> = {
  'zara': 'https://www.zara.com',
  'posse': 'https://www.posse.com.au',
  'abercrombie-fitch': 'https://www.abercrombie.com',
  'reformation': 'https://www.thereformation.com',
  'toteme': 'https://www.toteme.com',
  'khaite': 'https://www.khaite.com',
  'amina-muaddi': 'https://www.aminamuaddi.com',
  'levis': 'https://www.levi.com',
  'dissh': 'https://www.dissh.com.au',
  'le-monde-beryl': 'https://www.lemondeberyl.com',
  'cos': 'https://www.cos.com',
  'everlane': 'https://www.everlane.com',
  'ganni': 'https://www.ganni.com',
  'mango': 'https://www.mango.com',
  'hm': 'https://www.hm.com',
  'nike': 'https://www.nike.com',
  'adidas': 'https://www.adidas.com',
  'uniqlo': 'https://www.uniqlo.com',
  'zimmermann': 'https://www.zimmermann.com',
  'staud': 'https://www.staud.clothing',
  'rouje': 'https://www.rouje.com',
  'realisation-par': 'https://www.realisationpar.com',
  'faithfull-the-brand': 'https://www.faithfullthebrand.com',
  'with-jean': 'https://www.withjean.com',
  'revolve': 'https://www.revolve.com',
  'shopbop': 'https://www.shopbop.com',
  'net-a-porter': 'https://www.net-a-porter.com',
  'mytheresa': 'https://www.mytheresa.com',
  'farfetch': 'https://www.farfetch.com',
  'ssense': 'https://www.ssense.com',
  'matchesfashion': 'https://www.matchesfashion.com',
  'luisaviaroma': 'https://www.luisaviaroma.com',
  'moda-operandi': 'https://www.modaoperandi.com',
  'the-outnet': 'https://www.theoutnet.com',
  'yoox': 'https://www.yoox.com',
  'vestiaire-collective': 'https://www.vestiairecollective.com',
  'the-realreal': 'https://www.therealreal.com',
  'depop': 'https://www.depop.com'
};

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

// Generate URL for unknown brands
function generateBrandUrl(brandName: string): string {
  // Common patterns for brand URLs
  const patterns = [
    `https://www.${brandName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
    `https://www.${brandName.toLowerCase().replace(/[^a-z0-9]/g, '')}.co.uk`,
    `https://www.${brandName.toLowerCase().replace(/[^a-z0-9]/g, '')}.au`,
    `https://${brandName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
    `https://www.${brandName.toLowerCase().replace(/[^a-z0-9]/g, '')}.fashion`
  ];
  
  // Return the most likely URL pattern
  return patterns[0];
}

// Get URL for a brand
function getBrandUrl(brandName: string, slug: string): string {
  // First try to find by slug
  if (brandUrls[slug]) {
    return brandUrls[slug];
  }
  
  // Then try to find by name (case insensitive)
  const lowerName = brandName.toLowerCase();
  for (const [key, url] of Object.entries(brandUrls)) {
    if (key.includes(lowerName) || lowerName.includes(key)) {
      return url;
    }
  }
  
  // Generate URL based on brand name
  return generateBrandUrl(brandName);
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


// Generate SQL update statements
function generateUrlUpdateSQL(brands: Array<{slug: string, name: string}>): string {
  let sql = '-- Brand URL Updates\n';
  sql += '-- Run these statements in your Supabase SQL Editor\n\n';
  
  for (const brand of brands) {
    const url = getBrandUrl(brand.name, brand.slug);
    sql += `UPDATE brands SET url = '${url}' WHERE slug = '${brand.slug}';\n`;
  }
  
  return sql;
}

// Main function to update all brand URLs
async function updateAllBrandUrls(): Promise<void> {
  console.log('🚀 Starting brand URL update...\n');
  
  try {
    // Validate configuration
    validateConfig();
    
    // Initialize Supabase client
    const supabase = initializeSupabase();
    
    // Get all brands
    const brands = await getAllBrands(supabase);
    
    if (brands.length === 0) {
      console.log('⚠️ No brands found in Supabase');
      return;
    }
    
    // Show current state
    const brandsWithUrls = brands.filter(brand => 
      brand.url && brand.url.trim() !== ''
    );
    const brandsNeedingUrls = brands.filter(brand => 
      !brand.url || brand.url.trim() === ''
    );
    
    console.log(`📊 Current state:`);
    console.log(`   - Brands with URLs: ${brandsWithUrls.length}`);
    console.log(`   - Brands needing URLs: ${brandsNeedingUrls.length}`);
    
    if (brandsNeedingUrls.length === 0) {
      console.log('✅ All brands already have URLs');
      return;
    }
    
    // Generate SQL for manual execution
    const sql = generateUrlUpdateSQL(brandsNeedingUrls);
    
    // Save to file
    const fs = await import('fs');
    fs.writeFileSync('brand-url-updates.sql', sql);
    
    console.log('\n📝 Generated SQL update statements:');
    console.log('   - Saved to: brand-url-updates.sql');
    console.log('   - Copy and paste the SQL into your Supabase SQL Editor');
    
    // Show preview
    console.log('\n📋 Preview of URL updates:');
    brandsNeedingUrls.slice(0, 10).forEach(brand => {
      const url = getBrandUrl(brand.name, brand.slug);
      console.log(`   ${brand.name}: ${url}`);
    });
    
    if (brandsNeedingUrls.length > 10) {
      console.log(`   ... and ${brandsNeedingUrls.length - 10} more`);
    }
    
    console.log('\n💡 Note: These URLs are generated based on common patterns.');
    console.log('   Please verify the URLs before running the SQL updates.');
    
  } catch (error) {
    console.error('\n💥 Update failed:', error);
    process.exit(1);
  }
}

// Run update if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  updateAllBrandUrls();
}

export { updateAllBrandUrls };
