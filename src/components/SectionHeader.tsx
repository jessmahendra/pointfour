"use client";
import React from "react";

interface SectionHeaderProps {
  title: string;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, className = "" }) => {
  return (
    <h4 className={`text-sm font-semibold mb-2 text-gray-800 ${className}`}>
      {title}
    </h4>
  );
};
