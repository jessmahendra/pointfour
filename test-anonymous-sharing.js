#!/usr/bin/env node

/**
 * Test script for anonymous user recommendation sharing
 * This script tests the complete flow from creating a recommendation to viewing it
 */

const fetch = require('node-fetch');

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || (process.env.NODE_ENV === 'production' ? 'https://pointfour.in' : 'http://localhost:3000');

async function testAnonymousSharing() {
  console.log('🧪 Testing Anonymous User Recommendation Sharing');
  console.log('================================================');
  
  try {
    // Step 1: Create a recommendation as an anonymous user
    console.log('\n1️⃣ Creating recommendation as anonymous user...');
    
    const recommendationData = {
      query: 'Brand/Item: Test Brand Test Product',
      userProfile: {
        ukClothingSize: '12',
        height: '5\'6"',
        fitPreference: 'regular'
      },
      productId: '1', // Assuming product ID 1 exists
      makeShareable: true
    };
    
    const createResponse = await fetch(`${BASE_URL}/api/recommendations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(recommendationData)
    });
    
    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`Failed to create recommendation: ${createResponse.status} ${errorText}`);
    }
    
    const createResult = await createResponse.json();
    console.log('✅ Recommendation created successfully');
    console.log('   Share Token:', createResult.shareToken);
    console.log('   Share URL:', createResult.shareUrl);
    
    if (!createResult.shareToken) {
      throw new Error('No share token generated');
    }
    
    // Step 2: Test viewing the shared recommendation
    console.log('\n2️⃣ Testing shared recommendation access...');
    
    const viewResponse = await fetch(`${BASE_URL}/api/user-recommendations/${createResult.shareToken}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!viewResponse.ok) {
      const errorText = await viewResponse.text();
      throw new Error(`Failed to view shared recommendation: ${viewResponse.status} ${errorText}`);
    }
    
    const viewResult = await viewResponse.json();
    console.log('✅ Shared recommendation accessed successfully');
    console.log('   Product Query:', viewResult.data.productQuery);
    console.log('   View Count:', viewResult.data.viewCount);
    console.log('   Created At:', viewResult.data.createdAt);
    
    // Step 3: Test the frontend shared page
    console.log('\n3️⃣ Testing frontend shared page...');
    
    const pageResponse = await fetch(createResult.shareUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      }
    });
    
    if (!pageResponse.ok) {
      const errorText = await pageResponse.text();
      throw new Error(`Failed to access shared page: ${pageResponse.status} ${errorText}`);
    }
    
    console.log('✅ Shared page accessed successfully');
    console.log('   Status:', pageResponse.status);
    
    // Step 4: Test creating another recommendation to ensure uniqueness
    console.log('\n4️⃣ Testing unique token generation...');
    
    const secondRecommendationData = {
      query: 'Brand/Item: Another Brand Another Product',
      userProfile: {
        ukClothingSize: '10',
        height: '5\'4"',
        fitPreference: 'slim'
      },
      productId: '2', // Assuming product ID 2 exists
      makeShareable: true
    };
    
    const secondCreateResponse = await fetch(`${BASE_URL}/api/recommendations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(secondRecommendationData)
    });
    
    if (!secondCreateResponse.ok) {
      const errorText = await secondCreateResponse.text();
      throw new Error(`Failed to create second recommendation: ${secondCreateResponse.status} ${errorText}`);
    }
    
    const secondCreateResult = await secondCreateResponse.json();
    console.log('✅ Second recommendation created successfully');
    console.log('   Share Token:', secondCreateResult.shareToken);
    
    if (secondCreateResult.shareToken === createResult.shareToken) {
      throw new Error('Share tokens are not unique!');
    }
    
    console.log('✅ Share tokens are unique');
    
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('====================');
    console.log('Anonymous user recommendation sharing is working correctly.');
    console.log('Users can now:');
    console.log('1. Create recommendations without being logged in');
    console.log('2. Generate shareable links');
    console.log('3. Share links with others who can view them');
    console.log('4. Each recommendation gets a unique share token');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test
testAnonymousSharing();
