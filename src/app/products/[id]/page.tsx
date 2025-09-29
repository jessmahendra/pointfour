import { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ProductRecommendations } from "@/app/products/[id]/ProductRecommendations";
import { ShareButton } from "@/components/ShareButton";
import { SaveProfileButton } from "@/components/SaveProfileButton";

interface ProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select(
      `
      *,
      brand:brands!products_brand_id_fkey (
        slug,
        name,
        logo_url,
        description,
        url
      )
    `
    )
    .eq("id", id)
    .single();

  if (!product) {
    return {
      title: "Product Not Found | PointFour",
    };
  }

  return {
    title: `${product.name} | ${product.brand.name} | PointFour`,
    description:
      product.description ||
      `Discover ${product.name} from ${product.brand.name}`,
    openGraph: {
      title: `${product.name} | ${product.brand.name}`,
      description:
        product.description ||
        `Discover ${product.name} from ${product.brand.name}`,
      type: "website",
      images: product.image_url ? [product.image_url] : [],
    },
    alternates: {
      canonical: product.url,
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const supabase = await createClient();
  const { id } = await params;

  const { data: product, error } = await supabase
    .from("products")
    .select(
      `
      *,
      brand:brands!products_brand_id_fkey (
        slug,
        name,
        logo_url,
        description,
        url
      )
    `
    )
    .eq("id", id)
    .single();

  if (error || !product) {
    notFound();
  }

  const llmName = `${product.name} from ${product.brand.name} (${product.brand.url})`;

  console.log(llmName);
  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-stone-500">
              <Link
                href="/products"
                className="hover:text-[#928704] font-semibold"
              >
                Products
              </Link>
              <span>/</span>
              <Link
                href={`/brands/${product.brand.slug}`}
                className="hover:text-[#928704] font-semibold"
              >
                {product.brand.name}
              </Link>
              <span>/</span>
              <span className="text-stone-900">{product.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <SaveProfileButton />
              <ShareButton
                title={`${product.name} from ${product.brand.name}`}
              />
            </div>
          </div>
        </nav>

        {/* Product Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8 border border-stone-200">
          <div className="grid gap-8 md:grid-cols-2">
            {/* Product Image */}
            <div className="aspect-square relative overflow-hidden rounded-lg">
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <svg
                    className="w-16 h-16 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="space-y-6">
              {/* Brand */}
              <div className="flex items-center">
                {product.brand.logo_url && (
                  <Image
                    src={product.brand.logo_url}
                    alt={`${product.brand.name} logo`}
                    width={32}
                    height={32}
                    className="w-8 h-8 object-contain mr-3"
                  />
                )}
                <Link
                  href={`/brands/${product.brand.slug}`}
                  className="text-base text-stone-700 hover:text-[#928704] font-semibold"
                >
                  {product.brand.name}
                </Link>
              </div>

              {/* Product Name */}
              <h1 className="text-xl font-bold text-stone-900">
                {product.name}
              </h1>

              {/* Price */}
              {product.price && (
                <div className="text-2xl font-bold text-stone-900">
                  {product.currency || "USD"} {product.price.toFixed(2)}
                </div>
              )}

              {/* Description */}
              {product.description && (
                <p className="text-stone-600 text-base leading-relaxed">
                  {product.description}
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <a
                  href={product.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 bg-black text-white font-semibold rounded-lg hover:bg-stone-800 transition-colors"
                >
                  View Product
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
                <Link
                  href={`/brands/${product.brand.slug}`}
                  className="inline-flex items-center px-6 py-3 bg-stone-100 text-stone-700 font-semibold rounded-lg hover:bg-stone-200 hover:text-[#928704] transition-colors"
                >
                  More from {product.brand.name}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* AI Recommendations */}
        <ProductRecommendations
          productName={product.name}
          brandName={product.brand.name}
          brandUrl={product.brand.url}
        />

        {/* Additional Product Information */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Product Details */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-stone-200">
            <h2 className="text-xl font-semibold mb-4 text-stone-900">
              Product Details
            </h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-stone-500">Brand</dt>
                <dd className="text-sm text-stone-900">
                  <Link
                    href={`/brands/${product.brand.slug}`}
                    className="text-[#928704] hover:text-[#928704] font-semibold"
                  >
                    {product.brand.name}
                  </Link>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-stone-500">
                  Product Name
                </dt>
                <dd className="text-sm text-stone-900">{product.name}</dd>
              </div>
              {product.price && (
                <div>
                  <dt className="text-sm font-medium text-stone-500">Price</dt>
                  <dd className="text-sm text-stone-900">
                    {product.currency || "USD"} {product.price.toFixed(2)}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-stone-500">Added</dt>
                <dd className="text-sm text-stone-900">
                  {new Date(product.created_at).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>

          {/* Brand Information */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-stone-200">
            <h2 className="text-xl font-semibold mb-4 text-stone-900">
              About {product.brand.name}
            </h2>
            {product.brand.description ? (
              <p className="text-stone-600 mb-4">{product.brand.description}</p>
            ) : (
              <p className="text-stone-500 italic">No description available</p>
            )}
            {product.brand.url && (
              <a
                href={product.brand.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-[#928704] hover:text-[#928704] font-semibold"
              >
                Visit {product.brand.name} Website
                <svg
                  className="ml-1 w-4 h-4"
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
        </div>
      </div>
    </div>
  );
}
