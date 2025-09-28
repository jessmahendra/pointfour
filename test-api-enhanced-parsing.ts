import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

async function testEnhancedParsingAPI() {
  console.log('🧪 Testing Enhanced Product Parsing API\n');

  try {
    // Test 1: Parse a product that should create new brand and product
    console.log('=== Test 1: New Brand and Product ===');
    const result1 = await axios.post(`${API_BASE_URL}/api/enhanced-product-parsing`, {
      prompt: 'Query: "Nike Air Max 270 running shoes"',
      options: {}
    });
    
    console.log('Result 1:', {
      success: result1.data.success,
      brandName: result1.data.data.parsedData.brandName,
      productName: result1.data.data.parsedData.productName,
      brandId: result1.data.data.brand.id,
      productId: result1.data.data.product.id,
      wasBrandCreated: result1.data.data.wasBrandCreated,
      wasProductCreated: result1.data.data.wasProductCreated
    });

    // Test 2: Parse a product with slightly different brand name (should find existing)
    console.log('\n=== Test 2: Fuzzy Brand Matching ===');
    const result2 = await axios.post(`${API_BASE_URL}/api/enhanced-product-parsing`, {
      prompt: 'Query: "nike air max 90 sneakers"',
      options: {}
    });
    
    console.log('Result 2:', {
      success: result2.data.success,
      brandName: result2.data.data.parsedData.brandName,
      productName: result2.data.data.parsedData.productName,
      brandId: result2.data.data.brand.id,
      productId: result2.data.data.product.id,
      wasBrandCreated: result2.data.data.wasBrandCreated,
      wasProductCreated: result2.data.data.wasProductCreated
    });

    // Test 3: Parse a completely different brand
    console.log('\n=== Test 3: Different Brand ===');
    const result3 = await axios.post(`${API_BASE_URL}/api/enhanced-product-parsing`, {
      prompt: 'Query: "Adidas Stan Smith white sneakers"',
      options: {}
    });
    
    console.log('Result 3:', {
      success: result3.data.success,
      brandName: result3.data.data.parsedData.brandName,
      productName: result3.data.data.parsedData.productName,
      brandId: result3.data.data.brand.id,
      productId: result3.data.data.product.id,
      wasBrandCreated: result3.data.data.wasBrandCreated,
      wasProductCreated: result3.data.data.wasProductCreated
    });

    // Test 4: Parse same product again (should find existing)
    console.log('\n=== Test 4: Duplicate Product ===');
    const result4 = await axios.post(`${API_BASE_URL}/api/enhanced-product-parsing`, {
      prompt: 'Query: "Nike Air Max 270 running shoes"',
      options: {}
    });
    
    console.log('Result 4:', {
      success: result4.data.success,
      brandName: result4.data.data.parsedData.brandName,
      productName: result4.data.data.parsedData.productName,
      brandId: result4.data.data.brand.id,
      productId: result4.data.data.product.id,
      wasBrandCreated: result4.data.data.wasBrandCreated,
      wasProductCreated: result4.data.data.wasProductCreated
    });

    // Test 5: Get database summary
    console.log('\n=== Test 5: Database Summary ===');
    const summary = await axios.get(`${API_BASE_URL}/api/enhanced-product-parsing?action=summary`);
    console.log('Database Summary:', {
      success: summary.data.success,
      totalBrands: summary.data.data.totalBrands,
      totalProducts: summary.data.data.totalProducts
    });

    // Test 6: Test fuzzy matching
    console.log('\n=== Test 6: Fuzzy Matching Test ===');
    const fuzzyTest = await axios.get(`${API_BASE_URL}/api/enhanced-product-parsing?action=test-fuzzy&brands=nike,adidas,zara,hm,uniqlo`);
    console.log('Fuzzy Test:', {
      success: fuzzyTest.data.success,
      message: fuzzyTest.data.message
    });

    console.log('\n✅ All API tests completed successfully!');

  } catch (error) {
    console.error('❌ API test failed:', error);
    if (axios.isAxiosError(error)) {
      console.error('Response data:', error.response?.data);
    }
  }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testEnhancedParsingAPI();
}

export { testEnhancedParsingAPI };
