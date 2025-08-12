import Airtable from 'airtable';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const recordId = searchParams.get('id');
    
    const base = new Airtable({
      apiKey: process.env.AIRTABLE_API_KEY,
    }).base(process.env.AIRTABLE_BASE_ID!);
    
    const tableName = process.env.AIRTABLE_REVIEWS_TABLE || 'Reviews';
    
    let records;
    if (recordId) {
      // Get specific record by ID
      records = [await base(tableName).find(recordId)];
    } else {
      // Get first 10 records
      records = await base(tableName)
        .select({
          maxRecords: 10
        })
        .all();
    }

    const rawData = records.map(record => ({
      id: record.id,
      fields: record.fields,
      fieldNames: Object.keys(record.fields),
      brandField: record.fields['Brand'],
      itemNameField: record.fields['Item Name']
    }));

    return new Response(
      JSON.stringify({
        success: true,
        tableName,
        recordId,
        rawData
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
        error: 'Failed to fetch raw data',
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
