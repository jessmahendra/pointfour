export async function POST(request: Request) {
  try {
    const { brand } = await request.json();
    
    if (!brand) {
      return new Response(
        JSON.stringify({ error: 'Brand parameter is required' }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': 'chrome-extension://*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Credentials': 'true',
          }
        }
      );
    }

    // TODO: Replace this with actual database query
    // For now, we'll simulate checking against a list of brands
    const brandsWithData = [
      'asos',
      'zara', 
      'h&m',
      'uniqlo',
      'cos',
      'arket',
      'ganni',
      'intimissimi',
      'mango',
      'massimo dutti',
      '& other stories',
      'weekday',
      'monki',
      'bershka',
      'pull&bear'
    ];

    // Normalize brand name for comparison (lowercase, remove special chars)
    const normalizedBrand = brand.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    
    // Check if brand exists in our database
    const hasData = brandsWithData.some(existingBrand => 
      existingBrand.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim() === normalizedBrand
    );

    // Simulate review count (replace with actual database query)
    const reviewCount = hasData ? Math.floor(Math.random() * 50) + 10 : 0;

    const responseData = {
      hasData,
      reviewCount: hasData ? reviewCount : 0,
      brand: brand,
      message: hasData 
        ? `Found ${reviewCount} reviews for ${brand}`
        : `No review data found for ${brand}`
    };

    return new Response(
      JSON.stringify(responseData),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': 'chrome-extension://*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Credentials': 'true',
        }
      }
    );

  } catch (error) {
    console.error('Error checking brand:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': 'chrome-extension://*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Credentials': 'true',
        }
      }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': 'chrome-extension://*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}
