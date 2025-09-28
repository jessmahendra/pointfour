#!/usr/bin/env node

/**
 * Brand Migration Script: Airtable → Supabase
 * 
 * This script migrates brand data from Airtable to Supabase, replacing any existing fake data.
 * 
 * Prerequisites:
 * 1. Set up environment variables in .env.local:
 *    - AIRTABLE_API_KEY=your_airtable_api_key
 *    - AIRTABLE_BASE_ID=your_airtable_base_id
 *    - AIRTABLE_BRANDS_TABLE=Brands (or your table name)
 *    - NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
 *    - NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
 * 
 * 2. Install dependencies:
 *    npm install airtable @supabase/supabase-js dotenv
 * 
 * Usage:
 *    node migrate-brands.js
 */

import Airtable from 'airtable';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Configuration
const config = {
  airtable: {
    apiKey: process.env.AIRTABLE_API_KEY,
    baseId: process.env.AIRTABLE_BASE_ID,
    brandsTable: process.env.AIRTABLE_BRANDS_TABLE || 'Brands'
  },
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  }
};

// Validate configuration
function validateConfig() {
  const missing = [];
  
  if (!config.airtable.apiKey) missing.push('AIRTABLE_API_KEY');
  if (!config.airtable.baseId) missing.push('AIRTABLE_BASE_ID');
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

// Initialize clients
function initializeClients() {
  const airtable = new Airtable({
    apiKey: config.airtable.apiKey,
  }).base(config.airtable.baseId);
  
  const supabase = createClient(config.supabase.url, config.supabase.anonKey);
  
  return { airtable, supabase };
}

// Helper function for safe field access (copied from airtable.ts)
function safeGet(record, fieldName) {
  try {
    const fields = record.fields;
    if (!fields) return '';
    
    // Try exact match first
    if (fields[fieldName] !== undefined) {
      return String(fields[fieldName] || '');
    }
    
    // Try case-insensitive match
    const fieldKeys = Object.keys(fields);
    const matchingKey = fieldKeys.find(key => 
      key.toLowerCase() === fieldName.toLowerCase()
    );
    
    if (matchingKey) {
      return String(fields[matchingKey] || '');
    }
    
    return '';
  } catch {
    return '';
  }
}

// Generate URL-friendly slug from brand name
function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim();
}

// Clear existing brands from Supabase
async function clearExistingBrands(supabase) {
  console.log('🧹 Clearing existing brands from Supabase...');
  
  try {
    // Delete all records using slug (since slug is the primary key)
    const { error } = await supabase
      .from('brands')
      .delete()
      .neq('slug', ''); // Delete all records (slug is never empty)
    
    if (error) {
      throw error;
    }
    
    console.log('✅ Existing brands cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing existing brands:', error.message);
    throw error;
  }
}

// Fetch brands from Airtable
async function fetchBrandsFromAirtable(airtable) {
  console.log('📊 Fetching brands from Airtable...');
  
  try {
    const records = await airtable(config.airtable.brandsTable)
      .select({
        maxRecords: 1000 // Adjust as needed
      })
      .all();

    console.log(`📦 Retrieved ${records.length} brand records from Airtable`);
    
    // Log available fields from first record for debugging
    if (records.length > 0) {
      console.log('📋 Available fields in first record:', Object.keys(records[0].fields));
    }

    return records;
  } catch (error) {
    console.error('❌ Error fetching brands from Airtable:', error.message);
    throw error;
  }
}

