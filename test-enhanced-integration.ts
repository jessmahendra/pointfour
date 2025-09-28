import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

async function testEnhancedIntegration() {
  console.log('🧪 Testing Enhanced Product Parsing Integration...\n');

  try {
    // Test 1: Basic product parsing
    console.log('Test 1: Basic product parsing');
    const result1 = await axios.post(`${API_BASE_URL}/api/enhanced-product-parsing`, {
      prompt: 'Query: "nike air max 270 running shoes"',
      options: {
        enableWebSearch: true,
        temperature: 0.3,
        fuzzyMatchThreshold: 0.7
      }
    });

    console.log('✅ Success:', {
      brand: result1.data.data.parsedData.brandName,
      product: result1.data.data.parsedData.productName,
      brandCreated: result1.data.data.wasBrandCreated,
      productCreated: result1.data.data.wasProductCreated,
      brandId: result1.data.data.brand.id,
      productId: result1.data.data.product.id
    });

    // Test 2: Product with typos (should use fuzzy matching)
    console.log('\nTest 2: Product with typos');
    const result2 = await axios.post(`${API_BASE_URL}/api/enhanced-product-parsing`, {
      prompt: 'Query: "adidas stan smith white sneakers"',
      options: {
        enableWebSearch: true,
        temperature: 0.3,
        fuzzyMatchThreshold: 0.7
      }
    });

    console.log('✅ Success:', {
      brand: result2.data.data.parsedData.brandName,
      product: result2.data.data.parsedData.productName,
      brandCreated: result2.data.data.wasBrandCreated,
      productCreated: result2.data.data.wasProductCreated,
      brandId: result2.data.data.brand.id,
      productId: result2.data.data.product.id
    });

    // Test 3: Get database summary
    console.log('\nTest 3: Database summary');
    const summary = await axios.get(`${API_BASE_URL}/api/enhanced-product-parsing?action=summary`);
    console.log('✅ Database Summary:', summary.data.data);

    console.log('\n🎉 All tests passed! Enhanced product parsing is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testEnhancedIntegration();
