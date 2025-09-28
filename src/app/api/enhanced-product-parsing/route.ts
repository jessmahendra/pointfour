import { NextRequest, NextResponse } from 'next/server';
import { enhancedProductParsingServiceServiceRole } from '../../../lib/services/enhanced-product-parsing-service-role';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, options = {} } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    console.log('🚀 API: Starting enhanced product parsing for:', prompt);

    const result = await enhancedProductParsingServiceServiceRole.parseAndStoreProduct(prompt, options);

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('❌ API Error:', error);
    return NextResponse.json(
      { 
        error: 'Enhanced product parsing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'summary') {
      const summary = await enhancedProductParsingServiceServiceRole.getDatabaseSummary();
      return NextResponse.json({
        success: true,
        data: summary
      });
    }

    if (action === 'test-fuzzy') {
      const testBrands = searchParams.get('brands')?.split(',') || [
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
        'uniqlo'
      ];

      await enhancedProductParsingServiceServiceRole.testFuzzyMatching(testBrands);
      return NextResponse.json({
        success: true,
        message: 'Fuzzy matching test completed. Check server logs for results.'
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Enhanced Product Parsing API',
      endpoints: {
        'POST /': 'Parse and store a product',
        'GET ?action=summary': 'Get database summary',
        'GET ?action=test-fuzzy&brands=nike,adidas': 'Test fuzzy matching'
      }
    });

  } catch (error) {
    console.error('❌ API Error:', error);
    return NextResponse.json(
      { 
        error: 'API request failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
