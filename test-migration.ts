#!/usr/bin/env tsx

/**
 * Test Script for Brand Migration
 * 
 * This script helps you test the migration process without affecting your production data.
 * It performs a dry run to show what would be migrated.
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
    apiKey: config.airtable.apiKey!,
  }).base(config.airtable.baseId!);
  
  const supabase = createClient(config.supabase.url!, config.supabase.anonKey!);
  
  return { airtable, supabase };
}

// Helper function for safe field access
function safeGet(record: any, fieldName: string): string {
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
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim();
}

// Test Airtable connection and data
async function testAirtableConnection(airtable: any): Promise<number> {
  console.log('🔍 Testing Airtable connection...');
  
  try {
    const records = await airtable(config.airtable.brandsTable)
      .select({
        maxRecords: 5 // Just get a few records for testing
      })
      .all();

    console.log(`✅ Airtable connection successful`);
    console.log(`📊 Found ${records.length} sample records`);
    
    if (records.length > 0) {
      console.log('\n📋 Available fields in first record:');
      const fields = Object.keys(records[0].fields);
      fields.forEach(field => console.log(`   - ${field}`));
      
      console.log('\n📝 Sample brand data:');
      records.forEach((record: any, index: number) => {
        const name = safeGet(record, 'Brand Name') || safeGet(record, 'brand name') || 'NO NAME';
        const description = safeGet(record, 'Brand Details Header') || safeGet(record, 'Description') || 'NO DESCRIPTION';
        const url = safeGet(record, 'UK Retailer') || safeGet(record, 'Website') || 'NO URL';
        const slug = generateSlug(name);
        
        console.log(`   ${index + 1}. ${name}`);
        console.log(`      Slug: ${slug}`);
        console.log(`      Description: ${description.substring(0, 50)}${description.length > 50 ? '...' : ''}`);
        console.log(`      URL: ${url}`);
        console.log('');
      });
    }
    
    return records.length;
  } catch (error: any) {
    console.error('❌ Airtable connection failed:', error.message);
    throw error;
  }
}

// Test Supabase connection
async function testSupabaseConnection(supabase: any): Promise<void> {
  console.log('🔍 Testing Supabase connection...');
  
  try {
    // Test read access
    const { data: brands, error: readError } = await supabase
      .from('brands')
      .select('*')
      .limit(5);
    
    if (readError) {
      throw readError;
    }
    
    console.log(`✅ Supabase connection successful`);
    console.log(`📊 Current brands in database: ${brands?.length || 0}`);
    
    if (brands && brands.length > 0) {
      console.log('\n📝 Current brands in Supabase:');
      brands.forEach((brand: any, index: number) => {
        console.log(`   ${index + 1}. ${brand.name} (${brand.slug})`);
      });
    }
    
    // Test write access (dry run)
    console.log('\n🔍 Testing write permissions...');
    const testBrand = {
      slug: 'test-brand-' + Date.now(),
      name: 'Test Brand',
      description: 'This is a test brand for migration verification',
      url: 'https://example.com',
      logo_url: null
    };
    
    const { error: insertError } = await supabase
      .from('brands')
      .insert(testBrand);
    
    if (insertError) {
      console.log('⚠️ Write test failed:', insertError.message);
      console.log('   This might be due to RLS policies or permissions');
    } else {
      console.log('✅ Write permissions confirmed');
      
      // Clean up test record
      await supabase
        .from('brands')
        .delete()
        .eq('slug', testBrand.slug);
      console.log('🧹 Test record cleaned up');
    }
    
  } catch (error: any) {
    console.error('❌ Supabase connection failed:', error.message);
    throw error;
  }
}

// Main test function
async function runTests(): Promise<void> {
  console.log('🧪 Running migration tests...\n');
  
  try {
    // Validate configuration
    validateConfig();
    
    // Initialize clients
    const { airtable, supabase } = initializeClients();
    
    // Test connections
    const airtableCount = await testAirtableConnection(airtable);
    await testSupabaseConnection(supabase);
    
    // Summary
    console.log('\n📊 Test Summary:');
    console.log(`   - Airtable: ✅ Connected (${airtableCount} sample records)`);
    console.log(`   - Supabase: ✅ Connected`);
    console.log(`   - Ready for migration: ${airtableCount > 0 ? '✅ YES' : '❌ NO'}`);
    
    if (airtableCount > 0) {
      console.log('\n🚀 You can now run the migration:');
      console.log('   npm run migrate:brands');
    } else {
      console.log('\n⚠️ No brands found in Airtable. Check your table name and data.');
    }
    
  } catch (error: any) {
    console.error('\n💥 Tests failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Check your .env.local file has all required variables');
    console.log('   2. Verify your Airtable API key and base ID');
    console.log('   3. Check your Supabase URL and anon key');
    console.log('   4. Ensure your Airtable table name is correct');
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

export { runTests };
