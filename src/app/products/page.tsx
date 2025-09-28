import { Metadata } from 'next';
import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Products | PointFour',
  description: 'Browse all products from our curated collection of brands',
  openGraph: {
    title: 'Products | PointFour',
    description: 'Browse all products from our curated collection of brands',
    type: 'website',
  },
}

interface Product {
  id: number;
  name: string;
  url: string;
  description?: string;
  image_url?: string;
  price?: number;
  currency?: string;
  created_at: string;
  brand_id: string;
  brand: {
    slug: string;
    name: string;
    logo_url?: string;
  };
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ brand_id?: string; search?: string }>;
}) {
  const { brand_id, search } = await searchParams;
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
  if (brand_id) {
    query = query.eq('brand_id', brand_id);
  }

  // Search by name if specified
  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  const { data: products, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching products:', error);
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Products</h1>
        <p className="text-red-600">Error loading products: {error.message}</p>
        <p className="text-sm text-gray-600 mt-2">
          Make sure you have set up your Supabase credentials in .env.local
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Products</h1>
          <p className="text-gray-600">
            Discover products from our curated collection of brands
          </p>
        </div>

        {products && products.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product: Product) => (
              <Link 
                key={product.id} 
                href={`/products/${product.id}`}
                className="group block bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-200 border border-gray-200 hover:border-gray-300"
              >
                <div className="p-6">
                  {product.image_url && (
                    <div className="mb-4 aspect-square relative overflow-hidden rounded-lg">
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center mb-3">
                    {product.brand.logo_url && (
                      <Image
                        src={product.brand.logo_url}
                        alt={`${product.brand.name} logo`}
                        width={24}
                        height={24}
                        className="w-6 h-6 object-contain mr-2"
                      />
                    )}
                    <span className="text-sm text-gray-500 font-medium">
                      {product.brand.name}
                    </span>
                  </div>

                  <h2 className="text-xl font-semibold mb-2 group-hover:text-blue-600 transition-colors">
                    {product.name}
                  </h2>
                  
                  {product.description && (
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {product.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    {product.price && (
                      <span className="text-lg font-bold text-gray-900">
                        {product.currency || 'USD'} {product.price.toFixed(2)}
                      </span>
                    )}
                    <svg 
                      className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M9 5l7 7-7 7" 
                      />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No products found.</p>
            <p className="text-gray-500 text-sm mt-2">
              Products will appear here once they are added to the database.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
