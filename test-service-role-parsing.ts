import { enhancedProductParsingServiceServiceRole } from './src/lib/services/enhanced-product-parsing-service-role';

async function testServiceRoleParsing() {
  console.log('🧪 Testing Enhanced Product Parsing with Service Role\n');

  try {
    // Test 1: Parse a product that should create new brand and product
    console.log('=== Test 1: New Brand and Product ===');
    const result1 = await enhancedProductParsingServiceServiceRole.parseAndStoreProduct(
      'Query: "Nike Air Max 270 running shoes"'
    );
    
    console.log('Result 1:', {
      brandName: result1.parsedData.brandName,
      productName: result1.parsedData.productName,
      brandSlug: result1.brand.slug,
      productId: result1.product.id,
      wasBrandCreated: result1.wasBrandCreated,
      wasProductCreated: result1.wasProductCreated
    });

    // Test 2: Parse a product with slightly different brand name (should find existing)
    console.log('\n=== Test 2: Fuzzy Brand Matching ===');
    const result2 = await enhancedProductParsingServiceServiceRole.parseAndStoreProduct(
      'Query: "nike air max 90 sneakers"'
    );
    
    console.log('Result 2:', {
      brandName: result2.parsedData.brandName,
      productName: result2.parsedData.productName,
      brandSlug: result2.brand.slug,
      productId: result2.product.id,
      wasBrandCreated: result2.wasBrandCreated,
      wasProductCreated: result2.wasProductCreated
    });

    // Test 3: Parse a completely different brand
    console.log('\n=== Test 3: Different Brand ===');
    const result3 = await enhancedProductParsingServiceServiceRole.parseAndStoreProduct(
      'Query: "Adidas Stan Smith white sneakers"'
    );
    
    console.log('Result 3:', {
      brandName: result3.parsedData.brandName,
      productName: result3.parsedData.productName,
      brandSlug: result3.brand.slug,
      productId: result3.product.id,
      wasBrandCreated: result3.wasBrandCreated,
      wasProductCreated: result3.wasProductCreated
    });

    // Test 4: Parse same product again (should find existing)
    console.log('\n=== Test 4: Duplicate Product ===');
    const result4 = await enhancedProductParsingServiceServiceRole.parseAndStoreProduct(
      'Query: "Nike Air Max 270 running shoes"'
    );
    
    console.log('Result 4:', {
      brandName: result4.parsedData.brandName,
      productName: result4.parsedData.productName,
      brandSlug: result4.brand.slug,
      productId: result4.product.id,
      wasBrandCreated: result4.wasBrandCreated,
      wasProductCreated: result4.wasProductCreated
    });

    // Test 5: Get database summary
    console.log('\n=== Test 5: Database Summary ===');
    const summary = await enhancedProductParsingServiceServiceRole.getDatabaseSummary();
    console.log('Database Summary:', {
      totalBrands: summary.totalBrands,
      totalProducts: summary.totalProducts
    });

    // Test 6: Test fuzzy matching
    console.log('\n=== Test 6: Fuzzy Matching Test ===');
    await enhancedProductParsingServiceServiceRole.testFuzzyMatching([
      'Nike',
      'nike',
      'NIKE',
      'Adidas',
      'adidas',
      'Zara',
      'zara',
      'H&M',
      'hm',
      'Uniqlo',
      'uniqlo'
    ]);

    console.log('\n✅ All service role tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testServiceRoleParsing();
}

export { testServiceRoleParsing };
