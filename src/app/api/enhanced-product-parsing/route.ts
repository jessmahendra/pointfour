import { NextRequest, NextResponse } from 'next/server';
import { enhancedProductParsingServiceServiceRole } from '../../../lib/services/enhanced-product-parsing-service-role';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Enhanced Product Parsing API: Starting request...');
    
    // Check environment variables first
    const envCheck = {
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasSerperKey: !!process.env.SERPER_API_KEY,
      nodeEnv: process.env.NODE_ENV
    };
    
    console.log('🔍 Environment check:', envCheck);
    
    // If any critical environment variables are missing, return detailed error
    if (!envCheck.hasOpenAIKey || !envCheck.hasSupabaseUrl || !envCheck.hasServiceRoleKey) {
      console.error('❌ Missing critical environment variables:', envCheck);
      return NextResponse.json(
        { 
          error: 'Missing critical environment variables',
          details: envCheck,
          message: 'Please check that OPENAI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, and SUPABASE_SERVICE_ROLE_KEY are set in production environment'
        },
        { status: 500 }
      );
    }
    
    const body = await request.json();
    const { prompt, options = {} } = body;

    if (!prompt) {
      console.log('❌ No prompt provided');
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    console.log('🚀 API: Starting enhanced product parsing for:', prompt);

    const result = await enhancedProductParsingServiceServiceRole.parseAndStoreProduct(prompt, options);

    console.log('✅ API: Enhanced product parsing completed successfully');
    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('❌ API Error:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('❌ Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      cause: error instanceof Error ? error.cause : undefined
    });
    
    return NextResponse.json(
      { 
        error: 'Enhanced product parsing failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        environment: {
          hasOpenAIKey: !!process.env.OPENAI_API_KEY,
          hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          hasSerperKey: !!process.env.SERPER_API_KEY,
          nodeEnv: process.env.NODE_ENV
        }
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
