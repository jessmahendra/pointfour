import { createClient } from "@/utils/supabase/server";
import { createStaticClient } from "@/utils/supabase/static";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";

interface BrandPageProps {
  params: Promise<{
    slug: string;
  }>;
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

// Generate metadata for individual brand pages
export async function generateMetadata({
  params,
}: BrandPageProps): Promise<Metadata> {
  const supabase = createStaticClient();
  const { slug } = await params;

  const { data: brand } = await supabase
    .from("brands")
    .select("name, description, url")
    .eq("slug", slug)
    .single();

  if (!brand) {
    return {
      title: "Brand Not Found | PointFour",
      description: "The requested brand could not be found.",
    };
  }

  const title = `${brand.name} | Fashion Brand | PointFour`;
  const description = brand.description
    ? `${brand.description} - Learn more about ${brand.name} and visit their official website.`
    : `Discover ${brand.name} - a leading fashion brand. Learn more about their products and visit their official website.`;

  return {
    title,
    description,
    keywords: `${brand.name}, fashion brand, clothing, ${brand.name} official website, fashion directory`,
    openGraph: {
      title,
      description,
      type: "website",
      url: brand.url,
      siteName: "PointFour",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: brand.url,
    },
  };
}

export default async function BrandPage({ params }: BrandPageProps) {
  const supabase = await createClient();
  const { slug } = await params;

  const { data: brand, error } = await supabase
    .from("brands")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !brand) {
    notFound();
  }

  // Fetch products for this brand
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("brand_id", brand.slug)
    .order("created_at", { ascending: false })
    .limit(6);

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <Link
            href="/brands"
            className="text-[#928704] hover:text-[#928704] font-semibold underline"
          >
            ← Back to Brands
          </Link>
        </nav>

        {/* Brand Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8 border border-stone-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-xl font-bold text-stone-900 mb-4">
                {brand.name}
              </h1>

              {brand.description && (
                <p className="text-base text-stone-600 mb-6">
                  {brand.description}
                </p>
              )}

              {brand.url && (
                <a
                  href={brand.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 bg-black text-white font-semibold rounded-lg hover:bg-stone-800 transition-colors"
                >
                  Visit Official Website
                  <svg
                    className="ml-2 w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              )}
            </div>

            {brand.logo_url && (
              <div className="ml-8">
                <Image
                  src={brand.logo_url}
                  alt={`${brand.name} logo`}
                  width={128}
                  height={128}
                  className="w-32 h-32 object-contain"
                />
              </div>
            )}
          </div>
        </div>

        {/* Products Section */}
        {products && products.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-stone-900">
                Products from {brand.name}
              </h2>
              <Link
                href={`/products?brand_id=${brand.slug}`}
                className="text-[#928704] hover:text-[#928704] font-semibold"
              >
                View all products →
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product: Product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="group block bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-200 border border-stone-200 hover:border-stone-300 p-4"
                >
                  {product.image_url && (
                    <div className="mb-3 aspect-square relative overflow-hidden rounded-lg">
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                  )}
                  <h3 className="font-semibold text-stone-900 group-hover:text-[#928704] transition-colors mb-1">
                    {product.name}
                  </h3>
                  {product.price && (
                    <p className="text-sm text-stone-600">
                      {product.currency || "USD"} {product.price.toFixed(2)}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Brand Details */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-stone-200">
            <h2 className="text-lg font-semibold mb-4">Brand Information</h2>
            <dl className="space-y-3">
              <div>
                <dt className="font-medium text-stone-900">Name</dt>
                <dd className="text-stone-600">{brand.name}</dd>
              </div>
              <div>
                <dt className="font-medium text-stone-900">Slug</dt>
                <dd className="text-stone-600 font-mono text-sm">
                  {brand.slug}
                </dd>
              </div>
              {brand.url && (
                <div>
                  <dt className="font-medium text-stone-900">Website</dt>
                  <dd className="text-stone-600">
                    <a
                      href={brand.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#928704] hover:text-[#928704] font-semibold underline"
                    >
                      {brand.url}
                    </a>
                  </dd>
                </div>
              )}
              <div>
                <dt className="font-medium text-stone-900">Created</dt>
                <dd className="text-stone-600">
                  {new Date(brand.created_at).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-stone-200">
            <h2 className="text-lg font-semibold mb-4">About {brand.name}</h2>
            {brand.description ? (
              <p className="text-stone-600 leading-relaxed">
                {brand.description}
              </p>
            ) : (
              <p className="text-stone-500 italic">
                No description available for this brand.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Generate static params for all brands (optional - for static generation)
export async function generateStaticParams() {
  const supabase = createStaticClient();

  const { data: brands } = await supabase.from("brands").select("slug");

  return (
    brands?.map((brand) => ({
      slug: brand.slug,
    })) || []
  );
}
