import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { RecommendationDisplay } from "@/components/RecommendationDisplay";
import { ReviewSection } from "../../analyze/components/ReviewSection";

interface SharedPageProps {
  params: Promise<{
    token: string;
  }>;
}

export async function generateMetadata({
  params,
}: SharedPageProps): Promise<Metadata> {
  const { token } = await params;

  try {
    const response = await fetch(
      `${
        process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
      }/api/user-recommendations/${token}`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      return {
        title: "Shared Recommendation Not Found | PointFour",
      };
    }

    const { data } = await response.json();
    const product = data.product;

    return {
      title: `Shared Recommendation: ${product.name} | ${product.brand.name} | PointFour`,
      description: `View shared recommendations for ${product.name} from ${product.brand.name}`,
      openGraph: {
        title: `Shared Recommendation: ${product.name} | ${product.brand.name}`,
        description: `View shared recommendations for ${product.name} from ${product.brand.name}`,
        type: "website",
        images: product.image_url ? [product.image_url] : [],
      },
    };
  } catch {
    return {
      title: "Shared Recommendation | PointFour",
    };
  }
}

export default async function SharedPage({ params }: SharedPageProps) {
  const { token } = await params;

  let sharedData;
  try {
    const response = await fetch(
      `${
        process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
      }/api/user-recommendations/${token}`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      notFound();
    }

    const result = await response.json();
    sharedData = result.data;
  } catch (error) {
    console.error("Error fetching shared recommendation:", error);
    notFound();
  }

  const { recommendation, product, productQuery, createdAt } = sharedData;

  // Debug logging
  console.log("🔍 Shared page received data:", {
    hasRecommendation: !!recommendation,
    hasProduct: !!product,
    productData: product,
    productQuery,
    createdAt,
  });

  // Handle case where product data is missing
  const safeProduct = product || {
    id: "unknown",
    name: "Product",
    url: "#",
    description: "Product information not available",
    image_url: null,
    price: null,
    currency: "USD",
    brand: {
      id: 1,
      slug: "unknown",
      name: "Unknown Brand",
      logo_url: null,
      description: "Brand information not available",
      url: "#",
    },
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="text-2xl font-bold text-stone-900 hover:text-[#928704]"
            >
              pointfour
            </Link>
            <div className="text-sm text-stone-500">Shared Recommendation</div>
          </div>
        </div>

        {/* Breadcrumb */}
        <nav className="mb-6">
          <div className="flex items-center space-x-2 text-sm text-stone-500">
            <Link
              href="/products"
              className="hover:text-[#928704] font-semibold"
            >
              Products
            </Link>
            <span>/</span>
            <Link
              href={`/brands/${safeProduct.brand.slug}`}
              className="hover:text-[#928704] font-semibold"
            >
              {safeProduct.brand.name}
            </Link>
            <span>/</span>
            <span className="text-stone-900">{safeProduct.name}</span>
            <span>/</span>
            <span className="text-stone-900">Shared</span>
          </div>
        </nav>

        {/* Product Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8 border border-stone-200">
          <div className="max-w-2xl">
            {/* Product Details */}
            <div className="space-y-2">
              {/* Brand */}
              <div className="flex items-center">
                {safeProduct.brand.logo_url && (
                  <Image
                    src={safeProduct.brand.logo_url}
                    alt={`${safeProduct.brand.name} logo`}
                    width={32}
                    height={32}
                    className="w-8 h-8 object-contain mr-3"
                  />
                )}
                <Link
                  href={`/brands/${safeProduct.brand.slug}`}
                  className="text-base text-stone-700 hover:text-[#928704] font-semibold"
                >
                  {safeProduct.brand.name}
                </Link>
              </div>

              {/* Product Name */}
              <h1 className="text-xl font-bold text-stone-900">
                {safeProduct.name}
              </h1>

              {/* Price */}
              {safeProduct.price && (
                <div className="text-sm text-stone-600">
                  {safeProduct.currency || "USD"} {safeProduct.price.toFixed(2)}
                </div>
              )}

              {/* Description */}
              {safeProduct.description && (
                <p className="text-stone-600 text-sm leading-relaxed">
                  {safeProduct.description}
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-4 mt-4">
                <a
                  href={safeProduct.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 text-sm text-stone-600 hover:text-stone-800 transition-colors border border-stone-300 rounded-md hover:border-stone-400"
                >
                  View Product
                  <svg
                    className="ml-1.5 w-3.5 h-3.5"
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
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Personalized Recommendations
          </h2>

          <RecommendationDisplay
            analysisResult={recommendation}
            loading={false}
            error={null}
          />

          {/* Reviews Section */}
          {recommendation?.externalSearchResults?.groupedReviews && (
            <div className="bg-white rounded-lg shadow-sm p-6 border border-stone-200">
              <ReviewSection
                groupedReviews={
                  recommendation.externalSearchResults.groupedReviews
                }
              />
            </div>
          )}
        </div>

        {/* Call to Action */}
        <div className="mt-12 bg-white rounded-lg shadow-sm p-6 border border-stone-200">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-stone-900 mb-2">
              Get Your Own Personalized Recommendations
            </h3>
            <p className="text-stone-600 mb-4">
              Create a free account to get personalized fit recommendations for
              any product.
            </p>
            <div className="flex justify-center space-x-4">
              <Link
                href="/auth/signup"
                className="inline-flex items-center px-6 py-3 bg-[#928704] text-white font-semibold rounded-lg hover:bg-[#7a6f03] transition-colors"
              >
                Sign Up Free
              </Link>
              <Link
                href="/products"
                className="inline-flex items-center px-6 py-3 bg-stone-100 text-stone-700 font-semibold rounded-lg hover:bg-stone-200 transition-colors"
              >
                Browse Products
              </Link>
            </div>
          </div>
        </div>

        {/* Additional Product Information */}
        <div className="grid gap-6 md:grid-cols-2 mt-8">
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
                    href={`/brands/${safeProduct.brand.slug}`}
                    className="text-[#928704] hover:text-[#928704] font-semibold"
                  >
                    {safeProduct.brand.name}
                  </Link>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-stone-500">
                  Product Name
                </dt>
                <dd className="text-sm text-stone-900">{safeProduct.name}</dd>
              </div>
              {safeProduct.price && (
                <div>
                  <dt className="text-sm font-medium text-stone-500">Price</dt>
                  <dd className="text-sm text-stone-900">
                    {safeProduct.currency || "USD"}{" "}
                    {safeProduct.price.toFixed(2)}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-stone-500">Added</dt>
                <dd className="text-sm text-stone-900">
                  {new Date(
                    safeProduct.created_at || Date.now()
                  ).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>

          {/* Brand Information */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-stone-200">
            <h2 className="text-xl font-semibold mb-4 text-stone-900">
              About {safeProduct.brand.name}
            </h2>
            {safeProduct.brand.description ? (
              <p className="text-stone-600 mb-4">
                {safeProduct.brand.description}
              </p>
            ) : (
              <p className="text-stone-500 italic">No description available</p>
            )}
            {safeProduct.brand.url && (
              <a
                href={safeProduct.brand.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-[#928704] hover:text-[#928704] font-semibold"
              >
                Visit {safeProduct.brand.name} Website
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
