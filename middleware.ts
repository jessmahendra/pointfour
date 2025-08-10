import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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
