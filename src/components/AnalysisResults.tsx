"use client";
import React from "react";
import { AnalysisResult, UserProfile } from "../types/analysis";
import { parseAnalysisData } from "../utils/analysisParsing";
import { AnalysisHeader } from "./AnalysisHeader";
import { ContentSection } from "./ContentSection";
import { LimitedDataWarning } from "./LimitedDataWarning";
import { MarkdownText } from "./MarkdownText";
import { ReviewSection } from "./ReviewSection";
import { SectionHeader } from "./SectionHeader";

interface AnalysisResultsProps {
  analysisResult: AnalysisResult;
  userProfile: UserProfile;
  brandQuery: string;
  onShare: () => void;
  shareLoading: boolean;
}

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({
  analysisResult,
  userProfile,
  brandQuery,
  onShare,
  shareLoading,
}) => {
  const parsedData = parseAnalysisData(analysisResult);

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6 py-6">
      <AnalysisHeader
        brandQuery={brandQuery}
        userProfile={userProfile}
        onShare={onShare}
        shareLoading={shareLoading}
      />

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
