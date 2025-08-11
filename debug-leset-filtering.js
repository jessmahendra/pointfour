// Debug script for LESET review filtering issues
// Run this with: node debug-leset-filtering.js

async function debugLESETFiltering() {
  console.log('🔍 Debugging LESET review filtering...\n');
  
  try {
    // Test the API endpoint with LESET
    console.log('📡 Testing LESET brand lookup...');
    const response = await fetch('http://localhost:3000/api/extension/check-brand', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ brand: 'LESET' })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Response for LESET:');
      console.log('  - hasData:', data.hasData);
      console.log('  - reviewCount:', data.reviewCount);
      console.log('  - brandData:', data.brandData ? 'Present' : 'Missing');
      console.log('  - message:', data.message);
      
      if (data.brandData) {
        console.log('  - Brand details:');
        console.log('    * Name:', data.brandData.name);
        console.log('    * Category:', data.brandData.category);
        console.log('    * Price Range:', data.brandData.priceRange);
        console.log('    * Sizing System:', data.brandData.sizingSystem);
      }
      
      // Check if we're getting the expected number of reviews
      if (data.reviewCount === 433) {
        console.log('\n⚠️  WARNING: Getting ALL reviews (433) instead of just LESET reviews!');
        console.log('   This indicates the brand filtering is not working correctly.');
      } else if (data.reviewCount > 0) {
        console.log(`\n✅ Found ${data.reviewCount} LESET-specific reviews`);
      } else {
        console.log('\n❌ No LESET reviews found - brand matching issue');
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Error response:', response.status, errorText);
    }
    
  } catch (error) {
    console.log('💥 Network error:', error.message);
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  console.log('📋 Next steps:');
  console.log('1. Check your server console for detailed Airtable field logging');
  console.log('2. Look for "All brand names found in reviews table:" in the logs');
  console.log('3. Check if LESET appears in the brand names list');
  console.log('4. Verify the field names match between Brands and Reviews tables');
}

// Test the LESET filtering
console.log('🚀 Starting LESET review filtering debug test...');
console.log('Make sure your server is running on http://localhost:3000');
console.log('');

debugLESETFiltering().catch(console.error);
