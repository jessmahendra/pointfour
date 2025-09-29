import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔍 Environment check endpoint called');
    
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
    
    console.log('🔍 Environment variables:', envCheck);
    
    return NextResponse.json({
      success: true,
      environment: envCheck
    });
    
  } catch (error) {
    console.error('❌ Environment check error:', error);
    return NextResponse.json(
      { 
        error: 'Environment check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
