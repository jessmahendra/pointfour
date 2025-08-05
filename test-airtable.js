import Airtable from 'airtable';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Initialize Airtable
const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY,
}).base(process.env.AIRTABLE_BASE_ID);

console.log('Testing Airtable connection...');
console.log('API Key:', process.env.AIRTABLE_API_KEY ? '✅ Set' : '❌ Missing');
console.log('Base ID:', process.env.AIRTABLE_BASE_ID ? '✅ Set' : '❌ Missing');
console.log('Brands Table:', process.env.AIRTABLE_BRANDS_TABLE);
console.log('Reviews Table:', process.env.AIRTABLE_REVIEWS_TABLE);
console.log('');

// Test the connection by trying to access the tables
async function testConnection() {
  try {
    // Test 1: Try to access the Brands table
    console.log('🔍 Testing Brands table...');
    try {
      const brandsRecords = await base(process.env.AIRTABLE_BRANDS_TABLE).select({ maxRecords: 1 }).all();
      console.log(`✅ Brands table accessible! Found ${brandsRecords.length} record(s)`);
      if (brandsRecords.length > 0) {
        console.log('Sample brand fields:', Object.keys(brandsRecords[0].fields));
      }
    } catch (error) {
      console.log(`❌ Brands table error: ${error.message}`);
      if (error.message.includes('NOT_FOUND')) {
        console.log('   💡 The table name might be different. Check your Airtable base.');
      }
    }
    console.log('');

    // Test 2: Try to access the Reviews table
    console.log('🔍 Testing Reviews table...');
    try {
      const reviewsRecords = await base(process.env.AIRTABLE_REVIEWS_TABLE).select({ maxRecords: 1 }).all();
      console.log(`✅ Reviews table accessible! Found ${reviewsRecords.length} record(s)`);
      if (reviewsRecords.length > 0) {
        console.log('Sample review fields:', Object.keys(reviewsRecords[0].fields));
      }
    } catch (error) {
      console.log(`❌ Reviews table error: ${error.message}`);
      if (error.message.includes('NOT_FOUND')) {
        console.log('   💡 The table name might be different. Check your Airtable base.');
      }
    }
    console.log('');

    // Test 3: Try to access with different common table names
    console.log('🔍 Testing common table names...');
    const commonTableNames = ['Brands', 'Reviews', 'brands', 'reviews', 'Brand', 'Review', 'brand', 'review'];
    
    for (const tableName of commonTableNames) {
      if (tableName !== process.env.AIRTABLE_BRANDS_TABLE && tableName !== process.env.AIRTABLE_REVIEWS_TABLE) {
        try {
          const records = await base(tableName).select({ maxRecords: 1 }).all();
          console.log(`✅ Found table: "${tableName}" with ${records.length} record(s)`);
        } catch (error) {
          // Silently ignore - table doesn't exist
        }
      }
    }

  } catch (error) {
    console.log('❌ Connection failed:', error.message);
    console.log('');
    console.log('🔧 Troubleshooting tips:');
    console.log('1. Check if your API key is correct');
    console.log('2. Verify the base ID is correct');
    console.log('3. Ensure your API key has access to this base');
    console.log('4. Check if the base is shared with your account');
    console.log('5. Verify the table names match exactly (case-sensitive)');
  }
}

testConnection(); 