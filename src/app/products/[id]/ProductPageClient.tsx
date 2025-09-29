"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ProductRecommendations } from "@/app/products/[id]/ProductRecommendations";
import { ShareButton } from "@/components/ShareButton";
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
  const [shareUrl, setShareUrl] = useState<string | null>(null);

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
                url={shareUrl || undefined}
                title={`${product.name} from ${product.brand.name}`}
              />
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
                <div className="text-2xl font-bold text-stone-900">
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
          onShareUrlGenerated={setShareUrl}
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
