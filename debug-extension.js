// Debug script for browser extension data flow
// Run this with: node debug-extension.js

async function testBrandAPI() {
  const testBrands = ['Reformation', 'GANNI', 'ASOS', 'UnknownBrand'];
  
  for (const brand of testBrands) {
    console.log(`\n🔍 Testing brand: ${brand}`);
    console.log('='.repeat(50));
    
    try {
      const response = await fetch('http://localhost:3001/api/extension/check-brand', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ brand })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Response received:');
        console.log('  - hasData:', data.hasData);
        console.log('  - reviewCount:', data.reviewCount);
        console.log('  - brandData:', data.brandData ? 'Present' : 'Missing');
        console.log('  - message:', data.message);
        
        if (data.brandData) {
          console.log('  - Brand details:');
          console.log('    * Category:', data.brandData.category);
          console.log('    * Price Range:', data.brandData.priceRange);
          console.log('    * Sizing System:', data.brandData.sizingSystem);
        }
      } else {
        const errorText = await response.text();
        console.log('❌ Error response:', response.status, errorText);
      }
    } catch (error) {
      console.log('💥 Network error:', error.message);
    }
  }
}

// Test the API
console.log('🚀 Starting browser extension API debug test...');
console.log('Make sure your server is running on http://localhost:3001');
console.log('');

testBrandAPI().catch(console.error);
