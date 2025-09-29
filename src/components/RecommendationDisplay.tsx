"use client";

import { AnalysisResult } from "@/types/analysis";
import { MarkdownText } from "./MarkdownText";

interface RecommendationDisplayProps {
  analysisResult: AnalysisResult | null;
  loading?: boolean;
  error?: string | null;
  className?: string;
}

export function RecommendationDisplay({
  analysisResult,
  loading = false,
  error = null,
  className = "",
}: RecommendationDisplayProps) {
  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}
      >
        <div className="flex items-center">
          <svg
            className="w-5 h-5 text-red-400 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="text-lg font-medium text-red-800">Error</h3>
        </div>
        <p className="mt-2 text-red-700">{error}</p>
      </div>
    );
  }

  if (!analysisResult) {
    return null;
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Your recommendations
        </h2>
      </div>

      <div className="prose prose-sm max-w-none">
        <MarkdownText text={analysisResult.recommendation} />
      </div>

      {analysisResult.externalSearchResults && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-3">
            Review Sources
          </h3>
          <div className="text-sm text-gray-600">
            <p>
              Found {analysisResult.externalSearchResults.totalResults} reviews
              and discussions
              {analysisResult.externalSearchResults.brandFitSummary?.sources &&
                ` from ${analysisResult.externalSearchResults.brandFitSummary.sources.length} sources`}
              .
            </p>
            {analysisResult.externalSearchResults.brandFitSummary?.sources && (
              <div className="mt-2">
                <span className="font-medium">Sources: </span>
                <span className="text-gray-500">
                  {analysisResult.externalSearchResults.brandFitSummary.sources.join(
                    ", "
                  )}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
