"use client";

import { useState } from "react";
import { AnalysisResult } from "@/types/analysis";
import { MarkdownText } from "./MarkdownText";

interface RecommendationDisplayProps {
  analysisResult: AnalysisResult | null;
  loading?: boolean;
  error?: string | null;
  className?: string;
}

interface ParsedSection {
  title: string;
  content: string;
}

function parseRecommendation(text: string): {
  tldr: string | null;
  sections: ParsedSection[];
} {
  // Extract TLDR section
  const tldrMatch = text.match(/\*\*TLDR\*\*([\s\S]*?)(?=\*\*[A-Z]|$)/i);
  const tldr = tldrMatch ? tldrMatch[1].trim() : null;

  // Extract other sections
  const sectionRegex = /\*\*([^*]+)\*\*\n([\s\S]*?)(?=\n\*\*[A-Z]|$)/g;
  const sections: ParsedSection[] = [];
  let match;

  while ((match = sectionRegex.exec(text)) !== null) {
    const title = match[1].trim();
    const content = match[2].trim();

    // Skip TLDR as it's handled separately
    if (title.toLowerCase() !== 'tldr') {
      sections.push({ title, content });
    }
  }

  return { tldr, sections };
}

function CollapsibleSection({ title, content, defaultOpen = false }: {
  title: string;
  content: string;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      style={{
        border: "1px solid #E9DED5",
        borderRadius: "12px",
        marginBottom: "16px",
        overflow: "hidden",
      }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: "100%",
          padding: "16px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "#FFFFFF",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          transition: "background-color 0.2s",
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = "#F8F7F4";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = "#FFFFFF";
        }}
      >
        <h3
          style={{
            fontSize: "16px",
            fontWeight: "600",
            color: "#4E4B4B",
            margin: 0,
          }}
        >
          {title}
        </h3>
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
        >
          <path
            d="M5 7.5L10 12.5L15 7.5"
            stroke="#4E4B4B"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          style={{
            padding: "16px 20px 20px 20px",
            backgroundColor: "#FFFFFF",
            borderTop: "1px solid #F8F7F4",
          }}
        >
          <div style={{ fontSize: "14px", lineHeight: "1.6", color: "#4E4B4B" }}>
            <MarkdownText text={content} />
          </div>
        </div>
      )}
    </div>
  );
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

  const { tldr, sections } = parseRecommendation(analysisResult.recommendation);

  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
      {/* TLDR Section - Highlighted Box */}
      {tldr && (
        <div
          style={{
            backgroundColor: "#EBE6E2",
            border: "1px solid #E9DED5",
            borderRadius: "12px",
            padding: "20px",
            marginBottom: "24px",
          }}
        >
          <h2
            style={{
              fontSize: "18px",
              fontWeight: "600",
              color: "#4E4B4B",
              marginBottom: "16px",
              marginTop: 0,
            }}
          >
            At a glance
          </h2>
          <div
            style={{
              fontSize: "14px",
              lineHeight: "1.8",
              color: "#4E4B4B",
            }}
          >
            {/* Custom rendering for TLDR to make labels bold */}
            {tldr.split('\n').filter(line => line.trim()).map((line, index) => {
              // Match pattern like "- Overall recommendation: text" or "• Overall recommendation: text"
              const match = line.match(/^[-•]\s*([^:]+):\s*(.+)$/);
              if (match) {
                const [, label, content] = match;
                return (
                  <div key={index} style={{ marginBottom: "8px" }}>
                    <span style={{ fontWeight: "600" }}>• {label}:</span>{" "}
                    <span><MarkdownText text={content} /></span>
                  </div>
                );
              }
              return <div key={index} style={{ marginBottom: "8px" }}><MarkdownText text={line} /></div>;
            })}
          </div>
        </div>
      )}

      {/* Collapsible Sections */}
      {sections.length > 0 ? (
        <div>
          {sections.map((section, index) => (
            <CollapsibleSection
              key={index}
              title={section.title}
              content={section.content}
              defaultOpen={index === 0} // First section open by default
            />
          ))}
        </div>
      ) : (
        // Fallback to original display if parsing fails
        <div className="prose prose-sm max-w-none">
          <MarkdownText text={analysisResult.recommendation} />
        </div>
      )}

      {/* Review Sources */}
      {analysisResult.externalSearchResults && (
        <div
          style={{
            marginTop: "24px",
            paddingTop: "24px",
            borderTop: "1px solid #E9DED5",
          }}
        >
          <h3
            style={{
              fontSize: "14px",
              fontWeight: "600",
              color: "#6C6A68",
              marginBottom: "8px",
            }}
          >
            Review Sources
          </h3>
          <div style={{ fontSize: "13px", color: "#6C6A68" }}>
            <p style={{ margin: 0 }}>
              Found {analysisResult.externalSearchResults.totalResults} reviews
              and discussions
              {analysisResult.externalSearchResults.brandFitSummary?.sources &&
                ` from ${analysisResult.externalSearchResults.brandFitSummary.sources.length} sources`}
              .
            </p>
            {analysisResult.externalSearchResults.brandFitSummary?.sources && (
              <div style={{ marginTop: "8px" }}>
                <span style={{ fontWeight: "500" }}>Sources: </span>
                <span style={{ color: "#9CA3AF" }}>
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
