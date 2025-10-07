"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ReviewSubmissionForm } from "@/components/ReviewSubmissionForm";
import Link from "next/link";

function ReviewPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [productData, setProductData] = useState<{
    productId: string;
    brandId: string;
    productName: string;
  } | null>(null);

  useEffect(() => {
    const productId = searchParams.get("productId");
    const brandId = searchParams.get("brandId");
    const productName = searchParams.get("productName");

    if (!productId || !brandId || !productName) {
      // Redirect to home if missing required parameters
      router.push("/");
      return;
    }

    setProductData({
      productId,
      brandId,
      productName: decodeURIComponent(productName),
    });
  }, [searchParams, router]);

  if (!productData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <Link
            href={`/products/${productData.productId}`}
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
          >
            <span>←</span> Back to product
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <ReviewSubmissionForm
            productId={productData.productId}
            brandId={productData.brandId}
            productName={productData.productName}
            onSuccess={() => {
              router.push(`/products/${productData.productId}?reviewSubmitted=true`);
            }}
            onCancel={() => {
              router.push(`/products/${productData.productId}`);
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default function ReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-gray-500">Loading...</div>
        </div>
      }
    >
      <ReviewPageContent />
    </Suspense>
  );
}
