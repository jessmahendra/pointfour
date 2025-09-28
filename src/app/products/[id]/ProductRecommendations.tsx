"use client";

import { useState } from "react";
import { useRecommendations } from "@/lib/useRecommendations";
import { RecommendationDisplay } from "@/components/RecommendationDisplay";
import { ReviewSection } from "../../analyze/components/ReviewSection";

interface ProductRecommendationsProps {
  productName: string;
  brandName: string;
  brandUrl?: string;
}

export function ProductRecommendations({
  productName,
  brandName,
  brandUrl,
}: ProductRecommendationsProps) {
  // Use the legacy API (now the best one)
  const { analysisResult, loading, error, getRecommendations } =
    useRecommendations();
  const [hasRun, setHasRun] = useState(false);

  // Generate the LLM query using the same format as the analyze page
  const llmQuery = `${productName} from ${brandName}${
    brandUrl ? ` (${brandUrl})` : ""
  }`;

  const handleGetRecommendations = async () => {
    setHasRun(true);
    console.log("🤖 ProductRecommendations: Using legacy API");
    await getRecommendations(llmQuery);
  };

  return (
    <div className="mb-8">
      {!hasRun ? (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-stone-200">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-stone-900 mb-4">
              AI Fit Recommendations
            </h2>
            <p className="text-stone-600 text-base mb-6">
              Get personalized fit recommendations and reviews for this product
            </p>
            <button
              onClick={handleGetRecommendations}
              disabled={loading}
              className="inline-flex items-center px-6 py-3 bg-black text-white font-semibold rounded-lg hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                  Getting Recommendations...
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                  Get AI Recommendations
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <RecommendationDisplay
            analysisResult={analysisResult}
            loading={loading}
            error={error}
          />

          {/* Reviews Section */}
          {analysisResult?.externalSearchResults?.groupedReviews && (
            <div className="bg-white rounded-lg shadow-sm p-6 border border-stone-200">
              <ReviewSection
                groupedReviews={
                  analysisResult.externalSearchResults.groupedReviews
                }
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
