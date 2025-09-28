"use client";
import React from "react";
import ReactMarkdown from "react-markdown";

interface MarkdownTextProps {
  text: string;
  className?: string;
}

// Simple React Markdown components with prose class
const markdownComponents = {
  // Use default React Markdown components with prose styling
  // The prose class will handle all the typography styling
};

export const MarkdownText: React.FC<MarkdownTextProps> = ({ 
  text, 
  className = "prose prose-sm max-w-none" 
}) => {
  if (!text || !text.trim()) {
    return <span>{text}</span>;
  }

  return (
    <div className={className}>
      <ReactMarkdown components={markdownComponents}>
        {text}
      </ReactMarkdown>
    </div>
  );
};
