import { NextResponse } from 'next/server';
import { airtableService } from '@/lib/airtable';

export async function GET() {
  try {
    console.log('🔍 Brands API called');
    console.log('Environment check:');
    console.log('- AIRTABLE_API_KEY exists:', !!process.env.AIRTABLE_API_KEY);
    console.log('- AIRTABLE_BASE_ID exists:', !!process.env.AIRTABLE_BASE_ID);
    console.log('- BRANDS_TABLE:', process.env.AIRTABLE_BRANDS_TABLE);
    console.log('- REVIEWS_TABLE:', process.env.AIRTABLE_REVIEWS_TABLE);

    // Check if API keys exist
    if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
      console.error('❌ Missing environment variables');
      return NextResponse.json(
        { error: 'Airtable API keys not configured' },
        { status: 500 }
      );
    }

    console.log('🔄 Calling airtableService.getBrands()...');
    const brands = await airtableService.getBrands();
    
    console.log('✅ Brands fetched successfully:', brands.length);
    if (brands.length > 0) {
      console.log('First brand sample:', brands[0]);
    }
    
    return NextResponse.json(brands);
  } catch (error) {
    console.error('❌ Error in brands API:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch brands',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}