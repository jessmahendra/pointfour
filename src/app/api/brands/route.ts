import { NextResponse } from 'next/server';
import { airtableService } from '@/lib/airtable';

export async function GET() {  try {
    const brands = await airtableService.getBrands();
    return NextResponse.json(brands);
  } catch (error) {
    console.error('Error in brands API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch brands' },
      { status: 500 }
    );
  }
} 