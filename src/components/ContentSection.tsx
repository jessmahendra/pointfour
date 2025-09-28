"use client";
import React from "react";

interface ContentSectionProps {
  children: React.ReactNode;
  className?: string;
}

export const ContentSection: React.FC<ContentSectionProps> = ({ 
  children, 
  className = "bg-white p-8 rounded-2xl border border-stone-300 shadow-lg" 
}) => {
  return (
    <div className={className}>
      {children}
    </div>
  );
};
