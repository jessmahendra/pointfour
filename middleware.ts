import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// GPT-5 Testing Configuration
const ENABLE_GPT5_TESTING = process.env.ENABLE_GPT5_TESTING === 'true';
const GPT5_TEST_PERCENTAGE = parseInt(process.env.GPT5_TEST_PERCENTAGE || '10') || 10;

// Debug: Log all environment variables to see what's loaded
console.log('🔍 ENVIRONMENT DEBUG:', {
  NODE_ENV: process.env.NODE_ENV,
  ENABLE_GPT5_TESTING: process.env.ENABLE_GPT5_TESTING,
  GPT5_TEST_PERCENTAGE: process.env.GPT5_TEST_PERCENTAGE,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET'
});

console.log('🧪 GPT-5 TESTING CONFIG:', {
  enabled: ENABLE_GPT5_TESTING,
  testPercentage: GPT5_TEST_PERCENTAGE,
  model: 'gpt-5-mini'
});

export function middleware(request: NextRequest) {
  // Handle CORS for browser extension requests
  if (request.nextUrl.pathname.startsWith('/api/extension/')) {
    const response = NextResponse.next()
    
    // Set CORS headers for browser extensions
    response.headers.set('Access-Control-Allow-Origin', 'chrome-extension://*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 200, headers: response.headers })
    }
    
    return response
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: '/api/extension/:path*',
}
