"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRecommendations } from "@/lib/useRecommendations";
import { RecommendationDisplay } from "@/components/RecommendationDisplay";
import { ReviewSection } from "../../analyze/components/ReviewSection";
import { createClient } from "@/utils/supabase/client";

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
  const {
    analysisResult,
    loading,
    error,
    getRecommendations,
    loadCachedResult,
  } = useRecommendations();
  const [hasRun, setHasRun] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const supabase = createClient();
  const initializationRef = useRef(false);

  // Generate the LLM query using the same format as the analyze page
  const llmQuery = `${productName} from ${brandName}${
    brandUrl ? ` (${brandUrl})` : ""
  }`;

  const handleGetRecommendations = useCallback(async () => {
    setHasRun(true);
    console.log("🤖 ProductRecommendations: Using legacy API");
    await getRecommendations(llmQuery);
  }, [getRecommendations, llmQuery]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    const cacheKey = `recommendations_${
      userEmail || "anonymous"
    }_${productName}_${brandName}`;
    localStorage.removeItem(cacheKey); // Clear cache
    setHasRun(false);
    await handleGetRecommendations();
    setIsRefreshing(false);
  }, [userEmail, productName, brandName, handleGetRecommendations]);

  // Get user email on component mount
  useEffect(() => {
    const getUserEmail = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserEmail(user?.email || null);
    };
    getUserEmail();
  }, [supabase.auth]);

  // Auto-run recommendations on mount - only run once
  useEffect(() => {
    if (userEmail !== null && !initializationRef.current) {
      initializationRef.current = true;

      const runInitialization = async () => {
        const cacheKey = `recommendations_${
          userEmail || "anonymous"
        }_${productName}_${brandName}`;
        const cached = localStorage.getItem(cacheKey);

        if (cached) {
          try {
            const cachedData = JSON.parse(cached);
            // Check if cache is less than 24 hours old
            const cacheAge = Date.now() - cachedData.timestamp;
            const maxAge = 24 * 60 * 60 * 1000; // 24 hours

            if (cacheAge < maxAge) {
              console.log("🤖 ProductRecommendations: Using cached data");
              // Load cached data into the analysis result
              if (cachedData.result) {
                loadCachedResult(cachedData.result);
                setHasRun(true);
                setIsInitialized(true);
                return;
              }
            }
          } catch (error) {
            console.warn("Failed to parse cached data:", error);
            localStorage.removeItem(cacheKey);
          }
        }

        // No valid cache, run recommendations
        setHasRun(true);
        console.log("🤖 ProductRecommendations: Using legacy API");
        await getRecommendations(llmQuery);
        setIsInitialized(true);
      };

      runInitialization();
    }
  }, [
    userEmail,
    productName,
    brandName,
    brandUrl,
    loadCachedResult,
    getRecommendations,
    llmQuery,
  ]);

  // Save to cache when analysis result changes
  useEffect(() => {
    if (analysisResult && userEmail !== null && isInitialized) {
      const cacheKey = `recommendations_${
        userEmail || "anonymous"
      }_${productName}_${brandName}`;
      const cacheData = {
        result: analysisResult,
        timestamp: Date.now(),
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    }
  }, [analysisResult, userEmail, productName, brandName, isInitialized]);

  return (
    <div className="mb-8">
      {!hasRun ? (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-stone-200">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-stone-900 mb-4">
              AI Fit Recommendations
            </h2>
            <p className="text-gray-600 mb-6">
              {loading
                ? "Getting personalized fit recommendations and reviews..."
                : "Get personalized fit recommendations and reviews for this product"}
            </p>
            {loading && (
              <div className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600"
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
                <span className="text-blue-600 font-medium">
                  Getting Recommendations...
                </span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header with refresh button */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              AI Fit Recommendations
            </h2>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing || loading}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRefreshing ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-600"
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
                  Refreshing...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Refresh
                </>
              )}
            </button>
          </div>

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
