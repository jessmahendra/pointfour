"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ProductRecommendations } from "@/app/products/[id]/ProductRecommendations";
import { SaveProfileButton } from "@/components/SaveProfileButton";

interface ProductPageClientProps {
  product: {
    id: string;
    name: string;
    url: string;
    description?: string;
    image_url?: string;
    price?: number;
    currency?: string;
    created_at: string;
    brand: {
      id: string;
      slug: string;
      name: string;
      logo_url?: string;
      description?: string;
      url?: string;
    };
  };
}

export function ProductPageClient({ product }: ProductPageClientProps) {
  const [isMakingShareable, setIsMakingShareable] = useState(false);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const shareFunctionRef = useRef<(() => Promise<void>) | null>(null);

  const handleShareClick = async () => {
    if (shareFunctionRef.current) {
      console.log("🚀 Starting shareable generation...");
      setIsMakingShareable(true);
      setCopiedToClipboard(false);

      try {
        await shareFunctionRef.current();
      } catch (error) {
        console.error("❌ Error making recommendation shareable:", error);
      } finally {
        setIsMakingShareable(false);
      }
    }
  };

  const handleShareStateChange = (
    isMakingShareable: boolean,
    copiedToClipboard: boolean
  ) => {
    setIsMakingShareable(isMakingShareable);
    setCopiedToClipboard(copiedToClipboard);
  };

  const handleShareFunctionReady = (shareFn: () => Promise<void>) => {
    shareFunctionRef.current = shareFn;
  };

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
              <button
                onClick={handleShareClick}
                disabled={isMakingShareable}
                className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  copiedToClipboard
                    ? "bg-green-100 text-green-700 border border-green-200"
                    : "bg-stone-100 text-stone-700 border border-stone-200 hover:bg-stone-200"
                }`}
                title="Share this product"
              >
                {isMakingShareable ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Sharing...
                  </>
                ) : copiedToClipboard ? (
                  <>
                    <svg
                      className="mr-1.5 w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg
                      className="mr-1.5 w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                      />
                    </svg>
                    Share
                  </>
                )}
              </button>
            </div>
          </div>
        </nav>

        {/* Product Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8 border border-stone-200">
          <div className="max-w-2xl">
            {/* Product Details */}
            <div className="space-y-2">
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
                <div className="text-sm text-stone-600">
                  {product.currency || "USD"} {product.price.toFixed(2)}
                </div>
              )}

              {/* Description */}
              {product.description && (
                <p className="text-stone-600 text-sm leading-relaxed">
                  {product.description}
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-4 mt-4">
                <a
                  href={product.url}
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

        {/* AI Recommendations */}
        <ProductRecommendations
          productName={product.name}
          brandName={product.brand.name}
          brandUrl={product.brand.url}
          productId={product.id}
          onShareClick={handleShareFunctionReady}
          onShareStateChange={handleShareStateChange}
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
