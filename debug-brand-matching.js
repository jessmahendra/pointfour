// Debug script for brand name matching issues
// Run this with: node debug-brand-matching.js

async function debugBrandMatching() {
  console.log('🔍 Debugging brand name matching between Brands and Reviews tables...\n');
  
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
    } else {
      const errorText = await response.text();
      console.log('❌ Error response:', response.status, errorText);
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    // Test with different case variations
    const testVariations = ['Leset', 'leset', 'LESET', 'LeSet'];
    
    for (const variation of testVariations) {
      console.log(`📡 Testing brand variation: "${variation}"`);
      
      try {
        const response = await fetch('http://localhost:3000/api/extension/check-brand', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ brand: variation })
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`  ✅ "${variation}": hasData=${data.hasData}, reviewCount=${data.reviewCount}`);
        } else {
          console.log(`  ❌ "${variation}": HTTP ${response.status}`);
        }
      } catch (error) {
        console.log(`  💥 "${variation}": ${error.message}`);
      }
    }
    
  } catch (error) {
    console.log('💥 Network error:', error.message);
  }
}

// Test the brand matching
console.log('🚀 Starting brand name matching debug test...');
console.log('Make sure your server is running on http://localhost:3000');
console.log('');

debugBrandMatching().catch(console.error);
