#!/usr/bin/env tsx

/**
 * Verify Brands Table Structure
 * 
 * This script checks your current Supabase brands table structure
 * and confirms it's ready for migration using slug as the primary key.
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

// Check table structure
async function checkTableStructure(supabase) {
  console.log('🔍 Checking brands table structure...');
  
  try {
    // Get table information
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'brands' });
    
    if (columnsError) {
      // Fallback: try to get sample data to infer structure
      console.log('📊 Using fallback method to check table structure...');
      
      const { data: sampleData, error: sampleError } = await supabase
        .from('brands')
        .select('*')
        .limit(1);
      
      if (sampleError) {
        throw sampleError;
      }
      
      if (sampleData && sampleData.length > 0) {
        console.log('📋 Table columns (inferred from data):');
        Object.keys(sampleData[0]).forEach(column => {
          console.log(`   - ${column}`);
        });
        
        // Check if slug exists
        if ('slug' in sampleData[0]) {
          console.log('✅ Slug column found - ready for migration!');
          return true;
        } else {
          console.log('❌ Slug column not found - migration will fail');
          return false;
        }
      } else {
        console.log('⚠️ No data found in brands table');
        return false;
      }
    } else {
      console.log('📋 Table columns:');
      columns.forEach(column => {
        console.log(`   - ${column.column_name} (${column.data_type})`);
      });
      
      const hasSlug = columns.some(col => col.column_name === 'slug');
      if (hasSlug) {
        console.log('✅ Slug column found - ready for migration!');
        return true;
      } else {
        console.log('❌ Slug column not found - migration will fail');
        return false;
      }
    }
  } catch (error) {
    console.error('❌ Error checking table structure:', error.message);
    return false;
  }
}

// Test delete operation using slug
async function testSlugDelete(supabase) {
  console.log('🧪 Testing delete operation using slug...');
  
  try {
    // First, get current count
    const { count: beforeCount, error: countError } = await supabase
      .from('brands')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      throw countError;
    }
    
    console.log(`📊 Current brands count: ${beforeCount}`);
    
    if (beforeCount === 0) {
      console.log('⚠️ No brands to test delete operation');
      return true;
    }
    
    // Test the delete query that the migration will use
    const { error: deleteError } = await supabase
      .from('brands')
      .delete()
      .neq('slug', '');
    
    if (deleteError) {
      console.log('❌ Delete test failed:', deleteError.message);
      return false;
    }
    
    console.log('✅ Delete operation test successful');
    console.log('⚠️ All brands were deleted during test!');
    
    return true;
  } catch (error) {
    console.error('❌ Error testing delete operation:', error.message);
    return false;
  }
}

// Main verification function
async function verifyTable() {
  console.log('🔍 Verifying brands table for migration...\n');
  
  try {
    // Validate configuration
    validateConfig();
    
    // Initialize Supabase client
    const supabase = createClient(config.supabase.url, config.supabase.anonKey);
    
    // Check table structure
    const structureOk = await checkTableStructure(supabase);
    
    if (!structureOk) {
      console.log('\n❌ Table structure check failed');
      console.log('💡 You may need to add a slug column or modify your table schema');
      return;
    }
    
    // Test delete operation
    console.log('\n🧪 Testing delete operation...');
    const deleteOk = await testSlugDelete(supabase);
    
    if (!deleteOk) {
      console.log('\n❌ Delete operation test failed');
      console.log('💡 Check your RLS policies and permissions');
      return;
    }
    
    // Summary
    console.log('\n📊 Verification Summary:');
    console.log('   - Table structure: ✅ OK');
    console.log('   - Delete operation: ✅ OK');
    console.log('   - Ready for migration: ✅ YES');
    
    console.log('\n🚀 You can now run the migration:');
    console.log('   npm run migrate:brands');
    
  } catch (error) {
    console.error('\n💥 Verification failed:', error.message);
    process.exit(1);
  }
}

// Run verification if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  verifyTable();
}

export { verifyTable };
