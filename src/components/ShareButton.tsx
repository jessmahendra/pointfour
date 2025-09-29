"use client";

import { useState, useEffect } from "react";

interface ShareButtonProps {
  url?: string;
  title?: string;
  className?: string;
}

export function ShareButton({ url, title, className = "" }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState(url || "");

  // If no URL is provided, use the current page URL
  useEffect(() => {
    if (!url && typeof window !== "undefined") {
      setShareUrl(window.location.href);
    }
  }, [url]);

  const handleShare = async () => {
    try {
      // Always try clipboard first for better UX
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      // If Web Share API is available and user is on mobile, also try to share
      if (
        navigator.share &&
        /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        )
      ) {
        try {
          await navigator.share({
            title: title || "Check out this product",
            url: shareUrl,
          });
        } catch {
          // Web Share failed, but clipboard already succeeded
          console.log("Web Share API failed, but URL was copied to clipboard");
        }
      }
    } catch (clipboardError) {
      console.error("Failed to copy to clipboard:", clipboardError);

      // Fallback: try to create a temporary text area and copy from it
      try {
        const textArea = document.createElement("textarea");
        textArea.value = shareUrl;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        const successful = document.execCommand("copy");
        document.body.removeChild(textArea);

        if (successful) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } else {
          throw new Error("execCommand failed");
        }
      } catch (fallbackError) {
        console.error("All copy methods failed:", fallbackError);
        // Show a fallback message
        alert(
          "Unable to copy link automatically. Please copy manually: " + shareUrl
        );
      }
    }
  };

  return (
    <button
      onClick={handleShare}
      className={`inline-flex items-center px-3 py-2 bg-stone-100 text-stone-700 text-sm font-medium rounded-md hover:bg-stone-200 transition-colors border border-stone-200 ${className}`}
      title="Share this product"
    >
      {copied ? (
        <>
          <svg
            className="mr-1.5 w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg
            className="mr-1.5 w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
            />
          </svg>
          Share
        </>
      )}
    </button>
  );
}
