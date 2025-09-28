"use client";

import { useState } from "react";
import { useRecommendationsLLM } from "@/lib/useRecommendationsLLM";
import { RecommendationDisplay } from "@/components/RecommendationDisplay";
import { ReviewSection } from "../app/analyze/components/ReviewSection";

interface ProductRecommendationsLLMProps {
  productName: string;
  brandName: string;
  brandUrl?: string;
}

export function ProductRecommendationsLLM({ 
  productName, 
  brandName, 
  brandUrl 
}: ProductRecommendationsLLMProps) {
  const { analysisResult, loading, error, getRecommendations } = useRecommendationsLLM();
  const [hasRun, setHasRun] = useState(false);

  // Generate the LLM query using the same format as the analyze page
  const llmQuery = `${productName} from ${brandName}${brandUrl ? ` (${brandUrl})` : ''}`;

  const handleGetRecommendations = async () => {
    setHasRun(true);
    console.log('🤖 ProductRecommendationsLLM: Starting recommendation request for:', llmQuery);
    await getRecommendations(llmQuery);
  };

  return (
    <div className="mb-8">
      {!hasRun ? (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              AI Fit Recommendations (LLM Service)
            </h2>
            <p className="text-gray-600 mb-6">
              Get personalized fit recommendations using our centralized LLM service
            </p>
            <button
              onClick={handleGetRecommendations}
              disabled={loading}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Getting Recommendations...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
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
          
          {/* Show LLM interaction details if available */}
          {analysisResult?.llmInteraction && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-2">LLM Service Details</h3>
              <div className="text-xs text-blue-700 space-y-1">
                <div>Model: {analysisResult.llmInteraction.model}</div>
                <div>Duration: {analysisResult.llmInteraction.duration}ms</div>
                <div>Tokens: {analysisResult.llmInteraction.tokens?.total || 0}</div>
                <div>Time: {new Date(analysisResult.llmInteraction.timestamp).toLocaleString()}</div>
              </div>
            </div>
          )}
          
          {/* Reviews Section - Note: LLM service doesn't provide external search results */}
          {analysisResult?.externalSearchResults?.groupedReviews && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <ReviewSection
                groupedReviews={analysisResult.externalSearchResults.groupedReviews}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
