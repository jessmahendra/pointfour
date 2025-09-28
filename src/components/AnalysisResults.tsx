"use client";
import React from "react";
import { AnalysisResult, UserProfile } from "../types/analysis";
import { formatMarkdownText, formatTextWithStyling } from "../utils/textFormatting";
import { parseAnalysisData, getConfidenceColor, getConfidenceLabel } from "../utils/analysisParsing";

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

  const formatRecommendation = (text: string) => {
    return (
      <div>
        {/* Limited Data Warning */}
        {parsedData.isLimitedData && (
          <div
            style={{
              backgroundColor: "#FEF3C7",
              border: "1px solid #F59E0B",
              padding: "12px 16px",
              borderRadius: "8px",
              marginBottom: "24px",
            }}
          >
            <h4
              style={{
                fontSize: "13px",
                fontWeight: "600",
                marginBottom: "4px",
                color: "#92400E",
              }}
            >
              ⚠️ Limited Data Available
            </h4>
            <p style={{ fontSize: "12px", margin: 0, color: "#92400E" }}>
              We don&apos;t have detailed sizing data for {parsedData.brandName} yet. This analysis is based on general
              fashion industry standards.
            </p>
          </div>
        )}

        {/* Personal Summary */}
        <div style={{ marginBottom: "24px" }}>
          <h4
            style={{
              fontSize: "14px",
              fontWeight: "600",
              marginBottom: "8px",
              color: "#333",
            }}
          >
            Personal Summary
          </h4>
          <div style={{ fontSize: "14px", lineHeight: "1.6" }}>
            {formatMarkdownText(text)}
          </div>
        </div>

        {/* External Search Results */}
        {analysisResult.externalSearchResults?.brandFitSummary && (
          <div style={{ marginBottom: "24px" }}>
            <h4
              style={{
                fontSize: "14px",
                fontWeight: "600",
                marginBottom: "8px",
                color: "#333",
              }}
            >
              Brand Analysis
            </h4>
            <div style={{ fontSize: "14px", lineHeight: "1.6" }}>
              {formatMarkdownText(analysisResult.externalSearchResults.brandFitSummary.summary || "")}
            </div>
          </div>
        )}

        {/* Reviews Section */}
        {analysisResult.externalSearchResults?.groupedReviews && (
          <div style={{ marginBottom: "24px" }}>
            <h4
              style={{
                fontSize: "14px",
                fontWeight: "600",
                marginBottom: "16px",
                color: "#333",
              }}
            >
              Reviews & Feedback
            </h4>
            
            {Object.entries(analysisResult.externalSearchResults.groupedReviews).map(([category, reviews]) => {
              if (reviews.length === 0) return null;
              
              return (
                <div key={category} style={{ marginBottom: "24px" }}>
                  <h5
                    style={{
                      fontSize: "13px",
                      fontWeight: "600",
                      marginBottom: "12px",
                      color: "#666",
                      textTransform: "capitalize",
                    }}
                  >
                    {category} Reviews ({reviews.length})
                  </h5>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {reviews.slice(0, 3).map((review, index) => (
                      <div
                        key={index}
                        style={{
                          backgroundColor: "#F8F7F4",
                          padding: "16px",
                          borderRadius: "8px",
                          border: "1px solid #E9DED5",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            marginBottom: "8px",
                          }}
                        >
                          <h6
                            style={{
                              fontSize: "14px",
                              fontWeight: "600",
                              color: "#333",
                              margin: "0",
                              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                            }}
                          >
                            {review.title}
                          </h6>
                          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            <span
                              style={{
                                fontSize: "11px",
                                color: "#666",
                                backgroundColor: "#E9DED5",
                                padding: "2px 6px",
                                borderRadius: "4px",
                              }}
                            >
                              {review.source}
                            </span>
                            <span
                              style={{
                                fontSize: "10px",
                                color: getConfidenceColor(review.confidence),
                                backgroundColor: `${getConfidenceColor(review.confidence)}20`,
                                padding: "2px 6px",
                                borderRadius: "4px",
                              }}
                            >
                              {getConfidenceLabel(review.confidence)}
                            </span>
                          </div>
                        </div>
                        <p
                          style={{
                            fontSize: "14px",
                            color: "#666",
                            margin: "0 0 8px 0",
                            lineHeight: "1.4",
                            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                          }}
                        >
                          {review.snippet}
                        </p>
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            flexWrap: "wrap",
                            marginBottom: "8px",
                          }}
                        >
                          {review.tags.slice(0, 3).map((tag: string, tagIndex: number) => (
                            <span
                              key={tagIndex}
                              style={{
                                fontSize: "10px",
                                color: "#666",
                                backgroundColor: "#E9DED5",
                                padding: "2px 6px",
                                borderRadius: "4px",
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <a
                          href={review.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: "12px",
                            color: "#DC2626",
                            textDecoration: "none",
                            display: "inline-block",
                          }}
                        >
                          Read full review →
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          padding: "24px",
          borderRadius: "16px",
          border: "1px solid #D8D6D5",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)",
          marginBottom: "24px",
        }}
      >
        <h2
          style={{
            fontSize: "24px",
            fontWeight: "700",
            color: "#333",
            margin: "0 0 16px 0",
          }}
        >
          Analysis for: {brandQuery}
        </h2>
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: "12px",
              backgroundColor: "#F8F7F4",
              padding: "4px 8px",
              borderRadius: "4px",
            }}
          >
            {userProfile.category}
          </span>
          <span
            style={{
              fontSize: "12px",
              backgroundColor: "#F8F7F4",
              padding: "4px 8px",
              borderRadius: "4px",
            }}
          >
            {userProfile.category === "footwear"
              ? userProfile.footType
              : userProfile.bodyShape}
          </span>
          <span
            style={{
              fontSize: "12px",
              backgroundColor: "#F8F7F4",
              padding: "4px 8px",
              borderRadius: "4px",
            }}
          >
            {userProfile.fitPreference}
          </span>
        </div>
        <button
          onClick={onShare}
          disabled={shareLoading}
          style={{
            fontSize: "14px",
            color: "#6C6A68",
            background: "none",
            border: "none",
            cursor: "pointer",
            textDecoration: "underline",
            padding: "4px 0",
          }}
        >
          {shareLoading ? "Sharing..." : "Share this analysis"}
        </button>
      </div>

      {/* Main Content */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          padding: "32px",
          borderRadius: "16px",
          border: "1px solid #D8D6D5",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)",
        }}
      >
        {formatRecommendation(analysisResult.recommendation)}
      </div>
    </div>
  );
};
