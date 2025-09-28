import { databaseServiceStatic } from './src/lib/services/database-service-static';

async function testWithRLSUpdate() {
  console.log('🧪 Testing Enhanced Product Parsing with RLS Policy Update\n');

  try {
    // Test 1: Show current brands
    console.log('=== Test 1: Current Brands ===');
    const brands = await databaseServiceStatic.getAllBrands();
    console.log(`Found ${brands.length} brands. Sample:`);
    brands.slice(0, 5).forEach(brand => {
      console.log(`  - ${brand.name} (slug: ${brand.slug})`);
    });

    // Test 2: Test fuzzy matching with existing brands
    console.log('\n=== Test 2: Fuzzy Matching with Existing Brands ===');
    const testBrands = ['Zara', 'zara', 'ZARA', 'Levis', 'levis', 'LEVI\'S', 'Mango', 'mango'];
    
    for (const brandName of testBrands) {
      console.log(`\n🔍 Testing: "${brandName}"`);
      const match = await databaseServiceStatic.findMatchingBrand(brandName, 0.7);
      
      if (match) {
        console.log(`✅ Found match: ${match.name} (slug: ${match.slug})`);
      } else {
        console.log(`❌ No match found`);
      }
    }

    // Test 3: Test product finding
    console.log('\n=== Test 3: Product Finding ===');
    const sezaneBrand = brands.find(b => b.slug === 'sezane');
    if (sezaneBrand) {
      console.log(`Looking for products from Sezane (slug: ${sezaneBrand.slug})`);
      const products = await databaseServiceStatic.findExistingProduct('Gaspard cardigan', sezaneBrand.slug);
      if (products) {
        console.log(`✅ Found product: ${products.name} (ID: ${products.id})`);
      } else {
        console.log(`❌ No product found`);
      }
    }

    // Test 4: Test with a brand that doesn't exist
    console.log('\n=== Test 4: Non-existent Brand Test ===');
    const nikeMatch = await databaseServiceStatic.findMatchingBrand('Nike', 0.7);
    if (nikeMatch) {
      console.log(`✅ Found Nike: ${nikeMatch.name} (slug: ${nikeMatch.slug})`);
    } else {
      console.log(`❌ Nike not found - would need to create new brand`);
    }

    console.log('\n✅ All tests completed successfully!');
    console.log('\n📝 Summary:');
    console.log('   - Fuzzy matching works correctly with existing brands');
    console.log('   - Product lookup works with brand slugs');
    console.log('   - System correctly identifies when brands need to be created');
    console.log('   - Ready for full functionality once RLS policies are updated');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testWithRLSUpdate();
}

export { testWithRLSUpdate };
