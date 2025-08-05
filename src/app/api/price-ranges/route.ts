import { NextResponse } from 'next/server';
import { airtableService } from '@/lib/airtable';

export async function GET() {  try {
    const priceRanges = await airtableService.getPriceRanges();
    return NextResponse.json(priceRanges);
  } catch (error) {
    console.error('Error in price-ranges API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch price ranges' },
      { status: 500 }
    );
  }
} 