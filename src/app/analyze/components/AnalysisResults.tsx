"use client";
import React from "react";
import { AnalysisResult } from "../../../types/analysis";
import { parseAnalysisData } from "../../../utils/analysisParsing";
import { ContentSection } from "../../../components/ContentSection";
import { LimitedDataWarning } from "./LimitedDataWarning";
import { MarkdownText } from "../../../components/MarkdownText";
import { ReviewSection } from "./ReviewSection";
import { SectionHeader } from "../../../components/SectionHeader";
interface AnalysisResultsProps {
  analysisResult: AnalysisResult;
  onShare: () => void;
  shareLoading: boolean;
}

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({
  analysisResult,
  onShare,
  shareLoading,
}) => {
  const parsedData = parseAnalysisData(analysisResult);

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6 py-6">
      {/* Simple Header */}
      <div className="bg-white p-6 rounded-2xl border border-stone-300 shadow-lg">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800 m-0">
            Analysis Results
          </h1>
          <div className="flex gap-3">
            {/* Share Analysis Button */}
            <button
              onClick={onShare}
              disabled={shareLoading}
              className={`px-4 py-2 text-sm font-medium border-none rounded-lg transition-colors ${
                shareLoading
                  ? "text-gray-400 bg-gray-200 cursor-not-allowed"
                  : "text-white bg-red-600 hover:bg-red-700 cursor-pointer"
              }`}
            >
              {shareLoading ? "Sharing..." : "Share Analysis"}
            </button>
          </div>
        </div>
      </div>

      <ContentSection>
        {/* Limited Data Warning */}
        {parsedData.isLimitedData && (
          <LimitedDataWarning brandName={parsedData.brandName} />
        )}

        {/* Personal Summary */}
        <div className="mb-6">
          <SectionHeader title="Personal Summary" />
          <MarkdownText text={analysisResult.recommendation} />
        </div>

        {/* External Search Results */}
        {analysisResult.externalSearchResults?.brandFitSummary && (
          <div className="">
            <SectionHeader title="Brand Analysis" />
            <MarkdownText
              text={
                analysisResult.externalSearchResults.brandFitSummary.summary ||
                ""
              }
            />
          </div>
        )}
      </ContentSection>
      <ContentSection>
        {/* Reviews Section */}
        {analysisResult.externalSearchResults?.groupedReviews && (
          <ReviewSection
            groupedReviews={analysisResult.externalSearchResults.groupedReviews}
          />
        )}
      </ContentSection>
    </div>
  );
};
