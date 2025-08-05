import { NextResponse } from 'next/server';
import { airtableService } from '@/lib/airtable';

export async function GET() {  console.log('🔍 /api/garment-types called');
  
  try {
    console.log('📡 Attempting to fetch garment types from Airtable...');
    console.log('🔑 Environment check:');
    console.log('  - AIRTABLE_API_KEY:', process.env.AIRTABLE_API_KEY ? '✅ Set' : '❌ Missing');
    console.log('  - AIRTABLE_BASE_ID:', process.env.AIRTABLE_BASE_ID ? '✅ Set' : '❌ Missing');
    console.log('  - AIRTABLE_REVIEWS_TABLE:', process.env.AIRTABLE_REVIEWS_TABLE);
    
    const garmentTypes = await airtableService.getGarmentTypes();
    console.log('✅ Successfully fetched garment types:', garmentTypes);
    
    return NextResponse.json(garmentTypes);
  } catch (error) {
    console.error('❌ Error in garment-types API:', error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch garment types',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 