import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get('brand_id');
    const search = searchParams.get('search');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    const supabase = await createClient();
    
    let query = supabase
      .from('products')
      .select(`
        *,
        brand:brands!products_brand_id_fkey (
          slug,
          name,
          logo_url
        )
      `);

    // Filter by brand if specified
    if (brandId) {
      query = query.eq('brand_id', brandId);
    }

    // Search by name if specified
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    // Apply pagination
    if (limit) {
      query = query.limit(parseInt(limit));
    }
    if (offset) {
      const offsetNum = parseInt(offset);
      const limitNum = limit ? parseInt(limit) : 10;
      query = query.range(offsetNum, offsetNum + limitNum - 1);
    }

    // Order by creation date (newest first)
    query = query.order('created_at', { ascending: false });

    const { data: products, error } = await query;

    if (error) {
      console.error('Error fetching products:', error);
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      );
    }

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error in products API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, url, brand_id, description, image_url, price, currency } = body;

    // Validate required fields
    if (!name || !url || !brand_id) {
      return NextResponse.json(
        { error: 'Name, URL, and brand_id are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    const { data: product, error } = await supabase
      .from('products')
      .insert({
        name,
        url,
        brand_id,
        description,
        image_url,
        price,
        currency: currency || 'USD'
      })
      .select(`
        *,
        brand:brands!products_brand_id_fkey (
          slug,
          name,
          logo_url
        )
      `)
      .single();

    if (error) {
      console.error('Error creating product:', error);
      return NextResponse.json(
        { error: 'Failed to create product' },
        { status: 500 }
      );
    }

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error in products POST API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
