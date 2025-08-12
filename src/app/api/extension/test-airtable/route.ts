import Airtable from 'airtable';

export async function GET() {
  try {
    const base = new Airtable({
      apiKey: process.env.AIRTABLE_API_KEY,
    }).base(process.env.AIRTABLE_BASE_ID!);
    
    const tableName = process.env.AIRTABLE_REVIEWS_TABLE || 'Reviews';
    
    // Get all records to see the full dataset
    const records = await base(tableName)
      .select({
        maxRecords: 1000
      })
      .all();

    // Find LESET records
    const lesetRecords = records.filter(record => 
      record.fields['Brand'] === 'Leset'
    );

    // Get the first few LESET records
    const sampleLesetRecords = lesetRecords.slice(0, 5).map(record => ({
      id: record.id,
      brand: record.fields['Brand'],
      itemName: record.fields['Item Name'],
      garmentType: record.fields['Garment Type']
    }));

    return new Response(
      JSON.stringify({
        success: true,
        totalRecords: records.length,
        lesetRecordCount: lesetRecords.length,
        sampleLesetRecords,
        allBrands: [...new Set(records.map(r => r.fields['Brand']).filter(Boolean))].sort()
      }, null, 2),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch data',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    );
  }
}
