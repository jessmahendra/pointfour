"use client";
import React from "react";
import { GroupedReviews, ExternalSearchReview } from "../../../types/analysis";
import { SectionHeader } from "../../../components/SectionHeader";
import { ReviewCard } from "./ReviewCard";

interface ReviewSectionProps {
  groupedReviews: GroupedReviews;
}

export const ReviewSection: React.FC<ReviewSectionProps> = ({ groupedReviews }) => {
  return (
    <div className="mb-6">
      <SectionHeader title="Reviews & Feedback" className="mb-4" />
      
      {Object.entries(groupedReviews).map(([category, reviews]) => {
        if (reviews.length === 0) return null;
        
        return (
          <div key={category} className="mb-6">
            <h5 className="text-xs font-semibold mb-3 text-gray-600 capitalize">
              {category} Reviews ({reviews.length})
            </h5>
            <div className="flex flex-col gap-3">
              {reviews.slice(0, 3).map((review: ExternalSearchReview, index: number) => (
                <ReviewCard key={`${category}-${index}-${review.title || review.snippet?.slice(0, 20)}`} review={review} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
