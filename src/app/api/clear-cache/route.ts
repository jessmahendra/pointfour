import { NextResponse } from 'next/server';

export async function POST() {
  // This would normally clear in-memory caches, but since we're using
  // in-memory caches in the recommendations route, we can't access them here.
  // The best way is to restart the server or wait for cache expiry.

  return NextResponse.json({
    message: 'Cache clear requested. Please restart your dev server to fully clear caches.'
  });
}

export async function GET() {
  return NextResponse.json({
    message: 'Cache clear endpoint. Use POST to request cache clear.'
  });
}
