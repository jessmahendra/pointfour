"use client";
import React from "react";
import { AnalysisResult } from "../../../types/analysis";
import { parseAnalysisData } from "../../../utils/analysisParsing";
import { ContentSection } from "../../../components/ContentSection";
import { LimitedDataWarning } from "./LimitedDataWarning";
import { MarkdownText } from "../../../components/MarkdownText";
import { ReviewSection } from "./ReviewSection";
import { SectionHeader } from "../../../components/SectionHeader";
import { User } from "@supabase/supabase-js";

interface AnalysisResultsProps {
  analysisResult: AnalysisResult;
  onShare: () => void;
  shareLoading: boolean;
  onSaveProfile: () => void;
  user: User | null;
}

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({
  analysisResult,
  onShare,
  shareLoading,
  onSaveProfile,
  user,
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
            {/* Save Profile Button */}
            <button
              onClick={onSaveProfile}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border-none rounded-lg transition-colors ${
                user
                  ? "text-white bg-gray-600 hover:bg-gray-700 cursor-pointer"
                  : "text-white bg-gray-800 hover:bg-gray-900 cursor-pointer"
              }`}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17,21 17,13 7,13 7,21" />
                <polyline points="7,3 7,8 15,8" />
              </svg>
              {user ? "Saved" : "Save Profile"}
            </button>

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
