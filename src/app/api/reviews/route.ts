import { NextRequest, NextResponse } from 'next/server';
import { airtableService } from '@/lib/airtable';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const garmentType = searchParams.get('garmentType');
    const priceRange = searchParams.get('priceRange');
    const bodyType = searchParams.get('bodyType');
    const approved = searchParams.get('approved');

    const filters: Record<string, string> = {};    if (garmentType) filters.garmentType = garmentType;
    if (priceRange) filters.priceRange = priceRange;
    if (bodyType) filters.bodyType = bodyType;
    if (approved !== null) {
      filters['approved'] = approved === 'true' ? 'true' : 'false';
    }

    const reviews = await airtableService.getFilteredReviews(filters);
    return NextResponse.json(reviews);
  } catch (error) {
    console.error('Error in reviews API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
} 