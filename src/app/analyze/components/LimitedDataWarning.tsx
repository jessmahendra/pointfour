"use client";
import React from "react";

interface LimitedDataWarningProps {
  brandName: string;
}

export const LimitedDataWarning: React.FC<LimitedDataWarningProps> = ({ brandName }) => {
  return (
    <div className="bg-yellow-100 border border-yellow-500 p-3 px-4 rounded-lg mb-6">
      <h4 className="text-xs font-semibold mb-1 text-yellow-800">
        ⚠️ Limited Data Available
      </h4>
      <p className="text-xs m-0 text-yellow-800">
        We don&apos;t have detailed sizing data for {brandName} yet. This analysis is based on general
        fashion industry standards.
      </p>
    </div>
  );
};
