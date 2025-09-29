"use client";
import React from "react";
import ReactMarkdown from "react-markdown";

interface MarkdownTextProps {
  text: string;
  className?: string;
}

// Enhanced React Markdown components with better list styling
const markdownComponents = {
  ol: ({ children, ...props }: any) => (
    <ol className="space-y-3" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }: any) => (
    <li className="text-sm leading-relaxed" {...props}>
      {children}
    </li>
  ),
  p: ({ children, ...props }: any) => (
    <p className="text-sm leading-relaxed mb-3" {...props}>
      {children}
    </p>
  ),
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

  return (
    <div className={className}>
      <ReactMarkdown components={markdownComponents}>{text}</ReactMarkdown>
    </div>
  );
};
