import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔍 Production test endpoint called');
    
    const envCheck = {
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasSerperKey: !!process.env.SERPER_API_KEY,
      nodeEnv: process.env.NODE_ENV,
      // Don't log actual values for security
      openaiKeyLength: process.env.OPENAI_API_KEY?.length || 0,
      supabaseUrlLength: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0,
      serviceRoleKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
      serperKeyLength: process.env.SERPER_API_KEY?.length || 0
    };
    
    console.log('🔍 Production environment variables:', envCheck);
    
    // Test basic functionality
    const tests = {
      environment: envCheck,
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    };
    
    return NextResponse.json({
      success: true,
      message: 'Production test endpoint working',
      tests
    });
    
  } catch (error) {
    console.error('❌ Production test error:', error);
    return NextResponse.json(
      { 
        error: 'Production test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
