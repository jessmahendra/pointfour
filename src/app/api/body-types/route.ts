import { NextRequest, NextResponse } from 'next/server';
import { airtableService } from '@/lib/airtable';

export async function GET(request: NextRequest) {
  try {
    const bodyTypes = await airtableService.getBodyTypes();
    return NextResponse.json(bodyTypes);
  } catch (error) {
    console.error('Error in body-types API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch body types' },
      { status: 500 }
    );
  }
} 