import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'API connection successful',
    timestamp: new Date().toISOString(),
    extension: 'Pointfour Fashion Assistant',
    version: '3.0'
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    return NextResponse.json({
      status: 'ok',
      message: 'Test message received successfully',
      receivedData: body,
      timestamp: new Date().toISOString(),
      extension: 'Pointfour Fashion Assistant',
      version: '3.0'
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Failed to parse request body',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 400 });
  }
}

