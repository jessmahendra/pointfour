"use client";
import React from "react";
import { UserProfile } from "../types/analysis";
import { ContentSection } from "./ContentSection";

interface AnalysisHeaderProps {
  brandQuery: string;
  userProfile: UserProfile;
  onShare: () => void;
  shareLoading: boolean;
}

export const AnalysisHeader: React.FC<AnalysisHeaderProps> = ({
  brandQuery,
  userProfile,
  onShare,
  shareLoading,
}) => {
  return (
    <ContentSection>
      <h2 className="text-2xl font-bold text-gray-800 m-0 mb-4">
        Analysis for: {brandQuery}
      </h2>
      <div className="flex gap-2 mb-4 flex-wrap">
        <span className="text-xs bg-stone-50 px-2 py-1 rounded">
          {userProfile.category}
        </span>
        <span className="text-xs bg-stone-50 px-2 py-1 rounded">
          {userProfile.category === "footwear"
            ? userProfile.footType
            : userProfile.bodyShape}
        </span>
        <span className="text-xs bg-stone-50 px-2 py-1 rounded">
          {userProfile.fitPreference}
        </span>
      </div>
      <button
        onClick={onShare}
        disabled={shareLoading}
        className="text-sm text-stone-600 bg-transparent border-none cursor-pointer underline py-1 hover:text-stone-800 disabled:cursor-not-allowed"
      >
        {shareLoading ? "Sharing..." : "Share this analysis"}
      </button>
    </ContentSection>
  );
};
