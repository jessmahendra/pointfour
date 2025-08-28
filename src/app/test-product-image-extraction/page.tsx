"use client";

import { useState } from "react";
import { useProductImageExtraction } from "@/lib/useProductImageExtraction";
import Image from "next/image";

export default function TestProductImageExtraction() {
  const [pageUrl, setPageUrl] = useState("");
  const [extractedImage, setExtractedImage] = useState<{
    src: string;
    alt: string;
    selector: string;
  } | null>(null);
  const [allCandidates, setAllCandidates] = useState<
    Array<{
      src: string;
      alt: string;
      selector: string;
      score: number;
    }>
  >([]);

  const { extractProductImage, loading, error } = useProductImageExtraction();

  const handleExtractImage = async () => {
    if (!pageUrl.trim()) {
      alert("Please enter a page URL");
      return;
    }

    try {
      const response = await fetch("/api/extension/extract-product-images", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pageUrl: pageUrl.trim() }),
      });

      if (!response.ok) {
        throw new Error(`Failed to extract product images: ${response.status}`);
      }

      const data = await response.json();
      setExtractedImage(data.bestImage);
      setAllCandidates(data.images || []);

      console.log("✅ Product image extracted:", data.bestImage);
      console.log("📊 All candidates:", data.images);
    } catch (err) {
      console.error("Error extracting product image:", err);
      alert(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const handleUseHook = async () => {
    if (!pageUrl.trim()) {
      alert("Please enter a page URL");
      return;
    }

    const bestImage = await extractProductImage(pageUrl.trim());
    if (bestImage) {
      setExtractedImage(bestImage);
      // In a real component, you would store this in reviewData.productImage
      console.log("Hook extracted image:", bestImage);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>Test Product Image Extraction</h1>

      <div style={{ marginBottom: "20px" }}>
        <label
          htmlFor="pageUrl"
          style={{ display: "block", marginBottom: "8px" }}
        >
          Fashion Product Page URL:
        </label>
        <input
          id="pageUrl"
          type="url"
          value={pageUrl}
          onChange={(e) => setPageUrl(e.target.value)}
          placeholder="https://example.com/product-page"
          style={{
            width: "100%",
            padding: "12px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            fontSize: "16px",
          }}
        />
      </div>

      <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
        <button
          onClick={handleExtractImage}
          disabled={loading || !pageUrl.trim()}
          style={{
            padding: "12px 24px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "16px",
          }}
        >
          {loading ? "Extracting..." : "Extract Product Image (Direct API)"}
        </button>

        <button
          onClick={handleUseHook}
          disabled={loading || !pageUrl.trim()}
          style={{
            padding: "12px 24px",
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "16px",
          }}
        >
          Extract Using Hook
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: "12px",
            backgroundColor: "#f8d7da",
            color: "#721c24",
            border: "1px solid #f5c6cb",
            borderRadius: "4px",
            marginBottom: "20px",
          }}
        >
          Error: {error}
        </div>
      )}

      {extractedImage && (
        <div style={{ marginBottom: "20px" }}>
          <h2>Best Product Image Found:</h2>
          <div
            style={{
              border: "1px solid #ddd",
              padding: "20px",
              borderRadius: "8px",
              backgroundColor: "#f8f9fa",
            }}
          >
            <Image
              src={extractedImage.src}
              alt={extractedImage.alt || "Product image"}
              width={400}
              height={400}
              style={{
                maxWidth: "100%",
                maxHeight: "400px",
                height: "auto",
                borderRadius: "4px",
                border: "1px solid #ddd",
              }}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                const placeholder = document.createElement("div");
                placeholder.style.width = "300px";
                placeholder.style.height = "300px";
                placeholder.style.backgroundColor = "#e9ecef";
                placeholder.style.borderRadius = "4px";
                placeholder.style.display = "flex";
                placeholder.style.alignItems = "center";
                placeholder.style.justifyContent = "center";
                placeholder.style.color = "#6c757d";
                placeholder.textContent = "Image failed to load";
                target.parentNode?.appendChild(placeholder);
              }}
            />
            <div style={{ marginTop: "12px" }}>
              <p>
                <strong>Source:</strong> {extractedImage.src}
              </p>
              <p>
                <strong>Alt Text:</strong> {extractedImage.alt || "None"}
              </p>
              <p>
                <strong>Selector:</strong> {extractedImage.selector}
              </p>
            </div>
          </div>
        </div>
      )}

      {allCandidates.length > 0 && (
        <div>
          <h2>All Image Candidates (Ranked by Score):</h2>
          <div style={{ maxHeight: "400px", overflowY: "auto" }}>
            {allCandidates.map((candidate, index) => (
              <div
                key={index}
                style={{
                  border: "1px solid #ddd",
                  padding: "12px",
                  marginBottom: "8px",
                  borderRadius: "4px",
                  backgroundColor: index === 0 ? "#e7f3ff" : "white",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <Image
                    src={candidate.src}
                    alt={candidate.alt || "Candidate image"}
                    width={80}
                    height={80}
                    style={{
                      width: "80px",
                      height: "80px",
                      objectFit: "cover",
                      borderRadius: "4px",
                      border: "1px solid #ddd",
                    }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <p>
                      <strong>Score:</strong> {candidate.score}
                    </p>
                    <p>
                      <strong>Source:</strong> {candidate.src}
                    </p>
                    <p>
                      <strong>Alt:</strong> {candidate.alt || "None"}
                    </p>
                    <p>
                      <strong>Selector:</strong> {candidate.selector}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        style={{
          marginTop: "40px",
          padding: "20px",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
        }}
      >
        <h3>How to Use in Your Component:</h3>
        <pre
          style={{
            backgroundColor: "#e9ecef",
            padding: "16px",
            borderRadius: "4px",
            overflow: "auto",
            fontSize: "14px",
          }}
        >
          {`import { useProductImageExtraction } from '@/lib/useProductImageExtraction';

function MyComponent() {
  const { extractProductImage, loading, error } = useProductImageExtraction();
  
  const handleExtractImage = async (pageUrl: string) => {
    const bestImage = await extractProductImage(pageUrl);
    
    if (bestImage) {
      // Store in your existing reviewData.productImage
      setReviewData(prev => ({
        ...prev,
        productImage: bestImage
      }));
    }
  };

  return (
    <button onClick={() => handleExtractImage('https://example.com/product')}>
      Extract Product Image
    </button>
  );
}`}
        </pre>
      </div>
    </div>
  );
}
