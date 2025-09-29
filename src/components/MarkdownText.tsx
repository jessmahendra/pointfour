"use client";
import React from "react";
import ReactMarkdown from "react-markdown";

interface MarkdownTextProps {
  text: string;
  className?: string;
}

// Enhanced React Markdown components with better list styling
const markdownComponents = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  h3: ({ children, ...props }: any) => (
    <h3
      className="text-base font-bold text-gray-900 mt-6 mb-3 first:mt-0"
      {...props}
    >
      {children}
    </h3>
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ol: ({ children, ...props }: any) => (
    <ol className="space-y-3" {...props}>
      {children}
    </ol>
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  li: ({ children, ...props }: any) => (
    <li className="text-sm leading-relaxed" {...props}>
      {children}
    </li>
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  p: ({ children, ...props }: any) => (
    <p className="text-sm leading-relaxed mb-3" {...props}>
      {children}
    </p>
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  strong: ({ children, ...props }: any) => (
    <strong className="font-semibold text-gray-800" {...props}>
      {children}
    </strong>
  ),
};

export const MarkdownText: React.FC<MarkdownTextProps> = ({
  text,
  className = "prose prose-sm max-w-none",
}) => {
  if (!text || !text.trim()) {
    return <span>{text}</span>;
  }

  // Preprocess text to convert **Heading**: patterns to proper markdown headings
  // Special handling for Summary section - remove heading, keep content
  let processedText = text.replace(/\*\*Summary\*\*:\s*/g, "");

  // Remove any "Your Recommendations" heading that might appear in content
  processedText = processedText.replace(
    /\*\*Your Recommendations\*\*:\s*/g,
    ""
  );
  processedText = processedText.replace(/### Your Recommendations\s*/g, "");

  // Convert other headings to proper markdown format
  processedText = processedText.replace(/\*\*([^*]+)\*\*:\s*/g, "### $1\n\n");

  return (
    <div className={className}>
      <ReactMarkdown components={markdownComponents}>
        {processedText}
      </ReactMarkdown>
    </div>
  );
};
