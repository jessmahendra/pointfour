import React from "react";

// Enhanced markdown formatting function for better text rendering
export const formatMarkdownText = (text: string): React.ReactElement => {
  if (!text || !text.trim()) {
    return <span>{text}</span>;
  }

  // Split the text into lines, preserving empty lines for spacing
  const lines = text.split("\n");

  return (
    <div>
      {lines.map((line, lineIndex) => {
        const trimmedLine = line.trim();

        // Handle empty lines as spacing
        if (!trimmedLine) {
          return <div key={lineIndex} style={{ marginBottom: "16px" }} />;
        }

        // Check if this line is a heading (starts with **)
        const isHeading = trimmedLine.match(/^\*\*.*?\*\*/);

        // Process bold text and quoted text
        const parts = trimmedLine.split(/(\*\*.*?\*\*|".*?")/g);
        const processedParts = parts.map((part, partIndex) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return <strong key={partIndex}>{part.slice(2, -2)}</strong>;
          }
          if (part.startsWith('"') && part.endsWith('"')) {
            return (
              <span
                key={partIndex}
                style={{
                  fontStyle: "italic",
                  backgroundColor: "#F8F7F4",
                  padding: "2px 4px",
                  borderRadius: "3px",
                }}
              >
                {part}
              </span>
            );
          }
          return <span key={partIndex}>{part}</span>;
        });

        return (
          <div
            key={lineIndex}
            style={{
              marginBottom: isHeading ? "8px" : "8px",
              marginTop: isHeading && lineIndex > 0 ? "8px" : "0px",
              lineHeight: "1.2",
            }}
          >
            {processedParts}
          </div>
        );
      })}
    </div>
  );
};

// Format bold text within paragraphs
export const formatBoldText = (text: string): React.ReactElement[] => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} style={{ fontWeight: "600" }}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
};

// Format text with bold and quoted text styling
export const formatTextWithStyling = (text: string): React.ReactElement => {
  if (!text || !text.trim()) {
    return <span>{text}</span>;
  }

  const lines = text.split("\n");

  return (
    <div>
      {lines.map((line, index) => {
        const trimmedLine = line.trim();

        if (!trimmedLine) {
          return <div key={index} style={{ marginBottom: "16px" }} />;
        }

        const formatBoldText = (text: string): React.ReactElement[] => {
          const parts = text.split(/(\*\*.*?\*\*|".*?")/g);
          return parts.map((part, i) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return (
                <strong key={i} style={{ fontWeight: "600" }}>
                  {part.slice(2, -2)}
                </strong>
              );
            }
            if (part.startsWith('"') && part.endsWith('"')) {
              return (
                <span
                  key={i}
                  style={{
                    fontStyle: "italic",
                    backgroundColor: "#F8F7F4",
                    padding: "2px 4px",
                    borderRadius: "3px",
                  }}
                >
                  {part}
                </span>
              );
            }
            return <span key={i}>{part}</span>;
          });
        };

        return (
          <p
            key={index}
            style={{
              fontSize: "14px",
              color: "#4E4B4B",
              lineHeight: "1.6",
              margin: "0 0 12px 0",
            }}
          >
            {formatBoldText(trimmedLine)}
          </p>
        );
      })}
    </div>
  );
};
