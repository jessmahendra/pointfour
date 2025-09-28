"use client";
import React from "react";
import { ExternalSearchReview } from "../types/analysis";
import { getConfidenceColor, getConfidenceLabel } from "../utils/analysisParsing";

interface ReviewCardProps {
  review: ExternalSearchReview;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  return (
    <div className="bg-stone-50 p-4 rounded-lg border border-stone-200">
      <div className="flex justify-between items-start mb-2">
        <h6 className="text-sm font-semibold text-gray-800 m-0 font-inter">
          {review.title}
        </h6>
        <div className="flex gap-2 items-center">
          <span className="text-xs text-gray-600 bg-stone-200 px-2 py-1 rounded">
            {review.source}
          </span>
          <span
            className="text-xs px-2 py-1 rounded"
            style={{
              color: getConfidenceColor(review.confidence),
              backgroundColor: `${getConfidenceColor(review.confidence)}20`,
            }}
          >
            {getConfidenceLabel(review.confidence)}
          </span>
        </div>
      </div>
      <p className="text-sm text-gray-600 m-0 mb-2 leading-snug font-inter">
        {review.snippet}
      </p>
      <div className="flex gap-2 flex-wrap mb-2">
        {review.tags.slice(0, 3).map((tag: string, tagIndex: number) => (
          <span
            key={tagIndex}
            className="text-xs text-gray-600 bg-stone-200 px-2 py-1 rounded"
          >
            {tag}
          </span>
        ))}
      </div>
      <a
        href={review.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-red-600 no-underline inline-block hover:underline"
      >
        Read full review →
      </a>
    </div>
  );
};