// Transform Airtable brand to Supabase format
function transformBrand(airtableRecord) {
  const fields = airtableRecord.fields;
  
  // Extract brand name with fallbacks
  const name = safeGet(airtableRecord, 'Brand Name') || 
               safeGet(airtableRecord, 'brand name') || 
               safeGet(airtableRecord, 'Name') || 
               safeGet(airtableRecord, 'name') || 
               '';
  
  if (!name) {
    console.warn(`⚠️ Skipping record ${airtableRecord.id} - no brand name found`);
    return null;
  }
  
  // Generate slug
  const slug = generateSlug(name);
  
  // Extract description with fallbacks
  const description = safeGet(airtableRecord, 'Brand Details Header') || 
                     safeGet(airtableRecord, 'Description') || 
                     safeGet(airtableRecord, 'description') || 
                     '';
  
  // Extract URL with fallbacks
  const url = safeGet(airtableRecord, 'UK Retailer') || 
              safeGet(airtableRecord, 'Website') || 
              safeGet(airtableRecord, 'website') || 
              '';
  
  // Extract logo URL
  const logoUrl = safeGet(airtableRecord, 'logo') || 
                  safeGet(airtableRecord, 'Logo') || 
                  '';
  
  return {
    slug,
    name,
    description: description || null,
    url: url || null,
    logo_url: logoUrl || null
  };
}

// Insert brands into Supabase
async function insertBrandsToSupabase(supabase, brands) {
  console.log(`📥 Inserting ${brands.length} brands into Supabase...`);
  
  try {
    // Insert in batches to avoid hitting limits
    const batchSize = 100;
    let inserted = 0;
    
    for (let i = 0; i < brands.length; i += batchSize) {
      const batch = brands.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('brands')
        .insert(batch)
        .select();
      
      if (error) {
        throw error;
      }
      
      inserted += data.length;
      console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1}: ${data.length} brands`);
    }
    
    console.log(`🎉 Successfully inserted ${inserted} brands into Supabase`);
    return inserted;
  } catch (error) {
    console.error('❌ Error inserting brands into Supabase:', error.message);
    throw error;
  }
}

// Main migration function
async function migrateBrands() {
  console.log('🚀 Starting brand migration from Airtable to Supabase...\n');
  
  try {
    // Validate configuration
    validateConfig();
    
    // Initialize clients
    const { airtable, supabase } = initializeClients();
    
    // Clear existing brands
    await clearExistingBrands(supabase);
    
    // Fetch brands from Airtable
    const airtableRecords = await fetchBrandsFromAirtable(airtable);
    
    if (airtableRecords.length === 0) {
      console.log('⚠️ No brands found in Airtable. Migration complete.');
      return;
    }
    
    // Transform brands
    console.log('🔄 Transforming brands...');
    const transformedBrands = airtableRecords
      .map(transformBrand)
      .filter(brand => brand !== null); // Remove null entries
    
    console.log(`📊 Transformed ${transformedBrands.length} valid brands`);
    
    // Deduplicate brands by slug (keep the first occurrence)
    const uniqueBrands = transformedBrands.reduce((acc, brand) => {
      if (!acc.find(b => b.slug === brand.slug)) {
        acc.push(brand);
      } else {
        console.log(`⚠️ Skipping duplicate slug: ${brand.slug} (${brand.name})`);
      }
      return acc;
    }, []);
    
    console.log(`📊 After deduplication: ${uniqueBrands.length} unique brands`);
    
    if (uniqueBrands.length === 0) {
      console.log('⚠️ No valid brands to migrate. Check your Airtable data.');
      return;
    }
    
    // Insert into Supabase
    const insertedCount = await insertBrandsToSupabase(supabase, uniqueBrands);
    
    // Summary
    console.log('\n📊 Migration Summary:');
    console.log(`   - Airtable records fetched: ${airtableRecords.length}`);
    console.log(`   - Valid brands transformed: ${transformedBrands.length}`);
    console.log(`   - Unique brands after deduplication: ${uniqueBrands.length}`);
    console.log(`   - Brands inserted to Supabase: ${insertedCount}`);
    
    if (insertedCount === uniqueBrands.length) {
      console.log('\n🎉 Migration completed successfully!');
    } else {
      console.log('\n⚠️ Migration completed with some issues. Check the logs above.');
    }
    
  } catch (error) {
    console.error('\n💥 Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run migration if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateBrands();
}

export { migrateBrands };
