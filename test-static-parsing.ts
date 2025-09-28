import { databaseServiceStatic } from './src/lib/services/database-service-static';

async function testStaticParsing() {
  console.log('🧪 Testing Static Database Service (Read-Only Operations)\n');

  try {
    // Test 1: Get all existing brands
    console.log('=== Test 1: Get All Brands ===');
    const brands = await databaseServiceStatic.getAllBrands();
    console.log(`Found ${brands.length} brands:`);
    brands.forEach(brand => {
      console.log(`  - ${brand.name} (Slug: ${brand.slug})`);
    });

    // Test 2: Get all existing products
    console.log('\n=== Test 2: Get All Products ===');
    const products = await databaseServiceStatic.getAllProducts();
    console.log(`Found ${products.length} products:`);
    products.forEach(product => {
      console.log(`  - ${product.name} (ID: ${product.id}, Brand Slug: ${product.brand_id})`);
    });

    // Test 3: Test fuzzy brand matching
    console.log('\n=== Test 3: Fuzzy Brand Matching ===');
    const testBrandNames = [
      'Nike',
      'nike',
      'NIKE',
      'Adidas',
      'adidas',
      'Zara',
      'zara',
      'H&M',
      'hm',
      'H&M',
      'Uniqlo',
      'uniqlo',
      'Unknown Brand',
      'Nikee', // Typo
      'Adiddas' // Typo
    ];

    for (const brandName of testBrandNames) {
      console.log(`\n🔍 Testing: "${brandName}"`);
      const match = await databaseServiceStatic.findMatchingBrand(brandName, 0.7);
      
      if (match) {
        console.log(`✅ Found match: ${match.name} (slug: ${match.slug})`);
      } else {
        console.log(`❌ No match found`);
      }
    }

    // Test 4: Test product finding
    console.log('\n=== Test 4: Product Finding ===');
    if (brands.length > 0) {
      const firstBrand = brands[0];
      console.log(`Looking for products from brand: ${firstBrand.name} (slug: ${firstBrand.slug})`);
      
      const existingProducts = await databaseServiceStatic.findExistingProduct('Air Max 270', firstBrand.slug);
      if (existingProducts) {
        console.log(`✅ Found product: ${existingProducts.name}`);
      } else {
        console.log(`❌ No product found with name "Air Max 270"`);
      }
    }

    console.log('\n✅ All static tests completed successfully!');
    console.log('\n📝 Note: This test only demonstrates read operations and fuzzy matching.');
    console.log('   For full functionality including brand/product creation, the RLS policies');
    console.log('   need to be updated or a service role key needs to be used.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testStaticParsing();
}

export { testStaticParsing };
