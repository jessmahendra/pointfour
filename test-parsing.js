const Airtable = require('airtable');
require('dotenv').config({ path: '.env.local' });

// Initialize Airtable
const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY,
}).base(process.env.AIRTABLE_BASE_ID);

// Helper function to safely get array values
const getArrayValue = (value) => {
  if (Array.isArray(value)) {
    return value[0] || '';
  }
  return value || '';
};

// Helper function to convert fit rating string to number
const parseFitRating = (rating) => {
  if (typeof rating === 'number') return rating;
  if (typeof rating === 'string') {
    const ratingMap = {
      'Perfect Fit': 5,
      'Great Fit': 4,
      'Good Fit': 3,
      'Okay Fit': 2,
      'Poor Fit': 1,
    };
    return ratingMap[rating] || 3; // Default to 3 if unknown
  }
  return 3; // Default
};

async function testParsing() {
  try {
    console.log('Testing parsing functions...');
    const records = await base('Reviews').select({ maxRecords: 3 }).all();
    
    records.forEach((record, index) => {
      console.log(`\n--- Record ${index + 1} ---`);
      
      // Test the parsing functions
      const brandName = getArrayValue(record.get('Brand Name (from Brand)')) || getArrayValue(record.get('Brand')) || '';
      const userBodyType = getArrayValue(record.get('User Body Type')) || '';
      const fitRating = parseFitRating(record.get('Fit Rating'));
      
      console.log('Brand Name:', brandName);
      console.log('User Body Type:', userBodyType);
      console.log('Fit Rating:', fitRating);
      console.log('Garment Type:', record.get('Garment Type'));
      console.log('Approved:', record.get('Approved'));
    });
    
    // Test body types extraction
    const bodyTypes = records
      .map(record => getArrayValue(record.get('User Body Type')))
      .filter(type => type && type.trim() !== '');
    console.log('\nUnique body types:', [...new Set(bodyTypes)]);
    
    // Test garment types extraction
    const garmentTypes = records
      .map(record => record.get('Garment Type'))
      .filter(type => type && type.trim() !== '');
    console.log('Unique garment types:', [...new Set(garmentTypes)]);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testParsing(); 