import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

export default async function BrandsPage() {
  const supabase = await createClient()
  const { data: brands, error } = await supabase
    .from('brands')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error fetching brands:', error)
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Brands</h1>
        <p className="text-red-600">Error loading brands: {error.message}</p>
        <p className="text-sm text-gray-600 mt-2">
          Make sure you have set up your Supabase credentials in .env.local
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Brands</h1>
        
        {brands && brands.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {brands.map((brand) => (
              <Link 
                key={brand.id} 
                href={`/brands/${brand.slug}`}
                className="group block bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-200 border border-gray-200 hover:border-gray-300"
              >
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-3 group-hover:text-blue-600 transition-colors">
                    {brand.name}
                  </h2>
                  {brand.description && (
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {brand.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 font-mono">
                      /brands/{brand.slug}
                    </span>
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
            <p className="text-gray-600 text-lg">No brands found.</p>
          </div>
        )}
      </div>
    </div>
  )
}
