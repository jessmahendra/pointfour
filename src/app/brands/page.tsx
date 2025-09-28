import { createClient } from '@/utils/supabase/server'

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
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Brands</h1>
      
      {brands && brands.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {brands.map((brand) => (
            <div key={brand.id} className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="text-xl font-semibold mb-2">{brand.name}</h2>
              {brand.description && (
                <p className="text-gray-600 mb-3">{brand.description}</p>
              )}
              {brand.website_url && (
                <a 
                  href={brand.website_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Visit Website
                </a>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-600">No brands found.</p>
      )}
    </div>
  )
}
