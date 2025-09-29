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

  return (
    <div className={className}>
      <ReactMarkdown components={markdownComponents}>{text}</ReactMarkdown>
    </div>
  );
};
