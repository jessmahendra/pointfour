const Airtable = require('airtable');
require('dotenv').config({ path: '.env.local' });

// Initialize Airtable
const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY,
}).base(process.env.AIRTABLE_BASE_ID);

async function testReviews() {
  try {
    console.log('Testing Reviews table...');
    const records = await base('Reviews').select().all();
    console.log(`Found ${records.length} records`);
    
    if (records.length > 0) {
      const firstRecord = records[0];
      console.log('First record fields:', Object.keys(firstRecord.fields));
      
      // Test specific field mappings
      console.log('\nTesting field mappings:');
      console.log('Brand:', firstRecord.get('Brand'));
      console.log('Brand Name (from Brand):', firstRecord.get('Brand Name (from Brand)'));
      console.log('User Body Type:', firstRecord.get('User Body Type'));
      console.log('Garment Type:', firstRecord.get('Garment Type'));
      console.log('Approved:', firstRecord.get('Approved'));
      console.log('Fit Rating:', firstRecord.get('Fit Rating'));
      
      // Test body types
      const bodyTypes = records
        .map(record => record.get('User Body Type'))
        .filter(type => type && type.trim() !== '');
      console.log('\nUnique body types:', [...new Set(bodyTypes)]);
      
      // Test garment types
      const garmentTypes = records
        .map(record => record.get('Garment Type'))
        .filter(type => type && type.trim() !== '');
      console.log('Unique garment types:', [...new Set(garmentTypes)]);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testReviews(); 